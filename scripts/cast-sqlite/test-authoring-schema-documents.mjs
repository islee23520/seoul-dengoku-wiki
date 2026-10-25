import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { AUTHORING_SCHEMA_SOURCE_HASHES as pins, initializeAuthoringSchemaDocuments as initialize, readAuthoringSchemaDocument as readDocument } from './authoring-schema-documents.mjs';
import { mapTextCorpusDocuments } from './text-corpus-documents.mjs';
const root = new URL('../../', import.meta.url);
const paths = Object.keys(pins);
const sourceArchive = new DatabaseSync(new URL('../../.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite', import.meta.url), { readOnly: true });
let sources;
try {
  sources = Object.fromEntries(paths.map(p => [p, { bytes: Buffer.from(sourceArchive.prepare(
    'SELECT raw_bytes FROM evidence WHERE identity=? AND logical_path=? AND sha256=?'
  ).get('scope-read:' + p, p, pins[p]).raw_bytes), expectedSourceHash: pins[p] }]));
} finally { sourceArchive.close(); }
const originals = Object.fromEntries(paths.map(p => [p,JSON.parse(sources[p].bytes)]));
const documentHashes = {
  "lore/ailments/authoring.schema.json": "f2f7a09e5c93a3469521e432c0406bcf7a80d6987ad070d000b6220b45a72ccd",
  "lore/authoring.atlas.schema.json": "fe5c2b28c1de7bd615cab5eadeac254d60481b4416d9022f247f0afb5b6bc9aa",
  "lore/authoring.schema.json": "0589d326859ba39810db57c77d53878fe3fa0edbda973c8db3bfb7abcf3c6e0a",
  "lore/authoring.shared.schema.json": "b3a5aac755e49560c88d278dd984d7c03bbe4da08684be9aa4a327c378838b33",
  "lore/bestiary/authoring.schema.json": "feb8777ce999632fde5a53a94e214b1b53d69aedc3ab4444a1817e3b8fc587ef",
  "lore/characters/authoring.schema.json": "55e099e4ecbe5fe85d350081d0d4ee089e667ac95733f7efee5f703f0f86ea95",
  "lore/chronology/authoring.schema.json": "c2298fb189227c20f7c92fdc321251973f4c6791de7c59039648aed120d64b8e",
  "lore/culture/authoring.schema.json": "5c80d7c30bf48103aa0abcb2765d97a77e050c7624b21e78feabbba06eb90f12",
  "lore/economy/authoring.schema.json": "e2e78a00bd5780f8933fdcaabbe4995ef783897dc387c32f255fb4ecfacdd443",
  "lore/editorial/Naming-Ledger.schema.json": "a217a48bc7f217a40f27ab7f46d40bb86d6aa8e24b6d2937cb73ebb3adb6482a",
  "lore/editorial/authoring.schema.json": "8390de81e9cc6c738678685a5d2f48b195c47adde5ad3b6fe48720a90e2d0ae9",
  "lore/factions/authoring.schema.json": "1089c21ad4058d8d7bf24f10b313062d994fd995aa1df40b0c8790de99af87b3",
  "lore/goods/authoring.schema.json": "c42ff4f7b3e3cc5c9d82ff44d150e6e8e4acae95eb3e09daa0f5b8815b8b8d0e",
  "lore/name-pools/authoring.schema.json": "5da355cbb778174f9beb8a9629cf62eae66bd3f1da35c1479d5e6da922f62542",
  "lore/offices/authoring.schema.json": "7e437d4bc43356aa3df1d020c7e70c341a5e7849a0383bce98a29422668c3508",
  "lore/overview/authoring.schema.json": "5ffc28bff618f85b7d3e9b57dd4ded6d577d0a6e50bb9e611f14dc12d5b7b242",
  "lore/people-and-machines/authoring.schema.json": "c048a88038c8684c25f1656d60426c7ee3ed351ed750d117302d247c6ec06b05",
  "lore/places/authoring.schema.json": "311fd02660711f30b5a98e2c7c0f0d70ae1049df03c4b22992f836bbab5fb5f4",
  "lore/regions/authoring.schema.json": "2fb6971d114ba5f1b2105b10255836a68e53b08628aaa6e86fa47d42205aef1f",
  "lore/structures/authoring.schema.json": "3f3b4552cd8d06c4c28e6983cea816bb48348f226e1b60977669b9392dc9723b",
  "lore/technology/authoring.schema.json": "763087e91d37c0a897772098a1c9ec25d9fd394c1f9643b6c0caf8c180a05b8f"
};
const schemaSql = fs.readFileSync(new URL('./authoring-schema-documents.sql',import.meta.url),'utf8');
const canonicalSql = fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8');
const options = {schemaSql,sources,actor:'schema-preservation-test',reason:'Preserve all 21 schema documents'};
const hash = v => createHash('sha256').update(v).digest('hex');
const rejected = fn => assert.throws(fn,{code:'E_AUTHORING_SCHEMA_DOCUMENT'});
const read = (db,p=paths[0]) => readDocument(db,{logicalPath:p,expectedSourceHash:pins[p]});
function fresh() { const db = new DatabaseSync(':memory:'); initialize(db,options); return db; }
const tables = ['receipt','node','keyword_order','property','definition','pattern_property','all_of','any_of','one_of','prefix_item','required','type','enum','const'].map(t=>'authoring_schema_'+t);
function keyOrder(v,p='',out=[]) { if(Array.isArray(v))v.forEach((c,i)=>keyOrder(c,p+'/'+i,out));else if(v && typeof v==='object'){out.push([p,Object.keys(v)]);for(const [k,c] of Object.entries(v))keyOrder(c,p+'/'+k,out);}return out; }

