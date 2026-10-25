import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { parsePersonRightsPermissions } from '../person-rights-permissions.mjs';
import { initializePermissionStore, readPermissionStore, readParsedPermissionStore, updatePermissionStore } from './permission-store.mjs';
import { loadPersonDetailSources } from './person-detail-inputs.mjs';
import { openReadOnly } from './db.mjs';
import { readSourceArchive } from './source-archive.mjs';

const canonical = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url).pathname);
let approvedBytes;
try { approvedBytes = Buffer.from(canonical.prepare('SELECT bytes FROM permission_archive WHERE singleton=1').get().bytes); }
finally { canonical.close(); }
const registry = JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json')).persons;
const source = JSON.parse(approvedBytes.toString('utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const command = { approvedBytes, expectedSha256: hash(approvedBytes), actor: 'permission-store-test', reason: 'actual source preservation verification' };
const directory = fs.mkdtempSync(join(tmpdir(), 'permission-store-'));
const path = join(directory, 'permissions.sqlite');
function open(path = ':memory:', options = {}) {
  const db = new DatabaseSync(path, options);
  db.exec('PRAGMA foreign_keys=ON');
  return db;
}
// Only the existing identity boundary is needed; IDs come from the actual registry.
function identity(db) {
  db.exec('CREATE TABLE person (person_id TEXT PRIMARY KEY) STRICT');
  for (const { id } of registry) db.prepare('INSERT INTO person VALUES (?)').run(id);
}
function variant(mutate) {
  const raw = structuredClone(source); mutate(raw);
  const bytes = Buffer.from(JSON.stringify(raw));
  return { ...command, approvedBytes: bytes, expectedSha256: hash(bytes) };
}
function empty(db) {
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name GLOB 'permission_*'").get().n, 0);
  assert.equal(db.isTransaction, false);
}
let db;
try {
  db = open(path); identity(db);
  assert.deepEqual(initializePermissionStore(db, command), { sourceSha256: command.expectedSha256, persons: 6, editable: false });
  assert.deepEqual(readPermissionStore(db), source);
  assert.deepEqual(Object.keys(readPermissionStore(db).persons), ['K998', 'K1007', 'K1008', 'K1003', 'K1009', 'K1019']);
  assert.deepEqual(readParsedPermissionStore(db), parsePersonRightsPermissions(source, registry));
  assert.equal(readParsedPermissionStore(db).size, 6);
  assert.deepEqual(await loadPersonDetailSources({ db, inputSubset: 'permissions' }), {
    personRightsPermissions: parsePersonRightsPermissions(source, registry),
  });
  assert.equal(db.prepare('SELECT count(*) AS n FROM permission_scope').get().n, 12);
  assert.equal(db.prepare("SELECT count(*) AS n FROM permission_scope WHERE status='granted' AND date IS NULL AND recorded_on='2026-10-03'").get().n, 12);
  assert.equal(db.prepare('SELECT count(*) AS n FROM permission_use').get().n, 0);
  assert.deepEqual(Buffer.from(db.prepare('SELECT bytes FROM permission_archive').get().bytes), approvedBytes);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.throws(() => initializePermissionStore(db, command), { code: 'E_PERMISSION_INITIALIZED' });
  for (const change of [{ status: 'revoked' }, { status: 'granted', uses: ['wiki-display'] }, { persons: {} }]) {
    assert.throws(() => updatePermissionStore(db, { expectedHead: command.expectedSha256, actor: 'test', reason: 'no admitted editor', change }), { code: 'E_PERMISSION_READ_ONLY' });
  }
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name GLOB 'permission_*'").all();
  for (const { name } of tables) {
    const columns = db.prepare(`PRAGMA table_info(${name})`).all();
    assert.ok(columns.every(c => !/json|payload|tree/i.test(c.name)), name);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type='trigger' AND tbl_name=?").get(name).n, 3);
    if (db.prepare(`SELECT count(*) AS n FROM ${name}`).get().n) {
      assert.throws(() => db.exec(`UPDATE ${name} SET ${columns[0].name}=${columns[0].name}`), /immutable permission authority/);
      assert.throws(() => db.exec(`DELETE FROM ${name}`), /immutable permission authority/);
      assert.throws(() => db.exec(`INSERT INTO ${name} SELECT * FROM ${name}`), /immutable permission authority/);
    }
  }
  db.close(); db = open(path, { readOnly: true });
  const originalRead = fs.readFileSync, originalParse = JSON.parse;
  try {
    fs.readFileSync = () => { throw new Error('runtime filesystem access'); }; syncBuiltinESMExports();
    JSON.parse = () => { throw new Error('runtime JSON parsing'); };
    const guarded = { prepare(sql) { assert.ok(!/permission_archive/i.test(sql)); return db.prepare(sql); } };
    assert.deepEqual(readPermissionStore(guarded), source);
    assert.deepEqual(readParsedPermissionStore(guarded), parsePersonRightsPermissions(source, registry));
  } finally { fs.readFileSync = originalRead; syncBuiltinESMExports(); JSON.parse = originalParse; }
  assert.throws(() => db.exec("UPDATE permission_scope SET status='revoked'"), /readonly|read-only/i);

  const scratch = open(); identity(scratch);
  try {
    assert.throws(() => initializePermissionStore(scratch, { ...command, expectedSha256: '0'.repeat(64) }), { code: 'E_PERMISSION_HASH' }); empty(scratch);
    assert.throws(() => initializePermissionStore(scratch, { ...command, actor: '' }), { code: 'E_PERMISSION_PROVENANCE' }); empty(scratch);
    assert.throws(() => initializePermissionStore(scratch, { ...command, extra: true }), { code: 'E_PERMISSION_COMMAND' }); empty(scratch);
    const invalid = [
      [r => { r.extra = 1; }, /E_PERSON_RIGHTS_SCHEMA/],
      [r => { r.persons.K9999 = r.persons.K998; }, /E_PERSON_RIGHTS_IDENTITY/],
      [r => { r.persons.K998.applicability = 'fictional'; }, /E_PERSON_RIGHTS_APPLICABILITY/],
      [r => { r.persons.K998.nameUse.privateContact = 'x'; }, /E_PERSON_RIGHTS_PRIVATE_FIELD/],
      [r => { r.persons.K998.nameUse.status = 'approved'; }, /E_PERSON_RIGHTS_STATUS/],
      [r => { r.persons.K998.nameUse.uses = ['unknown']; }, /E_PERSON_RIGHTS_USES/],
      [r => { r.persons.K998.nameUse.uses = ['wiki-display', 'wiki-display']; }, /E_PERSON_RIGHTS_USES/],
      [r => { r.persons.K998.nameUse.status = 'revoked'; r.persons.K998.nameUse.uses = ['game-use']; }, /E_PERSON_RIGHTS_INACTIVE_GRANT/],
      [r => { r.persons.K998.nameUse.date = '2026-02-30'; }, /E_PERSON_RIGHTS_DATE/],
      [r => { r.persons.K998.nameUse.evidenceRef = 'private/path'; }, /E_PERSON_RIGHTS_EVIDENCE_REF/],
      [r => { delete r.persons.K998.nameUse.recordedOn; }, /E_PERSON_RIGHTS_GRANT_EVIDENCE/],
      [r => { r.persons.K998.nameUse.priorLicenses = {}; }, /E_PERSON_RIGHTS_PRIOR_LICENSE/],
      [r => { r.persons.K998.nameUse.priorLicenses = [{ sourceRef: '/private' }]; }, /E_PERSON_RIGHTS_PRIOR_LICENSE_REF/],
    ];
    for (const [mutate, error] of invalid) { assert.throws(() => initializePermissionStore(scratch, variant(mutate)), error); empty(scratch); }
    scratch.prepare("DELETE FROM person WHERE person_id='K998'").run();
    assert.throws(() => initializePermissionStore(scratch, command), /E_PERSON_RIGHTS_IDENTITY/); empty(scratch);
    scratch.prepare('INSERT INTO person VALUES (?)').run('K998');
    // Inject a genuine FK violation after DDL, archive insertion and metadata insertion.
    const injected = { get isTransaction() { return scratch.isTransaction; }, exec(sql) { return scratch.exec(sql); }, prepare(sql) {
      const statement = scratch.prepare(sql);
      if (sql.startsWith('INSERT INTO permission_person ')) return { run(...args) { args[0] = 'K9999'; return statement.run(...args); } };
      return statement;
    } };
    assert.throws(() => initializePermissionStore(injected, command), /FOREIGN KEY constraint failed/); empty(scratch);
    initializePermissionStore(scratch, command);
    assert.deepEqual(readPermissionStore(scratch), source);
  } finally { scratch.close(); }

  // Preserve every supported optional field, absence, scope null, use/license order.
  const optionalCommand = variant(r => {
    delete r.persons.K998.nameUse;
    r.persons.K998.likenessUse = null;
    r.persons.K1007.nameUse = { status: 'not-recorded', uses: [], priorLicenses: [] };
    r.persons.K1008.nameUse.status = 'declined';
    r.persons.K1003.nameUse.status = 'revoked';
    r.persons.K1009.nameUse.date = '2026-10-02';
    r.persons.K1019.nameUse.uses = ['commercial-use', 'wiki-display', 'game-use'];
    const ref = 'https://github.com/islee23520/seoul-dengoku-wiki/issues/';
    r.persons.K1019.nameUse.priorLicenses = [2, 1].map(n => ({ sourceRef: ref + n, licenseRef: ref + (n + 2), conditionsRef: ref + (n + 4) }));
  });
  const optional = open(); identity(optional);
  try {
    initializePermissionStore(optional, optionalCommand);
    const expected = JSON.parse(optionalCommand.approvedBytes.toString('utf8'));
    assert.deepEqual(readPermissionStore(optional), expected);
    assert.deepEqual(readParsedPermissionStore(optional), parsePersonRightsPermissions(expected, registry));
    assert.deepEqual(optional.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { optional.close(); }
  console.log(`permission-store: PASS; source ${command.expectedSha256}; 6 people, 12 scopes, ${tables.length} typed tables; full raw/Map parity, immutable SQL, DB-only read-only reopen without FS/JSON/archive, parser validation, FK rollback and optional-field preservation`);
} finally {
  if (db?.isOpen) db.close();
  fs.rmSync(directory, { recursive: true, force: true });
}
