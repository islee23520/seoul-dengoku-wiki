import { createHash } from 'node:crypto'
import { isAuthenticatedPublicationReview } from './seoul-census.mjs'
import { validateNationalDressDocuments } from './national-dress-admission-successor.mjs'

export const SEOUL_SCOPE_SCHEMA = 'seoul-scope.v1'
export const BASELINE_SHA256 = '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223'
export const STAGING_GEOGRAPHY_SCHEMA = 'seoul-geography-staging.v1'
export const STAGING_GEOGRAPHY_PATH = 'lore/regions/seoul-electoral-titles.json'
export const TECHNICAL_DOCUMENT = Object.freeze({
  sourcePath: 'lore/name-pools/person-id-values-successor.mjs',
  currentSha256: 'c03d2abeaa83ab00912c13b68aa8c0acc6d0808e5b3af006ba706384e7b96b69',
  status: 'excluded', reviewReceipt: null, batchId: null,
  basis: 'Technical issuer note-successor verification only; no publication or factual approval; evidence=exact-code-successor; currentSha256=c03d2abeaa83ab00912c13b68aa8c0acc6d0808e5b3af006ba706384e7b96b69',
})

export function validateTechnicalDocumentCoverage(current, sourceHashes) {
  const rows = current.technicalDocuments ?? []
  if (rows.length > 1 || rows.some(row => JSON.stringify(row) !== JSON.stringify(TECHNICAL_DOCUMENT)
    || sourceHashes[row.sourcePath] !== row.currentSha256))
    throw Object.assign(new Error('E_REVIEW_HASH'), { code: 'E_REVIEW_HASH', path: '/current/technicalDocuments' })
  return rows
}
// A closed, owner-approved successor to Task 2, not a publication or rights grant.
export const KINGDOM_SUCCESSOR_BINDING = {
  schema: 'seoul-kingdom-successor.v1',
  batchId: 'kingdom-partition-6',
  previousSha256: 'a422097741d7da52e50b5774c0d47b79bc8fa5e43061c39535429cd8173ae0c1',
  beforeArchivePath: '.omo/private/seoul-migration/kingdom-partition-6/task2-before.json.gz.b64',
  proposal: { path: '.omo/private/seoul-migration/task-8-kingdom-partition-proposal.json', sha256: '8c64d3858c03dc5197eb5cfe0e802e8f41890e3754ba24cd8f22f5fa3c5854c4' },
  approval: { path: '.omo/private/seoul-migration/owner-approvals-20261015.json', sha256: 'bc3af8bb8f0b50436afc49a0153a510bbccb90ae872102bf1c3b950970013fb1' },
  partitionSha256: '0b2327e3f5e23a4dff539272a747357f4909970ec4fa9234a2386b4faec1ddf5',
  crossDistrictParentPolicy: 'empire-direct-geographic-parent-with-kingdom-map-membership',
}
// Independently reviewed task-2 inputs, not a denominator computed from new definitions.
export const STAGING_SOURCES = {
  membership: { path: 'data/geography/elections/sources/seoul-constituency-membership.json', sha256: '5c082aad68af1145dca138d8bf048a9b16e5a13b8618aa7c8c2e79bfc3db74f1' },
  census: { path: '.omo/private/seoul-migration/task-2-source-audit/correspondence-census.json', sha256: '6e278a5ba60ecb3660363bd9605dd436f17925f564fc943041954e5b4235ed94' },
  rights: { path: '.omo/private/seoul-migration/task-2-source-audit/existing-rights-inventory.json', sha256: '23551e091a271b6873739fa059da8c20d98d4c20c4ea69df230dcd0628f215ac' },
  spatial: { path: 'data/geography/elections/sources/seoul-sgis-20250630.json', sha256: '389b1eabee54cddc965dd523c3b831cdc60ea72d180cab908295c3359a8045ad' },
}
export const RANKS = ['barony', 'county', 'duchy', 'kingdom', 'empire']
export const ENTITY_SETS = ['persons', 'titles', 'holdings', 'grants', 'bindings', 'states', 'polities', 'events', 'relations', 'courts']
export const RELATION_COURT_DISPOSITION = Object.freeze({
  batchId: 'relation-court-current-66',
  receipt: { path: '.omo/private/seoul-migration/relation-court-disposition-application-20261018/owner-decision.json', sha256: '0029f6f01719cedf67899d8b9007e093025f60ba72baa978acdcbd3a25b723a9' },
  proposalHash: 'bbc3d45dd8abc9aff4e73fb265312cd31756079ef67324ad77800bd3b4385fe0',
  reviewJsonSha256: '77e3b6d16cf0238fd094a8f100eb7549cf7ded949b8d175b7a18858dd227b45a',
  reviewMarkdownSha256: 'e9f720b29a39c0b545aab32e646c5eddc8bef78ceb1f1c27ef7a36a932a3bb4c',
})
export const RELATION_COURT_BULK_RETIREMENT = Object.freeze({
  batchId: 'relation-court-bulk-retirement-1336',
  receipt: { path: '.omo/private/seoul-migration/relation-court-bulk-retirement-20261019/owner-decision.json', sha256: 'b82b8ed752a81e553da065a8c5e6d6e84b10162bc422f5769fbd7fa9258b8043' },
  messageRef: 'call_9ce4881273724b0fa95d2a0d',
  verbatim: '미결 처분: 일괄 종료',
  verbatimSha256: '293a2d64953162a8a8f2d363bc6260d5c8c7213518ee0877359dd8b16d8f1424',
  basis: 'authenticated owner bulk retirement; no current Seoul successor',
})
export const REPOSITORY_CONTROL_PATHS = Object.freeze([
  'AGENTS.md', 'lore/AGENTS.md', 'lore/bestiary/AGENTS.md', 'lore/characters/AGENTS.md',
  'lore/culture/AGENTS.md', 'lore/factions/AGENTS.md', 'lore/name-pools/AGENTS.md',
  'lore/places/AGENTS.md', 'lore/regions/AGENTS.md', 'CONTRIBUTING.md', 'DESIGN.md',
  'README.md', 'WORLD_BUILDING_GUIDE.md',
])
export const repositoryControl = path => REPOSITORY_CONTROL_PATHS.includes(path)
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const text = value => typeof value === 'string' && value.trim().length > 0
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const fail = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const requireValue = (condition, code, path, id) => { if (!condition) fail(code, path, id) }
const list = (value, path) => { requireValue(Array.isArray(value), 'E_SCOPE_SHAPE', path); return value }
const strings = (value, path) => { list(value, path); requireValue(value.every(text), 'E_SCOPE_SHAPE', path); return value }
function shape(value, fields, path) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), 'E_SCOPE_SHAPE', path)
  for (const key of Object.keys(value)) requireValue(fields.includes(key), 'E_SCOPE_SHAPE', `${path}/${key}`)
  for (const key of fields) requireValue(Object.hasOwn(value, key), 'E_SCOPE_SHAPE', `${path}/${key}`)
}
function unique(rows, key, path, code = 'E_SCOPE_ADMISSION') {
  const index = new Map()
  for (const row of rows) {
    const id = key(row)
    requireValue(text(id) && !index.has(id), code, path, id)
    index.set(id, row)
  }
  return index
}
function exact(actual, expected, code, path) {
  const a = unique(actual, x => x, path, code)
  const b = unique(expected, x => x, path, code)
  for (const id of b.keys()) requireValue(a.has(id), code, path, id)
  for (const id of a.keys()) requireValue(b.has(id), code, path, id)
}

// Proposal arrays are sets of ID/key-addressed records. Body bytes are never canonicalized.
export function canonicalProposal(value) {
  if (Array.isArray(value)) return value.map(canonicalProposal).sort((a, b) => {
    const key = x => JSON.stringify(x && typeof x === 'object' ? x.id ?? x.key ?? x : x)
    return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
  })
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalProposal(value[key])]))
  return value
}
export const proposalHash = value => sha256(JSON.stringify(canonicalProposal(value)))
export const coverageKey = row => JSON.stringify([row.sourcePath, row.jsonPointer, row.locale, row.originalSha256])

// This denominator includes unpublished, editorial, machine and sealed sources, never catalog admission.
export function baselineDocuments(baseline) {
  return baseline.files.filter(file => ['authored-doc', 'authored-lore', 'machine-source', 'snapshot-source', 'sealed-history'].includes(file.kind)
    || !file.path.includes('/') && /\.md$/.test(file.path)).map(file => file.path).sort()
}

// A changed current denominator requires the authenticated owner-approved map,
// never replacement of the independently archived original identity sets.
export function authenticateRightsTransition(baseline, proof, sourceHashes) {
  if (!proof) return { entitySets: baseline.currentEntitySets, dispositions: new Map(), retired: new Map() }
  shape(proof, ['approvalBody', 'receiptBody', 'sources'], '/rightsTransition')
  requireValue(sha256(proof.approvalBody) === '384a139fef7546027dcbb7237f31b59aca9cdc28d6033b59f43109bf2f2cf86d'
    && sha256(proof.receiptBody) === '7dcf7d3222b25c52a4cde3005051fe0930d1b95a3cb748877a004f66771244ee',
  'E_APPROVAL_BATCH', '/rightsTransition/approval')
  const approval = JSON.parse(proof.approvalBody)
  const targets = { ...baseline.currentEntitySets }
  const dispositions = new Map()
  const retired = new Map()
  exact(proof.sources.map(row => row.sourcePath), ['lore/relations/personal-holdings.json', 'lore/relations/opening-feudal-allocation.json'], 'E_CENSUS_RIGHT', '/rightsTransition/sources')
  const consumed = []
  for (const source of proof.sources) {
    shape(source, ['sourcePath', 'beforeBody', 'afterBody'], '/rightsTransition/sources')
    const existing = source.sourcePath.endsWith('/personal-holdings.json')
    const original = approval.originalSources[existing ? 'existing' : 'allocation']
    requireValue(sha256(source.beforeBody) === original.sha256 && sha256(source.afterBody) === sourceHashes[source.sourcePath],
      'E_REVIEW_HASH', '/rightsTransition/sources', source.sourcePath)
    const before = JSON.parse(source.beforeBody); const after = JSON.parse(source.afterBody)
    for (const field of existing ? ['holdings'] : ['titles', 'grants', 'existingTitleBindings']) {
      const set = field === 'existingTitleBindings' ? 'bindings' : field
      const id = row => set === 'bindings' ? JSON.stringify([row.holdingId, row.titleId]) : row.id
      exact(before[field].map(id), baseline.currentEntitySets[set], 'E_CENSUS_RIGHT', `/rightsTransition/original/${set}`)
      const successors = []
      for (const row of before[field]) {
        const approvalId = set === 'bindings' ? row.holdingId : row.id
        const oldId = id(row)
        const mapping = approval.records.find(r => r.set === field && r.oldId === approvalId)
        requireValue(mapping?.sourceValueSha256 === sha256(JSON.stringify(row)), 'E_CENSUS_RIGHT', '/rightsTransition/disposition', oldId)
        consumed.push(JSON.stringify([field, approvalId]))
        if (mapping.disposition === 'retired-current') {
          requireValue(['titles', 'grants'].includes(set) && mapping.currentId === null && mapping.current === undefined,
            'E_CENSUS_RIGHT', '/rightsTransition/retirement', oldId)
          retired.set(JSON.stringify([set, oldId]), mapping)
        } else {
          const successor = mapping.current ?? row
          const targetId = id(successor)
          requireValue(!dispositions.has(JSON.stringify([set, oldId])), 'E_CENSUS_RIGHT', '/rightsTransition/disposition', oldId)
          dispositions.set(JSON.stringify([set, oldId]), { disposition: mapping.disposition, targetId })
          successors.push(successor)
        }
      }
      requireValue(JSON.stringify(after[field]) === JSON.stringify(successors), 'E_CENSUS_RIGHT', `/rightsTransition/current/${set}`)
      targets[set] = successors.map(id)
    }
    if (existing) requireValue(JSON.stringify(after.polities) === JSON.stringify(approval.polities), 'E_CENSUS_RIGHT', '/rightsTransition/polities')
    else {
      const political = before.titles.filter(title => approval.records.some(row => row.set === 'titles' && row.oldId === title.id && row.disposition === 'retired-current')).map(title => ({
        id: title.id, kind: 'nonterritorial-political-identity', rank: title.rank, holderPersonId: title.holderPersonId,
        stateId: title.stateId, politicalParentTitleId: title.parentTitleId ?? null,
        personalLieges: before.grants.filter(grant => grant.titleId === title.id).map(grant => ({ holdingId: grant.id, directLiegePersonId: grant.directLiegePersonId })), directOwnership: false,
      }))
      requireValue(JSON.stringify(after.politicalIdentities) === JSON.stringify(political), 'E_CENSUS_RIGHT', '/rightsTransition/politicalIdentities')
    }
  }
  exact(consumed, approval.records.map(row => JSON.stringify([row.set, row.oldId])), 'E_CENSUS_RIGHT', '/rightsTransition/dispositions')
  requireValue(retired.size === 306
    && [...retired].filter(([key]) => JSON.parse(key)[0] === 'titles').length === 158
    && [...retired].filter(([key]) => JSON.parse(key)[0] === 'grants').length === 148,
  'E_CENSUS_RIGHT', '/rightsTransition/retirements')
  return { entitySets: targets, dispositions, retired }
}

