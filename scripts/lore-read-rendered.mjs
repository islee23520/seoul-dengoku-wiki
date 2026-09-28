// Reads a lore authoring JSON and returns its Korean Markdown render, so checks do not depend on
// the Markdown twin next to it.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderLoreMarkdown } from './lore-json-render.mjs'

export function readRendered(loreRoot, domain, slug) {
  const path = join(loreRoot, domain === 'root' ? '' : domain, `${slug}.json`)
  return renderLoreMarkdown(JSON.parse(readFileSync(path, 'utf8')), 'ko')
}
