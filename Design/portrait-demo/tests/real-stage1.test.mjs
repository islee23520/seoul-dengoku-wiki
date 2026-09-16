import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';
import { composeFromLibrary } from '../../../Tool/art/portrait/portrait-tool.mjs';
import { CANONICAL_SLOTS, createSelection, missingRequiredSlots, validateManifest } from '../portrait-state.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const manifestPath = resolve(repoRoot, 'Design/portrait-demo/assets/v2/library.json');
const workflowPath = resolve(repoRoot, 'Design/portrait-demo/assets/v2/workflow.json');
const recipePath = resolve(repoRoot, '.omo/evidence/portrait-authoring-v2/recipe.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function loadTruth() {
  return {
    manifest: validateManifest(JSON.parse(await readFile(manifestPath, 'utf8'))),
    recipe: JSON.parse(await readFile(recipePath, 'utf8')),
  };
}

test('production manifest exposes sex-specific male preview assets without female substitutes', async () => {
  const { manifest } = await loadTruth();
  assert.equal(manifest.stage, 'stage23-preview');
  assert.equal(manifest.quality_acceptance, 'NOT VERIFIED');
  assert.equal(manifest.provenance.kind, 'stage1-plus-sex-specific-preview-candidates');
  assert.equal(manifest.provenance.art_approval, false);
  const male = createSelection(manifest, 'male');
  assert.deepEqual(missingRequiredSlots(manifest, male), []);
  assert.deepEqual(CANONICAL_SLOTS.filter(slot => slot.required && !male.selections[slot.id]).map(slot => slot.id),
    ['hair_back', 'neck', 'cheeks', 'chin', 'hair']);
  for (const id of ['hair_back', 'neck', 'cheeks', 'chin', 'hair']) {
    assert.equal(manifest.sexes.male.slots[id].preview_optional, true);
  }
  for (const id of ['face_base', 'mouth', 'nose', 'eyes_shape', 'eyes_color', 'ears', 'clothes']) {
    const variant = manifest.sexes.male.slots[id].variants[0];
    assert.ok(variant, `male/${id}`);
    assert.equal(variant.sex, 'male');
    assert.equal(variant.quality, 'PREVIEW');
    assert.doesNotMatch(variant.path, /plates\/female\//);
  }
  for (const id of ['beard', 'beard_back']) {
    assert.equal(manifest.sexes.female.slots[id].enabled, false);
    assert.deepEqual(manifest.sexes.female.slots[id].variants, []);
  }
  for (const entry of Object.values(manifest.sexes.female.slots)) {
    for (const variant of entry.variants) {
      assert.match(variant.path, /^plates\/female\/[a-z_]+\/[a-z0-9_-]+\.png$/);
    }
  }
});

test('every staged plate preserves recipe identity, empty marker and exact bytes', async () => {
  const { manifest, recipe } = await loadTruth();
  const expected = recipe.assets.filter(asset => !['beard', 'beard_back'].includes(asset.id));
  const actual = Object.values(manifest.sexes.female.slots).flatMap(entry => entry.variants);
  assert.equal(actual.length, expected.length);
  for (const variant of actual) {
    const identity = variant.source_identity;
    const source = expected.find(asset => asset.id === identity.recipe_asset_id && (asset.variant ?? 'base') === identity.recipe_variant);
    assert.ok(source, variant.id);
    const [sourceBytes, stagedBytes] = await Promise.all([
      readFile(resolve(dirname(recipePath), source.path)),
      readFile(resolve(dirname(manifestPath), variant.path)),
    ]);
    assert.equal(sha256(sourceBytes), source.sha256);
    assert.equal(sha256(stagedBytes), source.sha256);
    assert.deepEqual(stagedBytes, sourceBytes);
    assert.equal(variant.sha256, source.sha256);
    assert.equal(variant.empty, source.empty === true);
    assert.equal(variant.source, source.source);
  }
});

test('default female decoded composite exactly matches the immutable target', async () => {
  const { manifest } = await loadTruth();
  const selection = Object.fromEntries(Object.entries(createSelection(manifest, 'female').selections).filter(([, value]) => value !== null));
  const composed = composeFromLibrary({ library: manifest, repoRoot, sex: 'female', selection, purpose: 'reconstruction' });
  const targetBytes = await readFile(resolve(repoRoot, 'Design/portrait-demo/assets/v2/target.png'));
  const target = decodePng(targetBytes);
  assert.equal(sha256(targetBytes), manifest.provenance.target_sha256);
  assert.equal(composed.width, target.width);
  assert.equal(composed.height, target.height);
  assert.deepEqual(composed.pixels, target.pixels);
});

test('production workflow advances both independently repaired sources through gateway 1', async () => {
  const { validatePortraitWorkflow, workflowCapabilities } = await import('../../../Tool/art/portrait/portrait-gateway.mjs');
  const workflow = validatePortraitWorkflow(JSON.parse(await readFile(workflowPath, 'utf8')));
  assert.equal(workflow.active_profile, 'reference075');
  for (const [id, profile] of Object.entries(workflow.profiles)) {
    assert.equal(profile.source_quality, 'OWNER_ACCEPTED', id);
    assert.equal(profile.gates.gateway1.status, 'PASS', id);
    assert.equal(profile.gates.gateway2.status, 'BLOCKED', id);
    assert.equal(profile.gates.gateway3.status, 'BLOCKED', id);
    assert.equal(profile.gates.gateway1.evidence.length, 2, id);
    for (const evidence of profile.gates.gateway1.evidence) {
      assert.equal(sha256(await readFile(resolve(repoRoot, evidence.path))), evidence.sha256, id);
    }
    const capabilities = workflowCapabilities({ ...workflow, active_profile: id });
    assert.equal(capabilities.rig, true, id);
    assert.equal(capabilities.combinations, false, id);
    assert.equal(capabilities.export, false, id);
  }
});
