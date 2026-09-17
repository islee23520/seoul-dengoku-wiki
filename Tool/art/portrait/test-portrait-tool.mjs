import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { encodePng } from './portrait-layer-composite.mjs';
import { verifyPortraitBinding } from './verify-portrait-binding.mjs';
import {
  assignPortraits,
  batchPortraits,
  buildLibrary,
  composeFromLibrary,
  libraryFromRecipe,
} from './portrait-tool.mjs';
import { validatePortraitWorkflow } from './portrait-gateway.mjs';

const { slots } = JSON.parse(readFileSync(new URL('./portrait-layer-slots.json', import.meta.url), 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const CANVAS = { width: 24, height: 32 };
const DISABLED_FOR_FEMALE = ['beard', 'beard_back'];
const SELECTABLE = new Set(['bg', 'face_base', 'mouth', 'nose', 'eyes_white', 'eyes_shape', 'eyes_color', 'clothes', 'headgear', 'acc_eye', 'frame']);

/** A solid rectangle plate, unique per (slot, variant), on the shared canvas. */
function plate(slotId, variant, { width, height } = CANVAS) {
  const pixels = new Uint8Array(width * height * 4);
  const seed = sha256(`${slotId}:${variant}`);
  const r = parseInt(seed.slice(0, 2), 16);
  const g = parseInt(seed.slice(2, 4), 16);
  const b = parseInt(seed.slice(4, 6), 16);
  const band = parseInt(seed.slice(6, 8), 16) % Math.max(1, height - 2);
  for (let y = band; y < Math.min(height, band + 4); y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
    }
  }
  return encodePng(width, height, pixels);
}

function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), 'portrait-tool-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (rel, body) => {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
  };
  return { root, put };
}

/** Convention plate tree: <root>/<sex>/<slot>/<variant>.png */
function plateTree(put, { variantsPerSlot = 10, canvas = CANVAS } = {}) {
  for (const sex of ['female', 'male']) {
    for (const slot of slots) {
      const mode = slot.id === 'hair' || SELECTABLE.has(slot.id) ? 'selectable'
        : ['headgear_back', 'headgear_mid'].includes(slot.id) || (sex === 'male' && ['clothes_back', 'clothes_front'].includes(slot.id)) ? 'companion'
          : (sex === 'female' && DISABLED_FOR_FEMALE.includes(slot.id)) || (sex === 'male' && ['hair_back', 'beard_back'].includes(slot.id)) ? 'disabled' : 'fixed';
      if (mode === 'disabled' || mode === 'companion') continue;
      for (let i = 1; i <= (mode === 'fixed' ? 1 : variantsPerSlot); i += 1) {
        const variant = `${slot.id}-${String(i).padStart(2, '0')}`;
        put(`plates/${sex}/${slot.id}/${variant}.png`, plate(slot.id, `${sex}/${variant}`, canvas));
      }
    }
  }
  return 'plates';
}

function selectionFor(library, sex, index = 1) {
  const picked = {};
  for (const slot of slots) {
    const entry = library.sexes[sex].slots[slot.id];
    if (!['selectable', 'fixed'].includes(entry.mode) || !slot.required) continue;
    picked[slot.id] = entry.variants[(index - 1) % entry.variants.length].id;
  }
  return picked;
}

function gatewayWorkflow(statuses) {
  const gates = Object.fromEntries(statuses.map((status, index) => [`gateway${index + 1}`, {
    status,
    evidence: status === 'PASS' ? [{ path: `evidence/g${index + 1}.json`, sha256: String(index + 1).repeat(64) }] : []
  }]));
  return validatePortraitWorkflow({ version: 1, active_profile: 'candidate', profiles: {
    candidate: { label: 'Candidate', mode: 'variation', source: { path: 'candidate.png', sha256: 'a'.repeat(64) }, gates }
  }, tools: [{ id: 'delivery', label: 'Delivery', role: 'delivery', unlock_after: 4 }] });
}