test('all 21 complete sources: independent byte and ordered-document pins, exact fields and key order, canonical coexistence',()=>{
 const db=new DatabaseSync(':memory:');
 try {
  db.exec(canonicalSql);
  db.exec("INSERT INTO build_metadata VALUES ('coexistence','untouched')");
  const result=initialize(db,options);
  assert.equal(result.documents,21);
  for(const p of paths){ assert.equal(hash(sources[p].bytes),pins[p]);assert.equal(hash(JSON.stringify(originals[p])),documentHashes[p]); assert.notEqual(pins[p],documentHashes[p]);const value=read(db,p);assert.equal(JSON.stringify(value),JSON.stringify(originals[p]));assert.deepEqual(keyOrder(value),keyOrder(originals[p])); }
  assert.equal(db.prepare("SELECT value FROM build_metadata WHERE key='coexistence'").get().value,'untouched');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(db.prepare("SELECT count(*) n FROM source_file").get().n,0);
  for(const t of tables){const ddl=db.prepare('SELECT sql FROM sqlite_schema WHERE name=?').get(t).sql;assert.match(ddl,/STRICT$/);assert.doesNotMatch(ddl,/\b(BLOB|ANY|JSON)\b/iu);}
  rejected(()=>initialize(db,options));assert.equal(JSON.stringify(read(db)),JSON.stringify(originals[paths[0]]));
  console.log('AUTHORING_SCHEMA_COUNTS '+JSON.stringify(result));
 }finally{db.close();}
});

for(const table of tables)for(const mode of ['missing','changed','extra'])test(table+': '+mode+' row rejected',()=>{
 const db=fresh();try{
  db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
  const columns=db.prepare('PRAGMA table_info('+table+')').all();
  if(mode==='missing')db.exec('DELETE FROM '+table+' WHERE rowid=(SELECT min(rowid) FROM '+table+')');
  if(mode==='changed'){
   const col=columns.find(c=>!['logical_path','node_id','ordinal'].includes(c.name));
   db.exec('UPDATE '+table+' SET '+col.name+"="+(col.type==='TEXT'?"'tampered'":'99')+' WHERE rowid=(SELECT min(rowid) FROM '+table+')');
  }
  if(mode==='extra')db.exec('INSERT INTO '+table+' SELECT '+columns.map(c=>c.name==='logical_path'?"'extra-schema.json'":c.name).join(',')+' FROM '+table+' LIMIT 1');
  rejected(()=>read(db));
 }finally{db.close();}
});

for(const table of tables.filter(t=>!['authoring_schema_node','authoring_schema_receipt'].includes(t)))test(table+': ordinal gap rejected',()=>{
 const db=fresh();try{db.exec('PRAGMA ignore_check_constraints=ON');db.exec('UPDATE '+table+' SET ordinal=ordinal+100 WHERE rowid=(SELECT min(rowid) FROM '+table+')');rejected(()=>read(db));}finally{db.close();}
});

test('real scalar data plus stored digest substitution cannot replace independent pins',()=>{
 const db=fresh();try{
  const p='lore/editorial/Naming-Ledger.schema.json';const changed=structuredClone(originals[p]);changed.title='Substituted schema';
  db.prepare('UPDATE authoring_schema_node SET title=? WHERE logical_path=? AND node_id=0').run(changed.title,p);
  db.prepare('UPDATE authoring_schema_receipt SET document_sha256=? WHERE logical_path=?').run(hash(JSON.stringify(changed)),p);
  rejected(()=>read(db,p));
 }finally{db.close();}
});

