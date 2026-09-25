import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const koText = (leaf) => typeof leaf === 'string' ? leaf : leaf.map((run) => run.text).join('')

test('timeline overview has one causal summary for every year heading in the Century-Annals canon', async () => {
  const data = await readJson('../public/timeline-overview.json')
  const annals = await readJson('../../lore/chronology/Century-Annals.json')
  const canonYears = annals.content
    .filter((block) => block.kind === 'heading' && block.depth === 3)
    .map((block) => koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1])
    .filter(Boolean)
    .map(Number)
  assert.ok(canonYears.length > 0)
  assert.deepEqual(data.years.map((entry) => entry.year), canonYears)
  assert.equal(data.years[0].year, 2026)
  assert.ok(data.years.every((entry, index) => index === 0 || entry.year > data.years[index - 1].year))
  assert.ok(data.years.every((entry) => entry.year >= 2026 && entry.year <= 2126))
  assert.ok(data.years.every((entry) => entry.summary.length >= 40))
  assert.ok(data.years.every((entry) => entry.pressure.length > 0 && entry.decision.length > 0 && entry.immediate.length > 0 && entry.aftermath.length > 0))
  assert.ok(data.years.every((entry) => entry.sourceRoute === `/world/Century-Annals#${entry.year}년`))
  assert.ok(data.years.every((entry) => entry.relatedDocuments.length >= 1))
})

test('every timeline source anchor exists on the published Century-Annals page', async () => {
  const data = await readJson('../public/timeline-overview.json')
  const page = await readJson('../src/generated/world/Century-Annals.json')
  const headingText = (node) => node.value ?? (node.children ?? []).map(headingText).join('')
  const anchors = new Set(page.blocks.filter((block) => block.type === 'heading').map((block) => headingText(block).trim()))
  for (const entry of data.years) assert.ok(anchors.has(`${entry.year}년`), entry.sourceRoute)
})

test('timeline overview cross-links the current 16 states and world canon', async () => {
  const data = await readJson('../public/timeline-overview.json')
  const contract = await readJson('../public/wiki-contract.json')
  const states = data.states
  assert.equal(states.length, 16)
  assert.equal(new Set(states.map((state) => state.name)).size, 16)
  const published = new Set([...contract.documents.map((document) => document.route), '/people'])
  const routes = new Set(data.years.flatMap((entry) => entry.relatedDocuments.map((document) => document.route)))
  for (const route of routes) assert.ok(published.has(route), `unpublished related route ${route}`)
  for (const route of ['/world/Sixteen-States', '/world/Chaebol-Houses-and-Century-Factions', '/world/Faith-Culture-Schism', '/world/Era-Arms-and-Tech-Level']) assert.ok(routes.has(route), route)
})

test('each external theater links to its dated chronicle entries in the generated pages', async () => {
  const timeline = await readJson('../public/timeline-overview.json')
  const annals = await readJson('../../lore/chronology/Century-Annals.json')
  const publishedAnnals = await readJson('../src/generated/world/Century-Annals.json')
  const theaterPage = await readJson('../src/generated/world/External-Theaters.json')
  const expected = {
    XT01: ['2069년-xt01-임진-제방-임시-검역소', '2104년-xt01-임진-제방-임시-검역소', '2125년-xt01-광화문-정부서울청사'],
    XT02: ['2079년-xt02-한강-하구-임시-부두', '2114년-xt02-한강-하구-임시-부두'],
    XT03: ['2079년-xt03-용산-환적창'],
    XT04: ['2069년-xt04-암사-야적장', '2114년-xt04-암사-야적장'],
    XT05: ['2069년-xt05-여의도-회관', '2122년-xt05-여의도-회관'],
  }
  const datedAnchors = new Map()
  let year = null
  for (const block of annals.content) {
    if (block.kind !== 'heading') continue
    if (block.depth === 3) year = Number(koText(block.text.ko).match(/^((?:20|21)\d{2})년$/u)?.[1])
    else if (block.depth === 2) year = null
    if (year && block.anchor) datedAnchors.set(block.anchor, year)
  }
  const links = new Map()
  const publishedAnchors = new Set()
  const collectAnchor = (node) => {
    const anchor = node.type === 'html' && node.value?.match(/^<a id="([^"]+)">$/u)?.[1]
    if (anchor) publishedAnchors.add(anchor)
    for (const child of node.children ?? []) collectAnchor(child)
  }
  for (const block of publishedAnnals.blocks) collectAnchor(block)
  let theaterId = null
  const visit = (node) => {
    if (node.type === 'link') links.get(theaterId)?.add(node.url)
    for (const child of node.children ?? []) visit(child)
  }
  for (const block of theaterPage.blocks) {
    if (block.type === 'heading' && block.depth === 2) {
      theaterId = Object.keys(expected).find((id) => (block.children ?? []).map((node) => node.value ?? '').join('').startsWith(id)) ?? null
      if (theaterId) links.set(theaterId, new Set())
    }
    if (theaterId) visit(block)
  }
  for (const [id, anchors] of Object.entries(expected)) {
    assert.ok(links.has(id), `missing generated theater ${id}`)
    for (const anchor of anchors) {
      const datedYear = datedAnchors.get(anchor)
      assert.ok(datedYear, `${id} missing dated canon anchor ${anchor}`)
      assert.ok(publishedAnchors.has(anchor), `${id} missing published anchor ${anchor}`)
      assert.ok(links.get(id).has(`/world/Century-Annals#${anchor}`), `${id} missing generated link ${anchor}`)
      const timelineYear = timeline.years.find((entry) => entry.year === datedYear)
      assert.ok(timelineYear?.relatedDocuments.some((document) => document.route === '/world/External-Theaters'), `${id} missing ${datedYear} timeline route`)
    }
  }
})

test('Scenario Timeline mounts the complete timeline overview', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/TimelineOverview.tsx', import.meta.url), 'utf8')
  assert.match(page, /Scenario-Timeline/)
  assert.match(page, /TimelineOverview/)
  assert.match(component, /전체 \{data\.years\.length\}개 연도/)
  assert.doesNotMatch(component, /101개/)
  assert.match(component, /재접촉 전야 2115–2126/)
  assert.doesNotMatch(component, /개막 전야/)
  assert.match(component, /timeline-overview-year/)
  assert.match(component, /relatedDocuments/)
})
