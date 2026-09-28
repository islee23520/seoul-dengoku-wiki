import { execFileSync } from 'node:child_process'
import { createDraftStore } from './drafts.mjs'

const repo = 'islee23520/seoul-dengoku-wiki'
const fields = ['name', 'affiliation', 'background', 'livelihood', 'backstory']
const labels = { name: '이름', affiliation: '소속', background: '성장·생활 배경', livelihood: '생업', backstory: '개막 전 사건' }
export const issueBody = (draft) => [
  '## 목적', `${draft.base ? '기존 인물 수정' : '새 인물 등록'} 요청: ${draft.fields.name}`, '',
  '## 정본 대조', draft.base ? `원본 K ID: ${draft.base.personId}, SHA-256: ${draft.base.sha256}` : '새 인물 후보. K ID는 발급 전이다.', '',
  '## 변경 제안', ...fields.map((key) => `- ${labels[key]}: ${draft.fields[key] || '(비어 있음)'} · ${draft.provenance?.[key]?.kind ?? 'user'}`), '',
  '## 검증과 승인', '이 요청은 초안이다. 정본 변경·K ID 발급·승인각 갱신은 별도 PR과 소유자 승인을 따른다.',
].join('\n')

export async function submitIssue(store, id, { realPerson, consentRecorded }, gh = execFileSync) {
  const draft = await store.get(id)
  const validation = await store.validate(id)
  if (!validation.valid) throw Object.assign(new Error(`원본 충돌: ${validation.conflicts.join(', ')}`), { code: 'DRAFT_CONFLICT' })
  if (!draft.fields.name || !draft.fields.affiliation) throw Object.assign(new Error('이름과 소속이 필요하다'), { code: 'DRAFT_FIELD' })
  if (realPerson !== true && realPerson !== false) throw Object.assign(new Error('실존 인물 여부를 명시한다'), { code: 'PERSON_CLASSIFICATION' })
  if (realPerson && !consentRecorded) throw Object.assign(new Error('실존 인물의 동의 기록이 필요하다'), { code: 'PERSON_CONSENT' })
  const title = `[인물] ${draft.fields.name} ${draft.base ? '수정' : '등록'} 요청`
  const url = gh('gh', ['issue', 'create', '-R', repo, '--title', title, '--body', issueBody(draft)], { encoding: 'utf8' }).trim()
  return { url, id, title }
}

export const defaultStore = () => createDraftStore({ root: process.env.SEOUL_SHEET_DRAFT_DIR })
