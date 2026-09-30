import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { retainerGraph } from '../src/generated/retainerGraph.ts'
import { loadDataset, validate } from '../lore/relations/validate.mjs'

test('generated court graph resolves approved direct retainers to actual detail routes', async () => {
  const dataset = loadDataset()
  assert.deepEqual(validate(dataset), [])
  const catalogSource = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const catalog = JSON.parse(catalogSource.replace(/^export const peopleCatalog = /u, '').replace(/ as const[\s\S]*$/u, ''))
  const byName = new Map(catalog.map((person) => [person.name, person]))
  const issued = new Map(dataset.sources.registry.persons.map((person) => [person.id, person]))
  const expectedIds = new Set(dataset.config.courts.map((court) => court.ownerPersonId))
  for (const edge of dataset.config.directRetainers) expectedIds.add(edge.personId)

  assert.equal(retainerGraph.nodes.length, 40)
  assert.deepEqual(new Set(retainerGraph.nodes.map((node) => node.id)), expectedIds)
  assert.deepEqual(retainerGraph.courts, dataset.config.courts)
  assert.deepEqual(retainerGraph.edges, dataset.config.directRetainers.map(({ personId, liegePersonId, courtId }) =>
    ({ fromPersonId: personId, toPersonId: liegePersonId, courtId })))
  for (const node of retainerGraph.nodes) {
    const person = byName.get(issued.get(node.id)?.name)
    assert.ok(person, node.id)
    assert.deepEqual(node, { id: node.id, name: person.name, state: person.state, detailRoute: person.detailRoute })
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${person.id}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, node.name)
    assert.equal(node.detailRoute, `/people/${detail.id}`)
  }
  assert.deepEqual(retainerGraph.edges.find((edge) => edge.fromPersonId === 'K904'),
    { fromPersonId: 'K904', toPersonId: 'K002', courtId: 'court:K002' })
  assert.equal(retainerGraph.nodes.find((node) => node.id === 'K904')?.detailRoute, '/people/person-0904')
  assert.equal(retainerGraph.nodes.find((node) => node.id === 'K002')?.detailRoute, '/people/person-0002')
  assert.ok(!retainerGraph.nodes.some((node) => node.id === 'K272'))
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
