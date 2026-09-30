// Public-term gate for the React wiki. VitePress per-page HTML is gone; visible reader text
// is the generated world catalog, and the built site is the SPA shell under dist.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { fromWikiBlocks } from '@seoul-dengoku/document-renderer'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const wikiRoot = join(scriptDir, '..')
const repoRoot = wikiRoot
const distDir = join(wikiRoot, 'dist')
const contentDir = join(wikiRoot, 'src/generated/world')
const englishContentDir = join(wikiRoot, 'src/generated/world-en')
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

export function editorialMarkerFailures(text, source) {
  return ['창작 제안', '(미확인)', '사용자 확정', 'owner-confirmed'].filter((marker) => text.includes(marker))
    .map((marker) => `FAIL editorial-marker: ${source} contains "${marker}"`)
}

export function retiredFormFailures(text, source) {
  return namingLedger.retiredPublicForms
    .filter(({ form, exceptSources = [] }) => !exceptSources.some((pattern) => source.includes(pattern)) && text.includes(form))
    .map(({ form }) => `FAIL retired-form: ${source} contains "${form}"`)
}

export function ravelenExclusionFailures(text, source) {
  return RAVELEN_REFERENCE.test(text) ? [`FAIL exclusion: ${source} contains a Ravelen reference`] : []
}

// A private document stays unpublished in every locale, so any link to it (wiki route, repository
// Markdown path or GitHub blob URL) is a failure.
export function privateLinkFailures(href, source) {
  const path = href.split('#')[0].split('?')[0].replace(/\/$/, '')
  let stem = path.split('/').at(-1) ?? ''
  try { stem = decodeURIComponent(stem) } catch {}
  stem = stem.replace(/\.(?:md|json|html)$/i, '').toLowerCase()
  return EXCLUDED_STEMS.includes(stem) ? [`FAIL private-link: ${source} -> ${href}`] : []
}

export function visibleFieldFailures(text, source, { links = [], retiredSource = source } = {}) {
  if (typeof text !== 'string') throw new Error(`E_VISIBLE_FIELD:${source}`)
  const regionCopy = source.includes('/regions/')
    ? text.replace(/(?:문서고|문서|원본|열람)[^.!?\n]*?복제/gu, (match) => match.replace('복제', '복사'))
    : text
  return [
    ...findBannedTerms(regionCopy).map((term) => `FAIL banned-term: ${source} contains "${term}"`),
    ...coinedPhraseFailures(text, source),
    ...editorialMarkerFailures(text, source),
    ...retiredFormFailures(text, retiredSource).map((failure) => failure.replace(retiredSource, source)),
    ...ravelenExclusionFailures(text, source),
    ...links.flatMap((href) => privateLinkFailures(href, source)),
  ]
}

const textNodes = new Set(['text', 'inlineCode', 'code'])
const containerNodes = new Set(['paragraph', 'heading', 'blockquote', 'list', 'listItem', 'table', 'tableRow', 'tableCell', 'emphasis', 'strong', 'delete', 'link'])
const emptyNodes = new Set(['thematicBreak', 'break', 'html', 'image'])

function articleNodes(document, rel) {
  const values = []
  const links = []
  const visit = (node, path) => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') throw new Error(`E_READER_AST:${rel}:${path}`)
    if (textNodes.has(node.type)) {
      if (typeof node.value !== 'string') throw new Error(`E_READER_AST:${rel}:${path}/value`)
      values.push(node.value)
    } else if (node.type === 'link') {
      if (typeof node.url !== 'string') throw new Error(`E_READER_AST:${rel}:${path}/url`)
      links.push(node.url)
    } else if (node.type === 'image') {
      if (typeof node.url !== 'string') throw new Error(`E_READER_AST:${rel}:${path}/url`)
      if (node.alt != null && typeof node.alt !== 'string') throw new Error(`E_READER_AST:${rel}:${path}/alt`)
      values.push(node.alt ?? node.value ?? '')
    } else if (!containerNodes.has(node.type) && !emptyNodes.has(node.type)) {
      throw new Error(`E_READER_AST:${rel}:${path}/type:${node.type}`)
    }
    if (node.children !== undefined && !Array.isArray(node.children)) throw new Error(`E_READER_AST:${rel}:${path}/children`)
    if (containerNodes.has(node.type) && node.type !== 'link' && !Array.isArray(node.children)) throw new Error(`E_READER_AST:${rel}:${path}/children`)
    node.children?.forEach((child, index) => visit(child, `${path}/children/${index}`))
  }
  document.blocks.forEach((block, index) => { visit(block, `/blocks/${index}`); values.push('\n') })
  return { text: values.join(''), links }
}

