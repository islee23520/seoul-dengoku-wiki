import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatorStage, requireGenerationPublication } from './generate-release.mjs'
import { loadPortraitDocuments } from './portrait-source-documents.mjs'
import { loadSheetMetadata } from './cast-sqlite/sheet-metadata.mjs'

export async function generatePortraitSourceCatalog(root, options = {}) {
  const { root: stageRoot, writeFile } = await generatorStage(root)
  const { catalog } = loadPortraitDocuments(root, options)
  const output = resolve(stageRoot, 'src/generated/portraitSourceCatalog.ts')
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `// Derived from the typed portrait store; regenerate through the release transaction.\nexport const portraitSourceCatalog = ${JSON.stringify(catalog, null, 2)} as const\n`)
  const { baseline, nameChanges } = loadSheetMetadata()
  await writeFile(resolve(stageRoot, 'src/generated/personSheetSources.ts'),
    '// Derived from typed SQLite metadata.\nexport const preservationBaseline = '
    + JSON.stringify({ revisions: baseline.revisions }) + ' as const\nexport const personSheetNameChanges = '
    + JSON.stringify(nameChanges) + ' as const\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  await requireGenerationPublication(root)
  await generatePortraitSourceCatalog(root)
}
