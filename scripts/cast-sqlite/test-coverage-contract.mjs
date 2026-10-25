import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertDocumentShape, auditCoverageContract, auditEngineDocumentShape, COVERAGE_CONTRACT, fieldCoverageManifest } from './coverage-contract.mjs';
import { DATA_SOURCE_PATHS, parseDocument, REQUIRED_SOURCE_PATHS } from './sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { CONTEXT_TABLE_COLUMNS, mapContextDomains } from './current-context.mjs';
import { HISTORICAL_CONTEXT_TABLE_COLUMNS, mapHistoricalContext } from './historical-context.mjs';
import { readSourceArchive } from './source-archive.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';
import { EDITORIAL_PROFILE_SOURCE_HASHES } from '../document-store/editorial-profile.mjs';

const source = path => JSON.parse(Object.hasOwn(EDITORIAL_PROFILE_SOURCE_HASHES, path)
  ? readPrivateSourceArchive(new URL('../../', import.meta.url).pathname, path, EDITORIAL_PROFILE_SOURCE_HASHES[path]) : readSourceArchive(path));

test('원천 JSON의 새 필드 경로는 선언되지 않으면 실패한다', () => {
  const path = 'lore/name-pools/person-id-registry.json';
  const changed = structuredClone(source(path));
  changed.persons[0].unexpectedField = 'new value';
  assert.throws(() => assertDocumentShape(path, changed), { code: 'E_COVERAGE_UNDECLARED_LEAF' });
});

test('빈 배열에 새 데이터가 채워져도 형상 변경으로 탐지한다', () => {
  const path = 'lore/name-pools/cast-hangnyeol.json';
  const changed = structuredClone(source(path));
  assert.deepEqual(changed.sources, []);
  changed.sources.push('unreviewed-reference');
  assert.throws(() => assertDocumentShape(path, changed), { code: 'E_COVERAGE_UNDECLARED_LEAF' });
});

test('정본의 모든 포함 JSON 파일에 선언된 필드 모양이 있다', () => {
  for (const path of Object.keys(COVERAGE_CONTRACT)) assert.doesNotThrow(() => assertDocumentShape(path, source(path)));
});

test('알 수 없는 원천 경로를 포함으로 간주하지 않는다', () => {
  assert.throws(() => assertDocumentShape('lore/name-pools/new-file.json', {}), { code: 'E_COVERAGE_UNDECLARED_SOURCE' });
});

test('비공개 프로필의 새 필드가 공개 projection에 조용히 누락되지 않는다', () => {
  const path = ENGINE_PRIVATE_SOURCE_PATHS[0];
  const changed = structuredClone(source(path));
  changed.profiles[0].unexpectedPublicCandidate = 'value';
  assert.throws(() => auditEngineDocumentShape(path, changed), { code: 'E_COVERAGE_UNDECLARED_LEAF' });
});

test('비공개 배치는 값과 필드 경로 없이 공개·제외 건수만 보고한다', () => {
  const path = ENGINE_PRIVATE_SOURCE_PATHS[0];
  const result = auditEngineDocumentShape(path, source(path));
  assert.ok(result.publicProjectionLeafCount > 0);
  assert.ok(result.excludedLeafCount > 0);
  assert.deepEqual(Object.keys(result).sort(), ['excludedLeafCount', 'leafPatternCount', 'publicProjectionLeafCount']);
});

test('복합 인물 원천의 leaf는 해당 도메인 테이블만 가리킨다', () => {
  const gurpsPath = 'lore/name-pools/gurps-cast.json';
  const gurps = fieldCoverageManifest(gurpsPath, source(gurpsPath));
  assert.deepEqual(gurps.find((row) => row.leaf_pattern === '/people/[]/territory/type').normalized_targets,
    ['gurps_territory.type']);
  const relationPath = 'lore/characters/Cast-Relations.json';
  const relation = fieldCoverageManifest(relationPath, source(relationPath));
  assert.ok(relation.some((row) => row.leaf_pattern.startsWith('/content/')
    && row.normalized_targets.includes('relation.from_person_id')));
  assert.ok(relation.every((row) => !row.normalized_targets.includes('profile_node.json_pointer')));
  const statePath = 'lore/characters/Cast-Index-S4.json';
  const state = fieldCoverageManifest(statePath, source(statePath));
  assert.ok(state.some((row) => row.normalized_targets.includes('index_state_label.state_name_ko')));
  assert.ok(state.every((row) => !row.normalized_targets.includes('index_person.name_ko')));
  const corridorPath = 'lore/characters/Cast-Corridors-Index.json';
  const corridor = fieldCoverageManifest(corridorPath, source(corridorPath));
  assert.ok(corridor.some((row) => row.normalized_targets.includes('index_corridor_person.name_ko')));
  assert.ok(corridor.every((row) => !row.normalized_targets.includes('index_section.table_anchor')));
});

