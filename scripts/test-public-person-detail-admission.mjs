import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { sha256 } from './seoul-scope.mjs'
import { admitPublicPersonDetails, assertApprovedPersonDetailMappingReceipt, validatePersonDetailFieldMappings } from './public-person-detail-admission.mjs'
import { writePublicPersonDetails } from './generate-catalog.mjs'

const fixture = (historical = false) => {
  const ids = Array.from({ length: 1022 }, (_, index) => `K${String(index + 1).padStart(3, '0')}`)
  const ref = 'region:seoul'
  return {
    details: ids.map((characterId, index) => {
      const id = `person-${String(index + 1).padStart(4, '0')}`
      return { id, characterId, name: `Person ${index}`, detailRoute: `/people/${id}`,
        title: '', position: '', rank: '', commonTier: '', occupation: '', gender: '', stage: '',
        state: 'S00', stateName: '', sourceRoute: '/world/fixture',
        ...(historical ? { gurps: { id: characterId, personId: id }, personSheet: {} } : {}),
        clan: null, generation: 'opening', minors: false, sourceKind: 'fixture', locked: false,
        values: {}, desire: {}, fields: {}, sections: { biography: 'Fixture current biography' },
        biography: 'Fixture current biography', sources: ['fixture'], relations: { outgoing: [], incoming: [] } }
    }),
    scope: { baseline: { currentEntitySets: { persons: ids } }, current: { entitySets: { persons: [...ids] }, rights: [] },
      boundary: { sha256: 'fixture-boundary' }, refs: [{ id: ref, kind: 'region', inside: true, boundarySha256: 'fixture-boundary' },
        { id: 'region:outside', kind: 'region', inside: false, boundarySha256: 'fixture-boundary' }],
      contract: { entities: ids.map(id => ({ kind: 'person', id, status: 'active', locationRefs: [ref], jurisdictionRefs: [] })),
        dispositions: ids.map(id => ({ set: 'persons', id, status: 'active', targetIds: [id] })) } },
  }
}

test('all 1022 complete details remain unpublished and unmodified without authenticated review', () => {
  // Given all original IDs and page-required fields, but no publication authority.
  const { details, scope } = fixture()
  const original = structuredClone(details)
  // When admission is attempted, then it returns no stripped substitute.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PENDING', path: '/current/publicationReview' })
  assert.deepEqual(details, original)
})

test('a claimed mapping successor cannot replace independent publication review', () => {
  const { details, scope } = fixture()
  const original = structuredClone(details)
  const claimedSuccessor = { predecessor: 'person-detail-mapping:final:20261020',
    details: structuredClone(details), dependencies: [], changes: [] }
  assert.throws(() => admitPublicPersonDetails(details, scope, claimedSuccessor),
    { code: 'E_SCOPE_PENDING', path: '/current/publicationReview' })
  assert.throws(() => assertApprovedPersonDetailMappingReceipt(claimedSuccessor, details),
    { code: 'E_REVIEW_COVERAGE' })
  assert.deepEqual(details, original)
})

test('an ID-only payload cannot masquerade as complete public details', () => {
  // Given the old skinny projection contract with all 1022 IDs.
  const { details, scope } = fixture()
  const skinny = details.map(({ id, characterId, name, detailRoute }) => ({ id, characterId, name, detailRoute }))
  // When admitted, then required content coverage is missing.
  assert.throws(() => admitPublicPersonDetails(skinny, scope), { code: 'E_REVIEW_COVERAGE', path: '/person-details/title' })
})

test.each(['biography', 'sections', 'fields', 'relations'])('omitted %s cannot pass with all original IDs', field => {
  // Given a payload that silently drops one page field.
  const { details, scope } = fixture()
  delete details[0][field]
  // When admitted, then the exact omitted field is reported.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_REVIEW_COVERAGE', path: `/person-details/${field}` })
})

