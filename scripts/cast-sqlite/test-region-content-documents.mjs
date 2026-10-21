import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readSourceArchive } from './source-archive.mjs';
import { REGION_CONTENT_SOURCE_HASHES, REGION_CONTENT_DOCUMENT_HASHES,
  initializeRegionContentDocuments, readRegionContentDocument } from './region-content-documents.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = Object.keys(REGION_CONTENT_SOURCE_HASHES);
const schemaSql = await readFile(new URL('./region-content-documents.sql',import.meta.url),'utf8');
const sources = {}, expected = {};
for (const logicalPath of paths) {
  const bytes = readSourceArchive(logicalPath,REGION_CONTENT_SOURCE_HASHES[logicalPath]);
  sources[logicalPath] = {bytes,expectedSourceHash:hash(bytes)};
  expected[logicalPath] = JSON.parse(bytes);
}
const dir = await mkdtemp(join(tmpdir(),'region-content-documents-'));
after(() => rm(dir,{recursive:true,force:true}));
const dbPath = join(dir,'regions.sqlite');
const db = new DatabaseSync(dbPath);
after(() => db.close());
const canonical = new DatabaseSync(process.env.WIKI_DOCUMENT_DB ?? new URL('../../data/canonical/wiki-cast.sqlite',import.meta.url).pathname,{readOnly:true});
after(() => canonical.close());
db.exec('PRAGMA foreign_keys=ON; CREATE TABLE untouched (value TEXT); INSERT INTO untouched VALUES (\'original\')');
const options = {schemaSql,sources,actor:'region-normalization-test',reason:'Exact bounded source normalization, not publication approval'};
initializeRegionContentDocuments(db,options);
const typed = connection => ({prepare(sql) {
  assert.match(sql,/^SELECT /u);
  assert.doesNotMatch(sql,/\bsource_file\b|\bsource_record\b|\braw_bytes\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
}});
const read = logicalPath => readRegionContentDocument(typed(db),{logicalPath,expectedSourceHash:REGION_CONTENT_SOURCE_HASHES[logicalPath]});
const tableNames = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'region_content_%' ORDER BY name").all().map(r => r.name);

test('all 25 actual documents retain complete values, optional fields and serialized key/list order', async () => {
  assert.deepEqual(canonical.prepare('SELECT logical_path FROM region_content_import ORDER BY logical_path').all().map(row => row.logical_path),paths.slice().sort());
  assert.equal(paths.length,25);
  for (const path of paths) {
    const actual = read(path);
    assert.deepEqual(actual,expected[path]);
    assert.equal(JSON.stringify(actual),JSON.stringify(expected[path]));
    assert.equal(hash(JSON.stringify(actual)),REGION_CONTENT_DOCUMENT_HASHES[path]);
    assert.equal(sources[path].expectedSourceHash,REGION_CONTENT_SOURCE_HASHES[path]);
  }
  const counts = {document:25,region:427,building:1708,floor:6030,cost:802,outcome:507,holder:427};
  for (const [domain,count] of Object.entries(counts)) assert.equal(db.prepare('SELECT count(*) AS n FROM region_content_' + domain).get().n,count);
  assert.equal(db.prepare('SELECT value FROM untouched').get().value,'original');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('fresh import and read-only reopens work with runtime filesystem and JSON.parse denied', () => {
  const child = spawnSync(process.execPath,['--input-type=module','-e',
    "import assert from 'node:assert/strict'; import fs from 'node:fs'; import fsp from 'node:fs/promises';" +
    "import {syncBuiltinESMExports} from 'node:module'; import {DatabaseSync} from 'node:sqlite'; import {createHash} from 'node:crypto';" +
    "const deny=()=>{throw Error('filesystem/JSON.parse denied')};const original=fs.readFileSync;" +
    "fs.readFileSync=(p,...a)=>/\\.(?:mjs|js|cjs)$/.test(String(p))?original(p,...a):deny();" +
    "fs.readFile=deny;fs.readdir=deny;fs.readdirSync=deny;fsp.readFile=deny;fsp.readdir=deny;syncBuiltinESMExports();JSON.parse=deny;" +
    'const {readRegionContentDocument,REGION_CONTENT_SOURCE_HASHES,REGION_CONTENT_DOCUMENT_HASHES}=await import(' + JSON.stringify(new URL('./region-content-documents.mjs',import.meta.url).href) + ');' +
    'for(let reopen=0;reopen<2;reopen++){const db=new DatabaseSync(' + JSON.stringify(dbPath) + ',{readOnly:true});' +
    "const typed={prepare(sql){assert.match(sql,/^SELECT /);assert.doesNotMatch(sql,/\\bsource_file\\b|\\bsource_record\\b|\\braw_bytes\\b|\\bjson_(?:extract|tree|each)\\b/i);return db.prepare(sql)}};" +
    "for(const [logicalPath,expectedSourceHash] of Object.entries(REGION_CONTENT_SOURCE_HASHES)){const doc=readRegionContentDocument(typed,{logicalPath,expectedSourceHash});assert.equal(createHash('sha256').update(JSON.stringify(doc)).digest('hex'),REGION_CONTENT_DOCUMENT_HASHES[logicalPath]);}db.close();}console.log('25_DOCUMENTS_DB_ONLY_EXACT_TWICE');"
  ],{encoding:'utf8',timeout:60000});
  assert.equal(child.status,0,child.stderr);
  assert.match(child.stdout,/25_DOCUMENTS_DB_ONLY_EXACT_TWICE/u);
});

test('deleting the terminal row and changing every consumed table reject', () => {
  for (const table of tableNames) {
    const row = db.prepare('SELECT rowid,* FROM ' + table + ' ORDER BY rowid DESC LIMIT 1').get();
    assert.ok(row,table);
    for (const mutation of ['DELETE FROM ' + table + ' WHERE rowid=' + row.rowid,
      'UPDATE ' + table + " SET " + (table === 'region_content_import' ? "source_sha256='" + '0'.repeat(64) + "'" : table === 'region_content_key' ? "key='unknown'" : "object_path=object_path||'/changed'") + ' WHERE rowid=' + row.rowid]) {
      db.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
      try {
        db.exec(mutation);
        assert.throws(() => read(row.logical_path),{code:'E_REGION_CONTENT_DOCUMENT'},mutation);
      } finally { db.exec('ROLLBACK'); }
    }
  }
  for (const table of tableNames.filter(t => !['region_content_import','region_content_key','region_content_production'].includes(t))) {
    const columns = db.prepare('PRAGMA table_info(' + table + ')').all();
    for (const c of columns.filter(c => !['logical_path','object_path','parent_path','ordinal'].includes(c.name))) {
      const row = db.prepare('SELECT rowid,logical_path FROM ' + table + ' WHERE ' + c.name + ' IS NOT NULL LIMIT 1').get();
      if (!row) continue;
      const replacement = c.type === 'TEXT' ? "'changed'" : c.name === 'core_station' ? '1-' + c.name : c.name + '+1';
      db.exec('BEGIN');
      try {
        db.exec('UPDATE ' + table + ' SET ' + c.name + '=' + replacement + ' WHERE rowid=' + row.rowid);
        assert.throws(() => read(row.logical_path),{code:'E_REGION_CONTENT_DOCUMENT'},table + '.' + c.name);
      } finally { db.exec('ROLLBACK'); }
    }
  }
});

test('explicit fixed hashes, exact path coverage, bytes and one-shot transaction are required', () => {
  const path = paths[0];
  for (const changes of [{logicalPath:path},{logicalPath:path,expectedSourceHash:'0'.repeat(64)},
    {logicalPath:'lore/regions/content/99999.json',expectedSourceHash:'0'.repeat(64)}]) {
    assert.throws(() => readRegionContentDocument(db,changes),{code:'E_REGION_CONTENT_DOCUMENT'});
  }
  const missing = {...sources}; delete missing[path];
  for (const changes of [{actor:''},{reason:''},{schemaSql:undefined},{sources:missing},
    {sources:{...sources,unknown:sources[path]}},
    {sources:{...sources,[path]:{...sources[path],bytes:Buffer.from('{}')}}},
    {sources:{...sources,[path]:{...sources[path],expectedSourceHash:'0'.repeat(64)}}},
    {sources:{...sources,[path]:{...sources[path],unknown:true}}}]) {
    assert.throws(() => initializeRegionContentDocuments(db,{...options,...changes}),{code:'E_REGION_CONTENT_DOCUMENT'});
  }
  db.exec('BEGIN');
  try {assert.throws(() => initializeRegionContentDocuments(db,options),{code:'E_REGION_CONTENT_DOCUMENT'});}
  finally {db.exec('ROLLBACK');}
  assert.throws(() => initializeRegionContentDocuments(db,options),/already exists/u);
  assert.equal(db.isTransaction,false);
});

test('unknown fields at every object domain are rejected even if JSON parser supplies altered data', () => {
  const parse = JSON.parse;
  const targets = new Map();
  function walk(value,path=[]) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {if(value.length)walk(value[0],[...path,0]);return;}
    const signature = Object.keys(value).sort().join(',');
    if (!targets.has(signature)) targets.set(signature,path);
    for (const [k,v] of Object.entries(value)) walk(v,[...path,k]);
  }
  walk(expected[paths[0]]);
  for (const path of targets.values()) {
    const altered = parse(JSON.stringify(expected[paths[0]]));
    let target = altered; for (const k of path) target=target[k]; target.unknown='reject';
    JSON.parse=()=>altered;
    try {assert.throws(() => initializeRegionContentDocuments(db,options),/unknown\/missing field/u);}
    finally {JSON.parse=parse;}
  }
});

test('parity failure rolls back schema, rows and pre-existing tables', () => {
  const fresh = new DatabaseSync(':memory:');
  try {
    fresh.exec("CREATE TABLE untouched (value TEXT); INSERT INTO untouched VALUES ('original')");
    assert.throws(() => initializeRegionContentDocuments(fresh,{...options,
      schemaSql:schemaSql + "CREATE TRIGGER corrupt_region AFTER INSERT ON region_content_region BEGIN UPDATE region_content_region SET name='changed' WHERE rowid=NEW.rowid; END;"}),{code:'E_REGION_CONTENT_DOCUMENT'});
    assert.equal(fresh.isTransaction,false);
    assert.equal(fresh.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'region_content_%'").get().n,0);
    assert.equal(fresh.prepare('SELECT value FROM untouched').get().value,'original');
  } finally {fresh.close();}
});
