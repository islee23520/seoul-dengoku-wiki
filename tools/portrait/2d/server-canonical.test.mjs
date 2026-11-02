import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';

// Run the complete HTTP surface in a fresh process, never inheriting provider credentials.
const childCode = String.raw`
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { connect } from 'node:net';
const config = JSON.parse(process.argv[1]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fixtureBase = resolve(config.root, '../../../.omo/evidence/cast-remaining-delivery-20261003/task26/gui/fixtures');
await mkdir(fixtureBase, { recursive: true });
const dir = await mkdtemp(join(fixtureBase, 'portrait-server-canonical-'));
const rows = [];
const providerRequests = [];
const ports = [];
let gui;
const fake = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  const body = bytes.toString('utf8');
  if (request.url === '/images/edits') {
    const form = await new Response(bytes, { headers: { 'Content-Type': request.headers['content-type'] } }).formData();
    assert.equal(form.get('prompt').includes('serializedRecipientContext='), false);
    assert.equal(form.get('prompt').includes('lore/name-pools/person-id-registry.json'), false);
    assert.equal(form.get('prompt').includes('Authored fixture background.'), false);
    providerRequests.push({ method: request.method, path: request.url, prompt: form.get('prompt'), model: form.get('model') });
  } else providerRequests.push({ method: request.method, path: request.url, body });
  response.setHeader('Content-Type', 'application/json');
  if (request.url === '/chat/completions') response.end(JSON.stringify({ choices: [{ message: { content: JSON.parse(body).messages[1].content.replace(/[^\x00-\x7f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) } }] }));
  else if (request.url === '/images/edits') response.end(JSON.stringify({ data: [{ b64_json: Buffer.from([137,80,78,71,13,10,26,10]).toString('base64') }] }));
  else { response.statusCode = 404; response.end('{}'); }
});
const close = server => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
const absent = port => new Promise((resolve, reject) => {
  const socket = connect({ host: '127.0.0.1', port });
  socket.setTimeout(2000, () => { socket.destroy(); reject(new Error('port probe timeout')); });
  socket.once('connect', () => { socket.destroy(); reject(new Error('owned port still open')); });
  socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve(true) : reject(error));
});
let proof;
try {
  const listening = once(fake, 'listening', { signal: AbortSignal.timeout(5000) });
  fake.listen(0, '127.0.0.1');
  await listening;
  ports.push(fake.address().port);
  process.env.CHARACTER_AI_BASE_URL = 'http://127.0.0.1:' + fake.address().port;
  process.env.CHARACTER_AI_API_KEY = '';
  process.env.CHARACTER_AI_IMAGE_MODEL = 'local-fake';
  process.env.CHARACTER_AI_TRANSLATION_MODEL = 'local-fake';
  process.env.HOME = dir;
  const { startServer } = await import(pathToFileURL(join(config.root, 'server.mjs')));
  let record = JSON.parse(await readFile(join(config.root, 'characters/shin-jongmok.json'), 'utf8'));
  record.outfit.upper.value = record.outfit.upper.value.replace(record.name, 'recipient');
  let canonicalRoot = dir;
  let stylePath = join(dir, 'style.json');
  let referencePath = join(dir, 'style.png');
  let faceVariantCatalogPath = null;
  if (config.actual) {
    record = JSON.parse(await readFile(config.actual.records, 'utf8')).find(row => row.characterId === 'K027');
    assert(record);
    ({ canonicalRoot, stylePath, referencePath, faceVariantCatalogPath } = config.actual);
  } else {
    for (const folder of ['lore/name-pools', 'lore/characters', 'public/person-details']) await mkdir(join(dir, folder), { recursive: true });
    record.personId = 'person-1009';
    record.identity = { characterId: record.characterId, name: record.name };
    record.faceMode = { kind: 'unique', variantId: null };
    record.birthContext = { birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31', source: 'fixture' };
    const registry = JSON.stringify({ persons: [{ id: record.characterId, name: record.name }] });
    const background = JSON.stringify({ content: [{ ko: 'Authored fixture background.' }] });
    record.canonicalContext = { characterId: record.characterId, name: record.name, personId: record.personId, registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: hash(registry) }, background: [{ path: 'lore/characters/card.json', pointer: '/content/0', sha256: hash(background), text: 'Authored fixture background.' }] };
    await writeFile(join(dir, record.canonicalContext.registry.path), registry);
    await writeFile(join(dir, record.canonicalContext.background[0].path), background);
    await writeFile(join(dir, 'lore/name-pools/cast-birthdays.json'), JSON.stringify({ ageAsOf: record.birthContext.ageAsOf, people: [{ id: record.characterId, name: record.name, birthDate: record.birthContext.birthDate }] }));
    await writeFile(join(dir, 'public/person-details/' + record.personId + '.json'), JSON.stringify({ id: record.personId, name: record.name, detailRoute: '/people/' + record.personId, familyTree: { personId: record.characterId }, ...record.birthContext }));
    const bytes = Buffer.from('local selected reference');
    await writeFile(referencePath, bytes);
    await writeFile(stylePath, JSON.stringify({ styleId: 'fixture', status: 'owner-selected-reference', referenceSha256: hash(bytes) }));
  }
  const start = async options => {
    gui = startServer({ port: 0, referencePath, stylePath, faceVariantCatalogPath, outputDir: dir, ...options });
    await once(gui, 'listening', { signal: AbortSignal.timeout(5000) });
    ports.push(gui.address().port);
  };
  const post = async (label, path, payload, expected) => {
    const response = await fetch('http://127.0.0.1:' + gui.address().port + path, { method: 'POST', body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    rows.push({ label, path, payload, status: response.status, body });
    assert.equal(response.status, expected, label + ': ' + body);
    return JSON.parse(body);
  };
  const payload = { character: record.characterId.toLowerCase(), record, mode: 'portrait', faceMode: record.faceMode, faceSelection: record.faceSelection };
  await start({ canonicalRoot });
  if (config.expectBroken) {
    const result = await post('before-fix-valid-canonical', '/api/preview', payload, 400);
    assert.equal(result.error, 'authoritative context requires canonicalRoot');
  } else {
    const valid = await post('valid-canonical', '/api/preview', payload, 200);
    assert.equal(valid.characterId, record.characterId);
    assert.equal(valid.name, record.name);
    assert.equal(valid.personId, record.personId);
    assert.deepEqual(valid.canonicalContext, record.canonicalContext);
    assert.deepEqual(valid.birthContext, record.birthContext);
    await post('payload-root-cannot-replace-trusted-root', '/api/preview', { ...payload, canonicalRoot: '/does-not-exist' }, 200);
    for (const kind of ['date', 'age', 'sha', 'pointer']) {
      const bad = structuredClone(payload);
      if (kind === 'date') bad.record.birthContext.birthDate = '2090-02-31';
      if (kind === 'age') bad.record.birthContext.age++;
      if (kind === 'sha') bad.record.canonicalContext.registry.sha256 = '0'.repeat(64);
      if (kind === 'pointer') bad.record.canonicalContext.registry.pointer = '/persons/999999';
      await post('invalid-' + kind + '-preview', '/api/preview', bad, 400);
      await post('invalid-' + kind + '-generate', '/api/generate', bad, 400);
    }
    assert.equal(providerRequests.length, 0);
    const generated = await post('valid-generate', '/api/generate', payload, 200);
    assert.deepEqual(generated.canonicalContext, record.canonicalContext);
    assert.deepEqual(generated.birthContext, record.birthContext);
    assert.equal(providerRequests.filter(row => row.path === '/images/edits').length, 1);
    const receipt = JSON.parse(await readFile(join(dir, generated.imageUrl.slice('/api/image/'.length)) + '.json', 'utf8'));
    assert.deepEqual(receipt.canonicalContext, record.canonicalContext);
    await close(gui); gui = null;
    await start({});
    await post('payload-root-cannot-enable-unconfigured-server', '/api/preview', { ...payload, canonicalRoot }, 400);
    const legacy = structuredClone(payload);
    delete legacy.record.canonicalContext;
    delete legacy.record.birthContext;
    await post('legacy-no-canonical-root', '/api/preview', legacy, 200);
  }
  proof = { sourceSha256: hash(await readFile(join(config.root, 'server.mjs'))), canonicalRoot, recordIdentity: { characterId: record.characterId, name: record.name, personId: record.personId, birthContext: record.birthContext }, rows, providerRequests, invalidImagePosts: 0 };
} finally {
  if (gui) await close(gui);
  await close(fake);
  await rm(dir, { recursive: true, force: true });
  const portsAbsent = [];
  for (const port of ports) portsAbsent.push({ port, absent: await absent(port) });
  if (proof) { proof.cleanup = { portsAbsent, fixtureBase, ownedDirectoryRemoved: dir, childPid: process.pid }; console.log(JSON.stringify(proof)); }
}
`;

test('trusted GUI canonical root validates HTTP preview and generation in an isolated process', async () => {
  const root = fileURLToPath(new URL('.', import.meta.url));
  const { stdout } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', childCode, JSON.stringify({ root })], {
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8' }, timeout: 25000, maxBuffer: 4 * 1024 * 1024,
  });
  const proof = JSON.parse(stdout);
  assert.equal(proof.rows.length, 13);
  assert.equal(proof.invalidImagePosts, 0);
  assert(proof.cleanup.portsAbsent.every(row => row.absent));
});
