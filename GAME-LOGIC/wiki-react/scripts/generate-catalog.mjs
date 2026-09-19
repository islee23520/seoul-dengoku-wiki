import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(projectRoot, '../..')
const contentRoot = resolve(projectRoot, 'src/content')
const generatedRoot = resolve(projectRoot, 'src/generated')
const publicRoot = resolve(projectRoot, 'public')
const domains = ['world', 'rules', 'design']
const wikiAssetSource = resolve(repoRoot, 'GAME-REFERENCE/assets/wiki')
const wikiAssetTarget = resolve(publicRoot, 'wiki-assets')

const normalizeTitle = (markdown, fallback) =>
  markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+\{#[^}]+\}\s*$/, '').trim() ?? fallback

const githubBlob = 'https://github.com/islee23520/seoul-kenshi/blob/main/'

const rewriteRelativeHref = (href, domain, routeBySlug) => {
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return href

  const [path, hash = ''] = href.split('#', 2)
  const slug = basename(path, extname(path))
  const documentRoute = routeBySlug.get(`${domain}:${slug}`) ?? routeBySlug.get(`any:${slug}`)
  if (documentRoute) return `${documentRoute}${hash ? `#${hash}` : ''}`

  if (path.includes('regions/')) return '/system-design/regions/'
  if (path.includes('GAME-REFERENCE/ui-layout-moodboard')) return '/ui-layout-moodboard/'
  if (path.includes('GAME-REFERENCE/ui-ux-refs')) return '/ui-ux-refs/'
  if (path.includes('.omo/decisions/issue-101')) return '/ui-ux-refs/'
  if (path.includes('name-pools/')) return `${githubBlob}LORE/name-pools/${basename(path)}`
  if (path.includes('GDD/proposals/')) return `${githubBlob}GDD/proposals/${basename(path)}`
  if (path.includes('CONTRIBUTING.md')) return `${githubBlob}CONTRIBUTING.md`
  return `${githubBlob}${path.replace(/^\.\.\//g, '')}`
}

const localizeImageHref = (href) => {
  const githubPrefix = 'https://github.com/islee23520/seoul-kenshi/blob/main/GAME-REFERENCE/assets/wiki/'
  if (!href.startsWith(githubPrefix)) return href
  return `/wiki/wiki-assets/${basename(href.split('?')[0])}`
}

const normalizeMarkdown = (markdown, domain, routeBySlug) => markdown
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^#\s+.+\n+/, '')
  .replace(/<InfoBox[\s\S]*?<\/InfoBox>/g, '')
  .replace(/<NavBox[\s\S]*?<\/NavBox>/g, '')
  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, href) => `![${alt}](${localizeImageHref(href)})`)
  .replace(/\]\(([^)]+)\)/g, (full, href) => `](${rewriteRelativeHref(href, domain, routeBySlug)})`)

await rm(contentRoot, { recursive: true, force: true })
await mkdir(contentRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })
await rm(wikiAssetTarget, { recursive: true, force: true })
await cp(wikiAssetSource, wikiAssetTarget, { recursive: true })

const documents = []
for (const domain of domains) {
  const sourceDir = resolve(repoRoot, 'GAME-LOGIC/site', domain)
  const names = (await readdir(sourceDir)).filter((name) => extname(name) === '.md').sort()
  for (const name of names) {
    const slug = basename(name, '.md')
    const markdown = await readFile(resolve(sourceDir, name), 'utf8')
    documents.push({
      domain,
      slug,
      route: `/${domain}/${slug === 'index' ? '' : slug}`,
      title: normalizeTitle(markdown, slug),
      markdown,
      name,
    })
  }
}

const routeBySlug = new Map()
for (const document of documents) {
  routeBySlug.set(`${document.domain}:${document.slug}`, document.route)
  if (!routeBySlug.has(`any:${document.slug}`)) routeBySlug.set(`any:${document.slug}`, document.route)
}

for (const document of documents) {
  const targetDir = resolve(contentRoot, document.domain)
  await mkdir(targetDir, { recursive: true })
  await writeFile(resolve(targetDir, document.name), normalizeMarkdown(document.markdown, document.domain, routeBySlug))
}

