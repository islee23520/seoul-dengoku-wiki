import { preservedSheetSources } from './preserved-person-sheet.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { test } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { PersonDetailContent, PreservedPersonSheet, selectPreservedSheet } from '../src/pages/PersonDetailPage.tsx'

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const issued = read('../lore/name-pools/gurps-cast.json').people
const revision = '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4'
const roots = preservedSheetSources
const baseline = read('./issued-preservation-baseline.json')
assert.deepEqual(Object.keys(roots ?? {}).sort(), Object.keys(baseline.revisions).sort())
const sources = new Map(Object.keys(baseline.revisions).map((key) => {
  const bytes = readFileSync(roots[key].ledgerPath)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), baseline.revisions[key].ledgerSha256)
  return [key, JSON.parse(bytes).people]
}))
const registry = new Map(read('../lore/name-pools/person-id-registry.json').persons.map((row) => [row.id, row]))
const detailFor = (row) => read(`../public/person-details/${row.url.split('/').pop()}.json`)
const render = (detail) => new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(PersonDetailContent, { detail, personId: detail.id }))))

async function withSelectedDetail(detail, check) {
  const browser = new JSDOM('<!doctype html><html><body></body></html>')
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']
  const previous = keys.map((key) => Object.getOwnPropertyDescriptor(globalThis, key))
  globalThis.window = browser.window
  globalThis.document = browser.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  const reactRoot = createRoot(host)
  try {
    await act(async () => { reactRoot.render(createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail, personId: detail.id }))) })
    assert.equal(host.querySelector('[data-person-id]').dataset.personId, detail.id)
    const select = host.querySelector('[data-person-sheet] select')
    assert.ok(select)
    assert.equal(select.value, revision)
    assert.ok(host.querySelector('.gurps-sheet'))
    assert.equal(host.querySelector('[data-selected-revision]').dataset.selectedRevision, revision)
    assert.deepEqual([...select.options].map((option) => option.value), Object.keys(baseline.revisions))
    await act(async () => {
      select.value = revision
      select.dispatchEvent(new browser.window.Event('change', { bubbles: true }))
    })
    assert.equal(host.querySelector('[data-selected-revision]')?.dataset.selectedRevision, revision)
    assert.equal(host.querySelector('[data-legacy-operative]')?.dataset.legacyOperative, 'false')
    assert.deepEqual(JSON.parse(host.querySelector('[data-legacy-record] pre').textContent), sources.get(revision).find((row) => row.id === detail.characterId))
    await check(host)
  } finally {
    await act(async () => reactRoot.unmount())
    keys.forEach((key, index) => {
      if (previous[index]) Object.defineProperty(globalThis, key, previous[index])
      else delete globalThis[key]
    })
    browser.window.close()
  }
}

test.each(['K002', 'K233'])('confirmed holding scope takes precedence over legacy sheet territory: %s', (id) => {
  const row = issued.find((entry) => entry.id === id)
  const detail = detailFor(row)
  const holdings = read('../lore/relations/personal-holdings.json').holdings.filter((holding) => holding.holderPersonId === id)
  const dom = render({ ...detail, confirmedHoldings: holdings, territory: { fief_name: 'LEGACY_SCOPE', type: 'legacy', station: 'legacy', state: row.state, settlement: { name: 'legacy', type: 'legacy', description: 'legacy' }, note: 'legacy' } })
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('.gurps-territory'), null)
    const panel = document.querySelector('[data-confirmed-holdings]')
    assert.ok(panel)
    assert.equal(panel.querySelectorAll('[data-holding-id]').length, holdings.length)
    for (const holding of holdings) {
      const item = panel.querySelector(`[data-holding-id="${holding.id}"]`)
      assert.ok(item.textContent.includes(holding.name.ko))
      assert.equal(item.querySelectorAll('[data-admin-ref]').length, holding.adminRefs.length)
      assert.deepEqual([...item.querySelectorAll('[data-admin-ref]')].map((element) => element.getAttribute('data-admin-ref')), holding.adminRefs.map((region) => region.id))
      if (holding.facilityRef) assert.equal(item.querySelector('[data-facility-layer]').getAttribute('data-facility-layer'), holding.facilityRef.layerId)
    }
    assert.equal(panel.textContent.includes('LEGACY_SCOPE'), false)
  } finally { dom.window.close() }
})

