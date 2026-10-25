import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { externalToponymHits } from './current-person-geography.mjs'

const root = resolve(import.meta.dirname, '..')
const narrowed = JSON.parse(await readFile(resolve(root, '.omo/evidence/seoul-lock/task-4-narrowed.json')))
const vocabulary = narrowed.vocabulary.external.filter(term => typeof term === 'string')
const internal = narrowed.vocabulary.internal.filter(term => typeof term === 'string').sort((a, b) => b.length - a.length)
const hits = [], legacyHits = []
const currentFields = ['territory', 'confirmedHoldings', 'subordinateHoldings', 'superiorJurisdictions', 'openingTitles', 'sovereignTitle', 'retinueGroups', 'openingDisposition', 'unit', 'wandering_force']
const inspect = (value, pointer, person, output) => {
  if (typeof value === 'string') {
    let text = value
    for (const term of internal) text = text.split(term).join(' '.repeat(term.length))
    for (const term of vocabulary) {
      if (!term || !text.includes(term)) continue
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = /[A-Za-z]/.test(term) ? new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, 'u') : new RegExp(escaped, 'u')
      if (pattern.test(text)) output.push({ person, pointer, term, value })
    }
  } else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) inspect(child, `${pointer}/${key}`, person, output)
}
const beforePath = resolve(root, '.vitest/task3-before-final-detail-hashes.json')
const before = JSON.parse(await readFile(beforePath))
let files = 0, changed = 0, territory = 0
for (const name of (await readdir(resolve(root, 'public/person-details'))).filter(name => name.endsWith('.json'))) {
  const bytes = await readFile(resolve(root, 'public/person-details', name))
  const detail = JSON.parse(bytes)
  files++
  if (createHash('sha256').update(bytes).digest('hex') !== before[name]) changed++
  if (Object.hasOwn(detail, 'territory')) territory++
  hits.push(...externalToponymHits(detail, narrowed.vocabulary))
  if (detail.characterId === 'K998') {
    inspect(detail.characterProfile?.skills, '/characterProfile/skills', detail.characterId, hits)
    inspect(detail.personSheet, '/personSheet', detail.characterId, legacyHits)
  }
}
console.log(JSON.stringify({ files, changed, currentTerritoryFields: territory, currentRightHits: hits.length, hits,
  k998LegacyCheonanAsan: legacyHits.filter(row => /천안|아산/.test(row.term)) }, null, 2))
process.exitCode = hits.length || territory ? 1 : 0
