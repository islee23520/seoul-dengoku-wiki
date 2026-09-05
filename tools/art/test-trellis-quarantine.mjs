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

const TRELLIS = {
  generation_backend: 'trellis_v1', provider: 'microsoft',
  model: 'microsoft/TRELLIS-image-large',
  revision: '442aa1e1afb9014e80681d3bf604e8d728a86ee7',
};
const PASS = { reviewer: 'art-lead', verdict: 'pass', receipt_hash: HEX, reviewed_at: FIXED_TIME };
const HOST = { blender_available: true, trellis_available: true };

test('official TRELLIS is selectable without approving an asset', () => {
  const intent = { ...meshIntent('trellis_v1'), seed: 13042 };
  const graph = compileGraph(intent);
  assert.equal(graph.intent.seed, 13042);
  assert.deepEqual(graph.nodes.filter((node) => node.kind === 'generate').map((node) => node.id), ['generate_3d_trellis']);
  const node = graph.nodes.find((item) => item.id === 'generate_3d_trellis');
  assert.equal(node.model, TRELLIS.model);
  assert.equal(node.revision, TRELLIS.revision);
  assert.equal(node.execution, 'direct_python');
  assert.deepEqual(checkGraph(graph, HOST), { ok: true, codes: [] });
  assert.equal(graph.nodes.at(-2).id, 'human_review');
  assert.equal(graph.nodes.at(-1).id, 'bom_promotion');
});

test('unverified and unsupported selections cannot silently substitute a provider', () => {
  const cases = [
    ['meshygen_plus', {}, 'provider_identity_unverified'],
    ['tripo3d', {}, 'user_explicit_required'],
    ['tripo3d', { user_explicit: true }, 'provider_not_configured'],
    ['tripo', { user_explicit: true }, 'unknown_backend'],
    ['comfyui_trellis', {}, 'backend_disabled'],
    ['unknown', {}, 'unknown_backend'],
    ['trellis_v1', { fallback_backend: 'tripo3d' }, 'automatic_fallback_forbidden'],
    ['trellis_v1', { auto_fallback: true }, 'automatic_fallback_forbidden'],
    ['trellis_v1', { model: 'unverified-model' }, 'provider_identity_mismatch'],
    ['trellis_v1', { revision: 'unverified-revision' }, 'provider_identity_mismatch'],
  ];
  for (const [backend, extra, code] of cases) {
    const intent = { ...meshIntent(backend), ...extra };
    assertThrowsCode(() => compileGraph(intent), code);
    const result = checkGraph({ schema_version: 1, status: 'compiled', intent, nodes: [], edges: [] }, HOST);
    assert.equal(result.ok, false);
    assert.ok(result.codes.includes(code), JSON.stringify(result));
  }
});

test('ComfyUI is existing texture intake and not arbitrary inference', () => {
  const texture = { ...meshIntent('comfyui_texture'), asset_class: 'tile', source: 'existing' };
  const graph = compileGraph(texture);
  assert.deepEqual(graph.nodes.map((node) => node.id), ['rights_check', 'human_review', 'bom_promotion']);
  assert.deepEqual(checkGraph(graph, HOST), { ok: true, codes: [] });
  assertThrowsCode(() => compileGraph({ ...texture, source: 'generate' }), 'texture_intake_only');
  assertThrowsCode(() => compileGraph({ ...texture, asset_class: 'prop' }), 'texture_intake_only');
  assertThrowsCode(() => compileGraph({ ...meshIntent('trellis_v1'), asset_class: 'portrait' }), 'backend_asset_mismatch');
});

test('TRELLIS rights and host failures do not enable fallback', () => {
  for (const rights_status of ['blocked', 'unresolved']) {
    const graph = compileGraph({ ...meshIntent('trellis_v1'), rights_status });
    assert.deepEqual(graph.nodes.map((node) => node.id), ['rights_check']);
    assert.deepEqual(checkGraph(graph, HOST), { ok: false, codes: ['rights_' + rights_status] });
  }
  const result = checkGraph(compileGraph(meshIntent('trellis_v1')), { blender_available: true });
  assert.deepEqual(result, { ok: false, codes: ['trellis_missing'] });
});

