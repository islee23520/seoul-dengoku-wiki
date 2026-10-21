import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { initializePortraitStore, readPortraitDocuments, readPortraitArchive, appendAlreadyApprovedPortrait } from './portrait-store.mjs';
import { openReadOnly } from './db.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const root = new URL('../../', import.meta.url);
const currentArchive = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
let sources;
try { sources = Object.fromEntries(['catalog', 'properties', 'selection'].map(kind => [kind, readPortraitArchive(currentArchive, kind).bytes])); }
finally { currentArchive.close(); }
const expected = Object.fromEntries(Object.entries(sources).map(([k, b]) => [k, JSON.parse(b)]));
const command = () => Object.fromEntries(Object.entries(sources).map(([k, bytes]) => [k,
  { bytes, expectedSha256: hash(bytes), actor: 'portrait-store-test', reason: 'Exact authored-root snapshot test' }]));
function memory() {
  const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys=ON'); return db;
}
function changed(kind, fn) {
  const c = command(); const d = structuredClone(expected[kind]); fn(d);
  c[kind].bytes = Buffer.from(JSON.stringify(d)); c[kind].expectedSha256 = hash(c[kind].bytes); return c;
}
function rejectsImport(c, code) {
  const db = memory();
  try {
    assert.throws(() => initializePortraitStore(db, c), e => e.code === code);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name GLOB 'portrait_*'").get().n, 0);
  } finally { db.close(); }
}
const temp = mkdtempSync(join(tmpdir(), 'portrait-authority-'));
try {
  assert.equal(expected.catalog.entries.length, 25);
  assert.equal(Object.keys(expected.properties.entries).length, 25);
  assert.equal(expected.selection.records.length, 24);
  const path = join(temp, 'portraits.sqlite');
  const db = new DatabaseSync(path); db.exec('PRAGMA foreign_keys=ON');
  // Internal identity is deliberately unlike both public key and character ID.
  db.exec('CREATE TABLE person(person_id TEXT PRIMARY KEY, public_key TEXT UNIQUE NOT NULL, name TEXT NOT NULL) STRICT');
  db.prepare('INSERT INTO person VALUES(?,?,?)').run('internal-998', 'person-0998', '이일섭');
  db.prepare('INSERT INTO person VALUES(?,?,?)').run('person-1003', 'unrelated-public-key', 'unrelated');
  assert.deepEqual(initializePortraitStore(db, command()), { revision: 1, catalog: 25, properties: 25, selection: 24, readOnly: true });
  const actual = readPortraitDocuments(db);
  assert.deepEqual(actual, expected);
  for (const kind of Object.keys(expected)) assert.equal(JSON.stringify(actual[kind]), JSON.stringify(expected[kind]));
  assert.deepEqual(actual.catalog.entries.map(c => c.personId), expected.catalog.entries.map(c => c.personId));
  assert.equal(actual.selection.canonPromotion, false);
  assert.equal(actual.selection.final3dPortraitContractSatisfied, false);
  assert.equal(actual.properties.entries['person-1017'].identity, undefined);
  assert.equal(actual.properties.entries['person-1003'].slots.body.weight.unit, null);
  assert.deepEqual(db.prepare('SELECT * FROM portrait_existing_person').all().map(r => ({ ...r })), [{ personId: 'person-0998', existingPersonId: 'internal-998' }]);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.throws(() => db.exec("INSERT INTO portrait_existing_person VALUES('missing','internal-998')"), /E_PORTRAIT_READ_ONLY/);
  for (const kind of Object.keys(sources)) {
    const a = readPortraitArchive(db, kind);
    assert.deepEqual(a.bytes, sources[kind]); assert.equal(a.sha256, hash(sources[kind]));
    assert.equal(a.actor, 'portrait-store-test');
    for (const op of [`UPDATE portrait_archive SET reason='changed' WHERE kind='${kind}'`, `DELETE FROM portrait_archive WHERE kind='${kind}'`]) assert.throws(() => db.exec(op), /E_PORTRAIT_READ_ONLY/);
  }
  const before = JSON.stringify(actual);
  await assert.rejects(appendAlreadyApprovedPortrait(db, { expectedRevision: 0 }), e => e.code === 'E_PORTRAIT_REVISION');
  await assert.rejects(appendAlreadyApprovedPortrait(db, { expectedRevision: 1, verdict: 'pass', approvalEvidence: { selectedImageSHA: expected.catalog.entries[0].imageSha256 } }), e => e.code === 'E_PORTRAIT_APPROVAL_CAPABILITY');
  assert.equal(JSON.stringify(readPortraitDocuments(db)), before);
  assert.throws(() => initializePortraitStore(db, command()), e => e.code === 'E_PORTRAIT_INITIALIZED');
  db.close();

  const reopened = new DatabaseSync(path, { readOnly: true });
  const parse = JSON.parse; const read = fs.readFileSync;
  try {
    JSON.parse = () => { throw new Error('JSON.parse is forbidden after initialization'); };
    fs.readFileSync = () => { throw new Error('filesystem read is forbidden after initialization'); };
    syncBuiltinESMExports();
    assert.deepEqual(readPortraitDocuments(reopened), expected);
    assert.deepEqual(readPortraitArchive(reopened, 'properties').bytes, sources.properties);
  } finally { JSON.parse = parse; fs.readFileSync = read; syncBuiltinESMExports(); reopened.close(); }

  rejectsImport(changed('catalog', c => { c.entries[0].generationReceipt = {}; }), 'E_PORTRAIT_FIELDS');
  rejectsImport(changed('properties', p => { p.entries['person-1003'].identity.ethnicity.secret = 'PRIVATE_SENTINEL'; }), 'E_PORTRAIT_FIELDS');
  rejectsImport(changed('properties', p => { p.entries['person-1003'].slots.face.description.value = 42; }), 'E_PORTRAIT_TYPE');
  rejectsImport(changed('selection', s => { s.records[0].approvalSource = '/Users/private/PRIVATE_SENTINEL'; }), 'E_PORTRAIT_SELECTION');
  rejectsImport(changed('selection', s => { s.records[0].name = '/Users/private/PRIVATE_SENTINEL'; }), 'E_PORTRAIT_SELECTION');
  rejectsImport(changed('selection', s => { s.canonPromotion = true; }), 'E_PORTRAIT_SELECTION');
  rejectsImport(changed('selection', s => { delete s.records[0].previousImageSha256; }), 'E_PORTRAIT_SELECTION');
  rejectsImport(changed('properties', p => { delete p.entries['person-0719']; }), 'E_PORTRAIT_IDENTITY');
  const wrongHash = command(); wrongHash.properties.expectedSha256 = '0'.repeat(64); rejectsImport(wrongHash, 'E_PORTRAIT_HASH');
  const noActor = command(); noActor.selection.actor = ' '; rejectsImport(noActor, 'E_PORTRAIT_PROVENANCE');

  // Failure after DDL and several inserts must roll back the entire import.
  const rollback = memory();
  rollback.exec('CREATE TABLE person(person_id TEXT PRIMARY KEY, public_key TEXT UNIQUE NOT NULL, name TEXT NOT NULL) STRICT');
  rollback.prepare('INSERT INTO person VALUES(?,?,?)').run('internal', expected.catalog.entries[1].personId, 'wrong identity');
  assert.throws(() => initializePortraitStore(rollback, command()), e => e.code === 'E_PORTRAIT_IDENTITY');
  assert.equal(rollback.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name GLOB 'portrait_*'").get().n, 0);
  rollback.close();

  // A missing nested or root row cannot silently shrink a valid document.
  for (const [table, where] of [['portrait_slot_evidence', "personId='person-1003' AND slot='face' AND field='description'"], ['portrait_identity', "personId='person-1003'"], ['portrait_catalog', "personId='person-0719'"]]) {
    const damaged = memory(); initializePortraitStore(damaged, command());
    damaged.exec(`DROP TRIGGER ${table}_sealed_DELETE; PRAGMA foreign_keys=OFF; DELETE FROM ${table} WHERE ${where}`);
    assert.throws(() => readPortraitDocuments(damaged), /E_PORTRAIT_(INCOMPLETE|FIELDS)/);
    damaged.close();
  }
  // Source content is preserved, not scrubbed by broad path/word removal.
  assert.match(actual.properties.entries['person-1004'].slots.hair.color.source, /^GAME-REFERENCE\//);
  assert.doesNotMatch(JSON.stringify(actual.selection), /generationReceipt|generationRequest|approvalSource|PRIVATE_SENTINEL/);
  // Reordered admitted objects retain exact key order rather than schema order.
  const ordered = command(); const reordered = structuredClone(expected);
  const p = reordered.properties.entries['person-1003'];
  p.identity.ethnicity = { source: p.identity.ethnicity.source, value: p.identity.ethnicity.value, status: p.identity.ethnicity.status };
  ordered.properties.bytes = Buffer.from(JSON.stringify(reordered.properties)); ordered.properties.expectedSha256 = hash(ordered.properties.bytes);
  const orderDb = memory(); initializePortraitStore(orderDb, ordered);
  assert.equal(JSON.stringify(readPortraitDocuments(orderDb).properties), JSON.stringify(reordered.properties)); orderDb.close();
  console.log('PORTRAIT_STORE_OK catalog=25 properties=25 selection=24; full parity, readonly reopen, rejection, rollback, and missing-row checks passed');
} finally { rmSync(temp, { recursive: true, force: true }); }
