import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const slotsPath = fileURLToPath(new URL('./portrait-layer-slots.json', import.meta.url));
const EXPECTED_IDS = [
  'bg',
  'clothes_back',
  'headgear_back',
  'hair_back',
  'beard_back',
  'face_base',
  'neck',
  'cheeks',
  'chin',
  'mouth',
  'nose',
  'eyes_white',
  'eyes_color',
  'eyes_shape',
  'ears',
  'clothes',
  'headgear_mid',
  'beard',
  'hair',
  'clothes_front',
  'headgear',
  'acc_eye',
  'frame',
];
const REQUIRED_TRUE = new Set([
  'hair_back',
  'face_base',
  'neck',
  'cheeks',
  'chin',
  'mouth',
  'nose',
  'eyes_white',
  'eyes_shape',
  'eyes_color',
  'ears',
  'clothes',
]);

test('portrait-layer-slots.json is product slots with unique increasing z', () => {
  const raw = readFileSync(slotsPath, 'utf8');
  assert.equal(raw.includes('GFX_'), false);
  const document = JSON.parse(raw);
  assert.ok(Array.isArray(document.slots));
  assert.equal(document.slots.length, EXPECTED_IDS.length);
  assert.deepEqual(document.slots.map((slot) => slot.id), EXPECTED_IDS);

  let previousZ = -Infinity;
  const seenZ = new Set();
  for (const slot of document.slots) {
    assert.equal(typeof slot.id, 'string');
    assert.equal(typeof slot.z, 'number');
    assert.equal(typeof slot.required, 'boolean');
    assert.equal(slot.required, REQUIRED_TRUE.has(slot.id));
    assert.equal(seenZ.has(slot.z), false);
    assert.ok(slot.z > previousZ);
    seenZ.add(slot.z);
    previousZ = slot.z;
    if (slot.identityToken !== undefined) {
      assert.equal(typeof slot.identityToken, 'string');
      assert.ok(slot.identityToken.length > 0);
      assert.equal(slot.identityToken.includes('GFX_'), false);
    }
  }

  assert.equal(document.slots[0].z, 0);
  assert.equal(document.slots.at(-1).z, document.slots.length - 1);
  assert.equal(document.slots.find((slot) => slot.id === 'beard_back').required, false);
  assert.equal(document.slots.find((slot) => slot.id === 'beard').required, false);
  assert.equal(document.slots.find((slot) => slot.id === 'frame').required, false);
});

test('eye layers render white, iris and lids in that order', () => {
  const document = JSON.parse(readFileSync(slotsPath, 'utf8'));
  const byId = new Map(document.slots.map(slot => [slot.id, slot]));
  assert.ok(byId.get('eyes_white').z < byId.get('eyes_color').z);
  assert.ok(byId.get('eyes_color').z < byId.get('eyes_shape').z);
});
