import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('GDD catalog exposes canonical documents and current data summaries', async () => {
  const contract = JSON.parse(await readFile(new URL('../gdd-contract.json', import.meta.url), 'utf8'))
  assert.ok(contract.documents.length >= 45)
  assert.equal(new Set(contract.documents.map((document) => document.route)).size, contract.documents.length)
  assert.ok(contract.documents.every((document) => document.sourcePath.startsWith('GDD/')))
  assert.ok(contract.documents.every((document) => !/ravelen/i.test(`${document.route} ${document.sourcePath}`)), 'retired Ravelen reference must not be in the GDD catalog')
  assert.deepEqual(contract.datasets.map((dataset) => dataset.records), [1004, 1004, 37, 334, 0, 334, 427])
})
