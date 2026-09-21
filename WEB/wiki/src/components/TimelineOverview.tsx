import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type RelatedDocument = { title: string; route: string }
type TimelineYear = { year: number; summary: string; pressure: string; decision: string; immediate: string; aftermath: string; sourceRoute: string; relatedDocuments: RelatedDocument[] }
type TimelineOverviewData = { schema: string; years: TimelineYear[] }

const periods = [
  { id: 'all', label: '전체 101개 연도', start: 2026, end: 2126 },
  { id: 'survival', label: '생존 당직 2026–2039', start: 2026, end: 2039 },
  { id: 'water', label: '생활권 장부 2040–2054', start: 2040, end: 2054 },
  { id: 'flags', label: '열여섯 깃발 2055–2069', start: 2055, end: 2069 },
  { id: 'succession', label: '세습 인준 2070–2084', start: 2070, end: 2084 },
  { id: 'successors', label: '기관 후신 2085–2099', start: 2085, end: 2099 },
  { id: 'capitals', label: '역 수도 확정 2100–2114', start: 2100, end: 2114 },
  { id: 'opening', label: '재접촉 전야 2115–2126', start: 2115, end: 2126 },
] as const

export default function TimelineOverview() {
  const [data, setData] = useState<TimelineOverviewData | null>(null)
  const [periodId, setPeriodId] = useState('all')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}timeline-overview.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`E_TIMELINE_HTTP:${response.status}`)
        return response.json() as Promise<TimelineOverviewData>
      })
      .then(setData)
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  const period = periods.find((candidate) => candidate.id === periodId) ?? periods[0]
  const years = useMemo(() => data?.years.filter((entry) => entry.year >= period.start && entry.year <= period.end) ?? [], [data, period])

  if (failed) return <p className="wiki-domain-label">백년실록 연도별 줄거리 데이터를 불러오지 못했습니다.</p>
  if (!data) return <div className="wiki-loading">백년실록 101개 연도의 전체 줄거리를 정리하고 있습니다.</div>

  return (
    <section className="timeline-overview" aria-labelledby="timeline-overview-title">
      <header>
        <p className="wiki-domain-label">2026–2126 · 백년실록 구조 색인</p>
        <h2 id="timeline-overview-title">전체 101개 연도 줄거리</h2>
        <p>각 연도의 사건 전문을 한 문단으로 압축하고, 그해의 압력·결정·즉시 결과·다음 해에 남은 인과를 같은 줄에서 확인합니다. 요약은 <Link to="/world/Century-Annals">서울전국 백년실록</Link>에서 자동 생성됩니다.</p>
      </header>
      <div className="timeline-periods" aria-label="연표 시대 필터">
        {periods.map((candidate) => <button key={candidate.id} type="button" aria-pressed={periodId === candidate.id} onClick={() => setPeriodId(candidate.id)}>{candidate.label}</button>)}
      </div>
      <ol className="timeline-overview-list" start={period.start}>
        {years.map((entry) => (
          <li key={entry.year} className="timeline-overview-year" id={`overview-${entry.year}`}>
            <div className="timeline-overview-year-heading"><Link to={entry.sourceRoute}>{entry.year}년</Link><span>{entry.relatedDocuments.length - 1}개 정본 연결</span></div>
            <p className="timeline-overview-summary">{entry.summary}</p>
            <dl className="timeline-causality">
              <div><dt>압력</dt><dd>{entry.pressure}</dd></div>
              <div><dt>결정</dt><dd>{entry.decision}</dd></div>
              <div><dt>즉시</dt><dd>{entry.immediate}</dd></div>
              <div><dt>후속</dt><dd>{entry.aftermath}</dd></div>
            </dl>
            <nav aria-label={`${entry.year}년 연결 문서`} className="timeline-related-documents">
              {entry.relatedDocuments.map((document) => <Link key={document.route} to={document.route}>{document.title}</Link>)}
            </nav>
          </li>
        ))}
      </ol>
    </section>
  )
}
