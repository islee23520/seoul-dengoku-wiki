import { useEffect, useState } from 'react'
import { heraldryUrl, useHeraldryAssets } from '../hooks/useHeraldryAssets'

export function StateFlag({ stateId, title }: { stateId: string; title?: string }) {
  const { assets, failed } = useHeraldryAssets()
  const validState = /^S(?:0[1-9]|1[0-6])$/u.test(stateId)
  const asset = validState ? assets?.states[stateId] : undefined
  const url = asset ? heraldryUrl(asset) : null
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)
  useEffect(() => { setBrokenUrl(null) }, [url])
  const broken = url !== null && brokenUrl === url
  return <>
    {url && <img key={url} className="state-flag" src={url} alt={title ?? ''} loading="lazy" decoding="async" hidden={broken} onError={() => setBrokenUrl(url)} onLoad={() => setBrokenUrl(null)} />}
    {broken && <span role="status">국기 불러오기 실패</span>}
    {assets && !asset && validState && <span data-heraldry-unset="state">국기 미설정</span>}
    {failed && <span role="status">국기 갱신 실패</span>}
  </>
}
