import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import StateDetailPage from './pages/StateDetailPage'
const RelationsGraphPage = lazy(() => import('./pages/RelationsGraphPage').then(m => ({ default: m.RelationsGraphPage })))
  const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const FamiliesPage = lazy(() => import('./pages/FamiliesPage'))
const FamilyDetailPage = lazy(() => import('./pages/FamilyDetailPage'))
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage'))
const CharacterDraftPage = lazy(() => import('./pages/CharacterDraftPage'))
const CharacterArtToolPage = lazy(() => import('./pages/CharacterArtToolPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
import StatesPage from './pages/StatesPage'
import UpdatesPage from './pages/UpdatesPage'
import { resolveLegacyRegionRoute, worldRegionMapRoute } from './wikiRouting'
import { wikiCatalog, wikiEnglishCatalog } from './generated/wikiCatalog'

const appRoutes = new Set(['/', '/states', '/updates', '/people', '/families', '/people/draft', '/people/art', '/documents', '/categories', '/world/', ...wikiCatalog.map(({ route }) => route), ...wikiEnglishCatalog.map(({ route }) => route)])

function useNativeWikiLinks() {
  const navigate = useNavigate()
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('#')) return
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin || !url.pathname.startsWith('/wiki/')) return
      const path = url.pathname.slice('/wiki'.length)
      if (!appRoutes.has(path) && !/^\/(?:categories|states|people|families)\/[^/]+$/.test(path)) return
      event.preventDefault()
      navigate(`${path}${url.search}${url.hash}`)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate])
}

function LegacyRegionPage() {
  const { pathname } = useLocation()
  return <Navigate to={resolveLegacyRegionRoute(pathname) ?? worldRegionMapRoute} replace />
}

export default function App() {
  useNativeWikiLinks()
  return (
    <Layout>
      <Routes>
        
      {/* Character cast pages redirect to /people */}
      <Route path="/world/Cast-State-:stateId" element={<Navigate to="/people" replace />} />
      <Route path="/world/Core-Characters" element={<Navigate to="/people" replace />} />
      <Route path="/world/Cast-Unaffiliated" element={<Navigate to="/people" replace />} />
      <Route path="/world/Cast-Index" element={<Navigate to="/people" replace />} />
      <Route path="/world/Cast-Index-S4" element={<Navigate to="/people" replace />} />
      <Route path="/world/Cast-Corridors-Index" element={<Navigate to="/people" replace />} />
      <Route path="/world/Cast-Relations" element={<Navigate to="/people" replace />} />

      <Route path="/" element={<HomePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/states/:stateSlug" element={<StateDetailPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/people" element={<Suspense fallback={<div className="wiki-loading">인물 원장을 불러오고 있습니다.</div>}><PeoplePage /></Suspense>} />
        <Route path="/families" element={<Suspense fallback={<div className="wiki-loading">가문 원장을 불러오고 있습니다.</div>}><FamiliesPage /></Suspense>} />
        <Route path="/families/:clanId" element={<Suspense fallback={<div className="wiki-loading">가문 상세를 불러오고 있습니다.</div>}><FamilyDetailPage /></Suspense>} />
        <Route path="/people/relations" element={<Suspense fallback={<div className="wiki-loading">관계 그래프를 불러오고 있습니다.</div>}><RelationsGraphPage /></Suspense>} />
          <Route path="/people/draft" element={<Suspense fallback={<div className="wiki-loading">초안 편집기를 불러오고 있습니다.</div>}><CharacterDraftPage /></Suspense>} />
        <Route path="/people/art" element={<Suspense fallback={<div className="wiki-loading">아트 도구를 불러오고 있습니다.</div>}><CharacterArtToolPage /></Suspense>} />
        <Route path="/people/:personId" element={<Suspense fallback={<div className="wiki-loading">인물 상세를 불러오고 있습니다.</div>}><PersonDetailPage /></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={<div className="wiki-loading">문서 색인을 불러오고 있습니다.</div>}><DocumentsPage /></Suspense>} />
        <Route path="/categories" element={<Suspense fallback={<div className="wiki-loading">분류를 불러오고 있습니다.</div>}><CategoriesPage /></Suspense>} />
        <Route path="/categories/:categoryId" element={<Suspense fallback={<div className="wiki-loading">분류를 불러오고 있습니다.</div>}><CategoriesPage /></Suspense>} />
        <Route path="/regions/*" element={<LegacyRegionPage />} />
        <Route path="/world/regions/*" element={<LegacyRegionPage />} />
        <Route path="/en/:domain/:slug" element={<ArticlePage key="en" locale="en" />} />
        <Route path="/:domain/:slug" element={<ArticlePage key="ko" />} />
        <Route path="/:domain/" element={<ArticlePage key="ko" />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
