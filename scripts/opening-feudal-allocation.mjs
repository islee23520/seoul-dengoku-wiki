// 개막 봉건 영지 배분 검증·투영 (opening-feudal-allocation.v1)
// 검증과 결과 조립만 담당한다. JSON 원장 작성·생성기·UI 투영은 상위 소유다.
// 모든 점유·규모 판정은 호출자가 넘긴 control/outside/scale 입력의 현재 상태만 따른다.
// 어떤 지역 수·요소 수도 이 모듈에 두지 않는다.

import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'

const RANK_WEIGHT = { barony: 1, duchy: 2, kingdom: 3 }
export const OPENING_FEUDAL_ALLOCATION_SCHEMA = 'opening-feudal-allocation.v1'
const EXISTING_LEDGER_SCHEMA = 'confirmed-person-holdings.v1'
const KING_DIRECT_SAMEHOLDER_DUCHY_CAP = 2
const NONOWNING_POWERS = ['receive-holding-change-notice', 'lodge-nonbinding-registry-objection']

const fail = message => { throw new Error(message) }
const composedTransitions = new WeakMap()
const rightsDigest = args => createHash('sha256').update(JSON.stringify([args.existing, args.allocation, args.people, args.affiliation, args.seoul, args.outside, args.control])).digest('hex')

export function composeConsolidationTransition(current, predecessor, historical, transition, decisionBytes) {
  if (!(decisionBytes instanceof Uint8Array) || createHash('sha256').update(decisionBytes).digest('hex') !== 'd0378abb6ef9578a847c133247faabb06d758b968d35f1193b4e4feb83701c54') fail('E_CONSOLIDATION_APPROVAL')
  validateApprovedRightsTransition(predecessor, historical, transition)
  const decision = JSON.parse(Buffer.from(decisionBytes).toString())
  const expected = structuredClone({ existing: predecessor.existing, allocation: predecessor.allocation, people: predecessor.people })
  const retiredHoldings = new Set(['holding:daejeon-dong', 'holding:daejeon-yuseong', 'holding:daejeon-jung', 'holding:daejeon-seo', 'holding:daejeon-daedeok'])
  const retiredTitles = new Set(['title:kingdom-daejeon', 'proposal:superior-jurisdiction:seoul:daejeon-dong', 'proposal:superior-jurisdiction:seoul:daejeon-jung', 'proposal:superior-jurisdiction:seoul:daejeon-seo', 'proposal:superior-jurisdiction:seoul:daejeon-yuseong', 'proposal:superior-jurisdiction:seoul:daejeon-daedeok'])
  expected.existing.holdings = expected.existing.holdings.filter(row => !retiredHoldings.has(row.id))
  expected.existing.polities = expected.existing.polities.filter(row => row.id !== 'polity:daejeon')
  expected.allocation.titles = expected.allocation.titles.filter(row => !retiredTitles.has(row.id)).concat(decision.kingdomTitleRows)
  expected.allocation.existingTitleBindings = expected.allocation.existingTitleBindings.filter(row => !retiredHoldings.has(row.holdingId))
  const moved = new Set(['K035', 'K038', 'K039', 'K1008', 'K1003'])
  for (const person of expected.people) if (moved.has(person.id)) person.state = 'S02'
  for (const key of ['existing', 'allocation', 'people']) if (!isDeepStrictEqual(current[key], expected[key])) fail('E_CONSOLIDATION_DELTA:' + key)
  if (!isDeepStrictEqual(current.affiliation, predecessor.affiliation)) fail('E_CONSOLIDATION_DELTA:affiliation')
  const token = Object.freeze({})
  composedTransitions.set(token, { digest: rightsDigest(current), geographicTitles: structuredClone(decision.kingdomTitleRows) })
  return token
}

function requireObject(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code)
  return value
}

function requireString(value, code) {
  if (typeof value !== 'string' || !value.trim()) fail(code)
  return value
}

function requireArray(value, code) {
  if (!Array.isArray(value)) fail(code)
  return value
}

function buildPeopleIndex(people) {
  const byId = new Map()
  for (const person of requireArray(people, 'E_PEOPLE_SHAPE')) {
    requireObject(person, 'E_PEOPLE_SHAPE')
    const id = requireString(person.id, 'E_PEOPLE_SHAPE')
    requireString(person.name, 'E_PEOPLE_NAME:' + id)
    requireString(person.state, 'E_PEOPLE_STATE:' + id)
    if (byId.has(id)) fail('E_PEOPLE_DUPLICATE:' + id)
    byId.set(id, person)
  }
  return byId
}

// 선행 소속: 보유자 인물의 state가 속한 헤게모니가 대상 stateId를 이미 회원으로 두는지 확인한다.
function buildHegemonMembership(affiliation) {
  const hegemons = requireObject(affiliation, 'E_AFFILIATION_SHAPE').hegemons
  requireArray(hegemons, 'E_AFFILIATION_SHAPE')
  const byState = new Map()
  for (const hegemon of hegemons) {
    requireObject(hegemon, 'E_AFFILIATION_SHAPE')
    requireString(hegemon.name, 'E_AFFILIATION_SHAPE')
    const memberStateIds = requireArray(hegemon.memberStateIds, 'E_AFFILIATION_SHAPE')
    if (!memberStateIds.length) fail('E_AFFILIATION_SHAPE')
    for (const stateId of memberStateIds) {
      requireString(stateId, 'E_AFFILIATION_SHAPE')
      if (byState.has(stateId)) fail('E_AFFILIATION_DUPLICATE:' + stateId)
      byState.set(stateId, hegemon)
    }
  }
  return byState
}

// 선행 소속: 자기 state 영역은 헤게모니 없이도 허용(중립 포함), 그 외에는 소속 헤게모니의 회원 state만 허용한다.
function checkRealmMembership(membership, person, subjectStateId, code) {
  if (person.state === subjectStateId) return
  const hegemon = membership.get(person.state)
  if (!hegemon || !hegemon.memberStateIds.includes(subjectStateId)) fail(code)
}

