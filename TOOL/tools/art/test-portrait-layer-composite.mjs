import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { crc32, deflateSync } from 'node:zlib';

import { compositePortraitLayers, decodePng } from './portrait-layer-composite.mjs';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
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

test('empty or missing required slots throw', () => {
  const schema = JSON.parse(readFileSync(slotsPath, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-missing-'));
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

test('fully transparent source does not punch holes in destination', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-clear-'));
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

test('reversed z order produces different pixels than correct order', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-z-'));
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

test('three-slot fixture composites yellow eyes over red face over blue bg', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portrait-composite-fixture-'));
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

test('decodePng expands 8-bit RGB target to opaque RGBA', () => {
  const targetPath = fileURLToPath(new URL('./original/target.png', import.meta.url));
  const image = decodePng(readFileSync(targetPath));
  assert.equal(image.width, 1145);
  assert.equal(image.height, 1374);
  assert.equal(image.pixels.length, 1145 * 1374 * 4);
  assert.equal(image.pixels[3], 255);
  const last = (1145 * 1374 - 1) * 4;
  assert.equal(image.pixels[last + 3], 255);
});
