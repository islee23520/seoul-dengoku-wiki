import { createHash } from 'node:crypto'

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

// Independent rectangles, not a copy of retired administrative geometry.
export const coordinateMap = {
  width: 100, height: 100,
  projection: { minEast: 0, maxEast: 100, minNorth: 0, maxNorth: 100 },
  regions: [{ id: 'legacy-dong', path: 'M0,0L40,0L40,40L0,40Z' }],
}
export const outsideUnits = [{ id: 'outside-fixture', path: 'M60,60L100,60L100,100L60,100Z' }]

export function terrainFixture() {
  const payloads = new Map()
  const encode = (width, height, sample) => {
    const bytes = Buffer.alloc(width * height * 4)
    for (let row = 0; row < height; row += 1) for (let col = 0; col < width; col += 1) {
      const [elevation, mask] = sample(col, row)
      bytes.writeUInt16LE(elevation + 500, (row * width + col) * 4)
      bytes.writeUInt16LE(mask, (row * width + col) * 4 + 2)
    }
    return bytes
  }
  const store = (file, bytes) => { payloads.set(file, bytes); return sha256(bytes) }
  const water = (west, south, east, north) => ({ features: [
    { id: 'way/1', kind: 'line', tag: { waterway: 'river' }, coordinates: [[west, south], [east, north]] },
    { id: 'relation/2', kind: 'polygon', tag: { natural: 'water', water: 'river' }, coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] },
  ] })
  const layer = { name: 'peninsula', file: 'overview.bin', width: 5, height: 5, bboxEPSG5179: [0, 0, 400, 400] }
  // Main land is the west two columns. One southeastern island is disconnected.
  layer.sha256 = store(layer.file, encode(5, 5, (col, row) => [row * 20 - 40, col < 2 || col === 4 && row === 4 ? 1 : 0x8000]))
  const detailTiles = []
  for (let row = 0; row < 2; row += 1) for (let col = 0; col < 2; col += 1) {
    const key = `${col}-${row}`, file = `${key}.bin`, waterFile = `${key}-water.json`
    const bboxEPSG5179 = [col * 100, 400 - (row + 1) * 100, (col + 1) * 100, 400 - row * 100]
    const bytes = encode(65, 65, (x, y) => [row * 64 + y + col * 64 + x - 80, col * 64 + x <= 64 ? 1 : 0x8000])
    detailTiles.push({ key, col, row, file, waterFile, width: 65, height: 65, bboxEPSG5179,
      sha256: store(file, bytes), waterSha256: store(waterFile, Buffer.from(JSON.stringify(water(...bboxEPSG5179)))) })
  }
  const farWaterFile = 'far-water.json'
  const manifest = { detailGrid: { projection: 'EPSG:5179', origin: [0, 400], cellSize: 100, intervals: 64, cols: 2, rows: 2 },
    layers: [layer], detailTiles, farWaterFile, farWaterSha256: store(farWaterFile, Buffer.from(JSON.stringify(water(0, 0, 400, 400)))),
    detailSources: { hydrography: [{ license: 'ODbL 1.0', attribution: 'Synthetic test features; schema models OpenStreetMap contributors attribution, not observed waterways.' }] } }
  const manifestBytes = Buffer.from(JSON.stringify(manifest))
  return { manifest, manifestBytes, manifestSha256: sha256(manifestBytes), payloads }
}