export function rightsTransitionTargets(baseline, proof, sourceHashes) {
  return authenticateRightsTransition(baseline, proof, sourceHashes).entitySets
}

export function materializeRetiredRightsDispositions(contract, baseline, proof, sourceHashes) {
  const transition = authenticateRightsTransition(baseline, proof, sourceHashes)
  const materialized = structuredClone(contract)
  const rows = new Map(materialized.dispositions.map(row => [JSON.stringify([row.set, row.id]), row]))
  requireValue(rows.size === materialized.dispositions.length, 'E_CENSUS_RIGHT', '/dispositions')
  for (const [key] of transition.retired) {
    const row = rows.get(key)
    requireValue(row, 'E_CENSUS_RIGHT', '/dispositions/retirement', key)
    const pending = row.status === 'pending' && row.targetIds.length === 0 && row.batchId === null && row.basis === null
    const retired = row.status === 'retired' && row.targetIds.length === 0 && row.batchId === 'approved-rights-transition'
      && row.basis === 'authenticated retired-current mapping; no current Seoul successor'
    requireValue(pending || retired, 'E_CENSUS_RIGHT', '/dispositions/retirement', row.id)
    Object.assign(row, { status: 'retired', targetIds: [], batchId: 'approved-rights-transition',
      basis: 'authenticated retired-current mapping; no current Seoul successor' })
  }
  const approved = [
    ['titles', 'title:kingdom-daejeon'],
    ['bindings', JSON.stringify(['holding:daejeon-dong', 'title:duchy-gu-30110-polity-daejeon'])],
    ['bindings', JSON.stringify(['holding:daejeon-yuseong', 'title:duchy-gu-30200-polity-daejeon'])],
    ['bindings', JSON.stringify(['holding:daejeon-jung', 'title:duchy-gu-30140-polity-daejeon'])],
    ['bindings', JSON.stringify(['holding:daejeon-seo', 'title:duchy-gu-30170-polity-daejeon'])],
    ['bindings', JSON.stringify(['holding:daejeon-daedeok', 'title:duchy-gu-30230-polity-daejeon'])],
    ['bindings', JSON.stringify(['holding:yangcheon', 'title:duchy-gu-11470-S01'])],
    ['bindings', JSON.stringify(['holding:yangpyeong2', 'title:barony-holding-yangpyeong2-S01'])],
  ].map(([set, id]) => JSON.stringify([set, id]))
  const approvedKeys = new Set(approved)
  for (const key of approved) {
    const row = rows.get(key)
    const disposition = transition.dispositions.get(key)
    requireValue(row && disposition && !transition.retired.has(key), 'E_CENSUS_RIGHT', '/dispositions/activation', key)
    const matches = transition.entitySets[row.set].filter(id => id === disposition.targetId)
    requireValue(matches.length === 1, 'E_CENSUS_RIGHT', '/dispositions/activation', row.id)
    const basis = `authenticated ${disposition.disposition} current mapping`
    const pending = row.status === 'pending' && row.targetIds.length === 0 && row.batchId === null && row.basis === null
    const active = row.status === 'active' && JSON.stringify(row.targetIds) === JSON.stringify([disposition.targetId])
      && row.batchId === 'approved-rights-transition' && row.basis === basis
    requireValue(pending || active, 'E_CENSUS_RIGHT', '/dispositions/activation', row.id)
    Object.assign(row, { status: 'active', targetIds: [disposition.targetId], batchId: 'approved-rights-transition', basis })
  }
  for (const row of materialized.dispositions) if (row.batchId === 'approved-rights-transition' && row.status === 'active') {
    requireValue(approvedKeys.has(JSON.stringify([row.set, row.id])), 'E_CENSUS_RIGHT', '/dispositions/activation', row.id)
  }
  return materialized
}

const jsonPointer = (value, pointer) => pointer.slice(1).split('/').reduce((current, key) => current?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], value)

export function materializeRelationCourtDispositions(contract, proof, sourceHashes) {
  shape(proof, ['receiptBody', 'manifestBody', 'reviewJsonBody', 'reviewMarkdownBody', 'parts', 'sources'], '/relationCourtDisposition')
  requireValue(sha256(proof.receiptBody) === RELATION_COURT_DISPOSITION.receipt.sha256,
    'E_APPROVAL_BATCH', RELATION_COURT_DISPOSITION.receipt.path)
  const receipt = JSON.parse(proof.receiptBody)
  requireValue(receipt.schema === 'relation-court-disposition-owner-decision.v1' && receipt.immutable === true
    && receipt.ownerApproved === true && receipt.applicationScope === 'exact-66-same-id-current-dispositions-only'
    && receipt.ownerDecision.messageRef === 'call_K9pNuYfhcJuFX5QhkjbsUCHC'
    && receipt.ownerDecision.verbatim === '관계·궁정: 66건 현재 유지 (Recommended)'
    && sha256(receipt.ownerDecision.verbatim) === receipt.ownerDecision.verbatimSha256
    && receipt.proposal.canonicalProposalSha256 === RELATION_COURT_DISPOSITION.proposalHash
    && receipt.decision.batchId === RELATION_COURT_DISPOSITION.batchId
    && receipt.decision.status === 'active' && receipt.decision.targetPolicy === 'same-original-id'
    && receipt.remainingPending.relations === 1335 && JSON.stringify(receipt.remainingPending.courts) === JSON.stringify(['court:K1008'])
    && JSON.stringify(receipt.remainingPending.events) === JSON.stringify(['E:2030년-대정전-발발'])
    && receipt.remainingPending.ownerApproved === false,
  'E_APPROVAL_BATCH', '/relationCourtDisposition/receipt')
  requireValue(sha256(proof.manifestBody) === receipt.proposal.manifest.sha256
    && sha256(proof.reviewJsonBody) === RELATION_COURT_DISPOSITION.reviewJsonSha256
    && sha256(proof.reviewMarkdownBody) === RELATION_COURT_DISPOSITION.reviewMarkdownSha256,
  'E_REVIEW_HASH', '/relationCourtDisposition/review')
  const manifest = JSON.parse(proof.manifestBody); const review = JSON.parse(proof.reviewJsonBody)
  requireValue(manifest.ownerApproved === false && manifest.approvalReceipt === null && manifest.application === false
    && manifest.proposalHash === RELATION_COURT_DISPOSITION.proposalHash
    && review.verdict === 'APPROVE' && review.readyForOwnerReview === true
    && review.proposalHash === RELATION_COURT_DISPOSITION.proposalHash
    && review.authorityState.ownerApproved === false && review.authorityState.approvalReceipt === null && review.authorityState.application === false,
  'E_APPROVAL_BATCH', '/relationCourtDisposition/candidateAuthority')
  exact(proof.parts.map(row => row.path), receipt.proposal.parts.map(row => row.path), 'E_APPROVAL_BATCH', '/relationCourtDisposition/parts')
  const proposalParts = []
  for (const binding of receipt.proposal.parts) {
    const supplied = proof.parts.find(row => row.path === binding.path)
    shape(supplied, ['path', 'body'], '/relationCourtDisposition/parts')
    requireValue(sha256(supplied.body) === binding.sha256, 'E_REVIEW_HASH', binding.path)
    const part = JSON.parse(supplied.body)
    requireValue(part.ownerApproved === false && part.approvalReceipt === null && part.application === false,
      'E_APPROVAL_BATCH', binding.path)
    proposalParts.push(part)
  }
  exact(proof.sources.map(row => row.path), Object.values(receipt.sourceBindings).map(row => row.path), 'E_REVIEW_HASH', '/relationCourtDisposition/sources')
  const sources = new Map()
  for (const binding of Object.values(receipt.sourceBindings)) {
    const supplied = proof.sources.find(row => row.path === binding.path)
    shape(supplied, ['path', 'body'], '/relationCourtDisposition/sources')
    requireValue(sha256(supplied.body) === binding.sha256 && sourceHashes[binding.path] === binding.sha256,
      'E_REVIEW_HASH', binding.path)
    sources.set(binding.path, JSON.parse(supplied.body))
  }
  const relationRows = proposalParts.slice(0, 3).flatMap(part => part.rows)
  const courtRows = proposalParts[3].rows
  const payload = { schema: 'relation-court-disposition-owner-review.v1', ownerApproved: false, approvalReceipt: null,
    denominator: {
      relations: { count: 1388, identitySetSha256: review.baseline.relationIdentitySetSha256, ids: relationRows.map(row => row.id) },
      courts: { count: 14, identitySetSha256: review.baseline.courtIdentitySetSha256, ids: courtRows.map(row => row.id) },
    },
    relations: relationRows.map(row => ({ set: 'relations', id: row.id, mappingChoice: row.currentSemanticMapping,
      archiveRecordSha256: row.archiveRecordSha256, currentRecordSha256: row.currentRecordSha256,
      evidence: row.evidence.map(evidence => ({ kind: evidence.kind, jsonPointer: evidence.jsonPointer,
        recordSha256: evidence.recordSha256, approvalRef: evidence.approvalRef })) })),
    courts: courtRows.map(row => ({ set: 'courts', id: row.id, mappingChoice: row.currentSemanticMapping,
      archiveRecordSha256: row.archiveRecordSha256, currentRecordSha256: row.currentRecordSha256,
      evidence: row.evidence.map(evidence => ({ kind: evidence.kind, jsonPointer: evidence.jsonPointer,
        recordSha256: evidence.recordSha256, approvalRef: evidence.approvalRef })) })),
  }
  requireValue(proposalHash(payload) === RELATION_COURT_DISPOSITION.proposalHash,
    'E_APPROVAL_BATCH', '/relationCourtDisposition/proposalHash')
  const selected = { relations: [], courts: [] }
  for (const [set, rows, sourcePath] of [['relations', relationRows, receipt.sourceBindings.relations.path], ['courts', courtRows, receipt.sourceBindings.courts.path]]) {
    for (const row of rows) {
      const current = jsonPointer(sources.get(sourcePath), row.currentPointer)
      requireValue(current !== undefined && sha256(JSON.stringify(current)) === row.currentRecordSha256,
        'E_REVIEW_HASH', sourcePath, row.id)
      const mapping = row.currentSemanticMapping
      if (mapping.status === 'proposed-same-current') {
        requireValue(mapping.ownerApproved === false && JSON.stringify(mapping.targetIds) === JSON.stringify([row.id]),
          'E_APPROVAL_BATCH', '/relationCourtDisposition/target', row.id)
        selected[set].push(row.id)
      } else requireValue(mapping.status === 'unresolved' && mapping.ownerApproved === false && mapping.targetIds.length === 0,
        'E_APPROVAL_BATCH', '/relationCourtDisposition/unresolved', row.id)
    }
  }
  for (const set of ['relations', 'courts']) {
    const decision = receipt.decision[set]
    requireValue(decision.count === selected[set].length && sha256(JSON.stringify(decision.ids)) === decision.identitySetSha256,
      'E_APPROVAL_BATCH', `/relationCourtDisposition/decision/${set}`)
    exact(decision.ids, selected[set], 'E_APPROVAL_BATCH', `/relationCourtDisposition/decision/${set}`)
  }
  requireValue(selected.relations.length === 53 && selected.courts.length === 13,
    'E_APPROVAL_BATCH', '/relationCourtDisposition/decision')
  const approved = new Set([...selected.relations.map(id => JSON.stringify(['relations', id])), ...selected.courts.map(id => JSON.stringify(['courts', id]))])
  const materialized = structuredClone(contract)
  const rows = new Map(materialized.dispositions.map(row => [JSON.stringify([row.set, row.id]), row]))
  for (const key of approved) {
    const row = rows.get(key); const [, id] = JSON.parse(key)
    requireValue(row, 'E_CENSUS_RIGHT', '/dispositions/relationCourt', id)
    const pending = row.status === 'pending' && row.targetIds.length === 0 && row.batchId === null && row.basis === null
    const active = row.status === 'active' && JSON.stringify(row.targetIds) === JSON.stringify([row.id])
      && row.batchId === receipt.decision.batchId && row.basis === receipt.decision.basis
    requireValue(pending || active, 'E_CENSUS_RIGHT', '/dispositions/relationCourt', row.id)
    Object.assign(row, { status: 'active', targetIds: [row.id], batchId: receipt.decision.batchId, basis: receipt.decision.basis })
  }
  for (const row of materialized.dispositions) if (row.batchId === receipt.decision.batchId) {
    requireValue(approved.has(JSON.stringify([row.set, row.id])) && row.status === 'active'
      && JSON.stringify(row.targetIds) === JSON.stringify([row.id]) && row.basis === receipt.decision.basis,
    'E_CENSUS_RIGHT', '/dispositions/relationCourt', row.id)
  }
  return materialized
}

