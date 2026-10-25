import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { FAMILY_INPUT_SOURCE_HASHES } from './family-inputs.mjs';
import { ISSUED_SHEET_SOURCE_HASH } from './issued-sheet-inputs.mjs';
import test from 'node:test';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { initializeAtlasIdentity, readAtlasIdentity, readAtlasValuesDocument } from './atlas-identity.mjs';
import { atlasPeopleContext } from '../atlas-people-context.mjs';
import { verifyAtlasPeople } from '../world-atlas-verify.mjs';
import { loadPersonDetailSources as loadDbInputs } from './person-detail-inputs.mjs';

const names = { registry: 'person-id-registry', candidates: 'person-id-candidates', values: 'values-cast', gurps: 'gurps-cast' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const command = { actor: 'atlas identity migration test', reason: 'exact approved source snapshot parity' };
for (const [kind, name] of Object.entries(names)) {
  const logicalPath = `lore/name-pools/${name}.json`;
  const approvedBytes = readSourceArchive(logicalPath, FAMILY_INPUT_SOURCE_HASHES[logicalPath]
    ?? (kind === 'candidates' ? 'e208daf90927feeb9a04ac096190987a16903ab809e2265545fef9b968e30034'
      : kind === 'gurps' ? ISSUED_SHEET_SOURCE_HASH : undefined));
  command[kind] = { approvedBytes, expectedSha256: hash(approvedBytes) };
}
const expectedSourceHashes = Object.fromEntries(Object.entries(names).map(([kind, name]) => [`lore/name-pools/${name}.json`, command[kind].expectedSha256]));
const sourceDb = process.env.ATLAS_IDENTITY_DB ?? new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url);

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'atlas-identity-'));
  const path = join(directory, 'actual.sqlite');
  copyFileSync(sourceDb, path);
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON');
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true }); });
  return { db, path };
}
const typedOnly = db => ({ prepare(sql) {
  assert.doesNotMatch(sql, /\braw_bytes\b|\bsource_record\b|\batlas_identity_archive\b|\bjson_(?:extract|tree|each)\b/iu);
  return db.prepare(sql);
} });

