import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { openPublicationDatabaseInputs } from './publication-database-inputs.mjs';
import { requireGenerationPublication } from '../generate-release.mjs';
import { pathToFileURL } from 'node:url';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('generation rejects a different document database before opening publication stores', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'publication-database-identity-'));
  const previousConfig = process.env.WIKI_PUBLICATION_DATABASE_CONFIG;
  const previousDatabase = process.env.WIKI_DOCUMENT_DB;
  try {
    const configPath = join(directory, 'config.json');
    await writeFile(configPath, JSON.stringify({ databasePath: join(directory, 'authority.sqlite') }));
    process.env.WIKI_PUBLICATION_DATABASE_CONFIG = configPath;
    process.env.WIKI_DOCUMENT_DB = join(directory, 'different.sqlite');
    await assert.rejects(requireGenerationPublication('/missing-source-tree'), /E_PUBLICATION_DATABASE_IDENTITY/u);
  } finally {
    if (previousConfig === undefined) delete process.env.WIKI_PUBLICATION_DATABASE_CONFIG;
    else process.env.WIKI_PUBLICATION_DATABASE_CONFIG = previousConfig;
    if (previousDatabase === undefined) delete process.env.WIKI_DOCUMENT_DB;
    else process.env.WIKI_DOCUMENT_DB = previousDatabase;
    await rm(directory, { recursive: true, force: true });
  }
});

test('generation cannot fall back to filesystem approval after a configured bundle fails to open', async () => {
  const previous = process.env.WIKI_PUBLICATION_DATABASE_CONFIG;
  try {
    process.env.WIKI_PUBLICATION_DATABASE_CONFIG = '/missing-publication-database-config.json';
    await assert.rejects(requireGenerationPublication('/missing-source-tree'), { code: 'ENOENT' });
  } finally {
    if (previous === undefined) delete process.env.WIKI_PUBLICATION_DATABASE_CONFIG;
    else process.env.WIKI_PUBLICATION_DATABASE_CONFIG = previous;
  }
});

test('publication database configuration requires explicit complete absolute paths', async () => {
  for (const config of [undefined, {}, { databasePath: 'relative.sqlite' },
    { databasePath: '/db', bootstrapReceiptPath: '/receipt', captureReceiptPath: '/capture', privateStores: {}, extra: true }])
    await assert.rejects(openPublicationDatabaseInputs('/root', config), /E_PUBLICATION_DATABASE_CONFIG/u);
});

test('actual complete publication database bundle opens typed current, evidence and directory readers without source JSON', {
  skip: !process.env.PUBLICATION_DATABASE_TEST_ROOT,
}, async () => {
  const privateStores = JSON.parse(await readFile(new URL('../../.vitest/current-parity-private-paths.json', import.meta.url)));
  const prefix = '/tmp/seoul-document-authority-20261020/';
  const bundle = await openPublicationDatabaseInputs(process.env.PUBLICATION_DATABASE_TEST_ROOT, {
    databasePath: prefix + 'bootstrap-scope-atlas-20261021.sqlite',
    bootstrapReceiptPath: prefix + 'bootstrap-scope-atlas-20261021.receipt.json',
    captureReceiptPath: prefix + 'scope-atlas-reader-capture-20261021.receipt.json', privateStores,
  });
  try {
    const path = process.env.PUBLICATION_DATABASE_TEST_ROOT + '/lore/editorial/authoring.example.json';
    const document = JSON.parse(await bundle.inputs.readBytes(path));
    assert.deepEqual(await bundle.inputs.readBytes(pathToFileURL(path)), await bundle.inputs.readBytes(path));
    assert.equal(document.domain, 'editorial');
    assert.equal(document.status, 'draft');
    const entries = await bundle.inputs.readDirectory(process.env.PUBLICATION_DATABASE_TEST_ROOT + '/lore', { withFileTypes: true });
    assert.ok(entries.some(entry => entry.name === 'editorial' && entry.isDirectory()));
    await assert.rejects(bundle.inputs.readBytes('/unregistered-external.json'), /E_EVIDENCE_READER_PATH/u);
  } finally { bundle.close(); }
});
