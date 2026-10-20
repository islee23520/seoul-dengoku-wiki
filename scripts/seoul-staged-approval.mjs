import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { BASELINE_SHA256, ENTITY_SETS, proposalHash, sha256 } from './seoul-scope.mjs'
import { compareCensusCategories, extractCurrentCategories } from './seoul-census.mjs'

const evidenceRoot = '.omo/evidence/seoul-lock/'
const id = 'seoul-private:K1003:K1004:v1-v2'
const personIds = ['K1003', 'K1004']
const factMessage = 'question:call_XtARyy1du14qC4j7MMPlaXzb'
const styleMessage = 'question:call_O2vBRaRk6wWpFEElnoh4Tgmg'
const bindings = [
  { id: 'facts-v1', kind: 'batch-allocation', path: 'task-7-k1003-k1004-seoul-proposal-v1.md', bodySha256: '8c79885026e6308cfc56d74976e3ee07dcff354d9e66e1db307304ac1dfe518b', messageRef: factMessage },
  { id: 'facts-v2', kind: 'batch-allocation', path: 'task-7-k1003-k1004-seoul-proposal-v2.md', bodySha256: '84c40439ab9948cfb80e768865f1f0a48674c20fce2927080e7899796eaa6813', messageRef: factMessage },
  { id: 'article-v2', kind: 'article-style', path: 'task-7-k1003-k1004-style-sample-v2.md', marker: 'ARTICLE_KO_V2', bodySha256: '86b9a928db0f18fa557e1375962d0e1f1364dd0b99f609572a6847f644162a5c', messageRef: styleMessage },
  { id: 'card-v2', kind: 'card-style', path: 'task-7-k1003-k1004-style-sample-v2.md', marker: 'IYEN_CARD_KO_V2', bodySha256: '465f9cde88644e349734525550882c89afdc9b448243b6cbf33f6f06de43c54a', messageRef: styleMessage },
]
const evidenceHashes = {
  'task-7-k1003-k1004-owner-fact-approval.md': '9a894e0fea7b9b868d50cffc6f14d0b36359572f0c0289adf4c0256df8182314',
  'task-7-k1003-k1004-owner-style-approval.md': '1e4e951c98786627ffdf7f98a8cbc74d6e68153508fa640f27c2541c7d87bc1f',
}
const fail = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id) => { if (!condition) fail(code, path, id) }
const equal = (a, b) => proposalHash(a) === proposalHash(b)
const text = value => typeof value === 'string' && value.trim().length > 0
function shape(value, fields, path) {
  check(value && typeof value === 'object' && !Array.isArray(value)
    && equal(Object.keys(value), fields), 'E_SCOPE_SHAPE', path)
}
function exact(actual, expected, code, path) {
  check(Array.isArray(actual) && new Set(actual).size === actual.length
    && actual.length === expected.length && expected.every(value => actual.includes(value)), code, path)
}
function approval(binding) {
  return { kind: binding.kind, proposalId: id, personIds: [...personIds], bodyId: binding.id,
    bodySha256: binding.bodySha256, messageRef: binding.messageRef }
}
function content(proposal) {
  const { state, approvals, application, ...value } = proposal
  return value
}

