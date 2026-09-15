#!/usr/bin/env node
// Fail-closed UI Toolkit capture matrix validator (Todo 11).
// Resolution-aware: opaque frame, text-luminance floor scaled by resolution,
// non-void pixels inside Design.md structural regions per state, uniqueness.
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { isAbsolute, join, resolve } from 'path';
import { inflateSync } from 'zlib';

const EXPECTED = [
  ['main-title-1280x720', 1280, 720, 'main-title'],
  ['main-title-1920x1080', 1920, 1080, 'main-title'],
  ['campaign-route-stage-1280x720', 1280, 720, 'route-stage'],
  ['campaign-route-stage-1920x1080', 1920, 1080, 'route-stage'],
  ['encounter-choices-1280x720', 1280, 720, 'encounter'],
  ['encounter-choices-1920x1080', 1920, 1080, 'encounter'],
  ['battle-state-1280x720', 1280, 720, 'battle'],
  ['battle-state-1920x1080', 1920, 1080, 'battle'],
  ['settlement-return-1280x720', 1280, 720, 'settlement'],
  ['settlement-return-1920x1080', 1920, 1080, 'settlement'],
];

const REQUIRED_RECEIPT = [
  'stem', 'kind', 'unity', 'width', 'height', 'seed', 'state', 'state_hash',
  'head', 'dirty_tree_fingerprint', 'active_scene', 'uidocument_root_names',
  'capture_api', 'is_playing', 'png',
];

const MAX_ALPHA0_RATIO = 0.02;
const MIN_TEXT_LUM = 140;
// Base floors at 1280x720; scale by pixel area for 1080p.
const BASE_AREA = 1280 * 720;
const MIN_TEXT_LUM_AT_720 = 400;
const MIN_REGION_NONVOID = 200; // per named structural region

function textLumFloor(w, h) {
  return Math.max(MIN_TEXT_LUM_AT_720, Math.floor(MIN_TEXT_LUM_AT_720 * (w * h) / BASE_AREA));
}

/** Design.md layout regions as normalized [x0,y0,x1,y1] fractions. */
function regionsFor(state, w, h) {
  const box = (x0, y0, x1, y1) => ({
    name: '',
    x0: Math.floor(x0 * w),
    y0: Math.floor(y0 * h),
    x1: Math.floor(x1 * w),
    y1: Math.floor(y1 * h),
  });
  let list = [];
  if (state === 'main-title') {
    // Center stack: mark + sub + start
    list = [box(0.25, 0.28, 0.75, 0.72)];
    list[0].name = 'title-center-stack';
    // Start button band — focus ring (stroke-focus #C9A227) must be visible.
    list.push(Object.assign(box(0.30, 0.48, 0.70, 0.78), { name: 'title-start-focus' }));
  } else if (state === 'route-stage') {
    list = [
      Object.assign(box(0.02, 0.02, 0.98, 0.14), { name: 'stage-rail' }),
      Object.assign(box(0.02, 0.16, 0.32, 0.95), { name: 'route-rail' }),
    ];
  } else if (state === 'encounter') {
    // Stage rail + right-hand encounter detail stack (three cards share one column).
    list = [
      Object.assign(box(0.02, 0.02, 0.98, 0.14), { name: 'stage-rail' }),
      Object.assign(box(0.30, 0.14, 0.98, 0.95), { name: 'encounter-detail-stack' }),
    ];
  } else if (state === 'battle') {
    list = [
      Object.assign(box(0.02, 0.16, 0.28, 0.95), { name: 'battle-hud' }),
      Object.assign(box(0.28, 0.20, 0.62, 0.85), { name: 'battle-grid' }),
      Object.assign(box(0.64, 0.16, 0.98, 0.95), { name: 'battle-log' }),
    ];
  } else if (state === 'settlement') {
    // Settlement panel + return control share the centered detail band.
    list = [
      Object.assign(box(0.20, 0.18, 0.80, 0.85), { name: 'settlement-panel-band' }),
    ];
  }
  return list;
}

function parseArgs(argv) {
  const out = { dir: null, manifest: null, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') out.dir = argv[++i];
    else if (a === '--manifest') out.manifest = argv[++i];
    else if (a === '--head') out.head = argv[++i];
    else if (a === '--source-fingerprint') out.fingerprint = argv[++i];
    else if (a === '--self-test') out.selfTest = true;
  }
  return out;
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePngRgba(buf) {
  if (buf.length < 8 || buf.toString('binary', 0, 8) !== '\x89PNG\r\n\x1a\n') {
    throw new Error('not a PNG');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idats = [];
  while (offset + 8 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    offset += 12 + len;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`unsupported png ct=${colorType} bd=${bitDepth}`);
  }
  const compressed = Buffer.concat(idats);
  const raw = inflateSync(compressed);
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const rgba = Buffer.alloc(width * height * 4);
  let src = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) row[i] = raw[src++];
    const recon = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const x = row[i];
      const a = i >= bpp ? recon[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 255;
      else if (filter === 2) val = (x + b) & 255;
      else if (filter === 3) val = (x + ((a + b) >> 1)) & 255;
      else if (filter === 4) val = (x + paeth(a, b, c)) & 255;
      else if (filter !== 0) throw new Error('bad filter ' + filter);
      recon[i] = val;
    }
    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      rgba[di] = recon[si];
      rgba[di + 1] = recon[si + 1];
      rgba[di + 2] = recon[si + 2];
      rgba[di + 3] = bpp === 4 ? recon[si + 3] : 255;
    }
    prev = recon;
  }
  return { width, height, rgba };
}

