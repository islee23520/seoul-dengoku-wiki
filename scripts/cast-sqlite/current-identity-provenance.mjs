const SOURCE_PATHS = Object.freeze({
  registry: 'lore/name-pools/person-id-registry.json',
  gender: 'lore/name-pools/gender-cast.json',
  catalog: 'lore/name-pools/clan-hangnyeol-tables.json',
  lineage: 'lore/name-pools/cast-hangnyeol.json',
});

function fail(code, detail) {
  throw Object.assign(new Error(`${code}: ${detail}`), { code });
}

function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_IDENTITY_PROVENANCE_OBJECT', label);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail('E_IDENTITY_PROVENANCE_ARRAY', label);
  return value;
}

function string(value, label, nullable = false) {
  if (nullable && (value === null || value === undefined)) return null;
  if (typeof value !== 'string' || value.length === 0) fail('E_IDENTITY_PROVENANCE_TEXT', label);
  return value;
}

function integer(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail('E_IDENTITY_PROVENANCE_INTEGER', label);
  return value;
}

function source(bundle, kind) {
  const path = SOURCE_PATHS[kind];
  const matches = array(object(bundle, 'bundle').files, 'bundle.files').filter((file) => file.logical_path === path);
  if (matches.length !== 1) fail('E_IDENTITY_PROVENANCE_SOURCE', path);
  const file = object(matches[0], path);
  return { source_id: integer(file.source_id, `${path}.source_id`), document: object(file.document, path) };
}

export const IDENTITY_PROVENANCE_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  identity_registry_provenance: 'source_id schema_name total_people existing_k_count issued_count approved_by approved_at owner_ref input_sha256 candidates_sha256 approval_scope json_pointer approval_json_pointer',
  identity_gender_provenance: 'source_id schema_name person_count owner_decision assignment_method decision_scope json_pointer',
  identity_gender_category: 'source_id ordinal category json_pointer',
  identity_gender_policy: 'source_id state_id population female_ratio female_count male_count observed_population observed_female_count observed_male_count alignment_status reason json_pointer',
  identity_clan_catalog_provenance: 'source_id catalog_id schema_version note json_pointer',
  identity_clan_research_source: 'research_source_id source_id ordinal record_id source_url accessed_on source_quote evidence_path live_check live_check_ref json_pointer',
  identity_lineage_provenance: 'source_id catalog_id schema_version note assignment_method lineage_notes json_pointer',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));