test('a hidden direct-detail holding outside Seoul fails even when absent from search', () => {
  // Given an in-scope holding whose direct-detail reference leaks outside Seoul.
  const { details, scope } = fixture()
  scope.current.rights.push({ id: 'holding:one', holderPersonId: 'K001', slotStatus: 'direct' })
  scope.contract.entities.push({ kind: 'holding', id: 'holding:one', status: 'active', locationRefs: ['region:seoul'], jurisdictionRefs: [] })
  details[0].confirmedHoldings = [{ id: 'holding:one', holderPersonId: 'K001', adminRefs: [{ id: 'region:outside' }] }]
  // When admitted, then a missing review cannot hide the leak diagnosis.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PROJECTION', path: '/person-details/confirmedHoldings/refs' })
})

test('unknown current entity references fail closed', () => {
  // Given an unknown person-location reference.
  const { details, scope } = fixture()
  scope.contract.entities[0].locationRefs = ['region:unknown']
  // When admitted, then the unknown reference is rejected.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_ADMISSION', id: 'region:unknown' })
})

test('preserved nonoperative sheet territory cannot become a public current holding', () => {
  const { details, scope } = fixture()
  details[0].territory = { fief_name: '구리', station: '구리', operative: false }
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_PROJECTION', path: '/person-details/territory', id: 'K001' })
})

test.each(['confirmedHoldings', 'subordinateHoldings'])('legacy territory cannot supply an unapproved %s right', field => {
  const { details, scope } = fixture()
  details[0][field] = [{ id: 'legacy-gurps:K001', holderPersonId: 'K001', name: { ko: '구리' } }]
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_ADMISSION', path: `/person-details/${field}`, id: 'legacy-gurps:K001' })
})

test('subordinate administrative refs preserve the reviewed correspondence to official dong geography', () => {
  const { details, scope } = fixture()
  const legacy = 'region:1123051500', official = 'electoral-dong:22:11230:용신동'
  scope.refs.push(...[legacy, official].map(id => ({ id, kind: 'region', inside: true, boundarySha256: scope.boundary.sha256 })))
  scope.current.rights.push({ id: 'holding:subordinate', holderPersonId: 'K002', referenceMappings: { [legacy]: [official] } })
  scope.contract.entities.push({ kind: 'holding', id: 'holding:subordinate', status: 'active', locationRefs: [], jurisdictionRefs: [official] })
  details[0].subordinateHoldings = [{ id: 'holding:subordinate', holderPersonId: 'K002', adminRefs: [{ id: legacy }] }]
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PENDING' })
  scope.current.rights[0].referenceMappings[legacy] = ['region:outside']
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PROJECTION', path: '/person-details/subordinateHoldings/refs' })
})

test('raw station selectors resolve only through exact source-bound holding geography', () => {
  const { details, scope } = fixture()
  const stationRef = { stationId: '양평', stationName: '양평' }
  scope.current.rights.push({ id: 'holding:capital-s01', holderPersonId: 'K001', sourceRefs: { stationRef: sha256(JSON.stringify(stationRef)) } })
  scope.contract.entities.push({ kind: 'holding', id: 'holding:capital-s01', status: 'active',
    locationRefs: [], jurisdictionRefs: ['region:seoul'] })
  details[0].confirmedHoldings = [{ id: 'holding:capital-s01', holderPersonId: 'K001', stationRef: { ...stationRef } }]
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PENDING' })
  details[0].confirmedHoldings[0].stationRef.stationId = 'outside-station'
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_PROJECTION', path: '/person-details/confirmedHoldings/refs' })
})

test.each(['missing', 'duplicate'])('%s person cannot reduce the original denominator', mutation => {
  // Given a missing or duplicated original person.
  const { details, scope } = fixture()
  if (mutation === 'missing') details.pop()
  else details[1021] = details[0]
  // When admitted, then all original identities are still required.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_CENSUS_PERSON' })
})

test('an extra person cannot expand the exact original denominator', () => {
  const { details, scope } = fixture()
  details.push({ ...details[0], id: 'person-1023', characterId: 'K1023', detailRoute: '/people/person-1023' })
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_CENSUS_PERSON' })
})

test.each(['souls', 'unexpectedCurrentClaim', 'currentLocationRefs', 'currentRights'])('unknown public field %s is not silently stripped', field => {
  // Given an editorial, unknown, or old projected field.
  const { details, scope } = fixture()
  details[0][field] = []
  // When admitted, then the field is rejected explicitly.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_SHAPE', path: `/person-details/${field}` })
})

