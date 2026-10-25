import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { CENSUS_DOCUMENT_PINS, CENSUS_DOMAIN_MAPPING, initializeCensusDocuments, readCensusDocuments } from './census-document-store.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-mapping-family-source-20261020.sqlite';
const hash = value => createHash('sha256').update(value).digest('hex');
const authorityHash = hash(await readFile(authority));
const dir = await mkdtemp(join(tmpdir(),'census-document-store-'));
after(() => rm(dir,{recursive:true,force:true}));
const sources = {}, expected = {};
for (const [name,pin] of Object.entries(CENSUS_DOCUMENT_PINS)) {
  const bytes = readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, pin.path, pin.sourceSha256);
  sources[name] = {bytes,expectedSourceHash:pin.sourceSha256};
  expected[name] = JSON.parse(bytes);
}
const schemaSql = await readFile(new URL('./census-document-store.sql',import.meta.url),'utf8');
const options = {schemaSql,sources,actor:'census-document-store-test',reason:'Verify complete current operational census source on isolated authority copy'};
const dbPath = join(dir,'census.sqlite');
await copyFile(authority,dbPath);
const db = new DatabaseSync(dbPath);
after(() => db.close());
const existingTables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
const snapshot = connection => {
  const digest = createHash('sha256');
  for (const table of existingTables) {
    digest.update(table+'\n');
    for (const row of connection.prepare('SELECT * FROM "'+table+'"').iterate()) digest.update(JSON.stringify(row,(_key,value) => value instanceof Uint8Array ? hash(value) : typeof value === 'bigint' ? String(value) : value)+'\n');
  }
  return digest.digest('hex');
};
const before = snapshot(db);
const guarded = connection => ({prepare(sql) {
  assert.match(sql,/^SELECT /u);
  assert.doesNotMatch(sql,/\b(?:source_file|source_record|raw_bytes|json_extract|json_tree|json_each)\b/iu);
  assert.match(sql,/ FROM census_/u);
  return connection.prepare(sql);
}});
initializeCensusDocuments(db,options);
const census = value => {
  const result = {arrays:[],objects:[],nulls:0,string:0,number:0,boolean:0};
  const visit = (v,path) => {
    if (v === null) result.nulls++;
    else if (Array.isArray(v)) {result.arrays.push([path,v.length]);v.forEach((item,i) => visit(item,path+'/'+i));}
    else if (typeof v === 'object') {result.objects.push([path,Object.keys(v)]);for (const [key,item] of Object.entries(v)) visit(item,path+'/'+key);}
    else result[typeof v]++;
  };
  visit(value,'');return result;
};