const lines = [
  'export type WikiDomain = \'world\' | \'rules\' | \'design\'',
  '',
  'export type WikiDocument = {',
  '  readonly domain: WikiDomain',
  '  readonly slug: string',
  '  readonly route: string',
  '  readonly title: string',
  '}',
  '',
  'export const wikiCatalog = [',
  ...documents.map((document) => `  { domain: '${document.domain}', slug: '${document.slug}', route: '${document.route}', title: ${JSON.stringify(document.title)} },`),
  '] as const satisfies readonly WikiDocument[]',
  '',
  `export const wikiDocumentCount = ${documents.length}`,
  '',
]

await writeFile(resolve(generatedRoot, 'wikiCatalog.ts'), `${lines.join('\n')}\n`)
await writeFile(resolve(publicRoot, 'wiki-contract.json'), `${JSON.stringify({ documents: documents.map(({ domain, slug, route, title }) => ({ domain, slug, route, title })) }, null, 2)}\n`)

const stateSource = await readFile(resolve(repoRoot, 'LORE/factions/Sixteen-States.md'), 'utf8')
const stateTable = stateSource.match(/\| 국명 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
const stateRows = [...stateTable.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => match.slice(1).map((cell) => cell.trim()))
  .filter(([name]) => name !== '국명' && !name.startsWith('---'))
const rulerByState = new Map([
  ['대한민국정부', '윤서린'], ['전국경제인연합회', '최지우'], ['삼성그룹', '이홍원'], ['현대자동차주식회사', '정호준'],
  ['대한예수교장로회', '오경재'], ['천주교 서울대교구', '남윤경'], ['대한불교조계종', '백온'], ['원불교', '오해린'],
  ['전국민주노동조합총연맹', '정유라'], ['급수계약정', '한재목'], ['규격동맹', '강민서'], ['선로후계정', '박태겸'],
  ['호위보호정', '배우진'], ['관문군정', '고서준'], ['중립호송시', '장세화'], ['의약중립맹', '류은비'],
])
const stateSlug = (index) => `s${String(index + 1).padStart(2, '0')}`
const stateCatalog = stateRows.map(([name, origin, government, power, cause], index) => ({
  slug: stateSlug(index), name, origin, government, power, cause, ruler: rulerByState.get(name) ?? '',
}))
await writeFile(resolve(generatedRoot, 'stateCatalog.ts'), `export const stateCatalog = ${JSON.stringify(stateCatalog, null, 2)} as const\n`)

const peopleSource = JSON.parse(await readFile(resolve(repoRoot, 'LORE/name-pools/values-cast.json'), 'utf8')).people
const stateFileByName = new Map()
for (let index = 1; index <= 16; index += 1) {
  const file = `Cast-State-${String(index).padStart(2, '0')}.md`
  const text = await readFile(resolve(repoRoot, 'LORE/characters', file), 'utf8')
  for (const match of text.matchAll(/^### 인물 (.+)$/gm)) stateFileByName.set(match[1].trim(), file.replace('.md', ''))
}
for (const [file, level] of [['Core-Characters.md', 2], ['Cast-Unaffiliated.md', 3]]) {
  const text = await readFile(resolve(repoRoot, 'LORE/characters', file), 'utf8')
  const pattern = level === 2 ? /^## (?!인물 목록$)(.+)$/gm : /^### 인물 (.+)$/gm
  for (const match of text.matchAll(pattern)) {
    const name = match[1].trim()
    if (name !== '부록 — 가치관 숫자') stateFileByName.set(name, file.replace('.md', ''))
  }
}
const peopleCatalog = peopleSource.map((person, index) => ({
  id: `person-${String(index + 1).padStart(4, '0')}`,
  name: person.name,
  title: person.title,
  stage: person.stage,
  state: person.state,
  stateName: person.state_name,
  route: (() => {
    const source = stateFileByName.get(person.name) ?? 'Cast-Index'
    const anchor = source === 'Core-Characters' ? person.name : `인물-${person.name}`
    return `/world/${source}#${anchor}`
  })(),
}))
await writeFile(resolve(generatedRoot, 'peopleCatalog.ts'), `export const peopleCatalog = ${JSON.stringify(peopleCatalog, null, 2)} as const\nexport const peopleCount = ${peopleCatalog.length}\n`)
console.log(`WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, contentRoot)}`)
