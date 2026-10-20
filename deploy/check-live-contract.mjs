import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const publicEdge = process.argv.includes('--public-edge')
const args = process.argv.slice(2).filter((arg) => arg !== '--public-edge')
const baseUrl = args[0] ?? 'http://127.0.0.1:8080'
const outputPath = args[1]
const catalogPath = args[2] ?? 'WIKI/src/generated/wikiCatalog.ts'
const catalogSource = await readFile(resolve(catalogPath), 'utf8')
const documents = [...catalogSource.matchAll(/\{ domain: '([^']+)', slug: '([^']+)', route: '([^']+)', title: ("(?:[^"\\]|\\.)*") \}/g)]
  .map((match) => ({ domain: match[1], slug: match[2], route: match[3], title: JSON.parse(match[4]) }))

const compatibilityRoutes = [
  '/wiki/world/World-Unbinding.html',
  '/wiki/world/World-Unbinding',
  '/wiki/world/',
]
const regressionRoutes = publicEdge
  ? ['/wiki/', '/wiki/states']
  : ['/', '/wiki/', '/wiki/states', '/gdd/', '/gdd/documents', '/gdd/data', '/play/']
const redirectRoutes = new Map([
  ['/system-design/regions', '/wiki/world/World-and-Subway-Layers'],
  ['/system-design/regions/', '/wiki/world/World-and-Subway-Layers'],
])
const failures = []
const protectedRoutes = publicEdge ? [...redirectRoutes.keys(), '/gdd/'] : []

const checkReactRoute = async (route, expectedTitle) => {
  const response = await fetch(`${baseUrl}${route}`, publicEdge ? { redirect: 'manual' } : undefined)
  const html = await response.text()
  if (response.status !== 200) failures.push(`http:${response.status}:${route}`)
  if (!html.includes('<div id="root"></div>')) failures.push(`not-react-entry:${route}`)
  if (expectedTitle && !catalogSource.includes(`title: ${JSON.stringify(expectedTitle)}`)) failures.push(`catalog-title:${route}`)
}

for (const document of documents) await checkReactRoute(`/wiki${document.route}`, document.title)
for (const route of compatibilityRoutes) await checkReactRoute(route)

for (const route of regressionRoutes) {
  if (publicEdge) {
    await checkReactRoute(route)
    continue
  }
  const response = await fetch(`${baseUrl}${route}`)
  if (response.status !== 200) failures.push(`regression-http:${response.status}:${route}`)
}

for (const [route, destination] of publicEdge ? [] : redirectRoutes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' })
  if (response.status !== 308) failures.push(`redirect-http:${response.status}:${route}`)
  const location = response.headers.get('location')
  const pathname = location ? new URL(location, baseUrl).pathname : null
  if (pathname !== destination) failures.push(`redirect-location:${route}:${pathname}`)
}

for (const route of protectedRoutes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' })
  if (response.status !== 302) failures.push(`access-http:${response.status}:${route}`)
  let login
  try {
    login = new URL(response.headers.get('location'))
  } catch {
    // Report only the checked route, never Access query values.
  }
  if (login?.origin !== 'https://linalab.cloudflareaccess.com'
    || login.pathname !== `/cdn-cgi/access/login/${new URL(baseUrl).hostname}`
    || login.username || login.password) failures.push(`access-location:${route}`)
}

const result = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  baseUrl,
  documents: documents.length,
  compatibilityRoutes: compatibilityRoutes.length,
  regressionRoutes: regressionRoutes.length,
  redirectRoutes: publicEdge ? 0 : redirectRoutes.size,
  ...(publicEdge ? { protectedRoutes: protectedRoutes.length } : {}),
  failures,
}

const json = `${JSON.stringify(result, null, 2)}\n`
if (outputPath) await writeFile(outputPath, json)
console.log(json.trim())
if (failures.length > 0) process.exit(1)