function checkPoliticalAuthority(ctx, stateId, authority, code) {
  const realm = ctx.membership.get(stateId)
  const polity = ctx.existing.polities.find(polity => polity.id === stateId)
  const matches = realm ? realm.name === authority?.name
    : polity ? polity.authority?.kind === authority?.kind && polity.authority?.name === authority?.name
    : authority?.stateId === stateId
  if (!matches) fail(code)
}

// 서울 행정동과 바깥 행정단위의 정확한 id·name 도형 색인, 분할 섬 단위 색인.
function buildGeometry(seoul, outside) {
  const byId = new Map()
  const heldRegionIds = new Set()
  for (const region of requireArray(requireObject(seoul, 'E_SEOUL_SHAPE').regions, 'E_SEOUL_SHAPE')) {
    requireObject(region, 'E_SEOUL_SHAPE')
    const id = requireString(region.id, 'E_SEOUL_SHAPE')
    requireString(region.name, 'E_SEOUL_NAME:' + id)
    if (byId.has(id)) fail('E_SEOUL_DUPLICATE:' + id)
    byId.set(id, region)
    if ((region.polities ?? []).length > 0) heldRegionIds.add(id)
  }
  const islands = requireObject(outside, 'E_OUTSIDE_SHAPE').islands ?? []
  const splitUnits = new Map()
  for (const island of requireArray(islands, 'E_ISLAND_SHAPE')) {
    requireObject(island, 'E_ISLAND_SHAPE')
    const unitId = requireString(island.unitId, 'E_ISLAND_SHAPE')
    if (splitUnits.has(unitId)) fail('E_ISLAND_DUPLICATE:' + unitId)
    requireArray(island.components, 'E_ISLAND_SHAPE:' + unitId)
    splitUnits.set(unitId, island)
  }
  const units = requireArray(requireObject(outside, 'E_OUTSIDE_SHAPE').units, 'E_OUTSIDE_SHAPE')
  for (const unit of units) {
    requireObject(unit, 'E_OUTSIDE_SHAPE')
    const id = requireString(unit.id, 'E_OUTSIDE_SHAPE')
    requireString(unit.name, 'E_OUTSIDE_NAME:' + id)
    if (byId.has(id)) fail('E_OUTSIDE_DUPLICATE:' + id)
    byId.set(id, unit)
  }
  for (const unitId of splitUnits.keys()) {
    if (!byId.has(unitId)) fail('E_ISLAND_UNIT:' + unitId)
  }
  const heldComponentKeys = new Set()
  const componentByKey = new Map()
  for (const island of splitUnits.values()) {
    for (const component of island.components) {
      requireObject(component, 'E_ISLAND_SHAPE:' + island.unitId)
      if (!Number.isInteger(component.componentIndex)) fail('E_ISLAND_SHAPE:' + island.unitId)
      const key = componentKey(island.unitId, component.componentIndex)
      if (componentByKey.has(key)) fail('E_ISLAND_DUPLICATE:' + key)
      componentByKey.set(key, component)
      if (component.authority) heldComponentKeys.add(key)
    }
  }
  return { byId, splitUnits, heldRegionIds, heldComponentKeys, componentByKey }
}

function componentKey(unitId, componentIndex) { return `${unitId}#${componentIndex}` }

// control 입력의 현재 authoritative 상태로 전체 점유 단위를 판정한다. 미배정은 입력이 null일 뿐이다.
function buildControl(control, geometry) {
  const assignments = requireArray(requireObject(control, 'E_CONTROL_SHAPE').assignments, 'E_CONTROL_SHAPE')
  const byUnit = new Map()
  const wholeHeld = new Set()
  for (const assignment of assignments) {
    requireObject(assignment, 'E_CONTROL_SHAPE')
    const unitId = requireString(assignment.unitId, 'E_CONTROL_SHAPE')
    if (!geometry.byId.has(unitId)) fail('E_CONTROL_UNIT:' + unitId)
    if (byUnit.has(unitId)) fail('E_CONTROL_DUPLICATE:' + unitId)
    byUnit.set(unitId, assignment)
    if (assignment.authority && !geometry.splitUnits.has(unitId)) wholeHeld.add(unitId)
  }
  return { byUnit, wholeHeld }
}

function buildScaleRows(scale) {
  const byAdminId = new Map()
  for (const row of requireArray(requireObject(scale, 'E_SCALE_SHAPE').rows, 'E_SCALE_SHAPE')) {
    requireObject(row, 'E_SCALE_SHAPE')
    const adminId = requireString(row.adminId, 'E_SCALE_SHAPE')
    requireString(row.status, 'E_SCALE_STATUS:' + adminId)
    if (byAdminId.has(adminId)) fail('E_SCALE_DUPLICATE:' + adminId)
    byAdminId.set(adminId, row)
  }
  return byAdminId
}

function buildGeographicIndex(geographicScale) {
  if (geographicScale?.schema !== 'admin-territorial-scale.v2') fail('E_GEOGRAPHIC_SCALE_SCHEMA')
  const titles = requireArray(geographicScale.titles, 'E_GEOGRAPHIC_SCALE_SHAPE')
  const dated = requireArray(geographicScale.slotEditions?.dated?.rows, 'E_GEOGRAPHIC_SCALE_SHAPE')
  const current = requireArray(geographicScale.slotEditions?.currentCorrespondence?.rows, 'E_GEOGRAPHIC_SCALE_SHAPE')
  if (titles.length !== 80 || dated.length !== 426 || current.length !== 427
    || geographicScale.slotEditions.currentCorrespondence.geometryVerified !== false) fail('E_GEOGRAPHIC_SCALE_SHAPE')
  const byId = new Map(titles.map(title => [title.titleId, title]))
  const slots = new Map(dated.map(slot => [slot.slotId, slot]))
  if (byId.size !== titles.length || slots.size !== dated.length
    || new Set(current.map(slot => slot.slotId)).size !== current.length) fail('E_GEOGRAPHIC_SCALE_SHAPE')
  return { byId, slots }
}

