import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, readlink, realpath, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { CanonError } from './errors.mjs'
import { loadSchema, readCanonJson } from './integrity.mjs'
import { renderDocument, renderTableRows } from './render.mjs'
import { ADR_COLLECTION, loadAdrCanonCollection } from '../wiki/adr-canon.mjs'
import { renderAdrMarkdown } from '../wiki/adr-render.mjs'

export async function physicalPath(path) {
  let entry
  try {
    entry = await lstat(path)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return join(await physicalPath(dirname(path)), path.slice(dirname(path).length + 1))
  }
  if (entry.isSymbolicLink()) {
    return physicalPath(resolve(dirname(path), await readlink(path)))
  }
  return realpath(path)
}

export async function assertOutputOutsideGdd(gddRoot, outDir) {
  const gdd = await realpath(resolve(gddRoot))
  const output = await physicalPath(resolve(outDir))
  const inside = relative(gdd, output)
  if (!inside || (!inside.startsWith(`..${sep}`) && inside !== '..' && !isAbsolute(inside))) {
    throw new CanonError('E_OUTPUT_INSIDE_GDD', outDir)
  }
  let entry
  try {
    entry = await lstat(resolve(outDir))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (entry?.isSymbolicLink()) {
    try {
      await stat(output)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      throw new CanonError('E_OUTPUT_DANGLING_SYMLINK', outDir)
    }
  }
  return output
}

export async function readRenderedLock(canonRoot) {
  const lockPath = join(canonRoot, 'rendered.lock.json')
  let locked
  try {
    locked = JSON.parse(await readFile(lockPath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') throw new CanonError('E_RENDERED_LOCK_MISSING', lockPath)
    throw error
  }
  if (!Array.isArray(locked) || locked.some((entry) => typeof entry?.path !== 'string' || !/^[a-f0-9]{64}$/.test(entry?.sha256) || Object.keys(entry).sort().join(',') !== 'path,sha256')) {
    throw new CanonError('E_RENDERED_LOCK_SHAPE', lockPath)
  }
  if (locked.some((entry, index) => index && locked[index - 1].path >= entry.path)) throw new CanonError('E_RENDERED_LOCK_ORDER', lockPath)
  return locked
}

export async function materializeGdd({ gddRoot, outDir, updateLock = false }) {
  const gdd = await realpath(resolve(gddRoot))
  const output = await assertOutputOutsideGdd(gdd, outDir)
  try {
    const existing = await stat(output)
    if (!existing.isDirectory()) throw new CanonError('E_OUTPUT_NOT_DIRECTORY', outDir)
    if (!(await readdir(output)).length) {
      // An existing empty staging directory is allowed.
    } else throw new CanonError('E_OUTPUT_NOT_EMPTY', outDir)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const canonRoot = join(gdd, 'canon')
  // The standalone build resolves only the versioned renderer package.
  const rendererPackage = join(gdd, 'viewer/node_modules/@seoul-dengoku/document-renderer/dist/index.js')
  const rendererPath = rendererPackage
  const schema = await loadSchema(canonRoot, 'schema/gdd-doc.schema.json')
  const collections = (await readdir(join(canonRoot, 'collections'))).filter((name) => name.endsWith('.json')).sort()
  const entries = []
  for (const name of collections) {
    const collection = await readCanonJson(canonRoot, schema, `collections/${name}`)
    entries.push(...collection.documents)
  }
  const byId = new Map()
  const paths = new Set()
  for (const entry of entries) {
    if (byId.has(entry.id)) throw new CanonError('E_DUPLICATE_ID', `${entry.id}: ${entry.source.path}`)
    if (paths.has(entry.source.path)) throw new CanonError('E_DUPLICATE_PATH', `${entry.id}: ${entry.source.path}`)
    byId.set(entry.id, entry.source.path)
    paths.add(entry.source.path)
  }

  const files = []
  for (const entry of entries.sort((a, b) => a.source.path < b.source.path ? -1 : a.source.path > b.source.path ? 1 : 0)) {
    const document = await readCanonJson(canonRoot, schema, entry.path)
    const resolveDocHref = (targetId) => {
      const target = byId.get(targetId)
      if (!target) throw new CanonError('E_DOCLINK_TARGET_MISSING', `${entry.source.path}: ${targetId}`)
      return relative(dirname(entry.source.path), target).split(sep).join('/')
    }
    const bytes = Buffer.from(document.content
      ? (await import(pathToFileURL(rendererPath).href)).renderDocumentMarkdown(document, 'ko', (link) => link.domain === 'gdd' ? `/gdd/${link.slug}${link.anchor ? `#${link.anchor}` : ''}` : undefined)
      : renderDocument(document, (block) => renderTableRows(block.header, block.rows, block.dividers), resolveDocHref))
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    files.push({ path: entry.source.path, sha256, bytes })
  }

  if (await stat(join(canonRoot, 'schema/adr.schema.json')).then(() => true, (error) => {
    if (error.code === 'ENOENT') return false
    throw error
  })) {
    const adrs = await loadAdrCanonCollection(canonRoot)
    for (const entry of ADR_COLLECTION) {
      const canon = adrs.get(entry.id)
      const path = `adr/${entry.outputName}`
      if (canon.source.path !== path) throw new CanonError('E_SOURCE_PATH_MISMATCH', path)
      const bytes = Buffer.from(renderAdrMarkdown(canon))
      const sha256 = createHash('sha256').update(bytes).digest('hex')
      files.push({ path, sha256, bytes })
    }
  }

  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  const manifest = files.map(({ path, sha256 }) => ({ path, sha256 }))
  const lockPath = join(canonRoot, 'rendered.lock.json')
  let locked
  try {
    locked = await readRenderedLock(canonRoot)
  } catch (error) {
    if (error.code !== 'E_RENDERED_LOCK_MISSING') throw error
    if (!updateLock) throw new CanonError('E_RENDERED_LOCK_MISSING', lockPath)
    locked = []
  }
  const hashes = new Map()
  for (const entry of locked) {
    if (hashes.has(entry.path)) throw new CanonError('E_RENDERED_LOCK_DUPLICATE', entry.path)
    hashes.set(entry.path, entry.sha256)
  }
  const rendered = new Map(manifest.map(({ path, sha256 }) => [path, sha256]))
  const changedPaths = [...new Set([...hashes.keys(), ...rendered.keys()])].filter((path) => hashes.get(path) !== rendered.get(path)).sort()
  if (changedPaths.length && !updateLock) throw new CanonError('E_RENDERED_LOCK_MISMATCH', changedPaths[0])
  if (updateLock && changedPaths.length) await writeFile(lockPath, `${JSON.stringify(manifest, null, 2)}\n`)

  await mkdir(output, { recursive: true })
  for (const file of files) {
    const target = join(output, file.path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, file.bytes)
  }
  await writeFile(join(output, '.gdd-materialized.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  if (updateLock) return { manifest, changedPaths }
  return manifest
}

const samePath = async (left, right) => {
  try { return await realpath(left) === await realpath(right) } catch { return resolve(left) === resolve(right) }
}
const invokedDirectly = process.argv[1] && await samePath(fileURLToPath(import.meta.url), process.argv[1])
if (invokedDirectly) {
  const args = process.argv.slice(2)
  if ((args.length !== 4 && !(args.length === 5 && args[4] === '--update-lock')) || args[0] !== '--gdd' || args[2] !== '--out' || !args[1] || !args[3]) {
    console.error('Usage: node TOOL/tools/canon/materialize-gdd.mjs --gdd <dir> --out <dir> [--update-lock]')
    process.exitCode = 2
  } else {
    materializeGdd({ gddRoot: args[1], outDir: args[3], updateLock: args[4] === '--update-lock' })
      .then((result) => console.log(args[4] === '--update-lock'
        ? `Materialized ${result.manifest.length} GDD documents; lock changed: ${result.changedPaths.length ? result.changedPaths.join(', ') : '(none)'}`
        : `Materialized ${result.length} GDD documents`))
      .catch((error) => { console.error(error); process.exit(1) })
  }
}
