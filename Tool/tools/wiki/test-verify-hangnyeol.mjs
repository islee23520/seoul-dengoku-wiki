import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const verifier = fileURLToPath(new URL('./verify-hangnyeol.mjs', import.meta.url));
const POOL = join('Wikis', 'game-logic', 'name-pools');
const RAW = join('Research', 'verification', 'hangnyeol', 'raw');
const EVIDENCE_REL = join(RAW, 'test-lane.md');
const VERIFY_REL = join(RAW, '_verify-test.md');
const fixtures = [];

after(async () => {
  for (const dir of fixtures) {
    await rm(dir, { recursive: true, force: true });
    console.log(`cleaned ${dir}`);
  }
});

const QUOTE_SURNAME = '김씨는 2015년 기준 1,069만 명이다';
const QUOTE_CLAN = '71세 재(在), 72세 도(道), 73세 율(律)';
const QUOTE_SYSTEM = '오행상생은 목화토금수 차례로 돈다';

function source(id, quote) {
  return {
    id,
    record_id: id.replace(/^s-/, 'rec-'),
    url: `https://example.org/${id}`,
    accessed: '2026-09-16',
    quote,
    evidence: EVIDENCE_REL,
    live_check: 'verbatim_ok',
    live_check_ref: VERIFY_REL,
  };
}

// 기본 데이터는 계약을 전부 만족한다. 각 테스트는 여기서 한 군데만 망가뜨린다.
function baseDocs() {
  return {
    evidence: [
      '# 시험용 원자료',
      '',
      `- quote: ${QUOTE_SURNAME}`,
      `- quote: ${QUOTE_CLAN}`,
      `- quote: ${QUOTE_SYSTEM}`,
      '',
    ].join('\n'),
    verifyReport: [
      '# 시험용 라이브 재대조 보고',
      '',
      '| record id | lane | url | result | actual text if MISMATCH |',
      '| --- | --- | --- | --- | --- |',
      '| rec-kim | test-lane | https://example.org/s-kim | VERBATIM_OK |  |',
      '| rec-ohaeng | test-lane | https://example.org/s-ohaeng | VERBATIM_OK |  |',
      '| rec-clan | test-lane | https://example.org/s-clan | VERBATIM_OK |  |',
      '| rec-artifact | test-lane | https://example.org/s-artifact | MISMATCH | 실제 본문은 공백만 다르다 |',
      '',
      'TOTALS checked=4 verbatim_ok=3 mismatch=1 url_dead=0',
      '',
    ].join('\n'),
    legacy: { id: 'surnames', surnames: ['김'] },
    surnames: {
      id: 'surnames-bongwan',
      schema: 1,
      note: '시험용',
      sources: [source('s-kim', QUOTE_SURNAME)],
      surnames: [
        {
          id: 'kim',
          hangul: '김',
          hanja: '金',
          population_2015: 10689959,
          sources: ['s-kim'],
          bongwan: [{ id: 'kim-gimhae', name: '김해', hanja: '金海', sources: ['s-kim'] }],
        },
      ],
    },
    systems: {
      id: 'hangnyeol-systems',
      schema: 1,
      note: '시험용',
      sources: [source('s-ohaeng', QUOTE_SYSTEM)],
      systems: [
        { id: 'ohaeng', name: '오행상생법', summary: '목화토금수 차례', sequence: ['木', '火', '土', '金', '水'], sources: ['s-ohaeng'] },
      ],
    },
    clans: {
      id: 'clan-hangnyeol-tables',
      schema: 1,
      note: '시험용',
      sources: [source('s-clan', QUOTE_CLAN)],
      clans: [
        {
          id: 'gimhae-kim',
          surname: '김',
          bongwan: '김해',
          provenance: 'verified',
          sources: ['s-clan'],
          rows: [
            { sesu: 71, hangnyeol: '재', hanja: '在', position: 'first' },
            { sesu: 72, hangnyeol: '도', hanja: '道', position: 'first' },
            { sesu: 73, hangnyeol: '율', hanja: '律', position: 'first' },
          ],
        },
      ],
    },
    cast: {
      id: 'cast-hangnyeol',
      schema: 1,
      note: '시험용',
      sources: [],
      lineage: {
        parents: { '김도윤': '김부' },
        founder_sesu: { '김부': 71 },
        person_clan: { '김도윤': 'gimhae-kim' },
      },
      people: [
        { name: '김도윤', surname: '김', status: 'applied', clan: 'gimhae-kim', sesu: 72, hangnyeol: '도', position: 'first', reason: '김해 김씨 72세' },
        { name: '백온', surname: '백', status: 'unused', reason: '한 글자 이름이라 항렬자를 넣을 자리가 없다' },
        { name: '문가람', surname: '문', status: 'unconfirmed', reason: '본관 확인 자료 없음' },
      ],
    },
  };
}

