import assert from 'node:assert/strict';
import { test } from 'vitest';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, writeFile, readFile, rm, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { slotFields } from '../neutral-slots.mjs';
import { portraitPng } from './test-fixtures/connection.mjs';
import { imageRequestRecord } from './image-generate.mjs';
import { resumePublication } from './publication-resume.mjs';
const root = new URL('../../../.omo/evidence/portable-image-generation-20261004/', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');
const png = portraitPng();
function model() {
  return { schema: 'character-art-2d.v1', recipient: { gender: 'male', ageCategory: 'adult' }, face: { kind: 'unique', variantId: null }, appearance: Object.fromEntries(Object.entries(slotFields).map(([slot, fields]) => [slot, Object.fromEntries(fields.map(field => [field, slot === 'face' && field === 'eyeColor' ? 'brown' : null]))])), references: [{ index: 1, role: 'drawing-technique-only', sourceHash: hash(png) }, { index: 2, role: 'framing-only', guide: { mode: 'portrait', gender: 'male', sourceHash: hash(png), landmarkBinding: 'head-torso' } }], composition: { shot: 'medium-close-up-119', mode: 'portrait', cameraContractId: 'fixture-camera', coordinatedHeadTorso: true, viewerRight: true, gazeCamera: true, fullHeadShoulderConstraints: true, measuredFrameGuide: 'head-torso' }, output: { format: 'single-portrait', background: 'opaque', width: 1024, height: 1536, rgba: true, noBakedText: true } };
}
async function cli(args, env) {
  const child = spawn(process.execPath, [new URL('./image-generate.mjs', import.meta.url).pathname, ...args], { env: { PATH: process.env.PATH, ...env } });
  const closed = once(child, 'close', { signal: AbortSignal.timeout(15000) });
  let stdout = '', stderr = '';
  child.stdout.on('data', b => stdout += b); child.stderr.on('data', b => stderr += b);
  const [code, signal] = await closed;
  return { code, signal, stdout, stderr, pid: child.pid };
}
test.each(['machine', 'explicit-root', 'explicit-custom', 'invalid-api-key', 'invalid-translation-api-key'].flatMap(source => ['edits', 'generations'].map(operation => [source, operation])))('machine adapter endpoint integration preserves caller routes: %s %s', async (source, operation) => {
  const evidence = new URL('../../../.omo/evidence/portrait-v7-execute/machine-api-prefix-fix/fixtures/', import.meta.url);
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('route-', evidence));
  const requests = [];
  const server = createServer(async (request, response) => {
    requests.push(request);
    for await (const chunk of request) { assert.ok(chunk.length); }
    response.writeHead(400, { 'Content-Type': 'application/json' });
    response.end('{}');
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1'); await listening;
    const baseUrl = 'http://127.0.0.1:' + server.address().port;
    const environment = { HOME: dir };
    const args = [];
    if (source === 'machine') {
      await mkdir(join(dir, '.omo'));
      await writeFile(join(dir, '.omo', 'cliproxy.json'), JSON.stringify({ baseUrl }));
      environment.CLIPROXY_API_KEY = 'fixture-route-key';
    } else {
      const config = join(dir, 'connection.json');
      const invalid = source === 'invalid-api-key' ? { apiKey: 'fixture-rejected-key' } : source === 'invalid-translation-api-key' ? { translation: { baseUrl, model: 'fixture-text', allowUnauthenticated: true, apiKey: 'fixture-rejected-key' } } : {};
      await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: baseUrl + (source === 'explicit-custom' ? '/custom/api/' : ''), allowUnauthenticated: true, ...invalid }));
      args.push('--connection-config', config);
    }
    const output = join(dir, 'candidate.png');
    if (operation === 'edits') {
      const reference = join(dir, 'reference.png'); await writeFile(reference, png);
      args.push('--image', reference, '--size', '1024x1536');
    } else args.push('--text-only');
    args.push('--prompt', 'Draw an adult with black hair and a plain coat. Opaque background.', '-o', output);
    const result = await cli(args, environment);
    assert.equal(result.code, 2, result.stderr);
    assert.equal(result.stderr.includes('fixture-route-key'), false);
    assert.equal(result.stderr.includes('fixture-rejected-key'), false);
    if (source.startsWith('invalid-')) {
      assert.equal(requests.length, 0);
      assert.match(result.stderr, /invalid (connection|translation) fields/);
    } else {
      assert.match(result.stderr, /HTTP 400/);
      assert.equal(requests.length, 1);
      const [request] = requests;
      const routePrefix = source === 'machine' ? '/v1' : source === 'explicit-custom' ? '/custom/api' : '';
      assert.equal(request.method, 'POST');
      assert.equal(request.url, routePrefix + '/images/' + operation);
      assert.equal(request.headers.authorization, source === 'machine' ? 'Bearer fixture-route-key' : undefined);
      const diagnostic = JSON.parse(await readFile(output + '.http-error.json', 'utf8'));
      assert.equal(diagnostic.schema, 'image-http-error.v1');
      assert.equal(diagnostic.httpStatus, 400);
      assert.equal(diagnostic.operation, operation);
      assert.equal(diagnostic.body.text, '{}');
      assert.equal(diagnostic.body.truncated, false);
      assert.equal(String(await readFile(output + '.request.json', 'utf8')).includes('fixture-route-key'), false);
      assert.equal(JSON.stringify(diagnostic).includes('fixture-route-key'), false);
    }
    for (const suffix of ['', '.receipt.json']) await assert.rejects(readFile(output + suffix), { code: 'ENOENT' });
    if (source.startsWith('invalid-')) await assert.rejects(readFile(output + '.request.json'), { code: 'ENOENT' });
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) });
    server.close(); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});


