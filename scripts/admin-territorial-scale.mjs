import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const catalogBytes = readFileSync(new URL('./data/admin-territorial-catalog.json', import.meta.url))
assert.equal(sha256(catalogBytes), 'a32c8e5b64012925dacb81839bbffaf1e1ac9066ec9e26406c04b75b301eb0bd', 'E_ADMIN_CATALOG_HASH')
export const adminCatalog = JSON.parse(catalogBytes)
const catalogById = new Map(adminCatalog.units.map(row => [row.adminId, row]))
assert.equal(catalogById.size, adminCatalog.units.length, 'E_ADMIN_CATALOG_DUPLICATE')
const hierarchyBytes = readFileSync(new URL('./data/admin-city-hierarchy.json', import.meta.url))
assert.equal(sha256(hierarchyBytes), '96610714627f8ebdc29df71d206878dff14b634567b188bc41fb192a9e1e8693', 'E_ADMIN_HIERARCHY_HASH')
export const cityHierarchy = JSON.parse(hierarchyBytes)
const cityByDistrict = new Map(cityHierarchy.rows.map(row => [row.districtId, row]))
assert.equal(cityByDistrict.size, cityHierarchy.rows.length, 'E_ADMIN_HIERARCHY_DUPLICATE')
const canonRef = 'lore/offices/Offices-and-Ranks.json#영토의-규모와-행정단위'

export function deriveParentIds(adminId) {
  const row = catalogById.get(adminId)
  assert.ok(row, 'E_ADMIN_ID:' + adminId)
  return { provinceId: row.provinceId, catalogParentId: row.parentId }
}

