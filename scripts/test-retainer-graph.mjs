import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { retainerGraph } from '../src/generated/retainerGraph.ts'
import { loadDataset, validate } from '../lore/relations/validate.mjs'

const assertGraphCountries = (nodes, catalog, registry, values) => {
  const names = new Map(registry.persons.map((person) => [person.id, person.name]))
  const sourceStates = new Map(values.people.map((person) => [person.name, person.state]))
  const catalogByName = new Map(catalog.map((person) => [person.name, person]))
  for (const node of nodes) {
    const name = names.get(node.id)
    assert.ok(name, node.id)
    assert.equal(node.name, name, node.id)
    assert.equal(node.state, sourceStates.get(name), node.id)
    assert.equal(node.detailRoute, catalogByName.get(name)?.detailRoute, node.id)
  }
}

test('generated court graph resolves approved direct retainers to actual detail routes', async () => {
  const dataset = loadDataset()
  assert.deepEqual(validate(dataset), [])
  const catalogSource = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const catalog = JSON.parse(catalogSource.replace(/^export const peopleCatalog = /u, '').replace(/ as const[\s\S]*$/u, ''))
  const byName = new Map(catalog.map((person) => [person.name, person]))
  const issued = new Map(dataset.sources.registry.persons.map((person) => [person.id, person]))
  const values = new Map(dataset.sources.values.people.map((person) => [person.name, person]))
  assertGraphCountries(retainerGraph.nodes, catalog, dataset.sources.registry, dataset.sources.values)
  const expectedIds = new Set(dataset.config.courts.map((court) => court.ownerPersonId))
  const holdings = JSON.parse(await readFile(new URL('../lore/relations/personal-holdings.json', import.meta.url), 'utf8'))
  for (const holding of holdings.holdings) expectedIds.add(holding.holderPersonId)
  for (const edge of dataset.config.directRetainers) {
    expectedIds.add(edge.personId)
    expectedIds.add(edge.liegePersonId)
  }

  for (const edge of dataset.config.ownerLieges.edges) {
    expectedIds.add(edge.personId)
    expectedIds.add(edge.liegePersonId)
  }
  assert.equal(retainerGraph.nodes.length, expectedIds.size)
  assert.deepEqual(new Set(retainerGraph.nodes.map((node) => node.id)), expectedIds)
  assert.deepEqual(retainerGraph.courts, dataset.config.courts)
  const courtEdges = retainerGraph.edges.filter((edge) => edge.courtId !== null)
  const ownerLiegeEdges = retainerGraph.edges.filter((edge) => edge.courtId === null)
  assert.deepEqual(courtEdges, dataset.config.directRetainers.map(({ personId, liegePersonId, courtId }) =>
    ({ fromPersonId: personId, toPersonId: liegePersonId, courtId })))
  assert.deepEqual(ownerLiegeEdges, dataset.config.ownerLieges.edges.map(({ personId, liegePersonId, relationKind, ownerTerm }) =>
    ({ fromPersonId: personId, toPersonId: liegePersonId, courtId: null, relationKind, ownerTerm })))
  for (const node of retainerGraph.nodes) {
    const registered = issued.get(node.id)
    assert.ok(registered, node.id)
    const source = values.get(registered.name)
    assert.ok(source, node.id)
    const person = byName.get(registered.name)
    assert.ok(person, node.id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${person.id}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, node.name)
    assert.equal(detail.state, source.state, node.id)
    assert.equal(node.detailRoute, `/people/${detail.id}`)
  }
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K904'),
    { fromPersonId: 'K904', toPersonId: 'K002', courtId: 'court:K002' })
  assert.equal(retainerGraph.nodes.find((node) => node.id === 'K904')?.detailRoute, '/people/person-0904')
  assert.equal(retainerGraph.nodes.find((node) => node.id === 'K002')?.detailRoute, '/people/person-0002')
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K041'),
    { fromPersonId: 'K041', toPersonId: 'K032', courtId: 'court:K032' })
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K068'),
    { fromPersonId: 'K068', toPersonId: 'K058', courtId: 'court:K058' })
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K002' && edge.courtId === null),
    { fromPersonId: 'K002', toPersonId: 'K001', courtId: null, relationKind: 'direct-liege', ownerTerm: '직속 주군' })
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K062' && edge.courtId === null),
    { fromPersonId: 'K062', toPersonId: 'K1005', courtId: null, relationKind: 'direct-vassal', ownerTerm: '직속 가신' })
  assert.ok(retainerGraph.nodes.some((node) => node.id === 'K001'))
  assert.ok(retainerGraph.nodes.some((node) => node.id === 'K1005'))
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K233'),
    { fromPersonId: 'K233', toPersonId: 'K222', courtId: null, relationKind: 'direct-vassal', ownerTerm: '직속 가신' })
  assert.ok(retainerGraph.nodes.some((node) => node.id === 'K233'))
  assert.ok(retainerGraph.nodes.some((node) => node.id === 'K222'))
  assert.ok(!retainerGraph.nodes.some((node) => node.id === 'K272'))
  assert.ok(!retainerGraph.edges.some((edge) => edge.fromPersonId === 'K068' && edge.courtId === null))
})

