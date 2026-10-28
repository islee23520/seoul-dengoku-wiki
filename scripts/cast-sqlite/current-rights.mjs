import { isDeepStrictEqual } from 'node:util'

export const RIGHTS_PATHS = Object.freeze({
  transition: 'scripts/approved-seoul-rights-transition.json',
  nonowning: 'scripts/approved-daejeon-nonowning-rights.json',
  retirement: 'scripts/approved-outside-current-retirement.json',
  existing: 'scripts/historical-inputs/personal-holdings.json',
  allocation: 'scripts/historical-inputs/opening-feudal-allocation.json',
  control: 'scripts/historical-inputs/outside-control-2126.json',
  islands: 'scripts/historical-inputs/outside-island-occupation.json',
  currentExisting: 'lore/relations/personal-holdings.json',
  currentAllocation: 'lore/relations/opening-feudal-allocation.json',
  currentControl: 'lore/regions/outside-control-2126.json',
  currentIslands: 'lore/regions/outside-island-occupation.json',
  registry: 'lore/name-pools/person-id-registry.json',
})
const fail = (code, detail) => { throw Object.assign(new Error(code + ': ' + detail), { code }) }
const equal = (a, b, code, detail) => { if (!isDeepStrictEqual(a, b)) fail(code, detail) }
const key = (set, id) => JSON.stringify([set, id])
const rowId = (set, row) => set === 'existingTitleBindings' ? row.holdingId : row.id
export function rightsSource(bundle, path) {
  const files = bundle.files.filter(file => file.logical_path === path)
  if (files.length !== 1) fail('E_CONTEXT_SOURCE', path)
  return files[0]
}

