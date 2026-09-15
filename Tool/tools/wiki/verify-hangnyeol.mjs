import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 성씨·본관·항렬 데이터 계약 검사기.
// 계약 문서: Wikis/game-logic/name-pools/hangnyeol-schema.md
//
// 이 검사기의 목적은 하나다. 출처 없이 지어낸 성씨 인구·본관·항렬자가
// 정본 데이터에 들어오지 못하게 막는 것. 그래서 인용문을 저장소 안 원자료
// 파일과 실제로 대조하고, 창작 가계 표에 실존 출처가 붙는 것을 금지한다.

const POOL_DIR = join('Wikis', 'game-logic', 'name-pools');
const DATA = {
  surnames: join(POOL_DIR, 'surnames-bongwan.json'),
  systems: join(POOL_DIR, 'hangnyeol-systems.json'),
  clans: join(POOL_DIR, 'clan-hangnyeol-tables.json'),
  cast: join(POOL_DIR, 'cast-hangnyeol.json'),
};
const LEGACY_SURNAMES = join(POOL_DIR, 'surnames.json');

const PROVENANCE = new Set(['verified', 'creative']);
const CAST_STATUS = new Set(['applied', 'unused', 'unconfirmed']);
const POSITIONS = new Set(['first', 'second']);
const LIVE_CHECKS = new Set(['verbatim_ok', 'artifact_corrected', 'unchecked']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EVIDENCE_PREFIX = join('Research', 'verification', 'hangnyeol');

function norm(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isFilled(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}

// 재대조 보고는 마크다운 표다. 칸 하나가 record id와 정확히 같아야 그 행으로 본다.
// 부분 문자열로 찾으면 sug1이 sug10을 물어 온다.
function findReportRow(lines, recordId) {
  for (const line of lines) {
    if (!line.includes('|')) continue;
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.includes(recordId)) return line;
  }
  return null;
}

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function verifyHangnyeol(options = {}) {
  const root = options.root ?? process.cwd();
  const withCast = options.cast ?? false;
  const violations = [];
  const fail = (rule, detail) => violations.push({ rule, detail });

  const evidenceCache = new Map();
  const loadEvidence = async (relPath) => {
    if (evidenceCache.has(relPath)) return evidenceCache.get(relPath);
    const text = await readOptional(join(root, relPath));
    const value = text === null ? null : norm(text);
    evidenceCache.set(relPath, value);
    return value;
  };

  // 재대조 보고는 행 구조를 살려 읽는다. loadEvidence는 공백을 접어 버려 표를 못 읽는다.
  const reportCache = new Map();
  const loadReport = async (relPath) => {
    if (reportCache.has(relPath)) return reportCache.get(relPath);
    const text = await readOptional(join(root, relPath));
    const value = text === null ? null : text.split(/\r?\n/);
    reportCache.set(relPath, value);
    return value;
  };

  const docs = {};
  for (const [key, rel] of Object.entries(DATA)) {
    if (key === 'cast' && !withCast) continue;
    const text = await readOptional(join(root, rel));
    if (text === null) {
      fail('H1', `missing data file ${rel}`);
      continue;
    }
    try {
      docs[key] = JSON.parse(text);
    } catch (err) {
      fail('H2', `${rel} is not valid JSON: ${err.message}`);
    }
  }

  // 라이브 재대조 집계. H8은 우리가 쓴 파일끼리의 자기 일관성만 증명한다.
  let liveTotal = 0;
  let liveVerified = 0;

  // 출처 표를 파일별로 세운다. 파일 하나가 자기 sources만 참조한다.
  const sourceIndex = new Map();
  for (const [key, doc] of Object.entries(docs)) {
    const rel = DATA[key];
    const table = new Map();
    sourceIndex.set(key, table);
    if (!Array.isArray(doc?.sources)) {
      fail('H3', `${rel} has no sources array`);
      continue;
    }
    for (const [i, src] of doc.sources.entries()) {
      const where = `${rel} sources[${i}]`;
      if (!isFilled(src?.id)) {
        fail('H6', `${where} missing id`);
        continue;
      }
      if (table.has(src.id)) fail('H12', `${rel} duplicate source id ${src.id}`);
      table.set(src.id, src);
      for (const field of ['url', 'accessed', 'quote', 'evidence']) {
        if (!isFilled(src[field])) fail('H6', `${rel} source ${src.id} missing ${field}`);
      }
      if (isFilled(src.url) && !/^https?:\/\//.test(src.url)) {
        fail('H6', `${rel} source ${src.id} url is not http(s): ${src.url}`);
      }
      if (isFilled(src.accessed) && !DATE_RE.test(src.accessed)) {
        fail('H6', `${rel} source ${src.id} accessed is not YYYY-MM-DD: ${src.accessed}`);
      }

      // H18·H19 — 라이브 재대조 판정.
      // H8(원장 대조)은 수확 워커가 자기 레인 파일에 날조한 인용을 적어도 통과한다.
      // 독립 재대조 보고의 판정을 행에 묶어야 그 구멍이 막힌다.
      if (!isFilled(src.live_check)) {
        fail('H18', `${rel} source ${src.id} missing live_check (verbatim_ok | artifact_corrected | unchecked)`);
      } else if (!LIVE_CHECKS.has(src.live_check)) {
        fail('H18', `${rel} source ${src.id} live_check must be verbatim_ok, artifact_corrected or unchecked; got ${src.live_check}`);
      } else {
        liveTotal += 1;
        if (src.live_check !== 'unchecked') {
          const wanted = src.live_check === 'verbatim_ok' ? 'VERBATIM_OK' : 'MISMATCH';
          if (!isFilled(src.record_id)) {
            fail('H19', `${rel} source ${src.id} live_check ${src.live_check} requires record_id`);
          } else if (!isFilled(src.live_check_ref)) {
            fail('H19', `${rel} source ${src.id} live_check ${src.live_check} requires live_check_ref`);
          } else if (!norm(src.live_check_ref).startsWith(norm(EVIDENCE_PREFIX))) {
            fail('H19', `${rel} source ${src.id} live_check_ref must live under ${EVIDENCE_PREFIX}/: ${src.live_check_ref}`);
          } else {
            const report = await loadReport(src.live_check_ref);
            if (report === null) {
              fail('H19', `${rel} source ${src.id} re-fetch report missing: ${src.live_check_ref}`);
            } else {
              const row = findReportRow(report, src.record_id);
              if (!row) {
                fail('H19', `${rel} source ${src.id} record_id ${src.record_id} is absent from the re-fetch report ${src.live_check_ref}`);
              } else if (!row.includes(wanted)) {
                const actual = row.includes('VERBATIM_OK') ? 'VERBATIM_OK'
                  : row.includes('MISMATCH') ? 'MISMATCH'
                    : row.includes('URL_DEAD') ? 'URL_DEAD' : 'no verdict';
                fail('H19', `${rel} source ${src.id} claims ${wanted} but the re-fetch report row for ${src.record_id} says ${actual}`);
              } else {
                liveVerified += 1;
              }
            }
          }
        }
      }

      if (!isFilled(src.evidence) || !isFilled(src.quote)) continue;
      if (!norm(src.evidence).startsWith(norm(EVIDENCE_PREFIX))) {
        fail('H7', `${rel} source ${src.id} evidence must live under ${EVIDENCE_PREFIX}/: ${src.evidence}`);
        continue;
      }
      const evidence = await loadEvidence(src.evidence);
      if (evidence === null) {
        fail('H7', `${rel} source ${src.id} evidence file missing: ${src.evidence}`);
        continue;
      }
      if (!evidence.includes(norm(src.quote))) {
        fail('H8', `${rel} source ${src.id} quote not found verbatim in ${src.evidence}`);
      }
    }
  }

  const requireSources = (key, where, ids) => {
    const table = sourceIndex.get(key) ?? new Map();
    if (!Array.isArray(ids) || ids.length === 0) {
      fail('H9', `${where} has no sources`);
      return 0;
    }
    let ok = 0;
    for (const id of ids) {
      if (table.has(id)) ok += 1;
      else fail('H5', `${where} references unknown source id ${id}`);
    }
    return ok === ids.length ? 1 : 0;
  };

  let rowsRequiringSource = 0;
  let rowsSourced = 0;
  const countRow = (key, where, ids) => {
    rowsRequiringSource += 1;
    rowsSourced += requireSources(key, where, ids);
  };

  // ---- surnames-bongwan.json ----
  let surnameCount = 0;
  let bongwanCount = 0;
  const surnameHangul = new Set();
  if (docs.surnames) {
    const rel = DATA.surnames;
    const list = docs.surnames.surnames;
    if (!Array.isArray(list)) {
      fail('H3', `${rel} has no surnames array`);
    } else {
      const seen = new Set();
      for (const [i, row] of list.entries()) {
        const where = `${rel} surnames[${i}]`;
        for (const field of ['id', 'hangul']) {
          if (!isFilled(row?.[field])) fail('H4', `${where} missing ${field}`);
        }
        if (isFilled(row?.id)) {
          if (seen.has(row.id)) fail('H12', `${rel} duplicate surname id ${row.id}`);
          seen.add(row.id);
        }
        if (isFilled(row?.hangul)) surnameHangul.add(row.hangul);
        surnameCount += 1;
        countRow('surnames', `${where} (${row?.hangul ?? '?'})`, row?.sources);
        if (!Array.isArray(row?.bongwan)) {
          fail('H4', `${where} (${row?.hangul ?? '?'}) has no bongwan array`);
          continue;
        }
        // 2015 집계표의 대성 본관 칸은 인구 과반을 차지하는 본관만 적는다.
        // 희성은 그 칸이 비어 있다. 본관을 지어 붙이는 대신 없다는 사실을 선언하게 한다.
        if (row.bongwan.length === 0) {
          if (!isFilled(row?.bongwan_unlisted_reason)) {
            fail('H20', `${where} (${row?.hangul ?? '?'}) has an empty bongwan list and no bongwan_unlisted_reason`);
          }
          continue;
        }
        if (isFilled(row?.bongwan_unlisted_reason)) {
          fail('H20', `${where} (${row?.hangul ?? '?'}) declares bongwan_unlisted_reason but carries bongwan`);
        }
        for (const [j, bg] of row.bongwan.entries()) {
          const bwWhere = `${where}.bongwan[${j}]`;
          for (const field of ['id', 'name']) {
            if (!isFilled(bg?.[field])) fail('H4', `${bwWhere} missing ${field}`);
          }
          bongwanCount += 1;
          countRow('surnames', `${bwWhere} (${bg?.name ?? '?'} ${row?.hangul ?? '?'}씨)`, bg?.sources);
        }
      }
    }

    const legacy = await readOptional(join(root, LEGACY_SURNAMES));
    if (legacy !== null) {
      try {
        const parsed = JSON.parse(legacy);
        for (const name of parsed?.surnames ?? []) {
          if (!surnameHangul.has(name)) {
            fail('H16', `surnames.json surname ${name} is absent from ${DATA.surnames}`);
          }
        }
      } catch {
        // surnames.json 파손은 이 검사기의 책임이 아니다.
      }
    }
  }

  // ---- hangnyeol-systems.json ----
  const systemIds = new Set();
  if (docs.systems) {
    const rel = DATA.systems;
    const list = docs.systems.systems;
    if (!Array.isArray(list)) {
      fail('H3', `${rel} has no systems array`);
    } else {
      for (const [i, row] of list.entries()) {
        const where = `${rel} systems[${i}]`;
        for (const field of ['id', 'name', 'summary']) {
          if (!isFilled(row?.[field])) fail('H4', `${where} missing ${field}`);
        }
        if (isFilled(row?.id)) {
          if (systemIds.has(row.id)) fail('H12', `${rel} duplicate system id ${row.id}`);
          systemIds.add(row.id);
        }
        countRow('systems', `${where} (${row?.id ?? '?'})`, row?.sources);
      }
    }
  }

  // ---- clan-hangnyeol-tables.json ----
  const clanIndex = new Map();
  let clanCount = 0;
  let verifiedClans = 0;
  let creativeClans = 0;
  if (docs.clans) {
    const rel = DATA.clans;
    const list = docs.clans.clans;
    if (!Array.isArray(list)) {
      fail('H3', `${rel} has no clans array`);
    } else {
      for (const [i, clan] of list.entries()) {
        const where = `${rel} clans[${i}]`;
        for (const field of ['id', 'surname', 'bongwan', 'provenance']) {
          if (!isFilled(clan?.[field])) fail('H4', `${where} missing ${field}`);
        }
        if (isFilled(clan?.id)) {
          if (clanIndex.has(clan.id)) fail('H12', `${rel} duplicate clan id ${clan.id}`);
          clanIndex.set(clan.id, clan);
        }
        clanCount += 1;
        if (!PROVENANCE.has(clan?.provenance)) {
          fail('H4', `${where} provenance must be verified or creative, got ${clan?.provenance}`);
        } else if (clan.provenance === 'verified') {
          verifiedClans += 1;
          countRow('clans', `${where} (${clan.bongwan} ${clan.surname}씨)`, clan?.sources);
        } else {
          creativeClans += 1;
          if (Array.isArray(clan?.sources) && clan.sources.length > 0) {
            fail('H10', `${where} (${clan.bongwan} ${clan.surname}씨) is creative but carries sources — 창작 표에 실존 출처를 붙일 수 없다`);
          }
          if (!isFilled(clan?.creative_rationale)) {
            fail('H10', `${where} (${clan.bongwan} ${clan.surname}씨) creative table missing creative_rationale`);
          }
          if (!isFilled(clan?.method_ref)) {
            fail('H10', `${where} (${clan.bongwan} ${clan.surname}씨) creative table missing method_ref`);
          } else if (systemIds.size > 0 && !systemIds.has(clan.method_ref)) {
            fail('H5', `${where} method_ref ${clan.method_ref} is not a known system id`);
          }
        }

        const rows = clan?.rows;
        if (!Array.isArray(rows)) {
          fail('H4', `${where} (${clan?.bongwan ?? '?'}) has no rows array`);
          continue;
        }
        if (rows.length === 0) {
          if (!isFilled(clan?.hangnyeol_unconfirmed_reason)) {
            fail('H21', `${where} (${clan?.bongwan ?? '?'}) has no rows and no hangnyeol_unconfirmed_reason`);
          }
          continue;
        }
        if (isFilled(clan?.hangnyeol_unconfirmed_reason)) {
          fail('H21', `${where} (${clan?.bongwan ?? '?'}) carries rows but also declares hangnyeol_unconfirmed_reason`);
        }
        const sesuSeen = new Set();
        for (const [j, row] of rows.entries()) {
          const rowWhere = `${where}.rows[${j}]`;
          if (!Number.isInteger(row?.sesu)) fail('H4', `${rowWhere} sesu must be an integer`);
          else if (sesuSeen.has(row.sesu)) fail('H12', `${rowWhere} duplicate sesu ${row.sesu}`);
          else sesuSeen.add(row.sesu);
          if (!isFilled(row?.hangnyeol)) fail('H4', `${rowWhere} missing hangnyeol`);
          if (!POSITIONS.has(row?.position)) {
            fail('H4', `${rowWhere} position must be first or second, got ${row?.position}`);
          }
          if (isFilled(row?.provenance) && row.provenance !== clan?.provenance) {
            fail('H11', `${rowWhere} provenance ${row.provenance} differs from clan ${clan?.provenance} — 한 표에 실존과 창작을 섞을 수 없다`);
          }
          if (clan?.provenance === 'creative' && Array.isArray(row?.sources) && row.sources.length > 0) {
            fail('H10', `${rowWhere} creative row carries sources`);
          }
        }
      }
    }
  }

  // ---- cast-hangnyeol.json ----
  let castCount = 0;
  let appliedCount = 0;
  if (withCast && docs.cast) {
    const rel = DATA.cast;
    const list = docs.cast.people;
    const parents = docs.cast?.lineage?.parents ?? {};
    const founderSesu = docs.cast?.lineage?.founder_sesu ?? {};
    const deriveSesu = (name) => {
      const seen = new Set();
      let current = name;
      let depth = 0;
      while (!Number.isInteger(founderSesu[current])) {
        if (seen.has(current)) return { error: `lineage cycle at ${current}` };
        seen.add(current);
        current = parents[current];
        if (!current) return { error: `no parent-to-founder path` };
        depth += 1;
      }
      return { sesu: founderSesu[current] + depth };
    };
    if (!Array.isArray(list)) {
      fail('H3', `${rel} has no people array`);
    } else {
      const byGeneration = new Map();
      const seenNames = new Set();
      for (const [i, person] of list.entries()) {
        const where = `${rel} people[${i}] (${person?.name ?? '?'})`;
        castCount += 1;
        if (!isFilled(person?.name)) fail('H4', `${where} missing name`);
        else if (seenNames.has(person.name)) fail('H12', `${rel} duplicate person ${person.name}`);
        else seenNames.add(person.name);
        if (!CAST_STATUS.has(person?.status)) {
          fail('H13', `${where} status must be applied, unused or unconfirmed, got ${person?.status}`);
          continue;
        }
        if (!isFilled(person?.reason)) fail('H13', `${where} missing reason`);

        if (person.status !== 'applied') {
          if (isFilled(person?.hangnyeol)) {
            fail('H13', `${where} status ${person.status} must not carry hangnyeol`);
          }
          continue;
        }

        appliedCount += 1;
        for (const field of ['clan', 'hangnyeol', 'position']) {
          if (!isFilled(person?.[field])) fail('H13', `${where} applied but missing ${field}`);
        }
        if (!Number.isInteger(person?.sesu)) fail('H13', `${where} applied but sesu is not an integer`);
        if (!POSITIONS.has(person?.position)) continue;

        const derived = deriveSesu(person.name);
        if (derived.error) {
          fail('H22', `${where} ${derived.error}`);
        } else if (Number.isInteger(person?.sesu) && derived.sesu !== person.sesu) {
          fail('H22', `${where} says sesu ${person.sesu}, derived sesu ${derived.sesu} from parent-to-founder path`);
        }

        const clan = clanIndex.get(person?.clan);
        if (!clan) {
          fail('H5', `${where} references unknown clan id ${person?.clan}`);
          continue;
        }
        const row = (clan.rows ?? []).find((r) => r.sesu === person.sesu);
        if (!row) {
          fail('H13', `${where} clan ${clan.id} has no row for sesu ${person.sesu}`);
        } else if (row.hangnyeol !== person.hangnyeol) {
          fail('H13', `${where} hangnyeol ${person.hangnyeol} does not match clan table ${row.hangnyeol} at sesu ${person.sesu}`);
        }

        // 이름에 실제로 그 글자가 그 자리에 있는가.
        const name = String(person.name ?? '');
        const surname = String(person.surname ?? '');
        const given = surname && name.startsWith(surname) ? name.slice(surname.length) : '';
        if (!given) {
          fail('H13', `${where} surname ${surname || '(none)'} does not prefix the name`);
        } else {
          const index = person.position === 'first' ? 0 : 1;
          if (given[index] !== person.hangnyeol) {
            fail('H15', `${where} hangnyeol ${person.hangnyeol} is not at ${person.position} syllable of 이름 ${given}`);
          }
        }

        const key = `${person.clan}|${person.branch ?? ''}`;
        if (!byGeneration.has(key)) byGeneration.set(key, new Map());
        const table = byGeneration.get(key);
        if (!table.has(person.sesu)) table.set(person.sesu, new Map());
        const chars = table.get(person.sesu);
        chars.set(person.hangnyeol, [...(chars.get(person.hangnyeol) ?? []), person.name]);
      }

      // H14 같은 문중·분파·세수는 한 항렬자만 쓴다.
      // H17 같은 문중·분파에서 다른 세수가 같은 항렬자를 쓰지 않는다.
      for (const [key, table] of byGeneration) {
        for (const [sesu, chars] of table) {
          if (chars.size > 1) {
            const detail = [...chars.entries()]
              .map(([char, names]) => `${char}(${names.join(',')})`)
              .join(' vs ');
            fail('H14', `${key} sesu ${sesu} uses ${chars.size} different hangnyeol: ${detail}`);
          }
        }
        const charToSesu = new Map();
        for (const [sesu, chars] of table) {
          for (const char of chars.keys()) {
            if (charToSesu.has(char)) {
              fail('H17', `${key} hangnyeol ${char} is shared by sesu ${charToSesu.get(char)} and ${sesu}`);
            } else {
              charToSesu.set(char, sesu);
            }
          }
        }
      }
    }
  }

  const sourcedPct = rowsRequiringSource === 0
    ? 0
    : Math.round((rowsSourced / rowsRequiringSource) * 1000) / 10;

  const liveVerifiedPct = liveTotal === 0
    ? 0
    : Math.round((liveVerified / liveTotal) * 1000) / 10;

  const summary = {
    surnames: surnameCount,
    bongwan: bongwanCount,
    clans: clanCount,
    verifiedClans,
    creativeClans,
    systems: systemIds.size,
    rowsRequiringSource,
    rowsSourced,
    sourcedPct,
    liveTotal,
    liveVerified,
    liveVerifiedPct,
    cast: castCount,
    applied: appliedCount,
  };

  return { violations, summary };
}

function parseArgs(argv) {
  const opts = { root: process.cwd(), cast: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--cast') opts.cast = true;
    else if (flag === '--root') {
      i += 1;
      if (argv[i] === undefined) throw new Error('missing value for --root');
      opts.root = argv[i];
    } else {
      throw new Error(`unknown argument: ${flag}`);
    }
  }
  return opts;
}

function formatSummary(summary) {
  return [
    `surnames=${summary.surnames}`,
    `bongwan=${summary.bongwan}`,
    `clans=${summary.clans}`,
    `verified=${summary.verifiedClans}`,
    `creative=${summary.creativeClans}`,
    `systems=${summary.systems}`,
    `cast=${summary.cast}`,
    `applied=${summary.applied}`,
    `sourced=${summary.sourcedPct}%`,
    `live_verified=${summary.liveVerifiedPct}%`,
  ].join(' ');
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
    return;
  }
  const { violations, summary } = await verifyHangnyeol(opts);
  for (const item of violations) {
    console.error(`${item.rule}: ${item.detail}`);
  }
  console.log(formatSummary(summary));
  process.exitCode = violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
