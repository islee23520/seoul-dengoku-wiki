import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { mapIdentityDomains } from './identity-values.mjs';

const axes = ['권위', '개방', '무력', '물질', '공동', '원칙', '공개', '자격', '분산', '변혁'];
const desires = ['갈망', '독점', '위험', '과시', '지속'];
const sourceNames = ['person-id-registry', 'values-cast', 'gender-cast', 'cast-hangnyeol', 'clan-hangnyeol-tables', 'gurps-cast'];
const document = (bundle, name) => bundle.files.find(file => file.logical_path === `lore/name-pools/${name}.json`).document;

function fixture() {
  const persons = [{ id: 'K088', name: '첫 사람' }, { id: 'K001', name: '둘째 사람', aliases: ['second-person'] }];
  const values = persons.toReversed().map((person, index) => ({
    name: person.name, title: '직위', stage: '주요', state: 'S01', state_name: '수문국',
    generation: 'opening', source: 'proposal', minors: false,
    values: Object.fromEntries(axes.map(axis => [axis, index ? -100 : 100])),
    desire: { ...Object.fromEntries(desires.map(axis => [axis, 0])), 지향: index ? null : '이성', 결합: '단혼' },
    ...(index ? {} : { locked: true }),
  }));
  const docs = [
    { totalPeople: 2, persons },
    { axes, desire_axes: desires, count: 2, people: values },
    { count: 2, people: persons.map(person => ({ name: person.name, state: 'S01', gender: '여성', source: '사용자 확정', user_locked: true })) },
    { people: [
      { name: '첫 사람', surname: '첫', status: 'applied', clan: 'branch', base_clan: 'base', bongwan: '서울', branch: '', reason: '근거', source_file: 'Cast-State-01.md', surname_hanja: '初', bongwan_hanja: null, sesu: 1, hangnyeol: '사', position: 'second' },
      { name: '둘째 사람', surname: '둘', status: 'no-bongwan', reason: '', source_file: 'Cast-Unaffiliated.json' },
    ], lineage: { parents: { '첫 사람': '둘째 사람' }, founder_sesu: { '둘째 사람': 40 }, person_clan: { '첫 사람': 'branch' } } },
    { clans: [{ id: 'base', surname: '첫', bongwan: '서울', rows: [] }, { id: 'branch', surname: '첫', bongwan: '서울', rows: [] }, { id: 'unused', surname: '셋', bongwan: '부산', rows: [] }] },
    { count: 2, people: persons.map(person => ({ ...person, url: person.id === 'K088' ? '/people/person-0002' : '/people/person-0001' })) },
  ];
  return { files: sourceNames.map((name, index) => ({ source_id: index + 1, logical_path: `lore/name-pools/${name}.json`, document: docs[index] })) };
}

test('preserves independent registry IDs, publication order, proposal fields and optional values', () => {
  const bundle = fixture();
  const original = structuredClone(bundle);
  const rows = mapIdentityDomains(bundle);
  assert.equal(rows.people.find(person => person.person_id === 'K088').public_route, '/people/person-0002');
  assert.deepEqual(rows.people.map(person => person.values_source_ordinal), [0, 1]);
  assert.deepEqual(rows.people.map(person => person.locked), [1, null]);
  assert.equal(rows.people[0].source_kind, 'proposal');
  assert.equal(rows.people[0].minors, 0);
  assert.deepEqual(rows.aliases, [{ person_id: 'K001', alias: 'second-person', alias_ordinal: 0 }]);
  assert.deepEqual(rows.states, [{ state_id: 'S01', name_ko: '수문국' }]);
  assert.deepEqual(rows.stateLabels, [{ state_id: 'S01', name_ko: '수문국' }]);
  assert.equal(rows.people[0].state_name, '수문국');
  assert.equal(rows.personValues.length, 20);
  assert.equal(rows.personDesires.length, 14);
  assert.deepEqual(rows.personDesires.find(row => row.person_id === 'K088' && row.axis_name === '지향'), { person_id: 'K088', axis_name: '지향', value_kind: 'text', integer_value: null, text_value: null });
  assert.deepEqual(bundle, original);
  assert.ok(Object.isFrozen(rows) && Object.values(rows).every(array => Object.isFrozen(array) && array.every(Object.isFrozen)));
});

