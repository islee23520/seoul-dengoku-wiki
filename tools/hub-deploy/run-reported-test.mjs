import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'

const [kind, name, command, ...args] = process.argv.slice(2)
const { CI_TEST_REPORT: reportPath, CI_RUN_ID: runId, CI_SOURCE_SHA: sourceSha } = process.env
const privateValues = args.flatMap((arg, index) => {
  const match = arg.match(/^--(?:token|password|api[-_]?key|access[-_]?key|secret|credential|authorization|cookie)(?:=(.*))?$/i)
  const value = match && (match[1] ?? args[index + 1])
  return value ? [value] : []
}).sort((a, b) => b.length - a.length)

// Same redaction contract as linalab-ci/backend/run-logs.mjs.
function redactLog(text) {
  // Keep original argv for execution; redact its sensitive values everywhere recorded.
  for (const value of privateValues) text = text.replaceAll(value, '[REDACTED]')
  return text.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[REDACTED private key]')
    .replace(/([?&](?:key|api[_-]?key|access[_-]?key|signature|auth|token|secret|password)=)[^&\s"<>]+/gi, '$1[REDACTED]')
    .replace(/((?:["']?(?:X-API-Key|api[_-]?key|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN)["']?)\s*[:=]\s*["']?)[^\s,"'}]+/gi, '$1[REDACTED]')
    .replace(/^(.*(?:authorization|cookie|token|secret|password|credential|private.key|CF_ACCESS_CLIENT|https?:\/\/[^\s/]+:[^\s/]+@)[^\n]*)$/gim, '[REDACTED sensitive log line]')
}

async function run() {
  if (kind !== 'test' || !name || !command || !reportPath || !/^[A-Za-z0-9_-]{1,120}$/.test(runId ?? '') || !/^[a-f0-9]{40}$/.test(sourceSha ?? '')) throw new Error('Invalid test report identity or command')
  await mkdir(dirname(reportPath), { recursive: true })
  const readReport = () => readFile(reportPath, 'utf8').then(JSON.parse, error => {
    if (error.code !== 'ENOENT') throw error
    return { schemaVersion: 1, runId, sourceSha, steps: [], testStatus: 'NOT_RUN', buildStatus: 'NOT_RUN', deploymentStatus: 'NOT_RUN' }
  })
  const initial = await readReport()
  if (initial.runId !== runId || initial.sourceSha !== sourceSha) throw new Error('Report source identity mismatch')
  const startedAt = new Date().toISOString()
  const logPath = `${reportPath}.${randomUUID()}.log`
  let output = ''
  let startupError = null
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', bytes => { output += bytes.toString() })
  child.stderr.on('data', bytes => { output += bytes.toString() })
  child.once('error', error => { startupError = error.message })
  const { exitCode, signal } = await new Promise(resolve => child.once('close', (exitCode, signal) => resolve({ exitCode, signal })))
  if (startupError) output += `\nSTARTUP_ERROR: ${startupError}\n`
  const sanitized = redactLog(output)
  await writeFile(logPath, sanitized, { mode: 0o600 })
  process.stdout.write(sanitized)
  const counts = {}
  const clean = output.replace(/\u001b\[[0-9;]*m/g, '')
  const lines = clean.split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*(?:#\s*|ℹ\s*)?(tests|pass|fail|skipped|todo|cancelled)\s+(\d+)\s*$/)
    if (match) counts[match[1]] = Number(match[2])
  }
  const summary = lines.flatMap(line => {
    const match = line.match(/^\s*Tests\s+(.+)$/)
    return match ? [match[1]] : []
  }).at(-1)
  if (summary) {
    for (const [label, field] of [['passed', 'pass'], ['failed', 'fail'], ['skipped', 'skipped'], ['todo', 'todo']]) {
      const match = summary.match(new RegExp(`(\\d+) ${label}`))
      if (match) counts[field] = Number(match[1])
    }
    const total = summary.match(/\((\d+)\)/)
    if (total) counts.tests = Number(total[1])
  }
  const status = exitCode === 0 && !startupError ? 'PASS' : 'FAIL'
  const report = await readReport()
  if (report.runId !== runId || report.sourceSha !== sourceSha) throw new Error('Report source identity mismatch')
  report.steps.push({ name: redactLog(name), kind, command: redactLog(command), args: args.map(redactLog), startedAt, endedAt: new Date().toISOString(), exitCode, signal, startupError: startupError ? redactLog(startupError) : null, status, counts, logFile: basename(logPath) })
  report.testStatus = report.testStatus === 'FAIL' || status === 'FAIL' ? 'FAIL' : 'PASS'
  const temporary = `${reportPath}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 })
  await rename(temporary, reportPath)
  console.log(`CI_REPORTED_STEP name=${redactLog(name)} kind=test status=${status} exit=${exitCode}`)
  if (status === 'FAIL') process.exitCode = exitCode || 1
}

run().catch(error => { console.error(`TEST_REPORT_FAILED: ${redactLog(error.message)}`); process.exitCode = 1 })
