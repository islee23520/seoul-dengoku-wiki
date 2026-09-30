import assert from 'node:assert/strict'
import { test } from 'vitest'
import { spawn } from 'node:child_process'
import { chmod, mkdtemp, readFile, rm, writeFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createArtBridge, runCodex } from '../public/local-art-bridge.mjs'

const origin = 'http://127.0.0.1:5174'
const pairingCode = 'local-test-pair'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2JAAAAABJRU5ErkJggg==', 'base64')
const packet = { schemaVersion: 1, requestId: '9f46c6d2-7447-4ae7-9368-974a26d5dc65', personId: 'person-0145', name: '윤서린', sourceRoute: '/world/Core-Characters', fields: {}, sections: {} }

async function withBridge(runAgent, action) {
  const server = createArtBridge({ origin, pairingCode, codex: process.execPath, runAgent })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  try { await action(`http://127.0.0.1:${address.port}`) }
  finally { await new Promise((resolve) => server.close(resolve)) }
}

const headers = { Origin: origin, 'X-Art-Bridge-Pairing': pairingCode, 'Content-Type': 'application/json' }

test('paired local browser origin gets handshake and identity-bound result', async () => {
  const calls = []
  await withBridge(async ({ packet: request }) => { calls.push(request); return { personId: request.personId, requestId: request.requestId, png } }, async (base) => {
    const health = await fetch(`${base}/v1/health`, { headers })
    assert.equal(health.status, 200)
    const info = await health.json()
    assert.equal(info.protocol, 'seoul-art-local-v1')
    assert.equal(info.bridge, 'reachable')
    assert.equal(info.agentAvailable, true)
    const reply = await fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
    assert.equal(reply.status, 200)
    const result = await reply.json()
    assert.equal(result.personId, packet.personId)
    assert.equal(result.requestId, packet.requestId)
    assert.ok(result.image.startsWith('data:image/png;base64,'))
  })
  assert.deepEqual(calls, [packet])
})

test('missing local Codex executable cannot be presented as available', async () => {
  const server = createArtBridge({ origin, pairingCode, codex: '/nonexistent/local-codex' })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const reply = await fetch(`http://127.0.0.1:${server.address().port}/v1/health`, { headers })
    assert.equal(reply.status, 200)
    assert.equal((await reply.json()).agentAvailable, false)
  } finally { await new Promise((resolve) => server.close(resolve)) }
})

test('unpaired, foreign origin and malformed person requests never run the agent', async () => {
  let calls = 0
  await withBridge(async () => { calls++; return { personId: packet.personId, requestId: packet.requestId, png } }, async (base) => {
    const foreign = await fetch(`${base}/v1/jobs`, { method: 'POST', headers: { ...headers, Origin: 'https://example.com' }, body: JSON.stringify(packet) })
    assert.equal(foreign.status, 403)
    const unpaired = await fetch(`${base}/v1/jobs`, { method: 'POST', headers: { ...headers, 'X-Art-Bridge-Pairing': 'wrong' }, body: JSON.stringify(packet) })
    assert.equal(unpaired.status, 403)
    const invalid = await fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify({ ...packet, personId: 'K144' }) })
    assert.equal(invalid.status, 400)
    assert.equal((await invalid.json()).error, 'invalid_request')
  })
  assert.equal(calls, 0)
})

test('foreign Host is rejected for health, preflight and jobs independently of pairing', async () => {
  await withBridge(async () => { throw new Error('must not run') }, async (base) => {
    const { request } = await import('node:http')
    for (const host of ['attacker.example', `127.0.0.1:${Number(new URL(base).port) + 1}`]) {
      for (const [method, path] of [['GET', '/v1/health'], ['OPTIONS', '/v1/health'], ['POST', '/v1/jobs'], ['DELETE', `/v1/jobs/${packet.requestId}`]]) {
        const status = await new Promise((resolve, reject) => {
          const req = request(`${base}${path}`, { method, headers: { ...headers, Host: host, 'Access-Control-Request-Headers': 'x-art-bridge-pairing' } }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)) })
          req.on('error', reject)
          req.end(method === 'POST' ? JSON.stringify(packet) : undefined)
        })
        assert.equal(status, 403, `${method} ${path} Host ${host}`)
      }
    }
  })
})

