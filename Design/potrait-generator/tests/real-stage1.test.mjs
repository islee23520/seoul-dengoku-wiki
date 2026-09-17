import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';
import { composeFromLibrary, libraryFromRecipe } from '../../../Tool/art/portrait/portrait-tool.mjs';
import { createSelection, validateManifest } from '../portrait-state.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const manifestPath = resolve(repoRoot, 'Design/potrait-generator/assets/v2/library.json');
const workflowPath = resolve(repoRoot, 'Design/potrait-generator/assets/v2/workflow.json');
const recipePath = resolve(repoRoot, '.omo/evidence/portrait-authoring-v2/recipe.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function loadTruth() {
  return {
    manifest: validateManifest(JSON.parse(await readFile(manifestPath, 'utf8'))),
    recipe: JSON.parse(await readFile(recipePath, 'utf8')),
  };
}

test('production manifest exposes accepted sex-specific assets without cross-sex substitutes', async () => {
  const { manifest } = await loadTruth();
  assert.equal(manifest.stage, 'stage23-production-integration');
  assert.equal(manifest.minimum_contract_policy, 'required');
  assert.equal(manifest.slot_validity_policy, 'gates-1-4');
  assert.equal(manifest.quality_acceptance, 'NOT VERIFIED');
  assert.equal(manifest.provenance.kind, 'accepted-gate1-foundations-plus-hash-bound-g2-final-repair-v3');
  assert.match(manifest.provenance.repair_v3_integration_acceptance, /acceptance-binding\.json$/);
  assert.equal(manifest.provenance.repair_v3_accepted_candidates.length, 19);
  assert.deepEqual(manifest.provenance.repair_v3_excluded_candidates.sort(), [
    'broad-male-acc-eye-01', 'broad-male-acc-eye-02',
    'contaminated-male-headgear-mid-03', 'empty-male-headgear-mid-03',
    'foreign-male-clothes-back-03', 'foreign-male-clothes-front-03',
    'over-strict-male-headgear-mid-03',
  ]);
  assert.equal(manifest.provenance.owner_variant_target, 'all-minimum-contract-pass-candidates');
  assert.equal(manifest.provenance.original_contract_target, 10);
  assert.equal(manifest.provenance.art_approval, false);
  for (const sex of ['female', 'male']) {
    for (const [id, entry] of Object.entries(manifest.sexes[sex].slots)) {
      for (const variant of entry.variants) {
        assert.equal(variant.sex, sex, `${sex}/${id}/${variant.id}`);
        assert.match(variant.path, new RegExp(`^plates/${sex}/[a-z_]+/[a-z0-9_-]+\\.png$`));
        assert.equal(variant.minimum_contract.status, 'PASS');
        assert.match(variant.minimum_contract.record_sha256, /^[0-9a-f]{64}$/);
        assert.equal(variant.slot_validity.policy, 'gates-1-4');
        assert.ok(['verified', 'provisional'].includes(variant.slot_validity.status));
        if (variant.slot_validity.status === 'verified') {
          assert.deepEqual(
            ['gate1', 'gate2', 'gate3', 'gate4'].map(g => variant.slot_validity.gates[g]),
            ['PASS', 'PASS', 'PASS', 'PASS']
          );
        }
      }
    }
  }
  for (const sex of ['female', 'male']) {
    for (const id of ['mouth', 'nose', 'eyes_shape']) {
      assert.ok(manifest.sexes[sex].slots[id].variants.every(variant => (variant.blend_mode ?? 'source-over') === 'source-over'), `${sex}/${id}`);
    }
  }
  for (const sex of ['female', 'male']) {
    assert.ok(manifest.sexes[sex].slots.eyes_color.variants.every(variant => ['accepted-gate2-evidence', 'accepted-evidence-registry'].includes(variant.source)), `${sex}/eyes_color`);
    assert.ok(manifest.sexes[sex].slots.clothes.variants.some(variant => variant.source === 'accepted-gate2-evidence'), `${sex}/clothes`);
  }
  for (const id of ['beard', 'beard_back']) {
    assert.equal(manifest.sexes.female.slots[id].enabled, false);
    assert.deepEqual(manifest.sexes.female.slots[id].variants, []);
  }
  assert.equal(manifest.sexes.male.slots.hair.mode, 'selectable');
  assert.ok(manifest.sexes.male.slots.hair.variants.length >= 1);
  assert.ok(manifest.sexes.male.slots.hair.variants.every(variant => !variant.empty));
  const registry = JSON.parse(await readFile(new URL('../../../Tool/art/portrait/accepted-evidence-registry.json', import.meta.url)));
  const rejected = new Set(JSON.parse(await readFile(new URL('../../../.omo/evidence/eye-target-vision-20260917/family-02-03-rejection.json', import.meta.url))).rejected);
  for (const entry of registry.entries) {
    assert.equal(manifest.sexes[entry.sex].slots[entry.slot].mode, entry.mode);
    const actualPairs = manifest.sexes[entry.sex].slots[entry.slot].variants.map(variant => [variant.id, variant.sha256]);
    const expectedVariants = entry.variants.filter(variant => !rejected.has(`${entry.sex}/${entry.slot}/${variant.id}`));
    const expectedPairs = expectedVariants.map(variant => [variant.id, variant.candidate_sha256]);
    if (entry.replace_slot) assert.deepEqual(actualPairs, expectedPairs);
    else for (const pair of expectedPairs) assert.ok(actualPairs.some(actual => actual[0] === pair[0] && actual[1] === pair[1]));
    for (const expected of expectedVariants) {
      const actual = manifest.sexes[entry.sex].slots[entry.slot].variants.find(variant => variant.id === expected.id);
      assert.deepEqual(
        actual.render_overrides?.map(override => [override.when.slot, override.when.variant, override.sha256]) ?? [],
        expected.render_overrides?.map(override => [override.when.slot, override.when.variant, override.candidate_sha256]) ?? []
      );
    }
  }
});

