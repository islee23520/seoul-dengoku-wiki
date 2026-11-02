import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSelectableViews } from '../../feedback-service/src/views.mjs'
import { verifyPublicFeedbackBoundary } from './verify-public-feedback-boundary.mjs'
import { canonical } from '../../feedback-service/src/transaction-proof.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const serviceFiles = [
  'package.json', 'package-lock.json', 'schema.sql', 'candidate-schema.sql', 'transaction-schema.sql', 'interface.schema.json',
  'document-selectable-view.schema.json', 'API.md', 'README.md', 'CROSS-HOST.md', 'CANDIDATE-PRODUCER.md',
  'DOCUMENT-SELECTABLE-VIEW.md', 'ENTITY-MAPPING-V2.md',
  'src/app.mjs', 'src/auth.mjs', 'src/config.mjs', 'src/journal.mjs',
  'src/server.mjs', 'src/store.mjs', 'src/views.mjs',
  'src/transaction-proof.mjs', 'src/source-binding.mjs', 'src/candidate-transactions.mjs',
  'src/receipt-trust.mjs', 'receipt-trust-cli.mjs',
]
const catalogs = ['ko', 'en'].map((locale) => `feedback-selectable-views.${locale}.json`)

export async function packagePrivateFeedback({ sourceRoot = root, catalogRoot = join(sourceRoot, 'WIKI'), output, parentCommit, wikiCommit, wikiGitlink, producerCommit, site }) {
  for (const [name, value] of Object.entries({ parentCommit, wikiCommit, wikiGitlink, producerCommit })) {
    if (!/^[a-f0-9]{40}$/.test(value ?? '')) throw new Error(`FEEDBACK_PROVENANCE_REQUIRED:${name}`)
  }
  const wiki = resolve(catalogRoot)
  const producer = join(wiki, 'scripts/feedback-source-catalog.mjs')
  const catalogPaths = catalogs.map((file) => join(wiki, 'src/generated-private', file))
  await stat(producer).catch(() => { throw new Error('FEEDBACK_PRODUCER_REQUIRED:WIKI/scripts/feedback-source-catalog.mjs') })
  const loaded = loadSelectableViews(catalogPaths)
  for (const [index, path] of catalogPaths.entries()) {
    const value = JSON.parse(await readFile(path, 'utf8'))
    if (value.schemaVersion !== 'selectable-text-catalog.v2' || value.locale !== ['ko', 'en'][index] || !Object.keys(value.documents).length || Object.values(value.documents).some((doc) => doc.locale !== value.locale)) throw new Error(`FEEDBACK_CATALOG_LOCALE_INVALID:${catalogs[index]}`)
  }
  if (!loaded.documents.size || ![...loaded.documents.values()].some((document) => document.locale === 'ko') || ![...loaded.documents.values()].some((document) => document.locale === 'en')) throw new Error('FEEDBACK_CATALOG_EMPTY')
  await verifyPublicFeedbackBoundary(site)
  const sourcesByRevision = new Map()
  for (const entry of await readdir(join(wiki, 'lore'), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const bytes = await readFile(join(entry.parentPath, entry.name))
    const revision = sha256(canonical(JSON.parse(bytes)))
    if (!sourcesByRevision.has(revision)) sourcesByRevision.set(revision, bytes)
  }
  const sourceManifest = { version: 'feedback-candidate-sources.v1', sources: [] }
  const sourceBytes = new Map()
  for (const document of loaded.documents.values()) {
    const bytes = sourcesByRevision.get(document.currentRevision)
    if (!bytes) throw new Error('FEEDBACK_CANDIDATE_SOURCE_MISSING')
    const name = document.currentRevision + '.json'
    sourceBytes.set(name, bytes)
    sourceManifest.sources.push({ documentId: document.documentId, locale: document.locale, path: name })
  }
  const staging = resolve(output, 'private-feedback')
  await rm(staging, { recursive: true, force: true })
  await mkdir(join(staging, 'service'), { recursive: true })
  await mkdir(join(staging, 'catalogs'), { recursive: true })
  const artifacts = []
  await mkdir(join(staging, 'sources'), { recursive: true })
  for (const [name, bytes] of [...sourceBytes, ['manifest.json', Buffer.from(JSON.stringify(sourceManifest) + '\n')]]) {
    await writeFile(join(staging, 'sources', name), bytes)
    artifacts.push({ path: 'sources/' + name, bytes: bytes.length, sha256: sha256(bytes) })
  }
  for (const [from, to] of [
    ...serviceFiles.map((file) => [join(sourceRoot, 'TOOL/feedback-service', file), join('service', file)]),
    ...catalogPaths.map((path, index) => [path, join('catalogs', catalogs[index])]),
  ]) {
    const bytes = await readFile(from)
    const target = join(staging, to)
    await mkdir(dirname(target), { recursive: true })
    await cp(from, target)
    artifacts.push({ path: to, bytes: bytes.length, sha256: sha256(bytes) })
  }
  artifacts.sort((a, b) => a.path.localeCompare(b.path, 'en'))
  const producerBytes = await readFile(producer)
  const producerFiles = ['scripts/feedback-source-catalog.mjs', 'scripts/generate-catalog.mjs', 'scripts/world-atlas-schema.mjs']
  const sources = await Promise.all(producerFiles.map(async (path) => ({ path: `WIKI/${path}`, sha256: sha256(await readFile(join(wiki, path))) })))
  const manifest = {
    schemaVersion: 'feedback-private-release.v1',
    catalogSchema: 'selectable-text-catalog.v2',
    provenance: { parentCommit, wikiGitlink, wikiCommit, producerCommit, producerPath: 'WIKI/scripts/feedback-source-catalog.mjs', producerSha256: sha256(producerBytes), sources },
    artifacts,
  }
  await writeFile(join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const archive = resolve(output, 'seoul-dengoku-feedback-private.tar')
  const result = spawnSync('tar', ['-C', staging, '-cf', archive, '.'], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`FEEDBACK_TAR_FAILED:${result.stderr}`)
  await writeFile(`${archive}.sha256`, `${sha256(await readFile(archive))}  ${archive.split('/').at(-1)}\n`)
  return { archive, manifest }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.env.OUTPUT_ROOT ?? '/out'
  const sourceRoot = process.env.WORK_ROOT ?? join(output, 'work')
  const { archive } = await packagePrivateFeedback({ sourceRoot, catalogRoot: process.env.FEEDBACK_CATALOG_ROOT ?? join(sourceRoot, 'WIKI'), output, site: process.env.FEEDBACK_SITE_ROOT ?? join(output, 'site'), parentCommit: process.env.PARENT_COMMIT, wikiCommit: process.env.WIKI_COMMIT, wikiGitlink: process.env.WIKI_GITLINK, producerCommit: process.env.PRODUCER_COMMIT })
  console.log(`FEEDBACK_PRIVATE_BUNDLE_OK archive=${archive}`)
}
