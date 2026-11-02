import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentContent, fromGddBlocks, fromWikiBlocks, renderDocumentMarkdown } from '../dist/index.js';

test('renders Korean-only nodes, semantic structures, links, and source anchors', () => {
  // Given a Korean-only art document in the shared content shape.
  const content = [
    { kind: 'heading', anchor: 'art-title', depth: 1, text: { ko: '인물 미술' } },
    { kind: 'paragraph', anchor: 'art-p', text: { ko: [{ text: '강조', strong: true }, { text: ' 내부', link: { domain: 'gdd', slug: 'art/character-art' } }, { text: ' 외부', href: 'https://example.org' }] } },
    { kind: 'quote', anchor: 'art-q', text: { ko: '인용' } },
    { kind: 'rule', anchor: 'art-r' },
    { kind: 'list', anchor: 'art-l', ordered: true, start: 3, items: [{ ko: '셋' }] },
    { kind: 'table', anchor: 'art-t', columns: [{ ko: '이름' }], rows: [[{ ko: '값' }]] },
    { kind: 'code', anchor: 'art-c', language: 'text', text: { ko: '<실물>\n' } }
  ];
  // When rendered for Korean readers.
  const html = renderToStaticMarkup(createElement(DocumentContent, { content, locale: 'ko', resolveLink: link => `/docs/${link.slug}` }));
  // Then every node has its authored anchor and the content is safely escaped.
  assert.match(html, /<h1 id="art-title">인물 미술<\/h1>/);
  assert.match(html, /<strong>강조<\/strong><a href="\/docs\/art\/character-art"> 내부<\/a><a href="https:\/\/example.org"> 외부<\/a>/);
  assert.match(html, /<blockquote id="art-q">인용<\/blockquote><hr id="art-r"\/><ol id="art-l" start="3"><li>셋<\/li><\/ol>/);
  assert.match(html, /<table id="art-t"><thead><tr><th scope="col">이름<\/th><\/tr><\/thead><tbody><tr><td>값<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<pre id="art-c"><code class="language-text">&lt;실물&gt;\n<\/code><\/pre>/);
});

test('selects bilingual text and leaves unresolved document links unlinked', () => {
  // Given a bilingual lore heading and link run.
  const content = [{ kind: 'paragraph', anchor: 'lore-p', text: { ko: [{ text: '한글', link: { domain: 'places', slug: 'place' } }], en: [{ text: 'English', link: { domain: 'places', slug: 'place' } }] } }];
  // When the host does not resolve the target.
  const html = renderToStaticMarkup(createElement(DocumentContent, { content, locale: 'en' }));
  // Then English is shown without inventing a destination.
  assert.equal(html, '<p id="lore-p">English</p>');
});

test('adapts GDD blocks in document order without editing input', () => {
  // Given normalized blocks stored out of document order.
  const document = {
    document: { blockIds: ['heading.1', 'paragraph.1', 'list.1', 'table.1'] },
    blocks: [
      { id: 'table.1', kind: 'table', header: ['칸'], rows: [['값']] },
      { id: 'list.1', kind: 'list', ordered: false, items: [[{ kind: 'text', text: '항목' }]] },
      { id: 'paragraph.1', kind: 'paragraph', lines: [[{ kind: 'text', text: '첫 줄' }], [{ kind: 'docLink', text: '다음 줄', targetDocumentId: 'doc.Next' }]] },
      { id: 'heading.1', kind: 'heading', level: 2, inlines: [{ kind: 'text', text: '제목' }] }
    ]
  };
  const before = JSON.stringify(document);
  // When adapted and rendered through the public API.
  const html = renderToStaticMarkup(createElement(DocumentContent, { content: fromGddBlocks(document), locale: 'ko', resolveLink: link => `/gdd/${link.slug}` }));
  // Then source order and block IDs survive without source mutation.
  assert.match(html, /^<h2 id="heading.1">제목<\/h2><p id="paragraph.1">첫 줄\n<a href="\/gdd\/doc.Next">다음 줄<\/a><\/p><ul id="list.1">/);
  assert.match(html, /<table id="table.1">/);
  assert.equal(JSON.stringify(document), before);
});

test('rejects missing block IDs rather than silently dropping content', () => {
  // Given a document referencing a nonexistent block.
  const document = { document: { blockIds: ['missing'] }, blocks: [] };
  // When adapting the document, then the content loss is explicit.
  assert.throws(() => fromGddBlocks(document), /Missing GDD block: missing/);
});

