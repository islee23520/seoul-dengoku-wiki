import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { validateOpeningDispositions } from './personal-holdings.mjs'
import { authenticateNonowningRights, loadApprovedRightsHistory, projectCatalogCurrentHoldings, projectCatalogHoldings, projectCatalogOutsideOccupation, projectPersonHoldings, publicJurisdictionReferences } from './generate-catalog.mjs'
import { projectHistoricalOpeningFeudalAllocation, validateApprovedRightsTransition } from './opening-feudal-allocation.mjs'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPersonDisposition } from './cast-sqlite/person-disposition.mjs'
import { loadCiaFacilityProjection } from './cia-facility-projection-input.mjs'
import { projectCiaFacilityHoldings } from './cia-facility-publication.mjs'

const read = path => path.replace(/^\.\.\//u, '').startsWith('lore/') ? readCanonicalDocument(path.replace(/^\.\.\//u, '')) : JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const publishedRights = current => ({ ...current, titles: publicJurisdictionReferences(current.titles), holdings: publicJurisdictionReferences(current.holdings) })
const activePersonIds = (() => {
  const db = openReadOnly(new URL('../data/canonical/wiki-cast.sqlite', import.meta.url).pathname)
  try { return new Set([...readPersonDisposition(db)].filter(([, row]) => row.status === 'active').map(([id]) => id)) }
  finally { db.close() }
})()
const currentFacilityRights = async predecessor => {
  const { correction } = await loadCiaFacilityProjection(new URL('../', import.meta.url).pathname,
    async path => readFileSync(path))
  return projectCiaFacilityHoldings(predecessor, correction)
}

// Bounded real-consumer replay. Existing map/scale snapshots are inputs, not public acceptance.
async function currentRightsFixture(candidate = false) {
  const people = read('../lore/name-pools/gurps-cast.json').people
  const publishedSeoul = read('../public/opening-territories.json')
  const district = read('../lore/regions/content/11170.json')
  const predecessorControls = new Map(district.regions.map(row => [row.region_id, row.content.territory.holders.map(holder => holder.polity)]))
  const seoul = { ...publishedSeoul, regions: publishedSeoul.regions.map(region => predecessorControls.has(region.id)
    ? { ...region, polities: predecessorControls.get(region.id) } : region) }
  const history = await loadApprovedRightsHistory()
  const geometry = history.historical.outside
  const args = { people, seoul, geographicScale: buildAdminTerritorialScale({
    geographyBytes: readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef'),
    territorialScale: read('../lore/offices/Offices-and-Ranks.json').data.territorialScale,
  }),
    affiliation: read('../lore/factions/Sixteen-States.json').data.currentAffiliation,
    allocation: read('../lore/relations/opening-feudal-allocation.json'), existing: read('../lore/relations/personal-holdings.json'),
    outside: { ...geometry, islands: [] },
    control: await projectCatalogOutsideOccupation(read('../lore/regions/outside-control-2126.json'), geometry, read('../lore/regions/outside-island-occupation.json')),
  }
  if (candidate) {
    args.existing = structuredClone(history.historical.existing)
    args.allocation = structuredClone(history.historical.allocation)
    for (const set of ['titles', 'grants', 'holdings', 'existingTitleBindings']) {
      const source = set === 'holdings' ? args.existing : args.allocation
      source[set] = source[set].flatMap(row => {
        const id = set === 'existingTitleBindings' ? row.holdingId : row.id
        const mapping = history.transition.records.find(item => item.set === set && item.oldId === id)
        return mapping.disposition === 'retired-current' ? [] : [mapping.current ?? row]
      })
    }
    args.existing.polities = history.transition.polities
    args.allocation.politicalIdentities = history.historical.allocation.titles
      .filter(title => history.transition.records.some(row => row.set === 'titles' && row.oldId === title.id && row.disposition === 'retired-current'))
      .map(title => ({ id: title.id, kind: 'nonterritorial-political-identity', rank: title.rank, holderPersonId: title.holderPersonId, stateId: title.stateId,
        politicalParentTitleId: title.parentTitleId ?? null, directOwnership: false,
        personalLieges: history.historical.allocation.grants.filter(grant => grant.titleId === title.id).map(grant => ({ holdingId: grant.id, directLiegePersonId: grant.directLiegePersonId })),
      }))
  }
  return { args, history, context: { issuedById: new Map(people.map(person => [person.id, person])), territoryStates: seoul.states,
    openingTerritories: seoul, projectedLandmarks: seoul.landmarks, stationInteriors: read('../lore/regions/station-interiors.json'),
    seoulGraph: read('../snapshots/build-inputs/SeoulWorldGraph.json'), outsideGeometry: geometry,
    repoRoot: new URL('../', import.meta.url).pathname, geography: read('../lore/regions/seoul-electoral-titles.json'),
  } }
}

test('approved transition candidate validates full original coverage and exact current disposition independently', async () => {
  const { args, context, history } = await currentRightsFixture(true)
  const { geographicScale, ...currentHistoricalArgs } = args
  const historical = { ...currentHistoricalArgs, ...history.historical }
  assert.equal(projectHistoricalOpeningFeudalAllocation(historical).summary.coveredEntitlements, 1939)
  assert.equal(validateApprovedRightsTransition(args, historical, history.transition).coveredEntitlements, 1939)
  const before = structuredClone(args)
  const projected = await projectCatalogCurrentHoldings(args, context)
  assert.deepEqual(args, before)
  assert.equal(args.people.length, 1022)
  assert.deepEqual(projected.summary, { existingHoldings: 25, newGrants: 31, holdings: 56, titles: 42, existingTitleBindings: 7,
    heldSeoulRegions: 427, heldOutsideUnits: 0, heldComponents: 0, unassignedComponents: 0, coveredEntitlements: 427 })
  assert.equal(projected.politicalIdentities.length, 158)
  assert.equal(projected.holdings.filter(row => row.kind === 'superior-jurisdiction').length, 5)
  assert.deepEqual(projected.titles.filter(row => ['title:kingdom-s02', 'title:kingdom-s04', 'title:kingdom-s06'].includes(row.id)).map(row => row.jurisdictionRefs.length), [144, 79, 201])
  const missingHistorical = structuredClone(historical)
  missingHistorical.existing.holdings.find(row => row.id === 'holding:daejeon-dong').adminRefs.shift()
  assert.throws(() => validateApprovedRightsTransition(args, missingHistorical, history.transition), /E_COVERAGE_MISSING:3011051500/)
  const omitted = structuredClone(history.transition)
  omitted.records.splice(omitted.records.findIndex(row => row.disposition === 'retired-current'), 1)
  assert.throws(() => validateApprovedRightsTransition(args, historical, omitted), /E_TRANSITION_COVERAGE/)
  const arbitrary = structuredClone(history.transition)
  const arbitraryRow = arbitrary.records.find(row => row.set === 'holdings')
  Object.assign(arbitraryRow, { disposition: 'retired-current', currentId: null }); delete arbitraryRow.current
  assert.throws(() => validateApprovedRightsTransition(args, historical, arbitrary), /E_TRANSITION_RETIREMENT/)
  const activeCurrent = structuredClone(history.transition)
  const activeCurrentRow = activeCurrent.records.find(row => row.disposition === 'retired-current')
  activeCurrentRow.currentId = activeCurrentRow.oldId
  assert.throws(() => validateApprovedRightsTransition(args, historical, activeCurrent), /E_TRANSITION_RETIREMENT/)
  const changed = structuredClone(args)
  changed.existing.holdings.find(row => row.id === 'holding:yangcheon').directLiegePersonId = 'K1008'
  await assert.rejects(projectCatalogCurrentHoldings(changed, context), /E_TRANSITION_CURRENT_EXISTING/)
  const mixed = structuredClone(args)
  mixed.allocation.titles.find(row => row.id === 'title:kingdom-s02').jurisdictionRefs.pop()
  await assert.rejects(projectCatalogCurrentHoldings(mixed, context), /E_TRANSITION_CURRENT_ALLOCATION/)
  const political = structuredClone(args)
  political.allocation.politicalIdentities[0].rank = 'kingdom'
  await assert.rejects(projectCatalogCurrentHoldings(political, context), /E_TRANSITION_CURRENT_ALLOCATION/)
})

test('approved transition authentication rejects modified original bytes and invented approval packages', async () => {
  const files = { approval: './approved-seoul-rights-transition.json', existing: './historical-inputs/personal-holdings.json',
    allocation: './historical-inputs/opening-feudal-allocation.json', control: './historical-inputs/outside-control-2126.json', islands: './historical-inputs/outside-island-occupation.json',
    geometry: './historical-inputs/outside-admin-units.json', scale: './historical-inputs/admin-territorial-scale.json' }
  const bytes = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(new URL(path, import.meta.url))]))
  for (const key of Object.keys(bytes)) await assert.rejects(loadApprovedRightsHistory({ ...bytes, [key]: Buffer.concat([bytes[key], Buffer.from(' ')]) }), { message: 'E_CATALOG_RIGHTS_HASH:' + key })
})

