import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, writeFile, rm, realpath, rename, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { runRelease } from './generate-release.mjs'
import { loadMapDataInput } from './map-data-input.mjs'
import { catalogWorldGraph } from './catalog-map-graph.mjs'
import { catalogMovementGraph, catalogPublicEdges } from './catalog-map-graph.mjs'

// Explicit setup acquires declared M main once. Tests never fetch or use sibling
// checkouts, protected DBs or a fabricated source-approval implementation.
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mapperRoot = process.env.WIKI_MAP_CONTRACT_ROOT ?? join(project, '.omo/map-contract')
const mapperRevision = execFileSync('git', ['-C', mapperRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const { createReleaseManifest } = await import(pathToFileURL(join(mapperRoot, 'scripts/janseon/release-manifest.mjs')))
const { semanticDigest } = await import(pathToFileURL(join(mapperRoot, 'scripts/janseon/canonical.mjs')))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const gate = async () => ({ complete: true, semanticReview: 'reviewed' })
const ref = domain => ({ domain, datasetId: 'synthetic:' + domain, editionId: 'one' })

async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'wiki-map-release-')))
  t.after(() => rm(root, { recursive: true, force: true }))
  const releaseRoot = join(root, 'release'), sourceFiles = {}, licenseFiles = {}
  const put = async (path, bytes) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes) }
  const store = async (id, bytes) => {
    sourceFiles[id] = join(root, 'inputs', id)
    await put(sourceFiles[id], bytes)
    return { contentId: id, sha256: sha(bytes) }
  }
  const official = { url: 'https://example.test/lines', retrievedAt: '2026-01-01', sha256: sha('official'), scope: 'synthetic' }
  const graph = {
    schema: 'seoul-world-graph-v2', districts: ['district'], stations: ['a', 'b'].map((id, i) =>
      ({ id, nameKo: id, nameEn: id, district: 'district', lat: 37 + i / 100, lon: 127 })),
    edges: [{ a: 'a', b: 'b' }], aliases: { alias: 'a' }, source: {
      original: 'synthetic source', railAdjacency: {
        revision: 'synthetic chronology', officialSource: official, WikiCommit: '1'.repeat(40), scope: 'no surface inference',
        replacements: [{
          originalIndex: 0, original: { a: 'a', b: 'b' }, status: 'replaced', chain: ['a', 'b'],
          officialCodes: ['1', '2'], lineId: 'line', source: official, physicalEvidenceBoundary: 'not passage approval'
        }],
        excluded: [], hubIdentities: [{ uid: 'hub', officialCodes: ['1'], permanentIds: ['a'], lineIds: ['line'], evidence: [], contract: 'synthetic evidence' }],
      }
    }
  }
  // Graph projection identity is not the raw document digest or the member hash.
  const graphSemantic = semanticDigest({
    schema: 'janseon-graph-semantic.v1', datasetId: ref('graph').datasetId,
    editionId: 'one', document: { ...graph, aliases: Object.entries(graph.aliases) }
  })
  const license = await store('license', 'synthetic license'); licenseFiles.synthetic = sourceFiles.license
  const identityReceipt = await store('identity', 'synthetic identity bytes')
  const migrationReceipt = await store('migration', 'synthetic migration receipt')
  const approval = await store('approval', 'synthetic receipt; not publication approval')
  const snapshot = await store('snapshot', 'synthetic snapshot; never opened as DB')
  const specs = [
    ['wiki/map-core.json', 'map-core', ['graph']], ['wiki/observed-geography.json', 'observed-geography', ['observed-geography']],
    ['wiki/spatial-assignments.json', 'spatial-assignments', ['initial-state']], ['wiki/station-bindings.json', 'station-bindings', ['graph']],
    ['wiki/underground-geometry.json', 'underground-geometry', ['graph']], ['game/world-graph.json', 'world-graph', ['graph']],
    ['game/map-topology.json', 'map-topology', ['observed-geography']], ['game/initial-world.json', 'initial-world', ['graph', 'initial-state']],
    ['game/terrain-manifest.json', 'terrain-manifest', ['observed-geography']],
  ].sort(([a], [b]) => a < b ? -1 : 1)
  const members = []
  for (const [path, kind, roles] of specs) {
    const value = path === 'game/world-graph.json' ? graph : path === 'wiki/map-core.json'
      ? {
        schema: 'janseon-typed-map-projection.v1', kind, data: graph,
        sourceRows: [{ editionRef: ref('graph'), rowsSha256: semanticDigest(graph) }]
      }
      : { synthetic: path, entries: ['transport-only; not interpreted in this graph milestone'] }
    const { canonicalEncode } = await import(pathToFileURL(join(mapperRoot, 'scripts/janseon/canonical.mjs')))
    const bytes = canonicalEncode(value) + '\n'
    await put(join(releaseRoot, path), bytes)
    members.push({
      path, kind, target: path.split('/')[0], sizeBytes: Buffer.byteLength(bytes), rawSha256: sha(bytes), visibility: 'public',
      license: { id: 'synthetic', textSha256: license.sha256 }, identitySnapshotSha256: sha('identity'), editionRefs: roles.map(ref)
    })
  }
  const domains = ['graph', 'initial-state', 'observed-geography']
  const semantic = {
    schema: 'janseon-map-release-semantic.v1', projectionContract: 'janseon-map-release-projection.v1',
    mapSemanticSha256: sha('map'), identitySnapshotSha256: sha('identity'), editions: domains.map(domain =>
      ({ ...ref(domain), semanticSha256: domain === 'graph' ? graphSemantic : sha(domain) })),
    domains: {
      graph: { semanticSha256: graphSemantic, editionRefs: [ref('graph')] },
      geometry: { semanticSha256: sha('geometry'), editionRefs: [ref('observed-geography')] },
      initialState: { semanticSha256: sha('state'), editionRefs: [ref('initial-state')] }
    }, targets: ['wiki', 'game'],
    targetAllowlists: Object.fromEntries(['wiki', 'game'].map(target => [target, members.filter(m => m.target === target).map(m => m.path)])), members
  }
  const budget = {
    schema: 'janseon-map-release-budget.v1', migrationReceipt,
    members: members.map(m => ({ path: m.path, maxBytes: m.sizeBytes })), maxTotalBytes: members.reduce((n, m) => n + m.sizeBytes, 0)
  }
  const sourceReceipts = []
  for (const domain of domains) sourceReceipts.push({ editionRef: ref(domain), receipt: await store(domain, 'source:' + domain) })
  const provenance = {
    sourceCommit: '1'.repeat(40), exporter: { revision: '2'.repeat(40), version: 'synthetic' },
    snapshot: { contentId: snapshot.contentId, databaseSha256: snapshot.sha256, mapSemanticSha256: semantic.mapSemanticSha256 },
    identityReceipt, sourceReceipts, approvalReceipts: [{ memberPaths: members.map(m => m.path), receipt: approval }],
    budgetReceipt: await store('budget', JSON.stringify(budget)), memberLocations: members.map(m => ({ path: m.path, storage: 'git', contentId: null }))
  }
  // The budget receipt uses canonical bytes, as required by the real M contract.
  const { canonicalEncode } = await import(pathToFileURL(join(mapperRoot, 'scripts/janseon/canonical.mjs')))
  provenance.budgetReceipt = await store('budget', canonicalEncode(budget))
  const manifest = createReleaseManifest({ semantic, provenance }, { expectedTargets: ['wiki', 'game'], budget })
  const manifestBytes = JSON.stringify(manifest)
  await put(join(releaseRoot, 'release-manifest.json'), manifestBytes)
  const request = {
    schema: 'janseon-wiki-map-input.v1', mapperRoot, mapperRevision, releaseRoot, manifestSha256: sha(manifestBytes),
    lock: {
      mapReleaseId: manifest.mapReleaseId, deliveryReceiptId: manifest.deliveryReceiptId, sourceCommit: provenance.sourceCommit,
      exporterRevision: provenance.exporter.revision, snapshotContentId: snapshot.contentId, databaseSha256: snapshot.sha256,
      mapSemanticSha256: semantic.mapSemanticSha256, identitySnapshotSha256: semantic.identitySnapshotSha256
    }, sourceFiles, licenseFiles
  }
  const requestPath = join(root, 'request.json'); await put(requestPath, JSON.stringify(request))
  const liveRoot = join(root, 'wiki'); await put(join(liveRoot, 'public/opening-territories.json'), 'old territories')
  await put(join(liveRoot, 'public/underground-detail.json'), 'old underground')
  const options = {
    root: liveRoot, gate, mapRequestPath: requestPath, ownership: async (_, path) =>
      path === 'public/opening-territories.json' ? sha('old territories') : null
  }
  const reseal = async () => {
    const graph = await catalogWorldGraph(input, () => { throw new Error('legacy graph fallback'); });
    const bytes = await readFile(join(releaseRoot, member.path))
    member.rawSha256 = sha(bytes); member.sizeBytes = bytes.length
  }
  budget.members = manifest.semantic.members.map(m => ({ path: m.path, maxBytes: m.sizeBytes }))
  budget.maxTotalBytes = manifest.semantic.members.reduce((n, m) => n + m.sizeBytes, 0)
  manifest.provenance.budgetReceipt = await store('budget', canonicalEncode(budget))
  Object.assign(manifest, createReleaseManifest({ semantic: manifest.semantic, provenance: manifest.provenance }, { expectedTargets: ['wiki', 'game'], budget }))
  const bytes = JSON.stringify(manifest)
  await put(join(releaseRoot, 'release-manifest.json'), bytes)
  Object.assign(request.lock, { mapReleaseId: manifest.mapReleaseId, deliveryReceiptId: manifest.deliveryReceiptId })
  request.manifestSha256 = sha(bytes)
  await put(requestPath, JSON.stringify(request))
}
return { root, graph, request, requestPath, manifest, options, put, reseal }
}

