import { createHash } from 'node:crypto';
import { DATA_SOURCE_PATHS, REQUIRED_SOURCE_PATHS, SCRIPT_SOURCE_PATHS } from './sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { TEXT_SOURCE_PATHS } from './text-corpus-manifest.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const pool = (name) => `lore/name-pools/${name}.json`;
const relation = (name) => `lore/relations/${name}.json`;

export const NON_JSON_SOURCE_SCOPE = Object.freeze({
  'WORLD_BUILDING_GUIDE.md': '현행 서울 범위와 비공개 소재의 정책 근거; 인물별 JSON 필드 없음',
  'lore/characters/Cast-Profile-Contract.md': '카드·역사 수치 해석 계약; 인물별 JSON 필드 없음',
  'scripts/gurps-cast.mjs': '역사 GURPS 생성·검사 코드의 고정 해시 근거; 데이터 행 아님',
  'scripts/lore-json-render.mjs': '카드 산문 렌더 코드의 고정 해시 근거; 데이터 행 아님',
});

// Static signatures of the *set of leaf paths*, not content hashes. Array indexes
// become /[]; every new nested field changes the signature and demands review.
const SHAPES = Object.freeze({
  "lore/characters/Cast-Corridors-Index.json": [
    35,
    "38e8aa3e4345e4f9e8459a749a5842de642e18fa70aeb0693b5eb2f045f08408"
  ],
  "lore/characters/Cast-Index-S4.json": [
    29,
    "d7a34a90bfc542c1faa63b835eb92ebd22639e4f02b62629415392c1556bbc1e"
  ],
  "lore/characters/Cast-Index.json": [
    35,
    "38e8aa3e4345e4f9e8459a749a5842de642e18fa70aeb0693b5eb2f045f08408"
  ],
  "lore/characters/Cast-Relations.json": [
    29,
    "d7a34a90bfc542c1faa63b835eb92ebd22639e4f02b62629415392c1556bbc1e"
  ],
  "lore/characters/Cast-State-01.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-02.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-03.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-04.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-05.json": [
    35,
    "6902de07109281fbe6d42dda06c842399ae4eb974f54044619ab246c0bbacadd"
  ],
  "lore/characters/Cast-State-06.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-07.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-08.json": [
    35,
    "6902de07109281fbe6d42dda06c842399ae4eb974f54044619ab246c0bbacadd"
  ],
  "lore/characters/Cast-State-09.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-10.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-11.json": [
    33,
    "80afd1c31535ff1ba4af652927315d8d3bfa2e791f41e80c91e27accdfa7cb95"
  ],
  "lore/characters/Cast-State-12.json": [
    35,
    "6902de07109281fbe6d42dda06c842399ae4eb974f54044619ab246c0bbacadd"
  ],
  "lore/characters/Cast-State-13.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-14.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-15.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-State-16.json": [
    35,
    "4fc98b6901ff0cce3715e72f0042c476a6c6452353aad0f8008aff851caed48d"
  ],
  "lore/characters/Cast-Unaffiliated.json": [
    31,
    "95584d90c68c34da8b9d2cf5773d71663eca3ecc26c32e1632134f163191f9ed"
  ],
  "lore/characters/Core-Characters.json": [
    37,
    "203ac4244212f5ae4135e0459d2d5255aa80a429db8e9a65e918f8afdedba5c4"
  ],
  "lore/chronology/Century-Annals.json": [
    30,
    "9aa47991a9187c8a70565a3c6876698f90238f373f51c29833f4373d0406687e"
  ],
  "lore/chronology/Scenario-Timeline.json": [
    37,
    "7d7ead3400eae315f4dfa20525a6674bdad954d67c0bdfa881179848e8fd2e0d"
  ],
  "lore/factions/Diaspora-Corridors.json": [
    31,
    "a73e8f9b3bc14bddb5cc826677d786346232d870ca59730d6473c99a8954f747"
  ],
  "lore/name-pools/cast-birth-cohorts.json": [
    13,
    "2a11cbffc8eca9de7962de8e9f1320aed45472f88518bb742b40ec4abfb0d229"
  ],
  "lore/name-pools/cast-birthdays.json": [
    7,
    "56ce163ae9f083463f94ac289b1306a6910b514f76a70f3ba35019ecd683e649"
  ],
  "lore/name-pools/cast-family-parent-status.json": [
    7,
    "edbd41723908958a41395557797e4d0614c0ce03ebdc952415f1e332c3833079"
  ],
  "lore/name-pools/cast-family-role-decisions.json": [
    83,
    "4344f6ea477ac8c8c6be7ec5678d6c99f5d6063070bc6e977893abdad6cacfd9"
  ],
  "lore/name-pools/cast-family-trees.json": [
    35,
    "74f3522c61d210eab796bcc96438422a3091b5763282e450f396730fe98af8c9"
  ],
  "lore/name-pools/cast-hangnyeol.json": [
    34,
    "3d1db62d28f9996e920541add55514809d1fce9b5f43eb00f4ce33c32226c2e3"
  ],
  "lore/name-pools/cast-household-relations.json": [
    76,
    "712535b89963eb7088202126b64b1801d92d57195120efbc5fcc8b5b0f46c902"
  ],
  "lore/name-pools/cast-prose-contacts.json": [
    6,
    "127dfe66e629c94b410cc1677b0ffcd9577d67227f388948ae3542187a947578"
  ],
  "lore/name-pools/clan-hangnyeol-tables.json": [
    31,
    "2e66e5da5fc95d7134f26fa3ecf9702e086d253619942a0c3811cc1a90efb3c2"
  ],
  "lore/name-pools/diaspora-family-lineages.json": [
    34,
    "84bcf5c46d3949bdc02ea3c03311238b97932627e03bf40b550aca74b17f335e"
  ],
  "lore/name-pools/gender-cast.json": [
    16,
    "1582161d3a40adf714c8b24ccd19a41b2244600d9ad7c662fd9bbbbcec163cf9"
  ],
  "lore/name-pools/gurps-cast.json": [
    202,
    "1f549a9c977b381f175a3bf2567d4c0231b803a0dde260d3876982e727c7e629"
  ],
  "lore/name-pools/household-humanoid-policy.json": [
    21,
    "e0f4dfcb1fbf433c552b8315c9a93aa041abdf04ffe1f78c5b386d04685cea1d"
  ],
  "lore/name-pools/person-id-registry.json": [
    12,
    "5a93d8c3a59d636a4f94399032afd2e58f29803f9cc3fe2266180119b67c355b"
  ],
  "lore/name-pools/values-cast.json": [
    31,
    "c8087cea6be0b91e111e7c57b6e6f15889f83bf60a66281b889454891d3315f0"
  ],
  "lore/regions/outside-control-2126.json": [
    11,
    "8beb4d16a02215abe94994add12a6f0ff770bddda5cd901a17761bf57babbace"
  ],
  "lore/regions/seoul-electoral-titles.json": [
    92,
    "8bd84fef86aad1b868d665a6a5b71fbf97259a0aee2835dc68b4b671af3839ba"
  ],
  "lore/relations/opening-feudal-allocation.json": [
    30,
    "3087de8476875a3245060f535990bad87da2001f5b32cbf71d10b75e9df7c7a9"
  ],
  "lore/relations/opening-office-appointments.json": [
    10,
    "d4f1a0e0aa439f16dc0b056ed17479a6f2e961dc0b07c1126f10d65c08fe987e"
  ],
  "lore/relations/personal-holdings.json": [
    56,
    "d4f264291c6e851b12c7f9196764e73f062883eb8c8b06cdfc143351e382755c"
  ],
  "lore/relations/relations.json": [
    42,
    "994ef282b9e7b58ebf8f2c5559a31ece6e72cf24a5d3df1126f396ccd863405b"
  ]
});