test('current authored rights equal the approved transition and preserve every person', async () => {
  const current = await currentRightsFixture()
  const approved = await currentRightsFixture(true)
  assert.deepEqual(current.args.existing, approved.args.existing)
  assert.deepEqual(current.args.allocation, approved.args.allocation)
  const projected = await projectCatalogCurrentHoldings(current.args, current.context)
  assert.equal(current.args.people.length, 1022)
  assert.equal(new Set(current.args.people.map(row => row.id)).size, 1022)
  assert.equal(projected.summary.coveredEntitlements, 427)
  assert.equal(projected.summary.heldOutsideUnits, 0)
  assert.equal(projected.summary.newGrants, 31)
  const { geographicScale, ...currentHistoricalArgs } = current.args
  const historical = { ...currentHistoricalArgs, ...current.history.historical }
  assert.equal(validateApprovedRightsTransition(current.args, historical, current.history.transition).coveredEntitlements, 1939)
})

test('approved transition does not aggregate nonowning or political identity into direct property', async () => {
  const { args, context, history } = await currentRightsFixture(true)
  const projected = await projectCatalogCurrentHoldings(args, context)
  const { geographicScale, ...historicalArgs } = args
  const historical = projectHistoricalOpeningFeudalAllocation({ ...historicalArgs, ...history.historical })
  const direct = historical.holdings.filter(row => !row.componentRefs?.length && (row.adminRefs ?? []).every(ref => ref.id.startsWith('region:11')))
  assert.equal(direct.length, 51)
  assert.deepEqual(projected.holdings.filter(row => row.kind !== 'superior-jurisdiction'), direct)
  for (const person of args.people) {
    const view = projectPersonHoldings(projected, person.id, context.issuedById, args.people)
    assert.deepEqual(view.confirmedHoldings, direct.filter(row => row.holderPersonId === person.id))
    assert.ok((view.subordinateHoldings ?? []).every(row => row.kind !== 'superior-jurisdiction'))
  }
  const royal = projectPersonHoldings(projected, 'K1008', context.issuedById, args.people)
  assert.deepEqual(royal.confirmedHoldings, [])
  assert.equal(royal.subordinateHoldings, undefined)
  assert.equal(royal.superiorJurisdictions.length, 2)
  const rankOnly = projectPersonHoldings(projected, 'K998', context.issuedById, args.people)
  assert.ok(rankOnly.politicalIdentities.some(row => row.rank === 'duchy'))
  assert.deepEqual(rankOnly.confirmedHoldings, [])
})

