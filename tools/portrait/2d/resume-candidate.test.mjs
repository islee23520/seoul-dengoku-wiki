import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { test } from 'vitest';
import { inspectCandidate } from './resume-candidate.mjs';

const root = new URL('../../../.omo/evidence/omarchy-portrait-split-20261003/resume/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ioAAAAASUVORK5CYII=', 'base64');

async function fixture(run) {
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(new URL('fixture-', root));
  try {
    const imagePath = join(dir, 'ordinal-002.png');
    const options = { imagePath, requestPath: `${imagePath}.request.json`, receiptPath: `${imagePath}.receipt.json`, inputPath: join(dir, 'input.json'), metadataPath: `${imagePath}.json` };
    const input = { schemaVersion: 2, characterId: 'K002', name: 'Fixture Two', personId: 'ordinal-002', revision: 1 };
    const request = { schemaVersion: 1, model: 'fixture-model', prompt: 'Fixture portrait', size: '1024x1536', n: 1, references: [{ index: 1, role: 'style-only', sha256: hash(png) }] };
    const receipt = { request, imageSha256: hash(png), status: 'candidate-unreviewed' };
    const metadata = { ...input, imagePath, imageSha256: hash(png), prompt: request.prompt, referenceSha256: request.references[0].sha256, imageReviewStatus: 'candidate-unreviewed' };
    const records = { input, request, receipt, metadata };
    await writeFile(imagePath, png);
    for (const [key, record] of Object.entries(records)) await writeFile(options[`${key}Path`], JSON.stringify(record));
    options.expected = { characterId: input.characterId, name: input.name, inputSha256: hash(await readFile(options.inputPath)) };
    options.binding = { characterId: input.characterId, name: input.name };
    for (const key of ['image', 'request', 'receipt', 'input', 'metadata']) options.binding[`${key}Sha256`] = hash(await readFile(options[`${key}Path`]));
    await run({ dir, options, records });
  } finally { await rm(dir, { recursive: true }); }
}

test('bound triples reuse generated candidates, independent of current presentation ordinal', async () => fixture(async ({ options }) => {
  const result = await inspectCandidate({ ...options, expected: { ...options.expected, personId: 'ordinal-310' } });
  assert.equal(result.status, 'generated');
  assert.equal(result.requiresNewSuffix, false);
  assert.equal(result.hashes.imageSha256, hash(png));
  assert.equal(Object.hasOwn(result, 'approved'), false);
  assert.equal((await inspectCandidate({ ...options, binding: null })).status, 'unverified');
}));

test('missing files and interrupted sidecar writes never complete or permit overwrite', async () => fixture(async ({ options }) => {
  const original = await readFile(options.receiptPath);
  await rm(options.receiptPath);
  assert.equal((await inspectCandidate(options)).status, 'pending');
  await writeFile(options.receiptPath, '{');
  assert.equal((await inspectCandidate(options)).status, 'unverified');
  await writeFile(options.receiptPath, original);
  assert.equal((await inspectCandidate(options)).status, 'generated');
  await rm(options.requestPath);
  assert.equal((await inspectCandidate(options)).requiresNewSuffix, true);
  await rm(options.imagePath);
  await rm(options.receiptPath);
  await rm(options.metadataPath);
  assert.equal((await inspectCandidate(options)).requiresNewSuffix, false);
}));

test.each(['image', 'request', 'receipt', 'metadata', 'input'])('changed %s snapshot invalidates historical binding', async key => fixture(async ({ options, records }) => {
  if (key === 'image') await writeFile(options.imagePath, Buffer.concat([png, Buffer.from('changed')]));
  else await writeFile(options[`${key}Path`], JSON.stringify({ ...records[key], revision: 2 }));
  const result = await inspectCandidate(options);
  assert.equal(result.status, 'unverified');
  assert.equal(result.requiresNewSuffix, true);
}));

