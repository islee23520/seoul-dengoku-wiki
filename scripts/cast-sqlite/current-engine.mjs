import { createHash } from 'node:crypto'
import { abilityIds, profileFailures, publicCharacterProfile } from '../character-profile.mjs'

export const ENGINE_PRIVATE_SOURCE_PATHS = Object.freeze([
  'lore/editorial/profile-batches/special.json',
  ...Array.from({ length: 8 }, (_, index) => `lore/editorial/profile-batches/state-${String(index * 2 + 1).padStart(2, '0')}-${String(index * 2 + 2).padStart(2, '0')}.json`),
])

const columns = (value) => Object.freeze(value.split(' '))
export const ENGINE_TABLE_COLUMNS = Object.freeze({
  current_engine_source: columns('engine_source_id logical_path source_sha256 source_byte_length projection_schema projection_sha256 profile_count'),
  current_profile: columns('person_id engine_source_id json_pointer source_ordinal'),
  ability: columns('person_id ability_ordinal ability_id base_value effective_value json_pointer'),
  skill: columns('person_id skill_ordinal skill_id_presence skill_id name_ko name_en rating json_pointer'),
  trait: columns('person_id trait_ordinal trait_id_presence trait_id name_ko name_en description_ko description_en behavior_ko behavior_en stress_ko stress_en relationship_ko relationship_en json_pointer'),
  effect: columns('person_id trait_ordinal effect_ordinal ability_id delta json_pointer'),
  health: columns('person_id status_presence status json_pointer'),
  body: columns('person_id body_ordinal body_part_id severity_presence severity function_presence function_state json_pointer'),
  disease: columns('person_id disease_ordinal disease_id_presence disease_id progression_presence progression json_pointer'),
  narrative: columns('person_id narrative_ko narrative_en json_pointer'),
})
export const CURRENT_ENGINE_TABLE_COLUMNS = ENGINE_TABLE_COLUMNS

function fail(code, detail) {
  const error = new Error(detail ? `${code}: ${detail}` : code)
  error.code = code
  throw error
}

function presence(owner, key) {
  if (!Object.hasOwn(owner, key)) return ['missing', null]
  return owner[key] === null ? ['null', null] : ['value', owner[key]]
}

function projectedPresence(owner, key, projectedValue) {
  const [state] = presence(owner, key)
  return [state, state === 'value' ? projectedValue : null]
}

function sourceFiles(bundle) {
  const files = bundle?.engineFiles
  if (!Array.isArray(files) || files.length !== ENGINE_PRIVATE_SOURCE_PATHS.length) fail('E_ENGINE_SOURCE_SET')
  const byPath = new Map()
  for (const file of files) {
    if (!file || typeof file !== 'object' || typeof file.logical_path !== 'string' || byPath.has(file.logical_path)) fail('E_ENGINE_SOURCE_SET')
    byPath.set(file.logical_path, file)
  }
  if (ENGINE_PRIVATE_SOURCE_PATHS.some((path) => !byPath.has(path))) fail('E_ENGINE_SOURCE_SET')
  return ENGINE_PRIVATE_SOURCE_PATHS.map((path) => byPath.get(path))
}

function sourceMetadata(file) {
  if (!/^[a-f0-9]{64}$/u.test(file.sha256)) fail('E_ENGINE_SOURCE_HASH')
  if (!Number.isSafeInteger(file.byte_length) || file.byte_length < 0) fail('E_ENGINE_SOURCE_LENGTH')
  if (!file.document || typeof file.document !== 'object' || !Array.isArray(file.document.profiles)) fail('E_ENGINE_SOURCE_DOCUMENT')
}

function profileIdentity(profile, identities, seen) {
  if (!profile || typeof profile !== 'object' || typeof profile.personId !== 'string' || typeof profile.name !== 'string') fail('E_ENGINE_IDENTITY')
  if (seen.has(profile.personId) || identities.get(profile.personId) !== profile.name) fail('E_ENGINE_IDENTITY')
  seen.add(profile.personId)
}

function profileProjection(profile) {
  const failures = profileFailures(profile)
  if (failures.length) fail('E_ENGINE_PROFILE', [...new Set(failures.map((value) => value.split(':')[0]))].join(','))
  return publicCharacterProfile(profile)
}

