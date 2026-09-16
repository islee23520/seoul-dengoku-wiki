import test from 'node:test';
import assert from 'node:assert/strict';
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

// Numeric-only test charts, never production portrait assets. Reuse across slots
// deliberately proves that decoded duplicate detection is scoped to sex/slot.
const pngs = Array.from({ length: 10 }, (_, index) => {
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([30 + index, 80, 100, 255], index * 4);
  return encodePng(width, height, pixels);
});

function fixture(t) {
  const root = mkdtempSync(join(testDirectory, '.library-audit-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [index, bytes] of pngs.entries()) writeFileSync(join(root, `${index}.png`), bytes);
  const manifest = {
    version: 1, canvas: { width, height }, slots: CANONICAL_SLOTS,
    sexes: Object.fromEntries(['female', 'male'].map(sex => [sex, {
      slots: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => {
        const enabled = sex !== 'female' || !['beard', 'beard_back'].includes(id);
        return [id, { enabled, variants: enabled ? pngs.map((_, i) => ({ id: `v${i}`, path: `${i}.png` })) : [] }];
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

test('complete numeric fixture passes with 420 variants but no visual/provenance approval', t => {
  const { run } = fixture(t);
  const result = run();
  assert.equal(result.status, 0);
  assert.equal(result.report.numericAcceptance, 'GREEN');
  assert.equal(result.report.variantsChecked, 420);
  assert.equal(result.report.visualAcceptance, 'NOT VERIFIED');
  assert.equal(result.report.provenanceAcceptance, 'NOT VERIFIED');
  assert.deepEqual(result.report.errors, []);
});

test('production count must be exactly ten, while incomplete UI fixtures remain valid', t => {
  const { manifest, run } = fixture(t);
  for (const count of [0, 2, 9, 11]) {
    manifest.sexes.male.slots.bg.variants = Array.from({ length: count }, (_, i) => ({ id: `v${i}`, path: `${i % 10}.png` }));
    validateManifest(manifest);
    rejected(run(), 'VARIANT_COUNT');
  }
});

test('disabled female beard and beard_back must be explicit, disabled and empty', t => {
  for (const id of ['beard', 'beard_back']) {
    for (const mutate of [entry => entry.enabled = true, entry => entry.variants.push({ id: 'v0', path: '0.png' })]) {
      const { manifest, run } = fixture(t);
      mutate(manifest.sexes.female.slots[id]);
      rejected(run(), 'SEX_APPLICABILITY');
    }
  }
});

test('decoded PNG support must be nonempty and dimensions exactly 1145x1374', t => {
  const { root, run } = fixture(t);
  writeFileSync(join(root, '0.png'), encodePng(width, height, new Uint8Array(width * height * 4)));
  rejected(run(), 'EMPTY_SUPPORT');
  writeFileSync(join(root, '0.png'), encodePng(1, 1, new Uint8Array([1, 2, 3, 255])));
  rejected(run(), 'PNG_DIMENSIONS');
});

test('different PNG bytes with identical decoded pixels are duplicates within a sex/slot', t => {
  const { root, run } = fixture(t);
  const text = Buffer.from('Comment\0same pixels, different PNG bytes');
  const typeAndData = Buffer.concat([Buffer.from('tEXt'), text]);
  const size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(text.length); crc.writeUInt32BE(crc32(typeAndData));
  const modified = Buffer.concat([pngs[0].subarray(0, -12), size, typeAndData, crc, pngs[0].subarray(-12)]);
  assert.notDeepEqual(modified, pngs[0]);
  writeFileSync(join(root, '1.png'), modified);
  rejected(run(), 'DUPLICATE_PIXELS');
});

test('identical PNG file bytes remain duplicates within a sex/slot', t => {
  const { root, run } = fixture(t);
  writeFileSync(join(root, '1.png'), pngs[0]);
  rejected(run(), 'DUPLICATE_PIXELS');
});

test('identical visible RGBA with differing alpha-zero RGB is rejected as duplicate', t => {
  const { root, run } = fixture(t);
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([30, 80, 100, 255]);
  pixels.set([190, 60, 220, 0], 4);
  const modified = encodePng(width, height, pixels);
  assert.notDeepEqual(modified, pngs[0]);
  writeFileSync(join(root, '1.png'), modified);
  rejected(run(), 'DUPLICATE_PIXELS');
});

test('nonzero alpha and RGB remain distinct even at alpha one', t => {
  const { root, run } = fixture(t);
  const pixels = new Uint8Array(width * height * 4);
  pixels.set([30, 80, 100, 255]);
  pixels.set([190, 60, 220, 1], 4);
  writeFileSync(join(root, '0.png'), encodePng(width, height, pixels));
  for (const rgba of [[191, 60, 220, 1], [190, 60, 220, 2]]) {
    pixels.set(rgba, 4);
    writeFileSync(join(root, '1.png'), encodePng(width, height, pixels));
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
  writeFileSync(join(root, '0.png'), pngs[0].subarray(0, 50));
  rejected(run(), 'PNG_DECODE');
  // Pillow may identify other formats regardless of filename: they are not PNGs.
  execFileSync('python3', ['-c', 'from PIL import Image; import sys; Image.new("RGB", (1145,1374)).save(sys.argv[1], format="BMP")', join(root, '0.png')]);
  rejected(run(), 'PNG_FORMAT');
  assert.ok(readFileSync(join(root, '0.png')).length > 0);
});
