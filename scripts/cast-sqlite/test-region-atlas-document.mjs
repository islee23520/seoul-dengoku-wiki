import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { REGION_ATLAS_SOURCE_HASH, REGION_ATLAS_OBJECT_HASH, initializeRegionAtlasDocument, readRegionAtlasDocument, readRegionAtlasData } from './region-atlas-document.mjs';

// Independent fixed pins, never derived from the implementation or database receipt.
const BYTE_PIN='89d559fc31ce0644e331c6a54b8cfc997bf482b05f7c940694ea68f4f304fdf1';
const OBJECT_PIN='9bfacf21cd30d659182988f201f3603be01f1c0ee7eacedb2fd1b1f0111281e7';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const schemaSql=await readFile(new URL('./region-atlas-document.sql',import.meta.url),'utf8');
const sourceBytes=await readFile(new URL('../../snapshots/build-inputs/atlas-data.js',import.meta.url));
const source=sourceBytes.toString('utf8');
assert.ok(source.startsWith('window.SEOUL_REGION_ATLAS=') && source.endsWith(';\n'));
const expected=JSON.parse(source.slice('window.SEOUL_REGION_ATLAS='.length,-2));
const dir=await mkdtemp(join(tmpdir(),'region-atlas-document-'));
after(()=>rm(dir,{recursive:true,force:true}));
const dbPath=join(dir,'atlas.sqlite'), db=new DatabaseSync(dbPath);
after(()=>db.close());
db.exec(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
db.exec("INSERT INTO state(state_id,name_ko) VALUES ('atlas-test','coexistence')");
const opts={schemaSql,sourceBytes,expectedSourceHash:BYTE_PIN,actor:'atlas-preservation-test',reason:'Historical source preservation, not current map admission'};
const start=performance.now();
const counts=initializeRegionAtlasDocument(db,opts);
console.log('IMPORT_MS',Math.round(performance.now()-start),'COUNTS',JSON.stringify(counts));
const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/\b(?:source_file|source_record|raw_bytes|json_extract|json_each|json_tree)\b/i);return db.prepare(sql);}};
const read=()=>readRegionAtlasDocument(typed,{expectedSourceHash:BYTE_PIN});
const tables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'region_atlas_document_%' ORDER BY name").all().map(r=>r.name);
const error={code:'E_REGION_ATLAS_DOCUMENT'};
function mutation(sql,check=()=>assert.throws(read,error)) {
  db.exec('SAVEPOINT mutation; PRAGMA defer_foreign_keys=ON');
  try {db.exec(sql);check();}finally{db.exec('ROLLBACK TO mutation; RELEASE mutation');}
}

