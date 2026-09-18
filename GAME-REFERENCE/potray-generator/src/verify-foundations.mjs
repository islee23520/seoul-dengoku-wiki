#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

import {
  compositePortraitLayers,
  decodePng,
  encodePng,
} from '../../../Tool/art/portrait/portrait-layer-composite.mjs';

export const ORIGINAL_GATE1_SLOTS = Object.freeze([
  'bg', 'clothes_back', 'headgear_back', 'hair_back', 'beard_back',
  'face_base', 'neck', 'cheeks', 'chin', 'mouth', 'nose', 'eyes_shape',
  'eyes_color', 'ears', 'clothes', 'headgear_mid', 'beard', 'hair',
  'clothes_front', 'headgear', 'acc_eye', 'frame',
]);

export const ORIGINAL_GATE1_SCHEMA_SHA256 = '51a71ee8bdbfd15587fea9df983020dbe222134822dbe9e13bc3d853d1c020be';
export const ORIGINAL_GATE1_SCHEMA = Object.freeze({
  slots: Object.freeze(ORIGINAL_GATE1_SLOTS.map((id, z) => Object.freeze({ id, z, required: true }))),
});

const SHA256 = /^[0-9a-f]{64}$/;
const DEFAULT_CONFIG = 'Design/potrait-generator/config/asset-decisions.json';
const DEFAULT_DATABASE = 'Design/potrait-generator/data/assets.sqlite';
const DEFAULT_OUTPUT = 'Design/potrait-generator/work/foundation-baseline';
const ANIME_TARGET = 'Design/potrait-generator/assets/v2/target.png';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function assertSha(value, label) {
  if (!SHA256.test(value ?? '')) throw new Error(`${label} is not a lowercase SHA-256`);
}

function countDiff(left, right) {
  let changedPixels = 0;
  let changedChannels = 0;
  let maxDelta = 0;
  for (let i = 0; i < left.length; i += 4) {
    let pixelChanged = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(left[i + channel] - right[i + channel]);
      if (delta) {
        pixelChanged = true;
        changedChannels += 1;
        maxDelta = Math.max(maxDelta, delta);
      }
    }
    if (pixelChanged) changedPixels += 1;
  }
  return { changed_pixels: changedPixels, changed_channels: changedChannels, max_channel_delta: maxDelta };
}

function differencePixels(source, composite) {
  const output = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i += 4) {
    const r = Math.abs(source[i] - composite[i]);
    const g = Math.abs(source[i + 1] - composite[i + 1]);
    const b = Math.abs(source[i + 2] - composite[i + 2]);
    const a = Math.abs(source[i + 3] - composite[i + 3]);
    const peak = Math.max(r, g, b, a);
    output[i] = peak;
    output[i + 1] = a ? 255 : peak;
    output[i + 2] = peak;
    output[i + 3] = 255;
  }
  return output;
}

function faceCropBounds(width, height) {
  return {
    x: Math.floor(width * 0.2),
    y: 0,
    width: Math.max(1, Math.ceil(width * 0.6)),
    height: Math.max(1, Math.ceil(height * 0.62)),
  };
}

function sideBySideCrop(source, composite, width, bounds) {
  const outputWidth = bounds.width * 2;
  const output = new Uint8Array(outputWidth * bounds.height * 4);
  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const sourceOffset = ((bounds.y + y) * width + bounds.x + x) * 4;
      const leftOffset = (y * outputWidth + x) * 4;
      const rightOffset = (y * outputWidth + bounds.width + x) * 4;
      output.set(source.subarray(sourceOffset, sourceOffset + 4), leftOffset);
      output.set(composite.subarray(sourceOffset, sourceOffset + 4), rightOffset);
    }
  }
  return { width: outputWidth, height: bounds.height, pixels: output };
}

