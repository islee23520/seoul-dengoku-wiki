import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categories, excluded, loadGddSources } from './catalog-admission.mjs'
import { gddPublicationManifest } from './publication-manifest.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
if (!process.env.GDD_PAGES_ROOT) throw new Error('GDD_PAGES_ROOT is required: materialize GDD JSON canon before generating the catalog')
const gddPagesRoot = resolve(process.env.GDD_PAGES_ROOT)
const contentRoot = resolve(projectRoot, 'src/content')
const generatedRoot = resolve(projectRoot, 'src/generated')
const sharedContentRoot = resolve(generatedRoot, 'shared-content')
const gddRoot = process.env.GDD_ROOT ?? resolve(projectRoot, '..')
// Dataset summaries read the parent repository that hosts GDD: the hub checkout keeps lore at WIKI/lore,
// a standalone GDD checkout reads the sibling LORE/ directory that GDD links point at.
const repoRoot = process.env.SEOUL_KENSHI_ROOT ?? resolve(gddRoot, '..')
const loreRoot = process.env.LORE_ROOT ?? [resolve(repoRoot, 'WIKI/lore'), resolve(repoRoot, 'LORE')].find((path) => existsSync(path))
if (!loreRoot) throw new Error(`E_LORE_ROOT_MISSING: neither WIKI/lore nor LORE exists under ${repoRoot}; set LORE_ROOT`)
// Rendered page path -> the GDD file that owns it: the JSON canon document, or the exempt Markdown file itself.
const sources = await loadGddSources(gddRoot)
const canonPathByPage = new Map([...sources].map(([page, { source }]) => [page, source]))
const githubRoot = 'https://github.com/islee23520/seoul-dengoku/blob/main/'

const titleOf = (markdown, fallback) => markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+\{#[^}]+\}\s*$/, '').trim() ?? fallback
const sourceKey = async (path) => {
  const page = relative(gddPagesRoot, path).replaceAll('\\', '/')
  const canonPath = canonPathByPage.get(page)
  if (canonPath) return canonPath
  if (await stat(resolve(gddRoot, page)).then((entry) => entry.isFile(), () => false)) return page
  throw new Error(`E_GDD_SOURCE_UNMAPPED: ${page} has no GDD canon document`)
}

await rm(contentRoot, { recursive: true, force: true })
await mkdir(contentRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(sharedContentRoot, { recursive: true })

const documents = []
for (const category of categories) {
  const sourceDir = resolve(gddPagesRoot, category.dir)
  for (const name of (await readdir(sourceDir)).sort()) {
    if (excluded.has(name) || extname(name) !== '.md') continue
    const source = resolve(sourceDir, name)
    if (!(await stat(source)).isFile()) continue
    const slug = basename(name, '.md')
    const markdown = await readFile(source, 'utf8')
    const sourcePath = await sourceKey(source)
    const canon = sourcePath.endsWith('.json') ? JSON.parse(await readFile(resolve(gddRoot, sourcePath), 'utf8')) : null
    const id = canon ? (canon.document?.id ?? canon.id) : `gdd:${slug}`
    const summary = canon?.locales?.ko?.summary ?? ''
    const contentRef = Array.isArray(canon?.content) ? `src/generated/shared-content/${category.id}-${slug}.json` : `src/content/${category.id}/${slug}.md`
    documents.push({ category: category.id, categoryLabel: category.label, slug, route: `/${category.id}/${slug}`, title: titleOf(markdown, slug), source, sourcePath, markdown, id, summary, contentRef, canon })
  }
}

const publicationManifest = await gddPublicationManifest({ gddRoot, pagesRoot: gddPagesRoot, sources, documents })
const routeBySource = new Map(documents.map((document) => [document.sourcePath, document.route]))
const normalizeHref = async (href, source) => {
  if (href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return href
  const [pathPart, hash = ''] = href.split('#', 2)
  if (pathPart.includes('system-design/')) return `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/collections/system-design.json${hash ? `#${hash}` : ''}`
  const resolved = relative(gddPagesRoot, resolve(dirname(source), pathPart)).replaceAll('\\', '/')
  if (resolved.startsWith('../LORE/') && resolved.endsWith('.md')) return `/world/${basename(resolved, '.md')}${hash ? `#${hash}` : ''}`
  if (resolved.startsWith('../')) return `${githubRoot}${resolved.replace(/^\.\.\//, '')}${hash ? `#${hash}` : ''}`
  const target = await sourceKey(resolve(gddPagesRoot, resolved))
  const gddRoute = routeBySource.get(target)
  if (gddRoute) return `${gddRoute}${hash ? `#${hash}` : ''}`
  return `https://github.com/islee23520/seoul-dengoku-gdd/blob/main/${target}${hash ? `#${hash}` : ''}`
}

for (const document of documents) {
  const targetDir = resolve(contentRoot, document.category)
  await mkdir(targetDir, { recursive: true })
  const normalized = document.markdown
    .replace(/^---\n[\s\S]*?\n---\n/u, '')
    .replace(/^#\s+.+\n+/u, '')
  const links = [...normalized.matchAll(/\]\(([^)]+)\)/g)]
  const hrefs = await Promise.all(links.map((match) => normalizeHref(match[1], document.source)))
  let index = 0
  await writeFile(resolve(targetDir, `${document.slug}.md`), normalized.replace(/\]\(([^)]+)\)/g, () => `](${hrefs[index++]})`))
  if (Array.isArray(document.canon?.content)) {
    await writeFile(resolve(sharedContentRoot, `${document.category}-${document.slug}.json`), `${JSON.stringify(document.canon.content)}\n`)
  }
}