export function materializeRelationCourtBulkRetirement(contract, receiptBody) {
  requireValue(sha256(receiptBody) === RELATION_COURT_BULK_RETIREMENT.receipt.sha256,
    'E_APPROVAL_BATCH', RELATION_COURT_BULK_RETIREMENT.receipt.path)
  const receipt = JSON.parse(receiptBody)
  requireValue(receipt.schema === 'relation-court-bulk-retirement-owner-decision.v1'
    && receipt.immutable === true && receipt.ownerApproved === true
    && receipt.applicationScope === 'all-remaining-pending-relation-and-court-dispositions-only'
    && receipt.ownerDecision.messageRef === RELATION_COURT_BULK_RETIREMENT.messageRef
    && receipt.ownerDecision.verbatim === RELATION_COURT_BULK_RETIREMENT.verbatim
    && receipt.ownerDecision.verbatimSha256 === RELATION_COURT_BULK_RETIREMENT.verbatimSha256
    && sha256(receipt.ownerDecision.verbatim) === receipt.ownerDecision.verbatimSha256
    && receipt.ownerDecision.decidedAt === '2026-10-19'
    && receipt.decision.status === 'retired'
    && receipt.decision.targetPolicy === 'no-current-seoul-successor'
    && receipt.decision.batchId === RELATION_COURT_BULK_RETIREMENT.batchId
    && receipt.decision.basis === RELATION_COURT_BULK_RETIREMENT.basis
    && receipt.decision.sets.relations === 1335
    && JSON.stringify(receipt.decision.sets.courts) === JSON.stringify(['court:K1008'])
    && receipt.preserve.activeBatchId === RELATION_COURT_DISPOSITION.batchId
    && receipt.preserve.activeRelations === 53 && receipt.preserve.activeCourts === 13
    && receipt.preserve.pendingSet === 'events' && receipt.preserve.pendingEvents === 133,
  'E_APPROVAL_BATCH', '/relationCourtBulkRetirement/receipt')
  const materialized = structuredClone(contract)
  const alreadyRetired = materialized.dispositions.filter(row => row.batchId === RELATION_COURT_BULK_RETIREMENT.batchId)
  const pending = materialized.dispositions.filter(row => ['relations', 'courts'].includes(row.set)
    && row.status === 'pending' && row.targetIds.length === 0 && row.batchId === null && row.basis === null)
  const candidates = pending.length ? pending : alreadyRetired
  requireValue(candidates.filter(row => row.set === 'relations').length === 1335
    && new Set(candidates.filter(row => row.set === 'relations').map(row => row.id)).size === 1335,
  'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/relations')
  requireValue(JSON.stringify(candidates.filter(row => row.set === 'courts').map(row => row.id)) === JSON.stringify(receipt.decision.sets.courts),
    'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/courts')
  const approved = new Set(candidates.map(row => JSON.stringify([row.set, row.id])))
  for (const row of materialized.dispositions) {
    const key = JSON.stringify([row.set, row.id])
    if (approved.has(key)) {
      const pendingRow = row.status === 'pending' && row.targetIds.length === 0 && row.batchId === null && row.basis === null
      const retired = row.status === 'retired' && row.targetIds.length === 0
        && row.batchId === RELATION_COURT_BULK_RETIREMENT.batchId && row.basis === RELATION_COURT_BULK_RETIREMENT.basis
      requireValue(pendingRow || retired, 'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/exactSet', row.id)
      Object.assign(row, { status: 'retired', targetIds: [], batchId: RELATION_COURT_BULK_RETIREMENT.batchId,
        basis: RELATION_COURT_BULK_RETIREMENT.basis })
    } else requireValue(row.batchId !== RELATION_COURT_BULK_RETIREMENT.batchId,
      'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/exactSet', row.id)
  }
  requireValue(approved.size === 1336, 'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/exactSet')
  const active66 = materialized.dispositions.filter(row => row.batchId === RELATION_COURT_DISPOSITION.batchId)
  requireValue(active66.length === 66 && active66.every(row => row.status === 'active' && row.targetIds.length === 1 && row.targetIds[0] === row.id),
    'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/preserveActive')
  const eventRows = materialized.dispositions.filter(row => row.set === 'events')
  requireValue(eventRows.length === 191 && eventRows.every(row => row.status === 'pending'
    || row.status === 'active' && row.targetIds.length === 1 && row.targetIds[0] === row.id),
    'E_CENSUS_RIGHT', '/relationCourtBulkRetirement/preserveEvents')
  return materialized
}

export const selectedScopeRow = (row, mode, batchId) => mode === 'publication' && !['retired', 'control', 'excluded'].includes(row.status)
  || mode === 'migration' && row.batchId === batchId

function checkApproval(approval, kind, batchId, hash, path) {
  shape(approval, ['kind', 'batchId', 'bodySha256', 'messageRef'], path)
  requireValue(approval.kind === kind, 'E_APPROVAL_KIND', path, batchId)
  requireValue(approval.batchId === batchId && approval.bodySha256 === hash && digest(hash) && text(approval.messageRef), 'E_APPROVAL_BATCH', path, batchId)
}