export function verifyDecodedPartition({ source, layers, expectedHashes = null }) {
  if (!source || !Number.isInteger(source.width) || !Number.isInteger(source.height) || !source.pixels) {
    throw new Error('source must be a decoded PNG');
  }
  if (!Array.isArray(layers) || layers.length === 0) throw new Error('layers must be a non-empty array');

  const pixelCount = source.width * source.height;
  const ownership = new Uint16Array(pixelCount);
  const failures = [];
  const slotResults = [];
  let partialAlphaPixels = 0;
  let alphaZeroRgbViolations = 0;
  let ownedRgbMismatchPixels = 0;
  let hashDriftFiles = 0;

  for (const layer of layers) {
    const image = layer.image;
    const bytesHash = layer.sha256 ?? (layer.bytes ? sha256(layer.bytes) : null);
    const expectedHash = expectedHashes?.[layer.id] ?? layer.expectedSha256 ?? null;
    if (!image || image.width !== source.width || image.height !== source.height) {
      failures.push({ code: 'DIMENSION_MISMATCH', slot: layer.id, expected: [source.width, source.height], actual: image ? [image.width, image.height] : null });
      continue;
    }
    if (expectedHash && bytesHash !== expectedHash) {
      hashDriftFiles += 1;
      failures.push({ code: 'HASH_DRIFT', slot: layer.id, expected: expectedHash, actual: bytesHash });
    }
    let visiblePixels = 0;
    let slotPartial = 0;
    let slotDirtyTransparent = 0;
    let slotRgbMismatch = 0;
    for (let pixel = 0, offset = 0; pixel < pixelCount; pixel += 1, offset += 4) {
      const alpha = image.pixels[offset + 3];
      if (alpha !== 0 && alpha !== 255) { partialAlphaPixels += 1; slotPartial += 1; }
      if (alpha === 0) {
        if (image.pixels[offset] || image.pixels[offset + 1] || image.pixels[offset + 2]) {
          alphaZeroRgbViolations += 1; slotDirtyTransparent += 1;
        }
        continue;
      }
      ownership[pixel] += 1;
      visiblePixels += 1;
      if (image.pixels[offset] !== source.pixels[offset]
        || image.pixels[offset + 1] !== source.pixels[offset + 1]
        || image.pixels[offset + 2] !== source.pixels[offset + 2]
        || alpha !== source.pixels[offset + 3]) {
        ownedRgbMismatchPixels += 1; slotRgbMismatch += 1;
      }
    }
    slotResults.push({
      id: layer.id,
      sha256: bytesHash,
      expected_sha256: expectedHash,
      dimensions: [image.width, image.height],
      visible_pixels: visiblePixels,
      partial_alpha_pixels: slotPartial,
      alpha_zero_rgb_violations: slotDirtyTransparent,
      owned_rgba_mismatch_pixels: slotRgbMismatch,
    });
  }

  let gapPixels = 0;
  let overlapPixels = 0;
  for (const owners of ownership) {
    if (owners === 0) gapPixels += 1;
    else if (owners > 1) overlapPixels += 1;
  }
  if (gapPixels) failures.push({ code: 'OWNERSHIP_GAP', pixels: gapPixels });
  if (overlapPixels) failures.push({ code: 'OWNERSHIP_OVERLAP', pixels: overlapPixels });
  if (partialAlphaPixels) failures.push({ code: 'PARTIAL_ALPHA', pixels: partialAlphaPixels });
  if (alphaZeroRgbViolations) failures.push({ code: 'DIRTY_ALPHA_ZERO_RGB', pixels: alphaZeroRgbViolations });
  if (ownedRgbMismatchPixels) failures.push({ code: 'OWNED_RGBA_DRIFT', pixels: ownedRgbMismatchPixels });

  return {
    verified: failures.length === 0,
    dimensions: [source.width, source.height],
    canvas_pixels: pixelCount,
    one_hot_pixels: pixelCount - gapPixels - overlapPixels,
    gap_pixels: gapPixels,
    overlap_pixels: overlapPixels,
    partial_alpha_pixels: partialAlphaPixels,
    alpha_zero_rgb_violations: alphaZeroRgbViolations,
    owned_rgba_mismatch_pixels: ownedRgbMismatchPixels,
    hash_drift_files: hashDriftFiles,
    slots: slotResults,
    failures,
  };
}

function relativePath(repoRoot, absolutePath) {
  return relative(repoRoot, absolutePath).split('\\').join('/');
}

function databaseBinding(db, path, label) {
  const row = db.prepare('SELECT path,sha256,sex,slot,lifecycle FROM asset_paths WHERE path = ?').get(path);
  if (!row) throw new Error(`${label} is not registered in asset_paths: ${path}`);
  assertSha(row.sha256, `${label} database SHA`);
  return row;
}

function configuredBindingForSex(db, config, sex, role, scope) {
  const matches = config.decisions
    .filter(item => item.properties?.role === role && item.properties?.gate_scope === scope)
    .map(item => ({ decision: item, row: databaseBinding(db, item.path, `${role} candidate`) }))
    .filter(item => item.row.sex === sex);
  if (matches.length !== 1) throw new Error(`expected exactly one configured ${sex} ${role}, found ${matches.length}`);
  return matches[0];
}

