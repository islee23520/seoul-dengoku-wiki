import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { makeArtSourcePacket, resolveArtPerson } from '../src/pages/personArtSource'

test('art handoff follows the published person identity rather than the K number', async () => {
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-0145.json', import.meta.url), 'utf8'))
  const entry = registry.persons.find((person) => person.id === 'K144')
  const catalog = [{ id: detail.id, name: detail.name, detailRoute: detail.detailRoute }]

  assert.equal(entry.name, detail.name)
  assert.equal(resolveArtPerson('person-0145', catalog)?.name, entry.name)
  assert.deepEqual(makeArtSourcePacket(catalog[0], detail), {
    schemaVersion: 1, personId: detail.id, name: detail.name,
    sourceRoute: detail.sourceRoute, fields: detail.fields, sections: detail.sections,
  })
})

test('missing and unknown IDs cannot select another person', () => {
  const catalog = [{ id: 'person-0145', name: '윤서린', detailRoute: '/people/person-0145' }]
  assert.equal(resolveArtPerson(null, catalog), null)
  assert.equal(resolveArtPerson('person-9999', catalog), null)
  assert.equal(resolveArtPerson('K144', catalog), null)
})

test('art packet rejects mismatched detail data', () => {
  const selected = { id: 'person-0145', name: '윤서린', detailRoute: '/people/person-0145' }
  const detail = { id: 'person-0145', name: '윤서린', sourceRoute: '/world/Core-Characters', fields: {}, sections: {} }
  assert.equal(makeArtSourcePacket(selected, { ...detail, id: 'person-0144' }), null)
  assert.equal(makeArtSourcePacket(selected, { ...detail, name: '다른 인물' }), null)
})
