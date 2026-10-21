import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { STATION_ALIAS_SOURCE_HASH, initializeStationAliasDocument, readStationAliasDocument } from './station-alias-document.mjs';

const sourceBytes = readSourceArchive('lore/places/Station-Alias-Candidates.json', STATION_ALIAS_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./station-alias-document.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const canonicalDbPath = new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname;
const source = JSON.parse(sourceBytes);
const expectedSourceHash = STATION_ALIAS_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact station-alias normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  station_alias_document_root: 1,
  station_alias_document_basis: 3,
  station_alias_document_group: 19,
  station_alias_document_member: 38,
  station_alias_document_alias: 2,
  station_alias_document_observation: 3,
  station_alias_document_neighbor_key: 3,
  station_alias_document_neighbor: 4,
  station_alias_document_key: 59,
};
const rejected = fn => assert.throws(fn, { code: 'E_STATION_ALIAS_DOCUMENT' });
const read = db => readStationAliasDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeStationAliasDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, exact counts, and every nested field', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 4136);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), '14b0339cb16cc88477813497d01e7dcedadb99a0a13c735f55ad8594d65f9e82');
    assert.deepEqual(initializeStationAliasDocument(db, options), {
      documents: 1, basis: 3, groups: 19, members: 38, aliases: 2, observations: 3, neighborKeys: 3, neighbors: 4, keys: 59, totalRows: 132,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(document.status, 'approved-alias-only');
    assert.equal(document.groups.filter(group => group.disposition === 'nonmerge').length, 1);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM station_alias_document_root').all();
    assert.throws(() => initializeStationAliasDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM station_alias_document_root').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
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
        const column = columns.find(name => !['document_id', 'ordinal', 'group_ordinal', 'station_ordinal'].includes(name));
        db.exec(`UPDATE ${table} SET ${column}=${column} || '-changed' WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (['document_id', 'ordinal', 'group_ordinal', 'station_ordinal'].includes(name)) return `${name}+100`;
          if (['key', 'object_path', 'station_key', 'member'].includes(name)) return `${name} || '-extra'`;
          return name;
        });
        db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
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
      db.exec(`UPDATE ${table} SET "${column.name}"=${column.type === 'INTEGER' ? '1000' : "'changed'"} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      rejected(() => read(db));
      checked += 1;
      db.exec('ROLLBACK TO corruption; RELEASE corruption');
    }
    assert.equal(checked, 38);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('unknown, missing, and reordered fields fail before any write', () => {
  const paths = [[], ['groups', 0], ['groups', 6], ['groups', 6, 'observations', 0], ['groups', 6, 'graphNeighbors'], ['groups', 7]];
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
      rejected(() => initializeStationAliasDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema").get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.groups.pop(); },
    document => { document.groups[6].aliases.pop(); },
    document => { document.groups[6].observations[0].line = 7; },
    document => { document.groups[6].graphNeighbors['총신대입구(이수)'].push('사당'); },
    document => { document.groups[6].relatedStation = null; },
    document => { document.basis.push('inferred'); },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeStationAliasDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readStationAliasDocument(db));
    rejected(() => readStationAliasDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeStationAliasDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeStationAliasDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_station_alias BEFORE INSERT ON station_alias_document_key BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_station_alias AFTER INSERT ON station_alias_document_key BEGIN UPDATE station_alias_document_root SET status='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeStationAliasDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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
  const backup = fs.mkdtempSync(new URL('../../.vitest/station-alias-coexistence-', import.meta.url).pathname);
  const copyPath = `${backup}/wiki-cast.sqlite`;
  try {
    const declared = [...canonicalSchemaSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/gi)].map(match => match[1]).sort();
    assert.equal(declared.length, 44);
    assert.equal(declared.some(name => name.startsWith('station_alias_document_')), false);
    inventory.exec(canonicalSchemaSql);
    const canonicalNames = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(canonicalNames, declared);
    initializeStationAliasDocument(inventory, options);
    const combined = inventory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(combined.filter(name => !name.startsWith('station_alias_document_')), canonicalNames);
    assert.deepEqual(combined.filter(name => name.startsWith('station_alias_document_')).sort(), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(inventory)), JSON.stringify(source));
    assert.equal(inventory.prepare('SELECT count(*) AS n FROM person').get().n, 0);

    fs.copyFileSync(canonicalDbPath, copyPath);
    const canonical = new DatabaseSync(copyPath);
    try {
      const before = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.equal(before.length, 311);
      assert.equal(before.some(name => name.startsWith('station_alias_document_')), false);
      for (const name of canonicalNames) assert.equal(before.includes(name), true, name);
      const personCount = canonical.prepare('SELECT count(*) AS n FROM person').get().n;
      assert.ok(personCount > 0);
      initializeStationAliasDocument(canonical, options);
      const after = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.deepEqual(after.filter(name => !name.startsWith('station_alias_document_')), before);
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
  const directory = fs.mkdtempSync(new URL('../../.vitest/station-alias-runtime-', import.meta.url).pathname);
  const dbPath = `${directory}/document.sqlite`;
  const db = new DatabaseSync(dbPath);
  try {
    initializeStationAliasDocument(db, options);
  } finally { db.close(); }
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { DatabaseSync } from 'node:sqlite';
    import { readStationAliasDocument, STATION_ALIAS_SOURCE_HASH } from ${JSON.stringify(new URL('./station-alias-document.mjs', import.meta.url).href)};
    const deny = () => { throw new Error('runtime source access forbidden'); };
    for (const key of ['readFileSync','readSync','openSync','createReadStream','readFile','open','readdirSync','statSync']) fs[key] = deny;
    for (const key of ['readFile','open','readdir','stat']) fsp[key] = deny;
    JSON.parse = deny;
    globalThis.fetch = deny;
    const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
    const guarded = { prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /archive|source_file|json_/i); return db.prepare(sql); }, exec: deny };
    const document = readStationAliasDocument(guarded, { expectedSourceHash: STATION_ALIAS_SOURCE_HASH });
    assert.equal(document.groups.length, 19);
    assert.equal(document.groups[6].graphNeighbors['총신대입구(이수)'].length, 0);
    console.log('STATION_ALIAS_RUNTIME_EXACT');
    db.close();
  `], { encoding: 'utf8', timeout: 30000 });
  fs.rmSync(directory, { recursive: true, force: true });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /STATION_ALIAS_RUNTIME_EXACT/u);
});
