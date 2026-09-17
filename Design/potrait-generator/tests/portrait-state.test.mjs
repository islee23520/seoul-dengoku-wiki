import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CANONICAL_SLOTS, validateManifest, loadManifest, createSelection, selectVariant, randomizeSelection, serializeSelection, parseSelection, addPortrait, composePortrait, exportPNG, missingRequiredSlots, canRandomizeSelection, isCompanionBound, resolveCompanionSlots } from '../portrait-state.mjs';
import { validatePortraitWorkflow, workflowCapabilities } from '../../../Tool/art/portrait/portrait-gateway.mjs';

const hash = 'a'.repeat(64);
const SELECTABLE = new Set(['bg', 'face_base', 'mouth', 'nose', 'eyes_white', 'eyes_shape', 'eyes_color', 'clothes', 'headgear', 'acc_eye', 'frame']);
function modeFor(sex, id) {
  if (id === 'hair') return 'selectable';
  if (SELECTABLE.has(id)) return 'selectable';
  if (['headgear_back', 'headgear_mid', 'clothes_back', 'clothes_front'].includes(id) || (sex === 'female' && id === 'hair_back')) return 'companion';
  if ((sex === 'female' && ['beard', 'beard_back'].includes(id)) || (sex === 'male' && ['hair_back', 'beard_back'].includes(id))) return 'disabled';
  return 'fixed';
}

function workflowFixture(statuses = ['PASS', 'PASS', 'PASS', 'PASS']) {
  const evidence = index => statuses[index] === 'PASS'
    ? [{ path: `evidence/gateway-${index + 1}.json`, sha256: String(index + 1).repeat(64) }]
    : [];
  return {
    version: 1, active_profile: 'reference075',
    profiles: {
      reference055: {
        label: '보존형 0.55', mode: 'preservation',
        source: { path: 'references/reference055.png', sha256: '5'.repeat(64) },
        gates: Object.fromEntries(statuses.map((status, index) => [`gateway${index + 1}`, { status, evidence: evidence(index) }]))
      },
      reference075: {
        label: '변형형 0.75', mode: 'variation',
        source: { path: 'references/reference075.png', sha256: '7'.repeat(64) },
        gates: Object.fromEntries(statuses.map((status, index) => [`gateway${index + 1}`, { status, evidence: evidence(index) }]))
      }
    },
    tools: [
      { id: 'comfyui', label: 'ComfyUI', role: 'source', unlock_after: 0 },
      { id: 'see-through', label: 'see-through', role: 'split', unlock_after: 0 },
      { id: 'anime25d', label: 'Anime2.5DRig', role: 'quick-rig', unlock_after: 1 },
      { id: 'standrig', label: 'StandRig', role: 'precision-rig', unlock_after: 1 },
      { id: 'composite', label: '동적 슬롯 합성', role: 'combination', unlock_after: 2 }
    ]
  };
}

// Synthetic state fixture only. These paths are not a production art library.
function fixture() {
  return {
    version: 1, canvas: { width: 1145, height: 1374 },
    logical_bundles: {
      clothes: { label: '의상', primary: 'clothes', members: ['clothes_back', 'clothes', 'clothes_front'] },
      hair: { label: '헤어', primary: 'hair', members: ['hair_back', 'hair'] },
      face_shape: { label: '얼굴형', primary: 'face_base', members: ['face_base', 'cheeks', 'chin'] },
    },
    slots: CANONICAL_SLOTS.map(slot => ({ ...slot })),
    sexes: Object.fromEntries(['female', 'male'].map(sex => [sex, { slots: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => {
      const mode = modeFor(sex, id);
      const count = mode === 'selectable' ? 2 : mode === 'fixed' ? 1 : mode === 'companion' ? 2 : 0;
      const primary = id.startsWith('headgear_') ? 'headgear' : id.startsWith('clothes_') ? 'clothes' : 'hair';
      return [id, { mode, enabled: mode !== 'disabled', variants: ['a', 'b'].slice(0, count).map(v => ({
        id: mode === 'companion' ? `${id}-${v}` : v, path: `synthetic/${sex}/${id}-${v}.png`, sha256: hash,
        ...(mode === 'companion' ? { companion_of: { slot: primary, variant: v } } : {}),
      })) }];
    })) }]))
  };
}