const cellText = (node, source) => {
  if (node.type !== 'tableCell') throw new Error(`E_READER_AST:${source}/tableCell`)
  const { text, links } = articleNodes({ blocks: [node] }, source)
  return { text: text.trimEnd(), links }
}

export function tableReviewRows(document, rel) {
  if (!Array.isArray(document.blocks)) throw new Error(`E_READER_AST:${rel}/blocks`)
  const rows = []
  document.blocks.forEach((block, blockIndex) => {
    if (block.type !== 'table') return
    if (!Array.isArray(block.children)) throw new Error(`E_READER_AST:${rel}/blocks/${blockIndex}/children`)
    block.children.forEach((row, rowIndex) => {
      if (row.type !== 'tableRow' || !Array.isArray(row.children)) throw new Error(`E_READER_AST:${rel}/blocks/${blockIndex}/rows/${rowIndex}`)
      row.children.forEach((cell, columnIndex) => {
        const source = `${rel}#/blocks/${blockIndex}/rows/${rowIndex}/cells/${columnIndex}`
        const { text, links } = cellText(cell, source)
        // Candidate for contextual review, not a score or a lexical ban. Proper names can be
        // ambiguous; identity/numeric cells remain present in the output for manual override.
        const kind = /[가-힣].*(?:[.?!;:]|(?:다|요)(?:\s|$)|\s+(?:은|는|이|가|을|를|에|에서|의|와|과)(?:\s|$))/u.test(text)
          || /[A-Za-z][^.!?]{12,}[.!?](?:\s|$)/u.test(text) ? 'prose-candidate' : 'identity-or-numeric'
        rows.push({ source, kind, text, links, sourceHash: createHash('sha256').update(text).digest('hex') })
      })
    })
  })
  return rows
}

export function personVisibleFields(person, rel) {
  if (typeof person.name !== 'string') throw new Error(`E_VISIBLE_FIELD:${rel}#/name`)
  const fields = ['name', 'stateName', 'title', 'position', 'commonTier', 'rank', 'occupation', 'gender', 'stage', 'generation', 'biography']
  const out = fields.flatMap((field) => person[field] == null ? [] : [[`${rel}#/${field}`, person[field]]])
  for (const field of ['fields', 'sections']) {
    if (person[field] == null) continue
    if (typeof person[field] !== 'object' || Array.isArray(person[field])) throw new Error(`E_VISIBLE_FIELD:${rel}#/${field}`)
    for (const [key, value] of Object.entries(person[field])) {
      if (field === 'fields' && ['가치관', '욕망', '직위', '소속'].includes(key)) continue
      if (field === 'sections' && !['생애', '관직', '무공', '일화', '가문', '관계', '야망', '공포', '개입'].includes(key)) continue
      if (field === 'fields') out.push([`${rel}#/fields/${key}/label`, key])
      out.push([`${rel}#/${field}/${key}`, value])
    }
  }
  if (person.clan) out.push([`${rel}#/clan/name`, person.clan.name])
  for (const direction of ['outgoing', 'incoming']) {
    person.relations?.[direction]?.forEach((relation, index) => {
      for (const key of ['from', 'to', 'type', 'basis']) out.push([`${rel}#/relations/${direction}/${index}/${key}`, relation[key]])
    })
  }
  for (const key of ['지향', '결합']) if (person.desire?.[key]) out.push([`${rel}#/desire/${key}`, person.desire[key]])
  return out
}

