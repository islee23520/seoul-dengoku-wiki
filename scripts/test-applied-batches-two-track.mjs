import { afterAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { gunzipSync, gzipSync } from 'node:zlib'
import { createDependencyResolver, extractCensusSources, loadAppliedBatches } from './seoul-census.mjs'
import { rightsTransitionTargets } from './seoul-scope.mjs'
import { reviewWordingPredecessorReader } from './review-wording-successor.mjs'
import { k176PredecessorReader } from './k176-label-successor.mjs'
import { stationCatalogPredecessorReader } from './station-catalog-scope-successor.mjs'
import { materializeOfficesPredecessor } from '../.omo/private/seoul-migration/doc247-repin-20261019/materialize-repins.mjs'

const root = mkdtempSync(resolve(tmpdir(), 'seoul-two-track-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

it('water final registrations authenticate two repair fields and five status-only sources', async () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const batches = await loadAppliedBatches(f => Promise.resolve(readFileSync(f)), actualRoot)
  expect(batches.slice(0, 62).map(row => row.batchId)).toEqual(JSON.parse(readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/post62-registration-20261015/terminal-62.json'))).batchIds)
  for (const [id, count] of [['water-structures-route-2', 2], ['water-five-authoring-status-5', 5]]) {
    const batch = batches.find(row => row.batchId === id)
    expect(batch.personIds).toEqual([])
    expect(batch.operationCount).toBe(count)
    for (const path of [batch.packetPath, batch.applicationReview.evidencePath]) {
      await expect(loadAppliedBatches(f => Promise.resolve(f === resolve(actualRoot, path)
        ? Buffer.concat([readFileSync(f), Buffer.from(' ')]) : readFileSync(f)), actualRoot)).rejects.toThrow()
    }
  }
})

describe('post-62 registered source successors', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const ids = ['owner-recommendations-characters', 'owner-recommendations-articles', 'owner-recommendations-records', 'offices-v2-source-31', 'facility-nongrant-source-228']
  const selected = () => JSON.parse(readFileSync(registryPath)).batches.filter(row => ids.includes(row.batchId))
  const isolated = (batches, overrides = new Map()) => {
    const files = new Map(overrides)
    files.set(resolve(actualRoot, registryPath), Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', batches })))
    return loadHistoricalFixture(actualRoot, batches, files)
  }

  it.each(ids)('authenticates the sealed %s source group independently', async id => {
    const batch = selected().find(row => row.batchId === id)
    const loaded = await isolated([batch])
    expect(loaded[0].sourceBeforeAfter.sources).toHaveLength(id === 'offices-v2-source-31' || id === 'facility-nongrant-source-228' ? 1
      : id.endsWith('characters') ? 7 : id.endsWith('articles') ? 10 : 13)
  })

  it.each(ids)('rejects a rehashed %s packet, independent review, and source drift', async id => {
    for (const kind of ['packet', 'review', 'source']) {
      const batch = selected().find(row => row.batchId === id)
      const path = kind === 'packet' ? batch.packetPath : kind === 'review' ? batch.applicationReview.evidencePath
        : JSON.parse(readFileSync(resolve(actualRoot, batch.sourceBeforeAfterPath))).sources[0].sourcePath
      const bytes = Buffer.concat([readFileSync(resolve(actualRoot, path)), Buffer.from(' ')])
      const overrides = new Map([[resolve(actualRoot, path), bytes]])
      if (kind === 'packet') batch.packetSha256 = digest(bytes)
      if (kind === 'review') batch.applicationReview.evidenceSha256 = digest(bytes)
      await expect(isolated([batch], overrides)).rejects.toThrow()
    }
  })

  it('rejects a stale chained preimage without changing the sealed terminal', async () => {
    const batches = selected(); const target = batches[0]
    const manifestPath = resolve(actualRoot, target.sourceBeforeAfterPath)
    const value = JSON.parse(readFileSync(manifestPath)); value.sources[0].beforeSha256 = '0'.repeat(64)
    await expect(isolated(batches, new Map([[manifestPath, Buffer.from(JSON.stringify(value))]]))).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects facility inverse tampering even if the independent receipt and packet remain intact', async () => {
    const batch = selected().find(row => row.batchId === 'facility-nongrant-source-228')
    const path = resolve(actualRoot, '.omo/private/seoul-migration/facility-nongrant-implementation-20261015/operations-and-inverse.json')
    const ledger = JSON.parse(readFileSync(path)); ledger.inverse[0].result.value += 'unauthorized'
    await expect(isolated([batch], new Map([[path, Buffer.from(JSON.stringify(ledger))]]))).rejects.toThrow('E_REVIEW_HASH')
  })
})

describe('household source projection successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const selected = () => JSON.parse(readFileSync(registryPath))
  const load = (registry, files = new Map()) => loadAppliedBatches(path => Promise.resolve(files.get(path)
    ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)

  it('binds the historical household batch and projects only the two approved K349/K354 roles', async () => {
    const registry = selected(); const batch = registry.batches.find(row => row.batchId === 'household-known-link-projection-2')
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath)))
    expect(registry.batches).toHaveLength(111)
    expect(digest(Buffer.from(JSON.stringify({ schema: registry.schema, visibility: registry.visibility,
      batches: registry.batches.slice(0, 73) }, null, 2) + '\n'))).toBe(packet.registryPrefix.sha256)
    expect(packet.operations.map(row => row.path)).toEqual(['/people/348/knownLinks/7/role', '/people/353/knownLinks/3/role'])
    expect(packet.scope).toEqual({ sourceProjectionOnly: true, semanticNarrativeApproval: false,
      publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const batches = await load(registry)
    expect(batches.find(row => row.batchId === batch.batchId).sourceBeforeAfter.sources[0].afterSha256).toBe(packet.source.afterSha256)
  })

  it.each(['packet', 'review', 'owner', 'canonical', 'before', 'manifest', 'source', 'prefix', 'person'])
  ('rejects %s tampering even when a registry reference is rehashed', async kind => {
    const registry = selected(); const batch = registry.batches.find(row => row.batchId === 'household-known-link-projection-2')
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath))); const files = new Map()
    const paths = { packet: batch.packetPath, review: batch.applicationReview.evidencePath,
      owner: packet.authority.owner.path, canonical: packet.authority.canonicalSource.path,
      before: packet.source.beforeArchive, manifest: batch.sourceBeforeAfterPath, source: packet.source.path }
    if (paths[kind]) {
      const target = resolve(actualRoot, paths[kind]), changed = Buffer.concat([readFileSync(target), Buffer.from(' ')])
      files.set(target, changed)
      if (kind === 'packet') batch.packetSha256 = digest(changed)
      if (kind === 'review') batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') registry.batches[72].batchId = 'corrupted-code-batch'
    if (kind === 'person') batch.personIds = ['K349']
    await expect(load(registry, files)).rejects.toThrow(/^E_/)
  })

  it('rejects changed neighboring household facts and a role that differs from the canonical relation', async () => {
    const registry = selected(); const batch = registry.batches.find(row => row.batchId === 'household-known-link-projection-2')
    const packetPath = resolve(actualRoot, batch.packetPath), original = JSON.parse(readFileSync(packetPath))
    const canonicalPath = resolve(actualRoot, original.authority.canonicalSource.path)
    for (const kind of ['neighbor', 'role']) {
      const packet = structuredClone(original)
      const value = JSON.parse(readFileSync(canonicalPath))
      if (kind === 'neighbor') value.content[3].rows[312][3].ko += 'tamper'
      else value.content[3].rows[313][3].ko += 'tamper'
      const files = new Map([[canonicalPath, Buffer.from(JSON.stringify(value))]])
      packet.authority.canonicalSource.sha256 = digest(files.get(canonicalPath))
      files.set(packetPath, Buffer.from(JSON.stringify(packet)))
      batch.packetSha256 = digest(files.get(packetPath))
      await expect(load(registry, files)).rejects.toThrow(/^E_/)
    }
  })
})

describe('vassal validator code-only source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const selected = () => JSON.parse(readFileSync(registryPath))
  const load = (registry, files = new Map()) => loadAppliedBatches(path => Promise.resolve(files.get(path)
    ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)

  it('registers a 73rd code-only successor after the exact 72-entry prefix', async () => {
    const registry = selected(); const batch = registry.batches.find(row => row.batchId === 'vassal-validator-code-successor-1')
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath)))
    expect(registry.batches).toHaveLength(111)
    expect(digest(Buffer.from(JSON.stringify({ schema: registry.schema, visibility: registry.visibility,
      batches: registry.batches.slice(0, 72) }, null, 2) + '\n'))).toBe(packet.registryPrefix.sha256)
    expect(packet.scope).toEqual({ codeOnly: true, semanticNarrativeApproval: false,
      publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await load(registry)
    const successor = loaded.find(row => row.batchId === batch.batchId)
    expect(successor.sourceBeforeAfter.sources).toEqual([{
      sourcePath: 'lore/relations/validate.mjs', beforeSha256: packet.source.beforeSha256,
      afterSha256: packet.source.afterSha256, beforeBytes: packet.source.beforeBytes,
      afterBytes: packet.source.afterBytes, changed: true, sealed: false,
    }])
    expect(successor.personIds).toEqual([])
  })

  it.each(['packet', 'report', 'tests', 'owner', 'before', 'after', 'manifest', 'source', 'prefix', 'person'])
  ('rejects %s tampering without weakening the prior validator binding', async kind => {
    const registry = selected(); const batch = registry.batches.find(row => row.batchId === 'vassal-validator-code-successor-1')
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath))); const files = new Map()
    const paths = { packet: batch.packetPath, report: packet.authority.consumerReport.path,
      tests: packet.authority.consumerTests.path, owner: packet.authority.owner.path,
      before: packet.source.beforeArchive, after: packet.source.afterArchive,
      manifest: batch.sourceBeforeAfterPath, source: packet.source.path }
    if (paths[kind]) {
      const target = resolve(actualRoot, paths[kind]); const changed = Buffer.concat([readFileSync(target), Buffer.from(' ')])
      files.set(target, changed)
      if (kind === 'packet') batch.packetSha256 = digest(changed)
      if (kind === 'report') batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') registry.batches[71].batchId = 'corrupted-story-batch'
    if (kind === 'person') batch.personIds = ['K001']
    await expect(load(registry, files)).rejects.toThrow(/^E_/)
  })
})

describe('stable three-source exact repair registration', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const selected = () => JSON.parse(readFileSync(registryPath))
  const load = (registry, files = new Map()) => loadAppliedBatches(path => Promise.resolve(files.get(path)
    ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)

  it('binds the immutable 71-entry prefix, 40 operations and three exact source hashes without publication activation', async () => {
    const registry = selected(); const batch = registry.batches[71]
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath)))
    expect(registry.batches).toHaveLength(111)
    expect(digest(Buffer.from(JSON.stringify({ schema: registry.schema, visibility: registry.visibility,
      batches: registry.batches.slice(0, 71) }, null, 2) + '\n'))).toBe(packet.registryPrefix.sha256)
    expect(packet.documents.map(row => row.operationCount)).toEqual([6, 6, 28])
    expect(packet.scope).toEqual({ publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const batches = await load(registry)
    expect(batches[71].sourceBeforeAfter.sources.map(row => row.afterSha256)).toEqual(packet.documents.map(row => row.afterSha256))
    expect(batches[71].personIds).toEqual([])
  })

  it.each(['packet', 'proposal', 'independent', 'owner', 'boundary', 'archive', 'source', 'manifest', 'prefix', 'person'])
  ('rejects %s tampering, even when the registry reference is rehashed', async kind => {
    const registry = selected(); const batch = registry.batches[71]; const files = new Map()
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath)))
    const paths = { packet: batch.packetPath, proposal: packet.authority.proposal.path,
      independent: packet.authority.independent.path, owner: packet.authority.owner.path,
      boundary: packet.authority.boundary.path, archive: packet.documents[0].archiveBefore,
      source: packet.documents[0].path, manifest: batch.sourceBeforeAfterPath }
    if (paths[kind]) {
      const target = resolve(actualRoot, paths[kind]); const changed = Buffer.concat([readFileSync(target), Buffer.from(' ')])
      files.set(target, changed)
      if (kind === 'packet') batch.packetSha256 = digest(changed)
      if (kind === 'independent') batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') registry.batches[0].batchId = 'altered-prefix'
    if (kind === 'person') batch.personIds = ['K001']
    await expect(load(registry, files)).rejects.toThrow(/^E_/)
  })
})

describe('chronology three-leaf source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const selected = () => JSON.parse(readFileSync(registryPath))
  const load = (registry, files = new Map()) => loadAppliedBatches(path => Promise.resolve(files.get(path)
    ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)

  it('preserves the sealed 68-entry prefix and registers only the exact source successor', async () => {
    const registry = selected()
    expect(registry.batches).toHaveLength(111)
    const prefix = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/chronology-successor-registration-20261015/application-packet.json'))).registryPrefix
    expect(digest(Buffer.from(JSON.stringify({ schema: registry.schema, visibility: registry.visibility,
      batches: registry.batches.slice(0, 68) }, null, 2) + '\n'))).toBe(prefix.sha256)
    const batches = await load(registry)
    expect(batches[68].sourceBeforeAfter.sources[0]).toMatchObject({
      beforeSha256: 'e65c2c10bba711cd9543dd2625c2996ea9bb0c92671e55f0284280aacefd09df',
      afterSha256: 'f0a6e1879ff3ade0c756fc1913d5b2a0457822b6bcb7730231ff0f560eef0801',
    })
    expect(batches[68].personIds).toEqual([])
    expect(batches[68].approvals).toEqual([])
  })

  it.each(['packet', 'receipt', 'independent', 'preimage', 'source', 'prefix', 'person'])('rejects %s tampering', async kind => {
    const registry = selected(); const batch = registry.batches[68]; const files = new Map()
    const paths = { packet: batch.packetPath, receipt: '.omo/private/seoul-migration/timeline-three-remediation-20261015/receipt.json',
      independent: batch.applicationReview.evidencePath,
      preimage: '.omo/private/seoul-migration/timeline-three-remediation-20261015/Century-Annals.before.json',
      source: 'lore/chronology/Century-Annals.json' }
    if (paths[kind]) files.set(resolve(actualRoot, paths[kind]), Buffer.concat([readFileSync(resolve(actualRoot, paths[kind])), Buffer.from(' ')]))
    if (kind === 'packet') batch.packetSha256 = digest(files.get(resolve(actualRoot, paths.packet)))
    if (kind === 'independent') batch.applicationReview.evidenceSha256 = digest(files.get(resolve(actualRoot, paths.independent)))
    if (kind === 'prefix') registry.batches[0].batchId = 'altered-prefix'
    if (kind === 'person') batch.personIds = ['K001']
    await expect(load(registry, files)).rejects.toThrow(/^E_/)
  })
})