function validateGeographicBinding(record, ctx) {
  if (!ctx.geographic) return
  const code = 'E_RIGHT_GEOGRAPHY:' + record.id
  if (record.geographicTitleId !== undefined) {
    if (ctx.geographic.byId.get(record.geographicTitleId)?.rank !== record.rank) fail(code)
  }
  if (record.geographicScope !== undefined) {
    const scope = requireObject(record.geographicScope, code)
    const duchy = ctx.geographic.byId.get(scope.duchyTitleId)
    if (duchy?.rank !== 'duchy' || !duchy.jurisdictionRefs.includes(scope.guRef)
      || ctx.geographic.byId.get(scope.geographicEmpireId)?.rank !== 'empire'
      || !Array.isArray(scope.countyTitleIds) || scope.countyTitleIds.some(id => {
        const county = ctx.geographic.byId.get(id)
        return county?.rank !== 'county' || !county.jurisdictionRefs.includes(scope.guRef)
      })) fail(code)
  }
  if (record.slotId !== undefined && !ctx.geographic.slots.has(record.slotId)) fail(code)
}

function buildLandlessPeople(existing) {
  const landless = new Set()
  for (const row of requireArray(existing.openingDispositions ?? [], 'E_EXISTING_SHAPE')) {
    requireObject(row, 'E_EXISTING_SHAPE')
    if (row.status !== 'personal-landless') fail('E_EXISTING_DISPOSITION:' + row.personId)
    landless.add(requireString(row.personId, 'E_EXISTING_SHAPE'))
  }
  return landless
}

function recordKind(record, title = false) {
  const kind = record.kind === undefined ? 'direct-property' : record.kind
  if (kind !== 'direct-property' && kind !== 'superior-jurisdiction'
    && !(title && kind === 'nonterritorial-political-title')) fail('E_RIGHT_KIND:' + record.id)
  if (kind === 'direct-property' && ['geographicScope', 'geographicTitleId', 'geographicParentTitleId',
    'politicalParentTitleId', 'capabilityPackageId', 'powers'].some(key => record[key] !== undefined)) fail('E_RIGHT_KIND:' + record.id)
  if (kind === 'direct-property' && record.directOwnership === false) fail('E_RIGHT_KIND:' + record.id)
  return kind
}

// 승인 데이터는 호출자가 승인 원본/영수와 대조하여 넘기는 신뢰 경계다. 이 모듈은 승인 자체를 발급하지 않는다.
function buildNonowningRights(contract) {
  if (contract === undefined) return null
  requireObject(contract, 'E_NONOWNING_CONTRACT')
  if (contract.schema !== 'opening-nonowning-rights.v1') fail('E_NONOWNING_CONTRACT')
  requireString(contract.approvalRef, 'E_NONOWNING_CONTRACT')
  if (!/^[a-f0-9]{64}$/.test(contract.proposalSha256)) fail('E_NONOWNING_CONTRACT')
  requireString(contract.capabilityPackageId, 'E_NONOWNING_CONTRACT')
  const royal = requireObject(contract.politicalTitle, 'E_NONOWNING_CONTRACT')
  for (const field of ['id', 'holderPersonId', 'stateId']) requireString(royal[field], 'E_NONOWNING_CONTRACT')
  const byHolding = new Map()
  const byTitle = new Map()
  for (const row of requireArray(contract.rights, 'E_NONOWNING_CONTRACT')) {
    requireObject(row, 'E_NONOWNING_CONTRACT')
    for (const field of ['holdingId', 'titleId', 'holderPersonId', 'stateId']) requireString(row[field], 'E_NONOWNING_CONTRACT')
    if (row.personalLiegePersonId !== null) requireString(row.personalLiegePersonId, 'E_NONOWNING_CONTRACT')
    if (row.politicalParentTitleId !== royal.id || row.stateId !== royal.stateId) fail('E_NONOWNING_CONTRACT')
    const scope = requireObject(row.geographicScope, 'E_NONOWNING_CONTRACT')
    if (!/^11\d{3}$/.test(scope.guRef) || scope.duchyTitleId !== 'geography:duchy:' + scope.guRef
      || scope.geographicEmpireId !== 'geography:empire:seoul') fail('E_NONOWNING_GEOGRAPHY:' + row.holdingId)
    requireString(scope.geographicKingdomId, 'E_NONOWNING_CONTRACT')
    const counties = requireArray(scope.countyTitleIds, 'E_NONOWNING_CONTRACT')
    if (!counties.length || new Set(counties).size !== counties.length
      || counties.some(id => typeof id !== 'string' || !id.startsWith('geography:county:seoul-constituency:'))) fail('E_NONOWNING_GEOGRAPHY:' + row.holdingId)
    if (byHolding.has(row.holdingId) || byTitle.has(row.titleId) || row.titleId === royal.id) fail('E_NONOWNING_CONTRACT')
    byHolding.set(row.holdingId, row)
    byTitle.set(row.titleId, row)
  }
  return { ...contract, byHolding, byTitle }
}

function checkNonowningProperty(record) {
  const fields = ['id', 'kind', 'name', 'holderPersonId', 'stateId', 'directOwnership', 'adminRefs',
    'componentRefs', 'jurisdictionRefs', 'geometrySource', 'parentTitleId', 'stationRef', 'facilityRef', 'landmarkRef',
    'rank', 'basis', 'personalLiegePersonId', 'politicalParentTitleId', 'geographicParentTitleId', 'geographicTitleId',
    'geographicScope', 'titleId', 'directLiegePersonId', 'liegeRelationshipKind', 'territorialScale', 'formalTitleRank',
    'powers', 'capabilityPackageId', 'status', 'activationDecisionIds']
  if (Object.keys(record).some(key => !fields.includes(key))) fail('E_NONOWNING_FIELD:' + record.id)
  const code = 'E_NONOWNING_OWNERSHIP:' + record.id
  if (record.directOwnership !== false || record.geometrySource != null
    || record.stationRef != null || record.facilityRef != null || record.landmarkRef != null) fail(code)
  for (const field of ['adminRefs', 'componentRefs', 'jurisdictionRefs']) {
    if (requireArray(record[field] ?? [], code).length) fail(code)
  }
  if (record.parentTitleId != null) fail('E_NONOWNING_PARENT:' + record.id)
}

