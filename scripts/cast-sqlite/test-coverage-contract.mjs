import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertDocumentShape, auditCoverageContract, auditEngineDocumentShape, COVERAGE_CONTRACT, fieldCoverageManifest } from './coverage-contract.mjs';
import { REQUIRED_SOURCE_PATHS } from './sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';

const source = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));

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