async function makeFixture(mutate = () => {}) {
  const dir = await mkdtemp(join(tmpdir(), 'verify-hangnyeol-'));
  fixtures.push(dir);
  const docs = baseDocs();
  mutate(docs);

  await mkdir(join(dir, POOL), { recursive: true });
  await mkdir(join(dir, RAW), { recursive: true });

  if (docs.evidence !== null) await writeFile(join(dir, EVIDENCE_REL), docs.evidence);
  if (docs.verifyReport !== null) await writeFile(join(dir, VERIFY_REL), docs.verifyReport);

  const files = {
    'surnames-bongwan.json': docs.surnames,
    'hangnyeol-systems.json': docs.systems,
    'clan-hangnyeol-tables.json': docs.clans,
    'cast-hangnyeol.json': docs.cast,
    'surnames.json': docs.legacy,
  };
  for (const [name, value] of Object.entries(files)) {
    if (value === null) continue;
    const body = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    await writeFile(join(dir, POOL, name), body);
  }
  return dir;
}

function run(root, extraArgs = []) {
  const result = spawnSync(process.execPath, [verifier, '--root', root, ...extraArgs], { encoding: 'utf8' });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

test('happy path: complete dataset exits 0 with sourced=100%', async () => {
  const root = await makeFixture();
  const result = run(root);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /^H\d+:/m);
  assert.match(result.stdout, /surnames=1 bongwan=1 clans=1/);
  assert.match(result.stdout, /sourced=100%/);
});

test('happy path: --cast exits 0 and counts applied people', async () => {
  const root = await makeFixture();
  const result = run(root, ['--cast']);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /^H\d+:/m);
  assert.match(result.stdout, /cast=3 applied=1/);
});

test('H1: an absent data file fails the gate', async () => {
  const root = await makeFixture((docs) => { docs.clans = null; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H1:/m);
  assert.match(result.stderr, /clan-hangnyeol-tables\.json/);
});

test('H1: --cast requires cast-hangnyeol.json', async () => {
  const root = await makeFixture((docs) => { docs.cast = null; });
  assert.equal(run(root).code, 0);
  const withCast = run(root, ['--cast']);
  assert.equal(withCast.code, 1);
  assert.match(withCast.stderr, /^H1:.*cast-hangnyeol\.json/m);
});

test('H2: malformed JSON is a readable failure, not a crash', async () => {
  const root = await makeFixture((docs) => { docs.clans = '{ not json'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H2:/m);
  assert.doesNotMatch(result.stderr, /TypeError|Cannot read/);
});

test('H20: an empty bongwan list without a stated reason fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.surnames[0].bongwan = []; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H20:.*bongwan_unlisted_reason/m);
});

test('H20: an empty bongwan list passes when the absence is declared', async () => {
  const root = await makeFixture((docs) => {
    docs.surnames.surnames[0].bongwan = [];
    docs.surnames.surnames[0].bongwan_unlisted_reason = '2015 집계표의 대성 본관 칸이 비어 있다';
  });
  const result = run(root);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /^H\d+:/m);
  assert.match(result.stdout, /bongwan=0/);
});

test('H20: declaring bongwan absent on a row that carries bongwan fails', async () => {
  const root = await makeFixture((docs) => {
    docs.surnames.surnames[0].bongwan_unlisted_reason = '없음';
  });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H20:.*but carries bongwan/m);
});

test('H5: a row referencing an unknown source id fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.surnames[0].sources = ['s-missing']; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H5:.*s-missing/m);
});

test('H6: a source missing its accessed date fails', async () => {
  const root = await makeFixture((docs) => { delete docs.surnames.sources[0].accessed; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H6:.*missing accessed/m);
});

test('H6: a non-http url fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].url = '족보에서 봄'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H6:.*url is not http/m);
});

test('H7: evidence pointing outside the ledger fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].evidence = 'Wikis/game-logic/somewhere.md'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H7:.*must live under/m);
});

test('H7: a missing evidence file fails', async () => {
  const root = await makeFixture((docs) => { docs.evidence = null; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H7:.*evidence file missing/m);
});

test('H8: a quote absent from the evidence ledger fails — 이것이 조작 차단선이다', async () => {
  const root = await makeFixture((docs) => {
    docs.surnames.sources[0].quote = '김씨는 2015년 기준 3,000만 명이다';
  });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H8:.*quote not found verbatim/m);
});

