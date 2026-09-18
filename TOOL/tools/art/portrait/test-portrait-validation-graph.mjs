import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { compositePortraitLayers, decodePng, encodePng } from './portrait-layer-composite.mjs';
import { GraphError, runGraph, validateGraph } from './portrait-validation-graph.mjs';

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function ref(node, output) { return { node, output }; }
function load(id, path, bytes) { return { id, type: 'load_rgba', params: { path, sha256: sha256(bytes) } }; }
function graph(nodes) { return { schema_version: 1, nodes }; }
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'portrait-validation-'));
  const outputDir = join(root, 'evidence');
  mkdirSync(join(root, 'inputs'));
  return { root, outputDir };
}
function putPng(root, name, width, height, pixels) {
  const bytes = encodePng(width, height, Uint8Array.from(pixels)); const path = `inputs/${name}.png`;
  writeFileSync(join(root, path), bytes); return { bytes, path };
}

function assertCode(fn, code) {
  assert.throws(fn, (error) => error instanceof GraphError && error.code === code);
}

test('rejects DAG cycles', () => {
  assertCode(() => validateGraph(graph([
    { id: 'a', type: 'bundle_union', inputs: { masks: [ref('b', 'mask')] } },
    { id: 'b', type: 'bundle_union', inputs: { masks: [ref('a', 'mask')] } },
  ])), 'dag_cycle');
});

test('rejects missing typed input before execution', () => {
  assertCode(() => validateGraph(graph([
    { id: 'mask', type: 'alpha_mask', inputs: {} },
  ])), 'missing_typed_input');
});

test('normalizes RGB under zero alpha without changing visible pixels', () => {
  const { root, outputDir } = fixture();
  const source = putPng(root, 'dirty', 2, 1, [91, 82, 73, 0, 10, 20, 30, 255]);
  const receipt = runGraph(graph([
    load('load', source.path, source.bytes),
    { id: 'normalize', type: 'normalize_alpha_zero_rgb', inputs: { image: ref('load', 'image') } },
    { id: 'emit', type: 'emit_artifact', inputs: { value: ref('normalize', 'image') }, params: { path: 'normalized.png' } },
  ]), { repoRoot: root, outputDir });
  assert.equal(receipt.status, 'PASS');
  assert.equal(receipt.visual_approval, 'NOT_GRANTED');
  assert.equal(receipt.nodes[1].metrics.normalized_pixels, 1);
  assert.deepEqual([...decodePng(readFileSync(join(outputDir, 'normalized.png'))).pixels], [0, 0, 0, 0, 10, 20, 30, 255]);
});

test('mask nodes use exact binary math', () => {
  const { root, outputDir } = fixture();
  const a = putPng(root, 'a', 4, 1, [0,0,0,0, 1,1,1,1, 2,2,2,127, 3,3,3,255]);
  const b = putPng(root, 'b', 4, 1, [4,4,4,255, 0,0,0,0, 4,4,4,255, 0,0,0,0]);
  const receipt = runGraph(graph([
    load('a', a.path, a.bytes), load('b', b.path, b.bytes),
    { id: 'ma', type: 'alpha_mask', inputs: { image: ref('a', 'image') }, params: { threshold: 127 } },
    { id: 'mb', type: 'alpha_mask', inputs: { image: ref('b', 'image') }, params: { threshold: 1 } },
    { id: 'union', type: 'bundle_union', inputs: { masks: [ref('ma', 'mask'), ref('mb', 'mask')] } },
    { id: 'overlap', type: 'overlap', inputs: { a: ref('ma', 'mask'), b: ref('mb', 'mask') } },
    { id: 'outside', type: 'ownership_outside', inputs: { candidate: ref('ma', 'mask'), owner: ref('mb', 'mask') } },
  ]), { repoRoot: root, outputDir });
  assert.equal(receipt.status, 'PASS');
  assert.equal(receipt.nodes.find((n) => n.id === 'ma').metrics.opaque_pixels, 2);
  assert.equal(receipt.nodes.find((n) => n.id === 'union').metrics.union_pixels, 3);
  assert.equal(receipt.nodes.find((n) => n.id === 'overlap').metrics.pixels, 1);
  assert.equal(receipt.nodes.find((n) => n.id === 'outside').metrics.pixels, 1);
});

