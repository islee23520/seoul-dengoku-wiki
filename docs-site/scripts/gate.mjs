import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsSiteRoot = join(scriptDir, '..')
const repoRoot = join(docsSiteRoot, '..')
const distDir = join(docsSiteRoot, 'dist')
const referenceDir = join(repoRoot, 'docs', 'game-logic', 'reference')

const BANNED_TERMS = ['Kenshi', 'Underrail', 'Gunner', 'clone', '복제']
const EXPECTED_REFERENCE_EXCLUSIONS = 18
const EXCLUDED_NAMES = ['_Sidebar.md', '_TEMPLATE.md']
const SECTIONS = ['design', 'world', 'rules']

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

function listHtml(dir) {
  return listFiles(dir).filter((file) => file.endsWith('.html')).sort()
}

function posixRel(from, file) {
  return relative(from, file).split(sep).join('/')
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function visibleText(html) {
  let text = html
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<!--[\s\S]*?-->/g, ' ')
  text = text.replace(/<a\b[^>]*>/gi, (tag) =>
    tag.replace(/\shref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  )
  text = text.replace(/<img\b[^>]*>/gi, (tag) =>
    tag.replace(/\ssrc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  )
  text = text.replace(/<[^>]+>/g, ' ')
  return text
}

function findBannedTerms(text) {
  const lower = text.toLowerCase()
  return BANNED_TERMS.filter((term) => lower.includes(term.toLowerCase()))
}

function collectAHrefs(html) {
  const hrefs = []
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
  let match
  while ((match = re.exec(html))) {
    hrefs.push(match[1] ?? match[2] ?? match[3] ?? '')
  }
  return hrefs
}

function resolveInternalHref(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return null
  const pathPart = href.split('#')[0].split('?')[0]
  if (!pathPart.startsWith('/') || pathPart.startsWith('//')) return null
  let decoded
  try {
    decoded = decodeURIComponent(pathPart)
  } catch {
    decoded = pathPart
  }
  const relPath = decoded.replace(/^\//, '')
  const abs = join(distDir, relPath)
  if (isFile(abs)) return abs
  if (decoded.endsWith('/')) {
    const indexed = join(abs, 'index.html')
    return isFile(indexed) ? indexed : null
  }
  if (isFile(`${abs}.html`)) return `${abs}.html`
  const indexed = join(abs, 'index.html')
  return isFile(indexed) ? indexed : null
}

function excludedStems() {
  const stems = new Set(
    EXCLUDED_NAMES.map((name) => name.replace(/\.md$/i, '').toLowerCase())
  )
  const referenceFiles = existsSync(referenceDir)
    ? readdirSync(referenceDir).filter((name) => {
        const full = join(referenceDir, name)
        return name.endsWith('.md') && statSync(full).isFile()
      })
    : []
  for (const name of referenceFiles) {
    stems.add(name.replace(/\.md$/i, '').toLowerCase())
  }
  return { stems, referenceFiles }
}

function main() {
  const failures = []

  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    console.error(`FAIL dist-missing: ${posixRel(docsSiteRoot, distDir)}`)
    process.exit(1)
  }

  const htmlFiles = listHtml(distDir)
  const sectionCounts = {}
  for (const section of SECTIONS) {
    sectionCounts[section] = listHtml(join(distDir, section)).length
  }

  for (const file of htmlFiles) {
    const rel = posixRel(docsSiteRoot, file)
    const html = readFileSync(file, 'utf8')
    const found = findBannedTerms(visibleText(html))
    for (const term of found) {
      failures.push(`FAIL banned-term: ${rel} contains "${term}"`)
    }
    for (const href of collectAHrefs(html)) {
      if (!href.startsWith('/') || href.startsWith('//')) continue
      if (resolveInternalHref(href) === null) {
        failures.push(`FAIL broken-link: ${rel} -> ${href}`)
      }
    }
  }

  const { stems, referenceFiles } = excludedStems()
  if (!existsSync(referenceDir)) {
    failures.push('FAIL exclusion: docs/game-logic/reference/ is missing')
  } else if (referenceFiles.length !== EXPECTED_REFERENCE_EXCLUSIONS) {
    failures.push(
      `FAIL exclusion: expected ${EXPECTED_REFERENCE_EXCLUSIONS} reference/*.md files, found ${referenceFiles.length}`
    )
  }

  for (const file of htmlFiles) {
    const rel = posixRel(docsSiteRoot, file)
    const distRel = posixRel(distDir, file)
    const parts = distRel.toLowerCase().split('/')
    if (parts.includes('reference')) {
      failures.push(`FAIL exclusion: ${rel} looks like excluded reference content`)
      continue
    }
    const stem = parts[parts.length - 1].replace(/\.html$/i, '')
    if (stems.has(stem)) {
      failures.push(`FAIL exclusion: ${rel} matches excluded source "${stem}"`)
    }
  }

  const kenshiPage = htmlFiles.find((file) => {
    const distRel = posixRel(distDir, file).toLowerCase()
    return (
      distRel === 'kenshi.html' ||
      distRel.endsWith('/kenshi.html') ||
      distRel.includes('/reference/')
    )
  })
  if (kenshiPage) {
    failures.push(
      `FAIL exclusion: reference/kenshi content page present as ${posixRel(docsSiteRoot, kenshiPage)}`
    )
  }

  for (const section of SECTIONS) {
    console.log(`section-count ${section}: ${sectionCounts[section]}`)
  }
  console.log(`html-files: ${htmlFiles.length}`)
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

main()
