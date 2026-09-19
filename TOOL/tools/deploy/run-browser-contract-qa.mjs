import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const deployDir = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(process.argv[2])
const template = await readFile(resolve(deployDir, 'browser-contract-qa.js'), 'utf8')
const pageTemplate = await readFile(resolve(deployDir, 'browser-pages-qa.js'), 'utf8')
const pageManifest = JSON.parse(await readFile(resolve(deployDir, 'hub-pages.json'), 'utf8'))
const batches = []

const runBatch = (start, end) => new Promise((resolvePromise, reject) => {
  const script = template.replace('__START__', String(start)).replace('__END__', String(end))
  const child = spawn('aside-agent', ['repl', script], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  child.on('error', reject)
  child.on('exit', (code) => {
    const match = output.match(/HUB_WIKI_DOM_BATCH=(\{.*\})/)
    if (code !== 0 || !match) return reject(new Error(`BROWSER_QA_BATCH_FAILED:${start}:${end}\n${output}`))
    resolvePromise(JSON.parse(match[1]))
  })
})

for (let start = 0; start < 232; start += 12) batches.push(await runBatch(start, Math.min(start + 12, 232)))
const pageScript = pageTemplate.replace('__ROUTES__', JSON.stringify(pageManifest.pages.map(({ id, target }) => ({ id, target }))))
const pageResult = await new Promise((resolvePromise, reject) => {
  const child = spawn('aside-agent', ['repl', pageScript], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  child.on('error', reject)
  child.on('exit', (code) => {
    const match = output.match(/HUB_PAGES_QA=(\{.*\})/)
    if (code !== 0 || !match) return reject(new Error(`HUB_PAGES_QA_FAILED\n${output}`))
    resolvePromise(JSON.parse(match[1]))
  })
})
const result = {
  status: batches.every((batch) => batch.failureCount === 0) && pageResult.failureCount === 0 ? 'PASS' : 'FAIL',
  batches: batches.length,
  documents: batches.reduce((sum, batch) => sum + batch.documents, 0),
  pages: pageResult.pages,
  failures: [...batches.flatMap((batch) => batch.failures), ...pageResult.failures],
}
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result))
if (result.status !== 'PASS') process.exit(1)
