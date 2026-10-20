import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

test('shipped bilingual house articles retain all houses without private classification', async () => {
  for (const folder of ['world', 'world-en']) {
    const page = JSON.parse(await readFile(new URL(`../src/generated/${folder}/Operating-Houses.json`, import.meta.url), 'utf8'))
    const body = JSON.stringify(page.blocks)
    assert.ok(!body.includes('original-fiction'), folder)
    assert.ok(!page.reviewText.includes('Source layer:'), folder)
    assert.ok(!page.reviewText.includes('출처층:'), folder)
    assert.equal(page.blocks.filter(node => node.type === 'heading' && node.depth === 2).length, 32, folder)
    assert.equal(page.blocks.filter(node => node.type === 'heading' && node.depth === 3).length, 32, folder)
  }
})
