import { readFileSync } from 'node:fs'
import { test, expect } from 'vitest'
import { characterDraftExport, createDraftLegacyStore, draftPersonalContext, emptyCharacterDraft, projectedDraftLegacy } from '../src/pages/characterDraftExport'
import { LEGACY_REVISIONS, PERSONAL_FIELDS } from '../src/data/original-trpg-options'

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
  expect(exported).toMatchObject({ schema: 'original-character-draft.v2', schemaVersion: 2, revision, rulesVersion: 'seoul.opposed-d10.v1', profileId: 'seoul-opposed-d10-0-12-c4-v1', reviewState: 'proposal', operative: false, persisted: false })
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
    expect(exported.originalRatings.map(item => item.value)).toEqual([null, null, null, null, null, null, null])
    expect(exported.originalRatings.every(item => item.reviewState === 'proposal' && item.decisionRef === null)).toBe(true)
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

test.each([0, 12])('explicit rating %s preserves separate evidence and proposal status', value => {
  // Given
  const sheet = emptyCharacterDraft()
  sheet.originalRatings[0] = { ...sheet.originalRatings[0], value, subdomain: 'source-bound domain', rubricVersion: 'rubric:v1', evidenceRef: 'evidence:rating' }
  sheet.selectedAdvantages = [{ description: 'source-bound strength', reference: 'evidence:trait' }]
  // When
  const exported = characterDraftExport(sheet, selection)
  // Then
  expect(exported.originalRatings[0]).toMatchObject({ value, capabilityId: 'original.perception', subdomain: 'source-bound domain', rubricVersion: 'rubric:v1', evidenceRefs: ['evidence:rating'], reviewState: 'proposal', decisionRef: null })
  expect(exported.traits.selectedAdvantages).toEqual(sheet.selectedAdvantages)
})

test.each([-1, 13, 1.5, NaN, Infinity, -0])('rejects invalid rating instead of clamping or defaulting: %s', value => {
  const sheet = emptyCharacterDraft()
  sheet.originalRatings[0] = { ...sheet.originalRatings[0], value, subdomain: 'x', rubricVersion: 'v1', evidenceRef: 'ref' }
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_RATING_RANGE')
})

test.each(['subdomain', 'rubricVersion', 'evidenceRef'])('rated capability requires %s', missing => {
  const sheet = emptyCharacterDraft()
  sheet.originalRatings[0] = { ...sheet.originalRatings[0], value: 0, subdomain: 'x', rubricVersion: 'v1', evidenceRef: 'ref', [missing]: ' ' }
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_RATING_EVIDENCE')
})

test.each([-4, 0, 4])('combined modifier %s is preserved with evidence, not summed from legacy costs', value => {
  const sheet = { ...emptyCharacterDraft(), combinedModifier: value, modifierEvidenceRef: 'effect:context' }
  expect(characterDraftExport(sheet, selection).combinedModifier).toEqual({ value, evidenceRefs: ['effect:context'], reviewState: 'proposal' })
})

test.each([-5, 5, 0.5, NaN, -0])('combined modifier rejects invalid value %s', value => {
  expect(() => characterDraftExport({ ...emptyCharacterDraft(), combinedModifier: value, modifierEvidenceRef: 'ref' }, selection)).toThrow('E_MODIFIER_RANGE')
})

test('modifier and trait descriptions require explicit evidence', () => {
  expect(() => characterDraftExport({ ...emptyCharacterDraft(), combinedModifier: 0 }, selection)).toThrow('E_MODIFIER_EVIDENCE')
  expect(() => characterDraftExport({ ...emptyCharacterDraft(), selectedQuirks: [{ description: 'draft', reference: '' }] }, selection)).toThrow('E_TRAIT_EVIDENCE')
})

test('seven namespace assignments cannot duplicate domains or claim approval', () => {
  const sheet = emptyCharacterDraft()
  sheet.originalRatings[1] = { ...sheet.originalRatings[0] }
  expect(() => characterDraftExport(sheet, selection)).toThrow('E_CAPABILITY_NAMESPACE')
  const approved = emptyCharacterDraft()
  approved.originalRatings[0] = { ...approved.originalRatings[0], reviewState: 'approved' }
  expect(() => characterDraftExport(approved, selection)).toThrow('E_RATING_REVIEW')
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
