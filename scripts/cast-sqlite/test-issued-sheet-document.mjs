import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { initializeIssuedSheetDocument, readIssuedSheetDocument, ISSUED_SHEET_SOURCE_HASH, ISSUED_SHEET_DOCUMENT_HASH } from './issued-sheet-document.mjs';

const original = '/tmp/seoul-document-authority-20261020/bootstrap-family-order-20261020.sqlite';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const originalHash = digest(await readFile(original));
const sourceBytes = readSourceArchive('lore/name-pools/gurps-cast.json', ISSUED_SHEET_SOURCE_HASH);
const expected = JSON.parse(sourceBytes);
const schemaSql = await readFile(new URL('./issued-sheet-document.sql', import.meta.url), 'utf8');
const options = { sourceBytes, schemaSql, expectedSourceHash: ISSUED_SHEET_SOURCE_HASH, actor: 'issued-sheet-document-test', reason: 'Verify whole-source typed envelope on a disposable authority copy' };
const dir = await mkdtemp(join(tmpdir(), 'issued-sheet-document-'));
after(() => rm(dir, { recursive: true, force: true }));
const dbPath = join(dir, 'document.sqlite');
await copyFile(original, dbPath);
const db = new DatabaseSync(dbPath);
after(() => db.close());
const code = { code: 'E_ISSUED_SHEET_DOCUMENT' };
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|\braw_bytes\b|\bquality_issue\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
} });

test('explicit initialization preserves the entire ordered source through typed domains', () => {
  assert.equal(digest(sourceBytes), ISSUED_SHEET_SOURCE_HASH);
  assert.equal(digest(JSON.stringify(expected)), ISSUED_SHEET_DOCUMENT_HASH);
  assert.throws(() => readIssuedSheetDocument(typedOnly(db)), code);
  assert.deepEqual(initializeIssuedSheetDocument(db, options), { sourceHash: ISSUED_SHEET_SOURCE_HASH, documentHash: ISSUED_SHEET_DOCUMENT_HASH, profileCount: 1022 });
  const document = readIssuedSheetDocument(typedOnly(db));
  assert.deepEqual(document, expected);
  assert.equal(JSON.stringify(document), JSON.stringify(expected));
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 5);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('cold imports and repeated read-only reopens work without filesystem or JSON.parse', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('filesystem/JSON.parse forbidden'); };
    const scriptRead = fs.readFileSync;
    fs.readFileSync = (path,...args) => /\\.(?:mjs|js|cjs)$/.test(String(path)) ? scriptRead(path,...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const { readIssuedSheetDocument } = await import(${JSON.stringify(new URL('./issued-sheet-document.mjs', import.meta.url).href)});
    for (let reopen=0;reopen<2;reopen++) {
      const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
      const typed = { prepare(sql) {
        assert.match(sql,/^SELECT /);
        assert.doesNotMatch(sql,/\\bsource_record\\b|\\bsource_file\\b|\\braw_bytes\\b|\\bquality_issue\\b|\\bjson_(?:extract|tree|each)\\b/i);
        return db.prepare(sql);
      } };
      for (let repeat=0;repeat<2;repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readIssuedSheetDocument(typed))).digest('hex'), ${JSON.stringify(ISSUED_SHEET_DOCUMENT_HASH)});
      db.close();
    }
    console.log('ISSUED_SHEET_DOCUMENT_DB_ONLY_FULL_PARITY');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /ISSUED_SHEET_DOCUMENT_DB_ONLY_FULL_PARITY/u);
});

function mutate(sql, check = () => assert.throws(() => readIssuedSheetDocument(typedOnly(db)), code)) {
  db.exec('BEGIN');
  try { db.exec(sql); check(); } finally { db.exec('ROLLBACK'); }
}

test('every named envelope/rule scalar and terminal child value controls reconstruction', () => {
  for (const table of ['issued_sheet_document_envelope', 'issued_sheet_document_rules', 'issued_sheet_document_band', 'issued_sheet_document_leader_review']) {
    for (const column of db.prepare('PRAGMA table_info('+table+')').all()) {
      if (['singleton','ordinal','person_id'].includes(column.name)) continue;
      const assignment = column.type === 'INTEGER' ? column.name+'+1' : column.name+"||' [typed mutation]'";
      mutate('UPDATE '+table+' SET '+column.name+'='+assignment+' WHERE rowid=(SELECT max(rowid) FROM '+table+')');
    }
  }
});

