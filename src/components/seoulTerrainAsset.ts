export type SeoulTerrain = {
  schema: 'seoul-terrain.v2'; projection: 'EPSG:5179'; regionCount: 427
  bboxEPSG5179: [number, number, number, number]; width: number; height: number
  rasterFile: 'seoul-terrain.png'; rasterSha256: string
  waterFile: 'seoul-terrain-water.json'; waterSha256: string
  clipFile: 'seoul-terrain-clip.json'; clipSha256: string
  attribution: string
}

const names = ['seoul-terrain.png', 'seoul-terrain-water.json', 'seoul-terrain-clip.json'] as const
const hex = /^[a-f0-9]{64}$/u

export async function verifiedSeoulTerrain(base: string, meta: SeoulTerrain, map: { regions: unknown[]; projection: { minEast: number; minNorth: number; maxEast: number; maxNorth: number } }, signal: AbortSignal) {
  if (meta.schema !== 'seoul-terrain.v2' || meta.projection !== 'EPSG:5179' || map.regions.length !== 427 || meta.regionCount !== 427 || meta.width < 1 || meta.height < 1 || !Array.isArray(meta.bboxEPSG5179) || meta.bboxEPSG5179.length !== 4 || !meta.bboxEPSG5179.every(Number.isFinite)) throw new Error('E_SEOUL_TERRAIN_SCOPE')
  if (meta.rasterFile !== names[0] || meta.waterFile !== names[1] || meta.clipFile !== names[2] || ![meta.rasterSha256, meta.waterSha256, meta.clipSha256].every(value => hex.test(value))) throw new Error('E_SEOUL_TERRAIN_MANIFEST')
  const bytes = await Promise.all(names.map(async (name, index) => {
    const response = await fetch(`${base}${name}`, { signal })
    if (!response.ok) throw new Error(`E_SEOUL_TERRAIN_FETCH:${name}:${response.status}`)
    const content = await response.arrayBuffer()
    const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', content))].map(byte => byte.toString(16).padStart(2, '0')).join('')
    if (sha !== [meta.rasterSha256, meta.waterSha256, meta.clipSha256][index]) throw new Error(`E_SEOUL_TERRAIN_SHA:${name}`)
    return content
  }))
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  const water = JSON.parse(new TextDecoder().decode(bytes[1])) as { features: Array<{ id: string; memberIndex: number; kind: string; tag: { waterway: string }; coordinates: number[][] }> }
  const clip = JSON.parse(new TextDecoder().decode(bytes[2])) as { schema: string; projection: string; path: string }
  if (!Array.isArray(water.features) || water.features.some(feature => feature.kind !== 'line' || feature.tag.waterway !== 'river' || !Array.isArray(feature.coordinates) || feature.coordinates.length < 2) || clip.schema !== 'seoul-terrain-clip.v1' || clip.projection !== 'EPSG:5179' || !clip.path?.startsWith('M')) throw new Error('E_SEOUL_TERRAIN_DATA')
  const png = new DataView(bytes[0])
  if (png.byteLength < 24 || png.getUint32(0) !== 0x89504e47 || png.getUint32(4) !== 0x0d0a1a0a || png.getUint32(16) !== meta.width || png.getUint32(20) !== meta.height) throw new Error('E_SEOUL_TERRAIN_PNG')
  return { png: new Blob([bytes[0]], { type: 'image/png' }), water, clip }
}
