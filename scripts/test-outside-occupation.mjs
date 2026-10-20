import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { projectOutsideOccupation } from './outside-occupation.mjs'
import { projectCatalogOutsideOccupation } from './generate-catalog.mjs'

const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
const control = json('scripts/historical-inputs/outside-control-2126.json')
const geometryBytes = readFileSync(new URL('./historical-inputs/outside-admin-units.json', import.meta.url))
assert.equal(createHash('sha256').update(geometryBytes).digest('hex'), 'dd23944da5f558e9d772a4b2d41963f46de555680677f1e838e73447497556c6')
const geometry = JSON.parse(geometryBytes)
const islands = json('scripts/historical-inputs/outside-island-occupation.json')

// Integration fixtures use immutable historical inputs, never the live writer's sources.
const catalogRetirementBytes = {
  approval: readFileSync(new URL('./approved-outside-current-retirement.json', import.meta.url)),
  control: readFileSync(new URL('./historical-inputs/outside-control-2126.json', import.meta.url)),
  islands: readFileSync(new URL('./historical-inputs/outside-island-occupation.json', import.meta.url)),
}
const catalogRetirementFixture = () => {
  const current = JSON.parse(catalogRetirementBytes.control)
  const currentIslands = JSON.parse(catalogRetirementBytes.islands)
  current.assignments = []
  delete current.basis
  currentIslands.units = []
  delete currentIslands.openingDecision
  return { current, currentIslands }
}

test('catalog retirement authenticates full original bytes and projects only empty current records', async () => {
  const fixture = catalogRetirementFixture()
  const before = structuredClone(fixture), beforeGeometry = structuredClone(geometry)
  const projected = await projectCatalogOutsideOccupation(fixture.current, geometry, fixture.currentIslands)
  assert.deepEqual(projected, { schema: 'outside-control-2126.v3', assignments: [] })
  assert.deepEqual(fixture, before)
  assert.deepEqual(geometry, beforeGeometry)
  for (const key of ['originalControl', 'originalIslands', 'records', 'approvalReceipt', 'originalSources']) assert.equal(Object.hasOwn(projected, key), false)
})

test('catalog retirement rejects forged approvals, missing bytes and rewritten historical originals', async () => {
  const fixture = catalogRetirementFixture()
  for (const key of ['approval', 'control', 'islands']) {
    const bytes = { ...catalogRetirementBytes, [key]: Buffer.concat([catalogRetirementBytes[key], Buffer.from(' ')]) }
    await assert.rejects(projectCatalogOutsideOccupation(fixture.current, geometry, fixture.currentIslands, bytes), { message: 'E_CATALOG_RETIREMENT_HASH:' + key })
    delete bytes[key]
    await assert.rejects(projectCatalogOutsideOccupation(fixture.current, geometry, fixture.currentIslands, bytes), { message: 'E_CATALOG_RETIREMENT_HASH:' + key })
  }
  for (const mutate of [
    approval => { approval.approvalReceipt.sha256 = '0'.repeat(64) },
    approval => { approval.records.pop() },
    approval => { approval.records[0].status = 'retained-current' },
    approval => { approval.records[0].sourceValueSha256 = '0'.repeat(64) },
  ]) {
    const approval = JSON.parse(catalogRetirementBytes.approval)
    mutate(approval)
    await assert.rejects(projectCatalogOutsideOccupation(fixture.current, geometry, fixture.currentIslands,
      { ...catalogRetirementBytes, approval: JSON.stringify(approval) }), { message: 'E_CATALOG_RETIREMENT_HASH:approval' })
  }
})

test('catalog retirement refuses unretired current sources and still validates original geometry', async () => {
  const originalControl = JSON.parse(catalogRetirementBytes.control)
  const originalIslands = JSON.parse(catalogRetirementBytes.islands)
  await assert.rejects(projectCatalogOutsideOccupation(originalControl, geometry, originalIslands), /E_OUTSIDE_RETIREMENT_CURRENT_CONTROL/)
  const fixture = catalogRetirementFixture()
  await assert.rejects(projectCatalogOutsideOccupation(fixture.current, geometry, originalIslands), /E_OUTSIDE_RETIREMENT_CURRENT_ISLANDS/)
  fixture.currentIslands.openingDecision = originalIslands.openingDecision
  await assert.rejects(projectCatalogOutsideOccupation(fixture.current, geometry, fixture.currentIslands), /E_OUTSIDE_RETIREMENT_CURRENT_ISLANDS/)
  const clean = catalogRetirementFixture()
  const invalidGeometry = structuredClone(geometry)
  invalidGeometry.units.find(unit => unit.id === originalIslands.units[0].unitId).path += ' '
  await assert.rejects(projectCatalogOutsideOccupation(clean.current, invalidGeometry, clean.currentIslands), /E_ISLAND_GEOMETRY_HASH/)
  clean.current.assignments.push({ unitId: originalControl.assignments[0].unitId, authority: null, status: 'unassigned' })
  await assert.rejects(projectCatalogOutsideOccupation(clean.current, geometry, clean.currentIslands), /E_OUTSIDE_RETIREMENT_CURRENT_CONTROL/)
})

const sourceHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const retirementFixture = (retire = () => true) => {
  const approvalRef = 'owner:seoul-only-rights-20261015'
  const contract = {
    schema: 'outside-control-retirement.v1', approvalRef,
    originalControl: structuredClone(control), originalIslands: structuredClone(islands),
    records: [
      ...control.assignments.map(row => ['assignments', row]),
      ...islands.units.map(row => ['islandUnits', row]),
    ].map(([set, row]) => ({
      recordKey: JSON.stringify([set, row.unitId]), sourceValueSha256: sourceHash(row),
      status: retire(row.unitId) ? 'retired-current' : 'retained-current', approvalRef,
    })),
  }
  const current = structuredClone(control), currentIslands = structuredClone(islands)
  current.assignments = current.assignments.filter(row => !retire(row.unitId))
  currentIslands.units = currentIslands.units.filter(row => !retire(row.unitId))
  if (contract.records.every(row => row.status === 'retired-current')) delete current.basis
  if (!currentIslands.units.length) delete currentIslands.openingDecision
  return { current, currentIslands, contract }
}

test('explicit retirement covers all original controls and island settings without creating unassigned rows', () => {
  const fixture = retirementFixture()
  const before = structuredClone(fixture), originalGeometry = structuredClone(geometry)
  assert.equal(fixture.contract.originalControl.assignments.length, 1415)
  assert.equal(fixture.contract.originalIslands.units.length, 11)
  assert.equal(fixture.contract.records.length, 1426)
  assert.deepEqual(projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), { schema: control.schema, assignments: [] })
  assert.deepEqual(fixture, before)
  assert.deepEqual(geometry, originalGeometry)
  assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands), /E_OUTSIDE_CONTROL_COVERAGE/)
})

test('retained original controls project unchanged and exact partial retirement preserves full geometry validation', () => {
  const allRetained = retirementFixture(() => false)
  assert.deepEqual(projectOutsideOccupation(allRetained.current, geometry, allRetained.currentIslands, allRetained.contract), projectOutsideOccupation(control, geometry, islands))
  const retiredId = control.assignments.find(row => !islands.units.some(unit => unit.unitId === row.unitId)).unitId
  const fixture = retirementFixture(id => id === retiredId)
  assert.deepEqual(projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract).assignments,
    projectOutsideOccupation(control, geometry, islands).assignments.filter(row => row.unitId !== retiredId))
})

test('only full retirement omits the original basis and no other metadata may drift', () => {
  for (const [mutate, error] of [
    [f => { f.current.basis = control.basis }, 'CURRENT_CONTROL'],
    [f => { f.current.basis = 'replacement provenance' }, 'CURRENT_CONTROL'],
    [f => { f.current.retirement = f.contract.approvalRef }, 'CURRENT_CONTROL'],
    [f => { f.current.schema = 'outside-control-2126.v4' }, 'CURRENT_CONTROL'],
    [f => { delete f.currentIslands.geometrySource }, 'CURRENT_ISLANDS'],
    [f => { f.currentIslands.geometrySourceSha256 = '0'.repeat(64) }, 'CURRENT_ISLANDS'],
    [f => { f.currentIslands.authority = { kind: 'state', stateId: 'S99' } }, 'CURRENT_ISLANDS'],
  ]) {
    const fixture = retirementFixture()
    mutate(fixture)
    assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), new RegExp(`E_OUTSIDE_RETIREMENT_${error}`))
  }
  const islandIds = new Set(islands.units.map(row => row.unitId))
  for (const retire of [() => false, id => islandIds.has(id)]) {
    for (const mutate of [
      current => { delete current.basis },
      current => { current.basis = 'replacement provenance' },
    ]) {
      const fixture = retirementFixture(retire)
      assert.ok(fixture.current.assignments.length > 0)
      mutate(fixture.current)
      assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), /E_OUTSIDE_RETIREMENT_CURRENT_CONTROL/)
    }
  }
})

