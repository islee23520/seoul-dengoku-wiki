import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { buildAdminTerritorialScale, deriveParentIds } from './admin-territorial-scale.mjs'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('projects source-bound Seoul dong and confirmed parent scales once; holds unconfirmed parents', () => {
  const outside = read('../public/outside-admin-units.json')
  const map = read('../public/opening-territories.json')
  const scales = read('../public/territorial-scale.json')
  const ledger = read('../lore/regions/outside-control-2126.json')
  const result = buildAdminTerritorialScale(outside.units, map.regions, scales, ledger)
  const rows = new Map(result.rows.map(row => [row.adminId, row]))
  assert.equal(rows.size, result.rows.length)
  assert.equal(result.rows.length, outside.units.length + map.regions.length)
  assert.deepEqual(deriveParentIds('4128757000'), { provinceId: '41', cityCountyId: '41287', districtId: '41287570' })
  assert.equal(rows.get('4128757000').parentAdminId, '41287')
  assert.equal(rows.get('4128757000').comparisonScale, 'component')
  assert.equal(rows.get('4183039500').parentAdminId, '41830')
  assert.equal(rows.get('4183039500').comparisonScale, 'barony')
  assert.equal(rows.get('5111057000').parentAdminId, '51110')
  assert.equal(rows.get('5111057000').comparisonScale, 'barony')
  assert.deepEqual(ledger.assignments.map(row => row.unitId).sort(), ['4128757000', '4183039500', '5111057000'])
  const seoul = rows.get(map.regions[0].id.slice('region:'.length))
  assert.equal(seoul.comparisonScale, 'barony')
  assert.equal(seoul.parentAdminId, map.regions[0].id.slice('region:'.length, -2))
  assert.equal(seoul.componentOnly, false)
  assert.equal(result.rows.some(row => row.adminId.startsWith('43') && row.status === 'HOLD'), true)
  assert.equal(result.rows.some(row => row.adminId.startsWith('44') && row.status === 'HOLD'), true)
  assert.equal(result.rows.every(row => row.adminId), true)
  assert.equal(result.rows.some(row => 'holderPersonId' in row || 'titleHolder' in row), false)
})

test('rejects invalid codes, duplicate source IDs, and detached or collapsed parent shapes', () => {
  assert.throws(() => deriveParentIds('412875700'), /E_ADMIN_ID/)
  const unit = { id: '4128757000', name: '경기도 고양시일산서구 대화동', province: '경기도', district: '고양시일산서구' }
  const scales = read('../public/territorial-scale.json')
  const control = read('../lore/regions/outside-control-2126.json')
  assert.throws(() => buildAdminTerritorialScale([unit, unit], [], scales, control), /E_ADMIN_DUPLICATE_SOURCE_ID/)
  const shifted = buildAdminTerritorialScale([{ ...unit, id: '4128757001' }], [], scales, control)
  assert.equal(shifted.rows[0].parentAdminId, '41287')
  const held = buildAdminTerritorialScale([{ ...unit, province: '알수없는도' }], [], scales, control)
  assert.equal(held.rows[0].status, 'HOLD')
  assert.equal(held.rows[0].parentAdminId, '41')
})