const valuesCast = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/values-cast.json'), 'utf8'))
const genders = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/gender-cast.json'), 'utf8'))
const valuesOrgs = JSON.parse(await readFile(resolve(loreRoot, 'name-pools/values-orgs.json'), 'utf8'))
const graph = JSON.parse(await readFile(resolve(repoRoot, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'), 'utf8'))
const control = JSON.parse(await readFile(resolve(loreRoot, 'places/station-control-overrides.json'), 'utf8'))
const interiors = JSON.parse(await readFile(resolve(loreRoot, 'regions/station-interiors.json'), 'utf8'))
let regions = 0
for (const name of await readdir(resolve(loreRoot, 'regions/content'))) {
  if (!name.endsWith('.json')) continue
  regions += JSON.parse(await readFile(resolve(loreRoot, 'regions/content', name), 'utf8')).regions.length
}
const dataCatalog = [
  { id: 'cast-values', title: '인물 가치관·욕망', format: 'JSON', ownerPath: 'LORE/name-pools/values-cast.json', schema: valuesCast.schema, records: valuesCast.people.length, status: '사용 중', validation: 'verify-cast' },
  { id: 'cast-gender', title: '인물 성별', format: 'JSON', ownerPath: 'LORE/name-pools/gender-cast.json', schema: genders.schema, records: genders.people.length, status: '사용자 잠금 포함', validation: '여성·남성 전수 및 잠금 우선' },
  { id: 'organization-values', title: '조직 가치관·정책', format: 'JSON', ownerPath: 'LORE/name-pools/values-orgs.json', schema: valuesOrgs.schema, records: valuesOrgs.orgs.length, status: '사용 중', validation: '조직 ID·국가 참조' },
  { id: 'seoul-world-graph', title: '서울 이동 그래프', format: 'JSON', ownerPath: 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json', schema: graph.schema, records: graph.stations.length, secondary: `${graph.edges.length}간선`, status: '런타임 투영', validation: '역 ID·간선 양끝·지문' },
  { id: 'station-control', title: '역 점령 변경 원장', format: 'JSON', ownerPath: 'LORE/places/station-control-overrides.json', schema: control.schema, records: control.overrides.length, status: '개막 기준선', validation: '명시 변경만 허용' },
  { id: 'station-interiors', title: '역 내부 원장', format: 'JSON', ownerPath: 'LORE/regions/station-interiors.json', schema: interiors.schema, records: interiors.stations.length, status: '저작 원장', validation: '역 카탈로그 전수' },
  { id: 'regions', title: '행정동 저작 원장', format: 'JSON 묶음', ownerPath: 'LORE/regions/content/*.json', schema: 'region-content', records: regions, status: '저작 원장', validation: '25구·427동·정본 링크' },
]

const catalogSource = `export const gddCategories = ${JSON.stringify(categories.map(({ id, label }) => ({ id, label })), null, 2)} as const\n\nexport const gddCatalog = ${JSON.stringify(documents.map(({ category, categoryLabel, slug, route, title, sourcePath }) => ({ category, categoryLabel, slug, route, title, sourcePath })), null, 2)} as const\n`
await writeFile(resolve(generatedRoot, 'gddCatalog.ts'), catalogSource)
await writeFile(resolve(generatedRoot, 'publication-manifest.json'), `${JSON.stringify(publicationManifest, null, 2)}\n`)
await writeFile(resolve(generatedRoot, 'dataCatalog.ts'), `export const dataCatalog = ${JSON.stringify(dataCatalog, null, 2)} as const\n`)
await writeFile(resolve(generatedRoot, 'gdd-contract.json'), `${JSON.stringify({ documents: documents.map(({ category, route, title, sourcePath }) => ({ category, route, title, sourcePath })), datasets: dataCatalog }, null, 2)}\n`)
console.log(`GDD_CATALOG_GENERATED documents=${documents.length} datasets=${dataCatalog.length}`)
