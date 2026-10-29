import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readDocument } from './cast-sqlite/document-read.mjs'
import { orderDocumentKeys } from './cast-sqlite/document-key-order.mjs'
import { readGeographyStore } from './cast-sqlite/geography-store.mjs'
import { readScopeCurrentSource } from './document-store/scope-current-source.mjs'

const sha256 = value => createHash('sha256').update(value).digest('hex')
const ranks = ['empire', 'kingdom', 'duchy', 'county', 'barony']
const forbidden = ['adminId', 'parentAdminId', 'comparisonScale', 'owner', 'holderPersonId',
  'politicalLiegePersonId', 'historicalHoldingRefs']
const exactKeys = (value, keys, code) => {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), code)
  assert.deepEqual(Object.keys(value).sort(), keys.slice().sort(), code)
}
const unique = (values, code) => assert.equal(new Set(values).size, values.length, code)
const sameSet = (actual, expected, code) => {
  unique(actual, code)
  assert.deepEqual(actual.slice().sort(), expected.slice().sort(), code)
}

export function buildAdminTerritorialScale({ geographyBytes, territorialScale } = {}) {
  assert.ok(Buffer.isBuffer(geographyBytes) || typeof geographyBytes === 'string', 'E_GEOGRAPHY_BYTES')
  return buildScale({ geography: JSON.parse(geographyBytes.toString()),
    geographySha256: sha256(geographyBytes), territorialScale })
}

// The caller owns the connection. Source paths identify metadata, never files.
export function buildAdminTerritorialScaleFromDb(db) {
  const sources = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?')
    .all('lore/regions/seoul-electoral-titles.json')
  assert.equal(sources.length, 1, 'E_GEOGRAPHY_SOURCE')
  const identities = db.prepare(`SELECT s.source_id,s.sha256,r.parent_revision,r.algorithm
    FROM source_file s JOIN text_document d USING(source_id)
    JOIN document_head h USING(source_id)
    JOIN document_revision r ON r.source_id=h.source_id AND r.revision_id=h.revision_id
    JOIN document_revision_seal z ON z.revision_id=r.revision_id
    WHERE s.logical_path=? AND d.document_id=? AND d.domain='offices' AND d.corpus_kind='current'`)
    .all('lore/offices/Offices-and-Ranks.json', 'DOC:Offices-and-Ranks')
  assert.equal(identities.length, 1, 'E_SCALE_DOCUMENT_AUTHORITY')
  const identity = identities[0]
  assert.equal(identity.algorithm, 'typed-envelope-v1', 'E_SCALE_DOCUMENT_REVISION')
  if (identity.parent_revision !== null) {
    const document = readScopeCurrentSource({ db, logicalPath: 'lore/offices/Offices-and-Ranks.json' })
    return buildScale({ geography: readGeographyStore(db), geographySha256: sources[0].sha256,
      territorialScale: document.data.territorialScale })
  }
  // Public reads require current-reviewed exact admission at the sealed head and
  // verify its full typed semantic digest, including unsupported-data omissions.
  const document = readDocument(db, { documentId: 'DOC:Offices-and-Ranks',
    domain: 'offices', corpusKind: 'current', visibility: 'public' })
  assert.ok(document, 'E_SCALE_DOCUMENT_REVIEW')
  const ordered = orderDocumentKeys(db, identity.source_id, document)
  return buildScale({ geography: readGeographyStore(db), geographySha256: sources[0].sha256,
    territorialScale: ordered.data.territorialScale })
}

