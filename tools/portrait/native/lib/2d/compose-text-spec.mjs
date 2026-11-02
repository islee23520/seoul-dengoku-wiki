import { createHash } from 'node:crypto';
import { neutralRecord, slotPrompt } from '../neutral-slots.mjs';
import { selectFace, validateFaceMode } from './face-selection.mjs';
import { parse, projectFromNormalizedToken, semanticFrame, strictJSONParse } from './design-prompt.mjs';
import { loadPortraitPackage } from './portrait-package.mjs';

export const modificationBindingKeys = ['sourceImageSha256', 'packageVersion', 'inputSnapshotSHA'];

function readLook(lookBytes) {
  if (!(lookBytes instanceof Uint8Array)) throw new Error('exact look bytes required');
  const input = strictJSONParse(Buffer.from(lookBytes).toString('utf8'));
  if (input.identity?.characterId !== undefined && input.identity.characterId !== input.characterId || input.identity?.name !== undefined && input.identity.name !== input.name) throw new Error('text specification identity mismatch');
  return neutralRecord(input);
}

export function composeTextSpecification({ lookBytes, drawingTechnique, composition, packageVersion = null, modification = null }) {
  if (!(lookBytes instanceof Uint8Array)) throw new Error('exact look bytes required');
  const snapshot = Buffer.from(lookBytes);
  const inputSnapshotSHA = createHash('sha256').update(snapshot).digest('hex');
  const record = readLook(snapshot);
  validateFaceMode(record.faceMode, true);
  if (record.faceMode.kind !== 'unique') throw new Error('template text composition requires selected catalog traits in an exported look');
  const specification = { ...composeSelected(record, { lookBytes: snapshot, drawingTechnique, composition }), inputSnapshotSHA, ...(packageVersion !== null ? { packageVersion } : {}), ...(modification !== null ? { modification: structuredClone(modification) } : {}) };
  if (modification !== null && (modification.inputSnapshotSHA !== inputSnapshotSHA || modification.packageVersion !== packageVersion)) throw new Error('modification binding differs from composed input snapshot');
  return specification;
}

export async function prepareTextSpecification({ lookBytes, drawingTechnique, composition, catalogPath = null, canonicalRoot = null, packageRoot = null, packageVersion = null }) {
  if (!(lookBytes instanceof Uint8Array)) throw new Error('exact look bytes required');
  const snapshot = Buffer.from(lookBytes);
  const portraitPackage = packageRoot === null ? null : await loadPortraitPackage({ root: packageRoot });
  if (portraitPackage && packageVersion !== null && packageVersion !== portraitPackage.version) throw new Error('stale portrait package version');
  const record = await selectFace(readLook(snapshot), { required: true, catalogPath, canonicalRoot });
  const specification = { ...composeSelected(record, { lookBytes: snapshot, drawingTechnique, composition }), inputSnapshotSHA: createHash('sha256').update(snapshot).digest('hex') };
  if (portraitPackage) specification.packageVersion = portraitPackage.version;
  else if (packageVersion !== null) throw new Error('package root required for package version binding');
  return specification;
}

export function validateModificationSnapshot({ sourceImageSha256, packageVersion, inputSnapshotSHA }, expected) {
  const binding = { sourceImageSha256, packageVersion, inputSnapshotSHA };
  if (!expected || typeof expected !== 'object' || Array.isArray(expected) || Object.keys(expected).length !== modificationBindingKeys.length || modificationBindingKeys.some(key => key === 'packageVersion' ? typeof binding[key] !== 'number' || expected[key] !== binding[key] : typeof binding[key] !== 'string' || expected[key] !== binding[key])) throw new Error('stale modification snapshot; preview again');
  if (!/^[a-f0-9]{64}$/.test(sourceImageSha256 ?? '') || !/^[a-f0-9]{64}$/.test(inputSnapshotSHA ?? '') || !Number.isInteger(packageVersion) || packageVersion < 1) throw new Error('invalid modification snapshot binding');
  return binding;
}

export function composeModificationRequest({ original, originalBytes = null, changes, activatedSlots, sourceImageSha256, packageVersion, inputSnapshotSHA, expected }) {
  validateModificationSnapshot({ sourceImageSha256, packageVersion, inputSnapshotSHA }, expected);
  if (!original || typeof original !== 'object' || !changes || typeof changes !== 'object' || !Array.isArray(activatedSlots) || !activatedSlots.length) throw new Error('original JSON slots and explicit activated changes required');
  if (!(originalBytes instanceof Uint8Array) || createHash('sha256').update(originalBytes).digest('hex') !== inputSnapshotSHA) throw new Error('stale modification original snapshot; preview again');
  const source = strictJSONParse(Buffer.from(originalBytes).toString('utf8'));
  if (JSON.stringify(source) !== JSON.stringify(original)) throw new Error('modification original JSON differs from bound snapshot');
  const activated = new Set(activatedSlots);
  if (activated.size !== activatedSlots.length) throw new Error('duplicate activated slot rejected');
  if (Object.keys(changes).some(slot => !activated.has(slot)) || [...activated].some(slot => !Object.hasOwn(changes, slot))) throw new Error('activated slot changes must exactly match supplied JSON changes');
  const updated = structuredClone(original);
  for (const slot of activated) {
    if (!Object.hasOwn(original.slots ?? {}, slot) || !changes[slot] || typeof changes[slot] !== 'object' || Array.isArray(changes[slot])) throw new Error('unknown or malformed activated slot: ' + slot);
    updated.slots[slot] = structuredClone(changes[slot]);
  }
  for (const [slot, value] of Object.entries(original.slots ?? {})) if (!activated.has(slot) && JSON.stringify(updated.slots[slot]) !== JSON.stringify(value)) throw new Error('unchanged slot changed: ' + slot);
  return { schema: 'character-modification.v1', sourceImageSha256, packageVersion, inputSnapshotSHA, activatedSlots: [...activated], slots: updated.slots };
}

