import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { onTestFinished, test } from 'vitest'
import { approvedDocuments, categories, loadGddSources } from './catalog-admission.mjs'
import { gddPublicationManifest, validatePublicationManifest } from './publication-manifest.mjs'

test('GDD catalog exposes canonical documents and current data summaries', async () => {
  const contract = JSON.parse(await readFile(new URL('../src/generated/gdd-contract.json', import.meta.url), 'utf8'))
  assert.ok(contract.documents.length >= 45)
  assert.equal(new Set(contract.documents.map((document) => document.route)).size, contract.documents.length)
  assert.ok(contract.documents.every((document) => /^(?:canon\/locales\/ko-KR\/(?:adr-\d{3}|(?:root|rules|architecture|references|art)\/[a-z0-9-]+)\.json|LICENSE\.md)$/.test(document.sourcePath)))
  const gddRoot = process.env.GDD_ROOT ?? resolve(import.meta.dirname, '../..')
  for (const document of contract.documents) await assert.doesNotReject(access(resolve(gddRoot, document.sourcePath)), `${document.route}: ${document.sourcePath} is not a GDD file`)
  // Word-anchored so it matches Ref-Ravelen / ravelen-chronicles but not "TravelEncounters".
  assert.ok(contract.documents.every((document) => !/\bravelen/i.test(`${document.route} ${document.sourcePath}`)), 'retired Ravelen reference must not be in the GDD catalog')
  assert.equal(contract.documents.filter((document) => /^\/rules\/Rules-/.test(document.route)).length, 7, 'the seven migrated Rules-* clause pages are published under rules')
  const repoRoot = process.env.SEOUL_KENSHI_ROOT ?? resolve(gddRoot, '..')
  const loreRoot = process.env.LORE_ROOT ?? resolve(repoRoot, 'WIKI/lore')
  const stationControl = JSON.parse(await readFile(resolve(loreRoot, 'places/station-control-overrides.json'), 'utf8'))
  assert.ok(stationControl.overrides.length > 0)
  assert.equal(new Set(stationControl.overrides.map(({ stationId }) => stationId)).size, stationControl.overrides.length)
  assert.deepEqual(contract.datasets.map((dataset) => dataset.records), [1019, 1019, 37, 334, stationControl.overrides.length, 334, 427])
})

test('the publication manifest equals the public canon source set and generated content', async () => {
  const projectRoot = resolve(import.meta.dirname, '..')
  const gddRoot = process.env.GDD_ROOT ?? resolve(projectRoot, '..')
  const pagesRoot = process.env.GDD_PAGES_ROOT
  assert.ok(pagesRoot, 'materialize canon and set GDD_PAGES_ROOT before testing')
  const manifest = JSON.parse(await readFile(resolve(projectRoot, 'src/generated/publication-manifest.json'), 'utf8'))
  const expected = await approvedDocuments(gddRoot, pagesRoot)
  validatePublicationManifest(manifest, expected)
  assert.equal(manifest.site, 'gdd')
  assert.deepEqual(manifest.documents.map(({ source, id, route }) => ({ source, id, route })), expected)
  assert.deepEqual(manifest.categories.map(({ id }) => id), categories.map(({ id }) => id))
  const contract = JSON.parse(await readFile(resolve(projectRoot, 'src/generated/gdd-contract.json'), 'utf8'))
  assert.deepEqual(manifest.documents.map(({ route }) => route), contract.documents.map(({ route }) => route).sort())
  assert.ok(manifest.documents.every(({ source, route }) => !/(?:^|\/)(?:proposals|system-design)\//.test(`${source} ${route}`)))
  for (const document of manifest.documents) {
    await access(resolve(gddRoot, document.source))
    await access(resolve(projectRoot, document.contentRef))
    assert.equal(document.title, contract.documents.find(({ route }) => route === document.route).title)
  }
})

test('new public rules appear while proposal and system-design fixtures remain excluded', async () => {
  const evidence = resolve(process.env.SEOUL_KENSHI_ROOT ?? resolve(import.meta.dirname, '../../..'), '.omo/evidence/publication-manifest/fixtures')
  await mkdir(evidence, { recursive: true })
  const root = await mkdtemp(resolve(evidence, 'gdd-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const pagesRoot = resolve(root, 'pages')
  await mkdir(resolve(root, 'canon/collections'), { recursive: true })
  await mkdir(resolve(root, 'canon/locales/ko-KR'), { recursive: true })
  await mkdir(pagesRoot)
  const entries = [
    { id: 'doc.Added', path: 'locales/ko-KR/rules/added.json', status: 'accepted', source: { path: 'rules/Added.md' } },
    { id: 'doc.Draft', path: 'locales/ko-KR/rules/draft.json', status: 'draft', source: { path: 'rules/Draft.md' } },
    { id: 'doc.Proposal', path: 'locales/ko-KR/proposals/proposal.json', status: 'proposal', source: { path: 'proposals/Proposal.md' } },
    { id: 'doc.Studio', path: 'locales/ko-KR/system-design/studio.json', status: 'accepted', source: { path: 'system-design/Studio.md' } },
  ]
  await writeFile(resolve(root, 'canon/collections/fixture.json'), JSON.stringify({ documents: entries }))
  const sources = await loadGddSources(root)
  const admitted = await approvedDocuments(root, pagesRoot, sources)
  assert.deepEqual(admitted.map(({ id }) => id), ['doc.Added', 'doc.Draft'])
  const documents = admitted.map(({ source, id, route }) => ({ sourcePath: source, id, route, title: id, summary: '', category: 'rules', contentRef: `src/content${route}.md` }))
  const manifest = await gddPublicationManifest({ gddRoot: root, pagesRoot, sources, documents })
  assert.deepEqual(manifest.categories.find(({ id }) => id === 'rules').documentIds, ['doc.Added', 'doc.Draft'])
  assert.equal(JSON.stringify(manifest), JSON.stringify(await gddPublicationManifest({ gddRoot: root, pagesRoot, sources, documents: documents.toReversed() })))
  await assert.rejects(gddPublicationManifest({ gddRoot: root, pagesRoot, sources, documents: documents.slice(1) }), /E_PUBLICATION_SOURCE_MISSING/)
  await assert.rejects(gddPublicationManifest({ gddRoot: root, pagesRoot, sources, documents: [...documents, { ...documents[0], sourcePath: 'canon/locales/ko-KR/proposals/proposal.json', id: 'doc.Proposal', route: '/rules/Proposal', contentRef: 'src/content/rules/Proposal.md' }] }), /E_PUBLICATION_SOURCE_UNPUBLISHED/)
  await assert.rejects(gddPublicationManifest({ gddRoot: root, pagesRoot, sources, documents: [{ ...documents[0], category: 'unknown' }, documents[1]] }), /E_PUBLICATION_CATEGORY_UNKNOWN/)
  sources.set('rules/Leaked.md', sources.get('proposals/Proposal.md'))
  await assert.rejects(approvedDocuments(root, pagesRoot, sources), /E_GDD_SOURCE_UNPUBLISHED/)
})
