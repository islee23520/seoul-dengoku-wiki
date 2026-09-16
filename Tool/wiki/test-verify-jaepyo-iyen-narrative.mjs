import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 조재표·이연 공동 서사 검사기 계약 테스트.
// 계약: Tool/tools/wiki/verify-jaepyo-iyen-narrative.mjs
// 규칙 코드는 제품 계약이다. 코드가 바뀌면 이 테스트가 먼저 실패해야 한다.

const HERE = fileURLToPath(new URL('.', import.meta.url));
const VALIDATOR = join(HERE, 'verify-jaepyo-iyen-narrative.mjs');
const { validateNarrative } = await import(VALIDATOR);

const VALID_CAST = `# 무소속 인물

## 인물 카드

### 인물 조재표

- 성명: 조재표
- 캐릭터 ID: unaffiliated-jaepyo-jo
- 성격: 경로와 약속 이행을 먼저 보는 계산적 현장 지휘자다
- 개인 야망: 국가에 종속되지 않는 이동 호위망을 만든다
- 공포: 유명세가 일행을 표적으로 만드는 것
- 촉발 사건: 세 국가가 같은 통행로의 호위를 요구한다

### 인물 이연

- 성명: 이연
- 캐릭터 ID: iyen
- 성격: 빠르고 눈치가 좋고 따뜻한 수행자다
- 개인 야망: 정찰 판단이 독립 기록으로 인정되는 수행자가 된다
- 공포: 자기 판단이 조재표의 그림자로 지워지는 것
- 촉발 사건: 회랑 문을 닫으라 명령에 처음으로 공개 거부한다

## 공동 서사 — 조재표와 이연

- 왜 따르는가: 이연은 조재표의 귀환 가능한 경로 원칙을 직접 확인했다.
- 명령 구조: 이연이 조재표의 이동·호위 명령을 현장에서 전달·수행한다.
- 거부 경계: 민간인 희생과 귀환로 폐쇄 명령은 거부한다.
- 충성의 한계: 충성은 정체성 지움이 아니다. 이연의 이름으로 서명한다.
- 개막 촉발: 회랑 문 폐쇄 명령이 첫 공개 거부를 만든다.
- 플레이어 분기: 우회 구조를 돕거나 불복종 증거를 넘긴다.

무소속 등록은 [후속 이슈 #124](https://github.com/islee23520/seoul-kenshi/issues/124)에서 아틀라스 컬렉션으로 이어진다.
`;

const VALID_PRESET = `# 시작 프리셋

### ☀ 표준 — "떠돌이 삼인조"

- 세계 인물 후보: \`unaffiliated-jaepyo-jo\` (조재표 일행 지휘자), \`iyen\` (수행 전령). 무작위 배치 후보이며 등장 여부는 정해져 있지 않다.
`;

const VALID_LEDGER = `# 원장

| 항목 | 값 |
|---|---|
| 관계 | 이연 → 조재표 지휘 간선. 근거: https://github.com/islee23520/seoul-kenshi/issues/108 |
| 아틀라스 | 무소속 컬렉션 후속: https://github.com/islee23520/seoul-kenshi/issues/124 |
`;

async function fixtureDir({ cast = VALID_CAST, preset = VALID_PRESET, ledger = VALID_LEDGER } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'narrative-'));
  await mkdir(join(root, 'Wikis', 'game-logic'), { recursive: true });
  await mkdir(join(root, 'Research', 'canon-reference'), { recursive: true });
  await writeFile(join(root, 'Wikis', 'game-logic', 'Cast-Unaffiliated.md'), cast);
  await writeFile(join(root, 'Wikis', 'game-logic', 'Starting-Presets.md'), preset);
  await writeFile(join(root, 'Research', 'canon-reference', 'jaepyo-iyen-source-ledger.md'), ledger);
  return root;
}

function codes(errors) {
  return errors.map((e) => e.code).sort();
}

function withCode(errors, code) {
  return errors.filter((e) => e.code === code);
}

