import { createHash } from 'node:crypto';
export { PORTRAIT_ACCEPTANCE_CRITERIA, evaluatePortraitAcceptance } from './acceptance-gate.mjs';
import { strictJSONParse, parse, projectFromNormalizedToken } from './2d/design-prompt.mjs';
import { neutralRecord, slotFields } from './neutral-slots.mjs';
import { validateFaceMode, uniqueFaceIds } from './2d/face-selection.mjs';
import { createModeAdapter } from './normalized/mode-adapter.mjs';
export { project, validateProjection, generationFacing, fields } from './normalized/adapter.mjs';
export { runGeneration as generatePortrait } from './2d/image-generate.mjs';
export { modifyPortrait } from './2d/native-modify.mjs';
export { completeSourceReplacement, prepareCompleteReplacement, validateReplacementPadding } from './2d/complete-source.mjs';
export { composeModificationRequest } from './2d/compose-text-spec.mjs';
export { measureProportions, createProportionProfile, createProportionProfileFromArtifacts, validateProportionProfile, validateSharedProportionProfiles, verifyProportions, verifyProportionArtifacts, proportionInstruction } from './proportion-profile.mjs';
export { strictJSONParse, parse, slotFields, createModeAdapter };
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const modeToken = createModeAdapter({ strictParse: strictJSONParse });
const bytes = value => Buffer.from(JSON.stringify(value));
function completeLook(lookBytes) {
  const look = strictJSONParse(Buffer.from(lookBytes).toString());
  for (const [slot, names] of Object.entries(slotFields)) for (const name of names) if (!Object.hasOwn(look.slots?.[slot] ?? {}, name)) throw new Error('missing authored slot: ' + slot + '.' + name);
  const record = neutralRecord(look);
  validateFaceMode(record.faceMode, true);
  if (look.identity.characterId !== look.characterId || look.identity.name !== look.name) throw new Error('identity mismatch');
  if (record.faceMode.kind === 'template' && (record.uniqueFaceRequired || uniqueFaceIds.includes(record.characterId))) throw new Error('identity requires UNIQUE face');
  return { look, record };
}
export async function resolveSourceAssets(references, adapter) {
  if (!adapter || typeof adapter.read !== 'function') throw new Error('source asset adapter.read required');
  const out = [];
  for (const ref of references) {
    const asset = await adapter.read(ref);
    if (!(asset instanceof Uint8Array) || sha(asset) !== ref.sha256) throw new Error('source asset hash mismatch: ' + ref.index);
    out.push(Buffer.from(asset));
  }
  return out;
}
export function previewPortrait({ lookBytes, references, composition, packageVersion, background = 'transparent' }) {
  const { record } = completeLook(lookBytes);
  if (!Number.isInteger(packageVersion) || packageVersion < 1) throw new Error('explicit package version required');
  return parse({ ...projectFromNormalizedToken(record, { references, composition, background }), inputSnapshotSHA: sha(lookBytes), packageVersion });
}
function sourceMode(input, mode) {
  completeLook(input.lookBytes);
  const result = modeToken({ ...input, mode });
  for (const field of ['canvas', 'pose', 'coverage']) if (!result.modeSpecific[field]) throw new Error('authored ' + mode + ' ' + field + ' required');
  return result;
}
const route = {
  head: { face: slotFields.face }, hair: { hair: slotFields.hair }, body: { body: slotFields.body },
  upper: { outfit: ['upper', 'neckline', 'marks'] }, lower: { outfit: ['lower'] },
  footwear: { outfit: ['footwear'] }, equipment: { accessories: slotFields.accessories, outfit: ['headwear'] },
};
function routed(look, part, inputSnapshotSHA) {
  return Object.fromEntries(Object.entries(route[part]).map(([slot, names]) => [slot, Object.fromEntries(names.map(name => [name, {
    ...structuredClone(look.slots[slot][name]), documentSHA: inputSnapshotSHA, pointer: '/slots/' + slot + '/' + name,
  }]))]));
}
function coverageFor(coverage, part) {
  const c = coverage[part];
  if (!c || Object.keys(c).sort().join(',') !== 'geometry,visibility' || !['visible', 'occluded', 'unknown'].includes(c.visibility)) throw new Error('authored coverage required for part: ' + part);
  if (c.geometry !== null && (!c.geometry || Object.keys(c.geometry).sort().join(',') !== 'source,status,value' || !['approved','authored-draft','art-proposal'].includes(c.geometry.status) || typeof c.geometry.source !== 'string' || !c.geometry.source || c.geometry.value === null)) throw new Error('authored geometry or explicit null required: ' + part);
  return structuredClone(c);
}
export function fullbodyTokens(input) {
  const token = sourceMode(input, 'fullbody');
  const coverage = token.modeSpecific.coverage.value;
  for (const part of Object.keys(route)) coverageFor(coverage, part);
  for (const slot of ['lower', 'footwear']) if (token.shared.slots.outfit[slot].value === null) throw new Error('fullbody requires authored outfit.' + slot);
  if (token.modeSpecific.pose.value === null) throw new Error('authored fullbody pose required');
  return { ...token, schema: 'avatar-fullbody-token.v1', assembled: {
    identity: structuredClone(token.shared.identity), faceMode: structuredClone(token.shared.faceMode), slots: structuredClone(token.shared.slots),
    canvas: token.modeSpecific.canvas, pose: token.modeSpecific.pose, coverage: token.modeSpecific.coverage,
  }, meshGenerated: false };
}
export function partTokens(input) {
  const token = sourceMode(input, '3Dparts');
  if (!token.modeSpecific.parts) throw new Error('explicit segmentation parts required');
  const selected = token.modeSpecific.parts.value;
  const pose = token.modeSpecific.pose.value;
  if (!pose || Object.keys(pose).sort().join(',') !== 'anchors,coordinateSystem,unit' || !['m','cm','mm'].includes(pose.unit) || typeof pose.coordinateSystem !== 'string' || !pose.coordinateSystem.trim()) throw new Error('authored coordinateSystem, unit and anchors required');
  if (!pose.anchors || Object.keys(pose.anchors).some(part => !selected.includes(part))) throw new Error('anchor references an unselected part');
  const ids = Object.fromEntries(selected.map(part => [part, 'part-' + sha(bytes([token.shared.characterId, token.shared.lookId, part])).slice(0,24)]));
  const parts = selected.map(part => {
    const anchor = pose.anchors[part];
    if (!anchor || Object.keys(anchor).sort().join(',') !== 'anchor,parent,position' || typeof anchor.anchor !== 'string' || !anchor.anchor.trim() || !Array.isArray(anchor.position) || anchor.position.length !== 3 || anchor.position.some(v => typeof v !== 'number' || !Number.isFinite(v)) || !(anchor.parent === null || selected.includes(anchor.parent)) || anchor.parent === part) throw new Error('missing or invalid authored attachment anchor: ' + part);
    const seen = new Set([part]); let parent = anchor.parent;
    while (parent !== null) { if (seen.has(parent)) throw new Error('cyclic part attachments'); seen.add(parent); if (!pose.anchors[parent]) throw new Error('missing parent anchor: ' + parent); parent = pose.anchors[parent].parent; }
    const coverage = coverageFor(token.modeSpecific.coverage.value, part);
    const value = { partId: ids[part], part, parentId: anchor.parent === null ? null : ids[anchor.parent], attachment: { anchor: anchor.anchor, position: anchor.position, unit: pose.unit, coordinateSystem: pose.coordinateSystem }, slots: routed(token.shared, part, token.inputSnapshotSHA), visibility: coverage.visibility, geometry: coverage.geometry === null ? { status: 'unknown', value: null, sources: [] } : { ...coverage.geometry, documentSHA: token.modeSHA }, sourceSHA: token.inputSnapshotSHA, modeSHA: token.modeSHA };
    return { ...value, tokenSHA: sha(bytes(value)) };
  });
  return { schema: 'avatar-part-tokens.v1', mode: '3Dparts', shared: token.shared, inputSnapshotSHA: token.inputSnapshotSHA, modeSHA: token.modeSHA, canvas: token.modeSpecific.canvas, pose: token.modeSpecific.pose, parts, hiddenAnatomyInferred: false, meshGenerated: false };
}
