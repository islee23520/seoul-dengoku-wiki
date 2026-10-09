import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'vitest'

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
const readGenerated = async (name) => {
  const raw = await readFile(new URL(`../src/generated/${name}.ts`, import.meta.url), 'utf8')
  const body = raw.slice(raw.indexOf(`export const ${name}`))
  return JSON.parse(body.slice(body.indexOf('[', body.indexOf('=')), body.lastIndexOf(']') + 1))
}

const catalog = await readGenerated('clanFamilyCatalog')
const stateCatalog = await readGenerated('stateCatalog')
const treeDir = new URL('../public/family-trees/', import.meta.url)
const treeFiles = new Set((await readdir(treeDir)).filter((name) => name.endsWith('.json')))

// Same derivation as generate-catalog.mjs, recomputed from the current generated state contract so a
// future canon merge moves the flags without touching this test.
const expectedAffiliation = (person, states) => {
  if (person.state === 'S00') return { kind: 'unaffiliated', name: '무소속' }
  if (person.state === 'polity:daejeon') return { kind: 'neutral', name: person.stateName }
  const hegemon = states.find((entry) => entry.id === person.state)?.currentHegemon
  if (!hegemon) throw new Error(`affiliation missing for ${person.state}`)
  if (hegemon.kind === 'state') return { kind: 'state', stateId: hegemon.stateId, name: hegemon.name }
  if (hegemon.kind === 'union') return { kind: 'union', name: hegemon.name }
  return { kind: 'neutral', name: person.stateName }
}

const detailCache = new Map()
const detail = async (personId) => {
  if (!detailCache.has(personId)) detailCache.set(personId, await readJson(`public/person-details/${personId}.json`))
  return detailCache.get(personId)
}

test('every clan with members ships one tree file and zero-member clans ship none', async () => {
  const withMembers = catalog.filter((clan) => clan.members.length > 0)
  assert.equal(treeFiles.size, withMembers.length)
  for (const clan of withMembers) assert.ok(treeFiles.has(`${clan.id}.json`), clan.id)
  for (const clan of catalog.filter((clan) => clan.members.length === 0)) assert.ok(!treeFiles.has(`${clan.id}.json`), clan.id)
})

test('clan tree is the union of member person projections with no invented links', async () => {
  for (const clan of catalog.filter((entry) => entry.members.length > 0)) {
    const tree = await readJson(`public/family-trees/${clan.id}.json`)
    assert.equal(tree.clanId, clan.id)
    assert.equal(tree.personId, null)
    const expectedNodes = new Map()
    const expectedEdges = new Map()
    for (const member of clan.members) {
      const projection = (await detail(member.id)).familyTree
      assert.ok(projection.nodes.some((node) => node.personId === projection.personId), `${clan.id}:${member.id}`)
      for (const node of projection.nodes) if (!expectedNodes.has(node.id)) expectedNodes.set(node.id, node)
      for (const edge of projection.edges) if (!expectedEdges.has(edge.id)) expectedEdges.set(edge.id, edge)
    }
    assert.deepEqual([...expectedNodes.keys()].sort(), tree.nodes.map((node) => node.id).sort(), clan.id)
    assert.deepEqual([...expectedEdges.keys()].sort(), tree.edges.map((edge) => edge.id).sort(), clan.id)
    const nodeIds = new Set(tree.nodes.map((node) => node.id))
    for (const edge of tree.edges) {
      const expected = expectedEdges.get(edge.id)
      assert.ok(expected, `${clan.id}:${edge.id}`)
      assert.deepEqual({ from: edge.from, to: edge.to, type: edge.type, parentRole: edge.parentRole ?? null },
        { from: expected.from, to: expected.to, type: expected.type, parentRole: expected.parentRole ?? null })
      assert.ok(nodeIds.has(edge.from) && nodeIds.has(edge.to), `${clan.id}:${edge.id}`)
    }
    for (const node of tree.nodes) {
      const expected = expectedNodes.get(node.id)
      assert.equal(node.name, expected.name, `${clan.id}:${node.id}`)
      assert.equal(node.birthDate, expected.birthDate, `${clan.id}:${node.id}`)
      assert.equal(node.personId ?? null, expected.personId ?? null, `${clan.id}:${node.id}`)
    }
    assert.equal(nodeIds.size, tree.nodes.length)
  }
})

test('every issued person node carries an affiliation derived from the current state contract', async () => {
  const flags = new Set((await readdir(new URL('../public/state-flags/', import.meta.url))).map((name) => name.replace(/\.webp$/u, '')))
  for (const file of treeFiles) {
    const tree = await readJson(`public/family-trees/${file}`)
    for (const node of tree.nodes) {
      if (!node.personId) {
        assert.equal(node.affiliation, undefined, `${file}:${node.id}`)
        continue
      }
      const person = await detail(node.detailRoute.replace(/^\/people\//u, ''))
      assert.deepEqual(node.affiliation, expectedAffiliation(person, stateCatalog), `${file}:${node.id}`)
      if (node.affiliation.kind === 'state') {
        assert.ok(/^S(?:0[1-9]|1[0-6])$/u.test(node.affiliation.stateId), `${file}:${node.id}`)
        assert.ok(flags.has(node.affiliation.stateId), `${file}:${node.id}:${node.affiliation.stateId}`)
      } else {
        assert.ok(['union', 'neutral', 'unaffiliated'].includes(node.affiliation.kind) && node.affiliation.name.length > 0)
      }
    }
  }
})

test('namesakes keep distinct stable IDs inside every clan tree', async () => {
  for (const file of treeFiles) {
    const tree = await readJson(`public/family-trees/${file}`)
    const byId = new Set()
    const names = new Map()
    for (const node of tree.nodes) {
      assert.ok(!byId.has(node.id), `${file}:${node.id}`)
      byId.add(node.id)
      names.set(node.name, [...(names.get(node.name) ?? []), node.id])
    }
    for (const [name, ids] of names) assert.equal(new Set(ids).size, ids.length, `${file}:${name}`)
    assert.equal(new Set(tree.edges.map((edge) => edge.id)).size, tree.edges.length)
  }
})

test('people without a bongwan stay outside every clan tree', async () => {
  const lineage = (await readJson('lore/name-pools/cast-hangnyeol.json')).people
  const registry = (await readJson('lore/name-pools/person-id-registry.json')).persons
  const noClanNames = new Set(lineage.filter((person) => !person.clan).map((person) => person.name))
  assert.deepEqual([...noClanNames].sort(), ['고예진', '문도현', '이연', '차유선', '한서경'].sort(), 'no-clan roster drifted')
  const excluded = new Set(registry.filter((person) => noClanNames.has(person.name)).map((person) => person.id))
  for (const file of treeFiles) {
    const tree = await readJson(`public/family-trees/${file}`)
    for (const node of tree.nodes) {
      assert.ok(!excluded.has(node.personId), `${file}:${node.personId} has no clan and must not appear in a clan tree`)
      if (node.personId) {
        const person = lineage.find((row) => row.name === node.name)
        assert.ok(person?.clan, `${file}:${node.id} must be a clan-lineage person`)
      }
    }
  }
})
