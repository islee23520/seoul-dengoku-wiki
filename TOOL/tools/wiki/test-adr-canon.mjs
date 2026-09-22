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
const adr001OutputPath = resolve(adrDir, 'ADR-001-repository-delivery-policy.md')
const adr004OutputPath = resolve(adrDir, 'ADR-004-root-domain-structure.md')
const adr005OutputPath = resolve(adrDir, 'ADR-005-backend-host-session-multiplayer.md')
const adr006OutputPath = resolve(adrDir, 'ADR-006-backend-aspnet-core-coordinator.md')
const files = {
  locale: 'locales/ko-KR/adr-003.json',
  locale002: 'locales/ko-KR/adr-002.json',
  locale001: 'locales/ko-KR/adr-001.json',
  locale004: 'locales/ko-KR/adr-004.json',
  locale005: 'locales/ko-KR/adr-005.json',
  locale006: 'locales/ko-KR/adr-006.json',
}
const BASELINE_SHA = '56c479db4d89478e55f974e691c0819e6ac339648351f934544329af09ff0ad4'
const BASELINE_SHA_002 = '131249858dc513cb99f8b47923d3cf1c085d75274752bd72f891158ba5247a6e'
const BASELINE_SHA_001 = '7889c3adfc96b32137790d6d2f4242536425eb520028e83b06a6631fbcb156db'
const BASELINE_SHA_004 = 'f0e81d8bf6b248470c7794d377c6855aff069cc9ac1b326dcb8cb2aab2359b07'
const BASELINE_SHA_005 = 'ac07dbc834d8e978024a7cbc3f9ff103dedf0bdd07cd752238ecba7f495eee69'
const BASELINE_SHA_006 = 'e5058c1788927cd22345739b505790ea78a97edee054981e11954cdcabd281be'
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
  assert.match(stdout, /adr-001: OK/)
  assert.match(stdout, /adr-002: OK/)
  assert.match(stdout, /adr-003: OK/)
  assert.match(stdout, /adr-004: OK/)
  assert.match(stdout, /adr-005: OK/)
  assert.match(stdout, /adr-006: OK/)
})

test('schema $defs are locally duplicated (no cross-file $ref) and reuse the shared block/inline shapes', async () => {
  const schemaText = await readFile(join(canonRoot, 'schema/adr.schema.json'), 'utf8')
  const schema = JSON.parse(schemaText)
  assert.deepEqual(Object.keys(schema.$defs).sort(), ['block', 'cell', 'id', 'inline', 'schemaVersion'])
  assert.ok(!schemaText.includes('"$ref": "structures.schema.json'))
  assert.ok(!schemaText.includes('"$ref": "offices.schema.json'))
})

