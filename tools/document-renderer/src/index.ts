import { createElement, Fragment, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'ko' | 'en';
export type DocumentLink = { readonly domain: string; readonly slug: string; readonly anchor?: string };
export type TextRun = { readonly text: string; readonly strong?: true; readonly link?: DocumentLink; readonly href?: string };
export type TextValue = string | readonly TextRun[];
export type Localized<T> = { readonly ko: T; readonly en?: T };
export type DocumentNode =
  | { readonly kind: 'heading'; readonly anchor: string; readonly depth: 1 | 2 | 3 | 4 | 5 | 6; readonly text: Localized<TextValue> }
  | { readonly kind: 'paragraph' | 'quote'; readonly anchor: string; readonly text: Localized<TextValue> }
  | { readonly kind: 'rule'; readonly anchor: string }
  | { readonly kind: 'list'; readonly anchor: string; readonly ordered?: true; readonly start?: number; readonly items: readonly Localized<TextValue>[] }
  | { readonly kind: 'table'; readonly anchor: string; readonly columns: readonly Localized<TextValue>[]; readonly rows: readonly (readonly Localized<TextValue>[])[] }
  | { readonly kind: 'code'; readonly anchor: string; readonly language: string; readonly info?: string; readonly text: Localized<string> };

export type DocumentEnvelope = {
  readonly locales: { readonly ko: { readonly title: string; readonly summary: string; readonly tense: 'past' | 'present' }; readonly en?: { readonly title: string; readonly summary: string; readonly tense: 'past' | 'present' } };
  readonly content: readonly DocumentNode[];
};

/** Position-free mdast nodes emitted by the WIKI catalog's GFM parser. */
export type WikiBlock = {
  readonly type: string;
  readonly value?: string;
  readonly url?: string;
  readonly alt?: string;
  readonly depth?: number;
  readonly ordered?: boolean;
  readonly checked?: boolean | null;
  readonly start?: number;
  readonly lang?: string | null;
  readonly meta?: string | null;
  readonly align?: readonly (string | null)[];
  readonly children?: readonly WikiBlock[];
};

export type WikiContentNode = { readonly kind: 'wiki'; readonly node: WikiBlock; readonly anchors: ReadonlyMap<WikiBlock, string> };

export type DocumentContentProps = {
  readonly content: readonly (DocumentNode | WikiContentNode)[];
  readonly locale: Locale;
  readonly resolveLink?: (link: DocumentLink) => string | undefined;
  readonly resolveHref?: (href: string) => string;
  /** Host-supplied lazy loader, e.g. `() => import('mermaid')`. Without it, Mermaid code stays a code block. */
  readonly loadMermaid?: () => Promise<MermaidModule>;
};

/** The subset of the `mermaid` package API the renderer uses. */
export type MermaidApi = {
  readonly initialize: (config: { readonly startOnLoad: false; readonly securityLevel: 'strict' }) => void;
  readonly parse: (text: string) => Promise<unknown>;
  readonly render: (id: string, text: string) => Promise<{ readonly svg: string }>;
};
export type MermaidModule = MermaidApi | { readonly default: MermaidApi };

let mermaidRenderCount = 0;

export type MermaidDiagramProps = { readonly id: string; readonly source: string; readonly load: () => Promise<MermaidModule> };

/** First renders the source as a code block, then swaps in the SVG; a failed diagram keeps its source visible. */
export function MermaidDiagram({ id, source, load }: MermaidDiagramProps): ReactNode {
  const [state, setState] = useState<{ readonly svg?: string; readonly error?: string }>({});
  useEffect(() => {
    let active = true;
    load().then(async module => {
      const mermaid = 'default' in module ? module.default : module;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      // Parse first: render() inserts an error graphic into the page body when the source is invalid.
      await mermaid.parse(source);
      mermaidRenderCount += 1;
      return mermaid.render(`document-mermaid-${mermaidRenderCount}`, source);
    }).then(({ svg }) => { if (active) setState({ svg }); },
      (error: unknown) => { if (active) setState({ error: error instanceof Error ? error.message : String(error) }); });
    return () => { active = false; };
  }, [load, source]);
  if (state.svg) return createElement('figure', { id, className: 'document-diagram', dangerouslySetInnerHTML: { __html: state.svg } });
  const code = createElement('pre', { id }, createElement('code', { className: 'language-mermaid' }, source));
  return state.error ? createElement(Fragment, null, code, createElement('p', { className: 'document-diagram-error', role: 'alert' }, `다이어그램을 그리지 못했습니다: ${state.error}`)) : code;
}

function selected<T>(value: Localized<T>, locale: Locale): T {
  return (locale === 'en' ? value.en : undefined) ?? value.ko;
}

function inline(value: TextValue, resolveLink: DocumentContentProps['resolveLink']): ReactNode {
  if (typeof value === 'string') return value;
  return value.map((run, index) => {
    const text = run.strong ? createElement('strong', null, run.text) : run.text;
    const href = run.link ? resolveLink?.(run.link) : run.href;
    return createElement(Fragment, { key: index }, href ? createElement('a', { href }, text) : text);
  });
}

function wikiText(node: WikiBlock): string {
  return node.value ?? node.children?.map(wikiText).join('') ?? '';
}

function wikiHeadingId(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
}

/** Retains mdast nesting and WIKI's heading/year anchor policy without touching source nodes. */
export function fromWikiBlocks(blocks: readonly WikiBlock[]): WikiContentNode[] {
  const headingIds = new Set<string>();
  const datedYears = new Set<string>();
  const anchors = new Map<WikiBlock, string>();
  const supported = new Set(['text', 'heading', 'paragraph', 'strong', 'emphasis', 'delete', 'inlineCode', 'code', 'break', 'thematicBreak', 'blockquote', 'list', 'listItem', 'table', 'tableRow', 'tableCell', 'link', 'image', 'html']);
  const collectHeadings = (node: WikiBlock): void => {
    if (!supported.has(node.type)) throw new TypeError(`Unsupported WIKI node: ${node.type}`);
    if (node.type === 'heading') headingIds.add(wikiHeadingId(wikiText(node)));
    node.children?.forEach(collectHeadings);
  };
  blocks.forEach(collectHeadings);
  const allocate = (node: WikiBlock): void => {
    if (node.type === 'heading') anchors.set(node, wikiHeadingId(wikiText(node)));
    if (node.type === 'paragraph') {
      const year = wikiText(node).match(/(?:^|\s)((?:20|21)\d{2})년/u)?.[1];
      if (year && !datedYears.has(year) && !headingIds.has(`${year}년`)) {
        datedYears.add(year);
        anchors.set(node, `${year}년`);
      }
    }
    node.children?.forEach(allocate);
  };
  blocks.forEach(allocate);
  return blocks.map(node => ({ kind: 'wiki', node, anchors }));
}

function wikiInline(node: WikiBlock, key: number, resolveHref: DocumentContentProps['resolveHref'], anchors: ReadonlyMap<WikiBlock, string>, loadMermaid?: DocumentContentProps['loadMermaid']): ReactNode {
  const children = node.children?.map((child, index) => wikiInline(child, index, resolveHref, anchors, loadMermaid));
  const anchor = anchors.get(node);
  const props = { key, ...(anchor ? { id: anchor } : {}) };
  switch (node.type) {
    case 'text': return node.value;
    case 'heading': return createElement(`h${Math.max(1, Math.min(node.depth ?? 2, 6))}`, props, children);
    case 'paragraph': return createElement('p', props, children);
    case 'strong': return createElement('strong', props, children);
    case 'emphasis': return createElement('em', props, children);
    case 'delete': return createElement('del', props, children);
    case 'inlineCode': return createElement('code', props, node.value);
    case 'code': return node.lang === 'mermaid' && loadMermaid
      ? createElement(MermaidDiagram, { key, id: anchor ?? `mermaid-${key}`, source: node.value ?? '', load: loadMermaid })
      : createElement('pre', props, createElement('code', node.lang ? { className: `language-${node.lang}` } : null, node.value));
    case 'break': return createElement('br', props);
    case 'thematicBreak': return createElement('hr', props);
    case 'blockquote': return createElement('blockquote', props, children);
    case 'list': return createElement(node.ordered ? 'ol' : 'ul', { ...props, ...(node.ordered ? { start: node.start } : {}) }, children);
    case 'listItem': return createElement('li', props,
      node.checked === null || node.checked === undefined ? null : createElement('input', { type: 'checkbox', checked: node.checked, disabled: true }), children);
    case 'table': {
      const cells = (row: WikiBlock, header: boolean): ReactNode => row.children?.map((cell, index) =>
        createElement(header ? 'th' : 'td', {
          key: index,
          ...(header ? { scope: 'col' } : {}),
          ...(node.align?.[index] ? { style: { textAlign: node.align[index] } } : {})
        }, cell.children?.map((child, childIndex) => wikiInline(child, childIndex, resolveHref, anchors))));
      return createElement('table', props,
        createElement('thead', null, createElement('tr', null, node.children?.[0] ? cells(node.children[0], true) : null)),
        createElement('tbody', null, node.children?.slice(1).map((row, index) => createElement('tr', { key: index }, cells(row, false)))));
    }
    case 'tableRow': return createElement('tr', props, children);
    case 'tableCell': return createElement('td', props, children);
    case 'link': return createElement('a', { ...props, href: resolveHref?.(node.url ?? '') ?? node.url, rel: node.url?.startsWith('http') ? 'noreferrer' : undefined }, children);
    case 'image': return createElement('img', { ...props, src: node.url, alt: node.alt ?? node.value ?? '' });
    case 'html': {
      const id = node.value?.match(/^<a id="([^"<>]+)">$/)?.[1];
      return id ? createElement('span', { ...props, id }) : null;
    }
    default: throw new TypeError(`Unsupported WIKI node: ${node.type}`);
  }
}

