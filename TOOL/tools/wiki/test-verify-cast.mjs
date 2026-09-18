import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const verifier = fileURLToPath(new URL('./verify-cast.mjs', import.meta.url));
const T0 = [
  '한재목', '강민서', '정호준', '임하준', '배우진', '임초원', '윤서린',
  '박태겸', '오해린', '최지우', '백온', '이홍원', '장세화', '류은비',
  '고서준', '남윤경', '정유라', '오경재',
];
const FIELDS = ['소속', '직위', '성격', '개인 야망', '공포', '통치 방식', '핵심 관계', '촉발 사건', '플레이어 개입'];
const fixtures = [];

after(async () => {
  for (const dir of fixtures) {
    await rm(dir, { recursive: true, force: true });
    console.log(`cleaned ${dir}`);
  }
});

function profileMd(name, { omit = [] } = {}) {
  const lines = [`### 인물 ${name}`, ''];
  for (const field of FIELDS) {
    if (omit.includes(field)) continue;
    lines.push(`- ${field}: x`);
  }
  return `${lines.join('\n')}\n`;
}

function relationsMd(rows) {
  return [
    '| 인물 | 유형 | 대상 | 근거 |',
    '| --- | --- | --- | --- |',
    ...rows.map(([from, type, to, reason]) => `| ${from} | ${type} | ${to} | ${reason} |`),
    '',
  ].join('\n');
}

function castIndexMd(rows) {
  return [
    '# 인물 총람', '',
    '| 이름 | 직위 | 단계 | 관계 수 |',
    '| --- | --- | --- | --- |',
    ...rows.map(([name, position, stage, count]) => `| ${name} | ${position} | ${stage} | ${count} |`),
    '',
  ].join('\n');
}

function unaffiliatedCardMd(name, { id = 'x-id', omit = [] } = {}) {
  const lines = [`### 인물 ${name}`, ''];
  if (id !== null) lines.push(`- 캐릭터 ID: ${id}`);
  for (const field of FIELDS) {
    if (omit.includes(field)) continue;
    lines.push(`- ${field}: x`);
  }
  return `${lines.join('\n')}\n`;
}

async function makeFixture({
  coreNames = T0,
  coreHeadings = null,
  omit = {},
  stateProfiles = {},
  relations = null,
  castIndex = null,
  unaffiliated = null,
} = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'verify-cast-'));
  fixtures.push(dir);
  const core = coreNames.map((name) => profileMd(name, { omit: omit[name] || [] })).join('\n');
  // ## 인물 표제는 카드와 같은 직위 총을 가져야 R2 신원 확인이 성립한다.
  const headings = (coreHeadings ?? [])
    .map((name) => `## ${name}\n\n- 직위: x\n`)
    .join('\n');
  await writeFile(join(dir, 'Core-Characters.md'), `# core\n\n${core}${headings ? `\n${headings}` : ''}`);
  for (const [file, names] of Object.entries(stateProfiles)) {
    const body = names.map((name) => profileMd(name, { omit: omit[name] || [] })).join('\n');
    await writeFile(join(dir, file), body);
  }
  if (relations !== null) await writeFile(join(dir, 'Cast-Relations.md'), relations);
  if (castIndex !== null) await writeFile(join(dir, 'Cast-Index.md'), castIndex);
  if (unaffiliated !== null) await writeFile(join(dir, 'Cast-Unaffiliated.md'), unaffiliated);
  return dir;
}

function run(docs, extraArgs = []) {
  const result = spawnSync(process.execPath, [verifier, '--docs', docs, ...extraArgs], { encoding: 'utf8' });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

test('happy path: T0 roster --stage s0 exits 0 without RULE lines', async () => {
  const docs = await makeFixture();
  const result = run(docs, ['--stage', 's0']);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.output, /^R\d+:/m);
});

test('R1: total below --min', async () => {
  const docs = await makeFixture();
  const result = run(docs, ['--min', String(T0.length + 1)]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R1:/m);
});

test('R2: duplicate name', async () => {
  const docs = await makeFixture({ coreNames: [...T0, '한재목'] });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R2:/m);
  assert.match(result.stderr, /한재목/);
});

test('R2: ruler duplicated in Core and exactly one Cast-State is whitelisted', async () => {
  const docs = await makeFixture({ coreHeadings: T0, stateProfiles: { 'Cast-State-01.md': ['한재목'] } });
  const result = run(docs);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.output, /^R\d+:/m);
});

test('R2: a third copy of the ruler duplicate still fails', async () => {
  const docs = await makeFixture({
    coreHeadings: T0,
    stateProfiles: { 'Cast-State-01.md': ['한재목'], 'Cast-State-02.md': ['한재목'] },
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R2:/m);
  assert.match(result.stderr, /한재목/);
});

test('R3: 4-char name', async () => {
  const docs = await makeFixture({ stateProfiles: { 'Cast-State-01.md': ['가나다라'] } });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R3:/m);
  assert.match(result.stderr, /가나다라/);
});

