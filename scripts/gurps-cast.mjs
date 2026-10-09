#!/usr/bin/env node
// Immutable issued-sheet preservation. Legacy names and values are historical data,
// not opposed-d10 ratings. No imported cost or secondary-value calculator runs here.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../vendor/issued-history/corpus')
export const OUT = 'lore/name-pools/gurps-cast.json'
export const SCHEMA = 'wiki-preserved-cast.v1'
const REGISTRY = 'lore/name-pools/person-id-registry.json'
const VALUES = 'lore/name-pools/values-cast.json'
const baseline = JSON.parse(readFileSync(new URL('./issued-preservation-baseline.json', import.meta.url), 'utf8'))
export const REVISIONS = Object.freeze(Object.keys(baseline.revisions))
export const APPROVED_HASHES = Object.freeze({ [VALUES]: baseline.sourceHashes[VALUES], [REGISTRY]: baseline.sourceHashes[REGISTRY] })
export const APPROVED_EXCEPTIONS = {
  K998: { attributes: {"ST":11,"DX":12,"IQ":15,"HT":14}, total: 352, ownerRef: 'call_5dcea0840c6c478d912e9fe7;call_8e40679a3bb241ab8f59a913', curatedSha256: '98ebf8bcc7c88f6d179a693f75021af738abd577c551072fdf97fbeb36237117' },
  K1003: { attributes: {"ST":17,"DX":14,"IQ":13,"HT":14}, total: 330, ownerRef: 'call_67f51ae3300c4f1ba7768fab;call_65868ca8609b4e02829ad705', curatedSha256: '3650a7640014434fc87b371d6d03dedff0c1b5c8d7fe32cd3e92c72dcd23a14e' },
  K1004: { attributes: {"ST":10,"DX":16,"IQ":14,"HT":13}, total: 309, ownerRef: 'call_67f51ae3300c4f1ba7768fab;call_65868ca8609b4e02829ad705', curatedSha256: 'f9307dea9d6890cac817d12114b20bd356df47d4117e45ca48e03f9132a74b2d' },
  K1007: { attributes: {"ST":10,"DX":10,"IQ":20,"HT":11}, total: 338, ownerRef: 'call_5dcea0840c6c478d912e9fe7;call_8e40679a3bb241ab8f59a913', curatedSha256: '3e3df884b01d0ec57c4d4d2d1a453448b7a02adcaf6abeef39b28a90c431b455' },
  K1008: { attributes: {"ST":10,"DX":14,"IQ":20,"HT":11}, total: 429, ownerRef: 'call_5dcea0840c6c478d912e9fe7;call_8e40679a3bb241ab8f59a913', curatedSha256: '2614a71ab2d9335724d109c7c87a2776885c0a52e5c64d97f9af1b4473f28dbe' },
  K1009: { attributes: {"ST":13,"DX":15,"IQ":15,"HT":14}, total: 347, ownerRef: 'call_67f51ae3300c4f1ba7768fab;call_65868ca8609b4e02829ad705', curatedSha256: '928cc6effd3f573c3460f081b6902c5ee66d778c7bed6f1fdc0ce9605903c873' },
  K1017: { attributes: {"ST":10,"DX":12,"IQ":18,"HT":13}, total: 305, ownerRef: 'call_67f51ae3300c4f1ba7768fab;call_65868ca8609b4e02829ad705', curatedSha256: 'e9717bd2bd54b26c52918b227a353d90a6f043deb797506e0033942f61ff8ed0' },
  K1018: { attributes: {"ST":10,"DX":13,"IQ":25,"HT":13}, total: 445, ownerRef: 'call_67f51ae3300c4f1ba7768fab;call_65868ca8609b4e02829ad705', curatedSha256: '686543eb36ee7e09e8138df40b4e772ca24299145a71121bd9dec7b38515eec0' },
  K1019: { attributes: {"ST":10,"DX":13,"IQ":19,"HT":13}, total: 305, ownerRef: 'call_67f51ae3300c4f1ba7768fab;call_65868ca8609b4e02829ad705', curatedSha256: '7bef207f1a2d11955f919ced9ba15030218fcc22d1b9fe2c2640a6dd96aea4f4' },
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const canonical = (value) => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
  : JSON.stringify(value)
const sha256 = (root, path) => sha(readFileSync(join(root, path)))
const leafText = (value) => typeof value === 'string' ? value : Array.isArray(value) ? value.map((run) => run.text).join('') : ''
export function readSource(root, path) {
  const raw = readFileSync(join(root, path), 'utf8')
  return { raw, json: path.endsWith('.json') ? JSON.parse(raw) : null }
}
export function pointerGet(obj, pointer) {
  return pointer.split('/').slice(1).map((k) => k.replace(/~1/g, '/').replace(/~0/g, '~')).reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
// 증거 한 건: 저장소 경로 + JSON 포인터(없으면 파일 전체) + 원문 인용. 인용이 원문에 글자 그대로 있어야 한다.
export function quoteHolds(root, ev) {
  if (!ev || typeof ev.path !== 'string' || typeof ev.quote !== 'string' || !ev.quote) return false
  if (!existsSync(join(root, ev.path))) return false
  const { raw, json } = readSource(root, ev.path)
  if (ev.pointer === undefined) return raw.includes(ev.quote)
  if (!json) return false
  const node = pointerGet(json, ev.pointer)
  return typeof leafText(node) === 'string' && leafText(node).includes(ev.quote)
}



// Event matching only protects historical citation ownership; it assigns no values.
const EVENT_OVERLAP = 0.6
const eventWords = (text) => text.trim().replace(/\.$/u, '').replace(/하였다$/u, '했다').replace(/되었다$/u, '됐다').split(/\s+/u)
const stem = (w) => w.replace(/[,.]$/u, '').replace(/(으로|에서|에게|을|를|이|가|은|는|에|의|로|과|와|도|만)$/u, '')
export function sameEvent(a, b) {
  const wa = eventWords(a)
  const wb = eventWords(b)
  if (wa.at(-1) !== wb.at(-1)) return false
  const sa = new Set(wa.map(stem))
  const sb = new Set(wb.map(stem))
  const shared = [...sa].filter((w) => sb.has(w)).length
  return shared / Math.min(sa.size, sb.size) >= EVENT_OVERLAP
}


function selectedBaseline(revision) {
  if (!REVISIONS.includes(revision)) throw new Error('E_EXPLICIT_REVISION: select one of ' + REVISIONS.join(', '))
  return baseline.revisions[revision]
}

export function numericFields(people) {
  const fields = []
  const visit = (value, pointer, id) => {
    if (typeof value === 'number') fields.push([id, pointer, value])
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value))
      visit(child, pointer + '/' + key.replaceAll('~', '~0').replaceAll('/', '~1'), id)
  }
  for (const person of people) visit(person, '', person.id)
  return fields.sort((a, b) => JSON.stringify(a.slice(0, 2)) < JSON.stringify(b.slice(0, 2)) ? -1 : 1)
}

