#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute, basename } from 'node:path';
import { spawn } from 'node:child_process';
import YAML from 'yaml';
import { modularParts, validateWorkstationOutput, authoredWorkstationLookSchema } from './modular-parts.mjs';
import { viewDirection } from './view-direction.mjs';
import { neutralRecord, slotPrompt, slotFields } from '../neutral-slots.mjs';
import { selectFace } from './face-selection.mjs';
import { validateVisualSnapshot } from './image-generate.mjs';

// The included reference workflow never resolves an ambient connection or executable.
// Its own-server adapter has one dispatch and returns a hash-bound PNG or uncertainty.
export function createReferenceTransport({ endpoint, headers = {}, fetchImpl = globalThis.fetch, timeoutMs = 180000 }) {
  const url = new URL(endpoint);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || typeof fetchImpl !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new Error('explicit reference HTTP transport required');
  return async (request, { signal } = {}) => {
    const timeout = AbortSignal.timeout(timeoutMs);
    const response = await fetchImpl(url, {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify(request), redirect: 'error',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) throw new Error(`reference provider HTTP ${response.status}`);
    return response.json();
  };
}

const root = fileURLToPath(new URL('.', import.meta.url));
const traitKeys = ['face', 'hair', 'eyes', 'skin', 'build'];
const outfitKeys = ['headwear', 'upper', 'lower', 'footwear', 'marks'];
const modes = ['portrait', 'full-body', 'turntable'];

// New image-only categories never reuse the legacy head/upper shot labels.
// The caller supplies the already verified authored look, not photo-inferred clothing.
export function emitWorkstationPrompt({ outputSpec, authoredLook, slots }) {
  const spec = validateWorkstationOutput(outputSpec);
  const look = authoredWorkstationLookSchema.parse(authoredLook);
  if (look.category !== spec.category) fail('authored category mismatch');
  const framing = {
    portrait: 'Full head and hair crown, both shoulders and upper chest; locked eye-level viewer-right three-quarter portrait posture.',
    'fullbody-turntable': 'Entire authored character from crown to soles; hands and feet fully visible. Same neutral pose and scale for every frame.',
    torso: 'Clothed torso reference from base of neck through hips, with complete shoulders and authored torso garment. No head or legs.',
    'detached-head': 'Complete isolated head reference with face and hair, ending at the neck base. No torso; no wounds, severing or geometry extraction.',
    'head-without-hair-eyes-teeth': 'Isolated head image ending at neck base. Exclude all hair, rendered eyes and teeth; use smooth feature-omitted reference surfaces, no exposed anatomy or wounds. No torso.',
    hair: 'Complete isolated authored hairstyle and hairline silhouette in one front reference image. No face, body or garment; no additional panels or implied frame directions.',
    'underwear-only-torso': 'Torso from neck base through hips in ONLY the explicitly authored underwear design. No head or legs. Never undress a photograph, infer hidden clothing, or invent an underwear design.',
  }[spec.category];
  const fields = spec.category === 'hair' ? { hair: slots.hair } : ['detached-head', 'head-without-hair-eyes-teeth'].includes(spec.category) ? { face: slots.face, hair: slots.hair, body: slots.body } : ['torso', 'underwear-only-torso'].includes(spec.category) ? { body: slots.body } : slots;
  return [
    'Original image-only character reference PNG. No mesh, rig, topology, geometry extraction, text, labels or watermark.',
    'Identity comes only from the sealed identity reference; selected style reference supplies drawing technique only. Authored fields are independent; never infer unspecified traits.',
    slotPrompt(fields), `Owner-authored look ${look.lookId} (${look.sourceId}): ${look.description}`,
    framing, spec.category === 'fullbody-turntable' ? viewDirection(spec.view) : spec.category === 'portrait' ? '' : 'Single front orthographic reference view.',
    `Feature exclusions override all other appearance fields: ${spec.featureExclusions.join(', ') || 'none'}.`,
    `Exact requested canvas ${spec.width}x${spec.height}. ${spec.background.kind === 'transparent' ? 'RGBA PNG with alpha-zero background and empty transparent margins; no painted background or checkerboard.' : `Opaque solid RGB background ${spec.background.rgb.join(',')}; no scene or shadow.`}`,
    `Common alignment ${JSON.stringify(spec.alignment)}. Keep visible pixels inside crop bounds; anchor is the shared image-space alignment point, not extracted geometry. Preserve authored proportions.`,
  ].join(' ');
}

export async function listOptions(optionsPath = `${root}/options.json`) {
  const data = JSON.parse(await readFile(optionsPath, 'utf8'));
  if (data.schemaVersion !== 1 || !data.categories) fail('invalid options catalog');
  return data.categories;
}

export async function listCharacters() {
  const keys = (await readdir(`${root}/characters`)).filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)).sort();
  return Promise.all(keys.map(async (key) => {
    const { characterId, name, sourceStatus } = JSON.parse(await readFile(`${root}/characters/${key}.json`, 'utf8'));
    return { key, characterId, name, sourceStatus };
  }));
}