test('필수 정규화 테이블이 사라지면 원문 보존만으로 통과하지 않는다', () => {
  const files = REQUIRED_SOURCE_PATHS
    .map((logical_path, ordinal) => ({ source_id: ordinal + 1, logical_path,
      document: Object.hasOwn(COVERAGE_CONTRACT, logical_path) ? source(logical_path) : null }));
  const engineFiles = ENGINE_PRIVATE_SOURCE_PATHS.map((logical_path) => ({ logical_path, document: source(logical_path) }));
  const tables = {};
  for (const file of files.filter((item) => Object.hasOwn(COVERAGE_CONTRACT, item.logical_path))) for (const mapping of COVERAGE_CONTRACT[file.logical_path].mappings) {
    (tables[mapping.table] ??= []).push({ source_id: file.source_id, [mapping.column]: 'evidence' });
  }
  tables.current_profile = engineFiles.map((_, index) => ({ engine_source_id: index + 1, person_id: `K${index + 1}` }));
  delete tables.person_gender;
  assert.throws(() => auditCoverageContract({ bundle: { files, engineFiles }, tables }), { code: 'E_COVERAGE_ROWS' });
});

test('고정 포함 JSON 목록과 필드 계약 목록이 정확히 일치한다', () => {
  assert.deepEqual(Object.keys(COVERAGE_CONTRACT).sort(), DATA_SOURCE_PATHS.filter((path) => path.endsWith('.json')).sort());
});

test('현행 권리와 v2 직책의 민감 leaf는 실제 열을 명시한다', () => {
  const cases = [
    ['lore/relations/personal-holdings.json', '/holdings/[]/directOwnership', 'context_holding.direct_ownership'],
    ['lore/relations/personal-holdings.json', '/holdings/[]/powers/[]', 'context_holding_power.power'],
    ['lore/relations/personal-holdings.json', '/holdings/[]/capabilityPackageId', 'context_holding.capability_package_id'],
    ['lore/relations/personal-holdings.json', '/holdings/[]/geographicScope/countyTitleIds/[]', 'context_holding_scope_county.county_title_id'],
    ['lore/relations/opening-feudal-allocation.json', '/titles/[]/parentTitleId', 'context_feudal_title.parent_title_id'],
    ['lore/relations/opening-feudal-allocation.json', '/titles/[]/geographicParentTitleId', 'context_feudal_title.geographic_parent_title_id'],
    ['lore/relations/opening-feudal-allocation.json', '/titles/[]/politicalParentTitleId', 'context_feudal_title.political_parent_title_id'],
    ['lore/relations/opening-feudal-allocation.json', '/titles/[]/personalLiegePersonId', 'context_feudal_title.personal_liege_person_id'],
    ['lore/relations/opening-feudal-allocation.json', '/politicalIdentities/[]/personalLieges/[]/holdingId', 'context_political_identity_liege.historical_holding_id'],
    ['lore/relations/opening-office-appointments.json', '/appointments/[]/current/status', 'context_office_appointment.status'],
    ['lore/relations/opening-office-appointments.json', '/appointments/[]/history/rank/ko', 'context_office_history.rank_ko'],
    ['lore/relations/opening-office-appointments.json', '/appointments/[]/current/evidence/[]/jsonPointer', 'context_office_evidence.reference_pointer'],
    ['scripts/approved-seoul-rights-transition.json', '/records/[]/disposition', 'context_rights_transition.disposition'],
    ['scripts/approved-seoul-rights-transition.json', '/records/[]/sourceValueSha256', 'context_rights_transition.original_value_sha256'],
    ['scripts/approved-outside-current-retirement.json', '/records/[]/recordKey', 'context_outside_retirement.record_key'],
    ['scripts/historical-inputs/opening-feudal-allocation.json', '/titles/[]/parentTitleId', 'historical_feudal_title.parent_title_id'],
  ];
  for (const [path, leaf, target] of cases) {
    const row = fieldCoverageManifest(path, source(path)).find((row) => row.leaf_pattern === leaf);
    assert.deepEqual(row.normalized_targets, [target], `${path}#${leaf}`);
    assert.equal(row.exclusion_reason, null);
  }
});

test('빈 현행 외부 통제와 비정규화 원본을 개인 권리로 가장하지 않는다', () => {
  for (const path of ['lore/regions/outside-control-2126.json', 'lore/regions/outside-island-occupation.json',
    'scripts/historical-inputs/personal-holdings.json', 'scripts/historical-inputs/outside-island-occupation.json']) {
    const manifest = fieldCoverageManifest(path, source(path));
    assert.ok(manifest.every((row) => row.normalized_targets.length === 0 && row.exclusion_reason));
  }
  const active = fieldCoverageManifest('lore/relations/opening-feudal-allocation.json', source('lore/relations/opening-feudal-allocation.json'));
  assert.ok(active.every((row) => row.normalized_targets.every((target) => !target.startsWith('historical_'))));
});

