import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import {
  ADMIN_TERRITORIAL_DOCUMENT_HASH,
  ADMIN_TERRITORIAL_SOURCE_HASH,
  initializeAdminTerritorialDocument,
  readAdminTerritorialDocument,
} from './admin-territorial-document.mjs';

const sourceBytes = readSourceArchive('scripts/data/admin-territorial-catalog.json', ADMIN_TERRITORIAL_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./admin-territorial-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const logicalPath = 'scripts/data/admin-territorial-catalog.json';
const expectedSourceHash = ADMIN_TERRITORIAL_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact existing source normalization' };
const many = {
  schemaSql,
  sources: { [logicalPath]: { bytes: sourceBytes, expectedSourceHash } },
  actor: 'unit-test',
  reason: 'Exact existing source normalization',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  admin_territorial_document_document: 1,
  admin_territorial_document_key: 11056,
  admin_territorial_document_unit: 1842,
};
const rejected = fn => assert.throws(fn, { code: 'E_ADMIN_TERRITORIAL_DOCUMENT' });
function fresh(initializer = options) {
  const db = new DatabaseSync(':memory:');
  initializeAdminTerritorialDocument(db, initializer);
  return db;
}
const read = db => readAdminTerritorialDocument(db, { expectedSourceHash });

test('actual entire source has fixed byte and document hashes, exact order, and all 12899 typed rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 305507);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), ADMIN_TERRITORIAL_DOCUMENT_HASH);
    assert.deepEqual(initializeAdminTerritorialDocument(db, options), {
      documents: 1, keys: 11056, units: 1842, totalRows: 12899,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.deepEqual(Object.keys(document), Object.keys(source));
    assert.equal(document.schema, 'admin-territorial-catalog.v1');
    assert.equal(document.sourceRef, 'lore/regions/sources/selection.json#selected_boundary');
    assert.equal(document.sourceSha256, 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f');
    assert.equal(document.units.length, 1842);
    assert.equal(document.units[0].adminId, '1111051500');
    assert.equal(document.units[0].name, '서울특별시 종로구 청운효자동');
    assert.equal(document.units[1841].adminId, '5183035000');
    assert.equal(document.units[1841].provinceName, '강원특별자치도');
    const outside = document.units.filter(unit => unit.provinceId !== '11');
    assert.equal(outside.length, 1415);
    assert.deepEqual(
      [...new Set(document.units.map(unit => `${unit.provinceId}|${unit.provinceName}`))],
      ['11|서울특별시', '28|인천광역시', '30|대전광역시', '36|세종특별자치시', '41|경기도', '43|충청북도', '44|충청남도', '51|강원특별자치도'],
    );
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    const keyOrder = db.prepare("SELECT key FROM admin_territorial_document_key WHERE object_path='' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(keyOrder, Object.keys(source));
    const unitKeys = db.prepare("SELECT key FROM admin_territorial_document_key WHERE object_path='/units/0' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(unitKeys, Object.keys(source.units[0]));
    const lastKeys = db.prepare("SELECT key FROM admin_territorial_document_key WHERE object_path='/units/1841' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(lastKeys, Object.keys(source.units[1841]));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM admin_territorial_document_document').all();
    rejected(() => initializeAdminTerritorialDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeAdminTerritorialDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM admin_territorial_document_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('multiple-source API uses the exact path and the same frozen bytes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeAdminTerritorialDocument(db, many).totalRows, 12899);
    const document = readAdminTerritorialDocument(db, { logicalPath, expectedSourceHash });
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    rejected(() => readAdminTerritorialDocument(db, { logicalPath: `./${logicalPath}`, expectedSourceHash }));
    rejected(() => readAdminTerritorialDocument(db, { logicalPath, expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readAdminTerritorialDocument(db, { expectedSourceHash, logicalPath: 'other.json' }));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(name => !['document_id', 'ordinal'].includes(name));
          const info = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
          const value = info.type === 'INTEGER' ? `${column}+1` : `${column} || '-changed'`;
          db.exec(`UPDATE ${table} SET ${column}=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const values = columns.map(name => {
            if (['document_id', 'ordinal'].includes(name)) return `${name}+10000`;
            if (name === 'admin_id') return "'9' || substr(admin_id, 2)";
            if (['object_path', 'key'].includes(name)) return `${name} || '-extra'`;
            return name;
          });
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('every consumed typed column detects corruption, including ids, names, and provenance', () => {
  let checked = 0;
  const db = fresh();
  try {
    db.exec('PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) {
      for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
        db.exec('SAVEPOINT corruption');
        const value = column.type === 'INTEGER' ? '10000' : "'changed'";
        db.exec(`UPDATE ${table} SET ${column.name}=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        rejected(() => read(db));
        checked += 1;
        db.exec('ROLLBACK TO corruption; RELEASE corruption');
      }
    }
    assert.equal(checked, 20);
  } finally { db.close(); }
});

test('unknown and missing fields, dropped outside-Seoul rows, and wrong hashes fail closed', () => {
  const paths = [
    [],
    ['units', 0],
    ['units', 426],
    ['units', 1841],
  ];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeAdminTerritorialDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document.units = document.units.filter(unit => unit.provinceId === '11'); },
    document => { document.units = document.units.slice(0, 1841); },
    document => { document.units.push({ ...document.units[0], adminId: '9999999999' }); },
    document => { document.units[0].adminId = document.units[1].adminId; },
    document => { document.units[0].provinceId = '99'; },
    document => { document.units[0].name = '다른이름'; },
    document => { document.schema = 'admin-territorial-catalog.v2'; },
    document => { document.sourceRef = 'other.json'; },
    document => { document.sourceSha256 = '0'.repeat(64); },
    document => { document.units[1841].provinceName = null; },
    document => { delete document.units; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeAdminTerritorialDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readAdminTerritorialDocument(db));
    rejected(() => readAdminTerritorialDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => initializeAdminTerritorialDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeAdminTerritorialDocument(db, { ...options, ...overrides }));
    }
    const swapped = { bytes: sourceBytes, expectedSourceHash, extra: true };
    rejected(() => initializeAdminTerritorialDocument(db, { ...many, sources: { [logicalPath]: swapped } }));
    rejected(() => initializeAdminTerritorialDocument(db, { ...many, sources: { 'scripts/other.json': many.sources[logicalPath] } }));
    rejected(() => initializeAdminTerritorialDocument(db, { ...many, sources: {} }));
    db.exec('BEGIN');
    rejected(() => initializeAdminTerritorialDocument(db, options));
    db.exec('ROLLBACK');
  } finally { db.close(); }
});

test('outside-Seoul units stay stored facts and are not filtered or renamed', () => {
  const db = fresh();
  try {
    const document = read(db);
    const gangwon = document.units.filter(unit => unit.provinceId === '51');
    assert.equal(gangwon.length, 188);
    assert.equal(gangwon[gangwon.length - 1].name, '강원특별자치도 양양군 강현면');
    assert.equal(document.units.filter(unit => unit.provinceName === '인천광역시').length, 158);
    assert.equal(document.units.filter(unit => unit.provinceName === '경기도').length, 602);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_admin BEFORE INSERT ON admin_territorial_document_unit BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_admin AFTER INSERT ON admin_territorial_document_unit BEGIN UPDATE admin_territorial_document_document SET schema_name='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeAdminTerritorialDocument(db, { ...options, schemaSql: schemaSql + suffix }));
      assert.equal(db.isTransaction, false);
      assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
      assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
    } finally { db.close(); }
  }
});

test('runtime reconstructs with source IO, archive access, JSON.parse and non-SELECT SQL blocked', () => {
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
    assert.equal(JSON.stringify(readAdminTerritorialDocument(guarded, { logicalPath, expectedSourceHash })), JSON.stringify(source));
  } finally {
    restores.reverse().forEach(restore => restore());
    db.close();
  }
});

test('typed tables coexist with the existing canonical schema and do not rewrite it', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(canonicalSql);
    const before = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.equal(before.length, 44);
    assert.equal(before.includes('state'), true);
    assert.equal(before.some(name => name.startsWith('admin_territorial_document_')), false);
    initializeAdminTerritorialDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('admin_territorial_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('admin_territorial_document_')).sort(), Object.keys(counts).sort());
    assert.equal(after.includes('admin_territorial_document_value'), false);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { db.close(); }
});
