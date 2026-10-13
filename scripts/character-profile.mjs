export const abilityIds = Object.freeze([
  'leadership', 'strategy', 'negotiation', 'management',
  'insight', 'learning', 'prowess', 'endurance',
])
export const bodyPartIds = Object.freeze(['left-arm', 'right-arm', 'left-leg', 'right-leg', 'head', 'torso'])
const localized = value => typeof value?.ko === 'string' && value.ko.trim() && typeof value?.en === 'string' && value.en.trim()

export function profileRosterFailures(profiles, registry, assignments) {
  const failures = []
  const seen = new Set()
  const identities = new Map(registry.persons.map(person => [person.id, person.name]))
  const souls = new Map(assignments.assignments.map(person => [person.personId, person.souls]))
  for (const profile of profiles) {
    if (seen.has(profile.personId)) failures.push(`E_PROFILE_DUPLICATE:${profile.personId}`)
    seen.add(profile.personId)
    if (identities.get(profile.personId) !== profile.name) failures.push(`E_PROFILE_IDENTITY:${profile.personId}`)
    if (JSON.stringify(profile.souls) !== JSON.stringify(souls.get(profile.personId))) failures.push(`E_PROFILE_SOUL:${profile.personId}`)
    failures.push(...profileFailures(profile).map(failure => `${profile.personId}:${failure}`))
  }
  for (const id of identities.keys()) if (!seen.has(id)) failures.push(`E_PROFILE_MISSING:${id}`)
  return failures
}

export function profileFailures(profile) {
  const failures = []
  for (const id of abilityIds) {
    const ability = profile?.abilities?.[id]
    if (!Number.isInteger(ability?.base) || ability.base < 0 || ability.base > 20) failures.push(`E_BASE:${id}`)
    if (!Number.isInteger(ability?.effective) || ability.effective < 0 || ability.effective > 100) failures.push(`E_EFFECTIVE:${id}`)
  }
  if (!Array.isArray(profile?.skills)) failures.push('E_SKILLS')
  else if (new Set(profile.skills.map(skill => skill.id)).size !== profile.skills.length) failures.push('E_SKILL_DUPLICATE')
  else for (const skill of profile.skills) {
    if (typeof skill.rating !== 'number' || !Number.isFinite(skill.rating) || skill.rating < 0 || skill.rating > 99.9 || Math.abs(skill.rating * 10 - Math.round(skill.rating * 10)) > 1e-8) failures.push(`E_SKILL:${skill.id}`)
    if (!localized(skill.name)) failures.push(`E_SKILL_NAME:${skill.id}`)
  }
  if (!Array.isArray(profile?.traits)) failures.push('E_TRAITS')
  else if (new Set(profile.traits.map(trait => trait.id)).size !== profile.traits.length) failures.push('E_TRAIT_DUPLICATE')
  else for (const trait of profile.traits) {
    for (const key of ['name', 'description', 'behavior', 'stress', 'relationship']) if (!localized(trait[key])) failures.push(`E_TRAIT_TEXT:${trait.id}:${key}`)
    if (!Array.isArray(trait.effects)) failures.push(`E_TRAIT_EFFECTS:${trait.id}`)
    else for (const effect of trait.effects) if (!abilityIds.includes(effect.ability) || !Number.isInteger(effect.delta)) failures.push(`E_TRAIT_EFFECT:${trait.id}`)
  }
  if (Array.isArray(profile?.traits) && profile.traits.every(trait => Array.isArray(trait.effects))) {
    for (const id of abilityIds) {
      const base = profile.abilities?.[id]?.base
      const delta = profile.traits.flatMap(trait => trait.effects).filter(effect => effect.ability === id).reduce((total, effect) => total + effect.delta, 0)
      if (Number.isInteger(base) && profile.abilities[id].effective !== Math.max(0, Math.min(100, base + delta))) failures.push(`E_EFFECT_TOTAL:${id}`)
    }
  }
  if (!localized(profile?.narrative)) failures.push('E_NARRATIVE')
  const parts = profile?.health?.bodyParts
  if (!Array.isArray(parts) || parts.length !== bodyPartIds.length || new Set(parts.map(part => part.id)).size !== bodyPartIds.length || parts.some(part => !bodyPartIds.includes(part.id))) failures.push('E_BODY_PARTS')
  if (!Array.isArray(profile?.health?.diseases)) failures.push('E_DISEASES')
  return failures
}

// The public projection deliberately selects fields rather than spreading the
// editorial record. Soul identities, historical comparisons and approvals stay private.
export function publicCharacterProfile(profile) {
  const failures = profileFailures(profile)
  if (failures.length) throw new Error(failures.join(';'))
  return {
    abilities: Object.fromEntries(abilityIds.map(id => [id, {
      base: profile.abilities[id].base,
      effective: profile.abilities[id].effective,
    }])),
    skills: profile.skills.map(skill => ({
      id: skill.id,
      name: { ko: skill.name.ko, en: skill.name.en },
      rating: skill.rating,
    })),
    traits: profile.traits.map(trait => ({
      id: trait.id,
      name: { ko: trait.name.ko, en: trait.name.en },
      description: { ko: trait.description.ko, en: trait.description.en },
      behavior: { ko: trait.behavior.ko, en: trait.behavior.en },
      stress: { ko: trait.stress.ko, en: trait.stress.en },
      relationship: { ko: trait.relationship.ko, en: trait.relationship.en },
      effects: trait.effects.map(effect => ({ ability: effect.ability, delta: effect.delta })),
    })),
    narrative: { ko: profile.narrative.ko, en: profile.narrative.en },
    health: {
      status: profile.health.status,
      bodyParts: profile.health.bodyParts.map(part => ({ id: part.id, severity: part.severity, function: part.function })),
      diseases: profile.health.diseases.map(disease => ({ id: disease.id, progression: disease.progression })),
    },
  }
}
