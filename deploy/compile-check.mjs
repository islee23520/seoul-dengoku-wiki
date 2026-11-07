#!/usr/bin/env node
// Compile only committed public projections. Generation and installation belong
// to earlier, separate jobs; this command never opens PostgreSQL or runs npm.
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { checkStaticSnapshot, committedTree, committedBytes } from '../scripts/check-static-snapshot.mjs'
import { assertPublicBytes, regularBytes, sha256, treeFiles } from '../scripts/render-export.mjs'

const exec = promisify(execFile)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export function assertOfflineEnvironment(env) {
  if (Object.keys(env).some(key => /^(?:PG[A-Z_]*|DATABASE_URL|WIKI_.*(?:PG|PSQL|DATABASE|DOCUMENT_DB|MIGRATION_SQLITE)(?:_FILE)?)$/u.test(key))) throw new Error('E_STATIC_PG_ENV')
  // NODE_OPTIONS can preload arbitrary code before any CLI guard executes.
  if (env.NODE_OPTIONS || env.NODE_PATH) throw new Error('E_STATIC_NODE_ENV')
}

export const compileInput = path => (path.startsWith('src/') && !/^src\/generated(?:-private)?\//u.test(path))
  || /^(?:index\.html|package\.json|tsconfig(?:\.[\w-]+)?\.json|vite\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s)$/u.test(path)

export async function materializeStatic({ root, snapshot, stage }) {
  const tree = await committedTree(root)
  const put = async (path, bytes) => {
    await mkdir(dirname(join(stage, path)), { recursive: true })
    await writeFile(join(stage, path), bytes, { flag: 'wx' })
  }
  for (const path of [...tree.keys()].filter(compileInput)) await put(path, await committedBytes(root, path, tree))
  const manifest = JSON.parse(await regularBytes(snapshot, 'manifest.json'))
  for (const file of manifest.files) {
    if (file.source === null) continue // GitHub review Markdown is not a build input.
    const bytes = file.storage === 'tracked' ? await committedBytes(root, file.source, tree) : await regularBytes(snapshot, file.path)
    if (sha256(bytes) !== file.sha256) throw new Error('E_STATIC_INPUT_CHANGED')
    await put(file.source, bytes)
  }
  await mkdir(join(stage, 'public'), { recursive: true })
}

export async function compileCheck({ root = projectRoot, env = process.env } = {}) {
  assertOfflineEnvironment(env)
  root = resolve(root)
  const snapshot = join(root, 'renders')
  const checked = await checkStaticSnapshot({ root })
  const stage = await mkdtemp(join(tmpdir(), 'wiki-static-compile-'))
  try {
    await materializeStatic({ root, snapshot, stage })
    // Resolve the platform's already-installed, lockfile-pinned tools. Never
    // use npx, a global Vite, lifecycle scripts, .env files or live public/.
    await symlink(join(root, 'node_modules'), join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
    const childEnv = { ...env, CI: '1' }
    for (const [tool, args] of [
      ['typescript/bin/tsc', ['-b']],
      ['vite/bin/vite.js', ['build', '--mode', 'production']],
    ]) {
      const result = await exec(process.execPath, [join(root, 'node_modules', tool), ...args], { cwd: stage, env: childEnv, maxBuffer: 16 * 1024 * 1024 })
      if (result.stdout) process.stderr.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)
    }
    const { artifactFailures } = await import('../scripts/check-artifact-allowlist.mjs')
    const failures = await artifactFailures({ distRoot: join(stage, 'dist'),
      allowlist: JSON.parse(await regularBytes(root, 'artifact-allowlist.json')),
      appSource: await readFile(join(stage, 'src/App.tsx'), 'utf8') })
    if (failures.length) throw new Error(`E_STATIC_ARTIFACT: ${failures.join('\n')}`)
    const files = []
    for (const path of await treeFiles(join(stage, 'dist'))) {
      const bytes = await regularBytes(join(stage, 'dist'), path)
      assertPublicBytes(bytes)
      files.push({ path, bytes: bytes.length, sha256: sha256(bytes) })
    }
    return { ...checked, format: 'wiki-static-compile/1', status: 'passed',
      artifactFiles: files.length, artifactBytes: files.reduce((sum, file) => sum + file.bytes, 0),
      artifactDigest: `sha256:${sha256(JSON.stringify(files))}`, database: 'not-used', network: 'not-used' }
  } finally { await rm(stage, { recursive: true, force: true }) }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') console.log('Usage: node deploy/compile-check.mjs\nCompile committed renders/ and tracked frontend inputs with local tsc/Vite, then check artifacts. Requires npm ci --ignore-scripts beforehand. No PG, generation, install or network; temporary output is removed. A missing first snapshot is an error, never a skipped success.')
  else if (args.length) { console.error('E_STATIC_ARGUMENT'); process.exitCode = 1 }
  else compileCheck().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1 })
}
