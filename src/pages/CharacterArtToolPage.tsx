import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { makeArtSourcePacket, resolveArtPerson } from './personArtSource'

type ArtDetail = {
  readonly id: string
  readonly name: string
  readonly sourceRoute: string
  readonly fields: Record<string, string>
  readonly sections: Record<string, string>
}

export default function CharacterArtToolPage() {
  const [params, setParams] = useSearchParams()
  const requestedId = params.get('person')
  const selected = resolveArtPerson(requestedId, peopleCatalog)
  const [detail, setDetail] = useState<ArtDetail | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setDetail(null)
    setLoadError(false)
    if (!selected) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}person-details/${selected.id}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`E_ART_SOURCE:${response.status}`)
        return response.json() as Promise<ArtDetail>
      })
      .then((value) => { if (!controller.signal.aborted) setDetail(value) })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof Error) { setLoadError(true); return }
        throw error
      })
    return () => controller.abort()
  }, [selected])

  const packet = selected && detail ? makeArtSourcePacket(selected, detail) : null
  return <article className="wiki-article" data-wiki-shell="react-official" data-person-id={selected?.id ?? ''}>
    <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/people">등장인물 전체</Link><span aria-hidden="true">›</span><strong>인물 아트 도구</strong></nav>
    <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 인물</p><h1>인물 아트 도구</h1></div></header>
    <div className="wiki-prose">
      <label className="people-search"><span>인물 선택</span><select value={selected?.id ?? ''} onChange={(event) => setParams(event.target.value ? { person: event.target.value } : {})}>
        <option value="">인물을 선택하세요</option>
        {peopleCatalog.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}
      </select></label>
      {!requestedId && <p role="status">인물을 선택하면 해당 인물의 기록을 불러옵니다.</p>}
      {requestedId && !selected && <p role="alert">등록되지 않은 인물 ID입니다. 목록에서 다시 선택하세요.</p>}
      {selected && !detail && !loadError && <p role="status">{selected.name}의 기록을 불러오고 있습니다.</p>}
      {loadError && <p role="alert">인물 기록을 불러오지 못했습니다.</p>}
      {selected && detail && !packet && <p role="alert">인물 ID와 원본 기록이 일치하지 않습니다.</p>}
      {packet && <section>
        <h2>{packet.name} · {packet.personId}</h2>
        <p><Link to={`/people/${packet.personId}`}>인물 상세로 돌아가기</Link></p>
        <p>등록된 인물 기록을 확인할 수 있습니다. 아트 생성 연결은 별도 도구가 필요합니다.</p>
      </section>}
    </div>
  </article>
}