test.each(['valid', 'absent', 'malformed', 'secret', 'rejected', 'model-mismatch', 'historical', 'invalid-client', 'duplicate-client'].flatMap(scenario => ['edits', 'generations'].map(operation => [scenario, operation])))('request correlation private receipt preserves wire evidence: %s %s', async (scenario, operation) => {
  const evidence = new URL('../../../.omo/evidence/request-correlation-delivery-fixtures/', import.meta.url);
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('correlation-', evidence));
  const uuid = '0d75b479-da57-4f59-8fb6-e8952209389a';
  const credential = 'fixture-correlation-secret';
  const bytes = scenario === 'rejected' ? portraitPng(1254, 1254) : png;
  let posts = 0, wireID;
  const server = createServer(async (req, res) => {
    for await (const chunk of req) { assert.ok(chunk.length); }
    posts++;
    wireID = req.headers['x-request-id'] ?? null;
    assert.equal(req.headers.authorization, 'Bearer ' + credential);
    if (scenario !== 'absent') {
      res.setHeader('x-request-id', scenario === 'malformed' ? 'bad id with spaces' : scenario === 'secret' ? credential : 'server-request-123');
      res.setHeader('request-id', scenario === 'malformed' ? 'bad,id' : 'gateway-request-456');
    }
    res.setHeader('authorization', 'Bearer ' + credential);
    res.setHeader('x-private-config', credential);
    res.end(JSON.stringify({ model: scenario === 'model-mismatch' ? 'gpt-image-2.5-other' : 'gpt-image-2.5-sunburst', data: [{ b64_json: bytes.toString('base64') }] }));
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1'); await listening;
    const config = join(dir, 'connection.json'), image = join(dir, 'image.png'), output = join(dir, 'candidate.png');
    await writeFile(image, png);
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'http://127.0.0.1:' + server.address().port, apiKeyEnv: 'CORRELATION_KEY' }));
    const args = ['--connection-config', config, ...(operation === 'generations' ? ['--text-only'] : ['--image', image, '--size', '1024x1536']), '--prompt', 'Draw an adult with black hair and a plain coat. Opaque background.', '--background', 'opaque', '-o', output];
    if (scenario !== 'historical') args.push('--request-id', scenario === 'invalid-client' ? 'bad-request-id' : uuid);
    if (scenario === 'duplicate-client') args.push('--request-id', uuid);
    const result = await cli(args, { HOME: dir, CORRELATION_KEY: credential });
    assert.equal(result.code, ['rejected', 'model-mismatch', 'invalid-client', 'duplicate-client'].includes(scenario) ? 2 : 0, result.stderr);
    assert.equal(result.stderr.includes(credential), false);
    if (['invalid-client', 'duplicate-client'].includes(scenario)) {
      assert.equal(posts, 0);
      assert.match(result.stderr, /request-id must be a UUID/);
      return;
    }
    assert.equal(posts, 1);
    assert.equal(wireID, scenario === 'historical' ? null : uuid);
    const rejected = ['rejected', 'model-mismatch'].includes(scenario);
    const recordPath = rejected ? join(output + '.native', 'preservation.json') : output + '.receipt.json';
    const text = await readFile(recordPath, 'utf8');
    assert.equal(text.includes(credential), false);
    assert.equal(text.includes('x-private-config'), false);
    assert.equal(text.includes('authorization'), false);
    const record = JSON.parse(text);
    const correlation = record.correlation;
    assert.equal(correlation.requestId, scenario === 'historical' ? null : uuid);
    assert.equal(correlation.responseRequestIds['x-request-id'], ['absent', 'malformed', 'secret'].includes(scenario) ? null : 'server-request-123');
    assert.equal(correlation.responseRequestIds['request-id'], ['absent', 'malformed'].includes(scenario) ? null : 'gateway-request-456');
    assert.equal(correlation.httpStatus, 200);
    assert.ok(Number.isFinite(Date.parse(correlation.dispatchedAt)));
    assert.ok(Date.parse(correlation.responseReceivedAt) >= Date.parse(correlation.dispatchedAt));
    assert.equal(hash(await readFile(rejected ? join(output + '.native', 'image-001.png') : output)), hash(bytes));
    if (rejected) {
      assert.equal(record.outputs[0].outputValidationStatus, 'rejected');
      await assert.rejects(readFile(output), { code: 'ENOENT' });
    }
    if (scenario === 'model-mismatch') {
      assert.match(result.stderr, /image response model differs/);
      assert.equal(record.providerResponse.modelMatches, false);
      assert.deepEqual(record.request, JSON.parse(await readFile(output + '.request.json')));
    }
    await writeFile(new URL(scenario + '-' + operation + '.json', evidence), JSON.stringify({ scenario, operation, posts, wireID, correlation, byteExact: true, secretAbsent: true }, null, 2));
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) });
    server.close(); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});

