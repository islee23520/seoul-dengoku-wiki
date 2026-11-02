#!/usr/bin/env node
import { readFile, writeFile, stat, mkdtemp, rm, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, basename, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseDesignPrompt, SCHEMA, strictJSONParse } from './design-prompt.mjs';
import { readConnectionConfig, resolveConnection, parseConnectionArgs, resolveCodexExecutable } from './image-connection.mjs';
import { generateCodexImage } from './codex-image.mjs';
import { decodeCodexPng } from './codex-image.mjs';
import transparencyEdgeRule from './transparency-edge-rule.json' with { type: 'json' };
import { prepareCompactPrompt } from '../compact-prompt.mjs';

// The corrected model owns completeness, duplicate keys and role property limits.
const readableMarker = '\r\n\r\nCHARACTER_ART_BOUND_JSON_V1\r\n';
export function readableGenerationTransport(model) {
  const parsed = parseDesignPrompt(model);
  if (!parsed.completeSource?.readableProjection) throw new Error('bound readable projection required');
  return parsed.completeSource.instruction.replace(/\r?\n/g, '\r\n') + readableMarker + canonicalJSON(parsed);
}

function designModel(text) {
  const marker = text.indexOf(readableMarker);
  if (marker >= 0) {
    if (text.indexOf(readableMarker, marker + readableMarker.length) >= 0) throw new Error('duplicate readable transport marker');
    const model = parseDesignPrompt(strictJSONParse(text.slice(marker + readableMarker.length)));
    if (!model.completeSource?.readableProjection || readableGenerationTransport(model) !== text) throw new Error('readable transport source binding mismatch');
    return model;
  }
  if (!/^\s*[\[{]/.test(text) && !/"schema"\s*:/.test(text)) return null;
  const data = strictJSONParse(text);
  if (data?.schema !== SCHEMA) throw new Error('unknown design prompt schema');
  return parseDesignPrompt(data);
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function validateDesignAssociation(source, transmitted, path = []) {
  if (source !== null && typeof source === 'object') {
    if (transmitted === null || typeof transmitted !== 'object' || Array.isArray(source) !== Array.isArray(transmitted) || JSON.stringify(Object.keys(source).sort()) !== JSON.stringify(Object.keys(transmitted).sort())) throw new Error('design prompt structure changed');
    for (const key of Object.keys(source)) validateDesignAssociation(source[key], transmitted[key], [...path, key]);
    return;
  }
  const translatable = path.length === 3 && path[0] === 'appearance' || path.join('.') === 'recipient.ageCategory';
  if (translatable && typeof source === 'string' && /[^\x00-\x7f]/.test(source)) {
    if (typeof transmitted !== 'string' || !transmitted.trim() || /[^\x00-\x7f]/.test(transmitted)) throw new Error('design translation must return English leaf text');
  } else if (source !== transmitted || typeof source === 'string' && /[^\x00-\x7f]/.test(source)) throw new Error('fixed design prompt leaf changed or is non-English: ' + path.join('.'));
}

function validateDesignReferences(model, references) {
  if (!Array.isArray(references) || references.length !== model.references.length || model.references.some((reference, index) => {
    const actual = references[index];
    return actual.index !== reference.index || actual.role !== reference.role || reference.sourceHash && reference.sourceHash !== actual.sha256 || reference.guide && reference.guide.sourceHash !== actual.sha256 || reference.role === 'recipient-appearance-only' && actual.sameOwnerRecipient !== reference.sameOwnerRecipient;
  })) throw new Error('design reference upload binding mismatch');
}

const sha256 = value => createHash('sha256').update(value).digest('hex');
const transparentInstruction = 'Completely transparent background with actual alpha 0 outside the character, fully opaque character interior, and clean antialiased edges. No painted checkerboard, solid backdrop, floor or cast shadow.';

// Native format acceptance does not certify a transparent final derivative or artwork.
export function validateNativeOutput(nativeBytes, { size, background }) {
  const decoded = decodeCodexPng(nativeBytes);
  const [expectedWidth, expectedHeight] = size.split('x').map(Number);
  const alphaChannelPresent = decoded.channels === 4;
  const alpha255Present = alphaChannelPresent ? decoded.pixels.some((pixel, index) => index % 4 === 3 && pixel === 255) : null;
  const inherentlyOpaque = decoded.channels === 3;
  const transparent = alphaChannelPresent && decoded.pixels.some((pixel, index) => index % 4 === 3 && pixel === 0);
  let nonzeroAlphaPixels = 0, corePixels = 0;
  if (alphaChannelPresent) for (let index = 3; index < decoded.pixels.length; index += 4) {
    const alpha = decoded.pixels[index];
    if (alpha > 0) nonzeroAlphaPixels++;
    if (alpha >= transparencyEdgeRule.alpha.foregroundCoreMinimum) corePixels++;
  }
  const opaque = inherentlyOpaque || (background === 'transparent' ? nonzeroAlphaPixels > 0 && corePixels / nonzeroAlphaPixels >= transparencyEdgeRule.alpha.minimumCoreFraction : alpha255Present === true);
  const metadata = { width: decoded.width, height: decoded.height, channels: decoded.channels, alphaChannelPresent, alpha255Present, inherentlyOpaque, transparent, opaque };
  if (!['opaque', 'transparent'].includes(background) || decoded.width !== expectedWidth || decoded.height !== expectedHeight || !opaque || background === 'transparent' && !transparent) {
    throw Object.assign(new Error(`width=${decoded.width}, height=${decoded.height}, channels=${decoded.channels}, background=${background}, transparent=${transparent}, opaque=${opaque}`), metadata);
  }
  return metadata;
}

// Shape and byte binding do not establish the authority of a caller's canon.
export function validateSourceContext(text) {
  const context = strictJSONParse(text);
  const shape = (value, required, optional = []) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || required.some(key => !Object.hasOwn(value, key)) || Object.keys(value).some(key => ![...required, ...optional].includes(key))) throw new Error('invalid source context shape');
  };
  const string = value => { if (typeof value !== 'string' || !value.trim()) throw new Error('invalid source context string'); };
  shape(context, ['characterId', 'name', 'personId', 'excerpts'], ['canonicalContext', 'birthContext', 'birthDate', 'age', 'ageAsOf']);
  for (const key of ['characterId', 'name', 'personId']) string(context[key]);
  if (!Array.isArray(context.excerpts) || context.excerpts.some(value => typeof value !== 'string') || (!context.canonicalContext && !context.birthContext)) throw new Error('invalid source context provenance');
  if (context.canonicalContext) {
    const canon = context.canonicalContext;
    shape(canon, ['characterId', 'name', 'personId', 'registry', 'background']);
    for (const key of ['characterId', 'name', 'personId']) if (canon[key] !== context[key]) throw new Error('source context identity mismatch');
    const entry = (value, background) => {
      shape(value, background ? ['path', 'pointer', 'sha256', 'text'] : ['path', 'pointer', 'sha256']);
      string(value.path);
      if (typeof value.pointer !== 'string' || value.pointer !== '' && (!value.pointer.startsWith('/') || /~(?:[^01]|$)/.test(value.pointer)) || !/^[a-f0-9]{64}$/.test(value.sha256) || background && typeof value.text !== 'string') throw new Error('invalid source context entry');
    };
    entry(canon.registry, false);
    if (!Array.isArray(canon.background)) throw new Error('invalid source context background');
    canon.background.forEach(value => entry(value, true));
    if (JSON.stringify(context.excerpts) !== JSON.stringify(canon.background.map(value => value.text))) throw new Error('source context excerpt mismatch');
  } else if (context.excerpts.length) throw new Error('source context excerpt mismatch');
  if (context.birthContext) {
    const birth = context.birthContext;
    shape(birth, ['birthDate', 'age', 'ageAsOf'], ['source']);
    if (birth.source !== undefined) string(birth.source);
    for (const key of ['birthDate', 'ageAsOf']) {
      if (typeof birth[key] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birth[key]) || !Number.isFinite(Date.parse(birth[key])) || new Date(birth[key]).toISOString().slice(0, 10) !== birth[key] || context[key] !== birth[key]) throw new Error('invalid source context birth date');
    }
    const age = Number(birth.ageAsOf.slice(0, 4)) - Number(birth.birthDate.slice(0, 4)) - Number(birth.ageAsOf.slice(5) < birth.birthDate.slice(5));
    if (birth.birthDate > birth.ageAsOf || !Number.isInteger(birth.age) || birth.age !== age || context.age !== birth.age) throw new Error('source context birth mismatch');
  } else if (['birthDate', 'age', 'ageAsOf'].some(key => Object.hasOwn(context, key))) throw new Error('source context birth mismatch');
  return context;
}