test('permanent workflow gateways are required and cannot pass out of order', () => {
  assert.throws(() => validatePortraitWorkflow({ version: 1 }), /profiles/);
  const invalid = workflowFixture();
  invalid.profiles.reference075.gates.gateway1.status = 'NOT_VERIFIED';
  invalid.profiles.reference075.gates.gateway2.status = 'PASS';
  assert.throws(() => validatePortraitWorkflow(invalid), /1차|순서/);
});

test('workflow capabilities unlock through combination review and gateway 4 curation', () => {
  const cases = [
    { states: ['IN_PROGRESS', 'BLOCKED', 'BLOCKED', 'BLOCKED'], expected: [false, false, false, false] },
    { states: ['PASS', 'IN_PROGRESS', 'BLOCKED', 'BLOCKED'], expected: [true, false, false, false] },
    { states: ['PASS', 'PASS', 'IN_PROGRESS', 'BLOCKED'], expected: [true, true, false, false] },
    { states: ['PASS', 'PASS', 'PASS', 'IN_PROGRESS'], expected: [true, true, true, false] },
    { states: ['PASS', 'PASS', 'PASS', 'PASS'], expected: [true, true, true, true] }
  ];
  for (const { states, expected } of cases) {
    const caps = workflowCapabilities(validatePortraitWorkflow(workflowFixture(states)));
    assert.deepEqual([caps.rig, caps.combinations, caps.combinationAccepted, caps.export], expected);
  }
});

test('canonical IDs and z match the read-only Tool schema', async () => {
  const schema = JSON.parse(await readFile(new URL('../../../Tool/art/portrait/portrait-layer-slots.json', import.meta.url)));
  assert.deepEqual(CANONICAL_SLOTS.map(({ id, z }) => ({ id, z })), schema.slots.map(({ id, z }) => ({ id, z })));
});

test('both sexes retain every explicitly classified slot', () => {
  const m = validateManifest(fixture());
  for (const sex of ['female', 'male']) {
    const s = createSelection(m, sex);
    assert.equal(Object.keys(s.selections).length, CANONICAL_SLOTS.length);
    for (const { id } of CANONICAL_SLOTS) assert.equal(m.sexes[sex].slots[id].mode, modeFor(sex, id));
  }
  const invalid = fixture(); invalid.sexes.female.slots.beard.mode = 'fixed'; invalid.sexes.female.slots.beard.enabled = true;
  assert.throws(() => validateManifest(invalid), /beard/);
});

test('selection changes selectable slots and fixed slots only toggle visibility', () => {
  const m = fixture(), original = createSelection(m, 'male');
  const next = selectVariant(m, original, 'eyes_shape', 'b');
  assert.equal(original.selections.eyes_shape, 'a');
  assert.equal(next.selections.eyes_shape, 'b');
  assert.equal(selectVariant(m, next, 'hair', 'b').selections.hair, 'b');
  assert.equal(selectVariant(m, next, 'beard', null).selections.beard, null);
  assert.throws(() => selectVariant(m, next, 'beard', 'invented'));
  assert.throws(() => selectVariant(m, next, 'eyes_shape', 'invented'));
  assert.throws(() => selectVariant(m, next, 'eyes_shape', null));
  assert.throws(() => selectVariant(m, createSelection(m), 'beard', 'a'));
});

test('mounted candidate overrides one physical slot without mutating selection', async () => {
  const m = validateManifest(fixture());
  const selection = createSelection(m, 'female');
  const before = structuredClone(selection);
  const loaded = [];
  const canvas = { width: 0, height: 0, getContext: () => ({
    clearRect() {}, drawImage(image) { loaded.push(image.id); },
    globalCompositeOperation: 'source-over',
  }) };
  const imageLoader = async url => ({ id: url, naturalWidth: 1145, naturalHeight: 1374 });
  await composePortrait(canvas, m, selection, 'https://example.test/assets/v2/library.json', imageLoader,
    [{ slot: 'hair', path: 'curation/candidate.png', blend_mode: 'source-over' }]);
  assert.deepEqual(selection, before);
  assert.ok(loaded.some(url => url.endsWith('/assets/v2/curation/candidate.png')));
  assert.equal(loaded.some(url => url.endsWith('/synthetic/female/hair-a.png')), false);
});

test('hair is one optional logical control and none removes bundled rear hair', () => {
  const m = validateManifest(fixture());
  const female = createSelection(m, 'female');
  assert.equal(CANONICAL_SLOTS.find(slot => slot.id === 'hair').required, false);
  assert.equal(CANONICAL_SLOTS.find(slot => slot.id === 'hair').label, '헤어');
  assert.notEqual(female.selections.hair_back, null);
  const bald = selectVariant(m, female, 'hair', null);
  assert.equal(bald.selections.hair, null);
  assert.equal(bald.selections.hair_back, null);
  assert.equal(missingRequiredSlots(m, bald).some(slot => slot.id === 'hair'), false);
});

