#!/usr/bin/env node
// v4 convert-everything Lane A: carries the body_ko_md edits made in data/sql/080-gdd-documents.sql
// back into the canon JSON (gdd/canon/locales/ko-KR/**.json) and refreshes gdd/canon/rendered.lock.json.
//
//   node scripts/pages/v4all-gdd-canon-sync.mjs --base <git-rev> --report <out.json> [--dry-run]
//
// 080 body_ko_md was exported from the canon JSON block by block (scripts/pages/export-sql.mjs), so each
// JSON block renders to a known slice of the Markdown. For every changed 080 row this tool re-renders the
// JSON with a per-character owner map (which string leaf, at which offset, produced each character),
// aligns the base 080 slice with that render, token-diffs base 080 against current 080, and applies every
// edit to the single leaf that owns the edited characters. An edit that crosses leaves or literal Markdown
// is reported as unmapped instead of guessed. JSON files are edited as raw text (only the edited string
// literals change). Afterwards every block whose base render matched base 080 must render exactly to the
// current 080 slice, and the lock hash is recomputed with the vendored materializer renderer.
// Exit codes: 0 ok, 2 usage, 5 post-check failure.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CANON = path.join(REPO, 'gdd/canon');
const GD = path.join(CANON, 'locales/ko-KR');
const SQL_REL = 'data/sql/080-gdd-documents.sql';
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const t = process.argv[i];
  if (t === '--dry-run') args.dryRun = true;
  else if (t === '--base' || t === '--report') args[t.slice(2)] = process.argv[++i];
  else { console.error(`E_ARG: ${t}`); process.exit(2); }
}
if (!args.base || !args.report) { console.error('usage: --base <rev> --report <out.json> [--dry-run]'); process.exit(2); }

function loadRows(sqlText) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(fs.readFileSync(path.join(REPO, 'data/sql/000-schema.sql'), 'utf8'));
  db.exec(sqlText);
  const rows = db.prepare('SELECT id, body_ko_md FROM gdd_document').all();
  db.close();
  return new Map(rows.map((r) => [r.id, r.body_ko_md]));
}
const baseRows = loadRows(execFileSync('git', ['-C', REPO, 'show', `${args.base}:${SQL_REL}`], { maxBuffer: 1 << 26 }).toString('utf8'));
const curRows = loadRows(fs.readFileSync(path.join(REPO, SQL_REL), 'utf8'));

// ---- token diff (Myers, token granularity) -----------------------------------
const tokenize = (s) => s.match(/[\uac00-\ud7a3]+|[A-Za-z0-9_]+|\s+|[^\s\uac00-\ud7a3A-Za-z0-9_]/g) ?? [];
function diffOps(a, b) {
  const n = a.length, m = b.length, max = n + m, off = max + 1;
  const v = new Int32Array(2 * max + 3); const trace = [];
  for (let d = 0; d <= max; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) {
        const ops = []; let cx = n, cy = m;
        for (let dd = d; dd > 0; dd--) {
          const pv = trace[dd]; const kk = cx - cy;
          const down = kk === -dd || (kk !== dd && pv[off + kk - 1] < pv[off + kk + 1]);
          const pk = down ? kk + 1 : kk - 1; const px = pv[off + pk]; const py = px - pk;
          while (cx > px && cy > py) { ops.push(['=', cx - 1, cy - 1]); cx--; cy--; }
          if (down) { ops.push(['+', cx, cy - 1]); cy--; } else { ops.push(['-', cx - 1, cy]); cx--; }
        }
        while (cx > 0 && cy > 0) { ops.push(['=', cx - 1, cy - 1]); cx--; cy--; }
        return ops.reverse();
      }
    }
  }
  throw new Error('E_DIFF');
}
const offsets = (toks) => { const o = [0]; for (const t of toks) o.push(o[o.length - 1] + t.length); return o; };
// Character map a -> b through equal tokens (index in a -> index in b, -1 where a char is not equal).
function charMap(a, b) {
  const ta = tokenize(a), tb = tokenize(b), oa = offsets(ta), ob = offsets(tb);
  const map = new Int32Array(a.length + 1).fill(-1);
  for (const [op, i, j] of diffOps(ta, tb)) if (op === '=') for (let c = 0; c < ta[i].length; c++) map[oa[i] + c] = ob[j] + c;
  map[a.length] = b.length;
  return map;
}
// Edit groups between a and b: { os, oe, text } with [os, oe) a char range of a, text the replacement.
function editGroups(a, b) {
  const ta = tokenize(a), tb = tokenize(b), oa = offsets(ta), ob = offsets(tb);
  const groups = []; let g = null;
  for (const [op, i, j] of diffOps(ta, tb)) {
    if (op === '=') { if (g) { groups.push(g); g = null; } continue; }
    if (!g) g = { os: op === '-' ? oa[i] : oa[i], oe: op === '-' ? oa[i] : oa[i], text: '' };
    if (op === '-') g.oe = oa[i + 1]; else g.text += tb[j];
  }
  if (g) groups.push(g);
  return groups;
}

