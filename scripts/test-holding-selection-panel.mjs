import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import HoldingSelectionPanel from '../src/components/HoldingSelectionPanel.tsx'

const ledger = JSON.parse(readFileSync(new URL('../public/confirmed-person-holdings.json', import.meta.url), 'utf8'))

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
