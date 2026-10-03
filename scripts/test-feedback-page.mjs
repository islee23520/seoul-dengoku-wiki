// @vitest-environment jsdom
import assert from 'node:assert/strict'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { test, vi } from 'vitest'
import FeedbackPage from '../src/pages/FeedbackPage.tsx'
import { FeedbackApiError, ownFeedbackDetail, ownFeedbackList, redactOwnFeedback, verifiedFeedbackIdentity } from '../src/feedbackApi.ts'

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })
const session = { identity: { githubId: '55', login: 'reader' }, csrfToken: 'server-csrf' }
const row = { id: 42, documentId: 'DOC:City', status: 'received', createdAt: '2026-10-03T00:00:00Z' }
const detail = { ...row, blockAnchor: 'paragraph', anchor: { selections: [{ exactQuote: '선택 문장' }] }, body: '바꿔 주세요', reason: '기타', alternative: null, updatedAt: row.createdAt, redactedAt: null, events: [{ actorKind: 'submitter', action: 'submitted', status: 'received', reason: null, at: row.createdAt }] }
const redacted = { ...detail, status: 'redacted', anchor: null, body: null, reason: null, alternative: null, redactedAt: row.createdAt, events: [...detail.events, { actorKind: 'submitter', action: 'redacted', status: 'redacted', reason: null, at: row.createdAt }] }
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }
const click = (host, label) => { const button = [...host.querySelectorAll('button')].find((entry) => entry.textContent === label); assert.ok(button, `missing button: ${label}`); button.dispatchEvent(new MouseEvent('click', { bubbles: true })) }

async function mount(fetcher, check) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(fetcher)
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => { root.render(createElement(MemoryRouter, { initialEntries: ['/feedback'] }, createElement(FeedbackPage))); await Promise.resolve() })
    await check(host, fetchMock, root)
  } finally { await act(async () => root.unmount()); fetchMock.mockRestore() }
}

const successfulFetch = async (url) => {
  if (url.endsWith('/auth/session')) return json(session)
  if (url.endsWith('/submissions')) return json({ submissions: [row] })
  if (url.endsWith('/submissions/42')) return json(detail)
  if (url.endsWith('/submissions/42/redact')) return json(redacted)
  throw new Error(`Unexpected endpoint ${url}`)
}

test('login-required state is explicit and sends no own-list request after 401', async () => {
  await mount(async () => json({ error: { code: 'authentication-required' } }, 401), async (host, fetcher) => {
    assert.match(host.textContent, /GitHub 로그인이 필요합니다/)
    assert.equal(host.querySelector('a[href="/api/feedback/auth/login"]')?.textContent, 'GitHub로 로그인')
    assert.equal(fetcher.mock.calls.length, 1)
  })
})

test('verified identity, owner list, numeric detail, quote, reason, body and history render without local ownership inference', async () => {
  await mount(successfulFetch, async (host, fetcher) => {
    assert.match(host.textContent, /reader.*내 제보 1건/)
    await act(async () => click(host, '보기'))
    assert.match(host.textContent, /선택 문장/)
    assert.match(host.textContent, /바꿔 주세요/)
    assert.match(host.textContent, /이유: 기타/)
    assert.match(host.textContent, /처리 이력/)
    assert.equal(fetcher.mock.calls[2][0], '/api/feedback/submissions/42')
    assert.equal(fetcher.mock.calls.every(([, init]) => init.credentials === 'include'), true)
    assert.equal(host.querySelectorAll('mark, u').length, 0)
  })
})

test('403 and 503 are shown without presenting an empty list or a successful session', async () => {
  for (const [status, text] of [[403, '접근할 권한'], [503, '사용할 수 없습니다']]) {
    await mount(async (url) => url.endsWith('/auth/session') ? json(session) : json({ error: { code: 'unavailable' } }, status), async (host) => {
      assert.match(host.querySelector('[role="alert"]')?.textContent ?? '', new RegExp(text))
      assert.equal(host.textContent.includes('제출한 제보가 없습니다.'), false)
    })
  }
})

