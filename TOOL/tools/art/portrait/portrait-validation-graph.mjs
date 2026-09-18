#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodePng, encodePng, sourceOver } from './portrait-layer-composite.mjs';
import { checkAttachmentBoundary, parseRigDocument, rasterizeBezierRig } from './portrait-bezier-mask.mjs';

const NODE_TYPES = Object.freeze({
  load_rgba: { inputs: {}, outputs: { image: 'rgba' } },
  normalize_alpha_zero_rgb: { inputs: { image: 'rgba' }, outputs: { image: 'rgba' } },
  alpha_mask: { inputs: { image: 'rgba' }, outputs: { mask: 'mask' } },
  bundle_union: { inputs: { masks: 'mask[]' }, outputs: { mask: 'mask' } },
  bezier_mask: { inputs: {}, outputs: { inside: 'mask', seam_band: 'mask', overlay: 'rgba' } },
  attachment_boundary_check: { inputs: { bundle: 'mask', inside: 'mask', seam_band: 'mask' }, outputs: { gaps: 'mask', outside: 'mask', missing: 'mask' } },
  garment_boundary_check: { inputs: { bundle: 'mask', inside: 'mask', seam_band: 'mask' }, outputs: { gaps: 'mask', outside: 'mask', missing: 'mask' } },
  ownership_outside: { inputs: { candidate: 'mask', owner: 'mask' }, outputs: { mask: 'mask' } },
  overlap: { inputs: { a: 'mask', b: 'mask' }, outputs: { mask: 'mask' } },
  holes: { inputs: { mask: 'mask' }, outputs: { mask: 'mask' } },
  connected_fragments: { inputs: { mask: 'mask' }, outputs: { mask: 'mask' } },
  seam_band: { inputs: { a: 'mask', b: 'mask' }, outputs: { mask: 'mask' } },
  occlusion_visible: { inputs: { target: 'mask', occluders: 'mask[]' }, outputs: { mask: 'mask' } },
  palette_extract: { inputs: { image: 'rgba' }, optional: { mask: 'mask' }, outputs: { palette: 'palette' } },
  lut_preview: { inputs: { image: 'rgba', palette: 'palette' }, outputs: { image: 'rgba' } },
  composite_source_over: { inputs: { images: 'rgba[]' }, outputs: { image: 'rgba' } },
  emit_artifact: { inputs: { value: 'image' }, outputs: { artifact: 'artifact' } },
  curation_checkpoint: { inputs: { artifacts: 'artifact[]' }, outputs: { checkpoint: 'checkpoint' } },
});

export class GraphError extends Error {
  constructor(code, message, nodeId) {
    super(message);
    this.name = 'GraphError';
    this.code = code;
    this.nodeId = nodeId;
  }
}

