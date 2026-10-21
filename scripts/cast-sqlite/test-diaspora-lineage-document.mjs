import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { DIASPORA_LINEAGE_DOCUMENT_HASH, DIASPORA_LINEAGE_SOURCE_HASH, initializeDiasporaLineageDocument, readDiasporaLineageDocument } from './diaspora-lineage-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/diaspora-family-lineages.json', DIASPORA_LINEAGE_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./diaspora-lineage-document.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = DIASPORA_LINEAGE_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact lineage normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  diaspora_lineage_document: 1,
  diaspora_lineage_document_lineage: 2,
  diaspora_lineage_member: 8,
  diaspora_lineage_parent_key: 8,
  diaspora_lineage_parent_role: 8,
  diaspora_lineage_event: 16,
  diaspora_lineage_key_order: 178,
};
const rejected = fn => assert.throws(fn, { code: 'E_DIASPORA_LINEAGE_DOCUMENT' });
const read = db => readDiasporaLineageDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeDiasporaLineageDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization and exact typed denominators', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 20211);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), DIASPORA_LINEAGE_DOCUMENT_HASH);
    assert.deepEqual(initializeDiasporaLineageDocument(db, options), { documents: 1, lineages: 2, members: 8, parentKeys: 8, parentRoles: 8, events: 16, keyOrders: 178, totalRows: 221 });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(read(db).sourceKind, 'original-fiction');
    assert.deepEqual(read(db).generationIntervalExceptions, []);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM diaspora_lineage_document').all();
    assert.throws(() => initializeDiasporaLineageDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM diaspora_lineage_document').all(), before);
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
        const column = columns.find(name => !['document_id', 'ordinal', 'lineage_ordinal', 'member_ordinal'].includes(name)) ?? columns[0];
        const info = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const quoted = column === 'year' ? '"year"' : column;
        const expression = info.type === 'INTEGER' ? `${quoted}+1` : `${quoted} || '-changed'`;
        db.exec(`UPDATE ${table} SET ${quoted}=${expression} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const shifted = new Set(['document_id', 'ordinal', 'lineage_ordinal', 'member_ordinal']);
        const suffixed = new Set(['lineage_key', 'member_key', 'parent_key', 'object_key', 'object_pointer']);
        const values = columns.map(name => shifted.has(name) ? name + '+100' : suffixed.has(name) ? name + " || '-extra'" : name);
        db.exec('INSERT INTO ' + table + ' SELECT ' + values.join(',') + ' FROM ' + table + ' LIMIT 1');
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('wrong hash, unknown field, missing field and reordered field are rejected before writes', () => {
  const targets = [[], ['lineages', 0], ['lineages', 0, 'members', 0], ['lineages', 0, 'members', 0, 'name'], ['lineages', 0, 'members', 0, 'events', 0], ['lineages', 0, 'members', 3], ['lineages', 0, 'members', 3, 'parentRoles']];
  for (const path of targets) for (const mode of ['unknown', 'missing', 'order']) {
    const changed = structuredClone(source);
    const target = path.reduce((value, key) => value[key], changed);
    if (mode === 'unknown') target.unexpected = 'not authored';
    if (mode === 'missing') delete target[Object.keys(target)[0]];
    if (mode === 'order') { const key = Object.keys(target)[0]; const value = target[key]; delete target[key]; target[key] = value; }
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeDiasporaLineageDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare(`SELECT count(*) AS n FROM sqlite_schema`).get().n, 0);
    } finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readDiasporaLineageDocument(db));
    rejected(() => readDiasporaLineageDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [{ expectedSourceHash: '0'.repeat(64) }, { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }, { actor: '' }, { reason: ' ' }, { schemaSql: '' }, { sourceBytes: 'not bytes' }]) {
      rejected(() => initializeDiasporaLineageDocument(db, { ...options, ...overrides }));
    }
    db.exec('BEGIN');
    rejected(() => initializeDiasporaLineageDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    `CREATE TRIGGER fail_diaspora BEFORE INSERT ON diaspora_lineage_event BEGIN SELECT RAISE(ABORT,'forced insertion'); END;`,
    `CREATE TRIGGER corrupt_diaspora AFTER INSERT ON diaspora_lineage_event BEGIN UPDATE diaspora_lineage_document SET schema='corrupt'; END;`,
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(`CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')`);
      assert.throws(() => initializeDiasporaLineageDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare(`SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'`).all().map(row => row.name), ['unrelated']);
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

test('canonical diaspora_lineage sentinel survives document initialization', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE diaspora_lineage (
      lineage_key TEXT PRIMARY KEY,
      current_person_id TEXT NOT NULL,
      sentinel TEXT NOT NULL
    ) STRICT;
    INSERT INTO diaspora_lineage VALUES ('canonical-sentinel', 'P-SENTINEL', 'untouched')`);
    const before = db.prepare('SELECT * FROM diaspora_lineage ORDER BY lineage_key').all();
    assert.deepEqual(initializeDiasporaLineageDocument(db, options), { documents: 1, lineages: 2, members: 8, parentKeys: 8, parentRoles: 8, events: 16, keyOrders: 178, totalRows: 221 });
    assert.deepEqual(db.prepare('SELECT * FROM diaspora_lineage ORDER BY lineage_key').all(), before);
    assert.equal(db.prepare('SELECT count(*) AS n FROM diaspora_lineage').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM diaspora_lineage_document_lineage').get().n, 2);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});
