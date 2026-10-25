import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import {
  GEOGRAPHY_SELECTION_DOCUMENT_HASH,
  GEOGRAPHY_SELECTION_SOURCE_HASH,
  initializeGeographySelectionDocument,
  readGeographySelectionDocument,
} from './geography-selection-document.mjs';

const sourceBytes = readSourceArchive('lore/regions/sources/selection.json', GEOGRAPHY_SELECTION_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./geography-selection-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const logicalPath = 'lore/regions/sources/selection.json';
const expectedSourceHash = GEOGRAPHY_SELECTION_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact existing source normalization' };
const many = {
  schemaSql,
  sources: { [logicalPath]: { bytes: sourceBytes, expectedSourceHash } },
  actor: 'unit-test',
  reason: 'Exact existing source normalization',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  geography_selection_document_document: 1,
  geography_selection_document_key: 88,
  geography_selection_document_region: 7,
};
const rejected = fn => assert.throws(fn, { code: 'E_GEOGRAPHY_SELECTION_DOCUMENT' });
function fresh(initializer = options) {
  const db = new DatabaseSync(':memory:');
  initializeGeographySelectionDocument(db, initializer);
  return db;
}
const read = db => readGeographySelectionDocument(db, { expectedSourceHash });

test('actual entire source has fixed byte and document hashes, exact order, and all 96 typed rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 4747);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), GEOGRAPHY_SELECTION_DOCUMENT_HASH);
    assert.deepEqual(initializeGeographySelectionDocument(db, options), {
      documents: 1, keys: 88, regions: 7, totalRows: 96,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.equal(document.terrain.observation_date, null);
    assert.equal(document.fictional_epoch.absolute_date, null);
    assert.equal(document.comparison_boundary.current_boundary, false);
    assert.equal(document.osm.complete_official_roster, false);
    assert.equal(JSON.stringify(document.selected_boundary.coverage_tolerance_m2), '0.01');
    assert.equal(JSON.stringify(document.selected_boundary.selected_union_area_m2), '606223725.0069752');
    assert.equal(JSON.stringify(document.selected_boundary.overlap_excess_m2), '707.0937968492508');
    assert.equal(document.extended_coverage.regions.length, 7);
    assert.equal(document.extended_coverage.dong_total, 1684);
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    const keyOrder = db.prepare("SELECT key FROM geography_selection_document_key WHERE object_path='' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(keyOrder, Object.keys(source));
    const regionKeys = db.prepare("SELECT key FROM geography_selection_document_key WHERE object_path='/extended_coverage/regions/0' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(regionKeys, Object.keys(source.extended_coverage.regions[0]));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM geography_selection_document_document').all();
    rejected(() => initializeGeographySelectionDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeGeographySelectionDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM geography_selection_document_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('multiple-source API uses the exact path and the same frozen bytes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeGeographySelectionDocument(db, many).totalRows, 96);
    const document = readGeographySelectionDocument(db, { logicalPath, expectedSourceHash });
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    rejected(() => readGeographySelectionDocument(db, { logicalPath: `./${logicalPath}`, expectedSourceHash }));
    rejected(() => readGeographySelectionDocument(db, { logicalPath, expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readGeographySelectionDocument(db, { expectedSourceHash, logicalPath: 'other.json' }));
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
            if (['document_id', 'ordinal'].includes(name)) return `${name}+100`;
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

test('every consumed typed column detects corruption, including nulls, decimals, and provenance', () => {
  let checked = 0;
  const db = fresh();
  try {
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
    assert.equal(checked, 67);
  } finally { db.close(); }
});

test('unknown and missing fields, filled nulls, and wrong hashes fail closed', () => {
  const paths = [
    [],
    ['selected_boundary'],
    ['comparison_boundary'],
    ['osm'],
    ['terrain'],
    ['fictional_epoch'],
    ['extended_coverage'],
    ['extended_coverage', 'regions', 0],
    ['extended_coverage', 'regions', 6],
  ];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeGeographySelectionDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document.terrain.observation_date = '2017-12-01'; },
    document => { delete document.terrain.observation_date; },
    document => { document.fictional_epoch.absolute_date = 'opening'; },
    document => { document.comparison_boundary.current_boundary = true; },
    document => { document.osm.complete_official_roster = true; },
    document => { document.selected_boundary.coverage_tolerance_m2 = 0.010; },
    document => { document.selected_boundary.selected_union_area_m2 = 606223725.0069753; },
    document => { document.extended_coverage.regions = document.extended_coverage.regions.slice(0, 6); },
    document => { document.extended_coverage.dong_total = 1685; },
    document => { document.as_of = null; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try { rejected(() => initializeGeographySelectionDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) })); }
    finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readGeographySelectionDocument(db));
    rejected(() => readGeographySelectionDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => initializeGeographySelectionDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }]) {
      rejected(() => initializeGeographySelectionDocument(db, { ...options, ...overrides }));
    }
    const swapped = { bytes: sourceBytes, expectedSourceHash, extra: true };
    rejected(() => initializeGeographySelectionDocument(db, { ...many, sources: { [logicalPath]: swapped } }));
    rejected(() => initializeGeographySelectionDocument(db, { ...many, sources: { 'lore/other.json': many.sources[logicalPath] } }));
    rejected(() => initializeGeographySelectionDocument(db, { ...many, sources: {} }));
    db.exec('BEGIN');
    rejected(() => initializeGeographySelectionDocument(db, options));
    db.exec('ROLLBACK');
  } finally { db.close(); }
});

test('null observations stay absent values and are not inferred into dates', () => {
  const db = fresh();
  try {
    const document = read(db);
    assert.equal(document.terrain.observation_date, null);
    assert.equal(Object.hasOwn(document.terrain, 'observation_date'), true);
    assert.equal(document.fictional_epoch.absolute_date, null);
    assert.equal(document.decision_kind.includes('not legal boundary certification'), true);
    assert.equal(document.comparison_boundary.current_boundary, false);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_selection BEFORE INSERT ON geography_selection_document_region BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_selection AFTER INSERT ON geography_selection_document_region BEGIN UPDATE geography_selection_document_document SET as_of='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeGeographySelectionDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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
    assert.equal(JSON.stringify(readGeographySelectionDocument(guarded, { logicalPath, expectedSourceHash })), JSON.stringify(source));
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
    assert.equal(before.some(name => name.startsWith('geography_selection_document_')), false);
    initializeGeographySelectionDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('geography_selection_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('geography_selection_document_')).sort(), Object.keys(counts).sort());
    assert.equal(after.includes('geography_selection_document_value'), false);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  } finally { db.close(); }
});
