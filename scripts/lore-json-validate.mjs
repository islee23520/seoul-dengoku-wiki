import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { coinedPhraseFailures, findBannedTerms, retiredFormFailures } from './gate.mjs'
import { ledger } from './lore-json-validate-ledger.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loreRoot = join(root, 'lore')
const schemaRunner = join(root, 'scripts/lore-json-schema.py')
const excluded = new Set(['M007', 'B017', 'B020'])
const privatePages = new Set(['Cast-Profile-Contract', 'Cast-Registration-Template', 'Random-Cast-Roster'])
// Operating guidance, private contracts and templates, and unapproved drafts stay Markdown (task 10c ledger).
// Every other lore Markdown file must have a JSON authoring document.
const allowedMarkdown = new Set([
  'lore/README.md',
  'lore/characters/Cast-Profile-Contract.md',
  'lore/characters/Cast-Registration-Template.md',
  'lore/characters/Random-Cast-Roster.md',
  'lore/editorial/Naming-Ledger.md',
  'lore/editorial/Writing-Rules.md',
  'lore/name-pools/cast-backfill-draft.md',
  'lore/name-pools/hangnyeol-schema.md',
  'lore/places/Station-Alias-Candidates.md',
  'lore/regions/README.md',
  'lore/regions/sources/observed-levels-join.md',
])
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

// EN is the primary locale and KO corresponds block by block: every localized leaf of every content block
// carries both locales, and every block ID named in `data` is bound to a content block of the same document.
function localeBindingFailures(document, label) {
  const failures = []
  const content = Array.isArray(document?.content) ? document.content : []
  const blockIds = new Set(content.map((node) => node?.anchor))
  content.forEach((node, index) => {
    const block = node?.anchor ?? `content[${index}]`
    const localized = node?.kind === 'rule' ? []
      : node?.kind === 'list' ? node.items ?? []
      : node?.kind === 'table' ? [...(node.columns ?? []), ...(node.rows ?? []).flat()]
      : [node?.text]
    for (const leaf of localized) {
      for (const locale of locales) {
        if (!leaf || typeof leaf !== 'object' || !(locale in leaf)) failures.push(`E_LOCALE: ${label}: ${block} is missing its ${locale} block`)
      }
    }
  })
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (!value || typeof value !== 'object') return
    if (typeof value.anchor === 'string' && !blockIds.has(value.anchor)) failures.push(`E_ANCHOR: ${label}: data block id ${value.anchor} has no content block`)
    Object.values(value).forEach(visit)
  }
  visit(document?.data)
  return failures
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
    failures.push(...localeBindingFailures(document, label))
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
    if (document.tense.en !== document.tense.ko) failures.push(`E_TENSE: ${label}: tense en and ko differ (${document.tense.en}/${document.tense.ko})`)
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

function git(...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  if (result.error || result.status !== 0) throw new Error(`E_GIT: git ${args.join(' ')}: ${result.stderr?.trim() || result.error?.message}`)
  return result.stdout.split('\n').filter(Boolean)
}

// An authoring document is a lore JSON object with the envelope's locale/content body; region data, name pools,
// the glossary and the schema files are other data contracts. Unparseable lore JSON is kept so it fails as E_JSON.
function isAuthoring(path) {
  let value
  try { value = JSON.parse(readFileSync(join(root, path), 'utf8')) } catch { return true }
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !('$schema' in value)
    && ('locales' in value || Array.isArray(value.content))
}

const loreFiles = () => git('ls-files', '--cached', '--others', '--exclude-standard', '--', 'lore')
  .filter((path) => existsSync(join(root, path)))

function unmigratedMarkdown(authoring) {
  const migrated = new Set(authoring)
  return loreFiles()
    .filter((path) => path.endsWith('.md') && !path.endsWith('/AGENTS.md') && path !== 'lore/AUTHORING-JSON.md')
    .filter((path) => !migrated.has(path.replace(/\.md$/u, '.json')))
    .filter((path) => !allowedMarkdown.has(path))
}

function report(failures, summary) {
  for (const failure of failures) console.error(failure)
  if (failures.length) {
    console.error(`FAIL: ${summary}, ${failures.length} failure(s)`)
    process.exitCode = 1
  } else console.log(`OK: ${summary}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const strict = args.includes('--strict')
  const baseIndex = args.indexOf('--base')
  const base = baseIndex >= 0 ? args[baseIndex + 1] : 'origin/main'
  const files = args.filter((arg, index) => arg !== '--strict' && (baseIndex < 0 || (index !== baseIndex && index !== baseIndex + 1)))
  if (baseIndex >= 0 && !base) {
    console.error('Usage: node scripts/lore-json-validate.mjs [--strict | --base <ref> | <authoring.json>...]')
    process.exitCode = 2
  } else if (files.length) {
    report(validate(files.map((file) => resolve(file))), `${files.length} lore JSON document(s)`)
  } else if (strict) {
    const authoring = loreFiles().filter((path) => path.endsWith('.json') && isAuthoring(path))
    const unmigrated = unmigratedMarkdown(authoring)
    report([
      ...validate(authoring.map((path) => join(root, path))),
      ...unmigrated.map((path) => `E_UNMIGRATED: ${path}: Markdown corpus file has no JSON authoring document`),
    ], `strict: ${authoring.length} lore JSON document(s), ${unmigrated.length} unmigrated Markdown file(s)`)
  } else {
    const changed = [...new Set([
      ...git('diff', '--name-only', '--diff-filter=d', base, '--', 'lore'),
      ...git('ls-files', '--others', '--exclude-standard', '--', 'lore'),
    ])].filter((path) => path.endsWith('.json') && isAuthoring(path))
    const selected = [...new Set([...changed, ...ledger])]
    report(validate(selected.map((path) => join(root, path))), `${selected.length} lore JSON document(s) (changed ${changed.length}, ledger ${ledger.length})`)
  }
}

export { validate }