// Validate the reviewed operation packet against actual source bytes. Comparing
// a caller's census mappings alone cannot establish an approved edit scope.
export function validateK1003K1004SourceDraft(draftBytes, beforeSources, afterSources, bindingBytes) {
  try {
    check(bindingBytes && sha256(bindingBytes) === '26822541cd62f14808d76be6aead98c21e46d3b4a8d291eadbc5e7608745f9d2', 'E_REVIEW_HASH', '/staged/sourceBinding')
    const binding = JSON.parse(Buffer.from(bindingBytes).toString())
    const paths = binding.inputBindings.sources.map(row => row.sourcePath)
    exact([...beforeSources.keys()], paths, 'E_REVIEW_COVERAGE', '/staged/sourcePaths')
    exact([...afterSources.keys()], paths, 'E_REVIEW_COVERAGE', '/staged/sourcePaths')
    for (const row of binding.inputBindings.sources) {
      check(sha256(beforeSources.get(row.sourcePath).bytes) === row.sha256, 'E_REVIEW_HASH', row.sourcePath)
    }
    const draftHash = sha256(draftBytes)
    check(['0f80e3b24f741ccf714624531771d7ac22120f24746ceb05d73bc5baf04623f4',
      'f76ddfa62865ce6672bb60f0d0800b4f4000cf5dbc8768ee8b3e912cd5b4df15'].includes(draftHash), 'E_APPROVAL_BATCH', '/staged/sourceDraft')
    const draft = JSON.parse(Buffer.from(draftBytes).toString())
    const combined = draftHash === 'f76ddfa62865ce6672bb60f0d0800b4f4000cf5dbc8768ee8b3e912cd5b4df15'
    if (combined) {
      exact(draft.sourceHashBindings.map(row => row.sourcePath), paths, 'E_REVIEW_COVERAGE', '/staged/sourcePaths')
      draft.sourcePreconditions = draft.sourceHashBindings.filter(row => row.changed).map(row => ({
        file: row.sourcePath, beforeFileSha256: row.beforeSha256, afterPrettyLfSha256: row.afterSha256,
      }))
    }
    exact([...afterSources.keys()], [...beforeSources.keys()], 'E_REVIEW_COVERAGE', '/staged/sourcePaths')
    const staged = new Map()
    for (const row of draft.sourcePreconditions) {
      const source = beforeSources.get(row.file)
      check(source && sha256(source.bytes) === row.beforeFileSha256, 'E_REVIEW_HASH', row.file)
      staged.set(row.file, JSON.parse(Buffer.from(source.bytes).toString()))
    }
    for (const operation of draft.operations) {
      const parts = operation.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
      let parent = staged.get(operation.file)
      for (const part of parts.slice(0, -1)) parent = parent[part]
      const key = parts.at(-1)
      check(sha256(JSON.stringify(operation.value)) === operation.afterValueSha256, 'E_REVIEW_HASH', operation.path)
      if (operation.op === 'replace') {
        check(sha256(JSON.stringify(parent[key])) === operation.beforeValueSha256, 'E_REVIEW_HASH', operation.path)
        parent[key] = operation.value
      } else {
        check(operation.op === 'add' && Array.isArray(parent), 'E_SCOPE_SHAPE', operation.path)
        parent.splice(Number(key), 0, operation.value)
      }
    }
    for (const [path, source] of beforeSources) {
      const after = afterSources.get(path)
      check(after?.bytes, 'E_REVIEW_COVERAGE', path)
      if (!staged.has(path)) check(sha256(after.bytes) === sha256(source.bytes), 'E_REVIEW_COVERAGE', path)
      else {
        const expected = draft.sourcePreconditions.find(row => row.file === path)
        if (combined) check(sha256(JSON.stringify(staged.get(path), null, 2) + '\n') === expected.afterPrettyLfSha256
          && sha256(after.bytes) === expected.afterPrettyLfSha256, 'E_REVIEW_HASH', path)
        else check(sha256(JSON.stringify(staged.get(path))) === expected.afterParsedJsonSha256
          && sha256(JSON.stringify(JSON.parse(Buffer.from(after.bytes).toString()))) === expected.afterParsedJsonSha256,
        'E_REVIEW_HASH', path)
      }
    }
    return { ok: true, errors: [] }
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/staged/sourceDraft', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id }] }
  }
}

