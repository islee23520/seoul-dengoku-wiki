import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersonDetailContent } from '../src/pages/PersonDetailPage.tsx'

const readDetail = async (file) =>
  JSON.parse(await readFile(new URL(`../public/person-details/${file}`, import.meta.url), 'utf8'))

const render = (detail) => renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(PersonDetailContent, { detail, personId: detail.id })))

const ownerLiegeCases = [
  ['person-0002.json', '한재목', '직속 주군'],
  ['person-0003.json', '한재목', '직속 주군'],
  ['person-0017.json', '한재목', '직속 주군'],
  ['person-0058.json', '정서온', '직속 가신'],
  ['person-0060.json', '정서온', '직속 가신'],
  ['person-0061.json', '정서온', '직속 가신'],
  ['person-0062.json', '정서온', '직속 가신'],
  ['person-0234.json', '송재민', '직속 가신'],
]

test('seven owner-liege details render the known liege and exact owner term without a fabricated court', async () => {
  for (const [file, liegeName, ownerTerm] of ownerLiegeCases) {
    const detail = await readDetail(file)
    const html = render(detail)
    assert.ok(html.includes(`직속 주군 · ${liegeName}`), `${file} liege name`)
    assert.ok(html.includes(ownerTerm), `${file} owner term ${ownerTerm}`)
    assert.ok(!html.includes('undefined'), `${file} must not render undefined`)
    assert.ok(!html.includes('null 소속'), `${file} must not render a null court`)
    if (file === 'person-0003.json') {
      assert.ok(html.includes('court:K001'), `${file} approved court membership`)
    } else {
      assert.ok(!/court:(K001|K1005)/.test(html), `${file} must not invent a court for the ruler liege`)
    }
  }
})

test('court retainers keep their factual court membership display', async () => {
  const courtCases = [
    ['person-0904.json', 'court:K002'],
    ['person-0041.json', 'court:K032'],
    ['person-0068.json', 'court:K058'],
  ]
  for (const [file, courtId] of courtCases) {
    const detail = await readDetail(file)
    const html = render(detail)
    assert.ok(html.includes(`${courtId} 소속 가신`), `${file} court display`)
    assert.ok(!html.includes('undefined'), `${file} must not render undefined`)
  }
})
