import nameChanges from '../../scripts/person-sheet-name-changes.json'
import { HISTORICAL_RULES_VERSION, LEGACY_REVISIONS, ORIGINAL_PROFILE_ID, ORIGINAL_RULES_VERSION, PERSONAL_FIELDS, TRAIT_FIELDS } from '../data/original-trpg-options'
import { draftProfileFailures, emptyDraftProfile, pendingFormulas } from '../../scripts/character-profile-draft.mjs'
import type { DraftProfile } from '../../scripts/character-profile-draft.mjs'

export type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json }
type JsonRecord = { readonly [key: string]: Json }
export type LegacyRevision = typeof LEGACY_REVISIONS[number]['revision']
export type PersonalKey = typeof PERSONAL_FIELDS[number]['key']
type TraitKey = typeof TRAIT_FIELDS[number]['key']
export type TraitDescription = { readonly description: string; readonly reference: string }
export type LegacySelection = {
  readonly revision: LegacyRevision
  readonly ledgerSha256: string
  readonly sourceFile: 'lore/name-pools/gurps-cast.json'
  readonly metadata?: JsonRecord
  readonly projection?: JsonRecord
  readonly person: JsonRecord
}
export type DraftSheet = Readonly<Record<PersonalKey, string>> & Readonly<Record<TraitKey, readonly TraitDescription[]>> & {
  readonly legacy: LegacySelection | null
  readonly characterProfile: DraftProfile
  readonly profileEvidenceRef: string
}
export type LegacyStore = { readonly read: (revision: LegacyRevision, personId: string) => LegacySelection }

export class DraftContractError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'DraftContractError' }
}
function record(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function freezeJson<T extends Json>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freezeJson)
    Object.freeze(value)
  }
  return value
}
export function legacyRevision(value: string): LegacyRevision {
  const selected = LEGACY_REVISIONS.find(item => item.revision === value)
  if (!selected) throw new DraftContractError('E_EXPLICIT_REVISION')
  return selected.revision
}

// Snapshot exact JSON bytes before awaiting the digest. A missing variant stays
// unavailable; this store never aliases one sealed revision to the other.
export async function createDraftLegacyStore(sources: ReadonlyMap<LegacyRevision, string>): Promise<LegacyStore> {
  const snapshot = new Map(sources)
  const documents = new Map<LegacyRevision, JsonRecord>()
  for (const [revision, raw] of snapshot) {
    const seal = LEGACY_REVISIONS.find(item => item.revision === revision)
    if (!seal) throw new DraftContractError('E_EXPLICIT_REVISION')
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    if (hash !== seal.sha256) throw new DraftContractError('E_SOURCE_HASH')
    const document: unknown = JSON.parse(raw)
    if (!record(document) || !Array.isArray(document.people)) throw new DraftContractError('E_SOURCE_SHAPE')
    documents.set(revision, document)
  }
  return Object.freeze({ read(revision: LegacyRevision, personId: string) {
    const selected = legacyRevision(revision)
    const document = documents.get(selected)
    if (!document) throw new DraftContractError('E_VERSION_STORE_BINDING')
    const { people, ...metadata } = document
    if (!Array.isArray(people)) throw new DraftContractError('E_SOURCE_SHAPE')
    const person = people.find(item => record(item) && (item.id === personId || item.url === `/people/${personId}`))
    if (!record(person)) throw new DraftContractError('E_SOURCE_PERSON')
    const seal = LEGACY_REVISIONS.find(item => item.revision === selected)
    if (!seal) throw new DraftContractError('E_EXPLICIT_REVISION')
    // Callers receive independent snapshots, never the store's objects.
    return freezeJson(structuredClone({ revision: selected, ledgerSha256: seal.sha256,
      sourceFile: 'lore/name-pools/gurps-cast.json' as const, metadata, person })
    )
  } })
}

// Public generated asset, not the private author API. Its producer verifies both
// sealed ledgers; this boundary checks the exact projection and identity binding.
// Root ledger metadata is not supplied by this projection and is never invented.
export function projectedDraftLegacy(detail: unknown, revision: string): LegacySelection {
  const selected = legacyRevision(revision)
  if (!record(detail) || typeof detail.id !== 'string' || !/^person-[0-9]{4}$/.test(detail.id) ||
      typeof detail.characterId !== 'string' || typeof detail.name !== 'string' || typeof detail.state !== 'string' ||
      !record(detail.personSheet) || detail.personSheet.schema !== 'wiki-person-sheet.v1' || !Array.isArray(detail.personSheet.variants)) {
    throw new DraftContractError('E_PERSON_SHEET_SHAPE')
  }
  if (detail.personSheet.currentState !== detail.state) throw new DraftContractError('E_PERSON_SHEET_CURRENT_STATE')
  const variants = detail.personSheet.variants
  if (variants.length !== LEGACY_REVISIONS.length) throw new DraftContractError('E_PERSON_SHEET_REVISIONS')
  let result: LegacySelection | undefined
  for (const seal of LEGACY_REVISIONS) {
    const matches = variants.filter(item => record(item) && item.revision === seal.revision)
    if (matches.length !== 1) throw new DraftContractError('E_PERSON_SHEET_REVISIONS')
    const variant = matches[0]
    if (!record(variant) || variant.ledgerSha256 !== seal.sha256 || !record(variant.legacy) ||
        variant.legacy.operative !== false || !record(variant.legacy.record)) throw new DraftContractError('E_PERSON_SHEET_LEGACY')
    const rules = variant.rules
    if (!record(rules) || rules.sourceRevision !== seal.revision || rules.rulesVersion !== HISTORICAL_RULES_VERSION ||
        rules.resolution !== 'opposed-d10' || rules.numericAdoption !== false || rules.originalRatings !== null ||
        rules.legacyValues !== 'immutable-not-d10-ratings') throw new DraftContractError('E_PERSON_SHEET_RULES')
    const person = variant.legacy.record
    const nameChange = (nameChanges as Record<string, { personId: string; historicalName: string; currentName: string }>)[detail.characterId]
    const nameMatches = person.name === detail.name || (nameChange?.personId === detail.id && nameChange.historicalName === person.name && nameChange.currentName === detail.name)
    if (person.id !== detail.characterId || !nameMatches || person.url !== `/people/${detail.id}` || (person.personId !== undefined && person.personId !== detail.id)) throw new DraftContractError('E_PERSON_SHEET_IDENTITY')
    if (typeof person.state !== 'string' || variant.historicalState !== person.state) throw new DraftContractError('E_PERSON_SHEET_HISTORICAL_STATE')
    if (seal.revision === selected) result = freezeJson(structuredClone({ revision: selected, ledgerSha256: seal.sha256,
      sourceFile: 'lore/name-pools/gurps-cast.json' as const, projection: variant, person }))
  }
  if (!result) throw new DraftContractError('E_PERSON_SHEET_REVISIONS')
  return result
}

