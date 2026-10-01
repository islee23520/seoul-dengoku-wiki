import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { StyleDownloadPanel } from '../src/pages/StyleDownloadPanel.tsx'

// The exporter emits YAML values as JSON scalars, including its camera/pose maps.
const parseYaml = text => Object.fromEntries(text.split('\n').map(line => {
  const colon = line.indexOf(':')
  return [line.slice(0, colon), JSON.parse(line.slice(colon + 1))]
}))

test('style source displays, copies and downloads the same canonical stylePrompt without a person', async () => {
  const source = {
    styleId: 'export-fixture', referenceSha256: 'a'.repeat(64),
    stylePrompt: 'Ink "quote" \\ line\n한국어: # detail', camera: {}, pose: {},
  }
  const expected = {
    schemaVersion: 1, styleId: 'export-fixture', referenceSha256: 'a'.repeat(64),
    stylePrompt: 'Ink "quote" \\ line\n한국어: # detail', camera: {}, pose: {},
  }
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/wiki/' })
  const saved = new Map()
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  }
  const copied = [], downloads = [], blobs = new Map(), revoked = []
  let deny = false
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { if (deny) throw new Error('denied'); copied.push(text) } }, configurable: true })
  const create = URL.createObjectURL, revoke = URL.revokeObjectURL
  URL.createObjectURL = blob => { const url = `blob:export-${blobs.size}`; blobs.set(url, blob); return url }
  URL.revokeObjectURL = url => revoked.push(url)
  dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push({ name: this.download, blob: blobs.get(this.href), url: this.href }) }
  const root = createRoot(document.getElementById('root'))
  try {
    await act(async () => root.render(createElement(StyleDownloadPanel, { source })))
    assert.equal(document.querySelector('textarea').value, expected.stylePrompt)
    const buttons = [...document.querySelectorAll('button')]
    assert.equal(buttons.length, 3)
    await act(async () => buttons[0].click())
    assert.deepEqual(copied, [expected.stylePrompt])
    await act(async () => { buttons[1].click(); buttons[2].click() })
    assert.deepEqual(JSON.parse(await downloads[0].blob.text()), expected)
    assert.deepEqual(parseYaml(await downloads[1].blob.text()), expected)
    assert.deepEqual(downloads.map(x => x.name), ['export-fixture.json', 'export-fixture.yaml'])
    assert.deepEqual(downloads.map(x => x.blob.type), ['application/json', 'text/yaml'])
    assert.deepEqual(revoked, downloads.map(x => x.url))
    deny = true
    await act(async () => buttons[0].click())
    assert.deepEqual(copied, [expected.stylePrompt])
    await act(async () => root.render(createElement(StyleDownloadPanel, { source: null })))
    assert.equal(document.querySelectorAll('button,textarea').length, 0)
  } finally {
    await act(async () => root.unmount())
    URL.createObjectURL = create; URL.revokeObjectURL = revoke
    for (const [key, descriptor] of saved) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]
    dom.window.close()
  }
})

test('original source maps style-only data before selection without changing the character pipeline', () => {
  const style = JSON.parse(readFileSync(new URL('../public/portrait-style-original-c3a7e481.json', import.meta.url)))
  assert.equal(style.referenceSha256, 'c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9')
  assert.equal(style.referenceRole, 'style-only')
  assert.equal(typeof style.stylePrompt, 'string')
  assert.ok(style.stylePrompt.length > 0)
  assert.deepEqual(style.camera, {})
  assert.deepEqual(style.pose, {})
})