// Pure admission from the loaded bundle. No filesystem, execution, or receipt prose.
export function authenticateCurrentRights(bundle, identity) {
  const files = Object.fromEntries(Object.entries(RIGHTS_PATHS).map(([role, path]) => [role, rightsSource(bundle, path)]))
  const t = files.transition.document, n = files.nonowning.document, r = files.retirement.document
  for (const manifest of [t, r]) for (const [role, original] of Object.entries(manifest.originalSources)) {
    if (RIGHTS_PATHS[role] !== original.path) fail('E_CONTEXT_RIGHTS_SOURCE', role)
  }
  const ids = new Set(identity.people.map(row => row.person_id))
  const registry = files.registry.document.persons.map(row => row.id)
  if (ids.size !== identity.people.length || registry.length !== ids.size || registry.some(id => !ids.has(id))) fail('E_CONTEXT_RIGHTS_PERSON_CHANGE', 'registry set')
  const checkPeople = value => {
    if (!value || typeof value !== 'object') return
    for (const [field, child] of Object.entries(value)) {
      if ((field.endsWith('PersonId') || field === 'personId') && child !== null && !ids.has(child)) fail('E_CONTEXT_PERSON_ORPHAN', String(child))
      checkPeople(child)
    }
  }
  checkPeople(files.currentExisting.document); checkPeople(files.currentAllocation.document)
  const sets = ['titles', 'grants', 'holdings', 'existingTitleBindings']
  const originals = set => set === 'holdings' ? files.existing.document.holdings : files.allocation.document[set]
  const mappings = new Map(t.records.map(row => [key(row.set, row.oldId), row]))
  const total = sets.reduce((sum, set) => sum + originals(set).length, 0)
  if (total !== t.records.length || mappings.size !== total) fail('E_CONTEXT_RIGHTS_COVERAGE', 'transition')
  const expectedExisting = structuredClone(files.existing.document), expectedAllocation = structuredClone(files.allocation.document)
  const originalRows = new Map(), successors = new Map(), retired = []
  for (const set of sets) {
    const rows = []
    for (const [ordinal, original] of originals(set).entries()) {
      const oldId = rowId(set, original), mapping = mappings.get(key(set, oldId))
      if (!mapping) fail('E_CONTEXT_RIGHTS_COVERAGE', key(set, oldId))
      originalRows.set(key(set, oldId), { file: set === 'holdings' ? files.existing : files.allocation, pointer: '/' + set + '/' + ordinal })
      let row
      switch (mapping.disposition) {
        case 'retained-current':
          if (Object.hasOwn(mapping, 'current')) fail('E_CONTEXT_RIGHTS_SUCCESSOR', oldId)
          row = original
          break
        case 'retired-current':
          if (!['titles', 'grants'].includes(set) || mapping.currentId !== null || Object.hasOwn(mapping, 'current')) fail('E_CONTEXT_RIGHTS_COVERAGE', oldId)
          if (set === 'titles') retired.push(original)
          continue
        case 'seoul-jurisdiction-only':
          if (set !== 'titles') fail('E_CONTEXT_RIGHTS_COVERAGE', oldId)
          row = { ...original, jurisdictionRefs: original.jurisdictionRefs.filter(ref => /^region:11\d{8}$/.test(ref)) }
          if (!row.jurisdictionRefs.length || row.jurisdictionRefs.length === original.jurisdictionRefs.length) fail('E_CONTEXT_RIGHTS_SUCCESSOR', oldId)
          equal(mapping.current, row, 'E_CONTEXT_RIGHTS_SUCCESSOR', oldId)
          break
        case 'approved-nonowning':
          if (set === 'grants' || !mapping.current) fail('E_CONTEXT_NONOWNING_CONTRACT', oldId)
          row = mapping.current
          for (const field of ['holderPersonId', 'stateId', 'directLiegePersonId']) if (Object.hasOwn(original, field) && row[field] !== original[field]) fail('E_CONTEXT_NONOWNING_CONTRACT', oldId)
          break
        default: fail('E_CONTEXT_RIGHTS_COVERAGE', oldId)
      }
      if (mapping.currentId !== rowId(set, row) || successors.has(key(set, mapping.currentId))) fail('E_CONTEXT_RIGHTS_SUCCESSOR', oldId)
      successors.set(key(set, mapping.currentId), mapping)
      rows.push(row)
    }
    if (set === 'holdings') expectedExisting.holdings = rows
    else expectedAllocation[set] = rows
  }
  expectedExisting.polities = t.polities
  expectedAllocation.politicalIdentities = retired.map(title => ({
    id: title.id, kind: 'nonterritorial-political-identity', rank: title.rank, holderPersonId: title.holderPersonId,
    stateId: title.stateId, politicalParentTitleId: title.parentTitleId ?? null,
    personalLieges: files.allocation.document.grants.filter(grant => grant.titleId === title.id)
      .map(grant => ({ holdingId: grant.id, directLiegePersonId: grant.directLiegePersonId })), directOwnership: false,
  }))
  const active = files.currentExisting.document, allocation = files.currentAllocation.document
  // Verify powers and identity separately so geography can never act as admission.
  for (const right of n.contract.rights) {
    const holding = active.holdings.find(row => row.id === right.holdingId)
    const title = allocation.titles.find(row => row.id === right.titleId)
    if (!holding || !title) fail('E_CONTEXT_NONOWNING_CONTRACT', right.holdingId)
    for (const row of [holding, title]) {
      if (row.directOwnership !== false || row.kind !== 'superior-jurisdiction' || Object.hasOwn(row, 'status') || Object.hasOwn(row, 'activationDecisionIds')) fail('E_CONTEXT_NONOWNING_CONTRACT', right.holdingId)
      if (row.holderPersonId !== right.holderPersonId || row.stateId !== right.stateId) fail('E_CONTEXT_NONOWNING_CONTRACT', right.holdingId)
    }
    equal(holding.geographicScope, right.geographicScope, 'E_CONTEXT_NONOWNING_CONTRACT', right.holdingId)
    equal(holding.powers, n.powers, 'E_CONTEXT_NONOWNING_CONTRACT', right.holdingId)
    if (holding.titleId !== right.titleId || holding.capabilityPackageId !== n.contract.capabilityPackageId
      || holding.directLiegePersonId !== right.personalLiegePersonId || title.personalLiegePersonId !== right.personalLiegePersonId
      || title.politicalParentTitleId !== right.politicalParentTitleId) fail('E_CONTEXT_NONOWNING_CONTRACT', right.holdingId)
  }
  equal(active, expectedExisting, 'E_CONTEXT_RIGHTS_SUCCESSOR', 'holdings envelope')
  equal(allocation, expectedAllocation, 'E_CONTEXT_RIGHTS_SUCCESSOR', 'allocation envelope')
  const retirementOriginals = new Map([
    ...files.control.document.assignments.map((row, i) => [key('assignments', row.unitId), { row, file: files.control, pointer: '/assignments/' + i }]),
    ...files.islands.document.units.map((row, i) => [key('islandUnits', row.unitId), { row, file: files.islands, pointer: '/units/' + i }]),
  ])
  const seen = new Set()
  if (r.records.length !== retirementOriginals.size) fail('E_CONTEXT_OUTSIDE_RETIREMENT', 'coverage')
  for (const record of r.records) {
    const original = retirementOriginals.get(record.recordKey)
    let tuple
    try { tuple = JSON.parse(record.recordKey) } catch { fail('E_CONTEXT_OUTSIDE_RETIREMENT', 'tuple') }
    if (!Array.isArray(tuple) || tuple.length !== 2 || !['assignments', 'islandUnits'].includes(tuple[0])
      || key(...tuple) !== record.recordKey || seen.has(record.recordKey) || !original
      || record.status !== 'retired-current') fail('E_CONTEXT_OUTSIDE_RETIREMENT', record.recordKey)
    seen.add(record.recordKey)
  }
  const control = { ...files.control.document, assignments: [] }; delete control.basis
  const islands = { ...files.islands.document, units: [] }; delete islands.openingDecision
  equal(files.currentControl.document, control, 'E_CONTEXT_OUTSIDE_RETIREMENT', 'current control')
  equal(files.currentIslands.document, islands, 'E_CONTEXT_OUTSIDE_RETIREMENT', 'current islands')
  return { files, mappings, successors, originalRows, retirementOriginals }
}

