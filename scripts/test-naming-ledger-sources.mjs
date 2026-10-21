import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readCanonicalAuthoringSchemas } from './cast-sqlite/authoring-schema-documents.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'

const ledger = readCanonicalDocument('lore/editorial/Naming-Ledger.json')
const schema = readCanonicalAuthoringSchemas()['lore/editorial/Naming-Ledger.schema.json']

// RFC 6901: '#/a/b' walks keys and array indexes; '~1' is '/' and '~0' is '~'.
function resolvePointer(document, pointer) {
  let node = document
  for (const token of pointer.slice(1).split('/').map((part) => decodeURIComponent(part).replaceAll('~1', '/').replaceAll('~0', '~'))) {
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, token)) return undefined
    node = node[token]
  }
  return node
}

// Source paths are document identities; fragments must resolve in the typed document.
export function sourceFailures(source, terms = []) {
  const [path, pointer] = source.split('#')
  let document
  try { document = readCanonicalDocument(path) } catch (error) {
    if (error.message === `E_CANONICAL_DOCUMENT_IDENTITY:${path}`) return [`missing file: ${source}`]
    throw error
  }
  const text = typeof document === 'string' ? document : JSON.stringify(document)
  let block = text
  if (pointer !== undefined) {
    if (!path.endsWith('.json') || !pointer.startsWith('/')) return [`not a JSON pointer: ${source}`]
    const node = resolvePointer(document, pointer)
    if (node === undefined) return [`missing pointer: ${source}`]
    block = JSON.stringify(node)
  }
  return terms.filter((term) => !block.includes(term)).map((term) => `term "${term}" not in ${source}`)
}

function ledgerSources() {
  return [
    ...ledger.states.flatMap(({ name, sources }) => sources.map((source) => [source, [name]])),
    ...ledger.offices.map(({ state, tiers, source }) => [source, [state, ...tiers]]),
    ...ledger.seriesTitles.map(({ form, source }) => [source, [form]]),
    ...ledger.retiredPublicForms.map(({ form, source }) => [source, [form]]),
  ]
}

function sourceEntryCount() {
  return ledger.states.reduce((count, { sources }) => count + sources.length, 0)
    + ledger.offices.length
    + ledger.seriesTitles.length
    + ledger.retiredPublicForms.length
}

function schemaFailures(value, node, at) {
  if (node.$ref) return schemaFailures(value, resolvePointer(schema, node.$ref.slice(1)), at)
  const failures = []
  const types = [node.type ?? []].flat()
  const typeOf = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value
  if (types.length && !types.includes(typeOf)) return [`${at}: expected ${types.join('|')}, got ${typeOf}`]
  if ('const' in node && value !== node.const) failures.push(`${at}: expected ${node.const}`)
  if (node.enum && !node.enum.includes(value)) failures.push(`${at}: ${value} not in enum`)
  if (typeof value === 'string' && node.minLength && value.length < node.minLength) failures.push(`${at}: too short`)
  if (typeof value === 'string' && node.pattern && !new RegExp(node.pattern, 'u').test(value)) failures.push(`${at}: ${value} does not match ${node.pattern}`)
  if (Array.isArray(value)) {
    if (node.minItems && value.length < node.minItems) failures.push(`${at}: fewer than ${node.minItems} items`)
    if (node.items) value.forEach((item, i) => failures.push(...schemaFailures(item, node.items, `${at}/${i}`)))
  }
  if (typeOf === 'object') {
    for (const key of node.required ?? []) if (!(key in value)) failures.push(`${at}: missing ${key}`)
    for (const [key, child] of Object.entries(value)) {
      if (node.properties?.[key]) failures.push(...schemaFailures(child, node.properties[key], `${at}/${key}`))
      else if (node.additionalProperties === false) failures.push(`${at}: unexpected ${key}`)
    }
  }
  return failures
}

test('naming ledger matches its schema', () => {
  assert.deepEqual(schemaFailures(ledger, schema, ''), [])
})

test('every naming ledger source file and JSON pointer exists and names the entry', () => {
  const sources = ledgerSources()
  assert.equal(sources.length, sourceEntryCount())
  assert.deepEqual(sources.flatMap(([source, terms]) => sourceFailures(source, terms)), [])
})

test('a missing source file, missing pointer or absent term fails', () => {
  assert.deepEqual(sourceFailures('lore/factions/Sixteen-States.md'), ['missing file: lore/factions/Sixteen-States.md'])
  assert.deepEqual(sourceFailures('lore/factions/Sixteen-States.json#/content/99999'), ['missing pointer: lore/factions/Sixteen-States.json#/content/99999'])
  assert.deepEqual(sourceFailures('lore/factions/Sixteen-States.json#16국-기원'), ['not a JSON pointer: lore/factions/Sixteen-States.json#16국-기원'])
  assert.equal(sourceFailures('lore/factions/Sixteen-States.json#/content/7/rows/1', ['규격맹']).length, 1)
})

test('schema rejects remaining naming categories without their sources', () => {
  for (const category of ['states', 'offices', 'seriesTitles', 'retiredPublicForms']) {
    const broken = structuredClone(ledger)
    delete broken[category][0][category === 'states' ? 'sources' : 'source']
    assert.ok(schemaFailures(broken, schema, '').some((failure) => failure.includes('missing source')), category)
  }
})

test('live naming contract needs neither martial page nor historical entries', () => {
  const live = structuredClone(ledger)
  delete live.historicalMartialSchools
  delete live.historicalMartialBranch
  assert.deepEqual(schemaFailures(live, schema, ''), [])
  assert.ok(ledgerSources().every(([source]) => !source.includes('Martial-Paths') && !source.includes('Martial-Concept-Design')))
  for (const category of ['martialSchools', 'martialBranch']) {
    const broken = { ...live, [category]: [] }
    assert.ok(schemaFailures(broken, schema, '').some((failure) => failure.includes(`unexpected ${category}`)))
  }
})

test('retired branch provenance cannot become an active public transmission', () => {
  for (const mutate of [
    (branch) => { delete branch.rightsStatus },
    (branch) => { branch.rightsStatus = 'original' },
    (branch) => { branch.source = 'lore/culture/Martial-Paths.json#/content/35' },
    (branch) => { branch.formalName = branch.name },
  ]) {
    const broken = structuredClone(ledger)
    mutate(broken.historicalMartialBranch)
    assert.ok(schemaFailures(broken, schema, '').length > 0)
  }
})