test('preserves the complete lineage union and all canonical clans without inferred values', () => {
  const rows = mapIdentityDomains(fixture());
  const lineage = rows.lineages.find(row => row.person_id === 'K088');
  assert.deepEqual(lineage, { person_id: 'K088', surname: '첫', status: 'applied', bongwan: '서울', clan_id: 'branch', base_clan_id: 'base', branch: '', reason: '근거', source_file_label: 'Cast-State-01.md', surname_hanja: '初', bongwan_hanja: null, hangnyeol: '사', position: 'second', sesu: 1, naming_convention: null, naming_source_character_id: null, naming_source_path: null, naming_source_basis: null });
  const absent = rows.lineages.find(row => row.person_id === 'K001');
  assert.equal(absent.clan_id, null);
  assert.equal(absent.sesu, null);
  assert.equal(absent.bongwan_hanja, null);
  assert.equal(absent.reason, '');
  assert.deepEqual(rows.clans.map(({ clan_id, base_clan_id }) => ({ clan_id, base_clan_id })), [{ clan_id: 'base', base_clan_id: null }, { clan_id: 'branch', base_clan_id: 'base' }, { clan_id: 'unused', base_clan_id: null }]);
  assert.deepEqual(rows.lineageParents, [{ child_name: '첫 사람', parent_name: '둘째 사람' }]);
  assert.deepEqual(rows.lineageFounderSesu, [{ person_name: '둘째 사람', sesu: 40 }]);
  assert.deepEqual(rows.lineageClanAssignments, [{ person_id: 'K088', clan_id: 'branch' }]);
});

test('normalizes clan metadata, source order and hangnyeol rows without replacing nulls', () => {
  const bundle = fixture();
  Object.assign(document(bundle, 'clan-hangnyeol-tables').clans[0], {
    surname_hanja: '初', bongwan_hanja: null, branch: '', provenance: 'verified', hangnyeol_unconfirmed_reason: '확인 필요',
    creative_rationale: '문중 창작 근거', method_ref: '오행법', show_branches: false, sources: ['source-b', 'source-a'],
    rows: [{ sesu: 1, hangnyeol: '현', hanja: null, position: 'second' }, { sesu: 2, hangnyeol: '섭', hanja: '燮', position: 'first' }],
  });
  const rows = mapIdentityDomains(bundle);
  assert.deepEqual(rows.clans[0], { clan_id: 'base', base_clan_id: null, surname: '첫', bongwan: '서울', bongwan_hanja: null, branch: '', provenance: 'verified', hangnyeol_unconfirmed_reason: '확인 필요', source_label: null, surname_hanja: '初', creative_rationale: '문중 창작 근거', method_ref: '오행법', show_branches: 0 });
  assert.deepEqual(rows.clanSources, [{ clan_id: 'base', ordinal: 0, source_ref: 'source-b' }, { clan_id: 'base', ordinal: 1, source_ref: 'source-a' }]);
  assert.deepEqual(rows.clanHangnyeolRows, [{ clan_id: 'base', ordinal: 0, sesu: 1, hangnyeol: '현', hanja: null, position: 'second' }, { clan_id: 'base', ordinal: 1, sesu: 2, hangnyeol: '섭', hanja: '燮', position: 'first' }]);
  assert.equal(rows.clans[1].provenance, null);
  assert.equal(rows.clans[1].show_branches, null);
});

test('preserves a clan registered without a hangnyeol table', () => {
  const bundle = fixture();
  document(bundle, 'clan-hangnyeol-tables').clans.push({ id: 'new-clan', surname: '신', bongwan: '고령', hangnyeol: null, source: '소유자 추가 지시', branches: [] });
  const rows = mapIdentityDomains(bundle);
  assert.deepEqual(rows.clans.at(-1), { clan_id: 'new-clan', base_clan_id: null, surname: '신', bongwan: '고령', bongwan_hanja: null, branch: null, provenance: null, hangnyeol_unconfirmed_reason: null, source_label: '소유자 추가 지시', surname_hanja: null, creative_rationale: null, method_ref: null, show_branches: null });
  assert.equal(rows.clanHangnyeolRows.filter(row => row.clan_id === 'new-clan').length, 0);
});

test('preserves non-Korean naming provenance and distinguishes a source-only clan reference', () => {
  const bundle = fixture();
  const person = document(bundle, 'cast-hangnyeol').people[0];
  person.clan = 'DIV-K088';
  delete person.base_clan;
  person.namingConvention = 'non-korean-lineage';
  person.namingConventionSource = { characterId: 'K088', path: 'lore/name-pools/person-id-registry.json', basis: '사용자 승인' };
  const rows = mapIdentityDomains(bundle);
  assert.equal(rows.clans.some(row => row.clan_id === 'DIV-K088'), false);
  assert.equal(rows.lineages[0].clan_id, null);
  assert.deepEqual(rows.lineageSourceClans, [{ person_id: 'K088', source_ref: 'DIV-K088', source_ordinal: 0 }]);
  assert.deepEqual(Object.fromEntries(Object.entries(rows.lineages[0]).filter(([key]) => key.startsWith('naming_'))), {
    naming_convention: 'non-korean-lineage', naming_source_character_id: 'K088',
    naming_source_path: 'lore/name-pools/person-id-registry.json', naming_source_basis: '사용자 승인',
  });
});

