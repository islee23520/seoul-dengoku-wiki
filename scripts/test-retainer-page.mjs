import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { test } from 'vitest'
import { RelationsGraphPage, layoutRetainerGraph, selectRetainerRelationships } from '../src/pages/RelationsGraphPage.tsx'
import { retainerGraph } from '../src/generated/retainerGraph.ts'

test('graph page renders generated directed court edges and all approved people', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RelationsGraphPage)))
  assert.match(html, /data-person-id="K904"/)
  assert.match(html, /data-from="K904" data-to="K002"/)
  assert.match(html, /data-person-id="K002"/)
  assert.equal((html.match(/data-person-id="K\d+"/g) ?? []).length, 40)
  assert.equal((html.match(/data-from="K\d+" data-to="K\d+"/g) ?? []).length, 37)
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
})
