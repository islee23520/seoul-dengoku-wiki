import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const T0_NAMES = [
  '한재목', '강민서', '서이안', '임하준', '배우진', '임초원', '윤서린',
  '박태겸', '오해린', '문가람', '백온', '김도윤', '장세화', '류은비',
  '고서준', '남윤경', '정유라',
];
const PROFILE_FIELDS = [
  '소속', '직위', '성격', '개인 야망', '공포', '통치 방식', '핵심 관계', '촉발 사건', '플레이어 개입',
];
const RELATION_TYPES = new Set([
  '친족', '양자', '사제', '지휘', '계약', '빚', '맹세', '경쟁', '원한', '보호체류', '배신',
]);
const BANNED_HISTORICAL = [
  '조조',
  '유비',
  '관우',
  '장비',
  '제갈량',
  '사마의',
  '손권',
  '여포',
  '조운',
  '오다 노부나가',
  '노부나가',
  '도요토미',
  '히데요시',
  '이에야스',
  '다케다',
  '우에스기',
  '김유신',
  '연개소문',
  '궁예',
  '견훤',
  '왕건',
  '이성계',
  '최충헌',
  '이의민',
  '위만',
  '광개토',
  '계백',
  '을지문덕',
];
const BANNED_TITLES = [
  'Kenshi',
  'Underrail',
  'Gunner',
  '코에이',
  'Koei',
  '신장의 야망',
  'Romance of the Three Kingdoms',
  "Nobunaga's Ambition",
];
const REQUIRE_STAGE_COUNTS = { s1: 95, s2: 285, s3: 395 };
const NAME_RE = /^[가-힣]{2,3}$/;
const STAGES = new Set(['s0', 's1', 's2', 's3', 'all']);
const T0_SET = new Set(T0_NAMES);

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

function parseProfiles(text) {
  if (!text) return [];
  const profiles = [];
  for (const block of text.split(/(?=^### 인물 )/m)) {
    const heading = block.match(/^### 인물[ \t]+(.+)$/m);
    if (!heading) continue;
    const name = heading[1].trim();
    const fields = {};
    for (const line of block.split(/\r?\n/)) {
      const match = line.match(/^- ([^:]+):[ \t]*(.*)$/);
      if (!match) continue;
      fields[match[1]] = match[2].trim();
    }
    profiles.push({ name, fields });
  }
  return profiles;
}

function parseRelations(text, fail) {
  if (!text) return [];
  const relations = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length === 0) continue;
    if (cells[0] === '인물') continue;
    if (cells.every((cell) => cell === '' || /^:?-+:?$/.test(cell))) continue;
    if (cells.length !== 4) {
      fail('R6', `malformed relation row: ${line}`);
      continue;
    }
    const [from, type, to, reason] = cells;
    relations.push({ from, type, to, reason });
  }
  return relations;
}

// Cast-Index 국가 표에서 '관계 수' 열을 읽는다.
// 계약(Issue #19): '관계 수'는 송신 간선 수다(수신 간선 제외). T0 핵심 인물은 수신
// 간선으로만 연결될 수 있어 관계 수가 0이 될 수 있으며, 고립 판정은 R9의 무향 연결
// 기준으로 별도로 이루어진다.
function parseCastIndexCounts(text) {
  const counts = new Map();
  let inCastTable = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|')) {
      inCastTable = false;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 4) {
      inCastTable = false;
      continue;
    }
    if (cells[0] === '이름') {
      inCastTable = cells[3] === '관계 수';
      continue;
    }
    if (!inCastTable) continue;
    if (cells.every((cell) => cell === '' || /^:?-+:?$/.test(cell))) continue;
    const count = Number(cells[3]);
    if (Number.isInteger(count)) counts.set(cells[0], count);
  }
  return counts;
}

function parseArgs(argv) {
  const opts = {
    docs: null,
    stage: 's0',
    min: 0,
    requireStage: null,
    knownNames: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const take = () => {
      i += 1;
      if (argv[i] === undefined) throw new Error(`missing value for ${flag}`);
      return argv[i];
    };
    if (flag === '--docs') opts.docs = take();
    else if (flag === '--stage') opts.stage = take();
    else if (flag === '--min') opts.min = Number(take());
    else if (flag === '--require-stage') opts.requireStage = take();
    else if (flag === '--known-names') {
      opts.knownNames = take().split(',').map((name) => name.trim()).filter(Boolean);
    } else {
      throw new Error(`unknown argument: ${flag}`);
    }
  }
  if (!opts.docs) throw new Error('--docs is required');
  if (!STAGES.has(opts.stage)) throw new Error(`invalid --stage ${opts.stage}`);
  if (opts.requireStage && !(opts.requireStage in REQUIRE_STAGE_COUNTS)) {
    throw new Error(`invalid --require-stage ${opts.requireStage}`);
  }
  if (!Number.isFinite(opts.min) || opts.min < 0) throw new Error('invalid --min');
  return opts;
}

function bannedHit(name) {
  for (const token of BANNED_HISTORICAL) {
    if (name.includes(token)) return token;
  }
  for (const token of BANNED_TITLES) {
    if (name.includes(token)) return token;
  }
  return null;
}

