import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGddSources } from './catalog-admission.mjs'
import { ArchifyContractError, parseArchifyManifest, parseArchifyReference, resolveArchifyReference } from '../src/archify-contract.mjs'

export async function readArchifyArtifacts(inputRoot) {
  const root = await realpath(inputRoot)
  const readLocal = async (file) => {
    const path = resolve(root, file)
    if (!(await lstat(path)).isFile() || await realpath(path) !== path) throw new ArchifyContractError('E_ARCHIFY_INPUT_NOT_REGULAR')
    return readFile(path)
  }
  const manifest = parseArchifyManifest(JSON.parse((await readLocal('manifest.json')).toString('utf8')))
  const artifacts = []
  for (const entry of manifest.diagrams) {
    const bytes = await readLocal(entry.file)
    if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new ArchifyContractError('E_ARCHIFY_HASH_MISMATCH')
    if (!/^\s*<!doctype html\b/i.test(bytes.toString('utf8'))) throw new ArchifyContractError('E_ARCHIFY_HTML_DOCUMENT')
    artifacts.push({ entry, bytes })
  }
  return { manifest, artifacts }
}

export function checkArchifyReferences(canon, manifest) {
  // Both canonical formats feed the viewer: normalized GDD blocks and shared content.
  for (const node of canon.blocks ?? []) {
    if (node.kind === 'codeFence' && node.info.trim().split(/\s+/)[0] === 'archify') {
      if (node.info !== 'archify') throw new ArchifyContractError('E_ARCHIFY_FENCE_INFO')
      resolveArchifyReference(parseArchifyReference(node.text), manifest)
    }
  }
  for (const node of canon.content ?? []) {
    if (node.kind === 'code' && node.language === 'archify') {
      if (node.info !== undefined && node.info !== 'archify') throw new ArchifyContractError('E_ARCHIFY_FENCE_INFO')
      for (const text of Object.values(node.text)) resolveArchifyReference(parseArchifyReference(text), manifest)
    }
  }
}

export async function prepareArchify({ inputRoot, viewerRoot, gddRoot }) {
  const { manifest, artifacts } = await readArchifyArtifacts(inputRoot)
  const sources = await loadGddSources(gddRoot)
  for (const { source } of sources.values()) checkArchifyReferences(JSON.parse(await readFile(resolve(gddRoot, source), 'utf8')), manifest)
  const outputRoot = resolve(viewerRoot, 'public/archify')
  if (await realpath(inputRoot) === outputRoot) throw new ArchifyContractError('E_ARCHIFY_INPUT_IS_OUTPUT')
  // Never replace a directory supplied by a symlink, and only clean our owned files.
  await mkdir(outputRoot, { recursive: true })
  if (await realpath(outputRoot) !== outputRoot) throw new ArchifyContractError('E_ARCHIFY_OUTPUT_SYMLINK')
  for (const name of await readdir(outputRoot)) {
    if (name !== 'manifest.json' && !/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(name)) throw new ArchifyContractError('E_ARCHIFY_OUTPUT_UNEXPECTED')
  }
  await rm(outputRoot, { recursive: true })
  await mkdir(outputRoot, { recursive: true })
  for (const { entry, bytes } of artifacts) await writeFile(resolve(outputRoot, entry.file), bytes)
  const serialized = `${JSON.stringify({ schemaVersion: 1, diagrams: [...manifest.diagrams].sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0) }, null, 2)}\n`
  await writeFile(resolve(outputRoot, 'manifest.json'), serialized)
  await mkdir(resolve(viewerRoot, 'src/generated'), { recursive: true })
  await writeFile(resolve(viewerRoot, 'src/generated/archify-manifest.json'), serialized)
  return artifacts.length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const viewerRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const gddRoot = resolve(process.env.GDD_ROOT ?? resolve(viewerRoot, '..'))
  const count = await prepareArchify({ viewerRoot, gddRoot, inputRoot: process.env.GDD_ARCHIFY_INPUT_DIR ?? resolve(gddRoot, 'canon/archify/generated') })
  console.log(`GDD_ARCHIFY_PREPARED diagrams=${count}`)
}
