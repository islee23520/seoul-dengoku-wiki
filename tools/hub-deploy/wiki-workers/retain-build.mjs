import { mkdir, mkdtemp, cp, rename, rm, readFile, writeFile, lstat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { prepare, sourceIdentity, verifyArtifact } from './artifact.mjs'

// The installed CI build hook calls this before its disposable source cleanup.
// It preserves actual artifacts and source identity; it never writes the run index.
export async function retainBuild({ source, site, receipt, runId, sha, artifactRoot, sourceRoot }) {
  if (!/^\d{8}T\d{6}Z-\d+$/.test(runId)) throw new Error('canonical build run id required')
  const identity = sourceIdentity(source, sha)
  execFileSync('git', ['-C', source, 'merge-base', '--is-ancestor', sha, 'origin/main'])
  const build = JSON.parse(await readFile(receipt, 'utf8'))
  if (build.parentCommit !== sha || build.wikiCommit !== identity.wikiCommit) throw new Error('retained build source mismatch')
  await mkdir(artifactRoot, { recursive: true })
  await mkdir(sourceRoot, { recursive: true })
  const stage = resolve(artifactRoot, `.${runId}.pending`), target = resolve(artifactRoot, runId)
  if (await lstat(target).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error })) throw new Error('retained run already exists')
  await mkdir(stage)
  let sourceStage
  try {
    await cp(site, resolve(stage, 'site'), { recursive: true, errorOnExist: true, force: false })
    const wiki = resolve(stage, 'wiki-upload')
    await prepare(resolve(stage, 'site'), receipt, wiki, sha)
    await cp(resolve(wiki, 'verified-build-receipt.json'), resolve(stage, 'verified-build-receipt.json'))
    await cp(resolve(wiki, 'wiki-artifact-manifest.json'), resolve(stage, 'wiki-artifact-manifest.json'))
    const verified = await verifyArtifact(wiki, sha)
    const retainedSource = resolve(sourceRoot, sha)
    sourceStage = await mkdtemp(resolve(sourceRoot, `.${sha}.${runId}.pending-`))
    const gitEnv = { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' }
    execFileSync('git', ['clone', '--no-hardlinks', '--no-checkout', source, sourceStage], { env: gitEnv })
    const origin = execFileSync('git', ['-C', source, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()
    execFileSync('git', ['-C', sourceStage, 'remote', 'set-url', 'origin', origin])
    const main = execFileSync('git', ['-C', source, 'rev-parse', 'origin/main'], { encoding: 'utf8' }).trim()
    execFileSync('git', ['-C', sourceStage, 'update-ref', 'refs/remotes/origin/main', main])
    execFileSync('git', ['-C', sourceStage, 'checkout', '--detach', sha], { env: gitEnv })
    execFileSync('git', ['-C', sourceStage, 'submodule', 'update', '--init', '--recursive'], { env: gitEnv })
    sourceIdentity(sourceStage, sha)
    execFileSync('git', ['-C', sourceStage, 'merge-base', '--is-ancestor', sha, 'origin/main'])
    const existing = await lstat(retainedSource).catch(error => { if (error.code === 'ENOENT') return null; throw error })
    if (existing) {
      if (!existing.isDirectory() || existing.isSymbolicLink()) throw new Error('retained source must be owned regular directory')
      const retainedIdentity = sourceIdentity(retainedSource, sha)
      if (retainedIdentity.wikiCommit !== identity.wikiCommit || execFileSync('git', ['-C', retainedSource, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim() !== origin) throw new Error('retained source immutable identity mismatch')
      execFileSync('git', ['-C', retainedSource, 'merge-base', '--is-ancestor', sha, 'origin/main'])
      await rm(sourceStage, { recursive: true })
    } else {
      await rename(sourceStage, retainedSource)
    }
    sourceStage = null
    await writeFile(resolve(stage, 'published-tuple.json'), JSON.stringify({ buildRunId: runId, sha, wikiSha: identity.wikiCommit, artifactDigest: verified.manifestSha256 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
    await rename(stage, target)
    return JSON.parse(await readFile(resolve(target, 'published-tuple.json'), 'utf8'))
  } catch (error) {
    await rm(stage, { recursive: true, force: true })
    if (sourceStage) await rm(sourceStage, { recursive: true, force: true })
    throw error
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, site, receipt, runId, sha, artifactRoot, sourceRoot] = process.argv.slice(2)
  try { console.log(JSON.stringify(await retainBuild({ source, site, receipt, runId, sha, artifactRoot, sourceRoot }))) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
