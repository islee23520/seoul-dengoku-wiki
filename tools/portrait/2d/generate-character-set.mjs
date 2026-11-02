#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, generate, emitWorkstationPrompt } from './emit-character-prompt.mjs';
import { modularParts } from './modular-parts.mjs';
import { referenceShots } from './modular-parts.mjs';
import { createHash, randomUUID } from 'node:crypto';
import { validateFaceMode } from './face-selection.mjs';
import { decodeCodexPng } from './codex-image.mjs';
import { validateWorkstationRequest, validateWorkstationOutput, authoredWorkstationLookSchema, workstationHash } from './modular-parts.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

export function validateReferenceRequest(request) {
  const keys = ['requestId', 'connectionId', 'personId', 'providerModel', 'shots', 'identityResultId', 'styleReferenceSha256', 'faceMode'];
  if (!request || typeof request !== 'object' || Array.isArray(request) || keys.some(key => !Object.hasOwn(request, key)) || Object.keys(request).some(key => !keys.includes(key))) throw new Error('invalid reference request shape');
  if (!uuid(request.requestId) || !uuid(request.identityResultId) || typeof request.connectionId !== 'string' || !request.connectionId.trim() || !/^person-\d+$/.test(request.personId) || request.providerModel !== 'gpt-image-2.5-sunburst' || !sha(request.styleReferenceSha256)) throw new Error('invalid reference request binding');
  validateFaceMode(request.faceMode, true);
  if (!Array.isArray(request.shots) || !request.shots.length || new Set(request.shots).size !== request.shots.length || request.shots.some(id => !referenceShots.some(shot => shot.id === id))) throw new Error('invalid reference shots');
  return freeze(structuredClone(request));
}

