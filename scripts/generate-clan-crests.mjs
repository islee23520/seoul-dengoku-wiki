import { mkdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assignCrests, renderCrest } from './clan-crest.mjs'
import { generatorStage } from './generate-release.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readClanCatalogDocument, readClanCatalogDocumentAsync } from './cast-sqlite/clan-catalog-document.mjs'
import { createReader, hasPgConnection } from './cast-sqlite/db-pg.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { root: outputRoot, writeFile } = await generatorStage(root)
const outDir = join(outputRoot, 'public', 'clan-crests')
// PostgreSQL release sourcing: one read-only snapshot for the whole worker.
// WIKI_GENERATION_SNAPSHOT (exported by the release orchestrator, if any)
// pins every worker to one consistent read view; without it the worker still
// reads PostgreSQL, just without a shared snapshot. SQLite remains the source
// when neither WIKI_DOCUMENT_PG nor WIKI_DOCUMENT_PG_FILE is configured.
const { tables, motifs } = await (async () => {
  if (hasPgConnection()) {
    const reader = createReader({ role: 'wiki_reader' })
    const importSnapshot = process.env.WIKI_GENERATION_SNAPSHOT
    try {
      return await reader.transaction(async (tx) => ({
        tables: await readClanCatalogDocumentAsync(tx),
        motifs: new Map((await tx.all('SELECT clan,surname,bongwan,motif,reference FROM wiki.clan_crest_motif ORDER BY ordinal'))
          .map(row => [row.clan, row])),
      }), { readOnly: true, ...(importSnapshot ? { importSnapshot } : {}) })
    } finally { await reader.close() }
  }
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? join(root, 'data/canonical/wiki-cast.sqlite'))
  try {
    return {
      tables: readClanCatalogDocument(db),
      motifs: new Map(db.prepare('SELECT clan,surname,bongwan,motif,reference FROM clan_crest_motif ORDER BY ordinal')
        .all().map(row => [row.clan, row]))
    }
  } finally { db.close() }
})()
const clans = tables.clans.filter((clan) => !clan.id.includes('-agreed-'))
const assigned = assignCrests(clans.map((clan) => clan.id))
// Hand-selected crest assets; their digest is recorded, not pinned.
const selected = new Set(['c774-c804-c758-674e', 'goryeong-shin'])

await mkdir(outDir, { recursive: true })
const index = []
for (const clan of clans) {
  const choice = assigned.get(clan.id)
  const motif = motifs.get(clan.id)
  const svg = selected.has(clan.id) ? await readFile(join(root, 'assets', 'clan-crests', `${clan.id}.svg`)) : renderCrest(choice, motif)
  const selectedHash = selected.has(clan.id) ? createHash('sha256').update(svg).digest('hex') : undefined
  await writeFile(join(outDir, `${clan.id}.svg`), svg)
  index.push({ id: clan.id, surname: clan.surname, bongwan: clan.bongwan, source: selectedHash ? 'selected' : motif ? 'researched' : 'generated', ...(selectedHash ? { sha256: selectedHash } : motif ? { reference: motif.reference, motif: motif.motif } : choice) })
}
await writeFile(join(outDir, 'index.json'), JSON.stringify({ schema: 2, count: index.length, crests: index }, null, 2) + '\n')
console.log(`clan-crests: ${index.length}`)
