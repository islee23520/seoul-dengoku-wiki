import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import StateDetailPage from './pages/StateDetailPage'
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
import StatesPage from './pages/StatesPage'
import UpdatesPage from './pages/UpdatesPage'
import { resolveLegacyRegionRoute, worldRegionMapRoute } from './wikiRouting'

function LegacyRegionPage() {
  const { pathname } = useLocation()
  return <Navigate to={resolveLegacyRegionRoute(pathname) ?? worldRegionMapRoute} replace />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/states/:stateSlug" element={<StateDetailPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/people" element={<Suspense fallback={<div className="wiki-loading">인물 원장을 불러오고 있습니다.</div>}><PeoplePage /></Suspense>} />
        <Route path="/people/:personId" element={<Suspense fallback={<div className="wiki-loading">인물 상세를 불러오고 있습니다.</div>}><PersonDetailPage /></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={<div className="wiki-loading">문서 색인을 불러오고 있습니다.</div>}><DocumentsPage /></Suspense>} />
        <Route path="/categories" element={<Suspense fallback={<div className="wiki-loading">분류를 불러오고 있습니다.</div>}><CategoriesPage /></Suspense>} />
        <Route path="/categories/:categoryId" element={<Suspense fallback={<div className="wiki-loading">분류를 불러오고 있습니다.</div>}><CategoriesPage /></Suspense>} />
        <Route path="/regions/*" element={<LegacyRegionPage />} />
        <Route path="/world/regions/*" element={<LegacyRegionPage />} />
        <Route path="/:domain/:slug" element={<ArticlePage />} />
        <Route path="/:domain/" element={<ArticlePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
