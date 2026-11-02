import { z } from 'zod';
import { createHash } from 'node:crypto';

// Slot reference sheets follow avatar-gen fitting, not severed-body geometry.
export const modularParts = {
  head: { source: 'head', view: 'character face reference in the fixed head framing; preserve facial proportions for the existing common body' },
  hair: { source: 'hair', view: 'complete hairstyle reference, including front, side and back silhouette; keep the common head shape and hairline; no cropped plate fragments' },
  upper: { source: 'upper', view: 'complete authored upper garment fitted to the common body pose, including sleeves, collar and back; preserve its actual cut and any authored asymmetry' },
  lower: { source: 'lower', view: 'complete authored lower garment fitted to the common body pose; preserve its actual garment type, cut, hem and any authored asymmetry; do not substitute trousers for a skirt' },
  footwear: { source: 'footwear', view: 'complete pair of the authored shoes or boots, consistent scale and orientation for fitting to the common body' },
};

// Public reference kinds are separate from the legacy ten-image authoring chain.
export const referenceShots = Object.freeze([
  ...['front', 'profile', 'side', 'back'].map(id => Object.freeze({ id, mode: 'turntable', view: id, part: null })),
  ...Object.keys(modularParts).map(id => Object.freeze({ id, mode: 'full-body', view: null, part: id })),
]);

// V2 is deliberately separate: historical shot IDs and bytes retain v1 meaning.
export const workstationKinds = Object.freeze([
  'portrait', 'fullbody-turntable', 'torso', 'detached-head',
  'head-without-hair-eyes-teeth', 'hair', 'underwear-only-torso',
]);
export const workstationViews = Object.freeze(['front', 'profile', 'side', 'back']);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const pixel = z.number().int().nonnegative();
const point = z.tuple([pixel, pixel]);
const bounds = z.tuple([pixel, pixel, pixel, pixel]); // left, top, right-exclusive, bottom-exclusive
export const workstationHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const workstationBytesHash = value => createHash('sha256').update(value).digest('hex');

function immutable(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(immutable); Object.freeze(value); }
  return value;
}

const outputSchema = z.object({
  schemaVersion: z.literal(2), category: z.enum(workstationKinds),
  variant: z.enum(['complete', 'exclude-hair-eyes-teeth', 'authored-underwear']),
  view: z.enum(['viewer-right', ...workstationViews]), frameOrder: pixel,
  format: z.literal('png'), width: z.number().int().positive().max(4096), height: z.number().int().positive().max(4096),
  background: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('transparent'), alpha: z.literal('zero-background') }).strict(),
    z.object({ kind: z.literal('solid'), alpha: z.literal('opaque'), rgb: z.tuple([pixel.max(255), pixel.max(255), pixel.max(255)]) }).strict(),
  ]),
  alignment: z.object({ canvasId: id, coordinates: z.literal('pixels-top-left-x-right-y-down'), anchor: point, crop: bounds }).strict(),
  featureExclusions: z.array(z.enum(['hair', 'eyes', 'teeth'])),
}).strict().superRefine((spec, ctx) => {
  const expectedVariant = spec.category === 'head-without-hair-eyes-teeth' ? 'exclude-hair-eyes-teeth' : spec.category === 'underwear-only-torso' ? 'authored-underwear' : 'complete';
  const expectedExclusions = spec.category === 'head-without-hair-eyes-teeth' ? ['hair', 'eyes', 'teeth'] : [];
  const turntable = spec.category === 'fullbody-turntable';
  if (spec.variant !== expectedVariant || JSON.stringify(spec.featureExclusions) !== JSON.stringify(expectedExclusions) || spec.view !== (turntable ? workstationViews[spec.frameOrder] : spec.category === 'portrait' ? 'viewer-right' : 'front') || (!turntable && spec.frameOrder !== 0)) ctx.addIssue({ code: 'custom', message: 'category variant/view/frame/exclusion mismatch' });
  const [left, top, right, bottom] = spec.alignment.crop;
  const [x, y] = spec.alignment.anchor;
  if (left >= right || top >= bottom || right > spec.width || bottom > spec.height || x < left || x >= right || y < top || y >= bottom) ctx.addIssue({ code: 'custom', message: 'invalid crop or anchor' });
  if (['portrait', 'detached-head', 'head-without-hair-eyes-teeth', 'hair'].includes(spec.category) && spec.background.kind !== 'transparent') ctx.addIssue({ code: 'custom', message: 'category requires transparent alignment' });
});

export function validateWorkstationOutput(value) { return immutable(outputSchema.parse(value)); }

export const authoredWorkstationLookSchema = z.object({
  schemaVersion: z.literal(2), sourceId: id, lookId: id, personId: z.string().regex(/^person-\d+$/), characterId: id,
  category: z.enum(workstationKinds), status: z.literal('owner-authored'),
  description: z.string().trim().min(1).max(16000),
}).strict();

// Absence retains the original token.lookId equality contract. Version 2 binds
// an independently authored document to the registered original and owner.
export const workstationSourceBindingSchema = z.object({
  schemaVersion: z.literal(2), ownerId: z.string().regex(/^[0-9]+$/), characterId: id,
  originalHashes: z.object({ detail: sha256, token: sha256, image: sha256 }).strict(),
  identityPngSHA: sha256,
}).strict();

export const workstationRequestSchema = z.object({
  schemaVersion: z.literal(2), requestId: z.uuid(), connectionId: z.uuid(), personId: z.string().regex(/^person-\d+$/),
  providerModel: z.literal('gpt-image-2.5-sunburst'), identityResultId: z.uuid(), styleReferenceSha256: sha256,
  faceMode: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('unique'), variantId: z.null() }).strict(),
    z.object({ kind: z.literal('template'), variantId: id }).strict(),
  ]),
  authoredLook: z.object({ sourceId: id, lookId: id, sha256 }).strict(),
  sourceBinding: workstationSourceBindingSchema.optional(),
  frames: z.array(z.object({ outputSpec: outputSchema, outputSpecSha256: sha256 }).strict()).min(1).max(4),
}).strict().superRefine((request, ctx) => {
  const specs = request.frames.map(frame => frame.outputSpec);
  const first = specs[0];
  if (!first) return;
  if (request.frames.some(frame => workstationHash(frame.outputSpec) !== frame.outputSpecSha256)) ctx.addIssue({ code: 'custom', message: 'output spec hash mismatch' });
  const turntable = first.category === 'fullbody-turntable';
  if (specs.length !== (turntable ? 4 : 1) || specs.some((spec, index) => spec.category !== first.category || spec.frameOrder !== index || spec.width !== first.width || spec.height !== first.height || JSON.stringify(spec.background) !== JSON.stringify(first.background) || JSON.stringify(spec.alignment) !== JSON.stringify(first.alignment))) ctx.addIssue({ code: 'custom', message: 'incomplete or inconsistent ordered workstation frames' });
});

export function validateWorkstationRequest(value) { return immutable(workstationRequestSchema.parse(value)); }