test('approved S02 owner lieges project exact person fields and preserve lower court edges', async () => {
  for (const [ownerId, memberId] of [['K032', 'K041'], ['K037', 'K047'], ['K033', 'K049']]) {
    assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === ownerId),
      { fromPersonId: ownerId, toPersonId: 'K029', courtId: null, relationKind: 'direct-liege', ownerTerm: '직속 주군' })
    assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === memberId),
      { fromPersonId: memberId, toPersonId: ownerId, courtId: `court:${ownerId}` })
    const node = retainerGraph.nodes.find((person) => person.id === ownerId)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${node.detailRoute.split('/').at(-1)}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.gurps.id, ownerId)
    assert.deepEqual(detail.directLiege, { personId: 'K029', name: '강민서', relationKind: 'direct-liege', ownerTerm: '직속 주군', effectiveYear: 2126 })
    assert.equal(detail.court.id, `court:${ownerId}`)
    assert.deepEqual(detail.court.members.map((person) => person.personId), [memberId])
    const memberNode = retainerGraph.nodes.find((person) => person.id === memberId)
    const memberDetail = JSON.parse(await readFile(new URL(`../public/person-details/${memberNode.detailRoute.split('/').at(-1)}.json`, import.meta.url), 'utf8'))
    assert.deepEqual(memberDetail.directLiege, { personId: ownerId, name: node.name, courtId: `court:${ownerId}`, effectiveYear: 2126 })
  }
})

test('coordinated wrong graph and generated catalog countries fail against values canon', async () => {
  const dataset = loadDataset()
  const catalogSource = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const catalog = JSON.parse(catalogSource.replace(/^export const peopleCatalog = /u, '').replace(/ as const[\s\S]*$/u, ''))
  const name = dataset.sources.registry.persons.find((person) => person.id === 'K041').name
  const wrongNodes = retainerGraph.nodes.map((node) => node.id === 'K041' ? { ...node, state: 'S16' } : node)
  const wrongCatalog = catalog.map((person) => person.name === name ? { ...person, state: 'S16' } : person)
  assert.throws(() => assertGraphCountries(wrongNodes, wrongCatalog, dataset.sources.registry, dataset.sources.values), /K041/)
})

test('wrong and missing graph endpoints fail canonical validation without rejecting ordinary social cycles', () => {
  const missing = loadDataset()
  missing.config.directRetainers[0].personId = 'K9999'
  assert.match(validate(missing).join('\n'), /missing foreign key K9999/)
  const wrong = loadDataset()
  wrong.config.directRetainers[0].liegePersonId = 'K017'
  assert.match(validate(wrong).join('\n'), /orphan court/)
  const social = loadDataset()
  assert.ok(social.relations.some((edge) => edge.fromPersonId === 'K1008' && edge.toPersonId === 'K1009'))
  assert.ok(social.relations.some((edge) => edge.fromPersonId === 'K1009' && edge.toPersonId === 'K1008'))
  assert.deepEqual(validate(social), [])
})
