import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

test('GDD catalog exposes canonical documents and current data summaries', async () => {
  const contract = JSON.parse(await readFile(new URL('../src-gdd/generated/gdd-contract.json', import.meta.url), 'utf8'))
  assert.ok(contract.documents.length >= 45)
  assert.equal(new Set(contract.documents.map((document) => document.route)).size, contract.documents.length)
  assert.ok(contract.documents.every((document) => /^(?:canon\/locales\/ko-KR\/(?:adr-\d{3}|(?:root|rules|architecture|references|art)\/[a-z0-9-]+)\.json|LICENSE\.md)$/.test(document.sourcePath)))
  const gddRoot = process.env.GDD_ROOT ?? resolve(import.meta.dirname, '../../../GDD')
  for (const document of contract.documents) await assert.doesNotReject(access(resolve(gddRoot, document.sourcePath)), `${document.route}: ${document.sourcePath} is not a GDD file`)
  assert.ok(contract.documents.every((document) => !/ravelen/i.test(`${document.route} ${document.sourcePath}`)), 'retired Ravelen reference must not be in the GDD catalog')
  assert.deepEqual(contract.datasets.map((dataset) => dataset.records), [1004, 1004, 37, 334, 0, 334, 427])
})
