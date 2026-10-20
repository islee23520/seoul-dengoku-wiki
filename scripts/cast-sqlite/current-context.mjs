import { authenticateCurrentRights, mapCurrentRights, RIGHTS_TABLE_COLUMNS } from './current-rights.mjs'

const PATHS = Object.freeze({
  relations: 'lore/relations/relations.json',
  holdings: 'lore/relations/personal-holdings.json',
  offices: 'lore/relations/opening-office-appointments.json',
  contacts: 'lore/name-pools/cast-prose-contacts.json',
})
const CATALOG_STATUS = 'current-catalog-input'

export const CONTEXT_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  ...Object.fromEntries(Object.entries(RIGHTS_TABLE_COLUMNS).map(([table, columns]) => [table, columns.join(' ')])),
  context_court: 'court_id owner_person_id polity_id source_schema effective_year approval_ref catalog_status source_id json_pointer',
  context_relation_contract: 'contract_id court_id_contract source_ref_path source_ref_anchor source_schema effective_year approval_ref source_id json_pointer',
  context_direct_retainer: 'person_id liege_person_id court_id source_row source_schema effective_year approval_ref catalog_status source_id json_pointer',
  context_owner_liege: 'person_id liege_person_id relation_kind owner_term source_schema effective_year approval_ref catalog_status source_id json_pointer',
  context_owner_liege_source_basis: 'ordinal source_ref_path source_ref_anchor source_quote source_id json_pointer',
  context_court_membership: 'person_id court_id approval_ref source_schema effective_year catalog_status source_id json_pointer',
  context_court_approval: 'court_id approval_ref source_id json_pointer',
  context_organization: 'organization_id name polity_id source_anchor catalog_status source_id json_pointer',
  context_event_link: 'event_id person_id organization_id catalog_status source_id json_pointer',
  context_holding: 'holding_id name_ko name_en holder_person_id direct_liege_person_id polity_id territorial_scale formal_title_rank geometry_source designation_ko designation_en parent_geography whole_seoul_control current_validity canon_status authority_date authority_ref source_schema opening_year kind direct_ownership title_id liege_relationship_kind capability_package_id transition_set transition_old_id source_id json_pointer',
  context_holding_geographic_scope: 'holding_id duchy_title_id gu_ref kingdom_geography_id empire_geography_id source_id json_pointer',
  context_holding_scope_county: 'holding_id ordinal county_title_id source_id json_pointer',
  context_holding_power: 'holding_id ordinal power source_id json_pointer',
  context_feudal_binding: 'holding_id title_id liege_relationship_kind basis transition_set transition_old_id source_id json_pointer',
  context_holding_admin_ref: 'holding_id ordinal admin_id admin_name source_id json_pointer',
  context_holding_reference: 'holding_id reference_kind ordinal reference_id reference_name reference_source_path site_source_path reference_anchor station_id station_name station_district station_lat station_lon source_id json_pointer',
  context_polity: 'polity_id name_ko name_en sovereign_person_id territorial_scale formal_title formal_title_rank office authority_kind authority_name current_validity source_schema opening_year direct_ownership political_title_id approval_id source_id json_pointer',
  context_retinue_group: 'retinue_group_id name_ko name_en court_id liege_person_id person_count personhood_review formal_title current_validity source_schema opening_year source_id json_pointer',
  context_retinue_duty: 'retinue_group_id ordinal duty source_id json_pointer',
  context_retinue_technical_limit: 'retinue_group_id ordinal technical_limit source_id json_pointer',
  context_retinue_holding: 'retinue_group_id holding_id ordinal source_id json_pointer',
  context_opening_disposition: 'person_id status approval_ref canon_status authority_date authority_ref source_schema opening_year source_id json_pointer',
  context_office_appointment: 'person_id polity_id position_ko position_en rank_ko rank_en common_tier status source_schema opening_year catalog_status source_id json_pointer',
  context_office_history: 'person_id polity_id position_ko position_en rank_ko rank_en common_tier approval_ref source_id json_pointer',
  context_office_evidence: 'person_id ordinal reference_path reference_pointer evidence_kind reference_source_id reference_json_pointer source_id json_pointer',
  context_prose_contact: 'person_id recipient_person_id contact_kind source_ref_path source_ref_anchor catalog_status source_id json_pointer',
  context_issue: 'issue_id context_domain code severity holding_id person_id source_id json_pointer message',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])))

