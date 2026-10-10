#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CanonError } from '../canon/errors.mjs'
import { emitGenerated } from '../canon/emit.mjs'
import { assertOutputOutsideGdd, readRenderedLock } from '../canon/materialize-gdd.mjs'
import { renderDocument, renderTableRows } from '../canon/render.mjs'
import { ADR_COLLECTION, AdrCanonError, loadAdrCanon, loadAdrCanonCollection } from './adr-canon.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaults = Object.freeze({
  canonRoot: resolve(process.env.GDD_ROOT ?? resolve(repoRoot, 'GDD'), 'canon'),
})

export function renderAdrMarkdown(canon) {
  const blocks = canon.blocks.map((block) => block.spacedItems
    ? { ...block, kind: 'paragraph', inlines: [{ kind: 'text', text: block.items.map((item, index) => `${index + 1}. ${item.map((inline) => inline.text).join('')}`).join('\n\n') }] }
    : block)
  return renderDocument({ ...canon, blocks }, (block) => renderTableRows(block.header, block.rows))
}

function checkAdrLock(lock, entry, rendered) {
  const path = `adr/${entry.outputName}`
  const hash = createHash('sha256').update(rendered).digest('hex')
  if (lock.find((row) => row.path === path)?.sha256 !== hash) throw new CanonError('E_RENDERED_LOCK_MISMATCH', path)
}

export async function materializeAdr({ canonRoot, outputPath, check }) {
  if (!outputPath) throw new CanonError('E_OUTPUT_DIR_REQUIRED', 'outputPath required')
  await assertOutputOutsideGdd(resolve(canonRoot, '..'), outputPath)
  const rendered = renderAdrMarkdown(await loadAdrCanon(canonRoot))
  return emitGenerated({ outputPath, rendered, check })
}

// Renders and (optionally) writes every ADR in the collection, keyed by collection entry id.
// Each document is emitted (and drift-checked) independently, so one hand-edited output fails
// with E_DRIFT without affecting the others.
export async function materializeAdrCollection({ canonRoot, adrDir, check, collection = ADR_COLLECTION }) {
  if (!adrDir) throw new CanonError('E_OUTPUT_DIR_REQUIRED', 'provide adrDir outside GDD')
  await assertOutputOutsideGdd(resolve(canonRoot, '..'), adrDir)
  const canons = await loadAdrCanonCollection(canonRoot, collection)
  const lock = await readRenderedLock(canonRoot)
  const results = new Map()
  for (const entry of collection) {
    const rendered = renderAdrMarkdown(canons.get(entry.id))
    checkAdrLock(lock, entry, rendered)
    results.set(entry.id, await emitGenerated({ outputPath: resolve(adrDir, entry.outputName), rendered, check }))
  }
  return results
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const outIndex = args.indexOf('--out')
  try {
    if (outIndex < 0) {
      if (!check || args.length !== 1) throw new CanonError('E_OUTPUT_DIR_REQUIRED', 'use --check or --out <external directory>')
      const canons = await loadAdrCanonCollection(defaults.canonRoot)
      const lock = await readRenderedLock(defaults.canonRoot)
      for (const entry of ADR_COLLECTION) {
        checkAdrLock(lock, entry, renderAdrMarkdown(canons.get(entry.id)))
        console.log(`${entry.id.toLowerCase()}: OK (rendered lock)`)
      }
    } else {
      if (!args[outIndex + 1] || args.length !== (check ? 3 : 2)) throw new CanonError('E_OUTPUT_DIR_REQUIRED', 'use --out <external directory>')
      const results = await materializeAdrCollection({ canonRoot: defaults.canonRoot, adrDir: resolve(args[outIndex + 1]), check })
      for (const [id, { changed }] of results) console.log(check ? `${id.toLowerCase()}: OK (no drift)` : changed ? `${id.toLowerCase()}: written` : `${id.toLowerCase()}: unchanged`)
    }
  } catch (error) {
    if (!(error instanceof AdrCanonError)) throw error
    console.error(error.message)
    process.exitCode = 1
  }
}