test('preserves every state label and keeps an ambiguous state display name null', () => {
  const bundle = fixture();
  document(bundle, 'values-cast').people[1].state_name = '다른 명칭';
  const rows = mapIdentityDomains(bundle);
  assert.deepEqual(rows.states, [{ state_id: 'S01', name_ko: null }]);
  assert.deepEqual(rows.stateLabels, [{ state_id: 'S01', name_ko: '수문국' }, { state_id: 'S01', name_ko: '다른 명칭' }]);
  assert.deepEqual(rows.people.map(person => person.state_name), ['수문국', '다른 명칭']);
});

test('preserves source-named ancestors as reference nodes without issuing person IDs', () => {
  const bundle = fixture();
  const lineage = document(bundle, 'cast-hangnyeol').lineage;
  lineage.parents['둘째 사람'] = '정본 조상';
  lineage.founder_sesu['정본 조상'] = 39;
  const rows = mapIdentityDomains(bundle);
  assert.equal(rows.people.length, 2);
  assert.deepEqual(rows.lineageNodes, [{ name: '첫 사람', person_id: 'K088' }, { name: '둘째 사람', person_id: 'K001' }, { name: '정본 조상', person_id: null }]);
  assert.deepEqual(rows.lineageParents[1], { child_name: '둘째 사람', parent_name: '정본 조상' });
  assert.deepEqual(rows.lineageFounderSesu[1], { person_name: '정본 조상', sesu: 39 });
});

const invalidCases = [
  ['duplicate registry ID', 'E_PERSON_DUPLICATE_ID', b => { document(b, 'person-id-registry').persons[1].id = 'K088'; }],
  ['duplicate registry name', 'E_PERSON_DUPLICATE_NAME', b => { document(b, 'person-id-registry').persons[1].name = '첫 사람'; }],
  ['duplicate alias', 'E_PERSON_DUPLICATE_ALIAS', b => { document(b, 'person-id-registry').persons[0].aliases = ['second-person']; }],
  ['missing values person', 'E_VALUES_PERSON_SET', b => { document(b, 'values-cast').people.pop(); }],
  ['gender orphan without fuzzy matching', 'E_GENDER_ORPHAN', b => { document(b, 'gender-cast').people[0].name += ' '; }],
  ['duplicate gender person', 'E_GENDER_DUPLICATE_NAME', b => { document(b, 'gender-cast').people[1].name = '첫 사람'; }],
  ['lineage orphan', 'E_LINEAGE_ORPHAN', b => { document(b, 'cast-hangnyeol').people[0].name = '미등록'; }],
  ['missing GURPS person', 'E_GURPS_PERSON_SET', b => { document(b, 'gurps-cast').people.pop(); }],
  ['wrong GURPS ID', 'E_GURPS_ID_MISMATCH', b => { document(b, 'gurps-cast').people[0].id = 'K999'; }],
  ['wrong public route with unchanged row count', 'E_PUBLIC_ROUTE_MISMATCH', b => { document(b, 'gurps-cast').people[0].url = '/people/person-9999'; }],
  ['numeric minors', 'E_MINORS_TYPE', b => { document(b, 'values-cast').people[0].minors = 0; }],
  ['missing minors', 'E_MINORS_TYPE', b => { delete document(b, 'values-cast').people[0].minors; }],
  ['string locked', 'E_LOCKED_TYPE', b => { document(b, 'values-cast').people[0].locked = 'true'; }],
  ['numeric gender lock', 'E_GENDER_USER_LOCKED_TYPE', b => { document(b, 'gender-cast').people[0].user_locked = 1; }],
  ['out of range value', 'E_VALUE_RANGE', b => { document(b, 'values-cast').people[0].values.권위 = 101; }],
  ['fractional desire', 'E_DESIRE_RANGE', b => { document(b, 'values-cast').people[0].desire.갈망 = 0.5; }],
  ['numeric qualitative desire', 'E_DESIRE_TYPE', b => { document(b, 'values-cast').people[0].desire.지향 = 1; }],
  ['missing axis', 'E_VALUE_AXES', b => { delete document(b, 'values-cast').people[0].values.권위; }],
  ['unknown gender state', 'E_GENDER_STATE', b => { document(b, 'gender-cast').people[0].state = 'S99'; }],
  ['unknown clan', 'E_LINEAGE_CLAN_ORPHAN', b => { document(b, 'cast-hangnyeol').people[0].clan = 'missing'; }],
  ['unknown base clan', 'E_LINEAGE_CLAN_ORPHAN', b => { document(b, 'cast-hangnyeol').people[0].base_clan = 'missing'; }],
  ['duplicate canonical clan', 'E_CLAN_DUPLICATE_ID', b => { document(b, 'clan-hangnyeol-tables').clans.push({ id: 'base' }); }],
  ['malformed clan source', 'E_CLAN_SOURCE_TYPE', b => { document(b, 'clan-hangnyeol-tables').clans[0].sources = [5]; }],
  ['fractional clan generation', 'E_CLAN_SESU_TYPE', b => { document(b, 'clan-hangnyeol-tables').clans[0].rows = [{ sesu: 1.5, hangnyeol: '현', hanja: null, position: 'second' }]; }],
  ['null clan generation', 'E_CLAN_SESU_TYPE', b => { document(b, 'clan-hangnyeol-tables').clans[0].rows = [{ sesu: null, hangnyeol: '현', hanja: null, position: 'second' }]; }],
  ['malformed clan rows', 'E_IDENTITY_ARRAY_TYPE', b => { document(b, 'clan-hangnyeol-tables').clans[0].rows = {}; }],
  ['fractional sesu', 'E_LINEAGE_SESU_TYPE', b => { document(b, 'cast-hangnyeol').people[0].sesu = 1.5; }],
  ['orphan clan assignment', 'E_LINEAGE_ASSIGNMENT_ORPHAN', b => { document(b, 'cast-hangnyeol').lineage.person_clan.미등록 = 'base'; }],
];
for (const [description, code, mutate] of invalidCases) {
  test(`rejects ${description} with ${code}`, () => {
    const bundle = fixture();
    mutate(bundle);
    assert.throws(() => mapIdentityDomains(bundle), error => error.code === code);
  });
}