test('actual entire sources preserve every collection denominator, scalar type, optional key, null and order', () => {
  const actual = readCensusDocuments(guarded(db));
  for (const [name,pin] of Object.entries(CENSUS_DOCUMENT_PINS)) {
    assert.equal(hash(sources[name].bytes),pin.sourceSha256);
    assert.deepEqual(actual[name],expected[name]);
    assert.equal(JSON.stringify(actual[name]),JSON.stringify(expected[name]));
    assert.deepEqual(census(actual[name]),census(expected[name]));
    assert.equal(hash(JSON.stringify(actual[name])),pin.documentSha256);
  }
  assert.equal(actual.ledger.people.length,1022);
  assert.equal(actual.ledger.originalRights.length,2021);
  assert.equal(actual.ledger.cardOccurrences.length,4168);
  assert.equal(actual.review.documents.length,323);
  assert.equal(actual.review.mapping.exceptions.length,146228);
  assert.strictEqual(actual.ledger.binding,actual.review.binding);
  assert.equal(snapshot(db),before);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('fresh reader import and repeated readonly opens deny filesystem source reads and JSON.parse', () => {
  const child = spawnSync(process.execPath,['--input-type=module','-e',`
    import assert from 'node:assert/strict';
    import fs from 'node:fs';import fsp from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
    const deny=()=>{throw Error('source filesystem/JSON.parse denied')};
    const moduleRead=fs.readFileSync;
    fs.readFileSync=(p,...args)=>/\\.(?:mjs|js|cjs)$/.test(String(p))?moduleRead(p,...args):deny();
    fs.readFile=deny;fs.readdir=deny;fs.readdirSync=deny;fsp.readFile=deny;fsp.readdir=deny;
    syncBuiltinESMExports();JSON.parse=deny;
    const {readCensusDocuments}=await import(${JSON.stringify(new URL('./census-document-store.mjs',import.meta.url).href)});
    for(let reopen=0;reopen<2;reopen++) {
      const db=new DatabaseSync(${JSON.stringify(dbPath)},{readOnly:true});
      const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.match(sql,/ FROM census_/);assert.doesNotMatch(sql,/\\b(?:source_file|source_record|raw_bytes|json_extract|json_tree|json_each)\\b/i);return db.prepare(sql)}};
      const result=readCensusDocuments(typed);
      for(const [name,pin] of Object.entries(${JSON.stringify(CENSUS_DOCUMENT_PINS)}))assert.equal(createHash('sha256').update(JSON.stringify(result[name])).digest('hex'),pin.documentSha256);
      db.close();
    }
    console.log('COMPLETE_CENSUS_DB_ONLY_EXACT');
  `],{encoding:'utf8',timeout:120000});
  assert.equal(child.status,0,child.stderr);
  assert.match(child.stdout,/COMPLETE_CENSUS_DB_ONLY_EXACT/u);
});

test('missing terminal domain rows in every populated table are rejected', () => {
  const tables = CENSUS_DOMAIN_MAPPING.flatMap(spec => [spec.table,...spec.fields.filter(field => field.table).map(field => field.table)]);
  for (const table of tables) {
    assert.ok(db.prepare('SELECT count(*) AS n FROM '+table).get().n > 0,table);
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
    try {
      db.exec('DELETE FROM '+table+' WHERE rowid=(SELECT max(rowid) FROM '+table+')');
      assert.throws(() => readCensusDocuments(guarded(db)),{code:'E_CENSUS_DOCUMENT_STORE'},table);
    } finally {db.exec('ROLLBACK');}
  }
});

test('typed value, nullable metadata, key order, array order and receipt pin mutations reject', () => {
  const mutations = [
    "UPDATE census_ledger_people_entry SET status='changed' WHERE rowid=1",
    "UPDATE census_ledger_people_entry_inventory_original_values SET locked=0 WHERE locked=1",
    "UPDATE census_ledger_people_entry_inventory_original_values_desire SET 지향='changed' WHERE rowid=1",
    "UPDATE census_ledger_original_rights_entry SET disposition='changed' WHERE rowid=1",
    "UPDATE census_ledger_card_occurrences_entry SET end_block_exclusive=end_block_exclusive+1 WHERE rowid=1",
    "UPDATE census_review_documents_entry SET reviewed_at='changed' WHERE rowid=1",
    "UPDATE census_review_mapping_exceptions_entry SET evidence='changed' WHERE rowid=(SELECT max(rowid) FROM census_review_mapping_exceptions_entry)",
    "UPDATE census_binding_task2_spatial SET legal_survey_certification=1",
    "UPDATE census_ledger_people_entry_inventory_issued SET key_variant=1 WHERE rowid=1",
    "UPDATE census_review_mapping_exceptions_entry_original_keys SET original_keys='changed' WHERE rowid=1",
    "UPDATE census_review_mapping_exceptions_entry_original_keys SET ordinal=ordinal+100 WHERE rowid=1",
    "UPDATE census_document_import SET source_sha256='wrong' WHERE document='ledger'",
    'DELETE FROM census_document_import',
  ];
  for (const sql of mutations) {
    db.exec('BEGIN');
    try {db.exec(sql);assert.throws(() => readCensusDocuments(guarded(db)),{code:'E_CENSUS_DOCUMENT_STORE'},sql);}
    finally {db.exec('ROLLBACK');}
  }
});

test('wrong hashes, missing actor/reason, repeat init and failed precommit parity do not change authority', async () => {
  for (const changes of [{actor:''},{reason:''},{schemaSql:undefined},
    {sources:{...sources,ledger:{...sources.ledger,expectedSourceHash:'0'.repeat(64)}}},
    {sources:{...sources,review:{...sources.review,bytes:Buffer.from('{}')}}}]) {
    assert.throws(() => initializeCensusDocuments(db,{...options,...changes}),{code:'E_CENSUS_DOCUMENT_STORE'});
  }
  assert.throws(() => initializeCensusDocuments(db,options),/already exists/u);
  assert.equal(db.isTransaction,false);
  const failedPath = join(dir,'failed.sqlite');
  await copyFile(authority,failedPath);
  const failed = new DatabaseSync(failedPath);
  try {
    const brokenSql = schemaSql+"\nCREATE TRIGGER census_test_corruption AFTER INSERT ON census_review_mapping_exceptions_entry BEGIN UPDATE census_review_mapping_exceptions_entry SET evidence='corrupted' WHERE address=NEW.address; END;";
    assert.throws(() => initializeCensusDocuments(failed,{...options,schemaSql:brokenSql}),/serialized digest/u);
    assert.equal(failed.isTransaction,false);
    assert.equal(failed.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'census_%' AND name NOT IN (SELECT name FROM sqlite_schema WHERE name IN ('census_event_import','census_event_identity'))").get().n,0);
    assert.equal(snapshot(failed),before);
  } finally {failed.close();}
  assert.equal(snapshot(db),before);
  assert.equal(hash(await readFile(authority)),authorityHash);
});
