import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ledger = JSON.parse(await readFile(new URL('../lore/editorial/Naming-Ledger.json', import.meta.url), 'utf8'))

test('live naming categories have unique state identities and nonempty office and title names', () => {
  assert.equal(ledger.states.length, 16)
  assert.equal(new Set(ledger.states.map(({ id }) => id)).size, 16)
  assert.equal(new Set(ledger.states.map(({ name }) => name)).size, 16)
  assert.ok(ledger.offices.every(({ state, tiers }) => state && tiers.length && tiers.every(Boolean)))
  assert.ok(ledger.seriesTitles.every(({ form }) => form))
})

test('retired public forms do not reappear in live naming categories', () => {
  const retired = ledger.retiredPublicForms || []
  const names = new Set([
    ...ledger.states.map(({ name }) => name),
    ...ledger.offices.flatMap(({ state, tiers }) => [state, ...tiers]),
    ...ledger.seriesTitles.map(({ form }) => form),
  ])
  for (const r of retired) {
    const form = typeof r === 'string' ? r : r.form || r.name
    assert.ok(!names.has(form), `retired form "${form}" must not appear as a live name`)
  }
})

test('retired branch preserves private provenance outside the active name registry', () => {
  const mb = ledger.historicalMartialBranch
  assert.ok(mb.name)
  assert.equal(mb.rightsStatus, 'retired')
  assert.equal(mb.formalName, null)
  assert.match(mb.source, /^lore\/editorial\/[^#]+\.json#\//u)
  assert.ok(!Object.hasOwn(ledger, 'martialSchools'))
  assert.ok(!Object.hasOwn(ledger, 'martialBranch'))
})
