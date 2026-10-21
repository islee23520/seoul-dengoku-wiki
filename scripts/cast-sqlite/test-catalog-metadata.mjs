import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { openReadOnly } from './db.mjs';
import {
  CATEGORY_REGISTRY_PATH, OFFICIAL_SEOUL_LINES_PATH, UPDATE_HISTORY_PATH,
  CATALOG_METADATA_PATHS, initializeCatalogMetadata, readCatalogMetadataDocument, readCatalogMetadata,
} from './catalog-metadata.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const schemaSql = fs.readFileSync(new URL('./catalog-metadata.sql', import.meta.url), 'utf8');
const documents = (() => {
  const db = openReadOnly(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
  try { return CATALOG_METADATA_PATHS.map(logicalPath => ({ logicalPath,
    document: readCatalogMetadataDocument(db, logicalPath),
    sourceSha256: db.prepare('SELECT source_sha256 FROM catalog_metadata_document WHERE logical_path=?').get(logicalPath).source_sha256 })); }
  finally { db.close(); }
})();
const options = { schemaSql, documents, actor: 'unit-test', reason: 'Normalize generator metadata' };
const sources = Object.fromEntries(documents.map(row => [row.logicalPath, row.document]));
const tables = [
  'catalog_metadata_document', 'catalog_category', 'catalog_category_required_kind',
  'catalog_official_line_metadata', 'catalog_official_line', 'catalog_official_station',
  'catalog_official_station_line', 'catalog_update_history', 'catalog_update', 'catalog_metadata_key',
];
function fixture(t, initialize = true) {
  const directory = fs.mkdtempSync(join(tmpdir(), 'catalog-metadata-'));
  const filename = join(directory, 'metadata.sqlite');
  const db = new DatabaseSync(filename);
  t.after(() => { db.close(); fs.rmSync(directory, { recursive: true }); });
  if (initialize) initializeCatalogMetadata(db, options);
  return db;
}
const rejected = operation => assert.throws(operation, { code: 'E_CATALOG_METADATA' });

test('metadata integrates into the complete migrated authority without altering existing heads', {
  skip: !process.env.CATALOG_METADATA_DATABASE,
}, t => {
  const directory = fs.mkdtempSync(join(tmpdir(), 'catalog-metadata-authority-'));
  const filename = join(directory, 'copy.sqlite');
  fs.copyFileSync(process.env.CATALOG_METADATA_DATABASE, filename);
  const db = new DatabaseSync(filename, { enableForeignKeyConstraints: true });
  t.after(() => { db.close(); fs.rmSync(directory, { recursive: true }); });
  const heads = db.prepare('SELECT * FROM document_head ORDER BY source_id').all();
  const sources = db.prepare('SELECT source_id,sha256,byte_length FROM source_file ORDER BY source_id').all();
  initializeCatalogMetadata(db, options);
  for (const row of documents) assert.deepEqual(readCatalogMetadataDocument(db, row.logicalPath,
    { expectedSourceHash: row.sourceSha256 }), row.document);
  assert.deepEqual(db.prepare('SELECT * FROM document_head ORDER BY source_id').all(), heads);
  assert.deepEqual(db.prepare('SELECT source_id,sha256,byte_length FROM source_file ORDER BY source_id').all(), sources);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('all three actual sources roundtrip exactly through typed tables with independent provenance', t => {
  const db = fixture(t);
  for (const row of documents) {
    const actual = readCatalogMetadataDocument(db, row.logicalPath, { expectedSourceHash: row.sourceSha256 });
    assert.deepEqual(actual, row.document);
    assert.equal(JSON.stringify(actual), JSON.stringify(row.document));
    const provenance = db.prepare('SELECT * FROM catalog_metadata_document WHERE logical_path=?').get(row.logicalPath);
    assert.equal(provenance.source_sha256, row.sourceSha256);
    assert.equal(provenance.document_sha256, hash(JSON.stringify(row.document)));
    assert.notEqual(provenance.source_sha256, provenance.document_sha256);
    rejected(() => readCatalogMetadataDocument(db, row.logicalPath, { expectedSourceHash: '0'.repeat(64) }));
  }
  assert.deepEqual(readCatalogMetadata(db), sources);
  const lines = sources[OFFICIAL_SEOUL_LINES_PATH];
  const empty = Object.entries(lines.stations).filter(([, ids]) => !ids.length).map(([name]) => name);
  assert.ok(empty.length > 0);
  for (const name of empty) assert.deepEqual(readCatalogMetadataDocument(db, OFFICIAL_SEOUL_LINES_PATH).stations[name], []);
  const counts = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n]));
  assert.equal(counts.catalog_category, sources[CATEGORY_REGISTRY_PATH].categories.length);
  assert.equal(counts.catalog_official_line, Object.keys(lines.lines).length);
  assert.equal(counts.catalog_official_station, Object.keys(lines.stations).length);
  assert.equal(counts.catalog_official_station_line, Object.values(lines.stations).flat().length);
  assert.equal(counts.catalog_update, sources[UPDATE_HISTORY_PATH].updates.length);
  t.diagnostic(JSON.stringify({ counts, emptyStations: empty.length, sourceHashes: documents.map(row => [row.logicalPath, row.sourceSha256]) }));
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare("SELECT count(*) AS n FROM pragma_table_list WHERE name LIKE 'catalog_%' AND strict=1").get().n, tables.length);
  assert.throws(() => initializeCatalogMetadata(db, options));
  assert.deepEqual(readCatalogMetadata(db), sources);
});

