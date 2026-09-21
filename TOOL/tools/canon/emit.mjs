import { readFile, rename, rm, writeFile } from 'node:fs/promises'

import { CanonError } from './errors.mjs'

// Callers render (and therefore validate) before calling; this only compares and atomically replaces the output.
export async function emitGenerated({ outputPath, rendered, check }) {
  const existing = await readFile(outputPath, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (existing === rendered) return { changed: false }
  if (check) throw new CanonError('E_DRIFT', outputPath)
  const temporary = `${outputPath}.tmp-${process.pid}`
  try {
    await writeFile(temporary, rendered)
    await rename(temporary, outputPath)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
  return { changed: true }
}
