import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createHash } from 'node:crypto';

import {
  CLASS,
  auditRuntimeProvenance,
  classifyBackend,
  evaluatePromotedAsset,
  extractGuids,
  isQuarantinePath,
} from './runtime-asset-provenance.mjs';
import * as provenance from './runtime-asset-provenance.mjs';

<<<<<<<< HEAD:TOOL/art/test-runtime-asset-provenance.mjs
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const gateCli = join(repoRoot, 'Tool/art/check-runtime-asset-provenance.mjs');
========
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const gateCli = join(repoRoot, 'TOOL/tools/art/check-runtime-asset-provenance.mjs');
>>>>>>>> main:TOOL/tools/art/test-runtime-asset-provenance.mjs

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
    output_path: '',
    tool_versions: {},
    operations: ['rights_check', 'generate_2d', 'human_review', 'bom_promotion'],
    unity_import_settings: {},
    review_receipts: [{ reviewer: 't', verdict: 'pass', receipt_path: '', receipt_hash: 'e'.repeat(64), reviewed_at: '2026-01-01T00:00:00.000Z' }],
    status: 'promoted',
    created_at: '2026-01-01T00:00:00.000Z',
    look: {
      palette: { steel: '#8A93A0' },
      materials: { finish: 'test-only' },
<<<<<<<< HEAD:TOOL/art/test-runtime-asset-provenance.mjs
      references: [{ kind: 'test-contract', source: 'Tool/art/test-runtime-asset-provenance.mjs' }],
========
      references: [{ kind: 'test-contract', source: 'TOOL/tools/art/test-runtime-asset-provenance.mjs' }],
>>>>>>>> main:TOOL/tools/art/test-runtime-asset-provenance.mjs
      owner_verdict: 'accepted',
    },
    ...overrides,
  };
}

test('classifyBackend: disabled or unknown TRELLIS alternatives fail closed', () => {
  for (const backend of ['comfyui_trellis', 'TRELLIS', 'trellis2']) {
    const r = classifyBackend(backend);
    assert.equal(r.ok, false, backend);
    assert.equal(r.class, CLASS.E_UNKNOWN);
  }
});

test('classifyBackend: Tripo fails with tripo_agent_forbidden regardless of flags', () => {
  assert.equal(classifyBackend('tripo3d').ok, false);
  assert.equal(classifyBackend('tripo3d').code, 'user_explicit_required');
  assert.equal(classifyBackend('tripo3d', { tripoUserDirectAuthorized: true }).ok, false);
  assert.equal(classifyBackend('tripo3d', { tripoUserDirectAuthorized: true }).code, 'user_explicit_required');
});

test('classifyBackend: MeshyGen fails with meshygen_unverified', () => {
  assert.equal(classifyBackend('meshygen_plus').ok, false);
  assert.equal(classifyBackend('meshygen_plus').code, 'provider_identity_unverified');
  assert.equal(classifyBackend('meshygen_plus', { meshyOfficialContractVerified: true }).ok, false);
  assert.equal(classifyBackend('meshygen_plus', { meshyOfficialContractVerified: true }).code, 'provider_identity_unverified');
});

test('classifyBackend: allowlisted 2D backends pass classification', () => {
  assert.equal(classifyBackend('grok_imagine').ok, true);
  assert.equal(classifyBackend('nanobanana_gemini').ok, true);
  assert.equal(classifyBackend('openai_image').ok, true);
});

test('classifyBackend: retained TRELLIS remains eligible option', () => {
  const r = classifyBackend('trellis_v1');
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.notEqual(r.code, 'trellis_blocked');
  assert.notEqual(r.class, CLASS.D_TRELLIS_INVALID);
});

test('evaluatePromotedAsset: synthetic unbound review receipt is rejected', () => {
  const asset = validNonTrellisAsset({
    review_receipts: [{
      reviewer: 'synthetic',
      verdict: 'pass',
      receipt_hash: 'e'.repeat(64),
      reviewed_at: '2026-01-01T00:00:00.000Z',
    }],
  });
  const r = evaluatePromotedAsset(asset, {
    assetBytes: Buffer.from('not-the-claimed-hash-bytes'),
    reviewBytes: Buffer.from('unrelated review text without output hash'),
  });
  assert.equal(r.ok, false);
  assert.ok(
    (r.errors || []).some((e) => e.code === 'review_receipt_unbound' || e.code === 'output_hash_mismatch'),
    JSON.stringify(r),
  );
});

