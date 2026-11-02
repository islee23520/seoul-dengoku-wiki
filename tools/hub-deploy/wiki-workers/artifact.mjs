import { createHash } from 'node:crypto'
import { cp, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { verifyPublicFeedbackBoundary } from '../verify-public-feedback-boundary.mjs'

export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const MAX_FILES = 20000
export const MAX_BYTES = 25 * 1024 * 1024
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const json = async path => JSON.parse(await readFile(path, 'utf8'))

export async function files(root, prefix = '') {
  const directory = resolve(root, prefix)
  const info = await lstat(directory)
  requireValue(info.isDirectory() && !info.isSymbolicLink(), 'artifact directory must be regular')
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name
    if (entry.isDirectory()) result.push(...await files(root, path + '/'))
    else {
      requireValue(entry.isFile(), `unsupported filesystem entry: ${path}`)
      const content = await readFile(resolve(root, path))
      result.push({ path, bytes: content.length, sha256: sha256(content) })
    }
  }
  return result.sort((a, b) => a.path.localeCompare(b.path))
}

export function validateLimits(artifacts) {
  requireValue(artifacts.length > 0 && artifacts.length <= MAX_FILES, 'asset file count exceeds 20000 or is empty')
  for (const entry of artifacts) {
    requireValue(entry.bytes <= MAX_BYTES, `asset exceeds 25 MiB: ${entry.path}`)
    requireValue(/^wiki\//.test(entry.path) && !entry.path.split('/').some(part => part === '..' || part === '.' || !part), `nonwiki or unsafe path: ${entry.path}`)
    requireValue(!/(^|\/)(?:generated-private|private-feedback|node_modules|\.git)(\/|$)/.test(entry.path), `private/source asset: ${entry.path}`)
    requireValue(!/(?:selectable-text-catalog|feedback-selectable-views)/.test(entry.path), `private catalog: ${entry.path}`)
  }
  requireValue(artifacts.some(entry => entry.path === 'wiki/index.html'), 'wiki index missing')
}

export function sourceIdentity(source, expectedSha) {
  const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim()
  const parentCommit = git('rev-parse', 'HEAD')
  requireValue(/^[a-f0-9]{40}$/.test(expectedSha) && parentCommit === expectedSha, 'source HEAD mismatch')
  requireValue(git('status', '--porcelain', '--untracked-files=no') === '', 'source must be clean including submodules')
  const wikiCommit = git('rev-parse', 'HEAD:WIKI')
  requireValue(execFileSync('git', ['-C', resolve(source, 'WIKI'), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() === wikiCommit, 'wiki gitlink mismatch')
  return { parentCommit, wikiCommit }
}

async function verifyHub(site) {
  const actual = (await files(site)).filter(entry => entry.path !== 'deployment-manifest.json')
  const hubBytes = await readFile(resolve(site, 'deployment-manifest.json'))
  const hub = JSON.parse(hubBytes)
  requireValue(hub.files === actual.length && JSON.stringify([...hub.artifacts].sort((a, b) => a.path.localeCompare(b.path))) === JSON.stringify(actual), 'hub artifact integrity mismatch')
  await verifyPublicFeedbackBoundary(site)
  return { hubBytes, actual }
}

export async function prepare(site, receiptPath, output, expectedSha) {
  const { hubBytes, actual } = await verifyHub(site)
  const receipt = await json(receiptPath)
  requireValue(receipt.schemaVersion === 1 && receipt.parentCommit === expectedSha && /^[a-f0-9]{40}$/.test(receipt.wikiCommit), 'receipt source mismatch')
  requireValue(receipt.hubManifestSha256 === sha256(hubBytes), 'receipt manifest mismatch')
  const artifacts = actual.filter(entry => entry.path.startsWith('wiki/'))
  validateLimits(artifacts)
  requireValue(resolve(output) !== resolve(site) && !resolve(output).startsWith(resolve(site) + sep), 'output overlaps source site')
  await mkdir(output)
  await mkdir(resolve(output, 'assets'))
  await cp(resolve(site, 'wiki'), resolve(output, 'assets/wiki'), { recursive: true })
  const manifest = { schemaVersion: 1, parentCommit: receipt.parentCommit, wikiCommit: receipt.wikiCommit, hubManifestSha256: sha256(hubBytes), receiptSha256: sha256(await readFile(receiptPath)), files: artifacts.length, maxFileBytes: Math.max(...artifacts.map(entry => entry.bytes)), artifacts }
  await writeFile(resolve(output, 'wiki-artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  await cp(receiptPath, resolve(output, 'verified-build-receipt.json'))
  return manifest
}

export async function verifyArtifact(directory, expectedSha) {
  const info = await lstat(directory)
  requireValue(info.isDirectory() && !info.isSymbolicLink(), 'artifact directory must be regular')
  const actual = await files(resolve(directory, 'assets'))
  await verifyPublicFeedbackBoundary(resolve(directory, 'assets'))
  const manifestBytes = await readFile(resolve(directory, 'wiki-artifact-manifest.json'))
  const manifest = JSON.parse(manifestBytes)
  const receiptBytes = await readFile(resolve(directory, 'verified-build-receipt.json'))
  const receipt = JSON.parse(receiptBytes)
  requireValue(manifest.schemaVersion === 1 && receipt.parentCommit === expectedSha && manifest.parentCommit === expectedSha, 'artifact source mismatch')
  requireValue(receipt.wikiCommit === manifest.wikiCommit && /^[a-f0-9]{40}$/.test(manifest.wikiCommit), 'artifact receipt source mismatch')
  requireValue(sha256(receiptBytes) === manifest.receiptSha256 && receipt.hubManifestSha256 === manifest.hubManifestSha256, 'artifact receipt mismatch')
  validateLimits(actual)
  requireValue(manifest.files === actual.length && manifest.maxFileBytes === Math.max(...actual.map(entry => entry.bytes)) && JSON.stringify(actual) === JSON.stringify(manifest.artifacts), 'artifact content mismatch')
  return { manifest, manifestSha256: sha256(manifestBytes) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2)
  try {
    if (command === 'prepare') console.log(JSON.stringify(await prepare(...args)))
    else if (command === 'verify') console.log(JSON.stringify(await verifyArtifact(...args)))
    else if (command === 'receipt') {
      const [source, site, expectedSha, output] = args
      const identity = sourceIdentity(source, expectedSha)
      const { hubBytes } = await verifyHub(site)
      await writeFile(output, JSON.stringify({ schemaVersion: 1, ...identity, hubManifestSha256: sha256(hubBytes) }, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
    } else throw new Error('usage: artifact.mjs prepare SITE RECEIPT OUTPUT SHA | verify ARTIFACT SHA | receipt SOURCE SITE SHA OUTPUT')
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
