import { build, ROOT, REVISIONS } from './gurps-cast.mjs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { loadSheetMetadata } from './cast-sqlite/sheet-metadata.mjs'
const { nameChanges, baseline } = loadSheetMetadata()

// Both inputs ship with the repository. No environment, Git history or network is
// needed during a standard build. Explicit injection is reserved for validation.
export const preservedSheetSources = Object.freeze(Object.fromEntries(REVISIONS.map(revision => [revision,
  Object.freeze({ root: ROOT, ledgerPath: join(ROOT, '..', revision + '.json') }),
])))

// Public consumers do not consume the complete private issued record. Keep this
// allowlist aligned with PersonDetailPage.parseGurpsSheet, never with source keys.
export function projectPublicHistoricalRecord(record) {
  const pick = (value, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]))
  return {
    ...pick(record, ['id', 'name', 'url', 'state', 'personId', 'band']),
    attributes: Object.fromEntries(['ST', 'DX', 'IQ', 'HT'].filter(key => record.attributes?.[key] != null)
      .map(key => [key, pick(record.attributes[key], ['value', 'cp'])])),
    traits: (record.traits ?? []).map(value => pick(value, ['name', 'kind', 'cp', 'rule'])),
    skills: (record.skills ?? []).map(value => pick(value, ['name', 'ko', 'level', 'cp'])),
    secondary: pick(record.secondary ?? {}, ['HP', 'FP', 'Will', 'Per', 'BasicSpeed', 'BasicMove', 'BasicLift', 'Dodge']),
    cp: pick(record.cp ?? {}, ['total', 'attributes', 'advantages', 'disadvantages', 'skills', 'spent', 'unspent']),
  }
}

export function loadPreservedPersonSheets(bindings = preservedSheetSources) {
  if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings) ||
      Object.keys(bindings).length !== REVISIONS.length || REVISIONS.some(revision => {
        const binding = bindings[revision]
        return !binding || typeof binding !== 'object' || Array.isArray(binding) ||
          Object.keys(binding).sort().join() !== 'ledgerPath,root' ||
          typeof binding.root !== 'string' || !binding.root ||
          typeof binding.ledgerPath !== 'string' || !binding.ledgerPath
      })) throw new Error('E_PERSON_SHEET_BINDING: both exact revisions require sealed root and ledgerPath pairs')
  return REVISIONS.map(revision => {
    const binding = bindings[revision]
    const { doc } = build(binding.root, revision, binding.ledgerPath)
    return { revision, ledgerSha256: baseline.revisions[revision].ledgerSha256,
      rules: doc.rules, people: new Map(doc.people.map(person => [person.id, person])) }
  })
}

export function projectPreservedPersonSheet(versions, identity) {
  if (versions.length !== REVISIONS.length || REVISIONS.some(revision => versions.filter(v => v.revision === revision).length !== 1)) {
    throw new Error('E_PERSON_SHEET_REVISIONS')
  }
  if (!/^person-[0-9]{4}$/u.test(identity.personId) || identity.url !== '/people/' + identity.personId) {
    throw new Error('E_PERSON_SHEET_ROUTE')
  }
  if (typeof identity.state !== 'string' || !/^(?:S(?:0[0-9]|1[0-6])|polity:daejeon)$/u.test(identity.state)) {
    throw new Error('E_PERSON_SHEET_CURRENT_STATE')
  }
  return { schema: 'wiki-person-sheet.v1', currentState: identity.state, variants: versions.map(version => {
    const record = version.people.get(identity.id)
    // Affiliation is time-dependent. Only issued IDs, names and stable routes
    // identify the same person across the independently sealed historical sheets.
    const nameChange = nameChanges[identity.id]
    const nameMatches = record?.name === identity.name || (nameChange?.personId === identity.personId && nameChange.historicalName === record?.name && nameChange.currentName === identity.name)
    if (!record || record.id !== identity.id || !nameMatches ||
        record.url !== identity.url || (record.personId !== undefined && record.personId !== identity.personId)) {
      throw new Error('E_PERSON_SHEET_IDENTITY:' + identity.id + ':' + identity.personId)
    }
    if (typeof record.state !== 'string' || !/^S(?:0[0-9]|1[0-6])$/u.test(record.state)) throw new Error('E_PERSON_SHEET_HISTORICAL_STATE')
    return { revision: version.revision, ledgerSha256: version.ledgerSha256, historicalState: record.state,
      rules: structuredClone(version.rules), legacy: { operative: false, record: projectPublicHistoricalRecord(record) } }
  }) }
}