export function formatPrompt(result, format = 'json') {
  if (format === 'json') return JSON.stringify(result, null, 2);
  if (format === 'yaml') return YAML.stringify(result);
  fail(`format must be json or yaml: ${format}`);
}

export function publicPrompt(result) {
  const { referencePath, imagePath, generationReferencePath, ...safe } = result;
  if (safe.faceVariant) { const { referenceImagePath, ...variant } = safe.faceVariant; safe.faceVariant = variant; }
  return safe;
}

function fail(message) {
  throw new Error(message);
}

async function emitNeutral({ input, canonicalRoot, mode, stylePath, referencePath, optionsPath, slotOverrides, overrides, part, view, strict, selectedReferenceSha256, requireFaceMode, faceVariantCatalogPath }) {
  if (part !== null && !['head', 'hair', 'body', 'upper', 'lower', 'footwear', 'equipment', ...Object.keys(modularParts)].includes(part)) fail(`unknown part: ${part}`);
  if (mode === 'turntable' && (part !== null || !['front', 'profile', 'side', 'back'].includes(view))) fail('turntable requires --view front|profile|side|back and no part');
  if (mode !== 'turntable' && view !== null) fail('view is only available for turntable');
  overrides = { ...input.generationOverrides, ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value != null)) };
  const choices = {};
  const options = await listOptions(optionsPath);
  for (const [key, value] of Object.entries(overrides)) {
    if (key === 'variantId') continue;
    const choice = options[key]?.find(entry => entry.id === value);
    if (!choice) fail('invalid ' + key + ' option: ' + value);
    choices[key] = choice;
  }
  for (const key of ['mood', 'occupation']) {
    const current = input[key];
    if (!choices[key] && current && !input.personId) {
      choices[key] = options[key]?.find(entry => entry.id === current || entry.label === current);
      if (!choices[key]) fail('invalid ' + key + ' option: ' + current);
    }
  }
  if (['gender', 'ageCategory', 'hair', 'upper'].some(key => overrides[key]) && !overrides.variantId && !input.variantId) fail('identity variant requires --variant-id');
  if (strict && overrides.gender) fail('gender override is unapproved');
  if (strict && Object.keys(overrides).some(key => key !== 'variantId')) fail('identity variant is unapproved');
  const replacements = structuredClone(slotOverrides);
  if (choices.hair) replacements.hair = { ...replacements.hair, description: { value: choices.hair.label, status: 'art-proposal', source: choices.hair.source } };
  if (choices.upper) replacements.outfit = { ...replacements.outfit, upper: { value: choices.upper.label, status: 'art-proposal', source: choices.upper.source } };
  let record = neutralRecord(input, replacements);
  const baseLookId = record.lookId;
  if (input.faceMode && input.identity?.characterId && input.identity.characterId !== input.characterId) fail('face selection permanent identity mismatch');
  for (const key of ['gender', 'ageCategory']) if (choices[key]) record.identity[key] = { value: key === 'gender' ? choices[key].label : choices[key].id, status: 'art-proposal', source: choices[key].source };
  record = await selectFace(record, { required: requireFaceMode, catalogPath: faceVariantCatalogPath, canonicalRoot });
  choices.occupation ??= { label: input.facts?.role ?? input.occupation ?? '' };
  const equipped = record.equipment?.equipped ?? [];
  for (const item of equipped) if (item.status !== 'approved' || !item.id || !item.description || !item.source) fail('equipped item must be approved and sourced');
  if (overrides.variantId && input.variantId && overrides.variantId !== input.variantId) fail('token and CLI variant IDs must match');
  record.lookId = overrides.variantId ?? record.lookId;
  const style = JSON.parse(await readFile(stylePath, 'utf8'));
  const actualHash = createHash('sha256').update(await readFile(referencePath)).digest('hex');
  const expectedHash = selectedReferenceSha256 ?? style.referenceSha256;
  if (style.status !== 'owner-selected-reference' || !/^[a-f0-9]{64}$/.test(expectedHash ?? '') || actualHash !== expectedHash) fail('selected style reference hash mismatch');
  const camera = mode === 'portrait'
    ? 'Locked series camera: eye-level three-quarter medium close-up; identical camera elevation, azimuth, lens perspective, camera-to-subject distance, zoom and image-plane depth for every recipient. Full head, complete hair crown, both shoulders and upper chest visible. Keep the same face-center position, eye-line height, head-to-frame scale, crown background margin and chest-level bottom crop across the series. Do not move the camera, zoom or crop to suit a face, hairstyle, body, clothing or accessory; keep larger hair and ornaments inside the common framing without resizing the head.'
    : 'Locked series camera: eye-level three-quarter full-body view; identical camera elevation, azimuth, lens perspective, camera-to-subject distance, zoom and image-plane depth for every recipient. Entire head, hands and feet visible. Keep the same ground baseline and scene scale; preserve authored height and body proportions rather than stretching every body to the same height. No per-character camera adjustment, zoom or reframing.';
  const pose = "Locked series posture: upright neutral still pose, straight spine, level relaxed shoulders, no lean, head tilt, chin lift or chin tuck. Head, neck, shoulders and torso rotate together by the same fixed slight three-quarter turn toward viewer's right; the nose points toward the right image edge. Never combine a turned head with a frontal torso, turn only the neck, reverse direction, or vary the turn between recipients. Eyes look toward the camera with the same neutral gaze direction. Preserve individual facial and body geometry; no gesture or character-specific action.";
  const partSlot = part === 'head' ? 'face' : part === 'equipment' ? 'accessories' : part;
  const partFields = part === null ? null : part === 'equipment' && equipped.length ? Object.fromEntries(equipped.map(item => [item.id, { value: item.description, status: item.status, source: item.source }])) : ['upper', 'lower', 'footwear'].includes(part) ? { [part]: record.slots.outfit[part] } : record.slots[partSlot];
  if (part !== null && (!partFields || Object.values(partFields).every(trait => trait.value === null))) fail(`part ${part} has no specified value`);
  const missing = Object.entries(record.slots).flatMap(([slot, fields]) => Object.entries(fields).filter(([, trait]) => trait.value === null).map(([key]) => `slots.${slot}.${key}`));
  if (!input.slots) missing.push(...traitKeys.filter(key => input.appearance?.[key]?.value === null).map(key => 'appearance.' + key), ...outfitKeys.filter(key => input.outfit?.[key]?.value === null).map(key => 'outfit.' + key));
  const legacyTraits = [...Object.values(input.appearance ?? {}), ...Object.values(input.outfit ?? {})].filter(value => value && typeof value === 'object' && 'status' in value);
  const incomplete = input.slots ? Object.values(record.slots).some(fields => Object.values(fields).some(trait => trait.value !== null && trait.status !== 'approved')) : legacyTraits.some(trait => trait.value === null || trait.status !== 'approved');
  const poseChanged = part === null && input.pose && input.pose[mode === 'portrait' ? 'portrait' : 'full-body'] !== style.pose?.[mode === 'portrait' ? 'portrait' : 'full-body'];
  if (strict && (record.sourceStatus !== 'approved' || incomplete)) fail('unapproved or incomplete look');
  if (strict && poseChanged) fail('shared pose variant is unapproved');
  const recipientContext = record.canonicalContext || record.birthContext ? {
    characterId: record.characterId, name: record.name, personId: record.personId,
    ...(record.birthContext ? { birthDate: record.birthContext.birthDate, age: record.birthContext.age, ageAsOf: record.birthContext.ageAsOf } : {}),
    excerpts: record.canonicalContext?.background.map(item => item.text) ?? [],
    ...(record.canonicalContext ? { canonicalContext: structuredClone(record.canonicalContext) } : {}),
    ...(record.birthContext ? { birthContext: structuredClone(record.birthContext) } : {}),
  } : null;
  const prompt = [
    recipientContext ? `Recipient context is metadata, not writing to place in the image or a source for appearance inference. Unknown sex and ancestry remain unknown; explicit authored slots take precedence over narrative context.\nserializedRecipientContext=${JSON.stringify(recipientContext)}\n` : '',
    record.faceMode ? 'Face mode: ' + record.faceMode.kind + '; variant ID: ' + (record.faceMode.variantId ?? 'none') + '. Face geometry does not determine personality or role.' : 'Legacy face export: no face mode selected.',
    'Original 2D character illustration. Exactly one person. Authored ethnicity and origin are independent of drawing technique.',
    choices.occupation.label, choices.mood?.label ?? '',
    part === null ? equipped.map(item => item.description).join('; ') : '',
    Object.entries(record.identity).filter(([, trait]) => trait?.value != null).map(([key, trait]) => `identity.${key}: ${trait.value}`).join('; '),
    part === null ? slotPrompt(record.slots) : slotPrompt({ [partSlot]: partFields }), mode === 'turntable' ? viewDirection(view) + '; full shot from top of head to soles of feet' : camera, part === null ? pose : 'isolated recipient-neutral slot reference on plain background',
    part === null && mode !== 'turntable' ? 'SERIES FRAMING IS A HARD SHARED CONDITION, not a suggestion. Reuse the exact common posture and camera setup for every recipient. Do not inherit framing or posture from either reference image. Before finalizing, verify matching shoulder rotation, head rotation, gaze, camera height, perspective, distance, scale and crop; correct any mismatch without changing the authored identity or slots.' : '',
    mode === 'portrait' && part === null ? 'Portrait output is a transparent RGBA PNG. Background pixels must have alpha 0, not a painted background, white fill, checkerboard drawing, floor or cast shadow. Preserve opaque face, body, clothes and accessories with clean antialiased hair and silhouette edges. The common crown margin remains empty transparent space.' : '',
    'Selected reference is drawing TECHNIQUE ONLY: linework, color treatment and shading. Never copy reference identity, face, body, hair, clothes, accessories, camera or pose. The explicit neutral slots and locked camera/pose ALWAYS override conflicting reference details, including direction. Never match reference direction. Fit clothing to the recipient body; clothing does not change body build, bust size, weight or height. Slot descriptions denote shapes, colors, materials and mounting, not donor identity or gender. Do not invent unspecified properties. No text, labels or watermark.',
  ].join(' ');
  return { ...record, mode, part, view, partProperties: partFields === null ? null : Object.values(partFields).filter(trait => trait.value !== null).map(trait => trait.value), baseLookId, outfitId: overrides.upper ? input.outfit?.id + '-' + record.lookId : input.outfit?.id ?? null, choices, styleId: style.styleId, mangaStyle: { id: 'owner-reference', reference: 'technique-only' }, referencePath: resolve(referencePath), referenceSha256: actualHash, approval: Object.keys(overrides).length || Object.keys(slotOverrides).length || poseChanged ? 'art-proposal' : record.sourceStatus, missing, cameraContractId: 'portrait-2d-viewer-right-v1', portraitShotId: mode === 'portrait' ? 'medium-close-up-119' : null, camera: part !== null ? { axis: 'front orthographic' } : mode === 'turntable' ? viewDirection(view) + '; full shot from top of head to soles of feet' : camera, pose: part === null ? pose : null, prompt, editedVariant: Object.keys(slotOverrides).length > 0 || Boolean(input.variantId), provenance: record.sourceRefs, identityReferenceRole: input.references?.identityRole ?? null, expectedIdentitySha256: input.references?.identitySha256 ?? null, technology: '2d-image', pipeline: '2d', outputContract: 'portrait-2d-v2' };
}