function fail(code, message, nodeId) {
  throw new GraphError(code, message, nodeId);
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function isSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

function referenceList(value) {
  return Array.isArray(value) ? value : [value];
}

function validateReference(ref, nodeId, port) {
  if (!ref || typeof ref !== 'object' || typeof ref.node !== 'string' || typeof ref.output !== 'string') {
    fail('invalid_reference', `node ${nodeId} input ${port} must reference {node, output}`, nodeId);
  }
}

export function validateGraph(graph) {
  if (!graph || graph.schema_version !== 1 || !Array.isArray(graph.nodes)) {
    fail('invalid_graph', 'graph must have schema_version 1 and a nodes array');
  }
  const byId = new Map();
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(node.id)) {
      fail('invalid_node_id', 'node id must be a lowercase portable identifier', node?.id);
    }
    if (byId.has(node.id)) fail('duplicate_node', `duplicate node id ${node.id}`, node.id);
    if (!NODE_TYPES[node.type]) fail('unknown_node_type', `node ${node.id} has unknown type ${node.type}`, node.id);
    byId.set(node.id, node);
  }

  const dependencies = new Map(graph.nodes.map((node) => [node.id, new Set()]));
  for (const node of graph.nodes) {
    const spec = NODE_TYPES[node.type];
    const inputs = node.inputs || {};
    for (const [port, expected] of Object.entries(spec.inputs)) {
      if (!(port in inputs)) fail('missing_typed_input', `node ${node.id} is missing ${port}:${expected}`, node.id);
    }
    for (const [port, raw] of Object.entries(inputs)) {
      const expected = spec.inputs[port] || spec.optional?.[port];
      if (!expected) fail('unknown_input', `node ${node.id} has unknown input ${port}`, node.id);
      const expectsList = expected.endsWith('[]');
      if (expectsList && (!Array.isArray(raw) || raw.length === 0)) {
        fail('missing_typed_input', `node ${node.id} input ${port} requires a non-empty ${expected}`, node.id);
      }
      if (!expectsList && Array.isArray(raw)) fail('input_cardinality', `node ${node.id} input ${port} is singular`, node.id);
      for (const ref of referenceList(raw)) {
        validateReference(ref, node.id, port);
        const source = byId.get(ref.node);
        if (!source) fail('missing_input_node', `node ${node.id} references missing node ${ref.node}`, node.id);
        const actual = NODE_TYPES[source.type].outputs[ref.output];
        if (!actual) fail('missing_output', `node ${node.id} references missing output ${ref.node}.${ref.output}`, node.id);
        const wanted = expectsList ? expected.slice(0, -2) : expected;
        if (wanted !== 'image' && actual !== wanted) {
          fail('input_type_mismatch', `node ${node.id} input ${port} needs ${wanted}, got ${actual} from ${ref.node}.${ref.output}`, node.id);
        }
        if (wanted === 'image' && !['rgba', 'mask'].includes(actual)) {
          fail('input_type_mismatch', `node ${node.id} input ${port} needs image, got ${actual}`, node.id);
        }
        dependencies.get(node.id).add(ref.node);
      }
    }
  }

  const order = [];
  const state = new Map();
  function visit(id) {
    if (state.get(id) === 1) fail('dag_cycle', `graph contains a cycle at ${id}`, id);
    if (state.get(id) === 2) return;
    state.set(id, 1);
    for (const dependency of dependencies.get(id)) visit(dependency);
    state.set(id, 2);
    order.push(id);
  }
  for (const node of graph.nodes) visit(node.id);
  return { order, graphSha256: sha256(stable(graph)) };
}

function confinedFile(root, requested, expectedHash, nodeId, label = 'input') {
  if (typeof requested !== 'string' || requested.length === 0 || isAbsolute(requested)) {
    fail('unsafe_path', `${label} path must be a non-empty repository-relative path`, nodeId);
  }
  const lexical = resolve(root, requested);
  const rel = relative(root, lexical);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail('unsafe_path', `${label} path escapes repository root`, nodeId);
  if (!existsSync(lexical)) fail('missing_file', `${label} file does not exist: ${requested}`, nodeId);
  const actual = realpathSync(lexical);
  const actualRel = relative(realpathSync(root), actual);
  if (actualRel === '..' || actualRel.startsWith(`..${sep}`) || isAbsolute(actualRel)) {
    fail('unsafe_path', `${label} symlink escapes repository root`, nodeId);
  }
  if (!isSha256(expectedHash)) fail('missing_hash', `${label} requires a lowercase sha256`, nodeId);
  const bytes = readFileSync(actual);
  const digest = sha256(bytes);
  if (digest !== expectedHash) fail('hash_mismatch', `${label} hash mismatch for ${requested}`, nodeId);
  return { bytes, path: requested, sha256: digest };
}

function sameSize(values, nodeId) {
  const first = values[0];
  for (const value of values.slice(1)) {
    if (value.width !== first.width || value.height !== first.height) fail('size_mismatch', 'image dimensions differ', nodeId);
  }
}

function makeMask(width, height, data) {
  return { kind: 'mask', width, height, data };
}

function countMask(mask) {
  let count = 0;
  for (const value of mask.data) count += value ? 1 : 0;
  return count;
}

