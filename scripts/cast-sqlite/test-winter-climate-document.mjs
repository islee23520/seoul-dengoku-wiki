import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  WINTER_CLIMATE_LOGICAL_PATH, WINTER_CLIMATE_SOURCE_HASH,
  initializeWinterClimateDocument, readWinterClimateDocument,
} from './winter-climate-document.mjs';

const sourceBytes = readSourceArchive(WINTER_CLIMATE_LOGICAL_PATH, WINTER_CLIMATE_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./winter-climate-document.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const canonicalDbPath = new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname;
const source = JSON.parse(sourceBytes);
const expectedSourceHash = WINTER_CLIMATE_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact winter-climate normalization without approval' };
const sources = { [WINTER_CLIMATE_LOGICAL_PATH]: { bytes: sourceBytes, expectedSourceHash } };
const multiple = { schemaSql, sources, actor: options.actor, reason: options.reason };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const documentHash = '0e65a77c8ee9920183d309a5be6b90f9477f17dd4fe50f17f2d63d3bdcdd1e74';
const counts = {
  winter_climate_document_import: 1,
  winter_climate_document_root: 1,
  winter_climate_document_application: 1,
  winter_climate_document_bound: 4,
  winter_climate_document_record: 17,
  winter_climate_document_key: 235,
};
const rejected = fn => assert.throws(fn, { code: 'E_WINTER_CLIMATE_DOCUMENT' });
const read = db => readWinterClimateDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeWinterClimateDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, exact counts, and every nested field', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 10312);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), documentHash);
    assert.deepEqual(initializeWinterClimateDocument(db, options), {
      documents: 1, applications: 1, bounds: 4, records: 17, keys: 235,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.deepEqual(Object.keys(document), Object.keys(source));
    assert.deepEqual(Object.keys(document.application), Object.keys(source.application));
    assert.deepEqual(document.records.map(record => Object.keys(record)), source.records.map(record => Object.keys(record)));
    assert.equal(document.records.length, 17);
    assert.equal(document.application.intermediate_underground_c.join(','), '8,18');
    assert.equal(document.application.deep_underground_c.join(','), '18,22');
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM winter_climate_document_root').all();
    rejected(() => initializeWinterClimateDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM winter_climate_document_root').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('multiple-source API requires the exact path map and reads one logical path', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeWinterClimateDocument(db, multiple), {
      documents: 1, applications: 1, bounds: 4, records: 17, keys: 235,
    });
    const document = readWinterClimateDocument(db, { logicalPath: WINTER_CLIMATE_LOGICAL_PATH, expectedSourceHash });
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    rejected(() => readWinterClimateDocument(db, { logicalPath: 'lore/places/sources/other.json', expectedSourceHash }));
    rejected(() => initializeWinterClimateDocument(db, { ...multiple, sources: {} }));
    rejected(() => initializeWinterClimateDocument(new DatabaseSync(':memory:'), {
      ...multiple, sources: { ...sources, 'lore/places/sources/extra.json': sources[WINTER_CLIMATE_LOGICAL_PATH] },
    }));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) for (const mode of ['missing', 'changed', 'extra']) {
  test(`${table}: ${mode} row is rejected`, () => {
    const db = fresh();
    try {
      db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
      const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
      if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      if (mode === 'changed') {
        const column = columns.find(name => !['logical_path', 'ordinal'].includes(name));
        const info = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const value = info.type === 'INTEGER' || info.type === 'REAL' ? '1000' : `${column} || '-changed'`;
        db.exec(`UPDATE ${table} SET "${column}"=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (name === 'logical_path') return `'${WINTER_CLIMATE_LOGICAL_PATH}-extra'`;
          if (name === 'ordinal') return 'ordinal+100';
          if (name === 'object_path') return `object_path || '-extra'`;
          if (name === 'key' || name === 'bound_name') return `${name} || '-extra'`;
          return name;
        });
        db.exec(`INSERT INTO ${table} (${columns.map(name => `"${name}"`).join(',')}) SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('every typed column and key-order cell detects corruption', () => {
  const db = fresh();
  let checked = 0;
  try {
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
      db.exec('SAVEPOINT corruption');
      const numeric = column.type === 'INTEGER' || column.type === 'REAL';
      const value = numeric ? '1000' : "'changed'";
      const lengthChecked = !numeric && ['source_sha256', 'document_sha256', 'receipt_sha256'].includes(column.name);
      db.exec(`UPDATE ${table} SET "${column.name}"=${lengthChecked ? "'" + 'f'.repeat(64) + "'" : value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      rejected(() => read(db));
      checked += 1;
      db.exec('ROLLBACK TO corruption; RELEASE corruption');
    }
    assert.equal(checked, 41);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('unknown, missing, reordered, and wrong-hash fields fail before any write', () => {
  const paths = [[], ['application'], ['records', 0], ['records', 16]];
  for (const path of paths) for (const mode of ['unknown', 'missing', 'order']) {
    const changed = structuredClone(source);
    const target = path.reduce((value, key) => value[key], changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') {
      const key = Object.keys(target)[0];
      const value = target[key];
      delete target[key];
      target[key] = value;
    }
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeWinterClimateDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.records.pop(); },
    document => { document.application.intermediate_underground_c.pop(); },
    document => { document.records[0].minimum_c = null; },
    document => { document.records[0].station_id = 108.5; },
    document => { document.application = []; },
    document => { document.version = '1'; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeWinterClimateDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readWinterClimateDocument(db));
    rejected(() => readWinterClimateDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeWinterClimateDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeWinterClimateDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_winter_climate BEFORE INSERT ON winter_climate_document_key BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_winter_climate AFTER INSERT ON winter_climate_document_key BEGIN UPDATE winter_climate_document_root SET kind='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeWinterClimateDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime is SELECT-only with filesystem, archive, fetch, and JSON.parse denied', () => {
  const db = fresh();
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object, key) => {
    const original = object[key];
    object[key] = blocked;
    restores.push(() => { object[key] = original; });
  };
  try {
    db.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse');
    replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /archive|source_file|json_/i);
        return db.prepare(sql);
      },
      exec: blocked,
    };
    assert.equal(JSON.stringify(read(guarded)), JSON.stringify(source));
  } finally {
    restores.reverse().forEach(restore => restore());
    db.close();
  }
});

test('new tables coexist with the canonical schema inventory and the canonical database backup', () => {
  const inventory = new DatabaseSync(':memory:');
  const backup = fs.mkdtempSync(new URL('../../.vitest/winter-climate-coexistence-', import.meta.url).pathname);
  const copyPath = `${backup}/wiki-cast.sqlite`;
  try {
    const declared = [...canonicalSchemaSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/gi)].map(match => match[1]).sort();
    assert.equal(declared.length, 44);
    assert.equal(declared.some(name => name.startsWith('winter_climate_document_')), false);
    inventory.exec(canonicalSchemaSql);
    const canonicalNames = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(canonicalNames, declared);
    initializeWinterClimateDocument(inventory, options);
    const combined = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(combined.filter(name => !name.startsWith('winter_climate_document_')), canonicalNames);
    assert.deepEqual(combined.filter(name => name.startsWith('winter_climate_document_')).sort(), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(inventory)), JSON.stringify(source));
    assert.equal(inventory.prepare('SELECT count(*) AS n FROM person').get().n, 0);

    fs.copyFileSync(canonicalDbPath, copyPath);
    const canonical = new DatabaseSync(copyPath);
    try {
      const before = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.equal(before.length, 311);
      assert.equal(before.some(name => name.startsWith('winter_climate_document_')), false);
      for (const name of canonicalNames) assert.equal(before.includes(name), true, name);
      const personCount = canonical.prepare('SELECT count(*) AS n FROM person').get().n;
      assert.ok(personCount > 0);
      initializeWinterClimateDocument(canonical, options);
      const after = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.deepEqual(after.filter(name => !name.startsWith('winter_climate_document_')), before);
      assert.equal(canonical.prepare('SELECT count(*) AS n FROM person').get().n, personCount);
      assert.equal(JSON.stringify(read(canonical)), JSON.stringify(source));
      assert.equal(canonical.prepare('PRAGMA foreign_key_check').all().length, 0);
    } finally { canonical.close(); }
  } finally {
    inventory.close();
    fs.rmSync(backup, { recursive: true, force: true });
  }
});

test('a fresh process reconstructs the pinned document with runtime filesystem and JSON.parse denied', () => {
  const directory = fs.mkdtempSync(new URL('../../.vitest/winter-climate-runtime-', import.meta.url).pathname);
  const dbPath = `${directory}/document.sqlite`;
  const db = new DatabaseSync(dbPath);
  try { initializeWinterClimateDocument(db, options); }
  finally { db.close(); }
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { DatabaseSync } from 'node:sqlite';
    import { readWinterClimateDocument, WINTER_CLIMATE_SOURCE_HASH, WINTER_CLIMATE_LOGICAL_PATH } from ${JSON.stringify(new URL('./winter-climate-document.mjs', import.meta.url).href)};
    const deny = () => { throw new Error('runtime source access forbidden'); };
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open','readdirSync','statSync']) fs[key] = deny;
    for (const key of ['readFile','open','readdir','stat']) fsp[key] = deny;
    JSON.parse = deny;
    globalThis.fetch = deny;
    const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
    const guarded = { prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /archive|source_file|json_/i); return db.prepare(sql); }, exec: deny };
    const document = readWinterClimateDocument(guarded, { logicalPath: WINTER_CLIMATE_LOGICAL_PATH, expectedSourceHash: WINTER_CLIMATE_SOURCE_HASH });
    assert.equal(document.records.length, 17);
    assert.equal(document.records[0].minimum_c, -18.6);
    assert.deepEqual(document.application.deep_underground_c, [18, 22]);
    console.log('WINTER_CLIMATE_RUNTIME_EXACT');
    db.close();
  `], { encoding: 'utf8', timeout: 30000 });
  fs.rmSync(directory, { recursive: true, force: true });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /WINTER_CLIMATE_RUNTIME_EXACT/u);
});
