#!/usr/bin/env node
// W4 생태 도감 최소 편집 — docs/w4-rules.json의 문장 규칙과 옛 국가 id→세력 id 매핑를
// data/sql/030-wiki-documents.sql의 현재 본문에 적용해 docs/drafts/<slug>.{ko,en}.md 초안을 쓴다.
// 모델 재생성이 없다: 치환은 이 스크립트가 결정적으로 수행하고 규칙이 닿지 않는 바이트는 하나도 바꾸지 않는다.
// 규칙 원문 문자열이 본문에 없으면 오류로 멈춘다(부분 적용 없음).
//
// 사용법:
//   node scripts/pages/w4-edit.mjs [--dry-run] [--sql-dir <dir>] [--rules docs/w4-rules.json]
//                                  [--out docs/drafts] [--log docs/drafts/reports/w4-apply-log.json]
//                                  [--model '<model line>']
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

export const DOCS = ['Hostile-Ecology-Index', ...Array.from({ length: 26 }, (_, i) => `Hostile-Group-G${String(i + 1).padStart(2, '0')}`)];
export const DEFAULT_MODEL_LINE = 'cpa/glm-5.3; 0 completion calls; deterministic edits applied by scripts/pages/w4-edit.mjs; not from a Gemini model';
const SQL_FILES = ['000-schema.sql', '020-wiki-categories.sql', '030-wiki-documents.sql', '040-wiki-states.sql', '120-map-core.sql'];
const SID_RE = /\bS(?:0[1-9]|1[0-6])\b/g;
// 바이블(CANON-BIBLE.md) 2.4 25공작령 배정표 — 구(district_ko) → 세력 id. 14(정부) + 7(자유도시) + 4(아크) = 25.
export const BIBLE_2_4_DISTRICT_FACTION = {
  마포구: 'government', 용산구: 'government', 중구: 'government', 성동구: 'government', 광진구: 'government',
  동대문구: 'government', 중랑구: 'government', 성북구: 'government', 종로구: 'government', 서대문구: 'government',
  은평구: 'government', 강북구: 'government', 도봉구: 'government', 노원구: 'government',
  강서구: 'free-city', 양천구: 'free-city', 영등포구: 'free-city', 구로구: 'free-city', 금천구: 'free-city',
  동작구: 'free-city', 관악구: 'free-city',
  서초구: 'arc', 강남구: 'arc', 송파구: 'arc', 강동구: 'arc',
};

const EXIT = {
  USAGE: 1, RULES: 2, RULE_NOT_FOUND: 3, INVARIANT: 4, UNHANDLED_STATE_LINE: 5, SQL_LOAD: 6,
};

function usage() {
  console.error('사용법: node scripts/pages/w4-edit.mjs [--dry-run] [--sql-dir <dir>] [--rules <file>] [--out <dir>] [--log <file>] [--model "<line>"]');
}

function parseArgs(argv) {
  const a = { dryRun: false, rules: path.join(REPO, 'docs/w4-rules.json'), out: path.join(REPO, 'docs/drafts'), log: path.join(REPO, 'docs/drafts/reports/w4-apply-log.json'), model: DEFAULT_MODEL_LINE };
  const val = (i, name) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) { console.error(`E_ARG: ${name} 값이 없다`); usage(); process.exit(EXIT.USAGE); }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--dry-run') a.dryRun = true;
    else if (t === '--rules') { a.rules = val(i, '--rules'); i++; }
    else if (t === '--out') { a.out = val(i, '--out'); i++; }
    else if (t === '--log') { a.log = val(i, '--log'); i++; }
    else if (t === '--sql-dir') { a.sqlDir = val(i, '--sql-dir'); i++; }
    else if (t === '--model') { a.model = val(i, '--model'); i++; }
    else { console.error(`E_ARG: 알 수 없는 인자: ${t}`); usage(); process.exit(EXIT.USAGE); }
  }
  return a;
}

