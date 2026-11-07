import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertRouteCoverage } from './public-admission.mjs'

const exec = promisify(execFile)
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const jsonBytes = value => `${JSON.stringify(value, null, 2)}\n`
export const privateSentinels = ['wiki_private', 'WIKI_GENERATION_PRIVATE_PG', 'WIKI_DOCUMENT_PG=', 'postgresql://', 'postgres://', 'PRIVATE_SENTINEL', 'UNADMITTED_SENTINEL']

export function safePath(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || path.includes(':') || path.split('/').some(part => !part || part === '.' || part === '..' || part.startsWith('.')))
    throw new Error('E_RENDER_PATH')
  return path
}

export async function regularBytes(root, path) {
  safePath(path)
  let cursor = resolve(root)
  const parts = path.split('/')
  for (let i = 0; i < parts.length; i++) {
    cursor = join(cursor, parts[i])
    const info = await lstat(cursor)
    if (info.isSymbolicLink() || (i === parts.length - 1 ? !info.isFile() : !info.isDirectory())) throw new Error('E_RENDER_FILE')
  }
  return readFile(cursor)
}

export async function treeFiles(root, prefix = '') {
  const out = []
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) throw new Error('E_RENDER_FILE')
    if (entry.isDirectory()) out.push(...await treeFiles(root, path))
    else if (entry.isFile()) out.push(path)
    else throw new Error('E_RENDER_FILE')
  }
  return out.sort()
}

export function assertPublicBytes(bytes, sentinels = privateSentinels) {
  const text = bytes.toString('utf8')
  if (sentinels.some(value => value && text.includes(value))) throw new Error('E_RENDER_PRIVATE_SENTINEL')
  if (/src\/generated-private\/|(?:\/home\/|\/Users\/|[A-Z]:\\\\Users\\\\)/u.test(text)) throw new Error('E_RENDER_PRIVATE_PATH')
}

export function publicArtifact(path, allowlist) {
  safePath(path)
  if (!path.startsWith('public/')) return false
  const relative = path.slice(7)
  if (allowlist.rootFiles.includes(relative)) return true
  const [top, ...rest] = relative.split('/')
  return Boolean(allowlist.directories[top] && new RegExp(allowlist.directories[top], 'u').test(rest.join('/')))
}

export function generatedArtifact(path) {
  return /^src\/generated\/(?:[A-Za-z][A-Za-z0-9-]*\.(?:ts|json)|world\/[\p{L}\p{N}_-]+\.json)$/u.test(path)
}