export function resolveLiveFoundation({ db, config, sex, repoRoot }) {
  const sourceBinding = configuredBindingForSex(db, config, sex, 'foundation_body', 'gate1_source');
  const faceBinding = configuredBindingForSex(db, config, sex, 'face_base', 'gate1_visible_ownership');
  const sourceDecision = sourceBinding.decision;
  const faceDecision = faceBinding.decision;
  assertSha(sourceDecision.sha256, `${sex} configured source SHA`);
  assertSha(faceDecision.sha256, `${sex} configured face_base SHA`);

  const sourceRow = sourceBinding.row;
  const faceRow = faceBinding.row;
  if (sourceRow.sha256 !== sourceDecision.sha256) throw new Error(`${sex} source config/database binding mismatch`);
  if (faceRow.sha256 !== faceDecision.sha256) throw new Error(`${sex} face_base config/database binding mismatch`);
  if (sourceRow.sex !== sex || faceRow.sex !== sex || faceRow.slot !== 'face_base') {
    throw new Error(`${sex} database metadata does not identify the configured foundation binding`);
  }

  const sourceReceiptRow = databaseBinding(db, sourceDecision.receipt, `${sex} source receipt`);
  const ownershipReceiptRow = databaseBinding(db, faceDecision.receipt, `${sex} ownership receipt`);
  const slotsDirectory = dirname(resolve(repoRoot, faceDecision.path));
  const slots = ORIGINAL_GATE1_SLOTS.map(id => {
    const path = relativePath(repoRoot, join(slotsDirectory, `${id}.png`));
    const row = databaseBinding(db, path, `${sex}/${id}`);
    if (row.sex !== sex || row.slot !== id) throw new Error(`${sex}/${id} database metadata mismatch at ${path}`);
    const configured = config.decisions.find(item => item.path === path);
    if (configured && configured.sha256 !== row.sha256) throw new Error(`${sex}/${id} config/database binding mismatch`);
    return { id, path, expectedSha256: row.sha256 };
  });

  return {
    sex,
    source: { path: sourceDecision.path, expectedSha256: sourceDecision.sha256 },
    sourceReceipt: { path: sourceDecision.receipt, expectedSha256: sourceReceiptRow.sha256 },
    ownershipReceipt: { path: faceDecision.receipt, expectedSha256: ownershipReceiptRow.sha256 },
    slots,
  };
}

function artifactRecord(repoRoot, path) {
  const bytes = readFileSync(path);
  return { path: relativePath(repoRoot, path), sha256: sha256(bytes), bytes: bytes.length };
}

