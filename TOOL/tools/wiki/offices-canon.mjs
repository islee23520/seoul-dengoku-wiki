import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { CanonError } from '../canon/errors.mjs'
import { parseCanonJson } from '../canon/json-io.mjs'
import { checkSchema } from '../canon/schema-subset.mjs'

export const OFFICES_FILES = Object.freeze({
  tiers: 'tables/office-tiers.json',
  titles: 'relations/state-office-titles.json',
  locale: 'locales/ko-KR/offices-and-ranks.json',
})

const SCHEMA_VERSION = 1
const SCHEMA_FILE = 'schema/offices.schema.json'

export const OfficesCanonError = CanonError
const fail = (code, detail) => {
  throw new CanonError(code, detail)
}

async function readText(canonRoot, relPath) {
  try {
    return await readFile(join(canonRoot, relPath), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') fail('E_FILE_MISSING', relPath)
    throw error
  }
}

// The schema file is the single owner of structural rules: each canon file is checked against the oneOf branch titled with its path.
async function readJson(canonRoot, schema, relPath) {
  const data = parseCanonJson(await readText(canonRoot, relPath), relPath)
  if (data?.schemaVersion !== SCHEMA_VERSION) fail('E_SCHEMA_VERSION', `${relPath}: ${data?.schemaVersion}`)
  const branch = schema.oneOf.find((candidate) => candidate.title === relPath)
  if (!branch) fail('E_SCHEMA_SHAPE', `${relPath}: no schema branch`)
  const violation = checkSchema(schema, branch, data)
  if (violation) fail('E_SCHEMA_SHAPE', `${relPath}: ${violation}`)
  return data
}

function uniqueBy(rows, keyOf, code, label) {
  const seen = new Set()
  for (const row of rows) {
    const key = keyOf(row)
    if (typeof key !== 'string' || key === '') fail('E_SCHEMA_FIELD', `${label}: empty key`)
    if (seen.has(key)) fail(code, `${label}: ${key}`)
    seen.add(key)
  }
  return seen
}

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
  const { document, blocks } = locale
  uniqueBy(blocks, (block) => block.id, 'E_DUPLICATE_ID', 'blocks')
  const ids = document.blockIds
  if (new Set(ids).size !== ids.length) fail('E_DOCUMENT_BLOCKS', 'duplicate blockIds')
  const owned = new Set(blocks.map((block) => block.id))
  if (ids.length !== owned.size || ids.some((id) => !owned.has(id))) fail('E_DOCUMENT_BLOCKS', 'blockIds and blocks differ')
  for (const block of blocks) {
    if (block.kind === 'table') validateTable(block, tierCount)
  }
}

export async function loadOfficesCanon(canonRoot, registry) {
  const schema = parseCanonJson(await readText(canonRoot, SCHEMA_FILE), SCHEMA_FILE)
  const [tiersFile, titlesFile, locale] = await Promise.all([
    readJson(canonRoot, schema, OFFICES_FILES.tiers),
    readJson(canonRoot, schema, OFFICES_FILES.titles),
    readJson(canonRoot, schema, OFFICES_FILES.locale),
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