function privateContextGuard(prompt, context, path) {
  const canon = context?.canonicalContext;
  const values = [path, context?.characterId, context?.personId, context?.name, canon?.name, canon?.registry?.path, canon?.registry?.sha256, ...(context?.excerpts ?? []), ...(canon?.background ?? []).flatMap(item => [item.path, item.sha256, item.text])].filter(value => typeof value === 'string' && value.length);
  if (values.some(value => prompt.includes(value) || prompt.includes(JSON.stringify(value).slice(1, -1)))) throw new Error('source metadata leaked into visual instruction');
}

export function recipientContext(prompt) {
  if (designModel(prompt)) return null;
  const lines = prompt.split('\n').filter(line => line.startsWith('serializedRecipientContext='));
  if (!lines.length) return null;
  if (lines.length !== 1) throw new Error('recipient context must occur exactly once');
  let context;
  try { context = JSON.parse(lines[0].slice('serializedRecipientContext='.length)); }
  catch { throw new Error('invalid recipient context'); }
  if (!context || typeof context !== 'object' || Array.isArray(context) || typeof context.characterId !== 'string' || typeof context.name !== 'string' || !context.name) throw new Error('invalid recipient context');
  return context;
}

export function visualInstruction(prompt) {
  const model = designModel(prompt);
  if (model) return prompt.includes(readableMarker) ? readableGenerationTransport(model) : canonicalJSON(model);
  const context = recipientContext(prompt);
  if (context === null) return prompt;
  let visual = prompt.replace(/^serializedRecipientContext=[^\n]*(?:\n|$)/m, '');
  visual = visual.replace(/Recipient context is metadata[^\n]*\n/g, '').replace(/Recipient context is metadata[^\n]*$/g, '');
  if (!visual.trim() || visual.includes('serializedRecipientContext=')) throw new Error('visual instruction required without source context');
  const privateValues = [context.name, context.canonicalContext?.name, ...(context.excerpts ?? []), ...(context.canonicalContext?.background ?? []).flatMap(item => [item.text, item.path, item.sha256]), context.canonicalContext?.registry?.path, context.canonicalContext?.registry?.sha256].filter(value => typeof value === 'string' && value.length);
  if (privateValues.some(value => visual.includes(value))) throw new Error('source metadata leaked into visual instruction');
  return visual.trim();
}