test('live retired sources pass the authenticated catalog wrapper without normalization', async () => {
  const current = json('lore/regions/outside-control-2126.json')
  const currentIslands = json('lore/regions/outside-island-occupation.json')
  assert.deepEqual(current, { schema: control.schema, assignments: [] })
  assert.deepEqual(currentIslands, {
    schema: islands.schema, geometrySource: islands.geometrySource,
    geometrySourceSha256: islands.geometrySourceSha256, units: [],
  })
  assert.deepEqual(await projectCatalogOutsideOccupation(current, geometry, currentIslands), { schema: control.schema, assignments: [] })
  current.basis = control.basis
  await assert.rejects(projectCatalogOutsideOccupation(current, geometry, currentIslands), /E_OUTSIDE_RETIREMENT_CURRENT_CONTROL/)
})

test('missing duplicate unknown stale or unapproved retirement mappings are rejected', () => {
  for (const [mutate, error] of [
    [f => { f.contract.records.pop() }, 'COVERAGE'],
    [f => { f.contract.records[1] = f.contract.records[0] }, 'DUPLICATE'],
    [f => { f.contract.records[0].recordKey = '["assignments","unknown"]' }, 'UNKNOWN'],
    [f => { f.contract.records[0].sourceValueSha256 = '0'.repeat(64) }, 'HASH'],
    [f => { f.contract.records[0].status = 'unassigned' }, 'STATUS'],
    [f => { f.contract.records[0].approvalRef = 'owner:other' }, 'APPROVAL'],
    [f => { f.contract.approvalRef = 'owner:' }, 'APPROVAL'],
    [f => { f.contract.schema = 'unknown' }, 'SCHEMA'],
    [f => { f.contract.records[0].authority = null }, 'FIELDS'],
    [f => { f.contract.records.find(row => row.recordKey === JSON.stringify(['islandUnits', islands.units[0].unitId])).status = 'retained-current' }, 'ISLAND_ASSIGNMENT'],
  ]) {
    const fixture = retirementFixture()
    mutate(fixture)
    assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), new RegExp(`E_OUTSIDE_RETIREMENT_${error}`))
  }
})

test('retirement rejects dangling current controls islands opening decisions and replacement owners', () => {
  for (const [mutate, error] of [
    [f => { f.current.assignments.push(structuredClone(control.assignments[0])) }, 'CURRENT_CONTROL'],
    [f => { f.current.assignments.push({ unitId: control.assignments[0].unitId, authority: null, status: 'unassigned' }) }, 'CURRENT_CONTROL'],
    [f => { f.currentIslands.units.push(structuredClone(islands.units[0])) }, 'CURRENT_ISLANDS'],
    [f => { f.currentIslands.openingDecision = structuredClone(islands.openingDecision) }, 'CURRENT_ISLANDS'],
  ]) {
    const fixture = retirementFixture()
    mutate(fixture)
    assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), new RegExp(`E_OUTSIDE_RETIREMENT_${error}`))
  }
  for (const mutate of [
    f => { f.current.assignments[0].authority = { kind: 'state', stateId: 'S99' } },
    f => { f.current.assignments[0].holderPersonId = 'K001' },
    f => { f.current.assignments[0].unitId = '1111051500' },
    f => { f.current.assignments[0].authority = null },
  ]) {
    const fixture = retirementFixture(() => false)
    mutate(fixture)
    assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), /E_OUTSIDE_RETIREMENT_CURRENT_CONTROL/)
  }
})

test('retired historical rows still require complete original geometry components and valid controls', () => {
  for (const [mutate, error] of [
    [f => { f.contract.originalIslands.units[0].pathSha256 = 'bad' }, 'E_ISLAND_GEOMETRY_HASH'],
    [f => { f.contract.originalIslands.units[0].components.pop() }, 'E_ISLAND_COMPONENT_COVERAGE'],
    [f => { f.contract.originalControl.assignments.pop() }, 'E_OUTSIDE_CONTROL_COVERAGE'],
  ]) {
    const fixture = retirementFixture()
    mutate(fixture)
    assert.throws(() => projectOutsideOccupation(fixture.current, geometry, fixture.currentIslands, fixture.contract), new RegExp(error))
  }
  const fixture = retirementFixture(), insideGeometry = structuredClone(geometry)
  const id = fixture.contract.originalControl.assignments.find(row => !islands.units.some(unit => unit.unitId === row.unitId)).unitId
  insideGeometry.units.find(row => row.id === id).id = '1111051500'
  fixture.contract.originalControl.assignments.find(row => row.unitId === id).unitId = '1111051500'
  assert.throws(() => projectOutsideOccupation(fixture.current, insideGeometry, fixture.currentIslands, fixture.contract), /E_OUTSIDE_RETIREMENT_INSIDE/)
})

