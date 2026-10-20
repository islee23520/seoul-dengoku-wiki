import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { test } from 'vitest'
import proj4 from 'proj4'

import { artifactFailures, routerPaths } from './check-artifact-allowlist.mjs'

const root = resolve(import.meta.dirname, '..')
const allowlist = JSON.parse(await readFile(resolve(root, 'artifact-allowlist.json'), 'utf8'))
const appSource = await readFile(resolve(root, 'src/App.tsx'), 'utf8')
const scratch = resolve(root, '.omo/evidence/lore-wiki-issues-sweep/T5')
const seoulPolygons = [[[[126.9, 37.4], [127.1, 37.4], [127.1, 37.7], [126.9, 37.7], [126.9, 37.4]]]]
const point = (longitude, latitude) => proj4('EPSG:4326', 'EPSG:5179', [longitude, latitude])
const opening = {
  schema: 'seoul-opening-territories.v1', geography: { titles: [{ id: 'geography:empire:seoul', path: 'M0,0 L1,0 Z' }] },
  physicalRail: { projection: 'EPSG:5179', boundarySha256: '6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4',
    osmSha256: '70007aa979f8e362ca609fdc2d6302164c2f1379f11c8fc5fd39a7a2e79d3c17',
    stationBindingStatus: 'missing-evidence', passage2126: 'unknown', paths: [{ id: 'osm:1', osmWay: 1, mode: 'rail', lineId: 'osm:railway:rail', points: [point(126.98, 37.55), point(127, 37.56)] }],
  },
}
const check = (dist, list = allowlist, source = appSource) => artifactFailures({ distRoot: dist, allowlist: list, appSource: source, seoulPolygons })

async function fixture(extra = {}, omit = []) {
  await mkdir(scratch, { recursive: true })
  const dist = await mkdtemp(join(scratch, 'dist-'))
  const files = {
    ...Object.fromEntries(allowlist.rootFiles.map((file) => [file, '{}'])),
    'wiki-contract.json': JSON.stringify({ documents: [{ slug: 'Ailments' }], englishDocuments: [{ slug: 'Ailments' }] }),
    'opening-territories.json': JSON.stringify(opening),
    'person-details/person-0001.json': '{}',
    'portrait-tokens/person-0001.json': '{}',
    'portrait-reviews/person-0001.json': '{}',
    'portraits/person-0001.png': '',
    'state-flags/S01.webp': '',
    'clan-crests/index.json': '{}',
    'family-trees/ae40-ac15-b989-91d1.json': '{}',
    'assets/index-AbCd1234.js': '',
    'assets/index-AbCd1234.css': '',
    'assets/FamilyTree-AbCd1234.js': '',
    'assets/FamilyTree-AbCd1234.css': '',
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
    assert.deepEqual(await check(dist), [])
    assert.deepEqual(routerPaths(appSource).toSorted(), allowlist.routes.map(({ path }) => path).toSorted())
  } finally { await rm(dist, { recursive: true, force: true }) }
})

