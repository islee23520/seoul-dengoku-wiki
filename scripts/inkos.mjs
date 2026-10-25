import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../vendor/seoul-dengoku-inkos/packages/cli/dist/index.js', import.meta.url))
if (!existsSync(cli)) {
  console.error('Run npm run inkos:install before using the fork CLI.')
  process.exit(1)
}
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: process.env.INIT_CWD ?? process.cwd(),
  stdio: 'inherit',
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
