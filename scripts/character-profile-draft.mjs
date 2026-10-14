// Candidate validation deliberately does not apply the issued opening-profile
// effect-total check: general composition, resolution and growth remain undecided.
export const draftAbilityIds = Object.freeze([
  'leadership', 'strategy', 'negotiation', 'management',
  'insight', 'learning', 'prowess', 'endurance',
])
export const draftBodyPartIds = Object.freeze([
  'left-arm', 'right-arm', 'left-leg', 'right-leg', 'head', 'torso',
])
export const characterRulesVersion = 'seoul-character-system-contract.v1'
export const pendingFormulas = Object.freeze({ resolution: null, effectComposition: null, skillGrowth: null })
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const exact = (value, keys) => record(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
const text = value => typeof value === 'string' && value.trim().length > 0
const localized = value => exact(value, ['ko', 'en']) && text(value.ko) && text(value.en)
const rating = (value, maximum) => value === null || (Number.isInteger(value) && value >= 0 && value <= maximum && !Object.is(value, -0))
const nullableText = value => value === null || text(value)

export function emptyDraftProfile() {
  return {
    abilities: Object.fromEntries(draftAbilityIds.map(id => [id, { base: null, effective: null }])),
    skills: [], traits: [], narrative: { ko: '', en: '' },
    health: { status: 'unassessed', bodyParts: draftBodyPartIds.map(id => ({ id, severity: null, function: null })), diseases: [] },
  }
}

export function parseDraftProfile(value) {
  const failures = draftProfileFailures(value)
  return failures.length ? { profile: null, failures } : { profile: structuredClone(value), failures }
}

export function draftProfileFailures(profile) {
  const failures = []
  if (!exact(profile, ['abilities', 'skills', 'traits', 'narrative', 'health'])) return ['E_PROFILE_SHAPE']
  if (!exact(profile.abilities, draftAbilityIds)) failures.push('E_ABILITY_NAMESPACE')
  for (const id of draftAbilityIds) {
    const ability = profile.abilities?.[id]
    if (!exact(ability, ['base', 'effective'])) failures.push(`E_ABILITY:${id}`)
    else {
      if (!rating(ability.base, 20)) failures.push(`E_BASE:${id}`)
      if (!rating(ability.effective, 100)) failures.push(`E_EFFECTIVE:${id}`)
    }
  }
  if (!Array.isArray(profile.skills)) failures.push('E_SKILLS')
  else {
    if (new Set(profile.skills.map(skill => skill?.id)).size !== profile.skills.length) failures.push('E_SKILL_DUPLICATE')
    for (const skill of profile.skills) {
      if (!exact(skill, ['id', 'name', 'rating']) || !text(skill.id) || !localized(skill.name)) failures.push('E_SKILL_SHAPE')
      else if (skill.rating !== null && (typeof skill.rating !== 'number' || !Number.isFinite(skill.rating) || skill.rating < 0 || skill.rating > 99.9 || Object.is(skill.rating, -0) || Math.abs(skill.rating * 10 - Math.round(skill.rating * 10)) > 1e-8)) failures.push(`E_SKILL:${skill.id}`)
    }
  }
  if (!Array.isArray(profile.traits)) failures.push('E_TRAITS')
  else {
    if (new Set(profile.traits.map(trait => trait?.id)).size !== profile.traits.length) failures.push('E_TRAIT_DUPLICATE')
    for (const trait of profile.traits) {
      if (!exact(trait, ['id', 'name', 'description', 'behavior', 'stress', 'relationship', 'effects']) || !text(trait.id)) { failures.push('E_TRAIT_SHAPE'); continue }
      for (const key of ['name', 'description', 'behavior', 'stress', 'relationship']) if (!localized(trait[key])) failures.push(`E_TRAIT_TEXT:${trait.id}:${key}`)
      if (!Array.isArray(trait.effects)) failures.push(`E_TRAIT_EFFECTS:${trait.id}`)
      else for (const effect of trait.effects) if (!exact(effect, ['ability', 'delta']) || !draftAbilityIds.includes(effect.ability) || (effect.delta !== null && (!Number.isInteger(effect.delta) || Object.is(effect.delta, -0)))) failures.push(`E_TRAIT_EFFECT:${trait.id}`)
    }
  }
  if (!exact(profile.narrative, ['ko', 'en']) || typeof profile.narrative.ko !== 'string' || typeof profile.narrative.en !== 'string' || (Boolean(profile.narrative.ko.trim()) !== Boolean(profile.narrative.en.trim()))) failures.push('E_NARRATIVE')
  const health = profile.health
  if (!exact(health, ['status', 'bodyParts', 'diseases']) || !text(health.status)) failures.push('E_HEALTH')
  else {
    if (!Array.isArray(health.bodyParts) || health.bodyParts.length !== draftBodyPartIds.length || new Set(health.bodyParts.map(part => part?.id)).size !== draftBodyPartIds.length || health.bodyParts.some(part => !exact(part, ['id', 'severity', 'function']) || !draftBodyPartIds.includes(part.id) || !nullableText(part.severity) || !nullableText(part.function))) failures.push('E_BODY_PARTS')
    if (!Array.isArray(health.diseases) || health.diseases.some(disease => !exact(disease, ['id', 'progression']) || !text(disease.id) || !nullableText(disease.progression))) failures.push('E_DISEASES')
    else if (new Set(health.diseases.map(disease => disease.id)).size !== health.diseases.length) failures.push('E_DISEASE_DUPLICATE')
  }
  return failures
}
