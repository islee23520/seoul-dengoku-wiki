import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { coinedPhraseFailures, findBannedTerms, retiredFormFailures } from './gate.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loreRoot = join(root, 'lore')
const schemaRunner = join(root, 'scripts/lore-json-schema.py')
const excluded = new Set(['M007', 'B017', 'B020'])
const privatePages = new Set(['Cast-Profile-Contract', 'Cast-Registration-Template', 'Random-Cast-Roster'])
const locales = ['en', 'ko']

function leaves(node) {
  if (node.kind === 'heading' || node.kind === 'paragraph' || node.kind === 'quote') return [node.text]
  if (node.kind === 'list') return node.items
  if (node.kind === 'table') return [...node.columns, ...node.rows.flat()]
  return []
}

function texts(value) {
  return typeof value === 'string' ? [value] : Array.isArray(value) ? value.map((run) => run.text) : []
}

function namingFailures(text, label, position) {
  return [...findBannedTerms(text), ...coinedPhraseFailures(text, label), ...retiredFormFailures(text, label)]
    .map((issue) => `E_NAMING: ${label}: ${position}: ${issue}`)
}

function validate(files) {
  const failures = []
  const documents = new Map()
  const slugs = new Map()
  const ids = new Map()
  for (const file of files) {
    let document
    try { document = JSON.parse(readFileSync(file, 'utf8')) } catch (error) {
      failures.push(`E_JSON: ${file}: ${error.message}`)
      continue
    }
    const label = relative(root, file)
    const domain = document?.domain
    const schema = spawnSync('python3', [schemaRunner, domain ?? ''], { input: JSON.stringify(document), encoding: 'utf8' })
    if (schema.error || schema.status !== 0) {
      failures.push(`${label}: ${schema.stdout?.trim() || schema.stderr?.trim() || schema.error?.message || 'E_SCHEMA: failed'}`)
      continue
    }
    if (document.id.startsWith('__EXAMPLE__:') && !file.endsWith('authoring.example.json')) failures.push(`E_ID: ${label}: reserved example ID`)
    if (excluded.has(document.id)) failures.push(`E_ID: ${label}: excluded ID ${document.id}`)
    for (const [key, map, code] of [[document.id, ids, 'E_ID'], [`${domain}/${document.slug}`, slugs, 'E_SLUG']]) {
      if (map.has(key)) failures.push(`${code}: ${label}: duplicate ${key} (${map.get(key)})`)
      else map.set(key, label)
    }
    const ownDir = dirname(file)
    const directory = relative(loreRoot, ownDir)
    if (!directory.startsWith('..') && directory.split('/')[0] !== (domain === 'root' ? '' : domain)) failures.push(`E_DOMAIN: ${label}: domain does not match directory`)
    const anchors = new Set()
    for (const node of document.content) {
      if (anchors.has(node.anchor)) failures.push(`E_ANCHOR: ${label}: duplicate ${node.anchor}`)
      anchors.add(node.anchor)
    }
    documents.set(`${domain}/${document.slug}`, { file, document, anchors })
  }
  for (const { file, document } of documents.values()) {
    const label = relative(root, file)
    for (const locale of locales) {
      if (document.tense[locale] !== document.locales[locale].tense) failures.push(`E_TENSE: ${label}: ${locale} header differs from envelope`)
      for (const field of ['title', 'summary']) failures.push(...namingFailures(document.locales[locale][field], label, `${locale}.${field}`))
    }
    document.content.forEach((node) => {
      if (node.kind === 'table' && node.rows.some((row) => row.length !== node.columns.length)) failures.push(`E_BLOCK: ${label}: ${node.anchor} table row width differs`)
      for (const leaf of leaves(node)) {
        for (const locale of locales) {
          for (const text of texts(leaf[locale])) {
            if (node.kind === 'paragraph' && /\*\*|\[[^\]]+\]\([^)]*\)|(?:^|\n)#{1,6} |(?:^|\n)> |`{3}/u.test(text)) failures.push(`E_MARKDOWN: ${label}: ${node.anchor} ${locale}`)
            failures.push(...namingFailures(text, label, `${node.anchor} ${locale}`))
          }
          const runs = leaf[locale]
          if (!Array.isArray(runs)) continue
          for (const run of runs) {
            if (!run.link || run.link.domain === 'gdd') continue
            const { domain, slug, anchor } = run.link
            const target = join(loreRoot, domain === 'root' ? '' : domain, `${slug}.json`)
            const markdown = join(loreRoot, domain === 'root' ? '' : domain, `${slug}.md`)
            if (privatePages.has(slug) || (!existsSync(target) && !existsSync(markdown))) failures.push(`E_LINK: ${label}: ${domain}/${slug} does not exist or is private`)
            else if (anchor && existsSync(target)) {
              const targetDocument = documents.get(`${domain}/${slug}`)?.document ?? JSON.parse(readFileSync(target, 'utf8'))
              if (!targetDocument.content?.some((block) => block.anchor === anchor)) failures.push(`E_LINK: ${label}: ${domain}/${slug}#${anchor} does not exist`)
            }
          }
        }
      }
    })
  }
  return failures
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2).map((file) => resolve(file))
  if (!files.length) {
    console.error('Usage: node scripts/lore-json-validate.mjs <authoring.json> [...authoring.json]')
    process.exitCode = 2
  } else {
    const failures = validate(files)
    for (const failure of failures) console.error(failure)
    if (failures.length) process.exitCode = 1
    else console.log(`OK: ${files.length} lore JSON document(s)`)
  }
}

export { validate }