/** Public, dataset-scoped source facts only. Approval and policy text never become per-person approval. */
export function mapIdentityProvenance(bundle) {
  const registry = source(bundle, 'registry');
  const gender = source(bundle, 'gender');
  const catalog = source(bundle, 'catalog');
  const lineage = source(bundle, 'lineage');
  const approval = object(registry.document.approvalRef, 'registry.approvalRef');
  const counts = ['totalPeople', 'existingKCount', 'issuedCount'].map((key) => integer(registry.document[key], `registry.${key}`));
  if (counts[0] !== array(registry.document.persons, 'registry.persons').length || counts[1] + counts[2] !== counts[0]) {
    fail('E_IDENTITY_PROVENANCE_REGISTRY_COUNT', 'registry count fields disagree');
  }
  for (const key of ['inputSha256', 'candidatesSha256']) {
    if (!/^[0-9a-f]{64}$/u.test(approval[key])) fail('E_IDENTITY_PROVENANCE_HASH', key);
  }
  const categories = array(gender.document.categories, 'gender.categories');
  if (categories.length === 0 || new Set(categories).size !== categories.length) fail('E_IDENTITY_PROVENANCE_CATEGORY', 'categories');
  const policies = array(gender.document.policies, 'gender.policies');
  const stateIds = new Set();
  const currentCounts = new Map();
  for (const person of array(gender.document.people, 'gender.people')) {
    const row = object(person, 'gender person');
    const state = string(row.state, 'gender person state');
    const category = string(row.gender, 'gender person category');
    if (!categories.includes(category)) fail('E_IDENTITY_PROVENANCE_CATEGORY', category);
    const count = currentCounts.get(state) ?? { total: 0, female: 0, male: 0 };
    count.total += 1;
    if (category === '여성') count.female += 1;
    if (category === '남성') count.male += 1;
    currentCounts.set(state, count);
  }
  const policyRows = policies.map((policy, ordinal) => {
    const item = object(policy, `gender.policies[${ordinal}]`);
    const state_id = string(item.state, 'gender policy state');
    if (stateIds.has(state_id)) fail('E_IDENTITY_PROVENANCE_POLICY_DUPLICATE', state_id);
    stateIds.add(state_id);
    const population = integer(item.people, 'policy.people');
    const female_count = integer(item.female_count, 'policy.female_count');
    const male_count = integer(item.male_count, 'policy.male_count');
    if (female_count + male_count !== population || typeof item.female_ratio !== 'number' || !Number.isFinite(item.female_ratio) || item.female_ratio < 0 || item.female_ratio > 1) {
      fail('E_IDENTITY_PROVENANCE_POLICY_COUNT', state_id);
    }
    const observed = currentCounts.get(state_id) ?? { total: 0, female: 0, male: 0 };
    return { source_id: gender.source_id, state_id, population, female_ratio: item.female_ratio, female_count, male_count,
      observed_population: observed.total, observed_female_count: observed.female, observed_male_count: observed.male,
      alignment_status: population === observed.total && female_count === observed.female && male_count === observed.male
        ? 'matches-current' : 'differs-current',
      reason: string(item.reason, 'policy.reason'), json_pointer: `/policies/${ordinal}` };
  });
  if (integer(gender.document.count, 'gender.count') !== gender.document.people.length ||
    stateIds.size !== currentCounts.size || [...currentCounts.keys()].some((state) => !stateIds.has(state))) {
    fail('E_IDENTITY_PROVENANCE_GENDER_COUNT', 'current people or state coverage');
  }
  const researchIds = new Set();
  const researchRows = array(catalog.document.sources, 'catalog.sources').map((entry, ordinal) => {
    const item = object(entry, `catalog.sources[${ordinal}]`);
    const research_source_id = string(item.id, 'research source id');
    if (researchIds.has(research_source_id)) fail('E_IDENTITY_PROVENANCE_RESEARCH_DUPLICATE', research_source_id);
    researchIds.add(research_source_id);
    return { research_source_id, source_id: catalog.source_id, ordinal, record_id: string(item.record_id, 'record_id', true),
      source_url: string(item.url, 'source URL'), accessed_on: string(item.accessed, 'accessed'),
      source_quote: string(item.quote, 'quote'), evidence_path: string(item.evidence, 'evidence'),
      live_check: string(item.live_check, 'live_check'), live_check_ref: string(item.live_check_ref, 'live_check_ref', true),
      json_pointer: `/sources/${ordinal}` };
  });
  for (const clan of array(catalog.document.clans, 'catalog.clans')) {
    for (const ref of array(object(clan, 'clan').sources ?? [], 'clan.sources')) {
      if (!researchIds.has(ref)) fail('E_IDENTITY_PROVENANCE_RESEARCH_ORPHAN', String(ref));
    }
  }
  const result = {
    identity_registry_provenance: [{ source_id: registry.source_id, schema_name: string(registry.document.schema, 'registry.schema'),
      total_people: counts[0], existing_k_count: counts[1], issued_count: counts[2],
      approved_by: string(approval.approvedBy, 'approval.approvedBy'), approved_at: string(approval.approvedAt, 'approval.approvedAt'),
      owner_ref: string(approval.ownerRef, 'approval.ownerRef'), input_sha256: approval.inputSha256, candidates_sha256: approval.candidatesSha256,
      approval_scope: 'registry-source-event-only', json_pointer: '', approval_json_pointer: '/approvalRef' }],
    identity_gender_provenance: [{ source_id: gender.source_id, schema_name: string(gender.document.schema, 'gender.schema'),
      person_count: gender.document.count, owner_decision: string(gender.document.owner_decision, 'gender.owner_decision'),
      assignment_method: string(gender.document.assignment, 'gender.assignment'), decision_scope: 'category-and-assignment-policy-only', json_pointer: '' }],
    identity_gender_category: categories.map((category, ordinal) => ({ source_id: gender.source_id, ordinal,
      category: string(category, 'gender.category'), json_pointer: `/categories/${ordinal}` })),
    identity_gender_policy: policyRows,
    identity_clan_catalog_provenance: [{ source_id: catalog.source_id, catalog_id: string(catalog.document.id, 'catalog.id'),
      schema_version: integer(catalog.document.schema, 'catalog.schema'), note: string(catalog.document.note, 'catalog.note'), json_pointer: '' }],
    identity_clan_research_source: researchRows,
    identity_lineage_provenance: [{ source_id: lineage.source_id, catalog_id: string(lineage.document.id, 'lineage.id'),
      schema_version: integer(lineage.document.schema, 'lineage.schema'), note: string(lineage.document.note, 'lineage.note'),
      assignment_method: string(lineage.document.assignment, 'lineage.assignment'),
      lineage_notes: string(object(lineage.document.lineage, 'lineage.lineage').notes, 'lineage.lineage.notes'), json_pointer: '' }],
  };
  for (const rows of Object.values(result)) { rows.forEach(Object.freeze); Object.freeze(rows); }
  return Object.freeze(result);
}
