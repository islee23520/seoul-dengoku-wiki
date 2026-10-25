import { readSourceArchive } from './source-archive.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { applySchema, openReadOnly, openWritableNew } from './db.mjs';
import { buildCastDatabase } from './build.mjs';
import { CONTEXT_TABLE_COLUMNS, mapContextDomains } from './current-context.mjs';
import { RIGHTS_PATHS } from './current-rights.mjs';
import { HISTORICAL_CONTEXT_TABLE_COLUMNS, mapHistoricalContext } from './historical-context.mjs';
import { mapIdentityDomains } from './identity-values.mjs';
import { parseDocument } from './sources.mjs';
import * as query from './query.mjs';

const cli = fileURLToPath(new URL('./query.mjs', import.meta.url));
const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

function rightsFixture(t) {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const offices = JSON.parse(readSourceArchive('lore/relations/opening-office-appointments.json').toString('utf8'));
  const paths = [...new Set([
    ...Object.values(RIGHTS_PATHS),
    ...['person-id-registry', 'values-cast', 'gender-cast', 'cast-hangnyeol', 'clan-hangnyeol-tables', 'gurps-cast'].map((name) => `lore/name-pools/${name}.json`),
    'lore/relations/relations.json', 'lore/relations/personal-holdings.json', 'lore/relations/opening-office-appointments.json',
    'lore/name-pools/cast-prose-contacts.json', 'lore/regions/seoul-electoral-titles.json',
    ...offices.appointments.flatMap((row) => row.current.evidence.map((ref) => ref.path)),
  ])];
  const bundle = { files: paths.map((logical_path, index) => {
    const raw_bytes = readSourceArchive(logical_path);
    return { source_id: index + 1, logical_path, raw_bytes, byte_length: raw_bytes.length,
      sha256: createHash('sha256').update(raw_bytes).digest('hex'), ...parseDocument(raw_bytes.toString('utf8')) };
  }) };
  bundle.records = bundle.files.flatMap((file) => file.records.map((record) => ({ source_id: file.source_id, ...record })));
  const identity = mapIdentityDomains(bundle);
  const current = mapContextDomains({ bundle, identity });
  const historical = mapHistoricalContext({ bundle, identity });
  const directory = mkdtempSync(join(tmpdir(), 'cast-query-rights-'));
  const dbPath = join(directory, 'rights.sqlite');
  const db = openWritableNew(dbPath);
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true }); });
  applySchema(db);
  const insert = (table, row) => db.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
  db.exec('BEGIN');
  for (const row of identity.states) insert('state', row);
  for (const row of identity.stateLabels) insert('state_label', row);
  for (const row of identity.people) insert('person', row);
  for (const file of bundle.files) {
    insert('source_file', { source_id: file.source_id, logical_path: file.logical_path, media_type: 'application/json', sha256: file.sha256, byte_length: file.byte_length, raw_bytes: file.raw_bytes });
  }
  for (const record of bundle.records) insert('source_record', record);
  for (const [columns, tables] of [[CONTEXT_TABLE_COLUMNS, current], [HISTORICAL_CONTEXT_TABLE_COLUMNS, historical]]) {
    for (const [table, names] of Object.entries(columns)) for (const row of tables[table]) insert(table, Object.fromEntries(names.map((name) => [name, row[name]])));
  }
  db.exec('COMMIT');
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
  return { dbPath, directory, identity, bundle, current };
}

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'cast-query-'));
  const dbPath = join(directory, 'fixture.sqlite');
  const db = openWritableNew(dbPath);
  t.after(() => { if (db.isOpen) db.close(); rmSync(directory, { recursive: true }); });
  applySchema(db);
  const insert = (table, row) => db.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
  insert('state', { state_id: 'S00', name_ko: null });
  for (const name_ko of ['무소속', '이주민 회랑']) insert('state_label', { state_id: 'S00', name_ko });
  for (const [person_id, name, ordinal] of [['K088', '선우', 89], ['K001', '누리', 1], ['K002', '나래', 2]]) {
    insert('person', { person_id, name, publication_ordinal: ordinal, public_key: `person-${String(ordinal).padStart(4, '0')}`, public_route: `/people/person-${String(ordinal).padStart(4, '0')}`, state_id: 'S00', state_name: '이주민 회랑', values_source_ordinal: ordinal - 1, minors: 0 });
  }
  const raw = Buffer.from('{"people":[{"name":"선우","optional":null}]}');
  insert('source_file', { source_id: 1, logical_path: 'lore/name-pools/values-cast.json', media_type: 'application/json', sha256: createHash('sha256').update(raw).digest('hex'), byte_length: raw.length, raw_bytes: raw });
  for (const [json_pointer, parent_pointer, ordinal, field_name, json_type, text_value] of [
    ['', null, 0, null, 'object', null], ['/people', '', 0, 'people', 'array', null], ['/people/0', '/people', 0, null, 'object', null],
    ['/people/0/name', '/people/0', 0, 'name', 'text', '선우'], ['/people/0/optional', '/people/0', 1, 'optional', 'null', null],
  ]) insert('source_record', { source_id: 1, json_pointer, parent_pointer, ordinal, field_name, json_type, text_value });
  insert('index_document', { source_id: 1, document_id: 'fixture-index', logical_path: 'lore/name-pools/values-cast.json', source_status: 'draft', source_kind: 'original-fiction', tense_ko: '과거', tense_en: 'past', temporal_scope: 'past_draft_index' });
  insert('index_section', { source_id: 1, table_anchor: 'fixture-section', section_ordinal: 0, section_anchor: 'fixture', section_name_ko: '자료', section_name_en: 'source', state_id: 'S00', row_count: 2, json_pointer: '/people/0' });
  insert('index_person', { source_id: 1, table_anchor: 'fixture-section', row_ordinal: 0, person_id: 'K088', match_status: 'exact_registry_name', name_ko: '선우', name_en: 'Seonwu', office_ko: '과거 직책', office_en: 'Past office', tier_ko: '과거', tier_en: 'past', relation_count: 0, json_pointer: '/people/0' });
  insert('index_person', { source_id: 1, table_anchor: 'fixture-section', row_ordinal: 1, person_id: null, match_status: 'unmatched', name_ko: '미매칭', name_en: 'Unmatched', office_ko: '미상', office_en: 'unknown', tier_ko: '미상', tier_en: 'unknown', relation_count: 0, json_pointer: '/people/0' });
  insert('index_corridor_person', { source_id: 1, table_anchor: 'fixture-corridor', row_ordinal: 0, person_id: 'K088', match_status: 'documented_display_alias', name_ko: '선우', name_en: 'Seonwu', corridor_ko: '회랑', corridor_en: 'corridor', office_ko: '과거 직책', office_en: 'Past office', conscription_ko: '미상', conscription_en: 'unknown', arms_access_ko: '미상', arms_access_en: 'unknown', json_pointer: '/people/0' });
  insert('index_issue', { source_id: 1, issue_code: 'E_INDEX_UNMATCHED_PERSON', issue_ordinal: 0, severity: 'warning', table_anchor: 'fixture-section', row_ordinal: 1, name_ko: '미매칭', json_pointer: '/people/0', message: '원천 미매칭' });
  insert('current_engine_source', { engine_source_id: 'engine-source-0001', logical_path: 'lore/editorial/profile-batches/special.json', source_sha256: 'c'.repeat(64), source_byte_length: 1, projection_schema: 'public-character-profile.v1', projection_sha256: 'd'.repeat(64), profile_count: 1 });
  insert('current_profile', { person_id: 'K088', engine_source_id: 'engine-source-0001', json_pointer: '/profiles/0', source_ordinal: 0 });
  insert('ability', { person_id: 'K088', ability_ordinal: 0, ability_id: 'leadership', base_value: 10, effective_value: 10, json_pointer: '/profiles/0/abilities/leadership' });
  insert('health', { person_id: 'K088', status_presence: 'value', status: 'unassessed', json_pointer: '/profiles/0/health' });
  insert('narrative', { person_id: 'K088', narrative_ko: '현재 서사', narrative_en: 'Current narrative', json_pointer: '/profiles/0/narrative' });
  insert('family_birthday', { person_id: 'K088', birth_date: '2080-01-01', source_status: 'owner-authored', source_id: 1, json_pointer: '/people/0' });
  insert('household_manifest', { manifest_id: 'fixture-household', status: 'draft', scope_kind: 'fixture', isolated_at_audit: 0, all_isolated_authored: 0, quantity_mode: 'fixture', court_count: 0, direct_retainer_count: 0, quantity_source: 'fixture', source_id: 1, json_pointer: '/people/0' });
  insert('household_person', { person_id: 'K088', name: '선우', person_faith_status: 'unknown', house_faith_status: 'unknown', humanoid_admission: 'deferred', gender_preference: 'unknown', political_position: 'unknown', normalized_social_contact: 0, family_parent: 0, faith_unresolved: 1, background_contact_authoring: 'unknown', source_id: 1, json_pointer: '/people/0' });
  insert('family_node', { node_id: 'K088', person_id: 'K088', node_kind: 'person', name: '선우', status: 'preserved', source_id: 1, json_pointer: '/people/0' });
  insert('family_role_decision', { decision_group: 'fixture', ordinal: 0, from_node_id: 'K088', decision_kind: 'recorded', source_id: 1, json_pointer: '/people/0' });
  insert('family_role_decision_fact', { decision_group: 'fixture', ordinal: 0, field_path: 'parentRole', value_kind: 'string', text_value: 'mother', source_id: 1, json_pointer: '/people/0' });
  insert('family_role_decision_source', { decision_group: 'fixture', ordinal: 0, ref_ordinal: 0, source_path: 'lore/name-pools/values-cast.json', source_anchor: '/people/0', source_id: 1, json_pointer: '/people/0' });
  insert('household_court', { court_id: 'household-fixture', owner_person_id: 'K088', state_id: 'S00', source_id: 1, json_pointer: '/people/0' });
  insert('household_court_retainer', { court_id: 'household-fixture', person_id: 'K001', liege_person_id: 'K088', source_row: 0, role: 'guard', source_id: 1, json_pointer: '/people/0' });
  insert('household_court_retainer_source', { court_id: 'household-fixture', person_id: 'K001', source_row: 0, retainer_json_pointer: '/people/0', ordinal: 0, source_path: 'lore/name-pools/values-cast.json', source_anchor: '/people/0', source_id: 1, json_pointer: '/people/0' });
  insert('household_humanoid_context', { actor_id: 'H01', custodian_person_id: 'K088', steward_house_id: 'household-fixture', scope: 'fixture', assignment_action: 'recorded', source_id: 1, json_pointer: '/people/0' });
  insert('household_humanoid_context_source', { actor_id: 'H01', ordinal: 0, source_path: 'lore/name-pools/values-cast.json', source_anchor: '/people/0', source_id: 1, json_pointer: '/people/0' });
  insert('context_organization', { organization_id: 'O01', name: '현재 조직', source_anchor: 'fixture', catalog_status: 'current-catalog-input', source_id: 1, json_pointer: '/people/0' });
  insert('context_event_link', { event_id: 'event-1', person_id: 'K088', organization_id: 'O01', catalog_status: 'current-catalog-input', source_id: 1, json_pointer: '/people/0' });
  insert('context_polity', { polity_id: 'polity:daejeon', name_ko: '대전', sovereign_person_id: 'K088', territorial_scale: 'regional', formal_title: '옛 군주', formal_title_rank: 'old', office: 'old', authority_kind: 'person', authority_name: '선우', current_validity: 'superseded_outside_seoul', source_schema: 'fixture', opening_year: 2126, source_id: 1, json_pointer: '/people/0' });
  insert('context_court', { court_id: 'court-old', owner_person_id: 'K088', polity_id: 'polity:daejeon', source_schema: 'fixture', effective_year: 2126, approval_ref: 'fixture', catalog_status: 'current-catalog-input', source_id: 1, json_pointer: '/people/0' });
  insert('context_court_membership', { person_id: 'K001', court_id: 'court-old', approval_ref: 'fixture', source_schema: 'fixture', effective_year: 2126, catalog_status: 'current-catalog-input', source_id: 1, json_pointer: '/people/0' });
  insert('context_owner_liege', { person_id: 'K001', liege_person_id: 'K088', relation_kind: 'direct-vassal', owner_term: '옛 가신', source_schema: 'fixture', effective_year: 2126, approval_ref: 'fixture', catalog_status: 'current-catalog-input', source_id: 1, json_pointer: '/people/0' });
  insert('context_retinue_group', { retinue_group_id: 'retinue-old', name_ko: '옛 가신단', court_id: 'court-old', liege_person_id: 'K088', person_count: 2, personhood_review: 'pending', current_validity: 'superseded_outside_seoul', source_schema: 'fixture', opening_year: 2126, source_id: 1, json_pointer: '/people/0' });
  insert('context_retinue_duty', { retinue_group_id: 'retinue-old', ordinal: 0, duty: '옛 임무', source_id: 1, json_pointer: '/people/0' });
  insert('context_retinue_technical_limit', { retinue_group_id: 'retinue-old', ordinal: 0, technical_limit: '옛 한계', source_id: 1, json_pointer: '/people/0' });
  insert('historical_source_scope', { source_id: 1, logical_path: 'lore/name-pools/values-cast.json', source_schema: 'fixture', classification: 'superseded_pre_seoul_rebase', record_count: 2, person_link_count: 2, json_pointer: '' });
  insert('historical_feudal_title', { title_id: 'title-old', name: '옛 작위', rank: 'old', holder_person_id: 'K088', polity_id: 'polity:daejeon', current_validity: 'superseded_pre_seoul_rebase', source_id: 1, json_pointer: '/people/0' });
  insert('historical_feudal_jurisdiction', { title_id: 'title-old', ordinal: 0, admin_unit_id: 'old-unit', source_id: 1, json_pointer: '/people/0' });
  insert('historical_feudal_grant', { grant_id: 'grant-old', name_ko: '옛 봉토', holder_person_id: 'K088', polity_id: 'polity:daejeon', title_id: 'title-old', current_validity: 'superseded_pre_seoul_rebase', source_id: 1, json_pointer: '/people/0' });
  insert('historical_feudal_grant_admin', { grant_id: 'grant-old', ordinal: 0, admin_unit_id: 'old-unit', admin_unit_name: '옛 행정구역', source_id: 1, json_pointer: '/people/0' });
  insert('person_alias', { person_id: 'K088', alias: '옛 이름', alias_ordinal: 0 });
  insert('value_axis', { axis_name: '권위', axis_ordinal: 0 });
  insert('person_value', { person_id: 'K088', axis_name: '권위', value: -20 });
  insert('desire_axis', { axis_name: '지향', axis_ordinal: 0, value_kind: 'text' });
  insert('person_desire', { person_id: 'K088', axis_name: '지향', value_kind: 'text', text_value: null });
  insert('person_gender', { person_id: 'K088', state_id: 'S00', gender: '여성', assignment_source: '원문', user_locked: 0 });
  insert('clan', { clan_id: 'clan-1', base_clan_id: null });
  insert('clan_source', { clan_id: 'clan-1', ordinal: 0, source_ref: '원문 자료' });
  insert('clan_hangnyeol_row', { clan_id: 'clan-1', ordinal: 0, sesu: 40, hangnyeol: '기', hanja: null, position: 'first' });
  insert('person_lineage', { person_id: 'K088', surname: '선', status: 'free', clan_id: 'clan-1' });
  for (const [name, person_id] of [['선우', 'K088'], ['기록 속 조상', null], ['더 앞선 조상', null]]) insert('lineage_node', { name, person_id });
  insert('lineage_parent', { child_name: '선우', parent_name: '기록 속 조상' });
  insert('lineage_parent', { child_name: '기록 속 조상', parent_name: '더 앞선 조상' });
  insert('lineage_founder_sesu', { person_name: '더 앞선 조상', sesu: 40 });
  insert('lineage_clan_assignment', { person_id: 'K088', clan_id: 'clan-1' });
  for (const [profile_id, source_ordinal, is_primary] of [['variant-b', 1, 0], ['variant-a', 0, 1]]) {
    insert('profile', { profile_id, person_id: 'K088', source_id: 1, heading_pointer: '/people/0', source_kind: 'core', source_ordinal, heading_depth: 2, node_start: 0, node_end: 1, is_primary });
    insert('profile_node', { profile_id, node_ordinal: 0, source_id: 1, json_pointer: '/people/0' });
    insert('profile_field', { profile_id, field_ordinal: 0, field_kind: 'lead', key_ko: '소개', value_ko: '', source_id: 1, json_pointer: '/people/0/optional' });
  }
  insert('relation_type', { type_ko: '친족', type_en: 'kin', type_ordinal: 0 });
  for (const [row_ordinal, from_person_id, to_person_id, json_pointer] of [[2, 'K088', 'K002', '/people/0/name'], [0, 'K001', 'K088', '/people/0'], [1, 'K088', 'K001', '/people/0/optional']]) {
    insert('relation', { relation_id: `relation-${row_ordinal}`, source_id: 1, row_ordinal, from_person_id, to_person_id, type_ko: '친족', type_en: 'kinship', grounds_ko: '', grounds_en: '', json_pointer });
  }
  insert('gurps_profile', { person_id: 'K088', source_id: 1, json_pointer: '/people/0', state_id: 'S00', status: 'proposal', baseline: 0, attributes: 0, advantages: 0, disadvantages: 0, skills: 1, spent: 1, unspent: 0, total: 1, territory_presence: 'present', unit_presence: 'present', wandering_force_presence: 'present', advantages_presence: 'present', disadvantages_presence: 'present' });
  insert('gurps_attribute', { person_id: 'K088', attribute_code: 'ST', ordinal: 0, value: 10, cp: 0 });
  insert('gurps_secondary', { person_id: 'K088', stat_name: 'BasicSpeed', ordinal: 0, value: 5.25 });
  insert('gurps_skill', { person_id: 'K088', ordinal: 0, name: 'Skill', name_ko: '기술', difficulty_source: 'diff', cp: 1, level: 10, effect: '옛 효과', evidence_presence: 'present', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_trait', { person_id: 'K088', ordinal: 0, name: 'Trait', cp: -5, reaction_presence: 'present', reaction_ordinary_observers: 1, boundaries_presence: 'present', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_trait_application_boundary', { person_id: 'K088', trait_ordinal: 0, ordinal: 0, text: '옛 적용 경계', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_advantage', { person_id: 'K088', ordinal: 0, name: 'Advantage', cp: 5, effect: '옛 장점', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_disadvantage', { person_id: 'K088', ordinal: 0, name: 'Disadvantage', cp: -5, effect: '옛 단점', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_territory', { person_id: 'K088', fief_name: '옛 영지', type: '구역', station: '역', state_id: 'S00', settlement_name: '거점', settlement_type: '역', settlement_description: '옛 설명', note: '', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_unit', { person_id: 'K088', type: null, type_presence: 'absent', size: 3, quality: '보통', note: '', scale_state_id: 'S00', scale_tier: 'T1', scale_factor: 1, source_id: 1, json_pointer: '/people/0' });
  insert('gurps_unit_composition', { person_id: 'K088', ordinal: 0, text: '옛 구성', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_wandering_force', { person_id: 'K088', type: '이동', size: 2, current_location: '역', note: '', camp_name: '야영', camp_type: '천막', camp_description: '', camp_pack_up_time: '짧음', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_wandering_facility', { person_id: 'K088', ordinal: 0, text: '옛 시설', source_id: 1, json_pointer: '/people/0' });
  insert('gurps_language', { person_id: 'K088', ordinal: 0, name: 'Language', level: null, cp: 0 });
  insert('evidence', { evidence_id: 'ev-1', person_id: 'K088', subject_kind: 'skill', subject_key: 'Skill', subject_ordinal: 0, evidence_ordinal: 0, source_id: 1, source_path: 'lore/name-pools/values-cast.json', json_pointer: '/people/0/name', quote: '선우', match_status: 'match' });
  insert('source_check_run', { check_name: 'gurps-cast', exit_code: 1, stdout_sha256: 'a'.repeat(64), stderr_sha256: 'b'.repeat(64), issue_count: 1 });
  insert('source_check_issue', { check_name: 'gurps-cast', ordinal: 0, category: 'citation', person_id: 'K088', raw_line: '원문 검사 결과' });
  insert('quality_issue', { issue_id: 'qi-1', dataset: 'gurps', code: 'E_EVIDENCE', severity: 'error', person_id: 'K088', source_id: 1, json_pointer: '/people/0', message: '독립 검사 결과' });
  db.close();
  return { dbPath, directory, raw, hash: digest(dbPath), mtime: statSync(dbPath).mtimeMs };
}

test('provides the four read-only query API entry points', () => {
  for (const name of ['queryPerson', 'queryRelations', 'queryIssues', 'querySource']) assert.equal(typeof query[name], 'function', name);
});

test('authenticated schema five corpus separates retained holdings, nonowning scope, political context and office history', (t) => {
  // Given: real approved source bytes mapped through authentication, with issued identities and routes.
  const f = rightsFixture(t);
  const beforeHash = digest(f.dbPath);
  const beforeMtime = statSync(f.dbPath).mtimeMs;
  // When: each person is queried through the public read-only API.
  const results = f.identity.people.map((person) => query.queryPerson({ dbPath: f.dbPath, id: person.person_id }));
  const person = (id) => results.find((row) => row.person.person_id === id);
  // Then: no identity or route is regenerated, and rights categories remain distinct.
  assert.equal(results.length, 1022);
  assert.deepEqual(results.map(({ person: row }) => [row.person_id, row.public_route]), f.identity.people.map((row) => [row.person_id, row.public_route]));
  assert.equal(results.reduce((sum, row) => sum + row.current.holdings.length, 0), 20);
  assert.equal(results.reduce((sum, row) => sum + row.current.nonowning_rights.length, 0), 5);
  assert.equal(results.reduce((sum, row) => sum + row.current.context.titles.length, 0), 42);
  assert.equal(results.reduce((sum, row) => sum + row.current.context.grants.length, 0), 31);
  assert.equal(results.reduce((sum, row) => sum + row.current.context.bindings.length, 0), 7);
  assert.equal(results.reduce((sum, row) => sum + row.current.context.political_identities.length, 0), 158);
  const nonowning = results.flatMap((row) => row.current.nonowning_rights);
  assert.equal(nonowning.reduce((sum, row) => sum + row.geographic_scope.counties.length, 0), 12);
  for (const right of nonowning) {
    const source = f.bundle.files.find((file) => file.logical_path === 'lore/relations/personal-holdings.json').document.holdings.find((row) => row.id === right.holding_id);
    assert.equal(right.direct_ownership, 0);
    assert.equal(right.kind, 'superior-jurisdiction');
    assert.equal(right.title_id, source.titleId);
    assert.equal(right.capability_package_id, source.capabilityPackageId);
    assert.deepEqual(right.powers.map((row) => row.power), source.powers);
    assert.deepEqual(right.geographic_scope.counties.map((row) => row.county_title_id), source.geographicScope.countyTitleIds);
    assert.deepEqual(right.admin_refs, []);
  }
  for (const [id, count, liege] of [['K1008', 2, null], ['K035', 1, 'K1008'], ['K039', 1, 'K1008'], ['K038', 1, 'K1008']]) {
    const result = person(id);
    assert.equal(result.current.nonowning_rights.length, count);
    assert.ok(result.current.nonowning_rights.every((row) => row.direct_liege_person_id === liege));
    assert.deepEqual(result.current.holdings, []);
    assert.deepEqual(result.historical.superseded_context.polities, []);
    assert.deepEqual(result.historical.superseded_context.retinue_groups, []);
    assert.ok(result.current.context.bindings.length >= count);
    if (liege) assert.equal(result.current.context.owner_liege.liege_person_id, liege);
  }
  const king = person('K1008');
  assert.equal(king.current.context.polities[0].current_validity, 'current_nonterritorial');
  assert.equal(king.current.context.polities[0].territorial_scale, null);
  assert.equal(king.current.context.polities[0].direct_ownership, 0);
  assert.ok(king.current.context.titles.some((row) => row.title_id === 'title:kingdom-daejeon'));
  assert.equal(king.current.context.offices[0].status, 'nonterritorial-political-office');
  assert.equal(king.unresolved.context.retinue_groups[0].person_count, 24);
  assert.equal(king.unresolved.context.retinue_groups[0].duties.length, 4);
  assert.deepEqual(king.unresolved.context.retinue_groups[0].holdings, []);
  assert.ok(king.current.context.courts.length);
  for (const id of ['K151', 'K176', 'K355']) {
    const result = person(id);
    assert.equal(result.current.context.offices[0].status, 'unappointed');
    assert.equal(result.current.context.offices[0].position_ko, null);
    assert.equal(result.current.context.offices[0].rank_ko, null);
    assert.ok(result.historical.context.offices[0].position_ko);
    assert.ok(result.current.context.political_identities.length);
    assert.ok(result.historical.feudal.titles.length);
    assert.deepEqual(result.current.context.grants, []);
  }
  for (const result of results) for (const office of result.current.context.offices) {
    assert.deepEqual(office.evidence, f.current.context_office_evidence.filter((row) => row.person_id === result.person.person_id));
    assert.ok(office.evidence.length);
  }
  assert.equal(results.reduce((sum, row) => sum + row.historical.feudal.titles.length, 0), 200);
  assert.equal(results.reduce((sum, row) => sum + row.historical.feudal.grants.length, 0), 179);
  assert.equal(digest(f.dbPath), beforeHash);
  assert.equal(statSync(f.dbPath).mtimeMs, beforeMtime);
  assert.deepEqual(readdirSync(f.directory), ['rights.sqlite']);
});

test('person ID and publication route return the same complete normalized domains', (t) => {
  const f = fixture(t);
  const result = query.queryPerson({ dbPath: f.dbPath, id: 'K088' });
  assert.deepEqual(result, query.queryPerson({ dbPath: f.dbPath, route: '/people/person-0089' }));
  assert.equal(result.person.person_id, 'K088');
  assert.equal(result.person.publication_ordinal, 89);
  assert.equal(result.person.state_name, '이주민 회랑');
  assert.equal(result.state.name_ko, null);
  assert.deepEqual(result.state.labels.map((row) => row.name_ko), ['무소속', '이주민 회랑']);
  assert.equal(result.aliases[0].alias, '옛 이름');
  assert.equal(result.values[0].value, -20);
  assert.equal(result.desires[0].text_value, null);
  assert.equal(result.gender.gender, '여성');
  assert.equal(result.lineage.profile.clan_id, 'clan-1');
  assert.equal(result.lineage.nodes.find((row) => row.name === '더 앞선 조상').person_id, null);
  assert.equal(result.lineage.parents.length, 2);
  assert.equal(result.lineage.founder_sesu[0].sesu, 40);
  assert.equal(result.lineage.clans[0].clan_id, 'clan-1');
  assert.equal(result.lineage.clans[0].sources[0].source_ref, '원문 자료');
  assert.equal(result.lineage.clans[0].hangnyeol_rows[0].sesu, 40);
  assert.deepEqual(result.lineage.source_clan_refs, []);
  assert.deepEqual(result.profiles.map((row) => row.profile_id), ['variant-a', 'variant-b']);
  assert.equal(result.source_indexes.cast[0].source_status, 'draft');
  assert.equal(result.source_indexes.cast[0].tense_en, 'past');
  assert.equal(result.source_indexes.corridor[0].match_status, 'documented_display_alias');
  assert.equal(result.source_indexes.cast.length, 1);
  assert.equal(result.profiles[0].nodes[0].json_pointer, '/people/0');
  assert.equal(result.profiles[0].fields[0].value_ko, '');
  assert.equal(result.profiles[0].logical_path, 'lore/name-pools/values-cast.json');
  assert.equal(result.historical.gurps.profile.status, 'proposal');
  for (const key of ['attributes', 'secondary', 'skills', 'traits', 'languages', 'evidence']) assert.equal(result.historical.gurps[key].length, 1, key);
  assert.equal(result.historical.gurps.advantages[0].effect, '옛 장점');
  assert.equal(result.historical.gurps.disadvantages[0].effect, '옛 단점');
  assert.equal(result.historical.gurps.territory.fief_name, '옛 영지');
  assert.equal(result.historical.gurps.unit.composition[0].text, '옛 구성');
  assert.equal(result.historical.gurps.wandering_force.facilities[0].text, '옛 시설');
  assert.equal(result.historical.gurps.traits[0].application_boundaries[0].text, '옛 적용 경계');
  assert.equal(result.historical.gurps.skills[0].effect, '옛 효과');
  assert.equal(result.historical.gurps.languages[0].level, null);
  assert.equal(result.historical.gurps.evidence[0].json_pointer, '/people/0/name');
  assert.equal(Object.hasOwn(result, 'gurps'), false);
  assert.deepEqual(Object.keys(result.current), ['engine', 'birthday', 'family', 'household', 'holdings', 'nonowning_rights', 'context']);
  assert.equal(result.current.engine.profile.person_id, 'K088');
  assert.equal(Object.hasOwn(result.current.engine.profile, 'authored_status'), false);
  assert.equal(Object.hasOwn(result.current.engine.profile, 'owner_approved'), false);
  assert.equal(result.current.engine.abilities[0].ability_id, 'leadership');
  assert.equal(result.current.engine.narrative.narrative_ko, '현재 서사');
  assert.equal(Object.hasOwn(result.current.engine.source, 'logical_path'), false);
  assert.equal(JSON.stringify(result.current.engine).includes('profile-batches'), false);
  assert.equal(result.current.birthday.birth_date, '2080-01-01');
  assert.equal(result.current.family.role_decisions[0].facts[0].text_value, 'mother');
  assert.equal(result.current.family.role_decisions[0].sources[0].source_anchor, '/people/0');
  assert.equal(result.current.household.courts[0].retainers[0].sources[0].source_anchor, '/people/0');
  assert.equal(result.current.household.humanoid_context[0].sources[0].source_anchor, '/people/0');
  assert.deepEqual(result.current.holdings, []);
  assert.deepEqual(result.current.nonowning_rights, []);
  assert.equal(result.current.context.courts[0].court_id, 'court-old');
  assert.equal(result.current.context.event_links[0].organization_name, '현재 조직');
  assert.deepEqual(result.historical.superseded_holdings, []);
  assert.equal(result.historical.superseded_context.polities[0].polity_id, 'polity:daejeon');
  assert.equal(result.historical.superseded_context.retinue_groups[0].duties[0].duty, '옛 임무');
  assert.equal(result.historical.feudal.titles[0].jurisdictions[0].admin_unit_id, 'old-unit');
  assert.equal(result.historical.feudal.grants[0].admin_units[0].admin_unit_name, '옛 행정구역');
  const oldVassal = query.queryPerson({ dbPath: f.dbPath, id: 'K001' });
  assert.equal(oldVassal.current.context.owner_liege.liege_person_id, 'K088');
  assert.deepEqual(result.unresolved.holdings, []);
});

test('relations keep directed rows, source order, and blank grounds without reverse synthesis', (t) => {
  const f = fixture(t);
  const result = query.queryRelations({ dbPath: f.dbPath, id: 'K088', direction: 'both' });
  assert.deepEqual(result.incoming.map((row) => row.row_ordinal), [0]);
  assert.deepEqual(result.outgoing.map((row) => row.row_ordinal), [1, 2]);
  assert.ok(result.outgoing.every((row) => row.grounds_ko === '' && row.type_en === 'kinship'));
  assert.equal(result.outgoing[0].logical_path, 'lore/name-pools/values-cast.json');
  assert.equal(Object.hasOwn(query.queryRelations({ dbPath: f.dbPath, id: 'K088', direction: 'incoming' }), 'outgoing'), false);
});

test('issues separate official check runs from independently filtered importer findings', (t) => {
  const f = fixture(t);
  const result = query.queryIssues({ dbPath: f.dbPath, dataset: 'gurps' });
  assert.equal(result.official.runs[0].issue_count, 1);
  assert.equal(result.official.issues[0].category, 'citation');
  assert.equal(result.importer[0].code, 'E_EVIDENCE');
  assert.deepEqual(query.queryIssues({ dbPath: f.dbPath, dataset: 'values' }), { dataset: 'values', official: { runs: [], issues: [] }, importer: [] });
  const index = query.queryIssues({ dbPath: f.dbPath, dataset: 'index' }).source_indexes;
  assert.equal(index.issues[0].issue_code, 'E_INDEX_UNMATCHED_PERSON');
  assert.equal(index.unmatched_cast[0].name_ko, '미매칭');
});

test('source inspection exposes typed null and pointer errors without a raw-byte endpoint', (t) => {
  const f = fixture(t);
  const options = { dbPath: f.dbPath, path: 'lore/name-pools/values-cast.json' };
  const summary = query.querySource(options);
  assert.equal(summary.record_count, 5);
  assert.equal(Object.hasOwn(summary, 'raw_bytes_base64'), false);
  assert.equal(query.querySource({ ...options, pointer: '/people/0/optional' }).record.json_type, 'null');
  assert.deepEqual(query.querySource({ ...options, pointer: '/people/0' }).children.map((row) => row.field_name), ['name', 'optional']);
  assert.throws(() => query.querySource({ ...options, pointer: '/people/0/absent' }), { code: 'E_SOURCE_POINTER_NOT_FOUND' });
  assert.throws(() => query.querySource({ ...options, includeBytes: true }), { code: 'E_ARGUMENTS' });
});

test('missing and injection inputs fail explicitly while DB bytes, mtime, and sidecars remain unchanged', (t) => {
  const f = fixture(t);
  for (const id of ['K9999', "K001' OR 1=1--"]) assert.throws(() => query.queryPerson({ dbPath: f.dbPath, id }), { code: 'E_PERSON_NOT_FOUND' });
  assert.throws(() => query.queryRelations({ dbPath: f.dbPath, id: 'K088', direction: 'reverse' }), { code: 'E_DIRECTION_INVALID' });
  assert.throws(() => query.queryPerson({ dbPath: f.dbPath, id: 'K088', route: '/people/person-0089' }), { code: 'E_ARGUMENTS' });
  assert.throws(() => query.querySource({ dbPath: f.dbPath, path: "x' OR 1=1--" }), { code: 'E_SOURCE_NOT_FOUND' });
  assert.equal(digest(f.dbPath), f.hash);
  assert.equal(statSync(f.dbPath).mtimeMs, f.mtime);
  assert.deepEqual(readdirSync(f.directory), ['fixture.sqlite']);
});

test('CLI returns parseable JSON and rejects unknown, duplicate, misplaced, or missing arguments', (t) => {
  const f = fixture(t);
  const run = (args) => spawnSync(process.execPath, [cli, '--db', f.dbPath, ...args], { encoding: 'utf8', shell: false, windowsHide: true });
  const result = run(['person', '--id', 'K088']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).person.person_id, 'K088');
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8', shell: false, windowsHide: true });
  assert.equal(help.status, 0, help.stderr);
  assert.equal(typeof JSON.parse(help.stdout).commands.person, 'string');
  for (const args of [['person', '--id', 'K088', '--write'], ['person', '--id', 'K088', '--id', 'K001'], ['person', '--id'], ['issues', '--id', 'K088'], ['unknown'], ['person']]) {
    const failed = run(args);
    assert.notEqual(failed.status, 0);
    assert.equal(failed.stdout, '');
    assert.equal(JSON.parse(failed.stderr.split('\n').find((line) => line.startsWith('{'))).error.code, 'E_ARGUMENTS');
  }
  assert.equal(digest(f.dbPath), f.hash);
  assert.equal(statSync(f.dbPath).mtimeMs, f.mtime);
});

test('actual current SQLite query separates normalized current data, historical GURPS, and noncurrent holdings without writes', async (t) => {
  const sourceRoot = process.env.CAST_SQLITE_SOURCE_ROOT;
  if (!sourceRoot) return t.skip('CAST_SQLITE_SOURCE_ROOT is required for actual-current query integration');
  const directory = mkdtempSync(join(tmpdir(), 'cast-query-current-'));
  const dbPath = join(directory, 'current.sqlite');
  t.after(() => rmSync(directory, { recursive: true }));
  await buildCastDatabase({ sourceRoot, outputPath: dbPath });

  const db = openReadOnly(dbPath);
  const mismatch = db.prepare("SELECT person_id,public_route FROM person WHERE public_route<>('/people/person-' || printf('%04d',CAST(substr(person_id,2) AS INTEGER))) ORDER BY person_id LIMIT 1").get();
  db.close();
  assert.ok(mismatch, 'K ID suffix and public route must remain independently normalized');

  const beforeHash = digest(dbPath);
  const beforeMtime = statSync(dbPath).mtimeMs;
  const byId = query.queryPerson({ dbPath, id: 'K1022' });
  assert.deepEqual(byId, query.queryPerson({ dbPath, route: byId.person.public_route }));
  assert.equal(byId.current.engine.profile.person_id, 'K1022');
  assert.equal(byId.current.engine.abilities.length, 8);
  assert.equal(byId.historical.gurps.profile.person_id, 'K1022');
  assert.equal(Object.hasOwn(byId, 'gurps'), false);
  assert.equal(Object.hasOwn(byId.current.engine.source, 'logical_path'), false);
  for (const forbidden of ['"souls"', 'historicalMotif', 'soulRevisionRef', 'PRIVATE-']) assert.equal(JSON.stringify(byId.current.engine).includes(forbidden), false, forbidden);

  const byMismatchedRoute = query.queryPerson({ dbPath, id: mismatch.person_id });
  assert.deepEqual(byMismatchedRoute, query.queryPerson({ dbPath, route: mismatch.public_route }));
  const nonKorean = query.queryPerson({ dbPath, id: 'K014' });
  assert.equal(nonKorean.lineage.profile.naming_convention, 'non-korean-lineage');
  assert.equal(nonKorean.lineage.profile.naming_source_character_id, 'K014');
  assert.equal(nonKorean.lineage.profile.naming_source_path, 'lore/name-pools/person-id-registry.json');
  assert.ok(nonKorean.lineage.profile.naming_source_basis);
  assert.equal(nonKorean.lineage.profile.clan_id, null);
  assert.deepEqual(nonKorean.lineage.clans, []);
  assert.equal(nonKorean.lineage.source_clan_refs.length, 1);
  assert.ok(nonKorean.lineage.source_clan_refs[0].source_ref);
  assert.equal(JSON.stringify(nonKorean.current.engine).includes('profile-batches'), false);
  const indexedAlias = query.queryPerson({ dbPath, id: 'K1011' });
  const corridorSource = JSON.parse(readSourceArchive('lore/characters/Cast-Corridors-Index.json').toString('utf8'));
  assert.ok(indexedAlias.source_indexes.corridor.some((row) => row.match_status === 'documented_display_alias' && row.source_status === corridorSource.status));
  const unmatchedIndex = query.queryIssues({ dbPath, dataset: 'index' }).source_indexes;
  assert.ok(unmatchedIndex.unmatched_cast.some((row) => row.name_ko === '오도윤' && row.person_id === null));
  const eventPerson = query.queryPerson({ dbPath, id: 'K1007' });
  assert.ok(eventPerson.current.context.event_links.some((row) => row.organization_id === 'O01'));
  const outsidePerson = query.queryPerson({ dbPath, id: 'K1008' });
  assert.ok(outsidePerson.current.context.polities.some((row) => row.polity_id === 'polity:daejeon'));
  assert.deepEqual(outsidePerson.historical.superseded_context.polities, []);
  assert.deepEqual(outsidePerson.historical.superseded_context.retinue_groups, []);
  assert.equal(outsidePerson.unresolved.context.retinue_groups[0].person_count, 24);
  assert.equal(outsidePerson.current.nonowning_rights.length, 2);
  assert.ok(outsidePerson.current.context.courts.some((row) => row.polity_id === 'polity:daejeon'));
  const oldVassal = query.queryPerson({ dbPath, id: 'K035' });
  assert.equal(oldVassal.current.context.owner_liege.liege_person_id, 'K1008');
  assert.equal(oldVassal.current.nonowning_rights.length, 1);
  const historicalDb = openReadOnly(dbPath);
  const feudalHolder = historicalDb.prepare('SELECT holder_person_id FROM historical_feudal_title ORDER BY title_id LIMIT 1').get();
  historicalDb.close();
  assert.ok(feudalHolder);
  assert.ok(query.queryPerson({ dbPath, id: feudalHolder.holder_person_id }).historical.feudal.titles.length > 0);
  const unappointed = query.queryPerson({ dbPath, id: 'K151' });
  assert.equal(unappointed.current.context.offices[0].position_ko, null);
  assert.equal(unappointed.current.context.offices[0].rank_ko, null);
  assert.ok(unappointed.historical.context.offices[0].position_ko);
  assert.ok(unappointed.historical.feudal.titles.length);
  assert.deepEqual(unappointed.current.context.grants, []);
  assert.throws(() => query.queryPerson({ dbPath, id: "K1022' OR 1=1--" }), { code: 'E_PERSON_NOT_FOUND' });
  assert.throws(() => query.querySource({ dbPath, path: 'lore/editorial/profile-batches/special.json' }), { code: 'E_SOURCE_NOT_FOUND' });
  assert.throws(() => query.querySource({ dbPath, path: 'lore/name-pools/values-cast.json', includeBytes: true }), { code: 'E_ARGUMENTS' });

  const cliResult = spawnSync(process.execPath, [cli, '--db', dbPath, 'person', '--route', byId.person.public_route], { encoding: 'utf8', shell: false, windowsHide: true });
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.deepEqual(JSON.parse(cliResult.stdout), byId);
  assert.equal(digest(dbPath), beforeHash);
  assert.equal(statSync(dbPath).mtimeMs, beforeMtime);
  assert.deepEqual(readdirSync(directory), ['current.sqlite']);
});
