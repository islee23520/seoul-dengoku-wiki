// mount.mjs v3 — lore + materialized GDD pages + root documents → wiki-source/{world,rules,design}
// 유니온 pageByFile/pageByStem로 도메인 간 베어 링크 재작성 (스켑틱 #10)
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderLoreMarkdown } from './lore-json-render.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsSiteRoot = join(scriptDir, '..')
const wikiRoot = join(docsSiteRoot, '..')
const repoRoot = join(wikiRoot, '..')
const gddPagesRoot = process.env.GDD_PAGES_ROOT
if (!gddPagesRoot) throw new Error('GDD_PAGES_ROOT is required: materialize GDD JSON canon before mounting')
const rootDocsRoot = process.env.ROOT_DOCS_ROOT || repoRoot
const referenceDir = join(repoRoot, 'RESEARCH', 'canon-reference')

const GITHUB_WIKI = 'https://github.com/islee23520/seoul-kenshi/blob/main/' + 'retired-reference-assets/'

const DOMAIN_ROOTS = [
  { domain: 'world', dir: join(wikiRoot, 'lore') },
  { domain: 'rules', dir: join(gddPagesRoot, 'rules') },
  { domain: 'rules', dir: join(gddPagesRoot, 'references') },
  { domain: 'rules', dir: join(gddPagesRoot, 'architecture') },
  { domain: 'design', dir: gddPagesRoot },
  { domain: 'design', dir: join(gddPagesRoot, 'art') },
]
const ROOT_DOCS = ['Concept.md', 'Design.md', 'ToDo.md', 'Intent.md']

const EXCLUDED_NAMES = new Set(['_Sidebar.md', '_TEMPLATE.md', 'AGENTS.md', 'AUTHORING-JSON.md'])
const PUBLIC_EXCLUDED_NAMES = new Set([
  'Cast-Profile-Contract.md',
  'Cast-Registration-Template.md',
  'Random-Cast-Roster.md',
])
const LORE_SKIP_DIRS = new Set(['name-pools', 'regions', 'editorial'])

function listMarkdown(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !EXCLUDED_NAMES.has(name))
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort()
}

function listLoreMarkdown(dir) {
  const out = []
  function walk(current) {
    for (const name of readdirSync(current).sort()) {
      if (name.startsWith('.')) continue
      const full = join(current, name)
      const st = statSync(full)
      if (st.isDirectory()) {
        if (LORE_SKIP_DIRS.has(name)) continue
        walk(full)
        continue
      }
      if (!st.isFile()) continue
      if (name.endsWith('.json') && !name.startsWith('authoring.')) {
        const document = loreJsonDocument(full)
        const pageName = name.replace(/\.json$/, '.md')
        if (document && !EXCLUDED_NAMES.has(pageName) && !PUBLIC_EXCLUDED_NAMES.has(pageName)) out.push({ name: pageName, src: full, document })
        continue
      }
      if (!name.endsWith('.md') || EXCLUDED_NAMES.has(name) || PUBLIC_EXCLUDED_NAMES.has(name) || name === 'README.md') continue
      out.push({ name, src: full })
    }
  }
  walk(dir)
  // A page authored as lore JSON replaces its Markdown twin in the same folder.
  const jsonPages = new Set(out.filter((entry) => entry.document).map((entry) => join(dirname(entry.src), entry.name)))
  return out.filter((entry) => entry.document || !jsonPages.has(entry.src))
}

// Lore JSON documents (lore/**/<Page>.json with content + domain) are pages; other JSON files are data.
function loreJsonDocument(path) {
  let value
  try { value = JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
  return value && typeof value === 'object' && !Array.isArray(value) && typeof value.domain === 'string' && Array.isArray(value.content) ? value : null
}

// Where a lore link points: a page (.md, or a JSON page staged as .md) or a data file such as name-pools/values-cast.json.
function loreLinkFile(domain, slug) {
  const base = join(wikiRoot, 'lore', domain === 'root' ? '' : domain, slug)
  const dataFile = existsSync(`${base}.json`) && !existsSync(`${base}.md`) && !loreJsonDocument(`${base}.json`)
  return `lore/${domain === 'root' ? '' : `${domain}/`}${slug}${dataFile ? '.json' : '.md'}`
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
    pathPart.match(/^(?:\.\.\/)+(?:GAME-REFERENCE|Reference)\/assets\/wiki\/(.+)$/)
  if (assetsMatch) {
    return `${GITHUB_WIKI}${assetsMatch[1]}?raw=true${hash}`
  }

  const gddMatch = pathPart.match(/(?:^|\/)GDD\/(.+)\.md$/)
  if (gddMatch) {
    const source = gddMatch[1]
    const domain = /^(?:rules|references|architecture)\//.test(source) ? 'rules' : /^(?:art\/)?[^/]+$/.test(source) ? 'design' : null
    return domain ? `${sitePath(domain, basename(source) + '.md')}${hash}` : `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/locales/ko-KR/${source.toLowerCase()}.json${hash}`
  }
  if (pathPart.includes('system-design/') && !pathPart.endsWith('.md')) {
    return `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/collections/system-design.json${hash}`
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

// 후보 수집: LORE는 재귀(평면 스템), 나머지 도메인은 루트 평면 md + 루트 4문서
const candidates = []
for (const { domain, dir } of DOMAIN_ROOTS) {
  if (domain === 'world') {
    for (const { name, src, document } of listLoreMarkdown(dir)) {
      candidates.push({ name, src, domain, document })
    }
    continue
  }
  for (const name of listMarkdown(dir)) {
    candidates.push({ name, src: join(dir, name), domain })
  }
}
for (const name of ROOT_DOCS) {
  candidates.push({ name, src: join(rootDocsRoot, name), domain: 'design' })
}

const currentDestinations = new Set(candidates.map(({ name, domain }) => join(docsSiteRoot, domain, name)))
for (const domain of ['world', 'rules', 'design']) {
  for (const name of listMarkdown(join(docsSiteRoot, domain))) {
    if (name === 'index.md') continue
    if (domain === 'rules' && name.startsWith('Rules-')) continue
    const path = join(docsSiteRoot, domain, name)
    if (!currentDestinations.has(path)) rmSync(path, { force: true })
  }
}

// 유니온 맵 (도메인 간 베어 링크 재작성용)
const pageByFile = new Map()
const pageByStem = new Map()
for (const { name, domain } of candidates) {
  const path = sitePath(domain, name)
  if (pageByFile.has(name)) {
    rejected.push(`${name}: duplicate across domain roots`)
    continue
  }
  pageByFile.set(name, path)
  pageByStem.set(name.replace(/\.md$/, ''), path)
}

for (const { name, src, domain, document } of candidates) {
  if (rejected.some((r) => r.startsWith(`${name}:`))) continue
  const dest = join(docsSiteRoot, domain, name)
  const content = document ? renderLoreMarkdown(document, 'ko', loreLinkFile) : readFileSync(src, 'utf8')
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