test('reference record does not infer a same-recipient assertion from its role', async () => {
  const record = await imageRequestRecord('generic instruction', '1152x1344', ['foreign.png'], undefined, [Buffer.from('foreign recipient fixture')], ['recipient-appearance-only']);
  assert.equal(Object.hasOwn(record.references[0], 'sameOwnerRecipient'), false);
});
test.each(['structured', 'raw', 'raw-no-assertion', 'raw-false-assertion', 'raw-conflicting-assertion', 'raw-no-recipient-role', 'structured-cli-assertion', 'unknown-role', 'hash', 'order', 'translation-role', 'translation-appearance'])('recipient appearance loopback preserves ordered multipart binding: %s', async scenario => {
  await mkdir(root, {recursive: true});
  const dir = await mkdtemp(new URL('recipient-', root));
  const bytes = [Buffer.from('neutral style fixture'), Buffer.from('neutral guide fixture'), Buffer.from('foreign recipient neutral fixture')];
  let imagePosts = 0, translationPosts = 0, received;
  const source = model();
  source.references = [
    {index: 1, role: 'drawing-technique-only', sourceHash: hash(bytes[0])},
    {index: 2, role: 'framing-only', sourceHash: hash(bytes[1]), guide: {...source.references[1].guide, sourceHash: hash(bytes[1])}},
    {index: 3, role: 'recipient-appearance-only', sameOwnerRecipient: true, sourceHash: hash(bytes[2]), allowedProperties: ['face', 'body', 'hair', 'outfit', 'accessories']},
  ];
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const b of req) chunks.push(b);
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/chat/completions') {
      translationPosts++;
      const translated = structuredClone(source); translated.appearance.hair.description = 'black hair';
      if (scenario === 'translation-role') translated.references[2].role = 'individual-face-only';
      if (scenario === 'translation-appearance') translated.appearance.face.eyeColor = 'blue';
      res.end(JSON.stringify({choices: [{message: {content: JSON.stringify(translated)}}]}));
      return;
    }
    imagePosts++;
    const form = await new Response(Buffer.concat(chunks), {headers: {'Content-Type': req.headers['content-type']}}).formData();
    received = {model: form.get('model'), size: form.get('size'), prompt: form.get('prompt'), hashes: await Promise.all(form.getAll('image[]').map(async image => hash(Buffer.from(await image.arrayBuffer()))))};
    received.record = JSON.parse(await readFile(join(dir, 'candidate.png.request.json')));
    res.writeHead(400); res.end('{}');
  });
  try {
    const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
    const connection = join(dir, 'connection.json'), output = join(dir, 'candidate.png');
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    await writeFile(connection, JSON.stringify({schemaVersion: 1, provider: 'openai-compatible', baseUrl, allowUnauthenticated: true, translation: {baseUrl, model: 'fixture-text', allowUnauthenticated: true}}));
    const images = bytes.map((_, i) => join(dir, `${i}.png`));
    await Promise.all(images.map((path, i) => writeFile(path, bytes[i])));
    const roles = source.references.map(ref => ref.role);
    if (scenario === 'unknown-role') roles[2] = 'unknown-recipient-role';
    if (scenario === 'raw-no-recipient-role') roles[2] = 'individual-face-only';
    if (scenario === 'hash') source.references[2].sourceHash = hash('other recipient');
    if (scenario === 'order') images.reverse();
    if (scenario.startsWith('translation-')) source.appearance.hair.description = '검은 머리';
    const raw = scenario.startsWith('raw');
    const assertion = scenario === 'raw-false-assertion' ? ['--same-owner-recipient', 'false'] : scenario === 'raw-conflicting-assertion' ? ['--same-owner-recipient', 'true', '--same-owner-recipient', 'false'] : ['raw', 'raw-no-recipient-role', 'structured-cli-assertion'].includes(scenario) ? ['--same-owner-recipient', 'true'] : [];
    const result = await cli(['--connection-config', connection, ...images.flatMap(path => ['--image', path]), '--reference-roles', roles.join(','), ...assertion, '--size', raw ? '1152x1344' : '1024x1536', '--prompt', raw ? 'Create a generic illustrated portrait. Opaque background.' : JSON.stringify(source), '-o', output], {HOME: dir});
    assert.equal(result.code, 2);
    const sent = scenario === 'structured' || scenario === 'raw';
    assert.equal(imagePosts, sent ? 1 : 0, result.stderr);
    assert.equal(translationPosts, scenario.startsWith('translation-') ? 1 : 0);
    if (scenario === 'raw-no-assertion') assert.match(result.stderr, /requires explicit --same-owner-recipient true caller assertion/);
    if (['raw-false-assertion', 'raw-conflicting-assertion'].includes(scenario)) assert.match(result.stderr, /assertion must occur once with explicit true/);
    if (['raw-no-recipient-role', 'structured-cli-assertion'].includes(scenario)) assert.match(result.stderr, /CLI assertion requires a raw recipient-appearance-only reference/);
    if (sent) {
      assert.match(result.stderr, /HTTP 400/);
      assert.deepEqual(received.hashes, bytes.map(hash));
      assert.equal(received.model, 'gpt-image-2.5-sunburst');
      assert.equal(received.size, raw ? '1152x1344' : '1024x1536');
      assert.deepEqual(received.record.references, source.references.map(({index, role, sourceHash, sameOwnerRecipient}) => ({index, role, sha256: sourceHash, ...(sameOwnerRecipient ? {sameOwnerRecipient} : {})})));
      if (!raw) assert.deepEqual(JSON.parse(received.prompt), source);
      else assert.equal(received.record.sourceSnapshot.recipientContext, null);
      const diagnostic = JSON.parse(await readFile(output + '.http-error.json', 'utf8'));
      assert.equal(diagnostic.httpStatus, 400);
      assert.equal(diagnostic.operation, 'edits');
      assert.equal(diagnostic.status, 'attempted-no-automatic-retry');
    }
    for (const suffix of ['', '.receipt.json']) await assert.rejects(readFile(output + suffix), {code: 'ENOENT'});
    if (!sent) await assert.rejects(readFile(output + '.request.json'), {code: 'ENOENT'});
  } finally {
    const closed = new Promise(done => server.close(done)); server.closeAllConnections(); await closed;
    await rm(dir, {recursive: true, force: true});
  }
});
test.each(['IMAGE_FIXTURE_KEY', 'TEXT_FIXTURE_KEY'].flatMap(key => ['source', 'translation', 'revision'].map(stage => [key, stage])))('resolved credential %s is rejected at %s', async (keyName, stage) => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('credential-', root));
  const environment = { HOME: dir, IMAGE_FIXTURE_KEY: 'fixture-image-credential', TEXT_FIXTURE_KEY: 'fixture-text-credential' };
  let imagePosts = 0;
  const server = createServer(async (request, response) => {
    for await (const ignored of request) {}
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/chat/completions') {
      const translated = model(); translated.appearance.hair.description = environment[keyName];
      response.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: JSON.stringify(translated) } }] }));
    } else { imagePosts++; response.end(JSON.stringify({ data: [{ b64_json: png.toString('base64'), revised_prompt: environment[keyName] }] })); }
  });
  try {
    const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const config = join(dir, 'connection.json'), reference = join(dir, 'reference.png'), output = join(dir, 'candidate.png');
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl, apiKeyEnv: 'IMAGE_FIXTURE_KEY', translation: { baseUrl, model: 'fixture-text', apiKeyEnv: 'TEXT_FIXTURE_KEY' } }));
    await writeFile(reference, png);
    const source = model(); source.appearance.hair.description = stage === 'source' ? environment[keyName] : stage === 'translation' ? '검은 머리' : 'black hair';
    const result = await cli(['--connection-config', config, '--image', reference, '--image', reference, '--prompt', JSON.stringify(source), '-o', output], environment);
    assert.equal(result.code, 2); assert.match(result.stderr, /credential value/); assert.equal(imagePosts, stage === 'revision' ? 1 : 0);
    assert.equal(result.stderr.includes(environment[keyName]), false);
    for (const suffix of ['', '.request.json', '.receipt.json']) await assert.rejects(readFile(output + suffix), { code: 'ENOENT' });
  } finally {
    const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});
