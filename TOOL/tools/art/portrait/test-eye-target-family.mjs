import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const library = JSON.parse(readFileSync('Design/potrait-generator/assets/v2/library.json', 'utf8'));

const registered = {
  female: {
    face_base: ['female-face-base-01', '.omo/evidence/portrait-target-split-20260914/slots-skin-plus/face_base.png'],
    mouth: ['female-mouth-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v2/repaired-isolates/female/mouth-01.png'],
    nose: ['female-nose-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v2/repaired-isolates/female/nose-01.png'],
    eyes_white: ['female-eyes-white-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/female/eyes_white-01.png'],
    eyes_color: ['female-eyes-color-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/female/eyes_color-01.png'],
    eyes_shape: ['female-eyes-shape-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/female/eyes_shape-01.png'],
  },
  male: {
    face_base: ['male-face-base-01', '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/slots/face_base.png'],
    mouth: ['male-mouth-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v2/repaired-isolates/male/mouth-01.png'],
    nose: ['male-nose-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v2/repaired-isolates/male/nose-01.png'],
    eyes_white: ['male-eyes-white-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/male/eyes_white-01.png'],
    eyes_color: ['male-eyes-color-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/male/eyes_color-01.png'],
    eyes_shape: ['male-eyes-shape-01', '.omo/evidence/eye-target-vision-20260917/feature-recut-v3/repaired-isolates/male/eyes_shape-01.png'],
  },
};

test('variant 01 plates remain bound to currently registered evidence bytes', () => {
  for (const [sex, slots] of Object.entries(registered)) {
    for (const [slot, [id, source]] of Object.entries(slots)) {
      const variant = library.sexes[sex].slots[slot].variants.find((candidate) => candidate.id === id);
      assert.ok(variant, `${sex}/${slot}/${id}`);
      assert.equal(variant.sha256, sha256(source), `${sex}/${slot}/${id} registered sha`);
    }
  }
});

test('female production eyes_shape is not the original target-family 2-layer plate', () => {
  const production = library.sexes.female.slots.eyes_shape.variants.find((row) => row.id === 'female-eyes-shape-01');
  const original = sha256('.omo/evidence/portrait-target-split-20260914/slots-skin-plus/eyes_shape.png');
  assert.notEqual(production.sha256, original);
});

test('visible face-feature plates remain source-over', () => {
  for (const sex of ['female', 'male']) {
    for (const slot of ['mouth', 'nose', 'eyes_shape']) for (const variant of library.sexes[sex].slots[slot].variants) {
      assert.notEqual(variant.blend_mode, 'multiply', `${sex}/${slot}/${variant.id}`);
    }
  }
});
