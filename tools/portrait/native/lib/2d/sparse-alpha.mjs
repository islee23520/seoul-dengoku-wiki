import { createHash } from 'node:crypto';
import { readFile, stat, open, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { strictJSONParse } from './design-prompt.mjs';
import { decodeCodexPng } from './codex-image.mjs';
import { encodeFinalPng } from './final-alpha-export.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const pixelListSHA = pixels => sha(Buffer.from(JSON.stringify(pixels)));
const checkedPixels = (pixels, size) => {
  if (!Array.isArray(pixels) || !pixels.length || pixels.length >= size || pixels.some((p, n) => !Number.isInteger(p) || p < 0 || p >= size || (n > 0 && p <= pixels[n - 1]))) throw new Error('canonical strictly increasing approved pixel list required');
  return pixels;
};

export async function sparseAlpha({ sourcePath, sourceBytes, sourceSHA, sparseMask, alpha, region, output, receipt, binding, activatedSlots }) {
  if (alpha !== 0 || region !== undefined) throw new Error('sparse local-alpha requires alpha zero and no rectangle');
  const source = decodeCodexPng(sourceBytes);
  if (source.channels !== 4) throw new Error('sparse source must be RGBA');
  const immutable = [[sourcePath, sourceBytes]];
  async function bound(path, digest) {
    if (!/^[a-f0-9]{64}$/.test(digest ?? '')) throw new Error('immutable byte SHA required');
    const bytes = await readFile(path);
    if (sha(bytes) !== digest) throw new Error('stale sparse mask or approval byte SHA');
    immutable.push([path, bytes]); return bytes;
  }
  const approvalBytes = await bound(sparseMask.approvalPath, sparseMask.approvalSHA);
  const approval = strictJSONParse(approvalBytes.toString('utf8'));
  const ownershipBytes = await bound(sparseMask.ownershipProofPath, sparseMask.ownershipProofSHA);
  const ownership = strictJSONParse(ownershipBytes.toString('utf8'));
  const independent = ownership.schema === 'k033-alpha-independent-visible-ownership.v1' && ownership.status === 'OWNERSHIP_DECIDED_BOUNDED' && ownership.sourceBinding?.sourceSHA256 === sourceSHA;
  const authored = ownership.schema === 'portrait-local-owner-proof.v1' && ownership.sourceSHA === sourceSHA && ownership.ownerAuthorized === true && ownership.scope === 'selected-background-alpha-only';
  if (approval.schema !== 'portrait-sparse-alpha-approval.v1' || approval.version !== 1 || sparseMask.version !== 1 || approval.approved !== true || approval.sourceSHA !== sourceSHA || JSON.stringify(approval.canvas) !== JSON.stringify([source.width, source.height]) || approval.packageVersion !== binding.packageVersion || approval.inputSnapshotSHA !== binding.inputSnapshotSHA || approval.ownershipProofSHA !== sparseMask.ownershipProofSHA || (!independent && !authored)) throw new Error('stale or unapproved source/canvas/version/ownership binding');
  const approved = checkedPixels(approval.approvedSelectedPixels, source.width * source.height);
  const listSHA = pixelListSHA(approved);
  if (listSHA !== approval.pixelListSHA || listSHA !== sparseMask.pixelListSHA || (authored && ownership.pixelListSHA !== listSHA)) throw new Error('approved pixel-list SHA mismatch');
  if (independent) {
    const evidence = strictJSONParse((await bound(approval.componentMaskPath, approval.componentMaskSHA)).toString('utf8'));
    if (evidence.sourceSHA256 !== sourceSHA || evidence.ownershipRecordSHA256 !== sparseMask.ownershipProofSHA || evidence.pixelCount !== 4432 || evidence.connectivity !== 4 || sha(source.pixels) !== evidence.decodedRGBASHA256) throw new Error('stale approved component evidence');
    const evidencePixels = evidence.components.flatMap(c => c.pixels.map(([x, y]) => y * source.width + x)).sort((a, b) => a - b);
    checkedPixels(evidencePixels, source.width * source.height);
    if (pixelListSHA(evidencePixels) !== listSHA || evidencePixels.length !== 4432) throw new Error('unapproved component pixel list');
  }
  const maskBytes = await bound(sparseMask.path, sparseMask.sha256);
  let selected;
  if (sparseMask.format === 'canonical-pixel-list-json') {
    selected = checkedPixels(strictJSONParse(maskBytes.toString('utf8')), source.width * source.height);
    const canonical = JSON.stringify(selected);
    if (!maskBytes.equals(Buffer.from(canonical)) && !maskBytes.equals(Buffer.from(canonical + '\n'))) throw new Error('pixel list bytes must be canonical JSON');
  } else if (sparseMask.format === 'binary-png') {
    const mask = decodeCodexPng(maskBytes);
    if (mask.channels !== 4 || mask.width !== source.width || mask.height !== source.height) throw new Error('binary mask canvas mismatch');
    selected = [];
    for (let i = 0; i < source.width * source.height; i++) {
      const a = mask.pixels[i * 4 + 3];
      if (a !== 0 && a !== 255) throw new Error('partial mask alpha rejected');
      if (a === 0) selected.push(i);
    }
    checkedPixels(selected, source.width * source.height);
  } else throw new Error('unsupported sparse mask format');
  if (pixelListSHA(selected) !== listSHA) throw new Error('mask differs from approved selected pixels; unapproved foreground rejected');
  const protectedPaths = await Promise.all(immutable.map(async ([path]) => realpath(path)));
  if (resolve(output) === resolve(receipt)) throw new Error('output and receipt must be distinct');
  for (const target of [output, receipt]) {
    if (immutable.some(([path]) => resolve(path) === resolve(target))) throw new Error('source or immutable input alias rejected');
    try { const s = await stat(target); if (s) throw new Error('output already exists: ' + target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = await realpath(resolve(target, '..'));
    if (protectedPaths.includes(resolve(parent, target.split('/').at(-1)))) throw new Error('immutable input alias rejected');
  }
  const pixels = Buffer.from(source.pixels); let changedPixels = 0;
  for (const i of selected) { if (pixels[i * 4 + 3] !== 0) changedPixels++; pixels[i * 4 + 3] = 0; }
  if (!changedPixels) throw new Error('requested modification produced no pixel changes');
  const outputBytes = encodeFinalPng({ ...source, pixels }), after = decodeCodexPng(outputBytes), selectedSet = new Set(selected);
  let rgbDifferences = 0, outsideRGBADifferences = 0, selectedNonzeroAlpha = 0;
  for (let i = 0; i < source.width * source.height; i++) {
    const a = source.pixels.subarray(i * 4, i * 4 + 4), b = after.pixels.subarray(i * 4, i * 4 + 4);
    if (!a.subarray(0, 3).equals(b.subarray(0, 3))) rgbDifferences++;
    if (!selectedSet.has(i) && !a.equals(b)) outsideRGBADifferences++;
    if (selectedSet.has(i) && b[3] !== 0) selectedNonzeroAlpha++;
  }
  if (rgbDifferences || outsideRGBADifferences || selectedNonzeroAlpha) throw new Error('decoded sparse preservation proof failed');
  for (const [path, bytes] of immutable) if (sha(await readFile(path)) !== sha(bytes)) throw new Error('immutable sparse input changed before output');
  const record = { schema: 'portrait-native-modification.v1', ...binding, operation: 'local-alpha', activatedSlots, source: { path: resolve(sourcePath), sha256: sourceSHA }, output: { path: resolve(output), sha256: sha(outputBytes) }, sparseMask: { ...sparseMask }, canvas: [source.width, source.height], selectedPixels: selected.length, changedPixels, proof: { rgbDifferences, outsideRGBADifferences, selectedNonzeroAlpha }, providerCalls: 0, reviewStatus: 'pending', wholePortraitPass: false };
  const handles = [];
  try {
    handles.push(await open(output, 'wx', 0o600)); handles.push(await open(receipt, 'wx', 0o600));
    await handles[0].writeFile(outputBytes); await handles[1].writeFile(JSON.stringify(record, null, 2) + '\n');
  } finally { await Promise.all(handles.map(handle => handle.close())); }
  return record;
}
