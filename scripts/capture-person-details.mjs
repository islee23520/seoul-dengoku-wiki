import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { loadPersonDetailSources, loadPersonHoldingsContext, projectPersonStateInputs,
  currentOfficeAppointments, produceFromPersonDetailSources } from './person-detail-inputs.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const producerPaths = ['scripts/capture-person-details.mjs', 'scripts/person-detail-inputs.mjs',
  'scripts/person-detail-production.mjs', 'scripts/generate-catalog.mjs',
  'scripts/opening-feudal-allocation.mjs', 'scripts/current-affiliation.mjs',
  'scripts/admin-territorial-scale.mjs', 'scripts/outside-occupation.mjs',
  'scripts/holding-facility.mjs', 'scripts/lore-json-render.mjs',
  'scripts/cast-birthdays.mjs', 'scripts/cast-family-trees.mjs',
  'scripts/cast-household-relations.mjs', 'scripts/household-humanoid-policy.mjs',
  'scripts/person-rights-permissions.mjs', 'scripts/personal-holdings.mjs',
  'scripts/atlas-people-context.mjs', 'scripts/feedback-source-catalog.mjs',
  'scripts/validate-character-profiles.mjs', 'scripts/character-profile.mjs',
  'scripts/preserved-person-sheet.mjs', 'scripts/gurps-cast.mjs',
  'lore/relations/validate.mjs']

export async function assertCapturedSourcesUnchanged(root, rows, baselinePath, baselineSha256, read = readFile) {
  if (hash(await read(baselinePath)) !== baselineSha256) throw new Error('E_PERSON_CAPTURE_SOURCE_DRIFT:baseline')
  for (const row of rows) {
    if (!row.path || row.path.startsWith('/') || row.path.split('/').includes('..')
      || hash(await read(resolve(root, row.path))) !== row.sha256)
      throw new Error('E_PERSON_CAPTURE_SOURCE_DRIFT:' + row.path)
  }
}
const equalSet = (actual, expected, code) => {
  if (actual.length !== expected.length || new Set(actual).size !== actual.length
    || new Set(expected).size !== expected.length || actual.some(id => !expected.includes(id))) throw new Error(code)
}

export function assertBaselineIdentity(details, expectedIds, expectedPairs) {
  if (!Array.isArray(details) || !Array.isArray(expectedIds) || expectedIds.length !== 1022) throw new Error('E_PERSON_CAPTURE_BASELINE')
  equalSet(details.map(row => row?.characterId), expectedIds, 'E_PERSON_CAPTURE_IDENTITY')
  equalSet(details.map(row => row?.id), expectedIds.map((_, index) => `person-${String(index + 1).padStart(4, '0')}`), 'E_PERSON_CAPTURE_PUBLIC_IDENTITY')
  if (!Array.isArray(expectedPairs)) throw new Error('E_PERSON_CAPTURE_BASELINE')
  equalSet(expectedPairs.map(row => row.characterId), expectedIds, 'E_PERSON_CAPTURE_BASELINE')
  equalSet(expectedPairs.map(row => row.id), details.map(row => row.id), 'E_PERSON_CAPTURE_BASELINE')
  const issuedByPublicId = new Map(expectedPairs.map(row => [row.id, row.characterId]))
  if (details.some(row => issuedByPublicId.get(row.id) !== row.characterId)) throw new Error('E_PERSON_CAPTURE_IDENTITY_BINDING')
}

export function capturePaths(repoRoot, outputDir = '.omo/private/seoul-migration/person-detail-private-capture-20261015') {
  const privateRoot = resolve(repoRoot, outputDir)
  const child = relative(resolve(repoRoot, '.omo/private/seoul-migration'), privateRoot)
  if (!child || dirname(child) !== '.' || child === '..') throw new Error('E_PERSON_CAPTURE_OUTPUT_DIR')
  return { privateRoot, snapshot: resolve(privateRoot, 'full-snapshot.json'), manifest: resolve(privateRoot, 'source-hashes.json') }
}

