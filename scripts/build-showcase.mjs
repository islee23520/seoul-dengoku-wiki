import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = resolve(root, 'artifacts/seoul-showcase')
const npmCli = process.env.npm_execpath ?? resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
const npmCommand = existsSync(npmCli) ? [process.execPath, npmCli] : ['npm']

for (const args of [['ci', '--ignore-scripts'], ['run', 'typecheck'], ['run', 'build']]) {
  const result = spawnSync(npmCommand[0], [...npmCommand.slice(1), ...args], {
    cwd: app,
    env: { ...process.env, BASE_PATH: '/wiki/seoul-showcase/' },
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const destination = resolve(root, 'dist/seoul-showcase')
await rm(destination, { recursive: true, force: true })
await cp(resolve(app, 'dist/public'), destination, { recursive: true })
console.log('SHOWCASE_BUILD_PASS: dist/seoul-showcase → /wiki/seoul-showcase/')