const approvalBytes = readFileSync(new URL('./approved-daejeon-nonowning-rights.json', import.meta.url))
const catalogFixture = (nonowning = true) => {
  const people = ['K001', 'K002', 'K1008', 'K035', 'K039', 'K038'].map(id => ({ id, name: id, state: ['K001', 'K002'].includes(id) ? 'S01' : 'polity:daejeon' }))
  const args = {
    people, affiliation: { hegemons: [] }, control: { assignments: [] }, outside: { units: [], islands: [] },
    geographicScale: buildAdminTerritorialScale({
      geographyBytes: readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef'),
      territorialScale: read('../lore/offices/Offices-and-Ranks.json').data.territorialScale,
    }),
    seoul: { regions: [{ id: 'region:1168051000', name: '신사동', polities: ['S01'] }], stations: [] },
    existing: { schema: 'confirmed-person-holdings.v1', openingYear: 2126,
      polities: [{ id: 'polity:daejeon', sovereignPersonId: 'K1008', authority: { kind: 'neutral', name: '대전' } }],
      retinueGroups: [{ id: 'retinue:daejeon', liegePersonId: 'K1008', count: 1 }],
      holdings: [{ id: 'holding:direct', name: { ko: '신사동 직접 보유' }, holderPersonId: 'K002', directLiegePersonId: 'K001', stateId: 'S01',
        adminRefs: [{ id: 'region:1168051000', name: '신사동' }], geometrySource: null, territorialScale: null, formalTitleRank: null }],
    },
    allocation: { schema: 'opening-feudal-allocation.v1', grants: [],
      titles: [
        { id: 'title:direct-duchy', name: '직접 공작령', rank: 'duchy', holderPersonId: 'K001', stateId: 'S01', parentTitleId: null, jurisdictionRefs: ['region:1168051000'], basis: 'fixture' },
        { id: 'title:direct-barony', name: '직접 남작령', rank: 'barony', holderPersonId: 'K002', stateId: 'S01', parentTitleId: 'title:direct-duchy', jurisdictionRefs: ['region:1168051000'], basis: 'fixture' },
      ],
      existingTitleBindings: [{ holdingId: 'holding:direct', titleId: 'title:direct-barony' }],
    },
  }
  const rows = [
    ['dong', 'K1008', '11680', '강남구', ['갑', '을', '병']],
    ['yuseong', 'K1008', '11650', '서초구', ['갑', '을']],
    ['jung', 'K035', '11215', '광진구', ['갑', '을']],
    ['seo', 'K039', '11710', '송파구', ['갑', '을', '병']],
    ['daedeok', 'K038', '11740', '강동구', ['갑', '을']],
  ]
  if (nonowning) {
    args.allocation.titles.push({ id: 'title:kingdom-daejeon', kind: 'nonterritorial-political-title', name: '대전선', rank: 'kingdom', holderPersonId: 'K1008', stateId: 'polity:daejeon',
      basis: 'fixture', directOwnership: false, politicalParentTitleId: null, personalLiegePersonId: null })
    for (const [suffix, holderPersonId, guRef, name, counties] of rows) {
      const titleId = 'proposal:superior-jurisdiction:seoul:daejeon-' + suffix
      const personalLiegePersonId = holderPersonId === 'K1008' ? null : 'K1008'
      args.existing.holdings.push({ id: 'holding:daejeon-' + suffix, kind: 'superior-jurisdiction', name: { ko: name }, holderPersonId, directLiegePersonId: personalLiegePersonId,
        stateId: 'polity:daejeon', titleId, directOwnership: false, adminRefs: [], geometrySource: null, territorialScale: 'duchy', formalTitleRank: null,
        liegeRelationshipKind: 'preserved-personal-service', capabilityPackageId: 'proposal:registry-notice-and-objection-v1',
        powers: ['receive-holding-change-notice', 'lodge-nonbinding-registry-objection'],
        geographicScope: { duchyTitleId: 'geography:duchy:' + guRef, guRef, countyTitleIds: counties.map(part => 'geography:county:seoul-constituency:' + name + part + '선거구'),
          geographicKingdomId: 'proposal:kingdom:seoul:06', geographicEmpireId: 'geography:empire:seoul' },
      })
      args.allocation.titles.push({ id: titleId, kind: 'superior-jurisdiction', name, rank: 'duchy', holderPersonId, stateId: 'polity:daejeon', basis: 'fixture', directOwnership: false,
        geographicTitleId: 'geography:duchy:' + guRef, geographicParentTitleId: 'proposal:kingdom:seoul:06', politicalParentTitleId: 'title:kingdom-daejeon', personalLiegePersonId })
      args.allocation.existingTitleBindings.push({ holdingId: 'holding:daejeon-' + suffix, titleId })
    }
  }
  return { args, context: { issuedById: new Map(people.map(person => [person.id, person])), territoryStates: [{ id: 'S01', ruler: 'K001' }],
    openingTerritories: args.seoul, projectedLandmarks: [], stationInteriors: { stations: [] }, seoulGraph: { stations: [] }, outsideGeometry: args.outside,
    geography: read('../lore/regions/seoul-electoral-titles.json'),
  } }
}

