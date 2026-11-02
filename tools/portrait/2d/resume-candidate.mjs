import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { validateVisualSnapshot } from './cliproxy-edit.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sha256 = value => /^[a-f0-9]{64}$/.test(value ?? '');

// binding is a caller-owned historical map, captured after generation, not a
// map reconstructed from today's ordinal filenames. No files are written here.
// Its hashes bind K/name to the exact input, request, receipt and image bytes.
export async function inspectCandidate({ imagePath, requestPath, receiptPath, inputPath, metadataPath = null, expected, binding = null, rejectedImageSha256 = [] }) {
  if (!/^K\d+$/.test(expected?.characterId ?? '') || !expected?.name || !sha256(expected.inputSha256)) throw new Error('expected permanent identity, name and input hash required');
  const paths = { image: imagePath, request: requestPath, receipt: receiptPath, input: inputPath, ...(metadataPath ? { metadata: metadataPath } : {}) };
  const snapshots = {};
  const missing = [];
  for (const [key, path] of Object.entries(paths)) {
    if (!path) throw new Error(`${key} path required`);
    try { snapshots[key] = await readFile(path); }
    catch (error) { if (error.code !== 'ENOENT') throw error; missing.push(key); }
  }
  const hashes = Object.fromEntries(Object.entries(snapshots).map(([key, bytes]) => [`${key}Sha256`, hash(bytes)]));
  const occupied = ['image', 'request', 'receipt', 'metadata'].some(key => snapshots[key] !== undefined);
  const result = (status, reason) => ({ status, reason, characterId: expected.characterId, name: expected.name, imagePath: resolve(imagePath), hashes, requiresNewSuffix: occupied && status !== 'generated' });
  // A rejection is image-specific and survives missing or damaged sidecars.
  if (rejectedImageSha256.includes(hashes.imageSha256)) return result('rejected', 'owner-rejected-image-hash');
  if (missing.length) return result('pending', `missing:${missing.join(',')}`);
  let input, request, receipt, metadata;
  try {
    input = JSON.parse(snapshots.input);
    request = JSON.parse(snapshots.request);
    receipt = JSON.parse(snapshots.receipt);
    metadata = snapshots.metadata ? JSON.parse(snapshots.metadata) : null;
  } catch { return result('unverified', 'invalid-json'); }
  if (![input, request, receipt, ...(metadataPath ? [metadata] : [])].every(record => record && typeof record === 'object' && !Array.isArray(record))) return result('unverified', 'invalid-record');
  if (!snapshots.image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return result('unverified', 'invalid-png');
  if (hashes.inputSha256 !== expected.inputSha256) return result('unverified', 'input-revision-mismatch');
  for (const record of [input, input.identity, input.canonicalContext, metadata, metadata?.identity, metadata?.canonicalContext].filter(Boolean)) {
    if (record.characterId !== expected.characterId || record.name !== expected.name) return result('unverified', 'permanent-identity-mismatch');
  }
  if (receipt?.status !== 'candidate-unreviewed' || receipt.imageSha256 !== hashes.imageSha256 || !isDeepStrictEqual(receipt.request, request)) return result('unverified', 'generation-receipt-mismatch');
  if (request?.schemaVersion !== 1 || !request.model || !request.prompt || !request.size || request.n !== 1 || !Array.isArray(request.references) || !request.references.length || request.references.some(ref => !sha256(ref?.sha256))) return result('unverified', 'invalid-request');
  if (metadata && (metadata.imageSha256 !== hashes.imageSha256 || resolve(metadata.imagePath ?? '') !== resolve(imagePath) || metadata.prompt !== request.prompt || metadata.referenceSha256 !== request.references[0].sha256)) return result('unverified', 'emitter-metadata-mismatch');
  if (request.sourceContext && (request.sourceContext.characterId !== expected.characterId || request.sourceContext.name !== expected.name)) return result('unverified', 'request-context-mismatch');
  if (!binding) return result('unverified', 'legacy-unbound-candidate');
  if (Object.hasOwn(request, 'visualSnapshot') || Object.hasOwn(binding, 'sourcePromptSha256') || Object.hasOwn(binding, 'transmittedPromptSha256')) {
    try { validateVisualSnapshot(request); }
    catch { return result('unverified', 'visual-source-binding-mismatch'); }
    if (!request.visualSnapshot || binding.sourcePromptSha256 !== request.sourceSnapshot?.promptSha256 || binding.transmittedPromptSha256 !== request.visualSnapshot.transmittedPromptSha256) return result('unverified', 'transmitted-prompt-binding-mismatch');
  }
  if (binding.characterId !== expected.characterId || binding.name !== expected.name) return result('unverified', 'binding-identity-mismatch');
  for (const key of Object.keys(paths)) {
    if (!sha256(binding[`${key}Sha256`]) || binding[`${key}Sha256`] !== hashes[`${key}Sha256`]) return result('unverified', `binding-${key}-hash-mismatch`);
  }
  // generated is a reusable candidate stage, never a technical or owner PASS.
  return result('generated', 'receipt-bound-candidate');
}
