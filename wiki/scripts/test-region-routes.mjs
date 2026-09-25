import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/wikiRouting.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { resolveLegacyRegionRoute, resolveRegionSelection, worldRegionMapRoute } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`)
const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))

test('every authored region ID selects its map record', async () => {
  const content = new URL('../../lore/regions/content/', import.meta.url)
  const ids = (await Promise.all((await readdir(content)).filter((name) => /^\d{5}\.json$/u.test(name)).map(async (name) => {
    const district = JSON.parse(await readFile(new URL(name, content), 'utf8'))
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
  assert.match(mapComponent, /resolveRegionSelection\(data\.regions, requestedRegion\)/)
  assert.match(nginx, /location \/regions\/ \{/)
  assert.match(nginx, /location \/world\/regions\/ \{/)
})