test('receipt hash corruption and failed generation status cannot be reused', async () => fixture(async ({ options, records }) => {
  for (const change of [{ imageSha256: '0'.repeat(64) }, { status: 'failed' }, { request: { ...records.request, prompt: 'different' } }]) {
    await writeFile(options.receiptPath, JSON.stringify({ ...records.receipt, ...change }));
    options.binding.receiptSha256 = hash(await readFile(options.receiptPath));
    assert.equal((await inspectCandidate(options)).reason, 'generation-receipt-mismatch');
  }
}));

test.each(['input', 'request', 'receipt', 'metadata'])('null %s records remain unverified without throwing', async key => fixture(async ({ options }) => {
  await writeFile(options[`${key}Path`], 'null');
  assert.equal((await inspectCandidate(options)).status, 'unverified');
}));

test('same ordinal collisions, changed names, source revisions and request context do not skip another K', async () => fixture(async ({ options, records }) => {
  assert.equal((await inspectCandidate({ ...options, expected: { ...options.expected, characterId: 'K310' } })).status, 'unverified');
  assert.equal((await inspectCandidate({ ...options, expected: { ...options.expected, name: 'Other Name' } })).status, 'unverified');
  assert.equal((await inspectCandidate({ ...options, binding: { ...options.binding, characterId: 'K310' } })).status, 'unverified');
  await writeFile(options.inputPath, JSON.stringify({ ...records.input, revision: 2 }));
  const expected = { ...options.expected, inputSha256: hash(await readFile(options.inputPath)) };
  assert.equal((await inspectCandidate({ ...options, expected })).reason, 'binding-input-hash-mismatch');
  const request = { ...records.request, sourceContext: { characterId: 'K310', name: 'Other Name' } };
  await writeFile(options.requestPath, JSON.stringify(request));
  await writeFile(options.receiptPath, JSON.stringify({ ...records.receipt, request }));
  assert.equal((await inspectCandidate({ ...options, expected })).reason, 'request-context-mismatch');
}));

test('hash-specific owner rejection preserves old bytes and requires a new suffix', async () => fixture(async ({ dir, options }) => {
  const rejectedImageSha256 = [hash(png)];
  const old = await readFile(options.imagePath);
  assert.equal((await inspectCandidate({ ...options, rejectedImageSha256 })).status, 'rejected');
  await rm(options.receiptPath);
  assert.equal((await inspectCandidate({ ...options, rejectedImageSha256 })).status, 'rejected');
  const freshPath = join(dir, 'K002-retry-02.png');
  const fresh = await inspectCandidate({ ...options, imagePath: freshPath, requestPath: `${freshPath}.request.json`, receiptPath: `${freshPath}.receipt.json`, metadataPath: null, rejectedImageSha256 });
  assert.equal(fresh.status, 'pending');
  assert.equal(fresh.requiresNewSuffix, false);
  assert.deepEqual(await readFile(options.imagePath), old);
}));

test('real provider-free CLI reports all stages from fixture files and cleans up', async () => fixture(async ({ dir, options }) => {
  const proof = [];
  for (const [stage, changes] of [['generated', {}], ['unverified', { binding: null }], ['rejected', { rejectedImageSha256: [hash(png)] }], ['pending', { receiptPath: join(dir, 'absent.json') }]]) {
    const config = join(dir, 'inspection.json');
    await writeFile(config, JSON.stringify({ ...options, ...changes }));
    const command = [new URL('./resume-candidate-cli.mjs', import.meta.url).pathname, config];
    const output = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, command, { env: { PATH: process.env.PATH }, timeout: 10000 });
      let stdout = '', stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.once('error', reject);
      child.once('close', code => code === 0 ? resolve({ code, stdout, stderr }) : reject(new Error(stderr)));
    });
    assert.equal(JSON.parse(output.stdout).status, stage);
    proof.push({ command: [process.execPath, ...command], ...output });
  }
  await writeFile(new URL('cli-proof.json', root), JSON.stringify({ providerCalls: 0, proof }, null, 2));
  console.log('RESUME_CLI_PROOF generated/unverified/rejected/pending providerCalls=0');
}));
