import { Link } from 'react-router-dom'
import { categoryIndex } from '../generated/categoryIndex'
import { wikiUpdates } from '../generated/wikiUpdates'
import { wikiLinks } from '../wikiLinks'

export default function HomePage() {
  return (
    <div>
      <div className="mb-6 border-b-2 border-accent pb-3">
        <h1 className="text-3xl font-extrabold text-gray-800">서울:전국 공식 위키</h1>
        <p className="mt-1 text-sm text-gray-500">
          붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-toc-border bg-toc-bg p-4">
        <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-accent-dark">최신 소식</h3><Link to="/updates" className="text-sm text-accent hover:underline">전체 계약 이력</Link></div>
        {wikiUpdates.map((update) => (
          <div key={`${update.date}:${update.title}`} className="home-news-item py-1 text-sm text-gray-700">
            <span className="mr-2 text-accent">•</span><Link to={update.route}>{update.date} — {update.title}</Link>
          </div>
        ))}
      </div>

      <div className="mb-3 flex gap-4 text-sm">
        <Link to={wikiLinks.documents} className="text-accent hover:underline">정본 문서 전체</Link>
        <Link to={wikiLinks.categories} className="text-accent hover:underline">분류 전체</Link>
        <Link to={wikiLinks.characters} className="text-accent hover:underline">인물 총람</Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryIndex.categories.map(category => (
          <section key={category.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 border-b border-gray-200 pb-1.5 text-sm font-bold text-gray-700">
              <Link to={`/categories/${category.id}`} className="text-accent hover:underline">{category.label}</Link>
              <span className="ml-2 text-xs font-normal text-gray-500">{category.documents.length}개</span>
            </h2>
            <ul className="max-h-64 overflow-y-auto">
              {category.documents.map(document => (
                <li key={document.route}>
                  <Link to={document.route} className="block py-1 text-sm text-accent hover:underline">{document.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
