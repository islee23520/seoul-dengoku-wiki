import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const PORTRAIT_CANVAS = Object.freeze({ width: 1145, height: 1374 });

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function rigError(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function point(value, label) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) rigError('invalid_rig_coordinate', `${label} must be a finite [x,y] coordinate`);
  if (value.some((coordinate) => coordinate < 0 || coordinate > 1)) rigError('rig_coordinate_out_of_range', `${label} must be normalized to 0..1`);
  return value;
}

export function validateRigDocument(document) {
  if (!document || document.schema_version !== 1 || !document.canvas || document.canvas.width !== PORTRAIT_CANVAS.width || document.canvas.height !== PORTRAIT_CANVAS.height) {
    rigError('wrong_rig_canvas', `garment rigs must target ${PORTRAIT_CANVAS.width}x${PORTRAIT_CANVAS.height}`);
  }
  if (!Array.isArray(document.rigs) || document.rigs.length === 0) rigError('invalid_rig_document', 'garment rig document must contain rigs');
  const rigIds = new Set();
  for (const rig of document.rigs) {
    if (!rig || typeof rig.id !== 'string' || rig.id.length === 0) rigError('invalid_rig_id', 'garment rig id must be non-empty');
    if (rigIds.has(rig.id)) rigError('duplicate_rig_id', `duplicate garment rig id ${rig.id}`);
    rigIds.add(rig.id);
    if (!Array.isArray(rig.contours) || rig.contours.length === 0) rigError('invalid_rig_contours', `rig ${rig.id} must contain contours`);
    const contourIds = new Set();
    for (const contour of rig.contours) {
      if (!contour || typeof contour.id !== 'string' || contour.id.length === 0) rigError('invalid_contour_id', `rig ${rig.id} has an invalid contour id`);
      if (contourIds.has(contour.id)) rigError('duplicate_contour_id', `duplicate contour id ${contour.id} in ${rig.id}`);
      contourIds.add(contour.id);
      if (contour.closed !== true) rigError('open_contour', `contour ${contour.id} must be closed`);
      if (!Array.isArray(contour.segments) || contour.segments.length === 0) rigError('invalid_curve', `contour ${contour.id} must contain cubic segments`);
      let previousEnd;
      for (let index = 0; index < contour.segments.length; index += 1) {
        const segment = contour.segments[index];
        if (!segment || !Array.isArray(segment.p0) || !Array.isArray(segment.c1) || !Array.isArray(segment.c2) || !Array.isArray(segment.p3)) rigError('invalid_curve', `segment ${index} in ${contour.id} must define p0,c1,c2,p3`);
        const p0 = point(segment.p0, `${contour.id}[${index}].p0`);
        point(segment.c1, `${contour.id}[${index}].c1`); point(segment.c2, `${contour.id}[${index}].c2`);
        const p3 = point(segment.p3, `${contour.id}[${index}].p3`);
        if (previousEnd && (p0[0] !== previousEnd[0] || p0[1] !== previousEnd[1])) rigError('open_contour', `segment ${index} in ${contour.id} does not continue the previous segment`);
        previousEnd = p3;
      }
      const first = contour.segments[0].p0;
      if (previousEnd[0] !== first[0] || previousEnd[1] !== first[1]) rigError('open_contour', `contour ${contour.id} does not close at its first point`);
    }
  }
  return document;
}

export function parseRigDocument(bytes) {
  let document;
  try { document = JSON.parse(Buffer.from(bytes).toString('utf8')); }
  catch { rigError('invalid_rig_json', 'garment rig file must be valid JSON'); }
  return validateRigDocument(document);
}

function fixedPoint(value, width, height, supersample) {
  return [Math.round(value[0] * width * supersample), Math.round(value[1] * height * supersample)];
}

function flattenSegment(segment, width, height, supersample, steps) {
  const points = [segment.p0, segment.c1, segment.c2, segment.p3].map((value) => fixedPoint(value, width, height, supersample));
  const denominator = steps ** 3;
  const flattened = [];
  for (let step = 0; step <= steps; step += 1) {
    const inverse = steps - step;
    const weights = [inverse ** 3, 3 * inverse ** 2 * step, 3 * inverse * step ** 2, step ** 3];
    flattened.push([0, 1].map((axis) => Math.round(weights.reduce((sum, weight, index) => sum + weight * points[index][axis], 0) / denominator)));
  }
  return flattened;
}

function contourPolygon(contour, width, height, supersample, steps) {
  const polygon = [];
  for (const segment of contour.segments) {
    const points = flattenSegment(segment, width, height, supersample, steps);
    polygon.push(...(polygon.length ? points.slice(1) : points));
  }
  return polygon;
}

function ceilDiv(numerator, denominator) {
  return -Math.floor(-numerator / denominator);
}