test('all-1022 caller-authored field hashes and document approvals cannot authorize publication', () => {
  // Given self-asserted complete review, including a plausible per-person mapping.
  const { details, scope } = fixture()
  scope.current.publicationReview = { schema: 'seoul-document-publication-eligibility.v1',
    semanticReview: 'reviewed', complete: true, documents: [],
    fieldMappings: details.map(detail => ({ characterId: detail.characterId, jsonPointer: '/biography', reviewed: true })) }
  // When admitted, then no caller-controlled object can substitute for trusted authority.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PENDING', path: '/current/publicationReview' })
})

test('old direct JSON with an outside holding cannot be republished as a skinny detail', async () => {
  // Given a real generated direct-detail body with an outside reference, absent from search.
  const { details, scope } = fixture()
  details[0] = JSON.parse(await readFile(new URL('../public/person-details/person-0001.json', import.meta.url), 'utf8'))
  delete details[0].territory
  scope.current.rights.push({ id: 'holding:outside', holderPersonId: 'K001', slotStatus: 'direct' })
  scope.contract.entities.push({ kind: 'holding', id: 'holding:outside', status: 'active', locationRefs: ['region:seoul'], jurisdictionRefs: [] })
  details[0].confirmedHoldings = [{ id: 'holding:outside', holderPersonId: 'K001', adminRefs: [{ id: 'region:outside' }] }]
  // When admitted directly, then the outside reference is rejected before legacy stripping.
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_SCOPE_PROJECTION', path: '/person-details/confirmedHoldings/refs' })
})

// Immutable independent source mocks for the pure comparison, never admission.
// They are created before any candidate exists and never rebuilt from a mutation.
const approvedFixture = fixture(true).details
const fiveRights = [
  ['K1008', 'holding:daejeon-dong'], ['K1008', 'holding:daejeon-yuseong'],
  ['K035', 'holding:daejeon-jung'], ['K039', 'holding:daejeon-seo'], ['K038', 'holding:daejeon-daedeok'],
]
for (const [holderPersonId, id] of fiveRights) {
  const detail = approvedFixture.find(row => row.characterId === holderPersonId)
  ;(detail.superiorJurisdictions ??= []).push({ id, holderPersonId, directOwnership: false, jurisdictionRefs: ['region:seoul'] })
}
approvedFixture[1007].openingTitles = [{ id: 'title:fixture', jurisdictionRefs: ['region:seoul'] }]
const fixtureOptionals = ['birthDate', 'birthday', 'age', 'ageAsOf', 'sourceStatus', 'sourceRefs',
  'familyTree', 'household', 'proseContacts', 'rightsPermissions', 'characterProfile',
  'confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles',
  'sovereignTitle', 'retinueGroups', 'openingDisposition', 'unit', 'territory',
  'wandering_force', 'directLiege', 'court', 'politicalIdentities', 'locked']
const sourcePath = 'lore/editorial/independent-current-source.json'
const sourceBytes = JSON.stringify({ anchor: 'independent-fixture', details: approvedFixture,
  omissions: Object.fromEntries(fixtureOptionals.map(field => [field, true])) })
const sourceSha256 = sha256(sourceBytes)
const binding = (jsonPointer, value) => ({ sourcePath, jsonPointer, anchor: 'independent-fixture',
  sourceSha256, valueSha256: sha256(JSON.stringify(value)) })
const fieldMappings = []
approvedFixture.forEach((detail, index) => {
  const visit = (value, pointer) => {
    fieldMappings.push({ characterId: detail.characterId, jsonPointer: pointer, disposition: 'retain',
      valueSha256: sha256(JSON.stringify(value)), source: binding(`/details/${index}${pointer}`, value), approvedSuccessor: null })
    if (value !== null && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      visit(child, `${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`)
    }
  }
  for (const [field, value] of Object.entries(detail)) visit(value, `/${field}`)
  for (const field of fixtureOptionals.filter(field => !Object.hasOwn(detail, field))) {
    fieldMappings.push({ characterId: detail.characterId, jsonPointer: `/${field}`, disposition: 'omit', valueSha256: null,
      source: binding(`/omissions/${field}`, true), approvedSuccessor: binding(`/omissions/${field}`, true) })
  }
})
const mappingReceipt = JSON.stringify({ schema: 'person-detail-field-mappings.v2', reviewer: 'Fixture reviewer',
  approvalRef: 'fixture:review', reviewedAt: '2026-10-15T00:00:00Z', sourceHashes: { [sourcePath]: sourceSha256 },
  details: approvedFixture, fieldMappings })
