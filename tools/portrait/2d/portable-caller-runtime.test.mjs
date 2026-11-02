import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { emit, generationRequest, generate } from './emit-character-prompt.mjs';
import { portraitPng } from './test-fixtures/connection.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const root = new URL('../../../.omo/evidence/portable-v3-runtime/', import.meta.url);
test('actual emit request spawn preserves synthetic native bytes while external identity never reaches provider', async () => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('case-', root));
  const png = portraitPng(); let calls = 0, wire;
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    calls++;
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
    wire = { prompt: form.get('prompt'), referenceSHA: hash(Buffer.from(await form.get('image[]').arrayBuffer())), route: req.url };
    res.end(JSON.stringify({ model: 'gpt-image-2.5-sunburst', data: [{ b64_json: png.toString('base64') }] }));
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) }); server.listen(0, '127.0.0.1'); await listening;
    const reference = join(dir, 'style.png'), style = join(dir, 'style.json'), config = join(dir, 'connection.json'), output = join(dir, 'candidate.png');
    await writeFile(reference, png);
    await writeFile(style, JSON.stringify({ status: 'owner-selected-reference', styleId: 'fixture', referenceSha256: hash(png) }));
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'http://127.0.0.1:' + server.address().port, allowUnauthenticated: true }));
    const trait = value => ({ value, status: 'authored-draft', source: 'fixture' });
    const character = { schemaVersion: 2, characterId: 'TEST', name: 'Fixture', faceMode: { kind: 'unique', variantId: null }, identity: { gender: trait('male') }, slots: { face: { description: trait('oval face') }, hair: { description: trait('short black hair') }, outfit: { upper: trait('plain coat') } } };
    const input = { character, mode: 'portrait', stylePath: style, referencePath: reference, requireFaceMode: true };
    const emitted = await emit(input);
    const request = generationRequest(emitted, { output, connectionConfig: config, javascriptExecutable: process.execPath });
    assert.equal(request.argv[0].endsWith('/image-generate.mjs'), true);
    for (const options of [{ identityReference: 'external.png' }, { imageReference: 'continuity.png' }]) await assert.rejects(generate(input, { output, connectionConfig: config, ...options }), /authoring-only/);
    assert.equal(calls, 0);
    const result = await generate(input, { output, connectionConfig: config, javascriptExecutable: process.execPath });
    assert.equal(calls, 1);
    const savedRequest = JSON.parse(await readFile(output + '.request.json'));
    const native = JSON.parse(await readFile(join(output + '.native', 'preservation.json')));
    assert.equal(hash(await readFile(output)), hash(png));
    assert.equal(hash(await readFile(join(output + '.native', 'image-001.png'))), hash(png));
    assert.equal(result.generationReferenceSha256, hash(png));
    assert.equal(savedRequest.references[0].sha256, hash(png));
    assert.equal(wire.referenceSHA, hash(png));
    assert.equal(savedRequest.sourceSnapshot.prompt, request.argv[request.argv.indexOf('--prompt') + 1]);
    assert.equal(result.visualSnapshot.sourceVisualPromptSha256, hash(result.visualSnapshot.sourceVisualPrompt));
    await writeFile(new URL('proof.json', root), JSON.stringify({ actualGenerateSpawn: true, request, calls, rejectedProviderCalls: 0, realProviderCalls: 0, wire, outputSHA: hash(png), sourcePromptSHA: hash(savedRequest.sourceSnapshot.prompt), nativeStatus: native.outputs[0].outputValidationStatus, receiptGenerator: result.generator }, null, 2));
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) }); server.close(); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});