test('buildLibrary turns a plate tree into the canonical-slot manifest the demo consumes', (t) => {
  const { root, put } = workspace(t);
  const plateRoot = plateTree(put);
  const library = buildLibrary({ repoRoot: root, plateRoot, canvas: CANVAS });

  assert.equal(library.version, 1);
  assert.deepEqual(library.canvas, CANVAS);
  assert.equal(library.slots.length, slots.length);
  for (const sex of ['female', 'male']) {
    assert.deepEqual(Object.keys(library.sexes[sex].slots).sort(), slots.map((s) => s.id).sort());
  }
  // Female beard slots stay present but explicitly disabled and empty.
  for (const slotId of DISABLED_FOR_FEMALE) {
    assert.equal(library.sexes.female.slots[slotId].enabled, false);
    assert.deepEqual(library.sexes.female.slots[slotId].variants, []);
    assert.equal(library.sexes.male.slots[slotId].mode, slotId === 'beard' ? 'fixed' : 'disabled');
  }
  // Paths are manifest-relative and each variant carries its plate hash.
  const hair = library.sexes.female.slots.hair.variants[0];
  assert.match(hair.path, /^plates\/female\/hair\/hair-01\.png$/);
  assert.equal(hair.sha256, sha256(readFileSync(join(root, hair.path))));
});

test('buildLibrary marks provenance and never claims quality acceptance', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS, stage: 'stage2' });
  assert.equal(library.stage, 'stage2');
  assert.equal(library.quality_acceptance, 'NOT VERIFIED');
  assert.equal(library.built_by, 'Tool/art/portrait/portrait-tool.mjs');
});

test('buildLibrary refuses a plate whose canvas differs from the library canvas', (t) => {
  const { root, put } = workspace(t);
  const plateRoot = plateTree(put);
  put(`${plateRoot}/female/eyes_shape/eyes_shape-99.png`, plate('eyes_shape', 'odd', { width: 16, height: 16 }));
  assert.throws(() => buildLibrary({ repoRoot: root, plateRoot, canvas: CANVAS }), /canvas/i);
});

test('composeFromLibrary renders in z order and is byte-deterministic', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'female', 1);

  const first = composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, purpose: 'reconstruction' });
  const again = composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, purpose: 'reconstruction' });
  assert.equal(sha256(first.png), sha256(again.png));
  assert.equal(first.width, CANVAS.width);
  assert.equal(first.height, CANVAS.height);
  assert.deepEqual(first.order, [...slots].sort((a, b) => a.z - b.z)
    .map((s) => s.id).filter((id) => library.sexes.female.slots[id].mode === 'fixed' || selection[id] !== undefined));

  const other = composeFromLibrary({ library, repoRoot: root, sex: 'female', selection: selectionFor(library, 'female', 2), purpose: 'reconstruction' });
  assert.notEqual(sha256(first.png), sha256(other.png));
});

test('composeFromLibrary honors explicit null for a fixed slot', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'female', 1);
  const withFixed = composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, purpose: 'reconstruction' });
  selection.neck = null;
  const withoutFixed = composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, purpose: 'reconstruction' });
  assert.ok(withFixed.order.includes('neck'));
  assert.ok(!withoutFixed.order.includes('neck'));
});

test('composeFromLibrary uses a conditional render plate while preserving the logical variant id', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'male', 1);
  selection.hair = library.sexes.male.slots.hair.variants[0].id;
  selection.headgear = library.sexes.male.slots.headgear.variants[0].id;
  const hair = library.sexes.male.slots.hair.variants.find(variant => variant.id === selection.hair);
  const overridePath = 'plates/male/hair_overrides/hair-under-headgear.png';
  const overrideBytes = plate('hair', 'conditional-override');
  put(overridePath, overrideBytes);
  hair.render_overrides = [{ when: { slot: 'headgear', variant: selection.headgear }, path: overridePath, sha256: sha256(overrideBytes) }];
  const withOverride = composeFromLibrary({ library, repoRoot: root, sex: 'male', selection, purpose: 'reconstruction' });
  delete hair.render_overrides;
  const withoutOverride = composeFromLibrary({ library, repoRoot: root, sex: 'male', selection, purpose: 'reconstruction' });
  assert.equal(selection.hair, hair.id);
  assert.notEqual(withOverride.sha256, withoutOverride.sha256);
});