function fail(code, message) { throw Object.assign(new Error(`${code}: ${message}`), { code }) }
function object(value, label) { if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_CONTEXT_OBJECT', label); return value }
function array(value, label) { if (!Array.isArray(value)) fail('E_CONTEXT_ARRAY', label); return value }
function text(value, label, nullable = false) { if (nullable && (value === null || value === undefined)) return null; if (typeof value !== 'string') fail('E_CONTEXT_TEXT', label); return value }
function integer(value, label) { if (!Number.isSafeInteger(value)) fail('E_CONTEXT_INTEGER', label); return value }
function coordinate(value, label, minimum, maximum) { if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) fail('E_CONTEXT_COORDINATE', label); return value }
function pointer(...parts) { return `/${parts.map(String).map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}` }

function source(bundle, key) {
  const logical_path = PATHS[key]
  const found = array(object(bundle, 'bundle').files, 'bundle.files').filter((file) => object(file, logical_path).logical_path === logical_path)
  if (found.length !== 1) fail('E_CONTEXT_SOURCE', logical_path)
  const file = object(found[0], logical_path)
  return { source_id: integer(file.source_id, `${logical_path}.source_id`), document: object(file.document, `${logical_path}.document`) }
}

function people(identity) {
  const ids = new Set()
  for (const row of array(object(identity, 'identity').people, 'identity.people')) {
    const person_id = text(object(row, 'identity.people row').person_id, 'identity.person_id')
    if (ids.has(person_id)) fail('E_CONTEXT_IDENTITY_DUPLICATE', person_id)
    ids.add(person_id)
  }
  if (ids.size === 0) fail('E_CONTEXT_IDENTITY_EMPTY', 'identity.people')
  return ids
}
function person(ids, value, label, nullable = false) {
  const person_id = text(value, label, nullable)
  if (person_id !== null && !ids.has(person_id)) fail('E_CONTEXT_PERSON_ORPHAN', person_id)
  return person_id
}
function freezeRows(tables) { for (const rows of Object.values(tables)) { rows.forEach(Object.freeze); Object.freeze(rows) } return Object.freeze(tables) }
function unique(seen, value, code) { if (seen.has(value)) fail(code, value); seen.add(value) }
function localized(value, label) { const row = object(value, label); return { ko: text(row.ko, `${label}.ko`), en: text(row.en, `${label}.en`, true) } }