test('schema declares a oneOf branch for every ADR collection member, including adr-005.json and adr-006.json', async () => {
  const schemaText = await readFile(join(canonRoot, 'schema/adr.schema.json'), 'utf8')
  const schema = JSON.parse(schemaText)
  assert.deepEqual(
    schema.oneOf.map((branch) => branch.title).sort(),
    [
      'locales/ko-KR/adr-001.json',
      'locales/ko-KR/adr-002.json',
      'locales/ko-KR/adr-003.json',
      'locales/ko-KR/adr-004.json',
      'locales/ko-KR/adr-005.json',
      'locales/ko-KR/adr-006.json',
    ],
  )
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

test('CLI --check adr-render passes for ADR-001, ADR-002, ADR-003, ADR-004, ADR-005 and ADR-006 (collection rendering)', () => {
  const script = resolve(repoRoot, 'TOOL/tools/wiki/adr-render.mjs')
  const stdout = execFileSync('node', [script, '--check'], { encoding: 'utf8' })
  assert.match(stdout, /adr-001: OK \(no drift\)/)
  assert.match(stdout, /adr-002: OK \(no drift\)/)
  assert.match(stdout, /adr-003: OK \(no drift\)/)
  assert.match(stdout, /adr-004: OK \(no drift\)/)
  assert.match(stdout, /adr-005: OK \(no drift\)/)
  assert.match(stdout, /adr-006: OK \(no drift\)/)
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
  assert.deepEqual([...canons.keys()], ['ADR-001', 'ADR-002', 'ADR-003', 'ADR-004', 'ADR-005', 'ADR-006'])
  assert.deepEqual(ADR_COLLECTION.map((entry) => entry.id), ['ADR-001', 'ADR-002', 'ADR-003', 'ADR-004', 'ADR-005', 'ADR-006'])
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
    assert.equal(first.get('ADR-001').changed, true)
    assert.equal(first.get('ADR-002').changed, true)
    assert.equal(first.get('ADR-003').changed, true)
    assert.equal(sha256(await readFile(join(sandboxAdrDir, 'ADR-001-repository-delivery-policy.md'), 'utf8')), BASELINE_SHA_001)
    assert.equal(sha256(await readFile(join(sandboxAdrDir, 'ADR-002-character-candidate-retrospective.md'), 'utf8')), BASELINE_SHA_002)
    assert.equal(sha256(await readFile(join(sandboxAdrDir, 'ADR-003-real-place-and-station-naming.md'), 'utf8')), BASELINE_SHA)

    const clean = await materializeAdrCollection({ ...args, check: true })
    assert.equal(clean.get('ADR-001').changed, false)
    assert.equal(clean.get('ADR-002').changed, false)
    assert.equal(clean.get('ADR-003').changed, false)

    // Hand-edit only the ADR-002 output; ADR-001 and ADR-003 must remain clean and E_DRIFT must name only ADR-002's path.
    const adr002Path = join(sandboxAdrDir, 'ADR-002-character-candidate-retrospective.md')
    await writeFile(adr002Path, (await readFile(adr002Path, 'utf8')).replace('캐릭터 후보', '캐릭터 시제'))
    const error = await materializeAdrCollection({ ...args, check: true }).catch((e) => e)
    assert.equal(error.code, 'E_DRIFT')
    assert.ok(error.message.includes('ADR-002-character-candidate-retrospective.md'), error.message)
    assert.ok(!error.message.includes('ADR-001-repository-delivery-policy.md'), error.message)
    assert.ok(!error.message.includes('ADR-003-real-place-and-station-naming.md'), error.message)
  })
})

// --- ADR-001 (first collection member) ---

test('ADR-001 source is characterized by SHA and line count (immutable historical ADR)', async () => {
  const text = await readFile(adr001OutputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA_001)
  assert.equal(text.split('\n').length - 1, 48)
})

test('ADR-001 rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const { renderAdrMarkdown } = await renderModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-001')
  const first = renderAdrMarkdown(canon)
  assert.equal(first, renderAdrMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA_001)
  assert.equal(first, await readFile(adr001OutputPath, 'utf8'))
})

test('ADR-001 canon preserves the repository delivery decision list and approval receipt blockquote wording byte-for-byte', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-001')
  const decisionList = canon.blocks.find((block) => block.id === 'adr-001.decision.list')
  assert.equal(decisionList.ordered, true)
  assert.equal(decisionList.items.length, 6)
  assert.ok(decisionList.items[0][0].text.startsWith('**Current remote.** The canonical repository is'))
  const quoteParagraph = canon.blocks.find((block) => block.id === 'adr-001.approval.quote')
  assert.equal(
    quoteParagraph.inlines[0].text,
    '> **[OKAY]**\n>\n> **Summary**: All file references exist, every task has executable QA scenarios (exact commands and expected outcomes), dependencies and commit boundaries are internally consistent, and no contradictions block execution.',
  )
})

test('ADR-001 canon has 16 blocks with 5 heading / 7 paragraph / 4 list, no table', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-001')
  assert.equal(canon.blocks.length, 16)
  const kindCounts = canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {})
  assert.deepEqual(kindCounts, { heading: 5, paragraph: 7, list: 4 })
})

test('materializeAdrCollection: a hand-edit to the ADR-001 output does not affect ADR-002 or ADR-003, and E_DRIFT names only ADR-001', async () => {
  const { materializeAdrCollection } = await renderModule()
  await sandbox(async ({ dir, root }) => {
    const sandboxAdrDir = join(dir, 'adr')
    await mkdir(sandboxAdrDir, { recursive: true })
    const args = { canonRoot: root, adrDir: sandboxAdrDir }
    await materializeAdrCollection({ ...args, check: false })

    const adr001Path = join(sandboxAdrDir, 'ADR-001-repository-delivery-policy.md')
    await writeFile(adr001Path, (await readFile(adr001Path, 'utf8')).replace('Repository delivery policy', 'Repository shipping policy'))
    const error = await materializeAdrCollection({ ...args, check: true }).catch((e) => e)
    assert.equal(error.code, 'E_DRIFT')
    assert.ok(error.message.includes('ADR-001-repository-delivery-policy.md'), error.message)
    assert.ok(!error.message.includes('ADR-002-character-candidate-retrospective.md'), error.message)
    assert.ok(!error.message.includes('ADR-003-real-place-and-station-naming.md'), error.message)
  })
})

