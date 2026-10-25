import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { toString } from 'mdast-util-to-string'
import { renderLoreMarkdown, headingId } from './lore-json-render.mjs'

const climate = readCanonicalDocument('lore/places/sources/Winter-Climate-20210108.json')
const world = readCanonicalDocument('lore/places/World-and-Subway-Layers.json')
const clothing = readCanonicalDocument('lore/characters/Characters-Factions-and-Professions.json')
const parse = (markdown) => fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })

test('all 17 KMA observations remain unchanged historical research, separate from the current Seoul table', () => {
  // Verified against recordDispositions in station-climate-v2-applied-20261015.
  assert.equal(climate.records.length, 17)
  assert.equal(new Set(climate.records.map((record) => record.region_code_2021)).size, 17)
  assert.equal(createHash('sha256').update(JSON.stringify(climate.records)).digest('hex'), 'c1eb8d9c30d15cb8871dad391873a9fd12b2251773863093ddaceba170218840')
  for (const record of climate.records) {
    const url = new URL(record.source_url)
    assert.equal(url.protocol, 'https:')
    assert.equal(url.hostname, 'www.weather.go.kr')
    assert.equal(Number(url.searchParams.get('stn')), record.station_id)
    assert.equal(`${url.searchParams.get('yy')}-${url.searchParams.get('mm').padStart(2, '0')}-08`, record.date)
    assert.equal(record.date, climate.date)
    assert.ok(record.minimum_c <= record.mean_c && record.mean_c <= record.maximum_c)
    assert.match(record.source_sha256, /^[a-f0-9]{64}$/u)
  }
})

for (const locale of ['ko', 'en']) {
  test(`the current climate table renders only the Seoul historical daily-minimum reference and source URL (${locale})`, () => {
    const table = world.content.find((block) => block.anchor === '시도별-지상-기온표')
    const rendered = parse(renderLoreMarkdown({ ...world, content: [table] }, locale)).children[0]
    assert.equal(rendered.type, 'table')
    assert.equal(rendered.children.length - 1, 1)
    const record = climate.records.find((record) => record.region_code_2021 === '11')
    assert.equal(record.station_id, 108)
    assert.equal(record.date, '2021-01-08')
    assert.equal(record.minimum_c, -18.6)
    for (const row of rendered.children.slice(1)) {
      const [region, station, minimum] = row.children
      assert.equal(toString(region), record[`region_${locale}`])
      assert.equal(Number(toString(minimum).replace('−', '-').replace(/℃|°C/u, '')), record.minimum_c)
      assert.equal(station.children[0].url, record.source_url)
      assert.ok(toString(station).includes(`(${record.station_id})`))
      const url = new URL(record.source_url)
      assert.equal(url.protocol, 'https:')
      assert.equal(url.hostname, 'www.weather.go.kr')
      assert.equal(Number(url.searchParams.get('stn')), record.station_id)
      assert.equal(`${url.searchParams.get('yy')}-${url.searchParams.get('mm').padStart(2, '0')}-08`, record.date)
      assert.equal(record.date, climate.date)
      assert.ok(record.minimum_c <= record.mean_c && record.mean_c <= record.maximum_c)
      assert.match(record.source_sha256, /^[a-f0-9]{64}$/u)
    }
  })

  test(`underground ranges survive Markdown rendering as the authored text (${locale})`, () => {
    const block = world.content.find((node) => node.anchor === '깊이별-지하-생활권')
    const rendered = parse(renderLoreMarkdown({ ...world, content: [block] }, locale))
    assert.equal(toString(rendered), block.text[locale])
    const ranges = [...toString(rendered).matchAll(/(\d+)[–~](\d+)(?:℃|°C)/gu)].map((match) => [Number(match[1]), Number(match[2])])
    assert.deepEqual(ranges, [climate.application.intermediate_underground_c, climate.application.deep_underground_c])
  })

  test(`clothing and climate links reach real rendered headings in both directions (${locale})`, () => {
    for (const [source, target, targetSlug] of [
      [clothing, world, 'World-and-Subway-Layers'],
      [world, clothing, 'Characters-Factions-and-Professions'],
    ]) {
      const markdown = renderLoreMarkdown(target, locale)
      const ids = new Set([
        ...parse(markdown).children.filter((node) => node.type === 'heading').map((node) => headingId(toString(node))),
        ...[...markdown.matchAll(/<a id="([^"]+)"><\/a>/gu)].map((match) => match[1]),
      ])
      const links = []
      const visit = (node) => {
        if (node.type === 'link' && node.url.includes(`${targetSlug}.md#`)) links.push(node.url)
        node.children?.forEach(visit)
      }
      visit(parse(renderLoreMarkdown(source, locale)))
      assert.ok(links.length > 0)
      for (const link of links) assert.ok(ids.has(link.split('#')[1]), link)
    }
  })
}
