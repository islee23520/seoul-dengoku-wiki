import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { materializeReviewWordingMapping } from './review-wording-mapping-successor.mjs'
import { authenticatePersonalTierProvenance, assertBaselinePersonalTiers } from './personal-tier-provenance.mjs'

export const PUBLIC_LEGACY_RECEIPT = 'scripts/public-legacy-projection-receipt.json'
export const PUBLIC_LEGACY_RECEIPT_SHA256 = 'c987c8144d805310ef8e95b3ace429cd942704a36fd0a00a5ce1cce9a6c60ab7'
const hash = value => createHash('sha256').update(value).digest('hex')

// Wording approval is a predecessor, not permission to omit source fields.
// Authenticate the separate omission receipt before deriving any new mappings.
export async function materializePublicLegacyProjectionMapping(root) {
  const personalTier = await authenticatePersonalTierProvenance(root)
  const receiptBytes = await readFile(resolve(root, PUBLIC_LEGACY_RECEIPT))
  if (hash(receiptBytes) !== PUBLIC_LEGACY_RECEIPT_SHA256) throw new Error('E_REVIEW_HASH')
  const result = await materializeReviewWordingMapping(root)
  const receipt = JSON.parse(result.bytes)
  if (receipt.details.length !== 1022) throw new Error('E_CENSUS_PERSON')
  assertBaselinePersonalTiers(personalTier, receipt.details)
  for (const row of personalTier.values()) {
    const tierMapping = receipt.fieldMappings.find(mapping => mapping.characterId === row.personId && mapping.jsonPointer === '/commonTier')
    if (!tierMapping) throw new Error('E_PERSON_TIER_PROVENANCE')
    tierMapping.disposition = 'replace'
    tierMapping.approvedSuccessor = tierMapping.source
    tierMapping.transformation = `personal-tier-preservation:baseline:${row.provenance.baselineDetailSha256}:${row.provenance.authority}`
  }
  for (const detail of receipt.details) {
    if (detail.personSheet?.variants?.length !== 2) throw new Error('E_PERSON_SHEET_REVISIONS')
  }
  const records = new Map()
  const documents = new Map()
  for (const row of receipt.fieldMappings) {
    if (/^\/personSheet\/variants\/\d+\/legacy\/record$/.test(row.jsonPointer)) {
      records.set(JSON.stringify([row.characterId, row.jsonPointer]), row.source)
    }
  }
  for (const row of receipt.fieldMappings) {
    const match = /^(\/personSheet\/variants\/\d+\/legacy\/record)(\/.*)?$/.exec(row.jsonPointer)
    if (!match) continue
    const source = records.get(JSON.stringify([row.characterId, match[1]]))
    if (!documents.has(source.sourcePath)) documents.set(source.sourcePath, JSON.parse(await readFile(resolve(root, source.sourcePath), 'utf8')))
    const sourceDocument = documents.get(source.sourcePath)
    const pointer = source.jsonPointer + (match[2] ?? '')
    let value = sourceDocument
    for (const key of pointer.slice(1).split('/')) value = value[key.replace(/~1/g, '/').replace(/~0/g, '~')]
    const binding = { ...source, jsonPointer: pointer, valueSha256: hash(JSON.stringify(value)) }
    if (match[2] && binding.valueSha256 === row.valueSha256) {
      row.source = binding
      row.disposition = 'retain'
      row.approvedSuccessor = null
      delete row.transformation
    } else {
      row.source = binding
      row.disposition = 'replace'
      row.approvedSuccessor = binding
      row.transformation = 'public-legacy-projection:explicit-consumer-fields:' + PUBLIC_LEGACY_RECEIPT_SHA256
    }
  }
  receipt.approvalRef = PUBLIC_LEGACY_RECEIPT
  const bytes = JSON.stringify(receipt) + '\n'
  return { bytes, sha256: hash(bytes), count: result.count, mappings: result.mappings }
}
