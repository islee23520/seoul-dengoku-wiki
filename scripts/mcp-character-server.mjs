#!/usr/bin/env node
// 겁스 4판 캐릭터 시트 MCP 서버 — AI 도구 연동
// 사용법: node scripts/mcp-character-server.mjs
// MCP 클라이언트가 이 서버에 연결해 캐릭터를 생성·조회·수정합니다.

import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GURPS = join(ROOT, 'lore/name-pools/gurps-cast.json')
const PORT = parseInt(process.env.MCP_PORT || '17200', 10)

function loadGurps() {
  return JSON.parse(readFileSync(GURPS, 'utf8'))
}

function findCharacter(id) {
  const data = loadGurps()
  return data.characters?.find(c => c.id === id || c.personId === id) || null
}

function validateSheet(sheet) {
  const errors = []
  if (!sheet.name || typeof sheet.name !== 'string') errors.push('name 필수')
  for (const attr of ['ST', 'DX', 'IQ', 'HT']) {
    const v = sheet.attributes?.[attr]
    if (typeof v !== 'number' || v < 1 || v > 20) errors.push(attr + ' 1-20 범위')
  }
  if (typeof sheet.cp !== 'number' || sheet.cp < 25 || sheet.cp > 1000) errors.push('CP 25-1000 범위')
  return errors
}

const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const parts = url.pathname.split('/').filter(Boolean)

  // GET /api/characters — 전체 목록 (요약)
  if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'characters' && parts.length === 2) {
    const data = loadGurps()
    const list = (data.characters || []).map(c => ({
      id: c.id, personId: c.personId, name: c.name,
      state: c.state, cp: c.cp, tier: c.tier,
      ST: c.attributes?.ST, DX: c.attributes?.DX, IQ: c.attributes?.IQ, HT: c.attributes?.HT
    }))
    res.writeHead(200).end(JSON.stringify({ count: list.length, characters: list }))
    return
  }

  // GET /api/characters/:id — 개별 조회 (전체 시트)
  if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'characters' && parts.length === 3) {
    const ch = findCharacter(parts[2])
    if (!ch) { res.writeHead(404).end(JSON.stringify({ error: '인물 없음' })); return }
    res.writeHead(200).end(JSON.stringify(ch))
    return
  }

  // GET /api/characters/:id/sheet — 겁스 시트만
  if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'characters' && parts[3] === 'sheet') {
    const ch = findCharacter(parts[2])
    if (!ch) { res.writeHead(404).end(JSON.stringify({ error: '인물 없음' })); return }
    res.writeHead(200).end(JSON.stringify({
      name: ch.name, attributes: ch.attributes, cp: ch.cp,
      skills: ch.skills, advantages: ch.advantages, disadvantages: ch.disadvantages,
      quirks: ch.quirks, background: ch.background
    }))
    return
  }

  // POST /api/characters — 새 인물 생성
  if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'characters' && parts.length === 2) {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const sheet = JSON.parse(body)
        const errors = validateSheet(sheet)
        if (errors.length > 0) {
          res.writeHead(400).end(JSON.stringify({ error: '검증 실패', details: errors }))
          return
        }
        // 저장 로직: gurps-cast.json에 추가
        const data = loadGurps()
        const newId = 'person-' + String(1000 + (data.characters?.length || 0) + 1)
        const newChar = { id: newId, ...sheet, provenance: { kind: 'ai', source: 'mcp-api', timestamp: new Date().toISOString() } }
        if (!data.characters) data.characters = []
        data.characters.push(newChar)
        writeFileSync(GURPS, JSON.stringify(data, null, 2) + '\n')
        res.writeHead(201).end(JSON.stringify({ created: true, id: newId, character: newChar }))
      } catch (e) {
        res.writeHead(400).end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  // PATCH /api/characters/:id — 기존 인물 갱신
  if (req.method === 'PATCH' && parts[0] === 'api' && parts[1] === 'characters' && parts.length === 3) {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const updates = JSON.parse(body)
        const data = loadGurps()
        const idx = (data.characters || []).findIndex(c => c.id === parts[2] || c.personId === parts[2])
        if (idx === -1) { res.writeHead(404).end(JSON.stringify({ error: '인물 없음' })); return }
        const merged = { ...data.characters[idx], ...updates }
        const errors = validateSheet(merged)
        if (errors.length > 0) {
          res.writeHead(400).end(JSON.stringify({ error: '검증 실패', details: errors }))
          return
        }
        merged._updated = new Date().toISOString()
        merged._updatedBy = 'mcp-api'
        data.characters[idx] = merged
        writeFileSync(GURPS, JSON.stringify(data, null, 2) + '\n')
        res.writeHead(200).end(JSON.stringify({ updated: true, character: merged }))
      } catch (e) {
        res.writeHead(400).end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  // MCP 도구 목록
  if (req.method === 'GET' && url.pathname === '/mcp/tools') {
    res.writeHead(200).end(JSON.stringify({
      tools: [
        { name: 'list_characters', description: '전체 인물 목록 (ID, 이름, CP, 능력치 요약)', endpoint: 'GET /api/characters' },
        { name: 'get_character', description: '개별 인물의 전체 겁스 시트', endpoint: 'GET /api/characters/:id' },
        { name: 'get_sheet', description: '인물의 겁스 시트만 (능력치·기술·배경)', endpoint: 'GET /api/characters/:id/sheet' },
        { name: 'create_character', description: '새 인물 생성', endpoint: 'POST /api/characters' },
        { name: 'update_character', description: '기존 인물 갱신', endpoint: 'PATCH /api/characters/:id' },
      ]
    }))
    return
  }

  res.writeHead(404).end(JSON.stringify({ error: '경로 없음' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`겁스 캐릭터 MCP 서버: http://127.0.0.1:${PORT}`)
  console.log(`도구 목록: http://127.0.0.1:${PORT}/mcp/tools`)
})
