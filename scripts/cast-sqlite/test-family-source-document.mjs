import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { FAMILY_SOURCE_HASH, FAMILY_DOCUMENT_HASH, initializeFamilySourceDocument, readFamilySourceDocument } from './family-source-document.mjs';

const authority = '/tmp/seoul-document-authority-20261020/bootstrap-identity-documents-20261020.sqlite';
const dir = await mkdtemp(join(tmpdir(),'family-source-document-'));
after(() => rm(dir,{recursive:true,force:true}));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const authorityHash = hash(await readFile(authority));
const sourceBytes = readSourceArchive('lore/name-pools/cast-family-trees.json', FAMILY_SOURCE_HASH);
const expected = JSON.parse(sourceBytes);
const schemaSql = await readFile(new URL('./family-source-document.sql',import.meta.url),'utf8');
const options = {schemaSql,sourceBytes,expectedSourceHash:FAMILY_SOURCE_HASH,actor:'family-source-document-test',reason:'Verify complete authored document on isolated authority copies'};
const dbPath = join(dir,'family.sqlite');
await copyFile(authority,dbPath);
const db = new DatabaseSync(dbPath);
after(() => db.close());
const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
const snapshot = connection => {
  const digest = createHash('sha256');
  for (const table of tables) {
    digest.update(table+'\n');
    for (const row of connection.prepare('SELECT * FROM "'+table+'"').iterate()) digest.update(JSON.stringify(row,(_k,v) => v instanceof Uint8Array ? hash(v) : typeof v === 'bigint' ? String(v) : v)+'\n');
  }
  return digest.digest('hex');
};
const before = snapshot(db);
const typed = connection => ({prepare(sql) {
  assert.match(sql,/^SELECT /u);
  assert.doesNotMatch(sql,/\bsource_file\b|\bsource_record\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b|\bperson\b|\bfamily_birthday\b|\bdiaspora_\w+/iu);
  return connection.prepare(sql);
}});
initializeFamilySourceDocument(db,options);

