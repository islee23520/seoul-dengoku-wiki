import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { checkGraph, compileGraph, parseHostFlag } from './pipeline-graph.mjs';

const intentsDir = fileURLToPath(new URL('./intents/', import.meta.url));

const HASH_A = 'a'.repeat(64);

function idsOf(graph) {
  return graph.nodes.map((node) => node.id);
}

function still2dIntent(backend, assetClass = 'portrait') {
  return {
    asset_id: `poc-${backend}`,
    asset_class: assetClass,
    animation_need: 'none',
    dcc: 'auto',
    generation_backend: backend,
    rights_status: 'allowed',
    source: 'generate',
  };
}

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

function fourDirIntent(backend) {
  return {
    asset_id: 'poc-explorer',
    asset_class: 'character_mesh',
    animation_need: 'four_dir_clip',
    dcc: 'auto',
    generation_backend: backend,
    rights_status: 'allowed',
    source: 'generate',
  };
}

function assertThrowsCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code);
}

function generate2d(graph) {
  return graph.nodes.find((node) => node.id === 'generate_2d');
}

function generate3d(graph) {
  return graph.nodes.find((node) => node.id === 'generate_3d_trellis');
}

test('nanobanana_gemini 2d node uses gemini metadata', () => {
  const graph = compileGraph(still2dIntent('nanobanana_gemini'));
  const node = generate2d(graph);
  assert.ok(node, 'generate_2d missing');
  assert.equal(node.tool, 'nanobanana_gemini');
  assert.equal(node.provider, 'google');
  assert.equal(node.model, 'nanobanana-gemini');
  assert.deepEqual(idsOf(graph), [
    'rights_check',
    'generate_2d',
    'archive_raw',
    'human_review',
    'bom_promotion',
  ]);
});

test('grok_imagine 2d node uses xai metadata', () => {
  const graph = compileGraph(still2dIntent('grok_imagine', 'tile'));
  const node = generate2d(graph);
  assert.ok(node, 'generate_2d missing');
  assert.equal(node.tool, 'grok_imagine');
  assert.equal(node.provider, 'xai');
  assert.equal(node.model, 'grok-imagine');
  assert.equal(idsOf(graph).includes('generate_3d_trellis'), false);
});

test('openai_image 2d node uses openai metadata', () => {
  const graph = compileGraph(still2dIntent('openai_image'));
  const node = generate2d(graph);
  assert.ok(node, 'generate_2d missing');
  assert.equal(node.tool, 'openai_image');
  assert.equal(node.provider, 'openai');
  assert.equal(node.model, 'openai-imagegen');
});

test('unknown generation backend is rejected', () => {
  assertThrowsCode(() => compileGraph(still2dIntent('midjourney')), 'unknown_backend');
});

test('legacy comfyui_trellis remains a community execution label', () => {
  const graph = compileGraph(meshIntent('comfyui_trellis'));
  const twoD = generate2d(graph);
  const threeD = generate3d(graph);
  assert.equal(twoD.tool, 'comfyui');
  assert.equal(threeD.tool, 'trellis');
  assert.equal(threeD.execution, 'comfyui');
});

test('direct trellis_v1 3d node is official trellis not comfyui', () => {
  const graph = compileGraph(meshIntent('trellis_v1'));
  const threeD = generate3d(graph);
  assert.ok(threeD, 'generate_3d_trellis missing');
  assert.equal(idsOf(graph).includes('generate_2d'), false);
  assert.equal(threeD.tool, 'trellis');
  assert.equal(threeD.provider, 'microsoft');
  assert.equal(threeD.model, 'microsoft/TRELLIS-image-large');
  assert.equal(threeD.revision, '442aa1e1afb9014e80681d3bf604e8d728a86ee7');
  assert.equal(threeD.execution, 'direct_python');
  for (const node of graph.nodes) {
    assert.notEqual(node.tool, 'comfyui');
    assert.equal(String(node.execution ?? '').includes('comfy'), false);
    assert.equal(String(node.model ?? '').toLowerCase().includes('comfy'), false);
  }
});

