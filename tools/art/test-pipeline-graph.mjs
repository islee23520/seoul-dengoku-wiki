import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

import { checkGraph, compileGraph } from './pipeline-graph.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const cli = fileURLToPath(new URL('./pipeline-graph.mjs', import.meta.url));

function fourDirIntent() {
  return {
    asset_id: 'station-guard',
    asset_class: 'character_mesh',
    animation_need: 'four_dir_clip',
    dcc: 'auto',
    generation_backend: 'none',
    rights_status: 'allowed',
    source: 'existing',
  };
}

function cinematicMayaIntent() {
  return {
    asset_id: 'arrival-cutscene',
    asset_class: 'character_mesh',
    animation_need: 'cinematic_keyframe',
    dcc: 'maya',
    generation_backend: 'none',
    rights_status: 'allowed',
    source: 'existing',
  };
}

function idsOf(graph) {
  return graph.nodes.map((node) => node.id);
}

function predecessors(graph, nodeId) {
  return new Set(graph.edges.filter(([, dst]) => dst === nodeId).map(([src]) => src));
}

function assertThrowsCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code);
}

test('four_dir_clip uses blender animation not animo', () => {
  const graph = compileGraph(fourDirIntent());
  const ids = idsOf(graph);
  for (const required of [
    'rights_check',
    'blender_cleanup',
    'blender_rig',
    'blender_animation',
    'export_fbx',
    'unity_import',
    'human_review',
    'bom_promotion',
  ]) {
    assert.ok(ids.includes(required), `missing ${required}`);
  }
  assert.equal(ids.includes('maya_animo_polish'), false);
  assert.equal(graph.status, 'compiled');
  const skip = graph.skipped.find((item) => item.id === 'maya_animo_polish');
  assert.ok(skip, 'animo skip reason missing');
  assert.equal(skip.reason, 'animo_not_on_auto_path');
  assert.equal(ids[0], 'rights_check');
  assert.ok(ids.indexOf('blender_cleanup') < ids.indexOf('blender_animation'));
  assert.ok(ids.indexOf('blender_animation') < ids.indexOf('unity_import'));
  assert.ok(ids.indexOf('human_review') < ids.indexOf('bom_promotion'));
});

test('maya cinematic inserts animo after blender rig', () => {
  const graph = compileGraph(cinematicMayaIntent());
  const ids = idsOf(graph);
  assert.ok(ids.includes('maya_animo_polish'));
  assert.ok(ids.includes('blender_rig'));
  assert.equal(ids.includes('blender_animation'), false);
  assert.ok(ids.indexOf('blender_rig') < ids.indexOf('maya_animo_polish'));
  assert.ok(ids.indexOf('maya_animo_polish') < ids.indexOf('unity_import'));
  assert.ok(predecessors(graph, 'maya_animo_polish').has('blender_rig'));
  const animo = graph.nodes.find((node) => node.id === 'maya_animo_polish');
  assert.equal(animo.standalone, false);
  assert.equal(animo.tool, 'animo');
  assert.equal(animo.tool_version, '10.0');
  assert.equal(graph.status, 'compiled');
});

test('animo node is not a standalone pipeline', () => {
  const graph = compileGraph(cinematicMayaIntent());
  assert.ok(predecessors(graph, 'maya_animo_polish').size >= 1);
  assert.equal(idsOf(graph)[0], 'rights_check');
});

test('check fail-closed without maya or animo', () => {
  const graph = compileGraph(cinematicMayaIntent());
  const result = checkGraph(graph, {
    blender_available: true,
    maya_available: false,
    animo_available: false,
  });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('maya_missing'));
  assert.ok(result.codes.includes('animo_missing'));
});