function englishIdentityGender(prompt) {
  return prompt.replace(/\bidentity\.gender:\s*(남성|여성)(?=;|\s+identity\.|\s+(?:face|hair|body|outfit|accessories)\.|$)/g, (_, gender) => 'identity.gender: ' + (gender === '남성' ? 'male' : 'female'));
}

export function validateVisualSnapshot(request, expectedSourceContext = undefined) {
  if (request.compactTransport) {
    const compact = prepareCompactPrompt(designModel(request.prompt));
    if (request.compactTransport.sourceSHA !== compact.sourceSHA || request.compactTransport.renderingSHA !== compact.renderingSHA || request.compactTransport.textSHA !== compact.textSHA || request.compactTransport.text !== compact.text) throw new Error('compact transport source binding mismatch');
  }
  const snapshot = request.visualSnapshot;
  const model = designModel(request.prompt);
  if (!snapshot) {
    if (model || expectedSourceContext !== undefined || request.sourceSnapshot?.schemaSource || request.sourceSnapshot?.contextSource || request.sourceSnapshot && designModel(request.sourceSnapshot.prompt)) throw new Error('JSON visual/source snapshot required');
    return;
  }
  if (![snapshot.sourceVisualPrompt, snapshot.transmittedPrompt].every(value => typeof value === 'string' && value.length)) throw new Error('visual instruction required');
  const digest = value => createHash('sha256').update(value).digest('hex');
  const source = request.sourceSnapshot;
  let boundContext = source && recipientContext(source.prompt);
  if (source?.schemaSource === 'separate-source-context-json') {
    const binding = source.contextSource;
    if (boundContext !== null || !binding || !isAbsolute(binding.path) || typeof binding.text !== 'string' || !/^[a-f0-9]{64}$/.test(binding.sha256) || digest(binding.text) !== binding.sha256) throw new Error('source context snapshot binding mismatch');
    boundContext = validateSourceContext(binding.text);
    privateContextGuard(snapshot.sourceVisualPrompt, boundContext, binding.path);
    privateContextGuard(request.prompt, boundContext, binding.path);
  } else if (source?.schemaSource !== undefined || source?.contextSource !== undefined) throw new Error('unknown source context snapshot schema');
  if (!source || digest(source.prompt) !== source.promptSha256 || canonicalJSON(boundContext) !== canonicalJSON(source.recipientContext) || visualInstruction(source.prompt) !== snapshot.sourceVisualPrompt || digest(snapshot.sourceVisualPrompt) !== snapshot.sourceVisualPromptSha256 || digest(request.prompt) !== snapshot.transmittedPromptSha256 || snapshot.transmittedPrompt !== request.prompt || recipientContext(request.prompt) !== null) throw new Error('visual/source snapshot binding mismatch');
  if (expectedSourceContext !== undefined && canonicalJSON(expectedSourceContext) !== canonicalJSON(boundContext)) throw new Error('expected source context mismatch');
  const context = request.sourceSnapshot.recipientContext;
  if (model) validateDesignReferences(model, request.references);
  const privateValues = [context?.name, context?.canonicalContext?.registry?.path, context?.canonicalContext?.registry?.sha256, ...(context?.excerpts ?? []), ...(context?.canonicalContext?.background ?? []).flatMap(item => [item.path, item.sha256, item.text])].filter(value => typeof value === 'string' && value.length);
  if (privateValues.some(value => request.prompt.includes(value))) throw new Error('source metadata leaked into transmitted visual instruction');
  const transmittedVisual = request.backgroundInstruction === undefined ? request.prompt : request.prompt.slice(transparentInstruction.length + 1);
  if (request.backgroundInstruction !== undefined && (request.background !== 'transparent' || request.backgroundInstruction !== transparentInstruction || !request.prompt.startsWith(transparentInstruction + ' '))) throw new Error('background instruction binding mismatch');
  validateVisualAssociation(snapshot.sourceVisualPrompt, transmittedVisual);
  if (snapshot.provenance === 'source-bound-readable-first') {
    if (!model || readableGenerationTransport(designModel(snapshot.sourceVisualPrompt)) !== transmittedVisual) throw new Error('readable transport snapshot mismatch');
    return;
  }
  if (snapshot.provenance === 'deterministic-identity-gender') {
    if (snapshot.sourceVisualPrompt === transmittedVisual || englishIdentityGender(snapshot.sourceVisualPrompt) !== transmittedVisual || /[^\x00-\x7f]/.test(transmittedVisual)) throw new Error('visual translation provenance mismatch');
  } else if (snapshot.provenance === 'untranslated-visual-instruction' ? snapshot.sourceVisualPrompt !== transmittedVisual : snapshot.provenance !== 'translated-visual-instruction' || snapshot.sourceVisualPrompt === transmittedVisual || /[^\x00-\x7f]/.test(transmittedVisual)) throw new Error('visual translation provenance mismatch');
}

function machineFields(context) {
  if (Array.isArray(context)) return context.map(machineFields);
  if (context && typeof context === 'object') return Object.fromEntries(Object.keys(context).sort().filter(key => !['name', 'excerpts', 'text'].includes(key)).map(key => [key, machineFields(context[key])]));
  return context;
}