const person = (table, column, roots, countRoot = roots[0]) => ({ table, column, roots, countRoot });
const COMMON_DOCUMENT_EXCLUSION = Object.freeze({
  version: '문서 형식 버전', domain: '문서 분류', id: '문서 식별자', slug: '문서 경로',
  categories: '문서 분류', status: '편집 상태', tense: '문서 시제', provenance: '문서 출처',
  source: '문서 저작 정보', locales: '문서 언어', data: '인물 원천이 아닌 문서 부가 자료',
});
const ENGINE_SHAPES = Object.freeze({
  "lore/editorial/profile-batches/special.json": [
    72,
    "f09b0a44a3eb0bd698c97bf18cf203a6582f40525809e235e0ee1a266db70ab3"
  ],
  "lore/editorial/profile-batches/state-01-02.json": [
    67,
    "0e44c1f5ea613ba365ac9773ad6e87737d5715a8b8e0abe1af4a7d05ec16b786"
  ],
  "lore/editorial/profile-batches/state-03-04.json": [
    67,
    "5e859bad8989d410c3e89bdee5a548cd638d4db5e1a12fece4b00c5300c48ae2"
  ],
  "lore/editorial/profile-batches/state-05-06.json": [
    66,
    "74f31052bcf032482747caef076e3c61ea3034ce1508c1c361560b1006245791"
  ],
  "lore/editorial/profile-batches/state-07-08.json": [
    71,
    "40716335b13afedc657309b55f61b928189aa59db50d4399a695e00c7e5c0026"
  ],
  "lore/editorial/profile-batches/state-09-10.json": [
    66,
    "b575bea96273fc97e513a7699f271fe55c5459100c206640f57a6ee84c8450fa"
  ],
  "lore/editorial/profile-batches/state-11-12.json": [
    65,
    "94b71ef45c8698a299462848339c925ad794eec73d00427a4a83d2cc21dd7779"
  ],
  "lore/editorial/profile-batches/state-13-14.json": [
    66,
    "155fa7605d5ccd559e4e9c106cc726c15497b22d54bea9838b097b840020d12f"
  ],
  "lore/editorial/profile-batches/state-15-16.json": [
    66,
    "e977f2f40f0406d8438184dfd077bc09472030043f39c26ff533b5d28f03caa5"
  ]
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
  [pool('cast-prose-contacts'), { mappings: [person('context_prose_contact', 'person_id', ['records'])], exclusions: { schemaVersion: '규격' } }],
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

export const COVERAGE_CONTRACT = Object.freeze(Object.fromEntries(
  Object.entries(SHAPES).map(([path, [leafCount, leafSha256]]) => [path, Object.freeze({ leafCount, leafSha256, ...FAMILY_RULES[path] })]),
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
  if (paths.length !== contract.leafCount || hash(paths.join('\n')) !== contract.leafSha256) {
    fail('E_COVERAGE_UNDECLARED_LEAF', path);
  }
  const roots = Object.keys(document);
  const mapped = new Set(contract.mappings.flatMap((entry) => entry.roots));
  const excluded = contract.exclusions;
  for (const root of roots) {
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
    const targets = nestedTargets(path, leafPattern) ?? contract.mappings.filter((mapping) => mapping.roots.includes(root))
      .map((mapping) => `${mapping.table}.${mapping.column}`);
    const exclusion = targets.length ? null : contract.exclusions[root] ?? contract.exclusions['*'];
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
  const [count, digest] = ENGINE_SHAPES[path] ?? [];
  if (count === undefined) fail('E_COVERAGE_UNDECLARED_SOURCE', path);
  const patterns = leafPatterns(document);
  if (patterns.length !== count || hash(patterns.join('\n')) !== digest) fail('E_COVERAGE_UNDECLARED_LEAF', path);
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
      if (!sourceRows.some((row) => row[column] !== null && row[column] !== undefined)) missingEvidence.push(`${file.logical_path}: ${target}`);
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
