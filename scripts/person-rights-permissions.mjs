const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const token = (value) => typeof value === 'string' && /^[a-z][a-z0-9-]{2,79}$/u.test(value)
const keys = (value, allowed) => record(value) && Object.keys(value).every(key => allowed.includes(key))
const date = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
// References are public repository material, never consent correspondence or local paths.
const publicRef = (value) => typeof value === 'string' && /^https:\/\/github\.com\/islee23520\/seoul-dengoku(?:-wiki|-gdd)?\/(?:blob\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_./-]+|issues\/\d+|pull\/\d+)(?:#[a-zA-Z0-9_-]+)?$/u.test(value) && !/(?:\.\.|\.omo|private|consent|signature|contact)/iu.test(value)

export function parsePersonRightsPermissions(raw, issuedPersons) {
  const reject = (code) => { throw new Error(`E_PERSON_RIGHTS_${code}`) }
  if (!keys(raw, ['schema', 'persons']) || raw.schema !== 'person-rights-permissions.v1' || !record(raw.persons)) reject('SCHEMA')
  const issuedIds = new Set(issuedPersons.map(person => person.id))
  const persons = new Map()
  for (const [personId, entry] of Object.entries(raw.persons)) {
    if (!/^K\d{3,4}$/u.test(personId) || !issuedIds.has(personId)) reject('IDENTITY')
    if (!keys(entry, ['applicability', 'identityBasisRef', 'externalReuseRequiresSeparateSubjectPermission', 'nameUse', 'likenessUse']) || entry.applicability !== 'real-person' || !token(entry.identityBasisRef) || entry.externalReuseRequiresSeparateSubjectPermission !== true) reject('APPLICABILITY')
    const permissions = { applicability: entry.applicability, identityBasisRef: entry.identityBasisRef, externalReuseRequiresSeparateSubjectPermission: true }
    for (const scope of ['nameUse', 'likenessUse']) {
      const permission = entry[scope] ?? { status: 'not-recorded', uses: [] }
      if (!keys(permission, ['status', 'uses', 'date', 'recordedOn', 'evidenceRef', 'priorLicenses'])) reject('PRIVATE_FIELD')
      if (!['not-recorded', 'granted', 'revoked', 'declined'].includes(permission.status)) reject('STATUS')
      if (!Array.isArray(permission.uses) || permission.uses.some(use => !['wiki-display', 'game-use', 'commercial-use'].includes(use)) || new Set(permission.uses).size !== permission.uses.length) reject('USES')
      if (permission.status !== 'granted' && permission.uses.length) reject('INACTIVE_GRANT')
      if (permission.date !== undefined && !date(permission.date)) reject('DATE')
      if (permission.recordedOn !== undefined && !date(permission.recordedOn)) reject('DATE')
      if (permission.evidenceRef !== undefined && !token(permission.evidenceRef)) reject('EVIDENCE_REF')
      if (permission.status === 'granted' && (!(permission.date || permission.recordedOn) || !permission.evidenceRef)) reject('GRANT_EVIDENCE')
      if (permission.priorLicenses !== undefined) {
        if (!Array.isArray(permission.priorLicenses)) reject('PRIOR_LICENSE')
        for (const license of permission.priorLicenses) {
          if (!keys(license, ['sourceRef', 'licenseRef', 'conditionsRef']) || !publicRef(license.sourceRef) || !publicRef(license.licenseRef) || !publicRef(license.conditionsRef)) reject('PRIOR_LICENSE_REF')
        }
      }
      permissions[scope] = structuredClone(permission)
    }
    persons.set(personId, permissions)
  }
  return persons
}