test('missing terminal domains, metadata, receipt pins and object order all reject', () => {
  assert.throws(() => readIssuedSheetDocument(db, { expectedSourceHash: '0'.repeat(64) }), code);
  for (const table of ['issued_sheet_document_import','issued_sheet_document_envelope','issued_sheet_document_rules','issued_sheet_document_band','issued_sheet_document_leader_review','issued_sheet_document_key','gurps_skill','evidence','issued_sheet_object_key','issued_sheet_evidence_annotation']) {
    mutate('DELETE FROM '+table+' WHERE rowid=(SELECT max(rowid) FROM '+table+')');
  }
  for (const field of ['source_sha256','document_sha256']) mutate('UPDATE issued_sheet_document_import SET '+field+"='"+'0'.repeat(64)+"'");
  mutate("UPDATE issued_sheet_document_key SET key='unknown' WHERE object_path='' AND ordinal=0");
  mutate("UPDATE issued_sheet_document_key SET ordinal=ordinal+100 WHERE object_path='/rules/leader_review/items/K398'");
  mutate("INSERT INTO issued_sheet_document_key VALUES ('/unreachable',0,'unknown')");
  mutate("INSERT INTO issued_sheet_document_band VALUES (3,'extra',301,400)");
  mutate("UPDATE issued_sheet_document_leader_review SET person_id='K002' WHERE ordinal=15");
});

test('wrong pins, bytes, provenance, nesting and reinitialization reject without partial writes', () => {
  for (const change of [{expectedSourceHash:'0'.repeat(64)},{expectedSourceHash:undefined},{sourceBytes:Buffer.from('{}')},{actor:''},{reason:' '},{schemaSql:''}]) {
    assert.throws(() => initializeIssuedSheetDocument(db,{...options,...change}), code);
  }
  db.exec('BEGIN');
  try { assert.throws(() => initializeIssuedSheetDocument(db,options),code); } finally { db.exec('ROLLBACK'); }
  assert.throws(() => initializeIssuedSheetDocument(db,options), /already exists/u);
  assert.equal(db.isTransaction,false);
  assert.deepEqual(readIssuedSheetDocument(typedOnly(db)),expected);
});

test('full parity failure and missing people terminal row roll back all supplemental DDL', async () => {
  const brokenPath = join(dir,'broken.sqlite');
  await copyFile(original,brokenPath);
  const broken = new DatabaseSync(brokenPath);
  try {
    const version = broken.prepare('PRAGMA user_version').get().user_version;
    for (const mutation of ['UPDATE gurps_attribute SET value=value+1 WHERE rowid=1','DELETE FROM gurps_skill WHERE rowid=(SELECT max(rowid) FROM gurps_skill)']) {
      broken.exec(mutation);
      assert.throws(() => initializeIssuedSheetDocument(broken,options), code);
      assert.equal(broken.isTransaction,false);
      assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'issued_sheet_document_%'").get().n,0);
      assert.equal(broken.prepare('PRAGMA user_version').get().user_version,version);
      if (mutation.startsWith('UPDATE')) broken.exec('UPDATE gurps_attribute SET value=value-1 WHERE rowid=1');
    }
    assert.throws(() => initializeIssuedSheetDocument(broken,{...options,schemaSql:schemaSql+'\nCREATE TABLE issued_sheet_document_rules (bad TEXT);'}),/already exists/u);
    assert.equal(broken.isTransaction,false);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'issued_sheet_document_%'").get().n,0);
  } finally { broken.close(); }
});

test('original authority bytes remain unchanged', async () => {
  assert.equal(digest(await readFile(original)),originalHash);
  const authority = new DatabaseSync(original,{readOnly:true});
  try { assert.equal(authority.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'issued_sheet_document_%'").get().n,0); }
  finally { authority.close(); }
  console.log('ORIGINAL_AUTHORITY_SHA256 '+originalHash);
});