export const recordFromWikiToken = token => neutralRecord(token);

export async function validateCanonicalContext(input, canonicalRoot) {
  if (input.canonicalContext != null || input.birthContext != null) {
    // Validate identity and provenance shape before reading the caller's canonical snapshot.
    neutralRecord(input);
    if (!canonicalRoot) fail('authoritative context requires canonicalRoot');
    const canonicalBase = resolve(canonicalRoot);
    const documents = new Map();
    const document = async path => {
      const absolute = resolve(canonicalBase, path);
      const local = relative(canonicalBase, absolute);
      if (local === '..' || local.startsWith('../') || local.startsWith('/')) fail('canonical source outside canonicalRoot');
      if (!documents.has(absolute)) {
        const bytes = await readFile(absolute);
        documents.set(absolute, { value: JSON.parse(bytes), sha256: createHash('sha256').update(bytes).digest('hex') });
      }
      return documents.get(absolute);
    };
    const source = async item => {
      if (isAbsolute(item.path)) fail('canonical source path must be relative to canonicalRoot');
      const doc = await document(item.path);
      if (doc.sha256 !== item.sha256) fail('canonical source hash mismatch');
      let value = doc.value;
      if (item.pointer !== '') for (const token of item.pointer.slice(1).split('/')) {
        if (/~(?:[^01]|$)/.test(token)) fail('invalid canonical pointer');
        const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
        if (value == null || typeof value !== 'object' || !Object.hasOwn(value, key)) fail('unresolved canonical pointer');
        value = value[key];
      }
      return value;
    };
    const registry = (await document('lore/name-pools/person-id-registry.json')).value.persons.find(person => person.id === input.characterId);
    if (!registry || registry.name !== input.name) fail('canonical registry identity mismatch');
    const detail = (await document(`public/person-details/${input.personId}.json`)).value;
    if (detail.id !== input.personId || detail.name !== input.name || detail.familyTree?.personId !== input.characterId || detail.detailRoute !== `/people/${input.personId}`) fail('canonical person route mismatch');
    if (input.canonicalContext) {
      const entry = await source(input.canonicalContext.registry);
      if (entry?.id !== registry.id || entry?.name !== registry.name) fail('canonical registry pointer identity mismatch');
      const text = value => typeof value === 'string' ? value : Array.isArray(value) ? value.map(text).join('') : !value || typeof value !== 'object' ? '' : text(value.ko ?? value.text ?? value.items);
      for (const item of input.canonicalContext.background) if (text(await source(item)) !== item.text) fail('canonical background value mismatch');
    }
    const ledger = (await document('lore/name-pools/cast-birthdays.json')).value;
    const birth = ledger.people.find(person => person.id === input.characterId);
    const date = value => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('invalid canonical date');
      const parsed = new Date(value + 'T00:00:00.000Z');
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail('invalid canonical date');
      return value;
    };
    if (!birth || birth.name !== input.name) fail('canonical birth identity mismatch');
    const born = date(birth.birthDate), asOf = date(ledger.ageAsOf);
    if (born > asOf) fail('canonical birth after reference date');
    const age = Number(asOf.slice(0, 4)) - Number(born.slice(0, 4)) - Number(asOf.slice(5) < born.slice(5));
    if (input.birthContext) {
      const claimed = input.birthContext;
      date(claimed.birthDate); date(claimed.ageAsOf);
      if (claimed.birthDate !== born || claimed.ageAsOf !== asOf || !Number.isInteger(claimed.age) || claimed.age !== age) fail('canonical birth context mismatch');
    }
    if (detail.birthDate !== born || detail.ageAsOf !== asOf || detail.age !== age) fail('canonical person birth mismatch');
  }
}

