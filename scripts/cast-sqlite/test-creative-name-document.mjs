import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { CREATIVE_NAME_DOCUMENT_HASH, CREATIVE_NAME_SOURCE_HASH, initializeCreativeNameDocument, readCreativeNameDocument } from './creative-name-document.mjs';

const sourceBytes = fs.readFileSync(new URL('../../snapshots/build-inputs/creative-name-normalization.json', import.meta.url));
const schemaSql = fs.readFileSync(new URL('./creative-name-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = CREATIVE_NAME_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact creative-name normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  creative_name_document_root: 1,
  creative_name_document_precedence: 3,
  creative_name_document_preservation: 8,
  creative_name_document_reference: 3,
  creative_name_document_replacement: 39,
  creative_name_document_pattern: 29,
  creative_name_document_retained: 4,
  creative_name_document_key: 380,
};
const rejected = fn => assert.throws(fn, { code: 'E_CREATIVE_NAME_DOCUMENT' });
const read = db => readCreativeNameDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeCreativeNameDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, all 467 typed rows and exact absent fields', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 13158);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), CREATIVE_NAME_DOCUMENT_HASH);
    assert.deepEqual(initializeCreativeNameDocument(db, options), {
      documents: 1, precedence: 3, sourcePreservation: 8, references: 3, replacements: 39, patternReplacements: 29, retained: 4, totalRows: 467,
    });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT count(*) AS n FROM creative_name_document_reference WHERE url_present = 0').get().n, 2);
    assert.equal(db.prepare('SELECT count(*) AS n FROM creative_name_document_reference WHERE path_present = 0').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM creative_name_document_pattern WHERE id_present = 0').get().n, 11);
    assert.equal(db.prepare('SELECT count(*) AS n FROM creative_name_document_pattern WHERE old_present = 0').get().n, 9);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM creative_name_document_root').all();
    assert.throws(() => initializeCreativeNameDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM creative_name_document_root').all(), before);
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
        const column = columns.find(name => !['document_id', 'ordinal'].includes(name));
        const declared = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const replacement = declared.type === 'INTEGER' ? '1000' : `${column} || '-changed'`;
        db.exec(`UPDATE ${table} SET ${column}=${replacement} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (name === 'document_id' || name === 'ordinal') return '1000000';
          if (name === 'object_path' || name === 'key') return `${name} || '-extra'`;
          return name;
        });
        db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('wrong hash, unknown field, missing field and reordered keys are rejected before writes', () => {
  const patternWithId = source.pattern_replacements.findIndex(item => Object.hasOwn(item, 'id') && Object.hasOwn(item, 'old'));
  const targets = [
    [],
    ['references', 0],
    ['replacements', 0],
    ['pattern_replacements', patternWithId],
    ['retained', 0],
  ];
  for (const path of targets) for (const mode of ['unknown', 'missing', 'order']) {
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
      rejected(() => initializeCreativeNameDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.scope += 'changed'; },
    document => { document.precedence.push('invented rank'); },
    document => { document.replacements[0].old = ''; },
    document => { document.pattern_replacements[patternWithId].id = null; },
    document => { delete document.retained[0].anchor; },
    document => { document.references[0].url = 1; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeCreativeNameDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readCreativeNameDocument(db));
    rejected(() => readCreativeNameDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeCreativeNameDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeCreativeNameDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_creative_name BEFORE INSERT ON creative_name_document_retained BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_creative_name AFTER INSERT ON creative_name_document_retained BEGIN UPDATE creative_name_document_root SET scope='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeCreativeNameDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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

test('creative-name tables coexist with the canonical schema', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(canonicalSql);
    const before = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.ok(before.length > 0);
    assert.equal(before.some(name => name.startsWith('creative_name_document_')), false);
    initializeCreativeNameDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('creative_name_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('creative_name_document_')), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { db.close(); }
});
