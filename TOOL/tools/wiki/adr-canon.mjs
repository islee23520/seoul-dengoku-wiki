import { CanonError } from '../canon/errors.mjs'
import { fail, loadSchema, readCanonJson, validateDocumentBlocks } from '../canon/integrity.mjs'

export const ADR_FILES = Object.freeze({
  locale: 'locales/ko-KR/adr-003.json',
})

const SCHEMA_FILE = 'schema/adr.schema.json'

export const AdrCanonError = CanonError

function validateBlocks(locale) {
  validateDocumentBlocks(locale)
  for (const block of locale.blocks) {
    if (block.kind === 'table') {
      for (const row of block.rows) if (row.length !== block.header.length) fail('E_TABLE_SHAPE', `${block.id}: row width`)
    }
  }
}

export async function loadAdrCanon(canonRoot) {
  const schema = await loadSchema(canonRoot, SCHEMA_FILE)
  const locale = await readCanonJson(canonRoot, schema, ADR_FILES.locale)
  validateBlocks(locale)
  return { document: locale.document, blocks: locale.blocks }
}
