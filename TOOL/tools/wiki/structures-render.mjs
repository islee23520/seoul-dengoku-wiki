#!/usr/bin/env node
import { dirname, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emitGenerated } from '../canon/emit.mjs'
import { renderDocument, renderTableRows } from '../canon/render.mjs'
import { StructuresCanonError, loadStructuresCanon } from './structures-canon.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaults = Object.freeze({
  canonRoot: resolve(repoRoot, 'LORE/canon'),
  loreRoot: resolve(repoRoot, 'LORE'),
  outputPath: resolve(repoRoot, 'LORE/structures/Structures.md'),
})

export function renderStructuresMarkdown(canon) {
  const paths = new Map(canon.documents.map((doc) => [doc.id, doc.path]))
  const selfDir = posix.dirname(paths.get(canon.document.id))
  const texts = new Map(canon.texts.map((entry) => [entry.id, entry.text]))
  const hrefOf = (docId) => posix.relative(selfDir, paths.get(docId))
  const renderTable = (block) => renderTableRows(block.header, canon.kinds.map((kind) => {
    const detail = canon.details.find((row) => row.kindId === kind.id)
    return [
      texts.get(`${kind.id}.name`),
      texts.get(`${kind.id}.start`),
      texts.get(`${kind.id}.role`),
      `[${texts.get(detail.textKey)}](${hrefOf(detail.docId)})`,
    ]
  }))
  return renderDocument(canon, renderTable, hrefOf)
}

export async function materializeStructures({ canonRoot, loreRoot, outputPath, check }) {
  const rendered = renderStructuresMarkdown(await loadStructuresCanon(canonRoot, loreRoot))
  return emitGenerated({ outputPath, rendered, check })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  try {
    const { changed } = await materializeStructures({ ...defaults, check })
    console.log(check ? 'structures: OK (no drift)' : changed ? 'structures: written' : 'structures: unchanged')
  } catch (error) {
    if (!(error instanceof StructuresCanonError)) throw error
    console.error(error.message)
    process.exitCode = 1
  }
}
