import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { BACKENDS, STILL_2D_ASSETS } from './catalog.mjs';
import { validateManifest } from './asset-manifest.mjs';
import { checkGraph, compileGraph, parseHostFlag, PipelineError } from './pipeline-graph.mjs';
import {
  auditRuntimeProvenance,
  classifyBackend,
  evaluatePromotedAsset,
} from './runtime-asset-provenance.mjs';
import { validateTrellisHostContract, OFFICIAL_TRELLIS_HOST_CONTRACT } from './trellis-host-contract.mjs';
import { promoteKit } from './station-props/promote_station_props.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cli = join(repoRoot, 'tools/art/pipeline-graph.mjs');
const HEX = 'ab'.repeat(32);

function meshIntent(backend, overrides = {}) {
  return {
    asset_id: 'poc-station-prop',
    asset_class: 'prop',
    animation_need: 'none',
    dcc: 'auto',
    generation_backend: backend,
    rights_status: 'allowed',
    source: 'generate',
    ...overrides,
  };
}

function characterIntent(backend, overrides = {}) {
  return {
    asset_id: 'poc-explorer',
    asset_class: 'character_mesh',
    animation_need: 'four_dir_clip',
    dcc: 'auto',
    generation_backend: backend,
    rights_status: 'allowed',
    source: 'generate',
    ...overrides,
  };
}

function assertThrowsCode(fn, code) {
  assert.throws(fn, (error) => error instanceof PipelineError && error.code === code);
}

function idsOf(graph) {
  return graph.nodes.map((node) => node.id);
}

