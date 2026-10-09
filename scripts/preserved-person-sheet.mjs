import { build, REVISIONS } from './gurps-cast.mjs'
import { readFileSync } from 'node:fs'
import { URL } from 'node:url'

const baseline = JSON.parse(readFileSync(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))

// Production supplies an exact revision -> { root, ledgerPath } JSON map. The
// shared root owns the sealed citation corpus; ledgerPath binds the immutable
// historical ledger independently. Never infer latest or copy a ledger.
export function loadPreservedPersonSheets(bindings) {
  if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings) ||
      Object.keys(bindings).length !== REVISIONS.length || REVISIONS.some(revision => {
        const binding = bindings[revision]
        return !binding || typeof binding !== 'object' || Array.isArray(binding) ||
          Object.keys(binding).sort().join() !== 'ledgerPath,root' ||
          typeof binding.root !== 'string' || !binding.root ||
          typeof binding.ledgerPath !== 'string' || !binding.ledgerPath
      })) {
    throw new Error('E_PERSON_SHEET_BINDING: WIKI_PERSON_SHEET_SOURCES must map both exact revisions to sealed root and ledgerPath pairs')
  }
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
  return { schema: 'wiki-person-sheet.v1', variants: versions.map(version => {
    const record = version.people.get(identity.id)
    if (!record || record.id !== identity.id || record.name !== identity.name || record.state !== identity.state ||
        record.url !== identity.url || (record.personId !== undefined && record.personId !== identity.personId)) {
      throw new Error('E_PERSON_SHEET_IDENTITY:' + identity.id + ':' + identity.personId)
    }
    return { revision: version.revision, ledgerSha256: version.ledgerSha256,
      rules: structuredClone(version.rules), legacy: { operative: false, record: structuredClone(record) } }
  }) }
}
