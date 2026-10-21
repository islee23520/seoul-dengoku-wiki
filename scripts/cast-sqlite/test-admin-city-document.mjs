import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import {
  ADMIN_CITY_DOCUMENT_HASH,
  ADMIN_CITY_SOURCE_HASH,
  initializeAdminCityDocument,
  readAdminCityDocument,
} from './admin-city-document.mjs';

const sourceBytes = readSourceArchive('scripts/data/admin-city-hierarchy.json', ADMIN_CITY_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./admin-city-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const logicalPath = 'scripts/data/admin-city-hierarchy.json';
const expectedSourceHash = ADMIN_CITY_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact existing source normalization' };
const many = {
  schemaSql,
  sources: { [logicalPath]: { bytes: sourceBytes, expectedSourceHash } },
  actor: 'unit-test',
  reason: 'Exact existing source normalization',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  admin_city_document_document: 1,
  admin_city_document_vintage_note: 6,
  admin_city_document_district: 30,
  admin_city_document_municipal_source: 30,
  admin_city_document_municipal_text: 91,
  admin_city_document_establishment_source: 7,
  admin_city_document_establishment_text: 27,
  admin_city_document_mois_identity: 30,
  admin_city_document_source_row: 60,
  admin_city_document_leaf: 373,
  admin_city_document_key: 1227,
};
const rejected = fn => assert.throws(fn, { code: 'E_ADMIN_CITY_DOCUMENT' });
function fresh(initializer = options) {
  const db = new DatabaseSync(':memory:');
  initializeAdminCityDocument(db, initializer);
  return db;
}
const read = db => readAdminCityDocument(db, { expectedSourceHash });

test('actual entire source has fixed byte and document hashes, exact order, and all typed rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 77491);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), ADMIN_CITY_DOCUMENT_HASH);
    assert.deepEqual(initializeAdminCityDocument(db, options), {
      documents: 1,
      vintageNotes: 6,
      districts: 30,
      municipalSources: 30,
      municipalTexts: 91,
      establishmentSources: 7,
      establishmentTexts: 27,
      moisIdentities: 30,
      sourceRows: 60,
      leaves: 373,
      keys: 1227,
      totalRows: 1882,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.equal(document.rows.length, 30);
    assert.equal(document.rows.filter(row => row.establishmentSource === null).length, 23);
    assert.equal(document.rows.filter(row => row.municipalSource.sourceAsOfOrModified === null).length, 14);
    assert.equal(document.rows.reduce((sum, row) => sum + row.affectedLeafIds.length, 0), 373);
    assert.equal(new Set(document.rows.map(row => row.moisIdentity.citySourceRow.province)).size, 3);
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    const keyOrder = db.prepare("SELECT key FROM admin_city_document_key WHERE object_path='' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(keyOrder, Object.keys(source));
    const rowKeys = db.prepare("SELECT key FROM admin_city_document_key WHERE object_path='/rows/0' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(rowKeys, Object.keys(source.rows[0]));
    const sourceKeys = db.prepare("SELECT key FROM admin_city_document_key WHERE object_path='/rows/0/moisIdentity/districtSourceRow' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(sourceKeys, Object.keys(source.rows[0].moisIdentity.districtSourceRow));
    assert.equal(db.prepare("SELECT dong FROM admin_city_document_source_row WHERE dong != ''").all().length, 0);
    assert.equal(db.prepare("SELECT abolished FROM admin_city_document_source_row WHERE abolished != ''").all().length, 0);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM admin_city_document_document').all();
    rejected(() => initializeAdminCityDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeAdminCityDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM admin_city_document_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('multiple-source API uses the exact path and the same frozen bytes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeAdminCityDocument(db, many).totalRows, 1882);
    const document = readAdminCityDocument(db, { logicalPath, expectedSourceHash });
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    rejected(() => readAdminCityDocument(db, { logicalPath: `./${logicalPath}`, expectedSourceHash }));
    rejected(() => readAdminCityDocument(db, { logicalPath, expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readAdminCityDocument(db, { expectedSourceHash, logicalPath: 'other.json' }));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA foreign_keys=OFF');
        db.exec('PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(name => !['document_id', 'ordinal', 'district_ordinal'].includes(name));
          const info = db.prepare(`PRAGMA table_info(${table})`).all().find(row => row.name === column);
          const value = info.type === 'INTEGER' ? `${column}+1` : `${column} || '-changed'`;
          db.exec(`UPDATE ${table} SET ${column}=${value} WHERE rowid=(SELECT max(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const parent = db.prepare('SELECT max(ordinal) AS n FROM admin_city_document_district').get().n + 1000;
          const values = columns.map(name => {
            if (name === 'district_ordinal') return String(parent);
            if (['document_id', 'ordinal', 'source_row'].includes(name)) return `${name}+1000`;
            if (['object_path', 'key', 'district_id', 'leaf_id', 'side'].includes(name)) return `${name} || '-extra'`;
            return name;
          });
          if (table !== 'admin_city_document_district' && columns.includes('district_ordinal')) {
            db.exec(`INSERT INTO admin_city_document_district (ordinal, district_id, parent_city_id, district_name, parent_city_name, status, district_code_effective_from, has_establishment_source) VALUES (${parent}, 'extra-${parent}', '00000', 'extra', 'extra', 'extra', 'extra', 1)`);
          }
          db.exec(`INSERT INTO ${table} SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('every consumed typed column detects corruption, including nulls and provenance', () => {
  let checked = 0;
  const db = fresh();
  try {
    db.exec('PRAGMA foreign_keys=OFF');
    db.exec('PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) {
      for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
        db.exec('SAVEPOINT corruption');
        const value = column.type === 'INTEGER' ? '1000' : "'changed'";
        db.exec(`UPDATE ${table} SET ${column.name}=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        rejected(() => read(db));
        checked += 1;
        db.exec('ROLLBACK TO corruption; RELEASE corruption');
      }
    }
    assert.equal(checked, 59);
  } finally { db.close(); }
});

test('unknown and missing fields, filled nulls, and wrong hashes fail closed', () => {
  const paths = [
    [],
    ['rows', 0],
    ['rows', 29],
    ['rows', 0, 'municipalSource'],
    ['rows', 17, 'establishmentSource'],
    ['rows', 0, 'moisIdentity'],
    ['rows', 0, 'moisIdentity', 'districtSourceRow'],
    ['rows', 0, 'moisIdentity', 'citySourceRow'],
  ];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeAdminCityDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document.rows[0].establishmentSource = { url: 'https://example.invalid', exactText: ['invented'], effectiveDate: '2026-01-01' }; },
    document => { delete document.rows[0].establishmentSource; },
    document => { document.rows[6].establishmentSource = null; },
    document => { document.rows[0].municipalSource.sourceAsOfOrModified = '2026-01-01'; },
    document => { document.rows[10].municipalSource.sourceAsOfOrModified = null; },
    document => { delete document.rows[0].municipalSource.sourceAsOfOrModified; },
    document => { document.rows[0].moisIdentity.districtSourceRow.dong = 'invented'; },
    document => { document.rows[0].moisIdentity.citySourceRow.abolished = '20260101'; },
    document => { document.rows.pop(); },
    document => { document.vintageNotes.pop(); },
    document => { document.rows[0].affectedLeafIds.pop(); },
    document => { document.rows[0].status = 'APPROVED_FOR_PUBLICATION'; },
    document => { document.schema = null; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeAdminCityDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readAdminCityDocument(db));
    rejected(() => readAdminCityDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => initializeAdminCityDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeAdminCityDocument(db, { ...options, ...overrides }));
    }
    const swapped = { bytes: sourceBytes, expectedSourceHash, extra: true };
    rejected(() => initializeAdminCityDocument(db, { ...many, sources: { [logicalPath]: swapped } }));
    rejected(() => initializeAdminCityDocument(db, { ...many, sources: { 'scripts/data/other.json': many.sources[logicalPath] } }));
    rejected(() => initializeAdminCityDocument(db, { ...many, sources: {} }));
    db.exec('BEGIN');
    rejected(() => initializeAdminCityDocument(db, options));
    db.exec('ROLLBACK');
  } finally { db.close(); }
});

test('null establishment and municipal dates stay absent values and outside-Seoul rows stay stored', () => {
  const db = fresh();
  try {
    const document = read(db);
    const absent = document.rows[0];
    assert.equal(absent.establishmentSource, null);
    assert.equal(Object.hasOwn(absent, 'establishmentSource'), true);
    const dated = document.rows.find(row => row.parentCityId === '41590');
    const bucheon = document.rows.find(row => row.parentCityId === '41190');
    assert.equal(dated.establishmentSource === null, false);
    assert.equal(bucheon.establishmentSource === null, false);
    const undated = document.rows.find(row => row.districtId === '41171');
    assert.equal(undated.municipalSource.sourceAsOfOrModified, null);
    assert.equal(Object.hasOwn(undated.municipalSource, 'sourceAsOfOrModified'), true);
    const provinces = [...new Set(document.rows.map(row => row.moisIdentity.citySourceRow.province))].sort();
    assert.deepEqual(provinces, ['경기도', '충청남도', '충청북도']);
    assert.equal(document.rows.filter(row => row.moisIdentity.citySourceRow.province !== '경기도').length, 6);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_admin_city BEFORE INSERT ON admin_city_document_leaf BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_admin_city AFTER INSERT ON admin_city_document_leaf BEGIN UPDATE admin_city_document_document SET proof_method='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeAdminCityDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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
    assert.equal(JSON.stringify(readAdminCityDocument(guarded, { logicalPath, expectedSourceHash })), JSON.stringify(source));
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
    assert.equal(before.some(name => name.startsWith('admin_city_document_')), false);
    initializeAdminCityDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('admin_city_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('admin_city_document_')).sort(), Object.keys(counts).sort());
    assert.equal(after.includes('admin_city_document_value'), false);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { db.close(); }
});
