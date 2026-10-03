import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { expect, test } from 'vitest'
import { parseArchitectureCsv, reconcileArchitecture } from './station-provenance.mjs'

const json = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))

test('station audit preserves hashes and recomputes exact station-line evidence', async () => {
  const audit = await json('lore/regions/sources/station-provenance-audit-20261002.json')
  const interiors = await json(audit.inputs.interiors.path)
  const map = await json(audit.inputs.map.path)
  const underground = await json(audit.inputs.underground.path)
  const rows = parseArchitectureCsv(await readFile(new URL(`../${audit.inputs.architecture.path}`, import.meta.url), 'utf8'))
  for (const [index, station] of interiors.stations.entries()) {
    expect(audit.interiors[index].architectureReconciliation).toEqual(reconcileArchitecture(station, rows))
  }
  for (const input of Object.values(audit.inputs).filter((entry) => entry.path)) {
    const bytes = await readFile(new URL(`../${input.path}`, import.meta.url))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(input.sha256)
  }
  expect(audit.interiors.map((row) => row.name).sort()).toEqual(interiors.stations.map((row) => row.name).sort())
  expect(audit.map.map((row) => row.id).sort()).toEqual(map.stations.map((row) => row.id).sort())
  expect([...new Set(audit.interiors.map((row) => row.mapStationId))].sort()).toEqual(map.stations.map((row) => row.id).sort())
  for (const station of audit.map) {
    expect(station.lines.map((line) => line.lineId).sort()).toEqual(Object.keys(underground.stations[station.id]).sort())
    for (const line of station.lines) {
      expect(line.verificationStatus).toBe(Object.keys(line.sourceRefs).length ? 'manual-snapshot-not-recomputed' : 'source-unavailable')
      expect(line.verified).toBe(false)
    }
  }
  expect(audit.policy.positionIsFloorplan).toBe(false)
})

test('exact join rejects another station with identical fields and missing source', () => {
  const station = { name: '대상역', observed_levels_source: 'OA-11572', observed_levels: { lines: [{ line: '1', form: '상대식', code: 'B2', area: '100', year: '2000' }] } }
  const wrong = parseArchitectureCsv('호선,역명,형식,층수,면적(㎡),준공년도\n1,다른역,상대식,B2,100,2000\n')
  expect(reconcileArchitecture(station, wrong).lines[0].status).toBe('source-row-missing')
  expect(reconcileArchitecture(station, wrong).verified).toBe(false)
  expect(reconcileArchitecture({ ...station, observed_levels_source: null }, wrong).verified).toBe(false)
  const correct = parseArchitectureCsv('호선,역명,형식,층수,면적(㎡),준공년도\n1,대상역,상대식,B2,100,2000\n')
  expect(reconcileArchitecture(station, correct).verified).toBe(true)
  expect(reconcileArchitecture(station, correct).lines[0].rows[0].csvLine).toBe(2)
  expect(reconcileArchitecture(station, parseArchitectureCsv('호선,역명,형식,층수,면적(㎡),준공년도\n1,대상역,상대식,B3,100,2000\n')).lines[0].mismatches).toEqual(['층수'])
})

test('Saetgang facility reference links only the confirmed concourse', async () => {
  const source = await json('lore/regions/sources/saetgang-facility-reference.json')
  const interiors = await json(source.interiorRef.path)
  const map = await json(source.mapRef.path)
  const station = map.stations.find((entry) => entry.id === source.stationId)
  expect(station.lineIds).toEqual(source.lineIds)
  expect(station.control.surfaceRegionId).toBe(source.mapRef.surfaceRegionId)
  expect(interiors.stations.find((entry) => entry.name === source.interiorRef.name).layers.some((layer) => layer.id === source.interiorRef.layerId)).toBe(true)
  expect(source.fiction2126.holderPersonId).toBe('K233')
  expect(source.fiction2126.directLiegePersonId).toBe('K222')
  expect(source.fiction2126.holdingScope).toBe('concourse-only')
  expect(source.fiction2126.wholeDongControl).toBe(false)
  expect(source.fiction2126.trackTollRights).toBe(false)
  expect(source.fiction2126.formalTitleRank).toBeNull()
  expect(source.mapRef.facilityPolygon).toBeNull()
  expect(source.siteIdentity.anchors.map((anchor) => anchor.lineId)).toEqual(source.lineIds)
  expect(new Set(source.siteIdentity.anchors.map((anchor) => anchor.id)).size).toBe(2)
  expect(source.siteIdentity.anchors.map((anchor) => anchor.id)).toEqual(['osm:node:8401534578', 'osm:node:8401534582'])
  expect(source.publicationRights.drawingsCopied).toBe(false)
  expect(source.publicationRights.photosCopied).toBe(false)
  expect(source.publicationRights.sourceProseCopied).toBe(false)
})