test('catalog nonowning authenticates repository bytes rather than caller claims', async () => {
  const fixture = catalogFixture()
  assert.equal(authenticateNonowningRights(approvalBytes).contract.rights.length, 5)
  for (const mutate of [
    approval => { approval.approval.messageRef = 'owner:invented' },
    approval => { approval.approval.proposalSha256 = '0'.repeat(64) },
    approval => { approval.approval.receiptSha256 = '0'.repeat(64) },
    approval => { approval.contract.rights.pop() },
    approval => { approval.contract.rights[0].holderPersonId = 'K001' },
  ]) {
    const changed = JSON.parse(approvalBytes)
    mutate(changed)
    await assert.rejects(projectCatalogHoldings(fixture.args, fixture.context, JSON.stringify(changed, null, 2) + '\n'), { message: 'E_CATALOG_NONOWNING_APPROVAL' })
  }
  assert.throws(() => authenticateNonowningRights(Buffer.concat([approvalBytes, Buffer.from(' ')])), { message: 'E_CATALOG_NONOWNING_APPROVAL' })
  fixture.args.nonowningRights = authenticateNonowningRights(approvalBytes).contract
  await assert.rejects(projectCatalogHoldings(fixture.args, fixture.context), { message: 'E_CATALOG_NONOWNING_ARGUMENT' })
})

