import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { readSourceArchive } from './source-archive.mjs';
import {
  BOUNDARY_COMPARISON_DOCUMENT_HASH,
  BOUNDARY_COMPARISON_SOURCE_HASH,
  initializeBoundaryComparisonDocument,
  readBoundaryComparisonDocument,
} from './boundary-comparison-document.mjs';

const sourceBytes = readSourceArchive('lore/regions/sources/boundary-comparison.json', BOUNDARY_COMPARISON_SOURCE_HASH);
const schemaSql = fs.readFileSync(new URL('./boundary-comparison-document.sql', import.meta.url), 'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const source = JSON.parse(sourceBytes);
const logicalPath = 'lore/regions/sources/boundary-comparison.json';
const expectedSourceHash = BOUNDARY_COMPARISON_SOURCE_HASH;
const options = { schemaSql, sourceBytes, expectedSourceHash, actor: 'unit-test', reason: 'Exact existing source normalization' };
const many = {
  schemaSql,
  sources: { [logicalPath]: { bytes: sourceBytes, expectedSourceHash } },
  actor: 'unit-test',
  reason: 'Exact existing source normalization',
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = {
  boundary_comparison_document_document: 1,
  boundary_comparison_document_crs_source: 1,
  boundary_comparison_document_key: 198,
  boundary_comparison_document_string_item: 429,
  boundary_comparison_document_bound: 4,
  boundary_comparison_document_district: 25,
  boundary_comparison_document_mismatch: 32,
  boundary_comparison_document_mismatch_candidate: 32,
};
const rejected = fn => assert.throws(fn, { code: 'E_BOUNDARY_COMPARISON_DOCUMENT' });
function fresh(initializer = options) {
  const db = new DatabaseSync(':memory:');
  initializeBoundaryComparisonDocument(db, initializer);
  return db;
}
const read = db => readBoundaryComparisonDocument(db, { expectedSourceHash });

test('actual entire source has fixed byte and document hashes, exact order, and all 722 typed rows', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.equal(sourceBytes.length, 26226);
    assert.equal(hash(sourceBytes), expectedSourceHash);
    assert.equal(hash(JSON.stringify(source)), BOUNDARY_COMPARISON_DOCUMENT_HASH);
    assert.deepEqual(initializeBoundaryComparisonDocument(db, options), {
      documents: 1, crsSources: 1, keys: 198, stringItems: 429, bounds: 4, districts: 25, mismatches: 32, candidates: 32, totalRows: 722,
    });
    const document = read(db);
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.deepEqual(document, source);
    assert.deepEqual(Object.keys(document), Object.keys(source));
    assert.equal(document.invalid_ids.length, 0);
    assert.equal(document.empty_ids.length, 0);
    assert.equal(Object.hasOwn(document.graph_district_mismatch[0], 'candidate'), true);
    assert.deepEqual(document.bounds_wgs84, source.bounds_wgs84);
    assert.equal(document.city_area_m2, source.city_area_m2);
    assert.equal(document.district_rows[2].area_m2, source.district_rows[2].area_m2);
    assert.deepEqual(Object.fromEntries(Object.keys(counts).map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n])), counts);
    const keyOrder = db.prepare("SELECT key FROM boundary_comparison_document_key WHERE object_path='' ORDER BY ordinal").all().map(row => row.key);
    assert.deepEqual(keyOrder, Object.keys(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    const before = db.prepare('SELECT * FROM boundary_comparison_document_document').all();
    rejected(() => initializeBoundaryComparisonDocument(db, { ...options, expectedSourceHash: '0'.repeat(64) }));
    assert.throws(() => initializeBoundaryComparisonDocument(db, options));
    assert.deepEqual(db.prepare('SELECT * FROM boundary_comparison_document_document').all(), before);
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('multiple-source API uses the exact path and the same frozen bytes', () => {
  const db = new DatabaseSync(':memory:');
  try {
    assert.deepEqual(initializeBoundaryComparisonDocument(db, many).totalRows, 722);
    const document = readBoundaryComparisonDocument(db, { logicalPath, expectedSourceHash });
    assert.equal(JSON.stringify(document), JSON.stringify(source));
    assert.equal(JSON.stringify(readBoundaryComparisonDocument(db, { expectedSourceHash, logicalPath })), JSON.stringify(source));
    rejected(() => readBoundaryComparisonDocument(db, { logicalPath: `./${logicalPath}`, expectedSourceHash }));
    rejected(() => readBoundaryComparisonDocument(db, { logicalPath, expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readBoundaryComparisonDocument(db, { expectedSourceHash, logicalPath: 'other.json' }));
  } finally { db.close(); }
});

for (const table of Object.keys(counts)) {
  for (const mode of ['missing', 'changed', 'extra']) {
    test(`${table}: ${mode} row is rejected`, () => {
      const db = fresh();
      try {
        db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
        const columns = db.prepare(`PRAGMA table_info(${table})`).all();
        if (mode === 'missing') db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        if (mode === 'changed') {
          const column = columns.find(item => !['document_id', 'ordinal', 'mismatch_ordinal'].includes(item.name));
          const value = column.type === 'INTEGER' ? `${column.name}+1` : `${column.name} || '-changed'`;
          db.exec(`UPDATE ${table} SET "${column.name}"=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        }
        if (mode === 'extra') {
          const values = columns.map(column => {
            if (['document_id', 'ordinal', 'mismatch_ordinal'].includes(column.name)) return `${column.name}+100`;
            if (['object_path', 'key', 'id', 'name', 'list_name', 'value', 'old_district', 'district', 'type', 'crs_name', 'path'].includes(column.name)) return `"${column.name}" || '-extra'`;
            return `"${column.name}"`;
          });
          db.exec(`INSERT INTO ${table} (${columns.map(column => `"${column.name}"`).join(',')}) SELECT ${values.join(',')} FROM ${table} LIMIT 1`);
        }
        rejected(() => read(db));
      } finally { db.close(); }
    });
  }
}

test('every consumed typed column detects corruption, including exact decimals and empty lists', () => {
  let checked = 0;
  const db = fresh();
  try {
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    for (const table of Object.keys(counts)) {
      for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
        db.exec('SAVEPOINT corruption');
        const value = column.type === 'INTEGER' ? '1000' : "'changed'";
        db.exec(`UPDATE ${table} SET "${column.name}"=${value} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
        rejected(() => read(db));
        checked += 1;
        db.exec('ROLLBACK TO corruption; RELEASE corruption');
      }
    }
    assert.equal(checked, 43);
  } finally { db.close(); }
});

test('unknown and missing fields, nulls, wrong lists, and wrong hashes fail closed before any write', () => {
  const paths = [
    [],
    ['crs_source'],
    ['crs_source', 'properties'],
    ['district_rows', 0],
    ['graph_district_mismatch', 0],
    ['graph_district_mismatch', 31],
  ];
  for (const path of paths) {
    for (const mode of ['unknown', 'missing']) {
      const changed = structuredClone(source);
      const target = path.reduce((value, key) => value[key], changed);
      if (mode === 'unknown') target.unexpected = 'not authored';
      else delete target[Object.keys(target)[0]];
      const db = new DatabaseSync(':memory:');
      try {
        rejected(() => initializeBoundaryComparisonDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
        assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
      } finally { db.close(); }
    }
  }
  for (const mutate of [
    document => { document.crs_source = null; },
    document => { document.crs_source.properties = []; },
    document => { document.invalid_ids = null; },
    document => { document.empty_ids = ['invented']; },
    document => { document.bounds_wgs84 = document.bounds_wgs84.slice(0, 3); },
    document => { document.bounds_wgs84[0] = null; },
    document => { document.district_rows = []; },
    document => { document.graph_district_mismatch[0].candidate = []; },
    document => { document.graph_district_mismatch[0].candidate.push('강남구'); },
    document => { document.graph_outside_candidate = []; },
    document => { document.seoul_names = document.seoul_names.slice(0, 10); },
    document => { document.city_area_m2 = '606223725.0069752'; },
    document => { document.district_rows[0].dong_count = 22.5; },
    document => { document.districts = null; },
    document => { document.authority = ''; },
    document => { const [first, second] = Object.keys(document); const value = document[first]; document[first] = document[second]; document[second] = value; },
  ]) {
    const changed = structuredClone(source);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeBoundaryComparisonDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
      assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get().n, 0);
    } finally { db.close(); }
  }
  const db = fresh();
  try {
    rejected(() => readBoundaryComparisonDocument(db));
    rejected(() => readBoundaryComparisonDocument(db, {}));
    rejected(() => readBoundaryComparisonDocument(db, { expectedSourceHash: '0'.repeat(64) }));
    rejected(() => readBoundaryComparisonDocument(db, { expectedSourceHash, unexpected: true }));
    rejected(() => initializeBoundaryComparisonDocument(db, { ...options, sourceBytes: Buffer.concat([sourceBytes, Buffer.from(' ')]) }));
    for (const overrides of [{ actor: '' }, { reason: ' ' }, { sourceBytes: 'not bytes' }, { schemaSql: '' }, { unexpected: true }, { expectedSourceHash: undefined }]) {
      rejected(() => initializeBoundaryComparisonDocument(db, { ...options, ...overrides }));
    }
    const swapped = { bytes: sourceBytes, expectedSourceHash, extra: true };
    rejected(() => initializeBoundaryComparisonDocument(db, { ...many, sources: { [logicalPath]: swapped } }));
    rejected(() => initializeBoundaryComparisonDocument(db, { ...many, sources: { 'lore/other.json': many.sources[logicalPath] } }));
    rejected(() => initializeBoundaryComparisonDocument(db, { ...many, sources: {} }));
    rejected(() => initializeBoundaryComparisonDocument(db, { ...many, sourceBytes, expectedSourceHash }));
    db.exec('BEGIN');
    rejected(() => initializeBoundaryComparisonDocument(db, options));
    assert.equal(db.isTransaction, true);
    db.exec('ROLLBACK');
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('authored comparison text is stored and current-world claims are not inferred', () => {
  const db = fresh();
  try {
    const document = read(db);
    assert.equal(document.authority, 'community-derived SGIS boundaries, not certified official current roster');
    assert.equal(document.invalid_ids.length, 0);
    assert.equal(document.empty_ids.length, 0);
    assert.equal(document.graph_outside_candidate.includes('광명사거리'), true);
    assert.equal(document.graph_district_mismatch.some(row => row.old === 'retired'), false);
    const changed = structuredClone(source);
    changed.authority = 'certified official current roster';
    const other = new DatabaseSync(':memory:');
    try {
      rejected(() => initializeBoundaryComparisonDocument(other, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }));
    } finally { other.close(); }
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
  } finally { db.close(); }
});

test('insertion and post-insertion verification failures roll back schema and rows atomically', () => {
  for (const suffix of [
    "CREATE TRIGGER fail_boundary BEFORE INSERT ON boundary_comparison_document_mismatch_candidate BEGIN SELECT RAISE(ABORT,'forced insertion'); END;",
    "CREATE TRIGGER corrupt_boundary AFTER INSERT ON boundary_comparison_document_mismatch_candidate BEGIN UPDATE boundary_comparison_document_document SET authority='corrupt'; END;",
  ]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec("CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('retained')");
      assert.throws(() => initializeBoundaryComparisonDocument(db, { ...options, schemaSql: schemaSql + suffix }));
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
    assert.equal(JSON.stringify(readBoundaryComparisonDocument(guarded, { logicalPath, expectedSourceHash })), JSON.stringify(source));
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
    assert.equal(before.some(name => name.startsWith('boundary_comparison_document_')), false);
    initializeBoundaryComparisonDocument(db, options);
    const after = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('boundary_comparison_document_')), before);
    assert.deepEqual(after.filter(name => name.startsWith('boundary_comparison_document_')).sort(), Object.keys(counts).sort());
    assert.equal(JSON.stringify(read(db)), JSON.stringify(source));
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { db.close(); }
});
