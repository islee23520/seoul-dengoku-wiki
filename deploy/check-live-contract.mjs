import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const publicEdge = process.argv[2] === '--public-edge'
const args = process.argv.slice(publicEdge ? 3 : 2)
const baseUrl = args[0] ?? 'http://127.0.0.1:8080'
const outputPath = args[1]
const catalogPath = args[2] ?? 'WIKI/src/generated/wikiCatalog.ts'
const catalogSource = await readFile(resolve(catalogPath), 'utf8')
const documents = catalogPath.endsWith('.json') ? JSON.parse(catalogSource).documents : [...catalogSource.matchAll(/\{ domain: '([^']+)', slug: '([^']+)', route: '([^']+)', title: ("(?:[^"\\]|\\.)*") \}/g)]
  .map((match) => ({ domain: match[1], slug: match[2], route: match[3], title: JSON.parse(match[4]) }))

const compatibilityRoutes = [
  '/wiki/world/World-Unbinding.html',
  '/wiki/world/World-Unbinding',
  '/wiki/world/',
]
const regressionRoutes = publicEdge ? ['/wiki/', '/wiki/states'] : ['/', '/wiki/', '/wiki/states', '/gdd/', '/gdd/documents', '/gdd/data', '/play/']
// sss.linalab.io is fully public (D11): these must answer HTTP 200 without login.
const publicRoutes = publicEdge ? ['/', '/gdd/', '/wiki/api/health'] : []
const redirectRoutes = new Map([
  ['/system-design/regions', '/wiki/world/World-and-Subway-Layers'],
  ['/system-design/regions/', '/wiki/world/World-and-Subway-Layers'],
])
const failures = []
// Any redirect to Cloudflare Access is a failure, in every mode and on every route.
const fetchManual = async (route) => {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' })
  let location
  try { location = new URL(response.headers.get('location'), baseUrl) } catch { }
  if (location?.hostname.endsWith('.cloudflareaccess.com')) failures.push(`access-redirect:${response.status}:${route}`)
  return response
}
if (catalogPath.endsWith('.json')) {
  if ('englishDocuments' in JSON.parse(catalogSource)) failures.push('unexpected-english-contract')
} else if (catalogSource.includes('wikiEnglishCatalog')) failures.push('unexpected-english-catalog')
if (documents.some(({ route }) => route.startsWith('/en/'))) failures.push('unexpected-english-route')

const checkReactRoute = async (route, expectedTitle) => {
  const response = await fetchManual(route)
  const html = await response.text()
  if (response.status !== 200) failures.push(`http:${response.status}:${route}`)
  if (!html.includes('<div id="root"></div>')) failures.push(`not-react-entry:${route}`)
  if (expectedTitle && !documents.some(document => document.title === expectedTitle)) failures.push(`catalog-title:${route}`)
}

for (const document of documents) await checkReactRoute(`/wiki${document.route}`, document.title)
for (const route of compatibilityRoutes) await checkReactRoute(route)

const showcaseRoute = '/wiki/seoul-showcase/'
const showcaseResponse = await fetchManual(showcaseRoute)
const showcaseHtml = await showcaseResponse.text()
if (showcaseResponse.status !== 200) failures.push(`showcase-http:${showcaseResponse.status}`)
const showcaseAssets = [...showcaseHtml.matchAll(/(?:src|href)="(\/wiki\/seoul-showcase\/assets\/[^"?]+\.(?:js|css))"/g)].map(match => match[1])
if (!showcaseAssets.some(asset => asset.endsWith('.js'))) failures.push('showcase-entry-missing')
if (showcaseHtml.includes('i.replit.com')) failures.push('showcase-replit-injection')
for (const asset of showcaseAssets) {
  const response = await fetchManual(asset)
  if (response.status !== 200) failures.push(`showcase-asset:${response.status}:${asset}`)
  if (!(response.headers.get('content-type') ?? '').match(/javascript|text\/css/)) failures.push(`showcase-asset-type:${asset}`)
}

for (const route of regressionRoutes) {
  if (publicEdge) { await checkReactRoute(route); continue }
  const response = await fetch(`${baseUrl}${route}`)
  if (response.status !== 200) failures.push(`regression-http:${response.status}:${route}`)
}

for (const route of publicRoutes) {
  const response = await fetchManual(route)
  if (response.status !== 200) failures.push(`public-http:${response.status}:${route}`)
}

for (const [route, destination] of redirectRoutes) {
  const response = await fetchManual(route)
  if (response.status !== 308) failures.push(`redirect-http:${response.status}:${route}`)
  const location = response.headers.get('location')
  const pathname = location ? new URL(location, baseUrl).pathname : null
  if (pathname !== destination) failures.push(`redirect-location:${route}:${pathname}`)
}

const result = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  baseUrl,
  documents: documents.length,
  compatibilityRoutes: compatibilityRoutes.length,
  showcaseAssets: showcaseAssets.length,
  regressionRoutes: regressionRoutes.length,
  redirectRoutes: redirectRoutes.size,
  publicRoutes: publicRoutes.length,
  failures,
}

const json = `${JSON.stringify(result, null, 2)}\n`
if (outputPath) await writeFile(outputPath, json)
console.log(json.trim())
if (failures.length > 0) process.exit(1)
