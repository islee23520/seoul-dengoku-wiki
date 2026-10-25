import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { PERSON_CONTEXT_SOURCE_HASHES, PERSON_CONTEXT_DOCUMENT_HASHES,
  initializePersonContextDocuments, readPersonContextDocuments } from './person-context-documents.mjs';

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-identity-documents-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(),'person-context-documents-'));
after(() => rm(dir,{ recursive: true, force: true }));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const authorityHash = hash(await readFile(authority));
const birthdaysBytes = readSourceArchive('lore/name-pools/cast-birthdays.json', PERSON_CONTEXT_SOURCE_HASHES.birthdays);
const contactsBytes = readSourceArchive('lore/name-pools/cast-prose-contacts.json', PERSON_CONTEXT_SOURCE_HASHES.contacts);
const expected = { birthdays: JSON.parse(birthdaysBytes), contacts: JSON.parse(contactsBytes) };
const schemaSql = await readFile(new URL('./person-context-documents.sql',import.meta.url),'utf8');
const options = { schemaSql, birthdaysBytes, contactsBytes, expectedSourceHashes: PERSON_CONTEXT_SOURCE_HASHES,
  actor: 'person-context-document-test', reason: 'Verify full actual source parity on an authority copy without new facts or approvals' };
const dbPath = join(dir,'context.sqlite');
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
initializePersonContextDocuments(db,options);

