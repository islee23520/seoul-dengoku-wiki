import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { proposalHash } from './seoul-scope.mjs'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const PACKET = '.omo/private/seoul-migration/event133-application-20261019'
export const CANDIDATE = '.omo/private/seoul-migration/event-disposition-proposal-v2-20261018'
export const CONTRACT = 'lore/editorial/Seoul-Scope-Contract.json'
export const ANNALS = 'lore/chronology/Century-Annals.json'
export const REVIEW = 'lore/editorial/Seoul-Narrative-Review.json'
export const OWNER_TEXT = '사건 133건: 동일성+본문 모두 승인 (Recommended)'
export const OWNER_REF = 'call_47a06d2e3c574537b8e3291c'
export const IDENTITY_HASH = '65406b9df87f2eda0fd36f680cfcbc472132179eb7eb4f8afde8a07e3e8ea52e'
export const BODY_HASH = '612b1fa3d7d01f636bf278a8f37fc5d4c0fd64fc6ba1dbdbdcdbd7367212c1bb'
export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const jsonSha = value => sha256(JSON.stringify(value))
const load = async (root, path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const save = async (root, path, value) => { await mkdir(dirname(resolve(root, path)), { recursive: true }); await writeFile(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`) }
const assert = (condition, code) => { if (!condition) throw new Error(code) }
const body = record => ({ en: record.text.en, ko: record.text.ko })

export async function materialize(root = ROOT, { write = false, ownerDecision } = {}) {
  const identity = await load(root, `${CANDIDATE}/identity-approval-body.json`)
  const revisions = await load(root, `${CANDIDATE}/revised-body-proposal.json`)
  const contract = await load(root, CONTRACT)
  const annals = await load(root, ANNALS)
  const review = await load(root, REVIEW)
  const decision = ownerDecision ?? await load(root, `${PACKET}/owner-decision.json`)
  assert(decision.ownerDecision.messageRef === OWNER_REF && decision.ownerDecision.verbatim === OWNER_TEXT, 'E_OWNER_DECISION')
  assert(sha256(decision.ownerDecision.verbatim) === decision.ownerDecision.verbatimSha256, 'E_OWNER_DECISION_HASH')
  assert(decision.proposals.identityProposalHash === IDENTITY_HASH && decision.proposals.revisedBodyProposalHash === BODY_HASH, 'E_PROPOSAL_BINDING')
  assert(proposalHash(identity) === IDENTITY_HASH, 'E_PROPOSAL_BINDING:/identity-approval-body.json')
  assert(proposalHash(revisions) === BODY_HASH, 'E_PROPOSAL_BINDING:/revised-body-proposal.json')
  assert(identity.identityCorrespondences.length === 133 && revisions.decisions.length === 24, 'E_APPROVED_SET_COUNT')
  const ids = new Set(identity.identityCorrespondences.map(row => row.id))
  assert(ids.size === 133, 'E_APPROVED_SET_DUPLICATE')
  const preexistingActive = contract.dispositions.filter(row => row.set === 'events' && row.status === 'active' && !ids.has(row.id))
  const beforeActive = new Map(preexistingActive.map(row => [row.id, JSON.stringify(row)]))
  for (const row of contract.dispositions) if (ids.has(row.id)) {
    assert(row.set === 'events', 'E_WRONG_SET')
    const pending = row.status === 'pending' && row.targetIds.length === 0 && row.batchId === null && row.basis === null
    const active = row.status === 'active' && JSON.stringify(row.targetIds) === JSON.stringify([row.id]) && row.batchId === 'event133-owner-approved'
    assert(pending || active, 'E_EVENT_STATE')
    Object.assign(row, { status: 'active', targetIds: [row.id], batchId: 'event133-owner-approved', basis: 'authenticated owner-approved same-ID current event identity' })
  }
  assert(contract.dispositions.filter(row => row.set === 'events' && row.batchId === 'event133-owner-approved').length === 133, 'E_EXACT_EVENT_SET')
  for (const [id, bytes] of beforeActive) assert(JSON.stringify(contract.dispositions.find(row => row.set === 'events' && row.id === id)) === bytes, 'E_ACTIVE_EVENT_CHANGED')
  const bodies = []
  for (const revision of revisions.decisions) {
    const [, pointer] = revision.currentProposedBody.pointer.split('#')
    const index = Number(pointer.split('/')[2]); const record = annals.content[index]
    assert(`E:${record.anchor}` === revision.id, 'E_BODY_POINTER')
    const actualBody = body(record)
    assert(JSON.stringify(actualBody) === JSON.stringify(revision.currentProposedBody.body)
      && sha256(actualBody.en) === revision.currentProposedBody.localeBodySha256.en
      && sha256(actualBody.ko) === revision.currentProposedBody.localeBodySha256.ko, 'E_WRONG_BODY')
    assert(sha256(revision.original.body.en) === revision.original.localeBodySha256.en
      && sha256(revision.original.body.ko) === revision.original.localeBodySha256.ko, 'E_INVERSE_PREIMAGE')
    bodies.push({ id: revision.id, pointer, originalPointer: revision.original.pointer,
      beforeBodySha256: revision.original.bodySha256, afterBodySha256: revision.currentProposedBody.bodySha256 })
  }
  const sourceBytes = `${JSON.stringify(annals, null, 2)}\n`; const sourceSha256 = sha256(sourceBytes)
  const doc = review.documents.find(row => row.sourcePath === ANNALS)
  assert(doc && doc.currentSha256 === sourceSha256, 'E_REVIEW_SOURCE_HASH')
  Object.assign(doc, { classification: 'current', disposition: 'reviewed-current', revisedByBatch: 'event133-owner-approved', reviewedAt: '2026-10-19', semanticReview: 'owner-approved-exact-24-bilingual-bodies', receipt: `${PACKET}/application.json` })
  const counts = Object.fromEntries(['active', 'pending', 'retired'].map(status => [status, contract.dispositions.filter(row => row.status === status).length]))
  assert(JSON.stringify(counts) === JSON.stringify({ active: 1401, pending: 0, retired: 1642 }), 'E_FINAL_COUNTS')
  const application = { schema: 'seoul-event133-application.v1', application: true, publicGeneration: false, batchId: 'event133-owner-approved', ownerDecision: { path: `${PACKET}/owner-decision.json`, sha256: sha256(`${JSON.stringify(decision, null, 2)}\n`) }, proposals: decision.proposals, applied: { events: 133, revisedBodies: 24, status: 'active', targetPolicy: 'same-original-id', counts }, source: { path: ANNALS, sha256: sourceSha256, bodies }, review: { path: REVIEW, sourcePath: ANNALS, classification: doc.classification, disposition: doc.disposition }, preserved: { previouslyActiveEvents: beforeActive.size, entities: contract.entities.length, dispositions: contract.dispositions.length, registryBatches: 109 } }
  const manifest = { schema: 'seoul-event133-application-manifest.v1', batchId: application.batchId,
    ownerDecision: application.ownerDecision, proposals: application.proposals,
    application: { path: `${PACKET}/application.json` }, verifier: { path: `${PACKET}/verify.mjs` },
    writes: [CONTRACT, REVIEW], unchangedSource: { path: ANNALS, sha256: sourceSha256 },
    publicGeneration: false, registrySuccessorAdded: false }
  if (write) { await save(root, CONTRACT, contract); await save(root, REVIEW, review); await save(root, `${PACKET}/application.json`, application); await save(root, `${PACKET}/manifest.json`, manifest) }
  return { contract, annals, review, application }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await materialize(ROOT, { write: process.argv.includes('--write') })
  console.log(JSON.stringify(result.application, null, 2))
}
