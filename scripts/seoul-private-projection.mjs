import { ENTITY_SETS, validateSeoulScope } from './seoul-scope.mjs'
import { validateDependencyClosure } from './seoul-census.mjs'

export const PRIVATE_PROJECTION_SCHEMA = 'seoul-private-projection.v1'
export const PRIVATE_PROJECTION_PATH = 'private-projection.json'
const fail = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id) => { if (!condition) fail(code, path, id) }
function exact(actual, expected, code, path) {
  check(Array.isArray(actual) && new Set(actual).size === actual.length
    && actual.length === expected.length && expected.every(id => actual.includes(id)), code, path)
}

// A private, typed preparation product, not the public catalog or a replacement
// for the historical allocation validator. No raw source bodies are spread into
// this shape. The caller supplies independently extracted census dependencies.
export function projectPrivateSeoulScope(input, dependencies, batchId) {
  const result = validateSeoulScope(input, { mode: 'migration', batchId })
  if (!result.ok) throw Object.assign(new Error(result.errors[0].code), result.errors[0])
  check(dependencies && Array.isArray(dependencies.unresolved) && Array.isArray(dependencies.sharedSourceGroups),
    'E_SCOPE_SHAPE', '/projection/dependencies')
  validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'migration', batchId })
  const closure = new Set([batchId])
  for (const id of closure) for (const next of input.batches.find(batch => batch.id === id).dependencyBatchIds) closure.add(next)
  const entities = input.contract.entities.filter(row => row.status === 'active' && closure.has(row.batchId))
  const dispositions = input.contract.dispositions.filter(row => row.status === 'active' && closure.has(row.batchId))
  const kindForSet = { persons: 'person', titles: 'title', holdings: 'holding', grants: 'holding', states: 'state', polities: 'state', events: 'event' }
  for (const [set, kind] of Object.entries(kindForSet)) {
    const targets = dispositions.filter(row => row.set === set).flatMap(row => row.targetIds)
    exact([...new Set(targets)], entities.filter(row => row.kind === kind && input.current.entitySets[set].includes(row.id)).map(row => row.id),
      set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/projection/active/${set}`)
  }
  // Retain the full issued-right denominator, including unrelated pending rows.
  // A scope-only declaration cannot invent or omit a holder in the projection.
  const sourceRights = input.current.rights ?? []
  exact(sourceRights.map(row => row.id), [...input.current.entitySets.holdings, ...input.current.entitySets.grants], 'E_CENSUS_RIGHT', '/projection/sourceRights')
  const people = entities.filter(row => row.kind === 'person')
  const rights = entities.filter(row => row.kind === 'holding').map(entity => {
    const source = sourceRights.find(row => row.id === entity.id)
    check(people.some(person => person.id === source.holderPersonId), 'E_SCOPE_ADMISSION', '/projection/holderPersonId', entity.id)
    check(source.slotStatus === null || ['direct', 'vassal'].includes(source.slotStatus), 'E_SCOPE_SHAPE', '/projection/slotStatus', entity.id)
    return { id: entity.id, set: input.current.entitySets.holdings.includes(entity.id) ? 'holdings' : 'grants',
      holderPersonId: source.holderPersonId, slotStatus: source.slotStatus,
      locationRefs: entity.locationRefs, jurisdictionRefs: entity.jurisdictionRefs }
  })
  return structuredClone({ schema: PRIVATE_PROJECTION_SCHEMA, visibility: 'private', batchId, baselineSha256: input.baselineSha256,
    coverage: { entitySets: input.current.entitySets, dispositions: input.contract.dispositions },
    entities, rights,
    people: people.map(person => ({ personId: person.id, locationRefs: person.locationRefs,
      holdings: rights.filter(right => right.holderPersonId === person.id) })),
  })
}

// Validate every field, including nested detail holdings; a search/index omission
// cannot conceal an external direct-detail location. Unknown fields fail closed.
export function validatePrivateSeoulProjection(projection, input, dependencies, batchId) {
  try {
    const expected = projectPrivateSeoulScope(input, dependencies, batchId)
    for (const set of ENTITY_SETS) exact(projection.coverage?.entitySets?.[set], input.baseline.currentEntitySets[set],
      set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/projection/coverage/${set}`)
    exact(projection.people?.map(row => row.personId), expected.people.map(row => row.personId), 'E_CENSUS_PERSON', '/projection/people')
    exact(projection.rights?.map(row => row.id), expected.rights.map(row => row.id), 'E_CENSUS_RIGHT', '/projection/rights')
    for (const row of projection.entities) check(expected.entities.some(entity => entity.kind === row.kind && entity.id === row.id),
      'E_SCOPE_ADMISSION', '/projection/entities', row.id)
    function compare(actual, wanted, path) {
      if (Array.isArray(wanted)) {
        check(Array.isArray(actual) && actual.length === wanted.length, 'E_SCOPE_PROJECTION', path)
        wanted.forEach((row, index) => compare(actual[index], row, `${path}/${index}`))
      } else if (wanted && typeof wanted === 'object') {
        check(actual && typeof actual === 'object' && !Array.isArray(actual), 'E_SCOPE_SHAPE', path)
        exact(Object.keys(actual), Object.keys(wanted), 'E_SCOPE_SHAPE', path)
        for (const key of Object.keys(wanted)) compare(actual[key], wanted[key], `${path}/${key}`)
      } else check(actual === wanted, 'E_SCOPE_PROJECTION', path)
    }
    compare(projection, expected, '/projection')
    return { ok: true, errors: [] }
  } catch (error) {
    if (error instanceof TypeError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/projection', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id }] }
  }
}
