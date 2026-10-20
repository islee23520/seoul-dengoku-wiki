import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

import { loadAppliedBatches } from './seoul-census.mjs'
import { BATCH_ID, DIRECTORY, REGISTRY_PATH, registerProjectionRefresh } from './projection-refresh-successor.mjs'

const root = resolve(import.meta.dirname, '..')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const bytes = path => readFileSync(resolve(root, path))

let historicalFixture
async function projectionFixture() {
  if (historicalFixture) return historicalFixture
  const registry = JSON.parse(bytes(REGISTRY_PATH))
  const files = new Map()
  files.set(resolve(root, REGISTRY_PATH), Buffer.from(JSON.stringify({ ...registry, batches: registry.batches.slice(0, 110) }, null, 2) + '\n'))
  const packet = JSON.parse(bytes('.omo/private/seoul-migration/atlas83-four-track-source-application-20261016/application-packet.json'))
  const archiveBytes = bytes(packet.beforeArchive.path)
  expect(digest(archiveBytes)).toBe(packet.beforeArchive.sha256)
  const atlas = JSON.parse(gunzipSync(Buffer.from(JSON.parse(archiveBytes).gzipBase64, 'base64')))
  const proposalBytes = bytes(packet.proposal.path)
  expect(digest(proposalBytes)).toBe(packet.proposal.sha256)
  const proposal = JSON.parse(proposalBytes)
  for (const operation of proposal.operations) {
    const parts = operation.pointer.slice(1).split('/'), key = parts.pop()
    const parent = parts.reduce((node, part) => node[part], atlas)
    expect(parent[key]).toEqual(operation.before)
    parent[key] = operation.after
  }
  for (const removal of proposal.relationRemovals) atlas.data.atlas.relations.splice(removal.index, 1)
  const atlasBytes = Buffer.from(JSON.stringify(atlas, null, 2) + '\n')
  expect(digest(atlasBytes)).toBe(packet.sources[0].afterSha256)
  files.set(resolve(root, 'lore/World-Narrative-Atlas.json'), atlasBytes)
  const headingPacket = JSON.parse(bytes('.omo/private/seoul-migration/renderer-heading-successor-20261016/application-packet.json'))
  const rendererArchiveBytes = bytes(headingPacket.archives.after.path)
  expect(digest(rendererArchiveBytes)).toBe(headingPacket.archives.after.sha256)
  const rendererArchive = JSON.parse(rendererArchiveBytes)
  const renderer = gunzipSync(Buffer.from(rendererArchive.gzipBase64, 'base64')).toString()
  const expectedRenderer = '3ff04e53d9d40d1c9fc72e3ffce0bd26eb3808d6d596cd8944b92006728b1b33'
  expect(digest(renderer)).toBe(expectedRenderer)
  files.set(resolve(root, 'scripts/world-atlas-render.mjs'), Buffer.from(renderer))
  const receiptBytes = bytes('.omo/private/seoul-migration/doc247-review/batch2b-bestiary-regenerated/regen-manifest.json')
  expect(digest(receiptBytes)).toBe('2453e4c221beff61aa652ef1f120ecf1a67126f5d79890d55863adbff9580535')
  const receipt = JSON.parse(receiptBytes)
  const finalBatch = registry.batches.find(row => row.batchId === 'doc247-atlas-known-world-successor-20261019')
  const finalPacketBytes = bytes(finalBatch.packetPath)
  expect(digest(finalPacketBytes)).toBe(finalBatch.packetSha256)
  const finalPacket = JSON.parse(finalPacketBytes)
  const transitions = new Map(finalPacket.sourceBeforeAfter.sources.map(row => [row.sourcePath, row]))
  const historicalLabels = [
    ['Sinjeong Wheel House', '신정차륜가', 'Guro Alloy House', '구로합금가'],
    ['Guro Digital Complex Battery House', '구로디지털단지전지가', 'Magok Test-Line House', '마곡시험선가'],
    ['Digital Media City Index House', '디지털미디어시티색인가', 'Digital Media City Payments House', '디지털미디어시티결제가'],
    ['Magok Seed House', '마곡종자가', 'Yongsan Convoy House', '용산호송가'],
    ['Yongsan Ship House', '용산선박가', 'Geumcheon District Office Machinery House', '금천구청중기가'],
    ['Dongdaeipgu Trading House', '동대입구객사가', 'Seoul Station Inventory House', '서울역재고가'],
  ]
  // Exact inverse of the registered Atlas-final projection transformation.
  // Authenticate both endpoints; this does not execute today's renderer.
  for (const row of receipt.writes) {
    const transition = transitions.get(row.path)
    const current = bytes(row.path)
    expect(digest(current), row.path).toBe(transition.afterSha256)
    expect(transition.beforeSha256, row.path).toBe(row.afterSha256)
    const value = JSON.parse(current)
    value.provenance.original_hash = packet.sources[0].afterSha256
    value.source.hash = packet.sources[0].afterSha256
    if (row.path === 'lore/World-Relation-Ledger.json') {
      const rows = value.content.find(node => node.kind === 'table').rows
      for (const [index, labels] of historicalLabels.entries()) {
        rows.at(index - historicalLabels.length)[0] = { en: labels[0], ko: labels[1] }
        rows.at(index - historicalLabels.length)[2] = { en: labels[2], ko: labels[3] }
      }
    }
    const body = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    expect(digest(body), row.path).toBe(row.afterSha256)
    files.set(resolve(root, row.path), body)
  }
  historicalFixture = { readBytes: path => Promise.resolve(files.get(path) ?? readFileSync(path)) }
  return historicalFixture
}

