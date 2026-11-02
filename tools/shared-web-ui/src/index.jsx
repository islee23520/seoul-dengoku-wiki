import React, { useEffect, useId, useState } from 'react'

export const suiTokens = Object.freeze({ bp: Object.freeze({ sm: 640, md: 768, lg: 1024 }) })

/** @typedef {{id: string, title: string, href: string, summary?: string, meta?: string}} DocumentLink */
/** @typedef {{id: string, title: string, href: string, documents: DocumentLink[]}} Category */

/** @param {{brand?: React.ReactNode, homeHref?: string, navigation?: React.ReactNode, children: React.ReactNode, navLabel?: string, menuLabel?: string, skipLabel?: string, footer?: React.ReactNode, site?: 'hub'|'wiki'|'gdd', theme?: 'light'|'dark'}} props */
export function SiteShell({ brand, homeHref, navigation, children, navLabel = '문서', menuLabel = '전체 메뉴', skipLabel = '본문으로 건너뛰기', footer, site = 'wiki', theme = 'light' }) {
  const hasNav = navigation != null
  return <div className={`sui-shell${hasNav ? '' : ' sui-shell--index'}`} data-sui-theme={theme} data-sui-site={site}>
    <a className="sui-skip" href="#main-content">{skipLabel}</a>
    {hasNav && <aside className="sui-sidebar">
      {brand && <a className="sui-brand" href={homeHref}>{brand}</a>}
      <details className="sui-mobile-menu"><summary>{menuLabel}</summary><nav aria-label={navLabel}>{navigation}</nav></details>
      <nav className="sui-desktop-menu" aria-label={navLabel}>{navigation}</nav>
    </aside>}
    <main id="main-content" className="sui-main"><div className="sui-content">{children}{footer && <footer className="sui-footer">{footer}</footer>}</div></main>
  </div>
}

/** @param {{kicker?: string, title: string, lead?: string, badge?: React.ReactNode}} props */
export function PageHeader({ kicker, title, lead, badge }) {
  return <header className="sui-page-header"><div>{kicker && <p className="sui-kicker">{kicker}</p>}<h1>{title}</h1>{lead && <p className="sui-lead">{lead}</p>}</div>{badge && <span className="sui-badge">{badge}</span>}</header>
}

/** @param {{title: string, href?: string, moreLabel?: string}} props */
export function SectionHeading({ title, href, moreLabel }) {
  return <div className="sui-section-heading"><h2>{title}</h2>{href && <a href={href}>{moreLabel}</a>}</div>
}

/** @param {{href: string, title: string, path: string, summary?: string, image?: {src: string, alt: string}}} props */
export function ServiceCard({ href, title, path, summary, image }) {
  return <a className="sui-card sui-service-card" href={href}>
    {image && <img src={image.src} alt={image.alt} loading="lazy" width="220" height="124" />}
    <span className="sui-card__copy"><strong className="sui-card__title">{title}</strong><span className="sui-card__path">{path}</span>{summary && <span className="sui-card__description">{summary}</span>}</span>
  </a>
}

/** @param {{href: string, title: string, path: string, summary?: string}} props */
export function ServiceTile({ href, title, path, summary }) {
  return <a className="sui-card sui-service-tile" href={href}><strong className="sui-card__title">{title}</strong><span className="sui-card__path">{path}</span>{summary && <span className="sui-card__description">{summary}</span>}</a>
}

/** @param {{label: string, code?: string}} props */
export function Chip({ label, code }) {
  return <span className="sui-chip"><strong>{label}</strong>{code && <code>{code}</code>}</span>
}

/** @param {{children: React.ReactNode}} props */
export function ChipRow({ children }) { return <div className="sui-chip-row">{children}</div> }

/** @param {{items: Category[], currentHref?: string, emptyLabel: string, resolveHref?: (href: string) => string}} props */
export function CategoryTree({ items, currentHref, emptyLabel, resolveHref = href => href }) {
  return <div className="sui-tree">{items.map(category => <CategoryBranch key={category.id} category={category} currentHref={currentHref} emptyLabel={emptyLabel} resolveHref={resolveHref} />)}</div>
}

