import { mkdir as mkdirEvidence } from 'node:fs/promises';
await mkdirEvidence(new URL('../../../.omo/evidence/portrait-neutral-tests/', import.meta.url), { recursive: true });
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { test } from 'vitest';
import { imageRequestRecord, englishGenerationPrompt, userConnection } from './cliproxy-edit.mjs';

const childEnvironment = () => Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));

test('reference snapshot hashes stay bound to upload bytes after the path changes', async () => {
  const dir = await mkdtemp(new URL('../../../.omo/evidence/portrait-neutral-tests/reference-snapshot-', import.meta.url));
  try {
    const path = join(dir, 'reference.png');
    const snapshot = Buffer.from('original reference');
    await writeFile(path, 'replacement reference');
    const record = await imageRequestRecord('English prompt', '1024x1024', [path], 'user-image', [snapshot]);
    assert.equal(record.references[0].sha256, createHash('sha256').update(snapshot).digest('hex'));
    assert.notEqual(record.references[0].sha256, createHash('sha256').update('replacement reference').digest('hex'));
  } finally { await rm(dir, { recursive: true }); }
});

test.each(['private-test-key', ''])('local CLI sends English to user endpoint without storing credentials (key: %s)', async apiKey => {
  const dir = await mkdtemp(new URL('../../../.omo/evidence/portrait-neutral-tests/local-endpoint-', import.meta.url));
  const calls = [];
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ioAAAAASUVORK5CYII=', 'base64');
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    calls.push({ url: req.url, authorization: req.headers.authorization, body });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url.endsWith('/chat/completions')
      ? { choices: [{ message: { content: 'Kim Yeonggyu; two red mechanical discs' } }] }
      : { data: [{ b64_json: png.toString('base64') }] }));
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const image = join(dir, 'reference.png');
    const output = join(dir, 'candidate.png');
    await writeFile(image, png);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [new URL('./cliproxy-edit.mjs', import.meta.url).pathname, '--image', image, '--prompt', '김연규; 붉은 원판 두 개', '-o', output], {
        env: { ...childEnvironment(), CHARACTER_AI_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`, CHARACTER_AI_IMAGE_MODEL: 'user-image', CHARACTER_AI_TRANSLATION_MODEL: 'user-text', CHARACTER_AI_API_KEY: apiKey },
      });
      let errors = '';
      child.stderr.on('data', chunk => { errors += chunk; });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(Error(errors)));
    });
    const { readFile } = await import('node:fs/promises');
    const requestText = await readFile(`${output}.request.json`, 'utf8');
    const receiptText = await readFile(`${output}.receipt.json`, 'utf8');
    const request = JSON.parse(requestText);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls.map(call => call.url), ['/v1/chat/completions', '/v1/images/edits']);
    assert.equal(JSON.parse(calls[0].body).model, 'user-text');
    assert.equal(calls[1].body.includes(request.prompt), true);
    assert.equal(calls[1].body.includes('user-image'), true);
    assert.equal(calls[1].body.includes('김연규'), false);
    assert.equal(calls[0].authorization, apiKey ? `Bearer ${apiKey}` : undefined);
    assert.equal(calls[1].authorization, apiKey ? `Bearer ${apiKey}` : undefined);
    assert.equal(request.model, 'user-image');
    assert.deepEqual(JSON.parse(receiptText).request, request);
    assert.equal((requestText + receiptText).includes('private-test-key'), false);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true });
  }
});

test('user local or BYOK connection selects models without copying credentials into receipts', async () => {
  const connection = userConnection({ CHARACTER_AI_BASE_URL: 'http://127.0.0.1:9000/v1', CHARACTER_AI_IMAGE_MODEL: 'user-image', CHARACTER_AI_TRANSLATION_MODEL: 'user-text', CHARACTER_AI_API_KEY: 'private-test-key' });
  const request = await imageRequestRecord('English prompt', '1024x1024', [], connection.imageModel);
  assert.equal(request.model, 'user-image');
  assert.equal(JSON.stringify(request).includes('private-test-key'), false);
  assert.equal(userConnection({}), null);
  assert.throws(() => userConnection({ CHARACTER_AI_BASE_URL: 'http://localhost:9000' }), /models required/);
});

test.each(['English prompt', '김연규 초상'])('incorrect owner photo hash stops actual CLI before any provider request (%s)', async prompt => {
  const dir = await mkdtemp(new URL('../../../.omo/evidence/portrait-neutral-tests/owner-hash-', import.meta.url));
  let calls = 0;
  const server = createServer((req, res) => { calls++; res.end('{}'); });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const image = join(dir, 'photo.png');
    const output = join(dir, 'candidate.png');
    await writeFile(image, 'actual reference bytes');
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [new URL('./cliproxy-edit.mjs', import.meta.url).pathname, '--image', image, '--image', image, '--prompt', prompt, '--expected-identity-sha256', 'b'.repeat(64), '-o', output], {
        env: { ...childEnvironment(), CHARACTER_AI_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`, CHARACTER_AI_IMAGE_MODEL: 'image', CHARACTER_AI_TRANSLATION_MODEL: 'text', CHARACTER_AI_API_KEY: '' },
      });
      let stderr = '';
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', code => resolve({ code, stderr }));
    });
    assert.equal(result.code, 2);
    assert.match(result.stderr, /owner photo hash mismatch before image request/);
    assert.equal(calls, 0);
    const { stat } = await import('node:fs/promises');
    await assert.rejects(stat(output), { code: 'ENOENT' });
    await assert.rejects(stat(`${output}.request.json`), { code: 'ENOENT' });
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true });
  }
});

test('mixed-language input is translated before recording the actual request', async () => {
  let supplied;
  const prompt = await englishGenerationPrompt('김연규; 붉은 원판 두 개; anime manga style: 橫山光輝', async source => {
    supplied = source;
    return 'Kim Yeonggyu; two red mechanical discs; anime manga style: Mitsuteru Yokoyama';
  });
  assert.equal(supplied.includes('김연규'), true);
  const request = await imageRequestRecord(prompt, '1024x1536', []);
  assert.equal(request.prompt, prompt);
  assert.equal(/[^\x00-\x7f]/.test(request.prompt), false);
});

test('English input is retained without a translation request', async () => {
  assert.equal(await englishGenerationPrompt('two red mechanical discs', () => { throw Error('unexpected translation'); }), 'two red mechanical discs');
});

test('incomplete translation fails before an image request is recorded', async () => {
  await assert.rejects(englishGenerationPrompt('원본 의상', async () => 'original 의상'), /English text only/);
  await assert.rejects(englishGenerationPrompt('원본 의상', async () => ''), /English text only/);
});

test('actual request metadata keeps exact prompt and ordered image hashes without private paths', async () => {
  const dir = await mkdtemp(new URL('../../../.omo/evidence/portrait-neutral-tests/request-record-', import.meta.url));
  try {
    const paths = [join(dir, 'style.png'), join(dir, 'identity.png')];
    await writeFile(paths[0], 'style bytes');
    await writeFile(paths[1], 'identity bytes');
    const record = await imageRequestRecord('anime manga style: 橫山光輝', '1024x1536', paths);
    assert.equal(record.prompt, 'anime manga style: 橫山光輝');
    assert.equal(record.size, '1024x1536');
    assert.deepEqual(record.references.map(x => x.role), ['style-only', 'identity-only']);
    assert.equal(record.references[1].sha256, createHash('sha256').update('identity bytes').digest('hex'));
    assert.equal(JSON.stringify(record).includes(dir), false);
    assert.equal(Object.hasOwn(record, 'authorization'), false);
  } finally { await rm(dir, { recursive: true }); }
});
