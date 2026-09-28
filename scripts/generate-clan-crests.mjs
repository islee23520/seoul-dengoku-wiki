import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assignCrests, renderCrest } from './clan-crest.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'clan-crests')
const tables = JSON.parse(await readFile(join(root, 'lore/name-pools/clan-hangnyeol-tables.json'), 'utf8'))
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
const motifs = new Map(JSON.parse(await readFile(join(root, 'assets', 'clan-crest-motifs.json'), 'utf8')).motifs.map((row) => [row.clan, row]))

await mkdir(outDir, { recursive: true })
for (const name of await readdir(outDir)) if (name.endsWith('.svg')) await rm(join(outDir, name))
const index = []
for (const clan of clans) {
  const choice = assigned.get(clan.id)
  const motif = motifs.get(clan.id)
  await writeFile(join(outDir, `${clan.id}.svg`), renderCrest(choice, motif))
  index.push({ id: clan.id, surname: clan.surname, bongwan: clan.bongwan, source: motif ? 'researched' : 'generated', ...(motif ? { reference: motif.reference, motif: motif.motif } : choice) })
}
await writeFile(join(outDir, 'index.json'), JSON.stringify({ schema: 2, count: index.length, crests: index }, null, 2) + '\n')
console.log(`clan-crests: ${index.length}`)
