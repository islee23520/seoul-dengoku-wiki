import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { decodePng, sourceOver } from './portrait-layer-composite.mjs';

const SHA256 = /^[0-9a-f]{64}$/;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function inside(root, target) {
  const path = relative(root, target);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
}

function boundPath(repoRoot, base, path, label) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\0')) throw new Error(`invalid ${label} path`);
  const full = resolve(base, path);
  if (!inside(repoRoot, full)) throw new Error(`${label} path escapes repository`);
  if (!existsSync(full)) throw new Error(`missing ${label}: ${path}`);
  return full;
}

function readJson(path, label) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`invalid ${label}: ${error.message}`); }
}

function requireHash(value, label) {
  if (!SHA256.test(value ?? '')) throw new Error(`invalid ${label} hash`);
}

export const ACCEPTED_FROZEN_RECIPE_SHA256 = '174656d3f9ae615dbfae9f20c8aaab76130a953677377fae7363c2a358707adf';
export const ACCEPTED_FROZEN_FINAL_RESULTS_SHA256 = '0caa6d2d259d1cc6d8b2d936bcce6011044407e563055f40d3aaae84a257e07a';
export const ACCEPTED_FROZEN_VISUAL_REVIEW_SHA256 = '86c36e6e4034bb1f204605bc08e870d7dd18bb461c62304778fbf0a6c7421137';
export const ACCEPTED_FROZEN_INPUT_IMMUTABILITY_SHA256 = '011e34b0a1f5c2ecc713abf0565b27e4bbc320afa21e28d03fe7031e63ee0620';