const mappingEvidence = Object.freeze({ receiptSha256: sha256(mappingReceipt), sources: Object.freeze({ [sourcePath]: sourceBytes }) })
const candidate = () => JSON.parse(sourceBytes).details
const pure = (details, receipt = mappingReceipt, evidence = mappingEvidence) => validatePersonDetailFieldMappings(details, receipt, evidence)

test.each(['unit', 'territory', 'wandering_force', 'evidence', 'unknownSourceField'])('public historical record rejects re-injected %s even in a caller-authored receipt', field => {
  const details = candidate()
  details[0].personSheet = { variants: [{ legacy: { record: {
    id: details[0].characterId, name: details[0].name, url: details[0].detailRoute, state: details[0].state,
    attributes: {}, traits: [], skills: [], secondary: {}, cp: {}, [field]: 'source-only',
  } } }] }
  const receipt = { ...JSON.parse(mappingReceipt), details }
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(details, bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }),
    { code: 'E_SCOPE_PROJECTION', path: '/personSheet/variants/legacy/record' })
})

test('absent locked still requires an exact reviewed omission mapping', () => {
  const source = JSON.parse(sourceBytes)
  delete source.details[0].locked
  const raw = JSON.stringify(source), hash = sha256(raw)
  const receipt = JSON.parse(mappingReceipt)
  receipt.details = source.details
  receipt.sourceHashes[sourcePath] = hash
  receipt.fieldMappings = receipt.fieldMappings.map(row => {
    if (row.characterId === source.details[0].characterId && row.jsonPointer === '/locked') {
      const omission = { sourcePath, jsonPointer: '/omissions/locked', anchor: 'independent-fixture',
        sourceSha256: hash, valueSha256: sha256(JSON.stringify(true)) }
      return { ...row, disposition: 'omit', valueSha256: null, source: omission, approvedSuccessor: omission }
    }
    return { ...row, source: { ...row.source, sourceSha256: hash },
      approvedSuccessor: row.approvedSuccessor ? { ...row.approvedSuccessor, sourceSha256: hash } : null }
  })
  const bytes = JSON.stringify(receipt)
  assert.equal(pure(source.details, bytes, { receiptSha256: sha256(bytes), sources: { [sourcePath]: raw } }), true)
  receipt.fieldMappings = receipt.fieldMappings.filter(row => row.characterId !== source.details[0].characterId || row.jsonPointer !== '/locked')
  const missing = JSON.stringify(receipt)
  assert.throws(() => pure(source.details, missing, { receiptSha256: sha256(missing), sources: { [sourcePath]: raw } }), /E_REVIEW_COVERAGE/)
})

test('pure full-field comparison covers 1022 unchanged details but grants no publication capability', () => {
  const details = candidate()
  const before = JSON.stringify(details)
  assert.equal(pure(details), true)
  assert.equal(JSON.stringify(details), before)
  assert.throws(() => assertApprovedPersonDetailMappingReceipt({ receiptBytes: mappingReceipt, ...mappingEvidence }, details),
    { code: 'E_REVIEW_COVERAGE', path: '/person-details/fieldMappings' })
  const { details: productionDetails, scope } = fixture()
  scope.current.publicationReview = { fieldMappingsReceipt: mappingReceipt, complete: true }
  assert.throws(() => admitPublicPersonDetails(productionDetails, scope), { code: 'E_SCOPE_PENDING' })
})

test('admission uses the supplied roster rather than a historical output count', () => {
  const { details, scope } = fixture()
  details.splice(3)
  const ids = details.map(row => row.characterId)
  scope.baseline.currentEntitySets.persons = ids
  scope.current.entitySets.persons = [...ids]
  scope.contract.entities = scope.contract.entities.filter(row => ids.includes(row.id))
  scope.contract.dispositions = scope.contract.dispositions.filter(row => ids.includes(row.id))
  // All structural checks pass for this small independent roster. Content and
  // historical output values cannot substitute for the human publication review.
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_PENDING', path: '/current/publicationReview' })
  details.pop()
  assert.throws(() => admitPublicPersonDetails(details, scope), { code: 'E_CENSUS_PERSON' })
})

