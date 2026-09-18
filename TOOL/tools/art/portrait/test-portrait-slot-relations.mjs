import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const slots = JSON.parse(readFileSync(join(here, 'portrait-layer-slots.json'), 'utf8'));
const relations = JSON.parse(readFileSync(join(here, slots.relations), 'utf8'));

test('slot relation contract covers every live slot and locked eye/hair rules', () => {
  assert.equal(slots.mask_rule, 'upper_slot_alpha_is_the_occlusion_mask');
  assert.deepEqual(slots.plates, ['visible', 'hidden']);
  assert.equal(relations.mask_rule, slots.mask_rule);
  const ids = slots.slots.map((slot) => slot.id);
  assert.deepEqual(Object.keys(relations.relations).sort(), [...ids].sort());
  for (const slot of slots.slots) {
    const rel = relations.relations[slot.id];
    assert.ok(rel, slot.id);
    assert.ok(Array.isArray(rel.occludes), slot.id);
  }
  assert.deepEqual(relations.removable_slots, ['neck', 'cheeks', 'chin']);
  assert.equal(relations.sex_gated_slots.beard.male, 'optional_on');
  assert.equal(relations.sex_gated_slots.beard.female, 'off');
  const eyes = relations.relations;
  assert.deepEqual(eyes.eyes_white.contains, ['eyes_color']);
  assert.equal(eyes.eyes_color.must_be_inside, 'eyes_white');
  assert.ok(eyes.eyes_shape.occludes.includes('eyes_white'));
  assert.ok(eyes.eyes_shape.occludes.includes('eyes_color'));
  assert.equal(eyes.hair.hidden_plate, 'under_headgear');
  assert.ok(eyes.headgear.occludes.includes('hair'));
});
