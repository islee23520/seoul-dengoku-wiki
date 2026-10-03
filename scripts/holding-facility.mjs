import { readFile, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

export async function validateHoldingFacility(holding, stationInteriors, repoRoot) {
  const ref = holding.facilityRef
  const prefix = 'lore/regions/content/'
  if (isAbsolute(ref.siteSourcePath) || ref.siteSourcePath.includes('\\') ||
      ref.siteSourcePath.split('/').some(part => part === '..' || part === '.' || !part) ||
      !ref.siteSourcePath.startsWith(prefix) || !ref.siteSourcePath.endsWith('.json'))
    throw new Error('E_HOLDING_SOURCE_PATH:' + holding.id)
  const root = await realpath(resolve(repoRoot, prefix))
  const file = await realpath(resolve(repoRoot, ref.siteSourcePath))
  const confined = relative(root, file)
  if (isAbsolute(confined) || confined === '..' || confined.startsWith('..' + sep))
    throw new Error('E_HOLDING_SOURCE_PATH:' + holding.id)
  const source = JSON.parse(await readFile(file, 'utf8'))
  const sites = source.regions.flatMap(region => region.content.buildings)
    .filter(site => site.anchor_ref === ref.siteAnchor)
  const stations = stationInteriors.stations.filter(station =>
    station.name === ref.stationName && station.district === ref.stationIdentity.district &&
    station.lat === ref.stationIdentity.lat && station.lon === ref.stationIdentity.lon)
  if (sites.length !== 1 || sites[0].name !== ref.stationName || sites[0].observed_use !== '역' ||
      source.district_name !== ref.stationIdentity.district || stations.length !== 1)
    throw new Error('E_HOLDING_SITE_REF:' + holding.id)
  const layers = stations[0].layers.filter(layer => layer.id === ref.layerId)
  if (ref.sourcePath !== 'lore/regions/station-interiors.json' || layers.length !== 1 ||
      layers[0].wiki_layer !== ref.layerName || holding.adminRefs.length ||
      holding.geometrySource !== null || holding.territorialScale !== null || holding.formalTitleRank !== null)
    throw new Error('E_HOLDING_FACILITY_REF:' + holding.id)
}
