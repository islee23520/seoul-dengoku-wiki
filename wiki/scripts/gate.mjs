// Public-term gate for the React wiki. VitePress per-page HTML is gone; visible reader text
// is the generated world catalog, and the built site is the SPA shell under wiki/dist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const wikiRoot = join(scriptDir, '..')
const repoRoot = join(wikiRoot, '..')
const distDir = join(wikiRoot, 'dist')
const contentDir = join(wikiRoot, 'src/generated/world')
const referenceDir = [join(repoRoot, 'RESEARCH', 'canon-reference'), join(repoRoot, '..', 'RESEARCH', 'canon-reference'), join(repoRoot, '..', '..', 'RESEARCH', 'canon-reference')].find((path) => existsSync(path))
  ?? join(repoRoot, 'RESEARCH', 'canon-reference')

const BANNED_TERMS = ['Kenshi', 'Underrail', 'Gunner', 'clone', '복제']
export const EXPECTED_REFERENCE_EXCLUSIONS = 20
const EXCLUDED_STEMS = ['_sidebar', '_template', 'cast-profile-contract', 'cast-registration-template', 'random-cast-roster']
const HUB_PREFIXES = ['/gdd/', '/ui-layout-moodboard/', '/ui-ux-refs/', '/play/']

function listFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...listFiles(full))
    else if (stat.isFile()) out.push(full)
  }
  return out
}

function posixRel(from, file) {
  return relative(from, file).split(sep).join('/')
}

export function referenceExclusionFailures(referenceDir, expected = EXPECTED_REFERENCE_EXCLUSIONS) {
  const failures = []
  if (!existsSync(referenceDir)) {
    failures.push('FAIL exclusion: RESEARCH/canon-reference/ is missing')
    return failures
  }
  const referenceFiles = readdirSync(referenceDir).filter((name) => name.endsWith('.md') && statSync(join(referenceDir, name)).isFile())
  if (referenceFiles.length !== expected) {
    failures.push(`FAIL exclusion: expected ${expected} reference/*.md files, found ${referenceFiles.length}`)
  }
  return failures
}

function visibleText(source) {
  let text = source
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<!--[\s\S]*?-->/g, ' ')
  text = text.replace(/<a\b[^>]*>/gi, (tag) => tag.replace(/\shref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ''))
  text = text.replace(/<img\b[^>]*>/gi, (tag) => tag.replace(/\ssrc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ''))
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\]\([^)]*\)/g, '')
  text = text.replace(/!\[[^\]]*\]/g, ' ')
  return text
}

function findBannedTerms(text) {
  const lower = text.toLowerCase()
  return BANNED_TERMS.filter((term) => lower.includes(term.toLowerCase()))
}

function markdownLinks(markdown) {
  return [...markdown.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1])
}

function htmlLinks(html) {
  const hrefs = []
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
  let match
  while ((match = re.exec(html))) hrefs.push(match[1] ?? match[2] ?? match[3] ?? '')
  return hrefs
}

function main() {
  const failures = []
  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    console.error(`FAIL dist-missing: ${posixRel(wikiRoot, distDir)}`)
    process.exit(1)
  }
  if (!existsSync(join(distDir, 'index.html'))) {
    console.error('FAIL dist-missing: index.html')
    process.exit(1)
  }

  const catalog = JSON.parse(readFileSync(join(wikiRoot, 'public/wiki-contract.json'), 'utf8'))
  const routes = new Set(catalog.documents.map((document) => document.route.replace(/\/$/, '') || '/'))
  const pages = listFiles(contentDir).filter((file) => file.endsWith('.json')).sort()
  if (pages.length !== catalog.documents.length) {
    failures.push(`FAIL route-count: content ${pages.length} != contract ${catalog.documents.length}`)
  }

  for (const page of pages) {
    const rel = posixRel(wikiRoot, page)
    const stem = rel.split('/').at(-1).replace(/\.json$/i, '').toLowerCase()
    if (EXCLUDED_STEMS.includes(stem) || stem === 'kenshi' || rel.toLowerCase().includes('/reference/')) {
      failures.push(`FAIL exclusion: ${rel} matches excluded source "${stem}"`)
    }
    const document = JSON.parse(readFileSync(page, 'utf8'))
    if ('body' in document || !Array.isArray(document.blocks) || document.blocks.length === 0 || typeof document.reviewText !== 'string') {
      failures.push(`FAIL unstructured-content: ${rel}`)
      continue
    }
    const values = []
    const links = []
    const visit = (node) => {
      if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') values.push(node.value ?? '')
      if (node.type === 'link') links.push(node.url ?? '')
      for (const child of node.children ?? []) visit(child)
    }
    for (const block of document.blocks) visit(block)
    for (const term of findBannedTerms(visibleText(values.join(' ')))) {
      failures.push(`FAIL banned-term: ${rel} contains "${term}"`)
    }
    for (const href of links) {
      if (!href.startsWith('/') || href.startsWith('//')) continue
      if (HUB_PREFIXES.some((prefix) => href.startsWith(prefix))) continue
      const route = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/'
      if (route.startsWith('/world') && !routes.has(route)) failures.push(`FAIL broken-link: ${rel} -> ${href}`)
    }
  }

  const shell = readFileSync(join(distDir, 'index.html'), 'utf8')
  for (const term of findBannedTerms(visibleText(shell))) failures.push(`FAIL banned-term: dist/index.html contains "${term}"`)
  for (const href of htmlLinks(shell)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    if (HUB_PREFIXES.some((prefix) => href.startsWith(prefix)) || href.startsWith('/wiki/')) continue
    failures.push(`FAIL broken-link: dist/index.html -> ${href}`)
  }

  failures.push(...referenceExclusionFailures(referenceDir))

  console.log(`section-count world: ${pages.length}`)
  console.log(`html-files: ${listFiles(distDir).filter((file) => file.endsWith('.html')).length}`)
  console.log(`banned-term failures: ${failures.filter((line) => line.includes('banned-term')).length}`)
  console.log(`broken-link failures: ${failures.filter((line) => line.includes('broken-link')).length}`)
  console.log(`exclusion failures: ${failures.filter((line) => line.includes('exclusion')).length}`)
  if (failures.length > 0) {
    for (const line of failures) console.error(line)
    console.error(`gate: FAIL (${failures.length})`)
    process.exit(1)
  }
  console.log('gate: PASS')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main()
