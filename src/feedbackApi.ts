import type { FeedbackAnchor } from './feedbackSelection'

export const feedbackReasons = ['어색한 표현', '뜻이 불명확', '설정·사실 충돌', '내부 집필 지시', '기타'] as const
export type FeedbackReason = typeof feedbackReasons[number]
export type FeedbackSubmission = { anchor: FeedbackAnchor; body: string; reason: FeedbackReason; alternative?: string }

export class FeedbackApiError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

export async function submitFeedback(payload: FeedbackSubmission, fetcher: typeof fetch = fetch): Promise<unknown> {
  const response = await fetcher('/api/feedback/submissions', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { message?: string } | null
    throw new FeedbackApiError(response.status, detail?.message || (response.status === 401 ? '제출하려면 GitHub 로그인이 필요합니다.' : '제보를 제출하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'))
  }
  return response.json().catch(() => null)
}
