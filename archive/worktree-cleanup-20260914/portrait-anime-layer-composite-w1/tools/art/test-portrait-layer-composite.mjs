import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { crc32, deflateSync } from 'node:zlib';

import { compositePortraitLayers } from './portrait-layer-composite.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const slotsPath = fileURLToPath(new URL('./portrait-layer-slots.json', import.meta.url));
const evidenceDir = join(repoRoot, '.omo', 'evidence', 'portrait-anime-layer-composite', 'task-4');
const evidencePng = join(evidenceDir, 'composite.png');

const WIDTH = 16;
const HEIGHT = 16;
const BLUE = [0, 0, 255, 255];
const RED = [255, 0, 0, 255];
const YELLOW = [255, 255, 0, 255];
const CLEAR = [0, 0, 0, 0];

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const FIXTURE_SCHEMA = {
  slots: [
    { id: 'bg', z: 0, required: false },
    { id: 'face_base', z: 5, required: true },
    { id: 'eyes_shape', z: 11, required: true },
  ],
};

const REVERSED_SCHEMA = {
  slots: [
    { id: 'bg', z: 11, required: false },
    { id: 'face_base', z: 5, required: true },
    { id: 'eyes_shape', z: 0, required: true },
  ],
};

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRgbaPng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const srcStart = y * width * 4;
    const dstStart = y * (width * 4 + 1);
    raw[dstStart] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength).copy(
      raw,
      dstStart + 1,
      srcStart,
      srcStart + width * 4,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function makePixels(fill) {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels.set(fill, i);
  }
  return pixels;
}

function fillRect(pixels, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      pixels.set(color, (y * WIDTH + x) * 4);
    }
  }
}

function pixelAt(pixels, x, y) {
  const i = (y * WIDTH + x) * 4;
  return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
}

function writeSlotPng(dir, name, pixels) {
  const path = join(dir, `${name}.png`);
  writeFileSync(path, encodeRgbaPng(WIDTH, HEIGHT, pixels));
  return path;
}

function makeFixtureSlots(dir) {
  const bg = makePixels(BLUE);
  const face = makePixels(CLEAR);
  fillRect(face, 4, 4, 12, 12, RED);
  const eyes = makePixels(CLEAR);
  fillRect(eyes, 6, 5, 10, 7, YELLOW);
  return {
    bg: writeSlotPng(dir, 'bg', bg),
    face_base: writeSlotPng(dir, 'face_base', face),
    eyes_shape: writeSlotPng(dir, 'eyes_shape', eyes),
  };
}

test('empty or missing required slots throw', (t) => {
  const schema = JSON.parse(readFileSync(slotsPath, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-missing-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const bg = writeSlotPng(dir, 'bg', makePixels(BLUE));

  assert.throws(
    () => compositePortraitLayers({ schema, slots: {} }),
    /required|missing/i,
  );
  assert.throws(
    () => compositePortraitLayers({ schema, slots: { bg } }),
    /eyes_shape|required|missing/i,
  );
  assert.throws(
    () => compositePortraitLayers({
      schema: FIXTURE_SCHEMA,
      slots: {
        face_base: join(dir, 'no-such-face.png'),
        eyes_shape: writeSlotPng(dir, 'eyes_only', makePixels(YELLOW)),
      },
    }),
    /missing|ENOENT|not found|required/i,
  );
});

test('fully transparent source does not punch holes in destination', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-clear-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const facePath = writeSlotPng(dir, 'face_base', makePixels(RED));
  const clearPath = writeSlotPng(dir, 'eyes_shape', makePixels(CLEAR));

  const result = compositePortraitLayers({
    schema: {
      slots: [
        { id: 'face_base', z: 0, required: true },
        { id: 'eyes_shape', z: 1, required: true },
      ],
    },
    slots: {
      face_base: facePath,
      eyes_shape: clearPath,
    },
  });

  assert.equal(result.width, WIDTH);
  assert.equal(result.height, HEIGHT);
  assert.ok(result.pixels.length > 0, 'destination must keep pixels');
  for (let i = 0; i < result.pixels.length; i += 4) {
    assert.deepEqual(
      [result.pixels[i], result.pixels[i + 1], result.pixels[i + 2], result.pixels[i + 3]],
      RED,
      `pixel ${i / 4} must stay red; transparent source must not erase`,
    );
  }
});

test('reversed z order produces different pixels than correct order', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-z-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const slots = makeFixtureSlots(dir);

  const correct = compositePortraitLayers({ schema: FIXTURE_SCHEMA, slots });
  const reversed = compositePortraitLayers({ schema: REVERSED_SCHEMA, slots });

  assert.notDeepEqual(
    Buffer.from(correct.pixels),
    Buffer.from(reversed.pixels),
    'z-reversed fixture must differ; identical pixels make this test invalid',
  );
  assert.deepEqual(pixelAt(correct.pixels, 0, 0), BLUE);
  assert.deepEqual(pixelAt(correct.pixels, 15, 15), BLUE);
  assert.deepEqual(pixelAt(correct.pixels, 5, 10), RED);
  assert.deepEqual(pixelAt(correct.pixels, 7, 5), YELLOW);
});