test.each(['stable', 'changed-pose', 'valid', 'slot', 'duplicate', 'prose'])('legacy subscription model rejects before file reads, HTTP or executable: %s', async scenario => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('codex-rejected-', root));
  let calls = 0;
  const server = createServer((request, response) => { calls++; response.end('{}'); });
  try {
    const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
    const config = join(dir, 'connection.json'), output = join(dir, 'candidate.png'), log = join(dir, 'protocol.json');
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'codex-subscription', imageModel: 'gpt-image-2', modelException: true, codexExecutable: new URL('./test-fixtures/generation-codex.mjs', import.meta.url).pathname, translation: { baseUrl: 'http://127.0.0.1:' + server.address().port, model: 'fixture-text', allowUnauthenticated: true } }));
    const source = model(); source.appearance.hair.description = '검은 머리';
    const result = await cli(['--connection-config', config, '--image', join(dir, 'must-not-read.png'), '--prompt', JSON.stringify(source), '-o', output], { HOME: dir, GENERATION_CODEX_REVISION: scenario, GENERATION_CODEX_LOG: log });
    assert.equal(result.code, 2); assert.match(result.stderr, /requires GPT Image 2.5/); assert.equal(calls, 0);
    for (const path of [log, output, output + '.request.json', output + '.receipt.json']) await assert.rejects(readFile(path), { code: 'ENOENT' });
    assert.equal((await readdir(dir)).some(name => name.startsWith('.image-generate-')), false);
  } finally {
    const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});
