import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const digest = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const text = value => typeof value === 'string' && value.length > 0 && !value.includes('\0');

// Evidence is immutable archival input, not current typed document authority.
// The caller supplies independently authenticated capture-receipt bindings and
// owns the private read-only snapshot; neither paths nor pins are discovered.
export async function readCapturedEvidenceBytesAsync(privateTx, logicalPath, binding) {
  if (!privateTx || typeof privateTx.all !== 'function' || !text(logicalPath)
    || isAbsolute(logicalPath) || logicalPath.split('/').some(part => !part || part === '.' || part === '..')
    || !text(binding?.identity) || !digest(binding?.sha256)) fail('E_EVIDENCE_READER_BINDING');
  const policy = await privateTx.all('SELECT singleton, privacy FROM wiki_private.ev_evidence_policy');
  if (policy.length !== 1 || Number(policy[0].singleton) !== 1 || policy[0].privacy !== 'restricted-internal-only') fail('E_PRIVATE');
  const rows = await privateTx.all(`SELECT identity, kind, logical_path, revision, git_revision, git_blob,
    raw_bytes, sha256, byte_length, record_sha256 FROM wiki_private.ev_evidence
    WHERE identity = ? AND logical_path = ?`, [binding.identity, logicalPath]);
  if (rows.length !== 1) fail('E_EVIDENCE_READER_MISSING');
  const row = rows[0];
  if (row.sha256 !== binding.sha256) fail('E_SHA_MISMATCH');
  if (!(row.raw_bytes instanceof Uint8Array)) fail('E_INTEGRITY');
  const bytes = Buffer.from(row.raw_bytes);
  if (Number(row.byte_length) !== bytes.length || hash(bytes) !== binding.sha256) fail('E_INTEGRITY');
  const refs = (await privateTx.all(`SELECT type, pointer, target_identity, expected_sha256
    FROM wiki_private.ev_evidence_reference WHERE source_identity = ?`, [binding.identity]))
    .map(ref => ({ type: ref.type, pointer: ref.pointer, targetIdentity: ref.target_identity, expectedSha256: ref.expected_sha256 }));
  for (const ref of refs) {
    if (!text(ref.type) || typeof ref.pointer !== 'string' || ref.pointer.includes('\0')
      || !/^(?:\/(?:[^~]|~[01])*)*$/.test(ref.pointer) || !text(ref.targetIdentity) || !digest(ref.expectedSha256)) fail('E_INTEGRITY');
  }
  refs.sort((a, b) => {
    const left = JSON.stringify([a.type, a.pointer, a.targetIdentity]);
    const right = JSON.stringify([b.type, b.pointer, b.targetIdentity]);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const record = [row.identity, row.kind, row.logical_path, row.revision, row.git_revision, row.git_blob,
  row.sha256, Number(row.byte_length), refs];
  if (hash(JSON.stringify(record)) !== row.record_sha256) fail('E_INTEGRITY');
  return bytes;
}

// Bind the exact receipt paths before constructing an adapter for existing
// sourceRead consumers. Absolute input paths must remain beneath the given root.
export function capturedEvidenceReaderAsync(privateTx, { root, bindings }) {
  if (!isAbsolute(root) || !(bindings instanceof Map)) fail('E_EVIDENCE_READER_BINDING');
  const base = resolve(root);
  const pins = new Map(bindings);
  return async path => {
    const target = path instanceof URL ? fileURLToPath(path) : path;
    if (typeof target !== 'string') fail('E_EVIDENCE_READER_PATH');
    const logicalPath = relative(base, resolve(target)).split('\\').join('/');
    if (!logicalPath || logicalPath.startsWith('../') || isAbsolute(logicalPath)) fail('E_EVIDENCE_READER_PATH');
    const binding = pins.get(logicalPath);
    if (!binding) fail('E_EVIDENCE_READER_MISSING');
    return readCapturedEvidenceBytesAsync(privateTx, logicalPath, binding);
  };
}
