import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseWorldAtlas, sha256Text } from './world-atlas-parse.mjs'
import { projectionsFromAtlas } from './world-atlas-render.mjs'
import { PROJECTION_PATHS, PROJECTION_PATH_SET, canonicalJson } from './world-atlas-schema.mjs'
import { atlasPeopleContext } from './atlas-people-context.mjs'
import { verifyAtlasPeople } from './world-atlas-verify.mjs'

const atlasGeneratedName = /^(?:Operating-Houses|Regional-Physical-AI-Arcs|Synthetic-Actors|World-Expansion-Index|World-Relation-Ledger|External-Theaters|Hostile-Ecology-Index|Hostile-Group-G\d{2}|Unexpected-Atlas|Monster-Batch-.+|Story-Batch-.+|(?:Monster|Story)-Batch-Manifest)\.(?:json|md)$/u

async function filesUnder(root) {
  const files = []
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else files.push(relative(root, path).replaceAll('\\', '/'))
    }
  }
  await visit(root)
  return files
}

function expectedOutputs(document, sourceHash) {
  const projections = projectionsFromAtlas(document, sourceHash)
  const paths = Object.keys(projections)
  if (paths.length !== PROJECTION_PATHS.length || paths.some((path) => !PROJECTION_PATH_SET.has(path))) throw new Error('E_PROJECTION_SET')
  return Object.fromEntries(paths.map((path) => [path, canonicalJson(projections[path])]))
}

async function checkOutputs(outDir, expected, selected) {
  const failures = []
  const actual = await filesUnder(outDir)
  const targets = selected ? [selected] : PROJECTION_PATHS
  for (const path of targets) {
    let body
    try { body = await readFile(join(outDir, path), 'utf8') } catch { failures.push(`E_PROJECTION_MISSING:${path}`); continue }
    if (body !== expected[path]) failures.push(`E_PROJECTION_STALE:${path}`)
  }
  for (const path of actual) {
    const name = path.split('/').at(-1)
    if (!atlasGeneratedName.test(name)) continue
    if (path.endsWith('.md')) failures.push(`E_PROJECTION_MARKDOWN_TWIN:${path}`)
    else if (!PROJECTION_PATH_SET.has(path)) {
      if (PROJECTION_PATHS.some((expectedPath) => expectedPath.split('/').at(-1) === name)) failures.push(`E_PROJECTION_MISPLACED:${path}`)
      else failures.push(`E_PROJECTION_UNEXPECTED:${path}`)
    }
  }
  if (failures.length) throw new Error(failures.join('\n'))
}

async function writeOutputs(outDir, expected, selected) {
  const paths = selected ? [selected] : PROJECTION_PATHS
  const temporary = []
  try {
    for (const path of paths) {
      const destination = join(outDir, path)
      const temp = `${destination}.tmp-world-atlas`
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(temp, expected[path])
      temporary.push([temp, destination])
    }
    for (const [temp, destination] of temporary) await rename(temp, destination)
  } catch (error) {
    await Promise.all(temporary.map(([temp]) => rm(temp, { force: true })))
    throw error
  }
}

export async function materializeWorldAtlas({ atlasPath, outDir, projection, check = false, peopleContext }) {
  if (projection && !PROJECTION_PATH_SET.has(projection)) throw new Error(`E_PROJECTION_NAME:${projection}`)
  const text = await readFile(atlasPath, 'utf8')
  const parsed = parseWorldAtlas(text)
  if (!parsed.ok) throw new Error(parsed.error)
  const context = peopleContext ?? await atlasPeopleContext(dirname(atlasPath))
  const { failures } = verifyAtlasPeople(parsed.value.data.atlas, context)
  if (failures.length) throw new Error(failures.join('\n'))
  const atlasHash = sha256Text(text)
  const expected = expectedOutputs(parsed.value, atlasHash)
  if (check) await checkOutputs(outDir, expected, projection)
  else await writeOutputs(outDir, expected, projection)
  return { atlasHash, projections: projection ? [projection] : [...PROJECTION_PATHS] }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const options = { check: false }
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag === '--check') options.check = true
    else if (['--atlas', '--out', '--projection'].includes(flag) && args[index + 1] && !args[index + 1].startsWith('--')) options[flag.slice(2)] = args[++index]
    else throw new Error(`invalid argument: ${flag}`)
  }
  if (!options.atlas) throw new Error('--atlas is required')
  console.log(JSON.stringify(await materializeWorldAtlas({
    atlasPath: resolve(options.atlas),
    outDir: resolve(options.out ?? dirname(options.atlas)),
    projection: options.projection,
    check: options.check,
  })))
}
