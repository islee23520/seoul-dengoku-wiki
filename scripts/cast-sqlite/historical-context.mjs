const PATHS = Object.freeze({
  allocation: 'scripts/historical-inputs/opening-feudal-allocation.json',
  outside: 'scripts/historical-inputs/outside-control-2126.json',
  electoral: 'lore/regions/seoul-electoral-titles.json',
})

export const HISTORICAL_CONTEXT_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  historical_source_scope: 'source_id logical_path source_schema classification record_count person_link_count json_pointer',
  historical_feudal_title: 'title_id name rank holder_person_id polity_id parent_title_id current_validity source_id json_pointer',
  historical_feudal_jurisdiction: 'title_id ordinal admin_unit_id source_id json_pointer',
  historical_feudal_grant: 'grant_id name_ko name_en holder_person_id liege_person_id polity_id title_id geometry_source territorial_scale formal_title_rank current_validity source_id json_pointer',
  historical_feudal_grant_admin: 'grant_id ordinal admin_unit_id admin_unit_name source_id json_pointer',
  historical_feudal_grant_component: 'grant_id ordinal admin_unit_id component_index source_id json_pointer',
  historical_feudal_binding: 'holding_id title_id liege_relationship_kind source_id json_pointer',
  historical_outside_person_control: 'admin_unit_id holder_person_id liege_person_id authority_kind authority_state_id authority_name current_validity source_id json_pointer',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])))

