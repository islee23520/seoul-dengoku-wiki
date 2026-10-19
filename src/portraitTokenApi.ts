export const portraitTokenApiBase = `${import.meta.env.BASE_URL}api/portrait-tokens`
export const portraitTokenApiUrl = (personId: string) => `${portraitTokenApiBase}/${encodeURIComponent(personId)}`
export const portraitTokenStaticUrl = (personId: string) => `${import.meta.env.BASE_URL}portrait-tokens/${encodeURIComponent(personId)}.json`
export const portraitPromptApiUrl = (personId: string, view: string, format: 'json' | 'text' = 'json') =>
  `${portraitTokenApiUrl(personId)}/prompt?view=${encodeURIComponent(view)}${format === 'text' ? '&format=text' : ''}`

// The wiki host answers unknown paths with the SPA shell (HTML 200), so only a JSON reply counts as an API hit.
const isJson = (response: Response) => response.ok && (response.headers.get('content-type') ?? '').includes('application/json')

export async function fetchPortraitToken<T>(personId: string, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(portraitTokenApiUrl(personId), { headers: { accept: 'application/json' }, signal })
    if (isJson(response)) return await response.json() as T
  } catch (cause) {
    if (signal?.aborted) throw cause
  }
  const response = await fetch(portraitTokenStaticUrl(personId), { signal })
  if (!response.ok) throw new Error('토큰을 불러올 수 없습니다.')
  return await response.json() as T
}