test('catalog nonowning preserves direct properties, political colors and roles without ownership aggregation', async () => {
  const fixture = catalogFixture()
  const before = structuredClone(fixture)
  const directFixture = catalogFixture(false)
  const direct = await projectCatalogHoldings(directFixture.args, directFixture.context)
  const projected = await projectCatalogHoldings(fixture.args, fixture.context)
  assert.deepEqual(fixture, before)
  assert.deepEqual(projected.holdings.filter(row => row.kind !== 'superior-jurisdiction'), direct.holdings)
  assert.equal(projected.summary.coveredEntitlements, direct.summary.coveredEntitlements)
  assert.deepEqual(projected.polities, direct.polities)
  assert.deepEqual(projected.retinueGroups, direct.retinueGroups)
  for (const id of ['K001', 'K002']) assert.deepEqual(projectPersonHoldings(projected, id, fixture.context.issuedById, fixture.args.people),
    projectPersonHoldings(direct, id, fixture.context.issuedById, fixture.args.people))
  assert.deepEqual(projectPersonHoldings(projected, 'K001', fixture.context.issuedById, fixture.args.people).subordinateHoldings.map(row => row.id), ['holding:direct'])
  const royal = projectPersonHoldings(projected, 'K1008', fixture.context.issuedById, fixture.args.people)
  assert.deepEqual(royal.confirmedHoldings, [])
  assert.equal(royal.subordinateHoldings, undefined)
  assert.deepEqual(royal.superiorJurisdictions.map(row => row.id), ['holding:daejeon-dong', 'holding:daejeon-yuseong'])
  assert.ok(royal.openingTitles.every(row => row.parentTitle === null))
  assert.ok(royal.openingTitles.filter(row => row.kind === 'superior-jurisdiction').every(row => row.politicalParentTitleId === 'title:kingdom-daejeon' && row.geographicParentTitleId === 'proposal:kingdom:seoul:06'))
  const retainer = projectPersonHoldings(projected, 'K035', fixture.context.issuedById, fixture.args.people)
  assert.equal(retainer.superiorJurisdictions[0].directLiegePersonId, 'K1008')
  assert.equal(retainer.openingTitles[0].personalLiegePersonId, 'K1008')
  assert.deepEqual(retainer.confirmedHoldings, [])
  assert.equal(retainer.subordinateHoldings, undefined)
  const publicValues = JSON.stringify({ projected, royal, retainer })
  for (const secret of ['proposalSha256', 'receiptSha256', 'messageRef', 'activeRecordPolicy', '.omo/', 'soul']) assert.equal(publicValues.includes(secret), false)
})

