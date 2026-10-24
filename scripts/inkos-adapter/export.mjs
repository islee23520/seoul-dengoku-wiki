import fs from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { readDocument } from '../cast-sqlite/document-read.mjs';
import { canonicalJson, digestJson, fail, LIMITS, newPacketId, parseSelection,
  sha256Bytes, validateHostManifest, validateSourcePacket } from './contracts.mjs';

function checkedPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.split(/[\\/]/u).includes('..')) {
    fail('E_ADAPTER_PATH', 'plain host path required');
  }
  const path = resolve(value);
  const parts = path.split(sep).filter(Boolean);
  let current = sep;
  for (const part of parts) {
    current = join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) fail('E_ADAPTER_PATH', 'symlink path forbidden');
      if (current !== path && !stat.isDirectory()) fail('E_ADAPTER_PATH', 'directory parent required');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return path;
}
const contains = (parent, child) => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
};
function newDirectory(path) {
  try { fs.mkdirSync(path, { mode: 0o700 }); }
  catch (error) { if (error.code === 'EEXIST') fail('E_ADAPTER_EXISTS', 'output already exists'); throw error; }
}

/** Export only the explicit public read-set. No source archive or receipt is opened.
 * All SQLite reads share one deferred read snapshot; filesystem output starts only
 * after the complete read-set and serialized packet have passed validation. */
export function exportPacket({ dbPath, selection, trustedRoot, workerOut }) {
  selection = parseSelection(Buffer.from(canonicalJson(selection), 'utf8'));
  const root = checkedPath(trustedRoot);
  const worker = checkedPath(workerOut);
  const database = checkedPath(dbPath);
  if (!fs.statSync(root).isDirectory() || !fs.statSync(dirname(worker)).isDirectory()) fail('E_ADAPTER_PATH', 'existing output parents required');
  if (contains(root, worker) || contains(worker, root) || contains(root, database) || contains(worker, database)) fail('E_ADAPTER_PATH', 'outputs must not overlap host, worker, or DB');
  if (fs.existsSync(worker)) fail('E_ADAPTER_EXISTS', 'worker directory already exists');
  const packetId = newPacketId();
  const bundle = { version: 1, packetId, targetKey: 'source-1', sources: [] };
  const manifest = { version: 1, packetId, inputDigest: '', authorityId: selection.authorityId,
    authorityVersion: 0, targetKey: 'source-1', targetAnchor: selection.target.anchor, sources: [] };
  const db = openReadOnly(database);
  try {
    db.exec('BEGIN');
    const authority = db.prepare('SELECT version FROM document_authority').all();
    if (authority.length !== 1 || ![1, 2].includes(authority[0].version)) fail('E_ADAPTER_AUTHORITY', 'supported authority required');
    manifest.authorityVersion = authority[0].version;
    for (const [index, tuple] of [selection.target, ...selection.references].entries()) {
      if (tuple.domain !== 'technology') fail('E_ADAPTER_UNSUPPORTED', 'unsupported document domain');
      const document = readDocument(db, { corpusKind: tuple.corpusKind, domain: tuple.domain, documentId: tuple.documentId, visibility: 'public' });
      if (!document) fail('E_ADAPTER_PUBLIC', 'selected document is not currently publicly admitted');
      const excerpts = document.content.map(node => {
        if (node.kind !== 'paragraph' || typeof node.text?.ko !== 'string') fail('E_ADAPTER_UNSUPPORTED', 'paragraph/string structure required');
        return { anchor: node.anchor, text: node.text.ko };
      });
      if (index === 0 && !excerpts.some(excerpt => excerpt.anchor === tuple.anchor)) fail('E_ADAPTER_UNSUPPORTED', 'existing Korean paragraph anchor required');
      const sourceId = document.readMetadata.source_id;
      const head = db.prepare(`SELECT r.revision_id,r.semantic_sha256 FROM document_head h
        JOIN document_revision r USING(source_id,revision_id) JOIN document_revision_seal z USING(revision_id)
        WHERE h.source_id=?`).get(sourceId);
      const admission = db.prepare('SELECT * FROM document_publication_admission WHERE source_id=? AND revision_id=?').get(sourceId, head?.revision_id ?? '');
      if (!head || !admission || digestJson(document) !== head.semantic_sha256) fail('E_ADAPTER_PUBLIC', 'sealed semantic identity required');
      const sourceKey = `source-${index + 1}`;
      bundle.sources.push({ sourceKey, excerpts });
      manifest.sources.push({ sourceKey, authorityId: selection.authorityId, corpusKind: tuple.corpusKind,
        domain: tuple.domain, documentId: tuple.documentId, revision: head.revision_id,
        semanticSha256: head.semantic_sha256, admissionDigest: digestJson(admission), anchors: excerpts.map(excerpt => excerpt.anchor) });
    }
    db.exec('COMMIT');
  } finally { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
  validateSourcePacket(bundle);
  const bytes = Buffer.from(canonicalJson(bundle), 'utf8');
  if (bytes.length > LIMITS.fileBytes) fail('E_ADAPTER_LIMIT', 'bundle byte limit exceeded');
  manifest.inputDigest = sha256Bytes(bytes);
  validateHostManifest(manifest);
  const manifestBytes = Buffer.from(canonicalJson(manifest), 'utf8');
  if (manifestBytes.length > LIMITS.fileBytes) fail('E_ADAPTER_LIMIT', 'manifest byte limit exceeded');
  const packets = checkedPath(join(root, 'packets'));
  const packet = join(packets, packetId);
  let ownPackets = false;
  let ownPacket = false;
  let ownWorker = false;
  try {
    try { fs.mkdirSync(packets, { mode: 0o700 }); ownPackets = true; }
    catch (error) { if (error.code !== 'EEXIST') throw error; if (!fs.lstatSync(packets).isDirectory()) fail('E_ADAPTER_PATH', 'packet parent required'); }
    newDirectory(packet); ownPacket = true;
    newDirectory(worker); ownWorker = true;
    fs.writeFileSync(join(packet, 'manifest.json'), manifestBytes, { flag: 'wx', mode: 0o600 });
    fs.writeFileSync(join(packet, 'bundle.json'), bytes, { flag: 'wx', mode: 0o600 });
    fs.writeFileSync(join(worker, 'bundle.json'), bytes, { flag: 'wx', mode: 0o600 });
    return { packetId, inputDigest: manifest.inputDigest, manifestPath: join(packet, 'manifest.json'), bundlePath: join(worker, 'bundle.json') };
  } catch (error) {
    if (ownWorker) fs.rmSync(worker, { recursive: true });
    if (ownPacket) fs.rmSync(packet, { recursive: true });
    if (ownPackets) fs.rmdirSync(packets);
    throw error;
  }
}
