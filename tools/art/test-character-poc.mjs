import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  ACTIONS,
  CLIP_DURATION_BOUNDS,
  FACINGS,
  POC_CHARACTERS,
  SILHOUETTE_HEADS,
  assertGearNotMirrored,
  clipDuration,
  clipDurationInBounds,
  expectedFrameList,
  framePromotedPath,
  makeMirrorFailFixture,
  validateCharacterPromotion,
} from './character-poc.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const evidenceDir = join(repoRoot, '.omo', 'evidence', 'unity-poc-core-loop', 'task-15-characters');

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  const path = join(evidenceDir, name);
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
  return path;
}

test('poc roster is explorer medic patrol with locked gear hands', () => {
  assert.deepEqual(POC_CHARACTERS.map((item) => item.asset_id), [
    'poc-explorer',
    'poc-medic',
    'poc-patrol',
  ]);
  assert.equal(POC_CHARACTERS[0].dominant_hand, 'right');
  assert.equal(POC_CHARACTERS[0].gear.right_hand, 'prybar');
  assert.equal(POC_CHARACTERS[0].gear.left_hip, 'lantern');
  assert.equal(POC_CHARACTERS[0].gear.left_shoulder, 'radio_antenna');
  assert.equal(POC_CHARACTERS[1].gear.right_hand, 'splint_kit');
  assert.equal(POC_CHARACTERS[1].gear.right_arm, 'red_cloth_knot');
  assert.equal(POC_CHARACTERS[2].gear.right_hand, 'baton');
  assert.equal(POC_CHARACTERS[2].gear.left_chest, 'hazard_bar');
});

test('four facings and five actions have bounded clip durations', () => {
  assert.deepEqual([...FACINGS], ['N', 'E', 'S', 'W']);
  assert.deepEqual([...ACTIONS], ['idle', 'walk', 'attack', 'hit', 'down']);
  for (const action of ACTIONS) {
    const duration = clipDuration(action);
    assert.equal(clipDurationInBounds(action, duration), true, action);
    const [min, max] = CLIP_DURATION_BOUNDS[action];
    assert.ok(duration >= min && duration <= max);
  }
  assert.equal(clipDurationInBounds('walk', 0.05), false);
  assert.equal(clipDurationInBounds('attack', 2), false);
});

test('each character requires 92 directional frames', () => {
  const explorer = expectedFrameList('poc-explorer');
  assert.equal(explorer.length, 4 * (4 + 6 + 6 + 3 + 4));
  assert.equal(explorer[0].clip, 'poc-explorer_N_idle');
  assert.ok(explorer.some((frame) => frame.clip === 'poc-explorer_W_down'));
});

test('mirrored asymmetric gear is rejected before promotion', () => {
  const fixture = makeMirrorFailFixture();
  const codes = assertGearNotMirrored(fixture, POC_CHARACTERS[0]);
  assert.ok(codes.some((item) => item.code === 'mirrored_asymmetric_gear'));
  const path = writeEvidence('red-mirrored-gear.json', { ok: false, codes });
  assert.equal(existsSync(path), true);
});

test('empty tree fails closed on identity facing gear clip footprint promotion', () => {
  const emptyRoot = mkdtempSync(join(tmpdir(), 'janseon-char-red-'));
  const result = validateCharacterPromotion(emptyRoot);
  assert.equal(result.ok, false);
  const codeSet = new Set(result.codes.map((item) => item.code));
  for (const required of [
    'bom_missing',
    'docs_bom_missing',
    'missing_identity_sheet',
    'missing_side_map',
    'missing_prefab',
    'missing_frame',
    'missing_promoted_frame',
  ]) {
    assert.ok(codeSet.has(required), `missing ${required}: ${JSON.stringify([...codeSet])}`);
  }
  const path = writeEvidence('red-character-contract.json', result);
  assert.equal(existsSync(path), true);
});

test('wrong facing clip name is not in the expected set', () => {
  const names = new Set(expectedFrameList('poc-explorer').map((frame) => frame.clip));
  assert.equal(names.has('poc-explorer_S_idle'), true);
  assert.equal(names.has('poc-explorer_NE_idle'), false);
  assert.equal(names.has('poc-explorer_S_Idle'), false);
});

test('silhouette lock is 2.5 heads', () => {
  assert.equal(SILHOUETTE_HEADS, 2.5);
});

test('east and west idle frames are not byte-identical', () => {
  for (const character of POC_CHARACTERS) {
    const east = framePromotedPath(character.asset_id, 'E', 'idle', 0);
    const west = framePromotedPath(character.asset_id, 'W', 'idle', 0);
    if (!existsSync(east) || !existsSync(west)) continue;
    assert.equal(readFileSync(east).equals(readFileSync(west)), false, character.asset_id);
  }
});

test('promoted worktree passes facing gear clip footprint promotion', () => {
  const bom = join(repoRoot, 'Game', 'Assets', 'Janseon', 'ArtSource', 'Characters', 'poc-characters.bom.json');
  if (!existsSync(bom)) {
    writeEvidence('red-repo-promotion-pending.json', { ok: false, reason: 'assets_not_generated_yet' });
    return;
  }
  const result = validateCharacterPromotion(repoRoot);
  writeEvidence(result.ok ? 'green-character-contract.json' : 'red-repo-promotion.json', result);
  assert.equal(result.ok, true, JSON.stringify(result.codes.slice(0, 12), null, 2));
});