// This version only represents private preparation. It has no ready/public state and
// cannot supply an approved parent or an active right by inference. A pinned official
// spatial edition is separate from current correspondence and final publication.
export function stagingGeography(facts, baseline, boundary) {
  shape(facts, ['schema', 'sources'], '/facts')
  requireValue(facts.schema === STAGING_GEOGRAPHY_SCHEMA, 'E_SCOPE_SHAPE', '/facts/schema')
  const hasSpatial = Object.hasOwn(facts.sources, 'spatial')
  shape(facts.sources, ['membership', 'census', 'rights', ...(hasSpatial ? ['spatial'] : [])], '/facts/sources')
  const inputs = {}
  const evidence = {}
  for (const [kind, source] of Object.entries(facts.sources)) {
    shape(source, ['path', 'sha256', 'body'], `/facts/sources/${kind}`)
    requireValue(text(source.path) && digest(source.sha256) && typeof source.body === 'string'
      && sha256(source.body) === source.sha256, 'E_SLOT_EDITION', `/facts/sources/${kind}`)
    try { inputs[kind] = JSON.parse(source.body) }
    catch { fail('E_SCOPE_SHAPE', `/facts/sources/${kind}/body`) }
    evidence[kind] = { path: source.path, sha256: source.sha256 }
  }
  const { membership, census, rights } = inputs
  requireValue(membership.schema === 'seoul-constituency-membership.v1'
    && census.schema === 'task-2-seoul-correspondence-census.v1'
    && rights.schema === 'task-2-existing-rights-audit.v1', 'E_SCOPE_SHAPE', '/facts/sources/schema')
  const sourceIndex = unique(list(membership.sources, '/facts/membership/sources'), row => row.id, '/facts/membership/sources', 'E_SCOPE_REF')
  for (const source of sourceIndex.values()) requireValue(digest(source.sha256) && text(source.role), 'E_SCOPE_SHAPE', '/facts/membership/sources', source.id)
  // All source references, including edition/bridge references, resolve by exact ID.
  function sourceRefs(value, key = '') {
    if (key === 'sourceRefs' || key.endsWith('SourceRefs') || key.endsWith('SourceRef')) {
      for (const id of Array.isArray(value) ? value : [value]) requireValue(sourceIndex.has(id), 'E_SCOPE_REF', '/facts/membership/sourceRefs', id)
    } else if (value && typeof value === 'object') for (const [child, row] of Object.entries(value)) sourceRefs(row, child)
  }
  sourceRefs(membership)
  const editions = membership.editions
  const editionIds = Object.values(editions).map(row => row.id)
  unique(editionIds, id => id, '/facts/editions', 'E_SLOT_EDITION')
  const lookup = sourceIndex.get(editions.currentCorrespondence.codeAndNameSourceRef)
  requireValue(lookup?.sha256 === boundary.sha256 && lookup.officialAuthority === false
    && membership.geometryVerified === false, 'E_SCOPE_GEOMETRY', '/facts/candidateGeometry')
  exact(membership.gu.map(g => JSON.stringify([g.guId, g.name, g.electoralDongCount, g.currentCorrespondenceCount])),
    census.guCounts.map(g => JSON.stringify([g.guId, g.gu, g.electoralVintageDongs, g.geometryRows])), 'E_SLOT_COVERAGE', '/facts/gu')
  const guIds = new Map(membership.gu.map(g => [g.name, g.guId]))
  exact(membership.constituencies.map(c => c.name), census.constituencies.map(c => c.name), 'E_SLOT_COVERAGE', '/facts/counties')
  exact(membership.constituencies.flatMap(c => c.electoralDongs.flatMap(d => d.currentCorrespondences.map(r =>
    JSON.stringify([c.name, d.guId, d.sourceName, d.fragmentId, r.candidateAdminId, r.candidateName])))),
  census.constituencies.flatMap(c => c.correspondences.flatMap(d => d.candidateAdminIds.map((id, i) =>
    JSON.stringify([c.name, guIds.get(d.gu), d.officialDong, d.fragmentId, id, d.candidateNames[i]])))), 'E_SLOT_COVERAGE', '/facts/membership')
  for (const set of ['titles', 'holdings', 'grants', 'bindings']) {
    exact(rights[set].map(row => set === 'bindings' ? JSON.stringify([row.original.holdingId, row.original.titleId]) : row.original.id),
      baseline.currentEntitySets[set], 'E_CENSUS_RIGHT', `/facts/rights/${set}`)
  }
  const rightIndex = unique([...rights.holdings, ...rights.grants], row => row.original.id, '/facts/rights', 'E_SCOPE_REF')
  const rightSources = unique(rights.sources, row => row.path, '/facts/rights/sources', 'E_SCOPE_REF')
  for (const right of rightIndex.values()) {
    const original = baseline.files.find(file => file.path === right.source.path)
    requireValue(original && rightSources.get(right.source.path)?.sha256 === original.sha256
      && right.source.recordSha256 === sha256(JSON.stringify(right.original)), 'E_ARCHIVE_HASH', '/facts/rights/source', right.original.id)
  }
  const countyRights = unique(rights.counties, row => row.name, '/facts/rights/counties', 'E_SCOPE_REF')
  exact([...countyRights.keys()], membership.constituencies.map(c => c.name), 'E_SLOT_COVERAGE', '/facts/rights/counties')
  const definition = (titleId, rank, name, jurisdictionRefs, sourcePointer, sourceRefs) => ({
    titleId, rank, name, jurisdictionRefs, sourcePointer, sourceRefs,
    feudalParentTitleId: null, feudalParentStatus: rank === 'empire' ? 'not-applicable' : 'pending',
  })
  const titles = [definition('geography:empire:seoul', 'empire', '서울특별시', membership.gu.map(g => g.guId), '/gu', editions.currentLaw.sourceRefs),
    ...membership.gu.map((g, i) => definition(`geography:duchy:${g.guId}`, 'duchy', g.name, [g.guId], `/gu/${i}`, g.sourceRefs))]
  const countySlots = []
  for (const [index, county] of membership.constituencies.entries()) {
    requireValue(county.sourceEdition === editions.electoral.id && county.membershipConfidence === 'primary-confirmed'
      && county.geometryVerified === false, 'E_SLOT_EDITION', '/facts/counties', county.constituencyId)
    exact(county.jurisdictionGuRefs, [...new Set(county.electoralDongs.map(d => d.guId))], 'E_TITLE_HIERARCHY', '/facts/jurisdictionGuRefs')
    const titleId = `geography:county:${county.constituencyId}`
    titles.push(definition(titleId, 'county', county.name, county.jurisdictionGuRefs, `/constituencies/${index}`, county.sourceRefs))
    const historic = countyRights.get(county.name)
    exact(historic.jurisdictionGuRefs, county.jurisdictionGuRefs, 'E_TITLE_HIERARCHY', '/facts/rights/jurisdictionGuRefs')
    const slots = county.electoralDongs.flatMap((dong, d) => dong.currentCorrespondences.map((row, r) => {
      requireValue(row.sourceEdition === editions.currentCorrespondence.id && row.geometryVerified === false
        && row.codeConfidence === 'dated-candidate-name-code-match' && dong.fragmentId === null,
      'E_SLOT_EDITION', '/facts/correspondence', row.candidateAdminId)
      const dongId = `region:${row.candidateAdminId}`
      const past = historic.dongs.find(item => item.dongId === dongId && item.fragmentId === dong.fragmentId)
      requireValue(past && past.officialElectoralDong === dong.sourceName, 'E_SCOPE_REF', '/facts/rights/dong', dongId)
      const historicalHoldingRefs = past.holdingRefs.map(id => {
        const right = rightIndex.get(id)
        requireValue(right && right.audit.category === 'direct-admin-property'
          && right.original.adminRefs.some(ref => ref.id.replace(/^region:/, '') === row.candidateAdminId), 'E_SCOPE_REF', '/facts/rights/holding', id)
        return { id, sourcePath: right.source.path, jsonPointer: right.source.pointer,
          sourceSha256: rightSources.get(right.source.path).sha256, recordSha256: right.source.recordSha256,
          scopeKind: 'historical-direct-admin-property', status: 'pending-new-seoul-correspondence' }
      })
      unique(historicalHoldingRefs, ref => ref.id, '/facts/rights/holding', 'E_SCOPE_REF')
      return { slotId: `slot:${dongId}`, dongId, name: row.candidateName, jurisdictionGuRef: dong.guId,
        electoralDongId: dong.electoralDongId, fragmentId: null, sourceEdition: row.sourceEdition,
        sourcePointer: `/constituencies/${index}/electoralDongs/${d}/currentCorrespondences/${r}`,
        sourceRefs: row.membershipSourceRefs, candidateGeometryRefs: [dongId], geometryRefs: [], geometryVerified: false,
        historicalHoldingRefs, holdingRefs: [], status: 'unassigned', holderPersonId: null }
    }))
    exact(historic.dongs.map(d => JSON.stringify([d.dongId, d.fragmentId])), slots.map(s => JSON.stringify([s.dongId, s.fragmentId])), 'E_SLOT_COVERAGE', '/facts/rights/dongs')
    countySlots.push({ countyTitleId: titleId, slots })
  }
  unique(titles, t => t.titleId, '/facts/titles', 'E_TITLE_HIERARCHY')
  unique(countySlots.flatMap(g => g.slots), s => s.slotId, '/facts/slots', 'E_SLOT_DUPLICATE')
  const geography = { schema: STAGING_GEOGRAPHY_SCHEMA, status: 'inspection-only', evidence, editions,
    sourceRecords: membership.sources.map(({ id, sha256, role }) => ({ id, sha256, role })),
    officialExtentStatus: 'unverified', kingdomStatus: 'pending', mapMinimumRank: 'county', mapTitleIds: [], titles, countySlots }
  if (hasSpatial) {
    const spatial = inputs.spatial
    requireValue(spatial.schema === 'seoul-sgis-spatial-edition.v1' && spatial.edition === 'sgis-20250630'
      && spatial.baseDate === '2025-06-30' && spatial.authority === 'official-SGIS-statistical-boundary'
      && spatial.legalSurveyCertification === false && spatial.current2026Geometry === false
      && spatial.membership.sha256 === evidence.membership.sha256
      && spatial.geometry.crs === 'OGC:CRS84' && digest(spatial.geometry.sha256), 'E_SLOT_EDITION', '/facts/spatial')
    const official = unique(spatial.dongs, row => row.electoralDongId, '/facts/spatial/dongs', 'E_SLOT_DUPLICATE')
    const officialCounties = unique(spatial.counties, row => row.geometryId, '/facts/spatial/counties', 'E_SLOT_DUPLICATE')
    exact([...official.keys()], membership.constituencies.flatMap(c => c.electoralDongs.map(d => d.electoralDongId)), 'E_SLOT_COVERAGE', '/facts/spatial/dongs')
    exact([...officialCounties.keys()], countySlots.map(c => c.countyTitleId), 'E_SLOT_COVERAGE', '/facts/spatial/counties')
    exact(spatial.gu.map(g => g.guId), membership.gu.map(g => g.guId), 'E_SLOT_COVERAGE', '/facts/spatial/gu')
    geography.spatialSource = { edition: spatial.edition, baseDate: spatial.baseDate,
      authority: spatial.authority, legalSurveyCertification: false, current2026Geometry: false,
      geometry: spatial.geometry, archiveSha256: spatial.archive.sha256 }
    geography.officialExtentStatus = 'verified-for-pinned-spatial-edition'
    geography.currentCorrespondenceSlots = countySlots
    geography.countySlots = membership.constituencies.map((county, index) => {
      const countyTitleId = `geography:county:${county.constituencyId}`
      const officialCounty = officialCounties.get(countyTitleId)
      exact(officialCounty.jurisdictionGuRefs, county.jurisdictionGuRefs, 'E_TITLE_HIERARCHY', '/facts/spatial/counties')
      const slots = county.electoralDongs.map((dong, d) => {
        const row = official.get(dong.electoralDongId)
        const dongId = dong.currentCorrespondences.length === 1 ? `region:${dong.currentCorrespondences[0].candidateAdminId}` : dong.electoralDongId
        requireValue(row.guId === dong.guId && row.dongId === dongId && row.countyTitleId === countyTitleId,
          'E_SLOT_EDITION', '/facts/spatial/dong', dong.electoralDongId)
        return { slotId: `slot:${dongId}`, dongId, name: row.officialName, jurisdictionGuRef: dong.guId,
          electoralDongId: dong.electoralDongId, fragmentId: null, sourceEdition: spatial.edition,
          sourcePointer: `/constituencies/${index}/electoralDongs/${d}`, sourceRefs: dong.membershipSourceRefs,
          geometryRefs: [row.geometryId], geometryVerified: true,
          currentCorrespondenceSlotIds: dong.currentCorrespondences.map(r => `slot:region:${r.candidateAdminId}`),
          historicalHoldingRefs: [], holdingRefs: [], status: 'unassigned', holderPersonId: null }
      })
      exact(officialCounty.officialDongCodes, county.electoralDongs.map(d => official.get(d.electoralDongId).officialCode), 'E_SLOT_COVERAGE', '/facts/spatial/county')
      return { countyTitleId, slots }
    })
    unique(geography.countySlots.flatMap(c => c.slots), s => s.slotId, '/facts/spatial/slots', 'E_SLOT_DUPLICATE')
  }
  return geography
}

export function approvedKingdomGeography(before, successor) {
  shape(successor, [...Object.keys(KINGDOM_SUCCESSOR_BINDING), 'partition'], '/geography/successor')
  for (const [key, value] of Object.entries(KINGDOM_SUCCESSOR_BINDING)) requireValue(
    JSON.stringify(successor[key]) === JSON.stringify(value), 'E_APPROVAL_BATCH', `/geography/successor/${key}`)
  requireValue(sha256(JSON.stringify(before, null, 2) + '\n') === successor.previousSha256,
    'E_REVIEW_HASH', '/geography/successor/previousSha256')
  requireValue(sha256(JSON.stringify(successor.partition)) === successor.partitionSha256,
    'E_KINGDOM_PARTITION', '/geography/successor/partition')
  const geography = structuredClone(before)
  const kingdoms = successor.partition
  exact(kingdoms.flatMap(k => k.jurisdictionRefs), before.titles.filter(t => t.rank === 'duchy').flatMap(t => t.jurisdictionRefs),
    'E_KINGDOM_PARTITION', '/geography/successor/districts')
  exact(kingdoms.flatMap(k => k.countyTitleIds), before.countySlots.map(c => c.countyTitleId),
    'E_KINGDOM_PARTITION', '/geography/successor/counties')
  for (const title of geography.titles) {
    if (title.rank === 'empire') continue
    const kingdom = kingdoms.find(k => title.rank === 'duchy' ? k.jurisdictionRefs.includes(title.jurisdictionRefs[0]) : k.countyTitleIds.includes(title.titleId))
    requireValue(title.jurisdictionRefs.every(ref => kingdom.jurisdictionRefs.includes(ref)), 'E_KINGDOM_PARTITION', '/geography/successor/parent', title.titleId)
    title.feudalParentTitleId = title.rank === 'duchy' ? kingdom.titleId
      : title.jurisdictionRefs.length === 1 ? `geography:duchy:${title.jurisdictionRefs[0]}` : 'geography:empire:seoul'
    title.feudalParentStatus = 'approved-geographic'
    if (title.rank === 'county' && title.jurisdictionRefs.length > 1) title.geographicParentException = 'cross-district-empire-direct'
  }
  geography.titles.push(...kingdoms.map((kingdom, index) => ({
    titleId: kingdom.titleId, rank: 'kingdom', name: kingdom.name, jurisdictionRefs: kingdom.jurisdictionRefs,
    sourcePointer: `/kingdoms/${index}`, sourceRefs: [`${successor.proposal.path}#/kingdoms/${index}`],
    feudalParentTitleId: 'geography:empire:seoul', feudalParentStatus: 'approved-geographic',
    countyTitleIds: kingdom.countyTitleIds, holderPersonId: null,
  })))
  geography.kingdomStatus = 'approved'
  geography.mapTitleIds = geography.titles.map(title => title.titleId)
  geography.successor = structuredClone(successor)
  return geography
}

