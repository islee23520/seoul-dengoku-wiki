import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const output = resolve(process.argv[2])
const template = await readFile(resolve(dir, 'browser-people-details-qa.js'), 'utf8')
const results = []
for (let start = 0; start < 1004; start += 25) {
  const end = Math.min(start + 25, 1004)
  const script = template.replace('__START__', String(start)).replace('__END__', String(end))
  const result = await new Promise((resolvePromise, reject) => {
    const child = spawn('aside-agent', ['repl', script], { stdio: ['ignore', 'pipe', 'pipe'] })
    let text = ''
    child.stdout.on('data', (chunk) => { text += chunk })
    child.stderr.on('data', (chunk) => { text += chunk })
    child.on('error', reject)
    child.on('exit', (code) => {
      const match = text.match(/PEOPLE_DETAIL_BATCH=(\{.*\})/)
      if (code !== 0 || !match) reject(new Error(`PEOPLE_DETAIL_QA_FAILED:${start}:${end}\n${text}`))
      else resolvePromise(JSON.parse(match[1]))
    })
  })
  results.push(result)
}
const failures = results.flatMap((result) => result.failures)
const people = results.reduce((sum, result) => sum + result.count, 0)
if (results.some((result) => result.discovered !== 1004 || result.uniqueRoutes !== 1004)) failures.push({ code: 'people-index-coverage' })
if (people !== 1004) failures.push({ code: 'people-processed-count', people })
const summary = { status: failures.length === 0 ? 'PASS' : 'FAIL', batches: results.length, people, discovered: results[0]?.discovered ?? 0, uniqueRoutes: results[0]?.uniqueRoutes ?? 0, failures }
await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary))
if (failures.length) process.exit(1)