test('unlisted files, private chunks and missing artifacts fail', async () => {
  const cases = [
    [{ 'debug.json': '{}' }, [], /E_ARTIFACT_UNLISTED: debug\.json/],
    [{ 'person-details/person-1.json': '{}' }, [], /E_ARTIFACT_UNLISTED: person-details\/person-1\.json/],
    [{ 'portrait-reviews/person-1.json': '{}' }, [], /E_ARTIFACT_UNLISTED: portrait-reviews\/person-1\.json/],
    [{ 'drafts/Cast-Profile-Contract.json': '{}' }, [], /E_ARTIFACT_UNLISTED: drafts\/Cast-Profile-Contract\.json/],
    [{ 'assets/Cast-Profile-Contract-AbCd1234.js': '' }, [], /E_ARTIFACT_CHUNK: assets\/Cast-Profile-Contract-AbCd1234\.js/],
    [{ 'assets/unhashed.js': '' }, [], /E_ARTIFACT_UNLISTED: assets\/unhashed\.js/],
    [{ 'assets/lib/Cast-Profile-Contract.json': '{}' }, [], /E_ARTIFACT_UNLISTED: assets\/lib\/Cast-Profile-Contract\.json/],
    [{ 'assets/lib/nested/katex-AbCd1234.js': '' }, [], /E_ARTIFACT_UNLISTED: assets\/lib\/nested\/katex-AbCd1234\.js/],
    [{}, ['opening-territories.json'], /E_ARTIFACT_MISSING: opening-territories\.json/],
    [{ 'regional-terrain.json': '{}' }, [], /E_ARTIFACT_UNLISTED: regional-terrain\.json/],
    [{ 'regional-terrain-tiles/0-0.bin': '' }, [], /E_ARTIFACT_UNLISTED: regional-terrain-tiles\/0-0\.bin/],
    [{}, ['seoul-terrain-clip.json'], /E_ARTIFACT_MISSING: seoul-terrain-clip\.json/],
    [{}, ['state-flags/S01.webp'], /E_ARTIFACT_MISSING: state-flags\//],
    [{}, ['portrait-reviews/person-0001.json'], /E_ARTIFACT_MISSING: portrait-reviews\//],
  ]
  for (const [extra, omit, expected] of cases) {
    const dist = await fixture(extra, omit)
    try {
      const failures = await check(dist)
      assert.equal(failures.length, 1, `${expected}: ${failures.join('; ')}`)
      assert.match(failures[0], expected)
    } finally { await rm(dist, { recursive: true, force: true }) }
  }
})

test('an allowlisted direct outside assignment and retired railway asset fail by content and scope', async () => {
  const listed = { ...allowlist, rootFiles: [...allowlist.rootFiles, 'admin-territorial-scale.json', 'outside-admin-units.json', 'northern-rail.json'] }
  const dist = await fixture({
    'admin-territorial-scale.json': '{}',
    'outside-admin-units.json': JSON.stringify({ units: [{ id: '2812551000', province: '인천광역시' }] }),
    'northern-rail.json': JSON.stringify({ paths: [{ points: [point(126.98, 37.55), point(127.5, 37.8)] }] }),
  })
  try {
    const failures = await check(dist, listed)
    assert.ok(failures.some(failure => /E_ARTIFACT_SEOUL_SCOPE: admin-territorial-scale\.json/.test(failure)))
    assert.ok(failures.some(failure => /E_ARTIFACT_SEOUL_SCOPE: outside-admin-units\.json/.test(failure)))
    assert.ok(failures.some(failure => /E_ARTIFACT_SEOUL_SCOPE: northern-rail\.json/.test(failure)))
  } finally { await rm(dist, { recursive: true, force: true }) }
})

test('opening payload rejects outside assignment and physical railway beyond Seoul even when listed', async () => {
  for (const payload of [
    { ...opening, vassals: [{ city: '인천', suzerain: 'S06' }] },
    { ...opening, physicalRail: { ...opening.physicalRail, paths: [{ ...opening.physicalRail.paths[0], points: [point(126.98, 37.55), point(127.5, 37.8)] }] } },
    { ...opening, physicalRail: { ...opening.physicalRail, passage2126: 'open' } },
  ]) {
    const dist = await fixture({ 'opening-territories.json': JSON.stringify(payload) })
    try { assert.ok((await check(dist)).some(failure => failure.startsWith('E_ARTIFACT_SEOUL_SCOPE: opening-territories.json'))) }
    finally { await rm(dist, { recursive: true, force: true }) }
  }
})

test('rail boundary coverage tolerates projection ulps but rejects outside vertices and interior crossings', async () => {
  const paths = [
    { points: [point(126.9, 37.55), point(127, 37.56)], fails: false },
    { points: [point(126.9 - 2e-14, 37.55), point(127, 37.56)], fails: false },
    { points: [point(126.9 - 1e-8, 37.55), point(127, 37.56)], fails: true },
    { points: [point(126.9 - 1e-8, 37.55), point(126.9 - 1e-8, 37.56)], fails: true },
  ]
  for (const { points, fails } of paths) {
    const payload = { ...opening, physicalRail: { ...opening.physicalRail, paths: [{ ...opening.physicalRail.paths[0], points }] } }
    const dist = await fixture({ 'opening-territories.json': JSON.stringify(payload) })
    try { assert.equal((await check(dist)).length, fails ? 1 : 0) }
    finally { await rm(dist, { recursive: true, force: true }) }
  }
  // The hole is away from the segment midpoint: endpoints and midpoint alone
  // cannot reject this genuine excursion, so interior crossings must still fail.
  const hole = [[126.93, 37.54], [126.94, 37.54], [126.94, 37.56], [126.93, 37.56], [126.93, 37.54]]
  const payload = { ...opening, physicalRail: { ...opening.physicalRail, paths: [{ ...opening.physicalRail.paths[0], points: [point(126.91, 37.55), point(127.09, 37.55)] }] } }
  const dist = await fixture({ 'opening-territories.json': JSON.stringify(payload) })
  try {
    const failures = await artifactFailures({ distRoot: dist, allowlist, appSource, seoulPolygons: [[seoulPolygons[0][0], hole]] })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /E_ARTIFACT_SEOUL_SCOPE/)
  } finally { await rm(dist, { recursive: true, force: true }) }
})

test('a router path without a recorded disposition, or a stale disposition, fails', async () => {
  const dist = await fixture()
  try {
    const added = appSource.replace('<Route path="*"', '<Route path="/drafts" element={null} />\n        <Route path="*"')
    assert.deepEqual(await check(dist, allowlist, added), ['E_ROUTE_UNDISPOSED: /drafts'])
    const removed = appSource.replace(/\s*<Route path="\/updates"[^\n]*/, '')
    assert.deepEqual(await check(dist, allowlist, removed), ['E_ROUTE_STALE: /updates'])
    const invalid = { ...allowlist, routes: allowlist.routes.map((route) => route.path === '/' ? { ...route, disposition: 'unknown' } : route) }
    assert.deepEqual(await check(dist, invalid), ['E_ROUTE_DISPOSITION: / unknown'])
  } finally { await rm(dist, { recursive: true, force: true }) }
})

test('actual JSON content rejects nested evidence and unknown review fields but retains safe summaries', async () => {
  const safe = { imageSha256: 'a'.repeat(64), ownerVerdict: { verdict: 'pass' }, imageModification: { generationReceiptAvailable: true, inputSha256: 'b'.repeat(64), outputSha256: 'a'.repeat(64) }, imageHashHistory: ['b'.repeat(64)] }
  for (const [file, payload, fails] of [
    ['portrait-reviews/person-0001.json', { imageSha256: 'a'.repeat(64) }, false],
    ['portrait-reviews/person-0001.json', safe, false],
    ['portrait-reviews/person-0001.json', { ...safe, ownerVerdict: { verdict: 'pass', nested: { generationReceipt: { request: { prompt: 'PRIVATE_SENTINEL' } } } } }, true],
    ['portrait-reviews/person-0001.json', { ...safe, futureEvidence: { body: 'PRIVATE_SENTINEL' } }, true],
    ['portrait-reviews/person-0001.json', { ...safe, ownerVerdict: { verdict: { prompt: 'PRIVATE_SENTINEL' } } }, true],
    ['portrait-tokens/person-0001.json', { slots: { future: { generationRequest: { prompt: 'PRIVATE_SENTINEL' } } } }, true],
    ['portrait-reviews/person-0001.json', { ...safe, technology: 'source=/Users/private/x' }, true],
    ...['file:/Users/private/source.png', '//server/private/source.png'].flatMap(value => [
      ['portrait-reviews/person-0001.json', { ...safe, technology: value }, true],
      ['portrait-tokens/person-0001.json', { facts: { role: value } }, true],
    ]),
    ['portrait-tokens/person-0001.json', { facts: { role: 'file:///Volumes/private/x' } }, true],
    ...['https://commons.wikimedia.org/wiki/File:Portrait.png', 'https://example.org/profile:portrait'].flatMap(value => [
      ['portrait-reviews/person-0001.json', { ...safe, technology: value }, false],
      ['portrait-tokens/person-0001.json', { facts: { role: value } }, false],
    ]),
    ['portrait-tokens/person-0001.json', { image: { path: '/portraits/person-0001.png' }, imageReview: { record: '/portrait-reviews/person-0001.json' }, facts: { role: '2D / 3D' } }, false],
  ]) {
    const dist = await fixture({ [file]: JSON.stringify(payload) })
    try {
      const failures = await check(dist)
      assert.equal(failures.length, fails ? 1 : 0)
      if (fails) assert.match(failures[0], /E_ARTIFACT_PORTRAIT_EVIDENCE/)
    } finally { await rm(dist, { recursive: true, force: true }) }
  }
})
