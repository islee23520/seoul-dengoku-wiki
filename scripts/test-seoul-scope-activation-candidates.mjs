import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { reviewWordingPredecessorReader } from './review-wording-successor.mjs'
import { k176PredecessorReader } from './k176-label-successor.mjs'
import { stationCatalogPredecessorReader } from './station-catalog-scope-successor.mjs'
import { sha256 } from './seoul-scope.mjs'
import { loadAppliedBatches } from './seoul-census.mjs'
import { buildSeoulScopeActivationCandidates } from './seoul-scope-activation-candidates.mjs'

const root = resolve(import.meta.dirname, '..')
const registryPath = '.omo/private/seoul-migration/applied-batches.json'
const supplementPath = '.omo/private/seoul-migration/location-candidate-133-recovery-20261015-registry56-supplement.json'
const twoRefPath = '.omo/private/seoul-migration/k1003-k1004-location-ref-supplement-applied-evidence-20261015.json'
const bytes = path => readFile(resolve(root, path))
const pendingScope = (await promisify(execFile)('git', ['-C', root, 'show', 'e9c12a43728a599c371d373088e177a446ff5051:lore/editorial/Seoul-Scope-Contract.json'],
  { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout
if (sha256(pendingScope) !== '8a009ba5fe829500d43ded1c10ed977a06ad9468d5494d71b300304918132578') throw new Error('E_ARCHIVE_HASH')
let predecessor = await stationCatalogPredecessorReader(root, readFile)
predecessor = await reviewWordingPredecessorReader(root, predecessor)
predecessor = await k176PredecessorReader(root, predecessor)
const readCaptured = path => path === resolve(root, 'lore/editorial/Seoul-Scope-Contract.json') ? pendingScope : predecessor(path)
let capturedFixture
async function candidateFixture() {
  if (capturedFixture) return capturedFixture
  const registry = JSON.parse(await bytes(registryPath))
  const prefix = { ...registry, batches: registry.batches.slice(0, 56) }
  expect(sha256(JSON.stringify(prefix, null, 2) + '\n')).toBe('8953189e6f9ebc344e172f61075b8d69ad6500342349cd20fcba8ae687cb15e7')
  const batches = (await loadAppliedBatches(predecessor, root)).slice(0, 56)
  const values = new Map()
  const baseline = JSON.parse(await bytes('.omo/private/seoul-migration/baseline.json'))
  const hashes = new Map(baseline.files.map(row => [row.path, row.sha256]))
  for (const batch of batches) for (const row of batch.sourceBeforeAfter.sources) if (row.changed)
    hashes.set(row.sourcePath, row.afterSha256)
  const packets = await Promise.all(batches.map(batch => bytes(batch.packetPath).then(JSON.parse)))
  const wanted = new Set(JSON.parse(await bytes(supplementPath)).sourceRefs.map(row => row[3]))
  for (const packet of packets) for (const op of Array.isArray(packet.operations) ? packet.operations : [])
    for (const evidence of op.locationRef?.evidence ?? []) if (evidence.jsonPointer) wanted.add(evidence.sourcePath)
  for (const path of wanted) {
    if (path === 'lore/regions/seoul-electoral-titles.json') continue
    const raw = (await promisify(execFile)('git', ['-C', root, 'show', `e9c12a43728a599c371d373088e177a446ff5051:${path}`],
      { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout
    values.set(path, JSON.parse(raw))
  }
  for (const packet of packets) for (const op of Array.isArray(packet.operations) ? packet.operations : []) {
    if (!values.has(op.file)) continue
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    let parent = values.get(op.file)
    for (const part of parts.slice(0, -1)) parent = parent[part]
    if (op.op === 'add') parent.splice(Number(parts.at(-1)), 0, structuredClone(op.value))
    else parent[parts.at(-1)] = structuredClone(op.value)
  }
  const files = new Map()
  for (const [path, value] of values) {
    const raw = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    expect(sha256(raw), path).toBe(hashes.get(path))
    files.set(resolve(root, path), raw)
  }
  capturedFixture = { batches, readBytes: path => files.get(path) ?? readCaptured(path) }
  return capturedFixture
}
const build = async (options = {}) => {
  const fixture = await candidateFixture()
  if (options.readBytes && !options.batches) await loadAppliedBatches(options.readBytes, root)
  const reader = options.readBytes ? async path => {
    const supplied = await options.readBytes(path)
    const original = await readCaptured(path)
    return sha256(supplied) === sha256(original) ? fixture.readBytes(path) : supplied
  } : fixture.readBytes
  return buildSeoulScopeActivationCandidates({ root, ...fixture, ...options, readBytes: reader })
}

async function changed(mutate) {
  const fixture = await candidateFixture()
  const batches = structuredClone(fixture.batches)
  const batch = batches.find(row => row.batchId === 'component-1')
  const packet = JSON.parse(await bytes(batch.packetPath))
  mutate(packet, { batches })
  const overrides = new Map([[resolve(root, batch.packetPath), Buffer.from(JSON.stringify(packet))],
    [resolve(root, registryPath), Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', batches }))]])
  batch.packetSha256 = sha256(overrides.get(resolve(root, batch.packetPath)))
  return build({ batches,
    readBytes: path => overrides.get(path) ?? fixture.readBytes(path) })
}

describe('private Seoul scope activation candidate bindings', () => {
  it('preserves 1,022 original people and 411 original rights without activating rows', async () => {
    const result = await build()
    const baseline = JSON.parse(await bytes('.omo/private/seoul-migration/baseline.json'))
    const scope = JSON.parse(pendingScope)
    expect(result.persons.map(row => row.personId)).toEqual(baseline.currentEntitySets.persons)
    expect(result.rightsDispositions).toHaveLength(411)
    expect(result.unresolvedOutside).toHaveLength(309)
    expect(result.persons.filter(row => !row.locationCandidates.length)).toHaveLength(0)
    expect(result.candidateCount).toBe(1099)
    expect(result.uniqueCandidatePersonCount).toBe(1022)
    expect(result.candidateCount).toBe(result.persons.reduce((sum, row) => sum + row.locationCandidates.length, 0))
    expect(result.uniqueCandidatePersonCount + result.persons.filter(row => !row.locationCandidates.length).length).toBe(1022)
    expect(new Set(result.persons.filter(row => row.locationCandidates.length).map(row => row.personId)).size).toBe(1022)
    for (const [id, slotId] of [['K1003', 'slot:region:1111067000'], ['K1004', 'slot:region:1111071000']]) {
      const person = result.persons.find(row => row.personId === id)
      expect(person.locationCandidates).toHaveLength(1)
      expect(person.locationCandidates[0]).toMatchObject({ slotId, use: 'residence', ownership: false })
    }
    expect(result.persons.find(row => row.personId === 'K373').locationCandidates.map(row => row.use)).toContain('work')
    expect(result.activation).toBe(false)
    expect(result.semanticReview).toBe('not-reviewed')
    expect(scope.entities.every(row => row.status === 'pending')).toBe(true)
    expect(scope.dispositions.every(row => row.status === 'pending')).toBe(true)
    expect(result.rightsDispositions.find(row => row.id === 'title:duchy-gu-11110-S06')).toMatchObject({
      disposition: 'retained-current', targetRefs: [{ id: 'title:duchy-gu-11110-S06' }],
    })
  })

  it('rejects a rehashed fabricated value at a valid registered but wrong pointer', async () => {
    await expect(changed(packet => {
      const loc = packet.operations.find(row => row.locationRef).locationRef
      const evidence = loc.evidence.find(row => row.sourcePath === 'lore/factions/Diaspora-Corridors.json')
      evidence.jsonPointer = '/content/14/items/7/ko'
      evidence.currentValue = 'fabricated current fact'
      evidence.currentValueSha256 = sha256(JSON.stringify(evidence.currentValue))
    })).rejects.toThrow('E_SCOPE_REF')
  })

  it('rejects a rehashed fabricated slot at a valid slot pointer', async () => {
    await expect(changed(packet => {
      const loc = packet.operations.find(row => row.locationRef).locationRef
      const evidence = loc.evidence.find(row => row.sourcePath === 'lore/regions/seoul-electoral-titles.json')
      evidence.currentValue.name = 'fabricated district'
      evidence.currentValueSha256 = sha256(JSON.stringify(evidence.currentValue))
    })).rejects.toThrow('E_SCOPE_REF')
  })

  it.each([
    ['missing original person', (_, registry) => { registry.batches.find(row => row.batchId === 'component-1').personIds[0] = 'K9999' }, 'E_CENSUS_PERSON'],
    ['blank location', packet => { packet.operations.find(row => row.locationRef).locationRef.dongId = '' }, null],
    ['outside location', packet => { packet.operations.find(row => row.locationRef).locationRef.dongId = 'region:4111153000' }, 'E_SCOPE_OUTSIDE'],
    ['outside station', packet => { packet.operations.find(row => row.locationRef && row.locationRef.stationRef).locationRef.stationRef = '대전역' }, 'E_SCOPE_OUTSIDE'],
    ['unregistered source', packet => { packet.operations.find(row => row.locationRef).locationRef.evidence[1].sourcePath = 'lore/unregistered.json' }, 'E_SCOPE_REF'],
    ['faction center as residence', packet => { const loc = packet.operations.find(row => row.locationRef).locationRef; loc.dongId = 'region:1111053000'; loc.slotId = 'slot:region:1111053000' }, null],
  ])('%s cannot become an authenticated candidate', async (_name, mutation, code) => {
    if (code) await expect(changed(mutation)).rejects.toThrow(code)
    else {
      const result = await changed(mutation)
      const person = result.persons.find(row => row.personId === 'K1013')
      expect(person.locationCandidates.some(row => row.ref === '' || row.ref === 'region:1111053000')).toBe(false)
      expect(person.evidenceGaps.length).toBeGreaterThan(0)
    }
  })

  it('rejects a fabricated rights holder and old approvalRef as a new right', async () => {
    const rightsPath = 'scripts/approved-seoul-rights-transition.json'
    const approval = JSON.parse(await bytes(rightsPath))
    approval.records.find(row => row.disposition === 'retained-current').current = { holderPersonId: 'K9999' }
    const overrides = new Map([[resolve(root, rightsPath), Buffer.from(JSON.stringify(approval))]])
    // The authenticated transition reads sealed bytes; changing an on-disk
    // approval alone is not a new owner decision or a successor grant.
    await expect(build({ readBytes: path => overrides.get(path) ?? readCaptured(path) })).rejects.toThrow(/^E_/)
    const result = await build()
    expect(result.rightsDispositions.every(row => row.promotion !== 'active' && !('approvalRef' in row))).toBe(true)
    expect(result.rightsDispositions.filter(row => row.disposition === 'retired-current').every(row =>
      row.targetRefs.length === 0 || row.targetRefs.every(ref => ref.jsonPointer.startsWith('/politicalIdentities/')))).toBe(true)
  })

  it.each([
    ['forged two-ref person identity', twoRefPath, receipt => { receipt.refs[0].personId = 'K1004' }],
    ['forged two-ref approval message', twoRefPath, receipt => { receipt.ownerApproval.messageRef = 'call_fake' }],
    ['rehash forged supplemental source value', supplementPath, supplement => {
      const valueIndex = supplement.refFields.indexOf('sourceValueSha256')
      supplement.sourceRefs[0][valueIndex] = sha256(JSON.stringify('fabricated current fact'))
    }],
  ])('rejects %s despite a locally coherent JSON override', async (_name, path, mutate) => {
    const artifact = JSON.parse(await bytes(path))
    mutate(artifact)
    const overrides = new Map([[resolve(root, path), Buffer.from(JSON.stringify(artifact))]])
    await expect(build({ readBytes: input => overrides.get(input) ?? readCaptured(input) })).rejects.toThrow(/^E_/)
  })
})
