import { lstat, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { assertRouteCoverage } from './public-admission.mjs'
import { assertPublicBytes, generatedArtifact, privateSentinels, publicArtifact, regularBytes, safePath, sha256, treeFiles } from './render-export.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
async function noPending(path) {
  const info = await lstat(path).catch(error => { if (error.code === 'ENOENT') return null; throw error })
  if (info) throw new Error('E_PUBLIC_PROMOTE_PENDING')
}

export async function checkSeeds(seeds, { sentinels = privateSentinels } = {}) {
  await noPending(join(seeds, '.promote-pending.json'))
  const bytes = await regularBytes(seeds, 'manifest.json')
  const manifest = JSON.parse(bytes)
  if (manifest.format !== 'wiki-seeds/1' || manifest.schema !== 'wiki' || !Array.isArray(manifest.tables)) throw new Error('E_SEED_MANIFEST')
  const { isPublicTable } = await import('../server/wiki-table-allowlist.mjs')
  const { isSeedTable } = await import('./seed-scope.mjs')
  const listed = new Set(['manifest.json', 'README.md'])
  let rows = 0
  for (const table of manifest.tables) {
    if (!isPublicTable(table.table) || !isSeedTable(table.table)) throw new Error('E_SEED_PRIVATE_TABLE')
    let count = 0
    for (const file of table.files) {
      safePath(file.file)
      if (listed.has(file.file)) throw new Error('E_SEED_DUPLICATE')
      listed.add(file.file)
      const data = await regularBytes(seeds, file.file)
      assertPublicBytes(data, sentinels)
      if (sha256(data) !== file.sha256) throw new Error('E_SEED_HASH')
      const lines = data.toString('utf8').split('\n').filter(Boolean)
      if (!data.toString('utf8').endsWith('\n') || lines.length !== file.rows) throw new Error('E_SEED_ROWS')
      count += file.rows
    }
    if (count !== table.rows) throw new Error('E_SEED_ROWS')
    rows += count
  }
  for (const path of await treeFiles(seeds)) if (!listed.has(path)) throw new Error('E_SEED_EXTRA_FILE')
  return { sha256: sha256(bytes), rows }
}

export async function checkRenderSnapshot({ snapshot = join(projectRoot, 'renders'), seeds, root = projectRoot, admission, sentinels = privateSentinels } = {}) {
  snapshot = resolve(snapshot); root = resolve(root)
  await noPending(join(dirname(snapshot), '.promote-pending.json'))
  await noPending(join(snapshot, '.promote-pending.json'))
  const manifestBytes = await regularBytes(snapshot, 'manifest.json')
  assertPublicBytes(manifestBytes, sentinels)
  const manifest = JSON.parse(manifestBytes)
  if (manifest.format !== 'wiki-renders/1' || !Array.isArray(manifest.files) || !Array.isArray(manifest.routes) || !Array.isArray(manifest.documentRoutes)) throw new Error('E_RENDER_MANIFEST')
  const allowlist = JSON.parse(await regularBytes(root, 'artifact-allowlist.json'))
  const byPath = new Map(), bodies = new Map()
  let totalBytes = 0, largestFile = null
  for (const file of manifest.files) {
    safePath(file.path)
    if (byPath.has(file.path) || !['snapshot', 'tracked'].includes(file.storage) || file.mode !== '100644' || !/^[a-f0-9]{64}$/u.test(file.sha256)) throw new Error('E_RENDER_MANIFEST_FILE')
    if (file.source !== null) {
      if (!publicArtifact(file.source, allowlist) && !generatedArtifact(file.source)) throw new Error('E_RENDER_PUBLIC_ALLOWLIST')
      if (file.path !== file.source.replace(/^src\/generated\//u, 'generated/')) throw new Error('E_RENDER_SOURCE_PATH')
    } else if (!/^documents\/[\p{L}\p{N}_-]+\.md$/u.test(file.path) && file.path !== 'index.md') throw new Error('E_RENDER_REVIEW_PATH')
    if (file.storage === 'tracked' && !file.source?.startsWith('public/')) throw new Error('E_RENDER_TRACKED_PATH')
    const bytes = await regularBytes(file.storage === 'tracked' ? root : snapshot, file.storage === 'tracked' ? file.source : file.path)
    assertPublicBytes(bytes, sentinels)
    if (sha256(bytes) !== file.sha256 || bytes.length !== file.bytes) throw new Error('E_RENDER_HASH')
    byPath.set(file.path, file)
    totalBytes += bytes.length
    if (!largestFile || bytes.length > largestFile.bytes) largestFile = { path: file.path, bytes: bytes.length }
    if (file.path.startsWith('generated/world/') && file.path.endsWith('.json')) bodies.set(file.path, JSON.parse(bytes))
  }
  const paths = manifest.files.map(file => file.path)
  if (JSON.stringify(paths) !== JSON.stringify([...paths].sort())) throw new Error('E_RENDER_ORDER')
  const expectedFiles = new Set(['manifest.json', '.gitkeep', 'PROVENANCE.md', ...manifest.files.filter(row => row.storage === 'snapshot').map(row => row.path)])
  for (const path of await treeFiles(snapshot)) if (!expectedFiles.has(path)) throw new Error('E_RENDER_EXTRA_FILE')
  const documentRoutes = manifest.routes.filter(row => row.kind === 'document')
  assertRouteCoverage(manifest.documentRoutes, documentRoutes)
  assertRouteCoverage(manifest.documentRoutes, [...bodies.values()])
  if (admission) assertRouteCoverage(admission.documents, documentRoutes)
  const seenRoutes = new Set()
  for (const row of manifest.routes) {
    if (seenRoutes.has(row.route) || !['document', 'person', 'map', 'category'].includes(row.kind) || !/^\/[\p{L}\p{N}_/-]*$/u.test(row.route) || !Array.isArray(row.files) || !row.files.length) throw new Error('E_RENDER_ROUTE')
    seenRoutes.add(row.route)
    for (const path of row.files) if (!byPath.has(path)) throw new Error('E_RENDER_DANGLING_REF')
    if (row.kind === 'document' && (!row.files.some(path => bodies.get(path)?.route === row.route) || !row.files.some(path => path.startsWith('documents/')))) throw new Error('E_RENDER_DOCUMENT_COVERAGE')
  }
  for (const body of bodies.values()) {
    const visit = node => {
      if (node.type === 'link' && /^\/world\//u.test(node.url ?? '') && !seenRoutes.has(node.url.split(/[?#]/u)[0])) throw new Error('E_RENDER_DANGLING_REF')
      for (const child of node.children ?? []) visit(child)
    }
    for (const block of body.blocks ?? []) visit(block)
  }
  const contractFile = byPath.get('public/wiki-contract.json'), publicationFile = byPath.get('generated/publication-manifest.json')
  if (!contractFile || !publicationFile) throw new Error('E_RENDER_OUTPUT_MISSING')
  const value = async file => JSON.parse(await regularBytes(file.storage === 'tracked' ? root : snapshot, file.storage === 'tracked' ? file.source : file.path))
  assertRouteCoverage(manifest.documentRoutes, (await value(contractFile)).documents)
  const publication = await value(publicationFile)
  assertRouteCoverage(manifest.documentRoutes, publication.documents)
  assertRouteCoverage(publication.categories ?? [], manifest.routes.filter(row => row.kind === 'category'))
  const personRoutes = [...byPath.keys()].filter(path => /^public\/person-details\/[^/]+\.json$/u.test(path)).map(path => `/people/${path.split('/').at(-1).slice(0, -5)}`)
  assertRouteCoverage(personRoutes, manifest.routes.filter(row => row.kind === 'person'))
  assertRouteCoverage(byPath.has('public/opening-territories.json') ? ['/states'] : [], manifest.routes.filter(row => row.kind === 'map'))
  const seed = seeds ? await checkSeeds(resolve(seeds), { sentinels }) : null
  return { status: 'passed', files: manifest.files.length, bytes: totalBytes, largestFile, documents: documentRoutes.length, routes: manifest.routes.length, coverage: 1, danglingRefs: 0, privateSentinels: 0, renderManifestSha256: `sha256:${sha256(manifestBytes)}`, ...(seed ? { seedManifestSha256: `sha256:${seed.sha256}`, seedRows: seed.rows } : {}) }
}

async function cli() {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/check-render-snapshot.mjs [--snapshot DIR] [--seeds DIR] [--root DIR] [--report FILE]\nChecks exact inventory, hashes, public boundary, admitted route coverage and dangling refs without PostgreSQL.')
    return
  }
  const options = {}; let report
  for (let i = 0; i < args.length; i += 2) {
    if (!['--snapshot', '--seeds', '--root', '--report'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('E_RENDER_ARGUMENT')
    if (args[i] === '--report') report = args[i + 1]
    else options[args[i].slice(2)] = args[i + 1]
  }
  const result = await checkRenderSnapshot(options)
  if (report) await writeFile(report, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) cli().catch(error => { console.error(error.message); process.exitCode = 1 })
