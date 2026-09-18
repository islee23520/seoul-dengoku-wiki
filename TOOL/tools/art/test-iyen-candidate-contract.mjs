import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { validateIyenCandidate } from './iyen-candidate-contract.mjs';

const candidatePath = fileURLToPath(
  new URL('../../../GAME-REFERENCE/assets/bom/characters/iyen.json', import.meta.url),
);

function baseCandidate() {
  return {
    schema_version: 1,
    asset_id: 'iyen-fixture',
    asset_class: 'character_sprite',
    source: 'existing',
    rights_status: 'unresolved',
    generation_backend: 'none',
    provider: 'iyen-virtual-doll',
    model: 'spine-manual-authoring',
    revision: 'fixture',
    prompt: '',
    prompt_hash: 'a'.repeat(64),
    input_hashes: [],
    seed: 0,
    cost_mode: 'none',
    cost_cents: 0,
    raw_hash: 'b'.repeat(64),
    output_hash: 'c'.repeat(64),
    tool_versions: {},
    operations: ['candidate_declaration'],
    unity_import_settings: {},
    review_receipts: [],
    status: 'draft',
    created_at: '2026-09-16T00:00:00.000Z',
    look: {
      palette: { hair: '#4a0e1e' },
      materials: { finish: 'candidate' },
      references: [
        { kind: 'character-reference-board', source: 'iyen-reference-board.png' },
      ],
      owner_verdict: 'pending',
    },
    identity_lock: {
      primary_layer: 'infinity_hair_ornament',
      shape: 'connected_two_loop_infinity',
      connected: true,
      tassel_layer: 'hair_ornament_tassel',
      target_resolutions: {
        portrait: { width: 1024, height: 1024 },
        sd_character: { width: 768, height: 768 },
      },
    },
  };
}

test('accepts the real Iyen candidate BOM', () => {
  const document = JSON.parse(readFileSync(candidatePath, 'utf8'));
  const result = validateIyenCandidate(document);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test('accepts a minimal valid candidate contract', () => {
  const result = validateIyenCandidate(baseCandidate());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test('rejects a disconnected-disc ornament mutation', () => {
  const document = baseCandidate();
  document.identity_lock.connected = false;
  document.identity_lock.shape = 'disconnected_discs';
  const result = validateIyenCandidate(document);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === 'infinity_ornament_disconnected'));
});

test('rejects a legacy rose-disc primary layer', () => {
  const document = baseCandidate();
  document.identity_lock.primary_layer = 'rose_disc_hair_ornament';
  const result = validateIyenCandidate(document);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === 'legacy_ornament_label'));
});

test('rejects a missing or shared tassel layer', () => {
  const shared = baseCandidate();
  shared.identity_lock.tassel_layer = shared.identity_lock.primary_layer;
  assert.ok(validateIyenCandidate(shared).errors
    .some((e) => e.code === 'tassel_layer_invalid'));

  const missing = baseCandidate();
  delete missing.identity_lock.tassel_layer;
  assert.ok(validateIyenCandidate(missing).errors
    .some((e) => e.code === 'tassel_layer_invalid'));
});

test('rejects a non-pending owner verdict candidate', () => {
  const document = baseCandidate();
  document.look.owner_verdict = 'accepted';
  const result = validateIyenCandidate(document);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === 'owner_verdict_not_pending'));
});

test('rejects a runtime destination inside the candidate BOM', () => {
  const document = baseCandidate();
  document.prefab = 'GAME/Assets/Janseon/Art/Characters/iyen/Iyen.prefab';
  const result = validateIyenCandidate(document);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === 'runtime_destination_forbidden'));
});

test('rejects a candidate missing target resolutions', () => {
  const document = baseCandidate();
  delete document.identity_lock.target_resolutions.portrait;
  const result = validateIyenCandidate(document);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === 'target_resolution_missing'));
});