// Deliberately bounded to this real owner-approved packet. New people, changed
// bodies or messages require a separately reviewed binding, not caller authority.
// This is a private receipt validator, never census admission or a source writer.
export function validateStagedApproval(proposal, context, previous = null) {
  try {
    check(sha256(context.baselineBytes) === BASELINE_SHA256, 'E_ARCHIVE_HASH', '/staged/baseline')
    const baseline = JSON.parse(Buffer.from(context.baselineBytes).toString())
    for (const [path, hash] of Object.entries(evidenceHashes)) {
      check(context.evidenceBytes[path] && sha256(context.evidenceBytes[path]) === hash, 'E_APPROVAL_BATCH', evidenceRoot + path)
    }
    function snapshot(value) {
      shape(value, ['schema', 'visibility', 'id', 'personIds', 'baselineSha256', 'originalEntitySets', 'factPrecedence', 'bodies', 'state', 'approvals', 'application'], '/staged')
      check(value.schema === 'seoul-staged-approval.v1' && value.visibility === 'private', 'E_SCOPE_ADMISSION', '/staged/visibility')
      check(['proposed', 'approved', 'applied'].includes(value.state), 'E_SCOPE_PENDING', '/staged/state')
      check(value.id === id, 'E_APPROVAL_BATCH', '/staged/id')
      exact(value.personIds, personIds, 'E_CENSUS_PERSON', '/staged/personIds')
      check(value.baselineSha256 === BASELINE_SHA256, 'E_ARCHIVE_HASH', '/staged/baselineSha256')
      shape(value.originalEntitySets, ENTITY_SETS, '/staged/originalEntitySets')
      for (const set of ENTITY_SETS) exact(value.originalEntitySets[set], baseline.currentEntitySets[set],
        set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/staged/originalEntitySets/${set}`)
      check(equal(value.factPrecedence, { superseding: 'facts-v2', superseded: 'facts-v1' }), 'E_APPROVAL_BATCH', '/staged/factPrecedence')
      exact(value.bodies.map(body => body.id), bindings.map(binding => binding.id), 'E_APPROVAL_BATCH', '/staged/bodies')
      for (const body of value.bodies) {
        shape(body, ['id', 'kind', 'body', 'bodySha256'], '/staged/bodies')
        const binding = bindings.find(row => row.id === body.id)
        check(body.kind === binding.kind, 'E_APPROVAL_KIND', '/staged/bodies', body.id)
        check(typeof body.body === 'string' && body.bodySha256 === binding.bodySha256
          && sha256(body.body) === binding.bodySha256, 'E_APPROVAL_BATCH', '/staged/bodySha256', body.id)
      }
      check(Array.isArray(value.approvals), 'E_SCOPE_SHAPE', '/staged/approvals')
      if (value.state === 'proposed') check(value.approvals.length === 0, 'E_APPROVAL_BATCH', '/staged/approvals')
      else {
        exact(value.approvals.map(row => row.bodyId), bindings.map(row => row.id), 'E_APPROVAL_BATCH', '/staged/approvals')
        for (const row of value.approvals) {
          const binding = bindings.find(binding => binding.id === row.bodyId)
          check(row.kind === binding.kind, 'E_APPROVAL_KIND', '/staged/approvals', row.bodyId)
          check(equal(row, approval(binding)), 'E_APPROVAL_BATCH', '/staged/approvals', row.bodyId)
        }
      }
      if (value.state !== 'applied') check(value.application === null, 'E_SCOPE_PENDING', '/staged/application')
    }
    snapshot(proposal)
    if (previous === null) check(proposal.state === 'proposed', 'E_SCOPE_PENDING', '/staged/transition')
    else {
      snapshot(previous)
      check((previous.state === 'proposed' && proposal.state === 'approved')
        || (previous.state === 'approved' && proposal.state === 'applied'), 'E_SCOPE_PENDING', '/staged/transition')
      check(equal(content(proposal), content(previous)), 'E_APPROVAL_BATCH', '/staged/transition/body')
    }
    if (proposal.state === 'applied') {
      // Context is independently extracted by the application caller. The receipt
      // cannot provide its own denominator or declare its own review authoritative.
      const { original, before, after, review } = context.application
      const receipt = proposal.application
      shape(receipt, ['appliedBy', 'mapping', 'originalMapping', 'review'], '/staged/application')
      const categories = ['leaves', 'blocks', 'headings', 'cards', 'markdown', 'lines']
      for (const [name, value] of Object.entries({ original, before, after })) shape(value, categories, `/staged/application/${name}`)
      const mapping = compareCensusCategories(before, after)
      const originalMapping = compareCensusCategories(original, after)
      check(mapping.exceptions.length > 0 && equal(receipt.mapping, mapping)
        && equal(receipt.originalMapping, originalMapping), 'E_REVIEW_COVERAGE', '/staged/application/mapping')
      for (const change of mapping.exceptions) for (const key of [...change.originalKeys, ...change.currentKeys]) {
        check(!JSON.parse(key)[0].startsWith('vendor/issued-history/'), 'E_ARCHIVE_HASH', '/staged/application/sealed')
      }
      shape(review, ['kind', 'proposalSha256', 'receiptSha256', 'reviewerRef', 'messageRef', 'evidencePath'], '/staged/application/review')
      check(review.kind === 'application-review', 'E_APPROVAL_KIND', '/staged/application/review')
      check(text(receipt.appliedBy) && text(review.reviewerRef) && review.reviewerRef !== receipt.appliedBy
        && text(review.messageRef) && typeof review.evidencePath === 'string' && review.evidencePath.startsWith(evidenceRoot)
        && review.proposalSha256 === proposalHash(content(proposal))
        && review.receiptSha256 === proposalHash({ appliedBy: receipt.appliedBy, mapping, originalMapping })
        && equal(receipt.review, review), 'E_REVIEW_HASH', '/staged/application/review')
      const { draftBytes, beforeSources, afterSources, bindingBytes } = context.application.sourceDraft ?? {}
      check(draftBytes && beforeSources instanceof Map && afterSources instanceof Map,
        'E_REVIEW_COVERAGE', '/staged/application/sourceDraft')
      const sourceResult = validateK1003K1004SourceDraft(draftBytes, beforeSources, afterSources, bindingBytes)
      if (!sourceResult.ok) fail(sourceResult.errors[0].code, sourceResult.errors[0].path, sourceResult.errors[0].id)
      const binding = JSON.parse(Buffer.from(bindingBytes).toString())
      for (const category of categories) check(sha256(JSON.stringify(original[category])) === binding.actualCalls.extractCurrentCategories.original[category],
        'E_REVIEW_COVERAGE', `/staged/application/original/${category}`)
      const normalized = sources => new Map([...sources].map(([path, source]) => {
        const bytes = Buffer.from(source.bytes)
        return [path, { bytes, sha256: sha256(bytes), value: path.endsWith('.json') ? JSON.parse(bytes.toString()) : null }]
      }))
      const extractedBefore = extractCurrentCategories(normalized(beforeSources), original)
      const extractedAfter = extractCurrentCategories(normalized(afterSources), original)
      for (const category of categories) check(sha256(JSON.stringify(before[category])) === sha256(JSON.stringify(extractedBefore[category]))
        && sha256(JSON.stringify(after[category])) === sha256(JSON.stringify(extractedAfter[category])),
      'E_REVIEW_COVERAGE', `/staged/application/${category}`)
    }
    return { ok: true, errors: [] }
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/staged', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id }] }
  }
}

// Application callers must authenticate a stored review, not just accept a
// reviewer name and an evidence-path prefix supplied in the receipt.
export async function validateStoredStagedApplication(proposal, context, previous, canonicalRoot) {
  const result = validateStagedApproval(proposal, context, previous)
  if (!result.ok) return result
  try {
    check(proposal.state === 'applied', 'E_SCOPE_PENDING', '/staged/application')
    const review = proposal.application.review
    check(/^\.omo\/evidence\/seoul-lock\/[a-z0-9-]+\.json$/.test(review.evidencePath),
      'E_REVIEW_HASH', '/staged/application/review/evidencePath')
    const stored = JSON.parse(await readFile(resolve(canonicalRoot, review.evidencePath), 'utf8'))
    check(equal(stored, review), 'E_REVIEW_HASH', '/staged/application/review/evidence')
    return result
  } catch (error) {
    if (error instanceof SyntaxError || error.code === 'ENOENT') return { ok: false, errors: [{ code: 'E_REVIEW_HASH', path: '/staged/application/review/evidence', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id }] }
  }
}

// Real private caller: reads canonical evidence and returns approved preparation,
// never an applied receipt. No lore, ledger, public output or issuance is written.
export async function loadK1003K1004Proposal(canonicalRoot) {
  const baselineBytes = await readFile(resolve(canonicalRoot, '.omo/private/seoul-migration/baseline.json'))
  check(sha256(baselineBytes) === BASELINE_SHA256, 'E_ARCHIVE_HASH', '/staged/baseline')
  const evidenceBytes = {}
  for (const path of Object.keys(evidenceHashes)) evidenceBytes[path] = await readFile(resolve(canonicalRoot, evidenceRoot, path))
  const bodies = []
  for (const binding of bindings) {
    const packet = await readFile(resolve(canonicalRoot, evidenceRoot, binding.path), 'utf8')
    let body = packet
    if (binding.marker) {
      const begin = `<!-- BEGIN ${binding.marker} -->\n`; const end = `<!-- END ${binding.marker} -->`
      check(packet.split(begin).length === 2 && packet.split(end).length === 2, 'E_APPROVAL_BATCH', binding.path)
      body = packet.slice(packet.indexOf(begin) + begin.length, packet.indexOf(end))
    }
    bodies.push({ id: binding.id, kind: binding.kind, body, bodySha256: binding.bodySha256 })
  }
  const proposed = { schema: 'seoul-staged-approval.v1', visibility: 'private', id, personIds: [...personIds], baselineSha256: BASELINE_SHA256,
    originalEntitySets: JSON.parse(baselineBytes).currentEntitySets, factPrecedence: { superseding: 'facts-v2', superseded: 'facts-v1' },
    bodies, state: 'proposed', approvals: [], application: null }
  const approved = { ...structuredClone(proposed), state: 'approved', approvals: bindings.map(approval) }
  const context = { baselineBytes, evidenceBytes }
  for (const result of [validateStagedApproval(proposed, context), validateStagedApproval(approved, context, proposed)]) {
    if (!result.ok) fail(result.errors[0].code, result.errors[0].path, result.errors[0].id)
  }
  return { proposed, approved, context }
}
