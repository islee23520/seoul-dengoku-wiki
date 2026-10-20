import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

export function projectOutsideOccupation(control, geometry, islands, retirement) {
  if (retirement !== undefined) {
    assert.equal(retirement.schema, 'outside-control-retirement.v1', 'E_OUTSIDE_RETIREMENT_SCHEMA')
    assert.ok(typeof retirement.approvalRef === 'string' && retirement.approvalRef.startsWith('owner:') && retirement.approvalRef.length > 6, 'E_OUTSIDE_RETIREMENT_APPROVAL')
    const { originalControl, originalIslands } = retirement
    // Validate the complete historical geometry before considering current retirement.
    const historical = projectOutsideOccupation(originalControl, geometry, originalIslands)
    assert.ok(geometry.units.every(unit => !unit.id.startsWith('11')), 'E_OUTSIDE_RETIREMENT_INSIDE')
    const originals = new Map([
      ...originalControl.assignments.map(row => [JSON.stringify(['assignments', row.unitId]), row]),
      ...originalIslands.units.map(row => [JSON.stringify(['islandUnits', row.unitId]), row]),
    ])
    assert.equal(retirement.records.length, originals.size, 'E_OUTSIDE_RETIREMENT_COVERAGE')
    const records = new Map(retirement.records.map(row => [row.recordKey, row]))
    assert.equal(records.size, retirement.records.length, 'E_OUTSIDE_RETIREMENT_DUPLICATE')
    for (const row of retirement.records) {
      assert.deepEqual(Object.keys(row).sort(), ['approvalRef', 'recordKey', 'sourceValueSha256', 'status'], 'E_OUTSIDE_RETIREMENT_FIELDS')
      const original = originals.get(row.recordKey)
      assert.ok(original, 'E_OUTSIDE_RETIREMENT_UNKNOWN')
      assert.equal(row.sourceValueSha256, createHash('sha256').update(JSON.stringify(original)).digest('hex'), 'E_OUTSIDE_RETIREMENT_HASH')
      assert.ok(['retained-current', 'retired-current'].includes(row.status), 'E_OUTSIDE_RETIREMENT_STATUS')
      assert.equal(row.approvalRef, retirement.approvalRef, 'E_OUTSIDE_RETIREMENT_APPROVAL')
    }
    const retained = (set, id) => records.get(JSON.stringify([set, id])).status === 'retained-current'
    for (const unit of originalIslands.units) {
      assert.equal(retained('islandUnits', unit.unitId), retained('assignments', unit.unitId), 'E_OUTSIDE_RETIREMENT_ISLAND_ASSIGNMENT')
    }
    const assignments = originalControl.assignments.filter(row => retained('assignments', row.unitId))
    const units = originalIslands.units.filter(row => retained('islandUnits', row.unitId))
    const expectedControl = { ...originalControl, assignments }
    // A fully retired current source cannot keep the former jurisdiction claim.
    // Partial retirement must preserve its basis and every other original field.
    if (retirement.records.every(row => row.status === 'retired-current')) delete expectedControl.basis
    assert.deepEqual(control, expectedControl, 'E_OUTSIDE_RETIREMENT_CURRENT_CONTROL')
    const expectedIslands = { ...originalIslands, units }
    if (units.length === 0) delete expectedIslands.openingDecision
    assert.deepEqual(islands, expectedIslands, 'E_OUTSIDE_RETIREMENT_CURRENT_ISLANDS')
    return { schema: control.schema, assignments: historical.assignments.filter(row => retained('assignments', row.unitId)) }
  }
  assert.equal(control.schema, 'outside-control-2126.v3', 'E_OUTSIDE_CONTROL_SCHEMA')
  assert.equal(islands.schema, 'outside-island-occupation.v1', 'E_ISLAND_SCHEMA')
  assert.equal(islands.geometrySourceSha256, geometry.sourceSha256, 'E_ISLAND_SOURCE')
  const decision = islands.openingDecision
  if (decision) {
    assert.deepEqual(decision.authority, { kind: 'state', stateId: 'S06', name: '대한민국정부' }, 'E_ISLAND_DECISION_AUTHORITY')
    assert.ok(decision.namedIslandApprovalRefs?.length === 2 && decision.namedIslandApprovalRefs.every(ref => typeof ref === 'string' && ref.startsWith('owner:')) && typeof decision.anonymousComponentApprovalRef === 'string' && decision.anonymousComponentApprovalRef.startsWith('owner:'), 'E_ISLAND_DECISION_APPROVAL')
  }
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
      const authority = decision?.authority ?? part.authority
      return { ...part, authority, ...(decision ? { openingApprovalRefs: part.name ? decision.namedIslandApprovalRefs : [decision.anonymousComponentApprovalRef] } : {}), id: `${row.unitId}:${part.componentIndex}`, path: paths[part.componentIndex], status: authority ? 'held' : 'unassigned' }
    })
    return { ...row, status: components.some(part => part.authority) ? 'partial' : 'unassigned', components }
  })
  return { schema: control.schema, assignments }
}
