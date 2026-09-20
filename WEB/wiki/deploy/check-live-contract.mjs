import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:8080'
const outputPath = process.argv[3]
const catalogPath = process.argv[4] ?? 'WEB/wiki/src/generated/wikiCatalog.ts'
const catalogSource = await readFile(resolve(catalogPath), 'utf8')
const documents = [...catalogSource.matchAll(/\{ domain: '([^']+)', slug: '([^']+)', route: '([^']+)', title: ("(?:[^"\\]|\\.)*") \}/g)]
  .map((match) => ({ domain: match[1], slug: match[2], route: match[3], title: JSON.parse(match[4]) }))

const compatibilityRoutes = [
  '/wiki/world/World-Unbinding.html',
  '/wiki/world/World-Unbinding',
  '/wiki/world/',
]
const regressionRoutes = ['/', '/wiki/', '/wiki/states', '/play/']
const removedRoutes = ['/system-design/regions/']
const failures = []

const checkReactRoute = async (route, expectedTitle) => {
  const response = await fetch(`${baseUrl}${route}`)
  const html = await response.text()
  if (response.status !== 200) failures.push(`http:${response.status}:${route}`)
  if (!html.includes('<div id="root"></div>')) failures.push(`not-react-entry:${route}`)
  if (expectedTitle && !catalogSource.includes(`title: ${JSON.stringify(expectedTitle)}`)) failures.push(`catalog-title:${route}`)
}

for (const document of documents) await checkReactRoute(`/wiki${document.route}`, document.title)
for (const route of compatibilityRoutes) await checkReactRoute(route)

for (const route of regressionRoutes) {
  const response = await fetch(`${baseUrl}${route}`)
  if (response.status !== 200) failures.push(`regression-http:${response.status}:${route}`)
}

for (const route of removedRoutes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' })
  if (response.status !== 404) failures.push(`removed-http:${response.status}:${route}`)
}

const result = {
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  baseUrl,
  documents: documents.length,
  compatibilityRoutes: compatibilityRoutes.length,
  regressionRoutes: regressionRoutes.length,
  removedRoutes: removedRoutes.length,
  failures,
}

const json = `${JSON.stringify(result, null, 2)}\n`
if (outputPath) await writeFile(outputPath, json)
console.log(json.trim())
if (failures.length > 0) process.exit(1)
