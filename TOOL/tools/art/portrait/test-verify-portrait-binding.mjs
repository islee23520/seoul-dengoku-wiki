import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import {
  loadCharacterRegistry,
  verifyPortraitBinding,
} from './verify-portrait-binding.mjs';

const { slots } = JSON.parse(readFileSync(new URL('./portrait-layer-slots.json', import.meta.url), 'utf8'));

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const DISABLED_FOR_FEMALE = ['beard', 'beard_back'];
const SELECTABLE = new Set(['bg', 'face_base', 'mouth', 'nose', 'eyes_white', 'eyes_shape', 'eyes_color', 'clothes', 'headgear', 'acc_eye', 'frame']);
const modeFor = (sex, id) => (sex === 'male' && id === 'hair') || SELECTABLE.has(id) ? 'selectable'
  : ['headgear_back', 'headgear_mid'].includes(id) || (sex === 'male' && ['clothes_back', 'clothes_front'].includes(id)) ? 'companion'
    : (sex === 'female' && DISABLED_FOR_FEMALE.includes(id)) || (sex === 'male' && ['hair_back', 'beard_back'].includes(id)) ? 'disabled' : 'fixed';

function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), 'portrait-binding-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (rel, body) => {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return { path: rel, sha256: sha256(Buffer.from(body)) };
  };
  return { root, put };
}

/** Atlas markdown carrying the same JSON fence shape the wiki corpus uses. */
function atlasMarkdown(ids) {
  const humans = ids.map((id) => ({ id, name: `이름${id}`, role: 'r', stage: 'S1', state_id: 'S01' }));
  return ['# atlas', '', '```json', JSON.stringify({
    schema: 'world-narrative-atlas.v1',
    humans,
  }, null, 2), '```', ''].join('\n');
}

/** Library manifest in the shape the Design demo publishes. */
function libraryManifest(variantsPerSlot = 10) {
  const sexes = {};
  for (const sex of ['female', 'male']) {
    const entries = {};
    for (const slot of slots) {
      const mode = modeFor(sex, slot.id);
      const enabled = mode !== 'disabled';
      entries[slot.id] = {
        mode, enabled,
        variants: enabled
          ? Array.from({ length: mode === 'fixed' ? 1 : mode === 'companion' ? 0 : variantsPerSlot }, (_, i) => ({
            id: `${slot.id}-${String(i + 1).padStart(2, '0')}`,
            path: `plates/${sex}/${slot.id}-${String(i + 1).padStart(2, '0')}.png`,
          }))
          : [],
      };
    }
    sexes[sex] = { slots: entries };
  }
  return { version: 1, canvas: { width: 1145, height: 1374 }, slots, sexes };
}

/** Selection covering every required slot enabled for that sex. */
function selectionFor(sex, index = 1) {
  const picked = {};
  for (const slot of slots) {
    if (!slot.required || !['selectable', 'fixed'].includes(modeFor(sex, slot.id))) continue;
    const chosen = modeFor(sex, slot.id) === 'fixed' ? 1 : index;
    picked[slot.id] = `${slot.id}-${String(chosen).padStart(2, '0')}`;
  }
  return picked;
}

function fixture(t, { characters = ['K001', 'K002'], variantsPerSlot = 10 } = {}) {
  const { root, put } = workspace(t);
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown(characters));
  const library = put('GAME-REFERENCE/potray-generator/assets/v2/library.json',
    JSON.stringify(libraryManifest(variantsPerSlot), null, 2));
  const binding = (id, sex, index) => ({
    character_id: id,
    sex,
    selection: selectionFor(sex, index),
    export: put(`exports/${id}.png`, `export-${sex}-${index}`),
  });
  return { root, put, library, binding };
}

test('the character registry comes from the atlas json fence', (t) => {
  const { root } = fixture(t, { characters: ['K001', 'K002', 'K1006'] });
  const registry = loadCharacterRegistry(root);
  assert.deepEqual([...registry].sort(), ['K001', 'K002', 'K1006']);
});

test('the live atlas registers a contiguous K001..KN human range', () => {
  const registry = loadCharacterRegistry(new URL('../../../', import.meta.url).pathname);
  // The atlas roster is owned by main's cast corpus; the portrait contract only requires a
  // contiguous, nonempty human range so bindings can address any registered person.
  assert.ok(registry.size > 0, 'atlas registry is empty');
  const ids = [...registry].sort();
  assert.equal(ids[0], 'K001');
  for (let index = 0; index < ids.length; index += 1) {
    assert.equal(ids[index], `K${String(index + 1).padStart(3, '0')}`, 'contiguous ids');
  }
});

test('a complete two-character binding document is accepted', (t) => {
  const { root, library, binding } = fixture(t);
  const report = verifyPortraitBinding({
    schema_version: 1,
    library,
    bindings: [binding('K001', 'female', 1), binding('K002', 'male', 2)],
  }, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.ok, true);
  assert.equal(report.bindings.length, 2);
});

test('a character outside the atlas registry is refused', (t) => {
  const { root, library, binding } = fixture(t);
  const report = verifyPortraitBinding({
    schema_version: 1,
    library,
    bindings: [binding('K999', 'female', 1)],
  }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'unknown_character' && e.character_id === 'K999'));
  assert.equal(report.ok, false);
});

test('one character cannot hold two portrait bindings', (t) => {
  const { root, library, binding } = fixture(t);
  const report = verifyPortraitBinding({
    schema_version: 1,
    library,
    bindings: [binding('K001', 'female', 1), binding('K001', 'female', 2)],
  }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'duplicate_character'));
});

