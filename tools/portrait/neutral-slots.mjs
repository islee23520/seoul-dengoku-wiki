import Ajv2020 from 'ajv/dist/2020.js';
import schema from './2d/character.schema.json' with { type: 'json' };
import faceSchema from './2d/face-selection.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ strict: false });
ajv.addSchema({ ...schema, $id: new URL('character.schema.json', faceSchema.$id).href });
ajv.addSchema({ ...faceSchema, $id: new URL('face-selection.schema.json', schema.$id).href });
const validateSchema = ajv.compile(schema);

export const slotFields = {
  face: ['description', 'faceShape', 'eyeColor', 'eyeShape', 'eyebrowShape', 'lipColor', 'mouthShape', 'noseShape', 'beardShape'],
  hair: ['description', 'shape', 'color', 'length'],
  body: ['build', 'weight', 'bustSize', 'height', 'skin'],
  outfit: ['headwear', 'upper', 'lower', 'footwear', 'marks', 'neckline'],
  accessories: ['description', 'shape', 'color', 'material', 'mounting'],
};

export function sourcedTrait(input, source) {
  const trait = input && typeof input === 'object' ? structuredClone(input) : { value: input ?? null, status: input == null ? 'unknown' : 'art-proposal', source: input == null ? null : source };
  if (Array.isArray(trait) || Object.keys(trait).some(key => !['value', 'status', 'source', 'unit', 'derived'].includes(key))) throw new Error('invalid sourced trait');
  if (!['approved', 'authored-draft', 'art-proposal', 'derived-proposal', 'unknown'].includes(trait.status) || !Object.hasOwn(trait, 'value') || !Object.hasOwn(trait, 'source')) throw new Error('invalid sourced trait');
  if (trait.status === 'unknown' && (trait.value !== null && trait.value !== 'unconfirmed' || trait.source !== null)) throw new Error('unknown value must be null or unconfirmed with null source');
  if (trait.status === 'derived-proposal' ? trait.derived !== true : trait.derived !== undefined && trait.derived !== false) throw new Error('invalid derived provenance');
  if (trait.status !== 'unknown' && trait.value === null) throw new Error('sourced value required');
  if (typeof trait.value === 'number' && !Number.isFinite(trait.value)) throw new Error('finite value required');
  if (typeof trait.value === 'string' && !trait.value.trim()) throw new Error('sourced value required');
  if (trait.source !== null && typeof trait.source !== 'string') throw new Error('sourced trait source must be string or null');
  if (trait.status !== 'unknown' && (typeof trait.source !== 'string' || !trait.source.trim() || (typeof trait.value !== 'string' && typeof trait.value !== 'number'))) throw new Error('sourced value required');
  return trait;
}