export const RIGHTS_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  "context_rights_approval": "approval_id source_schema approval_ref receipt_sha256 message_ref proposal_sha256 package_sha256 source_id json_pointer",
  "context_rights_original_source": "approval_id role logical_path expected_sha256 original_source_id source_id json_pointer",
  "context_rights_transition": "set_name old_id original_value_sha256 disposition current_id approval_id source_ordinal original_source_id original_json_pointer source_id json_pointer",
  "context_outside_retirement": "set_name unit_id record_key original_value_sha256 status approval_ref approval_id original_source_id original_json_pointer source_id json_pointer",
  "context_feudal_title": "title_id name rank holder_person_id polity_id parent_title_id geographic_title_id geographic_parent_title_id political_parent_title_id personal_liege_person_id kind direct_ownership basis transition_set transition_old_id source_id json_pointer",
  "context_feudal_jurisdiction": "title_id ordinal admin_unit_id source_id json_pointer",
  "context_feudal_grant": "grant_id name_ko name_en holder_person_id liege_person_id polity_id title_id geometry_source territorial_scale formal_title_rank transition_set transition_old_id source_id json_pointer",
  "context_feudal_grant_admin": "grant_id ordinal admin_unit_id admin_unit_name source_id json_pointer",
  "context_feudal_grant_component": "grant_id ordinal admin_unit_id component_index source_id json_pointer",
  "context_political_identity": "identity_id kind rank holder_person_id polity_id political_parent_title_id direct_ownership transition_set transition_old_id source_id json_pointer",
  "context_political_identity_liege": "identity_id ordinal historical_holding_id liege_person_id source_id json_pointer"
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])))