async function stageGraph({ run }, root) {
  // Real stage worker auth + actual catalog read boundary + actual loader.
  await run([process.execPath, '--input-type=module', '-e', `
    import { generatorStage } from ${JSON.stringify(new URL('./generate-release.mjs', import.meta.url).href)};
    import { catalogWorldGraph, catalogMovementGraph, catalogPublicEdges } from ${JSON.stringify(new URL('./catalog-map-graph.mjs', import.meta.url).href)};
    import { loadMapDataInput } from ${JSON.stringify(new URL('./map-data-input.mjs', import.meta.url).href)};
    import { join } from 'node:path';
    import { mkdir } from 'node:fs/promises';
    const input = await loadMapDataInput(process.env.WIKI_MAP_RELEASE_REQUEST);
    const graph = await catalogWorldGraph(input, () => { throw new Error('legacy graph fallback'); });
    const regular = { edges: [{ a: 'a', b: 'b', lineIds: ['line'], sourceCodes: [] }], linesByStation: new Map(), omitted: [] };
    const movement = catalogMovementGraph(input, regular, id => id, []);
    const edges = catalogPublicEdges(movement, new Set(graph.stations.map(s => s.id)), new Map(),
      () => ({ polityIds: [], status: 'unknown' }), () => [], {}, () => 'unknown');
    const stage = await generatorStage(${JSON.stringify(root)});
    await mkdir(join(stage.root, 'src/generated-private'), { recursive: true });
    await stage.writeFile(join(stage.root, 'public/opening-territories.json'), JSON.stringify({ stations: graph.stations, edges }));
    await stage.writeFile(join(stage.root, 'src/generated-private/catalog-graph.json'), JSON.stringify(graph));
  `])
}