// ---- owner-tracking renderer (same Markdown as scripts/pages/export-sql.mjs, Korean side) -----------
function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkFiles(p) : p.endsWith('.json') ? [p] : [];
  });
}
const files = walkFiles(GD);
const idToFile = new Map(files.map((f) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return [j.document?.id ?? j.id, f]; }));
const catOf = (rel) => (/^adr-\d+\.json$/.test(rel) ? 'decisions' : ({ root: 'design', rules: 'rules', architecture: 'architecture', references: 'references', art: 'art', 'system-design': 'system-design', proposals: 'proposals' }[rel.split('/')[0]] ?? 'design'));
const routeById = new Map([...idToFile].map(([id, f]) => { const rel = path.relative(GD, f).replaceAll('\\', '/'); return [id, `/gdd/${catOf(rel)}/${path.basename(rel, '.json')}/`]; }));

class Out {
  constructor() { this.s = ''; this.own = []; }
  lit(t) { this.s += t; for (let i = 0; i < t.length; i++) this.own.push(null); }
  leaf(ptr, t, esc) {
    const r = esc ? t.replaceAll('|', '\\|').replaceAll('\n', ' ') : t;
    // owner idx is the index in the *raw* leaf string; escaped `\|` maps its two chars to one raw char
    let raw = 0;
    for (let i = 0; i < r.length; i++) {
      this.s += r[i];
      if (esc && r[i] === '\\' && r[i + 1] === '|') { this.own.push({ ptr, idx: raw, esc: true }); continue; }
      this.own.push({ ptr, idx: raw }); raw++;
    }
  }
}
function renderBlock(b, ptr) {
  const o = new Out();
  const inl = (nodes, p, esc = false) => (nodes ?? []).forEach((n, k) => {
    if (n.kind === 'docLink') {
      const r = routeById.get(n.targetDocumentId);
      if (r) { o.lit('['); o.leaf(`${p}/${k}/text`, n.text, esc); o.lit(`](${r})`); } else o.leaf(`${p}/${k}/text`, n.text, esc);
    } else o.leaf(`${p}/${k}/text`, n.text ?? '', esc);
  });
  const cell = (c, p) => (Array.isArray(c) ? inl(c, p, true) : o.leaf(p, String(c), true));
  switch (b.kind) {
    case 'heading': o.lit(`${'#'.repeat(b.level ?? b.depth ?? 2)} `); if (b.inlines) inl(b.inlines, `${ptr}/inlines`); else o.leaf(`${ptr}/text/ko`, b.text?.ko ?? ''); break;
    case 'paragraph': if (b.inlines) inl(b.inlines, `${ptr}/inlines`); else o.leaf(`${ptr}/text/ko`, b.text?.ko ?? ''); break;
    case 'list': (b.items ?? []).forEach((it, i) => { if (i) o.lit('\n'); o.lit(`${b.ordered ? `${i + 1}.` : '-'} `); if (Array.isArray(it)) inl(it, `${ptr}/items/${i}`); else o.leaf(`${ptr}/items/${i}/ko`, it.ko ?? ''); }); break;
    case 'table': {
      const hdr = b.header ?? [];
      o.lit('| '); hdr.forEach((c, i) => { if (i) o.lit(' | '); cell(c, `${ptr}/header/${i}`); }); o.lit(' |');
      o.lit(`\n| ${hdr.map(() => '---').join(' | ')} |`);
      (b.rows ?? []).forEach((r, ri) => { o.lit('\n| '); r.forEach((c, i) => { if (i) o.lit(' | '); cell(c, `${ptr}/rows/${ri}/${i}`); }); o.lit(' |'); });
      break;
    }
    case 'blockQuote': (b.lines ?? []).forEach((l, i) => { if (i) o.lit('\n'); o.lit('> '); if (Array.isArray(l)) inl(l, `${ptr}/lines/${i}`); else o.leaf(`${ptr}/lines/${i}`, l); }); break;
    case 'codeFence': o.lit(`${b.fence ?? '```'}${b.info ?? ''}\n`); o.leaf(`${ptr}/text`, b.text ?? ''); o.lit(`\n${b.fence ?? '```'}`); break;
    case 'thematicBreak': o.lit('---'); break;
    default: throw new Error(`E_BLOCK:${b.kind}`);
  }
  return o;
}
const getPtr = (obj, ptr) => ptr.split('/').slice(1).reduce((x, k) => x[k], obj);
const setPtr = (obj, ptr, val) => { const ks = ptr.split('/').slice(1); const last = ks.pop(); ks.reduce((x, k) => x[k], obj)[last] = val; };
const normL = (t) => t.replace(/\]\([^)\s]*\)/g, '](L)');