test('HTTP 400 image edit keeps one private diagnostic and refuses a second POST', async () => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('http-error-', root));
  const credential = 'fixture-http-error-secret';
  const body = JSON.stringify({ error: { code: 'fixture_rejected', message: 'synthetic provider rejection ' + 'x'.repeat(5000) } });
  const requestId = '0d75b479-da57-4f59-8fb6-e8952209389a';
  let posts = 0;
  const server = createServer(async (request, response) => {
    for await (const chunk of request) { assert.ok(chunk.length); }
    posts++;
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/images/edits');
    assert.equal(request.headers['x-request-id'], requestId);
    response.writeHead(400, { 'Content-Type': 'application/json', 'x-request-id': 'server-request-123', 'request-id': 'gateway-request-456', authorization: 'Bearer ' + credential, 'x-private-config': credential });
    response.end(body);
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1'); await listening;
    const config = join(dir, 'connection.json'), reference = join(dir, 'reference.png'), output = join(dir, 'candidate.png');
    await writeFile(reference, png);
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'http://127.0.0.1:' + server.address().port, apiKeyEnv: 'HTTP_ERROR_KEY' }));
    const args = ['--connection-config', config, '--image', reference, '--size', '1024x1536', '--prompt', 'Draw an adult with black hair and a plain coat. Opaque background.', '--background', 'opaque', '--request-id', requestId, '-o', output];
    const result = await cli(args, { HOME: dir, HTTP_ERROR_KEY: credential });
    assert.equal(result.code, 2, result.stderr);
    assert.match(result.stderr, /HTTP 400/);
    assert.equal(posts, 1);
    assert.equal(`${result.stdout}\n${result.stderr}`.includes(credential), false);
    assert.equal(result.stdout.includes('b64_json'), false);
    assert.equal(result.stdout.includes('"ok":true'), false);
    for (const path of [output, output + '.receipt.json', output + '.native']) await assert.rejects(stat(path), { code: 'ENOENT' });
    const diagnosticPath = output + '.http-error.json';
    const diagnosticText = await readFile(diagnosticPath, 'utf8');
    const requestText = await readFile(output + '.request.json', 'utf8');
    assert.equal(diagnosticText.includes(credential), false);
    assert.equal(diagnosticText.includes('authorization'), false);
    assert.equal(diagnosticText.includes('x-private-config'), false);
    assert.equal(requestText.includes(credential), false);
    const diagnostic = JSON.parse(diagnosticText);
    assert.equal(diagnostic.schema, 'image-http-error.v1');
    assert.equal(diagnostic.status, 'attempted-no-automatic-retry');
    assert.equal(diagnostic.httpStatus, 400);
    assert.equal(diagnostic.operation, 'edits');
    assert.equal(diagnostic.body.truncated, true);
    assert.equal(diagnostic.body.bytes, Buffer.byteLength(body));
    assert.equal(diagnostic.body.sha256, hash(body));
    assert.equal(diagnostic.body.text, body.slice(0, 4096));
    assert.equal(diagnostic.body.text.includes(credential), false);
    assert.equal(diagnostic.correlation.requestId, requestId);
    assert.equal(diagnostic.correlation.httpStatus, 400);
    assert.equal(diagnostic.correlation.responseRequestIds['x-request-id'], 'server-request-123');
    assert.equal(diagnostic.correlation.responseRequestIds['request-id'], 'gateway-request-456');
    assert.equal(diagnostic.requestSha256, hash(requestText));
    assert.equal((await stat(diagnosticPath)).mode & 0o777, 0o600);
    const again = await cli(args, { HOME: dir, HTTP_ERROR_KEY: credential });
    assert.equal(again.code, 2);
    assert.match(again.stderr, /output already exists/);
    assert.equal(posts, 1);
    assert.equal(await readFile(diagnosticPath, 'utf8'), diagnosticText);
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) });
    server.close(); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});

