import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { DocumentContent, fromWikiBlocks, type WikiBlock } from '@seoul-dengoku/document-renderer'
import { Breadcrumbs, PageHeader, StateNotice, TableOfContents, TableViewport } from '@seoul-dengoku/shared-web-ui'
import { wikiCatalog, wikiEnglishCatalog, type WikiDomain } from '../generated/wikiCatalog'
import { resolveLegacyRegionRoute, resolveLegacyWorldRoute, resolveWikiContentHref } from '../wikiRouting'
import { wikiBlockText, wikiHeadingId } from '../wikiDocument'
import { wikiAnchorHref } from '../sharedCategories'

const OpeningTerritoryMap = lazy(() => import('../components/OpeningTerritoryMap'))
const TimelineOverview = lazy(() => import('../components/TimelineOverview'))

type WikiLocale = 'ko' | 'en'

const worldModules = {
  ko: import.meta.glob<{ blocks: WikiBlock[] }>('../generated/world/*.json', { import: 'default' }),
  en: import.meta.glob<{ blocks: WikiBlock[] }>('../generated/world-en/*.json', { import: 'default' }),
}
const modulePrefix = { ko: '../generated/world/', en: '../generated/world-en/' }
const catalogs = { ko: wikiCatalog, en: wikiEnglishCatalog }

const labels = {
  ko: {
    breadcrumbs: '현재 위치', home: '대문', world: '세계관', site: '서울:전국 공식 위키', badge: '정본',
    loading: '문서를 불러오고 있습니다.', table: '본문 표', contents: '문서 목차', otherLocale: 'English',
  },
  en: {
    breadcrumbs: 'You are here', home: 'Main page', world: 'World', site: 'Seoul Subway States Official Wiki', badge: 'Canon',
    loading: 'Loading the document.', table: 'Article table', contents: 'Contents', otherLocale: '한국어',
  },
} as const

const isWikiDomain = (value: string | undefined): value is WikiDomain =>
  value === 'world'

export default function ArticlePage({ locale = 'ko' }: { locale?: WikiLocale }) {
  const { domain, slug } = useParams()
  const { pathname, hash } = useLocation()
  if (!isWikiDomain(domain)) return <Navigate to="/" replace />

  const text = labels[locale]
  const normalizedSlug = slug?.replace(/\.html$/, '') || 'index'
  const legacyRoute = domain === 'world' && locale === 'ko' ? resolveLegacyWorldRoute(normalizedSlug) : undefined
  const legacyRegionRoute = domain === 'world' && locale === 'ko' ? resolveLegacyRegionRoute(pathname) : undefined
  const wikiDocument = catalogs[locale].find((candidate) => candidate.domain === domain && candidate.slug === normalizedSlug)
  const koreanDocument = wikiCatalog.find((candidate) => candidate.domain === domain && candidate.slug === normalizedSlug)
  const alternate = (locale === 'ko' ? wikiEnglishCatalog : wikiCatalog).find((candidate) => candidate.domain === domain && candidate.slug === normalizedSlug)
  const [blocks, setBlocks] = useState<WikiBlock[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    const load = worldModules[locale][`${modulePrefix[locale]}${normalizedSlug}.json`]
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
  }, [domain, locale, normalizedSlug])

  useEffect(() => {
    if (!blocks || !hash) return
    let targetId: string
    try {
      targetId = decodeURIComponent(hash.slice(1))
    } catch (error: unknown) {
      if (error instanceof URIError) return
      throw error
    }
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'instant' })
      window.scrollBy({ top: -1, behavior: 'instant' })
    }
  }, [blocks, pathname, hash])

  useEffect(() => {
    if (!wikiDocument) return
    window.document.title = `${wikiDocument.title} | ${text.site}`
    return () => { document.title = '서울:전국 — 공식 위키' }
  }, [wikiDocument, text.site])

  const sectionLinks = useMemo(() => {
    if (!blocks) return []
    return blocks.filter((block) => block.type === 'heading' && [2, 3].includes(block.depth ?? 0)).map((block) => ({
      depth: block.depth ?? 2, title: wikiBlockText(block), id: wikiHeadingId(wikiBlockText(block)),
    })).slice(0, 18)
  }, [blocks])
  const content = useMemo(() => blocks ? fromWikiBlocks(blocks) : [], [blocks])

  if (legacyRoute) return <Navigate to={`${legacyRoute}${hash}`} replace />
  if (legacyRegionRoute) return <Navigate to={legacyRegionRoute} replace />
  // A Markdown-only corpus has no English page; its Korean page is the published one.
  if (locale !== 'ko' && !wikiDocument && koreanDocument) return <Navigate to={`${koreanDocument.route}${hash}`} replace />
  if (!wikiDocument || loadFailed) return <Navigate to={`/${domain}/`} replace />
  if (!blocks) {
    return <StateNotice state="loading" message={text.loading} />
  }

  return (
    <article lang={locale}>
      <Breadcrumbs
        label={text.breadcrumbs}
        resolveHref={wikiAnchorHref}
        items={[
          { title: text.home, href: '/' },
          { title: text.world, href: '/world/' },
          { title: wikiDocument.title },
        ]}
      />
      <PageHeader kicker={`${text.site} · ${domain}`} title={wikiDocument.title} badge={text.badge} />
      {alternate && <p className="wiki-locale-switch"><Link to={alternate.route} hrefLang={locale === 'ko' ? 'en' : 'ko'}>{text.otherLocale}</Link></p>}

      {domain === 'world' && normalizedSlug === 'World-and-Subway-Layers' && <Suspense fallback={<StateNotice state="loading" message="2126 시점 영토 지도를 준비하고 있습니다." />}><OpeningTerritoryMap /></Suspense>}
      {/* The year overview data and labels are Korean-only, so it belongs to the Korean page alone. */}
      {locale === 'ko' && domain === 'world' && normalizedSlug === 'Scenario-Timeline' && <Suspense fallback={<StateNotice state="loading" message="연표 전체 줄거리를 준비하고 있습니다." />}><TimelineOverview /></Suspense>}

      <div className="wiki-article-grid">
        <div className="wiki-prose">
          {content.map((node, index) => node.node.type === 'table'
            ? <TableViewport key={index} label={text.table}><DocumentContent content={[node]} locale={locale} resolveHref={resolveWikiContentHref} /></TableViewport>
            : <DocumentContent key={index} content={[node]} locale={locale} resolveHref={resolveWikiContentHref} />)}
        </div>

        {sectionLinks.length > 0 && (
          <TableOfContents label={text.contents} items={sectionLinks.map((section) => ({ id: section.id, title: section.title, depth: section.depth }))} />
        )}
      </div>
    </article>
  )
}
