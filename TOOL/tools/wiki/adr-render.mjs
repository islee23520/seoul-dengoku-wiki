#!/usr/bin/env node
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emitGenerated } from '../canon/emit.mjs'
import { renderDocument, renderTableRows } from '../canon/render.mjs'
import { ADR_COLLECTION, AdrCanonError, loadAdrCanon, loadAdrCanonCollection } from './adr-canon.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaults = Object.freeze({
  canonRoot: resolve(repoRoot, 'GDD/canon'),
  outputPath: resolve(repoRoot, 'GDD/adr/ADR-003-real-place-and-station-naming.md'),
  adrDir: resolve(repoRoot, 'GDD/adr'),
})

export function renderAdrMarkdown(canon) {
  return renderDocument(canon, (block) => renderTableRows(block.header, block.rows))
}

export async function materializeAdr({ canonRoot, outputPath, check }) {
  const rendered = renderAdrMarkdown(await loadAdrCanon(canonRoot))
  return emitGenerated({ outputPath, rendered, check })
}

// Renders and (optionally) writes every ADR in the collection, keyed by collection entry id.
// Each document is emitted (and drift-checked) independently, so one hand-edited output fails
// with E_DRIFT without affecting the others.
export async function materializeAdrCollection({ canonRoot, adrDir = defaults.adrDir, check, collection = ADR_COLLECTION }) {
  const canons = await loadAdrCanonCollection(canonRoot, collection)
  const results = new Map()
  for (const entry of collection) {
    const rendered = renderAdrMarkdown(canons.get(entry.id))
    results.set(entry.id, await emitGenerated({ outputPath: resolve(adrDir, entry.outputName), rendered, check }))
  }
  return results
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  try {
    const results = await materializeAdrCollection({ canonRoot: defaults.canonRoot, check })
    for (const [id, { changed }] of results) {
      const label = id.toLowerCase()
      console.log(check ? `${label}: OK (no drift)` : changed ? `${label}: written` : `${label}: unchanged`)
    }
  } catch (error) {
    if (!(error instanceof AdrCanonError)) throw error
    console.error(error.message)
    process.exitCode = 1
  }
}
