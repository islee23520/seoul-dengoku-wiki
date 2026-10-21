import assert from 'node:assert/strict';
import { readSourceArchive } from './source-archive.mjs';
import test, { after } from 'node:test';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { ISSUED_SHEET_SOURCE_HASH, initializeIssuedSheetInputs, readIssuedSheetInputs } from './issued-sheet-inputs.mjs';
import { loadPersonDetailSources } from './person-detail-inputs.mjs';

const dir = await mkdtemp(join(tmpdir(), 'issued-sheet-inputs-'));
after(() => rm(dir, { recursive: true, force: true }));
const original = fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url));
const sourceBytes = readSourceArchive('lore/name-pools/gurps-cast.json', ISSUED_SHEET_SOURCE_HASH);
const expected = JSON.parse(sourceBytes).people;
const options = { sourceBytes, expectedSourceHash: ISSUED_SHEET_SOURCE_HASH, actor: 'issued-sheet-test', reason: 'Verify typed supplemental import on a disposable canonical copy' };
const dbPath = join(dir, 'supplemented.sqlite');
await copyFile(original, dbPath);
const db = new DatabaseSync(dbPath);
after(() => db.close());
const digest = people => createHash('sha256').update(JSON.stringify(people)).digest('hex');
const typedOnly = connection => ({ prepare(sql) {
  assert.match(sql, /^SELECT /u);
  assert.doesNotMatch(sql, /\bsource_record\b|\bsource_file\b|\braw_bytes\b|\bquality_issue\b|\bjson_(?:extract|tree|each)\b/iu);
  return connection.prepare(sql);
} });
await initializeIssuedSheetInputs(db, options);

