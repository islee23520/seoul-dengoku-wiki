import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs, PageHeader, QueryControl } from '@seoul-dengoku/shared-web-ui'
import { categoryIndex } from '../generated/categoryIndex'
import { categoryEntityCount, categoryHref, categoryTrail, wikiAnchorHref } from '../sharedCategories'

export default function CategoriesPage() {
  const { categoryId } = useParams()
  const [query, setQuery] = useState('')
  const trail = categoryTrail(categoryId)
  const selected = trail[trail.length - 1]
  const needle = query.trim().toLocaleLowerCase('ko')
  const categories = useMemo(() => (
    needle
      ? categoryIndex.categories.filter((category) => `${category.label} ${category.summary}`.toLocaleLowerCase('ko').includes(needle))
      : categoryIndex.categories
  ), [needle])
  const documents = selected
    ? selected.documents.filter((document) => !needle || `${document.title} ${document.slug}`.toLocaleLowerCase('ko').includes(needle))
    : []
  const children = selected?.children.filter((category) => !needle || category.label.toLocaleLowerCase('ko').includes(needle)) ?? []
  const entities = selected?.entities.filter((entity) => !needle || entity.title.toLocaleLowerCase('ko').includes(needle)) ?? []
  const path = trail.map((category) => category.id)

  return (
    <article>
      <Breadcrumbs
        label="현재 위치"
        resolveHref={wikiAnchorHref}
        items={selected
          ? [{ title: '대문', href: '/' }, { title: '분류', href: '/categories' }, ...trail.map((category, index) => ({ title: category.label, ...(index < trail.length - 1 ? { href: categoryHref(path.slice(0, index + 1)) } : {}) }))]
          : [{ title: '대문', href: '/' }, { title: '분류' }]}
      />
      <PageHeader
        kicker="서울:전국 공식 위키 · 분류"
        title={selected ? selected.label : '분류'}
        badge={selected ? `${categoryEntityCount(selected) || selected.documents.length}개` : `${categoryIndex.categories.length}개 분류`}
      />
      {selected ? <p className="wiki-category-lead">{selected.summary}</p> : null}
      <QueryControl
        id="category-query"
        label={selected ? '이 분류의 문서' : '분류 이름'}
        value={query}
        onChange={setQuery}
        placeholder={selected ? '문서 제목' : '분류 찾기'}
        resultCount={selected ? children.length + entities.length + (selected.children.length || selected.entities.length ? 0 : documents.length) : categories.length}
        countLabel={(count) => `${count}건`}
      />
      {selected ? (
        <>
          <p><Link to="/categories">모든 분류</Link></p>
          <div className="document-index-grid">
            {children.map((child) => <Link key={child.id} to={categoryHref([...path, child.id])}><strong>{child.label}</strong><span>{categoryEntityCount(child)}개 항목</span></Link>)}
            {entities.map((entity) => <Link key={entity.id} to={entity.route}><strong>{entity.title}</strong><span>{entity.kind ?? selected.label}</span>{entity.description ? <p>{entity.description}</p> : null}</Link>)}
            {selected.children.length === 0 && selected.entities.length === 0 ? documents.map((document) => (
              <Link key={document.route} to={document.route}><strong>{document.title}</strong><span>{selected.label}</span></Link>
            )) : null}
          </div>
          {documents.length + children.length + entities.length === 0 ? <p>이 분류에 등록된 항목이 없습니다.</p> : null}
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
