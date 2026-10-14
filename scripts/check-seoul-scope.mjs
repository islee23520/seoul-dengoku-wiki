#!/usr/bin/env node
import { createReadStream } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { BASELINE_SHA256, STAGING_GEOGRAPHY_PATH, STAGING_GEOGRAPHY_SCHEMA, STAGING_SOURCES, baselineDocuments, sha256, validateSeoulScope } from './seoul-scope.mjs'
import { CENSUS_PATHS, loadAndValidateCensus } from './seoul-census.mjs'

const json = async path => JSON.parse(await readFile(path, 'utf8'))
const hashFile = async path => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}
const inputError = (path, id = '') => ({ ok: false, errors: [{ code: 'E_SCOPE_INPUT', path, id }] })

export async function loadScopeInput({ root, baselinePath, fixture = false, mode = 'publication', batchId = null }) {
  const baselineBytes = await readFile(baselinePath)
  const baseline = JSON.parse(baselineBytes)
  if (!fixture && sha256(baselineBytes) !== BASELINE_SHA256) return { error: { ok: false, errors: [{ code: 'E_ARCHIVE_HASH', path: baselinePath, id: '' }] } }
  const contract = await json(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json'))
  const archiveHashes = {}
  for (const [name, archive] of Object.entries(baseline.archives)) archiveHashes[name] = await hashFile(resolve(dirname(baselinePath), archive.path))
  const sourceHashes = {}
  for (const path of baselineDocuments(baseline)) {
    try { sourceHashes[path] = await hashFile(resolve(root, path)) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (fixture) return { ...await json(resolve(root, 'scope-input.json')), baseline, baselineSha256: sha256(baselineBytes), contract, archiveHashes, sourceHashes }

  const { loadDataset } = await import(pathToFileURL(resolve(root, 'lore/relations/validate.mjs')))
  const dataset = loadDataset()
  const allocation = await json(resolve(root, 'lore/relations/opening-feudal-allocation.json'))
  const holdings = await json(resolve(root, 'lore/relations/personal-holdings.json'))
  const entitySets = {
    persons: dataset.sources.registry.persons.map(row => row.id), titles: allocation.titles.map(row => row.id),
    holdings: holdings.holdings.map(row => row.id), grants: allocation.grants.map(row => row.id),
    bindings: allocation.existingTitleBindings.map(row => JSON.stringify([row.holdingId, row.titleId])),
    states: dataset.states.map(row => row.id), polities: holdings.polities.map(row => row.id),
    events: dataset.events.map(row => row.id), relations: dataset.relations.map(row => row.id), courts: dataset.config.courts.map(row => row.id),
  }
  const documentPaths = Object.keys(sourceHashes)
  // A new authored file is not silently admitted. The contract itself is metadata, not a lore document.
  async function discover(directory) {
    for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`
      if (entry.isDirectory()) await discover(path)
      else if (entry.isFile() && !documentPaths.includes(path) && !['lore/editorial/Seoul-Scope-Contract.json', STAGING_GEOGRAPHY_PATH, ...CENSUS_PATHS].includes(path)) documentPaths.push(path)
    }
  }
  for (const directory of ['lore', 'docs', 'scripts/data', 'snapshots/build-inputs', 'vendor/issued-history']) await discover(directory)
  const boundaryPath = contract.boundarySource.path
  const boundaryBytes = await readFile(resolve(root, boundaryPath))
  const boundary = { path: boundaryPath, edition: 'admdongkor-20260701', sha256: sha256(boundaryBytes) }
  const geo = JSON.parse(boundaryBytes)
  const refs = geo.features.map(feature => ({
    id: `region:${feature.properties.adm_cd2}`, kind: 'region',
    inside: feature.properties.sido === '11' && feature.properties.sidonm === '서울특별시', boundarySha256: boundary.sha256,
  }))
  // A private stage provides geography/review/approval inputs, never the current census or archive hashes.
  // Missing metadata is honest pending state, not an invented approval.
  let context = { refs, edges: [], geography: null, facts: null, batches: [], review: null }
  try {
    const staged = await json(resolve(root, '.omo/private/seoul-migration/scope-input.json'))
    if (Object.keys(staged).some(key => !Object.hasOwn(context, key))) return { error: inputError('/staging/context') }
    if (staged.refs) {
      const independent = new Map(refs.map(ref => [ref.id, ref]))
      for (const ref of staged.refs) if (independent.has(ref.id) && JSON.stringify(ref) !== JSON.stringify(independent.get(ref.id))) return { error: inputError('/staging/refs', ref.id) }
      staged.refs = [...refs, ...staged.refs.filter(ref => !independent.has(ref.id))]
    }
    context = { ...context, ...staged }
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  let geographyBytes
  try { geographyBytes = await readFile(resolve(root, STAGING_GEOGRAPHY_PATH), 'utf8') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (geographyBytes !== undefined) {
    // Metadata is excluded from authored-document discovery only through this strict
    // consumer. Private context cannot replace independent facts or bypass this file.
    if (context.geography !== null || context.facts !== null) return { error: inputError('/staging/geography') }
    const sources = {}
    for (const [kind, source] of Object.entries(STAGING_SOURCES)) {
      const path = ['membership', 'spatial'].includes(kind) ? resolve(root, source.path)
        : resolve(dirname(baselinePath), 'task-2-source-audit', source.path.split('/').at(-1))
      const body = await readFile(path, 'utf8')
      if (sha256(body) !== source.sha256) return { error: { ok: false, errors: [{ code: 'E_SLOT_EDITION', path: source.path, id: kind }] } }
      sources[kind] = { ...source, body }
    }
    const spatial = JSON.parse(sources.spatial.body)
    if (await hashFile(resolve(root, spatial.geometry.path)) !== spatial.geometry.sha256) return { error: { ok: false, errors: [{ code: 'E_SCOPE_GEOMETRY', path: spatial.geometry.path, id: spatial.edition }] } }
    const official = await json(resolve(root, spatial.geometry.path))
    const features = official.features
    const expected = [...spatial.dongs, ...spatial.counties, ...spatial.gu, spatial.city]
    if (features.length !== expected.length || new Set(features.map(f => f.id)).size !== expected.length
      || expected.some(row => !features.some(f => f.id === row.geometryId))) return { error: { ok: false, errors: [{ code: 'E_SLOT_COVERAGE', path: spatial.geometry.path, id: spatial.edition }] } }
    context.geography = JSON.parse(geographyBytes)
    if (context.geography.schema !== STAGING_GEOGRAPHY_SCHEMA) return { error: inputError('/staging/geography/schema') }
    context.facts = { schema: STAGING_GEOGRAPHY_SCHEMA, sources }
  }
  const rights = [...holdings.holdings, ...allocation.grants].map(row => ({
    id: row.id, holderPersonId: row.holderPersonId, slotStatus: row.slotStatus ?? null,
  }))
  // Exclusion above is conditional on this mandatory strict consumer. Neither a
  // private scope-input override nor inspection mode can supply its denominator.
  const census = await loadAndValidateCensus({ root, baseline, baselineSha256: sha256(baselineBytes), contract, batches: context.batches, review: context.review, mode, batchId })
  if (!census.ok) return { error: census }
  return { contract, baseline, baselineSha256: sha256(baselineBytes), current: { entitySets, documentPaths, rights }, boundary,
    archiveHashes, sourceHashes, ...context, dependencyReport: census.dependencyReport }
}

export async function runScopeCli(argv) {
  const options = { root: resolve(dirname(fileURLToPath(import.meta.url)), '..'), mode: 'publication', batchId: null, fixture: false }
  const seen = new Set()
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (seen.has(flag)) return inputError('/argv', flag)
    seen.add(flag)
    if (flag === '--inspection') options.mode = 'inspection'
    else if (['--root', '--baseline', '--fixture-root', '--migration-batch'].includes(flag)) {
      const value = argv[++index]
      if (!value || value.startsWith('--')) return inputError('/argv', flag)
      if (flag === '--migration-batch') { options.mode = 'migration'; options.batchId = value }
      else if (flag === '--baseline') options.baselinePath = resolve(value)
      else { options.root = resolve(value); options.fixture = flag === '--fixture-root' }
    } else return inputError('/argv', flag)
  }
  if (seen.has('--inspection') && seen.has('--migration-batch') || seen.has('--root') && seen.has('--fixture-root')) return inputError('/argv')
  try {
    if (options.fixture) options.baselinePath ??= resolve(options.root, 'baseline.json')
    else if (!options.baselinePath) {
      const { stdout } = await promisify(execFile)('git', ['-C', options.root, 'rev-parse', '--path-format=absolute', '--git-common-dir'])
      options.baselinePath = resolve(dirname(stdout.trim()), '.omo/private/seoul-migration/baseline.json')
    }
    if (options.mode === 'migration' && !options.fixture) {
      const stage = resolve(options.root, '.omo/private/seoul-migration', options.batchId)
      if (relative(resolve(options.root, '.omo/private/seoul-migration'), stage).startsWith('..')) return inputError('/batchId', options.batchId)
      if (!(await stat(stage)).isDirectory()) return inputError('/migration', options.batchId)
      // Staging uses the same source-root format. It cannot write public outputs.
      options.root = stage
    }
    const input = await loadScopeInput(options)
    const { dependencyReport, ...scopeInput } = input
    const result = input.error ?? validateSeoulScope(scopeInput, { mode: options.mode, batchId: options.batchId })
    return result.ok && dependencyReport ? { ...result, dependencyReport } : result
  } catch (error) {
    if (error.code?.startsWith('E_')) return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id ?? '' }] }
    return inputError(error.path ?? '/input', error.code ?? error.name)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runScopeCli(process.argv.slice(2))
  process.stdout.write(`${JSON.stringify(result)}\n`)
  process.exitCode = result.ok ? 0 : 1
}
