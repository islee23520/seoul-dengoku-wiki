import { mkdir as mkdirEvidence } from 'node:fs/promises';
await mkdirEvidence(new URL('../../../.omo/evidence/portrait-neutral-tests/', import.meta.url), { recursive: true });
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';
import { generateSet, shots, generateReferenceSet, validateReferenceRequest, generateWorkstationSet, validateWorkstationPng } from './generate-character-set.mjs';
import { createReferenceTransport, recordFromWikiToken } from './emit-character-prompt.mjs';
import { referenceShots, workstationKinds, workstationViews, validateWorkstationRequest, validateWorkstationOutput, workstationHash } from './modular-parts.mjs';
import { portraitPng } from './test-fixtures/connection.mjs';
import { randomUUID } from 'node:crypto';
import { decodeCodexPng } from './codex-image.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function outputSpec(category, frameOrder = 0) {
  return { schemaVersion: 2, category, variant: category === 'head-without-hair-eyes-teeth' ? 'exclude-hair-eyes-teeth' : category === 'underwear-only-torso' ? 'authored-underwear' : 'complete', view: category === 'fullbody-turntable' ? workstationViews[frameOrder] : category === 'portrait' ? 'viewer-right' : 'front', frameOrder, format: 'png', width: 48, height: 64, background: { kind: 'transparent', alpha: 'zero-background' }, alignment: { canvasId: 'controlled-common-canvas', coordinates: 'pixels-top-left-x-right-y-down', anchor: [24, 32], crop: [0, 0, 48, 64] }, featureExclusions: category === 'head-without-hair-eyes-teeth' ? ['hair', 'eyes', 'teeth'] : [] };
}

async function workstationFixture(category) {
  const fixture = await referenceFixture();
  const character = JSON.parse(await readFile(fixture.input.source.characterPath, 'utf8'));
  const authoredLookBytes = Buffer.from(JSON.stringify({ schemaVersion: 2, sourceId: 'controlled-authored-design', lookId: character.lookId, personId: character.personId, characterId: character.characterId, category, status: 'owner-authored', description: category === 'underwear-only-torso' ? 'Controlled authored fixture: plain blue sleeveless undershirt, no added ornament or inferred garment.' : 'Controlled authored fixture: retain only explicitly authored category features.' }));
  const { shots: ignored, ...base } = fixture.input.request;
  const frames = Array.from({ length: category === 'fullbody-turntable' ? 4 : 1 }, (_, index) => { const spec = validateWorkstationOutput(outputSpec(category, index)); return { outputSpec: spec, outputSpecSha256: workstationHash(spec) }; });
  fixture.input = { ...fixture.input, authoredLookBytes, request: { ...base, schemaVersion: 2, connectionId: randomUUID(), authoredLook: { sourceId: 'controlled-authored-design', lookId: character.lookId, sha256: sha(authoredLookBytes) }, frames } };
  return fixture;
}

test('v2 strict category, variant, exclusions, frames and hash contracts reject omissions and unknown fields', async () => {
  const f = await workstationFixture('fullbody-turntable');
  try {
    assert.equal(validateWorkstationRequest(f.input.request).frames.length, 4);
    for (const key of Object.keys(f.input.request)) { const bad = structuredClone(f.input.request); delete bad[key]; assert.throws(() => validateWorkstationRequest(bad)); }
    for (const key of Object.keys(f.input.request.frames[0].outputSpec)) { const bad = outputSpec('torso'); delete bad[key]; assert.throws(() => validateWorkstationOutput(bad)); }
    for (const mutate of [r => { r.path = '/tmp/untrusted'; }, r => { r.frames.pop(); }, r => { r.frames.reverse(); }, r => { r.frames[0].outputSpecSha256 = 'a'.repeat(64); }, r => { r.frames[1].outputSpec.view = 'side'; }, r => { r.authoredLook.path = '/tmp/look'; }]) {
      const bad = structuredClone(f.input.request); mutate(bad); assert.throws(() => validateWorkstationRequest(bad));
    }
    for (const category of workstationKinds) {
      const spec = outputSpec(category);
      assert.equal(validateWorkstationOutput(spec).category, category);
      assert.throws(() => validateReferenceRequest({ ...f.input.request, shots: [category] }));
    }
    assert.throws(() => validateWorkstationOutput({ ...outputSpec('head-without-hair-eyes-teeth'), featureExclusions: [] }));
    assert.throws(() => validateWorkstationOutput({ ...outputSpec('detached-head'), variant: 'exclude-hair-eyes-teeth' }));
  } finally { await rm(f.base, { recursive: true, force: true }); }
});

