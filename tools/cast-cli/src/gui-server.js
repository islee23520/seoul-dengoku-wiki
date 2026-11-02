import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN = join(__dirname, '..', 'bin', 'seoul-cast.js')

const GUI_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>seoul-cast — 캐릭터 생성기</title>
<style>
:root { --bg:#1a1a2e; --panel:#16213e; --accent:#0f3460; --text:#e8e8e8; --gold:#e2b714; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Pretendard',system-ui,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; display:flex; }
.sidebar { width:260px; background:var(--panel); padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
.sidebar h1 { font-size:1.2rem; color:var(--gold); }
.sidebar button { padding:0.7rem 1rem; border:none; border-radius:6px; background:var(--accent); color:var(--text); cursor:pointer; font-size:0.9rem; transition:background 0.2s; }
.sidebar button:hover { background:#1a4a80; }
.sidebar .count { font-size:0.8rem; opacity:0.7; margin-top:auto; }
.main { flex:1; padding:2rem; overflow-y:auto; }
.card-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
.char-card { background:var(--panel); border-radius:10px; padding:1.2rem; border:1px solid rgba(255,255,255,0.05); }
.char-card h3 { color:var(--gold); margin-bottom:0.5rem; }
.char-card .meta { font-size:0.85rem; opacity:0.8; margin-bottom:0.8rem; }
.attr-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; margin-bottom:0.8rem; }
.attr-box { text-align:center; padding:0.5rem; background:rgba(0,0,0,0.3); border-radius:6px; }
.attr-box .label { font-size:0.7rem; opacity:0.6; }
.attr-box .val { font-size:1.4rem; font-weight:bold; color:var(--gold); }
.cp-line { font-size:0.85rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem; margin-top:0.5rem; }
.skills { margin-top:0.5rem; }
.skills span { display:inline-block; background:var(--accent); padding:0.2rem 0.6rem; border-radius:4px; font-size:0.75rem; margin:0.15rem; }
.form { background:var(--panel); padding:1.5rem; border-radius:10px; margin-bottom:1.5rem; }
.form h2 { color:var(--gold); font-size:1.1rem; margin-bottom:1rem; }
.form label { display:block; margin-bottom:0.8rem; font-size:0.9rem; }
.form input, .form select { width:100%; padding:0.5rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:var(--text); margin-top:0.3rem; }
.form button { padding:0.7rem 2rem; background:var(--gold); color:#1a1a2e; border:none; border-radius:6px; font-weight:bold; cursor:pointer; }
.roll-panel { background:var(--panel); padding:1.5rem; border-radius:10px; margin-bottom:1.5rem; }
.roll-panel h2 { color:var(--gold); font-size:1.1rem; margin-bottom:0.8rem; }
.roll-result { font-size:2rem; text-align:center; padding:1.5rem; }
.roll-result.success { color:#4ade80; }
.roll-result.fail { color:#f87171; }
</style>
</head>
<body>
<nav class="sidebar">
  <h1>⚔ seoul-cast</h1>
  <button onclick="showGenerate()">캐릭터 생성</button>
  <button onclick="showRoll()">주사위 굴림</button>
  <button onclick="showList()">캐릭터 목록</button>
  <button onclick="syncGitHub()">GitHub 동기화</button>
  <p class="count" id="count"></p>
</nav>
<main class="main" id="main"></main>
<script>
const api = {
  async list() { return fetch('/api/characters').then(r=>r.json()) },
  async generate(opts) { return fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(opts)}).then(r=>r.json()) },
  async roll(target) { return fetch('/api/roll/'+target).then(r=>r.json()) },
  async sync() { return fetch('/api/sync',{method:'POST'}).then(r=>r.json()) },
}

function showGenerate() {
  document.getElementById('main').innerHTML = \`
  <div class="form">
    <h2>새 캐릭터 생성</h2>
    <label>이름 <input id="f-name" placeholder="자동 (비우면 랜덤)" /></label>
    <label>성별
      <select id="f-gender"><option value="">자동</option><option value="남">남성</option><option value="여">여성</option></select>
    </label>
    <label>국가
      <select id="f-state"><option value="">자동</option>
        <option value="S01">S01 수문국</option><option value="S02">S02 규격맹</option>
        <option value="S03">S03 태욱그룹</option><option value="S04">S04 명부교회</option>
        <option value="S05">S05 동방사</option><option value="S06">S06 대한민국정부</option>
        <option value="S07">S07 환적국</option><option value="S08">S08 중앙기술보존원</option>
        <option value="S09">S09 여의도출자연합회</option><option value="S10">S10 안국총림</option>
        <option value="S11">S11 성하그룹</option><option value="S12">S12 신내운수</option>
        <option value="S13">S13 흰십자단</option><option value="S14">S14 아관사</option>
        <option value="S15">S15 명동대교구</option><option value="S16">S16 정동노총</option>
      </select>
    </label>
    <label>생업 <input id="f-occ" placeholder="자동 (예: 경비 당직)" /></label>
    <button onclick="doGenerate()">생성</button>
  </div>
  <div id="result"></div>\`
}

async function doGenerate() {
  const opts = {}
  const name = document.getElementById('f-name').value
  if (name) opts.given = name
  const g = document.getElementById('f-gender').value
  if (g) opts.gender = g
  const s = document.getElementById('f-state').value
  if (s) opts.state = s
  const o = document.getElementById('f-occ').value
  if (o) opts.occupation = o
  const c = await api.generate(opts)
  document.getElementById('result').innerHTML = renderCard(c)
  updateCount()
}

function renderCard(c) {
  return \`
  <div class="char-card">
    <h3>\${c.name}</h3>
    <p class="meta">\${c.gender} | \${c.stateName} | \${c.occupation}</p>
    <div class="attr-grid">
      <div class="attr-box"><div class="label">ST</div><div class="val">\${c.attributes.ST}</div></div>
      <div class="attr-box"><div class="label">DX</div><div class="val">\${c.attributes.DX}</div></div>
      <div class="attr-box"><div class="label">IQ</div><div class="val">\${c.attributes.IQ}</div></div>
      <div class="attr-box"><div class="label">HT</div><div class="val">\${c.attributes.HT}</div></div>
    </div>
    <p class="meta">HP \${c.derived.HP} | Will \${c.derived.Will} | Dodge \${c.derived.Dodge}</p>
    <div class="cp-line">
      CP <strong>\${c.totalCP}</strong> (\${c.tier})<br>
      능력치 \${c.attributeCP} + 장점 \${c.advantageCP} + 단점 \${c.disadvantageCP} + 기술 \${c.skillCP}
    </div>
    <div class="skills">
      \${(c.skills||[]).map(s=>\`<span>\${s.name} \${s.level} (\${s.cp}CP)</span>\`).join('')}
    </div>
  </div>\`
}

function showRoll() {
  document.getElementById('main').innerHTML = \`
  <div class="roll-panel">
    <h2>GURPS 3d6 판정</h2>
    <label style="display:flex;gap:1rem;align-items:center">
      목표치 <input id="target" type="number" value="10" min="3" max="20" style="width:80px;padding:0.5rem" />
      <button onclick="doRoll()" style="padding:0.6rem 1.5rem">굴림</button>
    </label>
    <div class="roll-result" id="roll-out"></div>
  </div>\`
}

async function doRoll() {
  const t = parseInt(document.getElementById('target').value) || 10
  const r = await api.roll(t)
  const el = document.getElementById('roll-out')
  el.className = 'roll-result ' + (r.crit || r.success ? 'success' : 'fail')
  el.innerHTML = \`\${r.dice.join(' + ')} = <strong>\${r.total}</strong> vs \${r.target}<br>\${r.crit?'★ 대성공':r.fumble?'✖ 대실패':r.success?'✅ 성공':'❌ 실패'}\`
}

async function showList() {
  const data = await api.list()
  document.getElementById('main').innerHTML = '<div class="card-list">' + (data.characters||[]).map(renderCard).join('') + '</div>'
}

async function syncGitHub() {
  const r = await api.sync()
  alert(r.message || '동기화 완료')
}

async function updateCount() {
  const data = await api.list()
  document.getElementById('count').textContent = (data.characters||[]).length + '명 저장됨'
}

showGenerate()
updateCount()
</script>
</body>
</html>`

export function start() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')

    if (url.pathname === '/' ) {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
      res.end(GUI_HTML)
      return
    }

    if (url.pathname === '/api/characters' && req.method === 'GET') {
      const mod = await import('file://' + BIN)
      const store = mod.loadStore()
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'})
      res.end(JSON.stringify(store))
      return
    }

    if (url.pathname === '/api/generate' && req.method === 'POST') {
      let body = ''
      req.on('data', c => body += c)
      req.on('end', async () => {
        const opts = body ? JSON.parse(body) : {}
        const mod = await import('file://' + BIN)
        const c = mod.generateCharacter(opts)
        const store = mod.loadStore()
        store.characters.push(c)
        mod.saveStore(store)
        res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'})
        res.end(JSON.stringify(c))
      })
      return
    }

    const rollMatch = url.pathname.match(/^\/api\/roll\/(\d+)$/)
    if (rollMatch && req.method === 'GET') {
      const mod = await import('file://' + BIN)
      const r = mod.gurpsRoll(parseInt(rollMatch[1]))
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'})
      res.end(JSON.stringify(r))
      return
    }

    if (url.pathname === '/api/sync' && req.method === 'POST') {
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'})
      res.end(JSON.stringify({ message: 'GitHub 동기화: seoul-cast sync 명령으로 내보냄' }))
      return
    }

    res.writeHead(404).end('{"error":"not found"}')
  })

  server.listen(17200, () => {
    console.log('✅ seoul-cast GUI: http://localhost:17200')
  })
}