test('admission rejects private historical fields independently of output mapping receipts', () => {
  const { details, scope } = fixture()
  details[0].personSheet = { variants: [{ legacy: { record: { evidence: 'private' } } }] }
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_SHAPE', path: '/person-details/personSheet', id: details[0].characterId })
})

test.each(['values', 'relations'])('admission rejects nested soul data in %s without changing the candidate', field => {
  const { details, scope } = fixture()
  details[0][field].nested = [{ souls: ['private assignment'] }]
  const original = structuredClone(details)
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_PROJECTION', path: `/person-details/${field}/nested/0/souls`, id: details[0].characterId })
  assert.deepEqual(details, original)
})

test.each(['soulAssignments', 'soulCandidates', 'historicalMotif'])('admission rejects nested private %s metadata', key => {
  const { details, scope } = fixture()
  details[0].values[key] = 'private metadata'
  assert.throws(() => admitPublicPersonDetails(details, scope),
    { code: 'E_SCOPE_PROJECTION', path: `/person-details/values/${key}`, id: details[0].characterId })
})

test('production detail writer rejects missing semantic authority before any detail write', async () => {
  const { details, scope } = fixture()
  const before = structuredClone(details)
  const written = []
  await assert.rejects(writePublicPersonDetails(details, scope, detail => { written.push(detail) }),
    { code: 'E_SCOPE_PENDING', path: '/current/publicationReview' })
  assert.deepEqual(written, [])
  assert.deepEqual(details, before)
  assert.deepEqual(Object.keys(details[0]).sort(), Object.keys(before[0]).sort())
})

test('production detail writer rejects changed candidate fields before any detail write', async () => {
  const { details, scope } = fixture()
  details[0].confirmedHoldings = [{ id: 'holding:one', holderPersonId: 'K001', adminRefs: [{ id: 'region:outside' }] }]
  scope.current.rights.push({ id: 'holding:one', holderPersonId: 'K001', slotStatus: 'direct' })
  scope.contract.entities.push({ kind: 'holding', id: 'holding:one', status: 'active', locationRefs: ['region:seoul'], jurisdictionRefs: [] })
  const written = []
  await assert.rejects(writePublicPersonDetails(details, scope, detail => { written.push(detail) }, {}),
    { code: 'E_SCOPE_PROJECTION', path: '/person-details/confirmedHoldings/refs' })
  assert.deepEqual(written, [])
})

test('complete mapping retains nested legacy shapes without treating a source pointer as a publication grant', () => {
  const detail = candidate()
  detail[0].unit = { id: 'unit:fixture', command: { members: ['K001'] } }
  const receipt = JSON.parse(mappingReceipt)
  receipt.details[0].unit = detail[0].unit
  const source = JSON.parse(sourceBytes)
  source.details[0].unit = detail[0].unit
  const bytes = JSON.stringify(source)
  const hash = sha256(bytes)
  receipt.sourceHashes[sourcePath] = hash
  for (const row of receipt.fieldMappings) {
    row.source.sourceSha256 = hash
    if (row.approvedSuccessor) row.approvedSuccessor.sourceSha256 = hash
  }
  const add = (value, pointer) => {
    receipt.fieldMappings.push({ characterId: 'K001', jsonPointer: pointer, disposition: 'retain',
      valueSha256: sha256(JSON.stringify(value)), source: { ...binding(`/details/0${pointer}`, value), sourceSha256: hash }, approvedSuccessor: null })
    if (value !== null && typeof value === 'object') for (const [key, child] of Object.entries(value)) add(child, `${pointer}/${key}`)
  }
  receipt.fieldMappings = receipt.fieldMappings.filter(row => !(row.characterId === 'K001' && row.jsonPointer === '/unit'))
  add(detail[0].unit, '/unit')
  const receiptBytes = JSON.stringify(receipt)
  assert.equal(validatePersonDetailFieldMappings(detail, receiptBytes, {
    receiptSha256: sha256(receiptBytes), sources: { [sourcePath]: bytes },
  }), true)
  assert.throws(() => assertApprovedPersonDetailMappingReceipt({ receiptBytes, sources: { [sourcePath]: bytes } }, detail),
    { code: 'E_REVIEW_COVERAGE' })
})

