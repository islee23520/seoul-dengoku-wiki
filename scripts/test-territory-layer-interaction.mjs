// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OpeningTerritoryMap from '../src/components/OpeningTerritoryMap.tsx'
import { projectGeographicTitles } from '../src/components/geographicTitleMap.mjs'
import { geographicTitleColor } from '../src/components/geographicTitleMap.mjs'

test('each rank spreads its title hues around the palette without sequential ID collisions', async () => {
  const source = JSON.parse(await readFile('lore/regions/seoul-electoral-titles.json', 'utf8'))
  for (const rank of ['county', 'duchy', 'kingdom']) {
    const ids = source.titles.filter(title => title.rank === rank).map(title => title.titleId)
    const hues = ids.map(id => Number(geographicTitleColor(id, ids).match(/hsl\((\d+)/u)[1]))
    for (let i = 0; i < hues.length; i++) for (let j = i + 1; j < hues.length; j++) {
      const delta = Math.abs(hues[i] - hues[j])
      assert.ok(Math.min(delta, 360 - delta) >= Math.floor(360 / ids.length), rank)
    }
  }
})

test('map buttons and arrow keys pan within Seoul bounds and Escape closes detail', async () => {
  const { host, data, unmount } = await mountMap()
  try {
    const svg = host.querySelector('.territory-flat-svg')
    await act(async () => host.querySelector('[aria-label="지도 확대"]').click())
    const before = svg.getAttribute('viewBox')
    await act(async () => host.querySelector('[aria-label="지도 오른쪽 이동"]').click())
    assert.notEqual(svg.getAttribute('viewBox'), before)
    await act(async () => { for (let i = 0; i < 20; i++) svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })) })
    const [x, , width] = svg.getAttribute('viewBox').split(' ').map(Number)
    assert.ok(x >= 0 && x + width <= data.width)
    await act(async () => host.querySelector('[data-title-rank="county"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    assert.ok(host.querySelector('#territory-detail-panel'))
    await act(async () => svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(host.querySelector('#territory-detail-panel'), null)
    assert.equal([...host.querySelectorAll('button')].filter(button => button.textContent === '초기화').length, 0)
  } finally { await unmount() }
})

async function mountMap(initialEntries = ['/'], mutate = () => {}) {
  const data = JSON.parse(await readFile('public/opening-territories.json', 'utf8'))
  const staging = JSON.parse(await readFile('lore/regions/seoul-electoral-titles.json', 'utf8'))
  const boundaries = JSON.parse(await readFile('data/geography/boundaries/seoul-sgis-20250630.geojson', 'utf8'))
  const geography = projectGeographicTitles(staging, boundaries, (longitude, latitude) => {
    const x = (longitude - data.projection.minEast) / (data.projection.maxEast - data.projection.minEast) * data.width
    const y = (data.projection.maxNorth - latitude) / (data.projection.maxNorth - data.projection.minNorth) * data.height
    return [x, y]
  })
  const assets = {
    'opening-territories.json': { ...data, geography },
    'confirmed-person-holdings.json': JSON.parse(await readFile('public/confirmed-person-holdings.json', 'utf8')),
    'underground-detail.json': JSON.parse(await readFile('public/underground-detail.json', 'utf8')),
  }
  mutate(assets)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', callback => { callback(0); return 1 })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('fetch', async url => ({ ok: Boolean(assets[String(url).split('/').at(-1)]), json: async () => assets[String(url).split('/').at(-1)] }))
  await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries }, React.createElement(OpeningTerritoryMap))) })
  await act(async () => {})
  return {
    host,
    data: assets['opening-territories.json'],
    holdings: assets['confirmed-person-holdings.json'],
    unmount: async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() },
  }
}

test('pointer cancellation and multi-pointer gestures do not leave an active drag', async () => {
  const { host, unmount } = await mountMap()
  try {
    const svg = host.querySelector('.territory-flat-svg')
    await act(async () => host.querySelector('[aria-label="지도 확대"]').click())
    const before = svg.getAttribute('viewBox')
    const pointer = (type, id, x) => {
      const event = new MouseEvent(type, { clientX: x, clientY: 50, bubbles: true })
      Object.defineProperty(event, 'pointerId', { value: id })
      svg.dispatchEvent(event)
    }
    await act(async () => { pointer('pointerdown', 1, 50); pointer('pointercancel', 1, 50); pointer('pointermove', 1, 100) })
    assert.equal(svg.getAttribute('viewBox'), before)
    await act(async () => {
      pointer('pointerdown', 1, 50); pointer('pointerdown', 2, 60)
      pointer('pointermove', 1, 100); pointer('pointerup', 2, 60); pointer('pointermove', 1, 120); pointer('pointerup', 1, 120)
    })
    assert.equal(svg.getAttribute('viewBox'), before)
    await act(async () => host.querySelector('[aria-label="지도 오른쪽 이동"]').click())
    assert.notEqual(svg.getAttribute('viewBox'), before)
  } finally { await unmount() }
})

