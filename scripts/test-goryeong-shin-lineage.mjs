import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

const root = new URL('../', import.meta.url)
const lineage = JSON.parse(await readFile(new URL('lore/name-pools/cast-hangnyeol.json', root), 'utf8'))
const generated = await readFile(new URL('src/generated/clanFamilyCatalog.ts', root), 'utf8')
const families = JSON.parse(generated.replace(/^export const clanFamilyCatalog = /u, '').replace(/ as const\s*$/u, ''))
const people = [
  { id: 'person-1009', name: '신종목', status: 'free', relative: '신준' },
  { id: 'person-1010', name: '신준', status: 'unused', relative: '신종목' },
]

for (const person of people) {
  test(`${person.name} has the approved clan and selected crest in generated details`, async () => {
    const source = lineage.people.find((entry) => entry.name === person.name)
    const detail = JSON.parse(await readFile(new URL(`public/person-details/${person.id}.json`, root), 'utf8'))
    assert.equal(detail.name, person.name)
    assert.deepEqual(detail.clan, {
      id: 'goryeong-shin', name: '고령 신씨', crest: 'clan-crests/goryeong-shin.svg',
    })
    assert.ok(source)
    assert.equal(source.clan, detail.clan.id)
    assert.deepEqual([source.bongwan, source.bongwan_hanja, source.surname_hanja], ['고령', '高靈', '申'])
    assert.equal(source.status, person.status)
    assert.equal(source.branch, 'unconfirmed')
  })

  test(`${person.name} belongs to exactly one Goryeong family with a working person route`, () => {
    const membership = families.flatMap((family) => family.members
      .filter((member) => member.id === person.id)
      .map((member) => ({ clan: family.id, name: member.name, branch: member.branchId, route: member.detailRoute })))
    assert.deepEqual(membership, [{ clan: 'goryeong-shin', name: person.name, branch: null, route: `/people/${person.id}` }])
  })

  test(`${person.name} retains the authored kinship edge to ${person.relative}`, async () => {
    const detail = JSON.parse(await readFile(new URL(`public/person-details/${person.id}.json`, root), 'utf8'))
    assert.deepEqual(detail.relations.outgoing
      .filter((edge) => edge.to === person.relative)
      .map(({ from, type, to }) => ({ from, type, to })), [
      { from: person.name, type: '친족', to: person.relative },
    ])
    assert.deepEqual(detail.relations.incoming
      .filter((edge) => edge.from === person.relative)
      .map(({ from, type, to }) => ({ from, type, to })), [
      { from: person.relative, type: '친족', to: person.name },
    ])
  })
}
