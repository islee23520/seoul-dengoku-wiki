import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { checkAttachmentBoundary, parseRigDocument, rasterizeBezierRig, validateRigDocument } from './portrait-bezier-mask.mjs';
import { encodePng } from './portrait-layer-composite.mjs';
import { runGraph } from './portrait-validation-graph.mjs';

const rigBytes = readFileSync(new URL('./portrait-attachment-rigs.json', import.meta.url));
const rigs = parseRigDocument(rigBytes);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const ref = (node, output) => ({ node, output });

function rgbaMask(data) {
  const pixels = new Uint8Array(data.length * 4);
  for (let index = 0; index < data.length; index += 1) pixels[index * 4 + 3] = data[index] ? 255 : 0;
  return encodePng(1145, 1374, pixels);
}

test('cubic attachment raster is byte deterministic for every rig kind', () => {
  const hashes = {};
  for (const id of ['female-clothes-default', 'male-hair-default', 'male-beard-default']) {
    const first = rasterizeBezierRig(rigs, id, { supersample: 2, curveSteps: 16 });
    const second = rasterizeBezierRig(rigs, id, { supersample: 2, curveSteps: 16 });
    assert.deepEqual(second.inside, first.inside);
    assert.deepEqual(second.seamBand, first.seamBand);
    assert.deepEqual(second.overlay, first.overlay);
    hashes[id] = sha256(Buffer.concat([Buffer.from(first.inside), Buffer.from(first.seamBand), Buffer.from(first.overlay)]));
  }
  assert.deepEqual(hashes, {
    'female-clothes-default': '5ec3fe603cbd13e0e42e18b3efdcb38845daf5a4c4ed6ca682f636d7c27a3cbd',
    'male-hair-default': 'aa37517c1f93c85a3a48c12fd45799e5ebf1af1892854cdd1c196003af91d1f6',
    'male-beard-default': '9dd3c6b1671947d10001dcc337e862e70a7a5fcfc2ca5075937a817fe7441292',
  });
});

test('rig validation fails closed on malformed curves, open paths, range errors, wrong canvas, and duplicate ids', () => {
  const base = structuredClone(rigs);
  for (const [mutate, code] of [
    [(document) => { delete document.rigs[0].contours[0].segments[0].c1; }, 'invalid_curve'],
    [(document) => { document.rigs[0].contours[0].closed = false; }, 'open_contour'],
    [(document) => { document.rigs[0].contours[0].segments[0].c1[0] = Number.NaN; }, 'invalid_rig_coordinate'],
    [(document) => { document.rigs[0].contours[0].segments[0].c1[0] = 1.1; }, 'rig_coordinate_out_of_range'],
    [(document) => { document.canvas.width = 1144; }, 'wrong_rig_canvas'],
    [(document) => { document.rigs[1].id = document.rigs[0].id; }, 'duplicate_rig_id'],
  ]) {
    const document = structuredClone(base); mutate(document);
    assert.throws(() => validateRigDocument(document), (error) => error.code === code);
  }
});

test('boundary metrics use the physical bundle union and tolerate configured tiny gaps', () => {
  const raster = rasterizeBezierRig(rigs, 'female-clothes-default', { supersample: 2, curveSteps: 16 });
  const back = new Uint8Array(raster.inside.length); const primary = new Uint8Array(raster.inside.length); const front = new Uint8Array(raster.inside.length);
  for (let index = 0; index < raster.inside.length; index += 1) if (raster.inside[index]) (index % 3 === 0 ? back : index % 3 === 1 ? primary : front)[index] = 1;
  const union = Uint8Array.from(back, (value, index) => value || primary[index] || front[index] ? 1 : 0);
  const full = checkAttachmentBoundary({ inside: raster.inside, seamBand: raster.seamBand, bundle: union, width: raster.width, height: raster.height });
  assert.equal(full.metrics.missing_inside_pixels, 0); assert.equal(full.metrics.missing_contact_pixels, 0); assert.ok(full.metrics.contact_pixels > 0);
  const gapIndex = raster.seamBand.findIndex((value, index) => value && union[index]);
  union[gapIndex] = 0;
  const allowed = checkAttachmentBoundary({ inside: raster.inside, seamBand: raster.seamBand, bundle: union, width: raster.width, height: raster.height, allowedGapPixels: 1 });
  assert.equal(allowed.metrics.missing_contact_pixels, 1); assert.equal(allowed.metrics.seam_gap_components, 0); assert.equal(allowed.metrics.max_gap_width, 0);
});

