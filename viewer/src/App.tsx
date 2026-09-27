import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown, { type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DocumentContent, MermaidDiagram, type DocumentNode } from '@seoul-dengoku/document-renderer'
import {
  Breadcrumbs, CategoryTree, DocumentList, PageHeader, QueryControl, SectionHeading,
  ServiceCard, SiteShell, StateNotice, TableOfContents, TableViewport,
} from '@seoul-dengoku/shared-web-ui'
import { dataCatalog } from './generated/dataCatalog'
import { categoryLabelById, isAppRoute, manifestDocuments, toPublicHref, treeCategories } from './manifest'

const markdownModules = import.meta.glob<string>('./content/**/*.md', { query: '?raw', import: 'default' })
const sharedModules = import.meta.glob<DocumentNode[]>('./generated/shared-content/*.json', { import: 'default' })

function useAnchorNavigation() {
  const navigate = useNavigate()
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]')
      if (!anchor) return
      const rawHref = anchor.getAttribute('href') ?? ''
      if (rawHref.startsWith('#')) return
      const url = new URL(rawHref, window.location.href)
      if (url.origin !== window.location.origin) return
      const base = '/gdd'
      const path = url.pathname.startsWith(`${base}/`) ? url.pathname.slice(base.length) : url.pathname
      if (!isAppRoute(path)) return
      event.preventDefault()
      navigate(`${path}${url.search}${url.hash}`)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate])
}

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const currentHref = `${location.pathname}${location.search}`
  const pageCurrent = (path: string) => (location.pathname === path ? 'page' : undefined)
  const navigation = (
    <>
      <div className="gdd-nav-pages">
        <a href={toPublicHref('/')} aria-current={pageCurrent('/')}>설계 대문</a>
        <a href={toPublicHref('/documents')} aria-current={pageCurrent('/documents')}>문서 전체</a>
        <a href={toPublicHref('/data')} aria-current={pageCurrent('/data')}>데이터 사전</a>
      </div>
      <CategoryTree items={treeCategories} currentHref={currentHref} emptyLabel="문서 없음" resolveHref={toPublicHref} />
      <a className="gdd-wiki-link" href="/wiki/">세계관 위키로 이동</a>
    </>
  )
  return (
    <SiteShell
      site="gdd"
      theme="light"
      brand={<>서울:전국 <span>GDD</span></>}
      homeHref={toPublicHref('/')}
      navigation={navigation}
      navLabel="GDD 문서 분류"
      menuLabel="전체 메뉴"
      skipLabel="본문으로 건너뛰기"
    >
      {children}
    </SiteShell>
  )
}

