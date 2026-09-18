import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { encodePng } from './portrait-layer-composite.mjs';
import { evaluateGate1, FROZEN_RECIPE_VERIFIER_PATH } from './portrait-quality-pipeline.mjs';
import { verifyFrozenRecipe } from './verify-frozen-recipe.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'frozen-recipe-'));
  const evidence = join(root, 'evidence');
  mkdirSync(join(evidence, 'slots'), { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const sourcePixels = Uint8Array.from([
    10, 20, 30, 255, 40, 50, 60, 255,
    70, 80, 90, 255, 100, 110, 120, 255,
  ]);
  const slotPixels = [
    Uint8Array.from([10, 20, 30, 255, 0, 0, 0, 0, 70, 80, 90, 255, 0, 0, 0, 0]),
    Uint8Array.from([0, 0, 0, 0, 40, 50, 60, 255, 0, 0, 0, 0, 100, 110, 120, 255]),
  ];
  const sourceBytes = encodePng(2, 2, sourcePixels);
  writeFileSync(join(root, 'source.png'), sourceBytes);
  const slots = slotPixels.map((pixels, z) => {
    const id = `frozen_${z}`;
    const bytes = encodePng(2, 2, pixels);
    const path = `slots/${id}.png`;
    writeFileSync(join(evidence, path), bytes);
    return { id, z, path, sha256: sha256(bytes), decodedRGBAsha256: sha256(pixels), width: 2, height: 2 };
  });
  const recipe = {
    schemaVersion: 1,
    source: '../source.png',
    sourceSha256: sha256(sourceBytes),
    canvas: [2, 2],
    reconstructionOrder: slots.map(({ id, z }) => [id, z]),
    slots,
  };
  const ownershipBytes = Buffer.from('ownership');
  const ownershipSha256 = sha256(ownershipBytes);
  writeFileSync(join(evidence, 'ownership-index.png'), ownershipBytes);
  const review = { schemaVersion: 1, status: 'PASS', ownershipSha256, defects: [], slotFindings: {}, regionFindings: {} };
  const manifest = { schemaVersion: 1, files: [] };
  const immutability = { schemaVersion: 1, status: 'PASS', allInputsUnchanged: true, manifest: 'frozen-input-manifest.json', before: {}, after: {} };
  const verdict = {
    schemaVersion: 1,
    status: 'PASS',
    numericStatus: 'PASS',
    nativeVisualStatus: 'PASS',
    ownershipSha256,
    defects: [],
    visualReview: 'visual-review.json',
    visualReviewComplete: true,
    visualReviewBoundToOwnership: true,
    inputImmutability: 'input-immutability.json',
    inputImmutabilityStatus: 'PASS',
    frozenInputManifest: 'frozen-input-manifest.json',
    summary: { oneHotPixels: 4, gapPixels: 0, overlapPixels: 0, sourceOverChangedPixels: 0 },
  };
  const recipePath = join(evidence, 'partition-recipe.json');
  const verdictPath = join(evidence, 'final-results.json');
  const reviewPath = join(evidence, verdict.visualReview);
  const immutabilityPath = join(evidence, verdict.inputImmutability);
  const manifestPath = join(evidence, verdict.frozenInputManifest);
  const saveRecipe = () => writeFileSync(recipePath, `${JSON.stringify(recipe, null, 2)}\n`);
  const saveVerdict = () => writeFileSync(verdictPath, `${JSON.stringify(verdict, null, 2)}\n`);
  const saveReview = () => writeFileSync(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
  const saveImmutability = () => writeFileSync(immutabilityPath, `${JSON.stringify(immutability, null, 2)}\n`);
  saveRecipe(); saveReview(); saveImmutability(); writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`); saveVerdict();
  const accepted = {
    recipeSha256: sha256(readFileSync(recipePath)),
    finalResultsSha256: sha256(readFileSync(verdictPath)),
    visualReviewSha256: sha256(readFileSync(reviewPath)),
    inputImmutabilitySha256: sha256(readFileSync(immutabilityPath)),
  };
  const verify = () => verifyFrozenRecipe({ repoRoot: root, recipePath, finalResultsPath: verdictPath, accepted });
  const rebindRecipePin = () => { accepted.recipeSha256 = sha256(readFileSync(recipePath)); };
  return { root, evidence, recipe, verdict, review, immutability, sourcePixels, slotPixels, recipePath, verdictPath, reviewPath, immutabilityPath, saveRecipe, saveVerdict, saveReview, saveImmutability, rebindRecipePin, verify };
}

test('verifies a frozen recipe independently of the current slot schema without writing evidence', (t) => {
  const f = fixture(t);
  const before = new Map([
    [f.recipePath, sha256(readFileSync(f.recipePath))],
    [f.verdictPath, sha256(readFileSync(f.verdictPath))],
    ...f.recipe.slots.map((slot) => [join(f.evidence, slot.path), sha256(readFileSync(join(f.evidence, slot.path)))])
  ]);
  const report = f.verify();
  assert.equal(report.status, 'PASS');
  assert.deepEqual(report.metrics, { slot_count: 2, canvas_pixels: 4, one_hot_pixels: 4, gap_pixels: 0, overlap_pixels: 0, changed_pixels: 0 });
  for (const [path, hash] of before) assert.equal(sha256(readFileSync(path)), hash);
});

test('rejects changed source and slot bytes before trusting decoded pixels', async (t) => {
  await t.test('source bytes', (t) => {
    const f = fixture(t);
    writeFileSync(join(f.root, 'source.png'), encodePng(2, 2, Uint8Array.from(f.sourcePixels, (value, index) => index === 0 ? value + 1 : value)));
    assert.throws(f.verify, /source hash mismatch/);
  });
  await t.test('slot bytes', (t) => {
    const f = fixture(t);
    const path = join(f.evidence, f.recipe.slots[0].path);
    writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from([0])]));
    assert.throws(f.verify, /slot hash mismatch frozen_0/);
  });
});

test('rejects ownership holes, overlap, source mismatch, and wrong frozen z order', async (t) => {
  const mutateSlot = (f, index, pixels) => {
    const bytes = encodePng(2, 2, pixels);
    writeFileSync(join(f.evidence, f.recipe.slots[index].path), bytes);
    f.recipe.slots[index].sha256 = sha256(bytes);
    f.recipe.slots[index].decodedRGBAsha256 = sha256(pixels);
    f.saveRecipe();
    f.rebindRecipePin();
  };
  await t.test('hole', (t) => {
    const f = fixture(t); const pixels = Uint8Array.from(f.slotPixels[0]); pixels.fill(0, 0, 4); mutateSlot(f, 0, pixels);
    assert.throws(f.verify, /partition mismatch.*gap_pixels.*1/);
  });
  await t.test('overlap', (t) => {
    const f = fixture(t); const pixels = Uint8Array.from(f.slotPixels[1]); pixels.set(f.sourcePixels.slice(0, 4), 0); mutateSlot(f, 1, pixels);
    assert.throws(f.verify, /partition mismatch.*overlap_pixels.*1/);
  });
  await t.test('source mismatch', (t) => {
    const f = fixture(t); const pixels = Uint8Array.from(f.slotPixels[0]); pixels[0] += 1; mutateSlot(f, 0, pixels);
    assert.throws(f.verify, /owned source pixel mismatch frozen_0/);
  });
  await t.test('wrong z', (t) => {
    const f = fixture(t); f.recipe.slots[1].z = 7; f.saveRecipe(); f.rebindRecipePin();
    assert.throws(f.verify, /frozen reconstruction order mismatch/);
  });
});

test('rejects a changed or forged frozen verdict even when status strings remain PASS', async (t) => {
  await t.test('changed accepted verdict bytes', (t) => {
    const f = fixture(t); f.verdict.visualReviewComplete = false; f.saveVerdict();
    assert.throws(f.verify, /accepted final-results hash mismatch/);
  });
  await t.test('forged completion and defects', (t) => {
    const f = fixture(t); f.verdict.visualReviewBoundToOwnership = false; f.verdict.defects = ['unresolved']; f.saveVerdict();
    assert.throws(f.verify, /accepted final-results hash mismatch/);
  });
});

test('rejects review record drift and failed immutability bindings', async (t) => {
  await t.test('review drift', (t) => {
    const f = fixture(t); f.review.ownershipSha256 = sha256(Buffer.from('forged')); f.saveReview();
    assert.throws(f.verify, /accepted visual review hash mismatch/);
  });
  await t.test('immutability drift', (t) => {
    const f = fixture(t); f.immutability.allInputsUnchanged = false; f.saveImmutability();
    assert.throws(f.verify, /accepted input immutability hash mismatch/);
  });
});

test('Gate1 receipt binds the exact frozen verifier module SHA', () => {
  const repoRoot = resolve(import.meta.dirname, '../../..');
  const contract = JSON.parse(readFileSync(join(repoRoot, 'TOOL/tools/art/portrait/portrait-quality-contract.json'), 'utf8'));
  const receipt = evaluateGate1({ repoRoot, contract });
  const verifier = receipt.input_bindings.find(({ path }) => path === FROZEN_RECIPE_VERIFIER_PATH);
  assert.deepEqual(verifier, {
    path: FROZEN_RECIPE_VERIFIER_PATH,
    sha256: sha256(readFileSync(join(repoRoot, FROZEN_RECIPE_VERIFIER_PATH))),
  });
});
