#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { decodePng, encodePng } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';

const ROOT = resolve(import.meta.dirname, '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sources = {
  female: {
    shape: '.omo/evidence/portrait-stage23/gate2-female-foundation-source/gate1-split/final/slots/eyes_shape.png',
    color: '.omo/evidence/portrait-stage23/gate2-female-foundation-source/gate1-split/final/slots/eyes_color.png',
    backing: '.omo/evidence/portrait-stage23/gate2-female-foundation-source/gate2-authoring/eyes-variant-current01/candidate/eyes_shape.png',
  },
  male: {
    shape: '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/slots/eyes_shape.png',
    color: '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate1-split-v2/final/slots/eyes_color.png',
    backing: '.omo/evidence/portrait-stage23/gate2-male-foundation-source/gate2-authoring/eyes-variants-0203/variant02/plates/z11-eyes_shape.png',
  },
};

function split(sex) {
  const spec = sources[sex];
  const shapeBytes = readFileSync(resolve(ROOT, spec.shape));
  const shape = decodePng(shapeBytes);
  const color = decodePng(readFileSync(resolve(ROOT, spec.color)));
  const backing = decodePng(readFileSync(resolve(ROOT, spec.backing)));
  const white = new Uint8ClampedArray(shape.pixels.length);
  const lines = new Uint8ClampedArray(shape.pixels.length);
  let visibleWhite = 0, hiddenWhite = 0;
  for (let i = 0; i < shape.pixels.length; i += 4) {
    const [r, g, b, a] = shape.pixels.subarray(i, i + 4);
    const luminance = (299 * r + 587 * g + 114 * b) / 1000;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const sclera = a > 0 && luminance >= 142 && chroma <= 88;
    const target = sclera ? white : lines;
    target.set([r, g, b, a], i);
    if (sclera) visibleWhite += 1;
    if (color.pixels[i + 3] > 0) {
      white.set(backing.pixels.subarray(i, i + 4), i);
      hiddenWhite += 1;
    }
  }
  const output = resolve(ROOT, `Design/potrait-generator/cache/eye-split/${sex}`);
  mkdirSync(output, { recursive: true });
  const whitePng = encodePng(shape.width, shape.height, white);
  const linePng = encodePng(shape.width, shape.height, lines);
  writeFileSync(resolve(output, 'eyes_white-01.png'), whitePng);
  writeFileSync(resolve(output, 'eyes_shape-01.png'), linePng);
  writeFileSync(resolve(output, 'eyes_color-01.png'), readFileSync(resolve(ROOT, spec.color)));
  const receipt = { version: 1, sex, source_shape: spec.shape, source_shape_sha256: sha(shapeBytes), source_color: spec.color, backing: spec.backing, visible_white_pixels: visibleWhite, hidden_backing_pixels: hiddenWhite, outputs: { eyes_white: sha(whitePng), eyes_shape: sha(linePng), eyes_color: sha(readFileSync(resolve(ROOT, spec.color))) } };
  writeFileSync(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

console.log(JSON.stringify({ female: split('female'), male: split('male') }, null, 2));
