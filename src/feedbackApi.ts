import type { FeedbackAnchor } from './feedbackSelection'

export const feedbackReasons = ['어색한 표현', '뜻이 불명확', '설정·사실 충돌', '내부 집필 지시', '기타'] as const
export type FeedbackReason = typeof feedbackReasons[number]
export type FeedbackSubmission = { anchor: FeedbackAnchor; body: string; reason: FeedbackReason; alternative?: string }
export type FeedbackRecord = { id: number; status: string }
export type FeedbackStatus = 'received' | 'reviewing' | 'applied' | 'rejected' | 'needs-information' | 'redacted'
export type FeedbackIdentity = { readonly githubId: string; readonly login: string }
export type OwnFeedback = { readonly id: number; readonly documentId: string; readonly status: FeedbackStatus; readonly createdAt: string }
export type FeedbackEvent = { readonly actorKind: 'submitter' | 'reviewer'; readonly action: 'submitted' | 'transitioned' | 'redacted'; readonly status: FeedbackStatus; readonly reason: string | null; readonly at: string }
export type FeedbackDetail = OwnFeedback & { readonly blockAnchor: string; readonly anchor: { readonly selections: readonly { readonly exactQuote: string }[] } | null; readonly body: string | null; readonly reason: FeedbackReason | null; readonly alternative: string | null; readonly updatedAt: string; readonly redactedAt: string | null; readonly events: readonly FeedbackEvent[] }

type ErrorEnvelope = { error?: { code?: string; message?: string; reconfirmationRequired?: boolean }; message?: string }
const statuses = ['received', 'reviewing', 'applied', 'rejected', 'needs-information', 'redacted'] as const
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
const isStatus = (value: unknown): value is FeedbackStatus => typeof value === 'string' && statuses.some((status) => status === value)
const isReason = (value: unknown): value is FeedbackReason => typeof value === 'string' && feedbackReasons.some((reason) => reason === value)
const isId = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const isOwnFeedback = (value: unknown): value is OwnFeedback & Record<string, unknown> => isObject(value) && isId(value.id) && typeof value.documentId === 'string' && isStatus(value.status) && typeof value.createdAt === 'string'
const isEvent = (value: unknown): value is FeedbackEvent => isObject(value) && (value.actorKind === 'submitter' || value.actorKind === 'reviewer') && (value.action === 'submitted' || value.action === 'transitioned' || value.action === 'redacted') && isStatus(value.status) && (value.reason === null || typeof value.reason === 'string') && typeof value.at === 'string'
const isDetail = (value: unknown): value is FeedbackDetail => {
  if (!isOwnFeedback(value) || !isObject(value)) return false
  const selections = isObject(value.anchor) ? value.anchor.selections : null
  return typeof value.blockAnchor === 'string' && (value.anchor === null || (Array.isArray(selections) && selections.length > 0 && selections.every((part: unknown) => isObject(part) && typeof part.exactQuote === 'string')))
    && (value.body === null || typeof value.body === 'string') && (value.reason === null || isReason(value.reason))
    && (value.alternative === null || typeof value.alternative === 'string') && typeof value.updatedAt === 'string'
    && (value.redactedAt === null || typeof value.redactedAt === 'string') && Array.isArray(value.events) && value.events.every(isEvent)
    && (value.status === 'redacted'
      ? value.anchor === null && value.body === null && value.reason === null && value.alternative === null
      : value.anchor !== null && typeof value.body === 'string' && isReason(value.reason) && value.redactedAt === null)
}

export class FeedbackApiError extends Error {
  constructor(readonly status: number, message: string, readonly code?: string, readonly reconfirmationRequired = false) { super(message) }
}