export function verifyFrozenRecipe({ repoRoot, recipePath, finalResultsPath, accepted }) {
  const root = resolve(repoRoot);
  const recipeFile = resolve(recipePath);
  const verdictFile = resolve(finalResultsPath);
  if (!inside(root, recipeFile) || !inside(root, verdictFile)) throw new Error('frozen evidence path escapes repository');
  const pins = accepted ?? {
    recipeSha256: ACCEPTED_FROZEN_RECIPE_SHA256,
    finalResultsSha256: ACCEPTED_FROZEN_FINAL_RESULTS_SHA256,
    visualReviewSha256: ACCEPTED_FROZEN_VISUAL_REVIEW_SHA256,
    inputImmutabilitySha256: ACCEPTED_FROZEN_INPUT_IMMUTABILITY_SHA256,
  };
  requireHash(pins.recipeSha256, 'accepted recipe');
  requireHash(pins.finalResultsSha256, 'accepted final-results');
  if (sha256(readFileSync(recipeFile)) !== pins.recipeSha256) throw new Error('accepted recipe hash mismatch');
  if (sha256(readFileSync(verdictFile)) !== pins.finalResultsSha256) throw new Error('accepted final-results hash mismatch');
  const recipe = readJson(recipeFile, 'frozen recipe');
  const verdict = readJson(verdictFile, 'frozen verdict');
  const recipeRoot = dirname(recipeFile);

  if (recipe.schemaVersion !== 1 || !Array.isArray(recipe.canvas) || recipe.canvas.length !== 2
      || !recipe.canvas.every((value) => Number.isInteger(value) && value > 0)) throw new Error('invalid frozen recipe schema');
  if (!Array.isArray(recipe.slots) || recipe.slots.length === 0 || !Array.isArray(recipe.reconstructionOrder)) throw new Error('invalid frozen recipe slots');
  requireHash(recipe.sourceSha256, 'source');
  const sourcePath = boundPath(root, recipeRoot, recipe.source, 'source');
  const sourceBytes = readFileSync(sourcePath);
  if (sha256(sourceBytes) !== recipe.sourceSha256) throw new Error('source hash mismatch');
  const source = decodePng(sourceBytes);
  const [width, height] = recipe.canvas;
  if (source.width !== width || source.height !== height) throw new Error('source dimensions differ from frozen canvas');

  if (recipe.assembler) {
    requireHash(recipe.assembler.sha256, 'assembler');
    const assemblerPath = boundPath(root, recipeRoot, recipe.assembler.path, 'assembler');
    if (sha256(readFileSync(assemblerPath)) !== recipe.assembler.sha256) throw new Error('assembler hash mismatch');
  }

  const ids = new Set();
  const slotPairs = recipe.slots.map((slot) => {
    if (!slot || typeof slot.id !== 'string' || !slot.id || ids.has(slot.id) || !Number.isInteger(slot.z)) throw new Error('invalid frozen slot id or z');
    ids.add(slot.id);
    return [slot.id, slot.z];
  });
  const orderMatches = recipe.reconstructionOrder.length === slotPairs.length
    && slotPairs.every(([id, z], index) => z === index
      && recipe.reconstructionOrder[index]?.[0] === id
      && recipe.reconstructionOrder[index]?.[1] === z);
  if (!orderMatches) throw new Error('frozen reconstruction order mismatch');

  const occupancy = new Uint16Array(width * height);
  const composite = new Uint8Array(width * height * 4);
  for (const slot of recipe.slots) {
    requireHash(slot.sha256, `slot ${slot.id}`);
    const path = boundPath(root, recipeRoot, slot.path, `slot ${slot.id}`);
    const bytes = readFileSync(path);
    if (sha256(bytes) !== slot.sha256) throw new Error(`slot hash mismatch ${slot.id}`);
    const image = decodePng(bytes);
    if (image.width !== width || image.height !== height || slot.width !== width || slot.height !== height) throw new Error(`slot dimensions differ ${slot.id}`);
    if (slot.decodedRGBAsha256) {
      requireHash(slot.decodedRGBAsha256, `decoded slot ${slot.id}`);
      if (sha256(image.pixels) !== slot.decodedRGBAsha256) throw new Error(`decoded slot hash mismatch ${slot.id}`);
    }
    for (let offset = 0, pixel = 0; offset < image.pixels.length; offset += 4, pixel += 1) {
      const alpha = image.pixels[offset + 3];
      if (alpha !== 0 && alpha !== 255) throw new Error(`non-binary alpha ${slot.id}`);
      if (alpha === 0) {
        if (image.pixels[offset] || image.pixels[offset + 1] || image.pixels[offset + 2]) throw new Error(`transparent RGB data ${slot.id}`);
        continue;
      }
      occupancy[pixel] += 1;
      if (image.pixels[offset] !== source.pixels[offset]
          || image.pixels[offset + 1] !== source.pixels[offset + 1]
          || image.pixels[offset + 2] !== source.pixels[offset + 2]) throw new Error(`owned source pixel mismatch ${slot.id}`);
    }
    sourceOver(composite, image.pixels);
  }

  let oneHotPixels = 0; let gapPixels = 0; let overlapPixels = 0; let changedPixels = 0;
  for (let pixel = 0; pixel < occupancy.length; pixel += 1) {
    if (occupancy[pixel] === 1) oneHotPixels += 1;
    else if (occupancy[pixel] === 0) gapPixels += 1;
    else overlapPixels += 1;
    const offset = pixel * 4;
    if (composite[offset] !== source.pixels[offset]
        || composite[offset + 1] !== source.pixels[offset + 1]
        || composite[offset + 2] !== source.pixels[offset + 2]
        || composite[offset + 3] !== source.pixels[offset + 3]) changedPixels += 1;
  }
  const metrics = { slot_count: recipe.slots.length, canvas_pixels: width * height, one_hot_pixels: oneHotPixels, gap_pixels: gapPixels, overlap_pixels: overlapPixels, changed_pixels: changedPixels };
  if (gapPixels || overlapPixels || changedPixels) throw new Error(`partition mismatch ${JSON.stringify(metrics)}`);

  if (verdict.schemaVersion !== 1 || verdict.status !== 'PASS' || verdict.numericStatus !== 'PASS' || verdict.nativeVisualStatus !== 'PASS') throw new Error('frozen verdict is not accepted');
  if (verdict.visualReviewComplete !== true) throw new Error('frozen visual review is not complete');
  if (verdict.visualReviewBoundToOwnership !== true) throw new Error('frozen visual review is not bound to ownership');
  if (!Array.isArray(verdict.defects) || verdict.defects.length !== 0) throw new Error('frozen verdict has unresolved defects');
  if (typeof verdict.visualReview === 'string') {
    requireHash(pins.visualReviewSha256, 'accepted visual review');
    const reviewPath = boundPath(root, dirname(verdictFile), verdict.visualReview, 'visual review');
    if (sha256(readFileSync(reviewPath)) !== pins.visualReviewSha256) throw new Error('accepted visual review hash mismatch');
    const review = readJson(reviewPath, 'visual review');
    if (review.status !== 'PASS') throw new Error('visual review is not accepted');
    if (verdict.ownershipSha256 && review.ownershipSha256 !== verdict.ownershipSha256) throw new Error('visual review ownership mismatch');
  }
  if (typeof verdict.inputImmutability === 'string') {
    requireHash(pins.inputImmutabilitySha256, 'accepted input immutability');
    const immutabilityPath = boundPath(root, dirname(verdictFile), verdict.inputImmutability, 'input immutability');
    if (sha256(readFileSync(immutabilityPath)) !== pins.inputImmutabilitySha256) throw new Error('accepted input immutability hash mismatch');
    const immutability = readJson(immutabilityPath, 'input immutability');
    if (immutability.status !== 'PASS' || immutability.allInputsUnchanged !== true) throw new Error('input immutability is not accepted');
  }
  const expected = verdict.summary ?? {};
  if ((expected.oneHotPixels != null && expected.oneHotPixels !== oneHotPixels)
      || (expected.gapPixels != null && expected.gapPixels !== gapPixels)
      || (expected.overlapPixels != null && expected.overlapPixels !== overlapPixels)
      || (expected.sourceOverChangedPixels != null && expected.sourceOverChangedPixels !== changedPixels)) throw new Error('frozen verdict metrics mismatch');
  if (verdict.ownershipSha256) {
    requireHash(verdict.ownershipSha256, 'ownership');
    const ownershipPath = boundPath(root, recipeRoot, 'ownership-index.png', 'ownership index');
    if (sha256(readFileSync(ownershipPath)) !== verdict.ownershipSha256) throw new Error('ownership hash mismatch');
  }

  return { status: 'PASS', metrics, verdict: { status: verdict.status, numeric_status: verdict.numericStatus, native_visual_status: verdict.nativeVisualStatus } };
}