describe('typed appointments source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const packetPath = resolve(actualRoot, '.omo/private/seoul-migration/appointments-successor-registration-20261015/application-packet.json')
  const sourcePath = resolve(actualRoot, 'lore/relations/opening-office-appointments.json')
  const selected = () => JSON.parse(readFileSync(registryPath))
  const load = (registry, files = new Map()) => loadAppliedBatches(path => Promise.resolve(files.get(path)
    ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)

  it('authenticates the preserved 69-entry prefix and all 95 typed current rows', async () => {
    const registry = selected(); const packet = JSON.parse(readFileSync(packetPath))
    expect(registry.batches).toHaveLength(111)
    expect(digest(Buffer.from(JSON.stringify({ schema: registry.schema, visibility: registry.visibility,
      batches: registry.batches.slice(0, 69) }, null, 2) + '\n'))).toBe(packet.registryPrefix.sha256)
    const batches = await load(registry)
    expect(batches[69].sourceBeforeAfter.sources[0]).toMatchObject({
      beforeSha256: 'c322e1a00347f737a2a4559a538d97f64c0f5e4786ff7d53a2920e12b389595d',
      afterSha256: '8e01932f68ef017ab4bc455f3f4a2ffdb551c77be6ed37f9879592c9a58eb867',
    })
    expect(batches[69].personIds).toEqual([])
    expect(batches[69].approvals).toEqual([])
  })

  it.each(['packet', 'receipt', 'independent', 'coverage', 'preimage', 'source', 'owner', 'prefix', 'person'])('rejects %s tampering', async kind => {
    const registry = selected(); const batch = registry.batches[69]; const files = new Map()
    const paths = { packet: batch.packetPath,
      receipt: '.omo/private/seoul-migration/appointments-typed-current-20261015/receipt.json',
      independent: batch.applicationReview.evidencePath,
      coverage: '.omo/private/seoul-migration/appointments-typed-current-20261015/coverage.json',
      preimage: '.omo/private/seoul-migration/appointments-typed-current-20261015/before/lore/relations/opening-office-appointments.json',
      source: 'lore/relations/opening-office-appointments.json',
      owner: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md' }
    if (paths[kind]) {
      const path = resolve(actualRoot, paths[kind])
      files.set(path, Buffer.concat([readFileSync(path), Buffer.from(' ')]))
    }
    if (kind === 'packet') batch.packetSha256 = digest(files.get(resolve(actualRoot, paths.packet)))
    if (kind === 'independent') batch.applicationReview.evidenceSha256 = digest(files.get(resolve(actualRoot, paths.independent)))
    if (kind === 'prefix') registry.batches[0].batchId = 'altered-prefix'
    if (kind === 'person') batch.personIds = ['K001']
    await expect(load(registry, files)).rejects.toThrow(/^E_/)
  })

  it('rejects a changed typed status even if current bytes and manifest are rehashed', async () => {
    const registry = selected(); const batch = registry.batches.find(row => row.batchId === 'typed-appointments-source-successor-20261015'); const files = new Map()
    const value = JSON.parse(readFileSync(sourcePath)); value.appointments[0].current.status = 'existing-function'
    const changed = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    files.set(sourcePath, changed)
    const packet = JSON.parse(readFileSync(packetPath)); packet.after.sha256 = digest(changed)
    files.set(packetPath, Buffer.from(JSON.stringify(packet)))
    batch.packetSha256 = digest(files.get(packetPath))
    const manifestPath = resolve(actualRoot, batch.sourceBeforeAfterPath)
    const manifest = JSON.parse(readFileSync(manifestPath)); manifest.sources[0].afterSha256 = digest(changed)
    files.set(manifestPath, Buffer.from(JSON.stringify(manifest)))
    await expect(load(registry, files)).rejects.toThrow(/^E_/)
  })
})

function fixture ({ proposalShaOverride } = {}) {
  rmSync(root, { recursive: true, force: true })
  mkdirSync(root + '/.omo/private/seoul-migration', { recursive: true })
  const proposalPath = resolve(root, '.omo/private/seoul-migration/task-8-batch-proposal-fixture.json')
  writeFileSync(proposalPath, JSON.stringify({ personIds: ['K9999'] }))
  const proposalSha = createHash('sha256').update(readFileSync(proposalPath)).digest('hex')
  const packet = resolve(root, 'packet.json'); writeFileSync(packet, 'p')
  const review = resolve(root, 'review.json'); writeFileSync(review, 'r')
  const registry = {
    schema: 'seoul-applied-batches.v1',
    batches: [{
      batchId: 'fixture', state: 'applied', personIds: ['K9999'],
      approvalModel: 'proposal+style-contract',
      packetPath: 'packet.json', packetSha256: createHash('sha256').update('p').digest('hex'),
      applicationReview: { evidencePath: 'review.json', evidenceSha256: createHash('sha256').update('r').digest('hex') },
      sourceBeforeAfterPath: 'ba.json',
      approvals: [
        { kind: 'batch-allocation', bodySha256: proposalShaOverride ?? proposalSha, messageRef: 'user:2026-10-15' },
        { kind: 'article-style', bodySha256: '86b9a928db0f18fa557e1375962d0e1f1364dd0b99f609572a6847f644162a5c', messageRef: 'question:call_O2vBRaRk6wWpFEElnoh4Tgmg', styleContract: true },
        { kind: 'card-style', bodySha256: '465f9cde88644e349734525550882c89afdc9b448243b6cbf33f6f06de43c54a', messageRef: 'question:call_O2vBRaRk6wWpFEElnoh4Tgmg', styleContract: true }
      ]
    }]
  }
  writeFileSync(resolve(root, '.omo/private/seoul-migration/applied-batches.json'), JSON.stringify(registry))
  writeFileSync(resolve(root, 'ba.json'), JSON.stringify({ sources: [] }))
}

describe('applied-batches two-track approval model', () => {
  it('accepts a valid proposal+style-contract entry', async () => {
    fixture()
    const batches = await loadAppliedBatches(f => Promise.resolve(readFileSync(f)), root)
    expect(batches).toHaveLength(1)
    expect(batches[0].batchId).toBe('fixture')
    rmSync(root, { recursive: true, force: true })
  })
  it('rejects a proposal hash that does not match approved bytes', async () => {
    fixture({ proposalShaOverride: '0'.repeat(64) })
    await expect(loadAppliedBatches(f => Promise.resolve(readFileSync(f)), root)).rejects.toThrow('E_APPROVAL_BATCH')
    rmSync(root, { recursive: true, force: true })
  })
  it('rejects a style reference without styleContract flag', async () => {
    fixture()
    const path = resolve(root, '.omo/private/seoul-migration/applied-batches.json')
    const reg = JSON.parse(readFileSync(path, 'utf8'))
    delete reg.batches[0].approvals[1].styleContract
    writeFileSync(path, JSON.stringify(reg))
    await expect(loadAppliedBatches(f => Promise.resolve(readFileSync(f)), root)).rejects.toThrow('E_APPROVAL_KIND')
    rmSync(root, { recursive: true, force: true })
  })
})

const privateRoot = resolve(import.meta.dirname, '../.omo/private/seoul-migration')
const evidenceStage = '.omo/private/seoul-migration/gurps-rebind-7-applied-staging'
const digest = value => createHash('sha256').update(value).digest('hex')
const at = (value, path) => path.slice(1).split('/').reduce((v, key) => v[key], value)

describe('profile two-reference source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const batch = registry.batches[91]
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch, files, load }
  }

  it('authenticates the exact 91-entry prefix and bounded two-operation source successor', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 91, sha256: digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 91),
    }, null, 2) + '\n')) })
    expect(packet.operationCount).toBe(2)
    expect(packet.scope).toEqual({ privateSourceOnly: true, publicationReview: false,
      semanticNarrativeApproval: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[91].personIds).toEqual([])
    expect(loaded[91].sourceBeforeAfter.source.afterSha256).toBe(packet.source.afterSha256)
  })

  it.each(['packet', 'manifest', 'candidate', 'archive', 'authorization', 'candidate-review', 'applied-audit',
    'source', 'prefix', 'person', 'operation', 'extra-operation', 'live-drift', 'activation'])
  ('rejects %s tampering without activating an entity', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const paths = { packet: f.batch.packetPath, manifest: f.batch.sourceBeforeAfterPath,
      candidate: packet.pins.candidate.path, archive: packet.pins.beforeArchive.path,
      authorization: packet.pins.authorization.path, 'candidate-review': packet.pins.candidateReviewJson.path,
      'applied-audit': packet.pins.appliedAuditJson.path, source: packet.source.sourcePath,
      'live-drift': packet.source.sourcePath }
    if (kind === 'prefix') f.registry.batches[90].operationCount++
    else if (kind === 'person') f.batch.personIds = ['K234']
    else if (kind === 'activation') {
      packet.scope.entityActivationCount = 1
      const bytes = Buffer.from(JSON.stringify(packet))
      f.files.set(resolve(actualRoot, f.batch.packetPath), bytes); f.batch.packetSha256 = digest(bytes)
    } else if (kind === 'operation' || kind === 'extra-operation') {
      const candidate = JSON.parse(readFileSync(resolve(actualRoot, packet.pins.candidate.path)))
      if (kind === 'operation') candidate.operations[0].value += 'unauthorized'
      else candidate.operations.push(structuredClone(candidate.operations[0]))
      f.files.set(resolve(actualRoot, packet.pins.candidate.path), Buffer.from(JSON.stringify(candidate)))
    } else {
      const absolute = resolve(actualRoot, paths[kind])
      const changed = Buffer.concat([readFileSync(absolute), Buffer.from(' ')])
      f.files.set(absolute, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'applied-audit') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('Soul-Assignments evidence rebind source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const batch = registry.batches[97]
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch, files, load }
  }

  it('admits registry98 with the exact registry97 prefix and no person activation', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 97, sha256: digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 97),
    }, null, 2) + '\n')) })
    expect(packet.operationCount).toBe(198)
    expect(packet.scope).toEqual({ privateSourceOnly: true, evidenceQuoteLeavesOnly: true, publicationReview: false,
      semanticNarrativeApproval: false, grantCount: 0, appointmentCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[97].personIds).toEqual([])
    expect(loaded[97].sourceBeforeAfter.sources).toEqual([packet.source])
  })

  it.each(['wrong-prefix', 'archive-drift', 'packet-drift', 'extra-operation', 'live-drift',
    'semantic-assignment-edit', 'person-activation'])('rejects %s without lending source authority', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    if (kind === 'wrong-prefix') f.registry.batches[96].operationCount++
    else if (kind === 'person-activation') f.batch.personIds = ['K1009']
    else if (kind === 'archive-drift') {
      const path = resolve(actualRoot, packet.pins.beforeArchive.path)
      f.files.set(path, Buffer.concat([readFileSync(path), Buffer.from(' ')]))
    } else if (kind === 'packet-drift') {
      const path = resolve(actualRoot, f.batch.packetPath), changed = Buffer.concat([readFileSync(path), Buffer.from(' ')])
      f.files.set(path, changed); f.batch.packetSha256 = digest(changed)
    } else if (kind === 'extra-operation') {
      const path = resolve(actualRoot, packet.pins.operations.path), operations = JSON.parse(readFileSync(path))
      operations.operations.push(structuredClone(operations.operations[0]))
      f.files.set(path, Buffer.from(JSON.stringify(operations)))
    } else {
      const path = resolve(actualRoot, packet.source.sourcePath)
      if (kind === 'live-drift') f.files.set(path, Buffer.concat([readFileSync(path), Buffer.from(' ')]))
      else {
        const source = JSON.parse(readFileSync(path)); source.assignments[1009].narrativeRationale += ' unauthorized semantic edit'
        f.files.set(path, Buffer.from(JSON.stringify(source, null, 2) + '\n'))
      }
    }
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('soul-batches special evidence rebind source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map(), batch = registry.batches[98]
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch, files, load }
  }

  it('admits registry99 with the exact registry98 prefix and no person activation', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 98, sha256: digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 98),
    }, null, 2) + '\n')) })
    expect(packet.operationCount).toBe(16)
    expect(packet.source).toEqual({ sourcePath: 'lore/editorial/soul-batches/special.json',
      beforeSha256: '9037acf1b951d54a4eb6701a822a17a975ad0111312bc0e48a7ab7249f9c3dbb', beforeBytes: 152261,
      afterSha256: 'c6ee0569471f0bca3058391e3c7af2102d543cb25036ea7f8e3bb418aa5aaac6', afterBytes: 153250 })
    expect(packet.scope).toEqual({ privateSourceOnly: true, evidenceQuoteLeavesOnly: true, publicationReview: false,
      semanticNarrativeApproval: false, grantCount: 0, appointmentCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[98].personIds).toEqual([])
    expect(loaded[98].sourceBeforeAfter.sources).toEqual([packet.source])
  })

  it.each(['wrong-prefix', 'archive-drift', 'packet-drift', 'extra-operation', 'live-drift',
    'semantic-assignment-edit', 'person-activation'])('rejects %s without lending source authority', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    if (kind === 'wrong-prefix') f.registry.batches[97].operationCount++
    else if (kind === 'person-activation') f.batch.personIds = ['K1009']
    else if (kind === 'archive-drift') {
      const path = resolve(actualRoot, packet.pins.beforeArchive.path)
      f.files.set(path, Buffer.concat([readFileSync(path), Buffer.from(' ')]))
    } else if (kind === 'packet-drift') {
      const path = resolve(actualRoot, f.batch.packetPath), changed = Buffer.concat([readFileSync(path), Buffer.from(' ')])
      f.files.set(path, changed); f.batch.packetSha256 = digest(changed)
    } else if (kind === 'extra-operation') {
      const path = resolve(actualRoot, packet.pins.operations.path), operations = JSON.parse(readFileSync(path))
      operations.operations.push(structuredClone(operations.operations[0]))
      f.files.set(path, Buffer.from(JSON.stringify(operations)))
    } else {
      const path = resolve(actualRoot, packet.source.sourcePath)
      if (kind === 'live-drift') f.files.set(path, Buffer.concat([readFileSync(path), Buffer.from(' ')]))
      else {
        const source = JSON.parse(readFileSync(path)); source.assignments[26].narrativeRationale += ' unauthorized semantic edit'
        f.files.set(path, Buffer.from(JSON.stringify(source, null, 2) + '\n'))
      }
    }
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S09 v3 reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    return { registry, batch: registry.batches[90], files,
      load: () => loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), actualRoot) }
  }

  it('authenticates the 90-entry prefix and all 617 exact S09 replacements', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 90, sha256: digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 90),
    }, null, 2) + '\n')) })
    expect((await f.load())[90].sourceBeforeAfter.sources).toEqual([packet.source])
    expect(packet.operationCount).toBe(617)
    expect(packet.source.beforeSha256).toBe('74310bfc1bcd09ad8a5263f3506a83d01aed315e24ed0d6c67a7586b87cd14b7')
  })

  it.each(['packet', 'candidate', 'review', 'archive', 'manifest', 'source', 'prefix', 'person', 'duplicate', 'rollback'])
  ('rejects %s tampering before lending the historical S09 preimage', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const path = kind === 'packet' ? f.batch.packetPath : kind === 'candidate' ? packet.pins['candidate.json'].path
      : kind === 'review' ? packet.pins['independent-review.json'].path : kind === 'archive' ? packet.pins.beforeArchive.path
        : kind === 'manifest' ? f.batch.sourceBeforeAfterPath : packet.source.sourcePath
    if (kind === 'prefix') f.registry.batches[89].operationCount++
    else if (kind === 'person') f.batch.personIds = ['K219']
    else if (kind === 'duplicate') f.registry.batches.push(structuredClone(f.batch))
    else {
      const absolute = resolve(actualRoot, path)
      const changed = kind === 'rollback'
        ? gunzipSync(Buffer.from(JSON.parse(readFileSync(resolve(actualRoot, packet.pins.beforeArchive.path))).gzipBase64, 'base64'))
        : Buffer.concat([readFileSync(absolute), Buffer.from(' ')])
      f.files.set(absolute, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    f.files.set(registryPath, Buffer.from(JSON.stringify(f.registry)))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S07 v2 reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    return { registry, batch: registry.batches[89], files,
      load: () => loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), actualRoot) }
  }

  it('authenticates the 89-entry prefix and all 766 exact S07 replacements', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 89, sha256: digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 89),
    }, null, 2) + '\n')) })
    expect((await f.load())[89].sourceBeforeAfter.sources).toEqual([packet.source])
    expect(packet.operationCount).toBe(766)
    expect(packet.source.beforeSha256).toBe('0bc46c00f9b9d92c430372ec23de3ed14b1f7f81822d3f967f93a2f229094474')
  })

  it.each(['packet', 'candidate', 'review', 'archive', 'manifest', 'source', 'prefix', 'person', 'duplicate', 'rollback'])
  ('rejects %s tampering before lending the historical S07 preimage', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const path = kind === 'packet' ? f.batch.packetPath : kind === 'candidate' ? packet.pins['candidate.json'].path
      : kind === 'review' ? packet.pins['independent-review.json'].path : kind === 'archive' ? packet.pins.beforeArchive.path
        : kind === 'manifest' ? f.batch.sourceBeforeAfterPath : packet.source.sourcePath
    if (kind === 'prefix') f.registry.batches[88].operationCount++
    else if (kind === 'person') f.batch.personIds = ['K169']
    else if (kind === 'duplicate') f.registry.batches.push(structuredClone(f.batch))
    else {
      const absolute = resolve(actualRoot, path)
      const changed = kind === 'rollback'
        ? gunzipSync(Buffer.from(JSON.parse(readFileSync(resolve(actualRoot, packet.pins.beforeArchive.path))).gzipBase64, 'base64'))
        : Buffer.concat([readFileSync(absolute), Buffer.from(' ')])
      f.files.set(absolute, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    f.files.set(registryPath, Buffer.from(JSON.stringify(f.registry)))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S08 v2 reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    return { registry, batch: registry.batches[88], files,
      load: () => loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), actualRoot) }
  }

  it('authenticates the 88-entry prefix and 475 exact S08 replacements', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 88, sha256: digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 88),
    }, null, 2) + '\n')) })
    expect((await f.load())[88].sourceBeforeAfter.sources).toEqual([packet.source])
    expect(packet.operationCount).toBe(475)
    expect(packet.source.beforeSha256).toBe('2b286b7f382b57fef344e0bd28d06b75fbfc00d4348e9d3359e81bda08fa61ca')
  })

  it.each(['packet', 'candidate', 'review', 'archive', 'manifest', 'source', 'prefix', 'rollback'])
  ('rejects %s tampering before lending the historical S08 preimage', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const path = kind === 'packet' ? f.batch.packetPath : kind === 'candidate' ? packet.candidate.path
      : kind === 'review' ? packet.independentReview.path : kind === 'archive' ? packet.beforeArchive.path
      : kind === 'manifest' ? f.batch.sourceBeforeAfterPath : packet.source.sourcePath
    if (kind === 'prefix') f.registry.batches[87].operationCount++
    else {
      const absolute = resolve(actualRoot, path)
      const changed = kind === 'rollback'
        ? gunzipSync(Buffer.from(JSON.parse(readFileSync(resolve(actualRoot, packet.beforeArchive.path))).gzipBase64, 'base64'))
        : Buffer.concat([readFileSync(absolute), Buffer.from(' ')])
      f.files.set(absolute, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    f.files.set(registryPath, Buffer.from(JSON.stringify(f.registry)))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S04 v4 reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath))
    const files = new Map()
    return { registry, batch: registry.batches[87], files,
      load: () => loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), actualRoot) }
  }

  it('authenticates the 87-entry prefix and 644 exact S04 edits', async () => {
    const f = fixture()
    const packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix.sha256).toBe(digest(Buffer.from(JSON.stringify({
      schema: f.registry.schema, visibility: f.registry.visibility, batches: f.registry.batches.slice(0, 87),
    }, null, 2) + '\n')))
    expect((await f.load())[87].sourceBeforeAfter.sources).toEqual([packet.source])
    expect(packet.operationCount).toBe(644)
  })

  it.each(['packet', 'candidate', 'review', 'archive', 'manifest', 'source', 'prefix'])
  ('rejects %s tampering even with rehashed registry references', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const path = kind === 'packet' ? f.batch.packetPath : kind === 'candidate' ? packet.candidate.path
      : kind === 'review' ? packet.independentReview.path : kind === 'archive' ? packet.beforeArchive.path
      : kind === 'manifest' ? f.batch.sourceBeforeAfterPath : 'lore/characters/Cast-State-04.json'
    if (kind === 'prefix') f.registry.batches[86].operationCount++
    else {
      const absolute = resolve(actualRoot, path)
      const changed = Buffer.concat([readFileSync(absolute), Buffer.from(' ')])
      f.files.set(absolute, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    f.files.set(registryPath, Buffer.from(JSON.stringify(f.registry)))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('Atlas 83 exact four-track source application', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const batchId = 'atlas83-four-track-source-application-334'
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath))
    const files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), actualRoot)
    return { registry, batch: registry.batches[82], files, load }
  }
  it('authenticates the exact 82-entry prefix and 334-operation source successor', async () => {
    const f = fixture()
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[82].batchId).toBe(batchId)
    expect(loaded[82].personIds).toEqual([])
    const packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(loaded[82].sourceBeforeAfter.sources[0].afterSha256).toBe(packet.sources[0].afterSha256)
  })
  it('rejects rehashed packet, stale source and tampered independent inputs or archive', async () => {
    for (const kind of ['packet', 'source', 'archive', 'proposal', 'review', 'bindings', 'owner', 'prefix']) {
      const f = fixture()
      const packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
      const pin = kind === 'proposal' ? packet.proposal : kind === 'review' ? packet.independent
        : kind === 'bindings' ? packet.bindings : kind === 'owner' ? packet.owner : null
      const path = kind === 'packet' ? f.batch.packetPath : kind === 'source' ? 'lore/World-Narrative-Atlas.json'
        : kind === 'archive' ? packet.beforeArchive.path : pin?.path
      if (kind === 'prefix') {
        f.registry.batches[81].operationCount++
        f.files.set(registryPath, Buffer.from(JSON.stringify(f.registry)))
      } else {
        const absolute = resolve(actualRoot, path)
        if (kind === 'packet') {
          packet.operations.replacements--
          const bytes = Buffer.from(JSON.stringify(packet))
          f.files.set(absolute, bytes)
          f.batch.packetSha256 = digest(bytes)
          f.files.set(registryPath, Buffer.from(JSON.stringify(f.registry)))
        } else f.files.set(absolute, Buffer.concat([readFileSync(absolute), Buffer.from(' ')]))
      }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('S11 exact reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[92], files, load }
  }

  it('retains the exact registry93 S11 successor without activating entities', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 92,
      sha256: digest(Buffer.from(JSON.stringify({ ...f.registry, batches: f.registry.batches.slice(0, 92) }, null, 2) + '\n')) })
    expect(packet.source.beforeSha256).toBe('0ce113f2cba969f47bc5e70d6e25b7b1e8fe3d05b7abe832285e4e0f2fa3dbe9')
    expect(packet.source.afterSha256).toBe('c49f05f15da3e64d9242e473db5cd6fd3136d6b92d41216e37ca4923e9159099')
    expect(packet.operationCount).toBe(476)
    expect(packet.scope.personIds).toEqual([])
    expect(packet.scope.entityActivationCount).toBe(0)
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[92].personIds).toEqual([])
    expect(loaded[92].sourceBeforeAfter.sources).toEqual([packet.source])
  })

  it.each(['prefix', 'archive', 'packet', 'extra operation', 'live drift', 'person'])
  ('rejects %s tampering', async kind => {
    const f = fixture(), packetPath = resolve(actualRoot, f.batch.packetPath)
    const packet = JSON.parse(readFileSync(packetPath))
    if (kind === 'prefix') f.registry.batches[91].operationCount++
    if (kind === 'archive') f.files.set(resolve(actualRoot, packet.pins.beforeArchive.path),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.pins.beforeArchive.path)), Buffer.from(' ')]))
    if (kind === 'packet') {
      const changed = Buffer.concat([readFileSync(packetPath), Buffer.from(' ')])
      f.files.set(packetPath, changed); f.batch.packetSha256 = digest(changed)
    }
    if (kind === 'extra operation') {
      const candidatePath = resolve(actualRoot, packet.pins.candidate.path)
      const candidate = JSON.parse(readFileSync(candidatePath))
      candidate.operations.push(structuredClone(candidate.operations[0]))
      f.files.set(candidatePath, Buffer.from(JSON.stringify(candidate)))
    }
    if (kind === 'live drift') f.files.set(resolve(actualRoot, packet.source.sourcePath),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.source.sourcePath)), Buffer.from(' ')]))
    if (kind === 'person') f.batch.personIds = ['K271']
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S10 exact reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[93], files, load }
  }

  it('admits the exact registry94 S10 successor without activating entities', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 93,
      sha256: digest(Buffer.from(JSON.stringify({ ...f.registry, batches: f.registry.batches.slice(0, 93) }, null, 2) + '\n')) })
    expect(packet.source.beforeSha256).toBe('b4694e6f1e33adff1c1a0689a092aae7e82e904a79f2e7fbbe743f8d50051502')
    expect(packet.source.afterSha256).toBe('3c48806bbbf11efd9434b780fb0b337c57d7f50de8ca1588a02a5f03d90f616e')
    expect(packet.operationCount).toBe(900)
    expect(packet.scope.personIds).toEqual([])
    expect(packet.scope.entityActivationCount).toBe(0)
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[93].personIds).toEqual([])
    expect(loaded[93].sourceBeforeAfter.sources).toEqual([packet.source])
  })

  it.each(['prefix', 'archive', 'packet', 'extra operation', 'live drift', 'person'])
  ('rejects %s tampering', async kind => {
    const f = fixture(), packetPath = resolve(actualRoot, f.batch.packetPath)
    const packet = JSON.parse(readFileSync(packetPath))
    if (kind === 'prefix') f.registry.batches[92].operationCount++
    if (kind === 'archive') f.files.set(resolve(actualRoot, packet.pins.beforeArchive.path),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.pins.beforeArchive.path)), Buffer.from(' ')]))
    if (kind === 'packet') {
      const changed = Buffer.concat([readFileSync(packetPath), Buffer.from(' ')])
      f.files.set(packetPath, changed); f.batch.packetSha256 = digest(changed)
    }
    if (kind === 'extra operation') {
      const operationsPath = resolve(actualRoot,
        '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/operations.json')
      const operations = JSON.parse(readFileSync(operationsPath))
      operations.operations.push(structuredClone(operations.operations[0]))
      f.files.set(operationsPath, Buffer.from(JSON.stringify(operations)))
    }
    if (kind === 'live drift') f.files.set(resolve(actualRoot, packet.source.sourcePath),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.source.sourcePath)), Buffer.from(' ')]))
    if (kind === 'person') f.batch.personIds = ['K245']
    await expect(f.load()).rejects.toThrow(/^E_/)
  })

})

