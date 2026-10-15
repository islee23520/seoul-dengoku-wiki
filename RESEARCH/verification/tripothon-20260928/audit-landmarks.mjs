import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'

const repo = resolve(process.argv[2])
const dir = join(repo, 'GAME/Assets/Janseon/Data/StrategyMap/Landmarks')
const hash = (data) => createHash('sha256').update(data).digest('hex')
const names = (await readdir(dir)).sort()
const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: repo, encoding: 'utf8' }).trim()
async function pngInfo(path) {
  const stored = await readFile(path)
  const pointer = /^version https:\/\/git-lfs.github.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)\n?$/.exec(stored.toString('utf8'))
  let data = stored
  if (pointer) {
    data = await readFile(join(gitDir, 'lfs/objects', pointer[1].slice(0, 2), pointer[1].slice(2, 4), pointer[1]))
    if (hash(data) !== pointer[1] || data.length !== Number(pointer[2])) throw new Error(`Invalid LFS object: ${path}`)
  }
  if (data.length < 24 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || data.subarray(12, 16).toString() !== 'IHDR') throw new Error(`Not a PNG: ${path}`)
  return { pngSha256: hash(data), pngWidth: data.readUInt32BE(16), pngHeight: data.readUInt32BE(20), pngReadFrom: pointer ? 'verified Git LFS object cache' : 'working tree', pngPointerSha256: pointer ? hash(stored) : null }
}
const assets = []
for (const name of names.filter((name) => name.endsWith('.obj'))) {
  const slug = name.slice(0, -4)
  const obj = await readFile(join(dir, name))
  const lines = obj.toString('utf8').split('\n')
  const png = await pngInfo(join(dir, slug + '.png'))
  const mtl = await readFile(join(dir, slug + '.mtl'))
  const materials = mtl.toString().split('\n').filter((s) => s.startsWith('newmtl ')).map((s) => s.slice(7).trim())
  const usedMaterials = [...new Set(lines.filter((s) => s.startsWith('usemtl ')).map((s) => s.slice(7).trim()))]
  assets.push({ slug, objBytes: obj.length, objSha256: hash(obj), ...png, mtlSha256: hash(mtl), vertices: lines.filter((s) => s.startsWith('v ')).length, uvCoordinates: lines.filter((s) => s.startsWith('vt ')).length, faces: lines.filter((s) => s.startsWith('f ')).length, materials, usedMaterials, unresolvedMaterials: usedMaterials.filter((name) => !materials.includes(name)), originalSourceSha256: null, rightsReview: 'NOT_PROVIDED', unityImportSha256: null, runtimeVisualProof: 'NOT_EXECUTED', promotion: 'HOLD' })
}
const catalogPath = 'GAME/Assets/Janseon/Data/Authoring/StrategyMapAssetCatalog.asset'
const catalog = await readFile(join(repo, catalogPath), 'utf8')
const refs = catalog.split('  landmarkPrefabs:')[1]?.match(/guid: [0-9a-f]+/g) ?? []
console.log(JSON.stringify({ inspectedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), scope: 'Tracked landmark OBJ/PNG/MTL files and current serialized catalog; no Unity import or owner source directory inspected', assets, summary: { count: assets.length, missingUvs: assets.filter((a) => a.uvCoordinates === 0).length, uniquePngHashes: new Set(assets.map((a) => a.pngSha256)).size, originalGlbsInInspectedDirectory: names.filter((n) => n.endsWith('.glb')), serializedPrefabReferenceCount: refs.length, catalogPath, catalogSha256: hash(catalog), conclusion: 'HOLD: texture/provenance/runtime gates incomplete; serialized references alone do not prove visibility' } }, null, 2))