test('three-slot fixture composites yellow eyes over red face over blue bg', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-fixture-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const slots = makeFixtureSlots(dir);
  mkdirSync(evidenceDir, { recursive: true });

  const result = compositePortraitLayers({
    schema: FIXTURE_SCHEMA,
    slots,
    outputPath: evidencePng,
  });

  assert.deepEqual(pixelAt(result.pixels, 0, 0), BLUE, 'bg pixel');
  assert.deepEqual(pixelAt(result.pixels, 5, 10), RED, 'face pixel');
  assert.deepEqual(pixelAt(result.pixels, 7, 5), YELLOW, 'eye pixel');
  assert.equal(readFileSync(evidencePng)[0], 0x89);
});

test('recipe audit rejects a missing target and a one-pixel target mismatch', async (t) => {
  const modulePath = new URL('./verify-portrait-recipe.mjs', import.meta.url);
  assert.ok(existsSync(modulePath), 'target-bound recipe audit must exist');
  const { comparePortraitPixels, validateRecipe } = await import(modulePath.href);
  const target = { width: 2, height: 1, pixels: new Uint8Array([...RED, ...BLUE]) };
  const same = { ...target, pixels: new Uint8Array(target.pixels) };
  assert.equal(comparePortraitPixels(target, same).changedPixels, 0);
  same.pixels[0] = 254;
  assert.equal(comparePortraitPixels(target, same).changedPixels, 1);
  assert.equal(comparePortraitPixels(target, same).maxError, 1);
  assert.throws(() => comparePortraitPixels(target, { ...same, width: 1 }), /dimensions/);
  const dir = mkdtempSync(join(tmpdir(), 'portrait-recipe-'));
  t.after(() => rmSync(dir, { recursive: true }));
  assert.throws(() => validateRecipe({ version: 1 }, dir), /target/);
});

