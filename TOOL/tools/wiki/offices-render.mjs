#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { emitGenerated } from '../canon/emit.mjs'
import { renderDocument, renderTableRows } from '../canon/render.mjs'
import { OfficesCanonError, loadOfficesCanon } from './offices-canon.mjs'
import { extractAtlasJson } from './world-atlas-parse.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaults = Object.freeze({
  canonRoot: resolve(repoRoot, 'LORE/canon'),
  atlasPath: resolve(repoRoot, 'LORE/World-Narrative-Atlas.md'),
  outputPath: resolve(repoRoot, 'LORE/offices/Offices-and-Ranks.md'),
})

export async function loadStateRegistry(atlasPath) {
  const parsed = extractAtlasJson(await readFile(atlasPath, 'utf8'))
  if (!parsed.ok) throw new OfficesCanonError('E_REGISTRY', parsed.error)
  return new Map(parsed.value.states.map((state) => [state.id, state.display_name]))
}

function renderTable(block, canon, registry) {
  let rows = block.rows
  if (block.source === 'state-office-titles') {
    const texts = new Map(canon.texts.map((entry) => [entry.id, entry.text]))
    const stateIds = [...new Set(canon.titles.map((title) => title.stateId))]
    rows = stateIds.map((stateId) => [
      registry.get(stateId),
      ...canon.tiers.map((tier) => texts.get(canon.titles.find((title) => title.stateId === stateId && title.tierId === tier.id).titleKey)),
    ])
  }
  return renderTableRows(block.header, rows)
}

export function renderOfficesMarkdown(canon, registry) {
  return renderDocument(canon, (block) => renderTable(block, canon, registry))
}

export async function materializeOffices({ canonRoot, atlasPath, outputPath, check }) {
  const registry = await loadStateRegistry(atlasPath)
  const rendered = renderOfficesMarkdown(await loadOfficesCanon(canonRoot, registry), registry)
  return emitGenerated({ outputPath, rendered, check })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  try {
    const { changed } = await materializeOffices({ ...defaults, check })
    console.log(check ? 'offices: OK (no drift)' : changed ? 'offices: written' : 'offices: unchanged')
  } catch (error) {
    if (!(error instanceof OfficesCanonError)) throw error
    console.error(error.message)
    process.exitCode = 1
  }
}
