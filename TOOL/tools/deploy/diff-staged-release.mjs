import { readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? '.')
const manifest = JSON.parse(await readFile(resolve(root, 'deployment-manifest.json'), 'utf8'))
const listed = new Set(manifest.artifacts.map((artifact) => artifact.path))
const actual = []
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else if (entry.isFile()) {
      const name = relative(root, path).replaceAll('\\', '/')
      if (name !== 'deployment-manifest.json') actual.push(name)
    }
  }
}
await walk(root)
const actualSet = new Set(actual)
console.log(JSON.stringify({ listed: listed.size, actual: actual.length, extra: actual.filter((path) => !listed.has(path)), missing: [...listed].filter((path) => !actualSet.has(path)) }, null, 2))