function relations(bundle, ids, tables) {
  const { source_id, document } = source(bundle, 'relations')
  const courtContract = object(document.courtContract, 'relations.courtContract')
  const courtSchema = text(courtContract.schema, 'relations.courtContract.schema')
  const courtYear = integer(courtContract.effectiveYear, 'relations.courtContract.effectiveYear')
  const courtApproval = text(courtContract.approvalRef, 'relations.courtContract.approvalRef')
  tables.context_relation_contract.push({ contract_id: 'court', court_id_contract: text(courtContract.courtIdContract, 'relations.courtContract.courtIdContract'), source_ref_path: text(courtContract.sourcePath, 'relations.courtContract.sourcePath'), source_ref_anchor: text(courtContract.sourceAnchor, 'relations.courtContract.sourceAnchor'), source_schema: courtSchema, effective_year: courtYear, approval_ref: courtApproval, source_id, json_pointer: '/courtContract' })
  const courts = new Set()
  for (const [ordinal, value] of array(document.courts, 'relations.courts').entries()) {
    const row = object(value, 'relations.court'), court_id = text(row.id, 'relations.court.id')
    unique(courts, court_id, 'E_CONTEXT_DUPLICATE_COURT')
    tables.context_court.push({ court_id, owner_person_id: person(ids, row.ownerPersonId, 'relations.court.ownerPersonId'), polity_id: text(row.stateId, 'relations.court.stateId'), source_schema: courtSchema, effective_year: courtYear, approval_ref: courtApproval, catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('courts', ordinal) })
  }
  const retainerIds = new Set()
  for (const [ordinal, value] of array(document.directRetainers, 'relations.directRetainers').entries()) {
    const row = object(value, 'relations.directRetainer'), person_id = person(ids, row.personId, 'relations.directRetainer.personId')
    unique(retainerIds, person_id, 'E_CONTEXT_DUPLICATE_DIRECT_RETAINER')
    const liege_person_id = person(ids, row.liegePersonId, 'relations.directRetainer.liegePersonId')
    if (person_id === liege_person_id) fail('E_CONTEXT_SELF_RELATION', person_id)
    const court_id = text(row.courtId, 'relations.directRetainer.courtId')
    if (!courts.has(court_id)) fail('E_CONTEXT_COURT_ORPHAN', court_id)
    tables.context_direct_retainer.push({ person_id, liege_person_id, court_id, source_row: integer(row.sourceRow, 'relations.directRetainer.sourceRow'), source_schema: courtSchema, effective_year: courtYear, approval_ref: courtApproval, catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('directRetainers', ordinal) })
  }
  const ownerLieges = object(document.ownerLieges, 'relations.ownerLieges'), ownerSchema = text(ownerLieges.schema, 'relations.ownerLieges.schema'), ownerYear = integer(ownerLieges.effectiveYear, 'relations.ownerLieges.effectiveYear'), ownerApproval = text(ownerLieges.approvalRef, 'relations.ownerLieges.approvalRef'), ownerIds = new Set()
  for (const [ordinal, value] of array(ownerLieges.sourceBasis, 'relations.ownerLieges.sourceBasis').entries()) { const row = object(value, 'relations.ownerLieges.sourceBasis'); tables.context_owner_liege_source_basis.push({ ordinal, source_ref_path: text(row.path, 'basis.path'), source_ref_anchor: text(row.anchor, 'basis.anchor'), source_quote: text(row.quote, 'basis.quote'), source_id, json_pointer: pointer('ownerLieges', 'sourceBasis', ordinal) }) }
  for (const [ordinal, value] of array(ownerLieges.edges, 'relations.ownerLieges.edges').entries()) {
    const row = object(value, 'relations.ownerLiege'), person_id = person(ids, row.personId, 'relations.ownerLiege.personId')
    unique(ownerIds, person_id, 'E_CONTEXT_DUPLICATE_OWNER_LIEGE')
    const liege_person_id = person(ids, row.liegePersonId, 'relations.ownerLiege.liegePersonId')
    if (person_id === liege_person_id) fail('E_CONTEXT_SELF_RELATION', person_id)
    tables.context_owner_liege.push({ person_id, liege_person_id, relation_kind: text(row.relationKind, 'relations.ownerLiege.relationKind'), owner_term: text(row.ownerTerm, 'relations.ownerLiege.ownerTerm'), source_schema: ownerSchema, effective_year: ownerYear, approval_ref: ownerApproval, catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('ownerLieges', 'edges', ordinal) })
  }
  const memberships = object(document.courtMemberships, 'relations.courtMemberships'), membershipSchema = text(memberships.schema, 'relations.courtMemberships.schema'), membershipYear = integer(memberships.effectiveYear, 'relations.courtMemberships.effectiveYear'), memberIds = new Set()
  const approvedCourts = new Set()
  for (const [ordinal, value] of array(memberships.courtApprovals, 'relations.courtMemberships.courtApprovals').entries()) { const row = object(value, 'relations.courtMemberships.courtApprovals'), court_id = text(row.courtId, 'approval.courtId'); if (!courts.has(court_id)) fail('E_CONTEXT_COURT_ORPHAN', court_id); unique(approvedCourts, court_id, 'E_CONTEXT_DUPLICATE_COURT_APPROVAL'); tables.context_court_approval.push({ court_id, approval_ref: text(row.approvalRef, 'approval.approvalRef'), source_id, json_pointer: pointer('courtMemberships', 'courtApprovals', ordinal) }) }
  for (const [ordinal, value] of array(memberships.memberships, 'relations.courtMemberships.memberships').entries()) {
    const row = object(value, 'relations.courtMembership'), person_id = person(ids, row.personId, 'relations.courtMembership.personId')
    unique(memberIds, person_id, 'E_CONTEXT_DUPLICATE_COURT_MEMBERSHIP')
    const court_id = text(row.courtId, 'relations.courtMembership.courtId')
    if (!courts.has(court_id)) fail('E_CONTEXT_COURT_ORPHAN', court_id)
    tables.context_court_membership.push({ person_id, court_id, approval_ref: text(row.approvalRef, 'relations.courtMembership.approvalRef'), source_schema: membershipSchema, effective_year: membershipYear, catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('courtMemberships', 'memberships', ordinal) })
  }
  const organizations = new Set()
  for (const [ordinal, value] of array(document.organizations, 'relations.organizations').entries()) { const row = object(value, 'organization'), organization_id = text(row.id, 'organization.id'); unique(organizations, organization_id, 'E_CONTEXT_DUPLICATE_ORGANIZATION'); tables.context_organization.push({ organization_id, name: text(row.name, 'organization.name'), polity_id: text(row.stateId, 'organization.stateId', true), source_anchor: text(row.sourceAnchor, 'organization.sourceAnchor'), catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('organizations', ordinal) }) }
  const events = new Set()
  for (const [ordinal, value] of array(document.eventLinks, 'relations.eventLinks').entries()) { const row = object(value, 'eventLink'), event_id = text(row.eventId, 'eventLink.eventId'), person_id = person(ids, row.personId, 'eventLink.personId'), organization_id = text(row.organizationId, 'eventLink.organizationId', true); unique(events, `${event_id}:${person_id}`, 'E_CONTEXT_DUPLICATE_EVENT_LINK'); if (organization_id !== null && !organizations.has(organization_id)) fail('E_CONTEXT_ORGANIZATION_ORPHAN', organization_id); tables.context_event_link.push({ event_id, person_id, organization_id, catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('eventLinks', ordinal) }) }
}

