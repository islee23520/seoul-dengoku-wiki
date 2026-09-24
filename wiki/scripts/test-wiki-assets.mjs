import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

const projectRoot = resolve(import.meta.dirname, '..')

const imageSources = (node, acc = []) => {
  if (node.type === 'image' || node.type === 'definition') acc.push(node.url)
  if (node.type === 'html') for (const match of node.value.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) acc.push(match[1])
  for (const child of node.children ?? []) imageSources(child, acc)
  return acc
}

test('retired GAME-REFERENCE assets never appear in generated wiki content', async () => {
  const worldRoot = resolve(projectRoot, 'src/generated/world')
  const names = (await readdir(worldRoot)).filter((name) => name.endsWith('.json'))
  const contract = JSON.parse(await readFile(resolve(projectRoot, 'public/wiki-contract.json'), 'utf8'))
  assert.equal(names.length, contract.documents.length)
  const retiredReferencePath = ['GAME-REFERENCE', 'assets'].join('/')
  const failures = []
  for (const name of names) {
    const page = JSON.parse(await readFile(resolve(worldRoot, name), 'utf8'))
    assert.ok(Array.isArray(page.blocks) && typeof page.reviewText === 'string', name)
    const hrefs = [
      ...page.blocks.flatMap((block) => imageSources(block)),
      ...[...page.reviewText.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]),
    ]
    for (const href of hrefs) {
      if (href.includes(retiredReferencePath) || href.startsWith('/wiki/wiki-assets/')) failures.push(`${name}:${href}`)
    }
  }
  assert.deepEqual(failures, [])
})
