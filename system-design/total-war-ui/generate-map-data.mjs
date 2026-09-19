import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const source = resolve(repoRoot, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
const output = resolve(here, 'seoul-map-data.js')
const graph = JSON.parse(await readFile(source, 'utf8'))
const payload = {
  schema: graph.schema,
  source: graph.source,
  stations: graph.stations.map(({ id, nameKo, district, lat, lon }) => ({ id, nameKo, district, lat, lon })),
  connections: graph.edges.map(({ a, b }) => [a, b]),
}

await writeFile(output, `window.SEOUL_MAP_DATA=${JSON.stringify(payload)};\n`)
console.log(`SEOUL_MAP_DATA_PASS stations=${payload.stations.length} connections=${payload.connections.length}`)
