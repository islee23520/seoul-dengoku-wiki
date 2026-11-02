import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'
import { hubSourceSha } from './hub-inputs.mjs'
import { access, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { test } from 'vitest'
import { fileURLToPath } from 'node:url'

const deployDir = dirname(fileURLToPath(import.meta.url))
const execute = promisify(execFile)

test('Docker source identity resolves linked worktree HEAD on host and rejects an unrelated override', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'hub-worktree-identity-'))
  const repository = resolve(directory, 'repository'), worktree = resolve(directory, 'worktree')
  try {
    await execute('git', ['init', repository])
    await execute('git', ['-C', repository, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'fixture'])
    await execute('git', ['-C', repository, 'worktree', 'add', '--detach', worktree, 'HEAD'])
    const expected = (await execute('git', ['-C', repository, 'rev-parse', 'HEAD'])).stdout.trim()
    assert.match(await readFile(resolve(worktree, '.git'), 'utf8'), /^gitdir: /)
    assert.equal(hubSourceSha(worktree, {}), expected)
    assert.equal(hubSourceSha(worktree, { CI_SOURCE_SHA: expected }), expected)
    assert.throws(() => hubSourceSha(worktree, { CI_SOURCE_SHA: '0'.repeat(40) }), /HUB_SOURCE_SHA_MISMATCH/)
    const builder = await readFile(resolve(deployDir, 'build-hub-docker.mjs'), 'utf8')
    assert.match(builder, /hubSourceSha\(repoRoot, process\.env\)/)
    assert.match(builder, /`CI_SOURCE_SHA=\$\{sourceSha\}`/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('Docker license copy preserves the pinned authoritative bytes and fails without its source', async () => {
  const script = await readFile(resolve(deployDir, 'build-hub-in-docker.sh'), 'utf8')
  const command = script.match(/^cp GDD\/LICENSE[^\n]*$/m)[0]
  const pagesRoot = await mkdtemp(resolve(tmpdir(), 'hub-license-'))
  try {
    const options = { cwd: resolve(deployDir, '../../..'), env: { ...process.env, GDD_PAGES_ROOT: pagesRoot }, stdio: 'pipe' }
    execFileSync('bash', ['-euc', command], options)
    assert.deepEqual(await readFile(resolve(pagesRoot, 'LICENSE.md')), await readFile(resolve(deployDir, '../../../GDD/LICENSE')))
    assert.throws(() => execFileSync('bash', ['-euc', command], { ...options, cwd: pagesRoot }), (error) => error.status !== 0)
  } finally {
    await rm(pagesRoot, { recursive: true, force: true })
  }
})

test('Docker source copy inputs exist in the current repository', async () => {
  const script = await readFile(resolve(deployDir, 'build-hub-in-docker.sh'), 'utf8')
  const inputs = script.match(/for path in ([\s\S]*?); do/)[1].replaceAll('\\', '').trim().split(/\s+/)
  for (const input of inputs) {
    if (input === 'GAME/Builds/WebGL') continue // CI supplies this ignored generated artifact.
    await access(resolve(deployDir, '../../..', input))
  }
})

test('private service copy loop preserves the candidate migration bytes', async () => {
  const script = await readFile(resolve(deployDir, 'build-hub-in-docker.sh'), 'utf8')
  const command = script.match(/  for path in package\.json[\s\S]*?\n  done/)[0]
  const work = await mkdtemp(resolve(tmpdir(), 'feedback-service-copy-'))
  try {
    await mkdir(resolve(work, 'TOOL/feedback-service'), { recursive: true })
    await execute('bash', ['-euc', command], { env: { ...process.env, SOURCE_ROOT: resolve(deployDir, '../../..'), WORK_ROOT: work } })
    assert.deepEqual(await readFile(resolve(work, 'TOOL/feedback-service/candidate-schema.sql')),
      await readFile(resolve(deployDir, '../../feedback-service/candidate-schema.sql')))
  } finally { await rm(work, { recursive: true, force: true }) }
})

test('Docker builder is reproducible and exports the complete deployment contract', async () => {
  const dockerfile = await readFile(resolve(deployDir, 'hub.Dockerfile'), 'utf8')
  const script = await readFile(resolve(deployDir, 'build-hub-in-docker.sh'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(deployDir, 'hub-pages.json'), 'utf8'))

  assert.match(dockerfile, /node:26-bookworm-slim@sha256:[a-f0-9]{64}/)
  assert.match(script, /npm ci --prefix WIKI --ignore-scripts/)
  assert.match(script, /npm ci --prefix GDD\/viewer --ignore-scripts/)
  assert.match(script, /react-dom@18\.3\.1 vitest@5\.0\.2/)
  assert.match(script, /\(cd "\$WORK_ROOT\/hub-ui" && npx vitest run test\/components\.test\.mjs\)/)
  assert.doesNotMatch(script, /node --test/)
  assert.match(script, /\(cd TOOL\/tools && npx vitest run doc-publishing\/test-publication-manifest\.mjs\)/)
  assert.match(script, /\(cd TOOL\/tools && npx vitest run deploy\/test-verify-publication-bundles\.mjs\)/)
  assert.match(script, /\(cd TOOL\/tools && npx vitest run wiki\/test-retired-reference-terms\.mjs\)/)
  assert.match(script, /\(cd TOOL\/tools && npx vitest run wiki\/test-wiki-parity\.mjs\)/)
  assert.match(script, /npm --prefix TOOL\/document-renderer test/)
  assert.ok(script.indexOf('npm --prefix TOOL/document-renderer run build') < script.indexOf('node TOOL/tools/canon/materialize-gdd.mjs'), 'renderer must be built before GDD materialization')
  assert.doesNotMatch(script, /GDD\/vendor\/document-renderer/)
  assert.match(script, /npm --prefix GDD\/viewer run build/)
  assert.match(script, /npm --prefix GDD\/viewer test/)
  assert.ok(script.indexOf('export GDD_PAGES_ROOT=') < script.indexOf('npm --prefix GDD/viewer run build'))
  assert.doesNotMatch(script, /build:gdd|test:gdd/)
  assert.ok(script.indexOf('export GDD_PAGES_ROOT=') < script.indexOf('node TOOL/tools/design-store/seed-from-canon.mjs'))
  assert.match(script, /\bGDD WIKI\b/)
  assert.doesNotMatch(script, /GAME\/Builds\/WebGL/)
  assert.match(script, /tar -C \/feedback-wiki/)
  assert.match(script, /package-private-feedback\.mjs/)
  assert.ok(script.match(/for path in package\.json ([^;]+); do/)[1].split(/\s+/).includes('candidate-schema.sql'))
  assert.doesNotMatch(script, /\bGAME\/play\b/)
  assert.match(script, /node WIKI\/scripts\/gate\.mjs/)
  assert.doesNotMatch(script, /patina-human-gate|patina-human-receipt/)
  assert.match(dockerfile, /pip3 install --no-cache-dir --break-system-packages jsonschema==\d+\.\d+\.\d+/, 'lore JSON schema runner needs jsonschema with referencing')
  const atlasCheck = 'node TOOL/tools/wiki/materialize-world-atlas.mjs --atlas WIKI/lore/World-Narrative-Atlas.json --out WIKI/lore --check'
  assert.ok(script.includes(atlasCheck))
  const loreCheck = await readFile(resolve(deployDir, 'check-hub-lore.mjs'), 'utf8')
  assert.match(loreCheck, /lore-json-validate-ledger\.mjs/)
  assert.match(loreCheck, /PROJECTION_PATHS/)
  assert.match(loreCheck, /WIKI\/scripts\/lore-json-validate\.mjs/)
  assert.match(script, /node "\$CI_TEST_RUNNER" test hub-lore-schema node TOOL\/tools\/deploy\/check-hub-lore\.mjs/)
  assert.ok(script.indexOf(atlasCheck) < script.indexOf('npm --prefix WIKI run build'), 'atlas projections are checked before catalog admission')
  assert.ok(script.indexOf('node TOOL/tools/deploy/check-hub-lore.mjs') < script.indexOf('npm --prefix WIKI run build'))
  // Lore pages are JSON-only: the dictionary behind the Glossary page and the offices/structures sources are checked in place, never materialized.
  for (const check of ['node TOOL/tools/wiki/verify-glossary.mjs', 'node TOOL/tools/wiki/offices-render.mjs --check', 'node TOOL/tools/wiki/structures-render.mjs --check']) {
    assert.ok(script.includes(check), check)
    assert.ok(script.indexOf(check) < script.indexOf('npm --prefix WIKI run build'), `${check} runs before the wiki build`)
  }
  assert.doesNotMatch(script, /WIKI\/wiki-source|docs:build|vitepress/)
  assert.ok(script.indexOf('npm --prefix WIKI run build') < script.indexOf('node WIKI/scripts/gate.mjs'))
  assert.ok(script.indexOf('node WIKI/scripts/gate.mjs') < script.indexOf('node TOOL/tools/deploy/hub-deploy.mjs'))
  assert.match(script, /node TOOL\/tools\/design-store\/seed-from-canon\.mjs/)
  assert.match(script, /node TOOL\/tools\/canon\/materialize-gdd\.mjs --gdd GDD --out "\$GDD_PAGES_ROOT"/)
  assert.match(script, /export GDD_PAGES_ROOT="\$WORK_ROOT\/gdd-pages"/)
  assert.match(script, /cp GDD\/LICENSE "\$GDD_PAGES_ROOT\/LICENSE\.md"/)
  assert.doesNotMatch(script, /cp GDD\/adr\/\*\.md/)
  assert.match(script, /cp GDD\/system-design\/README\.md "\$GDD_PAGES_ROOT\/system-design\/"/)
  assert.doesNotMatch(script, /campaign-pov-authority|total-war-ui\/generate-map-data/)
  assert.ok(script.indexOf('materialize-gdd.mjs') < script.indexOf('npm --prefix WIKI run build'))
  for (const command of ['test:contract', 'test:admission', 'test:categories', 'test:document-renderer', 'test:links', 'test:states', 'test:assets', 'test:people', 'test:person-details', 'test:territory-map', 'test:timeline', 'test:discovery']) {
    assert.ok(script.includes(`npm --prefix WIKI run ${command}`))
  }
  assert.match(script, /node TOOL\/tools\/deploy\/verify-publication-bundles\.mjs "\$WORK_ROOT"/)
  assert.match(script, /--wiki-dist WIKI\/dist/)
  assert.match(script, /generate-nginx\.mjs WIKI\/deploy\/nginx\.conf/)
  for (const file of ['deploy-windows.ps1', 'promote-release.ps1', 'rollback-release.ps1', 'check-live-contract.mjs']) {
    assert.ok(script.includes(`cp WIKI/deploy/${file}`))
  }
  assert.match(script, /cp WIKI\/src\/generated\/wikiCatalog\.ts/)
  assert.doesNotMatch(script, /WIKI\/wiki(?:\/|\b)/)
  assert.match(script, /seoul-dengoku-site\.tar/)
  assert.match(script, /WORK_ROOT=\$\{WORK_ROOT:-\$OUTPUT_ROOT\/work\}/)
  assert.doesNotMatch(script, /GAME-REFERENCE\/assets/)
  assert.match(script, /RESEARCH\/verification/)
  assert.doesNotMatch(script, /GDD LORE WIKI/)
  assert.match(script, /GAME\/Assets\/Janseon\/Data\/Content\/SeoulWorldGraph\.json/)
  assert.doesNotMatch(script, /generate-map-data\.mjs/)
  assert.doesNotMatch(script, /TOOL\/avatar-gen\/portrait/)
  assert.doesNotMatch(script, /TOOL\/portrait-gen/)
  assert.doesNotMatch(script, /GAME\/Builds\/WebGL/)
  assert.match(script, /TOOL\/avatar-gen\/viewer/)
  assert.match(script, /ART-ASSETS\/avatar-gen\/runtime\/female-underwear/)
  assert.doesNotMatch(script, /GDD\/system-design\/regions/)
  assert.match(script, /rm -rf "\$WORK_ROOT"/)
  assert.match(script, /--hub-index index\.html/)
  assert.match(script, /TOOL\/shared-web-ui\/seoul-dengoku-shared-web-ui-0\.1\.2\.tgz/)
  assert.match(script, /--hub-package-root hub-ui/)
  const verifyScript = await readFile(resolve(deployDir, 'verify-hub-deploy.sh'), 'utf8')
  assert.match(verifyScript, /await fetch\(`http:\/\/127\.0\.0\.1:8080/)
  assert.doesNotMatch(verifyScript, /curl/)
  assert.match(verifyScript, /"\$INPUT_ROOT\/seoul-dengoku-site\.tar"/)
  const dockerBuilder = await readFile(resolve(deployDir, 'build-hub-docker.mjs'), 'utf8')
  assert.match(dockerBuilder, /resolve\(deployDir, 'hub\.Dockerfile'\)/)
  assert.doesNotMatch(dockerBuilder, /portrait-gen/)
  assert.match(await readFile(resolve(deployDir, 'run-browser-contract-qa.mjs'), 'utf8'), /start < contract\.documents\.length; start \+= 12/)
  assert.match(await readFile(resolve(deployDir, 'browser-contract-qa.js'), 'utf8'), /\{ start: start1, end: end1 \}/)
  const deployScript = await readFile(resolve(deployDir, 'deploy-hub.mjs'), 'utf8')
  assert.match(deployScript, /releases\/\$\{releaseId\}/)
  assert.match(deployScript, /'-ReleaseRoot', remoteRelease/)
  assert.match(deployScript, /mkdir \$\{remoteTransactionLock\}/)
  const windowsDeploy = await readFile(resolve(deployDir, '../../../WIKI/deploy/deploy-windows.ps1'), 'utf8')
  assert.match(windowsDeploy, /if \(\$promoted -and \(Test-Path \$previous\)\)/)
  assert.match(windowsDeploy, /manifestVerifier/)
  assert.doesNotMatch(windowsDeploy, /-lt 230/)
  assert.match(windowsDeploy, /System32\\tar\.exe/)
  assert.match(windowsDeploy, /Invoke-Native \$tarExecutable @\("-xf", \$archive, "-C", \$next\)/)
  assert.doesNotMatch(windowsDeploy, /\.\.\\\.\.\\site-next/)
  assert.match(windowsDeploy, /Invoke-Native "node" @\(\$postVerifyScript/)
  assert.doesNotMatch(windowsDeploy, /Invoke-Native "bash" @\(\$postVerifyScript/)
  const seedScript = await readFile(resolve(deployDir, '../design-store/seed-from-canon.mjs'), 'utf8')
  assert.match(seedScript, /endsWith\('AGENTS\.md'\)/)
  assert.match(seedScript, /startsWith\('design-store\/'\)/)
  assert.match(seedScript, /process\.env\.GDD_PAGES_ROOT \|\| join\(repoRoot, 'GDD'\)/)
  assert.match(seedScript, /\{ root: pagesRoot, prefix: 'GDD'/)
  assert.ok(!manifest.pages.some((page) => page.target === 'play'))
  assert.ok(!manifest.pages.some((page) => page.target === 'GAME-play'))
  assert.deepEqual(manifest.pages.find((page) => page.target === 'gdd'), { id: 'gdd', source: 'GDD/viewer/dist', target: 'gdd', required: true, entry: 'index.html' })
  assert.ok(!manifest.pages.some((page) => page.target === 'system-design'))
  assert.ok(!manifest.pages.some((page) => page.target === 'portrait-gen'))
  assert.ok(!manifest.pages.some((page) => page.target === 'avatar/portrait'))
  assert.ok(!manifest.pages.some((page) => page.target === 'total-war-ui'))
  assert.ok(!manifest.pages.some((page) => page.target === 'system-design/regions'))
  assert.ok(!manifest.pages.some((page) => page.target === 'ui-layout-moodboard'))
  assert.ok(!manifest.pages.some((page) => page.target === 'ui-ux-refs'))
  const avatarPage = manifest.pages.find((page) => page.target === 'avatar')
  assert.deepEqual(avatarPage, {
    id: 'avatar',
    source: 'TOOL/avatar-gen/viewer',
    target: 'avatar',
    required: true,
    entry: 'index.html',
    assets: [{
      source: 'ART-ASSETS/avatar-gen/runtime/female-underwear',
      target: 'female-underwear',
      files: ['avatar-contract.json', 'female-underwear.glb'],
    }],
  })
  const wikiPackage = JSON.parse(await readFile(resolve(deployDir, '../../../WIKI/package.json'), 'utf8'))
  assert.equal(wikiPackage.scripts.build, 'npm run generate && tsc -b && vite build')
  const nginx = await readFile(resolve(deployDir, '../../../WIKI/deploy/nginx.conf'), 'utf8')
  assert.match(nginx, /location \/wiki\//)
  assert.match(nginx, /location = \/wiki\//)
  assert.match(nginx, /return 308 https:\/\/\$host\/wiki\//)
  assert.match(nginx, /\/wiki\/index\.html/)
  assert.match(nginx, /location \/gdd\//)
  assert.match(nginx, /location = \/gdd\//)
  assert.match(nginx, /\/gdd\/index\.html/)
  const nginxGenerator = await readFile(resolve(deployDir, 'generate-nginx.mjs'), 'utf8')
  assert.match(nginxGenerator, /location ~ \^\/avatar\/\.\*\\\\\.mjs\$/)
  assert.match(nginxGenerator, /default_type application\/javascript/)
  assert.match(script, /generate-nginx\.mjs/)
  assert.match(nginx, /Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always/)
  assert.match(nginx, /Cache-Control "public, max-age=31536000, immutable" always/)
  assert.doesNotMatch(nginx, /expires 1y/)
  assert.doesNotMatch(nginx, /location \/wiki\/wiki-assets\/ \{\s*expires 7d/)
  assert.match(verifyScript, /cache-control/)
  assert.match(verifyScript, /no-store/)
  const hubIndex = await readFile(resolve(deployDir, '../../../index.html'), 'utf8')
  assert.doesNotMatch(hubIndex, /system-design\/regions/)
  const liveContract = await readFile(resolve(deployDir, '../../../WIKI/deploy/check-live-contract.mjs'), 'utf8')
  assert.match(liveContract, /redirectRoutes = new Map/)
  assert.match(liveContract, /\/system-design\/regions\//)
  assert.match(liveContract, /\/wiki\/world\/World-and-Subway-Layers/)
  assert.match(liveContract, /redirect-location/)
  assert.match(liveContract, /new URL\(location, baseUrl\)\.pathname/)
  const catalogGenerator = await readFile(resolve(deployDir, '../../../WIKI/scripts/generate-catalog.mjs'), 'utf8')
  assert.match(catalogGenerator, /TOOL\/tools\/regions\/data\/atlas-data\.js/)
  assert.doesNotMatch(catalogGenerator, /GDD\/system-design\/regions\/atlas-data\.js/)
  assert.match(nginx, /location = \/system-design\/regions\/ \{/)
  assert.match(nginx, /return 308 \/wiki\/world\/World-and-Subway-Layers/)
})
