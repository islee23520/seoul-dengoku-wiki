import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('connected rail catalog keeps 334 Seoul rows and adds every pinned external OSM node', async () => {
  const page = JSON.parse(await readFile(new URL('../lore/places/Seoul-Station-Catalog.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../lore/places/connected-rail-stations.json', import.meta.url), 'utf8'))
  const seoul = page.content.filter((block) => block.kind === 'table').slice(0, -1).flatMap((block) => block.rows)
  const external = page.content.at(-1).rows
  assert.equal(page.id, 'DOC:Seoul-Station-Catalog')
  assert.equal(seoul.length, 334)
  assert.equal(external.length, source.stations.length)
  assert.equal(new Set(source.stations.map((station) => station.osmId)).size, source.stations.length)
  assert.equal(source.source.sha256, 'cd4f04b9145cb8e1cacaf2ce9b10cdb5425f7ae3ae49dac73ef2084f42d94329')
  for (const [index, station] of source.stations.entries()) {
    const row = external[index]
    assert.equal(row[0].ko, station.nameKo, station.osmId)
    assert.equal(row[2].ko, station.lat.toFixed(5), station.osmId)
    assert.equal(row[3].ko, station.lon.toFixed(5), station.osmId)
    assert.equal(row[5].ko, `n${station.osmId}`, station.osmId)
  }
  assert.ok(source.stations.some((station) => station.nameKo === '대전' && station.osmId === '355173691'))
})