test('H9: a verified row with no sources fails', async () => {
  const root = await makeFixture((docs) => { docs.clans.clans[0].sources = []; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H9:.*has no sources/m);
});

test('H10: a creative clan carrying sources fails', async () => {
  const root = await makeFixture((docs) => {
    const clan = docs.clans.clans[0];
    clan.provenance = 'creative';
    clan.creative_rationale = '세계관 가계';
    clan.method_ref = 'ohaeng';
    // sources 는 그대로 둔다 — 창작 표에 실존 출처를 붙이는 위조 시도.
  });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H10:.*creative but carries sources/m);
});

test('H10: a creative clan without creative_rationale or method_ref fails', async () => {
  const root = await makeFixture((docs) => {
    const clan = docs.clans.clans[0];
    clan.provenance = 'creative';
    delete clan.sources;
  });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H10:.*missing creative_rationale/m);
  assert.match(result.stderr, /^H10:.*missing method_ref/m);
});

test('H10: a creative clan passes when it declares rationale and method', async () => {
  const root = await makeFixture((docs) => {
    const clan = docs.clans.clans[0];
    clan.provenance = 'creative';
    delete clan.sources;
    clan.creative_rationale = '실존 문중 항렬표를 베끼지 않는 세계관 가계';
    clan.method_ref = 'ohaeng';
  });
  const result = run(root);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /verified=0 creative=1/);
});