export function neutralRecord(input, slotOverrides = {}) {
  const candidate = structuredClone(input);
  for (const [slot, values] of Object.entries(slotOverrides)) {
    if (!slotFields[slot] || !values || typeof values !== 'object' || Array.isArray(values)) throw new Error(`unknown slot ${slot}`);
    for (const key of Object.keys(values)) if (!slotFields[slot].includes(key)) throw new Error(`unknown slot field ${slot}.${key}`);
    candidate.slots ??= {};
    candidate.slots[slot] = { ...candidate.slots[slot], ...values };
  }
  if (!validateSchema(candidate)) throw new Error('character schema: ' + validateSchema.errors.map(error => error.instancePath + ' ' + error.message).join('; '));
  const source = input.personId ? `portrait-tokens/${input.personId}.json` : input.sourceRefs?.[0];
  const proposal = input.artProposal ?? {};
  if (input.schemaVersion !== 1 && input.schemaVersion !== 2) throw new Error('unsupported character schema version');
  const supplied = input.slots ?? proposal.slots ?? {};
  for (const key of Object.keys(supplied)) if (!slotFields[key]) throw new Error('unknown slot ' + key);
  const appearance = input.appearance ?? {};
  for (const key of Object.keys(appearance)) if (!['ageCategory', 'gender', 'face', 'hair', 'eyes', 'skin', 'build'].includes(key)) throw new Error('character schema: unknown appearance field ' + key);
  const outfit = input.outfit ?? {};
  const flat = { ...proposal, ...appearance };
  const legacy = {
    face: { description: flat.face, eyeColor: flat.eyeColor ?? flat.eyes },
    hair: { description: flat.hair, shape: flat.hairShape, color: flat.hairColor },
    body: { build: flat.build, weight: flat.weight, bustSize: flat.bustSize, height: flat.height, skin: flat.skin },
    outfit: Object.fromEntries(slotFields.outfit.map(key => [key, proposal[key] ?? outfit[key]])),
    accessories: { description: Array.isArray(proposal.accessories) && proposal.accessories.length === 0 ? null : proposal.accessories ?? appearance.accessories },
  };
  for (const key of slotFields.face.slice(1)) legacy.face[key] ??= flat[key];
  const slots = {};
  for (const [slot, keys] of Object.entries(slotFields)) {
    const values = supplied[slot] ?? legacy[slot];
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error(`invalid slot ${slot}`);
    for (const key of Object.keys(values)) if (!keys.includes(key)) throw new Error(`unknown slot field ${slot}.${key}`);
    slots[slot] = Object.fromEntries(keys.map(key => [key, sourcedTrait(values[key], source)]));
  }
  for (const [slot, values] of Object.entries(slotOverrides)) {
    if (!slotFields[slot] || !values || typeof values !== 'object' || Array.isArray(values)) throw new Error(`unknown slot ${slot}`);
    for (const [key, value] of Object.entries(values)) {
      if (!slotFields[slot].includes(key)) throw new Error(`unknown slot field ${slot}.${key}`);
      slots[slot][key] = sourcedTrait(value, source);
    }
  }
  for (const key of ['weight', 'height']) {
    const trait = slots.body[key];
    if (trait.value !== null && !(typeof trait.value === 'number' && Number.isFinite(trait.value) && typeof trait.unit === 'string' && trait.unit.trim()) && !(typeof trait.value === 'string' && trait.value.trim() && trait.unit === null)) throw new Error(`body.${key} requires a numeric value and unit or qualitative value and null unit`);
  }
  const identity = { characterId: input.characterId, name: input.name, ethnicity: proposal.ethnicity ?? input.facts?.ethnicity, origin: proposal.origin ?? input.facts?.origin, gender: input.facts?.gender ?? appearance.gender, ageCategory: input.facts?.ageCategory ?? appearance.ageCategory, ...input.identity };
  if (!identity.characterId || !identity.name) throw new Error('character identity required');
  const context = input.canonicalContext;
  if (context != null) {
    for (const key of ['characterId', 'name', 'personId']) {
      if (typeof context[key] !== 'string' || !context[key].trim() || context[key] !== input[key] || (input.identity?.[key] !== undefined && context[key] !== input.identity[key])) throw new Error(`canonical context ${key} mismatch`);
    }
    const validSource = item => item && typeof item.path === 'string' && item.path.trim() && typeof item.pointer === 'string' && (item.pointer === '' || item.pointer.startsWith('/')) && /^[a-f0-9]{64}$/.test(item.sha256 ?? '');
    if (!validSource(context.registry) || !Array.isArray(context.background) || context.background.some(item => !validSource(item) || typeof item.text !== 'string')) throw new Error('invalid canonical context provenance');
  }
  if (input.faceMode && identity.characterId !== input.characterId) throw new Error('face selection permanent identity mismatch');
  const metadata = {
    ...(input.generationContract != null ? { generationContract: structuredClone(input.generationContract) } : {}),
    ...(input.artProposal != null ? { artProposal: structuredClone(input.artProposal) } : {}),
    ...(context != null ? { canonicalContext: structuredClone(context) } : {}),
    ...(input.birthContext != null ? { birthContext: structuredClone(input.birthContext) } : {}),
  };
  const uniqueFaceSource = input.uniqueFaceSource ?? null;
  const sourceRefs = input.sourceRefs ?? (source ? [source] : []);
  return { ...metadata, uniqueFaceSource, faceMode: input.faceMode ?? null, faceSelection: input.faceSelection ?? null, uniqueFaceRequired: input.uniqueFaceRequired ?? false, schemaVersion: 2, characterId: identity.characterId, name: identity.name, personId: input.personId ?? null, sourceStatus: input.sourceStatus ?? input.approval ?? 'art-proposal', ...(sourceRefs.length ? { sourceRefs } : {}), lookId: input.variantId ?? input.lookId ?? `${identity.characterId}-portrait-study`, identity: { ...(identity.age !== undefined ? { age: identity.age } : {}), ...(identity.ageAsOf !== undefined ? { ageAsOf: identity.ageAsOf } : {}), characterId: identity.characterId, name: identity.name, ethnicity: sourcedTrait(identity.ethnicity, source), origin: sourcedTrait(identity.origin, source), gender: sourcedTrait(identity.gender, source), ageCategory: sourcedTrait(identity.ageCategory, source) }, slots, ...(input.equipment ? { equipment: structuredClone(input.equipment) } : {}) };
}

export function slotPrompt(slots) {
  return Object.entries(slots).flatMap(([slot, fields]) => Object.entries(fields).flatMap(([key, trait]) => trait.value === null || trait.status === 'unknown' ? [] : [`${slot}.${key}: ${trait.value}${trait.unit ? ` ${trait.unit}` : ''}`])).join('; ');
}