test('trellis_v1 four_dir keeps blender animation without animo', () => {
  const graph = compileGraph(fourDirIntent('trellis_v1'));
  const ids = idsOf(graph);
  assert.ok(ids.includes('generate_3d_trellis'));
  assert.equal(ids.includes('generate_2d'), false);
  assert.ok(ids.includes('blender_animation'));
  assert.equal(ids.includes('maya_animo_polish'), false);
  assert.equal(generate3d(graph).tool, 'trellis');
  assert.equal(generate3d(graph).model, 'microsoft/TRELLIS-image-large');
});

test('parseHostFlag accepts trellis', () => {
  const host = parseHostFlag('blender=1,trellis=1,maya=0,animo=0');
  assert.equal(host.blender_available, true);
  assert.equal(host.trellis_available, true);
  assert.equal(host.maya_available, false);
  assert.equal(host.animo_available, false);
});

test('check fail-closed without trellis host for trellis_v1', () => {
  const graph = compileGraph(meshIntent('trellis_v1'));
  const result = checkGraph(graph, {
    blender_available: true,
    trellis_available: false,
  });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('trellis_missing'));
});

test('check passes when blender and trellis present for trellis_v1', () => {
  const graph = compileGraph(meshIntent('trellis_v1'));
  const result = checkGraph(graph, {
    blender_available: true,
    trellis_available: true,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.codes, []);
});

test('unresolved rights compile only rights_check', () => {
  const intent = fourDirIntent('comfyui_trellis');
  intent.rights_status = 'unresolved';
  const graph = compileGraph(intent);
  assert.equal(graph.status, 'blocked');
  assert.deepEqual(idsOf(graph), ['rights_check']);
  const result = checkGraph(graph, { blender_available: true, trellis_available: true });
  assert.equal(result.ok, false);
  assert.deepEqual(result.codes, ['rights_unresolved']);
});

test('check rejects graph when intent digest no longer matches', () => {
  const graph = compileGraph(still2dIntent('openai_image'));
  graph.intent = { ...graph.intent, asset_id: 'mutated-id' };
  const result = checkGraph(graph, { blender_available: true });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('stale_intent'));
});

test('check rejects stored graph with foreign schema_version', () => {
  const graph = compileGraph(still2dIntent('openai_image'));
  graph.schema_version = 0;
  const result = checkGraph(graph, { blender_available: true });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('schema_version_mismatch'));
});

test('ui_concept title_art and ui_kit stay on 2d path', () => {
  for (const assetClass of ['ui_concept', 'title_art', 'ui_kit']) {
    const graph = compileGraph({
      asset_id: `poc-${assetClass}`,
      asset_class: assetClass,
      animation_need: 'none',
      dcc: 'auto',
      generation_backend: 'nanobanana_gemini',
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
  }
});

test('intent digest is stable for identical intents', () => {
  const graphA = compileGraph(still2dIntent('openai_image'));
  const graphB = compileGraph(still2dIntent('openai_image'));
  assert.equal(typeof graphA.intent_digest, 'string');
  assert.equal(graphA.intent_digest.length, 64);
  assert.equal(graphA.intent_digest, graphB.intent_digest);
  assert.notEqual(graphA.intent_digest, HASH_A);
});

test('poc and existing intent files compile', async () => {
  const names = (await readdir(intentsDir)).filter((name) => name.endsWith('.json'));
  const poc = names.filter((name) => name.startsWith('poc-'));
  assert.equal(poc.length, 6);
  for (const name of names) {
    const intent = JSON.parse(await readFile(join(intentsDir, name), 'utf8'));
    const graph = compileGraph(intent);
    if (intent.rights_status !== 'allowed') {
      assert.deepEqual(idsOf(graph), ['rights_check']);
      continue;
    }
    assert.equal(graph.status, 'compiled');
    const host = parseHostFlag('blender=1,trellis=1,maya=1,animo=1');
    assert.equal(checkGraph(graph, host).ok, true, name);
  }
});
