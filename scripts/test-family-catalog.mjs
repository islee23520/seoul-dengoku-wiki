import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import FamiliesPage from '../src/pages/FamiliesPage.tsx'
import { projectNonKoreanFamilies } from './non-korean-family-catalog.mjs'

const json = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
const generatedCatalog = async (name) => JSON.parse((await readFile(new URL(`../src/generated/${name}.ts`, import.meta.url), 'utf8'))
  .replace(new RegExp(`^export const ${name} = `), '').replace(/ as const\s*$/u, ''))

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
  const lineage = (await json('lore/name-pools/cast-hangnyeol.json')).people
  const people = (await generatedCatalog('nonKoreanFamilyCatalog')).flatMap((family) => family.members)
  const registry = (await json('lore/name-pools/person-id-registry.json')).persons
  const details = registry.map((person) => {
    const entry = lineage.find((row) => row.name === person.name)
    assert.ok(entry, person.id)
    // Public IDs are resolved through actual generated identity, never registry order.
    return { entry, person }
  })
  const publicByName = new Map(catalog.flatMap((clan) => clan.members).concat(people).map((person) => [person.name, person]))
  const koreanNames = details.filter(({ entry }) => entry.clan && entry.namingConvention !== 'non-korean-lineage').map(({ person }) => person.name)
  const checkMembers = (members) => {
    assert.deepEqual(new Set(members.map((person) => person.name)), new Set(koreanNames))
    assert.equal(members.length, koreanNames.length)
    assert.equal(new Set(members.map((person) => person.id)).size, members.length)
  }
  const members = catalog.flatMap((clan) => clan.members)
  checkMembers(members)
  assert.throws(() => checkMembers(members.slice(1)))
  const branchPeople = lineage.filter((person) => person.base_clan)
  assert.deepEqual(new Set(catalog.flatMap((clan) => clan.branches.flatMap((branch) => branch.members))), new Set(branchPeople.map((person) => publicByName.get(person.name).id)))
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

test('separate non-Korean families preserve every approved key and all cast remain reachable', async () => {
  const lineage = (await json('lore/name-pools/cast-hangnyeol.json')).people
  const registry = (await json('lore/name-pools/person-id-registry.json')).persons
  const korean = await generatedCatalog('clanFamilyCatalog')
  const foreign = await generatedCatalog('nonKoreanFamilyCatalog')
  const expected = lineage.filter((person) => person.namingConvention === 'non-korean-lineage')
  assert.equal(expected.length, 62)
  assert.deepEqual(new Set(foreign.map((family) => family.id)), new Set(expected.map((person) => person.clan)))
  const checkForeign = (families) => {
    assert.deepEqual(new Set(families.flatMap((family) => family.members.map((person) => person.name))), new Set(expected.map((person) => person.name)))
    assert.equal(families.flatMap((family) => family.members).length, expected.length)
    for (const family of families) {
      assert.ok(!('bongwan' in family) && !('crest' in family) && !('clanId' in family))
      for (const person of family.members) {
        const source = expected.find((row) => row.name === person.name)
        assert.equal(family.id, source.clan)
        assert.equal(family.surname, source.surname)
        assert.equal(family.basis, source.reason)
        assert.deepEqual(family.sourceRef, source.namingConventionSource)
        assert.equal(registry.find((row) => row.id === family.sourceRef.characterId)?.name, person.name)
        assert.equal(person.detailRoute, `/people/${person.id}`)
      }
    }
  }
  checkForeign(foreign)
  assert.throws(() => checkForeign(foreign.slice(1)))
  const allMembers = korean.flatMap((family) => family.members).concat(foreign.flatMap((family) => family.members))
  assert.equal(new Set(allMembers.map((person) => person.id)).size, allMembers.length)
  assert.deepEqual(new Set(allMembers.map((person) => person.name)), new Set(lineage.filter((person) => person.clan).map((person) => person.name)))
  const noClan = lineage.filter((person) => !person.clan).map((person) => person.name)
  assert.deepEqual(new Set(noClan), new Set(['이연', '고예진', '한서경', '차유선', '문도현']))
  const peopleText = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const people = JSON.parse(peopleText.split(' as const')[0].replace(/^export const peopleCatalog = /u, ''))
  const publicByName = new Map(people.map((person) => [person.name, person]))
  for (const member of allMembers) assert.equal(member.id, publicByName.get(member.name)?.id, member.name)
  assert.deepEqual(foreign, projectNonKoreanFamilies(people, new Map(lineage.map((person) => [person.name, person]))))
  assert.deepEqual(new Set(people.map((person) => person.name)), new Set(registry.map((person) => person.name)))
  const parentStatuses = (await json('lore/name-pools/cast-family-parent-status.json')).records
  for (const person of people) {
    const detail = await json(`public/person-details/${person.id}.json`)
    const issued = registry.find((row) => row.name === person.name)
    assert.equal(detail.gurps.id, issued.id)
    assert.equal(detail.name, issued.name)
    assert.ok(detail.familyTree.nodes.some((node) => node.personId === issued.id && node.name === issued.name))
    assert.equal(detail.familyTree.parentStatus, parentStatuses.find((row) => row.personId === issued.id)?.status ?? null)
    if (noClan.includes(person.name) || expected.some((row) => row.name === person.name)) assert.equal(detail.clan, null)
  }
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FamiliesPage)))
  for (const family of foreign) for (const person of family.members) {
    assert.ok(html.includes(`href="${person.detailRoute}"`), person.name)
    assert.ok(html.includes(person.name), person.name)
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
