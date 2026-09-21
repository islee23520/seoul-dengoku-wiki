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

// The schema file is the single owner of structural rules: each canon file is checked against the oneOf branch titled with its path.
export async function readCanonJson(canonRoot, schema, relPath) {
  const data = parseCanonJson(await readCanonText(canonRoot, relPath), relPath)
  if (data?.schemaVersion !== SCHEMA_VERSION) fail('E_SCHEMA_VERSION', `${relPath}: ${data?.schemaVersion}`)
  const branch = schema.oneOf.find((candidate) => candidate.title === relPath)
  if (!branch) fail('E_SCHEMA_SHAPE', `${relPath}: no schema branch`)
  const violation = checkSchema(schema, branch, data)
  if (violation) fail('E_SCHEMA_SHAPE', `${relPath}: ${violation}`)
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
}
