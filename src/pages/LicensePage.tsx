import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import license from '../../LICENSE?raw'

export default function LicensePage() {
  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/">대문</Link><span aria-hidden="true">›</span><strong>라이선스</strong></nav>
      <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 이용 조건</p><h1>라이선스와 권리 안내</h1></div></header>
      <div className="wiki-prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{license}</ReactMarkdown></div>
    </article>
  )
}
