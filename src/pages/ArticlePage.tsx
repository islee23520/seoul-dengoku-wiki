import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { DocumentContent } from '@seoul-dengoku/document-renderer'
import { Breadcrumbs, PageHeader, StateNotice, TableOfContents, TableViewport } from '@seoul-dengoku/shared-web-ui'
import { wikiCatalog, wikiEnglishCatalog, type WikiDomain } from '../generated/wikiCatalog'
import { resolveLegacyRegionRoute, resolveLegacyWorldRoute, resolveWikiContentHref } from '../wikiRouting'
import { wikiArticleContent, wikiBlockText, wikiHeadingId } from '../wikiDocument'
import { wikiAnchorHref } from '../sharedCategories'
import FeedbackComposer from '../components/FeedbackComposer'
import { FeedbackSurface } from '../components/FeedbackSurface'
import { useFeedbackDocument } from '../hooks/useFeedbackDocument'
import { createDocumentController, type DocumentState } from '../documentApi'

const OpeningTerritoryMap = lazy(() => import('../components/OpeningTerritoryMap'))
const TimelineOverview = lazy(() => import('../components/TimelineOverview'))
// Mermaid is large, so it loads only when an article actually contains a diagram.
const loadMermaid = () => import('mermaid')

type WikiLocale = 'ko' | 'en'

const catalogs = { ko: wikiCatalog, en: wikiEnglishCatalog }

const labels = {
  ko: {
    breadcrumbs: '현재 위치', home: '대문', world: '세계관', site: '서울:전국 공식 위키', badge: '세계관 문서',
    loading: '문서를 불러오고 있습니다.', table: '본문 표', contents: '문서 목차', otherLocale: 'English',
    error: '문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    breadcrumbs: 'You are here', home: 'Main page', world: 'World', site: 'Seoul Subway States Official Wiki', badge: 'World document',
    loading: 'Loading the document.', table: 'Article table', contents: 'Contents', otherLocale: '한국어',
    error: 'The document could not be loaded. Please try again later.',
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
  const [documentState, setDocumentState] = useState<DocumentState | null>(null)
  const documentController = useRef<ReturnType<typeof createDocumentController> | null>(null)
  if (!documentController.current) documentController.current = createDocumentController(setDocumentState)
  // A new route must never render the previous route's body, even before its effect runs.
  const current = documentState?.slug === normalizedSlug && documentState.locale === locale ? documentState : null
  const apiDocument = current?.status === 'ready' ? current.document : null
  const blocks = apiDocument?.blocks ?? null
  const feedbackState = useFeedbackDocument(pathname, locale)
  const feedback = feedbackState.status === 'ready' ? feedbackState.document : null
  const proseRef = useRef<HTMLDivElement>(null)
  const [feedbackBound, setFeedbackBound] = useState(false)
  useEffect(() => {
    const controller = documentController.current!
    void controller.load(normalizedSlug, locale)
    return () => controller.dispose()
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

  // The page shell is Korean; an English article must announce its own language to assistive technology.
  useEffect(() => {
    document.documentElement.lang = locale
    return () => { document.documentElement.lang = 'ko' }
  }, [locale])

  useEffect(() => {
    if (!apiDocument) return
    window.document.title = `${apiDocument.title} | ${text.site}`
    return () => { document.title = '서울:전국 — 공식 위키' }
  }, [apiDocument, text.site])

  const content = useMemo(() => blocks ? wikiArticleContent(blocks) : [], [blocks])
  const sectionLinks = useMemo(() => content.filter(({ node }) => node.type === 'heading' && [2, 3].includes(node.depth ?? 0))
    .map(({ node, anchors }) => ({ depth: node.depth ?? 2, title: wikiBlockText(node), id: anchors.get(node) ?? '' }))
    .slice(0, 18), [content])

  if (legacyRoute) return <Navigate to={`${legacyRoute}${hash}`} replace />
  if (legacyRegionRoute) return <Navigate to={legacyRegionRoute} replace />
  // A Markdown-only corpus has no English page; its Korean page is the published one.
  if (current?.status === 'not-found' && locale !== 'ko' && !wikiDocument && koreanDocument) return <Navigate to={`${koreanDocument.route}${hash}`} replace />
  if (current?.status === 'not-found') return <Navigate to={`/${domain}/`} replace />
  if (current?.status === 'error') return <StateNotice state="error" message={text.error} />
  if (!apiDocument) {
    return <StateNotice state="loading" message={text.loading} />
  }

  return (
    <article lang={locale} id={wikiHeadingId(apiDocument.title)}>
      <Breadcrumbs
        label={text.breadcrumbs}
        resolveHref={wikiAnchorHref}
        items={[
          { title: text.home, href: '/' },
          { title: text.world, href: '/world/' },
          { title: apiDocument.title },
        ]}
      />
      <PageHeader kicker={`${text.site} · ${domain}`} title={apiDocument.title} badge={text.badge} />
      {alternate && <p className="wiki-locale-switch"><Link to={alternate.route} hrefLang={locale === 'ko' ? 'en' : 'ko'}>{text.otherLocale}</Link></p>}

      {domain === 'world' && normalizedSlug === 'World-and-Subway-Layers' && <Suspense fallback={<StateNotice state="loading" message="2126 시점 영토 지도를 준비하고 있습니다." />}><OpeningTerritoryMap /></Suspense>}
      {/* The year overview data and labels are Korean-only, so it belongs to the Korean page alone. */}
      {locale === 'ko' && domain === 'world' && normalizedSlug === 'Scenario-Timeline' && <Suspense fallback={<StateNotice state="loading" message="연표 전체 줄거리를 준비하고 있습니다." />}><TimelineOverview /></Suspense>}

      <div className="wiki-article-grid">
        {feedback ? <FeedbackSurface rootRef={proseRef} documentInfo={feedback} onBound={setFeedbackBound}><div className="wiki-prose">
          {content.map((node, index) => node.node.type === 'table'
            ? <TableViewport key={index} label={text.table}><DocumentContent content={[node]} locale={locale} resolveHref={resolveWikiContentHref} loadMermaid={loadMermaid} /></TableViewport>
            : <DocumentContent key={index} content={[node]} locale={locale} resolveHref={resolveWikiContentHref} loadMermaid={loadMermaid} />)}
        </div></FeedbackSurface> : <div className="wiki-prose">
          {content.map((node, index) => node.node.type === 'table'
            ? <TableViewport key={index} label={text.table}><DocumentContent content={[node]} locale={locale} resolveHref={resolveWikiContentHref} loadMermaid={loadMermaid} /></TableViewport>
            : <DocumentContent key={index} content={[node]} locale={locale} resolveHref={resolveWikiContentHref} loadMermaid={loadMermaid} />)}
        </div>}

        {sectionLinks.length > 0 && (
          <TableOfContents label={text.contents} items={sectionLinks.map((section) => ({ id: section.id, title: section.title, depth: section.depth }))} />
        )}
      </div>
      {feedback && feedbackBound && <FeedbackComposer rootRef={proseRef} documentInfo={feedback} locale={locale} />}
    </article>
  )
}
