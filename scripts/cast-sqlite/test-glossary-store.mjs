import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { glossaryDocument } from '../glossary-document.mjs';
import { renderLoreMarkdown } from '../lore-json-render.mjs';
import { initializeGlossaryStore, listGlossaryEntries, readGlossaryEntry, readGlossaryHead, updateGlossaryEntries } from './glossary-store.mjs';
import { readSourceArchive } from './source-archive.mjs';

const approvedBytes = readSourceArchive('lore/glossary.json');
const entries = JSON.parse(approvedBytes);
const expectedSha256 = createHash('sha256').update(approvedBytes).digest('hex');
const bootstrap = { approvedBytes, expectedSha256, provenanceLabel: 'migration fixture: lore/glossary.json exact input', actor: 'test', reason: 'bootstrap fixture' };
const connect = path => new DatabaseSync(path, { enableForeignKeyConstraints: true });
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'glossary-store-'));
  const path = join(dir, 'authority.sqlite');
  const db = connect(path);
  try { return fn(db, path); } finally { db.close(); rmSync(dir, { recursive: true, force: true }); }
}
const update = (db, updates, expectedHead = readGlossaryHead(db).revision) => updateGlossaryEntries(db, { expectedHead, updates, actor: 'editor', reason: 'typed fixture edit' });
const counts = db => ['glossary_revision', 'glossary_term', 'glossary_locale', 'glossary_alias', 'glossary_context', 'glossary_owner_reference', 'glossary_revision_seal'].map(table => db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n);

test('entire actual glossary round-trips every field, ordered list, status and bilingual render', () => fixture(db => {
  initializeGlossaryStore(db, bootstrap);
  const stored = listGlossaryEntries(db, { visibility: 'internal' });
  assert.deepEqual(stored, entries);
  assert.deepEqual(Object.keys(stored[0]).sort(), Object.keys(entries[0]).sort());
  for (const locale of ['ko', 'en']) assert.equal(renderLoreMarkdown(glossaryDocument(stored), locale), renderLoreMarkdown(glossaryDocument(entries), locale));
  assert.deepEqual(listGlossaryEntries(db), entries.filter(entry => entry.status === 'fact-public'));
  assert.equal(readGlossaryEntry(db, 'house-hp01'), null);
  assert.deepEqual(readGlossaryEntry(db, 'house-hp01', { visibility: 'internal' }), entries.find(entry => entry.term_id === 'house-hp01'));
  assert.throws(() => listGlossaryEntries(db, { visibility: 'private' }), /E_GLOSSARY_VISIBILITY/);
  assert.deepEqual(db.prepare('SELECT document_identity FROM glossary_owner_reference ORDER BY document_identity').all().map(row => row.document_identity), [...new Set(entries.map(entry => entry.owner_path))].sort());
  assert.deepEqual(Buffer.from(db.prepare('SELECT approved_bytes FROM glossary_archive').get().approved_bytes), approvedBytes);
  assert.throws(() => initializeGlossaryStore(db, bootstrap), /E_GLOSSARY_INITIALIZED/);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
}));