test('HTTP output whose decoded size differs from request is rejected and natively preserved', async () => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('dimension-reject-', root));
  const wrongSize = portraitPng(1254, 1254);
  let posts = 0;
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const b of req) chunks.push(b);
    posts++;
    res.end(JSON.stringify({ model: 'gpt-image-2.5-sunburst', data: [{ b64_json: wrongSize.toString('base64') }] }));
  });
  try {
    const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
    const connection = join(dir, 'connection.json'), image = join(dir, 'image.png'), output = join(dir, 'candidate.png');
    await writeFile(image, png);
    await writeFile(connection, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'http://127.0.0.1:' + server.address().port, allowUnauthenticated: true }));
    const result = await cli(['--connection-config', connection, '--image', image, '--image', image, '--prompt', JSON.stringify(model()), '-o', output], { HOME: dir });
    assert.equal(result.code, 2);
    assert.equal(posts, 1);
    assert.match(result.stderr, /differ from design request/);
    assert.match(result.stderr, /width=1254, height=1254/);
    const preservation = JSON.parse(await readFile(join(output + '.native', 'preservation.json')));
    assert.equal(preservation.schema, 'native-output-preservation.v1');
    assert.equal(preservation.outputs.length, 1);
    assert.equal(preservation.outputs[0].outputValidationStatus, 'rejected');
    assert.equal(preservation.outputs[0].imageSha256, hash(wrongSize));
    assert.equal(hash(await readFile(join(output + '.native', 'image-001.png'))), hash(wrongSize));
    await assert.rejects(readFile(output), { code: 'ENOENT' });
    await assert.rejects(readFile(output + '.receipt.json'), { code: 'ENOENT' });
    await writeFile(new URL('dimension-reject.json', root), JSON.stringify({ result: { code: result.code, posts, stderr: result.stderr }, preservation, nativeHashMatch: true, candidateAbsent: true, receiptAbsent: true }, null, 2));
  } finally {
    const closed = new Promise(done => server.close(done)); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});