test('H11: mixing a creative row into a verified table fails', async () => {
  const root = await makeFixture((docs) => { docs.clans.clans[0].rows[1].provenance = 'creative'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H11:/m);
});

test('H12: duplicate sesu inside one clan table fails', async () => {
  const root = await makeFixture((docs) => { docs.clans.clans[0].rows[2].sesu = 72; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H12:.*duplicate sesu 72/m);
});

test('H21: a clan without a sourced hangnyeol table must state why rows are empty', async () => {
  const root = await makeFixture((docs) => { docs.clans.clans[0].rows = []; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H21:.*hangnyeol_unconfirmed_reason/m);
});

test('H21: a verified clan identity may keep rows empty when the table remains unconfirmed', async () => {
  const root = await makeFixture((docs) => {
    docs.clans.clans[0].rows = [];
    docs.clans.clans[0].hangnyeol_unconfirmed_reason = '문중 항렬표 원문에서 세수·항렬자·자리를 함께 확인하지 못했다';
  });
  const result = run(root);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /^H\d+:/m);
});

test('H13: an applied person whose clan id does not resolve fails', async () => {
  const root = await makeFixture((docs) => { docs.cast.people[0].clan = 'nowhere-kim'; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H5:.*unknown clan id nowhere-kim/m);
});

test('H13: an applied person missing a reason fails', async () => {
  const root = await makeFixture((docs) => { delete docs.cast.people[0].reason; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H13:.*missing reason/m);
});

test('H13: unused must not carry a hangnyeol', async () => {
  const root = await makeFixture((docs) => { docs.cast.people[1].hangnyeol = '온'; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H13:.*must not carry hangnyeol/m);
});

test('H13: a hangnyeol absent from the clan table at that sesu fails', async () => {
  const root = await makeFixture((docs) => { docs.cast.people[0].sesu = 71; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H13:.*does not match clan table/m);
});

test('H14: two people at one sesu using different hangnyeol fails', async () => {
  const root = await makeFixture((docs) => {
    docs.cast.people.push({
      name: '김재율', surname: '김', status: 'applied', clan: 'gimhae-kim',
      sesu: 72, hangnyeol: '재', position: 'first', reason: '시험용 형제',
    });
  });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H14:.*sesu 72 uses 2 different hangnyeol/m);
});

test('H14: siblings sharing one sesu and one hangnyeol pass', async () => {
  const root = await makeFixture((docs) => {
    docs.cast.lineage.parents['김도원'] = '김부';
    docs.cast.lineage.person_clan['김도원'] = 'gimhae-kim';
    docs.cast.people.push({
      name: '김도원', surname: '김', status: 'applied', clan: 'gimhae-kim',
      sesu: 72, hangnyeol: '도', position: 'first', reason: '같은 세수 형제',
    });
  });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /applied=2/);
});

test('H15: a hangnyeol that is not at the declared syllable fails — 이름에 없는 글자를 적용했다고 적을 수 없다', async () => {
  const root = await makeFixture((docs) => { docs.cast.people[0].position = 'second'; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H15:.*is not at second syllable/m);
});

test('H16: a surname in surnames.json absent from the dataset fails', async () => {
  const root = await makeFixture((docs) => { docs.legacy.surnames = ['김', '이']; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H16:.*이.*absent/m);
});

test('H17: one hangnyeol reused across two generations fails — 나이는 세수의 근거가 아니다', async () => {
  const root = await makeFixture((docs) => {
    docs.clans.clans[0].rows[2].hangnyeol = '도';
    docs.cast.people.push({
      name: '김도현', surname: '김', status: 'applied', clan: 'gimhae-kim',
      sesu: 73, hangnyeol: '도', position: 'first', reason: '다음 세대인데 같은 글자',
    });
  });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H17:.*shared by sesu/m);
});

test('H22: applied sesu must be derived from a parent edge', async () => {
  const root = await makeFixture((docs) => { docs.cast.people[0].sesu = 71; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H22:.*derived sesu 72/m);
});

test('H22: applied person without a founder path fails', async () => {
  const root = await makeFixture((docs) => { docs.cast.lineage.parents = {}; });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H22:.*no parent-to-founder path/m);
});

test('H23: applied person lineage clan must match the applied clan', async () => {
  const root = await makeFixture((docs) => {
    docs.cast.lineage.person_clan['김도윤'] = 'other-clan';
  });
  const result = run(root, ['--cast']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H23:.*lineage clan other-clan/m);
});

// ---- H18 / H19: 라이브 재대조 판정 ----
// 원장 인용 대조(H8)는 우리가 쓴 파일끼리의 자기 일관성만 증명한다.
// 워커가 날조한 인용을 자기 레인 파일에 적으면 H8은 통과한다.
// H18·H19는 독립 재대조 보고의 판정을 데이터 행에 묶어 그 구멍을 막는다.

test('H18: a source without live_check fails — 라이브 재대조 판정 없는 인용은 받지 않는다', async () => {
  const root = await makeFixture((docs) => { delete docs.surnames.sources[0].live_check; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H18:.*missing live_check/m);
});

test('H18: an unknown live_check value fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].live_check = 'probably-fine'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H18:.*live_check must be/m);
});

test('H19: verbatim_ok whose record id is absent from the re-fetch report fails — 이것이 자기보고 차단선이다', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].record_id = 'rec-never-checked'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H19:.*rec-never-checked/m);
});

test('H19: verbatim_ok pointing at a missing re-fetch report fails', async () => {
  const root = await makeFixture((docs) => { docs.verifyReport = null; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H19:.*re-fetch report/m);
});

test('H19: claiming verbatim_ok when the report says MISMATCH fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].record_id = 'rec-artifact'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H19:.*VERBATIM_OK/m);
});

test('H19: artifact_corrected passes against a MISMATCH row', async () => {
  const root = await makeFixture((docs) => {
    const s = docs.surnames.sources[0];
    s.record_id = 'rec-artifact';
    s.live_check = 'artifact_corrected';
  });
  const result = run(root);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /^H\d+:/m);
});

test('H19: artifact_corrected against a VERBATIM_OK row fails', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].live_check = 'artifact_corrected'; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H19:.*MISMATCH/m);
});

test('H19: unchecked is allowed, needs no report, and lowers live_verified', async () => {
  const root = await makeFixture((docs) => {
    const s = docs.surnames.sources[0];
    s.live_check = 'unchecked';
    delete s.live_check_ref;
    delete s.record_id;
  });
  const result = run(root);
  assert.equal(result.code, 0);
  assert.doesNotMatch(result.stderr, /^H\d+:/m);
  assert.match(result.stdout, /live_verified=/);
  assert.doesNotMatch(result.stdout, /live_verified=100%/);
});

test('happy path prints live_verified=100% when every source was re-fetched', async () => {
  const root = await makeFixture();
  const result = run(root);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /live_verified=100%/);
});

test('violations go to stderr and the summary goes to stdout', async () => {
  const root = await makeFixture((docs) => { docs.surnames.surnames[0].sources = []; });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^H9:/m);
  assert.doesNotMatch(result.stdout, /^H9:/m);
  assert.match(result.stdout, /sourced=/);
});

test('stale state: two runs over one fixture produce identical output', async () => {
  const root = await makeFixture((docs) => { docs.surnames.sources[0].quote = '없는 인용'; });
  const first = run(root);
  const second = run(root);
  assert.equal(first.code, 1);
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.stderr, second.stderr);
});
