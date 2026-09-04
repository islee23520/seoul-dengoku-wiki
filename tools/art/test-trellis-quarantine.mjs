import assert from 'node:assert/strict';
import test from 'node:test';

import { validateManifest } from './asset-manifest.mjs';
import { checkGraph, compileGraph } from './pipeline-graph.mjs';
import * as contract from './poc-ui-kit-contract.mjs';

const HEX = 'a'.repeat(64);
const FIXED_TIME = '2026-01-01T00:00:00.000Z';

function meshIntent(backend) {
  return {
    asset_id: 'poc-station-prop',
    asset_class: 'prop',
    animation_need: 'none',
    dcc: 'auto',
    generation_backend: backend,
    rights_status: 'allowed',
    source: 'generate',
  };
}

function assertThrowsCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code);
}

function validManifest(overrides = {}) {
  return {
    schema_version: 1,
    asset_id: 'poc-station-prop',
    asset_class: 'prop',
    source: 'generate',
    rights_status: 'allowed',
    generation_backend: 'nanobanana_gemini',
    provider: 'google',
    model: 'nanobanana-gemini',
    revision: '2026-01-01',
    prompt: 'station prop',
    prompt_hash: HEX,
    input_hashes: [HEX],
    seed: 1,
    cost_mode: 'subscription',
    cost_cents: 0,
    raw_hash: HEX,
    output_hash: HEX,
    tool_versions: { blender: '5.1.2' },
    operations: ['generate'],
    unity_import_settings: {},
    review_receipts: [],
    status: 'reviewed',
    created_at: FIXED_TIME,
    ...overrides,
  };
}

test('compileGraph fails closed with trellis_invalid when backend is trellis_v1', () => {
  assertThrowsCode(() => compileGraph(meshIntent('trellis_v1')), 'trellis_invalid');
});

test('compileGraph fails closed with trellis_invalid when backend is comfyui_trellis', () => {
  assertThrowsCode(() => compileGraph(meshIntent('comfyui_trellis')), 'trellis_invalid');
});

test('checkGraph fails closed with trellis_invalid when graph has generate_3d_trellis even with host', () => {
  const result = checkGraph({
    schema_version: 1,
    status: 'compiled',
    intent: { rights_status: 'allowed', generation_backend: 'openai_image' },
    nodes: [
      { id: 'rights_check', kind: 'gate' },
      { id: 'generate_3d_trellis', kind: 'generate', tool: 'trellis', execution: 'direct_python' },
      { id: 'human_review', kind: 'gate' },
    ],
    edges: [
      ['rights_check', 'generate_3d_trellis'],
      ['generate_3d_trellis', 'human_review'],
    ],
    skipped: [],
  }, { blender_available: true, trellis_available: true });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('trellis_invalid'));
});

test('validateManifest fails closed with trellis_invalid when TRELLIS status is not archived', () => {
  for (const status of ['draft', 'reviewed', 'promoted', 'blocked']) {
    const result = validateManifest(validManifest({
      generation_backend: 'trellis_v1',
      provider: 'microsoft',
      model: 'microsoft/TRELLIS-image-large',
      status,
    }));
    assert.equal(result.ok, false, status);
    assert.ok(
      result.errors.some((error) => error.code === 'trellis_invalid' && error.field === 'generation_backend'),
      JSON.stringify(result.errors),
    );
  }
});

test('validateManifest fails closed with trellis_invalid when comfyui_trellis is promoted', () => {
  const result = validateManifest(validManifest({
    generation_backend: 'comfyui_trellis',
    status: 'promoted',
  }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'trellis_invalid'));
});

test('validateManifest accepts archived TRELLIS as historical quarantine', () => {
  const result = validateManifest(validManifest({
    generation_backend: 'trellis_v1',
    provider: 'microsoft',
    model: 'microsoft/TRELLIS-image-large',
    status: 'archived',
  }));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.errors, []);
});

test('validateManifest fails closed with unknown_status when status is invalid or quarantined', () => {
  for (const status of ['invalid', 'quarantined']) {
    const result = validateManifest(validManifest({ status }));
    assert.equal(result.ok, false, status);
    assert.ok(
      result.errors.some((error) => error.code === 'unknown_status' && error.field === 'status'),
      JSON.stringify(result.errors),
    );
  }
});

test('validatePromotedBom fails closed with trellis_invalid when backend is TRELLIS', () => {
  const document = {
    ...contract.readJson(contract.bomPath('poc-ui-panel-9slice')),
    generation_backend: 'trellis_v1',
    asset_class: 'prop',
    status: 'promoted',
  };
  const result = contract.validatePromotedBom(document, contract.promotedPng('poc-ui-panel-9slice'));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'trellis_invalid'));
});

test('iso-review eligibility accepts promoted allowed 2D kit records', () => {
  const live = contract.readJson(contract.bomPath('poc-ui-panel-9slice'));
  assert.equal(contract.eligibleForIsoReview(live), true);
});

test('iso-review eligibility rejects TRELLIS archived blocked and non-allowed records', () => {
  const live = contract.readJson(contract.bomPath('poc-ui-panel-9slice'));
  assert.equal(contract.eligibleForIsoReview({ ...live, generation_backend: 'trellis_v1' }), false);
  assert.equal(contract.eligibleForIsoReview({ ...live, generation_backend: 'comfyui_trellis' }), false);
  assert.equal(contract.eligibleForIsoReview({ ...live, status: 'archived' }), false);
  assert.equal(contract.eligibleForIsoReview({ ...live, status: 'blocked' }), false);
  assert.equal(contract.eligibleForIsoReview({ ...live, rights_status: 'blocked' }), false);
  assert.equal(contract.eligibleForIsoReview({
    ...live,
    generation_backend: 'trellis_v1',
    status: 'archived',
  }), false);
});

test('compileGraph rejects tripo3d as unknown_backend without user_explicit', () => {
  assertThrowsCode(() => compileGraph(meshIntent('tripo3d')), 'unknown_backend');
});

test('compileGraph rejects tripo and tripo3d as unknown_backend when user_explicit is true', () => {
  assertThrowsCode(() => compileGraph({
    ...meshIntent('tripo'),
    user_explicit: true,
  }), 'unknown_backend');
  assertThrowsCode(() => compileGraph({
    ...meshIntent('tripo3d'),
    user_explicit: true,
  }), 'unknown_backend');
});
