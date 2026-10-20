import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { authenticateStationCatalogSuccessor, STATION_BEFORE, STATION_AFTER } from './station-catalog-scope-successor.mjs'
import { createHash } from 'node:crypto'
import { STATION_CATALOG_PATH, STATION_BOUNDARY_PATH, validateStationCatalogGeography } from './station-catalog-geography.mjs'

const catalog = JSON.parse(await readFile(new URL('../' + STATION_CATALOG_PATH, import.meta.url)))
const boundary = await readFile(new URL('../' + STATION_BOUNDARY_PATH, import.meta.url))
test('corrected catalog covers all coordinates and preserves all alias groups and surface Sinchon', () => {
  assert.equal(validateStationCatalogGeography(catalog, boundary).rowCount, 333)
  assert.equal(validateStationCatalogGeography(catalog, boundary).aliasGroups, 19)
  assert.equal(catalog.content.at(-1).rows[0][5].ko, 'n2346858838')
})
test('an otherwise unchanged catalog rejects injected outside coordinates at the exact source pointer', () => {
  const changed = structuredClone(catalog)
  changed.content[6].rows[0][2].ko = '37.43513'
  changed.content[6].rows[0][3].ko = '126.90231'
  assert.throws(() => validateStationCatalogGeography(changed, boundary), {
    code: 'E_STATION_OUTSIDE', path: STATION_CATALOG_PATH + '#/content/6/rows/0/2/ko',
  })
  const english = structuredClone(catalog)
  english.content.at(-1).rows[0][2].en = '0'
  assert.throws(() => validateStationCatalogGeography(english, boundary), {
    code: 'E_STATION_OUTSIDE', path: STATION_CATALOG_PATH + '#/content/57/rows/0/2/en',
  })
})
test('unresolved canonical and alias members fail at their exact pointers', () => {
  for (const [field, pointer] of [['id', '/id'], ['aliases', '/aliases/0']]) {
    const changed = structuredClone(catalog)
    if (field === 'id') changed.data.station_aliases[0].id = 'unresolved'
    else changed.data.station_aliases[0].aliases[0] = 'unresolved'
    assert.throws(() => validateStationCatalogGeography(changed, boundary), {
      code: 'E_STATION_ALIAS_SOURCE', path: STATION_CATALOG_PATH + '#/data/station_aliases/0' + pointer,
    })
  }
})
test('changed boundary bytes and malformed coordinates fail closed', () => {
  assert.throws(() => validateStationCatalogGeography(catalog, Buffer.concat([boundary, Buffer.from(' ')])), { code: 'E_STATION_BOUNDARY' })
  const changed = structuredClone(catalog)
  changed.content[6].rows[0][2].ko = ''
  assert.throws(() => validateStationCatalogGeography(changed, boundary), {
    code: 'E_STATION_COORDINATE', path: STATION_CATALOG_PATH + '#/content/6/rows/0/2/ko',
  })
})

test('exact successor reconstructs the authenticated predecessor without changing anchors or aliases', async () => {
  const successor = await authenticateStationCatalogSuccessor(fileURLToPath(new URL('../', import.meta.url)))
  const digest = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(digest(successor.before), STATION_BEFORE)
  assert.equal(digest(successor.current), STATION_AFTER)
  const before = JSON.parse(successor.before), after = JSON.parse(successor.current)
  assert.deepEqual(after.content.map(block => block.anchor), before.content.map(block => block.anchor))
  assert.deepEqual(after.data.station_aliases, before.data.station_aliases)
  before.content[18].rows.splice(1, 1)
  before.content[20].rows.splice(3, 1)
  assert.deepEqual(after.content.filter(block => block.kind === 'table'), before.content.filter(block => block.kind === 'table'))
})
