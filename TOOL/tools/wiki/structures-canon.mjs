import { stat } from 'node:fs/promises'
import { join, posix } from 'node:path'

import { CanonError } from '../canon/errors.mjs'
import { fail, loadSchema, readCanonJson, uniqueBy, validateDocumentBlocks } from '../canon/integrity.mjs'

export const STRUCTURES_FILES = Object.freeze({
  documents: 'tables/documents.json',
  kinds: 'tables/structure-kinds.json',
  details: 'relations/structure-kind-details.json',
  locale: 'locales/ko-KR/structures.json',
})

const SCHEMA_FILE = 'schema/structures.schema.json'
export const KIND_TEXT_FIELDS = Object.freeze(['name', 'start', 'role'])
export const STRUCTURE_KIND_HEADER_WIDTH = 4

export const StructuresCanonError = CanonError

async function validateDocuments(rows, loreRoot) {
  uniqueBy(rows, (row) => row.id, 'E_DUPLICATE_ID', 'documents')
  uniqueBy(rows, (row) => row.path, 'E_DUPLICATE_ID', 'document paths')
  uniqueBy(rows, (row) => posix.basename(row.path), 'E_DUPLICATE_ID', 'document stems')
  for (const row of rows) {
    const found = await stat(join(loreRoot, row.path)).catch((error) => {
      if (error.code === 'ENOENT') return null
      throw error
    })
    if (!found?.isFile()) fail('E_FK_DOC_PATH', row.path)
  }
}

function validateDetails(details, kindIds, docIds, textIds) {
  uniqueBy(details, (row) => row.kindId, 'E_DUPLICATE_COMPOSITE', 'structure-kind-details')
  for (const row of details) {
    if (!kindIds.has(row.kindId)) fail('E_FK_KIND', row.kindId)
    if (!docIds.has(row.docId)) fail('E_FK_DOC', row.docId)
    if (!textIds.has(row.textKey)) fail('E_FK_TEXT', row.textKey)
  }
  if (details.length !== kindIds.size) fail('E_MISSING_COMPOSITE', `${details.length} of ${kindIds.size}`)
  for (const kindId of kindIds) {
    for (const field of KIND_TEXT_FIELDS) if (!textIds.has(`${kindId}.${field}`)) fail('E_FK_TEXT', `${kindId}.${field}`)
  }
}

function validateBlocks(locale, docIds) {
  validateDocumentBlocks(locale)
  if (!docIds.has(locale.document.id)) fail('E_FK_DOC', locale.document.id)
  for (const block of locale.blocks) {
    if (block.kind === 'table' && (block.source !== 'structure-kinds' || block.header.length !== STRUCTURE_KIND_HEADER_WIDTH)) {
      fail('E_TABLE_SHAPE', block.id)
    }
    for (const inline of block.inlines ?? []) {
      if (inline.kind === 'docLink' && !docIds.has(inline.targetDocumentId)) fail('E_FK_DOC', inline.targetDocumentId)
    }
  }
}

export async function loadStructuresCanon(canonRoot, loreRoot) {
  const schema = await loadSchema(canonRoot, SCHEMA_FILE)
  const [documents, kindsFile, detailsFile, locale] = await Promise.all(
    Object.values(STRUCTURES_FILES).map((file) => readCanonJson(canonRoot, schema, file)),
  )
  await validateDocuments(documents.rows, loreRoot)
  const kinds = [...kindsFile.rows].sort((a, b) => a.order - b.order)
  const kindIds = uniqueBy(kinds, (row) => row.id, 'E_DUPLICATE_ID', 'structure-kinds')
  const textIds = uniqueBy(locale.texts, (row) => row.id, 'E_DUPLICATE_ID', 'texts')
  const docIds = new Set(documents.rows.map((row) => row.id))
  validateDetails(detailsFile.rows, kindIds, docIds, textIds)
  validateBlocks(locale, docIds)
  return { documents: documents.rows, kinds, details: detailsFile.rows, texts: locale.texts, document: locale.document, blocks: locale.blocks }
}
