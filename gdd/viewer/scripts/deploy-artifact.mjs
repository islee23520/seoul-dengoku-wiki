import { createHash } from 'node:crypto'
import { cp, lstat, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')

async function files(root, prefix = '') {
  const entries = []
  for (const name of (await readdir(resolve(root, prefix))).sort()) {
    const path = `${prefix}${name}`
    const stat = await lstat(resolve(root, path))
    if (stat.isDirectory()) entries.push(...await files(root, `${path}/`))
    else if (stat.isFile()) {
      const bytes = await readFile(resolve(root, path))
      entries.push({ path: `gdd/${path}`, bytes: bytes.length, sha256: hash(bytes) })
    } else throw new Error(`Unsupported artifact entry: ${path}`)
  }
  return entries
}

// Caller holds the existing Seoul ci.lock for the entire transaction.
export async function deployArtifact({ artifactRoot, siteRoot, sourceCommit, verify }) {
  if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Exact GDD commit required')
  const identity = JSON.parse(await readFile(resolve(artifactRoot, 'build.json'), 'utf8'))
  if (identity.repository !== 'islee23520/seoul-dengoku-gdd' || identity.sourceCommit !== sourceCommit || identity.publicPath !== '/gdd/') throw new Error('GDD artifact identity mismatch')
  if (!(await readFile(resolve(artifactRoot, 'index.html'), 'utf8')).includes('/gdd/assets/')) throw new Error('GDD asset base mismatch')
  const artifactFiles = await files(artifactRoot)
  const manifestPath = resolve(siteRoot, 'deployment-manifest.json')
  const before = await readFile(manifestPath)
  const manifest = JSON.parse(before)
  const next = resolve(siteRoot, `.gdd-next-${sourceCommit}`)
  const previous = resolve(siteRoot, `.gdd-previous-${sourceCommit}`)
  const target = resolve(siteRoot, 'gdd')
  if (!(await lstat(target)).isDirectory()) throw new Error('Existing GDD directory required')
  await cp(artifactRoot, next, { recursive: true, errorOnExist: true, force: false })
  if (JSON.stringify(await files(next)) !== JSON.stringify(artifactFiles)) throw new Error('Copied GDD artifact mismatch')
  manifest.artifacts = [...manifest.artifacts.filter((entry) => !entry.path.startsWith('gdd/')), ...artifactFiles].sort((a, b) => a.path.localeCompare(b.path))
  manifest.files = manifest.artifacts.length
  manifest.gdd = { repository: identity.repository, sourceCommit, artifactDigest: hash(Buffer.from(JSON.stringify(artifactFiles))) }
  await rename(target, previous)
  let moved = false
  try {
    await rename(next, target)
    moved = true
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    await verify(identity)
  } catch (error) {
    if (moved) await rename(target, next)
    await rename(previous, target)
    await writeFile(manifestPath, before)
    await rm(next, { recursive: true, force: true })
    throw error
  }
  await rm(previous, { recursive: true })
  return manifest.gdd
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [artifactRoot, siteRoot, sourceCommit, origin] = process.argv.slice(2)
  const receipt = await deployArtifact({ artifactRoot, siteRoot, sourceCommit, verify: async (identity) => {
    const response = await fetch(new URL('/gdd/build.json', origin), { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) })
    if (!response.ok || (await response.json()).sourceCommit !== identity.sourceCommit) throw new Error('Origin GDD identity mismatch')
    const page = await fetch(new URL('/gdd/rules/', origin), { redirect: 'error', signal: AbortSignal.timeout(10000) })
    if (!page.ok || !(await page.text()).includes('/gdd/assets/')) throw new Error('Origin GDD deep-link mismatch')
  } })
  console.log(`GDD_DEPLOY_PASS ${JSON.stringify(receipt)}`)
}
