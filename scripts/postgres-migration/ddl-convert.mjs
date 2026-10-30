#!/usr/bin/env node
// 정본 SQLite 스키마의 기계적 PostgreSQL DDL 변환기.
// 재설계 금지 원칙: sqlite_schema + PRAGMA table_info/foreign_key_list/index_list와
// sqlite_master SQL(CHECK·트리거)을 그대로 읽어 1:1 대응 DDL을 생성한다.
//   INTEGER → bigint(정수 flag 포함, boolean 전환 금지), REAL → double precision,
//   TEXT → text, BLOB → bytea. 명시적 ID·복합 PK·NULL/DEFAULT·CHECK 보존.
//   identity/generated 컬럼은 생성하지 않는다(자동 할당 writer 없음이 확인됨).
// 생성물:
//   schema-pg/tables.sql      — CREATE TABLE + CREATE INDEX (wiki / wiki_private)
//   schema-pg/constraints.sql — ALTER TABLE ... ADD CONSTRAINT ... NOT VALID (적재 후 검증)
//   schema-pg/guards.sql      — 불변 가드 트리거 (적재 후 설치)
//   schema-pg/apply.sql       — tables.sql만 단일 트랜잭션으로 적용하는 진입점
//   schema-pg/inventory.json  — 소스별·테이블별 카탈로그(행수 포함), source_sha256 바인딩
//   schema-pg/metadata.json   — code_commit / source_sha256 / schema_version / migration_id
// 사설 저장소: 물리 DB 파일이 이 머신에 존재하지 않으므로 스키마 원천은
// scripts/document-store/*.sql 모듈을 메모리 SQLite에서 실행해 동일 PRAGMA 경로로
// 변환하며, 설정된 실제 경로(환경변수 override 포함)와 존재 여부를 inventory에 기록한다.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA_VERSION } from '../cast-sqlite/db.mjs';

const MIGRATION_ID = 'postgres-migration-20261026';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function fail(message) { throw new Error(`E_DDL_CONVERT: ${message}`); }

// ---------------------------------------------------------------- SQL 파싱 유틸
function splitTopLevel(text, separator = ',') {
  const parts = [];
  let depth = 0, token = '', quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      token += ch;
      if (ch === quote) {
        if (text[i + 1] === quote) { token += text[++i]; continue; }
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; token += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === separator && depth === 0) { parts.push(token); token = ''; continue; }
    token += ch;
  }
  if (token.trim()) parts.push(token);
  return parts;
}

function parenBody(sql) { // "CREATE TABLE name (BODY) tail" → {name, body, tail}
  const m = sql.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?("[^"]+"|[\w]+)\s*\(/i);
  if (!m) fail(`CREATE TABLE 헤더 파싱 실패: ${sql.slice(0, 80)}`);
  let depth = 0, quote = null, end = -1;
  for (let i = m[0].length - 1; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) fail(`CREATE TABLE 괄호 미종결: ${m[1]}`);
  return { name: m[1], body: sql.slice(m[0].length, end), tail: sql.slice(end + 1) };
}

const TYPE_MAP = { INTEGER: 'bigint', REAL: 'double precision', TEXT: 'text', BLOB: 'bytea' };
function mapType(type) {
  const mapped = TYPE_MAP[type.toUpperCase()];
  if (!mapped) fail(`알 수 없는 컬럼 타입: ${type}`);
  return mapped;
}

function unquoteIdent(token) {
  const t = token.trim();
  return t.startsWith('"') ? t.slice(1, -1).replaceAll('""', '"') : t;
}
function quoteIdent(name) { return `"${name.replaceAll('"', '""')}"`; }
// PostgreSQL NAMEDATALEN(63바이트) 제한 — 기계적 절단(충돌 없음은 inventory가 기록)
const pgIdent = (name) => (name.length > 63 ? name.slice(0, 63) : name);
// 충돌 위험이 있는 절단(접미사가 의미를 가지는 이름)은 해시 접미로 고정 길이 변환
import { createHash } from 'node:crypto';
const hashIdent = (name) => (name.length <= 63
  ? name
  : `${name.slice(0, 50)}_${createHash('sha256').update(name).digest('hex').slice(0, 12)}`);

