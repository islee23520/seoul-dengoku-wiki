import { readFileSync } from 'node:fs'
import { test, expect } from 'vitest'
import { characterDraftExport, createDraftLegacyStore, draftPersonalContext, emptyCharacterDraft, projectedDraftLegacy } from '../src/pages/characterDraftExport'
import { LEGACY_REVISIONS, PERSONAL_FIELDS } from '../src/data/original-trpg-options'

import { draftAbilityIds, emptyDraftProfile, pendingFormulas } from './character-profile-draft.mjs'

const raw = readFileSync(new URL('../vendor/issued-history/5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4.json', import.meta.url), 'utf8')
const source = JSON.parse(raw)
const revision = LEGACY_REVISIONS[1].revision
const selection = { personId: '', revision }
const store = await createDraftLegacyStore(new Map([[revision, raw]]))

test('character draft export retains personal edits without credentials or transient AI state', () => {
  // Given: caller-only credentials and every personal field are distinct.
  const personal = Object.fromEntries(PERSONAL_FIELDS.map(({ key }) => [key, `edited:${key}`]))
  const sheet = { ...emptyCharacterDraft(), ...personal, aiKey: 'private-key', aiModel: 'local-model', aiGenerating: true, aiMessage: 'transient', accessToken: 'secret', attributes: { ST: 11 } }
  // When
  const exported = characterDraftExport(sheet, selection)
  // Then
  expect(exported.personal).toEqual(personal)
  expect(exported.personId).toBeNull()
  expect(exported).toMatchObject({ schema: 'original-character-draft.v3', schemaVersion: 3, revision, rulesVersion: 'seoul-character-system-contract.v1', profileId: 'seoul-character-profile.v1', reviewState: 'proposal', operative: false, persisted: false })
  for (const key of ['aiKey', 'aiModel', 'aiGenerating', 'aiMessage', 'accessToken', 'attributes']) expect(Object.hasOwn(exported, key)).toBe(false)
  expect(sheet.aiKey).toBe('private-key')
})

test('all 1022 complete source records and metadata survive draft serialization without numeric conversion', () => {
  // Given
  expect(source.people).toHaveLength(1022)
  const { people, ...metadata } = source
  // When / Then: independently compare every historical record, including IQ 25.
  for (const person of people) {
    const personId = person.url.split('/').at(-1)
    const legacy = store.read(revision, personId)
    const sheet = { ...emptyCharacterDraft(), legacy, name: 'edited draft name' }
    const exported = JSON.parse(JSON.stringify(characterDraftExport(sheet, { revision, personId })))
    expect(exported.legacy.person).toEqual(person)
    expect(exported.legacy.metadata).toEqual(metadata)
    expect(exported.characterProfile).toEqual(emptyDraftProfile())
    expect(exported.profileSource).toMatchObject({ reviewState: 'proposal', decisionRef: null })
    expect(exported.formulas).toEqual(pendingFormulas)
  }
  expect(people.some(person => person.attributes.IQ.value === 25)).toBe(true)
})

test('legacy snapshots are recursively read-only and export snapshots are detached', () => {
  // Given
  const person = source.people[0]
  const personId = person.url.split('/').at(-1)
  const legacy = store.read(revision, personId)
  // When
  const exported = characterDraftExport({ ...emptyCharacterDraft(), legacy }, { revision, personId })
  exported.legacy.person.attributes.IQ.value = -999
  // Then
  expect(store.read(revision, personId).person).toEqual(person)
  expect(legacy.person).toEqual(person)
  expect(Object.isFrozen(legacy.person.attributes.IQ)).toBe(true)
})

test('missing or altered source variants cannot alias the populated ledger', async () => {
  // Given / When / Then
  expect(() => store.read(LEGACY_REVISIONS[0].revision, source.people[0].id)).toThrow('E_VERSION_STORE_BINDING')
  await expect(createDraftLegacyStore(new Map([[LEGACY_REVISIONS[0].revision, raw]]))).rejects.toThrow('E_SOURCE_HASH')
  await expect(createDraftLegacyStore(new Map([[revision, raw + ' ']]))).rejects.toThrow('E_SOURCE_HASH')
})

test.each(['', 'latest', 'ce173686'])('export requires a full explicit supported revision: %s', revision => {
  // Given / When / Then
  expect(() => characterDraftExport(emptyCharacterDraft(), { personId: '', revision })).toThrow('E_EXPLICIT_REVISION')
})

test('source revision and identity must match the exported selection', () => {
  // Given
  const person = source.people[0]
  const legacy = store.read(revision, person.id)
  // When / Then
  expect(() => characterDraftExport({ ...emptyCharacterDraft(), legacy }, { personId: person.id, revision: LEGACY_REVISIONS[0].revision })).toThrow('E_SOURCE_BINDING')
  expect(() => characterDraftExport({ ...emptyCharacterDraft(), legacy }, { personId: 'K1018', revision })).toThrow('E_SOURCE_BINDING')
  expect(() => characterDraftExport(emptyCharacterDraft(), { personId: person.id, revision })).toThrow('E_SOURCE_BINDING')
})

