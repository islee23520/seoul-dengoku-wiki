import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { buildAdminTerritorialScale, validateAdminTerritorialScale } from './admin-territorial-scale.mjs'

const geographyBytes = readFileSync(new URL('../lore/regions/seoul-electoral-titles.json', import.meta.url))
const territorialScale = JSON.parse(readFileSync(new URL('../lore/offices/Offices-and-Ranks.json', import.meta.url))).data.territorialScale
const inputs = { geographyBytes, territorialScale }
const build = () => buildAdminTerritorialScale(inputs)
const mutate = change => {
  const geography = JSON.parse(geographyBytes)
  change(geography)
  return { geographyBytes: Buffer.from(JSON.stringify(geography)), territorialScale: {
    ...territorialScale, geographicSource: { ...territorialScale.geographicSource,
      sha256: 'pending' } } }
}
const withHash = input => {
  input.territorialScale.geographicSource.sha256 = createHash('sha256').update(input.geographyBytes).digest('hex')
  return input
}

test('projects authenticated Seoul titles and independent slot editions without rights', () => {
  const output = build()
  validateAdminTerritorialScale(output, inputs)
  assert.equal(output.schema, 'admin-territorial-scale.v2')
  assert.equal(output.titles.length, 80)
  for (const [rank, count] of Object.entries({ empire: 1, kingdom: 6, duchy: 25, county: 48 }))
    assert.equal(output.titles.filter(title => title.rank === rank).length, count)
  assert.equal(output.slotEditions.dated.rows.length, 426)
  assert.equal(output.slotEditions.currentCorrespondence.rows.length, 427)
  assert.equal(output.slotEditions.currentCorrespondence.rows.every(row => !row.geometryVerified), true)
  assert.equal(output.titles.some(row => 'holderPersonId' in row || 'owner' in row), false)
  assert.equal(output.slotEditions.dated.rows.some(row => 'historicalHoldingRefs' in row), false)
  const exception = output.titles.find(title => title.geographicParentException)
  assert.equal(exception.geographicParentTitleId, 'geography:empire:seoul')
  assert.ok(output.titles.find(title => title.titleId === 'geography:kingdom:seoul:01').mapCountyTitleIds.includes(exception.titleId))
  const yongsin = output.slotEditions.dated.rows.find(row => row.dongId === 'electoral-dong:22:11230:용신동')
  assert.ok(yongsin)
  assert.equal(yongsin.currentCorrespondenceSlotIds.length, 2)
})

test('rejects legacy signatures, descriptors and unauthenticated geography', () => {
  assert.throws(() => buildAdminTerritorialScale([], [], territorialScale), /E_GEOGRAPHY_BYTES/)
  assert.throws(() => buildAdminTerritorialScale({ geographyBytes, territorialScale: { ...structuredClone(territorialScale), schema: 'territorial-scale.v1' } }), /E_SCALE_SCHEMA/)
  assert.throws(() => buildAdminTerritorialScale({ geographyBytes: Buffer.from('{}'), territorialScale }), /E_GEOGRAPHY_HASH/)
  const wrong = structuredClone(territorialScale)
  wrong.levels.kingdom.partitionSha256 = '0'.repeat(64)
  assert.throws(() => buildAdminTerritorialScale({ geographyBytes, territorialScale: wrong }), /E_KINGDOM_APPROVAL/)
})

test('builder and validator reject unknown descriptor fields and political geographic parents', () => {
  const output = build()
  for (const [change, error] of [
    [scale => { scale.regularRegions = { rank: 'kingdom' } }, /E_SCALE_FIELDS/],
    [scale => { scale.geographicSource.unapproved = true }, /E_GEOGRAPHY_SOURCE_FIELDS/],
    [scale => { scale.levels.county.unapproved = true }, /E_LEVEL_FIELDS:county/],
    [scale => { scale.slotEditions.dated.unapproved = true }, /E_SLOT_EDITION_FIELDS:dated/],
    [scale => { scale.geographicParent.crossDistrictExceptions[0].unapproved = true }, /E_PARENT_EXCEPTIONS/],
    [scale => { scale.geographicParent.meaning = 'political' }, /E_PARENT_MEANING/],
  ]) {
    const wrong = structuredClone(territorialScale)
    change(wrong)
    assert.throws(() => buildAdminTerritorialScale({ geographyBytes, territorialScale: wrong }), error)
    assert.throws(() => validateAdminTerritorialScale(output, { geographyBytes, territorialScale: wrong }), error)
  }
})

test('rejects title identity, parent, cycle, kingdom membership and map rank corruption', () => {
  for (const change of [
    g => g.titles.pop(),
    g => { g.titles[1].titleId = g.titles[0].titleId },
    g => { g.titles[1].feudalParentTitleId = 'geography:outside' },
    g => { g.titles[1].feudalParentTitleId = g.titles[1].titleId },
    g => { g.titles.find(t => t.rank === 'county' && !t.geographicParentException).feudalParentTitleId = 'geography:kingdom:seoul:01' },
    g => { g.titles.find(t => t.rank === 'kingdom').jurisdictionRefs[0] = 'outside' },
    g => { g.mapMinimumRank = 'barony' },
    g => { g.titles.push({ ...g.titles[0], titleId: 'geography:outside' }) },
    g => { g.successor.partition[0].countyTitleIds.pop() },
    g => { g.titles.find(t => t.geographicParentException).geographicParentException = undefined },
  ]) assert.throws(() => buildAdminTerritorialScale(withHash(mutate(change))))
  const wrong = structuredClone(territorialScale)
  wrong.map.selectableRanks.unshift('barony')
  assert.throws(() => buildAdminTerritorialScale({ geographyBytes, territorialScale: wrong }), /E_MAP_CONTRACT/)
})

test('rejects slot omissions, duplication, wrong edition, fragments, geometry and correspondence', () => {
  for (const change of [
    g => g.countySlots[0].slots.pop(),
    g => g.currentCorrespondenceSlots[0].slots.pop(),
    g => g.countySlots[0].slots[1].slotId = g.countySlots[0].slots[0].slotId,
    g => { g.countySlots[0].slots[0].jurisdictionGuRef = '99999' },
    g => { g.countySlots[0].slots[0].fragmentId = 'fabricated' },
    g => { g.currentCorrespondenceSlots[0].slots[0].geometryVerified = true },
    g => { const row = g.countySlots.flatMap(group => group.slots).find(slot => slot.currentCorrespondenceSlotIds.length === 2); row.currentCorrespondenceSlotIds.pop() },
    g => { g.countySlots[0].slots[0].currentCorrespondenceSlotIds = ['slot:outside'] },
  ]) assert.throws(() => buildAdminTerritorialScale(withHash(mutate(change))))
})

test('validator rejects private fields, altered parent and edition rows', () => {
  const output = build()
  output.titles[0].holderPersonId = 'invented'
  assert.throws(() => validateAdminTerritorialScale(output, inputs), /E_SCALE_PROJECTION/)
  const parent = build()
  parent.titles[1].geographicParentTitleId = null
  assert.throws(() => validateAdminTerritorialScale(parent, inputs), /E_SCALE_PROJECTION/)
  const edition = build()
  edition.slotEditions.dated.rows.push(edition.slotEditions.currentCorrespondence.rows[0])
  assert.throws(() => validateAdminTerritorialScale(edition, inputs), /E_SCALE_PROJECTION/)
})
