import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'vitest'
import { isAppRoute, proposalRoutes, toPublicHref } from '../src/manifest.ts'
import { categoryForPage, loadGddSources } from './catalog-admission.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const gddRoot = process.env.GDD_ROOT ?? resolve(projectRoot, '..')
const historical = JSON.parse(await readFile(new URL('./fixtures/publication-sources.json', import.meta.url), 'utf8'))
const canonicalSources = await loadGddSources(gddRoot)
const expected = await Promise.all([...canonicalSources.entries()].map(async ([page, entry]) => ({ page, ...entry, status: JSON.parse(await readFile(resolve(gddRoot, entry.source), 'utf8')).status, route: '/' + categoryForPage(page).id + '/' + page.split('/').at(-1).replace(/\.md$/, ''), latest21: historical.some((old) => old.id === entry.id && old.latest21) })))
const manifest = JSON.parse(await readFile(resolve(projectRoot, 'src/generated/publication-manifest.json'), 'utf8'))
const contract = JSON.parse(await readFile(resolve(projectRoot, 'src/generated/gdd-contract.json'), 'utf8'))

test('manifest equals the current canonical source identities and routes', () => {
  const identities = manifest.documents.filter(({ source }) => source.startsWith('canon/')).map(({ source, id, route }) => ({ source, id, route }))
  assert.deepEqual(identities.sort((a, b) => a.source.localeCompare(b.source)), expected.map(({ source, id, route }) => ({ source, id, route })).sort((a, b) => a.source.localeCompare(b.source)))
})

test('all registered collection statuses retain their canonical classification', async () => {
  for (const entry of expected.filter(({ page }) => !page.startsWith('adr/'))) {
    const canon = JSON.parse(await readFile(resolve(gddRoot, entry.source), 'utf8'))
    const generated = contract.documents.find(({ sourcePath }) => sourcePath === entry.source)
    assert.equal(canon.status, entry.status, entry.source)
    assert.equal(generated.status, entry.status, entry.source)
    assert.equal(proposalRoutes.has(entry.route), entry.status === 'proposal', entry.route)
  }
})

for (const entry of expected.filter(({ latest21 }) => latest21)) {
  test('latest own body and proposal route: ' + entry.page, async () => {
    const pagesRoot = process.env.GDD_PAGES_ROOT
    assert.ok(pagesRoot)
    const page = await readFile(resolve(pagesRoot, entry.page), 'utf8')
    const lock = JSON.parse(await readFile(resolve(gddRoot, 'canon/rendered.lock.json'), 'utf8'))
    assert.equal(createHash('sha256').update(page).digest('hex'), lock.find(({ path }) => path === entry.page).sha256)
    const doc = manifest.documents.find(({ source }) => source === entry.source)
    assert.equal(doc.route, entry.route)
    assert.equal(doc.contentRef, 'src/content' + entry.route + '.md')
    assert.equal(isAppRoute(doc.route), true)
    assert.equal(toPublicHref(doc.route), '/gdd' + entry.route)
    assert.equal(proposalRoutes.has(doc.route), true)
    const body = await readFile(resolve(projectRoot, doc.contentRef), 'utf8')
    const rawBody = page.replace(/^---\n[\s\S]*?\n---\n/u, '').replace(/^#\s+.+\n+/u, '')
    assert.equal(body.replace(/\]\([^)]+\)/g, '](__href__)'), rawBody.replace(/\]\([^)]+\)/g, '](__href__)'), entry.page)
    const rawLinks = [...rawBody.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1])
    const bodyLinks = [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1])
    for (let index = 0; index < rawLinks.length; index++) {
      const [target, anchor] = rawLinks[index].split('#', 2)
      if (!target.endsWith('.md') || target.startsWith('http')) continue
      const targetPage = resolve(pagesRoot, 'system-design', target)
      const destination = expected.find(({ page }) => resolve(pagesRoot, page) === targetPage)
      if (!destination) continue
      assert.equal(bodyLinks[index], destination.route + (anchor ? '#' + anchor : ''))
      assert.equal(isAppRoute(destination.route), true)
      if (anchor) {
        const targetBody = await readFile(resolve(pagesRoot, destination.page), 'utf8')
        const headings = [...targetBody.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, ''))
        assert.ok(headings.includes(anchor), destination.page + '#' + anchor)
      }
    }
  })
}
