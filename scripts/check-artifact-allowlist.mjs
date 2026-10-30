// Compare the built wiki (dist/) and the React router with artifact-allowlist.json.
// Every built file must be listed or match its directory pattern, asset chunks may only be named after
// an app module or an admitted document, and every router path needs a recorded disposition.
import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import proj4 from 'proj4'

import { portraitReviewFailures, generationEvidencePaths, publicPortraitStringFailures } from './portrait-public-boundary.mjs'

proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs')
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dispositions = new Set(['page', 'article', 'legacy-redirect', 'fallback-home'])
const retiredGeography = new Set([
  'admin-territorial-scale.json', 'northern-rail.json', 'outside-admin-units.json', 'outside-control-2126.json',
  'regional-boundaries.json', 'regional-metro.bin', 'regional-peninsula.bin',
  'regional-rail.json', 'regular-regional-connections.json',
  'regional-terrain-far-water.json', 'regional-terrain.json',
])
const boundarySha256 = '6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4'
const osmSha256 = '70007aa979f8e362ca609fdc2d6302164c2f1379f11c8fc5fd39a7a2e79d3c17'

// Clipping covers the boundary; the EPSG:5179 round trip moves its endpoints by
// a few floating-point ulps. This is under 0.2 micrometres, not a spatial buffer.
const boundaryTolerance = 1e-12

function segmentDistance(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared)) : 0
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy)
}

function insideRing([x, y], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
  }
  return inside
}

function insideSeoul(point, polygons) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
    && polygons.some(([outer, ...holes]) => (insideRing(point, outer) && holes.every(hole => !insideRing(point, hole)))
      || [outer, ...holes].some(ring => ring.slice(1).some((end, i) => segmentDistance(point, ring[i], end) <= boundaryTolerance)))
}

function crosses(a, b, c, d) {
  const turn = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
  if (!(turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0)) return false
  const dx = b[0] - a[0], dy = b[1] - a[1], ex = d[0] - c[0], ey = d[1] - c[1]
  const t = ((c[0] - a[0]) * ey - (c[1] - a[1]) * ex) / (dx * ey - dy * ex)
  return Math.min(t, 1 - t) * Math.hypot(dx, dy) > boundaryTolerance
}

function railInside(points, polygons) {
  const geographic = points.map(point => proj4('EPSG:5179', 'EPSG:4326', point))
  return geographic.every(point => insideSeoul(point, polygons)) && geographic.slice(1).every((point, index) => {
    const start = geographic[index]
    return insideSeoul([(start[0] + point[0]) / 2, (start[1] + point[1]) / 2], polygons)
      && polygons.every(polygon => polygon.every(ring => ring.slice(1).every((end, i) => !crosses(start, point, ring[i], end))))
  })
}

// The published railway is a physical subset, not an operating-line or station claim.
function geographyFailures(value, file, polygons) {
  const failures = []
  const fail = detail => failures.push(`E_ARTIFACT_SEOUL_SCOPE: ${file} ${detail}`)
  if (file !== 'opening-territories.json') return failures
  if (value?.schema !== 'seoul-opening-territories.v1' || !value.geography || !Array.isArray(value.geography.titles)
    || !value.geography.titles.some(title => title.id === 'geography:empire:seoul')
    || value.geography.titles.some(title => !title.id?.startsWith('geography:') || !title.path)) fail('verified Seoul geographic titles required')
  const rail = value?.physicalRail
  if (!rail || rail.projection !== 'EPSG:5179' || rail.boundarySha256 !== boundarySha256
    || rail.osmSha256 !== osmSha256 || rail.stationBindingStatus !== 'missing-evidence'
    || rail.passage2126 !== 'unknown' || !Array.isArray(rail.paths) || !rail.paths.length) fail('verified physicalRail required')
  else for (const path of rail.paths) {
    if (!path.id || !Number.isInteger(path.osmWay) || !/^osm:railway:[a-z_]+$/u.test(path.lineId)
      || path.lineId !== `osm:railway:${path.mode}` || !Array.isArray(path.points) || path.points.length < 2
      || !railInside(path.points, polygons)) {
      fail(`physicalRail.paths/${path.id ?? '?'}`)
    }
  }
  if (value?.vassals?.length || value?.regions?.some(region => !/^region:11\d{8}$/u.test(region.id))) fail('outside current assignment')
  return failures
}

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

export async function artifactFailures({ distRoot, allowlist, appSource, seoulPolygons }) {
  const failures = []
  if (!seoulPolygons) {
    const boundary = JSON.parse(await readFile(resolve(projectRoot, 'data/geography/boundaries/seoul-sgis-20250630.geojson'), 'utf8'))
    seoulPolygons = boundary.features.find(feature => feature.id === 'geography:empire:seoul').geometry.coordinates
  }
  const contract = JSON.parse(await readFile(resolve(distRoot, 'wiki-contract.json'), 'utf8').catch(() => '{}'))
  if ('englishDocuments' in contract) failures.push('E_ARTIFACT_ENGLISH_CONTRACT: wiki-contract.json contains englishDocuments')
  const documentSlugs = new Set((contract.documents ?? []).map(({ slug }) => slug))
  const appChunks = new Set(allowlist.assets.appChunks)
  const assetPattern = new RegExp(allowlist.assets.pattern, 'u')
  const rootFiles = new Set(allowlist.rootFiles)
  const directories = Object.fromEntries(Object.entries(allowlist.directories).map(([name, pattern]) => [name, new RegExp(pattern, 'u')]))
  const files = await walk(distRoot)
  const present = new Set(files)

  for (const file of files) {
    const [top, ...rest] = file.split('/')
    if (retiredGeography.has(file) || top === 'regional-terrain-tiles') failures.push(`E_ARTIFACT_SEOUL_SCOPE: ${file} retired outside geography asset`)
    if (file.endsWith('.json')) {
      const value = JSON.parse(await readFile(resolve(distRoot, file), 'utf8'))
      failures.push(...geographyFailures(value, file, seoulPolygons))
      const leaks = generationEvidencePaths(value)
      if (top === 'portrait-reviews') leaks.push(...portraitReviewFailures(value))
      if (top === 'portrait-tokens') leaks.push(...publicPortraitStringFailures(value, 'token'))
      if (leaks.length) failures.push(`E_ARTIFACT_PORTRAIT_EVIDENCE: ${file} ${[...new Set(leaks)].join(', ')}`)
    }
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
