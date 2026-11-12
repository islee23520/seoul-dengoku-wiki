#!/usr/bin/env node
// 정본 용어 스캔 — docs/canon-terms.json의 금지/필수 표를 세 원천에 같은 모듈로 적용한다.
//   (1) 기본: data/sql의 wiki_document 본문(ko=body_ko_md, en=body_md, node:sqlite)
//   (2) --html <dist-dir>: 빌드된 정적 페이지의 가시 텍스트(script/style/HTML 주석/태그 제거, href 속성 미검사)
//   (3) --url <base>: 같은 가시 텍스트 추출 모듈로 라이브 페이지를 가져와 검사
//   (4) --md <경로[,경로…]>: SQL 밖의 마크다운 파일(경로가 디렉터리면 안의 *.md 전부)을 검사한다. docs/design·docs/research 게이트용.
//       파일 하나가 페이지 하나이고 ko·en 금지 패턴을 모두 적용한다(필수 표는 적용하지 않는다). 원문 그대로 스캔하므로 URL 속 이름도 잡는다.
// 위키 문서 페이지는 <base>/wiki/<slug>/(en)·<base>/ko/wiki/<slug>/(ko) 구조다(site/build.mjs 기준).
// 승인된 금지 패턴은 기존 히트 기준선과 무관하게 항상 검사한다 — 기준선이 0이어도 1건이면 exit 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDatabase } from './rewrite-doc.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXIT = { VIOLATION: 1, USAGE: 2 };

function usage() {
  console.error('사용법: node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json (--scope slug,slug | --all)');
  console.error('                                [--sql-dir <dir> | --html <dist-dir> | --url <base>] [--json <out>]');
  console.error('       node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --md <file|dir>[,<file|dir>…] [--json <out>]');
}

function parseArgs(argv) {
  const a = {};
  const val = (i, name) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) { console.error(`E_ARG: ${name} 값이 없다`); usage(); process.exit(EXIT.USAGE); }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--all') a.all = true;
    else if (t === '--terms') { a.terms = val(i, '--terms'); i++; }
    else if (t === '--scope') { a.scope = val(i, '--scope'); i++; }
    else if (t === '--html') { a.html = val(i, '--html'); i++; }
    else if (t === '--url') { a.url = val(i, '--url'); i++; }
    else if (t === '--md') { a.md = val(i, '--md'); i++; }
    else if (t === '--sql-dir') { a.sqlDir = val(i, '--sql-dir'); i++; }
    else if (t === '--json') { a.json = val(i, '--json'); i++; }
    else { console.error(`E_ARG: 알 수 없는 인자: ${t}`); usage(); process.exit(EXIT.USAGE); }
  }
  return a;
}

// ---- 용어 표 --------------------------------------------------------------
function compilePattern(p, flags, id) {
  if (!p || typeof p !== 'string' || !p.length) throw new Error(`E_TERMS: ${id}: pattern이 비었다`);
  const f = typeof flags === 'string' ? flags : '';
  return new RegExp(p, f.includes('g') ? f : `${f}g`);
}
function loadTerms(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const forbidden = (raw.forbidden ?? []).map((t) => {
    if (!t.id || !t.pattern) throw new Error(`E_TERMS: forbidden 항목에 id/pattern이 없다: ${JSON.stringify(t).slice(0, 80)}`);
    if (!['ko', 'en', 'both'].includes(t.lang)) throw new Error(`E_TERMS: ${t.id}: lang은 ko|en|both여야 한다`);
    return { id: t.id, re: compilePattern(t.pattern, t.flags, t.id), lang: t.lang, allowed: (t.allowedContext ?? []).map((s) => new RegExp(s)), note: t.note ?? '' };
  });
  const required = (raw.required ?? []).map((t) => {
    if (!t.id || !t.pattern) throw new Error(`E_TERMS: required 항목에 id/pattern이 없다: ${JSON.stringify(t).slice(0, 80)}`);
    if (!['ko', 'en', 'both'].includes(t.lang)) throw new Error(`E_TERMS: ${t.id}: lang은 ko|en|both여야 한다`);
    return { id: t.id, re: compilePattern(t.pattern, t.flags, t.id), lang: t.lang, min: t.minPerDoc ?? 1, docs: t.docs ?? [], note: t.note ?? '' };
  });
  return { forbidden, required };
}

// ---- 가시 텍스트 추출(HTML·URL 공용 모듈) ---------------------------------
// script/style/HTML 주석 블록과 태그 전체(속성 포함 — href는 결코 스캔하지 않는다)를 지우고 기본 엔티티만 푼다.
export function extractVisibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#0?39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ' '; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(Number(d)); } catch { return ' '; } })
    .replace(/[ \t]+/g, ' ');
}

