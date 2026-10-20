import { lstat, readFile, unlink, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { dirname, join, relative, resolve, sep } from 'node:path'

// Historical generator output, not a directory-wide claim of ownership.
const legacyRoots = new Set([
  'admin-territorial-scale.json', 'outside-admin-units.json', 'outside-control-2126.json',
  'northern-rail.json', 'regional-boundaries.json', 'regional-metro.bin',
  'regional-peninsula.bin', 'regional-rail.json', 'regional-terrain.json',
  'regional-terrain-far-water.json', 'regular-regional-connections.json',
])
const currentRoots = new Set([
  'wiki-contract.json', 'opening-territories.json', 'timeline-overview.json',
  'territorial-scale.json', 'confirmed-person-holdings.json',
])
const legacyTile = /^regional-terrain-tiles\/[0-9]+-[0-9]+(?:-water\.json|\.bin)$/u
const currentDetail = /^person-details\/person-[0-9]{4}\.json$/u
const currentTree = /^family-trees\/[a-z0-9-]+\.json$/u

function owned(path) {
  return legacyRoots.has(path) || currentRoots.has(path) || legacyTile.test(path)
    || currentDetail.test(path) || currentTree.test(path)
}

function entry(path) {
  if (typeof path !== 'string' || path.startsWith('/') || path.includes('\\')
    || path.split('/').some(part => !part || part === '.' || part === '..') || !owned(path)) {
    throw new Error('E_PUBLIC_ASSET_PATH:' + path)
  }
  return path
}

export function retirementCandidates(previous, generated) {
  if (!Array.isArray(previous?.files) || !Array.isArray(generated?.files)) throw new Error('E_PUBLIC_ASSET_MANIFEST')
  const old = previous.files.map(entry)
  const next = generated.files.map(entry)
  if (new Set(old).size !== old.length || new Set(next).size !== next.length) throw new Error('E_PUBLIC_ASSET_DUPLICATE')
  const keep = new Set(next)
  return old.filter(path => !keep.has(path)).sort()
}

// For the first approved run only: the caller supplies paths verified as Git-tracked
// and unchanged from the index. Unknown files, including extra tile files, stay put.
export function legacyPublicManifest(trackedPaths) {
  if (!Array.isArray(trackedPaths)) throw new Error('E_PUBLIC_ASSET_TRACKED')
  const files = trackedPaths.filter(path => legacyRoots.has(path) || legacyTile.test(path))
  return { files: files.map(entry).sort() }
}

export async function verifiedLegacyManifest(projectRoot) {
  const run = promisify(execFile)
  const { stdout } = await run('git', ['-C', projectRoot, 'ls-files', '-z', '--', 'public'])
  const files = legacyPublicManifest(stdout.split('\0').filter(Boolean).map(path => path.replace(/^public\//u, ''))).files
  const verified = []
  for (const path of files) {
    const index = await run('git', ['-C', projectRoot, 'show', ':public/' + path], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
    await regularPath(resolve(projectRoot, 'public'), path)
    const disk = await readFile(join(projectRoot, 'public', path))
    if (createHash('sha256').update(index.stdout).digest('hex') === createHash('sha256').update(disk).digest('hex')) verified.push(path)
  }
  return { files: verified }
}

async function regularPath(root, path) {
  const target = resolve(root, path)
  if (!target.startsWith(root + sep) || relative(root, target) !== path) throw new Error('E_PUBLIC_ASSET_PATH:' + path)
  let parent = dirname(target)
  while (parent !== root) {
    const info = await lstat(parent)
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('E_PUBLIC_ASSET_SYMLINK:' + path)
    parent = dirname(parent)
  }
  const info = await lstat(target)
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('E_PUBLIC_ASSET_SYMLINK:' + path)
  return target
}

// The stage callback finishes and validates all new output before any retirement.
// The manifest itself is committed only after every retired path has been unlinked.
export async function publishPublicAssets({ publicRoot, manifestPath, previous, generated, stage, writeManifest = writeFile }) {
  const root = resolve(publicRoot)
  const retired = retirementCandidates(previous, generated)
  if (typeof stage !== 'function') throw new Error('E_PUBLIC_ASSET_STAGE')
  const manifestRoot = dirname(resolve(manifestPath))
  if (resolve(manifestPath).startsWith(root + sep)) throw new Error('E_PUBLIC_ASSET_MANIFEST_LOCATION')
  const rootInfo = await lstat(root)
  const manifestInfo = await lstat(manifestRoot)
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink() || !manifestInfo.isDirectory() || manifestInfo.isSymbolicLink()) throw new Error('E_PUBLIC_ASSET_SYMLINK:root')
  const existingManifest = await lstat(manifestPath).catch(error => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (existingManifest && (!existingManifest.isFile() || existingManifest.isSymbolicLink())) throw new Error('E_PUBLIC_ASSET_SYMLINK:manifest')
  await stage()
  for (const path of generated.files) await regularPath(root, path)
  for (const path of retired) await regularPath(root, path)
  for (const path of retired) await unlink(join(root, path))
  await writeManifest(manifestPath, `${JSON.stringify({ files: generated.files.map(entry).sort() }, null, 2)}\n`)
  return retired
}

export function manifestForPublicFiles(paths) {
  const files = paths.map(entry)
  if (new Set(files).size !== files.length) throw new Error('E_PUBLIC_ASSET_DUPLICATE')
  return { files: files.sort() }
}