function buildScale({ geography, geographySha256, territorialScale }) {
  exactKeys(territorialScale, ['schema', 'scope', 'geographicSource', 'geographicEmpireId',
    'rankOrder', 'levels', 'map', 'slotEditions', 'geographicParent', 'politicalAxis',
    'scaleImpliesPersonalOwnership', 'scaleImpliesTitleRank', 'scaleImpliesFacilityAccess',
    'slotExistenceImpliesGrant'], 'E_SCALE_FIELDS')
  exactKeys(territorialScale.geographicSource, ['path', 'sha256', 'schema'], 'E_GEOGRAPHY_SOURCE_FIELDS')
  exactKeys(territorialScale.levels, ranks, 'E_LEVEL_FIELDS')
  for (const rank of ranks.slice(0, 4))
    exactKeys(territorialScale.levels[rank], ['sourcePointer', 'rank', 'count',
      ...(rank === 'kingdom' ? ['partitionSha256'] : [])], 'E_LEVEL_FIELDS:' + rank)
  exactKeys(territorialScale.levels.barony, ['representation', 'idField', 'parentField'], 'E_LEVEL_FIELDS:barony')
  exactKeys(territorialScale.map, ['minimumPolygonRank', 'selectableRanks', 'baronyPolygon'], 'E_MAP_FIELDS')
  exactKeys(territorialScale.slotEditions, ['dated', 'currentCorrespondence'], 'E_SLOT_EDITION_FIELDS')
  exactKeys(territorialScale.slotEditions.dated, ['sourcePointer', 'edition', 'baseDate', 'count',
    'geometryVerified', 'currentBoundaryCertification'], 'E_SLOT_EDITION_FIELDS:dated')
  exactKeys(territorialScale.slotEditions.currentCorrespondence, ['sourcePointer', 'edition',
    'administrativeCandidateDate', 'checkedAt', 'count', 'geometryVerified'], 'E_SLOT_EDITION_FIELDS:currentCorrespondence')
  exactKeys(territorialScale.geographicParent, ['sourceField', 'meaning', 'politicalLiegeInference',
    'crossDistrictExceptions'], 'E_PARENT_FIELDS')
  exactKeys(territorialScale.politicalAxis, ['currentCenters', 'geographicKingdomEquivalence',
    'preserveStablePoliticalIdentities', 'preserveNonterritorialKingship'], 'E_POLITICAL_AXIS_FIELDS')
  assert.equal(territorialScale?.schema, 'territorial-scale.v2', 'E_SCALE_SCHEMA')
  assert.equal(territorialScale.scope, 'seoul-only', 'E_SCALE_SCOPE')
  assert.deepEqual(territorialScale.rankOrder, ranks, 'E_SCALE_RANKS')
  assert.equal(territorialScale.geographicSource.path, 'lore/regions/seoul-electoral-titles.json', 'E_GEOGRAPHY_PATH')
  assert.equal(territorialScale.geographicSource.schema, 'seoul-geography-staging.v1', 'E_GEOGRAPHY_SCHEMA')
  assert.equal(geographySha256, territorialScale.geographicSource.sha256, 'E_GEOGRAPHY_HASH')
  assert.equal(geography.schema, territorialScale.geographicSource.schema, 'E_GEOGRAPHY_SCHEMA')
  assert.equal(sha256(JSON.stringify(geography.successor.partition)), territorialScale.levels.kingdom.partitionSha256, 'E_KINGDOM_PARTITION')
  assert.equal(geography.successor.partitionSha256, territorialScale.levels.kingdom.partitionSha256, 'E_KINGDOM_PARTITION')
  assert.equal(territorialScale.geographicEmpireId, 'geography:empire:seoul', 'E_EMPIRE_ID')
  for (const key of ['scaleImpliesPersonalOwnership', 'scaleImpliesTitleRank', 'scaleImpliesFacilityAccess', 'slotExistenceImpliesGrant'])
    assert.equal(territorialScale[key], false, 'E_SCALE_IMPLICATION:' + key)
  assert.deepEqual(territorialScale.map, { minimumPolygonRank: 'county',
    selectableRanks: ['county', 'duchy', 'kingdom', 'empire'], baronyPolygon: false }, 'E_MAP_CONTRACT')
  assert.deepEqual(territorialScale.geographicParent.crossDistrictExceptions, [{
    titleId: 'geography:county:seoul-constituency:중구성동구을선거구',
    parentTitleId: 'geography:empire:seoul', mapKingdomTitleId: 'geography:kingdom:seoul:01',
    kind: 'cross-district-empire-direct',
  }], 'E_PARENT_EXCEPTIONS')
  assert.deepEqual(territorialScale.geographicParent.sourceField, 'feudalParentTitleId', 'E_PARENT_FIELD')
  assert.equal(territorialScale.geographicParent.meaning, 'geographic-only', 'E_PARENT_MEANING')
  assert.equal(territorialScale.geographicParent.politicalLiegeInference, false, 'E_POLITICAL_INFERENCE')
  assert.deepEqual(territorialScale.politicalAxis, { currentCenters: 3,
    geographicKingdomEquivalence: false, preserveStablePoliticalIdentities: true,
    preserveNonterritorialKingship: true }, 'E_POLITICAL_AXIS')
  assert.equal(geography.mapMinimumRank, territorialScale.map.minimumPolygonRank, 'E_MAP_MINIMUM')

  const titles = geography.titles.map(title => ({ titleId: title.titleId, rank: title.rank,
    name: title.name, geographicParentTitleId: title.feudalParentTitleId,
    jurisdictionRefs: title.jurisdictionRefs,
    mapCountyTitleIds: title.rank === 'kingdom' ? title.countyTitleIds : [],
    ...(title.geographicParentException ? { geographicParentException: title.geographicParentException } : {}),
  }))
  unique(titles.map(title => title.titleId), 'E_TITLE_DUPLICATE')
  assert.equal(titles.length, 80, 'E_TITLE_COUNT')
  const byId = new Map(titles.map(title => [title.titleId, title]))
  const empire = byId.get(territorialScale.geographicEmpireId)
  assert.equal(empire?.rank, 'empire', 'E_EMPIRE_ID')
  assert.equal(empire.geographicParentTitleId, null, 'E_EMPIRE_PARENT')
  for (const rank of ranks.slice(0, 4)) {
    assert.equal(territorialScale.levels[rank].sourcePointer, '/titles', 'E_LEVEL_SOURCE')
    assert.equal(territorialScale.levels[rank].rank, rank, 'E_LEVEL_RANK')
    assert.equal(titles.filter(title => title.rank === rank).length, territorialScale.levels[rank].count, 'E_TITLE_COUNT:' + rank)
  }
  assert.deepEqual(territorialScale.levels.barony, { representation: 'county-detail-slot',
    idField: 'slotId', parentField: 'countyTitleId' }, 'E_BARONY_REPRESENTATION')
  sameSet(geography.mapTitleIds, titles.map(title => title.titleId), 'E_MAP_TITLE_SET')
  const exceptions = territorialScale.geographicParent.crossDistrictExceptions
  for (const title of titles) {
    assert.equal(forbidden.some(key => key in title), false, 'E_PRIVATE_TITLE')
    if (title.rank === 'empire') continue
    const parent = byId.get(title.geographicParentTitleId)
    assert.ok(parent, 'E_TITLE_PARENT:' + title.titleId)
    const exception = exceptions.find(row => row.titleId === title.titleId)
    assert.equal(title.geographicParentException, exception?.kind, 'E_TITLE_EXCEPTION:' + title.titleId)
    assert.equal(parent.rank, exception ? 'empire' : ranks[ranks.indexOf(title.rank) - 1], 'E_TITLE_PARENT_RANK:' + title.titleId)
    if (exception) assert.equal(parent.titleId, exception.parentTitleId, 'E_TITLE_PARENT_EXCEPTION')
    const seen = new Set([title.titleId])
    for (let current = parent; current; current = byId.get(current.geographicParentTitleId)) {
      assert.ok(!seen.has(current.titleId), 'E_TITLE_CYCLE')
      seen.add(current.titleId)
    }
  }
  const kingdoms = titles.filter(title => title.rank === 'kingdom')
  const partition = geography.successor.partition
  assert.equal(partition.length, kingdoms.length, 'E_KINGDOM_PARTITION')
  for (const row of partition) {
    const title = byId.get(row.titleId)
    assert.equal(title?.rank, 'kingdom', 'E_KINGDOM_ID')
    assert.equal(title.name, row.name, 'E_KINGDOM_NAME')
    assert.deepEqual(title.jurisdictionRefs, row.jurisdictionRefs, 'E_KINGDOM_GU')
    assert.deepEqual(title.mapCountyTitleIds, row.countyTitleIds, 'E_KINGDOM_COUNTIES')
  }
  const duchies = titles.filter(title => title.rank === 'duchy')
  const counties = titles.filter(title => title.rank === 'county')
  sameSet(kingdoms.flatMap(title => title.jurisdictionRefs), duchies.flatMap(title => title.jurisdictionRefs), 'E_GU_PARTITION')
  sameSet(empire.jurisdictionRefs, duchies.flatMap(title => title.jurisdictionRefs), 'E_EMPIRE_GU')
  sameSet(kingdoms.flatMap(title => title.mapCountyTitleIds), counties.map(title => title.titleId), 'E_COUNTY_PARTITION')
  for (const duchy of duchies) {
    assert.equal(duchy.jurisdictionRefs.length, 1, 'E_DUCHY_GU')
    assert.ok(byId.get(duchy.geographicParentTitleId).jurisdictionRefs.includes(duchy.jurisdictionRefs[0]), 'E_DUCHY_KINGDOM')
  }
  for (const county of counties) {
    assert.ok(county.jurisdictionRefs.length >= 1, 'E_COUNTY_GU')
    for (const gu of county.jurisdictionRefs) assert.ok(empire.jurisdictionRefs.includes(gu), 'E_COUNTY_GU')
    if (county.rank === 'county' && !county.geographicParentException)
      assert.deepEqual(county.jurisdictionRefs, byId.get(county.geographicParentTitleId).jurisdictionRefs, 'E_COUNTY_PARENT_GU')
  }
  for (const exception of exceptions)
    assert.ok(byId.get(exception.mapKingdomTitleId).mapCountyTitleIds.includes(exception.titleId), 'E_EXCEPTION_MAP')

  const edition = (key, sourceKey) => {
    const contract = territorialScale.slotEditions[key]
    assert.equal(contract.sourcePointer, '/' + sourceKey, 'E_SLOT_SOURCE')
    const groups = geography[sourceKey]
    sameSet(groups.map(group => group.countyTitleId), counties.map(title => title.titleId), 'E_SLOT_COUNTIES')
    const rows = groups.flatMap(group => group.slots.map(slot => ({ slotId: slot.slotId,
      countyTitleId: group.countyTitleId, dongId: slot.dongId, fragmentId: slot.fragmentId,
      jurisdictionGuRef: slot.jurisdictionGuRef, sourceEdition: slot.sourceEdition,
      geometryVerified: slot.geometryVerified,
      ...(key === 'dated' ? { currentCorrespondenceSlotIds: slot.currentCorrespondenceSlotIds } : {}),
    })))
    assert.equal(rows.length, contract.count, 'E_SLOT_COUNT:' + key)
    unique(rows.map(row => row.slotId), 'E_SLOT_DUPLICATE:' + key)
    for (const row of rows) {
      assert.equal(row.sourceEdition, contract.edition, 'E_SLOT_EDITION')
      assert.equal(row.geometryVerified, contract.geometryVerified, 'E_SLOT_GEOMETRY')
      assert.equal(row.fragmentId, null, 'E_SLOT_FRAGMENT')
      assert.ok(byId.get(row.countyTitleId)?.jurisdictionRefs.includes(row.jurisdictionGuRef), 'E_SLOT_JURISDICTION')
      assert.equal(forbidden.some(field => field in row), false, 'E_PRIVATE_SLOT')
    }
    return rows
  }
  const dated = edition('dated', 'countySlots')
  const currentCorrespondence = edition('currentCorrespondence', 'currentCorrespondenceSlots')
  assert.equal(territorialScale.slotEditions.dated.edition, geography.spatialSource.edition, 'E_DATED_EDITION')
  assert.equal(territorialScale.slotEditions.dated.baseDate, geography.spatialSource.baseDate, 'E_DATED_DATE')
  assert.equal(territorialScale.slotEditions.dated.currentBoundaryCertification, false, 'E_DATED_CERTIFICATION')
  assert.equal(territorialScale.slotEditions.currentCorrespondence.edition, geography.editions.currentCorrespondence.id, 'E_CURRENT_EDITION')
  assert.equal(territorialScale.slotEditions.currentCorrespondence.administrativeCandidateDate, geography.editions.currentCorrespondence.administrativeCandidateDate, 'E_CURRENT_DATE')
  assert.equal(territorialScale.slotEditions.currentCorrespondence.checkedAt, geography.editions.currentCorrespondence.officialMembershipCheckedAt, 'E_CURRENT_CHECKED')
  assert.equal(geography.editions.currentCorrespondence.geometryVerified, false, 'E_CURRENT_GEOMETRY')
  const currentById = new Map(currentCorrespondence.map(row => [row.slotId, row]))
  const reached = []
  for (const row of dated) {
    assert.ok(row.currentCorrespondenceSlotIds.length > 0, 'E_SLOT_CORRESPONDENCE')
    for (const id of row.currentCorrespondenceSlotIds) {
      const match = currentById.get(id)
      assert.ok(match, 'E_SLOT_CORRESPONDENCE:' + id)
      assert.equal(match.countyTitleId, row.countyTitleId, 'E_SLOT_CORRESPONDENCE_COUNTY')
      assert.equal(match.jurisdictionGuRef, row.jurisdictionGuRef, 'E_SLOT_CORRESPONDENCE_GU')
      reached.push(id)
    }
  }
  sameSet(reached, currentCorrespondence.map(row => row.slotId), 'E_SLOT_COVERAGE')
  return { schema: 'admin-territorial-scale.v2', geographySha256,
    contractSha256: sha256(JSON.stringify(territorialScale)), titles,
    slotEditions: { dated: { edition: territorialScale.slotEditions.dated.edition,
      baseDate: territorialScale.slotEditions.dated.baseDate,
      geometryVerified: true, rows: dated },
    currentCorrespondence: { edition: territorialScale.slotEditions.currentCorrespondence.edition,
      administrativeCandidateDate: territorialScale.slotEditions.currentCorrespondence.administrativeCandidateDate,
      checkedAt: territorialScale.slotEditions.currentCorrespondence.checkedAt,
      geometryVerified: false, rows: currentCorrespondence } } }
}

export function validateAdminTerritorialScale(output, inputs) {
  const expected = buildAdminTerritorialScale(inputs)
  exactKeys(output, Object.keys(expected), 'E_SCALE_OUTPUT_FIELDS')
  assert.deepEqual(output, expected, 'E_SCALE_PROJECTION')
}