function operativeRules(revision) {
  return { rulesVersion: baseline.rulesVersion, resolution: 'opposed-d10', sourceRevision: revision,
    numericAdoption: false, legacyValues: 'immutable-not-d10-ratings', originalRatings: null }
}

// A legacy source or the converted envelope is accepted only against sealed hashes.
// Reconstructing the historical document is a structural inverse, never a recalculation.
function historicalDocument(doc) {
  if (doc.schema !== SCHEMA) return doc
  const { legacy, rules, schema, ...rest } = doc
  return { ...rest, ...legacy?.metadata }
}

export function verify(doc, root = ROOT, revision) {
  const seal = selectedBaseline(revision)
  const errors = []
  const fail = (message) => errors.push(message)
  if (!doc || typeof doc !== 'object') return ['E_DOCUMENT: object required']
  if (doc.schema === SCHEMA) {
    if (canonical(doc.rules) !== canonical(operativeRules(revision))) fail('E_OPERATIVE_RULES: unsupported revision or numeric adoption')
    if (doc.legacy?.operative !== false) fail('E_LEGACY_OPERATIVE: historical metadata must be nonoperative')
    if (Object.keys(doc.legacy ?? {}).sort().join() !== 'metadata,operative') fail('E_LEGACY_SHAPE')
    if (Object.keys(doc.legacy?.metadata ?? {}).sort().join() !== 'note,rules,schema') fail('E_LEGACY_METADATA')
  }
  const historical = historicalDocument(doc)
  if (sha(canonical(historical)) !== seal.documentCanonicalSha256) fail('E_SEALED_DOCUMENT: issued allocation, identity, citation ownership or metadata changed')
  for (const [path, hash] of Object.entries(baseline.sourceHashes)) {
    if (!existsSync(join(root, path)) || sha256(root, path) !== hash) fail('승인 해시 변경: ' + path)
  }
  for (const [path, hash] of Object.entries(APPROVED_HASHES)) if (doc.invariants?.[path] !== hash) fail('invariants 불일치: ' + path)
  const registry = readSource(root, REGISTRY).json
  const values = readSource(root, VALUES).json.people
  if (registry.approvalRef?.inputSha256 !== APPROVED_HASHES[VALUES]) fail('registry approvalRef.inputSha256 ≠ values-cast 승인 해시')
  const indexByName = new Map(values.map((person, i) => [person.name, i]))
  if (!Array.isArray(doc.people)) return [...errors, 'E_PEOPLE: array required']
  if (doc.people.length !== seal.personCount || doc.count !== seal.personCount || registry.persons.length !== seal.personCount) fail('E_PERSON_COUNT')
  if (new Set(doc.people.map((person) => person.id)).size !== doc.people.length) fail('E_DUPLICATE_ID')
  const fields = numericFields(doc.people)
  if (fields.length !== seal.numericFieldCount || sha(canonical(fields)) !== seal.numericCanonicalSha256) fail('E_NUMERIC_PRESERVATION: lost, changed, added or duplicated numeric field')
  if (sha(canonical(doc.people)) !== seal.peopleCanonicalSha256) fail('E_PERSON_PRESERVATION: exact issued records changed')
  // Cache only for this verification, so a later check observes changed source bytes.
  const sources = new Map()
  const source = (path) => {
    if (!sources.has(path)) sources.set(path, readSource(root, path))
    return sources.get(path)
  }
  const family = source('lore/name-pools/cast-family-trees.json').json
  const citations = (value, location, person) => {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'evidence') { citations(child, location + '/' + key, person); continue }
      if (!Array.isArray(child)) { fail(person.id + ' evidence 목록 없음: ' + location); continue }
      const seen = new Set()
      for (const ev of child) {
        const tag = person.id + ' ' + person.name + ' ' + location
        // Existing owner notes are sealed with their exact person and slot. They
        // are not file quotations and cannot authorize new or changed allocations.
        if (ev && Object.keys(ev).join() === 'note' && typeof ev.note === 'string') continue
        if (!ev || typeof ev.path !== 'string' || !Object.hasOwn(baseline.sourceHashes, ev.path)) {
          fail(tag + ': 인용 불일치: unsealed source'); continue
        }
        const { raw, json } = source(ev.path)
        const text = ev.pointer === undefined ? raw : leafText(pointerGet(json, ev.pointer))
        if (typeof ev.quote !== 'string' || !ev.quote || !text.includes(ev.quote)) fail(tag + ': 인용 불일치 ' + ev.path + '#' + (ev.pointer ?? ''))
        const key = canonical(ev)
        if (seen.has(key)) fail(tag + ': duplicate citation')
        seen.add(key)
        if (location.startsWith('/attributes/') || location.startsWith('/skills/')) {
          const block = ev.pointer?.startsWith('/content/') ? json?.content?.[Number(ev.pointer.split('/')[2])] : null
          const actor = leafText(block?.text?.ko).match(/선대 ([가-힣]+?)(?:은|는|이|가) /u)?.[1]
          if (block?.anchor?.includes('-백년-가계-') || actor && family.nodes.some((node) => node.kind === 'historical' && node.name === actor &&
            [...node.sourceRefs, ...node.timeline.flatMap((event) => event.sourceRefs)].some((ref) => ref.path === ev.path && ref.anchor === block.anchor)))
            fail(tag + ': 선대 행위는 후손 능력·기술의 근거가 아니다 ' + ev.path + '#' + ev.pointer)
        }
      }
    }
  }
  doc.people.forEach((person, i) => {
    const entry = registry.persons[i]
    const expectedId = 'K' + String(i + 1).padStart(3, '0')
    if (entry?.id !== expectedId || person.id !== entry?.id || person.name !== entry?.name) fail('E_IDENTITY: ' + i + ' ' + person.id)
    const vi = indexByName.get(person.name)
    const url = '/people/person-' + String(vi + 1).padStart(4, '0')
    if (vi === undefined || person.url !== url || person.state !== values[vi]?.state) fail('E_ROUTE_STATE: ' + person.id)
    citations(person, '', person)
  })
  return errors
}

