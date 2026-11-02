import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'vitest';
import { englishGenerationPrompt, visualInstruction, validateVisualSnapshot } from './cliproxy-edit.mjs';

const evidence = new URL('../../../.omo/evidence/omarchy-portrait-split-20261003/translation/', import.meta.url);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ioAAAAASUVORK5CYII=', 'base64');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const original = {
  characterId: 'K027', name: '기바름', personId: 'person-0027',
  birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31',
  registry: { path: 'lore/이름/registry.json', pointer: '/characters/26', sha256: 'a'.repeat(64) },
  excerpts: ['기바름은 기록을 보존한다.'],
  background: [{ path: 'lore/characters/K027.json', pointer: '/content/0', sha256: 'b'.repeat(64) }],
};
const authored = 'Authored slots override context; style only; locked face and pose.\nserializedRecipientContext=' + JSON.stringify(original) + '\n검은 외투';

function ownChild(child) {
  const owned = { child, closed: false };
  child.once('close', () => { owned.closed = true; });
  return owned;
}

async function cleanupFixture(owned, server, dir, deadline = 1000, failure) {
  try {
    if (owned && !owned.closed) {
      const { child } = owned;
      const closed = once(child, 'close', { signal: AbortSignal.timeout(deadline) });
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
      try { await closed; }
      catch (error) {
        if (error.name !== 'AbortError') throw error;
        if (!owned.closed) {
          const killed = once(child, 'close', { signal: AbortSignal.timeout(5000) });
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
          await killed;
        }
      }
    }
  } catch (error) { failure ??= error; }
  finally {
    try {
      if (server.listening) {
        const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) });
        server.close();
        server.closeAllConnections();
        await closed;
      }
    } catch (error) { failure ??= error; }
    finally {
      try { await rm(dir, { recursive: true, force: true }); }
      catch (error) { failure ??= error; }
    }
  }
  if (failure) throw failure;
}

test('cleanup observes an ignored-SIGTERM child close before deleting its fixture', async () => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('stalled-', evidence));
  const server = createServer();
  const owned = ownChild(spawn(process.execPath, ['-e', "process.on('SIGTERM', () => process.send('TERM')); process.on('message', () => process.send('READY'));"], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'], env: {} }));
  const order = [];
  let fixtureAtClose, failure;
  owned.child.once('close', () => { order.push('close'); fixtureAtClose = existsSync(dir); });
  try {
    const ready = once(owned.child, 'message', { signal: AbortSignal.timeout(5000) });
    owned.child.send('READY');
    assert.deepEqual(await ready, ['READY', undefined]);
    order.push('READY');
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1');
    await listening;
    const terminated = once(owned.child, 'message', { signal: AbortSignal.timeout(5000) });
    const cleanup = cleanupFixture(owned, server, dir, 100);
    const term = terminated.then(([message]) => { assert.equal(message, 'TERM'); order.push('TERM'); });
    await Promise.all([cleanup, term]);
    order.push('removed');
    assert.equal(owned.closed, true);
    assert.equal(owned.child.signalCode, 'SIGKILL');
    assert.equal(fixtureAtClose, true);
    assert.equal(server.listening, false);
    assert.equal(existsSync(dir), false);
    assert.deepEqual(order, ['READY', 'TERM', 'close', 'removed']);
    console.log('CLOSE_BARRIER_PROOF=' + JSON.stringify({ pid: owned.child.pid, order, signalCode: owned.child.signalCode, fixtureAtClose, serverClosed: !server.listening, fixtureRemoved: !existsSync(dir) }));
  } catch (error) { failure = error; }
  finally { await cleanupFixture(owned, server, dir, 1000, failure); }
});

test.each(['already-closed', 'exit-before-close', 'signal-before-close'])('cleanup awaits actual close for %s', async state => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('closed-', evidence));
  const server = createServer();
  const owned = ownChild(spawn(process.execPath, ['-e', "process.on('message', () => process.exit(0));"], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'], env: {} }));
  let fixtureAtClose, failure;
  owned.child.once('close', () => { fixtureAtClose = existsSync(dir); });
  try {
    const closed = once(owned.child, 'close', { signal: AbortSignal.timeout(5000) });
    if (state === 'already-closed') {
      owned.child.send('EXIT');
      await closed;
      await cleanupFixture(owned, server, dir);
    } else {
      const cleanup = new Promise((resolve, reject) => {
        owned.child.once('exit', () => {
          assert.equal(owned.closed, false);
          cleanupFixture(owned, server, dir).then(resolve, reject);
        });
      });
      if (state === 'signal-before-close') owned.child.kill('SIGKILL');
      else owned.child.send('EXIT');
      await Promise.all([closed, cleanup]);
    }
    assert.equal(owned.closed, true);
    assert.equal(fixtureAtClose, true);
    assert.equal(existsSync(dir), false);
  } catch (error) { failure = error; }
  finally { await cleanupFixture(owned, server, dir, 1000, failure); }
});