test('complete explicit release reaches actual staged catalog native graph boundary with evidence intact', async t => {
  const f = await fixture(t)
  await runRelease({ ...f.options, stage: context => stageGraph(context, f.options.root) })
  assert.deepEqual(JSON.parse(await readFile(join(f.options.root, 'src/generated-private/catalog-graph.json'))), f.graph)
  assert.deepEqual(JSON.parse(await readFile(join(f.options.root, 'public/opening-territories.json'))).edges.map(({ a, b }) => ({ a, b })), f.graph.edges)
  assert.equal(await readFile(join(f.options.root, 'public/underground-detail.json'), 'utf8'), 'old underground')
  const receipt = await readFile(join(f.options.root, 'src/generated-private/map-input-receipt.json'), 'utf8')
  assert.equal(JSON.parse(receipt).members.length, 9)
  assert.equal(JSON.parse(receipt).sourceApproval, 'NOT_EVALUATED')
  assert.ok(!receipt.includes(f.root) && !receipt.includes(mapperRoot))
})

for (const lane of ['member', 'identity', 'license', 'mixed-lock', 'partial', 'reduced-graph']) test(`explicit ${lane} rejects before stage or output mutation`, async t => {
  const f = await fixture(t)
  if (lane === 'member') await writeFile(join(f.request.releaseRoot, 'wiki/map-core.json'), 'tamper')
  if (lane === 'identity' || lane === 'license') await writeFile(f.request.sourceFiles[lane], 'tamper')
  if (lane === 'mixed-lock') { f.request.lock.deliveryReceiptId = '0'.repeat(64); await writeFile(f.requestPath, JSON.stringify(f.request)) }
  if (lane === 'partial') await rm(join(f.request.releaseRoot, 'game/terrain-manifest.json'))
  if (lane === 'reduced-graph') {
    await assert.rejects(catalogWorldGraph(null, () => { throw new Error('legacy called'); }), /legacy called/)
    await writeFile(join(f.request.releaseRoot, 'game/world-graph.json'), JSON.stringify({ stations: f.graph.stations, edges: f.graph.edges }))
  }
  await assert.rejects(runRelease({ ...f.options, stage: () => assert.fail('stage ran') }))
  assert.equal(await readFile(join(f.options.root, 'public/opening-territories.json'), 'utf8'), 'old territories')
  await assert.rejects(readFile(join(f.options.root, '.generate-release-transaction/context.json')), { code: 'ENOENT' })
})

