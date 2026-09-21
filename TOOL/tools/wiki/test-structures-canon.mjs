import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const canonRoot = resolve(repoRoot, 'LORE/canon')
const loreRoot = resolve(repoRoot, 'LORE')
const outputPath = resolve(repoRoot, 'LORE/structures/Structures.md')
const mirrorPath = resolve(repoRoot, 'WEB/wiki-source/world/Structures.md')
const files = {
  documents: 'tables/documents.json',
  kinds: 'tables/structure-kinds.json',
  details: 'relations/structure-kind-details.json',
  locale: 'locales/ko-KR/structures.json',
}
const BASELINE_SHA = '79dcb217185d87e734d4ad821610bcb2de343a5e5930bdf11071754466408b33'
const OFFICES_SCHEMA_SHA = 'e871620ada78a182f427a122a97419412a2bee6b03e54229932e37a5d4c77571'
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

// Modules are imported lazily so the baseline characterization runs even before the implementation exists.
const canonModule = () => import('./structures-canon.mjs')
const renderModule = () => import('./structures-render.mjs')
const loadCanon = async (root = canonRoot) => (await canonModule()).loadStructuresCanon(root, loreRoot)
const renderDisk = async () => (await renderModule()).renderStructuresMarkdown(await loadCanon())

async function sandbox(mutate) {
  const dir = await mkdtemp(join(tmpdir(), 'structures-canon-'))
  await cp(canonRoot, join(dir, 'canon'), { recursive: true })
  const edit = async (key, fn) => {
    const path = join(dir, 'canon', files[key])
    await writeFile(path, `${JSON.stringify(fn(JSON.parse(await readFile(path, 'utf8'))), null, 2)}\n`)
  }
  try {
    await mutate({ dir, root: join(dir, 'canon'), edit })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const rejects = (promise, code) => assert.rejects(promise, (error) => error.code === code)
const mapBlocks = (fn) => (data) => ({ ...data, blocks: data.blocks.map(fn) })
const linkTargets = (text) => [...text.matchAll(/\]\((\.\.\/[^)]+)\)/g)].map((match) => match[1])

test('baseline: source is characterized by SHA, size, structure and links', async () => {
  const text = await readFile(outputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA)
  assert.equal(Buffer.byteLength(text), 10063)
  assert.equal(text.split('\n').length - 1, 53)
  const lines = text.split('\n')
  assert.equal(lines.filter((line) => /^# /.test(line)).length, 1)
  assert.equal(lines.filter((line) => /^## /.test(line)).length, 5)
  assert.equal(lines.filter((line) => line && !line.startsWith('#') && !line.startsWith('|')).length, 17)
  const tableLines = lines.filter((line) => line.startsWith('|'))
  assert.equal(tableLines.length, 7)
  assert.ok(tableLines.every((line) => line.split('|').length - 2 === 4))
  const targets = linkTargets(text)
  assert.equal(targets.length, 22)
  assert.equal(new Set(targets).size, 15)
  for (const target of new Set(targets)) await access(resolve(dirname(outputPath), target))
  const mirror = await readFile(mirrorPath, 'utf8')
  assert.equal(mirror, text.replace(/\]\(\.\.\/[^/]+\/([^/)]+)\.md\)/g, '](/world/$1)'))
})

test('rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const canon = await loadCanon()
  const { renderStructuresMarkdown } = await renderModule()
  const first = renderStructuresMarkdown(canon)
  assert.equal(first, renderStructuresMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA)
  assert.equal(first, await readFile(outputPath, 'utf8'))
})

test('canon keeps 24 blocks, 5 kinds, 16 documents and 22 links with deterministic IDs', async () => {
  const canon = await loadCanon()
  assert.equal(canon.blocks.length, 24)
  assert.deepEqual(canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {}), { heading: 6, paragraph: 17, table: 1 })
  assert.deepEqual(canon.kinds.map((kind) => kind.id), ['structure.station', 'structure.tunnel', 'structure.depot', 'structure.waterworks', 'structure.passage'])
  assert.equal(canon.documents.length, 16)
  for (const doc of canon.documents) assert.equal(doc.id, `doc.${doc.path.split('/').at(-1).replace(/\.md$/, '')}`)
  assert.equal(canon.blocks[0].id, 'structures.title')
  assert.equal(canon.blocks.at(-1).id, 'structures.kinds.table')
  assert.ok(canon.blocks.some((block) => block.id === 'structures.waterworks.p3'))
  const docLinks = canon.blocks.flatMap((block) => (block.inlines ?? []).filter((inline) => inline.kind === 'docLink'))
  assert.equal(docLinks.length, 17)
})