test('cleanup removes a fixture after server listen failure and preserves the original failure', async () => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('server-error-', evidence));
  const occupied = createServer(), server = createServer();
  try {
    const listening = once(occupied, 'listening', { signal: AbortSignal.timeout(5000) });
    occupied.listen(0, '127.0.0.1');
    await listening;
    const failed = once(server, 'error', { signal: AbortSignal.timeout(5000) });
    server.listen(occupied.address().port, '127.0.0.1');
    const [error] = await failed;
    assert.equal(error.code, 'EADDRINUSE');
    await assert.rejects(cleanupFixture(undefined, server, dir, 1000, error), actual => actual === error);
    assert.equal(server.listening, false);
    assert.equal(existsSync(dir), false);
  } finally {
    try { await cleanupFixture(undefined, occupied, dir); }
    finally { await cleanupFixture(undefined, server, dir); }
  }
});
test.each([['남성', 'male'], ['여성', 'female']])('English authored slots with identity gender %s do not need provider translation', async (sourceGender, englishGender) => {
  const prompt = `identity.gender: ${sourceGender}; identity.ageCategory: adult face.eyeColor: brown; face.beardShape: clean-shaven; no facial hair; accessories.description: none selected for this portrait Locked series camera: eye level`;
  const expected = prompt.replace(`identity.gender: ${sourceGender}`, `identity.gender: ${englishGender}`);
  let translations = 0;
  assert.equal(await englishGenerationPrompt(prompt, async () => { translations++; return expected.replace('none selected for this portrait', 'none selected for this portrait.'); }), expected);
  assert.equal(translations, 0);
  const source = 'serializedRecipientContext=' + JSON.stringify(original) + '\n' + prompt;
  const request = { prompt: expected, sourceSnapshot: { prompt: source, promptSha256: sha(source), recipientContext: original }, visualSnapshot: { sourceVisualPrompt: prompt, sourceVisualPromptSha256: sha(prompt), transmittedPrompt: expected, transmittedPromptSha256: sha(expected), provenance: 'deterministic-identity-gender' } };
  assert.doesNotThrow(() => validateVisualSnapshot(request));
  const changed = structuredClone(request);
  changed.prompt = changed.prompt.replace('brown', 'blue');
  changed.visualSnapshot.transmittedPrompt = changed.prompt;
  changed.visualSnapshot.transmittedPromptSha256 = sha(changed.prompt);
  assert.throws(() => validateVisualSnapshot(changed));
});
test('non-English appearance still uses translation without rewriting a gender word inside a slot', async () => {
  const prompt = 'identity.gender: 여성; outfit.upper: 여성용 검은 외투';
  let translations = 0;
  assert.equal(await englishGenerationPrompt(prompt, async supplied => {
    translations++;
    assert.equal(supplied, prompt);
    return 'identity.gender: female; outfit.upper: black coat for women';
  }), 'identity.gender: female; outfit.upper: black coat for women');
  assert.equal(translations, 1);
});
test('fresh CLI rejects a translation swapping English slot associations before image HTTP', async () => {
 await mkdir(evidence, { recursive: true });
 const dir = await mkdtemp(new URL('swap-', evidence));
 const input = 'face.eyeColor: brown; face.lipColor: rose; body.skin: tan; 남성';
 let imageCalls = 0;
 const fake = createServer(async (req, res) => {
  for await (const chunk of req) { /* Drain local request. */ }
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/v1/chat/completions') res.end(JSON.stringify({ choices: [{ message: { content: 'face.eyeColor: rose; face.lipColor: brown; body.skin: tan; male' } }] }));
  else { imageCalls++; res.end('{}'); }
 });
 let child, failure;
 try {
  const listening = once(fake, 'listening', { signal: AbortSignal.timeout(5000) }); fake.listen(0, '127.0.0.1'); await listening;
  const image = join(dir, 'style.png'); await writeFile(image, png);
  child = ownChild(spawn(process.execPath, [new URL('./cliproxy-edit.mjs', import.meta.url).pathname, '--image', image, '--prompt', input, '-o', join(dir, 'never.png')], { env: { PATH: process.env.PATH, HOME: dir, CHARACTER_AI_BASE_URL: 'http://127.0.0.1:' + fake.address().port + '/v1', CHARACTER_AI_API_KEY: '', CHARACTER_AI_IMAGE_MODEL: 'local', CHARACTER_AI_TRANSLATION_MODEL: 'local' } }));
  const closed = once(child.child, 'close', { signal: AbortSignal.timeout(10000) }); let stderr = ''; child.child.stderr.on('data', b => stderr += b);
  const [code] = await closed; assert.equal(code, 2); assert.match(stderr, /slot association/); assert.equal(imageCalls, 0);
 } catch (error) { failure = error; }
 finally { await cleanupFixture(child, fake, dir, 1000, failure); }
});

