import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { configuredVersionStore } from './mcp-character-server.mjs'
import { REVISIONS } from './original-character-api.mjs'
import { pathFor, root, sources, test } from './character-api-test-fixtures.mjs'
const run = promisify(execFile)

const configuration = () => ({
  CHARACTER_PARENT_PIN_SOURCE: fileURLToPath(new URL('../vendor/issued-history/' + REVISIONS[0] + '.json', import.meta.url)),
  CHARACTER_POPULATED_SOURCE: fileURLToPath(new URL('../vendor/issued-history/' + REVISIONS[1] + '.json', import.meta.url)),
})

test('configured version store requires both sealed file paths and verifies their exact bytes', async () => {
  const config = configuration()
  for (const path of Object.values(config)) assert.equal(typeof path, 'string', 'explicit sealed fixture path required')
  const bound = configuredVersionStore(config)
  for (const selected of REVISIONS) assert.deepEqual(bound.read(selected), JSON.parse(sources.get(selected)))
  for (const absent of [{}, { CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_PARENT_PIN_SOURCE },
    { CHARACTER_POPULATED_SOURCE: config.CHARACTER_POPULATED_SOURCE },
    { ...config, CHARACTER_PARENT_PIN_SOURCE: '' }, { ...config, CHARACTER_POPULATED_SOURCE: '' }]) {
    assert.throws(() => configuredVersionStore(absent), error => error.status === 503 && error.message === 'E_VERSION_STORE_BINDING')
  }
  for (const wrong of [
    { ...config, CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_POPULATED_SOURCE },
    { ...config, CHARACTER_POPULATED_SOURCE: config.CHARACTER_PARENT_PIN_SOURCE },
    { ...config, CHARACTER_POPULATED_SOURCE: fileURLToPath(new URL('../package.json', import.meta.url)) },
  ]) assert.throws(() => configuredVersionStore(wrong), error => error.status === 503 && error.message === 'E_SOURCE_HASH')
  assert.throws(() => configuredVersionStore({ ...config, CHARACTER_PARENT_PIN_SOURCE: root + '/.omo/evidence/original-api/nonexistent-sealed-source.json' }), error => error.code === 'ENOENT')
  for (const [index, path] of Object.values(config).entries()) assert.deepEqual(await readFile(path), sources.get(REVISIONS[index]))
})

test('standalone CLI rejects incomplete or mismatched sources before listening', async () => {
  const config = configuration()
  const clean = { ...process.env, MCP_PORT: '0' }
  delete clean.CHARACTER_PARENT_PIN_SOURCE
  delete clean.CHARACTER_POPULATED_SOURCE
  for (const [supplied, expected] of [
    [{}, 'E_VERSION_STORE_BINDING'],
    [{ CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_PARENT_PIN_SOURCE }, 'E_VERSION_STORE_BINDING'],
    [{ CHARACTER_POPULATED_SOURCE: config.CHARACTER_POPULATED_SOURCE }, 'E_VERSION_STORE_BINDING'],
    [{ ...config, CHARACTER_PARENT_PIN_SOURCE: config.CHARACTER_POPULATED_SOURCE }, 'E_SOURCE_HASH'],
  ]) {
    await assert.rejects(run(process.execPath, [fileURLToPath(new URL('./mcp-character-server.mjs', import.meta.url))], {
      cwd: root, env: { ...clean, ...supplied }, timeout: 5000,
    }), error => {
      assert.equal(error.code, 1)
      assert.equal(error.killed, false)
      assert.equal(error.stdout, '')
      assert.ok(error.stderr.includes(expected), error.stderr)
      return true
    })
  }
})

test('standalone CLI binds explicit files, serves both revisions over HTTP and shuts down', async () => {
  const config = configuration()
  const before = await Promise.all(Object.values(config).map(path => readFile(path)))
  const child = spawn(process.execPath, [fileURLToPath(new URL('./mcp-character-server.mjs', import.meta.url))], {
    cwd: root, env: { ...process.env, ...config, MCP_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  })
  const closed = once(child, 'close', { signal: AbortSignal.timeout(20000) })
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk })
  // Subscribe immediately to the child readiness stream; HTTP begins only after
  // its real listen callback emits the selected ephemeral loopback address.
  const listening = new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => { cleanup(); reject(new Error('CLI listening timeout: ' + stderr)) }, 5000)
    const onExit = () => { cleanup(); reject(new Error('CLI exited before listening: ' + stderr)) }
    const onError = error => { cleanup(); reject(error) }
    const onData = chunk => {
      output += chunk
      const match = output.match(/http:\/\/127\.0\.0\.1:([0-9]+)/u)
      if (match) { cleanup(); resolve(match[0]) }
    }
    function cleanup() {
      clearTimeout(timeout)
      child.off('error', onError)
      child.off('exit', onExit)
      child.stdout.off('data', onData)
    }
    child.once('error', onError)
    child.once('exit', onExit)
    child.stdout.on('data', onData)
  })
  let address
  try {
    address = await listening
    const request = async path => {
      const response = await fetch(address + path, { signal: AbortSignal.timeout(5000) })
      return { status: response.status, body: await response.json() }
    }
    for (const selected of REVISIONS) {
      const original = JSON.parse(sources.get(selected))
      const listed = await request(pathFor('/api/characters', selected))
      assert.equal(listed.status, 200)
      assert.equal(listed.body.count, original.people.length)
      assert.equal(listed.body.revision, selected)
      for (const id of ['K001', 'K998', 'K1003', 'K1018', 'K1022']) {
        const person = original.people.find(item => item.id === id)
        for (const route of [id, person.url.split('/').pop()]) {
          const result = await request(pathFor('/api/characters/' + route + '/sheet', selected))
          assert.equal(result.status, 200)
          assert.equal(result.body.revision, selected)
          assert.equal(result.body.originalProfile, null)
          assert.deepEqual(result.body.legacy, person)
        }
      }
    }
    assert.deepEqual(await request('/api/characters'), { status: 400, body: { error: 'E_EXPLICIT_REVISION' } })
    assert.deepEqual(await request(pathFor('/api/characters') + '&audience=public'), { status: 403, body: { error: 'E_PRIVATE_AUTHOR_API' } })
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
    const [code, signal] = await closed
    assert.equal(code, null)
    assert.equal(signal, 'SIGTERM')
    assert.equal(stderr, '')
  }
  await assert.rejects(fetch(address + '/mcp/tools', { signal: AbortSignal.timeout(5000) }))
  for (const [index, path] of Object.values(config).entries()) assert.deepEqual(await readFile(path), before[index])
})
