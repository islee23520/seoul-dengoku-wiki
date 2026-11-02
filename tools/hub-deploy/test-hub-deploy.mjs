import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'vitest'
import { fileURLToPath } from 'node:url'

const deployDir = dirname(fileURLToPath(import.meta.url))
const modulePath = resolve(deployDir, 'hub-deploy.mjs')

test('public page allowlists reject missing files, traversal and links into nested evidence before staging', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-portrait-list-errors-'))
  try {
    const output = join(root, 'output'), source = join(root, 'portrait')
    await mkdir(join(source, 'evidence'), { recursive: true })
    await mkdir(output)
    await writeFile(join(output, 'sentinel'), 'keep prior stage')
    await writeFile(join(source, 'index.html'), '<h1>fixture</h1>')
    await writeFile(join(source, 'evidence/private.json'), '{"private":"fixture"}')
    const page = { id: 'avatar-portrait', source: 'portrait', target: 'avatar/portrait', entry: 'index.html', required: true }
    const stage = files => stageHub({ root, output, wikiDist: 'wiki', pages: [{ ...page, files }] })
    await assert.rejects(stage(['index.html', 'missing.png']), /DEPLOY_PAGE_FILE_MISSING/)
    await assert.rejects(stage(['index.html', '../outside.png']), /DEPLOY_PAGE_FILE_INVALID/)
    await assert.rejects(stage(['portrait.css']), /DEPLOY_PAGE_FILES_INVALID/)
    await symlink(join(source, 'evidence/private.json'), join(source, 'catalog.json'))
    await assert.rejects(stage(['index.html', 'catalog.json']), /DEPLOY_PAGE_FILE_SYMLINK/)
    assert.equal(await readFile(join(output, 'sentinel'), 'utf8'), 'keep prior stage')
    assert.equal(await readFile(join(source, 'evidence/private.json'), 'utf8'), '{"private":"fixture"}')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('browser QA failure fails the command after promotion without rollback; transport failure still stops deployment', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hub-qa-nonblocking-'))
  const tracePath = join(root, 'trace.jsonl')
  try {
    const output = join(root, 'output')
    await mkdir(output)
    const required = ['seoul-dengoku-site.tar', 'seoul-dengoku-site.tar.sha256', 'nginx.conf',
      'deploy-windows.ps1', 'check-live-contract.mjs', 'wikiCatalog.ts', 'hub-pages.json',
      'verify-hub-deploy.sh', 'verify-staged-release.mjs', 'promote-release.ps1', 'rollback-release.ps1']
    for (const file of required) await writeFile(join(output, file), file === 'seoul-dengoku-site.tar' ? 'candidate-artifact' : 'fixture')
    const preload = join(root, 'transport.mjs')
    await writeFile(preload, `
      import cp from 'node:child_process'
      import { appendFileSync } from 'node:fs'
      import { syncBuiltinESMExports } from 'node:module'
      const original = cp.spawn
      cp.spawn = (command, args, options) => {
        if (command === 'ssh' || command === 'scp') {
          appendFileSync(process.env.FIXTURE_TRACE, JSON.stringify({ command, args }) + '\\n')
          let program = 'process.exit(0)'
          if (command === 'ssh' && args.some(arg => arg.endsWith('/deploy-windows.ps1'))) {
            program = 'require("node:fs").copyFileSync(process.env.FIXTURE_ARCHIVE, process.env.FIXTURE_LIVE)'
          }
          if (command === 'scp' && process.env.FIXTURE_TRANSFER_FAIL === '1') program = 'process.exit(9)'
          return original(process.execPath, ['-e', program], options)
        }
        if ((command === 'node' || command === process.execPath) && args[0]?.endsWith('/run-browser-contract-qa.mjs')) {
          appendFileSync(process.env.FIXTURE_TRACE, JSON.stringify({ command: 'browser-qa', args }) + '\\n')
          const program = 'require("node:fs").writeFileSync(process.argv[1], JSON.stringify({status:"FAIL", failures:["fixture-title-mismatch"]})); console.log("tests 1\\\\npass 0\\\\nfail 1\\\\nskipped 0\\\\ntodo 0\\\\ncancelled 0"); process.exit(7)'
          return original(process.execPath, ['-e', program, args[1]], options)
        }
        return original(command, args, options)
      }
      syncBuiltinESMExports()
    `)
    const livePath = join(root, 'live')
    const reportPath = join(root, 'run.report.json')
    const env = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${preload}`,
      FIXTURE_TRACE: tracePath, FIXTURE_ARCHIVE: join(output, 'seoul-dengoku-site.tar'), FIXTURE_LIVE: livePath,
      CI_TEST_RUNNER: resolve(deployDir, 'run-reported-test.mjs'), CI_TEST_REPORT: reportPath,
      CI_RUN_ID: 'browser-fixture', CI_SOURCE_SHA: 'b'.repeat(40) }
    await writeFile(livePath, 'previous-artifact')
    const result = spawnSync(process.execPath, [resolve(deployDir, 'deploy-hub.mjs'), '--host', 'fixture-only', '--skip-build', '--output', output], { env, encoding: 'utf8', timeout: 30000 })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /DEPLOY_COMMAND_FAILED:.*:7/)
    assert.equal(await readFile(livePath, 'utf8'), 'candidate-artifact')
    assert.doesNotMatch(result.stdout, /HUB_DEPLOY_PASS/)
    const report = JSON.parse(await readFile(reportPath, 'utf8'))
    assert.equal(report.runId, env.CI_RUN_ID)
    assert.equal(report.sourceSha, env.CI_SOURCE_SHA)
    assert.equal(report.testStatus, 'FAIL')
    assert.equal(report.steps[0].name, 'hub-browser-qa')
    assert.equal(report.steps[0].exitCode, 7)
    assert.deepEqual(report.steps[0].counts, { tests: 1, pass: 0, fail: 1, skipped: 0, todo: 0, cancelled: 0 })
    const calls = (await readFile(tracePath, 'utf8')).trim().split('\n').map(JSON.parse)
    assert.ok(!calls.some(call => call.command === 'ssh' && call.args.some(arg => arg.includes('rollback-release.ps1'))))
    assert.ok(!calls.some(call => call.command === 'ssh' && call.args.includes('restart')))
    const qa = calls.find(call => call.command === 'browser-qa')
    assert.deepEqual(JSON.parse(await readFile(qa.args[1], 'utf8')), { status: 'FAIL', failures: ['fixture-title-mismatch'] })
    assert.match(await readFile(join(root, report.steps[0].logFile), 'utf8'), /fail 1/)

    await writeFile(livePath, 'previous-artifact')
    const before = await readFile(reportPath, 'utf8')
    const failure = spawnSync(process.execPath, [resolve(deployDir, 'deploy-hub.mjs'), '--host', 'fixture-only', '--skip-build', '--output', output], {
      env: { ...env, FIXTURE_TRANSFER_FAIL: '1' }, encoding: 'utf8', timeout: 30000,
    })
    assert.notEqual(failure.status, 0)
    assert.match(failure.stderr, /DEPLOY_COMMAND_FAILED:scp:9/)
    assert.equal(await readFile(livePath, 'utf8'), 'previous-artifact')
    assert.equal(await readFile(reportPath, 'utf8'), before)
  } finally {
    const trace = await readFile(tracePath, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error })
    const releases = new Set(trace.split('\n').filter(Boolean).map(JSON.parse)
      .filter(call => call.command === 'ssh')
      .flatMap(call => call.args.flatMap(arg => [...arg.matchAll(/mkdir -p \/e\/git\/seoul-dengoku-web\/releases\/([A-Za-z0-9-]+)/g)].map(match => match[1]))))
    for (const release of releases) await rm(resolve(deployDir, '../../../.omo/evidence/hub-docker-deploy', release), { recursive: true, force: true })
    await rm(root, { recursive: true, force: true })
  }
})

test('manifest rejects a required source without its entry file', async () => {
  const { validateManifest } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-red-'))
  await mkdir(join(root, 'page'), { recursive: true })

  await assert.rejects(
    validateManifest(root, [{ id: 'page', source: 'page', target: 'page', required: true, entry: 'index.html' }]),
    /DEPLOY_SOURCE_ENTRY_MISSING/,
  )
})
test('stage rejects root and private evidence sources before copying', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-evidence-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'evidence'), { recursive: true })
  await mkdir(join(root, '.omo', 'evidence'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'evidence', 'index.html'), '<h1>root evidence</h1>')
  await writeFile(join(root, '.omo', 'evidence', 'index.html'), '<h1>private evidence</h1>')
  for (const source of ['evidence', './evidence', '.omo/evidence']) {
    await assert.rejects(
      stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'bad', source, target: 'bad', required: true, entry: 'index.html' }] }),
      /DEPLOY_PRIVATE_EVIDENCE_SOURCE:page:bad/,
    )
  }
})

test('stage rejects symlinked evidence page and asset sources before copying', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-evidence-link-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'public'), { recursive: true })
  await mkdir(join(root, 'evidence'), { recursive: true })
  await mkdir(join(root, '.omo', 'evidence'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'evidence', 'index.html'), '<h1>root evidence</h1>')
  await writeFile(join(root, '.omo', 'evidence', 'sentinel.txt'), 'private receipt')
  await symlink(join(root, 'evidence'), join(root, 'public', 'page-link'))
  await symlink(join(root, '.omo', 'evidence'), join(root, 'public', 'asset-link'))
  await assert.rejects(
    stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'bad-page', source: 'public/page-link', target: 'bad', required: true, entry: 'index.html' }] }),
    /DEPLOY_PRIVATE_EVIDENCE_SOURCE:page:bad-page/,
  )
  await mkdir(join(root, 'public', 'page'), { recursive: true })
  await writeFile(join(root, 'public', 'page', 'index.html'), '<h1>page</h1>')
  await assert.rejects(
    stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'bad-asset', source: 'public/page', target: 'page', required: true, entry: 'index.html', assets: [{ source: 'public/asset-link', target: 'assets', files: ['sentinel.txt'] }] }] }),
    /DEPLOY_PRIVATE_EVIDENCE_SOURCE:asset:bad-asset/,
  )
  await assert.rejects(readFile(join(output, 'page', 'assets', 'sentinel.txt')), /ENOENT/)
})

test('stage rejects asset file traversal into private and root evidence before copying', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-asset-traversal-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'public', 'assets'), { recursive: true })
  await mkdir(join(root, 'evidence'), { recursive: true })
  await mkdir(join(root, '.omo', 'evidence', 'private'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'public', 'index.html'), '<h1>public</h1>')
  await writeFile(join(root, 'evidence', 'receipt.txt'), 'root secret')
  await writeFile(join(root, '.omo', 'evidence', 'private', 'receipt.txt'), 'private secret')
  for (const file of ['../../evidence/receipt.txt', '../../.omo/evidence/private/receipt.txt']) {
    await assert.rejects(
      stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'attack', source: 'public', target: 'public', required: true, entry: 'index.html', assets: [{ source: 'public/assets', target: 'assets', files: [file] }] }] }),
      /DEPLOY_ASSET_FILE_OUTSIDE_SOURCE:asset:attack/,
    )
    await assert.rejects(readFile(join(output, 'public', 'assets', 'receipt.txt')), /ENOENT/)
  }
})

test('stage rejects an asset file symlink into private evidence before copying', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-asset-link-file-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'public', 'assets'), { recursive: true })
  await mkdir(join(root, '.omo', 'evidence', 'private'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'public', 'index.html'), '<h1>public</h1>')
  await writeFile(join(root, '.omo', 'evidence', 'private', 'receipt.txt'), 'private secret')
  await symlink(join(root, '.omo', 'evidence', 'private', 'receipt.txt'), join(root, 'public', 'assets', 'receipt.txt'))
  await assert.rejects(
    stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'attack', source: 'public', target: 'public', required: true, entry: 'index.html', assets: [{ source: 'public/assets', target: 'assets', files: ['receipt.txt'] }] }] }),
    /DEPLOY_ASSET_FILE_OUTSIDE_SOURCE:asset:attack/,
  )
  await assert.rejects(readFile(join(output, 'public', 'assets', 'receipt.txt')), /ENOENT/)
})

test('stage copies a declared nested public asset to a contained staged destination', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-nested-asset-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'public', 'assets', 'nested'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'public', 'index.html'), '<h1>public</h1>')
  await writeFile(join(root, 'public', 'assets', 'nested', 'ok.txt'), 'public asset')
  const result = await stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'public', source: 'public', target: 'public', required: true, entry: 'index.html', assets: [{ source: 'public/assets', target: 'assets', files: ['nested/ok.txt'] }] }] })
  assert.equal(await readFile(join(output, 'public', 'assets', 'ok.txt'), 'utf8'), 'public asset')
  assert.ok(result.artifacts.some((artifact) => artifact.path === 'public/assets/ok.txt'))
})

test('stage rejects root-source asset files in private and root evidence namespaces', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-root-assets-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, '.omo', 'evidence', 'private'), { recursive: true })
  await mkdir(join(root, 'evidence'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, '.omo', 'evidence', 'private', 'receipt.txt'), 'private sentinel')
  await writeFile(join(root, 'evidence', 'receipt.txt'), 'root sentinel')
  for (const file of ['.omo/evidence/private/receipt.txt', 'evidence/receipt.txt']) {
    await assert.rejects(
      stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'root-assets', source: '.', target: 'public', required: true, entry: 'index.html', assets: [{ source: '.', target: 'assets', files: [file] }] }] }),
      /DEPLOY_PRIVATE_EVIDENCE_SOURCE:asset:root-assets/,
    )
    await assert.rejects(readFile(join(output, 'public', 'assets', 'receipt.txt')), /ENOENT/)
  }
})

test('stage rejects a staged destination symlink before creating its outside descendant', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-destination-link-'))
  const output = join(root, 'output')
  const outside = join(root, 'outside')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'public', 'assets'), { recursive: true })
  await mkdir(outside, { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'public', 'index.html'), '<h1>public</h1>')
  await writeFile(join(root, 'public', 'assets', 'ok.txt'), 'public asset')
  await symlink(outside, join(root, 'public', 'staged-assets'))
  await assert.rejects(
    stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'destination-link', source: 'public', target: 'public', required: true, entry: 'index.html', assets: [{ source: 'public/assets', target: 'staged-assets/new', files: ['ok.txt'] }] }] }),
    /DEPLOY_ASSET_DESTINATION_OUTSIDE_STAGE:destination-link:staged-assets\/new/,
  )
  await assert.rejects(readFile(join(outside, 'new', 'ok.txt')), /ENOENT/)
  await assert.rejects(readFile(join(output, 'public', 'staged-assets', 'new', 'ok.txt')), /ENOENT/)
})

test('stage accepts a public nested asset when asset source is the repository root', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-root-public-'))
  const output = await mkdtemp(join(tmpdir(), 'hub-deploy-root-public-output-'))
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'public', 'nested'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'public', 'nested', 'ok.txt'), 'public asset')
  const result = await stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [{ id: 'root-public', source: '.', target: 'public', required: true, entry: 'index.html', assets: [{ source: '.', target: 'assets', files: ['public/nested/ok.txt'] }] }] })
  assert.equal(await readFile(join(output, 'public', 'assets', 'ok.txt'), 'utf8'), 'public asset')
  assert.ok(result.artifacts.some((artifact) => artifact.path === 'public/assets/ok.txt'))
})

test('stage copies every manifest page and writes deterministic deployment metadata', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-stage-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki', 'assets'), { recursive: true })
  await mkdir(join(root, 'play'), { recursive: true })
  await writeFile(join(root, 'hub.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'wiki', 'assets', 'app.js'), 'wiki')
  await writeFile(join(root, 'play', 'index.html'), '<h1>play</h1>')

  const result = await stageHub({
    root,
    output,
    hubIndex: 'hub.html',
    wikiDist: 'wiki',
    pages: [{ id: 'play', source: 'play', target: 'play', required: true, entry: 'index.html' }],
  })

  assert.equal(await readFile(join(output, 'index.html'), 'utf8'), '<h1>hub</h1>')
  assert.equal(await readFile(join(output, 'wiki', 'index.html'), 'utf8'), '<h1>wiki</h1>')
  assert.equal(await readFile(join(output, 'play', 'index.html'), 'utf8'), '<h1>play</h1>')
  assert.deepEqual(result.pages.map((page) => page.id), ['hub', 'wiki', 'play'])
  const firstManifest = await readFile(join(output, 'deployment-manifest.json'), 'utf8')
  assert.match(firstManifest, /"play"/)

  await stageHub({
    root,
    output,
    hubIndex: 'hub.html',
    wikiDist: 'wiki',
    pages: [{ id: 'play', source: 'play', target: 'play', required: true, entry: 'index.html' }],
  })
  assert.equal(await readFile(join(output, 'deployment-manifest.json'), 'utf8'), firstManifest)

  await writeFile(join(output, 'play', 'index.html'), '<h1>tampered</h1>')
  const verify = spawnSync(process.execPath, [resolve(deployDir, 'verify-staged-release.mjs'), output], { encoding: 'utf8' })
  assert.notEqual(verify.status, 0)
  assert.match(verify.stdout, /sha256:play\/index\.html/)
})

test('stage assembles the avatar viewer with only its canonical public runtime files', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-avatar-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'viewer'), { recursive: true })
  await mkdir(join(root, 'runtime'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'viewer', 'index.html'), '<h1>avatar</h1>')
  await writeFile(join(root, 'viewer', 'app.mjs'), 'viewer')
  await writeFile(join(root, 'runtime', 'avatar-contract.json'), '{}')
  await writeFile(join(root, 'runtime', 'female-underwear.glb'), 'glb')
  await writeFile(join(root, 'runtime', 'source.blend'), 'private')

  const result = await stageHub({
    root,
    output,
    hubIndex: 'index.html',
    wikiDist: 'wiki',
    pages: [{
      id: 'avatar',
      source: 'viewer',
      target: 'avatar',
      required: true,
      entry: 'index.html',
      assets: [{
        source: 'runtime',
        target: 'female-underwear',
        files: ['avatar-contract.json', 'female-underwear.glb'],
      }],
    }],
  })

  assert.equal(await readFile(join(output, 'avatar', 'index.html'), 'utf8'), '<h1>avatar</h1>')
  assert.equal(await readFile(join(output, 'avatar', 'female-underwear', 'avatar-contract.json'), 'utf8'), '{}')
  assert.equal(await readFile(join(output, 'avatar', 'female-underwear', 'female-underwear.glb'), 'utf8'), 'glb')
  await assert.rejects(readFile(join(output, 'avatar', 'female-underwear', 'source.blend')), /ENOENT/)
  assert.ok(result.artifacts.some((artifact) => artifact.path === 'avatar/female-underwear/avatar-contract.json'))
  assert.ok(result.artifacts.some((artifact) => artifact.path === 'avatar/female-underwear/female-underwear.glb'))
})

test('stage keeps hub index at root and React wiki under /wiki', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-split-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')

  await stageHub({ root, output, hubIndex: 'index.html', wikiDist: 'wiki', pages: [] })

  assert.equal(await readFile(join(output, 'index.html'), 'utf8'), '<h1>hub</h1>')
  assert.equal(await readFile(join(output, 'wiki', 'index.html'), 'utf8'), '<h1>wiki</h1>')
})

test('stage excludes retired nested routes from a published page', async () => {
  const { stageHub } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-exclude-'))
  const output = join(root, 'output')
  await mkdir(join(root, 'wiki'), { recursive: true })
  await mkdir(join(root, 'system-design', 'regions'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<h1>hub</h1>')
  await writeFile(join(root, 'wiki', 'index.html'), '<h1>wiki</h1>')
  await writeFile(join(root, 'system-design', 'index.html'), '<h1>system</h1>')
  await writeFile(join(root, 'system-design', 'regions', 'index.html'), '<h1>retired</h1>')

  await stageHub({
    root,
    output,
    hubIndex: 'index.html',
    wikiDist: 'wiki',
    pages: [{ id: 'system-design', source: 'system-design', target: 'system-design', required: true, entry: 'index.html', exclude: ['regions'] }],
  })

  assert.equal(await readFile(join(output, 'system-design', 'index.html'), 'utf8'), '<h1>system</h1>')
  await assert.rejects(readFile(join(output, 'system-design', 'regions', 'index.html'), 'utf8'), /ENOENT/)
})

test('staged release verifier rejects Git LFS pointers masquerading as web assets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hub-lfs-pointer-'))
  const pointer = 'version https://git-lfs.github.com/spec/v1\noid sha256:0000000000000000000000000000000000000000000000000000000000000000\nsize 15184\n'
  const flag = join(root, 'wiki', 'state-flags', 'S01.webp')
  await mkdir(dirname(flag), { recursive: true })
  await writeFile(flag, pointer)
  await writeFile(join(root, 'deployment-manifest.json'), JSON.stringify({
    files: 1,
    pages: [],
    artifacts: [{ path: 'wiki/state-flags/S01.webp', bytes: Buffer.byteLength(pointer), sha256: createHash('sha256').update(pointer).digest('hex') }],
  }))
  const result = spawnSync(process.execPath, [resolve(deployDir, 'verify-staged-release.mjs'), root], { encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /lfs-pointer:wiki\/state-flags\/S01\.webp/)
  await rm(root, { recursive: true, force: true })
})

test('generated nginx serves avatar ES modules as JavaScript without changing the base config', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hub-nginx-avatar-'))
  const source = join(root, 'nginx.conf')
  const output = join(root, 'generated.conf')
  const original = 'server {\n    location = /system-design/regions {\n        return 308 /wiki/world/World-and-Subway-Layers;\n    }\n}\n'
  await writeFile(source, original)

  const result = spawnSync(process.execPath, [resolve(deployDir, 'generate-nginx.mjs'), source, output], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(await readFile(source, 'utf8'), original)
  const generated = await readFile(output, 'utf8')
  assert.match(generated, /location ~ \^\/avatar\/\.\*\\\.mjs\$/)
  assert.doesNotMatch(generated, /portrait-gen/)
  assert.match(generated, /location ~ \^\/avatar\/\.\*\\\.mjs\$ \{\s*default_type application\/javascript;/)
})

test('generated nginx no longer ships Unity /play/ build locations', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hub-nginx-play-'))
  const source = join(root, 'nginx.conf')
  const output = join(root, 'generated.conf')
  await writeFile(source, 'server {\n    location = /system-design/regions {\n        return 308 /wiki/world/World-and-Subway-Layers;\n    }\n}\n')

  const result = spawnSync(process.execPath, [resolve(deployDir, 'generate-nginx.mjs'), source, output], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const generated = await readFile(output, 'utf8')
  assert.doesNotMatch(generated, /\/play\/Build/)
  assert.match(generated, /location ~ \^\/avatar\/.*\\.mjs\$/)
  await rm(root, { recursive: true, force: true })
})
