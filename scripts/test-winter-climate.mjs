import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { toString } from 'mdast-util-to-string'
import { renderLoreMarkdown, headingId } from './lore-json-render.mjs'

const climate = JSON.parse(readFileSync(new URL('../lore/places/sources/Winter-Climate-20210108.json', import.meta.url), 'utf8'))
const world = JSON.parse(readFileSync(new URL('../lore/places/World-and-Subway-Layers.json', import.meta.url), 'utf8'))
const clothing = JSON.parse(readFileSync(new URL('../lore/characters/Characters-Factions-and-Professions.json', import.meta.url), 'utf8'))
const parse = (markdown) => fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })

for (const locale of ['ko', 'en']) {
  test(`the published regional climate table preserves each observation and source URL (${locale})`, () => {
    const table = world.content.find((block) => block.anchor === '시도별-지상-기온표')
    const rendered = parse(renderLoreMarkdown({ ...world, content: [table] }, locale)).children[0]
    assert.equal(rendered.type, 'table')
    assert.equal(rendered.children.length - 1, climate.records.length)
    assert.equal(new Set(climate.records.map((record) => record.region_code_2021)).size, 17)
    const byRegion = new Map(climate.records.map((record) => [record[`region_${locale}`], record]))
    for (const row of rendered.children.slice(1)) {
      const [region, station, minimum] = row.children
      const record = byRegion.get(toString(region))
      assert.ok(record, toString(region))
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
      byRegion.delete(toString(region))
    }
    assert.equal(byRegion.size, 0)
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
