import { isAbsolute, resolve } from 'node:path'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { REGION_CONTENT_PATHS, readRegionContentDocumentAsync } from './cast-sqlite/region-content-documents.mjs'

export async function validateHoldingFacility(holding, stationInteriors, repoRoot, { tx } = {}) {
  const ref = holding.facilityRef
  const prefix = 'lore/regions/content/'
  if (isAbsolute(ref.siteSourcePath) || ref.siteSourcePath.includes('\\') ||
    ref.siteSourcePath.split('/').some(part => part === '..' || part === '.' || !part) ||
    !ref.siteSourcePath.startsWith(prefix) || !ref.siteSourcePath.endsWith('.json') ||
    !REGION_CONTENT_PATHS.includes(ref.siteSourcePath))
    throw new Error('E_HOLDING_SOURCE_PATH:' + holding.id)
  const source = tx ? await readRegionContentDocumentAsync(tx, { logicalPath: ref.siteSourcePath })
    : readCanonicalDocument(ref.siteSourcePath, {
      databasePath: process.env.WIKI_DOCUMENT_DB
        ?? resolve(repoRoot, 'data/canonical/wiki-cast.sqlite')
    })
  const sites = source.regions.flatMap(region => region.content.buildings)
    .filter(site => site.anchor_ref === ref.siteAnchor)
  const stations = stationInteriors.stations.filter(station =>
    station.name === ref.stationName && station.district === ref.stationIdentity.district &&
    station.lat === ref.stationIdentity.lat && station.lon === ref.stationIdentity.lon)
  if (sites.length !== 1 || sites[0].name !== ref.stationName || sites[0].observed_use !== '역' ||
    source.district_name !== ref.stationIdentity.district || stations.length !== 1 ||
    (stations[0].facilityKind !== undefined && stations[0].facilityKind !== 'station') || !stations[0].network)
    throw new Error('E_HOLDING_SITE_REF:' + holding.id)
  const layers = stations[0].layers.filter(layer => layer.id === ref.layerId)
  if (ref.sourcePath !== 'lore/regions/station-interiors.json' || layers.length !== 1 ||
    layers[0].wiki_layer !== ref.layerName || holding.adminRefs.length ||
    holding.geometrySource !== null || holding.territorialScale !== null || holding.formalTitleRank !== null)
    throw new Error('E_HOLDING_FACILITY_REF:' + holding.id)
}
