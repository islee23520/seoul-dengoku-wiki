#!/usr/bin/env node
// build-viewer.mjs — reference-games.md 로컬 뷰어 생성기 (자체 완결 HTML, 외부 의존 0)
// 사용법:
//   node build-viewer.mjs           뷰어 HTML 생성(갱신)
//   node build-viewer.mjs --check   뷰어 HTML이 최신 원본과 정합인지 검사 (CI 성격의 게이트)
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, 'reference-games.md');
const OUT = join(here, 'reference-games-viewer.html');

// ---------- markdown 모델 ----------
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function inline(s) {
  let out = esc(s);
  // UNVERIFIED 배지 (원문 토큰 그대로)
  out = out.replace(/UNVERIFIED/g, '<span class="uv">UNVERIFIED</span>');
  // 마크다운 링크 [t](u)
  out = out.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // 베어 URL 자동 링크
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s)<>"']+)/g,
    '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}
// 라인 배열 -> HTML (표/목록/인용/hr/문단)
function renderLines(lines) {
  const html = [];
  let i = 0;
  const flushTable = () => { /* no-op placeholder */ };
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^---\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (/^### /.test(line)) { html.push('<h3>' + inline(line.slice(4)) + '</h3>'); i++; continue; }
    if (/^## /.test(line)) { html.push('<h2>' + inline(line.slice(3)) + '</h2>'); i++; continue; }
    if (/^# /.test(line)) { html.push('<h1>' + inline(line.slice(2)) + '</h1>'); i++; continue; }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      if (rows.length >= 2 && /^\|[\s:|-]+\|$/.test(rows[1].trim())) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]);
        let t = '<table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
        for (const r of rows.slice(2)) {
          t += '<tr>' + cells(r).map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>';
        }
        t += '</tbody></table>';
        html.push(t);
      } else {
        for (const r of rows) html.push('<p>' + inline(r) + '</p>');
      }
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*] /, '')); i++; }
      html.push('<ul>' + items.map((t) => '<li>' + inline(t) + '</li>').join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\. /, '')); i++; }
      html.push('<ol>' + items.map((t) => '<li>' + inline(t) + '</li>').join('') + '</ol>');
      continue;
    }
    if (/^> /.test(line)) {
      const q = [];
      while (i < lines.length && /^> /.test(lines[i])) { q.push(lines[i].slice(2)); i++; }
      html.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
      continue;
    }
    html.push('<p>' + inline(line) + '</p>');
    i++;
  }
  return html.join('\n');
}
// 섹션 분할: '## ' 기준. 머리글(h1+preamble)은 intro.
function parseSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let cur = { title: '머리말', id: 'sec-0', level: 2, lines: [] };
  let idx = 0;
  for (const line of lines) {
    if (/^## /.test(line)) {
      sections.push(cur);
      idx += 1;
      cur = { title: line.slice(3).trim(), id: 'sec-' + idx, level: 2, lines: [line] };
    } else {
      cur.lines.push(line);
    }
  }
  sections.push(cur);
  return sections.map((s) => ({ ...s, html: renderLines(s.lines) }));
}