test('composeFromLibrary refuses a conditional render plate whose bytes drifted', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'male', 1);
  selection.hair = library.sexes.male.slots.hair.variants[0].id;
  selection.headgear = library.sexes.male.slots.headgear.variants[0].id;
  const hair = library.sexes.male.slots.hair.variants.find(variant => variant.id === selection.hair);
  const overridePath = 'plates/male/hair_overrides/hair-under-headgear.png';
  const accepted = plate('hair', 'accepted-conditional-override');
  put(overridePath, plate('hair', 'drifted-conditional-override'));
  hair.render_overrides = [{ when: { slot: 'headgear', variant: selection.headgear }, path: overridePath, sha256: sha256(accepted) }];
  assert.throws(() => composeFromLibrary({ library, repoRoot: root, sex: 'male', selection, purpose: 'reconstruction' }), /hash/i);
});

test('composition separates reconstruction, review and delivery through gateway 4', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'female', 1);
  const gate1Only = gatewayWorkflow(['PASS', 'IN_PROGRESS', 'BLOCKED', 'BLOCKED']);
  assert.doesNotThrow(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, workflow: gate1Only, purpose: 'reconstruction' }));
  assert.throws(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, workflow: gate1Only, purpose: 'review' }), /1·2차/);
  assert.throws(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, purpose: 'review' }), /workflow/);
  const gate2 = gatewayWorkflow(['PASS', 'PASS', 'IN_PROGRESS', 'BLOCKED']);
  assert.doesNotThrow(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, workflow: gate2, purpose: 'review' }));
  assert.throws(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, workflow: gate2, purpose: 'delivery' }), /1·2·3·4차/);
  assert.doesNotThrow(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'PASS']), purpose: 'delivery' }));
});

test('composeFromLibrary fails closed on a missing required slot or a disabled selection', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'female', 1);

  const incomplete = { ...selection };
  delete incomplete.eyes_color;
  assert.throws(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection: incomplete, purpose: 'reconstruction' }),
    /required slot.*eyes_color/i);

  assert.throws(() => composeFromLibrary({
    library, repoRoot: root, sex: 'female', selection: { ...selection, beard: 'beard-01' }, purpose: 'reconstruction'
  }), /disabled/i);

  assert.throws(() => composeFromLibrary({
    library, repoRoot: root, sex: 'female', selection: { ...selection, eyes_shape: 'eyes_shape-99' }, purpose: 'reconstruction'
  }), /unknown variant/i);
});

test('composeFromLibrary refuses a plate that drifted from its recorded hash', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const selection = selectionFor(library, 'female', 1);
  put('plates/female/eyes_shape/eyes_shape-01.png', plate('eyes_shape', 'tampered'));
  assert.throws(() => composeFromLibrary({ library, repoRoot: root, sex: 'female', selection, purpose: 'reconstruction' }), /hash/i);
});

test('assignPortraits is a pure function of seed and character id', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  const people = [
    { id: 'K001', sex: 'female' },
    { id: 'K002', sex: 'male' },
    { id: 'K003', sex: 'female' },
  ];

  const workflow = gatewayWorkflow(['PASS', 'PASS', 'PASS', 'PASS']);
  const first = assignPortraits({ library, workflow, people, seed: 'janseon-portrait-v1' });
  const again = assignPortraits({ library, workflow, people, seed: 'janseon-portrait-v1' });
  assert.deepEqual(first, again);

  const other = assignPortraits({ library, workflow, people, seed: 'different-seed' });
  assert.notDeepEqual(first, other);

  // Reordering the roster cannot change anyone's portrait.
  const reordered = assignPortraits({ library, workflow, people: [...people].reverse(), seed: 'janseon-portrait-v1' });
  assert.deepEqual(
    reordered.find((a) => a.character_id === 'K001').selection,
    first.find((a) => a.character_id === 'K001').selection,
  );

  // Every required enabled slot is chosen; female beard stays unselected.
  const female = first.find((a) => a.character_id === 'K001');
  for (const slot of slots) {
    const mode = library.sexes.female.slots[slot.id].mode;
    if (slot.required && ['selectable', 'fixed'].includes(mode)) assert.ok(female.selection[slot.id], slot.id);
  }
  assert.equal(female.selection.beard, undefined);
  assert.equal(female.selection.beard_back, undefined);
});

