import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { publicAdmission, seedRowAdmitted } from './public-admission.mjs'
import { admissionDocuments, catalogSourceEligible, publishedDocuments } from './catalog-publication.mjs'
import { assertSnapshotBinding, parseSeedLine } from './seed-lossless.mjs'
import { exportSeeds } from './seed-export.mjs'
import { checkRenderSnapshot, checkSeeds } from './check-render-snapshot.mjs'
import { jsonBytes, renderExport, sha256 } from './render-export.mjs'
import { atomicJson, compareSnapshot, ledgerDigest, producerTimestamp, promoteSnapshot, publicReceipt } from './project-public-snapshot.mjs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const registry = { categories: [{ id: 'world', label: '세계', requiredKinds: ['paragraph'] }] }
const identity = (id, extra = {}) => ({ source_id: id, document_id: `doc:${id}`, domain: 'world', status: 'approved', corpus_kind: 'current', logical_path: `lore/world/Page${id}.json`, excluded: false, ...extra })
const page = (id, extra = {}) => ({ path: `lore/world/Page${id}.json`, slug: `Page${id}`, value: {
  id: `doc:${id}`, domain: 'world', status: 'approved', categories: ['world'],
  source: { kind: 'original', refs: ['public-origin'] },
  locales: { ko: { title: '제목', summary: '요약' }, en: { title: 'Title', summary: 'Summary' } },
  content: [{ kind: 'paragraph' }], ...extra,
} })
const admitted = () => publicAdmission({ identities: [identity(1)], pages: [page(1)], registry })
const closure = () => ({ sourceIds: new Set(['1', '9223372036854775807']), personIds: new Set(['person-0001']), regionPaths: new Set(['lore/regions/public.json']), glossaryRevision: 'current', glossaryTerms: new Set(['public']) })
const write = async (root, path, bytes) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes) }
const temp = async t => { const path = await mkdtemp(join(tmpdir(), 'wiki-public-fixture-')); t.after(() => rm(path, { recursive: true, force: true })); return path }

test('oracle delegates publication policy; category-valid drafts stay public after head edit', () => {
  const identities = [identity(1, { status: 'draft', head: 2, admission: 'old' }), identity(2), identity(3, { excluded: true }), identity(4, { logical_path: 'lore/editorial/private.json' })]
  const pages = [page(1, { status: 'draft' }), page(2, { status: 'draft', categories: ['unknown'] }), page(3), page(4)]
  const result = publicAdmission({ identities, pages, registry })
  assert.deepEqual(result.documents.map(row => row.route), ['/world/Page1'])
  const delegated = admissionDocuments(registry)
  delegated.addPage(pages[0])
  assert.deepEqual(publishedDocuments(delegated.sorted()).map(row => row.route), ['/world/Page1'])
  assert.equal(catalogSourceEligible(identities[3]), false)
})

test('unadmitted, excluded, invalid approved and retired articles cannot enter inventory', () => {
  const retiredIdentity = identity(5, { logical_path: 'lore/characters/Core-Characters.json' })
  const retiredPage = { ...page(5), path: retiredIdentity.logical_path, slug: 'Core-Characters' }
  const result = publicAdmission({ identities: [identity(1), identity(2, { status: 'excluded' }), retiredIdentity], pages: [page(1, { categories: ['unknown'] }), page(2), retiredPage], registry })
  assert.deepEqual(result.documents, [])
})

test('closure excludes private source, person, region and glossary rows', () => {
  const c = closure()
  assert.equal(seedRowAdmitted('text_document_slot', { source_id: 9, text: 'UNADMITTED_SENTINEL' }, c), false)
  assert.equal(seedRowAdmitted('text_document_slot', { source_id: 1, text: 'public' }, c), true)
  assert.equal(seedRowAdmitted('person', { person_id: 'person-9999' }, c), false)
  assert.equal(seedRowAdmitted('region_content_document', { logical_path: 'private' }, c), false)
  assert.equal(seedRowAdmitted('glossary_locale', { revision_id: 'old', term_id: 'public' }, c), false)
  assert.equal(seedRowAdmitted('glossary_locale', { revision_id: 'current', term_id: 'private' }, c), false)
})

test('snapshot bindings reject mismatched snapshot or database', () => {
  const expected = { id: '00000001-00000002-1', database: 'seoul_scratch_fixture', databaseOid: '123' }
  assertSnapshotBinding(expected, { ...expected })
  for (const key of ['id', 'database', 'databaseOid']) assert.throws(() => assertSnapshotBinding(expected, { ...expected, [key]: 'different' }), /E_PUBLIC_SNAPSHOT_MISMATCH/u)
})

function executor(lines, table = 'text_document_slot') {
  return { async jsonLines(sql) {
    if (sql.includes('information_schema.tables')) return [JSON.stringify({ table_name: table })]
    if (sql.includes('information_schema.columns')) return [JSON.stringify({ table_name: table, column_name: 'source_id', data_type: 'bigint' }), JSON.stringify({ table_name: table, column_name: 'text', data_type: 'text' })]
    if (sql.includes('pg_index')) return [JSON.stringify({ table_name: table, attname: 'source_id' })]
    assert.match(sql, /ORDER BY "source_id"/u)
    return lines
  } }
}