function holdingReference(tables, holding_id, source_id, holdingOrdinal, reference_kind, value) {
  const row = object(value, `holding.${reference_kind}`)
  const reference_id = text(row.stationId ?? row.landmarkId ?? row.layerId ?? row.siteAnchor, `holding.${reference_kind}.id`, true)
  const reference_name = text(row.stationName ?? row.landmarkName ?? row.layerName, `holding.${reference_kind}.name`, true)
  const stationIdentity = row.stationIdentity === undefined ? null : object(row.stationIdentity, 'holding.facilityRef.stationIdentity')
  tables.context_holding_reference.push({ holding_id, reference_kind, ordinal: 0, reference_id, reference_name, reference_source_path: text(row.sourcePath, `holding.${reference_kind}.sourcePath`, true), site_source_path: text(row.siteSourcePath, `holding.${reference_kind}.siteSourcePath`, true), reference_anchor: text(row.siteAnchor, `holding.${reference_kind}.siteAnchor`, true), station_id: text(row.stationId, `holding.${reference_kind}.stationId`, true), station_name: text(row.stationName, `holding.${reference_kind}.stationName`, true), station_district: stationIdentity === null ? null : text(stationIdentity.district, 'stationIdentity.district'), station_lat: stationIdentity === null ? null : coordinate(stationIdentity.lat, 'stationIdentity.lat', -90, 90), station_lon: stationIdentity === null ? null : coordinate(stationIdentity.lon, 'stationIdentity.lon', -180, 180), source_id, json_pointer: pointer('holdings', holdingOrdinal, reference_kind === 'station' ? 'stationRef' : reference_kind === 'facility' ? 'facilityRef' : 'landmarkRef') })
}

