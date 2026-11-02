import assert from 'node:assert/strict';
import { test } from 'vitest';
import { generationRequest } from './emit-character-prompt.mjs';

const result = { referencePath: 'style.png', referenceSha256: 'a'.repeat(64), part: null, mode: 'turntable', view: 'back', prompt: 'authored prompt' };
const images = argv => argv.flatMap((value, i) => value === '--image' ? [argv[i + 1]] : []);

test('owner-marked photo remains authoring-only and refuses runtime request', () => {
  assert.throws(() => generationRequest({ ...result, editedVariant: true, identityReferenceRole: 'owner-face-and-hair-only', expectedIdentitySha256: 'b'.repeat(64) }, { output: 'new.png', identityReference: 'owner-photo.png' }), /authoring-only/);
});

test('owner photo cannot be replaced by implicit generated continuity reference', () => {
  const owner = { ...result, identityReferenceRole: 'owner-face-and-hair-only', expectedIdentitySha256: 'b'.repeat(64) };
  assert.throws(() => generationRequest(owner, { output: 'new.png' }), /explicit owner photo reference required/);
  assert.throws(() => generationRequest(owner, { output: 'new.png', imageReference: 'generated.png' }), /authoring-only/);
});

test('edited token preserves authored properties while refusing external identity', () => {
  const token = { ...result, editedVariant: true, prompt: 'female minor long wine hair gothic garment' };
  assert.throws(() => generationRequest(token, { output: 'new.png', identityReference: 'original.png' }), /authoring-only/);
  const request = generationRequest(token, { output: 'new.png' });
  assert.equal(request.argv[request.argv.indexOf('--prompt') + 1].includes(token.prompt), true);
  assert.deepEqual(images(request.argv), ['style.png']);
});

test('style-only generation also uses the English translation and request-recording boundary', () => {
  const request = generationRequest(result, { output: 'new.png' });
  assert.equal(request.command, process.execPath);
  assert.equal(request.argv[0].endsWith('/image-generate.mjs'), true);
  assert.deepEqual(images(request.argv), ['style.png']);
  assert.equal(request.argv[request.argv.indexOf('--expected-style-sha256') + 1], result.referenceSha256);
});

test('separate external identity and continuity both refuse before runtime request', () => {
  assert.throws(() => generationRequest(result, { output: 'new.png', identityReference: 'original.png', imageReference: 'front.png' }), /authoring-only/);
  for (const options of [{ identityReference: 'original.png' }, { imageReference: 'front.png' }]) assert.throws(() => generationRequest(result, { output: 'new.png', ...options }), /authoring-only/);
});

test('duplicate external identity continuity refuses instead of reaching wire deduplication', () => {
  assert.throws(() => generationRequest(result, { output: 'new.png', identityReference: 'original.png', imageReference: 'original.png' }), /authoring-only/);
});

test('isolated part keeps square composition but refuses external identity', () => {
  const token = { ...result, part: 'head', mode: 'full-body', view: null };
  assert.throws(() => generationRequest(token, { output: 'new.png', identityReference: 'original.png' }), /authoring-only/);
  const request = generationRequest(token, { output: 'new.png' });
  assert.deepEqual(images(request.argv), ['style.png']);
  assert.equal(request.argv[request.argv.indexOf('--aspect-ratio') + 1], '1:1');
});
