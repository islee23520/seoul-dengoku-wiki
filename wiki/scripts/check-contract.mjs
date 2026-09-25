import { readdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { approvedRoutes, catalogFields, readerFields, unknownFields } from './catalog-admission.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(projectRoot, '../lore'))
const domains = ['world']
const outputArg = process.argv.indexOf('--json')
const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : null

const documents = []
for (const domain of domains) {
  const sourceDir = resolve(projectRoot, 'src/generated/world')
  const names = (await readdir(sourceDir)).filter((name) => extname(name) === '.json').sort()
  for (const name of names) {
    const page = JSON.parse(await readFile(resolve(sourceDir, name), 'utf8'))
    const heading = page.title ?? basename(name, '.json')
    documents.push({ domain, slug: basename(name, '.json'), title: heading.trim() })
  }
}

const appSource = await readFile(resolve(projectRoot, 'src/App.tsx'), 'utf8')
const linksSource = await readFile(resolve(projectRoot, 'src/wikiLinks.ts'), 'utf8')
const articleSource = await readFile(resolve(projectRoot, 'src/pages/ArticlePage.tsx'), 'utf8')
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
const expectedRoutes = await approvedRoutes(loreRoot)
const publishedRoutes = documents.map(({ domain, slug }) => `/${domain}/${slug === 'index' ? '' : slug}`).sort()
if (JSON.stringify(publishedRoutes) !== JSON.stringify(expectedRoutes)) failures.push('published-routes-differ-from-approved-lore-set')
const catalogRoutes = [...catalogSource.matchAll(/route: '([^']+)'/g)].map((match) => match[1]).sort()
if (JSON.stringify(catalogRoutes) !== JSON.stringify(expectedRoutes)) failures.push('catalog-routes-differ-from-approved-lore-set')
if (publicContract) {
  if (unknownFields(publicContract, ['documents']).length) failures.push(`public-contract-extra-fields:${unknownFields(publicContract, ['documents']).join(',')}`)
  if (!Array.isArray(publicContract.documents)) failures.push('public-contract-documents-invalid')
  else {
    const contractRoutes = publicContract.documents.map((document) => document.route).sort()
    if (JSON.stringify(contractRoutes) !== JSON.stringify(expectedRoutes)) failures.push('public-contract-routes-differ-from-approved-lore-set')
    for (const document of publicContract.documents) {
      const extra = unknownFields(document, catalogFields)
      if (extra.length) failures.push(`public-contract-document-extra-fields:${document.route}:${extra.join(',')}`)
    }
  }
}
const relations = spawnSync(process.execPath, [resolve(loreRoot, 'relations/validate.mjs')], { encoding: 'utf8' })
if (relations.status !== 0) failures.push(`relation-contract:${(relations.stderr || relations.stdout || relations.error?.message || 'missing validator').trim()}`)
if (documents.length === 0) failures.push('document-count:0')
if (!appSource.includes('path="/:domain/:slug"')) failures.push('missing-react-document-route')
if (!articleSource.includes('wikiCatalog')) failures.push('article-not-backed-by-catalog')
if (!catalogSource.includes('export const wikiCatalog')) failures.push('missing-generated-catalog')
if (!publicContract || publicContract.documents?.length !== documents.length) failures.push('missing-public-contract-manifest')
if (/\.html['"]/.test(linksSource)) failures.push('legacy-html-links-in-react')
if (!(await readFile(resolve(projectRoot, 'vite.config.ts'), 'utf8')).includes("base: '/wiki/'")) failures.push('missing-wiki-vite-base')

for (const document of documents) {
  const route = `/${document.domain}/${document.slug === 'index' ? '' : document.slug}`
  if (!catalogSource.includes(`route: '${route}'`)) failures.push(`missing-route:${route}`)
  if (!catalogSource.includes(`title: ${JSON.stringify(document.title)}`)) failures.push(`missing-title:${route}`)
}

for (const domain of domains) {
  const contentDir = resolve(projectRoot, 'src/generated/world')
  const names = (await readdir(contentDir)).filter((name) => extname(name) === '.json')
  for (const name of names) {
    const page = JSON.parse(await readFile(resolve(contentDir, name), 'utf8'))
    const extra = unknownFields(page, readerFields)
    if (extra.length) failures.push(`reader-json-extra-fields:${domain}/${name}:${extra.join(',')}`)
    const slug = basename(name, '.json')
    const route = `/${domain}/${slug === 'index' ? '' : slug}`
    if (page.slug !== slug || page.route !== route || typeof page.title !== 'string') failures.push(`reader-json-identity:${domain}/${name}`)
    if ('body' in page || !Array.isArray(page.blocks) || page.blocks.length === 0 || typeof page.reviewText !== 'string') failures.push(`unstructured-content:${domain}/${name}`)
    else {
      const parsed = fromMarkdown(page.reviewText, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children
      const withoutPosition = (node) => {
        delete node.position
        for (const child of node.children ?? []) withoutPosition(child)
      }
      for (const block of parsed) withoutPosition(block)
      if (JSON.stringify(parsed) !== JSON.stringify(page.blocks)) failures.push(`review-text-drift:${domain}/${name}`)
    }
    const links = []
    const visit = (node) => {
      if (node.url && node.type === 'link') links.push(node.url)
      for (const child of node.children ?? []) visit(child)
    }
    for (const block of page.blocks ?? []) visit(block)
    for (const href of links) {
      if (!href.startsWith('http') && /\.html(?:#|$)/i.test(href)) failures.push(`legacy-content-link:${domain}/${name}:${href}`)
      if (!href.startsWith('/') && !href.startsWith('#') && !href.startsWith('http')) failures.push(`relative-content-link:${domain}/${name}:${href}`)
      if (/^\/world\//.test(href)) {
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