test('ASCII escaped canonical metadata remains byte exact without translation', async () => {
  const prompt = authored.replace(/[^\x00-\x7f]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
  assert.equal(await englishGenerationPrompt(prompt, () => { throw Error('unexpected translation'); }), prompt);
});

test.each(['valid', 'characterId', 'sha256', 'path', 'pointer', 'birthDate'])('fresh CLI translation boundary validates %s before image HTTP', async mutation => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('fixture-', evidence));
  const calls = [];
  const derivative = structuredClone(original);
  derivative.name = 'Gi Bareum';
  derivative.excerpts = ['Gi Bareum preserves records.'];
  if (mutation === 'characterId') derivative.characterId = 'K028';
  if (['sha256', 'path', 'pointer'].includes(mutation)) derivative.registry[mutation] = 'corrupted';
  if (mutation === 'birthDate') derivative.birthDate = '2091-01-02';
  const translated = mutation === 'valid' ? visualInstruction(authored).replace('검은 외투', 'black coat') : 'serializedRecipientContext=' + JSON.stringify(derivative).replace(/[^\x00-\x7f]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    if (req.url === '/v1/chat/completions') {
      assert.equal(bytes.includes(Buffer.from(original.name)), false);
      assert.equal(bytes.includes(Buffer.from('serializedRecipientContext=')), false);
      assert.equal(bytes.includes(Buffer.from(original.registry.sha256)), false);
      calls.push({ url: req.url, body: JSON.parse(bytes) });
      res.setHeader('Content-Type', 'application/json');
      const textOnly = JSON.parse(bytes).tool_choice === 'none';
      res.end(JSON.stringify({ choices: [{ message: textOnly ? { content: translated } : { content: null, images: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,' + png.toString('base64') } }] } }] }));
    } else {
      const form = await new Response(bytes, { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
      assert.equal(form.get('prompt').includes('serializedRecipientContext='), false);
      assert.equal(form.get('prompt').includes(original.registry.path), false);
      assert.equal(form.get('prompt').includes(original.registry.sha256), false);
      calls.push({ url: req.url, prompt: form.get('prompt'), model: form.get('model'), imageSha256: sha(Buffer.from(await form.get('image[]').arrayBuffer())) });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
    }
  });
  let child;
  let proof;
  let failure;
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1');
    await listening;
    const image = join(dir, 'temporary-style.png');
    const output = join(dir, 'new-candidate.png');
    await writeFile(image, png);
    const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
    Object.assign(env, { CHARACTER_AI_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`, CHARACTER_AI_IMAGE_MODEL: 'local-image', CHARACTER_AI_TRANSLATION_MODEL: 'local-text', CHARACTER_AI_API_KEY: '' });
    child = ownChild(spawn(process.execPath, [new URL('./cliproxy-edit.mjs', import.meta.url).pathname, '--image', image, '--prompt', authored, '-o', output], { env }));
    const closed = once(child.child, 'close', { signal: AbortSignal.timeout(20000) });
    let stdout = '', stderr = '';
    child.child.stdout.on('data', bytes => { stdout += bytes; });
    child.child.stderr.on('data', bytes => { stderr += bytes; });
    const [code] = await closed;
    proof = { mutation, code, stdout, stderr, calls, originalPromptSha256: sha(authored), fixtureStyleSha256: sha(png), cleanup: false };
    if (mutation === 'valid') {
      assert.equal(calls[0].body.tool_choice, 'none');
      const request = JSON.parse(await readFile(output + '.request.json', 'utf8'));
      const receipt = JSON.parse(await readFile(output + '.receipt.json', 'utf8'));
      Object.assign(proof, { request, receipt, outputSha256: sha(await readFile(output)) });
      await writeFile(new URL('valid-http-proof.json', evidence), JSON.stringify(proof, null, 2));
      assert.equal(code, 0, stderr);
      assert.deepEqual(request.sourceSnapshot.recipientContext, original);
      assert.equal(request.sourceSnapshot.prompt, authored);
      assert.equal(request.sourceSnapshot.promptSha256, sha(authored));
      assert.equal(request.visualSnapshot.provenance, 'translated-visual-instruction');
      assert.equal(request.prompt.includes('serializedRecipientContext='), false);
      validateVisualSnapshot(request);
      assert.deepEqual(receipt.request, request);
      assert.equal(receipt.imageSha256, proof.outputSha256);
      assert.equal(calls.length, 2);
      // Multipart string fields normalize line endings to CRLF on the wire.
      assert.equal(calls[1].prompt, request.prompt.replace(/\r?\n/g, '\r\n'));
      assert.equal(calls[1].model, request.model);
      assert.equal(calls[1].imageSha256, request.references[0].sha256);
      assert.equal(/[^\x00-\x7f]/.test(request.prompt), false);
    } else {
      await writeFile(new URL(mutation + '-http-proof.json', evidence), JSON.stringify(proof, null, 2));
      assert.equal(code, 2);
      assert.match(stderr, /recipient context machine fields changed/);
      assert.equal(calls.length, 1);
      await assert.rejects(readFile(output + '.request.json'), { code: 'ENOENT' });
    }
  } catch (error) { failure = error; }
  finally {
    await cleanupFixture(child, server, dir, 1000, failure);
    if (proof) {
      proof.cleanup = { serverClosed: !server.listening, childExited: child.closed, temporaryFixtureRemoved: true };
      await writeFile(new URL(mutation === 'valid' ? 'valid-http-proof.json' : mutation + '-http-proof.json', evidence), JSON.stringify(proof, null, 2));
    }
  }
});
