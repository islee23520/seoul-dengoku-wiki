import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { resumePublication } from './publication-resume.mjs';
import { portraitPng } from './test-fixtures/connection.mjs';

const evidence = new URL('../../../.omo/evidence/portrait-v7-execute/publication-resume/', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test.each(['normal', 'upload-failure', 'lost-response', 'source-mismatch', 'remote-mismatch', 'lookup-failure'])('upload-only recovery over local HTTP: %s', async scenario => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('http-', evidence));
  const native = portraitPng();
  const imagePath = join(dir, 'image-001.png'), manifestPath = join(dir, 'preservation.json'), statePath = join(dir, 'publication.json');
  const manifestBytes = Buffer.from(JSON.stringify({ schema: 'native-output-preservation.v1', request: { privateContext: 'must-not-publish' }, sourceCount: 1, rawCount: 1, pendingCount: 1, outputs: [{ index: 1, path: imagePath, imageSha256: digest(native), status: 'upload-pending', outputValidationStatus: 'rejected' }] }));
  await writeFile(imagePath, native); await writeFile(manifestPath, manifestBytes);
  let posts = 0, gets = 0, remote = null, failUpload = scenario === 'upload-failure', loseResponse = scenario === 'lost-response', failLookup = false;
  const requests = [];
  const server = createServer(async (request, response) => {
    requests.push(request.method);
    if (request.method === 'POST') {
      posts++;
      const chunks = []; for await (const bytes of request) chunks.push(bytes);
      assert.deepEqual(Buffer.concat(chunks), native);
      if (failUpload) { response.writeHead(503); response.end(); return; }
      remote = scenario === 'remote-mismatch' ? '0'.repeat(64) : digest(Buffer.concat(chunks));
      if (loseResponse) { request.socket.destroy(); return; }
      response.end('{}');
    } else {
      gets++;
      if (failLookup) { response.writeHead(503); response.end(); return; }
      response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ sha256: remote }));
    }
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1'); await listening;
    const url = `http://127.0.0.1:${server.address().port}`;
    const options = { manifestPath, statePath,
      publisher: async ({ bytes }) => { const response = await fetch(url, { method: 'POST', body: bytes, signal: AbortSignal.timeout(5000) }); if (!response.ok) throw new Error('upload HTTP ' + response.status); },
      remoteHashLookup: async () => { const response = await fetch(url, { signal: AbortSignal.timeout(5000) }); if (!response.ok) throw new Error('lookup HTTP ' + response.status); return (await response.json()).sha256; },
    };
    if (scenario === 'source-mismatch') {
      await writeFile(imagePath, Buffer.from('corrupted native'));
      await assert.rejects(resumePublication(options), /native source SHA-256 mismatch/);
      assert.equal(posts, 0); assert.equal(gets, 0);
      assert.equal(JSON.parse(await readFile(statePath)).outputs[0].status, 'pending');
      await writeFile(imagePath, native);
    } else if (scenario !== 'normal') {
      if (scenario === 'lookup-failure') loseResponse = true;
      await assert.rejects(resumePublication(options));
      const failed = JSON.parse(await readFile(statePath));
      assert.equal(failed.outputs[0].status, 'uncertain'); assert.ok(failed.outputs[0].publicationError);
      const before = posts;
      if (scenario === 'remote-mismatch' || scenario === 'lookup-failure') {
        failLookup = scenario === 'lookup-failure';
        await assert.rejects(resumePublication(options), scenario === 'lookup-failure' ? /lookup HTTP 503/ : /remote SHA-256 mismatch/);
        assert.equal(posts, before);
        remote = digest(native); failLookup = false;
      }
      failUpload = false; loseResponse = false;
      const recovered = await resumePublication(options);
      assert.equal(recovered.outputs[0].status, 'published');
      assert.equal(posts, scenario === 'upload-failure' ? 2 : 1);
      if (scenario === 'upload-failure') assert.deepEqual(requests.slice(0, 3), ['POST', 'GET', 'POST']);
    }
    const confirmed = await resumePublication(options);
    assert.equal(confirmed.outputs[0].status, 'published');
    assert.equal(confirmed.outputs[0].outputValidationStatus, 'rejected'); assert.equal(confirmed.ownerVerdict, 'pending'); assert.equal(confirmed.outputs[0].publicationError, null);
    const before = posts;
    await resumePublication(options); assert.equal(posts, before);
    assert.deepEqual(await readFile(imagePath), native); assert.deepEqual(await readFile(manifestPath), manifestBytes);
    await writeFile(imagePath, Buffer.from('changed after confirmation'));
    await assert.rejects(resumePublication(options), /native source SHA-256 mismatch/); assert.equal(posts, before);
    await writeFile(imagePath, native);
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) });
    server.close(); server.closeAllConnections(); await closed;
    assert.equal(server.listening, false);
    await writeFile(new URL(scenario + '.json', evidence), JSON.stringify({ scenario, posts, gets, requests, nativeSha256: digest(native), serverClosed: !server.listening, originalManifestUnchanged: (await readFile(manifestPath)).equals(manifestBytes), originalImageUnchanged: (await readFile(imagePath)).equals(native) }, null, 2) + '\n');
    await rm(dir, { recursive: true, force: true });
  }
});