export function verifyFoundation({ repoRoot, foundation, outputDirectory }) {
  const sourcePath = resolve(repoRoot, foundation.source.path);
  const sourceBytes = readFileSync(sourcePath);
  const sourceHash = sha256(sourceBytes);
  const source = decodePng(sourceBytes);
  const layers = foundation.slots.map(slot => {
    const absolutePath = resolve(repoRoot, slot.path);
    const bytes = readFileSync(absolutePath);
    return { ...slot, bytes, sha256: sha256(bytes), image: decodePng(bytes) };
  });

  const receiptBindings = {};
  for (const [kind, binding] of Object.entries({ source_quality: foundation.sourceReceipt, visible_ownership: foundation.ownershipReceipt })) {
    if (!binding) { receiptBindings[kind] = null; continue; }
    const bytes = readFileSync(resolve(repoRoot, binding.path));
    const actualSha256 = sha256(bytes);
    receiptBindings[kind] = { path: binding.path, expected_sha256: binding.expectedSha256, actual_sha256: actualSha256 };
  }

  const bindingFailures = [];
  if (sourceHash !== foundation.source.expectedSha256) {
    bindingFailures.push({ code: 'SOURCE_HASH_DRIFT', expected: foundation.source.expectedSha256, actual: sourceHash });
  }
  if (foundation.slots.length !== 22 || foundation.slots.some((slot, index) => slot.id !== ORIGINAL_GATE1_SLOTS[index])) {
    bindingFailures.push({ code: 'FROZEN_SCHEMA_MISMATCH', expected_slots: ORIGINAL_GATE1_SLOTS, actual_slots: foundation.slots.map(slot => slot.id) });
  }
  for (const [kind, binding] of Object.entries(receiptBindings)) {
    if (binding && binding.actual_sha256 !== binding.expected_sha256) {
      bindingFailures.push({ code: 'RECEIPT_HASH_DRIFT', receipt_kind: kind, path: binding.path, expected: binding.expected_sha256, actual: binding.actual_sha256 });
    }
  }

  const partition = verifyDecodedPartition({
    source,
    layers,
    expectedHashes: Object.fromEntries(foundation.slots.map(slot => [slot.id, slot.expectedSha256])),
  });
  const slotMap = Object.fromEntries(foundation.slots.map(slot => [slot.id, resolve(repoRoot, slot.path)]));
  const composite = compositePortraitLayers({ schema: ORIGINAL_GATE1_SCHEMA, slots: slotMap });
  const reconstruction = countDiff(source.pixels, composite.pixels);
  if (source.width !== composite.width || source.height !== composite.height) {
    bindingFailures.push({ code: 'COMPOSITE_DIMENSION_MISMATCH', expected: [source.width, source.height], actual: [composite.width, composite.height] });
  }
  if (reconstruction.changed_pixels) bindingFailures.push({ code: 'RECONSTRUCTION_DRIFT', ...reconstruction });

  const sexDirectory = join(outputDirectory, foundation.sex);
  mkdirSync(sexDirectory, { recursive: true });
  const compositePath = join(sexDirectory, 'composite.png');
  const differencePath = join(sexDirectory, 'difference.png');
  const facePath = join(sexDirectory, 'face-source-vs-composite-native.png');
  writeFileSync(compositePath, composite.png);
  writeFileSync(differencePath, encodePng(source.width, source.height, differencePixels(source.pixels, composite.pixels)));
  const cropBounds = faceCropBounds(source.width, source.height);
  const crop = sideBySideCrop(source.pixels, composite.pixels, source.width, cropBounds);
  writeFileSync(facePath, encodePng(crop.width, crop.height, crop.pixels));

  const failures = [...bindingFailures, ...partition.failures];
  return {
    sex: foundation.sex,
    baseline_verdict: failures.length === 0 ? 'VERIFIED_EXACT_PARTITION' : 'FAILED_VERIFICATION',
    source: { path: foundation.source.path, expected_sha256: foundation.source.expectedSha256, actual_sha256: sourceHash, dimensions: [source.width, source.height] },
    original_gate1_schema: { slot_count: 22, ids: [...ORIGINAL_GATE1_SLOTS], expected_frozen_sha256: ORIGINAL_GATE1_SCHEMA_SHA256 },
    partition,
    reconstruction,
    face_crop: { bounds_xywh: [cropBounds.x, cropBounds.y, cropBounds.width, cropBounds.height], sampling: 'native-no-resampling', layout: ['authoritative_source', 'actual_composite'] },
    evidence_receipts: receiptBindings,
    artifacts: {
      composite: artifactRecord(repoRoot, compositePath),
      difference: artifactRecord(repoRoot, differencePath),
      native_face_side_by_side: artifactRecord(repoRoot, facePath),
    },
    failures,
  };
}

function writeReport(path, receipt) {
  const lines = [
    '# Foundation baseline verification', '',
    `Overall: **${receipt.overall_verdict}**`, '',
    'This is a fresh numeric baseline verification of the existing source-visible original Gate 1 partition. It does not reauthor assets, grant new curator acceptance, or grant Gate 2/3 credit.', '',
    `The anime target \`${receipt.identity_boundary.anime_target.path}\` (${receipt.identity_boundary.anime_target.sha256}) is distinct from the female bald foundation source \`${receipt.identity_boundary.female_foundation.path}\` (${receipt.identity_boundary.female_foundation.sha256}); pixel identity is not claimed.`, '',
  ];
  for (const result of receipt.foundations) {
    lines.push(`## ${result.sex}`, '', `Verdict: **${result.baseline_verdict}**`, '',
      `Source: \`${result.source.path}\``,
      `Dimensions: ${result.source.dimensions.join('x')}`,
      `Gaps / overlaps: ${result.partition.gap_pixels} / ${result.partition.overlap_pixels}`,
      `Reconstruction changed pixels: ${result.reconstruction.changed_pixels}`,
      `Failures: ${result.failures.length}`, '');
  }
  lines.push('## Scope', '', '- Original frozen 22-slot schema only; the newer 23-slot UI schema is not used to reinterpret these recipes.', '- Gate 2: NOT EVALUATED.', '- Gate 3: NOT EVALUATED.', '- Production/runtime acceptance: NOT EVALUATED.', '');
  writeFileSync(path, `${lines.join('\n')}\n`);
}