export function mapCurrentRights(rights, tables) {
  const { files, originalRows, successors, retirementOriginals } = rights
  const emit = (table, file, json_pointer, row) => tables[table].push({ ...row, source_id: file.source_id, json_pointer })
  for (const role of ['transition', 'nonowning', 'retirement']) {
    const file = files[role], d = file.document
    emit('context_rights_approval', file, '', { approval_id: file.logical_path, source_schema: d.schema,
      approval_ref: d.approvalRef ?? d.contract.approvalRef, receipt_sha256: d.approvalReceiptSha256 ?? d.approvalReceipt?.sha256 ?? d.approval.receiptSha256,
      message_ref: d.approval?.messageRef ?? null, proposal_sha256: d.approval?.proposalSha256 ?? null, package_sha256: d.nonowningPackageSha256 ?? null })
    for (const [name, original] of Object.entries(d.originalSources ?? {})) emit('context_rights_original_source', file, '/originalSources/' + name,
      { approval_id: file.logical_path, role: name, logical_path: original.path, expected_sha256: original.sha256, original_source_id: files[name].source_id })
  }
  files.transition.document.records.forEach((row, ordinal) => {
    const original = originalRows.get(key(row.set, row.oldId))
    emit('context_rights_transition', files.transition, '/records/' + ordinal, { set_name: row.set, old_id: row.oldId,
      original_value_sha256: row.sourceValueSha256, disposition: row.disposition, current_id: row.currentId, approval_id: files.transition.logical_path,
      source_ordinal: ordinal, original_source_id: original.file.source_id, original_json_pointer: original.pointer })
  })
  files.retirement.document.records.forEach((row, ordinal) => {
    const [set_name, unit_id] = JSON.parse(row.recordKey), original = retirementOriginals.get(row.recordKey)
    emit('context_outside_retirement', files.retirement, '/records/' + ordinal, { set_name, unit_id, record_key: row.recordKey,
      original_value_sha256: row.sourceValueSha256, status: row.status, approval_ref: row.approvalRef, approval_id: files.retirement.logical_path,
      original_source_id: original.file.source_id, original_json_pointer: original.pointer })
  })
  const file = files.currentAllocation, d = file.document
  const transition = (set, id) => ({ transition_set: set, transition_old_id: successors.get(key(set, id)).oldId })
  const bool = value => value === undefined ? null : Number(value)
  d.titles.forEach((row, ordinal) => {
    emit('context_feudal_title', file, '/titles/' + ordinal, { title_id: row.id, name: row.name, rank: row.rank,
      holder_person_id: row.holderPersonId, polity_id: row.stateId, parent_title_id: row.parentTitleId ?? null,
      geographic_title_id: row.geographicTitleId ?? null, geographic_parent_title_id: row.geographicParentTitleId ?? null,
      political_parent_title_id: row.politicalParentTitleId ?? null, personal_liege_person_id: row.personalLiegePersonId ?? null,
      kind: row.kind ?? null, direct_ownership: bool(row.directOwnership), basis: row.basis, ...transition('titles', row.id) })
    ;(row.jurisdictionRefs ?? []).forEach((admin_unit_id, index) => emit('context_feudal_jurisdiction', file,
      '/titles/' + ordinal + '/jurisdictionRefs/' + index, { title_id: row.id, ordinal: index, admin_unit_id }))
  })
  const parentIds = new Set([...d.titles, ...d.politicalIdentities].map(row => row.id))
  for (const row of [...d.titles, ...d.politicalIdentities]) for (const field of ['parentTitleId', 'politicalParentTitleId']) {
    if (row[field] && !parentIds.has(row[field])) fail('E_CONTEXT_RIGHTS_SUCCESSOR', row.id + ':' + field)
  }
  d.grants.forEach((row, ordinal) => {
    emit('context_feudal_grant', file, '/grants/' + ordinal, { grant_id: row.id, name_ko: row.name.ko, name_en: row.name.en ?? null,
      holder_person_id: row.holderPersonId, liege_person_id: row.directLiegePersonId ?? null, polity_id: row.stateId, title_id: row.titleId,
      geometry_source: row.geometrySource ?? null, territorial_scale: row.territorialScale ?? null, formal_title_rank: row.formalTitleRank ?? null,
      ...transition('grants', row.id) })
    row.adminRefs.forEach((ref, index) => emit('context_feudal_grant_admin', file, '/grants/' + ordinal + '/adminRefs/' + index,
      { grant_id: row.id, ordinal: index, admin_unit_id: ref.id, admin_unit_name: ref.name }))
    row.componentRefs.forEach((ref, index) => emit('context_feudal_grant_component', file, '/grants/' + ordinal + '/componentRefs/' + index,
      { grant_id: row.id, ordinal: index, admin_unit_id: ref.unitId, component_index: ref.componentIndex }))
  })
  d.existingTitleBindings.forEach((row, ordinal) => emit('context_feudal_binding', file, '/existingTitleBindings/' + ordinal,
    { holding_id: row.holdingId, title_id: row.titleId, liege_relationship_kind: row.liegeRelationshipKind ?? null,
      basis: row.basis ?? null, ...transition('existingTitleBindings', row.holdingId) }))
  d.politicalIdentities.forEach((row, ordinal) => {
    emit('context_political_identity', file, '/politicalIdentities/' + ordinal, { identity_id: row.id, kind: row.kind, rank: row.rank,
      holder_person_id: row.holderPersonId, polity_id: row.stateId, political_parent_title_id: row.politicalParentTitleId,
      direct_ownership: Number(row.directOwnership), transition_set: 'titles', transition_old_id: row.id })
    row.personalLieges.forEach((ref, index) => emit('context_political_identity_liege', file, '/politicalIdentities/' + ordinal + '/personalLieges/' + index,
      { identity_id: row.id, ordinal: index, historical_holding_id: ref.holdingId, liege_person_id: ref.directLiegePersonId ?? null }))
  })
}
