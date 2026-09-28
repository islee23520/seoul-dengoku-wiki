import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs, PageHeader, QueryControl } from '@seoul-dengoku/shared-web-ui'
import { wikiCatalog } from '../generated/wikiCatalog'
import { wikiAnchorHref } from '../sharedCategories'

const labels = { world: '세계관' } as const

export default function DocumentsPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko')
    return needle ? wikiCatalog.filter((document) => `${document.title} ${labels[document.domain]}`.toLocaleLowerCase('ko').includes(needle)) : wikiCatalog
  }, [query])

  return (
    <article>
      <Breadcrumbs label="현재 위치" resolveHref={wikiAnchorHref} items={[{ title: '대문', href: '/' }, { title: '정본 문서 전체' }]} />
      <PageHeader kicker="서울:전국 공식 위키 · 색인" title="정본 문서 전체" badge={`${wikiCatalog.length}개`} />
      <QueryControl
        id="document-query"
        label="문서 제목 검색"
        value={query}
        onChange={setQuery}
        placeholder="세계관 문서 찾기"
        resultCount={filtered.length}
        countLabel={(count) => `${count}건`}
      />
      <div className="document-index-grid">{filtered.map((document) => <Link key={document.route} to={document.route}><strong>{document.title}</strong><span>{labels[document.domain]}</span></Link>)}</div>
    </article>
  )
}