test('v2 controlled categories persist exact parent/child UUIDs, authored bytes and immutable output bindings without network', async () => {
  for (const category of workstationKinds) {
    const f = await workstationFixture(category);
    let calls = 0;
    const transport = async payload => {
      calls++;
      const plan = JSON.parse(await readFile(join(f.input.outputDir, 'plan.json'), 'utf8'));
      const child = plan.children[payload.outputSpec.frameOrder];
      assert.equal(child.requestId, payload.requestId);
      assert.equal(payload.binding.parentRequestId, f.input.request.requestId);
      assert.equal(payload.binding.authoredLook.sha256, sha(f.input.authoredLookBytes));
      assert.equal(payload.outputSpecSha256, workstationHash(payload.outputSpec));
      assert.deepEqual(JSON.parse(await readFile(join(f.input.outputDir, `frame-${payload.outputSpec.frameOrder}.request.json`), 'utf8')), payload);
      return { schemaVersion: 2, status: 'SUCCEEDED', requestId: payload.requestId, binding: payload.binding, outputSpecSha256: payload.outputSpecSha256, pngBase64: f.bytes.toString('base64'), imageSha256: sha(f.bytes) };
    };
    try {
      const result = await generateWorkstationSet(f.input, transport);
      assert.equal(result.status, 'candidate-unreviewed');
      assert.equal(result.paidProof, 'NOT_RUN');
      assert.equal(result.approval, 'NONE');
      assert.equal(calls, category === 'fullbody-turntable' ? 4 : 1);
      assert.equal(new Set(result.frames.map(frame => frame.requestId)).size, calls);
      assert.deepEqual(JSON.parse(await readFile(join(f.input.outputDir, 'set.json'), 'utf8')), result);
      assert.deepEqual(await readFile(join(f.input.outputDir, 'authored-look.json')), f.input.authoredLookBytes);
      for (const frame of result.frames) {
        const bytes = await readFile(join(f.input.outputDir, `frame-${frame.frameOrder}.receipt.json`));
        assert.equal(sha(bytes), frame.receiptSha256);
        const receipt = JSON.parse(bytes);
        assert.equal(receipt.requestId, frame.requestId);
        assert.equal(receipt.outputSpec.category, category);
        assert.deepEqual(receipt.visibleBounds, [0, 0, 1, 1]);
        assert.equal(receipt.semanticReview, 'UNVERIFIED');
      }
      await assert.rejects(generateWorkstationSet(f.input, transport), /EEXIST/);
      assert.equal(calls, category === 'fullbody-turntable' ? 4 : 1);
    } finally { await rm(f.base, { recursive: true, force: true }); }
  }
});