function checkNonowningIdentity(record, approved, ctx, personalLiege) {
  if (record.holderPersonId !== approved.holderPersonId || record.stateId !== approved.stateId
    || !ctx.peopleById.has(record.holderPersonId)) fail('E_NONOWNING_HOLDER:' + record.id)
  checkRealmMembership(ctx.membership, ctx.peopleById.get(record.holderPersonId), record.stateId, 'E_NONOWNING_HOLDER:' + record.id)
  if (personalLiege !== approved.personalLiegePersonId
    || personalLiege !== null && !ctx.peopleById.has(personalLiege)) fail('E_NONOWNING_LIEGE:' + record.id)
}

function validateNonowningTitle(title, ctx) {
  const contract = ctx.nonowningRights
  if (!contract) fail('E_NONOWNING_APPROVAL:' + title.id)
  checkNonowningProperty(title)
  if (['directLiegePersonId', 'titleId', 'liegeRelationshipKind', 'territorialScale', 'formalTitleRank']
    .some(key => title[key] !== undefined)) fail('E_NONOWNING_FIELD:' + title.id)
  if (title.powers !== undefined || title.capabilityPackageId !== undefined) fail('E_NONOWNING_POWERS:' + title.id)
  if (title.kind === 'nonterritorial-political-title') {
    const royal = contract.politicalTitle
    if (title.id !== royal.id || title.rank !== 'kingdom') fail('E_NONOWNING_TITLE:' + title.id)
    checkNonowningIdentity(title, { ...royal, personalLiegePersonId: null }, ctx, title.personalLiegePersonId)
    if (title.politicalParentTitleId !== null || title.geographicParentTitleId != null
      || title.geographicTitleId != null || title.geographicScope != null) fail('E_NONOWNING_PARENT:' + title.id)
    return
  }
  const approved = contract.byTitle.get(title.id)
  if (!approved || title.rank !== 'duchy') fail('E_NONOWNING_TITLE:' + title.id)
  checkNonowningIdentity(title, approved, ctx, title.personalLiegePersonId)
  if (title.politicalParentTitleId !== approved.politicalParentTitleId) fail('E_NONOWNING_PARENT:' + title.id)
  if (title.geographicTitleId !== approved.geographicScope.duchyTitleId
    || title.geographicParentTitleId !== approved.geographicScope.geographicKingdomId
    || title.geographicScope != null) fail('E_NONOWNING_GEOGRAPHY:' + title.id)
  validateGeographicBinding(title, ctx)
}

function validateExistingNonowningRights(ctx) {
  for (const holding of ctx.existing.holdings) {
    if (recordKind(holding) === 'direct-property') continue
    if (ctx.existing.holdings.filter(row => row.id === holding.id).length !== 1) fail('E_HOLDING_DUPLICATE:' + holding.id)
    const approved = ctx.nonowningRights?.byHolding.get(holding.id)
    if (!approved) fail('E_NONOWNING_APPROVAL:' + holding.id)
    checkNonowningProperty(holding)
    if (['rank', 'personalLiegePersonId', 'geographicTitleId'].some(key => holding[key] !== undefined)) fail('E_NONOWNING_FIELD:' + holding.id)
    checkNonowningIdentity(holding, approved, ctx, holding.directLiegePersonId)
    const title = ctx.titlesById.get(holding.titleId)
    if (holding.titleId !== approved.titleId || title?.kind !== 'superior-jurisdiction') fail('E_NONOWNING_TITLE:' + holding.id)
    if (holding.liegeRelationshipKind !== 'preserved-personal-service') fail('E_NONOWNING_LIEGE:' + holding.id)
    const scope = requireObject(holding.geographicScope, 'E_NONOWNING_GEOGRAPHY:' + holding.id)
    const expected = approved.geographicScope
    if (Object.keys(scope).length !== Object.keys(expected).length
      || Object.keys(expected).some(key => key === 'countyTitleIds'
        ? !Array.isArray(scope[key]) || scope[key].length !== expected[key].length
          || new Set(scope[key]).size !== scope[key].length || scope[key].some(id => !expected[key].includes(id))
        : scope[key] !== expected[key])) fail('E_NONOWNING_GEOGRAPHY:' + holding.id)
    const powers = requireArray(holding.powers, 'E_NONOWNING_POWERS:' + holding.id)
    if (holding.capabilityPackageId !== ctx.nonowningRights.capabilityPackageId
      || powers.length !== NONOWNING_POWERS.length || new Set(powers).size !== powers.length
      || powers.some(power => !NONOWNING_POWERS.includes(power))) fail('E_NONOWNING_POWERS:' + holding.id)
    if (holding.politicalParentTitleId !== undefined || holding.geographicParentTitleId !== undefined
      || holding.territorialScale !== 'duchy' || holding.formalTitleRank !== null) fail('E_NONOWNING_TITLE:' + holding.id)
    validateGeographicBinding(holding, ctx)
  }
}

