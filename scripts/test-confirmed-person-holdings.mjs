import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('confirmed Yangcheon holding joins exact admin geometry and stays separate from proposal territory', () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const projected = read('../public/confirmed-person-holdings.json')
  const map = read('../public/opening-territories.json')
  const source = read('../lore/name-pools/gurps-cast.json').people
  const holding = ledger.holdings.find(row => row.id === 'holding:yangcheon')
  assert.deepEqual(projected, ledger)
  assert.equal(holding.holderPersonId, 'K002')
  assert.equal(holding.directLiegePersonId, 'K001')
  const expected = map.regions.filter(row => row.district === '양천구').map(row => ({ id: row.id, name: row.name }))
  assert.equal(expected.length, 18)
  assert.deepEqual(holding.adminRefs, expected)
  for (const person of source) {
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.deepEqual(detail.territory, person.territory)
    assert.deepEqual(detail.confirmedHoldings, ledger.holdings.filter(row => row.holderPersonId === person.id))
  }
  const edges = read('../lore/relations/relations.json').ownerLieges.edges
  assert.equal(edges.length, 8)
  for (const edge of edges) {
    const person = source.find(row => row.id === edge.personId)
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.equal(detail.directLiege.personId, edge.liegePersonId)
    assert.equal(detail.directLiege.relationKind, edge.relationKind)
    assert.equal(detail.directLiege.ownerTerm, edge.ownerTerm)
    assert.deepEqual(detail.confirmedHoldings, ledger.holdings.filter(row => row.holderPersonId === edge.personId))
  }
})
