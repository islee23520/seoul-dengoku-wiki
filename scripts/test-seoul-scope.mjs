import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { test } from 'vitest'
import { ENTITY_SETS, STAGING_GEOGRAPHY_SCHEMA, baselineDocuments, canonicalProposal, proposalHash, sha256, stagingGeography, validateSeoulScope } from './seoul-scope.mjs'
import { compareCensusCategories, createDependencyResolver, dependencyDispositions, extractDependencies, extractCurrentCategories, validateCensusProducts, validateDependencyClosure, validateIndependentReview, walkCensus } from './seoul-census.mjs'

const sourcePath = 'lore/current.json'
const sealedPath = 'vendor/issued-history/old.json'
const sourceBody = '{"id":"current","ko":"서울","en":"Seoul"}\n'
const sealedBody = '{"id":"sealed"}\n'
const boundary = { path: 'boundary.json', sha256: sha256('independent boundary fixture'), edition: 'fixture-2026' }
const districtRefs = ['gu:A', 'gu:B']
const dongRefs = Array.from({ length: 7 }, (_, index) => `dong:${index + 1}`)
const code = result => result.errors[0]?.code
const clone = structuredClone

function approve(batch) {
  const approval = (kind, bytes) => ({ kind, batchId: batch.id, bodySha256: bytes, messageRef: 'fixture:owner-message' })
  batch.approval = approval('batch-allocation', proposalHash(batch.proposal))
  batch.articleSample = { body: '# Article\n\nSeoul.\n', approval: null }
  batch.articleSample.approval = approval('article-style', sha256(batch.articleSample.body))
  batch.cardSample = { body: '# Card\n\nPerson.\n', approval: null }
  batch.cardSample.approval = approval('card-style', sha256(batch.cardSample.body))
}

function bindBatch(input, id = 'batch:a') {
  const { contract, geography } = input
  const batch = {
    id,
    proposal: clone({ entities: contract.entities.filter(row => row.batchId === id), documents: contract.documents.filter(row => row.batchId === id), dispositions: contract.dispositions.filter(row => row.batchId === id), geography }),
    approval: null, articleSample: null, cardSample: null,
    entityKeys: contract.entities.filter(row => row.batchId === id).map(row => `${row.kind}:${row.id}`),
    documentPaths: contract.documents.filter(row => row.batchId === id).map(row => row.sourcePath),
    dispositionKeys: contract.dispositions.filter(row => row.batchId === id).map(row => JSON.stringify([row.set, row.id])), dependencyBatchIds: [],
  }
  approve(batch)
  input.batches = input.batches.filter(row => row.id !== id).concat(batch)
}

function fixture() {
  // The expected IDs are declared independently of contract/current arrays.
  const expected = { persons: ['K001', 'K002'], titles: ['title:old'], holdings: ['holding:old'], grants: ['grant:old'], bindings: ['binding:old'],
    states: ['S01'], polities: ['polity:daejeon'], events: ['event:one'], relations: ['relation:one'], courts: ['court:one'] }
  const baseline = { schema: 'seoul-pre-edit-baseline.v1', immutable: true,
    currentEntitySets: clone(expected), identitySetHashes: Object.fromEntries(ENTITY_SETS.map(set => [set, sha256(JSON.stringify(expected[set]))])),
    files: [{ path: sourcePath, kind: 'authored-lore', sha256: sha256(sourceBody) }, { path: sealedPath, kind: 'sealed-history', sha256: sha256(sealedBody) }],
    archives: { 'phase-base.tar.gz': { path: 'archive.txt', sha256: sha256('archived fixture bytes\n') } },
  }
  const row = (kind, id, refs) => ({ kind, id, sourcePath, status: 'active', locationRefs: kind === 'person' ? refs : [], jurisdictionRefs: kind === 'person' ? [] : refs, basis: 'fixture reviewed allocation', batchId: 'batch:a' })
  const contract = { schema: 'seoul-scope.v1', baselineSha256: sha256(JSON.stringify(baseline)), boundarySource: clone(boundary),
    entities: [row('person', 'K001', ['dong:1']), row('person', 'K002', ['dong:2']), row('title', 'title:old', ['gu:A']), row('holding', 'holding:old', ['dong:3']),
      row('holding', 'grant:old', ['dong:4']), row('state', 'S01', ['gu:A']), row('state', 'polity:daejeon', ['gu:B']), row('event', 'event:one', ['dong:5'])],
    documents: [{ sourcePath, status: 'active', reviewReceipt: { currentSha256: sha256(sourceBody), evidencePath: '.omo/evidence/read.md', reviewedAt: '2026-10-13' }, batchId: 'batch:a', basis: 'fixture full review' },
      { sourcePath: sealedPath, status: 'preserved', reviewReceipt: null, batchId: null, basis: 'sealed archive' }],
    dispositions: ENTITY_SETS.flatMap(set => expected[set].map(id => ({ set, id, status: 'active', targetIds: [id], batchId: 'batch:a', basis: 'fixture retained identity' }))),
    rail: { stationRefs: ['station:a', 'station:b'], edgeRefs: ['edge:ab'] },
  }
  const title = (titleId, rank, parentTitleId, jurisdictionRefs) => ({ titleId, rank, parentTitleId, jurisdictionRefs, basis: 'fixture geography, not a grant' })
  const parts = dongRefs.map(dongId => ({ dongId, fragmentId: null, geometryRefs: [dongId] }))
  const geography = { sourceEdition: 'fixture-2026', kingdomStatus: 'approved', mapMinimumRank: 'county', mapTitleIds: ['county:a'],
    titles: [title('empire:seoul', 'empire', null, districtRefs), title('kingdom:one', 'kingdom', 'empire:seoul', districtRefs),
      title('duchy:a', 'duchy', 'kingdom:one', ['gu:A']), title('duchy:b', 'duchy', 'kingdom:one', ['gu:B']), title('county:a', 'county', 'duchy:a', dongRefs),
      title('barony:1', 'barony', 'county:a', ['dong:1'])],
    countySlots: [{ countyTitleId: 'county:a', slots: parts.map(part => ({ slotId: `slot:${part.dongId}`, ...clone(part), sourceEdition: 'fixture-2026', holdingRefs: [], status: 'unassigned', holderPersonId: null })) }],
  }
  const input = { contract, baseline, baselineSha256: contract.baselineSha256, current: { entitySets: clone(expected), documentPaths: [sourcePath, sealedPath] },
    boundary: clone(boundary), archiveHashes: { 'phase-base.tar.gz': sha256('archived fixture bytes\n') }, sourceHashes: { [sourcePath]: sha256(sourceBody), [sealedPath]: sha256(sealedBody) },
    refs: [...dongRefs.map(id => ({ id, kind: 'region' })), ...districtRefs.map(id => ({ id, kind: 'district' })), ...['station:a', 'station:b'].map(id => ({ id, kind: 'station' }))]
      .map(row => ({ ...row, inside: true, boundarySha256: boundary.sha256 })).concat({ id: 'region:1111111111-outside', kind: 'region', inside: false, boundarySha256: boundary.sha256 }),
    edges: [{ id: 'edge:ab', a: 'station:a', b: 'station:b', inside: true, physical: true, boundarySha256: boundary.sha256 }],
    geography, facts: { sourceEdition: 'fixture-2026', counties: [{ titleId: 'county:a', districtRef: 'gu:A', parts }], districtRefs: clone(districtRefs), dongRefs: clone(dongRefs) }, batches: [],
    review: { originalKeys: [{ key: 'ko-original', batchId: 'batch:a' }, { key: 'en-original', batchId: 'batch:a' }],
      currentKeys: [{ key: 'ko-current', sha256: sha256('서울'), batchId: 'batch:a' }, { key: 'en-current', sha256: sha256('Seoul'), batchId: 'batch:a' }],
      receipts: [{ coveredKeys: ['ko-original', 'en-original'], currentHashes: [{ key: 'ko-current', sha256: sha256('서울') }, { key: 'en-current', sha256: sha256('Seoul') }], disposition: 'revised', batchId: 'batch:a', evidencePath: '.omo/evidence/review.md', reviewedAt: '2026-10-13' }] },
  }
  bindBatch(input)
  return input
}

