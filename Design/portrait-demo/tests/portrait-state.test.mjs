import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CANONICAL_SLOTS, validateManifest, loadManifest, createSelection, selectVariant, randomizeSelection, serializeSelection, parseSelection, addPortrait, composePortrait, exportPNG } from '../portrait-state.mjs';

// Synthetic state fixture only. These paths are not a production art library.
function fixture() {
  return {
    version: 1, canvas: { width: 1145, height: 1374 },
    slots: CANONICAL_SLOTS.map(slot => ({ ...slot })),
    sexes: Object.fromEntries(['female', 'male'].map(sex => [sex, { slots: Object.fromEntries(CANONICAL_SLOTS.map(({ id }) => {
      const enabled = sex !== 'female' || !['beard', 'beard_back'].includes(id);
      return [id, { enabled, variants: enabled ? ['a', 'b'].map(v => ({ id: v, path: `synthetic/${sex}/${id}-${v}.png` })) : [] }];
    })) }]))
  };
}

test('canonical 22 IDs and z match the read-only Tool schema', async () => {
  const schema = JSON.parse(await readFile(new URL('../../../Tool/art/portrait/portrait-layer-slots.json', import.meta.url)));
  assert.deepEqual(CANONICAL_SLOTS.map(({ id, z }) => ({ id, z })), schema.slots.map(({ id, z }) => ({ id, z })));
});

test('both sexes retain 22 slots; female beard layers are disabled and empty', () => {
  const m = validateManifest(fixture());
  for (const sex of ['female', 'male']) {
    const s = createSelection(m, sex);
    assert.equal(Object.keys(s.selections).length, 22);
    for (const id of ['beard', 'beard_back']) assert.equal(s.selections[id], sex === 'female' ? null : 'a');
  }
  const invalid = fixture(); invalid.sexes.female.slots.beard.enabled = true;
  assert.throws(() => validateManifest(invalid), /beard/);
});

test('selection accepts actual enabled variants and optional absence only', () => {
  const m = fixture(), original = createSelection(m, 'male');
  const next = selectVariant(m, original, 'hair', 'b');
  assert.equal(original.selections.hair, 'a');
  assert.equal(next.selections.hair, 'b');
  assert.equal(selectVariant(m, next, 'beard', null).selections.beard, null);
  assert.throws(() => selectVariant(m, next, 'hair', 'invented'));
  assert.throws(() => selectVariant(m, next, 'hair', null));
  assert.throws(() => selectVariant(m, createSelection(m), 'beard', 'a'));
});

test('randomize uses actual enabled variants, skips disabled entries, and avoids identical consecutive selections', () => {
  const m = fixture(), initial = createSelection(m);
  const next = randomizeSelection(m, initial, () => 0);
  assert.notDeepEqual(next, initial);
  assert.equal(next.selections.beard, null);
  for (const { id } of m.slots) {
    const entry = m.sexes.female.slots[id];
    if (entry.enabled) assert.ok(entry.variants.some(v => v.id === next.selections[id]));
  }
  assert.notDeepEqual(randomizeSelection(m, next, () => 0.999), next);
});

test('serialization round trips validated selections and history stores independent portraits', () => {
  const m = fixture(), first = createSelection(m), second = randomizeSelection(m, first, () => 0.8);
  const json = serializeSelection(m, second);
  assert.deepEqual(parseSelection(m, json), second);
  const history = addPortrait(addPortrait([], first, 'one'), second, 'two');
  first.selections.hair = 'b';
  assert.equal(history[0].selection.selections.hair, 'a');
  assert.equal(history.length, 2);
  assert.throws(() => parseSelection(m, '{'));
  assert.throws(() => parseSelection(m, JSON.stringify({ ...second, sex: 'other' })));
  assert.throws(() => parseSelection(m, JSON.stringify({ ...second, selections: { ...second.selections, beard: 'a' } })));
});

test('manifest boundary reports malformed, incomplete and load failures without fallback', async () => {
  for (const mutate of [m => m.version = 2, m => m.canvas.width = 1, m => m.slots.pop(), m => m.slots[0].z = 21,
    m => delete m.sexes.male.slots.hair, m => m.sexes.male.slots.hair.variants.push({ id: 'a', path: 'duplicate.png' }),
    m => m.sexes.male.slots.hair.variants[0].path = '']) {
    const m = fixture(); mutate(m); assert.throws(() => validateManifest(m));
  }
  await assert.rejects(loadManifest('https://example.test/library.json', async () => ({ ok: false, status: 404 })), /404/);
  await assert.rejects(loadManifest('https://example.test/library.json', async () => { throw new Error('offline'); }), /offline/);
  await assert.rejects(loadManifest('https://example.test/library.json', async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } })), /bad JSON/);
  assert.deepEqual(await loadManifest('https://example.test/library.json', async () => ({ ok: true, json: async () => fixture() })), fixture());
});

test('incomplete library exposes actual count, never invents variants', () => {
  const m = fixture(); m.sexes.male.slots.hair.variants = [];
  validateManifest(m);
  assert.equal(createSelection(m, 'male').selections.hair, null);
  assert.equal(randomizeSelection(m, createSelection(m, 'male')).selections.hair, null);
});

test('composition loads common-size images and draws native source-over in ascending z', async () => {
  const m = fixture(); m.slots.reverse();
  const draws = [], context = { clearRect() {}, drawImage(...args) { draws.push(args); } };
  const canvas = { width: 0, height: 0, getContext: () => context };
  await composePortrait(canvas, m, createSelection(m, 'male'), 'https://example.test/library.json', async url => ({ url, naturalWidth: 1145, naturalHeight: 1374 }));
  assert.deepEqual([canvas.width, canvas.height], [1145, 1374]);
  assert.equal(context.globalCompositeOperation, 'source-over');
  assert.deepEqual(draws.map(([image]) => new URL(image.url).pathname.split('/').pop()), CANONICAL_SLOTS.map(({ id }) => `${id}-a.png`));
  assert.ok(draws.every(args => args.length === 3 && args[1] === 0 && args[2] === 0));
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