test('maps the approved full corpus with exact counts and the K088 route counterexample', { skip: !process.env.CAST_SQLITE_SOURCE_ROOT }, () => {
  const bundle = { files: sourceNames.map((name, index) => ({ source_id: index + 1, logical_path: `lore/name-pools/${name}.json`, document: JSON.parse(readFileSync(join(process.env.CAST_SQLITE_SOURCE_ROOT, 'lore/name-pools', `${name}.json`), 'utf8')) })) };
  const rows = mapIdentityDomains(bundle);
  assert.equal(rows.people.length, 1022);
  assert.equal(new Set(rows.people.map(person => person.person_id)).size, 1022);
  assert.equal(new Set(rows.people.map(person => person.name)).size, 1022);
  assert.equal(new Set(rows.people.map(person => person.public_route)).size, 1022);
  assert.equal(rows.people.find(person => person.person_id === 'K088').public_route, '/people/person-0089');
  assert.equal(rows.aliases.length, 2);
  assert.deepEqual(rows.aliases.map(row => row.person_id), ['K1003', 'K1004']);
  assert.equal(rows.states.length, 18);
  assert.equal(rows.stateLabels.length, 18);
  assert.equal(rows.states.find(row => row.state_id === 'S00').name_ko, '무소속');
  assert.deepEqual(rows.stateLabels.filter(row => row.state_id === 'S00').map(row => row.name_ko), ['무소속']);
  assert.equal(rows.personValues.length, 10220);
  assert.equal(rows.personDesires.filter(row => row.value_kind === 'integer').length, 5110);
  assert.equal(rows.personDesires.filter(row => row.value_kind === 'text').length, 2044);
  assert.equal(rows.personDesires.filter(row => row.value_kind === 'text' && row.text_value === null).length, 13);
  assert.equal(rows.genders.length, 1022);
  assert.equal(rows.clans.length, 303);
  assert.equal(rows.clanSources.length, 168);
  assert.equal(rows.clanHangnyeolRows.length, 127);
  assert.deepEqual(rows.clanHangnyeolRows.find(row => row.clan_id === 'cangnyeong-seong-yeolcha'), { clan_id: 'cangnyeong-seong-yeolcha', ordinal: 0, sesu: 42, hangnyeol: '현', hanja: null, position: 'second' });
  assert.equal(rows.clans.find(row => row.clan_id === 'cangnyeong-seong-yeolcha').provenance, 'creative');
  assert.equal(rows.lineages.length, 1022);
  assert.equal(rows.lineageSourceClans.length, 62);
  assert.equal(rows.lineages.filter(row => row.naming_convention === 'non-korean-lineage').length, 62);
  for (const [field, count] of [['clan_id', 955], ['base_clan_id', 515], ['sesu', 520], ['hangnyeol', 519], ['position', 519]]) assert.equal(rows.lineages.filter(row => row[field] !== null).length, count, field);
  assert.equal(rows.lineageParents.length, 5);
  assert.equal(rows.lineageNodes.length, 7);
  assert.deepEqual(rows.lineageNodes.filter(row => row.person_id === null).map(row => row.name), ['성도원', '성창립', '이상계', '이호계']);
  assert.equal(rows.lineageFounderSesu.length, 2);
  assert.equal(rows.lineageClanAssignments.length, 3);
});
