import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  CLASS,
  auditRuntimeProvenance,
  classifyBackend,
  evaluatePromotedAsset,
  extractGuids,
  isQuarantinePath,
} from './runtime-asset-provenance.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gateCli = join(repoRoot, 'tools/art/check-runtime-asset-provenance.mjs');

function validNonTrellisAsset(overrides = {}) {
  return {
    schema_version: 1,
    asset_id: 'poc-ui-panel-texture',
    asset_class: 'ui_kit',
    source: 'generate',
    rights_status: 'allowed',
    generation_backend: 'grok_imagine',
    provider: 'xai',
    model: 'grok-imagine',
    revision: '1',
    prompt: 'panel',
    prompt_hash: 'a'.repeat(64),
    input_hashes: ['b'.repeat(64)],
    seed: 1,
    cost_mode: 'subscription',
    cost_cents: 0,
    raw_hash: 'c'.repeat(64),
    output_hash: 'd'.repeat(64),
    tool_versions: {},
    operations: ['rights_check', 'generate_2d', 'human_review', 'bom_promotion'],
    unity_import_settings: {},
    review_receipts: [{ reviewer: 't', verdict: 'pass', receipt_hash: 'e'.repeat(64), reviewed_at: '2026-01-01T00:00:00.000Z' }],
    status: 'promoted',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('classifyBackend: TRELLIS always fails closed', () => {
  for (const backend of ['trellis_v1', 'comfyui_trellis', 'TRELLIS', 'trellis2']) {
    const r = classifyBackend(backend);
    assert.equal(r.ok, false, backend);
    assert.equal(r.class, CLASS.D_TRELLIS_INVALID);
  }
});

test('classifyBackend: Tripo fails with tripo_agent_forbidden regardless of flags', () => {
  assert.equal(classifyBackend('tripo3d').ok, false);
  assert.equal(classifyBackend('tripo3d').code, 'tripo_agent_forbidden');
  assert.equal(classifyBackend('tripo3d', { tripoUserDirectAuthorized: true }).ok, false);
  assert.equal(classifyBackend('tripo3d', { tripoUserDirectAuthorized: true }).code, 'tripo_agent_forbidden');
});

test('classifyBackend: MeshyGen fails with meshygen_unverified', () => {
  assert.equal(classifyBackend('meshygen_plus').ok, false);
  assert.equal(classifyBackend('meshygen_plus').code, 'meshygen_unverified');
  assert.equal(classifyBackend('meshygen_plus', { meshyOfficialContractVerified: true }).ok, false);
  assert.equal(classifyBackend('meshygen_plus', { meshyOfficialContractVerified: true }).code, 'meshygen_unverified');
});

test('classifyBackend: allowlisted 2D backends pass classification', () => {
  assert.equal(classifyBackend('grok_imagine').ok, true);
  assert.equal(classifyBackend('nanobanana_gemini').ok, true);
  assert.equal(classifyBackend('openai_image').ok, true);
});

test('evaluatePromotedAsset: TRELLIS BOM row is never runtime-valid', () => {
  const asset = validNonTrellisAsset({
    generation_backend: 'trellis_v1',
    asset_class: 'prop',
    prefab_path: 'Assets/Janseon/Art/Props/poc-prop-bench/poc-prop-bench.prefab',
  });
  const r = evaluatePromotedAsset(asset);
  assert.equal(r.ok, false);
  assert.equal(r.class, CLASS.D_TRELLIS_INVALID);
  assert.ok(r.errors.some((e) => e.code === 'trellis_blocked' || e.code === 'quarantine_path'));
});

test('evaluatePromotedAsset: valid non-TRELLIS promoted asset passes', () => {
  const r = evaluatePromotedAsset(validNonTrellisAsset());
  assert.equal(r.ok, true);
  assert.equal(r.class, CLASS.A_VALID_PROMOTED);
});

test('evaluatePromotedAsset: missing hash fails', () => {
  const r = evaluatePromotedAsset(validNonTrellisAsset({ output_hash: 'nope' }));
  assert.equal(r.ok, false);
});

test('isQuarantinePath detects ArtSource and poc-prop paths', () => {
  assert.equal(isQuarantinePath('Game/Assets/Janseon/ArtSource/Props/x'), true);
  assert.equal(isQuarantinePath('Assets/Janseon/Art/Props/poc-prop-bench/a.prefab'), true);
  assert.equal(isQuarantinePath('Game/Assets/Janseon/Foundation/UI/Screens/MainTitle.uxml'), false);
});

test('extractGuids skips built-in zero guids', () => {
  const text = `
  m_Script: {fileID: 11500000, guid: 5edd73dd925e141a0b7d84271af22c99, type: 3}
  m_SkyboxMaterial: {fileID: 10304, guid: 0000000000000000f000000000000000, type: 0}
  `;
  const guids = extractGuids(text);
  assert.deepEqual(guids, ['5edd73dd925e141a0b7d84271af22c99']);
});

test('production worktree audit: playable slice has no C/D/E runtime refs', () => {
  const audit = auditRuntimeProvenance(repoRoot);
  assert.equal(audit.ok, true, formatViolations(audit));
  assert.ok(audit.policy.trellis.ok === false);
  assert.ok(audit.bomEvaluations.length >= 1, 'expected historical BOM rows');
  assert.ok(audit.bomEvaluations.every((b) => !b.ok), 'all BOM rows must be invalid for runtime under lock');
  assert.ok(audit.blockedSlots.some((s) => s.slot.startsWith('prop:')));
  assert.ok(audit.blockedSlots.some((s) => s.slot === 'character-explorer'));
  // Code-native UI surfaces classified B
  const ui = audit.classifications.filter((c) => c.path && c.path.includes('Foundation/UI'));
  assert.ok(ui.length >= 3);
  assert.ok(ui.every((c) => c.class === CLASS.B_CODE_NATIVE));
});

test('gate CLI exits 0 on production worktree', () => {
  const out = execFileSync(process.execPath, [gateCli], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.match(out, /runtime asset provenance gate passed/);
});

test('RED mutation: injecting TRELLIS prefab guid into MainTitle scene fails the gate', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'todo16-prov-'));
  try {
    // Minimal fixture: copy gate modules + playable scenes + UI + build settings + BOM + metas for props.
    const copies = [
      'tools/art/runtime-asset-provenance.mjs',
      'tools/art/check-runtime-asset-provenance.mjs',
      'Game/ProjectSettings/EditorBuildSettings.asset',
      'Game/Assets/Scenes/Bootstrap.unity',
      'Game/Assets/Scenes/MainTitle.unity',
      'Game/Assets/Scenes/Foundation.unity',
      'Game/Assets/Janseon/Foundation/UI',
      'Game/Assets/Janseon/Foundation/Composition',
      'Game/Assets/Janseon/Art/Props/poc-prop-bench',
      'docs/assets/bom/props/station-prop-bom.json',
    ];
    for (const rel of copies) {
      const src = join(repoRoot, rel);
      const dest = join(fixture, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { recursive: true });
    }

    // GREEN on fixture first.
    let audit = auditRuntimeProvenance(fixture);
    assert.equal(audit.ok, true, `fixture clean should pass: ${formatViolations(audit)}`);

    // Inject TRELLIS prefab reference into MainTitle scene YAML (mutation).
    const benchMeta = join(fixture, 'Game/Assets/Janseon/Art/Props/poc-prop-bench/poc-prop-bench.prefab.meta');
    assert.ok(existsSync(benchMeta), 'bench prefab meta must exist for mutation');
    const benchGuid = /^guid:\s*([0-9a-f]{32})\s*$/m.exec(readFileSync(benchMeta, 'utf8'))[1];
    const scenePath = join(fixture, 'Game/Assets/Scenes/MainTitle.unity');
    const before = readFileSync(scenePath, 'utf8');
    const mutated = `${before}\n--- # todo16-mutation\nMonoBehaviour:\n  m_Script: {fileID: 0}\n  trellisLeak: {fileID: 100100000, guid: ${benchGuid}, type: 3}\n`;
    writeFileSync(scenePath, mutated);

    audit = auditRuntimeProvenance(fixture);
    assert.equal(audit.ok, false, 'mutated TRELLIS reference must fail gate');
    assert.ok(
      audit.violations.some((v) => v.code === 'runtime_references_quarantine_asset'),
      `expected quarantine violation, got ${JSON.stringify(audit.violations)}`,
    );

    // Restore → GREEN
    writeFileSync(scenePath, before);
    audit = auditRuntimeProvenance(fixture);
    assert.equal(audit.ok, true, `restored fixture must pass: ${formatViolations(audit)}`);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('RED mutation: build settings listing StationPropValidation fails', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'todo16-build-'));
  try {
    for (const rel of [
      'tools/art/runtime-asset-provenance.mjs',
      'Game/ProjectSettings/EditorBuildSettings.asset',
      'Game/Assets/Scenes/Bootstrap.unity',
      'Game/Assets/Scenes/MainTitle.unity',
      'Game/Assets/Scenes/Foundation.unity',
      'Game/Assets/Janseon/Foundation/UI',
      'docs/assets/bom/props/station-prop-bom.json',
    ]) {
      const src = join(repoRoot, rel);
      const dest = join(fixture, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { recursive: true });
    }
    const settings = join(fixture, 'Game/ProjectSettings/EditorBuildSettings.asset');
    const original = readFileSync(settings, 'utf8');
    writeFileSync(
      settings,
      `${original}\n  - enabled: 1\n    path: Assets/Janseon/Art/Props/StationPropValidation.unity\n    guid: deadbeefdeadbeefdeadbeefdeadbeef\n`,
    );
    const audit = auditRuntimeProvenance(fixture);
    assert.equal(audit.ok, false);
    assert.ok(audit.violations.some((v) => v.code === 'build_settings_quarantine_leak' || v.code === 'build_settings_unexpected'));
    writeFileSync(settings, original);
    assert.equal(auditRuntimeProvenance(fixture).ok, true);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

function formatViolations(audit) {
  return (audit.violations || []).map((v) => JSON.stringify(v)).join('\n');
}
