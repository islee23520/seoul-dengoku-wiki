import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { wikiCatalog, type WikiDomain } from '../generated/wikiCatalog'
import { normalizeWikiHref, toWikiPath } from '../wikiRouting'
import OpeningTerritoryMap from '../components/OpeningTerritoryMap'

const markdownModules = import.meta.glob<string>('../content/**/*.md', {
  query: '?raw',
  import: 'default',
})

const isWikiDomain = (value: string | undefined): value is WikiDomain =>
  value === 'world' || value === 'rules' || value === 'design'

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    const normalizedHref = normalizeWikiHref(href)
    if (normalizedHref.startsWith('/world/') || normalizedHref.startsWith('/rules/') || normalizedHref.startsWith('/design/')) {
      return <Link to={normalizedHref} {...props}>{children}</Link>
    }
    return <a href={normalizedHref.startsWith('/') ? toWikiPath(normalizedHref) : normalizedHref} rel={normalizedHref.startsWith('http') ? 'noreferrer' : undefined} {...props}>{children}</a>
  },
  table: ({ children }) => (
    <div className="wiki-table-wrap">
      <table>{children}</table>
    </div>
  ),
  h2: ({ children }) => {
    const title = String(children)
    const id = title.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
    return <h2 id={id}>{children}</h2>
  },
  h3: ({ children }) => {
    const title = String(children)
    const id = title.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
    return <h3 id={id}>{children}</h3>
  },
}

export default function ArticlePage() {
  const { domain, slug } = useParams()
  if (!isWikiDomain(domain)) return <Navigate to="/" replace />

  const normalizedSlug = slug?.replace(/\.html$/, '') || 'index'
  const wikiDocument = wikiCatalog.find((candidate) => candidate.domain === domain && candidate.slug === normalizedSlug)
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    const load = markdownModules[`../content/${domain}/${normalizedSlug}.md`]
    setMarkdown(null)
    setLoadFailed(false)
    if (!load) {
      setLoadFailed(true)
      return () => { active = false }
    }
    void load().then((content) => {
      if (active) setMarkdown(content)
    }).catch((error: unknown) => {
      if (error instanceof Error) {
        if (active) setLoadFailed(true)
        console.error(error.message)
        return
      }
      throw error
    })
    return () => { active = false }
  }, [domain, normalizedSlug])

  useEffect(() => {
    if (!wikiDocument) return
    window.document.title = `${wikiDocument.title} | 서울:전국 공식 위키`
    return () => { document.title = '서울:전국 — 공식 위키' }
  }, [wikiDocument])

  const sectionLinks = useMemo(() => {
    if (!markdown) return []
    return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => {
      const title = match[2].replace(/\s+\{#[^}]+\}\s*$/, '').trim()
      const id = title.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
      return { depth: match[1].length, id, title }
    }).slice(0, 18)
  }, [markdown])

  if (!wikiDocument || loadFailed) return <Navigate to={`/${domain}/`} replace />
  if (!markdown) {
    return <div className="wiki-loading" role="status">문서를 불러오고 있습니다.</div>
  }

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <nav aria-label="현재 위치" className="wiki-breadcrumbs">
        <Link to="/">대문</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/${domain}/`}>{domain === 'world' ? '세계관' : domain === 'rules' ? '게임 규칙' : '기획서'}</Link>
        <span aria-hidden="true">›</span>
        <strong>{wikiDocument.title}</strong>
      </nav>

      <header className="wiki-article-header">
        <div>
          <p className="wiki-domain-label">서울:전국 공식 위키 · {domain}</p>
          <h1>{wikiDocument.title}</h1>
        </div>
        <span className="wiki-canon-badge">정본</span>
      </header>

      <div className="wiki-article-grid">
        <div className="wiki-prose">
          {domain === 'world' && normalizedSlug === 'World-and-Subway-Layers' && <OpeningTerritoryMap />}
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {markdown}
          </ReactMarkdown>
        </div>

        {sectionLinks.length > 0 && (
          <aside className="wiki-toc" aria-label="문서 목차">
            <strong>목차</strong>
            {sectionLinks.map((section) => (
              <a key={`${section.id}-${section.depth}`} href={`#${section.id}`} className={section.depth === 3 ? 'wiki-toc-sub' : undefined}>
                {section.title}
              </a>
            ))}
          </aside>
        )}
      </div>
    </article>
  )
}
