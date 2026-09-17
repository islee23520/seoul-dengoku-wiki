import test from 'node:test';
import assert from 'node:assert/strict';
import { compositeBrowserPixels } from '../portrait-browser-composite.mjs';
import { multiply, sourceOver } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';

test('browser pixel compositor matches offline source-over and multiply byte-exactly', () => {
  for (const blendMode of ['source-over', 'multiply']) {
    const destination = Uint8Array.from([194, 146, 120, 255, 20, 40, 60, 128]);
    const source = Uint8Array.from([96, 96, 96, 140, 220, 180, 130, 75]);
    const offline = Uint8Array.from(destination);
    (blendMode === 'multiply' ? multiply : sourceOver)(offline, source);
    const browser = new Uint8ClampedArray(destination);
    compositeBrowserPixels(browser, source, blendMode);
    assert.deepEqual([...browser], [...offline]);
  }
});

test('unknown blend mode and size mismatch fail closed', () => {
  assert.throws(() => compositeBrowserPixels(new Uint8Array(4), new Uint8Array(8)));
  assert.throws(() => compositeBrowserPixels(new Uint8Array(4), new Uint8Array(4), 'screen'));
});
