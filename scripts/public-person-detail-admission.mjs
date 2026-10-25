import { readFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { sha256, validateSeoulScope } from './seoul-scope.mjs'
import { isAuthenticatedPublicationReview } from './seoul-census.mjs'
import { materializePublicLegacyProjectionMapping } from './public-legacy-projection-successor.mjs'
import { fileURLToPath } from 'node:url'
import { projectPublicHistoricalRecord } from './preserved-person-sheet.mjs'

const fail = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id) => { if (!condition) fail(code, path, id) }
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)

// Derived from PersonDetailPage.PersonDetail and generate-catalog's peopleCatalog,
// detail constructor, birthday projection and projectPersonHoldings, not input IDs.
// Optional fields still need exact nested review; their presence is not approval.
const requiredFields = ['id', 'characterId', 'name', 'title', 'position', 'rank', 'commonTier',
  'occupation', 'gender', 'stage', 'state', 'stateName', 'sourceRoute', 'detailRoute',
  'gurps', 'personSheet', 'clan', 'generation', 'minors', 'sourceKind',
  'values', 'desire', 'fields', 'sections', 'biography', 'sources', 'relations']
const optionalFields = ['birthDate', 'birthday', 'age', 'ageAsOf', 'sourceStatus', 'sourceRefs',
  'familyTree', 'household', 'proseContacts', 'rightsPermissions', 'characterProfile',
  'confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles',
  'sovereignTitle', 'retinueGroups', 'openingDisposition', 'unit', 'territory',
  'wandering_force', 'directLiege', 'court', 'politicalIdentities', 'locked']