function validateVisualAssociation(source, transmitted) {
  const sourceModel = designModel(source);
  const transmittedModel = designModel(transmitted);
  if (sourceModel || transmittedModel) {
    if (!sourceModel || !transmittedModel) throw new Error('design prompt cannot downgrade to prose');
    validateDesignAssociation(sourceModel, transmittedModel);
    return;
  }
  if (transmitted.includes('serializedRecipientContext=')) throw new Error('source context reintroduced into visual instruction');
  const associations = text => {
    const declarations = [...text.matchAll(/\b((?:face|hair|body|outfit|accessories)\.[a-zA-Z]+):\s*/g)];
    const result = new Map();
    let boundaryKinds = [];
    for (let i = 0; i < declarations.length; i++) {
      const item = declarations[i];
      if (result.has(item[1])) throw new Error('duplicate visual slot declaration');
      let value = text.slice(item.index + item[0].length, declarations[i + 1]?.index ?? text.length);
      if (i === declarations.length - 1) {
        const boundaries = [...value.matchAll(/\s+(Locked series camera:|front three-quarter view|Exact frontal view\.|Exact (?:90|ninety)-degree side profile\.|Single three-quarter oblique view\.|Exact rear view\.|isolated recipient-neutral|full shot from)/g)];
        boundaryKinds = boundaries.map(match => match[1].replace('ninety', '90'));
        if (boundaries.length) value = value.slice(0, boundaries[0].index);
        value = value.replace(/;\s*(?:male|female|남성|여성)$/, '');
      }
      result.set(item[1], value.trim().replace(/;$/, '').trim());
    }
    return { fields: result, boundaryKinds };
  };
  const { fields: expected, boundaryKinds: sourceBoundaries } = associations(source);
  const { fields: actual, boundaryKinds: transmittedBoundaries } = associations(transmitted);
  if (JSON.stringify(sourceBoundaries) !== JSON.stringify(transmittedBoundaries)) throw new Error('visual slot boundary changed before image request');
  if (expected.size !== actual.size || [...actual.keys()].some(field => !expected.has(field))) throw new Error('visual slot fields changed before image request');
  if ([...expected].some(([field, value]) => !actual.has(field) || (/^[\x00-\x7f]*$/.test(value) && actual.get(field) !== value))) throw new Error('authored visual slot association changed before image request');
  const roles = ['STYLE ONLY', 'STYLE TECHNIQUE ONLY', 'FACE BASE ONLY', 'ORIGINAL CHARACTER IDENTITY'];
  if (roles.some(role => source.includes(role) && !transmitted.includes(role))) throw new Error('reference role changed before image request');
}

export async function englishGenerationPrompt(prompt, translate) {
  const model = designModel(prompt);
  if (model) {
    const canonical = canonicalJSON(model);
    // Check fixed fields before any provider call; only approved leaves may need translation.
    const check = value => {
      if (Array.isArray(value)) return value.map(check);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, leaf]) => [key, check(leaf)]));
      return typeof value === 'string' && /[^\x00-\x7f]/.test(value) ? 'translation-check' : value;
    };
    validateDesignAssociation(model, check(model));
    if (/^[\x00-\x7f]*$/.test(canonical)) return canonical;
    const translated = designModel((await translate(canonical)).trim());
    if (!translated) throw new Error('design translation must return JSON');
    validateDesignAssociation(model, translated);
    const result = canonicalJSON(translated);
    if (/[^\x00-\x7f]/.test(result)) throw new Error('fixed design fields must already be English');
    return result;
  }
  const original = recipientContext(prompt);
  if (original === null) {
    const englishGender = englishIdentityGender(prompt);
    if (/^[\x00-\x7f]*$/.test(englishGender)) {
      validateVisualAssociation(prompt, englishGender);
      return englishGender;
    }
  }
  if (/^[\x00-\x7f]*$/.test(prompt)) {
    if (original === null) validateVisualAssociation(prompt, prompt);
    return prompt;
  }
  const english = (await translate(prompt)).trim();
  if (!english || /[^\x00-\x7f]/.test(english)) throw new Error('generation prompt translation must return English text only');
  const derivative = recipientContext(english);
  if (JSON.stringify(machineFields(original)) !== JSON.stringify(machineFields(derivative))) throw new Error('recipient context machine fields changed before image request');
  validateVisualAssociation(prompt, english);
  return english;
}

export async function imageRequestRecord(prompt, size, paths, model = 'gpt-image-2.5-sunburst', referenceBytes = null, roles = null) {
  const bytes = referenceBytes ?? await Promise.all(paths.map(path => readFile(path)));
  return {
    schemaVersion: 1, model, prompt, size, n: 1, background: 'transparent', output_format: 'png',
    references: await Promise.all(paths.map(async (path, index) => ({
      index: index + 1,
      role: roles?.[index] ?? (index === 0 ? 'style-only' : index === 1 ? 'identity-only' : 'additional-reference'),
      sha256: createHash('sha256').update(bytes[index]).digest('hex'),
    }))),
  };
}