test('complete original bytes and ordered object, all 139863 sites, and every source relation survive',()=>{
  assert.equal(sourceBytes.length,36232667);
  assert.equal(hash(sourceBytes),BYTE_PIN);assert.equal(REGION_ATLAS_SOURCE_HASH,BYTE_PIN);assert.equal(REGION_ATLAS_OBJECT_HASH,OBJECT_PIN);
  assert.equal(hash(JSON.stringify(expected)),OBJECT_PIN);
  const t=performance.now(), actual=read();
  assert.equal(actual,source);assert.deepEqual(Buffer.from(actual),sourceBytes);
  const data=readRegionAtlasData(typed,{expectedSourceHash:BYTE_PIN});
  assert.deepEqual(data,expected);assert.equal(JSON.stringify(data),JSON.stringify(expected));
  assert.equal(data.districts.length,25);assert.equal(data.regions.length,427);assert.equal(data.sites.length,139863);
  const expectedCounts={};
  function count(n){expectedCounts[n]=(expectedCounts[n]??0)+1;}
  const definitions={"document":{"shapes":[["schema","as_of","fictional_epoch","source_selection","districts","coverage","regions","sites","map_note","attribution"]],"fields":{"schema":"string","as_of":"string","map_note":"string","attribution":"string"},"children":{"fictional_epoch":{"kind":"object","domain":"epoch"},"source_selection":{"kind":"object","domain":"selection"},"districts":{"kind":"array","domain":"district"},"coverage":{"kind":"object","domain":"coverage"},"regions":{"kind":"array","domain":"region"},"sites":{"kind":"array","domain":"site"}}},"epoch":{"shapes":[["absolute_date","id","label","source"]],"fields":{"absolute_date":"null","id":"string","label":"string","source":"string"},"children":{}},"selection":{"shapes":[["as_of","build_inputs","comparison_boundary","decision_kind","fictional_epoch","osm","reason","selected_boundary","terrain"]],"fields":{"as_of":"string","decision_kind":"string","reason":"string"},"children":{"build_inputs":{"kind":"object","domain":"build_inputs"},"comparison_boundary":{"kind":"object","domain":"comparison_boundary"},"fictional_epoch":{"kind":"object","domain":"selection_epoch"},"osm":{"kind":"object","domain":"osm"},"selected_boundary":{"kind":"object","domain":"selected_boundary"},"terrain":{"kind":"object","domain":"selection_terrain"}}},"build_inputs":{"shapes":[["boundary","selection","selection_sha256","source_root"]],"fields":{"boundary":"string","selection":"string","selection_sha256":"string","source_root":"string"},"children":{}},"comparison_boundary":{"shapes":[["current_boundary","effective_year","path","policy","sha256","source_id","source_root"]],"fields":{"current_boundary":"boolean","effective_year":"number","path":"string","policy":"string","sha256":"string","source_id":"string","source_root":"string"},"children":{}},"selection_epoch":{"shapes":[["absolute_date","id","label","source"]],"fields":{"absolute_date":"null","id":"string","label":"string","source":"string"},"children":{}},"osm":{"shapes":[["acquired_at","complete_official_roster","modified_at","path","policy","sha256","snapshot_at","snapshot_basis"]],"fields":{"acquired_at":"string","complete_official_roster":"boolean","modified_at":"string","path":"string","policy":"string","sha256":"string","snapshot_at":"string","snapshot_basis":"string"},"children":{}},"selected_boundary":{"shapes":[["attribution","authority","cleanup_policy","coverage_tolerance_m2","filter","license","measurement_crs","overlap_excess_m2","path","precision_policy","publication_commit_date","retrieved_on","selected_union_area_m2","sha256","source_crs","source_districts","source_effective_date","source_id","source_regions","source_url"]],"fields":{"attribution":"string","authority":"string","cleanup_policy":"string","coverage_tolerance_m2":"number","filter":"string","license":"string","measurement_crs":"string","overlap_excess_m2":"number","path":"string","precision_policy":"string","publication_commit_date":"string","retrieved_on":"string","selected_union_area_m2":"number","sha256":"string","source_crs":"string","source_districts":"number","source_effective_date":"string","source_id":"string","source_regions":"number","source_url":"string"},"children":{}},"selection_terrain":{"shapes":[["observation_date","observation_date_reason","policy","source_object_modified_month","source_object_modified_precision"]],"fields":{"observation_date":"null","observation_date_reason":"string","policy":"string","source_object_modified_month":"string","source_object_modified_precision":"string"},"children":{}},"district":{"shapes":[["id","name","region_ids"]],"fields":{"id":"string","name":"string"},"children":{"region_ids":{"kind":"values","domain":"district_region_ids"}}},"coverage":{"shapes":[["region_count","district_count","selected_union_area_m2","gap_m2","overlap_m2","candidate_status_counts","regions_without_stations","official_real_world_completeness"]],"fields":{"region_count":"number","district_count":"number","selected_union_area_m2":"number","gap_m2":"number","overlap_m2":"number","regions_without_stations":"number","official_real_world_completeness":"string"},"children":{"candidate_status_counts":{"kind":"object","domain":"candidate_status"}}},"candidate_status":{"shapes":[["assigned","outside","quarantine"]],"fields":{"assigned":"number","outside":"number","quarantine":"number"},"children":{}},"region":{"shapes":[["id","name","district_id","district_name","area_m2","profile","content","station_ids","facility_ids","shared_boundary_neighbors","map_geometry"]],"fields":{"id":"string","name":"string","district_id":"string","district_name":"string","area_m2":"number"},"children":{"profile":{"kind":"object","domain":"profile"},"content":{"kind":"object","domain":"content"},"station_ids":{"kind":"values","domain":"region_station_ids"},"facility_ids":{"kind":"values","domain":"region_facility_ids"},"shared_boundary_neighbors":{"kind":"array","domain":"neighbor"},"map_geometry":{"kind":"object","domain":"polygon"}}},"profile":{"shapes":[["anchor_scope","anchors","candidate_counts","landuse","terrain"]],"fields":{"anchor_scope":"string"},"children":{"anchors":{"kind":"array","domain":"anchor"},"candidate_counts":{"kind":"object","domain":"candidate_counts"},"landuse":{"kind":"array","domain":"landuse"},"terrain":{"kind":"object","domain":"terrain"}}},"anchor":{"shapes":[["id","kind","name","relation","source_object_id","source_ref","tags"]],"fields":{"id":"string","kind":"string","name":"string","relation":"string","source_object_id":"string","source_ref":"string"},"children":{"tags":{"kind":"tags","domain":"anchor_tag"}}},"candidate_counts":{"shapes":[["access","all_candidates","building_context","facility","landscape","other_context","road_context"],["access","all_candidates","building_context","facility","landscape","other_context","road_context","subway_station"],["access","all_candidates","building_context","facility","landscape","other_context","rail_station","road_context"],["access","all_candidates","building_context","facility","landscape","other_context","rail_station","road_context","subway_station"]],"fields":{"access":"number","all_candidates":"number","building_context":"number","facility":"number","landscape":"number","other_context":"number","road_context":"number","subway_station":"number","rail_station":"number"},"children":{}},"landuse":{"shapes":[["object_count","tag"]],"fields":{"object_count":"number","tag":"string"},"children":{}},"terrain":{"shapes":[["max_m","mean_m","method","min_m","observation_date","relief_m","sample_count","source_object_modified_month","source_refs"]],"fields":{"max_m":"number","mean_m":"number","method":"string","min_m":"number","observation_date":"null","relief_m":"number","sample_count":"number","source_object_modified_month":"string"},"children":{"source_refs":{"kind":"values","domain":"terrain_source_refs"}}},"content":{"shapes":[["source_kind","fictional_epoch","title","summary","anchor_refs","canon_refs","polity_contexts","inhabitants","livelihood","production","shortages","hazard","opening_state","connections","action","uncertainty","buildings","territory","core_station"],["title","summary","anchor_refs","canon_refs","polity_contexts","inhabitants","livelihood","production","shortages","hazard","opening_state","connections","action","uncertainty","source_kind","fictional_epoch","buildings","territory","core_station"],["source_kind","fictional_epoch","canon_refs","polity_contexts","title","summary","anchor_refs","inhabitants","livelihood","production","shortages","hazard","opening_state","connections","action","uncertainty","buildings","territory","core_station"]],"fields":{"source_kind":"string","fictional_epoch":"string","title":"string","summary":"string","livelihood":"string","opening_state":"string","connections":"string","uncertainty":"string","core_station":"boolean"},"children":{"anchor_refs":{"kind":"values","domain":"content_anchor_refs"},"canon_refs":{"kind":"values","domain":"content_canon_refs"},"polity_contexts":{"kind":"values","domain":"content_polity_contexts"},"inhabitants":{"kind":"values","domain":"content_inhabitants"},"production":{"kind":"object","domain":"production"},"shortages":{"kind":"values","domain":"content_shortages"},"hazard":{"kind":"object","domain":"hazard"},"action":{"kind":"object","domain":"action"},"buildings":{"kind":"array","domain":"building"},"territory":{"kind":"object","domain":"territory"}}},"production":{"shapes":[["outputs","requires"]],"fields":{},"children":{"outputs":{"kind":"values","domain":"production_outputs"},"requires":{"kind":"values","domain":"production_requires"}}},"hazard":{"shapes":[["kind","description"]],"fields":{"kind":"string","description":"string"},"children":{}},"action":{"shapes":[["id","label","target_ref","costs","outcomes","tradeoff"]],"fields":{"id":"string","label":"string","target_ref":"string","tradeoff":"string"},"children":{"costs":{"kind":"array","domain":"cost"},"outcomes":{"kind":"array","domain":"outcome"}}},"cost":{"shapes":[["resource","amount","unit"]],"fields":{"resource":"string","amount":"number","unit":"string"},"children":{}},"outcome":{"shapes":[["kind","effect"]],"fields":{"kind":"string","effect":"string"},"children":{}},"building":{"shapes":[["anchor_ref","name","observed_use","river","opening_use","how","role","floors"],["anchor_ref","name","observed_use","river","opening_use","how","role","floors","observed_levels","observed_levels_source"]],"fields":{"anchor_ref":"string","name":"string","observed_use":"string","river":"string","opening_use":"string","how":"string","role":"string","observed_levels":"number","observed_levels_source":"string"},"children":{"floors":{"kind":"array","domain":"floor"}}},"floor":{"shapes":[["level","label","state","contents","condition"]],"fields":{"level":"level","label":"string","state":"string","contents":"string","condition":"string"},"children":{}},"territory":{"shapes":[["status","holders"]],"fields":{"status":"string"},"children":{"holders":{"kind":"array","domain":"holder"}}},"holder":{"shapes":[["polity","control"]],"fields":{"polity":"string","control":"number"},"children":{}},"neighbor":{"shapes":[["region_id","shared_boundary_m","travel_edge"]],"fields":{"region_id":"string","shared_boundary_m":"number","travel_edge":"boolean"},"children":{}},"polygon":{"shapes":[["type","coordinates"]],"fields":{"type":"string"},"children":{"coordinates":{"kind":"geometry","domain":"ring"}}},"site":{"shapes":[["id","name","named","kinds","tags","region_ids","primary_region_id"]],"fields":{"id":"string","name":"string","named":"boolean","primary_region_id":"string"},"children":{"kinds":{"kind":"values","domain":"site_kinds"},"tags":{"kind":"tags","domain":"site_tag"},"region_ids":{"kind":"values","domain":"site_region_ids"}}}};
  function walk(v,n){count(n);for(const[k,c]of Object.entries(definitions[n].children)){if(c.kind==='object')walk(v[k],c.domain);else if(c.kind==='array')v[k].forEach(x=>walk(x,c.domain));else if(c.kind==='values')v[k].forEach(()=>count(c.domain));else if(c.kind==='tags')Object.keys(v[k]).forEach(()=>count(c.domain));else v[k].forEach(r=>{count('ring');r.forEach(()=>count('point'));});}}
  walk(expected,'document');
  for(const n of Object.keys(counts))assert.equal(counts[n],expectedCounts[n]??0,n);
  assert.equal(db.prepare('SELECT name_ko FROM state WHERE state_id=?').get('atlas-test').name_ko,'coexistence');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(db.prepare('SELECT gap_m2 FROM region_atlas_document_coverage').get().gap_m2,'0.0');
  data.sites.forEach((s,i)=>assert.deepEqual(s.region_ids,expected.sites[i].region_ids));
  console.log('FULL_READ_AND_EQUALITY_MS',Math.round(performance.now()-t),'TOTAL_DOMAIN_ROWS',Object.values(counts).reduce((a,b)=>a+b,0));
});

