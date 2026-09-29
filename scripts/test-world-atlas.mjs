import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { materializeWorldAtlas } from './materialize-world-atlas.mjs'
import { parseWorldAtlas, sha256Text } from './world-atlas-parse.mjs'
import {
  ATLAS_SCHEMA,
  PROJECTION_PATHS,
  canonicalJson,
} from './world-atlas-schema.mjs'
import { projectionsFromAtlas } from './world-atlas-render.mjs'
import { verifyAtlasPeople } from './world-atlas-verify.mjs'

const worktree = fileURLToPath(new URL('..', import.meta.url))
// Scratch output for materializer tests lives in a per-run temporary directory, never in lore.
const evidenceRoot = await mkdtemp(join(tmpdir(), 'wiki-world-atlas-'))
const candidatePath = join(worktree, 'lore/World-Narrative-Atlas.json')
const sourceText = await readFile(candidatePath, 'utf8')
const parsed = parseWorldAtlas(sourceText)
assert.equal(parsed.ok, true, parsed.error)
const source = parsed.value
const atlas = source.data.atlas
const projections = projectionsFromAtlas(source, sha256Text(sourceText))

const context = {
  registry: JSON.parse(await readFile(join(worktree, 'lore/name-pools/person-id-registry.json'), 'utf8')),
  candidates: JSON.parse(await readFile(join(worktree, 'lore/name-pools/person-id-candidates.json'), 'utf8')),
  people: JSON.parse(await readFile(join(worktree, 'lore/name-pools/values-cast.json'), 'utf8')).people,
}

test('JSON atlas parser owns WNA-001 data.atlas v2', () => {
  assert.equal(source.id, 'WNA-001')
  assert.equal(atlas.schema, ATLAS_SCHEMA)
  assert.equal(atlas.states.length, 16)
  assert.equal(atlas.humans.length, 422)
  assert.deepEqual(Object.keys(atlas.unaffiliated), ['K1003', 'K1004', 'K1008', 'K1009', 'K1010', 'K1017', 'K1018', 'K1019'])
})

for (const [name, mutate, code] of [
  ['invalid JSON', (text) => `${text.slice(0, -2)}\n`, 'E_ATLAS_JSON'],
  ['wrong document ID', (text) => { const value = JSON.parse(text); value.id = 'WNA'; return JSON.stringify(value) }, 'E_ATLAS_ID'],
  ['wrong atlas schema', (text) => text.replace(ATLAS_SCHEMA, 'world-narrative-atlas.v1'), 'E_ATLAS_SCHEMA'],
  ['missing atlas data', (text) => text.replace('"atlas": {', '"removed_atlas": {'), 'E_ATLAS_DATA'],
]) {
  test(`JSON atlas parser rejects ${name}`, () => {
    const result = parseWorldAtlas(mutate(sourceText))
    assert.equal(result.ok, false)
    assert.match(result.error, new RegExp(code))
  })
}

test('renderer returns the exact 34 canonical JSON destinations', () => {
  assert.deepEqual(Object.keys(projections).sort(), [...PROJECTION_PATHS].sort())
  for (const [path, envelope] of Object.entries(projections)) {
    assert.equal(envelope.source.kind, 'computed', path)
    assert.equal(envelope.source.hash, sha256Text(sourceText), path)
    assert.equal(envelope.provenance.original_anchor, 'lore/World-Narrative-Atlas.json', path)
    assert.equal(envelope.provenance.original_hash, sha256Text(sourceText), path)
  }
})

test('expansion projection links every unaffiliated ID to its actual person route', () => {
  const table = projections['World-Expansion-Index.json'].content.find((node) => node.kind === 'table')
  for (const locale of ['en', 'ko']) {
    const links = table.rows.map((row) => row[1][locale].match(/\]\((\/people\/person-\d{4})\)$/u)?.[1])
    assert.deepEqual(links, Object.keys(atlas.unaffiliated).map((id) => `/people/person-${id.slice(1).padStart(4, '0')}`), locale)
  }
})