export async function emit({ character, wikiToken = null, canonicalRoot = null, mode, stylePath = root + '/style-lock.json', referencePath, optionsPath = root + '/options.json', slotOverrides = {}, slotReplacements = {}, selectedReferenceSha256 = null, overrides = {}, mangaStyle = 'owner-reference', part = null, view = null, strict = false, requireFaceMode = false, faceMode = undefined, faceSelection = undefined, faceVariantCatalogPath = process.env.PORTRAIT_FACE_CATALOG ?? null }) {
  if (!modes.includes(mode)) fail('mode must be portrait, full-body or turntable');
  if (Boolean(character) === Boolean(wikiToken)) fail('provide exactly one character or wiki token');
  if (mangaStyle !== 'owner-reference') fail('only the selected owner reference is supported');
  const input = wikiToken ? JSON.parse(await readFile(wikiToken, 'utf8')) : typeof character === 'string' ? JSON.parse(await readFile(character, 'utf8')) : character;
  await validateCanonicalContext(input, canonicalRoot);
  return emitNeutral({ input: { ...input, ...(faceMode !== undefined ? { faceMode } : {}), ...(faceSelection !== undefined ? { faceSelection } : {}) }, canonicalRoot, mode, stylePath, referencePath, optionsPath, slotOverrides: { ...slotReplacements, ...slotOverrides }, overrides, part, view, strict, selectedReferenceSha256, requireFaceMode, faceVariantCatalogPath });
}

