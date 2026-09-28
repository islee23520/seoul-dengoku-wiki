#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { createDraftStore } from './drafts.mjs'
import { ROOT } from '../gurps-cast.mjs'

export async function preparePr(store, id, { worktree = ROOT, publish = false, realPerson = null, consentRecorded = false, git = execFileSync, gh = execFileSync } = {}) {
  const draft = await store.get(id)
  const validation = await store.validate(id)
  if (!validation.valid) throw new Error(`원본 충돌: ${validation.conflicts.join(', ')}`)
  if (!draft.fields.name || !draft.fields.affiliation) throw new Error('이름과 소속이 필요하다')
  if (publish && realPerson === null) throw new Error('실존 인물 여부를 명시한다')
  if (publish && realPerson && !consentRecorded) throw new Error('실존 인물의 동의 기록이 필요하다')
  const gitCall = (...argv) => git('git', ['-C', worktree, ...argv], { encoding: 'utf8' }).trim()
  if (gitCall('status', '--porcelain')) throw new Error('PR을 만들 작업트리가 깨끗해야 한다')
  const branch = `draft/character-sheet-${id.slice(0, 8)}`
  const path = `docs/editorial/character-drafts/${id}.json`
  const proposal = { schema: 'seoul-character-review-proposal.v1', base: draft.base?.personId ?? null, fields: draft.fields, provenance: draft.provenance, sourceHead: gitCall('rev-parse', 'HEAD') }
  const body = JSON.stringify(proposal, null, 2) + '\n'
  const digest = createHash('sha256').update(body).digest('hex')
  const preview = { branch, path, sha256: digest, bytes: Buffer.byteLength(body), person: draft.base?.personId ?? null, name: draft.fields.name, fields: draft.fields, provenance: draft.provenance, localCalculation: validation.calculation, warning: '서울전국 초안 필드가 공개 PR에 게시된다. 겁스 계산은 로컬 미리보기에만 남고 정본·ID·승인각은 바뀌지 않는다.' }
  if (!publish) return preview
  gitCall('switch', '-c', branch)
  const { mkdir, writeFile } = await import('node:fs/promises')
  await mkdir(join(worktree, 'docs/editorial/character-drafts'), { recursive: true })
  await writeFile(join(worktree, path), body, { flag: 'wx' })
  gitCall('add', '--', path)
  gitCall('commit', '-m', `docs(cast): ${draft.fields.name} 인물 시트 검토 초안을 올린다`)
  gitCall('push', '-u', 'origin', branch)
  const url = gh('gh', ['pr', 'create', '-R', 'islee23520/seoul-dengoku-wiki', '--base', 'main', '--head', branch, '--draft', '--title', `[인물] ${draft.fields.name} 시트 검토`, '--body', `검토 초안: \`${path}\`\n원본: ${draft.base?.personId ?? '신규 인물'}\n\n| 필드 | 제안 | 근거 종류 |\n|---|---|---|\n${['name', 'affiliation', 'background', 'livelihood', 'backstory'].map((key) => `| ${key} | ${draft.fields[key].replaceAll('|', '\\|').replaceAll('\n', ' ')} | ${draft.provenance?.[key]?.kind ?? 'user'} |`).join('\n')}\n\n이 PR은 정본 등록과 K ID 발급을 승인하지 않는다. 기존 인물 수정은 카드 JSON 근거와 한국어/영어 병기를 검토한 별도 PR로 반영한다.`], { cwd: worktree, encoding: 'utf8' }).trim()
  return { url, ...preview }
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
const args = process.argv.slice(2)
const id = args[0]
const publish = args.includes('--publish')
const realPerson = args.includes('--real-person') ? true : args.includes('--fictional') ? false : null
const consent = args.includes('--consent-recorded')
const worktreeIndex = args.indexOf('--worktree')
const worktree = worktreeIndex >= 0 ? resolve(args[worktreeIndex + 1]) : ROOT
if (!id || !/^[0-9a-f-]{36}$/u.test(id)) throw new Error('초안 ID가 필요하다')
const output = await preparePr(createDraftStore({ root: process.env.SEOUL_SHEET_DRAFT_DIR }), id, { worktree, publish, realPerson, consentRecorded: consent })
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}