export async function reserveCaptureDirectory(paths) {
  try { await mkdir(paths.privateRoot) } catch (error) {
    if (error.code === 'EEXIST') throw new Error('E_PERSON_CAPTURE_OUTPUT_EXISTS:' + paths.privateRoot)
    throw error
  }
}

export async function collectPersonDetails(repoRoot, outputDir) {
  const paths = capturePaths(repoRoot, outputDir)
  const { stdout } = await promisify(execFile)('git', ['-C', repoRoot, 'rev-parse', '--path-format=absolute', '--git-common-dir'])
  const baselinePath = resolve(dirname(stdout.trim()), '.omo/private/seoul-migration/baseline.json')
  const baselineBytes = await readFile(baselinePath)
  if (hash(baselineBytes) !== '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223') throw new Error('E_PERSON_CAPTURE_BASELINE')
  const baseline = JSON.parse(baselineBytes.toString())
  if (baseline.immutable !== true) throw new Error('E_PERSON_CAPTURE_BASELINE')
  const sources = await loadPersonDetailSources({ repoRoot })
  const state = projectPersonStateInputs(sources.renderedBySlug, sources.pagesBySlug)
  const context = await loadPersonHoldingsContext(sources, { repoRoot, ...state })
  const produced = await produceFromPersonDetailSources(sources, {
    personalHoldings: context.personalHoldings, stateNameById: state.stateNameById,
    tiersByState: state.tiersByState, officeAppointments: currentOfficeAppointments(sources.officeAppointmentSource, sources.issuedById),
  })
  const expectedPairs = []
  for (const row of baseline.files.filter(row => /^public\/person-details\/person-\d+\.json$/u.test(row.path))) {
    const bytes = await sources.bytesFor(row.path)
    if (hash(bytes) !== row.sha256) throw new Error('E_PERSON_CAPTURE_BASELINE_PUBLIC:' + row.path)
    const detail = JSON.parse(bytes.toString())
    if (row.path !== `public/person-details/${detail.id}.json`) throw new Error('E_PERSON_CAPTURE_BASELINE_PUBLIC:' + row.path)
    expectedPairs.push({ id: detail.id, characterId: detail.characterId })
  }
  assertBaselineIdentity(produced.personDetails, baseline.currentEntitySets.persons, expectedPairs)
  const snapshotBytes = Buffer.from(`${JSON.stringify({ schema: 'person-detail-private-full-snapshot.v1', details: produced.personDetails }, null, 2)}\n`)
  for (const path of producerPaths) await sources.bytesFor(path)
  const sourceHashes = [...sources.sourceBytes].map(([path, bytes]) => ({ path, sha256: hash(bytes), bytes: bytes.length }))
    .sort((a, b) => a.path.localeCompare(b.path))
  const manifest = {
    schema: 'person-detail-private-source-hashes.v1', count: produced.personDetails.length,
    baseline: { path: baselinePath, sha256: hash(baselineBytes) },
    snapshots: context.snapshotManifest.files, sources: sourceHashes,
    snapshot: { path: relative(repoRoot, paths.snapshot),
      sha256: hash(snapshotBytes), bytes: snapshotBytes.length },
  }
  await assertCapturedSourcesUnchanged(repoRoot, sourceHashes, baselinePath, manifest.baseline.sha256)
  await reserveCaptureDirectory(paths)
  await writeFile(paths.snapshot, snapshotBytes, { flag: 'wx' })
  await writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' })
  return manifest
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const args = process.argv.slice(2)
  if (args.length && (args.length !== 2 || args[0] !== '--output-dir' || !args[1])) throw new Error('E_PERSON_CAPTURE_OUTPUT_DIR')
  const manifest = await collectPersonDetails(root, args[1])
  console.log(`PERSON_PRIVATE_CAPTURE ${manifest.count} ${manifest.snapshot.sha256}`)
}