// Task 3 projection of the authenticated Task 2 successor into the publication contract.
// It reads the recomputed geography, never the staged file bytes, and carries only the
// parents, slots and the one cross-district exception that the owner-approved successor
// already fixed. Ownership stays unassigned: this is geography, not a rights grant.
export const CROSS_DISTRICT_EXCEPTION = 'cross-district-empire-direct'
export function publicationGeography(authenticated) {
  requireValue(authenticated.kingdomStatus === 'approved' && Object.hasOwn(authenticated, 'successor'), 'E_SCOPE_PENDING', '/geography/kingdomStatus')
  requireValue(authenticated.officialExtentStatus === 'verified-for-pinned-spatial-edition' && authenticated.spatialSource,
    'E_SCOPE_PENDING', '/geography/officialExtentStatus')
  const spatial = authenticated.spatialSource
  requireValue(spatial.legalSurveyCertification === false && spatial.current2026Geometry === false, 'E_SLOT_EDITION', '/geography/spatialSource')
  const successor = authenticated.successor
  const titles = authenticated.titles.map(title => {
    requireValue(title.rank === 'empire' ? title.feudalParentTitleId === null && title.feudalParentStatus === 'not-applicable'
      : text(title.feudalParentTitleId) && title.feudalParentStatus === 'approved-geographic',
    'E_SCOPE_PENDING', '/geography/titles/feudalParentStatus', title.titleId)
    const basis = [`${title.rank} ${title.sourcePointer}`, `sourceRefs=${title.sourceRefs.join(',')}`,
      title.rank === 'empire' ? 'feudalParent=not-applicable' : `feudalParent=${title.feudalParentStatus}:${successor.batchId}`,
      ...(Object.hasOwn(title, 'geographicParentException') ? [`exception=${title.geographicParentException}:${successor.crossDistrictParentPolicy}`] : [])].join('; ')
    return { titleId: title.titleId, rank: title.rank, parentTitleId: title.feudalParentTitleId, jurisdictionRefs: [...title.jurisdictionRefs], basis }
  })
  const parentExceptions = authenticated.titles.filter(title => Object.hasOwn(title, 'geographicParentException')).map(title => {
    const kingdoms = successor.partition.filter(kingdom => kingdom.countyTitleIds.includes(title.titleId))
    requireValue(title.rank === 'county' && title.geographicParentException === CROSS_DISTRICT_EXCEPTION && title.jurisdictionRefs.length > 1
      && title.feudalParentTitleId === 'geography:empire:seoul' && kingdoms.length === 1
      && title.jurisdictionRefs.every(ref => kingdoms[0].jurisdictionRefs.includes(ref)),
    'E_TITLE_HIERARCHY', '/geography/parentExceptions', title.titleId)
    return { titleId: title.titleId, policy: successor.crossDistrictParentPolicy, parentTitleId: title.feudalParentTitleId, kingdomTitleId: kingdoms[0].titleId }
  })
  const countySlots = authenticated.countySlots.map(group => ({ countyTitleId: group.countyTitleId, slots: group.slots.map(slot => {
    requireValue(slot.sourceEdition === spatial.edition && slot.geometryVerified === true, 'E_SLOT_EDITION', '/geography/slots', slot.slotId)
    return { slotId: slot.slotId, dongId: slot.dongId, fragmentId: slot.fragmentId, sourceEdition: slot.sourceEdition,
      geometryRefs: [...slot.geometryRefs], holdingRefs: [...slot.holdingRefs], status: slot.status, holderPersonId: slot.holderPersonId }
  }) }))
  const facts = { sourceEdition: spatial.edition,
    counties: authenticated.countySlots.map(group => ({ titleId: group.countyTitleId,
      districtRefs: [...authenticated.titles.find(title => title.titleId === group.countyTitleId).jurisdictionRefs],
      parts: group.slots.map(slot => ({ dongId: slot.dongId, fragmentId: slot.fragmentId, geometryRefs: [...slot.geometryRefs] })) })),
    districtRefs: [...authenticated.titles.find(title => title.rank === 'empire').jurisdictionRefs],
    dongRefs: authenticated.countySlots.flatMap(group => group.slots.map(slot => slot.dongId)) }
  return { geography: { sourceEdition: spatial.edition, titles, countySlots, kingdomStatus: authenticated.kingdomStatus,
    mapMinimumRank: authenticated.mapMinimumRank, mapTitleIds: [...authenticated.mapTitleIds], parentExceptions }, facts }
}

// Inspection admits the private stage as it stands and returns null. Any other mode
// consumes only the authenticated recomputation projected into the publication contract.
export function checkStagingGeography(geography, facts, input, mode) {
  const original = stagingGeography(facts, input.baseline, input.boundary)
  const expected = Object.hasOwn(geography, 'successor') ? approvedKingdomGeography(original, geography.successor) : original
  // Exact nested shapes: no unchecked metadata, approval fields, invented parents or holders.
  function compare(actual, source, path) {
    if (Array.isArray(source)) {
      list(actual, path)
      requireValue(actual.length === source.length, 'E_SLOT_COVERAGE', path)
      source.forEach((row, i) => compare(actual[i], row, `${path}/${i}`))
    } else if (source && typeof source === 'object') {
      shape(actual, Object.keys(source), path)
      for (const key of Object.keys(source)) compare(actual[key], source[key], `${path}/${key}`)
    } else requireValue(actual === source, 'E_SLOT_EDITION', path)
  }
  compare(geography, expected, '/geography')
  for (const slot of (geography.currentCorrespondenceSlots ?? geography.countySlots).flatMap(group => group.slots)) {
    const ref = input.refs.find(row => row.id === slot.dongId)
    requireValue(ref?.kind === 'region' && ref.inside === true && ref.boundarySha256 === input.boundary.sha256,
      'E_SCOPE_REF', '/geography/candidateGeometryRefs', slot.dongId)
  }
  return mode === 'inspection' ? null : publicationGeography(expected)
}

function checkGeography(geography, facts, resolveRef, final, people, resolveHolding) {
  shape(geography, ['sourceEdition', 'titles', 'countySlots', 'kingdomStatus', 'mapMinimumRank', 'mapTitleIds', 'parentExceptions'], '/geography')
  shape(facts, ['sourceEdition', 'counties', 'districtRefs', 'dongRefs'], '/facts')
  requireValue(geography.sourceEdition === facts.sourceEdition, 'E_SLOT_EDITION', '/geography/sourceEdition')
  const titles = unique(list(geography.titles, '/geography/titles'), t => t.titleId, '/geography/titles', 'E_TITLE_HIERARCHY')
  // The only approved rank skip: a county spanning several districts is the empire's direct
  // geographic child and keeps its approved kingdom map membership. No other skip exists.
  const exceptions = unique(list(geography.parentExceptions, '/geography/parentExceptions'), row => row.titleId, '/geography/parentExceptions', 'E_TITLE_HIERARCHY')
  for (const row of exceptions.values()) {
    shape(row, ['titleId', 'policy', 'parentTitleId', 'kingdomTitleId'], '/geography/parentExceptions')
    requireValue(row.policy === KINGDOM_SUCCESSOR_BINDING.crossDistrictParentPolicy, 'E_TITLE_HIERARCHY', '/geography/parentExceptions/policy', row.titleId)
  }
  for (const title of titles.values()) {
    shape(title, ['titleId', 'rank', 'parentTitleId', 'jurisdictionRefs', 'basis'], '/geography/titles')
    requireValue(RANKS.includes(title.rank) && text(title.basis), 'E_TITLE_HIERARCHY', '/geography/titles', title.titleId)
    const refs = strings(title.jurisdictionRefs, '/geography/jurisdictionRefs')
    requireValue(refs.length > 0, 'E_TITLE_HIERARCHY', '/geography/jurisdictionRefs', title.titleId)
    refs.forEach(ref => resolveRef(ref, '/geography/jurisdictionRefs', title.titleId))
    if (title.rank === 'empire') requireValue(title.parentTitleId === null, 'E_TITLE_HIERARCHY', '/geography/parentTitleId', title.titleId)
    else {
      const parent = titles.get(title.parentTitleId)
      const exception = exceptions.get(title.titleId)
      if (exception) requireValue(title.rank === 'county' && parent?.rank === 'empire' && exception.parentTitleId === title.parentTitleId
        && title.jurisdictionRefs.length > 1, 'E_TITLE_HIERARCHY', '/geography/parentExceptions', title.titleId)
      else requireValue(parent && RANKS.indexOf(parent.rank) === RANKS.indexOf(title.rank) + 1,
        'E_TITLE_HIERARCHY', '/geography/parentTitleId', title.titleId)
    }
  }
  requireValue([...titles.values()].filter(t => t.rank === 'empire').length === 1, 'E_TITLE_HIERARCHY', '/geography/titles')
  const counties = list(facts.counties, '/facts/counties')
  counties.forEach(county => {
    shape(county, ['titleId', 'districtRefs', 'parts'], '/facts/counties')
    requireValue(strings(county.districtRefs, '/facts/districtRefs').length > 0, 'E_TITLE_HIERARCHY', '/facts/districtRefs', county.titleId)
    list(county.parts, '/facts/parts').forEach(part => {
      shape(part, ['dongId', 'fragmentId', 'geometryRefs'], '/facts/parts')
      requireValue(part.fragmentId === null || text(part.fragmentId), 'E_SLOT_EDITION', '/facts/parts')
      strings(part.geometryRefs, '/facts/geometryRefs')
    })
  })
  exact([...titles.values()].filter(t => t.rank === 'county').map(t => t.titleId), counties.map(t => t.titleId), 'E_SLOT_COVERAGE', '/geography/counties')
  for (const id of exceptions.keys()) requireValue(counties.some(county => county.titleId === id), 'E_TITLE_HIERARCHY', '/geography/parentExceptions', id)
  const groups = unique(list(geography.countySlots, '/geography/countySlots'), x => x.countyTitleId, '/geography/countySlots', 'E_SLOT_DUPLICATE')
  exact([...groups.keys()], counties.map(t => t.titleId), 'E_SLOT_COVERAGE', '/geography/countySlots')
  const allSlots = [...groups.values()].flatMap(group => list(group.slots, '/geography/slots'))
  unique(allSlots, slot => slot.slotId, '/geography/slots', 'E_SLOT_DUPLICATE')
  unique(allSlots, slot => JSON.stringify([slot.dongId, slot.fragmentId]), '/geography/slots', 'E_SLOT_DUPLICATE')
  const sourceParts = counties.flatMap(county => county.parts)
  unique(sourceParts, part => JSON.stringify([part.dongId, part.fragmentId]), '/facts/parts', 'E_SLOT_DUPLICATE')
  for (const dong of facts.dongRefs) {
    const fragments = sourceParts.filter(part => part.dongId === dong)
    requireValue(fragments.length === 1 || fragments.every(part => part.fragmentId !== null), 'E_SLOT_COVERAGE', '/facts/parts', dong)
    unique(fragments.flatMap(part => part.geometryRefs), id => id, '/facts/geometryRefs', 'E_SLOT_DUPLICATE')
  }
  const slotIds = new Set()
  const parts = new Set()
  for (const county of counties) {
    const title = titles.get(county.titleId)
    const parent = titles.get(title.parentTitleId)
    const exception = exceptions.get(county.titleId)
    if (exception) {
      requireValue(county.districtRefs.length > 1, 'E_TITLE_HIERARCHY', `/geography/${county.titleId}/parent`)
      exact(title.jurisdictionRefs, county.districtRefs, 'E_TITLE_HIERARCHY', `/geography/${county.titleId}/parent`)
      const kingdom = titles.get(exception.kingdomTitleId)
      requireValue(kingdom?.rank === 'kingdom' && county.districtRefs.every(ref => kingdom.jurisdictionRefs.includes(ref)),
        'E_KINGDOM_PARTITION', `/geography/${county.titleId}/kingdom`)
    } else {
      requireValue(county.districtRefs.length === 1, 'E_TITLE_HIERARCHY', `/geography/${county.titleId}/parent`)
      exact(parent.jurisdictionRefs, county.districtRefs, 'E_TITLE_HIERARCHY', `/geography/${county.titleId}/parent`)
    }
    const slots = list(groups.get(county.titleId).slots, '/geography/slots')
    shape(groups.get(county.titleId), ['countyTitleId', 'slots'], '/geography/countySlots')
    exact(slots.map(s => JSON.stringify([s.dongId, s.fragmentId])), county.parts.map(s => JSON.stringify([s.dongId, s.fragmentId])), 'E_SLOT_COVERAGE', `/geography/${county.titleId}`)
    for (const slot of slots) {
      shape(slot, ['slotId', 'dongId', 'fragmentId', 'sourceEdition', 'geometryRefs', 'holdingRefs', 'status', 'holderPersonId'], '/geography/slots')
      const key = JSON.stringify([slot.dongId, slot.fragmentId])
      requireValue(!slotIds.has(slot.slotId) && !parts.has(key), 'E_SLOT_DUPLICATE', '/geography/slots', slot.slotId)
      slotIds.add(slot.slotId); parts.add(key)
      requireValue(slot.slotId === `slot:${slot.dongId}${slot.fragmentId === null ? '' : `:${slot.fragmentId}`}`, 'E_SLOT_EDITION', '/geography/slotId', slot.slotId)
      requireValue(slot.sourceEdition === facts.sourceEdition, 'E_SLOT_EDITION', '/geography/slots', slot.slotId)
      exact(slot.geometryRefs, county.parts.find(p => JSON.stringify([p.dongId, p.fragmentId]) === key).geometryRefs, 'E_SLOT_EDITION', '/geography/geometryRefs')
      slot.geometryRefs.forEach(ref => resolveRef(ref, '/geography/geometryRefs', slot.slotId))
      strings(slot.holdingRefs, '/geography/holdingRefs')
      requireValue(['direct', 'vassal', 'unassigned'].includes(slot.status), 'E_SCOPE_SHAPE', '/geography/status', slot.slotId)
      requireValue(slot.status === 'unassigned' ? slot.holderPersonId === null && slot.holdingRefs.length === 0 : people.has(slot.holderPersonId) && slot.holdingRefs.length > 0,
        'E_SCOPE_ADMISSION', '/geography/holderPersonId', slot.slotId)
      for (const id of slot.holdingRefs) resolveHolding(id, slot)
    }
  }
  exact([...new Set(counties.flatMap(c => c.parts.map(p => p.dongId)))], facts.dongRefs, 'E_SLOT_COVERAGE', '/facts/dongRefs')
  const duchies = [...titles.values()].filter(t => t.rank === 'duchy')
  exact(duchies.flatMap(t => t.jurisdictionRefs), facts.districtRefs, 'E_KINGDOM_PARTITION', '/geography/duchies')
  requireValue(['proposed', 'approved'].includes(geography.kingdomStatus), 'E_SCOPE_SHAPE', '/geography/kingdomStatus')
  if (final) requireValue(geography.kingdomStatus === 'approved', 'E_SCOPE_PENDING', '/geography/kingdomStatus')
  const kingdoms = [...titles.values()].filter(t => t.rank === 'kingdom')
  for (const kingdom of kingdoms) requireValue(kingdom.jurisdictionRefs.length > 1, 'E_KINGDOM_PARTITION', '/geography/kingdoms', kingdom.titleId)
  exact(kingdoms.flatMap(t => t.jurisdictionRefs), facts.districtRefs, 'E_KINGDOM_PARTITION', '/geography/kingdoms')
  for (const duchy of duchies) requireValue(titles.get(duchy.parentTitleId).jurisdictionRefs.includes(duchy.jurisdictionRefs[0]), 'E_KINGDOM_PARTITION', '/geography/parentTitleId', duchy.titleId)
  exact([...titles.values()].find(t => t.rank === 'empire').jurisdictionRefs, facts.districtRefs, 'E_KINGDOM_PARTITION', '/geography/empire')
  requireValue(geography.mapMinimumRank === 'county', 'E_MAP_GRANULARITY', '/geography/mapMinimumRank')
  for (const id of strings(geography.mapTitleIds, '/geography/mapTitleIds')) requireValue(titles.has(id) && titles.get(id).rank !== 'barony', 'E_MAP_GRANULARITY', '/geography/mapTitleIds', id)
}