test('check passes when maya and animo present', () => {
  const graph = compileGraph(cinematicMayaIntent());
  const result = checkGraph(graph, {
    blender_available: true,
    maya_available: true,
    animo_available: true,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.codes, []);
});

test('unknown asset class is rejected', () => {
  const intent = fourDirIntent();
  intent.asset_class = 'vfx_sparkle';
  assertThrowsCode(() => compileGraph(intent), 'unknown_asset_class');
});

test('portrait rejects maya', () => {
  assertThrowsCode(() => compileGraph({
    asset_id: 'hanjaemok-portrait',
    asset_class: 'portrait',
    animation_need: 'none',
    dcc: 'maya',
    generation_backend: 'openai_image',
    rights_status: 'allowed',
    source: 'generate',
  }), 'maya_incompatible_asset');
});

test('four_dir rejects maya', () => {
  const intent = fourDirIntent();
  intent.dcc = 'maya';
  assertThrowsCode(() => compileGraph(intent), 'four_dir_requires_blender');
});

test('maya without animation is rejected', () => {
  const intent = cinematicMayaIntent();
  intent.animation_need = 'none';
  assertThrowsCode(() => compileGraph(intent), 'maya_without_animation');
});

test('blocked rights do not compile downstream', () => {
  const intent = fourDirIntent();
  intent.rights_status = 'blocked';
  const graph = compileGraph(intent);
  assert.equal(graph.status, 'blocked');
  assert.deepEqual(idsOf(graph), ['rights_check']);
  const result = checkGraph(graph, { blender_available: true });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('rights_blocked'));
});

test('handcrafted animo-only graph is rejected', () => {
  const result = checkGraph({
    schema_version: 1,
    status: 'compiled',
    nodes: [{
      id: 'maya_animo_polish',
      kind: 'dcc_polish',
      tool: 'animo',
      standalone: true,
    }],
    edges: [],
    skipped: [],
    intent: { rights_status: 'allowed' },
  }, {
    blender_available: true,
    maya_available: true,
    animo_available: true,
  });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('animo_standalone_forbidden'));
});

test('portrait stays on 2d path', () => {
  const graph = compileGraph({
    asset_id: 'hanjaemok-portrait',
    asset_class: 'portrait',
    animation_need: 'none',
    dcc: 'auto',
    generation_backend: 'openai_image',
    rights_status: 'allowed',
    source: 'generate',
  });
  assert.deepEqual(idsOf(graph), [
    'rights_check',
    'generate_2d',
    'archive_raw',
    'human_review',
    'bom_promotion',
  ]);
});

test('prop compile fails closed when backend is TRELLIS', () => {
  assertThrowsCode(() => compileGraph({
    asset_id: 'ticket-gate',
    asset_class: 'prop',
    animation_need: 'none',
    dcc: 'auto',
    generation_backend: 'comfyui_trellis',
    rights_status: 'allowed',
    source: 'generate',
  }), 'trellis_invalid');
});

test('cli compile four_dir omits animo', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'janseon-art-graph-'));
  const intentPath = join(tmp, 'intent.json');
  await writeFile(intentPath, JSON.stringify(fourDirIntent()));
  const completed = spawnSync(process.execPath, [cli, 'compile', '--intent', intentPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(completed.status, 0, completed.stderr);
  const payload = JSON.parse(completed.stdout);
  const ids = idsOf(payload);
  assert.ok(ids.includes('blender_animation'));
  assert.equal(ids.includes('maya_animo_polish'), false);
});

test('cli check maya without host is nonzero', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'janseon-art-graph-'));
  const intentPath = join(tmp, 'intent.json');
  await writeFile(intentPath, JSON.stringify(cinematicMayaIntent()));
  const compiled = spawnSync(process.execPath, [cli, 'compile', '--intent', intentPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(compiled.status, 0, compiled.stderr);
  const graphPath = join(tmp, 'graph.json');
  await writeFile(graphPath, compiled.stdout);
  const checked = spawnSync(process.execPath, [
    cli, 'check', '--graph', graphPath, '--host', 'blender=1,maya=0,animo=0',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.notEqual(checked.status, 0);
  const payload = JSON.parse(checked.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.codes.includes('maya_missing'));
});