test('reviewed transformation binds a generated leaf to raw source without pretending equality', () => {
  const receipt = JSON.parse(mappingReceipt)
  const row = receipt.fieldMappings.find(entry => entry.characterId === 'K001' && entry.jsonPointer === '/detailRoute')
  row.disposition = 'replace'
  row.source = binding('/details/0/id', approvedFixture[0].id)
  row.approvedSuccessor = binding('/details/0/id', approvedFixture[0].id)
  row.transformation = 'generate-catalog peopleCatalog detailRoute: /people/${id}'
  const bytes = JSON.stringify(receipt)
  assert.equal(pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }), true)
  delete row.transformation
  const unreviewed = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), unreviewed, { ...mappingEvidence, receiptSha256: sha256(unreviewed) }),
    { code: 'E_REVIEW_HASH', path: '/detailRoute' })
})

test('intentional absence binds its originating source without inventing a successor', () => {
  const receipt = JSON.parse(mappingReceipt)
  const row = receipt.fieldMappings.find(entry => entry.jsonPointer === '/age')
  row.approvedSuccessor = null
  row.transformation = 'producePersonDetails: age absent from source birthday projection'
  const bytes = JSON.stringify(receipt)
  assert.equal(pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }), true)
  delete row.transformation
  const invalid = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), invalid, { ...mappingEvidence, receiptSha256: sha256(invalid) }),
    { code: 'E_REVIEW_COVERAGE', path: '/age' })
})

test('receipt digest rejects tampered transformation text', () => {
  const receipt = JSON.parse(mappingReceipt)
  receipt.fieldMappings[0].transformation = 'forged derivation'
  assert.throws(() => pure(candidate(), JSON.stringify(receipt)), { code: 'E_REVIEW_HASH' })
})

test('derived mapping rejects a stale output hash even with authenticated source bindings', () => {
  const receipt = JSON.parse(mappingReceipt)
  const row = receipt.fieldMappings.find(entry => entry.jsonPointer === '/detailRoute')
  row.disposition = 'replace'
  row.approvedSuccessor = row.source
  row.transformation = 'producePersonDetails: detailRoute from identity'
  row.valueSha256 = '0'.repeat(64)
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }),
    { code: 'E_REVIEW_COVERAGE', path: '/detailRoute' })
})

test('sealed historical sources have the same exact-byte authentication as lore sources', () => {
  const receipt = JSON.parse(mappingReceipt)
  const sealedPath = 'vendor/issued-history/fixture.json'
  receipt.sourceHashes = { [sealedPath]: sourceSha256 }
  for (const row of receipt.fieldMappings) {
    row.source.sourcePath = sealedPath
    if (row.approvedSuccessor) row.approvedSuccessor.sourcePath = sealedPath
  }
  const bytes = JSON.stringify(receipt)
  const evidence = { receiptSha256: sha256(bytes), sources: { [sealedPath]: sourceBytes } }
  assert.equal(pure(candidate(), bytes, evidence), true)
  assert.throws(() => pure(candidate(), bytes, { ...evidence, sources: { [sealedPath]: sourceBytes + ' ' } }),
    { code: 'E_REVIEW_HASH', path: sealedPath })
})

test.each(['duplicate', 'unknown', 'missing', 'omission'])('pure comparison rejects %s field mapping even with a matching fixture receipt digest', mutation => {
  const receipt = JSON.parse(mappingReceipt)
  if (mutation === 'duplicate') receipt.fieldMappings.push(receipt.fieldMappings[0])
  if (mutation === 'unknown') receipt.fieldMappings[0].jsonPointer = '/unapproved'
  if (mutation === 'missing') receipt.fieldMappings.shift()
  if (mutation === 'omission') receipt.fieldMappings = receipt.fieldMappings.filter(row => row.characterId !== 'K001' || row.jsonPointer !== '/age')
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }), { code: 'E_REVIEW_COVERAGE' })
})

test('a forged receipt fails against the independent digest', () => {
  const receipt = JSON.parse(mappingReceipt)
  receipt.details[0].biography = 'forged'
  assert.throws(() => pure(candidate(), JSON.stringify(receipt)), { code: 'E_REVIEW_HASH' })
})

