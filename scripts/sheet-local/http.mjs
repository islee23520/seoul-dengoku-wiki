#!/usr/bin/env node
import { createServer } from 'node:http'
import { createDraftStore } from './drafts.mjs'
import { handle } from './mcp.mjs'

const host = '127.0.0.1'
const token = process.env.SEOUL_SHEET_MCP_TOKEN
if (!token || token.length < 24) throw new Error('SEOUL_SHEET_MCP_TOKEN에 24자 이상의 로컬 전용 토큰이 필요하다')
const store = createDraftStore({ root: process.env.SEOUL_SHEET_DRAFT_DIR })
const port = Number(process.env.SEOUL_SHEET_MCP_PORT ?? 0)
const server = createServer(async (req, res) => {
  const localHost = req.headers.host
  const origin = req.headers.origin
  if (!localHost || !/^127\.0\.0\.1:\d+$/u.test(localHost) || (origin && origin !== `http://${localHost}`)) { res.writeHead(403).end(); return }
  if (req.url !== '/mcp') { res.writeHead(404).end(); return }
  if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401).end(); return }
  if (req.method !== 'POST') { res.writeHead(405).end(); return }
  if (!/application\/json/u.test(req.headers['content-type'] ?? '') || !/application\/json/u.test(req.headers.accept ?? '') || !/text\/event-stream/u.test(req.headers.accept ?? '')) { res.writeHead(406).end(); return }
  try {
    let body = ''
    for await (const chunk of req) {
      body += chunk
      if (body.length > 1024 * 1024) { res.writeHead(413).end(); return }
    }
    const request = JSON.parse(body)
    const response = await handle(request, store)
    if (!response) { res.writeHead(202).end(); return }
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }).end(JSON.stringify(response))
  } catch (error) {
    res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: typeof error.code === 'number' ? error.code : -32600, message: error.message } }))
  }
})
server.listen(port, host, () => process.stdout.write(`MCP_READY http://${host}:${server.address().port}/mcp\n`))