test('R3: non-hangul name', async () => {
  const docs = await makeFixture({ stateProfiles: { 'Cast-State-01.md': ['Kim'] } });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R3:/m);
  assert.match(result.stderr, /Kim/);
});

test('R4: T0 roster derives from Core ## headings; mismatch fails', async () => {
  const docs = await makeFixture({ coreHeadings: T0.filter((name) => name !== '정유라') });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R4:/m);
  assert.match(result.stderr, /정유라/);
});

test('R5: missing field', async () => {
  const docs = await makeFixture({ omit: { 한재목: ['공포'] } });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R5:/m);
  assert.match(result.stderr, /공포/);
});

test('R6: unknown relation target', async () => {
  const docs = await makeFixture({
    relations: relationsMd([['한재목', '계약', '홍길동', 'x']]),
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R6:/m);
  assert.match(result.stderr, /홍길동/);
});

test('R6: malformed relation row is a readable failure, not a crash', async () => {
  const docs = await makeFixture({
    relations: '| 인물 | 유형 | 대상 | 근거 |\n| --- | --- | --- | --- |\n| broken |\n',
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.equal(result.status ?? result.code, 1);
  assert.match(result.stderr, /^R6:/m);
  assert.doesNotMatch(result.stderr, /TypeError|undefined is not|Cannot read/);
});

test('R7: self-edge', async () => {
  const docs = await makeFixture({
    relations: relationsMd([['한재목', '계약', '한재목', 'x']]),
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R7:/m);
  assert.match(result.stderr, /한재목/);
});

test('R8: outgoing cap', async () => {
  const targets = T0.filter((name) => name !== '한재목').slice(0, 13);
  const rows = targets.map((name) => ['한재목', '계약', name, 'x']);
  const docs = await makeFixture({ relations: relationsMd(rows) });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R8:/m);
});

test('R9: isolate when relations exist', async () => {
  const docs = await makeFixture({
    relations: relationsMd([['한재목', '계약', '강민서', 'x']]),
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R9:/m);
  assert.match(result.stderr, /정호준/);
});

test('R10: unknown relation type', async () => {
  const docs = await makeFixture({
    relations: relationsMd([['한재목', '친구', '강민서', 'x']]),
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R10:/m);
});

test('R11: banned name', async () => {
  const docs = await makeFixture({ stateProfiles: { 'Cast-State-01.md': ['조조'] } });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R11:/m);
  assert.match(result.stderr, /조조/);
});

test('R12: --require-stage s1 shortfall', async () => {
  const docs = await makeFixture();
  const result = run(docs, ['--require-stage', 's1']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R12:/m);
  assert.match(result.stderr, /required=95/);
});

test('R12: --require-stage s2 shortfall uses cumulative 285', async () => {
  const docs = await makeFixture();
  const result = run(docs, ['--require-stage', 's2']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R12:/m);
  assert.match(result.stderr, /required=285/);
});

test('R12: --require-stage s3 shortfall uses cumulative 395', async () => {
  const docs = await makeFixture();
  const result = run(docs, ['--require-stage', 's3']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R12:/m);
  assert.match(result.stderr, /required=395/);
});

test('R13: --known-names missing from roster', async () => {
  const docs = await makeFixture();
  const result = run(docs, ['--known-names', '한소미']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R13:/m);
  assert.match(result.stderr, /한소미/);
});

test('R14: Cast-Index 관계 수 must equal outgoing edge count (송신 간선 수, 수신 제외)', async () => {
  const chain = T0.slice(0, -1).map((name, index) => [name, '계약', T0[index + 1], 'x']);
  const counts = new Map(T0.map((name) => [name, 0]));
  for (const [from] of chain) counts.set(from, 1);
  const rows = T0.map((name) => [name, '직위', '주요', String(counts.get(name))]);

  const consistent = await makeFixture({ relations: relationsMd(chain), castIndex: castIndexMd(rows) });
  const ok = run(consistent);
  assert.equal(ok.code, 0);
  assert.doesNotMatch(ok.output, /R14/);

  // 계약 위반 mutation: 사슬 끝 이름은 outgoing 0·incoming 1 — 수신 간선을 세어 적은 값은 실패해야 한다.
  const chainEnd = T0[T0.length - 1];
  const mutated = rows.map(([name, position, stage, count]) => (
    name === chainEnd ? [name, position, stage, '1'] : [name, position, stage, count]
  ));
  const broken = await makeFixture({ relations: relationsMd(chain), castIndex: castIndexMd(mutated) });
  const bad = run(broken);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /^R14:/m);
  assert.match(bad.stderr, new RegExp(chainEnd));
});

test('unaffiliated cards: parsed, full fields, distinct IDs, directed edge, outgoing counts (happy)', async () => {
  const chain = T0.slice(0, -1).map((name, index) => [name, '계약', T0[index + 1], 'x']);
  const rows = relationsMd([...chain, ['이연', '지휘', '조재표', '현장 수행과 거부 조건']]);
  const counts = new Map(T0.map((name) => [name, 0]));
  for (const [from] of chain) counts.set(from, 1);
  const index = castIndexMd([
    ...T0.map((name) => [name, '직위', '주요', String(counts.get(name))]),
    ['조재표', '유명 낭인 지휘자', 'S1', '0'],
    ['이연', '수행 전령', 'S1', '1'],
  ]);
  const docs = await makeFixture({
    relations: rows,
    castIndex: index,
    unaffiliated: `${unaffiliatedCardMd('조재표', { id: 'unaffiliated-jaepyo-jo' })}\n${unaffiliatedCardMd('이연', { id: 'iyen' })}`,
  });
  const result = run(docs);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.output, /^R\d+:/m);
});

test('R5: unaffiliated card missing a full-contract field', async () => {
  const chain = T0.slice(0, -1).map((name, index) => [name, '계약', T0[index + 1], 'x']);
  const counts = new Map(T0.map((name) => [name, 0]));
  for (const [from] of chain) counts.set(from, 1);
  const index = castIndexMd([
    ...T0.map((name) => [name, '직위', '주요', String(counts.get(name))]),
    ['조재표', '직위', 'S1', '0'],
    ['이연', '직위', 'S1', '1'],
  ]);
  const docs = await makeFixture({
    relations: relationsMd([...chain, ['이연', '지휘', '조재표', 'x']]),
    castIndex: index,
    unaffiliated: `${unaffiliatedCardMd('조재표', { id: 'a' })}\n${unaffiliatedCardMd('이연', { id: 'b', omit: ['공포'] })}`,
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R5:/m);
  assert.match(result.stderr, /이연/);
});

test('R15: two cards sharing one 캐릭터 ID cannot collapse into one identity', async () => {
  const chain = T0.slice(0, -1).map((name, index) => [name, '계약', T0[index + 1], 'x']);
  const counts = new Map(T0.map((name) => [name, 0]));
  for (const [from] of chain) counts.set(from, 1);
  const index = castIndexMd([
    ...T0.map((name) => [name, '직위', '주요', String(counts.get(name))]),
    ['조재표', '직위', 'S1', '0'],
    ['이연', '직위', 'S1', '1'],
  ]);
  const docs = await makeFixture({
    relations: relationsMd([...chain, ['이연', '지휘', '조재표', 'x']]),
    castIndex: index,
    unaffiliated: `${unaffiliatedCardMd('조재표', { id: 'iyen' })}\n${unaffiliatedCardMd('이연', { id: 'iyen' })}`,
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R15:/m);
  assert.match(result.stderr, /조재표/);
  assert.match(result.stderr, /이연/);
});

test('R15: unaffiliated card without 캐릭터 ID', async () => {
  const chain = T0.slice(0, -1).map((name, index) => [name, '계약', T0[index + 1], 'x']);
  const counts = new Map(T0.map((name) => [name, 0]));
  for (const [from] of chain) counts.set(from, 1);
  const index = castIndexMd([
    ...T0.map((name) => [name, '직위', '주요', String(counts.get(name))]),
    ['조재표', '직위', 'S1', '0'],
    ['이연', '직위', 'S1', '1'],
  ]);
  const docs = await makeFixture({
    relations: relationsMd([...chain, ['이연', '지휘', '조재표', 'x']]),
    castIndex: index,
    unaffiliated: `${unaffiliatedCardMd('조재표', { id: 'a' })}\n${unaffiliatedCardMd('이연', { id: null })}`,
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R15:/m);
  assert.match(result.stderr, /캐릭터 ID/);
});

test('R14: directed unaffiliated edge counts as outgoing for the sender only', async () => {
  const chain = T0.slice(0, -1).map((name, index) => [name, '계약', T0[index + 1], 'x']);
  const counts = new Map(T0.map((name) => [name, 0]));
  for (const [from] of chain) counts.set(from, 1);
  // 수신자를 센 잘못된 표: 조재표=1(수신), 이연=0(송신 아님으로 기록)
  const index = castIndexMd([
    ...T0.map((name) => [name, '직위', '주요', String(counts.get(name))]),
    ['조재표', '직위', 'S1', '1'],
    ['이연', '직위', 'S1', '0'],
  ]);
  const docs = await makeFixture({
    relations: relationsMd([...chain, ['이연', '지휘', '조재표', 'x']]),
    castIndex: index,
    unaffiliated: `${unaffiliatedCardMd('조재표', { id: 'a' })}\n${unaffiliatedCardMd('이연', { id: 'b' })}`,
  });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R14:/m);
  assert.match(result.stderr, /조재표/);
  assert.match(result.stderr, /이연/);
});

test('stale state: running the checker twice yields identical output', async () => {
  const docs = await makeFixture({ omit: { 한재목: ['공포'] } });
  const first = run(docs);
  const second = run(docs);
  assert.equal(first.code, second.code);
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.stderr, second.stderr);
  assert.equal(first.code, 1);
});

test('RULE lines are on stderr, not success prose', async () => {
  const docs = await makeFixture({ coreNames: [...T0, '한재목'] });
  const result = run(docs);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^R2:/m);
  assert.doesNotMatch(result.stdout, /^R2:/m);
});