test('downloaded runner starts from a directory containing spaces', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'Downloaded Tools '))
  const entry = join(directory, 'local-art-bridge.mjs')
  let child
  try {
    const source = await readFile(new URL('../public/local-art-bridge.mjs', import.meta.url))
    await writeFile(entry, source)
    child = spawn(process.execPath, [entry, '--origin', origin, '--port', '0', '--codex', '/nonexistent/local-codex'], { stdio: ['ignore', 'pipe', 'pipe'] })
    const timeout = AbortSignal.timeout(5000)
    const started = await Promise.race([
      new Promise((resolve, reject) => {
        let text = ''
        child.stdout.on('data', (chunk) => {
          text += chunk
          const address = text.match(/Local bridge: (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
          const code = text.match(/Pairing code \(enter in your browser only\): ([0-9a-f]+)/)?.[1]
          if (address && code) resolve({ address, code })
        })
        child.once('exit', (code) => reject(new Error(`runner exited ${code} before listening`)))
        child.once('error', reject)
      }),
      new Promise((_resolve, reject) => timeout.addEventListener('abort', () => reject(new Error('runner did not listen')), { once: true })),
    ])
    assert.equal(new URL(started.address).hostname, '127.0.0.1')
    const response = await fetch(`${started.address}/v1/health`, { headers: { Origin: origin, 'X-Art-Bridge-Pairing': started.code } })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).agentAvailable, false)
  } finally {
    if (child && child.exitCode === null) {
      const closed = new Promise((resolve) => child.once('close', resolve))
      child.kill()
      await closed
    }
    await rm(directory, { recursive: true, force: true })
  }
})

test('wrong person or malformed image cannot become a success result', async () => {
  for (const reply of [{ personId: 'person-0144', requestId: packet.requestId, png }, { personId: packet.personId, requestId: packet.requestId, png: Buffer.from('not-png') }, { personId: packet.personId, requestId: 'different-request', png }]) {
    await withBridge(async () => reply, async (base) => {
      const response = await fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
      assert.equal(response.status, 502)
      assert.equal((await response.json()).error, 'invalid_result')
    })
  }
})

test('unconfigured local agent returns an error rather than an image', async () => {
  await withBridge(async () => { throw new Error('no local model') }, async (base) => {
    const response = await fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
    assert.equal(response.status, 502)
    assert.equal((await response.json()).error, 'agent_failed')
  })
})

test('cancel request aborts the owned local job before any result', async () => {
  let begun
  let aborted
  const started = new Promise((resolve) => { begun = resolve })
  const stopped = new Promise((resolve) => { aborted = resolve })
  await withBridge(({ signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => { aborted(); reject(new Error('aborted')) }, { once: true })
    begun()
  }), async (base) => {
    const job = fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
    await started
    const cancellation = await fetch(`${base}/v1/jobs/${packet.requestId}`, { method: 'DELETE', headers })
    assert.equal(cancellation.status, 204)
    await stopped
    const response = await job.catch(() => null)
    assert.ok(response === null || response.status !== 200)
  })
})

test('cancel arriving before a submitted request prevents a late agent start', async () => {
  let calls = 0
  await withBridge(async () => { calls++; return { personId: packet.personId, requestId: packet.requestId, png } }, async (base) => {
    const cancel = await fetch(`${base}/v1/jobs/${packet.requestId}`, { method: 'DELETE', headers })
    assert.equal(cancel.status, 204)
    const submitted = await fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
    assert.equal(submitted.status, 409)
    assert.equal((await submitted.json()).error, 'cancelled')
  })
  assert.equal(calls, 0)
})