test('catalog nonowning rejects incomplete sets, duplicate bindings and geographic drift', async () => {
  for (const mutate of [
    fixture => { fixture.args.existing.holdings.pop() },
    fixture => { fixture.args.existing.holdings.push(structuredClone(fixture.args.existing.holdings[1])) },
    fixture => { fixture.args.allocation.titles.pop() },
    fixture => { fixture.args.allocation.titles.find(row => row.id === 'title:kingdom-daejeon').kind = 'direct-property' },
  ]) {
    const fixture = catalogFixture()
    mutate(fixture)
    await assert.rejects(projectCatalogHoldings(fixture.args, fixture.context), { message: 'E_CATALOG_NONOWNING_SET' })
  }
  for (const duplicate of [false, true]) {
    const fixture = catalogFixture()
    if (duplicate) fixture.args.allocation.existingTitleBindings.push(structuredClone(fixture.args.allocation.existingTitleBindings[1]))
    else fixture.args.allocation.existingTitleBindings.pop()
    await assert.rejects(projectCatalogHoldings(fixture.args, fixture.context), { message: 'E_CATALOG_NONOWNING_BINDINGS' })
  }
  for (const refs of [['11650'], ['11680', '11650']]) {
    const drift = catalogFixture()
    drift.context.geography.titles.find(row => row.titleId === 'geography:county:seoul-constituency:강남구갑선거구').jurisdictionRefs = refs
    await assert.rejects(projectCatalogHoldings(drift.args, drift.context), { message: 'E_CATALOG_NONOWNING_GEOGRAPHY:holding:daejeon-dong' })
  }
})

test('catalog nonowning validates kind-specific powers, identity and property fields before returning', async () => {
  const holdingId = 'holding:daejeon-dong'
  for (const [field, value, code] of [
    ['holderPersonId', 'K035', 'E_NONOWNING_HOLDER'], ['directLiegePersonId', 'K001', 'E_NONOWNING_LIEGE'],
    ['powers', ['receive-holding-change-notice', 'lodge-nonbinding-registry-objection', 'tax'], 'E_NONOWNING_POWERS'],
    ['capabilityPackageId', 'unapproved', 'E_NONOWNING_POWERS'], ['directOwnership', true, 'E_NONOWNING_OWNERSHIP'],
    ['adminRefs', [{ id: 'region:1168051000', name: '신사동' }], 'E_NONOWNING_OWNERSHIP'],
    ['facilityRef', { stationName: '신사' }, 'E_NONOWNING_OWNERSHIP'], ['taxRate', 1, 'E_NONOWNING_FIELD'],
    ['status', 'approved', 'E_CATALOG_NONOWNING_STATUS'], ['activationDecisionIds', ['D1'], 'E_CATALOG_NONOWNING_STATUS'],
  ]) {
    const fixture = catalogFixture()
    fixture.args.existing.holdings.find(row => row.id === holdingId)[field] = value
    await assert.rejects(projectCatalogHoldings(fixture.args, fixture.context), { message: code + ':' + holdingId })
  }
  const scope = catalogFixture()
  scope.args.existing.holdings.find(row => row.id === holdingId).geographicScope.countyTitleIds.pop()
  await assert.rejects(projectCatalogHoldings(scope.args, scope.context), { message: 'E_NONOWNING_GEOGRAPHY:' + holdingId })
  const parent = catalogFixture()
  parent.args.allocation.titles.find(row => row.kind === 'superior-jurisdiction').politicalParentTitleId = 'title:direct-duchy'
  await assert.rejects(projectCatalogHoldings(parent.args, parent.context), /E_NONOWNING_PARENT:/)
})

test('catalog nonowning leaves legacy direct validation closed and rejects hidden kinds', async () => {
  for (const explicit of [false, true]) {
    const fixture = catalogFixture(false)
    if (explicit) fixture.args.existing.holdings[0].kind = 'direct-property'
    fixture.args.existing.holdings[0].adminRefs = []
    await assert.rejects(projectCatalogHoldings(fixture.args, fixture.context), { message: 'E_PERSON_HOLDING:holding:direct' })
  }
  const unknown = catalogFixture(false)
  unknown.args.existing.holdings[0].kind = 'unknown'
  await assert.rejects(projectCatalogHoldings(unknown.args, unknown.context), { message: 'E_RIGHT_KIND:holding:direct' })
  const hidden = catalogFixture(false)
  hidden.args.existing.holdings[0].directOwnership = false
  await assert.rejects(projectCatalogHoldings(hidden.args, hidden.context), { message: 'E_RIGHT_KIND:holding:direct' })
  const explicit = catalogFixture(false)
  explicit.args.existing.holdings[0].kind = 'direct-property'
  assert.equal((await projectCatalogHoldings(explicit.args, explicit.context)).holdings[0].kind, 'direct-property')
})

