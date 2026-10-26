import { createHash } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { validateWorldGraphProjection } from './cast-sqlite/world-graph-document.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fail = (code, detail) => { throw new Error(`${code}:${detail}`) }
const exact = (value, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail('E_MAP_INPUT', 'keys')
}
const parse = bytes => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))

// A request is explicit local configuration, never a download or source approval.
// Every file read here is retained in the same pre/post-stage drift inventory.
export async function loadMapDataInput(requestPath) {
  const dependencies = new Map()
  const take = async (path, expected, size) => {
    if (typeof path !== 'string' || !isAbsolute(path) || resolve(path) !== path) fail('E_MAP_PATH', 'absolute normalized path required')
    for (let cursor = path; ; cursor = dirname(cursor)) {
      const info = await lstat(cursor)
      if (info.isSymbolicLink() || (cursor === path ? !info.isFile() : !info.isDirectory())) fail('E_MAP_PATH', path)
      if (dirname(cursor) === cursor) break
    }
    const info = await lstat(path)
    const bytes = await readFile(path)
    if (bytes.subarray(0, 128).toString().startsWith('version https://git-lfs.github.com/spec/v1')) fail('E_MAP_LFS_POINTER', path)
    const hash = sha(bytes)
    if (expected !== undefined && hash !== expected || size !== undefined && bytes.length !== size) fail('E_MAP_HASH', path)
    const binding = { path, sha256: hash, dev: info.dev, ino: info.ino, size: bytes.length }
    const previous = dependencies.get(path)
    if (previous && !isDeepStrictEqual(previous, binding)) fail('E_MAP_DRIFT', path)
    dependencies.set(path, binding)
    return bytes
  }
  const request = parse(await take(requestPath))
  exact(request, ['schema', 'mapperRoot', 'mapperRevision', 'releaseRoot', 'manifestSha256', 'lock', 'sourceFiles', 'licenseFiles'])
  if (request.schema !== 'janseon-wiki-map-input.v1' || !/^[a-f0-9]{40}$/.test(request.mapperRevision)
    || !/^[a-f0-9]{64}$/.test(request.manifestSha256)
    || !isAbsolute(request.mapperRoot) || !isAbsolute(request.releaseRoot)) fail('E_MAP_INPUT', 'request')
  const git = args => execFileSync('git', ['-C', request.mapperRoot, ...args], { encoding: 'utf8' }).trim()
  if (git(['remote', 'get-url', 'origin']) !== 'https://github.com/islee23520/orbat-mapper.git'
    || git(['rev-parse', 'HEAD']) !== request.mapperRevision
    || git(['status', '--porcelain', '--untracked-files=no'])) fail('E_MAP_CONTRACT', 'declared clean remote-main cache required')
  git(['merge-base', '--is-ancestor', request.mapperRevision, 'refs/remotes/origin/main'])
  // These two modules have only their declared relative/builtin dependencies.
  for (const name of ['release-manifest.mjs', 'canonical.mjs']) await take(join(request.mapperRoot, 'scripts/janseon', name))
  const { validateReleaseManifest } = await import(pathToFileURL(join(request.mapperRoot, 'scripts/janseon/release-manifest.mjs')))
  const { semanticDigest } = await import(pathToFileURL(join(request.mapperRoot, 'scripts/janseon/canonical.mjs')))
  const manifestBytes = await take(join(request.releaseRoot, 'release-manifest.json'), request.manifestSha256)
  const manifest = parse(manifestBytes), p = manifest.provenance
  const content = (id, hash) => {
    if (!Object.hasOwn(request.sourceFiles, id)) fail('E_MAP_SOURCE', id)
    return take(request.sourceFiles[id], hash)
  }
  const budget = parse(await content(p.budgetReceipt.contentId, p.budgetReceipt.sha256))
  const identities = validateReleaseManifest(manifest, { expectedTargets: ['wiki', 'game'], budget })
  const lock = { ...identities, sourceCommit: p.sourceCommit, exporterRevision: p.exporter.revision,
    snapshotContentId: p.snapshot.contentId, databaseSha256: p.snapshot.databaseSha256,
    mapSemanticSha256: manifest.semantic.mapSemanticSha256, identitySnapshotSha256: manifest.semantic.identitySnapshotSha256 }
  if (!isDeepStrictEqual(request.lock, lock)) fail('E_MAP_LOCK', 'mixed release')
  await content(p.snapshot.contentId, p.snapshot.databaseSha256)
  for (const r of [p.identityReceipt, budget.migrationReceipt, ...p.sourceReceipts.map(row => row.receipt), ...p.approvalReceipts.map(row => row.receipt)])
    await content(r.contentId, r.sha256)
  const members = new Map()
  for (const member of manifest.semantic.members) {
    const location = p.memberLocations.find(row => row.path === member.path)
    const path = location.storage === 'protected-content' ? request.sourceFiles[location.contentId] : join(request.releaseRoot, member.path)
    if (!path) fail('E_MAP_SOURCE', location.contentId)
    members.set(member.path, await take(path, member.rawSha256, member.sizeBytes))
    if (!Object.hasOwn(request.licenseFiles, member.license.id)) fail('E_MAP_SOURCE', member.license.id)
    await take(request.licenseFiles[member.license.id], member.license.textSha256)
  }
  const core = parse(members.get('wiki/map-core.json'))
  exact(core, ['schema', 'kind', 'data', 'sourceRows'])
  if (core.schema !== 'janseon-typed-map-projection.v1' || core.kind !== 'map-core') fail('E_MAP_GRAPH', 'full native graph required')
  const graph = validateWorldGraphProjection(core.data)
  const gameGraph = validateWorldGraphProjection(parse(members.get('game/world-graph.json')))
  const refs = manifest.semantic.domains.graph.editionRefs
  if (refs.length !== 1) fail('E_MAP_GRAPH', 'one native graph edition required')
  const ref = refs[0]
  const [graphHash, gameGraphHash] = [graph, gameGraph].map(document => semanticDigest({
    schema: 'janseon-graph-semantic.v1', datasetId: ref.datasetId, editionId: ref.editionId,
    document: { ...document, aliases: Object.entries(document.aliases) } }))
  if (graphHash !== gameGraphHash) fail('E_MAP_GRAPH', 'wiki/game mismatch')
  if (graphHash !== manifest.semantic.domains.graph.semanticSha256
    || !isDeepStrictEqual(core.sourceRows, [{ editionRef: ref, rowsSha256: semanticDigest(graph) }])) fail('E_MAP_GRAPH', 'source semantic binding')
  for (const path of ['wiki/map-core.json', 'game/world-graph.json']) {
    const member = manifest.semantic.members.find(row => row.path === path)
    if (!isDeepStrictEqual(member.editionRefs, refs)) fail('E_MAP_GRAPH', 'graph edition coverage')
  }
  return {
    graph,
    receipt: { schema: 'janseon-wiki-map-input-receipt.v1', ...identities, manifestSha256: sha(manifestBytes),
      requestSha256: dependencies.get(requestPath).sha256, mapperRevision: request.mapperRevision,
      identitySnapshotSha256: manifest.semantic.identitySnapshotSha256,
      inputSha256: [...new Set([...dependencies.values()].map(row => row.sha256))].sort(),
      members: manifest.semantic.members.map(({ path, rawSha256 }) => ({ path, rawSha256 })), sourceApproval: 'NOT_EVALUATED' },
    async recheck() {
      const expected = [...dependencies.values()]
      for (const row of expected) {
        try { await take(row.path, row.sha256, row.size) } catch { fail('E_MAP_DRIFT', 'resolved input changed') }
      }
      if (git(['rev-parse', 'HEAD']) !== request.mapperRevision || git(['status', '--porcelain', '--untracked-files=no'])) fail('E_MAP_DRIFT', 'contract cache changed')
    },
  }
}
