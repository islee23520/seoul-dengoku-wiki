import { join } from 'node:path';
import { canonicalJson, digestJson, fail, parseCandidate, parseHostManifest, parseSourcePacket, sha256Bytes } from './contracts.mjs';
import { createImmutableFile, ensureHostDirectory, hostPath, readHostFile } from './io.mjs';

/** Host-only API. candidatePath is designated by the caller, never parsed from
 * model text. Collection records a candidate, without opening or changing a DB.
 * Current DB read-set revalidation belongs to the later prepare-draft boundary. */
export function collectCandidate({ trustedRoot, packetId, candidatePath }) {
  if (typeof packetId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(packetId)) fail('E_ADAPTER_SCHEMA', 'host packet UUID required');
  const root = hostPath(trustedRoot);
  const packet = join(root, 'packets', packetId);
  const manifest = parseHostManifest(readHostFile(join(packet, 'manifest.json')));
  const bundleBytes = readHostFile(join(packet, 'bundle.json'));
  const bundle = parseSourcePacket(bundleBytes);
  if (manifest.packetId !== packetId || bundle.packetId !== packetId || bundle.targetKey !== manifest.targetKey
    || sha256Bytes(bundleBytes) !== manifest.inputDigest || bundle.sources.length !== manifest.sources.length) fail('E_ADAPTER_BINDING', 'trusted packet mismatch');
  for (const source of manifest.sources) {
    const exported = bundle.sources.find(item => item.sourceKey === source.sourceKey);
    if (!exported || canonicalJson(exported.excerpts.map(item => item.anchor)) !== canonicalJson(source.anchors)) fail('E_ADAPTER_BINDING', 'trusted anchors mismatch');
  }
  const candidateBytes = readHostFile(candidatePath);
  const candidate = parseCandidate(candidateBytes, manifest);
  // Manifest digest is canonical key-sorted JSON; candidate/input/replacement
  // digests hash exact bytes, without whitespace or Unicode normalization.
  const manifestDigest = digestJson(manifest);
  const candidateSha256 = sha256Bytes(candidateBytes);
  const candidateId = digestJson({ packetId, manifestDigest, candidateSha256 });
  const receipt = { version: 1, status: 'candidate-only', ownerApproval: false, candidateId,
    packetId: manifest.packetId, inputDigest: manifest.inputDigest, manifestDigest, candidateSha256,
    replacementSha256: sha256Bytes(Buffer.from(candidate.replacementText, 'utf8')),
    replacementText: candidate.replacementText, authorityId: manifest.authorityId, authorityVersion: manifest.authorityVersion,
    target: { ...manifest.sources.find(source => source.sourceKey === manifest.targetKey), anchor: manifest.targetAnchor },
    sources: manifest.sources, citations: candidate.citations.map(citation => ({
      ...manifest.sources.find(source => source.sourceKey === citation.sourceKey), anchor: citation.anchor })) };
  const bytes = Buffer.from(canonicalJson(receipt));
  const directory = join(root, 'candidates');
  ensureHostDirectory(directory);
  const receiptPath = join(directory, `${candidateId}.json`);
  try { createImmutableFile(receiptPath, bytes); }
  catch (error) {
    if (error.code !== 'E_ADAPTER_CONFLICT') throw error;
    // A concurrent incomplete writer is an explicit conflict. No retry/sleep,
    // truncation, rename or cleanup can modify another collector's reservation.
    try {
      if (!readHostFile(receiptPath, bytes.length).equals(bytes)) fail('E_ADAPTER_CONFLICT', 'receipt differs');
    } catch { fail('E_ADAPTER_CONFLICT', 'existing receipt is not verified identical'); }
  }
  if (!readHostFile(receiptPath, bytes.length).equals(bytes)) fail('E_ADAPTER_CONFLICT', 'receipt verification failed');
  return { candidateId, receiptPath };
}
