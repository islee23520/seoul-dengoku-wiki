import assert from 'node:assert/strict'

const exactKeys = (value, keys) => {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'E_MAP_FIELDS')
  assert.deepEqual(Object.keys(value).sort(), keys.slice().sort(), 'E_MAP_FIELDS')
}

// Geometry belongs to the map producer; this boundary checks every published
// non-geometric field against the authenticated geography and v2 scale projection.
export function validatePublishedGeographyMap(map, geography, scale) {
  exactKeys(map, ['spatialDate', 'currentDate', 'titles'])
  assert.equal(map.spatialDate, scale.slotEditions.dated.baseDate, 'E_MAP_SPATIAL_DATE')
  assert.equal(map.currentDate, scale.slotEditions.currentCorrespondence.administrativeCandidateDate, 'E_MAP_CURRENT_DATE')
  assert.ok(Array.isArray(map.titles), 'E_MAP_TITLES')
  const counties = scale.titles.filter(title => title.rank === 'county')
  const sourceById = new Map(geography.titles.map(title => [title.titleId, title]))
  const slots = (groups, titleId) => (groups.find(group => group.countyTitleId === titleId)?.slots ?? []).map(slot => ({
    id: slot.slotId, name: slot.name, dongId: slot.dongId,
    fragmentId: slot.fragmentId, status: slot.status, holderPersonId: slot.holderPersonId,
    geometryVerified: slot.geometryVerified,
  }))
  const expected = scale.titles.map(title => ({
    id: title.titleId, rank: title.rank, name: title.name, parentId: title.geographicParentTitleId,
    countyIds: title.rank === 'county' ? [title.titleId] : title.rank === 'kingdom' ? title.mapCountyTitleIds
      : counties.filter(county => county.jurisdictionRefs.some(gu => title.jurisdictionRefs.includes(gu))).map(county => county.titleId),
    holderPersonId: sourceById.get(title.titleId).holderPersonId ?? null,
    datedSlots: slots(geography.countySlots, title.titleId),
    currentSlots: slots(geography.currentCorrespondenceSlots, title.titleId),
  }))
  assert.equal(map.titles.length, expected.length, 'E_MAP_TITLE_COUNT')
  for (const [index, title] of map.titles.entries()) {
    exactKeys(title, [...Object.keys(expected[index]), 'path'])
    assert.equal(typeof title.path, 'string', 'E_MAP_PATH')
    for (const [field, rows] of [['datedSlots', expected[index].datedSlots], ['currentSlots', expected[index].currentSlots]]) {
      assert.ok(Array.isArray(title[field]), 'E_MAP_SLOTS')
      for (const slot of title[field]) exactKeys(slot, Object.keys(rows[0] ?? {
        id: '', name: '', dongId: '', fragmentId: '', status: '', holderPersonId: '', geometryVerified: false,
      }))
    }
    const { path, ...nonGeometry } = title
    assert.deepEqual(nonGeometry, expected[index], 'E_MAP_PROJECTION')
  }
}
