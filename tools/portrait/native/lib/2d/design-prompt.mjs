import { z } from 'zod';
import { createHash } from 'node:crypto';
import { slotFields, neutralRecord } from '../neutral-slots.mjs';
import { validateFaceMode } from './face-selection.mjs';
import { validateProportionProfile } from '../proportion-profile.mjs';

export const SCHEMA = 'character-art-2d.v1';

/** Check decoded keys in each object, including objects nested in arrays. */
export function strictJSONParse(text) {
  if (typeof text !== 'string') return text;
  const parsed = JSON.parse(text);
  const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g);
  const stack = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '{') stack.push(new Set());
    else if (token === '[') stack.push(null);
    else if (token === '}' || token === ']') stack.pop();
    else if (token.startsWith('"') && tokens[i + 1] === ':') {
      const key = JSON.parse(token), keys = stack.at(-1);
      if (keys.has(key)) throw new Error('Duplicate key "' + key + '" rejected');
      keys.add(key);
    }
  }
  return parsed;
}

function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}

const Text = z.string().refine(value => value.trim().length > 0, 'nonempty text required');
const Hash = z.string().regex(/^[a-f0-9]{64}$/).refine(value => value !== '0'.repeat(64), 'actual source hash required');
const Mode = z.enum(['portrait', 'frontfullbody', 'turntable', '3D']);
const Gender = z.enum(['male', 'female', 'unknown']);
const UnitNumber = z.object({ value: z.number().finite(), unit: Text }).strict();
const AppearanceText = z.string().refine(value => !/\b(?:photo(?:graph)?|reference (?:person|image|photo)|identity reference|previous generated (?:face|image)|latest (?:owner|image|photo)|(?:previous|existing|reference) portrait)\b|(?:사진|참조\s*(?:인물|이미지|사진)|이전\s*생성\s*(?:얼굴|이미지)|(?:기존|이전|참조)[^\r\n;]*초상)/i.test(value), 'standalone appearance values required; resolve image-dependent descriptions before generation');
const Leaf = z.union([AppearanceText, UnitNumber, z.null()]);
const Appearance = z.object(Object.fromEntries(Object.entries(slotFields).map(([slot, fields]) => [slot,
  z.object(Object.fromEntries(fields.map(field => [field, slot === 'body' && ['height', 'weight'].includes(field) ? UnitNumber.nullable() : Leaf]))).strict()
]))).strict();
const Face = z.object({ kind: z.enum(['unique', 'template']), variantId: Text.nullable() }).strict().refine(face => {
  validateFaceMode(face, true);
  return true;
});
const FramingGuide = z.object({ mode: Mode, gender: Gender, sourceHash: Hash, landmarkBinding: Text, metadataSHA: Hash.optional() }).strict();
export const measuredLandmarkNames = ['headtop', 'headcenter', 'chin', 'eye_line_axis', 'shoulder_left', 'shoulder_right'];
const NormalizedPoint = z.tuple([z.number().finite().min(0).max(1), z.number().finite().min(0).max(1)]);
const FrameTargets = z.object(Object.fromEntries(measuredLandmarkNames.map(name => [name, z.object({
  normalized: NormalizedPoint,
  role: z.literal(name.startsWith('shoulder_') ? 'joint-center-not-outer-boundary' : name === 'eye_line_axis' ? 'orientation-axis-marker' : 'semantic-head-point'),
}).strict()]))).strict();
// Digest-only forms are historical fixtures. New emitters always supply the numeric form.
const LegacyMeasuredFrameGuide = z.object({ landmarks: z.array(Text).min(1), contractId: Text }).strict();
const NumericMeasuredFrameGuide = LegacyMeasuredFrameGuide.extend({
  sourceHash: Hash, metadataSHA: Hash, landmarkBinding: Hash,
  canvas: z.union([z.tuple([z.literal(1024), z.literal(1536)]), z.tuple([z.literal(1152), z.literal(1344)])]),
  coordinateSystem: z.literal('normalized-top-left-x-right-y-down'),
  guideYaw: z.object({ value: z.number().finite(), unit: z.literal('degrees'), authority: z.literal('private-implementation-calibration'), ownerApprovedOptics: z.literal(false) }).strict(),
  targets: FrameTargets,
}).strict();
export const semanticFrame = deepFreeze({
  version: 'owner-semantic-portrait-frame.v1', coordinateSystem: 'normalized-top-left-x-right-y-down', authority: 'owner-frame-criteria',
  pupilMidpointY: [0.451, 0.457], lowestChinSkinY: [0.615, 0.635], highestAttachedHairCrownY: [0.236, 0.248], verticalChinMinusCrownSpan: [0.377, 0.399],
  canvasHeight: 1536, headFullyContained: true, shouldersGarmentHorizontallyContained: true, garmentBottomContact: true,
});
const Identifier = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const SemanticFrame = z.object(Object.fromEntries(Object.entries(semanticFrame).map(([key, value]) => [key, Array.isArray(value) ? z.tuple(value.map(number => z.literal(number))) : z.literal(value)]))).strict();
const SemanticComposition = z.object({
  frameContractVersion: z.literal('semantic-frame.v2'), cameraContractId: Identifier, mode: z.literal('portrait'),
  coordinatedHeadTorso: z.literal(true), viewerRight: z.literal(true), gazeCamera: z.literal(true), fullHeadShoulderConstraints: z.literal(true),
  semanticFrame: SemanticFrame,
  measuredFrameGuide: z.object({ sourceHash: Hash, metadataSHA: Hash, landmarkBinding: Hash, canvas: z.tuple([z.literal(1024), z.literal(1536)]) }).strict(),
}).strict();
const Rational = z.string().regex(/^-?\d+(?:\/[1-9]\d*)?$/);
const PositionMetric = z.object({ sampleCount: z.literal(16), meanMidpoint: Rational, meanInterval: z.tuple([Rational,Rational]), inner: z.tuple([Rational,Rational]), outer: z.tuple([Rational,Rational]), measurementStatus: z.literal('AUTHORITATIVE_POSITION_OBSERVABLE_INTERVALS'), exactPixelCertification: z.literal(false), passAuthority: z.literal(true), positionReferenceAuthority: z.literal(true), passAuthorityScope: z.literal('POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME') }).strict();
const PositionComposition = z.object({
  frameContractVersion: z.literal('position-reference.v2'), cameraContractId: Identifier, mode: z.literal('portrait'),
  coordinatedHeadTorso: z.literal(true), viewerRight: z.literal(true), gazeCamera: z.literal(true), fullHeadShoulderConstraints: z.literal(true),
  referenceVersion: Text, referenceSHA: Hash, ruleSHA: Hash, unit: z.literal('px'),
  positionMetrics: z.object(Object.fromEntries(['chinY','crownY','headLeft','headRight','leftPupilX','leftPupilY','rightPupilX','rightPupilY','eyeY','topGap','headCenterX','headCenterY'].map(k=>[k,PositionMetric]))).strict(),
  measuredFrameGuide: z.object({ sourceHash: Hash, metadataSHA: Hash, landmarkBinding: Hash, canvas: z.tuple([z.literal(1024),z.literal(1536)]) }).strict(),
  wholeFramePassAuthority: z.literal(false),
  referencePrecedence: z.literal('Latest approved position-reference.v2 exact rational metrics exclusively own numeric head size, crown, eye, chin and framing positions. The mannequin reference supplies coordinated orientation and body pose only; its image and diagnostic metadata supply no numeric positions or framing authority.'),
}).strict();
const Reference = z.object({
  index: z.number().int().min(1),
  role: z.enum(['drawing-technique-only', 'individual-face-only', 'face-base-only', 'framing-only', 'recipient-appearance-only']),
  sameOwnerRecipient: z.literal(true).optional(),
  allowedProperties: z.array(Text).optional(),
  priority: z.number().finite().optional(),
  sourceHash: Hash.optional(),
  landmark: Text.optional(),
  guide: FramingGuide.optional(),
}).strict();
const Composition = z.object({
  shot: z.literal('medium-close-up-119'), cameraContractId: Text, mode: Mode,
  coordinatedHeadTorso: z.literal(true), viewerRight: z.literal(true), gazeCamera: z.literal(true),
  fullHeadShoulderConstraints: z.literal(true),
  measuredFrameGuide: z.union([Text, LegacyMeasuredFrameGuide, NumericMeasuredFrameGuide]),
}).strict();
const Output = z.object({
  format: z.literal('single-portrait'), background: z.enum(['opaque', 'transparent']),
  backgroundInstruction: z.enum(['Completely transparent background with actual alpha 0 outside the character, fully opaque character interior, and clean antialiased edges. No painted checkerboard, solid backdrop, floor or cast shadow.', 'The subject must be fully opaque: alpha 255 in the face, hair, body and clothing core, at 100% layer opacity. Only silhouette edges may use antialiased partial alpha. Background outside the subject must be fully transparent with actual alpha 0. Do not render the subject at alpha 253 or 254 or with overall translucency. No painted checkerboard, solid backdrop, floor or cast shadow.']).optional(),
  width: z.union([z.literal(1024), z.literal(1152)]), height: z.union([z.literal(1536), z.literal(1344)]), rgba: z.literal(true), noBakedText: z.literal(true),
  desired: z.enum(['1024x1536', '1152x1344']).optional(),
}).strict();
const permitted = {
  'drawing-technique-only': ['linework', 'shading', 'rendering', 'drawing-technique'],
  'individual-face-only': slotFields.face,
  'face-base-only': slotFields.face,
  'framing-only': ['pose', 'frame'],
  // Same recipient preservation only; authored slots and face mode retain authority.
  'recipient-appearance-only': ['face', 'body', 'hair', 'outfit', 'accessories'],
};
const Pixel = z.number().int().nonnegative().refine(Number.isSafeInteger);
const ClothingSource = z.discriminatedUnion('kind', [
  z.object({ kind:z.literal('canonical-document'),documentSHA:Hash,jsonPointer:Text,value:Text }).strict(),
  z.object({ kind:z.literal('owner-event'),eventId:Text,eventSHA:Hash,textRange:z.tuple([z.number().int().nonnegative(),z.number().int().positive()]),normalizedValue:Text,operatorPinnedEventRegistrySHA:Hash }).strict(),
]);
const ClothingField = values => z.object({ value: (values ? z.enum(values) : Text).nullable(), status: z.enum(['authored','source-approved','unknown']), source: ClothingSource.nullable() }).strict().refine(f=>f.status==='unknown' ? f.value===null && f.source===null : f.value!==null && f.source!==null);
export const clothingPolicySchema = z.object({
  schema: z.literal('avatar-clothing-policy.v1'),
  eraBaseline: ClothingField(['WWII-era']),
  tier: ClothingField(null),
  tierLayerPreference: ClothingField(['thin-light','unspecified']),
  surfaceExposure: ClothingField(['frequent','underground','occasional']),
  winterProtection: ClothingField(['warm-outer-layer','not-required-by-exposure','unresolved']),
}).strict().refine(p=>{
  if(p.surfaceExposure.value==='frequent' && p.winterProtection.value!=='warm-outer-layer')throw new Error('frequent surface exposure requires warm outer layer even at high tier; provider calls: 0');
  if(p.tier.value==='high' && p.tierLayerPreference.value!=='thin-light')throw new Error('high tier requires explicit thin-light preference beneath weather layer');
  return true;
});
const projectionHash = value => createHash('sha256').update(value).digest('hex');
export function readablePositionProjection(model) {
  const c = model.composition, b = model.completeSource.boundaryPolicy;
  const names = ['chinY','crownY','headLeft','headRight','leftPupilX','leftPupilY','rightPupilX','rightPupilY','eyeY','topGap','headCenterX','headCenterY'];
  const rows = names.map(metric => ({ metric, inner: [...c.positionMetrics[metric].inner], outer: [...c.positionMetrics[metric].outer] }));
  const scope = { scopeVersion: 'complete-source-readable-position.v1', referenceSHA: c.referenceSHA, ruleSHA: c.ruleSHA, referenceVersion: c.referenceVersion, unit: 'px', canvas: b.canvas, coordinates: { origin: 'top-left', x: 'right', y: 'down', normalizedX: 'x/1024', normalizedY: 'y/1536' }, rows, boundary: b.boundary, bottomContact: b.bottomContact, referenceScopes: model.references.map(({ index,role,sourceHash,allowedProperties })=>({index,role,sourceHash,allowedProperties:allowedProperties??null})), upper: model.appearance.outfit.upper, neckline: model.appearance.outfit.neckline, clothingPolicy: model.completeSource.clothingPolicy };
  const text = ['Numeric framing authority is only the latest position-reference.v2 intervals. The mandatory mannequin supplies coordinated body orientation and pose only, never head placement or numeric framing.',
    'Source canvas 1024x1536 pixels; top-left origin, x right, y down. Normalized coordinates are x/1024 and y/1536; interval values below remain exact source pixels, not normalized values.',
    ...rows.map(r=>`Place ${r.metric} within ${r.inner[0]} to ${r.inner[1]} pixels inclusive in the 1024 by 1536 source canvas; the unchanged outer observation band is ${r.outer[0]} to ${r.outer[1]} pixels. Use top-left origin with x right and y down.`),
    `Both shoulder and sleeve outlines must finish naturally inside the horizontal canvas. No garment material may be truncated by either vertical side. The connected torso garment contacts row${b.bottomContact.row} at the bottom only. Transparent background must remain outside the natural silhouette. Do not invent numeric side margins, crop side material, stretch the subject, or fill tiles.`,
    `Visible role garment construction: ${scope.upper}. Preserve every non-upper authored leaf. Preserve authored neckline: ${scope.neckline ?? 'unspecified'}. Selected face asset supplies the template system face only, style supplies rendering only, pose mannequin supplies pose only.`,
    `Clothing era baseline: ${scope.clothingPolicy.eraBaseline.value ?? 'UNVERIFIED'}. Tier: ${scope.clothingPolicy.tier.value ?? 'UNVERIFIED'}; tier layer preference: ${scope.clothingPolicy.tierLayerPreference.value ?? 'UNVERIFIED'}. Surface exposure: ${scope.clothingPolicy.surfaceExposure.value ?? 'UNVERIFIED'}; winter protection: ${scope.clothingPolicy.winterProtection.value ?? 'UNVERIFIED'}. Frequent surface travel requires a warm outer layer even at high tier; lighter thinner high-tier base garments remain beneath weather protection. Do not infer exposure from occupation or rank. Preserve occupation construction and authored Catholic or Presbyterian identity beneath the weather layer. No real military insignia, company logos or invented country-uniform specifics. Unknown exposure or unsourced fields cannot establish clothing PASS.`].join('\n');
  const json = JSON.stringify(scope);
  return { scopeVersion: scope.scopeVersion, projectionJSON: json, projectionJSONSHA: projectionHash(json), text, textSHA: projectionHash(text), scopeHash: projectionHash(json) };
}
export const replacementBoundarySchema = z.object({
  schema: z.literal('portrait-complete-source-boundary.v1'), unit: z.literal('px'),
  canvas: z.object({ width: Pixel, height: Pixel }).strict(), referenceVersion: Text,
  provenance: Text, authority: z.object({ documentSHA: Hash, pointer: Text }).strict(),
  positionBounds: z.object({ ruleSHA: Hash, pointer: Text, scope: z.literal('position-v2') }).strict(),
  boundary: z.object({ mode: z.enum(['authored-numeric-bands', 'observable-no-cut']), padding: z.object({ left: Pixel, right: Pixel, top: Pixel, bottom: Pixel }).strict().nullable(), evidenceRequired: z.literal(true) }).strict(),
  bottomContact: z.object({ required: z.literal(true), row: Pixel, subject: z.literal('connected-torso-garment') }).strict(),
}).strict();
export const schema = z.object({
  schema: z.literal(SCHEMA),
  completeSource: z.object({ operation: z.literal('complete-source-replacement'), instruction: Text, boundaryPolicySHA: Hash, boundaryPolicy: replacementBoundarySchema, clothingPolicy: clothingPolicySchema, readableProjection: z.object({ scopeVersion: z.literal('complete-source-readable-position.v1'), projectionJSON: Text, projectionJSONSHA: Hash, text: Text, textSHA: Hash, scopeHash: Hash }).strict().optional() }).strict().optional(),
  inputSnapshotSHA: Hash.optional(),
  packageVersion: z.number().int().positive().optional(),
  proportionProfile: z.unknown().superRefine((profile, context) => {
    try { validateProportionProfile(profile); }
    catch (error) { context.addIssue({ code: 'custom', message: error.message }); }
  }).optional(),
  garmentEdit: z.object({ operation: z.literal('garment-edit'), fabricPresent: z.boolean(), fabricationCase: z.enum(['existing-fabric', 'missing-fabric']), contractSHA: Hash, maskSHA: Hash, originalLookSHA: Hash, maskSemantics: z.literal('binary-alpha-zero-editable.v1'), activatedSlots: z.union([z.tuple([z.literal('appearance.outfit.upper')]), z.tuple([z.literal('appearance.outfit.upper'), z.literal('appearance.outfit.neckline')])]), instruction: z.literal('Correct only activated garment leaves using their authored values. For missing-fabric, add the upper garment and preserve the neckline. Preserve all unactivated authored fields, identity, face, hair, body, skin, props and frame. Mask alpha zero is editable; alpha 255 is protected.') }).strict().refine(edit => edit.fabricationCase === 'missing-fabric' ? edit.fabricPresent === false && edit.activatedSlots.length === 1 : edit.fabricPresent === true && edit.activatedSlots.length === 2).optional(),
  modification: z.object({ sourceImageSha256: Hash, packageVersion: z.number().int().positive(), inputSnapshotSHA: Hash }).strict().optional(),
  recipient: z.object({ gender: Gender, ageCategory: Text.nullable() }).strict(),
  face: Face, appearance: Appearance, references: z.array(Reference).min(1), composition: z.union([Composition, SemanticComposition, PositionComposition]), output: Output,
}).strict().refine(model => {
  if (model.completeSource?.readableProjection && JSON.stringify(model.completeSource.readableProjection) !== JSON.stringify(readablePositionProjection(model))) throw new Error('readable projection text/JSON/version/hash/scope mismatch; provider calls: 0');
  if (model.completeSource?.readableProjection && !model.completeSource.instruction.endsWith('\n' + model.completeSource.readableProjection.text)) throw new Error('readable projection missing from generation instruction; provider calls: 0');
  const measured = model.composition.measuredFrameGuide;
  const canvas = model.composition.mode === 'portrait' && typeof measured === 'object' && 'targets' in measured ? measured.canvas : [1024, 1536];
  if (model.output.width !== canvas[0] || model.output.height !== canvas[1] || model.output.desired !== undefined && model.output.desired !== `${canvas[0]}x${canvas[1]}`) throw new Error('output canvas must match the explicit measured portrait guide');
  for (const [position, ref] of model.references.entries()) {
    if (ref.index !== position + 1) throw new Error('reference indices must follow actual upload order');
    if (ref.allowedProperties?.some(property => !permitted[ref.role].includes(property))) throw new Error('reference role cannot supply donor appearance properties');
    if (ref.role === 'recipient-appearance-only' ? !ref.sameOwnerRecipient || !ref.sourceHash : ref.sameOwnerRecipient !== undefined) throw new Error('recipient appearance preservation requires same-owner recipient and actual source hash; annotation is recipient-only');
    if (ref.role === 'face-base-only' && model.face.kind !== 'template' || ref.role === 'individual-face-only' && model.face.kind !== 'unique') throw new Error('face mode/reference role mismatch');
    if (ref.role !== 'framing-only' && ref.guide) throw new Error('guide must be framing-only');
    if (ref.role === 'framing-only') {
      if (model.composition.frameContractVersion === 'position-reference.v2' && JSON.stringify(ref.allowedProperties) !== '["pose"]') throw new Error('position-v2 mannequin must be pose-only; no framing authority; provider calls: 0');
      const guide = ref.guide;
      if (!guide) throw new Error('framing-only requires explicit measured mannequin guide');
      if (guide.gender !== model.recipient.gender || guide.mode !== model.composition.mode) throw new Error('guide mode/gender mismatch');
      if (ref.sourceHash && ref.sourceHash !== guide.sourceHash || ref.landmark && ref.landmark !== guide.landmarkBinding) throw new Error('guide source/landmark binding mismatch');
      if (['semantic-frame.v2','position-reference.v2'].includes(model.composition.frameContractVersion)) {
        if (measured.sourceHash !== guide.sourceHash || measured.metadataSHA !== guide.metadataSHA || measured.landmarkBinding !== guide.landmarkBinding || ref.allowedProperties?.some(value => !['pose', 'frame'].includes(value))) throw new Error('semantic guide binding mismatch');
        continue;
      }
      if (typeof measured === 'object' && (measured.contractId !== model.composition.cameraContractId || !measured.landmarks.includes(guide.landmarkBinding))) throw new Error('measured guide contract/landmark mismatch');
      if (typeof measured === 'object' && 'targets' in measured && (measured.sourceHash !== guide.sourceHash || measured.metadataSHA !== guide.metadataSHA || measured.landmarkBinding !== guide.landmarkBinding)) throw new Error('numeric measured guide source/metadata/landmark mismatch');
      if (guide.metadataSHA && (typeof measured !== 'object' || !('targets' in measured))) throw new Error('numeric measured guide required for metadata-bound source');
    }
  }
  if (!model.references.some(ref => ref.role === 'drawing-technique-only') || !model.references.some(ref => ref.role === 'framing-only')) throw new Error('drawing technique and measured framing references required');
  return true;
});

