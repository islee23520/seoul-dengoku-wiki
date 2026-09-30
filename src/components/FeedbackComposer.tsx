import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FeedbackApiError, feedbackReasons, submitFeedback, type FeedbackReason } from '../feedbackApi'
import { captureFeedbackAnchor, type FeedbackAnchor, type FeedbackDocument } from '../feedbackSelection'

type Draft = { anchor: FeedbackAnchor; reason: FeedbackReason; body: string; alternative: string; idempotencyKey: string; reconfirmationRequired: boolean; editVersion: number; authorityVersion: 'document-view.v1' | 'historical' }
const draftKey = (route: string) => `wiki-feedback-draft.v1:${route}`
const quote = (anchor: FeedbackAnchor) => anchor.selections.map((part) => part.exactQuote).join('\n')
const newKey = () => crypto.randomUUID()
const isString = (value: unknown): value is string => typeof value === 'string'
const validAnchor = (anchor: unknown, route: string): anchor is FeedbackAnchor => {
  if (!anchor || typeof anchor !== 'object') return false
  const value = anchor as Partial<FeedbackAnchor>
  return value.schemaVersion === 'feedback-anchor.v1' && value.route === route && isString(value.documentId) && /^[a-f0-9]{64}$/u.test(value.sourceRevision ?? '') && (value.locale === 'ko' || value.locale === 'en') && Array.isArray(value.selections) && value.selections.length > 0 && value.selections.every((part) => part && isString(part.blockAnchor) && isString(part.blockKind) && isString(part.leafId) && isString(part.exactQuote) && part.exactQuote.length > 0 && isString(part.prefix) && isString(part.suffix) && part.range?.unit === 'unicode-code-point' && Number.isInteger(part.range.start) && Number.isInteger(part.range.end) && part.range.end > part.range.start && Array.isArray(part.sourceSpans) && part.sourceSpans.length > 0 && part.sourceSpans.every((span) => isString(span.path) && span.unit === 'unicode-code-point' && Number.isInteger(span.start) && Number.isInteger(span.end) && span.end > span.start))
}
const readDraft = (route: string): Draft | null => {
  const key = draftKey(route)
  const saved = localStorage.getItem(key)
  if (!saved) return null
  try {
    const value = JSON.parse(saved) as Partial<Draft>
    if (!validAnchor(value.anchor, route) || typeof value.body !== 'string' || typeof value.alternative !== 'string' || !feedbackReasons.includes(value.reason as FeedbackReason)) throw new Error('invalid draft')
    return { ...value, authorityVersion: value.authorityVersion === 'document-view.v1' ? 'document-view.v1' : 'historical', idempotencyKey: typeof value.idempotencyKey === 'string' && value.idempotencyKey.length >= 8 ? value.idempotencyKey : newKey(), reconfirmationRequired: value.reconfirmationRequired === true || value.authorityVersion !== 'document-view.v1', editVersion: Number.isInteger(value.editVersion) ? value.editVersion as number : 0 } as Draft
  } catch { localStorage.removeItem(key); return null }
}