test('redaction requires explicit confirmation and fresh session CSRF; failure keeps content, success shows tombstone', async () => {
  let fail = true
  await mount(async (url) => url.endsWith('/redact') && fail ? json({ error: { code: 'service-unavailable' } }, 503) : successfulFetch(url), async (host, fetcher) => {
    await act(async () => click(host, '보기'))
    assert.equal(fetcher.mock.calls.length, 3)
    await act(async () => click(host, '내 제보 내용 삭제'))
    assert.equal(fetcher.mock.calls.length, 3)
    assert.match(host.textContent, /복구할 수 없습니다/)
    await act(async () => click(host, '내용 삭제 확인'))
    assert.match(host.querySelector('[role="alert"]')?.textContent ?? '', /사용할 수 없습니다/)
    assert.match(host.textContent, /바꿔 주세요/)
    fail = false
    await act(async () => click(host, '내용 삭제 확인'))
    assert.equal(fetcher.mock.calls[3][0], '/api/feedback/auth/session')
    assert.equal(fetcher.mock.calls[4][1].headers['x-csrf-token'], 'server-csrf')
    assert.equal(fetcher.mock.calls[4][1].method, 'POST')
    assert.equal(fetcher.mock.calls[4][1].credentials, 'include')
    assert.equal(fetcher.mock.calls[4][1].redirect, 'error')
    assert.match(host.textContent, /제보 내용이 삭제되었습니다/)
    assert.equal(host.textContent.includes('바꿔 주세요'), false)
    assert.equal(host.querySelector('button[aria-pressed="true"]') !== null, true)
  })
})

test('malformed and mismatched responses and unknown status never pass as owned data', async () => {
  await assert.rejects(() => verifiedFeedbackIdentity(async () => json({ csrfToken: 'token' })), FeedbackApiError)
  await assert.rejects(() => ownFeedbackList(async () => json({ submissions: [{ ...row, status: 'invented' }] })), FeedbackApiError)
  await assert.rejects(() => ownFeedbackDetail(42, async () => json({ ...detail, id: 43 })), FeedbackApiError)
  await assert.rejects(() => ownFeedbackDetail(42, async () => json({ ...detail, anchor: null })), FeedbackApiError)
  await assert.rejects(() => redactOwnFeedback(42, async (url) => json(url.endsWith('/session') ? session : detail)), FeedbackApiError)
  await assert.rejects(() => ownFeedbackList(async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } })), FeedbackApiError)
})

test('reload discards old detail and does not leak it after a new request resolves', async () => {
  const pending = deferred()
  let requested = 0
  await mount(async (url) => {
    if (url.endsWith('/auth/session')) return json(session)
    if (url.endsWith('/submissions')) return json({ submissions: [row] })
    if (url.endsWith('/submissions/42')) return ++requested === 1 ? pending.promise : json({ ...detail, body: '최신 답변' })
    throw new Error('unexpected request')
  }, async (host, fetcher) => {
    await act(async () => click(host, '보기'))
    const oldSignal = fetcher.mock.calls[2][1].signal
    await act(async () => click(host, '새로고침'))
    assert.equal(oldSignal.aborted, true)
    assert.match(host.textContent, /최신 답변/)
    await act(async () => { pending.resolve(json(detail)); await pending.promise })
    assert.equal(host.textContent.includes('바꿔 주세요'), false)
  })
})

test('unmount cancels pending owner requests and late responses do not publish private detail', async () => {
  const pending = deferred()
  let detailSignal
  await mount(async (url, init) => {
    if (url.endsWith('/auth/session')) return json(session)
    if (url.endsWith('/submissions')) return json({ submissions: [row] })
    detailSignal = init.signal
    return pending.promise
  }, async (host, _fetcher, root) => {
    await act(async () => click(host, '보기'))
    await act(async () => root.unmount())
    assert.equal(detailSignal.aborted, true)
    await act(async () => { pending.resolve(json(detail)); await pending.promise })
    assert.equal(host.textContent, '')
  })
})