test('reordered empty profile exports without evidence and preserves its schema', () => {
  // Given: only property and body-part order differ from the empty profile.
  const profile = emptyDraftProfile()
  const sheet = { ...emptyCharacterDraft(), characterProfile: {
    health: { diseases: [], bodyParts: [...profile.health.bodyParts].reverse().map(({ id }) => ({ function: null, severity: null, id })), status: 'unassessed' },
    narrative: { en: '', ko: '' }, traits: [], skills: [],
    abilities: Object.fromEntries([...draftAbilityIds].reverse().map(id => [id, { effective: null, base: null }])),
  } }
  // When
  const exported = characterDraftExport(sheet, selection)
  // Then
  expect(exported.characterProfile).toEqual(sheet.characterProfile)
  expect(exported.profileSource.evidenceRefs).toEqual([])
  expect(exported.profileSource.decisionRef).toBeNull()
})

test.each([
  ['base zero', profile => { profile.abilities.prowess.base = 0 }],
  ['effective zero', profile => { profile.abilities.prowess.effective = 0 }],
  ['skill', profile => { profile.skills = [{ id: 'care', name: { ko: '돌봄', en: 'Care' }, rating: null }] }],
  ['trait', profile => { const text = { ko: '침착', en: 'Steady' }; profile.traits = [{ id: 'steady', name: text, description: text, behavior: text, stress: text, relationship: text, effects: [] }] }],
  ['narrative', profile => { profile.narrative = { ko: '서사', en: 'Narrative' } }],
  ['health status', profile => { profile.health.status = 'observed' }],
  ['body severity', profile => { profile.health.bodyParts[0].severity = 'injured' }],
  ['body function', profile => { profile.health.bodyParts[0].function = 'limited' }],
  ['disease', profile => { profile.health.diseases = [{ id: 'illness', progression: null }] }],
])('edited %s profile requires evidence and then exports unchanged', (_name, mutate) => {
  // Given
  const sheet = emptyCharacterDraft()
  mutate(sheet.characterProfile)
  // When / Then
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_PROFILE_EVIDENCE')
  sheet.profileEvidenceRef = 'narrative:authored-edit'
  expect(characterDraftExport(sheet, selection).characterProfile).toEqual(sheet.characterProfile)
})

test.each([0, 20])('explicit base %s keeps effective separate and remains a proposal', base => {
  // Given
  const sheet = emptyCharacterDraft()
  sheet.characterProfile.abilities.prowess = { base, effective: 100 }
  sheet.profileEvidenceRef = 'evidence:rating'
  sheet.selectedAdvantages = [{ description: 'source-bound strength', reference: 'evidence:trait' }]
  // When
  const exported = characterDraftExport(sheet, selection)
  // Then
  expect(exported.characterProfile.abilities.prowess).toEqual({ base, effective: 100 })
  expect(exported.profileSource).toMatchObject({ evidenceRefs: ['evidence:rating'], reviewState: 'proposal', decisionRef: null })
  expect(exported.traits.selectedAdvantages).toEqual(sheet.selectedAdvantages)
  expect(exported.formulas).toEqual(pendingFormulas)
})

test.each([-1, 21, 1.5, NaN, Infinity, -0])('rejects invalid base instead of clamping: %s', base => {
  // Given
  const sheet = emptyCharacterDraft()
  sheet.characterProfile.abilities.prowess.base = base
  sheet.profileEvidenceRef = 'ref'
  // When / Then
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_BASE:prowess')
})

test.each([-1, 101, 1.5, NaN, Infinity, -0])('rejects invalid effective instead of clamping: %s', effective => {
  const sheet = emptyCharacterDraft()
  sheet.characterProfile.abilities.prowess.effective = effective
  sheet.profileEvidenceRef = 'ref'
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_EFFECTIVE:prowess')
})

test('an authored zero needs evidence and does not populate other abilities from titles', () => {
  // Given
  const sheet = { ...emptyCharacterDraft(), position: 'commander', occupation: 'engineer' }
  sheet.characterProfile.abilities.leadership.base = 0
  // When / Then
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_PROFILE_EVIDENCE')
  sheet.profileEvidenceRef = 'narrative:action'
  const exported = characterDraftExport(sheet, selection)
  expect(exported.characterProfile.abilities.strategy).toEqual({ base: null, effective: null })
  expect(exported.characterProfile.skills).toEqual([])
})

