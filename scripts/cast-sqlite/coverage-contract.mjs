import { DATA_SOURCE_PATHS, REQUIRED_SOURCE_PATHS, SCRIPT_SOURCE_PATHS } from './sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { TEXT_SOURCE_PATHS } from './text-corpus-manifest.mjs';

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const pool = (name) => `lore/name-pools/${name}.json`;
const relation = (name) => `lore/relations/${name}.json`;

export const NON_JSON_SOURCE_SCOPE = Object.freeze({
  'WORLD_BUILDING_GUIDE.md': '현행 서울 범위와 비공개 소재의 정책 근거; 인물별 JSON 필드 없음',
  'lore/characters/Cast-Profile-Contract.md': '카드·역사 수치 해석 계약; 인물별 JSON 필드 없음',
  'scripts/gurps-cast.mjs': '역사 GURPS 생성·검사 코드의 고정 해시 근거; 데이터 행 아님',
  'scripts/lore-json-render.mjs': '카드 산문 렌더 코드의 고정 해시 근거; 데이터 행 아님',
});

// Declared JSON sources. Every leaf must still map to a column or a stated exclusion.
const SHAPES = Object.freeze({
  "lore/characters/Cast-Corridors-Index.json": true,
  "lore/characters/Cast-Index-S4.json": true,
  "lore/characters/Cast-Index.json": true,
  "lore/characters/Cast-Relations.json": true,
  "lore/characters/Cast-State-01.json": true,
  "lore/characters/Cast-State-02.json": true,
  "lore/characters/Cast-State-03.json": true,
  "lore/characters/Cast-State-04.json": true,
  "lore/characters/Cast-State-05.json": true,
  "lore/characters/Cast-State-06.json": true,
  "lore/characters/Cast-State-07.json": true,
  "lore/characters/Cast-State-08.json": true,
  "lore/characters/Cast-State-09.json": true,
  "lore/characters/Cast-State-10.json": true,
  "lore/characters/Cast-State-11.json": true,
  "lore/characters/Cast-State-12.json": true,
  "lore/characters/Cast-State-13.json": true,
  "lore/characters/Cast-State-14.json": true,
  "lore/characters/Cast-State-15.json": true,
  "lore/characters/Cast-State-16.json": true,
  "lore/characters/Cast-Unaffiliated.json": true,
  "lore/characters/Core-Characters.json": true,
  "lore/chronology/Century-Annals.json": true,
  "lore/chronology/Scenario-Timeline.json": true,
  "lore/factions/Diaspora-Corridors.json": true,
  "lore/name-pools/cast-birth-cohorts.json": true,
  "lore/name-pools/cast-birthdays.json": true,
  "lore/name-pools/cast-family-parent-status.json": true,
  "lore/name-pools/cast-family-role-decisions.json": true,
  "lore/name-pools/cast-family-trees.json": true,
  "lore/name-pools/cast-hangnyeol.json": true,
  "lore/name-pools/cast-household-relations.json": true,
  "lore/name-pools/cast-prose-contacts.json": true,
  "lore/name-pools/clan-hangnyeol-tables.json": true,
  "lore/name-pools/diaspora-family-lineages.json": true,
  "lore/name-pools/gender-cast.json": true,
  "lore/name-pools/gurps-cast.json": true,
  "lore/name-pools/household-humanoid-policy.json": true,
  "lore/name-pools/person-id-registry.json": true,
  "lore/name-pools/values-cast.json": true,
  "lore/regions/outside-control-2126.json": true,
  "lore/regions/seoul-electoral-titles.json": true,
  "lore/relations/opening-feudal-allocation.json": true,
  "lore/relations/opening-office-appointments.json": true,
  "lore/relations/personal-holdings.json": true,
  "lore/relations/relations.json": true
});

const person = (table, column, roots, countRoot = roots[0]) => ({ table, column, roots, countRoot });
const COMMON_DOCUMENT_EXCLUSION = Object.freeze({
  version: '문서 형식 버전', domain: '문서 분류', id: '문서 식별자', slug: '문서 경로',
  categories: '문서 분류', status: '편집 상태', tense: '문서 시제', provenance: '문서 출처',
  source: '문서 저작 정보', locales: '문서 언어', data: '인물 원천이 아닌 문서 부가 자료',
});
const ENGINE_SHAPES = Object.freeze({
  "lore/editorial/profile-batches/special.json": true,
  "lore/editorial/profile-batches/state-01-02.json": true,
  "lore/editorial/profile-batches/state-03-04.json": true,
  "lore/editorial/profile-batches/state-05-06.json": true,
  "lore/editorial/profile-batches/state-07-08.json": true,
  "lore/editorial/profile-batches/state-09-10.json": true,
  "lore/editorial/profile-batches/state-11-12.json": true,
  "lore/editorial/profile-batches/state-13-14.json": true,
  "lore/editorial/profile-batches/state-15-16.json": true
});
const document = (path, mapping, primaryDetailNames = false) => [path, {
  mappings: primaryDetailNames ? [mapping, person('profile', 'is_primary', ['data'])] : [mapping],
  exclusions: COMMON_DOCUMENT_EXCLUSION,
}];