function holdings(bundle, ids, tables, rights) {
  const { source_id, document } = source(bundle, 'holdings')
  const source_schema = text(document.schema, 'holdings.schema'), opening_year = integer(document.openingYear, 'holdings.openingYear'), holdingIds = new Set()
  for (const [ordinal, value] of array(document.holdings, 'holdings.holdings').entries()) {
    const row = object(value, 'holding'), holding_id = text(row.id, 'holding.id')
    unique(holdingIds, holding_id, 'E_CONTEXT_DUPLICATE_HOLDING')
    const mapping = rights.successors.get(JSON.stringify(['holdings', holding_id]))
    const current_validity = mapping.disposition === 'approved-nonowning' ? 'current_seoul_nonowning' : 'current_seoul_evidenced'
    const name = localized(row.name, 'holding.name')
    const designation = row.designation === undefined ? null : localized(row.designation, 'holding.designation')
    tables.context_holding.push({ holding_id, name_ko: name.ko, name_en: name.en, holder_person_id: person(ids, row.holderPersonId, 'holding.holderPersonId'), direct_liege_person_id: person(ids, row.directLiegePersonId, 'holding.directLiegePersonId', true), polity_id: text(row.stateId, 'holding.stateId'), territorial_scale: text(row.territorialScale, 'holding.territorialScale', true), formal_title_rank: text(row.formalTitleRank, 'holding.formalTitleRank', true), geometry_source: text(row.geometrySource, 'holding.geometrySource', true), designation_ko: designation?.ko ?? null, designation_en: designation?.en ?? null, parent_geography: text(row.parentGeography, 'holding.parentGeography', true), whole_seoul_control: row.wholeSeoulControl === undefined ? null : Number(Boolean(row.wholeSeoulControl)), current_validity, canon_status: current_validity, authority_date: null, authority_ref: rights.files.transition.document.approvalRef, source_schema, opening_year, kind: row.kind ?? null, direct_ownership: row.directOwnership === undefined ? null : Number(row.directOwnership), title_id: row.titleId ?? null, liege_relationship_kind: row.liegeRelationshipKind ?? null, capability_package_id: row.capabilityPackageId ?? null, transition_set: 'holdings', transition_old_id: mapping.oldId, source_id, json_pointer: pointer('holdings', ordinal) })
    for (const [refOrdinal, refValue] of array(row.adminRefs, 'holding.adminRefs').entries()) { const ref = object(refValue, 'holding.adminRef'); tables.context_holding_admin_ref.push({ holding_id, ordinal: refOrdinal, admin_id: text(ref.id, 'holding.adminRef.id'), admin_name: text(ref.name, 'holding.adminRef.name'), source_id, json_pointer: pointer('holdings', ordinal, 'adminRefs', refOrdinal) }) }
    if (row.stationRef !== undefined) holdingReference(tables, holding_id, source_id, ordinal, 'station', row.stationRef)
    if (row.facilityRef !== undefined) holdingReference(tables, holding_id, source_id, ordinal, 'facility', row.facilityRef)
    if (row.landmarkRef !== undefined) holdingReference(tables, holding_id, source_id, ordinal, 'landmark', row.landmarkRef)
    if (row.geographicScope !== undefined) {
      const scope = row.geographicScope
      tables.context_holding_geographic_scope.push({ holding_id, duchy_title_id: scope.duchyTitleId, gu_ref: scope.guRef, kingdom_geography_id: scope.geographicKingdomId, empire_geography_id: scope.geographicEmpireId, source_id, json_pointer: pointer('holdings', ordinal, 'geographicScope') })
      scope.countyTitleIds.forEach((county_title_id, index) => tables.context_holding_scope_county.push({ holding_id, ordinal: index, county_title_id, source_id, json_pointer: pointer('holdings', ordinal, 'geographicScope', 'countyTitleIds', index) }))
      row.powers.forEach((power, index) => tables.context_holding_power.push({ holding_id, ordinal: index, power, source_id, json_pointer: pointer('holdings', ordinal, 'powers', index) }))
    }
  }
  const dispositionIds = new Set()
  for (const [ordinal, value] of array(document.openingDispositions, 'holdings.openingDispositions').entries()) { const row = object(value, 'openingDisposition'), person_id = person(ids, row.personId, 'openingDisposition.personId'); unique(dispositionIds, person_id, 'E_CONTEXT_DUPLICATE_DISPOSITION'); tables.context_opening_disposition.push({ person_id, status: text(row.status, 'openingDisposition.status'), approval_ref: text(row.approvalRef, 'openingDisposition.approvalRef'), canon_status: 'owner-approved', authority_date: null, authority_ref: text(row.approvalRef, 'openingDisposition.approvalRef'), source_schema, opening_year, source_id, json_pointer: pointer('openingDispositions', ordinal) }) }
  const polityIds = new Set()
  for (const [ordinal, value] of array(document.polities, 'holdings.polities').entries()) {
    const row = object(value, 'polity'), polity_id = text(row.id, 'polity.id'), name = localized(row.name, 'polity.name'), authority = object(row.authority, 'polity.authority')
    unique(polityIds, polity_id, 'E_CONTEXT_DUPLICATE_POLITY')
    tables.context_polity.push({ polity_id, name_ko: name.ko, name_en: name.en, sovereign_person_id: person(ids, row.sovereignPersonId, 'polity.sovereignPersonId'), territorial_scale: text(row.territorialScale, 'polity.territorialScale', true), formal_title: text(row.formalTitle, 'polity.formalTitle'), formal_title_rank: text(row.formalTitleRank, 'polity.formalTitleRank'), office: text(row.office, 'polity.office'), authority_kind: text(authority.kind, 'polity.authority.kind'), authority_name: text(authority.name, 'polity.authority.name'), current_validity: 'current_nonterritorial', direct_ownership: row.directOwnership === undefined ? null : Number(row.directOwnership), political_title_id: row.politicalTitleId ?? null, approval_id: rights.files.transition.logical_path, source_schema, opening_year, source_id, json_pointer: pointer('polities', ordinal) })
  }
  const retinueIds = new Set()
  for (const [ordinal, value] of array(document.retinueGroups, 'holdings.retinueGroups').entries()) {
    const row = object(value, 'retinueGroup'), retinue_group_id = text(row.id, 'retinueGroup.id'), court_id = text(row.courtId, 'retinueGroup.courtId'), liege_person_id = person(ids, row.liegePersonId, 'retinueGroup.liegePersonId'), name = localized(row.name, 'retinueGroup.name')
    unique(retinueIds, retinue_group_id, 'E_CONTEXT_DUPLICATE_RETINUE')
    if (court_id !== 'court:K1008' || liege_person_id !== 'K1008') fail('E_CONTEXT_RETINUE_REVIEW_REQUIRED', retinue_group_id)
    tables.context_retinue_group.push({ retinue_group_id, name_ko: name.ko, name_en: name.en, court_id, liege_person_id, person_count: integer(row.count, 'retinueGroup.count'), personhood_review: text(row.personhoodReview, 'retinueGroup.personhoodReview'), formal_title: text(row.formalTitle, 'retinueGroup.formalTitle', true), current_validity: 'unresolved', source_schema, opening_year, source_id, json_pointer: pointer('retinueGroups', ordinal) })
    for (const [dutyOrdinal, duty] of array(row.duties, 'retinueGroup.duties').entries()) tables.context_retinue_duty.push({ retinue_group_id, ordinal: dutyOrdinal, duty: text(duty, 'retinueGroup.duty'), source_id, json_pointer: pointer('retinueGroups', ordinal, 'duties', dutyOrdinal) })
    for (const [limitOrdinal, limit] of array(row.technicalLimits, 'retinueGroup.technicalLimits').entries()) tables.context_retinue_technical_limit.push({ retinue_group_id, ordinal: limitOrdinal, technical_limit: text(limit, 'retinueGroup.technicalLimit'), source_id, json_pointer: pointer('retinueGroups', ordinal, 'technicalLimits', limitOrdinal) })
    for (const [holdingOrdinal, holdingId] of array(row.holdingIds, 'retinueGroup.holdingIds').entries()) { const holding_id = text(holdingId, 'retinueGroup.holdingId'); if (!holdingIds.has(holding_id)) fail('E_CONTEXT_HOLDING_ORPHAN', holding_id); tables.context_retinue_holding.push({ retinue_group_id, holding_id, ordinal: holdingOrdinal, source_id, json_pointer: pointer('retinueGroups', ordinal, 'holdingIds', holdingOrdinal) }) }
  }
}

