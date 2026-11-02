import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import * as filesystem from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname } from 'node:path'

export const wikiThread = '01a0e162-37d5-7c6d-a9bd-1832013901dd'
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z')
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const keys = (value, allowed) => object(value) && Object.keys(value).every(key => allowed.includes(key))
const nullableText = value => value === null || typeof value === 'string'
const actions = ['build', 'poll', 'deploy', 'tests', 'release']
const outcomes = ['unknown', 'busy', 'failed', 'passed', 'deployed', 'current', 'behind']

function snapshot(value) {
  if (!keys(value, ['status', 'running', 'sourceSha', 'deployedSha', 'stage', 'startedAt', 'action', 'target', 'scope', 'lastRun', 'awsDeployment'])
    || !outcomes.includes(value.status) || typeof value.running !== 'boolean'
    || ![value.sourceSha, value.deployedSha].every(v => v === '' || sha(v))
    || !(value.stage === null || typeof value.stage === 'string')
    || !(value.startedAt === null || timestamp(value.startedAt))
    || !(value.action === null || actions.includes(value.action))
    || ![value.target, value.scope].every(nullableText) || value.awsDeployment !== null) return false
  const run = value.lastRun
  return run === null || keys(run, ['at', 'outcome', 'action', 'target', 'scope', 'ref', 'tests'])
    && timestamp(run.at) && outcomes.includes(run.outcome) && (run.action === null || actions.includes(run.action))
    && [run.target, run.scope, run.ref].every(nullableText) && (run.tests === null || object(run.tests))
}

