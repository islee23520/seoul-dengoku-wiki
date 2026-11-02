import { CanonError } from './errors.mjs'

const ANNOTATIONS = new Set(['$schema', '$id', 'title', 'description', '$defs'])

const typeOk = (type, value) => {
  switch (type) {
    case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'array': return Array.isArray(value)
    case 'string': return typeof value === 'string'
    case 'integer': return Number.isInteger(value)
    default: throw new CanonError('E_SCHEMA_UNSUPPORTED', `type ${type}`)
  }
}

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new CanonError('E_SCHEMA_UNSUPPORTED', `$ref ${ref}`)
  return ref.slice(2).split('/').reduce((node, part) => node?.[part], root)
}

// Returns the first violation as `path: message`, or null. Unknown keywords throw so the schema cannot silently stop being enforced.
export function checkSchema(root, schema, value, path = '$') {
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  for (const [keyword, rule] of Object.entries(schema)) {
    if (ANNOTATIONS.has(keyword)) continue
    let error = null
    switch (keyword) {
      case '$ref': error = checkSchema(root, resolveRef(root, rule), value, path); break
      case 'type': if (!typeOk(rule, value)) error = `${path}: expected ${rule}`; break
      case 'const': if (!equal(rule, value)) error = `${path}: expected const ${JSON.stringify(rule)}`; break
      case 'enum': if (!rule.some((item) => equal(item, value))) error = `${path}: not in enum`; break
      case 'minimum': if (typeof value === 'number' && value < rule) error = `${path}: below ${rule}`; break
      case 'minLength': if (typeof value === 'string' && value.length < rule) error = `${path}: too short`; break
      case 'pattern': if (typeof value === 'string' && !new RegExp(rule, 'u').test(value)) error = `${path}: pattern ${rule}`; break
      case 'minItems': if (Array.isArray(value) && value.length < rule) error = `${path}: too few items`; break
      case 'items':
        if (Array.isArray(value)) for (const [i, item] of value.entries()) error ??= checkSchema(root, rule, item, `${path}[${i}]`)
        break
      case 'required':
        if (typeof value === 'object' && value !== null) for (const key of rule) if (!Object.hasOwn(value, key)) error ??= `${path}: missing ${key}`
        break
      case 'properties':
        if (typeof value === 'object' && value !== null) for (const [key, sub] of Object.entries(rule)) if (Object.hasOwn(value, key)) error ??= checkSchema(root, sub, value[key], `${path}.${key}`)
        break
      case 'additionalProperties':
        if (rule !== false) throw new CanonError('E_SCHEMA_UNSUPPORTED', 'additionalProperties other than false')
        if (typeof value === 'object' && value !== null) for (const key of Object.keys(value)) if (!Object.hasOwn(schema.properties ?? {}, key)) error ??= `${path}: unexpected ${key}`
        break
      case 'oneOf': {
        const matches = rule.filter((branch) => checkSchema(root, branch, value, path) === null).length
        if (matches !== 1) error = `${path}: matched ${matches} oneOf branches`
        break
      }
      default: throw new CanonError('E_SCHEMA_UNSUPPORTED', `keyword ${keyword}`)
    }
    if (error) return error
  }
  return null
}