function validateTitles(allocation, ctx) {
  const titles = requireArray(allocation.titles, 'E_TITLE_SHAPE')
  const byId = new Map()
  for (const title of titles) {
    requireObject(title, 'E_TITLE_SHAPE')
    const id = requireString(title.id, 'E_TITLE_SHAPE')
    if (byId.has(id)) fail('E_TITLE_DUPLICATE:' + id)
    requireString(title.name, 'E_TITLE_NAME:' + id)
    if (!RANK_WEIGHT[title.rank]) fail('E_TITLE_RANK:' + id)
    const holderPersonId = requireString(title.holderPersonId, 'E_TITLE_SHAPE:' + id)
    const holder = ctx.peopleById.get(holderPersonId)
    if (!holder) fail('E_TITLE_HOLDER:' + id)
    if (ctx.landless.has(holderPersonId)) fail('E_LANDLESS_GRANT:' + holderPersonId)
    const stateId = requireString(title.stateId, 'E_TITLE_SHAPE:' + id)
    requireString(title.basis, 'E_TITLE_BASIS:' + id)
    checkRealmMembership(ctx.membership, holder, stateId, 'E_TITLE_MEMBERSHIP:' + id)
    const geographicApproval = ctx.geographicTitles?.find(row => row.id === id)
    if (geographicApproval) {
      const geography = ctx.geographic?.byId.get(title.geographicTitleId)
      if (!isDeepStrictEqual(title, geographicApproval) || title.rank !== 'kingdom'
        || geography?.rank !== 'kingdom') fail('E_GEOGRAPHIC_KINGDOM:' + id)
      byId.set(id, title)
      continue
    }
    if (recordKind(title, true) !== 'direct-property') {
      validateNonowningTitle(title, ctx)
      byId.set(id, title)
      continue
    }
    validateGeographicBinding(title, ctx)
    if (title.parentTitleId != null) requireString(title.parentTitleId, 'E_TITLE_SHAPE:' + id)
    const jurisdictionRefs = requireArray(title.jurisdictionRefs ?? [], 'E_TITLE_JURISDICTION:' + id)
    const seenRefs = new Set()
    for (const ref of jurisdictionRefs) {
      requireString(ref, 'E_TITLE_JURISDICTION:' + id)
      if (!ctx.geometry.byId.has(ref)) fail('E_TITLE_JURISDICTION:' + id + '|' + ref)
      if (seenRefs.has(ref)) fail('E_TITLE_JURISDICTION_DUPLICATE:' + id + '|' + ref)
      // 관할 ref도 현재 control 상태를 따른다: 서울은 polities, 바깥은 authoritative authority.
      const held = ref.startsWith('region:')
        ? (ctx.geometry.byId.get(ref).polities ?? []).length > 0
        : Boolean(ctx.control.byUnit.get(ref)?.authority)
      if (!held) fail('E_TITLE_JURISDICTION_UNHELD:' + id + '|' + ref)
      if (ref.startsWith('region:')) {
        const polities = ctx.geometry.byId.get(ref).polities ?? []
        if (!polities.some(polity => polity === stateId || ctx.membership.has(stateId) && ctx.membership.get(polity)?.name === ctx.membership.get(stateId).name)) fail('E_TITLE_CONTROL_REALM:' + id + '|' + ref)
      } else {
        checkPoliticalAuthority(ctx, stateId, ctx.control.byUnit.get(ref)?.authority, 'E_TITLE_CONTROL_REALM:' + id + '|' + ref)
      }
      seenRefs.add(ref)
    }
    byId.set(id, title)
  }
  for (const title of titles) {
    if (title.kind === 'superior-jurisdiction'
      && byId.get(title.politicalParentTitleId)?.kind !== 'nonterritorial-political-title') fail('E_NONOWNING_PARENT:' + title.id)
    if (title.parentTitleId == null) continue
    if (!byId.has(title.parentTitleId)) fail('E_TITLE_PARENT:' + title.id + '|' + title.parentTitleId)
    if (recordKind(byId.get(title.parentTitleId), true) !== 'direct-property') fail('E_TITLE_PARENT_KIND:' + title.id)
  }
  for (const title of titles) {
    const visited = new Set([title.id])
    let cursor = title
    while (cursor.parentTitleId != null) {
      if (visited.has(cursor.parentTitleId)) fail('E_TITLE_CYCLE:' + title.id)
      visited.add(cursor.parentTitleId)
      cursor = byId.get(cursor.parentTitleId)
    }
  }
  for (const title of titles) {
    if (title.parentTitleId == null) continue
    const parent = byId.get(title.parentTitleId)
    checkRealmMembership(ctx.membership, ctx.peopleById.get(title.holderPersonId), parent.stateId, 'E_TITLE_PARENT_REALM:' + title.id)
    if (RANK_WEIGHT[parent.rank] === RANK_WEIGHT[title.rank]) fail('E_TITLE_EQUAL_RANK:' + title.id)
    if (RANK_WEIGHT[parent.rank] < RANK_WEIGHT[title.rank]) fail('E_TITLE_RANK_ORDER:' + title.id)
    for (const ref of title.jurisdictionRefs ?? []) {
      if (!(parent.jurisdictionRefs ?? []).includes(ref)) fail('E_TITLE_JURISDICTION_SUBSET:' + title.id + '|' + ref)
    }
  }
  // 왕급이 스스로 보유한 직속 공작급(최대 둘)만 같은 보유자 예외다. 다른 사람 수여분은 등급만 하위면 된다.
  for (const king of byId.values()) {
    if (king.rank !== 'kingdom') continue
    const sameholderDuchies = titles.filter(title => title.parentTitleId === king.id
      && title.rank === 'duchy' && title.holderPersonId === king.holderPersonId)
    if (sameholderDuchies.length > KING_DIRECT_SAMEHOLDER_DUCHY_CAP) fail('E_TITLE_KING_DUCHY_CAP:' + king.id)
  }
  return byId
}

// 새 grant는 작위 보유자 본인의 직영지다. 주군은 부모 작위 보유자이되, 자신이 그 부모의 보유자면 null이다.
function validateGrantTitleRelation(grant, id, titlesById) {
  if (grant.titleId == null) return
  const title = titlesById.get(grant.titleId)
  if (recordKind(title, true) !== 'direct-property') fail('E_GRANT_TITLE_KIND:' + id)
  for (const ref of grant.adminRefs ?? []) {
    if (!(title.jurisdictionRefs ?? []).includes(ref.id)) fail('E_GRANT_TITLE_JURISDICTION:' + id + '|' + ref.id)
  }
  if (grant.holderPersonId !== title.holderPersonId) fail('E_GRANT_HOLDER_TITLE:' + id)
  const parentHolder = title.parentTitleId == null ? null : titlesById.get(title.parentTitleId).holderPersonId
  const expectedLiege = parentHolder === grant.holderPersonId ? null : parentHolder
  if (grant.directLiegePersonId !== expectedLiege) fail('E_GRANT_LIEGE:' + id)
  if (grant.formalTitleRank != null && grant.formalTitleRank !== title.rank) fail('E_GRANT_TITLE_RANK:' + id)
}

