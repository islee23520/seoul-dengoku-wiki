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
const selected = [
  { id: 'c774-c804-c758-674e', surname: '이', bongwan: '전의', source: 'selected', sha256: '748efdbd7bc111c230ae57d32285630312b35df2258abf6952d8cad36db3b01a' },
  { id: 'goryeong-shin', surname: '신', bongwan: '고령', source: 'selected', sha256: 'faccdb8a017eef79666f85bf2f4af6232b8d459f4115fe974ac0568c958441e8' },
]

async function expected(clan) {
  if (selected.some((crest) => crest.id === clan.id)) return readFile(new URL(`assets/clan-crests/${clan.id}.svg`, root), 'utf8')
  const choice = assigned.get(clan.id)
  return renderCrest(choice, researched.get(clan.id))
}

test('every clan has exactly one committed crest that matches the generator', async () => {
  const files = (await readdir(new URL('public/clan-crests/', root))).filter((name) => name.endsWith('.svg')).sort()
  assert.deepEqual(files, clans.map((clan) => `${clan.id}.svg`).sort())
  for (const clan of clans) assert.equal(await readFile(new URL(`public/clan-crests/${clan.id}.svg`, root), 'utf8'), await expected(clan), clan.id)
})

for (const crest of selected) test(`the selected ${crest.id} crest survives generation byte-for-byte`, async () => {
  const source = await readFile(new URL(`assets/clan-crests/${crest.id}.svg`, root))
  const output = await readFile(new URL(`public/clan-crests/${crest.id}.svg`, root))
  const index = JSON.parse(await readFile(new URL('public/clan-crests/index.json', root), 'utf8'))
  assert.equal(createHash('sha256').update(source).digest('hex'), crest.sha256)
  assert.deepEqual(output, source)
  assert.deepEqual(index.crests.filter((entry) => entry.surname === crest.surname && entry.bongwan === crest.bongwan), [crest])
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