test('a selection missing a required slot is refused', (t) => {
  const { root, library, binding } = fixture(t);
  const row = binding('K001', 'female', 1);
  delete row.selection.eyes_color;
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [row] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'selection_incomplete' && e.slots.includes('eyes_color')));
});

test('a female binding may not select beard or beard_back', (t) => {
  const { root, library, binding } = fixture(t);
  const row = binding('K001', 'female', 1);
  row.selection.beard = 'beard-01';
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [row] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'disabled_slot_bound' && e.slot === 'beard'));
});

test('a male fixed beard may not be overridden', (t) => {
  const { root, library, binding } = fixture(t);
  const row = binding('K002', 'male', 1);
  row.selection.beard = 'beard-04';
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [row] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'fixed_slot_override' && e.slot === 'beard'));
});

test('a fixed slot may be explicitly bound as hidden', (t) => {
  const { root, library, binding } = fixture(t);
  const row = binding('K002', 'male', 1);
  row.selection.beard = null;
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [row] }, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.ok, true);
});

test('an unknown slot or unknown variant id is refused', (t) => {
  const { root, library, binding } = fixture(t);
  const straySlot = binding('K001', 'female', 1);
  straySlot.selection.halo = 'halo-01';
  assert.ok(verifyPortraitBinding({ schema_version: 1, library, bindings: [straySlot] }, { repoRoot: root })
    .errors.some((e) => e.code === 'unknown_slot' && e.slot === 'halo'));

  const strayVariant = binding('K002', 'male', 1);
  strayVariant.selection.eyes_shape = 'eyes_shape-99';
  assert.ok(verifyPortraitBinding({ schema_version: 1, library, bindings: [strayVariant] }, { repoRoot: root })
    .errors.some((e) => e.code === 'unknown_variant' && e.variant === 'eyes_shape-99'));
});

test('identical selections must reproduce an identical export hash', (t) => {
  const { root, put, library, binding } = fixture(t);
  const first = binding('K001', 'female', 1);
  const second = { ...binding('K002', 'female', 1), export: put('exports/K002-drift.png', 'different-bytes') };
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [first, second] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'nondeterministic_export'));
});

test('different selections may not share one export hash', (t) => {
  const { root, put, library, binding } = fixture(t);
  const shared = put('exports/shared.png', 'same-bytes');
  const first = { ...binding('K001', 'female', 1), export: shared };
  const second = { ...binding('K002', 'female', 2), export: shared };
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [first, second] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'export_collision'));
});

test('an export whose bytes drifted from the recorded hash is refused', (t) => {
  const { root, library, binding } = fixture(t);
  const row = binding('K001', 'female', 1);
  row.export.sha256 = 'c'.repeat(64);
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [row] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'export_unbound'));
});

test('a library manifest that drifted from its recorded hash is refused', (t) => {
  const { root, library, binding } = fixture(t);
  const report = verifyPortraitBinding({
    schema_version: 1,
    library: { ...library, sha256: 'd'.repeat(64) },
    bindings: [binding('K001', 'female', 1)],
  }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'library_unbound'));
  assert.equal(report.ok, false);
});

test('an empty selectable library slot cannot back a delivery binding', (t) => {
  const { root, put, binding } = fixture(t, { variantsPerSlot: 2 });
  const document = libraryManifest(2);
  document.sexes.female.slots.bg.variants = [];
  const library = put('GAME-REFERENCE/potray-generator/assets/v2/empty-library.json', JSON.stringify(document));
  const report = verifyPortraitBinding({
    schema_version: 1,
    library,
    bindings: [binding('K001', 'female', 1)],
  }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'variant_count_short'));
});

test('a gates-1-4 library refuses delivery of provisional slot components', (t) => {
  const { root, put, binding } = fixture(t);
  const document = libraryManifest();
  document.slot_validity_policy = 'gates-1-4';
  for (const sex of ['female', 'male']) {
    for (const entry of Object.values(document.sexes[sex].slots)) {
      for (const variant of entry.variants) {
        variant.slot_validity = { status: 'provisional', policy: 'gates-1-4', gates: { gate1: 'PASS', gate2: 'PASS', gate3: 'FAIL', gate4: 'PENDING' }, reason: 'gate_chain_incomplete' };
      }
    }
  }
  const library = put('GAME-REFERENCE/potray-generator/assets/v2/provisional-library.json', JSON.stringify(document));
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [binding('K001', 'female', 1)] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'slot_not_validated'));
  assert.equal(report.ok, false);
});

test('a gates-1-4 library accepts delivery when the chosen component is fully verified', (t) => {
  const { root, put, binding } = fixture(t);
  const document = libraryManifest();
  document.slot_validity_policy = 'gates-1-4';
  const verified = { status: 'verified', policy: 'gates-1-4', gates: { gate1: 'PASS', gate2: 'PASS', gate3: 'PASS', gate4: 'PASS' } };
  for (const sex of ['female', 'male']) {
    for (const entry of Object.values(document.sexes[sex].slots)) {
      for (const variant of entry.variants) variant.slot_validity = verified;
    }
  }
  const library = put('GAME-REFERENCE/potray-generator/assets/v2/verified-library.json', JSON.stringify(document));
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [binding('K001', 'female', 1)] }, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.ok, true);
});

test('an attached review must be a bound, accepted GQ4 record for the same character', (t) => {
  const { root, put, library, binding } = fixture(t);
  const row = binding('K001', 'female', 1);
  row.review = put('reviews/K001.json', JSON.stringify({ schema_version: 1, checkpoint: 'GQ4' }));
  const report = verifyPortraitBinding({ schema_version: 1, library, bindings: [row] }, { repoRoot: root });
  assert.ok(report.errors.some((e) => e.code === 'review_not_accepted'));
});