test('renders all shared nodes to Markdown with anchors and resolved runs', () => {
  // Given a Korean-only document using every node and a longer code fence inside its text.
  const document = { locales: { ko: { title: '미술', summary: '기준', tense: 'present' } }, content: [
    { kind: 'heading', anchor: 'title', depth: 2, text: { ko: '미술' } },
    { kind: 'paragraph', anchor: 'body', text: { ko: [{ text: '강조', strong: true }, { text: ' 내부', link: { domain: 'gdd', slug: 'art/art' } }, { text: ' 외부', href: 'https://example.org' }] } },
    { kind: 'quote', anchor: 'quote', text: { ko: '첫 줄\n둘째 줄' } },
    { kind: 'rule', anchor: 'rule' },
    { kind: 'list', anchor: 'list', ordered: true, start: 3, items: [{ ko: '셋' }, { ko: '넷' }] },
    { kind: 'table', anchor: 'table', columns: [{ ko: '열' }], rows: [[{ ko: '값|둘' }]] },
    { kind: 'code', anchor: 'code', language: 'text', text: { ko: '```\n<실물>' } }
  ] };
  // When the host resolves internal links.
  const markdown = renderDocumentMarkdown(document, 'ko', link => `/design/${link.slug}`);
  // Then all authored anchors and Markdown structures survive without altering the input.
  assert.match(markdown, /^<a id="title"><\/a>\n## 미술\n\n<a id="body"><\/a>\n\*\*강조\*\* \[내부\]\(\/design\/art\/art\) \[외부\]\(https:\/\/example.org\)/);
  assert.match(markdown, /<a id="quote"><\/a>\n> 첫 줄\n> 둘째 줄\n\n<a id="rule"><\/a>\n---/);
  assert.match(markdown, /<a id="list"><\/a>\n3\. 셋\n4\. 넷/);
  assert.match(markdown, /<a id="table"><\/a>\n\| 열 \|\n\| --- \|\n\| 값\\\|둘 \|/);
  assert.match(markdown, /<a id="code"><\/a>\n````text\n```\n<실물>\n````\n$/);
});

test('selects English and leaves unresolved links as text in Markdown', () => {
  // Given a bilingual lore node with a linked run.
  const document = { locales: { ko: { title: '제목', summary: '요약', tense: 'past' }, en: { title: 'Title', summary: 'Summary', tense: 'past' } }, content: [
    { kind: 'paragraph', anchor: 'p', text: { ko: [{ text: '한글', link: { domain: 'places', slug: 'place' } }], en: [{ text: 'English', link: { domain: 'places', slug: 'place' } }] } }
  ] };
  // When the English link has no host route.
  const markdown = renderDocumentMarkdown(document, 'en');
  // Then its text stays visible without a fabricated URL.
  assert.equal(markdown, '<a id="p"></a>\nEnglish\n');
});

test('adapts WIKI mdast blocks with nested list, inline semantics, table, and anchors', () => {
  const blocks = [
    { type: 'heading', depth: 2, children: [{ type: 'text', value: '2126년: 개막' }] },
    { type: 'paragraph', children: [{ type: 'text', value: '2126년 ' }, { type: 'emphasis', children: [{ type: 'strong', children: [{ type: 'text', value: '시작' }] }] }, { type: 'break' }, { type: 'delete', children: [{ type: 'text', value: '이전' }] }, { type: 'inlineCode', value: '<tag>' }] },
    { type: 'paragraph', children: [{ type: 'text', value: '2126년 중복' }] },
    { type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: '인용' }] }] },
    { type: 'list', ordered: true, start: 3, children: [
      { type: 'listItem', children: [
        { type: 'paragraph', children: [
          { type: 'link', url: '/world/Other.md#part', children: [{ type: 'text', value: '내부' }] },
          { type: 'image', url: '/asset.png', alt: '지도' },
          { type: 'text', value: ' ' }, { type: 'image', url: '/fallback.png', value: '대체' }
        ] },
        { type: 'list', ordered: false, children: [
          { type: 'listItem', checked: false, children: [{ type: 'paragraph', children: [{ type: 'text', value: '하위' }] }] }
        ] }
      ] }
    ] },
    { type: 'table', align: ['left', 'right'], children: [{ type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: '열' }] }, { type: 'tableCell', children: [{ type: 'text', value: '수' }] }] }, { type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: '값' }] }, { type: 'tableCell', children: [{ type: 'text', value: '1' }] }] }] },
    { type: 'code', lang: 'ts', meta: 'sample', value: '<code>' }, { type: 'thematicBreak' }, { type: 'html', value: '<a id="legacy-anchor">' }
  ];
  const before = JSON.stringify(blocks);
  const content = fromWikiBlocks(blocks);
  const html = renderToStaticMarkup(createElement(DocumentContent, { content, locale: 'ko', resolveHref: href => href.startsWith('/world/') ? href.replace(/\.md(?=#|$)/, '') : href }));
  assert.match(html, /^<h2 id="2126년-개막">2126년: 개막<\/h2><p id="2126년">2126년 <em><strong>시작<\/strong><\/em><br\/><del>이전<\/del><code>&lt;tag&gt;<\/code><\/p><p>2126년 중복<\/p>/);
  assert.match(html, /<blockquote><p>인용<\/p><\/blockquote><ol start="3"><li><p><a href="\/world\/Other#part">내부<\/a><img src="\/asset.png" alt="지도"\/> <img src="\/fallback.png" alt="대체"\/><\/p><ul><li><input type="checkbox" disabled=""\/><p>하위<\/p><\/li><\/ul><\/li><\/ol>/);
  assert.match(html, /<table><thead><tr><th scope="col" style="text-align:left">열<\/th><th scope="col" style="text-align:right">수<\/th><\/tr><\/thead><tbody><tr><td style="text-align:left">값<\/td><td style="text-align:right">1<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<pre><code class="language-ts">&lt;code&gt;<\/code><\/pre><hr\/><span id="legacy-anchor"><\/span>$/);
  assert.equal(JSON.stringify(blocks), before);
});

test('WIKI heading wins over an identical year anchor and unsupported HTML is not injected', () => {
  const content = fromWikiBlocks([
    { type: 'heading', depth: 2, children: [{ type: 'text', value: '2126년' }] },
    { type: 'paragraph', children: [{ type: 'text', value: '2126년 첫해' }] },
    { type: 'html', value: '<script>alert(1)</script>' }
  ]);
  assert.equal(renderToStaticMarkup(createElement(DocumentContent, { content, locale: 'ko' })), '<h2 id="2126년">2126년</h2><p>2126년 첫해</p>');
  assert.throws(() => fromWikiBlocks([{ type: 'unknown' }]), /Unsupported WIKI node: unknown/);
});

test('nested WIKI headings reserve years and paragraphs allocate first year in document order', () => {
  const blocks = [
    { type: 'blockquote', children: [
      { type: 'paragraph', children: [{ type: 'text', value: '2124년 첫 기록' }] },
      { type: 'heading', depth: 3, children: [{ type: 'text', value: '2125년' }] }
    ] },
    { type: 'list', ordered: false, children: [
      { type: 'listItem', children: [
        { type: 'paragraph', children: [{ type: 'text', value: '2124년 반복' }] },
        { type: 'paragraph', children: [{ type: 'text', value: '2125년 제목과 겹침' }] },
        { type: 'paragraph', children: [{ type: 'text', value: '2126년 목록 기록' }] }
      ] }
    ] },
    { type: 'paragraph', children: [{ type: 'text', value: '2126년 뒤의 기록' }] }
  ];
  const before = JSON.stringify(blocks);
  const html = renderToStaticMarkup(createElement(DocumentContent, { content: fromWikiBlocks(blocks), locale: 'ko' }));
  assert.equal(html, '<blockquote><p id="2124년">2124년 첫 기록</p><h3 id="2125년">2125년</h3></blockquote><ul><li><p>2124년 반복</p><p>2125년 제목과 겹침</p><p id="2126년">2126년 목록 기록</p></li></ul><p>2126년 뒤의 기록</p>');
  assert.equal(JSON.stringify(blocks), before);
});

test('a Mermaid block first renders as its code block with or without a host loader', () => {
  // Given one structured and one WIKI Markdown Mermaid block, and a loader that must not run during server rendering.
  const source = 'flowchart LR\n  A --> B';
  const loadMermaid = () => { throw new Error('the loader runs only after mount'); };
  const structured = [{ kind: 'code', anchor: 'flow', language: 'mermaid', text: { ko: source } }];
  const wiki = fromWikiBlocks([{ type: 'code', lang: 'mermaid', value: source }]);
  const plain = '<pre id="flow"><code class="language-mermaid">flowchart LR\n  A --&gt; B</code></pre>';
  // When rendered statically.
  // Then the markup equals the existing code block, so hosts without a loader and failed diagrams keep the source.
  assert.equal(renderToStaticMarkup(createElement(DocumentContent, { content: structured, locale: 'ko' })), plain);
  assert.equal(renderToStaticMarkup(createElement(DocumentContent, { content: structured, locale: 'ko', loadMermaid })), plain);
  assert.equal(renderToStaticMarkup(createElement(DocumentContent, { content: wiki, locale: 'ko', loadMermaid })), '<pre id="mermaid-0"><code class="language-mermaid">flowchart LR\n  A --&gt; B</code></pre>');
  assert.equal(renderToStaticMarkup(createElement(DocumentContent, { content: wiki, locale: 'ko' })), '<pre><code class="language-mermaid">flowchart LR\n  A --&gt; B</code></pre>');
});
