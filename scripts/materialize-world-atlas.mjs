import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractAtlasJson, sha256Text } from './world-atlas-parse.mjs'
import { projectionsFromAtlas } from './world-atlas-render.mjs'
import { PROJECTION_FILES } from './world-atlas-schema.mjs'

// The standalone wiki uses its own renderer. Select a projection explicitly to avoid
// rewriting unrelated legacy Markdown mirrors when only one projection changes.
export async function materializeWorldAtlas({ atlasPath, outDir, projection, check = false }) {
  if (!Object.values(PROJECTION_FILES).includes(projection)) throw new Error('E_PROJECTION_NAME:' + projection)
  const markdown = await readFile(atlasPath, 'utf8')
  const parsed = extractAtlasJson(markdown)
  if (!parsed.ok) throw new Error(parsed.error)
  const atlasHash = sha256Text(markdown)
  const body = projectionsFromAtlas(parsed.value, atlasHash)[projection]
  if (!body) throw new Error('E_PROJECTION_MISSING:' + projection)
  const destination = resolve(outDir, projection)
  if (check) {
    if (await readFile(destination, 'utf8') !== body) throw new Error('E_PROJECTION_STALE:' + projection)
  } else await writeFile(destination, body)
  return { projection, atlasHash, hash: sha256Text(body) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const options = { check: false }
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag === '--check') options.check = true
    else if (['--atlas', '--out', '--projection'].includes(flag) && args[index + 1] && !args[index + 1].startsWith('--')) {
      options[flag.slice(2)] = args[++index]
    } else throw new Error('invalid argument: ' + flag)
  }
  if (!options.atlas || !options.projection) throw new Error('--atlas and --projection are required')
  console.log(JSON.stringify(await materializeWorldAtlas({
    atlasPath: resolve(options.atlas), outDir: resolve(options.out ?? dirname(options.atlas)),
    projection: options.projection, check: options.check,
  })))
}
