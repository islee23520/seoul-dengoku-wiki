import { mkdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assignCrests, renderCrest } from './clan-crest.mjs'
import { generatorStage, requireGenerationPublication } from './generate-release.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readClanCatalogDocument, CLAN_CATALOG_SOURCE_HASH } from './cast-sqlite/clan-catalog-document.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
await requireGenerationPublication(root)
const { root: outputRoot, writeFile } = await generatorStage(root)
const outDir = join(outputRoot, 'public', 'clan-crests')
const { tables, motifs } = (() => {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? join(root, 'data/canonical/wiki-cast.sqlite'))
  try {
    return { tables: readClanCatalogDocument(db, { expectedSourceHash: CLAN_CATALOG_SOURCE_HASH }),
      motifs: new Map(db.prepare('SELECT clan,surname,bongwan,motif,reference FROM clan_crest_motif ORDER BY ordinal')
        .all().map(row => [row.clan, row])) }
  } finally { db.close() }
})()
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
const selected = new Map([
  ['c774-c804-c758-674e', '748efdbd7bc111c230ae57d32285630312b35df2258abf6952d8cad36db3b01a'],
  ['goryeong-shin', 'faccdb8a017eef79666f85bf2f4af6232b8d459f4115fe974ac0568c958441e8'],
])

await mkdir(outDir, { recursive: true })
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