function maskPng(mask, color = [255, 255, 255]) {
  const pixels = new Uint8Array(mask.width * mask.height * 4);
  for (let p = 0; p < mask.data.length; p += 1) {
    const i = p * 4;
    pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = mask.data[p] ? 255 : 0;
  }
  return encodePng(mask.width, mask.height, pixels);
}

function imagePng(image) {
  return encodePng(image.width, image.height, image.pixels);
}

function metricStatus(value, params = {}) {
  if (Number.isFinite(params.max) && value > params.max) return 'FAIL';
  if (Number.isFinite(params.min) && value < params.min) return 'FAIL';
  return 'PASS';
}

function neighbors(index, width, height) {
  const x = index % width; const y = Math.floor(index / width); const out = [];
  if (x > 0) out.push(index - 1); if (x + 1 < width) out.push(index + 1);
  if (y > 0) out.push(index - width); if (y + 1 < height) out.push(index + width);
  return out;
}

function components(mask, foreground = true) {
  const seen = new Uint8Array(mask.data.length); const result = [];
  for (let start = 0; start < mask.data.length; start += 1) {
    if (seen[start] || Boolean(mask.data[start]) !== foreground) continue;
    const queue = [start]; seen[start] = 1; const pixels = []; let border = false;
    for (let q = 0; q < queue.length; q += 1) {
      const index = queue[q]; pixels.push(index);
      const x = index % mask.width; const y = Math.floor(index / mask.width);
      if (x === 0 || y === 0 || x === mask.width - 1 || y === mask.height - 1) border = true;
      for (const next of neighbors(index, mask.width, mask.height)) {
        if (!seen[next] && Boolean(mask.data[next]) === foreground) { seen[next] = 1; queue.push(next); }
      }
    }
    result.push({ pixels, border });
  }
  return result;
}

function dilate(mask, radius) {
  let data = Uint8Array.from(mask.data);
  for (let step = 0; step < radius; step += 1) {
    const next = Uint8Array.from(data);
    for (let i = 0; i < data.length; i += 1) if (data[i]) for (const n of neighbors(i, mask.width, mask.height)) next[n] = 1;
    data = next;
  }
  return makeMask(mask.width, mask.height, data);
}

function boundary(mask) {
  const data = new Uint8Array(mask.data.length);
  for (let i = 0; i < mask.data.length; i += 1) {
    if (!mask.data[i]) continue;
    if (neighbors(i, mask.width, mask.height).some((n) => !mask.data[n])) data[i] = 1;
  }
  return makeMask(mask.width, mask.height, data);
}

function outputValue(outputs, ref) {
  return outputs.get(ref.node)[ref.output];
}

function resolveInput(outputs, raw) {
  return Array.isArray(raw) ? raw.map((ref) => outputValue(outputs, ref)) : outputValue(outputs, raw);
}

function artifactName(value) {
  return value.kind === 'mask' ? 'mask' : 'rgba';
}

function safeArtifactPath(outputDir, requested, nodeId) {
  if (typeof requested !== 'string' || !requested.endsWith('.png') || isAbsolute(requested)) fail('unsafe_artifact_path', 'artifact path must be a relative .png path', nodeId);
  const target = resolve(outputDir, requested); const rel = relative(outputDir, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) fail('unsafe_artifact_path', 'artifact path escapes output directory', nodeId);
  return target;
}

