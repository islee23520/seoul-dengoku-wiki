import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateHouseholdHumanoid, householdHumanoidPolicy, validateExistingHouseholdCounts, validateExistingHumanoidAssignments } from './household-humanoid-policy.mjs'

const known = status => ({ status, sourceRefs: [{ path: 'lore/characters/Core-Characters.json', anchor: 'person-faith' }] })
const request = changes => ({ ownerPersonId: 'K998', ownerGender: '남성', orientation: '이성', personFaith: known('non-christian'), houseFaith: known('non-christian'), scope: 'household', existing: false, existingGender: null, seed: 'owner-approved-seed', roleKey: 'grain-store', ...changes })

test('Christian person or house exclusion outranks opposite gender and unknown faith', () => {
  for (const changes of [{ personFaith: known('christian') }, { houseFaith: known('christian'), personFaith: { status: 'unknown', sourceRefs: [] } }]) {
    const result = evaluateHouseholdHumanoid(request(changes))
    assert.equal(result.eligibility, 'excluded')
    assert.equal(result.preferredGender, null)
    assert.equal(result.assignmentAction, 'do-not-assign')
  }
})

test('opposite gender preference follows both heterosexual owner genders', () => {
  assert.equal(evaluateHouseholdHumanoid(request()).preferredGender, '여성')
  assert.equal(evaluateHouseholdHumanoid(request({ ownerGender: '여성' })).preferredGender, '남성')
})

test('all other known orientations use repeatable seeded random without input mutation', () => {
  for (const orientation of ['동성', '양성', '유동', '무성향']) {
    const input = request({ orientation })
    const before = structuredClone(input)
    const result = evaluateHouseholdHumanoid(input)
    assert.equal(result.preference, 'seeded-random')
    assert.ok(['남성', '여성'].includes(result.preferredGender))
    assert.deepEqual(evaluateHouseholdHumanoid(input), result)
    assert.deepEqual(input, before)
  }
  const genders = new Set(Array.from({ length: 32 }, (_, i) => evaluateHouseholdHumanoid(request({ orientation: '유동', seed: String(i) })).preferredGender))
  assert.equal(genders.size, 2)
})

test('null and explicitly unknown orientation do not default to heterosexual', () => {
  for (const orientation of [null, '미확인']) {
    const result = evaluateHouseholdHumanoid(request({ orientation }))
    assert.equal(result.preference, 'unknown')
    assert.equal(result.preferredGender, null)
  }
})

test('unknown faith cannot produce an exemption and known faith needs evidence', () => {
  assert.equal(evaluateHouseholdHumanoid(request({ houseFaith: undefined })).eligibility, 'unresolved')
  assert.equal(evaluateHouseholdHumanoid(request({ personFaith: { status: 'unknown', sourceRefs: [] } })).eligibility, 'unresolved')
  assert.equal(evaluateHouseholdHumanoid(request({ houseFaith: { status: 'unknown', sourceRefs: [] } })).eligibility, 'unresolved')
  assert.throws(() => evaluateHouseholdHumanoid(request({ personFaith: { status: 'non-christian', sourceRefs: [] } })), /E_HOUSEHOLD_FAITH_SOURCE/)
  assert.throws(() => evaluateHouseholdHumanoid(request({ ownerPersonId: 'H02' })), /E_HOUSEHOLD_REQUEST/)
  assert.throws(() => evaluateHouseholdHumanoid(request({ orientation: 'heterosexual-default' })), /E_HOUSEHOLD_ORIENTATION/)
})

test('facility custody remains distinct and existing household conflicts are reported without reassignment', () => {
  const input = request({ personFaith: known('christian'), existing: true, existingGender: '남성' })
  const before = structuredClone(input)
  assert.equal(evaluateHouseholdHumanoid(input).assignmentAction, 'report-conflict')
  assert.equal(evaluateHouseholdHumanoid(input).existingGender, '남성')
  assert.equal(evaluateHouseholdHumanoid({ ...input, scope: 'facility-maintenance' }).assignmentAction, 'preserve')
  assert.deepEqual(input, before)
  assert.equal(evaluateHouseholdHumanoid(request({ existing: true, existingGender: '남성' })).existingGender, '남성')
})

test('existing court and retainer contract rejects additions, removals and same-count reassignment', () => {
  const baseline = JSON.parse(readFileSync(new URL('../lore/relations/relations.json', import.meta.url), 'utf8'))
  assert.deepEqual(validateExistingHouseholdCounts(baseline, structuredClone(baseline)), [])
  const reordered = structuredClone(baseline)
  reordered.courts.reverse()
  reordered.directRetainers.reverse()
  assert.deepEqual(validateExistingHouseholdCounts(baseline, reordered), [])
  for (const key of ['courts', 'directRetainers']) {
    const added = structuredClone(baseline)
    added[key].push(structuredClone(added[key][0]))
    assert.deepEqual(validateExistingHouseholdCounts(baseline, added), ['E_HOUSEHOLD_EXISTING_ASSIGNMENTS:' + key])
    const removed = structuredClone(baseline)
    removed[key].pop()
    assert.deepEqual(validateExistingHouseholdCounts(baseline, removed), ['E_HOUSEHOLD_EXISTING_ASSIGNMENTS:' + key])
  }
  const changed = structuredClone(baseline)
  changed.directRetainers[0].liegePersonId = 'K998'
  assert.deepEqual(validateExistingHouseholdCounts(baseline, changed), ['E_HOUSEHOLD_EXISTING_ASSIGNMENTS:directRetainers'])
})

test('policy canon source anchors resolve in the parent-authored document', () => {
  for (const ref of householdHumanoidPolicy.sourceRefs) {
    const source = JSON.parse(readFileSync(new URL('../' + ref.path, import.meta.url), 'utf8'))
    assert.ok(source.content.some(block => block.anchor === ref.anchor), ref.anchor)
  }
})

test('actual existing H identities, custody and gender cannot be reassigned or removed', () => {
  const atlas = JSON.parse(readFileSync(new URL('../lore/World-Narrative-Atlas.json', import.meta.url), 'utf8'))
  const baseline = atlas.data.atlas.synthetics.filter(actor => actor.cls === 'H')
  assert.deepEqual(validateExistingHumanoidAssignments(baseline, structuredClone(baseline)), [])
  for (const field of ['gender', 'house_id', 'relations']) {
    const proposed = structuredClone(baseline)
    proposed[0][field] = field === 'relations' ? [] : 'replacement'
    assert.deepEqual(validateExistingHumanoidAssignments(baseline, proposed), ['E_HOUSEHOLD_EXISTING_HUMANOID:' + baseline[0].id])
  }
  const removed = structuredClone(baseline)
  removed.shift()
  assert.deepEqual(validateExistingHumanoidAssignments(baseline, removed), ['E_HOUSEHOLD_EXISTING_HUMANOID_IDS', 'E_HOUSEHOLD_EXISTING_HUMANOID:' + baseline[0].id])
  const added = [...structuredClone(baseline), { ...structuredClone(baseline[0]), id: 'H17' }]
  assert.deepEqual(validateExistingHumanoidAssignments(baseline, added), ['E_HOUSEHOLD_EXISTING_HUMANOID_IDS'])
  const duplicate = [...structuredClone(baseline), structuredClone(baseline[0])]
  assert.deepEqual(validateExistingHumanoidAssignments(baseline, duplicate), ['E_HOUSEHOLD_EXISTING_HUMANOID_IDS'])
})
