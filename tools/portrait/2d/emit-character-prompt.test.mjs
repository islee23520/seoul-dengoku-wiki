import { mkdir as mkdirEvidence } from 'node:fs/promises';
await mkdirEvidence(new URL('../../../.omo/evidence/portrait-neutral-tests/', import.meta.url), { recursive: true });
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'vitest';
import { emit, formatPrompt, generate, publicPrompt } from './emit-character-prompt.mjs';
import YAML from 'yaml';
import { portraitPng } from './test-fixtures/connection.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const shin = join(root, 'characters/shin-jongmok.json');
const iyen = join(root, 'characters/iyen.json');

test('complete garment slot retains its authored outfit design', async () => {
  const input = await fixture();
  const record = JSON.parse(await readFile(shin, 'utf8'));
  const result = await emit({ ...input, mode: 'full-body', part: 'upper' });
  assert.ok(result.partProperties.includes(record.outfit.upper.value));
  assert.equal(result.outfitId, record.outfit.id);
});

test('Iyen skirt slot retains asymmetry without trouser or symmetry requirements', async () => {
  const input = await fixture(iyen);
  const lower = await emit({ ...input, mode: 'full-body', part: 'lower' });
  assert.ok(lower.prompt.includes('비대칭'));
  assert.equal(lower.prompt.includes('both trouser legs visible'), false);
  assert.equal(lower.prompt.includes('complete symmetrical'), false);
});

test('severed limb slot is unsupported in avatar fitting inputs', async () => {
  const input = await fixture();
  await assert.rejects(emit({ ...input, mode: 'full-body', part: 'forearm_l' }), /unknown part/);
});

async function fixture(character = shin) {
  const scratch = join(root, '../../..', '.omo/evidence/pr329-tests');
  await mkdir(scratch, { recursive: true });
  const dir = await mkdtemp(join(scratch, 'portrait-template-'));
  const image = join(dir, 'reference.png');
  const bytes = Buffer.from('style fixture');
  await writeFile(image, bytes);
  const style = JSON.parse(await readFile(join(root, 'style-lock.json'), 'utf8'));
  style.referenceSha256 = createHash('sha256').update(bytes).digest('hex');
  const stylePath = join(dir, 'style.json');
  await writeFile(stylePath, JSON.stringify(style));
  return { character, faceMode: { kind: 'unique', variantId: null }, stylePath, referencePath: image };
}

test('edited wiki token preserves its variant identity and rejects a conflicting CLI ID', async () => {
  const input = await fixture();
  const token = { schemaVersion: 1, personId: 'person-1007', characterId: 'K1007', name: 'Kim', approval: 'art-proposal', variantId: 'edited-look', facts: { gender: '남성', role: 'records' }, artProposal: { face: 'face', hair: 'edited long hair', upper: 'edited coat' }, image: { sha256: 'a'.repeat(64) } };
  const path = join(root, '../../../.omo/evidence/portrait-neutral-tests', `edited-token-${createHash('sha256').update(input.referencePath).digest('hex')}.json`);
  await writeFile(path, JSON.stringify(token));
  const { character, ...styleInput } = input;
  const result = await emit({ ...styleInput, wikiToken: path, mode: 'portrait' });
  assert.equal(result.lookId, 'edited-look');
  assert.equal(result.personId, 'person-1007');
  assert.ok(result.prompt.includes('edited long hair'));
  assert.equal(result.approval, 'art-proposal');
  await writeFile(path, JSON.stringify({ ...token, generationOverrides: { gender: 'female', ageCategory: 'minor', mood: 'resolute' } }));
  const edited = await emit({ ...styleInput, wikiToken: path, mode: 'portrait', overrides: { gender: null, ageCategory: null, mood: null } });
  assert.equal(edited.choices.gender.id, 'female');
  assert.equal(edited.choices.ageCategory.id, 'minor');
  assert.equal(edited.choices.mood.id, 'resolute');
  await assert.rejects(emit({ ...styleInput, wikiToken: path, mode: 'portrait', overrides: { variantId: 'other' } }), /variant IDs must match/);
});

