import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { onTestFinished, test } from 'vitest'
import { fromGddBlocks } from '@seoul-dengoku/document-renderer'
import { MarkdownBody } from '../src/App.tsx'
import { ArchifyDiagram, GddDocumentContent } from '../src/ArchifyDiagram.tsx'
import { parseArchifyManifest, parseArchifyReference, resolveArchifyReference } from '../src/archify-contract.mjs'
import { checkArchifyReferences, prepareArchify, readArchifyArtifacts } from './prepare-archify.mjs'

const ref = { domainId: 'D01', diagramId: 'd01-identity', moduleTitle: '인물 식별' }
const html = '<!doctype html><html><head><title>Diagram</title></head><body><svg></svg><script>window.diagramReady = true</script></body></html>'
const sha256 = createHash('sha256').update(html).digest('hex')
const entry = { ...ref, file: 'd01-identity.html', sha256 }
const manifest = { schemaVersion: 1, diagrams: [entry] }
const block = { kind: 'codeFence', id: 'identity-diagram', info: 'archify', text: JSON.stringify(ref) }
const render = (component, props) => renderToStaticMarkup(createElement(component, props))

async function fixture() {
  const root = await mkdtemp(resolve(process.env.ARCHIFY_TEST_TMP ?? tmpdir(), 'gdd-archify-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const inputRoot = resolve(root, 'input')
  const viewerRoot = resolve(root, 'viewer')
  const gddRoot = resolve(root, 'gdd')
  await mkdir(inputRoot)
  await mkdir(resolve(gddRoot, 'canon/collections'), { recursive: true })
  await mkdir(resolve(gddRoot, 'canon/locales/ko-KR'), { recursive: true })
  await writeFile(resolve(inputRoot, entry.file), html)
  await writeFile(resolve(inputRoot, 'manifest.json'), JSON.stringify(manifest))
  await writeFile(resolve(gddRoot, 'canon/collections/test.json'), JSON.stringify({ documents: [{ id: 'doc.identity', source: { path: 'Identity.md' }, path: 'locales/ko-KR/identity.json' }] }))
  await writeFile(resolve(gddRoot, 'canon/locales/ko-KR/identity.json'), JSON.stringify({ blocks: [block] }))
  return { root, inputRoot, viewerRoot, gddRoot }
}

test('renders registered Markdown fences as lazy sandboxed frames and full-view links', () => {
  // Given: a registered machine reference in the real Markdown route.
  const markdown = `\`\`\`archify\n${JSON.stringify(ref)}\n\`\`\``
  // When
  const output = render(MarkdownBody, { markdown, manifest })
  // Then
  assert.match(output, /<iframe[^>]+src="\/gdd\/archify\/d01-identity\.html\?sha256=[a-f0-9]{64}"/)
  assert.match(output, /loading="lazy" sandbox="allow-scripts" referrerPolicy="no-referrer"/)
  assert.match(output, /target="_blank" rel="noopener noreferrer"/)
  assert.doesNotMatch(output, /srcdoc=|allow-same-origin|language-archify/)
})

test('intercepts converted shared code nodes without dropping adjacent content or anchors', () => {
  // Given
  const content = fromGddBlocks({ document: { blockIds: [block.id, 'p'] }, blocks: [block, { kind: 'paragraph', id: 'p', inlines: [{ kind: 'text', text: 'ordinary content' }] }] })
  // When
  const output = render(GddDocumentContent, { content, locale: 'ko', manifest })
  // Then
  assert.match(output, /id="identity-diagram"/)
  assert.match(output, /<iframe /)
  assert.match(output, /<p id="p">ordinary content<\/p>/)
})

test('keeps ordinary and Mermaid fences on their original render paths', () => {
  // Given
  const markdown = '```json\n{}\n```\n\n```mermaid\ngraph TD; A-->B\n```'
  // When
  const output = render(MarkdownBody, { markdown, manifest })
  // Then
  assert.match(output, /language-json/)
  assert.match(output, /language-mermaid/)
  assert.doesNotMatch(output, /<iframe /)
})

for (const value of [{ ...ref, url: 'https://example.com/evil' }, { ...ref, file: '../evil.html' }, { ...ref, html: '<script>alert(1)</script>' }, { ...ref, domainId: 'D19' }, { ...ref, diagramId: '../evil' }, null, []]) {
  test(`rejects malformed reference ${JSON.stringify(value)}`, () => {
    // Given / When / Then
    assert.throws(() => parseArchifyReference(JSON.stringify(value)), /E_ARCHIFY_REF_SCHEMA/)
  })
}

test('does not emit a frame or link for missing or title-mismatched registration', () => {
  // Given
  const source = JSON.stringify({ ...ref, moduleTitle: 'other' })
  // When
  const output = render(ArchifyDiagram, { source, manifest })
  // Then
  assert.doesNotMatch(output, /<iframe |href=/)
  assert.throws(() => resolveArchifyReference({ ...ref, diagramId: 'missing' }, manifest), /E_ARCHIFY_REF_UNREGISTERED/)
})

for (const file of ['../escape.html', '/absolute.html', 'https://example.com/a.html', 'folder/a.html', 'a%2fescape.html', 'a\\escape.html', 'a.html?x=1']) {
  test(`rejects manifest filename ${file}`, () => {
    // Given / When / Then
    assert.throws(() => parseArchifyManifest({ ...manifest, diagrams: [{ ...entry, file }] }), /E_ARCHIFY_MANIFEST_ENTRY/)
  })
}

test('rejects duplicate registrations and malformed hashes', () => {
  // Given / When / Then
  assert.throws(() => parseArchifyManifest({ ...manifest, diagrams: [entry, entry] }), /E_ARCHIFY_MANIFEST_DUPLICATE/)
  assert.throws(() => parseArchifyManifest({ ...manifest, diagrams: [{ ...entry, sha256: '0' }] }), /E_ARCHIFY_MANIFEST_ENTRY/)
})

test('copies only registered verified bytes reproducibly and removes stale outputs', async () => {
  // Given
  const paths = await fixture()
  await writeFile(resolve(paths.inputRoot, 'private.html'), 'not admitted')
  await mkdir(resolve(paths.viewerRoot, 'public/archify'), { recursive: true })
  await writeFile(resolve(paths.viewerRoot, 'public/archify/stale.html'), 'old')
  // When
  await prepareArchify(paths)
  const first = await readFile(resolve(paths.viewerRoot, 'src/generated/archify-manifest.json'))
  await prepareArchify(paths)
  // Then
  assert.deepEqual(await readdir(resolve(paths.viewerRoot, 'public/archify')), ['d01-identity.html', 'manifest.json'])
  assert.equal(await readFile(resolve(paths.viewerRoot, 'public/archify', entry.file), 'utf8'), html)
  assert.deepEqual(await readFile(resolve(paths.viewerRoot, 'src/generated/archify-manifest.json')), first)
  assert.deepEqual(await readFile(resolve(paths.viewerRoot, 'public/archify/manifest.json')), first)
})

test('rejects hash mismatch before replacing existing output', async () => {
  // Given
  const paths = await fixture()
  await prepareArchify(paths)
  await writeFile(resolve(paths.inputRoot, entry.file), `${html}changed`)
  // When / Then
  await assert.rejects(prepareArchify(paths), /E_ARCHIFY_HASH_MISMATCH/)
  assert.equal(await readFile(resolve(paths.viewerRoot, 'public/archify', entry.file), 'utf8'), html)
})

test('rejects a symlinked artifact even when its target hash matches', async () => {
  // Given
  const paths = await fixture()
  await rm(resolve(paths.inputRoot, entry.file))
  await writeFile(resolve(paths.root, 'outside.html'), html)
  await symlink(resolve(paths.root, 'outside.html'), resolve(paths.inputRoot, entry.file))
  // When / Then
  await assert.rejects(readArchifyArtifacts(paths.inputRoot), /E_ARCHIFY_INPUT_NOT_REGULAR/)
})

test('fails publication on unregistered canon reference', async () => {
  // Given
  const paths = await fixture()
  await writeFile(resolve(paths.inputRoot, 'manifest.json'), JSON.stringify({ schemaVersion: 1, diagrams: [] }))
  // When / Then
  await assert.rejects(prepareArchify(paths), /E_ARCHIFY_REF_UNREGISTERED/)
})

test('checks shared localized references as well as normalized fences', () => {
  // Given
  const canon = { content: [{ kind: 'code', language: 'archify', text: { ko: JSON.stringify(ref), en: JSON.stringify({ ...ref, diagramId: 'missing' }) } }] }
  // When / Then
  assert.throws(() => checkArchifyReferences(canon, manifest), /E_ARCHIFY_REF_UNREGISTERED/)
})

test('rejects missing input rather than silently publishing without diagrams', async () => {
  // Given
  const paths = await fixture()
  await rm(resolve(paths.inputRoot, 'manifest.json'))
  // When / Then
  await assert.rejects(prepareArchify(paths), /ENOENT/)
})
