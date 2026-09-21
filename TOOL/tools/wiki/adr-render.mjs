#!/usr/bin/env node
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emitGenerated } from '../canon/emit.mjs'
import { renderDocument, renderTableRows } from '../canon/render.mjs'
import { AdrCanonError, loadAdrCanon } from './adr-canon.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaults = Object.freeze({
  canonRoot: resolve(repoRoot, 'GDD/canon'),
  outputPath: resolve(repoRoot, 'GDD/adr/ADR-003-real-place-and-station-naming.md'),
})

export function renderAdrMarkdown(canon) {
  return renderDocument(canon, (block) => renderTableRows(block.header, block.rows))
}

export async function materializeAdr({ canonRoot, outputPath, check }) {
  const rendered = renderAdrMarkdown(await loadAdrCanon(canonRoot))
  return emitGenerated({ outputPath, rendered, check })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  try {
    const { changed } = await materializeAdr({ ...defaults, check })
    console.log(check ? 'adr-003: OK (no drift)' : changed ? 'adr-003: written' : 'adr-003: unchanged')
  } catch (error) {
    if (!(error instanceof AdrCanonError)) throw error
    console.error(error.message)
    process.exitCode = 1
  }
}
