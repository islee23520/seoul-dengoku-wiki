import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const deployDir = dirname(fileURLToPath(import.meta.url))

test('Docker builder is reproducible and exports the complete deployment contract', async () => {
  const dockerfile = await readFile(resolve(deployDir, 'hub.Dockerfile'), 'utf8')
  const script = await readFile(resolve(deployDir, 'build-hub-in-docker.sh'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(deployDir, 'hub-pages.json'), 'utf8'))

  assert.match(dockerfile, /node:26-bookworm-slim@sha256:[a-f0-9]{64}/)
  assert.match(script, /npm ci --prefix GAME-LOGIC\/wiki-react/)
  assert.match(script, /node GAME-LOGIC\/site\/scripts\/gate\.mjs/)
  assert.match(script, /node TOOL\/tools\/design-store\/seed-from-canon\.mjs/)
  assert.match(script, /npm --prefix GAME-LOGIC\/wiki-react run test:contract/)
  assert.match(script, /seoul-dengoku-site\.tar/)
  const verifyScript = await readFile(resolve(deployDir, 'verify-hub-deploy.sh'), 'utf8')
  assert.match(verifyScript, /await fetch\(`http:\/\/127\.0\.0\.1:8080/)
  assert.doesNotMatch(verifyScript, /curl/)
  assert.match(verifyScript, /"\$INPUT_ROOT\/seoul-dengoku-site\.tar"/)
  assert.match(await readFile(resolve(deployDir, 'build-hub-docker.mjs'), 'utf8'), /resolve\(deployDir, 'hub\.Dockerfile'\)/)
  assert.match(await readFile(resolve(deployDir, 'run-browser-contract-qa.mjs'), 'utf8'), /start < 232; start \+= 12/)
  assert.match(await readFile(resolve(deployDir, 'browser-contract-qa.js'), 'utf8'), /\{ start: start1, end: end1 \}/)
  const deployScript = await readFile(resolve(deployDir, 'deploy-hub.mjs'), 'utf8')
  assert.match(deployScript, /releases\/\$\{releaseId\}/)
  assert.match(deployScript, /'-ReleaseRoot', remoteRelease/)
  assert.match(deployScript, /mkdir \$\{remoteTransactionLock\}/)
  assert.match(await readFile(resolve(deployDir, '../../../GAME-LOGIC/wiki-react/deploy/deploy-windows.ps1'), 'utf8'), /if \(\$promoted -and \(Test-Path \$previous\)\)/)
  assert.match(await readFile(resolve(deployDir, '../../../GAME-LOGIC/site/scripts/mount.mjs'), 'utf8'), /'AGENTS\.md'/)
  assert.match(await readFile(resolve(deployDir, '../design-store/seed-from-canon.mjs'), 'utf8'), /endsWith\('AGENTS\.md'\)/)
  assert.match(await readFile(resolve(deployDir, '../design-store/seed-from-canon.mjs'), 'utf8'), /startsWith\('wiki-react\/'\)/)
  assert.ok(manifest.pages.some((page) => page.target === 'play'))
  assert.ok(manifest.pages.some((page) => page.target === 'system-design'))
  assert.ok(manifest.pages.some((page) => page.target === 'portrait-gen'))
})
