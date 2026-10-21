import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { PERSON_IDENTITY_SOURCE_HASHES, initializePersonIdentityInputs, readPersonIdentityInputs } from './person-identity-inputs.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';

const original = '/tmp/seoul-document-authority-20261020/bootstrap-issued-sheets-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(), 'person-identity-inputs-'));
after(() => rm(dir, { recursive: true, force: true }));
const lineageBytes = readSourceArchive('lore/name-pools/cast-hangnyeol.json', PERSON_IDENTITY_SOURCE_HASHES.lineage);
const genderBytes = readSourceArchive('lore/name-pools/gender-cast.json', PERSON_IDENTITY_SOURCE_HASHES.gender);
const lineage = JSON.parse(lineageBytes).people, gender = JSON.parse(genderBytes).people;
const expected = { lineageByName: new Map(lineage.map(p => [p.name, p])), genderByName: new Map(gender.map(p => [p.name, p])) };
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ordered = result => Object.fromEntries(Object.entries(result).map(([key, value]) => [key, [...value]]));
const options = { lineageBytes, genderBytes, expectedSourceHashes: PERSON_IDENTITY_SOURCE_HASHES,
  actor: 'person-identity-test', reason: 'Verify exact production map reconstruction on disposable DB copies' };
const dbPath = join(dir, 'identity.sqlite');
await copyFile(original, dbPath);
const db = new DatabaseSync(dbPath);
after(() => db.close());
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_file\b|\bsource_record\b|\braw_bytes\b|\bquality_issue\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
} });
await initializePersonIdentityInputs(db, options);

test('DB loader rejects an authority without identity receipts instead of reading source JSON', async () => {
  const incomplete = new DatabaseSync(original, { readOnly: true });
  try {
    await assert.rejects(loadDbInputs({ db: typedOnly(incomplete), inputSubset: 'identity' }),
      error => error.code === 'E_PERSON_IDENTITY_INPUT' && /person_identity_import/u.test(error.message));
  } finally { incomplete.close(); }
});

test('actual 1022-person lineage and gender Maps match complete values, map order and JSON key order', async () => {
  const actual = readPersonIdentityInputs(typedOnly(db));
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'identity' }), actual);
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(ordered(actual)), JSON.stringify(ordered(expected)));
  assert.equal(actual.lineageByName.size, 1022);
  assert.equal(actual.genderByName.size, 1022);
  for (const p of lineage) {
    assert.deepEqual(Object.keys(actual.lineageByName.get(p.name)), Object.keys(p));
    if (p.namingConvention === 'non-korean-lineage') {
      assert.equal(db.prepare('SELECT l.clan_id FROM person_lineage l JOIN person p USING(person_id) WHERE p.name=?').get(p.name).clan_id, null);
    }
  }
  const lost = lineage.filter(p => p.namingConvention === 'non-korean-lineage' && typeof p.clan === 'string');
  assert.ok(lost.length > 0);
  assert.equal(db.prepare('SELECT count(*) n FROM person_identity_legacy_clan').get().n, lost.length);
  for (const p of lost) assert.equal(actual.lineageByName.get(p.name).clan, p.clan);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('fresh reader import and read-only repeated reopen succeed with filesystem and JSON parsing denied', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('blocked filesystem/JSON.parse'); };
    const moduleRead = fs.readFileSync;
    fs.readFileSync = (path, ...args) => /\\.(?:mjs|js|cjs)$/.test(String(path)) ? moduleRead(path, ...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const {readPersonIdentityInputs} = await import(${JSON.stringify(new URL('./person-identity-inputs.mjs', import.meta.url).href)});
    for(let reopen=0;reopen<2;reopen++) {
      const db = new DatabaseSync(${JSON.stringify(dbPath)}, {readOnly:true});
      const typed = {prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /\\bsource_file\\b|\\bsource_record\\b|\\braw_bytes\\b|\\bquality_issue\\b|\\bjson_(?:extract|tree|each)\\b/i);
        return db.prepare(sql);
      }};
      for(let repeat=0;repeat<2;repeat++) {
        const output = Object.fromEntries(Object.entries(readPersonIdentityInputs(typed)).map(([k,v])=>[k,[...v]]));
        assert.equal(createHash('sha256').update(JSON.stringify(output)).digest('hex'), ${JSON.stringify(digest(ordered(expected)))});
      }
      db.close();
    }
    console.log('PERSON_IDENTITY_DB_ONLY_1022_MAPS_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /PERSON_IDENTITY_DB_ONLY_1022_MAPS_EXACT/u);
});

