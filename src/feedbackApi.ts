import type { FeedbackAnchor } from './feedbackSelection'

export const feedbackReasons = ['어색한 표현', '뜻이 불명확', '설정·사실 충돌', '내부 집필 지시', '기타'] as const
export type FeedbackReason = typeof feedbackReasons[number]
export type FeedbackSubmission = { anchor: FeedbackAnchor; body: string; reason: FeedbackReason; alternative?: string }
export type FeedbackRecord = { id: number; status: string }

type ErrorEnvelope = { error?: { code?: string; message?: string; reconfirmationRequired?: boolean }; message?: string }

export class FeedbackApiError extends Error {
  constructor(readonly status: number, message: string, readonly code?: string, readonly reconfirmationRequired = false) { super(message) }
}

const jsonResponse = async (response: Response): Promise<unknown> => {
  if (response.redirected || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new FeedbackApiError(response.status, '서버 응답을 확인할 수 없습니다.')
  try { return await response.json() } catch { throw new FeedbackApiError(response.status, '서버 응답을 확인할 수 없습니다.') }
}

export async function feedbackSession(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<string> {
  const response = await fetcher('/api/feedback/auth/session', { method: 'GET', credentials: 'include', headers: { accept: 'application/json' }, signal })
  const detail = await jsonResponse(response) as ErrorEnvelope & { csrfToken?: string }
  if (!response.ok || typeof detail.csrfToken !== 'string' || !detail.csrfToken) {
    const nested = detail.error
    throw new FeedbackApiError(response.status, nested?.message || detail.message || (response.status === 401 ? '제출하려면 GitHub 로그인이 필요합니다.' : '로그인 상태를 확인하지 못했습니다.'), nested?.code)
  }
  return detail.csrfToken
}

export async function submitFeedback(payload: FeedbackSubmission, options: { idempotencyKey: string; fetcher?: typeof fetch; signal?: AbortSignal }): Promise<FeedbackRecord> {
  const fetcher = options.fetcher ?? fetch
  const csrfToken = await feedbackSession(fetcher, options.signal)
  const response = await fetcher('/api/feedback/submissions', {
    method: 'POST', credentials: 'include', redirect: 'error', signal: options.signal,
    headers: { accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': csrfToken, 'idempotency-key': options.idempotencyKey },
    body: JSON.stringify(payload),
  })
  const detail = await jsonResponse(response) as ErrorEnvelope & Partial<FeedbackRecord>
  if (!response.ok) {
    const nested = detail.error
    throw new FeedbackApiError(response.status, nested?.message || detail.message || (response.status === 401 ? '제출하려면 GitHub 로그인이 필요합니다.' : '제보를 제출하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'), nested?.code, nested?.reconfirmationRequired === true)
  }
  if (!Number.isInteger(detail.id) || typeof detail.status !== 'string' || !detail.status) throw new FeedbackApiError(response.status, '서버가 제보 접수를 확인하지 않았습니다.')
  return { id: detail.id as number, status: detail.status }
}