test('recipe audit detects mismatched pairs, backplates and missing assets', async (t) => {
  const modulePath = new URL('./verify-portrait-recipe.mjs', import.meta.url);
  assert.ok(existsSync(modulePath), 'paired slot recipe audit must exist');
  const { createHash } = await import('node:crypto');
  const { validateRecipe } = await import(modulePath.href);
  const dir = mkdtempSync(join(tmpdir(), 'portrait-recipe-pairs-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const targetBytes = encodeRgbaPng(WIDTH, HEIGHT, makePixels(BLUE));
  writeFileSync(join(dir, 'target.png'), targetBytes);
  const hash = (b) => createHash('sha256').update(b).digest('hex');
  const partial = makePixels(CLEAR);
  fillRect(partial, 4, 4, 8, 8, RED);
  const layerBytes = encodeRgbaPng(WIDTH, HEIGHT, partial);
  writeFileSync(join(dir, 'layer.png'), layerBytes);
  const recipe = {
    version: 1, canvas: { width: WIDTH, height: HEIGHT },
    target: { path: 'target.png', sha256: hash(targetBytes) },
    groups: { eyes: { slots: ['eyes_shape', 'eyes_color'], variants: ['e0'] } },
    assets: ['eyes_shape', 'eyes_color'].map((id) => ({ id, group: 'eyes', variant: 'e0', path: 'layer.png', sha256: hash(layerBytes) })),
  };
  assert.equal(validateRecipe(recipe, dir).assets.length, 2);
  assert.throws(() => validateRecipe({ ...recipe, target: { ...recipe.target, sha256: 'bad' } }, dir), /target.*hash/);
  const wrongPair = structuredClone(recipe);
  wrongPair.assets[1].variant = 'e1';
  assert.throws(() => validateRecipe(wrongPair, dir), /pair|variant/);
  const hiddenTarget = structuredClone(recipe);
  hiddenTarget.assets[0] = { ...hiddenTarget.assets[0], path: 'target.png', sha256: hash(targetBytes) };
  assert.throws(() => validateRecipe(hiddenTarget, dir), /backplate/);
  const missingAsset = structuredClone(recipe);
  missingAsset.assets[0].path = 'absent.png';
  assert.throws(() => validateRecipe(missingAsset, dir), /missing asset/);
});

test('partition audit rejects overlap and missing ownership independently of composition', async () => {
  const modulePath = new URL('./verify-portrait-recipe.mjs', import.meta.url);
  assert.ok(existsSync(modulePath), 'ownership audit must exist');
  const { auditPartition, comparePortraitPixels } = await import(modulePath.href);
  const target = { width: 2, height: 1, pixels: new Uint8Array([...RED, ...BLUE]) };
  const left = { ...target, pixels: new Uint8Array([...RED, ...CLEAR]) };
  const right = { ...target, pixels: new Uint8Array([...CLEAR, ...BLUE]) };
  assert.deepEqual(auditPartition(target, [left, right]), { uncovered: 0, overlapping: 0, wrongPixels: 0 });
  assert.equal(auditPartition(target, [left]).uncovered, 1);
  assert.equal(auditPartition(target, [left, right, left]).overlapping, 1);
  const eyeLoss = { ...target, pixels: new Uint8Array([...CLEAR, ...BLUE]) };
  assert.equal(comparePortraitPixels(target, eyeLoss).changedPixels, 1);
});

test('group swap audit rejects changes outside its mask and ignores recoloring as geometry', async () => {
  const module = await import('./verify-portrait-recipe.mjs');
  assert.equal(typeof module.auditGroupSwap, 'function', 'group-locality audit must exist');
  const base = { width: 2, height: 1, pixels: new Uint8Array([...RED, ...BLUE]) };
  const changed = { ...base, pixels: new Uint8Array([...YELLOW, ...BLUE]) };
  const mask = { ...base, pixels: new Uint8Array([...RED, ...CLEAR]) };
  assert.equal(module.auditGroupSwap(base, changed, mask).outsideChanged, 0);
  changed.pixels[4] = 1;
  assert.equal(module.auditGroupSwap(base, changed, mask).outsideChanged, 1);
  const transparent = { ...base, pixels: new Uint8Array([...RED, ...CLEAR]) };
  assert.equal(module.auditGroupSwap(transparent, { ...transparent, pixels: new Uint8Array([...YELLOW, ...CLEAR]) }, mask).alphaChanged, 0);
  assert.throws(() => module.auditGroupSwap(base, changed, { ...mask, width: 3 }), /dimensions/);
});

test('target decoding preserves RGB pixels and recipe QA cannot substitute another reference', async (t) => {
  const { decodePng } = await import('./portrait-layer-composite.mjs');
  const { verifyPortraitRecipe } = await import('./verify-portrait-recipe.mjs');
  const { createHash } = await import('node:crypto');
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2;
  const rgb = Buffer.concat([PNG_SIG, pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0, 0, 0, 255]))), pngChunk('IEND', Buffer.alloc(0))]);
  assert.deepEqual([...decodePng(rgb).pixels], [...RED, ...BLUE]);
  const dir = mkdtempSync(join(tmpdir(), 'portrait-reference-'));
  t.after(() => rmSync(dir, { recursive: true }));
  writeFileSync(join(dir, 'target.png'), rgb);
  const wrong = encodeRgbaPng(2, 1, new Uint8Array([...YELLOW, ...YELLOW]));
  writeFileSync(join(dir, 'wrong.png'), wrong);
  const recipe = {
    version: 1, canvas: { width: 2, height: 1 },
    target: { path: 'target.png', sha256: createHash('sha256').update(rgb).digest('hex') },
    groups: {}, assets: [], qa: { reference: 'wrong.png', partition: ['wrong.png'] },
  };
  writeFileSync(join(dir, 'recipe.json'), JSON.stringify(recipe));
  assert.throws(() => verifyPortraitRecipe(join(dir, 'recipe.json'), 'partition'), /reference.*target/);
});