const report = { base: args.base, dryRun: !!args.dryRun, documents: [], lockChanged: [], unmapped: [], preexistingDivergentBlocks: [] };
const changedFiles = new Map();
for (const [id, cur] of curRows) {
  const base = baseRows.get(id);
  if (base === cur) continue;
  const file = idToFile.get(id);
  if (!file) { report.unmapped.push({ id, reason: 'no canon JSON' }); continue; }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const key = json.blocks ? 'blocks' : 'content';
  const renders = json[key].map((b, i) => renderBlock(b, `/${key}/${i}`));
  const bl = base.split('\n'), cl = cur.split('\n');
  if (bl.length !== cl.length) { report.unmapped.push({ id, reason: '080 line count changed' }); continue; }
  const modelLines = renders.reduce((a, r) => a + r.s.split('\n').length, 0) + renders.length - 1;
  // When the canon JSON already diverges from 080 in line structure, align the whole document as one unit.
  const whole = modelLines !== bl.length;
  if (whole) {
    const all = new Out();
    renders.forEach((r, i) => { if (i) all.lit('\n\n'); all.s += r.s; all.own.push(...r.own); });
    renders.splice(0, renders.length, all);
    report.preexistingDivergentBlocks.push({ id, block: 'whole-document', modelLines, sqlLines: bl.length });
  }
  const leafEdits = new Map(); // ptr -> [{ s, e, text }] in raw-leaf coordinates
  let line = 0, mappedGroups = 0;
  renders.forEach((r, bi) => {
    const n = whole ? bl.length : r.s.split('\n').length;
    const B = bl.slice(line, line + n).join('\n'), C = cl.slice(line, line + n).join('\n');
    line += n + 1;
    if (B === C) return;
    if (normL(B) !== normL(r.s)) report.preexistingDivergentBlocks.push({ id, block: bi });
    const toModel = charMap(B, r.s);
    for (const g of editGroups(B, C)) {
      // owners of the replaced chars, or of the neighbour for a pure insertion
      const idxs = [];
      if (g.oe > g.os) for (let c = g.os; c < g.oe; c++) idxs.push(toModel[c]);
      else idxs.push(toModel[g.os] >= 0 && r.own[toModel[g.os]] ? toModel[g.os] : (g.os > 0 ? toModel[g.os - 1] : -1));
      const owners = idxs.map((m) => (m >= 0 ? r.own[m] : null));
      if (owners.some((x) => !x) || new Set(owners.map((x) => x.ptr)).size !== 1 || owners.some((x) => x.esc)) {
        report.unmapped.push({ id, block: bi, reason: 'edit crosses leaves, literal Markdown, or a diverged span', old: B.slice(g.os, g.oe), new: g.text });
        continue;
      }
      const ptr = owners[0].ptr;
      const s = g.oe > g.os ? owners[0].idx : (toModel[g.os] >= 0 && r.own[toModel[g.os]] ? owners[0].idx : owners[0].idx + 1);
      const e = g.oe > g.os ? owners[owners.length - 1].idx + 1 : s;
      if (!leafEdits.has(ptr)) leafEdits.set(ptr, []);
      leafEdits.get(ptr).push({ s, e, text: g.text.replaceAll('\\|', '|') });
      mappedGroups++;
    }
  });
  if (!leafEdits.size) continue;
  // apply to a copy of the JSON, then patch the file text literal by literal
  const next = structuredClone(json);
  for (const [ptr, eds] of leafEdits) {
    let v = getPtr(json, ptr);
    for (const ed of eds.sort((x, y) => y.s - x.s)) v = v.slice(0, ed.s) + ed.text + v.slice(ed.e);
    setPtr(next, ptr, v);
  }
  let text = changedFiles.get(file)?.text ?? fs.readFileSync(file, 'utf8');
  const literalEdits = new Map();
  for (const ptr of leafEdits.keys()) literalEdits.set(JSON.stringify(getPtr(json, ptr)), JSON.stringify(getPtr(next, ptr)));
  for (const [oldLit, newLit] of literalEdits) {
    // identical literals elsewhere must all map the same way (checked by the JSON equality below)
    text = text.split(oldLit).join(newLit);
  }
  if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(next)) { report.unmapped.push({ id, reason: 'raw literal patch would change other identical literals' }); continue; }
  changedFiles.set(file, { text, json: next });
  report.documents.push({ id, file: path.relative(REPO, file).replaceAll('\\', '/'), editGroups: mappedGroups, leaves: leafEdits.size });
}

