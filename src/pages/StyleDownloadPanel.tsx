import { useState } from 'react'

export type StyleDownloadSource = {
  styleId: string
  referenceSha256: string
  stylePrompt: string
  camera: Record<string, string>
  pose: Record<string, string>
}

export function styleDownloadText(source: StyleDownloadSource, format: 'json' | 'yaml') {
  const value = { schemaVersion: 1, ...source }
  return format === 'json' ? JSON.stringify(value, null, 2)
    : Object.entries(value).map(([key, item]) => `${key}: ${JSON.stringify(item)}`).join('\n')
}

export function StyleDownloadPanel({ source }: { source: StyleDownloadSource | null }) {
  const [status, setStatus] = useState('')
  function download(format: 'json' | 'yaml') {
    if (!source) return
    const url = URL.createObjectURL(new Blob([styleDownloadText(source, format)], { type: format === 'json' ? 'application/json' : 'text/yaml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${source.styleId}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }
  return <section aria-labelledby="shared-style-title" style={{ maxWidth: '100%' }}>
    <h2 id="shared-style-title">공통 화풍 자료</h2>
    {source ? <>
      <textarea aria-label="화풍 영어 프롬프트" readOnly value={source.stylePrompt} rows={8} style={{ display: 'block', width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
      <button type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(source.stylePrompt); setStatus('화풍 프롬프트를 복사했습니다.') }
        catch { setStatus('복사하지 못했습니다. 위 프롬프트를 선택해 복사하세요.') }
      }}>화풍 프롬프트 복사</button>
      <button type="button" onClick={() => download('json')}>화풍 JSON 다운로드</button>
      <button type="button" onClick={() => download('yaml')}>화풍 YAML 다운로드</button>
      </div>
      <p>스타일 ID: <code>{source.styleId}</code><br />참고 SHA-256: <code>{source.referenceSha256}</code></p>
    </> : <p>공통 화풍 원본 선택을 기다리고 있습니다.</p>}
    <p role="status">{status}</p>
  </section>
}