const jsonResponse = async (response: Response): Promise<unknown> => {
  if (response.redirected || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new FeedbackApiError(response.status, '서버 응답을 확인할 수 없습니다.')
  try { return await response.json() } catch { throw new FeedbackApiError(response.status, '서버 응답을 확인할 수 없습니다.') }
}

const responseError = (response: Response, value: unknown, fallback: string): FeedbackApiError => {
  const detail: ErrorEnvelope = isObject(value) ? {
    error: isObject(value.error) ? {
      code: typeof value.error.code === 'string' ? value.error.code : undefined,
      message: typeof value.error.message === 'string' ? value.error.message : undefined,
      reconfirmationRequired: value.error.reconfirmationRequired === true,
    } : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
  } : {}
  return new FeedbackApiError(response.status, detail.error?.message || detail.message || fallback, detail.error?.code, detail.error?.reconfirmationRequired === true)
}

export async function verifiedFeedbackIdentity(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<FeedbackIdentity> {
  const response = await fetcher('/api/feedback/auth/session', { method: 'GET', credentials: 'include', headers: { accept: 'application/json' }, signal })
  const value = await jsonResponse(response)
  if (!response.ok) throw responseError(response, value, response.status === 401 ? '제보 내역을 보려면 GitHub 로그인이 필요합니다.' : '로그인 상태를 확인하지 못했습니다.')
  if (!isObject(value) || !isObject(value.identity) || typeof value.identity.githubId !== 'string' || !/^\d+$/u.test(value.identity.githubId) || typeof value.identity.login !== 'string' || !value.identity.login || typeof value.csrfToken !== 'string' || !value.csrfToken) throw new FeedbackApiError(response.status, '로그인 상태를 확인하지 못했습니다.')
  return { githubId: value.identity.githubId, login: value.identity.login }
}

export async function ownFeedbackList(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<readonly OwnFeedback[]> {
  const response = await fetcher('/api/feedback/submissions', { method: 'GET', credentials: 'include', headers: { accept: 'application/json' }, signal })
  const value = await jsonResponse(response)
  if (!response.ok) throw responseError(response, value, '제보 내역을 불러오지 못했습니다.')
  if (!isObject(value) || !Array.isArray(value.submissions) || !value.submissions.every(isOwnFeedback)) throw new FeedbackApiError(response.status, '제보 내역 응답을 확인할 수 없습니다.')
  return value.submissions
}

export async function ownFeedbackDetail(id: number, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<FeedbackDetail> {
  const response = await fetcher(`/api/feedback/submissions/${id}`, { method: 'GET', credentials: 'include', headers: { accept: 'application/json' }, signal })
  const value = await jsonResponse(response)
  if (!response.ok) throw responseError(response, value, '제보 상세를 불러오지 못했습니다.')
  if (!isDetail(value) || value.id !== id) throw new FeedbackApiError(response.status, '제보 상세 응답을 확인할 수 없습니다.')
  return value
}

export async function redactOwnFeedback(id: number, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<FeedbackDetail> {
  const csrfToken = await feedbackSession(fetcher, signal)
  const response = await fetcher(`/api/feedback/submissions/${id}/redact`, { method: 'POST', credentials: 'include', redirect: 'error', headers: { accept: 'application/json', 'x-csrf-token': csrfToken }, signal })
  const value = await jsonResponse(response)
  if (!response.ok) throw responseError(response, value, '제보 내용을 지우지 못했습니다.')
  if (!isDetail(value) || value.id !== id || value.status !== 'redacted') throw new FeedbackApiError(response.status, '제보 삭제 응답을 확인할 수 없습니다.')
  return value
}

export async function feedbackSession(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<string> {
  const response = await fetcher('/api/feedback/auth/session', { method: 'GET', credentials: 'include', headers: { accept: 'application/json' }, signal })
  const value = await jsonResponse(response)
  if (!response.ok) throw responseError(response, value, response.status === 401 ? '제출하려면 GitHub 로그인이 필요합니다.' : '로그인 상태를 확인하지 못했습니다.')
  if (!isObject(value) || typeof value.csrfToken !== 'string' || !value.csrfToken) throw new FeedbackApiError(response.status, '로그인 상태를 확인하지 못했습니다.')
  return value.csrfToken
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
