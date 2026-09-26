import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { categoryIndex } from '../generated/categoryIndex'

export default function CategoriesPage() {
  const { categoryId } = useParams()
  const [query, setQuery] = useState('')
  const selected = categoryIndex.categories.find((category) => category.id === categoryId)
  const needle = query.trim().toLocaleLowerCase('ko')
  const categories = useMemo(() => (
    needle
      ? categoryIndex.categories.filter((category) => `${category.label} ${category.summary}`.toLocaleLowerCase('ko').includes(needle))
      : categoryIndex.categories
  ), [needle])
  const documents = selected
    ? selected.documents.filter((document) => !needle || `${document.title} ${document.slug}`.toLocaleLowerCase('ko').includes(needle))
    : []

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <header className="wiki-article-header">
        <div>
          <p className="wiki-domain-label">서울:전국 공식 위키 · 분류</p>
          <h1>{selected ? selected.label : '분류'}</h1>
        </div>
        <span className="wiki-canon-badge">{selected ? `${selected.documents.length}개` : `${categoryIndex.categories.length}개 분류`}</span>
      </header>
      {selected ? <p className="category-summary">{selected.summary}</p> : null}
      <label className="people-search">
        <span>{selected ? '이 분류의 문서' : '분류 이름'}</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={selected ? '문서 제목' : '분류 찾기'} />
      </label>
      {selected ? (
        <>
          <p><Link to="/categories">모든 분류</Link></p>
          <div className="document-index-grid">
            {documents.map((document) => (
              <Link key={document.route} to={document.route}><strong>{document.title}</strong><span>{selected.label}</span></Link>
            ))}
          </div>
          {documents.length === 0 ? <p>이 분류에 등록된 문서가 없습니다.</p> : null}
        </>
      ) : (
        <div className="document-index-grid">
          {categories.map((category) => (
            <Link key={category.id} to={`/categories/${category.id}`}><strong>{category.label}</strong><span>{category.documents.length}개 문서</span></Link>
          ))}
        </div>
      )}
    </article>
  )
}