function validManifest(overrides = {}) {
  return {
    schema_version: 1,
    asset_id: 'poc-ui-panel',
    asset_class: 'portrait',
    source: 'generate',
    rights_status: 'allowed',
    generation_backend: 'nanobanana_gemini',
    provider: 'google',
    model: 'nanobanana-gemini',
    revision: '2026-01-01',
    prompt: 'panel',
    prompt_hash: HEX,
    input_hashes: [HEX],
    seed: 1,
    cost_mode: 'subscription',
    cost_cents: 0,
    raw_hash: HEX,
    output_hash: HEX,
    tool_versions: {},
    operations: ['rights_check'],
    unity_import_settings: {},
    review_receipts: [],
    status: 'reviewed',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// (1) TRELLIS blocked at compile / validate / promote / runtime
// ---------------------------------------------------------------------------

test('phase0 (1) trellis_v1 mesh intent fails compile with trellis_blocked', () => {
  assertThrowsCode(() => compileGraph(meshIntent('trellis_v1')), 'trellis_blocked');
});

test('phase0 (1) comfyui_trellis mesh intent fails compile with trellis_blocked', () => {
  assertThrowsCode(() => compileGraph(meshIntent('comfyui_trellis')), 'trellis_blocked');
});

test('phase0 (1) trellis character intent fails compile with trellis_blocked', () => {
  assertThrowsCode(() => compileGraph(characterIntent('trellis_v1')), 'trellis_blocked');
});

test('phase0 (1) CLI compile trellis_v1 exits nonzero with trellis_blocked', () => {
  const dir = mkdtempSync(join(tmpdir(), 'phase0-trellis-'));
  try {
    const intentPath = join(dir, 'intent.json');
    writeFileSync(intentPath, JSON.stringify(meshIntent('trellis_v1')));
    const completed = spawnSync(process.execPath, [cli, 'compile', '--intent', intentPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.notEqual(completed.status, 0);
    const payload = JSON.parse(completed.stdout);
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'trellis_blocked');
    assert.equal(payload.status, 'rejected');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('phase0 (1) historical trellis manifest cannot promote as new evidence', () => {
  const result = validateManifest(validManifest({
    generation_backend: 'trellis_v1',
    asset_class: 'prop',
    status: 'promoted',
    provider: 'microsoft',
    model: 'microsoft/TRELLIS-image-large',
  }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === 'trellis_blocked'));
});

test('phase0 (1) promoteKit refuses historical TRELLIS kit', () => {
  const result = promoteKit();
  assert.equal(result.ok, false);
  assert.equal(result.refused, true);
  assert.ok(
    (result.errors || []).some((row) =>
      (row.codes || []).includes('trellis_blocked')
      || row.code === 'trellis_blocked'
      || (Array.isArray(row) && row.includes('trellis_blocked'))),
    `expected trellis_blocked in promote errors: ${JSON.stringify(result.errors)}`,
  );
});

test('phase0 (1) trellis host contract is permanently blocked with allow_inference false', () => {
  const result = validateTrellisHostContract({
    repo: OFFICIAL_TRELLIS_HOST_CONTRACT.repo,
    commit: OFFICIAL_TRELLIS_HOST_CONTRACT.commit,
    model: OFFICIAL_TRELLIS_HOST_CONTRACT.model,
    license: OFFICIAL_TRELLIS_HOST_CONTRACT.license,
    execution: OFFICIAL_TRELLIS_HOST_CONTRACT.execution,
    tool: OFFICIAL_TRELLIS_HOST_CONTRACT.tool,
    provider: OFFICIAL_TRELLIS_HOST_CONTRACT.provider,
    vram_mib: 24000,
  });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('trellis_blocked'));
  assert.equal(result.allow_inference, false);
  assert.equal(result.refused_before_gpu, true);
});

test('phase0 (1) runtime classifyBackend trellis_blocked and BOM rows invalid', () => {
  const classified = classifyBackend('trellis_v1');
  assert.equal(classified.ok, false);
  assert.equal(classified.code, 'trellis_blocked');
  const audit = auditRuntimeProvenance(repoRoot);
  assert.ok(audit.bomEvaluations.length >= 1);
  assert.ok(audit.bomEvaluations.every((row) => !row.ok));
  assert.ok(audit.bomEvaluations.every((row) =>
    row.errors.some((e) => e.code === 'trellis_blocked') || row.class === 'D_trellis_derived_invalid'));
});

// ---------------------------------------------------------------------------
// (2) meshygen_plus recognized but unverified; commercial meshy.ai rejected
// ---------------------------------------------------------------------------

test('phase0 (2) meshygen_plus is a recognized backend identity', () => {
  assert.equal(BACKENDS.has('meshygen_plus'), true);
});

test('phase0 (2) mesh intent with meshygen_plus compiles conceptually then check fails meshygen_unverified', async () => {
  const { validateMeshygenPlusHostContract } = await import('./meshygen-plus-host-contract.mjs');
  const contract = validateMeshygenPlusHostContract();
  assert.equal(contract.verified, false);
  assert.equal(contract.allow_inference, false);
  assert.equal(contract.research_result, 'UNVERIFIED');
  assert.equal(contract.ok, false);
  assert.ok(contract.codes.includes('meshygen_unverified'));

  const graph = compileGraph(meshIntent('meshygen_plus', {
    texture_backend: 'comfyui_texture_intake',
  }));
  assert.equal(graph.status, 'compiled');
  const ids = idsOf(graph);
  assert.ok(ids.includes('meshygen_identity_gate') || ids.includes('generate_3d_meshygen_plus'));
  assert.equal(ids.includes('generate_3d_trellis'), false);
  assert.equal(ids.some((id) => /trellis/i.test(id)), false);

  const checked = checkGraph(graph, parseHostFlag('blender=1,meshygen=1,comfyui=1'));
  assert.equal(checked.ok, false);
  assert.ok(checked.codes.includes('meshygen_unverified'));
});

test('phase0 (2) commercial meshy.ai URL is unofficial_or_ambiguous_identity', async () => {
  const { validateMeshygenPlusHostContract } = await import('./meshygen-plus-host-contract.mjs');
  for (const url of [
    'https://www.meshy.ai',
    'https://meshy.ai/api',
    'https://api.meshy.ai/v1',
  ]) {
    const result = validateMeshygenPlusHostContract({
      official_url: url,
      verified: true,
      model_id: 'meshy-commercial',
      license: 'proprietary',
    });
    assert.equal(result.ok, false, url);
    assert.ok(result.codes.includes('unofficial_or_ambiguous_identity'), `${url}: ${result.codes}`);
    assert.equal(result.allow_inference, false);
  }
});

test('phase0 (2) runtime meshygen_plus is meshygen_unverified', () => {
  const r = classifyBackend('meshygen_plus');
  assert.equal(r.ok, false);
  assert.equal(r.code, 'meshygen_unverified');
});

// ---------------------------------------------------------------------------
// (3) Tripo automatic paths fail tripo_agent_forbidden
// ---------------------------------------------------------------------------

test('phase0 (3) automatic tripo backends fail compile with tripo_agent_forbidden', () => {
  for (const backend of ['tripo', 'tripo3d']) {
    assertThrowsCode(() => compileGraph(meshIntent(backend)), 'tripo_agent_forbidden');
  }
});

test('phase0 (3) tripo agent graph/fallback/resume/rig/retarget/smoke markers fail closed', () => {
  for (const marker of [
    'tripo_auto_fallback',
    'tripo_resume',
    'tripo_rig',
    'tripo_retarget',
    'tripo_smoke',
  ]) {
    assertThrowsCode(
      () => compileGraph(meshIntent('meshygen_plus', {
        texture_backend: 'comfyui_texture_intake',
        agent_path: marker,
      })),
      'tripo_agent_forbidden',
    );
  }
});

test('phase0 (3) runtime tripo is tripo_agent_forbidden regardless of availability flags', () => {
  const r = classifyBackend('tripo3d', { tripoUserDirectAuthorized: true, tripoAvailable: true });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'tripo_agent_forbidden');
});

// ---------------------------------------------------------------------------
// (4) ComfyUI texture intake-only: no generate/invoke; required fields
// ---------------------------------------------------------------------------

test('phase0 (4) meshygen mesh graph has texture intake node without generate/invoke', () => {
  const graph = compileGraph(meshIntent('meshygen_plus', {
    texture_backend: 'comfyui_texture_intake',
  }));
  const intake = graph.nodes.find((node) =>
    node.id === 'texture_comfyui_intake' || node.tool === 'comfyui_texture_intake' || node.tool === 'comfyui_intake');
  assert.ok(intake, `missing intake node: ${idsOf(graph)}`);
  assert.notEqual(intake.kind, 'generate');
  assert.ok(['texture_intake', 'texture', 'intake'].includes(intake.kind), intake.kind);
  assert.equal(intake.invoke, undefined);
  assert.equal(intake.generate, undefined);
  assert.equal(String(intake.execution || '').includes('generate'), false);
  for (const node of graph.nodes) {
    assert.equal(node.id.includes('comfyui_generate'), false);
    assert.equal(node.id.includes('comfy_invoke'), false);
    assert.notEqual(node.kind, 'comfyui_generate');
  }
});

test('phase0 (4) comfyui texture intake contract requires provenance fields', async () => {
  const { validateComfyuiTextureIntake } = await import('./comfyui-texture-intake-contract.mjs');
  const complete = {
    workflow_hash: HEX,
    input_hashes: [HEX],
    raw_hash: HEX,
    output_hash: HEX,
    source_provenance: 'human_external_precomputed',
    rights_status: 'allowed',
    status: 'promoted',
  };
  assert.equal(validateComfyuiTextureIntake(complete).ok, true);

  for (const field of [
    'workflow_hash',
    'input_hashes',
    'raw_hash',
    'output_hash',
    'source_provenance',
    'rights_status',
    'status',
  ]) {
    const broken = { ...complete };
    delete broken[field];
    const result = validateComfyuiTextureIntake(broken);
    assert.equal(result.ok, false, field);
    assert.ok(
      result.codes.some((c) => c === 'missing_field' || c === `missing_${field}` || c.includes(field)),
      `${field}: ${result.codes}`,
    );
  }

  assert.equal(validateComfyuiTextureIntake({ ...complete, rights_status: 'blocked' }).ok, false);
  assert.equal(validateComfyuiTextureIntake({ ...complete, status: 'draft' }).ok, false);
});

test('phase0 (4) intake contract never exposes a generation invocation path', async () => {
  const mod = await import('./comfyui-texture-intake-contract.mjs');
  assert.equal(typeof mod.invokeComfyui, 'undefined');
  assert.equal(typeof mod.generateTexture, 'undefined');
  assert.equal(typeof mod.spawnComfyui, 'undefined');
  assert.equal(mod.ALLOW_INVOCATION, false);
  assert.equal(mod.INTAKE_ONLY, true);
});

// ---------------------------------------------------------------------------
// (5) historical TRELLIS BOM quarantined / invalid for runtime + new evidence
// ---------------------------------------------------------------------------

test('phase0 (5) historical BOM rows remain on disk but invalid for runtime/new evidence', () => {
  const bomPath = join(repoRoot, 'docs/assets/bom/props/station-prop-bom.json');
  assert.equal(existsSync(bomPath), true);
  const bom = JSON.parse(readFileSync(bomPath, 'utf8'));
  assert.ok(bom.assets.length >= 6);
  for (const asset of bom.assets) {
    assert.equal(asset.generation_backend, 'trellis_v1');
    const evaluation = evaluatePromotedAsset(asset);
    assert.equal(evaluation.ok, false);
    assert.ok(evaluation.errors.some((e) => e.code === 'trellis_blocked' || e.code === 'quarantine_path'));
    const manifestCheck = validateManifest(asset);
    assert.equal(manifestCheck.ok, false);
    assert.ok(manifestCheck.errors.some((e) => e.code === 'trellis_blocked'));
  }
});

// ---------------------------------------------------------------------------
// (6) allowed 2D backends unchanged
// ---------------------------------------------------------------------------

test('phase0 (6) allowed 2D backends still compile generate_2d path', () => {
  for (const backend of ['nanobanana_gemini', 'grok_imagine', 'openai_image']) {
    assert.equal(BACKENDS.has(backend), true);
    const graph = compileGraph({
      asset_id: `poc-${backend}`,
      asset_class: 'portrait',
      animation_need: 'none',
      dcc: 'auto',
      generation_backend: backend,
      rights_status: 'allowed',
      source: 'generate',
    });
    assert.equal(graph.status, 'compiled');
    assert.ok(idsOf(graph).includes('generate_2d'));
    assert.equal(idsOf(graph).includes('generate_3d_trellis'), false);
    assert.equal(idsOf(graph).includes('generate_3d_meshygen_plus'), false);
    assert.equal(checkGraph(graph, { blender_available: true }).ok, true);
  }
  for (const assetClass of STILL_2D_ASSETS) {
    assert.ok(typeof assetClass === 'string');
  }
});