function stagingFixture() {
  const input = fixture()
  const source = { id: 'official-membership', sha256: sha256('independent fixture membership'), role: 'statutory-electoral-membership' }
  const membership = {
    schema: 'seoul-constituency-membership.v1', geometryVerified: false,
    sources: [source, { id: 'candidate', sha256: boundary.sha256, role: 'candidate-only', officialAuthority: false }],
    editions: { electoral: { id: 'election', sourceRefs: [source.id] }, currentLaw: { id: 'law', sourceRefs: [source.id] },
      currentCorrespondence: { id: 'current', codeAndNameSourceRef: 'candidate' } },
    gu: [{ guId: 'gu:A', name: 'A', electoralDongCount: 1, currentCorrespondenceCount: 1, sourceRefs: [source.id] },
      { guId: 'gu:B', name: 'B', electoralDongCount: 1, currentCorrespondenceCount: 1, sourceRefs: [source.id] }],
    constituencies: [{ constituencyId: 'twoGu', name: 'Two gu county', jurisdictionGuRefs: ['gu:A', 'gu:B'], sourceEdition: 'election', sourceRefs: [source.id],
      membershipConfidence: 'primary-confirmed', geometryVerified: false,
      electoralDongs: ['A', 'B'].map((gu, i) => ({ guId: `gu:${gu}`, sourceName: `Dong ${i}`, electoralDongId: `electoral:${i}`, fragmentId: null,
        currentCorrespondences: [{ candidateAdminId: `${i}`, candidateName: `Dong ${i}`, sourceEdition: 'current', geometryVerified: false,
          codeConfidence: 'dated-candidate-name-code-match', membershipSourceRefs: [source.id] }], membershipSourceRefs: [source.id] })) }],
  }
  // Independent two-gu/two-dong denominator; never read it back from geography slots.
  const census = { schema: 'task-2-seoul-correspondence-census.v1',
    guCounts: [{ gu: 'A', guId: 'gu:A', electoralVintageDongs: 1, geometryRows: 1 }, { gu: 'B', guId: 'gu:B', electoralVintageDongs: 1, geometryRows: 1 }],
    constituencies: [{ name: 'Two gu county', correspondences: [
      { gu: 'A', officialDong: 'Dong 0', fragmentId: null, candidateAdminIds: ['0'], candidateNames: ['Dong 0'] },
      { gu: 'B', officialDong: 'Dong 1', fragmentId: null, candidateAdminIds: ['1'], candidateNames: ['Dong 1'] },
    ] }],
  }
  const right = (id, dong, pointer) => {
    const original = { id, adminRefs: [{ id: `region:${dong}` }] }
    return { original, source: { path: sourcePath, pointer, recordSha256: sha256(JSON.stringify(original)) }, audit: { category: 'direct-admin-property' } }
  }
  const rights = { schema: 'task-2-existing-rights-audit.v1', sources: [{ path: sourcePath, sha256: sha256(sourceBody) }],
    titles: [{ original: { id: 'title:old' } }], bindings: [{ original: { holdingId: 'old', titleId: 'old' } }],
    holdings: [right('holding:old', '0', '/holdings/0')], grants: [right('grant:old', '1', '/grants/0')],
    counties: [{ name: 'Two gu county', jurisdictionGuRefs: ['gu:A', 'gu:B'], dongs: [
      { dongId: 'region:0', officialElectoralDong: 'Dong 0', fragmentId: null, holdingRefs: ['holding:old'] },
      { dongId: 'region:1', officialElectoralDong: 'Dong 1', fragmentId: null, holdingRefs: ['grant:old'] },
    ] }],
  }
  const binding = JSON.stringify(['old', 'old'])
  input.baseline.currentEntitySets.bindings = [binding]
  input.baseline.identitySetHashes.bindings = sha256(JSON.stringify([binding]))
  input.current.entitySets.bindings = [binding]
  Object.assign(input.contract.dispositions.find(row => row.set === 'bindings'), { id: binding, targetIds: [binding] })
  input.baselineSha256 = input.contract.baselineSha256 = sha256(JSON.stringify(input.baseline))
  input.facts = { schema: STAGING_GEOGRAPHY_SCHEMA, sources: Object.fromEntries(Object.entries({ membership, census, rights }).map(([kind, data]) => {
    const body = JSON.stringify(data)
    return [kind, { path: `fixture:${kind}`, sha256: sha256(body), body }]
  })) }
  input.refs.push(...['region:0', 'region:1'].map(id => ({ id, kind: 'region', inside: true, boundarySha256: boundary.sha256 })))
  const geography = stagingGeography(input.facts, input.baseline, input.boundary)
  input.geography = geography
  bindBatch(input)
  return { ...input, geography }
}

test('staged two-gu county keeps independent membership, pending feudal parents and historical rights; only inspection admits it', () => {
  const input = stagingFixture()
  const before = clone(input)
  assert.deepEqual(validateSeoulScope(input, { mode: 'inspection' }), { ok: true, errors: [] })
  const county = input.geography.titles.find(t => t.rank === 'county')
  assert.deepEqual(county.jurisdictionRefs, ['gu:A', 'gu:B'])
  assert.equal(county.feudalParentTitleId, null)
  assert.equal(input.geography.titles.filter(t => t.rank === 'kingdom').length, 0)
  assert.equal(input.geography.countySlots[0].slots.length, 2)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_SCOPE_PENDING')
  assert.deepEqual(input, before)
  for (const row of input.contract.entities.filter(row => row.kind === 'holding')) Object.assign(row, { status: 'pending', batchId: null, basis: null })
  for (const row of input.contract.dispositions.filter(row => ['holdings', 'grants'].includes(row.set))) Object.assign(row, { status: 'pending', batchId: null, basis: null, targetIds: [] })
  input.current.rights = []
  bindBatch(input)
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
})

for (const [name, mutate, expected] of [
  ['invented empire superior', i => { i.geography.titles.at(-1).feudalParentTitleId = 'geography:empire:seoul' }, 'E_SLOT_EDITION'],
  ['invented chosen duchy', i => { i.geography.titles.at(-1).feudalParentTitleId = 'geography:duchy:gu:A' }, 'E_SLOT_EDITION'],
  ['missing geographic gu', i => { i.geography.titles.at(-1).jurisdictionRefs.pop() }, 'E_SLOT_COVERAGE'],
  ['invented kingdom proposal', i => { i.geography.kingdomStatus = 'proposed' }, 'E_SLOT_EDITION'],
  ['claimed official extent', i => { i.geography.officialExtentStatus = 'verified' }, 'E_SLOT_EDITION'],
  ['claimed geometry verification', i => { i.geography.countySlots[0].slots[0].geometryVerified = true }, 'E_SLOT_EDITION'],
  ['candidate promoted to geometry', i => { i.geography.countySlots[0].slots[0].geometryRefs = ['region:0'] }, 'E_SLOT_COVERAGE'],
  ['historical promoted to holding', i => { i.geography.countySlots[0].slots[0].holdingRefs = ['holding:old'] }, 'E_SLOT_COVERAGE'],
  ['invented holder', i => { i.geography.countySlots[0].slots[0].holderPersonId = 'K001' }, 'E_SLOT_EDITION'],
  ['unknown historical right', i => { i.geography.countySlots[0].slots[0].historicalHoldingRefs[0].id = 'missing' }, 'E_SLOT_EDITION'],
  ['stale historical hash', i => { i.geography.countySlots[0].slots[0].historicalHoldingRefs[0].recordSha256 = sha256('stale') }, 'E_SLOT_EDITION'],
  ['unknown membership source', i => { i.geography.titles.at(-1).sourceRefs[0] = 'missing' }, 'E_SLOT_EDITION'],
  ['unknown edition', i => { i.geography.countySlots[0].slots[0].sourceEdition = 'missing' }, 'E_SLOT_EDITION'],
  ['wrong source pointer', i => { i.geography.countySlots[0].slots[0].sourcePointer = '/missing' }, 'E_SLOT_EDITION'],
  ['untyped metadata', i => { i.geography.approved = true }, 'E_SCOPE_SHAPE'],
  ['stale independent input', i => { i.facts.sources.census.body += ' ' }, 'E_SLOT_EDITION'],
  ['missing independent right', i => { i.baseline.currentEntitySets.holdings = []; i.baseline.identitySetHashes.holdings = sha256('[]') }, 'E_CENSUS_RIGHT'],
  ['missing candidate reference', i => { i.refs = i.refs.filter(r => r.id !== 'region:0') }, 'E_SCOPE_REF'],
]) test(`staging rejects ${name}`, () => {
  const input = stagingFixture()
  mutate(input)
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), expected)
})

test('staging checks membership against the independently retained census, not its own slot assignments', () => {
  const input = stagingFixture()
  const source = input.facts.sources.membership
  const changed = JSON.parse(source.body)
  changed.constituencies[0].electoralDongs[0].currentCorrespondences[0].candidateAdminId = 'invented'
  source.body = JSON.stringify(changed); source.sha256 = sha256(source.body)
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SLOT_COVERAGE')
})

