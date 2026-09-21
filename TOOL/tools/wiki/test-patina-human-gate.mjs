import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createHash } from 'node:crypto'

import { verifyHumanReceipt } from './patina-human-gate.mjs'

const hash = (text) => createHash('sha256').update(text).digest('hex')

test('human receipt validates matching public lore documents', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'patina-human-'))
  const root = join(dir, 'world')
  const receiptPath = join(dir, 'receipt.json')
  await mkdir(root)
  const text = '# 세계\n\n사람들이 역에서 물을 나눈다.\n'
  await writeFile(join(root, 'World.md'), text)
  await writeFile(receiptPath, JSON.stringify({
    schema: 'seoul-dengoku.patina-human.v1',
    documents: [{ path: 'World.md', sha256: hash(text), score: 12, interpretation: 'human' }],
  }))
  assert.deepEqual(await verifyHumanReceipt({ root, receiptPath }), { status: 'PASS', documents: 1, failures: [] })
})

test('mostly-human receipt fails the publication gate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'patina-mostly-'))
  const root = join(dir, 'world')
  const receiptPath = join(dir, 'receipt.json')
  await mkdir(root)
  const text = '# 세계\n\n사람들이 역에서 물을 나눈다.\n'
  await writeFile(join(root, 'World.md'), text)
  await writeFile(receiptPath, JSON.stringify({
    schema: 'seoul-dengoku.patina-human.v1',
    documents: [{ path: 'World.md', sha256: hash(text), score: 20, interpretation: 'mostly human' }],
  }))
  const result = await verifyHumanReceipt({ root, receiptPath })
  assert.equal(result.status, 'FAIL')
  assert.deepEqual(result.failures, ['interpretation:World.md:mostly human'])
})

test('changed public prose invalidates its human receipt', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'patina-stale-'))
  const root = join(dir, 'world')
  const receiptPath = join(dir, 'receipt.json')
  await mkdir(root)
  const original = '# 세계\n\n사람들이 역에서 물을 나눈다.\n'
  await writeFile(join(root, 'World.md'), `${original}새 문장.\n`)
  await writeFile(receiptPath, JSON.stringify({
    schema: 'seoul-dengoku.patina-human.v1',
    documents: [{ path: 'World.md', sha256: hash(original), score: 12, interpretation: 'human' }],
  }))
  const result = await verifyHumanReceipt({ root, receiptPath })
  assert.equal(result.status, 'FAIL')
  assert.deepEqual(result.failures, ['sha256:World.md'])
})