export function DocumentContent({ content, locale, resolveLink, resolveHref, loadMermaid }: DocumentContentProps): ReactNode {
  return createElement(Fragment, null, ...content.map((node, index) => {
    switch (node.kind) {
      case 'wiki': return wikiInline(node.node, index, resolveHref, node.anchors, loadMermaid);
    }
    const id = node.anchor;
    switch (node.kind) {
      case 'heading': return createElement(`h${node.depth}`, { key: id, id }, inline(selected(node.text, locale), resolveLink));
      case 'paragraph': return createElement('p', { key: id, id }, inline(selected(node.text, locale), resolveLink));
      case 'quote': return createElement('blockquote', { key: id, id }, inline(selected(node.text, locale), resolveLink));
      case 'rule': return createElement('hr', { key: id, id });
      case 'list': return createElement(node.ordered ? 'ol' : 'ul', { key: id, id, ...(node.ordered ? { start: node.start } : {}) },
        ...node.items.map((item, index) => createElement('li', { key: index }, inline(selected(item, locale), resolveLink))));
      case 'table': return createElement('table', { key: id, id },
        createElement('thead', null, createElement('tr', null, ...node.columns.map((cell, index) => createElement('th', { key: index, scope: 'col' }, inline(selected(cell, locale), resolveLink))))),
        createElement('tbody', null, ...node.rows.map((row, rowIndex) => createElement('tr', { key: rowIndex }, ...row.map((cell, index) => createElement('td', { key: index }, inline(selected(cell, locale), resolveLink)))))));
      case 'code': return node.language === 'mermaid' && loadMermaid
        ? createElement(MermaidDiagram, { key: id, id, source: selected(node.text, locale), load: loadMermaid })
        : createElement('pre', { key: id, id }, createElement('code', { className: `language-${node.language}` }, selected(node.text, locale)));
      default: return assertNever(node);
    }
  }));
}

