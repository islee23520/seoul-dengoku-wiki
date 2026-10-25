import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const fork = fileURLToPath(new URL('../vendor/seoul-dengoku-inkos/', import.meta.url))
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 16)) {
  console.error('InkOS requires Node.js >=22.16.0')
  process.exit(1)
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, GIT_MASTER: '1' } })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('git', ['submodule', 'update', '--init', '--', 'vendor/seoul-dengoku-inkos'], root)
// Use npm's JS entry point on Windows too, without a shell or a global pnpm dependency.
for (const args of [['install', '--frozen-lockfile'], ['build']]) {
  run(process.execPath, [process.env.npm_execpath, 'exec', '--yes', '--package=pnpm@10', '--', 'pnpm', ...args], fork)
}
