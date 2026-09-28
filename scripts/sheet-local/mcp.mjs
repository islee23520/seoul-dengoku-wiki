#!/usr/bin/env node
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDraftStore } from './drafts.mjs'

export const tools = [
  { name: 'list_choices', description: '인물 배경·소속·생업 선택지를 읽는다', inputSchema: { type: 'object', properties: {} } },
  { name: 'create_draft', description: '새 인물 또는 기존 인물의 검토 초안을 만든다', inputSchema: { type: 'object', properties: { personId: { type: 'string' }, fields: { type: 'object' }, attributes: { type: 'object' }, skills: { type: 'array' } } } },
  { name: 'get_draft', description: '초안을 읽는다', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'propose_edit', description: '예상 버전을 대조해 초안을 수정한다', inputSchema: { type: 'object', properties: { id: { type: 'string' }, revision: { type: 'integer' }, patch: { type: 'object' } }, required: ['id', 'revision', 'patch'] } },
  { name: 'validate_draft', description: '근거 충돌과 겁스 점수를 검사한다', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'export_draft', description: '검토용 초안 JSON을 내보낸다', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'example_candidate', description: 'AI가 제안할 수 있는 후보 예시를 읽는다', inputSchema: { type: 'object', properties: { affiliation: { type: 'string' } } } },
]

export async function call(store, name, args) {
  switch (name) {
    case 'list_choices': return store.choices()
    case 'create_draft': return store.create(args)
    case 'get_draft': return store.get(args.id)
    case 'propose_edit': return store.edit(args.id, args.revision, args.patch)
    case 'validate_draft': return store.validate(args.id)
    case 'export_draft': return store.export(args.id)
    case 'example_candidate': return store.example(args)
    default: throw Object.assign(new Error(`알 수 없는 도구: ${name}`), { code: 'UNKNOWN_TOOL' })
  }
}

export async function handle(request, store) {
  if (request.jsonrpc !== '2.0') throw Object.assign(new Error('JSON-RPC 2.0 요청이 필요하다'), { code: -32600 })
  if (request.id === undefined) return null
  let result
  switch (request.method) {
    case 'initialize': result = { protocolVersion: '2025-11-25', capabilities: { tools: {} }, serverInfo: { name: 'seoul-character-drafts', version: '0.1.0' } }; break
    case 'ping': result = {}; break
    case 'tools/list': result = { tools }; break
    case 'tools/call': {
      try { result = { content: [{ type: 'text', text: JSON.stringify(await call(store, request.params?.name, request.params?.arguments ?? {})) }] } }
      catch (error) { result = { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: error.code ?? 'DRAFT_ERROR', message: error.message }) }] } }
      break
    }
    default: throw Object.assign(new Error(`알 수 없는 MCP 메서드: ${request.method}`), { code: -32601 })
  }
  return { jsonrpc: '2.0', id: request.id, result }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const store = createDraftStore({ root: process.env.SEOUL_SHEET_DRAFT_DIR })
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity })
  for await (const line of lines) {
  let request
  try {
    request = JSON.parse(line)
    const response = await handle(request, store)
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`)
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request?.id ?? null, error: { code: typeof error.code === 'number' ? error.code : -32600, message: error.message } })}\n`)
  }
  }
}