export function generationRequest(result, { output, generator, connectionConfig, javascriptExecutable = process.execPath, imageReference = null, identityReference = null }) {
  if (identityReference || imageReference) fail('identity and continuity images are authoring-only; provide extracted authored slots');
  if (result.faceMode?.kind === 'template') {
    if (identityReference && identityReference !== result.faceVariant?.referenceImagePath) fail('template identity reference must be selected face variant');
    identityReference = result.faceVariant?.referenceImagePath ?? null;
  }
  const source = result.faceMode?.kind === 'template' ? result.referencePath : imageReference ?? result.referencePath;
  const identity = result.faceMode?.kind === 'template' ? identityReference : identityReference ?? imageReference;
  if (result.identityReferenceRole?.startsWith('owner-') && !identityReference) fail('explicit owner photo reference required');
  const useSeparateReferences = Boolean(identity);
  if (typeof javascriptExecutable !== 'string' || !isAbsolute(javascriptExecutable) || !['node', 'node.exe', 'bun', 'bun.exe'].includes(basename(javascriptExecutable).toLowerCase())) fail('explicit absolute Node or Bun executable required');
  const command = javascriptExecutable;
  const context = imageReference && imageReference !== identity ? ['--image', imageReference] : [];
  let framing = result.part === null
    ? `Exactly one person, one ${result.view ?? result.mode} view only. ${viewDirection(result.view)} No comparison sheet, duplicate figure, inset or multi-view layout. Preserve authored outfit details on their anatomically correct surfaces from the original identity image. ${result.mode !== 'portrait' ? 'Head to shoes must be visible.' : 'Frame only full head, shoulders and upper chest.'}`
    : 'Produce a complete slot reference sheet for common-body fitting. Use original identity for proportions and authored design. Solid light background. Do not depict severed limbs, cut faces or connector geometry.';
  if (result.editedVariant) framing = framing.replace('Preserve authored outfit details on their anatomically correct surfaces from the original identity image.', 'Use edited token outfit details on their anatomically correct surfaces.');
  const identityInstruction = result.part === null
    ? 'preserve face, hair and costume as authored'
    : `${modularParts[result.part]?.view ?? result.part}. Preserve the complete authored slot design and common-body fit; no severed-body or cut-surface instructions.`;
  const referencePriority = result.editedVariant
    ? 'The edited token is authoritative for every specified property, including gender, age, hair and garments. Override conflicting details in all reference images. Preserve reference identity details only where the token leaves them unchanged.'
    : identityInstruction;
  const photoInstruction = result.identityReferenceRole === 'owner-face-and-hair-only'
    ? 'Image 2 is a personal photograph for facial proportions and hairstyle ONLY. Preserve its facial likeness. Do not copy its clothing, pose, camera framing or background; use the authored outfit and shared camera contract instead.'
    : '';
  const argv = useSeparateReferences
    ? [`${root}/cliproxy-edit.mjs`, '--image', result.referencePath, '--image', identity, ...context, '--aspect-ratio', result.part === null ? '3:4' : '1:1', '--prompt', `Image 1 is STYLE ONLY. Image 2 is ORIGINAL CHARACTER IDENTITY: ${referencePriority}. ${photoInstruction} ${context.length ? 'Image 3 is a generated continuity reference; it must not override the authored token.' : ''} Never copy image 1 identity. No writing or labels within image. ${framing} ${result.prompt}`, '-o', output]
    : [`${root}/cliproxy-edit.mjs`, '--image', source, '--aspect-ratio', result.part === null ? '3:4' : '1:1', '--prompt', result.prompt, '-o', output];
  argv[argv.indexOf('--prompt') + 1] += ' Explicit slots and recipient body override every reference; reference technique ONLY never determines camera or pose direction.';
  if (result.faceMode?.kind === 'template') {
    argv[argv.indexOf('--prompt') + 1] = (identity ? 'Image 1 is STYLE TECHNIQUE ONLY. Image 2 is FACE BASE ONLY: use its facial geometry, never donor gender, skin tone, body, hair, outfit, accessories, age, personality, role, camera or pose. ' : 'Use the selected sourced face traits only; no generated face reference exists. ') + (context.length ? 'Image 3 is continuity for authored non-face slots only. ' : '') + 'Authored recipient skin tone applies independently to the face. ' + result.prompt;
    if (identity) argv.push('--expected-identity-sha256', result.faceVariant.referenceImageSha256, '--identity-role', 'face-base-only');
  }
  if (result.faceMode?.kind === 'unique') argv[argv.indexOf('--prompt') + 1] = 'Unique individual face: use individual authored face slots and any personal identity reference for facial identity only. Never use a catalog variant or copy reference gender, body, hair, outfit, skin tone, camera or pose. ' + result.prompt;
  argv[0] = `${root}/image-generate.mjs`;
  if (connectionConfig !== undefined) argv.push('--connection-config', connectionConfig);
  argv.push('--expected-style-sha256', result.referenceSha256);
  if (result.identityReferenceRole?.startsWith('owner-')) {
    if (!/^[a-f0-9]{64}$/.test(result.expectedIdentitySha256 ?? '')) fail('owner photo hash contract required');
    argv.push('--expected-identity-sha256', result.expectedIdentitySha256);
  }
  return { command, argv, source, identity, useSeparateReferences,
    ...(result.canonicalContext ? { canonicalContext: structuredClone(result.canonicalContext) } : {}),
    ...(result.birthContext ? { birthContext: structuredClone(result.birthContext) } : {}),
  };
}