test('edit and reopen uses SQLite alone, preserves stable IDs and archive, never grants public approval', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'glossary-reopen-'));
  const path = join(dir, 'authority.sqlite');
  let db = connect(path);
  try {
    const initial = initializeGlossaryStore(db, bootstrap);
    const changed = { ...entries[0], display_name_ko: '수정된 이름', reader_definition_en: 'Edited definition.', aliases: ['둘째', '첫째'], aliases_en: ['Second', 'First'], allowed_context: ['informal', 'dialogue'], owner_path: 'DOC:owner-identity-without-a-file', status: 'fiction-original' };
    const edited = update(db, [changed]);
    assert.equal(edited.previousRevision, initial.revision);
    assert.equal(readGlossaryHead(db).sequence, 1);
    assert.deepEqual(readGlossaryEntry(db, changed.term_id, { visibility: 'internal' }), changed);
    assert.equal(readGlossaryEntry(db, changed.term_id), null);
    assert.deepEqual(listGlossaryEntries(db, { visibility: 'internal', revision: initial.revision }), entries);
    assert.deepEqual(listGlossaryEntries(db, { visibility: 'internal' }).map(entry => entry.term_id), entries.map(entry => entry.term_id));
    assert.deepEqual(Buffer.from(db.prepare('SELECT approved_bytes FROM glossary_archive').get().approved_bytes), approvedBytes);
    assert.throws(() => db.prepare("UPDATE glossary_archive SET provenance_label='changed'").run(), /immutable glossary archive/);
    assert.throws(() => db.prepare('DELETE FROM glossary_archive').run(), /immutable glossary archive/);
    assert.throws(() => db.prepare("UPDATE glossary_term SET category='event'").run(), /immutable glossary revision/);
    assert.throws(() => db.prepare("INSERT INTO glossary_context VALUES (?,?,99,'all')").run(edited.revision, changed.term_id), /sealed glossary revision/);
    db.close(); db = null;
    // Deny JSON reads before importing the runtime module. The subprocess receives only a SQLite path.
    const child = spawn(process.execPath, ['--input-type=module', '-e', `
      import fs from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      const originalRead = fs.readFileSync;
      fs.readFileSync = function(path, ...args) { if (String(path).endsWith('.json')) throw new Error('JSON runtime read forbidden'); return originalRead.call(this, path, ...args); };
      syncBuiltinESMExports();
      const { DatabaseSync } = await import('node:sqlite');
      const { readGlossaryEntry, updateGlossaryEntries, readGlossaryHead } = await import(${JSON.stringify(new URL('./glossary-store.mjs', import.meta.url).href)});
      const db = new DatabaseSync(process.argv[1], { enableForeignKeyConstraints: true });
      const entry = readGlossaryEntry(db, 'state-01', { visibility: 'internal' });
      if (entry.owner_path !== 'DOC:owner-identity-without-a-file' || entry.aliases[0] !== '둘째') throw new Error('reopen mismatch');
      updateGlossaryEntries(db, { expectedHead: readGlossaryHead(db).revision, updates: [{ ...entry, display_name_en: 'Reopened edit' }], actor: 'reopened', reason: 'no source files' });
      db.close();
    `, path], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    assert.equal(code, 0, stdout + stderr);
    db = connect(path);
    assert.equal(readGlossaryEntry(db, 'state-01', { visibility: 'internal' }).display_name_en, 'Reopened edit');
    assert.equal(readGlossaryHead(db).sequence, 2);
    assert.deepEqual(Buffer.from(db.prepare('SELECT approved_bytes FROM glossary_archive').get().approved_bytes), approvedBytes);
  } finally { db?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('stale, duplicate, invalid, unknown and approval commands leave head and all revision rows unchanged', () => fixture((db, path) => {
  initializeGlossaryStore(db, bootstrap);
  const before = readGlossaryHead(db);
  const originalCounts = counts(db);
  const changed = { ...entries[3], display_name_ko: '편집 이름' };
  const rejected = [
    () => update(db, [changed], 'stale'),
    () => update(db, [changed, changed]),
    () => update(db, [{ ...changed, category: 'unknown' }]),
    () => update(db, [{ ...changed, status: 'approved' }]),
    () => update(db, [{ ...changed, allowed_context: ['unknown'] }]),
    () => update(db, [{ ...changed, aliases_en: [null] }]),
    () => update(db, [{ ...changed, extra: 'cannot silently drop' }]),
    () => update(db, [{ ...changed, term_id: 'renamed-id' }]),
    () => update(db, [{ ...entries[0], display_name_ko: '공개 승인 재사용 금지' }]),
    () => update(db, [{ ...changed, status: 'fact-public' }]),
    () => update(db, [entries[3]]),
    () => updateGlossaryEntries(db, { expectedHead: before.revision, updates: [changed], actor: 'test', reason: 'test', ignored: true }),
  ];
  for (const reject of rejected) {
    assert.throws(reject, /E_GLOSSARY_/);
    assert.deepEqual(readGlossaryHead(db), before);
    assert.deepEqual(counts(db), originalCounts);
  }
  // An error after revision insertion proves SQL writes, not just validation, roll back.
  db.exec("CREATE TRIGGER fixture_abort BEFORE INSERT ON glossary_locale WHEN NEW.display_name='편집 이름' BEGIN SELECT RAISE(ABORT,'fixture rollback'); END");
  assert.throws(() => update(db, [changed]), /fixture rollback/);
  assert.deepEqual(counts(db), originalCounts);
  assert.deepEqual(readGlossaryHead(db), before);
  db.exec('DROP TRIGGER fixture_abort');
  const second = connect(path);
  try {
    update(db, [changed]);
    const after = readGlossaryHead(db);
    assert.throws(() => update(second, [{ ...changed, display_name_en: 'stale connection' }], before.revision), /E_GLOSSARY_CONFLICT/);
    assert.deepEqual(readGlossaryHead(db), after);
  } finally { second.close(); }
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
}));

test('bootstrap rejects unknown fields, invalid statuses and incorrect approved bytes atomically', () => {
  for (const altered of [entries.map((entry, index) => index ? entry : { ...entry, optional_unknown: 'reject rather than drop' }), entries.map((entry, index) => index ? entry : { ...entry, status: 'draft' })]) fixture(db => {
    const bytes = Buffer.from(JSON.stringify(altered));
    assert.throws(() => initializeGlossaryStore(db, { ...bootstrap, approvedBytes: bytes, expectedSha256: createHash('sha256').update(bytes).digest('hex') }), /E_GLOSSARY_/);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'glossary_%'").get().n, 0);
  });
  fixture(db => assert.throws(() => initializeGlossaryStore(db, { ...bootstrap, expectedSha256: '0'.repeat(64) }), /E_GLOSSARY_ARCHIVE/));
});
