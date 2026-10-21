import { readSourceArchive } from './source-archive.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { mapGurps, parseOfficialGurpsCheck } from './gurps-evidence.mjs';

const GURPS_PATH = 'lore/name-pools/gurps-cast.json';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fixture() {
  const quote = { path: 'lore/source.json', pointer: '/a~1b/~0key', quote: '인용 원문' };
  const person = {
    id: 'K001', name: '인물', state: 'S01', url: '/people/person-0002', method: 'pilot-approved',
    role: { display: '역할', evidence: [quote] },
    attributes: Object.fromEntries(['ST', 'DX', 'IQ', 'HT'].map((code) => [code, { value: 10, cp: 0, rule: 'pilot-approved', evidence: [quote] }])),
    secondary: { HP: 10, Will: 10, Per: 10, FP: 10, BasicSpeed: 5.25, BasicMove: 5, BasicLift: 20, Dodge: 8 },
    traits: [{ name: '특성', kind: 'advantage', rule: 'reputation', level: 2, people: 0.5, frequency: 1, cp: 5, page: 'B26–27', evidence: [quote] }, { name: '선택값 없음', kind: 'advantage', rule: 'combat-reflexes', cp: 15, page: 'B43', evidence: [] }],
    skills: [{ name: 'Observation', ko: '관찰', attr: 'Per', diff: 'A', tier: 'B', cp: 8, level: 12, evidence: [quote, quote] }],
    languages: [{ name: '한국어', level: null, cp: 0, evidence: [{ path: 'guide.md', quote: '원문 그대로' }] }],
    cp: { attributes: 0, advantages: 20, disadvantages: 0, skills: 8, spent: 28, unspent: 47, total: 75 },
    band: '일반 인물', baseline: false,
  };
  const document = { status: 'proposal', count: 1, people: [person] };
  const files = [
    { source_id: 1, logical_path: GURPS_PATH, document, raw_bytes: Buffer.from(JSON.stringify(document)) },
    { source_id: 2, logical_path: 'lore/source.json', document: { 'a/b': { '~key': '앞 인용 원문 뒤' }, rich: [{ text: '분리 ' }, { text: '문장' }] }, raw_bytes: Buffer.from('{}') },
    { source_id: 3, logical_path: 'guide.md', document: null, raw_bytes: Buffer.from('# 원문 그대로\n') },
  ];
  return { bundle: { files }, identity: { people: [{ person_id: 'K001', name: '인물' }] } };
}

test('maps every GURPS child, optional value, proposal status and repeated evidence in source order', () => {
  const input = fixture();
  const before = JSON.stringify(input);
  const mapped = mapGurps(input);
  assert.equal(JSON.stringify(input), before);
  assert.equal(mapped.gurpsProfiles[0].status, 'proposal');
  assert.equal(mapped.gurpsProfiles[0].url, '/people/person-0002');
  assert.equal(mapped.gurpsProfiles[0].baseline, 0);
  assert.equal(mapped.gurpsProfiles[0].method, 'pilot-approved');
  assert.equal(mapped.gurpsProfiles[0].total, 75);
  assert.deepEqual(mapped.attributes.map((row) => [row.attribute_code, row.ordinal, row.value]), [['ST', 0, 10], ['DX', 1, 10], ['IQ', 2, 10], ['HT', 3, 10]]);
  assert.equal(mapped.secondary.find((row) => row.stat_name === 'BasicSpeed').value, 5.25);
  assert.equal(mapped.traits[0].people, 0.5);
  assert.equal(mapped.traits[1].level, null);
  assert.equal(mapped.traits[1].people, null);
  assert.equal(mapped.traits[1].frequency, null);
  assert.equal(mapped.skills[0].attribute_code, 'Per');
  assert.equal(mapped.skills[0].name_ko, '관찰');
  assert.equal(mapped.languages[0].level, null);
  assert.equal(mapped.evidence.length, 9);
  assert.deepEqual(mapped.evidence.filter((row) => row.subject_kind === 'skill').map((row) => row.evidence_ordinal), [0, 1]);
  assert.ok(mapped.evidence.every((row) => row.match_status === 'match'));
  assert.equal(mapped.qualityIssues.length, 0);
  assert.ok(Object.isFrozen(mapped));
  for (const rows of Object.values(mapped)) {
    assert.ok(Object.isFrozen(rows));
    for (const row of rows) assert.ok(Object.isFrozen(row));
  }
});

