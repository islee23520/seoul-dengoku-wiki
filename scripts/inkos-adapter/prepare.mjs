import fs from 'node:fs';
import { join } from 'node:path';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { readDocument } from '../cast-sqlite/document-read.mjs';
import { canonicalJson, digestJson, fail, LIMITS, parseCandidate, parseHostManifest, parseStrictJson, sha256Bytes } from './contracts.mjs';
import { createImmutableFile, directories, hostPath, readHostFile } from './io.mjs';

/** Host index entries are created by CLI collection, never supplied by a worker.
 * No receipt-provided path is interpreted. All DB reads share one snapshot. */
export function prepareDraft({ trustedRoot, candidateId, dbPath, out }) {
  if (typeof candidateId !== 'string' || !/^[a-f0-9]{64}$/u.test(candidateId)) fail('E_ADAPTER_SCHEMA', 'candidate digest required');
  const root = hostPath(trustedRoot);
  const index = parseStrictJson(readHostFile(join(root, 'index', `${candidateId}.json`), undefined, root));
  if (index.candidateId !== candidateId || index.version !== 1) fail('E_ADAPTER_BINDING', 'trusted index mismatch');
  const receiptBytes = readHostFile(index.receiptPath, undefined, root);
  if (sha256Bytes(receiptBytes) !== index.receiptSha256) fail('E_ADAPTER_BINDING', 'receipt bytes changed');
  const receipt = parseStrictJson(receiptBytes);
  const manifest = parseHostManifest(readHostFile(join(root, 'packets', index.packetId, 'manifest.json'), undefined, root));
  const db = openReadOnly(hostPath(dbPath));
  let target, candidate, candidateFd;
  try {
    db.exec('BEGIN');
    const candidatePath = hostPath(index.candidatePath);
    // Reuse the landed bounded path/filesystem validation before retaining a
    // descriptor. Rechecks below never reopen the candidate by pathname.
    const entry = fs.lstatSync(candidatePath, { bigint: true });
    const candidateBytes = readHostFile(candidatePath, undefined, root);
    candidateFd = fs.openSync(candidatePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
    const baseline = fs.fstatSync(candidateFd, { bigint: true });
    const same = (a, b) => ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink'].every(key => a[key] === b[key]);
    if (!baseline.isFile() || baseline.nlink !== 1n || !same(entry, baseline)) fail('E_ADAPTER_BINDING', 'candidate changed before descriptor retention');
    const parents = directories(candidatePath, root);
    const revalidateCandidate = () => {
      try {
        if (!same(baseline, fs.fstatSync(candidateFd, { bigint: true }))) fail('E_ADAPTER_BINDING', 'candidate descriptor changed');
        const bytes = Buffer.alloc(LIMITS.fileBytes + 1);
        let length = 0;
        while (length < bytes.length) {
          const count = fs.readSync(candidateFd, bytes, length, bytes.length - length, length);
          if (!count) break;
          length += count;
        }
        if (!same(baseline, fs.fstatSync(candidateFd, { bigint: true }))
          || !same(baseline, fs.lstatSync(candidatePath, { bigint: true }))
          || !bytes.subarray(0, length).equals(candidateBytes)
          || sha256Bytes(bytes.subarray(0, length)) !== sha256Bytes(candidateBytes)) fail('E_ADAPTER_BINDING', 'candidate bytes or path changed');
        for (const [parent, before] of parents) {
          const after = fs.lstatSync(parent, { bigint: true });
          if (!after.isDirectory() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino
            || before.ctimeNs !== after.ctimeNs) fail('E_ADAPTER_BINDING', 'candidate parent changed');
        }
      } catch { fail('E_ADAPTER_BINDING', 'candidate integrity changed'); }
    };
    revalidateCandidate();
    candidate = parseCandidate(candidateBytes, manifest);
    const candidateSha256 = sha256Bytes(candidateBytes);
    const manifestDigest = digestJson(manifest);
    if (index.packetId !== manifest.packetId || receipt.candidateId !== candidateId
      || digestJson({ packetId: manifest.packetId, manifestDigest, candidateSha256 }) !== candidateId
      || receipt.candidateSha256 !== candidateSha256 || receipt.manifestDigest !== manifestDigest
      || receipt.replacementSha256 !== sha256Bytes(Buffer.from(candidate.replacementText))
      || receipt.replacementText !== candidate.replacementText || receipt.status !== 'candidate-only' || receipt.ownerApproval !== false
      || canonicalJson(receipt.sources) !== canonicalJson(manifest.sources)
      || canonicalJson(receipt.target) !== canonicalJson({ ...manifest.sources.find(s => s.sourceKey === manifest.targetKey), anchor: manifest.targetAnchor })) {
      fail('E_ADAPTER_BINDING', 'candidate receipt binding changed');
    }
    const authorities = db.prepare('SELECT version FROM document_authority').all();
    if (authorities.length !== 1 || authorities[0].version !== manifest.authorityVersion) fail('E_ADAPTER_STALE', 'authority changed');
    for (const source of manifest.sources) {
      const document = readDocument(db, { corpusKind: source.corpusKind, domain: source.domain, documentId: source.documentId, visibility: 'public' });
      if (!document) fail('E_ADAPTER_STALE', 'source no longer publicly admitted');
      const sourceId = document.readMetadata.source_id;
      const head = db.prepare(`SELECT r.revision_id,r.semantic_sha256 FROM document_head h
        JOIN document_revision r USING(source_id,revision_id) JOIN document_revision_seal z USING(revision_id)
        WHERE h.source_id=?`).get(sourceId);
      const admission = db.prepare('SELECT * FROM document_publication_admission WHERE source_id=? ORDER BY revision_id LIMIT 1').get(sourceId);
      if (!head || !admission || head.revision_id !== source.revision || head.semantic_sha256 !== source.semanticSha256
        || digestJson(document) !== source.semanticSha256 || digestJson(admission) !== source.admissionDigest) fail('E_ADAPTER_STALE', 'source read-set changed');
      if (source.sourceKey === manifest.targetKey) {
        const node = db.prepare(`SELECT n.kind,s.representation FROM document_node_identity i
          JOIN text_document_node n ON n.source_id=i.source_id AND n.json_pointer=i.node_pointer
          JOIN text_document_slot s ON s.source_id=n.source_id AND s.node_pointer=n.json_pointer
          WHERE i.source_id=? AND i.node_id=? AND n.anchor=? AND s.json_pointer=n.json_pointer||'/text/ko'`)
          .get(sourceId, manifest.targetAnchor, manifest.targetAnchor);
        if (!node || node.kind !== 'paragraph' || node.representation !== 'string') fail('E_ADAPTER_UNSUPPORTED_CHANGE', 'existing stable Korean paragraph slot required');
        target = document;
      }
    }
    revalidateCandidate();
    db.exec('COMMIT');
    // COMMIT may itself cross an instrumented boundary. No output is created
    // until the retained descriptor has also survived transaction completion.
    revalidateCandidate();
  } finally {
    try { if (db.isTransaction) db.exec('ROLLBACK'); }
    finally {
      try { if (candidateFd !== undefined) fs.closeSync(candidateFd); }
      finally { db.close(); }
    }
  }
  const preview = structuredClone(target);
  const nodes = preview.content.filter(node => node.anchor === manifest.targetAnchor);
  if (nodes.length !== 1 || nodes[0].kind !== 'paragraph' || typeof nodes[0].text?.ko !== 'string') fail('E_ADAPTER_UNSUPPORTED_CHANGE', 'existing Korean paragraph required');
  const inline = text => [...text.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)].map(match => match[1]);
  if (canonicalJson(inline(nodes[0].text.ko)) !== canonicalJson(inline(candidate.replacementText))) fail('E_ADAPTER_UNSUPPORTED_CHANGE', 'anchor changes require a structural editor');
  const commands = [{ type: 'setText', nodeId: manifest.targetAnchor, slot: 'text/ko', value: candidate.replacementText }];
  nodes[0].text.ko = candidate.replacementText;
  preview.status = 'draft';
  const result = { version: 1, status: 'draft', ownerApproval: false, candidateId,
    expectedRevision: receipt.target.revision, replacementSha256: receipt.replacementSha256,
    orderedCommandsSha256: digestJson(commands), fullPreviewSha256: digestJson(preview), commands, preview };
  createImmutableFile(out, Buffer.from(canonicalJson(result)), root);
  return result;
}