function executeNode(node, inputs, context) {
  const params = node.params || {};
  if (node.type === 'load_rgba') {
    const file = confinedFile(context.repoRoot, params.path, params.sha256, node.id);
    let decoded; try { decoded = decodePng(file.bytes); } catch (error) { fail('invalid_png', error.message, node.id); }
    return { outputs: { image: { kind: 'rgba', ...decoded } }, metrics: { width: decoded.width, height: decoded.height, sha256: file.sha256 }, status: 'PASS' };
  }
  if (node.type === 'normalize_alpha_zero_rgb') {
    const image = inputs.image; const pixels = Uint8Array.from(image.pixels); let changed = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] === 0 && (pixels[i] || pixels[i + 1] || pixels[i + 2])) { pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; changed += 1; }
    return { outputs: { image: { kind: 'rgba', width: image.width, height: image.height, pixels } }, metrics: { normalized_pixels: changed }, status: 'PASS' };
  }
  if (node.type === 'alpha_mask') {
    const threshold = params.threshold ?? 1; if (!Number.isInteger(threshold) || threshold < 0 || threshold > 255) fail('invalid_parameter', 'alpha threshold must be 0..255', node.id);
    const data = new Uint8Array(inputs.image.width * inputs.image.height);
    for (let p = 0; p < data.length; p += 1) data[p] = inputs.image.pixels[p * 4 + 3] >= threshold ? 1 : 0;
    const mask = makeMask(inputs.image.width, inputs.image.height, data); const count = countMask(mask);
    return { outputs: { mask }, metrics: { opaque_pixels: count, total_pixels: data.length, threshold }, status: metricStatus(count, params) };
  }
  if (node.type === 'bundle_union') {
    sameSize(inputs.masks, node.id); const data = new Uint8Array(inputs.masks[0].data.length);
    for (const mask of inputs.masks) for (let i = 0; i < data.length; i += 1) data[i] ||= mask.data[i];
    const mask = makeMask(inputs.masks[0].width, inputs.masks[0].height, data); const count = countMask(mask);
    return { outputs: { mask }, metrics: { union_pixels: count, bundle_size: inputs.masks.length }, status: metricStatus(count, params) };
  }
  if (node.type === 'bezier_mask') {
    const file = confinedFile(context.repoRoot, params.path, params.sha256, node.id, 'rig'); let document;
    try { document = parseRigDocument(file.bytes); } catch (error) { fail(error.code || 'invalid_rig', error.message, node.id); }
    let raster;
    try { raster = rasterizeBezierRig(document, params.rig_id, { supersample: params.supersample, curveSteps: params.curve_steps, seamWidth: params.seam_band_width_px }); } catch (error) { fail(error.code || 'invalid_rig', error.message, node.id); }
    return { outputs: { inside: makeMask(raster.width, raster.height, raster.inside), seam_band: makeMask(raster.width, raster.height, raster.seamBand), overlay: { kind: 'rgba', width: raster.width, height: raster.height, pixels: raster.overlay } }, metrics: { ...raster.metrics, rig_sha256: file.sha256 }, status: 'PASS' };
  }
  if (node.type === 'attachment_boundary_check' || node.type === 'garment_boundary_check') {
    sameSize([inputs.bundle, inputs.inside, inputs.seam_band], node.id); let checked;
    try { checked = checkAttachmentBoundary({ inside: inputs.inside.data, seamBand: inputs.seam_band.data, bundle: inputs.bundle.data, width: inputs.bundle.width, height: inputs.bundle.height, outsideAllowancePx: params.outside_allowance_px ?? 0, allowedGapPixels: params.allowed_gap_pixels ?? 0 }); } catch (error) { fail(error.code || 'invalid_boundary_check', error.message, node.id); }
    const metrics = checked.metrics; const limits = { missing_inside_pixels: params.max_missing_inside_pixels, outside_allowance_pixels: params.max_outside_allowance_pixels, seam_gap_components: params.max_gap_components, max_gap_width: params.max_gap_width, missing_contact_pixels: params.max_missing_contact_pixels };
    const configured = Object.values(limits).some(Number.isFinite); let status = configured ? 'PASS' : 'PENDING';
    for (const [metric, limit] of Object.entries(limits)) if (Number.isFinite(limit) && metrics[metric] > limit) status = 'FAIL';
    return { outputs: { gaps: makeMask(inputs.bundle.width, inputs.bundle.height, checked.gaps), outside: makeMask(inputs.bundle.width, inputs.bundle.height, checked.outside), missing: makeMask(inputs.bundle.width, inputs.bundle.height, checked.missing) }, metrics, status, ...(configured ? {} : { reason: 'attachment_thresholds_not_configured' }) };
  }
  if (node.type === 'ownership_outside' || node.type === 'overlap') {
    const values = node.type === 'ownership_outside' ? [inputs.candidate, inputs.owner] : [inputs.a, inputs.b]; sameSize(values, node.id);
    const data = new Uint8Array(values[0].data.length);
    for (let i = 0; i < data.length; i += 1) data[i] = node.type === 'ownership_outside' ? (values[0].data[i] && !values[1].data[i] ? 1 : 0) : (values[0].data[i] && values[1].data[i] ? 1 : 0);
    const mask = makeMask(values[0].width, values[0].height, data); const count = countMask(mask);
    return { outputs: { mask }, metrics: { pixels: count }, status: metricStatus(count, params) };
  }
  if (node.type === 'holes') {
    const found = components(inputs.mask, false).filter((component) => !component.border); const data = new Uint8Array(inputs.mask.data.length);
    for (const component of found) for (const p of component.pixels) data[p] = 1;
    const count = found.reduce((sum, item) => sum + item.pixels.length, 0);
    return { outputs: { mask: makeMask(inputs.mask.width, inputs.mask.height, data) }, metrics: { hole_count: found.length, hole_pixels: count }, status: metricStatus(count, params) };
  }
  if (node.type === 'connected_fragments') {
    const found = components(inputs.mask, true).sort((a, b) => b.pixels.length - a.pixels.length); const minimum = params.min_fragment_pixels ?? 1; const fragments = found.filter((item, index) => index > 0 && item.pixels.length >= minimum); const data = new Uint8Array(inputs.mask.data.length);
    for (const item of fragments) for (const p of item.pixels) data[p] = 1;
    return { outputs: { mask: makeMask(inputs.mask.width, inputs.mask.height, data) }, metrics: { component_count: found.length, fragment_count: fragments.length, fragment_pixels: countMask(makeMask(inputs.mask.width, inputs.mask.height, data)) }, status: metricStatus(fragments.length, params) };
  }
  if (node.type === 'seam_band') {
    sameSize([inputs.a, inputs.b], node.id); const radius = params.radius ?? 1; if (!Number.isInteger(radius) || radius < 0 || radius > 64) fail('invalid_parameter', 'seam radius must be 0..64', node.id);
    const da = dilate(boundary(inputs.a), radius); const db = dilate(boundary(inputs.b), radius); const data = new Uint8Array(da.data.length);
    for (let i = 0; i < data.length; i += 1) data[i] = da.data[i] && db.data[i] ? 1 : 0;
    const mask = makeMask(da.width, da.height, data); const count = countMask(mask);
    return { outputs: { mask }, metrics: { seam_band_pixels: count, radius }, status: metricStatus(count, params) };
  }
  if (node.type === 'occlusion_visible') {
    sameSize([inputs.target, ...inputs.occluders], node.id); const data = Uint8Array.from(inputs.target.data);
    for (const mask of inputs.occluders) for (let i = 0; i < data.length; i += 1) if (mask.data[i]) data[i] = 0;
    const mask = makeMask(inputs.target.width, inputs.target.height, data); const count = countMask(mask);
    return { outputs: { mask }, metrics: { visible_pixels: count, target_pixels: countMask(inputs.target) }, status: metricStatus(count, params) };
  }
  if (node.type === 'palette_extract') {
    const limit = params.colors ?? 8; if (!Number.isInteger(limit) || limit < 1 || limit > 256) fail('invalid_parameter', 'palette colors must be 1..256', node.id);
    if (inputs.mask) sameSize([inputs.image, inputs.mask], node.id); const counts = new Map();
    for (let p = 0; p < inputs.image.width * inputs.image.height; p += 1) {
      const i = p * 4; if (inputs.image.pixels[i + 3] === 0 || (inputs.mask && !inputs.mask.data[p])) continue;
      const key = `${inputs.image.pixels[i]},${inputs.image.pixels[i + 1]},${inputs.image.pixels[i + 2]}`; counts.set(key, (counts.get(key) || 0) + 1);
    }
    const colors = [...counts].map(([key, count]) => ({ rgb: key.split(',').map(Number), count })).sort((a, b) => b.count - a.count || a.rgb[0] - b.rgb[0] || a.rgb[1] - b.rgb[1] || a.rgb[2] - b.rgb[2]).slice(0, limit);
    if (colors.length === 0) fail('empty_palette', 'palette extraction found no visible pixels', node.id);
    return { outputs: { palette: { kind: 'palette', colors } }, metrics: { color_count: colors.length, sampled_pixels: colors.reduce((sum, color) => sum + color.count, 0) }, status: 'PASS' };
  }
  if (node.type === 'lut_preview') {
    const pixels = Uint8Array.from(inputs.image.pixels); const colors = inputs.palette.colors;
    for (let i = 0; i < pixels.length; i += 4) {
      if (!pixels[i + 3]) continue; let best = colors[0].rgb; let bestDistance = Infinity;
      for (const color of colors) { const dr = pixels[i] - color.rgb[0]; const dg = pixels[i + 1] - color.rgb[1]; const db = pixels[i + 2] - color.rgb[2]; const distance = dr * dr + dg * dg + db * db; if (distance < bestDistance) { bestDistance = distance; best = color.rgb; } }
      pixels[i] = best[0]; pixels[i + 1] = best[1]; pixels[i + 2] = best[2];
    }
    const image = { kind: 'rgba', width: inputs.image.width, height: inputs.image.height, pixels }; const png = imagePng(image);
    return { outputs: { image }, metrics: { palette_colors: colors.length, preview_sha256: sha256(png), implementation: 'cpu-nearest-rgb-v1' }, status: 'PASS' };
  }
  if (node.type === 'composite_source_over') {
    sameSize(inputs.images, node.id); const pixels = new Uint8Array(inputs.images[0].pixels.length);
    for (const image of inputs.images) sourceOver(pixels, image.pixels);
    const image = { kind: 'rgba', width: inputs.images[0].width, height: inputs.images[0].height, pixels };
    return { outputs: { image }, metrics: { layer_count: inputs.images.length, rgba_sha256: sha256(Buffer.from(pixels)) }, status: 'PASS' };
  }
  if (node.type === 'emit_artifact') {
    const target = safeArtifactPath(context.outputDir, params.path, node.id); mkdirSync(dirname(target), { recursive: true }); const png = inputs.value.kind === 'mask' ? maskPng(inputs.value, params.color) : imagePng(inputs.value); writeFileSync(target, png);
    const artifact = { kind: 'artifact', path: relative(context.outputDir, target), sha256: sha256(png), media_type: 'image/png', value_type: artifactName(inputs.value) };
    return { outputs: { artifact }, metrics: { bytes: png.length, sha256: artifact.sha256 }, artifacts: [artifact], status: 'PASS' };
  }
  if (node.type === 'curation_checkpoint') {
    const hashes = inputs.artifacts.map((item) => item.sha256).sort();
    if (!params.feedback) return { outputs: { checkpoint: { kind: 'checkpoint', decision: 'PENDING' } }, metrics: { bound_artifacts: hashes.length }, status: 'PENDING', reason: 'no_bound_user_feedback_record' };
    const file = confinedFile(context.repoRoot, params.feedback.path, params.feedback.sha256, node.id, 'feedback'); let record;
    try { record = JSON.parse(file.bytes.toString('utf8')); } catch { fail('invalid_feedback', 'feedback record must be JSON', node.id); }
    if (record.node_id !== node.id || !['APPROVED', 'REJECTED'].includes(record.decision) || typeof record.reviewer !== 'string' || record.reviewer.length === 0 || stable([...record.artifact_sha256 || []].sort()) !== stable(hashes)) {
      fail('feedback_binding_mismatch', 'feedback must bind node id, reviewer, decision, and exact artifact hashes', node.id);
    }
    return { outputs: { checkpoint: { kind: 'checkpoint', decision: record.decision } }, metrics: { bound_artifacts: hashes.length, feedback_sha256: file.sha256, reviewer: record.reviewer }, status: record.decision };
  }
  fail('unknown_node_type', `cannot execute ${node.type}`, node.id);
}

