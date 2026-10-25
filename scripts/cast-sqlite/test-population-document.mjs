import assert from 'node:assert/strict';
import fs, {readFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {test} from 'node:test';
import {readSourceArchive} from './source-archive.mjs';
import {POPULATION_SOURCE_HASH, POPULATION_DOCUMENT_HASH, initializePopulationDocument, readPopulationDocument} from './population-document.mjs';

const sourceBytes = readSourceArchive('lore/regions/sources/population-2026-08.json',POPULATION_SOURCE_HASH);
const schemaSql = readFileSync(new URL('./population-document.sql',import.meta.url),'utf8');
const original = JSON.parse(sourceBytes);
const options = {sourceBytes,schemaSql,expectedSourceHash:POPULATION_SOURCE_HASH,actor:'population-unit-test',reason:'full source normalization'};
const hash = value => createHash('sha256').update(value).digest('hex');
const read = db => readPopulationDocument(db,{expectedSourceHash:POPULATION_SOURCE_HASH});
const rejects = fn => assert.throws(fn,/E_POPULATION_DOCUMENT/);
const create = () => {const db = new DatabaseSync(':memory:'); initializePopulationDocument(db,options); return db;};
const counts = {import:1,document:1,source:1,boundary:1,key:22,dong_density:427};

test('full ordered document parity: 7 root fields, 15 metadata fields, 427 exact decimals',() => {
  const db = create();
  try {
    assert.equal(sourceBytes.length,16891);
    assert.equal(hash(sourceBytes),POPULATION_SOURCE_HASH);
    assert.equal(hash(JSON.stringify(original)),POPULATION_DOCUMENT_HASH);
    const actual = read(db);
    assert.deepEqual(actual,original);
    assert.equal(JSON.stringify(actual),JSON.stringify(original));
    assert.equal(hash(JSON.stringify(actual)),POPULATION_DOCUMENT_HASH);
    assert.deepEqual(Object.keys(actual),Object.keys(original));
    assert.equal(Object.keys(actual.source).length,10);
    assert.equal(Object.keys(actual.boundary).length,5);
    assert.deepEqual(Object.entries(actual.density2126ByDong),Object.entries(original.density2126ByDong));
    assert.equal(actual.ratio,0.3);
    for (const [name,count] of Object.entries(counts)) assert.equal(db.prepare('SELECT count(*) AS n FROM population_'+name).get().n,count,name);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally {db.close();}
});

test('wrong or omitted runtime source pins fail closed',() => {
  const db=create();
  try {for (const expectedSourceHash of [undefined,'0'.repeat(64)]) rejects(() => readPopulationDocument(db,{expectedSourceHash}));}
  finally {db.close();}
});

for (const [table,column] of [['import','source_sha256'],['document','baseline'],['source','publisher'],['boundary','source'],['key','key'],['dong_density','density2126']]) {
  for (const mode of ['missing','changed','extra']) test(mode+' row rejected: '+table,() => {
    const db=create();
    try {
      const row=db.prepare('SELECT * FROM population_'+table+' LIMIT 1').get();
      // Corruption tests deliberately disable FK/check enforcement to exercise the reader itself.
      db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');
      if(mode==='missing') db.prepare('DELETE FROM population_'+table+' WHERE rowid=(SELECT rowid FROM population_'+table+' LIMIT 1)').run();
      if(mode==='changed') db.prepare('UPDATE population_'+table+' SET "'+column+'"=? WHERE rowid=(SELECT rowid FROM population_'+table+' LIMIT 1)').run(table==='dong_density'?0:'changed');
      if(mode==='extra') {
        if(table==='key') {row.ordinal=999;row.key='unknown';}
        else if(table==='dong_density') {row.dong_id='9999999999';row.ordinal=999;}
        else row.id=2;
        const keys=Object.keys(row);
        db.prepare('INSERT INTO population_'+table+' ('+keys.map(k=>'"'+k+'"').join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').run(...Object.values(row));
      }
      rejects(()=>read(db));
    } finally {db.close();}
  });
}

for (const sql of [
  "UPDATE population_import SET document_sha256='wrong'",
  "UPDATE population_import SET actor=''",
  "UPDATE population_key SET ordinal=999 WHERE object_name='document' AND ordinal=0",
  "UPDATE population_key SET key='unknown' WHERE object_name='boundary' AND ordinal=0",
  "UPDATE population_dong_density SET ordinal=999 WHERE ordinal=0",
  "UPDATE population_dong_density SET document_id=2 WHERE ordinal=0",
  "UPDATE population_dong_density SET dong_id='9999999999' WHERE ordinal=0"
]) test('metadata/order/map integrity: '+sql,() => {
  const db=create();
  try {db.exec('PRAGMA foreign_keys=OFF; PRAGMA ignore_check_constraints=ON');db.exec(sql);rejects(()=>read(db));}
  finally {db.close();}
});

for (const mode of ['bytes','pin','missing-pin','actor','reason','schema','unknown-root','unknown-source','unknown-boundary','unknown-map','missing-root','null','array','density-type']) test('import contract rejection and no schema: '+mode,() => {
  const db=new DatabaseSync(':memory:'), override={};
  try {
    if(mode==='bytes') override.sourceBytes=Buffer.concat([sourceBytes,Buffer.from(' ')]);
    if(mode==='pin') override.expectedSourceHash='0'.repeat(64);
    if(mode==='missing-pin') override.expectedSourceHash=undefined;
    if(mode==='actor') override.actor='';
    if(mode==='reason') override.reason=' ';
    if(mode==='schema') override.schemaSql='';
    if(['unknown-root','unknown-source','unknown-boundary','unknown-map','missing-root','null','array','density-type'].includes(mode)) {
      const value=structuredClone(original);
      if(mode==='unknown-root') value.unknown=true;
      if(mode==='unknown-source') value.source.unknown=true;
      if(mode==='unknown-boundary') value.boundary.unknown=true;
      if(mode==='unknown-map') value.density2126ByDong.unknown=1;
      if(mode==='missing-root') delete value.baseline;
      if(mode==='null') value.source=null;
      if(mode==='array') value.density2126ByDong=[];
      if(mode==='density-type') value.density2126ByDong['1111051500']='1304';
      override.sourceBytes=Buffer.from(JSON.stringify(value));
    }
    rejects(()=>initializePopulationDocument(db,{...options,...override}));
    assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
  } finally {db.close();}
});

test('active transaction remains owned by caller',() => {
  const db=new DatabaseSync(':memory:');
  try {db.exec('BEGIN');rejects(()=>initializePopulationDocument(db,options));assert.equal(db.isTransaction,true);db.exec('ROLLBACK');}
  finally {db.close();}
});

test('mid-density insert failure rolls back schema and preserves unrelated data',() => {
  const db=new DatabaseSync(':memory:');
  db.exec('CREATE TABLE unrelated (id INTEGER); INSERT INTO unrelated VALUES(17)');
  let writes=0;
  const guarded={get isTransaction(){return db.isTransaction;},exec:sql=>db.exec(sql),prepare(sql){
    const statement=db.prepare(sql);
    if(!sql.startsWith('INSERT INTO population_dong_density')) return statement;
    return {run(...args){if(++writes===214) throw Error('injected density failure');return statement.run(...args);}};
  }};
  try {
    assert.throws(()=>initializePopulationDocument(guarded,options),/injected density failure/);
    assert.equal(writes,214);
    assert.equal(db.isTransaction,false);
    assert.equal(db.prepare('SELECT id FROM unrelated').get().id,17);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'population_%'").get().n,0);
  } finally {db.close();}
});

test('runtime denies all source IO, JSON.parse, archive authority, and non-SELECT SQL',() => {
  const db=create(), originals=new Map(), parse=JSON.parse;
  const deny=()=>{throw Error('runtime source IO/parse denied');};
  const guarded={prepare(sql){assert.match(sql,/^SELECT\b/);assert.doesNotMatch(sql,/archive|json_/i);return db.prepare(sql);},exec:deny};
  try {
    for(const key of ['readFileSync','readFile','openSync','open','readdirSync','statSync','existsSync','createReadStream']) {originals.set(key,fs[key]);fs[key]=deny;}
    syncBuiltinESMExports();JSON.parse=deny;
    assert.equal(JSON.stringify(read(guarded)),JSON.stringify(original));
  } finally {JSON.parse=parse;for(const [key,value] of originals) fs[key]=value;syncBuiltinESMExports();db.close();}
});
