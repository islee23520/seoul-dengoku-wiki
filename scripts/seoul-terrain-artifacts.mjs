import { createHash } from 'node:crypto'
import { cp, lstat, readFile, readdir } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

export const rawRoots = new Set(['regional-terrain.json', 'regional-metro.bin', 'regional-peninsula.bin', 'regional-terrain-far-water.json'])
export const outputNames = ['seoul-terrain.json', 'seoul-terrain.png', 'seoul-terrain-water.json', 'seoul-terrain-clip.json']
export const excludedTerrain = (name) => rawRoots.has(name) || name === 'regional-terrain-tiles' || name.startsWith('regional-terrain-tiles/')
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const pinned = { atlasSha256: '89d559fc31ce0644e331c6a54b8cfc997bf482b05f7c940694ea68f4f304fdf1', rawManifestSha256: 'b630f3161f0f86cd014293934c87f2bc35b33fa4c522301718ebc56fc7d7330f' }

async function inventory(directory, prefix = '') {
  const names = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) throw new Error(`E_SEOUL_COPY_SYMLINK:${name}`)
    if (entry.isDirectory()) names.push(...await inventory(resolve(directory, entry.name), name))
    else if (entry.isFile()) names.push(name)
    else throw new Error(`E_SEOUL_COPY_NONFILE:${name}`)
  }
  return names
}

export async function verifySeoulTerrain(root) {
  const publicRoot = resolve(root, 'public')
  const input = JSON.parse(await readFile(resolve(publicRoot, 'regional-terrain.json')))
  if (hash(await readFile(resolve(publicRoot, 'regional-terrain.json'))) !== pinned.rawManifestSha256) throw new Error('E_SEOUL_RAW_HASH')
  if (hash(await readFile(resolve(root, 'snapshots/build-inputs/atlas-data.js'))) !== pinned.atlasSha256) throw new Error('E_SEOUL_ATLAS_HASH')
  const sourcePin = JSON.parse(await readFile(resolve(root, 'snapshots/build-inputs/source-manifest.json')))
  if (sourcePin.files.find(item => item.path === 'atlas-data.js')?.sha256 !== pinned.atlasSha256) throw new Error('E_SEOUL_ATLAS_PIN')
  const raw = await inventory(publicRoot)
  const expected = new Set([...rawRoots, ...input.detailTiles.flatMap(tile => [tile.file, tile.waterFile])])
  if (expected.size !== 184 || raw.filter(excludedTerrain).length !== expected.size || [...expected].some(name => !raw.includes(name))) throw new Error('E_SEOUL_RAW_INVENTORY')
  for (const [name, sha] of [...input.layers.map(layer => [layer.file, layer.sha256]), [input.farWaterFile, input.farWaterSha256], ...input.detailTiles.flatMap(tile => [[tile.file, tile.sha256], [tile.waterFile, tile.waterSha256]])]) {
    if (!expected.has(name) || hash(await readFile(resolve(publicRoot, name))) !== sha) throw new Error(`E_SEOUL_SOURCE_HASH:${name}`)
  }
  const output = JSON.parse(await readFile(resolve(publicRoot, outputNames[0])))
  if (output.schema !== 'seoul-terrain.v2' || output.projection !== 'EPSG:5179' || output.regionCount !== 427 || output.inputs?.atlasSha256 !== pinned.atlasSha256 || output.inputs?.rawManifestSha256 !== pinned.rawManifestSha256 || output.inputs?.openingSha256 !== hash(await readFile(resolve(publicRoot, 'opening-territories.json')))) throw new Error('E_SEOUL_OUTPUT_STALE')
  for (const [file, sha] of [[output.rasterFile, output.rasterSha256], [output.waterFile, output.waterSha256], [output.clipFile, output.clipSha256]]) {
    if (!outputNames.slice(1).includes(file) || hash(await readFile(resolve(publicRoot, file))) !== sha) throw new Error(`E_SEOUL_OUTPUT_HASH:${file}`)
  }
  const clip = JSON.parse(await readFile(resolve(publicRoot, output.clipFile)))
  if (clip.schema !== 'seoul-terrain-clip.v1' || clip.projection !== 'EPSG:5179' || !clip.path?.startsWith('M')) throw new Error('E_SEOUL_CLIP')
  return { raw, output }
}

export async function copyReviewedPublic(root, outRoot) {
  const publicRoot = resolve(root, 'public')
  const destination = resolve(outRoot)
  if (destination !== resolve(root, 'dist') || destination === publicRoot || destination.startsWith(`${publicRoot}${sep}`)) throw new Error('E_SEOUL_COPY_DESTINATION')
  const { raw } = await verifySeoulTerrain(root)
  const existing = new Set(await inventory(destination))
  for (const name of raw.filter(name => !excludedTerrain(name))) if (existing.has(name)) throw new Error(`E_SEOUL_COPY_COLLISION:${name}`)
  await cp(publicRoot, destination, { recursive: true, filter: async source => {
    const name = relative(publicRoot, source).split(sep).join('/')
    if (!name) return true
    if (isAbsolute(name) || name === '..' || name.startsWith('../') || (await lstat(source)).isSymbolicLink()) throw new Error(`E_SEOUL_COPY_PATH:${name}`)
    return !excludedTerrain(name)
  } })
  if ((await inventory(destination)).some(excludedTerrain)) throw new Error('E_SEOUL_RAW_SHIPPED')
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await verifySeoulTerrain(resolve(import.meta.dirname, '..'))
  console.log('SEOUL_TERRAIN_SEAL_PASS')
}
