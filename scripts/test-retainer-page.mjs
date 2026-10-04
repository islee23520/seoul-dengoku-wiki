import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { peopleCatalog } from '../src/generated/peopleCatalog.ts'
import { test } from 'vitest'
import { RelationsGraphPage, layoutRetainerGraph, selectRetainerRelationships } from '../src/pages/RelationsGraphPage.tsx'
import { retainerGraph } from '../src/generated/retainerGraph.ts'
import { loadDataset, validate } from '../lore/relations/validate.mjs'

test('graph page renders generated directed court edges and all approved people', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RelationsGraphPage)))
  assert.match(html, /data-person-id="K904"/)
  assert.match(html, /data-from="K904" data-to="K002"/)
  assert.match(html, /data-person-id="K002"/)
  assert.match(html, /data-from="K041" data-to="K032"/)
  assert.match(html, /data-from="K068" data-to="K058"/)
  const dataset = loadDataset()
  const expectedIds = new Set(dataset.config.courts.map((court) => court.ownerPersonId))
  for (const edge of dataset.config.directRetainers) {
    expectedIds.add(edge.personId)
    expectedIds.add(edge.liegePersonId)
  }
  for (const edge of dataset.config.ownerLieges.edges) {
    expectedIds.add(edge.personId)
    expectedIds.add(edge.liegePersonId)
  }
  assert.match(html, /data-person-id="K001"/)
  assert.match(html, /data-person-id="K1005"/)
  assert.match(html, /data-from="K002" data-to="K001"/)
  assert.match(html, /data-from="K062" data-to="K1005"/)
  assert.equal((html.match(/data-person-id="K\d+"/g) ?? []).length, expectedIds.size)
  assert.equal((html.match(/data-from="K\d+" data-to="K\d+"/g) ?? []).length,
    dataset.config.directRetainers.length + dataset.config.ownerLieges.edges.length)
})

test('page rejects a missing approved relationship from the actual source set', () => {
  const dataset = loadDataset()
  const missing = dataset.config.directRetainers.find((row) => row.personId === 'K041')
  assert.ok(missing)
  const graphWithoutApprovedEdge = { ...retainerGraph, edges: retainerGraph.edges.filter((edge) => edge.fromPersonId !== missing.personId) }
  assert.throws(() => layoutRetainerGraph(graphWithoutApprovedEdge), /E_RETAINER_GRAPH_UNRESOLVED/)
})

test('page consumer rejects missing, wrong and orphaned graph endpoints', () => {
  const missing = { ...retainerGraph, nodes: retainerGraph.nodes.filter((node) => node.id !== 'K904') }
  assert.throws(() => layoutRetainerGraph(missing), /E_RETAINER_GRAPH_EDGE:K904/)
  const wrong = { ...retainerGraph, edges: retainerGraph.edges.map((edge) => edge.fromPersonId === 'K904'
    ? { ...edge, toPersonId: 'K017' } : edge) }
  assert.throws(() => layoutRetainerGraph(wrong), /E_RETAINER_GRAPH_EDGE:K904/)
  const orphaned = { ...retainerGraph, edges: retainerGraph.edges.map((edge) => edge.fromPersonId === 'K904'
    ? { ...edge, courtId: 'court:K9999' } : edge) }
  assert.throws(() => layoutRetainerGraph(orphaned), /E_RETAINER_GRAPH_UNRESOLVED/)
})

test('member selection resolves its outgoing liege and canonical court', () => {
  const selected = selectRetainerRelationships('K904')
  assert.equal(selected.court?.id, 'court:K002')
  assert.equal(selected.liege?.id, 'K002')
  assert.equal(selected.liege?.detailRoute, '/people/person-0002')
  assert.equal(selected.members.length, 0)
})