test('historical holdings, forces, legacy perks and typed reaction boundaries retain source pointers', () => {
  const input = fixture();
  const person = input.bundle.files[0].document.people[0];
  person.advantages = [{ name: 'Fit', cp: 5, effect: '피로 회복' }];
  person.disadvantages = [{ name: 'Bloodlust', cp: -10, effect: '자제 판정' }];
  person.territory = { fief_name: '서울역', type: '거점', station: '서울역', state: 'S01', settlement: { name: '서울역 정착지', type: '정착지', description: '설명' }, note: '과거 영지' };
  person.unit = { size: 45, quality: '정예', composition: ['친위병', '경비병'], note: '과거 부대', faction_scale: { state: 'S01', tier: '강세력', factor: 1.2 } };
  person.wandering_force = { type: '유랑', size: 4, current_location: '한강', camp: { name: '야영지', type: '야영지', description: '설명', facilities: ['숙소', '창고'], pack_up_time: '반나절' }, note: '과거 유랑 기록' };
  person.traits[0].reaction = { ordinaryObservers: 2, observersAttractedToHerSex: 8, application: '인식 가능한 상대' };
  person.traits[0].applicationBoundaries = ['+8은 +2 대체', '자동 복종 아님'];
  person.skills[0].effect = '관찰 효과';
  const mapped = mapGurps(input);
  assert.deepEqual([mapped.advantages.length, mapped.disadvantages.length, mapped.territories.length, mapped.units.length, mapped.unitComposition.length, mapped.wanderingForces.length, mapped.wanderingFacilities.length, mapped.traitBoundaries.length], [1, 1, 1, 1, 2, 1, 2, 2]);
  assert.equal(mapped.gurpsProfiles[0].territory_presence, 'present');
  assert.equal(mapped.gurpsProfiles[0].unit_presence, 'present');
  assert.equal(mapped.gurpsProfiles[0].advantages_presence, 'present');
  assert.equal(mapped.units[0].type, null);
  assert.equal(mapped.units[0].type_presence, 'absent');
  assert.equal(mapped.traits[0].reaction_attracted_observers, 8);
  assert.equal(mapped.traits[0].boundaries_presence, 'present');
  assert.equal(mapped.skills[0].effect, '관찰 효과');
  assert.ok([mapped.advantages[0], mapped.territories[0], mapped.units[0], mapped.unitComposition[0], mapped.wanderingForces[0], mapped.wanderingFacilities[0], mapped.traitBoundaries[0]].every((row) => row.source_id === 1 && row.json_pointer.startsWith('/people/0/')));
});

test('historical absent and explicit null remain distinct', () => {
  const input = fixture();
  const person = input.bundle.files[0].document.people[0];
  person.territory = null;
  person.unit = null;
  const mapped = mapGurps(input);
  assert.equal(mapped.gurpsProfiles[0].territory_presence, 'null');
  assert.equal(mapped.gurpsProfiles[0].unit_presence, 'null');
  assert.equal(mapped.gurpsProfiles[0].wandering_force_presence, 'absent');
  assert.equal(mapped.gurpsProfiles[0].advantages_presence, 'absent');
  assert.equal(mapped.territories.length, 0);
  assert.equal(mapped.units.length, 0);
  assert.equal(mapped.wanderingForces.length, 0);
});

test('preserves an explanatory evidence note as an uncited historical issue', () => {
  const input = fixture();
  input.bundle.files[0].document.people[0].attributes.ST.evidence = [{ note: '프로필 해석 메모' }];
  const mapped = mapGurps(input);
  const note = mapped.evidence.find(row => row.subject_kind === 'attribute' && row.subject_key === 'ST');
  assert.equal(note.match_status, 'uncited-note');
  assert.equal(note.note_text, '프로필 해석 메모');
  assert.equal(note.source_path, null);
  assert.equal(note.quote, null);
  assert.equal(note.source_id, 1);
  assert.equal(note.json_pointer, '/people/0/attributes/ST/evidence/0/note');
  assert.deepEqual(mapped.qualityIssues.map(row => row.code), ['E_GURPS_EVIDENCE_UNCITED']);
});