const FAMILY_RULES = Object.freeze(Object.fromEntries([
  [pool('person-id-registry'), { mappings: [person('person', 'person_id', ['persons']),
    person('identity_registry_provenance', 'approved_by', ['schema', 'approvalRef', 'totalPeople', 'existingKCount', 'issuedCount'])], exclusions: {} }],
  [pool('values-cast'), { mappings: [person('person', 'name', ['people']), person('person_value', 'value', ['people']), person('person_desire', 'axis_name', ['people']), person('value_axis', 'axis_name', ['axes']), person('desire_axis', 'axis_name', ['desire_axes'])], exclusions: { schema: '규격', note: '편집 설명', count: '인원 검산값' } }],
  [pool('gender-cast'), { mappings: [person('person_gender', 'gender', ['people']),
    person('identity_gender_provenance', 'person_count', ['schema', 'owner_decision', 'count', 'assignment']),
    person('identity_gender_category', 'category', ['categories']),
    person('identity_gender_policy', 'state_id', ['policies'])], exclusions: {} }],
  [pool('cast-hangnyeol'), { mappings: [person('person_lineage', 'person_id', ['people']), person('lineage_node', 'name', ['lineage']), person('lineage_clan_assignment', 'clan_id', ['assignment']),
    person('identity_lineage_provenance', 'catalog_id', ['id', 'schema', 'note'])], exclusions: { sources: '현재 빈 원천 출처 목록' } }],
  [pool('clan-hangnyeol-tables'), { mappings: [person('clan', 'clan_id', ['clans']),
    person('identity_clan_catalog_provenance', 'catalog_id', ['id', 'schema', 'note']),
    person('identity_clan_research_source', 'research_source_id', ['sources'])], exclusions: {} }],
  [pool('gurps-cast'), { mappings: [person('gurps_profile', 'person_id', ['people']), person('gurps_attribute', 'value', ['people']), person('gurps_trait', 'name', ['people']), person('gurps_skill', 'name', ['people']), person('gurps_territory', 'fief_name', ['people']), person('gurps_unit', 'type', ['people']), person('gurps_wandering_force', 'type', ['people'])], exclusions: { schema: '규격', status: '역사 장부 상태', note: '편집 설명', invariants: '입력 해시 계약', count: '인원 검산값', rules: '인물별 데이터가 아닌 역사 규칙 설명; 현 엔진 수치로 변환하지 않음' } }],
  [pool('cast-birthdays'), { mappings: [person('family_birthday', 'birth_date', ['people'])], exclusions: { schemaVersion: '규격', ageAsOf: '가족 메타데이터 테이블에서 보존' } }],
  [pool('cast-birth-cohorts'), { mappings: [person('family_birth_cohort', 'cohort_id', ['cohorts']), person('family_birth_cohort_assignment', 'person_id', ['assignments'])], exclusions: { schemaVersion: '규격', approvalRef: '가족 메타데이터 테이블에서 보존', approvedOption: '가족 메타데이터 테이블에서 보존', proposalSha256: '가족 메타데이터 테이블에서 보존', baselineRevision: '가족 메타데이터 테이블에서 보존', baselineBirthdaySha256: '가족 메타데이터 테이블에서 보존', baselineRegistrySha256: '가족 메타데이터 테이블에서 보존' } }],
  [pool('cast-family-parent-status'), { mappings: [person('family_parent_status', 'person_id', ['records'])], exclusions: { schemaVersion: '규격' } }],
  [pool('cast-family-role-decisions'), { mappings: [person('family_role_decision', 'decision_group', ['finalOwnerAuthoredRoles', 'approvedExternalMaternalAncestors', 'approvedConfirmedFatherRoles', 'ownerAuthoredRoleOnly', 'recursiveAncestorCorrections', 'sourceBoundRoleCorrections', 'maternalCorrections', 'derivedParentRoles', 'unresolved'])], exclusions: { schemaVersion: '규격', authorization: '가족 메타데이터 테이블에서 보존' } }],
  [pool('cast-family-trees'), { mappings: [person('family_node', 'node_id', ['nodes']), person('family_edge', 'edge_id', ['edges']), person('family_tree_source', 'source_path', ['sourceRefs'])], exclusions: { schemaVersion: '규격', collapseYear: 'family_tree 메타데이터', referenceDate: 'family_tree 메타데이터', status: 'family_tree 메타데이터', imports: '가족 원천 결합 기록' } }],
  [pool('cast-household-relations'), { mappings: [person('household_person', 'person_id', ['people']), person('household_humanoid_context', 'actor_id', ['existingHumanoidContext']), person('household_manifest', 'manifest_id', ['quantityContract', 'scope'])], exclusions: { schema: '규격', status: 'household_manifest 메타데이터' } }],
  [pool('diaspora-family-lineages'), { mappings: [person('diaspora_lineage', 'lineage_key', ['lineages'])], exclusions: { schema: '규격', sourceKind: '가족 메타데이터 테이블에서 보존', authorization: '가족 메타데이터 테이블에서 보존', collapseDate: '가족 메타데이터 테이블에서 보존', openingYear: '가족 메타데이터 테이블에서 보존', ageAsOf: '가족 메타데이터 테이블에서 보존', generationIntervalYears: '가족 메타데이터 테이블에서 보존', generationIntervalExceptions: '가족 세대 규칙', sourceDocument: '가족 메타데이터 테이블에서 보존' } }],
  [pool('household-humanoid-policy'), { mappings: [person('household_policy_value', 'policy_key', ['counts', 'tierQuotas', 'faithStates', 'faithEvidence', 'priority', 'unknownOrientation', 'knownOrientations', 'otherKnownOrientationGender', 'existingGender', 'facilityCustody', 'seedKey', 'sexualRelationship']), person('household_policy_political_position', 'position', ['politicalPositions'])], exclusions: { schema: '규격', approvalRef: '가족 메타데이터 테이블에서 보존', sourceRefs: 'household_policy_source에서 보존' } }],
  [pool('cast-prose-contacts'), { mappings: [person('context_prose_contact', 'person_id', ['records'])], exclusions: { schemaVersion: '규격', status: '문서 편집 상태; 현행 승인으로 승격하지 않음', approvalStatus: '문서 승인 대기 표기; 인물별 승인으로 승격하지 않음', sourceNote: '출처 보존 설명' } }],
  [relation('relations'), { mappings: [person('context_court', 'court_id', ['courts']), person('context_direct_retainer', 'person_id', ['directRetainers']), person('context_owner_liege', 'person_id', ['ownerLieges']), person('context_court_membership', 'person_id', ['courtMemberships']), person('context_organization', 'organization_id', ['organizations']), person('context_event_link', 'event_id', ['eventLinks']), person('context_relation_contract', 'contract_id', ['courtContract'])], exclusions: { schema: '규격', note: '편집 설명', provisionalPeople: '발급 전 지역 ID는 현재 0건' } }],
  [relation('personal-holdings'), { mappings: [person('context_holding', 'holding_id', ['holdings']), person('context_polity', 'polity_id', ['polities']), person('context_retinue_group', 'retinue_group_id', ['retinueGroups']), person('context_opening_disposition', 'person_id', ['openingDispositions'])], exclusions: { schema: '규격', openingYear: 'context_holding.opening_year 등에 보존' } }],
  [relation('opening-office-appointments'), { mappings: [person('context_office_appointment', 'person_id', ['appointments'])], exclusions: { schema: '규격', openingYear: 'context_office_appointment.opening_year에 보존' } }],
  [relation('opening-feudal-allocation'), { mappings: [person('historical_feudal_title', 'holder_person_id', ['titles']), person('historical_feudal_grant', 'holder_person_id', ['grants']), person('historical_feudal_binding', 'title_id', ['existingTitleBindings'])], exclusions: { schema: '규격', openingYear: '역사 배정 시점' } }],
  ['lore/regions/outside-control-2126.json', { mappings: [person('historical_outside_person_control', 'holder_person_id', ['assignments'])], exclusions: { schema: '규격', basis: '역사 외부 통제 분류 근거' } }],
  ['lore/regions/seoul-electoral-titles.json', { mappings: [], exclusions: { '*': '개별 인물 권리 확정 이전의 지역 검토 장부; 인물 권리 테이블로 승격 금지' } }],
  ...Array.from({ length: 16 }, (_, index) => {
    const state = index + 1;
    return document(`lore/characters/Cast-State-${String(state).padStart(2, '0')}.json`,
      person('profile_node', 'json_pointer', ['content']), [5, 8, 12].includes(state));
  }),
  document('lore/characters/Core-Characters.json', person('profile_node', 'json_pointer', ['content']), true),
  document('lore/characters/Cast-Unaffiliated.json', person('profile_node', 'json_pointer', ['content'])),
  document('lore/characters/Cast-Relations.json', person('relation', 'from_person_id', ['content'])),
  ...['Cast-Index', 'Cast-Index-S4', 'Cast-Corridors-Index'].map((name) => document(`lore/characters/${name}.json`, person('index_document', 'document_id', ['content']))),
  document('lore/factions/Diaspora-Corridors.json', person('profile_node', 'json_pointer', ['content'])),
  ...['lore/chronology/Century-Annals.json', 'lore/chronology/Scenario-Timeline.json'].map((path) => [path, { mappings: [], exclusions: { ...COMMON_DOCUMENT_EXCLUSION, content: '인물 카드의 참조 문서; 본 문서는 독립된 인물 장부가 아님' } }]),
]));

