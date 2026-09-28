import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assignCrests, INKS, renderCrest } from './clan-crest.mjs'
import { normalizeRealEmblem, renderRealCrest } from './clan-crest-real.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'clan-crests')
const tables = JSON.parse(await readFile(join(root, 'lore/name-pools/clan-hangnyeol-tables.json'), 'utf8'))
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
const realDir = join(root, 'assets', 'clan-crests-real')
const real = new Map(JSON.parse(await readFile(join(realDir, 'manifest.json'), 'utf8')).emblems.map((row) => [row.clan, row]))

await mkdir(outDir, { recursive: true })
for (const name of await readdir(outDir)) if (name.endsWith('.svg')) await rm(join(outDir, name))
const index = []
for (const clan of clans) {
  const choice = assigned.get(clan.id)
  const seal = real.get(clan.id)
  if (seal) {
    const emblem = normalizeRealEmblem(await readFile(join(realDir, `${clan.id}.svg`), 'utf8'))
    await writeFile(join(outDir, `${clan.id}.svg`), renderRealCrest(emblem, INKS[choice.ink]))
    index.push({ id: clan.id, surname: clan.surname, bongwan: clan.bongwan, source: 'commons', commonsTitle: seal.commonsTitle, license: seal.license, ink: choice.ink })
  } else {
    await writeFile(join(outDir, `${clan.id}.svg`), renderCrest(choice))
    index.push({ id: clan.id, surname: clan.surname, bongwan: clan.bongwan, source: 'generated', ...choice })
  }
}
await writeFile(join(outDir, 'index.json'), JSON.stringify({ schema: 2, count: index.length, crests: index }, null, 2) + '\n')
console.log(`clan-crests: ${index.length}`)
