import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { loadOfficesCanon } from './offices-canon.mjs'
import { loadStateRegistry, materializeOffices, renderOfficesMarkdown } from './offices-render.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const canonRoot = resolve(repoRoot, 'LORE/canon')
const atlasPath = resolve(repoRoot, 'LORE/World-Narrative-Atlas.md')
const outputPath = resolve(repoRoot, 'LORE/offices/Offices-and-Ranks.md')
const files = {
  tiers: 'tables/office-tiers.json',
  titles: 'relations/state-office-titles.json',
  locale: 'locales/ko-KR/offices-and-ranks.json',
}
const BASELINE_SHA = 'e03778b8c84dfd69c9972f16b79fd98695b6e869203c328088e6e450c62d86de'
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex')

const registry = await loadStateRegistry(atlasPath)

async function sandbox(mutate) {
  const dir = await mkdtemp(join(tmpdir(), 'offices-canon-'))
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

test('baseline: original markdown is characterized by SHA, lines and table shapes', async () => {
  const disk = await readFile(outputPath, 'utf8')
  const original = disk.replace('### 교헌필사정\n', '### 원불교\n')
  assert.equal(sha256(original), BASELINE_SHA)
  assert.equal(original.split('\n').length - 1, 126)
  const tables = original.split('\n\n').filter((block) => block.startsWith('|'))
  assert.deepEqual(tables.map((table) => table.split('\n').length - 2), [5, 16, 5])
})

test('canon holds S01-S16 x T1-T5 as 80 unique composites', async () => {
  const canon = await loadOfficesCanon(canonRoot, registry)
  assert.deepEqual(canon.tiers.map((tier) => tier.id), ['T1', 'T2', 'T3', 'T4', 'T5'])
  assert.equal(canon.titles.length, 80)
  assert.equal(new Set(canon.titles.map((row) => `${row.stateId}:${row.tierId}`)).size, 80)
  assert.deepEqual([...new Set(canon.titles.map((row) => row.stateId))].sort(), [...registry.keys()].sort())
})

test('rendered markdown is byte-identical to the file on disk and deterministic', async () => {
  const canon = await loadOfficesCanon(canonRoot, registry)
  const first = renderOfficesMarkdown(canon, registry)
  assert.equal(first, renderOfficesMarkdown(canon, registry))
  assert.equal(first, await readFile(outputPath, 'utf8'))
})

test('only the S08 heading differs from the baseline and descriptive 원불교 survives', async () => {
  const disk = await readFile(outputPath, 'utf8')
  assert.equal(disk.match(/^### 교헌필사정$/gm)?.length, 1)
  assert.equal(disk.match(/^### 원불교$/gm), null)
  assert.match(disk, /흑석동 서울교당·소태산기념관의 교헌 직제다/)
  assert.equal(disk.includes('원불교'), false)
})

test('commonTier consumer regex reads the same state-to-titles map as the JSON relation', async () => {
  const canon = await loadOfficesCanon(canonRoot, registry)
  const markdown = renderOfficesMarkdown(canon, registry)
  const table = markdown.match(/\| 국가 \| 티어1 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
  const parsed = new Map([...table.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
    .map((match) => [match[1].trim(), match.slice(2).map((cell) => cell.trim())]))
  const texts = new Map(canon.texts.map((row) => [row.id, row.text]))
  for (const [stateId, name] of registry) {
    const expected = canon.tiers.map((tier) => texts.get(canon.titles.find((row) => row.stateId === stateId && row.tierId === tier.id).titleKey))
    assert.deepEqual(parsed.get(name), expected, stateId)
  }
})

test('state display names come from the registry, not from the canon', async () => {
  const canon = await loadOfficesCanon(canonRoot, registry)
  const renamed = new Map(registry).set('S06', '대한민국정부X')
  const markdown = renderOfficesMarkdown(canon, renamed)
  assert.match(markdown, /^\| 대한민국정부X \| 대통령 \|/m)
  assert.doesNotMatch(markdown, /^\| 대한민국정부 \|/m)
})

test('materialize check fails when markdown is hand-edited and passes when generated', async () => {
  await sandbox(async ({ dir, root }) => {
    const out = join(dir, 'Offices-and-Ranks.md')
    assert.equal((await materializeOffices({ canonRoot: root, atlasPath, outputPath: out, check: false })).changed, true)
    assert.equal((await materializeOffices({ canonRoot: root, atlasPath, outputPath: out, check: false })).changed, false)
    assert.equal((await materializeOffices({ canonRoot: root, atlasPath, outputPath: out, check: true })).changed, false)
    await writeFile(out, (await readFile(out, 'utf8')).replace('대통령', '대통령님'))
    await rejects(materializeOffices({ canonRoot: root, atlasPath, outputPath: out, check: true }), 'E_DRIFT')
  })
})

test('invalid canon aborts before the output file is touched', async () => {
  await sandbox(async ({ dir, root, edit }) => {
    const out = join(dir, 'Offices-and-Ranks.md')
    await writeFile(out, 'sentinel\n')
    await edit('titles', (data) => ({ ...data, rows: data.rows.slice(1) }))
    await rejects(materializeOffices({ canonRoot: root, atlasPath, outputPath: out, check: false }), 'E_MISSING_COMPOSITE')
    assert.equal(await readFile(out, 'utf8'), 'sentinel\n')
  })
})

test('loader rejects malformed, missing, duplicate, dangling and unsupported input', async () => {
  const cases = [
    ['E_JSON_MALFORMED', async ({ root }) => writeFile(join(root, files.tiers), '{ nope')],
    ['E_DUPLICATE_JSON_KEY', async ({ root }) => writeFile(join(root, files.tiers), '{"schemaVersion":1,"rows":[],"rows":[{"id":"T1","order":1}]}')],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', (d) => ({ ...d, blocks: d.blocks.map((b, i) => (i === 0 ? { ...b, level: 4, kind: 'heading' } : b)) }))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('tiers', (d) => ({ ...d, rows: d.rows.map((r, i) => (i === 0 ? { ...r, extra: 1 } : r)) }))],
    ...['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__'].flatMap((key) => [
      ['E_SCHEMA_SHAPE', async ({ root }) => writeFile(join(root, files.tiers), `{"schemaVersion":1,"rows":[{"id":"T1","order":1,"${key}":1}]}`)],
      ['E_SCHEMA_SHAPE', async ({ root }) => writeFile(join(root, files.titles), `{"schemaVersion":1,"${key}":1,"rows":[]}`)],
    ]),
    ['E_SCHEMA_SHAPE', async ({ root }) => {
      const path = join(root, 'schema/offices.schema.json')
      const schema = JSON.parse(await readFile(path, 'utf8'))
      schema.oneOf[0].properties.rows.items.properties.id.pattern = '^X$'
      await writeFile(path, JSON.stringify(schema))
    }],
    ['E_FILE_MISSING', async ({ root }) => rm(join(root, files.locale))],
    ['E_SCHEMA_VERSION', async ({ edit }) => edit('tiers', (d) => ({ ...d, schemaVersion: 2 }))],
    ['E_DUPLICATE_ID', async ({ edit }) => edit('tiers', (d) => ({ ...d, rows: [...d.rows, d.rows[0]] }))],
    ['E_DUPLICATE_COMPOSITE', async ({ edit }) => edit('titles', (d) => ({ ...d, rows: [...d.rows.slice(1), { ...d.rows[1], titleKey: d.rows[0].titleKey }] }))],
    ['E_MISSING_COMPOSITE', async ({ edit }) => edit('titles', (d) => ({ ...d, rows: d.rows.slice(0, 79) }))],
    ['E_FK_STATE', async ({ edit }) => edit('titles', (d) => ({ ...d, rows: d.rows.map((r, i) => (i === 0 ? { ...r, stateId: 'S99' } : r)) }))],
    ['E_FK_TIER', async ({ edit }) => edit('titles', (d) => ({ ...d, rows: d.rows.map((r, i) => (i === 0 ? { ...r, tierId: 'T9' } : r)) }))],
    ['E_FK_TEXT', async ({ edit }) => edit('titles', (d) => ({ ...d, rows: d.rows.map((r, i) => (i === 0 ? { ...r, titleKey: 'office.none' } : r)) }))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', (d) => ({ ...d, blocks: d.blocks.map((b, i) => (i === 0 ? { ...b, kind: 'list' } : b)) }))],
    ['E_SCHEMA_SHAPE', async ({ edit }) => edit('locale', (d) => ({ ...d, blocks: d.blocks.map((b) => (b.kind === 'paragraph' ? { ...b, inlines: [{ kind: 'strong', text: 'x' }] } : b)) }))],
    ['E_DOCUMENT_BLOCKS', async ({ edit }) => edit('locale', (d) => ({ ...d, document: { ...d.document, blockIds: [...d.document.blockIds, d.document.blockIds[0]] } }))],
    ['E_DOCUMENT_BLOCKS', async ({ edit }) => edit('locale', (d) => ({ ...d, document: { ...d.document, blockIds: d.document.blockIds.slice(1) } }))],
    ['E_TABLE_SHAPE', async ({ edit }) => edit('locale', (d) => ({ ...d, blocks: d.blocks.map((b) => (b.kind === 'table' && b.rows ? { ...b, rows: [b.rows[0].slice(1), ...b.rows.slice(1)] } : b)) }))],
  ]
  for (const [code, mutate] of cases) {
    await sandbox(async (ctx) => {
      await mutate(ctx)
      await rejects(loadOfficesCanon(ctx.root, registry), code)
    })
  }
})

test('a registry without a canon state is an FK error', async () => {
  const trimmed = new Map(registry)
  trimmed.delete('S16')
  await rejects(loadOfficesCanon(canonRoot, trimmed), 'E_FK_STATE')
})

test('generated document preserves 21 headings, 25 paragraphs, 3 tables and both links', async () => {
  const lines = (await readFile(outputPath, 'utf8')).split('\n')
  assert.equal(lines.filter((line) => /^#{1,3} /.test(line)).length, 21)
  assert.equal(lines.filter((line) => line && !line.startsWith('#') && !line.startsWith('|')).length, 25)
  assert.equal(lines.filter((line) => line.startsWith('| ---') || line.startsWith('|---')).length, 3)
  const text = lines.join('\n')
  assert.ok(text.includes('[야망](../characters/Ambitions-and-Relations.md)'))
  assert.ok(text.includes('[후계, 이름 로스터, 세계 원장](../characters/Heirs-Names-and-World-Ledger.md)'))
})
