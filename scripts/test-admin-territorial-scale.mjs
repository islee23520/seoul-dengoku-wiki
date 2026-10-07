import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'vitest'
import { adminCatalog, cityHierarchy, buildAdminTerritorialScale, deriveParentIds, validateAdminTerritorialScale } from './admin-territorial-scale.mjs'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const units = read('../public/outside-admin-units.json').units
const regions = read('../public/opening-territories.json').regions
const scale = read('../public/territorial-scale.json')
const build = () => buildAdminTerritorialScale(units, regions, scale)
const validate = output => validateAdminTerritorialScale(output, units, regions, scale)

test('projects independent confirmed scales from exact catalog parents without occupancy grants', () => {
  const result = build()
  const rows = new Map(result.rows.map(row => [row.adminId, row]))
  validate(read('../public/admin-territorial-scale.json'))
  assert.equal(rows.size, result.rows.length)
  assert.deepEqual(deriveParentIds('1111051500'), { provinceId: '11', catalogParentId: '11110' })
  assert.equal(rows.get('1111051500').parentAdminId, 'gu:11110')
  for (const id of ['11', '30', '36', '41', '43', '44', '51']) {
    assert.equal(rows.get(id).comparisonScale, 'kingdom')
    assert.equal(rows.get(id).status, 'projected')
  }
  assert.notEqual(rows.get('43').adminId, rows.get('44').adminId)
  for (const entry of adminCatalog.units) {
    const row = rows.get(entry.adminId)
    assert.ok(row)
    if (['11', '30', '36'].includes(entry.provinceId)) {
      assert.equal(row.status, 'projected')
      assert.equal(row.comparisonScale, 'barony')
      assert.equal(row.componentOnly, false)
      assert.equal(row.parentAdminId, entry.provinceId === '36' ? '36' : 'gu:' + entry.parentId)
    } else if (['41', '43', '44', '51'].includes(entry.provinceId)) {
      assert.equal(row.comparisonScale, entry.parentName.endsWith('구') ? 'component' : 'barony')
      assert.equal(row.componentOnly, entry.parentName.endsWith('구'))
      assert.equal(row.status, 'projected')
    } else assert.equal(row.status, 'HOLD')
  }
  const contentDir = new URL('../lore/regions/content/', import.meta.url)
  let count = 0
  for (const file of readdirSync(contentDir).filter(name => name.endsWith('.json'))) {
    const district = JSON.parse(readFileSync(new URL(file, contentDir), 'utf8'))
    for (const region of district.regions) {
      assert.equal(rows.get(region.region_id.replace('region:', '')).parentAdminId, district.district_id)
      count++
    }
  }
  assert.equal(count, 427)
  assert.equal(cityHierarchy.rows.length, 30)
  assert.equal(new Set(cityHierarchy.rows.map(row => row.parentCityId)).size, 10)
  let generalDistrictLeaves = 0
  for (const binding of cityHierarchy.rows) {
    const district = rows.get('gu:' + binding.districtId)
    const city = rows.get(binding.parentCityId)
    assert.equal(district.parentAdminId, city.adminId)
    assert.equal(district.comparisonScale, 'barony')
    assert.equal(city.comparisonScale, 'duchy')
    assert.equal(city.status, 'projected')
    assert.equal(binding.moisIdentity.effectiveDate, '2026-07-01')
    assert.equal(binding.moisIdentity.citySourceRow.code, binding.moisIdentity.cityCode10)
    assert.deepEqual(binding.affectedLeafIds.slice().sort(), adminCatalog.units
      .filter(row => row.parentId === binding.districtId).map(row => row.adminId).sort())
    for (const id of binding.affectedLeafIds) {
      assert.equal(rows.get(id).parentAdminId, district.adminId)
      assert.equal(rows.get(id).status, 'projected')
      generalDistrictLeaves++
    }
  }
  assert.equal(generalDistrictLeaves, 373)
  assert.equal(adminCatalog.units.filter(row => row.provinceId !== '28').length, 1684)
  assert.equal(adminCatalog.units.filter(row => row.provinceId === '28').length, 158)
  for (const row of result.rows) {
    if (row.parentAdminId !== null) assert.ok(rows.has(row.parentAdminId))
    if (row.status === 'HOLD') assert.ok(row.context.startsWith('인천광역시'))
  }
  assert.equal(result.rows.some(row => 'holderPersonId' in row || 'owner' in row || 'titleHolder' in row), false)
})

test('wrong Seoul district scale is rejected', () => {
  const result = build()
  result.rows.find(row => row.adminId === 'gu:11110').comparisonScale = 'barony'
  assert.throws(() => validate(result), /E_ADMIN_SCALE:gu:11110/)
})

test('detached confirmed province child is rejected', () => {
  const result = build()
  const city = result.rows.find(row => row.parentAdminId === '43' && row.type === 'county')
  assert.ok(city)
  city.parentAdminId = null
  assert.throws(() => validate(result), /E_ADMIN_PARENT/)
})

test('collapsed Chungcheong kingdom IDs and duplicate IDs are rejected', () => {
  const result = build()
  result.rows = result.rows.filter(row => row.adminId !== '44')
  assert.throws(() => validate(result), /E_ADMIN_ID_SET/)
  const duplicate = build()
  duplicate.rows.find(row => row.adminId === '44').adminId = '43'
  assert.throws(() => validate(duplicate), /E_ADMIN_DUPLICATE_OUTPUT_ID/)
})

test('invented IDs and identity substitutions cannot enter the catalog projection', () => {
  assert.throws(() => deriveParentIds('1111099999'), /E_ADMIN_ID/)
  assert.throws(() => buildAdminTerritorialScale([], [{ id: 'region:1111099999', name: '가상동', district: '가상구' }], scale), /E_ADMIN_ID/)
  assert.throws(() => buildAdminTerritorialScale([{ ...units[0], id: '4128757001' }], [], scale), /E_ADMIN_ID/)
  assert.throws(() => buildAdminTerritorialScale([{ ...units[0], province: '알수없는도' }], [], scale), /E_ADMIN_IDENTITY/)
  assert.throws(() => buildAdminTerritorialScale([units[0], units[0]], [], scale), /E_ADMIN_DUPLICATE_SOURCE_ID/)
})