describe('S13 exact reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[94], files, load }
  }

  it('admits the exact registry95 S13 successor without activating entities', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 94, sha256: '46362c91fc6356bdf709735ef912794ff86f256ac0ef490fbbf82c4bb9e6035d' })
    expect(packet.source.beforeSha256).toBe('3ad14dc5568713d7cf35e4f43a2e1b85aaab6094f4ce835501dc9bf9f58681df')
    expect(packet.source.afterSha256).toBe('8ef3cb0d386b5c9e3523e305e3a934cf1a45aed93edfcdf7425c2892c46a5ad7')
    expect(packet.operationCount).toBe(925)
    expect(packet.scope.personIds).toEqual([])
    expect(packet.scope.entityActivationCount).toBe(0)
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[94].personIds).toEqual([])
    expect(loaded[94].sourceBeforeAfter.sources).toEqual([packet.source])
  })

  it.each(['prefix', 'archive', 'packet', 'extra operation', 'live drift', 'person'])
  ('rejects %s tampering', async kind => {
    const f = fixture(), packetPath = resolve(actualRoot, f.batch.packetPath)
    const packet = JSON.parse(readFileSync(packetPath))
    if (kind === 'prefix') f.registry.batches[93].operationCount++
    if (kind === 'archive') f.files.set(resolve(actualRoot, packet.pins.beforeArchive.path),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.pins.beforeArchive.path)), Buffer.from(' ')]))
    if (kind === 'packet') {
      const changed = Buffer.concat([readFileSync(packetPath), Buffer.from(' ')])
      f.files.set(packetPath, changed); f.batch.packetSha256 = digest(changed)
    }
    if (kind === 'extra operation') {
      const operationsPath = resolve(actualRoot,
        '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/operations.json')
      const operations = JSON.parse(readFileSync(operationsPath))
      operations.operations.push(structuredClone(operations.operations[0]))
      f.files.set(operationsPath, Buffer.from(JSON.stringify(operations)))
    }
    if (kind === 'live drift') f.files.set(resolve(actualRoot, packet.source.sourcePath),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.source.sourcePath)), Buffer.from(' ')]))
    if (kind === 'person') f.batch.personIds = ['K345']
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S12 exact reviewed source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[95], files, load }
  }

  it('admits the exact registry96 S12 successor without activating entities', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 95, sha256: 'a617170fb943619a095387382b6187383954513be88a6854813edce41ad5600a' })
    expect(packet.source.beforeSha256).toBe('603bb697e7c1f0f39cb66af5678faf16195e3e7a597f62e37f6590b14bd97e39')
    expect(packet.source.afterSha256).toBe('7b0135b25b4bee46bf224fb148477cf46d2379baa8575a5c9fcb99c1a912959b')
    expect(packet.operationCount).toBe(928)
    expect(packet.scope.personIds).toEqual([])
    expect(packet.scope.entityActivationCount).toBe(0)
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[95].personIds).toEqual([])
    expect(loaded[95].sourceBeforeAfter.sources).toEqual([packet.source])
  })

  it.each(['prefix', 'archive', 'packet', 'extra operation', 'live drift', 'person'])
  ('rejects %s tampering', async kind => {
    const f = fixture(), packetPath = resolve(actualRoot, f.batch.packetPath)
    const packet = JSON.parse(readFileSync(packetPath))
    if (kind === 'prefix') f.registry.batches[94].operationCount++
    if (kind === 'archive') f.files.set(resolve(actualRoot, packet.pins.beforeArchive.path),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.pins.beforeArchive.path)), Buffer.from(' ')]))
    if (kind === 'packet') {
      const changed = Buffer.concat([readFileSync(packetPath), Buffer.from(' ')])
      f.files.set(packetPath, changed); f.batch.packetSha256 = digest(changed)
    }
    if (kind === 'extra operation') {
      const operationsPath = resolve(actualRoot, packet.pins.operations.path)
      const operations = JSON.parse(readFileSync(operationsPath))
      operations.operations.push(structuredClone(operations.operations[0]))
      f.files.set(operationsPath, Buffer.from(JSON.stringify(operations)))
    }
    if (kind === 'live drift') f.files.set(resolve(actualRoot, packet.source.sourcePath),
      Buffer.concat([readFileSync(resolve(actualRoot, packet.source.sourcePath)), Buffer.from(' ')]))
    if (kind === 'person') f.batch.personIds = ['K311']
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S14 exact dual-source reviewed successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[96], files, load }
  }

  it('admits the exact registry97 dual-source successor without activating entities', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 96, sha256: '7d93aacab4c03e7cc0c86d083851706878ca3f5daec95fe6df99a699cc498c93' })
    expect(packet.operationCount).toBe(682)
    expect(packet.sources.map(row => row.afterSha256)).toEqual([
      'ee13436646edfee5c522bb709914090bf10cdb142635e333fe30465c4d276686',
      '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96',
    ])
    expect(packet.scope).toEqual({ personIds: [], privateSourceOnly: true,
      coreSealedPersonIds: ['K1006', 'K1009', 'K1010'], nonS14CoreBlocksPreserved: 146,
      publicationReview: false, semanticNarrativeApproval: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[96].personIds).toEqual([])
    expect(loaded[96].sourceBeforeAfter.sources).toEqual(packet.sources)
  })

  it.each(['prefix', 'cast archive', 'core archive', 'packet', 'extra operation', 'cast live drift',
    'core live drift', 'non-S14 Core mutation', 'person'])('rejects %s tampering', async kind => {
    const f = fixture(), packetPath = resolve(actualRoot, f.batch.packetPath)
    const packet = JSON.parse(readFileSync(packetPath))
    if (kind === 'prefix') f.registry.batches[95].operationCount++
    const archivePin = kind === 'cast archive' ? packet.pins.castBeforeArchive
      : kind === 'core archive' ? packet.pins.coreBeforeArchive : null
    if (archivePin) f.files.set(resolve(actualRoot, archivePin.path),
      Buffer.concat([readFileSync(resolve(actualRoot, archivePin.path)), Buffer.from(' ')]))
    if (kind === 'packet') {
      const changed = Buffer.concat([readFileSync(packetPath), Buffer.from(' ')])
      f.files.set(packetPath, changed); f.batch.packetSha256 = digest(changed)
    }
    if (kind === 'extra operation') {
      const operationsPath = resolve(actualRoot, packet.pins.operations.path)
      const operations = JSON.parse(readFileSync(operationsPath))
      operations.operations.push(structuredClone(operations.operations[0]))
      f.files.set(operationsPath, Buffer.from(JSON.stringify(operations)))
    }
    if (kind === 'cast live drift' || kind === 'core live drift') {
      const source = packet.sources[kind === 'cast live drift' ? 0 : 1]
      f.files.set(resolve(actualRoot, source.sourcePath),
        Buffer.concat([readFileSync(resolve(actualRoot, source.sourcePath)), Buffer.from(' ')]))
    }
    if (kind === 'non-S14 Core mutation') {
      const source = packet.sources[1], value = JSON.parse(readFileSync(resolve(actualRoot, source.sourcePath)))
      value.content[0].text.ko += ' 변조'
      f.files.set(resolve(actualRoot, source.sourcePath), Buffer.from(JSON.stringify(value, null, 2) + '\n'))
    }
    if (kind === 'person') f.batch.personIds = ['K1006']
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('renderer heading exact technical successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const directory = '.omo/private/seoul-migration/renderer-heading-successor-20261016/'
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = async () => {
      if (registry.batches.length !== 83) return loadAppliedBatches(path => Promise.resolve(files.get(path)
        ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
      let predecessor = await stationCatalogPredecessorReader(actualRoot)
      predecessor = await reviewWordingPredecessorReader(actualRoot, predecessor)
      predecessor = await k176PredecessorReader(actualRoot, predecessor)
      const reader = async path => files.get(path)
        ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : predecessor(path))
      reader.currentAuthorityReader = predecessor
      return loadAppliedBatches(reader, actualRoot)
    }
    return { registry, batch: registry.batches[83], files, load }
  }

  it('preserves exact prefix83 and replays historical BA code while authenticating the live successor', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const prefixBytes = readFileSync(resolve(actualRoot, directory + 'registry-prefix83.json'))
    expect(digest(prefixBytes)).toBe('c2efd8bafb63f21f7a3b0c5191bbad68adf5e7129caa7ee31ecf019104c8ec9c')
    expect(JSON.parse(prefixBytes).batches).toEqual(f.registry.batches.slice(0, 83))
    expect(packet.scope).toEqual({ codeOnly: true, semanticNarrativeApproval: false,
      publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[83].batchId).toBe('renderer-heading-code-successor-1')
    expect(loaded[83].sourceBeforeAfter.sources).toEqual([packet.source])
    // The unregistered successor is forbidden; historical BA remains valid on the exact old prefix.
    f.registry.batches.length = 83
    const s05ArchiveBytes = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s05-v2-reviewed-source-application-20261016/before-raw.json'))
    expect(digest(s05ArchiveBytes)).toBe('4cf4fa474c9ef7cbadfb7137d510fa5946bca44e329c8cf71273da62d249d35d')
    const s05Archive = JSON.parse(s05ArchiveBytes)
    const s05Before = gunzipSync(Buffer.from(s05Archive.gzipBase64, 'base64'))
    expect(digest(s05Before)).toBe('e2532372318333bff855686e7691f2e2f85f3f6c6c95d05d2942c080eef94c79')
    f.files.set(resolve(actualRoot, s05Archive.sourcePath), s05Before)
    const styleArchive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/style-v4-two-samples-source-application-20261016/before-raw.json')))
    for (const source of styleArchive.sources) {
      f.files.set(resolve(actualRoot, source.sourcePath), gunzipSync(Buffer.from(source.gzipBase64, 'base64')))
    }
    const s06Archive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/before-raw.json')))
    expect(digest(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/before-raw.json')))).toBe(
      '36c62344750b24756fe48f1a4fcab7726819ae9c2a8f7a12df40105b589eda16')
    f.files.set(resolve(actualRoot, s06Archive.sourcePath), gunzipSync(Buffer.from(s06Archive.gzipBase64, 'base64')))
    const s04Archive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s04-v4-reviewed-source-application-20261016/before-raw.json'))).sources[0]
    f.files.set(resolve(actualRoot, s04Archive.sourcePath), gunzipSync(Buffer.from(s04Archive.gzipBase64, 'base64')))
    const s08Archive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s08-v2-reviewed-source-application-20261016/before-raw.json')))
    f.files.set(resolve(actualRoot, s08Archive.sourcePath), gunzipSync(Buffer.from(s08Archive.gzipBase64, 'base64')))
    const s07ArchiveBytes = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s07-v2-reviewed-source-application-20261016/before-raw.json'))
    expect(digest(s07ArchiveBytes)).toBe('6d8c08a40e3231707a24cd81aca6fd05d04fd5001b4c4c712d4947dfea321d6d')
    const s07Archive = JSON.parse(s07ArchiveBytes)
    const s07Before = gunzipSync(Buffer.from(s07Archive.gzipBase64, 'base64'))
    expect(digest(s07Before)).toBe('0bc46c00f9b9d92c430372ec23de3ed14b1f7f81822d3f967f93a2f229094474')
    f.files.set(resolve(actualRoot, s07Archive.sourcePath), s07Before)
    const s09Archive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s09-v3-reviewed-source-application-20261016/before-raw.json')))
    const s09Before = gunzipSync(Buffer.from(s09Archive.gzipBase64, 'base64'))
    expect(digest(s09Before)).toBe('74310bfc1bcd09ad8a5263f3506a83d01aed315e24ed0d6c67a7586b87cd14b7')
    f.files.set(resolve(actualRoot, s09Archive.sourcePath), s09Before)
    const profileTwoArchive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/profile-two-reference-repair-candidate-20261016/before-raw.json')))
    const profileTwoBefore = gunzipSync(Buffer.from(profileTwoArchive.gzipBase64, 'base64'))
    expect(digest(profileTwoBefore)).toBe('ca60ec59a3ca4d6aebcdb04953b2c109b5a07bf59a1d393d8652fe10f0ead111')
    expect(profileTwoBefore).toHaveLength(1212167)
    f.files.set(resolve(actualRoot, profileTwoArchive.sourcePath), profileTwoBefore)
    const s11Before = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
    expect(digest(s11Before)).toBe('0ce113f2cba969f47bc5e70d6e25b7b1e8fe3d05b7abe832285e4e0f2fa3dbe9')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-11.json'), s11Before)
    const s10Before = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
    expect(digest(s10Before)).toBe('b4694e6f1e33adff1c1a0689a092aae7e82e904a79f2e7fbbe743f8d50051502')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-10.json'), s10Before)
    const s13Before = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
    expect(digest(s13Before)).toBe('3ad14dc5568713d7cf35e4f43a2e1b85aaab6094f4ce835501dc9bf9f58681df')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-13.json'), s13Before)
    const s12Before = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
    expect(digest(s12Before)).toBe('603bb697e7c1f0f39cb66af5678faf16195e3e7a597f62e37f6590b14bd97e39')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-12.json'), s12Before)
    const s14CastBefore = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
    expect(digest(s14CastBefore)).toBe('e460476ea290655c345a6908e565406898d1f1f11ec76a43caa200572aa8b34a')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-14.json'), s14CastBefore)
    const s14CoreBefore = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/core-source-before.json'))
    expect(digest(s14CoreBefore)).toBe('586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46')
    f.files.set(resolve(actualRoot, 'lore/characters/Core-Characters.json'), s14CoreBefore)
    const soulAssignmentsBeforeArchive = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/Soul-Assignments.before.json.gz.b64'))
    expect(digest(soulAssignmentsBeforeArchive)).toBe('aaf18b2d64edb26fed8dbf9ee2933bf5f2652801ff315dd07cf760529b949afd')
    const soulAssignmentsBefore = gunzipSync(Buffer.from(soulAssignmentsBeforeArchive.toString().replace(/\s/g, ''), 'base64'))
    expect(digest(soulAssignmentsBefore)).toBe('f0a1e5073356a46081fc89604a108d9d9ec51e9b243099aac1a1fe0698a43b7d')
    f.files.set(resolve(actualRoot, 'lore/editorial/Soul-Assignments.json'), soulAssignmentsBefore)
    const s15Before = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s15-reviewed-fullbody-prose-candidate-20261017/source-before.json'))
    expect(digest(s15Before)).toBe('72e93e4adc9e933106aa9f368f8a64948659afdfbf6726875f117f68a573e14f')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-15.json'), s15Before)
    const s16Before = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s16-unaffiliated-candidate-20261017/source-before.json'))
    expect(digest(s16Before)).toBe('1836f518ef8a84f23231ef932022090a6960977b035f550703b7c2e2364992a7')
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-State-16.json'), s16Before)
    const terminal = JSON.parse(readFileSync(registryPath))
    const post108 = terminal.batches[108]
    const post108Bytes = readFileSync(resolve(actualRoot, post108.packetPath))
    expect(digest(post108Bytes)).toBe(post108.packetSha256)
    for (const source of JSON.parse(post108Bytes).documents) {
      const before = readFileSync(resolve(actualRoot, source.archiveBefore))
      expect(digest(before)).toBe(source.beforeSha256)
      if (!f.files.has(resolve(actualRoot, source.sourcePath))) f.files.set(resolve(actualRoot, source.sourcePath), before)
    }
    const statusPacket = readFileSync(resolve(actualRoot, terminal.batches[70].packetPath))
    expect(digest(statusPacket)).toBe('aee00b8081fc727921ba72fb23246a3672f1cd7337a8ab940e704d6fbb765186')
    for (const source of JSON.parse(statusPacket).sources) {
      const after = gunzipSync(Buffer.from(source.afterGzipBase64, 'base64'))
      expect(digest(after)).toBe(source.afterSha256)
      f.files.set(resolve(actualRoot, source.sourcePath), after)
    }
    const publicationPacketBytes = readFileSync(resolve(actualRoot, terminal.batches[75].packetPath))
    expect(digest(publicationPacketBytes)).toBe('8c0b0e271b464c8ffa508565362840e75a0d5b56fb1e4cac6299de30bbc3f86c')
    const publicationPacket = JSON.parse(publicationPacketBytes)
    const publicationProofs = {}
    for (const key of ['proposal', 'correction']) {
      const ref = publicationPacket.authority[key], raw = readFileSync(resolve(actualRoot, ref.path))
      expect(digest(raw)).toBe(ref.sha256)
      publicationProofs[key] = JSON.parse(raw)
    }
    for (const source of publicationPacket.documents) {
      const value = JSON.parse(publicationProofs.proposal.documents.find(row => row.sourcePath === source.path).after.rawUtf8)
      for (const operation of publicationProofs.correction.operations.filter(row => row.sourcePath === source.path)) {
        const parts = operation.pointer.slice(1).split('/'), key = parts.pop()
        const parent = parts.reduce((node, part) => node[part], value)
        expect(parent[key]).toEqual(operation.before)
        parent[key] = operation.after
      }
      const after = Buffer.from(JSON.stringify(value, null, 2) + '\n')
      expect(digest(after)).toBe(source.afterSha256)
      f.files.set(resolve(actualRoot, source.path), after)
    }
    const stableRef = JSON.parse(readFileSync(resolve(actualRoot, terminal.batches[71].packetPath))).authority.proposal
    const stableBytes = readFileSync(resolve(actualRoot, stableRef.path))
    expect(digest(stableBytes)).toBe('a23dcf4d039dff878cc99b27fee3fa8dcd71cdf78cece8960d9f135f57e2f963')
    const mapSource = JSON.parse(stableBytes).documents.find(row => row.path === 'lore/places/World-Map-Construction.json')
    const mapAfter = gunzipSync(Buffer.from(mapSource.fullRawAfterGzipBase64, 'base64'))
    expect(digest(mapAfter)).toBe(mapSource.afterRawSha256)
    f.files.set(resolve(actualRoot, mapSource.path), mapAfter)
    const retrofitBeforeBytes = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/office-retrofit-candidate-20261017/source-before.json'))
    const diasporaBefore = JSON.parse(retrofitBeforeBytes).files.find(row => row.path === 'lore/factions/Diaspora-Corridors.json')
    const diasporaAfter = gunzipSync(Buffer.from(diasporaBefore.gzipBase64, 'base64'))
    expect(digest(diasporaAfter)).toBe('b2378f2b7324ba1502627c65d85a9f59bd6ddf8ed381d50425642eeb0ea2370d')
    f.files.set(resolve(actualRoot, diasporaBefore.path), diasporaAfter)
    const atlasPacket = JSON.parse(readFileSync(resolve(actualRoot, terminal.batches[82].packetPath)))
    const atlasArchiveBytes = readFileSync(resolve(actualRoot, atlasPacket.beforeArchive.path))
    expect(digest(atlasArchiveBytes)).toBe(atlasPacket.beforeArchive.sha256)
    const atlasArchive = JSON.parse(atlasArchiveBytes)
    const atlas = JSON.parse(gunzipSync(Buffer.from(atlasArchive.gzipBase64, 'base64')))
    const atlasProposalBytes = readFileSync(resolve(actualRoot, atlasPacket.proposal.path))
    expect(digest(atlasProposalBytes)).toBe(atlasPacket.proposal.sha256)
    const atlasProposal = JSON.parse(atlasProposalBytes)
    for (const operation of atlasProposal.operations) {
      const parts = operation.pointer.slice(1).split('/'), key = parts.pop()
      parts.reduce((node, part) => node[part], atlas)[key] = operation.after
    }
    for (const removal of atlasProposal.relationRemovals) atlas.data.atlas.relations.splice(removal.index, 1)
    const atlasAfter = Buffer.from(JSON.stringify(atlas, null, 2) + '\n')
    expect(digest(atlasAfter)).toBe(atlasPacket.sources[0].afterSha256)
    f.files.set(resolve(actualRoot, atlasPacket.sources[0].sourcePath), atlasAfter)
    const schema = JSON.parse(readFileSync(resolve(actualRoot, atlasPacket.atlasSchema.path)))
    const theater = schema.$defs.theater
    theater.required.splice(theater.required.indexOf('states') + 1, 0, 'japan_bridge_removable')
    for (const key of ['record_status', 'current_operational_claim', 'projection_display_name', 'historical_display_name']) delete theater.properties[key]
    theater.properties.japan_bridge_removable = { type: 'boolean' }
    schema.$defs.atlas.required.splice(schema.$defs.atlas.required.indexOf('houses') + 1, 0, 'theaters')
    delete schema.$defs.atlas.properties.theaters.description
    delete schema.$defs.relation.properties.endpoint_display
    const schemaBefore = Buffer.from(JSON.stringify(schema, null, 2) + '\n')
    expect(digest(schemaBefore)).toBe(atlasPacket.atlasSchema.sha256)
    f.files.set(resolve(actualRoot, atlasPacket.atlasSchema.path), schemaBefore)
    for (const pin of [atlasPacket.inputPins, atlasPacket.beforeArchive, atlasPacket.proposal, atlasPacket.independent,
      atlasPacket.bindings, atlasPacket.owner, atlasPacket.atlasSchema])
      expect(digest(f.files.get(resolve(actualRoot, pin.path)) ?? readFileSync(resolve(actualRoot, pin.path))), pin.path).toBe(pin.sha256)
    await expect(f.load()).rejects.toMatchObject({ code: 'E_REVIEW_HASH',
      path: '/applied/atlas82/binding', id: 'scripts/world-atlas-render.mjs' })
    const archive = JSON.parse(readFileSync(resolve(actualRoot, packet.archives.before.path)))
    f.files.set(resolve(actualRoot, packet.source.sourcePath), gunzipSync(Buffer.from(archive.gzipBase64, 'base64')))
    expect(digest(f.files.get(resolve(actualRoot, atlasPacket.renderer.path)))).toBe(atlasPacket.renderer.sha256)
    const terminalHashes = new Map()
    for (const batch of f.registry.batches) {
      const manifest = JSON.parse(readFileSync(resolve(actualRoot, batch.sourceBeforeAfterPath)))
      for (const source of manifest.sources ?? []) if (source.beforeSha256 !== source.afterSha256) {
        if (source.operation === 'replace-source') terminalHashes.delete(source.sourcePath)
        terminalHashes.set(source.replacementPath ?? source.sourcePath, { hash: source.afterSha256, batchId: batch.batchId })
      }
    }
    const combinedRoot = '.omo/private/seoul-migration/combined-evidence-rebind-candidate-20261017/'
    const combinedManifest = JSON.parse(readFileSync(resolve(actualRoot, combinedRoot + 'source-before-after.json')))
    for (const source of combinedManifest.sources) {
      const expected = terminalHashes.get(source.consumerFile)
      const before = readFileSync(resolve(actualRoot, combinedRoot + source.beforePath))
      if (expected?.hash === digest(before)) f.files.set(resolve(actualRoot, source.consumerFile), before)
    }
    const unaffiliatedBefore = readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/s16-unaffiliated-candidate-20261017/unaffiliated-source-before.json'))
    expect(digest(unaffiliatedBefore)).toBe(terminalHashes.get('lore/characters/Cast-Unaffiliated.json').hash)
    f.files.set(resolve(actualRoot, 'lore/characters/Cast-Unaffiliated.json'), unaffiliatedBefore)
    const specialArchive = JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/before-raw.json')))
    const specialBefore = Buffer.from(specialArchive.rawBase64, 'base64')
    expect(digest(specialBefore)).toBe(terminalHashes.get('lore/editorial/soul-batches/special.json').hash)
    f.files.set(resolve(actualRoot, 'lore/editorial/soul-batches/special.json'), specialBefore)
    const finalSnapshots = new Map()
    for (const batch of f.registry.batches) {
      const packetBytes = readFileSync(resolve(actualRoot, batch.packetPath))
      expect(digest(packetBytes)).toBe(batch.packetSha256)
      const application = JSON.parse(packetBytes)
      if (application.registrar) {
        const raw = readFileSync(resolve(actualRoot, application.registrar.path))
        expect(digest(raw)).toBe(application.registrar.sha256)
        for (const source of JSON.parse(raw).sources ?? []) if (source.afterRawGzipBase64)
          finalSnapshots.set(source.path + '@' + source.afterSha256, gunzipSync(Buffer.from(source.afterRawGzipBase64, 'base64')))
      }
      for (const source of application.sources ?? []) if (source.afterGzipBase64)
        finalSnapshots.set(source.sourcePath + '@' + source.afterSha256, gunzipSync(Buffer.from(source.afterGzipBase64, 'base64')))
    }
    const externalPath = 'lore/factions/External-Theaters.json'
    const externalBefore = (await import('node:child_process')).execFileSync('git', ['-C', actualRoot, 'show', `e9c12a43728a599c371d373088e177a446ff5051:${externalPath}`])
    expect(digest(externalBefore)).toBe('85502259693e436ff38abec65fb98034a0533c6279dfed75475ae8f785da0e39')
    const external = JSON.parse(externalBefore)
    const daejeon = JSON.parse(readFileSync(resolve(actualRoot, terminal.batches.find(row => row.batchId === 'daejeon-four').packetPath)))
    for (const operation of daejeon.operations.filter(row => row.file === externalPath)) {
      const parts = operation.path.slice(1).split('/'), key = parts.pop()
      const parent = parts.reduce((node, part) => node[part], external)
      expect(parent[key]).toEqual(operation.oldValue)
      parent[key] = operation.value
    }
    finalSnapshots.set(externalPath + '@' + terminalHashes.get(externalPath).hash, Buffer.from(JSON.stringify(external, null, 2) + '\n'))
    for (const [sourcePath, expected] of terminalHashes) {
      const snapshot = finalSnapshots.get(sourcePath + '@' + expected.hash)
      if (snapshot) { expect(digest(snapshot)).toBe(expected.hash); f.files.set(resolve(actualRoot, sourcePath), snapshot) }
    }
    expect(await f.load()).toHaveLength(83)
  })

  it.each(['packet', 'manifest', 'comparison', 'owner', 'tests', 'schema', 'source', 'before', 'after', 'prefix-archive',
    'prefix', 'person', 'position', 'duplicate', 'rollback'])('rejects %s tampering before historical substitution', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const paths = { packet: f.batch.packetPath, manifest: f.batch.sourceBeforeAfterPath,
      comparison: packet.authority.comparison.path, owner: packet.authority.owner.path,
      tests: packet.authority.consumerTests.path, schema: packet.inputs.rendererSchema.path,
      source: packet.inputs.atlas.path, before: packet.archives.before.path, after: packet.archives.after.path,
      'prefix-archive': packet.registryPrefix.archive.path }
    if (paths[kind]) {
      const path = resolve(actualRoot, paths[kind]), changed = Buffer.concat([readFileSync(path), Buffer.from(' ')])
      f.files.set(path, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'comparison') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') f.registry.batches[82].operationCount++
    if (kind === 'person') f.batch.personIds = ['K001']
    if (kind === 'position') [f.registry.batches[82], f.registry.batches[83]] = [f.registry.batches[83], f.registry.batches[82]]
    if (kind === 'duplicate') f.registry.batches.push(structuredClone(f.batch))
    if (kind === 'rollback') {
      const archive = JSON.parse(readFileSync(resolve(actualRoot, packet.archives.before.path)))
      f.files.set(resolve(actualRoot, packet.source.sourcePath), gunzipSync(Buffer.from(archive.gzipBase64, 'base64')))
    }
    await expect(f.load()).rejects.toThrow(/^E_/)
  })

  it('rejects changed live code even with intact historical archive and receipts', async () => {
    const f = fixture(), path = resolve(actualRoot, 'scripts/world-atlas-render.mjs')
    f.files.set(path, Buffer.concat([readFileSync(path), Buffer.from('\n// unauthorized\n')]))
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })
})

describe('style v4 exact two-sample source application', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[84], files, load }
  }

  it('authenticates the 84-entry prefix and only the 19 approved KO leaves', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 84,
      sha256: digest(Buffer.from(JSON.stringify({ ...f.registry, batches: f.registry.batches.slice(0, 84) }, null, 2) + '\n')) })
    expect(packet.operationCount).toBe(19)
    expect(packet.scope).toEqual({ privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded[84].personIds).toEqual([])
    expect(loaded[84].sourceBeforeAfter.sources.map(row => row.afterSha256)).toEqual(packet.sources.map(row => row.afterSha256))
  })

  it.each(['packet', 'source', 'archive', 'operations', 'review', 'owner', 'manifest', 'prefix', 'person', 'duplicate'])
  ('rejects %s tampering even if the registry reference is rewritten', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const paths = { packet: f.batch.packetPath, source: packet.sources[0].sourcePath,
      archive: packet.beforeArchive.path, operations: packet.candidate[0].path,
      review: packet.candidate[1].path, owner: packet.owner.path, manifest: f.batch.sourceBeforeAfterPath }
    if (paths[kind]) {
      const path = resolve(actualRoot, paths[kind]), changed = Buffer.concat([readFileSync(path), Buffer.from(' ')])
      f.files.set(path, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') f.registry.batches[83].operationCount++
    if (kind === 'person') f.batch.personIds = ['K001']
    if (kind === 'duplicate') f.registry.batches.push(structuredClone(f.batch))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S06 v2 exact reviewed source application', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[85], files, load }
  }
  it('authenticates prefix 85 and the exact 932-operation S06 successor', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 85,
      sha256: digest(Buffer.from(JSON.stringify({ ...f.registry, batches: f.registry.batches.slice(0, 85) }, null, 2) + '\n')) })
    expect(packet.scope).toEqual({ privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[85].personIds).toEqual([])
    expect(loaded[85].operationCount).toBe(932)
    expect(loaded[85].sourceBeforeAfter.sources).toEqual([packet.source])
  })
  it.each(['packet', 'source', 'archive', 'candidate', 'review', 'owner', 'manifest', 'prefix', 'person', 'duplicate', 'rollback'])
  ('rejects %s tampering before lending the historical preimage', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const paths = { packet: f.batch.packetPath, source: packet.source.sourcePath,
      archive: packet.beforeArchive.path, candidate: packet.candidate.path,
      review: packet.independentReview.path, owner: packet.owner.path, manifest: f.batch.sourceBeforeAfterPath }
    if (paths[kind]) {
      const path = resolve(actualRoot, paths[kind]), changed = Buffer.concat([readFileSync(path), Buffer.from(' ')])
      f.files.set(path, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') f.registry.batches[84].operationCount++
    if (kind === 'person') f.batch.personIds = ['K144']
    if (kind === 'duplicate') f.registry.batches.push(structuredClone(f.batch))
    if (kind === 'rollback') {
      const archive = JSON.parse(readFileSync(resolve(actualRoot, packet.beforeArchive.path)))
      f.files.set(resolve(actualRoot, packet.source.sourcePath), gunzipSync(Buffer.from(archive.gzipBase64, 'base64')))
    }
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

describe('S05 v2 exact reviewed source application', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const fixture = () => {
    const registry = JSON.parse(readFileSync(registryPath)), files = new Map()
    const load = () => loadAppliedBatches(path => Promise.resolve(files.get(path)
      ?? (path === registryPath ? Buffer.from(JSON.stringify(registry)) : readFileSync(path))), actualRoot)
    return { registry, batch: registry.batches[86], files, load }
  }
  it('authenticates prefix 86 and the exact 931-operation S05 successor', async () => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    expect(f.registry.batches).toHaveLength(111)
    expect(packet.registryPrefix).toEqual({ count: 86,
      sha256: digest(Buffer.from(JSON.stringify({ ...f.registry, batches: f.registry.batches.slice(0, 86) }, null, 2) + '\n')) })
    expect(packet.scope).toEqual({ privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    const loaded = await f.load()
    expect(loaded).toHaveLength(111)
    expect(loaded[86].personIds).toEqual([])
    expect(loaded[86].operationCount).toBe(931)
    expect(loaded[86].sourceBeforeAfter.sources).toEqual([packet.source])
  })
  it.each(['packet', 'source', 'archive', 'candidate', 'review', 'owner', 'manifest', 'prefix', 'person', 'duplicate', 'rollback'])
  ('rejects %s tampering before lending the historical preimage', async kind => {
    const f = fixture(), packet = JSON.parse(readFileSync(resolve(actualRoot, f.batch.packetPath)))
    const paths = { packet: f.batch.packetPath, source: packet.source.sourcePath,
      archive: packet.beforeArchive.path, candidate: packet.candidate.path,
      review: packet.independentReview.path, owner: packet.owner.path, manifest: f.batch.sourceBeforeAfterPath }
    if (paths[kind]) {
      const path = resolve(actualRoot, paths[kind]), changed = Buffer.concat([readFileSync(path), Buffer.from(' ')])
      f.files.set(path, changed)
      if (kind === 'packet') f.batch.packetSha256 = digest(changed)
      if (kind === 'review') f.batch.applicationReview.evidenceSha256 = digest(changed)
    }
    if (kind === 'prefix') f.registry.batches[84].operationCount++
    if (kind === 'person') f.batch.personIds = ['K115']
    if (kind === 'duplicate') f.registry.batches.push(structuredClone(f.batch))
    if (kind === 'rollback') {
      const archive = JSON.parse(readFileSync(resolve(actualRoot, packet.beforeArchive.path)))
      f.files.set(resolve(actualRoot, packet.source.sourcePath), gunzipSync(Buffer.from(archive.gzipBase64, 'base64')))
    }
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
})

// Isolated historical registrations must see their own sealed after bytes, not
// the live successor of the same source. Explicit tampering overrides still win.
async function loadHistoricalFixture(actualRoot, batches, files) {
  const finalHashes = new Map()
  for (const batch of batches) {
    if (!batch.approvalModel) continue
    const manifest = JSON.parse(readFileSync(resolve(actualRoot, batch.sourceBeforeAfterPath)))
    for (const row of manifest.sources) if (row.changed) finalHashes.set(resolve(actualRoot, row.sourcePath), row.afterSha256)
  }
  for (const [path, expected] of finalHashes) if (files.has(path) && digest(files.get(path)) !== expected)
    throw Object.assign(new Error('E_REVIEW_HASH'), { path })
  const authority = async path => files.get(resolve(path)) ?? readFileSync(path)
  let predecessor = await stationCatalogPredecessorReader(actualRoot, authority)
  predecessor = await reviewWordingPredecessorReader(actualRoot, predecessor)
  predecessor = await k176PredecessorReader(actualRoot, predecessor)
  const historical = historicalFixtureBytes(actualRoot, batches, files)
  const reader = async path => {
    const projected = historical(path)
    if (files.has(resolve(path))) return projected
    return digest(projected) === digest(readFileSync(path)) ? predecessor(path) : projected
  }
  reader.currentAuthorityReader = predecessor
  return loadAppliedBatches(reader, actualRoot)
}

function historicalFixtureBytes(actualRoot, batches, files) {
  const snapshots = new Map(); const final = new Map()
  for (const batch of batches) {
    // A synthetic predecessor supplies its own manifest and has no sealed packet.
    if (!batch.approvalModel) continue
    const manifest = JSON.parse(readFileSync(resolve(actualRoot, batch.sourceBeforeAfterPath)))
    for (const row of manifest.sources) if (row.changed) final.set(row.sourcePath, row.afterSha256)
    const packet = JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath)))
    const sourceRows = packet.sources ?? (batch.approvalModel?.startsWith('owner-recommendations-')
      ? JSON.parse(readFileSync(resolve(actualRoot, packet.registrar.path))).sources.map(row => ({
        sourcePath: row.path, afterSha256: row.afterSha256, afterGzipBase64: row.afterRawGzipBase64 }))
      : ['offices-v2-source-31', 'facility-nongrant-source-228'].includes(batch.approvalModel) ? [] : batch.approvalModel === 'wildlife-source-authoring'
      ? [{ sourcePath: 'lore/World-Narrative-Atlas.json', afterSha256: manifest.sources[0].afterSha256,
        afterGzipBase64: JSON.parse(readFileSync(resolve(actualRoot, '.omo/private/seoul-migration/task-10-wildlife-census-path-correction-applied.json'))).replayBytes.censusAfterGzipBase64 }]
      : JSON.parse(readFileSync(resolve(actualRoot, batch.packetPath.replace('application-packet.json', 'snapshots.json')))).sources)
    for (const row of sourceRows) if (row.afterGzipBase64)
      snapshots.set(`${row.sourcePath}@${row.afterSha256}`, gunzipSync(Buffer.from(row.afterGzipBase64, 'base64')))
  }
  // The Atlas 83 archive seals the immediate predecessor's exact after bytes.
  const atlas83Archive = JSON.parse(readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/atlas83-four-track-source-application-20261016/before-raw.json')))
  snapshots.set(`${atlas83Archive.sourcePath}@${atlas83Archive.rawSha256}`,
    gunzipSync(Buffer.from(atlas83Archive.gzipBase64, 'base64')))
  const s06Archive = JSON.parse(readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/before-raw.json')))
  expect(digest(readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/before-raw.json')))).toBe(
    '36c62344750b24756fe48f1a4fcab7726819ae9c2a8f7a12df40105b589eda16')
  snapshots.set(`${s06Archive.sourcePath}@${s06Archive.rawSha256}`,
    gunzipSync(Buffer.from(s06Archive.gzipBase64, 'base64')))
  const s05ArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s05-v2-reviewed-source-application-20261016/before-raw.json'))
  expect(digest(s05ArchiveBytes)).toBe('4cf4fa474c9ef7cbadfb7137d510fa5946bca44e329c8cf71273da62d249d35d')
  const s05Archive = JSON.parse(s05ArchiveBytes)
  const s05Before = gunzipSync(Buffer.from(s05Archive.gzipBase64, 'base64'))
  expect(digest(s05Before)).toBe('e2532372318333bff855686e7691f2e2f85f3f6c6c95d05d2942c080eef94c79')
  snapshots.set(`${s05Archive.sourcePath}@${s05Archive.rawSha256}`, s05Before)
  const s04ArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s04-v4-reviewed-source-application-20261016/before-raw.json'))
  expect(digest(s04ArchiveBytes)).toBe('eca62f0e3e1c2f7dd971ec5d4b677fa5b7a08af2ae7d64b45eebb27b5b079edb')
  const s04Archive = JSON.parse(s04ArchiveBytes).sources[0]
  const s04Before = gunzipSync(Buffer.from(s04Archive.gzipBase64, 'base64'))
  expect(digest(s04Before)).toBe('7df8c18be866c99943ed272cd0f7ee3f7c63e732f75cbe8980e1a2817f7f4521')
  snapshots.set(`${s04Archive.sourcePath}@${s04Archive.rawSha256}`, s04Before)
  const s08ArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s08-v2-reviewed-source-application-20261016/before-raw.json'))
  expect(digest(s08ArchiveBytes)).toBe('96f31fd34a832116a1f13ea8bb73fc7a0bc66c92449f5e88050bb5683892b9b0')
  const s08Archive = JSON.parse(s08ArchiveBytes)
  const s08Before = gunzipSync(Buffer.from(s08Archive.gzipBase64, 'base64'))
  expect(digest(s08Before)).toBe('2b286b7f382b57fef344e0bd28d06b75fbfc00d4348e9d3359e81bda08fa61ca')
  snapshots.set(`${s08Archive.sourcePath}@${s08Archive.rawSha256}`, s08Before)
  const s07ArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s07-v2-reviewed-source-application-20261016/before-raw.json'))
  expect(digest(s07ArchiveBytes)).toBe('6d8c08a40e3231707a24cd81aca6fd05d04fd5001b4c4c712d4947dfea321d6d')
  const s07Archive = JSON.parse(s07ArchiveBytes)
  const s07Before = gunzipSync(Buffer.from(s07Archive.gzipBase64, 'base64'))
  expect(digest(s07Before)).toBe('0bc46c00f9b9d92c430372ec23de3ed14b1f7f81822d3f967f93a2f229094474')
  snapshots.set(`${s07Archive.sourcePath}@${s07Archive.rawSha256}`, s07Before)
  const s09ArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s09-v3-reviewed-source-application-20261016/before-raw.json'))
  expect(digest(s09ArchiveBytes)).toBe('51a806ae1b9c5d267c12c73a7f63e1b5872d60191b455f84d597c98a6965ab92')
  const s09Archive = JSON.parse(s09ArchiveBytes)
  const s09Before = gunzipSync(Buffer.from(s09Archive.gzipBase64, 'base64'))
  expect(digest(s09Before)).toBe('74310bfc1bcd09ad8a5263f3506a83d01aed315e24ed0d6c67a7586b87cd14b7')
  snapshots.set(`${s09Archive.sourcePath}@${s09Archive.rawSha256}`, s09Before)
  const s11Before = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
  expect(digest(s11Before)).toBe('0ce113f2cba969f47bc5e70d6e25b7b1e8fe3d05b7abe832285e4e0f2fa3dbe9')
  snapshots.set(`lore/characters/Cast-State-11.json@0ce113f2cba969f47bc5e70d6e25b7b1e8fe3d05b7abe832285e4e0f2fa3dbe9`, s11Before)
  const s12Before = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
  expect(digest(s12Before)).toBe('603bb697e7c1f0f39cb66af5678faf16195e3e7a597f62e37f6590b14bd97e39')
  snapshots.set(`lore/characters/Cast-State-12.json@603bb697e7c1f0f39cb66af5678faf16195e3e7a597f62e37f6590b14bd97e39`, s12Before)
  const s14CastBefore = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
  expect(digest(s14CastBefore)).toBe('e460476ea290655c345a6908e565406898d1f1f11ec76a43caa200572aa8b34a')
  snapshots.set(`lore/characters/Cast-State-14.json@e460476ea290655c345a6908e565406898d1f1f11ec76a43caa200572aa8b34a`, s14CastBefore)
  const s14CoreBefore = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/core-source-before.json'))
  expect(digest(s14CoreBefore)).toBe('586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46')
  snapshots.set(`lore/characters/Core-Characters.json@586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46`, s14CoreBefore)
  const soulAssignmentsArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/Soul-Assignments.before.json.gz.b64'))
  expect(digest(soulAssignmentsArchiveBytes)).toBe('aaf18b2d64edb26fed8dbf9ee2933bf5f2652801ff315dd07cf760529b949afd')
  const soulAssignmentsBefore = gunzipSync(Buffer.from(soulAssignmentsArchiveBytes.toString().replace(/\s/g, ''), 'base64'))
  expect(digest(soulAssignmentsBefore)).toBe('f0a1e5073356a46081fc89604a108d9d9ec51e9b243099aac1a1fe0698a43b7d')
  snapshots.set(`lore/editorial/Soul-Assignments.json@f0a1e5073356a46081fc89604a108d9d9ec51e9b243099aac1a1fe0698a43b7d`, soulAssignmentsBefore)
  const soulBatchesSpecialArchiveBytes = readFileSync(resolve(actualRoot,
    '.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/before-raw.json'))
  expect(digest(soulBatchesSpecialArchiveBytes)).toBe('96552ca5a3e522fde568693a62f44c3451970233acc57232c328f71b385bb115')
  const soulBatchesSpecialArchive = JSON.parse(soulBatchesSpecialArchiveBytes)
  const soulBatchesSpecialBefore = Buffer.from(soulBatchesSpecialArchive.rawBase64, 'base64')
  expect(digest(soulBatchesSpecialBefore)).toBe('9037acf1b951d54a4eb6701a822a17a975ad0111312bc0e48a7ab7249f9c3dbb')
  snapshots.set(`lore/editorial/soul-batches/special.json@9037acf1b951d54a4eb6701a822a17a975ad0111312bc0e48a7ab7249f9c3dbb`, soulBatchesSpecialBefore)
  return path => {
    const absolute = resolve(actualRoot, path)
    if (files.has(absolute)) return files.get(absolute)
    const live = readFileSync(absolute)
    const sourcePath = relative(actualRoot, absolute)
    const expected = final.get(sourcePath)
    if (!expected && sourcePath === 'lore/characters/Cast-State-14.json'
      && digest(live) === 'ee13436646edfee5c522bb709914090bf10cdb142635e333fe30465c4d276686') return s14CastBefore
    if (!expected && sourcePath === 'lore/characters/Core-Characters.json'
      && ['8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96',
        '911c7f9ca1a24d1c803a4c952ff972cc0482be74d6f277419b14734512e56dc4'].includes(digest(live))) return s14CoreBefore
    if (!expected && sourcePath === 'lore/editorial/Soul-Assignments.json'
      && digest(live) === 'e56e9b40c1b22ec75f41f4ce5cb7495e280d074ad8429a693b45f89149969387') return soulAssignmentsBefore
    if (!expected && sourcePath === 'lore/editorial/soul-batches/special.json'
      && digest(live) === 'c6ee0569471f0bca3058391e3c7af2102d543cb25036ea7f8e3bb418aa5aaac6') return soulBatchesSpecialBefore
    if (!expected || digest(live) === expected) return live
    const snapshot = snapshots.get(`${sourcePath}@${expected}`)
      ?? (sourcePath === 'lore/offices/Offices-and-Ranks.json'
        ? Buffer.from(JSON.stringify(materializeOfficesPredecessor(JSON.parse(live)), null, 2) + '\n') : undefined)
    expect(snapshot, `missing approved historical snapshot for ${sourcePath}@${expected}`).toBeDefined()
    expect(digest(snapshot)).toBe(expected)
    return snapshot
  }
}

function evidenceFixture () {
  const packet = JSON.parse(readFileSync(resolve(privateRoot, 'gurps-rebind-7-applied-staging/packet.json')))
  const manifest = JSON.parse(readFileSync(resolve(privateRoot, 'gurps-rebind-7-applied-staging/source-before-after.json')))
  const batch = JSON.parse(readFileSync(resolve(privateRoot, 'gurps-rebind-7-applied-staging/registry-entry.json')))
  const files = new Map()
  const bytes = path => {
    const absolute = resolve(root, path)
    if (files.has(absolute)) return files.get(absolute)
    const sourcePath = relative(root, absolute)
    if (['lore/places/test-station-alias-candidates.mjs', 'lore/relations/validate.mjs',
      'lore/name-pools/issue-person-ids.mjs', 'lore/name-pools/verify-person-id-candidates.mjs',
      'lore/name-pools/verify-person-id-registry.mjs'].includes(sourcePath))
      throw Object.assign(new Error('synthetic fixture has no technical successor'), { code: 'ENOENT' })
    return readFileSync(resolve(import.meta.dirname, '..', sourcePath))
  }
  const before = JSON.parse(gunzipSync(Buffer.from(bytes(packet.beforeSnapshotPath).toString(), 'base64')))
  for (const op of packet.operations) Object.assign(at(before, op.path), op.value)
  files.set(resolve(root, packet.sourcePath), Buffer.from(JSON.stringify(before, null, 2) + '\n'))
  files.set(resolve(root, packet.targetPath), gunzipSync(Buffer.from(bytes(packet.targetSnapshotPath).toString(), 'base64')))
  const load = ({ packetHash = null, preceding = [] } = {}) => {
    const packetBytes = Buffer.from(JSON.stringify(packet))
    batch.packetSha256 = packetHash ?? digest(packetBytes)
    files.set(resolve(root, batch.packetPath), packetBytes)
    files.set(resolve(root, batch.sourceBeforeAfterPath), Buffer.from(JSON.stringify(manifest)))
    files.set(resolve(root, '.omo/private/seoul-migration/applied-batches.json'), Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', batches: [...preceding, batch] })))
    return loadAppliedBatches(path => Promise.resolve(bytes(path)), root)
  }
  return { packet, manifest, batch, files, bytes, load }
}

describe('owner-bound evidence-only approval', () => {
  it('accepts the exact seven approved operations without allocation or style grants', async () => {
    const f = evidenceFixture()
    const [batch] = await f.load()
    expect(batch.personIds).toEqual([])
    expect(batch.approvals.map(a => a.kind)).toEqual(['evidence-rebinding'])
    expect(batch.sourceBeforeAfter.sources).toHaveLength(1)
  })

  it.each([
    ['source', f => { f.packet.sourcePath = 'lore/name-pools/values-cast.json' }],
    ['operation path', f => { f.packet.operations[0].path = '/people/1002/role/evidence/0' }],
    ['target path', f => { f.packet.operations[0].value.path = 'lore/characters/Other.json' }],
    ['target pointer', f => { f.packet.operations[0].value.pointer = '/content/13/items/8/ko' }],
    ['quote value', f => { f.packet.operations[0].value.quote += 'x' }],
    ['extra operation', f => { f.packet.operations.push(f.packet.operations[0]) }],
    ['allocation promotion', f => { f.batch.personIds = ['K1004'] }],
    ['owner binding', f => { f.batch.approvals[0].messageRef = 'unapproved' }],
    ['approval hash', f => { f.batch.approvals[0].bodySha256 = '0'.repeat(64) }],
    ['manifest source', f => { f.manifest.sources[0].sourcePath = 'lore/name-pools/values-cast.json' }],
    ['manifest before hash', f => { f.manifest.sources[0].beforeSha256 = '0'.repeat(64) }],
    ['manifest after hash', f => { f.manifest.sources[0].afterSha256 = '0'.repeat(64) }],
  ])('rejects unauthorized %s even with a recomputed packet hash', async (_label, mutate) => {
    const f = evidenceFixture(); mutate(f)
    await expect(f.load()).rejects.toThrow(/^E_/)
  })

  it('rejects tampered owner receipt bytes', async () => {
    const f = evidenceFixture()
    f.files.set(resolve(root, '.omo/private/seoul-migration/owner-approvals-20261015.json'), Buffer.from('{}'))
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it('rejects a packet whose bytes do not match the registry hash', async () => {
    await expect(evidenceFixture().load({ packetHash: '0'.repeat(64) })).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it('rejects a changed target source', async () => {
    const f = evidenceFixture()
    f.files.set(resolve(root, f.packet.targetPath), Buffer.from('{}'))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })

  it.each([true, false])('enforces changed-source chain continuity: valid=%s', async valid => {
    const f = evidenceFixture()
    const prior = structuredClone(f.batch)
    prior.batchId = 'prior-allocation'
    delete prior.approvalModel
    prior.packetPath = 'prior-packet'; prior.packetSha256 = digest('prior')
    prior.sourceBeforeAfterPath = 'prior-manifest'
    prior.personIds = ['K1004']
    prior.approvals = ['batch-allocation', 'article-style', 'card-style'].map(kind => ({ kind, bodySha256: digest(kind), messageRef: 'prior-owner' }))
    f.files.set(resolve(root, prior.packetPath), Buffer.from('prior'))
    f.files.set(resolve(root, prior.sourceBeforeAfterPath), Buffer.from(JSON.stringify({ sources: [{
      sourcePath: f.packet.sourcePath, beforeSha256: '1'.repeat(64), afterSha256: valid ? f.packet.sourceBeforeSha256 : '2'.repeat(64)
    }] })))
    if (!valid) await expect(f.load({ preceding: [prior] })).rejects.toThrow('E_MANIFEST_CHAIN')
    else {
      const batches = await f.load({ preceding: [prior] })
      expect(batches.filter(b => b.personIds.includes('K1004')).map(b => b.batchId)).toEqual(['prior-allocation'])
      expect(batches[1].sourceBeforeAfter.sources[0].afterSha256).toBe(f.packet.sourceAfterSha256)
    }
  })

  it('rejects altered snapshot numbers even when a new after hash is declared', async () => {
    const f = evidenceFixture()
    const before = JSON.parse(gunzipSync(Buffer.from(f.bytes(f.packet.beforeSnapshotPath).toString(), 'base64')))
    before.people[1003].attributes.IQ.value += 1
    f.files.set(resolve(root, f.packet.beforeSnapshotPath), Buffer.from(gzipSync(JSON.stringify(before, null, 2) + '\n').toString('base64')))
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it.each([
    ['number', value => { value.people[1003].attributes.IQ.value += 1 }],
    ['other person', value => { value.people[0].name += 'x' }],
  ])('rejects a changed %s on disk with an updated manifest', async (_label, mutate) => {
    const f = evidenceFixture()
    const value = JSON.parse(f.bytes(f.packet.sourcePath)); mutate(value)
    const changed = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    f.files.set(resolve(root, f.packet.sourcePath), changed)
    f.packet.sourceAfterSha256 = digest(changed)
    f.manifest.sources[0].afterSha256 = digest(changed)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })
})

function sourceRepairFixture () {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
  for (const id of ['profile-seoul-fact-repair-438', 'component-1-english-parity-repair-3']) if (!registry.batches.some(b => b.batchId === id))
    registry.batches.push(JSON.parse(readFileSync(resolve(privateRoot, 'source-repair-registration-20261015', id, 'registry-entry.json'))))
  const files = new Map()
  const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
  const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
  const load = () => {
    setJSON(registryPath, registry)
    return loadAppliedBatches(path => Promise.resolve(bytes(path)), actualRoot)
  }
  return { registry, files, bytes, setJSON, load, profile: registry.batches.find(b => b.approvalModel === 'current-profile-fact-repair'), translation: registry.batches.find(b => b.approvalModel === 'approved-translation-parity') }
}

describe('closed source-only factual and translation repairs', () => {
  it('accepts both exact repairs in order without changing person admission', async () => {
    const f = sourceRepairFixture()
    const batches = await f.load()
    expect(batches).toHaveLength(f.registry.batches.length)
    const repairs = batches.filter(b => ['current-profile-fact-repair', 'approved-translation-parity'].includes(b.approvalModel))
    expect(repairs.map(b => b.personIds)).toEqual([[], []])
    expect(repairs.map(b => b.sourceBeforeAfter.sources.length)).toEqual([4, 1])
  })

  it.each(['profile', 'translation'])('rejects %s payload mutation with a recalculated hash', async kind => {
    const f = sourceRepairFixture(); const batch = f[kind]
    const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value += 'x'
    f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it.each(['profile', 'translation'])('rejects %s source substitution and person promotion', async kind => {
    const f = sourceRepairFixture(); f[kind].personIds = ['K1013']
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
    // Check the repair's own admission guard as well as the successor's sealed prefix.
    f.registry.batches = [f[kind]]
    await expect(f.load()).rejects.toThrow('E_APPROVAL_KIND')
  })

  it('requires profile evidence before its EN-only successor', async () => {
    const f = sourceRepairFixture()
    const p = f.registry.batches.indexOf(f.profile); const t = f.registry.batches.indexOf(f.translation)
    f.registry.batches = f.registry.batches.slice(0, Math.max(p, t) + 1)
    const s05ArchiveBytes = readFileSync(resolve(resolve(import.meta.dirname, '..'),
      '.omo/private/seoul-migration/s05-v2-reviewed-source-application-20261016/before-raw.json'))
    expect(digest(s05ArchiveBytes)).toBe('4cf4fa474c9ef7cbadfb7137d510fa5946bca44e329c8cf71273da62d249d35d')
    const s05Archive = JSON.parse(s05ArchiveBytes)
    const s05Before = gunzipSync(Buffer.from(s05Archive.gzipBase64, 'base64'))
    expect(digest(s05Before)).toBe('e2532372318333bff855686e7691f2e2f85f3f6c6c95d05d2942c080eef94c79')
    f.files.set(resolve(import.meta.dirname, '..', s05Archive.sourcePath), s05Before)
    const evidence = f.registry.batches.find(batch => batch.approvalModel === 'evidence-rebinding')
    const packet = JSON.parse(f.bytes(evidence.packetPath))
    const target = gunzipSync(Buffer.from(f.bytes(packet.targetSnapshotPath).toString(), 'base64'))
    expect(digest(target)).toBe(packet.targetSha256)
    f.files.set(resolve(import.meta.dirname, '..', packet.targetPath), target)
    const s06Archive = JSON.parse(readFileSync(resolve(import.meta.dirname, '..',
      '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/before-raw.json')))
    expect(digest(readFileSync(resolve(import.meta.dirname, '..',
      '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/before-raw.json')))).toBe(
      '36c62344750b24756fe48f1a4fcab7726819ae9c2a8f7a12df40105b589eda16')
    f.files.set(resolve(import.meta.dirname, '..', s06Archive.sourcePath), gunzipSync(Buffer.from(s06Archive.gzipBase64, 'base64')))
    const s04ArchiveBytes = readFileSync(resolve(import.meta.dirname, '..',
      '.omo/private/seoul-migration/s04-v4-reviewed-source-application-20261016/before-raw.json'))
    expect(digest(s04ArchiveBytes)).toBe('eca62f0e3e1c2f7dd971ec5d4b677fa5b7a08af2ae7d64b45eebb27b5b079edb')
    const s04Archive = JSON.parse(s04ArchiveBytes).sources[0]
    const s04Before = gunzipSync(Buffer.from(s04Archive.gzipBase64, 'base64'))
    expect(digest(s04Before)).toBe('7df8c18be866c99943ed272cd0f7ee3f7c63e732f75cbe8980e1a2817f7f4521')
    f.files.set(resolve(import.meta.dirname, '..', s04Archive.sourcePath), s04Before)
    const s08ArchiveBytes = readFileSync(resolve(import.meta.dirname, '..',
      '.omo/private/seoul-migration/s08-v2-reviewed-source-application-20261016/before-raw.json'))
    expect(digest(s08ArchiveBytes)).toBe('96f31fd34a832116a1f13ea8bb73fc7a0bc66c92449f5e88050bb5683892b9b0')
    const s08Archive = JSON.parse(s08ArchiveBytes)
    const s08Before = gunzipSync(Buffer.from(s08Archive.gzipBase64, 'base64'))
    expect(digest(s08Before)).toBe('2b286b7f382b57fef344e0bd28d06b75fbfc00d4348e9d3359e81bda08fa61ca')
    f.files.set(resolve(import.meta.dirname, '..', s08Archive.sourcePath), s08Before)
    const s07ArchiveBytes = readFileSync(resolve(import.meta.dirname, '..',
      '.omo/private/seoul-migration/s07-v2-reviewed-source-application-20261016/before-raw.json'))
    expect(digest(s07ArchiveBytes)).toBe('6d8c08a40e3231707a24cd81aca6fd05d04fd5001b4c4c712d4947dfea321d6d')
    const s07Archive = JSON.parse(s07ArchiveBytes)
    const s07Before = gunzipSync(Buffer.from(s07Archive.gzipBase64, 'base64'))
    expect(digest(s07Before)).toBe('0bc46c00f9b9d92c430372ec23de3ed14b1f7f81822d3f967f93a2f229094474')
    f.files.set(resolve(import.meta.dirname, '..', s07Archive.sourcePath), s07Before)
    const s10Before = readFileSync(resolve(import.meta.dirname, '..',
      '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/source-before.json'))
    expect(digest(s10Before)).toBe('b4694e6f1e33adff1c1a0689a092aae7e82e904a79f2e7fbbe743f8d50051502')
    f.files.set(resolve(import.meta.dirname, '..', 'lore/characters/Cast-State-10.json'), s10Before)
    ;[f.registry.batches[p], f.registry.batches[t]] = [f.translation, f.profile]
    await expect(f.load()).rejects.toThrow(/^E_/)
  })

  it('rejects a missing prior factual approval', async () => {
    const f = sourceRepairFixture(); f.registry.batches = f.registry.batches.filter(b => b.batchId !== 'component-1')
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it.each(['profile', 'translation'])('rejects %s manifest hash substitution', async kind => {
    const f = sourceRepairFixture(); const batch = f[kind]
    const manifest = JSON.parse(f.bytes(batch.sourceBeforeAfterPath)); manifest.sources[0].afterSha256 = '0'.repeat(64)
    f.setJSON(batch.sourceBeforeAfterPath, manifest)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it.each(['identity', 'number', 'skills', 'effects', 'health', 'souls'])('rejects altered profile %s on actual disk', async field => {
    const f = sourceRepairFixture(); const path = 'lore/editorial/profile-batches/state-05-06.json'
    const source = JSON.parse(f.bytes(path)); const p = source.profiles[7]
    if (field === 'identity') p.personId = 'K1004'
    else if (field === 'number') p.abilities.leadership.base += 1
    else if (field === 'effects') p.traits[0].effects = [{ ability: 'leadership', value: 1 }]
    else p[field] = null
    f.setJSON(path, source)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects a KO mutation beneath the EN-only repair', async () => {
    const f = sourceRepairFixture(); const path = 'lore/factions/Diaspora-Corridors.json'
    const value = JSON.parse(f.bytes(path)); value.content[12].items[15].ko += 'x'
    f.setJSON(path, value)
    await expect(f.load()).rejects.toMatchObject({ code: 'E_REVIEW_HASH',
      path: '/applied/office-rank-retrofit/source', id: path })
  })
})

function boundedFixture (models = ['exact-source-coordinate-repair', 'semantic-evidence-reconciliation', 'outside-current-retirement', 'birthday-issuance-rebind']) {
  const actualRoot = resolve(import.meta.dirname, '..')
  const directory = '.omo/private/seoul-migration/bounded-source-registration-20261015'
  const batches = models.map(model => JSON.parse(readFileSync(model === 'wildlife-source-authoring'
    ? resolve(privateRoot, 'wildlife-census-registration-20261015/registry-entry.json')
    : resolve(actualRoot, directory, model, 'registry-entry.json'))))
  const files = new Map()
  const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
  const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
  const load = () => {
    setJSON('.omo/private/seoul-migration/applied-batches.json', { schema: 'seoul-applied-batches.v1', batches })
    const historical = historicalFixtureBytes(actualRoot, batches, files)
    return loadHistoricalFixture(actualRoot, batches, files)
  }
  return { actualRoot, directory, batches, files, bytes, setJSON, load }
}

describe('bounded follow-up source registrations', () => {
  it('validates actual coordinate, semantic and retirement sources without unrelated rights reads', async () => {
    const f = boundedFixture(); const batches = await f.load()
    expect(batches).toHaveLength(4)
    expect(batches.every(b => b.personIds.length === 0)).toBe(true)
    expect(batches[1].sourceBeforeAfter.sources.find(r => r.sourcePath.endsWith('cast-birthdays.json')).changed).toBe(false)
  })

  it('admits corrective census bytes and explicit bibliography creation', async () => {
    const f = boundedFixture(['wildlife-source-authoring'])
    const packet = JSON.parse(f.bytes('.omo/private/seoul-migration/task-10-wildlife-census-path-correction-applied.json'))
    f.files.set(resolve(f.actualRoot, 'lore/Research-Sources.md'), Buffer.from(packet.replayBytes.bibliographyUtf8))
    const [batch] = await f.load()
    expect(batch.sourceBeforeAfter.sources[1]).toMatchObject({ beforeSha256: null, operation: 'create', beforeBytes: 0 })
  })

  it.each(['exact-source-coordinate-repair', 'semantic-evidence-reconciliation', 'wildlife-source-authoring', 'outside-current-retirement'])('rejects rehashed %s operation tampering', async model => {
    const f = boundedFixture(model === 'wildlife-source-authoring' ? [model] : undefined)
    const batch = f.batches.find(b => b.batchId === model)
    const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].file = 'lore/name-pools/values-cast.json'
    f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it.each(['exact-source-coordinate-repair', 'semantic-evidence-reconciliation', 'wildlife-source-authoring', 'outside-current-retirement'])('rejects %s person promotion', async model => {
    const f = boundedFixture(model === 'wildlife-source-authoring' ? [model] : undefined)
    f.batches.find(b => b.batchId === model).personIds = ['K1009']
    await expect(f.load()).rejects.toThrow('E_APPROVAL_KIND')
  })

  it('rejects numeric mutation beyond six semantic evidence objects', async () => {
    const f = boundedFixture(); const path = 'lore/name-pools/gurps-cast.json'
    const value = JSON.parse(f.bytes(path)); value.people[1008].attributes.IQ.value += 1; f.setJSON(path, value)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects birthday owner receipt mutation and preserves the issued date', async () => {
    const f = boundedFixture()
    f.files.set(resolve(f.actualRoot, '.omo/evidence/seoul-lock/owner-shinjongmok-birthday-approval-20261015.md'), Buffer.from('unapproved'))
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it('rejects birthday evidence replacement that was expressly left unresolved', async () => {
    const f = boundedFixture(); const path = 'lore/name-pools/cast-birthdays.json'
    const value = JSON.parse(f.bytes(path)); value.people[1008].sourceRefs[1] = 'unapproved'; f.setJSON(path, value)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects semantic-before-coordinate source order', async () => {
    const f = boundedFixture(); [f.batches[0], f.batches[1]] = [f.batches[1], f.batches[0]]
    await expect(f.load()).rejects.toThrow('E_MANIFEST_CHAIN')
  })

  it('rejects altered snapshots even if manifest hashes are rewritten', async () => {
    const f = boundedFixture(); const path = `${f.directory}/semantic-evidence-reconciliation/snapshots.json`
    const snapshots = JSON.parse(f.bytes(path)); snapshots.sources[0].afterGzipBase64 = gzipSync('{}').toString('base64'); f.setJSON(path, snapshots)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects fake bibliography existence before creation', async () => {
    const f = boundedFixture(['wildlife-source-authoring']); const b = f.batches[0]
    const manifest = JSON.parse(f.bytes(b.sourceBeforeAfterPath)); manifest.sources[1].beforeSha256 = digest('old'); f.setJSON(b.sourceBeforeAfterPath, manifest)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects an unregistered Atlas predecessor rather than bypassing continuity', async () => {
    const f = boundedFixture(['wildlife-source-authoring']); const b = structuredClone(f.batches[0])
    b.batchId = 'prior'; delete b.approvalModel
    b.packetPath = 'prior-packet'; b.packetSha256 = digest('prior'); f.files.set(resolve(f.actualRoot, b.packetPath), Buffer.from('prior'))
    b.sourceBeforeAfterPath = 'prior-manifest'; f.setJSON(b.sourceBeforeAfterPath, { sources: [{ sourcePath: 'lore/World-Narrative-Atlas.json', beforeSha256: '1'.repeat(64), afterSha256: 'd0f33167dea8c9415918fb169b0b6c252bb1009f4bfafbcbf68ca8af3c05944d' }] })
    b.approvals = ['batch-allocation', 'article-style', 'card-style'].map(kind => ({ kind, bodySha256: digest(kind), messageRef: 'fixture' }))
    f.batches.unshift(b)
    await expect(f.load()).rejects.toThrow('E_MANIFEST_CHAIN')
  })

  it('rejects the old wrong-workspace wildlife packet even with its valid hash', async () => {
    const f = boundedFixture(['wildlife-source-authoring']); const b = f.batches[0]
    const old = JSON.parse(f.bytes(`${f.directory}/wildlife-source-authoring/registry-entry.json`))
    b.packetPath = old.packetPath; b.packetSha256 = old.packetSha256
    await expect(f.load()).rejects.toThrow('E_APPROVAL_BATCH')
  })

  it('rejects restoring a preexisting census field from the main baseline', async () => {
    const f = boundedFixture(['wildlife-source-authoring']); const path = 'lore/World-Narrative-Atlas.json'
    const packet = JSON.parse(f.bytes('.omo/private/seoul-migration/task-10-wildlife-census-path-correction-applied.json'))
    const value = JSON.parse(f.bytes(path)); const row = packet.preservedCensusPreexistingDifferences.at(-1)
    const parts = row.path.slice(1).split('/'); const parent = parts.slice(0, -1).reduce((v, k) => v[k], value)
    parent[parts.at(-1)] = row.before; f.setJSON(path, value)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })
})


describe('water18 exact source contract', () => {
  it('authenticates18 leaves and rejects rehashed packet drift', async () => {
    const actualRoot = resolve(import.meta.dirname, '..')
    const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
    for (const mutate of [false, true]) {
      const registry = JSON.parse(readFileSync(registryPath))
      registry.batches = registry.batches.filter(row => row.batchId === 'water-final-context-18')
      const batch = registry.batches[0]; const files = new Map()
      if (mutate) {
        const path = resolve(actualRoot, batch.packetPath); const packet = JSON.parse(readFileSync(path))
        packet.operations[0].value = 'unapproved'; files.set(path, Buffer.from(JSON.stringify(packet)))
        batch.packetSha256 = digest(files.get(path))
      }
      files.set(registryPath, Buffer.from(JSON.stringify(registry)))
      const load = () => loadHistoricalFixture(actualRoot, registry.batches, files)
      if (mutate) await expect(load()).rejects.toThrow(/^E_/)
      else { const [applied] = await load(); expect(applied.operationCount).toBe(18); expect(applied.personIds).toEqual([]) }
    }
  })
})

describe('fullbody34 exact source contract', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  it('authenticates34 leaves with preserved Q2 and rejects proposal, packet and source drift', async () => {
    for (const kind of ['valid', 'proposal', 'packet', 'current']) {
      const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
      registry.batches = registry.batches.filter(row => row.batchId === 'sixteen-states-fullbody-34')
      const batch = registry.batches[0]; const files = new Map()
      const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
      if (kind === 'packet') {
        const packet = JSON.parse(bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'
        files.set(resolve(actualRoot, batch.packetPath), Buffer.from(JSON.stringify(packet)))
        batch.packetSha256 = digest(bytes(batch.packetPath))
      }
      if (kind === 'proposal' || kind === 'current') {
        const path = kind === 'proposal' ? '.omo/private/seoul-migration/sixteen-states-fullbody-q1-q2-q3-q4-candidate-20261015.json' : 'lore/factions/Sixteen-States.json'
        files.set(resolve(actualRoot, path), Buffer.concat([bytes(path), Buffer.from(' ')]))
      }
      files.set(resolve(actualRoot, registryPath), Buffer.from(JSON.stringify(registry)))
      const load = () => loadHistoricalFixture(actualRoot, registry.batches, files)
      if (kind === 'valid') { const [applied] = await load(); expect(applied.operationCount).toBe(34); expect(applied.personIds).toEqual([]) }
      else await expect(load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('winter10 exact source contract', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  it('authenticates ten leaves and rejects proposal, packet and source drift', async () => {
    for (const kind of ['valid', 'proposal', 'packet', 'current']) {
      const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
      registry.batches = registry.batches.filter(row => row.batchId === 'water-global-winter-context-10')
      const batch = registry.batches[0]; const files = new Map()
      const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
      if (kind === 'packet') {
        const packet = JSON.parse(bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'
        files.set(resolve(actualRoot, batch.packetPath), Buffer.from(JSON.stringify(packet)))
        batch.packetSha256 = digest(bytes(batch.packetPath))
      }
      if (kind === 'proposal' || kind === 'current') {
        const path = kind === 'proposal' ? '.omo/private/seoul-migration/water-global-winter-context-proposal-20261015.json' : 'lore/culture/Food-Culture.json'
        files.set(resolve(actualRoot, path), Buffer.concat([bytes(path), Buffer.from(' ')]))
      }
      files.set(resolve(actualRoot, registryPath), Buffer.from(JSON.stringify(registry)))
      const load = () => loadHistoricalFixture(actualRoot, registry.batches, files)
      if (kind === 'valid') { const [applied] = await load(); expect(applied.operationCount).toBe(10); expect(applied.personIds).toEqual([]) }
      else await expect(load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('Q2v2 exact28 source contract', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function fixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batches = registry.batches.filter(row => row.batchId === 'sixteen-states-Q2-v2-28')
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: registry.schema, batches }); return loadHistoricalFixture(actualRoot, batches, files) }
    return { batches, files, bytes, setJSON, load }
  }
  it('authenticates28 approved leaves and the complete inverse source', async () => {
    const f = fixture(); const [batch] = await f.load()
    expect(batch.operationCount).toBe(28)
    expect(batch.personIds).toEqual([])
    expect(batch.sourceBeforeAfter.sources[0].afterSha256).toBe('087098eca807a06e2d86f434d6d1a619dd43346fc21a961893f51959ec8025e4')
  })
  it('rejects altered packet, approved proposal and final source bytes', async () => {
    for (const kind of ['packet', 'proposal', 'current']) {
      const f = fixture(); const batch = f.batches[0]
      if (kind === 'packet') { const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'; f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath)) }
      else {
        const path = kind === 'proposal' ? '.omo/private/seoul-migration/sixteen-states-Q2-exact-body-proposal-v2-20261015.json' : 'lore/factions/Sixteen-States.json'
        f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
      }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('water neighbor12 exact source contract', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function fixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batches = registry.batches.filter(row => ['water-v3-exact-21', 'water-neighbor-exact-12'].includes(row.batchId))
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: registry.schema, batches }); return loadHistoricalFixture(actualRoot, batches, files) }
    return { batches, files, bytes, setJSON, load }
  }
  it('replays water21 then neighbor12 preserving both exact intermediate source hashes', async () => {
    const f = fixture(); const batches = await f.load()
    expect(batches.map(row => row.operationCount)).toEqual([21, 12])
    for (const source of batches[1].sourceBeforeAfter.sources) expect(batches[0].sourceBeforeAfter.sources.find(row => row.sourcePath === source.sourcePath).afterSha256).toBe(source.beforeSha256)
    expect(batches[1].personIds).toEqual([])
  })
  it('rejects packet mutation, reversed chain, proposal mutation and final source drift', async () => {
    for (const kind of ['packet', 'order', 'proposal', 'current']) {
      const f = fixture(); const batch = f.batches[1]
      if (kind === 'packet') { const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'; f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath)) }
      if (kind === 'order') f.batches.reverse()
      if (kind === 'proposal' || kind === 'current') {
        const path = kind === 'proposal' ? '.omo/private/seoul-migration/water-v3-neighbor-owner-proposal-20261015.json' : 'lore/culture/Food-Culture.json'
        f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
      }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('retained14 exact appointment source contract', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function fixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batch = registry.batches.find(row => row.batchId === 'opening-office-retained-14')
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: registry.schema, batches: [batch] }); return loadHistoricalFixture(actualRoot, [batch], files) }
    return { batch, files, bytes, setJSON, load }
  }
  it('replays fourteen selected rows including one exact no-op without person admission', async () => {
    const f = fixture(); const batches = await f.load()
    expect(batches[0].operationCount).toBe(14)
    expect(batches[0].personIds).toEqual([])
    const packet = JSON.parse(f.bytes(f.batch.packetPath))
    expect(packet.operations.filter(op => JSON.stringify(op.oldValue) !== JSON.stringify(op.value))).toHaveLength(13)
  })
  it('rejects rehashed changes, person promotion, proposal and source mutations', async () => {
    for (const kind of ['packet', 'person', 'proposal', 'current']) {
      const f = fixture()
      if (kind === 'packet') { const packet = JSON.parse(f.bytes(f.batch.packetPath)); packet.operations[0].value.rank = 'unapproved'; f.setJSON(f.batch.packetPath, packet); f.batch.packetSha256 = digest(f.bytes(f.batch.packetPath)) }
      if (kind === 'person') f.batch.personIds = ['K423']
      if (kind === 'proposal' || kind === 'current') {
        const path = kind === 'proposal' ? '.omo/private/seoul-migration/opening-office-retained14-exact-owner-proposal-20261015.json' : 'lore/relations/opening-office-appointments.json'
        f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
      }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('selection and water exact source contracts', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function sourceFixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batches = registry.batches.filter(row => ['selection-provenance-label-1', 'water-v3-exact-21'].includes(row.batchId))
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: registry.schema, batches }); return loadHistoricalFixture(actualRoot, batches, files) }
    return { batches, files, bytes, setJSON, load }
  }
  it('replays selection1 then water21 against all six current sources without admission', async () => {
    const f = sourceFixture(); const batches = await f.load()
    expect(batches.map(row => row.operationCount)).toEqual([1, 21])
    expect(batches.every(row => row.personIds.length === 0)).toBe(true)
    expect(batches.map(row => row.sourceBeforeAfter.sources.length)).toEqual([1, 5])
  })
  it('rejects rehashed mutations of either exact packet', async () => {
    for (const index of [0, 1]) {
      const f = sourceFixture(); const batch = f.batches[index]
      const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'
      f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
  it('rejects altered water proposal authority and final source bytes', async () => {
    for (const path of ['.omo/private/seoul-migration/document-review-wave1-water-v3-proposal-20261015.json', 'lore/regions/sources/selection.json', 'lore/ailments/Ailments.json']) {
      const f = sourceFixture(); f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('D1C and K271 closed receipt contracts', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function sourceFixture(model) {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const packetPath = `.omo/private/seoul-migration/completed-source-registration-20261015/${model}/application-packet.json`
    const packetBytes = readFileSync(resolve(actualRoot, packetPath)); const packet = JSON.parse(packetBytes)
    const batch = { batchId: model, state: 'applied', personIds: [], approvalModel: model, packetPath,
      packetSha256: digest(packetBytes), operationCount: packet.operations.length,
      sourceBeforeAfterPath: packetPath.replace('application-packet.json', 'source-before-after.json'),
      applicationReview: { evidencePath: packet.sealedReceipt.path, evidenceSha256: packet.sealedReceipt.sha256 },
      approvals: [{ kind: model, bodySha256: packet.sealedReceipt.sha256, messageRef: packet.sealedReceipt.path }] }
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: registry.schema, batches: [batch] }); return loadHistoricalFixture(actualRoot, [batch], files) }
    return { batch, packet, files, bytes, setJSON, load }
  }
  it.each([['remaining-corpus-D1C-36', 36], ['k271-bilingual-alignment-2', 2]])('replays exact %s source receipt', async (model, count) => {
    const f = sourceFixture(model); const batches = await f.load()
    expect(batches[0].operationCount).toBe(count)
    expect(batches[0].personIds).toEqual([])
  })
  it.each(['remaining-corpus-D1C-36', 'k271-bilingual-alignment-2'])('rejects rehashed %s operation and manifest mutations', async model => {
    for (const kind of ['packet', 'manifest', 'person', 'current']) {
      const f = sourceFixture(model)
      if (kind === 'packet') { f.packet.operations[0].value = 'unapproved'; f.setJSON(f.batch.packetPath, f.packet); f.batch.packetSha256 = digest(f.bytes(f.batch.packetPath)) }
      if (kind === 'manifest') { const value = JSON.parse(f.bytes(f.batch.sourceBeforeAfterPath)); value.sources[0].beforeSha256 = '0'.repeat(64); f.setJSON(f.batch.sourceBeforeAfterPath, value) }
      if (kind === 'person') f.batch.personIds = ['K271']
      if (kind === 'current') { const path = f.packet.sources[0].sourcePath; f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')])) }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('final D1 historical two-step registration', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function sourceFixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batches = registry.batches.filter(row => ['remaining-corpus-D1AB-31', 'remaining-corpus-D1A-style-22'].includes(row.batchId))
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: 'seoul-applied-batches.v1', batches }); return loadHistoricalFixture(actualRoot, batches, files) }
    return { batches, files, bytes, setJSON, load }
  }
  it('replays 31 then 22 operations preserving the exact historical intermediate', async () => {
    const f = sourceFixture(); const batches = await f.load()
    expect(batches.map(row => row.operationCount)).toEqual([31, 22])
    expect(batches.every(row => row.personIds.length === 0)).toBe(true)
    const path = 'lore/name-pools/cast-backfill-draft.json'
    expect(batches[0].sourceBeforeAfter.sources.find(row => row.sourcePath === path).afterSha256).toBe(batches[1].sourceBeforeAfter.sources[0].beforeSha256)
  })
  it('rejects rehashed packet mutations for each approval', async () => {
    for (const index of [0, 1]) {
      const f = sourceFixture(); const batch = f.batches[index]
      const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'
      f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
  it('rejects changed authority, reversed history, promotion, manifest and live bytes', async () => {
    for (const kind of ['owner', 'order', 'person', 'manifest', 'current']) {
      const f = sourceFixture()
      if (kind === 'owner') f.files.set(resolve(actualRoot, '.omo/evidence/seoul-lock/owner-remaining-corpus-D1A-style-20261015.md'), Buffer.from('altered'))
      if (kind === 'order') f.batches.reverse()
      if (kind === 'person') f.batches[0].personIds = ['K001']
      if (kind === 'manifest') { const path = f.batches[1].sourceBeforeAfterPath; const value = JSON.parse(f.bytes(path)); value.sources[0].beforeSha256 = '0'.repeat(64); f.setJSON(path, value) }
      if (kind === 'current') { const path = 'lore/name-pools/cast-backfill-draft.json'; f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')])) }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('station and Soul closed successor registration', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  const models = ['station-climate-v2-24', 'rc-l1-evidence-reference-sync-127', 'min-ungi-rationale-exact-two']
  function sourceFixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batches = registry.batches.filter(row => models.includes(row.approvalModel))
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => {
      setJSON(registryPath, { schema: 'seoul-applied-batches.v1', batches })
      const historical = historicalFixtureBytes(actualRoot, batches, files)
      return loadHistoricalFixture(actualRoot, batches, files)
    }
    return { batches, files, bytes, setJSON, load }
  }
  it('replays station removals and the ordered reference-to-rationale chain against live files', async () => {
    const f = sourceFixture(); const batches = await f.load()
    expect(batches.map(row => row.batchId)).toEqual(models)
    expect(batches.map(row => row.operationCount)).toEqual([24, 127, 2])
    expect(batches.every(row => row.personIds.length === 0)).toBe(true)
    const refs = batches[1].sourceBeforeAfter.sources
    for (const source of batches[2].sourceBeforeAfter.sources) expect(refs.find(row => row.sourcePath === source.sourcePath).afterSha256).toBe(source.beforeSha256)
  })
  it.each(models)('rejects rehashed %s packet mutations', async model => {
    const f = sourceFixture(); const batch = f.batches.find(row => row.batchId === model)
    const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].oldValue = 'unapproved'
    f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
  it('rejects changed authority, person promotion, manifests, order and final live bytes', async () => {
    for (const kind of ['station-owner', 'rationale-owner', 'person', 'manifest', 'order', 'current']) {
      const f = sourceFixture()
      if (kind.endsWith('owner')) {
        const path = '.omo/private/seoul-migration/' + (kind === 'station-owner' ? 'owner-station-winter-v2-approval-20261015.md' : 'owner-min-ungi-soul-rationale-20261015.md')
        f.files.set(resolve(actualRoot, path), Buffer.from('altered'))
      }
      if (kind === 'person') f.batches[0].personIds = ['K001']
      if (kind === 'manifest') { const path = f.batches[0].sourceBeforeAfterPath; const value = JSON.parse(f.bytes(path)); value.sources[0].beforeSha256 = '0'.repeat(64); f.setJSON(path, value) }
      if (kind === 'order') f.batches.reverse()
      if (kind === 'current') { const path = 'lore/editorial/Soul-Assignments.json'; f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')])) }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

describe('family and formation exact source registration', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  function sourceFixture() {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batches = registry.batches.filter(row => ['family-preservation-repairs-101', 'membership-formation-alignment-2', 'diaspora-lineage-canonical-sync-13'].includes(row.approvalModel))
    const files = new Map()
    const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
    const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    const load = () => { setJSON(registryPath, { schema: 'seoul-applied-batches.v1', batches }); return loadHistoricalFixture(actualRoot, batches, files) }
    return { batches, files, bytes, setJSON, load }
  }
  it('replays family source-first 101 addresses and the exact two formation leaves', async () => {
    const f = sourceFixture(); const batches = await f.load()
    expect(batches.map(row => row.operationCount)).toEqual([101, 2, 13])
    expect(batches.every(row => row.personIds.length === 0)).toBe(true)
    expect(batches[0].sourceBeforeAfter.sources).toHaveLength(6)
    expect(batches[1].sourceBeforeAfter.sources[0].beforeSha256).toBe('a4d6ecc68d656f3ac996817dec76072660a49f18889232f5dd1190106d1600cc')
  })
  it.each(['family-preservation-repairs-101', 'membership-formation-alignment-2', 'diaspora-lineage-canonical-sync-13'])('rejects rehashed %s operations', async model => {
    const f = sourceFixture(); const batch = f.batches.find(row => row.batchId === model)
    const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value = 'unapproved'
    f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
  it('rejects family authority, promotion, manifest and source mutations', async () => {
    for (const kind of ['owner', 'person', 'manifest', 'current']) {
      const f = sourceFixture(); const batch = f.batches[0]
      if (kind === 'owner') f.files.set(resolve(actualRoot, '.omo/evidence/seoul-lock/owner-family-preservation-repairs-20261015.md'), Buffer.from('altered'))
      if (kind === 'person') batch.personIds = ['K001']
      if (kind === 'manifest') { const value = JSON.parse(f.bytes(batch.sourceBeforeAfterPath)); value.sources[0].beforeSha256 = '0'.repeat(64); f.setJSON(batch.sourceBeforeAfterPath, value) }
      if (kind === 'current') { const path = 'lore/name-pools/cast-family-trees.json'; f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')])) }
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
  it('rejects changed formation owner receipt and final Century bytes', async () => {
    for (const path of ['.omo/evidence/seoul-lock/owner-formation-membership-alignment-20261015.md', 'lore/chronology/Century-Annals.json']) {
      const f = sourceFixture(); f.files.set(resolve(actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
})

function connectedRegistrationFixture() {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
  const models = ['connected-atlas-62', 'connected-chronology-172', 'connected-articles-97', 'connected-table-translation-8', 'center-region-authoring-schema']
  const batches = registry.batches.filter(row => models.includes(row.approvalModel))
  const files = new Map()
  const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
  const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
  const load = () => { setJSON(registryPath, { schema: 'seoul-applied-batches.v1', batches }); return loadHistoricalFixture(actualRoot, batches, files) }
  return { actualRoot, batches, files, bytes, setJSON, load }
}

describe('connected source receipt registration', () => {
  it('authenticates exactly 331 connected leaves, 8 separate translations and 4 schema fields', async () => {
    const f = connectedRegistrationFixture(); const batches = await f.load()
    expect(batches.map(row => row.operationCount)).toEqual([62, 172, 97, 8, 4])
    expect(batches.every(row => row.personIds.length === 0)).toBe(true)
    const article = batches[2].sourceBeforeAfter.sources.find(row => row.sourcePath.endsWith('Sixteen-States.json'))
    const successor = batches[3].sourceBeforeAfter.sources[0]
    expect(article.afterSha256).toBe('7505d88cf5de1754a4c52dd68283b4136ace1240c4da7037279cc8ade65cda9e')
    expect(successor.beforeSha256).toBe(article.afterSha256)
    expect(successor.afterSha256).toBe('c933c52e5612a7fb5f2fc226a233578b37a7a1bbadd033005e5601771e9ef99e')
  })
  it.each(['connected-atlas-62', 'connected-chronology-172', 'connected-articles-97', 'connected-table-translation-8', 'center-region-authoring-schema'])('rejects rehashed %s operation changes', async model => {
    const f = connectedRegistrationFixture(); const batch = f.batches.find(row => row.batchId === model)
    const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].value = 'unauthorized'
    f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })
  it('rejects promotion, altered owner proof, manifest and reversed article order', async () => {
    for (const kind of ['person', 'owner', 'manifest', 'order']) {
      const f = connectedRegistrationFixture()
      if (kind === 'person') f.batches[0].personIds = ['K001']
      if (kind === 'owner') f.files.set(resolve(f.actualRoot, '.omo/evidence/seoul-lock/owner-connected-seoul-narratives-approval-20261015.md'), Buffer.from('altered'))
      if (kind === 'manifest') { const b = f.batches[2]; const value = JSON.parse(f.bytes(b.sourceBeforeAfterPath)); value.sources[0].beforeSha256 = '0'.repeat(64); f.setJSON(b.sourceBeforeAfterPath, value) }
      if (kind === 'order') [f.batches[2], f.batches[3]] = [f.batches[3], f.batches[2]]
      await expect(f.load()).rejects.toThrow(/^E_/)
    }
  })
  it('rejects unregistered current changes instead of freezing them', async () => {
    const f = connectedRegistrationFixture(); const path = 'lore/chronology/Century-Annals.json'
    f.files.set(resolve(f.actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })
})

function completedFixture () {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = resolve(actualRoot, '.omo/private/seoul-migration/applied-batches.json')
  const registry = JSON.parse(readFileSync(registryPath))
  const batches = registry.batches.filter(row => ['wildlife-source-authoring', 'sheet-boundary-preservation-72',
    'approved-narrative-final-40', 'k234-english-alignment-2', 'bibliography-json-authoring-transition'].includes(row.approvalModel))
  const files = new Map()
  const bytes = path => files.get(resolve(actualRoot, path)) ?? readFileSync(resolve(actualRoot, path))
  const setJSON = (path, value) => files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
  const load = () => {
    setJSON(registryPath, { schema: 'seoul-applied-batches.v1', batches })
    return loadHistoricalFixture(actualRoot, batches, files)
  }
  return { actualRoot, batches, files, bytes, setJSON, load }
}

describe('completed source successor registration', () => {
  it('replays all completed transitions against live relevant files without active faction reads', async () => {
    const f = completedFixture(); const batches = await f.load()
    expect(batches).toHaveLength(5)
    expect(batches.every(row => row.personIds.length === 0)).toBe(true)
    expect(batches.slice(1).map(row => row.operationCount)).toEqual([144, 40, 2, 1])
    const baseline = JSON.parse(f.bytes('.omo/private/seoul-migration/baseline.json'))
    const before = JSON.stringify(baseline)
    const sources = await extractCensusSources(baseline, path => Promise.resolve(f.bytes(path)), batches)
    expect(sources.size).toBe(323)
    expect(sources.has('lore/Research-Sources.md')).toBe(false)
    expect(sources.get('lore/Research-Sources.json').value.id).toBe('DOC:Research-Sources')
    expect(JSON.stringify(baseline)).toBe(before)
    const receipt = JSON.parse(f.bytes('.omo/private/seoul-migration/bibliography-authoring-transition-20261015.json'))
    const resolver = createDependencyResolver(sources)
    for (const alias of receipt.anchorMapping) expect(resolver(alias.originalReference, 'lore/World-Narrative-Atlas.json').targets).toEqual(alias.targets)
  })

  it.each(['sheet-boundary-preservation-72', 'approved-narrative-final-40', 'k234-english-alignment-2', 'bibliography-json-authoring-transition'])('rejects rehashed %s packet changes', async model => {
    const f = completedFixture(); const batch = f.batches.find(row => row.approvalModel === model)
    const packet = JSON.parse(f.bytes(batch.packetPath)); packet.operations[0].file = 'lore/characters/Other.json'
    f.setJSON(batch.packetPath, packet); batch.packetSha256 = digest(f.bytes(batch.packetPath))
    await expect(f.load()).rejects.toThrow(/^E_/)
  })

  it.each(['sheet-boundary-preservation-72', 'approved-narrative-final-40', 'k234-english-alignment-2', 'bibliography-json-authoring-transition'])('rejects %s person promotion', async model => {
    const f = completedFixture(); f.batches.find(row => row.approvalModel === model).personIds = ['K234']
    await expect(f.load()).rejects.toThrow('E_APPROVAL_KIND')
  })

  it('rejects a rewritten historical before binding', async () => {
    const f = completedFixture(); const batch = f.batches.find(row => row.approvalModel === 'approved-narrative-final-40')
    const manifest = JSON.parse(f.bytes(batch.sourceBeforeAfterPath)); manifest.sources[0].beforeSha256 = manifest.sources[0].afterSha256
    f.setJSON(batch.sourceBeforeAfterPath, manifest)
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects successor-before-predecessor ordering', async () => {
    const f = completedFixture(); [f.batches[2], f.batches[3]] = [f.batches[3], f.batches[2]]
    await expect(f.load()).rejects.toThrow('E_MANIFEST_CHAIN')
  })

  it('rejects changed final source bytes', async () => {
    const f = completedFixture(); const path = 'lore/characters/Cast-State-09.json'
    f.files.set(resolve(f.actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })

  it('rejects replacing the bibliography without its authenticated creation', async () => {
    const f = completedFixture(); f.batches.shift()
    await expect(f.load()).rejects.toThrow('E_MANIFEST_CHAIN')
  })

  it('rejects a changed independent K234 proof', async () => {
    const f = completedFixture(); const path = '.omo/evidence/seoul-lock/narrative-final-independent-20261015.md'
    f.files.set(resolve(f.actualRoot, path), Buffer.concat([f.bytes(path), Buffer.from(' ')]))
    await expect(f.load()).rejects.toThrow('E_REVIEW_HASH')
  })
})

describe('authenticated three-faction source successor', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  it('validates the complete actual registry including the faction successor last', async () => {
    const batches = await loadAppliedBatches(path => Promise.resolve(readFileSync(path)), actualRoot)
    expect(batches.slice(0, 62).map(row => row.batchId)).toEqual(JSON.parse(readFileSync(resolve(actualRoot,
      '.omo/private/seoul-migration/post62-registration-20261015/terminal-62.json'))).batchIds)
    const faction = batches.find(batch => batch.approvalModel === 'three-faction-source-direction')
    expect(faction.personIds).toEqual([])
    expect(faction.sourceBeforeAfter.sources.map(row => row.sourcePath)).toEqual([
      'lore/factions/Sixteen-States.json', 'lore/overview/World-Unbinding.json', 'WORLD_BUILDING_GUIDE.md'])
  })
  it.each(['owner', 'packet', 'manifest', 'current', 'person'])('rejects faction %s tampering', async kind => {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const batch = registry.batches.find(row => row.batchId === 'three-faction-source-direction'); const files = new Map()
    const path = kind === 'owner' ? '.omo/evidence/seoul-lock/owner-seoul-three-faction-direction-20261015.md'
      : kind === 'packet' ? batch.packetPath : kind === 'manifest' ? batch.sourceBeforeAfterPath : 'lore/factions/Sixteen-States.json'
    if (kind === 'person') batch.personIds = ['K234']
    else if (kind === 'manifest') {
      const manifest = JSON.parse(readFileSync(resolve(actualRoot, path)))
      manifest.sources[0].beforeSha256 = '0'.repeat(64)
      files.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(manifest)))
    }
    else files.set(resolve(actualRoot, path), Buffer.concat([readFileSync(resolve(actualRoot, path)), Buffer.from(' ')]))
    files.set(resolve(actualRoot, registryPath), Buffer.from(JSON.stringify(registry)))
    await expect(loadAppliedBatches(path => Promise.resolve(files.get(path) ?? readFileSync(path)), actualRoot)).rejects.toThrow(/^E_/)
  })
})

describe('authenticated rights targets and current source creation', () => {
  const actualRoot = resolve(import.meta.dirname, '..')
  const registryPath = '.omo/private/seoul-migration/applied-batches.json'
  const baseline = JSON.parse(readFileSync(resolve(actualRoot, '.omo/private/seoul-migration/baseline.json')))
  const bytes = path => Promise.resolve(readFileSync(path))

  it('keeps all 411 original rights while admitting exact current targets and 158 identities', async () => {
    const batches = await loadAppliedBatches(bytes, actualRoot)
    const rights = batches.find(batch => batch.approvalModel === 'approved-rights-transition').rightsTransition
    const hashes = Object.fromEntries([...rights.sources].map(([path, source]) => [path, source.afterSha256]))
    const targets = rightsTransitionTargets(baseline, rights.proof, hashes)
    expect(rights.dispositions).toHaveLength(411)
    expect(rights.dispositions.filter(row => row.disposition !== 'retained-current')).toHaveLength(325)
    expect(Object.fromEntries(['titles', 'holdings', 'grants', 'bindings'].map(set => [set, targets[set].length])))
      .toEqual({ titles: 42, holdings: 25, grants: 31, bindings: 7 })
    expect(targets.persons).toEqual(baseline.currentEntitySets.persons)
    expect(targets.persons).toHaveLength(1022)
    expect(rights.dispositions.flatMap(row => row.newRefs).filter(ref => ref.jsonPointer.startsWith('/politicalIdentities/'))).toHaveLength(158)
  })

  it.each(['missing', 'extra', 'stale', 'owner', 'political'])('rejects %s disposition or authority changes at the scope boundary', async kind => {
    const batches = await loadAppliedBatches(bytes, actualRoot)
    const rights = batches.find(batch => batch.approvalModel === 'approved-rights-transition').rightsTransition
    const proof = structuredClone(rights.proof)
    const hashes = Object.fromEntries([...rights.sources].map(([path, source]) => [path, source.afterSha256]))
    if (kind === 'owner') proof.receiptBody += ' '
    else if (kind === 'political') {
      const source = proof.sources.find(row => row.sourcePath.endsWith('/opening-feudal-allocation.json'))
      const value = JSON.parse(source.afterBody); value.politicalIdentities[0].directOwnership = true
      source.afterBody = JSON.stringify(value); hashes[source.sourcePath] = digest(source.afterBody)
    } else {
      const approval = JSON.parse(proof.approvalBody)
      if (kind === 'missing') approval.records.pop()
      if (kind === 'extra') approval.records.push(approval.records[0])
      if (kind === 'stale') approval.records[0].sourceValueSha256 = '0'.repeat(64)
      proof.approvalBody = JSON.stringify(approval)
    }
    expect(() => rightsTransitionTargets(baseline, proof, hashes)).toThrow(/^E_/)
  })

  it('discovers the replacement bibliography without replacing the immutable denominator', async () => {
    const before = JSON.stringify(baseline)
    const batches = await loadAppliedBatches(bytes, actualRoot)
    const sources = await extractCensusSources(baseline, path => bytes(resolve(actualRoot, path)), batches)
    expect(sources.has('lore/Research-Sources.md')).toBe(false)
    expect(sources.get('lore/Research-Sources.json').sha256).toBe('d99f98ed386d74c218118cca146fc5a0d5b1be6768f5131d64e2d20a01f1757c')
    expect(sources.size).toBe(323)
    expect(JSON.stringify(baseline)).toBe(before)
    const resolveReference = createDependencyResolver(sources)
    const receipt = JSON.parse(readFileSync(resolve(actualRoot, '.omo/private/seoul-migration/bibliography-authoring-transition-20261015.json')))
    for (const alias of receipt.anchorMapping) expect(resolveReference(alias.originalReference, 'lore/World-Narrative-Atlas.json').targets).toEqual(alias.targets)
    expect(resolveReference('lore/Research-Sources.md#missing', 'lore/World-Narrative-Atlas.json').status).toBe('unresolved')
    const duplicate = new Map(sources); const path = 'lore/Research-Sources.json'
    const value = structuredClone(sources.get(path).value)
    value.content.push(structuredClone(value.content[2]))
    const data = Buffer.from(JSON.stringify(value))
    duplicate.set(path, { value, bytes: data, sha256: digest(data) })
    expect(createDependencyResolver(duplicate)(receipt.anchorMapping[0].originalReference, 'lore/World-Narrative-Atlas.json').status).toBe('unresolved')
  })

  it.each(['packet', 'owner', 'manifest', 'current', 'numeric'])('rejects rights or preservation %s tampering through the real registry', async kind => {
    const registry = JSON.parse(readFileSync(resolve(actualRoot, registryPath)))
    const rights = registry.batches.find(batch => batch.approvalModel === 'approved-rights-transition')
    const overrides = new Map()
    let path
    if (kind === 'packet') path = rights.packetPath
    if (kind === 'owner') path = rights.approvals[0].messageRef
    if (kind === 'manifest') path = rights.sourceBeforeAfterPath
    if (kind === 'current') path = 'lore/relations/opening-feudal-allocation.json'
    if (kind === 'numeric') path = 'lore/editorial/profile-batches/special.json'
    const raw = readFileSync(resolve(actualRoot, path))
    if (kind === 'owner') overrides.set(resolve(actualRoot, path), Buffer.concat([raw, Buffer.from(' ')]))
    else {
      const value = JSON.parse(raw)
      if (kind === 'packet') value.records.pop()
      if (kind === 'manifest') value.sources[0].beforeSha256 = '0'.repeat(64)
      if (kind === 'current') value.titles.pop()
      if (kind === 'numeric') value.profiles[0].abilities.leadership.base += 1
      overrides.set(resolve(actualRoot, path), Buffer.from(JSON.stringify(value)))
    }
    await expect(loadAppliedBatches(path => Promise.resolve(overrides.get(path) ?? readFileSync(path)), actualRoot)).rejects.toThrow(/^E_/)
  })
})