test('independent matcher preserves orphan paths, mismatches and absent pointers without dropping people', () => {
  const input = fixture();
  input.bundle.files[0].document.people[0].role.evidence = [
    { path: '../unavailable.json', pointer: '/a', quote: '없는 자료' },
    { path: 'lore/source.json', pointer: '/absent', quote: '없는 포인터' },
    { path: 'lore/source.json', pointer: '/a~1b/~0key', quote: '다른 인용' },
    { path: 'lore/source.json', pointer: '/rich', quote: '분리 문장' },
    { path: 'lore/source.json', pointer: '/a~2b', quote: '잘못된 escape' },
    { path: 'lore/source.json', pointer: '/rich/01/text', quote: '문장' },
    { path: 'lore/source.json', pointer: '/toString', quote: 'prototype' },
    { path: 'guide.md', pointer: '/x', quote: '원문 그대로' },
    { path: 'guide.md', quote: '' },
  ];
  const mapped = mapGurps(input);
  const roles = mapped.evidence.filter((row) => row.subject_kind === 'role');
  assert.deepEqual(roles.map((row) => row.match_status), ['missing-source', 'missing-pointer', 'mismatch', 'match', 'missing-pointer', 'missing-pointer', 'missing-pointer', 'missing-pointer', 'mismatch']);
  assert.equal(roles[0].source_id, null);
  assert.equal(roles[0].source_path, '../unavailable.json');
  assert.equal(roles[1].json_pointer, '/absent');
  assert.equal(mapped.gurpsProfiles.length, 1);
  assert.equal(mapped.qualityIssues.length, 8);
  assert.ok(mapped.qualityIssues.every((row) => row.dataset === 'gurps' && row.source_id === 1 && row.json_pointer.startsWith('/people/0/role/evidence/')));
});

test('structural errors reject orphan identities, name mismatches, duplicates and malformed values', () => {
  for (const change of [
    (input) => { input.bundle.files[0].document.people[0].id = 'K999'; },
    (input) => { input.bundle.files[0].document.people[0].name = '다른 이름'; },
  ]) {
    const input = fixture(); change(input);
    assert.throws(() => mapGurps(input), { code: 'E_GURPS_PERSON_ORPHAN' });
  }
  for (const change of [
    (input) => { input.bundle.files[0].document.people.push(input.bundle.files[0].document.people[0]); },
    (input) => { input.bundle.files[0].document.people[0].baseline = 'false'; },
    (input) => { input.bundle.files[0].document.people[0].cp.total = NaN; },
    (input) => { delete input.bundle.files[0].document.people[0].attributes.DX; },
    (input) => { input.bundle.files[0].document.people[0].role.evidence[0].pointer = 1; },
    (input) => { input.bundle.files[0].document.people[0].traits[0].people = '0.5'; },
    (input) => { input.identity.people.push({ person_id: 'K002', name: '누락' }); },
  ]) {
    const input = fixture(); change(input);
    assert.throws(() => mapGurps(input), { code: 'E_GURPS_SHAPE' });
  }
});

test('official check parser derives counts and hashes from the actual streams', () => {
  const stderr = '✗ K001 인물 IQ: 인용 불일치 lore/source.json#/x «옛 인용»\r\n✗ lore/name-pools/gurps-cast.json가 카드에서 다시 파생한 결과와 다르다(node scripts/gurps-cast.mjs --write)\r\nFAIL: 2건\r\n';
  const parsed = parseOfficialGurpsCheck({ checkName: 'gurps', exitCode: 1, stdout: Buffer.alloc(0), stderr: Buffer.from(stderr) });
  assert.deepEqual(parsed.run, { check_name: 'gurps', exit_code: 1, stdout_sha256: hash(''), stderr_sha256: hash(stderr), issue_count: 2 });
  assert.deepEqual(parsed.issues.map((row) => [row.ordinal, row.category, row.person_id]), [[0, 'citation', 'K001'], [1, 'derived', null]]);
  assert.equal(parsed.issues[0].raw_line, stderr.split('\r\n')[0]);
  const clean = parseOfficialGurpsCheck({ checkName: 'gurps', exitCode: 0, stdout: 'PASS: 모든 인용 원문 대조, 재파생 일치 {}\n', stderr: '' });
  assert.equal(clean.run.issue_count, 0);
});

test('official parser fails explicitly on unfamiliar output, count mismatch, broken exit and mixed success', () => {
  for (const result of [
    { exitCode: 1, stdout: '', stderr: '✗ K001 새 규칙의 알 수 없는 오류\nFAIL: 1건\n' },
    { exitCode: 1, stdout: '', stderr: 'FAIL: 2건\n' },
    { exitCode: 0, stdout: '', stderr: '' },
    { exitCode: 1, stdout: 'PASS: 검사 완료\n', stderr: '' },
    { exitCode: null, stdout: '', stderr: 'timeout' },
    { exitCode: 0, stdout: 'PASS: 검사 완료\n', stderr: 'unexpected warning\n' },
    { exitCode: 1, stdout: 'PASS: 검사 완료\n', stderr: 'FAIL: 0건\n' },
  ]) assert.throws(() => parseOfficialGurpsCheck({ checkName: 'gurps', ...result }), { code: 'E_SOURCE_CHECK_PARSE' });
});