test('docLink resolves through the documents table to the exact relative link bytes', async () => {
  await sandbox(async ({ root, edit }) => {
    await edit('documents', (data) => ({ ...data, rows: data.rows.map((row) => (row.id === 'doc.Oral-Stories' ? { ...row, path: 'culture/Martial-Paths.md' } : row)) }))
    const markdown = (await renderModule()).renderStructuresMarkdown(await loadCanon(root))
    assert.ok(markdown.includes('[이야기](../culture/Martial-Paths.md)'))
    assert.equal(markdown.includes('Oral-Stories.md'), false)
  })
})

test('loader rejects malformed, missing, duplicate, dangling and unsupported input', async () => {
  const setDetail = (fn) => ({ edit }) => edit('details', (d) => ({ ...d, rows: d.rows.map(fn) }))
  const cases = [
    ['E_JSON_MALFORMED', async ({ root }) => writeFile(join(root, files.kinds), '{ nope')],
    ['E_DUPLICATE_JSON_KEY', async ({ root }) => writeFile(join(root, files.kinds), '{"schemaVersion":1,"rows":[],"rows":[]}')],
    ['E_FILE_MISSING', async ({ root }) => rm(join(root, files.locale))],
    ['E_SCHEMA_VERSION', async ({ edit }) => edit('kinds', (d) => ({ ...d, schemaVersion: 2 }))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('kinds', (d) => ({ ...d, rows: d.rows.map((r, i) => (i === 0 ? { ...r, extra: 1 } : r)) }))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b, i) => (i === 1 ? { ...b, inlines: [{ kind: 'strong', text: 'x' }] } : b)))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b, i) => (i === 1 ? { ...b, inlines: [{ kind: 'docLink', text: 'x', targetDocumentId: 'doc.Ailments', href: '../a.md' }] } : b)))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b, i) => (i === 1 ? { ...b, kind: 'list' } : b)))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b) => (b.kind === 'table' ? { ...b, rows: [['a', 'b', 'c', 'd']] } : b)))],
    ['E_DUPLICATE_ID', async ({ edit }) => edit('documents', (d) => ({ ...d, rows: [...d.rows, d.rows[1]] }))],
    ['E_DUPLICATE_ID', async ({ edit }) => edit('documents', (d) => ({ ...d, rows: [...d.rows, { id: 'doc.Other', path: d.rows[1].path }] }))],
    ['E_FK_DOC_PATH', async ({ edit }) => edit('documents', (d) => ({ ...d, rows: d.rows.map((r, i) => (i === 1 ? { ...r, path: 'places/Nope.md' } : r)) }))],
    ['E_FK_DOC', async ({ edit }) => edit('locale', mapBlocks((b, i) => (i === 1 ? { ...b, inlines: [{ kind: 'docLink', text: 'x', targetDocumentId: 'doc.Nope' }] } : b)))],
    ['E_FK_DOC', setDetail((r, i) => (i === 0 ? { ...r, docId: 'doc.Nope' } : r))],
    ['E_FK_DOC', async ({ edit }) => edit('locale', (d) => ({ ...d, document: { ...d.document, id: 'doc.Nope' } }))],
    ['E_FK_KIND', setDetail((r, i) => (i === 0 ? { ...r, kindId: 'structure.nope' } : r))],
    ['E_DUPLICATE_COMPOSITE', setDetail((r, i) => (i === 0 ? { ...r, kindId: 'structure.tunnel' } : r))],
    ['E_MISSING_COMPOSITE', async ({ edit }) => edit('details', (d) => ({ ...d, rows: d.rows.slice(1) }))],
    ['E_FK_TEXT', setDetail((r, i) => (i === 0 ? { ...r, textKey: 'x.none' } : r))],
    ['E_FK_TEXT', async ({ edit }) => edit('locale', (d) => ({ ...d, texts: d.texts.filter((t) => t.id !== 'structure.depot.role') }))],
    ['E_DOCUMENT_BLOCKS', async ({ edit }) => edit('locale', (d) => ({ ...d, document: { ...d.document, blockIds: d.document.blockIds.slice(1) } }))],
    ['E_TABLE_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b) => (b.kind === 'table' ? { id: b.id, kind: 'table', header: b.header } : b)))],
    ['E_TABLE_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b) => (b.kind === 'table' ? { ...b, header: b.header.slice(1) } : b)))],
  ]
  for (const [code, mutate] of cases) {
    await sandbox(async (ctx) => {
      await mutate(ctx)
      await rejects(loadCanon(ctx.root), code)
    })
  }
})

