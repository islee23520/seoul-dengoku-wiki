import { Link } from 'react-router-dom'
import { wikiUpdateHistory } from '../generated/wikiUpdates'

const githubSource = (source: string) => {
  if (source.startsWith('commit:')) return `https://github.com/islee23520/seoul-dengoku/commit/${source.slice('commit:'.length)}`
  if (source.startsWith('pull:')) return `https://github.com/islee23520/seoul-dengoku/pull/${source.slice('pull:'.length)}`
  return `https://github.com/islee23520/seoul-dengoku/blob/main/${source.split('#')[0]}`
}

export default function UpdatesPage() {
  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/">대문</Link><span aria-hidden="true">›</span><strong>계약 이력</strong></nav>
      <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 변경 원장</p><h1>전체 계약 이력</h1></div><span className="wiki-canon-badge">추적 원장</span></header>
      <p>대문은 이 원장에서 최신 다섯 건만 보여 줍니다. 폐기되거나 다른 결정으로 대체된 계약도 삭제하지 않고 상태와 출처를 함께 보존합니다.</p>
      <ol className="timeline-overview-list contract-history-list">
        {wikiUpdateHistory.map((update) => (
          <li key={`${update.date}:${update.sequence}:${update.title}`} className="timeline-overview-year">
            <div className="timeline-overview-year-heading"><strong>{update.date}</strong><span>{update.category} · {update.status}</span></div>
            <p className="timeline-overview-summary">{update.title}</p>
            <p><a href={githubSource(update.source)} rel="noreferrer">출처: {update.source}</a></p>
          </li>
        ))}
      </ol>
    </article>
  )
}