test('batchPortraits writes composites and a binding document the gate accepts', (t) => {
  const { root, put } = workspace(t);
  const plateRoot = plateTree(put);
  const library = buildLibrary({ repoRoot: root, plateRoot, canvas: CANVAS });
  const libraryPath = 'out/library.json';
  put(libraryPath, JSON.stringify(library, null, 2));
  put('Wikis/game-logic/World-Narrative-Atlas.md', ['```json', JSON.stringify({
    schema: 'world-narrative-atlas.v1',
    humans: [{ id: 'K001' }, { id: 'K002' }, { id: 'K003' }],
  }), '```'].join('\n'));

  const result = batchPortraits({
    repoRoot: root,
    libraryPath,
    workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'PASS']),
    people: [{ id: 'K001', sex: 'female' }, { id: 'K002', sex: 'male' }, { id: 'K003', sex: 'female' }],
    seed: 'janseon-portrait-v1',
    outDir: 'out/portraits',
  });

  assert.equal(result.bindings.length, 3);
  assert.equal(result.document.schema_version, 1);
  const report = verifyPortraitBinding(result.document, { repoRoot: root });
  assert.deepEqual(report.errors, []);
  assert.equal(report.ok, true);

  // Every recorded export exists with the recorded bytes.
  for (const row of result.document.bindings) {
    assert.equal(sha256(readFileSync(join(root, row.export.path))), row.export.sha256);
  }

  // Rerunning the batch reproduces identical bytes.
  const rerun = batchPortraits({
    repoRoot: root, libraryPath,
    workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'PASS']),
    people: [{ id: 'K001', sex: 'female' }, { id: 'K002', sex: 'male' }, { id: 'K003', sex: 'female' }],
    seed: 'janseon-portrait-v1', outDir: 'out/portraits-rerun',
  });
  assert.deepEqual(
    rerun.document.bindings.map((b) => b.export.sha256),
    result.document.bindings.map((b) => b.export.sha256),
  );
});

test('batch and character binding remain blocked before all four gateways pass', (t) => {
  const { root, put } = workspace(t);
  const library = buildLibrary({ repoRoot: root, plateRoot: plateTree(put), canvas: CANVAS });
  put('out/library.json', JSON.stringify(library));
  assert.throws(() => assignPortraits({ library, workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'IN_PROGRESS']), people: [{ id: 'K001', sex: 'female' }] }), /1·2·3·4차/);
  assert.throws(() => assignPortraits({ library, people: [{ id: 'K001', sex: 'female' }] }), /workflow/);
  assert.throws(() => batchPortraits({ repoRoot: root, libraryPath: 'out/library.json', workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'IN_PROGRESS']), people: [{ id: 'K001', sex: 'female' }], outDir: 'out/blocked' }), /1·2·3·4차/);
  assert.throws(() => batchPortraits({ repoRoot: root, libraryPath: 'out/library.json', people: [{ id: 'K001', sex: 'female' }], outDir: 'out/missing-workflow' }), /workflow/);
});

test('batchPortraits refuses to overwrite an existing export directory', (t) => {
  const { root, put } = workspace(t);
  const plateRoot = plateTree(put);
  const library = buildLibrary({ repoRoot: root, plateRoot, canvas: CANVAS });
  put('out/library.json', JSON.stringify(library));
  put('out/portraits/keep.txt', 'existing work');
  assert.throws(() => batchPortraits({
    repoRoot: root, libraryPath: 'out/library.json',
    workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'PASS']),
    people: [{ id: 'K001', sex: 'female' }], seed: 's', outDir: 'out/portraits',
  }), /exists/i);
});

