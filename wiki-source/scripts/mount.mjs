// mount.mjs v3 — 위키 서브모듈 lore/ + 메인 GDD 정본 + 루트 문서 → wiki-source/{world,rules,design} 스테이징
// 폴더=도메인: lore/**/*.md→world, GDD/{rules,references,architecture}/*.md→rules,
// GDD/*.md + GDD/art/*.md + 루트 4문서→design
// 유니온 pageByFile/pageByStem로 도메인 간 베어 링크 재작성 (스켑틱 #10)
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsSiteRoot = join(scriptDir, '..')
const wikiRoot = join(docsSiteRoot, '..')
const repoRoot = join(wikiRoot, '..')
const referenceDir = join(repoRoot, 'RESEARCH', 'canon-reference')

const GITHUB_WIKI = 'https://github.com/islee23520/seoul-kenshi/blob/main/' + 'retired-reference-assets/'

const DOMAIN_ROOTS = [
  { domain: 'world', dir: join(wikiRoot, 'lore') },
  { domain: 'rules', dir: join(repoRoot, 'GDD', 'rules') },
  { domain: 'rules', dir: join(repoRoot, 'GDD', 'references') },
  { domain: 'rules', dir: join(repoRoot, 'GDD', 'architecture') },
  { domain: 'design', dir: join(repoRoot, 'GDD') },
  { domain: 'design', dir: join(repoRoot, 'GDD', 'art') },
]
const ROOT_DOCS = ['Concept.md', 'Design.md', 'ToDo.md', 'Intent.md']

const EXCLUDED_NAMES = new Set(['_Sidebar.md', '_TEMPLATE.md', 'AGENTS.md'])
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
      if (!name.endsWith('.md') || name.endsWith('.en.md') || EXCLUDED_NAMES.has(name) || PUBLIC_EXCLUDED_NAMES.has(name) || name === 'README.md') continue
      out.push({ name, src: full })
    }
  }
  walk(dir)
  return out
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
  if (!['world', 'rules', 'design'].includes(domain)) throw new Error('publisher rejected ' + domain)
  if (domain === 'world') {
    for (const { name, src } of listLoreMarkdown(dir)) {
      candidates.push({ name, src, domain })
    }
    continue
  }
  for (const name of listMarkdown(dir)) {
    candidates.push({ name, src: join(dir, name), domain })
  }
}
for (const name of ROOT_DOCS) {
  candidates.push({ name, src: join(repoRoot, name), domain: 'design' })
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

for (const { name, src, domain } of candidates) {
  if (rejected.some((r) => r.startsWith(`${name}:`))) continue
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
