import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { geometryPath, selectedSource, preservationInput, projectOutsideUnits, validateOutsideUnits } from './project-outside-admin-units.mjs'

const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url)))
const outside = JSON.parse(await readFile(new URL('../public/outside-admin-units.json', import.meta.url)))
const previous = preservationInput()

test('generated outside output preserves every previous object and appends source-identity geographic units only', () => {
  assert.deepEqual(outside.units.slice(0, 1309), previous.units)
  assert.deepEqual({ ...outside, units: [] }, { ...previous, units: [] })
  const added = outside.units.slice(1309)
  assert.equal(added.length, 106)
  assert.deepEqual(added.map(unit => unit.id), added.map(unit => unit.id).sort())
  assert.ok(added.every(unit => unit.holder2126 === null && Object.keys(unit).join(',') === 'id,name,province,district,path,holder2126'))
})

test('normal producer checks the complete raw source and generated output when supplied for regeneration', async () => {
  const sourcePath = process.env.OUTSIDE_ADMIN_SOURCE
  const provinceCodes = { 인천광역시: '28', 대전광역시: '30', 세종특별자치시: '36', 경기도: '41', 충청북도: '43', 충청남도: '44', 강원특별자치도: '51' }
  const geometry = { type: 'Polygon', coordinates: [[[127, 37], [127.1, 37], [127, 37.1], [127, 37]]] }
  let source = { features: [...outside.units.map(unit => ({ properties: { sido: provinceCodes[unit.province], adm_cd2: unit.id, adm_nm: unit.name, sidonm: unit.province, sggnm: unit.district }, geometry })),
    ...map.regions.map(region => ({ properties: { sido: '11', adm_cd2: region.id.replace(/^region:/u, '') }, geometry }))] }
  if (sourcePath) {
    const bytes = await readFile(sourcePath)
    source = selectedSource(bytes)
    assert.deepEqual(projectOutsideUnits(source, previous, map), outside)
    assert.throws(() => selectedSource(Buffer.concat([bytes, Buffer.from(' ')])), /E_OUTSIDE_SOURCE_HASH/u)
  }
  assert.throws(() => selectedSource(Buffer.from('{}')), /E_OUTSIDE_SOURCE_HASH/u)
  const candidate = projectOutsideUnits(source, previous, map)
  for (const mutate of [
    data => { data.units.pop() },
    data => { data.units[1309].id = data.units[1310].id },
    data => { data.units[1309].id = '25010530' },
    data => { data.units[1309].name = 'wrong' },
    data => { data.units[1309].province = 'wrong' },
    data => { data.units[1309].district = 'wrong' },
    data => { data.units[1309].path += ' M0,0 L1,1 Z' },
    data => { data.units[1309].holder2126 = 'S01' },
    data => { data.units[0].path += ' ' },
    data => { data.units = data.units.slice(1309) },
  ]) {
    const bad = structuredClone(candidate)
    mutate(bad)
    assert.throws(() => validateOutsideUnits(bad, source, previous, map))
  }
})

test('complete MultiPolygon rings and holes retain all vertices and ring closure under the selected projection', () => {
  const shell = [[127, 37], [127.1, 37], [127.1, 37.1], [127, 37.1], [127, 37]]
  const hole = [[127.02, 37.02], [127.02, 37.04], [127.04, 37.04], [127.04, 37.02], [127.02, 37.02]]
  const island = [[127.2, 37], [127.3, 37], [127.3, 37.1], [127.2, 37]]
  const path = geometryPath({ type: 'MultiPolygon', coordinates: [[shell, hole], [island]] }, map)
  assert.equal((path.match(/M/gu) ?? []).length, 3)
  assert.equal((path.match(/Z/gu) ?? []).length, 3)
  assert.equal((path.match(/L/gu) ?? []).length, 11)
  assert.equal(path, [shell, hole, island].map(ring => geometryPath({ type: 'Polygon', coordinates: [ring] }, map)).join(' '))
  assert.throws(() => geometryPath({ type: 'Polygon', coordinates: [shell.slice(0, -1)] }, map), /E_OUTSIDE_RING_CLOSURE/u)
  assert.throws(() => geometryPath({ type: 'LineString', coordinates: shell }, map), /E_OUTSIDE_GEOMETRY/u)
})
