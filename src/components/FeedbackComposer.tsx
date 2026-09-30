import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { feedbackReasons, submitFeedback, type FeedbackReason } from '../feedbackApi'
import { captureFeedbackAnchor, type FeedbackAnchor, type FeedbackDocument } from '../feedbackSelection'

type Draft = { anchor: FeedbackAnchor; reason: FeedbackReason; body: string; alternative: string }
const draftKey = (route: string) => `wiki-feedback-draft.v1:${route}`
const quote = (anchor: FeedbackAnchor) => anchor.selections.map((part) => part.exactQuote).join('\n')

export default function FeedbackComposer({ rootRef, documentInfo, locale }: { rootRef: React.RefObject<HTMLElement>; documentInfo: FeedbackDocument; locale: 'ko' | 'en' }) {
  const { pathname } = useLocation()
  const [draft, setDraft] = useState<Draft | null>(() => { const saved = localStorage.getItem(draftKey(pathname)); return saved ? JSON.parse(saved) as Draft : null })
  const routeRef = useRef(pathname)
  const [state, setState] = useState<'draft' | 'pending' | 'error' | 'success'>('draft')
  const [message, setMessage] = useState('')
  const actionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (routeRef.current === pathname) return
    routeRef.current = pathname
    const saved = localStorage.getItem(draftKey(pathname))
    setDraft(saved ? JSON.parse(saved) as Draft : null)
    setState('draft')
    setMessage('')
  }, [pathname, documentInfo.sourceRevision])

  useEffect(() => {
    if (draft) localStorage.setItem(draftKey(pathname), JSON.stringify(draft))
    else localStorage.removeItem(draftKey(pathname))
  }, [draft, pathname])

  const capture = () => {
    const root = rootRef.current
    if (!root) return
    const anchor = captureFeedbackAnchor(root, documentInfo, pathname, locale)
    if (!anchor) {
      setState('error')
      setMessage('본문에서 제보할 문장을 먼저 선택해 주세요.')
      return
    }
    setDraft((current) => ({ anchor, reason: current?.reason ?? feedbackReasons[0], body: current?.body ?? '', alternative: current?.alternative ?? '' }))
    setState('draft')
    setMessage('선택한 문장을 브라우저에 임시 저장했습니다.')
  }

  const cancel = () => { setDraft(null); setState('draft'); setMessage('임시 제보를 지웠습니다.'); actionRef.current?.focus() }
  const submit = async () => {
    if (!draft?.body.trim()) { setState('error'); setMessage('제보 내용을 입력해 주세요.'); return }
    setState('pending'); setMessage('제출 중입니다.')
    try {
      await submitFeedback({ anchor: draft.anchor, reason: draft.reason, body: draft.body.trim(), ...(draft.alternative.trim() ? { alternative: draft.alternative.trim() } : {}) })
      setState('success'); setMessage('제보가 접수되었습니다.'); setDraft(null)
    } catch (error) {
      setState('error'); setMessage(error instanceof Error ? error.message : '제보를 제출하지 못했습니다.')
    }
  }

  return <aside className="feedback-composer" aria-label="문장 제보">
    <div className="feedback-heading"><strong>문장 제보</strong><button ref={actionRef} type="button" onClick={capture}>선택 문장 제보</button></div>
    <p className="feedback-help">공개 본문에는 제보 표시나 밑줄이 생기지 않습니다. 로그인 전에는 이 브라우저에만 임시 저장됩니다.</p>
    {draft && <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <blockquote className="feedback-preview">{quote(draft.anchor)}</blockquote>
      <label>이유<select value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value as FeedbackReason })}>{feedbackReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
      <label>제보 내용<textarea required value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>
      <label>대안 문장 (선택)<textarea value={draft.alternative} onChange={(event) => setDraft({ ...draft, alternative: event.target.value })} /></label>
      <div className="feedback-actions"><button type="button" onClick={cancel}>취소</button><button type="submit" disabled={state === 'pending'}>{state === 'pending' ? '제출 중…' : '로그인하고 제출'}</button></div>
    </form>}
    {message && <p className={`feedback-status feedback-${state}`} role="status">{message}</p>}
  </aside>
}
