import { loadSheetMetadata } from './cast-sqlite/sheet-metadata.mjs'
import { loadPreservedPersonSheets, preservedSheetSources } from './preserved-person-sheet.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { test } from 'vitest'

const approved = [
  ['person-0998', [11, 12, 15, 14], 190, 352],
  ['person-1007', [10, 10, 20, 11], 210, 338],
  ['person-1008', [10, 14, 20, 11], 290, 429],
]

const revision = '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4'
const roots = preservedSheetSources
const baseline = loadSheetMetadata().baseline
assert.deepEqual(Object.keys(roots ?? {}).sort(), Object.keys(baseline.revisions).sort())
const bytes = await readFile(roots[revision].ledgerPath)
assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline.revisions[revision].ledgerSha256)
const issued = JSON.parse(bytes).people
const preserved = loadPreservedPersonSheets().find((version) => version.revision === revision)

const assertProjectedCP = (cp, record, total) => {
  assert.equal(cp.total, total)
  assert.deepEqual(cp, record.cp)
  assert.equal(cp.total, cp.attributes + cp.advantages + cp.disadvantages + cp.skills + (cp.unspent ?? 0))
}

for (const [id, values, attributeCP, total] of approved) {
  // Public CP rendering was retired with the public historical sheets; only the sealed allocation remains a contract.
  test(`${id} preserves archived owner-approved attributes and total`, () => {
    const record = issued.find((entry) => entry.url === `/people/${id}`)
    assert.ok(record)
    const sheet = preserved.people.get(record.id)
    assert.deepEqual(sheet, record)
    const attributes = ['ST', 'DX', 'IQ', 'HT'].map((name) => sheet.attributes[name])
    assert.deepEqual(attributes.map(({ value }) => value), values)
    assert.deepEqual(attributes.map(({ cp }) => cp), values.map((value, index) => (value - 10) * ([0, 3].includes(index) ? 10 : 20)))
    assert.equal(sheet.cp.attributes, attributeCP)
    assertProjectedCP(sheet.cp, record, total)
  })
}

test('CP guards reject a wrong projection, allocation and approved total', () => {
  const record = issued.find((entry) => entry.url === '/people/person-0998')
  for (const mutate of [
    (cp) => { cp.total += 1 },
    (cp) => { cp.skills += 1 },
    (cp) => { cp.skills += 1; cp.disadvantages -= 1 },
  ]) {
    const cp = structuredClone(record.cp)
    mutate(cp)
    assert.throws(() => assertProjectedCP(cp, record, 352), assert.AssertionError)
  }
  const inconsistent = { ...record, cp: { ...record.cp, skills: record.cp.skills + 1 } }
  assert.throws(() => assertProjectedCP(inconsistent.cp, inconsistent, 352), assert.AssertionError)
  const drifted = { ...record, cp: { ...record.cp, total: 360, skills: record.cp.skills + 8 } }
  assert.throws(() => assertProjectedCP(drifted.cp, drifted, 352), assert.AssertionError)
})