function validateGrants(allocation, ctx) {
  const grants = requireArray(allocation.grants, 'E_GRANT_SHAPE')
  const claimedAdmin = new Map()
  const claimedComponents = new Map()
  for (const holding of ctx.existing.holdings) {
    if (holding.kind === 'superior-jurisdiction') continue
    for (const ref of holding.adminRefs ?? []) {
      if (claimedAdmin.has(ref.id)) fail('E_GRANT_ADMINREF_OVERLAP:' + holding.id + '|' + ref.id)
      claimedAdmin.set(ref.id, holding.id)
    }
    for (const ref of holding.componentRefs ?? []) {
      const key = componentKey(ref.unitId, ref.componentIndex)
      if (claimedComponents.has(key)) fail('E_GRANT_COMPONENT_OVERLAP:' + holding.id + '|' + key)
      claimedComponents.set(key, holding.id)
    }
  }
  const newIds = new Set()
  for (const grant of grants) {
    requireObject(grant, 'E_GRANT_SHAPE')
    const id = requireString(grant.id, 'E_GRANT_SHAPE')
    if (recordKind(grant) !== 'direct-property') fail('E_NONOWNING_GRANT:' + id)
    if (ctx.existingHoldingIds.has(id) || newIds.has(id)) fail('E_HOLDING_DUPLICATE:' + id)
    newIds.add(id)
    requireObject(grant.name, 'E_GRANT_NAME:' + id)
    requireString(grant.name.ko, 'E_GRANT_NAME:' + id)
    const holderPersonId = requireString(grant.holderPersonId, 'E_GRANT_SHAPE:' + id)
    const holder = ctx.peopleById.get(holderPersonId)
    if (!holder) fail('E_GRANT_HOLDER:' + id)
    if (ctx.landless.has(holderPersonId)) fail('E_LANDLESS_GRANT:' + holderPersonId)
    if (grant.directLiegePersonId !== null && !ctx.peopleById.has(grant.directLiegePersonId)) fail('E_GRANT_LIEGE:' + id)
    const stateId = requireString(grant.stateId, 'E_GRANT_SHAPE:' + id)
    checkRealmMembership(ctx.membership, holder, stateId, 'E_GRANT_MEMBERSHIP:' + id)
    if (grant.titleId != null) requireString(grant.titleId, 'E_GRANT_SHAPE:' + id)
    if (grant.titleId != null && !ctx.titlesById.has(grant.titleId)) fail('E_GRANT_TITLE:' + id)
    if (grant.geometrySource != null) requireString(grant.geometrySource, 'E_GRANT_SHAPE:' + id)
    if (grant.territorialScale != null) requireString(grant.territorialScale, 'E_GRANT_SHAPE:' + id)
    if (grant.formalTitleRank != null && !RANK_WEIGHT[grant.formalTitleRank]) fail('E_GRANT_SHAPE:' + id)
    validateGeographicBinding(grant, ctx)
    const adminRefs = requireArray(grant.adminRefs ?? [], 'E_GRANT_SHAPE:' + id)
    const componentRefs = requireArray(grant.componentRefs ?? [], 'E_GRANT_SHAPE:' + id)
    for (const ref of adminRefs) {
      requireObject(ref, 'E_GRANT_SHAPE:' + id)
      requireString(ref.id, 'E_GRANT_SHAPE:' + id)
      requireString(ref.name, 'E_GRANT_SHAPE:' + id)
      const unit = ctx.geometry.byId.get(ref.id)
      if (!unit || unit.name !== ref.name) fail('E_GRANT_GEOMETRY:' + id + '|' + ref.id)
      if (claimedAdmin.has(ref.id)) fail('E_GRANT_ADMINREF_OVERLAP:' + id + '|' + ref.id)
      if (ctx.geometry.splitUnits.has(ref.id)) fail('E_GRANT_SPLIT_ADMINREF:' + id + '|' + ref.id)
      const held = ref.id.startsWith('region:') ? (unit.polities ?? []).length > 0 : Boolean(ctx.control.byUnit.get(ref.id)?.authority)
      if (!held) fail('E_GRANT_UNHELD:' + id + '|' + ref.id)
      if (ref.id.startsWith('region:')) {
        if (!(unit.polities ?? []).some(polity => polity === stateId || ctx.membership.get(polity)?.name === ctx.membership.get(stateId)?.name && ctx.membership.has(stateId))) fail('E_GRANT_CONTROL_REALM:' + id + '|' + ref.id)
      } else {
        checkPoliticalAuthority(ctx, stateId, ctx.control.byUnit.get(ref.id)?.authority, 'E_GRANT_CONTROL_REALM:' + id + '|' + ref.id)
      }
      if (ctx.control.wholeHeld.has(ref.id)) {
        claimedAdmin.set(ref.id, id)
        continue
      }
      // 서울 점유 동은 polities, 바깥 단위는 control authoritative 상태가 현재 경계다.
      claimedAdmin.set(ref.id, id)
    }
    for (const ref of componentRefs) {
      requireObject(ref, 'E_GRANT_SHAPE:' + id)
      requireString(ref.unitId, 'E_GRANT_SHAPE:' + id)
      if (!Number.isInteger(ref.componentIndex)) fail('E_GRANT_SHAPE:' + id)
      const key = componentKey(ref.unitId, ref.componentIndex)
      const component = ctx.geometry.componentByKey.get(key)
      if (!component) fail('E_GRANT_COMPONENT:' + id + '|' + key)
      if (!component.authority) fail('E_GRANT_UNASSIGNED:' + id + '|' + key)
      checkPoliticalAuthority(ctx, stateId, component.authority, 'E_GRANT_CONTROL_REALM:' + id + '|' + key)
      if (claimedComponents.has(key)) fail('E_GRANT_COMPONENT_OVERLAP:' + id + '|' + key)
      claimedComponents.set(key, id)
    }
    if (grant.territorialScale != null) {
      for (const ref of adminRefs) {
        const row = ctx.historicalScaleRows?.get(ref.id)
        if (row?.status === 'HOLD') fail('E_GRANT_SCALE_HOLD:' + id + '|' + ref.id)
      }
    }
    validateGrantTitleRelation(grant, id, ctx.titlesById)
  }
  return grants
}

