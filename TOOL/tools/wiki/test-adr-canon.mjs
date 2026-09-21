import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const canonRoot = resolve(repoRoot, 'GDD/canon')
const adrDir = resolve(repoRoot, 'GDD/adr')
const outputPath = resolve(adrDir, 'ADR-003-real-place-and-station-naming.md')
const adr002OutputPath = resolve(adrDir, 'ADR-002-character-candidate-retrospective.md')
const files = {
  locale: 'locales/ko-KR/adr-003.json',
  locale002: 'locales/ko-KR/adr-002.json',
}
const BASELINE_SHA = '56c479db4d89478e55f974e691c0819e6ac339648351f934544329af09ff0ad4'
const BASELINE_SHA_002 = '131249858dc513cb99f8b47923d3cf1c085d75274752bd72f891158ba5247a6e'
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
  const stdout = execFileSync('node', [script, '--check'], { encoding: 'utf8' })
  assert.match(stdout, /adr-002: OK/)
  assert.match(stdout, /adr-003: OK/)
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

// --- ADR-002 (second collection member) ---

test('ADR-002 source is characterized by SHA and line count (immutable historical ADR)', async () => {
  const text = await readFile(adr002OutputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA_002)
  assert.equal(text.split('\n').length - 1, 48)
})

test('ADR-002 rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const { renderAdrMarkdown } = await renderModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-002')
  const first = renderAdrMarkdown(canon)
  assert.equal(first, renderAdrMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA_002)
  assert.equal(first, await readFile(adr002OutputPath, 'utf8'))
})

test('ADR-002 canon preserves the FAIL verdict paragraph and ArtCandidates decision wording byte-for-byte', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-002')
  const failParagraph = canon.blocks.find((block) => block.id === 'adr-002.failed.p1')
  assert.equal(
    failParagraph.inlines[0].text,
    'COMPOSITION FAIL, SPRITE_FIDELITY FAIL, PRODUCT_POLISH FAIL, TYPOGRAPHY PASS(라벨·증거 판독에 한정). 유지된 결함: 정체성 단순화(밀폐 헬멧·중간가르마 bob 손실), 쓰러짐 자세의 직사각형 몸과 분리된 장비, 공격 시 손 분리, N 방향 쓰러짐의 얼굴색 노출, 경직된 걷기·공격. 최종 상태는 FROZEN_REVIEW_COMPLETE_ART_FAIL이며 승격·런타임 연결은 없다.',
  )
  const decisionList = canon.blocks.find((block) => block.id === 'adr-002.decision.list')
  assert.equal(decisionList.ordered, true)
  assert.equal(decisionList.items.length, 5)
  assert.ok(decisionList.items[0][0].text.startsWith('승격 금지 유지. ArtCandidates 에셋은 status draft, rights unknown'))
})

test('ADR-002 canon has 16 blocks with 8 heading / 2 paragraph / 6 list, no table', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-002')
  assert.equal(canon.blocks.length, 16)
  const kindCounts = canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {})
  assert.deepEqual(kindCounts, { heading: 8, paragraph: 2, list: 6 })
})

test('CLI --check adr-render passes for both ADR-002 and ADR-003 (collection rendering)', () => {
  const script = resolve(repoRoot, 'TOOL/tools/wiki/adr-render.mjs')
  const stdout = execFileSync('node', [script, '--check'], { encoding: 'utf8' })
  assert.match(stdout, /adr-002: OK \(no drift\)/)
  assert.match(stdout, /adr-003: OK \(no drift\)/)
})

// --- Collection: duplicate ids/paths, per-doc drift, deterministic ordering ---

test('loadAdrCanonCollection rejects duplicate collection ids and duplicate collection paths', async () => {
  const { loadAdrCanonCollection, ADR_COLLECTION } = await canonModule()
  await rejects(
    loadAdrCanonCollection(canonRoot, [...ADR_COLLECTION, ADR_COLLECTION[0]]),
    'E_DUPLICATE_COLLECTION_ID',
  )
  const dupPath = [ADR_COLLECTION[0], { ...ADR_COLLECTION[1], id: 'ADR-003-DUP', locale: ADR_COLLECTION[0].locale }]
  await rejects(loadAdrCanonCollection(canonRoot, dupPath), 'E_DUPLICATE_COLLECTION_PATH')
})

test('loadAdrCanonCollection returns documents keyed by id in deterministic collection order', async () => {
  const { loadAdrCanonCollection, ADR_COLLECTION } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  assert.deepEqual([...canons.keys()], ['ADR-002', 'ADR-003'])
  assert.deepEqual(ADR_COLLECTION.map((entry) => entry.id), ['ADR-002', 'ADR-003'])
  const canonsAgain = await loadAdrCanonCollection(canonRoot)
  assert.deepEqual([...canonsAgain.keys()], [...canons.keys()])
})

test('materializeAdrCollection emits and drift-checks each document independently: a hand-edit to one output does not affect the other', async () => {
  const { materializeAdrCollection } = await renderModule()
  await sandbox(async ({ dir, root }) => {
    const sandboxAdrDir = join(dir, 'adr')
    await mkdir(sandboxAdrDir, { recursive: true })
    const args = { canonRoot: root, adrDir: sandboxAdrDir }

    const first = await materializeAdrCollection({ ...args, check: false })
    assert.equal(first.get('ADR-002').changed, true)
    assert.equal(first.get('ADR-003').changed, true)
    assert.equal(sha256(await readFile(join(sandboxAdrDir, 'ADR-002-character-candidate-retrospective.md'), 'utf8')), BASELINE_SHA_002)
    assert.equal(sha256(await readFile(join(sandboxAdrDir, 'ADR-003-real-place-and-station-naming.md'), 'utf8')), BASELINE_SHA)

    const clean = await materializeAdrCollection({ ...args, check: true })
    assert.equal(clean.get('ADR-002').changed, false)
    assert.equal(clean.get('ADR-003').changed, false)

    // Hand-edit only the ADR-002 output; ADR-003 must remain clean and E_DRIFT must name only ADR-002's path.
    const adr002Path = join(sandboxAdrDir, 'ADR-002-character-candidate-retrospective.md')
    await writeFile(adr002Path, (await readFile(adr002Path, 'utf8')).replace('캐릭터 후보', '캐릭터 시제'))
    const error = await materializeAdrCollection({ ...args, check: true }).catch((e) => e)
    assert.equal(error.code, 'E_DRIFT')
    assert.ok(error.message.includes('ADR-002-character-candidate-retrospective.md'), error.message)
    assert.ok(!error.message.includes('ADR-003-real-place-and-station-naming.md'), error.message)
  })
})