test('v2 rejects missing or mismatched authored source before dispatch and stops uncertainty without retry', async () => {
  const offline = await workstationFixture('hair');
  try { await assert.rejects(generateWorkstationSet(offline.input), /explicit workstation transport required/); await assert.rejects(readdir(offline.input.outputDir), /ENOENT/); }
  finally { await rm(offline.base, { recursive: true, force: true }); }
  for (const mutate of [f => { delete f.input.authoredLookBytes; }, f => { f.input.request.authoredLook.sha256 = 'a'.repeat(64); }, f => { f.input.identity.personId = 'person-999'; }, f => { f.input.request.authoredLook.lookId = 'unbound-design'; }]) {
    const f = await workstationFixture('underwear-only-torso'); let calls = 0;
    try { mutate(f); await assert.rejects(generateWorkstationSet(f.input, async () => { calls++; })); assert.equal(calls, 0); await assert.rejects(readdir(f.input.outputDir), /ENOENT/); }
    finally { await rm(f.base, { recursive: true, force: true }); }
  }
  for (const mismatch of ['uuid', 'spec', 'canvas', 'source']) {
    const f = await workstationFixture('fullbody-turntable'); let calls = 0;
    try {
      const result = await generateWorkstationSet(f.input, async payload => {
        calls++;
        if (mismatch === 'source') await writeFile(f.input.source.characterPath, '{}');
        const bytes = mismatch === 'canvas' ? portraitPng(16, 16) : f.bytes;
        return { schemaVersion: 2, status: 'SUCCEEDED', requestId: mismatch === 'uuid' ? randomUUID() : payload.requestId, binding: payload.binding, outputSpecSha256: mismatch === 'spec' ? 'a'.repeat(64) : payload.outputSpecSha256, pngBase64: bytes.toString('base64'), imageSha256: sha(bytes) };
      });
      assert.equal(result.status, 'UNKNOWN'); assert.equal(calls, 1); assert.equal(result.frames.length, 1);
    } finally { await rm(f.base, { recursive: true, force: true }); }
  }
});

test('v2 authored binding verifies legacy original bytes and all authorities before dispatch', async () => {
  for (const mismatch of [null, 'owner', 'character', 'detail', 'token', 'image', 'identity', 'style', 'look', 'version', 'absent']) {
    const f = await workstationFixture('hair'); let calls = 0;
    try {
      const character = recordFromWikiToken(JSON.parse(await readFile(f.input.source.characterPath)));
      delete character.lookId;
      character.schemaVersion = 1; character.stateId = null;
      character.image = { sha256: sha(f.bytes) };
      const characterBytes = Buffer.from(JSON.stringify(character));
      await writeFile(f.input.source.characterPath, characterBytes);
      const originalBytes = { detail: Buffer.from(JSON.stringify({ id: character.personId, familyTree: { personId: character.characterId } })), token: characterBytes, image: f.bytes };
      const originalHashes = Object.fromEntries(Object.entries(originalBytes).map(([key, bytes]) => [key, sha(bytes)]));
      Object.assign(f.input.source, { sha256: sha(characterBytes), ownerId: '1', originalBytes, originalHashes });
      Object.assign(f.input.identity, { ownerId: '1', sourceSha256: sha(characterBytes) });
      f.input.request.sourceBinding = { schemaVersion: 2, ownerId: '1', characterId: character.characterId, originalHashes: { ...originalHashes }, identityPngSHA: sha(f.bytes) };
      if (mismatch === 'owner') f.input.request.sourceBinding.ownerId = '2';
      if (mismatch === 'character') f.input.request.sourceBinding.characterId = 'K9999';
      if (['detail', 'token', 'image'].includes(mismatch)) f.input.source.originalBytes[mismatch] = Buffer.from('tampered');
      if (mismatch === 'identity') f.input.request.sourceBinding.identityPngSHA = '0'.repeat(64);
      if (mismatch === 'style') f.input.request.styleReferenceSha256 = '0'.repeat(64);
      if (mismatch === 'look') f.input.request.authoredLook.sha256 = '0'.repeat(64);
      if (mismatch === 'version') f.input.request.sourceBinding.schemaVersion = 1;
      if (mismatch === 'absent') delete f.input.request.sourceBinding;
      const transport = async payload => {
        calls++;
        const stored = JSON.parse(await readFile(join(f.input.outputDir, 'plan.json')));
        assert.deepEqual(stored.binding.sourceBinding, f.input.request.sourceBinding);
        assert.deepEqual(await readFile(join(f.input.outputDir, 'authored-look.json')), f.input.authoredLookBytes);
        return { schemaVersion: 2, status: 'SUCCEEDED', requestId: payload.requestId, binding: payload.binding, outputSpecSha256: payload.outputSpecSha256, pngBase64: f.bytes.toString('base64'), imageSha256: sha(f.bytes) };
      };
      if (mismatch) { await assert.rejects(generateWorkstationSet(f.input, transport)); assert.equal(calls, 0); }
      else { assert.equal((await generateWorkstationSet(f.input, transport)).status, 'candidate-unreviewed'); assert.equal(calls, 1); }
    } finally { await rm(f.base, { recursive: true, force: true }); }
  }
});

