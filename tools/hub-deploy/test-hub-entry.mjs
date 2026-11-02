import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { afterAll, onTestFinished, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { categoryDestinations, groups, renderHubEntry } from './generate-hub-entry.mjs'
import { stageHub } from './hub-deploy.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const manifests = {
  wiki: JSON.parse(await readFile(join(repoRoot, 'WIKI/src/generated/publication-manifest.json'), 'utf8')),
  gdd: JSON.parse(await readFile(join(repoRoot, 'GDD/viewer/src/generated/publication-manifest.json'), 'utf8')),
}
const archive = join(repoRoot, 'TOOL/shared-web-ui/seoul-dengoku-shared-web-ui-0.1.2.tgz')
const evidence = join(repoRoot, '.omo/evidence/shared-doc-publishing')
await mkdir(evidence, { recursive: true })
const temporaryPackage = !process.env.HUB_UI_TEST_PACKAGE_ROOT
const packageRoot = process.env.HUB_UI_TEST_PACKAGE_ROOT || await mkdtemp(join(evidence, 'hub-ui-package-'))
if (!process.env.HUB_UI_TEST_PACKAGE_ROOT) {
  for (const [command, args] of [
    ['tar', ['-xzf', archive, '-C', packageRoot, '--strip-components=1']],
    ['npm', ['install', '--prefix', packageRoot, '--no-save', '--ignore-scripts', '--package-lock=false', 'react@18.3.1', 'react-dom@18.3.1']],
  ]) {
    // A parent `npm run` exports npm_config_* (e.g. user allow-scripts); the nested install must not inherit them as project flags.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_')))
    const result = spawnSync(command, args, { encoding: 'utf8', env })
    assert.equal(result.status, 0, result.stderr)
  }
}
afterAll(async () => {
  if (temporaryPackage) await rm(packageRoot, { recursive: true, force: true })
})

test('hub generator produces deterministic output from both publication manifests', async () => {
  const first = await renderHubEntry(packageRoot, manifests)
  assert.equal(await renderHubEntry(packageRoot, manifests), first)
  const outputRoot = await mkdtemp(join(evidence, 'hub-entry-generated-'))
  onTestFinished(() => rm(outputRoot, { recursive: true, force: true }))
  const output = join(outputRoot, 'index.html')
  const generated = spawnSync(process.execPath, [join(repoRoot, 'TOOL/tools/deploy/generate-hub-entry.mjs'), '--package-root', packageRoot, '--output', output], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  assert.equal(await readFile(output, 'utf8'), first)
  assert.match(first, /data-sui-theme="dark" data-sui-site="hub"/)
  assert.match(first, /sui-shell--index/)
  assert.match(first, /--sui-color-canvas: #0B111C/)
  assert.doesNotMatch(first, /--bg-void|class="card"|class="tile"|system-design\/regions/)
})

test('all existing destinations remain on the root service index', async () => {
  const html = await renderHubEntry(packageRoot, manifests)
  const destinations = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(destinations.slice(0, 6), [
    '#main-content',
    'wiki/', 'wiki/states', 'wiki/people', 'gdd/', 'design-store/',
  ])
  assert.deepEqual(groups.flatMap((group) => [...group.cards ?? [], ...group.tiles ?? []].map((item) => item.href)), destinations.slice(1, 6))
  assert.deepEqual(destinations.slice(6), categoryDestinations(manifests.wiki, manifests.gdd).flatMap((group) => group.tiles.map((tile) => tile.href)))
  assert.match(html, /공식 위키만 비로그인 공개/)
  assert.match(html, /서비스 인덱스/)
})

test('deployment stages the shared-package entry at root with wiki separate', async () => {
  const root = await mkdtemp(join(evidence, 'hub-ui-stage-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const output = join(root, 'out')
  await mkdir(join(root, 'wiki'))
  await writeFile(join(root, 'wiki/index.html'), '<h1>wiki</h1>')
  await mkdir(join(root, 'WIKI/src/generated'), { recursive: true })
  await writeFile(join(root, 'WIKI/src/generated/publication-manifest.json'), JSON.stringify(manifests.wiki))
  await mkdir(join(root, 'GDD/viewer/src/generated'), { recursive: true })
  await writeFile(join(root, 'GDD/viewer/src/generated/publication-manifest.json'), JSON.stringify(manifests.gdd))
  const result = await stageHub({ root, output, hubPackageRoot: packageRoot, wikiDist: 'wiki', pages: [] })
  assert.equal(await readFile(join(output, 'index.html'), 'utf8'), await renderHubEntry(packageRoot, manifests))
  assert.equal(await readFile(join(output, 'wiki/index.html'), 'utf8'), '<h1>wiki</h1>')
  assert.equal(result.pages[0].source, packageRoot)
})