test('mixed units project every island independently without assigning their whole boundary', () => {
  const projected = projectOutsideOccupation(control, geometry, islands)
  // Exact historical output, independent of later current-public regeneration.
  assert.equal(sourceHash(projected), '6bf3ac2e5b11209629163112cc0f09e85e333440f6c379b68857a5ed0e19f128')
  const bukdo = projected.assignments.find(row => row.unitId === '2872031000')
  assert.equal(bukdo.authority, null)
  assert.equal(bukdo.status, 'partial')
  assert.ok(bukdo.components.every(part => part.authority?.stateId === 'S06'))
  assert.equal(bukdo.components.find(part => part.name === '장봉도').authority.stateId, 'S06')
  for (const row of projected.assignments.filter(row => row.components)) {
    assert.ok(!row.vassal && !row.station && !row.holderPersonId && !row.directLiegePersonId && !row.formalTitle)
    assert.deepEqual(row.components.map(part => part.path).join(' '), geometry.units.find(unit => unit.id === row.unitId).path)
    for (const part of row.components.filter(part => !part.authority)) {
      assert.equal(part.status, 'unassigned')
      assert.ok(!part.vassal && !part.station && !part.holderPersonId && !part.directLiegePersonId && !part.formalTitle)
    }
  }
})

test('owner opening decision changes control without rewriting island geography and requires approval', () => {
  const projected = projectOutsideOccupation(control, geometry, islands)
  const parts = projected.assignments.flatMap(row => row.components ?? [])
  assert.equal(parts.length, 108)
  assert.ok(parts.every(part => part.authority?.stateId === 'S06' && part.openingApprovalRefs.length > 0))
  const observation = islands.units.flatMap(unit => unit.components).find(part => part.name === '백령도')
  assert.equal(observation.connection, 'no-mainland-bridge')
  assert.equal(observation.authority, null)
  const invalid = structuredClone(islands)
  invalid.openingDecision.anonymousComponentApprovalRef = ''
  assert.throws(() => projectOutsideOccupation(control, geometry, invalid), /E_ISLAND_DECISION_APPROVAL/)
})

test('whole unit takeover, missing components, stale geometry and unbridged grants are rejected', () => {
  for (const mutate of [
    (ledger, split) => { ledger.assignments.find(row => row.unitId === split.units[0].unitId).authority = { kind: 'state', stateId: 'S06', name: '대한민국정부' } },
    (_, split) => { split.units[0].components.pop() },
    (_, split) => { split.units[0].components[1].componentIndex = 0 },
    (_, split) => { split.units[0].pathSha256 = 'bad' },
    (_, split) => { split.units[0].components[0].authority = { kind: 'state', stateId: 'S06', name: '대한민국정부' } },
    (_, split) => { split.units[0].components[0].formalTitle = 'invented' },
    (ledger, split) => { ledger.assignments.find(row => row.unitId === split.units[0].unitId).vassal = 'invented' },
    (ledger, split) => { ledger.assignments.find(row => row.unitId === split.units[0].unitId).station = 'invented' },
    (_, split) => { split.units[0].components[0].vassal = 'invented' },
    (_, split) => { split.units[0].components[0].station = 'invented' },
    (_, split) => { split.units[0].components[0].holderPersonId = 'K001' },
    (_, split) => { split.units[0].components[0].directLiegePersonId = 'K001' },
  ]) {
    const ledger = structuredClone(control), split = structuredClone(islands)
    mutate(ledger, split)
    assert.throws(() => projectOutsideOccupation(ledger, geometry, split), /E_ISLAND_/u)
  }
})

test('government controls eligible Incheon, all Gimpo and all Gangwon without altering other units', () => {
  const projected = projectOutsideOccupation(control, geometry, islands)
  for (const unit of geometry.units.filter(unit => unit.province === '인천광역시' || unit.province === '강원특별자치도' || unit.district === '김포시')) {
    const row = projected.assignments.find(row => row.unitId === unit.id)
    if (row.components) assert.ok(row.components.every(part => part.authority === null || part.authority.stateId === 'S06'))
    else assert.equal(row.authority.stateId, 'S06', unit.name)
  }
})

test('state catalog applies no official religion only to the two government subordinates', () => {
  const map = json('public/opening-territories.json')
  for (const id of ['S05', 'S14']) {
    const state = map.states.find(state => state.id === id)
    assert.equal(state.currentHegemon.stateId, 'S06')
    assert.equal(state.religion, '없음')
    assert.equal(state.relation, '복속')
  }
  const church = map.states.find(state => state.id === 'S04')
  assert.equal(church.currentHegemon.kind, 'union')
  assert.equal(church.religion, '성전총회')
})
