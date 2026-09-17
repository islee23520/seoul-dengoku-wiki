import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';
import { CANONICAL_SLOTS, validateManifest } from '../portrait-state.mjs';
import { encodePng } from '../../../Tool/art/portrait/portrait-layer-composite.mjs';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const cli = fileURLToPath(new URL('../audit-library.py', import.meta.url));
const width = 1145, height = 1374;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const SELECTABLE = new Set(['bg', 'face_base', 'mouth', 'nose', 'eyes_white', 'eyes_shape', 'eyes_color', 'clothes', 'headgear', 'acc_eye', 'frame']);
const modeFor = (sex, id) => id === 'hair' || SELECTABLE.has(id) ? 'selectable'
  : ['cheeks', 'chin', 'headgear_back', 'headgear_mid', 'clothes_back', 'clothes_front'].includes(id) || (sex === 'female' && id === 'hair_back') ? 'companion'
    : (sex === 'female' && ['beard', 'beard_back'].includes(id)) || (sex === 'male' && ['hair_back', 'beard_back'].includes(id)) ? 'disabled'
      : 'fixed';

// Numeric-only test charts, never production portrait assets. Reuse across slots
// deliberately proves that decoded duplicate detection is scoped to sex/slot.
const pngs = Array.from({ length: 3 }, (_, index) => {
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([30 + index, 80, 100, 255], index * 4);
  return encodePng(width, height, pixels);
});
const detailPngs = Array.from({ length: 3 }, (_, index) => {
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([80 + index, 80 + index, 80 + index, 255], index * 4);
  return encodePng(width, height, pixels);
});

function fixture(t) {
  const root = mkdtempSync(join(testDirectory, '.library-audit-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [index, bytes] of pngs.entries()) writeFileSync(join(root, `${index}.png`), bytes);
  for (const [index, bytes] of detailPngs.entries()) writeFileSync(join(root, `detail-${index}.png`), bytes);
  const manifest = {
    version: 1, canvas: { width, height }, slots: CANONICAL_SLOTS,
    logical_bundles: {
      clothes: { label: '의상', primary: 'clothes', members: ['clothes_back', 'clothes', 'clothes_front'] },
      hair: { label: '헤어', primary: 'hair', members: ['hair_back', 'hair'] },
      face_shape: { label: '얼굴형', primary: 'face_base', members: ['face_base', 'cheeks', 'chin'] },
    },
    sexes: Object.fromEntries(['female', 'male'].map(sex => [sex, {
      slots: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => {
        const mode = modeFor(sex, id);
        const count = mode === 'selectable' ? 3 : mode === 'disabled' ? 0 : mode === 'fixed' ? 1 : 2;
        const primary = ['cheeks', 'chin'].includes(id) ? 'face_base'
          : id.startsWith('headgear_') ? 'headgear' : id.startsWith('clothes_') ? 'clothes' : 'hair';
        const multiply = ['cheeks', 'chin'].includes(id);
        return [id, {
          mode, enabled: mode !== 'disabled', variants: Array.from({ length: count }, (_, i) => ({
            id: `v${i}`, path: `${multiply ? 'detail-' : ''}${i}.png`, sha256: sha256((multiply ? detailPngs : pngs)[i]),
            source: 'authored-deterministic', blend_mode: multiply ? 'multiply' : 'source-over',
            source_identity: { generating_script: `${multiply ? 'detail-' : ''}${i}.png`, generating_script_sha256: sha256((multiply ? detailPngs : pngs)[i]) },
            ...(mode === 'companion' ? { companion_of: { slot: primary, variant: `v${i}` } } : {}),
          }))
        }];
      }))
    }]))
  };
  const path = join(root, 'library.json');
  const run = () => {
    writeFileSync(path, JSON.stringify(manifest));
    return audit(path);
  };
  return { root, manifest, run };
}

function audit(path) {
  const result = spawnSync('python3', [cli, path], { encoding: 'utf8' });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  // A missing CLI/import failure is RED, never confused with a valid rejection.
  assert.equal(result.stderr, '');
  return { status: result.status, report: JSON.parse(result.stdout) };
}