test('actual atlas context exact parity, full object/Map order, reopen with no source filesystem or JSON parser', async t => {
  const { db, path } = fixture(t);
  const selectedDatabase = process.env.WIKI_DOCUMENT_DB;
  let expected;
  try {
    delete process.env.WIKI_DOCUMENT_DB;
    expected = await atlasPeopleContext(new URL('../../lore/', import.meta.url).pathname);
  } finally {
    if (selectedDatabase !== undefined) process.env.WIKI_DOCUMENT_DB = selectedDatabase;
  }
  assert.deepEqual(initializeAtlasIdentity(db, command), expected);
  assert.deepEqual(readAtlasValuesDocument(typedOnly(db)), JSON.parse(command.values.approvedBytes));
  assert.equal(JSON.stringify(readAtlasValuesDocument(typedOnly(db))), JSON.stringify(JSON.parse(command.values.approvedBytes)));
  const actual = await atlasPeopleContext('/no-source-files', { db: typedOnly(db), expectedSourceHashes });
  assert.deepEqual(actual, expected);
  assert.deepEqual(await loadDbInputs({ db: typedOnly(db), inputSubset: 'atlas', expectedSourceHashes }),
    { atlasPeople: expected, peopleSource: expected.people });
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.deepEqual([...actual.routes], [...expected.routes]);
  const atlas = JSON.parse(readSourceArchive('lore/World-Narrative-Atlas.json')).data.atlas;
  assert.deepEqual(verifyAtlasPeople(atlas, actual), verifyAtlasPeople(atlas, expected));
  assert.deepEqual(verifyAtlasPeople(atlas, actual).failures, []);
  assert.equal(actual.routes.size, 1022);
  assert.equal(actual.candidates.NOTES.length, 18);
  assert.deepEqual(db.prepare('SELECT kind,sha256,bytes FROM atlas_identity_archive ORDER BY kind').all().map(r => [r.kind, r.sha256, hash(r.bytes)]),
    Object.keys(names).sort().map(kind => [kind, command[kind].expectedSha256, command[kind].expectedSha256]));
  assert.throws(() => db.exec("UPDATE atlas_identity_note SET detail='changed'"), /E_ATLAS_IDENTITY_IMMUTABLE/u);
  assert.throws(() => db.exec('DELETE FROM atlas_identity_archive'), /E_ATLAS_IDENTITY_IMMUTABLE/u);
  assert.throws(() => initializeAtlasIdentity(db, command), { code: 'E_ATLAS_IDENTITY_INITIALIZED' });
  db.close();
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    import {atlasPeopleContext} from ${JSON.stringify(new URL('../atlas-people-context.mjs', import.meta.url).href)};
    import {readAtlasIdentity} from ${JSON.stringify(new URL('./atlas-identity.mjs', import.meta.url).href)};
    const deny=()=>{throw new Error('source filesystem/JSON parser forbidden')};
    fs.readFileSync=deny; fs.readFile=deny; fs.readdir=deny; fs.readdirSync=deny;
    fsp.readFile=deny; fsp.readdir=deny; syncBuiltinESMExports(); JSON.parse=deny;
    const context=await atlasPeopleContext('/missing-lore');
    if(context.registry.persons.length!==1022 || context.routes.size!==1022 || context.candidates.candidates.length!==600) throw new Error('coverage');
    console.log('ATLAS_DB_ONLY_1022');
  `], { encoding: 'utf8', timeout: 30000, env: { ...process.env, WIKI_DOCUMENT_DB: path } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ATLAS_DB_ONLY_1022/u);
});

test('explicit DB gaps and missing/stale sources and incomplete pins fail closed without filesystem fallback', async t => {
  const { db } = fixture(t);
  await assert.rejects(atlasPeopleContext('/missing-lore', { db }), { code: 'E_ATLAS_IDENTITY_SCHEMA_GAP' });
  initializeAtlasIdentity(db, command);
  assert.throws(() => readAtlasIdentity(db, { expectedSourceHashes: {} }), { code: 'E_ATLAS_IDENTITY_STALE' });
  for (const path of Object.keys(expectedSourceHashes)) {
    assert.throws(() => readAtlasIdentity(db, { expectedSourceHashes: { ...expectedSourceHashes, [path]: '0'.repeat(64) } }), { code: 'E_ATLAS_IDENTITY_STALE' });
  }
  db.exec("UPDATE source_file SET sha256=printf('%064d',0) WHERE logical_path='lore/name-pools/values-cast.json'");
  await assert.rejects(atlasPeopleContext('/missing-lore', { db }), { code: 'E_ATLAS_IDENTITY_STALE' });
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec("DELETE FROM source_file WHERE logical_path='lore/name-pools/person-id-registry.json'");
  assert.throws(() => readAtlasIdentity(db), { code: 'E_ATLAS_IDENTITY_MISSING' });
});

test('initializer rejects hash mismatch and unknown fields atomically before migration', t => {
  const { db } = fixture(t);
  assert.throws(() => initializeAtlasIdentity(db, { ...command, registry: { ...command.registry, expectedSha256: '0'.repeat(64) } }), { code: 'E_ATLAS_IDENTITY_HASH' });
  for (const kind of ['registry', 'candidates', 'values', 'gurps']) {
    const document = JSON.parse(command[kind].approvedBytes);
    const target = kind === 'registry' ? document.persons[0] : kind === 'candidates' ? document.candidates[0] : document.people[0];
    target.unknownField = 'not admitted';
    const approvedBytes = Buffer.from(JSON.stringify(document));
    assert.throws(() => initializeAtlasIdentity(db, { ...command, [kind]: { approvedBytes, expectedSha256: hash(approvedBytes) } }), { code: 'E_ATLAS_IDENTITY_FIELDS' });
  }
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name GLOB 'atlas_identity_*'").get().n, 0);
});

test('initializer rejects stale supplied source and typed authority disagreement', t => {
  const { db } = fixture(t);
  db.exec("UPDATE person SET title='not source title' WHERE person_id='K001'");
  assert.throws(() => initializeAtlasIdentity(db, command), { code: 'E_ATLAS_IDENTITY_AUTHORITY' });
  db.exec("UPDATE source_file SET sha256=printf('%064d',0) WHERE logical_path='lore/name-pools/gurps-cast.json'");
  assert.throws(() => initializeAtlasIdentity(db, command), { code: 'E_ATLAS_IDENTITY_STALE' });
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name GLOB 'atlas_identity_*'").get().n, 0);
});
