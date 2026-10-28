const fail = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id) => { if (!condition) fail(code, path, id) }
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)

// Derived from PersonDetailPage.PersonDetail and generate-catalog's peopleCatalog,
// detail constructor, birthday projection and projectPersonHoldings, not input IDs.
const requiredFields = ['id', 'characterId', 'name', 'title', 'position', 'rank', 'commonTier',
  'occupation', 'gender', 'stage', 'state', 'stateName', 'sourceRoute', 'detailRoute',
  'gurps', 'personSheet', 'clan', 'generation', 'minors', 'sourceKind',
  'values', 'desire', 'fields', 'sections', 'biography', 'sources', 'relations']
const optionalFields = ['birthDate', 'birthday', 'age', 'ageAsOf', 'sourceStatus', 'sourceRefs',
  'familyTree', 'household', 'proseContacts', 'rightsPermissions', 'characterProfile',
  'confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles',
  'sovereignTitle', 'retinueGroups', 'openingDisposition', 'unit', 'territory',
  'wandering_force', 'directLiege', 'court', 'politicalIdentities', 'locked']
// Current publication no longer exposes GURPS sheets or their detached unit/camp projections.
const currentRequiredFields = requiredFields.filter(field => !['gurps', 'personSheet'].includes(field))
const currentOptionalFields = optionalFields.filter(field => !['unit', 'territory', 'wandering_force'].includes(field))

const escapePointer = key => key.replace(/~/g, '~0').replace(/\//g, '~1')

/**
 * Public person-detail field admission: shape, identity and privacy checks only.
 * Never a projection or a sanitization step.
 */
export function admitPublicPersonDetails(details) {
  check(Array.isArray(details), 'E_SCOPE_SHAPE', '/person-details')
  const ids = details.map(row => row?.characterId)
  check(ids.every(id => typeof id === 'string') && new Set(ids).size === ids.length, 'E_SCOPE_SHAPE', '/person-details/ids')
  const assertPublicFields = (value, path, id) => {
    if (value === null || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const pointer = `${path}/${escapePointer(key)}`
      check(!/^(?:souls?|soulAssignments|soulCandidates|historicalMotif)$/iu.test(key),
        'E_SCOPE_PROJECTION', pointer, id)
      assertPublicFields(child, pointer, id)
    }
  }
  for (const detail of details) {
    const id = detail.characterId
    // The preserved sheet territory is non-operative history.
    check(!Object.hasOwn(detail, 'territory'), 'E_SCOPE_PROJECTION', '/person-details/territory', id)
    check(typeof detail.id === 'string' && typeof detail.name === 'string'
      && detail.detailRoute === `/people/${detail.id}`, 'E_SCOPE_PROJECTION', '/person-details/identity', id)
    for (const field of ['confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles', 'retinueGroups']) {
      if (detail[field] === undefined) continue
      check(Array.isArray(detail[field]), 'E_SCOPE_PROJECTION', `/person-details/${field}`, id)
      for (const row of detail[field]) check(record(row) && typeof row.id === 'string', 'E_SCOPE_PROJECTION', `/person-details/${field}`, id)
    }
    for (const field of Object.keys(detail)) check(currentRequiredFields.includes(field) || currentOptionalFields.includes(field),
      'E_SCOPE_SHAPE', `/person-details/${field}`, id)
    assertPublicFields(detail, '/person-details', id)
    for (const field of currentRequiredFields) check(Object.hasOwn(detail, field),
      'E_SCOPE_SHAPE', `/person-details/${field}`, id)
    for (const field of ['fields', 'sections', 'values', 'desire', 'relations']) {
      check(record(detail[field]), 'E_SCOPE_SHAPE', `/person-details/${field}`, id)
    }
    check(typeof detail.biography === 'string' && detail.biography.trim().length > 0,
      'E_SCOPE_SHAPE', '/person-details/biography', id)
    check(Array.isArray(detail.sources) && Array.isArray(detail.relations.outgoing)
      && Array.isArray(detail.relations.incoming), 'E_SCOPE_SHAPE', '/person-details/relations', id)
  }
  return details
}
