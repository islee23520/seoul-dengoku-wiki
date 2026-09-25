import { ATLAS_SCHEMA, FROZEN_HUMAN_COUNT, STATES, UNAFFILIATED_FIELDS } from './world-atlas-schema.mjs'

// The atlas covers a frozen state prefix plus all currently issued S00 people, not all cast cards.
export function verifyAtlasPeople(atlas, { registry, candidates, people }) {
  const failures = []
  if (atlas.schema !== ATLAS_SCHEMA) failures.push('E_ATLAS_SCHEMA')
  const stateIds = STATES.map((state) => state.id)
  if (JSON.stringify(atlas.states?.map((state) => state.id)) !== JSON.stringify(stateIds)) failures.push('E_ATLAS_STATES')
  if (!Array.isArray(atlas.humans) || atlas.humans.length !== FROZEN_HUMAN_COUNT) {
    failures.push('E_K_MAP')
    return { failures, stateCount: 0, unaffiliatedCount: 0, total: 0 }
  }
  for (const [index, human] of atlas.humans.entries()) {
    const frozen = candidates.existingK[index]
    if (!frozen || human.id !== frozen.id || human.name !== frozen.name || !stateIds.includes(human.state_id)) failures.push('E_K_MAP:' + human.id)
  }
  const collection = atlas.unaffiliated
  if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
    failures.push('E_UNAFFILIATED_COLLECTION')
    return { failures, stateCount: atlas.humans.length, unaffiliatedCount: 0, total: atlas.humans.length }
  }
  const issued = new Map(registry.persons.map((person) => [person.id, person]))
  const expected = people.filter((person) => person.state === 'S00')
  const ids = new Set(atlas.humans.map((human) => human.id))
  const characterIds = new Set()
  for (const [id, person] of Object.entries(collection)) {
    if (!person || typeof person !== 'object' || Array.isArray(person) ||
        Object.keys(person).some((field) => !UNAFFILIATED_FIELDS.includes(field)) ||
        UNAFFILIATED_FIELDS.some((field) => typeof person[field] !== 'string' || !person[field].trim())) {
      failures.push('E_UNAFFILIATED_FIELDS:' + id)
      continue
    }
    if (ids.has(id) || characterIds.has(person.character_id)) failures.push('E_PERSON_DUPLICATE:' + id)
    ids.add(id)
    characterIds.add(person.character_id)
    const entry = issued.get(id)
    if (!entry || entry.name !== person.name) failures.push('E_UNAFFILIATED_ISSUED_ID:' + id)
    else if (person.character_id !== (entry.aliases?.[0] ?? entry.id)) failures.push('E_UNAFFILIATED_CHARACTER_ID:' + id)
    const personIndex = Number(id.slice(1)) - 1
    const castPerson = people[personIndex]
    if (!castPerson || castPerson.state !== 'S00') failures.push('E_UNAFFILIATED_MEMBERSHIP:' + id)
    if (!castPerson || castPerson.name !== person.name) failures.push('E_UNAFFILIATED_ROUTE:' + id)
  }
  for (const [index, person] of people.entries()) {
    if (person.state === 'S00' && !collection[`K${String(index + 1).padStart(3, '0')}`]) failures.push('E_UNAFFILIATED_MISSING:' + person.name)
  }
  const stateCount = atlas.humans.length
  const unaffiliatedCount = Object.keys(collection).length
  const total = stateCount + unaffiliatedCount
  if (total !== FROZEN_HUMAN_COUNT + expected.length || ids.size !== total) failures.push('E_HUMAN_TOTAL')
  return { failures, stateCount, unaffiliatedCount, total }
}