function fail(code, detail) { throw Object.assign(new Error(`${code}: ${detail}`), { code }) }
function object(value, label) { if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_HISTORICAL_OBJECT', label); return value }
function array(value, label) { if (!Array.isArray(value)) fail('E_HISTORICAL_ARRAY', label); return value }
function text(value, label, nullable = false) { if (nullable && (value === undefined || value === null)) return null; if (typeof value !== 'string' || !value) fail('E_HISTORICAL_TEXT', label); return value }
function integer(value, label) { if (!Number.isSafeInteger(value)) fail('E_HISTORICAL_INTEGER', label); return value }
function pointer(...parts) { return `/${parts.map(String).map(part => part.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}` }
function unique(set, id, code) { if (set.has(id)) fail(code, id); set.add(id) }

function source(bundle, path) {
  const found = array(object(bundle, 'bundle').files, 'bundle.files').filter((file) => object(file, 'bundle.file').logical_path === path)
  if (found.length !== 1) fail('E_HISTORICAL_SOURCE', path)
  const file = found[0]
  return { source_id: integer(file.source_id, `${path}.source_id`), document: object(file.document, path) }
}

function personSet(identity) {
  const ids = new Set()
  for (const row of array(object(identity, 'identity').people, 'identity.people')) unique(ids, text(object(row, 'identity.person').person_id, 'person_id'), 'E_HISTORICAL_DUPLICATE_PERSON')
  if (ids.size === 0) fail('E_HISTORICAL_EMPTY_REGISTRY', 'identity.people')
  return ids
}

function person(ids, value, label, nullable = false) {
  const id = text(value, label, nullable)
  if (id !== null && !ids.has(id)) fail('E_HISTORICAL_PERSON_ORPHAN', `${label}:${id}`)
  return id
}

function allocation(bundle, ids, tables) {
  const { source_id, document } = source(bundle, PATHS.allocation)
  const schema = text(document.schema, 'allocation.schema')
  integer(document.openingYear, 'allocation.openingYear')
  const titles = array(document.titles, 'allocation.titles')
  const grants = array(document.grants, 'allocation.grants')
  const bindings = array(document.existingTitleBindings, 'allocation.existingTitleBindings')
  const titleIds = new Set()
  for (const [ordinal, value] of titles.entries()) {
    const row = object(value, `allocation.titles[${ordinal}]`)
    const title_id = text(row.id, 'title.id')
    unique(titleIds, title_id, 'E_HISTORICAL_DUPLICATE_TITLE')
    tables.historical_feudal_title.push({ title_id, name: text(row.name, 'title.name'), rank: text(row.rank, 'title.rank'),
      holder_person_id: person(ids, row.holderPersonId, 'title.holderPersonId'), polity_id: text(row.stateId, 'title.stateId'),
      parent_title_id: text(row.parentTitleId, 'title.parentTitleId', true), current_validity: 'superseded_pre_seoul_rebase',
      source_id, json_pointer: pointer('titles', ordinal) })
    for (const [refOrdinal, ref] of array(row.jurisdictionRefs, 'title.jurisdictionRefs').entries()) {
      tables.historical_feudal_jurisdiction.push({ title_id, ordinal: refOrdinal, admin_unit_id: text(ref, 'title.jurisdictionRef'),
        source_id, json_pointer: pointer('titles', ordinal, 'jurisdictionRefs', refOrdinal) })
    }
  }
  for (const row of tables.historical_feudal_title) {
    if (row.parent_title_id !== null && !titleIds.has(row.parent_title_id)) fail('E_HISTORICAL_PARENT_TITLE_ORPHAN', row.parent_title_id)
  }
  const grantIds = new Set()
  for (const [ordinal, value] of grants.entries()) {
    const row = object(value, `allocation.grants[${ordinal}]`)
    const grant_id = text(row.id, 'grant.id')
    unique(grantIds, grant_id, 'E_HISTORICAL_DUPLICATE_GRANT')
    const title_id = text(row.titleId, 'grant.titleId')
    if (!titleIds.has(title_id)) fail('E_HISTORICAL_GRANT_TITLE_ORPHAN', title_id)
    const name = object(row.name, 'grant.name')
    tables.historical_feudal_grant.push({ grant_id, name_ko: text(name.ko, 'grant.name.ko'), name_en: text(name.en, 'grant.name.en', true),
      holder_person_id: person(ids, row.holderPersonId, 'grant.holderPersonId'), liege_person_id: person(ids, row.directLiegePersonId, 'grant.directLiegePersonId', true),
      polity_id: text(row.stateId, 'grant.stateId'), title_id, geometry_source: text(row.geometrySource, 'grant.geometrySource', true),
      territorial_scale: text(row.territorialScale, 'grant.territorialScale', true), formal_title_rank: text(row.formalTitleRank, 'grant.formalTitleRank', true),
      current_validity: 'superseded_pre_seoul_rebase', source_id, json_pointer: pointer('grants', ordinal) })
    for (const [refOrdinal, value] of array(row.adminRefs, 'grant.adminRefs').entries()) {
      const ref = object(value, 'grant.adminRef')
      tables.historical_feudal_grant_admin.push({ grant_id, ordinal: refOrdinal, admin_unit_id: text(ref.id, 'grant.adminRef.id'),
        admin_unit_name: text(ref.name, 'grant.adminRef.name'), source_id, json_pointer: pointer('grants', ordinal, 'adminRefs', refOrdinal) })
    }
    for (const [refOrdinal, value] of array(row.componentRefs, 'grant.componentRefs').entries()) {
      const ref = object(value, 'grant.componentRef')
      tables.historical_feudal_grant_component.push({ grant_id, ordinal: refOrdinal, admin_unit_id: text(ref.unitId, 'grant.componentRef.unitId'),
        component_index: integer(ref.componentIndex, 'grant.componentRef.componentIndex'), source_id, json_pointer: pointer('grants', ordinal, 'componentRefs', refOrdinal) })
    }
  }
  const boundHoldings = new Set()
  for (const [ordinal, value] of bindings.entries()) {
    const row = object(value, 'allocation.existingTitleBinding')
    const holding_id = text(row.holdingId, 'binding.holdingId'), title_id = text(row.titleId, 'binding.titleId')
    unique(boundHoldings, holding_id, 'E_HISTORICAL_DUPLICATE_BINDING')
    if (!titleIds.has(title_id)) fail('E_HISTORICAL_BINDING_TITLE_ORPHAN', title_id)
    tables.historical_feudal_binding.push({ holding_id, title_id, liege_relationship_kind: text(row.liegeRelationshipKind, 'binding.liegeRelationshipKind', true),
      source_id, json_pointer: pointer('existingTitleBindings', ordinal) })
  }
  tables.historical_source_scope.push({ source_id, logical_path: PATHS.allocation, source_schema: schema,
    classification: 'superseded_pre_seoul_rebase', record_count: titles.length + grants.length + bindings.length,
    person_link_count: titles.length + grants.length, json_pointer: '' })
}

function outside(bundle, ids, tables) {
  const { source_id, document } = source(bundle, PATHS.outside)
  const schema = text(document.schema, 'outside.schema')
  const assignments = array(document.assignments, 'outside.assignments')
  const seen = new Set()
  for (const [ordinal, value] of assignments.entries()) {
    const row = object(value, `outside.assignments[${ordinal}]`)
    if (row.holderPersonId === null || row.holderPersonId === undefined) {
      if (row.directLiegePersonId !== null && row.directLiegePersonId !== undefined) fail('E_HISTORICAL_OUTSIDE_LIEGE_ONLY', String(ordinal))
      continue
    }
    const admin_unit_id = text(row.unitId, 'outside.unitId')
    unique(seen, admin_unit_id, 'E_HISTORICAL_DUPLICATE_OUTSIDE_UNIT')
    const authority = row.authority === null ? null : object(row.authority, 'outside.authority')
    tables.historical_outside_person_control.push({ admin_unit_id,
      holder_person_id: person(ids, row.holderPersonId, 'outside.holderPersonId'),
      liege_person_id: person(ids, row.directLiegePersonId, 'outside.directLiegePersonId', true),
      authority_kind: authority === null ? null : text(authority.kind, 'outside.authority.kind'),
      authority_state_id: authority === null ? null : text(authority.stateId, 'outside.authority.stateId', true),
      authority_name: authority === null ? null : text(authority.name, 'outside.authority.name', true),
      current_validity: 'superseded_outside_seoul', source_id, json_pointer: pointer('assignments', ordinal) })
  }
  tables.historical_source_scope.push({ source_id, logical_path: PATHS.outside, source_schema: schema,
    classification: 'superseded_outside_seoul', record_count: assignments.length, person_link_count: seen.size, json_pointer: '' })
}

function electoral(bundle, tables) {
  const { source_id, document } = source(bundle, PATHS.electoral)
  const schema = text(document.schema, 'electoral.schema')
  if (document.status !== 'inspection-only') fail('E_HISTORICAL_STAGING_STATUS', String(document.status))
  const titles = array(document.titles, 'electoral.titles')
  if (titles.some((row) => object(row, 'electoral.title').holderPersonId !== undefined && row.holderPersonId !== null)) fail('E_HISTORICAL_STAGING_PERSON', 'electoral titles must remain unowned staging geography')
  tables.historical_source_scope.push({ source_id, logical_path: PATHS.electoral, source_schema: schema,
    classification: 'inspection_only_no_person_right', record_count: titles.length, person_link_count: 0, json_pointer: '' })
}

export function mapHistoricalContext({ bundle, identity }) {
  const tables = Object.fromEntries(Object.keys(HISTORICAL_CONTEXT_TABLE_COLUMNS).map((table) => [table, []]))
  const ids = personSet(identity)
  allocation(bundle, ids, tables)
  outside(bundle, ids, tables)
  electoral(bundle, tables)
  for (const rows of Object.values(tables)) { rows.forEach(Object.freeze); Object.freeze(rows) }
  return Object.freeze(tables)
}