// --- ADR-004 (fourth collection member) ---

test('ADR-004 source is characterized by SHA and line count (immutable accepted ADR)', async () => {
  const text = await readFile(adr004OutputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA_004)
  assert.equal(text.split('\n').length - 1, 42)
})

test('ADR-004 rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const { renderAdrMarkdown } = await renderModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-004')
  const first = renderAdrMarkdown(canon)
  assert.equal(first, renderAdrMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA_004)
  assert.equal(first, await readFile(adr004OutputPath, 'utf8'))
})

test('ADR-004 canon preserves the root allowlist table and legacy root utility exception wording byte-for-byte', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-004')
  const table = canon.blocks.find((block) => block.kind === 'table')
  assert.equal(table.rows.length, 11)
  assert.deepEqual(table.rows[0], ['`GDD/`', '모든 게임 설계 정본: 제품·규칙·레퍼런스·아키텍처·아트·ADR·제안·시스템 설계'])
  assert.deepEqual(table.rows[4], [
    '`ART-ASSETS/`',
    '편집 가능한 원본 아트·Blender·FBX·텍스처·선별 검토 증거의 정본. 실행 도구는 TOOL, Unity 승격본은 GAME이 소유한다.',
  ])
  const rootFilesParagraph = canon.blocks.find((block) => block.id === 'adr-004.rootfiles.p1')
  assert.equal(
    rootFilesParagraph.inlines[0].text,
    '루트 설정 파일 허용 목록: `.gitattributes` `.gitignore` `.gitmodules` `.vercelignore` `AGENTS.md` `CLAUDE.md` `CONCEPT`류 기획 문서(`Concept.md` `Design.md` `Intent.md` `ToDo.md`) `CONTRIBUTING.md` `README.md` `SERVICES.md` `index.html` `package.json` `package-lock.json` `vercel.json`. 2026-09-21 현재 main에 이미 추적된 진단 유틸리티 `test-regex.mjs`, `update_states.py`는 별도 정리 전까지 legacy root utility로 허용한다. 신규 루트 유틸리티의 추가 권한은 아니다.',
  )
  const policyPathParagraph = canon.blocks.find((block) => block.id === 'adr-004.decision.p1')
  assert.ok(policyPathParagraph.inlines[0].text.includes('`Tool/tools/policy/check-repo-delivery-policy.mjs`'))
})

test('ADR-004 canon has 12 blocks with 5 heading / 3 paragraph / 3 list / 1 table', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-004')
  assert.equal(canon.blocks.length, 12)
  const kindCounts = canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {})
  assert.deepEqual(kindCounts, { heading: 5, paragraph: 3, list: 3, table: 1 })
})

test('materializeAdrCollection: a hand-edit to the ADR-004 output does not affect ADR-001..003, and E_DRIFT names only ADR-004', async () => {
  const { materializeAdrCollection } = await renderModule()
  await sandbox(async ({ dir, root }) => {
    const sandboxAdrDir = join(dir, 'adr')
    await mkdir(sandboxAdrDir, { recursive: true })
    const args = { canonRoot: root, adrDir: sandboxAdrDir }
    await materializeAdrCollection({ ...args, check: false })

    const adr004Path = join(sandboxAdrDir, 'ADR-004-root-domain-structure.md')
    await writeFile(adr004Path, (await readFile(adr004Path, 'utf8')).replace('루트 도메인과 단일 설계 정본', '루트 도메인과 통합 설계 정본'))
    const error = await materializeAdrCollection({ ...args, check: true }).catch((e) => e)
    assert.equal(error.code, 'E_DRIFT')
    assert.ok(error.message.includes('ADR-004-root-domain-structure.md'), error.message)
    assert.ok(!error.message.includes('ADR-001-repository-delivery-policy.md'), error.message)
    assert.ok(!error.message.includes('ADR-002-character-candidate-retrospective.md'), error.message)
    assert.ok(!error.message.includes('ADR-003-real-place-and-station-naming.md'), error.message)
  })
})

