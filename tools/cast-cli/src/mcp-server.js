import { createServer } from 'node:net'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN = join(__dirname, '..', 'bin', 'seoul-cast.js')

const TOOLS = [
  {
    name: 'seoul_cast_generate',
    description: '서울:전국 세계관의 GURPS 4판 캐릭터를 생성한다. 이름·성별·국가·생업을 지정하거나 비워서 랜덤 생성할 수 있다.',
    inputSchema: {
      type: 'object',
      properties: {
        given: { type: 'string', description: '이름 (비우면 랜덤)' },
        surname: { type: 'string', description: '성 (비우면 랜덤)' },
        gender: { type: 'string', enum: ['남', '여'], description: '성별' },
        state: { type: 'string', description: '국가 ID (S01~S16)' },
        occupation: { type: 'string', description: '생업 (예: 경비 당직)' },
      },
    },
  },
  {
    name: 'seoul_cast_list',
    description: '저장된 캐릭터 목록을 반환한다.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'seoul_cast_get',
    description: 'ID로 개별 캐릭터의 상세 시트를 반환한다.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: '캐릭터 ID' } },
      required: ['id'],
    },
  },
  {
    name: 'seoul_cast_roll',
    description: 'GURPS 3d6 판정을 굴린다. 목표치(스킬 레벨)를 넣는다.',
    inputSchema: {
      type: 'object',
      properties: { target: { type: 'number', description: '목표치 (기본 10)' } },
    },
  },
  {
    name: 'seoul_cast_stats',
    description: 'GURPS 4판 규칙 요약 (능력치·CP·판정·파생 수치)을 반환한다.',
    inputSchema: { type: 'object', properties: {} },
  },
]

export function start() {
  const server = createServer(async (socket) => {
    const rl = (await import('node:readline')).createInterface({ input: socket })
    let buffer = ''

    socket.on('data', async (chunk) => {
      buffer += chunk.toString()
      let idx
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)
        if (!line) continue
        try {
          const msg = JSON.parse(line)
          const reply = await handle(msg)
          socket.write(JSON.stringify(reply) + '\n')
        } catch (e) {
          socket.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: e.message } }) + '\n')
        }
      }
    })
  })

  server.listen(0, () => {
    const addr = server.address()
    process.stdout.write(JSON.stringify({ port: addr.port, tools: TOOLS.map(t => t.name) }) + '\n')
  })

  process.stdin.on('data', async (chunk) => {
    let buffer = chunk.toString()
    for (const line of buffer.split('\n').filter(l => l.trim())) {
      try {
        const msg = JSON.parse(line)
        const reply = await handle(msg)
        process.stdout.write(JSON.stringify(reply) + '\n')
      } catch (e) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: e.message } }) + '\n')
      }
    }
  })

  async function handle(msg) {
    const { id, method, params } = msg
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'seoul-cast', version: '1.0.0' },
        },
      }
    }
    if (method === 'notifications/initialized') return { jsonrpc: '2.0', id, result: {} }
    if (method === 'tools/list') {
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } }
    }
    if (method === 'tools/call') {
      const name = params?.name
      const args = params?.arguments || {}
      const mod = await import('file://' + BIN)

      switch (name) {
      case 'seoul_cast_generate': {
        const c = mod.generateCharacter(args)
        const store = mod.loadStore()
        store.characters.push(c)
        mod.saveStore(store)
        return {
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: formatSheet(c) }],
          },
        }
      }
      case 'seoul_cast_list': {
        const store = mod.loadStore()
        const lines = store.characters.map(c =>
          `${c.id}: ${c.name} (${c.gender}) ${c.stateName} ${c.occupation} — CP ${c.totalCP}`
        )
        return {
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text: lines.join('\n') || '저장된 캐릭터 없음' }] },
        }
      }
      case 'seoul_cast_get': {
        const store = mod.loadStore()
        const c = store.characters.find(x => x.id === args.id)
        if (!c) {
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: '캐릭터 없음: ' + args.id }] } }
        }
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: formatSheet(c) }] } }
      }
      case 'seoul_cast_roll': {
        const r = mod.gurpsRoll(args.target || 10)
        const text = `3d6: [${r.dice.join(', ')}] = ${r.total} vs ${r.target} → ${r.crit ? '★ 대성공' : r.fumble ? '✖ 대실패' : r.success ? '✅ 성공 (마진 +' + r.margin + ')' : '❌ 실패 (마진 ' + r.margin + ')'}`
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } }
      }
      case 'seoul_cast_stats': {
        const text = `GURPS 4판 요약:
능력치: ST(힘)·DX(민첩)·IQ(지능)·HT(건강) — 10이 평균, 1점 = 10 CP
판정: 3d6 굴려서 스킬 레벨 이하 = 성공 (낮을수록 좋음)
대성공: 3~4 또는 5 이하(목표 15+)
대실패: 17~18
파생: HP=ST, FP=HT, Will=IQ, Per=IQ, Speed=(DX+HT)/4, Dodge=Speed+3
CP 밴드: 일반 75~125 | 훈련 125~200 | 주요 200~300
세계관: 서울:전국 — 2126년 붕괴 후 서울 지하철 국가들 (S01 수문국 ~ S16 정동노총)`
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } }
      }
      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown tool: ' + name } }
      }
    }
    return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown method: ' + method } }
  }

  function formatSheet(c) {
    const skills = (c.skills || []).map(s => `  ${s.name} ${s.level} (${s.cp}CP) — ${s.effect}`).join('\n')
    const advs = (c.advantages || []).map(a => `  ${a.name} (+${a.cp}CP) — ${a.effect}`).join('\n')
    const dis = (c.disadvantages || []).map(d => `  ${d.name} (${d.cp}CP) — ${d.effect}`).join('\n')
    return `${c.name} (${c.gender})
국가: ${c.stateName} | 생업: ${c.occupation}
능력치: ST${c.attributes.ST} DX${c.attributes.DX} IQ${c.attributes.IQ} HT${c.attributes.HT}
파생: HP${c.derived.HP} FP${c.derived.FP} Will${c.derived.Will} Dodge${c.derived.Dodge}
CP 총 ${c.totalCP} (${c.tier})
  = 능력치${c.attributeCP} + 장점${c.advantageCP} + 단점${c.disadvantageCP} + 기술${c.skillCP}
장점:
${advs || '  없음'}
단점:
${dis || '  없음'}
기술:
${skills || '  없음'}
ID: ${c.id}`
  }
}