export function runGraph(graph, options = {}) {
  const requestedRoot = resolve(options.repoRoot || process.cwd());
  const repoRoot = realpathSync(requestedRoot);
  const requestedOutput = resolve(options.outputDir || join(requestedRoot, '.omo/evidence/portrait-validation-graph'));
  const requestedRel = relative(requestedRoot, requestedOutput);
  if (requestedRel === '..' || requestedRel.startsWith(`..${sep}`) || isAbsolute(requestedRel)) fail('unsafe_output_dir', 'output directory must stay inside repository');
  const outputDir = resolve(repoRoot, requestedRel);
  mkdirSync(outputDir, { recursive: true });
  const realOutputDir = realpathSync(outputDir);
  const realOutputRel = relative(repoRoot, realOutputDir);
  if (realOutputRel === '..' || realOutputRel.startsWith(`..${sep}`) || isAbsolute(realOutputRel)) fail('unsafe_output_dir', 'output directory symlink escapes repository');
  const validation = validateGraph(graph); const byId = new Map(graph.nodes.map((node) => [node.id, node])); const outputs = new Map(); const results = [];
  try {
    for (const id of validation.order) {
      const node = byId.get(id); const inputs = {}; for (const [port, raw] of Object.entries(node.inputs || {})) inputs[port] = resolveInput(outputs, raw);
      const result = executeNode(node, inputs, { repoRoot, outputDir: realOutputDir }); outputs.set(id, result.outputs);
      results.push({ id, type: node.type, status: result.status, metrics: result.metrics || {}, ...(result.reason ? { reason: result.reason } : {}), ...(result.artifacts ? { artifacts: result.artifacts } : {}) });
      if (result.status === 'FAIL') fail('metric_threshold_failed', `numeric threshold failed at ${id}`, id);
      if (result.status === 'REJECTED') fail('curation_rejected', `curation rejected at ${id}`, id);
    }
    const checkpoints = results.filter((item) => item.type === 'curation_checkpoint');
    return { schema_version: 1, graph_sha256: validation.graphSha256, status: results.some((item) => item.status === 'PENDING') ? 'PENDING' : 'PASS', visual_approval: checkpoints.length > 0 && checkpoints.every((item) => item.status === 'APPROVED') ? 'APPROVED' : 'NOT_GRANTED', nodes: results };
  } catch (error) {
    if (!(error instanceof GraphError)) throw error;
    return { schema_version: 1, graph_sha256: validation.graphSha256, status: 'FAIL', visual_approval: 'NOT_GRANTED', failed_node: error.nodeId || null, reason: error.code, message: error.message, nodes: results };
  }
}

function argValue(args, flag) { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; }
function main() {
  const args = process.argv.slice(2); if (args[0] !== 'run') { process.stderr.write('usage: node Tool/art/portrait/portrait-validation-graph.mjs run --graph <graph.json> --out <directory> [--receipt <receipt.json>]\n'); process.exitCode = 2; return; }
  const graphPath = argValue(args, '--graph'); const out = argValue(args, '--out'); const receiptArg = argValue(args, '--receipt');
  if (!graphPath || !out) { process.stderr.write('missing --graph or --out\n'); process.exitCode = 2; return; }
  let receipt;
  try { receipt = runGraph(JSON.parse(readFileSync(graphPath, 'utf8')), { repoRoot: process.cwd(), outputDir: out }); }
  catch (error) { receipt = { schema_version: 1, status: 'FAIL', visual_approval: 'NOT_GRANTED', failed_node: error.nodeId || null, reason: error.code || 'runner_error', message: error.message, nodes: [] }; }
  const text = `${JSON.stringify(receipt, null, 2)}\n`; if (receiptArg) { const target = resolve(receiptArg); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, text); } process.stdout.write(text); if (receipt.status === 'FAIL') process.exitCode = 1;
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main();
