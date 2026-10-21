import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import { readFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { RAIL_SOURCE_HASHES, RAIL_DOCUMENT_HASHES, initializeRailSourceDocuments, readRailSourceDocument } from './rail-source-documents.mjs';

const schemaSql = readFileSync(new URL('./rail-source-documents.sql',import.meta.url),'utf8');
const sources = Object.fromEntries(Object.entries(RAIL_SOURCE_HASHES).map(([p,h]) => [p,{bytes:readSourceArchive(p,h),expectedSourceHash:h}]));
const documents = Object.fromEntries(Object.entries(sources).map(([p,s]) => [p,JSON.parse(s.bytes)]));
const paths = Object.keys(sources);
const options = {schemaSql,sources,actor:'rail-unit-test',reason:'complete seven-source preservation'};
const hash = x => createHash('sha256').update(x).digest('hex');
const read = (db,p) => readRailSourceDocument(db,{logicalPath:p,expectedSourceHash:RAIL_SOURCE_HASHES[p]});
const rejects = fn => assert.throws(fn,/E_RAIL_SOURCE_DOCUMENT/);
const create = () => { const db = new DatabaseSync(':memory:'); initializeRailSourceDocuments(db,options); return db; };
const counts = {
  "corrections_document": 1,
  "correction": 3,
  "correction_line": 3,
  "identities_document": 1,
  "identity_group": 74,
  "identity_member": 163,
  "identity_line": 157,
  "bindings_document": 1,
  "binding": 387,
  "unresolved": 0,
  "adjacency_document": 1,
  "adjacency_source": 1,
  "station_codes": 1,
  "station_code": 411,
  "regular_line": 25,
  "regular_path": 33,
  "regular_stop": 815,
  "control_document": 1,
  "control_override": 28,
  "control_polity": 28,
  "passage_decision": 10,
  "retired_passage_decision": 3,
  "connected_document": 1,
  "connected_source": 1,
  "connected_station": 610,
  "gtx_document": 1,
  "gtx_project": 9,
  "gtx_path": 13,
  "gtx_station": 120,
  "gtx_pending_station": 2,
  "import": 7,
  "key": 9904
};

for (const p of paths) test('complete serialized parity: ' + p,() => {
  const db = create();
  try {
    assert.equal(hash(sources[p].bytes),RAIL_SOURCE_HASHES[p]);
    const actual = read(db,p);
    assert.deepEqual(actual,documents[p]);
    assert.equal(JSON.stringify(actual),JSON.stringify(documents[p]));
    assert.equal(hash(JSON.stringify(actual)),RAIL_DOCUMENT_HASHES[p]);
  } finally { db.close(); }
});

test('exact counts in all 30 domain tables and seven receipts',() => {
  const db = create();
  try {
    for (const [name,n] of Object.entries(counts)) assert.equal(db.prepare('SELECT count(*) AS n FROM rail_source_' + name).get().n,n,name);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
    assert.equal(read(db,paths[2]).unresolved.length,0);
    assert.equal(read(db,paths[5]).stations.length,610);
    assert.equal(read(db,paths[6]).projects.filter(p => p.opening2126Control === null && p.opening2126Passage === null).length,9);
  } finally { db.close(); }
});

for (const p of paths) test('wrong runtime hashes/path: ' + p,() => {
  const db = create();
  try {
    rejects(() => readRailSourceDocument(db,{logicalPath:p,expectedSourceHash:'0'.repeat(64)}));
    rejects(() => readRailSourceDocument(db,{logicalPath:'./'+p,expectedSourceHash:RAIL_SOURCE_HASHES[p]}));
    rejects(() => readRailSourceDocument(db,{logicalPath:p}));
  } finally { db.close(); }
});

for (const [index,domain,column] of [[0,'correction','name'],[1,'identity_group','name'],[2,'binding','officialName'],[3,'regular_stop','name'],[4,'control_override','stationId'],[5,'connected_station','nameKo'],[6,'gtx_project','id']]) {
  for (const mode of ['delete','change','extra','parent','ordinal','unknown-key']) test(mode + ' row rejected: ' + domain,() => {
    const db = create(), p = paths[index];
    try {
      const row = db.prepare('SELECT * FROM rail_source_' + domain + ' ORDER BY object_path LIMIT 1').get();
      if (mode === 'delete') db.prepare('DELETE FROM rail_source_' + domain + ' WHERE object_path=?').run(row.object_path);
      if (mode === 'change') db.prepare('UPDATE rail_source_' + domain + ' SET "' + column + '"=? WHERE object_path=?').run('changed',row.object_path);
      if (mode === 'parent') db.prepare('UPDATE rail_source_' + domain + ' SET parent_path=? WHERE object_path=?').run('/wrong',row.object_path);
      if (mode === 'ordinal') db.prepare('UPDATE rail_source_' + domain + ' SET ordinal=9999 WHERE object_path=?').run(row.object_path);
      if (mode === 'extra') {
        row.object_path='/orphan'; row.parent_path='/orphan'; row.ordinal=9999;
        const cols=Object.keys(row);
        db.prepare('INSERT INTO rail_source_' + domain + ' (' + cols.map(c=>'"'+c+'"').join(',') + ') VALUES (' + cols.map(()=>'?').join(',') + ')').run(...Object.values(row));
      }
      if (mode === 'unknown-key') db.prepare('INSERT INTO rail_source_key VALUES(?,?,?,?,?)').run(p,row.object_path,9999,'unknown',0);
      rejects(() => read(db,p));
    } finally { db.close(); }
  });
}

for (const p of paths) test('import rejects changed bytes, wrong pin, and unknown fields: ' + p,() => {
  for (const mode of ['bytes','pin','unknown-root','unknown-nested']) {
    const db = new DatabaseSync(':memory:'), altered = {...sources};
    if (mode === 'bytes') altered[p]={...sources[p],bytes:Buffer.concat([sources[p].bytes,Buffer.from(' ' )])};
    if (mode === 'pin') altered[p]={...sources[p],expectedSourceHash:'0'.repeat(64)};
    if (mode.startsWith('unknown')) {
      const value=structuredClone(documents[p]);
      const child = mode === 'unknown-root' ? value : Object.values(value).find(v => Array.isArray(v) && v.length && typeof v[0] === 'object')?.[0] ?? value.source;
      child.unknownField='not accepted';
      altered[p]={...sources[p],bytes:Buffer.from(JSON.stringify(value))};
    }
    try {
      if (mode.startsWith('unknown')) assert.throws(() => initializeRailSourceDocuments(db,{...options,sources:altered}),/unknown\/missing field/);
      else rejects(() => initializeRailSourceDocuments(db,{...options,sources:altered}));
      assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_schema').get().n,0);
    } finally { db.close(); }
  }
});

test('exact source set, provenance, schema, and transaction guards',() => {
  const db = new DatabaseSync(':memory:');
  try {
    const missing={...sources}; delete missing[paths[0]];
    for (const override of [{sources:missing},{sources:{...sources,unexpected:sources[paths[0]]}},{actor:''},{reason:' '},{schemaSql:''}]) rejects(() => initializeRailSourceDocuments(db,{...options,...override}));
    db.exec('BEGIN'); rejects(() => initializeRailSourceDocuments(db,options)); assert.equal(db.isTransaction,true); db.exec('ROLLBACK');
  } finally { db.close(); }
});

test('transaction rollback after third receipt insertion preserves unrelated table',() => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE unrelated (id INTEGER); INSERT INTO unrelated VALUES(17)');
  const guarded = {get isTransaction(){return db.isTransaction;},exec:sql=>db.exec(sql),prepare(sql){
    const statement=db.prepare(sql);
    if (!sql.startsWith('INSERT INTO rail_source_import')) return statement;
    return {run(...args){if(args[0]===paths[3])throw Error('injected fourth-source failure');return statement.run(...args);}};
  }};
  try {
    assert.throws(()=>initializeRailSourceDocuments(guarded,options),/injected fourth-source failure/);
    assert.equal(db.isTransaction,false);
    assert.deepEqual(db.prepare('SELECT * FROM unrelated').all().map(row => ({...row})),[{id:17}]);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'rail_source_%'").get().n,0);
  } finally { db.close(); }
});

