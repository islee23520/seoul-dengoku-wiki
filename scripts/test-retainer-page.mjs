import assert from 'node:assert/strict'
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
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
  for (const node of retainerGraph.nodes) expectedIds.add(node.id)
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

test('layout retains a person when its relationship is absent without inventing an edge', () => {
  const dataset = loadDataset()
  const missing = dataset.config.directRetainers.find((row) => row.personId === 'K041')
  assert.ok(missing)
  const graphWithoutApprovedEdge = { ...retainerGraph, edges: retainerGraph.edges.filter((edge) => edge.fromPersonId !== missing.personId) }
  const positioned = layoutRetainerGraph(graphWithoutApprovedEdge)
  assert.equal(positioned.filter((node) => node.id === missing.personId).length, 1)
  assert.deepEqual(graphWithoutApprovedEdge.edges, retainerGraph.edges.filter((edge) => edge.fromPersonId !== missing.personId))
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
  assert.equal(ruler.court?.id, 'court:K001')
  assert.equal(ruler.liege, undefined)
  assert.equal(ruler.members.length, 4)
  assert.deepEqual(ruler.members.filter(edge => edge.courtId === 'court:K001').map(edge => edge.fromPersonId), ['K003', 'K004'])
  const dispatcher = selectRetainerRelationships('K009')
  assert.equal(dispatcher.court?.id, 'court:K009')
  assert.equal(dispatcher.liege, undefined)
  assert.deepEqual(dispatcher.members.map(edge => edge.fromPersonId), ['K005'])
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

test('isolated fixture retains every identity at finite distinct deterministic coordinates', () => {
  const graph = { nodes: retainerGraph.nodes.slice(0, 7), edges: [], courts: [] }
  const before = structuredClone(graph)
  const positioned = layoutRetainerGraph(graph)
  assert.deepEqual(new Set(positioned.map((node) => node.id)), new Set(graph.nodes.map((node) => node.id)))
  assert.equal(new Set(positioned.map((node) => `${node.x},${node.y}`)).size, graph.nodes.length)
  assert.ok(positioned.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)))
  assert.deepEqual(positioned, layoutRetainerGraph({ ...graph, nodes: [...graph.nodes].reverse() }))
  assert.deepEqual(graph, before)
})

test('actual graph retains all nodes and edges and frames isolated holders', () => {
  const before = structuredClone(retainerGraph)
  const positioned = layoutRetainerGraph(retainerGraph)
  assert.equal(positioned.length, retainerGraph.nodes.length)
  assert.equal(new Set(positioned.map((node) => node.id)).size, retainerGraph.nodes.length)
  assert.ok(positioned.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)))
  assert.deepEqual(retainerGraph, before)
  const connectedIds = new Set(retainerGraph.edges.flatMap((edge) => [edge.fromPersonId, edge.toPersonId]))
  const connectedGraph = { ...retainerGraph, nodes: retainerGraph.nodes.filter((node) => connectedIds.has(node.id)) }
  assert.deepEqual(positioned.filter((node) => connectedIds.has(node.id)), layoutRetainerGraph(connectedGraph))
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RelationsGraphPage)))
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const [x, y, width, height] = doc.querySelector('svg').getAttribute('viewBox').split(' ').map(Number)
  for (const node of positioned) {
    assert.ok(node.x - 8 >= x && node.x + 10 + node.name.length * 11 <= x + width, node.id)
    assert.ok(node.y - 8 >= y && node.y + 8 <= y + height, node.id)
  }
  assert.deepEqual([...doc.querySelectorAll('line')].map((line) => [line.dataset.from, line.dataset.to]),
    retainerGraph.edges.map((edge) => [edge.fromPersonId, edge.toPersonId]))
})

test('invalid and duplicate IDs and missing owner-liege endpoints remain errors', () => {
  const graph = { nodes: retainerGraph.nodes.slice(0, 1), edges: [], courts: [] }
  assert.throws(() => layoutRetainerGraph({ ...graph, nodes: [...graph.nodes, ...graph.nodes] }), /E_RETAINER_GRAPH_UNRESOLVED/)
  assert.throws(() => layoutRetainerGraph({ ...graph, nodes: [{ ...graph.nodes[0], id: '' }] }), /E_RETAINER_GRAPH_UNRESOLVED/)
  assert.throws(() => layoutRetainerGraph({ ...graph, edges: [{ fromPersonId: graph.nodes[0].id, toPersonId: 'K9999', courtId: null }] }), /E_RETAINER_GRAPH_LIEGE:K9999/)
})

test('search and selection retain isolated holder detail navigation without inferred relationships', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  const root = createRoot(host)
  const holder = retainerGraph.nodes.find((node) => node.id === 'K144')
  assert.ok(holder)
  try {
    await act(async () => root.render(createElement(MemoryRouter, null, createElement(RelationsGraphPage))))
    const input = host.querySelector('input[type=search]')
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, holder.id)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    assert.equal(host.querySelectorAll('[data-person-id]').length, 1)
    await act(async () => host.querySelector('[data-person-id="K144"]').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    const section = host.querySelector('section')
    assert.ok(section)
    assert.equal(section.querySelector('a').getAttribute('href'), holder.detailRoute)
    assert.equal(section.querySelectorAll('p').length, 0)
    assert.equal(host.querySelector('[data-person-id="K144"] circle').getAttribute('r'), '8')
    await act(async () => host.querySelector('[data-person-id="K144"]').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    assert.equal(host.querySelector('section'), null)
  } finally {
    await act(async () => root.unmount())
  }
})

test('graph layout keeps one identity per person when a court edge and an owner-liege edge coexist', () => {
  const dataset = loadDataset()
  const duplicate = loadDataset()
  duplicate.config.directRetainers.push({ personId: 'K017', liegePersonId: 'K009', courtId: 'court:K009', sourceRow: 14 })
  assert.match(validate(duplicate).join('\n'), /K017: duplicate immediate liege/, 'a second immediate liege must stay structurally invalid')
  const issued = dataset.sources.registry.persons.find((person) => person.id === 'K009')
  const detailRoute = peopleCatalog.find((person) => person.name === issued.name)?.detailRoute
  assert.ok(detailRoute)
  const graph = {
    nodes: retainerGraph.nodes,
    edges: [...retainerGraph.edges, { fromPersonId: 'K017', toPersonId: 'K009', courtId: 'court:K009' }],
    courts: retainerGraph.courts,
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