test('generated person sheets preserve every issued identity and numeric field without API access', () => {
  for (const row of issued) {
    const detail = detailFor(row)
    assert.equal(detail.name, registry.get(row.id)?.name, row.id)
    assert.equal(detail.name, row.name, row.id)
    assert.equal(detail.detailRoute, row.url, row.id)
    assert.equal(detail.characterId, row.id, row.id)
    assert.deepEqual(detail.gurps, { id: row.id, personId: row.url.split('/').pop() }, row.id)
    const initialSheet = new JSDOM(renderToStaticMarkup(createElement(PreservedPersonSheet, {
      payload: detail.personSheet,
      identity: { id: detail.characterId, personId: detail.id, name: detail.name, state: detail.state },
    })))
    try {
      assert.equal(initialSheet.window.document.querySelector('[data-selected-revision]')?.dataset.selectedRevision, revision, row.id)
      const preserved = sources.get(revision).find((record) => record.id === row.id)
      for (const key of ['ST', 'DX', 'IQ', 'HT']) {
        const attr = [...initialSheet.window.document.querySelectorAll('.gurps-attr')].find((node) => node.querySelector('.attr-key').textContent === key)
        assert.equal(attr?.querySelector('.attr-value').firstChild.textContent, String(preserved.attributes[key].value), `${row.id}:${key}`)
      }
    } finally { initialSheet.window.close() }
    for (const [key, records] of sources) {
      const selected = selectPreservedSheet(detail.personSheet, { id: detail.characterId, personId: detail.id, name: detail.name, state: detail.state }, key)
      assert.ok(selected.ok, `${row.id}:${key}:${JSON.stringify(selected)}`)
      assert.equal(selected.revision, key)
      assert.deepEqual(selected.record, records.find((record) => record.id === row.id), `${row.id}:${key}`)
    }
  }
  const offset = issued.find((row) => row.id === 'K088')
  assert.equal(detailFor(offset).gurps.personId, 'person-0089')
})

for (const key of ['unit', 'territory', 'wandering_force']) {
  test(`generated person ${key} preserves each existing ledger value and absence`, () => {
    for (const row of issued) assert.deepEqual(detailFor(row)[key], row[key], `${row.id}:${key}`)
  })
}

for (const id of ['K007', 'K1003', 'K088']) {
  test(`person component renders issued stats and holdings without a character API: ${id}`, async () => {
    const row = issued.find((entry) => entry.id === id)
    await withSelectedDetail({ ...detailFor(row), unit: row.unit, territory: row.territory, wandering_force: row.wandering_force }, (document) => {
      for (const key of ['ST', 'DX', 'IQ', 'HT']) {
        const attr = [...document.querySelectorAll('.gurps-attr')].find((node) => node.querySelector('.attr-key').textContent === key)
        assert.ok(attr, `${id}:${key}`)
        assert.equal(attr.querySelector('.attr-value').firstChild.textContent, String(row.attributes[key].value))
      }
      assert.equal(document.querySelector('.cp-number').textContent, String(row.cp.total))
      const unit = document.querySelector('.gurps-unit')
      assert.ok(unit?.textContent.includes(`${row.unit.size}명`))
      for (const value of [row.unit.type, row.unit.quality, row.unit.note, ...row.unit.composition]) assert.ok(unit.textContent.includes(value))
      const territory = document.querySelector('.gurps-territory')
      assert.equal(Boolean(territory), Boolean(row.territory))
      if (row.territory) for (const value of [row.territory.fief_name, row.territory.station, row.territory.settlement.name, row.territory.settlement.description]) assert.ok(territory.textContent.includes(value))
      const camp = document.querySelector('.gurps-wandering')
      assert.equal(Boolean(camp), Boolean(row.wandering_force))
      if (row.wandering_force) for (const value of [row.wandering_force.current_location, row.wandering_force.camp.name, row.wandering_force.camp.description, row.wandering_force.camp.pack_up_time, ...row.wandering_force.camp.facilities]) assert.ok(camp.textContent.includes(value))
    })
  })
}

test('generated-to-person-page integration exposes all four information classes', async () => {
  const selectors = new Set()
  for (const id of ['K007', 'K1003', 'K088']) {
    const row = issued.find((entry) => entry.id === id)
    await withSelectedDetail(detailFor(row), (document) => {
      for (const selector of ['.gurps-sheet', '.gurps-unit', '.gurps-territory', '.gurps-wandering']) {
        if (document.querySelector(selector)) selectors.add(selector)
      }
      assert.equal(document.querySelector('.cp-number')?.textContent, String(row.cp.total))
    })
  }
  assert.deepEqual(selectors, new Set(['.gurps-sheet', '.gurps-unit', '.gurps-territory', '.gurps-wandering']))
})

test('unissued holdings remain absent on the generated person page', async () => {
  const row = issued.find((entry) => !entry.unit && !entry.territory && !entry.wandering_force)
  assert.ok(row)
  await withSelectedDetail(detailFor(row), (document) => {
    assert.ok(document.querySelector('.gurps-sheet'))
    assert.equal(document.querySelector('.gurps-unit, .gurps-territory, .gurps-wandering'), null)
  })
})
