import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, mkdir, copyFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'

test('character API starts and resolves issued IDs and URL identities without mutating canon', async () => {
  const root = await mkdtemp(join(tmpdir(), 'character-api-'))
  await mkdir(join(root, 'scripts'))
  await mkdir(join(root, 'lore/name-pools'), { recursive: true })
  await copyFile(new URL('./mcp-character-server.mjs', import.meta.url), join(root, 'scripts/server.mjs'))
  await copyFile(new URL('../lore/name-pools/gurps-cast.json', import.meta.url), join(root, 'lore/name-pools/gurps-cast.json'))
  const dataPath = join(root, 'lore/name-pools/gurps-cast.json')
  const before = await readFile(dataPath, 'utf8')
  const child = spawn(process.execPath, [join(root, 'scripts/server.mjs')], { env: { ...process.env, HOME: root, MCP_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk })
  const exit = once(child, 'exit')
  try {
    const address = await new Promise((resolve, reject) => {
      let output = ''
      const timeout = setTimeout(() => reject(new Error('startup timeout: ' + stderr)), 5000)
      child.once('error', reject)
      child.once('exit', code => { clearTimeout(timeout); reject(new Error('server exited ' + code + ': ' + stderr)) })
      child.stdout.on('data', chunk => {
        output += chunk
        const match = output.match(new RegExp('http://127[.]0[.]0[.]1:([0-9]+)', 'u'))
        if (match) { clearTimeout(timeout); resolve(match[0]) }
      })
    })
    const request = async (path, options) => {
      const response = await fetch(address + path, { ...options, signal: AbortSignal.timeout(5000) })
      return { status: response.status, body: response.status === 204 ? null : await response.json() }
    }
    const issued = await request('/api/characters/K1003')
    const url = await request('/api/characters/person-1003')
    assert.equal(issued.status, 200)
    assert.equal(url.status, 200)
    assert.deepEqual(url.body, issued.body)
    assert.equal(url.body.id, 'K1003')
    assert.equal(url.body.url, '/people/person-1003')
    assert.equal((await request('/api/characters/person-99999')).status, 404)
    assert.equal((await request('/api/characters/person-1003-extra')).status, 404)
    assert.equal((await request('/api/characters/K1003/sheet')).status, 200)
    assert.equal((await request('/api/characters/person-1003/sheet')).status, 200)
    assert.equal((await request('/api/characters')).body.count, JSON.parse(before).people.length)
    assert.equal((await request('/mcp/tools')).body.tools.length, 5)
    assert.equal((await request('/api/characters', { method: 'OPTIONS' })).status, 204)
    assert.equal((await request('/api/characters', { method: 'POST', body: '{' })).status, 400)
    assert.equal((await request('/api/characters/person-1003', { method: 'PATCH', body: '{' })).status, 400)
    // A URL alias must find the issued record before sheet validation, just as its K ID does.
    const patchId = await request('/api/characters/K1003', { method: 'PATCH', body: '{}' })
    const patchUrl = await request('/api/characters/person-1003', { method: 'PATCH', body: '{}' })
    assert.equal(patchId.status, 400)
    assert.deepEqual(patchUrl, patchId)
    assert.equal((await request('/api/settlements/test/npcs')).status, 200)
    assert.equal((await request('/api/settlements/test/generate-npcs', { method: 'POST', body: '{' })).status, 400)
    assert.equal(await readFile(dataPath, 'utf8'), before)
  } finally {
    child.kill('SIGTERM')
    await exit
    await rm(root, { recursive: true, force: true })
  }
})
