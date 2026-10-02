import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { createElement } from 'react'
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
