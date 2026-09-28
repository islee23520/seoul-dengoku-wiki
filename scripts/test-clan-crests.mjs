import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { LAYOUTS, MOTIFS, assignCrests, renderCrest } from './clan-crest.mjs'

const root = new URL('../', import.meta.url)
const tables = JSON.parse(await readFile(new URL('lore/name-pools/clan-hangnyeol-tables.json', root), 'utf8'))
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
const manifest = JSON.parse(await readFile(new URL('assets/clan-crest-motifs.json', root), 'utf8'))
const researched = new Map(manifest.motifs.map((row) => [row.clan, row]))

async function expected(clan) {
  const choice = assigned.get(clan.id)
  return renderCrest(choice, researched.get(clan.id))
}

test('every clan has exactly one committed crest that matches the generator', async () => {
  const files = (await readdir(new URL('public/clan-crests/', root))).filter((name) => name.endsWith('.svg')).sort()
  assert.deepEqual(files, clans.map((clan) => `${clan.id}.svg`).sort())
  for (const clan of clans) assert.equal(await readFile(new URL(`public/clan-crests/${clan.id}.svg`, root), 'utf8'), await expected(clan), clan.id)
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
