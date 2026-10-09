import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { FamilyTree } from '../src/components/FamilyTree.tsx'
import FamiliesPage from '../src/pages/FamiliesPage.tsx'

const detail = async (id) => JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))
const render = (tree) => new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FamilyTree, { tree })))).window.document

test('renders father and mother roles on pair edges and the ledger without changing identities', async () => {
  const source = (await detail('person-0014')).familyTree
  const tree = structuredClone(source)
  const pair = tree.edges.filter((entry) => entry.to === 'K014' && entry.type === 'biological')
  pair[0].parentRole = 'father'
  pair[1].parentRole = 'mother'
  const doc = render(tree)
  for (const [index, label] of ['부', '모'].entries()) {
    const line = [...doc.querySelectorAll('[data-family-edge-id]')].find((node) => node.dataset.familyEdgeId === pair[index].id)
    assert.equal(line.querySelector('text').textContent, label)
    assert.equal(line.dataset.familyParentRole, pair[index].parentRole)
    const row = [...doc.querySelectorAll('[data-family-table-edge]')].find((node) => node.dataset.familyTableEdge === pair[index].id)
    assert.ok(row.textContent.endsWith(' · ' + label))
  }
  assert.equal(doc.querySelectorAll('[data-family-node]').length, source.nodes.length)
  assert.equal(doc.querySelectorAll('[data-family-edge-id]').length, source.edges.length)
})

test('renders sourced Shin father while leaving every other unrecorded edge unlabeled by role', async () => {
  const tree = (await detail('person-1010')).familyTree
  const doc = render(tree)
  const father = doc.querySelector('[data-family-from="K1009"][data-family-to="K1010"]')
  assert.equal(father.dataset.familyParentRole, 'father')
  assert.equal(father.querySelector('text').textContent, '부')
  for (const edge of tree.edges.filter((entry) => entry.type === 'biological' && !entry.parentRole)) {
    const line = [...doc.querySelectorAll('[data-family-edge-id]')].find((node) => node.dataset.familyEdgeId === edge.id)
    assert.equal(line.dataset.familyParentRole, undefined)
    assert.equal(line.querySelector('text').textContent, '친생 · 역할 미기록')
  }
  assert.ok(tree.edges.filter((entry) => entry.type === 'biological' && entry.parentRole).every((edge) => {
    const line = [...doc.querySelectorAll('[data-family-edge-id]')].find((node) => node.dataset.familyEdgeId === edge.id)
    return line.querySelector('text').textContent === (edge.parentRole === 'father' ? '부' : '모')
  }))
})


test('actual Brooks ancestry renders every canonical edge as a line and places four generations', async () => {
  const tree = (await detail('person-0014')).familyTree
  const doc = render(tree)
  assert.equal(doc.querySelectorAll('[data-family-node]').length, tree.nodes.length)
  assert.equal(doc.querySelectorAll('[data-family-edge-id]').length, tree.edges.length)
  for (const edge of tree.edges) {
    const line = [...doc.querySelectorAll('[data-family-edge-id]')].find((node) => node.dataset.familyEdgeId === edge.id)
    assert.ok(line.querySelector('path').getAttribute('d').includes('V'))
    assert.equal(line.dataset.familyFrom, edge.from)
    assert.equal(line.dataset.familyTo, edge.to)
    const parent = doc.querySelector(`[data-family-node="${edge.from}"]`)
    const child = doc.querySelector(`[data-family-node="${edge.to}"]`)
    assert.ok(Number(parent.dataset.familyGeneration) < Number(child.dataset.familyGeneration))
  }
  assert.equal(new Set([...doc.querySelectorAll('[data-family-generation]')].map((node) => node.dataset.familyGeneration)).size, 4)
  assert.equal(doc.querySelector('[data-family-node="K014"] a').getAttribute('href'), '/people/person-0014')
  assert.equal(doc.querySelectorAll('[data-family-edge="spouse"]').length, 0)
})

