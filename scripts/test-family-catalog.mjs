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
  assert.equal(catalog.length, 177)
  assert.deepEqual(new Set(catalog.map((clan) => clan.id)), new Set(base.map((clan) => clan.id)))
  assert.deepEqual(new Set(catalog.flatMap((clan) => clan.branches.map((branch) => branch.id))), new Set(branches.map((branch) => branch.id)))
  assert.equal(catalog.flatMap((clan) => clan.members).length, 1018)
  assert.equal(new Set(catalog.flatMap((clan) => clan.members.map((person) => person.id))).size, 1018)
  assert.equal(catalog.flatMap((clan) => clan.branches.flatMap((branch) => branch.members)).length, 554)
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

test('Jeonui Lee has one family and retains its four people and generation facts', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/name-pools/cast-hangnyeol.json', import.meta.url), 'utf8'))
  const generated = await readFile(new URL('../src/generated/clanFamilyCatalog.ts', import.meta.url), 'utf8')
  const catalog = JSON.parse(generated.replace(/^export const clanFamilyCatalog = /u, '').replace(/ as const\s*$/u, ''))
  const id = 'c774-c804-c758-674e'
  const family = catalog.filter((clan) => clan.surname === '이' && clan.bongwan === '전의')
  assert.equal(family.length, 1)
  assert.equal(family[0].id, id)
  assert.deepEqual(family[0].branches, [])
  assert.deepEqual(new Set(family[0].members.map((person) => person.id)), new Set(['person-0092', 'person-0742', 'person-0819', 'person-0998']))
  assert.ok(family[0].members.every((person) => person.branchId === null))
  const people = source.people.filter((person) => person.bongwan === '전의' && person.surname === '이')
  assert.equal(people.length, 4)
  assert.ok(people.every((person) => person.clan === id && !('base_clan' in person)))
  const ilseop = people.find((person) => person.name === '이일섭')
  assert.equal(ilseop.branch, '청강공파')
  assert.deepEqual(people.filter((person) => person.hangnyeol === '민').map((person) => person.branch), ['민 항렬 재합의 가계', '민 항렬 재합의 가계'])
  assert.deepEqual([ilseop.sesu, ilseop.hangnyeol, ilseop.position], [33, '섭', 'second'])
  assert.equal(source.lineage.person_clan['이일섭'], id)
  assert.equal(source.lineage.parents['이일섭'], '이상계')
  assert.equal(source.lineage.parents['이상계'], '이호계')
  assert.equal(source.lineage.founder_sesu['이호계'], 31)
})
