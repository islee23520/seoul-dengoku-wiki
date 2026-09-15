import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { crc32, deflateSync } from 'node:zlib';

import { ingestSeeThroughLayers } from './ingest-see-through-psd.mjs';
import { decodePng } from './portrait-layer-composite.mjs';

const mapPath = fileURLToPath(new URL('./see-through-slot-map.json', import.meta.url));
const schemaPath = fileURLToPath(new URL('./portrait-layer-slots.json', import.meta.url));

const WIDTH = 8;
const HEIGHT = 8;
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const RED = [255, 0, 0, 255];
const GREEN = [0, 255, 0, 255];
const BLUE = [0, 0, 255, 255];
const CLEAR = [0, 0, 0, 0];

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
  for (let i = 0; i < pixels.length; i += 4) pixels.set(fill, i);
  return pixels;
}

function fillRect(pixels, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      pixels.set(color, (y * WIDTH + x) * 4);
    }
  }
}

function writeTagPng(dir, tag, pixels) {
  const path = join(dir, `${tag}.png`);
  writeFileSync(path, encodeRgbaPng(WIDTH, HEIGHT, pixels));
  return path;
}

function pixelAt(pixels, x, y) {
  const i = (y * WIDTH + x) * 4;
  return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
}

test('target-contract maps front hair to hair and does not assign neck tag to neck', () => {
  const map = JSON.parse(readFileSync(mapPath, 'utf8'));
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'see-through-ingest-'));
  const hair = makePixels(CLEAR);
  fillRect(hair, 0, 0, 8, 3, RED);
  writeTagPng(dir, 'front hair', hair);
  const neck = makePixels(GREEN);
  writeTagPng(dir, 'neck', neck);
  writeTagPng(dir, 'mystery-part', makePixels(BLUE));

  const result = ingestSeeThroughLayers({
    inputDir: dir,
    schema,
    map,
    mode: 'target-contract',
  });

  assert.ok(result.slots.hair, 'front hair becomes hair');
  assert.equal(result.slots.neck, undefined);
  assert.ok(result.skipped.includes('neck'));
  assert.ok(result.unmapped.includes('mystery-part'));
});

test('eyewhite+eyebrow combine into eyes_shape with source-over', () => {
  const map = JSON.parse(readFileSync(mapPath, 'utf8'));
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'see-through-eyes-'));
  const white = makePixels(CLEAR);
  fillRect(white, 2, 2, 6, 6, [255, 255, 255, 255]);
  const brow = makePixels(CLEAR);
  fillRect(brow, 2, 1, 6, 3, [0, 0, 0, 255]);
  writeTagPng(dir, 'eyewhite', white);
  writeTagPng(dir, 'eyebrow', brow);

  const outDir = join(dir, 'out');
  mkdirSync(outDir);
  const result = ingestSeeThroughLayers({
    inputDir: dir,
    schema,
    map,
    mode: 'target-contract',
    outputDir: outDir,
  });

  assert.ok(result.slots.eyes_shape);
  const image = decodePng(readFileSync(result.slots.eyes_shape));
  assert.deepEqual(pixelAt(image.pixels, 3, 2), [0, 0, 0, 255], 'brow covers white');
  assert.deepEqual(pixelAt(image.pixels, 3, 4), [255, 255, 255, 255], 'white remains below');
});
