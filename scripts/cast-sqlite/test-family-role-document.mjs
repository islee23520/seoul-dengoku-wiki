import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { FAMILY_ROLE_SOURCE_HASH, FAMILY_ROLE_DOCUMENT_HASH, initializeFamilyRoleDocument, readFamilyRoleDocument } from './family-role-document.mjs';

const dir=await mkdtemp(join(tmpdir(),'family-role-document-'));
after(()=>rm(dir,{recursive:true,force:true}));
const dbPath=join(dir,'roles.sqlite');
const db=new DatabaseSync(dbPath);
after(()=>db.close());
db.exec('PRAGMA foreign_keys=ON; CREATE TABLE untouched (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO untouched VALUES (1,\'unchanged\')');
const sourceBytes=readSourceArchive('lore/name-pools/cast-family-role-decisions.json', FAMILY_ROLE_SOURCE_HASH);
const schemaSql=await readFile(new URL('./family-role-document.sql',import.meta.url),'utf8');
const expected=JSON.parse(sourceBytes);
const hash=v=>createHash('sha256').update(v).digest('hex');
const options={schemaSql,sourceBytes,expectedSourceHash:FAMILY_ROLE_SOURCE_HASH,actor:'family-role-document-test',reason:'Verify bounded full source without changing approval'};
const typed=connection=>({prepare(sql){
  assert.match(sql,/^SELECT /u);
  assert.doesNotMatch(sql,/\bsource_file\b|\bsource_record\b|\bfamily_role_decision(?:_fact|_source)?\b|\bjson_(?:extract|each|tree)\b/iu);
  return connection.prepare(sql);
}});
initializeFamilyRoleDocument(db,options);
const tables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'family_role_%' ORDER BY name").all().map(r=>r.name);

test('whole actual source serialized parity and independently fixed group/child denominators',()=>{
  const actual=readFamilyRoleDocument(typed(db));
  assert.equal(sourceBytes.length,1220619);
  assert.equal(hash(sourceBytes),FAMILY_ROLE_SOURCE_HASH);
  assert.deepEqual(actual,expected);
  assert.equal(JSON.stringify(actual),JSON.stringify(expected));
  assert.equal(hash(JSON.stringify(actual)),FAMILY_ROLE_DOCUMENT_HASH);
  const counts={finalOwnerAuthoredRoles:385,approvedExternalMaternalAncestors:24,approvedConfirmedFatherRoles:2,
    ownerAuthoredRoleOnly:1353,recursiveAncestorCorrections:2,sourceBoundRoleCorrections:19,maternalCorrections:17,derivedParentRoles:3231,unresolved:0};
  for(const [group,count]of Object.entries(counts))assert.equal(actual[group].length,count,group);
  assert.equal(Object.values(counts).reduce((a,b)=>a+b),5033);
  assert.equal(actual.approvedExternalMaternalAncestors.flatMap(r=>r.sourceRefs).length,48);
  assert.equal(actual.approvedExternalMaternalAncestors.flatMap(r=>r.allNodeReferences).length,31);
  assert.equal(actual.approvedExternalMaternalAncestors.flatMap(r=>r.timelinePointers).length,24);
  assert.equal(actual.recursiveAncestorCorrections.flatMap(r=>r.sourceRefs).length,6);
  assert.equal(actual.sourceBoundRoleCorrections.flatMap(r=>r.sourceRefs).length,39);
  assert.equal(actual.derivedParentRoles.filter(r=>Object.hasOwn(r,'lineage')).length,2287);
  assert.equal(actual.sourceBoundRoleCorrections.filter(r=>Object.hasOwn(r,'basis')).length,7);
  assert.equal(db.prepare('SELECT value FROM untouched').get().value,'unchanged');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  console.log('FAMILY_ROLE_DENOMINATORS '+JSON.stringify(counts)+'; refs=93; nodeRefs=31; timelinePointers=24');
});

test('missing and changed rows on every consumed table, and every authored scalar column, fail closed',()=>{
  assert.equal(tables.length,15);
  let mutations=0;
  const reject=(sql,params=[])=>{
    db.exec('BEGIN; PRAGMA defer_foreign_keys=ON; PRAGMA ignore_check_constraints=ON');
    try {
      const change=db.prepare(sql).run(...params);assert.ok(change.changes>0,sql);
      assert.throws(()=>readFamilyRoleDocument(typed(db)),{code:'E_FAMILY_ROLE_DOCUMENT'},sql);
      mutations++;
    } finally {db.exec('ROLLBACK; PRAGMA ignore_check_constraints=OFF');}
  };
  for(const table of tables){
    reject('DELETE FROM '+table+' WHERE rowid=(SELECT max(rowid) FROM '+table+')');
    const row=db.prepare('SELECT rowid AS mutation_rowid,* FROM '+table+' ORDER BY rowid LIMIT 1').get();
    for(const [key,value]of Object.entries(row)){
      if(key==='mutation_rowid')continue;
      if(table==='family_role_document_import' && ['actor','reason'].includes(key)) {
        reject('UPDATE '+table+' SET "'+key+'"=? WHERE rowid=?',['',row.mutation_rowid]);continue;
      }
      reject('UPDATE '+table+' SET "'+key+'"=? WHERE rowid=?',[typeof value==='number'?value+100000:value===null?'changed-null':value+' changed',row.mutation_rowid]);
    }
  }
  assert.equal(JSON.stringify(readFamilyRoleDocument(typed(db))),JSON.stringify(expected));
  console.log('FAMILY_ROLE_REJECTED_MUTATIONS '+mutations);
});