// Code-owned exact technical mapping receipts; semantic authority remains in
// the separately authenticated publication review checked during admission.
const APPROVED_DETAIL_MAPPING_RECEIPTS = Object.freeze([Object.freeze({
  path: '.omo/private/seoul-migration/person-detail-field-mappings-20261019/receipt.json',
  sha256: 'cbd46d3bf402cc86845275102b9b1863f06cf66177c6bf4cb909f901411f54ca',
})])
const authenticatedMappingAuthorities = new WeakSet()
const mappingPath = '/person-details/fieldMappings'
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const escapePointer = key => key.replace(/~/g, '~0').replace(/\//g, '~1')
const sourcePath = path => typeof path === 'string'
  && (/^(?:lore|vendor\/issued-history)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.json$/.test(path) || path === 'person-rights-permissions.json')
  && !path.split('/').includes('..') && !path.split('/').includes('.')

/** @typedef {{ sourcePath: string, jsonPointer: string, anchor: string|null, sourceSha256: string, valueSha256: string }} SourceBinding */
/** @typedef {{ characterId: string, jsonPointer: string, disposition: 'retain'|'replace'|'omit', valueSha256: string|null, source: SourceBinding, approvedSuccessor: SourceBinding|null, transformation?: string }} DetailFieldMapping */

/**
 * Pure comparison only; success is NOT a publication capability.
 * The independent receipt pins a complete expected detail snapshot and mappings
 * for every container, leaf and absent top-level optional. Container hashes also
 * bind empty arrays/objects and prevent shrinking a nested field denominator.
 * Sources are exact JSON bytes with independent pointer/anchor bindings. The
 * reviewed receipt must enumerate the generator's cross-producer transformations,
 * including rendered card bodies, sheet variants, and intentional absence.
 * @param {object[]} details
 * @param {string} receiptBytes
 * @param {{ receiptSha256: string, sources: Readonly<Record<string, string>> }} evidence
 * @returns {true}
 */
export function validatePersonDetailFieldMappings(details, receiptBytes, evidence) {
  check(typeof receiptBytes === 'string' && digest(evidence?.receiptSha256)
    && sha256(receiptBytes) === evidence.receiptSha256, 'E_REVIEW_HASH', mappingPath)
  const receipt = JSON.parse(receiptBytes)
  return validateParsedPersonDetailFieldMappings(details, receipt, evidence)
}

// Private entry point for the loader, which has already verified the exact
// successor bytes. Do not retain a second 528 MB receipt object during validation.
function validateParsedPersonDetailFieldMappings(details, receipt, evidence) {
  check(record(receipt) && receipt.schema === 'person-detail-field-mappings.v2'
    && Object.keys(receipt).sort().join('|') === ['schema', 'reviewer', 'approvalRef', 'reviewedAt', 'sourceHashes', 'details', 'fieldMappings'].sort().join('|')
    && typeof receipt.reviewer === 'string' && receipt.reviewer.trim() !== ''
    && typeof receipt.approvalRef === 'string' && receipt.approvalRef.trim() !== ''
    && typeof receipt.reviewedAt === 'string' && Number.isFinite(Date.parse(receipt.reviewedAt))
    && record(receipt.sourceHashes) && Object.keys(receipt.sourceHashes).length > 0
    && Array.isArray(receipt.details) && Array.isArray(receipt.fieldMappings)
    && record(evidence.sources), 'E_SCOPE_SHAPE', mappingPath)
  check(Object.keys(receipt.sourceHashes).every(path => sourcePath(path) && digest(receipt.sourceHashes[path]))
    && Object.keys(evidence.sources).sort().join('|') === Object.keys(receipt.sourceHashes).sort().join('|'),
  'E_REVIEW_COVERAGE', mappingPath)
  const expected = new Map()
  const collect = (value, pointer, fields) => {
    check(value !== undefined && (value === null || ['string', 'boolean', 'object'].includes(typeof value)
      || (typeof value === 'number' && Number.isFinite(value))), 'E_SCOPE_SHAPE', pointer)
    fields.set(pointer, sha256(JSON.stringify(value)))
    if (value !== null && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) collect(child, `${pointer}/${escapePointer(key)}`, fields)
    }
  }
  const indexDetails = rows => {
    check(Array.isArray(rows) && rows.length === 1022, 'E_CENSUS_PERSON', mappingPath)
    const indexed = new Map()
    for (const detail of rows) {
      const id = detail?.characterId
      check(record(detail) && typeof id === 'string' && !indexed.has(id), 'E_CENSUS_PERSON', mappingPath, id)
      check(Object.keys(detail).every(key => requiredFields.includes(key) || optionalFields.includes(key)),
        'E_SCOPE_SHAPE', mappingPath, id)
      const fields = new Map()
      for (const variant of detail.personSheet?.variants ?? []) {
        const historical = variant?.legacy?.record
        check(record(historical) && JSON.stringify(historical) === JSON.stringify(projectPublicHistoricalRecord(historical)),
          'E_SCOPE_PROJECTION', '/personSheet/variants/legacy/record', id)
      }
      for (const field of requiredFields) check(Object.hasOwn(detail, field), 'E_REVIEW_COVERAGE', `/${field}`, id)
      for (const field of [...requiredFields, ...optionalFields]) {
        if (Object.hasOwn(detail, field)) collect(detail[field], `/${field}`, fields)
        else fields.set(`/${field}`, null)
      }
      indexed.set(id, fields)
    }
    return indexed
  }
  for (const [id, fields] of indexDetails(receipt.details)) expected.set(id, fields)
  const actual = details === receipt.details ? expected : indexDetails(details)
  check([...expected.keys()].every(id => actual.has(id)), 'E_CENSUS_PERSON', mappingPath)
  const parsedSources = new Map()
  const verifiedBindings = new Set()
  const verifySource = binding => {
    const key = JSON.stringify(binding)
    if (verifiedBindings.has(key)) return
    check(record(binding) && Object.keys(binding).length === 5
      && ['sourcePath', 'jsonPointer', 'anchor', 'sourceSha256', 'valueSha256'].every(key => Object.hasOwn(binding, key))
      && sourcePath(binding.sourcePath) && typeof binding.jsonPointer === 'string'
      && (binding.anchor === null || typeof binding.anchor === 'string')
      && digest(binding.sourceSha256)
      && digest(binding.valueSha256), 'E_SCOPE_SHAPE', mappingPath)
    check(binding.sourceSha256 === receipt.sourceHashes[binding.sourcePath], 'E_REVIEW_HASH', binding.sourcePath)
    if (!parsedSources.has(binding.sourcePath)) {
      const bytes = Object.hasOwn(evidence.sources, binding.sourcePath) ? evidence.sources[binding.sourcePath] : undefined
      check(typeof bytes === 'string', 'E_REVIEW_HASH', binding.sourcePath)
      parsedSources.set(binding.sourcePath, { hash: sha256(bytes), value: JSON.parse(bytes) })
    }
    const source = parsedSources.get(binding.sourcePath)
    check(source.hash === binding.sourceSha256, 'E_REVIEW_HASH', binding.sourcePath)
    let value = source.value
    let anchor = record(value) && typeof value.anchor === 'string' ? value.anchor : null
    check(binding.jsonPointer === '' || /^\/(?:[^~]|~[01])*$/.test(binding.jsonPointer), 'E_SCOPE_SHAPE', mappingPath)
    for (const token of binding.jsonPointer === '' ? [] : binding.jsonPointer.slice(1).split('/')) {
      const key = token.replace(/~1/g, '/').replace(/~0/g, '~')
      check(value !== null && typeof value === 'object' && Object.hasOwn(value, key), 'E_REVIEW_COVERAGE', binding.sourcePath)
      value = value[key]
      if (record(value) && typeof value.anchor === 'string') anchor = value.anchor
    }
    check(anchor === binding.anchor && sha256(JSON.stringify(value)) === binding.valueSha256,
      'E_REVIEW_HASH', binding.sourcePath)
    verifiedBindings.add(key)
  }
  const seen = new Set()
  for (const row of receipt.fieldMappings) {
    check(record(row) && [6, 7].includes(Object.keys(row).length)
      && ['characterId', 'jsonPointer', 'disposition', 'valueSha256', 'source', 'approvedSuccessor'].every(key => Object.hasOwn(row, key)),
    'E_SCOPE_SHAPE', mappingPath)
    check(Object.keys(row).every(key => ['characterId', 'jsonPointer', 'disposition', 'valueSha256', 'source', 'approvedSuccessor', 'transformation'].includes(key))
      && (!Object.hasOwn(row, 'transformation') || typeof row.transformation === 'string' && row.transformation.trim().length > 0),
    'E_SCOPE_SHAPE', mappingPath)
    const key = JSON.stringify([row.characterId, row.jsonPointer])
    check(!seen.has(key) && expected.get(row.characterId)?.has(row.jsonPointer), 'E_REVIEW_COVERAGE', mappingPath, key)
    seen.add(key)
    const valueHash = expected.get(row.characterId).get(row.jsonPointer)
    check(row.valueSha256 === valueHash && (valueHash === null ? row.disposition === 'omit'
      : ['retain', 'replace'].includes(row.disposition)), 'E_REVIEW_COVERAGE', row.jsonPointer, row.characterId)
    verifySource(row.source)
    if (row.disposition === 'retain') check(row.approvedSuccessor === null && !Object.hasOwn(row, 'transformation'), 'E_SCOPE_SHAPE', row.jsonPointer)
    else if (row.disposition === 'omit' && row.approvedSuccessor === null) {
      // An absent optional has no successor value. Its authenticated originating
      // source and the pinned transformation record the generator's decision.
      check(Object.hasOwn(row, 'transformation'), 'E_REVIEW_COVERAGE', row.jsonPointer, row.characterId)
    } else verifySource(row.approvedSuccessor)
    if (valueHash !== null && !Object.hasOwn(row, 'transformation')) check((row.disposition === 'retain' ? row.source : row.approvedSuccessor).valueSha256 === valueHash,
      'E_REVIEW_HASH', row.jsonPointer, row.characterId)
    if (valueHash !== null && row.disposition === 'replace') check(row.approvedSuccessor !== null, 'E_REVIEW_COVERAGE', row.jsonPointer, row.characterId)
  }
  for (const [id, fields] of expected) {
    for (const [pointer, valueHash] of fields) {
      check(seen.has(JSON.stringify([id, pointer])), 'E_REVIEW_COVERAGE', pointer, id)
      check(actual.get(id).has(pointer) && actual.get(id).get(pointer) === valueHash, 'E_SCOPE_PROJECTION', pointer, id)
    }
    for (const pointer of actual.get(id).keys()) check(fields.has(pointer), 'E_REVIEW_COVERAGE', pointer, id)
  }
  check(parsedSources.size === Object.keys(receipt.sourceHashes).length, 'E_REVIEW_COVERAGE', mappingPath)
  return true
}

