import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { initializeCatalogMetadata, CATALOG_METADATA_PATHS } from './catalog-metadata.mjs';
import { catalogSourceReader } from './catalog-source-reader.mjs';
import { openPublicationDatabaseInputs } from '../document-store/publication-database-inputs.mjs';
import { openReadOnly } from './db.mjs';
import { readCatalogMetadataDocument } from './catalog-metadata.mjs';

test('actual catalog source readers use typed DB and sealed evidence with source filesystem denied', {
  skip: !process.env.CATALOG_SOURCE_CONFIG,
}, async t => {
  const root = resolve(import.meta.dirname, '../..');
  const config = JSON.parse(fs.readFileSync(process.env.CATALOG_SOURCE_CONFIG));
  const bundle = await openPublicationDatabaseInputs(root, config);
  const directory = fs.mkdtempSync(join(tmpdir(), 'catalog-source-'));
  const db = new DatabaseSync(join(directory, 'metadata.sqlite'), { enableForeignKeyConstraints: true });
  t.after(() => { bundle.close(); db.close(); fs.rmSync(directory, { recursive: true }); });
  const metadataSource = openReadOnly(resolve(root, 'data/canonical/wiki-cast.sqlite'));
  let documents;
  try { documents = CATALOG_METADATA_PATHS.map(logicalPath => ({ logicalPath,
    document: readCatalogMetadataDocument(metadataSource, logicalPath),
    sourceSha256: metadataSource.prepare('SELECT source_sha256 FROM catalog_metadata_document WHERE logical_path=?').get(logicalPath).source_sha256 })); }
  finally { metadataSource.close(); }
  initializeCatalogMetadata(db, { documents, schemaSql: fs.readFileSync(new URL('./catalog-metadata.sql', import.meta.url), 'utf8'),
    actor: 'integration-test', reason: 'catalog input routing' });
  const metadataHashes = Object.fromEntries(documents.map(row => [row.logicalPath, row.sourceSha256]));
  const sources = catalogSourceReader({ root, db, inputs: bundle.inputs, metadataHashes });
  const sourcePaths = [
    'scripts/approved-daejeon-nonowning-rights.json', 'lore/regions/sources/population-2026-08.json',
    'snapshots/build-inputs/SeoulWorldGraph.json', 'lore/places/regular-line-adjacency.json',
    'lore/factions/Sixteen-States.json', 'lore/places/station-control-overrides.json',
    'snapshots/build-inputs/creative-name-normalization.json', 'lore/places/Seoul-Station-Catalog.json',
    'lore/places/landmark-roles.json', 'data/geography/boundaries/seoul-sgis-20250630.geojson',
    'lore/regions/outside-control-2126.json', 'lore/regions/outside-island-occupation.json',
    'lore/name-pools/clan-hangnyeol-tables.json',
  ];
  const expected = new Map(await Promise.all(sourcePaths.map(async path => [path, await bundle.inputs.readBytes(resolve(root, path))])));
  const districtNames = (await bundle.inputs.readDirectory(resolve(root, 'lore/regions/content'), { withFileTypes: true }))
    .filter(row => row.isFile() && /^\d{5}\.json$/u.test(row.name)).map(row => row.name);
  assert.equal(districtNames.length, 25);
  const saved = [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fsp.readFile, fsp.readdir];
  try {
    fs.readFileSync = fs.readFile = fs.readdirSync = fs.readdir = fsp.readFile = fsp.readdir = () => { throw Error('catalog source filesystem forbidden'); };
    syncBuiltinESMExports();
    for (const path of sourcePaths) assert.deepEqual(await sources.readFile(resolve(root, path)), expected.get(path));
    for (const row of documents) assert.deepEqual(JSON.parse(await sources.readFile(new URL('../../' + row.logicalPath, import.meta.url), 'utf8')), row.document);
    const dirs = await sources.readDirectory(resolve(root, 'lore/regions/content'), { withFileTypes: true });
    let regions = 0;
    for (const entry of dirs.filter(row => districtNames.includes(row.name)))
      regions += JSON.parse(await sources.readFile(resolve(root, 'lore/regions/content', entry.name))).regions.length;
    assert.equal(regions, 427);
    assert.equal(sources.resolveSnapshot('GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'), resolve(root, 'snapshots/build-inputs/SeoulWorldGraph.json'));
    await assert.rejects(sources.readFile(resolve(root, 'not-in-the-database.json')));
    await assert.rejects(sources.readFile(resolve(root, '../outside.json')), /E_CATALOG_SOURCE_OUTSIDE/u);
    await assert.rejects(sources.readFile(resolve(root, sourcePaths[0]), 'base64'), /E_CATALOG_SOURCE_ENCODING/u);
    const wrong = catalogSourceReader({ root, db, inputs: bundle.inputs,
      metadataHashes: { ...metadataHashes, [CATALOG_METADATA_PATHS[0]]: '0'.repeat(64) } });
    await assert.rejects(wrong.readFile(resolve(root, CATALOG_METADATA_PATHS[0])), /E_CATALOG_METADATA/u);
  } finally {
    [fs.readFileSync, fs.readFile, fs.readdirSync, fs.readdir, fsp.readFile, fsp.readdir] = saved;
    syncBuiltinESMExports();
  }
});