function appendProfile(rows, source, sourceOrdinal, profile, publicProfile) {
  const person = profile.personId
  const pointer = `/profiles/${sourceOrdinal}`
  rows.current_profile.push({ person_id: person, engine_source_id: source, json_pointer: pointer, source_ordinal: sourceOrdinal })
  abilityIds.forEach((ability_id, ability_ordinal) => rows.ability.push({ person_id: person, ability_ordinal, ability_id, base_value: publicProfile.abilities[ability_id].base, effective_value: publicProfile.abilities[ability_id].effective, json_pointer: `${pointer}/abilities/${ability_id}` }))
  publicProfile.skills.forEach((skill, skill_ordinal) => {
    const [skill_id_presence, skill_id] = projectedPresence(profile.skills[skill_ordinal], 'id', skill.id)
    rows.skill.push({ person_id: person, skill_ordinal, skill_id_presence, skill_id, name_ko: skill.name.ko, name_en: skill.name.en, rating: skill.rating, json_pointer: `${pointer}/skills/${skill_ordinal}` })
  })
  publicProfile.traits.forEach((trait, trait_ordinal) => {
    const [trait_id_presence, trait_id] = projectedPresence(profile.traits[trait_ordinal], 'id', trait.id)
    const traitPointer = `${pointer}/traits/${trait_ordinal}`
    rows.trait.push({ person_id: person, trait_ordinal, trait_id_presence, trait_id, name_ko: trait.name.ko, name_en: trait.name.en, description_ko: trait.description.ko, description_en: trait.description.en, behavior_ko: trait.behavior.ko, behavior_en: trait.behavior.en, stress_ko: trait.stress.ko, stress_en: trait.stress.en, relationship_ko: trait.relationship.ko, relationship_en: trait.relationship.en, json_pointer: traitPointer })
    trait.effects.forEach((effect, effect_ordinal) => rows.effect.push({ person_id: person, trait_ordinal, effect_ordinal, ability_id: effect.ability, delta: effect.delta, json_pointer: `${traitPointer}/effects/${effect_ordinal}` }))
  })
  const [status_presence, status] = projectedPresence(profile.health, 'status', publicProfile.health.status)
  rows.health.push({ person_id: person, status_presence, status, json_pointer: `${pointer}/health` })
  publicProfile.health.bodyParts.forEach((part, body_ordinal) => {
    const [severity_presence, severity] = projectedPresence(profile.health.bodyParts[body_ordinal], 'severity', part.severity)
    const [function_presence, function_state] = projectedPresence(profile.health.bodyParts[body_ordinal], 'function', part.function)
    rows.body.push({ person_id: person, body_ordinal, body_part_id: part.id, severity_presence, severity, function_presence, function_state, json_pointer: `${pointer}/health/bodyParts/${body_ordinal}` })
  })
  publicProfile.health.diseases.forEach((disease, disease_ordinal) => {
    const [disease_id_presence, disease_id] = projectedPresence(profile.health.diseases[disease_ordinal], 'id', disease.id)
    const [progression_presence, progression] = projectedPresence(profile.health.diseases[disease_ordinal], 'progression', disease.progression)
    rows.disease.push({ person_id: person, disease_ordinal, disease_id_presence, disease_id, progression_presence, progression, json_pointer: `${pointer}/health/diseases/${disease_ordinal}` })
  })
  rows.narrative.push({ person_id: person, narrative_ko: publicProfile.narrative.ko, narrative_en: publicProfile.narrative.en, json_pointer: `${pointer}/narrative` })
}

function frozenRows(rows) {
  for (const table of Object.keys(ENGINE_TABLE_COLUMNS)) rows[table] = Object.freeze(rows[table].map(Object.freeze))
  return Object.freeze(rows)
}

export function mapEngineDomains({ bundle, identity }) {
  if (!Array.isArray(identity?.people)) fail('E_ENGINE_IDENTITY')
  const identities = new Map(identity.people.map((person) => [person.person_id, person.name]))
  if (identities.size !== identity.people.length) fail('E_ENGINE_IDENTITY')
  const rows = Object.fromEntries(Object.keys(ENGINE_TABLE_COLUMNS).map((table) => [table, []]))
  const seen = new Set()
  sourceFiles(bundle).forEach((file, sourceIndex) => {
    sourceMetadata(file)
    const engine_source_id = `engine-source-${String(sourceIndex + 1).padStart(4, '0')}`
    const projections = file.document.profiles.map((profile, sourceOrdinal) => {
      profileIdentity(profile, identities, seen)
      const projected = profileProjection(profile)
      appendProfile(rows, engine_source_id, sourceOrdinal, profile, projected)
      return { personId: profile.personId, profile: projected }
    })
    const projectionBytes = JSON.stringify(projections)
    rows.current_engine_source.push({
      engine_source_id, logical_path: file.logical_path, source_sha256: file.sha256, source_byte_length: file.byte_length,
      projection_schema: 'public-character-profile.v1', projection_sha256: createHash('sha256').update(projectionBytes).digest('hex'),
      profile_count: projections.length,
    })
  })
  return frozenRows(rows)
}