test('projections carry lore links and bold as runs, and no Korean in English leaves', () => {
  const hangul = /[가-힯]/u
  for (const [path, envelope] of Object.entries(projections)) {
    const visit = (value, where, english) => {
      if (typeof value === 'string') {
        assert.ok(!(english && hangul.test(value)), `${path} ${where}: ${value.slice(0, 60)}`)
        return
      }
      if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${where}[${index}]`, english))
      if (!value || typeof value !== 'object') return
      for (const [key, child] of Object.entries(value)) if (key !== 'link') visit(child, `${where}.${key}`, english || key === 'en')
    }
    visit(envelope, '$', false)
    for (const node of envelope.content.filter((block) => block.kind === 'paragraph')) {
      for (const locale of ['en', 'ko']) {
        const plain = typeof node.text[locale] === 'string' ? [node.text[locale]] : node.text[locale].map((run) => run.text)
        for (const value of plain) assert.doesNotMatch(value, /\*\*|\[[^\]]+\]\([^)]*\)|(?:^|\n)#{1,6} /u, `${path} ${node.anchor} ${locale}`)
      }
    }
  }
  const dossier = projections['bestiary/groups/Hostile-Group-G01.json']
  assert.deepEqual(dossier.content[1].text.ko, [{ text: '생태·변이 도감', link: { domain: 'bestiary', slug: 'Hostile-Ecology-Index' } }])
  const entry = dossier.content.find((node) => node.publicAnchors?.includes('g01e01'))
  assert.equal(entry?.kind, 'heading')
})

test('canonical serialization sorts object keys recursively without reordering arrays', () => {
  const value = { z: { b: 2, a: 1 }, a: [{ z: 1, a: 2 }, { b: 3, a: 4 }] }
  const once = canonicalJson(value)
  const twice = canonicalJson(JSON.parse(once))
  assert.equal(once, twice)
  assert.equal(once, '{\n  "a": [\n    {\n      "a": 2,\n      "z": 1\n    },\n    {\n      "a": 4,\n      "b": 3\n    }\n  ],\n  "z": {\n    "a": 1,\n    "b": 2\n  }\n}\n')
})

test('people verifier preserves the frozen prefix and issued unaffiliated aliases', () => {
  assert.deepEqual(verifyAtlasPeople(atlas, context), {
    failures: [], stateCount: 422, unaffiliatedCount: 8, total: 430,
  })
  assert.deepEqual(atlas.humans.map(({ id, name }) => ({ id, name: name.ko })), context.candidates.existingK)
})

for (const [name, mutate, code] of [
  ['missing collection', (value) => { delete value.unaffiliated }, 'E_UNAFFILIATED_COLLECTION'],
  ['missing card', (value) => { delete value.unaffiliated.K1008 }, 'E_UNAFFILIATED_MISSING:'],
  ['changed alias', (value) => { value.unaffiliated.K1003.character_id = 'K1003' }, 'E_UNAFFILIATED_CHARACTER_ID:'],
  ['duplicate state ID', (value) => { value.unaffiliated.K001 = value.unaffiliated.K1008; delete value.unaffiliated.K1008 }, 'E_PERSON_DUPLICATE:'],
  ['seventeenth state', (value) => { value.states.push({ id: 'S00' }) }, 'E_ATLAS_STATES'],
  ['frozen prefix renamed', (value) => { value.humans[0].name.ko = 'changed' }, 'E_K_MAP:'],
]) {
  test(`people verifier rejects ${name}`, () => {
    const changed = structuredClone(atlas)
    mutate(changed)
    const result = verifyAtlasPeople(changed, context)
    assert.ok(result.failures.some((failure) => failure.startsWith(code)), JSON.stringify(result))
  })
}

test('bulk materialization is byte-stable and selected check is read-only', async () => {
  const directory = join(evidenceRoot, 'test-materialize')
  await rm(directory, { recursive: true, force: true })
  await mkdir(directory, { recursive: true })
  const options = { atlasPath: candidatePath, outDir: directory }
  try {
    const written = await materializeWorldAtlas(options)
    // 소유자 결정(2026-09-28)으로 G27 페이지를 지워 투영은 33개다.
    assert.equal(written.projections.length, 33)
    const before = await readFile(join(directory, PROJECTION_PATHS[0]), 'utf8')
    assert.deepEqual(await materializeWorldAtlas({ ...options, check: true }), written)
    assert.deepEqual(await materializeWorldAtlas({ ...options, projection: PROJECTION_PATHS[0], check: true }), {
      ...written,
      projections: [PROJECTION_PATHS[0]],
    })
    assert.equal(await readFile(join(directory, PROJECTION_PATHS[0]), 'utf8'), before)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('check reports stale, missing, unexpected, misplaced and Markdown twins together', async () => {
  const directory = join(evidenceRoot, 'test-mutations')
  await rm(directory, { recursive: true, force: true })
  await mkdir(directory, { recursive: true })
  const options = { atlasPath: candidatePath, outDir: directory }
  try {
    await materializeWorldAtlas(options)
    const stale = PROJECTION_PATHS[0]
    const missing = PROJECTION_PATHS[1]
    await writeFile(join(directory, stale), '{}\n')
    await rm(join(directory, missing))
    await writeFile(join(directory, 'Unexpected-Atlas.json'), '{}\n')
    await writeFile(join(directory, stale.replace(/\.json$/u, '.md')), '# twin\n')
    await mkdir(join(directory, 'wrong'), { recursive: true })
    await writeFile(join(directory, 'wrong', PROJECTION_PATHS[2].split('/').at(-1)), canonicalJson(projections[PROJECTION_PATHS[2]]))
    await assert.rejects(materializeWorldAtlas({ ...options, check: true }), (error) => {
      for (const code of ['E_PROJECTION_STALE', 'E_PROJECTION_MISSING', 'E_PROJECTION_UNEXPECTED', 'E_PROJECTION_MARKDOWN_TWIN', 'E_PROJECTION_MISPLACED']) {
        assert.match(error.message, new RegExp(code))
      }
      return true
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('materializer rejects paths outside the projection vocabulary', async () => {
  await assert.rejects(materializeWorldAtlas({ atlasPath: candidatePath, outDir: evidenceRoot, projection: '../World-Narrative-Atlas.json' }), /E_PROJECTION_NAME/)
})
