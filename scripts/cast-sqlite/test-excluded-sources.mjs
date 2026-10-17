import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  EXCLUDED_SOURCE_MANIFEST, EXCLUDED_SOURCE_PATHS, EXCLUDED_SOURCE_TABLE_COLUMNS,
  loadExcludedSourceFiles, mapExcludedSourceDomains,
} from './excluded-sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { resolveTrustedSourcePath, sha256 } from './sources.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fixture = () => ({ excludedFiles: EXCLUDED_SOURCE_MANIFEST.map((entry) => ({
  ...entry, sha256: 'a'.repeat(64), byte_length: 1,
})) });

test('Given the fixed private editorial scope, when it maps, then only hash metadata reaches SQLite rows', () => {
  const rows = mapExcludedSourceDomains({ bundle: fixture() });
  assert.deepEqual(Object.keys(rows), Object.keys(EXCLUDED_SOURCE_TABLE_COLUMNS));
  assert.equal(rows.excluded_source.length, 17);
  assert.equal(new Set(EXCLUDED_SOURCE_PATHS).size, EXCLUDED_SOURCE_PATHS.length);
  assert.deepEqual(Object.keys(rows.excluded_source[0]), EXCLUDED_SOURCE_TABLE_COLUMNS.excluded_source);
  assert.equal(EXCLUDED_SOURCE_PATHS.some((path) => ENGINE_PRIVATE_SOURCE_PATHS.includes(path)), false);
  assert.ok(EXCLUDED_SOURCE_PATHS.includes('lore/editorial/Seoul-Relocation-Ledger.json'));
  assert.ok(EXCLUDED_SOURCE_PATHS.includes('lore/editorial/Soul-Assignments.json'));
});

test('Given a raw editorial value smuggled into the bundle, when it maps, then it rejects the row', () => {
  const input = fixture();
  input.excludedFiles[0].raw_bytes = Buffer.from('PRIVATE-SOUL-SENTINEL');
  assert.throws(() => mapExcludedSourceDomains({ bundle: input }), { code: 'E_EXCLUDED_MANIFEST' });
});

test('Given missing, reordered or unapproved editorial files, when it maps, then it fails closed', () => {
  const missing = fixture();
  missing.excludedFiles.pop();
  assert.throws(() => mapExcludedSourceDomains({ bundle: missing }), { code: 'E_EXCLUDED_MANIFEST' });
  const replaced = fixture();
  replaced.excludedFiles[0].logical_path = 'lore/editorial/authoring.example.json';
  assert.throws(() => mapExcludedSourceDomains({ bundle: replaced }), { code: 'E_EXCLUDED_MANIFEST' });
  const reordered = fixture();
  [reordered.excludedFiles[0], reordered.excludedFiles[1]] = [reordered.excludedFiles[1], reordered.excludedFiles[0]];
  assert.throws(() => mapExcludedSourceDomains({ bundle: reordered }), { code: 'E_EXCLUDED_MANIFEST' });
});

test('Given a private sentinel file, when hashed through trusted paths, then neither rows nor receipt expose content', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wiki-excluded-source-'));
  try {
    const sentinel = 'PRIVATE-SOUL-SENTINEL';
    const trustedPath = async () => join(directory, 'private.json');
    await writeFile(join(directory, 'private.json'), sentinel);
    const files = await loadExcludedSourceFiles({
      sourceRoot: directory, resolveTrustedSourcePath: trustedPath, sha256: hash,
    });
    const rows = mapExcludedSourceDomains({ bundle: { excludedFiles: files } });
    const receipt = JSON.stringify({ excluded_sources: rows.excluded_source });
    assert.equal(receipt.includes(sentinel), false);
    assert.equal(files.every((file) => file.sha256 === hash(sentinel) && file.byte_length === sentinel.length), true);
  } finally {
    assert.equal(resolve(dirname(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('wiki-excluded-source-'));
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given the actual wiki snapshot, when fixed files are hashed, then every excluded path exists and no content enters rows', async () => {
  const sourceRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const files = await loadExcludedSourceFiles({ sourceRoot, resolveTrustedSourcePath, sha256 });
  const rows = mapExcludedSourceDomains({ bundle: { excludedFiles: files } });
  const relocated = rows.excluded_source.find((row) => row.logical_path.endsWith('Seoul-Relocation-Ledger.json'));
  const relocatedBytes = await readFile(await resolveTrustedSourcePath(sourceRoot, relocated.logical_path));
  assert.equal(relocated.sha256, hash(relocatedBytes));
  assert.equal(relocated.byte_length, relocatedBytes.length);
  assert.equal(rows.excluded_source.every((row) => Object.keys(row).length === 4), true);
});

test('Given the hash-only table, when inserting private metadata, then STRICT constraints reject invalid rows', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(await readFile(new URL('./excluded-sources.sql', import.meta.url), 'utf8'));
    const insert = db.prepare('INSERT INTO excluded_source VALUES (?,?,?,?)');
    const row = fixture().excludedFiles[0];
    insert.run(row.logical_path, row.sha256, row.byte_length, row.exclusion_reason);
    assert.equal(db.prepare('SELECT count(*) AS n FROM excluded_source').get().n, 1);
    assert.throws(() => insert.run('secret', 'Z'.repeat(64), 1, row.exclusion_reason));
    assert.throws(() => insert.run('secret', row.sha256, -1, row.exclusion_reason));
    assert.throws(() => insert.run('secret', row.sha256, 1, 'approved'));
    assert.equal(db.prepare("SELECT strict FROM pragma_table_list WHERE name='excluded_source'").get().strict, 1);
  } finally {
    db.close();
  }
});