test('only the three owner-approved opening dispositions distinguish personal landlessness from unknown', async () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const people = read('../lore/name-pools/gurps-cast.json').people
  const { args, context } = await currentRightsFixture()
  const projected = await projectCatalogCurrentHoldings(args, context)
  assert.deepEqual(ledger.openingDispositions, ['K003', 'K004', 'K005'].map(personId => ({
    personId, status: 'personal-landless',
    approvalRef: 'owner:call_woKhJUVDwBZTeAyXJI9RXhGc:s01_holding_' + personId.toLowerCase(),
  })))
  const dispositions = validateOpeningDispositions(ledger, people)
  const currentHoldings = await currentFacilityRights(projected)
  for (const person of people.filter(person => activePersonIds.has(person.id))) {
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.deepEqual(detail.openingDisposition, dispositions.get(person.id))
    assert.equal(Object.hasOwn(detail, 'territory'), false, person.id)
    const rights = projectPersonHoldings(currentHoldings, person.id, context.issuedById, people)
    assert.deepEqual(detail.confirmedHoldings, rights.confirmedHoldings)
    assert.deepEqual(detail.superiorJurisdictions ?? [], publicJurisdictionReferences(rights.superiorJurisdictions ?? []))
    assert.deepEqual(detail.politicalIdentities ?? [], rights.politicalIdentities ?? [])
  }
  assert.equal(dispositions.has('K006'), false)
  assert.deepEqual(read('../public/confirmed-person-holdings.json'), publishedRights(currentHoldings))
})

test('opening disposition boundary rejects invalid people, duplicate decisions, and contradictory approved holdings', () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const people = read('../lore/name-pools/gurps-cast.json').people
  const row = ledger.openingDispositions[0]
  assert.throws(() => validateOpeningDispositions({ ...ledger, openingDispositions: [{ ...row, personId: 'K9999' }] }, people), /E_OPENING_DISPOSITION:K9999/)
  assert.throws(() => validateOpeningDispositions({ ...ledger, openingDispositions: [row, row] }, people), /E_OPENING_DISPOSITION:K003/)
  assert.throws(() => validateOpeningDispositions({ ...ledger, holdings: [...ledger.holdings, { holderPersonId: row.personId }] }, people), /E_OPENING_DISPOSITION_HOLDING:K003/)
  assert.throws(() => validateOpeningDispositions({ ...ledger, openingDispositions: [{ ...row, approvalRef: '' }] }, people), /E_OPENING_DISPOSITION:K003/)
  assert.throws(() => validateOpeningDispositions({ ...ledger, openingDispositions: [{ ...row, status: 'unknown' }] }, people), /E_OPENING_DISPOSITION:K003/)
})

test('Byeon Goun holds only the sourced Yeongdeungpo concourse under the existing direct liege', () => {
  const holding = read('../lore/relations/personal-holdings.json').holdings.find(row => row.holderPersonId === 'K017')
  assert.equal(holding.id, 'holding:yeongdeungpo-concourse')
  assert.equal(holding.directLiegePersonId, 'K001')
  assert.equal(holding.stateId, 'S01')
  const station = read('../lore/regions/station-interiors.json').stations.find(row => row.name === '영등포')
  assert.deepEqual(holding.facilityRef.stationIdentity, { district: station.district, lat: station.lat, lon: station.lon })
  assert.equal(holding.facilityRef.layerId, 'concourse')
  assert.equal(holding.facilityRef.stationId, 'Yeongdeungpo')
  const mapStation = read('../public/opening-territories.json').stations.find(row => row.id === holding.facilityRef.stationId)
  assert.equal(mapStation.name, holding.facilityRef.stationName)
  assert.equal(holding.facilityRef.layerName, station.layers.find(row => row.id === 'concourse').wiki_layer)
  assert.deepEqual(holding.adminRefs, [])
  assert.equal(holding.geometrySource, null)
  assert.equal(holding.territorialScale, null)
  assert.equal(holding.formalTitleRank, null)
  const detail = read('../public/person-details/person-0017.json')
  assert.equal(detail.gurps.id, 'K017')
  assert.equal(detail.directLiege.personId, 'K001')
  assert.deepEqual(detail.confirmedHoldings, [holding])
})