/**
 * Reads only this checkout and code-owned pins. A caller cannot supply a root,
 * reader, receipt body, source bytes, or pin. The result is branded privately.
 */
export async function loadPersonDetailMappingAuthority() {
  check(APPROVED_DETAIL_MAPPING_RECEIPTS.length === 1, 'E_REVIEW_COVERAGE', mappingPath)
  const pin = APPROVED_DETAIL_MAPPING_RECEIPTS[0]
  check(typeof pin.path === 'string' && /^\.omo\/private\/seoul-migration\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.json$/.test(pin.path)
    && !pin.path.split('/').includes('..') && digest(pin.sha256), 'E_REVIEW_COVERAGE', mappingPath)
  const predecessorHash = createHash('sha256')
  for await (const chunk of createReadStream(new URL(`../${pin.path}`, import.meta.url))) predecessorHash.update(chunk)
  check(predecessorHash.digest('hex') === pin.sha256, 'E_REVIEW_HASH', pin.path)
  const successor = await materializePublicLegacyProjectionMapping(fileURLToPath(new URL('../', import.meta.url)))
  const successorSha256 = '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96'
  check(successor.sha256 === successorSha256, 'E_REVIEW_HASH', mappingPath)
  const receiptBytes = successor.bytes
  const receipt = JSON.parse(receiptBytes)
  check(record(receipt.sourceHashes), 'E_SCOPE_SHAPE', mappingPath)
  const sources = {}
  for (const path of Object.keys(receipt.sourceHashes)) {
    check(sourcePath(path), 'E_SCOPE_SHAPE', path)
    sources[path] = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  }
  validateParsedPersonDetailFieldMappings(receipt.details, receipt, { receiptSha256: successorSha256, sources })
  const authority = Object.freeze({ receiptBytes, receiptSha256: successorSha256,
    sources: Object.freeze(sources) })
  authenticatedMappingAuthorities.add(authority)
  return authority
}