export function build(root = ROOT, revision, ledgerPath = join(root, '..', revision + '.json')) {
  const seal = selectedBaseline(revision)
  const raw = readFileSync(ledgerPath, 'utf8')
  const issued = JSON.parse(raw)
  if (issued.schema !== SCHEMA && sha(raw) !== seal.ledgerSha256) throw new Error('E_SOURCE_HASH: selected revision does not match ledger bytes')
  const errors = verify(issued, root, revision)
  if (errors.length) throw new Error(errors.join('\n'))
  if (issued.schema === SCHEMA) return { doc: issued, review: [] }
  const { schema, note, rules, ...rest } = issued
  const doc = { schema: SCHEMA, ...rest, rules: operativeRules(revision), legacy: { operative: false, metadata: { schema, note, rules } } }
  return { doc, review: [] }
}

export const serialize = (doc) => JSON.stringify(doc, null, 2) + '\n'
export function summary(doc) {
  return { people: doc.people.length, numericFields: numericFields(doc.people).length,
    sourceRevision: doc.rules.sourceRevision, rulesVersion: baseline.rulesVersion, numericAdoption: false }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const revision = args[args.indexOf('--revision') + 1]
  if (args.length !== 3 || !['--check', '--write'].includes(args[0]) || args[1] !== '--revision') {
    console.error('usage: node scripts/gurps-cast.mjs --check|--write --revision <exact revision>')
    process.exit(2)
  }
  try {
    const { doc } = build(ROOT, revision)
    const errors = verify(doc, ROOT, revision)
    if (errors.length) throw new Error(errors.join('\n'))
    if (args[0] === '--write') process.stdout.write(serialize(doc))
    console.error('PASS: immutable issued records, identities, routes, source hashes and citation ownership; no numeric conversion', JSON.stringify(summary(doc)))
  } catch (error) {
    console.error('FAIL: ' + error.message)
    process.exit(1)
  }
}