// Current-rights sources and exact source-to-column targets.
const RIGHTS_SHAPES = Object.freeze({
  "scripts/approved-seoul-rights-transition.json": true,
  "scripts/approved-daejeon-nonowning-rights.json": true,
  "scripts/approved-outside-current-retirement.json": true,
  "scripts/historical-inputs/personal-holdings.json": true,
  "scripts/historical-inputs/opening-feudal-allocation.json": true,
  "scripts/historical-inputs/outside-control-2126.json": true,
  "scripts/historical-inputs/outside-island-occupation.json": true,
  "lore/regions/outside-island-occupation.json": true,
  "lore/relations/personal-holdings.json": true,
  "lore/relations/opening-feudal-allocation.json": true,
  "lore/regions/outside-control-2126.json": true,
  "lore/relations/opening-office-appointments.json": true,
  "lore/regions/seoul-electoral-titles.json": true
});
const RIGHTS_RULES = Object.freeze({
  "scripts/approved-seoul-rights-transition.json": {
    leafTargets: {
      "/approvalReceiptSha256": ["context_rights_approval.receipt_sha256"],
      "/approvalRef": ["context_rights_approval.approval_ref"],
      "/nonowningPackageSha256": ["context_rights_approval.package_sha256"],
      "/originalSources/allocation/path": ["context_rights_original_source.logical_path"],
      "/originalSources/allocation/sha256": ["context_rights_original_source.expected_sha256"],
      "/originalSources/existing/path": ["context_rights_original_source.logical_path"],
      "/originalSources/existing/sha256": ["context_rights_original_source.expected_sha256"],
      "/records/[]/currentId": ["context_rights_transition.current_id"],
      "/records/[]/disposition": ["context_rights_transition.disposition"],
      "/records/[]/oldId": ["context_rights_transition.old_id"],
      "/records/[]/set": ["context_rights_transition.set_name"],
      "/records/[]/sourceValueSha256": ["context_rights_transition.original_value_sha256"],
      "/schema": ["context_rights_approval.source_schema"]
    },
    leafExclusions: {
      "/polities/[]/authority/kind": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/authority/name": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/directOwnership": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/formalTitle": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/formalTitleRank": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/id": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/name/en": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/name/ko": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/office": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/politicalTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/sovereignPersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/polities/[]/territorialScale": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/adminRefs/[]:empty": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/basis": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/capabilityPackageId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/directLiegePersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/directOwnership": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/formalTitleRank": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicParentTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicScope/countyTitleIds/[]": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicScope/duchyTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicScope/geographicEmpireId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicScope/geographicKingdomId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicScope/guRef": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geographicTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/geometrySource": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/holderPersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/holdingId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/id": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/jurisdictionRefs/[]": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/kind": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/liegeRelationshipKind": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/name": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/name/ko": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/parentTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/personalLiegePersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/politicalParentTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/powers/[]": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/rank": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/stateId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/territorialScale": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/records/[]/current/titleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음"
    },
  },
  "scripts/approved-daejeon-nonowning-rights.json": {
    leafTargets: {
      "/approval/messageRef": ["context_rights_approval.message_ref"],
      "/approval/proposalSha256": ["context_rights_approval.proposal_sha256"],
      "/approval/receiptSha256": ["context_rights_approval.receipt_sha256"],
      "/contract/approvalRef": ["context_rights_approval.approval_ref"],
      "/schema": ["context_rights_approval.source_schema"]
    },
    leafExclusions: {
      "/activeRecordPolicy/activationDecisionIds": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/activeRecordPolicy/status": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/contract/capabilityPackageId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/politicalTitle/holderPersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/politicalTitle/id": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/politicalTitle/stateId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/proposalSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/contract/rights/[]/geographicScope/countyTitleIds/[]": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/geographicScope/duchyTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/geographicScope/geographicEmpireId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/geographicScope/geographicKingdomId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/geographicScope/guRef": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/holderPersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/holdingId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/personalLiegePersonId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/politicalParentTitleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/stateId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/rights/[]/titleId": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음",
      "/contract/schema": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/powers/[]": "인증 시 현행 successor와 대조하는 중복 계약값; 정규화는 현행 allocation/holdings 원천 source_id로만 기록하며 manifest 행으로 가장하지 않음"
    },
  },
  "scripts/approved-outside-current-retirement.json": {
    leafTargets: {
      "/approvalReceipt/sha256": ["context_rights_approval.receipt_sha256"],
      "/approvalRef": ["context_rights_approval.approval_ref"],
      "/originalSources/control/path": ["context_rights_original_source.logical_path"],
      "/originalSources/control/sha256": ["context_rights_original_source.expected_sha256"],
      "/originalSources/islands/path": ["context_rights_original_source.logical_path"],
      "/originalSources/islands/sha256": ["context_rights_original_source.expected_sha256"],
      "/records/[]/approvalRef": ["context_outside_retirement.approval_ref"],
      "/records/[]/recordKey": ["context_outside_retirement.record_key"],
      "/records/[]/sourceValueSha256": ["context_outside_retirement.original_value_sha256"],
      "/records/[]/status": ["context_outside_retirement.status"],
      "/schema": ["context_rights_approval.source_schema"]
    },
    leafExclusions: {
      "/approvalReceipt/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님"
    },
  },
  "scripts/historical-inputs/personal-holdings.json": {
    leafTargets: {

    },
    leafExclusions: {
      "/holdings/[]/adminRefs/[]/id": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/adminRefs/[]/name": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/adminRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/holdings/[]/designation/en": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/designation/ko": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/directLiegePersonId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/layerId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/layerName": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/siteAnchor": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/siteSourcePath": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/sourcePath": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/stationId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/stationIdentity/district": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/stationIdentity/lat": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/stationIdentity/lon": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/facilityRef/stationName": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/formalTitleRank": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/geometrySource": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/holderPersonId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/id": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/landmarkRef/landmarkId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/landmarkRef/sourcePath": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/name/en": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/name/ko": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/parentGeography": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/stateId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/stationRef/stationId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/stationRef/stationName": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/territorialScale": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/holdings/[]/wholeSeoulControl": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDispositions/[]/approvalRef": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDispositions/[]/personId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDispositions/[]/status": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingYear": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/authority/kind": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/authority/name": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/formalTitle": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/formalTitleRank": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/id": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/name/en": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/name/ko": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/office": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/sovereignPersonId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/polities/[]/territorialScale": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/count": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/courtId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/duties/[]": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/formalTitle": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/holdingIds/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/retinueGroups/[]/id": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/liegePersonId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/name/en": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/name/ko": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/personhoodReview": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/retinueGroups/[]/technicalLimits/[]": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/schema": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음"
    },
  },
  "scripts/historical-inputs/opening-feudal-allocation.json": {
    leafTargets: {
      "/existingTitleBindings/[]/holdingId": ["historical_feudal_binding.holding_id"],
      "/existingTitleBindings/[]/liegeRelationshipKind": ["historical_feudal_binding.liege_relationship_kind"],
      "/existingTitleBindings/[]/titleId": ["historical_feudal_binding.title_id"],
      "/grants/[]/adminRefs/[]/id": ["historical_feudal_grant_admin.admin_unit_id"],
      "/grants/[]/adminRefs/[]/name": ["historical_feudal_grant_admin.admin_unit_name"],
      "/grants/[]/componentRefs/[]/componentIndex": ["historical_feudal_grant_component.component_index"],
      "/grants/[]/componentRefs/[]/unitId": ["historical_feudal_grant_component.admin_unit_id"],
      "/grants/[]/directLiegePersonId": ["historical_feudal_grant.liege_person_id"],
      "/grants/[]/formalTitleRank": ["historical_feudal_grant.formal_title_rank"],
      "/grants/[]/geometrySource": ["historical_feudal_grant.geometry_source"],
      "/grants/[]/holderPersonId": ["historical_feudal_grant.holder_person_id"],
      "/grants/[]/id": ["historical_feudal_grant.grant_id"],
      "/grants/[]/name/ko": ["historical_feudal_grant.name_ko"],
      "/grants/[]/stateId": ["historical_feudal_grant.polity_id"],
      "/grants/[]/territorialScale": ["historical_feudal_grant.territorial_scale"],
      "/grants/[]/titleId": ["historical_feudal_grant.title_id"],
      "/titles/[]/holderPersonId": ["historical_feudal_title.holder_person_id"],
      "/titles/[]/id": ["historical_feudal_title.title_id"],
      "/titles/[]/jurisdictionRefs/[]": ["historical_feudal_jurisdiction.admin_unit_id"],
      "/titles/[]/name": ["historical_feudal_title.name"],
      "/titles/[]/parentTitleId": ["historical_feudal_title.parent_title_id"],
      "/titles/[]/rank": ["historical_feudal_title.rank"],
      "/titles/[]/stateId": ["historical_feudal_title.polity_id"]
    },
    leafExclusions: {
      "/existingTitleBindings/[]/basis": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/grants/[]/adminRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/grants/[]/componentRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/openingYear": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/schema": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/titles/[]/basis": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/titles/[]/jurisdictionRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증"
    },
  },
  "scripts/historical-inputs/outside-control-2126.json": {
    leafTargets: {
      "/assignments/[]/authority/kind": ["historical_outside_person_control.authority_kind"],
      "/assignments/[]/authority/name": ["historical_outside_person_control.authority_name"],
      "/assignments/[]/authority/stateId": ["historical_outside_person_control.authority_state_id"],
      "/assignments/[]/directLiegePersonId": ["historical_outside_person_control.liege_person_id"],
      "/assignments/[]/holderPersonId": ["historical_outside_person_control.holder_person_id"],
      "/assignments/[]/unitId": ["historical_outside_person_control.admin_unit_id"]
    },
    leafExclusions: {
      "/assignments/[]/authority": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/assignments/[]/station": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/assignments/[]/vassal": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/basis": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/schema": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음"
    },
  },
  "scripts/historical-inputs/outside-island-occupation.json": {
    leafTargets: {

    },
    leafExclusions: {
      "/geometrySource": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/geometrySourceSha256": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDecision/anonymousComponentApprovalRef": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDecision/authority/kind": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDecision/authority/name": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDecision/authority/stateId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDecision/namedIslandApprovalRefs/[]": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/openingDecision/policy": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/schema": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/authority": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/authority/kind": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/authority/name": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/authority/stateId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/componentIndex": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/connection": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/location/[]": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/name": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/components/[]/sources/[]": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/pathSha256": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음",
      "/units/[]/unitId": "보존 원본·인증 입력: 해당 필드는 독립 정규화 projection이 없으며 현행 권리로 승격하지 않음"
    },
  },
  "lore/regions/outside-island-occupation.json": {
    leafTargets: {

    },
    leafExclusions: {
      "/geometrySource": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/geometrySourceSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/schema": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/units/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증"
    },
  },
  "lore/relations/personal-holdings.json": {
    leafTargets: {
      "/holdings/[]/capabilityPackageId": ["context_holding.capability_package_id"],
      "/holdings/[]/designation/en": ["context_holding.designation_en"],
      "/holdings/[]/designation/ko": ["context_holding.designation_ko"],
      "/holdings/[]/directLiegePersonId": ["context_holding.direct_liege_person_id"],
      "/holdings/[]/directOwnership": ["context_holding.direct_ownership"],
      "/holdings/[]/formalTitleRank": ["context_holding.formal_title_rank"],
      "/holdings/[]/geographicScope/countyTitleIds/[]": ["context_holding_scope_county.county_title_id"],
      "/holdings/[]/geographicScope/duchyTitleId": ["context_holding_geographic_scope.duchy_title_id"],
      "/holdings/[]/geographicScope/geographicEmpireId": ["context_holding_geographic_scope.empire_geography_id"],
      "/holdings/[]/geographicScope/geographicKingdomId": ["context_holding_geographic_scope.kingdom_geography_id"],
      "/holdings/[]/geographicScope/guRef": ["context_holding_geographic_scope.gu_ref"],
      "/holdings/[]/geometrySource": ["context_holding.geometry_source"],
      "/holdings/[]/holderPersonId": ["context_holding.holder_person_id"],
      "/holdings/[]/id": ["context_holding.holding_id"],
      "/holdings/[]/kind": ["context_holding.kind"],
      "/holdings/[]/liegeRelationshipKind": ["context_holding.liege_relationship_kind"],
      "/holdings/[]/name/en": ["context_holding.name_en"],
      "/holdings/[]/name/ko": ["context_holding.name_ko"],
      "/holdings/[]/parentGeography": ["context_holding.parent_geography"],
      "/holdings/[]/powers/[]": ["context_holding_power.power"],
      "/holdings/[]/stateId": ["context_holding.polity_id"],
      "/holdings/[]/territorialScale": ["context_holding.territorial_scale"],
      "/holdings/[]/titleId": ["context_holding.title_id"],
      "/holdings/[]/wholeSeoulControl": ["context_holding.whole_seoul_control"],
      "/openingDispositions/[]/approvalRef": ["context_opening_disposition.approval_ref"],
      "/openingDispositions/[]/personId": ["context_opening_disposition.person_id"],
      "/openingDispositions/[]/status": ["context_opening_disposition.status"],
      "/polities/[]/authority/kind": ["context_polity.authority_kind"],
      "/polities/[]/authority/name": ["context_polity.authority_name"],
      "/polities/[]/directOwnership": ["context_polity.direct_ownership"],
      "/polities/[]/formalTitle": ["context_polity.formal_title"],
      "/polities/[]/formalTitleRank": ["context_polity.formal_title_rank"],
      "/polities/[]/id": ["context_polity.polity_id"],
      "/polities/[]/name/en": ["context_polity.name_en"],
      "/polities/[]/name/ko": ["context_polity.name_ko"],
      "/polities/[]/office": ["context_polity.office"],
      "/polities/[]/politicalTitleId": ["context_polity.political_title_id"],
      "/polities/[]/sovereignPersonId": ["context_polity.sovereign_person_id"],
      "/polities/[]/territorialScale": ["context_polity.territorial_scale"],
      "/holdings/[]/adminRefs/[]/id": ["context_holding_admin_ref.admin_id"],
      "/holdings/[]/adminRefs/[]/name": ["context_holding_admin_ref.admin_name"],
      "/holdings/[]/facilityRef/layerId": ["context_holding_reference.reference_id"],
      "/holdings/[]/facilityRef/layerName": ["context_holding_reference.reference_name"],
      "/holdings/[]/facilityRef/siteAnchor": ["context_holding_reference.reference_anchor"],
      "/holdings/[]/facilityRef/siteSourcePath": ["context_holding_reference.site_source_path"],
      "/holdings/[]/facilityRef/sourcePath": ["context_holding_reference.reference_source_path"],
      "/holdings/[]/facilityRef/stationId": ["context_holding_reference.station_id"],
      "/holdings/[]/facilityRef/stationIdentity/district": ["context_holding_reference.station_district"],
      "/holdings/[]/facilityRef/stationIdentity/lat": ["context_holding_reference.station_lat"],
      "/holdings/[]/facilityRef/stationIdentity/lon": ["context_holding_reference.station_lon"],
      "/holdings/[]/facilityRef/stationName": ["context_holding_reference.station_name"],
      "/holdings/[]/landmarkRef/landmarkId": ["context_holding_reference.reference_id"],
      "/holdings/[]/landmarkRef/sourcePath": ["context_holding_reference.reference_source_path"],
      "/holdings/[]/stationRef/stationId": ["context_holding_reference.station_id"],
      "/holdings/[]/stationRef/stationName": ["context_holding_reference.station_name"],
      "/openingYear": ["context_holding.opening_year"],
      "/retinueGroups/[]/count": ["context_retinue_group.person_count"],
      "/retinueGroups/[]/courtId": ["context_retinue_group.court_id"],
      "/retinueGroups/[]/duties/[]": ["context_retinue_duty.duty"],
      "/retinueGroups/[]/formalTitle": ["context_retinue_group.formal_title"],
      "/retinueGroups/[]/id": ["context_retinue_group.retinue_group_id"],
      "/retinueGroups/[]/liegePersonId": ["context_retinue_group.liege_person_id"],
      "/retinueGroups/[]/name/en": ["context_retinue_group.name_en"],
      "/retinueGroups/[]/name/ko": ["context_retinue_group.name_ko"],
      "/retinueGroups/[]/personhoodReview": ["context_retinue_group.personhood_review"],
      "/retinueGroups/[]/technicalLimits/[]": ["context_retinue_technical_limit.technical_limit"],
      "/schema": ["context_holding.source_schema"]
    },
    leafExclusions: {
      "/holdings/[]/adminRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/retinueGroups/[]/holdingIds/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증"
    },
  },
  "lore/relations/opening-feudal-allocation.json": {
    leafTargets: {
      "/politicalIdentities/[]/personalLieges/[]/holdingId": ["context_political_identity_liege.historical_holding_id"],
      "/politicalIdentities/[]/personalLieges/[]/directLiegePersonId": ["context_political_identity_liege.liege_person_id"],
      "/existingTitleBindings/[]/basis": ["context_feudal_binding.basis"],
      "/existingTitleBindings/[]/holdingId": ["context_feudal_binding.holding_id"],
      "/existingTitleBindings/[]/liegeRelationshipKind": ["context_feudal_binding.liege_relationship_kind"],
      "/existingTitleBindings/[]/titleId": ["context_feudal_binding.title_id"],
      "/grants/[]/adminRefs/[]/id": ["context_feudal_grant_admin.admin_unit_id"],
      "/grants/[]/adminRefs/[]/name": ["context_feudal_grant_admin.admin_unit_name"],
      "/grants/[]/directLiegePersonId": ["context_feudal_grant.liege_person_id"],
      "/grants/[]/formalTitleRank": ["context_feudal_grant.formal_title_rank"],
      "/grants/[]/geometrySource": ["context_feudal_grant.geometry_source"],
      "/grants/[]/holderPersonId": ["context_feudal_grant.holder_person_id"],
      "/grants/[]/id": ["context_feudal_grant.grant_id"],
      "/grants/[]/name/ko": ["context_feudal_grant.name_ko"],
      "/grants/[]/stateId": ["context_feudal_grant.polity_id"],
      "/grants/[]/territorialScale": ["context_feudal_grant.territorial_scale"],
      "/grants/[]/titleId": ["context_feudal_grant.title_id"],
      "/politicalIdentities/[]/directOwnership": ["context_political_identity.direct_ownership"],
      "/politicalIdentities/[]/holderPersonId": ["context_political_identity.holder_person_id"],
      "/politicalIdentities/[]/id": ["context_political_identity.identity_id"],
      "/politicalIdentities/[]/kind": ["context_political_identity.kind"],
      "/politicalIdentities/[]/politicalParentTitleId": ["context_political_identity.political_parent_title_id"],
      "/politicalIdentities/[]/rank": ["context_political_identity.rank"],
      "/politicalIdentities/[]/stateId": ["context_political_identity.polity_id"],
      "/titles/[]/basis": ["context_feudal_title.basis"],
      "/titles/[]/directOwnership": ["context_feudal_title.direct_ownership"],
      "/titles/[]/geographicParentTitleId": ["context_feudal_title.geographic_parent_title_id"],
      "/titles/[]/geographicTitleId": ["context_feudal_title.geographic_title_id"],
      "/titles/[]/holderPersonId": ["context_feudal_title.holder_person_id"],
      "/titles/[]/id": ["context_feudal_title.title_id"],
      "/titles/[]/jurisdictionRefs/[]": ["context_feudal_jurisdiction.admin_unit_id"],
      "/titles/[]/kind": ["context_feudal_title.kind"],
      "/titles/[]/name": ["context_feudal_title.name"],
      "/titles/[]/parentTitleId": ["context_feudal_title.parent_title_id"],
      "/titles/[]/personalLiegePersonId": ["context_feudal_title.personal_liege_person_id"],
      "/titles/[]/politicalParentTitleId": ["context_feudal_title.political_parent_title_id"],
      "/titles/[]/rank": ["context_feudal_title.rank"],
      "/titles/[]/stateId": ["context_feudal_title.polity_id"]
    },
    leafExclusions: {
      "/grants/[]/componentRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/openingYear": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/politicalIdentities/[]/personalLieges/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/schema": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님"
    },
  },
  "lore/regions/outside-control-2126.json": {
    leafTargets: {

    },
    leafExclusions: {
      "/assignments/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/schema": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님"
    },
  },
  "lore/relations/opening-office-appointments.json": {
    leafTargets: {
      "/appointments/[]/current/commonTier": ["context_office_appointment.common_tier"],
      "/appointments/[]/current/evidence/[]/jsonPointer": ["context_office_evidence.reference_pointer"],
      "/appointments/[]/current/evidence/[]/kind": ["context_office_evidence.evidence_kind"],
      "/appointments/[]/current/evidence/[]/path": ["context_office_evidence.reference_path"],
      "/appointments/[]/current/position": ["context_office_appointment.position_ko","context_office_appointment.position_en"],
      "/appointments/[]/current/position/en": ["context_office_appointment.position_en"],
      "/appointments/[]/current/position/ko": ["context_office_appointment.position_ko"],
      "/appointments/[]/current/rank": ["context_office_appointment.rank_ko","context_office_appointment.rank_en"],
      "/appointments/[]/current/rank/en": ["context_office_appointment.rank_en"],
      "/appointments/[]/current/rank/ko": ["context_office_appointment.rank_ko"],
      "/appointments/[]/current/status": ["context_office_appointment.status"],
      "/appointments/[]/history/approvalRef": ["context_office_history.approval_ref"],
      "/appointments/[]/history/commonTier": ["context_office_history.common_tier"],
      "/appointments/[]/history/personId": ["context_office_history.person_id"],
      "/appointments/[]/history/position/en": ["context_office_history.position_en"],
      "/appointments/[]/history/position/ko": ["context_office_history.position_ko"],
      "/appointments/[]/history/rank/en": ["context_office_history.rank_en"],
      "/appointments/[]/history/rank/ko": ["context_office_history.rank_ko"],
      "/appointments/[]/history/stateId": ["context_office_history.polity_id"],
      "/appointments/[]/personId": ["context_office_appointment.person_id"],
      "/appointments/[]/stateId": ["context_office_appointment.polity_id"],
      "/openingYear": ["context_office_appointment.opening_year"],
      "/schema": ["context_office_appointment.source_schema"]
    },
    leafExclusions: {
      "/contract/commonTier": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/contract/current": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/contract/history": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/contract/rights": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님"
    },
  },
  "lore/regions/seoul-electoral-titles.json": {
    leafTargets: {

    },
    leafExclusions: {
      "/countySlots/[]/countyTitleId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/currentCorrespondenceSlotIds/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/dongId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/electoralDongId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/fragmentId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/geometryRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/geometryVerified": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/historicalHoldingRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/countySlots/[]/slots/[]/holderPersonId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/holdingRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/countySlots/[]/slots/[]/jurisdictionGuRef": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/name": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/slotId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/sourceEdition": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/sourcePointer": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/sourceRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/countySlots/[]/slots/[]/status": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/countyTitleId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/candidateGeometryRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/dongId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/electoralDongId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/fragmentId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/geometryRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/currentCorrespondenceSlots/[]/slots/[]/geometryVerified": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/id": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/jsonPointer": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/recordSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/scopeKind": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/sourcePath": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/sourceSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/historicalHoldingRefs/[]/status": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/holderPersonId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/holdingRefs/[]:empty": "빈 컨테이너: 정규화 자식 행 0건이며 형상 계약으로 비어 있음을 검증",
      "/currentCorrespondenceSlots/[]/slots/[]/jurisdictionGuRef": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/name": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/slotId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/sourceEdition": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/sourcePointer": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/sourceRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/currentCorrespondenceSlots/[]/slots/[]/status": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentCorrespondence/administrativeCandidateDate": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentCorrespondence/codeAndNameSourceRef": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentCorrespondence/geometryVerified": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentCorrespondence/id": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentCorrespondence/officialMembershipCheckedAt": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentCorrespondence/sourceRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/appendixAmendedDate": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/appendixFileSeq": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/effectiveDate": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/id": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/lawNumber": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/promulgatedDate": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/currentLaw/sourceRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/electoral/electionDate": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/electoral/id": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/electoral/seoulCompositionMatchesCurrentAppendix": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/editions/electoral/sourceRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/census/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/census/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/membership/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/membership/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/rights/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/rights/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/spatial/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/evidence/spatial/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/kingdomStatus": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/mapMinimumRank": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/mapTitleIds/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/officialExtentStatus": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/schema": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/sourceRecords/[]/id": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/sourceRecords/[]/role": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/sourceRecords/[]/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/archiveSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/authority": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/baseDate": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/current2026Geometry": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/edition": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/geometry/crs": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/geometry/features": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/geometry/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/geometry/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/spatialSource/legalSurveyCertification": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/status": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/approval/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/approval/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/batchId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/beforeArchivePath": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/crossDistrictParentPolicy": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/partition/[]/countyTitleIds/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/partition/[]/jurisdictionRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/partition/[]/name": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/partition/[]/proposalId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/partition/[]/titleId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/partitionSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/previousSha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/proposal/path": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/proposal/sha256": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/successor/schema": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/countyTitleIds/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/feudalParentStatus": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/feudalParentTitleId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/geographicParentException": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/holderPersonId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/jurisdictionRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/name": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/rank": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/sourcePointer": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/sourceRefs/[]": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님",
      "/titles/[]/titleId": "검토용 지리·문서 규격·설명 계약: 독립 인물 권리 정규화 대상 아님"
    },
  }
});