test('wrong pins, explicit import contract, strict unknown fields and invalid nested types reject',()=>{
  assert.throws(()=>readFamilyRoleDocument(db,{expectedSourceHash:'0'.repeat(64)}),{code:'E_FAMILY_ROLE_DOCUMENT'});
  for(const changes of [{actor:''},{reason:''},{schemaSql:undefined},{expectedSourceHash:undefined},
    {expectedSourceHash:'0'.repeat(64)},{sourceBytes:Buffer.from('{}')},{sourceBytes:Buffer.concat([sourceBytes,Buffer.from('\n')])}])
    assert.throws(()=>initializeFamilyRoleDocument(db,{...options,...changes}),{code:'E_FAMILY_ROLE_DOCUMENT'});
  const edits=[d=>{d.unknown=true;},d=>{d.approvedExternalMaternalAncestors[0].before.unknown=true;},
    d=>{d.approvedExternalMaternalAncestors[0].sourceRefs[0].unknown=true;},
    d=>{d.approvedExternalMaternalAncestors[0].timelinePointers[0].unknown=true;},
    d=>{d.derivedParentRoles[0].lineage.unknown=true;},d=>{d.unresolved.push({unknown:true});}];
  for(const edit of edits){
    const d=structuredClone(expected);edit(d);
    assert.throws(()=>initializeFamilyRoleDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(d))}),/unknown field|array:/u);
  }
  const invalid=structuredClone(expected);invalid.approvedExternalMaternalAncestors[0].nameCollision=1;
  assert.throws(()=>initializeFamilyRoleDocument(db,{...options,sourceBytes:Buffer.from(JSON.stringify(invalid))}),/type:/u);
  db.exec('BEGIN');
  try{assert.throws(()=>initializeFamilyRoleDocument(db,options),/explicit SQL\/transaction/u);}finally{db.exec('ROLLBACK');}
  assert.throws(()=>initializeFamilyRoleDocument(db,options),/already exists/u);
  assert.equal(db.isTransaction,false);
});

test('failed post-insert full-document validation rolls back DDL and all writes',()=>{
  const fresh=new DatabaseSync(':memory:');
  fresh.exec('CREATE TABLE untouched (value TEXT); INSERT INTO untouched VALUES (\'unchanged\')');
  try {
    const badSql=schemaSql+"\nCREATE TRIGGER change_import AFTER INSERT ON family_role_document_import BEGIN UPDATE family_role_document_import SET authorization='changed'; END;";
    assert.throws(()=>initializeFamilyRoleDocument(fresh,{...options,schemaSql:badSql}),{code:'E_FAMILY_ROLE_DOCUMENT'});
    assert.equal(fresh.isTransaction,false);
    assert.deepEqual(fresh.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all().map(r=>r.name),['untouched']);
    assert.equal(fresh.prepare('SELECT value FROM untouched').get().value,'unchanged');
    initializeFamilyRoleDocument(fresh,options);
    assert.equal(JSON.stringify(readFamilyRoleDocument(typed(fresh))),JSON.stringify(expected));
  } finally {fresh.close();}
});

test('fresh runtime imports and repeated read-only reopen work with source filesystem and JSON parser denied',()=>{
  const child=spawnSync(process.execPath,['--input-type=module','-e',`
    import assert from 'node:assert/strict';
    import fs from 'node:fs'; import fsp from 'node:fs/promises';
    import {syncBuiltinESMExports} from 'node:module';
    import {DatabaseSync} from 'node:sqlite'; import {createHash} from 'node:crypto';
    const deny=()=>{throw Error('source filesystem/parser denied')};
    const original=fs.readFileSync;
    const originalOpen=fs.openSync;
    fs.readFileSync=(p,...a)=>/\\.(?:mjs|js|cjs)$/.test(String(p))?original(p,...a):deny();
    fs.openSync=(p,...a)=>/\\.(?:mjs|js|cjs)$/.test(String(p))?originalOpen(p,...a):deny();
    for(const key of ['readFile','readdir','readdirSync','open','stat','statSync','access','accessSync'])fs[key]=deny;
    for(const key of ['readFile','readdir','open','stat','access'])fsp[key]=deny;
    syncBuiltinESMExports(); JSON.parse=deny;
    const {readFamilyRoleDocument}=await import(${JSON.stringify(new URL('./family-role-document.mjs',import.meta.url).href)});
    for(let reopen=0;reopen<2;reopen++){
      const db=new DatabaseSync(${JSON.stringify(dbPath)},{readOnly:true});
      const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/source_file|source_record|family_role_decision|json_extract|json_each|json_tree/i);return db.prepare(sql)}};
      for(let repeat=0;repeat<2;repeat++)assert.equal(createHash('sha256').update(JSON.stringify(readFamilyRoleDocument(typed))).digest('hex'),${JSON.stringify(FAMILY_ROLE_DOCUMENT_HASH)});
      db.close();
    }
    console.log('FAMILY_ROLE_DB_ONLY_EXACT');
  `],{encoding:'utf8',timeout:60000});
  assert.equal(child.status,0,child.stderr);
  assert.match(child.stdout,/FAMILY_ROLE_DB_ONLY_EXACT/u);
});
