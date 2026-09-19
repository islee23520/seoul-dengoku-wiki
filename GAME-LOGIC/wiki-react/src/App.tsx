import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import StateDetailPage from './pages/StateDetailPage'
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
import StatesPage from './pages/StatesPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/states/:stateSlug" element={<StateDetailPage />} />
        <Route path="/people" element={<Suspense fallback={<div className="wiki-loading">인물 원장을 불러오고 있습니다.</div>}><PeoplePage /></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={<div className="wiki-loading">문서 색인을 불러오고 있습니다.</div>}><DocumentsPage /></Suspense>} />
        <Route path="/:domain/:slug" element={<ArticlePage />} />
        <Route path="/:domain/" element={<ArticlePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
