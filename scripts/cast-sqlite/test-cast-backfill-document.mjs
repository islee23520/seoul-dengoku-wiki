import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import { CAST_BACKFILL_DOCUMENT_HASH, CAST_BACKFILL_SOURCE_HASH, initializeCastBackfillDocument, readCastBackfillDocument } from './cast-backfill-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/cast-backfill-draft.json', CAST_BACKFILL_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./cast-backfill-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = CAST_BACKFILL_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact cast-backfill draft without biography, mechanics, or approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  cast_backfill_document_import: 1,
  cast_backfill_document_root: 1,
  cast_backfill_document_person: 422,
  cast_backfill_document_key: 25113,
};
const prose = ['성격', '개인 야망', '공포', '통치 방식', '핵심 관계', '촉발 사건', '플레이어 개입'];
const derived = ['출신 공동체', '언어', '생업', '징집 이력', '무장 접근'];
const rejected = fn => assert.throws(fn, { code: 'E_CAST_BACKFILL_DOCUMENT' });
const read = db => readCastBackfillDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeCastBackfillDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, all 25537 typed rows and exact absent fields', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 1232428);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), CAST_BACKFILL_DOCUMENT_HASH);
    assert.notEqual(expectedSourceHash, CAST_BACKFILL_DOCUMENT_HASH);
    assert.equal(schemaSql.includes('cast_backfill_document_field'), false);
    assert.deepEqual(initializeCastBackfillDocument(db, options), {
      documents: 1, people: 422, fields: 6260, keys: 25113, totalRows: 25537,
    });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name = 'cast_backfill_document_field'").get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM cast_backfill_document_person WHERE ordinal IN (84, 142, 167, 192, 243, 269, 320, 346, 396, 421)').get().n, 10);
    const absent = prose.map(name => `"${name}_value" IS NULL`).join(' AND ');
    const present = prose.map(name => `"${name}_value" IS NOT NULL AND "${name}_derived" = 0 AND "${name}_rule_present" = 0 AND "${name}_rule" IS NULL`).join(' AND ');
    assert.equal(db.prepare(`SELECT count(*) AS n FROM cast_backfill_document_person WHERE ${absent}`).get().n, 10);
    assert.equal(db.prepare(`SELECT count(*) AS n FROM cast_backfill_document_person WHERE ${present}`).get().n, 412);
    const derivedPresent = derived.map(name => `"${name}_derived" = 1 AND "${name}_rule_present" = 1 AND length("${name}_rule") > 0`).join(' AND ');
    assert.equal(db.prepare(`SELECT count(*) AS n FROM cast_backfill_document_person WHERE ${derivedPresent}`).get().n, 422);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM cast_backfill_document_root').all();
    assert.throws(() => initializeCastBackfillDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM cast_backfill_document_root').all(), before);
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
        const column = columns.find(name => !['document_id', 'ordinal', 'person_ordinal', 'field_ordinal'].includes(name));
        const declared = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const quoted = `"${column}"`;
        const replacement = declared.type === 'INTEGER' ? '1000' : `${quoted} || '-changed'`;
        db.exec(`UPDATE ${table} SET ${quoted}=${replacement} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (['document_id', 'ordinal'].includes(name)) return '1000000';
          if (name === 'object_path' || name === 'key') return `"${name}" || '-extra'`;
          if (name.endsWith('_rule') || name.endsWith('_value') || name.endsWith('_derived') || name.endsWith('_rule_present')) return `"${name}"`;
          return `"${name}"`;
        });
        db.exec(`INSERT INTO ${table} (${columns.map(name => `"${name}"`).join(',')}) SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('wrong hash, unknown field, missing field and reordered keys are rejected before writes', () => {
  const targets = [
    [],
    ['people', 0],
    ['people', 0, 'fields'],
    ['people', 0, 'fields', '성명'],
    ['people', 84, 'fields', '출신 공동체'],
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
      rejected(() => initializeCastBackfillDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.generated += 'changed'; },
    document => { document.count += 1; },
    document => { document.people.push(structuredClone(document.people[0])); },
    document => { document.people[0]['성명'] = ''; },
    document => { document.people[84].fields['성격'] = { value: 'invented', derived: false }; },
    document => { document.people[0].fields['성격'].rule = 'invented'; },
    document => { document.people[0].fields['출신 공동체'].derived = false; },
    document => { delete document.people[0].fields['무장 접근'].rule; },
    document => { document.people[0].fields['언어'].value = null; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeCastBackfillDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readCastBackfillDocument(db));
    rejected(() => readCastBackfillDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeCastBackfillDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeCastBackfillDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('changing typed content and its stored digest cannot replace the independent document pin', () => {
  const db = fresh();
  try {
    const changed = structuredClone(source);
    changed.people[0]['직위'] += ' changed';
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    db.prepare('UPDATE cast_backfill_document_person SET "직위"=?, "직위_value"=? WHERE ordinal=0').run(changed.people[0]['직위'], changed.people[0]['직위']);
    db.prepare('UPDATE cast_backfill_document_import SET document_sha256=?, row_sha256=?').run(hash(JSON.stringify(changed)), 'a'.repeat(64));
    assert.equal(db.prepare('SELECT source_sha256 FROM cast_backfill_document_import').get().source_sha256, expectedSourceHash);
    rejected(() => read(db));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_cast_backfill BEFORE INSERT ON cast_backfill_document_key BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_cast_backfill AFTER INSERT ON cast_backfill_document_key BEGIN UPDATE cast_backfill_document_root SET generated='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeCastBackfillDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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
        assert.doesNotMatch(sql, /archive|json_/i);
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

test('cast-backfill tables coexist with the canonical schema', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(canonicalSql);
    const before = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.equal(before.length, 44);
    assert.equal(before.some(name => name.startsWith('cast_backfill_document_')), false);
    const peopleBefore = db.prepare('SELECT count(*) AS n FROM person').get().n;
    initializeCastBackfillDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('cast_backfill_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('cast_backfill_document_')), Object.keys(counts).sort());
    assert.equal(db.prepare('SELECT count(*) AS n FROM person').get().n, peopleBefore);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});
