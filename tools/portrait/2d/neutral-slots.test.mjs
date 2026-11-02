import assert from 'node:assert/strict';
import { test } from 'vitest';
import { neutralRecord, slotFields } from '../neutral-slots.mjs';
import { emit, generationRequest, recordFromWikiToken } from './emit-character-prompt.mjs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const trait = value => ({ value, status: value === null ? 'unknown' : 'art-proposal', source: value === null ? null : 'owner-source' });
function token() {
  const slots = Object.fromEntries(Object.entries(slotFields).map(([slot, keys]) => [slot, Object.fromEntries(keys.map(key => [key, trait(slot + '-' + key)]))]));
  slots.body.weight = { ...trait(72), unit: 'kg' };
  slots.body.height = { ...trait(178), unit: 'cm' };
  return { schemaVersion: 1, characterId: 'K998', name: 'Ilseob', personId: 'person-0998', approval: 'art-proposal', identity: { characterId: 'K998', name: 'Ilseob', ethnicity: trait('Korean'), origin: trait('Korean'), gender: '남성', ageCategory: 'adult' }, slots };
}
async function fixture() {
  const base = fileURLToPath(new URL('../../../.omo/evidence/neutral-contract-tests/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'run-'));
  const bytes = Buffer.from('selected image bytes');
  const referencePath = join(dir, 'style.png');
  const stylePath = join(dir, 'style.json');
  await writeFile(referencePath, bytes);
  await writeFile(stylePath, JSON.stringify({ schemaVersion: 1, styleId: 'selected-male', status: 'owner-selected-reference', referenceSha256: createHash('sha256').update(bytes).digest('hex') }));
  return { referencePath, stylePath };
}
test('every sourced slot and Korean identity reaches portrait and full-body JSON and prompts', async () => {
  const input = token();
  const style = await fixture();
  for (const mode of ['portrait', 'full-body']) {
    const result = await emit({ ...style, character: input, mode });
    assert.deepEqual(result.slots, input.slots);
    assert.deepEqual(result.identity.ethnicity, input.identity.ethnicity);
    for (const values of Object.values(input.slots)) for (const item of Object.values(values)) assert.ok(result.prompt.includes(String(item.value)));
    assert.throws(() => generationRequest(result, { output: 'new.png', identityReference: 'recipient-original.png' }), /authoring-only/);
    const request = generationRequest(result, { output: 'new.png' });
    assert.ok(request.argv.includes(result.referencePath));
    assert.ok(!request.argv.includes('recipient-original.png'));
    assert.equal(result.cameraContractId, 'portrait-2d-viewer-right-v1');
    assert.equal(result.technology, '2d-image');
  }
});
test('outfit swap and independent body swap preserve every other recipient slot', () => {
  const input = token();
  const original = neutralRecord(input);
  const changed = neutralRecord(input, { outfit: { upper: trait('charcoal donor jacket') } });
  assert.deepEqual(changed.identity, original.identity);
  for (const slot of ['face', 'hair', 'body', 'accessories']) assert.deepEqual(changed.slots[slot], original.slots[slot]);
  const body = neutralRecord(input, { body: { build: trait('broad shoulders'), bustSize: trait('large full bust') } });
  assert.deepEqual(body.slots.outfit, original.slots.outfit);
  assert.deepEqual(body.slots.face, original.slots.face);
  assert.equal(body.slots.body.bustSize.value, 'large full bust');
});
test('series camera and posture stay identical across recipient identities and reach image requests', async () => {
  const style = await fixture();
  const first = token();
  const second = token();
  second.identity = { ...second.identity, characterId: 'K398', name: 'Yura', gender: '여성' };
  second.slots.hair.description = trait('long voluminous hair');
  second.slots.body.build = trait('different authored body proportions');
  for (const mode of ['portrait', 'full-body']) {
    const a = await emit({ ...style, character: first, mode });
    const b = await emit({ ...style, character: second, mode });
    assert.equal(a.camera, b.camera);
    assert.equal(a.pose, b.pose);
    assert.notDeepEqual(a.slots.body, b.slots.body);
    for (const result of [a, b]) {
      assert.throws(() => generationRequest(result, { output: 'new.png', identityReference: 'original.png' }), /authoring-only/);
      const request = generationRequest(result, { output: 'new.png' });
      const transmitted = request.argv[request.argv.indexOf('--prompt') + 1];
      assert.ok(transmitted.includes(result.camera));
      assert.ok(transmitted.includes(result.pose));
    }
  }
});
test('unknown measurements remain null and malformed measurements or source statuses fail', () => {
  const input = token();
  input.slots.body.height = { ...trait(null), unit: null };
  input.slots.body.weight = { ...trait(null), unit: null };
  assert.deepEqual(recordFromWikiToken(input).slots.body.height, input.slots.body.height);
  assert.throws(() => neutralRecord(input, { body: { height: trait('178') } }), /character schema/);
  assert.throws(() => neutralRecord(input, { face: { eyeColor: { value: 'brown', status: 'unknown', source: null } } }), /character schema/);
  assert.throws(() => neutralRecord(input, { face: { donorName: trait('JaePyo') } }), /unknown slot field/);
  assert.throws(() => neutralRecord(input, { face: { eyeColor: trait('   ') } }), /sourced value required/);
  assert.throws(() => neutralRecord(input, { face: { eyeColor: { value: 'brown', status: 'art-proposal', source: { unexpected: 'object' } } } }), /character schema/);
  assert.throws(() => neutralRecord({ ...input, unknownRoot: true }), /character schema/);
  const exported = neutralRecord(input);
  assert.deepEqual(neutralRecord(exported), exported);
});
test('unconfigured or conflicting style hashes fail without invoking an image provider', async () => {
  const style = await fixture();
  await writeFile(style.stylePath, JSON.stringify({ schemaVersion: 1, status: 'owner-selected-reference', referenceSha256: null }));
  await assert.rejects(emit({ ...style, character: token(), mode: 'portrait' }), /hash mismatch/);
});

test('derived proposals and qualitative measurements retain epistemic provenance', () => {
  const input = token();
  const derived = { value: 'average adult height', status: 'derived-proposal', source: 'derived:coarse-default', derived: true, unit: null };
  input.slots.body.height = derived;
  input.identity.origin = { value: 'unconfirmed', status: 'unknown', source: null };
  const result = neutralRecord(input);
  assert.deepEqual(result.slots.body.height, derived);
  assert.deepEqual(result.identity.origin, input.identity.origin);
  assert.deepEqual(neutralRecord(result), result);
  for (const bad of [{ ...derived, derived: false }, { ...derived, source: ' ' }, { ...derived, status: 'art-proposal' }, { ...derived, value: 170 }, { ...derived, unit: 'cm' }]) {
    assert.throws(() => neutralRecord(input, { body: { height: bad } }));
  }
});