test('portrait and full-body share character look and style when modes differ', async () => {
  // Given one authored character and the same checked reference.
  const input = await fixture();
  // When each composition is emitted.
  const portrait = await emit({ ...input, mode: 'portrait' });
  const full = await emit({ ...input, mode: 'full-body' });
  // Then identity and outfit are shared, while the framing differs.
  assert.deepEqual([portrait.characterId, portrait.lookId, portrait.outfitId, portrait.styleId], [full.characterId, full.lookId, full.outfitId, full.styleId]);
  assert.notEqual(portrait.prompt, full.prompt);
  assert.equal(portrait.portraitShotId, 'medium-close-up-119');
  assert.equal(full.portraitShotId, null);
  assert.ok(portrait.camera.includes('medium close-up'));
  assert.equal(full.missing.includes('appearance.eyes'), true);
});

test('different characters preserve distinct authored look under the same style', async () => {
  // Given two character records and one style lock.
  const input = await fixture();
  // When the same composition is emitted for both.
  const first = await emit({ ...input, mode: 'full-body' });
  const second = await emit({ ...input, character: iyen, mode: 'full-body' });
  // Then style stays shared but the identity, outfit and prompt differ.
  assert.equal(first.styleId, second.styleId);
  assert.notEqual(first.characterId, second.characterId);
  assert.notEqual(first.outfitId, second.outfitId);
  assert.notEqual(first.prompt, second.prompt);
  assert.equal(first.mangaStyle.id, 'owner-reference');
  assert.equal(/橫山光輝|Yokoyama|hatching|airbrush/.test(first.prompt), false);
});

test('changed style image fails before a prompt is emitted', async () => {
  // Given a locked reference.
  const input = await fixture();
  await writeFile(input.referencePath, 'different');
  // When the reference bytes change, then generation fails closed.
  await assert.rejects(emit({ ...input, mode: 'portrait' }), /hash mismatch/);
});

