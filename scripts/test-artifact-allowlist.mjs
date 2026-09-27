import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'

import { artifactFailures, routerPaths } from './check-artifact-allowlist.mjs'

const root = resolve(import.meta.dirname, '..')
const allowlist = JSON.parse(await readFile(resolve(root, 'artifact-allowlist.json'), 'utf8'))
const appSource = await readFile(resolve(root, 'src/App.tsx'), 'utf8')
const scratch = resolve(root, '.omo/evidence/lore-wiki-issues-sweep/T5')

async function fixture(extra = {}, omit = []) {
  await mkdir(scratch, { recursive: true })
  const dist = await mkdtemp(join(scratch, 'dist-'))
  const files = {
    ...Object.fromEntries(allowlist.rootFiles.map((file) => [file, '{}'])),
    'wiki-contract.json': JSON.stringify({ documents: [{ slug: 'Ailments' }], englishDocuments: [{ slug: 'Ailments' }] }),
    'person-details/person-0001.json': '{}',
    'regional-terrain-tiles/0-0.bin': '',
    'regional-terrain-tiles/0-0-water.json': '{}',
    'state-flags/S01.webp': '',
    'assets/index-AbCd1234.js': '',
    'assets/index-AbCd1234.css': '',
    'assets/Ailments-Zz9_Yx-8.js': '',
    'assets/lib/mermaid.core-AbCd1234.js': '',
    ...extra,
  }
  for (const file of omit) delete files[file]
  for (const [file, body] of Object.entries(files)) {
    await mkdir(dirname(join(dist, file)), { recursive: true })
    await writeFile(join(dist, file), body)
  }
  return dist
}

test('a dist matching the allowlist and the current router passes', async () => {
  const dist = await fixture()
  try {
    assert.deepEqual(await artifactFailures({ distRoot: dist, allowlist, appSource }), [])
    assert.deepEqual(routerPaths(appSource).toSorted(), allowlist.routes.map(({ path }) => path).toSorted())
  } finally { await rm(dist, { recursive: true, force: true }) }
})

test('unlisted files, private chunks and missing artifacts fail', async () => {
  const cases = [
    [{ 'debug.json': '{}' }, [], /E_ARTIFACT_UNLISTED: debug\.json/],
    [{ 'person-details/person-1.json': '{}' }, [], /E_ARTIFACT_UNLISTED: person-details\/person-1\.json/],
    [{ 'drafts/Cast-Profile-Contract.json': '{}' }, [], /E_ARTIFACT_UNLISTED: drafts\/Cast-Profile-Contract\.json/],
    [{ 'assets/Cast-Profile-Contract-AbCd1234.js': '' }, [], /E_ARTIFACT_CHUNK: assets\/Cast-Profile-Contract-AbCd1234\.js/],
    [{ 'assets/unhashed.js': '' }, [], /E_ARTIFACT_UNLISTED: assets\/unhashed\.js/],
    [{ 'assets/lib/Cast-Profile-Contract.json': '{}' }, [], /E_ARTIFACT_UNLISTED: assets\/lib\/Cast-Profile-Contract\.json/],
    [{ 'assets/lib/nested/katex-AbCd1234.js': '' }, [], /E_ARTIFACT_UNLISTED: assets\/lib\/nested\/katex-AbCd1234\.js/],
    [{}, ['opening-territories.json'], /E_ARTIFACT_MISSING: opening-territories\.json/],
    [{}, ['state-flags/S01.webp'], /E_ARTIFACT_MISSING: state-flags\//],
  ]
  for (const [extra, omit, expected] of cases) {
    const dist = await fixture(extra, omit)
    try {
      const failures = await artifactFailures({ distRoot: dist, allowlist, appSource })
      assert.equal(failures.length, 1, `${expected}: ${failures.join('; ')}`)
      assert.match(failures[0], expected)
    } finally { await rm(dist, { recursive: true, force: true }) }
  }
})

test('a router path without a recorded disposition, or a stale disposition, fails', async () => {
  const dist = await fixture()
  try {
    const added = appSource.replace('<Route path="*"', '<Route path="/drafts" element={null} />\n        <Route path="*"')
    assert.deepEqual(await artifactFailures({ distRoot: dist, allowlist, appSource: added }), ['E_ROUTE_UNDISPOSED: /drafts'])
    const removed = appSource.replace(/\s*<Route path="\/updates"[^\n]*/, '')
    assert.deepEqual(await artifactFailures({ distRoot: dist, allowlist, appSource: removed }), ['E_ROUTE_STALE: /updates'])
    const invalid = { ...allowlist, routes: allowlist.routes.map((route) => route.path === '/' ? { ...route, disposition: 'unknown' } : route) }
    assert.deepEqual(await artifactFailures({ distRoot: dist, allowlist: invalid, appSource }), ['E_ROUTE_DISPOSITION: / unknown'])
  } finally { await rm(dist, { recursive: true, force: true }) }
})
