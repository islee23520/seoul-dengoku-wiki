// mount.mjs v4 — lore → wiki-source/world. GDD pages are published by GDD/viewer at /gdd/;
// materialized GDD pages are read only as link targets so lore links resolve to /gdd/ routes.
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
const referenceDir = join(repoRoot, 'RESEARCH', 'canon-reference')

const GITHUB_WIKI = 'https://github.com/islee23520/seoul-kenshi/blob/main/' + 'retired-reference-assets/'

const WORLD_ROOT = join(wikiRoot, 'lore')
// GDD viewer categories (GDD/viewer/scripts/generate-catalog.mjs): materialized dir -> /gdd/<category>/<slug>
const GDD_LINK_ROOTS = [
  { category: 'design', dir: gddPagesRoot },
  { category: 'rules', dir: join(gddPagesRoot, 'rules') },
  { category: 'architecture', dir: join(gddPagesRoot, 'architecture') },
  { category: 'references', dir: join(gddPagesRoot, 'references') },
  { category: 'art', dir: join(gddPagesRoot, 'art') },
]
const GDD_SECTIONS = new Set(['rules', 'architecture', 'references', 'art'])

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
    const [section, rest] = source.includes('/') ? [source.slice(0, source.indexOf('/')), source.slice(source.indexOf('/') + 1)] : ['design', source]
    const category = !source.includes('/') || (GDD_SECTIONS.has(section) && !rest.includes('/')) ? section : null
    return category ? `/gdd/${category}/${basename(source)}${hash}` : `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/locales/ko-KR/${source.toLowerCase()}.json${hash}`
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

// 후보 수집: LORE는 재귀(평면 스템)로 world에 쓰고, GDD 페이지는 /gdd/ 링크 대상으로만 쓴다
const candidates = []
for (const { name, src, document } of listLoreMarkdown(WORLD_ROOT)) {
  candidates.push({ name, src, domain: 'world', document })
}
const gddTargets = []
for (const { category, dir } of GDD_LINK_ROOTS) {
  for (const name of listMarkdown(dir)) {
    gddTargets.push({ name, path: `/gdd/${category}/${name.replace(/\.md$/, '')}` })
  }
}

const currentDestinations = new Set(candidates.map(({ name, domain }) => join(docsSiteRoot, domain, name)))
for (const name of listMarkdown(join(docsSiteRoot, 'world'))) {
  if (name === 'index.md') continue
  const path = join(docsSiteRoot, 'world', name)
  if (!currentDestinations.has(path)) rmSync(path, { force: true })
}

// 유니온 맵 (도메인 간 베어 링크 재작성용)
const pageByFile = new Map()
const pageByStem = new Map()
for (const { name, path } of [...candidates.map(({ name, domain }) => ({ name, path: sitePath(domain, name) })), ...gddTargets]) {
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
