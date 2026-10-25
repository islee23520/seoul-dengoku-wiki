import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { PERSON_IDENTITY_SOURCE_HASHES, PERSON_IDENTITY_DOCUMENT_HASHES,
  initializePersonIdentityDocuments, readPersonIdentityDocuments } from './person-identity-documents.mjs';

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-family-order-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(),'person-identity-documents-'));
after(() => rm(dir,{ recursive: true, force: true }));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalHash = hash(await readFile(authority));
const lineageBytes = readSourceArchive('lore/name-pools/cast-hangnyeol.json', PERSON_IDENTITY_SOURCE_HASHES.lineage);
const genderBytes = readSourceArchive('lore/name-pools/gender-cast.json', PERSON_IDENTITY_SOURCE_HASHES.gender);
const expected = { lineage: JSON.parse(lineageBytes), gender: JSON.parse(genderBytes) };
const schemaSql = await readFile(new URL('./person-identity-documents.sql',import.meta.url),'utf8');
const options = { schemaSql, lineageBytes, genderBytes, expectedSourceHashes: PERSON_IDENTITY_SOURCE_HASHES,
  actor: 'identity-document-test', reason: 'Verify complete typed document correspondence on authority copies' };
const dbPath = join(dir,'identity.sqlite');
await copyFile(authority,dbPath);
const db = new DatabaseSync(dbPath);
after(() => db.close());
const typed = connection => ({ prepare(sql) {
  assert.match(sql,/^SELECT /u);
  assert.doesNotMatch(sql,/\bsource_file\b|\bsource_record\b|\braw_bytes\b|\bquality_issue\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
} });
const domainTables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
const snapshot = connection => {
  const digest = createHash('sha256');
  for (const table of domainTables) {
    digest.update(table + '\n');
    for (const row of connection.prepare('SELECT * FROM "'+table+'"').iterate()) {
      digest.update(JSON.stringify(row,(_k,v) => v instanceof Uint8Array ? hash(v) : typeof v === 'bigint' ? String(v) : v) + '\n');
    }
  }
  return digest.digest('hex');
};
const before = snapshot(db);
initializePersonIdentityDocuments(db,options);

test('both entire actual documents match all 1022 people, policy values, root metadata and serialized order', () => {
  const actual = readPersonIdentityDocuments(typed(db));
  assert.deepEqual(actual,expected);
  assert.equal(JSON.stringify(actual),JSON.stringify(expected));
  for (const domain of ['lineage','gender']) {
    assert.equal(actual[domain].people.length,1022);
    assert.equal(hash(JSON.stringify(actual[domain])),PERSON_IDENTITY_DOCUMENT_HASHES[domain]);
    assert.deepEqual(Object.keys(actual[domain]),Object.keys(expected[domain]));
  }
  assert.equal(actual.gender.policies.length,17);
  assert.deepEqual(actual.lineage.sources,[]);
  assert.equal(snapshot(db),before);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('fresh import and repeated read-only reopen work with filesystem and JSON.parse denied', () => {
  const child = spawnSync(process.execPath,['--input-type=module','-e',`
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    import {DatabaseSync} from 'node:sqlite'; import {createHash} from 'node:crypto';
    const deny=()=>{throw Error('filesystem/JSON.parse denied')};
    const moduleRead=fs.readFileSync;
    fs.readFileSync=(p,...args)=>/\\.(?:mjs|js|cjs)$/.test(String(p))?moduleRead(p,...args):deny();
    fs.readFile=deny;fs.readdir=deny;fs.readdirSync=deny;fsp.readFile=deny;fsp.readdir=deny;
    syncBuiltinESMExports();JSON.parse=deny;
    const {readPersonIdentityDocuments}=await import(${JSON.stringify(new URL('./person-identity-documents.mjs',import.meta.url).href)});
    for(let reopen=0;reopen<2;reopen++){
      const db=new DatabaseSync(${JSON.stringify(dbPath)},{readOnly:true});
      const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/\\bsource_file\\b|\\bsource_record\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/i);return db.prepare(sql)}};
      for(let repeat=0;repeat<2;repeat++)assert.equal(createHash('sha256').update(JSON.stringify(readPersonIdentityDocuments(typed))).digest('hex'),${JSON.stringify(hash(JSON.stringify(expected)))});
      db.close();
    }
    console.log('COMPLETE_IDENTITY_DOCUMENTS_DB_ONLY_EXACT');
  `],{ encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status,0,child.stderr);
  assert.match(child.stdout,/COMPLETE_IDENTITY_DOCUMENTS_DB_ONLY_EXACT/u);
});

test('terminal rows, typed values, metadata, keys, null flags and receipts cannot silently drift', () => {
  assert.throws(() => readPersonIdentityDocuments(db,{expectedSourceHashes:{...PERSON_IDENTITY_SOURCE_HASHES,gender:'0'.repeat(64)}}),{code:'E_PERSON_IDENTITY_DOCUMENT'});
  const statements = [
    "DELETE FROM person_gender WHERE rowid=(SELECT max(rowid) FROM person_gender)",
    "DELETE FROM person_lineage WHERE rowid=(SELECT max(rowid) FROM person_lineage)",
    "DELETE FROM identity_gender_policy WHERE state_id='S16'",
    "UPDATE identity_gender_policy SET reason='changed' WHERE state_id='S16'",
    'DELETE FROM identity_gender_category WHERE ordinal=1',
    "UPDATE identity_gender_provenance SET owner_decision='changed'",
    "UPDATE identity_lineage_provenance SET note='changed'",
    'DELETE FROM lineage_parent WHERE rowid=(SELECT max(rowid) FROM lineage_parent)',
    'UPDATE lineage_founder_sesu SET sesu=sesu+1 WHERE rowid=(SELECT max(rowid) FROM lineage_founder_sesu)',
    'DELETE FROM lineage_clan_assignment WHERE rowid=(SELECT max(rowid) FROM lineage_clan_assignment)',
    'DELETE FROM person_identity_document_key WHERE rowid=(SELECT max(rowid) FROM person_identity_document_key)',
    'UPDATE person_identity_document_key SET is_null=1 WHERE rowid=1',
    "UPDATE person_identity_document_key SET key='unknown' WHERE rowid=1",
    "UPDATE person_identity_document_import SET document_sha256=printf('%064d',0) WHERE domain='gender'",
    "UPDATE person_identity_document_import SET source_sha256=printf('%064d',0) WHERE domain='lineage'",
    "DELETE FROM person_identity_document_import WHERE domain='gender'",
  ];
  for (const sql of statements) {
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
    try { db.exec(sql); assert.throws(() => readPersonIdentityDocuments(typed(db)),{code:'E_PERSON_IDENTITY_DOCUMENT'},sql); }
    finally { db.exec('ROLLBACK'); }
  }
});

test('initialization requires both actual pins and audit fields and rejects reimport', () => {
  for (const changes of [{actor:''},{reason:''},{schemaSql:undefined},{expectedSourceHashes:undefined},
    {lineageBytes:Buffer.from('{}')},{genderBytes:Buffer.from('{}')},
    {expectedSourceHashes:{...PERSON_IDENTITY_SOURCE_HASHES,lineage:'0'.repeat(64)}},
    {expectedSourceHashes:{...PERSON_IDENTITY_SOURCE_HASHES,gender:'0'.repeat(64)}}]) {
    assert.throws(() => initializePersonIdentityDocuments(db,{...options,...changes}),{code:'E_PERSON_IDENTITY_DOCUMENT'});
  }
  assert.throws(() => initializePersonIdentityDocuments(db,options),/already exists/u);
  assert.equal(db.isTransaction,false);
  assert.equal(snapshot(db),before);
});

test('typed parity failure rolls back schema, keys and receipts without domain changes or authority writes', async () => {
  const brokenPath=join(dir,'broken.sqlite');
  await copyFile(authority,brokenPath);
  const broken=new DatabaseSync(brokenPath);
  try {
    const archiveMismatch={prepare(sql){
      if(sql==='SELECT sha256 FROM source_file WHERE logical_path=?')return {all:()=>[{sha256:'0'.repeat(64)}]};
      return broken.prepare(sql);
    }};
    assert.throws(()=>initializePersonIdentityDocuments(archiveMismatch,options),{code:'E_PERSON_IDENTITY_DOCUMENT'});
    broken.exec("UPDATE identity_gender_policy SET reason='typed divergence' WHERE state_id='S16'");
    const brokenBefore=snapshot(broken);
    assert.throws(()=>initializePersonIdentityDocuments(broken,options),{code:'E_PERSON_IDENTITY_DOCUMENT'});
    assert.equal(broken.isTransaction,false);
    assert.equal(snapshot(broken),brokenBefore);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'person_identity_document_%'").get().n,0);
  } finally { broken.close(); }
  assert.equal(hash(await readFile(authority)),originalHash);
});