function spatialFixture() {
  const input = stagingFixture()
  const membership = JSON.parse(input.facts.sources.membership.body)
  const spatial = {
    schema: 'seoul-sgis-spatial-edition.v1', edition: 'sgis-20250630', baseDate: '2025-06-30',
    authority: 'official-SGIS-statistical-boundary', legalSurveyCertification: false, current2026Geometry: false,
    membership: { sha256: input.facts.sources.membership.sha256 }, archive: { sha256: sha256('official fixture archive') },
    geometry: { path: 'official.json', sha256: sha256('official fixture geometry'), crs: 'OGC:CRS84' },
    gu: [{ guId: 'gu:A' }, { guId: 'gu:B' }],
    dongs: [{ electoralDongId: 'electoral:0', dongId: 'region:0', guId: 'gu:A', officialName: 'Dong 0', officialCode: '0',
      geometryId: 'official:0', countyTitleId: 'geography:county:twoGu' },
    { electoralDongId: 'electoral:1', dongId: 'region:1', guId: 'gu:B', officialName: 'Dong 1', officialCode: '1',
      geometryId: 'official:1', countyTitleId: 'geography:county:twoGu' }],
    counties: [{ geometryId: 'geography:county:twoGu', jurisdictionGuRefs: ['gu:A', 'gu:B'], officialDongCodes: ['0', '1'] }],
  }
  assert.equal(membership.constituencies[0].electoralDongs.length, 2)
  const body = JSON.stringify(spatial)
  input.facts.sources.spatial = { path: 'fixture:spatial', sha256: sha256(body), body }
  input.geography = stagingGeography(input.facts, input.baseline, input.boundary)
  bindBatch(input)
  return input
}

test('pinned spatial slots preserve current correspondence rights and pending two-gu parent without publication admission', () => {
  const input = spatialFixture()
  const before = clone(input)
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  assert.equal(input.geography.countySlots.length, 1)
  assert.deepEqual(input.geography.currentCorrespondenceSlots, stagingFixture().geography.countySlots)
  const slot = input.geography.countySlots[0].slots[0]
  assert.equal(slot.sourceEdition, 'sgis-20250630')
  assert.equal(slot.geometryVerified, true)
  assert.deepEqual(slot.historicalHoldingRefs, [])
  assert.deepEqual(slot.holdingRefs, [])
  assert.equal(slot.holderPersonId, null)
  assert.equal(input.geography.titles.at(-1).feudalParentTitleId, null)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_SCOPE_PENDING')
  assert.deepEqual(input, before)
})

for (const [name, mutate, expected] of [
  ['missing spatial slot', i => i.geography.countySlots[0].slots.pop(), 'E_SLOT_COVERAGE'],
  ['missing retained current right', i => i.geography.currentCorrespondenceSlots[0].slots[0].historicalHoldingRefs.pop(), 'E_SLOT_COVERAGE'],
  ['current derivative promoted', i => { i.geography.countySlots[0].slots[0].geometryRefs[0] = 'region:0' }, 'E_SLOT_EDITION'],
  ['new spatial grant', i => { i.geography.countySlots[0].slots[0].holdingRefs.push('holding:old') }, 'E_SLOT_COVERAGE'],
  ['invented spatial parent', i => { i.geography.titles.at(-1).feudalParentTitleId = 'geography:empire:seoul' }, 'E_SLOT_EDITION'],
  ['stale spatial body', i => { i.facts.sources.spatial.body += ' ' }, 'E_SLOT_EDITION'],
]) test(`official spatial staging rejects ${name}`, () => {
  const input = spatialFixture()
  mutate(input); bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), expected)
})

test('independent spatial edition cannot omit or reassign an electoral dong', () => {
  for (const mutate of [s => s.dongs.pop(), s => { s.dongs[0].countyTitleId = 'wrong' }]) {
    const input = spatialFixture()
    const spatial = JSON.parse(input.facts.sources.spatial.body)
    mutate(spatial)
    const body = JSON.stringify(spatial)
    input.facts.sources.spatial = { path: 'fixture:spatial', sha256: sha256(body), body }
    assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), spatial.dongs.length === 1 ? 'E_SLOT_COVERAGE' : 'E_SLOT_EDITION')
  }
})

test('retained real spatial edition uses old Yongsin while preserving both current stable slots and source hashes', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const load = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
  const membership = await load('data/geography/elections/sources/seoul-constituency-membership.json')
  const spatial = await load('data/geography/elections/sources/seoul-sgis-20250630.json')
  const geography = await load('lore/regions/seoul-electoral-titles.json')
  const officialSlots = geography.countySlots.flatMap(c => c.slots)
  const currentSlots = geography.currentCorrespondenceSlots.flatMap(c => c.slots)
  assert.equal(officialSlots.length, spatial.dongs.length)
  assert.equal(currentSlots.length, membership.constituencies.flatMap(c => c.electoralDongs.flatMap(d => d.currentCorrespondences)).length)
  assert.equal(currentSlots.length, officialSlots.length + 1)
  const yongsin = officialSlots.find(s => s.name === '용신동')
  assert.equal(yongsin.electoralDongId, 'electoral-dong:22:11230:용신동')
  assert.deepEqual(yongsin.currentCorrespondenceSlotIds, ['slot:region:1123051500', 'slot:region:1123053300'])
  assert.deepEqual(yongsin.geometryRefs, ['sgis:20250630:dong:11060810'])
  for (const id of yongsin.currentCorrespondenceSlotIds) assert.ok(currentSlots.some(s => s.slotId === id && s.geometryVerified === false))
  assert.ok(officialSlots.every(s => s.holderPersonId === null && s.holdingRefs.length === 0 && s.historicalHoldingRefs.length === 0))
  assert.equal(sha256(await readFile(resolve(root, spatial.geometry.path))), spatial.geometry.sha256)
  assert.equal(sha256(await readFile(resolve(root, geography.evidence.spatial.path))), geography.evidence.spatial.sha256)
})

test('complete independent Seoul fixture validates without mutation; seven source dongs yield seven slots', () => {
  const input = fixture()
  const before = clone(input)
  assert.deepEqual(validateSeoulScope(input), { ok: true, errors: [] })
  assert.deepEqual(input, before)
  assert.equal(input.geography.countySlots[0].slots.length, 7)
})

