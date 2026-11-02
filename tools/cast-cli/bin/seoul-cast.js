#!/usr/bin/env node

import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import readline from 'node:readline'
import { readCastStore, getCast, registerCast } from '../src/store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const HOME_DIR = join(process.env.HOME || process.env.USERPROFILE || '.', '.seoul-cast')
const STORE = join(HOME_DIR, 'characters.json')

function loadData() {
  const load = (name, fallback) => {
    const p = join(DATA_DIR, name)
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback
  }
  return {
    surnames: load('surnames.json', ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전']),
    male: load('given-male.json', ['준호','민재','도윤','서준','지호','현우','우진','선우','재윤','시우']),
    female: load('given-female.json', ['서연','지민','수아','하윤','민서','지우','예은','소율','하은','다은']),
    states: load('states.json', {S01:'수문국',S02:'규격맹',S03:'태욱그룹',S04:'명부교회',S05:'동방사',S06:'대한민국정부',S07:'환적국',S08:'중앙기술보존원',S09:'여의도출자연합회',S10:'안국총림',S11:'성하그룹',S12:'신내운수',S13:'흰십자단',S14:'아관사',S15:'명동대교구',S16:'정동노총'}),
    occupations: load('occupations.json', ['정수 당직','경비 당직','배급 서기','호송 인원','의료 진료','차량 정비','물 계약','무역','경작','사냥']),
    advantages: load('advantages.json', [
      {id:'combat-reflexes',name:'전투 반사신경',cp:15,effect:'전투 반응 +1, 선제 행동'},
      {id:'strong-will-1',name:'강한 의지 +1',cp:5,effect:'의지 판정 +1'},
      {id:'strong-will-2',name:'강한 의지 +2',cp:10,effect:'의지 판정 +2'},
      {id:'fearlessness-2',name:'대담함 +2',cp:4,effect:'공포 판정 +2'},
      {id:'fit',name:'건강 체격',cp:5,effect:'피로 회복 빠름'},
      {id:'charisma-1',name:'카리스마 +1',cp:5,effect:'설득·지휘 보정'},
      {id:'contacts',name:'인맥',cp:10,effect:'정보·지원 획득'},
      {id:'wealth',name:'여유 자산',cp:10,effect:'경제적 여유'},
    ]),
    disadvantages: load('disadvantages.json', [
      {id:'bad-temper',name:'급성질',cp:-10,effect:'화내기 쉬움 — 자제 판정'},
      {id:'code-honor',name:'명예 수칙',cp:-10,effect:'수칙 준수 의무'},
      {id:'duty',name:'의무감',cp:-5,effect:'상관·공동체 의무'},
      {id:'overconfidence',name:'과신',cp:-5,effect:'위험 감수'},
      {id:'social-stigma',name:'출신 편견',cp:-10,effect:'사회적 편견'},
    ]),
    skills: load('skills.json', [
      {id:'bayonet',name:'총검술',attr:'DX',diff:'중',effect:'총검 찌르기 명중률'},
      {id:'sword',name:'검법',attr:'DX',diff:'중',effect:'도검 베기·찌르기'},
      {id:'spear',name:'창술',attr:'DX',diff:'중',effect:'장창 찌르기'},
      {id:'archery',name:'궁술',attr:'DX',diff:'중',effect:'활 명중률'},
      {id:'strategy',name:'전략',attr:'IQ',diff:'상',effect:'부대 전체 행동 보정'},
      {id:'tactics',name:'전술',attr:'IQ',diff:'중',effect:'소부대 교전 보정'},
      {id:'leadership',name:'지휘',attr:'IQ',diff:'중',effect:'부대 사기·통제'},
      {id:'politics',name:'정치',attr:'IQ',diff:'상',effect:'권력 획득·유지'},
      {id:'diplomacy',name:'외교',attr:'IQ',diff:'상',effect:'협상 성공률'},
      {id:'first-aid',name:'응급 처치',attr:'IQ',diff:'중',effect:'부상자 응급 치료'},
      {id:'survival',name:'생존',attr:'HT',diff:'중',effect:'야외·야영지 운영'},
      {id:'intimidation',name:'협박',attr:'Will',diff:'중',effect:'공포 부여·복종'},
    ]),
  }
}

const ATTR_CP = { 7:-70, 8:-50, 9:-30, 10:0, 11:10, 12:20, 13:30, 14:40, 15:60, 16:80 }
const DIFF_COST = { '하': {'+0':1,'+1':2,'+2':4}, '중': {'+0':2,'+1':4,'+2':8}, '상': {'+0':4,'+1':8,'+2':16} }

function roll3d6() {
  return [1,2,3].map(() => Math.floor(Math.random()*6)+1)
}
function gurpsRoll(target) {
  const dice = roll3d6()
  const total = dice.reduce((a,b)=>a+b,0)
  const success = total <= target
  const crit = total <= 4 || (total <= 5 && target >= 15)
  const fumble = total >= 17 || (total === 16 && target <= 6)
  return { dice, total, target, success, crit, fumble, margin: target - total }
}
function derivedStats(attrs) {
  const speed = (attrs.DX + attrs.HT) / 4
  return {
    HP: attrs.ST, FP: attrs.HT, Will: attrs.IQ, Per: attrs.IQ,
    BasicSpeed: Math.floor(speed*10)/10, BasicMove: Math.floor(speed), Dodge: Math.floor(speed)+3,
  }
}

function loadStore() {
  if (existsSync(STORE)) return JSON.parse(readFileSync(STORE, 'utf8'))
  return { characters: [] }
}
function saveStore(store) {
  if (!existsSync(HOME_DIR)) mkdirSync(HOME_DIR, {recursive:true})
  writeFileSync(STORE, JSON.stringify(store, null, 2))
}

function generateCharacter(opts = {}) {
  const d = loadData()
  const r = Math.random
  const surname = opts.surname || d.surnames[Math.floor(r()*d.surnames.length)]
  const gender = opts.gender || (r() < 0.5 ? '남' : '여')
  const given = opts.given || (gender === '남'
    ? d.male[Math.floor(r()*d.male.length)]
    : d.female[Math.floor(r()*d.female.length)])
  const state = opts.state || Object.keys(d.states)[Math.floor(r()*16)]
  const occupation = opts.occupation || d.occupations[Math.floor(r()*d.occupations.length)]

  const attr = () => 10 + Math.floor(r() * 4)
  const attributes = { ST: attr(), DX: attr(), IQ: attr(), HT: attr() }
  const attrCP = Object.values(attributes).reduce((s,v) => s + (ATTR_CP[v]||0), 0)

  const nAdv = Math.floor(r()*3)
  const chosen = [...d.advantages].sort(()=>r()-0.5).slice(0,nAdv)
  const advCP = chosen.reduce((s,a)=>s+a.cp,0)
  const nDis = Math.floor(r()*2)
  const chosenDis = [...d.disadvantages].sort(()=>r()-0.5).slice(0,nDis)
  const disCP = chosenDis.reduce((s,x)=>s+x.cp,0)

  const nSkills = 2 + Math.floor(r()*4)
  const chosenSkills = [...d.skills].sort(()=>r()-0.5).slice(0,nSkills).map(sk => {
    const bonus = Math.floor(r()*3)
    const cost = (DIFF_COST[sk.diff] || DIFF_COST['중'])[`+${bonus}`] || 2
    const level = (sk.attr === 'Will' ? attributes.IQ : attributes[sk.attr]) + bonus
    return { ...sk, level, cp: cost, bonus }
  })
  let skillCP = chosenSkills.reduce((s,k)=>s+k.cp,0)

  let totalCP = attrCP + advCP + disCP + skillCP
  const MIN_CP = 75
  const fillers = ['요리', '운전', '수영', '등반', '은신', '관찰', '지역 지식', '동물 다루기', '협상', '노래']
  let fillerIdx = 0
  while (totalCP < MIN_CP) {
    const name = fillers[fillerIdx % fillers.length]
    const existing = chosenSkills.find(s => s.name === name)
    if (existing) {
      existing.cp += 4
      existing.level += 1
      skillCP += 4
      totalCP += 4
    } else {
      chosenSkills.push({ id: 'filler-' + name, name, attr: 'IQ', diff: '하', effect: '일상 기술', level: attributes.IQ + Math.floor(fillerIdx / fillers.length), cp: 4, bonus: 0 })
      skillCP += 4
      totalCP += 4
    }
    fillerIdx++
  }

  return {
    id: 'cast-' + Date.now().toString(36),
    name: `${surname} ${given}`,
    gender, state, stateName: d.states[state] || state,
    occupation,
    attributes, attributeCP: attrCP,
    advantages: chosen, advantageCP: advCP,
    disadvantages: chosenDis, disadvantageCP: disCP,
    skills: chosenSkills, skillCP,
    totalCP,
    derived: derivedStats(attributes),
    tier: totalCP >= 200 ? '주요 (200~300)' : totalCP >= 125 ? '훈련 (125~200)' : '일반 (75~125)',
    createdAt: new Date().toISOString(),
  }
}

const cmd = process.argv[2]
const arg = process.argv[3]

switch (cmd) {
case 'generate': {
  const c = generateCharacter(arg ? {given: arg} : {})
  await registerCast(c)
  console.log(`\n=== 생성됨: ${c.name} ===`)
  console.log(`성별: ${c.gender} | 국가: ${c.stateName} | 생업: ${c.occupation}`)
  console.log(`능력치: ST${c.attributes.ST} DX${c.attributes.DX} IQ${c.attributes.IQ} HT${c.attributes.HT}`)
  console.log(`파생: HP${c.derived.HP} Will${c.derived.Will} Dodge${c.derived.Dodge}`)
  console.log(`CP: ${c.totalCP} (${c.tier})`)
  console.log(`  능력치${c.attributeCP} + 장점${c.advantageCP} + 단점${c.disadvantageCP} + 기술${c.skillCP}`)
  if (c.skills.length) console.log(`기술: ${c.skills.map(s=>`${s.name}(${s.level})`).join(', ')}`)
  console.log(`\n저장됨: ${STORE}`)
  break
}
case 'list': {
  if (process.argv.includes('--json')) { console.log(JSON.stringify(await readCastStore(), null, 2)); break }
  const store = await readCastStore()
  console.log(`\n${store.characters.length}명:`)
  for (const c of store.characters) {
    console.log(`  ${c.name} — ${c.stateName} ${c.occupation} — CP ${c.totalCP}`)
  }
  break
}
case 'roll': {
  const target = parseInt(arg) || 10
  const r = gurpsRoll(target)
  console.log(`\n3d6: [${r.dice.join(', ')}] = ${r.total} vs 목표 ${target}`)
  if (r.crit) console.log('★ 대성공!')
  else if (r.fumble) console.log('✖ 대실패!')
  else console.log(r.success ? `✅ 성공 (마진 +${r.margin})` : `❌ 실패 (마진 ${r.margin})`)
  break
}
case 'get': {
  console.log(JSON.stringify(await getCast(arg), null, 2))
  break
}
case 'register': {
  console.log(JSON.stringify(await registerCast(JSON.parse(readFileSync(arg, 'utf8'))), null, 2))
  break
}
case 'serve': {
  console.log('로컬 GUI: http://localhost:17200')
  import('./gui-server.js').then(m => m.start())
  break
}
case 'mcp': {
  import('./mcp-server.js').then(m => m.start())
  break
}
case 'skill': {
  console.log(`
=== seoul-cast AI 스킬 ===

이 도구는 서울:전국 세계관의 겁스(GURPS 4판) 캐릭터를 생성·관리합니다.

MCP 도구 (AI 어시스턴트 연동):
  seoul_cast_generate  — 캐릭터 생성 (옵션: 이름, 국가, 성별, 생업)
  seoul_cast_list      — 저장된 캐릭터 목록
  seoul_cast_get       — 개별 캐릭터 상세 (id)
  seoul_cast_roll      — GURPS 3d6 판정 (목표치)
  seoul_cast_stats     — GURPS 규칙 요약

규칙 요약:
  능력치: ST(힘) DX(민첩) IQ(지능) HT(건강) — 10이 평균, 1점당 10 CP
  판정: 3d6 굴려서 스킬 레벨 이하 = 성공
  CP 밴드: 일반 75~125 | 훈련 125~200 | 주요 200~300
  파생: HP=ST, FP=HT, Will=IQ, Per=IQ, Dodge=Speed+3

연결: claude mcp add seoul-cast -- seoul-cast mcp
`)
  break
}
case 'sync': {
  const gh = spawnSync('gh', ['auth','status'], {encoding:'utf8'})
  if (gh.status !== 0) {
    console.log('GitHub CLI 인증 필요: gh auth login')
    process.exit(1)
  }
  const store = loadStore()
  const exportPath = join(HOME_DIR, 'export.json')
  writeFileSync(exportPath, JSON.stringify(store, null, 2))
  console.log(`내보냄: ${exportPath}`)
  console.log(`캐릭터 ${store.characters.length}명`)
  console.log('\nGitHub 업로드:')
  console.log('  gh repo clone islee23520/seoul-dengoku-wiki')
  console.log(`  cp ${exportPath} <repo>/lore/name-pools/cast-generated.json`)
  console.log('  git add . && git commit -m "feat(cast): 생성 캐릭터 추가"')
  break
}
default:
  console.log(`
seoul-cast — 서울:전국 캐릭터 생성 CLI

명령:
  serve             로컬 GUI 서버 (localhost:17200)
  mcp               MCP 서버 (AI 어시스턴트 도구)
  generate [이름]   캐릭터 생성
  list              캐릭터 목록
  list --json       Export local drafts as JSON
  get <stable-id>   Export one local draft by its stable ID
  register <json>   Register a supplied draft; reject duplicate IDs
  roll [목표치]     GURPS 3d6 굴림
  sync              GitHub 동기화
  skill             AI 스킬 문서
`)
}
