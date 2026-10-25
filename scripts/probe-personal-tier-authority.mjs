import assert from 'node:assert/strict'
import { loadPersonDetailMappingAuthority, assertApprovedPersonDetailMappingReceipt } from './public-person-detail-admission.mjs'

const authority = await loadPersonDetailMappingAuthority()
const receipt = JSON.parse(authority.receiptBytes)
assert.equal(assertApprovedPersonDetailMappingReceipt(authority, receipt.details), true)
const person = receipt.details.find(row => row.characterId === 'K157')
assert.equal(person.commonTier, 'T4')
const preservedTiers = receipt.fieldMappings.filter(row => row.jsonPointer === '/commonTier' && row.transformation?.startsWith('personal-tier-preservation:baseline:'))
assert.equal(preservedTiers.length, 83)
person.personSheet.variants[0].legacy.record.territory = { name: 'source-only' }
assert.throws(() => assertApprovedPersonDetailMappingReceipt(authority, receipt.details), { code: 'E_SCOPE_PROJECTION' })
assert.throws(() => assertApprovedPersonDetailMappingReceipt({ ...authority }, receipt.details), { code: 'E_REVIEW_COVERAGE' })
console.log(JSON.stringify({ count: receipt.details.length, mappings: receipt.fieldMappings.length, preservedTiers: preservedTiers.length,
  sha256: authority.receiptSha256, k157: person.commonTier, reinjectionRejected: true, forgedAuthorityRejected: true }))