test('political mode exposes only 48 Seoul counties and the three factions plus neutral', async () => {
  const { host, unmount } = await mountMap()
  try {
    const counties = [...host.querySelectorAll('[data-title-rank="county"]')]
    assert.equal(counties.length, 48)
    assert.equal(host.querySelectorAll('[data-vassal-marker], [data-outside-unit], .territory-faction-flag').length, 0)
    assert.deepEqual(new Set(counties.map(path => path.getAttribute('data-political-affiliation'))), new Set(['규격맹', '대한민국정부', '종교 연합', '중립']))
    assert.deepEqual([...host.querySelectorAll('[aria-label="서울 정치 권역 범례"] > span > span:last-child')].map(node => node.textContent), ['규격맹', '대한민국정부', '종교 연합', '중립'])
    assert.equal(host.querySelector('[aria-label="지리 작위 등급"]'), null)
  } finally { await unmount() }
})

test('title mode changes rank by title ID and county detail keeps baronies as slots', async () => {
  const { host, data, unmount } = await mountMap()
  try {
    await act(async () => { [...host.querySelectorAll('.territory-mode-toggle button')].find(button => button.textContent === '작위·영주 지도').click() })
    const rank = [...host.querySelectorAll('label.territory-filter')].find(label => label.textContent.includes('지리 작위 등급')).querySelector('select')
    assert.equal(host.querySelectorAll('[data-title-rank="county"]').length, 48)
    await act(async () => { rank.value = 'duchy'; rank.dispatchEvent(new Event('change', { bubbles: true })) })
    assert.equal(host.querySelectorAll('[data-title-rank="duchy"]').length, 25)
    await act(async () => { rank.value = 'county'; rank.dispatchEvent(new Event('change', { bubbles: true })) })
    const county = data.geography.titles.find(title => title.rank === 'county')
    await act(async () => { host.querySelector(`[data-title-id="${county.id}"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    assert.equal(host.querySelector(`[data-geographic-detail="${county.id}"] h3`).textContent, county.name)
    assert.equal(host.querySelectorAll('[data-barony-slot]').length, county.datedSlots.length + county.currentSlots.length)
    assert.equal(host.querySelectorAll('[data-title-rank="barony"]').length, 0)
  } finally { await unmount() }
})

test('outside query cannot select geometry and subway renders only published physical hops', async () => {
  const { host, data, unmount } = await mountMap(['/?region=region%3A4113164000'])
  try {
    assert.equal(host.querySelector('#territory-detail-panel'), null)
    await act(async () => { [...host.querySelectorAll('.territory-layer-toggle button')].find(button => button.textContent === '지하 영토').click() })
    assert.equal(host.querySelectorAll('[data-underground-segment]').length, data.edges.length)
    assert.equal(host.querySelectorAll('[data-station-area]').length, data.stations.length)
    const edge = data.edges[0]
    await act(async () => { host.querySelector(`[data-underground-segment="${edge.id}"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    assert.ok(host.querySelector('#territory-detail-panel h3').textContent.includes('–'))
  } finally { await unmount() }
})

test('administrative holding survives same-layer selection but clears on another county', async () => {
  const { host, unmount } = await mountMap()
  try {
    const select = [...host.querySelectorAll('label.territory-filter')].find(label => label.textContent.includes('개인 영지')).querySelector('select')
    await act(async () => { select.value = 'holding:yangpyeong2'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    assert.equal(select.value, 'holding:yangpyeong2')
    assert.ok(host.querySelector('[data-holding-id="holding:yangpyeong2"]'))
    assert.ok(host.querySelector('#territory-detail-panel').textContent.includes('K001'))
    await act(async () => host.querySelector('.territory-layer-toggle button:first-child').click())
    assert.equal(select.value, 'holding:yangpyeong2')
    await act(async () => host.querySelector('[data-title-rank="county"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    assert.equal(select.value, '')
    assert.equal(host.querySelector('[data-holding-id]'), null)
    assert.equal(host.querySelectorAll('[data-title-id][aria-pressed="true"]').length, 1)
  } finally { await unmount() }
})

test('personal holding selector excludes outside and component geometry', async () => {
  const { host, holdings, unmount } = await mountMap()
  try {
    const select = [...host.querySelectorAll('label.territory-filter')].find(label => label.textContent.includes('개인 영지')).querySelector('select')
    const optionIds = new Set([...select.options].map(option => option.value))
    assert.equal(optionIds.has('holding:daejeon-dong'), false)
    assert.equal(optionIds.has('holding:daejeon-yuseong'), false)
    for (const holding of holdings.holdings.filter(row => row.componentRefs?.length)) assert.equal(optionIds.has(holding.id), false)
    assert.ok([...optionIds].some(Boolean))
  } finally { await unmount() }
})

test('barony-independent map payload fails closed with no selectable fallback', async () => {
  const { host, unmount } = await mountMap(['/'], assets => {
    const geography = assets['opening-territories.json'].geography
    geography.titles.push({ ...geography.titles.find(title => title.rank === 'county'), id: 'geography:barony:fixture', rank: 'barony' })
  })
  try {
    assert.equal(host.querySelectorAll('[data-title-id], [data-station-id], select').length, 0)
    assert.ok(host.textContent.includes('불러오지 못했습니다'))
  } finally { await unmount() }
})

test('external title payload fails closed even when valid county counts remain', async () => {
  const { host, unmount } = await mountMap(['/?region=geography%3Aduchy%3A41131'], assets => {
    const geography = assets['opening-territories.json'].geography
    geography.titles.push({ ...geography.titles.find(title => title.rank === 'duchy'), id: 'geography:duchy:41131' })
  })
  try {
    assert.equal(host.querySelectorAll('[data-title-id], [tabindex="0"]').length, 0)
  } finally { await unmount() }
})

test('county slot fields match independent source facts through all four rank stages', async () => {
  const { host, unmount } = await mountMap()
  try {
    const source = JSON.parse(await readFile('lore/regions/seoul-electoral-titles.json', 'utf8'))
    const county = source.countySlots[0]
    await act(async () => { [...host.querySelectorAll('.territory-mode-toggle button')].find(button => button.textContent === '작위·영주 지도').click() })
    await act(async () => { host.querySelector(`[data-title-id="${county.countyTitleId}"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    const current = source.currentCorrespondenceSlots.find(row => row.countyTitleId === county.countyTitleId)
    for (const slot of [...county.slots, ...current.slots]) {
      const rendered = host.querySelector(`[data-barony-slot="${slot.slotId}"]`)
      assert.ok(rendered)
      assert.ok(rendered.textContent.includes(slot.name))
      assert.equal(rendered.dataset.slotStatus, slot.status)
      assert.ok(rendered.textContent.includes(slot.holderPersonId ?? '소유 미확인'))
    }
    const rank = host.querySelector('[aria-label="지리 작위 등급"]') ?? [...host.querySelectorAll('label.territory-filter')].find(label => label.textContent.includes('지리 작위 등급')).querySelector('select')
    for (const [value, count] of [['duchy', 25], ['kingdom', 6], ['empire', 1], ['county', 48]]) {
      await act(async () => { rank.value = value; rank.dispatchEvent(new Event('change', { bubbles: true })) })
      assert.equal(host.querySelectorAll(`[data-title-rank="${value}"]`).length, count)
      assert.equal(host.querySelectorAll('[data-title-rank="barony"]').length, 0)
    }
    await act(async () => { [...host.querySelectorAll('.territory-mode-toggle button')].find(button => button.textContent === '정치 지도').click() })
    assert.equal(host.querySelectorAll('[data-title-rank="county"]').length, 48)
  } finally { await unmount() }
})

for (const [route, labels] of [['/', ['직할', '봉신', '미배정']], ['/en/world/World-and-Subway-Layers', ['Direct rule', 'Vassal', 'Unassigned']]]) {
  test(`slot statuses are localized and machine values stay in attributes: ${route}`, async () => {
    const { host, unmount } = await mountMap([route], assets => {
      const county = assets['opening-territories.json'].geography.titles.find(title => title.rank === 'county')
      county.currentSlots.slice(0, 3).forEach((slot, index) => { slot.status = ['direct', 'vassal', 'unassigned'][index] })
    })
    try {
      await act(async () => { host.querySelector('.territory-mode-toggle button:last-child').click() })
      await act(async () => { host.querySelector('[data-title-rank="county"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
      const rows = [...host.querySelectorAll('[data-barony-slot]')].slice(-17, -14)
      assert.deepEqual(rows.map(row => row.dataset.slotStatus), ['direct', 'vassal', 'unassigned'])
      rows.forEach((row, index) => assert.ok(row.textContent.includes(labels[index])))
      assert.ok(rows.every(row => !/ · (direct|vassal|unassigned) · /u.test(row.textContent)))
    } finally { await unmount() }
  })
}