// ---------- 체크 규칙 ----------
function ledgerRowKeys(md) {
  return [...md.matchAll(/^\| ([A-Z]{1,2}\d+) \|/gm)].map((m) => m[1]);
}
function sectionTitles(md) {
  return [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}
function checkOut(html, md) {
  const problems = [];
  if (!existsSync(OUT)) problems.push('뷰어 HTML이 없습니다: ' + OUT);
  if (problems.length) return problems;
  const titles = sectionTitles(md);
  for (const t of titles) if (!html.includes(esc(t))) problems.push('섹션 누락: ' + t);
  // 본문 헤딩 규칙: sec-N (N>=1) 래퍼 직후에 <h2>가 이어져야 한다 (TOC만 있고 본문 제목이 없는 누수 차단)
  for (let i = 1; i <= titles.length; i++) {
    if (!new RegExp('<section id="sec-' + i + '">\\s*<h2>').test(html)) problems.push('본문 h2 누락: sec-' + i);
  }
  const keys = ledgerRowKeys(md);
  for (const k of keys) if (!html.includes('>' + k + '<')) problems.push('출처 등록부 행 누락: ' + k);
  if (/<script[^>]*src=/i.test(html)) problems.push('외부 스크립트 참조 발견');
  if (/<link[^>]*href=/i.test(html)) problems.push('외부 스타일시트 참조 발견');
  if (/src="http/i.test(html)) problems.push('외부 리소스 참조 발견');
  if (/@import/i.test(html)) problems.push('@import 발견');
  if (html.length < md.length) problems.push('HTML이 원본보다 작음 — 렌더 누락 의심');
  return problems;
}

// ---------- 생성 ----------
function build() {
  const md = readFileSync(SRC, 'utf8');
  const sections = parseSections(md);
  const st = statSync(SRC);
  const builtFrom = st.mtime.toISOString() + ' · ' + st.size + 'B';
  const toc = sections.map((s) =>
    '<a class="toc-item" href="#' + s.id + '" data-target="' + s.id + '">' + esc(s.title) + '</a>'
  ).join('');
  const content = sections.map((s) => '<section id="' + s.id + '">' + s.html + '</section>').join('\n');
  const page = [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>레퍼런스 게임 조사 뷰어 — seoul-kenshi 사유 연구</title>',
    '<style>',
    ':root{--bg:#11141b;--panel:#181d28;--line:#2a3140;--text:#d8dee9;--dim:#8b95a7;--accent:#e8a13a;--mark:#ffd54d;}',
    '*{box-sizing:border-box}html{scroll-behavior:smooth}',
    'body{margin:0;background:var(--bg);color:var(--text);font:15px/1.75 -apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;}',
    'header{position:sticky;top:0;z-index:5;display:flex;gap:12px;align-items:center;padding:10px 18px;background:rgba(17,20,27,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(6px)}',
    'header h1{font-size:15px;margin:0;color:var(--accent);white-space:nowrap}',
    '#q{flex:1;max-width:420px;background:var(--panel);border:1px solid var(--line);border-radius:8px;color:var(--text);padding:7px 12px;font-size:14px;outline:none}',
    '#q:focus{border-color:var(--accent)}',
    '#count{color:var(--dim);font-size:12px;min-width:70px}',
    'header .src{margin-left:auto;color:var(--dim);font-size:12px;text-decoration:none;border:1px solid var(--line);border-radius:6px;padding:4px 8px}',
    'header .src:hover{color:var(--accent);border-color:var(--accent)}',
    'nav{position:fixed;top:56px;bottom:0;left:0;width:280px;overflow:auto;padding:14px 10px;border-right:1px solid var(--line);background:var(--panel)}',
    '.toc-item{display:block;padding:7px 10px;margin:2px 0;border-radius:7px;color:var(--dim);text-decoration:none;font-size:13.5px;line-height:1.45}',
    '.toc-item:hover{color:var(--text);background:#202736}',
    '.toc-item.active{color:var(--accent);background:#242c3d;font-weight:600}',
    'main{margin-left:280px;padding:26px 30px 90px}',
    '#doc{max-width:880px;margin:0 auto}',
    'section{padding-top:8px}section+section{margin-top:34px;border-top:1px solid var(--line);padding-top:26px}',
    'h1{font-size:22px;color:var(--accent);line-height:1.4}h2{font-size:19px;margin:6px 0 4px;line-height:1.5}h3{font-size:15.5px;color:#a9d3a0;margin:20px 0 6px}',
    'h2,h3{scroll-margin-top:66px}',
    'a{color:#7fb4e8}p,li{margin:8px 0}ul,ol{padding-left:24px}',
    'code{background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-size:13px;font-family:ui-monospace,Menlo,monospace;color:#c9d4e8}',
    'table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}',
    'th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}',
    'th{background:var(--panel);color:var(--accent);font-weight:600}tbody tr:nth-child(odd){background:#151a24}',
    'td a{word-break:break-all}',
    'blockquote{margin:10px 0;padding:8px 14px;border-left:3px solid var(--accent);background:var(--panel);color:var(--dim)}',
    'hr{border:none;border-top:1px solid var(--line);margin:20px 0}',
    '.uv{display:inline-block;background:#3d2c17;color:#ffb454;border:1px solid #6b4a1d;border-radius:5px;padding:0 6px;font-size:11.5px;font-weight:700;letter-spacing:.4px}',
    'mark.hit{background:var(--mark);color:#111;border-radius:3px;padding:0 1px}',
    '#meta{color:var(--dim);font-size:12px;margin:2px 0 18px}',
    '@media (max-width:920px){nav{position:static;width:auto;border-right:none;border-bottom:1px solid var(--line)}main{margin-left:0}}',
    '</style>',
    '</head>',
    '<body>',
    '<header>',
    '<h1>레퍼런스 게임 조사 뷰어</h1>',
    '<input id="q" type="search" placeholder="본문 검색 (예: 카라반, 주임, station-states)" aria-label="본문 검색">',
    '<span id="count"></span>',
    '<a class="src" href="reference-games.md">원본 .md</a>',
    '</header>',
    '<nav id="toc">' + toc + '</nav>',
    '<main><div id="doc">',
    '<div id="meta">사유 연구문서 · 원본 기준: ' + builtFrom + ' · 위키 금지 용어 문서(공개 금지)</div>',
    content,
    '</div></main>',
    '<script>',
    '(function(){',
    ' var q=document.getElementById("q"),count=document.getElementById("count"),doc=document.getElementById("doc");',
    ' var links=Array.prototype.slice.call(document.querySelectorAll(".toc-item"));',
    ' links.forEach(function(a){a.addEventListener("click",function(){links.forEach(function(b){b.classList.remove("active")});a.classList.add("active");});});',
    ' function clearMarks(){var ms=doc.querySelectorAll("mark.hit");for(var i=ms.length-1;i>=0;i--){var m=ms[i];m.parentNode.replaceChild(document.createTextNode(m.textContent),m);}doc.normalize();}',
    ' function markInText(node,qq){var low=node.textContent.toLowerCase(),idx=low.indexOf(qq);if(idx<0)return 0;var n=0,txt=node.textContent,frag=document.createDocumentFragment(),pos=0;',
    '  while(true){var at=txt.toLowerCase().indexOf(qq,pos);if(at<0){frag.appendChild(document.createTextNode(txt.slice(pos)));break;}frag.appendChild(document.createTextNode(txt.slice(pos,at)));var mk=document.createElement("mark");mk.className="hit";mk.textContent=txt.substr(at,qq.length);frag.appendChild(mk);n++;pos=at+qq.length;}node.parentNode.replaceChild(frag,node);return n;}',
    ' q.addEventListener("input",function(){clearMarks();var qq=q.value.trim().toLowerCase();if(!qq){count.textContent="";return;}var total=0;var walker=document.createTreeWalker(doc,NodeFilter.SHOW_TEXT,null);var targets=[];var nd;while((nd=walker.nextNode())){if(!nd.parentNode.closest("mark"))targets.push(nd);}targets.forEach(function(t){total+=markInText(t,qq);});count.textContent=total? total+"곳":"결과 없음";});',
    '})();',
    '</' + 'script>',
    '</body>',
    '</html>',
  ].join('\n');
  writeFileSync(OUT, page);
  return { sections: sections.length, rows: ledgerRowKeys(md).length, bytes: page.length };
}

// ---------- 진입 ----------
const checkOnly = process.argv.includes('--check');
if (checkOnly) {
  const md = readFileSync(SRC, 'utf8');
  const html = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  const problems = checkOut(html, md);
  if (problems.length) {
    console.error('CHECK FAIL:\n- ' + problems.join('\n- '));
    process.exit(1);
  }
  console.log('CHECK PASS: 섹션 ' + sectionTitles(md).length + '개, 등록부 ' + ledgerRowKeys(md).length + '행 전부 반영, 외부 리소스 참조 0');
  process.exit(0);
}
const r = build();
console.log('BUILD OK: 섹션 ' + r.sections + '개, 등록부 ' + r.rows + '행, ' + r.bytes + ' bytes -> ' + OUT);
