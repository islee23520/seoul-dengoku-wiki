import { createHash } from 'node:crypto';
import { parse } from './2d/design-prompt.mjs';
import { proportionInstruction } from './proportion-profile.mjs';

export function prepareCompactPrompt(input) {
  const model = parse(input);
  if (model.composition.frameContractVersion !== 'position-reference.v2' || !model.completeSource?.readableProjection) throw new Error('compact preparation requires validated whole-canvas positional input');
  if (model.garmentEdit || model.modification) throw new Error('masked modification is not supported by compact preparation');
  const rendering = {
    canvas: { width: model.output.width, height: model.output.height, coordinates: 'pixels-top-left-x-right-y-down' },
    recipient: model.recipient,
    face: model.face,
    appearance: model.appearance,
    ...(model.proportionProfile ? { proportionProfile: model.proportionProfile } : {}),
    uploads: model.references.map(({ index, role, allowedProperties, sameOwnerRecipient }) => ({ index, role, allowedProperties: allowedProperties ?? [], ...(sameOwnerRecipient ? { sameOwnerRecipient } : {}) })),
    composition: { coordinatedHeadTorso: model.composition.coordinatedHeadTorso, viewerRight: model.composition.viewerRight, gazeCamera: model.composition.gazeCamera, fullHeadShoulderConstraints: model.composition.fullHeadShoulderConstraints, positions: Object.fromEntries(Object.entries(model.composition.positionMetrics).map(([metric, value]) => [metric, { inner: value.inner, outerObservation: value.outer }])), referencePrecedence: model.composition.referencePrecedence },
    boundary: model.completeSource.boundaryPolicy.boundary,
    bottomContact: model.completeSource.boundaryPolicy.bottomContact,
    clothing: Object.fromEntries(Object.entries(model.completeSource.clothingPolicy).filter(([key]) => key !== 'schema').map(([key, field]) => [key, field.value])),
    output: { format: model.output.format, background: model.output.background, backgroundInstruction: model.output.backgroundInstruction ?? null, rgba: model.output.rgba, noBakedText: model.output.noBakedText },
  };
  const text = [
    `Create one complete ${rendering.canvas.width}x${rendering.canvas.height} portrait. Coordinates are source pixels: origin top-left, x right, y down.`,
    ...rendering.uploads.map(upload => `Image ${upload.index}: ${upload.role}; permitted contribution: ${upload.allowedProperties.join(', ') || upload.role}. Authored recipient appearance overrides donor appearance.`),
    `Recipient: ${JSON.stringify(rendering.recipient)}. Face mode: ${JSON.stringify(rendering.face)}.`,
    ...(model.proportionProfile ? [proportionInstruction(model.proportionProfile), 'Approved positional intervals below remain authoritative; a proportion profile does not widen them or waive natural silhouette containment.'] : []),
    ...Object.entries(rendering.appearance).flatMap(([slot, fields]) => Object.entries(fields).map(([field, value]) => `${slot}.${field}: ${JSON.stringify(value)}.`)),
    `Head and torso turn together toward viewer right; gaze toward camera; full head and shoulders contained. ${rendering.composition.referencePrecedence}`,
    ...Object.entries(rendering.composition.positions).map(([metric, bands]) => `${metric}: inner ${bands.inner.join(' to ')} px; outer observation ${bands.outerObservation.join(' to ')} px. Outer observations do not widen acceptance.`),
    `Boundary: ${JSON.stringify(rendering.boundary)}. Both shoulders and sleeves must finish naturally inside the sides, with no missing side material, stretching or tiles. Connected torso garment contacts bottom row ${rendering.bottomContact.row}.`,
    `Clothing policy values: ${JSON.stringify(rendering.clothing)}. Unknowns remain unknown; do not infer exposure or winter clothing from rank or occupation. Preserve authored religious identity and occupation construction. No real military insignia, company logos or invented country uniforms.`,
    `Output: ${JSON.stringify(rendering.output)}. This generates a new whole canvas; do not claim exact outside-pixel preservation or owner approval.`,
  ].join('\r\n');
  const sourceJSON = JSON.stringify(model);
  const sha = value => createHash('sha256').update(value).digest('hex');
  return { schema: 'portrait-compact-preparation.v1', sourceSHA: sha(sourceJSON), renderingSHA: sha(JSON.stringify(rendering)), textSHA: sha(text), text, rendering, originalDesign: model, referenceHashes: model.references.map(reference => reference.sourceHash), providerCalls: 0, dispatched: false };
}
