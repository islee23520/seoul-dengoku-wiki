#!/usr/bin/env node
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const inlineText = (inline) => (inline.kind === 'link' ? `[${inline.text}](${inline.href})` : inline.text)
const row = (cells) => `| ${cells.join(' | ')} |`

function renderTable(block, canon, registry) {
  const separator = `|${block.header.map(() => '---').join('|')}|`
  let rows = block.rows
  if (block.source === 'state-office-titles') {
    const texts = new Map(canon.texts.map((entry) => [entry.id, entry.text]))
    const stateIds = [...new Set(canon.titles.map((title) => title.stateId))]
    rows = stateIds.map((stateId) => [
      registry.get(stateId),
      ...canon.tiers.map((tier) => texts.get(canon.titles.find((title) => title.stateId === stateId && title.tierId === tier.id).titleKey)),
    ])
  }
  return [row(block.header), separator, ...rows.map(row)].join('\n')
}

function renderBlock(block, canon, registry) {
  switch (block.kind) {
    case 'heading':
      return `${'#'.repeat(block.level)} ${block.inlines.map(inlineText).join('')}`
    case 'paragraph':
      return block.inlines.map(inlineText).join('')
    case 'table':
      return renderTable(block, canon, registry)
    default:
      throw new OfficesCanonError('E_UNSUPPORTED_BLOCK', `${block.id}: ${block.kind}`)
  }
}

export function renderOfficesMarkdown(canon, registry) {
  const blocksById = new Map(canon.blocks.map((block) => [block.id, block]))
  return `${canon.document.blockIds.map((id) => renderBlock(blocksById.get(id), canon, registry)).join('\n\n')}\n`
}

export async function materializeOffices({ canonRoot, atlasPath, outputPath, check }) {
  const registry = await loadStateRegistry(atlasPath)
  const rendered = renderOfficesMarkdown(await loadOfficesCanon(canonRoot, registry), registry)
  const existing = await readFile(outputPath, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (existing === rendered) return { changed: false }
  if (check) throw new OfficesCanonError('E_DRIFT', outputPath)
  const temporary = `${outputPath}.tmp-${process.pid}`
  try {
    await writeFile(temporary, rendered)
    await rename(temporary, outputPath)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
  return { changed: true }
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