for (const [name, mutate, expected] of [
  ['external person', input => { input.contract.entities[0].locationRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
  ['external title', input => { input.contract.entities[2].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
  ['external holding', input => { input.contract.entities[3].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
  ['empty location', input => { input.contract.entities[0].locationRefs = [] }, 'E_SCOPE_LOCATION'],
  ['unknown ref', input => { input.contract.entities[0].locationRefs = ['not-known'] }, 'E_SCOPE_REF'],
  ['missing baseline person', input => { input.contract.entities.splice(0, 1) }, 'E_CENSUS_PERSON'],
  ['deleted source person', input => { input.current.entitySets.persons.pop() }, 'E_CENSUS_PERSON'],
  ['extra source person', input => { input.current.entitySets.persons.push('K003') }, 'E_CENSUS_PERSON'],
  ['preserved current person', input => { input.contract.entities[0].status = 'preserved' }, 'E_CENSUS_PERSON'],
  ['missing political identity', input => { input.current.entitySets.polities = [] }, 'E_CENSUS_RIGHT'],
  ['missing right disposition', input => { input.contract.dispositions.pop() }, 'E_CENSUS_RIGHT'],
  ['pending current', input => { input.contract.entities[0].status = 'pending' }, 'E_SCOPE_PENDING'],
  ['missing basis', input => { input.contract.entities[0].basis = '' }, 'E_SCOPE_ADMISSION'],
  ['extra contract key', input => { input.contract.approved = true }, 'E_SCOPE_SHAPE'],
  ['duplicate person', input => { input.contract.entities.push(clone(input.contract.entities[0])) }, 'E_SCOPE_ADMISSION'],
  ['null entity', input => { input.contract.entities.push(null) }, 'E_SCOPE_SHAPE'],
  ['wrong refs type', input => { input.contract.entities[0].locationRefs = 'dong:1' }, 'E_SCOPE_SHAPE'],
  ['stale archive', input => { input.archiveHashes['phase-base.tar.gz'] = sha256('changed') }, 'E_ARCHIVE_HASH'],
  ['stale baseline set', input => { input.baseline.currentEntitySets.persons.pop() }, 'E_ARCHIVE_HASH'],
  ['sealed current promotion', input => { input.contract.documents[1].status = 'active' }, 'E_SCOPE_ADMISSION'],
  ['sealed bytes changed', input => { input.sourceHashes[sealedPath] = sha256('changed') }, 'E_ARCHIVE_HASH'],
  ['unpublished source omitted', input => { input.contract.documents.pop() }, 'E_REVIEW_COVERAGE'],
  ['unclassified new source', input => { input.current.documentPaths.push('lore/editorial/new.json') }, 'E_REVIEW_COVERAGE'],
  ['stale reviewed bytes', input => { input.sourceHashes[sourcePath] = sha256('changed') }, 'E_REVIEW_HASH'],
  ['missing slot', input => { input.geography.countySlots[0].slots.pop() }, 'E_SLOT_COVERAGE'],
  ['duplicate slot identity', input => { input.geography.countySlots[0].slots[1].slotId = 'slot:dong:1' }, 'E_SLOT_DUPLICATE'],
  ['slot edition mismatch', input => { input.geography.countySlots[0].slots[0].sourceEdition = 'stale' }, 'E_SLOT_EDITION'],
  ['rank inversion', input => { input.geography.titles[4].parentTitleId = 'barony:1' }, 'E_TITLE_HIERARCHY'],
  ['kingdom missing district', input => { input.geography.titles[1].jurisdictionRefs = ['gu:A'] }, 'E_KINGDOM_PARTITION'],
  ['wrong county gu parent', input => { input.geography.titles[4].parentTitleId = 'duchy:b' }, 'E_TITLE_HIERARCHY'],
  ['barony map selection', input => { input.geography.mapTitleIds.push('barony:1') }, 'E_MAP_GRANULARITY'],
  ['map minimum barony', input => { input.geography.mapMinimumRank = 'barony' }, 'E_MAP_GRANULARITY'],
  ['invented unassigned holder', input => { input.geography.countySlots[0].slots[0].holderPersonId = 'K001' }, 'E_SCOPE_ADMISSION'],
  ['rail shortcut', input => { input.edges[0].physical = false }, 'E_SCOPE_OUTSIDE'],
  ['external segment', input => { input.edges[0].inside = false }, 'E_SCOPE_OUTSIDE'],
  ['approval wrong kind', input => { input.batches[0].approval.kind = 'article-style' }, 'E_APPROVAL_KIND'],
  ['stale proposal', input => { input.batches[0].proposal.entities[0].basis = 'changed' }, 'E_APPROVAL_BATCH'],
  ['stale exact body newline', input => { input.batches[0].articleSample.body = input.batches[0].articleSample.body.trimEnd() }, 'E_APPROVAL_BATCH'],
  ['style type reuse', input => { input.batches[0].cardSample.approval.kind = 'article-style' }, 'E_APPROVAL_KIND'],
  ['wrong approval batch', input => { input.batches[0].approval.batchId = 'other' }, 'E_APPROVAL_BATCH'],
  ['missing closure member', input => { input.batches[0].entityKeys.pop() }, 'E_APPROVAL_BATCH'],
  ['missing EN coverage', input => { input.review.receipts[0].coveredKeys.pop() }, 'E_REVIEW_COVERAGE'],
  ['missing current block', input => { input.review.receipts[0].currentHashes.pop() }, 'E_REVIEW_COVERAGE'],
  ['stale current leaf', input => { input.review.receipts[0].currentHashes[0].sha256 = sha256('stale') }, 'E_REVIEW_HASH'],
]) test(name, () => {
  const input = fixture()
  mutate(input)
  assert.equal(code(validateSeoulScope(input)), expected)
})

test('inspection permits pending but exact full current sets cannot shrink', () => {
  const input = fixture()
  input.contract.entities.forEach(row => { row.status = 'pending'; row.locationRefs = []; row.jurisdictionRefs = []; row.batchId = null; row.basis = null })
  input.contract.dispositions.forEach(row => { row.status = 'pending'; row.targetIds = []; row.batchId = null; row.basis = null })
  input.contract.documents[0] = { sourcePath, status: 'pending', reviewReceipt: null, batchId: null, basis: null }
  input.geography = null; input.facts = null; input.batches = []; input.review = null
  assert.equal(validateSeoulScope(input, { mode: 'inspection' }).ok, true)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  input.contract.entities.pop()
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_CENSUS_RIGHT')
})

test('selected migration validates its complete approved closure while unrelated pending stays in denominator', () => {
  const input = fixture()
  Object.assign(input.contract.entities[1], { status: 'pending', locationRefs: [], basis: null, batchId: 'batch:b' })
  Object.assign(input.contract.dispositions.find(row => row.set === 'persons' && row.id === 'K002'), { status: 'pending', targetIds: [], basis: null, batchId: 'batch:b' })
  bindBatch(input)
  assert.equal(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }).ok, true)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_PENDING')
  input.current.entitySets.persons.pop()
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_CENSUS_PERSON')
})

test('current ref edits cannot reuse an approved proposal even when still inside Seoul', () => {
  const input = fixture()
  input.contract.entities[0].locationRefs = ['dong:2']
  assert.equal(code(validateSeoulScope(input)), 'E_APPROVAL_BATCH')
})

test('selected entities cannot borrow a pending source from another reapproved batch', () => {
  const input = fixture()
  Object.assign(input.contract.documents[0], { status: 'pending', batchId: 'batch:b', basis: null, reviewReceipt: null })
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_SCOPE_PENDING')
})

test('reviewed cross-batch sources require approved dependencies and their complete review coverage', () => {
  const input = fixture()
  input.contract.documents[0].batchId = 'batch:b'
  for (const rows of Object.values(input.review)) for (const row of rows) row.batchId = 'batch:b'
  bindBatch(input); bindBatch(input, 'batch:b')
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_APPROVAL_BATCH')
  input.batches.find(row => row.id === 'batch:a').dependencyBatchIds = ['batch:b']
  assert.equal(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' }).ok, true)
  input.review.receipts[0].coveredKeys.pop()
  assert.equal(code(validateSeoulScope(input, { mode: 'migration', batchId: 'batch:a' })), 'E_REVIEW_COVERAGE')
})

test('assigned slots resolve independent active rights and exact holder/status', () => {
  const input = fixture()
  const slot = input.geography.countySlots[0].slots[0]
  Object.assign(slot, { status: 'direct', holderPersonId: 'K001', holdingRefs: ['unknown:right'] })
  bindBatch(input)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_REF')
  slot.holdingRefs = ['holding:old']; bindBatch(input)
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_ADMISSION')
  input.current.rights = [{ id: 'holding:old', holderPersonId: 'K001', slotStatus: 'direct' }]
  assert.equal(validateSeoulScope(input).ok, true)
  input.current.rights[0].holderPersonId = 'K002'
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_ADMISSION')
  input.current.rights[0].holderPersonId = 'K001'
  input.current.rights[0].slotStatus = 'vassal'
  assert.equal(code(validateSeoulScope(input)), 'E_SCOPE_ADMISSION')
  input.current.rights[0].slotStatus = 'direct'
  input.contract.dispositions.find(row => row.id === 'holding:old').status = 'pending'
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_SCOPE_PENDING')
})

test('a whole dong cannot be claimed by two counties even with different slot IDs', () => {
  const input = fixture()
  input.geography.titles.push({ titleId: 'county:b', rank: 'county', parentTitleId: 'duchy:a', jurisdictionRefs: ['dong:1'], basis: 'fixture geography' })
  input.facts.counties.push({ titleId: 'county:b', districtRef: 'gu:A', parts: [clone(input.facts.counties[0].parts[0])] })
  const slot = clone(input.geography.countySlots[0].slots[0])
  slot.slotId = 'slot:other-id'
  input.geography.countySlots.push({ countyTitleId: 'county:b', slots: [slot] })
  assert.equal(code(validateSeoulScope(input)), 'E_SLOT_DUPLICATE')
})

test('inspection never turns active rows into an approval bypass', () => {
  const input = fixture()
  input.batches = []
  assert.equal(code(validateSeoulScope(input, { mode: 'inspection' })), 'E_APPROVAL_BATCH')
})

test('proposal serialization is deterministic across key and ID ordering, without modifying exact sample bytes', () => {
  assert.equal(proposalHash({ z: 1, rows: [{ id: 'b', n: 2 }, { id: 'a', n: 1 }] }), proposalHash({ rows: [{ n: 1, id: 'a' }, { n: 2, id: 'b' }], z: 1 }))
  assert.deepEqual(canonicalProposal({ b: 2, a: 1 }), { a: 1, b: 2 })
  assert.notEqual(sha256('body\n'), sha256('body'))
  assert.deepEqual(baselineDocuments(fixture().baseline), [sourcePath, sealedPath])
})

function censusFixture() {
  // This denominator is declared before and independently of the mutable product.
  const original = { leaves: [['lore/unpublished.json', '/content/0/text/ko', 'dialogue', 'ko', sha256('대사')],
    ['lore/unpublished.json', '/content/0/text/en', 'dialogue', 'en', sha256('Dialogue')]],
  blocks: [{ sourcePath: 'lore/unpublished.json', jsonPointer: '/content/0', anchor: 'dialogue', locale: 'neutral', originalSha256: sha256('block') }],
  cards: [{ sourcePath: 'lore/duplicate.json', jsonPointer: '/content/3', anchor: 'duplicate', locale: 'en', originalSha256: sha256('duplicate card') }] }
  const current = clone(original)
  const index = compareCensusCategories(original, current)
  const docs = [...new Set(index.original.map(r => r.sourcePath))].map(sourcePath => ({ sourcePath, currentSha256: sha256(sourcePath), classification: 'current-pending',
    originalIndex: index.original.filter(r => r.sourcePath === sourcePath), currentIndex: index.current.filter(r => r.sourcePath === sourcePath) }))
  docs.push({ sourcePath: sealedPath, currentSha256: sha256(sealedBody), classification: 'sealed-history', originalIndex: [], currentIndex: [] })
  const ledger = { schema: 'seoul-relocation-census.v1', binding: { baselineSha256: sha256('independent') },
    people: ['K001', 'K002'].map(personId => ({ personId, status: 'pending', batchId: null, approval: null, proposedLocationRefs: [], proposedHoldingRefs: [], titleChanges: [], narrativeChanges: [], preservedFacts: [], changedFacts: [] })),
    originalRights: [{ set: 'holdings', id: 'right:original' }],
    cardOccurrences: [{ originalKey: 'duplicate-en-card', currentHash: sha256('duplicate card') }], connectedGroups: [{ personIds: ['K001', 'K002'] }], sharedSourceGroups: [{ personIds: ['K001', 'K002'] }] }
  const review = { schema: 'seoul-narrative-census.v1', binding: clone(ledger.binding), documents: docs, mapping: index, receipts: [], approvals: [] }
  const expected = { ledger, review, dependencies: [{ fromKey: 'K001', toKey: 'K002', kind: 'family' }] }
  return { expected, actual: clone(expected), original, current }
}

test('independent complete census admits pending extraction without semantic approval', () => {
  const { actual, expected } = censusFixture()
  assert.deepEqual(validateCensusProducts(actual, expected), { ok: true, errors: [] })
  assert.equal(actual.ledger.people.every(row => row.approval === null), true)
})

for (const [name, mutate, error] of [
  ['missing issued person', a => a.ledger.people.pop(), 'E_CENSUS_PERSON'],
  ['missing original right', a => a.ledger.originalRights.pop(), 'E_CENSUS_RIGHT'],
  ['missing duplicate card', a => a.ledger.cardOccurrences.pop(), 'E_REVIEW_COVERAGE'],
  ['missing unpublished block', a => { const doc = a.review.documents.find(d => d.sourcePath === 'lore/unpublished.json'); doc.originalIndex = doc.originalIndex.filter(r => r.category !== 'blocks') }, 'E_REVIEW_COVERAGE'],
  ['missing EN leaf', a => { a.review.documents.find(d => d.sourcePath === 'lore/unpublished.json').currentIndex.find(r => r.category === 'leaves').count -= 1 }, 'E_REVIEW_COVERAGE'],
  ['stale independently bound leaf hash', a => { a.review.documents[0].currentIndex[0].sha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['stale card', a => { a.ledger.cardOccurrences[0].currentHash = sha256('stale') }, 'E_REVIEW_HASH'],
  ['sealed promotion', a => { a.review.documents.at(-1).classification = 'current-pending' }, 'E_SCOPE_ADMISSION'],
  ['wrong approval kind', a => { a.ledger.people[0].approval = { kind: 'article-style' } }, 'E_APPROVAL_KIND'],
  ['invented owner approval', a => { a.ledger.people[0].approval = { kind: 'batch-allocation' } }, 'E_APPROVAL_BATCH'],
  ['omitted relation dependency', a => a.dependencies.pop(), 'E_REVIEW_COVERAGE'],
  ['unreviewed applied row', a => { a.ledger.people[0].status = 'applied' }, 'E_SCOPE_PENDING'],
  ['unknown unchecked metadata', a => { a.review.approved = true }, 'E_SCOPE_SHAPE'],
]) test(`census rejects ${name}`, () => {
  const { actual, expected } = censusFixture()
  mutate(actual)
  assert.equal(code(validateCensusProducts(actual, expected)), error)
})

test('recursive census includes escaped pointers, nearest anchor, EN dialogue and all kind objects', () => {
  const input = { anchor: 'root', source: { kind: 'original-fiction' }, content: [{ kind: 'list', anchor: 'nested', items: [{ ko: '대사', en: 'Dialogue' }] }], data: { 'a/b~c': { en: 'Unpublished' } } }
  const result = walkCensus(input, 'lore/unpublished.json')
  assert.equal(result.blocks.length, 2)
  assert.deepEqual(result.leaves.find(r => r[1] === '/data/a~1b~0c/en'), ['lore/unpublished.json', '/data/a~1b~0c/en', 'root', 'en', sha256('Unpublished')])
  assert.equal(result.leaves.find(r => r[1] === '/content/0/items/0/en')[2], 'nested')
})

test('independent review rejects caller shrinking or forging the current denominator', () => {
  const { original, current } = censusFixture()
  const doc = [{ sourcePath: 'lore/unpublished.json', batchId: 'a' }, { sourcePath: 'lore/duplicate.json', batchId: 'a' }]
  const rows = cats => Object.values(cats).flat().map(raw => {
    const [sourcePath, jsonPointer, , locale, originalSha256] = Array.isArray(raw) ? raw : [raw.sourcePath, raw.jsonPointer, raw.anchor, raw.locale, raw.originalSha256]
    return { key: JSON.stringify([sourcePath, jsonPointer, locale, originalSha256]), sha256: originalSha256, batchId: 'a' }
  })
  const review = { originalKeys: rows(original).map(({ key, batchId }) => ({ key, batchId })), currentKeys: rows(current), receipts: [] }
  assert.doesNotThrow(() => validateIndependentReview(review, original, current, doc))
  const missing = clone(review); missing.originalKeys.pop()
  assert.throws(() => validateIndependentReview(missing, original, current, doc), { code: 'E_REVIEW_COVERAGE' })
  const stale = clone(review); stale.currentKeys[0].sha256 = sha256('stale')
  assert.throws(() => validateIndependentReview(stale, original, current, doc), { code: 'E_REVIEW_HASH' })
  const batch = clone(review); batch.currentKeys[0].batchId = 'other'
  assert.throws(() => validateIndependentReview(batch, original, current, doc), { code: 'E_APPROVAL_BATCH' })
})

test('current card body boundaries come from actual headings, not archived span end', () => {
  const document = { content: [{ kind: 'heading', depth: 3, anchor: 'card', text: { ko: '인물 A', en: 'Person A' } }, { kind: 'paragraph', text: { ko: '새 대사', en: 'New dialogue' } }, { kind: 'heading', depth: 3 }] }
  const row = { sourcePath, jsonPointer: '/content/0', anchor: 'card', locale: 'en', startBlock: 0, endBlockExclusive: 1, originalSha256: sha256('old') }
  const categories = { leaves: [], blocks: [], headings: [], cards: [row], markdown: [], lines: [] }
  const current = extractCurrentCategories(new Map([[sourcePath, { value: document }]]), categories)
  assert.equal(current.cards[0].endBlockExclusive, 2)
  assert.equal(current.cards[0].originalSha256, sha256(JSON.stringify(document.content.slice(0, 2))))
})

test('shared source dependencies cannot be divided into independently approved person batches', () => {
  const input = fixture()
  const dependencies = { sharedSourceGroups: [{ personIds: ['K001', 'K002'], nodes: ['K001', 'K002', `file:${sourcePath}`] }] }
  assert.doesNotThrow(() => validateDependencyClosure(input.contract, input.batches, dependencies))
  input.contract.entities[1].status = 'pending'
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies), { code: 'E_SCOPE_PENDING' })
  input.contract.entities[1].status = 'active'; input.contract.entities[1].batchId = 'batch:b'
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies), { code: 'E_APPROVAL_BATCH' })
  bindBatch(input); bindBatch(input, 'batch:b')
  input.batches[0].dependencyBatchIds = ['batch:b']; input.batches[1].dependencyBatchIds = ['batch:a']
  assert.doesNotThrow(() => validateDependencyClosure(input.contract, input.batches, dependencies))
  input.contract.documents[0].status = 'pending'
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies), { code: 'E_SCOPE_PENDING' })
})

test('large source traversal is not bounded by the engine function argument limit', () => {
  const value = { content: Array.from({ length: 140000 }, (_, i) => `dialogue:${i}`) }
  const original = { leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] }
  const actual = extractCurrentCategories(new Map([[sourcePath, { value }]]), original)
  assert.equal(actual.leaves.length, value.content.length)
  assert.equal(actual.leaves.at(-1)[4], sha256('dialogue:139999'))
})