test('two recorded biological parents form adjacent pairs with one shared descent at every generation', async () => {
  for (const id of ['person-0014', 'person-1010', 'person-0087']) {
    const tree = (await detail(id)).familyTree
    const doc = render(tree)
    const expected = tree.nodes.filter((child) => tree.edges.filter((edge) => edge.to === child.id && edge.type === 'biological').length === 2)
    assert.equal(doc.querySelectorAll('[data-family-parent-pair]').length, expected.length)
    for (const child of expected) {
      const parentIds = tree.edges.filter((edge) => edge.to === child.id && edge.type === 'biological').map((edge) => edge.from)
      const pair = [...doc.querySelectorAll('[data-family-parent-pair]')].find((node) => node.dataset.familyParentPair === child.id)
      assert.deepEqual(pair.dataset.familyPairParents.split(' '), parentIds)
      assert.equal(pair.querySelectorAll('[data-family-shared-descent]').length, 1)
      const nodes = parentIds.map((parent) => doc.querySelector(`[data-family-node="${parent}"]`))
      assert.equal(nodes[0].style.top, nodes[1].style.top)
      const left = nodes.map((node) => parseFloat(node.style.left)).sort((a, b) => a - b)
      assert.ok(left[1] - left[0] >= 180 && left[1] - left[0] <= 300)
      for (const parent of parentIds) assert.ok(doc.querySelector(`[data-family-from="${parent}"][data-family-to="${child.id}"] path`))
    }
    assert.equal(doc.querySelectorAll('[data-family-node]').length, tree.nodes.length)
    assert.equal(doc.querySelectorAll('[data-family-edge-id]').length, tree.edges.length)
    assert.equal(doc.querySelectorAll('[data-family-edge="spouse"]').length, 0)
  }
})