test('materialize check fails on hand-edited markdown and invalid canon leaves output untouched', async () => {
  const { materializeStructures } = await renderModule()
  await sandbox(async ({ dir, root, edit }) => {
    const out = join(dir, 'Structures.md')
    const args = { canonRoot: root, loreRoot, outputPath: out }
    assert.equal((await materializeStructures({ ...args, check: false })).changed, true)
    assert.equal(sha256(await readFile(out, 'utf8')), BASELINE_SHA)
    assert.equal((await materializeStructures({ ...args, check: false })).changed, false)
    assert.equal((await materializeStructures({ ...args, check: true })).changed, false)
    await writeFile(out, (await readFile(out, 'utf8')).replace('역은', '역이'))
    await rejects(materializeStructures({ ...args, check: true }), 'E_DRIFT')
    await writeFile(out, 'sentinel\n')
    await edit('details', (d) => ({ ...d, rows: d.rows.slice(1) }))
    await rejects(materializeStructures({ ...args, check: false }), 'E_MISSING_COMPOSITE')
    assert.equal(await readFile(out, 'utf8'), 'sentinel\n')
  })
})

test('CLI --check passes against the on-disk markdown', () => {
  const script = resolve(repoRoot, 'TOOL/tools/wiki/structures-render.mjs')
  assert.match(execFileSync('node', [script, '--check'], { encoding: 'utf8' }), /structures: OK/)
})

test('offices schema is byte-unchanged and shared schema definitions match', async () => {
  const officesText = await readFile(join(canonRoot, 'schema/offices.schema.json'), 'utf8')
  assert.equal(sha256(officesText), OFFICES_SCHEMA_SHA)
  const offices = JSON.parse(officesText).$defs
  const structures = JSON.parse(await readFile(join(canonRoot, 'schema/structures.schema.json'), 'utf8')).$defs
  for (const name of ['schemaVersion', 'id', 'cell']) assert.deepEqual(structures[name], offices[name], name)
  assert.deepEqual(structures.inline.oneOf.slice(0, 2), offices.inline.oneOf)
  assert.deepEqual(structures.block.oneOf.slice(0, 2), offices.block.oneOf.slice(0, 2))
})

test('TOOL package default test runs the structures suite', async () => {
  const pkg = JSON.parse(await readFile(resolve(repoRoot, 'TOOL/tools/package.json'), 'utf8'))
  assert.ok(pkg.scripts.test.includes('wiki/test-structures-canon.mjs'))
})
