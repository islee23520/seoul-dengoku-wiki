// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { test } from 'vitest'
import CharacterDraftPage from '../src/pages/CharacterDraftPage.tsx'
import { peopleCatalog } from '../src/generated/peopleCatalog.ts'
import gurpsCast from '../lore/name-pools/gurps-cast.json'

const repo = (name) => new URL('../' + name, import.meta.url)

test('character draft route is public and stays distinct from issued person details', async () => {
  const app = await readFile(repo('src/App.tsx'), 'utf8')
  const page = await readFile(repo('src/pages/CharacterDraftPage.tsx'), 'utf8')
  const allowlist = JSON.parse(await readFile(repo('artifact-allowlist.json'), 'utf8'))
  assert.match(app, /path="\/people\/draft"/u)
  assert.ok(allowlist.routes.some(({ path, disposition }) => path === '/people/draft' && disposition === 'page'))
  assert.match(page, /정본은 바뀌지 않았습니다/u)
  assert.match(page, /초안 내보내기/u)
  assert.match(page, /gurps-cast/u)
  assert.doesNotMatch(page, /sheet-local|issue-person-ids|localStorage|sessionStorage/u)
})

test('mounted draft export downloads the edit without canon writes or id issuance', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const seeded = gurpsCast.people.find((person) => {
    const id = person.url?.split('/').at(-1)
    return id && peopleCatalog.some((entry) => entry.id === id && entry.name === person.name)
  })
  assert.ok(seeded)
  const personId = seeded.url.split('/').at(-1)
  const catalogEntry = peopleCatalog.find((entry) => entry.id === personId)
  const canonPaths = [
    'lore/name-pools/gurps-cast.json',
    'src/generated/peopleCatalog.ts',
    'src/pages/CharacterDraftPage.tsx',
    'src/pages/characterDraftExport.ts',
    'lore/name-pools/issue-person-ids.mjs',
  ]
  const canonBefore = new Map(canonPaths.map((path) => {
    const bytes = readFileSync(repo(path))
    return [path, { bytes, sha256: createHash('sha256').update(bytes).digest('hex') }]
  }))
  const storageBefore = {
    local: window.localStorage.length,
    session: window.sessionStorage.length,
  }
  const storageWrites = []
  const originalSetItem = Storage.prototype.setItem
  Storage.prototype.setItem = function recordStorageWrite(...args) {
    storageWrites.push(args)
    return originalSetItem.apply(this, args)
  }
  const writes = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const method = init?.method ?? 'GET'
    const url = String(input)
    if (method !== 'GET' || !url.endsWith(`/person-details/${personId}.json`)) writes.push({ kind: 'fetch', method, url })
    if (method !== 'GET') return new Response(null, { status: 405 })
    assert.equal(url.endsWith(`/person-details/${personId}.json`), true)
    return new Response(JSON.stringify({
      id: personId,
      name: catalogEntry.name,
      state: catalogEntry.state,
      rank: catalogEntry.rank,
      gender: catalogEntry.gender,
      occupation: catalogEntry.occupation,
      role: { display: catalogEntry.position },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const downloads = []
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalClick = HTMLAnchorElement.prototype.click
  URL.createObjectURL = (blob) => {
    downloads.push({ blob })
    return 'blob:draft-export'
  }
  URL.revokeObjectURL = (url) => {
    downloads.at(-1).revoked = url
  }
  HTMLAnchorElement.prototype.click = function recordDownload() {
    downloads.at(-1).href = this.href
    downloads.at(-1).download = this.download
  }
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  try {
    await act(async () => {
      root.render(createElement(MemoryRouter, { initialEntries: [`/people/draft?person=${personId}`] }, createElement(CharacterDraftPage)))
    })
    const name = host.querySelector('input[placeholder="이름 입력"]')
    assert.equal(name.value, catalogEntry.name)
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    valueSetter.call(name, '초안 수정 이름')
    await act(async () => {
      name.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const exportButton = [...host.querySelectorAll('button')].find((button) => button.textContent === '초안 내보내기')
    assert.equal(exportButton.disabled, false)
    await act(async () => {
      exportButton.click()
    })
    assert.equal(downloads.length, 1)
    assert.equal(downloads[0].href, 'blob:draft-export')
    assert.equal(downloads[0].download, 'character-gurps.json')
    assert.equal(downloads[0].revoked, 'blob:draft-export')
    assert.equal(downloads[0].blob.type, 'application/json')
    const exported = JSON.parse(await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(downloads[0].blob)
    }))
    assert.equal(exported.personId, personId)
    assert.equal(exported.name, '초안 수정 이름')
    assert.deepEqual(exported.sourceGurps, seeded)
    for (const field of ['aiKey', 'aiModel', 'aiGenerating', 'aiMessage']) assert.equal(Object.hasOwn(exported, field), false)
    assert.deepEqual(writes, [])
    assert.deepEqual(storageWrites, [])
    assert.deepEqual({ local: window.localStorage.length, session: window.sessionStorage.length }, storageBefore)
    for (const [path, before] of canonBefore) {
      const bytes = readFileSync(repo(path))
      assert.equal(createHash('sha256').update(bytes).digest('hex'), before.sha256)
      assert.deepEqual([...bytes], [...before.bytes])
    }
  } finally {
    await act(async () => root.unmount())
    host.remove()
    Storage.prototype.setItem = originalSetItem
    globalThis.fetch = originalFetch
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    HTMLAnchorElement.prototype.click = originalClick
  }
})
