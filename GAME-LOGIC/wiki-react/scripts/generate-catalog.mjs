import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(projectRoot, '../..')
const contentRoot = resolve(projectRoot, 'src/content')
const generatedRoot = resolve(projectRoot, 'src/generated')
const publicRoot = resolve(projectRoot, 'public')
const domains = ['world', 'rules', 'design']

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

const normalizeMarkdown = (markdown, domain, routeBySlug) => markdown
  .replace(/^---\n[\s\S]*?\n---\n/, '')
  .replace(/^#\s+.+\n+/, '')
  .replace(/<InfoBox[\s\S]*?<\/InfoBox>/g, '')
  .replace(/<NavBox[\s\S]*?<\/NavBox>/g, '')
  .replace(/\]\(([^)]+)\)/g, (full, href) => `](${rewriteRelativeHref(href, domain, routeBySlug)})`)

await rm(contentRoot, { recursive: true, force: true })
await mkdir(contentRoot, { recursive: true })
await mkdir(generatedRoot, { recursive: true })
await mkdir(publicRoot, { recursive: true })

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
console.log(`WIKI_CATALOG_GENERATED: ${documents.length} documents at ${relative(repoRoot, contentRoot)}`)
