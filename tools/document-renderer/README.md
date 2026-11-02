# @seoul-dengoku/document-renderer

React renderer for the Seoul: Dengoku shared document content nodes. Korean-only documents use `text: { ko: ... }` and `locales: { ko: { title, summary, tense } }`; lore documents may also provide `en`. The package renders the `content` array, not the envelope. The host controls document routing and page chrome.

## Private repository integration

The source repository is private. The private GDD repository pins it as a Git submodule at `vendor/document-renderer`; the viewer depends on `file:../vendor/document-renderer`. Access requires permission to both repositories. No npm registry publication is used.

```json
{
  "dependencies": {
    "@seoul-dengoku/document-renderer": "file:../vendor/document-renderer"
  }
}
```

Run `npm ci && npm run build` in the submodule before the GDD viewer build. Node.js 20+ is required. React 18+ is a peer dependency. The package uses the root ESM entry (`main`, `types`, and `exports` all point to `dist`).

## API

```tsx
import { DocumentContent, fromGddBlocks, renderDocumentMarkdown } from '@seoul-dengoku/document-renderer';
import type { DocumentNode, DocumentLink } from '@seoul-dengoku/document-renderer';

// The wiki/lore or new GDD art authoring shape, either Korean-only or bilingual:
const document = {
  locales: { ko: { title: '인물 미술', summary: '기준', tense: 'present' } },
  content: [
    { kind: 'heading', anchor: 'art-title', depth: 1, text: { ko: '인물 미술' } },
    { kind: 'paragraph', anchor: 'art-body', text: { ko: '본문' } }
  ] satisfies DocumentNode[]
};

const resolveLink = (link: DocumentLink): string | undefined =>
  link.domain === 'gdd' ? `/design/${link.slug}${link.anchor ? `#${link.anchor}` : ''}` : undefined;

<DocumentContent content={document.content} locale="ko" resolveLink={resolveLink} />;
const markdown = renderDocumentMarkdown(document, 'ko', resolveLink);

// For existing normalized GDD JSON; no source files are changed:
<DocumentContent content={fromGddBlocks(gddDocument)} locale="ko" resolveLink={resolveLink} />;
```

`DocumentContent` accepts `{ content, locale: 'ko' | 'en', resolveLink? }`. Each node's authored `anchor` becomes its HTML `id`; the renderer never generates slug anchors. Text may be a plain string or inline runs (`{text, strong?, link?, href?}`). `resolveLink({domain, slug, anchor?})` returns a URL for an internal link; when absent or unresolved, the text remains plain. External `href` runs use their authored URL. English selection falls back to Korean on Korean-only nodes. For stable navigation, document producers must supply unique anchors.

`DocumentContent` also accepts `loadMermaid`, a host-supplied lazy loader such as `() => import('mermaid')`. Code nodes (and WIKI mdast `code` blocks) whose language is `mermaid` first render as the usual code block; after mount the loader runs, `mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })` is called and the SVG replaces the block. If loading or parsing fails, the source stays visible with a `role="alert"` note. Without `loadMermaid` the output is unchanged. `MermaidDiagram({ id, source, load })` is exported for hosts that render Markdown themselves (for example a `react-markdown` `pre` override). The package does not depend on `mermaid`; each host adds it.

`renderDocumentMarkdown(document, locale, resolveLink?)` converts the same authoring envelope to Markdown, including explicit authored anchors and all seven node kinds. It does not generate a title from `locales`; include a heading in `content` when needed. `fromGddBlocks(document)` projects the legacy normalized `blocks` in `document.blockIds` order, with each block ID retained as an anchor. It is a display adapter, not a lossless Markdown exporter: GDD-specific nested list continuations, raw table whitespace, reference definition syntax, and Markdown embedded in plain text are not rewritten as structured authoring nodes. The two new GDD art documents should author the shared `content` shape directly.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```