for (const table of tables) {
  test(`${table}: missing rows and every changed column are detected`, t => {
    const db = fixture(t);
    db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
    db.exec('SAVEPOINT missing');
    db.exec(`DELETE FROM ${table} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
    rejected(() => readCatalogMetadata(db));
    db.exec('ROLLBACK TO missing; RELEASE missing');
    for (const column of db.prepare(`PRAGMA table_info(${table})`).all()) {
      db.exec('SAVEPOINT changed');
      db.exec(`UPDATE ${table} SET "${column.name}"=${column.type === 'INTEGER' ? '10000' : "'changed'"} WHERE rowid=(SELECT min(rowid) FROM ${table})`);
      rejected(() => readCatalogMetadata(db));
      db.exec('ROLLBACK TO changed; RELEASE changed');
    }
    assert.deepEqual(readCatalogMetadata(db), sources);
  });
}

test('unknown and missing keys, incorrect nested types, and dangling line references fail before writes', t => {
  const db = fixture(t, false);
  const mutations = [
    rows => { rows[0].document.extra = true; },
    rows => { delete rows[0].document.categories[0].summary; },
    rows => { rows[0].document.categories[0].extra = ''; },
    rows => { rows[0].document.categories[0].requiredKinds = ['unsupported']; },
    rows => { rows[0].document.categories[0].requiredKinds = 'heading'; },
    rows => { rows[0].document.categories[0].label = null; },
    rows => { rows[0].document.categories[1].id = rows[0].document.categories[0].id; },
    rows => { rows[1].document.lines['2-1'].extra = ''; },
    rows => { rows[1].document.lines['2-1'].color = 12; },
    rows => { rows[1].document.stations.Guro = ['unknown']; },
    rows => { rows[1].document.stations.Guro = null; },
    rows => { rows[2].document.updates[0].extra = ''; },
    rows => { rows[2].document.updates[0].sequence = '12'; },
    rows => { rows[2].document.updates[0].sequence = 1.5; },
    rows => { rows[2].document.updates[0].date = 'yesterday'; },
    rows => { rows[2].document.schema = 'unsupported'; },
    rows => { rows[2].sourceSha256 = 'invalid'; },
    rows => { rows[2].logicalPath = 'unknown'; },
    rows => { rows.pop(); },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(documents);
    mutate(changed);
    rejected(() => initializeCatalogMetadata(db, { ...options, documents: changed }));
    assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n, 0);
  }
  for (const overrides of [{ actor: '' }, { reason: ' ' }, { schemaSql: '' }]) {
    rejected(() => initializeCatalogMetadata(db, { ...options, ...overrides }));
  }
  db.exec('BEGIN');
  rejected(() => initializeCatalogMetadata(db, options));
  db.exec('ROLLBACK');
});

test('caller object key order and empty collections are preserved without generic value storage', t => {
  const db = fixture(t, false);
  const changed = structuredClone(documents);
  const reverse = value => Object.fromEntries(Object.entries(value).reverse());
  changed[0].document.categories = changed[0].document.categories.map(reverse);
  changed[1].document = reverse(changed[1].document);
  changed[1].document.lines = Object.fromEntries(Object.entries(changed[1].document.lines).reverse().map(([id, value]) => [id, reverse(value)]));
  changed[1].document.stations = reverse(changed[1].document.stations);
  changed[2].document = reverse(changed[2].document);
  changed[2].document.updates = changed[2].document.updates.map(reverse);
  initializeCatalogMetadata(db, { ...options, documents: changed });
  for (const row of changed) assert.equal(JSON.stringify(readCatalogMetadataDocument(db, row.logicalPath)), JSON.stringify(row.document));
  assert.throws(() => db.prepare('INSERT INTO catalog_official_station_line VALUES (?,?,?)').run('missing', 0, '2-1'), /FOREIGN KEY/);
  assert.throws(() => db.prepare('UPDATE catalog_update SET sequence=? WHERE ordinal=0').run('text'), /INT|INTEGER/);
});

test('insert and verification failures roll back all metadata tables while retaining unrelated rows', t => {
  const db = fixture(t, false);
  db.exec("CREATE TABLE unrelated(value TEXT) STRICT; INSERT INTO unrelated VALUES ('retained')");
  for (const suffix of [
    "CREATE TRIGGER forced_failure BEFORE INSERT ON catalog_update BEGIN SELECT RAISE(ABORT,'forced failure'); END;",
    "CREATE TRIGGER corrupt_insert AFTER INSERT ON catalog_update BEGIN UPDATE catalog_official_line SET color='#000000'; END;",
  ]) {
    assert.throws(() => initializeCatalogMetadata(db, { ...options, schemaSql: schemaSql + suffix }));
    assert.equal(db.isTransaction, false);
    assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['unrelated']);
    assert.equal(db.prepare('SELECT value FROM unrelated').get().value, 'retained');
  }
});

test('reads succeed with SELECT-only connection and filesystem, parser, and fetch denied', t => {
  const db = fixture(t);
  db.exec('PRAGMA query_only=ON');
  const restores = [];
  const denied = () => { throw new Error('source access denied'); };
  const replace = (owner, key) => {
    const previous = owner[key];
    owner[key] = denied;
    restores.push(() => { owner[key] = previous; });
  };
  try {
    for (const key of ['readFileSync', 'readSync', 'openSync', 'createReadStream', 'readFile', 'open']) replace(fs, key);
    for (const key of ['readFile', 'open']) replace(fsp, key);
    replace(JSON, 'parse'); replace(globalThis, 'fetch');
    const guarded = {
      prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /source_record|json_|archive/i);
        return db.prepare(sql);
      },
      exec: denied,
    };
    assert.deepEqual(readCatalogMetadata(guarded), sources);
  } finally { restores.reverse().forEach(restore => restore()); }
});
