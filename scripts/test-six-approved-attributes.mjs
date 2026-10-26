import { loadSheetMetadata } from './cast-sqlite/sheet-metadata.mjs'
import { loadPreservedPersonSheets, preservedSheetSources } from './preserved-person-sheet.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { test } from 'vitest'

const approved = [
  ['person-1003', [17, 14, 13, 14], 250, 330],
  ['person-1004', [10, 16, 14, 13], 230, 309],
  ['person-1009', [13, 15, 15, 14], 270, 347],
  ['person-1019', [10, 13, 19, 13], 270, 305],
  ['person-1017', [10, 12, 18, 13], 230, 305],
  ['person-1018', [10, 13, 25, 13], 390, 445],
]

const revision = '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4'
const roots = preservedSheetSources
const baseline = loadSheetMetadata().baseline
assert.deepEqual(Object.keys(roots ?? {}).sort(), Object.keys(baseline.revisions).sort())
const bytes = await readFile(roots[revision].ledgerPath)
assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline.revisions[revision].ledgerSha256)
const issued = JSON.parse(bytes).people
const preserved = loadPreservedPersonSheets().find((version) => version.revision === revision)
const selectApproved = (id) => {
  const record = issued.find((entry) => entry.url === `/people/${id}`)
  assert.ok(record)
  const sheet = preserved.people.get(record.id)
  assert.deepEqual(sheet, record)
  return sheet
}

// Public CP rendering was retired with the public historical sheets; sealed allocations are still authenticated.
for (const [id, values, attributeCP, total] of approved) {
  test(`${id} preserves archived approved attributes and total`, () => {
    const sheet = selectApproved(id)
    const attributes = ['ST', 'DX', 'IQ', 'HT'].map((key) => sheet.attributes[key])
    assert.deepEqual(attributes.map(({ value }) => value), values)
    assert.deepEqual(attributes.map(({ cp }) => cp), values.map((value, index) => (value - 10) * ([0, 3].includes(index) ? 10 : 20)))
    assert.equal(sheet.cp.attributes, attributeCP)
    assert.equal(sheet.cp.total, total)
  })
}

test('archived Lee Yeon has one Transcendent Appearance advantage and its 24 CP', () => {
  const sheet = selectApproved('person-1004')
  const appearances = sheet.traits.filter(({ rule }) => rule === 'appearance-transcendent')
  assert.equal(appearances.length, 1)
  assert.equal(appearances[0].cp, 24)
  assert.equal(sheet.cp.advantages, 24)
  assert.equal(sheet.cp.unspent, 35)
  assert.ok(!sheet.traits.some(({ name }) => name === 'Very Beautiful'))
})
