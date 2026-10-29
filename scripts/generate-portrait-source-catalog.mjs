import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatorStage } from './generate-release.mjs'
import { loadPortraitDocuments, loadPortraitDocumentsAsync } from './portrait-source-documents.mjs'

export async function generatePortraitSourceCatalog(root, options = {}) {
  const { root: stageRoot, writeFile } = await generatorStage(root)
  const { catalog } = process.env.WIKI_DOCUMENT_PG || options.pgUrl
    ? await loadPortraitDocumentsAsync(root, options)
    : loadPortraitDocuments(root, options)
  const output = resolve(stageRoot, 'src/generated/portraitSourceCatalog.ts')
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `// Derived from the typed portrait store; regenerate through the release transaction.\nexport const portraitSourceCatalog = ${JSON.stringify(catalog, null, 2)} as const\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  await generatePortraitSourceCatalog(root)
}
