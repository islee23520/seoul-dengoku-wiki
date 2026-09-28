// Compare the built wiki (dist/) and the React router with artifact-allowlist.json.
// Every built file must be listed or match its directory pattern, asset chunks may only be named after
// an app module or an admitted document, and every router path needs a recorded disposition.
import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dispositions = new Set(['page', 'article', 'legacy-redirect', 'fallback-home'])

async function walk(directory, root = directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path, root))
    else files.push(relative(root, path).replaceAll('\\', '/'))
  }
  return files
}

export const routerPaths = (appSource) => [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1])

export async function artifactFailures({ distRoot, allowlist, appSource }) {
  const failures = []
  const contract = JSON.parse(await readFile(resolve(distRoot, 'wiki-contract.json'), 'utf8').catch(() => '{}'))
  const documentSlugs = new Set([...(contract.documents ?? []), ...(contract.englishDocuments ?? [])].map(({ slug }) => slug))
  const appChunks = new Set(allowlist.assets.appChunks)
  const assetPattern = new RegExp(allowlist.assets.pattern, 'u')
  const rootFiles = new Set(allowlist.rootFiles)
  const directories = Object.fromEntries(Object.entries(allowlist.directories).map(([name, pattern]) => [name, new RegExp(pattern, 'u')]))
  const files = await walk(distRoot)
  const present = new Set(files)

  for (const file of files) {
    const [top, ...rest] = file.split('/')
    const name = rest.join('/')
    if (!rest.length) {
      if (!rootFiles.has(file)) failures.push(`E_ARTIFACT_UNLISTED: ${file}`)
    } else if (top === 'assets') {
      const library = allowlist.assets.libraryDirectory
      const match = name.match(assetPattern)
      // The build writes dependency-only chunks one level under the library directory.
      if (library && name.startsWith(`${library}/`)) {
        if (!(name.slice(library.length + 1).match(assetPattern) && !name.slice(library.length + 1).includes('/'))) failures.push(`E_ARTIFACT_UNLISTED: ${file}`)
      } else if (!match) failures.push(`E_ARTIFACT_UNLISTED: ${file}`)
      else if (!appChunks.has(match[1]) && !documentSlugs.has(match[1])) failures.push(`E_ARTIFACT_CHUNK: ${file} is not an app module or admitted document`)
    } else if (!directories[top] || !directories[top].test(name)) failures.push(`E_ARTIFACT_UNLISTED: ${file}`)
  }
  for (const file of rootFiles) if (!present.has(file)) failures.push(`E_ARTIFACT_MISSING: ${file}`)
  for (const directory of Object.keys(directories)) {
    if (!files.some((file) => file.startsWith(`${directory}/`))) failures.push(`E_ARTIFACT_MISSING: ${directory}/`)
  }

  const recorded = new Map(allowlist.routes.map(({ path, disposition }) => [path, disposition]))
  const routes = routerPaths(appSource)
  for (const path of routes) {
    if (!recorded.has(path)) failures.push(`E_ROUTE_UNDISPOSED: ${path}`)
    else if (!dispositions.has(recorded.get(path))) failures.push(`E_ROUTE_DISPOSITION: ${path} ${recorded.get(path)}`)
  }
  for (const path of recorded.keys()) if (!routes.includes(path)) failures.push(`E_ROUTE_STALE: ${path}`)
  return failures
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distRoot = resolve(process.argv[2] ?? resolve(projectRoot, 'dist'))
  const allowlist = JSON.parse(await readFile(resolve(projectRoot, 'artifact-allowlist.json'), 'utf8'))
  const appSource = await readFile(resolve(projectRoot, 'src/App.tsx'), 'utf8')
  const failures = await artifactFailures({ distRoot, allowlist, appSource })
  if (failures.length) {
    console.error(`ARTIFACT_ALLOWLIST_FAIL (${failures.length}):\n${failures.join('\n')}`)
    process.exitCode = 1
  } else console.log(`ARTIFACT_ALLOWLIST_PASS: ${(await walk(distRoot)).length} files, ${routerPaths(appSource).length} routes`)
}
