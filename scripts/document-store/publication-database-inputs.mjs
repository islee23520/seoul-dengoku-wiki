import { readFile } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { scopeAuthenticationReader } from './scope-authentication-reader.mjs';
import { scopeDirectoryReader } from './scope-directory-inventory.mjs';
import { verifyPublicationRelocation, PUBLICATION_PROVISION_SHA256 } from './publication-storage-relocation.mjs';

// Explicit machine-local inputs. No document source path is opened here.
// Receipt files select evidence identities. Backup archives remain separately hash-verified immutable inputs.
export async function openPublicationDatabaseInputs(root, config) {
  const fields = ['databasePath', 'bootstrapReceiptPath', 'captureReceiptPath'];
  if (!config || Object.keys(config).some(key => ![...fields, 'privateStores', 'editorialDatabasePath', 'relocation'].includes(key)) || fields.some(key => !Object.hasOwn(config, key))
    || fields.slice(0, 3).some(key => typeof config[key] !== 'string' || !isAbsolute(config[key])))
    throw Error('E_PUBLICATION_DATABASE_CONFIG');
  if (config.editorialDatabasePath !== undefined
    && (typeof config.editorialDatabasePath !== 'string' || !isAbsolute(config.editorialDatabasePath)))
    throw Error('E_PUBLICATION_DATABASE_CONFIG');
  if (Object.hasOwn(config, 'relocation')) config = structuredClone(config);
  const handles = [];
  const close = () => { for (const handle of handles.reverse()) handle.close(); handles.length = 0; };
  try {
    const bootstrapBytes = await readFile(config.bootstrapReceiptPath);
    const captureBytes = await readFile(config.captureReceiptPath);
    const bootstrap = JSON.parse(bootstrapBytes), capture = JSON.parse(captureBytes);
    const relocation = Object.hasOwn(config, 'relocation')
      ? await verifyPublicationRelocation(config, bootstrapBytes, captureBytes, PUBLICATION_PROVISION_SHA256) : null;
    if (!relocation && resolve(bootstrap.output) !== resolve(config.databasePath)) throw Error('E_PUBLICATION_DATABASE_IDENTITY');
    const db = new DatabaseSync(config.databasePath, { readOnly: true }); handles.push(db);
    if (config.editorialDatabasePath) db.prepare('ATTACH DATABASE ? AS editorial')
      .run(`file:${config.editorialDatabasePath}?mode=ro`);
    // One immutable read snapshot per publication authentication. This keeps
    // repeated source requests consistent without reconstructing typed rows again.
    db.exec('PRAGMA query_only=ON; BEGIN');
    const evidenceStore = openEvidenceStore(relocation ? relocation.path(capture.databasePath) : capture.databasePath,
      { capability: INTERNAL_EVIDENCE_CAPABILITY }); handles.push(evidenceStore);
    const bindings = new Map(), externalBindings = new Map();
    for (const row of capture.bindings) {
      const binding = { identity: row.identity, sha256: row.sha256 };
      if (row.logicalPath.startsWith('baseline-census:')) externalBindings.set(row.logicalPath.slice('baseline-census:'.length), binding);
      else bindings.set(row.logicalPath, binding);
    }
    const historicalBindings = new Map(capture.historicalBindings.map(row =>
      [JSON.stringify([resolve(row.repositoryRoot), row.revision, row.logicalPath]), { identity: row.identity, sha256: row.sha256 }]));
    const sealed = scopeAuthenticationReader({ db, evidenceStore, root, bindings, externalBindings, historicalBindings,
      missingPaths: new Set(capture.missingPaths) });
    const archives = new Map(capture.externalArchives.map(row => [resolve(row.path), row]));
    const readBytes = async path => {
      relocation?.assertUnchanged();
      path = path instanceof URL ? fileURLToPath(path) : path;
      const archive = archives.get(resolve(path));
      if (!archive) {
        const bytes = await sealed(path);
        relocation?.assertUnchanged();
        return bytes;
      }
      const bytes = await readFile(relocation ? relocation.path(archive.path) : path);
      relocation?.assertUnchanged();
      if (bytes.length !== archive.bytes || createHash('sha256').update(bytes).digest('hex') !== archive.sha256)
        throw Error('E_PUBLICATION_BACKUP_HASH');
      return bytes;
    };
    readBytes.readHistorical = relocation ? async (revision, logicalPath, repositoryRoot = root) => {
      relocation.assertUnchanged();
      const bytes = await sealed.readHistorical(revision, logicalPath,
        resolve(repositoryRoot) === resolve(root) ? relocation.originalRoot : repositoryRoot);
      relocation.assertUnchanged();
      return bytes;
    } : sealed.readHistorical;
    relocation?.assertUnchanged();
    const directoryReader = scopeDirectoryReader(db, { root, expectedSha256: bootstrap.directoryInventory.sha256 });
    return { inputs: { db, baselinePath: resolve(root, '.omo/private/seoul-migration/baseline.json'), readBytes,
      readDirectory: relocation ? async (...args) => {
        relocation.assertUnchanged();
        const entries = await directoryReader(...args);
        relocation.assertUnchanged();
        return entries;
      } : directoryReader }, close };
  } catch (error) { close(); throw error; }
}