test.each(['style-mutation', 'request-tampering'])('generation checks the parent style lock across %s', async scenario => {
  const input = await fixture();
  const calls = [];
  const output = join(input.referencePath.replace(/reference\.png$/, ''), 'mutation.png');
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    calls.push(request.url);
    response.setHeader('Content-Type', 'application/json');
    if (request.url.endsWith('/chat/completions')) {
      if (scenario === 'style-mutation') await writeFile(input.referencePath, 'changed during translation');
      const visual = JSON.parse(Buffer.concat(chunks)).messages[1].content;
      response.end(JSON.stringify({ choices: [{ message: { content: visual.replace(/[^\x00-\x7f]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')) } }] }));
    } else {
      const record = JSON.parse(await readFile(output + '.request.json', 'utf8'));
      record.references[0].sha256 = 'b'.repeat(64);
      await writeFile(output + '.request.json', JSON.stringify(record));
      response.end(JSON.stringify({ data: [{ b64_json: portraitPng().toString('base64') }] }));
    }
  });
  const connectionConfig = join(input.referencePath, '..', 'connection.json');
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1');
    await listening;
    const baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
    await writeFile(connectionConfig, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl, allowUnauthenticated: true, translation: { baseUrl, model: 'mock-text', allowUnauthenticated: true } }));
    await assert.rejects(generate({ ...input, mode: 'portrait' }, { output, connectionConfig }), scenario === 'style-mutation' ? /B reference hash mismatch before image request/ : /B reference hash mismatch in generation request/);
    assert.deepEqual(calls, scenario === 'style-mutation' ? ['/v1/chat/completions'] : ['/v1/chat/completions', '/v1/images/edits']);
    const absent = scenario === 'style-mutation' ? [output, output + '.request.json', output + '.receipt.json', output + '.json'] : [output + '.json'];
    for (const path of absent) await assert.rejects(readFile(path), { code: 'ENOENT' });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('individual poses cannot override shared pose and camera contracts', async () => {
  const input = await fixture();
  const record = JSON.parse(await readFile(iyen, 'utf8'));
  record.pose.portrait = 'raised arm selfie';
  record.pose['full-body'] = 'running pose';
  for (const mode of ['portrait', 'full-body']) {
    const first = await emit({ ...input, mode });
    const second = await emit({ ...input, character: record, mode });
    assert.equal(first.pose, second.pose);
    assert.equal(first.camera, second.camera);
    assert.equal(first.cameraContractId, second.cameraContractId);
    assert.equal(second.prompt.includes(record.pose[mode]), false);
  }
});

test('draft visual fields cannot pass strict approval', async () => {
  // Given a character with proposed appearance and absent footwear.
  const input = await fixture();
  // When strict output is requested, then no production prompt is returned.
  await assert.rejects(emit({ ...input, mode: 'full-body', strict: true }), /unapproved or incomplete/);
});

test('identity overrides of approved records are proposals and cannot pass strict approval', async () => {
  const input = await fixture();
  const record = JSON.parse(await readFile(shin, 'utf8'));
  record.sourceStatus = 'approved';
  for (const section of [record.appearance, record.outfit]) {
    for (const trait of Object.values(section)) {
      if (trait && typeof trait === 'object' && 'status' in trait) {
        trait.value ??= 'fixture';
        trait.status = 'approved';
        trait.source = 'fixture-review';
      }
    }
  }
  const character = join(input.referencePath.replace(/reference\.png$/, ''), 'approved.json');
  const style = JSON.parse(await readFile(input.stylePath, 'utf8'));
  for (const mode of ['portrait', 'full-body']) {
    const mismatched = await emit({ ...input, character: record, mode });
    assert.equal(mismatched.approval, 'art-proposal');
    await assert.rejects(emit({ ...input, character: record, mode, strict: true }), /shared pose variant is unapproved/);
  }
  const turntable = await emit({ ...input, character: record, mode: 'turntable', view: 'back' });
  assert.equal(turntable.approval, 'art-proposal');
  await assert.rejects(emit({ ...input, character: record, mode: 'turntable', view: 'back', strict: true }), /shared pose variant is unapproved/);
  const part = await emit({ ...input, character: record, mode: 'full-body', part: 'upper', strict: true });
  assert.equal(part.approval, 'approved');
  assert.equal(part.pose, null);
  record.pose = structuredClone(style.pose);
  await writeFile(character, JSON.stringify(record));
  assert.equal((await emit({ ...input, character, mode: 'portrait', strict: true })).approval, 'approved');
  for (const overrides of [{ hair: 'long-wine' }, { upper: 'black-wine-gothic' }, { ageCategory: 'minor' }]) {
    overrides.variantId = 'unapproved-fixture-variant';
    const output = await emit({ ...input, character, mode: 'portrait', overrides });
    assert.equal(output.approval, 'art-proposal');
    await assert.rejects(emit({ ...input, character, mode: 'portrait', strict: true, overrides }), /identity variant is unapproved/);
  }
});

test('turntable generation rejects missing lower clothing and footwear before invoking a provider', async () => {
  const input = await fixture();
  const record = JSON.parse(await readFile(shin, 'utf8'));
  for (const key of ['lower', 'footwear']) record.outfit[key] = { value: null, status: 'unknown', source: null };
  const character = join(input.referencePath.replace(/reference\.png$/, ''), 'missing-body.json');
  await writeFile(character, JSON.stringify(record));
  await assert.rejects(generate({ ...input, character, mode: 'turntable', view: 'front' },
    { output: join(input.referencePath.replace(/reference\.png$/, ''), 'unused.png'), generator: 'unused.py' }), /essential missing look/);
});

test('isolated upper garment uses the same checked style and character outfit', async () => {
  // Given an authored character and the shared style.
  const input = await fixture();
  // When an upper garment is requested independently.
  const result = await emit({ ...input, mode: 'full-body', part: 'upper' });
  // Then the part is isolated but bound to that character and outfit.
  assert.equal(result.part, 'upper');
  assert.equal(result.outfitId, 'shin-field-outfit-study-1');
  assert.equal(result.styleId, (await emit({ ...input, mode: 'portrait' })).styleId);
  assert.equal(result.camera.axis, 'front orthographic');
  assert.equal(result.pose, null);
});

test('unspecified equipment cannot be silently generated as a separate part', async () => {
  const input = await fixture();
  await assert.rejects(emit({ ...input, mode: 'full-body', part: 'equipment' }), /has no specified value/);
});

test('unapproved equipped weapon is rejected rather than inferred from skill', async () => {
  // Given a record with an unapproved equipped item.
  const input = await fixture();
  const record = JSON.parse(await readFile(shin, 'utf8'));
  record.equipment.equipped.push({ id: 'rifle', description: 'rifle', status: 'art-proposal', source: 'draft' });
  const altered = join(input.referencePath.replace(/reference\.png$/, ''), 'character.json');
  await writeFile(altered, JSON.stringify(record));
  // When it is emitted, then the equipment boundary rejects it.
  await assert.rejects(emit({ ...input, character: altered, mode: 'portrait' }), /equipped item must be approved/);
});

test('mood variant keeps identity and outfit but changes look id for both framing modes', async () => {
  const input = await fixture();
  const overrides = { mood: 'resolute', variantId: 'shin-resolute-study' };
  const portrait = await emit({ ...input, mode: 'portrait', overrides });
  const full = await emit({ ...input, mode: 'full-body', overrides });
  assert.equal(portrait.lookId, 'shin-resolute-study');
  assert.equal(full.lookId, portrait.lookId);
  assert.equal(full.outfitId, portrait.outfitId);
  assert.equal(full.choices.mood.id, 'resolute');
});

test('registered character gender variant needs separate id and stays draft', async () => {
  const input = await fixture();
  await assert.rejects(emit({ ...input, mode: 'portrait', overrides: { gender: 'female' } }), /variant-id/);
  const altered = await emit({ ...input, mode: 'portrait', overrides: { gender: 'female', variantId: 'shin-female-study' } });
  assert.equal(altered.lookId, 'shin-female-study');
  assert.equal(altered.baseLookId, 'shin-opening-study-1');
  assert.equal(altered.choices.gender.label, '여성');
  await assert.rejects(emit({ ...input, mode: 'portrait', strict: true, overrides: { gender: 'female', variantId: 'shin-female-study' } }), /gender override/);
});

test('age-category variant is distinct and unapproved values remain visible', async () => {
  const input = await fixture();
  const output = await emit({ ...input, mode: 'full-body', overrides: { ageCategory: 'minor', variantId: 'shin-minor-study' } });
  assert.equal(output.lookId, 'shin-minor-study');
  assert.equal(output.choices.ageCategory.id, 'minor');
  assert.equal(output.approval, 'art-proposal');
});

test('schema rejects an unknown property instead of silently discarding it', async () => {
  const input = await fixture();
  const record = JSON.parse(await readFile(shin, 'utf8'));
  record.appearance.unreviewedAccessory = 'unapproved crest';
  const altered = join(input.referencePath.replace(/reference\.png$/, ''), 'malformed-character.json');
  await writeFile(altered, JSON.stringify(record));
  await assert.rejects(emit({ ...input, character: altered, mode: 'portrait' }), /character schema/);
});

test('existing generated image is never overwritten', async () => {
  const input = await fixture();
  const output = join(input.referencePath.replace(/reference\.png$/, ''), 'already.png');
  await writeFile(output, 'original image');
  await assert.rejects(generate({ ...input, mode: 'portrait' }, { output, generator: 'unused.py' }), /output already exists/);
  assert.equal(await readFile(output, 'utf8'), 'original image');
});

test('hair and upper replacements share one variant across portrait, body and parts', async () => {
  const input = await fixture();
  const overrides = { hair: 'long-wine', upper: 'black-wine-gothic', variantId: 'shin-crosslook-study' };
  const portrait = await emit({ ...input, mode: 'portrait', overrides });
  const body = await emit({ ...input, mode: 'full-body', overrides });
  const hair = await emit({ ...input, mode: 'full-body', part: 'hair', overrides });
  const upper = await emit({ ...input, mode: 'full-body', part: 'upper', overrides });
  assert.equal(portrait.lookId, body.lookId);
  assert.equal(body.outfitId, upper.outfitId);
  assert.equal(hair.lookId, upper.lookId);
  assert.equal(body.choices.hair.id, 'long-wine');
  assert.equal(body.choices.upper.id, 'black-wine-gothic');
  assert.notEqual(body.outfitId, 'shin-field-outfit-study-1');
});

test('hair replacement requires a distinct variant instead of rewriting the source', async () => {
  const input = await fixture();
  await assert.rejects(emit({ ...input, mode: 'portrait', overrides: { hair: 'long-wine' } }), /variant-id/);
});

test('turntable views retain one look and full-shot size while changing angle', async () => {
  const input = await fixture();
  const views = await Promise.all(['front', 'profile', 'side', 'back'].map((view) => emit({ ...input, mode: 'turntable', view })));
  assert.equal(new Set(views.map((item) => item.lookId)).size, 1);
  assert.equal(new Set(views.map((item) => item.outfitId)).size, 1);
  assert.equal(new Set(views.map((item) => item.camera)).size, 4);
  assert.ok(views.every((item) => item.camera.includes('top of head to soles of feet')));
  await assert.rejects(emit({ ...input, mode: 'turntable' }), /turntable requires/);
});

test('same person switches manga treatment without replacing identity or outfit', async () => {
  const input = await fixture();
  const original = await emit({ ...input, mode: 'portrait' });
  const alternative = await emit({ ...input, mode: 'portrait', mangaStyle: 'owner-reference' });
  assert.equal(original.characterId, alternative.characterId);
  assert.equal(original.lookId, alternative.lookId);
  assert.equal(original.outfitId, alternative.outfitId);
  assert.equal(original.camera, alternative.camera);
  assert.equal(original.styleId, alternative.styleId);
  assert.equal(original.prompt, alternative.prompt);
});

test('JSON and YAML encode the same selected design token values', async () => {
  const input = await fixture();
  const result = await emit({ ...input, mode: 'portrait', mangaStyle: 'owner-reference' });
  assert.deepEqual(YAML.parse(formatPrompt(result, 'yaml')), JSON.parse(formatPrompt(result, 'json')));
});

test('public prompt omits local paths and credentials while preserving tokens', async () => {
  const input = await fixture();
  const result = await emit({ ...input, mode: 'portrait' });
  const exposed = publicPrompt({ ...result, imagePath: '/private/portrait.png', apiKey: undefined });
  assert.equal(exposed.referencePath, undefined);
  assert.equal(exposed.imagePath, undefined);
  assert.equal(exposed.styleId, result.styleId);
  assert.equal(exposed.referenceSha256, result.referenceSha256);
});

test('wiki token keeps its own ruler role instead of a template occupation', async () => {
  const input = await fixture();
  const tokenPath = join(input.referencePath.replace(/reference\.png$/, ''), 'wiki-token.json');
  await writeFile(tokenPath, JSON.stringify({ schemaVersion: 1, personId: 'person-0001', characterId: 'K001', name: '한재목', approval: 'art-proposal', facts: { gender: '남성', role: '수문국 선출 군주' }, artProposal: { face: '넓은 눈썹', hair: '짧은 검은 머리', upper: '회색 작업 외투' }, image: { sha256: 'a'.repeat(64) } }));
  const result = await emit({ stylePath: input.stylePath, referencePath: input.referencePath, wikiToken: tokenPath, mode: 'portrait' });
  assert.ok(result.prompt.includes('수문국 선출 군주'));
  assert.ok(!result.prompt.includes('귀환망 현장 계약자'));
  assert.equal(result.choices.occupation.label, '수문국 선출 군주');
  assert.equal(result.approval, 'art-proposal');
});
