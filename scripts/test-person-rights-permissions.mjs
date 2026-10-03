import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { PersonPermissions } from '../src/pages/PersonDetailPage.tsx'
import { parsePersonRightsPermissions } from './person-rights-permissions.mjs'

const issued = [{ id: 'K998', name: 'same-name' }, { id: 'K999', name: 'same-name' }]
const missing = () => ({ status: 'not-recorded', uses: [] })
const entry = () => ({ applicability: 'real-person', identityBasisRef: 'owner-confirmed-identity', externalReuseRequiresSeparateSubjectPermission: true, nameUse: missing(), likenessUse: missing() })
const registry = (person = entry()) => ({ schema: 'person-rights-permissions.v1', persons: { K998: person } })
const grant = () => ({ status: 'granted', uses: ['wiki-display'], date: '2026-10-03', evidenceRef: 'subject-permission-record-001' })
const panel = (permissions) => new JSDOM(renderToStaticMarkup(createElement(PersonPermissions, { permissions }))).window.document

for (const scope of ['nameUse', 'likenessUse']) test(`only ${scope} is granted when its evidence is supplied`, () => {
  // Given: one explicitly scoped subject grant, the other scope missing.
  const person = { ...entry(), [scope]: grant() }
  // When: parse and render the same permission projection used by the card.
  const parsed = parsePersonRightsPermissions(registry(person), issued).get('K998')
  const dom = panel(parsed)
  // Then: only the selected scope is granted; display permission never implies commercial permission.
  const other = scope === 'nameUse' ? 'likenessUse' : 'nameUse'
  assert.equal(dom.querySelector(`[data-permission-scope="${scope}"]`).dataset.permissionStatus, 'granted')
  assert.equal(dom.querySelector(`[data-permission-scope="${other}"]`).dataset.permissionStatus, 'not-recorded')
  assert.deepEqual(parsed[scope].uses, ['wiki-display'])
})

for (const status of ['not-recorded', 'revoked', 'declined']) test(`preserves ${status} without approval promotion`, () => {
  const person = { ...entry(), nameUse: { status, uses: [] } }
  const parsed = parsePersonRightsPermissions(registry(person), issued).get('K998')
  assert.equal(panel(parsed).querySelector('[data-permission-scope="nameUse"]').dataset.permissionStatus, status)
  assert.deepEqual(parsed.nameUse.uses, [])
})

test('missing scope becomes not-recorded without propagating the other grant', () => {
  const person = entry()
  person.nameUse = grant()
  delete person.likenessUse
  const parsed = parsePersonRightsPermissions(registry(person), issued).get('K998')
  assert.deepEqual(parsed.likenessUse, missing())
})

test('owner-confirmed project grants retain unknown permission date and require external consent', () => {
  const confirmed = { status: 'granted', uses: [], recordedOn: '2026-10-03', evidenceRef: 'owner-current-subject-permissions-20261003' }
  const person = { ...entry(), nameUse: confirmed, likenessUse: confirmed }
  const parsed = parsePersonRightsPermissions(registry(person), issued).get('K998')
  const dom = panel(parsed)
  assert.equal(dom.querySelectorAll('[data-permission-status="granted"]').length, 2)
  assert.equal(dom.querySelector('[data-external-reuse-permission]').dataset.externalReusePermission, 'required')
  assert.equal(parsed.nameUse.date, undefined)
  assert.deepEqual(parsed.nameUse.uses, [])
  assert.equal(parsed.externalReuseRequiresSeparateSubjectPermission, true)
})

test('future real-person record has no grant inherited from current subjects', () => {
  const current = { ...entry(), nameUse: grant(), likenessUse: grant() }
  const future = { ...registry(current), persons: { K998: current, K999: entry() } }
  const parsed = parsePersonRightsPermissions(future, issued).get('K999')
  assert.equal(parsed.nameUse.status, 'not-recorded')
  assert.equal(parsed.likenessUse.status, 'not-recorded')
  assert.equal(panel(parsed).querySelector('[data-external-reuse-permission]').dataset.externalReusePermission, 'required')
})

test('real-person registry cannot drop separate external subject permission requirement', () => {
  assert.throws(() => parsePersonRightsPermissions(registry({ ...entry(), externalReuseRequiresSeparateSubjectPermission: false }), issued), /E_PERSON_RIGHTS_APPLICABILITY/u)
})