test('bigint, quotes, null and bytea seed bytes remain lossless and deterministic', async t => {
  const root = await temp(t), a = join(root, 'a'), b = join(root, 'b')
  const line = '{"source_id":9223372036854775807,"text":"quote \\\" \\n \\uac00","bytea":"\\\\x00ff","nullable":null}'
  assert.equal(parseSeedLine(line).source_id, 9223372036854775807n)
  assert.equal(parseSeedLine('{"source_id":-9223372036854775808}').source_id, -9223372036854775808n)
  for (const out of [a, b]) await exportSeeds({ out, executor: executor([line, '{"source_id":9,"text":"UNADMITTED_SENTINEL"}']), closure: closure() })
  assert.equal(await readFile(join(a, 'current-documents/text_document_slot.jsonl'), 'utf8'), `${line}\n`)
  assert.equal(await readFile(join(a, 'manifest.json'), 'utf8'), await readFile(join(b, 'manifest.json'), 'utf8'))
  await exportSeeds({ out: a, check: true, executor: executor([line]), closure: closure() })
  await checkSeeds(a)
  await write(a, 'extra.jsonl', '{}\n')
  await assert.rejects(exportSeeds({ out: a, check: true, executor: executor([line]), closure: closure() }), /E_SEED_DRIFT/u)
})

test('partial seed promotion remains blocked until successful full rerun', async t => {
  const out = await temp(t), lines = ['{"source_id":1,"text":"public"}']
  await assert.rejects(exportSeeds({ out, executor: executor(lines), checkpoint: async phase => { if (phase === 'promotion') throw new Error('injected-interruption') } }), /injected-interruption/u)
  await assert.rejects(checkSeeds(out), /E_PUBLIC_PROMOTE_PENDING/u)
  await exportSeeds({ out, executor: executor(lines) })
  await checkSeeds(out)
})

async function fixture(root, text = '공개 본문') {
  const body = { slug: 'Page1', title: '제목', route: '/world/Page1', reviewText: text, blocks: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }] }
  const documents = [{ route: body.route, title: body.title, slug: body.slug, contentRef: 'src/generated/world/Page1.json' }]
  const outputs = {
    'src/generated/world/Page1.json': jsonBytes(body),
    'src/generated/publication-manifest.json': jsonBytes({ documents, categories: [{ route: '/categories/world' }] }),
    'src/generated/wikiCatalog.ts': 'export const wikiCatalog = []\n',
    'public/wiki-contract.json': jsonBytes({ documents }),
    'src/generated-private/secret.json': 'PRIVATE_SENTINEL',
  }
  await write(root, 'artifact-allowlist.json', jsonBytes({ rootFiles: ['wiki-contract.json'], directories: {} }))
  for (const [path, bytes] of Object.entries(outputs)) await write(root, path, bytes)
  const ownership = jsonBytes({ schema: 1, files: Object.entries(outputs).map(([path, bytes]) => ({ path, sha256: sha256(bytes) })) })
  await write(root, 'src/generated-private/generation-release-manifest.json', ownership)
  return { format: 'wiki-checked-build/1', status: 'passed', generationManifestSha256: sha256(ownership), checkedBuildArtifactDigest: `sha256:${'a'.repeat(64)}` }
}

test('complete public render inventory is deterministic and excludes private outputs', async t => {
  const root = await temp(t), receipt = await fixture(root)
  const a = join(root, 'a'), b = join(root, 'b')
  for (const out of [a, b]) {
    await renderExport({ root, out, admission: admitted(), receipt, tracked: new Set() })
    const report = await checkRenderSnapshot({ root, snapshot: out, admission: admitted() })
    assert.equal(report.coverage, 1); assert.equal(report.privateSentinels, 0); assert.equal(report.danglingRefs, 0)
  }
  assert.equal(await readFile(join(a, 'manifest.json'), 'utf8'), await readFile(join(b, 'manifest.json'), 'utf8'))
  assert.doesNotMatch(await readFile(join(a, 'manifest.json'), 'utf8'), /generated-private|secret/u)
})

test('missing output, private sentinel, unadmitted output and dangling links fail closed', async t => {
  const root = await temp(t)
  let receipt = await fixture(root, 'PRIVATE_SENTINEL')
  await assert.rejects(renderExport({ root, out: join(root, 'private'), admission: admitted(), receipt, tracked: new Set() }), /E_RENDER_PRIVATE_SENTINEL/u)
  receipt = await fixture(root)
  await rm(join(root, 'src/generated/world/Page1.json'))
  await assert.rejects(renderExport({ root, out: join(root, 'missing'), admission: admitted(), receipt, tracked: new Set() }), /ENOENT/u)
  receipt = await fixture(root)
  await assert.rejects(renderExport({ root, out: join(root, 'unadmitted'), admission: { documents: [] }, receipt, tracked: new Set() }), /E_PUBLIC_ROUTE_COVERAGE/u)
  const out = join(root, 'valid')
  await renderExport({ root, out, admission: admitted(), receipt, tracked: new Set() })
  const manifest = JSON.parse(await readFile(join(out, 'manifest.json')))
  manifest.routes[0].files.push('public/missing.json')
  await write(out, 'manifest.json', jsonBytes(manifest))
  await assert.rejects(checkRenderSnapshot({ root, snapshot: out }), /E_RENDER_DANGLING_REF/u)
})

