import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { test } from 'vitest'
import { ENTITY_SETS, baselineDocuments, canonicalProposal, proposalHash, sha256, validateSeoulScope } from './seoul-scope.mjs'

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

const cli = resolve(fileURLToPath(new URL('./check-seoul-scope.mjs', import.meta.url)))
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
