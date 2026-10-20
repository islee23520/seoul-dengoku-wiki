import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { BASELINE_SHA256, ENTITY_SETS, rightsTransitionTargets, sha256 } from './seoul-scope.mjs'
import { loadAppliedBatches } from './seoul-census.mjs'

const privatePath = '.omo/private/seoul-migration/'
const locationSupplement = privatePath + 'location-candidate-133-recovery-20261015-registry56-supplement.json'
const residenceProposal = privatePath + 'k1003-k1004-location-ref-supplement-proposal-20261015.json'
const residenceReceipt = privatePath + 'k1003-k1004-location-ref-supplement-applied-evidence-20261015.json'
const supplementHashes = {
  refs: 'b17277868ed6dfa5c4f8bc4aeb3f74b32c56089c57cf2cfbfa60af6de7127bb3',
  proposal: '18f7e2be03d3495ee8c7942abe5cf4712d23098de871a87b58af68e3e7060171',
  receipt: '41341c62664e5af4c8c4ec283656b46901202d5613081d93b2aa955a4f419bde'
}
const required = (condition, code) => { if (!condition) throw new Error(code) }
const pointer = (value, path) => path.slice(1).split('/').reduce((part, key) => part?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], value)
const identity = (row, set) => set === 'bindings' ? JSON.stringify([row.holdingId, row.titleId]) : row.id
const fields = { titles: 'titles', grants: 'grants', holdings: 'holdings', bindings: 'existingTitleBindings' }

