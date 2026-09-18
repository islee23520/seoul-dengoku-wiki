// mount.mjs v2 — 3루트(LORE/GAME-LOGIC/GDD) + 루트 문서 → GAME-LOGIC/site/{world,rules,design} 스테이징
// 폴더=도메인: LORE/*.md→world, GAME-LOGIC/*.md→rules, GDD/*.md(평면)→design + 루트 4문서→design
// 유니온 pageByFile/pageByStem로 도메인 간 베어 링크 재작성 (스켑틱 #10)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsSiteRoot = join(scriptDir, '..')
const repoRoot = join(docsSiteRoot, '..', '..')
const referenceDir = join(repoRoot, 'RESEARCH', 'canon-reference')

const GITHUB_WIKI =
  'https://github.com/islee23520/seoul-kenshi/blob/main/GAME-REFERENCE/assets/wiki/'

const DOMAIN_ROOTS = [
  { domain: 'world', dir: join(repoRoot, 'LORE') },
  { domain: 'rules', dir: join(repoRoot, 'GAME-LOGIC') },
  { domain: 'design', dir: join(repoRoot, 'GDD') },
]
const ROOT_DOCS = ['Concept.md', 'Design.md', 'ToDo.md', 'Intent.md']

const EXCLUDED_NAMES = new Set(['_Sidebar.md', '_TEMPLATE.md'])

function listMarkdown(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !EXCLUDED_NAMES.has(name))
    .filter((name) => statSync(join(dir, name)).isFile())
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

// 후보 수집: 3도메인 루트(평면 md) + 루트 4문서
const candidates = []
for (const { domain, dir } of DOMAIN_ROOTS) {
  for (const name of listMarkdown(dir)) {
    candidates.push({ name, src: join(dir, name), domain })
  }
}
for (const name of ROOT_DOCS) {
  candidates.push({ name, src: join(repoRoot, name), domain: 'design' })
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
