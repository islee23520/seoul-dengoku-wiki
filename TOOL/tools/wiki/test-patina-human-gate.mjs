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

const text = '# 세계\n\n사람들이 역에서 물을 나눈다.\n'

async function verifyWith(document, { extra = [] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'patina-interp-'))
  const root = join(dir, 'world')
  const receiptPath = join(dir, 'receipt.json')
  await mkdir(root)
  await writeFile(join(root, 'World.md'), text)
  await writeFile(receiptPath, JSON.stringify({
    schema: 'seoul-dengoku.patina-human.v1',
    documents: [{ path: 'World.md', sha256: hash(text), score: 20, ...document }, ...extra],
  }))
  return verifyHumanReceipt({ root, receiptPath })
}

test('mostly-human receipt passes the publication gate', async () => {
  assert.deepEqual(await verifyWith({ interpretation: 'mostly human' }), { status: 'PASS', documents: 1, failures: [] })
})

for (const interpretation of ['mixed', 'AI-like', 'unknown', undefined]) {
  test(`${interpretation} interpretation fails the publication gate`, async () => {
    const result = await verifyWith({ interpretation })
    assert.equal(result.status, 'FAIL')
    assert.deepEqual(result.failures, [`interpretation:World.md:${interpretation}`])
  })
}

test('accepted interpretation does not mask hash, count, or extra failures', async () => {
  const result = await verifyWith(
    { interpretation: 'mostly human', sha256: 'bad' },
    { extra: [{ path: 'Gone.md', sha256: hash('x'), score: 1, interpretation: 'human' }] },
  )
  assert.deepEqual(result.failures, ['count:2:1', 'sha256:World.md', 'extra:Gone.md'])
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

const skipped = { interpretation: 'human', skipped: true, skipReason: 'sentences<=2' }
const approval = (over = {}) => ({ status: 'approved', reviewer: 'owner', sourceSha256: hash(text), ...over })

test('skipped document without manual review fails', async () => {
  const result = await verifyWith(skipped)
  assert.deepEqual(result.failures, ['skipped:World.md:sentences<=2'])
})

for (const [name, manualReview] of [
  ['stale hash', approval({ sourceSha256: hash('old') })],
  ['missing reviewer', approval({ reviewer: '' })],
  ['non-approved status', approval({ status: 'pending' })],
  ['non-object', 'approved'],
]) {
  test(`skipped document with ${name} approval fails`, async () => {
    const result = await verifyWith({ ...skipped, manualReview })
    assert.deepEqual(result.failures, ['skipped:World.md:sentences<=2'])
  })
}

test('skipped document with valid manual review passes', async () => {
  assert.deepEqual(await verifyWith({ ...skipped, manualReview: approval() }), { status: 'PASS', documents: 1, failures: [] })
})

test('approved skipped document still fails a stale receipt hash', async () => {
  const result = await verifyWith({ ...skipped, sha256: 'bad', manualReview: approval() })
  assert.deepEqual(result.failures, ['sha256:World.md'])
})

test('mixed skipped document still fails on interpretation only when not skipped', async () => {
  const result = await verifyWith({ interpretation: 'mixed' })
  assert.deepEqual(result.failures, ['interpretation:World.md:mixed'])
})
