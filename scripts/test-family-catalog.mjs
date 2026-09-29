import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('family catalog preserves base clans, inferred branches, crest IDs and person links', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/name-pools/clan-hangnyeol-tables.json', import.meta.url), 'utf8'))
  const crests = JSON.parse(await readFile(new URL('../public/clan-crests/index.json', import.meta.url), 'utf8'))
  const generated = await readFile(new URL('../src/generated/clanFamilyCatalog.ts', import.meta.url), 'utf8')
  const catalog = JSON.parse(generated.replace(/^export const clanFamilyCatalog = /u, '').replace(/ as const\s*$/u, ''))
  const base = source.clans.filter((clan) => !clan.id.includes('-agreed-'))
  const branches = source.clans.filter((clan) => clan.id.includes('-agreed-'))
  assert.equal(catalog.length, 176)
  assert.deepEqual(new Set(catalog.map((clan) => clan.id)), new Set(base.map((clan) => clan.id)))
  assert.deepEqual(new Set(catalog.flatMap((clan) => clan.branches.map((branch) => branch.id))), new Set(branches.map((branch) => branch.id)))
  assert.equal(catalog.flatMap((clan) => clan.members).length, 1018)
  assert.equal(new Set(catalog.flatMap((clan) => clan.members.map((person) => person.id))).size, 1018)
  assert.equal(catalog.flatMap((clan) => clan.branches.flatMap((branch) => branch.members)).length, 556)
  const crestIds = new Set(crests.crests.map((crest) => crest.id))
  for (const clan of catalog) {
    assert.ok(crestIds.has(clan.id), clan.id)
    for (const person of clan.members) assert.equal(person.detailRoute, `/people/${person.id}`)
    for (const branch of clan.branches) {
      assert.equal(branch.status, '추론')
      assert.deepEqual(new Set(branch.members), new Set(clan.members.filter((person) => person.branchId === branch.id).map((person) => person.id)))
    }
  }
})
