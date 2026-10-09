import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const contract = readJson('../lore/relations/state-formation-contract.json')
const holdings = readJson('../lore/relations/personal-holdings.json')
const gddRoot = process.env.GDD_ROOT
if (!gddRoot) throw new Error('GDD_ROOT must point to the pinned read-only GDD checkout')
const gddBytes = readFileSync(`${gddRoot}/canon/locales/ko-KR/rules/rules-factions-warfare-clauses.json`)
const gdd = JSON.parse(gddBytes.toString('utf8'))
const rule = gdd.blocks.find(block => block.id === 'r2.rwarfare-37.body')
const ruleText = rule.lines.map(line => line.map(part => part.text ?? '').join('')).join('\n')
const sourceHash = hash(gddBytes)

function assertContract(candidate) {
  assert.equal(candidate.independentAcquisitionCreatesState, true)
  assert.equal(candidate.grantRequiresPriorMembership, true)
  assert.equal(candidate.territorialControlIsPersonalHolding, false)
  assert.equal(candidate.formationPrerequisites.find(item => item.id === 'additional-formation-prerequisites')?.status, 'unresolved')
  for (const id of ['independent-land-acquisition', 'prior-membership-before-grant']) {
    const prerequisite = candidate.formationPrerequisites.find(item => item.id === id)
    assert.equal(prerequisite?.source.sha256, sourceHash)
    assert.equal(prerequisite?.source.path, 'canon/locales/ko-KR/rules/rules-factions-warfare-clauses.json')
    assert.equal(prerequisite?.source.pointer, '/blocks/r2.rwarfare-37.body')
    assert.equal(prerequisite?.approvalRef, 'accepted GDD rule r2.rwarfare-37')
  }
}

function transition({ affiliated, acquisition }) {
  if (acquisition === 'independent-acquisition') return affiliated ? 'invalid-fixture' : 'independent-state-created'
  if (acquisition === 'grant') return affiliated ? 'existing-state-holder' : 'blocked-membership'
  return 'unsupported-prerequisite-held'
}

test('the independent WIKI ledgers bind the exact accepted GDD formation clause', () => {
  assert.match(ruleText, /무소속 인물이 스스로 영지를 획득하면 독립 국가가 성립한다/)
  assert.match(ruleText, /영지를 수여받는 인물은 먼저 그 국가에 속해야 한다/)
  assertContract(contract)
  assert.deepEqual(contract.independentLedgers.wiki, {
    stateRegistry: 'lore/factions/Sixteen-States.json',
    membershipRegistry: 'lore/relations/relations.json',
    personalHoldingRegistry: 'lore/relations/personal-holdings.json',
  })
  assert.match(contract.independentLedgers.storageRelationship, /independent/)
  assert.equal(contract.independentLedgers.gdd.ruleSource, 'canon/locales/ko-KR/rules/rules-factions-warfare-clauses.json')
  assert.equal(contract.independentLedgers.gdd.clause, 'r2.rwarfare-37')
  assert.ok(Array.isArray(holdings.holdings))
  assert.equal(contract.sourceScope.openingStates.count, 16)
  assert.equal(contract.sourceScope.openingStates.range, 'S01-S16')
  assert.deepEqual(contract.sourceScope.openingIndependentPolities.map(polity => [polity.id, polity.sovereignPersonId]), [['polity:daejeon', 'K1008']])
  assert.equal(contract.sourceScope.wholeKingdomAtOpening, true)
})

test('normal and blocked transitions are distinct and unknown prerequisites remain held', () => {
  assert.equal(transition({ affiliated: false, acquisition: 'independent-acquisition' }), 'independent-state-created')
  assert.equal(transition({ affiliated: true, acquisition: 'grant' }), 'existing-state-holder')
  assert.equal(transition({ affiliated: false, acquisition: 'grant' }), 'blocked-membership')
  assert.equal(transition({ affiliated: false, acquisition: 'unknown' }), 'unsupported-prerequisite-held')
})

test('negative fixtures reject changed fields, missing provenance, stale hashes, and ownership conflation', () => {
  const mutations = [
    candidate => { candidate.grantRequiresPriorMembership = false },
    candidate => { delete candidate.formationPrerequisites[0].source.pointer },
    candidate => { candidate.formationPrerequisites[0].source.sha256 = '0'.repeat(64) },
    candidate => { candidate.territorialControlIsPersonalHolding = true },
  ]
  for (const mutate of mutations) {
    const fixture = structuredClone(contract)
    mutate(fixture)
    assert.throws(() => assertContract(fixture))
  }
})