test('Saetgang concourse holding preserves the exact facility and direct liege without geographic grants', async () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const holding = ledger.holdings.find(row => row.holderPersonId === 'K233')
  assert.equal(ledger.holdings.length, 25)
  assert.deepEqual(holding, {
    id: 'holding:saetgang-concourse', name: { ko: '샛강 대합실' },
    holderPersonId: 'K233', directLiegePersonId: 'K222', stateId: 'S09',
    facilityRef: { sourcePath: 'lore/regions/station-interiors.json', stationName: '샛강',
      stationIdentity: { district: '영등포구', lat: 37.51736, lon: 126.92828 },
      siteSourcePath: 'lore/regions/content/11560.json', siteAnchor: 'osm:node:8401534578', layerId: 'concourse', layerName: '역사 대합실' },
    adminRefs: [], geometrySource: null, territorialScale: null, formalTitleRank: null,
  })
  const stations = read('../lore/regions/station-interiors.json').stations.filter(row => row.name === holding.facilityRef.stationName)
  assert.equal(stations.length, 1)
  const station = stations[0]
  const sites = read('../lore/regions/content/11560.json').regions.flatMap(row => row.content.buildings).filter(row => row.anchor_ref === holding.facilityRef.siteAnchor)
  assert.equal(sites.length, 1)
  assert.equal(sites[0].name, holding.facilityRef.stationName)
  assert.equal(station.observed_levels, null)
  assert.equal(station.layers.find(row => row.id === holding.facilityRef.layerId).wiki_layer, '역사 대합실')
  const detail = read('../public/person-details/person-0234.json')
  assert.equal(detail.gurps.id, 'K233')
  assert.equal(detail.directLiege.personId, 'K222')
  assert.deepEqual(detail.confirmedHoldings, [holding])
  const { args, context } = await currentRightsFixture()
  assert.deepEqual(read('../public/confirmed-person-holdings.json'), publishedRights(await currentFacilityRights(await projectCatalogCurrentHoldings(args, context))))
})

test('confirmed Yangcheon holding joins exact admin geometry and stays separate from proposal territory', async () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const projected = read('../public/confirmed-person-holdings.json')
  const map = read('../public/opening-territories.json')
  const source = read('../lore/name-pools/gurps-cast.json').people
  const holding = ledger.holdings.find(row => row.id === 'holding:yangcheon')
  const { args, context } = await currentRightsFixture()
  const current = await currentFacilityRights(await projectCatalogCurrentHoldings(args, context))
  assert.deepEqual(projected, publishedRights(current))
  assert.equal(holding.holderPersonId, 'K002')
  assert.equal(holding.directLiegePersonId, 'K001')
  const expected = map.regions.filter(row => row.district === '양천구').map(row => ({ id: row.id, name: row.name }))
  assert.equal(expected.length, 18)
  assert.deepEqual(holding.adminRefs, expected)
  for (const person of source.filter(person => activePersonIds.has(person.id))) {
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.equal(Object.hasOwn(detail, 'territory'), false, person.id)
    assert.deepEqual(detail.confirmedHoldings, current.holdings.filter(row => row.holderPersonId === person.id && row.kind !== 'superior-jurisdiction'))
  }
  const edges = read('../lore/relations/relations.json').ownerLieges.edges
  assert.equal(edges.length, 16)
  for (const edge of edges) {
    const person = source.find(row => row.id === edge.personId)
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.equal(detail.directLiege.personId, edge.liegePersonId)
    assert.equal(detail.directLiege.relationKind, edge.relationKind)
    assert.equal(detail.directLiege.ownerTerm, edge.ownerTerm)
    assert.deepEqual(detail.confirmedHoldings, current.holdings.filter(row => row.holderPersonId === edge.personId && row.kind !== 'superior-jurisdiction'))
  }
})
