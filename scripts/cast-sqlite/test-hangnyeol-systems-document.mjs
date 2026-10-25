import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  HANGNYEOL_SYSTEMS_DOCUMENT_HASH,
  HANGNYEOL_SYSTEMS_SOURCE_HASH,
  initializeHangnyeolSystemsDocument,
  readHangnyeolSystemsDocument,
} from './hangnyeol-systems-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/hangnyeol-systems.json', HANGNYEOL_SYSTEMS_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./hangnyeol-systems-document.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = HANGNYEOL_SYSTEMS_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact systems normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  hangnyeol_systems_document: 1,
  hangnyeol_systems_source: 17,
  hangnyeol_systems_system: 9,
  hangnyeol_systems_sequence: 40,
  hangnyeol_systems_position: 2,
  hangnyeol_systems_system_source: 17,
};
const rejected = fn => assert.throws(fn, { code: 'E_HANGNYEOL_SYSTEMS_DOCUMENT' });
const read = db => readHangnyeolSystemsDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeHangnyeolSystemsDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, exact denominators and every authored field', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 13515);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), HANGNYEOL_SYSTEMS_DOCUMENT_HASH);
    assert.deepEqual(initializeHangnyeolSystemsDocument(db, options), {
      documents: 1, sources: 17, systems: 9, sequenceTokens: 40, positions: 2, systemSources: 17, totalRows: 86,
    });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT count(*) AS n FROM hangnyeol_systems_source WHERE record_id_present=1').get().n, 16);
    assert.equal(db.prepare('SELECT count(*) AS n FROM hangnyeol_systems_source WHERE live_check_ref_present=1').get().n, 16);
    assert.equal(db.prepare('SELECT count(*) AS n FROM hangnyeol_systems_source WHERE unchecked_reason_present=1').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM hangnyeol_systems_system WHERE sequence_present=1').get().n, 5);
    assert.equal(db.prepare('SELECT count(*) AS n FROM hangnyeol_systems_system WHERE positions_present=1').get().n, 1);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM hangnyeol_systems_document').all();
    assert.throws(() => initializeHangnyeolSystemsDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM hangnyeol_systems_document').all(), before);
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
        const column = columns.find(name => !['document_id', 'ordinal', 'system_ordinal'].includes(name) && !name.endsWith('_present'));
        db.exec(`UPDATE ${table} SET ${column}=${column} || '-changed' WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (['document_id', 'ordinal', 'system_ordinal'].includes(name)) return `${name}+100`;
          if (name === 'id' || name === 'source_id') return `${name} || '-extra'`;
          return name;
        });
        db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('every typed column, presence flag, order key and provenance is verified', () => {
  const db = fresh();
  let checked = 0;
  try {
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
      db.exec('SAVEPOINT corruption');
      db.exec(`UPDATE ${table} SET ${column.name}=${column.type === 'INTEGER' ? '1000' : "'changed'"} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      rejected(() => read(db));
      checked++;
      db.exec('ROLLBACK TO corruption; RELEASE corruption');
    }
    assert.equal(checked, 40);
  } finally { db.close(); }
});

test('unknown, missing and reordered fields and the wrong source hash fail before writes', () => {
  const targets = [[], ['sources', 0], ['sources', 6], ['systems', 0], ['systems', 5], ['systems', 6]];
  for (const path of targets) for (const mode of ['unknown', 'missing', 'order']) {
    const changed = structuredClone(source);
    const target = path.reduce((value, key) => value[key], changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') { const key = Object.keys(target)[0]; const value = target[key]; delete target[key]; target[key] = value; }
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeHangnyeolSystemsDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.sources.pop(); },
    document => { document.systems.pop(); },
    document => { document.systems[0].sequence.reverse(); },
    document => { document.systems[5].positions.reverse(); },
    document => { document.systems[0].sources.reverse(); },
    document => { document.sources[6].record_id = 'not authored'; },
    document => { document.sources[0].unchecked_reason = 'not authored'; },
    document => { document.systems[6].sequence = ['水']; document.systems[6].carrier = 'character'; },
    document => { document.schema = '1'; },
    document => { document.note += 'changed'; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeHangnyeolSystemsDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readHangnyeolSystemsDocument(db));
    rejected(() => readHangnyeolSystemsDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' }, { reason: ' ' }, { schemaSql: '' }, { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeHangnyeolSystemsDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeHangnyeolSystemsDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_systems BEFORE INSERT ON hangnyeol_systems_system_source BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_systems AFTER INSERT ON hangnyeol_systems_system_source BEGIN UPDATE hangnyeol_systems_document SET note='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeHangnyeolSystemsDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime is SELECT-only with filesystem, archive, fetch and JSON.parse access blocked', () => {
  const db = fresh();
  const restores = [];
  const blocked = () => { throw new Error('runtime source access forbidden'); };
  const replace = (object, key) => { const original = object[key]; object[key] = blocked; restores.push(() => { object[key] = original; }); };
  try {
    db.exec('PRAGMA query_only=ON');
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse');
    replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /archive|source_file|json_/i); return db.prepare(sql); },
      exec: blocked,
    };
    assert.equal(JSON.stringify(read(guarded)), JSON.stringify(source));
  } finally { restores.reverse().forEach(restore => restore()); db.close(); }
});
