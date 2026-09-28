import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import './CharacterDraftPage.css'

type Field = 'name' | 'affiliation' | 'background' | 'livelihood' | 'backstory'
type DraftFields = Readonly<Record<Field, string>>
type Provenance = Readonly<Partial<Record<Field, Readonly<{ kind: 'user' | 'ai-example' | 'canon'; source?: string }>>>>
type Draft = Readonly<{
  schema: 'seoul-character-draft.v1'
  revision: number
  base: Readonly<{ personId: string; sha256: string }> | null
  fields: DraftFields
  provenance: Provenance
}>

const emptyFields: DraftFields = { name: '', affiliation: '', background: '', livelihood: '', backstory: '' }
const fieldLabels: Readonly<Record<Field, string>> = { name: '이름', affiliation: '소속', background: '성장·생활 배경', livelihood: '생업', backstory: '개막 전 사건' }
const fieldOrder: readonly Field[] = ['name', 'affiliation', 'background', 'livelihood', 'backstory']
const stateOptions = [...new Set(peopleCatalog.map((person) => person.stateName || '무소속'))].sort((a, b) => a.localeCompare(b, 'ko'))
const livelihoodOptions = [...new Set(peopleCatalog.map((person) => person.occupation).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'))
const backgroundOptions = ['역 구내 근무', '생활권 호송', '기록 보관', '설비 정비'] as const

function currentDraft(fields: DraftFields, provenance: Provenance, base: Draft['base'], revision: number): Draft {
  return { schema: 'seoul-character-draft.v1', revision, base, fields, provenance }
}

function readDraft(input: unknown): Draft {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('초안 JSON은 객체여야 합니다.')
  const entry = Object.entries(input)
  const value = (key: string) => entry.find(([name]) => name === key)?.[1]
  if (value('schema') !== 'seoul-character-draft.v1' || !Number.isInteger(value('revision')) || Number(value('revision')) < 1) throw new Error('지원하지 않는 초안 형식입니다.')
  const fields = value('fields')
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('시트 필드가 없습니다.')
  const values = Object.fromEntries(Object.entries(fields))
  for (const key of fieldOrder) if (typeof values[key] !== 'string') throw new Error(`${fieldLabels[key]} 필드가 없습니다.`)
  const parsedFields: DraftFields = {
    name: String(values.name), affiliation: String(values.affiliation), background: String(values.background), livelihood: String(values.livelihood), backstory: String(values.backstory),
  }
  const base = value('base')
  if (base !== null && base !== undefined && (typeof base !== 'object' || Array.isArray(base) || typeof Object.entries(base).find(([key]) => key === 'personId')?.[1] !== 'string')) throw new Error('원본 인물 참조가 올바르지 않습니다.')
  const ref = base && typeof base === 'object' ? Object.fromEntries(Object.entries(base)) : null
  const rawProvenance = value('provenance')
  if (rawProvenance !== undefined && (!rawProvenance || typeof rawProvenance !== 'object' || Array.isArray(rawProvenance))) throw new Error('근거 형식이 올바르지 않습니다.')
  const provenance: Partial<Record<Field, { kind: 'user' | 'ai-example' | 'canon'; source?: string }>> = {}
  const entries = rawProvenance ? Object.entries(rawProvenance) : []
  for (const [key, raw] of entries) {
    if (!fieldOrder.includes(key as Field) || !raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('근거 필드가 올바르지 않습니다.')
    const item = Object.fromEntries(Object.entries(raw))
    if (!['user', 'ai-example', 'canon'].includes(String(item.kind)) || (item.source !== undefined && typeof item.source !== 'string')) throw new Error('근거 종류가 올바르지 않습니다.')
    provenance[key as Field] = { kind: item.kind as 'user' | 'ai-example' | 'canon', ...(item.source ? { source: String(item.source) } : {}) }
  }
  return currentDraft(parsedFields, provenance, ref ? { personId: String(ref.personId), sha256: String(ref.sha256 ?? '') } : null, Number(value('revision')))
}

export default function CharacterDraftPage() {
  const [selected, setSelected] = useState('')
  const [fields, setFields] = useState<DraftFields>(emptyFields)
  const [provenance, setProvenance] = useState<Provenance>({})
  const [base, setBase] = useState<Draft['base']>(null)
  const [revision, setRevision] = useState(1)
  const [message, setMessage] = useState('')
  const [candidate, setCandidate] = useState<Partial<DraftFields> | null>(null)
  const [query, setQuery] = useState('')
  const upload = useRef<HTMLInputElement>(null)
  const people = useMemo(() => peopleCatalog.filter((person) => `${person.name} ${person.occupation} ${person.stateName}`.includes(query.trim())).slice(0, 100), [query])
  const original = peopleCatalog.find((person) => person.id === selected)

  const change = (key: Field, value: string, kind: 'user' | 'ai-example' | 'canon' = 'user') => {
    setFields((previous) => ({ ...previous, [key]: value }))
    setProvenance((previous) => ({ ...previous, [key]: { kind } }))
    setRevision((previous) => previous + 1)
    setMessage('검토 초안입니다. 정본은 바뀌지 않았습니다.')
  }
  const choose = (id: string) => {
    const person = peopleCatalog.find((entry) => entry.id === id)
    if (!person) return
    setSelected(id)
    setFields({ name: person.name, affiliation: person.stateName || '무소속', background: '', livelihood: person.occupation, backstory: '' })
    setProvenance({ name: { kind: 'canon', source: person.detailRoute }, affiliation: { kind: 'canon', source: person.detailRoute }, livelihood: { kind: 'canon', source: person.detailRoute } })
    setBase({ personId: id, sha256: '' })
    setRevision(1)
    setCandidate(null)
    setMessage('원본 인물을 읽어 초안으로 복사했습니다. 빈 칸은 정본에 없는 정보입니다.')
  }
  const newDraft = () => { setSelected(''); setFields(emptyFields); setProvenance({}); setBase(null); setRevision(1); setCandidate(null); setMessage('새 인물 초안입니다. K ID는 승인 전 발급하지 않습니다.') }
  const example = () => {
    setCandidate({ affiliation: fields.affiliation || '무소속', background: '역 구내 근무', livelihood: '전령', backstory: '역 사이의 통행 요청을 전달한다.' })
    setMessage('AI 작성 예시입니다. 각 항목을 검토하고 수락하기 전에는 초안에 적용되지 않습니다.')
  }
  const download = () => {
    if (!fields.name.trim()) { setMessage('내보내기 전에 이름을 입력하세요.'); return }
    const blob = new Blob([`${JSON.stringify(currentDraft(fields, provenance, base, revision), null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `seoul-character-draft-${selected || 'new'}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('검토용 초안을 내보냈습니다. 정본 변경과 K ID 발급은 별도 승인 절차입니다.')
  }
  const issue = () => {
    if (!fields.name.trim()) { setMessage('이슈를 작성하기 전에 이름을 입력하세요.'); return }
    const lines = [
      '## 목적',
      `${selected ? '기존 인물 수정' : '새 인물 등록'} 요청: ${fields.name}`,
      '',
      '## 정본 대조',
      selected ? `원본: ${original?.detailRoute ?? selected} (원본 해시 검증은 로컬 도구에서 수행)` : '새 인물 후보. K ID는 발급 전이다.',
      '',
      '## 변경 제안',
      ...fieldOrder.map((key) => `- ${fieldLabels[key]}: ${fields[key] || '(비어 있음)'} · ${provenance[key]?.kind ?? 'user'}${provenance[key]?.source ? ` · ${provenance[key]?.source}` : ''}`),
      '',
      '## 검증과 승인',
      '이슈의 내용은 초안이며 정본 변경·인물 ID 발급·승인을 뜻하지 않는다. 「초안 내보내기」로 받은 JSON 파일을 이슈에 직접 첨부하고 근거와 한국어/영어 병기를 검토한다.',
    ]
    const params = new URLSearchParams({ title: `[인물] ${fields.name} ${selected ? '수정' : '등록'} 요청`, body: lines.join('\n') })
    window.open(`https://github.com/islee23520/seoul-dengoku-wiki/issues/new?${params}`, '_blank', 'noopener,noreferrer')
    setMessage('GitHub 이슈 작성 화면을 열었습니다. 내용을 검토한 뒤 직접 등록하세요.')
  }
  const importFile = async (file: File) => {
    try {
      const draft = readDraft(JSON.parse(await file.text()))
      const person = peopleCatalog.find((entry) => entry.id === draft.base?.personId)
      if (draft.base && (!person || (draft.fields.name && draft.fields.name !== person.name))) { setMessage('원본 인물과 초안의 신원이 충돌합니다. 가져오기를 중단했습니다.'); return }
      setSelected(draft.base?.personId ?? '')
      setFields(draft.fields)
      setProvenance(draft.provenance)
      setBase(draft.base)
      setRevision(draft.revision)
      setMessage(draft.base?.sha256 ? '초안을 불러왔습니다. 원본 해시는 로컬 동반 도구에서 다시 검증하세요.' : '초안을 불러왔습니다. 이 파일은 정본 승인 증거가 아닙니다.')
    } catch (error) {
      if (error instanceof Error) setMessage(error.message)
      else throw error
    }
  }

  return (
    <article className="wiki-article sheet-editor" data-wiki-shell="react-official">
      <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 인물 도구</p><h1>인물 시트 초안</h1><p>정본의 인물 정보를 읽고 새 설정을 검토합니다. 저장되는 파일은 승인 전 초안입니다.</p></div><span className="wiki-canon-badge">초안</span></header>
      <div className="sheet-editor-layout">
        <aside className="sheet-editor-list" aria-label="기존 인물 선택"><h2>기존 인물</h2><label>인물 검색<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름·생업·나라" /></label><button type="button" onClick={newDraft}>새 인물 초안</button><ul>{people.map((person) => <li key={person.id}><button type="button" aria-pressed={selected === person.id} onClick={() => choose(person.id)}>{person.name}<small>{person.stateName || '무소속'} · {person.occupation}</small></button></li>)}</ul><p className="wiki-domain-label">최대 100명 표시 · 검색으로 좁혀 주세요.</p></aside>
        <div className="sheet-editor-work"><div className="sheet-editor-toolbar"><span>{selected ? `원본 ${selected}` : '새 인물'} · 수정 {revision}</span>{original && <Link to={original.detailRoute}>원본 카드 보기</Link>}<button type="button" onClick={example}>AI 예시 보기</button><button type="button" onClick={() => upload.current?.click()}>JSON 불러오기</button><button type="button" onClick={download}>초안 내보내기</button><button type="button" onClick={issue}>검토 이슈 작성</button><input ref={upload} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = '' }} /></div>
          <p role="status" aria-live="polite" className="sheet-editor-status">{message || '필드를 선택해 입력하거나 기존 인물을 복사하세요.'}</p>
          <div className="sheet-editor-fields">
            {fieldOrder.map((key) => <section key={key}><label htmlFor={`sheet-${key}`}>{fieldLabels[key]}</label>{key === 'affiliation' || key === 'livelihood' ? <><input id={`sheet-${key}`} value={fields[key]} onChange={(event) => change(key, event.target.value)} list={`sheet-${key}-options`} /><datalist id={`sheet-${key}-options`}>{(key === 'affiliation' ? stateOptions : livelihoodOptions).map((value) => <option value={value} key={value} />)}</datalist></> : key === 'name' ? <input id={`sheet-${key}`} value={fields[key]} onChange={(event) => change(key, event.target.value)} /> : <textarea id={`sheet-${key}`} rows={key === 'backstory' ? 5 : 3} value={fields[key]} onChange={(event) => change(key, event.target.value)} /> }<small>{provenance[key]?.kind === 'canon' ? '정본에서 복사됨' : provenance[key]?.kind === 'ai-example' ? 'AI 예시를 수락함 · 사실 검토 필요' : '사용자 입력'}{provenance[key]?.source && ` · ${provenance[key]?.source}`}</small></section>)}
            <section><label htmlFor="sheet-background-choice">배경 선택지</label><select id="sheet-background-choice" value="" onChange={(event) => change('background', event.target.value)}><option value="">선택하지 않음</option>{backgroundOptions.map((value) => <option key={value}>{value}</option>)}</select></section>
          </div>
          {candidate && <section className="sheet-editor-candidates"><h2>AI 예시 후보</h2><p>이 예시는 정본 사실이 아닙니다. 필요한 칸만 수락하세요.</p>{Object.entries(candidate).map(([key, value]) => <div key={key}><strong>{fieldLabels[key as Field]}</strong><p>{value}</p><button type="button" onClick={() => { change(key as Field, value, 'ai-example'); setCandidate((old) => { const next = { ...old }; delete next[key as Field]; return Object.keys(next).length ? next : null }) }}>이 칸 수락</button></div>)}<button type="button" onClick={() => setCandidate(null)}>예시 거절</button></section>}
          {original && <section className="sheet-editor-diff"><h2>원본 대비 변경</h2><dl>{(['name', 'affiliation', 'livelihood'] as const).map((key) => <div key={key}><dt>{fieldLabels[key]}</dt><dd>{key === 'name' ? original.name : key === 'affiliation' ? original.stateName || '무소속' : original.occupation} → {fields[key]}</dd></div>)}</dl><p>배경·개막 전 사건의 원문 대조와 승인 해시는 로컬 동반 도구에서 확인합니다.</p></section>}
        </div>
      </div>
    </article>
  )
}
