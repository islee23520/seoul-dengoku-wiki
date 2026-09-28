import { createHash } from 'node:crypto'

import { ATLAS_SCHEMA } from './world-atlas-schema.mjs'

export function sha256Text(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export function parseWorldAtlas(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    return { ok: false, error: `E_ATLAS_JSON: ${error.message}` }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'E_ATLAS_ENVELOPE' }
  if (value.id !== 'WNA-001') return { ok: false, error: `E_ATLAS_ID: ${value.id ?? '<missing>'}` }
  const atlas = value.data?.atlas
  if (!atlas || typeof atlas !== 'object' || Array.isArray(atlas)) return { ok: false, error: 'E_ATLAS_DATA' }
  if (atlas.schema !== ATLAS_SCHEMA) return { ok: false, error: `E_ATLAS_SCHEMA: ${atlas.schema ?? '<missing>'}` }
  return { ok: true, value }
}

// Transitional export name retained for callers in the same indivisible PR 4 cutover.
export const extractAtlasJson = parseWorldAtlas
