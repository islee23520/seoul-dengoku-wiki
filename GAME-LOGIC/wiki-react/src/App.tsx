import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import StatesPage from './pages/StatesPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/states" element={<StatesPage />} />
        <Route path="/:domain/:slug" element={<ArticlePage />} />
        <Route path="/:domain/" element={<ArticlePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