test.each(['two-output', 'manifest-binding', 'state-binding', 'image-collision', 'manifest-collision'])('publication boundaries over local HTTP: %s', async scenario => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('boundary-', evidence));
  const native = portraitPng(), manifestPath = join(dir, 'preservation.json'), statePath = join(dir, 'publication.json');
  const outputs = [1, 2].map(index => ({ index, path: join(dir, `image-${index}.png`), imageSha256: digest(native), status: 'upload-pending', outputValidationStatus: index === 1 ? 'accepted' : 'rejected' }));
  for (const item of outputs) await writeFile(item.path, native);
  const manifest = Buffer.from(JSON.stringify({ schema: 'native-output-preservation.v1', sourceCount: 2, rawCount: 2, pendingCount: 2, outputs }));
  await writeFile(manifestPath, manifest);
  const posts = [0, 0], remote = [null, null];
  let failSecond = true;
  const server = createServer(async (request, response) => {
    const index = Number(request.url.slice(1)) - 1;
    if (request.method === 'POST') {
      posts[index]++;
      const chunks = []; for await (const bytes of request) chunks.push(bytes);
      assert.deepEqual(Buffer.concat(chunks), native);
      if (index === 1 && failSecond) { response.writeHead(503); response.end(); return; }
      remote[index] = digest(Buffer.concat(chunks)); response.end('{}');
    } else { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ sha256: remote[index] })); }
  });
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) });
    server.listen(0, '127.0.0.1'); await listening;
    const url = `http://127.0.0.1:${server.address().port}`;
    const options = { manifestPath, statePath,
      publisher: async ({ index, bytes }) => { const response = await fetch(`${url}/${index}`, { method: 'POST', body: bytes, signal: AbortSignal.timeout(5000) }); if (!response.ok) throw new Error('upload HTTP ' + response.status); },
      remoteHashLookup: async ({ index }) => (await (await fetch(`${url}/${index}`, { signal: AbortSignal.timeout(5000) })).json()).sha256,
    };
    if (scenario === 'two-output') {
      await assert.rejects(resumePublication(options), /upload HTTP 503/);
      const partial = JSON.parse(await readFile(statePath));
      assert.deepEqual(partial.outputs.map(item => item.status), ['published', 'uncertain']);
      assert.deepEqual(partial.outputs.map(item => item.outputValidationStatus), ['accepted', 'rejected']);
      failSecond = false;
      const resumed = await resumePublication(options);
      assert.deepEqual(resumed.outputs.map(item => item.status), ['published', 'published']);
      assert.deepEqual(posts, [1, 2]);
      await resumePublication(options); assert.deepEqual(posts, [1, 2]);
    } else if (scenario.endsWith('collision')) {
      await assert.rejects(resumePublication({ ...options, statePath: scenario === 'image-collision' ? join(dir, '.', 'image-2.png') : manifestPath }), /publication state must be separate/);
      assert.deepEqual(posts, [0, 0]);
    } else {
      const state = { schema: 'native-publication-resume.v1', manifestSha256: digest(manifest), ownerVerdict: 'pending', outputs: outputs.map(item => ({ index: item.index, imageSha256: item.imageSha256, outputValidationStatus: item.outputValidationStatus, status: 'pending', publicationError: null })) };
      if (scenario === 'manifest-binding') state.manifestSha256 = '0'.repeat(64);
      else state.outputs[1].imageSha256 = '0'.repeat(64);
      const original = Buffer.from(JSON.stringify(state)); await writeFile(statePath, original);
      await assert.rejects(resumePublication(options), /publication state binding mismatch/);
      assert.deepEqual(await readFile(statePath), original); assert.deepEqual(posts, [0, 0]);
    }
    assert.deepEqual(await readFile(manifestPath), manifest);
    for (const item of outputs) assert.deepEqual(await readFile(item.path), native);
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) }); server.close(); server.closeAllConnections(); await closed;
    await writeFile(new URL(scenario + '.json', evidence), JSON.stringify({ scenario, posts, serverClosed: !server.listening, originalManifestUnchanged: (await readFile(manifestPath)).equals(manifest), originalImagesUnchanged: (await Promise.all(outputs.map(item => readFile(item.path)))).every(bytes => bytes.equals(native)) }, null, 2) + '\n');
    await rm(dir, { recursive: true, force: true });
  }
});

