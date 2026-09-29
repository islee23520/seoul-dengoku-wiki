import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ledger = JSON.parse(await readFile(new URL('../lore/editorial/Naming-Ledger.json', import.meta.url), 'utf8'))

test('martial schools carry formal names and hanja', () => {
  const schools = ledger.martialSchools || []
  assert.ok(schools.length >= 38, `expected at least 38 schools, got ${schools.length}`)
  for (const school of schools) {
    assert.ok(school.formalName, 'formalName required')
    assert.ok(school.hanja, `hanja required for ${school.formalName}`)
  }
  const names = schools.map(s => s.formalName)
  assert.equal(new Set(names).size, names.length, 'school names must be unique')
})

test('retired public forms do not reappear as formal names or aliases', () => {
  const retired = ledger.retiredPublicForms || []
  const names = new Set()
  for (const s of ledger.martialSchools || []) {
    names.add(s.formalName)
    if (s.alias) names.add(s.alias)
  }
  for (const r of retired) {
    const form = typeof r === 'string' ? r : r.form || r.name
    assert.ok(!names.has(form), `retired form "${form}" must not appear as a school name`)
  }
})

test('imported gaebang branch entry carries a source anchor', () => {
  const mb = ledger.martialBranch
  assert.ok(mb, 'martialBranch entry required')
  assert.ok(mb.name, 'martialBranch name required')
  assert.ok(mb.source, 'martialBranch source anchor required')
})