test('source pin, missing rows, unknown fields, missing versus null and domain drift reject', () => {
  assert.throws(() => readPersonIdentityInputs(db, { expectedSourceHashes: { ...PERSON_IDENTITY_SOURCE_HASHES, lineage: '0'.repeat(64) } }), { code: 'E_PERSON_IDENTITY_INPUT' });
  for (const sql of [
    "UPDATE person_identity_import SET source_sha256=printf('%064d',0) WHERE domain='lineage'",
    'DELETE FROM person_gender WHERE rowid=(SELECT max(rowid) FROM person_gender)',
    'DELETE FROM person_lineage WHERE rowid=(SELECT max(rowid) FROM person_lineage)',
    'DELETE FROM person_identity_key WHERE rowid=(SELECT max(rowid) FROM person_identity_key)',
    'DELETE FROM person_identity_order WHERE rowid=(SELECT max(rowid) FROM person_identity_order)',
    'DELETE FROM person_identity_legacy_clan WHERE rowid=(SELECT max(rowid) FROM person_identity_legacy_clan)',
    "UPDATE person_identity_key SET key='unknownField' WHERE rowid=1",
    'UPDATE person_identity_key SET is_null=1-is_null WHERE rowid=1',
    "UPDATE person_lineage SET surname='changed' WHERE rowid=1",
    "UPDATE person_gender SET gender='changed' WHERE rowid=1",
  ]) {
    db.exec('BEGIN');
    db.exec('PRAGMA defer_foreign_keys=ON');
    try { db.exec(sql); assert.throws(() => readPersonIdentityInputs(typedOnly(db)), { code: 'E_PERSON_IDENTITY_INPUT' }); }
    finally { db.exec('ROLLBACK'); }
  }
});

test('initializer authenticates bytes, explicit pins, audit fields, archive pins and rejects reimport', async () => {
  for (const changes of [{ actor: '' }, { reason: '' }, { expectedSourceHashes: undefined },
    { lineageBytes: Buffer.from('{}') }, { genderBytes: Buffer.from('{}') },
    { expectedSourceHashes: { ...PERSON_IDENTITY_SOURCE_HASHES, gender: '0'.repeat(64) } }]) {
    await assert.rejects(initializePersonIdentityInputs(db, { ...options, ...changes }), { code: 'E_PERSON_IDENTITY_INPUT' });
  }
  await assert.rejects(initializePersonIdentityInputs(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  const brokenPath = join(dir, 'broken.sqlite');
  await copyFile(original, brokenPath);
  const broken = new DatabaseSync(brokenPath);
  try {
    const wrongArchive = { prepare(sql) {
      if (sql === 'SELECT sha256 FROM source_file WHERE logical_path=?') return { all: () => [{ sha256: '0'.repeat(64) }] };
      return broken.prepare(sql);
    } };
    await assert.rejects(initializePersonIdentityInputs(wrongArchive, options), { code: 'E_PERSON_IDENTITY_INPUT' });
    broken.exec("UPDATE person_lineage SET reason='typed divergence' WHERE rowid=1");
    await assert.rejects(initializePersonIdentityInputs(broken, options), { code: 'E_PERSON_IDENTITY_INPUT' });
    assert.equal(broken.isTransaction, false);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'person_identity_%'").get().n, 0);
  } finally { broken.close(); }
});