test('valid fixture passes with zero errors', async () => {
  const root = await fixtureDir();
  try {
    const result = await validateNarrative(root);
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('duplicate card prose fails with duplicate_character_prose per fingerprint field', async () => {
  const cast = VALID_CAST.replace(
    '- 성격: 빠르고 눈치가 좋고 따뜻한 수행자다',
    '- 성격: 경로와 약속 이행을 먼저 보는 계산적 현장 지휘자다',
  ).replace(
    '- 촉발 사건: 회랑 문을 닫으라 명령에 처음으로 공개 거부한다',
    '- 촉발 사건: 세 국가가 같은 통행로의 호위를 요구한다',
  );
  const root = await fixtureDir({ cast });
  try {
    const { errors } = await validateNarrative(root);
    const dup = withCode(errors, 'duplicate_character_prose');
    const fields = dup.map((e) => e.field).sort();
    assert.deepEqual(fields, ['성격', '촉발 사건']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missing joint section fails with joint_section_missing for every required element', async () => {
  const cast = VALID_CAST.split('\n## 공동 서사')[0] + '\n';
  const root = await fixtureDir({ cast });
  try {
    const { errors } = await validateNarrative(root);
    const missing = withCode(errors, 'joint_section_missing').map((e) => e.element).sort();
    assert.deepEqual(missing, [
      '개막_촉발', '명령_구조', '왜_따르는가', '우회_분기', '정체성_보존', '거부_경계',
    ].sort());
    assert.ok(withCode(errors, 'atlas_issue_link_missing').length === 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('duplicate joint section fails with joint_section_duplicate', async () => {
  const joint = '\n## 공동 서사 — 조재표와 이연\n\n중복 절이다.\n';
  const cast = VALID_CAST + joint;
  const root = await fixtureDir({ cast });
  try {
    const { errors } = await validateNarrative(root);
    assert.deepEqual(codes(withCode(errors, 'joint_section_duplicate')), ['joint_section_duplicate']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('joint heading at wrong level counts as missing (malformed heading)', async () => {
  const cast = VALID_CAST.replace('## 공동 서사 — 조재표와 이연', '### 공동 서사 — 조재표와 이연');
  const root = await fixtureDir({ cast });
  try {
    const { errors } = await validateNarrative(root);
    assert.ok(withCode(errors, 'joint_section_missing').length >= 1);
    assert.ok(withCode(errors, 'joint_section_duplicate').length === 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('stale atlas issue link fails with atlas_issue_link_missing', async () => {
  const cast = VALID_CAST.replace('issues/124', 'issues/999');
  const root = await fixtureDir({ cast });
  try {
    const { errors } = await validateNarrative(root);
    assert.deepEqual(codes(withCode(errors, 'atlas_issue_link_missing')), ['atlas_issue_link_missing']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('guaranteed preset member wording fails with guaranteed_preset_member', async () => {
  const preset = VALID_PRESET.replace(
    '무작위 배치 후보이며 등장 여부는 정해져 있지 않다.',
    '시작 인원에 항상 함께 등장한다.',
  );
  const root = await fixtureDir({ preset });
  try {
    const { errors } = await validateNarrative(root);
    assert.deepEqual(codes(withCode(errors, 'guaranteed_preset_member')), ['guaranteed_preset_member']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('preset missing an eligible candidate id fails with preset_candidate_missing', async () => {
  const preset = VALID_PRESET.replace(', `iyen` (수행 전령)', '');
  const root = await fixtureDir({ preset });
  try {
    const { errors } = await validateNarrative(root);
    assert.deepEqual(
      withCode(errors, 'preset_candidate_missing').map((e) => e.id),
      ['iyen'],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ledger missing #108 link or duplicating #124 url fails', async () => {
  const broken = VALID_LEDGER.replace('issues/108', 'issues/100');
  const root = await fixtureDir({ ledger: broken });
  try {
    const { errors } = await validateNarrative(root);
    assert.deepEqual(codes(withCode(errors, 'ledger_issue_link_missing')), ['ledger_issue_link_missing']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  const twice = VALID_LEDGER + '| 이중 | https://github.com/islee23520/seoul-kenshi/issues/124 |\n';
  const root2 = await fixtureDir({ ledger: twice });
  try {
    const { errors } = await validateNarrative(root2);
    assert.deepEqual(codes(withCode(errors, 'ledger_issue_link_duplicate')), ['ledger_issue_link_duplicate']);
  } finally {
    await rm(root2, { recursive: true, force: true });
  }
});

test('live repository files satisfy the narrative contract', async () => {
  const repoRoot = join(HERE, '..', '..', '..');
  const { errors } = await validateNarrative(repoRoot);
  assert.deepEqual(errors, []);
});

test('CLI prints RULE lines to stderr and exits non-zero on failure, silent zero on pass', async () => {
  const root = await fixtureDir({ cast: VALID_CAST.replace('- 공포: 유명세가 일행을 표적으로 만드는 것', '- 공포: 자기 판단이 조재표의 그림자로 지워지는 것') });
  try {
    const fail = spawnSync(process.execPath, [VALIDATOR, '--root', root], { encoding: 'utf8' });
    assert.notEqual(fail.status, 0);
    assert.equal(fail.stdout, '');
    assert.match(fail.stderr, /^RULE R21 duplicate_character_prose/m);
    const pass = spawnSync(process.execPath, [VALIDATOR, '--root', root], { encoding: 'utf8' });
    // deterministic: same input, same output
    assert.equal(fail.stderr, pass.stderr);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