test('v2 decoded canvas, crop and alpha policies are checked, not inferred from receipt metadata', () => {
  const spec = outputSpec('hair');
  assert.equal(validateWorkstationPng(portraitPng(48, 64), spec).channels, 4);
  assert.throws(() => validateWorkstationPng(portraitPng(16, 16), spec), /canvas/);
  const crop = structuredClone(spec); crop.alignment.crop = [1, 1, 48, 64];
  assert.throws(() => validateWorkstationPng(portraitPng(48, 64), crop), /crop/);
  const solid = outputSpec('torso'); solid.background = { kind: 'solid', alpha: 'opaque', rgb: [255, 255, 255] };
  assert.throws(() => validateWorkstationPng(portraitPng(48, 64), solid), /opaque/);
});

async function fixture() {
  const base = await mkdtemp(join(root, '../../../.omo/evidence/portrait-neutral-tests/set-test-'));
  const referencePath = join(base, 'B.png');
  await writeFile(referencePath, png);
  const style = JSON.parse(await readFile(join(root, 'style-lock.json'), 'utf8'));
  style.referenceSha256 = createHash('sha256').update(png).digest('hex');
  const stylePath = join(base, 'style.json');
  await writeFile(stylePath, JSON.stringify(style));
  const character = join(base, 'character.json');
  await writeFile(character, JSON.stringify({ ...JSON.parse(await readFile(join(root, 'characters/shin-jongmok.json'), 'utf8')), faceMode: { kind: 'unique', variantId: null } }));
  return { character, referencePath, stylePath, outputDir: join(base, 'new-set') };
}

test('ordered set carries portrait identity into front and front into all remaining images', async () => {
  const input = await fixture();
  input.identityReference = input.referencePath;
  const called = [];
  const generateImage = async (shot, { output, imageReference, identityReference }) => {
    called.push({ shot, output, imageReference, identityReference });
    await writeFile(output, png);
    return { faceMode: shot.character.faceMode, faceVariant: null, imagePath: output, imageSha256: createHash('sha256').update(png).digest('hex'), generationReferenceSha256: imageReference ? 'chained' : 'B' };
  };
  const manifest = await generateSet(input, generateImage);
  assert.deepEqual(called.map(({ output }) => output.split('/').at(-1)), shots.map(([name]) => `${name}.png`));
  assert.equal(called[0].imageReference, null);
  assert.equal(called[0].identityReference, input.identityReference);
  assert.ok(called.every(({ identityReference }) => identityReference === input.identityReference));
  assert.equal(called[1].imageReference, called[0].output);
  assert.ok(called.slice(2).every(({ imageReference }) => imageReference === called[1].output));
  assert.equal(manifest.shots.length, 10);
  assert.equal(called.filter(({ shot }) => shot.part !== null).length, 5);
  assert.deepEqual(JSON.parse(await readFile(join(input.outputDir, 'set.json'), 'utf8')), manifest);
});

