import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assignCrests, renderCrest } from './clan-crest.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'clan-crests')
const tables = JSON.parse(await readFile(join(root, 'lore/name-pools/clan-hangnyeol-tables.json'), 'utf8'))
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
const motifs = new Map(JSON.parse(await readFile(join(root, 'assets', 'clan-crest-motifs.json'), 'utf8')).motifs.map((row) => [row.clan, row]))
const selected = new Map([
  ['c774-c804-c758-674e', '748efdbd7bc111c230ae57d32285630312b35df2258abf6952d8cad36db3b01a'],
  ['goryeong-shin', 'faccdb8a017eef79666f85bf2f4af6232b8d459f4115fe974ac0568c958441e8'],
])

await mkdir(outDir, { recursive: true })
for (const name of await readdir(outDir)) if (name.endsWith('.svg')) await rm(join(outDir, name))
const index = []
for (const clan of clans) {
  const choice = assigned.get(clan.id)
  const motif = motifs.get(clan.id)
  const selectedHash = selected.get(clan.id)
  const svg = selectedHash ? await readFile(join(root, 'assets', 'clan-crests', `${clan.id}.svg`)) : renderCrest(choice, motif)
  if (selectedHash && createHash('sha256').update(svg).digest('hex') !== selectedHash) throw new Error(`E_SELECTED_CREST_HASH:${clan.id}`)
  await writeFile(join(outDir, `${clan.id}.svg`), svg)
  index.push({ id: clan.id, surname: clan.surname, bongwan: clan.bongwan, source: selectedHash ? 'selected' : motif ? 'researched' : 'generated', ...(selectedHash ? { sha256: selectedHash } : motif ? { reference: motif.reference, motif: motif.motif } : choice) })
}
await writeFile(join(outDir, 'index.json'), JSON.stringify({ schema: 2, count: index.length, crests: index }, null, 2) + '\n')
console.log(`clan-crests: ${index.length}`)
