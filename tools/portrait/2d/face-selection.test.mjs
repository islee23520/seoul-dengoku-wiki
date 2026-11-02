import assert from 'node:assert/strict';
import { test } from 'vitest';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neutralRecord } from '../neutral-slots.mjs';
import { selectFace, uniqueFaceIds } from './face-selection.mjs';
import { emit, generate, generationRequest, publicPrompt } from './emit-character-prompt.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { run } from '../bin/seoul-character.mjs';
import { generateSet } from './generate-character-set.mjs';
import { startServer } from './server.mjs';
import { once } from 'node:events';
const trait = value => ({ value, status: 'authored-draft', source: 'test-authored' });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const input = () => ({ schemaVersion: 2, characterId: 'K500', name: 'renamable recipient', identity: { gender: trait('male'), ethnicity: trait('Korean') }, faceMode: { kind: 'template', variantId: 'east-asian-male-01' }, faceSelection: { gender: 'male', ancestry: 'east-asian', source: 'authored-recipient-group-selection', skinTone: trait('authored independent tone') }, slots: { face: { description: trait('individual face') }, hair: { description: trait('recipient hair') }, body: { skin: trait('authored independent tone'), build: trait('recipient build') }, outfit: { upper: trait('recipient coat') }, accessories: { description: trait('recipient accessory') } } });
async function fixture(reference = false) {
  const base = fileURLToPath(new URL('../../../.omo/evidence/face-selection-tests/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'case-'));
  const bytes = Buffer.from('neutral face fixture');
  const image = join(dir, 'face.png');
  if (reference) await writeFile(image, bytes);
  const variant = { id: 'east-asian-male-01', gender: 'male', ancestry: 'east-asian', source: 'test-author', face: { description: trait('oval face geometry'), noseShape: trait('independent nose geometry') }, referenceImageSha256: reference ? sha(bytes) : null, referenceImagePath: reference ? 'face.png' : null };
  const catalogPath = join(dir, 'catalog.json');
  await writeFile(catalogPath, JSON.stringify({ schemaVersion: 1, variants: [variant, { ...variant, id: 'east-asian-male-02', face: { description: trait('broad face geometry') } }] }));
  const referencePath = join(dir, 'style.png');
  await writeFile(referencePath, 'style only');
  const stylePath = join(dir, 'style.json');
  await writeFile(stylePath, JSON.stringify({ status: 'owner-selected-reference', referenceSha256: sha('style only'), styleId: 'fixture-style' }));
  return { catalogPath, image, variant, dir, referencePath, stylePath };
}
test.each(uniqueFaceIds)('permanent unique ID %s rejects template even after renaming', async id => {
  const record = neutralRecord({ ...input(), characterId: id, name: 'changed name' });
  await assert.rejects(selectFace(record), /requires unique/);
});
test('new sheets fail without explicit mode while existing legacy exports retain null mode', async () => {
  const record = neutralRecord({ ...input(), faceMode: null });
  assert.equal((await selectFace(record)).faceMode, null);
  await assert.rejects(selectFace(record, { required: true }), /explicit faceMode/);
  assert.throws(() => neutralRecord({ ...input(), characterId: 'K998', identity: { ...input().identity, characterId: 'K500' } }), /permanent identity mismatch/);
});
test('unique has individual sourced face and never imports catalog identity', async () => {
  const f = await fixture();
  const record = neutralRecord({ ...input(), faceMode: { kind: 'unique', variantId: null } });
  assert.deepEqual((await selectFace(record, { catalogPath: f.catalogPath })).slots, record.slots);
  await assert.rejects(selectFace({ ...record, faceMode: { kind: 'unique', variantId: f.variant.id } }), /variantId/);
  await assert.rejects(selectFace(neutralRecord({ ...input(), faceMode: { kind: 'unique', variantId: null }, slots: {} })), /individual sourced face/);
  const result = await emit({ character: { ...input(), faceMode: { kind: 'unique', variantId: null } }, ...f, mode: 'portrait' });
  const request = generationRequest(result, { output: 'unused.png', identityReference: 'individual.png' });
  const prompt = request.argv[request.argv.indexOf('--prompt') + 1];
  assert.ok(prompt.includes('recipient coat'));
  assert.equal(prompt.includes('preserve face, hair and costume'), false);
  assert.equal(result.faceVariant, null);
});
test('explicit sourced ruler marker is ID bound and rank alone never locks faces', async () => {
  const f = await fixture();
  const record = neutralRecord({ ...input(), uniqueFaceRequired: true, uniqueFaceSource: { characterId: 'K500', source: 'authored-ruler-ledger' } });
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath }), /requires unique/);
  await assert.rejects(selectFace({ ...record, uniqueFaceSource: { characterId: 'K501', source: 'ledger' } }), /ID-backed/);
  assert.equal((await selectFace(neutralRecord({ ...input(), facts: { role: 'ruler', rank: 'T5' } }), { catalogPath: f.catalogPath })).faceMode.kind, 'template');
});
test('template replaces face only and independently authored skin tone survives', async () => {
  const f = await fixture();
  const record = neutralRecord(input());
  assert.deepEqual(neutralRecord(record), record);
  const selected = await selectFace(record, { catalogPath: f.catalogPath });
  for (const slot of ['hair', 'body', 'outfit', 'accessories']) assert.deepEqual(selected.slots[slot], record.slots[slot]);
  assert.deepEqual(selected.identity, record.identity);
  assert.equal(selected.faceVariant.assetStatus, 'traits-only');
  assert.equal(selected.faceVariant.referenceImageSha256, null);
  const second = await selectFace({ ...record, faceMode: { kind: 'template', variantId: 'east-asian-male-02' } }, { catalogPath: f.catalogPath });
  assert.notDeepEqual(selected.slots.face, second.slots.face);
});
test('template geometry preserves authored recipient eye lip colors and beard', async () => {
  const f = await fixture();
  const authored = input();
  authored.slots.face.eyeColor = trait('green');
  authored.slots.face.lipColor = trait('muted brown');
  authored.slots.face.beardShape = trait('fine even jaw stubble');
  const record = neutralRecord(authored);
  const selected = await selectFace(record, { catalogPath: f.catalogPath });
  for (const key of ['eyeColor', 'lipColor', 'beardShape']) assert.deepEqual(selected.slots.face[key], record.slots.face[key]);
  assert.equal(selected.slots.face.description.value, f.variant.face.description.value);
});
test.each(['male', 'female'])('Korean-inclusive East Asian %s seed preserves recipient identity and independent slots', async gender => {
  const f = await fixture(true);
  const variant = { ...f.variant, id: 'east-asian-'+gender+'-01', gender, ancestry: 'east-asian' };
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [variant] }));
  const authored = input();
  authored.identity.gender = trait(gender);
  authored.faceMode = { kind: 'template', variantId: variant.id };
  authored.faceSelection = { ...authored.faceSelection, gender, ancestry: 'east-asian' };
  authored.slots.face.eyeColor = trait('recipient brown');
  authored.slots.face.lipColor = trait('recipient rose');
  authored.slots.face.beardShape = trait('recipient clean-shaven');
  const record = neutralRecord(authored);
  const selected = await selectFace(record, { catalogPath: f.catalogPath });
  assert.equal(selected.faceVariant.id, variant.id);
  assert.equal(selected.faceVariant.ancestry, 'east-asian');
  assert.equal(selected.faceVariant.referenceImageSha256, sha('neutral face fixture'));
  assert.deepEqual(selected.identity, record.identity);
  for (const slot of ['hair', 'body', 'outfit', 'accessories']) assert.deepEqual(selected.slots[slot], record.slots[slot]);
  for (const field of ['eyeColor', 'lipColor', 'beardShape']) assert.deepEqual(selected.slots.face[field], record.slots.face[field]);
});
test('Korean-inclusive East Asian seed does not relax permanent UNIQUE face protection', async () => {
  const record = neutralRecord({ ...input(), characterId: 'K1019', faceMode: { kind: 'template', variantId: 'east-asian-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'east-asian' } });
  await assert.rejects(selectFace(record), /requires unique/);
});
test.each(['missing-id', 'absent-id', 'gender', 'ancestry', 'skin', 'hash', 'missing-selection-source', 'unknown-group'])('template rejects %s before provider execution', async scenario => {
  const f = await fixture(true);
  const record = neutralRecord(input());
  if (scenario === 'missing-id') record.faceMode.variantId = null;
  if (scenario === 'absent-id') record.faceMode.variantId = 'absent';
  if (scenario === 'gender') record.identity.gender = trait('female');
  if (scenario === 'ancestry') record.faceSelection.ancestry = 'european';
  if (scenario === 'skin') record.faceSelection.skinTone = trait('different tone');
  if (scenario === 'hash') await writeFile(f.image, 'tampered');
  if (scenario === 'missing-selection-source') delete record.faceSelection.source;
  if (scenario === 'unknown-group') record.faceSelection.ancestry = 'unlisted-group';
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath }));
});
async function lineageFixture(f, edgeType = 'biological') {
  const sourcePath = 'lore/characters/lineage.json';
  const sourceBytes = JSON.stringify({ ancestors: [{ id: 'A500', background: 'Explicit Polish and Korean biological family background.' }] });
  await mkdir(join(f.dir, 'lore/characters'), { recursive: true });
  await mkdir(join(f.dir, 'lore/name-pools'), { recursive: true });
  await mkdir(join(f.dir, 'public/person-details'), { recursive: true });
  await writeFile(join(f.dir, sourcePath), sourceBytes);
  const proof = { characterId: 'K500', name: input().name, ancestry: 'european', ancestorId: 'A500', source: { path: sourcePath, pointer: '/ancestors/0/background', sha256: sha(sourceBytes), quote: 'Explicit Polish and Korean biological family background.' } };
  await writeFile(join(f.dir, 'lore/name-pools/face-seed-eligibility.json'), JSON.stringify({ schemaVersion: 1, people: [proof, { ...proof, ancestry: 'eastern-european' }] }));
  await writeFile(join(f.dir, 'lore/name-pools/person-id-registry.json'), JSON.stringify({ persons: [{ id: 'K500', name: input().name }] }));
  await writeFile(join(f.dir, 'public/person-details/person-0500.json'), JSON.stringify({ id: 'person-0500', name: input().name, detailRoute: '/people/person-0500', familyTree: { personId: 'K500', nodes: [{ id: 'K500' }, { id: 'A500' }], edges: [{ from: 'A500', to: 'K500', type: edgeType }] } }));
  return proof;
}
test.each(['recipient-node', 'registry-name', 'detail-name', 'detail-id', 'detail-route'])('foreign seed rejects gate defect %s even without optional contexts', async defect => {
  const f = await fixture();
  await lineageFixture(f);
  const detailPath = join(f.dir, 'public/person-details/person-0500.json');
  const detail = JSON.parse(await readFile(detailPath, 'utf8'));
  if (defect === 'recipient-node') detail.familyTree.nodes = [{ id: 'A500' }];
  if (defect === 'registry-name') await writeFile(join(f.dir, 'lore/name-pools/person-id-registry.json'), JSON.stringify({ persons: [{ id: 'K500', name: 'Current canonical name' }] }));
  if (defect === 'detail-name') detail.name = 'Other recipient';
  if (defect === 'detail-id') detail.id = 'person-0501';
  if (defect === 'detail-route') detail.detailRoute = '/people/person-0501';
  await writeFile(detailPath, JSON.stringify(detail));
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [{ ...f.variant, id: 'european-male-01', ancestry: 'european' }] }));
  const record = neutralRecord({ ...input(), personId: 'person-0500', faceMode: { kind: 'template', variantId: 'european-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'european' } });
  assert.equal(record.canonicalContext, undefined);
  assert.equal(record.birthContext, undefined);
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath, canonicalRoot: f.dir }), defect === 'recipient-node' ? /biological lineage/ : /canonical lineage identity/);
});
test('foreign seed without canonical lineage rejects instead of using identity text or skin', async () => {
  const f = await fixture();
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [{ ...f.variant, id: 'european-male-01', ancestry: 'european' }] }));
  const record = neutralRecord({ ...input(), personId: 'person-0500', faceMode: { kind: 'template', variantId: 'european-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'european' }, identity: { ...input().identity, ethnicity: trait('Polish Korean family background') } });
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath }), /canonical lineage/);
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath, canonicalRoot: f.dir }), /canonical lineage/);
});
test('foreign seed without lineage never reaches actual generation HTTP', async () => {
  const f = await fixture(true);
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [{ ...f.variant, id: 'european-male-01', ancestry: 'european' }] }));
  const record = { ...input(), faceMode: { kind: 'template', variantId: 'european-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'european' } };
  let requests = 0;
  const endpoint = createServer((request, response) => { requests++; response.statusCode = 500; response.end('{}'); });
  const keys = ['CHARACTER_AI_BASE_URL', 'CHARACTER_AI_IMAGE_MODEL', 'CHARACTER_AI_TRANSLATION_MODEL', 'CHARACTER_AI_API_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    const listening = once(endpoint, 'listening', { signal: AbortSignal.timeout(5000) });
    endpoint.listen(0, '127.0.0.1'); await listening;
    Object.assign(process.env, { CHARACTER_AI_BASE_URL: 'http://127.0.0.1:'+endpoint.address().port+'/v1', CHARACTER_AI_IMAGE_MODEL: 'fixture', CHARACTER_AI_TRANSLATION_MODEL: 'fixture', CHARACTER_AI_API_KEY: '' });
    const output = join(f.dir, 'foreign-rejected.png');
    await assert.rejects(generate({ character: record, mode: 'portrait', stylePath: f.stylePath, referencePath: f.referencePath, faceVariantCatalogPath: f.catalogPath }, { output }), /canonical lineage/);
    assert.equal(requests, 0);
    await assert.rejects(readFile(output), { code: 'ENOENT' });
  } finally {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    await new Promise(resolve => endpoint.close(resolve));
  }
});
test.each(['adoptive', 'spouse', 'retainer'])('foreign seed %s relation alone is not biological support', async relation => {
  const f = await fixture();
  await lineageFixture(f, relation);
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [{ ...f.variant, id: 'european-male-01', ancestry: 'european' }] }));
  const record = neutralRecord({ ...input(), personId: 'person-0500', faceMode: { kind: 'template', variantId: 'european-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'european' } });
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath, canonicalRoot: f.dir }), /biological lineage/);
});
test.each(['name', 'group', 'hash', 'quote', 'pointer', 'outside', 'disconnected'])('foreign seed rejects altered canonical lineage %s', async mutation => {
  const f = await fixture();
  const support = await lineageFixture(f);
  if (mutation === 'name') support.name = 'other recipient';
  if (mutation === 'group') support.ancestry = 'african';
  if (mutation === 'hash') support.source.sha256 = '0'.repeat(64);
  if (mutation === 'quote') support.source.quote = 'invented foreign lineage';
  if (mutation === 'pointer') support.source.pointer = '/ancestors/9/background';
  if (mutation === 'outside') support.source.path = '../outside.json';
  if (mutation === 'disconnected') support.ancestorId = 'A999';
  await writeFile(join(f.dir, 'lore/name-pools/face-seed-eligibility.json'), JSON.stringify({ schemaVersion: 1, people: [support] }));
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [{ ...f.variant, id: 'european-male-01', ancestry: 'european' }] }));
  const record = neutralRecord({ ...input(), personId: 'person-0500', faceMode: { kind: 'template', variantId: 'european-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'european' } });
  await assert.rejects(selectFace(record, { catalogPath: f.catalogPath, canonicalRoot: f.dir }));
});
test('Korean-born mixed grandchild can use supported foreign seed through biological ancestors', async () => {
  const f = await fixture();
  await lineageFixture(f);
  await writeFile(join(f.dir, 'public/person-details/person-0500.json'), JSON.stringify({ id: 'person-0500', name: input().name, detailRoute: '/people/person-0500', familyTree: { personId: 'K500', nodes: [{ id: 'K500' }, { id: 'P500' }, { id: 'A500' }], edges: [{ from: 'A500', to: 'P500', type: 'biological' }, { from: 'P500', to: 'K500', type: 'biological' }] } }));
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [{ ...f.variant, id: 'european-male-01', ancestry: 'european' }] }));
  const record = neutralRecord({ ...input(), personId: 'person-0500', identity: { ...input().identity, origin: trait('Born in Seoul; Korean nationality') }, faceMode: { kind: 'template', variantId: 'european-male-01' }, faceSelection: { ...input().faceSelection, ancestry: 'european' } });
  const selected = await selectFace(record, { catalogPath: f.catalogPath, canonicalRoot: f.dir });
  assert.equal(selected.faceVariant.ancestry, 'european');
  assert.deepEqual(selected.identity, record.identity);
  assert.deepEqual(selected.slots.body, record.slots.body);
});
test('overlapping catalog groups preserve canonical ethnicity with verified mixed lineage', async () => {
  const f = await fixture();
  await lineageFixture(f);
  await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: ['european', 'eastern-european'].map(group => ({ ...f.variant, id: group + '-male-01', ancestry: group })) }));
  const original = neutralRecord({ ...input(), personId: 'person-0500', identity: { ...input().identity, ethnicity: trait('Polish Korean family background') } });
  for (const group of ['european', 'eastern-european']) {
    const record = { ...original, faceMode: { kind: 'template', variantId: group + '-male-01' }, faceSelection: { ...original.faceSelection, ancestry: group } };
    const selected = await selectFace(record, { catalogPath: f.catalogPath, canonicalRoot: f.dir });
    assert.deepEqual(selected.identity, original.identity);
    assert.deepEqual(selected.slots.body, original.slots.body);
  }
});
test('template reference hash reaches actual argv with face-only role and public export omits path', async () => {
  const f = await fixture(true);
  const result = await emit({ character: input(), mode: 'portrait', stylePath: f.stylePath, referencePath: f.referencePath, faceVariantCatalogPath: f.catalogPath, requireFaceMode: true });
  const request = generationRequest(result, { output: 'unused.png' });
  assert.equal(request.identity, f.image);
  assert.equal(request.argv[request.argv.indexOf('--expected-identity-sha256') + 1], f.variant.referenceImageSha256);
  assert.equal(request.argv[request.argv.indexOf('--identity-role') + 1], 'face-base-only');
  assert.ok(request.argv[request.argv.indexOf('--prompt') + 1].includes('FACE BASE ONLY'));
  assert.equal(publicPrompt(result).faceVariant.referenceImagePath, undefined);
  assert.deepEqual(result.faceMode, input().faceMode);
  assert.throws(() => generationRequest(result, { output: 'unused.png', identityReference: 'donor.png' }), /selected face variant/);
});
test('GUI cached catalog and explicit selector reject missing choice and export valid selection', async () => {
  const f = await fixture();
  const server = startServer({ port: 0, stylePath: f.stylePath, referencePath: f.referencePath, faceVariantCatalogPath: f.catalogPath });
  try {
    await once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    const base = 'http://127.0.0.1:' + server.address().port;
    const catalog = await (await fetch(base + '/api/face-variants')).json();
    assert.equal(catalog.variants.length, 2);
    assert.equal(catalog.variants[0].referenceImagePath, undefined);
    await writeFile(f.catalogPath, '{}');
    assert.deepEqual(await (await fetch(base + '/api/face-variants')).json(), catalog);
    const page = await (await fetch(base)).text();
    assert.ok(page.includes('id="faceMode"'));
    const missing = await fetch(base + '/api/preview', { method: 'POST', body: JSON.stringify({ record: input(), mode: 'portrait', faceMode: null }) });
    assert.equal(missing.status, 400);
    await writeFile(f.catalogPath, JSON.stringify({ schemaVersion: 1, variants: [f.variant] }));
    const response = await fetch(base + '/api/preview', { method: 'POST', body: JSON.stringify({ record: input(), mode: 'portrait', faceMode: input().faceMode, faceSelection: input().faceSelection }) });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).faceMode, input().faceMode);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('unified new-sheet export requires a mode and exports selected variant provenance', async () => {
  const f = await fixture(true);
  const draft = join(f.dir, 'draft.json');
  const storePath = join(f.dir, 'cast.json');
  await writeFile(draft, JSON.stringify({ id: 'K500', name: input().name, gender: '남성' }));
  await run(['register', '--record', draft], { storePath });
  await assert.rejects(run(['export', '--cast-id', 'K500', '--new-sheet'], { storePath }), /explicit faceMode/);
  assert.equal((await run(['export', '--cast-id', 'K500'], { storePath })).record.faceMode, null);
  const look = join(f.dir, 'look.json');
  await writeFile(look, JSON.stringify({ ...input(), identity: { ...input().identity, gender: trait('남성') } }));
  const exported = await run(['export', '--cast-id', 'K500', '--new-sheet', '--look', look, '--face-catalog', f.catalogPath], { storePath });
  assert.deepEqual(exported.record.faceMode, input().faceMode);
  assert.equal(exported.record.faceVariant.referenceImageSha256, f.variant.referenceImageSha256);
});
test('actual local generation boundary records face-base role and variant hash in receipts', async () => {
  const f = await fixture(true);
  const calls = [];
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const endpoint = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    calls.push({ url: request.url, body: Buffer.concat(chunks).toString() });
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
  });
  const keys = ['CHARACTER_AI_BASE_URL', 'CHARACTER_AI_IMAGE_MODEL', 'CHARACTER_AI_TRANSLATION_MODEL', 'CHARACTER_AI_API_KEY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    const listening = once(endpoint, 'listening', { signal: AbortSignal.timeout(5000) });
    endpoint.listen(0, '127.0.0.1');
    await listening;
    Object.assign(process.env, { CHARACTER_AI_BASE_URL: 'http://127.0.0.1:' + endpoint.address().port + '/v1', CHARACTER_AI_IMAGE_MODEL: 'fixture-image', CHARACTER_AI_TRANSLATION_MODEL: 'fixture-text', CHARACTER_AI_API_KEY: '' });
    const output = join(f.dir, 'candidate.png');
    const receipt = await generate({ character: input(), mode: 'portrait', stylePath: f.stylePath, referencePath: f.referencePath, faceVariantCatalogPath: f.catalogPath }, { output });
    const actual = JSON.parse(await readFile(output + '.request.json', 'utf8'));
    assert.deepEqual(actual.references.map(item => item.role), ['style-only', 'face-base-only']);
    assert.equal(actual.references[1].sha256, f.variant.referenceImageSha256);
    assert.equal(receipt.identityReferenceSha256, f.variant.referenceImageSha256);
    assert.equal(receipt.generationReferenceSha256, sha('style only'));
    assert.deepEqual(receipt.faceMode, input().faceMode);
    assert.equal(receipt.faceVariant.referenceImageSha256, f.variant.referenceImageSha256);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].body.includes(actual.prompt));
  } finally {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    await new Promise(resolve => endpoint.close(resolve));
  }
});
test('template sets never promote generated continuity into the face identity input', async () => {
  const f = await fixture();
  const character = join(f.dir, 'template.json');
  const record = input();
  record.slots.outfit.lower = trait('recipient trousers');
  record.slots.outfit.footwear = trait('recipient shoes');
  await writeFile(character, JSON.stringify(record));
  const previous = process.env.PORTRAIT_FACE_CATALOG;
  process.env.PORTRAIT_FACE_CATALOG = f.catalogPath;
  const calls = [];
  try {
    await generateSet({ character, stylePath: f.stylePath, referencePath: f.referencePath, outputDir: join(f.dir, 'set'), through: 'full-body-front' }, async (shot, options) => {
      calls.push(options);
      return { faceMode: record.faceMode, faceVariant: null, imagePath: options.output, imageSha256: 'a'.repeat(64), generationReferenceSha256: 'b'.repeat(64) };
    });
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.identityReference === null));
    assert.equal(calls[1].imageReference, calls[0].output);
  } finally { if (previous === undefined) delete process.env.PORTRAIT_FACE_CATALOG; else process.env.PORTRAIT_FACE_CATALOG = previous; }
});
