import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { authenticatePersonalTierProvenance, assertPersonalTierPreservation, PERSONAL_TIER_PRESERVATION_IDS } from './personal-tier-provenance.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

test('runtime admission authenticates original baseline and owner bytes before preserving K157 T4', async () => {
  const result = await authenticatePersonalTierProvenance(root)
  assert.equal(result.size, 83)
  assert.deepEqual([...result.keys()].sort(), [...PERSONAL_TIER_PRESERVATION_IDS].sort())
  assert.equal(result.get('K157').commonTier, 'T4')
  assert.equal(result.get('K157').provenance.authority, 'OD-05-office-only')
  assert.equal(result.get('K158').provenance.authority, 'owner-retrofit-civil-service-position/grade')
  assert.equal(result.get('K398').provenance.authority, 's16-unaffiliated-source-application-522:functional-community-role')
  assert.throws(() => assertPersonalTierPreservation(new Map(result)), { code: 'E_PERSON_TIER_PROVENANCE' })
  result.get('K158').commonTier = 'T1'
  assert.throws(() => assertPersonalTierPreservation(result), { code: 'E_PERSON_TIER_PROVENANCE' })
})

test.each(['baseline.json', 'proposal.json', 'owner-approval-20261017.json', 'office-rank-classification.json', 'registration-packet.json', 'operations.json', 'Cast-State-16.json', 'Cast-State-06.json'])('runtime admission rejects changed %s bytes without changing disk sources', async suffix => {
  const reader = async path => {
    const bytes = await readFile(path)
    if (!path.endsWith(suffix)) return bytes
    if (suffix === 'Cast-State-16.json') {
      const doc = JSON.parse(bytes); doc.content[0].anchor = 'tampered'
      return Buffer.from(JSON.stringify(doc))
    }
    return Buffer.concat([bytes, Buffer.from(' ')])
  }
  if (suffix === 'Cast-State-06.json') {
    const blockReader = async path => {
      const bytes = await readFile(path)
      if (!path.endsWith(suffix)) return bytes
      const doc = JSON.parse(bytes)
      doc.content.find(row => row.anchor === '인물-설다흰-list2').text = 'tampered'
      return Buffer.from(JSON.stringify(doc))
    }
    await assert.rejects(authenticatePersonalTierProvenance(root, blockReader), { code: 'E_PERSON_TIER_PROVENANCE' })
  } else await assert.rejects(authenticatePersonalTierProvenance(root, reader), suffix === 'Cast-State-16.json' ? /E_REVIEW_HASH/ : { code: 'E_PERSON_TIER_PROVENANCE' })
})

test.each(['lore/characters/Cast-State-06.json', 'lore/offices/Offices-and-Ranks.json', 'public/person-details/person-0158.json'])('runtime admission rejects substituted original Git blob %s', async path => {
  await assert.rejects(authenticatePersonalTierProvenance(root, readFile, async (_root, _revision, requested) => {
    if (requested === path) return Buffer.from(JSON.stringify({ substituted: path }))
    return (await promisify(execFile)('git', ['-C', _root, 'show', `${_revision}:${requested}`], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 })).stdout
  }), { code: 'E_PERSON_TIER_PROVENANCE' })
})