test('fixed slots can be explicitly hidden and restored without becoming randomizable', () => {
  const m = validateManifest(fixture());
  const original = createSelection(m, 'male');
  assert.equal(original.selections.neck, 'a');
  const hidden = selectVariant(m, original, 'neck', null);
  assert.equal(hidden.selections.neck, null);
  assert.deepEqual(parseSelection(m, serializeSelection(m, hidden)), hidden);
  const randomized = randomizeSelection(m, hidden, () => 0.9);
  assert.equal(randomized.selections.neck, null);
  const restored = selectVariant(m, hidden, 'neck', 'a');
  assert.equal(restored.selections.neck, 'a');
  assert.throws(() => selectVariant(m, hidden, 'neck', 'invented'));
});

test('randomize uses actual enabled variants, skips disabled entries, and avoids identical consecutive selections', () => {
  const m = fixture(), initial = createSelection(m);
  const next = randomizeSelection(m, initial, () => 0);
  assert.notDeepEqual(next, initial);
  assert.equal(next.selections.beard, null);
  for (const { id } of m.slots) {
    const entry = m.sexes.female.slots[id];
    if (entry.mode === 'selectable' || entry.mode === 'fixed') assert.ok(entry.variants.some(v => v.id === next.selections[id]));
  }
  assert.notDeepEqual(randomizeSelection(m, next, () => 0.999), next);
});

test('randomize is unavailable when the selected sex has only one combination', () => {
  const m = fixture();
  for (const entry of Object.values(m.sexes.male.slots)) if (entry.mode === 'selectable') entry.variants = entry.variants.slice(0, 1);
  const male = createSelection(m, 'male');
  assert.equal(canRandomizeSelection(m, male), false);
  m.sexes.male.slots.eyes_color.variants.push({ id: 'b', path: 'synthetic/male/eyes_color-b.png' });
  assert.equal(canRandomizeSelection(m, male), true);
});

test('companion layers follow their primary variant and drop when it changes', () => {
  const m = fixture();
  m.sexes.male.slots.headgear_mid.variants = [
    { id: 'hood-mid', path: 'synthetic/male/headgear_mid-hood.png', sha256: hash, companion_of: { slot: 'headgear', variant: 'b' } }
  ];
  m.sexes.male.slots.clothes_back.variants = [
    { id: 'collar-a', path: 'synthetic/male/clothes_back-a.png', sha256: hash, companion_of: { slot: 'clothes', variant: 'a' } },
    { id: 'collar-b', path: 'synthetic/male/clothes_back-b.png', sha256: hash, companion_of: { slot: 'clothes', variant: 'b' } }
  ];
  const valid = validateManifest(m);
  assert.equal(isCompanionBound(valid, 'male', 'headgear_mid'), true);
  assert.equal(isCompanionBound(valid, 'male', 'headgear'), false);

  // The hood's fold layer is legally absent under a hat instead of being drawn over the face.
  const base = createSelection(valid, 'male');
  assert.equal(base.selections.headgear, 'a');
  assert.equal(base.selections.headgear_mid, null);
  assert.equal(base.selections.clothes_back, 'collar-a');
  assert.equal(selectVariant(valid, base, 'headgear', 'b').selections.headgear_mid, 'hood-mid');

  // Changing the garment swaps its collar instead of keeping the previous outfit's.
  assert.equal(selectVariant(valid, base, 'clothes', 'b').selections.clothes_back, 'collar-b');

  // A companion is derived, never freely chosen, and an incoherent pair is refused.
  const hooded = selectVariant(valid, base, 'headgear', 'b');
  assert.throws(() => selectVariant(valid, hooded, 'headgear_mid', null), /선택할 수 없는/);
  const logical = JSON.parse(serializeSelection(valid, base));
  logical.selections.clothes_back = 'collar-b';
  assert.throws(() => parseSelection(valid, JSON.stringify(logical)), /파생 슬롯/);

  for (const rng of [() => 0, () => 0.9]) {
    const random = randomizeSelection(valid, base, rng);
    assert.deepEqual(random, resolveCompanionSlots(valid, random));
  }
});