for (const lane of ['request', 'member', 'identity', 'license', 'replace-file', 'symlink']) test(`late ${lane} drift rejects staged graph and preserves old output`, async t => {
  const f = await fixture(t)
  await assert.rejects(runRelease({
    ...f.options, stage: async context => {
      await stageGraph(context, f.options.root)
      const path = lane === 'request' ? f.requestPath : lane === 'member' ? join(f.request.releaseRoot, 'wiki/map-core.json') : f.request.sourceFiles.identity
      if (lane === 'replace-file') { await rename(path, path + '.old'); await writeFile(path, await readFile(path + '.old')) }
      else if (lane === 'symlink') { await rename(path, path + '.old'); await symlink(path + '.old', path) }
      else await writeFile(lane === 'license' ? f.request.licenseFiles.synthetic : path, 'changed during stage')
    }
  }), /E_MAP_DRIFT/)
  assert.equal(await readFile(join(f.options.root, 'public/opening-territories.json'), 'utf8'), 'old territories')
  await assert.rejects(readFile(join(f.options.root, 'src/generated-private/map-input-receipt.json')), { code: 'ENOENT' })
})

test('publication denial remains mandatory even for complete valid release', async t => {
  const f = await fixture(t)
  await assert.rejects(runRelease({
    ...f.options, gate: async () => { throw new Error('E_SCOPE_PENDING') },
    stage: () => assert.fail('stage bypassed publication')
  }), /E_SCOPE_PENDING/)
  await assert.rejects(readFile(join(f.options.root, '.generate-release.lock')), { code: 'ENOENT' })
  assert.equal(await readFile(join(f.options.root, 'public/opening-territories.json'), 'utf8'), 'old territories')
})

test('publication pending is first failure even for missing explicit release request', async t => {
  const f = await fixture(t)
  await assert.rejects(runRelease({
    ...f.options, mapRequestPath: join(f.root, 'does-not-exist.json'),
    gate: async () => { throw new Error('E_SCOPE_PENDING') }, stage: () => assert.fail('stage ran')
  }), /E_SCOPE_PENDING/)
  await assert.rejects(readFile(join(f.options.root, '.generate-release.lock')), { code: 'ENOENT' })
})