test('missing identity reference rejects before creating output', async () => {
  const input = await fixture();
  input.identityReference = join(input.referencePath, '..', 'absent.png');
  await assert.rejects(generateSet(input, async () => { throw new Error('must not generate'); }), /ENOENT/);
  await assert.rejects(readdir(input.outputDir), /ENOENT/);
});

test('a running set keeps the initial authored look when the source file changes', async () => {
  const input = await fixture();
  input.through = 'full-body-front';
  const original = JSON.parse(await readFile(input.character, 'utf8'));
  let calls = 0;
  await generateSet(input, async (shot, { output }) => {
    assert.deepEqual(shot.character.outfit, original.outfit);
    if (calls++ === 0) {
      const changed = structuredClone(original);
      changed.outfit.upper.value = 'a different jacket';
      await writeFile(input.character, JSON.stringify(changed));
    }
    await writeFile(output, png);
    return { imagePath: output, imageSha256: sha(png), generationReferenceSha256: sha(png) };
  });
  assert.equal(calls, 2);
});

test('partial generated shots remain recorded when a subsequent image fails', async () => {
  const input = await fixture();
  input.through = 'full-body-front';
  let calls = 0;
  await assert.rejects(generateSet(input, async (shot, { output }) => {
    if (calls++ === 1) throw new Error('provider failure');
    await writeFile(output, png);
    return { imagePath: output, imageSha256: sha(png), generationReferenceSha256: sha(png) };
  }), /provider failure/);
  const manifest = JSON.parse(await readFile(join(input.outputDir, 'set.json'), 'utf8'));
  assert.equal(manifest.status, 'generating');
  assert.equal(manifest.shots.length, 1);
  assert.equal(manifest.shots[0].name, 'portrait');
});

test('missing footwear fails before creating output or contacting generator', async () => {
  const input = await fixture();
  const record = JSON.parse(await readFile(input.character, 'utf8'));
  record.outfit.footwear = { value: null, status: 'unknown', source: null };
  input.character = join(input.referencePath, '..', 'missing.json');
  await writeFile(input.character, JSON.stringify(record));
  let calls = 0;
  await assert.rejects(generateSet(input, async () => { calls++; }), /incomplete B look.*outfit.footwear/);
  assert.equal(calls, 0);
  await assert.rejects(readdir(input.outputDir), /ENOENT/);
});

test('tampered B reference and existing output reject before generation', async () => {
  const input = await fixture();
  await writeFile(input.referencePath, 'changed');
  await assert.rejects(generateSet(input, async () => { throw new Error('should not run'); }), /selected style reference hash mismatch/);
  const valid = await fixture();
  await writeFile(valid.outputDir, 'protected');
  await assert.rejects(generateSet(valid, async () => { throw new Error('should not run'); }), /output directory already exists/);
});

async function referenceFixture() {
  const base = await mkdtemp(join(tmpdir(), 'reference-domain-'));
  const bytes = process.env.REFERENCE_DOMAIN_PNG ? await readFile(process.env.REFERENCE_DOMAIN_PNG) : portraitPng(48, 64);
  if (process.env.REFERENCE_DOMAIN_PNG) assert.equal(sha(bytes), process.env.REFERENCE_DOMAIN_PNG_SHA256);
  const imagePath = join(base, 'sealed.png');
  await writeFile(imagePath, bytes);
  const record = JSON.parse(await readFile(join(root, 'characters/iyen.json'), 'utf8'));
  record.personId = 'person-1017';
  record.faceMode = { kind: 'unique', variantId: null };
  const characterPath = join(base, 'character.json');
  const sourceBytes = Buffer.from(JSON.stringify(record));
  await writeFile(characterPath, sourceBytes);
  const style = JSON.parse(await readFile(join(root, 'style-lock.json'), 'utf8'));
  style.referenceSha256 = sha(bytes);
  const stylePath = join(base, 'style.json');
  await writeFile(stylePath, JSON.stringify(style));
  const request = { requestId: randomUUID(), connectionId: 'controlled-fixture', personId: record.personId, providerModel: 'gpt-image-2.5-sunburst', shots: referenceShots.map(shot => shot.id), identityResultId: randomUUID(), styleReferenceSha256: sha(bytes), faceMode: record.faceMode };
  const source = { characterPath, sha256: sha(sourceBytes), stylePath, referencePath: imagePath };
  const identity = { status: 'sealed', resultId: request.identityResultId, personId: record.personId, characterId: record.characterId, sourceSha256: source.sha256, styleReferenceSha256: sha(bytes), faceMode: record.faceMode, imagePath, imageSha256: sha(bytes) };
  return { base, bytes, input: { request, source, identity, outputDir: join(base, 'set') } };
}