/** Renders the shared authoring shape for static Markdown publication. */
export function renderDocumentMarkdown(document: DocumentEnvelope, locale: Locale, resolveLink?: DocumentContentProps['resolveLink']): string {
  const escapeText = (text: string): string => text.replace(/([\\`*_{}\[\]<>])/g, '\\$1');
  const valueText = (value: TextValue): string => typeof value === 'string' ? escapeText(value) : value.map(run => {
    const text = escapeText(run.text);
    const marked = run.strong ? `**${text}**` : text;
    const href = run.link ? resolveLink?.(run.link) : run.href;
    if (!href) return marked;
    const leading = marked.match(/^\s*/u)?.[0] ?? '';
    return `${leading}[${marked.slice(leading.length)}](${href.replace(/([\\()])/g, '\\$1')})`;
  }).join('');
  const localized = (value: Localized<TextValue>): string => valueText(selected(value, locale));
  return document.content.map(node => {
    const anchor = `<a id="${node.anchor.replace(/[&"<>]/g, char => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[char] ?? char)}"></a>`;
    let body: string;
    switch (node.kind) {
      case 'heading': body = `${'#'.repeat(node.depth)} ${localized(node.text)}`; break;
      case 'paragraph': body = localized(node.text); break;
      case 'quote': body = localized(node.text).split('\n').map(line => `> ${line}`).join('\n'); break;
      case 'rule': body = '---'; break;
      case 'list': body = node.items.map((item, index) => `${node.ordered ? `${(node.start ?? 1) + index}.` : '-'} ${localized(item)}`).join('\n'); break;
      case 'table': {
        const cell = (value: Localized<TextValue>): string => localized(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
        body = [`| ${node.columns.map(cell).join(' | ')} |`, `| ${node.columns.map(() => '---').join(' | ')} |`, ...node.rows.map(row => `| ${row.map(cell).join(' | ')} |`)].join('\n');
        break;
      }
      case 'code': {
        const text = selected(node.text, locale);
        const fence = '`'.repeat(Math.max(3, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1)));
        body = `${fence}${node.language}${node.info ? ` ${node.info}` : ''}\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}`;
        break;
      }
      default: return assertNever(node);
    }
    return `${anchor}\n${body}`;
  }).join('\n\n') + '\n';
}

