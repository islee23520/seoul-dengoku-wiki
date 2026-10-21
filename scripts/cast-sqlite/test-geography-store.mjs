import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { initializeGeographyStore, readGeographyStore, updateGeographyStore } from './geography-store.mjs';

// Tests import a fixed repository fixture; runtime readers never discover source files.
const sourcePath = resolve(process.env.GEOGRAPHY_STORE_SOURCE ?? resolve(import.meta.dirname, '../../lore/regions/seoul-electoral-titles.json'));
assert.equal(sourcePath, resolve(import.meta.dirname, '../../lore/regions/seoul-electoral-titles.json'));
const approvedBytes = fs.readFileSync(sourcePath);
const expectedSha256 = createHash('sha256').update(approvedBytes).digest('hex');
const source = JSON.parse(approvedBytes.toString('utf8'));
const command = { approvedBytes, expectedSha256, actor: 'geography-store-test', reason: 'explicit actual-source relational migration verification' };
const directory = fs.mkdtempSync(join(tmpdir(), 'geography-store-'));
const path = join(directory, 'authority.sqlite');
let db;
function open(path = ':memory:', options = {}) {
  const connection = new DatabaseSync(path, options);
  connection.exec('PRAGMA foreign_keys=ON');
  return connection;
}
function variant(mutate) {
  const value = structuredClone(source); mutate(value);
  const bytes = Buffer.from(JSON.stringify(value));
  return { ...command, approvedBytes: bytes, expectedSha256: createHash('sha256').update(bytes).digest('hex') };
}
function empty(connection) {
  assert.equal(connection.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name GLOB 'geography_*'").get().n, 0);
  assert.equal(connection.isTransaction, false);
}
try {
  db = open(path);
  const result = initializeGeographyStore(db, command);
  assert.deepEqual(result, { sourceSha256: expectedSha256, titles: 80, datedSlots: 426, currentSlots: 427, editable: false });
  assert.deepEqual(readGeographyStore(db), source, 'every field, optional presence, scalar, stable ID and array order must roundtrip');
  assert.equal(db.prepare('SELECT count(*) AS n FROM geography_county').get().n, 96);
  assert.equal(db.prepare('SELECT count(*) AS n FROM geography_source_record').get().n, source.sourceRecords.length);
  assert.deepEqual(Buffer.from(db.prepare('SELECT bytes FROM geography_archive').get().bytes), approvedBytes);
  assert.equal(db.prepare('SELECT sha256 FROM geography_archive').get().sha256, expectedSha256);
  assert.throws(() => initializeGeographyStore(db, command), { code: 'E_GEOGRAPHY_INITIALIZED' });
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');

  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name GLOB 'geography_*'").all();
  for (const { name } of tables) {
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type='trigger' AND tbl_name=?").get(name).n, 3);
    const columns = db.prepare(`PRAGMA table_info(${name})`).all();
    assert.ok(columns.every(c => c.name === 'jsonPointer' || !/json|payload|document|tree/i.test(c.name)), name);
    if (db.prepare(`SELECT count(*) AS n FROM ${name}`).get().n) {
      assert.throws(() => db.exec(`UPDATE ${name} SET ${columns[0].name}=${columns[0].name}`), /immutable geography authority/);
      assert.throws(() => db.exec(`DELETE FROM ${name}`), /immutable geography authority/);
      assert.throws(() => db.exec(`INSERT INTO ${name} SELECT * FROM ${name}`), /immutable geography authority/);
    }
  }
  for (const change of [{ name: 'draft' }, { feudalParentTitleId: null }, { holderPersonId: 'person-0035' }, { approval: 'new' }]) {
    assert.throws(() => updateGeographyStore(db, { expectedRevision: expectedSha256, change, actor: 'test', reason: 'reject unsupported mutation' }), { code: 'E_GEOGRAPHY_READ_ONLY' });
  }
  assert.deepEqual(readGeographyStore(db), source);
  db.close();

  // Reopen the artifact independently; no source, archive or JSON parser is available to the reader.
  db = open(path, { readOnly: true });
  const originalRead = fs.readFileSync;
  const originalParse = JSON.parse;
  let reconstructed;
  try {
    fs.readFileSync = () => { throw new Error('reader attempted filesystem access'); };
    syncBuiltinESMExports();
    JSON.parse = () => { throw new Error('reader attempted JSON parsing'); };
    const guarded = { prepare(sql) {
      assert.ok(!/geography_archive/i.test(sql), 'archive must never supply current authority');
      return db.prepare(sql);
    } };
    reconstructed = readGeographyStore(guarded);
  } finally {
    fs.readFileSync = originalRead; syncBuiltinESMExports(); JSON.parse = originalParse;
  }
  assert.deepEqual(reconstructed, source);
  assert.throws(() => db.exec("UPDATE geography_title SET name='forbidden'"), /readonly|read-only/i);

  const scratch = open();
  try {
    assert.throws(() => initializeGeographyStore(scratch, { ...command, expectedSha256: '0'.repeat(64) }), { code: 'E_GEOGRAPHY_HASH' }); empty(scratch);
    assert.throws(() => initializeGeographyStore(scratch, { ...command, actor: '' }), { code: 'E_GEOGRAPHY_PROVENANCE' }); empty(scratch);
    const mutations = [
      d => { d.unknown = true; }, d => { d.evidence.membership.unknown = 1; },
      d => { d.editions.currentLaw.unknown = 1; }, d => { d.sourceRecords[0].unknown = 1; },
      d => { d.titles[0].unknown = 1; }, d => { d.countySlots[0].unknown = 1; },
      d => { d.countySlots[0].slots[0].unknown = 1; }, d => { d.currentCorrespondenceSlots[0].slots[0].unknown = 1; },
      d => { d.currentCorrespondenceSlots[0].slots[0].historicalHoldingRefs[0].unknown = 1; },
      d => { d.spatialSource.geometry.unknown = 1; }, d => { d.successor.approval.unknown = 1; },
      d => { d.successor.partition[0].unknown = 1; },
    ];
    for (const mutate of mutations) {
      assert.throws(() => initializeGeographyStore(scratch, variant(mutate)), { code: 'E_GEOGRAPHY_FIELDS' }); empty(scratch);
    }
    assert.throws(() => initializeGeographyStore(scratch, variant(d => { d.countySlots[0].slots[0].geometryVerified = 'false'; })), { code: 'E_GEOGRAPHY_TYPE' }); empty(scratch);
    assert.throws(() => initializeGeographyStore(scratch, variant(d => { d.currentCorrespondenceSlots[0].slots[0].holdingRefs.push('unapproved'); })), { code: 'E_GEOGRAPHY_RIGHTS' }); empty(scratch);
    // Deferred FK failure occurs at COMMIT after the entire import and trigger installation.
    assert.throws(() => initializeGeographyStore(scratch, variant(d => { d.titles[1].feudalParentTitleId = 'missing-title'; })), /FOREIGN KEY constraint failed/); empty(scratch);
    assert.throws(() => initializeGeographyStore(scratch, variant(d => { d.titles[1].titleId = d.titles[0].titleId; })), /UNIQUE constraint failed/); empty(scratch);
    assert.deepEqual(initializeGeographyStore(scratch, command), result, 'failed imports leave no schema or data behind');
    assert.deepEqual(readGeographyStore(scratch), source);
  } finally { scratch.close(); }
  console.log(`geography-store: PASS; actual source ${expectedSha256}; ${tables.length} typed domain tables; 80 titles; 426 dated and 427 current slots; full equality, read-only reopen without FS/JSON/archive, immutable SQL, rollback and fail-closed shapes`);
} finally {
  if (db?.isOpen) db.close();
  fs.rmSync(directory, { recursive: true, force: true });
}