// Explicit v2 entry point; no default transport, CLI route or ambient connection.
export async function generateWorkstationSet({ request, source, identity, authoredLookBytes, outputDir, signal }, transport) {
  request = validateWorkstationRequest(request);
  if (typeof transport !== 'function') throw new Error('explicit workstation transport required');
  if (!source || !identity || !outputDir || !sha(source.sha256) || !(authoredLookBytes instanceof Uint8Array)) throw new Error('trusted workstation inputs required');
  source = structuredClone(source);
  identity = structuredClone(identity);
  authoredLookBytes = Buffer.from(authoredLookBytes);
  if (hash(authoredLookBytes) !== request.authoredLook.sha256) throw new Error('authored look hash mismatch');
  const look = authoredWorkstationLookSchema.parse(JSON.parse(authoredLookBytes));
  const characterBytes = await readFile(source.characterPath);
  if (hash(characterBytes) !== source.sha256) throw new Error('authored source hash mismatch');
  const character = JSON.parse(characterBytes);
  const category = request.frames[0].outputSpec.category;
  if (look.sourceId !== request.authoredLook.sourceId || look.lookId !== request.authoredLook.lookId || look.personId !== request.personId || look.characterId !== character.characterId || look.category !== category || (!request.sourceBinding && character.lookId !== look.lookId)) throw new Error('authored look binding mismatch');
  if (request.sourceBinding && (request.sourceBinding.ownerId !== source.ownerId || request.sourceBinding.ownerId !== identity.ownerId || request.sourceBinding.characterId !== character.characterId || !same(request.sourceBinding.originalHashes, source.originalHashes) || request.sourceBinding.identityPngSHA !== identity.imageSha256)) throw new Error('registered source binding mismatch');
  if (request.sourceBinding) {
    for (const key of ['detail', 'token', 'image']) if (!(source.originalBytes?.[key] instanceof Uint8Array) || hash(source.originalBytes[key]) !== request.sourceBinding.originalHashes[key]) throw new Error('registered original hash mismatch');
    const originalToken = JSON.parse(Buffer.from(source.originalBytes.token));
    const originalDetail = JSON.parse(Buffer.from(source.originalBytes.detail));
    if (originalToken.personId !== request.personId || originalToken.characterId !== character.characterId || originalToken.image?.sha256 !== request.sourceBinding.originalHashes.image || originalDetail.id !== request.personId || originalDetail.familyTree?.personId !== character.characterId || !same({ ...originalToken, faceMode: request.faceMode }, character)) throw new Error('registered original identity mismatch');
  }
  if (identity.status !== 'sealed' || identity.resultId !== request.identityResultId || identity.personId !== request.personId || character.personId !== request.personId || identity.characterId !== character.characterId || identity.sourceSha256 !== source.sha256 || identity.styleReferenceSha256 !== request.styleReferenceSha256 || !same(validateFaceMode(identity.faceMode, true), request.faceMode) || !same(validateFaceMode(character.faceMode, true), request.faceMode)) throw new Error('sealed identity binding mismatch');
  const styleBytes = await readFile(source.stylePath);
  const referenceBytes = await readFile(source.referencePath);
  const identityBytes = await readFile(identity.imagePath);
  if (!sha(identity.imageSha256) || hash(identityBytes) !== identity.imageSha256 || hash(referenceBytes) !== request.styleReferenceSha256) throw new Error('reference image hash mismatch');
  decodeCodexPng(identityBytes); decodeCodexPng(referenceBytes);
  // Reuse canonical context, face-selection and technique-only style verification,
  // but do not reuse a v1 category's framing for a different semantic output.
  const verified = await emit({ character, mode: 'portrait', stylePath: source.stylePath, referencePath: source.referencePath, optionsPath: source.optionsPath, canonicalRoot: source.canonicalRoot ?? null, faceVariantCatalogPath: source.faceVariantCatalogPath ?? null, selectedReferenceSha256: request.styleReferenceSha256, requireFaceMode: true });
  const faceVariant = verified.faceVariant ? { id: verified.faceVariant.id, traitsSha256: verified.faceVariant.traitsSha256, referenceImageSha256: verified.faceVariant.referenceImageSha256 } : null;
  if (!same(identity.faceVariant ?? null, faceVariant)) throw new Error('sealed identity face variant mismatch');
  const binding = freeze({ ...(request.sourceBinding ? { sourceBinding: request.sourceBinding } : {}), parentRequestId: request.requestId, connectionId: request.connectionId, personId: request.personId, characterId: character.characterId, providerModel: request.providerModel, sourceSha256: source.sha256, styleLockSha256: hash(styleBytes), styleReferenceSha256: request.styleReferenceSha256, identityResultId: identity.resultId, identityReferenceSha256: identity.imageSha256, faceMode: request.faceMode, faceVariant, authoredLook: request.authoredLook, category, requestSha256: workstationHash(request) });
  const checks = [[source.characterPath, source.sha256], [source.stylePath, binding.styleLockSha256], [source.referencePath, binding.styleReferenceSha256], [identity.imagePath, binding.identityReferenceSha256]];
  if (source.faceVariantCatalogPath) checks.push([source.faceVariantCatalogPath, hash(await readFile(source.faceVariantCatalogPath))]);
  if (verified.faceVariant?.referenceImagePath) checks.push([verified.faceVariant.referenceImagePath, verified.faceVariant.referenceImageSha256]);
  const checkInputs = async () => { for (const [path, expected] of checks) if (hash(await readFile(path)) !== expected) throw new Error('workstation input changed after sealing'); };
  const plans = request.frames.map(frame => ({ ...frame, requestId: randomUUID(), prompt: emitWorkstationPrompt({ outputSpec: frame.outputSpec, authoredLook: look, slots: verified.slots }) }));
  await checkInputs(); signal?.throwIfAborted();
  await mkdir(outputDir); // Never resume or redispatch an existing parent directory.
  const save = (name, value) => writeFile(join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  const manifest = { schemaVersion: 2, kind: 'image-workstation-set', binding, status: 'PLANNED', frames: [], paidProof: 'NOT_RUN', approval: 'NONE', reviewStatus: 'HOLD' };
  await save('request.json', request);
  await writeFile(join(outputDir, 'authored-look.json'), authoredLookBytes, { flag: 'wx' });
  await save('plan.json', { ...manifest, children: plans.map(({ requestId, outputSpec, outputSpecSha256 }) => ({ requestId, outputSpec, outputSpecSha256 })) });
  const progress = () => writeFile(join(outputDir, 'set.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await progress();
  for (const { requestId, outputSpec, outputSpecSha256, prompt } of plans) {
    const stem = `frame-${outputSpec.frameOrder}`;
    try { await checkInputs(); signal?.throwIfAborted(); }
    catch (error) { manifest.status = 'STOPPED'; await save(`${stem}.stopped.json`, { requestId, status: 'NOT_DISPATCHED', reason: error.message }); await progress(); return manifest; }
    const payload = freeze({ schemaVersion: 2, requestId, binding, outputSpec, outputSpecSha256, prompt, references: [{ role: 'style-only', sha256: binding.styleReferenceSha256, pngBase64: referenceBytes.toString('base64') }, { role: 'sealed-identity', sha256: binding.identityReferenceSha256, pngBase64: identityBytes.toString('base64') }] });
    await save(`${stem}.request.json`, payload);
    let receipt;
    try {
      const result = await transport(payload, { signal });
      if (result?.schemaVersion !== 2 || result.status !== 'SUCCEEDED' || result.requestId !== requestId || !same(result.binding, binding) || result.outputSpecSha256 !== outputSpecSha256 || typeof result.pngBase64 !== 'string' || !sha(result.imageSha256)) throw new Error('uncertain or mismatched workstation provider receipt');
      const bytes = Buffer.from(result.pngBase64, 'base64');
      if (hash(bytes) !== result.imageSha256) throw new Error('workstation output hash mismatch');
      const actual = validateWorkstationPng(bytes, outputSpec);
      await checkInputs();
      const imageName = `${stem}.png`;
      await writeFile(join(outputDir, imageName), bytes, { flag: 'wx' });
      receipt = { schemaVersion: 2, requestId, binding, outputSpec, outputSpecSha256, status: 'SUCCEEDED', imageName, imageSha256: result.imageSha256, ...actual, technicalValidation: 'PASS', semanticReview: 'UNVERIFIED', reviewStatus: 'candidate-unreviewed', approval: 'NONE' };
    } catch (error) { receipt = { schemaVersion: 2, requestId, binding, outputSpec, outputSpecSha256, status: 'UNKNOWN', reason: error.message }; }
    await save(`${stem}.receipt.json`, receipt);
    manifest.frames.push({ requestId, category, view: outputSpec.view, frameOrder: outputSpec.frameOrder, outputSpecSha256, status: receipt.status, receiptSha256: hash(await readFile(join(outputDir, `${stem}.receipt.json`))) });
    manifest.status = receipt.status === 'UNKNOWN' ? 'UNKNOWN' : 'GENERATING';
    await progress();
    if (receipt.status === 'UNKNOWN') return manifest;
  }
  manifest.status = 'candidate-unreviewed'; await progress(); return manifest;
}

export function validateWorkstationPng(bytes, outputSpec) {
  // Parse through the same strict output schema before trusting pixel boundaries.
  const spec = validateWorkstationOutput(outputSpec);
  const image = decodeCodexPng(bytes);
  if (image.width !== spec.width || image.height !== spec.height) throw new Error('workstation canvas mismatch');
  let visiblePixels = 0, transparentPixels = 0;
  const visibleBounds = [image.width, image.height, 0, 0];
  const [left, top, right, bottom] = spec.alignment.crop;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const i = (y * image.width + x) * image.channels;
    const alpha = image.channels === 4 ? image.pixels[i + 3] : 255;
    const foreground = spec.background.kind === 'transparent' ? alpha > 0 : spec.background.rgb.some((channel, n) => image.pixels[i + n] !== channel);
    if (spec.background.kind === 'transparent' && image.channels !== 4) throw new Error('workstation RGBA required');
    if (spec.background.kind === 'solid' && alpha !== 255) throw new Error('workstation opaque alpha required');
    if (alpha === 0) transparentPixels++;
    if (!foreground) continue;
    if (x < left || x >= right || y < top || y >= bottom) throw new Error('workstation crop/background mismatch');
    visiblePixels++;
    visibleBounds[0] = Math.min(visibleBounds[0], x); visibleBounds[1] = Math.min(visibleBounds[1], y);
    visibleBounds[2] = Math.max(visibleBounds[2], x + 1); visibleBounds[3] = Math.max(visibleBounds[3], y + 1);
  }
  if (!visiblePixels || (spec.background.kind === 'transparent' && !transparentPixels)) throw new Error('empty image or missing alpha-zero background');
  return { width: image.width, height: image.height, channels: image.channels, visiblePixels, transparentPixels, visibleBounds };
}

// Trusted paths are resolved by the portal, never accepted in the public request.
// Each directory is single-use: even UNKNOWN and interrupted requests cannot retry.
export async function generateReferenceSet({ request, source, identity, outputDir, signal }, transport) {
  request = validateReferenceRequest(request);
  if (typeof transport !== 'function') throw new Error('explicit reference provider transport required');
  if (!source || !identity || !outputDir || !sha(source.sha256)) throw new Error('trusted source and sealed identity required');
  source = structuredClone(source);
  identity = structuredClone(identity);
  const sourceBytes = await readFile(source.characterPath);
  if (hash(sourceBytes) !== source.sha256) throw new Error('authored source hash mismatch');
  const character = JSON.parse(sourceBytes);
  if (identity.status !== 'sealed' || identity.resultId !== request.identityResultId || identity.personId !== request.personId || character.personId !== request.personId || identity.characterId !== character.characterId || identity.sourceSha256 !== source.sha256 || identity.styleReferenceSha256 !== request.styleReferenceSha256 || !same(validateFaceMode(identity.faceMode, true), request.faceMode) || !same(validateFaceMode(character.faceMode, true), request.faceMode)) throw new Error('sealed identity binding mismatch');
  const styleBytes = await readFile(source.stylePath);
  const referenceBytes = await readFile(source.referencePath);
  const identityBytes = await readFile(identity.imagePath);
  if (!sha(identity.imageSha256) || hash(identityBytes) !== identity.imageSha256 || hash(referenceBytes) !== request.styleReferenceSha256) throw new Error('reference image hash mismatch');
  decodeCodexPng(identityBytes);
  decodeCodexPng(referenceBytes);
  const catalogSha256 = source.faceVariantCatalogPath ? hash(await readFile(source.faceVariantCatalogPath)) : null;
  const selected = referenceShots.filter(shot => request.shots.includes(shot.id));
  const plans = [];
  for (const shot of selected) {
    const prompt = await emit({ character, ...shot, stylePath: source.stylePath, referencePath: source.referencePath, optionsPath: source.optionsPath, canonicalRoot: source.canonicalRoot ?? null, faceVariantCatalogPath: source.faceVariantCatalogPath ?? null, selectedReferenceSha256: request.styleReferenceSha256, requireFaceMode: true });
    if (prompt.slots.face.description.value === null || prompt.slots.hair.description.value === null || ['upper', 'lower', 'footwear'].some(key => prompt.slots.outfit[key].value === null)) throw new Error('incomplete authored reference look');
    if (!same(prompt.faceVariant ?? null, plans[0]?.prompt.faceVariant ?? prompt.faceVariant ?? null)) throw new Error('face variant changed during planning');
    plans.push({ shot, prompt, requestId: randomUUID() });
  }
  const binding = freeze({ parentRequestId: request.requestId, connectionId: request.connectionId, personId: request.personId, characterId: character.characterId, providerModel: request.providerModel, sourceSha256: source.sha256, styleLockSha256: hash(styleBytes), styleReferenceSha256: request.styleReferenceSha256, identityResultId: identity.resultId, identityReferenceSha256: identity.imageSha256, faceMode: request.faceMode, faceVariant: plans[0].prompt.faceVariant ? { id: plans[0].prompt.faceVariant.id, traitsSha256: plans[0].prompt.faceVariant.traitsSha256, referenceImageSha256: plans[0].prompt.faceVariant.referenceImageSha256 } : null });
  if (!same(identity.faceVariant ?? null, binding.faceVariant)) throw new Error('sealed identity face variant mismatch');
  const checks = [[source.characterPath, source.sha256], [source.stylePath, binding.styleLockSha256], [source.referencePath, binding.styleReferenceSha256], [identity.imagePath, binding.identityReferenceSha256]];
  if (source.faceVariantCatalogPath) checks.push([source.faceVariantCatalogPath, catalogSha256]);
  if (plans[0].prompt.faceVariant?.referenceImagePath) checks.push([plans[0].prompt.faceVariant.referenceImagePath, plans[0].prompt.faceVariant.referenceImageSha256]);
  const checkInputs = async () => { for (const [path, expected] of checks) if (hash(await readFile(path)) !== expected) throw new Error('reference input changed after sealing'); };
  await checkInputs();
  signal?.throwIfAborted();
  await mkdir(outputDir); // EEXIST is a no-redispatch boundary, not resumable state.
  const save = (name, value) => writeFile(join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  const manifest = { schemaVersion: 1, kind: 'image-reference-set', binding, order: selected.map(shot => shot.id), status: 'PLANNED', shots: [], paidProof: 'NOT_RUN' };
  await save('plan.json', { ...manifest, children: plans.map(({ shot, requestId }) => ({ shot: shot.id, requestId })) });
  await writeFile(join(outputDir, 'set.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  let continuity = null;
  for (const { shot, prompt, requestId } of plans) {
    // A pre-dispatch failure is definitive and creates no provider attempt.
    try { await checkInputs(); signal?.throwIfAborted(); }
    catch (error) {
      manifest.status = 'STOPPED';
      await save(`${shot.id}.stopped.json`, { requestId, shot: shot.id, status: 'NOT_DISPATCHED', reason: error.message });
      await writeFile(join(outputDir, 'set.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      return manifest;
    }
    const references = [{ role: 'style-only', sha256: binding.styleReferenceSha256, pngBase64: referenceBytes.toString('base64') }, { role: 'sealed-identity', sha256: binding.identityReferenceSha256, pngBase64: identityBytes.toString('base64') }];
    if (continuity) references.push({ role: 'continuity-only', sha256: continuity.sha256, pngBase64: continuity.bytes.toString('base64') });
    const payload = freeze({ schemaVersion: 1, requestId, shot: shot.id, binding, prompt: prompt.prompt, references });
    await save(`${shot.id}.request.json`, payload);
    let receipt;
    try {
      const result = await transport(payload, { signal });
      if (result?.status !== 'SUCCEEDED' || result.requestId !== requestId || result.shot !== shot.id || !same(result.binding, binding) || typeof result.pngBase64 !== 'string' || !sha(result.imageSha256)) throw new Error('uncertain or mismatched reference provider receipt');
      const bytes = Buffer.from(result.pngBase64, 'base64');
      if (hash(bytes) !== result.imageSha256) throw new Error('reference output hash mismatch');
      const decoded = decodeCodexPng(bytes);
      let visible = 0;
      for (let i = 0; i < decoded.pixels.length; i += decoded.channels) if (decoded.channels === 3 || decoded.pixels[i + 3] > 0) visible++;
      if (visible === 0) throw new Error('empty reference PNG');
      await checkInputs();
      const imageName = `${shot.id}.png`;
      await writeFile(join(outputDir, imageName), bytes, { flag: 'wx' });
      receipt = { schemaVersion: 1, requestId, shot: shot.id, binding, status: 'SUCCEEDED', imageName, imageSha256: result.imageSha256, width: decoded.width, height: decoded.height, channels: decoded.channels, visiblePixels: visible, continuitySha256: continuity?.sha256 ?? null, reviewStatus: 'candidate-unreviewed' };
      if (shot.id === 'front') continuity = { bytes, sha256: receipt.imageSha256 };
    } catch (error) {
      receipt = { schemaVersion: 1, requestId, shot: shot.id, binding, status: 'UNKNOWN', reason: error.message };
    }
    await save(`${shot.id}.receipt.json`, receipt);
    manifest.shots.push({ shot: shot.id, requestId, status: receipt.status, receiptSha256: hash(await readFile(join(outputDir, `${shot.id}.receipt.json`))) });
    manifest.status = receipt.status === 'UNKNOWN' ? 'UNKNOWN' : 'GENERATING';
    await writeFile(join(outputDir, 'set.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    if (receipt.status === 'UNKNOWN') return manifest;
  }
  manifest.status = 'candidate-unreviewed';
  await writeFile(join(outputDir, 'set.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

const root = fileURLToPath(new URL('.', import.meta.url));
export const shots = [
  ['portrait', 'portrait', null, null],
  ['full-body-front', 'turntable', null, 'front'],
  ['full-body-profile', 'turntable', null, 'profile'],
  ['full-body-oblique', 'turntable', null, 'side'],
  ['full-body-back', 'turntable', null, 'back'],
  ...Object.keys(modularParts).map((part) => [`tripo-${part}`, 'full-body', part, null]),
];

export async function generateSet({ character, referencePath, identityReference = null, outputDir, stylePath = `${root}/style-lock.json`, generator = `${process.env.HOME}/.agents/skills/asset-gen/tools/asset_gen.py`, selectedReferenceSha256 = null, slotReplacements = {}, through = 'tripo-footwear' }, generateImage = generate) {
  const end = shots.findIndex(([name]) => name === through);
  if (end < 0) throw new Error(`unknown --through shot: ${through}`);
  if (!character || !referencePath || !outputDir) throw new Error('--character, --reference and --output-dir are required');
  if (identityReference) await readFile(identityReference);
  const characterSource = JSON.parse(await readFile(character, 'utf8'));
  const input = { character: characterSource, referencePath, stylePath, selectedReferenceSha256, slotReplacements, requireFaceMode: true };
  const plans = await Promise.all(shots.slice(0, end + 1).map(async ([name, mode, part, view]) => {
    const shot = { ...input, mode, part, view };
    const prompt = await emit(shot);
    if (prompt.mangaStyle.id !== 'owner-reference' || prompt.missing.some((key) => ['appearance.face', 'appearance.hair', 'outfit.upper', 'outfit.lower', 'outfit.footwear'].includes(key))) throw new Error(`incomplete B look for ${name}: ${prompt.missing.join(', ')}`);
    return { name, shot };
  }));
  try { await stat(outputDir); throw new Error(`output directory already exists: ${outputDir}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(outputDir, { recursive: true });
  let portrait = null;
  let front = null;
  const receipts = [];
  const manifest = { schemaVersion: 1, characterId: characterSource.characterId, styleReferenceSha256: (await emit({ ...input, mode: 'portrait' })).referenceSha256, status: 'generating', shots: receipts };
  const saveManifest = () => writeFile(join(outputDir, 'set.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await saveManifest();
  for (const { name, shot } of plans) {
    const output = join(outputDir, `${name}.png`);
    const imageReference = name === 'portrait' ? null : name === 'full-body-front' ? portrait : front;
    const receipt = await generateImage(shot, { output, generator, imageReference, identityReference: characterSource.faceMode?.kind === 'template' ? identityReference : identityReference ?? imageReference });
    receipts.push({ name, faceMode: receipt.faceMode, faceVariant: receipt.faceVariant, imagePath: receipt.imagePath, imageSha256: receipt.imageSha256, generationReferenceSha256: receipt.generationReferenceSha256, identityReferenceSha256: receipt.identityReferenceSha256 ?? null });
    if (name === 'portrait') portrait = output;
    if (name === 'full-body-front') front = output;
    await saveManifest();
  }
  manifest.status = 'candidate-unreviewed';
  await saveManifest();
  return manifest;
}

if (process.argv[1] && basename(fileURLToPath(import.meta.url)) === 'generate-character-set.mjs' && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (flag) => { const at = args.indexOf(flag); return at < 0 ? null : args[at + 1]; };
  try {
    const result = await generateSet({ character: option('--character'), referencePath: option('--reference'), identityReference: option('--identity-reference'), selectedReferenceSha256: option('--reference-sha256'), slotReplacements: option('--replace-slots') ? JSON.parse(await readFile(option('--replace-slots'), 'utf8')) : {}, outputDir: option('--output-dir'), through: option('--through') ?? undefined, generator: option('--generator') ?? undefined });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
