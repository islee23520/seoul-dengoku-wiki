import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { test } from 'vitest'
import { RelationsGraphPage, layoutRetainerGraph, selectRetainerRelationships } from '../src/pages/RelationsGraphPage.tsx'
import { retainerGraph } from '../src/generated/retainerGraph.ts'
import { loadDataset } from '../lore/relations/validate.mjs'

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
  assert.equal((html.match(/data-person-id="K\d+"/g) ?? []).length, expectedIds.size)
  assert.equal((html.match(/data-from="K\d+" data-to="K\d+"/g) ?? []).length, dataset.config.directRetainers.length)
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

test('court owner selection exposes incoming members without an upstream liege', () => {
  for (const [id, expectedCount] of [['K002', 13], ['K017', 12], ['K003', 12]]) {
    const selected = selectRetainerRelationships(id)
    assert.equal(selected.court?.ownerPersonId, id)
    assert.equal(selected.liege, undefined, id)
    assert.equal(selected.members.length, expectedCount, id)
    assert.ok(selected.members.every((edge) => edge.toPersonId === id), id)
  }
  assert.ok(selectRetainerRelationships('K002').members.some((edge) => edge.fromPersonId === 'K904'))
  for (const [memberId, ownerId] of [['K041', 'K032'], ['K068', 'K058']]) {
    const member = selectRetainerRelationships(memberId)
    const owner = selectRetainerRelationships(ownerId)
    assert.equal(member.liege?.id, ownerId)
    assert.equal(member.court?.ownerPersonId, ownerId)
    assert.equal(owner.liege, undefined)
    assert.ok(owner.members.some((edge) => edge.fromPersonId === memberId))
  }
})