async function referenceServer(fixture, transform = result => result) {
  const calls = [];
  const server = createServer(async (request, response) => {
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const payload = JSON.parse(Buffer.concat(chunks));
      const plan = JSON.parse(await readFile(join(fixture.input.outputDir, 'plan.json'), 'utf8'));
      const journal = JSON.parse(await readFile(join(fixture.input.outputDir, `${payload.shot}.request.json`), 'utf8'));
      assert.deepEqual(journal, payload);
      assert.equal(plan.children.find(child => child.shot === payload.shot).requestId, payload.requestId);
      assert.deepEqual(payload.binding.faceMode, fixture.input.request.faceMode);
      assert.equal(payload.binding.sourceSha256, fixture.input.source.sha256);
      for (const reference of payload.references) assert.equal(sha(Buffer.from(reference.pngBase64, 'base64')), reference.sha256);
      calls.push(payload);
      const result = await transform({ status: 'SUCCEEDED', requestId: payload.requestId, shot: payload.shot, binding: payload.binding, pngBase64: fixture.bytes.toString('base64'), imageSha256: sha(fixture.bytes) }, payload, calls);
      if (result === null) return;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(result));
    } catch (error) { response.statusCode = 500; response.end(error.message); }
  });
  const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
  server.listen(0, '127.0.0.1');
  await listening;
  const transport = createReferenceTransport({ endpoint: `http://127.0.0.1:${server.address().port}/references`, timeoutMs: 5000 });
  const close = async () => {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) });
    server.close();
    server.closeAllConnections();
    await closed;
  };
  return { calls, server, transport, close };
}

test('included nine-reference workflow dispatches journaled real HTTP PNGs in catalog order without a portrait', async () => {
  const fixture = await referenceFixture();
  const http = await referenceServer(fixture);
  try {
    fixture.input.request.shots.reverse();
    const manifest = await generateReferenceSet(fixture.input, http.transport);
    assert.equal(manifest.status, 'candidate-unreviewed');
    assert.equal(manifest.paidProof, 'NOT_RUN');
    assert.deepEqual(http.calls.map(call => call.shot), ['front', 'profile', 'side', 'back', 'head', 'hair', 'upper', 'lower', 'footwear']);
    assert.equal(new Set(http.calls.map(call => call.requestId)).size, 9);
    assert.equal(http.calls[0].references.length, 2);
    assert.ok(http.calls.slice(1).every(call => call.references[2].role === 'continuity-only'));
    const receipts = [];
    for (const item of manifest.shots) {
      const receiptBytes = await readFile(join(fixture.input.outputDir, `${item.shot}.receipt.json`));
      assert.equal(sha(receiptBytes), item.receiptSha256);
      const receipt = JSON.parse(receiptBytes);
      assert.equal(sha(await readFile(join(fixture.input.outputDir, receipt.imageName))), receipt.imageSha256);
      assert.deepEqual(receipt.binding, manifest.binding);
      assert.ok(receipt.visiblePixels > 0);
      receipts.push(receipt);
    }
    const before = await readFile(join(fixture.input.outputDir, 'set.json'));
    await assert.rejects(generateReferenceSet(fixture.input, http.transport), { code: 'EEXIST' });
    assert.deepEqual(await readFile(join(fixture.input.outputDir, 'set.json')), before);
    assert.equal(http.calls.length, 9);
    if (process.env.REFERENCE_DOMAIN_EVIDENCE) {
      const evidence = process.env.REFERENCE_DOMAIN_EVIDENCE;
      await mkdir(evidence, { recursive: true });
      await writeFile(join(evidence, 'fixture-manifest.json'), JSON.stringify({ fixturePath: process.env.REFERENCE_DOMAIN_PNG, fixtureSha256: sha(fixture.bytes), dimensions: { width: receipts[0].width, height: receipts[0].height }, fixtureOnly: true, visualGenerationQualityProven: false, paidProof: 'NOT_RUN', manifest, receipts }, null, 2));
      for (const name of await readdir(fixture.input.outputDir)) await writeFile(join(evidence, name), await readFile(join(fixture.input.outputDir, name)));
    }
  } finally { await http.close(); await rm(fixture.base, { recursive: true, force: true }); }
});