function HomePage() {
  return (
    <article>
      <PageHeader kicker="서울:전국 개발 문서" title="게임 설계 문서" lead="공식 위키가 세계 안의 사실과 서사를 맡는다면, 이곳은 플레이 규칙·판정·데이터셋·설정값·아키텍처를 다룬다." />
      <section className="gdd-boundary" aria-label="게시 경계">
        <div><strong>/wiki</strong><span>세계관·인물·지역·서사</span></div>
        <div><strong>/gdd</strong><span>설계·규칙·데이터·구현 계획</span></div>
      </section>
      <SectionHeading title="설계 영역" href={toPublicHref('/documents')} moreLabel={`전체 ${manifestDocuments.length}개 문서`} />
      <div className="gdd-category-grid">
        {treeCategories.map((category) => (
          <section key={category.id} className="gdd-category-card">
            <a href={toPublicHref(category.href)}><strong>{category.title}</strong></a>
            <small>{category.documents.length}개 문서</small>
            <ul>
              {category.documents.map((document) => (
                <li key={document.href}><a href={toPublicHref(document.href)}>{document.title}</a></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <SectionHeading title="데이터 원장" href={toPublicHref('/data')} moreLabel="데이터 사전 열기" />
      <div className="gdd-service-grid">
        <ServiceCard href={toPublicHref('/data')} title="데이터 사전" path="/gdd/data" summary="정본 데이터셋의 소유 경로·스키마·레코드 수·검증 방식을 한곳에서 확인한다." />
        <ServiceCard href="/wiki/" title="세계관 위키" path="/wiki/" summary="세계 안의 사실·인물·지역·서사는 공식 위키가 맡는다." />
      </div>
      <dl className="gdd-stats">
        {dataCatalog.map((dataset) => (
          <div key={dataset.id}><dt>{dataset.records.toLocaleString('ko-KR')}</dt><dd>{dataset.title}</dd></div>
        ))}
      </dl>
    </article>
  )
}

function DocumentsPage() {
  const [searchParams] = useSearchParams()
  const selected = searchParams.get('category')
  const [query, setQuery] = useState('')
  const needle = query.trim().toLocaleLowerCase('ko')
  const matches = (text: string) => !needle || text.toLocaleLowerCase('ko').includes(needle)
  const groups = treeCategories
    .filter((category) => !selected || category.id === selected)
    .map((category) => ({ category, documents: category.documents.filter((document) => matches(`${document.title} ${document.summary ?? ''} ${document.meta ?? ''} ${category.title}`)) }))
    .filter((group) => group.documents.length > 0)
  const total = groups.reduce((count, group) => count + group.documents.length, 0)
  const label = selected ? categoryLabelById.get(selected) : undefined
  return (
    <article>
      <Breadcrumbs
        label="현재 위치"
        items={label ? [{ title: 'GDD', href: '/' }, { title: '설계 색인', href: '/documents' }, { title: label }] : [{ title: 'GDD', href: '/' }, { title: '설계 색인' }]}
        resolveHref={toPublicHref}
      />
      <PageHeader kicker="설계 색인" title={label ? `${label} 문서` : 'GDD 문서 전체'} lead={`${manifestDocuments.length}개 정본 문서를 목적별로 분리해 열람한다.`} />
      <QueryControl id="gdd-document-query" label="문서 검색" value={query} onChange={setQuery} placeholder="규칙·시스템·결정 검색" resultCount={total} countLabel={(count) => `${count}개 문서`} />
      <nav className="gdd-category-tabs" aria-label="영역 선택">
        <a href={toPublicHref('/documents')} aria-current={!selected ? 'page' : undefined}>전체</a>
        {treeCategories.map((category) => (
          <a key={category.id} href={toPublicHref(category.href)} aria-current={selected === category.id ? 'page' : undefined}>{category.title}</a>
        ))}
      </nav>
      {groups.map((group) => (
        <section key={group.category.id} aria-label={group.category.title}>
          <SectionHeading title={`${group.category.title} · ${group.documents.length}개`} />
          <DocumentList items={group.documents} emptyLabel="문서 없음" resolveHref={toPublicHref} />
        </section>
      ))}
      {groups.length === 0 && <StateNotice state="empty" message="조건에 맞는 문서가 없습니다." />}
    </article>
  )
}

const headingTextOf = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(headingTextOf).join('')
  if (typeof children === 'object' && children !== null && 'props' in children) return headingTextOf((children as { props: { children?: React.ReactNode } }).props.children)
  return ''
}

// Mermaid is large, so it loads only when a page actually contains a diagram.
const loadMermaid = () => import('mermaid')

const slugify = (text: string) => text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '')

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => <h2 id={slugify(headingTextOf(children))}>{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 id={slugify(headingTextOf(children))}>{children}</h3>,
  table: ({ children }: { children?: React.ReactNode }) => <TableViewport label="문서 표"><table>{children}</table></TableViewport>,
  pre: ({ children, node }: { children?: React.ReactNode } & ExtraProps) => {
    const code = node?.children[0]
    const classes = code?.type === 'element' ? code.properties.className : undefined
    if (code?.type !== 'element' || !Array.isArray(classes) || !classes.includes('language-mermaid')) return <pre>{children}</pre>
    const source = code.children.map((child) => (child.type === 'text' ? child.value : '')).join('').replace(/\n$/, '')
    return <MermaidDiagram id={`diagram-${node?.position?.start.line ?? 0}`} source={source} load={loadMermaid} />
  },
}

interface TocEntry { depth: number; anchor: string; text: string }

const jsonTextOf = (value: string | readonly { text: string }[]) => (typeof value === 'string' ? value : value.map((run) => run.text).join(''))

function MarkdownBody({ markdown }: { markdown: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{markdown}</ReactMarkdown>
}

function DocumentPage() {
  const params = useParams()
  const route = `/${params.category ?? ''}/${params.slug ?? ''}`
  const document = manifestDocuments.find((candidate) => candidate.route === route)
  const slug = params.slug ?? ''
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [sharedContent, setSharedContent] = useState<DocumentNode[] | null>(null)
  useEffect(() => {
    if (!document) return
    let active = true
    setMarkdown(null)
    setSharedContent(null)
    const shared = sharedModules[`./generated/shared-content/${document.categoryIds[0]}-${slug}.json`]
    if (shared) {
      void shared().then((content) => { if (active) setSharedContent(content) })
      return () => { active = false }
    }
    const load = markdownModules[`./content${route}.md`]
    if (!load) return
    void load().then((content) => { if (active) setMarkdown(content) })
    return () => { active = false }
  }, [document, route, slug])
  const contents = useMemo<TocEntry[]>(() => {
    if (sharedContent) return sharedContent.flatMap((node) => node.kind !== 'heading' || (node.depth !== 2 && node.depth !== 3) ? [] : [{ depth: node.depth, anchor: node.anchor, text: jsonTextOf(node.text.ko) }])
    if (markdown) return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => ({ depth: match[1].length, anchor: slugify(match[2]), text: match[2].trim() }))
    return []
  }, [sharedContent, markdown])
  if (!document) return <Navigate to="/documents" replace />
  const categoryId = document.categoryIds[0]
  const label = categoryLabelById.get(categoryId) ?? categoryId
  return (
    <article>
      <Breadcrumbs label="현재 위치" items={[{ title: 'GDD', href: '/' }, { title: label, href: `/documents?category=${categoryId}` }, { title: document.title }]} resolveHref={toPublicHref} />
      <PageHeader kicker={label} title={document.title} badge={<code className="gdd-source">{document.source}</code>} />
      <div className="gdd-article-layout">
        <div className="gdd-article-body">
          {sharedContent
            ? <DocumentContent content={sharedContent.filter((node) => node.kind !== 'heading' || node.depth !== 1)} locale="ko" loadMermaid={loadMermaid} />
            : markdown
              ? <MarkdownBody markdown={markdown} />
              : <StateNotice state="loading" message="문서를 불러오고 있습니다." />}
        </div>
        {contents.length > 0 && <TableOfContents label="목차" items={contents.map((entry) => ({ id: entry.anchor, title: entry.text, depth: entry.depth }))} />}
      </div>
    </article>
  )
}

function DataPage() {
  return (
    <article>
      <Breadcrumbs label="현재 위치" items={[{ title: 'GDD', href: '/' }, { title: '데이터 사전' }]} resolveHref={toPublicHref} />
      <PageHeader kicker="게임 데이터" title="데이터 사전" lead="기존 정본의 소유 경로·스키마·레코드 수·검증 방식을 한곳에서 확인한다." />
      <TableViewport label="데이터셋 목록">
        <table>
          <thead><tr><th>데이터셋</th><th>형식</th><th>스키마</th><th>레코드</th><th>상태</th><th>검증</th></tr></thead>
          <tbody>
            {dataCatalog.map((dataset) => (
              <tr key={dataset.id}>
                <td><strong>{dataset.title}</strong><code>{dataset.ownerPath}</code></td>
                <td>{dataset.format}</td>
                <td><code>{dataset.schema}</code></td>
                <td>{dataset.records.toLocaleString('ko-KR')}{'secondary' in dataset ? <small>{dataset.secondary}</small> : null}</td>
                <td>{dataset.status}</td>
                <td>{dataset.validation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableViewport>
      <section className="gdd-data-notes">
        <h2>게시 경계</h2>
        <p>지역 설명·영토·지도 탐색은 공식 위키가 맡는다. GDD는 지역 ID, 파일 구조, 생성기와 검증 규칙만 다루며 세계지도를 복사하지 않는다.</p>
        <h2>내보내기</h2>
        <p>CSV는 정본 JSON과 문서에서 만든 교환 산출물이다. UTF-8과 안정된 기계 필드명을 사용하고, 원본 해시·스키마 판본·생성 시각을 영수증으로 남긴다.</p>
      </section>
    </article>
  )
}

export default function App() {
  useAnchorNavigation()
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/:category/:slug" element={<DocumentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
