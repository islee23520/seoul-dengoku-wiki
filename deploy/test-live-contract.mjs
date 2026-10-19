import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const checker = new URL('./check-live-contract.mjs', import.meta.url).pathname
const protectedRoutes = ['/system-design/regions', '/system-design/regions/', '/gdd/']
const wikiRoutes = ['/wiki/world/Test', '/wiki/world/World-Unbinding.html', '/wiki/world/World-Unbinding', '/wiki/world/', '/wiki/', '/wiki/states']
const secret = 'private-access-query-value'
const login = `https://linalab.cloudflareaccess.com/cdn-cgi/access/login/127.0.0.1?state=${secret}`

const runContract = async ({ override = () => undefined, publicEdge = true } = {}) => {
  const directory = await mkdtemp(join(tmpdir(), 'live-contract-'))
  const catalog = join(directory, 'catalog.ts')
  const output = join(directory, 'result.json')
  await writeFile(catalog, '{ domain: \'world\', slug: \'Test\', route: \'/world/Test\', title: "Test" }')
  const requested = []
  const server = createServer((request, response) => {
    requested.push(request.url)
    const custom = override(request.url)
    if (custom) {
      response.writeHead(custom.status, custom.location ? { location: custom.location } : {})
      response.end(custom.body ?? '')
    } else if (publicEdge && protectedRoutes.includes(request.url)) {
      response.writeHead(302, { location: login })
      response.end()
    } else if (!publicEdge && protectedRoutes.slice(0, 2).includes(request.url)) {
      response.writeHead(308, { location: '/wiki/world/World-and-Subway-Layers' })
      response.end()
    } else if (wikiRoutes.includes(request.url) || !publicEdge) {
      response.end('<div id="root"></div>')
    } else {
      response.writeHead(500)
      response.end()
    }
  })
  const listening = once(server, 'listening')
  server.listen(0, '127.0.0.1')
  await listening
  try {
    const args = [checker, ...(publicEdge ? ['--public-edge'] : []), `http://127.0.0.1:${server.address().port}`, output, catalog]
    let stdout
    let code = 0
    try {
      ;({ stdout } = await exec(process.execPath, args))
    } catch (error) {
      code = error.code
      stdout = error.stdout
      assert.equal(error.stderr, '')
    }
    const saved = await readFile(output, 'utf8')
    assert.equal(saved.trim(), stdout.trim())
    assert.ok(!saved.includes(secret))
    return { result: JSON.parse(stdout), code, requested }
  } finally {
    const closed = once(server, 'close')
    server.close()
    server.closeAllConnections()
    await closed
    await rm(directory, { recursive: true, force: true })
  }
}

test('public edge checks every wiki route and Access redirect without following login', { timeout: 5000 }, async () => {
  const { result, code, requested } = await runContract()
  assert.equal(code, 0)
  assert.equal(result.status, 'PASS')
  assert.equal(result.documents, 1)
  assert.equal(result.protectedRoutes, 3)
  assert.deepEqual(requested, [...wikiRoutes, ...protectedRoutes])
})

for (const route of protectedRoutes) {
  for (const status of [200, 308]) test(`public edge rejects protected ${route} returning ${status}`, { timeout: 5000 }, async () => {
    const { result, code } = await runContract({ override: path => path === route ? { status, location: login } : undefined })
    assert.equal(code, 1)
    assert.ok(result.failures.includes(`access-http:${status}:${route}`))
  })
}

for (const location of [
  undefined,
  'not a URL',
  '/cdn-cgi/access/login/127.0.0.1',
  login.replace('https:', 'http:'),
  login.replace('linalab.cloudflareaccess.com', 'other.cloudflareaccess.com'),
  login.replace('127.0.0.1', 'other.example'),
  login.replace('https://', 'https://user:password@'),
]) test(`public edge rejects incorrect Access destination ${location?.split('?')[0]}`, { timeout: 5000 }, async () => {
  const { result, code } = await runContract({ override: path => path === '/gdd/' ? { status: 302, location } : undefined })
  assert.equal(code, 1)
  assert.deepEqual(result.failures, ['access-location:/gdd/'])
})

for (const route of wikiRoutes) test(`public edge requires the React marker on ${route}`, { timeout: 5000 }, async () => {
  const { result, code } = await runContract({ override: path => path === route ? { status: 200, body: 'Access login' } : undefined })
  assert.equal(code, 1)
  assert.deepEqual(result.failures, [`not-react-entry:${route}`])
})

test('public edge does not follow a wiki redirect even to a valid React entry', { timeout: 5000 }, async () => {
  const { result, code, requested } = await runContract({ override: path => path === '/wiki/' ? { status: 302, location: '/wiki/states' } : undefined })
  assert.equal(code, 1)
  assert.ok(result.failures.includes('http:302:/wiki/'))
  assert.equal(requested.filter(path => path === '/wiki/states').length, 1)
})

test('origin mode retains origin-only routes and HTTP 308 region redirects', { timeout: 5000 }, async () => {
  const { result, code, requested } = await runContract({ publicEdge: false })
  assert.equal(code, 0)
  assert.equal(result.status, 'PASS')
  assert.equal(result.regressionRoutes, 7)
  assert.equal(result.redirectRoutes, 2)
  for (const route of ['/', '/gdd/', '/gdd/documents', '/gdd/data', '/play/']) assert.ok(requested.includes(route))
})

test('origin mode rejects an incorrect redirect without logging Location query values', { timeout: 5000 }, async () => {
  const { result, code } = await runContract({
    publicEdge: false,
    override: path => path === '/system-design/regions' ? { status: 308, location: `/wrong?state=${secret}` } : undefined,
  })
  assert.equal(code, 1)
  assert.deepEqual(result.failures, ['redirect-location:/system-design/regions:/wrong'])
})