test('evaluatePromotedAsset: unbound TRELLIS BOM row is not runtime-valid', () => {
  const asset = validNonTrellisAsset({
    generation_backend: 'trellis_v1',
    asset_class: 'prop',
    prefab_path: 'Assets/Janseon/Art/Props/poc-prop-bench/poc-prop-bench.prefab',
  });
  const r = evaluatePromotedAsset(asset);
  assert.equal(r.ok, false);
  assert.equal(r.class, CLASS.E_UNKNOWN);
  assert.ok(r.errors.some((e) => e.code === 'review_receipt_unbound'));
});

test('evaluatePromotedAsset: source-bound bytes and review pass, mutations fail', () => {
  const root = mkdtempSync(join(tmpdir(), 'bound-asset-'));
  const hash = b => createHash('sha256').update(b).digest('hex');
  try {
    const asset = validNonTrellisAsset();
    for (const [path, bytes] of [['output.bin','output'], ['raw.bin','raw'], ['rights.txt','actual terms'], ['review.md','independent review']]) writeFileSync(join(root,path),bytes);
    asset.output_path='output.bin'; asset.output_hash=hash('output');
    asset.raw_path='raw.bin'; asset.raw_hash=hash('raw');
    asset.rights_evidence={path:'rights.txt',sha256:hash('actual terms')};
    asset.review_receipts[0].receipt_path='review.md'; asset.review_receipts[0].receipt_hash=hash('independent review');
    const binding=JSON.stringify({asset_id:asset.asset_id,output_hash:asset.output_hash,review_hashes:[asset.review_receipts[0].receipt_hash]});
    writeFileSync(join(root,'binding.json'),binding);
    asset.source_binding={path:'binding.json',sha256:hash(binding)};
    asset.runtime_files={'output.bin':asset.output_hash};
    assert.equal(evaluatePromotedAsset(asset,{repoRoot:root}).ok,true, 'accepted fully bound asset passes');
    for (const owner_verdict of ['pending', 'rejected']) {
      const result = evaluatePromotedAsset({
        ...asset,
        look: { ...asset.look, owner_verdict },
      }, { repoRoot: root });
      assert.equal(result.ok, false, `${owner_verdict} look must not be runtime-eligible`);
      assert.ok(
        result.errors.some(error => error.code === 'owner_verdict_not_accepted'),
        JSON.stringify(result),
      );
    }
    for (const path of ['output.bin','raw.bin','rights.txt','review.md','binding.json']) {
      const original=readFileSync(join(root,path)); writeFileSync(join(root,path),'changed');
      assert.equal(evaluatePromotedAsset(asset,{repoRoot:root}).ok,false,path);
      writeFileSync(join(root,path),original);
    }
    for (const status of ['archived','blocked','draft']) assert.equal(evaluatePromotedAsset({...asset,status},{repoRoot:root}).ok,false,status);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('evaluatePromotedAsset: missing hash fails', () => {
  const r = evaluatePromotedAsset(validNonTrellisAsset({ output_hash: 'nope' }));
  assert.equal(r.ok, false);
});

test('isQuarantinePath detects staging and quarantine paths', () => {
  assert.equal(isQuarantinePath('GAME/Assets/Janseon/Art/Staging/Props/x'), true);
  assert.equal(isQuarantinePath('Assets/Janseon/Art/Props/poc-prop-bench/a.prefab'), false);
  assert.equal(isQuarantinePath('GAME/Assets/Janseon/Foundation/UI/Screens/MainTitle.uxml'), false);
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
  assert.ok(audit.policy.trellis.ok === true);
  const expectedOpen = 10 - audit.bomEvaluations.filter(b => b.ok).length;
  assert.equal(audit.blockedSlots.length, expectedOpen);
  assert.ok(audit.blockedSlots.some((s) => s.slot === 'title-art'));
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
<<<<<<<< HEAD:TOOL/art/test-runtime-asset-provenance.mjs
      'Tool/art/runtime-asset-provenance.mjs',
      'Tool/art/check-runtime-asset-provenance.mjs',
      'Game/ProjectSettings/EditorBuildSettings.asset',
      'Game/Assets/Scenes/Bootstrap.unity',
      'Game/Assets/Scenes/MainTitle.unity',
      'Game/Assets/Scenes/Foundation.unity',
      'Game/Assets/Janseon/Foundation/UI',
      'Game/Assets/Janseon/Foundation/Composition',
========
      'TOOL/tools/art/runtime-asset-provenance.mjs',
      'TOOL/tools/art/check-runtime-asset-provenance.mjs',
      'GAME/ProjectSettings/EditorBuildSettings.asset',
      'GAME/Assets/Scenes/Bootstrap.unity',
      'GAME/Assets/Scenes/MainTitle.unity',
      'GAME/Assets/Scenes/Foundation.unity',
      'GAME/Assets/Janseon/Foundation/UI',
      'GAME/Assets/Janseon/Foundation/Composition',
>>>>>>>> main:TOOL/tools/art/test-runtime-asset-provenance.mjs
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
    const benchMeta = join(fixture, 'GAME/Assets/Janseon/Art/Staging/Props/unreviewed.prefab.meta');
    mkdirSync(dirname(benchMeta), { recursive: true });
    writeFileSync(benchMeta, 'guid: 71cdea5c20934aa59fdd7265e4fd2cec\n');
    assert.ok(existsSync(benchMeta), 'bench prefab meta must exist for mutation');
    const benchGuid = /^guid:\s*([0-9a-f]{32})\s*$/m.exec(readFileSync(benchMeta, 'utf8'))[1];
    const scenePath = join(fixture, 'GAME/Assets/Scenes/MainTitle.unity');
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
<<<<<<<< HEAD:TOOL/art/test-runtime-asset-provenance.mjs
      'Tool/art/runtime-asset-provenance.mjs',
      'Game/ProjectSettings/EditorBuildSettings.asset',
      'Game/Assets/Scenes/Bootstrap.unity',
      'Game/Assets/Scenes/MainTitle.unity',
      'Game/Assets/Scenes/Foundation.unity',
      'Game/Assets/Janseon/Foundation/UI',
========
      'TOOL/tools/art/runtime-asset-provenance.mjs',
      'GAME/ProjectSettings/EditorBuildSettings.asset',
      'GAME/Assets/Scenes/Bootstrap.unity',
      'GAME/Assets/Scenes/MainTitle.unity',
      'GAME/Assets/Scenes/Foundation.unity',
      'GAME/Assets/Janseon/Foundation/UI',
>>>>>>>> main:TOOL/tools/art/test-runtime-asset-provenance.mjs
    ]) {
      const src = join(repoRoot, rel);
      const dest = join(fixture, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { recursive: true });
    }
    const settings = join(fixture, 'GAME/ProjectSettings/EditorBuildSettings.asset');
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

<<<<<<<< HEAD:TOOL/art/test-runtime-asset-provenance.mjs
const slotContract = JSON.parse(readFileSync(join(repoRoot, 'Tool/art/runtime-slot-contract.json'), 'utf8'));
========
const slotContract = JSON.parse(readFileSync(join(repoRoot, 'TOOL/tools/art/runtime-slot-contract.json'), 'utf8'));
>>>>>>>> main:TOOL/tools/art/test-runtime-asset-provenance.mjs
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function slotFixture(t, slot = slotContract.slots[0]) {
  const root = mkdtempSync(join(tmpdir(), 'runtime-slot-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, bytes) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
    return sha256(bytes);
  };
  for (const path of ['GAME/ProjectSettings/EditorBuildSettings.asset', 'GAME/Assets/Scenes', 'GAME/Assets/Janseon/Foundation/UI']) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(repoRoot, path), join(root, path), { recursive: true });
  }
  const keys = [...slot.runtime_keys];
  const files = {};
  const slots = {};
  for (const key of keys) {
    const path = `${slot.destination}${key.replaceAll('/', '-')}.${key.endsWith('/clip') ? 'anim' : 'png'}`;
    slots[key] = path;
    files[path] = put(path, `synthetic test-only ${slot.slot} ${key}`);
  }
  const row = validNonTrellisAsset({
    asset_id: `fixture-${slot.slot}`, runtime_slot: slot.slot, asset_class: slot.asset_class,
    output_path: slots[slot.primary_key], output_hash: files[slots[slot.primary_key]],
    raw_path: 'GAME/Assets/Janseon/Art/Staging/TestFixture/raw.png',
    runtime_files: files, runtime_slot_files: slots,
  });
  row.raw_hash = put(row.raw_path, 'test-only raw');
  row.rights_evidence = { path: 'fixture/rights.txt', sha256: put('fixture/rights.txt', 'Synthetic fixture only; not a real asset approval.') };
  row.review_receipts[0].receipt_path = 'fixture/review.json';
  row.review_receipts[0].receipt_hash = put('fixture/review.json', JSON.stringify({ fixture: true, output_hash: row.output_hash }));
  const bind = () => {
    const bytes = JSON.stringify({ asset_id: row.asset_id, runtime_slot: row.runtime_slot,
      output_hash: row.output_hash, raw_hash: row.raw_hash, rights_evidence: row.rights_evidence,
      runtime_files: row.runtime_files, runtime_slot_files: row.runtime_slot_files,
      review_hashes: row.review_receipts.map(r => r.receipt_hash) });
    row.source_binding = { path: 'fixture/binding.json', sha256: put('fixture/binding.json', bytes) };
  };
  const save = () => put(slotContract.bom_path, JSON.stringify({ schema_version: 1, assets: [row] }));
  bind(); save();
  return { root, row, put, bind, save };
}

test('portrait slot exists and is declared composite-only (Intent decision 8)', () => {
  const slot = slotContract.slots.find(s => s.slot === 'character-portrait');
  assert.ok(slot, 'character-portrait runtime slot must exist');
  assert.equal(slot.asset_class, 'portrait');
  assert.equal(slot.composite_only, true);
  assert.deepEqual(slot.runtime_keys, ['atlas']);
  assert.equal(slot.primary_key, 'atlas');
});

test('portrait slot: a per-slot layer plate may not enter the runtime', t => {
  const slot = slotContract.slots.find(s => s.slot === 'character-portrait');
  const { root, row, put, bind, save } = slotFixture(t, slot);
  assert.equal(auditRuntimeProvenance(root).ok, true);
  const plate = `${slot.destination}hair.png`;
  row.runtime_files[plate] = put(plate, 'test-only layer plate');
  bind();
  save();
  const audit = auditRuntimeProvenance(root);
  const evaluated = audit.bomEvaluations.find(b => b.asset_id === row.asset_id);
  assert.ok(evaluated.errors.some(e => e.code === 'portrait_layer_plate_forbidden'),
    JSON.stringify(evaluated.errors));
  assert.ok(audit.blockedSlots.some(s => s.slot === 'character-portrait'));
});

for (const slot of slotContract.slots) {
  test(`runtime slot: valid source-bound ${slot.slot} unblocks and classifies A`, t => {
    const { root, row } = slotFixture(t, slot);
    const audit = auditRuntimeProvenance(root);
    assert.equal(audit.ok, true, formatViolations(audit));
    assert.equal(audit.blockedSlots.some(s => s.slot === slot.slot), false);
    const evaluated = audit.bomEvaluations.find(b => b.asset_id === row.asset_id);
    assert.equal(evaluated?.class, CLASS.A_VALID_PROMOTED);
    assert.deepEqual(evaluated.paths.sort(), Object.keys(row.runtime_files).sort());
  });
}

for (const mutation of ['rights', 'output', 'review', 'raw', 'binding', 'empty-reviews', 'candidate', 'missing-key', 'unbound-secondary']) {
  test(`runtime slot: ${mutation} fails closed`, t => {
    const { root, row, put, bind, save } = slotFixture(t);
    if (mutation === 'rights') delete row.rights_evidence;
    if (mutation === 'output') put(row.output_path, 'tampered');
    if (mutation === 'review') row.review_receipts[0].receipt_hash = put('fixture/review.json', 'unbound receipt');
    if (mutation === 'raw') put(row.raw_path, 'tampered');
    if (mutation === 'binding') put(row.source_binding.path, '{}');
    if (mutation === 'empty-reviews') row.review_receipts = [];
    if (mutation === 'candidate') {
      const path = 'GAME/Assets/Janseon/Art/Staging/TestFixture/leak.png';
      row.runtime_files[path] = put(path, 'candidate');
      row.runtime_slot_files.backdrop = path;
      bind();
    }
    if (mutation === 'missing-key') { delete row.runtime_slot_files.backdrop; bind(); }
    if (mutation === 'unbound-secondary') {
      row.runtime_files['GAME/Assets/Janseon/Art/Title/extra.png'] = put('GAME/Assets/Janseon/Art/Title/extra.png', 'not reviewed');
    }
    save();
    const audit = auditRuntimeProvenance(root);
    assert.equal(audit.blockedSlots.some(s => s.slot === 'title-art'), true);
    const evaluated = audit.bomEvaluations.find(b => b.asset_id === row.asset_id);
    assert.equal(evaluated?.ok, false, JSON.stringify(evaluated));
  });
}

for (const indirect of [false, true]) {
  test(`runtime slot: candidate GUID leak ${indirect ? 'through catalog' : 'from scene'} fails`, t => {
    const { root, put } = slotFixture(t);
    const candidate = 'GAME/Assets/Janseon/Art/Staging/TestFixture/leak.png';
    const guid = '1234567890abcdef1234567890abcdef';
    put(candidate, 'candidate');
    put(candidate + '.meta', `guid: ${guid}\n`);
    let reference = `{fileID: 2800000, guid: ${guid}, type: 3}`;
    if (indirect) {
      const catalogGuid = 'abcdef1234567890abcdef1234567890';
      put(slotContract.catalog_path, `texture: ${reference}\n`);
      put(slotContract.catalog_path + '.meta', `guid: ${catalogGuid}\n`);
      reference = `{fileID: 11400000, guid: ${catalogGuid}, type: 2}`;
    }
    const scene = 'GAME/Assets/Scenes/MainTitle.unity';
    put(scene, readFileSync(join(root, scene), 'utf8') + `\nslot: ${reference}\n`);
    const audit = auditRuntimeProvenance(root);
    assert.equal(audit.ok, false);
    assert.ok(audit.violations.some(v => v.code === 'runtime_references_quarantine_asset' && v.target === candidate));
  });
}

test('runtime slot: catalog cannot claim a blocked slot is bound', t => {
  const { root, put } = slotFixture(t);
  put(slotContract.bom_path, JSON.stringify({ schema_version: 1, assets: [] }));
  const guid = 'abcdef1234567890abcdef1234567890';
  put(slotContract.catalog_path, 'entries:\n  - slot: title-art\n    bound: 1\n    sourceBindingHash: \n    files: []\n');
  put(slotContract.catalog_path + '.meta', `guid: ${guid}\n`);
  const scene = 'GAME/Assets/Scenes/MainTitle.unity';
  put(scene, readFileSync(join(root, scene), 'utf8') + `\nslot: {fileID: 11400000, guid: ${guid}, type: 2}\n`);
  const audit = auditRuntimeProvenance(root);
  assert.equal(audit.ok, false);
  assert.ok(audit.violations.some(v => v.code === 'catalog_slot_unprovenanced'));
});

test('original station props bind runtime slots to their BOM provenance sources without promotion', () => {
  const bom = JSON.parse(readFileSync(join(repoRoot, 'GAME-REFERENCE/assets/bom/props/station-prop-bom.json'), 'utf8'));
  assert.equal(bom.assets.length, 6);
  for (const asset of bom.assets) {
    assert.equal(provenance.runtimeSlotForAsset(asset), `prop:${asset.asset_id}`);
    const evaluated = evaluatePromotedAsset({ ...asset, look: { ...asset.look, owner_verdict: 'accepted' } });
    assert.equal(evaluated.ok, true, `${asset.asset_id}: ${JSON.stringify(evaluated.errors)}`);
    assert.equal(evaluated.source_binding_hash, asset.source_binding.sha256);
    assert.deepEqual(evaluated.paths.sort(), Object.keys(asset.runtime_files).sort());
  }
});