export async function runGeneration(argv, { garmentEdit = null, completeReplacement = null, compactFirst = false } = {}) {
const { args, connectionConfig } = parseConnectionArgs(argv);
const value = flag => { const at = args.indexOf(flag); return at < 0 ? null : args[at + 1]; };
const promptOnlyTransparency = value('--api-transparency') === 'prompt-only';
if (args.includes('--api-transparency') && !promptOnlyTransparency) throw new Error('api-transparency must be prompt-only');
const diagnosticModel = value('--diagnostic-model');
if (args.includes('--diagnostic-model') && (diagnosticModel !== 'gpt-image-2.5' || !promptOnlyTransparency)) throw new Error('diagnostic model requires gpt-image-2.5 and prompt-only');
const requestId = value('--request-id');
if (args.includes('--request-id') && (args.filter(arg => arg === '--request-id').length !== 1 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId ?? ''))) throw new Error('request-id must be a UUID supplied once');
const textOnly = args.includes('--text-only');
if (textOnly) {
  const flags = new Set(['--prompt', '-o', '--source-context', '--expected-source-context-sha256', '--background', '--request-id']);
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error('duplicate text-only option');
    seen.add(flag);
    if (flag === '--text-only') continue;
    if (!flags.has(flag)) throw new Error('unsupported or conflicting text-only option');
    if (typeof args[index + 1] !== 'string' || !args[index + 1].trim() || args[index + 1].startsWith('-')) throw new Error('text-only option value required');
    index++;
  }
  const text = value('--prompt');
  if (!text?.trim() || !value('-o')) throw new Error('standalone text prompt and new output required');
  if (/^\s*[\[{]/.test(text) || /"schema"\s*:/.test(text) || text.includes('serializedRecipientContext=')) throw new Error('text-only requires standalone plaintext, not design JSON or inline source context');
}
const published = [];
let staging;
let preservationDir, preservationWritten = false, requestRecordWritten = false, retainRequestRecord = false, output;
try {
  const connection = await readConnectionConfig({ connectionConfig });
  const selected = resolveConnection(connection);
  if (selected.provider !== 'openai-compatible' || selected.imageModel !== 'gpt-image-2.5-sunburst') throw new Error('image generation requires GPT Image 2.5 Sunburst; model exceptions cannot be executed');
  if (diagnosticModel) selected.imageModel = diagnosticModel;
  const rejectCredentials = text => {
    if (typeof text === 'string' && [selected.apiKey, selected.translation?.apiKey].filter(Boolean).some(key => text.includes(key))) throw new Error('credential value in image instructions');
  };
  const authorization = selected.apiKey ? { Authorization: `Bearer ${selected.apiKey}` } : {};
  rejectCredentials(requestId);
  const apiBase = selected.baseUrl?.replace(/\/$/, '');
  const images = args.flatMap((arg, i) => arg === '--image' ? [args[i + 1]] : []);
  if (!textOnly && (!images.length || !value('--prompt') || !value('-o'))) throw new Error('reference images, prompt and new output required');
  output = value('-o');
  for (const path of [output, `${output}.request.json`, `${output}.receipt.json`]) {
    try { await stat(path); throw new Error(`output already exists: ${path}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const referenceBytes = await Promise.all(images.map(path => readFile(path)));
  if (completeReplacement) {
    if (garmentEdit || referenceBytes.length !== completeReplacement.referenceBytes.length || referenceBytes.some((bytes, index) => !bytes.equals(completeReplacement.referenceBytes[index]))) throw new Error('stale complete replacement references; provider calls: 0');
  }
  if (designModel(value('--prompt'))?.garmentEdit && !garmentEdit) throw new Error('garment-edit requires bound native source and mask snapshots');
  if (designModel(value('--prompt'))?.completeSource && !completeReplacement) throw new Error('complete-source requires the bound replacement API; provider calls: 0');
  if (garmentEdit) {
    if (!referenceBytes[0]?.equals(garmentEdit.sourceBytes)) throw new Error('stale garment source before provider; provider calls: 0');
    referenceBytes[0] = garmentEdit.sourceBytes;
  }
  const explicitSize = value('--size');
  if (explicitSize !== null) {
    const match = /^(\d+)x(\d+)$/.exec(explicitSize);
    const width = Number(match?.[1]), height = Number(match?.[2]);
    if (!match || width % 16 || height % 16 || width <= 0 || height <= 0 || width > 3840 || height > 3840 || width / height < 1 / 3 || width / height > 3 || width * height < 655360 || width * height > 8294400) throw new Error('invalid explicit image size');
    if (selected.provider !== 'openai-compatible') throw new Error('explicit image size requires OpenAI-compatible connection');
  }
  const explicitRoles = value('--reference-roles')?.split(',');
  if (explicitRoles && (explicitRoles.length !== images.length || explicitRoles.some(role => !['drawing-technique-only', 'framing-only', 'individual-face-only', 'face-base-only', 'recipient-appearance-only'].includes(role)))) throw new Error('reference roles must match actual ordered images');
  if (explicitRoles?.includes('recipient-appearance-only') && (!explicitRoles.includes('drawing-technique-only') || !explicitRoles.includes('framing-only'))) throw new Error('recipient appearance preservation requires drawing technique and framing references');
  // Raw callers explicitly author --same-owner-recipient true; the role is not an identity assertion.
  const recipientAssertion = value('--same-owner-recipient');
  if (args.includes('--same-owner-recipient') && (args.filter(arg => arg === '--same-owner-recipient').length !== 1 || recipientAssertion !== 'true')) throw new Error('same-owner recipient assertion must occur once with explicit true');
  const requestRecord = await imageRequestRecord(value('--prompt'), explicitSize ?? (value('--aspect-ratio') === '3:4' ? '1024x1536' : '1024x1024'), images, selected?.imageModel, referenceBytes, explicitRoles);
  if (textOnly) Object.assign(requestRecord, { schema: 'text-only-image-generation.v1', inputMode: 'text-only', size: '1024x1536', output });
  if (value('--identity-role') === 'face-base-only' && requestRecord.references[1]) requestRecord.references[1].role = 'face-base-only';
  if (value('--expected-style-sha256') && requestRecord.references[0].sha256 !== value('--expected-style-sha256')) throw new Error('B reference hash mismatch before image request');
  if (value('--expected-identity-sha256') && requestRecord.references[1]?.sha256 !== value('--expected-identity-sha256')) throw new Error('owner photo hash mismatch before image request');
  const originalPrompt = value('--prompt');
  const background = value('--background');
  if (args.filter(arg => arg === '--background').length > 1 || args.includes('--background') && !['opaque', 'transparent'].includes(background)) throw new Error('background must be opaque or transparent');
  rejectCredentials(originalPrompt);
  let sourceContext = recipientContext(originalPrompt);
  let contextSource;
  const contextPath = value('--source-context'), expectedContextHash = value('--expected-source-context-sha256');
  if (args.filter(arg => arg === '--source-context').length > 1 || args.filter(arg => arg === '--expected-source-context-sha256').length > 1) throw new Error('duplicate source context flag');
  if (contextPath !== null || expectedContextHash !== null) {
    if (!contextPath || !isAbsolute(contextPath) || !/^[a-f0-9]{64}$/.test(expectedContextHash ?? '')) throw new Error('absolute source context and expected SHA-256 required');
    if (sourceContext !== null) throw new Error('separate source context conflicts with inline context');
    const bytes = await readFile(contextPath);
    if (sha256(bytes) !== expectedContextHash) throw new Error('source context hash mismatch before image request');
    const text = bytes.toString('utf8');
    if (!Buffer.from(text).equals(bytes)) throw new Error('source context must be UTF-8');
    sourceContext = validateSourceContext(text);
    contextSource = { path: contextPath, text, sha256: expectedContextHash };
  }
  const sourceVisualPrompt = visualInstruction(originalPrompt);
  if (contextSource) privateContextGuard(sourceVisualPrompt, sourceContext, contextPath);
  const sourceModel = designModel(sourceVisualPrompt);
  if (sourceModel && background !== null && background !== sourceModel.output.background) throw new Error('explicit background conflicts with design output');
  requestRecord.background = background ?? sourceModel?.output.background ?? 'transparent';
  if (args.includes('--same-owner-recipient') && (sourceModel || !explicitRoles?.includes('recipient-appearance-only'))) throw new Error('same-owner recipient CLI assertion requires a raw recipient-appearance-only reference; structured input uses its authored annotation');
  if (!sourceModel && explicitRoles?.includes('recipient-appearance-only')) {
    if (recipientAssertion !== 'true') throw new Error('raw recipient-appearance-only requires explicit --same-owner-recipient true caller assertion');
    for (const reference of requestRecord.references) {
      if (reference.role === 'recipient-appearance-only') reference.sameOwnerRecipient = recipientAssertion === 'true';
    }
  }
  if (sourceModel) {
    if (explicitRoles && sourceModel.references.some((reference, index) => reference.role !== explicitRoles[index])) throw new Error('explicit reference roles conflict with design references');
    if (explicitSize !== null && explicitSize !== `${sourceModel.output.width}x${sourceModel.output.height}`) throw new Error('explicit image size conflicts with design output');
    requestRecord.size = `${sourceModel.output.width}x${sourceModel.output.height}`;
    requestRecord.references.forEach((reference, index) => {
      reference.role = sourceModel.references[index]?.role;
      if (reference.role === 'recipient-appearance-only') reference.sameOwnerRecipient = sourceModel.references[index].sameOwnerRecipient;
    });
    validateDesignReferences(sourceModel, requestRecord.references);
  }
  if (compactFirst && (!completeReplacement || garmentEdit || textOnly || args.includes('--readable-first'))) throw new Error('compact transport requires a distinct validated complete replacement');
  const visualPrompt = await englishGenerationPrompt(sourceVisualPrompt, async source => {
    if (!selected.translation) throw new Error('non-English visual prompt requires an explicit translation connection');
    const translation = selected.translation;
    const response = await fetch(`${translation.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { ...(translation.apiKey ? { Authorization: `Bearer ${translation.apiKey}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: translation.model, tool_choice: 'none', messages: [
        { role: 'system', content: sourceModel ? 'Return only JSON. Translate only non-English string leaves at appearance.<slot>.<field> and recipient.ageCategory into ASCII English. Keep every key, already-English string, schema, gender, face mode, reference role/index/hash/guide binding, number, unit, null, composition and output exactly unchanged. Never derive recipient appearance from framing guides. No source context or narrative metadata may be added.' : 'Translate only the supplied visual image instructions into ASCII English. Preserve every authored slot value, slot field identifier, reference role, framing, posture and negative constraint. Do not add, omit or soften details. No source context or narrative metadata may be added.' },
        { role: 'user', content: source },
      ] }), signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`prompt translation failed: HTTP ${response.status}`);
    const result = await response.json();
    const translated = result.choices?.[0]?.message?.content;
    if (typeof translated !== 'string') throw new Error('translation connection returned no translated prompt');
    rejectCredentials(translated);
    return translated;
  });
  const transmittedVisual = args.includes('--readable-first') ? readableGenerationTransport(designModel(visualPrompt)) : visualPrompt;
  if (requestRecord.background === 'transparent' && !sourceModel) requestRecord.backgroundInstruction = transparentInstruction;
  const prompt = requestRecord.backgroundInstruction ? transparentInstruction + ' ' + transmittedVisual : transmittedVisual;
  rejectCredentials(prompt);
  if (value('--expected-style-sha256') && createHash('sha256').update(await readFile(images[0])).digest('hex') !== value('--expected-style-sha256')) throw new Error('B reference hash mismatch before image request');
  if (value('--expected-identity-sha256') && createHash('sha256').update(await readFile(images[1])).digest('hex') !== value('--expected-identity-sha256')) throw new Error('owner photo hash mismatch before image request');
  requestRecord.prompt = prompt;
  if (compactFirst) {
    const compact = prepareCompactPrompt(designModel(prompt));
    requestRecord.compactTransport = { sourceSHA: compact.sourceSHA, renderingSHA: compact.renderingSHA, textSHA: compact.textSHA, text: compact.text };
  }
  if (diagnosticModel) requestRecord.executionPurpose = 'DIAGNOSTIC-localization-not-production';
  if (promptOnlyTransparency) requestRecord.apiParameters = { endpoint: 'images/edits', model: requestRecord.model, size: requestRecord.size, n: 1, background: null, output_format: null, quality: null, moderation: null, transparencyMechanism: 'prompt-only' };
  if (contextSource && sha256(await readFile(contextPath)) !== expectedContextHash) throw new Error('source context hash mismatch before image request');
  {
    requestRecord.sourceSnapshot = {
      prompt: originalPrompt,
      promptSha256: createHash('sha256').update(originalPrompt).digest('hex'),
      recipientContext: sourceContext,
      ...(contextSource ? { schemaSource: 'separate-source-context-json', contextSource } : {}),
    };
    requestRecord.visualSnapshot = {
      sourceVisualPrompt, sourceVisualPromptSha256: createHash('sha256').update(sourceVisualPrompt).digest('hex'),
      transmittedPrompt: prompt, transmittedPromptSha256: createHash('sha256').update(prompt).digest('hex'),
      provenance: transmittedVisual.includes(readableMarker) ? 'source-bound-readable-first' : visualPrompt === sourceVisualPrompt ? 'untranslated-visual-instruction' : visualPrompt === englishIdentityGender(sourceVisualPrompt) ? 'deterministic-identity-gender' : 'translated-visual-instruction',
      transformation: 'remove-source-context-and-metadata-introduction',
    };
    validateVisualSnapshot(requestRecord);
  }
  let outputs = [], providerReceipt = null, revisedPrompt = prompt, correlation = null;
  preservationDir = `${output}.native`;
  const preservation = [];
  let providerResponse = null;
  const preserveNativeOutputs = async () => {
    if (preservationWritten) return;
    await mkdir(preservationDir, { recursive: !garmentEdit });
    published.push(preservationDir);
    for (const [index, nativeBytes] of outputs.entries()) {
      const nativePath = join(preservationDir, `image-${String(index + 1).padStart(3, '0')}.png`);
      await writeFile(nativePath, nativeBytes, { flag: 'wx' });
      preservation.push({ index: index + 1, path: nativePath, imageSha256: sha256(nativeBytes), status: 'upload-pending', outputValidationStatus: 'pending' });
    }
    preservationWritten = true;
    await writePreservation();
  };
  const writePreservation = () => writeFile(join(preservationDir, 'preservation.json'), `${JSON.stringify({ schema: 'native-output-preservation.v1', request: requestRecord, correlation, ...(providerResponse ? { providerResponse } : {}), sourceCount: outputs.length, rawCount: outputs.length, pendingCount: preservation.length, outputs: preservation }, null, 2)}\n`);
  if (selected.provider === 'codex-subscription') {
    const executable = await resolveCodexExecutable(connection);
    staging = await mkdtemp(join(dirname(resolve(output)), '.image-generate-'));
    providerReceipt = await generateCodexImage({ prompt, referencePaths: images, expectedReferenceHashes: requestRecord.references.map(reference => reference.sha256), transparentBackground: Boolean(textOnly || sourceModel?.output.rgba || /transparent RGBA PNG/.test(prompt)), output: join(staging, 'candidate.png'), executable });
    if (providerReceipt.references.length !== requestRecord.references.length || providerReceipt.references.some((reference, index) => reference.sha256 !== requestRecord.references[index].sha256)) throw new Error('Codex reference snapshot differs from design request');
    revisedPrompt = providerReceipt.revisedPrompt;
    rejectCredentials(revisedPrompt);
    validateVisualAssociation(prompt, revisedPrompt);
    if (textOnly && revisedPrompt !== prompt) throw new Error('text-only revised prompt changed');
    if (!sourceModel && !/\b(?:face|hair|body|outfit|accessories)\.[a-zA-Z]+:/.test(prompt) && revisedPrompt !== prompt) throw new Error('unstructured revised prompt changed');
    if (/[^\x00-\x7f]/.test(revisedPrompt)) throw new Error('revised prompt must remain English');
    outputs = [await readFile(join(staging, 'candidate.png'))];
  } else {
  await writeFile(`${output}.request.json`, `${JSON.stringify(requestRecord, null, 2)}\n`, { flag: 'wx' });
  published.push(`${output}.request.json`);
  requestRecordWritten = true;
  const form = new FormData();
  if (garmentEdit) {
    if (!sourceModel || textOnly || diagnosticModel || promptOnlyTransparency || requestRecord.size !== garmentEdit.size) throw new Error('garment-edit requires validated same-canvas design generation');
    form.append('mask', new Blob([garmentEdit.maskBytes], { type: 'image/png' }), 'mask.png');
  }
  form.set('model', requestRecord.model);
  form.set('prompt', requestRecord.compactTransport?.text ?? requestRecord.prompt);
  form.set('n', '1');
  form.set('size', requestRecord.size);
  if (!promptOnlyTransparency) {
    form.set('output_format', 'png');
    form.set('background', requestRecord.background);
  }
  for (const [index, path] of images.entries()) form.append('image[]', new Blob([referenceBytes[index]], { type: 'image/png' }), basename(path));
  if (garmentEdit) await garmentEdit.beforeDispatch();
  if (completeReplacement) await completeReplacement.beforeDispatch();
  if (compactFirst) validateVisualSnapshot(requestRecord);
  const dispatchedAt = new Date().toISOString();
  retainRequestRecord = true;
  const response = await fetch(`${apiBase}/images/${textOnly ? 'generations' : 'edits'}`, {
    method: 'POST', headers: { ...authorization, ...(requestId ? { 'X-Request-ID': requestId } : {}), ...(textOnly ? { 'Content-Type': 'application/json' } : {}) },
    body: textOnly ? JSON.stringify({ model: requestRecord.model, prompt: requestRecord.prompt, size: requestRecord.size, background: requestRecord.background, output_format: requestRecord.output_format, n: 1 }) : form,
    signal: AbortSignal.timeout(300000),
  });
  correlation = { requestId, dispatchedAt, responseReceivedAt: new Date().toISOString(), httpStatus: response.status, responseRequestIds: Object.fromEntries(['x-request-id', 'request-id'].map(name => {
    const id = response.headers.get(name);
    return [name, id && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) && ![selected.apiKey, selected.translation?.apiKey].filter(Boolean).some(key => id.includes(key)) ? id : null];
  })) };
  if (!response.ok) throw new Error(`image generation failed: HTTP ${response.status}`);
  const result = await response.json();
  if (!Array.isArray(result.data) || result.data.length === 0) throw new Error('image connection returned no image bytes');
  outputs = result.data.flatMap(item => typeof item?.b64_json === 'string' && item.b64_json ? [Buffer.from(item.b64_json, 'base64')] : []);
  await preserveNativeOutputs();
  if (result.model !== undefined && result.model !== selected.imageModel) {
    const responseModel = typeof result.model === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(result.model) && ![selected.apiKey, selected.translation?.apiKey].filter(Boolean).some(key => result.model.includes(key)) ? result.model : null;
    providerResponse = { model: responseModel, selectedModel: selected.imageModel, modelMatches: false };
    retainRequestRecord = true;
    for (const item of preservation) item.outputValidationStatus = 'rejected';
    await writePreservation();
    throw new Error('image response model differs from selected model');
  }
  if (outputs.length !== result.data.length) {
    for (const item of preservation) item.outputValidationStatus = 'rejected';
    await writePreservation();
    throw new Error('image connection returned no image bytes');
  }
  if (result.data[0]?.revised_prompt !== undefined) {
    revisedPrompt = result.data[0].revised_prompt;
    if (typeof revisedPrompt !== 'string') throw new Error('invalid revised prompt');
    rejectCredentials(revisedPrompt);
    if (compactFirst) {
      if (revisedPrompt !== requestRecord.compactTransport.text) throw new Error('compact revised prompt changed');
    } else validateVisualAssociation(prompt, revisedPrompt);
    if (textOnly && revisedPrompt !== prompt) throw new Error('text-only revised prompt changed');
  }
  }
  await preserveNativeOutputs();
  await writePreservation();
  if (providerReceipt) {
    const [width, height] = requestRecord.size.split('x').map(Number);
    if (providerReceipt.width !== width || providerReceipt.height !== height) { preservation[0].outputValidationStatus = 'rejected'; await writePreservation(); throw new Error('Codex output dimensions differ from request'); }
    if (providerReceipt.transparentBackground) {
      const decoded = decodeCodexPng(outputs[0]);
      if (decoded.channels !== 4 || !decoded.pixels.some((pixel, index) => index % 4 === 3 && pixel === 0)) { preservation[0].outputValidationStatus = 'rejected'; await writePreservation(); throw new Error('Codex output lacks requested transparent alpha'); }
    }
  }
  if (contextSource) privateContextGuard(revisedPrompt, sourceContext, contextPath);
  if (sourceModel || textOnly || explicitSize !== null || requestRecord.background === 'transparent') {
    for (const [index, nativeBytes] of outputs.entries()) {
      try {
        preservation[index].outputValidation = validateNativeOutput(nativeBytes, requestRecord);
        if (completeReplacement) preservation[index].paddingValidation = completeReplacement.validateOutput(nativeBytes);
        preservation[index].outputValidationStatus = 'accepted';
      } catch (validationError) {
        preservation[index].outputValidationStatus = 'rejected';
        await writePreservation();
        const error = new Error(`output dimensions/RGB or RGBA/opaque foreground differ from design request: ${validationError.message}`);
        error.outputValidation = { width: validationError.width ?? null, height: validationError.height ?? null, channels: validationError.channels ?? null, alphaChannelPresent: validationError.alphaChannelPresent ?? null, alpha255Present: validationError.alpha255Present ?? null, inherentlyOpaque: validationError.inherentlyOpaque ?? null, transparent: validationError.transparent ?? false, opaque: validationError.opaque ?? false, imageSha256: sha256(nativeBytes) };
        throw error;
      }
    }
  }
  await writePreservation();
  if (providerReceipt) {
    await writeFile(`${output}.request.json`, `${JSON.stringify(requestRecord, null, 2)}\n`, { flag: 'wx' });
    published.push(`${output}.request.json`);
  }
  const bytes = outputs[0];
  const receipt = { request: requestRecord, correlation, provider: selected.provider, model: selected.imageModel, ...(selected.modelException ? { modelException: true } : {}), revisedPrompt, ...(providerReceipt ? { providerReceipt } : {}), imageSha256: createHash('sha256').update(bytes).digest('hex'), status: 'candidate-unreviewed' };
  for (const [path, data] of [[output, bytes], [`${output}.receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`]]) {
    await writeFile(path, data, { flag: 'wx' }); published.push(path);
  }
  return { ok: true, path: output, model: requestRecord.model, referenceCount: images.length };
} catch (error) { await Promise.all(published.filter(path => !(preservationWritten && path === preservationDir) && !(retainRequestRecord && requestRecordWritten && path === `${output}.request.json`)).map(path => rm(path, { force: true, recursive: true }))); throw error; }
finally { if (staging) await rm(staging, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await runGeneration(process.argv.slice(2)))); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
