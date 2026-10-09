import { useId, useState } from 'react'
import { DocumentContent, type DocumentContentProps } from '@seoul-dengoku/document-renderer'
import { StateNotice } from '@seoul-dengoku/shared-web-ui'
import { ArchifyContractError, archifyHref, parseArchifyManifest, parseArchifyReference, resolveArchifyReference, type ArchifyManifest } from './archify-contract.mjs'
import './archify.css'

const generated = import.meta.glob('./generated/archify-manifest.json', { eager: true, import: 'default' })
const registered = parseArchifyManifest(generated['./generated/archify-manifest.json'] ?? { schemaVersion: 1, diagrams: [] })

export function ArchifyDiagram({ source, manifest = registered }: { readonly source: string; readonly manifest?: ArchifyManifest }) {
  const labelId = useId()
  const [expanded, setExpanded] = useState(false)
  let entry
  try {
    entry = resolveArchifyReference(parseArchifyReference(source), manifest)
  } catch (error) {
    if (!(error instanceof ArchifyContractError)) throw error
    return <StateNotice state="error" message="등록된 다이어그램을 찾을 수 없습니다." />
  }
  const href = archifyHref(entry)
  return (
    <section className="gdd-archify" aria-labelledby={labelId}>
      <div className="gdd-archify-toolbar">
        <strong id={labelId}>{entry.moduleTitle}</strong>
        <div>
          <button type="button" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? '기본 높이' : '높이 확대'}</button>
          <a href={href} target="_blank" rel="noopener noreferrer">전체 화면으로 열기</a>
        </div>
      </div>
      <div className="gdd-archify-viewport" style={{ height: expanded ? '85vh' : '36rem' }}>
        <iframe src={href} title={entry.moduleTitle} loading="lazy" sandbox="allow-scripts" referrerPolicy="no-referrer" />
      </div>
    </section>
  )
}

// The shared renderer has no code-node override. Intercept only Archify and
// delegate every other node, including Mermaid and its anchors, unchanged.
export function GddDocumentContent({ content, locale, manifest = registered, ...props }: DocumentContentProps & { readonly manifest?: ArchifyManifest }) {
  return <>{content.map((node, index) => node.kind === 'code' && node.language === 'archify'
    ? <div key={node.anchor} id={node.anchor}><ArchifyDiagram source={locale === 'en' ? node.text.en ?? node.text.ko : node.text.ko} manifest={manifest} /></div>
    : <DocumentContent key={node.kind === 'wiki' ? index : node.anchor} content={[node]} locale={locale} {...props} />)}</>
}
