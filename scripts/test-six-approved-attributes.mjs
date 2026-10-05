import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const approved = [
  ['person-1003', [17, 14, 13, 14], 250, 330],
]

for (const [id, values, attributeCP, total] of approved) {
  test(`${id} projects and renders approved attributes and total`, async () => {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))
    const attributes = ['ST', 'DX', 'IQ', 'HT'].map((key) => detail.gurps.attributes[key])
    assert.deepEqual(attributes.map(({ value }) => value), values)
    assert.deepEqual(attributes.map(({ cp }) => cp), values.map((value, index) => (value - 10) * ([0, 3].includes(index) ? 10 : 20)))
    assert.equal(detail.gurps.cp.attributes, attributeCP)
    assert.equal(detail.gurps.cp.total, total)
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PersonDetailContent, { detail, personId: id })))
    assert.ok(html.includes(`data-person-id="${id}"`))
    assert.ok(html.includes(String(total)))
    for (const value of values) assert.ok(html.includes(String(value)))
  })
}