export function runLiveFoundationBaselines({ repoRoot = process.cwd(), configPath = DEFAULT_CONFIG, databasePath = DEFAULT_DATABASE, outputPath = DEFAULT_OUTPUT } = {}) {
  const absoluteConfig = resolve(repoRoot, configPath);
  const absoluteDatabase = resolve(repoRoot, databasePath);
  const outputDirectory = resolve(repoRoot, outputPath);
  const configBytes = readFileSync(absoluteConfig);
  const databaseBytes = readFileSync(absoluteDatabase);
  const config = JSON.parse(configBytes.toString('utf8'));
  const db = new DatabaseSync(absoluteDatabase, { readOnly: true });
  let foundations;
  try {
    foundations = ['female', 'male'].map(sex => resolveLiveFoundation({ db, config, sex, repoRoot }));
  } finally {
    db.close();
  }

  mkdirSync(outputDirectory, { recursive: true });
  const results = foundations.map(foundation => verifyFoundation({ repoRoot, foundation, outputDirectory }));
  const animeTargetPath = resolve(repoRoot, ANIME_TARGET);
  const animeTargetSha = existsSync(animeTargetPath) ? sha256(readFileSync(animeTargetPath)) : null;
  const female = foundations.find(item => item.sex === 'female');
  const payload = {
    receipt_schema: 'foundation-baseline-verification/v1',
    generated_at: new Date().toISOString(),
    overall_verdict: results.every(result => result.baseline_verdict === 'VERIFIED_EXACT_PARTITION') ? 'VERIFIED_EXACT_PARTITIONS' : 'FAILED_VERIFICATION',
    authority_scope: {
      verifies: 'existing source-visible original Gate 1 22-slot partition and exact decoded RGBA reconstruction',
      gate1_new_acceptance: false,
      gate2: 'NOT_EVALUATED',
      gate3: 'NOT_EVALUATED',
      production: 'NOT_EVALUATED',
    },
    inputs: {
      config: { path: relativePath(repoRoot, absoluteConfig), sha256: sha256(configBytes) },
      database_file: { path: relativePath(repoRoot, absoluteDatabase), sha256: sha256(databaseBytes), hash_scope: 'main SQLite file only; informational because WAL state is not included' },
      selected_asset_bindings: {
        sha256: sha256(Buffer.from(canonicalJson(foundations))),
        digest_scope: 'resolved female and male source, receipt, and 22 slot path/SHA bindings',
        selection_rule: 'configured role/scope joined to asset_paths with exact row.sex, path, and SHA bindings',
      },
    },
    identity_boundary: {
      anime_target: { path: ANIME_TARGET, sha256: animeTargetSha, role: 'original_anime_target' },
      female_foundation: { path: female.source.path, sha256: female.source.expectedSha256, role: 'bald_gate1_foundation_source' },
      pixel_same_claim: false,
    },
    foundations: results,
  };
  const receipt = { ...payload, receipt_payload_sha256: sha256(Buffer.from(canonicalJson(payload))) };
  const receiptPath = join(outputDirectory, 'receipt.json');
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  const reportPath = join(outputDirectory, 'REPORT.md');
  writeReport(reportPath, receipt);
  return {
    ...receipt,
    output: {
      receipt: artifactRecord(repoRoot, receiptPath),
      report: artifactRecord(repoRoot, reportPath),
    },
  };
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--live') options.live = true;
    else if (['--repo-root', '--config', '--database', '--output'].includes(argument)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      options[argument.slice(2)] = value;
      index += 1;
    } else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (!options.live) throw new Error('live verification is guarded; pass --live only when the coordinator authorizes the live report');
  const receipt = runLiveFoundationBaselines({
    repoRoot: options['repo-root'] ?? process.cwd(),
    configPath: options.config ?? DEFAULT_CONFIG,
    databasePath: options.database ?? DEFAULT_DATABASE,
    outputPath: options.output ?? DEFAULT_OUTPUT,
  });
  process.stdout.write(`${JSON.stringify({ verdict: receipt.overall_verdict, output: receipt.output }, null, 2)}\n`);
  if (receipt.overall_verdict !== 'VERIFIED_EXACT_PARTITIONS') process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
