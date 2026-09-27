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
const excludedAtlasEntries = new Set(['G04E13', 'G04E14', 'G04E15', 'G04E16', 'G05E01', 'G05E02', 'G05E03', 'G05E04', 'G05E05', 'G05E06'])
const retiredAtlasRoute = /^(?:Monster-Batch-|Story-Batch-|(?:Monster|Story)-Batch-Manifest$)/u

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
function nodesIn(document) {
  const nodes = [...(Array.isArray(document?.content) ? document.content : [])]
  const visit = (value, key) => {
    if (Array.isArray(value)) {
      if (key === 'prose' || key === 'dossier_prose') nodes.push(...value)
      else value.forEach((item) => visit(item))
      return
    }
    if (!value || typeof value !== 'object') return
    Object.entries(value).forEach(([childKey, child]) => visit(child, childKey))
  }
  visit(document?.data)
  return nodes
}

function localeBindingFailures(document, label) {
  const failures = []
  const content = nodesIn(document)
  const blockIds = new Set()
  content.forEach((node) => {
    if (typeof node?.anchor === 'string') blockIds.add(node.anchor)
    for (const anchor of node?.publicAnchors ?? []) blockIds.add(anchor)
  })
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
  // A run's link.anchor names a block in the linked document; E_LINK checks it there.
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (!value || typeof value !== 'object') return
    if (typeof value.anchor === 'string' && !blockIds.has(value.anchor)) failures.push(`E_ANCHOR: ${label}: data block id ${value.anchor} has no content block`)
    Object.entries(value).forEach(([key, child]) => { if (key !== 'link') visit(child) })
  }
  visit(document?.data)
  return failures
}

function atlasFailures(document, label) {
  const failures = []
  if (document?.id !== 'WNA-001') return failures
  const atlas = document?.data?.atlas
  if (!atlas || typeof atlas !== 'object') return failures
  const contentKeys = Object.keys(atlas.monster_contents ?? {})
  if (contentKeys.includes('M007')) failures.push(`E_EXCLUDED_ID: ${label}: authored monster content M007 is excluded`)
  for (const content of Object.values(atlas.monster_contents ?? {})) {
    if (content?.id === 'M007') failures.push(`E_EXCLUDED_ID: ${label}: authored monster content M007 is excluded`)
    for (const entry of content?.entries ?? []) {
      if (excludedAtlasEntries.has(entry?.id)) failures.push(`E_EXCLUDED_ID: ${label}: authored monster entry ${entry.id} is reserved by M007`)
    }
  }
  for (const [slug] of Object.entries(atlas.projection_pages ?? {})) {
    if (retiredAtlasRoute.test(slug)) failures.push(`E_EXCLUDED_ID: ${label}: retired atlas route ${slug}`)
    if (/(?:^|[-/])(?:B017|B020)(?:$|[-/])/u.test(slug)) failures.push(`E_EXCLUDED_ID: ${label}: excluded social record route ${slug}`)
  }
  const ids = new Set()
  const names = new Map()
  for (const collection of ['states', 'humans', 'houses', 'theaters', 'synthetics', 'hostile_groups', 'monster_batches', 'arcs']) {
    for (const record of atlas[collection] ?? []) {
      if (ids.has(record.id)) failures.push(`E_ID: ${label}: duplicate atlas ID ${record.id}`)
      ids.add(record.id)
      const name = record?.display_name?.ko
      if (typeof name === 'string') names.set(name, record.id)
    }
  }
  for (const content of Object.values(atlas.monster_contents ?? {})) {
    for (const entry of content?.entries ?? []) {
      if (ids.has(entry.id)) failures.push(`E_ID: ${label}: duplicate atlas ID ${entry.id}`)
      ids.add(entry.id)
    }
  }
  for (const relation of atlas.relations ?? []) {
    for (const endpoint of ['from', 'to']) {
      const value = relation?.[endpoint]
      if (typeof value !== 'string') continue
      if (!ids.has(value)) {
        if (names.has(value)) failures.push(`E_REFERENCE: ${label}: relation ${endpoint} ${value} must use stable ID ${names.get(value)} with optional ${endpoint}_label`)
        else failures.push(`E_REFERENCE: ${label}: relation ${endpoint} ${value} does not resolve`)
      }
    }
  }
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
    failures.push(...atlasFailures(document, label))
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
    for (const node of nodesIn(document)) {
      if (anchors.has(node.anchor)) failures.push(`E_ANCHOR: ${label}: duplicate ${node.anchor}`)
      anchors.add(node.anchor)
      for (const anchor of node.publicAnchors ?? []) {
        if (anchors.has(anchor)) failures.push(`E_ANCHOR: ${label}: duplicate ${anchor}`)
        anchors.add(anchor)
      }
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
    nodesIn(document).forEach((node) => {
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
              if (!nodesIn(targetDocument).some((block) => block.anchor === anchor || block.publicAnchors?.includes(anchor))) failures.push(`E_LINK: ${label}: ${domain}/${slug}#${anchor} does not exist`)
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

// A document file is named by its slug, which cannot begin with '.'; dot-prefixed paths are tool scratch
// (for example the link checker's transient fixtures), never authoring documents.
const scratch = (path) => path.split('/').some((part) => part.startsWith('.'))

const loreFiles = () => git('ls-files', '--cached', '--others', '--exclude-standard', '--', 'lore')
  .filter((path) => !scratch(path) && existsSync(join(root, path)))

function unmigratedMarkdown(authoring) {
  const migrated = new Set(authoring)
  return loreFiles()
    .filter((path) => path.endsWith('.md') && !path.endsWith('/AGENTS.md') && path !== 'lore/AUTHORING-JSON.md')
    .filter((path) => !migrated.has(path.replace(/\.md$/u, '.json')))
    .filter((path) => !allowedMarkdown.has(path))
}

// The JSON authoring document is the only source of a page: a Markdown file beside it is a stale twin, not a mirror.
function markdownTwins() {
  const files = loreFiles()
  const present = new Set(files)
  return files
    .filter((path) => path.endsWith('.md'))
    .filter((path) => present.has(path.replace(/\.md$/u, '.json')) && isAuthoring(path.replace(/\.md$/u, '.json')))
    .map((path) => `E_MARKDOWN_TWIN: ${path}: Markdown file sits next to its JSON authoring document; edit the JSON and delete the Markdown`)
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
      ...markdownTwins(),
      ...unmigrated.map((path) => `E_UNMIGRATED: ${path}: Markdown corpus file has no JSON authoring document`),
    ], `strict: ${authoring.length} lore JSON document(s), ${unmigrated.length} unmigrated Markdown file(s)`)
  } else {
    const changed = [...new Set([
      ...git('diff', '--name-only', '--diff-filter=d', base, '--', 'lore'),
      ...git('ls-files', '--others', '--exclude-standard', '--', 'lore'),
    ])].filter((path) => path.endsWith('.json') && !scratch(path) && isAuthoring(path))
    const selected = [...new Set([...changed, ...ledger])]
    report([...validate(selected.map((path) => join(root, path))), ...markdownTwins()], `${selected.length} lore JSON document(s) (changed ${changed.length}, ledger ${ledger.length})`)
  }
}

export { validate }