// SQLite DEFAULT 식 → PostgreSQL 식 (알려진 패턴만 기계 사상, 그 외는 실패)
function mapDefault(expr) {
  let e = expr.trim();
  while (e.startsWith('(') && e.endsWith(')')) {
    const inner = e.slice(1, -1);
    // 외부 괄호인지 확인(내부에 최상위 괄호 쌍이 있으면 외부 괄호)
    let depth = 0, outer = true;
    for (const ch of inner) {
      if (ch === '(') { depth++; if (depth === 1) { /* ok */ } }
      else if (ch === ')') { depth--; if (depth === 0 && inner.indexOf(ch) !== inner.length - 1) { outer = false; break; } }
    }
    if (!outer) break;
    e = inner.trim();
  }
  const strftime = e.match(/^strftime\('([^']*)'\s*,\s*'now'\)$/i);
  if (strftime) {
    const fmt = strftime[1];
    if (fmt === '%Y-%m-%dT%H:%M:%fZ')
      return `to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
    fail(`미지원 strftime 형식: ${fmt}`);
  }
  if (/^-?\d+(\.\d+)?$/.test(e) || /^'[^']*'$/.test(e) || /^(NULL|CURRENT_TIMESTAMP|TRUE|FALSE)$/i.test(e)) return e;
  fail(`미지원 DEFAULT 식: ${e}`);
}

// Guard SQL is machine-emitted; rewrite exact known table names only in relation-reference positions.
function rewriteGuardTableRefs(sql, renameMap, tableNames) {
  if (!renameMap) return sql;
  const known = new Set(tableNames);
  return sql.replace(/\b(FROM|JOIN|INTO|UPDATE)\s+("[^"]+"|[\w]+)/gi, (all, keyword, token) => {
    const name = unquoteIdent(token);
    if (!known.has(name)) return all;
    return `${keyword} ${quoteIdent(renameMap[name] ?? name)}`;
  });
}

// 트리거 본문 → plpgsql 함수 본문 (두 가지 기계 패턴만 허용)
function convertTriggerBody(body, renameMap, tableNames) {
  const b = rewriteGuardTableRefs(body.trim().replace(/;$/, ''), renameMap, tableNames);
  const raise = b.match(/^SELECT\s+RAISE\((?:ABORT|FAIL)\s*,\s*('(?:[^']|'')*')\)$/i);
  if (raise) return `RAISE EXCEPTION ${raise[1]};`;
  const caseForm = b.match(/^SELECT\s+CASE\s+WHEN\s+([\s\S]+?)\s+THEN\s+RAISE\((?:ABORT|FAIL)\s*,\s*('(?:[^']|'')*')\)\s+END$/i);
  if (caseForm) return `IF ${caseForm[1]} THEN\n    RAISE EXCEPTION ${caseForm[2]};\n  END IF;`;
  fail(`미지원 트리거 본문: ${b.slice(0, 120)}`);
}

const TRIGGER_RE = /^CREATE\s+TRIGGER\s+("?[\w]+"?)\s+(BEFORE|AFTER)\s+((?:(?:INSERT|UPDATE|DELETE)(?:\s+OR\s+)?)+)\s+ON\s+("?[\w]+"?)\s*(?:WHEN\s+([\s\S]*?))?\s*BEGIN\s*([\s\S]*?)\s*END\s*;?\s*$/i;
function parseTrigger(sql) {
  const m = sql.match(TRIGGER_RE);
  if (!m) fail(`트리거 파싱 실패: ${sql.slice(0, 120)}`);
  const events = m[3].split(/\s+OR\s+/i).map((e) => e.toUpperCase());
  return { name: unquoteIdent(m[1]), time: m[2].toUpperCase(), events, table: unquoteIdent(m[4]), when: m[5]?.trim(), body: m[6] };
}

// FOREIGN KEY 절 분석 (text에서 DEFERRABLE/액션 보존)
function parseForeignKey(def) {
  const m = def.match(/^FOREIGN\s+KEY\s*\(([^)]*)\)\s*REFERENCES\s+("?[\w]+"?)(?:\s*\(([^)]*)\))?\s*([\s\S]*)$/i);
  if (!m) fail(`FOREIGN KEY 절 파싱 실패: ${def.slice(0, 120)}`);
  const tail = m[4].trim();
  const onDelete = tail.match(/ON\s+DELETE\s+(SET NULL|SET DEFAULT|CASCADE|RESTRICT|NO ACTION)/i)?.[1];
  const onUpdate = tail.match(/ON\s+UPDATE\s+(SET NULL|SET DEFAULT|CASCADE|RESTRICT|NO ACTION)/i)?.[1];
  const deferrable = /DEFERRABLE/i.test(tail);
  const initiallyDeferred = /INITIALLY\s+DEFERRED/i.test(tail);
  const rest = tail
    .replace(/MATCH\s+[\w]+/gi, '')
    .replace(/ON\s+(DELETE|UPDATE)\s+(SET NULL|SET DEFAULT|CASCADE|RESTRICT|NO ACTION)/gi, '')
    .replace(/(NOT\s+)?DEFERRABLE/gi, '')
    .replace(/INITIALLY\s+(DEFERRED|IMMEDIATE)/gi, '')
    .trim();
  if (rest) fail(`FOREIGN KEY 미지원 절: ${rest}`);
  return {
    columns: splitTopLevel(m[1]).map(unquoteIdent),
    refTable: unquoteIdent(m[2]),
    refColumns: m[3] ? splitTopLevel(m[3]).map(unquoteIdent) : [],
    onDelete: onDelete?.toUpperCase(), onUpdate: onUpdate?.toUpperCase(),
    deferrable, initiallyDeferred,
  };
}

// SQLite GLOB 패턴 → POSIX 정규식 (기계 사상)
function globToRegex(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') out += '.*';
    else if (ch === '?') out += '.';
    else if (ch === '[') {
      const end = pattern.indexOf(']', i + 1);
      if (end < 0) fail(`GLOB 문자열 미종결: ${pattern}`);
      out += pattern.slice(i, end + 1);
      i = end;
    } else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return out + '$';
}
// SQLite 식 → PostgreSQL 호환 식 (LIKE는 ASCII 대소문자 무시 → ILIKE, GLOB → 정규식 일치,
// `x IS <리터럴>` → `x = <리터럴>` — SQLite IS 일반 동등 비교 보존, IS NULL은 유지)
function mapSqliteExpr(expr) {
  return expr
    .replace(/\bNOT\s+GLOB\s+('(?:[^']|'')*')/gi, (all, lit) => `!~ '${globToRegex(lit.slice(1, -1).replaceAll("''", "'"))}'`)
    .replace(/\bGLOB\s+('(?:[^']|'')*')/gi, (all, lit) => `~ '${globToRegex(lit.slice(1, -1).replaceAll("''", "'"))}'`)
    .replace(/\bIS\s+NOT\s+(-?\d+(?:\.\d+)?|'(?:[^']|'')*')\b/gi, (all, lit) => `<> ${lit}`)
    .replace(/\bIS\s+(-?\d+(?:\.\d+)?|'(?:[^']|'')*')\b/gi, (all, lit) => `= ${lit}`)
    .replace(/\bchar\((\d+)\)/gi, (all, n) => `chr(${n})`)
    .replace(/\binstr\(\s*([\w."]+)\s*,\s*(chr\(\d+\)|'(?:[^']|'')*')\s*\)\s*=\s*(\d+)/gi,
      (all, hay, needle, n) => `position(${needle} in ${hay}) = ${n}`)
    .replace(/\bLIKE\b/gi, 'ILIKE')
    // SQLite 불리언 산술: `(cond)+(cond)...` 체인을 CASE 정수화 (루프로 체인 전체 처리)
    .replace(/\(([^()]*(?:IS(?:\s+NOT)?\s+NULL|IN\s*\([^()]*\)|=[^()]*))\)\s*([+\-])\s*\(([^()]*(?:IS(?:\s+NOT)?\s+NULL|IN\s*\([^()]*\)|=[^()]*))\)/gi,
      (all, c1, op, c2) => `(CASE WHEN ${c1.trim()} THEN 1 ELSE 0 END) ${op} (CASE WHEN ${c2.trim()} THEN 1 ELSE 0 END)`);
}

// CHECK/UNIQUE 식의 비식별자(문자열/기존 인용) 외부의 대소문자 혼합 컬럼 참조를 인용
function quoteCheckIdentifiers(expr, columns) {
  const mixed = columns.map((c) => c.name).filter((n) => /[A-Z]/.test(n)).sort((a, b) => b.length - a.length);
  let out = '';
  let quote = null;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) { out += ch; if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; out += ch; continue; }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[\w]/.test(expr[j])) j++;
      const word = expr.slice(i, j);
      out += mixed.includes(word) ? quoteIdent(word) : word;
      i = j - 1;
      continue;
    }
    out += ch;
  }
  return out;
}

