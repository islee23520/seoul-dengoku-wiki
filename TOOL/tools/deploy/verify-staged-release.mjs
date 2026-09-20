import { createHash } from 'node:crypto'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? '.')
const manifestPath = resolve(root, 'deployment-manifest.json')
const outputPath = process.argv[3] ? resolve(process.argv[3]) : null
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const failures = []

const walk = async (directory) => {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile()) files.push(relative(root, path).replaceAll('\\', '/'))
  }
  return files
}

const actualFiles = (await walk(root)).filter((path) => path !== 'deployment-manifest.json').sort()
const listedFiles = manifest.artifacts.map((artifact) => artifact.path).sort()
if (manifest.files !== manifest.artifacts.length) failures.push(`manifest-count:${manifest.files}:${manifest.artifacts.length}`)
if (JSON.stringify(actualFiles) !== JSON.stringify(listedFiles)) failures.push('manifest-file-set')

for (const artifact of manifest.artifacts) {
  const path = resolve(root, artifact.path)
  try {
    const info = await stat(path)
    if (info.size !== artifact.bytes) failures.push(`bytes:${artifact.path}`)
    const contents = await readFile(path)
    if (contents.subarray(0, 42).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1')) failures.push(`lfs-pointer:${artifact.path}`)
    const digest = createHash('sha256').update(contents).digest('hex')
    if (digest !== artifact.sha256) failures.push(`sha256:${artifact.path}`)
  } catch {
    failures.push(`missing:${artifact.path}`)
  }
}

const result = { status: failures.length ? 'FAIL' : 'PASS', files: actualFiles.length, pages: manifest.pages.length, failures }
if (outputPath) await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result))
if (failures.length) process.exit(1)