test('court owner selection exposes incoming members and the approved owner liege where decided', () => {
  for (const [id, expectedCount] of [['K002', 13], ['K017', 12], ['K003', 12]]) {
    const selected = selectRetainerRelationships(id)
    assert.equal(selected.court?.ownerPersonId, id)
    assert.equal(selected.liege?.id, 'K001', id)
    assert.equal(selected.relationKind, 'direct-liege', id)
    assert.equal(selected.ownerTerm, '직속 주군', id)
    assert.equal(selected.members.filter((edge) => edge.courtId !== null).length, expectedCount, id)
    assert.ok(selected.members.every((edge) => edge.toPersonId === id), id)
  }
  assert.ok(selectRetainerRelationships('K002').members.some((edge) => edge.fromPersonId === 'K904'))
  for (const [id] of [['K032'], ['K033'], ['K037']]) {
    const selected = selectRetainerRelationships(id)
    assert.equal(selected.court?.ownerPersonId, id)
    assert.equal(selected.liege?.id, 'K029', id)
    assert.equal(selected.relationKind, 'direct-liege', id)
    assert.equal(selected.ownerTerm, '직속 주군', id)
  }
  for (const [id] of [['K058'], ['K060'], ['K061'], ['K062']]) {
    const selected = selectRetainerRelationships(id)
    assert.equal(selected.liege?.id, 'K1005', id)
    assert.equal(selected.ownerTerm, '직속 가신', id)
  }
  const ruler = selectRetainerRelationships('K001')
  assert.equal(ruler.court, undefined)
  assert.equal(ruler.liege, undefined)
  assert.equal(ruler.members.length, 3)
  assert.ok(ruler.members.every((edge) => edge.courtId === null))
  const chairman = selectRetainerRelationships('K1005')
  assert.equal(chairman.liege, undefined)
  assert.equal(chairman.members.length, 4)
  for (const [memberId, ownerId] of [['K041', 'K032'], ['K068', 'K058']]) {
    const member = selectRetainerRelationships(memberId)
    assert.equal(member.liege?.id, ownerId)
    assert.equal(member.court?.ownerPersonId, ownerId)
    assert.equal(member.relationKind, undefined)
  }
})

test('S02 selection keeps the approved ancestor path and one direct member per owner', () => {
  const root = selectRetainerRelationships('K029')
  assert.equal(root.liege, undefined)
  assert.deepEqual(root.members.map((edge) => edge.fromPersonId), ['K032', 'K037', 'K033'])
  for (const [memberId, ownerId] of [['K041', 'K032'], ['K047', 'K037'], ['K049', 'K033']]) {
    const member = selectRetainerRelationships(memberId)
    assert.equal(member.liege?.id, ownerId)
    assert.equal(member.court?.id, `court:${ownerId}`)
    const owner = selectRetainerRelationships(member.liege.id)
    assert.equal(owner.liege?.id, 'K029')
    assert.deepEqual(owner.members.map((edge) => edge.fromPersonId), [memberId])
    assert.equal(layoutRetainerGraph(retainerGraph).filter((node) => node.id === ownerId).length, 1)
  }
})

test('graph layout keeps one identity per person when a court edge and an owner-liege edge coexist', () => {
  const dataset = loadDataset()
  const duplicate = loadDataset()
  duplicate.config.courts.push({ id: 'court:K009', ownerPersonId: 'K009', stateId: 'S01' })
  duplicate.config.directRetainers.push({ personId: 'K017', liegePersonId: 'K009', courtId: 'court:K009', sourceRow: 14 })
  assert.match(validate(duplicate).join('\n'), /K017: duplicate immediate liege/, 'a second immediate liege must stay structurally invalid')
  const issued = dataset.sources.registry.persons.find((person) => person.id === 'K009')
  const value = dataset.sources.values.people.find((person) => person.name === issued.name)
  const detailRoute = peopleCatalog.find((person) => person.name === issued.name)?.detailRoute
  assert.ok(detailRoute)
  const graph = {
    nodes: [...retainerGraph.nodes, { id: issued.id, name: issued.name, state: value.state, detailRoute }],
    edges: [...retainerGraph.edges, { fromPersonId: 'K017', toPersonId: 'K009', courtId: 'court:K009' }],
    courts: [...retainerGraph.courts, { id: 'court:K009', ownerPersonId: 'K009', stateId: 'S01' }],
  }
  const positioned = layoutRetainerGraph(graph)
  assert.equal(positioned.length, graph.nodes.length)
  assert.equal(positioned.filter((node) => node.id === 'K017').length, 1)
  assert.equal(positioned.find((node) => node.id === 'K017')?.y, layoutRetainerGraph(retainerGraph).find((node) => node.id === 'K017')?.y)
  const owner = selectRetainerRelationships('K017', graph)
  assert.equal(owner.court?.id, 'court:K017')
  assert.equal(owner.liege?.id, 'K009')
  assert.equal(owner.members.length, 12)
})