test('local agent adapter invokes actual exec argv contract and reads only its image result', async () => {
  const { mkdtemp, readFile, rm, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const fixtureDir = await mkdtemp(join(tmpdir(), 'seoul-art-fixture-'))
  const fixture = join(fixtureDir, 'codex-fixture.mjs')
  try {
    await writeFile(fixture, `#!/usr/bin/env node
      import { writeFileSync } from 'node:fs'; import { join } from 'node:path';
      const args = process.argv.slice(2); if (args[0] !== 'exec' || !args.includes('--ephemeral') || !args.includes('--sandbox') || !args.includes('workspace-write') || !args.includes('--output-schema')) process.exit(5);
      const dir = args[args.indexOf('--cd') + 1]; const output = args[args.indexOf('--output-last-message') + 1];
      let prompt = ''; process.stdin.on('data', (c) => prompt += c.toString()); process.stdin.on('end', () => {
        const match = prompt.match(/"personId":"(person-[0-9]{4})"/); if (!match) process.exit(6);
        const image = join(dir, 'result.png'); writeFileSync(image, Buffer.from('${png.toString('base64')}', 'base64'));
        writeFileSync(output, JSON.stringify({ personId: match[1], requestId: '${packet.requestId}', imagePath: image }));
      });`)
    const { chmod } = await import('node:fs/promises')
    await chmod(fixture, 0o700)
    const result = await runCodex({ packet, codex: fixture, signal: new AbortController().signal })
    assert.equal(result.personId, packet.personId)
    assert.equal(result.requestId, packet.requestId)
    assert.deepEqual(result.png, png)
    assert.ok((await readFile(fixture, 'utf8')).includes('--output-schema'))
  } finally { await rm(fixtureDir, { recursive: true, force: true }) }
})

test('HTTP bridge dispatches to a local Codex-compatible process and returns the matching request', async () => {
  const { chmod, mkdtemp, rm, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dir = await mkdtemp(join(tmpdir(), 'seoul-art-http-'))
  const executable = join(dir, 'codex-fixture.mjs')
  const server = createArtBridge({ origin, pairingCode, codex: executable })
  try {
    await writeFile(executable, `#!/usr/bin/env node
      import { writeFileSync } from 'node:fs'; import { join } from 'node:path';
      const args = process.argv.slice(2);
      if (args[0] === '--version') process.exit(0);
      if (args[0] !== 'exec' || args.at(-1) !== '-') process.exit(5);
      const root = args[args.indexOf('--cd') + 1];
      const result = args[args.indexOf('--output-last-message') + 1];
      let input = ''; process.stdin.on('data', chunk => input += chunk.toString());
      process.stdin.on('end', () => {
        const match = input.match(/"requestId":"([0-9a-f-]{36})"/);
        const person = input.match(/"personId":"(person-[0-9]{4})"/);
        if (!match || !person) process.exit(6);
        const imagePath = join(root, 'portrait.png');
        writeFileSync(imagePath, Buffer.from('${png.toString('base64')}', 'base64'));
        writeFileSync(result, JSON.stringify({ personId: person[1], requestId: match[1], imagePath }));
      });`)
    await chmod(executable, 0o700)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    const response = await fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.equal(result.personId, packet.personId)
    assert.equal(result.requestId, packet.requestId)
    assert.deepEqual(Buffer.from(result.image.slice('data:image/png;base64,'.length), 'base64'), png)
  } finally {
    if (server.listening) await new Promise(resolve => server.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})

test('cancelling a spawned local agent terminates its descendant process', async () => {
  const { chmod, mkdtemp, readFile, rm, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const dir = await mkdtemp(join(tmpdir(), 'seoul-art-cancel-'))
  const fixture = join(dir, 'codex-fixture.mjs')
  const descendant = join(dir, 'descendant.pid')
  try {
    await writeFile(fixture, `#!/usr/bin/env node
      import { spawn } from 'node:child_process'; import { writeFileSync } from 'node:fs';
      const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
      writeFileSync('${descendant}',String(child.pid)); setInterval(()=>{},1000);`)
    await chmod(fixture, 0o700)
    const controller = new AbortController()
    const job = runCodex({ packet, codex: fixture, signal: controller.signal })
    const { watch } = await import('node:fs')
    const childPid = await new Promise((resolve, reject) => {
      const watcher = watch(dir, async () => {
        try {
          const pid = Number(await readFile(descendant, 'utf8'))
          watcher.close()
          resolve(pid)
        } catch (error) { if (error.code !== 'ENOENT') { watcher.close(); reject(error) } }
      })
    })
    controller.abort()
    await assert.rejects(job)
    assert.throws(() => process.kill(childPid, 0), { code: 'ESRCH' })
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('HTTP cancellation waits for detached job descendant and workspace cleanup', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'seoul-art-detached-'))
  const executable = join(dir, 'codex-fixture.mjs')
  const started = join(dir, 'started.json')
  const outsider = spawn(process.execPath, ['-e', 'process.stdin.resume()'], { stdio: ['pipe', 'ignore', 'ignore'] })
  const server = createArtBridge({ origin, pairingCode, codex: executable })
  let detachedPid
  try {
    await writeFile(executable, `#!/usr/bin/env node
      import {spawn} from 'node:child_process'; import {writeFileSync} from 'node:fs';
      const root=process.argv[process.argv.indexOf('--cd')+1];
      const descendant=spawn(process.execPath,['-e','process.stdin.resume()'],{detached:true,stdio:['pipe','ignore','ignore']});
      writeFileSync(${JSON.stringify(started)},JSON.stringify({pid:descendant.pid,root})); process.stdin.resume();`)
    await chmod(executable, 0o700)
    const { watch } = await import('node:fs')
    const observed = new Promise((resolve, reject) => {
      const watcher = watch(dir, async () => {
        try { const value = JSON.parse(await readFile(started, 'utf8')); watcher.close(); resolve(value) }
        catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) { watcher.close(); reject(error) } }
      })
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    const job = fetch(`${base}/v1/jobs`, { method: 'POST', headers, body: JSON.stringify(packet) })
    const { pid, root } = await observed
    detachedPid = pid
    const cancelled = await fetch(`${base}/v1/jobs/${packet.requestId}`, { method: 'DELETE', headers })
    assert.equal(cancelled.status, 204)
    assert.equal((await job).status, 409)
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
    await assert.rejects(stat(root), { code: 'ENOENT' })
    process.kill(outsider.pid, 0)
  } finally {
    if (detachedPid) { try { process.kill(detachedPid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') throw error } }
    outsider.stdin.end()
    if (server.listening) await new Promise((resolve) => server.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})
