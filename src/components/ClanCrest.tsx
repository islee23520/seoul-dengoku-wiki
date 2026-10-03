import { useEffect, useState } from 'react'
import { heraldryUrl, useHeraldryAssets } from '../hooks/useHeraldryAssets'

export function ClanCrest({ clanId, title }: { readonly clanId: string; readonly title: string }): JSX.Element | null {
  const { assets, failed } = useHeraldryAssets()
  const asset = assets?.clans[clanId]
  const url = asset ? heraldryUrl(asset) : null
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)
  useEffect(() => { setBrokenUrl(null) }, [url])
  const broken = url !== null && brokenUrl === url
  return <>
    {url && <img key={url} src={url} alt={title} loading="lazy" decoding="async" hidden={broken} onError={() => setBrokenUrl(url)} onLoad={() => setBrokenUrl(null)} />}
    {broken && <span role="status">가문 문장 불러오기 실패</span>}
    {assets && !asset && <span data-heraldry-unset="clan">가문 문장 미설정</span>}
    {failed && <span role="status">가문 문장 갱신 실패</span>}
  </>
}
