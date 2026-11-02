export const slotFields = {
  face: ['description', 'faceShape', 'eyeColor', 'eyeShape', 'eyebrowShape', 'lipColor', 'mouthShape', 'noseShape', 'beardShape'],
  hair: ['description', 'shape', 'color', 'length'],
  body: ['build', 'weight', 'bustSize', 'height', 'skin'],
  outfit: ['headwear', 'upper', 'lower', 'footwear', 'marks', 'neckline'],
  accessories: ['description', 'shape', 'color', 'material', 'mounting'],
};

export function sourcedTrait(input, source) {
  const trait = input && typeof input === 'object' ? structuredClone(input) : { value: input ?? null, status: input == null ? 'unknown' : 'art-proposal', source: input == null ? null : source };
  if (Array.isArray(trait) || Object.keys(trait).some(key => !['value', 'status', 'source', 'unit'].includes(key))) throw new Error('invalid sourced trait');
  if (!['approved', 'authored-draft', 'art-proposal', 'unknown'].includes(trait.status) || !Object.hasOwn(trait, 'value') || !Object.hasOwn(trait, 'source')) throw new Error('invalid sourced trait');
  if (trait.status === 'unknown' && trait.value !== null) throw new Error('unknown value must be null');
  if (trait.status !== 'unknown' && trait.value === null) throw new Error('sourced value required');
  if (typeof trait.value === 'number' && !Number.isFinite(trait.value)) throw new Error('finite value required');
  if (trait.value !== null && (!trait.source || (typeof trait.value !== 'string' && typeof trait.value !== 'number'))) throw new Error('sourced value required');
  return trait;
}

export function neutralRecord(input, slotOverrides = {}) {
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
    if (trait.value !== null && (typeof trait.value !== 'number' || !Number.isFinite(trait.value) || typeof trait.unit !== 'string' || !trait.unit.trim())) throw new Error(`body.${key} requires a numeric value and unit`);
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
    ...(context != null ? { canonicalContext: structuredClone(context) } : {}),
    ...(input.birthContext != null ? { birthContext: structuredClone(input.birthContext) } : {}),
  };
  const uniqueFaceSource = input.uniqueFaceSource ?? null;
  return { ...metadata, uniqueFaceSource, faceMode: input.faceMode ?? null, faceSelection: input.faceSelection ?? null, uniqueFaceRequired: input.uniqueFaceRequired ?? false, schemaVersion: 2, characterId: identity.characterId, name: identity.name, personId: input.personId ?? null, sourceStatus: input.sourceStatus ?? input.approval ?? 'art-proposal', sourceRefs: input.sourceRefs ?? (source ? [source] : []), lookId: input.variantId ?? input.lookId ?? `${identity.characterId}-portrait-study`, identity: { characterId: identity.characterId, name: identity.name, ethnicity: sourcedTrait(identity.ethnicity, source), origin: sourcedTrait(identity.origin, source), gender: sourcedTrait(identity.gender, source), ageCategory: sourcedTrait(identity.ageCategory, source) }, slots };
}

export function slotPrompt(slots) {
  return Object.entries(slots).flatMap(([slot, fields]) => Object.entries(fields).flatMap(([key, trait]) => trait.value === null ? [] : [`${slot}.${key}: ${trait.value}${trait.unit ? ` ${trait.unit}` : ''}`])).join('; ');
}