test('graph binds rig hash, unions physical members, and emits typed guide artifacts', () => {
  const root = mkdtempSync(join(tmpdir(), 'portrait-attachment-')); const outputDir = join(root, 'evidence'); mkdirSync(join(root, 'inputs')); mkdirSync(outputDir);
  writeFileSync(join(root, 'inputs/rigs.json'), rigBytes);
  const raster = rasterizeBezierRig(rigs, 'female-clothes-default', { supersample: 2, curveSteps: 16 });
  const members = [new Uint8Array(raster.inside.length), new Uint8Array(raster.inside.length), new Uint8Array(raster.inside.length)];
  for (let index = 0; index < raster.inside.length; index += 1) if (raster.inside[index]) members[index % 3][index] = 1;
  const loads = members.map((data, index) => { const bytes = rgbaMask(data); const path = `inputs/member-${index}.png`; writeFileSync(join(root, path), bytes); return { id: `load${index}`, type: 'load_rgba', params: { path, sha256: sha256(bytes) } }; });
  const graph = { schema_version: 1, nodes: [
    ...loads,
    ...members.map((_, index) => ({ id: `mask${index}`, type: 'alpha_mask', inputs: { image: ref(`load${index}`, 'image') } })),
    { id: 'union', type: 'bundle_union', inputs: { masks: members.map((_, index) => ref(`mask${index}`, 'mask')) } },
    { id: 'rig', type: 'bezier_mask', params: { path: 'inputs/rigs.json', sha256: sha256(rigBytes), rig_id: 'female-clothes-default', supersample: 2, curve_steps: 16 } },
    { id: 'check', type: 'attachment_boundary_check', inputs: { bundle: ref('union', 'mask'), inside: ref('rig', 'inside'), seam_band: ref('rig', 'seam_band') }, params: { max_missing_inside_pixels: 0, max_missing_contact_pixels: 0 } },
    { id: 'guide', type: 'emit_artifact', inputs: { value: ref('rig', 'overlay') }, params: { path: 'guide.png' } },
  ] };
  const receipt = runGraph(graph, { repoRoot: root, outputDir });
  assert.equal(receipt.status, 'PASS'); assert.equal(receipt.visual_approval, 'NOT_GRANTED');
  assert.equal(receipt.nodes.find((node) => node.id === 'check').metrics.missing_inside_pixels, 0);
  assert.equal(receipt.nodes.find((node) => node.id === 'guide').artifacts[0].value_type, 'rgba');
  const drifted = structuredClone(graph); drifted.nodes.find((node) => node.id === 'rig').params.sha256 = '0'.repeat(64);
  assert.equal(runGraph(drifted, { repoRoot: root, outputDir }).reason, 'hash_mismatch');
});

test('attachment checks without thresholds remain PENDING instead of vacuous PASS', t => {
  const root = mkdtempSync(join(tmpdir(), 'portrait-unconfigured-thresholds-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outputDir = join(root, 'output');
  mkdirSync(outputDir);
  writeFileSync(join(root, 'rigs.json'), rigBytes);
  const raster = rasterizeBezierRig(rigs, 'female-clothes-default', { supersample: 2, curveSteps: 16 });
  const pixels = rgbaMask(raster.inside);
  writeFileSync(join(root, 'part.png'), pixels);
  const graph = { schema_version: 1, nodes: [
    { id: 'part', type: 'load_rgba', params: { path: 'part.png', sha256: sha256(pixels) } },
    { id: 'mask', type: 'alpha_mask', inputs: { image: ref('part', 'image') } },
    { id: 'rig', type: 'bezier_mask', params: { path: 'rigs.json', sha256: sha256(rigBytes), rig_id: 'female-clothes-default', supersample: 2, curve_steps: 16 } },
    { id: 'check', type: 'attachment_boundary_check', inputs: { bundle: ref('mask', 'mask'), inside: ref('rig', 'inside'), seam_band: ref('rig', 'seam_band') } },
  ] };
  const receipt = runGraph(graph, { repoRoot: root, outputDir });
  assert.equal(receipt.status, 'PENDING');
  assert.equal(receipt.nodes.filter(node => node.type === 'attachment_boundary_check').length, 1);
  assert.ok(receipt.nodes.filter(node => node.type === 'attachment_boundary_check').every(node => node.status === 'PENDING'));
});
