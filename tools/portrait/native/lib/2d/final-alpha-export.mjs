import { readFile, open, realpath, lstat, unlink } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { decodeCodexPng } from './codex-image.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const roles = ['background', 'fringe', 'opaqueInterior'];

export function encodeFinalPng({ width, height, pixels }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || pixels.length !== width * height * 4) throw new Error('invalid RGBA dimensions');
  const chunk = (type, body) => {
    const bytes = Buffer.alloc(body.length + 12);
    bytes.writeUInt32BE(body.length); bytes.write(type, 4); body.copy(bytes, 8);
    let crc = 0xffffffff;
    for (const byte of bytes.subarray(4, -4)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    bytes.writeUInt32BE((crc ^ 0xffffffff) >>> 0, bytes.length - 4);
    return bytes;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const stride = width * 4, scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(pixels.subarray(y * stride, (y + 1) * stride)).copy(scanlines, y * (stride + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
}

// Manhattan distance keeps both the edge band and original-pixel donor search bounded.
function backgroundDistances(image, background) {
  const { width, height, pixels } = image, count = width * height;
  const distance = new Int32Array(count).fill(count + 1), queue = new Int32Array(count);
  let head = 0, tail = 0;
  for (let i = 0; i < count; i++) if (pixels[i * 4 + 3] === 0 || background[i]) { distance[i] = 0; queue[tail++] = i; }
  while (head < tail) {
    const i = queue[head++], x = i % width, y = Math.floor(i / width);
    for (const j of [x ? i - 1 : -1, x + 1 < width ? i + 1 : -1, y ? i - width : -1, y + 1 < height ? i + width : -1]) {
      if (j >= 0 && distance[j] > distance[i] + 1) { distance[j] = distance[i] + 1; queue[tail++] = j; }
    }
  }
  return distance;
}

export function cleanFinalPixels(image, masks = {}, radius = 2) {
  if (image.channels !== 4 || ![1, 2].includes(radius)) throw new Error('RGBA source and radius 1 or 2 required');
  const { width, height, pixels } = image, count = width * height;
  const selected = Object.fromEntries(roles.map(role => [role, masks[role] ?? new Uint8Array(count)]));
  for (const mask of Object.values(selected)) if (mask.length !== count || mask.some(value => value !== 0 && value !== 1)) throw new Error('invalid binary mask shape');
  const { background, fringe, opaqueInterior } = selected;
  const distance = backgroundDistances(image, background);
  for (let i = 0; i < count; i++) {
    if ((background[i] && (fringe[i] || opaqueInterior[i])) || (fringe[i] && opaqueInterior[i])) throw new Error('overlapping cleanup masks');
    if (fringe[i] && (pixels[i * 4 + 3] === 0 || distance[i] > radius)) throw new Error('fringe mask outside foreground edge band');
    if (opaqueInterior[i] && (pixels[i * 4 + 3] === 0 || distance[i] <= radius)) throw new Error('opaque interior mask touches background or edge ramp');
  }
  const output = Buffer.from(pixels), unresolved = [], rgbChanged = [], alphaChanged = [];
  for (let i = 0; i < count; i++) {
    if (background[i]) output[i * 4 + 3] = 0;
    if (opaqueInterior[i]) output[i * 4 + 3] = 255;
    if (fringe[i]) {
      const x = i % width, y = Math.floor(i / width), donors = [];
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const separation = Math.abs(dx) + Math.abs(dy), xx = x + dx, yy = y + dy;
        if (!separation || separation > radius || xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const j = yy * width + xx;
        if (!background[j] && !fringe[j] && pixels[j * 4 + 3] >= 250 && distance[j] > distance[i]) donors.push({ j, separation, alpha: pixels[j * 4 + 3] });
      }
      donors.sort((a, b) => a.separation - b.separation || b.alpha - a.alpha || a.j - b.j);
      if (!donors.length) unresolved.push({ x, y, reason: 'no-original-foreground-donor' });
      else pixels.copy(output, i * 4, donors[0].j * 4, donors[0].j * 4 + 3);
    }
    if (output[i * 4 + 3] !== pixels[i * 4 + 3]) alphaChanged.push(i);
    if (!output.subarray(i * 4, i * 4 + 3).equals(pixels.subarray(i * 4, i * 4 + 3))) rgbChanged.push(i);
  }
  const bounds = indices => {
    if (!indices.length) return null;
    const box = { left: width, top: height, right: 0, bottom: 0 };
    for (const i of indices) {
      const x = i % width, y = Math.floor(i / width);
      box.left = Math.min(box.left, x); box.top = Math.min(box.top, y);
      box.right = Math.max(box.right, x + 1); box.bottom = Math.max(box.bottom, y + 1);
    }
    return box;
  };
  return { pixels: output, unresolved, changedRGB: rgbChanged.length, changedAlpha: alphaChanged.length, rgbBounds: bounds(rgbChanged), alphaBounds: bounds(alphaChanged), confirmedFringePixels: fringe.reduce((sum, value) => sum + value, 0) };
}

export async function exportFinalAlpha({ specPath, output, receipt }) {
  const specFile = await realpath(resolve(specPath)), base = dirname(specFile);
  const specBytes = await readFile(specFile), spec = JSON.parse(specBytes);
  if (typeof spec.characterId !== 'string' || !spec.characterId || ![1, 2].includes(spec.radius)) throw new Error('characterId and radius 1 or 2 required');
  if (spec.masks && Object.keys(spec.masks).some(role => !roles.includes(role))) throw new Error('unknown mask role');
  const inputs = [{ path: specFile, bytes: specBytes, sha256: sha256(specBytes), role: 'spec' }];
  const load = async (binding, role) => {
    if (!binding || typeof binding.path !== 'string' || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? '')) throw new Error(`invalid ${role} binding`);
    const path = await realpath(resolve(base, binding.path)), bytes = await readFile(path);
    if (sha256(bytes) !== binding.sha256) throw new Error(`${role} hash mismatch`);
    const entry = { path, bytes, sha256: binding.sha256, role }; inputs.push(entry); return entry;
  };
  const source = await load(spec.source, 'source'), image = decodeCodexPng(source.bytes), masks = {};
  const sourceDecode = { channels: image.channels, alphaChannelPresent: image.channels === 4, conversion: image.channels === 3 ? 'rgb-to-rgba-opaque-in-memory' : 'none' };
  if (image.channels === 3 && !spec.masks?.background) throw new Error('RGB source requires a reviewed background mask');
  for (const role of roles) if (spec.masks?.[role]) {
    const binding = spec.masks[role];
    if (binding.reviewed !== true || binding.sourceSha256 !== source.sha256) throw new Error(`${role} mask must be reviewed and source-bound`);
    const entry = await load(binding, role), mask = decodeCodexPng(entry.bytes);
    if (mask.width !== image.width || mask.height !== image.height) throw new Error(`${role} mask dimensions mismatch`);
    const bits = new Uint8Array(image.width * image.height);
    for (let i = 0; i < bits.length; i++) {
      const p = i * mask.channels, value = mask.pixels[p];
      if (![0, 255].includes(value) || mask.pixels[p + 1] !== value || mask.pixels[p + 2] !== value || (mask.channels === 4 && mask.pixels[p + 3] !== 255)) throw new Error(`${role} mask must be opaque binary grayscale RGB/RGBA8`);
      bits[i] = value === 255 ? 1 : 0;
    }
    masks[role] = bits;
  }
  if (image.channels === 3) {
    if (!masks.background.some(value => value === 1) || !masks.background.some(value => value === 0)) throw new Error('RGB background mask must retain both background and foreground');
    // This plane belongs only to the local derivative; provider bytes remain RGB.
    const pixels = Buffer.alloc(image.width * image.height * 4, 255);
    for (let i = 0; i < image.width * image.height; i++) image.pixels.copy(pixels, i * 4, i * 3, i * 3 + 3);
    image.pixels = pixels; image.channels = 4;
  }
  for (const binding of spec.verdicts ?? []) await load(binding, 'verdict');
  const result = cleanFinalPixels(image, masks, spec.radius);
  const bytes = encodeFinalPng({ ...image, pixels: result.pixels }), decoded = decodeCodexPng(bytes);
  if (!decoded.pixels.equals(result.pixels)) throw new Error('derivative roundtrip mismatch');
  const destinations = [];
  for (const path of [output, receipt]) {
    const absolute = resolve(path), canonical = resolve(await realpath(dirname(absolute)), basename(absolute));
    try { await lstat(canonical); throw new Error('destination already exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (destinations.includes(canonical) || inputs.some(input => input.path === canonical)) throw new Error('destination collision');
    destinations.push(canonical);
  }
  const handles = [];
  try {
    for (const path of destinations) handles.push(await open(path, 'wx', 0o600));
    for (const input of inputs) if (sha256(await readFile(input.path)) !== input.sha256) throw new Error(`${input.role} changed during export`);
    const toolSha256 = sha256(await readFile(fileURLToPath(import.meta.url)));
    const record = {
      schema: 'portrait-final-alpha-export.v1', characterId: spec.characterId, reviewStatus: 'pending',
      processingStatus: result.unresolved.length ? 'unresolved' : result.confirmedFringePixels ? 'processed' : 'no-confirmed-fringe',
      source: { path: source.path, sha256: source.sha256 }, derivative: { path: destinations[0], sha256: sha256(bytes) },
      sourceDecode,
      inputs: inputs.map(({ bytes: ignored, ...entry }) => entry), toolSha256, width: image.width, height: image.height, radius: spec.radius,
      changedRGB: result.changedRGB, changedAlpha: result.changedAlpha, rgbBounds: result.rgbBounds, alphaBounds: result.alphaBounds,
      confirmedFringePixels: result.confirmedFringePixels, unresolved: result.unresolved,
    };
    await handles[0].writeFile(bytes); await handles[1].writeFile(JSON.stringify(record, null, 2) + '\n');
    for (const input of inputs) if (sha256(await readFile(input.path)) !== input.sha256) throw new Error(`${input.role} changed during export`);
    return record;
  } catch (error) {
    await Promise.all(destinations.slice(0, handles.length).map(path => unlink(path))); throw error;
  } finally { await Promise.all(handles.map(handle => handle.close())); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 6 || new Set(args.filter((_, i) => i % 2 === 0)).size !== 3 || args.some((value, i) => i % 2 === 0 && !['--spec', '--output', '--receipt'].includes(value))) throw new Error('usage: --spec spec.json --output new.png --receipt new.json');
    const value = key => args[args.indexOf(key) + 1];
    const record = await exportFinalAlpha({ specPath: value('--spec'), output: value('--output'), receipt: value('--receipt') });
    console.log(JSON.stringify(record));
    if (record.processingStatus === 'unresolved') process.exitCode = 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
