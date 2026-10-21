import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { stateNames } from './approved-organization-aliases.mjs'
import { producePersonDetails } from './person-detail-production.mjs'
import { assertPersonalTierPreservation } from './personal-tier-provenance.mjs'
import { currentAffiliations } from './current-affiliation.mjs'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'
import proj4 from 'proj4'
import { createHash } from 'node:crypto'
import { validateHoldingFacility } from './holding-facility.mjs'
import { projectOutsideOccupation } from './outside-occupation.mjs'
import { projectOpeningFeudalAllocation } from './opening-feudal-allocation.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { REGION_CONTENT_SOURCE_HASHES } from './cast-sqlite/region-content-documents.mjs'

const NONOWNING_APPROVAL_SHA256 = '44a49cbb8341d87214ebeef9d9e303cb5591f7c9c50327016516a7627b5eb2b8'

const publicStateName = (cell) => cell.replace(/\([^)]*\)/gu, '').trim()

const splitCells = (line) => line.split('|').slice(1, -1).map((cell) => cell.trim())

const rowCell = (row, prefix) => Object.entries(row).find(([key]) => key === prefix || key.startsWith(prefix))?.[1] ?? ''

const tableRows = (markdown) => {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) => line.startsWith('|') && !/^\|\s*---/.test(line))
  if (start < 0) return []
  const block = []
  for (const line of lines.slice(start)) {
    if (!line.startsWith('|')) break
    if (!/^\|\s*---/.test(line)) block.push(line)
  }
  const header = /국명|ID/.test(block[0] ?? '') ? splitCells(block.shift()) : null
  return block.map((line) => {
    const cells = splitCells(line)
    return header
      ? Object.fromEntries(header.map((column, index) => [column, cells[index] ?? '']))
      : { '국명': cells[0] ?? '', '기원': cells[1] ?? '', '형태': cells[2] ?? '', '강국': cells[3] ?? '', '원인': cells[4] ?? '' }
  }).filter((row) => row['국명'] && row['국명'] !== '국명')
}

const parseStateRows = (markdown) => {
  const rows = tableRows(markdown).map((row) => {
    const idCell = row.ID ?? row['식별자'] ?? ''
    const id = idCell.match(/S(?:0[1-9]|1[0-6])/u)?.[0]
    const capital = (rowCell(row, '수도역') || rowCell(row, '중심역')).replace(/역$/u, '').trim()
    const rawName = row['국명']
    return {
      id,
      name: publicStateName(rawName),
      names: [publicStateName(rawName)],
      government: rowCell(row, '정부') || rowCell(row, '형태'),
      power: (rowCell(row, '2125년 11월 강약 장부 등급') || rowCell(row, '등급') || rowCell(row, '강국')).split(',')[0].trim(),
      cause: rowCell(row, '주요 관계') || rowCell(row, '원인') || rowCell(row, '인과') || rowCell(row, '유래'),
      capital,
    }
  })
  if (rows.length !== 16 || rows.some((row) => !row.name || !row.id) || new Set(rows.map((row) => row.id)).size !== 16) throw new Error(`E_STATE_TABLE:${rows.length}`)
  if (rows.some((row) => !row.capital)) throw new Error(`E_STATE_CAPITAL:${rows.filter((row) => !row.capital).map((row) => row.name).join(',')}`)
  return rows
}