test('protected Stage-1 recipe plates preserve identity, empty marker and exact bytes', async () => {
  const { recipe } = await loadTruth();
  const snapshot = JSON.parse(await readFile(resolve(repoRoot, '.omo/evidence/portrait-stage23/ui/real-stage1/snapshot.json'), 'utf8'));
  assert.equal(snapshot.decoded_target_match, true);
  for (const asset of recipe.assets) {
    if (['beard', 'beard_back'].includes(asset.id)) continue;
    const staged = snapshot.assets.find(row => row.id === `${asset.id}-${asset.variant ?? 'base'}`);
    assert.ok(staged, `${asset.id}-${asset.variant ?? 'base'}`);
    const [sourceBytes, stagedBytes] = await Promise.all([
      readFile(resolve(dirname(recipePath), asset.path)),
      readFile(resolve(repoRoot, 'Design/potrait-generator/assets/v2', staged.staged_path)),
    ]);
    assert.equal(sha256(sourceBytes), asset.sha256);
    assert.equal(sha256(stagedBytes), asset.sha256);
    assert.deepEqual(stagedBytes, sourceBytes);
    assert.equal(staged.empty, asset.empty === true);
    assert.equal(staged.source, asset.source);
  }
});

test('default Stage-1 female decoded composite exactly matches the immutable target', async () => {
  const manifest = libraryFromRecipe({ repoRoot, recipePath: '.omo/evidence/portrait-authoring-v2/recipe.json', sex: 'female' });
  const selection = Object.fromEntries(Object.entries(createSelection(manifest, 'female').selections).filter(([, value]) => value !== null));
  const composed = composeFromLibrary({ library: manifest, repoRoot, sex: 'female', selection, purpose: 'reconstruction' });
  const targetBytes = await readFile(resolve(repoRoot, 'Design/potrait-generator/assets/v2/target.png'));
  const target = decodePng(targetBytes);
  assert.equal(sha256(targetBytes), 'c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9');
  assert.equal(composed.width, target.width);
  assert.equal(composed.height, target.height);
  assert.deepEqual(composed.pixels, target.pixels);
});

test('production workflow advances both independently repaired sources through gateway 2', async () => {
  const { validatePortraitWorkflow, workflowCapabilities } = await import('../../../Tool/art/portrait/portrait-gateway.mjs');
  const workflow = validatePortraitWorkflow(JSON.parse(await readFile(workflowPath, 'utf8')));
  assert.equal(workflow.active_profile, 'reference075');
  for (const [id, profile] of Object.entries(workflow.profiles)) {
    assert.equal(profile.source_quality, 'OWNER_ACCEPTED', id);
    assert.equal(profile.gates.gateway1.status, 'PASS', id);
    assert.equal(profile.gates.gateway2.status, 'PASS', id);
    assert.equal(profile.gates.gateway3.status, 'BLOCKED', id);
    assert.equal(profile.gates.gateway4.status, 'BLOCKED', id);
    assert.equal(profile.gates.gateway1.evidence.length, 2, id);
    assert.equal(profile.gates.gateway2.evidence.length, 2, id);
    for (const evidence of [...profile.gates.gateway1.evidence, ...profile.gates.gateway2.evidence]) {
      assert.equal(sha256(await readFile(resolve(repoRoot, evidence.path))), evidence.sha256, id);
    }
    const capabilities = workflowCapabilities({ ...workflow, active_profile: id });
    assert.equal(capabilities.rig, true, id);
    assert.equal(capabilities.combinations, true, id);
    assert.equal(capabilities.curation, true, id);
    assert.equal(capabilities.export, false, id);
  }
});