test.each(['missing-status', 'invented-status', 'negative-index', 'zero-index', 'forged-owner', 'producer-relative'])('adversarial preservation regression: %s', async scenario => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(new URL('adversarial-', evidence));
  const native = portraitPng(), manifestPath = join(dir, 'preservation.json'), statePath = join(dir, 'publication.json');
  let posts = 0, generationPosts = 0, remote = null, producerResult = null;
  const server = createServer(async (request, response) => {
    const chunks = []; for await (const bytes of request) chunks.push(bytes);
    if (request.url === '/images/edits') {
      generationPosts++; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ data: [{ b64_json: native.toString('base64') }] }));
    } else if (request.method === 'POST') {
      posts++; assert.deepEqual(Buffer.concat(chunks), native); remote = digest(native); response.end('{}');
    } else { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ sha256: remote })); }
  });
  let originalManifest, actualManifestPath = manifestPath, imagePath = join(dir, 'image-001.png');
  try {
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) }); server.listen(0, '127.0.0.1'); await listening;
    const url = `http://127.0.0.1:${server.address().port}`;
    await writeFile(imagePath, native);
    if (scenario === 'producer-relative') {
      const configPath = join(dir, 'connection.json');
      await writeFile(configPath, JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: url, allowUnauthenticated: true }));
      await mkdir(join(dir, 'generated'));
      const child = spawn(process.execPath, [new URL('./image-generate.mjs', import.meta.url).pathname, '--connection-config', configPath, '--image', imagePath, '--aspect-ratio', '3:4', '--prompt', 'A watercolor portrait on a plain background.', '-o', 'generated/candidate.png'], { cwd: dir, env: { PATH: process.env.PATH, HOME: dir } });
      const closed = once(child, 'close', { signal: AbortSignal.timeout(15000) });
      let stdout = '', stderr = ''; child.stdout.on('data', bytes => stdout += bytes); child.stderr.on('data', bytes => stderr += bytes);
      const [exitCode, signal] = await closed; producerResult = { exitCode, signal, stdout, stderr, cwd: dir };
      assert.equal(exitCode, 0, stderr); assert.equal(generationPosts, 1);
      actualManifestPath = join(dir, 'generated/candidate.png.native/preservation.json');
      originalManifest = await readFile(actualManifestPath);
      const actual = JSON.parse(originalManifest);
      assert.equal(actual.outputs[0].path, 'generated/candidate.png.native/image-001.png');
      imagePath = join(dir, actual.outputs[0].path);
      await writeFile(new URL('actual-producer-preservation.json', evidence), originalManifest);
      await writeFile(new URL('actual-producer-native.png', evidence), await readFile(imagePath));
      assert.notEqual(process.cwd(), dir);
    } else {
      const output = { index: 1, path: imagePath, imageSha256: digest(native), status: 'upload-pending', outputValidationStatus: 'pending' };
      if (scenario === 'missing-status') delete output.outputValidationStatus;
      if (scenario === 'invented-status') output.outputValidationStatus = 'owner-approved';
      if (scenario === 'negative-index') output.index = -1;
      if (scenario === 'zero-index') output.index = 0;
      originalManifest = Buffer.from(JSON.stringify({ schema: 'native-output-preservation.v1', sourceCount: 1, rawCount: 1, pendingCount: 1, outputs: [output] }));
      await writeFile(actualManifestPath, originalManifest);
    }
    const options = { manifestPath: actualManifestPath, statePath, ...(scenario === 'producer-relative' ? { producerBase: dir } : {}),
      publisher: async ({ bytes }) => { const response = await fetch(url + '/publish', { method: 'POST', body: bytes, signal: AbortSignal.timeout(5000) }); if (!response.ok) throw new Error('upload HTTP ' + response.status); },
      remoteHashLookup: async () => (await (await fetch(url + '/hash', { signal: AbortSignal.timeout(5000) })).json()).sha256,
    };
    if (scenario === 'forged-owner') {
      const state = { schema: 'native-publication-resume.v1', manifestSha256: digest(originalManifest), ownerVerdict: 'accepted', outputs: [{ index: 1, imageSha256: digest(native), outputValidationStatus: 'pending', status: 'published', publicationError: null }] };
      const originalState = Buffer.from(JSON.stringify(state)); await writeFile(statePath, originalState);
      await assert.rejects(resumePublication(options), /publication state binding mismatch/);
      assert.deepEqual(await readFile(statePath), originalState); assert.equal(posts, 0);
    } else if (scenario === 'producer-relative') {
      await assert.rejects(resumePublication({ ...options, producerBase: undefined }), /absolute producerBase required/);
      await assert.rejects(readFile(statePath), { code: 'ENOENT' }); assert.equal(posts, 0);
      const resumed = await resumePublication(options);
      assert.equal(resumed.outputs[0].status, 'published'); assert.equal(resumed.ownerVerdict, 'pending');
      await resumePublication(options); assert.equal(posts, 1);
    } else {
      await assert.rejects(resumePublication(options), /invalid native preservation manifest/);
      assert.equal(posts, 0); await assert.rejects(readFile(statePath), { code: 'ENOENT' });
    }
    assert.deepEqual(await readFile(actualManifestPath), originalManifest); assert.deepEqual(await readFile(imagePath), native);
  } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) }); server.close(); server.closeAllConnections(); await closed;
    await writeFile(new URL(scenario + '.json', evidence), JSON.stringify({ scenario, posts, generationPosts, producerResult, actualManifestPath, nativeSha256: digest(native), serverClosed: !server.listening, originalManifestUnchanged: originalManifest ? (await readFile(actualManifestPath)).equals(originalManifest) : null, originalImageUnchanged: (await readFile(imagePath)).equals(native), fixtureDirectoryRemovedAfterEvidence: dir }, null, 2) + '\n');
    await rm(dir, { recursive: true, force: true });
  }
});