const cli = resolve(fileURLToPath(new URL('./check-seoul-scope.mjs', import.meta.url)))
function dependencyFixture() {
  const documents = {
    'lore/characters/Cast-Relations.json': { content: [] },
    'lore/name-pools/cast-family-trees.json': { nodes: [{ id: 'FH-A' }], edges: [] },
    'lore/relations/relations.json': { courts: [], directRetainers: [], ownerLieges: { edges: [] }, courtMemberships: { memberships: [] } },
    'lore/name-pools/cast-household-relations.json': { people: [] },
    'lore/name-pools/cast-prose-contacts.json': { records: [] },
    'lore/relations/personal-holdings.json': { holdings: [{ id: 'h', facilityRef: {
      sourcePath: 'lore/regions/station-interiors.json', stationName: 'A', stationIdentity: { district: 'D', lat: 1, lon: 2 }, layerId: 'concourse',
      siteSourcePath: 'lore/regions/content/site.json', siteAnchor: 'osm:node:1',
    } }] },
    'lore/regions/station-interiors.json': { stations: [{ name: 'A', district: 'D', lat: 1, lon: 2, layers: [{ id: 'concourse' }] }] },
    'lore/regions/content/site.json': { regions: [{ content: { buildings: [{ anchor_ref: 'osm:node:1' }] } }] },
    'lore/relations/opening-feudal-allocation.json': { titles: [{ id: 'child', parentTitleId: 'parent' }], existingTitleBindings: [{ holdingId: 'h', titleId: 'child' }] },
    'lore/relations/opening-office-appointments.json': { appointments: [{ personId: 'K001', stateId: 'S01' }] },
    'lore/name-pools/diaspora-family-lineages.json': { lineages: [{ key: 'family', members: [{ key: 'ancestor' }, { key: 'child', parentKeys: ['ancestor'] }] }] },
    'lore/editorial/Soul-Candidates.json': { candidates: [{ id: 'candidate', careerSummary: { ko: 'career' } }] },
    'lore/target.json': { content: [{ kind: 'heading', anchor: 'block', publicAnchors: ['alias'], text: { ko: '제목', en: 'Natural Heading' } }] },
    'lore/consumer.json': { refs: [
      { path: 'lore/name-pools/cast-family-trees.json', anchor: 'FH-A' },
      { path: 'lore/editorial/Soul-Candidates.json', anchor: 'candidates/candidate/careerSummary' },
      { path: 'lore/name-pools/diaspora-family-lineages.json', anchor: 'family/child' },
      { text: 'linked', link: { domain: 'root', slug: 'target', anchor: 'natural-heading' } },
      'GDD/canon/source.json#unknown', { repository: 'external', path: 'source.json', commit: 'revision', sha256: sha256('unread') },
      'lore/target.json#/content/99',
    ] },
  }
  return new Map(Object.entries(documents).map(([path, value]) => { const bytes = Buffer.from(JSON.stringify(value)); return [path, { value, bytes, sha256: sha256(bytes) }] }))
}