test('actual catalog public projection honors supplied edge removal instead of SQLite adjacency', () => {
  test('no-request catalog still uses the exact legacy typed read seam', async () =>
  const movement = catalogMovementGraph({ graph: { edges: [] } }, regular, id => id, [])
    const edges = catalogPublicEdges(movement, new Set(['a', 'b']), new Map(), () => ({ polityIds: [], status: 'unknown' }), () => [], {}, () => 'unknown')
    assert.equal(await catalogWorldGraph(null, read => { called = typeof read === 'function'; return sentinel }), sentinel)
  })

  test('staged production public projection publishes changed release edges and preserves no-request projection', async t => {
    const f = await fixture(t)
    const corePath = join(f.request.releaseRoot, 'wiki/map-core.json')
    const core = JSON.parse(await readFile(corePath)); core.data.edges = []
    core.sourceRows[0].rowsSha256 = semanticDigest(core.data)
    await writeFile(corePath, JSON.stringify(core))
    await writeFile(join(f.request.releaseRoot, 'game/world-graph.json'), JSON.stringify(core.data))
    const g = f.manifest.semantic.editions.find(e => e.domain === 'graph')
    g.semanticSha256 = semanticDigest({
      schema: 'janseon-graph-semantic.v1', datasetId: g.datasetId, editionId: g.editionId,
      document: { ...core.data, aliases: Object.entries(core.data.aliases) }
    })
    f.manifest.semantic.domains.graph.semanticSha256 = g.semanticSha256
    await f.reseal()
    await runRelease({ ...f.options, stage: context => stageGraph(context, f.options.root) })
    assert.deepEqual(JSON.parse(await readFile(join(f.options.root, 'public/opening-territories.json'))).edges, [])
    const regular = { edges: [{ a: 'a', b: 'b', lineIds: ['line'], sourceCodes: [] }], linesByStation: new Map(), omitted: [] }
    assert.equal(catalogMovementGraph(null, regular, id => id, []), regular)
    const expected = catalogPublicEdges(regular, new Set(['a', 'b']), new Map(), () => ({ polityIds: [], status: 'unknown' }), () => [], {}, () => 'unknown')
    await runRelease({
      ...f.options, mapRequestPath: undefined, stage: async ({ write, mapInput }) => {
        assert.equal(mapInput, null)
        const graph = catalogMovementGraph(mapInput, regular, id => id, [])
        const edges = catalogPublicEdges(graph, new Set(['a', 'b']), new Map(), () => ({ polityIds: [], status: 'unknown' }), () => [], {}, () => 'unknown')
        await write('public/opening-territories.json', JSON.stringify({ edges }))
      }
    })
    assert.deepEqual(JSON.parse(await readFile(join(f.options.root, 'public/opening-territories.json'))).edges, expected)
  })

  test('no-request catalog still uses the exact legacy typed read seam', () => {
    let called = false
    const sentinel = { legacy: true }
    assert.equal(await catalogWorldGraph(null, read => { called = typeof read === 'function'; return sentinel }), sentinel)
    assert.equal(called, true)
  })

  for (const fault of ['reduced', 'dangling', 'private-field', 'wrong-source-digest', 'mixed-graph']) test(`coherently rehashed ${fault} graph cannot bypass native catalog projection`, async t => {
    const f = await fixture(t)
    const corePath = join(f.request.releaseRoot, 'wiki/map-core.json')
    const core = JSON.parse(await readFile(corePath))
    if (fault === 'reduced') delete core.data.source
    if (fault === 'dangling') core.data.edges[0].b = 'unknown'
    if (fault === 'private-field') core.data.privateApprovalBody = 'must reject'
    if (fault === 'wrong-source-digest') core.sourceRows[0].rowsSha256 = '0'.repeat(64)
    if (fault === 'mixed-graph') core.data.stations[0].lat += 0.01
    await writeFile(corePath, JSON.stringify(core))
    await f.reseal()
    await assert.rejects(runRelease({ ...f.options, stage: () => assert.fail('invalid native graph staged') }), /E_(?:MAP_GRAPH|WORLD_GRAPH|MAP_INPUT)/)
    assert.equal(await readFile(join(f.options.root, 'public/opening-territories.json'), 'utf8'), 'old territories')
  })

  test('coherently rehashed reversed game aliases reject ordered graph disagreement before staging', async t => {
    const f = await fixture(t)
    const corePath = join(f.request.releaseRoot, 'wiki/map-core.json')
    const gamePath = join(f.request.releaseRoot, 'game/world-graph.json')
    const core = JSON.parse(await readFile(corePath))
    core.data.aliases = { z: 'a', a: 'b' }
    core.sourceRows[0].rowsSha256 = semanticDigest(core.data)
    await writeFile(corePath, JSON.stringify(core))
    await writeFile(gamePath, JSON.stringify(core.data))
    const edition = f.manifest.semantic.editions.find(row => row.domain === 'graph')
    edition.semanticSha256 = semanticDigest({
      schema: 'janseon-graph-semantic.v1', datasetId: edition.datasetId,
      editionId: edition.editionId, document: { ...core.data, aliases: Object.entries(core.data.aliases) }
    })
    f.manifest.semantic.domains.graph.semanticSha256 = edition.semanticSha256
    await f.reseal()
    const valid = await loadMapDataInput(f.requestPath)
    assert.deepEqual(Object.entries(valid.graph.aliases), [['z', 'a'], ['a', 'b']])
    await writeFile(gamePath, JSON.stringify({ ...core.data, aliases: { a: 'b', z: 'a' } }))
    await f.reseal()
    await assert.rejects(runRelease({ ...f.options, stage: () => assert.fail('disagreeing graph staged') }),
      /E_MAP_GRAPH:wiki\/game mismatch/)
    assert.equal(await readFile(join(f.options.root, 'public/opening-territories.json'), 'utf8'), 'old territories')
    await assert.rejects(readFile(join(f.options.root, '.generate-release-transaction/context.json')), { code: 'ENOENT' })
  })

  test('publication revocation after valid graph stage preserves every prior output', async t => {
    const f = await fixture(t)
    let calls = 0
    await assert.rejects(runRelease({
      ...f.options, gate: async () => {
        if (++calls === 3) throw new Error('E_SCOPE_REVOKED')
      }, stage: context => stageGraph(context, f.options.root)
    }), /E_SCOPE_REVOKED/)
    assert.equal(calls, 3)
    assert.equal(await readFile(join(f.options.root, 'public/opening-territories.json'), 'utf8'), 'old territories')
    await assert.rejects(readFile(join(f.options.root, 'src/generated-private/map-input-receipt.json')), { code: 'ENOENT' })
  })

  test('real mapper builder with nonlexical aliases reaches production catalog projection', async t => {
    const producerRoot = process.env.WIKI_MAP_PRODUCER_ROOT ?? mapperRoot
    const fromProducer = name => import(pathToFileURL(join(producerRoot, 'scripts/janseon', name)))
    const { fixture: commandFixture } = await fromProducer('command-store-fixture.mjs')
    const { centralInputs } = await fromProducer('central-store-fixture.mjs')
    const { readCommandReleaseSource } = await fromProducer('command-store.mjs')
    const { buildMapRelease } = await fromProducer('build-map-release.mjs')
    const { canonicalEncode } = await fromProducer('canonical.mjs')
    const f = await fixture(t), input = centralInputs()
    input.graph.document.aliases = { z: 'é', a: 'é' }
    const graphBytes = Buffer.from(JSON.stringify(input.graph.document) + '\n')
    Object.assign(input.graph.expectedBinding, { expected_source_sha256: sha(graphBytes), expected_document_sha256: sha(JSON.stringify(input.graph.document)), expected_byte_length: graphBytes.length })
    Object.assign(input.graph.sourceReceipt, { source_sha256: sha(graphBytes), document_sha256: sha(JSON.stringify(input.graph.document)), byte_length: graphBytes.length })
    const databasePath = join(f.root, 'builder.sqlite'), source = commandFixture(t, databasePath, input)
    const current = readCommandReleaseSource(source.db, source.binding)
    const reference = (domain, value) => ({ domain, datasetId: value.datasetId, editionId: value.editionId })
    const sourceRows = [
      { editionRef: reference('graph', current.central.graph), rowsSha256: semanticDigest(current.central.graph.document) },
      { editionRef: reference('initial-state', current.authored), rowsSha256: semanticDigest(current.authored) },
      { editionRef: reference('observed-geography', current.central.observedGeography), rowsSha256: semanticDigest(current.central.observedGeography.rows) },
    ]
    const contents = [current.central.graph.document, current.authored, current.central.observedGeography.rows]
    const paths = f.manifest.semantic.members.map(m => m.path)
    const migrationReceipt = { contentId: 'migration', sha256: sha(await readFile(f.request.sourceFiles.migration)) }
    const budget = {
      schema: 'janseon-map-release-budget.v1', migrationReceipt,
      members: paths.map(path => ({ path, maxBytes: 1000000 })), maxTotalBytes: 9000000
    }
    const budgetBytes = canonicalEncode(budget)
    await writeFile(f.request.sourceFiles.budget, budgetBytes)
    f.request.sourceFiles.snapshot = databasePath
    const provenance = {
      ...f.manifest.provenance,
      snapshot: { contentId: 'snapshot', databaseSha256: sha(await readFile(databasePath)), mapSemanticSha256: semanticDigest({ schema: 'janseon-release-map.v1', central: current.central.centralSemanticSha256, authored: current.authored.semanticSha256 }) },
      budgetReceipt: { contentId: 'budget', sha256: sha(budgetBytes) }, sourceReceipts: sourceRows.map(row => ({
        editionRef: row.editionRef,
        receipt: { contentId: row.editionRef.domain, sha256: row.rowsSha256 }
      }))
    }
    for (let i = 0; i < sourceRows.length; i++) await writeFile(f.request.sourceFiles[sourceRows[i].editionRef.domain], canonicalEncode(contents[i]))
    const result = buildMapRelease({
      databasePath, binding: source.binding, provenance,
      context: { expectedTargets: ['wiki', 'game'], budget }, sourceRows, license: f.manifest.semantic.members[0].license
    })
    for (const [path, bytes] of Object.entries(result.members)) await writeFile(join(f.request.releaseRoot, path), bytes)
    await writeFile(join(f.request.releaseRoot, 'release-manifest.json'), result.manifestBytes)
    Object.assign(f.request, {
      manifestSha256: sha(result.manifestBytes), lock: {
        mapReleaseId: result.manifest.mapReleaseId,
        deliveryReceiptId: result.manifest.deliveryReceiptId, sourceCommit: provenance.sourceCommit, exporterRevision: provenance.exporter.revision,
        snapshotContentId: 'snapshot', databaseSha256: provenance.snapshot.databaseSha256, mapSemanticSha256: provenance.snapshot.mapSemanticSha256,
        identitySnapshotSha256: result.manifest.semantic.identitySnapshotSha256
      }
    })
    await writeFile(f.requestPath, JSON.stringify(f.request))
    await runRelease({
      ...f.options, stage: async ({ mapInput, write }) => {
        const graph = await catalogWorldGraph(mapInput, () => assert.fail('legacy fallback'))
        assert.deepEqual(Object.entries(graph.aliases), [['z', 'é'], ['a', 'é']])
        const regular = { edges: [{ a: 'é', b: 'é', lineIds: ['line'], sourceCodes: [] }], linesByStation: new Map(), omitted: [] }
        const movement = catalogMovementGraph(mapInput, regular, id => id, [])
        const edges = catalogPublicEdges(movement, new Set(graph.stations.map(s => s.id)), new Map(),
          () => ({ polityIds: [], status: 'unknown' }), () => [], {}, () => 'unknown')
        await write('public/opening-territories.json', JSON.stringify({ edges }))
      }
    })
    const published = JSON.parse(await readFile(join(f.options.root, 'public/opening-territories.json')))
    assert.deepEqual(published.edges.map(({ a, b }) => [a, b]), [['é', 'é']])
  })