export function assertApprovedPersonDetailMappingReceipt(authority, details) {
  check(authenticatedMappingAuthorities.has(authority), 'E_REVIEW_COVERAGE', mappingPath)
  return validatePersonDetailFieldMappings(details, authority.receiptBytes, authority)
}

// Closed DB evidence replay. Archived snapshots authenticate the receipt;
// every current source must independently match typed current authority.
export async function loadDatabasePersonDetailMappingAuthority({ db, evidenceStore, historyStore,
  originalMappingStore, finalMappingStore, sourceStore, editorialProfiles }) {
  const { replayDatabasePersonalTiers } = await import('./document-store/person-tier-replay.mjs')
  const { verifyPersonMappingCurrentSources } = await import('./document-store/person-mapping-current-source.mjs')
  const { assertBaselinePersonalTiers } = await import('./personal-tier-provenance.mjs')
  const original = APPROVED_DETAIL_MAPPING_RECEIPTS[0]
  originalMappingStore.getEvidence(original.path, original.sha256)
  finalMappingStore.getEvidence('scripts/public-legacy-projection-receipt.json',
    'c987c8144d805310ef8e95b3ace429cd942704a36fd0a00a5ce1cce9a6c60ab7')
  const receiptSha256 = '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96'
  const receiptBytes = finalMappingStore.getEvidence('person-detail-mapping:final:20261020', receiptSha256).toString('utf8')
  check(sha256(receiptBytes) === receiptSha256, 'E_REVIEW_HASH', mappingPath)
  const receipt = JSON.parse(receiptBytes)
  const tiers = await replayDatabasePersonalTiers({ db, evidenceStore, historyStore })
  assertBaselinePersonalTiers(tiers, receipt.details)
  verifyPersonMappingCurrentSources({ db, sourceHashes: receipt.sourceHashes, sourceStore, editorialProfiles })
  const sources = {}
  for (const [path, hash] of Object.entries(receipt.sourceHashes)) {
    check(sourcePath(path), 'E_SCOPE_SHAPE', path)
    sources[path] = sourceStore.getEvidence(`mapping-source:${path}`, hash).toString('utf8')
  }
  validateParsedPersonDetailFieldMappings(receipt.details, receipt, { receiptSha256, sources })
  const authority = Object.freeze({ receiptBytes, receiptSha256, sources: Object.freeze(sources) })
  authenticatedMappingAuthorities.add(authority)
  return authority
}

