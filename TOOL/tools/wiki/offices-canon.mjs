import { CanonError } from '../canon/errors.mjs'
import { fail, loadSchema, readCanonJson, uniqueBy, validateDocumentBlocks } from '../canon/integrity.mjs'

export const OFFICES_FILES = Object.freeze({
  tiers: 'tables/office-tiers.json',
  titles: 'relations/state-office-titles.json',
  locale: 'locales/ko-KR/offices-and-ranks.json',
})

const SCHEMA_FILE = 'schema/offices.schema.json'

export const OfficesCanonError = CanonError

function validateTitles(titles, tierIds, stateIds, textIds) {
  uniqueBy(titles, (row) => `${row.stateId}:${row.tierId}`, 'E_DUPLICATE_COMPOSITE', 'state-office-titles')
  for (const row of titles) {
    if (!stateIds.has(row.stateId)) fail('E_FK_STATE', row.stateId)
    if (!tierIds.has(row.tierId)) fail('E_FK_TIER', row.tierId)
    if (!textIds.has(row.titleKey)) fail('E_FK_TEXT', String(row.titleKey))
  }
  if (titles.length !== stateIds.size * tierIds.size) {
    fail('E_MISSING_COMPOSITE', `${titles.length} of ${stateIds.size * tierIds.size}`)
  }
}

function validateTable(block, tierCount) {
  if (block.source === undefined) {
    if (!Array.isArray(block.rows)) fail('E_TABLE_SHAPE', `${block.id}: rows`)
    for (const row of block.rows) {
      if (row.length !== block.header.length) fail('E_TABLE_SHAPE', `${block.id}: row width`)
    }
  } else if (block.rows !== undefined || block.header.length !== tierCount + 1) {
    fail('E_TABLE_SHAPE', `${block.id}: source`)
  }
}

function validateDocument(locale, tierCount) {
  validateDocumentBlocks(locale)
  for (const block of locale.blocks) {
    if (block.kind === 'table') validateTable(block, tierCount)
  }
}

export async function loadOfficesCanon(canonRoot, registry) {
  const schema = await loadSchema(canonRoot, SCHEMA_FILE)
  const [tiersFile, titlesFile, locale] = await Promise.all([
    readCanonJson(canonRoot, schema, OFFICES_FILES.tiers),
    readCanonJson(canonRoot, schema, OFFICES_FILES.titles),
    readCanonJson(canonRoot, schema, OFFICES_FILES.locale),
  ])
  const tiers = [...tiersFile.rows].sort((a, b) => a.order - b.order)
  const tierIds = uniqueBy(tiers, (row) => row.id, 'E_DUPLICATE_ID', 'office-tiers')
  const textIds = uniqueBy(locale.texts, (row) => row.id, 'E_DUPLICATE_ID', 'texts')
  const stateIds = new Set(registry.keys())
  for (const row of titlesFile.rows) if (!stateIds.has(row.stateId)) fail('E_FK_STATE', row.stateId)
  for (const stateId of stateIds) {
    if (!titlesFile.rows.some((row) => row.stateId === stateId)) fail('E_FK_STATE', `registry ${stateId} has no canon rows`)
  }
  validateTitles(titlesFile.rows, tierIds, stateIds, textIds)
  validateDocument(locale, tiers.length)
  return { tiers, titles: titlesFile.rows, texts: locale.texts, document: locale.document, blocks: locale.blocks }
}
