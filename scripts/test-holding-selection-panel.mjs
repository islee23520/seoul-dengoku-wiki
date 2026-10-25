import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import HoldingSelectionPanel from '../src/components/HoldingSelectionPanel.tsx'
import { peopleCatalog } from '../src/generated/peopleCatalog'
import { retainerGraph } from '../src/generated/retainerGraph'

const ledger = JSON.parse(readFileSync(new URL('../public/confirmed-person-holdings.json', import.meta.url), 'utf8'))

for (const field of ['holderPersonId', 'directLiegePersonId']) {
  test(`missing graph identity rejects same-name catalog entries: ${field}`, () => {
    const holding = ledger.holdings.find(row => row.id === 'holding:saetgang-concourse')
    const index = retainerGraph.nodes.findIndex(node => node.id === holding[field])
    assert.ok(index >= 0)
    const [node] = retainerGraph.nodes.splice(index, 1)
    const person = peopleCatalog.find(person => person.detailRoute === node.detailRoute)
    assert.ok(person)
    peopleCatalog.push({ ...person, id: 'person-duplicate', detailRoute: '/people/person-duplicate' })
    let dom
    try {
      dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
        createElement(HoldingSelectionPanel, { holding, openingYear: ledger.openingYear, selectedRegionId: '', onSelectRegion() {} }))))
      assert.ok(dom.window.document.querySelector('[role="alert"]'))
      assert.equal(dom.window.document.querySelectorAll('a').length, 0)
    } finally {
      dom?.window.close()
      peopleCatalog.pop()
      retainerGraph.nodes.splice(index, 0, node)
    }
  })
}

for (const id of ['holding:yangcheon', 'holding:saetgang-concourse']) {
  test(`confirmed holding panel renders real person routes and exact admin selection: ${id}`, () => {
    const holding = ledger.holdings.find(row => row.id === id)
    const selectedRegionId = holding.adminRefs[0]?.id ?? ''
    const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(HoldingSelectionPanel, { holding, openingYear: ledger.openingYear, selectedRegionId, onSelectRegion() {} }))))
    try {
      const document = dom.window.document
      assert.equal(document.querySelector('[data-selected-holding]')?.getAttribute('data-selected-holding'), id)
      assert.equal(document.querySelector('[role="alert"]'), null)
      for (const personId of [holding.holderPersonId, holding.directLiegePersonId]) {
        const link = [...document.querySelectorAll('a')].find(node => node.textContent.includes(personId))
        assert.ok(link)
        assert.match(link.getAttribute('href'), /^\/people\/person-\d{4}$/u)
      }
      const buttons = [...document.querySelectorAll('.campaign-holding-regions button')]
      assert.equal(buttons.length, holding.adminRefs.length)
      assert.equal(buttons.filter(node => node.getAttribute('aria-pressed') === 'true').length, holding.adminRefs.length ? 1 : 0)
      assert.equal(document.querySelectorAll('.campaign-holding-regions').length, holding.facilityRef ? 0 : 1)
    } finally { dom.window.close() }
  })
}

const baseHolding = readCanonicalDocument('lore/relations/personal-holdings.json').holdings.find(row => row.id === 'holding:yangcheon')

const componentOnlyHolding = {
  id: 'fixture:component-islands',
  name: { ko: '서울 밖 도서 구성 영지' },
  holderPersonId: baseHolding.holderPersonId,
  directLiegePersonId: baseHolding.directLiegePersonId,
  stateId: baseHolding.stateId,
  territorialScale: null,
  formalTitleRank: null,
  adminRefs: [],
  componentRefs: [
    { unitId: 'unit:test-a', componentIndex: 0 },
    { unitId: 'unit:test-b', componentIndex: 3, name: '테스트 구성 명칭' },
  ],
}

test('component-only holding rejects barony-level public map selection with E_MAP_GRANULARITY', () => {
  const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(HoldingSelectionPanel, { holding: componentOnlyHolding, openingYear: ledger.openingYear, selectedRegionId: 'unit:test-a', onSelectRegion() {} }))))
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('[data-selected-holding]')?.getAttribute('data-selected-holding'), componentOnlyHolding.id)
    assert.match(document.querySelector('[role="alert"]').textContent, /E_MAP_GRANULARITY/u)
    assert.equal(document.querySelectorAll('button').length, 0)
  } finally { dom.window.close() }
})

