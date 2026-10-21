import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { mapTextCorpusLines } from './text-corpus-lines.mjs';
import { TEXT_LINE_SOURCE_PATHS } from './text-corpus-manifest.mjs';
import { initializeLineDocumentStore, readLineDocument, replaceLines } from './line-document-store.mjs';

const hash = text => createHash('sha256').update(text).digest('hex');
const connect = path => new DatabaseSync(path,{enableForeignKeyConstraints:true});
const paths = [...TEXT_LINE_SOURCE_PATHS,'scripts/gurps-cast.mjs','scripts/lore-json-render.mjs'];
const bootstrap = { sourceIds:[1],actor:'fixture',reason:'adopt typed rows' };
function populate(db, files=[{text:'# Original\r\nbody\n',path:paths[0]}]) {
  db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  db.exec(readFileSync(new URL('./text-corpus-lines.sql',import.meta.url),'utf8'));
  const mapped = files.map((file,index) => ({source_id:index+1,logical_path:file.path,raw_bytes:Buffer.from(file.text),
    media_type:file.path.endsWith('.csv') ? 'text/csv' : file.path.endsWith('.mjs') ? 'text/javascript' : 'text/markdown'}));
  for (const file of mapped) {
    db.prepare('INSERT INTO source_file VALUES (?,?,?,?,?,?)').run(file.source_id,file.logical_path,file.media_type,hash(file.raw_bytes),file.raw_bytes.length,file.raw_bytes);
    db.prepare("INSERT INTO source_record VALUES (?,'',NULL,0,NULL,'text',?,NULL,NULL,NULL)").run(file.source_id,'archive coordinate');
  }
  const rows = mapTextCorpusLines({bundle:{files:mapped}});
  for (const document of rows.text_line_document) db.prepare('INSERT INTO text_line_document VALUES (?,?,?,?,?)').run(...Object.values(document));
  for (const line of rows.text_line) db.prepare('INSERT INTO text_line VALUES (?,?,?,?,?)').run(...Object.values(line));
}
function fixture(fn) {
  const directory = mkdtempSync(join(tmpdir(),'line-document-'));
  const path = join(directory,'store.sqlite');
  const db = connect(path);
  try { populate(db); return fn(db,path); } finally { db.close(); rmSync(directory,{recursive:true,force:true}); }
}
const edit = (db,text,expectedRevision=readLineDocument(db,1).revision) => replaceLines(db,{sourceId:1,expectedRevision,text,actor:'editor',reason:'typed edit'});
const counts = db => ['line_document_revision','line_document_revision_line','line_document_revision_seal'].map(table => db.prepare(`SELECT count(*) n FROM ${table}`).get().n);

for (const text of ['', '\n', 'a\n\n', 'a\r\nb\r\n', 'a\r\nb\nc\r\n', '\ufeff서울\n끝', 'a\r\nb', 'a\rb\r']) {
  test(`exact text survives adoption and full replacement: ${JSON.stringify(text)}`, () => fixture(db => {
    initializeLineDocumentStore(db,bootstrap);
    const before = readLineDocument(db,1);
    const result = edit(db,text);
    assert.equal(readLineDocument(db,1).text,text);
    assert.equal(readLineDocument(db,1,{revision:before.revision}).text,before.text);
    assert.equal(readLineDocument(db,1).parentRevision,before.revision);
    assert.equal(readLineDocument(db,1).revision,result.revision);
  }));
}

test('ordered lines preserve reorder, CR, classification, revision-scoped ordinals and fail-closed policy', () => fixture(db => {
  initializeLineDocumentStore(db,bootstrap);
  const head = readLineDocument(db,1);
  replaceLines(db,{sourceId:1,expectedRevision:head.revision,lines:['last','## First\r',''],endsWithNewline:true,actor:'editor',reason:'reorder'});
  const current = readLineDocument(db,1);
  assert.equal(current.text,'last\n## First\r\n\n');
  assert.deepEqual(current.lines.map(row => [row.line_ordinal,row.line_kind,row.heading_depth]),[[0,'other',null],[1,'heading',2],[2,'blank',null]]);
  assert.equal(current.usageKind,'policy-guide');
  assert.equal(current.privacy,'internal-only');
  assert.equal(current.status,'draft');
  assert.equal(current.publicAdmission,'invalidated');
  assert.equal(current.schemaAttestation,null);
  assert.equal(current.currentApprovalRef,null);
  assert.throws(() => readLineDocument(db,1,{visibility:'public'}),/E_LINE_ADMISSION/);
  assert.throws(() => db.exec("UPDATE line_document_head SET status='approved'"),/CHECK/);
  assert.throws(() => db.exec("UPDATE line_document_head SET current_approval_ref='old receipt'"),/CHECK/);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
}));

test('stale connections, unknown IDs and SQL failure roll back head, current rows and typed history', () => fixture((db,path) => {
  initializeLineDocumentStore(db,bootstrap);
  const before = readLineDocument(db,1);
  const beforeCounts = counts(db);
  db.exec("CREATE TRIGGER reject_current BEFORE INSERT ON text_line WHEN NEW.text='fail' BEGIN SELECT RAISE(ABORT,'injected SQL failure'); END");
  assert.throws(() => edit(db,'fail'),/injected SQL failure/);
  assert.deepEqual(readLineDocument(db,1),before);
  assert.deepEqual(counts(db),beforeCounts);
  db.exec('DROP TRIGGER reject_current');
  assert.throws(() => readLineDocument(db,999),/E_LINE_SOURCE/);
  assert.throws(() => replaceLines(db,{sourceId:999,expectedRevision:before.revision,text:'x',actor:'a',reason:'b'}),/E_LINE_SOURCE/);
  assert.throws(() => edit(db,'\ud800'),/E_LINE_TEXT/);
  assert.throws(() => replaceLines(db,{sourceId:1,expectedRevision:before.revision,lines:[''],endsWithNewline:false,actor:'a',reason:'b'}),/E_LINE_TEXT/);
  const second = connect(path);
  try {
    const stale = readLineDocument(second,1).revision;
    edit(db,'winner');
    const after = readLineDocument(db,1);
    assert.throws(() => edit(second,'loser',stale),/E_LINE_CONFLICT/);
    assert.deepEqual(readLineDocument(db,1),after);
  } finally { second.close(); }
}));