test('entire actual sources retain 1022 birthday records, 15 directed contacts, all metadata and serialized order', () => {
  const actual = readPersonContextDocuments(typed(db));
  assert.deepEqual(actual,expected);
  assert.equal(JSON.stringify(actual),JSON.stringify(expected));
  assert.equal(actual.birthdays.people.length,1022);
  assert.equal(actual.contacts.records.length,15);
  assert.equal(actual.birthdays.people.at(-1).id,'K1022');
  assert.deepEqual(actual.contacts.records.at(-1),expected.contacts.records.at(-1));
  for (const domain of ['birthdays','contacts']) assert.equal(hash(JSON.stringify(actual[domain])),PERSON_CONTEXT_DOCUMENT_HASHES[domain]);
  assert.equal(snapshot(db),before);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('fresh import and repeated read-only reopen deny filesystem source reads and JSON.parse', () => {
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
    const {readPersonContextDocuments}=await import(${JSON.stringify(new URL('./person-context-documents.mjs',import.meta.url).href)});
    for(let reopen=0;reopen<2;reopen++){
      const db=new DatabaseSync(${JSON.stringify(dbPath)},{readOnly:true});
      const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/\\bsource_file\\b|\\bsource_record\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/i);return db.prepare(sql)}};
      for(let repeat=0;repeat<2;repeat++)assert.equal(createHash('sha256').update(JSON.stringify(readPersonContextDocuments(typed))).digest('hex'),${JSON.stringify(hash(JSON.stringify(expected)))});
      db.close();
    }
    console.log('COMPLETE_CONTEXT_DOCUMENTS_DB_ONLY_EXACT');
  `],{ encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status,0,child.stderr);
  assert.match(child.stdout,/COMPLETE_CONTEXT_DOCUMENTS_DB_ONLY_EXACT/u);
});

test('missing terminal rows and mutations of every consumed domain and metadata reject', () => {
  assert.throws(() => readPersonContextDocuments(db,{expectedSourceHashes:{...PERSON_CONTEXT_SOURCE_HASHES,contacts:'0'.repeat(64)}}),{code:'E_PERSON_CONTEXT_DOCUMENT'});
  const statements = [
    "DELETE FROM family_birthday WHERE person_id='K1022'",
    "UPDATE family_birthday SET birth_date='2080-12-19' WHERE person_id='K1022'",
    "UPDATE family_birthday SET source_status='changed' WHERE person_id='K1022'",
    "UPDATE family_birthday SET source_id=1 WHERE person_id='K1022'",
    "UPDATE family_birthday SET json_pointer='/people/1022' WHERE person_id='K1022'",
    "UPDATE person SET name='changed' WHERE person_id='K1022'",
    "DELETE FROM family_birthday_source WHERE person_id='K1022'",
    "UPDATE family_birthday_source SET source_ref='changed' WHERE person_id='K1022'",
    "UPDATE family_birthday_source SET json_pointer='/bad' WHERE person_id='K1022'",
    "UPDATE family_source_metadata SET text_value='changed' WHERE source_id=91 AND field_name='ageAsOf'",
    "UPDATE family_source_metadata SET integer_value=2 WHERE source_id=91 AND field_name='schemaVersion'",
    "DELETE FROM context_prose_contact WHERE json_pointer='/records/14'",
    "UPDATE context_prose_contact SET recipient_person_id='K001' WHERE json_pointer='/records/14'",
    "UPDATE context_prose_contact SET contact_kind='changed' WHERE json_pointer='/records/14'",
    "UPDATE context_prose_contact SET source_ref_path='changed' WHERE json_pointer='/records/14'",
    "UPDATE context_prose_contact SET source_ref_anchor='changed' WHERE json_pointer='/records/14'",
    "UPDATE context_prose_contact SET source_id=1 WHERE json_pointer='/records/14'",
    "UPDATE context_prose_contact SET json_pointer='/records/15' WHERE json_pointer='/records/14'",
    'DELETE FROM person_context_contact_metadata',
    'UPDATE person_context_contact_metadata SET schema_version=2',
    "UPDATE person_context_contact_metadata SET status='changed'",
    "UPDATE person_context_contact_metadata SET approval_status='changed'",
    "UPDATE person_context_contact_metadata SET source_note='changed'",
    'DELETE FROM person_context_document_key WHERE rowid=(SELECT max(rowid) FROM person_context_document_key)',
    'UPDATE person_context_document_key SET is_null=1 WHERE rowid=1',
    "UPDATE person_context_document_key SET key='unknown' WHERE rowid=1",
    "UPDATE person_context_document_import SET source_sha256=printf('%064d',0) WHERE domain='contacts'",
    "UPDATE person_context_document_import SET document_sha256=printf('%064d',0) WHERE domain='birthdays'",
    "DELETE FROM person_context_document_import WHERE domain='contacts'",
  ];
  for (const sql of statements) {
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
    try { db.exec(sql); assert.throws(() => readPersonContextDocuments(typed(db)),{code:'E_PERSON_CONTEXT_DOCUMENT'},sql); }
    finally { db.exec('ROLLBACK'); }
  }
});

test('actual pins, both byte inputs, explicit SQL, actor/reason and one-shot initialization are mandatory', () => {
  for (const changes of [{actor:''},{reason:''},{schemaSql:undefined},{expectedSourceHashes:undefined},
    {birthdaysBytes:Buffer.from('{}')},{contactsBytes:Buffer.from('{}')},
    {expectedSourceHashes:{...PERSON_CONTEXT_SOURCE_HASHES,birthdays:'0'.repeat(64)}},
    {expectedSourceHashes:{...PERSON_CONTEXT_SOURCE_HASHES,contacts:'0'.repeat(64)}}]) {
    assert.throws(() => initializePersonContextDocuments(db,{...options,...changes}),{code:'E_PERSON_CONTEXT_DOCUMENT'});
  }
  db.exec('BEGIN');
  try { assert.throws(() => initializePersonContextDocuments(db,options),{code:'E_PERSON_CONTEXT_DOCUMENT'}); }
  finally { db.exec('ROLLBACK'); }
  assert.throws(() => initializePersonContextDocuments(db,options),/already exists/u);
  assert.equal(db.isTransaction,false);
  assert.equal(snapshot(db),before);
});

test('parity failures roll back all new tables and preserve existing domains and authority bytes', async () => {
  const brokenPath=join(dir,'broken.sqlite');
  await copyFile(authority,brokenPath);
  const broken=new DatabaseSync(brokenPath);
  try {
    const archiveMismatch={prepare(sql){
      if(sql==='SELECT source_id,sha256 FROM source_file WHERE logical_path=?')return {all:()=>[{source_id:91,sha256:'0'.repeat(64)}]};
      return broken.prepare(sql);
    }};
    assert.throws(()=>initializePersonContextDocuments(archiveMismatch,options),{code:'E_PERSON_CONTEXT_DOCUMENT'});
    for (const mutation of ["UPDATE family_birthday SET birth_date='2080-12-19' WHERE person_id='K1022'",
      "DELETE FROM context_prose_contact WHERE json_pointer='/records/14'"]) {
      broken.exec(mutation);
      const brokenBefore=snapshot(broken);
      assert.throws(()=>initializePersonContextDocuments(broken,options),{code:'E_PERSON_CONTEXT_DOCUMENT'});
      assert.equal(broken.isTransaction,false);
      assert.equal(snapshot(broken),brokenBefore);
      assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'person_context_%'").get().n,0);
    }
  } finally { broken.close(); }
  assert.equal(hash(await readFile(authority)),authorityHash);
});
