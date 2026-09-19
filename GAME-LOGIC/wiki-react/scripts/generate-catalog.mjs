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
const officesSource = await readFile(resolve(repoRoot, 'LORE/offices/Offices-and-Ranks.md'), 'utf8')
const officeTable = officesSource.match(/\| 국가 \| 티어1 \|[\s\S]*?(?=\n## )/)?.[0] ?? ''
const tiersByState = new Map([...officeTable.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => [match[1].trim(), match.slice(2).map((rank) => rank.trim())]))
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
const genderSource = JSON.parse(await readFile(resolve(repoRoot, 'LORE/name-pools/gender-cast.json'), 'utf8')).people
const genderByName = new Map(genderSource.map((person) => [person.name, person]))
const stateNameById = new Map(peopleSource.filter((person) => /^S(?:0[1-9]|1[0-6])$/u.test(person.state)).map((person) => [person.state, person.state_name]))
const regionAtlasSource = await readFile(resolve(repoRoot, 'GDD/system-design/regions/atlas-data.js'), 'utf8')
const regionAtlas = JSON.parse(regionAtlasSource.replace(/^window\.SEOUL_REGION_ATLAS=/, '').replace(/;\s*$/, ''))
const geometryRings = (geometry) => geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
const allMapPoints = regionAtlas.regions.flatMap((region) => geometryRings(region.map_geometry).flat())
const mapBounds = allMapPoints.reduce((bounds, [x, y]) => ({
  minX: Math.min(bounds.minX, x), maxX: Math.max(bounds.maxX, x),
  minY: Math.min(bounds.minY, y), maxY: Math.max(bounds.maxY, y),
}), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })
const mapWidth = 1200
const mapHeight = Math.round(mapWidth * (mapBounds.maxY - mapBounds.minY) / (mapBounds.maxX - mapBounds.minX))
const simplifyRing = (ring) => {
  const step = Math.max(1, Math.floor(ring.length / 80))
  const selected = ring.filter((_, index) => index % step === 0)
  if (selected.at(-1) !== ring.at(-1)) selected.push(ring.at(-1))
  return selected
}
const mapPoint = ([x, y]) => [
  Number(((x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX) * mapWidth).toFixed(2)),
  Number(((mapBounds.maxY - y) / (mapBounds.maxY - mapBounds.minY) * mapHeight).toFixed(2)),
]
const geometryPath = (geometry) => geometryRings(geometry).map((ring) => {
  const points = simplifyRing(ring).map(mapPoint)
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z'
}).join(' ')
const territoryStates = [...stateNameById.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([id, name]) => {
  const state = stateCatalog.find((candidate) => candidate.name === name)
  if (!state) throw new Error(`E_TERRITORY_STATE_NOT_FOUND:${id}:${name}`)
  return { id, name, slug: state.slug, power: state.power }
})
const openingTerritories = {
  schema: 'seoul-opening-territories.v1',
  epoch: regionAtlas.fictional_epoch,
  width: mapWidth,
  height: mapHeight,
  attribution: regionAtlas.attribution,
  states: territoryStates,
  regions: regionAtlas.regions.map((region) => {
    const polities = region.content.polity_contexts
    return {
      id: region.id,
      name: region.name,
      district: region.district_name,
      path: geometryPath(region.map_geometry),
      polities,
      status: polities.length === 1 ? 'held' : 'contested',
      openingState: region.content.opening_state,
      summary: region.content.summary,
      stationCount: region.station_ids.length,
    }
  }),
}
await writeFile(resolve(publicRoot, 'opening-territories.json'), `${JSON.stringify(openingTerritories)}\n`)

const personCards = new Map()
const addPersonCards = (text, file, pattern) => {
  const headings = [...text.matchAll(pattern)]
  for (let index = 0; index < headings.length; index += 1) {
    const name = headings[index][1].trim()
    if (name === '부록 — 가치관 숫자' || name === '인물 카드') continue
    const body = text.slice(headings[index].index + headings[index][0].length, headings[index + 1]?.index ?? text.length).trim()
    const cards = personCards.get(name) ?? []
    cards.push({ file: file.replace('.md', ''), body })
    personCards.set(name, cards)
  }
}
for (let index = 1; index <= 16; index += 1) {
  const file = `Cast-State-${String(index).padStart(2, '0')}.md`
  const text = await readFile(resolve(repoRoot, 'LORE/characters', file), 'utf8')
  addPersonCards(text, file, /^### 인물 (.+)$/gm)
}
for (const [file, pattern] of [['Core-Characters.md', /^## (?!인물 목록$)(.+)$/gm], ['Cast-Unaffiliated.md', /^### 인물 (.+)$/gm]]) {
  const text = await readFile(resolve(repoRoot, 'LORE/characters', file), 'utf8')
  addPersonCards(text, file, pattern)
}
const relationText = await readFile(resolve(repoRoot, 'LORE/characters/Cast-Relations.md'), 'utf8')
const relations = [...relationText.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)]
  .map((match) => ({ from: match[1].trim(), type: match[2].trim(), to: match[3].trim(), basis: match[4].trim() }))
  .filter((relation) => relation.from !== '인물' && !relation.from.startsWith('---'))
const parseCardSections = (body) => {
  const sections = {}
  const matches = [...body.matchAll(/\*\*([^*]+?)\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*[^*]+?\.\*\*|\n\s*:::|$)/g)]
  for (const match of matches) sections[match[1].trim()] = match[2].trim()
  return sections
}
const parseCardFields = (body) => Object.fromEntries(
  [...body.matchAll(/^- ([^:\n]+):\s*(.+)$/gm)].map((match) => [match[1].trim(), match[2].trim()]),
)
const personDetailsRoot = resolve(publicRoot, 'person-details')
await rm(personDetailsRoot, { recursive: true, force: true })
await mkdir(personDetailsRoot, { recursive: true })
const peopleCatalog = peopleSource.map((person, index) => {
  const cards = personCards.get(person.name) ?? []
  const primary = [...cards].sort((left, right) => right.body.length - left.body.length)[0]
  const fields = parseCardFields(primary?.body ?? '')
  const sections = parseCardSections(primary?.body ?? '')
  const source = primary?.file ?? 'Cast-Index'
  const anchor = source === 'Core-Characters' ? person.name : `인물-${person.name}`
  const office = sections['관직'] ?? ''
  const position = fields['직함'] ?? fields['직위'] ?? office.match(/직함은 ([^.]+)\./u)?.[1]?.trim() ?? person.title
  const rank = fields['품계'] ?? office.match(/품계 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
  const occupation = fields['생업'] ?? office.match(/생업 별명은 ([^.]+)\./u)?.[1]?.trim() ?? '미등록'
  const stateTiers = tiersByState.get(person.state_name)
  const tierIndex = stateTiers?.indexOf(rank) ?? -1
  const commonTier = person.state === 'S00' ? 'T5' : tierIndex >= 0 ? `T${tierIndex + 1}` : (() => { throw new Error(`E_PERSON_TIER_MISSING:${person.name}:${person.state_name}:${rank}`) })()
  return {
    id: `person-${String(index + 1).padStart(4, '0')}`,
    name: person.name,
    title: person.title,
    position,
    rank,
    commonTier,
    occupation,
    gender: genderByName.get(person.name)?.gender ?? (() => { throw new Error(`E_PERSON_GENDER_MISSING:${person.name}`) })(),
    stage: person.stage,
    state: person.state,
    stateName: person.state_name,
    sourceRoute: `/world/${source}#${anchor}`,
    detailRoute: `/people/person-${String(index + 1).padStart(4, '0')}`,
  }
})
for (const person of peopleCatalog) {
  const ledger = peopleSource.find((candidate) => candidate.name === person.name)
  const cards = personCards.get(person.name) ?? []
  const primary = [...cards].sort((left, right) => right.body.length - left.body.length)[0]
  const body = primary?.body ?? ''
  const detail = {
    ...person,
    generation: ledger.generation,
    minors: ledger.minors,
    sourceKind: ledger.source,
    locked: ledger.locked,
    values: ledger.values,
    desire: ledger.desire,
    fields: parseCardFields(body),
    sections: parseCardSections(body),
    biography: body,
    sources: cards.map((card) => card.file),
    relations: {
      outgoing: relations.filter((relation) => relation.from === person.name),
      incoming: relations.filter((relation) => relation.to === person.name),
    },
  }
  await writeFile(resolve(personDetailsRoot, `${person.id}.json`), `${JSON.stringify(detail, null, 2)}\n`)
}
await writeFile(resolve(generatedRoot, 'peopleCatalog.ts'), `export const peopleCatalog = ${JSON.stringify(peopleCatalog, null, 2)} as const\nexport const peopleCount = ${peopleCatalog.length}\n`)
console.log(`WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, contentRoot)}`)