function validateBindings(allocation, ctx) {
  const bindings = requireArray(allocation.existingTitleBindings ?? [], 'E_BINDING_SHAPE')
  const bound = new Set()
  for (const binding of bindings) {
    requireObject(binding, 'E_BINDING_SHAPE')
    const holdingId = requireString(binding.holdingId, 'E_BINDING_SHAPE')
    const titleId = requireString(binding.titleId, 'E_BINDING_SHAPE')
    const holding = ctx.existing.holdings.find(row => row.id === holdingId)
    if (!holding) fail('E_BINDING_HOLDING:' + holdingId)
    const title = ctx.titlesById.get(titleId)
    if (!title) fail('E_BINDING_TITLE:' + titleId)
    if (recordKind(holding) !== recordKind(title, true)) fail('E_BINDING_KIND:' + holdingId)
    if (holding.kind === 'superior-jurisdiction' && holding.titleId !== titleId) fail('E_NONOWNING_TITLE:' + holdingId)
    if (holding.holderPersonId !== title.holderPersonId) fail('E_BINDING_HOLDER:' + holdingId)
    const parentId = title.kind === 'superior-jurisdiction' ? title.politicalParentTitleId : title.parentTitleId
    const parent = parentId ? ctx.titlesById.get(parentId) : null
    if (holding.directLiegePersonId && parent?.holderPersonId !== holding.directLiegePersonId) {
      if (binding.liegeRelationshipKind !== 'preserved-personal-service' || !binding.basis?.trim()) fail('E_BINDING_LIEGE:' + holdingId)
    }
    if (bound.has(holdingId)) fail('E_BINDING_DUPLICATE:' + holdingId)
    bound.add(holdingId)
  }
  return bindings
}

// 점유 서울 동·바깥 전체 점유 단위·점유 섬 요소가 기존 권리와 새 수여를 합쳐 정확히 한 번씩 덮이는지 확인한다.
function checkCoverage(ctx) {
  const counts = new Map()
  const bump = key => counts.set(key, (counts.get(key) ?? 0) + 1)
  for (const holding of ctx.existing.holdings) {
    if (holding.kind === 'superior-jurisdiction') continue
    for (const ref of holding.adminRefs ?? []) bump(ref.id)
    for (const ref of holding.componentRefs ?? []) bump(componentKey(ref.unitId, ref.componentIndex))
  }
  for (const grant of ctx.grants) {
    for (const ref of grant.adminRefs ?? []) bump(ref.id)
    for (const ref of grant.componentRefs ?? []) bump(componentKey(ref.unitId, ref.componentIndex))
  }
  const required = [
    ...ctx.geometry.heldRegionIds,
    ...ctx.control.wholeHeld,
    ...ctx.geometry.heldComponentKeys,
  ]
  for (const key of required) {
    const covered = counts.get(key) ?? 0
    if (covered === 0) fail('E_COVERAGE_MISSING:' + key)
    if (covered > 1) fail('E_COVERAGE_DUPLICATE:' + key)
  }
  ctx.coveredEntitlements = required.length
}

// Historical validation is deliberately complete and runs before current disposition.
// The caller authenticates historical bytes and the exact owner-approved package.
export function validateApprovedRightsTransition(current, historical, transition) {
  const historicalProjection = projectHistoricalOpeningFeudalAllocation(historical)
  if (transition.schema !== 'approved-seoul-rights-transition.v1') fail('E_TRANSITION_SCHEMA')
  const equal = (actual, expected, code) => { if (!isDeepStrictEqual(actual, expected)) fail(code) }
  const sets = ['titles', 'grants', 'holdings', 'existingTitleBindings']
  const source = (args, set) => set === 'holdings' ? args.existing[set] : args.allocation[set]
  const identity = (set, row) => set === 'existingTitleBindings' ? row.holdingId : row.id
  const key = (set, id) => JSON.stringify([set, id])
  const records = requireArray(transition.records, 'E_TRANSITION_RECORDS')
  const mappings = new Map(records.map(row => [key(row.set, row.oldId), row]))
  const originalCount = sets.reduce((sum, set) => sum + source(historical, set).length, 0)
  if (records.length !== originalCount || mappings.size !== originalCount) fail('E_TRANSITION_COVERAGE')
  const expected = { existing: structuredClone(historical.existing), allocation: structuredClone(historical.allocation) }
  const seoulIds = new Set(current.seoul.regions.map(row => row.id))
  if ([...seoulIds].some(id => !/^region:11\d{8}$/.test(id))) fail('E_TRANSITION_SEOUL_SCOPE')
  const retiredTitles = []
  for (const set of sets) {
    const rows = []
    for (const original of source(historical, set)) {
      const id = identity(set, original)
      const mapping = mappings.get(key(set, id))
      if (!mapping) fail('E_TRANSITION_MISSING:' + key(set, id))
      if (mapping.sourceValueSha256 !== createHash('sha256').update(JSON.stringify(original)).digest('hex')) fail('E_TRANSITION_SOURCE_HASH:' + id)
      let row
      if (mapping.disposition === 'retired-current') {
        if (!['titles', 'grants'].includes(set) || mapping.currentId !== null || mapping.current !== undefined) fail('E_TRANSITION_RETIREMENT:' + id)
        const refs = set === 'titles' ? original.jurisdictionRefs : original.adminRefs.map(ref => ref.id)
        if (refs.some(ref => seoulIds.has(ref))) fail('E_TRANSITION_SEOUL_RETIREMENT:' + id)
        if (set === 'titles') retiredTitles.push(original)
        continue
      }
      if (mapping.disposition === 'retained-current') {
        if (mapping.current !== undefined) fail('E_TRANSITION_RETAINED:' + id)
        row = original
      } else if (mapping.disposition === 'seoul-jurisdiction-only') {
        if (set !== 'titles') fail('E_TRANSITION_MIXED:' + id)
        row = { ...original, jurisdictionRefs: original.jurisdictionRefs.filter(ref => seoulIds.has(ref)) }
        if (!row.jurisdictionRefs.length || row.jurisdictionRefs.length === original.jurisdictionRefs.length) fail('E_TRANSITION_MIXED:' + id)
        equal(mapping.current, row, 'E_TRANSITION_MIXED:' + id)
      } else if (mapping.disposition === 'approved-nonowning') {
        if (set === 'grants') fail('E_TRANSITION_NEW_GRANT:' + id)
        row = requireObject(mapping.current, 'E_TRANSITION_SUCCESSOR:' + id)
        for (const field of ['holderPersonId', 'stateId', 'directLiegePersonId']) {
          if (Object.hasOwn(original, field) && row[field] !== original[field]) fail('E_TRANSITION_IDENTITY:' + id)
        }
      } else fail('E_TRANSITION_DISPOSITION:' + id)
      if (mapping.currentId !== identity(set, row)) fail('E_TRANSITION_KEY:' + id)
      rows.push(row)
    }
    if (new Set(rows.map(row => identity(set, row))).size !== rows.length) fail('E_TRANSITION_DUPLICATE:' + set)
    if (set === 'holdings') expected.existing.holdings = rows
    else expected.allocation[set] = rows
  }
  expected.existing.polities = transition.polities
  expected.allocation.politicalIdentities = retiredTitles.map(title => ({
    id: title.id, kind: 'nonterritorial-political-identity', rank: title.rank,
    holderPersonId: title.holderPersonId, stateId: title.stateId,
    politicalParentTitleId: title.parentTitleId ?? null,
    personalLieges: historical.allocation.grants.filter(grant => grant.titleId === title.id)
      .map(grant => ({ holdingId: grant.id, directLiegePersonId: grant.directLiegePersonId })),
    directOwnership: false,
  }))
  equal(current.existing, expected.existing, 'E_TRANSITION_CURRENT_EXISTING')
  equal(current.allocation, expected.allocation, 'E_TRANSITION_CURRENT_ALLOCATION')
  equal(current.people, historical.people, 'E_TRANSITION_PEOPLE')
  if (current.control.assignments.length || (current.outside.islands ?? []).length) fail('E_TRANSITION_CURRENT_OUTSIDE_CONTROL')
  for (const row of [...current.allocation.titles, ...current.allocation.grants, ...current.existing.holdings]) {
    if ((row.jurisdictionRefs ?? []).some(ref => !seoulIds.has(ref))
      || (row.adminRefs ?? []).some(ref => !seoulIds.has(ref.id))
      || (row.componentRefs ?? []).length || row.geometrySource === 'outside-admin-units.units') fail('E_TRANSITION_CURRENT_OUTSIDE_RIGHT:' + row.id)
  }
  return historicalProjection.summary
}

