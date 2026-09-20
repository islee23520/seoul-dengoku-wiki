import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('main pushes deploy through the dedicated Windows runner', async () => {
  const workflow = await readFile('.github/workflows/deploy-windows-hub.yml', 'utf8')
  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/)
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /group: seoul-dengoku-windows-production/)
  assert.match(workflow, /cancel-in-progress: false/)
  assert.match(workflow, /runs-on: \[self-hosted, Windows, X64, seoul-dengoku\]/)
  assert.match(workflow, /Repair stale private submodule metadata/)
  assert.match(workflow, /git -C \$env:GITHUB_WORKSPACE submodule deinit -f --all/)
  assert.match(workflow, /\.git\\modules\\TOOL\\portrait-gen/)
  assert.match(workflow, /\.git\\modules\\TOOL\\unity-remote/)
  assert.match(workflow, /submodules: false/)
  assert.match(workflow, /git submodule update --init --recursive --force/)
  assert.match(workflow, /token: \$\{\{ secrets\.SUBMODULES_PAT \}\}/)
  assert.match(workflow, /TOOL\\tools\\deploy\\deploy-hub-local-windows\.ps1/)
  assert.match(workflow, /E:\\git\\seoul-dengoku-web/)
})

test('local Windows deploy reuses Docker build and atomic promotion', async () => {
  const script = await readFile('TOOL/tools/deploy/deploy-hub-local-windows.ps1', 'utf8')
  assert.match(script, /build-hub-docker\.mjs/)
  assert.match(script, /deploy-windows\.ps1/)
  assert.match(script, /HUB_DEPLOY_PASS/)
  assert.match(script, /hub-docker-deploy\\latest/)
})

test('runner setup stays under E drive and registers production labels', async () => {
  const script = await readFile('TOOL/tools/deploy/setup-github-runner-windows.ps1', 'utf8')
  assert.match(script, /E:\\git\\github-runner-seoul-kenshi/)
  assert.match(script, /RepositoryUrl/)
  assert.match(script, /\$Labels = "seoul-dengoku"/)
  assert.match(script, /--labels \$Labels/)
  assert.match(script, /--runasservice/)
  assert.match(script, /CurrentVersion\\Run/)
  assert.match(script, /Start-Process/)
  assert.match(script, /WindowsPrincipal/)
})
