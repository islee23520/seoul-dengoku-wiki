import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const provinceNames = new Map([['41', '경기도'], ['43', '충청북도'], ['44', '충청남도'], ['51', '강원특별자치도']])
const confirmedCenters = new Map([
  ['4128757000', { parentAdminId: '41287', name: '대화동', comparisonScale: 'component', componentOnly: true }],
  ['4183039500', { parentAdminId: '41830', name: '지평면', comparisonScale: 'barony', componentOnly: false }],
  ['5111057000', { parentAdminId: '51110', name: '근화동', comparisonScale: 'barony', componentOnly: false }],
])
const confirmedMunicipalIds = new Map([['고양시', '41280'], ['양평군', '41830'], ['춘천시', '51110']])
const hold = (adminId, parentAdminId, type, context, sourceRef, reason) =>
  ({ adminId, parentAdminId, type, context, status: 'HOLD', reason, sourceRef })

export function deriveParentIds(adminId) {
  assert.match(adminId, /^\d{10}$/u, 'E_ADMIN_ID')
  return { provinceId: adminId.slice(0, 2), cityCountyId: adminId.slice(0, 5), districtId: adminId.slice(0, 8) }
}

export function buildAdminTerritorialScale(units, regions, territorialScale, controlLedger) {
  const sourceRows = [
    ...units.map(unit => ({ id: unit.id, name: unit.name, province: unit.province, district: unit.district,
      type: 'eup-myeon-dong', sourceRef: 'public/outside-admin-units.json' })),
    ...regions.map(region => ({ id: region.id.replace(/^region:/u, ''), name: region.name,
      province: '서울특별시', district: region.district, type: 'dong', sourceRef: 'public/opening-territories.json' })),
  ]
  const byId = new Map(sourceRows.map(row => [row.id, row]))
  assert.equal(byId.size, sourceRows.length, 'E_ADMIN_DUPLICATE_SOURCE_ID')
  const assignments = new Map(controlLedger.assignments.map(row => [row.unitId, row]))
  const rows = sourceRows.map(source => {
    const { provinceId, cityCountyId, districtId } = deriveParentIds(source.id)
    const base = { adminId: source.id, parentAdminId: provinceId, type: source.type, context: source.province,
      status: 'HOLD', sourceRef: source.sourceRef }
    if (source.province === '서울특별시') return { ...base, parentAdminId: districtId,
      context: `${source.province}/${source.district}`, comparisonScale: 'barony', componentOnly: false, status: 'projected' }

    if (source.province === '대전광역시') {
      const rule = territorialScale.specialCities.find(city => city.name === source.province)
      if (!rule) return hold(source.id, provinceId, source.type, source.province, source.sourceRef,
        'special city scale not confirmed in territorial-scale.json')
      return { ...base, parentAdminId: source.district ? districtId : provinceId,
        context: source.district ? `${source.province}/${source.district}` : source.province,
        comparisonScale: source.district ? rule.district : rule.city, componentOnly: false, status: 'projected' }
    }
    if (source.province === '세종특별자치시') return hold(source.id, provinceId, source.type, source.province,
      source.sourceRef, 'Sejong scale is outside the confirmed paragraph scope')

    const provinceName = provinceNames.get(provinceId)
    const provinceConfirmed = provinceName === source.province && provinceNames.has(provinceId)
    if (!provinceConfirmed) return hold(source.id, provinceId, source.type, source.province, source.sourceRef,
      'province name/scale not confirmed in canon')
    const center = confirmedCenters.get(source.id)
    if (center) {
      const assignment = assignments.get(source.id)
      if (source.name.endsWith(center.name) && assignment?.unitId === source.id) return { ...base,
        parentAdminId: center.parentAdminId, context: source.name.split(' ').slice(0, -1).join('/'),
        comparisonScale: center.comparisonScale, componentOnly: center.componentOnly, status: 'projected' }
      return hold(source.id, center.parentAdminId, source.type, source.province, source.sourceRef,
        'confirmed center identity does not match source row')
    }

    const parentName = source.district?.replace(/(읍|면|동)$/u, '')
    const confirmedParentId = confirmedMunicipalIds.get(parentName)
    if (confirmedParentId) {
      const isDistrict = source.district.includes('구') && source.district !== parentName
      return hold(source.id, isDistrict ? cityCountyId : confirmedParentId, source.type,
        `${source.province}/${source.district}`, source.sourceRef,
        'individual child name and parent relationship need source-catalog confirmation')
    }
    const assignment = assignments.get(source.id)
    return hold(source.id, cityCountyId, source.type, `${source.province}/${source.district}`, source.sourceRef,
      assignment ? 'outside control center is outside confirmed paragraph scope' : 'child administrative name/scale is outside confirmed paragraph scope')
  })
  return { schema: 'admin-territorial-scale.v1', sourceHash: sha256(JSON.stringify({ units, regions, territorialScale, controlLedger })),
    rows, held: rows.filter(row => row.status === 'HOLD').map(row => row.adminId) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url)
  const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'))
  const outside = read('public/outside-admin-units.json')
  const territories = read('public/opening-territories.json')
  const scale = read('public/territorial-scale.json')
  const control = read('lore/regions/outside-control-2126.json')
  const result = buildAdminTerritorialScale(outside.units, territories.regions, scale, control)
  const target = process.argv[2] ? new URL(process.argv[2], root) : new URL('public/admin-territorial-scale.json', root)
  writeFileSync(target, JSON.stringify(result) + '\n')
  console.log(JSON.stringify({ output: target.pathname, sourceHash: result.sourceHash, total: result.rows.length,
    projected: result.rows.length - result.held.length, held: result.held.length }))
}
