import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const canonRoot = resolve(repoRoot, 'GDD/canon')
const outputPath = resolve(repoRoot, 'GDD/adr/ADR-003-real-place-and-station-naming.md')
const files = {
  locale: 'locales/ko-KR/adr-003.json',
}
const BASELINE_SHA = '56c479db4d89478e55f974e691c0819e6ac339648351f934544329af09ff0ad4'
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

const canonModule = () => import('./adr-canon.mjs')
const renderModule = () => import('./adr-render.mjs')
const loadCanon = async (root = canonRoot) => (await canonModule()).loadAdrCanon(root)

async function sandbox(mutate) {
  const dir = await mkdtemp(join(tmpdir(), 'adr-canon-'))
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

test('baseline: source is characterized by SHA and line count', async () => {
  const text = await readFile(outputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA)
  assert.equal(text.split('\n').length - 1, 65)
})

test('rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const canon = await loadCanon()
  const { renderAdrMarkdown } = await renderModule()
  const first = renderAdrMarkdown(canon)
  assert.equal(first, renderAdrMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA)
  assert.equal(first, await readFile(outputPath, 'utf8'))
})

test('canon keeps 19 blocks including two ordered/unordered lists and the 9-row table', async () => {
  const canon = await loadCanon()
  assert.equal(canon.blocks.length, 19)
  const kindCounts = canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {})
  assert.deepEqual(kindCounts, { heading: 7, paragraph: 7, list: 4, table: 1 })
  const table = canon.blocks.find((block) => block.kind === 'table')
  assert.equal(table.rows.length, 9)
  assert.deepEqual(table.rows.map((row) => row[0]), ['S01', 'S02', 'S04', 'S06', 'S09', 'S10', 'S13', 'S14', 'S15'])
  const decisionList = canon.blocks.find((block) => block.id === 'adr-003.decision.list')
  assert.equal(decisionList.ordered, true)
  assert.equal(decisionList.items.length, 6)
  const boundaryList = canon.blocks.find((block) => block.id === 'adr-003.boundary.list')
  assert.equal(boundaryList.ordered, false)
  assert.equal(boundaryList.items.length, 8)
})

test('list renders ordered items with "1. " markers and unordered with "- " markers, preserving backticks', async () => {
  const { renderAdrMarkdown } = await renderModule()
  const canon = await loadCanon()
  const markdown = renderAdrMarkdown(canon)
  assert.match(markdown, /^1\. 창작 명칭의 지리 앵커는 실제로 존재하는 이름을 사용한다\.$/m)
  assert.match(markdown, /^6\. 안정 ID\(`S01`, `HC01`, `HP01`, `XT01` 등\)는 바꾸지 않는다\. 저장·관계 연결은 ID를 기준으로 유지한다\.$/m)
  assert.match(markdown, /^- `archive\/\*\*`$/m)
})

test('loader rejects malformed, missing, duplicate and unsupported input', async () => {
  const mapBlocks = (fn) => (data) => ({ ...data, blocks: data.blocks.map(fn) })
  const cases = [
    ['E_JSON_MALFORMED', async ({ root }) => writeFile(join(root, files.locale), '{ nope')],
    ['E_DUPLICATE_JSON_KEY', async ({ root }) => writeFile(join(root, files.locale), '{"schemaVersion":1,"locale":"ko-KR","blocks":[],"blocks":[]}')],
    ['E_FILE_MISSING', async ({ root }) => rm(join(root, files.locale))],
    ['E_SCHEMA_VERSION', async ({ edit }) => edit('locale', (d) => ({ ...d, schemaVersion: 2 }))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b, i) => (i === 0 ? { ...b, extra: 1 } : b)))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b, i) => (i === 0 ? { ...b, inlines: [{ kind: 'strong', text: 'x' }] } : b)))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b) => (b.kind === 'list' ? { ...b, items: 'x' } : b)))],
    ['E_TABLE_SHAPE', async ({ edit }) => edit('locale', mapBlocks((b) => (b.kind === 'table' ? { ...b, rows: [b.rows[0].slice(1)] } : b)))],
    ['E_DUPLICATE_ID', async ({ edit }) => edit('locale', (d) => ({ ...d, blocks: [...d.blocks, d.blocks[0]] }))],
    ['E_DOCUMENT_BLOCKS', async ({ edit }) => edit('locale', (d) => ({ ...d, document: { ...d.document, blockIds: d.document.blockIds.slice(1) } }))],
  ]
  for (const [code, mutate] of cases) {
    await sandbox(async (ctx) => {
      await mutate(ctx)
      await rejects(loadCanon(ctx.root), code)
    })
  }
})

test('materialize check fails on hand-edited markdown and invalid canon leaves output untouched', async () => {
  const { materializeAdr } = await renderModule()
  await sandbox(async ({ dir, root, edit }) => {
    const out = join(dir, 'ADR-003.md')
    const args = { canonRoot: root, outputPath: out }
    assert.equal((await materializeAdr({ ...args, check: false })).changed, true)
    assert.equal(sha256(await readFile(out, 'utf8')), BASELINE_SHA)
    assert.equal((await materializeAdr({ ...args, check: false })).changed, false)
    assert.equal((await materializeAdr({ ...args, check: true })).changed, false)
    await writeFile(out, (await readFile(out, 'utf8')).replace('창작 명칭은', '창작 명칭이'))
    await rejects(materializeAdr({ ...args, check: true }), 'E_DRIFT')
    await writeFile(out, 'sentinel\n')
    await edit('locale', (d) => ({ ...d, blocks: d.blocks.slice(1) }))
    await rejects(materializeAdr({ ...args, check: false }), 'E_DOCUMENT_BLOCKS')
    assert.equal(await readFile(out, 'utf8'), 'sentinel\n')
  })
})

test('CLI --check passes against the on-disk markdown', () => {
  const script = resolve(repoRoot, 'TOOL/tools/wiki/adr-render.mjs')
  assert.match(execFileSync('node', [script, '--check'], { encoding: 'utf8' }), /adr-003: OK/)
})

test('schema $defs are locally duplicated (no cross-file $ref) and reuse the shared block/inline shapes', async () => {
  const schemaText = await readFile(join(canonRoot, 'schema/adr.schema.json'), 'utf8')
  const schema = JSON.parse(schemaText)
  assert.deepEqual(Object.keys(schema.$defs).sort(), ['block', 'cell', 'id', 'inline', 'schemaVersion'])
  assert.ok(!schemaText.includes('"$ref": "structures.schema.json'))
  assert.ok(!schemaText.includes('"$ref": "offices.schema.json'))
})

test('TOOL package default test runs the ADR canon suite', async () => {
  const pkg = JSON.parse(await readFile(resolve(repoRoot, 'TOOL/tools/package.json'), 'utf8'))
  assert.ok(pkg.scripts.test.includes('wiki/test-adr-canon.mjs'))
})

test('normalize-creative-names excludes the new JSON canon source', async () => {
  const scriptText = await readFile(resolve(repoRoot, 'TOOL/tools/policy/normalize-creative-names.mjs'), 'utf8')
  assert.ok(scriptText.includes("'GDD/canon/locales/ko-KR/adr-003.json'"))
})
