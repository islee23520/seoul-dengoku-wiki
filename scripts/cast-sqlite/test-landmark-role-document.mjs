import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { readFile, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { LANDMARK_ROLE_SOURCE_HASH, LANDMARK_ROLE_DOCUMENT_HASH, initializeLandmarkRoleDocument, readLandmarkRoleDocument } from './landmark-role-document.mjs';

const dir = await mkdtemp(join(tmpdir(), 'landmark-role-document-'));
after(() => rm(dir, { recursive: true, force: true }));
const dbPath = join(dir, 'landmark-roles.sqlite');
const db = new DatabaseSync(dbPath);
after(() => db.close());
db.exec("PRAGMA foreign_keys=ON; CREATE TABLE untouched (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO untouched VALUES (1, 'unchanged')");
const sourceBytes = readSourceArchive('lore/places/landmark-roles.json', LANDMARK_ROLE_SOURCE_HASH);
const schemaSql = await readFile(new URL('./landmark-role-document.sql', import.meta.url), 'utf8');
const canonicalSchemaSql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
const expected = JSON.parse(sourceBytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const options = { schemaSql, sourceBytes, expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH, actor: 'landmark-role-document-test', reason: 'Verify bounded full source without changing approval' };
const typed = connection => new Proxy(connection, { get(target, property, receiver) {
  if (property !== 'prepare') return Reflect.get(target, property, receiver);
  return sql => {
    assert.match(sql, /^SELECT /u);
    assert.doesNotMatch(sql, /\bsource_file\b|\bsource_record\b|\bjson_(?:extract|each|tree)\b/iu);
    return target.prepare(sql);
  };
} });
initializeLandmarkRoleDocument(db, options);
const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'landmark_role_document%' ORDER BY name").all().map(row => row.name);

const CANONICAL_TABLE_COUNT = 311;
const CANONICAL_SENTINELS = ['build_metadata', 'source_file', 'source_record', 'family_role_decision', 'family_role_decision_fact', 'family_role_decision_source', 'household_manifest', 'person', 'state'];

test('whole actual source serialized parity and the fixed 19-site denominator', () => {
  const actual = readLandmarkRoleDocument(db, { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH });
  assert.equal(sourceBytes.length, 10485);
  assert.equal(hash(sourceBytes), LANDMARK_ROLE_SOURCE_HASH);
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(hash(JSON.stringify(actual)), LANDMARK_ROLE_DOCUMENT_HASH);
  assert.deepEqual(Object.keys(actual), ['schema', 'epoch', 'decisionSource', 'geometryAttribution', 'sites']);
  assert.equal(actual.sites.length, 19);
  assert.equal(actual.sites.filter(site => site.connectionStationId === null).length, 18);
  assert.equal(actual.sites.filter(site => site.connectionStationId === '잠실').length, 1);
  assert.equal(actual.sites[5].lat, 37.5125537);
  assert.equal(actual.sites[5].lon, 127.102679);
  assert.equal(db.prepare('SELECT count(*) AS n FROM landmark_role_document_site').get().n, 19);
  assert.equal(db.prepare('SELECT count(*) AS n FROM landmark_role_document_import').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM landmark_role_document').get().n, 1);
  assert.equal(db.prepare("SELECT value FROM untouched").get().value, 'unchanged');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  console.log('LANDMARK_ROLE_DENOMINATORS sites=19; nullStations=18; stringStations=1');
});

test('missing, changed, and extra rows on every consumed table and authored scalar column fail closed', () => {
  assert.deepEqual(tables, ['landmark_role_document', 'landmark_role_document_import', 'landmark_role_document_key', 'landmark_role_document_site']);
  let mutations = 0;
  const reject = (sql, params = []) => {
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON; PRAGMA ignore_check_constraints=ON');
    try {
      const change = db.prepare(sql).run(...params);
      assert.ok(change.changes > 0, sql);
      assert.throws(() => readLandmarkRoleDocument(typed(db), { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH }), { code: 'E_LANDMARK_ROLE_DOCUMENT' }, sql);
      mutations++;
    } finally { db.exec('ROLLBACK; PRAGMA ignore_check_constraints=OFF'); }
  };
  for (const table of tables) {
    reject('DELETE FROM ' + table + ' WHERE rowid=(SELECT max(rowid) FROM ' + table + ')');
    const row = db.prepare('SELECT rowid AS mutation_rowid, * FROM ' + table + ' ORDER BY rowid LIMIT 1').get();
    for (const [key, value] of Object.entries(row)) {
      if (key === 'mutation_rowid') continue;
      if (table === 'landmark_role_document_import' && ['actor', 'reason'].includes(key)) {
        reject('UPDATE ' + table + ' SET "' + key + '"=? WHERE rowid=?', ['', row.mutation_rowid]);
        continue;
      }
      const replacement = typeof value === 'number'
        ? (Number.isInteger(value) ? value + 100000 : value + 0.5)
        : value === null ? 'changed-null' : value + ' changed';
      reject('UPDATE ' + table + ' SET "' + key + '"=? WHERE rowid=?', [replacement, row.mutation_rowid]);
    }
    const inserted = db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid LIMIT 1').get();
    const keys = Object.keys(inserted);
    if (table === 'landmark_role_document_key') { inserted.ordinal = 999; inserted.key = 'unknown-extra'; }
    else if (table === 'landmark_role_document_site') inserted.ordinal = 999;
    else inserted.singleton = 2;
    reject('INSERT INTO ' + table + ' (' + keys.map(key => '"' + key + '"').join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')', Object.values(inserted));
  }
  assert.equal(JSON.stringify(readLandmarkRoleDocument(db, { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH })), JSON.stringify(expected));
  console.log('LANDMARK_ROLE_REJECTED_MUTATIONS ' + mutations);
});

test('wrong pins, explicit import contract, strict unknown fields and invalid nested types reject', () => {
  assert.throws(() => readLandmarkRoleDocument(db, { expectedSourceHash: '0'.repeat(64) }), { code: 'E_LANDMARK_ROLE_DOCUMENT' });
  assert.throws(() => readLandmarkRoleDocument(db, { expectedSourceHash: undefined }), { code: 'E_LANDMARK_ROLE_DOCUMENT' });
  for (const changes of [{ actor: '' }, { reason: ' ' }, { schemaSql: undefined }, { expectedSourceHash: undefined },
    { expectedSourceHash: '0'.repeat(64) }, { sourceBytes: Buffer.from('{}') }, { sourceBytes: Buffer.concat([sourceBytes, Buffer.from('\n')]) }, { sourceBytes: 'not bytes' }])
    assert.throws(() => initializeLandmarkRoleDocument(db, { ...options, ...changes }), { code: 'E_LANDMARK_ROLE_DOCUMENT' });
  const edits = [
    document => { document.unknown = true; },
    document => { document.sites[0].unknown = true; },
    document => { delete document.epoch; },
    document => { delete document.sites[0].lat; },
    document => { document.sites = null; },
    document => { document.sites[0].connectionStationId = 1; },
    document => { document.sites[0].lat = '37.5'; },
    document => { document.sites[0].lon = Number.NaN; },
  ];
  for (const edit of edits) {
    const changed = structuredClone(expected);
    edit(changed);
    assert.throws(() => initializeLandmarkRoleDocument(db, { ...options, sourceBytes: Buffer.from(JSON.stringify(changed)) }), /unknown field|missing field|array:|type:|source bytes\/hash/u);
  }
  db.exec('BEGIN');
  try { assert.throws(() => initializeLandmarkRoleDocument(db, options), /explicit SQL\/transaction/u); }
  finally { db.exec('ROLLBACK'); }
  assert.throws(() => initializeLandmarkRoleDocument(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  assert.equal(JSON.stringify(readLandmarkRoleDocument(db, { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH })), JSON.stringify(expected));
});

test('failed post-insert full-document validation rolls back DDL and all writes', () => {
  const fresh = new DatabaseSync(':memory:');
  fresh.exec("CREATE TABLE untouched (value TEXT); INSERT INTO untouched VALUES ('unchanged')");
  try {
    const badSql = schemaSql + "\nCREATE TRIGGER change_import AFTER INSERT ON landmark_role_document_import BEGIN UPDATE landmark_role_document SET epoch='changed'; END;";
    assert.throws(() => initializeLandmarkRoleDocument(fresh, { ...options, schemaSql: badSql }), { code: 'E_LANDMARK_ROLE_DOCUMENT' });
    assert.equal(fresh.isTransaction, false);
    assert.deepEqual(fresh.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name), ['untouched']);
    assert.equal(fresh.prepare('SELECT value FROM untouched').get().value, 'unchanged');
    initializeLandmarkRoleDocument(fresh, options);
    assert.equal(JSON.stringify(readLandmarkRoleDocument(fresh, { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH })), JSON.stringify(expected));
  } finally { fresh.close(); }
});

test('fresh runtime imports and repeated read-only reopen work with source filesystem and JSON parser denied', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite'; import { createHash } from 'node:crypto';
    const deny = () => { throw Error('source filesystem/parser denied'); };
    const original = fs.readFileSync;
    const originalOpen = fs.openSync;
    fs.readFileSync = (p, ...a) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? original(p, ...a) : deny();
    fs.openSync = (p, ...a) => /\\.(?:mjs|js|cjs)$/.test(String(p)) ? originalOpen(p, ...a) : deny();
    for (const key of ['readFile', 'readdir', 'readdirSync', 'open', 'stat', 'statSync', 'access', 'accessSync']) fs[key] = deny;
    for (const key of ['readFile', 'readdir', 'open', 'stat', 'access']) fsp[key] = deny;
    syncBuiltinESMExports(); JSON.parse = deny;
    const { readLandmarkRoleDocument } = await import(${JSON.stringify(new URL('./landmark-role-document.mjs', import.meta.url).href)});
    for (let reopen = 0; reopen < 2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
      const typed = { prepare(sql) { assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /source_file|source_record|json_extract|json_each|json_tree/i); return db.prepare(sql); } };
      for (let repeat = 0; repeat < 2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readLandmarkRoleDocument(typed, { expectedSourceHash: ${JSON.stringify(LANDMARK_ROLE_SOURCE_HASH)} }))).digest('hex'), ${JSON.stringify(LANDMARK_ROLE_DOCUMENT_HASH)});
      db.close();
    }
    console.log('LANDMARK_ROLE_DB_ONLY_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /LANDMARK_ROLE_DB_ONLY_EXACT/u);
});

test('new tables coexist with the canonical schema inventory and a canonical database copy', () => {
  const declared = [...canonicalSchemaSql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+("?)([A-Za-z0-9_]+)/gu)].map(match => match[2]);
  assert.equal(declared.length, 44);
  assert.equal(declared.some(name => name.startsWith('landmark_role_document')), false);
  const memory = new DatabaseSync(':memory:');
  try {
    memory.exec('PRAGMA foreign_keys=ON');
    memory.exec(canonicalSchemaSql);
    const before = memory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(before, declared.slice().sort());
    initializeLandmarkRoleDocument(memory, options);
    const after = memory.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(after.filter(name => !name.startsWith('landmark_role_document')), before);
    assert.deepEqual(after.filter(name => name.startsWith('landmark_role_document')), tables);
    assert.equal(JSON.stringify(readLandmarkRoleDocument(typed(memory), { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH })), JSON.stringify(expected));
    assert.equal(memory.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(memory.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { memory.close(); }

  const copyPath = join(dir, 'wiki-cast.copy.sqlite');
  return copyFile(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url), copyPath).then(() => {
    const canonical = new DatabaseSync(copyPath);
    try {
      const inventory = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.equal(inventory.length, CANONICAL_TABLE_COUNT);
      for (const sentinel of CANONICAL_SENTINELS) assert.equal(inventory.includes(sentinel), true, sentinel);
      assert.equal(inventory.some(name => name.startsWith('landmark_role_document')), false);
      const fingerprints = Object.fromEntries(CANONICAL_SENTINELS.map(name => [name, canonical.prepare('SELECT count(*) AS n FROM "' + name + '"').get().n]));
      initializeLandmarkRoleDocument(canonical, options);
      const grown = canonical.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
      assert.deepEqual(grown.filter(name => !name.startsWith('landmark_role_document')), inventory);
      assert.deepEqual(grown.filter(name => name.startsWith('landmark_role_document')), tables);
      for (const [name, count] of Object.entries(fingerprints)) assert.equal(canonical.prepare('SELECT count(*) AS n FROM "' + name + '"').get().n, count, name);
      assert.equal(JSON.stringify(readLandmarkRoleDocument(typed(canonical), { expectedSourceHash: LANDMARK_ROLE_SOURCE_HASH })), JSON.stringify(expected));
      assert.equal(canonical.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
      assert.deepEqual(canonical.prepare('PRAGMA foreign_key_check').all(), []);
      console.log('LANDMARK_ROLE_COEXISTENCE canonicalTables=' + inventory.length + '; added=' + tables.length);
    } finally { canonical.close(); }
  });
});
