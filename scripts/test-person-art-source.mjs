import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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

test('every published portrait token matches the current person identity and authored gender', async () => {
  const catalog = JSON.parse(await readFile(new URL('../portrait-catalog.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  for (const entry of catalog.entries) {
    const token = JSON.parse(await readFile(new URL(`../public/portrait-tokens/${entry.personId}.json`, import.meta.url), 'utf8'))
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${entry.personId}.json`, import.meta.url), 'utf8'))
    const permanent = registry.persons.find(person => person.id === entry.characterId)
    assert.equal(permanent?.name, detail.name, entry.characterId)
    assert.equal(entry.name, detail.name, entry.personId)
    assert.equal(token.personId, detail.id)
    assert.equal(token.characterId, entry.characterId)
    assert.equal(token.name, detail.name)
    assert.equal(token.facts.gender, detail.gender, entry.personId)
    assert.equal(token.approval, 'art-proposal')
    const image = await readFile(new URL(`../public/portraits/${entry.personId}.png`, import.meta.url))
    assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), entry.personId)
    const hash = createHash('sha256').update(image).digest('hex')
    assert.equal(hash, token.image.sha256, entry.personId)
    assert.equal(hash, entry.imageSha256, entry.personId)
  }
})
