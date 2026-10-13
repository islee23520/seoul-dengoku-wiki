import assert from 'node:assert/strict'
import test from 'node:test'
import { abilityIds, profileFailures, profileRosterFailures, publicCharacterProfile } from './character-profile.mjs'

const fixture = () => ({
  abilities: Object.fromEntries(abilityIds.map(id => [id, { base: 10, effective: 10 }])),
  skills: [{ id: 'repair', name: { ko: '정비', en: 'Repair' }, rating: 99.9 }],
  traits: [],
  narrative: { ko: '기록을 대조한다.', en: 'Compares records.' },
  health: { status: 'unassessed', bodyParts: ['left-arm', 'right-arm', 'left-leg', 'right-leg', 'head', 'torso'].map(id => ({ id, severity: null, function: null })), diseases: [] },
  souls: [{ id: 'private-motif' }],
  historicalComparison: { private: true },
})

test('all eight abilities and skill endpoints are accepted', () => {
  const profile = fixture()
  profile.abilities.leadership = { base: 0, effective: 0 }
  profile.abilities.prowess = { base: 20, effective: 100 }
  const text = { ko: '성과', en: 'Performance' }
  profile.traits.push({ id: 'boost', name: text, description: text, behavior: text, stress: text, relationship: text, effects: [{ ability: 'prowess', delta: 90 }] })
  profile.skills.push({ id: 'first-aid', name: { ko: '응급처치', en: 'First aid' }, rating: 0 })
  assert.deepEqual(profileFailures(profile), [])
})

test('base, effective and skill bounds reject invalid values', () => {
  for (const value of [-1, 21, 1.5, NaN]) {
    const profile = fixture()
    profile.abilities.strategy.base = value
    assert.ok(profileFailures(profile).includes('E_BASE:strategy'))
  }
  for (const value of [-1, 101, 1.5, Infinity]) {
    const profile = fixture()
    profile.abilities.strategy.effective = value
    assert.ok(profileFailures(profile).includes('E_EFFECTIVE:strategy'))
  }
  for (const value of [-1, 100, null, NaN, 12.34]) {
    const profile = fixture()
    profile.skills[0].rating = value
    assert.ok(profileFailures(profile).includes('E_SKILL:repair'))
  }
})

test('traits and body records require complete public structure', () => {
  const profile = fixture()
  profile.traits = [{ id: 'bad', effects: [{ ability: 'unknown', delta: 1 }] }]
  profile.health.bodyParts.pop()
  assert.ok(profileFailures(profile).includes('E_TRAIT_TEXT:bad:name'))
  assert.ok(profileFailures(profile).includes('E_TRAIT_EFFECT:bad'))
  assert.ok(profileFailures(profile).includes('E_BODY_PARTS'))
})

test('duplicate skill and trait identities cannot be published', () => {
  const profile = fixture()
  profile.skills.push({ ...profile.skills[0] })
  assert.ok(profileFailures(profile).includes('E_SKILL_DUPLICATE'))
  const text = { ko: '특성', en: 'Trait' }
  const trait = { id: 'same', name: text, description: text, behavior: text, stress: text, relationship: text, effects: [] }
  profile.traits = [trait, trait]
  assert.ok(profileFailures(profile).includes('E_TRAIT_DUPLICATE'))
})

test('effective ratings agree with explicit trait effects and clamp at the ceiling', () => {
  const profile = fixture()
  profile.abilities.strategy.effective = 11
  assert.ok(profileFailures(profile).includes('E_EFFECT_TOTAL:strategy'))
})

test('missing abilities are rejected rather than filled with defaults', () => {
  const profile = fixture()
  delete profile.abilities.insight
  assert.ok(profileFailures(profile).includes('E_BASE:insight'))
  assert.throws(() => publicCharacterProfile(profile), /E_BASE:insight/)
})

test('public projection excludes soul, history and unknown editorial fields', () => {
  const profile = fixture()
  profile.abilities.learning.soul = 'private-motif'
  profile.skills[0].historicalPerson = 'private-motif'
  profile.skills[0].name.soul = 'private-motif'
  const traitText = { ko: '판단', en: 'Judgment', historicalPerson: 'private-motif' }
  profile.traits.push({ id: 'judgment', name: traitText, description: traitText, behavior: traitText, stress: traitText, relationship: traitText, effects: [] })
  profile.narrative.soul = 'private-motif'
  profile.health.bodyParts[0].soul = 'private-motif'
  const projected = publicCharacterProfile(profile)
  assert.deepEqual(Object.keys(projected), ['abilities', 'skills', 'traits', 'narrative', 'health'])
  assert.deepEqual(projected.abilities.learning, { base: 10, effective: 10 })
  assert.deepEqual(Object.keys(projected.skills[0]), ['id', 'name', 'rating'])
  assert.ok(!JSON.stringify(projected).includes('private-motif'))
})

test('profile roster preserves exact registered identity and final soul assignment', () => {
  const profile = { ...fixture(), personId: 'K001', name: '인물' }
  const registry = { persons: [{ id: 'K001', name: '인물' }] }
  const assignments = { assignments: [{ personId: 'K001', souls: profile.souls }] }
  assert.deepEqual(profileRosterFailures([profile], registry, assignments), [])
  assert.ok(profileRosterFailures([], registry, assignments).includes('E_PROFILE_MISSING:K001'))
  assert.ok(profileRosterFailures([profile, profile], registry, assignments).includes('E_PROFILE_DUPLICATE:K001'))
  assert.ok(profileRosterFailures([{ ...profile, name: '다른 인물', souls: [] }], registry, assignments).includes('E_PROFILE_SOUL:K001'))
  assert.ok(profileRosterFailures([{ ...profile, name: '다른 인물' }], registry, assignments).includes('E_PROFILE_IDENTITY:K001'))
})