// Every input is read-only. The result is a private proposal, never a scope row,
// document review, batch approval, or new award of land/title.
export async function buildSeoulScopeActivationCandidates({ root, readBytes = readFile, batches: verifiedBatches } = {}) {
  const bytes = path => readBytes(resolve(root, path))
  const json = async path => JSON.parse(Buffer.from(await bytes(path)).toString())
  const baselineRaw = await bytes(privatePath + 'baseline.json')
  required(sha256(baselineRaw) === BASELINE_SHA256, 'E_ARCHIVE_HASH')
  const baseline = JSON.parse(baselineRaw)
  required(baseline.immutable === true && baseline.currentEntitySets.persons.length === 1022, 'E_CENSUS_PERSON')
  for (const set of ENTITY_SETS) required(sha256(JSON.stringify(baseline.currentEntitySets[set])) === baseline.identitySetHashes[set], 'E_ARCHIVE_HASH')
  const scope = await json('lore/editorial/Seoul-Scope-Contract.json')
  required(scope.baselineSha256 === BASELINE_SHA256 && scope.entities.every(row => row.status === 'pending')
    && scope.dispositions.every(row => row.status === 'pending'), 'E_SCOPE_PENDING')
  required(JSON.stringify(scope.entities.filter(row => row.kind === 'person').map(row => row.id).sort()) ===
    JSON.stringify([...baseline.currentEntitySets.persons].sort()), 'E_CENSUS_PERSON')
  const batches = verifiedBatches ?? await loadAppliedBatches(readBytes, root)
  const rights = batches.find(row => row.approvalModel === 'approved-rights-transition')?.rightsTransition
  required(rights?.dispositions.length === 411, 'E_CENSUS_RIGHT')
  const hashes = Object.fromEntries([...rights.sources].map(([path, source]) => [path, source.afterSha256]))
  rightsTransitionTargets(baseline, rights.proof, hashes)
  const approval = JSON.parse(rights.proof.approvalBody)
  const dispositions = rights.dispositions.map(row => {
    const field = fields[row.set]
    const source = rights.sources.get(row.originalRef.sourcePath)
    const original = pointer(source.before, row.originalRef.jsonPointer)
    const mapping = approval.records.find(record => record.set === field && record.oldId === (row.set === 'bindings' ? original.holdingId : row.id))
    required(original && identity(original, row.set) === row.id && sha256(JSON.stringify(original)) === row.originalRef.recordSha256
      && mapping?.sourceValueSha256 === row.originalRef.recordSha256 && mapping.disposition === row.disposition, 'E_CENSUS_RIGHT')
    for (const ref of row.newRefs) {
      const target = pointer(source.after, ref.jsonPointer)
      required(target && identity(target, row.set) === ref.id && sha256(JSON.stringify(target)) === ref.recordSha256, 'E_CENSUS_RIGHT')
    }
    return { set: row.set, id: row.id, originalRef: row.originalRef, disposition: row.disposition,
      targetRefs: row.newRefs, holderPersonId: original.holderPersonId ?? null, evidenceBatchId: row.batchId,
      promotion: 'pending-independent-semantic-review-and-scope-approval' }
  })
  const outsideRaw = await bytes(privatePath + 'remaining-outside-rights-inventory-20261015.json')
  required(sha256(outsideRaw) === '21cd07a22798be73a7913df50eb47ef5617de4144d289ab5be2feed26955f93e', 'E_REVIEW_HASH')
  const outside = JSON.parse(outsideRaw)
  const byRight = new Map(dispositions.map(row => [JSON.stringify([row.set, row.id]), row]))
  required(outside.records.length === 325 && outside.denominators.otherAffectedRowsWithoutIndividualSeoulReplacement === 309,
    'E_CENSUS_RIGHT')
  const unresolvedOutside = outside.records.filter(row => {
    const key = row.set === 'bindings' ? JSON.stringify([row.set, JSON.stringify(row.bindingIdentity)]) : row.key
    const target = byRight.get(key)
    required(target && target.originalRef.recordSha256 === row.sourceValueSha256
      && (row.set === 'bindings' || target.holderPersonId === row.holderPersonId), 'E_CENSUS_RIGHT')
    return target.disposition !== 'approved-nonowning'
  }).map(row => ({ key: row.key, holderPersonId: row.holderPersonId,
    disposition: byRight.get(row.set === 'bindings' ? JSON.stringify([row.set, JSON.stringify(row.bindingIdentity)]) : row.key).disposition,
    reason: 'no-individual-Seoul-replacement-right' }))
  required(unresolvedOutside.length === 309, 'E_CENSUS_RIGHT')

  const boundaryBytes = await bytes(scope.boundarySource.path)
  required(sha256(boundaryBytes) === scope.boundarySource.sha256, 'E_SCOPE_GEOMETRY')
  const inside = new Set(JSON.parse(boundaryBytes).features.filter(f => f.properties.sido === '11' && f.properties.sidonm === '서울특별시')
    .map(f => `region:${f.properties.adm_cd2}`))
  const slotSource = await json('lore/regions/seoul-electoral-titles.json')
  const slotPath = 'lore/regions/seoul-electoral-titles.json'
  const slotSha256 = (await json('lore/editorial/Seoul-Relocation-Ledger.json')).binding.task2.successor.geography.sha256
  required(sha256(await bytes(slotPath)) === slotSha256, 'E_REVIEW_HASH')
  const slots = new Map(slotSource.countySlots.flatMap(row => row.slots.map(slot => [slot.slotId, slot])))
  const registered = new Set([...baseline.files.map(file => file.path), 'lore/regions/seoul-electoral-titles.json',
    ...batches.map(row => row.packetPath), ...batches.map(row => row.approvalModel === 'proposal+style-contract'
      ? `${privatePath}task-8-batch-proposal-${row.batchId}.json` : null).filter(Boolean)])
  const sourceHashes = new Map(baseline.files.map(file => [file.path, file.sha256]))
  sourceHashes.set(slotPath, slotSha256)
  for (const batch of batches) for (const source of batch.sourceBeforeAfter?.sources ?? []) {
    if (source.beforeSha256 !== source.afterSha256) {
      if (source.operation === 'replace-source') sourceHashes.delete(source.sourcePath)
      sourceHashes.set(source.replacementPath ?? source.sourcePath, source.afterSha256)
    }
  }
  const sourceValues = new Map([[slotPath, slotSource]])
  async function authenticatedSource(path) {
    if (!sourceValues.has(path)) {
      const raw = await bytes(path)
      required(sha256(raw) === sourceHashes.get(path), 'E_REVIEW_HASH')
      sourceValues.set(path, JSON.parse(raw))
    }
    return sourceValues.get(path)
  }
  const people = new Map(baseline.currentEntitySets.persons.map(id => [id, { personId: id, evidenceBatches: [], locationCandidates: [],
    evidenceGaps: [], promotion: 'pending-independent-semantic-review-and-scope-approval' }]))
  for (const batch of batches.filter(row => row.personIds.length)) {
    const packetRaw = await bytes(batch.packetPath)
    required(sha256(packetRaw) === batch.packetSha256, 'E_APPROVAL_BATCH')
    const packet = JSON.parse(packetRaw)
    for (const id of batch.personIds) {
      const person = people.get(id)
      required(person, 'E_CENSUS_PERSON')
      person.evidenceBatches.push({ batchId: batch.batchId, packetPath: batch.packetPath, packetSha256: batch.packetSha256 })
    }
    for (const [index, operation] of (packet.operations ?? []).entries()) {
      if (!operation.locationRef) continue
      const person = people.get(operation.personId)
      required(person && batch.personIds.includes(operation.personId), 'E_CENSUS_PERSON')
      const loc = operation.locationRef
      // Older packets have nested prose-only locations or a slot without an
      // exact dong. Those stay explicit gaps rather than geographic guesses.
      if (!loc.slotId || !loc.dongId || !loc.evidence?.length) {
        if (loc.dongId && !inside.has(loc.dongId)) throw new Error('E_SCOPE_OUTSIDE')
        person.evidenceGaps.push({ batchId: batch.batchId, operationIndex: index, reason: 'incomplete-explicit-location-ref' })
        continue
      }
      required(inside.has(loc.dongId), 'E_SCOPE_OUTSIDE')
      const slot = slots.get(loc.slotId)
      if (!slot || slot.dongId !== loc.dongId) {
        person.evidenceGaps.push({ batchId: batch.batchId, operationIndex: index, reason: 'no-matching-registered-slot' })
        continue
      }
      const slotEvidence = loc.evidence.find(row => row.sourcePath === 'lore/regions/seoul-electoral-titles.json'
        && row.currentValue?.slotId === loc.slotId && row.currentValue?.dongId === loc.dongId)
      if (!slotEvidence) {
        person.evidenceGaps.push({ batchId: batch.batchId, operationIndex: index, reason: 'no-exact-slot-source-evidence' })
        continue
      }
      required(slotEvidence.jsonPointer?.startsWith('/countySlots/')
        && JSON.stringify(pointer(slotSource, slotEvidence.jsonPointer)) === JSON.stringify(slot)
        && JSON.stringify(slotEvidence.currentValue) === JSON.stringify(slot)
        && sha256(JSON.stringify(slot)) === slotEvidence.currentValueSha256, 'E_SCOPE_REF')
      for (const evidence of loc.evidence) {
        required(registered.has(evidence.sourcePath), 'E_SCOPE_REF')
        if (evidence.jsonPointer === undefined) {
          required(evidence.sourcePath === `${privatePath}task-8-batch-proposal-${batch.batchId}.json`
            && evidence.sha256 === sha256(await bytes(evidence.sourcePath)), 'E_SCOPE_REF')
        } else {
          required(typeof evidence.jsonPointer === 'string' && evidence.jsonPointer.startsWith('/')
            && sourceHashes.has(evidence.sourcePath), 'E_SCOPE_REF')
          const actual = pointer(await authenticatedSource(evidence.sourcePath), evidence.jsonPointer)
          required(actual !== undefined && JSON.stringify(actual) === JSON.stringify(evidence.currentValue)
            && sha256(JSON.stringify(actual)) === evidence.currentValueSha256, 'E_SCOPE_REF')
        }
      }
      if (loc.stationRef != null) {
        const stations = await authenticatedSource('lore/regions/station-interiors.json')
        required(typeof loc.stationRef === 'string' && loc.stationRef.trim().length > 0
          && loc.evidence.some(row => row.sourcePath === 'lore/regions/station-interiors.json'
            && /^\/stations\/\d+\/(?:layers\/\d+|slots)$/.test(row.jsonPointer)
            && stations.stations[Number(row.jsonPointer.split('/')[2])]?.name === loc.stationRef), 'E_SCOPE_OUTSIDE')
      }
      person.locationCandidates.push({ ref: loc.dongId, slotId: loc.slotId, use: loc.kind ?? loc.use ?? null,
        source: { batchId: batch.batchId, packetPath: batch.packetPath, packetSha256: batch.packetSha256, operationIndex: index },
        certainty: loc.certainty ?? loc.status ?? null, ownership: false })
    }
  }
  // Supplemental review inputs are independent of source-application batches.
  // Their exact bytes and every underlying receipt/source/slot value must agree;
  // approval of these refs does not activate a scope row or grant a holding.
  const supplementalRaw = await bytes(locationSupplement)
  const proposalRaw = await bytes(residenceProposal)
  const receiptRaw = await bytes(residenceReceipt)
  required(sha256(supplementalRaw) === supplementHashes.refs && sha256(proposalRaw) === supplementHashes.proposal
    && sha256(receiptRaw) === supplementHashes.receipt, 'E_REVIEW_HASH')
  const supplemental = JSON.parse(supplementalRaw)
  const proposal = JSON.parse(proposalRaw)
  const receipt = JSON.parse(receiptRaw)
  required(supplemental.mode === 'read-only-evidence-no-activation' && supplemental.sourceRefs.length === 142
    && supplemental.counts.supportedPersons === 131 && supplemental.geography.sha256 === slotSha256
    && supplemental.geography.datedCount === 426 && supplemental.geography.currentCount === 427
    && receipt.state === 'owner-approved-supplemental-evidence' && receipt.reviewOnly === true
    && receipt.activation === false && receipt.sourceApplication === false && receipt.refs.length === 2
    && receipt.proposal.path === residenceProposal && receipt.proposal.sha256 === supplementHashes.proposal
    && receipt.ownerApproval.messageRef === 'call_1JMyeAHGNhWoSy4Hrggb1Vm5'
    && receipt.ownerApproval.answer === '두 인물 거주: 거주 참조 2건 승인 (Recommended)'
    && receipt.ownerApproval.approvedProposalSha256 === supplementHashes.proposal
    && proposal.proposals.length === 2 && proposal.activation === 'none', 'E_SCOPE_REF')
  const supplementaryPackets = new Map()
  const supplementaryProposals = new Map()
  const supplementalSources = new Map()
  const supplementalSource = async path => {
    if (!supplementalSources.has(path)) {
      const raw = await bytes(path)
      required(sha256(raw) === sourceHashes.get(path), 'E_REVIEW_HASH')
      supplementalSources.set(path, JSON.parse(raw))
    }
    return supplementalSources.get(path)
  }
  const supplemented = new Set()
  const slotValue = (slotId, dated, current, dongId) => {
    const earlier = pointer(slotSource, dated.jsonPointer ?? dated.pointer)
    const correspondence = pointer(slotSource, current.jsonPointer ?? current.pointer)
    required(earlier?.slotId === slotId && earlier.dongId === dongId
      && correspondence?.slotId === slotId && correspondence.dongId === dongId
      && sha256(JSON.stringify(earlier)) === (dated.valueSha256 ?? dated.slotValueSha256)
      && sha256(JSON.stringify(correspondence)) === (current.valueSha256 ?? current.slotValueSha256)
      && inside.has(dongId), 'E_SCOPE_REF')
  }
  for (const row of supplemental.sourceRefs) {
    const ref = Object.fromEntries(supplemental.refFields.map((field, index) => [field, row[index]]))
    const batch = batches.find(item => item.batchId === ref.receiptId)
    const person = people.get(ref.personId)
    required(person && !supplemented.has(`${ref.personId}:${ref.use}:${ref.receiptId}:${ref.operationIndex}`)
      && batch?.personIds.includes(ref.personId) && batch.packetPath === ref.receiptPath
      && batch.packetSha256 === ref.receiptSha256
      && batch.approvals.some(a => a.kind === 'batch-allocation' && a.bodySha256 === ref.proposalSha256
        && a.messageRef === ref.approvalMessageRef), 'E_SCOPE_REF')
    supplemented.add(`${ref.personId}:${ref.use}:${ref.receiptId}:${ref.operationIndex}`)
    if (!supplementaryPackets.has(ref.receiptPath)) {
      const raw = await bytes(ref.receiptPath)
      required(sha256(raw) === ref.receiptSha256, 'E_SCOPE_REF')
      supplementaryPackets.set(ref.receiptPath, JSON.parse(raw))
    }
    const operation = supplementaryPackets.get(ref.receiptPath).operations[ref.operationIndex]
    const location = operation?.locationRef
    const selected = location?.slotId ? location : location?.[ref.use]
    required(operation?.personId === ref.personId && operation.file === ref.sourcePath
      && operation.path === ref.sourcePointer && operation.afterValueSha256 === ref.sourceValueSha256
      && sha256(JSON.stringify(location)) === ref.locationRefValueSha256
      && location.status === ref.originalLocationRefStatus
      && selected?.slotId === ref.slotId && (location.slotId ? (location.kind ?? location.use) === ref.use : location.personId === ref.personId), 'E_SCOPE_REF')
    if (!supplementaryProposals.has(ref.proposalPath)) {
      const raw = await bytes(ref.proposalPath)
      required(sha256(raw) === ref.proposalSha256, 'E_SCOPE_REF')
      supplementaryProposals.set(ref.proposalPath, JSON.parse(raw))
    }
    const approved = pointer(supplementaryProposals.get(ref.proposalPath), ref.proposalPointer)
    const approvedPlace = approved?.slotId ? approved : approved?.[ref.use]
    required((approved.personId == null || approved.personId === ref.personId)
      && approvedPlace?.slotId === ref.slotId
      && (approved.slotId == null || (approvedPlace.kind ?? approvedPlace.use) === ref.use), 'E_SCOPE_REF')
    const source = await supplementalSource(ref.sourcePath)
    const sourceValue = pointer(source, ref.sourcePointer)
    required(sourceHashes.get(ref.sourcePath) === ref.sourceFileSha256
      && sha256(JSON.stringify(sourceValue)) === ref.sourceValueSha256
      && JSON.stringify(sourceValue) === JSON.stringify(operation.value), 'E_SCOPE_REF')
    const geo = supplemental.geography.slots[ref.slotId]
    const dongId = selected.dongId ?? location.evidence?.find(e => e.currentValue?.slotId === ref.slotId)?.currentValue?.dongId
    required(geo?.dongId === dongId && geo.dated.sourceSha256 === slotSha256
      && geo.current.sourceSha256 === slotSha256, 'E_SCOPE_REF')
    slotValue(ref.slotId, geo.dated, geo.current, dongId)
    person.locationCandidates.push({ ref: dongId, slotId: ref.slotId, use: ref.use,
      source: { batchId: ref.receiptId, packetPath: ref.receiptPath, packetSha256: ref.receiptSha256,
        operationIndex: ref.operationIndex, supplementPath: locationSupplement },
      certainty: ref.originalLocationRefStatus, ownership: false })
  }
  required(new Set(supplemental.sourceRefs.map(row => row[0])).size === 131, 'E_CENSUS_PERSON')
  const original = batches.find(batch => batch.batchId === 'k1003-k1004')
  required(original?.packetPath === receipt.originalReceipt.path && original.packetSha256 === receipt.originalReceipt.sha256
    && proposal.baseReceipt.path === receipt.originalReceipt.path && proposal.baseReceipt.sha256 === receipt.originalReceipt.sha256
    && supplementaryPackets.has(original.packetPath) === false, 'E_SCOPE_REF')
  const originalRaw = await bytes(original.packetPath)
  required(sha256(originalRaw) === receipt.originalReceipt.sha256, 'E_SCOPE_REF')
  const originalPacket = JSON.parse(originalRaw)
  required(originalPacket.operations.every(operation => !operation.locationRef), 'E_SCOPE_REF')
  for (const [index, row] of receipt.refs.entries()) {
    const proposed = proposal.proposals[index]
    const value = pointer(proposal, row.proposalPointer)
    const source = proposed?.source
    const person = people.get(row.personId)
    required(person && !supplemental.sourceRefs.some(ref => ref[0] === row.personId)
      && ['K1003', 'K1004'][index] === row.personId
      && proposed.personId === row.personId && value?.personId === row.personId
      && row.use === 'residence' && value.kind === 'residence' && value.status === 'derived-from-owner-approved-prose-not-machine-approved'
      && row.slotId === value.slotId && row.dongId === value.dongId
      && sha256(JSON.stringify(value)) === row.valueSha256 && row.valueSha256 === proposed.proposedLocationRefValueSha256
      && source.path === 'lore/characters/Cast-Unaffiliated.json' && source.jsonPointer === row.sourcePointer
      && source.valueSha256 === row.sourceValueSha256 && source.sha256 === sourceHashes.get(source.path)
      && source.appliedReceiptPath === original.packetPath && source.appliedReceiptSha256 === original.packetSha256
      && pointer(originalPacket, source.appliedOperationPointer) === source.exactValue
      && originalPacket.operations[source.appliedOperationIndex]?.file === source.path
      && originalPacket.operations[source.appliedOperationIndex]?.afterValueSha256 === source.appliedOperationValueSha256
      && sha256(JSON.stringify(originalPacket.operations[source.appliedOperationIndex].value)) === source.appliedOperationValueSha256
      && pointer(await supplementalSource(source.path), source.jsonPointer) === source.exactValue
      && sha256(JSON.stringify(source.exactValue)) === source.valueSha256
      && proposed.geography.sha256 === slotSha256 && row.datedSlotPointer === proposed.geography.dated.pointer
      && row.currentCorrespondenceSlotPointer === proposed.geography.currentCorrespondence.pointer
      && value.doesNotGrantDwelling === true && value.doesNotGrantLand === true && value.doesNotGrantTitle === true,
    'E_SCOPE_REF')
    slotValue(row.slotId, proposed.geography.dated, proposed.geography.currentCorrespondence, row.dongId)
    person.locationCandidates.push({ ref: row.dongId, slotId: row.slotId, use: 'residence',
      source: { batchId: original.batchId, packetPath: original.packetPath, packetSha256: original.packetSha256,
        supplementPath: residenceReceipt, proposalPath: residenceProposal, proposalPointer: row.proposalPointer },
      certainty: 'owner-approved-supplemental-ref', ownership: false })
  }
  for (const person of people.values()) {
    required(person.evidenceBatches.length > 0, 'E_CENSUS_PERSON')
    if (!person.locationCandidates.length) person.evidenceGaps.push({ reason: 'no-machine-bound-Seoul-location-in-applied-packet' })
  }
  const persons = [...people.values()]
  const candidateCount = persons.reduce((sum, person) => sum + person.locationCandidates.length, 0)
  const uniqueCandidatePersonCount = persons.filter(person => person.locationCandidates.length > 0).length
  required(uniqueCandidatePersonCount + persons.filter(person => person.locationCandidates.length === 0).length === 1022
    && new Set(persons.map(person => person.personId)).size === 1022, 'E_CENSUS_PERSON')
  return { schema: 'seoul-scope-activation-candidates.v1', visibility: 'private', status: 'proposal-only',
    baselineSha256: BASELINE_SHA256, boundarySha256: scope.boundarySource.sha256,
    candidateCount, uniqueCandidatePersonCount, persons, rightsDispositions: dispositions, unresolvedOutside,
    semanticReview: 'not-reviewed', activation: false }
}