test('stored graph cannot bypass provider selection or remove promotion gates', () => {
  for (const mutate of [
    (graph) => { graph.nodes.find((node) => node.id === 'generate_3d_trellis').model = 'wrong-model'; },
    (graph) => { graph.nodes = graph.nodes.filter((node) => node.id !== 'bom_promotion'); },
    (graph) => { graph.nodes = graph.nodes.filter((node) => node.id !== 'generate_3d_trellis'); },
    (graph) => { graph.nodes.push({ id: 'generate_3d_tripo', tool: 'tripo3d' }); },
    (graph) => { graph.edges = []; },
  ]) {
    const graph = compileGraph(meshIntent('trellis_v1'));
    mutate(graph);
    const result = checkGraph(graph, HOST);
    assert.equal(result.ok, false);
    assert.ok(result.codes.includes('graph_plan_mismatch'), JSON.stringify(result));
  }
});

test('TRELLIS historical records and valid reviewed assets are separate', () => {
  for (const status of ['draft', 'blocked', 'archived']) {
    const asset = validManifest({ ...TRELLIS, status });
    const before = JSON.stringify(asset);
    assert.equal(validateManifest(asset).ok, true);
    assert.equal(contract.eligibleForIsoReview(asset), false);
    assert.equal(JSON.stringify(asset), before);
  }
  for (const status of ['reviewed', 'promoted']) {
    const asset = validManifest({ ...TRELLIS, status, review_receipts: [PASS] });
    assert.deepEqual(validateManifest(asset), { ok: true, errors: [] });
    assert.equal(contract.eligibleForIsoReview(asset), true);
  }
  const historical = validManifest({ ...TRELLIS, revision: 'historical-revision', status: 'archived' });
  assert.equal(validateManifest(historical).ok, true);
  assert.equal(contract.eligibleForIsoReview(historical), false);
});

test('provider allowance never promotes missing failed or malformed review receipts', () => {
  for (const review_receipts of [[], null, [null], [{}], [{ ...PASS, verdict: 'fail' }], [PASS, { ...PASS, verdict: 'reject' }], [{ ...PASS, receipt_hash: '' }]]) {
    const asset = validManifest({ ...TRELLIS, status: 'promoted', review_receipts });
    const result = validateManifest(asset);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === 'review_not_passed'), JSON.stringify(result));
    assert.equal(contract.eligibleForIsoReview(asset), false);
  }
});

test('reviewed and promoted assets require allowed rights and verified provider identity', () => {
  for (const overrides of [
    { rights_status: 'blocked' }, { rights_status: 'unresolved' },
    { model: 'unknown' }, { revision: 'unknown' }, { provider: 'unknown' },
    { generation_backend: 'meshygen_plus' }, { generation_backend: 'comfyui_trellis' },
    { generation_backend: 'tripo3d' }, { generation_backend: 'unknown' },
  ]) {
    const asset = validManifest({ ...TRELLIS, status: 'reviewed', review_receipts: [PASS], ...overrides });
    assert.equal(validateManifest(asset).ok, false, JSON.stringify(overrides));
    assert.equal(contract.eligibleForIsoReview(asset), false, JSON.stringify(overrides));
  }
});

test('promotion gate permits verified TRELLIS provenance but not quarantined or unreviewed assets', () => {
  const png = contract.promotedPng('poc-ui-panel-9slice');
  // Preserve the shipped output hash; this tests policy, not whether the fixture is mesh art.
  const live = contract.readJson(contract.bomPath('poc-ui-panel-9slice'));
  const asset = { ...live, ...TRELLIS, asset_class: 'prop' };
  assert.deepEqual(contract.validatePromotedBom(asset, png), { ok: true, errors: [] });
  for (const overrides of [{ status: 'archived' }, { status: 'blocked' }, { status: 'draft' }, { review_receipts: [] }, { review_receipts: [{ ...PASS, verdict: 'fail' }] }, { rights_status: 'blocked' }]) {
    assert.equal(contract.validatePromotedBom({ ...asset, ...overrides }, png).ok, false);
  }
});

test('invalid and quarantined statuses remain rejected rather than silently approved', () => {
  for (const status of ['invalid', 'quarantined']) {
    const asset = validManifest({ ...TRELLIS, status });
    assert.ok(validateManifest(asset).errors.some((error) => error.code === 'unknown_status'));
    assert.equal(contract.eligibleForIsoReview(asset), false);
  }
});

test('promoted allowed 2D kit records remain iso-review eligible', () => {
  assert.equal(contract.eligibleForIsoReview(contract.readJson(contract.bomPath('poc-ui-panel-9slice'))), true);
});
