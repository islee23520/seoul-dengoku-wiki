#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { materializeWorldAtlas } from './materialize-world-atlas.mjs'

export const BATCH_ID = 'atlas-projection-refresh-successor-33'
export const DIRECTORY = '.omo/private/seoul-migration/projection-refresh-successor-20261019/'
export const REGISTRY_PATH = '.omo/private/seoul-migration/applied-batches.json'
export const ATLAS_PATH = 'lore/World-Narrative-Atlas.json'
export const RENDERER_PATH = 'scripts/world-atlas-render.mjs'
export const MATERIALIZER_PATH = 'scripts/materialize-world-atlas.mjs'
export const REGEN_MANIFEST_PATH = '.omo/private/seoul-migration/doc247-review/batch2b-bestiary-regenerated/regen-manifest.json'
export const ATLAS_APPLICATION_PATH = '.omo/private/seoul-migration/atlas83-four-track-source-application-20261016/application-packet.json'
export const EXPECTED = Object.freeze({
  atlasSha256: 'ebb14a41baf48b45efd6bff7ca9bb97ff6a6f713fa18ddea4ff60fd5b4614f43',
  atlasApplicationSha256: '6111e6a2dd2a87ed1c27e7fb95b65bcff4d75306f1375d6ce43c928d779d38f1',
  rendererSha256: '3ff04e53d9d40d1c9fc72e3ffce0bd26eb3808d6d596cd8944b92006728b1b33',
  materializerSha256: '00cd684fc4519f5a701b2dbf174ff4fe6ffdb67e45bad46d2d4fac1d46b3b98e',
  regenManifestSha256: '2453e4c221beff61aa652ef1f120ecf1a67126f5d79890d55863adbff9580535',
  registryPrefixCount: 109,
  registryPrefixSha256: '17d3124a009bc42ce30283fa4860cb550c28c78c390d46423d052a801e58c4c6',
})
const execFileAsync = promisify(execFile)

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`)
const load = async (root, path, readBytes = readFile) => Buffer.from(await readBytes(resolve(root, path)))
const fail = (code, path) => { throw new Error(`${code}:${path}`) }
const requireHash = (bytes, expected, code, path) => { if (sha256(bytes) !== expected) fail(code, path) }
const pointer = (value, path) => path === '' ? value : path.split('/').slice(1).reduce((at, token) => at[token.replaceAll('~1', '/').replaceAll('~0', '~')], value)

export async function readProjectionPredecessor(root, path, expectedSha256, code = 'E_PROJECTION_BEFORE_HASH', reader = readFile) {
  const revision = 'e9c12a43728a599c371d373088e177a446ff5051'
  const before = reader.readHistorical
    ? Buffer.from(await reader.readHistorical(revision, path, root))
    : Buffer.from((await execFileAsync('git', ['show', `${revision}:${path}`], { cwd: root, encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 })).stdout)
  requireHash(before, expectedSha256, code, path)
  return before
}

async function externalTheatersPreimage(root, readBytes) {
  const path = 'lore/factions/External-Theaters.json'
  const before = await readProjectionPredecessor(root, path,
    '85502259693e436ff38abec65fb98034a0533c6279dfed75475ae8f785da0e39', 'E_PROJECTION_PREIMAGE', readBytes)
  const packet = JSON.parse(await load(root, '.omo/private/seoul-migration/daejeon-four-applied-staging/combined-packet.json', readBytes))
  const value = JSON.parse(before)
  for (const operation of packet.operations.filter(row => row.file === path)) {
    if (JSON.stringify(pointer(value, operation.path)) !== JSON.stringify(operation.oldValue)) fail('E_PROJECTION_PREIMAGE', operation.path)
    const parent = pointer(value, operation.path.slice(0, operation.path.lastIndexOf('/')))
    parent[operation.path.split('/').at(-1)] = operation.value
  }
  const raw = jsonBytes(value)
  requireHash(raw, '4017b6b7e61bf182e181c1fc0e5076b6725124600bba8d7bd030bb3a48ccfb88', 'E_PROJECTION_PREIMAGE', path)
  return raw
}

export async function materializeProjectionRefresh(root, { readBytes = readFile } = {}) {
  const [registryBytes, atlasBytes, atlasApplicationBytes, rendererBytes, materializerBytes, regenBytes] = await Promise.all([
    load(root, REGISTRY_PATH, readBytes), load(root, ATLAS_PATH, readBytes), load(root, ATLAS_APPLICATION_PATH, readBytes),
    load(root, RENDERER_PATH, readBytes), load(root, MATERIALIZER_PATH, readBytes), load(root, REGEN_MANIFEST_PATH, readBytes),
  ])
  requireHash(atlasBytes, EXPECTED.atlasSha256, 'E_ATLAS_HASH', ATLAS_PATH)
  requireHash(atlasApplicationBytes, EXPECTED.atlasApplicationSha256, 'E_ATLAS_APPLICATION_HASH', ATLAS_APPLICATION_PATH)
  requireHash(rendererBytes, EXPECTED.rendererSha256, 'E_RENDERER_HASH', RENDERER_PATH)
  requireHash(materializerBytes, EXPECTED.materializerSha256, 'E_MATERIALIZER_HASH', MATERIALIZER_PATH)
  requireHash(regenBytes, EXPECTED.regenManifestSha256, 'E_REGEN_MANIFEST_HASH', REGEN_MANIFEST_PATH)
  const registry = JSON.parse(registryBytes)
  if (registry.schema !== 'seoul-applied-batches.v1' || registry.visibility !== 'private') fail('E_REGISTRY_PREFIX', REGISTRY_PATH)
  const prefix = registry.batches.at(-1)?.batchId === BATCH_ID ? { ...registry, batches: registry.batches.slice(0, -1) } : registry
  const prefixBytes = jsonBytes(prefix)
  requireHash(prefixBytes, EXPECTED.registryPrefixSha256, 'E_REGISTRY_PREFIX', REGISTRY_PATH)
  if (prefix.batches.length !== EXPECTED.registryPrefixCount) fail('E_REGISTRY_PREFIX', REGISTRY_PATH)
  const regen = JSON.parse(regenBytes)
  if (regen.renderer.atlasSha256Before !== EXPECTED.atlasSha256 || regen.renderer.atlasSha256After !== EXPECTED.atlasSha256
    || regen.renderer.projectionCount !== 33 || regen.check.exitCode !== 0 || regen.test.exitCode !== 0
    || regen.writes.length !== 33 || regen.writes.some(row => row.changed !== true)) fail('E_REGEN_MANIFEST_SHAPE', REGEN_MANIFEST_PATH)
  const sources = []
  for (const row of regen.writes) {
    const current = await load(root, row.path, readBytes)
    requireHash(current, row.afterSha256, 'E_PROJECTION_AFTER_HASH', row.path)
    const before = row.path === 'lore/factions/External-Theaters.json'
      ? await externalTheatersPreimage(root, readBytes) : await readProjectionPredecessor(root, row.path, row.beforeSha256, 'E_PROJECTION_BEFORE_HASH', readBytes)
    requireHash(before, row.beforeSha256, 'E_PROJECTION_BEFORE_HASH', row.path)
    sources.push({ sourcePath: row.path, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: before.length, afterBytes: current.length, changed: true, sealed: false })
  }
  const external = sources.find(row => row.sourcePath === 'lore/factions/External-Theaters.json')
  if (external?.beforeSha256 !== '4017b6b7e61bf182e181c1fc0e5076b6725124600bba8d7bd030bb3a48ccfb88')
    fail('E_PROJECTION_CHAIN', external?.sourcePath ?? 'External-Theaters')
  const sourceBeforeAfter = { schema: 'seoul-source-before-after.v1', batchId: BATCH_ID, sources }
  const packet = {
    schema: 'seoul-atlas-projection-refresh-successor.v1', batchId: BATCH_ID,
    registryPrefix: { count: EXPECTED.registryPrefixCount, sha256: EXPECTED.registryPrefixSha256 },
    authority: {
      atlasApplication: { path: ATLAS_APPLICATION_PATH, sha256: EXPECTED.atlasApplicationSha256 },
      atlas: { path: ATLAS_PATH, sha256: EXPECTED.atlasSha256 },
      renderer: { path: RENDERER_PATH, sha256: EXPECTED.rendererSha256 },
      materializer: { path: MATERIALIZER_PATH, sha256: EXPECTED.materializerSha256 },
      regenerationReceipt: { path: REGEN_MANIFEST_PATH, sha256: EXPECTED.regenManifestSha256 },
      externalTheatersPreimage: { path: `${DIRECTORY}before/lore/factions/External-Theaters.json`, sha256: external.beforeSha256 },
    },
    sourceBeforeAfter,
    scope: { projectionRefreshOnly: true, projectionCount: 33, proseApproval: false, publicationReview: false,
      grantCount: 0, entityActivationCount: 0, dispositionChanges: 0 },
  }
  const packetBytes = jsonBytes(packet)
  const manifestBytes = jsonBytes(sourceBeforeAfter)
  const entry = {
    batchId: BATCH_ID, state: 'applied', personIds: [], approvalModel: BATCH_ID,
    packetPath: `${DIRECTORY}application-packet.json`, packetSha256: sha256(packetBytes), operationCount: 33,
    sourceBeforeAfterPath: `${DIRECTORY}source-before-after.json`,
    applicationReview: { evidencePath: REGEN_MANIFEST_PATH, evidenceSha256: EXPECTED.regenManifestSha256 },
    approvals: [{ kind: BATCH_ID, bodySha256: EXPECTED.atlasApplicationSha256,
      messageRef: ATLAS_APPLICATION_PATH, authorizationSha256: EXPECTED.atlasSha256 }],
    appliedAt: '2026-10-19T00:00:00.000Z',
  }
  return { packet, packetBytes, sourceBeforeAfter, manifestBytes, entry, registry, prefix,
    externalTheatersPreimage: await externalTheatersPreimage(root, readBytes) }
}

export async function registerProjectionRefresh(root, { write = false, readBytes = readFile } = {}) {
  const result = await materializeProjectionRefresh(root, { readBytes })
  const next = structuredClone(result.prefix)
  const existing = result.registry.batches.find(row => row.batchId === BATCH_ID)
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(result.entry) || result.registry.batches.at(-1).batchId !== BATCH_ID
      || result.registry.batches.length !== EXPECTED.registryPrefixCount + 1) fail('E_REGISTRY_SUCCESSOR', REGISTRY_PATH)
  }
  next.batches.push(result.entry)
  if (write) {
    await mkdir(resolve(root, DIRECTORY), { recursive: true })
    await mkdir(resolve(root, `${DIRECTORY}before/lore/factions`), { recursive: true })
    await writeFile(resolve(root, `${DIRECTORY}application-packet.json`), result.packetBytes)
    await writeFile(resolve(root, `${DIRECTORY}source-before-after.json`), result.manifestBytes)
    await writeFile(resolve(root, `${DIRECTORY}before/lore/factions/External-Theaters.json`), result.externalTheatersPreimage)
    await writeFile(resolve(root, REGISTRY_PATH), jsonBytes(next))
  }
  return { ...result, nextRegistry: next, registryBytes: jsonBytes(next) }
}

export async function verifyProjectionRefresh(root, { readBytes = readFile, checkRenderer = true } = {}) {
  const result = await registerProjectionRefresh(root, { readBytes })
  const packetBytes = await load(root, `${DIRECTORY}application-packet.json`, readBytes)
  const manifestBytes = await load(root, `${DIRECTORY}source-before-after.json`, readBytes)
  if (!packetBytes.equals(result.packetBytes)) fail('E_APPLICATION_PACKET', `${DIRECTORY}application-packet.json`)
  if (!manifestBytes.equals(result.manifestBytes)) fail('E_SOURCE_MANIFEST', `${DIRECTORY}source-before-after.json`)
  const registryBytes = await load(root, REGISTRY_PATH, readBytes)
  if (!registryBytes.equals(result.registryBytes)) fail('E_REGISTRY_SUCCESSOR', REGISTRY_PATH)
  if (checkRenderer) await materializeWorldAtlas({ atlasPath: resolve(root, ATLAS_PATH), outDir: resolve(root, 'lore'), check: true })
  return { ok: true, batchId: BATCH_ID, registryCount: result.nextRegistry.batches.length,
    registryPrefix: result.packet.registryPrefix, projections: result.sourceBeforeAfter.sources.length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.')
  const write = process.argv.includes('--write')
  console.log(JSON.stringify(write ? await registerProjectionRefresh(root, { write }) : await verifyProjectionRefresh(root), null, 2))
}