test('joins by issued ID and leaves same-name and fictional cards untouched', () => {
  const parsed = parsePersonRightsPermissions(registry(), issued)
  assert.equal(parsed.has('K999'), false)
  assert.equal(panel(parsed.get('K999')).querySelector('[data-person-permissions]'), null)
  assert.throws(() => parsePersonRightsPermissions({ ...registry(), persons: { K997: entry() } }, issued), /E_PERSON_RIGHTS_IDENTITY/u)
})

test('rejects grants without scope-specific evidence and inactive granted uses', () => {
  const person = entry()
  person.nameUse = { status: 'granted', uses: ['commercial-use'] }
  assert.throws(() => parsePersonRightsPermissions(registry(person), issued), /E_PERSON_RIGHTS_GRANT_EVIDENCE/u)
  person.nameUse = { ...grant(), status: 'revoked' }
  assert.throws(() => parsePersonRightsPermissions(registry(person), issued), /E_PERSON_RIGHTS_INACTIVE_GRANT/u)
})

test('rejects malformed statuses dates and use scopes', () => {
  for (const permission of [{ ...grant(), status: 'art-approved' }, { ...grant(), date: '2026-02-30' }, { ...grant(), uses: ['all-rights'] }]) {
    assert.throws(() => parsePersonRightsPermissions(registry({ ...entry(), nameUse: permission }), issued), /E_PERSON_RIGHTS_/u)
  }
})

test('rejects private correspondence fields and unsafe references before publication', () => {
  for (const permission of [
    { ...missing(), contact: 'person@example.com' },
    { ...missing(), signature: 'signature-data' },
    { ...missing(), evidenceRef: '/Users/person/private/consent.pdf' },
    { ...missing(), evidenceRef: 'person@example.com' },
  ]) assert.throws(() => parsePersonRightsPermissions(registry({ ...entry(), nameUse: permission }), issued), /E_PERSON_RIGHTS_/u)
  for (const ref of ['file:///private/receipt', 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/.omo/consent.pdf', 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/LICENSE?email=person@example.com', 'javascript:alert(1)']) {
    const priorLicenses = [{ sourceRef: ref, licenseRef: ref, conditionsRef: ref }]
    assert.throws(() => parsePersonRightsPermissions(registry({ ...entry(), nameUse: { ...missing(), priorLicenses } }), issued), /E_PERSON_RIGHTS_PRIOR_LICENSE_REF/u)
  }
})

test('prior-license conditions stay bound to covered source and scope without granting consent', () => {
  const priorLicense = {
    sourceRef: 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/lore/characters/Core-Characters.json',
    licenseRef: 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/LICENSE',
    conditionsRef: 'https://github.com/islee23520/seoul-dengoku-wiki/blob/main/LICENSE#conditions',
  }
  const parsed = parsePersonRightsPermissions(registry({ ...entry(), nameUse: { ...missing(), priorLicenses: [priorLicense] } }), issued).get('K998')
  const dom = panel(parsed)
  assert.equal(dom.querySelector('[data-permission-scope="nameUse"] [data-prior-license-source]').dataset.priorLicenseSource, priorLicense.sourceRef)
  assert.equal(dom.querySelector('[data-permission-scope="likenessUse"] [data-prior-license-source]'), null)
  assert.equal(parsed.nameUse.status, 'not-recorded')
  assert.equal(parsed.likenessUse.status, 'not-recorded')
})

test('actual canonical registry publishes current confirmed grants without future or external grants', async () => {
  const actual = JSON.parse(await readFile(new URL('../person-rights-permissions.json', import.meta.url), 'utf8'))
  const issued = JSON.parse(await readFile(new URL('../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8')).persons
  const parsed = parsePersonRightsPermissions(actual, issued)
  const published = []
  for (const id of ['person-0998', 'person-1007', 'person-1008', 'person-0001']) {
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${id}.json`, import.meta.url), 'utf8'))
    const expected = parsed.get(detail.gurps.id)
    assert.deepEqual(detail.rightsPermissions, expected)
    if (expected) {
      published.push(detail.gurps.id)
      assert.equal(expected.nameUse.status, 'granted')
      assert.equal(expected.likenessUse.status, 'granted')
      assert.deepEqual(expected.nameUse.uses, [])
      assert.deepEqual(expected.likenessUse.uses, [])
      assert.equal(expected.nameUse.date, undefined)
      assert.equal(expected.likenessUse.date, undefined)
      assert.equal(expected.externalReuseRequiresSeparateSubjectPermission, true)
      assert.equal(panel(expected).querySelector('[data-external-reuse-permission]').dataset.externalReusePermission, 'required')
    }
  }
  assert.deepEqual(new Set(published), new Set(parsed.keys()))
})
