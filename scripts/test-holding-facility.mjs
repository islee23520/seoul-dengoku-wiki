import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { validateHoldingFacility } from './holding-facility.mjs'

const root = resolve(import.meta.dirname, '..')
const read = async file => JSON.parse(await readFile(resolve(root, file), 'utf8'))
const interiors = await read('lore/regions/station-interiors.json')
const holding = (await read('lore/relations/personal-holdings.json')).holdings.find(row => row.facilityRef)

test('다른 실제 지역 원천과 선언한 층을 검증한다', async () => {
  const source = await read('lore/regions/content/11110.json')
  const site = source.regions.flatMap(row => row.content.buildings).find(row => row.name === '경복궁')
  const station = interiors.stations.find(row => row.name === site.name)
  const candidate = structuredClone(holding)
  candidate.facilityRef = { sourcePath: 'lore/regions/station-interiors.json',
    siteSourcePath: 'lore/regions/content/11110.json', siteAnchor: site.anchor_ref,
    stationName: station.name, stationIdentity: { district: station.district, lat: station.lat, lon: station.lon },
    layerId: station.layers[0].id, layerName: station.layers[0].wiki_layer }
  await validateHoldingFacility(candidate, interiors, root)
})

test('잘못된 앵커와 다른 역 identity를 거부한다', async () => {
  for (const mutate of [ref => { ref.siteAnchor = 'osm:node:0' }, ref => { ref.stationIdentity.lat = 0 }, ref => { ref.stationName = '경복궁' }]) {
    const candidate = structuredClone(holding)
    mutate(candidate.facilityRef)
    await assert.rejects(validateHoldingFacility(candidate, interiors, root), /E_HOLDING_SITE_REF/)
  }
})

test('외부 절대경로와 상위 이동 경로를 거부한다', async () => {
  for (const path of ['/tmp/foreign.json', '../foreign.json', 'lore/regions/content/../station-interiors.json', 'lore/relations/personal-holdings.json']) {
    const candidate = structuredClone(holding)
    candidate.facilityRef.siteSourcePath = path
    await assert.rejects(validateHoldingFacility(candidate, interiors, root), /E_HOLDING_SOURCE_PATH/)
  }
})

test('중복 역 후보를 자동 병합하지 않는다', async () => {
  const duplicate = structuredClone(interiors)
  duplicate.stations.push(structuredClone(duplicate.stations.find(row => row.name === holding.facilityRef.stationName)))
  await assert.rejects(validateHoldingFacility(holding, duplicate, root), /E_HOLDING_SITE_REF/)
})

test('지역 원천 root 밖으로 나가는 symlink를 거부한다', async () => {
  const scratch = resolve(root, '.omo/evidence/holding-path-tests')
  await mkdir(scratch, { recursive: true })
  const temp = await mkdtemp(join(scratch, 'fixture-'))
  try {
    await mkdir(resolve(temp, 'lore/regions/content'), { recursive: true })
    await symlink(resolve(root, 'lore/regions/content/11560.json'), resolve(temp, 'lore/regions/content/escape.json'))
    const candidate = structuredClone(holding)
    candidate.facilityRef.siteSourcePath = 'lore/regions/content/escape.json'
    await assert.rejects(validateHoldingFacility(candidate, interiors, temp), /E_HOLDING_SOURCE_PATH/)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})