describe('authenticated atlas projection refresh successor', () => {
  it('rejects an altered existing terminal entry before registration writes', async () => {
    const fixture = await projectionFixture()
    const registry = JSON.parse(await fixture.readBytes(resolve(root, REGISTRY_PATH)))
    registry.batches.at(-1).appliedAt = '2026-10-20T00:00:00.000Z'
    await expect(registerProjectionRefresh(root, {
      write: true,
      readBytes: path => path === resolve(root, REGISTRY_PATH)
        ? Promise.resolve(Buffer.from(JSON.stringify(registry, null, 2) + '\n'))
        : fixture.readBytes(path),
    })).rejects.toThrow('E_REGISTRY_SUCCESSOR')
  })
  it('rejects an injected Atlas-final manifest at its exact authenticated path', async () => {
    const registry = JSON.parse(bytes(REGISTRY_PATH))
    const batch = registry.batches.find(row => row.batchId === 'doc247-atlas-known-world-successor-20261019')
    const target = resolve(root, batch.sourceBeforeAfterPath)
    const manifest = JSON.parse(bytes(batch.sourceBeforeAfterPath))
    manifest.sources[0].beforeSha256 = '0'.repeat(64)
    await expect(loadAppliedBatches(path => Promise.resolve(path === target
      ? Buffer.from(JSON.stringify(manifest, null, 2) + '\n') : readFileSync(path)), root)).rejects.toMatchObject({
      code: 'E_REVIEW_HASH', path: batch.sourceBeforeAfterPath,
    })
  })
  it('keeps the exact registry109 prefix and authenticates all 33 current projections', async () => {
    const registry = JSON.parse(bytes(REGISTRY_PATH))
    expect(registry.batches[109].batchId).toBe(BATCH_ID)
    const prefix = Buffer.from(`${JSON.stringify({ ...registry, batches: registry.batches.slice(0, 109) }, null, 2)}\n`)
    expect(digest(prefix)).toBe('17d3124a009bc42ce30283fa4860cb550c28c78c390d46423d052a801e58c4c6')
    const materialized = await registerProjectionRefresh(root, await projectionFixture())
    expect(materialized.sourceBeforeAfter.sources).toHaveLength(33)
    const loaded = await loadAppliedBatches(path => Promise.resolve(readFileSync(path)), root)
    expect(loaded[109].batchId).toBe(BATCH_ID)
  })

  it('rejects a forged manifest even when its packet and registry hash are coherently rewritten', async () => {
    const registry = JSON.parse(bytes(REGISTRY_PATH)); const files = new Map()
    const batch = registry.batches.at(-1)
    const manifest = JSON.parse(bytes(batch.sourceBeforeAfterPath))
    manifest.sources[0].beforeSha256 = '0'.repeat(64)
    const forged = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
    const packet = JSON.parse(bytes(batch.packetPath))
    packet.sourceBeforeAfter = manifest
    const packetBytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`)
    batch.packetSha256 = digest(packetBytes)
    files.set(resolve(root, batch.packetPath), packetBytes)
    files.set(resolve(root, batch.sourceBeforeAfterPath), forged)
    files.set(resolve(root, REGISTRY_PATH), Buffer.from(`${JSON.stringify(registry, null, 2)}\n`))
    await expect(loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), root)).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects a wrong after hash in a rehashed packet', async () => {
    const registry = JSON.parse(bytes(REGISTRY_PATH)); const files = new Map()
    const batch = registry.batches.at(-1); const packet = JSON.parse(bytes(batch.packetPath))
    packet.sourceBeforeAfter.sources[0].afterSha256 = '0'.repeat(64)
    const forged = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`)
    batch.packetSha256 = digest(forged)
    files.set(resolve(root, batch.packetPath), forged)
    files.set(resolve(root, REGISTRY_PATH), Buffer.from(`${JSON.stringify(registry, null, 2)}\n`))
    await expect(loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), root)).rejects.toThrow(/^E_/)
  })

  it('is idempotent when materialized against registry110', async () => {
    const fixture = await projectionFixture()
    const first = await registerProjectionRefresh(root, fixture)
    const second = await registerProjectionRefresh(root, fixture)
    expect(first.nextRegistry.batches).toHaveLength(110)
    expect(second.registryBytes.equals(first.registryBytes)).toBe(true)
    expect(second.packetBytes.equals(bytes(`${DIRECTORY}application-packet.json`))).toBe(true)
  })
})
