import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { deriveMultiplyPixels, luminance8 } from './build-multiply-details.mjs';
import { multiply, sourceOver } from './portrait-layer-composite.mjs';

const rgba = (...values) => new Uint8Array(values);

test('multiply detail derivation uses deterministic Rec.709 grayscale and preserves alpha exactly', () => {
  const source = rgba(200, 100, 50, 17, 12, 34, 56, 255, 90, 80, 70, 0);
  const result = deriveMultiplyPixels(source);
  assert.deepEqual([...result], [luminance8(200, 100, 50), luminance8(200, 100, 50), luminance8(200, 100, 50), 17,
    luminance8(12, 34, 56), luminance8(12, 34, 56), luminance8(12, 34, 56), 255,
    luminance8(90, 80, 70), luminance8(90, 80, 70), luminance8(90, 80, 70), 0]);
});

test('source-over and multiply implement exact straight-alpha blend math', () => {
  const backdrop = rgba(100, 150, 200, 128);
  const source = rgba(50, 200, 100, 128);
  const over = new Uint8Array(backdrop);
  const product = new Uint8Array(backdrop);
  sourceOver(over, source);
  multiply(product, source);
  assert.deepEqual([...over], [67, 183, 133, 192]);
  assert.deepEqual([...product], [56, 156, 126, 192]);
});

test('one neutral detail plate adapts to two skin-base colors', () => {
  const detail = rgba(128, 128, 128, 255);
  const warm = rgba(220, 160, 120, 255);
  const cool = rgba(160, 190, 220, 255);
  multiply(warm, detail);
  multiply(cool, detail);
  assert.deepEqual([...warm], [110, 80, 60, 255]);
  assert.deepEqual([...cool], [80, 95, 110, 255]);
  assert.notDeepEqual(warm, cool);
});

test('production details are grayscale and retain accepted-source alpha', () => {
  const manifest = JSON.parse(readFileSync('Design/potrait-generator/assets/v2/library.json', 'utf8'));
  for (const sex of ['female', 'male']) for (const slot of ['cheeks', 'chin']) {
    for (const variant of manifest.sexes[sex].slots[slot].variants) {
      assert.equal(variant.blend_mode, 'multiply', `${sex}/${slot}/${variant.id}`);
    }
  }
  for (const sex of ['female', 'male']) for (const slot of ['mouth', 'nose', 'eyes_shape']) for (const variant of manifest.sexes[sex].slots[slot].variants) assert.equal(variant.blend_mode ?? 'source-over', 'source-over');
  for (const sex of ['female', 'male']) for (const variant of manifest.sexes[sex].slots.eyes_color.variants) {
    assert.equal(variant.blend_mode ?? 'source-over', 'source-over');
  }
});