test('component selections never forward an outside unit', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://holding-panel.test/' })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const calls = []
  const root = createRoot(dom.window.document.getElementById('root'))
  try {
    await act(async () => {
      root.render(createElement(MemoryRouter, null,
        createElement(HoldingSelectionPanel, { holding: componentOnlyHolding, openingYear: ledger.openingYear, selectedRegionId: '', onSelectRegion: id => calls.push(id) })))
    })
    assert.equal(dom.window.document.querySelectorAll('.campaign-holding-regions button').length, 0)
    assert.deepEqual(calls, [])
  } finally {
    await act(async () => { root.unmount() })
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

test('component index cannot become a public map selection', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://holding-panel.test/' })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const calls = []
  const root = createRoot(dom.window.document.getElementById('root'))
  const holding = { ...componentOnlyHolding, componentRefs: [{ unitId: 'unit:test-a', componentIndex: 0 }, { unitId: 'unit:test-a', componentIndex: 3 }] }
  try {
    await act(async () => {
      root.render(createElement(MemoryRouter, null, createElement(HoldingSelectionPanel, {
        holding, openingYear: ledger.openingYear, selectedRegionId: 'unit:test-a',
        onSelectRegion: (id) => calls.push(id),
      })))
    })
    assert.equal(dom.window.document.querySelectorAll('.campaign-holding-regions button').length, 0)
    assert.deepEqual(calls, [])
  } finally {
    await act(async () => { root.unmount() })
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

const fixtureTitles = [
  { id: 'title:fixture-duke', name: '테스트 공작', rank: '공작' },
  { id: 'title:fixture-count', name: '테스트 백작', rank: '백작', holderPersonId: baseHolding.holderPersonId, stateId: baseHolding.stateId, parentTitleId: 'title:fixture-duke', jurisdictionRefs: ['unit:test-a'] },
]
const titledHolding = { ...baseHolding, id: 'fixture:titled', titleId: 'title:fixture-count' }

test('titleId resolves through optional titles prop showing name, rank and parent', () => {
  const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(HoldingSelectionPanel, { holding: titledHolding, openingYear: ledger.openingYear, selectedRegionId: '', onSelectRegion() {}, titles: fixtureTitles }))))
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('[role="alert"]'), null)
    const dts = [...document.querySelectorAll('dt')].map(node => node.textContent)
    assert.ok(dts.includes('작위'))
    assert.ok(dts.includes('상위 작위'))
    const text = document.body.textContent
    assert.ok(text.includes('테스트 백작 · 백작'))
    assert.ok(text.includes('테스트 공작'))
  } finally { dom.window.close() }
})

test('titleId without titles prop degrades silently to the legacy layout', () => {
  const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(HoldingSelectionPanel, { holding: titledHolding, openingYear: ledger.openingYear, selectedRegionId: '', onSelectRegion() {} }))))
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('[role="alert"]'), null)
    const dts = [...document.querySelectorAll('dt')].map(node => node.textContent)
    assert.ok(!dts.includes('작위'))
    assert.ok(!dts.includes('상위 작위'))
    assert.ok(!document.body.textContent.includes('테스트 백작'))
  } finally { dom.window.close() }
})

test('existing ledger holdings without any metadata keep the 행정구역 labels and gain no title rows', () => {
  const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(HoldingSelectionPanel, { holding: baseHolding, openingYear: ledger.openingYear, selectedRegionId: '', onSelectRegion() {} }))))
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('[role="alert"]'), null)
    const text = document.body.textContent
    assert.ok(text.includes(`${baseHolding.adminRefs.length}개 서울 행정구역 참조`))
    assert.ok(text.includes('보유 서울 행정구역 참조'))
    assert.ok(!text.includes('개 동'))
    assert.ok(!text.includes('보유 구성 요소'))
    assert.ok(!text.includes('작위 등급'))
    assert.ok(!text.includes('상위 작위'))
  } finally { dom.window.close() }
})
