import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { calculateDraft, ATTR_COST, stepFor, ROOT } from '../gurps-cast.mjs'

const defaultRoot = resolve(ROOT, '.omo/sheet-drafts')
const detailRoot = resolve(ROOT, 'public/person-details')
const attributes = ['ST', 'DX', 'IQ', 'HT']
const difficulties = ['E', 'A', 'H', 'VH']
const hash = (text) => createHash('sha256').update(text).digest('hex')
const fail = (code, message) => { throw Object.assign(new Error(message), { code }) }
const fileFor = (root, id) => {
  if (!/^[0-9a-f-]{36}$/u.test(id)) fail('DRAFT_ID', '초안 ID 형식이 올바르지 않다')
  return join(root, `${id}.json`)
}

function parseFields(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('DRAFT_INPUT', '초안 입력은 객체여야 한다')
  const fields = input.fields ?? {}
  for (const key of ['name', 'affiliation', 'background', 'livelihood', 'backstory']) {
    if (typeof fields[key] !== 'string') fail('DRAFT_FIELD', `${key}는 문자열이어야 한다`)
  }
  const attrs = input.attributes ?? { ST: 10, DX: 10, IQ: 10, HT: 10 }
  for (const key of attributes) if (!Number.isInteger(attrs[key]) || attrs[key] < 8 || attrs[key] > 20) fail('DRAFT_ATTRIBUTE', `${key}는 8–20 정수여야 한다`)
  if (!Array.isArray(input.skills ?? [])) fail('DRAFT_SKILLS', '기술 목록 형식이 올바르지 않다')
  const skills = (input.skills ?? []).map((skill) => {
    if (!skill || typeof skill.name !== 'string' || !skill.name.trim() || ![...attributes, 'Per', 'Will'].includes(skill.attr) || !difficulties.includes(skill.difficulty) || stepFor(skill.cp) === null) fail('DRAFT_SKILL', '기술명·기준 능력·난이도·CP를 확인한다')
    return { name: skill.name.trim(), attr: skill.attr, difficulty: skill.difficulty, cp: skill.cp }
  })
  return { fields: Object.fromEntries(['name', 'affiliation', 'background', 'livelihood', 'backstory'].map((key) => [key, fields[key].trim()])), attributes: Object.fromEntries(attributes.map((key) => [key, attrs[key]])), skills }
}

export function calculateSheet(input) {
  const parsed = parseFields(input)
  const record = calculateDraft({
    attributes: Object.fromEntries(attributes.map((key) => [key, { value: parsed.attributes[key], cp: (parsed.attributes[key] - 10) * ATTR_COST[key], evidence: [] }])),
    traits: [],
    skills: parsed.skills.map((skill) => ({ name: skill.name, attr: skill.attr, diff: skill.difficulty, tier: null, cp: skill.cp, evidence: [] })),
  }, { directSkillCp: true })
  return { secondary: record.secondary, skills: record.skills.map(({ name, attr, diff, cp, level }) => ({ name, attr, difficulty: diff, cp, level })), cp: record.cp, band: record.band }
}

async function baseRecord(personId) {
  if (!personId) return null
  if (!/^K\d{3,4}$/u.test(personId)) fail('PERSON_ID', '발급된 K ID가 필요하다')
  const source = await readFile(join(ROOT, 'lore/name-pools/gurps-cast.json'), 'utf8')
  const person = JSON.parse(source).people.find((entry) => entry.id === personId)
  if (!person) fail('PERSON_ID', '원장에 없는 K ID다')
  return { personId, sha256: hash(source), name: person.name, attributes: Object.fromEntries(attributes.map((key) => [key, person.attributes[key].value])), skills: person.skills.map((skill) => ({ name: skill.name, attr: skill.attr, difficulty: skill.diff, cp: skill.cp })) }
}

export function createDraftStore({ root = defaultRoot } = {}) {
  async function read(id) { return JSON.parse(await readFile(fileFor(root, id), 'utf8')) }
  return {
    async choices() {
      const values = JSON.parse(await readFile(join(ROOT, 'lore/name-pools/values-cast.json'), 'utf8'))
      const affiliations = [...new Set(values.people.map((person) => person.state_name))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko'))
      const livelihoods = new Set()
      for (const file of await readdir(detailRoot)) {
        if (!/^person-\d{4}\.json$/u.test(file)) continue
        const person = JSON.parse(await readFile(join(detailRoot, file), 'utf8'))
        if (person.occupation) livelihoods.add(person.occupation)
      }
      return { affiliations, backgrounds: ['역 구내 근무', '생활권 호송', '기록 보관', '설비 정비'], livelihoods: [...livelihoods].sort((a, b) => a.localeCompare(b, 'ko')) }
    },
    async create(input = {}) {
      const base = await baseRecord(input.personId)
      const parsed = parseFields({ fields: { name: base?.name ?? '', affiliation: '', background: '', livelihood: '', backstory: '', ...input.fields }, attributes: input.attributes ?? base?.attributes, skills: input.skills ?? base?.skills })
      const draft = { schema: 'seoul-character-draft.v1', id: randomUUID(), revision: 1, base: base && { personId: base.personId, sha256: base.sha256 }, ...parsed, provenance: input.provenance ?? {} }
      await mkdir(root, { recursive: true })
      await writeFile(fileFor(root, draft.id), `${JSON.stringify(draft, null, 2)}\n`, { flag: 'wx' })
      return draft
    },
    async get(id) { return read(id) },
    async list() {
      try { return (await readdir(root)).filter((name) => /^[0-9a-f-]{36}\.json$/u.test(name)).map((name) => name.slice(0, -5)) }
      catch (error) { if (error.code === 'ENOENT') return []; throw error }
    },
    async edit(id, revision, patch) {
      const draft = await read(id)
      if (draft.revision !== revision) fail('DRAFT_CONFLICT', '초안 버전이 바뀌었다')
      const parsed = parseFields({ fields: { ...draft.fields, ...patch.fields }, attributes: { ...draft.attributes, ...patch.attributes }, skills: patch.skills ?? draft.skills })
      const next = { ...draft, ...parsed, revision: revision + 1, provenance: { ...draft.provenance, ...patch.provenance } }
      await writeFile(fileFor(root, id), `${JSON.stringify(next, null, 2)}\n`)
      return next
    },
    async validate(id) {
      const draft = await read(id)
      const conflicts = []
      if (draft.base) { const current = await baseRecord(draft.base.personId); if (current.sha256 !== draft.base.sha256) conflicts.push('원본 겁스 원장 해시가 바뀌었다') }
      return { valid: conflicts.length === 0, conflicts, calculation: calculateSheet(draft), candidate: true }
    },
    async export(id) { const draft = await read(id); return { draft, validation: await this.validate(id) } },
    example(input = {}) {
      return { fields: { name: '', affiliation: input.affiliation ?? '무소속', background: '역 구내 근무', livelihood: '전령', backstory: '역 사이 통행을 맡는다.' }, provenance: { background: { kind: 'ai-example' }, livelihood: { kind: 'ai-example' }, backstory: { kind: 'ai-example' } }, candidate: true }
    },
  }
}
