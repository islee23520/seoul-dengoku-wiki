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

test.each(['switch layers', 'keep active layer'])('selected segment interaction: %s', async (scenario) => {
  const data = JSON.parse(await readFile('public/opening-territories.json', 'utf8'))
  const edges = data.edges.filter((edge) => ['segment:신촌~이대', 'segment:동묘앞~신설동'].includes(edge.id))
  const stationIds = new Set(edges.flatMap((edge) => [edge.a, edge.b]))
  const mapData = { ...data, edges, stations: data.stations.filter((station) => stationIds.has(station.id)), states: [], regions: [], landmarks: [], vassals: [], majorStationIds: [] }
  const terrain = { layers: [{ name: 'peninsula', file: 'fixture.bin', width: 1, height: 1, bboxEPSG5179: [0, 0, 1, 1] }], farWaterFile: 'water.json', attribution: '' }
  const assets = { 'opening-territories.json': mapData, 'regional-terrain.json': terrain, 'regional-boundaries.json': [], 'outside-admin-units.json': { units: [] }, 'outside-control-2126.json': { assignments: [] }, 'water.json': { features: [] } }
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
    const layerButton = (name) => [...host.querySelectorAll('.territory-layer-toggle button')].find((button) => button.textContent === name)
    await act(async () => { layerButton('지하 영토').click() })
    const segment = host.querySelector('[data-underground-segment="segment:신촌~이대"]')
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
