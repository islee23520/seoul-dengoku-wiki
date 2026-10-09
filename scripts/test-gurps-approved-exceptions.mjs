import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'vitest'
import { APPROVED_EXCEPTIONS, ROOT, OUT, build as buildSelected, verify as verifySelected } from './gurps-cast.mjs'

const issued = JSON.parse(readFileSync(new URL('../vendor/issued-history/5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4.json', import.meta.url), 'utf8'))
const revision = '5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4'
const fresh = buildSelected(ROOT, revision).doc
const verify = (doc) => verifySelected(doc, ROOT, revision)
const numericErrors = (doc) => verify(doc).filter((error) => !error.includes('인용 불일치'))

test('nine approved exceptions preserve exact sealed allocations without arithmetic', () => {
  assert.equal(Object.keys(APPROVED_EXCEPTIONS).length, 9)
  for (const [id, approval] of Object.entries(APPROVED_EXCEPTIONS)) {
    const before = issued.people.find((p) => p.id === id)
    const after = fresh.people.find((p) => p.id === id)
    assert.deepEqual(after.skills, before.skills)
    assert.deepEqual(after.traits, before.traits)
    assert.equal(after.cp.total, approval.total)
    assert.deepEqual(after, before)
    assert.ok(approval.ownerRef)
  }
  assert.deepEqual(numericErrors(issued), [])
  assert.ok(fresh.people.find((p) => p.id === 'K1008').skills.some((s) => s.name === '장검'))
})

test('approved allocation mutations and ordinary legacy changes remain rejected', () => {
  const mutations = [
    (d) => { d.people.find((p) => p.id === 'K1008').skills[0].level += 1 },
    (d) => { d.people.find((p) => p.id === 'K1003').attributes.ST.value += 1 },
    (d) => { d.people.find((p) => p.id === 'K1018').cp.total += 1 },
    (d) => { d.people.find((p) => p.id === 'K001').attributes.IQ.value = 14 },
  ]
  for (const mutate of mutations) {
    const copy = structuredClone(issued)
    mutate(copy)
    assert.ok(numericErrors(copy).length > 0)
  }
})

test('quotation reporting is complete beyond the former 200-error limit', () => {
  const copy = structuredClone(issued)
  for (const p of copy.people) for (const a of Object.values(p.attributes))
    for (const e of a.evidence) if (e.path) e.quote = '__missing_quote__'
  assert.ok(verify(copy).filter((e) => e.includes('인용 불일치')).length > 200)
})