export function emptyCharacterDraft(): DraftSheet {
  return {
    name: '', state: '', position: '', rank: '', occupation: '', gender: '', birth: '', bongwan: '', tier: '',
    selectedBackground: '', selectedAppearance: '', selectedAmbition: '',
    selectedAdvantages: [], selectedDisadvantages: [], selectedQuirks: [], legacy: null,
    characterProfile: emptyDraftProfile(), profileEvidenceRef: '',
  }
}

export function draftPersonalContext(value: unknown): Readonly<Record<PersonalKey, string>> {
  if (!record(value)) throw new DraftContractError('E_PERSON_CONTEXT')
  const result: Record<PersonalKey, string> = {
    name: '', state: '', position: '', rank: '', occupation: '', gender: '', birth: '', bongwan: '', tier: '',
    selectedBackground: '', selectedAppearance: '', selectedAmbition: '',
  }
  for (const { key } of PERSONAL_FIELDS) if (typeof value[key] === 'string') result[key] = value[key]
  if (record(value.role) && typeof value.role.display === 'string') result.position = value.role.display
  if (typeof value.birthDate === 'string') result.birth = value.birthDate
  if (typeof value.stage === 'string') result.tier = value.stage
  return result
}

export function draftProblems(sheet: DraftSheet): readonly string[] {
  const problems = [...draftProfileFailures(sheet.characterProfile)]
  const profile = sheet.characterProfile
  const authoredProfile = problems.length === 0 && (
    Object.values(profile.abilities).some(({ base, effective }) => base !== null || effective !== null) ||
    profile.skills.length > 0 || profile.traits.length > 0 ||
    Boolean(profile.narrative.ko.trim() || profile.narrative.en.trim()) ||
    profile.health.status !== 'unassessed' || profile.health.diseases.length > 0 ||
    profile.health.bodyParts.some(({ severity, function: functionality }) => severity !== null || functionality !== null)
  )
  if (authoredProfile && !sheet.profileEvidenceRef.trim()) problems.push('E_PROFILE_EVIDENCE')
  for (const { key } of TRAIT_FIELDS) if (sheet[key].some(item => !item.description.trim() || !item.reference.trim())) problems.push('E_TRAIT_EVIDENCE')
  return [...new Set(problems)]
}

export function characterDraftExport(sheet: DraftSheet, selection: { readonly personId: string; readonly revision: string }) {
  const revision = legacyRevision(selection.revision)
  const problems = draftProblems(sheet)
  if (problems.length) throw new DraftContractError(problems.join(','))
  if (selection.personId && (!sheet.legacy || sheet.legacy.revision !== revision ||
    (sheet.legacy.person.id !== selection.personId && sheet.legacy.person.url !== `/people/${selection.personId}`))) throw new DraftContractError('E_SOURCE_BINDING')
  if (!selection.personId && sheet.legacy) throw new DraftContractError('E_SOURCE_BINDING')
  // Explicit projection: credentials, transient state and unknown caller fields
  // cannot ride along in a spread. Historical fields stay in legacy only.
  const personal = Object.fromEntries(PERSONAL_FIELDS.map(({ key }) => [key, sheet[key]]))
  const traits = Object.fromEntries(TRAIT_FIELDS.map(({ key }) => [key, sheet[key].map(({ description, reference }) => ({ description, reference }))]))
  return structuredClone({
    schema: 'original-character-draft.v3', schemaVersion: 3, revision, rulesVersion: ORIGINAL_RULES_VERSION, profileId: ORIGINAL_PROFILE_ID,
    audience: 'author-private', reviewState: 'proposal', operative: false, persisted: false,
    personId: selection.personId || null, personal, traits, legacy: sheet.legacy,
    characterProfile: sheet.characterProfile,
    profileSource: { sourceRevision: revision, evidenceRefs: sheet.profileEvidenceRef.trim() ? [sheet.profileEvidenceRef] : [], reviewState: 'proposal', decisionRef: null },
    formulas: pendingFormulas,
  })
}