test('companion links must target an optional slot, an existing variant and one level only', () => {
  const required = fixture();
  required.sexes.male.slots.hair.variants[0].companion_of = { slot: 'clothes', variant: 'a' };
  assert.throws(() => validateManifest(required), /companion|bundle/);

  const dangling = fixture();
  dangling.sexes.male.slots.headgear_mid.variants = [
    { id: 'x', path: 'synthetic/male/x.png', sha256: hash, companion_of: { slot: 'headgear', variant: 'missing' } }
  ];
  assert.throws(() => validateManifest(dangling), /companion/);

  const chained = fixture();
  chained.sexes.male.slots.headgear_mid.variants = [
    { id: 'mid', path: 'synthetic/male/mid.png', sha256: hash, companion_of: { slot: 'headgear', variant: 'a' } }
  ];
  chained.sexes.male.slots.headgear_back.variants = [
    { id: 'back', path: 'synthetic/male/back.png', sha256: hash, companion_of: { slot: 'headgear_mid', variant: 'mid' } }
  ];
  assert.throws(() => validateManifest(chained), /companion/);
});

test('serialization round trips validated selections and history stores independent portraits', () => {
  const m = fixture(), first = createSelection(m), second = randomizeSelection(m, first, () => 0.8);
  const json = serializeSelection(m, second);
  assert.deepEqual(parseSelection(m, json), second);
  const history = addPortrait(addPortrait([], first, 'one'), second, 'two');
  first.selections.eyes_shape = 'b';
  assert.equal(history[0].selection.selections.eyes_shape, 'a');
  assert.equal(history.length, 2);
  assert.throws(() => parseSelection(m, '{'));
  const logical = JSON.parse(json);
  assert.equal(logical.version, 2);
  assert.ok(!Object.hasOwn(logical.selections, 'clothes_back'));
  assert.ok(!Object.hasOwn(logical.selections, 'hair_back'));
  assert.throws(() => parseSelection(m, JSON.stringify({ ...logical, sex: 'other' })));
  assert.throws(() => parseSelection(m, JSON.stringify({ ...logical, selections: { ...logical.selections, clothes_back: 'a' } })));
});

test('manifest boundary reports malformed, incomplete and load failures without fallback', async () => {
  for (const mutate of [m => m.version = 2, m => m.canvas.width = 1, m => m.slots.pop(), m => m.slots[0].z = 21,
    m => delete m.sexes.male.slots.hair, m => m.sexes.male.slots.eyes_shape.variants.push({ id: 'a', path: 'duplicate.png', sha256: hash }),
    m => m.sexes.male.slots.hair.variants[0].path = '', m => m.sexes.male.slots.hair.variants[0].path = '../outside.png',
    m => m.sexes.male.slots.hair.variants[0].path = 'https://example.test/a.png', m => m.stage = 1]) {
    const m = fixture(); mutate(m); assert.throws(() => validateManifest(m));
  }
  await assert.rejects(loadManifest('https://example.test/library.json', async () => ({ ok: false, status: 404 })), /404/);
  await assert.rejects(loadManifest('https://example.test/library.json', async () => { throw new Error('offline'); }), /offline/);
  await assert.rejects(loadManifest('https://example.test/library.json', async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } })), /bad JSON/);
  assert.deepEqual(await loadManifest('https://example.test/library.json', async () => ({ ok: true, json: async () => fixture() })), fixture());
});

test('selectable libraries expose actual count and never invent variants', () => {
  const m = fixture(); m.sexes.male.slots.eyes_shape.variants = [];
  validateManifest(m);
  assert.equal(createSelection(m, 'male').selections.eyes_shape, null);
  assert.equal(randomizeSelection(m, createSelection(m, 'male')).selections.eyes_shape, null);
});

test('stage23 preview permits explicit sex-specific evidence assets and honest optional gaps', () => {
  const m = fixture();
  m.stage = 'stage23-preview';
  m.sexes.male.slots.eyes_shape.variants = [];
  m.sexes.male.slots.eyes_shape.preview_optional = true;
  m.sexes.male.slots.eyes_color.variants = [{
    id: 'male-eyes-preview',
    path: '/.omo/evidence/portrait-stage23/pilot/male/eyes/reference-quality-v1/eyes_shape.png',
    quality: 'PREVIEW', sha256: hash,
    sex: 'male'
  }];
  const valid = validateManifest(m);
  const selection = createSelection(valid, 'male');
  assert.equal(selection.selections.eyes_shape, null);
  assert.deepEqual(missingRequiredSlots(valid, selection), []);

  const wrongSex = structuredClone(m);
  wrongSex.sexes.male.slots.eyes_color.variants[0].sex = 'female';
  assert.throws(() => validateManifest(wrongSex), /path/);

  const untrustedAbsolute = structuredClone(m);
  untrustedAbsolute.sexes.male.slots.eyes_color.variants[0].path = '/tmp/eyes.png';
  assert.throws(() => validateManifest(untrustedAbsolute), /path/);
});

