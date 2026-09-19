import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const deployDir = dirname(fileURLToPath(import.meta.url))
const modulePath = resolve(deployDir, 'hub-deploy.mjs')

test('manifest rejects a required source without its entry file', async () => {
  const { validateManifest } = await import(modulePath)
  const root = await mkdtemp(join(tmpdir(), 'hub-deploy-red-'))
  await mkdir(join(root, 'page'), { recursive: true })

  await assert.rejects(
    validateManifest(root, [{ id: 'page', source: 'page', target: 'page', required: true, entry: 'index.html' }]),
    /DEPLOY_SOURCE_ENTRY_MISSING/,
  )
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
