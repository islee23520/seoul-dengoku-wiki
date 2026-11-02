import assert from 'node:assert/strict';
import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Ajv2020 from 'ajv/dist/2020.js';
import { neutralRecord, slotFields } from '../neutral-slots.mjs';
import { emit } from './emit-character-prompt.mjs';

const trait = value => ({ value, status: value === null ? 'unknown' : 'art-proposal', source: value === null ? null : 'owner-source' });
const schema = JSON.parse(readFileSync(new URL('./character.schema.json', import.meta.url), 'utf8'));
const faceSchema = JSON.parse(readFileSync(new URL('./face-selection.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: false });
ajv.addSchema({ ...schema, $id: new URL('character.schema.json', faceSchema.$id).href });
ajv.addSchema({ ...faceSchema, $id: new URL('face-selection.schema.json', schema.$id).href });
const validate = ajv.compile(schema);
const hash = 'a'.repeat(64);

function slots() {
  const result = Object.fromEntries(Object.entries(slotFields).map(([slot, keys]) => [slot, Object.fromEntries(keys.map(key => [key, trait(slot + '-' + key)]))]));
  result.body.weight = { ...trait(72), unit: 'kg' };
  result.body.height = { ...trait(178), unit: 'cm' };
  return result;
}

function current() {
  return {
    schemaVersion: 2, characterId: 'K998', name: 'Ilseob', personId: 'person-0998', approval: 'art-proposal',
    faceMode: { kind: 'template', variantId: 'east-asian-male-01' },
    faceSelection: { gender: 'male', ancestry: 'east-asian', source: 'authored-recipient-group-selection', skinTone: trait('authored tone') },
    uniqueFaceRequired: false, uniqueFaceSource: null,
    identity: { characterId: 'K998', name: 'Ilseob', ethnicity: trait('Korean'), origin: trait('Korean'), gender: '남성', ageCategory: 'adult' },
    slots: slots(),
  };
}

function canonical() {
  return {
    characterId: 'K998', name: 'Ilseob', personId: 'person-0998',
    registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: hash },
    background: [{ path: 'lore/characters/card.json', pointer: '/content/0', sha256: hash, text: '' }],
  };
}

function birth() {
  return { birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31', source: 'authored fixture' };
}

async function catalogFixture(t) {
  const base = new URL('../../../.omo/evidence/catalog-st01a11078/fixtures/', import.meta.url);
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(fileURLToPath(base), 'case-'));
  t.onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const character = JSON.parse(readFileSync(new URL('./characters/shin-jongmok.json', import.meta.url), 'utf8'));
  const catalog = JSON.parse(readFileSync(new URL('./options.json', import.meta.url), 'utf8'));
  const referencePath = join(dir, 'reference.bin');
  const stylePath = join(dir, 'style.json');
  const bytes = Buffer.from('provider-free catalog reference');
  await writeFile(referencePath, bytes);
  await writeFile(stylePath, JSON.stringify({ styleId: 'catalog-fixture', status: 'owner-selected-reference', referenceSha256: createHash('sha256').update(bytes).digest('hex') }));
  return { dir, character, catalog, referencePath, stylePath, mode: 'portrait' };
}

test('custom options catalog values and provenance reach API and fresh CLI emission', async t => {
  const f = await catalogFixture(t);
  const choice = { id: 'custom-mood', label: 'custom mood value', source: 'custom-catalog', status: 'art-proposal' };
  f.catalog.categories.mood.push(choice);
  const optionsPath = join(f.dir, 'options.json');
  const characterPath = join(f.dir, 'character.json');
  await writeFile(optionsPath, JSON.stringify(f.catalog));
  await writeFile(characterPath, JSON.stringify(f.character));
  const result = await emit({ ...f, optionsPath, overrides: { mood: choice.id } });
  assert.deepEqual(result.choices.mood, choice);
  const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('./emit-character-prompt.mjs', import.meta.url)), '--character', characterPath, '--mode', f.mode, '--reference', f.referencePath, '--style', f.stylePath, '--options', optionsPath, '--mood', choice.id], { timeout: 10000 });
  assert.deepEqual(JSON.parse(stdout).choices.mood, choice);
});

test('a missing supplied catalog rejects instead of silently using defaults', async t => {
  const f = await catalogFixture(t);
  await assert.rejects(emit({ ...f, optionsPath: join(f.dir, 'absent.json') }), { code: 'ENOENT' });
});

test('authored mood and occupation resolve catalog IDs or labels and explicit overrides win', async t => {
  const f = await catalogFixture(t);
  const mood = f.catalog.categories.mood.find(entry => entry.id === 'weary');
  const occupation = f.catalog.categories.occupation.find(entry => entry.id === 'field-contractor');
  for (const character of [f.character, { ...f.character, mood: mood.label, occupation: occupation.label }]) {
    const result = await emit({ ...f, character });
    assert.deepEqual(result.choices.mood, mood);
    assert.deepEqual(result.choices.occupation, occupation);
  }
  const overridden = await emit({ ...f, character: { ...f.character, mood: 'unknown-mood', occupation: 'unknown-occupation' }, overrides: { mood: 'calm', occupation: 'courier' } });
  assert.deepEqual(overridden.choices.mood, f.catalog.categories.mood.find(entry => entry.id === 'calm'));
  assert.deepEqual(overridden.choices.occupation, f.catalog.categories.occupation.find(entry => entry.id === 'courier'));
});

