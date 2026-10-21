import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { ADDITIONAL_LINE_SOURCE_HASHES } from './additional-line-sources.mjs';
import { importAdditionalLineSources } from './additional-line-import.mjs';
import { initializeLineDocumentStore, readLineDocument, replaceLines } from './line-document-store.mjs';
import { readScopeCurrentSource } from '../document-store/scope-current-source.mjs';
import { readSourceArchive } from './source-archive.mjs';

const sources = new Map(Object.keys(ADDITIONAL_LINE_SOURCE_HASHES).map(path =>
  [path, readSourceArchive(path, ADDITIONAL_LINE_SOURCE_HASHES[path])]));
function fixture() {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  db.exec(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  db.exec(fs.readFileSync(new URL('./text-corpus-lines.sql', import.meta.url), 'utf8'));
  return db;
}

test('all 38 internal documents retain exact text, revision history and fail-closed admission', () => {
  const db = fixture();
  try {
    const ids = importAdditionalLineSources(db, sources);
    assert.equal(ids.length, 38);
    initializeLineDocumentStore(db, { sourceIds: ids, actor: 'test', reason: 'exact internal preservation' });
    const read = fs.readFileSync, parse = JSON.parse;
    try {
      fs.readFileSync = JSON.parse = () => { throw Error('source fallback forbidden'); };
      syncBuiltinESMExports();
      for (const [path, bytes] of sources) {
        const { source_id } = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(path);
        const original = readLineDocument(db, source_id);
        assert.equal(original.text, bytes.toString());
        assert.equal(original.mediaKind, path.endsWith('.mjs') ? 'javascript-data' : 'markdown');
        assert.throws(() => readLineDocument(db, source_id, { visibility: 'public' }), /E_LINE_ADMISSION/u);
        replaceLines(db, { sourceId: source_id, expectedRevision: original.revision,
          text: original.text + '\nrevision', actor: 'test', reason: 'revision boundary' });
        const edited = readLineDocument(db, source_id);
        assert.equal(edited.publicAdmission, 'invalidated');
        assert.equal(edited.status, 'draft');
        assert.equal(readLineDocument(db, source_id, { revision: original.revision }).text, original.text);
      }
    } finally { fs.readFileSync = read; JSON.parse = parse; syncBuiltinESMExports(); }
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.throws(() => importAdditionalLineSources(db, sources), /E_ADDITIONAL_LINE_INITIALIZED/u);
  } finally { db.close(); }
});

test('missing or changed source bytes and duplicate imports leave no partial rows', () => {
  const db = fixture();
  try {
    const incomplete = new Map(sources); incomplete.delete(incomplete.keys().next().value);
    assert.throws(() => importAdditionalLineSources(db, incomplete), /E_ADDITIONAL_LINE_COVERAGE/u);
    const changed = new Map(sources); changed.set([...changed.keys()].at(-1), Buffer.from('changed'));
    assert.throws(() => importAdditionalLineSources(db, changed), /E_ADDITIONAL_LINE_HASH/u);
    assert.equal(db.prepare('SELECT count(*) AS n FROM source_file').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM text_line').get().n, 0);
    importAdditionalLineSources(db, sources);
    assert.throws(() => importAdditionalLineSources(db, sources), /E_ADDITIONAL_LINE_DUPLICATE/u);
    assert.equal(db.prepare('SELECT count(*) AS n FROM text_line_document').get().n, 38);
  } finally { db.close(); }
});

test('actual integrated authority exposes all 38 original documents through the bounded scope resolver', {
  skip: !process.env.ADDITIONAL_LINES_DB,
}, () => {
  const db = new DatabaseSync(process.env.ADDITIONAL_LINES_DB, { readOnly: true });
  const read = fs.readFileSync, parse = JSON.parse;
  try {
    fs.readFileSync = JSON.parse = () => { throw Error('actual source fallback forbidden'); };
    syncBuiltinESMExports();
    for (const [logicalPath, expectedSha256] of Object.entries(ADDITIONAL_LINE_SOURCE_HASHES)) {
      assert.equal(readScopeCurrentSource({ db, logicalPath, expectedSha256 }), sources.get(logicalPath).toString());
      assert.throws(() => readScopeCurrentSource({ db, logicalPath, expectedSha256: '0'.repeat(64) }), /E_SCOPE_DB_SOURCE_HASH/u);
      const source = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').get(logicalPath);
      assert.throws(() => readLineDocument(db, source.source_id, { visibility: 'public' }), /E_LINE_ADMISSION/u);
    }
  } finally { fs.readFileSync = read; JSON.parse = parse; syncBuiltinESMExports(); db.close(); }
});
