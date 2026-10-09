import assert from 'node:assert/strict'
import { test } from 'vitest'
import { checkRetiredStateNames } from './check-retired-state-names.mjs'

test('tracked authoring UI tests private rules and generated outputs contain only current state identities', () => {
  const result = checkRetiredStateNames()
  assert.ok(result.scanned > 1000)
  assert.deepEqual(result.failures, [])
})