// ---- verify: every block that matched base 080 must now render to current 080 -----------------
for (const d of report.documents) (() => {
  const { json } = changedFiles.get(path.join(REPO, d.file));
  const key = json.blocks ? 'blocks' : 'content';
  const bl = baseRows.get(d.id).split('\n'), cl = curRows.get(d.id).split('\n');
  const before = JSON.parse(fs.readFileSync(path.join(REPO, d.file), 'utf8'));
  let line = 0; d.blockMismatch = 0;
  if (report.preexistingDivergentBlocks.some((x) => x.id === d.id && x.block === 'whole-document')) {
    // whole-document mode: every changed 080 line must appear in the new render and the old text must be gone
    const now = new Set(normL(json[key].map((b) => renderBlock(b, '').s).join('\n\n')).split('\n'));
    const was = new Set(normL(before[key].map((b) => renderBlock(b, '').s).join('\n\n')).split('\n'));
    cl.forEach((l, i) => { if (l !== bl[i] && was.has(normL(bl[i])) && !now.has(normL(l))) d.blockMismatch++; });
    return;
  }
  json[key].forEach((b, i) => {
    const r = renderBlock(b, '').s, r0 = renderBlock(before[key][i], '').s;
    const n = r0.split('\n').length;
    const B = bl.slice(line, line + n).join('\n'), C = cl.slice(line, line + n).join('\n');
    line += n + 1;
    if (normL(r0) === normL(B) && normL(r) !== normL(C)) d.blockMismatch++;
  });
})();