test('libraryFromRecipe adapts a Stage-1 recipe into library variants', (t) => {
  const { root, put } = workspace(t);
  for (const slot of slots) put(`stage1/base/slots/${slot.id}.png`, plate(slot.id, 'base'));
  for (const id of ['hair_back', 'hair']) put(`stage1/variants/h1/${id}.png`, plate(id, 'h1'));
  const recipe = {
    version: 1,
    canvas: CANVAS,
    groups: { hair: { slots: ['hair_back', 'hair'], variants: ['h0', 'h1'] } },
    assets: [
      ...slots.map((slot) => ({ id: slot.id, path: `base/slots/${slot.id}.png`, ...(['hair_back', 'hair'].includes(slot.id) ? { group: 'hair', variant: 'h0' } : {}) })),
      { id: 'hair_back', group: 'hair', variant: 'h1', path: 'variants/h1/hair_back.png' },
      { id: 'hair', group: 'hair', variant: 'h1', path: 'variants/h1/hair.png' },
    ],
  };
  put('stage1/recipe.json', JSON.stringify(recipe));

  const library = libraryFromRecipe({ repoRoot: root, recipePath: 'stage1/recipe.json', sex: 'female' });
  assert.equal(library.stage, 'stage1-derived');
  assert.equal(library.quality_acceptance, 'NOT VERIFIED');
  assert.deepEqual(library.sexes.female.slots.hair.variants.map((v) => v.id), ['hair-h0', 'hair-h1']);
  assert.deepEqual(library.sexes.female.slots.nose.variants.map((v) => v.id), ['nose-base']);

  // A Stage-1 library with at least one real selectable variant is delivery-admissible under the
  // uncapped contract; visual/Gate 4 acceptance remains a separate boundary.
  put('out/library.json', JSON.stringify(library));
  put('Wikis/game-logic/World-Narrative-Atlas.md', ['```json', JSON.stringify({
    schema: 'world-narrative-atlas.v1', humans: [{ id: 'K001' }],
  }), '```'].join('\n'));
  const result = batchPortraits({
    repoRoot: root, libraryPath: 'out/library.json',
    workflow: gatewayWorkflow(['PASS', 'PASS', 'PASS', 'PASS']),
    people: [{ id: 'K001', sex: 'female' }], seed: 's', outDir: 'out/stage1',
  });
  const report = verifyPortraitBinding(result.document, { repoRoot: root });
  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);
});

test('a roster must state each character sex explicitly; it is never inferred', async (t) => {
  const { loadRoster } = await import('./portrait-tool.mjs');
  const { root, put } = workspace(t);

  put('roster.json', JSON.stringify({ version: 1, humans: [{ id: 'K001', sex: 'female' }, { id: 'K002', sex: 'male' }] }));
  assert.deepEqual(loadRoster({ repoRoot: root, rosterPath: 'roster.json' }),
    [{ id: 'K001', sex: 'female' }, { id: 'K002', sex: 'male' }]);

  // The atlas carries no sex field, so an entry without one cannot be defaulted.
  put('unset.json', JSON.stringify({ version: 1, humans: [{ id: 'K001' }] }));
  assert.throws(() => loadRoster({ repoRoot: root, rosterPath: 'unset.json' }), /sex/i);

  put('bad.json', JSON.stringify({ version: 1, humans: [{ id: 'K001', sex: 'unset' }] }));
  assert.throws(() => loadRoster({ repoRoot: root, rosterPath: 'bad.json' }), /sex/i);

  put('dupe.json', JSON.stringify({ version: 1, humans: [{ id: 'K001', sex: 'female' }, { id: 'K001', sex: 'male' }] }));
  assert.throws(() => loadRoster({ repoRoot: root, rosterPath: 'dupe.json' }), /duplicate/i);
});
