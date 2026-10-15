// 개막 봉건 영지 배분 준비기 (결정적·읽기 전용)
// 원천 JSON을 읽어 개막 배분 결정(allocation + proposedAppointments)을 stdout으로 출력한다.
// 파일 쓰기는 하지 않고, 실제 검증 모듈 ./opening-feudal-allocation.mjs로 자가 검증한다.
// 지역 수·요소 수를 하드코딩하지 않는다: 모든 수는 입력 데이터에서 계산된다.
//
// 승인 결정(2026-10-11 사용자 인터뷰):
// - 왕국 루트: 규격맹 K029/S02, 대한민국정부 K144/S06, 종교 연합 K423/S04, 대전선 K1008/polity:daejeon
// - 중립 S08은 왕을 새로 만들지 않고 소vereign 공작 루트(보유자는 원천의 실제 인물로 확인)
// - 기존 25권리 보존, 면적 보유만 작위 결속(지점 18건은 선택), 무토지 3인 수여 금지
// - 분할 섬 요소 전부를 island-occupation 개막 결정 귀속 국가로 투영하고,
//   승인된 해상 3영주(K151/K176/K355)에 componentRef로만 수여(jurisdictionRefs는 빈 배열)
// - 작위 계층은 공개 행정 규모(comparisonScale)를 따른다:
//   서울·인천·대전 구=공작, 일반 광역시 구=남작(상위 시 공작 아래), 동/읍면동은 잎(작위 없음)
// - 보유자 선정: 결정적 점수(지역 단어 → 토지책임 → 지역 대표 → 지도자 → 보급),
//   이전 공작 수 최소, 최종 ID 순. 사망·실종·전직 표지가 공개 상세에 없어 미성년(minors)만 배제한다.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projectOpeningFeudalAllocation } from './opening-feudal-allocation.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))

// ── 승인된 개막 결정 상수 ──────────────────────────────────────────────
const KINGDOM_ROOTS = [
  { titleId: 'title:kingdom-s02', name: '규격맹 왕국', stateId: 'S02', holderPersonId: 'K029',
    realmName: '규격맹', basis: '개막 왕국 루트 결정(2026-10-11 사용자 승인)' },
  { titleId: 'title:kingdom-s06', name: '대한민국정부 왕국', stateId: 'S06', holderPersonId: 'K144',
    realmName: '대한민국정부', basis: '개막 왕국 루트 결정(2026-10-11 사용자 승인)' },
  { titleId: 'title:kingdom-s04', name: '종교 연합 왕국', stateId: 'S04', holderPersonId: 'K423',
    realmName: '종교 연합', basis: 'owner:call_3UEeOQxXrDzuYt8E1BFfhRqe:religious_title_root 승인(정치 종류는 연합 유지)' },
  { titleId: 'title:kingdom-daejeon', name: '대전선', stateId: 'polity:daejeon', holderPersonId: 'K1008',
    realmName: '대전', basis: '기존 대전 왕정 공식 작위(ConfirmedHolding polities)와 owner:call_M9laK9tNaQJ4r1j5y9FFQnVL:daejeon_office_promotions 승인' },
]
const NEUTRAL_DUCHY_ROOT = { titleId: 'title:duchy-s08', stateId: 'S08' }
const CAPITAL_ROYAL_DUCHIES = [
  { kingdomTitleId: 'title:kingdom-s06', kingPersonId: 'K144', stateId: 'S06', stationId: '광화문' },
  { kingdomTitleId: 'title:kingdom-s04', kingPersonId: 'K423', stateId: 'S04', stationId: '삼성' },
  { kingdomTitleId: 'title:kingdom-s02', kingPersonId: 'K029', stateId: 'S02', stationId: '구로' },
]
// 승인된 해상 3영주: 분할 섬 단위를 행정 단위명으로 묶는다(요소 수는 데이터에서 계산).
const SEA_GRANT_DECISIONS = [
  { holderPersonId: 'K151', name: '강화 외곽·백령대청 해상 남작령', grantName: '강화 외곽·백령대청 해상 직영지',
    unitNames: ['영종동', '용유동', '삼산면', '서도면', '백령면', '대청면'],
    basis: 'owner:call_wFGQ0sW3jxjHivoeN4XA1oom:sea_vassal_named_appointments 승인' },
  { holderPersonId: 'K176', name: '연평·장봉·덕적 해상 남작령', grantName: '연평·장봉·덕적 해상 직영지',
    unitNames: ['연평면', '북도면', '덕적면'],
    basis: 'owner:call_wFGQ0sW3jxjHivoeN4XA1oom:sea_vassal_named_appointments 승인' },
  { holderPersonId: 'K355', name: '자월·영흥·측도 해상 남작령', grantName: '자월·영흥·측도 해상 직영지',
    unitNames: ['자월면', '영흥면'],
    basis: 'owner:call_wFGQ0sW3jxjHivoeN4XA1oom:sea_vassal_named_appointments 승인' },
]
const GOVERNMENT_SEA_STATE_ID = 'S06' // outside-island-occupation openingDecision 귀속 국가
// 신규 보유자 T5→T3 공직 제안 승인 출처(상위 세션에서 승인된 인터뷰 call).
const NEW_HOLDER_APPOINTMENT_APPROVAL_REF = 'owner:call_gMDk9yvmIRgdTMDQr7gsDWIT:new_holder_land_appointments'
// 보유자 후보 역할 점수 어휘(공개 상세 title·position·occupation 텍스트 기준)
const ROLE_KEYWORDS = {
  land: ['영주', '영지', '성주', '거점', '관할', '주둔', '방어', '사령', '총독', '수비', '개척'],
  representative: ['대표', '수장', '원장', '구청장', '군수', '면장', '시장', '회장', '단장', '의장'],
  leader: ['지도자', '책임', '리더', '수석', '선임', '위원장'],
  logistics: ['보급', '물자', '배급', '물류', '수송', '운송', '창고', '유통', '저장', '호송'],
}
const ROLE_SCORE = { land: 100, representative: 40, leader: 20, logistics: 10 }
const LOCALITY_SCORE = 1000