test('unknown authored local mood or occupation rejects but wiki occupation retains its role', async t => {
  const f = await catalogFixture(t);
  for (const key of ['mood', 'occupation']) {
    await assert.rejects(emit({ ...f, character: { ...f.character, [key]: 'unknown-local-choice' } }), new RegExp('invalid ' + key + ' option'));
  }
  const character = { ...current(), faceMode: { kind: 'unique', variantId: null }, mood: 'unknown-wiki-mood', occupation: 'unknown-wiki-occupation', facts: { role: 'authored wiki role' } };
  const result = await emit({ ...f, character });
  assert.deepEqual(result.choices.occupation, { label: character.facts.role });
  assert.equal(result.choices.mood, undefined);
});

test('only an explicit upper override changes the outfit ID with the edited look', async t => {
  const f = await catalogFixture(t);
  assert.equal((await emit(f)).outfitId, f.character.outfit.id);
  const variantId = 'catalog-changed-look';
  assert.equal((await emit({ ...f, overrides: { variantId } })).outfitId, f.character.outfit.id);
  const edited = await emit({ ...f, overrides: { upper: 'black-wine-gothic', variantId } });
  assert.equal(edited.lookId, variantId);
  assert.equal(edited.outfitId, f.character.outfit.id + '-' + variantId);
});

test('approved equipped items survive whole export and equipment part with catalog defaults', async t => {
  const f = await catalogFixture(t);
  const item = { id: 'authored-item', description: 'AUTHORED_EQUIPMENT_SENTINEL', status: 'approved', source: 'authored-equipment-record' };
  const character = structuredClone(f.character);
  character.equipment.equipped.push(item);
  const inputSnapshot = structuredClone(character);
  const whole = await emit({ ...f, character, mode: 'portrait' });
  assert.deepEqual(whole.equipment.equipped, [item]);
  assert.deepEqual(character, inputSnapshot);
  assert.ok(whole.prompt.includes(item.description));
  assert.ok(!whole.prompt.includes(f.character.equipment.narrativeOnly[0].description));
  assert.equal(whole.choices.mood.id, 'weary');
  assert.equal(whole.choices.occupation.id, 'field-contractor');
  const exported = neutralRecord(character);
  assert.deepEqual(exported.equipment, character.equipment);
  assert.deepEqual(neutralRecord(exported).equipment, character.equipment);
  const part = await emit({ ...f, character, mode: 'full-body', part: 'equipment' });
  assert.deepEqual(part.partProperties, [item.description]);
  for (const status of ['authored-draft', 'art-proposal']) {
    await assert.rejects(emit({ ...f, character: withEquipped(character, [{ ...item, status }]), mode: 'portrait' }), /equipped item must be approved and sourced/);
  }
  await assert.rejects(emit({ ...f, character: withEquipped(character, [{ ...item, id: '' }]), mode: 'portrait' }), /character schema/);
  await assert.rejects(emit({ ...f, mode: 'full-body', part: 'equipment' }), /part equipment has no specified value/);
});

function withEquipped(character, equipped) {
  const clone = structuredClone(character);
  clone.equipment.equipped = equipped;
  return clone;
}

test('neutral export round-trips current metadata, legacy v1 and null metadata', async () => {
  const exported = neutralRecord(current());
  assert.equal(validate(exported), true, JSON.stringify(validate.errors));
  assert.deepEqual(neutralRecord(exported), exported);
  assert.equal(exported.faceMode.kind, 'template');
  assert.equal(exported.uniqueFaceSource, null);

  const withContext = neutralRecord({ ...current(), canonicalContext: canonical(), birthContext: birth(), uniqueFaceRequired: true, uniqueFaceSource: { characterId: 'K998', source: 'authored-ruler-ledger' }, faceMode: { kind: 'unique', variantId: null } });
  assert.equal(validate(withContext), true, JSON.stringify(validate.errors));
  assert.deepEqual(neutralRecord(withContext).canonicalContext, canonical());
  assert.deepEqual(neutralRecord(withContext).birthContext, birth());

  const legacy = JSON.parse(readFileSync(new URL('./characters/shin-jongmok.json', import.meta.url), 'utf8'));
  const legacyExport = neutralRecord(legacy);
  assert.equal(legacyExport.schemaVersion, 2);
  assert.equal(legacyExport.faceMode, null);
  assert.equal(validate(legacyExport), true, JSON.stringify(validate.errors));
  assert.deepEqual(neutralRecord(legacyExport), legacyExport);
});

test('published wiki token normalizes and unknown roots or malformed provenance fail before provider execution', async () => {
  const published = { schemaVersion: 1, personId: 'person-0088', characterId: 'K423', name: 'Local', stateId: 'S04', approval: 'art-proposal', facts: { gender: '남성', genderUserLocked: false, role: 'test role' }, artProposal: { description: 'authored description', approvedAppearance: null, approvedOutfit: null, approvedEquipmentIds: [], approvalNote: 'draft', face: 'face', hair: 'hair', upper: 'coat', lower: null, footwear: null, accessories: null }, style: { styleId: 'selected', referenceSha256: hash, portraitShotId: 'medium-close-up-119', crop: 'bust', referenceRole: 'technique-only' }, image: { path: '/portraits/person-0088.png', sha256: hash, width: 1160, height: 1355 }, imageReview: { record: '/portrait-reviews/person-0088.json', imageSha256: hash, verdict: 'pending', scope: 'portrait' } };
  assert.equal(validate(published), true, JSON.stringify(validate.errors));
  const exported = neutralRecord(published);
  assert.equal(exported.personId, published.personId);
  assert.equal(validate(exported), true, JSON.stringify(validate.errors));

  assert.throws(() => neutralRecord({ ...current(), unknownRoot: true }), /character schema/);
  const objectProvenance = current();
  objectProvenance.slots.face.description.source = { unexpected: 'object' };
  assert.throws(() => neutralRecord(objectProvenance), /character schema/);
  assert.throws(() => neutralRecord({ ...current(), slots: { ...slots(), face: { ...slots().face, description: trait('   ') } } }), /sourced value required/);
});