export function projectHistoricalOpeningFeudalAllocation(args) {
  if (args?.geographicScale !== undefined) fail('E_HISTORICAL_SCALE_SCHEMA')
  return projectRightsAllocation(args, buildScaleRows(args?.scale))
}

export function projectOpeningFeudalAllocation(args) {
  if (args?.scale !== undefined) fail('E_GEOGRAPHIC_SCALE_SCHEMA')
  const geographic = buildGeographicIndex(args?.geographicScale)
  return projectRightsAllocation(args, null, geographic)
}

function projectRightsAllocation(args, historicalScaleRows, geographic = null) {
  const { allocation, existing, people, seoul, outside, control, affiliation } = requireObject(args, 'E_ARGS_SHAPE')
  if (args.consolidationTransition !== undefined) {
    if (composedTransitions.get(args.consolidationTransition)?.digest !== rightsDigest(args)) fail('E_CONSOLIDATION_COMPOSITION')
  } else if (args.rightsTransition !== undefined) validateApprovedRightsTransition(args, args.historicalRights, args.rightsTransition)
  else if (allocation?.politicalIdentities !== undefined && !historicalScaleRows) fail('E_TRANSITION_REQUIRED')
  requireObject(allocation, 'E_ALLOCATION_SHAPE')
  if (allocation.schema !== OPENING_FEUDAL_ALLOCATION_SCHEMA) fail('E_ALLOCATION_SCHEMA:' + allocation.schema)
  requireObject(existing, 'E_EXISTING_SHAPE')
  if (existing.schema !== EXISTING_LEDGER_SCHEMA) fail('E_EXISTING_SCHEMA:' + existing.schema)
  requireArray(existing.holdings, 'E_EXISTING_SHAPE')

  const ctx = {
    existing,
    geographic,
    geographicTitles: composedTransitions.get(args.consolidationTransition)?.geographicTitles,
    historicalScaleRows,
    nonowningRights: buildNonowningRights(args.nonowningRights),
    peopleById: buildPeopleIndex(people),
    membership: buildHegemonMembership(affiliation),
    geometry: buildGeometry(seoul, outside),
    landless: buildLandlessPeople(existing),
    existingHoldingIds: new Set(existing.holdings.map(holding => requireString(holding.id, 'E_EXISTING_SHAPE'))),
  }
  ctx.control = buildControl(control, ctx.geometry)
  ctx.titlesById = validateTitles(allocation, ctx)
  validateExistingNonowningRights(ctx)
  ctx.grants = validateGrants(allocation, ctx)
  const bindings = validateBindings(allocation, ctx)
  checkCoverage(ctx)

  const output = structuredClone(existing)
  for (const binding of bindings) {
    const holding = output.holdings.find(row => row.id === binding.holdingId)
    holding.titleId = binding.titleId
    const title = ctx.titlesById.get(binding.titleId)
    const parentId = title.kind === 'superior-jurisdiction' ? title.politicalParentTitleId : title.parentTitleId
    const parent = parentId ? ctx.titlesById.get(parentId) : null
    if (holding.directLiegePersonId && parent?.holderPersonId !== holding.directLiegePersonId) {
      holding.liegeRelationshipKind = binding.liegeRelationshipKind
    }
  }
  for (const grant of ctx.grants) output.holdings.push(structuredClone(grant))
  output.titles = structuredClone(allocation.titles)
  if (allocation.politicalIdentities) output.politicalIdentities = structuredClone(allocation.politicalIdentities)
  output.summary = {
    existingHoldings: existing.holdings.length,
    newGrants: ctx.grants.length,
    holdings: output.holdings.length,
    titles: allocation.titles.length,
    existingTitleBindings: bindings.length,
    heldSeoulRegions: ctx.geometry.heldRegionIds.size,
    heldOutsideUnits: ctx.control.wholeHeld.size,
    heldComponents: ctx.geometry.heldComponentKeys.size,
    unassignedComponents: ctx.geometry.componentByKey.size - ctx.geometry.heldComponentKeys.size,
    coveredEntitlements: ctx.coveredEntitlements,
  }
  return output
}
