import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'vitest'

test('current rail catalog preserves 332 Seoul rows and only surface Sinchon, with all 610 historical nodes archived unchanged', async () => {
  const page = readCanonicalDocument('lore/places/Seoul-Station-Catalog.json')
  const sourceBytes = readSourceArchive('lore/places/connected-rail-stations.json', 'c0f1e2fb5b24dfc0e64469c64c268dfd5a2ab3af4dc9c46925509fc4df68fd0d')
  const source = JSON.parse(sourceBytes)
  const seoul = page.content.filter((block) => block.kind === 'table').slice(0, -1).flatMap((block) => block.rows)
  const connected = page.content.at(-1).rows
  assert.equal(page.id, 'DOC:Seoul-Station-Catalog')
  assert.equal(seoul.length, 332)
  // Only the two independently confirmed outside rows were removed. The
  // historical physical-source archive below remains byte-identical.
  assert.equal(createHash('sha256').update(JSON.stringify(seoul)).digest('hex'), '9a34cb56471c57a080366371baa51f46348afa27d067efba44d1408cf0753f93')
  assert.equal(source.stations.length, 610)
  assert.equal(sourceBytes.length, 104800)
  assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), 'c0f1e2fb5b24dfc0e64469c64c268dfd5a2ab3af4dc9c46925509fc4df68fd0d')
  assert.equal(new Set(source.stations.map((station) => station.osmId)).size, source.stations.length)
  assert.equal(source.source.sha256, 'cd4f04b9145cb8e1cacaf2ce9b10cdb5425f7ae3ae49dac73ef2084f42d94329')
  const station = source.stations.find((station) => station.osmId === '2346858838')
  assert.ok(station)
  assert.equal(station.nameKo, '신촌')
  assert.equal(station.lat, 37.5597815)
  assert.equal(station.lon, 126.9423581)
  assert.deepEqual(connected, [[
    { ko: '신촌', en: 'Sinchon' },
    { ko: 'Sinchon', en: 'Sinchon' },
    { ko: '37.55978', en: '37.55978' },
    { ko: '126.94236', en: '126.94236' },
    { ko: '일반철도', en: 'Mainline rail' },
    { ko: 'n2346858838', en: 'n2346858838' },
  ]])
  for (const row of connected) {
    assert.equal(row[0].ko, station.nameKo, station.osmId)
    assert.equal(row[2].ko, station.lat.toFixed(5), station.osmId)
    assert.equal(row[3].ko, station.lon.toFixed(5), station.osmId)
    assert.equal(row[5].ko, `n${station.osmId}`, station.osmId)
  }
  assert.ok(source.stations.some((station) => station.nameKo === '대전' && station.osmId === '355173691'))
})
