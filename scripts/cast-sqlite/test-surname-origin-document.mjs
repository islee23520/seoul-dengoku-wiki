import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { SURNAME_ORIGIN_SOURCE_HASH, SURNAME_ORIGIN_DOCUMENT_HASH, initializeSurnameOriginDocument, readSurnameOriginDocument } from './surname-origin-document.mjs';

const sourceBytes = readSourceArchive('lore/name-pools/surnames-bongwan.json', SURNAME_ORIGIN_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./surname-origin-document.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const expectedSourceHash = SURNAME_ORIGIN_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact surname-origin normalization without approval' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  surname_origin_document: 1,
  surname_origin_source: 517,
  surname_origin_source_key: 4126,
  surname_origin_surname: 517,
  surname_origin_surname_key: 4389,
  surname_origin_surname_source: 517,
  surname_origin_bongwan: 413,
  surname_origin_bongwan_key: 2065,
  surname_origin_bongwan_source: 413,
};
const rejected = fn => assert.throws(fn, { code: 'E_SURNAME_ORIGIN_DOCUMENT' });
const read = db => readSurnameOriginDocument(db, { expectedSourceHash });
function fresh() {
  const db = new DatabaseSync(':memory:');
  initializeSurnameOriginDocument(db, options);
  return db;
}

test('actual entire source preserves ordered serialization, all 12958 typed rows and exact nulls', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 540425);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), SURNAME_ORIGIN_DOCUMENT_HASH);
    assert.deepEqual(initializeSurnameOriginDocument(db, options), {
      documents: 1, sources: 517, surnames: 517, bongwan: 413, surnameSources: 517, bongwanSources: 413, totalRows: 12958,
    });
    assert.deepEqual(read(db), source);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    assert.equal(db.prepare('SELECT count(*) AS n FROM surname_origin_surname WHERE hanja IS NULL').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM surname_origin_bongwan WHERE hanja IS NULL').get().n, 46);
    assert.equal(db.prepare('SELECT count(*) AS n FROM surname_origin_surname WHERE population_2000_present = 0').get().n, 5);
    assert.equal(db.prepare('SELECT count(*) AS n FROM surname_origin_surname WHERE bongwan_unlisted_reason_present = 1').get().n, 263);
    assert.equal(db.prepare('SELECT count(*) AS n FROM surname_origin_source WHERE record_id_present = 0').get().n, 5);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM surname_origin_document').all();
    assert.throws(() => initializeSurnameOriginDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM surname_origin_document').all(), before);
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
        const column = columns.find(name => !['document_id', 'ordinal', 'source_ordinal', 'surname_ordinal', 'bongwan_ordinal'].includes(name));
        const declared = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
        const replacement = declared.type === 'INTEGER' ? '1000' : `${column} || '-changed'`;
        db.exec(`UPDATE ${table} SET ${column}=${replacement} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      }
      if (mode === 'extra') {
        const values = columns.map(name => {
          if (['document_id', 'ordinal', 'source_ordinal', 'surname_ordinal', 'bongwan_ordinal'].includes(name)) return '1000000';
          if (name === 'id' || name === 'key' || name === 'source_id') return `${name} || '-extra'`;
          return name;
        });
        db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
      }
      rejected(() => read(db));
    } finally { db.close(); }
  });
}

test('wrong hash, unknown field, missing field and reordered keys are rejected before writes', () => {
  const bongwanSurname = source.surnames.findIndex(surname => surname.bongwan.length > 0);
  const targets = [
    [],
    ['sources', 0],
    ['surnames', 0],
    ['surnames', bongwanSurname, 'bongwan', 0],
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
      rejected(() => initializeSurnameOriginDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  for (const mutate of [
    document => { document.note += 'changed'; },
    document => { document.surnames[0].population_2015 = String(document.surnames[0].population_2015); },
    document => { document.surnames[bongwanSurname].bongwan.push({ id: 'added', name: '추가', hanja: '加', majority: false, sources: [document.sources[0].id] }); },
    document => { document.sources.push({ ...document.sources[0], id: 'added-source' }); },
    document => { delete document.surnames[0].hanja; },
    document => { document.surnames[bongwanSurname].bongwan[0].majority = 1; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeSurnameOriginDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readSurnameOriginDocument(db));
    rejected(() => readSurnameOriginDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    for (const overrides of [
      { expectedSourceHash: '0'.repeat(64) },
      { sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) },
      { actor: '' },
      { reason: ' ' },
      { schemaSql: '' },
      { sourceBytes: 'not bytes' },
    ]) rejected(() => initializeSurnameOriginDocument(db, { ...options, ...overrides }));
    db.exec('BEGIN');
    rejected(() => initializeSurnameOriginDocument(db, options));
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back all schema and rows', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_surname_origin BEFORE INSERT ON surname_origin_bongwan_source BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_surname_origin AFTER INSERT ON surname_origin_bongwan_source BEGIN UPDATE surname_origin_document SET note='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeSurnameOriginDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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