test('HTTP model mismatch preserves rejected native bytes and request for upload-only recovery', async () => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('model-reject-', root));
  let generationPosts = 0, uploadPosts = 0, remote = null, wireRequest;
  const server = createServer(async (request, response) => {
    const chunks = []; for await (const bytes of request) chunks.push(bytes);
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/images/edits') {
      generationPosts++;
      wireRequest = await readFile(join(dir, 'candidate.png.request.json'));
      response.end(JSON.stringify({ model: 'gpt-image-2.5-other', data: [{ b64_json: png.toString('base64') }] }));
    } else if (request.method === 'POST') {
      uploadPosts++;
      assert.deepEqual(Buffer.concat(chunks), png);
      remote = hash(Buffer.concat(chunks)); response.end('{}');
    } else response.end(JSON.stringify({ sha256: remote }));
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1'); await listening;
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const config = join(dir, 'connection.json'), reference = join(dir, 'reference.png'), output = join(dir, 'candidate.png');
    await writeFile(config, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl, allowUnauthenticated: true }));
    await writeFile(reference, png);
    const result = await cli(['--connection-config', config, '--image', reference, '--aspect-ratio', '3:4', '--prompt', 'Draw an adult with short black hair.', '-o', output], { HOME: dir });
    assert.equal(result.code, 2); assert.match(result.stderr, /image response model differs/);
    assert.equal(generationPosts, 1);
    const manifestPath = join(output + '.native', 'preservation.json');
    const manifestBytes = await readFile(manifestPath), manifest = JSON.parse(manifestBytes);
    assert.equal(manifest.outputs[0].outputValidationStatus, 'rejected');
    assert.equal(manifest.outputs[0].imageSha256, hash(png));
    assert.equal(manifest.providerResponse.model, 'gpt-image-2.5-other');
    assert.equal(manifest.providerResponse.selectedModel, 'gpt-image-2.5-sunburst');
    assert.equal(manifest.providerResponse.modelMatches, false);
    assert.deepEqual(await readFile(manifest.outputs[0].path), png);
    assert.deepEqual(await readFile(output + '.request.json'), wireRequest);
    assert.deepEqual(manifest.request, JSON.parse(wireRequest));
    for (const path of [output, output + '.receipt.json']) await assert.rejects(readFile(path), { code: 'ENOENT' });
    const options = { manifestPath, statePath: join(dir, 'publication.json'),
      publisher: async ({ bytes }) => { const response = await fetch(baseUrl + '/publish', { method: 'POST', body: bytes, signal: AbortSignal.timeout(5000) }); assert.equal(response.ok, true); },
      remoteHashLookup: async () => (await (await fetch(baseUrl + '/hash', { signal: AbortSignal.timeout(5000) })).json()).sha256,
    };
    const state = await resumePublication(options);
    assert.equal(state.outputs[0].status, 'published'); assert.equal(state.outputs[0].outputValidationStatus, 'rejected');
    assert.equal(state.ownerVerdict, 'pending');
    await resumePublication(options);
    assert.equal(uploadPosts, 1); assert.equal(generationPosts, 1);
    assert.deepEqual(await readFile(manifestPath), manifestBytes);
    assert.deepEqual(await readFile(manifest.outputs[0].path), png);
    await writeFile(new URL('model-mismatch-proof.json', root), JSON.stringify({ rejectedCode: result.code, generationPosts, uploadPosts, recoveryGenerationCalls: 0, realProviderCalls: 0, nativeSHA256: hash(png), requestSHA256: hash(wireRequest), manifestSHA256: hash(manifestBytes), nativeByteExact: true, requestRetained: true, candidateAbsent: true, receiptAbsent: true, manifest, state }, null, 2));
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) }); server.close(); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
  }
});
test('fresh selected HTTP config ignores OmO decoys and missing translation sends zero images', async () => {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('http-', root));
  let posts = 0, proof, imageOptions;
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const b of req) chunks.push(b);
    posts++;
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
    imageOptions = { background: form.get('background'), outputFormat: form.get('output_format') };
    assert.equal(form.get('model'), 'gpt-image-2.5-sunburst');
    res.end(JSON.stringify({ model: form.get('model'), data: [{ b64_json: png.toString('base64') }] }));
  });
  try {
    const listening = once(server, 'listening'); server.listen(0, '127.0.0.1'); await listening;
    await mkdir(join(dir, '.omo')); await writeFile(join(dir, '.omo/config.json'), 'invalid-private-config'); await writeFile(join(dir, '.omo/auth.json'), 'private-auth-decoy');
    const connection = join(dir, 'selected.json'), image = join(dir, 'image.png'), output = join(dir, 'candidate.png');
    await writeFile(image, png);
    const args = ['--connection-config', connection, '--image', image, '--image', image];
    const missing = await cli([...args, '--prompt', JSON.stringify(model()), '-o', output], { HOME: dir });
    assert.equal(missing.code, 2); assert.equal(posts, 0);
    await writeFile(connection, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'http://127.0.0.1:' + server.address().port, allowUnauthenticated: true }));
    const nonEnglish = model(); nonEnglish.appearance.hair.description = '검은 머리';
    const untranslated = await cli([...args, '--prompt', JSON.stringify(nonEnglish), '-o', output], { HOME: dir });
    assert.equal(untranslated.code, 2); assert.match(untranslated.stderr, /translation connection/); assert.equal(posts, 0);
    const valid = await cli([...args, '--prompt', JSON.stringify(model()), '-o', output], { HOME: dir });
    assert.equal(valid.code, 0, valid.stderr); assert.equal(posts, 1);
    assert.deepEqual(imageOptions, { background: 'opaque', outputFormat: 'png' });
    const before = hash(await readFile(output));
    const collision = await cli([...args, '--prompt', JSON.stringify(model()), '-o', output], { HOME: dir });
    assert.equal(collision.code, 2); assert.equal(posts, 1); assert.equal(hash(await readFile(output)), before);
    proof = { missing, untranslated, valid, collision, imagePosts: posts, receipt: JSON.parse(await readFile(output + '.receipt.json')) };
  } finally {
    const closed = new Promise(done => server.close(done)); server.closeAllConnections(); await closed;
    await rm(dir, { recursive: true, force: true });
    if (proof) { proof.cleanup = { serverClosed: !server.listening, fixtureRemoved: true }; await writeFile(new URL('http-cli.json', root), JSON.stringify(proof, null, 2)); }
  }
});