test('typed facility pairs resolve station layer and site independently, never a crossed anchor', () => {
  const sources = dependencyFixture()
  const graph = extractDependencies(sources, [{ id: 'K001', name: 'A' }], {})
  const refs = graph.references.filter(r => r.source.jsonPointer === '/holdings/0/facilityRef')
  assert.deepEqual(refs.map(r => [r.vocabulary, r.targets[0].sourcePath, r.targets[0].jsonPointer]), [
    ['station-layer', 'lore/regions/station-interiors.json', '/stations/0/layers/0'],
    ['site', 'lore/regions/content/site.json', '/regions/0/content/buildings/0/anchor_ref'],
  ])
  const value = sources.get('lore/relations/personal-holdings.json').value.holdings[0].facilityRef
  ;[value.sourcePath, value.siteSourcePath] = [value.siteSourcePath, value.sourcePath]
  const wrong = extractDependencies(sources, [{ id: 'K001', name: 'A' }], {})
  assert.equal(wrong.unresolved.filter(r => ['station-layer', 'site'].includes(r.vocabulary)).length, 2)
})

test('source contracts resolve keyed candidates, family and lineage without accepting duplicates', () => {
  const sources = dependencyFixture(); const resolveRef = createDependencyResolver(sources)
  for (const [path, selector, pointer] of [
    ['lore/editorial/Soul-Candidates.json', 'candidates/candidate', '/candidates/0'],
    ['lore/editorial/Soul-Candidates.json', 'candidates/candidate/careerSummary', '/candidates/0/careerSummary'],
    ['lore/name-pools/cast-family-trees.json', 'FH-A', '/nodes/0'],
    ['lore/name-pools/diaspora-family-lineages.json', 'family/child', '/lineages/0/members/1'],
  ]) assert.equal(resolveRef(path, 'lore/consumer.json', selector).targets[0].jsonPointer, pointer)
  sources.get('lore/name-pools/cast-family-trees.json').value.nodes.push({ id: 'FH-A' })
  assert.equal(createDependencyResolver(sources)('lore/name-pools/cast-family-trees.json', '', 'FH-A').reason, 'selector-not-unique')
})

test('renderer natural headings and aliases retain record targets while missing fragments and external evidence stay unresolved', () => {
  const sources = dependencyFixture(); const graph = extractDependencies(sources, [{ id: 'K001', name: 'A' }], {})
  const link = graph.references.find(r => r.vocabulary === 'renderer')
  assert.equal(link.status, 'resolved'); assert.equal(link.targets[0].jsonPointer, '/content/0')
  assert.equal(createDependencyResolver(sources)('lore/target.json', '', 'alias', 'renderer').status, 'resolved')
  assert.ok(graph.unresolved.some(r => r.target === 'lore/target.json#/content/99'))
  const external = graph.unresolved.filter(r => r.external)
  assert.equal(external.length, 2); assert.equal(external[1].external.revision, 'revision')
  assert.equal(external[1].external.targetSha256, sha256('unread'))
})

test('schema edges retain separate title, holding, state and lineage namespaces', () => {
  const graph = extractDependencies(dependencyFixture(), [{ id: 'K001', name: 'A' }], {})
  for (const [kind, fromKey, toKey] of [
    ['title-parent', 'entity:titles:child', 'entity:titles:parent'],
    ['holding-title-binding', 'entity:holdings:h', 'entity:titles:child'],
    ['appointment-person-state', 'identity:K001', 'entity:states:S01'],
    ['lineage-parent', 'lineage:family:ancestor', 'lineage:family:child'],
  ]) {
    const edge = graph.edges.find(e => e.kind === kind)
    assert.equal(edge.fromKey, fromKey); assert.equal(edge.toKey, toKey)
    const { actual, expected } = censusFixture()
    actual.dependencies = clone(graph); expected.dependencies = graph
    actual.dependencies.edges = actual.dependencies.edges.filter(e => e.kind !== kind)
    assert.equal(code(validateCensusProducts(actual, expected)), 'E_REVIEW_COVERAGE')
  }
})

test('original diagnostic dispositions reject stale source bytes and keep raw targets', () => {
  const sources = dependencyFixture(); const path = 'lore/consumer.json'; const value = sources.get(path).value.refs[0]
  const original = { sourcePath: path, jsonPointer: '/refs/0', sourceSha256: sources.get(path).sha256,
    recordSha256: sha256(JSON.stringify(value)), target: `${value.path}#${value.anchor}`, reviewStatus: 'not-reviewed' }
  const row = { key: JSON.stringify([path, '/refs/0', original.target, original.recordSha256]), original,
    classification: 'parser-vocabulary', currentResolution: 'family-node-id' }
  const result = dependencyDispositions(sources, [row], createDependencyResolver(sources))
  assert.deepEqual(result[0].original, original); assert.equal(result[0].status, 'resolved')
  const { actual, expected } = censusFixture(); actual.dependencies = clone(result); expected.dependencies = result
  actual.dependencies.pop()
  assert.equal(code(validateCensusProducts(actual, expected)), 'E_REVIEW_COVERAGE')
  sources.get(path).sha256 = sha256('changed')
  assert.throws(() => dependencyDispositions(sources, [row], createDependencyResolver(sources)), { code: 'E_REVIEW_HASH' })
})