test('a changed source fails even if all detail IDs and mapping rows match', () => {
  const source = JSON.parse(sourceBytes)
  source.details[0].name = 'stale source'
  assert.throws(() => pure(candidate(), mappingReceipt, { ...mappingEvidence, sources: { [sourcePath]: JSON.stringify(source) } }),
    { code: 'E_REVIEW_HASH', path: sourcePath })
})

test('a source removed from the reviewed source inventory fails coverage', () => {
  const receipt = JSON.parse(mappingReceipt)
  receipt.sourceHashes = {}
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }),
    { code: 'E_SCOPE_SHAPE', path: '/person-details/fieldMappings' })
})

test('a source outside the current lore root cannot be bound by a receipt', () => {
  const receipt = JSON.parse(mappingReceipt)
  receipt.sourceHashes = { '../outside.json': sourceSha256 }
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), bytes, { receiptSha256: sha256(bytes), sources: { '../outside.json': sourceBytes } }),
    { code: 'E_REVIEW_COVERAGE', path: '/person-details/fieldMappings' })
})

test.each(['anchor', 'jsonPointer', 'valueSha256', 'approvedSuccessor'])('independent source rejects a forged %s binding', field => {
  const receipt = JSON.parse(mappingReceipt)
  const row = receipt.fieldMappings[0]
  if (field === 'anchor') row.source.anchor = 'wrong-anchor'
  if (field === 'jsonPointer') row.source.jsonPointer = '/details/1/id'
  if (field === 'valueSha256') row.source.valueSha256 = '0'.repeat(64)
  if (field === 'approvedSuccessor') { row.disposition = 'replace'; row.approvedSuccessor = { ...row.source, sourceSha256: '0'.repeat(64) } }
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }), { code: 'E_REVIEW_HASH' })
})

test('nested stale title refs are rejected with identical person and title IDs', () => {
  const details = candidate()
  const stale = structuredClone(details[1007])
  stale.openingTitles[0].jurisdictionRefs = ['region:outside']
  details[1007].openingTitles[0].jurisdictionRefs = stale.openingTitles[0].jurisdictionRefs
  assert.throws(() => pure(details), { code: 'E_SCOPE_PROJECTION', path: '/openingTitles', id: 'K1008' })
  const { details: raw, scope } = fixture()
  raw[1007].openingTitles = stale.openingTitles
  assert.throws(() => admitPublicPersonDetails(raw, scope), { code: 'E_SCOPE_PROJECTION', path: '/person-details/openingTitles/jurisdictionRefs' })
})

test.each(fiveRights)('omitting approved superior jurisdiction %s %s fails with all 1022 IDs', (holder, rightId) => {
  const details = candidate()
  const detail = details.find(row => row.characterId === holder)
  detail.superiorJurisdictions = detail.superiorJurisdictions.filter(row => row.id !== rightId)
  assert.throws(() => pure(details), { code: 'E_SCOPE_PROJECTION', path: '/superiorJurisdictions', id: holder })
})

test('omitting all five approved superior jurisdictions is not equivalent to unchanged IDs', () => {
  const details = candidate()
  for (const detail of details) delete detail.superiorJurisdictions
  assert.throws(() => pure(details), { code: 'E_SCOPE_PROJECTION', path: '/superiorJurisdictions' })
})

test('self-consistent receipt cannot shrink the independent 1022-detail denominator', () => {
  const receipt = JSON.parse(mappingReceipt)
  receipt.details.pop()
  receipt.fieldMappings = receipt.fieldMappings.filter(row => row.characterId !== 'K1022')
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate().slice(0, -1), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }), { code: 'E_CENSUS_PERSON' })
})

test('a retained mapping cannot substitute another source value with its matching hash', () => {
  const receipt = JSON.parse(mappingReceipt)
  receipt.fieldMappings[0].source = binding('/details/1/id', approvedFixture[1].id)
  const bytes = JSON.stringify(receipt)
  assert.throws(() => pure(candidate(), bytes, { ...mappingEvidence, receiptSha256: sha256(bytes) }), { code: 'E_REVIEW_HASH', path: '/id' })
})