// Importing this module never starts a listener or registers a subscription.
export async function createCiSessionReceiver({ expectedSha, expectedAction, receiptPath,
  thread = wikiThread, env = process.env, notify = promisify(execFile),
  omoPath = '/Users/ilseoblee/.local/bin/omo', fs = filesystem }) {
  if (!sha(expectedSha) || !actions.includes(expectedAction) || !receiptPath
    || !/^[a-f0-9-]{36}$/.test(thread)) throw new Error('Invalid receiver configuration')
  const secret = env.CI_SESSION_WEBHOOK_SECRET
    ?? (env.CI_SESSION_WEBHOOK_SECRET_FILE ? (await fs.readFile(env.CI_SESSION_WEBHOOK_SECRET_FILE, 'utf8')).trim() : '')
  if (typeof secret !== 'string' || secret.length < 16 || secret.length > 512) throw new Error('Signing secret unavailable')
  const identity = { expectedSha, expectedAction, thread }
  const directory = dirname(receiptPath)
  // Caller provisions the private directory before connection; its creation durability is not inferred here.
  const directoryStat = await fs.lstat(directory)
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() || (directoryStat.mode & 0o777) !== 0o700) {
    throw new Error('Receipt directory must be private mode700')
  }
  const receiptStat = await fs.lstat(receiptPath).catch(error => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  if (receiptStat && (!receiptStat.isFile() || receiptStat.isSymbolicLink() || (receiptStat.mode & 0o777) !== 0o600)) {
    throw new Error('Receipt must be a private regular file')
  }
  const load = () => fs.readFile(receiptPath, 'utf8').then(JSON.parse, error => {
    if (error.code !== 'ENOENT') throw error
    return { identity, deliveries: {} }
  })
  let state = await load()
  if (JSON.stringify(state.identity) !== JSON.stringify(identity)) throw new Error('Receipt identity mismatch')
  async function save(next) {
    const temporary = `${receiptPath}.${randomUUID()}.tmp`
    let file
    let parent
    try {
      file = await fs.open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
      await file.writeFile(JSON.stringify(next) + '\n')
      await file.sync()
      await file.close(); file = null
      await fs.rename(temporary, receiptPath)
      parent = await fs.open(directory, constants.O_RDONLY | constants.O_DIRECTORY)
      await parent.sync()
      await parent.close(); parent = null
      state = next
    } finally {
      await file?.close()
      await parent?.close()
      await fs.unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error })
    }
  }
  async function deliver(id, record) {
    let outcome = 'admission-unconfirmed'
    try {
      const result = await notify(omoPath, ['thread', 'send', thread, record.message, '--mode', 'auto',
        '--idempotency-key', `ci-session:${id}`, '--all-scope', '--json'],
      { shell: false, timeout: 5000, maxBuffer: 1024 * 1024 })
      // Native CLI contract observed in task48: exact-argument replay returns the same delivery identity.
      const admission = JSON.parse(result.stdout)
      if (admission?.kind === 'ok' && admission.thread_id === thread
        && typeof admission.delivery_id === 'string' && /^[a-f0-9-]{36}$/.test(admission.delivery_id)
        && Number.isSafeInteger(admission.message_seq) && admission.message_seq > 0
        && typeof admission.deduplicated === 'boolean'
        && admission.delivery?.kind === 'started') outcome = 'notified'
    } catch { outcome = 'admission-unconfirmed' }
    await save({ ...state, deliveries: { ...state.deliveries, [id]: { ...record, state: outcome } } })
    return outcome === 'notified'
  }
  // Initialization is a single recovery event, not a timer or retry service. No producer replay is assumed.
  const recovery = []
  for (const [id, record] of Object.entries(state.deliveries)) {
    if (record.state === 'pending') recovery.push({ id, notified: await deliver(id, record) })
  }
  let queue = Promise.resolve()
  function receive({ raw, headers }) {
    const operation = queue.then(async () => {
      if (!Buffer.isBuffer(raw) || raw.length > 1024 * 1024) return { status: 413, body: { error: 'Payload too large' } }
      const signature = headers['x-ci-signature']
      const id = headers['x-ci-event-id']
      if (typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/.test(signature)
        || typeof id !== 'string' || !/^[A-Za-z0-9-]{1,100}$/.test(id)
        || !timingSafeEqual(createHmac('sha256', secret).update(raw).digest(), Buffer.from(signature.slice(7), 'hex'))) {
        return { status: 401, body: { error: 'Invalid signature or event id' } }
      }
      let event
      try { event = JSON.parse(raw.toString('utf8')) } catch { return { status: 400, body: { error: 'Invalid JSON' } } }
      if (!keys(event, ['id', 'type', 'project', 'at', 'previous', 'status']) || event.id !== id
        || event.type !== 'project.status.changed' || event.project !== 'seoul' || !timestamp(event.at)
        || !snapshot(event.previous) || !snapshot(event.status)) return { status: 400, body: { error: 'Invalid CI event' } }
      const digest = createHash('sha256').update(raw).digest('hex')
      const existing = Object.hasOwn(state.deliveries, id) ? state.deliveries[id] : null
      if (existing && existing.digest !== digest) return { status: 409, body: { error: 'Event id payload conflict' } }
      if (existing?.state === 'admission-unconfirmed') return { status: 503, body: { error: 'Native admission unconfirmed; operator recovery required' } }
      if (existing?.state !== 'pending' && existing) return { status: 200, body: { duplicate: true, notified: existing.state === 'notified' } }
      const status = event.status
      const run = status.lastRun
      const matches = status.sourceSha === expectedSha && run?.action === expectedAction && !status.running
        && ['passed', 'deployed', 'current'].includes(status.status) && status.status === run.outcome
        // Promotion can retain the build action/outcome; the deployed SHA proves completion.
        && status.deployedSha === expectedSha
      // Only constrained identity fields reach the agent. Ref, scope, tests and callback prose never do.
      const message = matches ? JSON.stringify({ type: 'project.status.changed', project: 'seoul', eventId: id,
        at: event.at, sourceSha: status.sourceSha, deployedSha: status.deployedSha,
        status: status.status, action: run.action, runAt: run.at }) : null
      const record = { digest, state: matches ? 'pending' : 'ignored', message }
      await save({ ...state, deliveries: { ...state.deliveries, [id]: record } })
      if (!matches) return { status: 202, body: { accepted: true, notified: false } }
      if (!await deliver(id, record)) return { status: 503, body: { error: 'Native admission unconfirmed; operator recovery required' } }
      return { status: 200, body: { accepted: true, notified: true } }
    })
    queue = operation.catch(() => {})
    return operation
  }
  return { receive, recovery, async handle(request, response) {
    const send = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify(body))
    }
    if (request.method !== 'POST') return send(405, { error: 'POST required' })
    const chunks = []
    let size = 0
    try {
      for await (const chunk of request) {
        size += chunk.length
        if (size > 1024 * 1024) return send(413, { error: 'Payload too large' })
        chunks.push(chunk)
      }
      const result = await receive({ raw: Buffer.concat(chunks), headers: request.headers })
      send(result.status, result.body)
    } catch { send(503, { error: 'Receiver unavailable' }) }
  } }
}
