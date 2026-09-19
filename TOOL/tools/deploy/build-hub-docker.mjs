import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const deployDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(deployDir, '../../..')
const outputIndex = process.argv.indexOf('--output')
const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : resolve(repoRoot, '.omo/deploy/hub'))
const image = 'seoul-dengoku-hub-builder:local'

const run = (command, args) => new Promise((resolvePromise, reject) => {
  const child = spawn(command, args, { cwd: repoRoot, stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`DEPLOY_COMMAND_FAILED:${command}:${code}`)))
})

await mkdir(output, { recursive: true })
await run('docker', ['build', '-f', resolve(deployDir, 'hub.Dockerfile'), '-t', image, deployDir])
await run('docker', [
  'run', '--rm',
  '--mount', `type=bind,src=${repoRoot},dst=/repo,readonly`,
  '--mount', `type=bind,src=${output},dst=/out`,
  image,
])

console.log(`HUB_DOCKER_OUTPUT:${output}`)
