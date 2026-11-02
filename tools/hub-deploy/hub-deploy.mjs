import { cp, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderHubEntry } from './generate-hub-entry.mjs'

const toolRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(toolRoot, '../..')

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

const contained = (root, path) => path === root || path.startsWith(`${root}/`)
const privateEvidencePath = (root, path) => contained(resolve(root, 'evidence'), path) || contained(resolve(root, '.omo'), path)

const publicSource = async (root, declared, label) => {
  if (typeof declared !== 'string' || !declared) throw new Error(`DEPLOY_SOURCE_INVALID:${label}`)
  const rootReal = await realpath(root)
  const lexical = resolve(rootReal, declared)
  if (!contained(rootReal, lexical)) throw new Error(`DEPLOY_SOURCE_OUTSIDE_ROOT:${label}:${declared}`)
  let canonical
  try {
    canonical = await realpath(lexical)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return lexical
    throw error
  }
  if (!contained(rootReal, canonical)) throw new Error(`DEPLOY_SOURCE_OUTSIDE_ROOT:${label}:${declared}`)
  if (contained(resolve(rootReal, 'evidence'), canonical) || contained(resolve(rootReal, '.omo'), canonical)) {
    throw new Error(`DEPLOY_PRIVATE_EVIDENCE_SOURCE:${label}:${declared}`)
  }
  return canonical
}

const publicAssetFile = async (root, assetRoot, declared, label) => {
  if (typeof declared !== 'string' || !declared) throw new Error(`DEPLOY_ASSET_FILE_INVALID:${label}`)
  const rootReal = await realpath(root)
  const lexical = resolve(assetRoot, declared)
  if (!contained(assetRoot, lexical) || !contained(rootReal, lexical)) throw new Error(`DEPLOY_ASSET_FILE_OUTSIDE_SOURCE:${label}:${declared}`)
  if (privateEvidencePath(rootReal, lexical)) throw new Error(`DEPLOY_PRIVATE_EVIDENCE_SOURCE:${label}:${declared}`)
  let canonical
  try {
    canonical = await realpath(lexical)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return lexical
    throw error
  }
  if (!contained(assetRoot, canonical) || !contained(rootReal, canonical)) throw new Error(`DEPLOY_ASSET_FILE_OUTSIDE_SOURCE:${label}:${declared}`)
  if (privateEvidencePath(rootReal, canonical)) throw new Error(`DEPLOY_PRIVATE_EVIDENCE_SOURCE:${label}:${declared}`)
  return canonical
}

const publicPageFile = async (root, source, file, page) => {
  if (typeof file !== 'string' || !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(file)
    || file.split('/').some(part => part === '.' || part === '..')) throw new Error(`DEPLOY_PAGE_FILE_INVALID:${page.id}:${file}`)
  const selected = await publicAssetFile(root, source, file, `page:${page.id}`)
  if (selected !== resolve(source, file)) throw new Error(`DEPLOY_PAGE_FILE_SYMLINK:${page.id}:${file}`)
  if (!(await fileExists(selected))) throw new Error(`DEPLOY_PAGE_FILE_MISSING:${page.id}:${file}`)
  return selected
}

const nearestExistingAncestor = async (path) => {
  let current = path
  for (;;) {
    try {
      return await realpath(current)
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
      const parent = dirname(current)
      if (parent === current) throw error
      current = parent
    }
  }
}

const stageAssetDestination = async (output, page, asset, file) => {
  const outputReal = await realpath(output)
  const lexical = resolve(outputReal, page.target, asset.target)
  if (!contained(outputReal, lexical)) throw new Error(`DEPLOY_ASSET_DESTINATION_OUTSIDE_STAGE:${page.id}:${asset.target}`)
  const ancestor = await nearestExistingAncestor(lexical)
  if (!contained(outputReal, ancestor)) throw new Error(`DEPLOY_ASSET_DESTINATION_OUTSIDE_STAGE:${page.id}:${asset.target}`)
  const destination = resolve(lexical, basename(file))
  if (!contained(lexical, destination)) throw new Error(`DEPLOY_ASSET_DESTINATION_OUTSIDE_STAGE:${page.id}:${asset.target}`)
  await mkdir(lexical, { recursive: true })
  const target = await realpath(lexical)
  if (!contained(outputReal, target)) throw new Error(`DEPLOY_ASSET_DESTINATION_OUTSIDE_STAGE:${page.id}:${asset.target}`)
  const canonicalDestination = resolve(target, basename(file))
  if (!contained(target, canonicalDestination)) throw new Error(`DEPLOY_ASSET_DESTINATION_OUTSIDE_STAGE:${page.id}:${asset.target}`)
  return canonicalDestination
}

const fileExists = async (path) => {
  try {
    return (await stat(path)).isFile()
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

const walkFiles = async (root) => {
  const files = []
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile() && !entry.name.startsWith('._')) files.push(path)
    }
  }
  await visit(root)
  return files.sort()
}

export const loadHubPages = async (path = resolve(toolRoot, 'deploy/hub-pages.json')) =>
  JSON.parse(await readFile(path, 'utf8')).pages