// ---------------------------------------------------------------- 테이블 변환
const CONSTRAINT_HEAD = /^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN)\b/i;

function convertTable(db, name, schemaQual, pgName = name) {
  pgName = pgIdent(pgName);
  const sqlRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(name);
  const { body, tail } = parenBody(sqlRow.sql);
  if (/WITHOUT\s+ROWID/i.test(tail)) fail(`WITHOUT ROWID 미지원 테이블: ${name}`);
  const defs = splitTopLevel(body);
  const columns = [];
  const checks = [];
  const uniques = [];
  const fks = [];
  let fkSeq = 0;
  for (const rawDef of defs) {
    const def = rawDef.trim();
    if (CONSTRAINT_HEAD.test(def)) {
      if (/^FOREIGN\b/i.test(def)) {
        fks.push({ name: `fk_${pgName}_${fkSeq++}`, ...parseForeignKey(def) });
      } else if (/^PRIMARY\s+KEY\b/i.test(def) || /^CONSTRAINT\s+\S+\s+PRIMARY\s+KEY\b/i.test(def)) {
        // PK는 table_info(pk)가 권위 — 별도 중복 제약 없이 pkCols에서 단일 PRIMARY KEY만 생성
      } else if (/^CHECK\b/i.test(def)) {
        checks.push(mapSqliteExpr(quoteCheckIdentifiers(def, columns)));
      } else {
        uniques.push(def); // PRIMARY KEY/UNIQUE/CHECK named — 그대로 보존
      }
      continue;
    }
    const tokens = def.match(/^("[^"]+"|[\w]+)\s*([\s\S]*)$/);
    if (!tokens) fail(`컬럼 정의 파싱 실패: ${def.slice(0, 80)}`);
    const colName = unquoteIdent(tokens[1]);
    let rest = tokens[2].trim();
    // STRICT 스키마는 단일 타입 토큰
    const typeToken = rest.match(/^(INTEGER|REAL|TEXT|BLOB)\b/i);
    if (!typeToken) fail(`컬럼 타입 확인 실패 (${name}.${colName}): ${rest.slice(0, 80)}`);
    const pgType = mapType(typeToken[1]);
    rest = rest.slice(typeToken[1].length).trim();
    let notNull = false, primaryKey = false, defaultValue;
    const colChecks = [];
    // 수정자 순회: PRIMARY KEY / NOT NULL / UNIQUE / DEFAULT expr / CHECK(...) / REFERENCES...(→FK 목록)
    let guard = 0;
    while (rest && guard++ < 20) {
      let m;
      if ((m = rest.match(/^PRIMARY\s+KEY\b/i))) { primaryKey = true; rest = rest.slice(m[0].length).trim(); continue; }
      if ((m = rest.match(/^NOT\s+NULL\b/i))) { notNull = true; rest = rest.slice(m[0].length).trim(); continue; }
      if ((m = rest.match(/^NULL\b/i))) { rest = rest.slice(m[0].length).trim(); continue; }
      if ((m = rest.match(/^UNIQUE\b/i))) { uniques.push(`UNIQUE (${quoteIdent(colName)})`); rest = rest.slice(m[0].length).trim(); continue; }
      if ((m = rest.match(/^DEFAULT\s+/i))) {
        const after = rest.slice(m[0].length);
        const exprTrimmed = after.startsWith('(')
          ? after.slice(0, (() => { let d = 0, q = null; for (let i = 0; i < after.length; i++) { const ch = after[i]; if (q) { if (ch === q) q = null; continue; } if (ch === "'" || ch === '"') { q = ch; continue; } if (ch === '(') d++; else if (ch === ')') { d--; if (d === 0) return i + 1; } } return after.length; })())
          : (after.match(/^[^\s(]+/)?.[0] ?? fail(`DEFAULT 파싱 실패: ${rest}`));
        defaultValue = mapDefault(exprTrimmed);
        rest = after.slice(exprTrimmed.length).trim();
        continue;
      }
      if ((m = rest.match(/^CHECK\s*\(/i))) {
        let depth = 0, i = m[0].length - 1, quote = null;
        for (; i < rest.length; i++) {
          const ch = rest[i];
          if (quote) { if (ch === quote) quote = null; continue; }
          if (ch === "'" || ch === '"') { quote = ch; continue; }
          if (ch === '(') depth++;
          else if (ch === ')') { depth--; if (depth === 0) break; }
        }
        colChecks.push(rest.slice(0, i + 1));
        rest = rest.slice(i + 1).trim();
        continue;
      }
      if ((m = rest.match(/^REFERENCES\s+/i))) {
        const refMatch = rest.match(/^REFERENCES\s+("[^"]+"|[\w]+)(?:\s*\(([^)]*)\))?/i);
        if (!refMatch) fail(`REFERENCES 파싱 실패 (${name}.${colName}): ${rest.slice(0, 120)}`);
        fks.push({ name: `fk_${pgName}_${fkSeq++}`, columns: [colName], refTable: unquoteIdent(refMatch[1]), refColumns: refMatch[2] ? splitTopLevel(refMatch[2]).map(unquoteIdent) : [], onDelete: undefined, onUpdate: undefined, deferrable: false, initiallyDeferred: false });
        rest = rest.slice(refMatch[0].length).trim();
        if ((m = rest.match(/^(NOT\s+)?DEFERRABLE(\s+INITIALLY\s+(DEFERRED|IMMEDIATE))?/i))) {
          const fk = fks[fks.length - 1];
          fk.deferrable = !/^NOT/i.test(m[1] ?? '');
          fk.initiallyDeferred = /DEFERRED/i.test(m[3] ?? '');
          rest = rest.slice(m[0].length).trim();
        }
        continue;
      }
      if ((m = rest.match(/^COLLATE\s+\w+/i))) { rest = rest.slice(m[0].length).trim(); continue; }
      fail(`미지원 컬럼 수정자 (${name}.${colName}): ${rest.slice(0, 80)}`);
    }
    const info = db.prepare('PRAGMA table_info(' + JSON.stringify(name).slice(1, -1) + ')').all()
      .find((c) => c.name === colName);
    if (!info) fail(`table_info 불일치: ${name}.${colName}`);
    if (info.notnull) notNull = true;
    columns.push({ name: colName, type: info.type, pgType, notNull, primaryKey, defaultValue, checks: colChecks });
  }
  // PK는 table_info(pk)가 권위 — 컬럼 정의와 교차 검증
  const pkCols = db.prepare('PRAGMA table_info(' + JSON.stringify(name).slice(1, -1) + ')').all()
    .filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
  for (const c of columns) {
    if (c.primaryKey && !pkCols.includes(c.name)) fail(`PK 불일치: ${name}.${c.name}`);
    if (/\bGENERATED\s+ALWAYS\b|\bAS\s*\(|\bAUTOINCREMENT\b/i.test(sqlRow.sql)) fail(`자동 생성 컬럼 발견: ${name}`);
  }
  const lines = columns.map((c) =>
    `  ${quoteIdent(c.name)} ${c.pgType}`
    + (c.notNull ? ' NOT NULL' : '')
    + (c.defaultValue !== undefined ? ` DEFAULT ${c.defaultValue}` : '')
    + (c.checks.length ? ' ' + c.checks.map((x) => mapSqliteExpr(quoteCheckIdentifiers(x, columns))).join(' ') : ''));
  if (pkCols.length) lines.push(`  PRIMARY KEY (${pkCols.map(quoteIdent).join(', ')})`);
  for (const u of uniques) lines.push(`  ${mapSqliteExpr(quoteCheckIdentifiers(u, columns))}`);
  for (const chk of checks) lines.push(`  ${chk}`);
  const qualified = `${schemaQual}.${quoteIdent(pgName)}`;
  const createSql = `CREATE TABLE ${qualified} (\n${lines.join(',\n')}\n);`;
  return { name: pgName, sourceName: name, qualified, createSql, fks, fkSql: null, columns, checks: [...checks, ...columns.flatMap((c) => c.checks)] };
}

function fkToSql(table, fk, schemaQual, refPkResolver) {
  const refColumns = fk.refColumns.length ? fk.refColumns : refPkResolver(fk.refTable);
  const parts = [
    `ALTER TABLE ${table.qualified} ADD CONSTRAINT ${quoteIdent(hashIdent(fk.name))}`,
    `FOREIGN KEY (${fk.columns.map(quoteIdent).join(', ')})`,
    `REFERENCES ${schemaQual}.${quoteIdent(fk.refTable)} (${refColumns.map(quoteIdent).join(', ')})`,
  ];
  if (fk.onDelete) parts.push(`ON DELETE ${fk.onDelete}`);
  if (fk.onUpdate) parts.push(`ON UPDATE ${fk.onUpdate}`);
  if (fk.deferrable) parts.push(fk.initiallyDeferred ? 'DEFERRABLE INITIALLY DEFERRED' : 'DEFERRABLE');
  parts.push('NOT VALID');
  return parts.join(' ') + ';';
}

function convertIndexes(db, tableName, schemaQual) {
  const rows = db.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL").all(tableName);
  return rows.map((r) => {
    // PG는 인덱스 이름에 스키마 수식을 허용하지 않는다 — 테이블 스키마에 생성됨
    const sql = r.sql.replace(/^CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?("[^"]+"|[\w]+)/i, (all, uniq, idxName) => {
      void all;
      return `CREATE ${uniq ?? ''}INDEX ${pgIdent(unquoteIdent(idxName))}`;
    });
    return sql.replace(/(\bON\s+)("[^"]+"|[\w]+)/i, (all, on, tbl) => `${on}${schemaQual}.${tbl}`) + ';';
  });
}

function convertTriggers(db, tableName, schemaQual, renameMap = null, knownTableNames = null) {
  const rows = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='trigger' AND tbl_name=?").all(tableName);
  return rows.map((r) => {
    const t = parseTrigger(r.sql);
    const pgTable = renameMap?.[t.table] ?? t.table;
    const fnName = hashIdent(`guard_${t.name}`);
    const body = convertTriggerBody(t.body, renameMap, knownTableNames ?? [tableName]);
    const alwaysRaises = /^RAISE EXCEPTION\b/.test(body) && !t.when && !/^IF\b/.test(body);
    const events = t.events.map((e) => (e === 'UPDATE' && /UPDATE\s+OF/i.test(r.sql) ? fail(`UPDATE OF 미지원: ${t.name}`) : e)).join(' OR ');
    // PG trigger WHEN disallows subqueries; rewrite exact source relation names before moving it into the function.
    const when = t.when ? rewriteGuardTableRefs(t.when.replace(/\n/g, ' '), renameMap, knownTableNames ?? [tableName]) : null;
    const bodyLines = when
      ? [`  IF (${when}) THEN`, `    ${body}`, `  END IF;`]
      : [`  ${body}`];
    return {
      name: t.name,
      sql: [
        `CREATE FUNCTION ${schemaQual}.${quoteIdent(fnName)}() RETURNS trigger LANGUAGE plpgsql SET search_path = ${schemaQual}, pg_temp AS $guard$`,
        `BEGIN`,
        ...bodyLines,
        ...(alwaysRaises ? [] : [`  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;`, `  RETURN NEW;`]),
        `END`,
        `$guard$;`,
        `CREATE TRIGGER ${quoteIdent(hashIdent(t.name))} ${t.time} ${events} ON ${schemaQual}.${quoteIdent(pgTable)}`,
        `  FOR EACH ROW EXECUTE FUNCTION ${schemaQual}.${quoteIdent(fnName)}();`,
      ].join('\n'),
    };
  });
}

// ---------------------------------------------------------------- 소스 정의
function openCanonical(path) {
  if (!existsSync(path)) fail(`정본 파일 없음: ${path}`);
  const db = new DatabaseSync(path, { readOnly: true });
  const meta = { a: db.prepare('PRAGMA application_id').get().application_id, v: db.prepare('PRAGMA user_version').get().user_version };
  if (meta.a !== 0x57435351) fail(`application_id 불일치: ${meta.a}`);
  if (meta.v !== SCHEMA_VERSION) fail(`user_version 불일치: ${meta.v}`);
  return db;
}

// document-store 사설 저장소: 스키마 원천 = SQL 모듈(메모리 SQLite 실행), 물리 파일은 코드·환경변수 설정 경로
const PRIVATE_STORES = [
  { key: 'editorial', env: 'WIKI_EDITORIAL_DB', file: 'editorial.sqlite', prefix: 'ed_', modules: ['scripts/document-store/schema.sql'], note: 'census·scope 계약 문서 테이블(scripts/cast-sqlite/*.sql)도 동일 DB에 상주하며 이미 wiki.* 스키마에 포함된다' },
  { key: 'soul_assignment', env: 'WIKI_SOUL_ASSIGNMENT_DB', file: 'soul-assignments.sqlite', prefix: null, modules: ['scripts/document-store/soul-assignment.sql', 'scripts/document-store/soul-assignment-edit.sql'] },
  { key: 'editorial_profile', env: 'WIKI_EDITORIAL_PROFILE_DB', file: 'editorial-profiles.sqlite', prefix: null, modules: ['scripts/document-store/editorial-profile.sql'] },
  { key: 'soul_candidate', env: 'WIKI_SOUL_CANDIDATE_DB', file: 'candidates.sqlite', prefix: null, modules: ['scripts/document-store/soul-candidate-documents.sql'] },
  { key: 'soul_review', env: 'WIKI_SOUL_REVIEW_DB', file: 'review.sqlite', prefix: null, modules: ['scripts/document-store/soul-review-documents.sql'] },
  { key: 'soul_batch', env: 'WIKI_SOUL_BATCH_DB', file: 'batches.sqlite', prefix: null, modules: ['scripts/document-store/soul-batch-documents.sql'] },
  { key: 'opening_sample', env: 'WIKI_OPENING_SAMPLE_DB', file: 'captured-opening-sample-20261021.sqlite', prefix: null, modules: ['scripts/document-store/opening-sample-documents.sql'] },
  { key: 'editorial_envelope', env: 'WIKI_EDITORIAL_ENVELOPE_DB', file: 'captured-editorial-envelopes-20261021.sqlite', prefix: 'env_', modules: ['scripts/document-store/editorial-envelope-documents.sql'] },
  { key: 'evidence_archive', env: null, file: '.omo/private/seoul-migration/sqlite-authority-20261021/scope-atlas-reader-capture-20261021.sqlite', prefix: 'ev_', modules: ['scripts/document-store/evidence.sql'], note: '코드 고정 경로(scripts/document-store/private-source-archive.mjs), 환경변수 override 없음' },
];

function openModuleDb(modules) {
  const db = new DatabaseSync(':memory:');
  for (const rel of modules) db.exec(readFileSync(join(ROOT, rel), 'utf8'));
  return db;
}

// ---------------------------------------------------------------- 메인
function main() {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const dbPath = get('--db') ?? 'data/canonical/wiki-cast.sqlite';
  const outDir = resolve(get('--out') ?? 'scripts/postgres-migration/schema-pg');
  mkdirSync(outDir, { recursive: true });

  const sourceSha256 = execFileSync('shasum', ['-a', '256', resolve(ROOT, dbPath)], { cwd: ROOT })
    .toString().split(/\s+/)[0];
  const codeCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT }).toString().trim();

  const canonical = openCanonical(resolve(ROOT, dbPath));
  const tableNames = canonical.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);

  // --- wiki.* 변환
  const pkColsOf = (db, name) => db.prepare(`PRAGMA table_info(${JSON.stringify(name)})`).all()
    .filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
  const wikiTables = tableNames.map((n) => convertTable(canonical, n, 'wiki'));
  const wikiPk = Object.fromEntries(tableNames.map((n) => [n, pkColsOf(canonical, n)]));
  for (const t of wikiTables)
    t.fkSql = t.fks.map((f) => fkToSql(t, f, 'wiki', (ref) => wikiPk[ref] ?? fail(`FK 참조 테이블 없음: ${ref}`)));
  const wikiFks = wikiTables.flatMap((t) => t.fkSql);
  const wikiIndexes = tableNames.flatMap((n) => convertIndexes(canonical, n, 'wiki'));
  const wikiRenameMap = Object.fromEntries(wikiTables.map((t) => [t.sourceName, t.name]));
  const wikiGuards = tableNames.flatMap((n) => convertTriggers(canonical, n, 'wiki', wikiRenameMap, tableNames));

  // --- wiki_private.* 변환 (SQL 모듈 → 메모리 SQLite → 동일 PRAGMA 경로)
  const privateTables = [];
  const privateGuards = [];
  const privateInventory = [];
  for (const store of PRIVATE_STORES) {
    const envPath = store.env ? process.env[store.env] : undefined;
    const defaultPath = join(ROOT, store.file);
    const physicalPath = envPath ?? defaultPath;
    const exists = existsSync(physicalPath);
    const db = openModuleDb(store.modules);
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
    const renameMap = store.prefix ? Object.fromEntries(names.map((n) => [n, store.prefix + n])) : null;
    const pgNames = names.map((n) => renameMap?.[n] ?? n);
    const tables = names.map((n) => convertTable(db, n, 'wiki_private', renameMap?.[n] ?? n));
    for (const t of tables) // 스토어 내부 FK 참조도 리네임 반영
      for (const f of t.fks) f.refTable = renameMap?.[f.refTable] ?? f.refTable;
    const guards = names.flatMap((n) => convertTriggers(db, n, 'wiki_private', renameMap, names));
    const storePk = Object.fromEntries(names.map((n, i) => [pgNames[i], pkColsOf(db, n)]));
    for (const t of tables)
      t.fkSql = t.fks.map((f) => fkToSql(t, f, 'wiki_private', (ref) => storePk[ref] ?? fail(`FK 참조 테이블 없음 (${store.key}): ${ref}`)));
    privateTables.push(...tables);
    privateGuards.push(...guards);
    privateInventory.push({
      store: store.key,
      configured_path: { env: store.env, default: store.file, resolved: physicalPath, exists, ...(exists ? { sha256: execFileSync('shasum', ['-a', '256'], { input: physicalPath + '\n' }).toString().split(/\s+/)[0] } : {}) },
      schema_source_modules: store.modules,
      table_count: names.length,
      tables: pgNames,
      ...(renameMap ? { pg_name_map: renameMap, prefix_note: `wiki.*와 이름 충돌 테이블 — 스토어 접두어 '${store.prefix}' 적용` } : {}),
      row_counts: exists ? Object.fromEntries(names.map((n) => [n, db.prepare(`SELECT count(*) AS c FROM ${JSON.stringify(n)}`).get().c])) : null,
      row_counts_note: exists ? undefined : '물리 DB 파일이 이 머신에 존재하지 않아 행수 미집계(스키마는 SQL 모듈에서 기계 변환)',
      ...(store.note ? { note: store.note } : {}),
    });
    db.close();
  }

  // 이름 충돌 검사(접두어 없이 전역 유일이 확인되면 원래 이름 유지)
  const allNames = [...wikiTables.map((t) => t.name), ...privateTables.map((t) => t.name)];
  const dup = allNames.filter((n, i) => allNames.indexOf(n) !== i);
  if (dup.length) fail(`스키마 간 테이블 이름 충돌(접두어 필요): ${[...new Set(dup)].join(', ')}`);

  const privateFks = privateTables.flatMap((t) => t.fkSql);

  // --- inventory.json
  const canonicalInventory = tableNames.map((name) => {
    const t = wikiTables.find((x) => x.sourceName === name);
    return {
      name,
      pg_name: t.name,
      ...(t.name !== name ? { pg_name_note: 'PostgreSQL NAMEDATALEN(63바이트) 제한으로 기계적 절단' } : {}),
      row_count: canonical.prepare(`SELECT count(*) AS c FROM ${JSON.stringify(name)}`).get().c,
      columns: t.columns.map((c) => ({ name: c.name, sqlite_type: c.type, pg_type: c.pgType, notnull: c.notNull || pkColsOf(canonical, name).includes(c.name), default: c.defaultValue })),
      primary_key: pkColsOf(canonical, name),
      check_count: t.checks.length,
      foreign_keys: t.fks.map((f) => ({ name: f.name, columns: f.columns, ref_table: f.refTable, ref_columns: f.refColumns, on_delete: f.onDelete, on_update: f.onUpdate, deferrable: f.deferrable, initially_deferred: f.initiallyDeferred })),
      indexes: convertIndexes(canonical, name, 'wiki').length,
      triggers: convertTriggers(canonical, name, 'wiki').length,
    };
  });
  const inventory = {
    migration_id: MIGRATION_ID,
    generated_at: new Date().toISOString(),
    sources: {
      canonical: {
        path: dbPath, sha256: sourceSha256,
        application_id: 0x57435351, schema_version: SCHEMA_VERSION,
        table_count: tableNames.length,
        fk_constraint_count: wikiFks.length,
        explicit_index_count: wikiIndexes.length,
        trigger_count: wikiGuards.length,
        tables: canonicalInventory,
      },
      private_stores: privateInventory,
    },
  };

  // --- metadata.json
  const metadata = {
    migration_id: MIGRATION_ID,
    code_commit: codeCommit,
    source_sha256: sourceSha256,
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
  };

  // --- SQL 생성물
  const header = (title, contract) => `-- ${title}\n-- 생성물: scripts/postgres-migration/ddl-convert.mjs (기계 변환, 수동 편집 금지)\n-- source_sha256: ${sourceSha256}\n-- code_commit: ${codeCommit}\n-- ${contract}\n`;

  const tablesSql = [
    header('tables.sql — CREATE TABLE + CREATE INDEX (wiki, wiki_private)',
      '계약: apply.sql이 이 파일만 단일 트랜잭션으로 적용한다. 재실행은 비어 있는 새 DB에서만 유효하다(IF NOT EXISTS 없음 — 의도적 계약).'),
    'CREATE SCHEMA IF NOT EXISTS wiki;',
    'ALTER SCHEMA wiki OWNER TO wiki_owner;',
    'SET ROLE wiki_owner;',
    // Separate from canonical tables: actual SQLite rowid bound to the declared PK tuple.
    `CREATE TABLE wiki.legacy_row_order (
  table_name text NOT NULL,
  key_json jsonb NOT NULL CHECK (jsonb_typeof(key_json) = 'array'),
  ordinal bigint NOT NULL,
  PRIMARY KEY (table_name, key_json),
  UNIQUE (table_name, ordinal)
);`,
    ...wikiTables.map((t) => t.createSql),
    ...wikiIndexes,
    'RESET ROLE;',
    'CREATE SCHEMA IF NOT EXISTS wiki_private;',
    'ALTER SCHEMA wiki_private OWNER TO wiki_private_owner;',
    'SET ROLE wiki_private_owner;',
    ...privateTables.map((t) => t.createSql),
    'RESET ROLE;',
    '',
  ].join('\n');

  const constraintsSql = [
    header('constraints.sql — FK 제약 (NOT VALID, 데이터 적재 후 검증)',
      '계약: 데이터 COPY 후 `ALTER TABLE ... VALIDATE CONSTRAINT`로 검증한다. tables.sql에는 FK가 의도적으로 없다.'),
    `SET ROLE wiki_owner;`,
    ...wikiFks,
    `SET ROLE wiki_private_owner;`,
    ...privateFks,
    'RESET ROLE;',
    // 적재 후 검증 스텝(주석 제공 — 실행은 Todo 4 적재기가 수행)
    '-- 검증 스텝(적재 완료 후 실행):',
    '--   SELECT format(\'ALTER TABLE %I.%I VALIDATE CONSTRAINT %I;\', schemaname, tablename, conname)',
    '--     FROM pg_constraint WHERE contype=\'f\' AND NOT convalidated \\gexec',
    '',
  ].join('\n');

  const guardsSql = [
    header('guards.sql — 불변 가드 트리거 (데이터 적재 후 설치)',
      '계약: SQLite 트리거를 plpgsql 가드 함수로 기계 변환한다. COPY 간섭을 피하기 위해 적재 후 설치한다.'),
    `SET ROLE wiki_owner;`,
    ...wikiGuards.map((g) => g.sql),
    `SET ROLE wiki_private_owner;`,
    ...privateGuards.map((g) => g.sql),
    'RESET ROLE;',
    '',
  ].join('\n');

  const applySql = [
    header('apply.sql — 진입점: tables.sql(테이블+인덱스)만 단일 트랜잭션 적용',
      '계약: `psql -1 -f apply.sql`로 실행. constraints.sql/guards.sql은 데이터 적재 후 별도 적용. 재실행은 새 DB 전용(멱등 아님).'),
    '\\set ON_ERROR_STOP on',
    '\\ir tables.sql',
    '',
  ].join('\n');

  writeFileSync(join(outDir, 'tables.sql'), tablesSql);
  writeFileSync(join(outDir, 'constraints.sql'), constraintsSql);
  writeFileSync(join(outDir, 'guards.sql'), guardsSql);
  writeFileSync(join(outDir, 'apply.sql'), applySql);
  writeFileSync(join(outDir, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
  writeFileSync(join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');

  process.stdout.write(JSON.stringify({
    source_sha256: sourceSha256,
    wiki_tables: wikiTables.length, wiki_fks: wikiFks.length,
    wiki_indexes: wikiIndexes.length, wiki_guards: wikiGuards.length,
    wiki_private_tables: privateTables.length, wiki_private_fks: privateFks.length,
    wiki_private_guards: privateGuards.length,
  }) + '\n');
}

main();
