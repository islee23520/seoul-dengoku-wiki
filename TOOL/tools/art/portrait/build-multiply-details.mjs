#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng, encodePng } from './portrait-layer-composite.mjs';

export const MULTIPLY_DETAIL_SLOTS = new Set(['cheeks', 'chin']);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Integer Rec. 709 luminance. The +5000 implements deterministic nearest-integer rounding.
export function luminance8(r, g, b) {
  return Math.floor((2126 * r + 7152 * g + 722 * b + 5000) / 10000);
}

export function deriveMultiplyPixels(pixels) {
  const result = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const value = luminance8(pixels[i], pixels[i + 1], pixels[i + 2]);
    result[i] = value;
    result[i + 1] = value;
    result[i + 2] = value;
    result[i + 3] = pixels[i + 3];
  }
  return result;
}

export function deriveMultiplyPlate({ sourcePath, outputPath, faceBasePath = null } = {}) {
  if (!sourcePath || !outputPath) throw new Error('sourcePath and outputPath are required');
  const sourceBytes = readFileSync(sourcePath);
  const source = decodePng(sourceBytes);
  const pixels = deriveMultiplyPixels(source.pixels);
  if (faceBasePath) {
    const face = decodePng(readFileSync(faceBasePath));
    if (face.width !== source.width || face.height !== source.height) {
      throw new Error(`face base size ${face.width}x${face.height} != detail ${source.width}x${source.height}`);
    }
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0 && face.pixels[i] === 0) {
        throw new Error(`detail adds visible support outside face base at pixel ${(i - 3) / 4}`);
      }
    }
  }
  const png = encodePng(source.width, source.height, pixels);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, png);
  return {
    width: source.width,
    height: source.height,
    source_sha256: sha256(sourceBytes),
    output_sha256: sha256(png),
    empty: !pixels.some((value, index) => index % 4 === 3 && value > 0),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
  try {
    const sourcePath = value('--source');
    const outputPath = value('--out');
    if (!sourcePath || !outputPath) throw new Error('usage: build-multiply-details.mjs --source input.png --out output.png [--face-base face.png]');
    const result = deriveMultiplyPlate({ sourcePath, outputPath, faceBasePath: value('--face-base') });
    console.log(JSON.stringify({ source: sourcePath, output: outputPath, blend_mode: 'multiply', ...result }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