const leaderForNames = (markdown, names) => {
  if (!markdown) return ''
  const ranked = []
  for (const match of markdown.matchAll(/^## ([^\n]+)\n\n([\s\S]*?)(?=\n## |$)/gm)) {
    const intro = match[2].split('\n', 1)[0]
    const introHit = names.some((candidate) => candidate && (intro.startsWith(candidate) || intro.includes(`${candidate} `)))
    const bodyHit = names.some((candidate) => candidate && match[2].includes(candidate))
    if (introHit || bodyHit) ranked.push({ person: match[1].trim(), score: introHit ? 2 : 1 })
  }
  ranked.sort((left, right) => right.score - left.score)
  return ranked[0]?.person ?? ''
}

export function projectPersonStateInputs(renderedBySlug, pagesBySlug, { organizationAliases = new Map() } = {}) {
const stateSource = renderedBySlug.get('Sixteen-States')
const officesSource = renderedBySlug.get('Offices-and-Ranks')
if (!stateSource || !officesSource) throw new Error('E_STATE_OR_OFFICE_PAGE_MISSING')
if (!pagesBySlug.get('Sixteen-States')?.value.source?.refs?.includes('lore/factions/Sixteen-States.md')) throw new Error('E_STATE_CANON_PROVENANCE')
const officeTable = officesSource.match(/\| 국가 \| 티어1 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
const stateRows = parseStateRows(stateSource).map((row) => ({ ...row, names: stateNames(row.name, organizationAliases) }))
const affiliations = currentAffiliations(pagesBySlug.get('Sixteen-States').value.data.currentAffiliation, stateRows)
const coreCharacters = renderedBySlug.get('Core-Characters')
const stateIdByName = new Map(stateRows.map((row) => [row.name, row.id]))
const tiersByState = new Map([...officeTable.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .filter((match) => match[1].trim() !== '국가')
  .map((match) => [stateIdByName.get(match[1].trim()) ?? match[1].trim(), match.slice(2).map((cell) => cell.split('·').map((rank) => rank.trim()))]))
if (tiersByState.size !== 16) throw new Error(`E_OFFICE_TIER_COVERAGE:${tiersByState.size}`)
const stateCatalog = stateRows.map((row) => ({
  slug: row.id.toLowerCase(),
  id: row.id,
  name: affiliations.get(row.id).currentName,
  currentHegemon: affiliations.get(row.id).currentHegemon,
  currentBase: affiliations.get(row.id).currentBase,
  currentExclusiveDistricts: affiliations.get(row.id).currentExclusiveDistricts,
  government: row.government,
  power: row.power,
  cause: row.cause,
  ruler: row.id === 'S04'
    ? (() => { const name = coreCharacters.match(/2126년 당회장 자리는 ([가-힣]{2,4})가 앉았다\./u)?.[1]; if (!name) throw new Error('E_S04_OPENING_RULER'); return name })()
    : row.government.match(/(?:^|[,，]\s*)회장 ([가-힣]{2,4})(?:$|[,，\s])/u)?.[1] ?? leaderForNames(coreCharacters, row.names),
  capital: row.capital,
  capitalName: row.capital,
}))
const stateNameById = new Map(stateCatalog.map(state => [state.slug.toUpperCase(), state.name]))
return { stateSource, stateRows, stateCatalog, stateNameById, tiersByState, affiliations, stateIdByName }
}

export function authenticateNonowningRights(bytes) {
  if (!(typeof bytes === 'string' || Buffer.isBuffer(bytes))
    || createHash('sha256').update(bytes).digest('hex') !== NONOWNING_APPROVAL_SHA256) throw new Error('E_CATALOG_NONOWNING_APPROVAL')
  return JSON.parse(bytes.toString())
}

export async function projectCatalogOutsideOccupation(control, geometry, islands, sourceBytes) {
  const bytes = sourceBytes ?? {
    approval: await readFile(new URL('./approved-outside-current-retirement.json', import.meta.url)),
    control: await readFile(new URL('./historical-inputs/outside-control-2126.json', import.meta.url)),
    islands: await readFile(new URL('./historical-inputs/outside-island-occupation.json', import.meta.url)),
  }
  const hashes = {
    approval: '3a34d1ee5a7648962baeab0142cf9be6aa2d1aeace46737511f42b71d0fb4e59',
    control: '1730b9d63528b02b963d69d0c376ec53fad01a351deeaf4665c1a00486b38707',
    islands: 'c1d71e841201b6886ee3bf01cd14e1319cde466f48f55edcfe9420f02fde6e10',
  }
  for (const [key, hash] of Object.entries(hashes)) {
    if (!(typeof bytes[key] === 'string' || Buffer.isBuffer(bytes[key]))
      || createHash('sha256').update(bytes[key]).digest('hex') !== hash) throw new Error('E_CATALOG_RETIREMENT_HASH:' + key)
  }
  const approval = JSON.parse(bytes.approval.toString())
  // This pinned receipt was verified when the build-only transcription was reviewed.
  // A production build never depends on private .omo files or accepts caller receipts.
  if (approval.approvalReceipt.sha256 !== '7dcf7d3222b25c52a4cde3005051fe0930d1b95a3cb748877a004f66771244ee'
    || approval.originalSources.control.sha256 !== hashes.control || approval.originalSources.islands.sha256 !== hashes.islands
    || approval.records.length !== 1426 || approval.records.some(row => row.status !== 'retired-current')) throw new Error('E_CATALOG_RETIREMENT_APPROVAL')
  return projectOutsideOccupation(control, geometry, islands, {
    ...approval, originalControl: JSON.parse(bytes.control.toString()), originalIslands: JSON.parse(bytes.islands.toString()),
  })
}

export async function projectCatalogHoldings(args, context, approvalBytes) {
  const approval = authenticateNonowningRights(approvalBytes ?? await readFile(new URL('./approved-daejeon-nonowning-rights.json', import.meta.url)))
  if (args.nonowningRights !== undefined) throw new Error('E_CATALOG_NONOWNING_ARGUMENT')
  const { existing: personalHoldings, allocation } = args
  const { issuedById, territoryStates, openingTerritories, projectedLandmarks, stationInteriors, seoulGraph, outsideGeometry, repoRoot, geography } = context
  const nonowningHoldings = personalHoldings.holdings.filter(row => row.kind === 'superior-jurisdiction')
  const nonowningTitles = allocation.titles.filter(row => row.kind === 'superior-jurisdiction' || row.kind === 'nonterritorial-political-title')
  if (nonowningHoldings.length || nonowningTitles.length) {
    const exactIds = (actual, expected) => actual.length === expected.length && new Set(actual).size === actual.length && expected.every(id => actual.includes(id))
    if (!exactIds(nonowningHoldings.map(row => row.id), approval.contract.rights.map(row => row.holdingId))
      || !exactIds(nonowningTitles.map(row => row.id), [...approval.contract.rights.map(row => row.titleId), approval.contract.politicalTitle.id])) throw new Error('E_CATALOG_NONOWNING_SET')
    const bindings = allocation.existingTitleBindings.filter(binding => approval.contract.rights.some(row => row.holdingId === binding.holdingId))
    if (!exactIds(bindings.map(row => row.holdingId), approval.contract.rights.map(row => row.holdingId))) throw new Error('E_CATALOG_NONOWNING_BINDINGS')
    for (const row of [...nonowningHoldings, ...nonowningTitles]) {
      if (Object.keys(approval.activeRecordPolicy).some(key => Object.hasOwn(row, key))) throw new Error('E_CATALOG_NONOWNING_STATUS:' + row.id)
    }
    for (const row of approval.contract.rights) {
      const scope = row.geographicScope
      const duchies = geography.titles.filter(title => title.titleId === scope.duchyTitleId)
      const counties = geography.titles.filter(title => title.rank === 'county' && title.jurisdictionRefs.includes(scope.guRef))
      if (duchies.length !== 1 || duchies[0].rank !== 'duchy'
        || !exactIds(duchies[0].jurisdictionRefs, [scope.guRef])
        || counties.some(title => !exactIds(title.jurisdictionRefs, [scope.guRef]))
        || !exactIds(counties.map(title => title.titleId), scope.countyTitleIds)) throw new Error('E_CATALOG_NONOWNING_GEOGRAPHY:' + row.holdingId)
    }
  }
  for (const holding of personalHoldings.holdings) {
    if (holding.kind === 'superior-jurisdiction') continue
    const rulerState = territoryStates.find(state => state.id === holding.stateId && state.ruler === issuedById.get(holding.holderPersonId)?.name)
    const independentPolity = personalHoldings.polities.find(polity => polity.id === holding.stateId && polity.sovereignPersonId === holding.holderPersonId)
    if (!issuedById.has(holding.holderPersonId) || (holding.directLiegePersonId === null ? !rulerState && !independentPolity : !issuedById.has(holding.directLiegePersonId)) || (!holding.stationRef && !holding.facilityRef && !holding.landmarkRef && !holding.adminRefs.length)) throw new Error('E_PERSON_HOLDING:' + holding.id)
    if (holding.stationRef) {
      const station = openingTerritories.stations.find(station => station.id === holding.stationRef.stationId)
      if (!rulerState || holding.directLiegePersonId !== null || rulerState.capitalStationId !== holding.stationRef.stationId || station?.name !== holding.stationRef.stationName || !station.control.polityIds.includes(holding.stateId) || holding.adminRefs.length || holding.facilityRef || holding.geometrySource !== null || holding.territorialScale !== null || holding.formalTitleRank !== null) throw new Error('E_CAPITAL_HOLDING:' + holding.id)
    }
    if (holding.landmarkRef) {
      const landmark = projectedLandmarks.find(site => site.id === holding.landmarkRef.landmarkId)
      if (!landmark || landmark.holderId !== holding.stateId || holding.landmarkRef.sourcePath !== 'lore/places/landmark-roles.json' || holding.stationRef || holding.facilityRef || holding.adminRefs.length) throw new Error('E_HOLDING_LANDMARK:' + holding.id)
    }
    if (holding.facilityRef) {
      await validateHoldingFacility(holding, stationInteriors, repoRoot)
      const ref = holding.facilityRef
      const station = seoulGraph.stations.find(station => station.id === (ref.stationId ?? ref.stationName))
      if (!station || station.nameKo !== ref.stationName || station.district !== ref.stationIdentity.district || Number(station.lat.toFixed(5)) !== ref.stationIdentity.lat || Number(station.lon.toFixed(5)) !== ref.stationIdentity.lon) throw new Error('E_HOLDING_STATION_ID:' + holding.id)
    }
    for (const ref of holding.adminRefs) {
      const region = (holding.geometrySource === 'outside-admin-units.units' ? outsideGeometry.units : openingTerritories.regions).find(region => region.id === ref.id)
      if (!region || region.name !== ref.name) throw new Error('E_HOLDING_ADMIN_REF:' + holding.id + ':' + ref.id)
    }
  }

  return projectOpeningFeudalAllocation({ ...args, nonowningRights: approval.contract })
}

export async function loadApprovedRightsHistory(sourceBytes) {
  const bytes = sourceBytes ?? {
    approval: await readFile(new URL('./approved-seoul-rights-transition.json', import.meta.url)),
    existing: await readFile(new URL('./historical-inputs/personal-holdings.json', import.meta.url)),
    allocation: await readFile(new URL('./historical-inputs/opening-feudal-allocation.json', import.meta.url)),
    control: await readFile(new URL('./historical-inputs/outside-control-2126.json', import.meta.url)),
    islands: await readFile(new URL('./historical-inputs/outside-island-occupation.json', import.meta.url)),
    geometry: await readFile(new URL('./historical-inputs/outside-admin-units.json', import.meta.url)),
    scale: await readFile(new URL('./historical-inputs/admin-territorial-scale.json', import.meta.url)),
  }
  const hashes = {
    approval: '384a139fef7546027dcbb7237f31b59aca9cdc28d6033b59f43109bf2f2cf86d',
    existing: '8c0662452209932051a19f530defa62355b4810556abaa6ca590f04cd5800873',
    allocation: 'bacce5fd916a5fc22fa1a0b811880703c7d2ddea389d41fa6609b1b3ea6e78dd',
    control: '1730b9d63528b02b963d69d0c376ec53fad01a351deeaf4665c1a00486b38707',
    islands: 'c1d71e841201b6886ee3bf01cd14e1319cde466f48f55edcfe9420f02fde6e10',
    geometry: 'dd23944da5f558e9d772a4b2d41963f46de555680677f1e838e73447497556c6',
    scale: '8318d2543cc794b5ff9b5cb511187c2c1afb2f20e29b552ebdb37cdefdc725cb',
  }
  for (const [key, hash] of Object.entries(hashes)) {
    if (!(typeof bytes[key] === 'string' || Buffer.isBuffer(bytes[key]))
      || createHash('sha256').update(bytes[key]).digest('hex') !== hash) throw new Error('E_CATALOG_RIGHTS_HASH:' + key)
  }
  const parsed = Object.fromEntries(Object.entries(bytes).map(([key, value]) => [key, JSON.parse(value.toString())]))
  if (parsed.approval.approvalReceiptSha256 !== '7dcf7d3222b25c52a4cde3005051fe0930d1b95a3cb748877a004f66771244ee'
    || parsed.approval.nonowningPackageSha256 !== NONOWNING_APPROVAL_SHA256) throw new Error('E_CATALOG_RIGHTS_APPROVAL')
  const geometry = parsed.geometry
  const control = projectOutsideOccupation(parsed.control, geometry, parsed.islands)
  return { transition: parsed.approval, historical: {
    existing: parsed.existing, allocation: parsed.allocation, control, scale: parsed.scale,
    outside: { ...geometry, islands: control.assignments.filter(row => row.components).map(row => ({ unitId: row.unitId, components: row.components })) },
  } }
}

// Production current rights must pass both full history and exact disposition.
export async function projectCatalogCurrentHoldings(args, context, sourceBytes) {
  if (args.rightsTransition !== undefined || args.historicalRights !== undefined) throw new Error('E_CATALOG_RIGHTS_ARGUMENT')
  if (args.scale !== undefined || args.geographicScale?.schema !== 'admin-territorial-scale.v2') throw new Error('E_CATALOG_GEOGRAPHIC_SCALE')
  const { transition, historical } = await loadApprovedRightsHistory(sourceBytes)
  const { geographicScale, ...historicalContext } = args
  return projectCatalogHoldings({ ...args, rightsTransition: transition,
    historicalRights: { ...historicalContext, ...historical, nonowningRights: undefined },
  }, context, sourceBytes?.nonowning)
}

export function currentOfficeAppointments(source, issuedById) {
  if (source.schema !== 'opening-office-appointments.v2') throw new Error('E_OPENING_OFFICE_SCHEMA')
  const appointments = new Map()
  const paired = value => value && typeof value.ko === 'string' && value.ko.trim() && typeof value.en === 'string' && value.en.trim()
  for (const row of source.appointments) {
    const { history, current } = row
    const office = ['retained-office', 'nonterritorial-political-office'].includes(current?.status)
    const unappointed = current?.status === 'unappointed'
    if (appointments.has(row.personId) || !issuedById.has(row.personId)
      || history?.personId !== row.personId || history.stateId !== row.stateId
      || !paired(history.position) || !paired(history.rank) || !history.approvalRef
      || !['retained-office', 'nonterritorial-political-office', 'nonowning-jurisdiction', 'existing-function', 'unappointed'].includes(current?.status)
      || !/^T[1-5]$/u.test(current.commonTier) || current.commonTier !== history.commonTier
      || (unappointed ? current.position !== null : !paired(current.position))
      || (office ? !paired(current.rank) : current.rank !== null)
      || !Array.isArray(current.evidence) || current.evidence.length === 0
      || (current.status === 'retained-office' && !current.evidence.some(ref => ref.kind === 'existing-right'))
      || (current.status === 'nonterritorial-political-office' && !current.evidence.some(ref => ref.kind === 'existing-political-office'))
      || (current.status === 'nonowning-jurisdiction' && !current.evidence.some(ref => ref.kind === 'existing-nonowning-right'))
      || (current.status === 'existing-function' && !current.evidence.some(ref => ref.kind === 'existing-function'))
      || (unappointed && !current.evidence.some(ref => ref.kind === 'retired-office'))
      // current-seoul-work-location: approved Seoul work-location pointer (doc247-regions-fix-20261019 review row 23 via the final-closure successor).
      || current.evidence.some(ref => !['approved-retained-office', 'existing-right', 'existing-political-office', 'existing-nonowning-right', 'existing-function', 'retired-office', 'current-seoul-work-location'].includes(ref.kind)
        || typeof ref.path !== 'string' || !ref.path.endsWith('.json') || !ref.jsonPointer?.startsWith('/')))
      throw new Error('E_OPENING_OFFICE:' + row.personId)
    appointments.set(row.personId, { personId: row.personId, stateId: row.stateId,
      position: current.position?.ko ?? '', rank: current.rank?.ko ?? '', commonTier: current.commonTier })
  }
  return appointments
}

export async function loadPersonDetailSources({ repoRoot } = {}) {
  repoRoot = resolve(repoRoot)
  const { openReadOnly } = await import('./cast-sqlite/db.mjs')
  const { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } = await import('./document-store/evidence.mjs')
  const { loadDatabasePersonProductionInputs } = await import('./cast-sqlite/person-detail-inputs.mjs')
  const directory = resolve(repoRoot, '.omo/private/seoul-migration/sqlite-authority-20261021')
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(repoRoot, 'data/canonical/wiki-cast.sqlite'))
  const handles = [db]
  try {
    const options = { capability: INTERNAL_EVIDENCE_CAPABILITY }
    const evidenceStore = openEvidenceStore(process.env.WIKI_TIER_EVIDENCE_DB ?? resolve(directory, 'person-tier-dependencies-evidence-20261020.sqlite'), options)
    handles.push(evidenceStore)
    const historyStore = openEvidenceStore(process.env.WIKI_TIER_HISTORY_DB ?? resolve(directory, 'person-tier-history-evidence-20261020.sqlite'), options)
    handles.push(historyStore)
    return await loadDatabasePersonProductionInputs({ db, repoRoot, evidenceStore, historyStore,
      editorialProfileDb: process.env.WIKI_EDITORIAL_PROFILE_DB ?? resolve(directory, 'editorial-profiles.sqlite'),
      soulAssignmentDb: process.env.WIKI_SOUL_ASSIGNMENT_DB ?? resolve(directory, 'soul-assignments.sqlite') })
  } finally { for (const handle of handles.reverse()) handle.close() }
}

export async function produceFromPersonDetailSources(sources, { personalHoldings, stateNameById, tiersByState, officeAppointments }) {
  assertPersonalTierPreservation(sources.personalTierPreservation)
  return producePersonDetails({ ...sources, personalHoldings, stateNameById, tiersByState, officeAppointments })
}

export async function projectPersonHoldingsInputs(sources, { repoRoot, territoryStates, openingTerritories,
  projectedLandmarks, seoulGraph, outsideGeometry, projectedOutsideControl, affiliation, geography, geographicScale, historyBytes }) {
  const { peopleSource, courtDataset, issuedById, originalHoldings, openingAllocation, stationInteriors } = sources
  return projectCatalogCurrentHoldings({
    allocation: openingAllocation, existing: originalHoldings,
    people: peopleSource.map(person => ({ id: courtDataset.people.find(issued => issued.name === person.name)?.id, name: person.name, state: person.state })),
    seoul: openingTerritories,
    outside: { ...outsideGeometry, islands: projectedOutsideControl.assignments.filter(unit => unit.components).map(unit => ({ unitId: unit.unitId, components: unit.components })) },
    control: projectedOutsideControl, affiliation, geographicScale,
  }, { issuedById, territoryStates, openingTerritories, projectedLandmarks, stationInteriors,
    seoulGraph, outsideGeometry, repoRoot, geography }, historyBytes)
}

export async function loadPersonHoldingsContext(sources, { repoRoot, stateRows, stateCatalog }) {
  const bytesFor = sources.bytesFor ?? (async path => readSourceArchive(path, undefined, process.env.WIKI_DOCUMENT_DB ?? resolve(repoRoot, 'data/canonical/wiki-cast.sqlite')))
  const read = async path => readCanonicalDocument(path, { predecessor: true, databasePath: process.env.WIKI_DOCUMENT_DB ?? resolve(repoRoot, 'data/canonical/wiki-cast.sqlite') })
  const lore = path => read(`lore/${path}`)
  const snapshotManifest = await read('snapshots/build-inputs/source-manifest.json')
  const snapshot = async name => {
    const bytes = await bytesFor(`snapshots/build-inputs/${name}`)
    const expected = snapshotManifest.files.find(row => row.path === name)?.sha256
    if (!expected || createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('E_PERSON_SNAPSHOT_HASH:' + name)
    return bytes
  }
  const atlas = JSON.parse((await snapshot('atlas-data.js')).toString().replace(/^window\.SEOUL_REGION_ATLAS=/, '').replace(/;\s*$/, ''))
  const seoulGraph = JSON.parse((await snapshot('SeoulWorldGraph.json')).toString())
  await snapshot('creative-name-normalization.json')
  const geographyBytes = await bytesFor('lore/regions/seoul-electoral-titles.json')
  const territorialScale = (await lore('offices/Offices-and-Ranks.json')).data.territorialScale
  const geographicScale = buildAdminTerritorialScale({ geographyBytes, territorialScale })
  const geography = JSON.parse(geographyBytes.toString())
  const sixteenStatesLore = await lore('factions/Sixteen-States.json')
  const regionContentById = new Map()
  for (const path of Object.keys(REGION_CONTENT_SOURCE_HASHES)) {
    const district = await read(path)
    for (const region of district.regions) regionContentById.set(region.region_id, region.content)
  }
  if (regionContentById.size !== 427) throw new Error(`E_REGION_CONTENT_COVERAGE:${regionContentById.size}`)
  const surfaceHolders = content => content?.territory?.holders.map(holder => holder.polity) ?? []
  const stationControlLedger = await lore('places/station-control-overrides.json')
  const stationControlOverrides = new Map(stationControlLedger.overrides.map(entry => [entry.stationId, entry]))
  const stateNameById = new Map(stateCatalog.map(state => [state.id, state.name]))
  if (stationControlOverrides.size !== stationControlLedger.overrides.length) throw new Error('E_STATION_CONTROL_DUPLICATE')
  for (const entry of stationControlLedger.overrides) {
    if (!entry.polityIds?.length || !entry.polityIds.every(id => stateNameById.has(id)) || !entry.polityIds.includes(entry.primary)) throw new Error(`E_STATION_CONTROL_PRIMARY:${entry.stationId}`)
    if (entry.status !== (entry.polityIds.length === 1 ? 'held' : 'contested')) throw new Error(`E_STATION_CONTROL_STATUS:${entry.stationId}`)
  }
  const stationCatalog = await lore('places/Seoul-Station-Catalog.json')
  const approvedStationAliases = stationCatalog.data.station_aliases
  const stationById = new Map(seoulGraph.stations.map(station => [station.id, station]))
  const canonicalBySourceId = new Map(approvedStationAliases.flatMap(entry => [entry.id, ...entry.aliases].map(id => [id, entry.id])))
  if (canonicalBySourceId.size !== approvedStationAliases.reduce((count, entry) => count + 1 + entry.aliases.length, 0) || [...canonicalBySourceId.keys()].some(id => !stationById.has(id))) throw new Error('E_STATION_ALIAS_SOURCE')
  const canonicalStationId = id => canonicalBySourceId.get(id) ?? id
  proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs')
  const geometryRings = geometry => geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  const allMapPoints = atlas.regions.flatMap(region => geometryRings(region.map_geometry).flat())
  const mapBounds = allMapPoints.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x), maxX: Math.max(bounds.maxX, x),
    minY: Math.min(bounds.minY, y), maxY: Math.max(bounds.maxY, y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
  const mapWidth = 1200
  const mapHeight = Math.round(mapWidth * (mapBounds.maxY - mapBounds.minY) / (mapBounds.maxX - mapBounds.minX))
  const simplifyRing = ring => {
    const step = Math.max(1, Math.floor(ring.length / 80))
    const selected = ring.filter((_, index) => index % step === 0)
    if (selected.at(-1) !== ring.at(-1)) selected.push(ring.at(-1))
    return selected
  }
  const mapPoint = ([x, y]) => [
    Number(((x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX) * mapWidth).toFixed(2)),
    Number(((mapBounds.maxY - y) / (mapBounds.maxY - mapBounds.minY) * mapHeight).toFixed(2)),
  ]
  const pointInPolygon = ([x, y], points) => {
    let inside = false
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
      const [currentX, currentY] = points[index]
      const [previousX, previousY] = points[previous]
      if ((currentY > y) !== (previousY > y) && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) inside = !inside
    }
    return inside
  }
  const stationIdByName = new Map(seoulGraph.stations.map(station => [station.nameKo.replace(/역$/u, ''), station.id]))
  for (const entry of approvedStationAliases) for (const alias of entry.aliases) stationIdByName.set(alias, entry.id)
  const capitalStationIds = new Map(stateRows.map(state => [state.id, stationIdByName.get(state.capital.replace(/역$/u, ''))]))
  for (const [stateId, id] of capitalStationIds) if (!id) throw new Error(`E_CAPITAL_STATION_NOT_FOUND:${stateId}`)
  const stations = seoulGraph.stations.filter(station => canonicalStationId(station.id) === station.id).map(station => {
    const [east, north] = proj4('EPSG:4326', 'EPSG:5179', [station.lon, station.lat])
    const [x, y] = mapPoint([east, north])
    if (x < 0 || x > mapWidth || y < 0 || y > mapHeight) throw new Error(`E_STATION_MAP_BOUNDS:${station.id}:${x}:${y}`)
    const content = atlas.regions.find(region => pointInPolygon([x, y], simplifyRing(geometryRings(region.map_geometry)[0]).map(mapPoint)))
    const baselinePolityIds = surfaceHolders(content && regionContentById.get(content.id))
    const delta = stationControlOverrides.get(station.id)
    const capital = [...capitalStationIds.entries()].find(([, id]) => id === station.id)?.[0]
    const polityIds = delta?.polityIds ?? (capital ? [capital] : baselinePolityIds)
    return { id: station.id, name: station.nameKo, control: { polityIds } }
  })
  const regions = atlas.regions.map(region => ({ id: region.id, name: region.name, polities: surfaceHolders(regionContentById.get(region.id)) }))
  const territoryStates = stateCatalog.map(state => ({ id: state.id, ruler: state.ruler, capitalStationId: capitalStationIds.get(state.id) }))
  const projectedLandmarks = (await lore('places/landmark-roles.json')).sites
  const openingTerritories = { regions, stations }
  const historyPaths = { approval: 'scripts/approved-seoul-rights-transition.json',
    existing: 'scripts/historical-inputs/personal-holdings.json',
    allocation: 'scripts/historical-inputs/opening-feudal-allocation.json',
    control: 'scripts/historical-inputs/outside-control-2126.json',
    islands: 'scripts/historical-inputs/outside-island-occupation.json',
    geometry: 'scripts/historical-inputs/outside-admin-units.json',
    scale: 'scripts/historical-inputs/admin-territorial-scale.json',
    nonowning: 'scripts/approved-daejeon-nonowning-rights.json' }
  const historyBytes = Object.fromEntries(await Promise.all(Object.entries(historyPaths).map(async ([key, path]) => [key, await bytesFor(path)])))
  const outsideGeometry = (await loadApprovedRightsHistory(historyBytes)).historical.outside
  const retirementPaths = { approval: 'scripts/approved-outside-current-retirement.json',
    control: historyPaths.control, islands: historyPaths.islands }
  const retirementBytes = Object.fromEntries(await Promise.all(Object.entries(retirementPaths).map(async ([key, path]) => [key, await bytesFor(path)])))
  const projectedOutsideControl = await projectCatalogOutsideOccupation(await lore('regions/outside-control-2126.json'), outsideGeometry, await lore('regions/outside-island-occupation.json'), retirementBytes)
  const personalHoldings = await projectPersonHoldingsInputs(sources, { repoRoot, territoryStates, openingTerritories,
    projectedLandmarks, seoulGraph, outsideGeometry, projectedOutsideControl,
    affiliation: sixteenStatesLore.data.currentAffiliation, geography, geographicScale, historyBytes })
  return { personalHoldings, stateNameById, geographicScale, snapshotManifest }
}
