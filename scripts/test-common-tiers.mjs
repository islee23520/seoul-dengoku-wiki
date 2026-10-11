import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'vitest'

test('all registered people have a common T1-T5 tier', async () => {
  const root = new URL('../public/person-details/', import.meta.url)
  const files = (await readdir(root)).filter((name) => name.endsWith('.json'))
  const registry = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  assert.equal(files.length, registry.persons.length)
  for (const file of files) {
    const person = JSON.parse(await readFile(new URL(file, root), 'utf8'))
    assert.match(person.commonTier, /^T[1-5]$/u, file)
  }
})

test('people page filters by common tier and not by position', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /공통 티어/)
  assert.match(page, /commonTier/)
  assert.doesNotMatch(page, /직위<select/)
})

test('approved opening offices promote exact people without changing their preserved stats', async () => {
  const appointments = JSON.parse(await readFile(new URL('../lore/relations/opening-office-appointments.json', import.meta.url), 'utf8')).appointments
  const people = JSON.parse(await readFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url), 'utf8')).people
  for (const row of appointments) {
    const person = people.find(person => person.id === row.personId)
    assert.ok(person)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${person.url.split('/').pop()}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.characterId, row.personId)
    assert.equal(detail.commonTier, row.commonTier)
    assert.equal(detail.position, row.position.ko)
    assert.equal(detail.rank, row.rank.ko)
    assert.equal(detail.state, row.stateId)
    assert.equal(detail.personSheet.variants.length, 2)
    assert.ok(detail.personSheet.variants.every(variant => variant.legacy.operative === false))
  }
})
