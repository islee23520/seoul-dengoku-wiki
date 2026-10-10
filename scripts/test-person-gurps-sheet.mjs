import { preservedSheetSources } from './preserved-person-sheet.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { URL } from 'node:url'
import { createHash } from 'node:crypto'
import { test } from 'vitest'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GurpsSheet, parseGurpsSheet, PreservedPersonSheet, selectPreservedSheet } from '../src/pages/PersonDetailPage.tsx'
import { build, REVISIONS, numericFields } from './gurps-cast.mjs'
import { loadPreservedPersonSheets, projectPreservedPersonSheet } from './preserved-person-sheet.mjs'

const roots = preservedSheetSources
const versions = loadPreservedPersonSheets(roots)
const baseline = JSON.parse(readFileSync(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))
const source = new Map(REVISIONS.map(revision => {
  const bytes = readFileSync(roots[revision].ledgerPath)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline.revisions[revision].ledgerSha256)
  return [revision, JSON.parse(bytes).people]
}))
const identity = record => ({ id: record.id, name: record.name, state: record.state, personId: record.url.split('/').pop(), url: record.url })
const sheetFor = record => projectPreservedPersonSheet(versions, identity(record))
const parse = record => {
  const result = parseGurpsSheet(record, identity(record).personId)
  assert.ok(result.ok, JSON.stringify(result))
  return result.sheet
}
const markup = sheet => renderToStaticMarkup(React.createElement(GurpsSheet, { gurps: sheet }))
const dom = html => new JSDOM(html).window.document.body

test('explicit source bindings reject omission, aliases, missing variants and swapped sealed ledgers', () => {
  assert.throws(() => build(), /E_EXPLICIT_REVISION/)
  for (const input of [null, {}, { latest: roots[REVISIONS[0]] }, { [REVISIONS[0]]: roots[REVISIONS[0]] }])
    assert.throws(() => loadPreservedPersonSheets(input), /E_PERSON_SHEET_BINDING/)
  assert.throws(() => loadPreservedPersonSheets({ [REVISIONS[0]]: roots[REVISIONS[1]], [REVISIONS[1]]: roots[REVISIONS[0]] }), /E_SOURCE_HASH/)
})

for (const revision of REVISIONS) {
  test(revision + ': actual generated catalog preserves every immutable person field and number', () => {
    const expected = source.get(revision)
    const produced = build(roots[revision].root, revision, roots[revision].ledgerPath).doc.people
    assert.deepEqual(produced, expected)
    const actual = expected.map(record => {
      const historicalIdentity = identity(record)
      const ident = { ...historicalIdentity }
      const detail = JSON.parse(readFileSync(new URL('../public/person-details/' + ident.personId + '.json', import.meta.url), 'utf8'))
      assert.deepEqual(detail.gurps, { id: record.id, personId: ident.personId })
      assert.equal(detail.id, ident.personId)
      assert.equal(detail.characterId, ident.id)
      if (record.id === 'K719') assert.equal(detail.name, '송도현')
      else assert.equal(detail.name, ident.name)
      ident.name = detail.name
      ident.state = detail.state
      const selected = selectPreservedSheet(detail.personSheet, ident, revision)
      assert.ok(selected.ok, record.id + ':' + JSON.stringify(selected))
      assert.deepEqual(selected.record, record)
      assert.deepEqual(selected.sheet.secondary, record.secondary)
      assert.deepEqual(selected.sheet.cp, record.cp)
      return selected.record
    })
    assert.equal(actual.length, 1022)
    assert.deepEqual(numericFields(actual), numericFields(expected))
    assert.equal(numericFields(actual).length, baseline.revisions[revision].numericFieldCount)
  })
}

test('projection snapshots input and guards K ID, name, state and stable route independently', () => {
  const record = source.get(REVISIONS[0]).find(p => p.id === 'K088')
  const ident = identity(record)
  assert.equal(ident.personId, 'person-0089')
  for (const mutant of [{ id: 'K089' }, { name: 'wrong' }, { url: '/people/person-0088' }, { personId: 'person-0088' }])
    assert.throws(() => projectPreservedPersonSheet(versions, { ...ident, ...mutant }), /E_PERSON_SHEET_(IDENTITY|ROUTE)/)
  const projected = sheetFor(record)
  projected.variants[0].legacy.record.secondary.BasicMove = -100
  assert.deepEqual(sheetFor(record).variants[0].legacy.record, record)
})