test('wrong pins, extra/missing sources and options reject without database writes',()=>{
 const db=new DatabaseSync(':memory:');try{
  const p=paths[0];
  for(const input of [ {...options,sources:{...sources,[p]:{...sources[p],expectedSourceHash:'0'.repeat(64)}}}, {...options,sources:{...sources,[p]:{...sources[p],bytes:Buffer.from('{}')}}}, {...options,sources:Object.fromEntries(Object.entries(sources).slice(1))}, {...options,sources:{...sources,extra:sources[p]}}, {...options,actor:''}, {...options,unexpected:true} ])rejected(()=>initialize(db,input));
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema").get().n,0);
  initialize(db,options);
  rejected(()=>readDocument(db,{logicalPath:p,expectedSourceHash:'0'.repeat(64)}));
  rejected(()=>readDocument(db,{logicalPath:'extra.json',expectedSourceHash:pins[p]}));
 }finally{db.close();}
});

test('strict keyword shape is checked before ordered-document pin, not silently discarded',()=>{
 const db=fresh();try{
  for(const statement of ["UPDATE authoring_schema_keyword_order SET keyword='unknown' WHERE rowid=1", "UPDATE authoring_schema_type SET name='nonsense' WHERE rowid=1", "UPDATE authoring_schema_node SET unique_items=4 WHERE node_id=0", "UPDATE authoring_schema_const SET number_value=3 WHERE value_kind='string'"]){assert.throws(()=>db.exec(statement));}
  // Bypass SQLite checks to exercise reconstruction's shape and canonical-row validation.
  db.exec('PRAGMA ignore_check_constraints=ON');
  db.exec("UPDATE authoring_schema_node SET min_items=-1 WHERE rowid=1");
  rejected(()=>read(db));
 }finally{db.close();}
});

test('DDL and partially inserted receipts/data roll back on late insertion failure',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec("CREATE TABLE sentinel(value TEXT) STRICT; INSERT INTO sentinel VALUES ('kept')");
  const sql=schemaSql+" CREATE TRIGGER authoring_schema_test_abort BEFORE INSERT ON authoring_schema_type BEGIN SELECT RAISE(ABORT,'injected'); END;";
  rejected(()=>initialize(db,{...options,schemaSql:sql}));
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'authoring_schema_%'").get().n,0);
  assert.equal(db.prepare('SELECT value FROM sentinel').get().value,'kept');
  db.exec('BEGIN');initialize(db,options);db.exec('ROLLBACK');
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'authoring_schema_%'").get().n,0);
 }finally{db.close();}
});

test('SELECT-only runtime denies filesystem and JSON.parse; reconstructed shared definitions drive existing corpus mapper and reject depth 7',()=>{
 const db=fresh();
 const file={source_id:1,corpus_kind:'example',content_policy:'local-corpus',document:{version:1,domain:'root',id:'__EXAMPLE__:root',slug:'schema-proof',status:'draft',tense:{en:'present',ko:'present'},provenance:{original_anchor:'proof',original_hash:null,history:[]},source:{kind:'original-fiction',refs:[]},locales:{en:{title:'Proof',summary:'Proof',tense:'present'},ko:{title:'Proof',summary:'Proof',tense:'present'}},content:[{kind:'heading',anchor:'proof',depth:2,text:{en:'Proof',ko:'Proof'}}],data:{}}};
 const bad=structuredClone(file);bad.document.content[0].depth=7;
 const parse=JSON.parse;const originalRead=fs.readFileSync;const originalPrepare=db.prepare;
 const deny=()=>{throw new Error('source access forbidden');};
 try{
  fs.readFileSync=deny;syncBuiltinESMExports();JSON.parse=deny;
  const selectOnly={prepare(sql){assert.match(sql,/^SELECT /);return originalPrepare.call(db,sql);},exec:deny};
  const shared=read(selectOnly,'lore/authoring.shared.schema.json');
  const rows=mapTextCorpusDocuments({files:[file],definitions:shared.$defs});
  assert.equal(rows.text_document_node[0].depth,2);
  assert.throws(()=>mapTextCorpusDocuments({files:[bad],definitions:shared.$defs}),{code:'E_TEXT_DOCUMENT_SHAPE'});
  for(const p of paths)assert.equal(JSON.stringify(read(selectOnly,p)),JSON.stringify(originals[p]));
 }finally{JSON.parse=parse;fs.readFileSync=originalRead;syncBuiltinESMExports();db.close();}
});