function rejected(result, code) {
  assert.equal(result.status, 1);
  assert.equal(result.report.numericAcceptance, 'RED');
  assert.equal(result.report.visualAcceptance, 'NOT VERIFIED');
  assert.equal(result.report.errors[0].code, code);
}

function refreshHash(manifest, path, bytes) {
  for (const sex of ['female', 'male']) for (const entry of Object.values(manifest.sexes[sex].slots)) {
    for (const variant of entry.variants) if (variant.path === path) {
      variant.sha256 = sha256(bytes);
      if (variant.source === 'authored-deterministic') variant.source_identity.generating_script_sha256 = sha256(bytes);
    }
  }
}

test('complete mode-aware numeric fixture passes but grants no visual approval', t => {
  const { run } = fixture(t);
  const result = run();
  assert.equal(result.status, 0);
  assert.equal(result.report.numericAcceptance, 'GREEN');
  assert.equal(result.report.variantsChecked, 103);
  assert.equal(result.report.visualAcceptance, 'NOT VERIFIED');
  assert.equal(result.report.provenanceAcceptance, 'VERIFIED');
  assert.deepEqual(result.report.errors, []);
});

test('selectable slots require at least one genuine variant without a count cap', t => {
  const { manifest, run } = fixture(t);
  for (const count of [0]) {
    manifest.sexes.male.slots.bg.variants = Array.from({ length: count }, (_, i) => ({
      id: `v${i}`, path: `${i % 3}.png`, sha256: sha256(pngs[i % 3]), source: 'authored-deterministic',
      source_identity: { generating_script: `${i % 3}.png`, generating_script_sha256: sha256(pngs[i % 3]) },
    }));
    validateManifest(manifest);
    rejected(run(), 'VARIANT_COUNT');
  }
  for (const count of [1, 2, 4, 7]) {
    const current = fixture(t);
    current.manifest.sexes.male.slots.bg.variants = Array.from({ length: count }, (_, i) => ({
      id: `v${i}`, path: `${i % 3}.png`, sha256: sha256(pngs[i % 3]), source: 'authored-deterministic',
      source_identity: { generating_script: `${i % 3}.png`, generating_script_sha256: sha256(pngs[i % 3]) },
      minimum_contract: { status: 'PASS', record: `${i % 3}.png`, record_sha256: sha256(pngs[i % 3]) },
    }));
    if (count <= 3) assert.equal(current.run().status, 0);
  }
  const fixed = fixture(t); fixed.manifest.sexes.male.slots.neck.variants.push(fixed.manifest.sexes.male.slots.neck.variants[0]);
  rejected(fixed.run(), 'VARIANT_COUNT');
});

test('every sex/slot has the owner-approved mode and disabled slots are empty', t => {
  const { manifest, run } = fixture(t);
  delete manifest.sexes.female.slots.bg.mode;
  rejected(run(), 'SLOT_MODE');
  const disabled = fixture(t);
  disabled.manifest.sexes.female.slots.beard.variants.push({ id: 'v0', path: '0.png', sha256: sha256(pngs[0]) });
  disabled.manifest.sexes.female.slots.beard.mode = 'fixed';
  disabled.manifest.sexes.female.slots.beard.enabled = true;
  rejected(disabled.run(), 'SLOT_MODE');
});

test('raw asset sha256 and accepted source evidence are required fail-closed', t => {
  const missing = fixture(t);
  delete missing.manifest.sexes.female.slots.bg.variants[0].sha256;
  rejected(missing.run(), 'ASSET_SHA256');

  const drifted = fixture(t);
  drifted.manifest.sexes.female.slots.bg.variants[0].sha256 = '0'.repeat(64);
  rejected(drifted.run(), 'ASSET_SHA256');

  const rejectedEvidence = fixture(t);
  const record = join(rejectedEvidence.root, 'STATUS.md');
  writeFileSync(record, 'Status: **FEMALE_GARMENT_COMPANIONS_REJECTED_ALL_SETS_EXHAUSTED**\nNo accepted claim is made.\n');
  const variant = rejectedEvidence.manifest.sexes.female.slots.bg.variants[0];
  variant.source = 'accepted-companion-evidence';
  variant.source_identity = {
    evidence_package: '.', acceptance_record: 'STATUS.md', acceptance_record_sha256: sha256(readFileSync(record)),
    candidate: '0.png', candidate_sha256: sha256(pngs[0]),
  };
  rejected(rejectedEvidence.run(), 'EVIDENCE_POLICY');
});

