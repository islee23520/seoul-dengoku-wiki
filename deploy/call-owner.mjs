import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const timeoutMs = 35 * 60 * 1000
const maxLineLength = 64 * 1024
const maxResponseBytes = 8 * 1024 * 1024

class DeploymentError extends Error {}

export async function callOwner({
  url = process.env.SEOUL_DEPLOY_URL,
  token = process.env.SEOUL_DEPLOY_TOKEN,
  sha = process.env.CI_COMMIT_SHA,
  fetchImpl = fetch,
  deadlineMs = timeoutMs,
} = {}) {
  if (!url || !token || !sha) throw new Error('E_DEPLOY_ENV: URL, token and commit SHA are required')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), deadlineMs)
  let reader
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/x-ndjson' },
      body: JSON.stringify({ sha }),
      redirect: 'error',
      signal: controller.signal,
    })
    if (!response.ok) throw new DeploymentError('E_DEPLOY_HTTP: owner rejected the request')
    if (!response.body) throw new DeploymentError('E_DEPLOY_TERMINAL: response body is missing')
    reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8', { fatal: true })
    let pending = ''
    let bytes = 0
    const parseLine = (line) => {
      if (!line.trim()) return
      if (line.length > maxLineLength) throw new DeploymentError('E_DEPLOY_LIMIT: response line is too large')
      let record
      try { record = JSON.parse(line) } catch { throw new DeploymentError('E_DEPLOY_JSON: invalid response record') }
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw new DeploymentError('E_DEPLOY_STATUS: invalid response record')
      if (record.sha !== undefined && record.sha !== sha) throw new DeploymentError('E_DEPLOY_SHA: response commit does not match')
      if (record.status === 'running') return
      if (!['success', 'failed', 'rolled-back'].includes(record.status)) throw new DeploymentError('E_DEPLOY_STATUS: unknown response status')
      if (record.sha !== sha) throw new DeploymentError('E_DEPLOY_SHA: terminal commit does not match')
      if (record.status !== 'success') throw new DeploymentError('E_DEPLOY_FAILED: owner did not report success')
      return { status: record.status, sha: record.sha }
    }
    while (true) {
      const { done, value } = await reader.read()
      bytes += value?.byteLength ?? 0
      if (bytes > maxResponseBytes) throw new DeploymentError('E_DEPLOY_LIMIT: response is too large')
      pending += decoder.decode(value, { stream: !done })
      let newline
      while ((newline = pending.indexOf('\n')) !== -1) {
        const result = parseLine(pending.slice(0, newline))
        pending = pending.slice(newline + 1)
        if (result) return result
      }
      if (pending.length > maxLineLength) throw new DeploymentError('E_DEPLOY_LIMIT: response line is too large')
      if (done) {
        const result = parseLine(pending)
        if (result) return result
        throw new DeploymentError('E_DEPLOY_TERMINAL: stream ended without a terminal record')
      }
    }
  } catch (error) {
    if (controller.signal.aborted) throw new Error('E_DEPLOY_TIMEOUT: owner exceeded the deployment deadline')
    // Do not expose URLs, response bodies, credentials, or upstream error messages.
    if (error instanceof DeploymentError) throw error
    throw new Error('E_DEPLOY_REQUEST: owner request or response failed')
  } finally {
    clearTimeout(timer)
    controller.abort()
    if (reader) {
      try { await reader.cancel() } catch {}
      reader.releaseLock()
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await callOwner()
    console.log('DEPLOY_PASS: owner reported success for the requested commit')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