test('canonical skills traits health and narrative survive without automatic effect composition', () => {
  // Given
  const sheet = emptyCharacterDraft()
  sheet.profileEvidenceRef = 'narrative:actions'
  const text = { ko: '서사', en: 'Narrative' }
  sheet.characterProfile.skills = [{ id: 'repair', name: text, rating: 99.9 }, { id: 'care', name: text, rating: null }]
  sheet.characterProfile.traits = [{ id: 'steady', name: text, description: text, behavior: text, stress: text, relationship: text, effects: [{ ability: 'prowess', delta: null }] }]
  sheet.characterProfile.narrative = text
  sheet.characterProfile.health.bodyParts[0] = { id: 'left-arm', severity: 'injured', function: null }
  sheet.characterProfile.health.diseases = [{ id: 'illness', progression: 'observed' }]
  // When
  const exported = characterDraftExport(sheet, selection)
  // Then
  expect(exported.characterProfile).toEqual(sheet.characterProfile)
  expect(exported.characterProfile.abilities.prowess.effective).toBeNull()
  expect(exported.formulas).toEqual(pendingFormulas)
})

test.each([
  ['missing ability', profile => { delete profile.abilities.insight }, 'E_ABILITY_NAMESPACE'],
  ['extra legacy ability', profile => { profile.abilities.ST = { base: 10, effective: 10 } }, 'E_ABILITY_NAMESPACE'],
  ['fake approval', profile => { profile.abilities.insight.reviewState = 'approved' }, 'E_ABILITY:insight'],
  ['private soul', profile => { profile.souls = [{ id: 'private' }] }, 'E_PROFILE_SHAPE'],
  ['missing body part', profile => { profile.health.bodyParts.pop() }, 'E_BODY_PARTS'],
  ['skill precision', profile => { profile.skills = [{ id: 'repair', name: { ko: '정비', en: 'Repair' }, rating: 12.34 }] }, 'E_SKILL:repair'],
])('rejects %s in the canonical draft', (_name, mutate, code) => {
  // Given
  const sheet = emptyCharacterDraft()
  sheet.profileEvidenceRef = 'narrative:action'
  mutate(sheet.characterProfile)
  // When / Then
  expect(() => characterDraftExport(sheet, selection)).toThrow(code)
})

test('trait descriptions require explicit evidence', () => {
  const sheet = { ...emptyCharacterDraft(), selectedQuirks: [{ description: 'draft', reference: '' }] }
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_TRAIT_EVIDENCE')
})

test('person detail context retains explicit fields without inventing role or birthday facts', () => {
  const context = { name: 'Name', position: 'earlier', role: { display: 'source role' }, birth: '2100-01-01', bongwan: 'source clan', gender: 'source gender', selectedBackground: 'source background' }
  expect(draftPersonalContext(context)).toMatchObject({ name: 'Name', position: 'source role', birth: '2100-01-01', bongwan: 'source clan', selectedBackground: 'source background', occupation: '' })
})

const detail = JSON.parse(readFileSync(new URL('../public/person-details/person-1007.json', import.meta.url), 'utf8'))
test.each(LEGACY_REVISIONS)('generated $revision variant exports its complete original record', ({ revision }) => {
  const variant = detail.personSheet.variants.find(item => item.revision === revision)
  const legacy = projectedDraftLegacy(detail, revision)
  const exported = characterDraftExport({ ...emptyCharacterDraft(), legacy }, { revision, personId: detail.id })
  expect(exported.legacy.person).toEqual(variant.legacy.record)
  expect(exported.legacy.projection).toEqual(variant)
  expect(Object.hasOwn(exported.legacy, 'metadata')).toBe(false)
  expect(Object.isFrozen(legacy.person.attributes.IQ)).toBe(true)
})

test.each([
  ['missing variant', data => data.personSheet.variants.pop(), 'E_PERSON_SHEET_REVISIONS'],
  ['duplicate variant', data => { data.personSheet.variants[1] = structuredClone(data.personSheet.variants[0]) }, 'E_PERSON_SHEET_REVISIONS'],
  ['unknown revision', data => { data.personSheet.variants[0].revision = 'latest' }, 'E_PERSON_SHEET_REVISIONS'],
  ['wrong source hash', data => { data.personSheet.variants[0].ledgerSha256 = 'wrong' }, 'E_PERSON_SHEET_LEGACY'],
  ['wrong identity', data => { data.personSheet.variants[0].legacy.record.id = 'K001' }, 'E_PERSON_SHEET_IDENTITY'],
  ['wrong route', data => { data.personSheet.variants[0].legacy.record.url = '/people/person-0001' }, 'E_PERSON_SHEET_IDENTITY'],
  ['numeric adoption', data => { data.personSheet.variants[0].rules.numericAdoption = true }, 'E_PERSON_SHEET_RULES'],
  ['operative legacy', data => { data.personSheet.variants[0].legacy.operative = true }, 'E_PERSON_SHEET_LEGACY'],
])('generated projection rejects %s without source fallback', (_name, mutate, code) => {
  const invalid = structuredClone(detail)
  mutate(invalid)
  expect(() => projectedDraftLegacy(invalid, revision)).toThrow(code)
})
