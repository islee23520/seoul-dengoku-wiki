import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
  const activeIdentities = new Set();
  for (const entry of registry.entries) {
    assert.equal(manifest.sexes[entry.sex].slots[entry.slot].mode, entry.mode);
    const actualPairs = manifest.sexes[entry.sex].slots[entry.slot].variants.map(variant => [variant.id, variant.sha256]);
    for (const variant of entry.variants) {
      const identity = `${entry.sex}/${entry.slot}/${variant.id}`;
      assert.ok(!activeIdentities.has(identity), `duplicate active evidence identity: ${identity}`);
      assert.ok(!rejected.has(identity), `rejected evidence identity is active: ${identity}`);
      activeIdentities.add(identity);
    }
    const expectedVariants = entry.variants;
    const expectedPairs = expectedVariants.map(variant => [variant.id, variant.candidate_sha256]);
    if (entry.replace_slot) assert.deepEqual(actualPairs, expectedPairs);
    else for (const pair of expectedPairs) assert.ok(actualPairs.some(actual => actual[0] === pair[0] && actual[1] === pair[1]));
    for (const expected of expectedVariants) {
      const actual = manifest.sexes[entry.sex].slots[entry.slot].variants.find(variant => variant.id === expected.id);
      assert.equal(actual.source_identity.candidate, expected.candidate);
      assert.equal(actual.source_identity.candidate_sha256, expected.candidate_sha256);
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

test('target-family 2-layer face and eyes reconstruct the specified anime target on the eye union', async () => {
  const { decodePng, sourceOver } = await import('../../../Tool/art/portrait/portrait-layer-composite.mjs');
  const targetPath = resolve(repoRoot, 'Design/potrait-generator/assets/v2/target.png');
  const work = resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family');
  const manifest = JSON.parse(readFileSync(resolve(work, 'MANIFEST.json'), 'utf8'));
  assert.equal(manifest.family, 'anime-target');
  assert.equal(manifest.eyes_white, 'absent_in_original_split');
  const target = decodePng(readFileSync(targetPath));
  const face = decodePng(readFileSync(resolve(work, 'face_base.png')));
  const color = decodePng(readFileSync(resolve(work, 'eyes_color.png')));
  const shape = decodePng(readFileSync(resolve(work, 'eyes_shape.png')));
  assert.equal(sha256(readFileSync(targetPath)), manifest.target_sha256);
  assert.equal(sha256(readFileSync(resolve(work, 'face_base.png'))), manifest.copied.find((row) => row.file === 'face_base.png').sha256);
  assert.equal(sha256(readFileSync(resolve(work, 'eyes_shape.png'))), manifest.copied.find((row) => row.file === 'eyes_shape.png').sha256);
  const assembled = new Uint8Array(target.pixels.length);
  sourceOver(assembled, face.pixels);
  sourceOver(assembled, color.pixels);
  sourceOver(assembled, shape.pixels);
  let eye = 0;
  let changed = 0;
  let overlap = 0;
  for (let i = 3; i < assembled.length; i += 4) {
    const onEye = color.pixels[i] > 0 || shape.pixels[i] > 0;
    if (!onEye) continue;
    eye += 1;
    if (color.pixels[i] > 0 && shape.pixels[i] > 0) overlap += 1;
    if (assembled[i - 3] !== target.pixels[i - 3] || assembled[i - 2] !== target.pixels[i - 2] || assembled[i - 1] !== target.pixels[i - 1] || assembled[i] !== target.pixels[i]) changed += 1;
  }
  assert.equal(overlap, 0);
  assert.equal(changed, 0);
  assert.ok(eye > 0);
});

test('male foundation family is not the anime target and reconstructs its own source eye union', async () => {
  const { decodePng, sourceOver } = await import('../../../Tool/art/portrait/portrait-layer-composite.mjs');
  const work = resolve(repoRoot, 'Design/potrait-generator/work/selected/male-foundation-family');
  const manifest = JSON.parse(readFileSync(resolve(work, 'MANIFEST.json'), 'utf8'));
  assert.equal(manifest.not_the_anime_target, true);
  assert.equal(manifest.eyes_white_in_gate1_split, false);
  const source = decodePng(readFileSync(resolve(repoRoot, '.omo/evidence/portrait-stage23/gate2-male-foundation-source/provider-gpt-image.png')));
  const face = decodePng(readFileSync(resolve(work, 'face_base.png')));
  const color = decodePng(readFileSync(resolve(work, 'eyes_color.png')));
  const shape = decodePng(readFileSync(resolve(work, 'eyes_shape.png')));
  const assembled = new Uint8Array(source.pixels.length);
  sourceOver(assembled, face.pixels);
  sourceOver(assembled, color.pixels);
  sourceOver(assembled, shape.pixels);
  let changed = 0;
  for (let i = 3; i < assembled.length; i += 4) {
    if (color.pixels[i] === 0 && shape.pixels[i] === 0) continue;
    if (assembled[i - 3] !== source.pixels[i - 3] || assembled[i - 2] !== source.pixels[i - 2] || assembled[i - 1] !== source.pixels[i - 1] || assembled[i] !== source.pixels[i]) changed += 1;
  }
  assert.equal(changed, 0);
  assert.notEqual(manifest.source_sha256, manifest.anime_target_sha256);
});

test('goal comparison capture records repaired 2-layer 0-diff and current v3 mismatch on the eye union', async () => {
  const { decodePng, sourceOver } = await import('../../../Tool/art/portrait/portrait-layer-composite.mjs');
  const cmp = JSON.parse(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/mass-ulw/phase-c/target-family/crops/goal-comparison.json'), 'utf8'));
  assert.equal(cmp.eye_union_changed.repaired_vs_target[0], 0);
  assert.ok(cmp.eye_union_changed.current_vs_target[0] > 0);
  const target = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/assets/v2/target.png')));
  const face = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family/face_base.png')));
  const color = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family/eyes_color.png')));
  const shape = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family/eyes_shape.png')));
  const pWhite = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/assets/v2/plates/female/eyes_white/female-eyes-white-01.png')));
  const pColor = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/assets/v2/plates/female/eyes_color/female-eyes-color-01.png')));
  const pShape = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/assets/v2/plates/female/eyes_shape/female-eyes-shape-01.png')));
  const pFace = decodePng(readFileSync(resolve(repoRoot, 'Design/potrait-generator/assets/v2/plates/female/face_base/female-face-base-01.png')));
  const repaired = new Uint8Array(target.pixels.length);
  sourceOver(repaired, face.pixels); sourceOver(repaired, color.pixels); sourceOver(repaired, shape.pixels);
  const current = new Uint8Array(target.pixels.length);
  sourceOver(current, pFace.pixels); sourceOver(current, pWhite.pixels); sourceOver(current, pColor.pixels); sourceOver(current, pShape.pixels);
  let eye = 0, repairedChanged = 0, currentChanged = 0;
  for (let i = 3; i < target.pixels.length; i += 4) {
    const on = color.pixels[i] > 0 || shape.pixels[i] > 0 || pColor.pixels[i] > 0 || pShape.pixels[i] > 0 || pWhite.pixels[i] > 0;
    if (!on) continue;
    eye += 1;
    if (repaired[i-3] !== target.pixels[i-3] || repaired[i-2] !== target.pixels[i-2] || repaired[i-1] !== target.pixels[i-1] || repaired[i] !== target.pixels[i]) repairedChanged += 1;
    if (current[i-3] !== target.pixels[i-3] || current[i-2] !== target.pixels[i-2] || current[i-1] !== target.pixels[i-1] || current[i] !== target.pixels[i]) currentChanged += 1;
  }
  assert.equal(repairedChanged, cmp.eye_union_changed.repaired_vs_target[0]);
  assert.equal(currentChanged, cmp.eye_union_changed.current_vs_target[0]);
  assert.equal(eye, cmp.eye_union_changed.repaired_vs_target[1]);
});
test('sclera ownership diagnostic stays diagnostic and is owned by eyes_shape', () => {
  const diag = JSON.parse(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/mass-ulw/phase-c/target-family/sclera-ownership-diagnostic.json'), 'utf8'));
  assert.equal(diag.kind, 'diagnostic_only_not_a_mask');
  assert.equal(diag.counts.owned_by_shape, 690);
  assert.equal(diag.counts.owned_by_face_not_shape, 8);
  assert.ok(diag.counts.owned_by_shape > diag.counts.owned_by_face_not_shape);
  assert.match(diag.implication, /re-partitioning eyes_shape/);
});
test('male foundation comparison capture records repaired 2-layer 0-diff and current mismatch on its own source', () => {
  const cmp = JSON.parse(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/mass-ulw/phase-c/male-foundation/crops/goal-comparison.json'), 'utf8'));
  assert.equal(cmp.not_anime_target, true);
  assert.equal(cmp.eye_union_changed.repaired_vs_source[0], 0);
  assert.ok(cmp.eye_union_changed.current_vs_source[0] > 0);
  assert.equal(cmp.iris_outside_white, 2052);
});

test('repartition visible white from eyes_shape keeps 0-diff and still fails iris containment', () => {
  const row = JSON.parse(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/mass-ulw/phase-c/target-family/repartition.json'), 'utf8'));
  assert.equal(row.eye_union_vs_target_changed, 0);
  assert.equal(row.full_canvas_vs_old_2layer_changed, 0);
  assert.equal(row.white_alpha, 690);
  assert.equal(row.iris_outside_white, 4134);
  assert.equal(row.gate2_containment, 'FAIL');
  assert.equal(row.promotion, 'forbidden_until_hidden_white_contains_iris');
});
test('hidden iris cream fill WIP contains iris and stays out of production', () => {
  const man = JSON.parse(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family/MANIFEST.json'), 'utf8'));
  assert.equal(man.eyes_white, 'absent_in_original_split');
  assert.equal(man.eyes_white_hidden_wip.iris_outside, 0);
  assert.equal(man.eyes_white_hidden_wip.eye_union_vs_target_changed, 0);
  assert.equal(man.eyes_white_hidden_wip.promotion, 'forbidden_from_library');
  assert.equal(sha256(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family', man.eyes_white_hidden_wip.path))), man.eyes_white_hidden_wip.sha256);
});

test('see-through socket WIP contains iris and stays out of production', () => {
  const man = JSON.parse(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family/MANIFEST.json'), 'utf8'));
  assert.equal(man.eyes_white, 'absent_in_original_split');
  const wip = man.eyesocket_seethrough_socket_wip;
  assert.equal(wip.iris_outside_white, 0);
  assert.equal(wip.gate2_wip, 'PASS');
  assert.equal(wip.promotion, 'forbidden_from_library');
  assert.equal(wip.live_library_gate2, 'FAIL 5794 unchanged');
  assert.equal(sha256(readFileSync(resolve(repoRoot, 'Design/potrait-generator/work/selected/target-family', wip.path))), wip.white_sha256);
});
