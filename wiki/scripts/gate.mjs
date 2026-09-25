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
const COINED_PHRASES = ['창세 구술', '창세 이야기', '구술로만', '창세의 첫 줄', '창세의 첫 급수협약', '창세는 햇수 없는 구술']
const namingLedger = JSON.parse(readFileSync(join(repoRoot, 'lore/editorial/Naming-Ledger.json'), 'utf8'))
// Korean attaches particles (라벨렌의, 라벨렌을), so the Hangul form matches without a trailing boundary.
const RAVELEN_REFERENCE = /(?<![\p{L}\p{N}_])ravelen(?![\p{L}\p{N}_])|라벨렌/iu
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

export function htmlMetadata(html) {
  return [...html.matchAll(/<meta\b[^>]*\b(?:content|value)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map((match) => match[1] ?? match[2] ?? '').join(' ')
}

export function findBannedTerms(text) {
  const lower = text.toLowerCase()
  return BANNED_TERMS.filter((term) => lower.includes(term.toLowerCase()))
}

export function coinedPhraseFailures(text, source) {
  return COINED_PHRASES.filter((phrase) => text.includes(phrase))
    .map((phrase) => `FAIL coined-phrase: ${source} contains "${phrase}"`)
}

export function retiredFormFailures(text, source) {
  return namingLedger.retiredPublicForms
    .filter(({ form, exceptSources = [] }) => !exceptSources.some((pattern) => source.includes(pattern)) && text.includes(form))
    .map(({ form }) => `FAIL retired-form: ${source} contains "${form}"`)
}

export function ravelenExclusionFailures(text, source) {
  return RAVELEN_REFERENCE.test(text) ? [`FAIL exclusion: ${source} contains a Ravelen reference`] : []
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
    const pageSource = readFileSync(page, 'utf8')
    const document = JSON.parse(pageSource)
    failures.push(...ravelenExclusionFailures(JSON.stringify(document), rel))
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
    for (const term of findBannedTerms(visibleText(`${document.title} ${values.join(' ')}`))) {
      failures.push(`FAIL banned-term: ${rel} contains "${term}"`)
    }
    failures.push(...coinedPhraseFailures(visibleText(`${document.title} ${document.reviewText}`), rel))
    failures.push(...retiredFormFailures(visibleText(`${document.title} ${document.reviewText}`), rel))
    for (const href of links) {
      if (!href.startsWith('/') || href.startsWith('//')) continue
      if (HUB_PREFIXES.some((prefix) => href.startsWith(prefix))) continue
      const route = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/'
      if (route.startsWith('/world') && !routes.has(route)) failures.push(`FAIL broken-link: ${rel} -> ${href}`)
    }
  }

  const shell = readFileSync(join(distDir, 'index.html'), 'utf8')
  failures.push(...ravelenExclusionFailures(shell, 'dist/index.html'))
  for (const term of findBannedTerms(visibleText(shell))) failures.push(`FAIL banned-term: dist/index.html contains "${term}"`)
  for (const term of findBannedTerms(htmlMetadata(shell))) failures.push(`FAIL banned-term: dist/index.html metadata contains "${term}"`)
  failures.push(...coinedPhraseFailures(htmlMetadata(shell), 'dist/index.html metadata'))
  failures.push(...retiredFormFailures(htmlMetadata(shell), 'dist/index.html metadata'))
  failures.push(...coinedPhraseFailures(visibleText(shell), 'dist/index.html'))
  failures.push(...retiredFormFailures(visibleText(shell), 'dist/index.html'))
  for (const file of listFiles(join(distDir, 'assets')).filter((file) => file.endsWith('.js'))) {
    const source = readFileSync(file, 'utf8')
    const rel = posixRel(wikiRoot, file)
    failures.push(...coinedPhraseFailures(source, rel))
    failures.push(...retiredFormFailures(source, rel))
    failures.push(...ravelenExclusionFailures(source, rel))
  }
  for (const file of listFiles(join(wikiRoot, 'public')).filter((file) => file.endsWith('.json'))) {
    const source = readFileSync(file, 'utf8')
    const rel = posixRel(wikiRoot, file)
    failures.push(...ravelenExclusionFailures(JSON.stringify(JSON.parse(source)), rel))
    if (rel.startsWith('public/person-details/')) {
      const person = JSON.parse(source)
      const visible = JSON.stringify([person.name, person.title, person.position, person.occupation, person.sections, person.biography, person.fields])
      for (const term of findBannedTerms(visible)) failures.push(`FAIL banned-term: ${rel} contains "${term}"`)
      failures.push(...coinedPhraseFailures(visible, rel))
      failures.push(...retiredFormFailures(visible, rel))
    }
  }
  for (const href of htmlLinks(shell)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    if (HUB_PREFIXES.some((prefix) => href.startsWith(prefix)) || href.startsWith('/wiki/')) continue
    failures.push(`FAIL broken-link: dist/index.html -> ${href}`)
  }

  failures.push(...referenceExclusionFailures(referenceDir))

  console.log(`section-count world: ${pages.length}`)
  console.log(`html-files: ${listFiles(distDir).filter((file) => file.endsWith('.html')).length}`)
  console.log(`banned-term failures: ${failures.filter((line) => line.includes('banned-term')).length}`)
  console.log(`coined-phrase failures: ${failures.filter((line) => line.includes('coined-phrase')).length}`)
  console.log(`retired-form failures: ${failures.filter((line) => line.includes('retired-form')).length}`)
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
