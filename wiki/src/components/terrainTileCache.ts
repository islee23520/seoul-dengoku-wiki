export type TerrainTile = {
  key: string
  file: string
  bboxEPSG5179: [number, number, number, number]
  width: number
  height: number
}

export type TileCounts = {
  desired: number
  requests: number
  loaded: number
  inFlight: number
  decodedBytes: number
}

export const visibleTerrainTiles = (
  tiles: readonly TerrainTile[],
  footprint: readonly [number, number, number, number],
  center: readonly [number, number],
  limit = 24,
): TerrainTile[] => tiles.filter((tile) => {
  const [x0, y0, x1, y1] = tile.bboxEPSG5179
  return x0 <= footprint[2] && x1 >= footprint[0] && y0 <= footprint[3] && y1 >= footprint[1]
}).sort((a, b) => {
  const distance = (tile: TerrainTile) => {
    const [x0, y0, x1, y1] = tile.bboxEPSG5179
    return ((x0 + x1) / 2 - center[0]) ** 2 + ((y0 + y1) / 2 - center[1]) ** 2
  }
  return distance(a) - distance(b) || a.key.localeCompare(b.key)
}).slice(0, limit)

type TileEntry<T> = { controller: AbortController; value?: T; bytes: number; pending: number }

export class TerrainTileCache<T> {
  private desired = new Set<string>()
  private entries = new Map<string, TileEntry<T>>()
  private desiredTiles: readonly TerrainTile[] = []
  private failed = new Set<string>()
  private disposed = false
  private requests = 0
  private decodedBytes = 0
  private pendingBytes = 0

  constructor(
    private readonly fetchTile: (tile: TerrainTile, signal: AbortSignal) => Promise<{ value: T; bytes: number }>,
    private readonly install: (key: string, value: T) => void,
    private readonly remove: (key: string, value: T) => void,
    private readonly changed: (counts: TileCounts) => void,
    private readonly maxLoaded = 24,
    private readonly maxInFlight = 4,
    private readonly maxBytes = 16 * 1024 * 1024,
  ) {}

  get counts(): TileCounts {
    let loaded = 0
    for (const entry of this.entries.values()) if (entry.value !== undefined) loaded += 1
    return { desired: this.desired.size, requests: this.requests, loaded, inFlight: this.entries.size - loaded, decodedBytes: this.decodedBytes + this.pendingBytes }
  }

  update(tiles: readonly TerrainTile[]): void {
    if (this.disposed) return
    this.desiredTiles = tiles
    this.desired = new Set(tiles.map((tile) => tile.key))
    for (const key of this.failed) if (!this.desired.has(key)) this.failed.delete(key)
    for (const [key, entry] of this.entries) {
      if (this.desired.has(key)) continue
      entry.controller.abort()
      this.pendingBytes -= entry.pending
      entry.pending = 0
      if (entry.value !== undefined) {
        this.remove(key, entry.value)
        this.decodedBytes -= entry.bytes
      }
      this.entries.delete(key)
    }
    this.fill()
    this.changed(this.counts)
  }

  private fill(): void {
    for (const tile of this.desiredTiles) {
      if (this.entries.has(tile.key) || this.failed.has(tile.key)) continue
      const counts = this.counts
      if (counts.inFlight >= this.maxInFlight || this.entries.size >= this.maxLoaded || counts.decodedBytes + tile.width * tile.height * 4 > this.maxBytes) break
      const controller = new AbortController()
      const entry: TileEntry<T> = { controller, bytes: 0, pending: tile.width * tile.height * 4 }
      this.entries.set(tile.key, entry)
      this.pendingBytes += entry.pending
      this.requests += 1
      void this.fetchTile(tile, controller.signal).then(({ value, bytes }) => {
        if (this.disposed || !this.desired.has(tile.key) || this.entries.get(tile.key) !== entry) return
        this.pendingBytes -= entry.pending
        entry.pending = 0
        if (this.decodedBytes + bytes > this.maxBytes) {
          this.entries.delete(tile.key)
          this.failed.add(tile.key)
          return
        }
        this.install(tile.key, value)
        entry.value = value
        entry.bytes = bytes
        this.decodedBytes += bytes
      }).catch((error: unknown) => {
        this.pendingBytes -= entry.pending
        entry.pending = 0
        if (!controller.signal.aborted) console.error('Terrain tile failed', tile.key, error)
        if (!controller.signal.aborted) this.failed.add(tile.key)
        if (this.entries.get(tile.key) === entry) this.entries.delete(tile.key)
      }).finally(() => {
        if (!this.disposed) {
          this.fill()
          this.changed(this.counts)
        }
      })
    }
  }

  dispose(): void {
    this.update([])
    this.disposed = true
  }
}
