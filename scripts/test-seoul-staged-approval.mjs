import assert from 'node:assert/strict'
import { readFile, realpath } from 'node:fs/promises'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
const execFile = promisify(execFileCb)
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { ENTITY_SETS, proposalHash, sha256 } from './seoul-scope.mjs'
import { compareCensusCategories } from './seoul-census.mjs'
import { loadK1003K1004Proposal, validateStagedApproval, validateK1003K1004SourceDraft, validateStoredStagedApplication } from './seoul-staged-approval.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const canonicalRoot = resolve(await realpath(resolve(root, '.omo/evidence')), '../..')
const packet = await loadK1003K1004Proposal(canonicalRoot)
const clone = structuredClone
const code = result => result.errors[0]?.code
const frozenBytes = JSON.stringify(packet)

async function appliedSourceFixture() {
  const packetBytes = await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/k1003-k1004-combined-approved-staging/combined-packet.json'))
  assert.equal(sha256(packetBytes), 'f76ddfa62865ce6672bb60f0d0800b4f4000cf5dbc8768ee8b3e912cd5b4df15')
  const draft = JSON.parse(packetBytes)
  const before = new Map(); const current = new Map(); const values = new Map()
  for (const row of draft.sourceHashBindings) {
    const bytes = (await execFile('git', ['-C', root, 'show', `e9c12a43728a599c371d373088e177a446ff5051:${row.sourcePath}`],
      { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout
    assert.equal(sha256(bytes), row.beforeSha256, row.sourcePath)
    before.set(row.sourcePath, { bytes }); current.set(row.sourcePath, { bytes })
    if (row.changed) values.set(row.sourcePath, JSON.parse(bytes))
  }
  for (const op of draft.operations) {
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    let parent = values.get(op.file)
    for (const part of parts.slice(0, -1)) parent = parent[part]
    if (op.op === 'add') parent.splice(Number(parts.at(-1)), 0, clone(op.value))
    else parent[parts.at(-1)] = clone(op.value)
  }
  for (const [path, value] of values) {
    const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    assert.equal(sha256(bytes), draft.sourceHashBindings.find(row => row.sourcePath === path).afterSha256, path)
    current.set(path, { bytes })
  }
  return { current, before }
}

test('reviewed source draft rejects unrelated source changes even under a valid packet hash', async () => {
  const draftBytes = await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/k1003-k1004-approved-source-draft-v2/replacements.json'))
  const draft = JSON.parse(draftBytes)
  const bindingBytes = await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/k1003-k1004-full-census/extraction-contract-verification.json'))
  const binding = JSON.parse(bindingBytes)
  const { current, before } = await appliedSourceFixture()
  assert.equal(code(validateK1003K1004SourceDraft(draftBytes, current, current, bindingBytes)), 'E_REVIEW_HASH')
  const values = new Map()
  for (const row of binding.inputBindings.sources) {
    const { bytes } = before.get(row.sourcePath)
    assert.equal(sha256(bytes), row.sha256, row.sourcePath)
    if (draft.sourcePreconditions.some(item => item.file === row.sourcePath)) values.set(row.sourcePath, JSON.parse(bytes))
  }
  for (const operation of draft.operations) {
    const parts = operation.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    let parent = values.get(operation.file)
    for (const part of parts.slice(0, -1)) parent = parent[part]
    if (operation.op === 'add') parent.splice(Number(parts.at(-1)), 0, clone(operation.value))
    else parent[parts.at(-1)] = clone(operation.value)
  }
  const after = new Map(before)
  for (const [path, value] of values) after.set(path, { bytes: Buffer.from(JSON.stringify(value)) })
  const validate = () => validateK1003K1004SourceDraft(draftBytes, before, after, bindingBytes)
  assert.deepEqual(validate(), { ok: true, errors: [] })
  const forged = applicationFixture()
  forged.context.application.sourceDraft = { draftBytes, beforeSources: before, afterSources: after, bindingBytes }
  assert.equal(code(validateStagedApproval(forged.proposal, forged.context, forged.previous)), 'E_REVIEW_COVERAGE')
  // Parsed metadata supplied by a caller is not authoritative: the gate's
  // extraction path must always normalize from these authenticated bytes.
  const castPath = draft.sourcePreconditions[0].file
  after.set(castPath, { ...after.get(castPath), value: { content: [] }, sha256: '0'.repeat(64) })
  assert.deepEqual(validate(), { ok: true, errors: [] })
  const registry = 'lore/name-pools/person-id-registry.json'
  const saved = before.get(registry)
  after.set(registry, { bytes: Buffer.from('{}') })
  assert.equal(code(validate()), 'E_REVIEW_COVERAGE')
  before.set(registry, { bytes: Buffer.from('{}') })
  assert.equal(code(validate()), 'E_REVIEW_HASH')
  before.set(registry, saved); after.set(registry, saved)
  after.delete(registry)
  assert.equal(code(validate()), 'E_REVIEW_COVERAGE')
  after.set(registry, saved)
  before.set('lore/unbound.json', { bytes: Buffer.from('{}') })
  after.set('lore/unbound.json', { bytes: Buffer.from('{}') })
  assert.equal(code(validate()), 'E_REVIEW_COVERAGE')
  before.delete('lore/unbound.json'); after.delete('lore/unbound.json')
  const path = draft.sourcePreconditions[0].file
  const changed = JSON.parse(after.get(path).bytes)
  changed.content.push({ kind: 'paragraph', text: { ko: 'unapproved' } })
  after.set(path, { bytes: Buffer.from(JSON.stringify(changed)) })
  assert.equal(code(validate()), 'E_REVIEW_HASH')
  assert.equal(code(validateK1003K1004SourceDraft(Buffer.from('{}'), before, after, bindingBytes)), 'E_APPROVAL_BATCH')
})

function content(value) {
  const { state, approvals, application, ...result } = value
  return result
}
function applicationFixture() {
  const sourcePath = 'lore/characters/fixture.json'
  const original = { leaves: [[sourcePath, '/content/0/text/ko', 'card', 'ko', sha256('before')],
    [sourcePath, '/content/1/text/en', 'other-person', 'en', sha256('untouched')]], blocks: [], headings: [], cards: [], markdown: [], lines: [] }
  const before = clone(original); const after = clone(original)
  after.leaves[0][4] = sha256('after')
  const mapping = compareCensusCategories(before, after)
  const originalMapping = compareCensusCategories(original, after)
  const receipt = { appliedBy: 'fixture:writer', mapping, originalMapping, review: null }
  const review = { kind: 'application-review', proposalSha256: proposalHash(content(packet.approved)),
    receiptSha256: proposalHash({ appliedBy: receipt.appliedBy, mapping, originalMapping }), reviewerRef: 'fixture:independent-reviewer',
    messageRef: 'fixture:review-message', evidencePath: '.omo/evidence/seoul-lock/fixture-review.md' }
  receipt.review = clone(review)
  return { proposal: { ...clone(packet.approved), state: 'applied', application: receipt },
    context: { ...clone(packet.context), application: { original, before, after, review } }, previous: clone(packet.approved) }
}

test('combined 84-operation packet binds changed and untouched source bytes', async () => {
  const draftBytes = await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/k1003-k1004-combined-approved-staging/combined-packet.json'))
  const bindingBytes = await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/k1003-k1004-full-census/extraction-contract-verification.json'))
  const draft = JSON.parse(draftBytes)
  const { current, before } = await appliedSourceFixture()
  assert.equal(code(validateK1003K1004SourceDraft(draftBytes, current, current, bindingBytes)), 'E_REVIEW_HASH')
  const values = new Map()
  for (const row of draft.sourceHashBindings) {
    const { bytes } = before.get(row.sourcePath)
    if (row.changed) values.set(row.sourcePath, JSON.parse(bytes))
  }
  for (const operation of draft.operations) {
    const parts = operation.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    let parent = values.get(operation.file)
    for (const part of parts.slice(0, -1)) parent = parent[part]
    if (operation.op === 'add') parent.splice(Number(parts.at(-1)), 0, clone(operation.value))
    else parent[parts.at(-1)] = clone(operation.value)
  }
  const after = new Map(before)
  for (const [path, value] of values) after.set(path, { bytes: Buffer.from(JSON.stringify(value, null, 2) + '\n') })
  assert.equal(draft.operations.length, 84)
  assert.deepEqual(validateK1003K1004SourceDraft(draftBytes, before, after, bindingBytes), { ok: true, errors: [] })
  const source = 'lore/editorial/profile-batches/special.json'
  const unapproved = clone(values.get(source))
  unapproved.unapproved = true
  after.set(source, { bytes: Buffer.from(JSON.stringify(unapproved, null, 2) + '\n') })
  assert.equal(code(validateK1003K1004SourceDraft(draftBytes, before, after, bindingBytes)), 'E_REVIEW_HASH')
})

test('real private packet binds exact owner approvals without issuing or applying anything', async () => {
  const paths = ['lore/editorial/Seoul-Relocation-Ledger.json', 'lore/editorial/Seoul-Narrative-Review.json']
  const before = await Promise.all(paths.map(path => readFile(resolve(root, path))))
  const loaded = await loadK1003K1004Proposal(canonicalRoot)
  assert.deepEqual(validateStagedApproval(loaded.proposed, loaded.context), { ok: true, errors: [] })
  assert.deepEqual(validateStagedApproval(loaded.approved, loaded.context, loaded.proposed), { ok: true, errors: [] })
  assert.deepEqual(loaded.approved.personIds, ['K1003', 'K1004'])
  assert.equal(loaded.approved.application, null)
  const baseline = JSON.parse(loaded.context.baselineBytes)
  for (const set of ENTITY_SETS) assert.deepEqual(loaded.approved.originalEntitySets[set], baseline.currentEntitySets[set])
  const after = await Promise.all(paths.map(path => readFile(resolve(root, path))))
  after.forEach((bytes, index) => assert.deepEqual(bytes, before[index]))
  const rows = JSON.parse(after[0]).people
  const applied = new Set(JSON.parse(await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/applied-batches.json'))).batches.flatMap(b => b.personIds))
  for (const row of rows) {
    if (applied.has(row.personId)) assert.equal(row.status, 'applied', row.personId)
    else assert.equal(row.status === 'pending' && row.approval === null, true, row.personId)
  }
  assert.equal(JSON.stringify(packet), frozenBytes)
})

for (const [name, mutate, error] of [
  ['missing factual approval', p => p.approvals.shift(), 'E_APPROVAL_BATCH'],
  ['missing article approval', p => { p.approvals = p.approvals.filter(a => a.kind !== 'article-style') }, 'E_APPROVAL_BATCH'],
  ['missing card approval', p => { p.approvals = p.approvals.filter(a => a.kind !== 'card-style') }, 'E_APPROVAL_BATCH'],
  ['wrong approval kind', p => { p.approvals[0].kind = 'article-style' }, 'E_APPROVAL_KIND'],
  ['stale factual body', p => { p.bodies[0].body += '\n' }, 'E_APPROVAL_BATCH'],
  ['stale article body', p => { p.bodies[2].body += '\n' }, 'E_APPROVAL_BATCH'],
  ['stale card body', p => { p.bodies[3].body += '\n' }, 'E_APPROVAL_BATCH'],
  ['rehashed unapproved body', p => { p.bodies[0].body += '\n'; p.bodies[0].bodySha256 = sha256(p.bodies[0].body); p.approvals[0].bodySha256 = p.bodies[0].bodySha256 }, 'E_APPROVAL_BATCH'],
  ['stale approval hash', p => { p.approvals[0].bodySha256 = sha256('stale') }, 'E_APPROVAL_BATCH'],
  ['borrowed message', p => { p.approvals[0].messageRef = p.approvals[2].messageRef }, 'E_APPROVAL_BATCH'],
  ['empty message', p => { p.approvals[0].messageRef = '' }, 'E_APPROVAL_BATCH'],
  ['wrong proposal', p => { p.approvals[0].proposalId = 'other' }, 'E_APPROVAL_BATCH'],
  ['broadened approval people', p => { p.approvals[0].personIds.push('K1008') }, 'E_APPROVAL_BATCH'],
  ['broadened proposal people', p => p.personIds.push('K1008'), 'E_CENSUS_PERSON'],
  ['swapped fact precedence', p => { p.factPrecedence.superseding = 'facts-v1' }, 'E_APPROVAL_BATCH'],
  ['public visibility', p => { p.visibility = 'public' }, 'E_SCOPE_ADMISSION'],
  ['public active state', p => { p.state = 'active' }, 'E_SCOPE_PENDING'],
  ['partial shared-file activation', p => { p.documentPaths = ['lore/characters/Cast-Unaffiliated.json'] }, 'E_SCOPE_SHAPE'],
  ['publication claim', p => { p.publicationApproved = true }, 'E_SCOPE_SHAPE'],
  ['invented issuance', p => { p.issuedPlaceIds = ['place:new'] }, 'E_SCOPE_SHAPE'],
  ['application before transition', p => { p.application = {} }, 'E_SCOPE_PENDING'],
  ['duplicate approvals', p => p.approvals.push(clone(p.approvals[0])), 'E_APPROVAL_BATCH'],
]) test(`staged approval rejects ${name}`, () => {
  const proposal = clone(packet.approved)
  mutate(proposal)
  assert.equal(code(validateStagedApproval(proposal, packet.context, packet.proposed)), error)
})

for (const set of ENTITY_SETS) test(`staged approval preserves original exact ${set} set, not just its count`, () => {
  const proposal = clone(packet.approved)
  proposal.originalEntitySets[set][0] = 'invented:replacement'
  assert.equal(code(validateStagedApproval(proposal, packet.context, packet.proposed)), set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT')
})

test('stale baseline and missing or changed authority records fail closed', () => {
  const stale = clone(packet.context); stale.baselineBytes = Buffer.from('{}')
  assert.equal(code(validateStagedApproval(packet.proposed, stale)), 'E_ARCHIVE_HASH')
  for (const path of Object.keys(packet.context.evidenceBytes)) {
    const missing = clone(packet.context); delete missing.evidenceBytes[path]
    assert.equal(code(validateStagedApproval(packet.proposed, missing)), 'E_APPROVAL_BATCH')
    const changed = clone(packet.context); changed.evidenceBytes[path] = Buffer.from('changed')
    assert.equal(code(validateStagedApproval(packet.proposed, changed)), 'E_APPROVAL_BATCH')
  }
})

test('transitions cannot skip, repeat or reverse approval', () => {
  const applied = applicationFixture()
  for (const [proposal, previous] of [[packet.approved, null], [packet.approved, packet.approved],
    [packet.proposed, packet.approved], [applied.proposal, packet.proposed], [applied.proposal, applied.proposal]]) {
    assert.equal(code(validateStagedApproval(proposal, applied.context, previous)), 'E_SCOPE_PENDING')
  }
})

test('applied private receipt cannot authorize unrelated fixtures from mappings and review alone', () => {
  const { proposal, context, previous } = applicationFixture()
  const before = clone(context)
  assert.equal(code(validateStagedApproval(proposal, context, previous)), 'E_REVIEW_COVERAGE')
  assert.deepEqual(context, before)
  assert.equal(proposal.visibility, 'private')
  assert.equal(JSON.stringify(packet), frozenBytes)
})

test('stored application caller rejects preparation and unauthenticated fixture scope', async () => {
  assert.equal(code(await validateStoredStagedApplication(packet.approved, packet.context, packet.proposed, canonicalRoot)), 'E_SCOPE_PENDING')
  const fixture = applicationFixture()
  assert.equal(code(await validateStoredStagedApplication(fixture.proposal, fixture.context, fixture.previous, canonicalRoot)), 'E_REVIEW_COVERAGE')
})

for (const [name, mutate, error] of [
  ['missing extraction', f => { delete f.context.application }, 'E_SCOPE_SHAPE'],
  ['missing review', f => { delete f.context.application.review }, 'E_SCOPE_SHAPE'],
  ['missing before mapping', f => { delete f.proposal.application.mapping }, 'E_SCOPE_SHAPE'],
  ['missing original mapping', f => { delete f.proposal.application.originalMapping }, 'E_SCOPE_SHAPE'],
  ['shrunk before mapping', f => f.proposal.application.mapping.original.pop(), 'E_REVIEW_COVERAGE'],
  ['shrunk after mapping', f => f.proposal.application.mapping.current.pop(), 'E_REVIEW_COVERAGE'],
  ['stale original mapping', f => { f.proposal.application.originalMapping.original[0].sha256 = sha256('stale') }, 'E_REVIEW_COVERAGE'],
  ['unmapped new occurrence', f => f.context.application.after.leaves.push(['lore/new.json', '/text', null, 'ko', sha256('new')]), 'E_REVIEW_COVERAGE'],
  ['unmapped removed occurrence', f => f.context.application.after.leaves.pop(), 'E_REVIEW_COVERAGE'],
  ['missing category', f => { delete f.context.application.original.cards }, 'E_SCOPE_SHAPE'],
  ['self review', f => { f.context.application.review.reviewerRef = f.proposal.application.appliedBy; f.proposal.application.review = clone(f.context.application.review) }, 'E_REVIEW_HASH'],
  ['style approval as review', f => { f.context.application.review.kind = 'article-style' }, 'E_APPROVAL_KIND'],
  ['stale review receipt', f => { f.context.application.review.receiptSha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['stale review proposal', f => { f.context.application.review.proposalSha256 = sha256('stale') }, 'E_REVIEW_HASH'],
  ['review only claimed in receipt', f => { f.proposal.application.review.messageRef = 'forged' }, 'E_REVIEW_HASH'],
  ['application publication claim', f => { f.proposal.application.publicActive = true }, 'E_SCOPE_SHAPE'],
]) test(`application rejects ${name}`, () => {
  const fixture = applicationFixture()
  mutate(fixture)
  assert.equal(code(validateStagedApproval(fixture.proposal, fixture.context, fixture.previous)), error)
})

test('sealed history changes are rejected even with recomputed receipt indexes', () => {
  const fixture = applicationFixture()
  for (const name of ['original', 'before', 'after']) fixture.context.application[name].leaves[0][0] = 'vendor/issued-history/sealed.json'
  fixture.proposal.application.mapping = compareCensusCategories(fixture.context.application.before, fixture.context.application.after)
  fixture.proposal.application.originalMapping = compareCensusCategories(fixture.context.application.original, fixture.context.application.after)
  assert.equal(code(validateStagedApproval(fixture.proposal, fixture.context, fixture.previous)), 'E_ARCHIVE_HASH')
})
