import type { ReactNode } from 'react'

export interface DocumentLink { id: string; title: string; href: string; summary?: string; meta?: string }
export interface Category { id: string; title: string; href: string; documents: DocumentLink[] }
export const suiTokens: Readonly<{bp: Readonly<{sm: 640; md: 768; lg: 1024}>}>
export function SiteShell(props: {brand?: ReactNode; homeHref?: string; navigation?: ReactNode; children: ReactNode; navLabel?: string; menuLabel?: string; skipLabel?: string; footer?: ReactNode; site?: 'hub'|'wiki'|'gdd'; theme?: 'light'|'dark'}): ReactNode
export function PageHeader(props: {kicker?: string; title: string; lead?: string; badge?: ReactNode}): ReactNode
export function SectionHeading(props: {title: string; href?: string; moreLabel?: string}): ReactNode
export function ServiceCard(props: {href: string; title: string; path: string; summary?: string; image?: {src: string; alt: string}}): ReactNode
export function ServiceTile(props: {href: string; title: string; path: string; summary?: string}): ReactNode
export function Chip(props: {label: string; code?: string}): ReactNode
export function ChipRow(props: {children: ReactNode}): ReactNode
export function CategoryTree(props: {items: Category[]; currentHref?: string; emptyLabel: string; resolveHref?: (href: string) => string}): ReactNode
export function Breadcrumbs(props: {items: {title: string; href?: string}[]; label: string; resolveHref?: (href: string) => string}): ReactNode
export function TableOfContents(props: {items: {id: string; title: string; depth?: number}[]; label: string; currentId?: string}): ReactNode
export function TableViewport(props: {children: ReactNode; label: string}): ReactNode
export function DocumentList(props: {items: DocumentLink[]; currentHref?: string; resolveHref?: (href: string) => string; emptyLabel: string}): ReactNode
export function DocumentListRow(props: {document: DocumentLink; href?: string; current?: boolean}): ReactNode
export function QueryControl(props: {label: string; value: string; onChange: (value: string) => void; placeholder?: string; id: string; resultCount?: number; countLabel?: (count: number) => string}): ReactNode
export function StateNotice(props: {state: 'loading'|'empty'|'error'|'not-found'; message: string; action?: {label: string; href: string}}): ReactNode