test('blend modes are restricted and multiply details must be neutral grayscale', t => {
  const ineligible = fixture(t);
  ineligible.manifest.sexes.female.slots.bg.variants[0].blend_mode = 'multiply';
  rejected(ineligible.run(), 'BLEND_MODE');

  const missing = fixture(t);
  missing.manifest.sexes.female.slots.cheeks.variants[0].blend_mode = 'source-over';
  rejected(missing.run(), 'BLEND_MODE');

  const eyes = fixture(t);
  eyes.manifest.sexes.female.slots.eyes_shape.variants[0].blend_mode = 'multiply';
  rejected(eyes.run(), 'BLEND_MODE');

  const colored = fixture(t);
  const variant = colored.manifest.sexes.female.slots.cheeks.variants[0];
  variant.path = 'colored-detail.png';
  writeFileSync(join(colored.root, variant.path), pngs[0]);
  variant.sha256 = sha256(pngs[0]);
  variant.source_identity = { generating_script: variant.path, generating_script_sha256: variant.sha256 };
  rejected(colored.run(), 'MULTIPLY_GRAYSCALE');
});

test('render override bytes and accepted evidence are verified fail-closed', t => {
  const { root, manifest, run } = fixture(t);
  const record = join(root, 'override-acceptance.json');
  writeFileSync(record, JSON.stringify({ status: 'LEAD_ACCEPTED' }));
  const variant = manifest.sexes.male.slots.hair.variants[0];
  variant.render_overrides = [{
    when: { slot: 'headgear', variant: 'v0' },
    path: 'override.png', sha256: sha256(pngs[1]), source: 'accepted-evidence-render-override',
    source_identity: {
      evidence_package: '.', acceptance_record: 'override-acceptance.json',
      acceptance_record_sha256: sha256(readFileSync(record)), candidate: 'override.png',
      candidate_sha256: sha256(pngs[1]),
    },
  }];
  writeFileSync(join(root, 'override.png'), pngs[1]);
  assert.equal(run().status, 0);

  writeFileSync(join(root, 'override.png'), pngs[2]);
  rejected(run(), 'ASSET_SHA256');
});

test('decoded PNG support must be nonempty and dimensions exactly 1145x1374', t => {
  const { root, manifest, run } = fixture(t);
  writeFileSync(join(root, '0.png'), encodePng(width, height, new Uint8Array(width * height * 4)));
  manifest.sexes.female.slots.bg.variants[0].sha256 = sha256(readFileSync(join(root, '0.png')));
  manifest.sexes.female.slots.bg.variants[0].source_identity.generating_script_sha256 = manifest.sexes.female.slots.bg.variants[0].sha256;
  rejected(run(), 'EMPTY_SUPPORT');
  writeFileSync(join(root, '0.png'), pngs[0]);
  refreshHash(manifest, '0.png', pngs[0]);
  const companion = manifest.sexes.male.slots.clothes_back.variants[0];
  companion.path = 'empty.png';
  writeFileSync(join(root, companion.path), encodePng(width, height, new Uint8Array(width * height * 4)));
  companion.sha256 = sha256(readFileSync(join(root, companion.path)));
  companion.empty = true;
  companion.intentionally_empty = true;
  companion.source_identity = { generating_script: companion.path, generating_script_sha256: companion.sha256 };
  assert.equal(run().status, 0);
  writeFileSync(join(root, '0.png'), encodePng(1, 1, new Uint8Array([1, 2, 3, 255])));
  manifest.sexes.female.slots.bg.variants[0].sha256 = sha256(readFileSync(join(root, '0.png')));
  manifest.sexes.female.slots.bg.variants[0].source_identity.generating_script_sha256 = manifest.sexes.female.slots.bg.variants[0].sha256;
  rejected(run(), 'PNG_DIMENSIONS');
});