export async function generate(input, { output, generator, connectionConfig, javascriptExecutable = process.execPath, imageReference = null, identityReference = null }) {
  if (identityReference || imageReference) fail('identity and continuity images are authoring-only; provide extracted authored slots');
  const result = await emit({ ...input, requireFaceMode: true });
  if (result.part === null && (result.missing.includes('appearance.face') || result.missing.includes('appearance.hair') || result.missing.includes('outfit.upper') || (['full-body', 'turntable'].includes(result.mode) && (result.missing.includes('outfit.lower') || result.missing.includes('outfit.footwear'))))) fail(`cannot generate essential missing look: ${result.missing.join(', ')}`);
  if (result.part === null && (result.slots.face.description.value === null || result.slots.hair.description.value === null || result.slots.outfit.upper.value === null || (result.mode !== 'portrait' && (result.slots.outfit.lower.value === null || result.slots.outfit.footwear.value === null)))) fail('cannot generate essential missing look');
  if (!output?.endsWith('.png')) fail('output must be a new PNG path');
  try { await stat(output); fail(`output already exists: ${output}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const { command, argv, source, identity, useSeparateReferences } = generationRequest(result, { output, generator, connectionConfig, javascriptExecutable, imageReference, identityReference });
  await new Promise((done, reject) => {
    const child = spawn(command, argv, { env: { ...process.env, ASSET_GEN_ALLOW_PAID: '0' } });
    let detail = '';
    child.stderr.on('data', (chunk) => { detail = `${detail}${chunk}`.slice(-2000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? done() : reject(new Error(`image generation failed: ${detail}`)));
  });
  const bytes = await readFile(output);
  if (bytes.subarray(0, 8).compare(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) !== 0) fail(`generator did not produce PNG: ${output}`);
  const actualRequest = JSON.parse(await readFile(`${output}.request.json`, 'utf8'));
  if ((result.canonicalContext || result.birthContext) && !actualRequest.visualSnapshot) fail('provider visualSnapshot required for sourced candidate');
  if (actualRequest.visualSnapshot && actualRequest.sourceSnapshot.prompt !== argv[argv.indexOf('--prompt') + 1]) fail('provider original prompt mismatch');
  validateVisualSnapshot(actualRequest);
  if (actualRequest.references[0].sha256 !== result.referenceSha256) fail('B reference hash mismatch in generation request');
  if (result.faceVariant?.referenceImageSha256 && actualRequest.references[1]?.sha256 !== result.faceVariant.referenceImageSha256) fail('face variant hash mismatch in generation request');
  const sourceIndex = result.faceMode?.kind === 'template' ? 0 : imageReference ? (identity === imageReference ? 1 : 2) : 0;
  const receipt = { ...result, prompt: actualRequest.prompt, imagePath: resolve(output), imageSha256: createHash('sha256').update(bytes).digest('hex'), generationReferencePath: resolve(source), generationReferenceSha256: actualRequest.references[sourceIndex].sha256, identityReferenceSha256: identity ? actualRequest.references[1].sha256 : null, generator: `image-generate.mjs ${actualRequest.model}`, imageReviewStatus: 'candidate-unreviewed' };
  if (actualRequest.visualSnapshot) {
    receipt.sourceSnapshot = actualRequest.sourceSnapshot;
    receipt.visualSnapshot = actualRequest.visualSnapshot;
  }
  await writeFile(`${output}.json`, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && basename(fileURLToPath(import.meta.url)) === 'emit-character-prompt.mjs' && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (flag) => { const at = args.indexOf(flag); return at < 0 ? null : args[at + 1]; };
  try {
    if (args.includes('--list-options')) { console.log(JSON.stringify(await listOptions(option('--options') ?? `${root}/options.json`), null, 2)); process.exit(0); }
    if (args.includes('--list-characters')) { console.log(JSON.stringify(await listCharacters(), null, 2)); process.exit(0); }
    if ((!option('--character') && !option('--wiki-token')) || !option('--mode') || !option('--reference')) fail('usage: --character <json> | --wiki-token <json> --mode portrait|full-body|turntable --reference <B.png> [--part head|hair|upper|lower|footwear|equipment] [--strict]');
    const input = { requireFaceMode: args.includes('--new-sheet'), faceVariantCatalogPath: option('--face-catalog') ?? process.env.PORTRAIT_FACE_CATALOG ?? null, faceMode: option('--face-mode') ? { kind: option('--face-mode'), variantId: option('--face-variant-id') } : undefined, faceSelection: option('--face-selection') ? JSON.parse(await readFile(option('--face-selection'), 'utf8')) : undefined, character: option('--character'), wikiToken: option('--wiki-token'), mode: option('--mode'), part: option('--part'), view: option('--view'), mangaStyle: option('--manga-style') ?? 'owner-reference', selectedReferenceSha256: option('--reference-sha256'), slotOverrides: option('--slot-overrides') ? JSON.parse(await readFile(option('--slot-overrides'), 'utf8')) : {}, slotReplacements: option('--replace-slots') ? JSON.parse(await readFile(option('--replace-slots'), 'utf8')) : {}, referencePath: option('--reference'), stylePath: option('--style') ?? `${root}/style-lock.json`, optionsPath: option('--options') ?? `${root}/options.json`, overrides: { gender: option('--gender'), ageCategory: option('--age-category'), mood: option('--mood'), occupation: option('--occupation'), hair: option('--hair'), upper: option('--upper'), variantId: option('--variant-id') }, strict: args.includes('--strict') };
    input.canonicalRoot = option('--canonical-root');
    input.optionsPath = option('--options') ?? `${root}/options.json`;
    const result = option('--output') ? await generate(input, { output: option('--output'), identityReference: option('--identity-reference'), generator: option('--generator') ?? `${process.env.HOME}/.agents/skills/asset-gen/tools/asset_gen.py` }) : await emit(input);
    console.log(formatPrompt(result, option('--format') ?? 'json'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
