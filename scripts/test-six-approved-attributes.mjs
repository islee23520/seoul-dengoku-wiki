import { preservedSheetSources } from './preserved-person-sheet.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { GurpsSheet, PersonDetailContent, selectPreservedSheet } from '../src/pages/PersonDetailPage.tsx'

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
const baseline = JSON.parse(await readFile(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))
assert.deepEqual(Object.keys(roots ?? {}).sort(), Object.keys(baseline.revisions).sort())
const bytes = await readFile(roots[revision].ledgerPath)
assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline.revisions[revision].ledgerSha256)
const issued = JSON.parse(bytes).people
const selectApproved = (detail) => {
  const record = issued.find((entry) => entry.url === `/people/${detail.id}`)
  assert.ok(record)
  assert.deepEqual(detail.gurps, { id: record.id, personId: detail.id })
  const selected = selectPreservedSheet(detail.personSheet, { id: detail.characterId, personId: detail.id, name: detail.name, state: detail.state }, revision)
  assert.ok(selected.ok, JSON.stringify(selected))
  assert.equal(selected.revision, revision)
  assert.deepEqual(selected.record, record)
  return selected.sheet
}

for (const [id, values, attributeCP, total] of approved) {
  test(`${id} projects and renders approved attributes and total`, async () => {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))
    const sheet = selectApproved(detail)
    const attributes = ['ST', 'DX', 'IQ', 'HT'].map((key) => sheet.attributes[key])
    assert.deepEqual(attributes.map(({ value }) => value), values)
    assert.deepEqual(attributes.map(({ cp }) => cp), values.map((value, index) => (value - 10) * ([0, 3].includes(index) ? 10 : 20)))
    assert.equal(sheet.cp.attributes, attributeCP)
    assert.equal(sheet.cp.total, total)
    const page = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail, personId: id })))
    assert.ok(page.includes(`data-person-id="${id}"`))
    assert.ok(!page.includes('class="gurps-sheet"'))
    const html = renderToStaticMarkup(createElement(GurpsSheet, { gurps: sheet }))
    assert.ok(html.includes(String(total)))
    for (const value of values) assert.ok(html.includes(String(value)))
  })
}

test('Lee Yeon has one Transcendent Appearance advantage and its 24 CP', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1004.json', import.meta.url), 'utf8'))
  const sheet = selectApproved(detail)
  const appearances = sheet.traits.filter(({ rule }) => rule === 'appearance-transcendent')
  assert.equal(appearances.length, 1)
  assert.equal(appearances[0].cp, 24)
  assert.equal(sheet.cp.advantages, 24)
  assert.equal(sheet.cp.unspent, 35)
  assert.ok(!sheet.traits.some(({ name }) => name === 'Very Beautiful'))
  const html = renderToStaticMarkup(createElement(GurpsSheet, { gurps: sheet }))
  assert.ok(html.includes('Appearance (Transcendent)'))
})
