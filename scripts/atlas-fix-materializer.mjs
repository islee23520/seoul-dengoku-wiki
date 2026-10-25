import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readSourceArchive } from './cast-sqlite/source-archive.mjs'

export const BATCH_ID = 'doc247-atlas-known-world-successor-20261019'
export const DIRECTORY = '.omo/private/seoul-migration/doc247-atlas-fix-20261019/'
export const REGISTRY_PATH = '.omo/private/seoul-migration/applied-batches.json'
export const EXPECTED = Object.freeze({
  registryCount: 110,
  registrySha256: 'f1ec5e68e732340dbc487df4f2a4e02d05c602ce45d623218eac17146d3adc08',
  atlasBeforeSha256: 'ebb14a41baf48b45efd6bff7ca9bb97ff6a6f713fa18ddea4ff60fd5b4614f43',
  atlasAfterSha256: 'e8314a0a65c2fbaa2db47f8388b11b931840b2d2b24a2aeeb6299815888ee32c',
  schemaAfterSha256: '7da09ef973524ba8487b80be362e883663e9dab430e1bf99032c7d4c3b217720',
  rendererAfterSha256: 'd399d697d9ce6a8365964f5504b26658162cf580657078f18404293299932423',
  materializerSha256: '00cd684fc4519f5a701b2dbf174ff4fe6ffdb67e45bad46d2d4fac1d46b3b98e',
})
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`)
const check = (condition, code, path) => { if (!condition) throw new Error(`${code}:${path}`) }

export async function materializeAtlasFixSuccessor(root, readBytes = readFile) {
  const load = async (root, path) => readBytes === readFile && path === 'lore/authoring.atlas.schema.json'
    ? readSourceArchive(path, EXPECTED.schemaAfterSha256, process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'))
    : Buffer.from(await readBytes(resolve(root, path)))
  const [registryBytes, atlasBytes, schemaBytes, rendererBytes, materializerBytes, priorManifestBytes, diffBytes] = await Promise.all([
    load(root, REGISTRY_PATH), load(root, 'lore/World-Narrative-Atlas.json'), load(root, 'lore/authoring.atlas.schema.json'),
    load(root, 'scripts/world-atlas-render.mjs'), load(root, 'scripts/materialize-world-atlas.mjs'),
    load(root, '.omo/private/seoul-migration/projection-refresh-successor-20261019/source-before-after.json'),
    load(root, DIRECTORY + 'structural-diff.json'),
  ])
  const liveRegistry = JSON.parse(registryBytes)
  const registry = liveRegistry.batches.at(-1)?.batchId === BATCH_ID
    ? { ...liveRegistry, batches: liveRegistry.batches.slice(0, -1) } : liveRegistry
  check(sha256(jsonBytes(registry)) === EXPECTED.registrySha256, 'E_REGISTRY_PREFIX', REGISTRY_PATH)
  check(sha256(atlasBytes) === EXPECTED.atlasAfterSha256, 'E_ATLAS_HASH', 'lore/World-Narrative-Atlas.json')
  check(sha256(schemaBytes) === EXPECTED.schemaAfterSha256, 'E_SCHEMA_HASH', 'lore/authoring.atlas.schema.json')
  check(sha256(rendererBytes) === EXPECTED.rendererAfterSha256, 'E_RENDERER_HASH', 'scripts/world-atlas-render.mjs')
  check(sha256(materializerBytes) === EXPECTED.materializerSha256, 'E_MATERIALIZER_HASH', 'scripts/materialize-world-atlas.mjs')
  check(registry.batches.length === EXPECTED.registryCount && registry.batches.at(-1)?.batchId === 'atlas-projection-refresh-successor-33', 'E_REGISTRY_PREFIX', REGISTRY_PATH)
  const prior = JSON.parse(priorManifestBytes)
  const sources = []
  for (const row of prior.sources) {
    const current = await load(root, row.sourcePath)
    sources.push({ sourcePath: row.sourcePath, beforeSha256: row.afterSha256, afterSha256: sha256(current),
      beforeBytes: row.afterBytes, afterBytes: current.length, changed: row.afterSha256 !== sha256(current), sealed: false })
  }
  check(sources.length === 33 && sources.every(row => row.changed), 'E_PROJECTION_SUCCESSOR', '/sources')
  const sourceBeforeAfter = { schema: 'seoul-source-before-after.v1', batchId: BATCH_ID, sources }
  const packet = {
    schema: 'seoul-doc247-atlas-known-world-successor.v1', batchId: BATCH_ID,
    registryPrefix: { count: EXPECTED.registryCount, sha256: EXPECTED.registrySha256 },
    authority: {
      predecessor: { batchId: 'atlas-projection-refresh-successor-33', path: '.omo/private/seoul-migration/projection-refresh-successor-20261019/application-packet.json' },
      atlas: { path: 'lore/World-Narrative-Atlas.json', beforeSha256: EXPECTED.atlasBeforeSha256, afterSha256: EXPECTED.atlasAfterSha256 },
      schema: { path: 'lore/authoring.atlas.schema.json', sha256: EXPECTED.schemaAfterSha256 },
      renderer: { path: 'scripts/world-atlas-render.mjs', sha256: EXPECTED.rendererAfterSha256 },
      materializer: { path: 'scripts/materialize-world-atlas.mjs', sha256: EXPECTED.materializerSha256 },
      structuralDiff: { path: DIRECTORY + 'structural-diff.json', sha256: sha256(diffBytes) },
    },
    sourceBeforeAfter,
    scope: { atlasKnownWorldRestriction: true, projectionRefreshOnly: false, projectionCount: 33,
      proseApproval: false, publicationReview: false, grantCount: 0, entityActivationCount: 0, dispositionChanges: 0 },
  }
  const packetBytes = jsonBytes(packet); const manifestBytes = jsonBytes(sourceBeforeAfter)
  const entry = { batchId: BATCH_ID, state: 'applied', personIds: [], approvalModel: BATCH_ID,
    packetPath: DIRECTORY + 'application-packet.json', packetSha256: sha256(packetBytes), operationCount: 36,
    sourceBeforeAfterPath: DIRECTORY + 'source-before-after.json',
    applicationReview: { evidencePath: DIRECTORY + 'structural-diff.json', evidenceSha256: sha256(diffBytes) },
    approvals: [{ kind: BATCH_ID, bodySha256: EXPECTED.atlasAfterSha256,
      messageRef: DIRECTORY + 'structural-diff.json', authorizationSha256: EXPECTED.atlasBeforeSha256 }],
    appliedAt: '2026-10-19T00:00:00.000Z' }
  return { registry, packet, packetBytes, sourceBeforeAfter, manifestBytes, entry }
}