test('archive bytes, source coordinates, policy and sealed revision rows cannot be overwritten', () => fixture(db => {
  const originalFile = db.prepare('SELECT * FROM source_file').get();
  const originalRecord = db.prepare('SELECT * FROM source_record').get();
  initializeLineDocumentStore(db,bootstrap);
  const initial = readLineDocument(db,1);
  edit(db,'edited');
  assert.deepEqual(db.prepare('SELECT * FROM source_file').get(),originalFile);
  assert.deepEqual(db.prepare('SELECT * FROM source_record').get(),originalRecord);
  for (const table of ['source_file','source_record','line_document_policy','line_document_revision','line_document_revision_line','line_document_revision_seal']) {
    assert.throws(() => db.exec(`DELETE FROM ${table}`),/immutable/);
  }
  assert.throws(() => db.exec("UPDATE source_file SET logical_path='new'"),/immutable/);
  assert.throws(() => db.exec("UPDATE source_record SET text_value='new'"),/immutable/);
  assert.throws(() => db.exec("INSERT INTO source_record VALUES (1,'/new',NULL,0,NULL,'text','x',NULL,NULL,NULL)"),/immutable/);
  assert.throws(() => db.prepare("INSERT INTO line_document_revision_line VALUES (1,?,99,'x','other',NULL)").run(initial.revision),/sealed/);
  assert.throws(() => initializeLineDocumentStore(db,bootstrap),/E_LINE_INITIALIZED/);
}));

test('adoption validates existing typed metadata and ownership atomically', () => {
  for (const mutate of [db => db.exec("UPDATE text_line SET text='changed'"),
    db => db.exec("UPDATE source_file SET logical_path='unbounded.md'"),
    db => db.exec("UPDATE text_line SET line_kind='other',heading_depth=NULL WHERE line_ordinal=0")]) fixture(db => {
    mutate(db);
    assert.throws(() => initializeLineDocumentStore(db,bootstrap),/E_LINE_/);
    assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name='line_document_head'").get().n,0);
  });
  fixture(db => assert.throws(() => initializeLineDocumentStore(db,{...bootstrap,sourceIds:[999]}),/E_LINE_SOURCE/));
});

test('reopened process reads and edits SQLite without filesystem source or JSON access', async () => {
  const directory = mkdtempSync(join(tmpdir(),'line-reopen-'));
  const path = join(directory,'store.sqlite');
  let db = connect(path);
  try {
    populate(db); initializeLineDocumentStore(db,bootstrap); edit(db,'persisted\r\n');
    db.close(); db=null;
    const code = `
      import fs from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      import { DatabaseSync } from 'node:sqlite';
      const {readLineDocument,replaceLines}=await import(${JSON.stringify(new URL('./line-document-store.mjs',import.meta.url).href)});
      fs.readFileSync=()=>{throw new Error('filesystem read forbidden')};
      fs.promises.readFile=async()=>{throw new Error('filesystem read forbidden')};
      JSON.parse=()=>{throw new Error('JSON parse forbidden')};
      syncBuiltinESMExports();
      const db=new DatabaseSync(process.argv[1],{enableForeignKeyConstraints:true});
      const row=readLineDocument(db,1);
      if(row.text!=='persisted\\r\\n')throw new Error('reopen mismatch');
      replaceLines(db,{sourceId:1,expectedRevision:row.revision,text:'reopened',actor:'child',reason:'DB only'});
      db.close();
    `;
    const child = spawn(process.execPath,['--input-type=module','-e',code,path],{stdio:['ignore','pipe','pipe']});
    let output=''; child.stdout.on('data',chunk => { output+=chunk; }); child.stderr.on('data',chunk => { output+=chunk; });
    const exit = await new Promise((resolve,reject) => { child.once('error',reject); child.once('close',resolve); });
    assert.equal(exit,0,output);
    db=connect(path);
    assert.equal(readLineDocument(db,1).text,'reopened');
    assert.equal(readLineDocument(db,1).sequence,2);
  } finally { db?.close(); rmSync(directory,{recursive:true,force:true}); }
});

test('optional actual 14 line files reconstruct exactly and remain explicitly private', {skip:!process.env.LINE_DOCUMENT_SOURCE_ROOT}, () => {
  const db = connect(':memory:');
  try {
    const files = paths.map(path => ({path,text:readFileSync(join(process.env.LINE_DOCUMENT_SOURCE_ROOT,path),'utf8')}));
    populate(db,files);
    initializeLineDocumentStore(db,{...bootstrap,sourceIds:files.map((_,index) => index+1)});
    for (const [index,file] of files.entries()) {
      const result=readLineDocument(db,index+1);
      assert.equal(result.text,file.text,file.path);
      assert.equal(result.contentSha256,hash(Buffer.from(file.text)));
      assert.throws(() => readLineDocument(db,index+1,{visibility:'public'}),/E_LINE_ADMISSION/);
      if (file.path.endsWith('.csv')) assert.equal(result.usageKind,'private-reference');
      if (file.path.endsWith('.mjs')) assert.equal(result.usageKind,'private-script');
    }
    assert.equal(files.length,14);
  } finally { db.close(); }
});
