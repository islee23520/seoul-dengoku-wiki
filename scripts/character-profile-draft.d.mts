export type AbilityId = 'leadership' | 'strategy' | 'negotiation' | 'management' | 'insight' | 'learning' | 'prowess' | 'endurance'
export type ProfileText = { readonly ko: string; readonly en: string }
export type DraftProfile = {
  readonly abilities: Readonly<Record<AbilityId, { readonly base: number | null; readonly effective: number | null }>>
  readonly skills: readonly { readonly id: string; readonly name: ProfileText; readonly rating: number | null }[]
  readonly traits: readonly { readonly id: string; readonly name: ProfileText; readonly description: ProfileText; readonly behavior: ProfileText; readonly stress: ProfileText; readonly relationship: ProfileText; readonly effects: readonly { readonly ability: AbilityId; readonly delta: number | null }[] }[]
  readonly narrative: ProfileText
  readonly health: { readonly status: string; readonly bodyParts: readonly { readonly id: string; readonly severity: string | null; readonly function: string | null }[]; readonly diseases: readonly { readonly id: string; readonly progression: string | null }[] }
}
export const draftAbilityIds: readonly AbilityId[]
export const draftBodyPartIds: readonly string[]
export const characterRulesVersion: 'seoul-character-system-contract.v1'
export const pendingFormulas: { readonly resolution: null; readonly effectComposition: null; readonly skillGrowth: null }
export function emptyDraftProfile(): DraftProfile
export function draftProfileFailures(profile: unknown): readonly string[]
export function parseDraftProfile(value: unknown): { readonly profile: DraftProfile | null; readonly failures: readonly string[] }