test('runtime selector rejects wrong identities, ambiguous revisions and operative adoption', () => {
  const record = source.get(REVISIONS[0]).find(p => p.id === 'K088')
  const ident = identity(record)
  for (const revision of ['', 'latest', 'unknown']) assert.equal(selectPreservedSheet(sheetFor(record), ident, revision).ok, false)
  for (const change of [
    p => { p.variants.pop() }, p => { p.variants[1] = p.variants[0] },
    p => { p.variants[0].ledgerSha256 = '0'.repeat(64) },
    p => { p.variants[0].legacy.operative = true },
    p => { p.variants[0].rules.originalRatings = { ST: 11 } },
    p => { p.variants[0].rules.numericAdoption = true },
    p => { p.variants[0].rules.sourceRevision = REVISIONS[1] },
    ...['id', 'name', 'state', 'url', 'personId'].map(key => p => { p.variants[0].legacy.record[key] = 'wrong' }),
  ]) {
    const payload = sheetFor(record)
    change(payload)
    assert.equal(selectPreservedSheet(payload, ident, REVISIONS[1]).ok, false)
  }
})

test('readable summary renders issued secondary and CP values without recalculation', () => {
  const record = source.get(REVISIONS[1]).find(p => p.id === 'K1003')
  const changed = { ...record, secondary: { ...record.secondary, BasicSpeed: 4.25, Dodge: 8, BasicMove: 3, BasicLift: 17.2 }, cp: { ...record.cp, spent: 219 } }
  const host = dom(markup(parse(changed)))
  for (const [key, value] of Object.entries(changed.secondary))
    assert.equal(host.querySelector('[data-legacy-field="secondary.' + key + '"] span:nth-child(2)').textContent, String(value))
  assert.equal(host.querySelector('[data-legacy-field="cp.spent"] span:nth-child(2)').textContent, '219 CP')
  assert.equal(parseGurpsSheet({ ...record, traits: {} }, identity(record).personId).ok, false)
  assert.equal(parseGurpsSheet({ ...record, personId: 'wrong' }, identity(record).personId).ok, false)
  assert.equal(parseGurpsSheet(null, identity(record).personId).ok, false)
  const sparse = parse({ url: record.url, attributes: {}, traits: [], skills: [], cp: {}, secondary: {} })
  assert.deepEqual(sparse.secondary, {})
  assert.deepEqual(sparse.cp, {})
})

test('mounted person selector shows preserved stats immediately and keeps both complete revisions without assigning ratings', async () => {
  const browser = new JSDOM('<!doctype html><html><body></body></html>')
  const previousWindow = globalThis.window, previousDocument = globalThis.document
  globalThis.window = browser.window
  globalThis.document = browser.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const record = source.get(REVISIONS[0]).find(p => p.id === 'K1008')
  const ident = identity(record), payload = sheetFor(record)
  const host = document.createElement('div'), reactRoot = createRoot(host)
  try {
    await act(async () => { reactRoot.render(React.createElement(PreservedPersonSheet, { payload, identity: ident })) })
    const select = host.querySelector('select')
    assert.equal(select.value, REVISIONS.at(-1))
    assert.equal(host.querySelector('[data-selected-revision]').dataset.selectedRevision, REVISIONS.at(-1))
    assert.ok(host.querySelector('.gurps-sheet'))
    assert.deepEqual([...select.options].map(option => option.value), REVISIONS)
    for (const revision of REVISIONS) {
      await act(async () => { select.value = revision; select.dispatchEvent(new browser.window.Event('change', { bubbles: true })) })
      assert.equal(host.querySelector('[data-selected-revision]').dataset.selectedRevision, revision)
      assert.equal(host.querySelector('[data-legacy-operative]').dataset.legacyOperative, 'false')
      assert.deepEqual(JSON.parse(host.querySelector('[data-legacy-record] pre').textContent), source.get(revision).find(p => p.id === record.id))
      assert.equal(host.querySelector('[data-original-ratings]').dataset.originalRatings, 'unassigned')
      assert.equal(host.querySelector('input'), null)
    }
  } finally {
    await act(async () => reactRoot.unmount())
    globalThis.window = previousWindow
    globalThis.document = previousDocument
    browser.window.close()
  }
})
