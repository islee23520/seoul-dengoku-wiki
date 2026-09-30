import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { test } from 'vitest'
import { RelationsGraphPage } from '../src/pages/RelationsGraphPage.tsx'

test('graph page renders generated directed court edges and all approved people', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RelationsGraphPage)))
  assert.match(html, /data-person-id="K904"/)
  assert.match(html, /data-from="K904" data-to="K002"/)
  assert.match(html, /data-person-id="K002"/)
  assert.equal((html.match(/data-person-id="K\d+"/g) ?? []).length, 40)
  assert.equal((html.match(/data-from="K\d+" data-to="K\d+"/g) ?? []).length, 37)
})
