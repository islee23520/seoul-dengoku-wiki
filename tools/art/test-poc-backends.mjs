import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { INVALID_BACKENDS } from './catalog.mjs';
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

test('legacy comfyui_trellis compile is invalid', () => {
  assertThrowsCode(() => compileGraph(meshIntent('comfyui_trellis')), 'trellis_invalid');
});

test('direct trellis_v1 compile is invalid', () => {
  assertThrowsCode(() => compileGraph(meshIntent('trellis_v1')), 'trellis_invalid');
});

test('trellis_v1 four_dir compile is invalid', () => {
  assertThrowsCode(() => compileGraph(fourDirIntent('trellis_v1')), 'trellis_invalid');
});

test('parseHostFlag accepts trellis', () => {
  const host = parseHostFlag('blender=1,trellis=1,maya=0,animo=0');
  assert.equal(host.blender_available, true);
  assert.equal(host.trellis_available, true);
  assert.equal(host.maya_available, false);
  assert.equal(host.animo_available, false);
});

test('check fail-closed for handcrafted trellis graph even without host', () => {
  const result = checkGraph({
    schema_version: 1,
    status: 'compiled',
    intent: { rights_status: 'allowed', generation_backend: 'trellis_v1' },
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
  }, {
    blender_available: true,
    trellis_available: false,
  });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('trellis_invalid'));
});

test('check fail-closed when blender and trellis host are present for trellis_v1', () => {
  assertThrowsCode(() => compileGraph(meshIntent('trellis_v1')), 'trellis_invalid');
  const result = checkGraph({
    schema_version: 1,
    status: 'compiled',
    intent: { rights_status: 'allowed', generation_backend: 'trellis_v1' },
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
  }, {
    blender_available: true,
    trellis_available: true,
  });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('trellis_invalid'));
});

test('unresolved rights compile only rights_check', () => {
  const intent = fourDirIntent('openai_image');
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
    if (INVALID_BACKENDS.has(intent.generation_backend)) {
      assertThrowsCode(() => compileGraph(intent), 'trellis_invalid');
      continue;
    }
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