// --- ADR-005 (fifth collection member) ---

test('ADR-005 source is characterized by SHA and line count (immutable accepted ADR)', async () => {
  const text = await readFile(adr005OutputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA_005)
  assert.equal(text.split('\n').length - 1, 33)
})

test('ADR-005 rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const { renderAdrMarkdown } = await renderModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-005')
  const first = renderAdrMarkdown(canon)
  assert.equal(first, renderAdrMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA_005)
  assert.equal(first, await readFile(adr005OutputPath, 'utf8'))
})

test('ADR-005 canon preserves the host-authority decision list and the inline ADR-006 supersession notes byte-for-byte', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-005')
  const decisionList = canon.blocks.find((block) => block.id === 'adr-005.decision.list')
  assert.equal(decisionList.ordered, true)
  assert.equal(decisionList.items.length, 6)
  assert.ok(decisionList.items[1][0].text.startsWith('**호스트가 권위다.**'))
  assert.ok(
    decisionList.items[3][0].text.includes(
      '*(2026-09-18 폐기, [ADR-006](ADR-006-backend-aspnet-core-coordinator.md)으로 대체: 기존 Auth는 삭제되고 신원은 코디네이터 프로세스 안에서 발급·검증한다.)*',
    ),
  )
  assert.ok(decisionList.items[5][0].text.includes('`RealtimePort` 이중 포트는 사라진다.)*'))
  const rulesList = canon.blocks.find((block) => block.id === 'adr-005.rules.list')
  assert.equal(rulesList.items.length, 4)
  assert.ok(rulesList.items[1][0].text.includes('계정·스펙은 기존 MySQL·Redis 유지'))
  const impactList = canon.blocks.find((block) => block.id === 'adr-005.impact.list')
  assert.equal(impactList.ordered, false)
  assert.equal(impactList.items.length, 3)
  assert.ok(impactList.items[2][0].text.includes('1219(HTTP)와 1220(WebSocket) 두 포트가 열린다'))
  const metaList = canon.blocks.find((block) => block.id === 'adr-005.meta.list')
  assert.equal(metaList.items.length, 3)
  assert.ok(metaList.items[2][0].text.startsWith('후속: [ADR-006](ADR-006-backend-aspnet-core-coordinator.md)'))
})

test('ADR-005 canon has 11 blocks with 5 heading / 2 paragraph / 4 list, no table', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-005')
  assert.equal(canon.blocks.length, 11)
  const kindCounts = canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {})
  assert.deepEqual(kindCounts, { heading: 5, paragraph: 2, list: 4 })
})

test('materializeAdrCollection: a hand-edit to the ADR-005 output does not affect ADR-001..004 or ADR-006, and E_DRIFT names only ADR-005', async () => {
  const { materializeAdrCollection } = await renderModule()
  await sandbox(async ({ dir, root }) => {
    const sandboxAdrDir = join(dir, 'adr')
    await mkdir(sandboxAdrDir, { recursive: true })
    const args = { canonRoot: root, adrDir: sandboxAdrDir }
    await materializeAdrCollection({ ...args, check: false })

    const adr005Path = join(sandboxAdrDir, 'ADR-005-backend-host-session-multiplayer.md')
    await writeFile(adr005Path, (await readFile(adr005Path, 'utf8')).replace('호스트 세션 기반 멀티플레이', '호스트 세션 기반 협력플레이'))
    const error = await materializeAdrCollection({ ...args, check: true }).catch((e) => e)
    assert.equal(error.code, 'E_DRIFT')
    assert.ok(error.message.includes('ADR-005-backend-host-session-multiplayer.md'), error.message)
    assert.ok(!error.message.includes('ADR-001-repository-delivery-policy.md'), error.message)
    assert.ok(!error.message.includes('ADR-002-character-candidate-retrospective.md'), error.message)
    assert.ok(!error.message.includes('ADR-003-real-place-and-station-naming.md'), error.message)
    assert.ok(!error.message.includes('ADR-004-root-domain-structure.md'), error.message)
    assert.ok(!error.message.includes('ADR-006-backend-aspnet-core-coordinator.md'), error.message)
  })
})