// ── 원천 적재 ──────────────────────────────────────────────────────────
const existing = readJson('lore/relations/personal-holdings.json')
const openingTerritories = readJson('public/opening-territories.json')
const outsideAdminUnits = readJson('public/outside-admin-units.json')
const control = readJson('public/outside-control-2126.json')
const adminScale = readJson('public/admin-territorial-scale.json')
const islandOccupation = readJson('lore/regions/outside-island-occupation.json')
const personDetails = fs.readdirSync(path.join(ROOT, 'public/person-details'))
  .filter(file => file.endsWith('.json'))
  .map(file => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/person-details', file), 'utf8')))

const fail = message => { throw new Error(message) }
const slug = value => String(value).replace(/[^0-9A-Za-z-]+/g, '-').replace(/^-+|-+$/g, '')
const stateSlug = stateId => slug(stateId)
const compareBy = key => (a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0)

// 검증 모듈 입력: 사람(기본 필드)·서울·바깥(분할 섬 요소는 개막 결정 귀속으로 투영).
const people = personDetails
  .map(person => ({ id: person.characterId, name: person.name, state: person.state,
    commonTier: person.commonTier, minors: person.minors === true,
    position: person.position, rank: person.rank,
    roleText: [person.title, person.position, person.occupation].filter(Boolean).join(' ') }))
  .sort(compareBy('id'))
const peopleById = new Map(people.map(person => [person.id, person]))
const landless = new Set((existing.openingDispositions ?? [])
  .filter(row => row.status === 'personal-landless').map(row => row.personId))

const seoul = {
  regions: openingTerritories.regions
    .map(({ id, name, polities }) => ({ id, name, polities: polities ?? [] }))
    .sort(compareBy('id')),
}
const openingDecisionAuthority = islandOccupation.openingDecision?.authority
if (!openingDecisionAuthority?.stateId) fail('섬 개막 결정 귀속 국가가 원천에 없다')
const projectedIslands = islandOccupation.units.map(island => ({
  unitId: island.unitId,
  components: island.components.map(component => ({
    componentIndex: component.componentIndex,
    authority: component.authority ?? openingDecisionAuthority,
  })),
})).sort(compareBy('unitId'))
const outside = {
  units: outsideAdminUnits.units.map(({ id, name }) => ({ id, name })).sort(compareBy('id')),
  islands: projectedIslands,
}
const affiliation = { hegemons: openingTerritories.hegemons }

// ── 색인 ──────────────────────────────────────────────────────────────
const scaleById = new Map(adminScale.rows.map(row => [row.adminId, row]))
const unitById = new Map(outsideAdminUnits.units.map(unit => [unit.id, unit]))
const regionById = new Map(openingTerritories.regions.map(region => [region.id, region]))
const controlByUnit = new Map(control.assignments.map(assignment => [assignment.unitId, assignment]))
const stateNameById = new Map(openingTerritories.states.map(state => [state.id, state.name]))
const hegemonByRealmName = new Map(affiliation.hegemons.map(hegemon => [hegemon.name, hegemon]))
const realmNameOfState = new Map()
for (const hegemon of affiliation.hegemons) {
  for (const memberStateId of hegemon.memberStateIds) realmNameOfState.set(memberStateId, hegemon.name)
}
const kingdomByStateId = new Map(KINGDOM_ROOTS.map(root => [root.stateId, root]))
const kingdomTitleIdOfRealm = new Map(KINGDOM_ROOTS.map(root => [root.realmName, root.titleId]))
const stateName = stateId => stateNameById.get(stateId)
  ?? (stateId === 'polity:daejeon' ? '대전' : fail('알 수 없는 국가 ID: ' + stateId))

// ── 잎 수집: 점유 서울 동 + 바깥 전체 점유 단위 (분할 단위 제외) ──────────
const splitUnitIds = new Set(projectedIslands.map(island => island.unitId))
const leaves = [] // { id, name, stateId, duchyGroup, baronyGroup|null }
for (const region of seoul.regions) {
  if (!region.polities.length) continue
  const adminId = region.id.replace(/^region:/, '')
  const row = scaleById.get(adminId)
  if (!row) fail('서울 동 행정 규모 행 누락: ' + region.id)
  const parentRow = row.parentAdminId ? scaleById.get(row.parentAdminId) : null
  let duchyGroup = row.parentAdminId
  let baronyGroup = null
  if (parentRow && parentRow.type === 'district' && parentRow.comparisonScale === 'barony') {
    // 일반 광역시 일반 구: 시 공작 아래 남작
    baronyGroup = parentRow.adminId
    duchyGroup = parentRow.parentAdminId
  }
  leaves.push({ id: region.id, name: region.name, stateId: region.polities[0], duchyGroup, baronyGroup })
}
for (const unit of outside.units) {
  if (splitUnitIds.has(unit.id)) continue
  const authority = controlByUnit.get(unit.id)?.authority
  if (!authority) continue // 미배정: 수여하지 않는다
  let stateId
  if (authority.kind === 'state') stateId = authority.stateId
  else if (authority.kind === 'union' || authority.kind === 'neutral') {
    const kingdom = KINGDOM_ROOTS.find(root => root.realmName === authority.name)
    if (!kingdom) fail('권위를 왕국 루트로 환원할 수 없다: ' + authority.name)
    stateId = kingdom.stateId
  } else fail('알 수 없는 권위 종류: ' + authority.kind)
  const row = scaleById.get(unit.id)
  if (!row) fail('바깥 단위 행정 규모 행 누락: ' + unit.id)
  const parentRow = row.parentAdminId ? scaleById.get(row.parentAdminId) : null
  let duchyGroup = row.parentAdminId
  let baronyGroup = null
  if (parentRow && parentRow.type === 'district' && parentRow.comparisonScale === 'barony') {
    baronyGroup = parentRow.adminId
    duchyGroup = parentRow.parentAdminId
  }
  leaves.push({ id: unit.id, name: unit.name, stateId, duchyGroup, baronyGroup })
}

// ── (그룹, 국가) 조각 ─────────────────────────────────────────────────
const sliceKey = (group, stateId) => group + '|' + stateId
const slices = new Map() // key → { group, stateId, kind, duchyGroup|null, leaves: [] }
function addLeafToSlice(group, stateId, leaf, kind, duchyGroup) {
  const groupRow = scaleById.get(group)
  if (!groupRow) fail('그룹 행정 규모 행 누락: ' + group)
  // 공작 그룹은 구조(city·county·일반 구)로, 남작 그룹은 공개 규모 등급(comparisonScale=barony)으로 판정한다.
  if (kind === 'barony') {
    if (groupRow.type !== 'district' || groupRow.comparisonScale !== 'barony') {
      fail('남작 그룹 등급 불일치: ' + group + ' type=' + groupRow.type + ' comparisonScale=' + groupRow.comparisonScale)
    }
  } else {
    const structural = ['city', 'county', 'district'].includes(groupRow.type)
    if (!structural || (groupRow.type === 'district' && groupRow.comparisonScale !== 'duchy')) {
      fail('공작 그룹 등급 불일치: ' + group + ' type=' + groupRow.type + ' comparisonScale=' + groupRow.comparisonScale)
    }
  }
  const key = sliceKey(group, stateId)
  if (!slices.has(key)) slices.set(key, { group, stateId, kind, duchyGroup, leaves: [] })
  slices.get(key).leaves.push(leaf)
}
for (const leaf of leaves) {
  // 중립 S08은 하위 작위 조각을 만들지 않고 중립 공작 루트 직영으로 둔다.
  if (leaf.stateId === NEUTRAL_DUCHY_ROOT.stateId) continue
  addLeafToSlice(leaf.duchyGroup, leaf.stateId, leaf, 'duchy', null)
  if (leaf.baronyGroup) addLeafToSlice(leaf.baronyGroup, leaf.stateId, leaf, 'barony', leaf.duchyGroup)
}

// 그룹 표시명: context 마지막 세그먼트에서 상위 단위 접두어를 제거한다.
function localNameOfGroup(group) {
  const row = scaleById.get(group)
  let name = row.context.split('/').pop()
  const parentRow = row.parentAdminId ? scaleById.get(row.parentAdminId) : null
  if (parentRow) {
    const parentLocal = parentRow.context.split('/').pop()
    if (name.startsWith(parentLocal) && name !== parentLocal) name = name.slice(parentLocal.length)
  }
  return name
}

// 기존 면적 보유 → 조각 덮음 판정(전체=공작 결속, 부분=남작 결속)
const sliceOfLeafId = new Map(leaves.map(leaf => [leaf.id, leaf]))
const existingClaims = [] // { holding, sliceKey, refIds }
for (const holding of existing.holdings) {
  const refs = holding.adminRefs ?? []
  if (!refs.length) continue
  const keys = new Set()
  for (const ref of refs) {
    const leaf = sliceOfLeafId.get(ref.id)
    if (!leaf) fail('기존 보유 ref가 점유 잎 목록에 없다: ' + ref.id)
    keys.add(sliceKey(leaf.duchyGroup, leaf.stateId))
  }
  if (keys.size !== 1) fail('기존 면적 보유가 여러 조각에 걼친다: ' + holding.id)
  existingClaims.push({ holding, sliceKey: [...keys][0], refIds: refs.map(ref => ref.id) })
}
const fullBoundSlice = new Map() // sliceKey → holding (조각 전체 덮음)
const partialBoundHoldings = [] // { holding, sliceKey }
for (const claim of existingClaims) {
  const slice = slices.get(claim.sliceKey)
  if (!slice) fail('기존 보유의 조각이 없다: ' + claim.holding.id)
  if (slice.kind !== 'duchy') fail('기존 보유가 남작 조각에 걸린다: ' + claim.holding.id)
  if (claim.refIds.length === slice.leaves.length) fullBoundSlice.set(claim.sliceKey, claim.holding)
  else partialBoundHoldings.push(claim)
}

// ── 작위·수여 조립 ────────────────────────────────────────────────────
const titles = []
const grants = []
const existingTitleBindings = []
const proposedAppointments = []
const assignedDuchies = new Map() // personId → 신규 선정 공작 수

function kingdomTitleIdForState(stateId) {
  if (kingdomByStateId.has(stateId)) return kingdomByStateId.get(stateId).titleId
  const realmName = realmNameOfState.get(stateId)
  const titleId = realmName ? kingdomTitleIdOfRealm.get(realmName) : null
  if (!titleId) fail('국가 ' + stateId + '의 왕국 루트를 찾을 수 없다')
  return titleId
}

// 왕국·중립 루트 작위
for (const root of KINGDOM_ROOTS) {
  const realm = hegemonByRealmName.get(root.realmName)
  const realmStateIds = realm ? realm.memberStateIds : [root.stateId]
  const jurisdictionRefs = leaves.filter(leaf => realmStateIds.includes(leaf.stateId)).map(leaf => leaf.id).sort()
  if (!jurisdictionRefs.length) fail('왕국 관할이 비었다: ' + root.titleId)
  titles.push({ id: root.titleId, name: root.name, rank: 'kingdom', holderPersonId: root.holderPersonId,
    stateId: root.stateId, parentTitleId: null, jurisdictionRefs, basis: root.basis })
}
{
  const neutralLeaves = leaves.filter(leaf => leaf.stateId === NEUTRAL_DUCHY_ROOT.stateId)
  if (!neutralLeaves.length) fail('중립 S08 점유 동이 없어 공작 루트를 두지 않는다')
  const holder = peopleById.get('K194')
  if (!holder || holder.state !== NEUTRAL_DUCHY_ROOT.stateId) {
    fail('중립 공작 루트 후보 K194가 S08 소속으로 원천에 없다')
  }
  titles.push({ id: NEUTRAL_DUCHY_ROOT.titleId, name: stateName(NEUTRAL_DUCHY_ROOT.stateId) + ' 공작령',
    rank: 'duchy', holderPersonId: holder.id, stateId: NEUTRAL_DUCHY_ROOT.stateId, parentTitleId: null,
    jurisdictionRefs: neutralLeaves.map(leaf => leaf.id).sort(),
    basis: '중립 국가는 왕을 새로 만들지 않는다(2026-10-11 사용자 승인)' })
}

// 왕국 직속 수도 공작: 수도역 표면 정치권이 같은 왕의 국가일 때만(왕국당 최대 1).
const royalSliceHolder = new Map() // sliceKey → kingPersonId
{
  const stationById = new Map(openingTerritories.stations.map(station => [station.id, station]))
  const findStation = stationId => stationById.get(stationId)
    ?? stationById.get(stationId + '역')
    ?? [...stationById.values()].filter(station => station.id.startsWith(stationId)).sort(compareBy('id'))[0]
  for (const royal of CAPITAL_ROYAL_DUCHIES) {
    const station = findStation(royal.stationId)
    if (!station || !station.surfacePolityIds?.includes(royal.stateId)) continue
    // 표면 동이 있으면 그 구를, 없으면 역 지정 구(구 행정 규모 행)를 앵커로 쓴다.
    const surfaceRegionId = station.control?.surfaceRegionId ?? station.surfaceRegionId ?? null
    let adminRow = surfaceRegionId ? scaleById.get(surfaceRegionId.replace(/^region:/, '')) : null
    if (!adminRow && station.district) {
      adminRow = adminScale.rows.find(row => row.type === 'district' && row.parentAdminId === '11'
        && row.context.endsWith('/' + station.district)) ?? null
    }
    if (!adminRow) continue
    const guAdminId = adminRow.type === 'district' ? adminRow.adminId : adminRow.parentAdminId
    royalSliceHolder.set(sliceKey(guAdminId, royal.stateId), royal.kingPersonId)
  }
  for (const claim of partialBoundHoldings) {
    if (claim.holding.directLiegePersonId === null) royalSliceHolder.set(claim.sliceKey, claim.holding.holderPersonId)
  }
}

// 신규 보유자 선정(결정적)
function sliceLocalityWords(slice) {
  const full = localNameOfGroup(slice.group)
  const words = new Set()
  for (const word of [full, full.replace(/(구|시|군)$/, '')]) if (word && word.length >= 2) words.add(word)
  return [...words]
}
function scoreCandidate(person, localityWords) {
  let score = 0
  if (localityWords.some(word => person.roleText.includes(word))) score += LOCALITY_SCORE
  for (const [family, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(keyword => person.roleText.includes(keyword))) score += ROLE_SCORE[family]
  }
  return score
}
const crownHolders = new Set([...KINGDOM_ROOTS.map(root => root.holderPersonId), 'K194'])
function eligibleCandidates(preferredStateId) {
  const inState = people.filter(person => person.state === preferredStateId
    && !person.minors && !landless.has(person.id) && !crownHolders.has(person.id))
  if (inState.length) return inState
  const realmName = realmNameOfState.get(preferredStateId)
  return people.filter(person => realmNameOfState.get(person.state) === realmName
    && !person.minors && !landless.has(person.id) && !crownHolders.has(person.id))
}
function selectHolder(slice) {
  const localityWords = sliceLocalityWords(slice)
  const pool = eligibleCandidates(slice.stateId)
  if (!pool.length) fail('보유자 후보가 없다: ' + slice.group + '|' + slice.stateId)
  let best = null
  for (const person of pool) {
    const candidate = { person, local: localityWords.some(word => person.roleText.includes(word)), score: scoreCandidate(person, localityWords),
      duchies: assignedDuchies.get(person.id) ?? 0 }
    const better = !best
      || Number(candidate.local) > Number(best.local)
      || (candidate.local === best.local && candidate.duchies < best.duchies)
      || (candidate.local === best.local && candidate.duchies === best.duchies && candidate.score > best.score)
      || (candidate.local === best.local && candidate.score === best.score && candidate.duchies === best.duchies
        && candidate.person.id < best.person.id)
    if (better) best = candidate
  }
  return best.person
}

const titleIdOfSlice = slice => `title:${slice.kind}-${slug(slice.group)}-${stateSlug(slice.stateId)}`
function sliceDisplayName(slice) {
  const local = localNameOfGroup(slice.group)
  const multiState = [...slices.values()].some(row => row.group === slice.group && row.stateId !== slice.stateId)
  const rankSuffix = slice.kind === 'duchy' ? '공작령' : '남작령'
  return multiState ? `${local} ${stateName(slice.stateId)} ${rankSuffix}` : `${local} ${rankSuffix}`
}

const sliceTitle = new Map() // sliceKey → title
const sortedSlices = [...slices.values()].sort((a, b) =>
  a.group < b.group ? -1 : a.group > b.group ? 1 : a.stateId < b.stateId ? -1 : 1)
for (const slice of sortedSlices) {
  const key = sliceKey(slice.group, slice.stateId)
  let parentTitleId
  if (slice.kind === 'barony') {
    parentTitleId = sliceTitle.get(sliceKey(slice.duchyGroup, slice.stateId))?.id
    if (!parentTitleId) fail('남작 조각의 상위 공작이 없다: ' + key)
  } else {
    parentTitleId = kingdomTitleIdForState(slice.stateId)
  }
  const jurisdictionRefs = slice.leaves.map(leaf => leaf.id).sort()
  const title = { id: titleIdOfSlice(slice), name: sliceDisplayName(slice), rank: slice.kind }
  if (fullBoundSlice.has(key)) {
    const holding = fullBoundSlice.get(key)
    title.holderPersonId = holding.holderPersonId
    title.basis = `기존 보유 권리 결속: ${holding.id}`
    existingTitleBindings.push({ holdingId: holding.id, titleId: title.id })
  } else if (royalSliceHolder.has(key)) {
    title.holderPersonId = royalSliceHolder.get(key)
    title.basis = '개막 수도 직할 공작 결정(왕급 직속 최대 둘 중 하나)'
  } else {
    const holder = selectHolder(slice)
    title.holderPersonId = holder.id
    title.basis = `개막 행정 규모 그룹 ${slice.group}(${slice.kind}) 배분 · 결정적 후보 선정`
    if (slice.kind === 'duchy') assignedDuchies.set(holder.id, (assignedDuchies.get(holder.id) ?? 0) + 1)
    if (holder.commonTier === 'T5' && !proposedAppointments.some(appointment => appointment.personId === holder.id)) {
      proposedAppointments.push({
        personId: holder.id, stateId: holder.state,
        position: { ko: `${holder.position} · ${localNameOfGroup(slice.group)} 영주`, en: `Territorial lord of ${localNameOfGroup(slice.group)}` },
        rank: { ko: '영주', en: 'Territorial lord' },
        commonTier: 'T3', approvalRef: NEW_HOLDER_APPOINTMENT_APPROVAL_REF,
      })
    }
  }
  title.stateId = slice.stateId
  title.parentTitleId = parentTitleId
  title.jurisdictionRefs = jurisdictionRefs
  titles.push(title)
  sliceTitle.set(key, title)
}

// 부분 결속(예: 양평2동): 조각 공작 아래 남작 작위로 기존 권리를 결속한다.
for (const claim of partialBoundHoldings) {
  const slice = slices.get(claim.sliceKey)
  const parentTitle = sliceTitle.get(claim.sliceKey)
  if (!parentTitle) fail('부분 결속 상위 공작이 없다: ' + claim.sliceKey)
  const title = {
    id: `title:barony-${slug(claim.holding.id)}-${stateSlug(slice.stateId)}`,
    name: `${claim.refIds.map(refId => sliceOfLeafId.get(refId).name).join('·')} 남작령`,
    rank: 'barony', holderPersonId: claim.holding.holderPersonId, stateId: slice.stateId,
    parentTitleId: parentTitle.id, jurisdictionRefs: [...claim.refIds].sort(),
    basis: `기존 보유 권리 결속(부분): ${claim.holding.id}`,
  }
  titles.push(title)
  existingTitleBindings.push({ holdingId: claim.holding.id, titleId: title.id })
}

// 해상 남작 3 결정: 분할 섬 요소 전부를 componentRef로만 수여(jurisdictionRefs는 빈 배열).
const seaGrants = []
{
  const splitUnitsByLocalName = new Map()
  for (const island of projectedIslands) {
    const unit = unitById.get(island.unitId)
    if (!unit) fail('분할 단위 도형 누락: ' + island.unitId)
    splitUnitsByLocalName.set(unit.name.split(/\s+/).pop(), island)
  }
  for (const decision of SEA_GRANT_DECISIONS) {
    const matched = decision.unitNames.map(unitName => {
      const island = splitUnitsByLocalName.get(unitName)
      if (!island) fail('해상 결정 단위명이 분할 섬 원천에 없다: ' + unitName)
      return island
    })
    const componentRefs = matched
      .flatMap(island => island.components.map(component => ({
        unitId: island.unitId, componentIndex: component.componentIndex })))
      .sort((a, b) => a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : a.componentIndex - b.componentIndex)
    if (!componentRefs.length) fail('해상 결정에 요소가 없다: ' + decision.name)
    titles.push({
      id: `title:barony-${slug(decision.holderPersonId)}-sea`, name: decision.name, rank: 'barony',
      holderPersonId: decision.holderPersonId, stateId: GOVERNMENT_SEA_STATE_ID,
      parentTitleId: kingdomTitleIdForState(GOVERNMENT_SEA_STATE_ID), jurisdictionRefs: [],
      basis: decision.basis + ' (분할 단위는 componentRef로만 수여)',
    })
    seaGrants.push({
      id: `holding:sea-${slug(decision.holderPersonId)}`, name: { ko: decision.grantName },
      holderPersonId: decision.holderPersonId,
      directLiegePersonId: kingdomByStateId.get(GOVERNMENT_SEA_STATE_ID).holderPersonId,
      stateId: GOVERNMENT_SEA_STATE_ID, adminRefs: [], componentRefs,
      titleId: `title:barony-${slug(decision.holderPersonId)}-sea`,
      geometrySource: 'lore/regions/outside-island-occupation.json',
      territorialScale: null, formalTitleRank: 'barony',
    })
  }
}

// 신규 직영지: 남는 잎이 있는 조각마다 하나씩(작위 보유자 본인 직영).
for (const slice of sortedSlices) {
  const title = sliceTitle.get(sliceKey(slice.group, slice.stateId))
  if (!title) continue
  const claimed = new Set(existingClaims.filter(claim => claim.sliceKey === sliceKey(slice.group, slice.stateId))
    .flatMap(claim => claim.refIds))
  // 남작층 잎은 남작 조각 수여로 간다. 공작 직영지는 남작층 밖 남는 잎만 가진다(관할은 전체 유지).
  const unclaimed = slice.leaves.filter(leaf => !claimed.has(leaf.id)
    && !(slice.kind === 'duchy' && leaf.baronyGroup))
  if (!unclaimed.length) continue
  const parentHolder = title.parentTitleId == null ? null
    : titles.find(row => row.id === title.parentTitleId)?.holderPersonId ?? null
  grants.push({
    id: `holding:opening-${slug(title.id.replace(/^title:/, ''))}`,
    name: { ko: `${title.name} 직영지` },
    holderPersonId: title.holderPersonId,
    directLiegePersonId: parentHolder === title.holderPersonId ? null : parentHolder,
    stateId: slice.stateId,
    adminRefs: unclaimed.map(leaf => ({ id: leaf.id, name: leaf.name })).sort(compareBy('id')),
    componentRefs: [],
    titleId: title.id, geometrySource: null, territorialScale: null, formalTitleRank: title.rank,
  })
}
grants.push(...seaGrants)

// 중립 공작 루트 직영지: S08 잎은 조각 없이 루트 직접 수여.
{
  const neutralLeaves = leaves.filter(leaf => leaf.stateId === NEUTRAL_DUCHY_ROOT.stateId)
  if (neutralLeaves.length) {
    grants.push({
      id: 'holding:opening-duchy-s08-demesne', name: { ko: '중앙정보부 공작령 직영지' },
      holderPersonId: peopleById.get('K194').id, directLiegePersonId: null, stateId: NEUTRAL_DUCHY_ROOT.stateId,
      adminRefs: neutralLeaves.map(leaf => ({ id: leaf.id, name: leaf.name })).sort(compareBy('id')),
      componentRefs: [], titleId: NEUTRAL_DUCHY_ROOT.titleId, geometrySource: null,
      territorialScale: null, formalTitleRank: 'duchy',
    })
  }
}

// ── 정렬과 자가 검증 ──────────────────────────────────────────────────
titles.sort(compareBy('id'))
grants.sort(compareBy('id'))
existingTitleBindings.sort(compareBy('holdingId'))
proposedAppointments.sort(compareBy('personId'))

const allocation = { schema: 'opening-feudal-allocation.v1', titles, grants, existingTitleBindings }
// 준비기는 후보 생성용이다. 확정 후에는 정본을 재생성하여 명시 인선을 덮어쓰지 않는다.
const projection = projectOpeningFeudalAllocation({
  allocation, existing, people, seoul, outside, control, affiliation, scale: adminScale,
}) // 통과 못 하면 예외로 실패한다

// ── stdout JSON + stderr 집계표 ───────────────────────────────────────
const counts = {
  titles: titles.length,
  kingdoms: titles.filter(title => title.rank === 'kingdom').length,
  duchies: titles.filter(title => title.rank === 'duchy').length,
  baronies: titles.filter(title => title.rank === 'barony').length,
  grants: grants.length,
  newLandGrants: grants.length - seaGrants.length,
  seaGrants: seaGrants.length,
  seaComponents: seaGrants.reduce((sum, grant) => sum + grant.componentRefs.length, 0),
  existingTitleBindings: existingTitleBindings.length,
  proposedAppointments: proposedAppointments.length,
}
const table = [
  '집계: 작위 ' + counts.titles + ' (왕국 ' + counts.kingdoms + ' · 공작 ' + counts.duchies + ' · 남작 ' + counts.baronies + ')',
  '집계: 신규 직영지 ' + counts.newLandGrants + '건 · 해상 ' + counts.seaGrants + '건(' + counts.seaComponents + '요소)',
  '집계: 기존 권리 결속 ' + counts.existingTitleBindings + '건 · 신규 T5→T3 공직 제안 ' + counts.proposedAppointments + '건',
  '집계: 검증 투영 ' + JSON.stringify(projection.summary),
]
process.stderr.write(table.join('\n') + '\n')
process.stdout.write(JSON.stringify({
  schema: allocation.schema,
  titles, grants, existingTitleBindings, proposedAppointments,
  summary: projection.summary, counts,
}, null, 2) + '\n')