test('rejects malformed newly normalized historical values and ambiguous difficulty', () => {
  const variants = [
    (person) => { person.advantages = [{ name: 'Fit', cp: '5', effect: '피로' }]; },
    (person) => { person.disadvantages = [{ name: 'Bloodlust', cp: -10, effect: 1 }]; },
    (person) => { person.territory = { fief_name: '서울', type: '영지', station: '역', state: 'S01', settlement: { name: '정착지', type: '정착지', description: 5 }, note: '메모' }; },
    (person) => { person.unit = { type: '부대', size: 3.5, quality: '일반', composition: ['인원'], note: '메모', faction_scale: { state: 'S01', tier: '개인', factor: 1 } }; },
    (person) => { person.wandering_force = { type: '유랑', size: 3, current_location: '서울', note: '메모', camp: { name: '야영지', type: '야영지', description: '설명', facilities: [7], pack_up_time: '하루' } }; },
    (person) => { person.traits[0].applicationBoundaries = [42]; },
    (person) => { person.traits[0].reaction = { ordinaryObservers: '2', observersAttractedToHerSex: 8, application: '상대' }; },
    (person) => { person.skills[0].difficulty = '상'; },
    (person) => { delete person.skills[0].diff; },
    (person) => { person.role.evidence[0].line = 0; },
  ];
  for (const mutate of variants) {
    const input = fixture();
    mutate(input.bundle.files[0].document.people[0]);
    assert.throws(() => mapGurps(input), { code: 'E_GURPS_SHAPE' });
  }
});