// ---- lock ---------------------------------------------------------------------------
const { renderDocument, renderTableRows } = await import(pathToFileURL(path.join(REPO, 'gdd/viewer/vendor/canon-tools/canon/render.mjs')).href);
const entries = fs.readdirSync(path.join(CANON, 'collections')).filter((n) => n.endsWith('.json')).flatMap((n) => JSON.parse(fs.readFileSync(path.join(CANON, 'collections', n), 'utf8')).documents ?? []);
const byIdPath = new Map(entries.map((e) => [e.id, e.source.path]));
const lockPath = path.join(CANON, 'rendered.lock.json');
const lockText = fs.readFileSync(lockPath, 'utf8');
const lock = JSON.parse(lockText);
const { loadAdrCanonCollection, ADR_COLLECTION } = await import(pathToFileURL(path.join(REPO, 'gdd/viewer/vendor/canon-tools/wiki/adr-canon.mjs')).href);
const { renderAdrMarkdown } = await import(pathToFileURL(path.join(REPO, 'gdd/viewer/vendor/canon-tools/wiki/adr-render.mjs')).href);
for (const d of report.documents) {
  const doc = changedFiles.get(path.join(REPO, d.file)).json;
  const e = entries.find((x) => x.id === d.id);
  let lockPathKey, md;
  if (e) {
    if (doc.content) { report.unmapped.push({ id: d.id, reason: 'content-format document needs the npm renderer; lock not recomputed' }); continue; }
    lockPathKey = e.source.path;
    md = renderDocument(doc, (b) => renderTableRows(b.header, b.rows, b.dividers), (tid) => path.posix.relative(path.posix.dirname(e.source.path), byIdPath.get(tid)));
  } else {
    const adr = ADR_COLLECTION.find((x) => x.id === d.id);
    if (!adr) { report.unmapped.push({ id: d.id, reason: 'no collection or ADR entry; lock not recomputed' }); continue; }
    lockPathKey = `adr/${adr.outputName}`;
    md = null; d.adrLock = lockPathKey; // computed after files are written (ADR loader reads from disk)
  }
  if (md !== null) {
    const sha = crypto.createHash('sha256').update(Buffer.from(md)).digest('hex');
    const le = lock.find((x) => x.path === lockPathKey);
    if (le && le.sha256 !== sha) { report.lockChanged.push({ path: le.path, before: le.sha256, after: sha }); le.sha256 = sha; }
  }
}

fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
const bad = report.documents.filter((d) => d.blockMismatch);
const writeReport = () => fs.writeFileSync(path.resolve(args.report), `${JSON.stringify(report, null, 2)}\n`);
if (bad.length) { writeReport(); console.error(`E_POST: ${bad.map((d) => `${d.id}(${d.blockMismatch})`).join(', ')}`); process.exit(5); }
if (!args.dryRun) {
  for (const [file, { text }] of changedFiles) fs.writeFileSync(file, text);
  if (report.documents.some((d) => d.adrLock)) {
    const adrs = await loadAdrCanonCollection(CANON);
    for (const d of report.documents.filter((x) => x.adrLock)) {
      const sha = crypto.createHash('sha256').update(Buffer.from(renderAdrMarkdown(adrs.get(d.id)))).digest('hex');
      const le = lock.find((x) => x.path === d.adrLock);
      if (le && le.sha256 !== sha) { report.lockChanged.push({ path: le.path, before: le.sha256, after: sha }); le.sha256 = sha; }
    }
  }
  let lt = lockText;
  for (const c of report.lockChanged) lt = lt.replace(`"sha256": "${c.before}"`, `"sha256": "${c.after}"`);
  fs.writeFileSync(lockPath, lt);
}
writeReport();
console.log(`${args.dryRun ? 'dry-run' : 'synced'}: ${report.documents.length} documents, ${report.documents.reduce((a, d) => a + d.editGroups, 0)} edits, ${report.lockChanged.length} lock entries, ${report.unmapped.length} unmapped`);
