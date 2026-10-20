import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'vitest'
import { authenticateK176LabelSuccessor, K176_SOURCE, K176_DIRECTORY } from './k176-label-successor.mjs'

const root = resolve(import.meta.dirname, '..')
test('K176 successor replays exactly the two owner-approved label prefixes', async () => {
  const result = await authenticateK176LabelSuccessor(root)
  assert.equal(result.receipt.ownerDecision.verbatim, 'K176 표기: 두 표기만 승인 (Recommended)')
  assert.equal(result.receipt.operations.length, 2)
  const old = JSON.parse(result.before), current = JSON.parse(result.current)
  for (const operation of result.receipt.operations) {
    const keys = operation.path.slice(1).split('/')
    const parent = keys.slice(0, -1).reduce((value, key) => value[key], old)
    parent[keys.at(-1)] = operation.after
  }
  assert.deepEqual(current, old)
})
test.each([K176_SOURCE, K176_DIRECTORY + 'owner-decision.json'])('K176 rejects changed exact bytes at %s', async path => {
  const reader = async requested => requested === resolve(root, path)
    ? Buffer.concat([await readFile(requested), Buffer.from(' ')]) : readFile(requested)
  await assert.rejects(authenticateK176LabelSuccessor(root, reader), { code: 'E_REVIEW_HASH', path })
})
