import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { EventEmitter, once } from 'node:events';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test, vi, afterEach } from 'vitest';
import { visualInstruction, validateVisualSnapshot } from './cliproxy-edit.mjs';
import { neutralRecord } from '../neutral-slots.mjs';
import { emit, generate, generationRequest, publicPrompt } from './emit-character-prompt.mjs';

const provider = vi.hoisted(() => ({ calls: 0, run: null }));
vi.mock('node:child_process', async importOriginal => ({
  ...await importOriginal(),
  spawn: (...args) => { provider.calls++; return provider.run(...args); },
}));
const root = fileURLToPath(new URL('.', import.meta.url));
const snapshot = {
  characterId: 'K1009', name: '신종목', personId: 'person-1009',
  registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: '' },
  background: [{ path: 'lore/characters/card.json', pointer: '/content/0', sha256: '', text: 'Authored background with "quoted" text\nand a newline.' }],
};
const birthContext = { birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31', source: 'verified binder' };
const registryBytes = JSON.stringify({ persons: [{ id: snapshot.characterId, name: snapshot.name }] });
const backgroundBytes = JSON.stringify({ content: [{ ko: snapshot.background[0].text }] });
snapshot.registry.sha256 = createHash('sha256').update(registryBytes).digest('hex');
snapshot.background[0].sha256 = createHash('sha256').update(backgroundBytes).digest('hex');
const directories = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function fixture() {
  const base = fileURLToPath(new URL('../../../.omo/evidence/canonical-context-tests/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'run-'));
  directories.push(dir);
  for (const folder of ['lore/name-pools', 'lore/characters', 'public/person-details']) await mkdir(join(dir, folder), { recursive: true });
  await writeFile(join(dir, snapshot.registry.path), registryBytes);
  await writeFile(join(dir, snapshot.background[0].path), backgroundBytes);
  await writeFile(join(dir, 'lore/name-pools/cast-birthdays.json'), JSON.stringify({ ageAsOf: birthContext.ageAsOf, people: [{ id: snapshot.characterId, name: snapshot.name, birthDate: birthContext.birthDate }] }));
  await writeFile(join(dir, `public/person-details/${snapshot.personId}.json`), JSON.stringify({ id: snapshot.personId, name: snapshot.name, detailRoute: `/people/${snapshot.personId}`, familyTree: { personId: snapshot.characterId }, ...birthContext }));
  const character = JSON.parse(await readFile(join(root, 'characters/shin-jongmok.json'), 'utf8'));
  character.outfit.upper.value = character.outfit.upper.value.replace('신종목', 'recipient');
  Object.assign(character, { personId: snapshot.personId, canonicalContext: structuredClone(snapshot), birthContext: structuredClone(birthContext), faceMode: { kind: 'unique', variantId: null } });
  character.identity = { characterId: snapshot.characterId, name: snapshot.name };
  const bytes = Buffer.from('selected style fixture');
  const referencePath = join(dir, 'style.png');
  const stylePath = join(dir, 'style.json');
  await writeFile(referencePath, bytes);
  await writeFile(stylePath, JSON.stringify({ styleId: 'fixture', status: 'owner-selected-reference', referenceSha256: createHash('sha256').update(bytes).digest('hex') }));
  return { dir, input: { character, canonicalRoot: dir, mode: 'portrait', referencePath, stylePath } };
}
function serialized(prompt) {
  return JSON.parse(prompt.split('\nserializedRecipientContext=')[1].split('\n')[0]);
}
test('neutral conversion and face selection retain snapshots without altering authored slots', async () => {
  const { input } = await fixture();
  const plain = structuredClone(input.character);
  delete plain.canonicalContext;
  delete plain.birthContext;
  const baseline = neutralRecord(plain);
  const neutral = neutralRecord(input.character);
  assert.deepEqual(neutralRecord(neutral), neutral);
  const emitted = await emit(input);
  for (const result of [neutral, emitted]) {
    assert.deepEqual(result.canonicalContext, snapshot);
    assert.deepEqual(result.birthContext, birthContext);
    assert.deepEqual(result.slots, baseline.slots);
    assert.deepEqual(result.identity, baseline.identity);
  }
  assert.equal(emitted.identity.ethnicity.value, null);
  assert.equal(emitted.identity.origin.value, null);
  neutral.canonicalContext.background[0].text = 'mutated copy';
  neutral.birthContext.age = 0;
  assert.deepEqual(input.character.canonicalContext, snapshot);
  assert.deepEqual(input.character.birthContext, birthContext);
});
test('fresh CLI process serializes identity birth and exact excerpts into request arguments', async () => {
  const { dir, input } = await fixture();
  const path = join(dir, 'input.json');
  await writeFile(path, JSON.stringify(input.character));
  const { stdout } = await promisify(execFile)(process.execPath, [join(root, 'emit-character-prompt.mjs'), '--character', path, '--canonical-root', dir, '--mode', 'portrait', '--reference', input.referencePath, '--style', input.stylePath]);
  const result = JSON.parse(stdout);
  const request = generationRequest(result, { output: join(dir, 'unused.png') });
  assert.deepEqual(request.canonicalContext, snapshot);
  assert.deepEqual(request.birthContext, birthContext);
  assert.deepEqual(serialized(request.argv[request.argv.indexOf('--prompt') + 1]), {
    characterId: snapshot.characterId, name: snapshot.name, personId: snapshot.personId,
    birthDate: birthContext.birthDate, age: birthContext.age, ageAsOf: birthContext.ageAsOf, excerpts: snapshot.background.map(item => item.text),
    canonicalContext: snapshot, birthContext,
  });
});
test('generation fake observes serialized context in actual request and retained receipt', async () => {
  const { dir, input } = await fixture();
  const output = join(dir, 'fake.png');
  provider.run = (command, argv) => {
    assert.equal(command, process.execPath);
    const child = new EventEmitter();
    child.stderr = new EventEmitter();
    queueMicrotask(async () => {
      try {
        const prompt = argv[argv.indexOf('--prompt') + 1];
        await writeFile(output, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const visual = visualInstruction(prompt);
        const hash = value => createHash('sha256').update(value).digest('hex');
        await writeFile(output + '.request.json', JSON.stringify({ prompt: visual, model: 'fake', sourceSnapshot: { prompt, promptSha256: hash(prompt), recipientContext: serialized(prompt) }, visualSnapshot: { sourceVisualPrompt: visual, sourceVisualPromptSha256: hash(visual), transmittedPrompt: visual, transmittedPromptSha256: hash(visual), provenance: 'untranslated-visual-instruction' }, references: [{ sha256: hash(await readFile(input.referencePath)) }] }));
        child.emit('close', 0);
      } catch (error) { child.emit('error', error); }
    });
    return child;
  };
  const before = provider.calls;
  const receipt = await generate(input, { output });
  assert.equal(provider.calls, before + 1);
  const actual = JSON.parse(await readFile(output + '.request.json', 'utf8'));
  assert.deepEqual(actual.sourceSnapshot.recipientContext.excerpts, snapshot.background.map(item => item.text));
  assert.equal(actual.prompt.includes('serializedRecipientContext='), false);
  assert.deepEqual(receipt.canonicalContext, snapshot);
  assert.deepEqual(receipt.birthContext, birthContext);
});
test.each(['characterId', 'name', 'personId'])('contradictory %s fails before generation spawn', async key => {
  const { dir, input } = await fixture();
  const before = provider.calls;
  for (const target of [input.character, input.character.identity, input.character.canonicalContext]) {
    const original = target[key];
    target[key] = 'contradiction';
    await assert.rejects(generate(input, { output: join(dir, 'never.png') }), new RegExp(`canonical context ${key} mismatch`));
    if (original === undefined) delete target[key]; else target[key] = original;
  }
  assert.equal(provider.calls, before);
});
test('template face selection preserves context and recipient cosmetic and non-face slots', async () => {
  const { dir, input } = await fixture();
  const character = input.character;
  Object.assign(character, { characterId: 'K002', name: 'Fixture', personId: 'person-0002' });
  const bytes = JSON.stringify({ persons: [{ id: character.characterId, name: character.name }] });
  await writeFile(join(dir, snapshot.registry.path), bytes);
  character.canonicalContext.registry.sha256 = createHash('sha256').update(bytes).digest('hex');
  await writeFile(join(dir, 'lore/name-pools/cast-birthdays.json'), JSON.stringify({ ageAsOf: birthContext.ageAsOf, people: [{ id: character.characterId, name: character.name, birthDate: birthContext.birthDate }] }));
  await writeFile(join(dir, `public/person-details/${character.personId}.json`), JSON.stringify({ id: character.personId, name: character.name, detailRoute: `/people/${character.personId}`, familyTree: { personId: character.characterId }, ...birthContext }));
  character.identity = { characterId: character.characterId, name: character.name, gender: 'male' };
  Object.assign(character.canonicalContext, { characterId: character.characterId, name: character.name, personId: character.personId });
  character.appearance.skin = { value: 'authored skin', status: 'art-proposal', source: 'fixture' };
  const base = neutralRecord(character);
  character.faceMode = { kind: 'template', variantId: 'fixture-face' };
  character.faceSelection = { gender: 'male', ancestry: 'art-group', source: 'explicit selection', skinTone: base.slots.body.skin };
  await writeFile(join(dir, 'lore/name-pools/face-seed-eligibility.json'), JSON.stringify({ schemaVersion: 1, people: [{ characterId: character.characterId, name: character.name, ancestry: 'art-group', ancestorId: character.characterId, source: { path: snapshot.background[0].path, pointer: snapshot.background[0].pointer + '/ko', sha256: snapshot.background[0].sha256, quote: snapshot.background[0].text } }] }));
  await writeFile(join(dir, `public/person-details/${character.personId}.json`), JSON.stringify({ id: character.personId, name: character.name, detailRoute: `/people/${character.personId}`, familyTree: { personId: character.characterId, nodes: [{ id: character.characterId }], edges: [] }, ...birthContext }));
  const catalog = join(dir, 'catalog.json');
  await writeFile(catalog, JSON.stringify({ schemaVersion: 1, variants: [{ id: 'fixture-face', gender: 'male', ancestry: 'art-group', source: 'fixture', face: { description: { value: 'selected face', status: 'art-proposal', source: 'fixture' } }, referenceImagePath: null, referenceImageSha256: null }] }));
  const result = await emit({ ...input, faceVariantCatalogPath: catalog });
  assert.deepEqual(result.canonicalContext, character.canonicalContext);
  assert.deepEqual(result.birthContext, birthContext);
  for (const slot of ['hair', 'body', 'outfit', 'accessories']) assert.deepEqual(result.slots[slot], base.slots[slot]);
  for (const key of ['eyeColor', 'lipColor', 'beardShape']) if (base.slots.face[key].value !== null) assert.deepEqual(result.slots.face[key], base.slots.face[key]);
  assert.equal(result.identity.ethnicity.value, null);
  const request = generationRequest(result, { output: join(dir, 'unused-template.png') });
  assert.deepEqual(serialized(request.argv[request.argv.indexOf('--prompt') + 1]).excerpts, snapshot.background.map(item => item.text));
});

test.each(['date', 'age', 'asOf', 'sha', 'pointer', 'background', 'registryName', 'personRoute', 'missingSource', 'alteredSource', 'missingRoot', 'wrongRoot', 'absolutePath', 'outsideRoot'])('invalid canonical %s rejects before generation spawn', async kind => {
  const { dir, input } = await fixture();
  const before = provider.calls;
  if (kind === 'date') input.character.birthContext.birthDate = '2090-02-31';
  if (kind === 'age') input.character.birthContext.age++;
  if (kind === 'asOf') input.character.birthContext.ageAsOf = '2127-12-31';
  if (kind === 'sha') input.character.canonicalContext.registry.sha256 = '0'.repeat(64);
  if (kind === 'pointer') input.character.canonicalContext.registry.pointer = '/persons/9';
  if (kind === 'background') input.character.canonicalContext.background[0].text += 'invented';
  if (kind === 'registryName') {
    const bytes = JSON.stringify({ persons: [{ id: snapshot.characterId, name: 'wrong' }] });
    await writeFile(join(dir, snapshot.registry.path), bytes);
    input.character.canonicalContext.registry.sha256 = createHash('sha256').update(bytes).digest('hex');
  }
  if (kind === 'personRoute') input.character.personId = input.character.canonicalContext.personId = 'person-wrong';
  if (kind === 'missingSource') await rm(join(dir, snapshot.background[0].path));
  if (kind === 'alteredSource') await writeFile(join(dir, snapshot.background[0].path), '{}');
  if (kind === 'missingRoot') delete input.canonicalRoot;
  if (kind === 'wrongRoot') input.canonicalRoot = join(dir, 'public');
  if (kind === 'absolutePath') input.character.canonicalContext.registry.path = join(dir, snapshot.registry.path);
  if (kind === 'outsideRoot') input.character.canonicalContext.registry.path = '../registry.json';
  await assert.rejects(generate(input, { output: join(dir, 'never.png') }));
  assert.equal(provider.calls, before);
});

test.each(['valid', 'characterId', 'personId', 'birthDate', 'age', 'ageAsOf', 'source', 'registryPath', 'registryPointer', 'registrySha', 'backgroundPath', 'backgroundPointer', 'backgroundSha'])('normal emitter to fresh translation CLI preserves provenance: %s', async mutation => {
  const { dir, input } = await fixture();
  const characterPath = join(dir, 'input.json');
  await writeFile(characterPath, JSON.stringify(input.character));
  const env = Object.fromEntries(['PATH', 'TMPDIR', 'LANG'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  env.HOME = dir;
  const { stdout } = await promisify(execFile)(process.execPath, [join(root, 'emit-character-prompt.mjs'), '--character', characterPath, '--canonical-root', dir, '--mode', 'portrait', '--reference', input.referencePath, '--style', input.stylePath], { env, timeout: 20000 });
  const result = JSON.parse(stdout);
  const output = join(dir, 'local-candidate.png');
  const request = generationRequest(result, { output });
  const originalPrompt = request.argv[request.argv.indexOf('--prompt') + 1];
  const original = serialized(originalPrompt);
  assert.deepEqual(original.canonicalContext, input.character.canonicalContext);
  assert.deepEqual(original.birthContext, input.character.birthContext);
  assert.equal(JSON.stringify(publicPrompt(result)).includes(dir), false);
  const derivative = structuredClone(original);
  derivative.name = derivative.canonicalContext.name = 'Translated recipient';
  derivative.excerpts = ['Translated background'];
  derivative.canonicalContext.background[0].text = 'Translated background';
  if (['characterId', 'personId', 'birthDate', 'age', 'ageAsOf'].includes(mutation)) derivative[mutation] = mutation === 'age' ? 37 : 'corrupted';
  if (mutation === 'source') derivative.birthContext.source = 'corrupted';
  for (const [prefix, item] of [['registry', derivative.canonicalContext.registry], ['background', derivative.canonicalContext.background[0]]]) {
    for (const [suffix, key] of [['Path', 'path'], ['Pointer', 'pointer'], ['Sha', 'sha256']]) if (mutation === prefix + suffix) item[key] = 'corrupted';
  }
  const ascii = value => value.replace(/[^\x00-\x7f]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
  const translated = mutation === 'valid' ? ascii(visualInstruction(originalPrompt)) : ascii('serializedRecipientContext=' + JSON.stringify(derivative));
  const calls = [];
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ioAAAAASUVORK5CYII=', 'base64');
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/v1/chat/completions') {
      const body = JSON.parse(bytes);
      calls.push({ url: req.url, originalPrompt: body.messages[1].content });
      res.end(JSON.stringify({ choices: [{ message: { content: translated } }] }));
    } else if (req.url === '/v1/images/edits') {
      const form = await new Response(bytes, { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
      calls.push({ url: req.url, prompt: form.get('prompt') });
      res.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
    } else { res.statusCode = 404; res.end('{}'); }
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(20000) });
    server.listen(0, '127.0.0.1');
    await listening;
    Object.assign(env, { CHARACTER_AI_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`, CHARACTER_AI_IMAGE_MODEL: 'local-image', CHARACTER_AI_TRANSLATION_MODEL: 'local-text', CHARACTER_AI_API_KEY: '' });
    if (mutation !== 'valid') {
      await assert.rejects(promisify(execFile)(request.command, request.argv, { env, timeout: 20000 }), error => error.code === 2 && /recipient context machine fields changed/.test(error.stderr));
      assert.equal(calls.filter(call => call.url === '/v1/images/edits').length, 0);
      await assert.rejects(readFile(output + '.request.json'), { code: 'ENOENT' });
    } else {
      await promisify(execFile)(request.command, request.argv, { env, timeout: 20000 });
      const metadata = JSON.parse(await readFile(output + '.request.json', 'utf8'));
      const receipt = JSON.parse(await readFile(output + '.receipt.json', 'utf8'));
      assert.deepEqual(metadata.sourceSnapshot.recipientContext, original);
      assert.deepEqual(Buffer.from(metadata.sourceSnapshot.prompt), Buffer.from(originalPrompt));
      assert.equal(metadata.sourceSnapshot.promptSha256, createHash('sha256').update(originalPrompt).digest('hex'));
      assert.deepEqual(metadata.sourceSnapshot.recipientContext.canonicalContext, snapshot);
      assert.deepEqual(metadata.sourceSnapshot.recipientContext.birthContext, birthContext);
      validateVisualSnapshot(metadata);
      assert.equal(metadata.prompt.includes('serializedRecipientContext='), false);
      assert.ok(['translated-visual-instruction', 'untranslated-visual-instruction'].includes(metadata.visualSnapshot.provenance));
      assert.deepEqual(receipt.request, metadata);
      assert.equal(/[^\x00-\x7f]/.test(metadata.prompt), false);
      assert.equal(calls[1].prompt, metadata.prompt.replace(/\r?\n/g, '\r\n'));
      assert.equal(metadata.references[0].sha256, result.referenceSha256);
      assert.deepEqual(input.character.canonicalContext, snapshot);
      assert.deepEqual(input.character.birthContext, birthContext);
    }
    assert.equal(calls[0].originalPrompt, visualInstruction(originalPrompt));
    assert.equal(calls.length, mutation === 'valid' ? 2 : 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(server.listening, false);
  }
});