export async function gitTracked(root) {
  const { stdout } = await exec('git', ['-C', root, 'ls-files', '-z', '--', 'public'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  return new Set(stdout.split('\0').filter(Boolean))
}

export async function renderExport({ root, out, admission, receipt, tracked, sentinels = privateSentinels }) {
  root = resolve(root); out = resolve(out)
  if (receipt?.format !== 'wiki-checked-build/1' || receipt.status !== 'passed') throw new Error('E_RENDER_CHECKED_BUILD_REQUIRED')
  const ownershipBytes = await regularBytes(root, 'src/generated-private/generation-release-manifest.json')
  if (sha256(ownershipBytes) !== receipt.generationManifestSha256) throw new Error('E_RENDER_GENERATION_CHANGED')
  const ownership = JSON.parse(ownershipBytes)
  if (ownership.schema !== 1 || !Array.isArray(ownership.files)) throw new Error('E_RENDER_GENERATION_MANIFEST')
  const allowlist = JSON.parse(await regularBytes(root, 'artifact-allowlist.json'))
  const publication = JSON.parse(await regularBytes(root, 'src/generated/publication-manifest.json'))
  assertRouteCoverage(admission.documents, publication.documents)
  const admitted = new Map(admission.documents.map(row => [row.route, row]))
  const worldPaths = new Set(publication.documents.map(row => row.contentRef))
  const owned = new Map()
  for (const file of ownership.files) {
    if (file.path.startsWith('.omo/')) continue
    safePath(file.path)
    if (owned.has(file.path)) throw new Error('E_RENDER_DUPLICATE')
    owned.set(file.path, file.sha256)
  }
  for (const path of ['src/generated/publication-manifest.json', 'public/wiki-contract.json', ...worldPaths]) {
    if (!owned.has(path)) throw new Error('E_RENDER_OUTPUT_MISSING')
  }
  tracked ??= await gitTracked(root)
  const files = []
  const routes = []
  const write = async (path, bytes, source = null, storage = 'snapshot') => {
    safePath(path)
    assertPublicBytes(bytes, sentinels)
    if (files.some(row => row.path === path)) throw new Error('E_RENDER_DUPLICATE')
    if (storage === 'snapshot') {
      await mkdir(dirname(join(out, path)), { recursive: true })
      await writeFile(join(out, path), bytes, { flag: 'wx', mode: 0o644 })
    }
    files.push({ path, source, storage, mode: '100644', sha256: sha256(bytes), bytes: bytes.length })
  }
  for (const [source, expected] of [...owned].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (source.startsWith('src/generated-private/') || source.startsWith('.omo/')) continue
    if (!publicArtifact(source, allowlist) && !generatedArtifact(source)) throw new Error('E_RENDER_PUBLIC_ALLOWLIST')
    if (source.startsWith('src/generated/world/') && !worldPaths.has(source)) throw new Error('E_RENDER_UNADMITTED_OUTPUT')
    const bytes = await regularBytes(root, source)
    if (sha256(bytes) !== expected) throw new Error('E_RENDER_OUTPUT_CHANGED')
    const path = source.replace(/^src\/generated\//u, 'generated/')
    let storage = 'snapshot'
    if (source.startsWith('public/') && tracked.has(source)) {
      const committed = await exec('git', ['-C', root, 'show', `HEAD:${source}`], { encoding: 'buffer', maxBuffer: Math.max(bytes.length + 1024, 1024 * 1024) })
      if (sha256(committed.stdout) === expected) storage = 'tracked'
    }
    await write(path, bytes, source, storage)
  }
  // Include all tracked static public inputs accepted by the actual artifact
  // allowlist. They stay in place; the snapshot only binds their exact bytes.
  for (const source of [...tracked].sort()) {
    if (owned.has(source) || !publicArtifact(source, allowlist)) continue
    const bytes = await regularBytes(root, source)
    const committed = await exec('git', ['-C', root, 'show', `HEAD:${source}`], { encoding: 'buffer', maxBuffer: Math.max(bytes.length + 1024, 1024 * 1024) })
    if (sha256(committed.stdout) !== sha256(bytes)) throw new Error('E_RENDER_TRACKED_CHANGED')
    await write(source, bytes, source, 'tracked')
  }
  for (const document of publication.documents) {
    if (!admitted.has(document.route) || !/^src\/generated\/world\/[\p{L}\p{N}_-]+\.json$/u.test(document.contentRef)) throw new Error('E_RENDER_DOCUMENT_REF')
    const body = JSON.parse(await regularBytes(root, document.contentRef))
    if (body.route !== document.route || typeof body.reviewText !== 'string' || !Array.isArray(body.blocks) || !body.blocks.length) throw new Error('E_RENDER_DOCUMENT_BODY')
    const path = `documents/${document.contentRef.split('/').at(-1).replace(/\.json$/u, '.md')}`
    // reviewText already comes from the shared catalog/API markdown renderer.
    await write(path, Buffer.from(`# ${body.title}\n\n${body.reviewText.trim()}\n`))
    routes.push({ route: document.route, kind: 'document', files: [document.contentRef.replace(/^src\/generated\//u, 'generated/'), path] })
  }
  for (const file of files) {
    if (/^public\/person-details\/[^/]+\.json$/u.test(file.path)) routes.push({ route: `/people/${file.path.split('/').at(-1).slice(0, -5)}`, kind: 'person', files: [file.path] })
    if (file.path === 'public/opening-territories.json') routes.push({ route: '/states', kind: 'map', files: [file.path] })
  }
  for (const category of publication.categories ?? []) routes.push({ route: category.route, kind: 'category', files: ['generated/publication-manifest.json'] })
  routes.sort((a, b) => a.route < b.route ? -1 : a.route > b.route ? 1 : 0)
  await write('index.md', Buffer.from('# 공개 snapshot\n\n' + routes.map(row => `- ${row.route}: ${row.files.map(path => `[${path}](${files.find(file => file.path === path)?.storage === 'tracked' ? '../' : ''}${path})`).join(', ')}`).join('\n') + '\n'))
  const manifest = { format: 'wiki-renders/1', files: files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0), routes, documentRoutes: [...admitted.keys()].sort() }
  await writeFile(join(out, 'manifest.json'), jsonBytes(manifest), { flag: 'wx' })
  return manifest
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') console.log('Usage: render-export.mjs --check --snapshot DIR [--seeds DIR]\nExport runs only inside project-public-snapshot.mjs checked-build lifetime.')
  else if (args[0] === '--check') {
    const { checkRenderSnapshot } = await import('./check-render-snapshot.mjs')
    const options = {}
    for (let i = 1; i < args.length; i += 2) {
      if (!['--snapshot', '--seeds'].includes(args[i]) || !args[i + 1]) throw new Error('E_RENDER_ARGUMENT')
      options[args[i].slice(2)] = args[i + 1]
    }
    console.log(JSON.stringify(await checkRenderSnapshot(options)))
  } else throw new Error('E_RENDER_COORDINATOR_REQUIRED')
}
