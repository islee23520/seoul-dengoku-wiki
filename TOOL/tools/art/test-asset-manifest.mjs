import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const cli = fileURLToPath(new URL('./pipeline-graph.mjs', import.meta.url));

const HEX_A = 'a'.repeat(64);
const HEX_B = 'b'.repeat(64);
const HEX_C = 'c'.repeat(64);
const HEX_D = 'd'.repeat(64);
const HEX_E = 'e'.repeat(64);
const FIXED_TIME = '2026-01-01T00:00:00.000Z';

const REQUIRED_FIELDS = [
  'schema_version',
  'asset_id',
  'asset_class',
  'source',
  'rights_status',
  'generation_backend',
  'provider',
  'model',
  'revision',
  'prompt',
  'prompt_hash',
  'input_hashes',
  'seed',
  'cost_mode',
  'cost_cents',
  'raw_hash',
  'output_hash',
  'tool_versions',
  'operations',
  'unity_import_settings',
  'review_receipts',
  'status',
  'created_at',
  'look',
];

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
    prompt: 'blank nine-slice panel, no text',
    prompt_hash: HEX_A,
    input_hashes: [HEX_B],
    seed: 42,
    cost_mode: 'subscription',
    cost_cents: 0,
    raw_hash: HEX_C,
    output_hash: HEX_D,
    tool_versions: { blender: '5.1.2', unity: '6000.7.0a5' },
    operations: ['generate', 'archive'],
    unity_import_settings: {
      texture_type: 'Sprite',
      filter_mode: 'Point',
      mesh_compression: 'Off',
    },
    review_receipts: [{
      reviewer: 'art-lead',
      verdict: 'pass',
      receipt_hash: HEX_E,
      reviewed_at: FIXED_TIME,
    }],
    status: 'reviewed',
    created_at: FIXED_TIME,
    look: {
      palette: { void: '#0B111C', line: '#3D7EA6' },
      materials: { finish: 'matte', roughness: 0.7 },
      references: [{ kind: 'design-token', source: 'Design.md#2.1' }],
      owner_verdict: 'pending',
    },
    ...overrides,
  };
}

function validBom(assets) {
  return { schema_version: 1, assets };
}

function runValidate(filePath) {
  return spawnSync(process.execPath, [cli, 'validate-manifest', '--manifest', filePath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

async function writeTemp(name, value) {
  const tmp = await mkdtemp(join(tmpdir(), 'janseon-art-bom-'));
  const filePath = join(tmp, name);
  await writeFile(filePath, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

test('validate-manifest accepts a complete manifest', async () => {
  const filePath = await writeTemp('ok.json', validManifest());
  const completed = runValidate(filePath);
  assert.equal(completed.status, 0, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.errors, []);
});

for (const field of REQUIRED_FIELDS) {
  test(`validate-manifest rejects missing ${field}`, async () => {
    const manifest = validManifest();
    delete manifest[field];
    const filePath = await writeTemp(`missing-${field}.json`, manifest);
    const completed = runValidate(filePath);
    assert.equal(completed.status, 2, completed.stderr + completed.stdout);
    const payload = JSON.parse(completed.stdout);
    assert.equal(payload.ok, false);
    assert.ok(
      payload.errors.some((error) => error.code === 'missing_field' && error.field === field),
      JSON.stringify(payload.errors),
    );
  });
}

test('validate-manifest rejects empty look references', async () => {
  const filePath = await writeTemp('empty-look-refs.json', validManifest({
    look: {
      palette: { void: '#0B111C' },
      materials: { finish: 'matte' },
      references: [],
      owner_verdict: 'pending',
    },
  }));
  const completed = runValidate(filePath);
  assert.equal(completed.status, 2, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, false);
  assert.ok(
    payload.errors.some((error) => error.code === 'look_malformed' && error.field === 'look.references'),
    JSON.stringify(payload.errors),
  );
});

test('validate-manifest rejects unknown backend', async () => {
  const filePath = await writeTemp('unknown-backend.json', validManifest({
    generation_backend: 'midjourney',
  }));
  const completed = runValidate(filePath);
  assert.equal(completed.status, 2, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, false);
  assert.ok(
    payload.errors.some((error) => error.code === 'unknown_backend' && error.field === 'generation_backend'),
    JSON.stringify(payload.errors),
  );
});

test('validate-manifest rejects duplicate asset ID', async () => {
  const asset = validManifest({ asset_id: 'dup-panel' });
  const filePath = await writeTemp('dup.json', validBom([asset, { ...asset }]));
  const completed = runValidate(filePath);
  assert.equal(completed.status, 2, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, false);
  assert.ok(
    payload.errors.some((error) => error.code === 'duplicate_asset_id' && error.field === 'asset_id'),
    JSON.stringify(payload.errors),
  );
});

test('validate-manifest rejects malformed JSON', async () => {
  const filePath = await writeTemp('malformed.json', '{not json');
  const completed = runValidate(filePath);
  assert.equal(completed.status, 2, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, false);
  assert.deepEqual(payload.errors, [{ code: 'malformed_json' }]);
});

test('validate-manifest rejects blocked rights on promoted status', async () => {
  const filePath = await writeTemp('blocked-promoted.json', validManifest({
    rights_status: 'blocked',
    status: 'promoted',
  }));
  const completed = runValidate(filePath);
  assert.equal(completed.status, 2, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, false);
  assert.ok(
    payload.errors.some((error) => error.code === 'rights_not_allowed'),
    JSON.stringify(payload.errors),
  );
});

test('cli check blocked rights fixture exits 2 with only rights_check', async () => {
  const intentPath = await writeTemp('rights-blocked.json', {
    asset_id: 'blocked-prop',
    asset_class: 'prop',
    animation_need: 'none',
    dcc: 'auto',
    generation_backend: 'none',
    rights_status: 'blocked',
    source: 'existing',
  });
  const compiled = spawnSync(process.execPath, [cli, 'compile', '--intent', intentPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(compiled.status, 0, compiled.stderr);
  const graph = JSON.parse(compiled.stdout);
  assert.deepEqual(graph.nodes.map((node) => node.id), ['rights_check']);
  assert.equal(graph.nodes.some((node) => node.kind === 'generate' || node.kind === 'dcc' || node.kind === 'engine'), false);
  const graphPath = await writeTemp('rights-blocked.graph.json', graph);
  const checked = spawnSync(process.execPath, [
    cli, 'check', '--graph', graphPath, '--host', 'blender=1,trellis=1,maya=0,animo=0',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(checked.status, 2, checked.stderr + checked.stdout);
  const payload = JSON.parse(checked.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.codes.includes('rights_blocked'));
  assert.equal(payload.codes.includes('trellis_missing'), false);
});