function analyzeRgba(width, height, rgba, state) {
  let alpha0 = 0;
  let nonDark = 0;
  let textLum = 0;
  const total = width * height;
  // void reference Design.md --bg-void #0B111C
  const voidR = 11, voidG = 17, voidB = 28;
  // Design.md --stroke-focus #C9A227
  const focusR = 201, focusG = 162, focusB = 39;
  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const a = rgba[o + 3];
    if (a === 0) alpha0++;
    if (a > 200) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum > 20) nonDark++;
      if (lum >= MIN_TEXT_LUM) textLum++;
    }
  }

  const regions = regionsFor(state, width, height).map((reg) => {
    let nonVoid = 0;
    let count = 0;
    let strokeFocus = 0;
    for (let y = reg.y0; y < reg.y1; y++) {
      for (let x = reg.x0; x < reg.x1; x++) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const o = (y * width + x) * 4;
        const r = rgba[o], g = rgba[o + 1], b = rgba[o + 2], a = rgba[o + 3];
        count++;
        if (a < 200) continue;
        const dr = Math.abs(r - voidR) + Math.abs(g - voidG) + Math.abs(b - voidB);
        if (dr > 18) nonVoid++;
        if (Math.abs(r - focusR) <= 36 && Math.abs(g - focusG) <= 36 && Math.abs(b - focusB) <= 48) {
          strokeFocus++;
        }
      }
    }
    return {
      name: reg.name,
      nonVoid,
      strokeFocus,
      count,
      x0: reg.x0,
      y0: reg.y0,
      x1: reg.x1,
      y1: reg.y1,
    };
  });

  return {
    alpha0,
    nonDark,
    textLum,
    alpha0Ratio: alpha0 / total,
    nonDarkRatio: nonDark / total,
    regions,
  };
}

