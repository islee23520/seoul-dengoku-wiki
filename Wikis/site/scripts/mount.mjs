import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsSiteRoot = join(scriptDir, '..')
const repoRoot = join(docsSiteRoot, '..', '..')
const gameLogicRoot = join(repoRoot, 'Wikis', 'game-logic')
const referenceDir = join(repoRoot, 'Research', 'canon-reference')

const GITHUB_WIKI =
  'https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/'

const DESIGN_EXACT = new Set([
  'Game-Thesis.md',
  'Online-User-Journey.md',
  'Home.md',
  'Asset-Pipeline.md',
  'Ui-Implementation-Pipeline.md',
  'Development-Roadmap.md',
  'Game-References.md',
  'Research-Sources.md',
  'Unofficial-Fan-AU-Notice.md',
  'Concept.md',
  'Design.md',
  'ToDo.md',
  'Intent.md'
])

const WORLD_PREFIXES = [
  'World-',
  'Sixteen-States',
  'Core-Characters',
  'Characters-Factions',
  'Cast-',
  'Story-Batch-',
  'Monster-Batch-',
  'Hostile-',
  'Scenario-Timeline',
  'World-Unbinding',
  'Faith-Culture',
  'Chaebol-Houses',
  'Lost-Technology',
  'Diaspora-Corridors',
  'Conscription-Remnants',
  'Era-Arms',
  'Hangnyeol-and-Bon-gwan',
  'Heirs-Names',
  'Random-Cast-Roster',
  'Operating-Houses',
  'Synthetic-Actors',
  'Factions-and',
  'Economy-and',
  'Logistics-and',
  'Strongholds-and',
  'Ambitions-and',
  'External-Theaters',
  'Regional-Physical',
  'Starting-Presets'
]

const RULES_PREFIXES = [
  'Campaign-',
  'Realtime-Formation',
  'Save-and-Determinism',
  'Strategy-',
  'Travel-and',
  'Warfare-and',
  'Unity-',
  'Ref-',
  'Character-Art-Direction'
]

const EXCLUDED_NAMES = new Set(['_Sidebar.md', '_TEMPLATE.md'])
const DOMAIN_TAGS = new Set(['design', 'world', 'rules'])

function matchesPrefix(filename, prefixes) {
  return prefixes.some((prefix) => filename.startsWith(prefix))
}

function domainFor(filename) {
  if (DESIGN_EXACT.has(filename)) return 'design'
  if (matchesPrefix(filename, WORLD_PREFIXES)) return 'world'
  if (matchesPrefix(filename, RULES_PREFIXES)) return 'rules'
  return null
}

function parseFrontmatterDomain(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null
  const rest = content.startsWith('---\r\n') ? content.slice(5) : content.slice(4)
  const endMatch = rest.match(/\r?\n---(?:\r?\n|$)/)
  if (!endMatch) return null
  const fm = rest.slice(0, endMatch.index)
  const match = fm.match(/^domain:\s*(\S+)/m)
  if (!match) return null
  const value = match[1].replace(/['"]/g, '')
  return DOMAIN_TAGS.has(value) ? value : null
}

function listMarkdown(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .filter((name) => {
      const full = join(dir, name)
      return statSync(full).isFile()
    })
    .sort()
}

function sitePath(domain, filename) {
  return `/${domain}/${filename.replace(/\.md$/, '')}`
}

function rewriteHref(href, pageByFile, pageByStem) {
  const hashIndex = href.indexOf('#')
  const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : ''

  if (
    !pathPart ||
    pathPart.startsWith('http://') ||
    pathPart.startsWith('https://') ||
    pathPart.startsWith('mailto:') ||
    pathPart.startsWith('#')
  ) {
    return href
  }

  const assetsMatch =
    pathPart.match(/^(?:\.\.\/)+assets\/wiki\/(.+)$/) ||
    pathPart.match(/^(?:\.\.\/)+Reference\/assets\/wiki\/(.+)$/)
  if (assetsMatch) {
    return `${GITHUB_WIKI}${assetsMatch[1]}?raw=true${hash}`
  }

  const fileName = basename(pathPart)
  if (fileName.endsWith('.md') && pageByFile.has(fileName)) {
    return `${pageByFile.get(fileName)}${hash}`
  }

  if (!pathPart.includes('/') && pageByStem.has(pathPart)) {
    return `${pageByStem.get(pathPart)}${hash}`
  }

  return href
}

function rewriteContent(content, pageByFile, pageByStem) {
  return content.replace(/\]\(([^)\s]+)\)/g, (full, href) => {
    const next = rewriteHref(href, pageByFile, pageByStem)
    return next === href ? full : `](${next})`
  })
}

const excluded = []
const rejected = []
const acceptedFiles = []

for (const name of listMarkdown(referenceDir)) {
  excluded.push(`reference/${name}`)
}

const candidates = []

for (const name of listMarkdown(gameLogicRoot)) {
  if (EXCLUDED_NAMES.has(name)) {
    excluded.push(name)
    continue
  }
  candidates.push({ name, src: join(gameLogicRoot, name) })
}

for (const name of ['Concept.md', 'Design.md', 'ToDo.md', 'Intent.md']) {
  candidates.push({ name, src: join(repoRoot, name) })
}

const mapped = []
for (const { name, src } of candidates) {
  const mappedDomain = domainFor(name)
  const taggedDomain = mappedDomain
    ? null
    : parseFrontmatterDomain(readFileSync(src, 'utf8'))
  const domain = mappedDomain ?? taggedDomain
  if (!domain) {
    rejected.push(`${name}: no domain mapping`)
    continue
  }
  mapped.push({ name, src, domain })
}

const pageByFile = new Map()
const pageByStem = new Map()
for (const { name, domain } of mapped) {
  const path = sitePath(domain, name)
  pageByFile.set(name, path)
  pageByStem.set(name.replace(/\.md$/, ''), path)
}

for (const { name, src, domain } of mapped) {
  const dest = join(docsSiteRoot, domain, name)
  const content = readFileSync(src, 'utf8')
  writeFileSync(dest, rewriteContent(content, pageByFile, pageByStem))
  acceptedFiles.push(name)
}

const excludedList = excluded.map((item) => JSON.stringify(item)).join(', ')
console.log(
  `accepted: ${acceptedFiles.length}, rejected: ${rejected.length}, excluded: [${excludedList}]`
)

if (rejected.length > 0) {
  for (const item of rejected) {
    console.error(`rejected: ${item}`)
  }
  process.exit(1)
}
