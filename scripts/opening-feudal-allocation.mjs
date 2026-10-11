// 개막 봉건 영지 배분 검증·투영 (opening-feudal-allocation.v1)
// 검증과 결과 조립만 담당한다. JSON 원장 작성·생성기·UI 투영은 상위 소유다.
// 모든 점유·규모 판정은 호출자가 넘긴 control/outside/scale 입력의 현재 상태만 따른다.
// 어떤 지역 수·요소 수도 이 모듈에 두지 않는다.

const RANK_WEIGHT = { barony: 1, duchy: 2, kingdom: 3 }
export const OPENING_FEUDAL_ALLOCATION_SCHEMA = 'opening-feudal-allocation.v1'
const EXISTING_LEDGER_SCHEMA = 'confirmed-person-holdings.v1'
const KING_DIRECT_SAMEHOLDER_DUCHY_CAP = 2

const fail = message => { throw new Error(message) }

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

function buildLandlessPeople(existing) {
  const landless = new Set()
  for (const row of requireArray(existing.openingDispositions ?? [], 'E_EXISTING_SHAPE')) {
    requireObject(row, 'E_EXISTING_SHAPE')
    if (row.status !== 'personal-landless') fail('E_EXISTING_DISPOSITION:' + row.personId)
    landless.add(requireString(row.personId, 'E_EXISTING_SHAPE'))
  }
  return landless
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
    if (title.parentTitleId == null) continue
    if (!byId.has(title.parentTitleId)) fail('E_TITLE_PARENT:' + title.id + '|' + title.parentTitleId)
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
        const row = ctx.scaleRows.get(ref.id)
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
    if (holding.holderPersonId !== title.holderPersonId) fail('E_BINDING_HOLDER:' + holdingId)
    const parent = title.parentTitleId ? ctx.titlesById.get(title.parentTitleId) : null
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

export function projectOpeningFeudalAllocation(args) {
  const { allocation, existing, people, seoul, outside, control, affiliation, scale } = requireObject(args, 'E_ARGS_SHAPE')
  requireObject(allocation, 'E_ALLOCATION_SHAPE')
  if (allocation.schema !== OPENING_FEUDAL_ALLOCATION_SCHEMA) fail('E_ALLOCATION_SCHEMA:' + allocation.schema)
  requireObject(existing, 'E_EXISTING_SHAPE')
  if (existing.schema !== EXISTING_LEDGER_SCHEMA) fail('E_EXISTING_SCHEMA:' + existing.schema)
  requireArray(existing.holdings, 'E_EXISTING_SHAPE')

  const ctx = {
    existing,
    peopleById: buildPeopleIndex(people),
    membership: buildHegemonMembership(affiliation),
    geometry: buildGeometry(seoul, outside),
    landless: buildLandlessPeople(existing),
    existingHoldingIds: new Set(existing.holdings.map(holding => requireString(holding.id, 'E_EXISTING_SHAPE'))),
  }
  ctx.control = buildControl(control, ctx.geometry)
  ctx.scaleRows = buildScaleRows(scale)
  ctx.titlesById = validateTitles(allocation, ctx)
  ctx.grants = validateGrants(allocation, ctx)
  const bindings = validateBindings(allocation, ctx)
  checkCoverage(ctx)

  const output = structuredClone(existing)
  for (const binding of bindings) {
    const holding = output.holdings.find(row => row.id === binding.holdingId)
    holding.titleId = binding.titleId
    const title = ctx.titlesById.get(binding.titleId)
    const parent = title.parentTitleId ? ctx.titlesById.get(title.parentTitleId) : null
    if (holding.directLiegePersonId && parent?.holderPersonId !== holding.directLiegePersonId) {
      holding.liegeRelationshipKind = binding.liegeRelationshipKind
    }
  }
  for (const grant of ctx.grants) output.holdings.push(structuredClone(grant))
  output.titles = structuredClone(allocation.titles)
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