function validateDir(dir, head, fingerprint) {
  const errors = [];
  const items = [];
  const shaGroups = new Map();

  for (const [stem, w, h, state] of EXPECTED) {
    const pngPath = join(dir, stem + '.png');
    const receiptPath = join(dir, stem + '.receipt.json');
    const item = { stem, width: w, height: h, state, errors: [] };

    if (!existsSync(pngPath)) {
      item.errors.push('missing_png');
      errors.push(`${stem}: missing png`);
      items.push(item);
      continue;
    }
    if (!existsSync(receiptPath)) {
      item.errors.push('missing_receipt');
      errors.push(`${stem}: missing receipt`);
      items.push(item);
      continue;
    }

    let receipt;
    try {
      receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
    } catch {
      item.errors.push('receipt_parse');
      errors.push(`${stem}: receipt parse failed`);
      items.push(item);
      continue;
    }

    for (const k of REQUIRED_RECEIPT) {
      if (receipt[k] === undefined || receipt[k] === null || receipt[k] === '') {
        item.errors.push('missing_field:' + k);
        errors.push(`${stem}: missing receipt field ${k}`);
      }
    }

    if (receipt.is_playing !== true) {
      item.errors.push('is_playing_false');
      errors.push(`${stem}: is_playing must be true (got ${receipt.is_playing})`);
    }
    if (receipt.width !== w || receipt.height !== h) {
      item.errors.push('receipt_dim_mismatch');
      errors.push(`${stem}: receipt dims ${receipt.width}x${receipt.height} != ${w}x${h}`);
    }
    if (receipt.head !== head) {
      item.errors.push('head_mismatch');
      errors.push(`${stem}: head ${receipt.head} != intended ${head}`);
    }
    if (receipt.dirty_tree_fingerprint !== fingerprint) {
      item.errors.push('source_fingerprint_mismatch');
      errors.push(`${stem}: source fingerprint does not match intended tested source`);
    }
    const needRoot = state === 'main-title' ? 'main-title-root' : 'gameplay-root';
    if (!receipt.uidocument_root_names || !String(receipt.uidocument_root_names).includes(needRoot)) {
      item.errors.push('missing_root_name');
      errors.push(`${stem}: uidocument_root_names missing ${needRoot}`);
    }
    if (!receipt.state || !receipt.state_hash) {
      item.errors.push('missing_state');
      errors.push(`${stem}: missing state/state_hash`);
    }

    const png = readFileSync(pngPath);
    const hash = sha256(png);
    if (receipt.png_sha256 !== hash) {
      item.errors.push('png_sha256_mismatch');
      errors.push(`${stem}: png_sha256 does not match actual PNG bytes`);
    }
    item.sha256 = hash;
    item.bytes = png.length;
    shaGroups.set(hash, (shaGroups.get(hash) || []).concat(stem));

    let decoded;
    try {
      decoded = decodePngRgba(png);
    } catch (e) {
      item.errors.push('png_decode:' + e.message);
      errors.push(`${stem}: png decode failed: ${e.message}`);
      items.push(item);
      continue;
    }

    if (decoded.width !== w || decoded.height !== h) {
      item.errors.push('png_dim_mismatch');
      errors.push(`${stem}: png dims ${decoded.width}x${decoded.height} != ${w}x${h}`);
    }

    const metrics = analyzeRgba(decoded.width, decoded.height, decoded.rgba, state);
    Object.assign(item, metrics);
    item.text_lum_floor = textLumFloor(w, h);

    if (metrics.alpha0Ratio > MAX_ALPHA0_RATIO) {
      item.errors.push('alpha_holes');
      errors.push(`${stem}: alpha0 ratio ${metrics.alpha0Ratio.toFixed(4)} > ${MAX_ALPHA0_RATIO}`);
    }
    if (metrics.textLum < item.text_lum_floor) {
      item.errors.push('textless');
      errors.push(`${stem}: text-luminance pixels ${metrics.textLum} < floor ${item.text_lum_floor}`);
    }
    for (const reg of metrics.regions) {
      if (reg.nonVoid < MIN_REGION_NONVOID) {
        item.errors.push('region_empty:' + reg.name);
        errors.push(`${stem}: region ${reg.name} non-void ${reg.nonVoid} < ${MIN_REGION_NONVOID}`);
      }
      // MainTitle Start focus ring: require stroke-focus gold pixels in the button band.
      if (state === 'main-title' && reg.name === 'title-start-focus' && (reg.strokeFocus || 0) < 24) {
        item.errors.push('missing_focus_ring');
        errors.push(`${stem}: title-start-focus stroke-focus pixels ${reg.strokeFocus || 0} < 24`);
      }
    }

    items.push(item);
  }

  for (const [hash, stems] of shaGroups.entries()) {
    if (stems.length > 1) {
      errors.push(`duplicate_sha ${hash.slice(0, 16)} => ${stems.join(',')}`);
      for (const s of stems) {
        const it = items.find(i => i.stem === s);
        if (it) it.errors.push('duplicate_sha');
      }
    }
  }

  const uniquenessGroups = [...shaGroups.entries()].map(([hash, stems]) => ({ hash, stems }));

  return {
    ok: errors.length === 0,
    intended_head: head,
    intended_source_fingerprint: fingerprint,
    error_count: errors.length,
    errors,
    png_count: items.filter(i => i.sha256).length,
    items,
    uniqueness_groups: uniquenessGroups,
  };
}

function selfTest() {
  const rgba = Buffer.alloc(4 * 4 * 4); // all transparent
  const m = analyzeRgba(4, 4, rgba, 'main-title');
  const fails = [];
  if (!(m.alpha0Ratio > MAX_ALPHA0_RATIO)) fails.push('alpha rule');
  if (!(m.textLum < MIN_TEXT_LUM_AT_720)) fails.push('text rule');
  if (!(m.regions.every(r => r.nonVoid < MIN_REGION_NONVOID))) fails.push('region rule');
  // scaled floors
  if (textLumFloor(1920, 1080) <= MIN_TEXT_LUM_AT_720) fails.push('scale floor');
  if (fails.length) {
    console.error('SELF_TEST_FAIL', fails);
    process.exit(2);
  }
  console.log('SELF_TEST_OK capture-validator structural rules');
  process.exit(0);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) return selfTest();
  if (!args.dir || !isAbsolute(args.dir)
      || !/^[0-9a-f]{40}$/.test(args.head || '')
      || !/^[0-9a-f]{64}$/.test(args.fingerprint || '')) {
    console.error('Usage: node validate-ui-captures.mjs --dir <abs> --head <tested SHA> --source-fingerprint <tested fingerprint> [--manifest <abs>]');
    process.exit(2);
  }
  const dir = resolve(args.dir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error('dir missing:', dir);
    process.exit(2);
  }
  const result = validateDir(dir, args.head, args.fingerprint);
  if (args.manifest) {
    writeFileSync(args.manifest, JSON.stringify(result, null, 2) + '\n');
  }
  if (!result.ok) {
    console.error('CAPTURE_VALIDATION_FAIL count=' + result.error_count);
    for (const e of result.errors) console.error(' -', e);
    process.exit(1);
  }
  console.log('CAPTURE_VALIDATION_OK png_count=' + result.png_count);
  process.exit(0);
}

main();