test('composition loads common-size images and draws native source-over in ascending z', async () => {
  const m = fixture(); m.slots.reverse();
  const draws = [], context = { clearRect() {}, drawImage(...args) { draws.push(args); } };
  const canvas = { width: 0, height: 0, getContext: () => context };
  await composePortrait(canvas, m, createSelection(m, 'male'), 'https://example.test/library.json', async url => ({ url, naturalWidth: 1145, naturalHeight: 1374 }));
  assert.deepEqual([canvas.width, canvas.height], [1145, 1374]);
  assert.equal(context.globalCompositeOperation, 'source-over');
  assert.deepEqual(draws.map(([image]) => new URL(image.url).pathname.split('/').pop()), CANONICAL_SLOTS
    .filter(({ id }) => createSelection(m, 'male').selections[id] !== null).map(({ id }) => `${id}-a.png`));
  assert.ok(draws.every(args => args.length === 3 && args[1] === 0 && args[2] === 0));
});

test('composition resolves a conditional render plate without changing the logical selection', async () => {
  const m = fixture();
  m.sexes.male.slots.hair.variants[0].render_overrides = [{
    when: { slot: 'headgear', variant: 'a' }, path: 'synthetic/male/hair-a-under-headgear-a.png', sha256: hash
  }];
  const valid = validateManifest(m), selection = createSelection(valid, 'male');
  const loaded = [];
  const canvas = { getContext: () => ({ clearRect() {}, drawImage() {} }) };
  await composePortrait(canvas, valid, selection, 'https://example.test/library.json', async url => {
    loaded.push(url); return { naturalWidth: 1145, naturalHeight: 1374 };
  });
  assert.equal(selection.selections.hair, 'a');
  assert.ok(loaded.some(url => url.endsWith('/synthetic/male/hair-a-under-headgear-a.png')));
  assert.ok(!loaded.some(url => url.endsWith('/synthetic/male/hair-a.png')));
});

test('render overrides fail closed on missing targets, duplicate conditions and invalid hashes', () => {
  const missing = fixture();
  missing.sexes.male.slots.hair.variants[0].render_overrides = [{
    when: { slot: 'headgear', variant: 'missing' }, path: 'synthetic/male/missing.png', sha256: hash
  }];
  assert.throws(() => validateManifest(missing), /조건 대상/);

  const duplicate = fixture();
  duplicate.sexes.male.slots.hair.variants[0].render_overrides = [0, 1].map(() => ({
    when: { slot: 'headgear', variant: 'a' }, path: 'synthetic/male/duplicate.png', sha256: hash
  }));
  assert.throws(() => validateManifest(duplicate), /중복/);

  const invalidHash = fixture();
  invalidHash.sexes.male.slots.hair.variants[0].render_overrides = [{
    when: { slot: 'headgear', variant: 'a' }, path: 'synthetic/male/bad-hash.png', sha256: 'bad'
  }];
  assert.throws(() => validateManifest(invalidHash), /sha256/);
});

test('composition surfaces asset/dimension failures and never draws partial success', async () => {
  const m = fixture(); let draws = 0;
  const canvas = { getContext: () => ({ clearRect() {}, drawImage() { draws++; } }) };
  await assert.rejects(composePortrait(canvas, m, createSelection(m), 'https://example.test/library.json', async () => { throw new Error('missing PNG'); }), /missing PNG/);
  await assert.rejects(composePortrait(canvas, m, createSelection(m), 'https://example.test/library.json', async () => ({ naturalWidth: 1, naturalHeight: 1 })), /1145/);
  assert.equal(draws, 0);
});

test('PNG export uses image/png and reports encoder failure', async () => {
  const blob = new Blob(['synthetic'], { type: 'image/png' });
  assert.equal(await exportPNG({ toBlob(callback, type) { assert.equal(type, 'image/png'); callback(blob); } }), blob);
  await assert.rejects(exportPNG({ toBlob(callback) { callback(null); } }));
  await assert.rejects(exportPNG({ toBlob() { throw new Error('tainted'); } }), /tainted/);
});