test('tampering, extra output and incomplete review coverage are rejected', async t => {
  const root = await temp(t), receipt = await fixture(root), out = join(root, 'render')
  await renderExport({ root, out, admission: admitted(), receipt, tracked: new Set() })
  await write(out, 'extra.txt', 'extra')
  await assert.rejects(checkRenderSnapshot({ root, snapshot: out }), /E_RENDER_EXTRA_FILE/u)
  await rm(join(out, 'extra.txt'))
  const manifest = JSON.parse(await readFile(join(out, 'manifest.json')))
  const route = manifest.routes.find(row => row.kind === 'document')
  const saved = route.files
  route.files = route.files.filter(path => !path.startsWith('documents/'))
  await write(out, 'manifest.json', jsonBytes(manifest))
  await assert.rejects(checkRenderSnapshot({ root, snapshot: out }), /E_RENDER_DOCUMENT_COVERAGE/u)
  route.files = saved
  await write(out, 'manifest.json', jsonBytes(manifest))
  await write(out, 'documents/Page1.md', 'tampered')
  await assert.rejects(checkRenderSnapshot({ root, snapshot: out }), /E_RENDER_HASH/u)
})

test('public receipt and protected ledger sidecar use pinned exact names and digests', async t => {
  const value = publicReceipt({ producerCodeRef: 'a'.repeat(40), producedAt: '2026-11-07T00:00:00.000Z', seedManifestSha256: `sha256:${'b'.repeat(64)}`, renderManifestSha256: `sha256:${'c'.repeat(64)}`, checkedBuildArtifactDigest: `sha256:${'d'.repeat(64)}` })
  assert.deepEqual(Object.keys(value), ['format', 'producerCodeRef', 'producedAt', 'seedManifestSha256', 'renderManifestSha256', 'checkedBuildArtifactDigest'])
  assert.throws(() => publicReceipt({ ...value, seedManifestSha256: 'b'.repeat(64) }), /E_PUBLIC_RECEIPT/u)
  const hashes = ['b'.repeat(64), 'a'.repeat(64)]
  assert.equal(ledgerDigest(hashes), `sha256:${sha256([...hashes].sort().join('\n'))}`)
  const root = await temp(t), sidecar = join(root, 'state.receipt.json')
  await atomicJson(sidecar, { ledgerDigest: ledgerDigest(hashes), producerCodeRef: value.producerCodeRef })
  assert.deepEqual(Object.keys(JSON.parse(await readFile(sidecar))), ['ledgerDigest', 'producerCodeRef'])
})

test('two independent receipt runs use Git timestamp and are byte-identical', async t => {
  // Production uses a Linux clone; this fixture must not read Windows worktree gitdir metadata from WSL.
  const root = await temp(t)
  const timestamp = '2026-11-07T00:00:00+00:00'
  const env = { ...process.env, GIT_AUTHOR_DATE: timestamp, GIT_COMMITTER_DATE: timestamp }
  const git = args => promisify(execFile)('git', ['-C', root, ...args], { encoding: 'utf8', env })
  await git(['init'])
  await git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgSign=false', 'commit', '--allow-empty', '-m', 'fixture'])
  const codeRef = (await git(['rev-parse', 'HEAD'])).stdout.trim()
  assert.equal(Date.parse(await producerTimestamp(root, codeRef)), Date.parse(timestamp))
  const run = async () => jsonBytes(publicReceipt({ producerCodeRef: codeRef, producedAt: await producerTimestamp(root, codeRef), seedManifestSha256: `sha256:${'b'.repeat(64)}`, renderManifestSha256: `sha256:${'c'.repeat(64)}`, checkedBuildArtifactDigest: `sha256:${'d'.repeat(64)}` }))
  assert.equal(await run(), await run())
})

test('partial combined promotion leaves blocking journal and converges on rerun', async t => {
  const root = await temp(t), out = join(root, 'out')
  const makeStage = async path => {
    await write(path, 'db/seeds/manifest.json', jsonBytes({ tables: [] }))
    await write(path, 'renders/manifest.json', jsonBytes({ files: [] }))
    await write(path, 'db/provenance/public-snapshot.json', '{}\n')
  }
  const stage = join(root, 'stage'); await makeStage(stage)
  await assert.rejects(promoteSnapshot({ stage, out, checkpoint: async phase => { if (phase === 'promotion') throw new Error('injected') } }), /injected/u)
  await assert.rejects(compareSnapshot({ stage, out }), /E_PUBLIC_PROMOTE_PENDING/u)
  const next = join(root, 'next'); await makeStage(next)
  await promoteSnapshot({ stage: next, out })
  const same = join(root, 'same'); await makeStage(same)
  assert.deepEqual(await compareSnapshot({ stage: same, out }), { changedBytes: 0 })
})
