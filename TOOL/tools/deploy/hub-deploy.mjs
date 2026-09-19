import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const toolRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(toolRoot, '../..')

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

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
    const source = resolve(root, page.source)
    const entry = resolve(source, page.entry)
    if (page.required && !(await fileExists(entry))) throw new Error(`DEPLOY_SOURCE_ENTRY_MISSING:${page.id}:${relative(root, entry)}`)
  }
}

export const stageHub = async ({ root, output, hubIndex = 'index.html', wikiDist, pages }) => {
  await validateManifest(root, pages)
  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
  await cp(resolve(root, hubIndex), resolve(output, 'index.html'), { force: true })
  await cp(resolve(root, wikiDist), resolve(output, 'wiki'), { recursive: true, force: true, filter: (source) => !source.split('/').at(-1)?.startsWith('._') })

  const stagedPages = [
    { id: 'hub', target: '/', source: hubIndex },
    { id: 'wiki', target: '/wiki/', source: wikiDist },
  ]
  for (const page of pages) {
    const source = resolve(root, page.source)
    if (!(await fileExists(resolve(source, page.entry)))) continue
    await cp(source, resolve(output, page.target), { recursive: true, force: true, filter: (path) => !path.split('/').at(-1)?.startsWith('._') })
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
  const manifestIndex = process.argv.indexOf('--manifest')
  const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : repoRoot)
  const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : join(root, '.hub-deploy-stage'))
  const wikiDist = wikiIndex >= 0 ? process.argv[wikiIndex + 1] : 'GAME-LOGIC/wiki-react/dist'
  const pages = await loadHubPages(manifestIndex >= 0 ? resolve(process.argv[manifestIndex + 1]) : undefined)
  const result = await stageHub({ root, output, hubIndex: hubIndex >= 0 ? process.argv[hubIndex + 1] : 'index.html', wikiDist, pages })
  console.log(`HUB_STAGE_PASS files=${result.files} pages=${result.pages.length} output=${output}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