export function apiVisibleFields(person, rel) {
  const out = [['unit/type', person.unit?.type], ['unit/quality', person.unit?.type ? person.unit?.quality : null], ['unit/note', person.unit?.type ? person.unit?.note : null], ['territory/fief_name', person.territory?.fief_name], ['territory/type', person.territory?.type], ['territory/settlement/name', person.territory?.settlement?.name], ['wandering_force/type', person.wandering_force?.type], ['wandering_force/current_location', person.wandering_force?.current_location], ['wandering_force/camp/name', person.wandering_force?.camp?.name]]
  for (const group of ['advantages', 'disadvantages']) person[group]?.forEach((item, index) => {
    out.push([`${group}/${index}/name`, item.name], [`${group}/${index}/effect`, item.effect])
  })
  person.skills?.forEach((skill, index) => out.push([`skills/${index}/${skill.ko ? 'ko' : 'name'}`, skill.ko || skill.name]))
  return out.filter(([, value]) => value != null).map(([path, value]) => [`${rel}#/${path}`, value])
}

export function apiDeclaredFields(person, rel) {
  // GET serializes the whole record, but only these fields are declared UI copy.
  // Raw evidence quotes and private statuses are not treated as reader prose.
  return apiVisibleFields(person, rel)
}

export function uiTooltipFields(source) {
  const fileName = 'PersonDetailPage.tsx'
  const registry = ['attrExplain', 'skillExplain', 'valueMeta', 'desireMeta']
  // 심볼 규명으로 참조→선언 묶음(스코프 반영). 같은 이름의 무관 지역 선언이 실제 소비 맵을 덮어쓰지 않게 한다.
  const host = {
    getSourceFile: (name) => name === fileName ? ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) : undefined,
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    fileExists: (name) => name === fileName,
    readFile: (name) => name === fileName ? source : undefined,
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => true,
    getCanonicalFileName: (name) => name,
    getNewLine: () => '\n',
  }
  const program = ts.createProgram([fileName], { noResolve: true }, host)
  const checker = program.getTypeChecker()
  const file = program.getSourceFile(fileName)
  const declarations = []
  const declarationNames = new Set()
  const valueRefs = []
  const isNamePosition = (node) => {
    const parent = node.parent
    if (!parent) return false
    if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent) || ts.isEnumMember(parent) || ts.isMethodDeclaration(parent) || ts.isMethodSignature(parent) || ts.isPropertyDeclaration(parent)) && parent.name === node) return true
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true
    if ((ts.isVariableDeclaration(parent) || ts.isParameter(parent)) && parent.name === node) return true
    return false
  }
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && registry.includes(node.name.text)) {
      declarations.push(node)
      declarationNames.add(node.name)
    } else if (ts.isIdentifier(node) && registry.includes(node.text) && !declarationNames.has(node) && !isNamePosition(node)) {
      valueRefs.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  const bound = []
  const boundSet = new Set()
  for (const ref of valueRefs) {
    // 값 위치 참조는 checker로 수집된 레지스트리 선언에 실제로 규명되어야 한다. 미해결 참조는
    // 다른 스코프에 같은 철자 선언이 있어도 결격이고, 파일 전역 이름 존재로 넘기지 않는다.
    const decl = checker.getSymbolAtLocation(ref)?.valueDeclaration
    if (!declarations.includes(decl)) throw new Error(`E_UI_TOOLTIP_FIELDS:${ref.text}`)
    if (boundSet.has(decl)) continue
    boundSet.add(decl)
    bound.push(decl)
  }
  const fields = []
  // 검사 대상은 실제 참조가 묶인 선언뿐이다. 소비되지 않은 선언(무관 그림자 포함)은 공개 표면이 아니다.
  for (const decl of bound) {
    const name = decl.name.text
    const map = decl.initializer
    if (!map || !ts.isObjectLiteralExpression(map) || !map.properties.length) throw new Error(`E_UI_TOOLTIP_FIELDS:${name}`)
    for (const [index, entry] of map.properties.entries()) {
      if (!ts.isPropertyAssignment(entry)) throw new Error(`E_UI_TOOLTIP_FIELDS:${name}/${index}`)
      if (name === 'skillExplain') {
        if (!ts.isStringLiteralLike(entry.initializer)) throw new Error(`E_UI_TOOLTIP_FIELDS:${name}/${index}`)
        fields.push([`src/pages/PersonDetailPage.tsx#/tooltips/${name}/${index}`, entry.initializer.text])
        continue
      }
      if (!ts.isObjectLiteralExpression(entry.initializer)) throw new Error(`E_UI_TOOLTIP_FIELDS:${name}/${index}`)
      const expected = name === 'attrExplain' ? ['desc'] : ['plus', 'minus']
      for (const key of expected) {
        const prop = entry.initializer.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(file) === key)
        if (!prop || !ts.isStringLiteralLike(prop.initializer)) throw new Error(`E_UI_TOOLTIP_FIELDS:${name}/${index}/${key}`)
        fields.push([`src/pages/PersonDetailPage.tsx#/tooltips/${name}/${index}/${key}`, prop.initializer.text])
      }
    }
  }
  return fields
}