/** @param {{category: Category, currentHref?: string, emptyLabel: string, resolveHref: (href: string) => string}} props */
function CategoryBranch({ category, currentHref, emptyLabel, resolveHref }) {
  const current = category.href === currentHref || category.documents.some(document => document.href === currentHref)
  const [expanded, setExpanded] = useState(current)
  useEffect(() => { if (current) setExpanded(true) }, [current])
  const id = useId()
  return <section className="sui-tree__branch" data-state={expanded ? 'expanded' : 'collapsed'}>
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>{category.title}<span>{category.documents.length}</span></button>
    <div id={id} hidden={!expanded} className="sui-tree__children">
      <a href={resolveHref(category.href)} aria-current={category.href === currentHref ? 'page' : undefined} data-state={category.href === currentHref ? 'current' : undefined}>{category.title}</a>
      {category.documents.length ? category.documents.map(document => <a key={document.id} href={resolveHref(document.href)} aria-current={document.href === currentHref ? 'page' : undefined} data-state={document.href === currentHref ? 'current' : undefined}>{document.title}</a>) : <span data-state="empty">{emptyLabel}</span>}
    </div>
  </section>
}

/** @param {{items: {title: string, href?: string}[], label: string, resolveHref?: (href: string) => string}} props */
export function Breadcrumbs({ items, label, resolveHref = href => href }) {
  return <nav className="sui-breadcrumbs" aria-label={label}><ol>{items.map((item, index) =>
    <li key={`${item.href ?? item.title}-${index}`}>{item.href ? <a href={resolveHref(item.href)}>{item.title}</a> : <span aria-current="page">{item.title}</span>}</li>
  )}</ol></nav>
}

/** @param {{items: {id: string, title: string, depth?: number}[], label: string, currentId?: string}} props */
export function TableOfContents({ items, label, currentId }) {
  return <aside className="sui-toc"><nav aria-label={label}>{items.map(item => <a key={item.id} className={item.depth && item.depth > 2 ? 'sui-toc__sub' : undefined} href={`#${item.id}`} aria-current={item.id === currentId ? 'location' : undefined} data-state={item.id === currentId ? 'current' : undefined}>{item.title}</a>)}</nav></aside>
}

/** @param {{children: React.ReactNode, label: string}} props */
export function TableViewport({ children, label }) {
  return <div className="sui-table-viewport" role="region" aria-label={label} tabIndex={0}>{children}</div>
}

/** @param {{items: DocumentLink[], currentHref?: string, resolveHref?: (href: string) => string, emptyLabel: string}} props */
export function DocumentList({ items, currentHref, resolveHref = href => href, emptyLabel }) {
  return <div className="sui-document-list">{items.length ? items.map(item => <DocumentListRow key={item.id} document={item} current={item.href === currentHref} href={resolveHref(item.href)} />) : <StateNotice state="empty" message={emptyLabel} />}</div>
}

/** @param {{document: DocumentLink, href?: string, current?: boolean}} props */
export function DocumentListRow({ document, href = document.href, current = false }) {
  return <a className="sui-document-row" href={href} aria-current={current ? 'page' : undefined} data-state={current ? 'current' : undefined}><strong>{document.title}</strong><span>{document.meta ?? document.href}</span>{document.summary && <small>{document.summary}</small>}</a>
}

/** @param {{label: string, value: string, onChange: (value: string) => void, placeholder?: string, id: string, resultCount?: number, countLabel?: (count: number) => string}} props */
export function QueryControl({ label, value, onChange, placeholder, id, resultCount, countLabel }) {
  return <div className="sui-query" data-state={value ? 'filled' : undefined}><label htmlFor={id}>{label}</label><input id={id} type="search" value={value} placeholder={placeholder} onChange={event => onChange(event.currentTarget.value)} />{resultCount != null && <output aria-live="polite" htmlFor={id}>{countLabel ? countLabel(resultCount) : resultCount}</output>}</div>
}

/** @param {{state: 'loading'|'empty'|'error'|'not-found', message: string, action?: {label: string, href: string}}} props */
export function StateNotice({ state, message, action }) {
  return <div className="sui-state-notice" data-state={state} role={state === 'error' ? 'alert' : 'status'}><strong aria-hidden="true">{state === 'loading' ? '…' : '—'}</strong><p>{message}</p>{action && <a href={action.href}>{action.label}</a>}</div>
}
