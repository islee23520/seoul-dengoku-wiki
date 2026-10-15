import React from 'react'
import { createRoot } from 'react-dom/client'
import { DocumentContent } from '@seoul-dengoku/document-renderer'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { wikiArticleContent } from './wikiDocument'
import articleKo from '../.omo/private/seoul-migration/k1003-k1004-approved-source-draft-v2/rendered-article-ko.md?raw'
import articleEn from '../.omo/private/seoul-migration/k1003-k1004-approved-source-draft-v2/rendered-article-en.md?raw'
import cardKo from '../.omo/private/seoul-migration/k1003-k1004-approved-source-draft-v2/rendered-card-ko.md?raw'
import cardEn from '../.omo/private/seoul-migration/k1003-k1004-approved-source-draft-v2/rendered-card-en.md?raw'
import './index.css'

const locale = new URLSearchParams(location.search).get('locale') === 'en' ? 'en' : 'ko'
const card = new URLSearchParams(location.search).get('unit') === 'card'
const markdown = card ? (locale === 'ko' ? cardKo : cardEn) : (locale === 'ko' ? articleKo : articleEn)
const blocks = fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children
const content = wikiArticleContent(blocks)

createRoot(document.getElementById('root')).render(
  <main style={{ maxWidth: 1100, margin: 'auto', padding: '24px' }}>
    <p>비공개 시안 · 실제 DocumentContent 렌더 · 미배포</p>
    <article lang={locale} className="wiki-prose">
      <DocumentContent content={content} locale={locale} resolveHref={href => href} />
    </article>
  </main>,
)