export async function verifyCast(options) {
  const docs = options.docs;
  const min = options.min ?? 0;
  const requireStage = options.requireStage ?? null;
  const knownNames = options.knownNames ?? [];
  const violations = [];
  const fail = (rule, detail) => {
    violations.push({ rule, detail });
  };

  const coreText = await readOptional(join(docs, 'Core-Characters.md'));
  const t0Profiles = parseProfiles(coreText);
  const stateProfiles = [];
  for (let n = 1; n <= 16; n += 1) {
    const file = `Cast-State-${String(n).padStart(2, '0')}.md`;
    const text = await readOptional(join(docs, file));
    if (text === null) continue;
    stateProfiles.push(...parseProfiles(text));
  }
  const unaffiliatedText = await readOptional(join(docs, 'Cast-Unaffiliated.md'));
  const unaffiliatedProfiles = parseProfiles(unaffiliatedText);
  const relationText = await readOptional(join(docs, 'Cast-Relations.md'));
  const relations = parseRelations(relationText, fail);

  const roster = [...t0Profiles, ...stateProfiles, ...unaffiliatedProfiles];
  const names = roster.map((profile) => profile.name);
  const nameSet = new Set(names);

  if (names.length < min) fail('R1', `total=${names.length} min=${min}`);

  const seen = new Map();
  for (const name of names) {
    seen.set(name, (seen.get(name) || 0) + 1);
  }
  for (const [name, count] of seen) {
    if (count > 1) fail('R2', `duplicate name ${name} count=${count}`);
  }

  for (const name of names) {
    if (!NAME_RE.test(name)) fail('R3', `invalid name '${name}'`);
  }

  const t0Names = t0Profiles.map((profile) => profile.name);
  const t0Set = new Set(t0Names);
  const missingT0 = T0_NAMES.filter((name) => !t0Set.has(name));
  const extraT0 = [...t0Set].filter((name) => !T0_SET.has(name));
  if (missingT0.length > 0 || extraT0.length > 0) {
    fail('R4', `T0 names mismatch missing=${missingT0.join(',')} extra=${extraT0.join(',')}`);
  }

  for (const profile of roster) {
    for (const field of PROFILE_FIELDS) {
      if (!profile.fields[field]) fail('R5', `${profile.name} missing ${field}`);
    }
  }

  for (const relation of relations) {
    for (const endpoint of [relation.from, relation.to]) {
      if (!nameSet.has(endpoint)) fail('R6', `unknown name ${endpoint}`);
    }
  }

  for (const relation of relations) {
    if (relation.from === relation.to) fail('R7', `self-edge ${relation.from}`);
  }

  const outgoing = new Map();
  for (const relation of relations) {
    outgoing.set(relation.from, (outgoing.get(relation.from) || 0) + 1);
  }
  for (const [name, count] of outgoing) {
    const cap = T0_SET.has(name) ? 12 : 6;
    if (count > cap) fail('R8', `${name} outgoing=${count} cap=${cap}`);
  }

  // R14 — Cast-Index '관계 수'는 송신 간선 수와 일치해야 한다(수신 제외).
  const indexText = await readOptional(join(docs, 'Cast-Index.md'));
  if (indexText !== null) {
    for (const [name, tableCount] of parseCastIndexCounts(indexText)) {
      const expected = outgoing.get(name) || 0;
      if (tableCount !== expected) {
        fail('R14', `Cast-Index ${name} 관계 수=${tableCount} outgoing=${expected}`);
      }
    }
  }

  const skipIsolates = relations.length === 0 && min <= names.length;
  if (!skipIsolates) {
    const connected = new Set();
    for (const relation of relations) {
      connected.add(relation.from);
      connected.add(relation.to);
    }
    const isolates = names.filter((name, index) => names.indexOf(name) === index && !connected.has(name));
    if (isolates.length > 0) fail('R9', `isolates=${isolates.join(',')}`);
  }

  for (const relation of relations) {
    if (!RELATION_TYPES.has(relation.type)) {
      fail('R10', `unknown type '${relation.type}' on ${relation.from}→${relation.to}`);
    }
  }

  for (const name of nameSet) {
    const token = bannedHit(name);
    if (token) fail('R11', `banned name ${name} (${token})`);
  }

  if (requireStage) {
    const required = REQUIRE_STAGE_COUNTS[requireStage];
    const found = stateProfiles.length;
    if (found !== required) {
      fail('R12', `Cast-State profiles=${found} required=${required}`);
    }
  }

  for (const name of knownNames) {
    if (!nameSet.has(name)) fail('R13', `known name not in roster: ${name}`);
  }

  // R15 — 캐릭터 ID는 무소속 페이지 카드에 필수이며, 두 카드가 같은 ID로
  // 병합되어서는 안 된다(외부 출처·동명 위험 인물의 안정 식별자).
  const idOwners = new Map();
  for (const profile of roster) {
    const id = profile.fields['캐릭터 ID'];
    if (!id) continue;
    const owner = idOwners.get(id);
    if (owner) fail('R15', `duplicate 캐릭터 ID ${id} on ${owner} and ${profile.name}`);
    else idOwners.set(id, profile.name);
  }
  for (const profile of unaffiliatedProfiles) {
    if (!profile.fields['캐릭터 ID']) fail('R15', `${profile.name} missing 캐릭터 ID`);
  }

  return { violations, roster, relations };
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
  const { violations } = await verifyCast(opts);
  for (const item of violations) {
    console.error(`${item.rule}: ${item.detail}`);
  }
  process.exitCode = violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
