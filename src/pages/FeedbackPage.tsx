import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeedbackObjections } from '../components/FeedbackComposer'
import { FeedbackApiError, ownFeedbackDetail, ownFeedbackList, redactOwnFeedback, verifiedFeedbackIdentity, type FeedbackDetail, type FeedbackIdentity, type OwnFeedback } from '../feedbackApi'

type PageState =
  | { readonly kind: 'loading' | 'login'; }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly identity: FeedbackIdentity; readonly submissions: readonly OwnFeedback[] }
type DetailState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading'; readonly id: number }
  | { readonly kind: 'error'; readonly id: number; readonly message: string }
  | { readonly kind: 'ready'; readonly id: number; readonly value: FeedbackDetail }

const statusLabel: Record<OwnFeedback['status'], string> = {
  received: '접수', reviewing: '검토 중', applied: '반영', rejected: '반려', 'needs-information': '추가 정보 요청', redacted: '내용 삭제',
}
const errorMessage = (error: unknown, fallback: string) => error instanceof FeedbackApiError
  ? error.status === 403 ? '이 제보에 접근할 권한이 없습니다.' : error.status === 503 ? '제보 서비스를 사용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.' : error.message
  : fallback

export default function FeedbackPage() {
  const [page, setPage] = useState<PageState>({ kind: 'loading' })
  const [detail, setDetail] = useState<DetailState>({ kind: 'idle' })
  const [selected, setSelected] = useState<number | null>(null)
  const [revision, setRevision] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const action = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setPage({ kind: 'loading' })
    setDetail({ kind: 'idle' })
    void (async () => {
      try {
        const identity = await verifiedFeedbackIdentity(fetch, controller.signal)
        const submissions = await ownFeedbackList(fetch, controller.signal)
        if (!controller.signal.aborted) setPage({ kind: 'ready', identity, submissions })
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof FeedbackApiError && error.status === 401) setPage({ kind: 'login' })
        else setPage({ kind: 'error', message: errorMessage(error, '제보 내역을 불러오지 못했습니다.') })
      }
    })()
    return () => controller.abort()
  }, [revision])

  useEffect(() => {
    if (page.kind !== 'ready' || selected === null || !page.submissions.some((row) => row.id === selected)) return
    const controller = new AbortController()
    setDetail({ kind: 'loading', id: selected })
    setConfirm(false)
    setMessage('')
    void ownFeedbackDetail(selected, fetch, controller.signal).then((value) => {
      if (!controller.signal.aborted) setDetail({ kind: 'ready', id: selected, value })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof FeedbackApiError && error.status === 401) { setPage({ kind: 'login' }); setDetail({ kind: 'idle' }); return }
      setDetail({ kind: 'error', id: selected, message: errorMessage(error, '제보 상세를 불러오지 못했습니다.') })
    })
    return () => controller.abort()
  }, [page.kind, selected, revision])

  useEffect(() => () => { const controller = action.current; action.current = null; controller?.abort() }, [])

  const reload = () => {
    if (pending) return
    setPage({ kind: 'loading' })
    setDetail({ kind: 'idle' })
    setConfirm(false)
    setMessage('')
    setRevision((value) => value + 1)
  }

  const redact = async (id: number) => {
    if (pending || page.kind !== 'ready' || detail.kind !== 'ready' || detail.id !== id || detail.value.status === 'redacted') return
    const controller = new AbortController()
    action.current = controller
    setPending(true)
    setMessage('')
    try {
      const value = await redactOwnFeedback(id, fetch, controller.signal)
      if (controller.signal.aborted) return
      setDetail({ kind: 'ready', id, value })
      setPage((current) => current.kind === 'ready' ? { ...current, submissions: current.submissions.map((row) => row.id === id ? { ...row, status: value.status } : row) } : current)
      setConfirm(false)
      setMessage('제보 내용이 삭제되었습니다.')
    } catch (error) {
      if (controller.signal.aborted) return
      if (error instanceof FeedbackApiError && error.status === 401) { setPage({ kind: 'login' }); setDetail({ kind: 'idle' }) }
      else setMessage(errorMessage(error, '제보 내용을 지우지 못했습니다.'))
    } finally {
      if (action.current === controller) { action.current = null; setPending(false) }
    }
  }

  const active = page.kind === 'ready' && selected !== null && page.submissions.some((row) => row.id === selected)
    && detail.kind !== 'idle' && detail.id === selected ? detail : null

  return <article className="wiki-article" data-wiki-shell="react-official">
    <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/">대문</Link><span aria-hidden="true">›</span><strong>내 제보</strong></nav>
    <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 제보</p><h1>내 제보</h1></div></header>
    <div className="wiki-prose">
      {page.kind === 'loading' && <p role="status">제보 내역을 불러오고 있습니다.</p>}
      {page.kind === 'login' && <section><h2>GitHub 로그인이 필요합니다</h2><p>로그인하면 직접 제출한 제보만 볼 수 있습니다.</p><p><a href="/api/feedback/auth/login">GitHub로 로그인</a></p></section>}
      {page.kind === 'error' && <p role="alert">{page.message}</p>}
      {page.kind === 'ready' && <>
        <p>GitHub 계정 <strong>{page.identity.login}</strong>으로 로그인했습니다. 내 제보 {page.submissions.length}건</p>
        {page.submissions.length === 0 ? <p>제출한 제보가 없습니다.</p> : <section>
          <h2>제출 내역</h2>
          <div className="wiki-table-wrap"><table className="min-w-max"><thead><tr><th scope="col">번호</th><th scope="col">문서</th><th scope="col">접수일</th><th scope="col">상태</th><th scope="col">상세</th></tr></thead><tbody>
            {page.submissions.map((row) => <tr key={row.id}><td>{row.id}</td><td>{row.documentId}</td><td>{row.createdAt}</td><td>{statusLabel[row.status]}</td><td><button type="button" disabled={pending} aria-pressed={selected === row.id} onClick={() => { setSelected(row.id); setConfirm(false); setMessage('') }}>보기</button></td></tr>)}
          </tbody></table></div>
        </section>}
        {active && <section aria-label={`제보 ${selected} 상세`}>
          <h2>제보 {selected} 상세</h2>
          {active.kind === 'loading' && <p role="status">제보 상세를 불러오고 있습니다.</p>}
          {active.kind === 'error' && <p role="alert">{active.message}</p>}
          {active.kind === 'ready' && <>
            <dl className="state-detail-grid">
              <div><dt>문서 ID</dt><dd>{active.value.documentId}</dd></div><div><dt>상태</dt><dd>{statusLabel[active.value.status]}</dd></div>
              <div><dt>접수일</dt><dd>{active.value.createdAt}</dd></div><div><dt>최근 변경</dt><dd>{active.value.updatedAt}</dd></div>
            </dl>
            {active.value.status === 'redacted' ? <p>이 제보의 원문과 내용이 삭제되었습니다.</p> : <>
              <h3>선택한 문장</h3><blockquote className="feedback-preview">{active.value.anchor?.selections.map((part) => part.exactQuote).join('\n')}</blockquote>
              <h3>제보 내용</h3><p>{active.value.body}</p><p>이유: {active.value.reason}</p>
              {active.value.alternative && <p>대안 문장: {active.value.alternative}</p>}
              {!confirm ? <div className="territory-toolbar"><button type="button" disabled={pending} onClick={() => setConfirm(true)}>내 제보 내용 삭제</button></div> : <div className="territory-toolbar" role="group" aria-label="제보 내용 삭제 확인"><p>선택한 제보의 원문과 내용을 삭제합니다. 삭제한 내용은 복구할 수 없습니다.</p><button type="button" disabled={pending} onClick={() => setConfirm(false)}>취소</button><button type="button" disabled={pending} onClick={() => void redact(active.id)}>{pending ? '삭제 중…' : '내용 삭제 확인'}</button></div>}
            </>}
            <h3>처리 이력</h3><ol>{active.value.events.map((event, index) => <li key={`${event.at}:${index}`}>{event.at} · {statusLabel[event.status]}{event.reason ? ` · ${event.reason}` : ''}</li>)}</ol>
            <FeedbackObjections key={`${active.id}:${revision}:${active.value.status}`} targetId={active.id} loadHistory readOnly={active.value.status === 'redacted'} />
          </>}
          {message && <p role={message === '제보 내용이 삭제되었습니다.' ? 'status' : 'alert'}>{message}</p>}
        </section>}
      </>}
      <div className="territory-toolbar"><button type="button" disabled={pending || page.kind === 'loading'} onClick={reload}>새로고침</button></div>
    </div>
  </article>
}
