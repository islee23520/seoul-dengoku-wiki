import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { wikiCatalog, type WikiDomain } from '../generated/wikiCatalog'
import { WorldBlocks, headingId, plainText, type WorldBlock } from '../components/WorldBlocks'
import { resolveLegacyRegionRoute, resolveLegacyWorldRoute } from '../wikiRouting'

const OpeningTerritoryMap = lazy(() => import('../components/OpeningTerritoryMap'))
const TimelineOverview = lazy(() => import('../components/TimelineOverview'))

const worldModules = import.meta.glob<{ blocks: WorldBlock[] }>('../generated/world/*.json', {
  import: 'default',
})

const isWikiDomain = (value: string | undefined): value is WikiDomain =>
  value === 'world'

export default function ArticlePage() {
  const { domain, slug } = useParams()
  const { pathname, hash } = useLocation()
  if (!isWikiDomain(domain)) return <Navigate to="/" replace />

  const normalizedSlug = slug?.replace(/\.html$/, '') || 'index'
  const legacyRoute = domain === 'world' ? resolveLegacyWorldRoute(normalizedSlug) : undefined
  const legacyRegionRoute = domain === 'world' ? resolveLegacyRegionRoute(pathname) : undefined
  const wikiDocument = wikiCatalog.find((candidate) => candidate.domain === domain && candidate.slug === normalizedSlug)
  const [blocks, setBlocks] = useState<WorldBlock[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    const load = worldModules[`../generated/world/${normalizedSlug}.json`]
    setBlocks(null)
    setLoadFailed(false)
    if (!load) {
      setLoadFailed(true)
      return () => { active = false }
    }
    void load().then((content) => {
      if (active) setBlocks(Array.isArray(content.blocks) ? content.blocks : null)
      if (active && !Array.isArray(content.blocks)) setLoadFailed(true)
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
    if (!blocks || !hash) return
    let targetId: string
    try {
      targetId = decodeURIComponent(hash.slice(1))
    } catch (error: unknown) {
      if (error instanceof URIError) return
      throw error
    }
    document.getElementById(targetId)?.scrollIntoView()
  }, [blocks, pathname, hash])

  useEffect(() => {
    if (!wikiDocument) return
    window.document.title = `${wikiDocument.title} | 서울:전국 공식 위키`
    return () => { document.title = '서울:전국 — 공식 위키' }
  }, [wikiDocument])

  const sectionLinks = useMemo(() => {
    if (!blocks) return []
    return blocks.filter((block) => block.type === 'heading' && [2, 3].includes(block.depth ?? 0)).map((block) => ({
      depth: block.depth ?? 2, title: plainText(block), id: headingId(plainText(block)),
    })).slice(0, 18)
  }, [blocks])

  if (legacyRoute) return <Navigate to={`${legacyRoute}${hash}`} replace />
  if (legacyRegionRoute) return <Navigate to={legacyRegionRoute} replace />
  if (!wikiDocument || loadFailed) return <Navigate to={`/${domain}/`} replace />
  if (!blocks) {
    return <div className="wiki-loading" role="status">문서를 불러오고 있습니다.</div>
  }

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <nav aria-label="현재 위치" className="wiki-breadcrumbs">
        <Link to="/">대문</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/${domain}/`}>세계관</Link>
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

      {domain === 'world' && normalizedSlug === 'World-and-Subway-Layers' && <Suspense fallback={<div className="wiki-loading">3D 2126 시점 영토 지도를 준비하고 있습니다.</div>}><OpeningTerritoryMap /></Suspense>}
      {domain === 'world' && normalizedSlug === 'Scenario-Timeline' && <Suspense fallback={<div className="wiki-loading">연표 전체 줄거리를 준비하고 있습니다.</div>}><TimelineOverview /></Suspense>}

      <div className="wiki-article-grid">
        <div className="wiki-prose">
          <WorldBlocks blocks={blocks} />
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