test('a selected hair reference reuses a sealed identity without a hidden front or portrait call', async () => {
  const fixture = await referenceFixture();
  fixture.input.request.shots = ['hair'];
  const http = await referenceServer(fixture);
  try {
    const manifest = await generateReferenceSet(fixture.input, http.transport);
    assert.equal(manifest.status, 'candidate-unreviewed');
    assert.deepEqual(http.calls.map(call => call.shot), ['hair']);
    assert.deepEqual(http.calls[0].references.map(reference => reference.role), ['style-only', 'sealed-identity']);
  } finally { await http.close(); await rm(fixture.base, { recursive: true, force: true }); }
});

test('trusted reference options path is used while absent options retain legacy defaults', async () => {
  const fixture = await referenceFixture();
  const optionsPath = join(fixture.base, 'server-options.json');
  await writeFile(optionsPath, JSON.stringify({ schemaVersion: 0, categories: {} }));
  fixture.input.source.optionsPath = optionsPath;
  let calls = 0;
  try {
    await assert.rejects(generateReferenceSet(fixture.input, async () => { calls++; }), /invalid options catalog/);
    assert.equal(calls, 0);
    await writeFile(optionsPath, await readFile(join(root, 'options.json')));
    fixture.input.request.shots = ['hair'];
    const http = await referenceServer(fixture);
    try {
      const manifest = await generateReferenceSet(fixture.input, http.transport);
      assert.equal(manifest.status, 'candidate-unreviewed');
      assert.equal(http.calls.length, 1);
    } finally { await http.close(); }
  } finally { await rm(fixture.base, { recursive: true, force: true }); }
});