test('full canonical copy imports without schema version change and returns all 1022 complete ordered profiles', async () => {
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 5);
  assert.deepEqual(readIssuedSheetInputs(typedOnly(db)).people, expected);
  assert.equal(JSON.stringify(readIssuedSheetInputs(typedOnly(db)).people), JSON.stringify(expected));
  const subset = await loadPersonDetailSources({ db: typedOnly(db), inputSubset: 'issued-sheets' });
  assert.equal(JSON.stringify(subset.issuedSheets.people), JSON.stringify(expected));
  assert.equal(db.prepare('SELECT count(*) n FROM issued_sheet_evidence_annotation').get().n, 4);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('fresh import and repeated read-only reopen require no filesystem or JSON.parse at runtime', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import fsp from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { DatabaseSync } from 'node:sqlite';
    import { createHash } from 'node:crypto';
    const deny = () => { throw new Error('filesystem/parse forbidden'); };
    const scriptRead = fs.readFileSync;
    fs.readFileSync = (path, ...args) => /\\.(?:mjs|js|cjs)$/.test(String(path)) ? scriptRead(path, ...args) : deny();
    fs.readFile = deny; fs.readdir = deny; fs.readdirSync = deny;
    fsp.readFile = deny; fsp.readdir = deny; syncBuiltinESMExports(); JSON.parse = deny;
    const { readIssuedSheetInputs } = await import(${JSON.stringify(new URL('./issued-sheet-inputs.mjs', import.meta.url).href)});
    for (let reopen=0; reopen<2; reopen++) {
      const db = new DatabaseSync(${JSON.stringify(dbPath)}, { readOnly: true });
      const typed = { prepare(sql) {
        assert.match(sql, /^SELECT /);
        assert.doesNotMatch(sql, /\\bsource_record\\b|\\bsource_file\\b|\\braw_bytes\\b|\\bquality_issue\\b|\\bjson_(?:extract|tree|each)\\b/i);
        return db.prepare(sql);
      } };
      for (let repeat=0; repeat<2; repeat++) assert.equal(createHash('sha256').update(JSON.stringify(readIssuedSheetInputs(typed).people)).digest('hex'), ${JSON.stringify(digest(expected))});
      db.close();
    }
    console.log('ISSUED_SHEETS_DB_ONLY_1022_EXACT');
  `], { encoding: 'utf8', timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /ISSUED_SHEETS_DB_ONLY_1022_EXACT/u);
});

function mutate(sql, check) {
  db.exec('BEGIN');
  try { db.exec(sql); check(); } finally { db.exec('ROLLBACK'); }
}

test('wrong expected hash, changed receipt hash, missing row and unknown key reject', () => {
  assert.throws(() => readIssuedSheetInputs(db, { expectedSourceHash: '0'.repeat(64) }), { code: 'E_ISSUED_SHEET_INPUT' });
  for (const sql of [
    "UPDATE issued_sheet_import SET source_sha256='0000000000000000000000000000000000000000000000000000000000000000'",
    'DELETE FROM gurps_skill WHERE rowid=(SELECT max(rowid) FROM gurps_skill)',
    'DELETE FROM evidence WHERE rowid=(SELECT max(rowid) FROM evidence)',
    'DELETE FROM issued_sheet_object_key WHERE rowid=(SELECT max(rowid) FROM issued_sheet_object_key)',
    'DELETE FROM issued_sheet_evidence_annotation WHERE rowid=(SELECT max(rowid) FROM issued_sheet_evidence_annotation)',
    "UPDATE issued_sheet_object_key SET key='unknownField' WHERE rowid=1",
  ]) mutate(sql, () => assert.throws(() => readIssuedSheetInputs(typedOnly(db)), { code: 'E_ISSUED_SHEET_INPUT' }));
});

test('each of the four supplemental values independently controls typed reader output', () => {
  const annotations = db.prepare('SELECT * FROM issued_sheet_evidence_annotation').all();
  const withoutDigest = { prepare(sql) {
    if (sql === 'SELECT * FROM issued_sheet_import') return { all: () => [{ ...db.prepare(sql).get(), people_sha256: digest(changedExpected) }] };
    return typedOnly(db).prepare(sql);
  } };
  let changedExpected;
  for (const row of annotations) {
    const field = row.interpretation === null ? 'provenance_note' : 'interpretation';
    const originalText = row[field], changed = `${originalText} [typed mutation]`;
    changedExpected = structuredClone(expected);
    let changes = 0;
    const walk = value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, v] of Object.entries(value)) {
        if (key === (field === 'interpretation' ? 'interpretation' : 'provenanceNote') && v === originalText) { value[key] = changed; changes++; }
        else walk(v);
      }
    };
    walk(changedExpected); assert.equal(changes, 1);
    db.exec('BEGIN');
    try {
      db.prepare(`UPDATE issued_sheet_evidence_annotation SET ${field}=? WHERE evidence_id=?`).run(changed, row.evidence_id);
      assert.throws(() => readIssuedSheetInputs(db), { code: 'E_ISSUED_SHEET_INPUT' });
      assert.deepEqual(readIssuedSheetInputs(withoutDigest).people, changedExpected);
    } finally { db.exec('ROLLBACK'); }
  }
});

test('initializer rejects hash/actor/reimport and rolls back schema on existing typed divergence', async () => {
  await assert.rejects(initializeIssuedSheetInputs(db, { ...options, expectedSourceHash: '0'.repeat(64) }), { code: 'E_ISSUED_SHEET_INPUT' });
  await assert.rejects(initializeIssuedSheetInputs(db, { ...options, sourceBytes: Buffer.from('{}') }), { code: 'E_ISSUED_SHEET_INPUT' });
  await assert.rejects(initializeIssuedSheetInputs(db, { ...options, actor: '' }), { code: 'E_ISSUED_SHEET_INPUT' });
  await assert.rejects(initializeIssuedSheetInputs(db, options), /already exists/u);
  assert.equal(db.isTransaction, false);
  const brokenPath = join(dir, 'broken.sqlite'); await copyFile(original, brokenPath);
  const broken = new DatabaseSync(brokenPath);
  try {
    broken.exec('UPDATE gurps_attribute SET value=value+1 WHERE rowid=1');
    await assert.rejects(initializeIssuedSheetInputs(broken, options), { code: 'E_ISSUED_SHEET_INPUT' });
    assert.equal(broken.isTransaction, false);
    assert.equal(broken.prepare("SELECT count(*) n FROM sqlite_schema WHERE name LIKE 'issued_sheet_%'").get().n, 0);
    assert.equal(broken.prepare('PRAGMA user_version').get().user_version, 5);
  } finally { broken.close(); }
});
