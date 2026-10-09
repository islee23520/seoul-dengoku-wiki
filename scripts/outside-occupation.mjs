import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

export function projectOutsideOccupation(control, geometry, islands) {
  assert.equal(control.schema, 'outside-control-2126.v3', 'E_OUTSIDE_CONTROL_SCHEMA')
  assert.equal(islands.schema, 'outside-island-occupation.v1', 'E_ISLAND_SCHEMA')
  assert.equal(islands.geometrySourceSha256, geometry.sourceSha256, 'E_ISLAND_SOURCE')
  const units = new Map(geometry.units.map(unit => [unit.id, unit]))
  const splits = new Map(islands.units.map(unit => [unit.unitId, unit]))
  assert.equal(splits.size, islands.units.length, 'E_ISLAND_DUPLICATE_UNIT')
  assert.ok([...splits.keys()].every(id => units.has(id)), 'E_ISLAND_UNKNOWN_UNIT')
  assert.equal(control.assignments.length, units.size, 'E_OUTSIDE_CONTROL_COVERAGE')
  assert.equal(new Set(control.assignments.map(row => row.unitId)).size, units.size, 'E_OUTSIDE_CONTROL_DUPLICATE')
  const assignments = control.assignments.map(row => {
    const unit = units.get(row.unitId)
    assert.ok(unit, 'E_OUTSIDE_CONTROL_UNIT')
    const split = splits.get(row.unitId)
    if (!split) {
      assert.ok(row.authority, 'E_OUTSIDE_CONTROL_AUTHORITY')
      return { ...row, status: 'held' }
    }
    assert.equal(row.authority, null, 'E_ISLAND_WHOLE_AUTHORITY')
    assert.ok(!row.holderPersonId && !row.directLiegePersonId && !row.formalTitle, 'E_ISLAND_WHOLE_TITLE')
    assert.ok(!row.vassal && !row.station, 'E_ISLAND_WHOLE_GRANT')
    assert.equal(createHash('sha256').update(unit.path).digest('hex'), split.pathSha256, 'E_ISLAND_GEOMETRY_HASH')
    const paths = unit.path.match(/M[^Z]+Z/g)
    assert.ok(paths, 'E_ISLAND_GEOMETRY')
    assert.deepEqual(split.components.map(part => part.componentIndex).sort((a, b) => a - b), paths.map((_, index) => index), 'E_ISLAND_COMPONENT_COVERAGE')
    const components = split.components.map(part => {
      assert.ok(part.sources.length > 0 && part.sources.every(url => /^https:\/\//u.test(url)), 'E_ISLAND_SOURCE_REF')
      assert.ok(['mainland-bridge', 'no-mainland-bridge', 'unknown'].includes(part.connection), 'E_ISLAND_CONNECTION')
      assert.ok(!part.holderPersonId && !part.directLiegePersonId && !part.formalTitle, 'E_ISLAND_TITLE')
      if (part.connection === 'mainland-bridge') assert.deepEqual(part.authority, { kind: 'state', stateId: 'S06', name: '대한민국정부' }, 'E_ISLAND_BRIDGE_AUTHORITY')
      else {
        assert.equal(part.authority, null, 'E_ISLAND_UNASSIGNED')
        assert.ok(!part.vassal && !part.station, 'E_ISLAND_UNASSIGNED_GRANT')
      }
      return { ...part, id: `${row.unitId}:${part.componentIndex}`, path: paths[part.componentIndex], status: part.authority ? 'held' : 'unassigned' }
    })
    return { ...row, status: components.some(part => part.authority) ? 'partial' : 'unassigned', components }
  })
  return { schema: control.schema, assignments }
}