for (const mode of ['receipt-delete','receipt-hash','receipt-document','key-delete','key-null','key-order','map-value','empty-path','null-value','boolean','absent-value']) test('metadata and nested integrity: ' + mode,() => {
  const db=create();
  let p=paths[6];
  try {
    if(mode==='receipt-delete') {db.exec('PRAGMA foreign_keys=OFF');db.prepare('DELETE FROM rail_source_import WHERE logical_path=?').run(p);}
    if(mode==='receipt-hash') db.prepare('UPDATE rail_source_import SET source_sha256=? WHERE logical_path=?').run('wrong',p);
    if(mode==='receipt-document') db.prepare('UPDATE rail_source_import SET document_sha256=? WHERE logical_path=?').run('wrong',p);
    if(mode==='key-delete') db.prepare("DELETE FROM rail_source_key WHERE logical_path=? AND object_path='' AND ordinal=0").run(p);
    if(mode==='key-null') db.prepare("UPDATE rail_source_key SET is_null=1 WHERE logical_path=? AND object_path='' AND key='projects'").run(p);
    if(mode==='key-order') db.prepare("UPDATE rail_source_key SET ordinal=100 WHERE logical_path=? AND object_path='' AND ordinal=0").run(p);
    if(mode==='map-value') {p=paths[3];db.prepare("UPDATE rail_source_station_code SET station_id='changed' WHERE ordinal=0").run();}
    if(mode==='empty-path') db.prepare('DELETE FROM rail_source_gtx_station WHERE parent_path=?').run('/projects/0/paths/0');
    if(mode==='null-value') db.prepare("UPDATE rail_source_key SET is_null=0 WHERE logical_path=? AND object_path='/projects/0' AND key='opening2126Control'").run(p);
    if(mode==='boolean') db.prepare('UPDATE rail_source_gtx_project SET surveyedTrackGeometry=1 WHERE ordinal=0').run();
    if(mode==='absent-value') db.prepare("UPDATE rail_source_gtx_project SET sourceUpdatedAt='invented' WHERE ordinal=0").run();
    rejects(()=>read(db,p));
  } finally {db.close();}
});

test('runtime denies FS, JSON.parse, archive authority, and all non-SELECT SQL: 7/7',() => {
  const db=create(), originals=new Map(), originalParse=JSON.parse;
  const deny=()=>{throw Error('runtime source IO/parse denied');};
  const selectOnly={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/source_record|archive|json_extract/i);return db.prepare(sql);},exec:deny};
  try {
    db.exec('PRAGMA query_only=ON');
    for(const name of ['readFileSync','readSync','openSync','createReadStream']){originals.set(name,fs[name]);fs[name]=deny;}
    const promiseOriginals=new Map();
    for(const name of ['readFile','open']){promiseOriginals.set(name,fs.promises[name]);fs.promises[name]=deny;}
    try {
      syncBuiltinESMExports(); JSON.parse=deny;
      for(const p of paths)assert.equal(JSON.stringify(read(selectOnly,p)),JSON.stringify(documents[p]));
    } finally { for(const [name,fn]of promiseOriginals)fs.promises[name]=fn; }
  } finally {
    JSON.parse=originalParse;for(const [name,fn]of originals)fs[name]=fn;syncBuiltinESMExports();db.close();
  }
});
