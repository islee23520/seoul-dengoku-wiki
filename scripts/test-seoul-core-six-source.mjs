import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { loadAppliedBatches } from './seoul-census.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packetPath = '.omo/private/seoul-migration/core-six-reviewed-source-application-20261015/application-packet.json'
const registryPath = '.omo/private/seoul-migration/applied-batches.json'

test('batch 75 admits only the archived, reviewed six-leaf Core successor', async () => {
  const batches = await loadAppliedBatches(readFile, root)
  const registry = JSON.parse(await readFile(resolve(root, registryPath)))
  assert.deepEqual(batches.map(row => row.batchId), registry.batches.map(row => row.batchId))
  const coreSix = batches[74]
  assert.equal(coreSix.batchId, 'core-six-reviewed-source-application-6')
  assert.equal(coreSix.sourceBeforeAfter.sources[0].afterSha256,
    'aaa2369d02cd4979bf75152f13f8871f689dad081a3b46c520da9bc4d8b03ee8')
})

for (const [label, path] of [
  ['packet', packetPath],
  ['archive', '.omo/private/seoul-migration/core-six-reviewed-source-application-20261015/before.core-characters.json.gz.b64'],
  ['proposal', '.omo/private/seoul-migration/core-card-location-prose-repair-proposal-20261015/proposal.json'],
  ['correction', '.omo/private/seoul-migration/core-card-location-prose-repair-proposal-20261015/k1009-correction-v2.json'],
  ['review', '.omo/private/seoul-migration/core-card-location-prose-repair-proposal-20261015/independent-v2.json'],
  ['manifest', '.omo/private/seoul-migration/core-six-reviewed-source-application-20261015/source-before-after.json'],
  ['source', 'lore/characters/Core-Characters.json'],
  ['registry', registryPath],
]) test(`batch 75 rejects tampered ${label}`, async () => {
  const target = resolve(root, path)
  const readTampered = async file => {
    const bytes = await readFile(file)
    if (file !== target) return bytes
    if (label === 'registry') {
      const registry = JSON.parse(bytes)
      registry.batches.at(-1).operationCount += 1
      return Buffer.from(JSON.stringify(registry))
    }
    return Buffer.concat([bytes, Buffer.from(' ')])
  }
  await assert.rejects(loadAppliedBatches(readTampered, root), error =>
    ['E_APPROVAL_BATCH', 'E_REVIEW_HASH', 'E_SCOPE_SHAPE'].includes(error.code))
})