export const COVERAGE_CONTRACT = Object.freeze(Object.fromEntries(
  Object.keys({ ...SHAPES, ...RIGHTS_SHAPES }).map((path) => {
    const rules = RIGHTS_RULES[path];
    const mappings = rules ? Object.entries(rules.leafTargets).flatMap(([leaf, targets]) => targets.map((target) => {
      const [table, column] = target.split('.');
      return person(table, column, [leaf.split('/')[1]]);
    })) : FAMILY_RULES[path].mappings;
    return [path, Object.freeze({ ...(rules ?? FAMILY_RULES[path]), mappings,
      exclusions: rules ? {} : { ...FAMILY_RULES[path].exclusions,
        ...(path === pool('gurps-cast') ? { provenance: '역사 장부의 출처·검토 설명; 현행 수치나 권리로 승격하지 않음' } : {}),
        ...(path === pool('household-humanoid-policy') ? { politicalPositionContext: '정치 정체성·권리 한계 설명 및 인증 참조; 새 가구·영토·개인 권리 projection 없음' } : {}) } })];
  }),
));

function leafPatterns(value) {
  const patterns = new Set();
  const visit = (node, path) => {
    if (Array.isArray(node)) {
      if (!node.length) patterns.add(`${path}/[]:empty`);
      else node.forEach((child) => visit(child, `${path}/[]`));
    } else if (node !== null && typeof node === 'object') {
      const keys = Object.keys(node);
      if (!keys.length) patterns.add(`${path}/{}:empty`);
      else keys.forEach((key) => visit(node[key], `${path}/${key}`));
    } else patterns.add(path);
  };
  visit(value, '');
  return [...patterns].sort();
}

