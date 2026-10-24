import { createHash } from 'node:crypto';
import { createReadStream, existsSync, lstatSync, realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

// Preserved seoul-wiki-sqlite-provision.v1 manifest, not a caller-supplied
// assertion of approval. New snapshots require a separately reviewed anchor.
export const PUBLICATION_PROVISION_SHA256 = '05e82ab71c0d970304d7f319170047e7b924f71467cdac6edae280fb75f98a92';

const fail = code => { throw Error(`E_PUBLICATION_RELOCATION_${code}`); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key));
const absolute = path => typeof path === 'string' && isAbsolute(path) && resolve(path) === path;

function fingerprint(path, sqlite = false) {
  if (!absolute(path) || realpathSync(path) !== path) fail('PATH');
  const stat = lstatSync(path, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink()) fail('PATH');
  // The manifest identifies checkpointed database bytes, not an unbound WAL.
  if (sqlite && ['-wal', '-journal'].some(suffix => existsSync(path + suffix))) fail('STALE');
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(':');
}

// expectedManifestSha256 is supplied by the loader's reviewed constant, never
// by relocation config. Kept explicit so tests can use independent tiny stores.
export async function verifyPublicationRelocation(config, bootstrapBytes, captureBytes, expectedManifestSha256) {
  const relocation = config.relocation;
  if (!exact(relocation, ['schema', 'provisionManifestPath', 'publicationConfigPath', 'mappings'])
    || relocation.schema !== 'publication-storage-relocation.v1'
    || !absolute(relocation.provisionManifestPath) || !absolute(relocation.publicationConfigPath)
    || !Array.isArray(relocation.mappings)) fail('CONFIG');
  const snapshots = new Map();
  const remember = (path, sqlite = false) => {
    const value = fingerprint(path, sqlite);
    snapshots.set(path, { value, sqlite });
    return value;
  };
  const manifestFingerprint = remember(relocation.provisionManifestPath);
  const manifestBytes = await readFile(relocation.provisionManifestPath);
  if (hash(manifestBytes) !== expectedManifestSha256) fail('ANCHOR');
  if (fingerprint(relocation.provisionManifestPath) !== manifestFingerprint) fail('STALE');
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schema !== 'seoul-wiki-sqlite-provision.v1' || !Array.isArray(manifest.files)
    || !object(manifest.roots) || !object(manifest.publicDatabase)) fail('ANCHOR');
  const pins = new Map();
  for (const row of [{ ...manifest.publicDatabase, target: manifest.publicDatabase.path, kind: 'sqlite' }, ...manifest.files]) {
    if (!absolute(row.target) || pins.has(row.target) || !/^[a-f0-9]{64}$/u.test(row.sha256)
      || !Number.isSafeInteger(row.size) || row.size < 0) fail('ANCHOR');
    pins.set(row.target, row);
  }
  const paths = new Map(), destinations = new Set();
  for (const row of relocation.mappings) {
    if (!exact(row, ['originalPath', 'path']) || !absolute(row.originalPath) || !absolute(row.path)
      || paths.has(row.originalPath) || destinations.has(row.path) || !pins.has(row.originalPath)) fail('MAPPING');
    paths.set(row.originalPath, row.path);
    destinations.add(row.path);
  }
  const mapped = original => {
    const path = paths.get(original);
    if (!path) fail('MISSING');
    return path;
  };
  const originalConfigPath = `${manifest.roots.authorityRoot}/publication-config.json`;
  if (mapped(originalConfigPath) !== relocation.publicationConfigPath) fail('BINDING');
  const configFingerprint = remember(relocation.publicationConfigPath);
  const originalConfigBytes = await readFile(relocation.publicationConfigPath);
  const configPin = pins.get(originalConfigPath);
  if (hash(originalConfigBytes) !== configPin.sha256 || originalConfigBytes.length !== configPin.size) fail('HASH');
  if (fingerprint(relocation.publicationConfigPath) !== configFingerprint) fail('STALE');
  const original = JSON.parse(originalConfigBytes);
  const bootstrap = JSON.parse(bootstrapBytes), capture = JSON.parse(captureBytes);
  if (bootstrap.output !== original.databasePath || bootstrap.output !== manifest.publicDatabase.path
    || bootstrap.storageMigration?.editorialDatabasePath !== original.editorialDatabasePath
    || bootstrap.storageMigration?.operation !== 'separate-public-typed-authority-and-private-editorial-tables') fail('BINDING');
  const required = [originalConfigPath, original.databasePath, original.bootstrapReceiptPath,
    original.captureReceiptPath, original.editorialDatabasePath, capture.databasePath];
  for (const key of ['databasePath', 'bootstrapReceiptPath', 'captureReceiptPath', 'editorialDatabasePath']) {
    if (mapped(original[key]) !== config[key]) fail('BINDING');
  }
  for (const [key, bytes] of [['bootstrapReceiptPath', bootstrapBytes], ['captureReceiptPath', captureBytes]]) {
    const pin = pins.get(original[key]);
    if (!pin || hash(bytes) !== pin.sha256 || bytes.length !== pin.size) fail('RECEIPT');
  }
  if (!object(original.privateStores) || !exact(config.privateStores, Object.keys(original.privateStores))) fail('CONFIG');
  for (const [key, originalPath] of Object.entries(original.privateStores)) {
    if (mapped(originalPath) !== config.privateStores[key]) fail('BINDING');
    required.push(originalPath);
  }
  for (const archive of capture.externalArchives) {
    const pin = pins.get(archive.path);
    if (!pin || pin.kind !== 'archive' || pin.sha256 !== archive.sha256 || pin.size !== archive.bytes) fail('BINDING');
    required.push(archive.path);
  }
  if (new Set(required).size !== required.length || paths.size !== required.length
    || required.some(path => !paths.has(path))) fail('MAPPING');
  for (const originalPath of required) {
    const path = mapped(originalPath), pin = pins.get(originalPath);
    const before = remember(path, pin.kind === 'sqlite');
    const digest = createHash('sha256');
    let size = 0;
    for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) { digest.update(chunk); size += chunk.length; }
    if (size !== pin.size || digest.digest('hex') !== pin.sha256) fail('HASH');
    if (fingerprint(path, pin.kind === 'sqlite') !== before) fail('STALE');
  }
  const assertUnchanged = () => {
    for (const [path, { value, sqlite }] of snapshots)
      if (fingerprint(path, sqlite) !== value) fail('STALE');
  };
  assertUnchanged();
  return { path: mapped, assertUnchanged, originalRoot: manifest.roots.censusRoot };
}