test('full corpus preserves all typed historical GURPS branches and provenance', { skip: !process.env.CAST_SQLITE_SOURCE_ROOT }, () => {
  const root = process.env.CAST_SQLITE_SOURCE_ROOT;
  const document = JSON.parse(readSourceArchive(GURPS_PATH).toString('utf8'));
  const registry = JSON.parse(readSourceArchive('lore/name-pools/person-id-registry.json').toString('utf8'));
  const paths = new Set([GURPS_PATH]);
  for (const person of document.people) {
    for (const item of [person.role, ...Object.values(person.attributes), ...person.traits, ...person.skills, ...person.languages]) {
      for (const evidence of item.evidence ?? []) if (evidence.path) paths.add(evidence.path);
    }
  }
  const files = [...paths].sort().map((logical_path, index) => {
    const raw_bytes = readSourceArchive(logical_path);
    return { source_id: index + 1, logical_path, raw_bytes, document: logical_path.endsWith('.json') ? JSON.parse(raw_bytes.toString('utf8')) : null };
  });
  const mapped = mapGurps({ bundle: { files }, identity: { people: registry.persons.map((person) => ({ person_id: person.id, name: person.name })) } });
  assert.deepEqual([mapped.gurpsProfiles.length, mapped.attributes.length, mapped.secondary.length, mapped.skills.length, mapped.traits.length, mapped.languages.length], [1022, 4088, 8176, document.people.reduce((count, person) => count + person.skills.length, 0), 4, 20]);
  assert.deepEqual([mapped.advantages.length, mapped.disadvantages.length, mapped.territories.length, mapped.units.length, mapped.unitComposition.length, mapped.wanderingForces.length, mapped.wanderingFacilities.length, mapped.traitBoundaries.length], [21, 10, 809, 1017, 1021, 208, 624, 4]);
  const byId = new Map(mapped.gurpsProfiles.map((row) => [row.person_id, row]));
  for (const [personOrdinal, person] of document.people.entries()) {
    const profile = byId.get(person.id);
    assert.ok(profile);
    assert.equal(profile.json_pointer, `/people/${personOrdinal}`);
    for (const key of ['url', 'method', 'band']) assert.equal(profile[key], person[key]);
    for (const key of ['territory', 'unit', 'wandering_force', 'advantages', 'disadvantages']) assert.equal(profile[`${key}_presence`], !Object.hasOwn(person, key) ? 'absent' : person[key] === null ? 'null' : 'present');
    for (const [key, rows] of [['advantages', mapped.advantages], ['disadvantages', mapped.disadvantages]]) {
      (person[key] ?? []).forEach((item, ordinal) => {
        const actual = rows.find((row) => row.person_id === person.id && row.ordinal === ordinal);
        assert.deepEqual([actual.name, actual.cp, actual.effect, actual.json_pointer], [item.name, item.cp, item.effect, `/people/${personOrdinal}/${key}/${ordinal}`]);
      });
    }
    const territory = mapped.territories.find((row) => row.person_id === person.id);
    if (!person.territory) assert.equal(territory, undefined);
    else assert.deepEqual([territory.fief_name, territory.type, territory.station, territory.state_id, territory.settlement_name, territory.settlement_type, territory.settlement_description, territory.note, territory.json_pointer], [person.territory.fief_name, person.territory.type, person.territory.station, person.territory.state, person.territory.settlement.name, person.territory.settlement.type, person.territory.settlement.description, person.territory.note, `/people/${personOrdinal}/territory`]);
    const unit = mapped.units.find((row) => row.person_id === person.id);
    if (!person.unit) assert.equal(unit, undefined);
    else {
      assert.deepEqual([unit.type, unit.type_presence, unit.size, unit.quality, unit.note, unit.scale_state_id, unit.scale_tier, unit.scale_factor], [person.unit.type ?? null, Object.hasOwn(person.unit, 'type') ? 'present' : 'absent', person.unit.size, person.unit.quality, person.unit.note, person.unit.faction_scale.state, person.unit.faction_scale.tier, person.unit.faction_scale.factor]);
      assert.deepEqual(mapped.unitComposition.filter((row) => row.person_id === person.id).map((row) => row.text), person.unit.composition);
    }
    const force = mapped.wanderingForces.find((row) => row.person_id === person.id);
    if (!person.wandering_force) assert.equal(force, undefined);
    else {
      assert.deepEqual([force.type, force.size, force.current_location, force.note, force.camp_name, force.camp_type, force.camp_description, force.camp_pack_up_time], [person.wandering_force.type, person.wandering_force.size, person.wandering_force.current_location, person.wandering_force.note, person.wandering_force.camp.name, person.wandering_force.camp.type, person.wandering_force.camp.description, person.wandering_force.camp.pack_up_time]);
      assert.deepEqual(mapped.wanderingFacilities.filter((row) => row.person_id === person.id).map((row) => row.text), person.wandering_force.camp.facilities);
    }
    person.traits.forEach((trait, ordinal) => {
      const actual = mapped.traits.find((row) => row.person_id === person.id && row.ordinal === ordinal);
      assert.equal(actual.effect, trait.effect ?? null);
      assert.equal(actual.boundaries_presence, Object.hasOwn(trait, 'applicationBoundaries') ? 'present' : 'absent');
      assert.deepEqual(mapped.traitBoundaries.filter((row) => row.person_id === person.id && row.trait_ordinal === ordinal).map((row) => row.text), trait.applicationBoundaries ?? []);
      assert.equal(actual.reaction_presence, Object.hasOwn(trait, 'reaction') ? 'present' : 'absent');
      if (trait.reaction) assert.deepEqual([actual.reaction_ordinary_observers, actual.reaction_attracted_observers, actual.reaction_application], [trait.reaction.ordinaryObservers, trait.reaction.observersAttractedToHerSex, trait.reaction.application]);
    });
    person.skills.forEach((skill, ordinal) => {
      const actual = mapped.skills.find((row) => row.person_id === person.id && row.ordinal === ordinal);
      assert.deepEqual([actual.difficulty, actual.difficulty_source, actual.effect, actual.evidence_presence, actual.json_pointer], [skill.diff ?? skill.difficulty, Object.hasOwn(skill, 'diff') ? 'diff' : 'difficulty', skill.effect ?? null, Object.hasOwn(skill, 'evidence') ? 'present' : 'absent', `/people/${personOrdinal}/skills/${ordinal}`]);
    });
  }
  assert.equal(mapped.evidence.filter((row) => row.match_status === 'uncited-note').length, 12);
  assert.equal(mapped.evidence.filter((row) => row.source_line !== null).length, 1);
  console.log(JSON.stringify({ profiles: mapped.gurpsProfiles.length, territories: mapped.territories.length, units: mapped.units.length, wanderingForces: mapped.wanderingForces.length, advantages: mapped.advantages.length, disadvantages: mapped.disadvantages.length, evidence: mapped.evidence.length, independentIssues: mapped.qualityIssues.length }));
});
