import assert from 'node:assert/strict'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import test from 'node:test'
import { loreLinkFailures } from './check-lore-links.mjs'

test('lore checker rejects a missing file and a missing anchor', async () => {
  const fixture = new URL('../lore/.link-check-fixture.md', import.meta.url)
  await writeFile(fixture, '[file](does-not-exist.md)\n\n[anchor](Glossary.md#does-not-exist)\n')
  try {
    const failures = await loreLinkFailures()
    assert.ok(failures.some((failure) => failure.includes('missing does-not-exist.md')))
    assert.ok(failures.some((failure) => failure.includes('missing anchor Glossary.md#does-not-exist')))
  } finally {
    await rm(fixture, { force: true })
  }
})

test('structured nested JSON links resolve aliases while private and broken links fail', async () => {
  const dir = new URL('../lore/bestiary/groups/', import.meta.url)
  const target = new URL('.link-check-target.json', dir)
  const source = new URL('../lore/.link-check-source.json', import.meta.url)
  const markdown = new URL('../lore/.link-check-logical.md', import.meta.url)
  await mkdir(dir, { recursive: true })
  await writeFile(target, JSON.stringify({ domain: 'bestiary', content: [
    { kind: 'heading', anchor: 'entry', depth: 2, publicAnchors: ['g01e01'], text: { ko: '괴물', en: 'Monster' } },
  ] }))
  const links = ['g01e01', '괴물', 'missing'].map((anchor) => ({ link: { domain: 'bestiary', slug: 'groups/.link-check-target', anchor } }))
  await writeFile(source, JSON.stringify({ links: [...links, { link: { domain: 'characters', slug: 'Cast-Profile-Contract' } }] }))
  await writeFile(markdown, '[alias](bestiary/groups/.link-check-target.md#g01e01)\n[broken](bestiary/groups/.link-check-target.md#missing)\n')
  try {
    const failures = await loreLinkFailures()
    assert.ok(failures.some((failure) => failure.includes('missing anchor') && failure.includes('#missing')))
    assert.ok(failures.some((failure) => failure.includes('private') && failure.includes('Cast-Profile-Contract')))
    assert.ok(!failures.some((failure) => failure.includes('#g01e01') || failure.includes('#괴물')))
    assert.ok(failures.some((failure) => failure.includes('.link-check-logical.md') && failure.includes('#missing')))
  } finally {
    await rm(source, { force: true })
    await rm(markdown, { force: true })
    await rm(target, { force: true })
  }
})

test('logical link prefers the JSON owner when an MD twin exists', async () => {
  const dir = new URL('../lore/bestiary/groups/', import.meta.url)
  const json = new URL('.link-check-dual.json', dir)
  const markdown = new URL('.link-check-dual.md', dir)
  const source = new URL('../lore/.link-check-dual-source.md', import.meta.url)
  await writeFile(json, JSON.stringify({ domain: 'bestiary', content: [
    { kind: 'heading', anchor: 'entry', depth: 2, publicAnchors: ['json-only'], text: { ko: 'JSON 원본', en: 'JSON Source' } },
  ] }))
  await writeFile(markdown, '## Markdown twin\n')
  await writeFile(source, '[json](bestiary/groups/.link-check-dual.md#json-only)\n[md](bestiary/groups/.link-check-dual.md#markdown-twin)\n')
  try {
    const failures = await loreLinkFailures()
    assert.ok(!failures.some((failure) => failure.includes('#json-only')))
    assert.ok(failures.some((failure) => failure.includes('#markdown-twin')))
  } finally {
    await rm(source, { force: true })
    await rm(markdown, { force: true })
    await rm(json, { force: true })
  }
})