const referenceAdversaries = ['malformed-input', 'stale-source', 'stale-style', 'stale-identity', 'variant-conflict', 'mutation-after-dispatch', 'interrupt-after-dispatch', 'misleading-success', 'UNKNOWN'];
const referenceProof = [];
test.each(referenceAdversaries)('reference domain fails closed for %s and never redispatches uncertainty', async scenario => {
  const fixture = await referenceFixture();
  let http;
  try {
    if (scenario === 'malformed-input') fixture.input.request.shots = ['hair', 'hair'];
    if (scenario === 'stale-source') fixture.input.source.sha256 = '0'.repeat(64);
    if (scenario === 'stale-style') fixture.input.request.styleReferenceSha256 = '0'.repeat(64);
    if (scenario === 'stale-identity') fixture.input.identity.imageSha256 = '0'.repeat(64);
    if (scenario === 'variant-conflict') fixture.input.identity.faceMode = { kind: 'template', variantId: 'incompatible' };
    if (referenceAdversaries.indexOf(scenario) < 5) {
      let count = 0;
      await assert.rejects(generateReferenceSet(fixture.input, async () => { count++; }));
      assert.equal(count, 0);
      await assert.rejects(readdir(fixture.input.outputDir), { code: 'ENOENT' });
      referenceProof.push({ scenario, status: 'REJECTED', dispatches: 0 });
      return;
    }
    const controller = new AbortController();
    fixture.input.signal = controller.signal;
    http = await referenceServer(fixture, async result => {
      if (scenario === 'mutation-after-dispatch') await writeFile(fixture.input.source.characterPath, '{}');
      if (scenario === 'interrupt-after-dispatch') { controller.abort(new Error('fixture interruption')); return null; }
      if (scenario === 'misleading-success') result.imageSha256 = '0'.repeat(64);
      if (scenario === 'UNKNOWN') result.status = 'UNKNOWN';
      return result;
    });
    const manifest = await generateReferenceSet(fixture.input, http.transport);
    assert.equal(manifest.status, 'UNKNOWN');
    assert.equal(manifest.shots.length, 1);
    assert.equal(http.calls.length, 1);
    const before = await readFile(join(fixture.input.outputDir, 'front.receipt.json'));
    await assert.rejects(generateReferenceSet(fixture.input, http.transport));
    assert.deepEqual(await readFile(join(fixture.input.outputDir, 'front.receipt.json')), before);
    assert.equal(http.calls.length, 1);
    referenceProof.push({ scenario, status: manifest.status, dispatches: 1, redispatches: 0 });
  } finally {
    if (http) await http.close();
    await rm(fixture.base, { recursive: true, force: true });
    if (process.env.REFERENCE_DOMAIN_EVIDENCE && referenceProof.length === 9) await writeFile(join(process.env.REFERENCE_DOMAIN_EVIDENCE, 'adversarial-proof.json'), JSON.stringify({ cases: referenceProof, paidProof: 'NOT_RUN', cleanup: 'owned temporary directories removed; HTTP servers closed' }, null, 2));
  }
});

test('reference request rejects public paths, missing transport, unknown shots and malformed UUIDs', async () => {
  const fixture = await referenceFixture();
  try {
    for (const patch of [{ characterPath: '/tmp/untrusted.json' }, { shots: [] }, { shots: ['portrait'] }, { requestId: 'not-a-uuid' }, { faceMode: { kind: 'unique', variantId: 'donor' } }]) assert.throws(() => validateReferenceRequest({ ...fixture.input.request, ...patch }));
    await assert.rejects(generateReferenceSet(fixture.input), /explicit reference provider transport/);
    assert.throws(() => createReferenceTransport({ endpoint: 'file:///tmp/provider' }), /explicit reference HTTP/);
    assert.ok(decodeCodexPng(fixture.bytes).width > 0);
  } finally { await rm(fixture.base, { recursive: true, force: true }); }
});

test.each(['token-only', 'truncated-png', 'wrong-request', 'wrong-binding'])('reference provider cannot publish %s as success', async scenario => {
  const fixture = await referenceFixture();
  fixture.input.request.shots = ['hair'];
  const http = await referenceServer(fixture, result => {
    if (scenario === 'token-only') delete result.pngBase64;
    if (scenario === 'truncated-png') { const bytes = fixture.bytes.subarray(0, 20); result.pngBase64 = bytes.toString('base64'); result.imageSha256 = sha(bytes); }
    if (scenario === 'wrong-request') result.requestId = randomUUID();
    if (scenario === 'wrong-binding') result.binding = { ...result.binding, identityReferenceSha256: '0'.repeat(64) };
    return result;
  });
  try {
    const manifest = await generateReferenceSet(fixture.input, http.transport);
    assert.equal(manifest.status, 'UNKNOWN');
    assert.equal(http.calls.length, 1);
    await assert.rejects(readFile(join(fixture.input.outputDir, 'hair.png')), { code: 'ENOENT' });
  } finally { await http.close(); await rm(fixture.base, { recursive: true, force: true }); }
});