// Pure entry point: I/O, archive bytes, current source extraction and source facts belong to the caller.
export function validateSeoulScope(input, { mode = 'publication', batchId = null } = {}) {
  const errors = []
  try {
    requireValue(['inspection', 'migration', 'publication'].includes(mode) && (mode === 'migration' ? text(batchId) : batchId === null), 'E_SCOPE_INPUT', '/mode')
    shape(input, ['contract', 'baseline', 'baselineSha256', 'current', 'boundary', 'archiveHashes', 'sourceHashes', 'review', 'batches', 'geography', 'facts', 'refs', 'edges'], '/input')
    const { contract, baseline, current, boundary, archiveHashes, sourceHashes, review, batches, geography, facts, refs, edges } = input
    requireValue(baseline?.schema === 'seoul-pre-edit-baseline.v1' && baseline.immutable === true, 'E_ARCHIVE_HASH', '/baseline')
    requireValue(baseline.archives && baseline.currentEntitySets && baseline.identitySetHashes && Array.isArray(baseline.files), 'E_ARCHIVE_HASH', '/baseline')
    shape(current, ['entitySets', 'documentPaths', ...['rights', 'rightsTransition', 'createdDocuments', 'technicalDocuments', 'successorDocuments', 'publicationReview'].filter(key => Object.hasOwn(current, key))], '/current')
    requireValue(current.entitySets && archiveHashes && sourceHashes, 'E_SCOPE_SHAPE', '/input')
    for (const set of ENTITY_SETS) list(current.entitySets[set], `/current/${set}`)
    list(current.documentPaths, '/current/documentPaths')
    shape(boundary, ['path', 'sha256', 'edition'], '/boundary')
    for (const [name, archive] of Object.entries(baseline.archives)) requireValue(archiveHashes[name] === archive.sha256, 'E_ARCHIVE_HASH', '/archives', name)
    shape(contract, ['schema', 'baselineSha256', 'boundarySource', 'entities', 'documents', 'dispositions', 'rail'], '/contract')
    requireValue(contract.schema === SEOUL_SCOPE_SCHEMA && contract.baselineSha256 === input.baselineSha256 && digest(input.baselineSha256), 'E_ARCHIVE_HASH', '/contract/baselineSha256')
    shape(contract.boundarySource, ['path', 'sha256', 'edition'], '/contract/boundarySource')
    requireValue(contract.boundarySource.sha256 === boundary.sha256 && contract.boundarySource.path === boundary.path && contract.boundarySource.edition === boundary.edition, 'E_SCOPE_GEOMETRY', '/boundarySource')
    list(contract.entities, '/entities').forEach(row => shape(row, ['id', 'kind', 'sourcePath', 'status', 'locationRefs', 'jurisdictionRefs', 'basis', 'batchId'], '/entities'))
    const entityByKey = unique(contract.entities, row => `${row.kind}:${row.id}`, '/entities')
    const personIds = new Set(baseline.currentEntitySets.persons)
    const expectedEntities = {
      person: baseline.currentEntitySets.persons, title: baseline.currentEntitySets.titles,
      holding: [...baseline.currentEntitySets.holdings, ...baseline.currentEntitySets.grants],
      state: [...baseline.currentEntitySets.states, ...baseline.currentEntitySets.polities], event: baseline.currentEntitySets.events,
    }
    const transition = authenticateRightsTransition(baseline, current.rightsTransition, sourceHashes)
    const currentTargets = transition.entitySets
    for (const set of ENTITY_SETS) {
      const code = set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT'
      const expected = strings(baseline.currentEntitySets[set], `/baseline/currentEntitySets/${set}`)
      requireValue(sha256(JSON.stringify(expected)) === baseline.identitySetHashes[set], 'E_ARCHIVE_HASH', '/baseline/identitySetHashes', set)
      exact(current.entitySets[set], currentTargets[set], code, `/current/${set}`)
    }
    for (const [kind, ids] of Object.entries(expectedEntities)) exact(contract.entities.filter(e => e.kind === kind).map(e => e.id), ids, kind === 'person' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/entities/${kind}`)
    const refIndex = unique(list(refs, '/refs'), row => row.id, '/refs', 'E_SCOPE_REF')
    function resolveRef(id, path, entityId) {
      const ref = refIndex.get(id)
      requireValue(ref, 'E_SCOPE_REF', path, id)
      requireValue(ref.inside === true && ref.boundarySha256 === boundary.sha256, 'E_SCOPE_OUTSIDE', path, entityId || id)
      return ref
    }
    for (const ref of refs) {
      shape(ref, ['id', 'kind', 'inside', 'boundarySha256'], '/refs')
      requireValue(['region', 'station', 'constituency', 'district', 'geometry'].includes(ref.kind) && typeof ref.inside === 'boolean', 'E_SCOPE_SHAPE', '/refs', ref.id)
    }
    const selected = row => selectedScopeRow(row, mode, batchId)
    for (const row of contract.entities) {
      shape(row, ['id', 'kind', 'sourcePath', 'status', 'locationRefs', 'jurisdictionRefs', 'basis', 'batchId'], '/entities')
      requireValue(Object.hasOwn(expectedEntities, row.kind) && text(row.id) && text(row.sourcePath) && ['pending', 'active', 'preserved', 'retired'].includes(row.status), 'E_SCOPE_SHAPE', '/entities', row.id)
      requireValue(baseline.files.some(file => file.path === row.sourcePath) && sourceHashes[row.sourcePath], 'E_SCOPE_REF', '/entities/sourcePath', row.id)
      requireValue(row.batchId === null || text(row.batchId), 'E_SCOPE_SHAPE', '/entities/batchId', row.id)
      strings(row.locationRefs, '/entities/locationRefs'); strings(row.jurisdictionRefs, '/entities/jurisdictionRefs')
      requireValue(row.status !== 'preserved', row.kind === 'person' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', '/entities/status', row.id)
      if (row.status === 'retired') requireValue(text(row.basis), 'E_SCOPE_ADMISSION', '/entities/basis', row.id)
      if (selected(row)) requireValue(row.status === 'active', 'E_SCOPE_PENDING', '/entities/status', row.id)
      if (row.status !== 'active') continue
      requireValue(text(row.basis) && text(row.batchId), 'E_SCOPE_ADMISSION', '/entities/basis', row.id)
      if (row.kind === 'person') requireValue(row.locationRefs.length > 0, 'E_SCOPE_LOCATION', '/entities/locationRefs', row.id)
      else requireValue(row.locationRefs.length + row.jurisdictionRefs.length > 0, 'E_SCOPE_LOCATION', '/entities/jurisdictionRefs', row.id)
      for (const ref of [...row.locationRefs, ...row.jurisdictionRefs]) resolveRef(ref, '/entities/refs', row.id)
    }
    const dispositionKeys = []
    for (const row of list(contract.dispositions, '/dispositions')) {
      shape(row, ['set', 'id', 'status', 'targetIds', 'batchId', 'basis'], '/dispositions')
      requireValue(ENTITY_SETS.includes(row.set) && ['pending', 'active', 'retired'].includes(row.status), 'E_SCOPE_SHAPE', '/dispositions', row.id)
      dispositionKeys.push(JSON.stringify([row.set, row.id]))
      strings(row.targetIds, '/dispositions/targetIds')
      const retirement = transition.retired.get(JSON.stringify([row.set, row.id]))
      const bulkRetirement = ['relations', 'courts'].includes(row.set) && row.targetIds.length === 0
        && row.batchId === RELATION_COURT_BULK_RETIREMENT.batchId && row.basis === RELATION_COURT_BULK_RETIREMENT.basis
      if (row.status === 'retired') requireValue(bulkRetirement || retirement && row.targetIds.length === 0
        && row.batchId === 'approved-rights-transition' && row.basis === 'authenticated retired-current mapping; no current Seoul successor',
      row.set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', '/dispositions/retirement', row.id)
      else requireValue(!retirement, 'E_CENSUS_RIGHT', '/dispositions/retirement', row.id)
      if (selected(row)) requireValue(row.status === 'active' || row.status === 'retired', 'E_SCOPE_PENDING', '/dispositions/status', row.id)
      if (row.status === 'active') requireValue(text(row.basis) && row.targetIds.length > 0 && text(row.batchId)
        && row.targetIds.every(id => current.entitySets[row.set].includes(id)), 'E_CENSUS_RIGHT', '/dispositions', row.id)
    }
    exact(dispositionKeys, ENTITY_SETS.flatMap(set => baseline.currentEntitySets[set].map(id => JSON.stringify([set, id]))), 'E_CENSUS_RIGHT', '/dispositions')
    const docs = baselineDocuments(baseline)
    const created = current.createdDocuments ?? []
    requireValue(created.length <= 1, 'E_REVIEW_COVERAGE', '/current/createdDocuments')
    for (const row of created) {
      shape(row, ['sourcePath', 'currentSha256', 'batchId', 'evidencePath', 'evidenceSha256', 'reviewBody'], '/current/createdDocuments')
      if (row.sourcePath === 'lore/Research-Sources.json') {
        const transitionHash = '8809d53d52b1ef68c198e0555ccb9ac8a8ef4549497d8a19bcb197e9b65ab573'
        requireValue(row.batchId === 'bibliography-json-authoring-transition'
          && row.evidencePath === '.omo/private/seoul-migration/bibliography-authoring-transition-20261015.json'
          && row.evidenceSha256 === transitionHash && sha256(row.reviewBody) === transitionHash,
        'E_REVIEW_HASH', '/current/createdDocuments', row.sourcePath)
        const receipt = JSON.parse(row.reviewBody)
        requireValue(receipt.schema === 'bibliography-authoring-transition-receipt.v1'
          && receipt.identity.id === 'DOC:Research-Sources' && receipt.identity.slug === 'Research-Sources'
          && receipt.denominator.before === 323 && receipt.denominator.after === 323
          && receipt.denominator.operation === 'replace-source-path-not-add-document'
          && receipt.before.path === 'lore/Research-Sources.md'
          && receipt.before.sha256 === '25d2e35d381da6393d4430b218280ba1a9393fbc91f238bdc27c131eeaa32ca6'
          && sha256(receipt.before.originalMarkdown) === receipt.before.sha256
          && receipt.after.path === row.sourcePath
          && receipt.after.sha256 === 'd99f98ed386d74c218118cca146fc5a0d5b1be6768f5131d64e2d20a01f1757c'
          && row.currentSha256 === receipt.after.sha256 && sourceHashes[row.sourcePath] === receipt.after.sha256,
        'E_REVIEW_HASH', '/current/createdDocuments', row.sourcePath)
        const selectors = [2, 6, 10, 14, 18, 22, 26, 30, 38]
        requireValue(receipt.anchorMapping.length === 9 && receipt.anchorMapping.every((alias, index) =>
          alias.originalReference.startsWith('lore/Research-Sources.md#SRC-NEW-')
          && receipt.before.originalMarkdown.split('<a id="' + alias.originalReference.split('#')[1] + '"></a>').length === 2
          && alias.sourceReference === alias.originalReference.replace('.md#', '.json#')
          && alias.status === 'resolved' && alias.targets.length === 1
          && alias.targets[0].sourcePath === row.sourcePath && alias.targets[0].sourceSha256 === row.currentSha256
          && alias.targets[0].jsonPointer === '/content/' + selectors[index] && digest(alias.targets[0].recordSha256)),
        'E_DEPENDENCY_REFERENCE', '/current/createdDocuments/aliases', row.sourcePath)
      } else requireValue(row.sourcePath === 'lore/Research-Sources.md' && row.batchId === 'wildlife-source-authoring'
        && row.currentSha256 === '25d2e35d381da6393d4430b218280ba1a9393fbc91f238bdc27c131eeaa32ca6'
        && sourceHashes[row.sourcePath] === row.currentSha256
        && row.evidencePath === '.omo/private/seoul-migration/wildlife-census-registration-20261015/review.json'
        && row.evidenceSha256 === 'f72899e0b9df94fa2b559b0296ae9583bc61f0156a14e04f54c755520c318fa2'
        && sha256(row.reviewBody) === row.evidenceSha256, 'E_REVIEW_HASH', '/current/createdDocuments', row.sourcePath)
      requireValue(mode === 'inspection' || row.sourcePath === 'lore/Research-Sources.json'
        && row.batchId === 'bibliography-json-authoring-transition',
      'E_SCOPE_PENDING', '/current/createdDocuments', row.sourcePath)
    }
    const technical = validateTechnicalDocumentCoverage(current, sourceHashes)
    const successors = validateNationalDressDocuments(current.successorDocuments ?? [], sourceHashes,
      [...docs, ...created.map(row => row.sourcePath), ...technical.map(row => row.sourcePath)])
    exact(current.documentPaths, [...docs, ...created.map(row => row.sourcePath), ...technical.map(row => row.sourcePath), ...successors.map(row => row.sourcePath)], 'E_REVIEW_COVERAGE', '/current/documents')
    list(contract.documents, '/documents').forEach(row => shape(row, ['sourcePath', 'status', 'reviewReceipt', 'batchId', 'basis'], '/documents'))
    exact(contract.documents.map(row => row.sourcePath), docs, 'E_REVIEW_COVERAGE', '/documents')
    for (const row of contract.documents) {
      shape(row, ['sourcePath', 'status', 'reviewReceipt', 'batchId', 'basis'], '/documents')
      requireValue(['pending', 'active', 'preserved', 'control', 'excluded'].includes(row.status), 'E_SCOPE_SHAPE', '/documents/status', row.sourcePath)
      const original = baseline.files.find(file => file.path === row.sourcePath)
      if (original.kind === 'sealed-history') {
        requireValue(row.status === 'preserved' && text(row.basis), 'E_SCOPE_ADMISSION', '/documents/status', row.sourcePath)
        requireValue(sourceHashes[row.sourcePath] === original.sha256, 'E_ARCHIVE_HASH', '/documents', row.sourcePath)
      } else if (repositoryControl(row.sourcePath)) {
        requireValue(row.status === 'control' && row.reviewReceipt === null && text(row.basis) && text(row.batchId),
          'E_SCOPE_ADMISSION', '/documents/status', row.sourcePath)
        const expectedHash = row.sourcePath === 'WORLD_BUILDING_GUIDE.md'
          ? 'b8abd053dfb4cba2d865c601b26a9ab9e6a3ce1859f621251fc08929153b6914' : original.sha256
        requireValue(sourceHashes[row.sourcePath] === expectedHash, 'E_ARCHIVE_HASH', '/documents', row.sourcePath)
      } else if (row.status === 'excluded') {
        requireValue(row.reviewReceipt === null && text(row.basis) && text(row.batchId)
          && row.basis.includes('evidence=') && row.basis.includes(`currentSha256=${sourceHashes[row.sourcePath]}`),
        'E_SCOPE_ADMISSION', '/documents/status', row.sourcePath)
      } else {
        requireValue(!['preserved', 'control'].includes(row.status), 'E_REVIEW_COVERAGE', '/documents/status', row.sourcePath)
        if (selected(row)) requireValue(row.status === 'active', 'E_SCOPE_PENDING', '/documents/status', row.sourcePath)
        if (row.status === 'active') {
          requireValue(text(row.basis) && text(row.batchId), 'E_SCOPE_ADMISSION', '/documents', row.sourcePath)
          shape(row.reviewReceipt, ['currentSha256', 'evidencePath', 'reviewedAt'], '/documents/reviewReceipt')
          requireValue(digest(row.reviewReceipt.currentSha256) && row.reviewReceipt.currentSha256 === sourceHashes[row.sourcePath], 'E_REVIEW_HASH', '/documents/reviewReceipt', row.sourcePath)
          requireValue(text(row.reviewReceipt.evidencePath) && text(row.reviewReceipt.reviewedAt), 'E_REVIEW_COVERAGE', '/documents/reviewReceipt', row.sourcePath)
        }
      }
    }
    const documentIndex = new Map([...contract.documents, ...technical, ...successors].map(row => [row.sourcePath, row]))
    for (const entity of contract.entities.filter(row => row.status === 'active')) {
      const document = documentIndex.get(entity.sourcePath)
      requireValue(document, 'E_SCOPE_REF', '/entities/sourcePath', entity.id)
      requireValue(document.status === 'active', 'E_SCOPE_PENDING', '/entities/sourcePath', entity.sourcePath)
    }
    shape(contract.rail, ['stationRefs', 'edgeRefs'], '/rail')
    for (const id of strings(contract.rail.stationRefs, '/rail/stationRefs')) requireValue(resolveRef(id, '/rail/stationRefs').kind === 'station', 'E_SCOPE_REF', '/rail/stationRefs', id)
    const edgeIndex = unique(list(edges, '/edges'), edge => edge.id, '/edges')
    for (const id of strings(contract.rail.edgeRefs, '/rail/edgeRefs')) {
      const edge = edgeIndex.get(id)
      requireValue(edge, 'E_SCOPE_REF', '/rail/edgeRefs', id)
      requireValue(edge.inside === true && edge.physical === true && edge.boundarySha256 === boundary.sha256, 'E_SCOPE_OUTSIDE', '/rail/edgeRefs', id)
      for (const station of [edge.a, edge.b]) requireValue(contract.rail.stationRefs.includes(station), 'E_SCOPE_REF', '/rail/edgeRefs', station)
    }
    const rights = unique(list(current.rights ?? [], '/current/rights'), row => row.id, '/current/rights', 'E_SCOPE_REF')
    for (const right of rights.values()) {
      shape(right, ['id', 'holderPersonId', 'slotStatus', ...['sourceRefs', 'referenceMappings'].filter(key => Object.hasOwn(right, key))], '/current/rights')
      if (Object.hasOwn(right, 'referenceMappings')) {
        requireValue(right.referenceMappings && typeof right.referenceMappings === 'object' && !Array.isArray(right.referenceMappings),
          'E_SCOPE_SHAPE', '/current/rights/referenceMappings', right.id)
        for (const [from, targets] of Object.entries(right.referenceMappings)) {
          resolveRef(from, '/current/rights/referenceMappings', right.id)
          for (const target of strings(targets, '/current/rights/referenceMappings')) resolveRef(target, '/current/rights/referenceMappings', right.id)
        }
      }
      // Optional source-derived selector digests bridge the producer's station,
      // facility and landmark namespaces to the holding's reviewed geography.
      // They convey no additional location or rights authority.
      if (Object.hasOwn(right, 'sourceRefs')) {
        const refs = right.sourceRefs
        requireValue(refs && typeof refs === 'object' && !Array.isArray(refs)
          && Object.entries(refs).every(([key, hash]) => ['stationRef', 'facilityRef', 'landmarkRef'].includes(key) && digest(hash)),
        'E_SCOPE_SHAPE', '/current/rights/sourceRefs', right.id)
      }
      requireValue([...current.entitySets.holdings, ...current.entitySets.grants].includes(right.id), 'E_SCOPE_REF', '/current/rights', right.id)
    }
    function resolveHolding(id, slot) {
      const holding = entityByKey.get(`holding:${id}`)
      requireValue(holding, 'E_SCOPE_REF', '/geography/holdingRefs', id)
      const disposition = contract.dispositions.find(row => ['holdings', 'grants'].includes(row.set) && row.targetIds.includes(id))
      requireValue(holding.status === 'active' && disposition?.status === 'active', 'E_SCOPE_PENDING', '/geography/holdingRefs', id)
      const right = rights.get(id)
      requireValue(right, 'E_SCOPE_ADMISSION', '/current/rights', id)
      requireValue(right.holderPersonId === slot.holderPersonId && right.slotStatus === slot.status,
        'E_SCOPE_ADMISSION', '/geography/holderPersonId', id)
    }
    if (geography?.schema === STAGING_GEOGRAPHY_SCHEMA) {
      const publication = checkStagingGeography(geography, facts, input, mode)
      if (publication) checkGeography(publication.geography, publication.facts, resolveRef, mode === 'publication', personIds, resolveHolding)
    } else if (geography !== null) checkGeography(geography, facts, resolveRef, mode === 'publication', personIds, resolveHolding)
    else requireValue(mode === 'inspection', 'E_SCOPE_PENDING', '/geography')
    // Exact authenticated document review is separate from entity/right allocation.
    // A report clone cannot remove a document from allocation-batch validation.
    const reviewedDocuments = isAuthenticatedPublicationReview(current.publicationReview)
      ? contract.documents.filter(document => document.status === 'active' && current.publicationReview.documents.some(row =>
        row.sourcePath === document.sourcePath && row.eligible && row.classification === 'current-reviewed'
        && row.reason === 'approved-exact-review' && row.receipt !== null
        && row.currentSha256 === sourceHashes[document.sourcePath]
        && document.reviewReceipt?.currentSha256 === row.currentSha256
        && document.reviewReceipt.evidencePath === row.receipt.approvalRef)) : []
    const requiredBatches = new Set([...contract.entities, ...contract.documents, ...contract.dispositions]
      .filter(row => row.status === 'active').map(row => row.batchId))
    if (mode === 'migration') requiredBatches.add(batchId)
    const batchIndex = unique(list(batches, '/batches'), row => row.id, '/batches', 'E_APPROVAL_BATCH')
    const reviewBatches = new Set(mode === 'migration' ? [batchId] : requiredBatches)
    for (const id of requiredBatches) {
      const batch = batchIndex.get(id)
      requireValue(batch, 'E_APPROVAL_BATCH', '/batches', id)
      shape(batch, ['id', 'proposal', 'approval', 'articleSample', 'cardSample', 'entityKeys', 'documentPaths', 'dispositionKeys', 'dependencyBatchIds'], '/batches')
      checkApproval(batch.approval, 'batch-allocation', id, proposalHash(batch.proposal), '/batches/approval')
      requireValue(proposalHash(batch.proposal) === proposalHash({
        entities: contract.entities.filter(row => row.batchId === id),
        documents: contract.documents.filter(row => row.batchId === id),
        dispositions: contract.dispositions.filter(row => row.batchId === id),
        geography,
      }), 'E_APPROVAL_BATCH', '/batches/proposal', id)
      for (const [key, kind] of [['articleSample', 'article-style'], ['cardSample', 'card-style']]) {
        shape(batch[key], ['body', 'approval'], `/batches/${key}`)
        requireValue(text(batch[key].body), 'E_APPROVAL_BATCH', `/batches/${key}`, id)
        checkApproval(batch[key].approval, kind, id, sha256(batch[key].body), `/batches/${key}/approval`)
      }
      exact(batch.entityKeys, contract.entities.filter(row => row.batchId === id).map(row => `${row.kind}:${row.id}`), 'E_APPROVAL_BATCH', '/batches/entityKeys')
      exact(batch.documentPaths, contract.documents.filter(row => row.batchId === id && row.status === 'active')
        .map(row => row.sourcePath), 'E_APPROVAL_BATCH', '/batches/documentPaths')
      exact(batch.dispositionKeys, contract.dispositions.filter(row => row.batchId === id).map(row => JSON.stringify([row.set, row.id])), 'E_APPROVAL_BATCH', '/batches/dispositionKeys')
      for (const dependency of strings(batch.dependencyBatchIds, '/batches/dependencyBatchIds')) requireValue(requiredBatches.has(dependency), 'E_APPROVAL_BATCH', '/batches/dependencyBatchIds', dependency)
      for (const key of batch.entityKeys) requireValue(entityByKey.get(key)?.status === 'active', 'E_SCOPE_PENDING', '/batches/entityKeys', key)
      for (const path of batch.documentPaths) requireValue(contract.documents.find(row => row.sourcePath === path)?.status === 'active', 'E_SCOPE_PENDING', '/batches/documentPaths', path)
      for (const key of batch.dispositionKeys) {
        const disposition = contract.dispositions.find(row => JSON.stringify([row.set, row.id]) === key)
        requireValue(disposition?.status === 'active' || disposition?.status === 'retired'
          && id === 'approved-rights-transition' && transition.retired.has(key),
        'E_SCOPE_PENDING', '/batches/dispositionKeys', key)
      }
    }
    for (const id of requiredBatches) {
      const closure = new Set([id])
      for (const dependency of closure) {
        for (const next of batchIndex.get(dependency).dependencyBatchIds) closure.add(next)
      }
      for (const entity of contract.entities.filter(row => row.status === 'active' && row.batchId === id)) {
        const document = documentIndex.get(entity.sourcePath)
        requireValue(closure.has(document.batchId), 'E_APPROVAL_BATCH', '/entities/sourcePath', entity.id)
      }
      if (mode === 'migration' && id === batchId) for (const dependency of closure) reviewBatches.add(dependency)
    }
    if (mode !== 'inspection') {
      shape(review, ['originalKeys', 'currentKeys', 'receipts'], '/review')
      const relevant = row => mode === 'publication' || reviewBatches.has(row.batchId)
      const receipts = list(review.receipts, '/review/receipts').filter(relevant)
      exact(receipts.flatMap(row => row.coveredKeys), review.originalKeys.filter(relevant).map(row => row.key), 'E_REVIEW_COVERAGE', '/review/originalKeys')
      exact(receipts.flatMap(row => row.currentHashes.map(item => item.key)), review.currentKeys.filter(relevant).map(row => row.key), 'E_REVIEW_COVERAGE', '/review/currentKeys')
      // Indexed by key over the full current denominator (over a million rows in
      // production); a receipt hash is bound when any current row carries it.
      const currentHashIndex = new Map()
      for (const key of review.currentKeys) {
        const bound = currentHashIndex.get(key.key)
        currentHashIndex.set(key.key, bound === undefined ? key.sha256 : [].concat(bound, key.sha256))
      }
      for (const row of receipts) {
        shape(row, ['coveredKeys', 'currentHashes', 'disposition', 'batchId', 'evidencePath', 'reviewedAt'], '/review/receipts')
        requireValue(['revised', 'reviewed', 'preserved'].includes(row.disposition) && text(row.evidencePath) && text(row.reviewedAt), 'E_REVIEW_COVERAGE', '/review/receipts')
        for (const entry of row.currentHashes) {
          const bound = currentHashIndex.get(entry.key)
          requireValue(currentHashIndex.has(entry.key) && (bound === entry.sha256 || Array.isArray(bound) && bound.includes(entry.sha256)), 'E_REVIEW_HASH', '/review/currentHashes', entry.key)
        }
      }
    }
    if (current.publicationReview !== undefined) {
      const publication = current.publicationReview
      const path = '/current/publicationReview'
      shape(publication, ['schema', 'semanticReview', 'complete', 'documents'], path)
      requireValue(publication.schema === 'seoul-document-publication-eligibility.v1' && typeof publication.complete === 'boolean', 'E_SCOPE_SHAPE', path)
      exact(list(publication.documents, path).map(row => row.sourcePath), current.documentPaths, 'E_REVIEW_COVERAGE', path)
      for (const row of publication.documents) {
        shape(row, ['sourcePath', 'currentSha256', 'classification', 'eligible', 'reason', 'receipt'], path)
        requireValue(digest(row.currentSha256) && row.currentSha256 === sourceHashes[row.sourcePath], 'E_REVIEW_HASH', path, row.sourcePath)
        const history = baseline.files.some(file => file.path === row.sourcePath && file.kind === 'sealed-history')
          || row.sourcePath.startsWith('vendor/issued-history/')
        const document = documentIndex.get(row.sourcePath)
        requireValue(typeof row.eligible === 'boolean', 'E_SCOPE_SHAPE', path, row.sourcePath)
        if (repositoryControl(row.sourcePath)) requireValue(!row.eligible && row.classification === 'integrity-control'
          && row.reason === 'non-publication-control' && row.receipt === null && document?.status === 'control',
        'E_SCOPE_ADMISSION', path, row.sourcePath)
        else if (document?.status === 'excluded') requireValue(!row.eligible && row.classification === 'excluded-document'
          && row.reason === 'authenticated-publication-exclusion' && row.receipt === null,
        'E_SCOPE_ADMISSION', path, row.sourcePath)
        else if (history) requireValue(!row.eligible && row.classification === 'sealed-history' && row.reason === 'sealed-history' && row.receipt === null,
          'E_SCOPE_ADMISSION', path, row.sourcePath)
        else if (row.eligible) {
          // A created replacement source has no baseline contract row; its exact creation
          // proof authenticated above stands in for the scope row it cannot have.
          const creation = document ? null : created.find(item => item.sourcePath === row.sourcePath && item.batchId === 'bibliography-json-authoring-transition')
          requireValue(row.classification === 'current-reviewed' && row.reason === 'approved-exact-review'
            && (document ? document.status === 'active' && document.reviewReceipt?.currentSha256 === row.currentSha256
              : creation?.currentSha256 === row.currentSha256), 'E_SCOPE_ADMISSION', path, row.sourcePath)
          shape(row.receipt, ['path', 'sha256', 'approvalRef'], path)
          requireValue(text(row.receipt.path) && digest(row.receipt.sha256) && text(row.receipt.approvalRef), 'E_SCOPE_SHAPE', path)
          requireValue(isAuthenticatedPublicationReview(publication), 'E_PUBLICATION_REVIEW_AUTHORITY', path, row.sourcePath)
        } else requireValue(row.receipt === null && (row.classification === 'current-pending'
          && ['missing-authenticated-review', 'pending-review'].includes(row.reason)
          || row.classification === 'archive-reviewed' && row.reason === 'archive-only' && document?.status === 'preserved'),
        'E_SCOPE_ADMISSION', path, row.sourcePath)
      }
      const candidates = publication.documents.filter(row => !['sealed-history', 'archive-only', 'non-publication-control', 'authenticated-publication-exclusion'].includes(row.reason))
      const complete = candidates.length > 0 && candidates.every(row => row.eligible)
      requireValue(publication.complete === complete && publication.semanticReview === (complete ? 'reviewed' : 'not-reviewed'), 'E_SCOPE_SHAPE', path)
    }
    if (mode === 'publication') {
      requireValue(current.publicationReview && isAuthenticatedPublicationReview(current.publicationReview), 'E_PUBLICATION_REVIEW_AUTHORITY', '/current/publicationReview')
      requireValue(current.publicationReview.complete, 'E_PUBLICATION_REVIEW_PENDING', '/current/publicationReview')
    }
  } catch (error) {
    if (error instanceof TypeError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/input', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    errors.push({ code: error.code, path: error.path, id: error.id })
  }
  return { ok: errors.length === 0, errors }
}
