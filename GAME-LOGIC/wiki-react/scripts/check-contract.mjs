import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(projectRoot, '../..')
const domains = ['world', 'rules', 'design']
const outputArg = process.argv.indexOf('--json')
const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : null

const documents = []
for (const domain of domains) {
  const sourceDir = resolve(repoRoot, 'GAME-LOGIC/site', domain)
  const names = (await readdir(sourceDir)).filter((name) => extname(name) === '.md').sort()
  for (const name of names) {
    const markdown = await readFile(resolve(sourceDir, name), 'utf8')
    const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/\s+\{#[^}]+\}\s*$/, '') ?? basename(name, '.md')
    documents.push({ domain, slug: basename(name, '.md'), title: heading })
  }
}

const appSource = await readFile(resolve(projectRoot, 'src/App.tsx'), 'utf8')
const linksSource = await readFile(resolve(projectRoot, 'src/wikiLinks.ts'), 'utf8')
const articleSource = await readFile(resolve(projectRoot, 'src/pages/ArticlePage.tsx'), 'utf8')
const deploySource = await readFile(resolve(projectRoot, 'deploy/deploy-windows.ps1'), 'utf8')
const catalogPath = resolve(projectRoot, 'src/generated/wikiCatalog.ts')
const publicContractPath = resolve(projectRoot, 'public/wiki-contract.json')

let catalogSource = ''
try {
  catalogSource = await readFile(catalogPath, 'utf8')
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
}

let publicContract = null
try {
  publicContract = JSON.parse(await readFile(publicContractPath, 'utf8'))
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
}

const failures = []
if (documents.length !== 232) failures.push(`document-count:${documents.length}`)
if (!appSource.includes('path="/:domain/:slug"')) failures.push('missing-react-document-route')
if (!articleSource.includes('wikiCatalog')) failures.push('article-not-backed-by-catalog')
if (!catalogSource.includes('export const wikiCatalog')) failures.push('missing-generated-catalog')
if (!publicContract || publicContract.documents?.length !== 232) failures.push('missing-public-contract-manifest')
if (/\.html['"]/.test(linksSource)) failures.push('legacy-html-links-in-react')
if (!deploySource.includes('total-war-ui') || !deploySource.includes('Copy-Item')) {
  failures.push('missing-total-war-ui-preservation')
}

for (const document of documents) {
  const route = `/${document.domain}/${document.slug === 'index' ? '' : document.slug}`
  if (!catalogSource.includes(`route: '${route}'`)) failures.push(`missing-route:${route}`)
  if (!catalogSource.includes(`title: ${JSON.stringify(document.title)}`)) failures.push(`missing-title:${route}`)
}

for (const domain of domains) {
  const contentDir = resolve(projectRoot, 'src/content', domain)
  const names = (await readdir(contentDir)).filter((name) => extname(name) === '.md')
  for (const name of names) {
    const markdown = await readFile(resolve(contentDir, name), 'utf8')
    for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
      const href = match[1]
      if (!href.startsWith('http') && /\.html(?:#|$)/i.test(href)) failures.push(`legacy-content-link:${domain}/${name}:${href}`)
      if (!href.startsWith('/') && !href.startsWith('#') && !href.startsWith('http')) failures.push(`relative-content-link:${domain}/${name}:${href}`)
      if (/^\/(world|rules|design)\//.test(href)) {
        const route = href.split('#', 1)[0]
        if (!catalogSource.includes(`route: '${route}'`)) failures.push(`unregistered-content-link:${domain}/${name}:${href}`)
      }
    }
  }
}

const result = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  documents: documents.length,
  failures,
}

const json = `${JSON.stringify(result, null, 2)}\n`
if (outputPath) await writeFile(resolve(process.cwd(), outputPath), json)
console.log(json.trim())
if (failures.length > 0) process.exit(1)