function rasterizePolygons(polygons, width, height, supersample) {
  const sampleWidth = width * supersample;
  const sampleHeight = height * supersample;
  const coverage = new Uint8Array(width * height);
  const edges = polygons.flatMap((polygon) => polygon.slice(0, -1).map((start, index) => [start, polygon[index + 1]]).filter(([a, b]) => a[1] !== b[1]));
  for (let sampleY = 0; sampleY < sampleHeight; sampleY += 1) {
    const y2 = sampleY * 2 + 1;
    const intersections = [];
    for (const [[x0, y0], [x1, y1]] of edges) {
      if (y2 < Math.min(y0, y1) * 2 || y2 >= Math.max(y0, y1) * 2) continue;
      let denominator = 2 * (y1 - y0);
      let numerator = 2 * x0 * (y1 - y0) + (y2 - 2 * y0) * (x1 - x0);
      if (denominator < 0) { denominator = -denominator; numerator = -numerator; }
      intersections.push({ numerator, denominator });
    }
    intersections.sort((a, b) => a.numerator * b.denominator - b.numerator * a.denominator);
    for (let pair = 0; pair + 1 < intersections.length; pair += 2) {
      const left = intersections[pair]; const right = intersections[pair + 1];
      const start = Math.max(0, ceilDiv(left.numerator - left.denominator, 2 * left.denominator));
      const end = Math.min(sampleWidth - 1, ceilDiv(right.numerator - right.denominator, 2 * right.denominator) - 1);
      const pixelY = Math.floor(sampleY / supersample);
      for (let sampleX = start; sampleX <= end; sampleX += 1) coverage[pixelY * width + Math.floor(sampleX / supersample)] += 1;
    }
  }
  const threshold = Math.ceil(supersample * supersample / 2);
  return Uint8Array.from(coverage, (value) => value >= threshold ? 1 : 0);
}

function neighbors(index, width, height) {
  const x = index % width; const y = Math.floor(index / width); const out = [];
  if (x > 0) out.push(index - 1); if (x + 1 < width) out.push(index + 1);
  if (y > 0) out.push(index - width); if (y + 1 < height) out.push(index + width);
  return out;
}

function boundary(data, width, height) {
  const result = new Uint8Array(data.length);
  for (let index = 0; index < data.length; index += 1) if (data[index] && neighbors(index, width, height).some((next) => !data[next])) result[index] = 1;
  return result;
}

export function dilateMask(data, width, height, radius) {
  let current = Uint8Array.from(data);
  for (let step = 0; step < radius; step += 1) {
    const next = Uint8Array.from(current);
    for (let index = 0; index < current.length; index += 1) if (current[index]) for (const adjacent of neighbors(index, width, height)) next[adjacent] = 1;
    current = next;
  }
  return current;
}

function setPixel(pixels, width, height, x, y, rgba) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = (y * width + x) * 4;
  pixels.set(rgba, offset);
}

function line(pixels, width, height, start, end, rgba) {
  let [x0, y0] = start; const [x1, y1] = end; const dx = Math.abs(x1 - x0); const sx = x0 < x1 ? 1 : -1; const dy = -Math.abs(y1 - y0); const sy = y0 < y1 ? 1 : -1; let error = dx + dy;
  while (true) { setPixel(pixels, width, height, x0, y0, rgba); if (x0 === x1 && y0 === y1) break; const twice = 2 * error; if (twice >= dy) { error += dy; x0 += sx; } if (twice <= dx) { error += dx; y0 += sy; } }
}

function controlOverlay(rig, width, height, polygons, supersample) {
  const pixels = new Uint8Array(width * height * 4);
  for (const contour of rig.contours) for (const segment of contour.segments) {
    const controls = [segment.p0, segment.c1, segment.c2, segment.p3].map((value) => [Math.round(value[0] * (width - 1)), Math.round(value[1] * (height - 1))]);
    line(pixels, width, height, controls[0], controls[1], [64, 192, 255, 180]); line(pixels, width, height, controls[2], controls[3], [64, 192, 255, 180]);
    for (const [x, y] of controls) for (let oy = -3; oy <= 3; oy += 1) for (let ox = -3; ox <= 3; ox += 1) if (ox * ox + oy * oy <= 9) setPixel(pixels, width, height, x + ox, y + oy, [255, 196, 32, 255]);
  }
  for (const polygon of polygons) for (let index = 0; index + 1 < polygon.length; index += 1) {
    const start = polygon[index].map((value) => Math.round(value / supersample)); const end = polygon[index + 1].map((value) => Math.round(value / supersample)); line(pixels, width, height, start, end, [255, 48, 144, 255]);
  }
  return pixels;
}