export default function FeedbackComposer({ rootRef, documentInfo, locale }: { rootRef: React.RefObject<HTMLElement>; documentInfo: FeedbackDocument; locale: 'ko' | 'en' }) {
  const { pathname } = useLocation()
  const [owned, setOwned] = useState(() => ({ route: pathname, draft: readDraft(pathname) }))
  const draft = owned.route === pathname ? owned.draft : null
  const [state, setState] = useState<'draft' | 'pending' | 'error' | 'success' | 'reconfirm'>('draft')
  const [message, setMessage] = useState('')
  const actionRef = useRef<HTMLButtonElement>(null)
  const requestRef = useRef<{ id: symbol; controller: AbortController; key: string } | null>(null)

  useEffect(() => {
    requestRef.current?.controller.abort()
    requestRef.current = null
    const loaded = readDraft(pathname)
    const restored = loaded && (loaded.authorityVersion !== 'document-view.v1' || loaded.anchor.documentId !== documentInfo.documentId || loaded.anchor.sourceRevision !== documentInfo.sourceRevision || loaded.anchor.locale !== locale) ? { ...loaded, reconfirmationRequired: true, authorityVersion: 'historical' as const } : loaded
    setOwned({ route: pathname, draft: restored })
    setState(restored?.reconfirmationRequired ? 'reconfirm' : 'draft')
    setMessage(restored?.reconfirmationRequired ? '원문이 변경되었습니다. 현재 문장을 다시 선택해 확인해 주세요.' : '')
  }, [pathname, documentInfo.sourceRevision])

  useEffect(() => {
    if (owned.route !== pathname) return
    if (owned.draft) localStorage.setItem(draftKey(pathname), JSON.stringify(owned.draft))
    else localStorage.removeItem(draftKey(pathname))
  }, [owned, pathname])

  const replaceDraft = (next: Draft | null) => setOwned({ route: pathname, draft: next })
  const capture = () => {
    if (requestRef.current) { setState('pending'); setMessage('현재 제보 제출이 끝날 때까지 기다려 주세요.'); return }
    const root = rootRef.current
    if (!root) return
    const anchor = captureFeedbackAnchor(root, documentInfo, pathname, locale)
    if (!anchor) { setState('error'); setMessage('본문에서 제보할 문장을 먼저 선택해 주세요.'); return }
    replaceDraft({ anchor, reason: draft?.reason ?? feedbackReasons[0], body: draft?.body ?? '', alternative: draft?.alternative ?? '', idempotencyKey: newKey(), reconfirmationRequired: false, authorityVersion: 'document-view.v1', editVersion: (draft?.editVersion ?? 0) + 1 })
    setState('draft'); setMessage('선택한 문장을 브라우저에 임시 저장했습니다.')
  }

  const cancel = () => {
    requestRef.current?.controller.abort()
    requestRef.current = null
    replaceDraft(null); setState('draft'); setMessage('임시 제보를 지웠습니다.'); actionRef.current?.focus()
  }
  const submit = async () => {
    if (!draft?.body.trim()) { setState('error'); setMessage('제보 내용을 입력해 주세요.'); return }
    if (requestRef.current) return
    const submitted = { ...draft }
    const request = { id: Symbol('feedback-request'), controller: new AbortController(), key: submitted.idempotencyKey }
    requestRef.current = request
    setState('pending'); setMessage('제출 중입니다.')
    try {
      await submitFeedback({ anchor: submitted.anchor, reason: submitted.reason, body: submitted.body.trim(), ...(submitted.alternative.trim() ? { alternative: submitted.alternative.trim() } : {}) }, { idempotencyKey: submitted.idempotencyKey, signal: request.controller.signal })
      if (requestRef.current?.id !== request.id) return
      requestRef.current = null
      setOwned((current) => current.route === pathname && current.draft?.idempotencyKey === submitted.idempotencyKey && current.draft.editVersion === submitted.editVersion ? { route: pathname, draft: null } : current)
      setState('success'); setMessage('제보가 접수되었습니다.')
    } catch (error) {
      if (requestRef.current?.id !== request.id) return
      requestRef.current = null
      if (error instanceof DOMException && error.name === 'AbortError') return
      if (error instanceof FeedbackApiError && error.reconfirmationRequired) {
        setOwned((current) => current.route === pathname && current.draft?.idempotencyKey === submitted.idempotencyKey ? { route: pathname, draft: { ...current.draft, reconfirmationRequired: true } } : current)
        setState('reconfirm'); setMessage('원문이 변경되었습니다. 현재 문장을 다시 선택해 확인해 주세요.')
      } else { setState('error'); setMessage(error instanceof Error ? error.message : '제보를 제출하지 못했습니다.') }
    }
  }

  const update = (next: Partial<Draft>) => { if (draft && state !== 'pending') replaceDraft({ ...draft, ...next, editVersion: draft.editVersion + 1 }) }
  return <aside className="feedback-composer" aria-label="문장 제보">
    <div className="feedback-heading"><strong>문장 제보</strong><button ref={actionRef} type="button" disabled={state === 'pending'} onClick={capture}>선택 문장 제보</button></div>
    <p className="feedback-help">공개 본문에는 제보 표시나 밑줄이 생기지 않습니다. 로그인 전에는 이 브라우저에만 임시 저장됩니다.</p>
    {draft && <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <blockquote className="feedback-preview">{quote(draft.anchor)}</blockquote>
      <label>이유<select disabled={state === 'pending'} value={draft.reason} onChange={(event) => update({ reason: event.target.value as FeedbackReason })}>{feedbackReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
      <label>제보 내용<textarea disabled={state === 'pending'} required value={draft.body} onChange={(event) => update({ body: event.target.value })} /></label>
      <label>대안 문장 (선택)<textarea disabled={state === 'pending'} value={draft.alternative} onChange={(event) => update({ alternative: event.target.value })} /></label>
      <div className="feedback-actions"><button type="button" onClick={cancel}>취소</button><button type="submit" disabled={state === 'pending' || draft.reconfirmationRequired}>{state === 'pending' ? '제출 중…' : draft.reconfirmationRequired ? '문장을 다시 선택하세요' : '로그인하고 제출'}</button></div>
    </form>}
    {message && <p className={`feedback-status feedback-${state}`} role="status">{message}</p>}
  </aside>
}