export function loadDatabase(sqlDir) {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
  for (const f of SQL_FILES) {
    const p = path.join(sqlDir, f);
    if (!fs.existsSync(p)) { console.error(`E_SQL_FILE: ${f}이(가) 없다 (${sqlDir})`); process.exit(EXIT.SQL_LOAD); }
    try { db.exec(fs.readFileSync(p, 'utf8')); } catch (e) { console.error(`E_SQL_EXEC: ${f}: ${e.message}`); process.exit(EXIT.SQL_LOAD); }
  }
  return db;
}

// 측정과 같은 단위(줄 → '|' 칸 → 문장부호 뒤 공백/줄끝)로 문장 조각을 나눈다. 통계 집계 전용.
export function splitSentences(body) {
  const units = [];
  for (const line of body.split('\n')) {
    for (const cell of line.split('|')) {
      for (const piece of cell.split(/(?<=[.!?。])(?=\s|$)/)) units.push(piece);
    }
  }
  return units;
}

const anchorSet = (body) => new Set([...body.matchAll(/<a\s+id=(["'])(.*?)\1\s*>\s*<\/a>/g)].map((m) => m[2]));
const headingCount = (body) => body.split('\n').reduce((n, l) => (l.startsWith('#') ? n + 1 : n), 0);
const byteLen = (s) => Buffer.byteLength(s, 'utf8');

// ---- 옛 국가 id → 세력 id 매핑(브리프 규칙 4) --------------------------------
// 각 wiki_state의 수도(capital)를 map_station에서 찾아 그 구를 바이블 2.4 배정으로 세력 id를 정한다.
export function computeStateMapping(db) {
  const states = db.prepare('SELECT slug, id, name_ko, capital, capital_ko FROM wiki_state ORDER BY id').all()
    .filter((r) => /^S(?:0[1-9]|1[0-6])$/.test(r.id));
  if (states.length !== 16) { console.error(`E_MAPPING: wiki_state S01..S16이 16행이 아니다(${states.length}행)`); process.exit(EXIT.RULES); }
  const mapping = new Map();
  const rows = [];
  for (const st of states) {
    const stations = db.prepare('SELECT id, name, name_ko, district, district_ko FROM map_station WHERE name = ? OR name_ko = ? ORDER BY id').all(st.capital, st.capital_ko);
    if (!stations.length) { rows.push({ id: st.id, faction: null, dropped: true, wikiStateRow: st, mapStationRow: null, note: '수도 역의 map_station 행이 없어 매핑하지 않는다(배열에서 제거)' }); continue; }
    const districts = [...new Set(stations.map((s) => s.district_ko))];
    if (districts.length !== 1) { console.error(`E_MAPPING: ${st.id} 수도 '${st.capital_ko}' 역 행의 구가 여럿이다: ${districts.join(' / ')}`); process.exit(EXIT.RULES); }
    const districtKo = districts[0];
    const faction = BIBLE_2_4_DISTRICT_FACTION[districtKo];
    if (!faction) { console.error(`E_MAPPING: ${st.id} 구 '${districtKo}'이(가) 바이블 2.4 배정표에 없다`); process.exit(EXIT.RULES); }
    mapping.set(st.id, faction);
    rows.push({ id: st.id, faction, dropped: false, wikiStateRow: st, mapStationRow: stations[0], bibleRow: { table: 'CANON-BIBLE 2.4', district_ko: districtKo, faction } });
  }
  return { mapping, rows };
}

// 문장 규칙이 닿은 줄 외에는 한 줄도 바뀌지 않았음을 보증하는 추적과 함께 본문을 바꾼다.
function applySentenceRules(body, slug, lang, rules, applications) {
  const lines = body.split('\n');
  const touched = new Set();
  for (const rule of rules) {
    if (rule.lang !== lang || !rule.slugs.includes(slug)) continue;
    if (rule.replacement.includes('\n')) { console.error(`E_RULES: ${rule.id} 치환문에 줄바꿈이 있다`); process.exit(EXIT.RULES); }
    let occurrences = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes(rule.original)) continue;
      const parts = lines[i].split(rule.original);
      occurrences += parts.length - 1;
      lines[i] = parts.join(rule.replacement === 'delete' ? '' : rule.replacement);
      touched.add(i);
    }
    if (occurrences) applications.push({ ruleId: rule.id, slug, lang, occurrences });
    rule._total = (rule._total ?? 0) + occurrences;
  }
  return { body: lines.join('\n'), touched };
}

// states 배열(JSON 링크 줄)과 관련 세력/Actors 목록 줄의 옛 국가 id를 세력 id로 바꾼다.
function applyStateLineTransforms(body, slug, lang, mapping, droppedLog, lineApps, touched) {
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!SID_RE.test(line)) { SID_RE.lastIndex = 0; continue; }
    SID_RE.lastIndex = 0;
    let m = /^- (?:연결|Links): (\{.*\})$/.exec(line);
    if (m) {
      let obj;
      try { obj = JSON.parse(m[1]); } catch (e) { console.error(`E_JSON_LINE: ${slug} ${lang} ${i + 1}줄 JSON 파싱 실패: ${e.message}`); process.exit(EXIT.UNHANDLED_STATE_LINE); }
      if (Array.isArray(obj.states) && obj.states.some((v) => /^S(?:0[1-9]|1[0-6])$/.test(v))) {
        const out = [];
        for (const v of obj.states) {
          if (mapping.has(v)) { const f = mapping.get(v); if (!out.includes(f)) out.push(f); }
          else if (/^S(?:0[1-9]|1[0-6])$/.test(v)) droppedLog.push({ slug, lang, line: i + 1, id: v, note: '매핑 근거 행 없음 — 배열에서 제거' });
          else if (!out.includes(v)) out.push(v);
        }
        obj.states = out;
        lines[i] = `- ${lang === 'ko' ? '연결' : 'Links'}: ${JSON.stringify(obj)}`;
        lineApps.push({ slug, lang, kind: 'states-array', line: i + 1, before: line, after: lines[i] });
        touched.add(i);
      }
      continue;
    }
    m = /^- (관련 세력|Actors): (.+)$/.exec(line);
    if (m) {
      const tokens = m[2].split(', ');
      if (tokens.some((t) => /^S(?:0[1-9]|1[0-6])$/.test(t))) {
        const out = [];
        for (const t of tokens) {
          if (mapping.has(t)) { const f = mapping.get(t); if (!out.includes(f)) out.push(f); }
          else if (/^S(?:0[1-9]|1[0-6])$/.test(t)) droppedLog.push({ slug, lang, line: i + 1, id: t, note: '매핑 근거 행 없음 — 목록에서 제거' });
          else out.push(t);
        }
        lines[i] = `- ${m[1]}: ${out.join(', ')}`;
        lineApps.push({ slug, lang, kind: 'id-list', line: i + 1, before: line, after: lines[i] });
        touched.add(i);
      }
      continue;
    }
    // 문장 규칙으로 이미 처리된 산문 줄이 아니면 여기서 멈춘다(알 수 없는 형태를 소리 없이 두지 않는다).
    if (!touched.has(i)) {
      console.error(`E_UNHANDLED_STATE_LINE: ${slug} ${lang} ${i + 1}줄에 옛 국가 id가 있으나 처리 규칙이 없다: ${line.slice(0, 120)}`);
      process.exit(EXIT.UNHANDLED_STATE_LINE);
    }
  }
  return lines.join('\n');
}

// 링크 대상 ](...) 안과 id/href 속성 값은 면제 대상이므로 가시 텍스트만 검사한다.
function visibleStateIds(body) {
  const visible = body.replace(/\]\([^)\s]*\)/g, '](…)').replace(/(?:id|href)="[^"]*"/g, '="…"');
  return visible.match(SID_RE) ?? [];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sqlDir = args.sqlDir ? path.resolve(args.sqlDir) : path.join(REPO, 'data/sql');
  let rulesDoc;
  try { rulesDoc = JSON.parse(fs.readFileSync(args.rules, 'utf8')); } catch (e) { console.error(`E_RULES: 규칙 표를 읽을 수 없다: ${e.message}`); process.exit(EXIT.RULES); }
  const rules = rulesDoc.rules ?? [];
  if (!rules.length) { console.error('E_RULES: 규칙이 0개다'); process.exit(EXIT.RULES); }
  const db = loadDatabase(sqlDir);
  const rowsBySlug = new Map(db.prepare('SELECT slug, title, title_ko, body_md, body_ko_md FROM wiki_document').all().map((r) => [r.slug, r]));
  for (const s of DOCS) if (!rowsBySlug.has(s)) { console.error(`E_SLUG: wiki_document에 '${s}' 행이 없다`); process.exit(EXIT.RULES); }

  // 매핑 재계산 — 규칙 표의 정적 표와 교차 검증한다.
  const { mapping, rows: mappingRows } = computeStateMapping(db);
  const declared = new Map((rulesDoc.stateIdMapping ?? []).map((r) => [r.id, r]));
  for (const row of mappingRows) {
    const d = declared.get(row.id);
    if (!d) { console.error(`E_MAPPING: 규칙 표에 ${row.id} 매핑이 없다`); process.exit(EXIT.RULES); }
    if (row.faction !== d.faction) { console.error(`E_MAPPING: ${row.id} 세력 불일치 — 데이터 계산 ${row.faction} vs 규칙 표 ${d.faction}`); process.exit(EXIT.RULES); }
    if (row.mapStationRow && (row.mapStationRow.name !== d.mapStationRow.name || row.mapStationRow.district_ko !== d.mapStationRow.district_ko)) {
      console.error(`E_MAPPING: ${row.id} 수도 역 행 불일치 — ${row.mapStationRow.name}/${row.mapStationRow.district_ko} vs ${d.mapStationRow.name}/${d.mapStationRow.district_ko}`);
      process.exit(EXIT.RULES);
    }
  }

  const applications = [];
  const lineApps = [];
  const droppedLog = [];
  const docStats = [];
  fs.mkdirSync(args.out, { recursive: true });
  for (const slug of DOCS) {
    const row = rowsBySlug.get(slug);
    for (const [lang, col] of [['ko', 'body_ko_md'], ['en', 'body_md']]) {
      const oldBody = row[col];
      const r1 = applySentenceRules(oldBody, slug, lang, rules, applications);
      const newBody = applyStateLineTransforms(r1.body, slug, lang, mapping, droppedLog, lineApps, r1.touched);
      // (1) 남은 가시 옛 국가 id가 없어야 한다
      const leftover = visibleStateIds(newBody);
      if (leftover.length) { console.error(`E_INVARIANT: ${slug} ${lang} 치환 뒤에도 가시 옛 국가 id가 남았다: ${leftover.join(', ')}`); process.exit(EXIT.INVARIANT); }
      // (2) 앵커·제목 불변, 길이 하한
      const [aOld, aNew] = [anchorSet(oldBody), anchorSet(newBody)];
      if (aOld.size !== aNew.size || [...aOld].some((x) => !aNew.has(x))) { console.error(`E_INVARIANT: ${slug} ${lang} 앵커 id 집합이 바뀌었다`); process.exit(EXIT.INVARIANT); }
      const [hOld, hNew] = [headingCount(oldBody), headingCount(newBody)];
      if (hOld !== hNew) { console.error(`E_INVARIANT: ${slug} ${lang} 제목 수가 바뀌었다(${hOld}→${hNew})`); process.exit(EXIT.INVARIANT); }
      if (byteLen(newBody) * 2 < byteLen(oldBody)) { console.error(`E_INVARIANT: ${slug} ${lang} 새 본문이 원본의 50% 미만이다`); process.exit(EXIT.INVARIANT); }
      // (3) 바뀐 줄은 추적된 줄뿐이다
      const oldLines = oldBody.split('\n');
      const newLines = newBody.split('\n');
      if (oldLines.length !== newLines.length) { console.error(`E_INVARIANT: ${slug} ${lang} 줄 수가 바뀌었다`); process.exit(EXIT.INVARIANT); }
      const changed = new Set();
      for (let i = 0; i < oldLines.length; i++) if (oldLines[i] !== newLines[i]) changed.add(i);
      for (const i of changed) if (!r1.touched.has(i)) { console.error(`E_INVARIANT: ${slug} ${lang} ${i + 1}줄이 추적 밖에서 바뀌었다`); process.exit(EXIT.INVARIANT); }
      // 문장 단위 통계(같은 splitter로 다시 셈)
      const oldUnits = splitSentences(oldBody);
      const newPool = splitSentences(newBody);
      let changedSentences = 0;
      const pool = [...newPool];
      for (const u of oldUnits) {
        const k = pool.indexOf(u);
        if (k >= 0) pool.splice(k, 1); else changedSentences++;
      }
      docStats.push({
        slug, lang, sentencesTotal: oldUnits.length, sentencesChanged: changedSentences, sentencesUnchanged: oldUnits.length - changedSentences,
        linesChanged: changed.size, byteOld: byteLen(oldBody), byteNew: byteLen(newBody), byteDelta: byteLen(newBody) - byteLen(oldBody),
        anchors: aNew.size, headings: hNew,
      });
      if (!args.dryRun) {
        fs.writeFileSync(path.join(args.out, `${slug}.${lang}.md`), `---\nmodel: ${args.model}\n---\n${newBody}`);
      }
    }
  }
  // 모든 규칙은 최소 한 번은 적용되어야 한다
  const unapplied = rules.filter((r) => !(r._total > 0));
  if (unapplied.length) {
    for (const r of unapplied) console.error(`E_RULE_NOT_FOUND: ${r.id} — 원문 문자열을 대상 문서에서 찾지 못했다: ${r.original.slice(0, 90)}`);
    process.exit(EXIT.RULE_NOT_FOUND);
  }

  const log = {
    generatedBy: 'scripts/pages/w4-edit.mjs',
    base: rulesDoc.base ?? null,
    model: args.model,
    ruleCount: rules.length,
    ruleApplicationCount: applications.reduce((a, x) => a + x.occurrences, 0),
    stateMapping: mappingRows.map((r) => ({
      id: r.id, faction: r.faction, dropped: r.dropped ?? false,
      wikiStateRow: r.wikiStateRow, mapStationRow: r.mapStationRow, bibleRow: r.bibleRow,
    })),
    droppedStateIds: droppedLog,
    ruleApplications: applications,
    stateLineApplications: lineApps,
    docs: docStats,
  };
  if (!args.dryRun) {
    fs.mkdirSync(path.dirname(args.log), { recursive: true });
    fs.writeFileSync(args.log, JSON.stringify(log, null, 1) + '\n');
  }
  const byDoc = new Map();
  for (const d of docStats) {
    if (!byDoc.has(d.slug)) byDoc.set(d.slug, { ko: null, en: null });
    byDoc.get(d.slug)[d.lang] = d;
  }
  for (const slug of DOCS) {
    const { ko, en } = byDoc.get(slug);
    console.log(`${slug}: ko 문장 ${ko.sentencesChanged}/${ko.sentencesTotal} 교체, ${ko.byteOld}→${ko.byteNew}B(${ko.byteDelta >= 0 ? '+' : ''}${ko.byteDelta}); en 문장 ${en.sentencesChanged}/${en.sentencesTotal} 교체, ${en.byteOld}→${en.byteNew}B(${en.byteDelta >= 0 ? '+' : ''}${en.byteDelta}); 앵커 ${ko.anchors}/${en.anchors}, 제목 ${ko.headings}/${en.headings}`);
  }
  const stateLines = lineApps.reduce((a, x) => (x.kind === 'states-array' ? a + 1 : a), 0);
  const idLists = lineApps.reduce((a, x) => (x.kind === 'id-list' ? a + 1 : a), 0);
  console.log(`규칙 ${rules.length}종 적용 ${applications.reduce((a, x) => a + x.occurrences, 0)}회, states 배열 ${stateLines}줄, id 목록 ${idLists}줄, 버린 id ${droppedLog.length}개${args.dryRun ? ' [dry-run: 기록하지 않았다]' : ''}`);
  if (!args.dryRun) console.log(`적용 로그: ${args.log}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