export const validateManifest = async (root, pages) => {
  const targets = new Set()
  for (const page of pages) {
    if (targets.has(page.target)) throw new Error(`DEPLOY_TARGET_DUPLICATE:${page.target}`)
    targets.add(page.target)
    const source = await publicSource(root, page.source, `page:${page.id}`)
    const entry = resolve(source, page.entry)
    if (page.required && !(await fileExists(entry))) throw new Error(`DEPLOY_SOURCE_ENTRY_MISSING:${page.id}:${relative(root, entry)}`)
    if (page.files !== undefined) {
      if (!Array.isArray(page.files) || !page.files.includes(page.entry)
        || new Set(page.files).size !== page.files.length) throw new Error(`DEPLOY_PAGE_FILES_INVALID:${page.id}`)
      for (const file of page.files) await publicPageFile(root, source, file, page)
    }
    for (const asset of page.assets ?? []) {
      const assetRoot = await publicSource(root, asset.source, `asset:${page.id}`)
      for (const file of asset.files) {
        const assetFile = await publicAssetFile(root, assetRoot, file, `asset:${page.id}`)
        if (!(await fileExists(assetFile))) throw new Error(`DEPLOY_ASSET_MISSING:${page.id}:${relative(root, assetFile)}`)
      }
    }
  }
}

export const stageHub = async ({ root, output, hubIndex = 'index.html', hubPackageRoot, wikiDist, pages }) => {
  await validateManifest(root, pages)
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  if (hubPackageRoot) {
    const wiki = JSON.parse(await readFile(resolve(root, 'WIKI/src/generated/publication-manifest.json'), 'utf8'))
    const gdd = JSON.parse(await readFile(resolve(root, 'GDD/viewer/src/generated/publication-manifest.json'), 'utf8'))
    await writeFile(resolve(output, 'index.html'), await renderHubEntry(resolve(root, hubPackageRoot), { wiki, gdd }))
  }
  else await cp(resolve(root, hubIndex), resolve(output, 'index.html'), { force: true })
  await cp(resolve(root, wikiDist), resolve(output, 'wiki'), { recursive: true, force: true, filter: (source) => !source.split('/').at(-1)?.startsWith('._') })

  const stagedPages = [
    { id: 'hub', target: '/', source: hubPackageRoot ?? hubIndex },
    { id: 'wiki', target: '/wiki/', source: wikiDist },
  ]
  for (const page of pages) {
    const source = await publicSource(root, page.source, `page:${page.id}`)
    if (!(await fileExists(resolve(source, page.entry)))) continue
    const excluded = (page.exclude ?? []).map((path) => resolve(source, path))
    if (page.files !== undefined) {
      for (const file of page.files) {
        const selected = await publicPageFile(root, source, file, page)
        const destination = resolve(output, page.target, file)
        await mkdir(dirname(destination), { recursive: true })
        await cp(selected, destination, { force: true })
      }
    } else {
      await cp(source, resolve(output, page.target), {
        recursive: true,
        force: true,
        filter: (path) => !path.split('/').at(-1)?.startsWith('._')
          && !excluded.some((retired) => path === retired || path.startsWith(`${retired}/`)),
      })
    }
    for (const asset of page.assets ?? []) {
      const assetRoot = await publicSource(root, asset.source, `asset:${page.id}`)
      for (const file of asset.files) {
        const assetFile = await publicAssetFile(root, assetRoot, file, `asset:${page.id}`)
        const destination = await stageAssetDestination(output, page, asset, file)
        await cp(assetFile, destination, { force: true })
      }
    }
    stagedPages.push({ id: page.id, target: `/${page.target}/`, source: page.source })
  }

  const files = await walkFiles(output)
  const artifacts = []
  for (const file of files) {
    if (file.endsWith('deployment-manifest.json')) continue
    const bytes = await readFile(file)
    artifacts.push({ path: relative(output, file).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha256(bytes) })
  }
  const result = { schemaVersion: 1, files: artifacts.length, pages: stagedPages, artifacts }
  await writeFile(resolve(output, 'deployment-manifest.json'), `${JSON.stringify(result, null, 2)}\n`)
  return result
}

const main = async () => {
  const rootIndex = process.argv.indexOf('--root')
  const outputIndex = process.argv.indexOf('--output')
  const wikiIndex = process.argv.indexOf('--wiki-dist')
  const hubIndex = process.argv.indexOf('--hub-index')
  const hubPackageIndex = process.argv.indexOf('--hub-package-root')
  const manifestIndex = process.argv.indexOf('--manifest')
  const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : repoRoot)
  const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : join(root, '.hub-deploy-stage'))
  const wikiDist = wikiIndex >= 0 ? process.argv[wikiIndex + 1] : 'WIKI/dist'
  const pages = await loadHubPages(manifestIndex >= 0 ? resolve(process.argv[manifestIndex + 1]) : undefined)
  const result = await stageHub({ root, output, hubIndex: hubIndex >= 0 ? process.argv[hubIndex + 1] : 'index.html', hubPackageRoot: hubPackageIndex >= 0 ? process.argv[hubPackageIndex + 1] : undefined, wikiDist, pages })
  console.log(`HUB_STAGE_PASS files=${result.files} pages=${result.pages.length} output=${output}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
