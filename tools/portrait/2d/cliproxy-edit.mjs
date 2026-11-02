#!/usr/bin/env node
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function recipientContext(prompt) {
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

export function validateVisualSnapshot(request) {
  const snapshot = request.visualSnapshot;
  if (!snapshot) return;
  if (![snapshot.sourceVisualPrompt, snapshot.transmittedPrompt].every(value => typeof value === 'string' && value.length)) throw new Error('visual instruction required');
  const digest = value => createHash('sha256').update(value).digest('hex');
  if (!request.sourceSnapshot || digest(request.sourceSnapshot.prompt) !== request.sourceSnapshot.promptSha256 || JSON.stringify(recipientContext(request.sourceSnapshot.prompt)) !== JSON.stringify(request.sourceSnapshot.recipientContext) || visualInstruction(request.sourceSnapshot.prompt) !== snapshot.sourceVisualPrompt || digest(snapshot.sourceVisualPrompt) !== snapshot.sourceVisualPromptSha256 || digest(request.prompt) !== snapshot.transmittedPromptSha256 || snapshot.transmittedPrompt !== request.prompt || recipientContext(request.prompt) !== null) throw new Error('visual/source snapshot binding mismatch');
  const context = request.sourceSnapshot.recipientContext;
  const privateValues = [context.name, context.canonicalContext?.registry?.path, context.canonicalContext?.registry?.sha256, ...(context.excerpts ?? []), ...(context.canonicalContext?.background ?? []).flatMap(item => [item.path, item.sha256, item.text])].filter(value => typeof value === 'string' && value.length);
  if (privateValues.some(value => request.prompt.includes(value))) throw new Error('source metadata leaked into transmitted visual instruction');
  validateVisualAssociation(snapshot.sourceVisualPrompt, request.prompt);
  if (snapshot.provenance === 'deterministic-identity-gender') {
    if (snapshot.sourceVisualPrompt === request.prompt || englishIdentityGender(snapshot.sourceVisualPrompt) !== request.prompt || /[^\x00-\x7f]/.test(request.prompt)) throw new Error('visual translation provenance mismatch');
  } else if (snapshot.provenance === 'untranslated-visual-instruction' ? snapshot.sourceVisualPrompt !== request.prompt : snapshot.provenance !== 'translated-visual-instruction' || snapshot.sourceVisualPrompt === request.prompt || /[^\x00-\x7f]/.test(request.prompt)) throw new Error('visual translation provenance mismatch');
}

function machineFields(context) {
  if (Array.isArray(context)) return context.map(machineFields);
  if (context && typeof context === 'object') return Object.fromEntries(Object.keys(context).sort().filter(key => !['name', 'excerpts', 'text'].includes(key)).map(key => [key, machineFields(context[key])]));
  return context;
}

function validateVisualAssociation(source, transmitted) {
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

export function userConnection(environment = process.env) {
  if (!environment.CHARACTER_AI_BASE_URL) return null;
  const url = new URL(environment.CHARACTER_AI_BASE_URL);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('AI endpoint must use HTTP or HTTPS');
  if (!environment.CHARACTER_AI_IMAGE_MODEL || !environment.CHARACTER_AI_TRANSLATION_MODEL) throw new Error('user image and translation models required');
  return { baseUrl: url.href.replace(/\/$/, ''), apiKey: environment.CHARACTER_AI_API_KEY ?? '', imageModel: environment.CHARACTER_AI_IMAGE_MODEL, translationModel: environment.CHARACTER_AI_TRANSLATION_MODEL };
}

export async function imageRequestRecord(prompt, size, paths, model = 'gpt-image-2.5-sunburst', referenceBytes = null) {
  const bytes = referenceBytes ?? await Promise.all(paths.map(path => readFile(path)));
  return {
    schemaVersion: 1, model, prompt, size, n: 1,
    references: await Promise.all(paths.map(async (path, index) => ({
      index: index + 1,
      role: index === 0 ? 'style-only' : index === 1 ? 'identity-only' : 'additional-reference',
      sha256: createHash('sha256').update(bytes[index]).digest('hex'),
    }))),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const args = process.argv.slice(2);
const value = flag => { const at = args.indexOf(flag); return at < 0 ? null : args[at + 1]; };
try {
  const selected = userConnection();
  const config = selected ?? JSON.parse(await readFile(join(homedir(), '.omo/cliproxy.json'), 'utf8'));
  const key = config.apiKey ?? JSON.parse(await readFile(join(homedir(), '.omo/auth.json'), 'utf8')).cpa.key;
  const apiBase = selected ? selected.baseUrl : `${config.baseUrl.replace(/\/$/, '')}/v1`;
  const authorization = key ? { Authorization: `Bearer ${key}` } : {};
  const images = args.flatMap((arg, i) => arg === '--image' ? [args[i + 1]] : []);
  if (!images.length || !value('--prompt') || !value('-o')) throw new Error('reference images, prompt and new output required');
  const output = value('-o');
  for (const path of [output, `${output}.request.json`, `${output}.receipt.json`]) {
    try { await stat(path); throw new Error(`output already exists: ${path}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const referenceBytes = await Promise.all(images.map(path => readFile(path)));
  const requestRecord = await imageRequestRecord(value('--prompt'), value('--aspect-ratio') === '3:4' ? '1024x1536' : '1024x1024', images, selected?.imageModel, referenceBytes);
  if (value('--identity-role') === 'face-base-only' && requestRecord.references[1]) requestRecord.references[1].role = 'face-base-only';
  if (value('--expected-style-sha256') && requestRecord.references[0].sha256 !== value('--expected-style-sha256')) throw new Error('B reference hash mismatch before image request');
  if (value('--expected-identity-sha256') && requestRecord.references[1]?.sha256 !== value('--expected-identity-sha256')) throw new Error('owner photo hash mismatch before image request');
  const originalPrompt = value('--prompt');
  const sourceContext = recipientContext(originalPrompt);
  const sourceVisualPrompt = visualInstruction(originalPrompt);
  const prompt = await englishGenerationPrompt(sourceVisualPrompt, async source => {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST', headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selected?.translationModel ?? 'gpt-6-sol', tool_choice: 'none', messages: [
        { role: 'system', content: 'Translate only the supplied visual image instructions into ASCII English. Preserve every authored slot value, slot field identifier, reference role, framing, posture and negative constraint. Do not add, omit or soften details. No source context or narrative metadata may be added.' },
        { role: 'user', content: source },
      ] }), signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`CLIProxy prompt translation failed: HTTP ${response.status}`);
    const result = await response.json();
    const translated = result.choices?.[0]?.message?.content;
    if (typeof translated !== 'string') throw new Error('CLIProxy returned no translated prompt');
    return translated;
  });
  if (value('--expected-style-sha256') && createHash('sha256').update(await readFile(images[0])).digest('hex') !== value('--expected-style-sha256')) throw new Error('B reference hash mismatch before image request');
  if (value('--expected-identity-sha256') && createHash('sha256').update(await readFile(images[1])).digest('hex') !== value('--expected-identity-sha256')) throw new Error('owner photo hash mismatch before image request');
  requestRecord.prompt = prompt;
  if (sourceContext !== null) {
    requestRecord.sourceSnapshot = {
      prompt: originalPrompt,
      promptSha256: createHash('sha256').update(originalPrompt).digest('hex'),
      recipientContext: sourceContext,
    };
    requestRecord.visualSnapshot = {
      sourceVisualPrompt, sourceVisualPromptSha256: createHash('sha256').update(sourceVisualPrompt).digest('hex'),
      transmittedPrompt: prompt, transmittedPromptSha256: createHash('sha256').update(prompt).digest('hex'),
      provenance: prompt === sourceVisualPrompt ? 'untranslated-visual-instruction' : prompt === englishIdentityGender(sourceVisualPrompt) ? 'deterministic-identity-gender' : 'translated-visual-instruction',
      transformation: 'remove-source-context-and-metadata-introduction',
    };
    validateVisualSnapshot(requestRecord);
  }
  await writeFile(`${output}.request.json`, `${JSON.stringify(requestRecord, null, 2)}\n`, { flag: 'wx' });
  const form = new FormData();
  form.set('model', requestRecord.model);
  form.set('prompt', requestRecord.prompt);
  form.set('n', '1');
  form.set('size', requestRecord.size);
  for (const [index, path] of images.entries()) form.append('image[]', new Blob([referenceBytes[index]], { type: 'image/png' }), basename(path));
  const response = await fetch(`${apiBase}/images/edits`, {
    method: 'POST', headers: authorization, body: form, signal: AbortSignal.timeout(300000),
  });
  if (!response.ok) throw new Error(`CLIProxy image edit failed: HTTP ${response.status}`);
  const result = await response.json();
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) throw new Error('CLIProxy returned no image bytes');
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('CLIProxy output is not PNG');
  await writeFile(value('-o'), bytes, { flag: 'wx' });
  const receipt = { request: requestRecord, imageSha256: createHash('sha256').update(bytes).digest('hex'), status: 'candidate-unreviewed' };
  await writeFile(`${output}.receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ ok: true, path: value('-o'), model: requestRecord.model, referenceCount: images.length }));
} catch (error) { console.error(error.message); process.exitCode = 2; }
}