// --- ADR-006 (sixth collection member) ---

test('ADR-006 source is characterized by SHA and line count (immutable accepted ADR)', async () => {
  const text = await readFile(adr006OutputPath, 'utf8')
  assert.equal(sha256(text), BASELINE_SHA_006)
  assert.equal(text.split('\n').length - 1, 41)
})

test('ADR-006 rendered markdown is byte-identical to the frozen source and deterministic', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const { renderAdrMarkdown } = await renderModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-006')
  const first = renderAdrMarkdown(canon)
  assert.equal(first, renderAdrMarkdown(canon))
  assert.equal(sha256(first), BASELINE_SHA_006)
  assert.equal(first, await readFile(adr006OutputPath, 'utf8'))
})

test('ADR-006 canon preserves the port, deleted-services and supersession decision wording byte-for-byte', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-006')
  const decisionList = canon.blocks.find((block) => block.id === 'adr-006.decision.list')
  assert.equal(decisionList.ordered, true)
  assert.equal(decisionList.items.length, 7)
  assert.ok(decisionList.items[0][0].text.includes('순수 ASP.NET Core(.NET 8) 단일 Kestrel이고 포트는 1219 하나'))
  assert.ok(decisionList.items[2][0].text.includes('Auth·Hero·Lobby·Station·Social은 보존이나 아카이브 없이 지운다'))
  const impactList = canon.blocks.find((block) => block.id === 'adr-006.impact.list')
  assert.ok(impactList.items[0][0].text.includes('ADR-005 결정 4(기존 Auth 재사용), 결정 5(계정 메타 보존), 결정 6(전송 분리)'))
  assert.ok(impactList.items[3][0].text.includes('[온라인 유저 여정](../Online-User-Journey.md)'))
  const deprecatedList = canon.blocks.find((block) => block.id === 'adr-006.deprecated.list')
  assert.equal(deprecatedList.items.length, 4)
  assert.ok(deprecatedList.items[0][0].text.includes('`server/Y2K/`'))
  assert.ok(deprecatedList.items[3][0].text.includes('13306·16379'))
})

test('ADR-006 canon has 13 blocks with 6 heading / 2 paragraph / 5 list, no table', async () => {
  const { loadAdrCanonCollection } = await canonModule()
  const canons = await loadAdrCanonCollection(canonRoot)
  const canon = canons.get('ADR-006')
  assert.equal(canon.blocks.length, 13)
  const kindCounts = canon.blocks.map((block) => block.kind).reduce((acc, kind) => ({ ...acc, [kind]: (acc[kind] ?? 0) + 1 }), {})
  assert.deepEqual(kindCounts, { heading: 6, paragraph: 2, list: 5 })
})

test('materializeAdrCollection: a hand-edit to the ADR-006 output does not affect ADR-001..004, and E_DRIFT names only ADR-006', async () => {
  const { materializeAdrCollection } = await renderModule()
  await sandbox(async ({ dir, root }) => {
    const sandboxAdrDir = join(dir, 'adr')
    await mkdir(sandboxAdrDir, { recursive: true })
    const args = { canonRoot: root, adrDir: sandboxAdrDir }
    await materializeAdrCollection({ ...args, check: false })

    const adr006Path = join(sandboxAdrDir, 'ADR-006-backend-aspnet-core-coordinator.md')
    await writeFile(adr006Path, (await readFile(adr006Path, 'utf8')).replace('Y2K 탈피와 ASP.NET Core 코디네이터', 'Y2K 탈피와 Kestrel 코디네이터'))
    const error = await materializeAdrCollection({ ...args, check: true }).catch((e) => e)
    assert.equal(error.code, 'E_DRIFT')
    assert.ok(error.message.includes('ADR-006-backend-aspnet-core-coordinator.md'), error.message)
    assert.ok(!error.message.includes('ADR-001-repository-delivery-policy.md'), error.message)
    assert.ok(!error.message.includes('ADR-002-character-candidate-retrospective.md'), error.message)
    assert.ok(!error.message.includes('ADR-003-real-place-and-station-naming.md'), error.message)
    assert.ok(!error.message.includes('ADR-004-root-domain-structure.md'), error.message)
  })
})
