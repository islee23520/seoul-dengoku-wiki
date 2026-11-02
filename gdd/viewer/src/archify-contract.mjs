export class ArchifyContractError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ArchifyContractError'
    this.code = code
  }
}

const exactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
const validIdentity = (value) => typeof value.domainId === 'string' && /^D(?:0[1-9]|1[0-8])$/.test(value.domainId)
  && typeof value.diagramId === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value.diagramId) && value.diagramId.length <= 100
  && typeof value.moduleTitle === 'string' && value.moduleTitle.trim() === value.moduleTitle
  && value.moduleTitle.length > 0 && value.moduleTitle.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value.moduleTitle)

export function parseArchifyReference(source) {
  let value
  try { value = JSON.parse(source) } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    throw new ArchifyContractError('E_ARCHIFY_REF_JSON')
  }
  if (!exactKeys(value, ['domainId', 'diagramId', 'moduleTitle']) || !validIdentity(value)) {
    throw new ArchifyContractError('E_ARCHIFY_REF_SCHEMA')
  }
  return value
}

export function parseArchifyManifest(value) {
  if (!exactKeys(value, ['schemaVersion', 'diagrams']) || value.schemaVersion !== 1 || !Array.isArray(value.diagrams)) {
    throw new ArchifyContractError('E_ARCHIFY_MANIFEST_SCHEMA')
  }
  const identities = new Set()
  const files = new Set()
  for (const entry of value.diagrams) {
    if (!exactKeys(entry, ['domainId', 'diagramId', 'moduleTitle', 'file', 'sha256']) || !validIdentity(entry)
      || typeof entry.file !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(entry.file) || entry.file.length > 150
      || typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new ArchifyContractError('E_ARCHIFY_MANIFEST_ENTRY')
    }
    const identity = `${entry.domainId}:${entry.diagramId}`
    if (identities.has(identity) || files.has(entry.file)) throw new ArchifyContractError('E_ARCHIFY_MANIFEST_DUPLICATE')
    identities.add(identity)
    files.add(entry.file)
  }
  return value
}

export function resolveArchifyReference(reference, manifest) {
  const entry = manifest.diagrams.find((candidate) => candidate.domainId === reference.domainId && candidate.diagramId === reference.diagramId)
  if (!entry || entry.moduleTitle !== reference.moduleTitle) throw new ArchifyContractError('E_ARCHIFY_REF_UNREGISTERED')
  return entry
}

export const archifyHref = (entry) => `/gdd/archify/${entry.file}?sha256=${entry.sha256}`
