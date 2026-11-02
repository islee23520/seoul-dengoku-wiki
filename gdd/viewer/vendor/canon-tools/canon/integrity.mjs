import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { CanonError } from './errors.mjs'
import { parseCanonJson } from './json-io.mjs'
import { checkSchema } from './schema-subset.mjs'

const SCHEMA_VERSION = 1

export const fail = (code, detail) => {
  throw new CanonError(code, detail)
}

export async function readCanonText(canonRoot, relPath) {
  try {
    return await readFile(join(canonRoot, relPath), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') fail('E_FILE_MISSING', relPath)
    throw error
  }
}

export async function loadSchema(canonRoot, schemaFile) {
  return parseCanonJson(await readCanonText(canonRoot, schemaFile), schemaFile)
}

// ADR schemas have path-titled branches; generic GDD schemas have collection/document definitions.
export async function readCanonJson(canonRoot, schema, relPath) {
  const data = parseCanonJson(await readCanonText(canonRoot, relPath), relPath)
  if (data?.schemaVersion !== SCHEMA_VERSION) fail('E_SCHEMA_VERSION', `${relPath}: ${data?.schemaVersion}`)
  const generic = schema.$defs?.collection && schema.$defs?.document
  const collection = /^collections\/([a-z-]+)\.json$/.exec(relPath)
  const document = /^locales\/ko-KR\/([a-z-]+)\/[A-Za-z0-9-]+\.json$/.exec(relPath)
  const artContent = relPath === 'locales/ko-KR/root/asset-pipeline.json' || relPath === 'locales/ko-KR/art/character-art-direction.json'
  const branch = generic
    ? collection ? schema.$defs.collection : document ? (artContent && data.content ? schema.$defs.artContentDocument : schema.$defs.document) : null
    : schema.oneOf?.find((candidate) => candidate.title === relPath)
  if (!branch) fail('E_SCHEMA_SHAPE', `${relPath}: no schema branch`)
  const violation = checkSchema(schema, branch, data)
  if (violation) fail('E_SCHEMA_SHAPE', `${relPath}: ${violation}`)
  if (generic) {
    const domain = collection?.[1] ?? document[1]
    if (!schema.$defs.collection.properties.domain.enum.includes(domain)) fail('E_SCHEMA_SHAPE', `${relPath}: disallowed domain`)
    const sourceInDomain = (source) => domain === 'root' ? !source.path.includes('/') : source.path.startsWith(`${domain}/`)
    if (collection) {
      if (data.domain !== domain || data.documents.some((entry) => !entry.path.startsWith(`locales/ko-KR/${domain}/`) || !sourceInDomain(entry.source))) fail('E_SCHEMA_SHAPE', `${relPath}: collection domain/path mismatch`)
      uniqueBy(data.documents, (entry) => entry.id, 'E_DUPLICATE_ID', 'documents')
      uniqueBy(data.documents, (entry) => entry.path, 'E_DUPLICATE_ID', 'document paths')
      for (const entry of data.documents) {
        const linked = await readCanonJson(canonRoot, schema, entry.path)
        if ((linked.document?.id ?? linked.id) !== entry.id || linked.locale !== entry.locale || linked.status !== entry.status || ['path', 'lineStart', 'lineEnd', 'sha256'].some((key) => linked.source[key] !== entry.source[key])) fail('E_SCHEMA_SHAPE', `${relPath}: ${entry.path} identity/source mismatch`)
      }
    } else {
      if (!sourceInDomain(data.source)) fail('E_SCHEMA_SHAPE', `${relPath}: document source/domain mismatch`)
      if (artContent && data.content) {
        const expectedId = relPath.endsWith('/asset-pipeline.json') ? 'doc.Asset-Pipeline' : 'doc.Character-Art-Direction'
        if (data.id !== expectedId || data.domain !== domain || data.slug !== data.source.path.split('/').at(-1).replace(/\.md$/, '') || new Set(data.content.map((node) => node.anchor)).size !== data.content.length) fail('E_SCHEMA_SHAPE', `${relPath}: content identity or anchor mismatch`)
      } else validateDocumentBlocks(data)
    }
  }
  return data
}

export function uniqueBy(rows, keyOf, code, label) {
  const seen = new Set()
  for (const row of rows) {
    const key = keyOf(row)
    if (typeof key !== 'string' || key === '') fail('E_SCHEMA_FIELD', `${label}: empty key`)
    if (seen.has(key)) fail(code, `${label}: ${key}`)
    seen.add(key)
  }
  return seen
}

export function validateDocumentBlocks({ document, blocks }) {
  uniqueBy(blocks, (block) => block.id, 'E_DUPLICATE_ID', 'blocks')
  const ids = document.blockIds
  if (new Set(ids).size !== ids.length) fail('E_DOCUMENT_BLOCKS', 'duplicate blockIds')
  const owned = new Set(blocks.map((block) => block.id))
  if (ids.length !== owned.size || ids.some((id) => !owned.has(id))) fail('E_DOCUMENT_BLOCKS', 'blockIds and blocks differ')
  if (document.terminalLineFeeds === 1) fail('E_CANONICAL_FORM', 'omit terminalLineFeeds 1')
  for (const [index, block] of blocks.entries()) {
    if (index === 0 && block.blankLinesBefore !== undefined) fail('E_CANONICAL_FORM', `${block.id}: first block has no preceding gap`)
    if (block.kind === 'paragraph' && block.lines?.length === 1) fail('E_CANONICAL_FORM', `${block.id}: use inlines for one line`)
    if (block.kind === 'table' && block.rawRows) {
      const padded = (cells) => cells.every((cell) => cell.length > 2 && cell.startsWith(' ') && cell.endsWith(' '))
      if (block.rawHeader && padded(block.rawHeader)) fail('E_CANONICAL_FORM', `${block.id}: use padded header`)
      if (!block.rawHeader && block.rawRows.every(padded)) fail('E_CANONICAL_FORM', `${block.id}: use padded rows`)
    }
    if (block.kind === 'table' && ((block.dividers && block.dividers.length !== block.header.length) || (block.rawHeader && block.rawHeader.length !== block.header.length) || (block.rows ?? block.rawRows ?? []).some((row) => row.length !== block.header.length))) {
      fail('E_TABLE_SHAPE', `${block.id}: header, dividers and rows must have equal width`)
    }
  }
}