export function buildAdminTerritorialScale(units, regions, territorialScale) {
  const sourceRows = [
    ...units.map(unit => ({ id: unit.id, name: unit.name, province: unit.province, district: unit.district,
      sourceRef: 'public/outside-admin-units.json' })),
    ...regions.map(region => ({ id: region.id.replace(/^region:/u, ''), name: '서울특별시 ' + region.district + ' ' + region.name,
      province: '서울특별시', district: region.district, sourceRef: 'public/opening-territories.json' })),
  ]
  assert.equal(new Set(sourceRows.map(row => row.id)).size, sourceRows.length, 'E_ADMIN_DUPLICATE_SOURCE_ID')
  const containers = new Map()
  const add = row => {
    const previous = containers.get(row.adminId)
    if (previous) assert.deepEqual(previous, row, 'E_ADMIN_CONTAINER_CONFLICT')
    else containers.set(row.adminId, row)
  }
  const rows = sourceRows.map(source => {
    const entry = catalogById.get(source.id)
    assert.ok(entry, 'E_ADMIN_ID:' + source.id)
    assert.deepEqual([source.name, source.province, source.district],
      [entry.name, entry.provinceName, entry.parentName], 'E_ADMIN_IDENTITY:' + source.id)
    const provinceId = entry.provinceId
    const special = territorialScale.specialCities.find(city => city.name === entry.provinceName)
    const regular = territorialScale.regularRegions.provinceCodes.includes(provinceId)
    const sejong = provinceId === territorialScale.sejong.provinceCode
    const confirmed = regular || !!special || sejong
    const district = entry.parentName.endsWith('구')
    const generalDistrict = regular && district
    const city = generalDistrict ? cityByDistrict.get(entry.parentId) : null
    if (generalDistrict) {
      assert.ok(city, 'E_ADMIN_MISSING_CITY:' + entry.parentId)
      assert.ok(city.affectedLeafIds.includes(entry.adminId), 'E_ADMIN_CITY_MEMBERSHIP:' + entry.adminId)
    }
    const parentAdminId = sejong ? provinceId : district ? 'gu:' + entry.parentId : entry.parentId
    const base = { adminId: source.id, parentAdminId, type: special ? 'dong' : 'eup-myeon-dong',
      context: entry.provinceName + '/' + entry.parentName, sourceRef: source.sourceRef,
      catalogRef: adminCatalog.sourceRef + '#' + entry.adminId, scaleSourceRef: canonRef }
    add({ adminId: provinceId, parentAdminId: null, type: regular ? 'province' : 'city',
      context: entry.provinceName, sourceRef: adminCatalog.sourceRef,
      ...(confirmed ? { status: 'projected', comparisonScale: 'kingdom', componentOnly: false, scaleSourceRef: canonRef }
        : { status: 'HOLD', reason: 'outside confirmed scale scope' }) })
    if (city) add({ adminId: city.parentCityId, parentAdminId: provinceId, type: 'city',
      context: entry.provinceName + '/' + city.parentCityName, sourceRef: 'scripts/data/admin-city-hierarchy.json#' + city.parentCityId,
      status: 'projected', comparisonScale: 'duchy', componentOnly: false, scaleSourceRef: canonRef })
    if (!sejong) add({ adminId: parentAdminId, parentAdminId: city ? city.parentCityId : provinceId,
      type: district ? 'district' : entry.parentName.endsWith('군') ? 'county' : 'city',
      context: entry.provinceName + '/' + entry.parentName,
      sourceRef: city ? 'scripts/data/admin-city-hierarchy.json#' + city.districtId : adminCatalog.sourceRef,
      ...(confirmed ? { status: 'projected', comparisonScale: generalDistrict ? 'barony' : 'duchy', componentOnly: false, scaleSourceRef: canonRef }
        : { status: 'HOLD', reason: 'outside confirmed scale scope' }) })
    if (!confirmed) return { ...base, status: 'HOLD', reason: 'outside confirmed scale scope' }
    if (generalDistrict) return { ...base, status: 'projected', comparisonScale: 'component', componentOnly: true }
    return { ...base, status: 'projected', comparisonScale: 'barony', componentOnly: false }
  })
  const allRows = [...containers.values(), ...rows].sort((a, b) => a.adminId.localeCompare(b.adminId))
  return { schema: 'admin-territorial-scale.v1',
    sourceHash: sha256(JSON.stringify({ units, regions, territorialScale,
      catalogHash: sha256(catalogBytes), hierarchyHash: sha256(hierarchyBytes) })),
    catalogHash: sha256(catalogBytes), hierarchyHash: sha256(hierarchyBytes), rows: allRows,
    held: allRows.filter(row => row.status === 'HOLD').map(row => row.adminId) }
}

export function validateAdminTerritorialScale(output, units, regions, territorialScale) {
  const expected = buildAdminTerritorialScale(units, regions, territorialScale)
  const actual = new Map(output.rows.map(row => [row.adminId, row]))
  assert.equal(actual.size, output.rows.length, 'E_ADMIN_DUPLICATE_OUTPUT_ID')
  assert.deepEqual([...actual.keys()].sort(), expected.rows.map(row => row.adminId).sort(), 'E_ADMIN_ID_SET')
  for (const row of expected.rows) {
    const candidate = actual.get(row.adminId)
    assert.equal(candidate.parentAdminId, row.parentAdminId, 'E_ADMIN_PARENT:' + row.adminId)
    assert.equal(candidate.comparisonScale, row.comparisonScale, 'E_ADMIN_SCALE:' + row.adminId)
    assert.deepEqual(candidate, row, 'E_ADMIN_ROW:' + row.adminId)
  }
  assert.deepEqual(output, expected, 'E_ADMIN_PROJECTION')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url)
  const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'))
  const result = buildAdminTerritorialScale(read('public/outside-admin-units.json').units,
    read('public/opening-territories.json').regions, read('public/territorial-scale.json'))
  const target = process.argv[2] ? new URL(process.argv[2], root) : new URL('public/admin-territorial-scale.json', root)
  writeFileSync(target, JSON.stringify(result) + '\n')
  console.log(JSON.stringify({ output: target.pathname, sourceHash: result.sourceHash, total: result.rows.length,
    projected: result.rows.length - result.held.length, held: result.held.length }))
}
