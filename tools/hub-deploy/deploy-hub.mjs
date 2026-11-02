import { access, mkdir, readFile } from 'node:fs/promises'
import { execFileSync, spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const deployDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(deployDir, '../../..')
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
}
const host = argument('--host', process.env.SEOUL_DENGOKU_DEPLOY_HOST)
const output = resolve(argument('--output', resolve(repoRoot, '.omo/deploy/hub')))
const skipBuild = process.argv.includes('--skip-build')
const skipBrowserQa = process.argv.includes('--skip-browser-qa')
const releaseId = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID()}`
const remoteRelease = `E:/git/seoul-dengoku-web/releases/${releaseId}`
const remoteTransactionLock = '/e/git/seoul-dengoku-web/deploy.transaction.lock.d'

if (!host) throw new Error('DEPLOY_HOST_REQUIRED: pass --host user@host or SEOUL_DENGOKU_DEPLOY_HOST')

const run = (command, args, env = process.env) => new Promise((resolvePromise, reject) => {
  const child = spawn(command, args, { cwd: repoRoot, env, stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`DEPLOY_COMMAND_FAILED:${command}:${code}`)))
})

if (!skipBuild) await run('node', ['TOOL/tools/deploy/build-hub-docker.mjs', '--output', output])

const required = [
  'seoul-dengoku-site.tar', 'seoul-dengoku-site.tar.sha256', 'nginx.conf',
  'deploy-windows.ps1', 'check-live-contract.mjs', 'wikiCatalog.ts', 'hub-pages.json',
  'verify-hub-deploy.sh', 'verify-staged-release.mjs', 'promote-release.ps1', 'rollback-release.ps1',
]
for (const file of required) await access(resolve(output, file))

const evidenceDir = resolve(repoRoot, '.omo/evidence/hub-docker-deploy', releaseId)
await mkdir(evidenceDir, { recursive: true })
await run('ssh', [host, `mkdir -p /e/git/seoul-dengoku-web/releases/${releaseId}`])
for (const file of required) await run('scp', ['-q', resolve(output, file), `${host}:${remoteRelease}/${file}`])

await run('ssh', [host, `mkdir ${remoteTransactionLock} && printf '%s' '${releaseId}' > ${remoteTransactionLock}/owner`])

try {
await run('ssh', [host, 'powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', `${remoteRelease}/deploy-windows.ps1`, '-ReleaseRoot', remoteRelease])
for (const file of ['live-http-green.json', 'hub-remote-verify.json', 'deployment-manifest.json']) {
  const remote = file === 'deployment-manifest.json' ? `E:/git/seoul-dengoku-web/site/${file}` : `E:/git/seoul-dengoku-web/${file}`
  await run('scp', ['-q', `${host}:${remote}`, resolve(evidenceDir, file)])
}
if (!skipBrowserQa) {
  const runId = process.env.CI_RUN_ID ?? randomUUID()
  const reportPath = process.env.CI_TEST_REPORT ?? resolve(output, `${runId}.report.json`)
  const sourceSha = process.env.CI_SOURCE_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim()
  await run(process.execPath, [
    process.env.CI_TEST_RUNNER ?? resolve(deployDir, 'run-reported-test.mjs'),
    'test', 'hub-browser-qa', process.execPath,
    resolve(deployDir, 'run-browser-contract-qa.mjs'),
    resolve(evidenceDir, 'browser-contract-qa.json'),
  ], { ...process.env, CI_RUN_ID: runId, CI_TEST_REPORT: reportPath, CI_SOURCE_SHA: sourceSha })
  console.log(`HUB_BROWSER_QA_REPORT path=${reportPath}`)
}

} finally {
  await run('ssh', [host, `test "$(cat ${remoteTransactionLock}/owner)" = '${releaseId}' && rm -rf ${remoteTransactionLock}`])
}

await run('ssh', [host, `rm -rf ${remoteRelease.replace('E:/', '/e/')}`])

const digest = (await readFile(resolve(output, 'seoul-dengoku-site.tar.sha256'), 'utf8')).trim().split(/\s+/)[0]
console.log(`HUB_DEPLOY_PASS host=${host} sha256=${digest} evidence=${evidenceDir}`)