/**
 * Full-detail admission, never a projection or a sanitization step.
 * Returns the original complete details only under independently authenticated
 * document, Seoul-scope and full-detail source-to-field review.
 */
export function admitPublicPersonDetails(details, scopeInput, mappingAuthority) {
  const ids = scopeInput?.baseline?.currentEntitySets?.persons
  const current = scopeInput?.current?.entitySets?.persons
  const entities = scopeInput?.contract?.entities
  const dispositions = scopeInput?.contract?.dispositions
  const refs = scopeInput?.refs
  check(Array.isArray(details) && Array.isArray(ids) && Array.isArray(current)
    && Array.isArray(entities) && Array.isArray(dispositions) && Array.isArray(refs), 'E_SCOPE_SHAPE', '/person-details')
  const exact = (actual, expected, path) => check(actual.length === expected.length
    && new Set(actual).size === actual.length && expected.every(id => actual.includes(id)), 'E_CENSUS_PERSON', path)
  exact(current, ids, '/person-details/current')
  exact(details.map(row => row?.characterId), ids, '/person-details/ids')
  const known = new Map(refs.map(row => [row.id, row]))
  const personEntities = new Map(entities.filter(row => row.kind === 'person' && row.status === 'active').map(row => [row.id, row]))
  const active = dispositions.filter(row => row.set === 'persons' && row.status === 'active').flatMap(row => row.targetIds)
  exact(active, ids, '/person-details/dispositions')
  const rights = new Map((scopeInput.current.rights ?? []).map(row => [row.id, row]))
  const holdings = new Map(entities.filter(row => row.kind === 'holding' && row.status === 'active').map(row => [row.id, row]))
  const assertRefs = (values, path, id) => {
    check(Array.isArray(values), 'E_SCOPE_PROJECTION', path, id)
    for (const ref of values) {
      const entry = known.get(ref)
      check(entry, 'E_SCOPE_ADMISSION', path, ref)
      check(entry.inside === true && entry.boundarySha256 === scopeInput.boundary.sha256,
        'E_SCOPE_PROJECTION', path, ref)
    }
  }
  for (const detail of details) {
    const id = detail.characterId
    // Current land rights are projected only in the authenticated holdings
    // collections. The preserved sheet territory is non-operative history.
    check(!Object.hasOwn(detail, 'territory'), 'E_SCOPE_PROJECTION', '/person-details/territory', id)
    const entity = personEntities.get(id)
    check(entity, 'E_SCOPE_ADMISSION', '/person-details/person', id)
    assertRefs(entity.locationRefs, '/person-details/locationRefs', id)
    check(entity.locationRefs.length > 0, 'E_SCOPE_PROJECTION', '/person-details/locationRefs', id)
    check(typeof detail.id === 'string' && typeof detail.name === 'string'
      && detail.detailRoute === `/people/${detail.id}`, 'E_SCOPE_PROJECTION', '/person-details/identity', id)
    for (const row of [...rights.values()].filter(row => row.holderPersonId === id)) {
      const holding = holdings.get(row.id)
      check(holding, 'E_SCOPE_ADMISSION', '/person-details/rights', row.id)
      assertRefs(holding.locationRefs, '/person-details/rights/locationRefs', row.id)
      assertRefs(holding.jurisdictionRefs, '/person-details/rights/jurisdictionRefs', row.id)
    }
    // Raw detail is not authoritative: an unlisted direct holding must not disappear
    // just because the catalog or search projection omitted the person.
    for (const field of ['confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles', 'retinueGroups']) {
      if (detail[field] === undefined) continue
      check(Array.isArray(detail[field]), 'E_SCOPE_PROJECTION', `/person-details/${field}`, id)
      for (const row of detail[field]) {
        check(record(row) && typeof row.id === 'string', 'E_SCOPE_PROJECTION', `/person-details/${field}`, id)
        if (field === 'openingTitles' && row.jurisdictionRefs !== undefined) {
          assertRefs(row.jurisdictionRefs, '/person-details/openingTitles/jurisdictionRefs', row.id)
        }
        if (field === 'confirmedHoldings' || field === 'subordinateHoldings' || field === 'superiorJurisdictions') {
          const right = rights.get(row.id)
          check(right && holdings.has(row.id), 'E_SCOPE_ADMISSION', `/person-details/${field}`, row.id)
          check(right.holderPersonId === (field === 'subordinateHoldings' ? row.holderPersonId : id),
            'E_SCOPE_PROJECTION', `/person-details/${field}`, row.id)
          const entityRow = holdings.get(row.id)
          for (const key of ['stationRef', 'facilityRef', 'landmarkRef'].filter(key => row[key] != null)) {
            // These selectors are pinned by the current holdings source. Resolve
            // through that holding's approved entity, never by station-name guess.
            check(right.sourceRefs?.[key] !== undefined
              && sha256(JSON.stringify(row[key])) === right.sourceRefs[key],
            'E_SCOPE_PROJECTION', `/person-details/${field}/refs`, row.id)
            check(entityRow.locationRefs.length + entityRow.jurisdictionRefs.length > 0,
              'E_SCOPE_PROJECTION', `/person-details/${field}/refs`, row.id)
          }
          for (const ref of [...(row.adminRefs ?? []).map(value => value.id), ...(row.locationRefs ?? []), ...(row.jurisdictionRefs ?? [])]) {
            const knownRef = known.get(ref)
            check(knownRef, 'E_SCOPE_ADMISSION', `/person-details/${field}/refs`, ref)
            const admitted = [...entityRow.locationRefs, ...entityRow.jurisdictionRefs]
            const targets = admitted.includes(ref) ? [ref] : right.referenceMappings?.[ref] ?? []
            check(knownRef.inside === true && targets.length > 0
              && targets.every(target => known.get(target)?.inside === true && admitted.includes(target)),
              'E_SCOPE_PROJECTION', `/person-details/${field}/refs`, ref)
          }
        }
      }
    }
    for (const field of Object.keys(detail)) check(requiredFields.includes(field) || optionalFields.includes(field),
      'E_SCOPE_SHAPE', `/person-details/${field}`, id)
    for (const field of requiredFields) check(Object.hasOwn(detail, field),
      'E_REVIEW_COVERAGE', `/person-details/${field}`, id)
    for (const field of ['fields', 'sections', 'values', 'desire', 'gurps', 'personSheet', 'relations']) {
      check(record(detail[field]), 'E_SCOPE_SHAPE', `/person-details/${field}`, id)
    }
    check(typeof detail.biography === 'string' && detail.biography.trim().length > 0,
      'E_REVIEW_COVERAGE', '/person-details/biography', id)
    check(Array.isArray(detail.sources) && Array.isArray(detail.relations.outgoing)
      && Array.isArray(detail.relations.incoming), 'E_SCOPE_SHAPE', '/person-details/relations', id)
  }
  // Preflight above diagnoses leaks, but never grants authority or changes a field.
  check(isAuthenticatedPublicationReview(scopeInput.current.publicationReview),
    'E_SCOPE_PENDING', '/current/publicationReview')
  // loadScopeInput also returns census diagnostics for the CLI/private projector.
  // Match runScopeCli's envelope; these are not part of the pure scope contract.
  const { dependencies, dependencyReport, ...publicationInput } = scopeInput
  const result = validateSeoulScope(publicationInput, { mode: 'publication' })
  if (!result.ok) throw Object.assign(new Error(result.errors[0].code), result.errors[0])
  assertApprovedPersonDetailMappingReceipt(mappingAuthority, details)
  return details
}
