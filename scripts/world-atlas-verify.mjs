import { ATLAS_SCHEMA, FROZEN_HUMAN_COUNT, STATES, ADDITIONAL_PERSON_FIELDS } from './world-atlas-schema.mjs'
export function verifyAtlasPeople(atlas, { registry, candidates, people, routes }) {
 const failures = []
 if (atlas.schema !== ATLAS_SCHEMA) failures.push('E_ATLAS_SCHEMA')
 const stateIds = STATES.map(p => p.id)
 if (JSON.stringify(atlas.states?.map(p => p.id)) !== JSON.stringify(stateIds)) failures.push('E_ATLAS_STATES')
 if (!Array.isArray(atlas.humans) || atlas.humans.length !== FROZEN_HUMAN_COUNT) return { failures: [...failures, 'E_K_MAP'], stateCount: 0, additionalCount: 0, total: 0 }
 for (const [index, human] of atlas.humans.entries()) {
  const frozen = candidates.existingK[index]
  if (!frozen || human.id !== frozen.id || human.name?.ko !== frozen.name || !stateIds.includes(human.state_id)) failures.push('E_K_MAP:' + human.id)
 }
 const frozenIds = new Set(atlas.humans.map(p => p.id))
 const issued = new Map(registry.persons.map(p => [p.id, p]))
 const values = new Map(people.map(p => [p.name, p]))
 if (values.size !== people.length || issued.size !== registry.persons.length) failures.push('E_PERSON_DUPLICATE')
 const expected = registry.persons.filter(p => !frozenIds.has(p.id))
 const collection = atlas.additional_people
 if (!collection || typeof collection !== 'object' || Array.isArray(collection)) return { failures: [...failures, 'E_ADDITIONAL_COLLECTION'], stateCount: atlas.humans.length, additionalCount: 0, total: atlas.humans.length }
 const aliases = new Set(), paths = new Set()
 for (const [id, person] of Object.entries(collection)) {
  const entry = issued.get(id), value = entry && values.get(entry.name), route = routes?.get(id)
  if (frozenIds.has(id) || aliases.has(person.character_id) || paths.has(person.detail_route)) failures.push('E_PERSON_DUPLICATE:' + id)
  aliases.add(person.character_id); paths.add(person.detail_route)
  if (Object.keys(person).some(k => !ADDITIONAL_PERSON_FIELDS.includes(k)) || !person.name?.ko || !person.character_id) failures.push('E_ADDITIONAL_FIELDS:' + id)
  if (!entry || person.name.ko !== entry.name) failures.push('E_ADDITIONAL_IDENTITY:' + id)
  if (person.character_id !== (entry?.aliases?.[0] ?? entry?.id)) failures.push('E_ADDITIONAL_CHARACTER_ID:' + id)
  if (!route || route.name !== entry?.name || person.detail_route !== route.detailRoute) failures.push('E_ADDITIONAL_ROUTE:' + id)
  const country = value?.state === 'S00' ? null : value?.state
  if (!value || person.national_state_id !== country || (country !== null && !stateIds.includes(country))) failures.push('E_ADDITIONAL_COUNTRY:' + id)
 }
 for (const entry of expected) if (!collection[entry.id]) failures.push('E_ADDITIONAL_MISSING:' + entry.id)
 const additionalCount = Object.keys(collection).length, total = atlas.humans.length + additionalCount
 if (additionalCount !== expected.length || total !== registry.persons.length) failures.push('E_HUMAN_TOTAL')
 return { failures, stateCount: atlas.humans.length, additionalCount, total }
}
