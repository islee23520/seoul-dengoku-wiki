import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decodeBrowserPng } from '../portrait-browser-png.mjs';
import { decodePng } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';

test('browser PNG decoder matches offline raw RGBA byte-exactly', async () => {
  for (const relative of ['../assets/v2/plates/female/face_base/female-face-base-01.png', '../assets/v2/plates/female/mouth/female-mouth-01.png']) {
    const bytes = await readFile(new URL(relative, import.meta.url));
    const browser = await decodeBrowserPng(bytes), offline = decodePng(bytes);
    assert.equal(browser.width, offline.width); assert.equal(browser.height, offline.height);
    assert.deepEqual([...browser.pixels], [...offline.pixels]);
  }
});

test('browser PNG decoder rejects non-PNG bytes', async () => {
  await assert.rejects(decodeBrowserPng(new Uint8Array([1, 2, 3])));
});