test('entire actual authored source preserves every scalar, type, null, optional field, array and object order', () => {
  assert.equal(hash(sourceBytes),FAMILY_SOURCE_HASH);
  const actual = readFamilySourceDocument(typed(db));
  assert.deepEqual(actual,expected);
  assert.equal(JSON.stringify(actual),JSON.stringify(expected));
  assert.equal(hash(JSON.stringify(actual)),FAMILY_DOCUMENT_HASH);
  assert.equal(actual.nodes.length,6025);
  assert.equal(actual.edges.length,5008);
  const census = value => {
    const result = {nulls:0,strings:0,numbers:0,booleans:0,objects:0,arrays:0,keys:[]};
    const visit = v => {
      if (v === null) result.nulls++;
      else if (Array.isArray(v)) {result.arrays++;v.forEach(visit);}
      else if (typeof v === 'object') {result.objects++;result.keys.push(Object.keys(v));Object.values(v).forEach(visit);}
      else result[typeof v+'s']++;
    };
    visit(value);return result;
  };
  assert.deepEqual(census(actual),census(expected));
  assert.ok(census(actual).nulls > 0);
  assert.equal(actual.nodes.filter(n => Object.hasOwn(n,'nameEn')).length,480);
  assert.equal(actual.nodes.filter(n => Object.hasOwn(n,'lineage')).length,2336);
  assert.equal(actual.nodes.filter(n => Object.hasOwn(n,'generationException')).length,4);
  assert.deepEqual(actual.imports,[{path:'lore/name-pools/diaspora-family-lineages.json'}]);
  assert.equal(snapshot(db),before);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('fresh reader import and read-only reopen deny source filesystem and JSON.parse', () => {
  const child = spawnSync(process.execPath,['--input-type=module','-e',`
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
    const deny=()=>{throw Error('filesystem/JSON.parse denied')};
    const moduleRead=fs.readFileSync;
    fs.readFileSync=(p,...args)=>/\\.(?:mjs|js|cjs)$/.test(String(p))?moduleRead(p,...args):deny();
    fs.readFile=deny;fs.readdir=deny;fs.readdirSync=deny;fsp.readFile=deny;fsp.readdir=deny;
    syncBuiltinESMExports();JSON.parse=deny;
    const {readFamilySourceDocument}=await import(${JSON.stringify(new URL('./family-source-document.mjs',import.meta.url).href)});
    for(let reopen=0;reopen<2;reopen++){
      const db=new DatabaseSync(${JSON.stringify(dbPath)},{readOnly:true});
      const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/\\bsource_file\\b|\\bsource_record\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b|\\bperson\\b|\\bfamily_birthday\\b|\\bdiaspora_\\w+/i);return db.prepare(sql)}};
      for(let repeat=0;repeat<2;repeat++)assert.equal(createHash('sha256').update(JSON.stringify(readFamilySourceDocument(typed))).digest('hex'),${JSON.stringify(FAMILY_DOCUMENT_HASH)});
      db.close();
    }
    console.log('COMPLETE_AUTHORED_FAMILY_SOURCE_DB_ONLY_EXACT');
  `],{encoding:'utf8',timeout:60000});
  assert.equal(child.status,0,child.stderr);
  assert.match(child.stdout,/COMPLETE_AUTHORED_FAMILY_SOURCE_DB_ONLY_EXACT/u);
});

test('terminal rows, authored values, nulls, optional fields, metadata and key order reject mutations', () => {
  assert.throws(() => readFamilySourceDocument(db,{expectedSourceHash:'0'.repeat(64)}),{code:'E_FAMILY_SOURCE_DOCUMENT'});
  const mutations = [
    "DELETE FROM family_node WHERE source_id=94 AND json_pointer='/nodes/6024'",
    "DELETE FROM family_edge WHERE source_id=94 AND json_pointer='/edges/5007'",
    'DELETE FROM family_node_timeline WHERE source_id=94 AND rowid=(SELECT max(rowid) FROM family_node_timeline WHERE source_id=94)',
    'DELETE FROM family_node_source WHERE source_id=94 AND rowid=(SELECT max(rowid) FROM family_node_source WHERE source_id=94)',
    'DELETE FROM family_edge_source WHERE source_id=94 AND rowid=(SELECT max(rowid) FROM family_edge_source WHERE source_id=94)',
    'DELETE FROM family_tree_source WHERE source_id=94 AND ordinal=3',
    "DELETE FROM family_source_metadata WHERE source_id=94 AND field_name='status'",
    "UPDATE family_node SET name='authored value drift' WHERE node_id='K001'",
    "UPDATE family_node SET birth_date='2000-01-01' WHERE node_id='K001'",
    "UPDATE family_node SET death_date='2126-01-01' WHERE node_id='K001'",
    "UPDATE family_node SET name_en=NULL WHERE node_id=(SELECT node_id FROM family_node WHERE source_id=94 AND name_en IS NOT NULL LIMIT 1)",
    "UPDATE family_node SET lineage_bongwan='changed' WHERE node_id=(SELECT node_id FROM family_node WHERE source_id=94 AND lineage_surname IS NOT NULL LIMIT 1)",
    "UPDATE family_node SET generation_exception_reason='changed' WHERE generation_exception_reason IS NOT NULL AND source_id=94",
    "UPDATE family_node_timeline SET summary='changed' WHERE node_id='K001'",
    "UPDATE family_node_timeline SET summary_en='changed' WHERE node_id='K001'",
    "UPDATE family_node_source SET source_anchor=NULL WHERE node_id='K001' AND source_kind='node' AND ordinal=0",
    "UPDATE family_edge SET parent_role='changed' WHERE source_id=94 AND json_pointer='/edges/5007'",
    "UPDATE family_edge_source SET source_path='changed' WHERE source_id=94 AND rowid=(SELECT max(rowid) FROM family_edge_source WHERE source_id=94)",
    "UPDATE family_source_metadata SET integer_value=2 WHERE source_id=94 AND field_name='schemaVersion'",
    "UPDATE family_tree SET status='changed' WHERE source_id=94",
    'DELETE FROM family_input_key_order WHERE rowid=(SELECT max(rowid) FROM family_input_key_order)',
    "UPDATE family_input_key_order SET key='unknown' WHERE rowid=1",
    'DELETE FROM family_source_document_dependency WHERE ordinal=0',
    "UPDATE family_source_document_dependency SET source_path='changed'",
    'DELETE FROM family_source_document_key WHERE rowid=(SELECT max(rowid) FROM family_source_document_key)',
    "UPDATE family_source_document_key SET key='unknown' WHERE object_path='' AND ordinal=0",
    "UPDATE family_source_document_import SET source_sha256='wrong'",
    "UPDATE family_source_document_import SET document_sha256='wrong'",
    "UPDATE family_source_document_import SET source_id=95",
    'DELETE FROM family_source_document_import',
  ];
  for (const sql of mutations) {
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
    try {db.exec(sql);assert.throws(() => readFamilySourceDocument(typed(db)),{code:'E_FAMILY_SOURCE_DOCUMENT'},sql);}
    finally {db.exec('ROLLBACK');}
  }
});

test('initializer requires actual byte pin, archive identity, actor/reason and explicit SQL; reimport fails', () => {
  for (const changes of [{actor:''},{reason:''},{schemaSql:undefined},{expectedSourceHash:undefined},
    {sourceBytes:Buffer.from('{}')},{expectedSourceHash:'0'.repeat(64)}]) {
    assert.throws(() => initializeFamilySourceDocument(db,{...options,...changes}),{code:'E_FAMILY_SOURCE_DOCUMENT'});
  }
  const archiveMismatch = {prepare(sql) {
    if (sql === 'SELECT source_id,sha256 FROM source_file WHERE logical_path=?') return {all:()=>[{source_id:94,sha256:'0'.repeat(64)}]};
    return db.prepare(sql);
  }};
  assert.throws(() => initializeFamilySourceDocument(archiveMismatch,options),{code:'E_FAMILY_SOURCE_DOCUMENT'});
  db.exec('BEGIN');
  try {assert.throws(() => initializeFamilySourceDocument(db,options),{code:'E_FAMILY_SOURCE_DOCUMENT'});}
  finally {db.exec('ROLLBACK');}
  assert.throws(() => initializeFamilySourceDocument(db,options),/already exists/u);
  assert.equal(db.isTransaction,false);
});

test('failed full-source parity rolls back supplement DDL and audit receipt without old-domain or authority writes', async () => {
  const brokenPath = join(dir,'broken.sqlite');
  await copyFile(authority,brokenPath);
  const broken = new DatabaseSync(brokenPath);
  try {
    broken.exec("UPDATE family_node SET name='typed divergence' WHERE node_id='K001'");
    const brokenBefore = snapshot(broken);
    assert.throws(() => initializeFamilySourceDocument(broken,options),{code:'E_FAMILY_SOURCE_DOCUMENT'});
    assert.equal(broken.isTransaction,false);
    assert.equal(snapshot(broken),brokenBefore);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'family_source_document_%'").get().n,0);
  } finally {broken.close();}
  assert.equal(snapshot(db),before);
  assert.equal(hash(await readFile(authority)),authorityHash);
});
