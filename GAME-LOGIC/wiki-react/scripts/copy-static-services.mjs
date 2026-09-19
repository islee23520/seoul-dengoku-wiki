import { cp, readFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(projectRoot, '../..')
const source = resolve(repoRoot, 'GDD/system-design/total-war-ui')
const destination = resolve(projectRoot, 'dist/total-war-ui')
const sentinel = 'total-war-ui-20260919-v1'

const index = await readFile(resolve(source, 'index.html'), 'utf8')
if (!index.includes(sentinel)) throw new Error(`total-war-ui sentinel missing: ${sentinel}`)

await rm(destination, { recursive: true, force: true })
await cp(source, destination, { recursive: true })

console.log(`STATIC_SERVICE_OVERLAY_PASS: total-war-ui ${sentinel}`)

const referenceServices = [
  ['GAME-REFERENCE/portrait-demo', 'portrait-demo'],
  ['GAME-REFERENCE/ui-layout-moodboard', 'ui-layout-moodboard'],
  ['GAME-REFERENCE/ui-ux-refs', 'ui-ux-refs'],
]

for (const [sourcePath, publicPath] of referenceServices) {
  const serviceSource = resolve(repoRoot, sourcePath)
  const serviceDestination = resolve(projectRoot, 'dist', publicPath)
  await readFile(resolve(serviceSource, 'index.html'), 'utf8')
  await rm(serviceDestination, { recursive: true, force: true })
  await cp(serviceSource, serviceDestination, { recursive: true })
  console.log(`STATIC_SERVICE_OVERLAY_PASS: ${publicPath}`)
}
