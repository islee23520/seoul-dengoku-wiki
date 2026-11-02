import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { materializeGdd } from '../vendor/canon-tools/canon/materialize-gdd.mjs'

const viewerRoot = resolve(import.meta.dirname, '..')
const gddRoot = resolve(viewerRoot, '..')
if (!/^[a-f0-9]{40}$/.test(process.env.GDD_SOURCE_SHA ?? '')) throw new Error('GDD_SOURCE_SHA must be the exact built Git commit')
const pagesRoot = await mkdtemp(resolve(await realpath(tmpdir()), 'gdd-pages-'))
const env = { ...process.env, GDD_ROOT: gddRoot, GDD_PAGES_ROOT: pagesRoot, GDD_SNAPSHOT_ROOT: resolve(gddRoot, 'snapshots/world-game'), TMPDIR: await realpath(tmpdir()) }
delete env.SEOUL_KENSHI_ROOT
delete env.LORE_ROOT

function run(script) {
  return new Promise((accept, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { cwd: viewerRoot, env, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? accept() : reject(new Error(`${script} exited ${code}`)))
  })
}

try {
  await materializeGdd({ gddRoot, outDir: pagesRoot })
  await run('build')
  await run('test')
  await writeFile(resolve(viewerRoot, 'dist/build.json'), `${JSON.stringify({ schemaVersion: 1, repository: 'islee23520/seoul-dengoku-gdd', sourceCommit: process.env.GDD_SOURCE_SHA, publicPath: '/gdd/' }, null, 2)}\n`)
} finally {
  await rm(pagesRoot, { recursive: true, force: true })
}
