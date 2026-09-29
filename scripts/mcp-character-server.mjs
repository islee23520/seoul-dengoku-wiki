#!/usr/bin/env node
// 겁스 4판 캐릭터 시트 MCP 서버 — AI 도구 연동
// 사용법: node scripts/mcp-character-server.mjs
// MCP 클라이언트가 이 서버에 연결해 캐릭터를 생성·조회·수정합니다.

import { 
// ── Settlement NPC Generation ──
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const lorePools = join(__dirname, '..', 'lore', 'name-pools')

let SURNAME_POOL = []
let MALE_POOL = []
let FEMALE_POOL = []

try {
  const sn = JSON.parse(readFileSync(join(lorePools, 'surnames.json'), 'utf8'))
  SURNAME_POOL = sn.names || sn.surnames || []
  const mn = JSON.parse(readFileSync(join(lorePools, 'given-male.json'), 'utf8'))
  MALE_POOL = mn.names || mn.male || []
  const fn = JSON.parse(readFileSync(join(lorePools, 'given-female.json'), 'utf8'))
  FEMALE_POOL = fn.names || fn.female || []
} catch (e) {
  SURNAME_POOL = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전']
  MALE_POOL = ['준호','민재','도윤','서준','지호','현우','우진','선우','재윤','시우','민준','지환','태윤','승현','준서']
  FEMALE_POOL = ['서연','지민','수아','하윤','민서','지우','예은','소율','하은','다은','시은','유진','채원','나윤','가온']
}

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const OCCUPATION_POOLS = {
  military: ['경비 당직', '설비 점검', '통행 관리', '무기 수리'],
  water: ['정수 당직', '수문 조작', '배급 서기'],
  transport: ['호송 인원', '차량 정비', '궤도 관리', '연락 당직'],
  religious: ['교육 담당', '명부 관리', '기록 관리'],
  medical: ['의료 진료', '약재 조제', '의무원'],
  trade: ['물 계약', '무역', '창고 관리'],
  general: ['경작', '채집', '제조', '운송', '배급 서기', '경비 당직'],
}

const MARTIAL_BY_OCC = {
  '경비 당직': ['총검술', '창술', '권법'],
  '호송 인원': ['창술', '경공'],
  '정수 당직': ['권법'],
  '교육 담당': ['검법', '궁술'],
  '무역': ['암기술'],
  '사냥': ['궁술'],
}

function generateNPC(rand, settlementId, settlementType, state) {
  const gender = rand() < 0.5 ? '남' : '여'
  const surname = SURNAME_POOL[Math.floor(rand() * SURNAME_POOL.length)] || '김'
  const given = gender === '남'
    ? (MALE_POOL[Math.floor(rand() * MALE_POOL.length)] || '준호')
    : (FEMALE_POOL[Math.floor(rand() * FEMALE_POOL.length)] || '서연')
  const age = Math.floor(16 + rand() * 50)

  const occPoolKey = settlementType === '거점' ? 'military'
    : settlementType === '역_영지' ? 'trade'
    : settlementType === '초소_영지' ? 'general'
    : 'general'
  const occPool = OCCUPATION_POOLS[occPoolKey] || OCCUPATION_POOLS.general
  const occupation = occPool[Math.floor(rand() * occPool.length)]

  // GURPS attributes: 10 ± 2
  const attr = () => Math.max(7, Math.min(14, 10 + Math.round((rand() - 0.5) * 4)))
  const attributes = { ST: attr(), DX: attr(), IQ: attr(), HT: attr() }

  // CP: 75-125 (ordinary), 125-200 (trained), rare 200+
  const cpRoll = rand()
  const cp = cpRoll < 0.7 ? Math.floor(75 + rand() * 50)
    : cpRoll < 0.95 ? Math.floor(125 + rand() * 75)
    : Math.floor(200 + rand() * 50)

  // Martial: 30% chance, based on occupation
  let martial = null
  if (rand() < 0.3) {
    const martials = MARTIAL_BY_OCC[occupation]
    if (martials && martials.length > 0) {
      martial = martials[Math.floor(rand() * martials.length)]
    }
  }

  // Wandering: 15% chance
  const isWandering = rand() < 0.15

  // Unit eligibility from roster
  const unitEligibility = []
  if (martial === '총검술') unitEligibility.push('UT-bayonet')
  if (martial === '검법') unitEligibility.push('UT-sword')
  if (martial === '창술') unitEligibility.push('UT-spear')
  if (martial === '궁술') unitEligibility.push('UT-archer')
  if (martial === '암기술') unitEligibility.push('UT-thrown')
  if (martial === '경공') unitEligibility.push('UT-scout')
  if (occupation.includes('의료') || occupation.includes('약재') || occupation.includes('의무')) unitEligibility.push('UT-medic')
  if (occupation.includes('정비') || occupation.includes('수리') || occupation.includes('설비')) unitEligibility.push('UT-engineer')
  if (attributes.DX >= 10 && attributes.ST >= 10) unitEligibility.push('UT-ronin')

  return {
    id: 'npc-' + settlementId + '-' + Math.floor(rand() * 100000),
    name: surname + ' ' + given,
    gender, age,
    state: state || 'S00',
    settlement: settlementId,
    settlement_type: settlementType,
    occupation,
    attributes,
    cp: { total: cp },
    martial,
    unit_eligibility: unitEligibility,
    ...(isWandering ? {
      wandering_force: {
        type: '무소속 유랑',
        camp: { name: surname + ' ' + given + ' 야영지', type: '야영지' },
      }
    } : {
      territory: null,
    }),
  }
}

createServer } from 'node:http'
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
  return data.people?.find(c => c.id === id || c.personId === id) || null
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

  // Settlement NPC generation
  if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'settlements' && parts[3] === 'generate-npcs') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const params = body ? JSON.parse(body) : {}
        const settlementId = parts[2]
        const population = params.population || 200
        const settlementType = params.type || '역_영지'
        const state = params.state || 'S00'
        const seed = params.seed || (settlementId + '-opening')

        const rand = seededRandom(hashString(seed))
        const npcCount = Math.max(3, Math.min(50, Math.floor(population / 100)))

        const npcs = []
        for (let i = 0; i < npcCount; i++) {
          npcs.push(generateNPC(rand, settlementId, settlementType, state))
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({
          settlement_id: settlementId,
          population,
          npc_count: npcs.length,
          seed,
          npcs,
        }))
      } catch (e) {
        res.writeHead(400).end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'settlements' && parts[3] === 'npcs') {
    // Return schema info
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({
      endpoint: 'POST /api/settlements/:id/generate-npcs',
      params: { population: 'number (default 200)', type: '거점|역_영지|초소_영지|야영지', state: 'S01-S16', seed: 'string (optional)' },
      rule: '인구 100명당 NPC 1명, 최소 3 최대 50',
    }))
    return
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
    const list = (data.people || []).map(c => ({
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
        const newId = 'person-' + String(1000 + (data.people?.length || 0) + 1)
        const newChar = { id: newId, ...sheet, provenance: { kind: 'ai', source: 'mcp-api', timestamp: new Date().toISOString() } }
        if (!data.people) data.people = []
        data.people.push(newChar)
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
        const idx = (data.people || []).findIndex(c => c.id === parts[2] || c.personId === parts[2])
        if (idx === -1) { res.writeHead(404).end(JSON.stringify({ error: '인물 없음' })); return }
        const merged = { ...data.people[idx], ...updates }
        const errors = validateSheet(merged)
        if (errors.length > 0) {
          res.writeHead(400).end(JSON.stringify({ error: '검증 실패', details: errors }))
          return
        }
        merged._updated = new Date().toISOString()
        merged._updatedBy = 'mcp-api'
        data.people[idx] = merged
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
