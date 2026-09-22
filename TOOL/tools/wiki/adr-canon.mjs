import { CanonError } from '../canon/errors.mjs'
import { fail, loadSchema, readCanonJson, uniqueBy, validateDocumentBlocks } from '../canon/integrity.mjs'

export const ADR_FILES = Object.freeze({
  locale: 'locales/ko-KR/adr-003.json',
})

// Ordered manifest of every ADR JSON canon source. Document order here is the deterministic
// rendering/iteration order for loadAdrCanonCollection/materializeAdrCollection.
export const ADR_COLLECTION = Object.freeze([
  Object.freeze({ id: 'ADR-001', locale: 'locales/ko-KR/adr-001.json', outputName: 'ADR-001-repository-delivery-policy.md' }),
  Object.freeze({ id: 'ADR-002', locale: 'locales/ko-KR/adr-002.json', outputName: 'ADR-002-character-candidate-retrospective.md' }),
  Object.freeze({ id: 'ADR-003', locale: ADR_FILES.locale, outputName: 'ADR-003-real-place-and-station-naming.md' }),
  Object.freeze({ id: 'ADR-004', locale: 'locales/ko-KR/adr-004.json', outputName: 'ADR-004-root-domain-structure.md' }),
  Object.freeze({ id: 'ADR-005', locale: 'locales/ko-KR/adr-005.json', outputName: 'ADR-005-backend-host-session-multiplayer.md' }),
  Object.freeze({ id: 'ADR-006', locale: 'locales/ko-KR/adr-006.json', outputName: 'ADR-006-backend-aspnet-core-coordinator.md' }),
])

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

async function loadAdrDocument(canonRoot, schema, localePath) {
  const locale = await readCanonJson(canonRoot, schema, localePath)
  validateBlocks(locale)
  return { document: locale.document, blocks: locale.blocks }
}

export async function loadAdrCanon(canonRoot) {
  const schema = await loadSchema(canonRoot, SCHEMA_FILE)
  return loadAdrDocument(canonRoot, schema, ADR_FILES.locale)
}

export async function loadAdrCanonCollection(canonRoot, collection = ADR_COLLECTION) {
  uniqueBy(collection, (entry) => entry.id, 'E_DUPLICATE_COLLECTION_ID', 'adr collection')
  uniqueBy(collection, (entry) => entry.locale, 'E_DUPLICATE_COLLECTION_PATH', 'adr collection')
  const schema = await loadSchema(canonRoot, SCHEMA_FILE)
  const entries = await Promise.all(collection.map(async (entry) => [entry.id, await loadAdrDocument(canonRoot, schema, entry.locale)]))
  return new Map(entries)
}
