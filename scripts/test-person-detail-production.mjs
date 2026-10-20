import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { producePersonDetails } from './person-detail-production.mjs'
import { authenticatePersonalTierProvenance } from './personal-tier-provenance.mjs'
import { loadCharacterProfiles } from './validate-character-profiles.mjs'
import { loadPreservedPersonSheets } from './preserved-person-sheet.mjs'

test('the shared producer preserves office precedence, historical sheets, full rights and absent fields without output IO', async () => {
  const root = new URL('../', import.meta.url)
  const registry = JSON.parse(await readFile(new URL('lore/name-pools/person-id-registry.json', root), 'utf8')).persons
  const values = JSON.parse(await readFile(new URL('lore/name-pools/values-cast.json', root), 'utf8')).people
  const sheets = JSON.parse(await readFile(new URL('lore/name-pools/gurps-cast.json', root), 'utf8')).people
  const chosen = [0, 1].map(index => ({ issued: registry[index], ledger: values.find(row => row.name === registry[index].name) }))
  assert.ok(chosen.every(({ ledger }) => ledger))
  const peopleSource = chosen.map(({ ledger }, index) => {
    const row = { ...ledger }
    if (index === 0) delete row.locked
    else row.locked = false
    return row
  })
  const issuedIdByName = new Map(chosen.map(({ issued }) => [issued.name, issued.id]))
  const issuedById = new Map(chosen.map(({ issued }) => [issued.id, issued]))
  const first = chosen[0], second = chosen[1]
  const firstCard = { file: 'Cast-State-01', primary: true, body: '- 직함: 이전 직함\n- 품계: 이전 품계\n- 생업: 기록관\n**관직.** 직함은 카드 직함. 품계 카드 품계.' }
  const secondCard = { file: 'Core-Characters', body: '- 직위: 카드 직위\n관직. 품계 없음.\n\n훈련. 유도.\n\n호위 대열. 철수로를 지킨다.' }
  const right = { id: 'holding:fixture', kind: 'direct-property', holderPersonId: first.issued.id,
    jurisdictionRefs: ['region:fixture'], nested: { permissions: [{ kind: 'access', approved: false }] } }
  const title = { id: 'title:fixture', holderPersonId: first.issued.id, rank: 'duchy', parentTitleId: null,
    jurisdictionRefs: ['region:fixture'], nested: { exceptions: [] } }
  const personalHoldings = { holdings: [right], titles: [title], polities: [], retinueGroups: [] }
  const calls = []
  const result = producePersonDetails({
    personalTierPreservation: await authenticatePersonalTierProvenance(root.pathname),
    peopleSource, personCards: new Map([[first.issued.name, [firstCard]], [second.issued.name, [secondCard]]]),
    pagesBySlug: new Map([['Cast-State-01', { value: { id: 'source:first' } }], ['Core-Characters', { value: { id: 'source:second' } }]]),
    officeAppointments: new Map([[first.issued.id, { personId: first.issued.id, stateId: first.ledger.state,
      position: '현재 직함', rank: '현재 품계', commonTier: 'T2' }]]),
    issuedIdByName, issuedById,
    genderByName: new Map(chosen.map(({ issued }) => [issued.name, { gender: '남성' }])),
    stateNameById: new Map(), tiersByState: new Map(),
    atlasPeople: { routes: new Map(chosen.map(({ issued }, index) => [issued.id,
      { name: issued.name, detailRoute: `/people/person-${String(index + 1).padStart(4, '0')}` }])) },
    birthdayRoster: chosen.map(({ issued }) => issued), courtDataset: { config: {
      courts: [], directRetainers: [], courtMemberships: { memberships: [] }, ownerLieges: { edges: [], effectiveYear: 2126 },
    } }, personalHoldings, issuedSheets: chosen.map(({ issued }) => sheets.find(sheet => sheet.id === issued.id)),
    lineageByName: new Map(chosen.map(({ issued }) => [issued.name, { clan: null }])),
    birthdaysById: new Map(), familyGraph: { nodes: [], edges: [] }, parentStatusById: new Map(),
    proseContactsById: new Map(), householdsById: new Map(), personRightsPermissions: new Map(),
    characterProfiles: await loadCharacterProfiles(root.pathname), preservedSheets: loadPreservedPersonSheets(),
    openingDispositions: new Map(), relations: [],
    personFeedbackRecord: input => { calls.push(input); return { personId: input.personId, sections: input.sections } },
  })
  const [a, b] = result.personDetails
  assert.equal(Object.hasOwn(a, 'locked'), false)
  assert.equal(Object.hasOwn(b, 'locked'), true)
  assert.equal(b.locked, false)
  assert.equal(b.sections['훈련'], '유도.')
  assert.equal(b.sections['호위 대열'], '철수로를 지킨다.')
  assert.deepEqual(result.peopleCatalog.map(row => [row.id, row.characterId]),
    [['person-0001', first.issued.id], ['person-0002', second.issued.id]])
  assert.deepEqual([a.title, a.position, a.rank, a.commonTier, a.occupation],
    ['현재 직함', '현재 직함', '현재 품계', 'T2', '기록관'])
  assert.deepEqual([b.position, b.rank, b.commonTier, b.sourceRoute],
    ['카드 직위', '없음', 'T5', `/world/Core-Characters#${second.issued.name}`])
  assert.deepEqual(a.confirmedHoldings, [right])
  assert.deepEqual(a.openingTitles, [{ ...title, parentTitle: null }])
  assert.equal(Object.hasOwn(b, 'openingTitles'), false)
  assert.equal(Object.hasOwn(b, 'rightsPermissions'), false)
  assert.equal(Object.hasOwn(b, 'directLiege'), false)
  assert.equal(Object.hasOwn(b, 'unit'), b.unit !== undefined)
  assert.equal(Object.hasOwn(a, 'territory'), false)
  assert.equal(Object.hasOwn(b, 'territory'), false)
  assert.equal(Object.hasOwn(b, 'wandering_force'), b.wandering_force !== undefined)
  assert.equal(JSON.stringify(b).includes('"unit"'), b.unit !== undefined)
  assert.equal(a.personSheet.variants.length, 2)
  assert.ok(a.personSheet.variants.every(variant => variant.legacy.operative === false))
  assert.deepEqual(calls.map(row => row.personId), ['person-0001', 'person-0002'])
  assert.deepEqual(result.personFeedbackRecords.map(row => row.sections), result.personDetails.map(row => row.sections))
  assert.deepEqual(a.relations, { outgoing: [], incoming: [] })
})