function composeSelected(record, { lookBytes, drawingTechnique, composition }) {
  if (typeof record.uniqueFaceRequired !== 'boolean' || record.uniqueFaceRequired && (record.uniqueFaceSource?.characterId !== record.characterId || typeof record.uniqueFaceSource?.source !== 'string' || !record.uniqueFaceSource.source.trim())) throw new Error('invalid permanent unique face marker');
  const standalone = value => typeof value === 'string' && value.trim() && !/[\r\n\x00-\x1f]|https?:|file:|data:|\\|(?:^|[\s=])(?:\/|\.\.?\/|[a-z]:\/)|\b(?:photo(?:graph)?|reference|same as|previous|latest)\b|\b(?:face|hair|body|outfit|accessories)\.[a-zA-Z]+\s*:|사진|참조|레퍼런스/i.test(value);
  if (!standalone(drawingTechnique) || !standalone(composition)) throw new Error('standalone drawing technique and composition required');
  for (const field of ['gender', 'ageCategory']) if (record.identity[field].value !== null && !standalone(record.identity[field].value)) throw new Error('unresolved recipient header: ' + field);
  for (const [slot, fields] of Object.entries(record.slots)) for (const [field, trait] of Object.entries(fields)) {
    if (typeof trait.value === 'string' && !standalone(trait.value)) throw new Error('unresolved image-dependent slot: ' + slot + '.' + field);
    if (trait.unit !== undefined && !(trait.value === null && trait.unit === null) && !standalone(trait.unit)) throw new Error('invalid transmitted unit: ' + slot + '.' + field);
  }
  if (['face', 'hair'].some(slot => record.slots[slot].description.value === null) || record.slots.outfit.upper.value === null) throw new Error('essential authored portrait slots required');
  const prompt = [
    'One original 2D character portrait. Native 1024x1536 RGBA PNG with a completely transparent background: actual alpha 0 outside the character, opaque character interior and clean antialiased silhouette edges. No painted checkerboard, solid backdrop, text, labels or watermark.',
    `Recipient gender: ${record.identity.gender.value}; age category: ${record.identity.ageCategory.value ?? 'unspecified'}.`,
    slotPrompt(record.slots),
    'Drawing technique: ' + drawingTechnique,
    'Semantic frame: ' + JSON.stringify(semanticFrame),
    'Explicit authored slots take precedence; unspecified traits remain unspecified.',
  ].join('\n\n');
  return { schema: 'character-text-generation.v1', characterId: record.characterId, name: record.name, lookId: record.lookId, gender: record.identity.gender.value, inputSHA: createHash('sha256').update(lookBytes).digest('hex'), prompt, slots: record.slots, faceMode: record.faceMode };
}

export async function composeDesignRequest({ lookBytes, references, composition, background = 'transparent', packageRoot, packageVersion, modification = null }) {
  if (!(lookBytes instanceof Uint8Array)) throw new Error('exact look bytes required');
  const snapshot = Buffer.from(lookBytes);
  const inputSnapshotSHA = createHash('sha256').update(snapshot).digest('hex');
  if (!packageRoot || !Number.isInteger(packageVersion) || packageVersion < 1) throw new Error('verified package root and version required');
  const portraitPackage = await loadPortraitPackage({ root: packageRoot });
  if (packageVersion !== portraitPackage.version) throw new Error('stale portrait package version');
  const record = readLook(snapshot);
  const raw = strictJSONParse(snapshot.toString('utf8'));
  if (raw.identity?.characterId !== undefined && raw.identity.characterId !== record.characterId || raw.identity?.name !== undefined && raw.identity.name !== record.name) throw new Error('design request identity mismatch');
  const selected = { ...record, faceMode: validateFaceMode(record.faceMode, true) };
  if (selected.faceMode.kind === 'template' && selected.uniqueFaceRequired) throw new Error('identity requires unique face');
  if (modification !== null) {
    validateModificationSnapshot(modification, modification);
    if (modification.packageVersion !== packageVersion || modification.inputSnapshotSHA !== inputSnapshotSHA) throw new Error('modification binding differs from composed JSON snapshot');
  }
  const designPrompt = parse({ ...projectFromNormalizedToken(selected, { references, composition, background }), inputSnapshotSHA, packageVersion, ...(modification !== null ? { modification: structuredClone(modification) } : {}) });
  return designPrompt;
}
