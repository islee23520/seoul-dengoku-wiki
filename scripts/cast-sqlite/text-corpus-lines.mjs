export const TEXT_CORPUS_LINES_TABLE_COLUMNS = Object.freeze({
  text_line_document: Object.freeze(['source_id', 'media_kind', 'line_count', 'ends_with_newline', 'line_ending']),
  text_line: Object.freeze(['source_id', 'line_ordinal', 'text', 'line_kind', 'heading_depth']),
});

const MEDIA_KINDS = new Map([
  ['text/markdown', 'markdown'],
  ['text/csv', 'csv'],
  ['text/javascript', 'javascript-data'],
  ['application/javascript', 'javascript-data'],
]);

function fail(code, message) {
  throw Object.assign(new Error(`${code}: ${message}`), { code });
}

/**
 * Independent, stateless regex labels, not a CommonMark semantic parser or domain
 * normalization. Fence contents are not parsed; CSV and JavaScript are not parsed.
 * Precedence: blank, fence, ATX heading, list marker, leading pipe, quote, other.
 * Classification ignores one terminal CR, but stored text always retains it.
 */
function classifyLine(text, mediaKind) {
  const content = text.endsWith('\r') ? text.slice(0, -1) : text;
  if (/^[\t ]*$/u.test(content)) return { line_kind: 'blank', heading_depth: null };
  if (mediaKind !== 'markdown') return { line_kind: 'other', heading_depth: null };
  if (/^ {0,3}(?:`{3,}|~{3,})/u.test(content)) return { line_kind: 'fence', heading_depth: null };
  const heading = /^ {0,3}(#{1,6})(?:[\t ]|$)/u.exec(content);
  if (heading) return { line_kind: 'heading', heading_depth: heading[1].length };
  if (/^[\t ]*(?:[-+*]|\d+[.)])(?:[\t ]|$)/u.test(content)) return { line_kind: 'list', heading_depth: null };
  if (/^[\t ]*\|/u.test(content)) return { line_kind: 'table', heading_depth: null };
  if (/^ {0,3}>/u.test(content)) return { line_kind: 'quote', heading_depth: null };
  return { line_kind: 'other', heading_depth: null };
}

/**
 * Map eligible bundle.files entries using their source_file IDs and raw_bytes.
 * UTF-8 is required (BOM preserved); unsupported media types are left untouched.
 * Ordinals are zero based. Empty input has zero lines. A final LF is represented
 * only by ends_with_newline, not by an extra empty row. Reconstruct with ordered
 * text joined by LF, followed by one LF iff ends_with_newline is 1.
 * line_ending describes LF delimiters only: a lone CR remains literal text.
 */
export function mapTextCorpusLines({ bundle }) {
  if (!Array.isArray(bundle?.files)) fail('E_TEXT_CORPUS_BUNDLE', 'bundle.files');
  const rows = { text_line_document: [], text_line: [] };
  const seen = new Set();
  for (const file of bundle.files) {
    const media_kind = MEDIA_KINDS.get(file.media_type);
    if (!media_kind) continue;
    const { source_id, raw_bytes } = file;
    if (!Number.isSafeInteger(source_id) || source_id < 1 || seen.has(source_id)) {
      fail('E_TEXT_CORPUS_SOURCE_ID', String(source_id));
    }
    seen.add(source_id);
    if (!(raw_bytes instanceof Uint8Array)) fail('E_TEXT_CORPUS_BYTES', String(source_id));
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(raw_bytes); }
    catch { fail('E_TEXT_CORPUS_UTF8', String(source_id)); }
    const ends_with_newline = Number(text.endsWith('\n'));
    const lines = text === '' ? [] : text.split('\n');
    if (ends_with_newline) lines.pop();
    const delimiterCount = Math.max(0, lines.length - 1) + ends_with_newline;
    let crlfCount = 0;
    for (let index = 0; index < delimiterCount; index += 1) {
      if (lines[index].endsWith('\r')) crlfCount += 1;
    }
    const line_ending = delimiterCount === 0 ? 'none' : crlfCount === 0 ? 'lf'
      : crlfCount === delimiterCount ? 'crlf' : 'mixed';
    rows.text_line_document.push(Object.freeze({ source_id, media_kind, line_count: lines.length, ends_with_newline, line_ending }));
    for (const [line_ordinal, text] of lines.entries()) {
      rows.text_line.push(Object.freeze({ source_id, line_ordinal, text, ...classifyLine(text, media_kind) }));
    }
  }
  Object.values(rows).forEach(Object.freeze);
  return Object.freeze(rows);
}
