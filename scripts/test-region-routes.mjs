import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { REGION_CONTENT_SOURCE_HASHES } from './cast-sqlite/region-content-documents.mjs'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'vitest'
import ts from 'typescript'
import { projectGeographicTitles, resolveGeographicSelection } from '../src/components/geographicTitleMap.mjs'

const source = await readFile(new URL('../src/wikiRouting.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { resolveLegacyRegionRoute, resolveRegionSelection, worldRegionMapRoute } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`)
const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))

test('every authored region ID selects its map record', async () => {
  const ids = (await Promise.all(Object.keys(REGION_CONTENT_SOURCE_HASHES).map(async (path) => {
    const district = readCanonicalDocument(path)
    return district.regions.map((region) => region.region_id)
  }))).flat()
  assert.equal(ids.length, 427)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(new Set(map.regions.map((region) => region.id)), new Set(ids))
  for (const id of ids) assert.equal(resolveRegionSelection(map.regions, id), id)
  const duplicateNames = map.regions.filter((region) => region.name === '신사동')
  assert.equal(duplicateNames.length, 2)
  for (const region of duplicateNames) assert.equal(resolveRegionSelection(map.regions, `${region.district}/${region.name}`), region.id)
})

test('legacy region URL forms lead to the map with the requested dong selected', async () => {
  const region = map.regions.find((candidate) => candidate.name.endsWith('동'))
  assert.ok(region)
  const examples = [
    ['/regions', null], ['/regions/', null], ['/regions/index.html', null],
    ['/world/regions', null], ['/world/regions/', null],
    [`/regions/${region.id}`, region.id],
    [`/regions/${region.id.slice(7)}.html`, region.id],
    [`/world/regions/${encodeURIComponent(region.name)}`, region.id],
    [`/regions/11110/${encodeURIComponent(region.name)}`, region.id],
    [`/world/${encodeURIComponent(region.name)}.html`, region.id],
  ]
  for (const [oldPath, expectedId] of examples) {
    const target = resolveLegacyRegionRoute(oldPath)
    assert.ok(target?.startsWith(worldRegionMapRoute), oldPath)
    const requested = new URL(target, 'https://example.test').searchParams.get('region')
    assert.equal(expectedId ? resolveRegionSelection(map.regions, requested) : requested, expectedId, oldPath)
  }
  assert.equal(resolveLegacyRegionRoute('/world/World-Unbinding'), undefined)
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const article = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const mapComponent = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  const nginx = await readFile(new URL('../deploy/nginx.conf', import.meta.url), 'utf8')
  assert.match(app, /path="\/regions\/\*"/)
  assert.match(app, /path="\/world\/regions\/\*"/)
  assert.match(article, /resolveLegacyRegionRoute\(pathname\)/)
  const tree = ts.createSourceFile('OpeningTerritoryMap.tsx', mapComponent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let queryEffect
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect'
      && node.arguments[1]?.getText(tree) === '[data, requestedRegion]') queryEffect = node.arguments[0]
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.ok(queryEffect, 'the map query selection effect exists')
  const staging = readCanonicalDocument('lore/regions/seoul-electoral-titles.json')
  const boundaries = JSON.parse(await readFile(new URL('../data/geography/boundaries/seoul-sgis-20250630.geojson', import.meta.url)))
  const geography = projectGeographicTitles(staging, boundaries, (x, y) => [x, y])
  const callback = new Function('data', 'requestedRegion', 'resolveGeographicSelection', 'setTitleId', 'setRank', 'setDetailOpen', `return (${queryEffect.getText(tree)})()`)
  const selected = []
  const slot = geography.titles.find(title => title.rank === 'county').currentSlots[0]
  for (const oldPath of [`/regions/${slot.dongId}`, `/world/regions/${encodeURIComponent(slot.name)}`]) {
    const target = resolveLegacyRegionRoute(oldPath)
    const requested = new URL(target, 'https://example.test').searchParams.get('region')
    callback({ geography }, requested, resolveGeographicSelection, id => selected.push(id), () => {}, () => {})
    assert.equal(selected.pop(), resolveGeographicSelection(geography, slot.dongId)?.id)
  }
  callback({ geography }, 'region:4113164000', resolveGeographicSelection, id => selected.push(id), () => {}, () => {})
  assert.equal(selected.pop(), null)
  assert.match(nginx, /location \/regions\/ \{/)
  assert.match(nginx, /location \/world\/regions\/ \{/)
})