test('CPU LUT preview is byte deterministic with stable tie breaking', () => {
  const { root, outputDir } = fixture();
  const source = putPng(root, 'lut', 3, 1, [255,0,0,255, 0,0,255,255, 127,0,127,255]);
  const spec = graph([
    load('load', source.path, source.bytes),
    { id: 'palette', type: 'palette_extract', inputs: { image: ref('load', 'image') }, params: { colors: 2 } },
    { id: 'lut', type: 'lut_preview', inputs: { image: ref('load', 'image'), palette: ref('palette', 'palette') } },
    { id: 'emit', type: 'emit_artifact', inputs: { value: ref('lut', 'image') }, params: { path: 'lut.png' } },
  ]);
  const first = runGraph(spec, { repoRoot: root, outputDir });
  const firstBytes = readFileSync(join(outputDir, 'lut.png'));
  const second = runGraph(spec, { repoRoot: root, outputDir });
  const secondBytes = readFileSync(join(outputDir, 'lut.png'));
  assert.deepEqual(secondBytes, firstBytes);
  assert.equal(first.nodes.find((n) => n.id === 'lut').metrics.preview_sha256, second.nodes.find((n) => n.id === 'lut').metrics.preview_sha256);
  assert.equal(first.nodes.find((n) => n.id === 'lut').metrics.implementation, 'cpu-nearest-rgb-v1');
});

test('graph source-over pixels match the existing portrait compositor', () => {
  const { root, outputDir } = fixture();
  const back = putPng(root, 'back', 2, 1, [10,20,30,255, 200,100,50,128]);
  const front = putPng(root, 'front', 2, 1, [240,30,10,128, 20,220,80,64]);
  const receipt = runGraph(graph([
    load('back', back.path, back.bytes), load('front', front.path, front.bytes),
    { id: 'compose', type: 'composite_source_over', inputs: { images: [ref('back', 'image'), ref('front', 'image')] } },
    { id: 'emit', type: 'emit_artifact', inputs: { value: ref('compose', 'image') }, params: { path: 'graph.png' } },
  ]), { repoRoot: root, outputDir });
  assert.equal(receipt.status, 'PASS');
  const expected = compositePortraitLayers({
    schema: { slots: [{ id: 'back', z: 0, required: true }, { id: 'front', z: 1, required: true }] },
    slots: { back: join(root, back.path), front: join(root, front.path) },
  });
  assert.deepEqual(decodePng(readFileSync(join(outputDir, 'graph.png'))).pixels, expected.pixels);
});

test('load nodes fail closed on traversal, hash mismatch, and escaping symlinks', () => {
  const { root, outputDir } = fixture();
  const source = putPng(root, 'safe', 1, 1, [1,2,3,255]);
  const traversal = runGraph(graph([{ id: 'load', type: 'load_rgba', params: { path: '../outside.png', sha256: sha256(source.bytes) } }]), { repoRoot: root, outputDir });
  assert.equal(traversal.reason, 'unsafe_path'); assert.equal(traversal.failed_node, 'load');
  const mismatch = runGraph(graph([{ id: 'load', type: 'load_rgba', params: { path: source.path, sha256: '0'.repeat(64) } }]), { repoRoot: root, outputDir });
  assert.equal(mismatch.reason, 'hash_mismatch'); assert.equal(mismatch.failed_node, 'load');
  const outside = join(tmpdir(), `portrait-outside-${process.pid}.png`); writeFileSync(outside, source.bytes); symlinkSync(outside, join(root, 'inputs', 'escape.png'));
  const escaped = runGraph(graph([{ id: 'load', type: 'load_rgba', params: { path: 'inputs/escape.png', sha256: sha256(source.bytes) } }]), { repoRoot: root, outputDir });
  assert.equal(escaped.reason, 'unsafe_path'); assert.equal(escaped.failed_node, 'load');
});

test('numeric success never grants visual approval and unbound curation stays PENDING', () => {
  const { root, outputDir } = fixture();
  const source = putPng(root, 'curate', 1, 1, [1,2,3,255]);
  const receipt = runGraph(graph([
    load('load', source.path, source.bytes),
    { id: 'emit', type: 'emit_artifact', inputs: { value: ref('load', 'image') }, params: { path: 'candidate.png' } },
    { id: 'curate', type: 'curation_checkpoint', inputs: { artifacts: [ref('emit', 'artifact')] } },
  ]), { repoRoot: root, outputDir });
  assert.equal(receipt.status, 'PENDING');
  assert.equal(receipt.visual_approval, 'NOT_GRANTED');
  assert.equal(receipt.nodes.at(-1).reason, 'no_bound_user_feedback_record');
});
