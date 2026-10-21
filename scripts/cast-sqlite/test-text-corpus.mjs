import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { TEXT_DOCUMENT_MANIFEST, TEXT_LINE_SOURCE_PATHS, TEXT_SOURCE_PATHS } from './text-corpus-manifest.mjs';
import { TEXT_CORPUS_TABLE_COLUMNS, mapTextCorpus, auditTextCorpus } from './text-corpus.mjs';
import { loadSourceBundle, REQUIRED_SOURCE_PATHS } from './sources.mjs';
import { EXCLUDED_SOURCE_PATHS } from './excluded-sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { TEXT_DATA_TABLE_COLUMNS, reconstructTextData } from './text-data.mjs';
import { openReadOnly } from './db.mjs';
import { readSourceArchive } from './source-archive.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
test('manifest equals independently discovered committed non-private renderer envelopes and text sources', () => {
  const inventory = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'));
  let tracked;
  try { tracked = inventory.prepare("SELECT logical_path FROM source_file WHERE logical_path LIKE 'lore/%'").all().map(row => row.logical_path); }
  finally { inventory.close(); }
  const readable = tracked.filter((path) => !path.startsWith('lore/editorial/'));
  const documents = readable.filter((path) => path.endsWith('.json')).filter((path) => {
    const document = JSON.parse(readSourceArchive(path));
    return document.version === 1 && typeof document.domain === 'string' && Array.isArray(document.content);
  });
  const lines = ['WORLD_BUILDING_GUIDE.md', ...readable.filter((path) => /\.(md|csv)$/u.test(path) && !path.endsWith('/AGENTS.md'))];
  assert.deepEqual(TEXT_DOCUMENT_MANIFEST.map((entry) => entry.logical_path).sort(), documents.sort());
  assert.deepEqual([...TEXT_LINE_SOURCE_PATHS].sort(), lines.sort());
  assert.equal(new Set(TEXT_SOURCE_PATHS).size, TEXT_SOURCE_PATHS.length);
  assert.ok(Object.isFrozen(TEXT_DOCUMENT_MANIFEST) && TEXT_DOCUMENT_MANIFEST.every(Object.isFrozen));
  assert.ok([...EXCLUDED_SOURCE_PATHS, ...ENGINE_PRIVATE_SOURCE_PATHS].every((path) => !REQUIRED_SOURCE_PATHS.includes(path)));
});

test('integrated corpus covers every manifest source and fails when normalized rows disappear', async () => {
  const bundle = await loadSourceBundle({ sourceRoot: root });
  const tables = mapTextCorpus({ bundle });
  const result = auditTextCorpus({ bundle, tables });
  assert.equal(result.document_count, TEXT_DOCUMENT_MANIFEST.length);
  assert.equal(result.line_document_count, TEXT_LINE_SOURCE_PATHS.length + 2);
  assert.equal(result.missing_text_source_count, 0);
  assert.equal(result.publication_admission, 'not-evaluated');
  assert.equal(result.domain_sidecar_normalization, 'complete');
  assert.equal(result.domain_sidecar_document_count, 52);
  assert.deepEqual(result.domain_sidecar_gap_paths, []);
  assert.equal(Object.keys(TEXT_CORPUS_TABLE_COLUMNS).length, 15 + Object.keys(TEXT_DATA_TABLE_COLUMNS).length);
  for (const document of tables.text_document) {
    const source = bundle.files.find((file) => file.source_id === document.source_id);
    assert.deepEqual(reconstructTextData({ tables, source_id: source.source_id }), source.document.data, source.logical_path);
  }
  assert.throws(() => auditTextCorpus({ bundle, tables: { ...tables, text_document_slot: [] } }), { code: 'E_TEXT_CORPUS_MANIFEST' });
  assert.throws(() => auditTextCorpus({ bundle, tables: { ...tables, text_line: [] } }), { code: 'E_TEXT_CORPUS_MANIFEST' });
  assert.throws(() => auditTextCorpus({ bundle, tables: { ...tables, text_chronology_event: [] } }), { code: 'E_TEXT_CORPUS_MANIFEST' });
  for (const metadata of tables.text_line_document) {
    const file = bundle.files.find((file) => file.source_id === metadata.source_id);
    const restored = tables.text_line.filter((row) => row.source_id === metadata.source_id).map((row) => row.text).join('\n') + (metadata.ends_with_newline ? '\n' : '');
    assert.deepEqual(Buffer.from(restored), file.raw_bytes);
  }
});