export function parse(input) {
  if (!input) throw new Error('input required');
  return deepFreeze(structuredClone(schema.parse(typeof input === 'string' ? strictJSONParse(input) : input)));
}
export const validate = parse;
const genderKey = value => ({ '남': 'male', '남성': 'male', '여': 'female', '여성': 'female' }[value] ?? value ?? 'unknown');

/** Caller supplies actual ordered upload descriptors, original units, and measured composition. No image paths enter the visual model. */
export function projectFromNormalizedToken(token, options) {
  const normalized = neutralRecord(token);
  validateFaceMode(normalized.faceMode, true);
  if (!options || !Array.isArray(options.references) || !options.composition) throw new Error('actual ordered references and measured composition required');
  const appearance = Object.fromEntries(Object.entries(normalized.slots).map(([slot, fields]) => [slot,
    Object.fromEntries(Object.entries(fields).map(([field, trait]) => {
      if (typeof trait.value === 'number') {
        if (typeof trait.unit !== 'string' || !trait.unit.trim()) throw new Error('explicit original numeric unit required: ' + slot + '.' + field);
        return [field, { value: trait.value, unit: trait.unit }];
      }
      return [field, trait.value];
    }))
  ]));
  const references = options.references.map((actual, position) => {
    if (actual.index !== position + 1 || !Hash.safeParse(actual.sha256).success) throw new Error('actual ordered reference index/hash required');
    if (Object.keys(actual).some(key => !['index', 'role', 'sha256', 'allowedProperties', 'priority', 'landmark', 'guide', 'sameOwnerRecipient'].includes(key))) throw new Error('unknown or private reference input');
    const { sha256, ...reference } = actual;
    if (reference.guide && reference.guide.sourceHash !== sha256) throw new Error('actual upload/guide hash mismatch');
    return { ...reference, sourceHash: sha256 };
  });
  const measured = options.composition.measuredFrameGuide;
  const canvas = options.composition.mode === 'portrait' && typeof measured === 'object' && measured !== null && 'targets' in measured ? measured.canvas : [1024, 1536];
  return parse({
    schema: SCHEMA,
    recipient: { gender: genderKey(normalized.identity.gender.value), ageCategory: normalized.identity.ageCategory.value },
    face: normalized.faceMode, appearance, references, composition: options.composition,
    output: { format: 'single-portrait', background: options.background ?? 'transparent', ...(options.background === 'opaque' ? {} : { backgroundInstruction: 'The subject must be fully opaque: alpha 255 in the face, hair, body and clothing core, at 100% layer opacity. Only silhouette edges may use antialiased partial alpha. Background outside the subject must be fully transparent with actual alpha 0. Do not render the subject at alpha 253 or 254 or with overall translucency. No painted checkerboard, solid backdrop, floor or cast shadow.' }), width: canvas[0], height: canvas[1], rgba: true, noBakedText: true, desired: `${canvas[0]}x${canvas[1]}` },
  });
}
export default { SCHEMA, schema, parse, validate, strictJSONParse, projectFromNormalizedToken };