test('required unresolved evidence is visible in inspection but blocks publication and an approved batch', () => {
  const input = fixture(); input.contract.entities.forEach(e => { e.status = 'pending' })
  input.contract.documents[0].status = 'pending'; input.batches = []
  const dependencies = { unresolved: [{ sourcePath, jsonPointer: '/missing', required: true }], sharedSourceGroups: [] }
  assert.doesNotThrow(() => validateDependencyClosure(input.contract, [], dependencies, { mode: 'inspection' }))
  assert.throws(() => validateDependencyClosure(input.contract, [], dependencies, { mode: 'publication' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
  bindBatch(input)
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'inspection' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
  assert.throws(() => validateDependencyClosure(input.contract, input.batches, dependencies, { mode: 'migration', batchId: 'batch:a' }), { code: 'E_DEPENDENCY_UNRESOLVED' })
})

function profileCitationFixture(field = 'skills') {
  const sources = dependencyFixture()
  const path = `lore/editorial/profile-batches/state-${field === 'skills' ? '09-10' : '15-16'}.json`
  const target = `lore/characters/Cast-State-${field === 'skills' ? '09' : '15'}.json`
  const anchor = `인물-A-p${field === 'skills' ? '3' : '4'}`
  const basis = field === 'skills' ? `${target}#${anchor}, 인물-A-p4; 근거.` : `${target}#${anchor}와 관계·가치 기록. 근거.`
  const put = (path, value) => { const bytes = Buffer.from(JSON.stringify(value)); sources.set(path, { value, bytes, sha256: sha256(bytes) }) }
  put(target, { content: [{ kind: 'paragraph', anchor, text: { ko: [{ text: '실제 기록' }], en: 'Actual record' } },
    ...(field === 'skills' ? [{ kind: 'paragraph', anchor: '인물-A-p4', text: { ko: '별도 일화' } }] : [])] })
  put(path, { profiles: [{ [field]: [{ basis }], evidence: [{ path: target, anchor, quote: '실제 기록' }] }] })
  return { sources, path, target, field, anchor, basis, put }
}

for (const field of ['skills', 'traits']) test(`profile ${field} delimiters preserve raw diagnostics and exact quoted target hashes`, () => {
  const input = profileCitationFixture(field)
  const graph = extractDependencies(input.sources, [], {})
  const row = graph.profileCitationDispositions[0]
  assert.equal(graph.profileCitationDispositions.length, 1)
  assert.equal(row.status, 'supported-correspondence')
  assert.equal(row.original.target, `${input.target}#${input.anchor}${field === 'skills' ? ',' : '와'}`)
  assert.equal(row.original.reason, 'selector-missing')
  assert.equal(row.original.recordSha256, sha256(JSON.stringify(input.basis)))
  assert.equal(row.original.sourceSha256, input.sources.get(input.path).sha256)
  assert.equal(row.original.required, true)
  assert.equal(row.reviewStatus, 'not-reviewed')
  assert.equal(row.targets.length, field === 'skills' ? 2 : 1)
  for (const [i, target] of row.targets.entries()) {
    assert.equal(target.jsonPointer, `/content/${i}`)
    assert.equal(target.sourceSha256, input.sources.get(input.target).sha256)
    assert.equal(target.recordSha256, sha256(JSON.stringify(input.sources.get(input.target).value.content[i])))
  }
  const reference = graph.references.find(r => r.source.jsonPointer === `/profiles/0/${field}/0/basis`)
  assert.equal(reference.raw, row.original.target)
  assert.deepEqual(reference.targets, row.targets)
  assert.ok(graph.unresolved.some(r => r.target === 'lore/target.json#/content/99'))
})

for (const [name, field, mutate] of [
  ['missing intended anchor', 'skills', i => { i.sources.get(i.target).value.content[0].anchor = 'absent' }],
  ['duplicate intended anchor', 'traits', i => { i.sources.get(i.target).value.content.push(clone(i.sources.get(i.target).value.content[0])) }],
  ['missing second list anchor', 'skills', i => { i.sources.get(i.target).value.content.pop() }],
  ['non-delimiter comma', 'skills', i => { i.sources.get(i.path).value.profiles[0].skills[0].basis = `${i.target}#${i.anchor},suffix` }],
  ['non-delimiter conjunction', 'traits', i => { i.sources.get(i.path).value.profiles[0].traits[0].basis = `${i.target}#${i.anchor}와붙은문자` }],
  ['unquoted evidence', 'traits', i => { i.sources.get(i.path).value.profiles[0].evidence[0].quote = '다른 기록' }],
  ['duplicate corroboration', 'skills', i => { i.sources.get(i.path).value.profiles[0].evidence.push(clone(i.sources.get(i.path).value.profiles[0].evidence[0])) }],
  ['generic consumer', 'skills', i => { i.put('lore/consumer.json', i.sources.get(i.path).value); i.sources.delete(i.path) }],
]) test(`profile delimiter correspondence rejects ${name}`, () => {
  const input = profileCitationFixture(field); mutate(input)
  const graph = extractDependencies(input.sources, [], {})
  assert.equal(graph.profileCitationDispositions.length, 0)
  assert.ok(graph.unresolved.some(r => r.jsonPointer === `/profiles/0/${field}/0/basis` && r.required))
})

for (const field of ['skills', 'traits']) test(`literal ${field === 'skills' ? 'comma' : '와'} anchor wins over profile delimiter interpretation`, () => {
  const input = profileCitationFixture(field)
  const literal = `${input.anchor}${field === 'skills' ? ',' : '와'}`
  input.sources.get(input.target).value.content.push({ kind: 'paragraph', anchor: literal, text: { ko: '실제 앵커' } })
  const graph = extractDependencies(input.sources, [], {})
  const reference = graph.references.find(r => r.source.jsonPointer === `/profiles/0/${field}/0/basis`)
  assert.equal(graph.profileCitationDispositions.length, 0)
  assert.equal(reference.status, 'resolved')
  assert.equal(reference.targets[0].jsonPointer, field === 'skills' ? '/content/2' : '/content/1')
})

let localProvenanceInputs
async function localProvenanceFixture() {
  const sources = dependencyFixture()
  const comparisonPath = 'data/geography/seoul-20260830/boundaries-kostat-2013/seoul_municipalities_geo.json'
  const paths = ['lore/regions/sources/selection.json', 'scripts/data/admin-territorial-catalog.json',
    'snapshots/build-inputs/creative-name-normalization.json', 'snapshots/build-inputs/source-manifest.json',
    'snapshots/build-inputs/SeoulWorldGraph.json', comparisonPath]
  localProvenanceInputs ??= Promise.all(paths.map(async path => [path, await readFile(new URL('../' + path, import.meta.url))]))
  const provenanceSources = new Map()
  for (const [path, bytes] of await localProvenanceInputs) {
    const record = { bytes: Buffer.from(bytes), value: JSON.parse(bytes), sha256: sha256(bytes) }
    ;(path === comparisonPath ? provenanceSources : sources).set(path, record)
  }
  const rebind = path => {
    const source = sources.get(path) ?? provenanceSources.get(path)
    source.bytes = Buffer.from(JSON.stringify(source.value)); source.sha256 = sha256(source.bytes)
  }
  const graph = () => extractDependencies(sources, [], {}, [], provenanceSources)
  return { sources, provenanceSources, comparisonPath, rebind, graph }
}

for (const [path, jsonPointer, targetCount] of [
  ['lore/regions/sources/selection.json', '/comparison_boundary', 1],
  ['scripts/data/admin-territorial-catalog.json', '/sourceRef', 1],
  ['snapshots/build-inputs/creative-name-normalization.json', '/references/2', 3],
]) test('local provenance keeps exact original diagnostic at ' + path + jsonPointer, async () => {
  const input = await localProvenanceFixture(); const graph = input.graph()
  const row = graph.localProvenanceDispositions.find(r => r.original.sourcePath === path)
  assert.equal(graph.localProvenanceDispositions.length, 3)
  assert.equal(row.original.jsonPointer, jsonPointer)
  assert.equal(row.original.sourceSha256, input.sources.get(path).sha256)
  assert.equal(row.original.required, true)
  assert.equal(row.original.reviewStatus, 'not-reviewed')
  assert.equal(row.reviewStatus, 'not-reviewed')
  assert.equal(row.status, 'provenance-correspondence')
  assert.equal(row.targets.length, targetCount)
  for (const ref of row.targets) {
    const source = input.sources.get(ref.sourcePath) ?? input.provenanceSources.get(ref.sourcePath)
    const value = ref.jsonPointer === '' ? source.value : ref.jsonPointer.slice(1).split('/').reduce((v, k) => v[k], source.value)
    assert.equal(ref.sourceSha256, sha256(source.bytes))
    assert.equal(ref.recordSha256, sha256(JSON.stringify(value)))
  }
  const reference = graph.references.find(r => r.source.sourcePath === path && r.source.jsonPointer === jsonPointer)
  assert.equal(reference.raw, row.original.target)
  assert.deepEqual(reference.targets, row.targets)
  assert.equal(graph.unresolved.some(r => r.sourcePath === path && r.jsonPointer === jsonPointer), false)
  if (jsonPointer === '/comparison_boundary') assert.equal(row.provenanceBoundary.currentBoundary, false)
  if (jsonPointer === '/references/2') {
    assert.equal(row.original.target, 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
    assert.equal(row.provenanceBoundary.canonicalPath, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
    assert.equal(row.provenanceBoundary.currentRuntime, false)
  }
})

for (const [name, path, jsonPointer, mutate] of [
  ['comparison declared hash mismatch', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.sources.get('lore/regions/sources/selection.json').value.comparison_boundary.sha256 = sha256('other'); i.rebind('lore/regions/sources/selection.json')
  }],
  ['comparison source bytes mismatch', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.provenanceSources.get(i.comparisonPath).bytes = Buffer.from('{}')
  }],
  ['comparison cannot be current geometry', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.sources.get('lore/regions/sources/selection.json').value.comparison_boundary.current_boundary = true; i.rebind('lore/regions/sources/selection.json')
  }],
  ['comparison wrong source root', 'lore/regions/sources/selection.json', '/comparison_boundary', i => {
    i.sources.get('lore/regions/sources/selection.json').value.comparison_boundary.source_root = '../other'; i.rebind('lore/regions/sources/selection.json')
  }],
  ['admin hash mismatch', 'scripts/data/admin-territorial-catalog.json', '/sourceRef', i => {
    i.sources.get('scripts/data/admin-territorial-catalog.json').value.sourceSha256 = sha256('other'); i.rebind('scripts/data/admin-territorial-catalog.json')
  }],
  ['missing top-level member despite generic anchor', 'scripts/data/admin-territorial-catalog.json', '/sourceRef', i => {
    const value = i.sources.get('lore/regions/sources/selection.json').value
    delete value.selected_boundary; value.content = [{ anchor: 'selected_boundary' }]; i.rebind('lore/regions/sources/selection.json')
  }],
  ['duplicate top-level source contract', 'scripts/data/admin-territorial-catalog.json', '/sourceRef', i => {
    const source = i.sources.get('lore/regions/sources/selection.json')
    source.bytes = Buffer.from('{"selected_boundary":' + JSON.stringify(source.value.selected_boundary) + ',' + source.bytes.toString().slice(1))
    source.value = JSON.parse(source.bytes); source.sha256 = sha256(source.bytes)
  }],
  ['missing manifest', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => i.sources.delete('snapshots/build-inputs/source-manifest.json')],
  ['missing manifest file member', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.files.shift(); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['duplicate manifest file contract', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    const files = i.sources.get('snapshots/build-inputs/source-manifest.json').value.files
    files.push(clone(files[0])); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['snapshot hash mismatch', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/SeoulWorldGraph.json').bytes = Buffer.from('{}')
  }],
  ['manifest snapshot hash mismatch', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.files[0].sha256 = sha256('other'); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['wrong repository', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.producer.game.repository = 'other/repository'; i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['wrong revision', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.producer.game.commit = '0'.repeat(40); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['noncanonical Game producer path', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.producer.game.path = 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json'; i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
  ['unbound originating import', 'snapshots/build-inputs/creative-name-normalization.json', '/references/2', i => {
    i.sources.get('snapshots/build-inputs/source-manifest.json').value.files[2].sha256 = sha256('other'); i.rebind('snapshots/build-inputs/source-manifest.json')
  }],
]) test('local provenance rejects ' + name, async () => {
  const input = await localProvenanceFixture(); mutate(input)
  const graph = input.graph()
  assert.equal(graph.localProvenanceDispositions.some(r => r.original.sourcePath === path && r.original.jsonPointer === jsonPointer), false)
  assert.ok(graph.unresolved.some(r => r.sourcePath === path && r.jsonPointer === jsonPointer && r.required && r.reviewStatus === 'not-reviewed'))
})

test('local provenance is not a generic member or missing-path fallback', async () => {
  const input = await localProvenanceFixture()
  const value = { refs: [input.sources.get('scripts/data/admin-territorial-catalog.json').value.sourceRef,
    { path: 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json' },
    { path: 'boundaries-kostat-2013/seoul_municipalities_geo.json' }] }
  const bytes = Buffer.from(JSON.stringify(value))
  input.sources.set('lore/unauthorized.json', { value, bytes, sha256: sha256(bytes) })
  const graph = input.graph()
  assert.equal(graph.unresolved.filter(r => r.sourcePath === 'lore/unauthorized.json').length, 3)
  assert.equal(graph.localProvenanceDispositions.length, 3)
})

async function runCli(args) {
  // Subscribe before triggering process execution; no sleeps, polling or success-log inference.
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 })
    let stdout = ''; let stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (status, signal) => resolveResult({ status, signal, stdout, stderr }))
  })
}

async function writeFixture(root, input) {
  await mkdir(resolve(root, 'lore/editorial'), { recursive: true })
  await mkdir(resolve(root, 'vendor/issued-history'), { recursive: true })
  await writeFile(resolve(root, sourcePath), sourceBody)
  await writeFile(resolve(root, sealedPath), sealedBody)
  await writeFile(resolve(root, 'archive.txt'), 'archived fixture bytes\n')
  await writeFile(resolve(root, 'baseline.json'), JSON.stringify(input.baseline))
  await writeFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json'), JSON.stringify(input.contract))
  const { baseline, baselineSha256, contract, archiveHashes, sourceHashes, ...context } = input
  await writeFile(resolve(root, 'scope-input.json'), JSON.stringify(context))
}

test('real CLI fixture-root commands return exact exit codes and machine errors; interruption leftovers never count as output', async () => {
  const owned = resolve(fileURLToPath(new URL('../.omo/tmp', import.meta.url)))
  await mkdir(owned, { recursive: true })
  const root = await mkdtemp(resolve(owned, 'seoul-scope-test-'))
  try {
    for (const [name, mutate, expected] of [
      ['complete', () => {}, null],
      ['outside-person', i => { i.contract.entities[0].locationRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
      ['outside-title', i => { i.contract.entities[2].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
      ['outside-holding', i => { i.contract.entities[3].jurisdictionRefs = ['region:1111111111-outside'] }, 'E_SCOPE_OUTSIDE'],
      ['empty', i => { i.contract.entities[0].locationRefs = [] }, 'E_SCOPE_LOCATION'],
      ['unknown', i => { i.contract.entities[0].locationRefs = ['unknown'] }, 'E_SCOPE_REF'],
      ['missing', i => { i.contract.entities.splice(0, 1) }, 'E_CENSUS_PERSON'],
      ['pending', i => { i.contract.entities[0].status = 'pending' }, 'E_SCOPE_PENDING'],
    ]) {
      const input = fixture(); mutate(input); await writeFixture(root, input)
      await writeFile(resolve(root, 'success.partial'), '{"ok":true}')
      const result = await runCli(['--fixture-root', root])
      assert.equal(result.signal, null, name)
      assert.equal(result.status, expected ? 1 : 0, `${name}: ${result.stderr}`)
      const parsed = JSON.parse(result.stdout)
      assert.equal(code(parsed), expected ?? undefined, name)
      assert.equal(parsed.ok, !expected, name)
      console.log(`CLI ${name} exit=${result.status} ${expected ?? 'OK'}`)
    }
    const migration = fixture()
    Object.assign(migration.contract.entities[1], { status: 'pending', locationRefs: [], basis: null, batchId: 'batch:b' })
    Object.assign(migration.contract.dispositions.find(row => row.set === 'persons' && row.id === 'K002'), { status: 'pending', targetIds: [], basis: null, batchId: 'batch:b' })
    bindBatch(migration)
    await writeFixture(root, migration)
    const selected = await runCli(['--fixture-root', root, '--migration-batch', 'batch:a'])
    assert.equal(selected.status, 0, selected.stdout)
    assert.equal(JSON.parse(selected.stdout).ok, true)
    const all = await runCli(['--fixture-root', root])
    assert.equal(all.status, 1)
    assert.equal(code(JSON.parse(all.stdout)), 'E_SCOPE_PENDING')
    await writeFixture(root, stagingFixture())
    for (const [args, status] of [[['--inspection'], 0], [[], 1], [['--migration-batch', 'batch:a'], 1]]) {
      const result = await runCli(['--fixture-root', root, ...args])
      assert.equal(result.status, status, result.stdout)
      assert.equal(code(JSON.parse(result.stdout)), status ? 'E_SCOPE_PENDING' : undefined)
      console.log(`CLI staged ${args.join(' ') || 'publication'} exit=${status}`)
    }
    await writeFixture(root, spatialFixture())
    for (const [args, status] of [[['--inspection'], 0], [[], 1], [['--migration-batch', 'batch:a'], 1]]) {
      const result = await runCli(['--fixture-root', root, ...args])
      assert.equal(result.status, status, result.stdout)
      assert.equal(code(JSON.parse(result.stdout)), status ? 'E_SCOPE_PENDING' : undefined)
      console.log(`CLI spatial ${args.join(' ') || 'publication'} exit=${status}`)
    }
    for (const [name, mutate, args, expected] of [
      ['pending-source', input => { Object.assign(input.contract.documents[0], { status: 'pending', batchId: 'batch:b', basis: null, reviewReceipt: null }) }, ['--migration-batch', 'batch:a'], 'E_SCOPE_PENDING'],
      ['unknown-right', input => { Object.assign(input.geography.countySlots[0].slots[0], { status: 'direct', holderPersonId: 'K001', holdingRefs: ['unknown:right'] }) }, [], 'E_SCOPE_REF'],
    ]) {
      const input = fixture(); mutate(input); bindBatch(input); await writeFixture(root, input)
      const result = await runCli(['--fixture-root', root, ...args])
      assert.equal(result.status, 1, name)
      assert.equal(code(JSON.parse(result.stdout)), expected, name)
      console.log(`CLI ${name} exit=${result.status} ${expected}`)
    }
    await writeFile(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json'), '{invalid')
    const malformed = await runCli(['--fixture-root', root])
    assert.equal(malformed.status, 1)
    assert.equal(code(JSON.parse(malformed.stdout)), 'E_SCOPE_INPUT')
    for (const args of [['--unknown'], ['--fixture-root'], ['--inspection', '--migration-batch', 'a'], ['--inspection', '--inspection']]) {
      const invalid = await runCli(args)
      assert.equal(invalid.status, 1)
      assert.equal(code(JSON.parse(invalid.stdout)), 'E_SCOPE_INPUT')
    }
  } finally {
    await rm(root, { recursive: true })
    await assert.rejects(readFile(resolve(root, 'baseline.json')), { code: 'ENOENT' })
    console.log(`CLEANUP removed ${root}`)
  }
})