test('different PNG bytes with identical decoded pixels are duplicates within a sex/slot', t => {
  const { root, manifest, run } = fixture(t);
  const text = Buffer.from('Comment\0same pixels, different PNG bytes');
  const typeAndData = Buffer.concat([Buffer.from('tEXt'), text]);
  const size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(text.length); crc.writeUInt32BE(crc32(typeAndData));
  const modified = Buffer.concat([pngs[0].subarray(0, -12), size, typeAndData, crc, pngs[0].subarray(-12)]);
  assert.notDeepEqual(modified, pngs[0]);
  writeFileSync(join(root, '1.png'), modified); refreshHash(manifest, '1.png', modified);
  rejected(run(), 'DUPLICATE_PIXELS');
});

test('identical PNG file bytes remain duplicates within a sex/slot', t => {
  const { root, manifest, run } = fixture(t);
  writeFileSync(join(root, '1.png'), pngs[0]); refreshHash(manifest, '1.png', pngs[0]);
  rejected(run(), 'DUPLICATE_PIXELS');
});

test('identical visible RGBA with differing alpha-zero RGB is rejected as duplicate', t => {
  const { root, manifest, run } = fixture(t);
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([30, 80, 100, 255]);
  pixels.set([190, 60, 220, 0], 4);
  const modified = encodePng(width, height, pixels);
  assert.notDeepEqual(modified, pngs[0]);
  writeFileSync(join(root, '1.png'), modified); refreshHash(manifest, '1.png', modified);
  rejected(run(), 'DUPLICATE_PIXELS');
});

test('nonzero alpha and RGB remain distinct even at alpha one', t => {
  const { root, manifest, run } = fixture(t);
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([30, 80, 100, 255]);
  pixels.set([190, 60, 220, 1], 4);
  writeFileSync(join(root, '0.png'), encodePng(width, height, pixels)); refreshHash(manifest, '0.png', readFileSync(join(root, '0.png')));
  for (const rgba of [[191, 60, 220, 1], [190, 60, 220, 2]]) {
    pixels.set(rgba, 4);
    writeFileSync(join(root, '1.png'), encodePng(width, height, pixels)); refreshHash(manifest, '1.png', readFileSync(join(root, '1.png')));
    assert.equal(run().status, 0);
  }
});

test('local image URLs cannot escape the library directory, including through symlinks', t => {
  const { root, manifest, run } = fixture(t);
  for (const path of ['../outside.png', '%2e%2e/outside.png', '/tmp/outside.png', 'https://example.test/a.png', '//example.test/a.png', 'file:///tmp/a.png', '..\\outside.png', '0.png?query=1', '0.png#fragment']) {
    manifest.sexes.female.slots.bg.variants[0].path = path;
    rejected(run(), 'ASSET_PATH');
  }
  symlinkSync(cli, join(root, 'escape.png'));
  manifest.sexes.female.slots.bg.variants[0].path = 'escape.png';
  rejected(run(), 'ASSET_PATH');
  manifest.sexes.female.slots.bg.variants[0].path = '%30.png';
  assert.equal(run().status, 0);
});

test('missing manifest, invalid JSON/schema, missing image and corrupt PNG fail closed', t => {
  const { root, manifest, run } = fixture(t);
  rejected(audit(join(root, 'absent.json')), 'MANIFEST_READ');
  writeFileSync(join(root, 'invalid.json'), '{');
  rejected(audit(join(root, 'invalid.json')), 'MANIFEST_READ');
  manifest.slots = [];
  rejected(run(), 'MANIFEST_SCHEMA');
  manifest.slots = CANONICAL_SLOTS;
  rmSync(join(root, '0.png'));
  rejected(run(), 'ASSET_READ');
  writeFileSync(join(root, '0.png'), pngs[0].subarray(0, 50)); refreshHash(manifest, '0.png', readFileSync(join(root, '0.png')));
  rejected(run(), 'PNG_DECODE');
  // Pillow may identify other formats regardless of filename: they are not PNGs.
  execFileSync('python3', ['-c', 'from PIL import Image; import sys; Image.new("RGB", (1145,1374)).save(sys.argv[1], format="BMP")', join(root, '0.png')]);
  refreshHash(manifest, '0.png', readFileSync(join(root, '0.png')));
  rejected(run(), 'PNG_FORMAT');
  assert.ok(readFileSync(join(root, '0.png')).length > 0);
});
