#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const defaultRoot = resolve(repoRoot, 'WEB/wiki-source/world')
const defaultReceipt = resolve(here, 'patina-human-receipt.json')

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

export async function listPublicLore(root = defaultRoot) {
  return (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => resolve(root, entry.name))
    .sort()
}

export async function verifyHumanReceipt({ root = defaultRoot, receiptPath = defaultReceipt } = {}) {
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'))
  const paths = await listPublicLore(root)
  const expected = new Map(receipt.documents.map((document) => [document.path, document]))
  const failures = []

  if (receipt.schema !== 'seoul-dengoku.patina-human.v1') failures.push(`schema:${receipt.schema}`)
  if (receipt.documents.length !== paths.length) failures.push(`count:${receipt.documents.length}:${paths.length}`)

  for (const path of paths) {
    const key = relative(root, path).replaceAll('\\', '/')
    const document = expected.get(key)
    if (!document) {
      failures.push(`missing:${key}`)
      continue
    }
    const text = await readFile(path, 'utf8')
    if (document.sha256 !== sha256(text)) failures.push(`sha256:${key}`)
    if (document.interpretation !== 'human') failures.push(`interpretation:${key}:${document.interpretation}`)
  }

  for (const key of expected.keys()) {
    if (!paths.some((path) => relative(root, path).replaceAll('\\', '/') === key)) failures.push(`extra:${key}`)
  }

  return { status: failures.length ? 'FAIL' : 'PASS', documents: paths.length, failures }
}

function scoreWithPatina(path) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('patina', ['--score', '--offline', '--format', 'json', path], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code !== 0) return rejectPromise(new Error(`PATINA_FAILED:${path}:${code}:${stderr.trim()}`))
      try {
        resolvePromise(JSON.parse(stdout))
      } catch (error) {
        rejectPromise(new Error(`PATINA_JSON_INVALID:${path}:${error.message}`))
      }
    })
  })
}

export async function writeHumanReceipt({ root = defaultRoot, receiptPath = defaultReceipt } = {}) {
  const paths = await listPublicLore(root)
  const documents = []
  for (const path of paths) {
    const text = await readFile(path, 'utf8')
    const result = await scoreWithPatina(path)
    documents.push({
      path: relative(root, path).replaceAll('\\', '/'),
      sha256: sha256(text),
      score: result.overall,
      interpretation: result.scores?.deterministic?.interpretation ?? 'unknown',
    })
  }
  const receipt = { schema: 'seoul-dengoku.patina-human.v1', documents }
  await mkdir(dirname(receiptPath), { recursive: true })
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`)
  return verifyHumanReceipt({ root, receiptPath })
}

const main = async () => {
  const mode = process.argv[2] ?? 'verify'
  const rootArg = process.argv.indexOf('--root')
  const receiptArg = process.argv.indexOf('--receipt')
  const options = {
    root: rootArg >= 0 ? resolve(process.argv[rootArg + 1]) : defaultRoot,
    receiptPath: receiptArg >= 0 ? resolve(process.argv[receiptArg + 1]) : defaultReceipt,
  }
  const result = mode === 'write' ? await writeHumanReceipt(options) : await verifyHumanReceipt(options)
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== 'PASS') process.exit(1)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
