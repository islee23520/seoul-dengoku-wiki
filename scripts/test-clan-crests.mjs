import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { LAYOUTS, MOTIFS, assignCrests, renderCrest } from './clan-crest.mjs'

const root = new URL('../', import.meta.url)
const tables = JSON.parse(await readFile(new URL('lore/name-pools/clan-hangnyeol-tables.json', root), 'utf8'))
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
const manifest = JSON.parse(await readFile(new URL('assets/clan-crest-motifs.json', root), 'utf8'))
const researched = new Map(manifest.motifs.map((row) => [row.clan, row]))
const selectedId = 'c774-c804-c758-674e'
const selectedHash = '748efdbd7bc111c230ae57d32285630312b35df2258abf6952d8cad36db3b01a'

async function expected(clan) {
  if (clan.id === selectedId) return readFile(new URL(`assets/clan-crests/${selectedId}.svg`, root), 'utf8')
  const choice = assigned.get(clan.id)
  return renderCrest(choice, researched.get(clan.id))
}

test('every clan has exactly one committed crest that matches the generator', async () => {
  const files = (await readdir(new URL('public/clan-crests/', root))).filter((name) => name.endsWith('.svg')).sort()
  assert.deepEqual(files, clans.map((clan) => `${clan.id}.svg`).sort())
  for (const clan of clans) assert.equal(await readFile(new URL(`public/clan-crests/${clan.id}.svg`, root), 'utf8'), await expected(clan), clan.id)
})

test('the selected Jeonui crest survives generation byte-for-byte', async () => {
  const source = await readFile(new URL(`assets/clan-crests/${selectedId}.svg`, root))
  const output = await readFile(new URL(`public/clan-crests/${selectedId}.svg`, root))
  const index = JSON.parse(await readFile(new URL('public/clan-crests/index.json', root), 'utf8'))
  assert.equal(createHash('sha256').update(source).digest('hex'), selectedHash)
  assert.deepEqual(output, source)
  assert.deepEqual(index.crests.filter((crest) => crest.surname === '이' && crest.bongwan === '전의'), [
    { id: selectedId, surname: '이', bongwan: '전의', source: 'selected', sha256: selectedHash },
  ])
})

test('no two clans share a crest and assignment is stable', async () => {
  const svgs = await Promise.all(clans.map(expected))
  assert.equal(new Set(svgs).size, clans.length)
  const again = assignCrests([...clans.map((clan) => clan.id)].reverse())
  for (const clan of clans) assert.deepEqual(again.get(clan.id), assigned.get(clan.id), clan.id)
})

test('generated crests are text-free, single-ink and use the whole vocabulary', () => {
  for (const clan of clans) {
    const svg = renderCrest(assigned.get(clan.id))
    assert.doesNotMatch(svg, /<text|<image|href=/, clan.id)
    assert.ok(new Set(svg.match(/#[0-9a-f]{6}/g).filter((c) => c !== '#ffffff')).size === 1, clan.id)
  }
  const choices = [...assigned.values()]
  assert.equal(new Set(choices.map((c) => c.layout)).size, LAYOUTS.length)
  assert.ok(new Set(choices.map((c) => c.motif)).size >= MOTIFS.length - 1)
})

test('researched motifs reference known clans without copying source geometry', async () => {
  const ids = new Set(clans.map((clan) => clan.id))
  assert.ok(manifest.motifs.length > 0)
  for (const row of manifest.motifs) {
    assert.ok(ids.has(row.clan), row.clan)
    assert.match(row.reference, /^https:\/\/upload\.wikimedia\.org\//, row.clan)
    const svg = await expected({ id: row.clan })
    assert.doesNotMatch(svg, /<text|<image|href=|<script/, row.clan)
    const colors = new Set((svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((c) => c.toLowerCase()).filter((c) => c !== '#ffffff'))
    assert.equal(colors.size, 1, row.clan)
  }
})
