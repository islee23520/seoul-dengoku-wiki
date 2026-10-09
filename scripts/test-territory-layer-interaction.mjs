// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OpeningTerritoryMap from '../src/components/OpeningTerritoryMap.tsx'

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, WebGLRenderer: class {
    domElement = document.createElement('canvas')
    setPixelRatio() {} setSize() {} render() {} dispose() {}
  } }
})

test.each(['three hegemon surface', 'label fallback', 'switch layers', 'keep active layer', 'choose ShinCHON', 'choose ShinCHON underground', 'select facility by stable station ID'])('selected segment interaction: %s', async (scenario) => {
  const data = JSON.parse(await readFile('public/opening-territories.json', 'utf8'))
  const edges = data.edges.filter((edge) => ['segment:신촌~이대', 'segment:동묘앞~신설동'].includes(edge.id))
  const duplicateStation = { ...data.stations.find((station) => station.id === '신촌'), id: 'fixture-overlap', name: '겹침 검증역', memberIds: ['fixture-overlap'] }
  const overlapEdge = { ...edges.find((edge) => edge.id === 'segment:신촌~이대'), id: 'segment:fixture-overlap~이대', a: 'fixture-overlap', b: '이대' }
  edges.push(overlapEdge)
  const stationIds = new Set(edges.flatMap((edge) => [edge.a, edge.b]))
  stationIds.add('Yeongdeungpo')
  const surface = scenario === 'three hegemon surface'
  const mapData = surface ? data : { ...data, hegemons: scenario === 'label fallback' ? data.hegemons : [], edges, stations: [...data.stations.filter((station) => stationIds.has(station.id)), duplicateStation], states: [], regions: [], landmarks: [], vassals: [], majorStationIds: [] }
  const terrain = { layers: [{ name: 'peninsula', file: 'fixture.bin', width: 1, height: 1, bboxEPSG5179: [0, 0, 1, 1] }], farWaterFile: 'water.json', attribution: '' }
  const assets = { 'opening-territories.json': mapData, 'regional-terrain.json': terrain, 'regional-boundaries.json': [], 'outside-admin-units.json': { units: [] }, 'outside-control-2126.json': { assignments: [] }, 'water.json': { features: [] } }
  assets['confirmed-person-holdings.json'] = JSON.parse(await readFile('public/confirmed-person-holdings.json', 'utf8'))
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  const canvasContext = { createImageData: () => ({ data: new Uint8ClampedArray(4) }), putImageData() {}, measureText: () => ({ width: 1 }), strokeText() {}, fillText() {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }) }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('fetch', async (url) => ({ ok: true, json: async () => assets[String(url).split('/').at(-1)], arrayBuffer: async () => new Uint16Array([500, 0]).buffer }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,')
  try {
    // Mock only graphics and offline asset transport; selection handlers and React
    // state transitions are the actual component behavior under test.
    await act(async () => { root.render(React.createElement(MemoryRouter, null, React.createElement(OpeningTerritoryMap))) })
    if (scenario === 'label fallback') {
      assert.equal(host.querySelector('[data-hegemon-label-fallback]').textContent, data.hegemons.map(item => item.name).join(' · '))
      return
    }
    if (surface) {
      const regions = [...host.querySelectorAll('[data-region-id]')]
      assert.equal(regions.length, 427)
      assert.equal(new Set(regions.map(region => region.getAttribute('fill'))).size, 3)
      for (const region of regions) {
        const hegemon = data.hegemons.find(item => item.memberStateIds.includes(region.getAttribute('data-state-id')))
        assert.equal(region.getAttribute('data-hegemon'), hegemon.name)
      }
      assert.deepEqual(new Set(host.querySelector('[data-hegemon-labels]').dataset.hegemonLabels.split('|')), new Set(data.hegemons.map(item => item.name)))
      assert.ok(host.querySelector('.territory-national-borders').getAttribute('d'))
      assert.ok(host.querySelector('.territory-subordinate-borders').getAttribute('d'))
      const select = [...host.querySelectorAll('select')].find(element => element.querySelector('optgroup'))
      assert.equal(select.querySelectorAll('optgroup').length, 3)
      for (const hegemon of data.hegemons) {
        await act(async () => { select.value = 'hegemon:' + hegemon.name; select.dispatchEvent(new Event('change', { bubbles: true })) })
        for (const region of host.querySelectorAll('[data-region-id]')) assert.equal(Number(region.getAttribute('fill-opacity')), hegemon.memberStateIds.includes(region.getAttribute('data-state-id')) ? 0.72 : 0.24)
      }
      await act(async () => { select.value = 'S01'; select.dispatchEvent(new Event('change', { bubbles: true })) })
      const capitalRegionId = data.states.find(state => state.id === 'S01').capitalRegionId
      for (const region of host.querySelectorAll('[data-region-id]')) assert.equal(Number(region.getAttribute('fill-opacity')), region.getAttribute('data-region-id') === capitalRegionId ? 0.95 : region.getAttribute('data-state-id') === 'S01' ? 0.72 : 0.24)
      const region = host.querySelector('[data-state-id="S01"]')
      await act(async () => { region.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
      const detail = [...host.querySelectorAll('#territory-detail-panel dl')].find(element => element.querySelector('dt')?.textContent === '직속 보유')
      assert.ok(detail.textContent.includes('S01 ' + data.states.find(state => state.id === 'S01').name))
      assert.ok(detail.textContent.includes(data.hegemons.find(item => item.memberStateIds.includes('S01')).name))
      assert.equal(host.querySelectorAll('.territory-flat-capital').length, 16)
      assert.equal(host.querySelectorAll('[data-vassal-marker]').length, 13)
      return
    }
    if (scenario === 'select facility by stable station ID') {
      const select = [...host.querySelectorAll('select')].find(element => [...element.options].some(option => option.value === 'holding:yeongdeungpo-concourse'))
      await act(async () => {
        select.value = 'holding:yeongdeungpo-concourse'
        select.dispatchEvent(new Event('change', { bubbles: true }))
      })
      const panel = host.querySelector('[data-selected-holding="holding:yeongdeungpo-concourse"]')
      assert.ok(panel)
      assert.equal(panel.querySelector('a').getAttribute('href'), '/people/person-0017')
      assert.equal(host.querySelectorAll('[data-holding-region]').length, 0)
      return
    }
    const layerButton = (name) => [...host.querySelectorAll('.territory-layer-toggle button')].find((button) => button.textContent === name)
    await act(async () => { layerButton('지하 영토').click() })
    const segment = host.querySelector('[data-underground-segment="segment:신촌~이대"]')
    if (scenario.startsWith('choose ')) {
      // jsdom has no SVG geometry; provide only the graphics boundary in screen pixels.
      vi.stubGlobal('DOMPoint', class {
        constructor(x, y) { this.x = x; this.y = y }
        matrixTransform() { return { x: this.x, y: this.y } }
      })
      for (const line of host.querySelectorAll('line[data-underground-segment]')) {
        for (const key of ['x1', 'y1', 'x2', 'y2']) Object.defineProperty(line, key, { configurable: true, value: { baseVal: { value: Number(line.getAttribute(key)) } } })
        line.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1 })
        line.getCTM = () => ({ a: 1, b: 0, c: 0, d: 1 })
      }
      const originalComputedStyle = window.getComputedStyle.bind(window)
      vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => element.matches('line[data-underground-segment]')
        ? { strokeWidth: element.getAttribute('stroke-width'), vectorEffect: 'non-scaling-stroke', display: 'inline', visibility: 'visible', opacity: '1', strokeOpacity: '1', stroke: '#fff' }
        : originalComputedStyle(element))
      const x = (Number(segment.getAttribute('x1')) + Number(segment.getAttribute('x2'))) / 2
      const y = (Number(segment.getAttribute('y1')) + Number(segment.getAttribute('y2'))) / 2
      // Select first so opening a chooser must survive unchanged prior selection state.
      await act(async () => { segment.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
      await act(async () => { segment.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: x, clientY: y })) })
      assert.equal(host.querySelectorAll('[data-segment-choice]').length, 2)
      const id = scenario === 'choose ShinCHON' ? 'segment:신촌~이대' : 'segment:fixture-overlap~이대'
      await act(async () => { host.querySelector(`[data-segment-choice="${id}"]`).click() })
      assert.equal(host.querySelector('#territory-detail-panel h3')?.textContent, scenario === 'choose ShinCHON' ? '신촌–이대' : '겹침 검증역–이대')
      assert.equal(host.querySelectorAll('[data-segment-choice]').length, 0)
      return
    }
    await act(async () => { segment.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    assert.equal(host.querySelector('#territory-detail-panel h3')?.textContent, '신촌–이대')
    if (scenario === 'keep active layer') {
      await act(async () => { layerButton('지하 영토').click() })
      assert.equal(host.querySelector('#territory-detail-panel h3')?.textContent, '신촌–이대')
      return
    }
    await act(async () => { layerButton('지상 영토').click() })
    assert.equal(host.querySelector('#territory-detail-panel') === null, true)
    await act(async () => { layerButton('지하 영토').click() })
    assert.equal(host.querySelector('#territory-detail-panel') === null, true)
    await act(async () => { host.querySelector('[data-underground-segment="segment:동묘앞~신설동"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    assert.equal(host.querySelector('#territory-detail-panel h3')?.textContent, '동묘앞–신설동')
  } finally {
    await act(async () => root.unmount())
    host.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  }
})