// ---- 페이지 수집(원천별) ---------------------------------------------------
function docRows(sqlDir) {
  return loadDatabase(sqlDir).prepare('SELECT slug, body_md, body_ko_md FROM wiki_document').all();
}
function collectSqlPages(rows, scopeSet) {
  const pages = [];
  for (const r of rows) {
    if (scopeSet && !scopeSet.has(r.slug)) continue;
    pages.push({ slug: r.slug, lang: 'ko', text: r.body_ko_md, origin: 'data/sql/030 body_ko_md' });
    pages.push({ slug: r.slug, lang: 'en', text: r.body_md, origin: 'data/sql/030 body_md' });
  }
  return { pages, skipped: [] };
}
function collectHtmlPages(dist, rows, scopeSet) {
  const pages = [], skipped = [];
  for (const r of rows) {
    if (scopeSet && !scopeSet.has(r.slug)) continue;
    for (const [lang, rel] of [['en', `wiki/${r.slug}/index.html`], ['ko', `ko/wiki/${r.slug}/index.html`]]) {
      const p = path.join(dist, rel);
      if (!fs.existsSync(p)) { skipped.push(rel); continue; }
      pages.push({ slug: r.slug, lang, text: extractVisibleText(fs.readFileSync(p, 'utf8')), origin: rel });
    }
  }
  return { pages, skipped };
}
async function collectUrlPages(base, rows, scopeSet) {
  const pages = [], skipped = [];
  const b = base.replace(/\/+$/, '');
  for (const r of rows) {
    if (scopeSet && !scopeSet.has(r.slug)) continue;
    for (const [lang, rel] of [['en', `wiki/${r.slug}/`], ['ko', `ko/wiki/${r.slug}/`]]) {
      const url = `${b}/${rel}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) { skipped.push(`${url} -> HTTP ${res.status}`); continue; }
        pages.push({ slug: r.slug, lang, text: extractVisibleText(await res.text()), origin: url });
      } catch (e) { skipped.push(`${url} -> ${e?.name === 'TimeoutError' ? 'timeout' : (e?.message ?? String(e))}`); }
    }
  }
  return { pages, skipped };
}

function collectMdPages(spec) {
  const pages = [], skipped = [];
  const walk = (p) => {
    if (!fs.existsSync(p)) { skipped.push(`${p} -> 없음`); return; }
    if (fs.statSync(p).isDirectory()) {
      for (const name of fs.readdirSync(p).sort()) if (!name.startsWith('.') && name !== 'node_modules') walk(path.join(p, name));
    } else if (p.toLowerCase().endsWith('.md')) {
      pages.push({ slug: p.replace(/\\/g, '/'), lang: 'md', text: fs.readFileSync(p, 'utf8'), origin: p });
    }
  };
  for (const x of spec.split(',').map((v) => v.trim()).filter(Boolean)) walk(path.resolve(x));
  return { pages, skipped };
}

// ---- 검사 -----------------------------------------------------------------
function scan(pages, terms, scopeSet) {
  const forbiddenHits = [], requiredViolations = [];
  let allowedExemptions = 0;
  for (const term of terms.forbidden) {
    for (const page of pages) {
      if (page.lang !== 'md' && term.lang !== 'both' && term.lang !== page.lang) continue; // md 페이지는 ko·en 패턴을 모두 받는다
      for (const m of page.text.matchAll(term.re)) {
        const i = m.index;
        const win = page.text.slice(Math.max(0, i - 100), i + 100);
        if (term.allowed.some((a) => a.test(win))) { allowedExemptions++; continue; }
        const context = page.text.slice(Math.max(0, i - 20), Math.max(0, i - 20) + 60).replace(/\s+/g, ' ').slice(0, 60);
        forbiddenHits.push({ slug: page.slug, lang: page.lang, id: term.id, context, origin: page.origin });
      }
    }
  }
  for (const term of terms.required) {
    for (const slug of term.docs) {
      if (scopeSet && !scopeSet.has(slug)) continue; // --scope 밖 문서는 이번 판정에서 제외
      const tp = pages.filter((p) => p.slug === slug && (term.lang === 'both' || p.lang === term.lang));
      if (!tp.length) { requiredViolations.push({ slug, lang: term.lang, id: term.id, have: 0, min: term.min, reason: '스캔된 페이지가 없다' }); continue; }
      for (const p of tp) {
        const n = [...p.text.matchAll(term.re)].length;
        if (n < term.min) requiredViolations.push({ slug, lang: p.lang, id: term.id, have: n, min: term.min });
      }
    }
  }
  return { forbiddenHits, requiredViolations, allowedExemptions };
}

// ---- 실행 -----------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.terms) { console.error('E_ARG: --terms <file> 는 필수다'); usage(); process.exit(EXIT.USAGE); }
  if (args.md) {
    if (args.scope || args.all || args.html || args.url || args.sqlDir) { console.error('E_ARG: --md는 --scope/--all/--html/--url/--sql-dir과 함께 쓸 수 없다'); usage(); process.exit(EXIT.USAGE); }
    let mdTerms;
    try { mdTerms = loadTerms(args.terms); } catch (e) { console.error(`E_TERMS: ${e.message} (${args.terms})`); process.exit(EXIT.USAGE); }
    const { pages, skipped } = collectMdPages(args.md);
    if (!pages.length) { console.error(`E_ARG: --md 경로에서 .md 파일을 찾지 못했다: ${args.md}`); process.exit(EXIT.USAGE); }
    const { forbiddenHits } = scan(pages, { forbidden: mdTerms.forbidden, required: [] }, null);
    for (const v of forbiddenHits) console.log(`[금지] ${v.slug} ${v.id}: ${JSON.stringify(v.context)}`);
    for (const sk of skipped) console.log(`[건너뜀] ${sk}`);
    console.log(`스캔 완료: 마크다운 ${pages.length}개 (원천 md:${args.md}) — 금지 위반 ${forbiddenHits.length}, 건너뜀 ${skipped.length}`);
    if (args.json) {
      fs.writeFileSync(args.json, JSON.stringify({ ok: forbiddenHits.length === 0, source: `md:${args.md}`, pages: pages.length, skipped, forbiddenHits }, null, 1));
      console.log(`보고서: ${args.json}`);
    }
    process.exitCode = forbiddenHits.length ? EXIT.VIOLATION : 0;
    return;
  }
  if (!args.scope && !args.all) {
    console.error('E_ARG: --scope slug,slug 또는 --all 중 하나는 필수다');
    usage();
    process.exit(EXIT.USAGE);
  }
  if (args.scope && args.all) { console.error('E_ARG: --scope와 --all은 함께 쓸 수 없다'); usage(); process.exit(EXIT.USAGE); }
  if (args.html && args.url) { console.error('E_ARG: --html과 --url은 함께 쓸 수 없다'); usage(); process.exit(EXIT.USAGE); }
  let terms;
  try { terms = loadTerms(args.terms); } catch (e) { console.error(`E_TERMS: ${e.message} (${args.terms})`); process.exit(EXIT.USAGE); }
  const sqlDir = args.sqlDir ? path.resolve(args.sqlDir) : path.join(REPO, 'data/sql');
  let rows;
  try { rows = docRows(sqlDir); } catch (e) { console.error(`${e.message} (${sqlDir})`); process.exit(EXIT.USAGE); }
  const known = new Set(rows.map((r) => r.slug));
  const scopeSet = args.scope ? new Set(args.scope.split(',').map((s) => s.trim()).filter(Boolean)) : null;
  if (scopeSet) {
    const unknown = [...scopeSet].filter((s) => !known.has(s));
    if (unknown.length) console.error(`경고: wiki_document에 없는 slug 무시: ${unknown.join(', ')}`);
  }

  let source, collected;
  if (args.html) { source = `html:${args.html}`; collected = collectHtmlPages(path.resolve(args.html), rows, scopeSet); }
  else if (args.url) { source = `url:${args.url}`; collected = await collectUrlPages(args.url, rows, scopeSet); }
  else { source = `sql:${sqlDir}`; collected = collectSqlPages(rows, scopeSet); }

  const { pages, skipped } = collected;
  const { forbiddenHits, requiredViolations, allowedExemptions } = scan(pages, terms, scopeSet);
  for (const v of forbiddenHits) console.log(`[금지] ${v.slug} (${v.lang}) ${v.id}: ${JSON.stringify(v.context)}`);
  for (const v of requiredViolations) console.log(`[필수누락] ${v.slug} (${v.lang}) ${v.id}: ${v.have}/${v.min}${v.reason ? ` — ${v.reason}` : ''}`);
  for (const s of skipped) console.log(`[건너뜀] ${s}`);
  const docs = new Set(pages.map((p) => p.slug)).size;
  const nViol = forbiddenHits.length + requiredViolations.length;
  console.log(`스캔 완료: 문서 ${docs}개 / 페이지 ${pages.length}개 (원천 ${source}) — 금지 위반 ${forbiddenHits.length}, 필수 위반 ${requiredViolations.length}, 문맥 면제 ${allowedExemptions}, 건너뜀 ${skipped.length}`);
  if (args.json) {
    fs.writeFileSync(args.json, JSON.stringify({
      ok: nViol === 0, source, scope: scopeSet ? [...scopeSet] : 'all', docs, pages: pages.length,
      skipped, forbiddenHits, requiredViolations, allowedExemptions,
    }, null, 1));
    console.log(`보고서: ${args.json}`);
  }
  // URL 모드에서 fetch(undici) 소켓이 열려 있는 중 process.exit()를 하면 Windows libuv 어설션으로
  // 종료 코드가 뒤틀린다(관측: 코드 9). exitCode만 지정해 이벤트 루프가 자연히 끝나게 한다.
  process.exitCode = nViol ? EXIT.VIOLATION : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