function offices(bundle, ids, tables) {
  const { source_id, document } = source(bundle, 'offices'), source_schema = text(document.schema, 'offices.schema'), opening_year = integer(document.openingYear, 'offices.openingYear'), seen = new Set()
  if (source_schema !== 'opening-office-appointments.v2') fail('E_CONTEXT_OFFICE', source_schema)
  for (const [ordinal, value] of array(document.appointments, 'offices.appointments').entries()) {
    const row = object(value, 'office'), person_id = person(ids, row.personId, 'office.personId'), current = object(row.current, 'office.current'), history = object(row.history, 'office.history')
    unique(seen, person_id, 'E_CONTEXT_DUPLICATE_OFFICE')
    const status = text(current.status, 'office.current.status')
    const ranked = ['retained-office', 'nonterritorial-political-office'].includes(status)
    if (!['retained-office', 'nonterritorial-political-office', 'nonowning-jurisdiction', 'existing-function', 'unappointed'].includes(status)
      || history.personId !== row.personId || history.stateId !== row.stateId || current.commonTier !== history.commonTier
      || (status === 'unappointed' && (current.position !== null || current.rank !== null))
      || (!ranked && current.rank !== null)) fail('E_CONTEXT_OFFICE', person_id)
    const position = current.position === null ? null : localized(current.position, 'office.current.position')
    const rank = current.rank === null ? null : localized(current.rank, 'office.current.rank')
    if ((status !== 'unappointed' && position === null) || (ranked && rank === null)) fail('E_CONTEXT_OFFICE', person_id)
    const oldPosition = localized(history.position, 'office.history.position'), oldRank = localized(history.rank, 'office.history.rank')
    tables.context_office_appointment.push({ person_id, polity_id: text(row.stateId, 'office.stateId'), position_ko: position?.ko ?? null,
      position_en: position?.en ?? null, rank_ko: rank?.ko ?? null, rank_en: rank?.en ?? null, common_tier: text(current.commonTier, 'office.current.commonTier'),
      status, source_schema, opening_year, catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('appointments', ordinal, 'current') })
    tables.context_office_history.push({ person_id, polity_id: history.stateId, position_ko: oldPosition.ko, position_en: oldPosition.en,
      rank_ko: oldRank.ko, rank_en: oldRank.en, common_tier: history.commonTier, approval_ref: text(history.approvalRef, 'office.history.approvalRef'),
      source_id, json_pointer: pointer('appointments', ordinal, 'history') })
    const evidence = array(current.evidence, 'office.evidence')
    if (!evidence.length) fail('E_CONTEXT_OFFICE', person_id)
    for (const [index, ref] of evidence.entries()) {
      const target = bundle.files.find(file => file.logical_path === ref.path)
      if (!target || !bundle.records.some(record => record.source_id === target.source_id && record.json_pointer === ref.jsonPointer)) fail('E_CONTEXT_OFFICE_EVIDENCE', ref.path + '#' + ref.jsonPointer)
      tables.context_office_evidence.push({ person_id, ordinal: index, reference_path: text(ref.path, 'evidence.path'), reference_pointer: text(ref.jsonPointer, 'evidence.jsonPointer'),
        evidence_kind: text(ref.kind, 'evidence.kind'), reference_source_id: target.source_id, reference_json_pointer: ref.jsonPointer,
        source_id, json_pointer: pointer('appointments', ordinal, 'current', 'evidence', index) })
    }
  }
}