export function rasterizeBezierRig(document, rigId, options = {}) {
  validateRigDocument(document);
  const rig = document.rigs.find((candidate) => candidate.id === rigId);
  if (!rig) rigError('missing_rig_id', `garment rig ${rigId} was not found`);
  const width = options.width ?? document.canvas.width; const height = options.height ?? document.canvas.height;
  if (width !== document.canvas.width || height !== document.canvas.height) rigError('wrong_rig_canvas', `input canvas ${width}x${height} does not match rig canvas`);
  const supersample = options.supersample ?? 4; const curveSteps = options.curveSteps ?? 32;
  if (!Number.isInteger(supersample) || supersample < 2 || supersample > 8 || !Number.isInteger(curveSteps) || curveSteps < 4 || curveSteps > 256) rigError('invalid_raster_parameter', 'supersample must be 2..8 and curveSteps must be 4..256');
  const polygons = rig.contours.map((contour) => contourPolygon(contour, width, height, supersample, curveSteps));
  const inside = rasterizePolygons(polygons, width, height, supersample);
  const seamWidth = options.seamWidth ?? rig.seam_band_width_px;
  if (!Number.isInteger(seamWidth) || seamWidth < 1 || seamWidth > 128) rigError('invalid_seam_width', 'seam band width must be an integer from 1..128 pixels');
  const expandedBoundary = dilateMask(boundary(inside, width, height), width, height, seamWidth);
  const seamBand = Uint8Array.from(expandedBoundary, (value, index) => value && inside[index] ? 1 : 0);
  return {
    width, height, inside, seamBand,
    overlay: controlOverlay(rig, width, height, polygons, supersample),
    metrics: { rig_id: rig.id, supersample, curve_steps: curveSteps, seam_band_width_px: seamWidth, inside_pixels: inside.reduce((sum, value) => sum + value, 0), raster_sha256: sha256(Buffer.from(inside)) },
  };
}

function componentMetrics(data, width, height, minimumPixels) {
  const seen = new Uint8Array(data.length); let count = 0; let maxWidth = 0;
  for (let start = 0; start < data.length; start += 1) {
    if (!data[start] || seen[start]) continue;
    const queue = [start]; seen[start] = 1; let pixels = 0; let minX = width; let maxX = -1; let minY = height; let maxY = -1;
    for (let q = 0; q < queue.length; q += 1) { const index = queue[q]; pixels += 1; const x = index % width; const y = Math.floor(index / width); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); for (const next of neighbors(index, width, height)) if (data[next] && !seen[next]) { seen[next] = 1; queue.push(next); } }
    if (pixels > minimumPixels) { count += 1; maxWidth = Math.max(maxWidth, Math.min(maxX - minX + 1, maxY - minY + 1)); }
  }
  return { count, maxWidth };
}

export function checkAttachmentBoundary({ inside, seamBand, bundle, width, height, outsideAllowancePx = 0, allowedGapPixels = 0 }) {
  if (![inside, seamBand, bundle].every((data) => data instanceof Uint8Array && data.length === width * height)) rigError('invalid_boundary_masks', 'garment boundary masks must match the canvas');
  if (!Number.isInteger(outsideAllowancePx) || outsideAllowancePx < 0 || outsideAllowancePx > 128 || !Number.isInteger(allowedGapPixels) || allowedGapPixels < 0) rigError('invalid_boundary_parameter', 'allowances must be non-negative integers');
  const allowedInside = dilateMask(inside, width, height, outsideAllowancePx); const missing = new Uint8Array(inside.length); const outside = new Uint8Array(inside.length); const gaps = new Uint8Array(inside.length);
  for (let index = 0; index < inside.length; index += 1) { missing[index] = inside[index] && !bundle[index] ? 1 : 0; outside[index] = bundle[index] && !allowedInside[index] ? 1 : 0; gaps[index] = seamBand[index] && !bundle[index] ? 1 : 0; }
  const gapMetrics = componentMetrics(gaps, width, height, allowedGapPixels);
  const contactPixels = seamBand.reduce((sum, value, index) => sum + (value && bundle[index] ? 1 : 0), 0);
  const missingContact = gaps.reduce((sum, value) => sum + value, 0);
  return { missing, outside, gaps, metrics: { contact_pixels: contactPixels, missing_contact_pixels: missingContact, missing_inside_pixels: missing.reduce((sum, value) => sum + value, 0), outside_allowance_pixels: outside.reduce((sum, value) => sum + value, 0), seam_gap_components: gapMetrics.count, max_gap_width: gapMetrics.maxWidth, outside_allowance_px: outsideAllowancePx, allowed_gap_pixels: allowedGapPixels } };
}

export const checkGarmentBoundary = checkAttachmentBoundary;

export function loadRigDocument(path) {
  return parseRigDocument(readFileSync(path));
}