test('새 권리·직책·manifest 중첩 필드는 계속 명시적 검토를 요구한다', () => {
  for (const [path, mutate] of [
    ['lore/relations/personal-holdings.json', (doc) => { doc.holdings.find((row) => row.geographicScope).geographicScope.tax = true; }],
    ['lore/relations/opening-office-appointments.json', (doc) => { doc.appointments[0].current.activationDecisionIds = []; }],
    ['scripts/approved-seoul-rights-transition.json', (doc) => { doc.records[0].unknownDisposition = true; }],
  ]) {
    const changed = structuredClone(source(path));
    mutate(changed);
    assert.throws(() => assertDocumentShape(path, changed), { code: 'E_COVERAGE_UNDECLARED_LEAF' });
  }
});

function currentCoverageInput() {
  // Other domain rows are coverage fixtures; the changed current/historical
  // domains below are the real authenticated corpus mapper output, not stubs.
  const files = REQUIRED_SOURCE_PATHS.map((logical_path, index) => {
    if (!Object.hasOwn(COVERAGE_CONTRACT, logical_path)) return { source_id: index + 1, logical_path, document: null, records: [] };
    const raw_bytes = readSourceArchive(logical_path);
    const parsed = logical_path.endsWith('.json') ? parseDocument(raw_bytes.toString('utf8')) : { document: null, records: [] };
    return { source_id: index + 1, logical_path, raw_bytes, ...parsed };
  });
  const engineFiles = ENGINE_PRIVATE_SOURCE_PATHS.map((logical_path) => ({ logical_path, document: source(logical_path) }));
  const bundle = { files, engineFiles, records: files.flatMap(file => file.records.map(record => ({ ...record, source_id: file.source_id }))) };
  const tables = {};
  for (const file of files.filter((file) => Object.hasOwn(COVERAGE_CONTRACT, file.logical_path))) {
    for (const mapping of COVERAGE_CONTRACT[file.logical_path].mappings) {
      (tables[mapping.table] ??= []).push({ source_id: file.source_id, [mapping.column]: 'coverage fixture' });
    }
    for (const row of fieldCoverageManifest(file.logical_path, file.document)) for (const target of row.normalized_targets) {
      const [table, column] = target.split('.');
      (tables[table] ??= []).push({ source_id: file.source_id, [column]: 'coverage fixture' });
    }
  }
  const identity = { people: source('lore/name-pools/person-id-registry.json').persons.map(({ id }) => ({ person_id: id })) };
  Object.assign(tables, mapContextDomains({ bundle, identity }), mapHistoricalContext({ bundle, identity }));
  tables.current_engine_source = engineFiles.map((file, index) => ({ logical_path: file.logical_path, engine_source_id: index + 1 }));
  tables.current_profile = engineFiles.map((_, index) => ({ engine_source_id: index + 1, person_id: `K${index + 1}` }));
  return { bundle, tables };
}

test('실제 인증 mapper 행이 현행·역사·직책 coverage 계약을 충족한다', () => {
  const input = currentCoverageInput();
  const before = JSON.stringify(input.tables);
  assert.equal(auditCoverageContract(input).sourceCount, Object.keys(COVERAGE_CONTRACT).length);
  assert.equal(JSON.stringify(input.tables), before);
  for (const path of Object.keys(COVERAGE_CONTRACT)) {
    for (const row of fieldCoverageManifest(path, source(path))) for (const target of row.normalized_targets) {
      const [table, column] = target.split('.');
      const columns = CONTEXT_TABLE_COLUMNS[table] ?? HISTORICAL_CONTEXT_TABLE_COLUMNS[table];
      if (columns) assert.ok(columns.includes(column), target);
    }
  }
});

test('원문을 모두 보존해도 새 정규화 테이블·행·열 누락은 실패한다', () => {
  const input = currentCoverageInput();
  for (const table of ['context_rights_approval', 'context_rights_original_source', 'context_rights_transition',
    'context_outside_retirement', 'context_holding_geographic_scope', 'context_holding_scope_county', 'context_holding_power',
    'context_feudal_title', 'context_feudal_grant', 'context_feudal_binding', 'context_political_identity',
    'context_political_identity_liege', 'context_office_history', 'context_office_evidence']) {
    const tables = { ...input.tables };
    delete tables[table];
    assert.throws(() => auditCoverageContract({ ...input, tables }), { code: 'E_COVERAGE_ROWS' }, table);
    tables[table] = [];
    assert.throws(() => auditCoverageContract({ ...input, tables }), { code: 'E_COVERAGE_ROWS' }, `${table}: empty`);
  }
  for (const [table, column] of [['context_holding', 'direct_ownership'], ['context_feudal_title', 'political_parent_title_id'],
    ['context_office_appointment', 'status'], ['context_office_history', 'rank_ko']]) {
    const rows = input.tables[table].map((row) => { const copy = { ...row }; delete copy[column]; return copy; });
    assert.throws(() => auditCoverageContract({ ...input, tables: { ...input.tables, [table]: rows } }), { code: 'E_COVERAGE_ROWS' });
  }
});