test('each consumed table rejects missing, changed, extra and ordinal-gap rows',()=>{
  for(const table of tables){
    const row=db.prepare('SELECT rowid AS internal_rowid,* FROM '+table+' ORDER BY rowid DESC LIMIT 1').get();
    assert.ok(row,table);
    mutation('DELETE FROM '+table+' WHERE rowid='+row.internal_rowid);
    if(table.endsWith('_receipt')){mutation("UPDATE "+table+" SET object_sha256='"+'0'.repeat(64)+"'");continue;}
    mutation('UPDATE '+table+' SET ordinal=ordinal+10000000 WHERE rowid='+row.internal_rowid);
    mutation('UPDATE '+table+' SET parent_id=parent_id+10000000 WHERE rowid='+row.internal_rowid);
    const copy={...row};delete copy.internal_rowid;copy.parent_id+=10000000;
    if(Object.hasOwn(copy,'row_id'))copy.row_id+=10000000;
    const keys=Object.keys(copy);
    db.exec('SAVEPOINT extra; PRAGMA defer_foreign_keys=ON');
    try{db.prepare('INSERT INTO '+table+' ('+keys.map(k=>'"'+k+'"').join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').run(...Object.values(copy));assert.throws(read,error,table+' extra');}finally{db.exec('ROLLBACK TO extra; RELEASE extra');}
  }
});

test('real data and stored digest substitution cannot replace independent pins',()=>{
  const changed=JSON.parse(JSON.stringify(expected));changed.sites.at(-1).name+=' changed';
  const objectDigest=hash(JSON.stringify(changed));
  mutation("UPDATE region_atlas_document_site SET name=name||' changed' WHERE ordinal=139862; UPDATE region_atlas_document_receipt SET object_sha256='"+objectDigest+"', source_sha256='"+hash('window.SEOUL_REGION_ATLAS='+JSON.stringify(changed)+';\n')+"'");
  mutation("UPDATE region_atlas_document_site SET name=name||' changed' WHERE ordinal=139862");
  mutation("UPDATE region_atlas_document_point SET x_decimal=x_decimal||'0' WHERE rowid=(SELECT max(rowid) FROM region_atlas_document_point)");
  mutation("UPDATE region_atlas_document_floor SET level_text='hidden' WHERE level_number IS NOT NULL AND row_id=(SELECT min(row_id) FROM region_atlas_document_floor WHERE level_number IS NOT NULL)");
});

test('all domain scalar columns are consumed, including fields absent in some objects',()=>{
  for(const table of tables.filter(t=>!t.endsWith('_receipt'))){
    for(const col of db.prepare('PRAGMA table_info('+table+')').all().filter(c=>!['row_id','parent_id','ordinal','shape'].includes(c.name))){
      const row=db.prepare('SELECT rowid AS rid FROM '+table+' WHERE "'+col.name+'" IS NOT NULL LIMIT 1').get();if(!row)continue;
      mutation('UPDATE '+table+' SET "'+col.name+'"='+(col.type==='INTEGER'?'1-"'+col.name+'"':"'changed'")+' WHERE rowid='+row.rid);
    }
  }
});

test('wrong pins, source changes, exact options and active transactions reject',()=>{
  for(const changes of [{expectedSourceHash:'0'.repeat(64)},{sourceBytes:Buffer.from('{}')},{actor:''},{reason:''},{schemaSql:''},{extra:true}])assert.throws(()=>initializeRegionAtlasDocument(db,{...opts,...changes}),error);
  for(const input of [{},{expectedSourceHash:'0'.repeat(64)},{expectedSourceHash:BYTE_PIN,extra:true}])assert.throws(()=>readRegionAtlasDocument(db,input),error);
  db.exec('BEGIN');try{assert.throws(()=>initializeRegionAtlasDocument(db,opts),error);}finally{db.exec('ROLLBACK');}
  assert.throws(()=>initializeRegionAtlasDocument(db,opts),/already exists/);assert.equal(db.isTransaction,false);
});

test('post-insert parity failure rolls back schema and all rows without touching canonical tables',()=>{
  const fresh=new DatabaseSync(':memory:');
  try{
    fresh.exec("CREATE TABLE canonical (value TEXT); INSERT INTO canonical VALUES ('untouched')");
    assert.throws(()=>initializeRegionAtlasDocument(fresh,{...opts,schemaSql:schemaSql+"CREATE TRIGGER damage AFTER INSERT ON region_atlas_document_site WHEN NEW.ordinal=139862 BEGIN UPDATE region_atlas_document_site SET name='changed' WHERE row_id=NEW.row_id; END;"}),error);
    assert.equal(fresh.isTransaction,false);assert.equal(fresh.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'region_atlas_document_%'").get().n,0);
    assert.equal(fresh.prepare('SELECT value FROM canonical').get().value,'untouched');
  }finally{fresh.close();}
});

test('read-only fresh runtime needs no filesystem or JSON parser and issues SELECT only',async()=>{
  const program=
    "import assert from 'node:assert/strict'; import fs from 'node:fs'; import fsp from 'node:fs/promises'; import {syncBuiltinESMExports} from 'node:module'; import {DatabaseSync} from 'node:sqlite'; import {createHash} from 'node:crypto';"+
    'const {readRegionAtlasDocument}=await import('+JSON.stringify(new URL('./region-atlas-document.mjs',import.meta.url).href)+');'+
    "const deny=()=>{throw Error('runtime filesystem/parser denied')};for(const name of ['readFile','readFileSync','readdir','readdirSync','open','openSync','stat','statSync','existsSync','createReadStream'])fs[name]=deny;for(const name of ['readFile','readdir','open','stat'])fsp[name]=deny;syncBuiltinESMExports();JSON.parse=deny;"+
    'const db=new DatabaseSync('+JSON.stringify(dbPath)+',{readOnly:true});'+
    "const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/source_file|source_record|raw_bytes|json_extract|json_tree|json_each/);return db.prepare(sql)}};"+
    'const text=readRegionAtlasDocument(typed,{expectedSourceHash:'+JSON.stringify(BYTE_PIN)+'});'+
    'assert.equal(createHash("sha256").update(text).digest("hex"),'+JSON.stringify(BYTE_PIN)+');db.close();console.log("DB_ONLY_EXACT");';
  await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['--input-type=module','-e',program],{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
    child.stdout.on('data',v=>stdout+=v);child.stderr.on('data',v=>stderr+=v);child.once('error',reject);
    const timeout=setTimeout(()=>{child.kill();reject(Error('bounded runtime check exceeded 120 seconds'));},120000);
    child.once('exit',code=>{clearTimeout(timeout);try{assert.equal(code,0,stderr);assert.match(stdout,/DB_ONLY_EXACT/);resolve();}catch(e){reject(e);}});
  });
});