export function generatedArray(source, name, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const statement = ast.statements.find((entry) => ts.isVariableStatement(entry) && entry.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && decl.name.text === name))
  const declaration = statement?.declarationList.declarations.find((entry) => ts.isIdentifier(entry.name) && entry.name.text === name)
  if (!declaration || !declaration.initializer) throw new Error(`E_GENERATED_ARRAY:${file}:${name}`)
  let value = declaration.initializer
  if (ts.isAsExpression(value)) value = value.expression
  if (!ts.isArrayLiteralExpression(value)) throw new Error(`E_GENERATED_ARRAY:${file}:${name}`)
  return JSON.parse(value.getText(ast))
}

const readGeneratedArray = (file, name) => generatedArray(readFileSync(join(wikiRoot, file), 'utf8'), name, file)

// Checks one generated article (either locale) against the published route set.
export function pageFailures(document, rel, routes) {
  const failures = []
  const stem = rel.split('/').at(-1).replace(/\.json$/i, '').toLowerCase()
  if (EXCLUDED_STEMS.includes(stem) || stem === 'kenshi' || rel.toLowerCase().includes('/reference/')) {
    failures.push(`FAIL exclusion: ${rel} matches excluded source "${stem}"`)
  }
  if ('body' in document || !Array.isArray(document.blocks) || document.blocks.length === 0 || typeof document.reviewText !== 'string') {
    failures.push(`FAIL unstructured-content: ${rel}`)
    return failures
  }
  if (typeof document.title !== 'string') throw new Error(`E_VISIBLE_FIELD:${rel}#/title`)
  try { fromWikiBlocks(document.blocks) } catch (error) { throw new Error(`E_READER_AST:${rel}:${error.message}`) }
  const { text, links } = articleNodes(document, rel)
  failures.push(...visibleFieldFailures(`${document.title}\n${text}`, rel, { links }))
  for (const href of links) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    if (HUB_PREFIXES.some((prefix) => href.startsWith(prefix))) continue
    const route = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/'
    if (/^\/(?:en\/)?world(?:\/|$)/.test(route) && !routes.has(route)) failures.push(`FAIL broken-link: ${rel} -> ${href}`)
  }
  return failures
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
  const englishDocuments = catalog.englishDocuments ?? []
  const routes = new Set([...catalog.documents, ...englishDocuments].map((document) => document.route.replace(/\/$/, '') || '/'))
  const pages = listFiles(contentDir).filter((file) => file.endsWith('.json')).sort()
  if (pages.length !== catalog.documents.length) {
    failures.push(`FAIL route-count: content ${pages.length} != contract ${catalog.documents.length}`)
  }
  const englishPages = listFiles(englishContentDir).filter((file) => file.endsWith('.json')).sort()
  if (englishPages.length !== englishDocuments.length) {
    failures.push(`FAIL route-count: en content ${englishPages.length} != contract ${englishDocuments.length}`)
  }

  for (const page of [...pages, ...englishPages]) {
    failures.push(...pageFailures(JSON.parse(readFileSync(page, 'utf8')), posixRel(wikiRoot, page), routes))
  }

  if (process.argv[2] === '--review-tables') {
    if (!process.argv[3]) throw new Error('E_REVIEW_OUTPUT_PATH')
    const rows = [...pages, ...englishPages].flatMap((page) => tableReviewRows(JSON.parse(readFileSync(page, 'utf8')), posixRel(wikiRoot, page)))
    writeFileSync(process.argv[3], `${JSON.stringify({ schema: 'wiki.table-review.v1', reviewStatus: 'unreviewed', rows }, null, 2)}\n`)
    console.log(`table-review cells: ${rows.length}; prose candidates: ${rows.filter((row) => row.kind === 'prose-candidate').length}`)
  }

  const shell = readFileSync(join(distDir, 'index.html'), 'utf8')
  failures.push(...ravelenExclusionFailures(shell, 'dist/index.html'))
  for (const term of findBannedTerms(visibleText(shell))) failures.push(`FAIL banned-term: dist/index.html contains "${term}"`)
  for (const term of findBannedTerms(htmlMetadata(shell))) failures.push(`FAIL banned-term: dist/index.html metadata contains "${term}"`)
  failures.push(...coinedPhraseFailures(htmlMetadata(shell), 'dist/index.html metadata'))
  failures.push(...editorialMarkerFailures(htmlMetadata(shell), 'dist/index.html metadata'))
  failures.push(...retiredFormFailures(htmlMetadata(shell), 'dist/index.html metadata'))
  failures.push(...coinedPhraseFailures(visibleText(shell), 'dist/index.html'))
  failures.push(...editorialMarkerFailures(visibleText(shell), 'dist/index.html'))
  failures.push(...retiredFormFailures(visibleText(shell), 'dist/index.html'))
  const historicalForm = '급수계약정'
  const historicalPage = JSON.parse(readFileSync(join(contentDir, 'Sixteen-States.json'), 'utf8'))
  const historicalPageCount = (JSON.stringify(historicalPage.blocks).match(/급수계약정/gu) ?? []).length
  const historicalOriginCount = (readFileSync(join(wikiRoot, 'src/generated/stateCatalog.ts'), 'utf8').match(/"origin": "급수계약정"/gu) ?? []).length
  if (historicalPageCount !== 0 || historicalOriginCount !== 1) failures.push('FAIL retired-form: historical origin baseline changed')
  let historicalBundleCount = 0
  for (const file of listFiles(join(distDir, 'assets')).filter((file) => file.endsWith('.js'))) {
    const source = readFileSync(file, 'utf8')
    const rel = posixRel(wikiRoot, file)
    failures.push(...coinedPhraseFailures(source, rel))
    historicalBundleCount += (source.match(/급수계약정/gu) ?? []).length
    failures.push(...retiredFormFailures(source.replaceAll(historicalForm, ''), rel))
    failures.push(...ravelenExclusionFailures(source, rel))
  }
  if (historicalBundleCount !== historicalPageCount * 2 + historicalOriginCount) failures.push(`FAIL retired-form: dist/assets/ contains ${historicalBundleCount} historical-origin forms; expected ${historicalPageCount * 2 + historicalOriginCount}`)
  for (const file of listFiles(join(wikiRoot, 'public')).filter((file) => file.endsWith('.json'))) {
    const rel = posixRel(wikiRoot, file)
    if (rel.startsWith('public/person-details/')) {
      const person = JSON.parse(readFileSync(file, 'utf8'))
      for (const [field, value] of personVisibleFields(person, rel)) failures.push(...visibleFieldFailures(value, field, { links: markdownLinks(value) }))
    }
  }
  const people = readGeneratedArray('src/generated/peopleCatalog.ts', 'peopleCatalog')
  const publicPeople = listFiles(join(wikiRoot, 'public/person-details')).filter((file) => file.endsWith('.json'))
  if (people.length !== publicPeople.length) throw new Error(`E_PERSON_CONSUMER:${people.length}:${publicPeople.length}`)
  for (const [index, person] of people.entries()) {
    if (typeof person.id !== 'string' || typeof person.name !== 'string') throw new Error(`E_PERSON_CONSUMER:/people/${index}`)
    for (const field of ['name', 'title', 'position', 'rank', 'occupation', 'gender', 'stateName', 'stage']) failures.push(...visibleFieldFailures(person[field], `src/generated/peopleCatalog.ts#/people/${index}/${field}`))
  }
  const categoryRegistry = JSON.parse(readFileSync(join(wikiRoot, 'scripts/category-registry.json'), 'utf8'))
  const categorySource = readFileSync(join(wikiRoot, 'src/generated/categoryIndex.ts'), 'utf8')
  const categoryAst = ts.createSourceFile('categoryIndex.ts', categorySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const categoryDeclaration = categoryAst.statements.filter(ts.isVariableStatement).flatMap((entry) => [...entry.declarationList.declarations])
    .find((entry) => ts.isIdentifier(entry.name) && entry.name.text === 'categoryIndex')
  if (!categoryDeclaration?.initializer || !ts.isSatisfiesExpression(categoryDeclaration.initializer) || !ts.isAsExpression(categoryDeclaration.initializer.expression) || !ts.isObjectLiteralExpression(categoryDeclaration.initializer.expression.expression)) throw new Error('E_CATEGORY_CONSUMER')
  const categoryIndex = JSON.parse(categoryDeclaration.initializer.expression.expression.getText(categoryAst))
  if (!categoryIndex || categoryIndex.categories.length !== categoryRegistry.categories.length) throw new Error('E_CATEGORY_CONSUMER')
  for (const [index, category] of categoryRegistry.categories.entries()) {
    const consumed = categoryIndex.categories[index]
    if (category.id !== consumed?.id || category.label !== consumed.label || category.summary !== consumed.summary) throw new Error(`E_CATEGORY_CONSUMER:/categories/${index}`)
    for (const field of ['label', 'summary']) failures.push(...visibleFieldFailures(consumed[field], `src/generated/categoryIndex.ts#/categories/${index}/${field}`))
  }
  const history = JSON.parse(readFileSync(join(wikiRoot, 'data/update-history.json'), 'utf8'))
  history.updates.forEach((update, index) => {
    for (const field of ['title', 'category', 'status', 'source']) failures.push(...visibleFieldFailures(update[field], `data/update-history.json#/updates/${index}/${field}`))
  })
  for (const [index, state] of readGeneratedArray('src/generated/stateCatalog.ts', 'stateCatalog').entries()) {
    for (const field of ['name', 'origin', 'government', 'power', 'cause', 'ruler', 'capital', 'capitalName']) {
      const path = `src/generated/stateCatalog.ts#/states/${index}/${field}`
      failures.push(...visibleFieldFailures(state[field], path, { retiredSource: field === 'origin' && state.id === 'S01' ? 'Sixteen-States.json' : path }))
    }
  }
  for (const [index, family] of readGeneratedArray('src/generated/clanFamilyCatalog.ts', 'clanFamilyCatalog').entries()) {
    for (const field of ['bongwan', 'surname', 'hanja']) if (family[field] != null) failures.push(...visibleFieldFailures(family[field], `src/generated/clanFamilyCatalog.ts#/families/${index}/${field}`))
    family.branches.forEach((branch, branchIndex) => failures.push(...visibleFieldFailures(branch.name, `src/generated/clanFamilyCatalog.ts#/families/${index}/branches/${branchIndex}/name`)))
    family.members.forEach((member, memberIndex) => {
      for (const field of ['name', 'stateName', 'occupation']) failures.push(...visibleFieldFailures(member[field], `src/generated/clanFamilyCatalog.ts#/families/${index}/members/${memberIndex}/${field}`))
    })
  }
  const territories = JSON.parse(readFileSync(join(wikiRoot, 'public/opening-territories.json'), 'utf8'))
  for (const [index, state] of territories.states.entries()) {
    for (const field of ['name', 'origin', 'government', 'power', 'cause', 'ruler', 'founded', 'relation', 'religion', 'foreignRelations', 'vassals']) if (state[field] != null) {
      const path = `public/opening-territories.json#/states/${index}/${field}`
      failures.push(...visibleFieldFailures(state[field], path, { retiredSource: field === 'origin' && state.id === 'S01' ? 'Sixteen-States.json' : path }))
    }
    state.chronology.forEach((event, eventIndex) => failures.push(...visibleFieldFailures(event.text, `public/opening-territories.json#/states/${index}/chronology/${eventIndex}/text`)))
  }
  territories.vassals.forEach((vassal, index) => {
    for (const field of ['name', 'city', 'founded', 'duty', 'anchor', 'coordinateSource']) failures.push(...visibleFieldFailures(vassal[field], `public/opening-territories.json#/vassals/${index}/${field}`))
  })
  for (const [index, region] of territories.regions.entries()) {
    for (const field of ['name', 'district', 'openingState', 'summary']) failures.push(...visibleFieldFailures(region[field], `public/opening-territories.json#/regions/${index}/${field}`))
  }
  for (const [index, station] of territories.stations.entries()) {
    for (const field of ['name', 'district']) failures.push(...visibleFieldFailures(station[field], `public/opening-territories.json#/stations/${index}/${field}`))
    station.control.polityNames.forEach((name, polityIndex) => failures.push(...visibleFieldFailures(name, `public/opening-territories.json#/stations/${index}/control/polityNames/${polityIndex}`)))
    for (const key of ['state', 'regionalAuthority', 'stationManager']) if (station.control.hierarchy[key] != null) failures.push(...visibleFieldFailures(station.control.hierarchy[key], `public/opening-territories.json#/stations/${index}/control/hierarchy/${key}`))
    station.control.memberSurfaces?.forEach((member, memberIndex) => {
      if (member.surfaceRegionName != null) failures.push(...visibleFieldFailures(member.surfaceRegionName, `public/opening-territories.json#/stations/${index}/control/memberSurfaces/${memberIndex}/surfaceRegionName`))
    })
  }
  territories.landmarks.forEach((landmark, index) => {
    for (const field of ['name', 'role', 'detail']) failures.push(...visibleFieldFailures(landmark[field], `public/opening-territories.json#/landmarks/${index}/${field}`))
  })
  const timeline = JSON.parse(readFileSync(join(wikiRoot, 'public/timeline-overview.json'), 'utf8'))
  timeline.years.forEach((year, index) => {
    if (year.pressure) for (const field of ['summary', 'pressure', 'decision', 'immediate', 'aftermath']) failures.push(...visibleFieldFailures(year[field], `public/timeline-overview.json#/years/${index}/${field}`))
    year.regionalEvents?.forEach((event, eventIndex) => {
      for (const field of ['title', 'prose']) failures.push(...visibleFieldFailures(event[field], `public/timeline-overview.json#/years/${index}/regionalEvents/${eventIndex}/${field}`))
    })
    year.relatedDocuments.forEach((document, documentIndex) => failures.push(...visibleFieldFailures(document.title, `public/timeline-overview.json#/years/${index}/relatedDocuments/${documentIndex}/title`)))
  })
  const gurps = JSON.parse(readFileSync(join(wikiRoot, 'lore/name-pools/gurps-cast.json'), 'utf8'))
  for (const person of gurps.people) {
    // API source coverage is kept separately from article reviewText receipts.
    for (const [field, value] of apiDeclaredFields(person, `api/characters/${person.url?.split('/').at(-1) ?? person.id}`)) failures.push(...visibleFieldFailures(value, field))
  }
  for (const [field, value] of uiTooltipFields(readFileSync(join(wikiRoot, 'src/pages/PersonDetailPage.tsx'), 'utf8'))) failures.push(...visibleFieldFailures(value, field))
  for (const href of htmlLinks(shell)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    if (HUB_PREFIXES.some((prefix) => href.startsWith(prefix)) || href.startsWith('/wiki/')) continue
    failures.push(`FAIL broken-link: dist/index.html -> ${href}`)
  }

  failures.push(...referenceExclusionFailures(referenceDir))

  console.log(`section-count world: ${pages.length}`)
  console.log(`section-count world-en: ${englishPages.length}`)
  console.log(`private-link failures: ${failures.filter((line) => line.includes('private-link')).length}`)
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
