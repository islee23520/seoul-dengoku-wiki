import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { makeArtSourcePacket, resolveArtPerson } from './personArtSource'
import PortraitPromptPanel from './PortraitPromptPanel'

import { StyleDownloadPanel, type StyleDownloadSource } from './StyleDownloadPanel'
import originalStyle from '../../public/portrait-style-original-c3a7e481.json'

const originalStyleExport: StyleDownloadSource = {
  styleId: originalStyle.styleId,
  referenceSha256: originalStyle.referenceSha256,
  stylePrompt: originalStyle.stylePrompt,
  camera: originalStyle.camera,
  pose: originalStyle.pose,
}

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
  const [port, setPort] = useState('')
  const [pairing, setPairing] = useState('')
  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'unavailable' | 'failed'>('idle')
  const [job, setJob] = useState<'idle' | 'running' | 'cancelling' | 'cancelled' | 'failed' | 'done'>('idle')
  const [image, setImage] = useState<string | null>(null)
  const attempt = useRef(0)
  const current = useRef('')
  const running = useRef<{ id: string; endpoint: string; pairing: string; configuration: string; controller: AbortController; cancelled: boolean } | null>(null)
  const endpoint = /^\d{1,5}$/.test(port) && Number(port) > 0 && Number(port) <= 65535 ? `http://127.0.0.1:${port}` : null
  const configuration = `${requestedId ?? ''}|${port}|${pairing}`
  current.current = configuration

  const cancelRequest = async (request: NonNullable<typeof running.current>) => {
    request.cancelled = true
    if (current.current === request.configuration) setJob('cancelling')
    try {
      const response = await fetch(`${request.endpoint}/v1/jobs/${request.id}`, { method: 'DELETE', headers: { 'X-Art-Bridge-Pairing': request.pairing } })
      request.controller.abort()
      if (running.current === request) {
        running.current = null
        if (current.current === request.configuration) setJob(response.status === 204 ? 'cancelled' : 'failed')
      }
    } catch {
      request.controller.abort()
      if (running.current === request) {
        running.current = null
        if (current.current === request.configuration) setJob('failed')
      }
    }
  }

  const connect = async () => {
    if (!endpoint || !pairing) { setConnection('failed'); return }
    const generation = ++attempt.current
    const source = configuration
    setConnection('connecting')
    try {
      const response = await fetch(`${endpoint}/v1/health`, { headers: { 'X-Art-Bridge-Pairing': pairing }, cache: 'no-store' })
      const reply: unknown = await response.json()
      if (!response.ok || !reply || typeof reply !== 'object' || !('protocol' in reply) || reply.protocol !== 'seoul-art-local-v1'
        || !('bridge' in reply) || reply.bridge !== 'reachable' || !('agentAvailable' in reply) || typeof reply.agentAvailable !== 'boolean') throw new Error('bridge_unavailable')
      if (attempt.current === generation && current.current === source) setConnection(reply.agentAvailable ? 'connected' : 'unavailable')
    } catch { if (attempt.current === generation && current.current === source) setConnection('failed') }
  }

  const submit = async (source: NonNullable<ReturnType<typeof makeArtSourcePacket>>) => {
    if (!endpoint || !pairing || connection !== 'connected' || running.current) return
    const config = configuration
    const request = { id: crypto.randomUUID(), endpoint, pairing, configuration: config, controller: new AbortController(), cancelled: false }
    running.current = request
    setJob('running')
    setImage(null)
    try {
      const response = await fetch(`${endpoint}/v1/jobs`, { method: 'POST', headers: { 'X-Art-Bridge-Pairing': pairing, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...source, requestId: request.id }), signal: request.controller.signal })
      const reply: unknown = await response.json()
      if (!response.ok || !reply || typeof reply !== 'object' || !('protocol' in reply) || reply.protocol !== 'seoul-art-local-v1'
        || !('personId' in reply) || reply.personId !== source.personId || !('requestId' in reply) || reply.requestId !== request.id
        || !('image' in reply) || typeof reply.image !== 'string' || !reply.image.startsWith('data:image/png;base64,iVBORw0KGgo')) throw new Error('invalid_result')
      const decoded = new Image()
      decoded.src = reply.image
      await decoded.decode()
      if (running.current === request && !request.cancelled && !request.controller.signal.aborted && current.current === config) { setImage(reply.image); setJob('done') }
    } catch {
      if (running.current === request && !request.cancelled && !request.controller.signal.aborted && current.current === config) setJob('failed')
    } finally { if (running.current === request && !request.cancelled) running.current = null }
  }

  useEffect(() => {
    attempt.current++
    const request = running.current
    if (request) void cancelRequest(request)
    setConnection('idle')
    setJob('idle')
    setImage(null)
    return () => {
      attempt.current++
      const request = running.current
      if (request) void cancelRequest(request)
    }
  }, [configuration])

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
      <StyleDownloadPanel source={originalStyleExport} />
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
        <p>인물 기록을 자신의 컴퓨터에서 사용하는 아트 도구에 전달합니다. 생성 결과는 정본에 반영되지 않습니다.</p>
        <details><summary>인물 원본 기록</summary><pre>{JSON.stringify(packet, null, 2)}</pre></details>
        <p><a href={`${import.meta.env.BASE_URL}local-art-bridge.mjs`} download>로컬 연결 도구 받기</a> · 다운로드한 폴더에서 <code>node local-art-bridge.mjs --origin {window.location.origin} --port 17201</code> 실행</p>
          <p>연결 도구와 초상 생성 파이프라인의 원본 저장소는 <a href="https://github.com/islee23520/seoul-dengoku-tools" rel="external">islee23520/seoul-dengoku-tools</a>(TOOL/avatar-gen)입니다.</p>
        <p>Codex 로그인과 이미지 생성 도구는 사용자의 컴퓨터에서 설정합니다. 기능이 없으면 작업은 실패합니다.</p>
        <div className="person-art-connection">
          <label>로컬 포트<input inputMode="numeric" value={port} onChange={(event) => setPort(event.target.value)} placeholder="연결 도구에 표시된 포트" /></label>
          <label>연결 코드<input type="password" autoComplete="off" value={pairing} onChange={(event) => setPairing(event.target.value)} placeholder="연결 도구에 표시된 코드" /></label>
          <button type="button" disabled={!endpoint || !pairing || connection === 'connecting'} onClick={() => void connect()}>로컬 도구 연결</button>
          {connection === 'idle' && <p role="status">로컬 도구를 실행한 뒤 연결하세요.</p>}
          {connection === 'connecting' && <p role="status">로컬 도구에 연결하고 있습니다.</p>}
          {connection === 'connected' && <p role="status">로컬 도구와 Codex 실행 파일을 확인했습니다. 이미지 생성 가능 여부는 실행 결과로 확인됩니다.</p>}
          {connection === 'unavailable' && <p role="alert">로컬 도구에 연결됐지만 Codex 실행 파일을 찾을 수 없습니다. 컴퓨터에 설치한 뒤 연결 도구를 다시 확인하세요. 로그인과 이미지 생성 가능 여부는 아직 확인되지 않았습니다.</p>}
          {connection === 'failed' && <p role="alert">연결할 수 없습니다. 로컬 도구, 포트와 연결 코드를 확인하세요.</p>}
          <button type="button" disabled={connection !== 'connected' || job === 'running' || job === 'cancelling'} onClick={() => void submit(packet)}>내 로컬 도구로 생성 요청</button>
          {job === 'running' && <><p role="status">내 컴퓨터에서 작업 중입니다.</p><button type="button" onClick={() => { const request = running.current; if (request) void cancelRequest(request) }}>요청 취소</button></>}
          {job === 'cancelling' && <p role="status">로컬 작업을 종료하고 있습니다.</p>}
          {job === 'cancelled' && <p role="status">요청을 취소했습니다.</p>}
          {job === 'failed' && <p role="alert">로컬 작업이 실패했거나 결과가 일치하지 않습니다.</p>}
          {job === 'done' && image && <div><p role="status">로컬 생성 시안</p><img src={image} alt={`${packet.name}의 로컬 생성 시안`} /></div>}
        </div>
      </section>}
      {packet && <PortraitPromptPanel key={packet.personId} />}
    </div>
  </article>
}