function contacts(bundle, ids, tables) {
  const { source_id, document } = source(bundle, 'contacts'), seen = new Set()
  integer(document.schemaVersion, 'contacts.schemaVersion')
  for (const [ordinal, value] of array(document.records, 'contacts.records').entries()) { const row = object(value, 'contact'), person_id = person(ids, row.personId, 'contact.personId'), recipient_person_id = person(ids, row.recipientId, 'contact.recipientId'); if (person_id === recipient_person_id) fail('E_CONTEXT_SELF_RELATION', person_id); const key = `${person_id}:${recipient_person_id}`; unique(seen, key, 'E_CONTEXT_DUPLICATE_PROSE_CONTACT'); const sourceRef = object(row.sourceRef, 'contact.sourceRef'); tables.context_prose_contact.push({ person_id, recipient_person_id, contact_kind: text(row.kind, 'contact.kind'), source_ref_path: text(sourceRef.path, 'contact.sourceRef.path'), source_ref_anchor: text(sourceRef.anchor, 'contact.sourceRef.anchor'), catalog_status: CATALOG_STATUS, source_id, json_pointer: pointer('records', ordinal) }) }
}

export function mapContextDomains({ bundle, identity }) {
  const tables = Object.fromEntries(Object.keys(CONTEXT_TABLE_COLUMNS).map((table) => [table, []]))
  const ids = people(identity)
  relations(bundle, ids, tables)
  const rights = authenticateCurrentRights(bundle, identity)
  mapCurrentRights(rights, tables)
  holdings(bundle, ids, tables, rights)
  offices(bundle, ids, tables)
  contacts(bundle, ids, tables)
  return freezeRows(tables)
}