export function assertDocumentShape(path, document) {
  const contract = COVERAGE_CONTRACT[path];
  if (!contract) fail('E_COVERAGE_UNDECLARED_SOURCE', path);
  const paths = leafPatterns(document);
  const roots = Object.keys(document);
  const mapped = new Set(contract.mappings.flatMap((entry) => entry.roots));
  const excluded = contract.exclusions;
  for (const root of roots) {
    if (contract.leafExclusions && paths.filter((leaf) => leaf.split('/')[1] === root)
      .every((leaf) => Object.hasOwn(contract.leafTargets, leaf) || Object.hasOwn(contract.leafExclusions, leaf))) continue;
    if (!mapped.has(root) && !Object.hasOwn(excluded, root) && !Object.hasOwn(excluded, '*')) fail('E_COVERAGE_UNDECLARED_FAMILY', `${path}#/${root}`);
  }
  return Object.freeze({ path, leafPatterns: paths.length, mappedFamilies: mapped.size, excludedFamilies: roots.length - mapped.size });
}

function nestedTargets(path, leafPattern) {
  if (path === pool('values-cast') && leafPattern.startsWith('/people/[]/')) {
    if (leafPattern.startsWith('/people/[]/values/')) return ['person_value.value'];
    if (leafPattern.startsWith('/people/[]/desires/')) return ['person_desire.axis_name'];
    return ['person.name'];
  }
  if (path === pool('gurps-cast') && leafPattern.startsWith('/people/[]/')) {
    const field = leafPattern.split('/')[3];
    if (leafPattern.includes('/evidence/[]/')) return ['evidence.subject_kind'];
    if (field === 'attributes') return ['gurps_attribute.value'];
    if (field === 'secondary') return ['gurps_secondary.value'];
    if (field === 'traits') return leafPattern.includes('/applicationBoundaries/')
      ? ['gurps_trait_application_boundary.text'] : ['gurps_trait.name'];
    if (field === 'skills') return ['gurps_skill.name'];
    if (field === 'languages') return ['gurps_language.name'];
    if (field === 'advantages') return ['gurps_advantage.name'];
    if (field === 'disadvantages') return ['gurps_disadvantage.name'];
    if (field === 'territory') return ['gurps_territory.type'];
    if (field === 'unit') return leafPattern.includes('/composition/')
      ? ['gurps_unit_composition.text'] : ['gurps_unit.type'];
    if (field === 'wandering_force') return leafPattern.includes('/facilities/')
      ? ['gurps_wandering_facility.text'] : ['gurps_wandering_force.type'];
    return ['gurps_profile.person_id'];
  }
  if (path === pool('cast-family-trees')) {
    if (leafPattern.startsWith('/nodes/[]/sourceRefs/')) return ['family_node_source.source_path'];
    if (leafPattern.startsWith('/nodes/[]/timeline/')) return ['family_node_timeline.year'];
    if (leafPattern.startsWith('/edges/[]/sourceRefs/')) return ['family_edge_source.source_path'];
  }
  if (path === pool('cast-household-relations') && leafPattern.startsWith('/people/[]/')) {
    if (/\/people\/\[\]\/((knownLinks|links)\/\[\])/u.test(leafPattern)) return ['household_link.link_id'];
    if (leafPattern.includes('/court/retainers/')) return ['household_court_retainer.person_id'];
    if (leafPattern.includes('/court/')) return ['household_court.court_id'];
    if (leafPattern.includes('/directRetainer/')) return ['household_court_retainer.person_id'];
    if (leafPattern.includes('/sourceRefs/')) return ['household_person_source.source_path'];
    return ['household_person.person_id'];
  }
  if (path === relation('personal-holdings') && leafPattern.startsWith('/holdings/[]/')) {
    if (leafPattern.includes('/adminRefs/')) return ['context_holding_admin_ref.admin_id'];
    if (/\/(facilityRef|landmarkRef|stationRef)\//u.test(leafPattern)) return ['context_holding_reference.reference_id'];
    return ['context_holding.holding_id'];
  }
  if (path === relation('personal-holdings') && leafPattern.startsWith('/retinueGroups/[]/')) {
    if (leafPattern.includes('/duties/')) return ['context_retinue_duty.duty'];
    if (leafPattern.includes('/technicalLimits/')) return ['context_retinue_technical_limit.technical_limit'];
    return ['context_retinue_group.retinue_group_id'];
  }
  if (path === relation('opening-feudal-allocation')) {
    if (leafPattern.startsWith('/titles/[]/jurisdictionRefs/')) return ['historical_feudal_jurisdiction.admin_unit_id'];
    if (leafPattern.startsWith('/grants/[]/adminRefs/')) return ['historical_feudal_grant_admin.admin_unit_id'];
    if (leafPattern.startsWith('/grants/[]/componentRefs/')) return ['historical_feudal_grant_component.admin_unit_id'];
  }
  if (path === 'lore/characters/Cast-Index.json') {
    if (leafPattern.startsWith('/content/')) return ['index_section.table_anchor', 'index_person.name_ko'];
  }
  if (path === 'lore/characters/Cast-Index-S4.json' && leafPattern.startsWith('/content/')) {
    return ['index_state_label.state_name_ko'];
  }
  if (path === 'lore/characters/Cast-Corridors-Index.json' && leafPattern.startsWith('/content/')) {
    return ['index_corridor_person.name_ko'];
  }
  return null;
}

export function fieldCoverageManifest(path, document) {
  assertDocumentShape(path, document);
  const contract = COVERAGE_CONTRACT[path];
  return Object.freeze(leafPatterns(document).map((leafPattern) => {
    const root = leafPattern.split('/')[1];
    const targets = contract.leafTargets ? contract.leafTargets[leafPattern] ?? [] : nestedTargets(path, leafPattern) ?? contract.mappings.filter((mapping) => mapping.roots.includes(root))
      .map((mapping) => `${mapping.table}.${mapping.column}`);
    const exclusion = targets.length ? null : contract.leafExclusions?.[leafPattern] ?? contract.exclusions[root] ?? contract.exclusions['*'];
    if (!targets.length && !exclusion) fail('E_COVERAGE_UNDECLARED_FAMILY', `${path}#${leafPattern}`);
    return Object.freeze({ logical_path: path, leaf_pattern: leafPattern,
      normalized_targets: Object.freeze(targets), exclusion_reason: exclusion });
  }));
}

const ENGINE_PUBLIC_TARGETS = Object.freeze({
  personId: ['current_profile.person_id'], name: ['person.name'],
  abilities: ['ability.base_value', 'ability.effective_value'],
  skills: ['skill.rating'], traits: ['trait.trait_ordinal', 'effect.delta'],
  health: ['health.status', 'body.body_part_id', 'disease.disease_ordinal'],
  narrative: ['narrative.narrative_ko', 'narrative.narrative_en'],
});

export function auditEngineDocumentShape(path, document) {
  if (!Object.hasOwn(ENGINE_SHAPES, path)) fail('E_COVERAGE_UNDECLARED_SOURCE', path);
  const patterns = leafPatterns(document);
  let publicProjectionLeafCount = 0;
  let excludedLeafCount = 0;
  for (const leafPattern of patterns) {
    const segments = leafPattern.split('/');
    if (segments[1] === 'profiles' && segments[2] === '[]' && Object.hasOwn(ENGINE_PUBLIC_TARGETS, segments[3])) {
      publicProjectionLeafCount += 1;
    } else excludedLeafCount += 1;
  }
  return Object.freeze({ leafPatternCount: count, publicProjectionLeafCount, excludedLeafCount });
}

export function auditCoverageContract({ bundle, tables }) {
  if (bundle.files.length !== REQUIRED_SOURCE_PATHS.length
    || REQUIRED_SOURCE_PATHS.some((path) => !bundle.files.some((file) => file.logical_path === path))) {
    fail('E_COVERAGE_SOURCE_SET', '정책 문서와 스크립트를 포함한 필수 원천 목록');
  }
  const nonJson = bundle.files.filter((file) => !file.logical_path.endsWith('.json') && (!TEXT_SOURCE_PATHS.includes(file.logical_path) || Object.hasOwn(NON_JSON_SOURCE_SCOPE, file.logical_path)));
  if (nonJson.length !== Object.keys(NON_JSON_SOURCE_SCOPE).length
    || nonJson.some((file) => !Object.hasOwn(NON_JSON_SOURCE_SCOPE, file.logical_path))) {
    fail('E_COVERAGE_SOURCE_SET', '비 JSON 원천 분류');
  }
  const jsonFiles = bundle.files.filter((file) => Object.hasOwn(COVERAGE_CONTRACT, file.logical_path));
  const expected = DATA_SOURCE_PATHS.filter((path) => path.endsWith('.json'));
  if (jsonFiles.length !== expected.length || expected.some((path) => !jsonFiles.some((file) => file.logical_path === path))) fail('E_COVERAGE_SOURCE_SET', '포함 JSON 원천 목록');
  if (Object.keys(COVERAGE_CONTRACT).length !== expected.length || expected.some((path) => !COVERAGE_CONTRACT[path])) fail('E_COVERAGE_CONTRACT_SET', '필드 계약 목록');
  const sources = [];
  const missingEvidence = [];
  for (const file of jsonFiles) {
    const report = assertDocumentShape(file.logical_path, file.document);
    const contract = COVERAGE_CONTRACT[file.logical_path];
    const targets = new Set([...contract.mappings.map((mapping) => `${mapping.table}.${mapping.column}`),
      ...fieldCoverageManifest(file.logical_path, file.document).flatMap((row) => row.normalized_targets)]);
    for (const target of targets) {
      const [table, column] = target.split('.');
      const rows = tables[table];
      if (!Array.isArray(rows)) { missingEvidence.push(`${file.logical_path}: ${table} (table missing)`); continue; }
      const sourceRows = rows.filter((row) => !Object.hasOwn(row, 'source_id') || row.source_id === file.source_id);
      // Reviewed leaf contracts include authored NULL outcomes. A real row with
      // the column is evidence; undefined/missing columns are never evidence.
      if (!sourceRows.some((row) => contract.leafTargets ? Object.hasOwn(row, column) && row[column] !== undefined
        : row[column] !== null && row[column] !== undefined)) missingEvidence.push(`${file.logical_path}: ${target}`);
    }
    sources.push(report);
  }
  const engineFiles = bundle.engineFiles ?? [];
  if (engineFiles.length !== ENGINE_PRIVATE_SOURCE_PATHS.length
    || ENGINE_PRIVATE_SOURCE_PATHS.some((path) => !engineFiles.some((file) => file.logical_path === path))) {
    fail('E_COVERAGE_ENGINE_SOURCE_SET', '비공개 프로필 배치 목록');
  }
  let engineLeafPatterns = 0;
  let engineExcludedLeafPatterns = 0;
  for (const file of engineFiles) {
    const summary = auditEngineDocumentShape(file.logical_path, file.document);
    engineLeafPatterns += summary.leafPatternCount;
    engineExcludedLeafPatterns += summary.excludedLeafCount;
    const source = tables.current_engine_source?.find((row) => row.logical_path === file.logical_path);
    if (!source || !Array.isArray(tables.current_profile)
      || !tables.current_profile.some((row) => row.engine_source_id === source.engine_source_id)) {
      missingEvidence.push(`${file.logical_path}: current_profile.person_id`);
    }
  }
  if (missingEvidence.length) fail('E_COVERAGE_ROWS', missingEvidence.join('; '));
  return Object.freeze({ sourceCount: sources.length, leafPatternCount: sources.reduce((total, item) => total + item.leafPatterns, 0),
    nonJsonSourceCount: nonJson.length, scriptSourceCount: SCRIPT_SOURCE_PATHS.length,
    privateSourceCount: engineFiles.length, privateLeafPatternCount: engineLeafPatterns,
    privateExcludedLeafPatternCount: engineExcludedLeafPatterns, sources });
}