function assertNever(value: never): never { throw new TypeError(`Unknown document node: ${String(value)}`); }

export type GddInline =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'link'; readonly text: string; readonly href: string }
  | { readonly kind: 'docLink'; readonly text: string; readonly targetDocumentId: string };
export type GddListItem = readonly GddInline[] | {
  readonly inlines: readonly GddInline[];
  readonly continuation?: readonly string[];
  readonly children?: { readonly ordered: boolean; readonly indent: 2 | 3; readonly items: readonly (readonly GddInline[])[] };
};
export type GddBlock =
  | { readonly kind: 'heading'; readonly id: string; readonly level: 1 | 2 | 3 | 4; readonly inlines: readonly GddInline[] }
  | { readonly kind: 'paragraph'; readonly id: string; readonly inlines?: readonly GddInline[]; readonly lines?: readonly (readonly GddInline[])[] }
  | { readonly kind: 'blockQuote'; readonly id: string; readonly lines: readonly (readonly GddInline[])[] }
  | { readonly kind: 'thematicBreak'; readonly id: string; readonly marker: '---' }
  | { readonly kind: 'list'; readonly id: string; readonly ordered: boolean; readonly items: readonly GddListItem[] }
  | { readonly kind: 'table'; readonly id: string; readonly header: readonly string[]; readonly rows?: readonly (readonly string[])[]; readonly rawRows?: readonly (readonly string[])[] }
  | { readonly kind: 'codeFence'; readonly id: string; readonly info: string; readonly text: string }
  | { readonly kind: 'linkReferenceDefinition'; readonly id: string; readonly label: string; readonly href: string };
export type GddDocument = { readonly document: { readonly blockIds: readonly string[] }; readonly blocks: readonly GddBlock[] };

function gddText(inlines: readonly GddInline[]): TextRun[] {
  return inlines.map(item => {
    switch (item.kind) {
      case 'text': return { text: item.text };
      case 'link': return { text: item.text, href: item.href };
      case 'docLink': return { text: item.text, link: { domain: 'gdd', slug: item.targetDocumentId } };
      default: return assertNever(item);
    }
  });
}

function gddLines(lines: readonly (readonly GddInline[])[]): TextRun[] {
  return lines.flatMap((line, index) => index === 0 ? gddText(line) : [{ text: '\n' }, ...gddText(line)]);
}

/** Projects normalized GDD blocks in blockIds order; does not edit the original document. */
export function fromGddBlocks(document: GddDocument): DocumentNode[] {
  const byId = new Map(document.blocks.map(block => [block.id, block]));
  return document.document.blockIds.map(id => {
    const block = byId.get(id);
    if (!block) throw new TypeError(`Missing GDD block: ${id}`);
    const anchor = block.id;
    switch (block.kind) {
      case 'heading': return { kind: 'heading', anchor, depth: block.level, text: { ko: gddText(block.inlines) } };
      case 'paragraph': return { kind: 'paragraph', anchor, text: { ko: block.lines ? gddLines(block.lines) : gddText(block.inlines ?? []) } };
      case 'blockQuote': return { kind: 'quote', anchor, text: { ko: gddLines(block.lines) } };
      case 'thematicBreak': return { kind: 'rule', anchor };
      case 'list': return { kind: 'list', anchor, ...(block.ordered ? { ordered: true as const } : {}), items: block.items.map(item => {
        const inlines = 'inlines' in item ? item.inlines : item;
        return { ko: gddText(inlines) };
      }) };
      case 'table': return { kind: 'table', anchor, columns: block.header.map(ko => ({ ko })), rows: (block.rows ?? block.rawRows ?? []).map(row => row.map(ko => ({ ko: ko.trim() }))) };
      case 'codeFence': return { kind: 'code', anchor, language: block.info.split(/\s+/)[0] || 'text', text: { ko: block.text } };
      case 'linkReferenceDefinition': return { kind: 'paragraph', anchor, text: { ko: [{ text: block.label, href: block.href }] } };
      default: return assertNever(block);
    }
  });
}
