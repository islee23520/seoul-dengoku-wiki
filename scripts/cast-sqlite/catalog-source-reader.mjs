import { basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG_METADATA_PATHS, readCatalogMetadataDocument } from './catalog-metadata.mjs';

// Source reads only. Generated assets and release journals retain their normal
// filesystem readers; a missing DB source must never fall back to a JSON file.
export function catalogSourceReader({ root, db, inputs, metadataHashes }) {
  const base = resolve(root);
  if (!metadataHashes || CATALOG_METADATA_PATHS.some(path => !/^[a-f0-9]{64}$/u.test(metadataHashes[path] ?? '')))
    throw Error('E_CATALOG_METADATA_PINS');
  const readFile = async (path, encoding) => {
    if (encoding !== undefined && encoding !== 'utf8') throw Error('E_CATALOG_SOURCE_ENCODING');
    const absolute = resolve(path instanceof URL ? fileURLToPath(path) : path);
    const logicalPath = relative(base, absolute);
    if (logicalPath.startsWith('../') || logicalPath === '..') throw Error('E_CATALOG_SOURCE_OUTSIDE');
    const bytes = CATALOG_METADATA_PATHS.includes(logicalPath)
      ? Buffer.from(JSON.stringify(readCatalogMetadataDocument(db, logicalPath, { expectedSourceHash: metadataHashes[logicalPath] })))
      : Buffer.from(await inputs.readBytes(absolute));
    return encoding === 'utf8' ? bytes.toString() : bytes;
  };
  const resolveSnapshot = path => resolve(base, 'snapshots/build-inputs', basename(path));
  return { readFile, readDirectory: inputs.readDirectory, resolveSnapshot };
}
