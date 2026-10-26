import { ORIGINAL_PROFILE_ID, ORIGINAL_RULES_VERSION, PERSONAL_FIELDS, TRAIT_FIELDS } from '../data/original-trpg-options'
import { draftProfileFailures, emptyDraftProfile, pendingFormulas } from '../../scripts/character-profile-draft.mjs'
import type { DraftProfile } from '../../scripts/character-profile-draft.mjs'

export type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json }
type JsonRecord = { readonly [key: string]: Json }
export type PersonalKey = typeof PERSONAL_FIELDS[number]['key']
type TraitKey = typeof TRAIT_FIELDS[number]['key']
export type TraitDescription = { readonly description: string; readonly reference: string }
export type DraftSheet = Readonly<Record<PersonalKey, string>> & Readonly<Record<TraitKey, readonly TraitDescription[]>> & {
  readonly characterProfile: DraftProfile
  readonly profileEvidenceRef: string
}

export class DraftContractError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'DraftContractError' }
}
function record(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export function emptyCharacterDraft(): DraftSheet {
  return {
    name: '', state: '', position: '', rank: '', occupation: '', gender: '', birth: '', bongwan: '', tier: '',
    selectedBackground: '', selectedAppearance: '', selectedAmbition: '',
    selectedAdvantages: [], selectedDisadvantages: [], selectedQuirks: [],
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

export function characterDraftExport(sheet: DraftSheet, selection: { readonly personId: string }) {
  const problems = draftProblems(sheet)
  if (problems.length) throw new DraftContractError(problems.join(','))
  // Explicit projection: credentials, transient state and unknown caller fields
  // cannot ride along in a spread. Only current draft fields are exported.
  const personal = Object.fromEntries(PERSONAL_FIELDS.map(({ key }) => [key, sheet[key]]))
  const traits = Object.fromEntries(TRAIT_FIELDS.map(({ key }) => [key, sheet[key].map(({ description, reference }) => ({ description, reference }))]))
  return structuredClone({
    schema: 'original-character-draft.v3', schemaVersion: 3, rulesVersion: ORIGINAL_RULES_VERSION, profileId: ORIGINAL_PROFILE_ID,
    audience: 'author-private', reviewState: 'proposal', operative: false, persisted: false,
    personId: selection.personId || null, personal, traits,
    characterProfile: sheet.characterProfile,
    profileSource: { sourceRevision: null, evidenceRefs: sheet.profileEvidenceRef.trim() ? [sheet.profileEvidenceRef] : [], reviewState: 'proposal', decisionRef: null },
    formulas: pendingFormulas,
  })
}