test('source adoption and unknown-parent states stay distinct without invented nodes', async () => {
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8')).persons
  const statuses = JSON.parse(await readFile(new URL('../lore/name-pools/cast-family-parent-status.json', import.meta.url), 'utf8')).records
  const files = JSON.parse((await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')).split(' as const')[0].replace('export const peopleCatalog = ', ''))
  for (const record of statuses) {
    const name = registry.find((person) => person.id === record.personId).name
    const tree = (await detail(files.find((person) => person.name === name).id)).familyTree
    const doc = render(tree)
    assert.equal(doc.querySelectorAll('[data-family-node]').length, tree.nodes.length)
    assert.ok(doc.querySelector('.person-family-tree').textContent.includes('미설정'))
    for (const edge of tree.edges.filter((entry) => entry.type === 'adoptive')) {
      const line = [...doc.querySelectorAll('[data-family-edge-id]')].find((node) => node.dataset.familyEdgeId === edge.id)
      assert.equal(line.querySelector('path').getAttribute('stroke-dasharray'), '6 4')
      assert.ok(line.textContent.includes('입양'))
    }
  }
})

test('missing canonical graph has an explicit empty state', () => {
  const doc = render({ personId: 'K014', nodes: [], edges: [] })
  assert.ok(doc.querySelector('[role="status"]'))
  assert.equal(doc.querySelectorAll('path').length, 0)
})

test('unknown counterpart is visual only for one recorded biological parent, never adoption', async () => {
  for (const id of ['person-0014', 'person-1010', 'person-0087']) {
    const tree = (await detail(id)).familyTree
    const doc = render(tree)
    const single = tree.nodes.filter((node) => tree.edges.filter((edge) => edge.to === node.id && edge.type === 'biological').length === 1)
    assert.deepEqual(new Set([...doc.querySelectorAll('[data-family-unknown-parent]')].map((node) => node.dataset.familyUnknownParent)), new Set(single.map((node) => node.id)))
    for (const placeholder of doc.querySelectorAll('[data-family-unknown-parent]')) {
      assert.equal(placeholder.querySelectorAll('[data-family-node], [data-family-edge-id], a').length, 0)
      assert.ok(placeholder.textContent.includes('미상 부모'))
      const box = placeholder.querySelector('rect')
      const connector = placeholder.querySelector('[data-family-unknown-connector]')
      const x = Number(box.getAttribute('x')) + Number(box.getAttribute('width')) / 2
      const bottom = Number(box.getAttribute('y')) + Number(box.getAttribute('height'))
      assert.equal(connector.getAttribute('d'), `M ${x} ${bottom} V ${bottom + 38}`)
      assert.equal(connector.getAttribute('stroke-dasharray'), '6 4')
      assert.ok(placeholder.querySelector('path:not([data-family-unknown-connector])').getAttribute('d').includes(`H ${x}`))
    }
    assert.equal(doc.querySelectorAll('[data-family-node]').length, tree.nodes.length)
    assert.equal(doc.querySelectorAll('[data-family-edge-id]').length, tree.edges.length)
    if (id === 'person-0087') assert.equal(doc.querySelector('[data-family-unknown-parent="K087"]'), null)
  }
})

test('family selector uses stable public IDs from the actual catalog', () => {
  const doc = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/families?person=person-0014'] }, createElement(FamiliesPage)))).window.document
  assert.equal(doc.querySelector('option[selected]').value, 'person-0014')
  assert.equal(doc.querySelector('option[selected]').textContent, '대니얼 브룩스')
})

test('clan tree renders every node with the current-affiliation flag or honest fallback marker', async () => {
  const tree = JSON.parse(await readFile(new URL('../public/family-trees/ae40-ac15-b989-91d1.json', import.meta.url), 'utf8'))
  const doc = render(tree)
  assert.equal(tree.personId, null)
  assert.equal(doc.querySelector('.person-family-tree').getAttribute('data-family-person-id'), null)
  assert.equal(doc.querySelectorAll('.family-tree-current').length, 0)
  assert.equal(doc.querySelectorAll('[data-family-node]').length, tree.nodes.length)
  assert.equal(doc.querySelectorAll('[data-family-edge-id]').length, tree.edges.length)
  for (const node of tree.nodes) {
    const cell = doc.querySelector(`[data-family-node="${node.id}"] strong`)
    if (!node.affiliation) {
      assert.equal(cell.querySelector('img, .family-tree-affiliation'), null, node.id)
      continue
    }
    if (node.affiliation.kind === 'state') {
      const flag = cell.querySelector('img.state-flag')
      assert.ok(flag, node.id)
      assert.equal(flag.getAttribute('alt'), node.affiliation.name)
      assert.equal(flag.getAttribute('title'), node.affiliation.name)
      assert.ok(flag.getAttribute('src').includes(`state-flags/${node.affiliation.stateId}.webp`), node.id)
      assert.equal(cell.querySelector('.family-tree-affiliation'), null, node.id)
    } else {
      const marker = cell.querySelector('.family-tree-affiliation')
      assert.ok(marker, node.id)
      assert.equal(marker.getAttribute('data-family-affiliation'), node.affiliation.kind)
      assert.equal(marker.textContent, node.affiliation.name)
      assert.equal(cell.querySelector('img'), null, node.id)
    }
    assert.ok(cell.textContent.includes(node.name))
  }
})

test('unaffiliated clan members keep the accessible 무소속 marker', async () => {
  const tree = JSON.parse(await readFile(new URL('../public/family-trees/c9c0-cda9-c8fc.json', import.meta.url), 'utf8'))
  const doc = render(tree)
  const marker = doc.querySelector('[data-family-affiliation="unaffiliated"]')
  assert.ok(marker)
  assert.equal(marker.textContent, '무소속')
  const node = tree.nodes.find((entry) => entry.affiliation?.kind === 'unaffiliated')
  assert.ok(doc.querySelector(`[data-family-node="${node.id}"] strong`).textContent.includes(node.name))
})

test('person selector tree enriches current affiliation without touching person-detail bytes', async () => {
  const { enrichFamilyTreeAffiliations, resolveAffiliation } = await import('../src/familyAffiliation.ts')
  const peopleText = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const people = JSON.parse(peopleText.slice(peopleText.indexOf('= [') + 2, peopleText.lastIndexOf(']') + 1))
  const statesText = await readFile(new URL('../src/generated/stateCatalog.ts', import.meta.url), 'utf8')
  const states = JSON.parse(statesText.slice(statesText.indexOf('= [') + 2, statesText.lastIndexOf(']') + 1))

  const raw = (await detail('person-0014')).familyTree
  assert.ok(raw.nodes.every((node) => node.affiliation === undefined), 'person-detail bytes must stay affiliation-free')
  const enriched = enrichFamilyTreeAffiliations(raw, people, states)
  const brooks = enriched.nodes.find((node) => node.personId === 'K014')
  const brooksPerson = people.find((person) => person.id === 'person-0014')
  assert.deepEqual(brooks.affiliation, resolveAffiliation(brooksPerson, states))
  assert.ok(brooks.affiliation && brooks.affiliation.name.length > 0)
  for (const node of enriched.nodes.filter((entry) => !entry.personId)) assert.equal(node.affiliation, undefined)
  const doc = render(enriched)
  const flag = doc.querySelector('[data-family-node="K014"] strong img.state-flag')
  assert.ok(flag, 'issued person in the selector tree must show the current-affiliation flag')
  assert.equal(flag.getAttribute('alt'), brooks.affiliation.name)
})

test('selector-tree enrichment covers unaffiliated and no-clan people with the honest marker', async () => {
  const { enrichFamilyTreeAffiliations } = await import('../src/familyAffiliation.ts')
  const peopleText = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const people = JSON.parse(peopleText.slice(peopleText.indexOf('= [') + 2, peopleText.lastIndexOf(']') + 1))
  const statesText = await readFile(new URL('../src/generated/stateCatalog.ts', import.meta.url), 'utf8')
  const states = JSON.parse(statesText.slice(statesText.indexOf('= [') + 2, statesText.lastIndexOf(']') + 1))

  for (const [personId, issuedId] of [['person-1003', 'K1003'], ['person-1004', 'K1004']]) {
    const raw = (await detail(personId)).familyTree
    const enriched = enrichFamilyTreeAffiliations(raw, people, states)
    const node = enriched.nodes.find((entry) => entry.personId === issuedId)
    assert.deepEqual(node.affiliation, { kind: 'unaffiliated', name: '무소속' }, personId)
    const doc = render(enriched)
    const marker = doc.querySelector(`[data-family-node="${issuedId}"] strong .family-tree-affiliation`)
    assert.equal(marker.getAttribute('data-family-affiliation'), 'unaffiliated')
    assert.equal(marker.textContent, '무소속')
    for (const historical of enriched.nodes.filter((entry) => !entry.personId)) assert.equal(historical.affiliation, undefined)
  }
})

test('person detail links to the clan tree instead of embedding a genealogy', async () => {
  const { PersonDetailContent } = await import('../src/pages/PersonDetailPage.tsx')
  const renderPerson = async (id) => new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(PersonDetailContent, { detail: await detail(id), personId: id })))).window.document

  const clanPerson = await renderPerson('person-0895')
  assert.ok(!clanPerson.querySelector('.person-family-tree'))
  const clanLink = clanPerson.querySelector('[data-person-clan-id="ae40-ac15-b989-91d1"] a')
  assert.equal(clanLink.getAttribute('href'), '/families/ae40-ac15-b989-91d1')
  assert.equal(clanLink.textContent, '강릉 김씨 가계도')

  const noClan = await renderPerson('person-1004')
  assert.ok(!noClan.querySelector('.person-family-tree'))
  const state = noClan.querySelector('[data-person-no-clan="true"]')
  assert.ok(state.textContent.includes('본관 없음'))
  assert.equal(state.querySelector('a'), null)

  const nonKorean = await renderPerson('person-0014')
  const linked = nonKorean.querySelector('[data-person-no-clan="non-korean-family"]')
  assert.ok(linked.textContent.includes('본관 없음'))
  assert.equal(linked.querySelector('a').getAttribute('href'), '/families#non-korean-families')
})
