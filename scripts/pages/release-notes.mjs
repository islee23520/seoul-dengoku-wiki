#!/usr/bin/env node
// 릴리즈 버전·갱신 이력 생성기 — git 커밋과 태그만으로 semver 릴리즈 노트를 만든다(새 의존성 없음, 시계·네트워크 비의존).
//
// 버전 규칙: 정본은 git 태그 vX.Y.Z 다. 직전 태그(first-parent 체인에서 가장 가까운 vX.Y.Z)부터 대상 커밋까지의
//   first-parent 범위를 한 릴리즈로 본다. 범위 안의 모든 커밋(PR 병합이 묶은 브랜치 커밋 포함)의 conventional-commit 유형으로 올림을 정한다.
//     '!' 또는 본문 BREAKING CHANGE(S)/BREAKING 꼬리말 -> major, feat -> minor, 그 밖의 유형(유형 없음 포함) -> patch.
//   직전 태그가 없으면 첫 릴리즈이며 v1.0.0 이다(올림 계산 없음). 변경이 없는 범위는 릴리즈가 아니다.
// 묶음 규칙: first-parent 1개 = 항목 1개. 제목이 conventional 형식인 병합(PR 제목 + "(#N)", "Merge pull request #N"의 본문 첫 줄)은
//   그 PR 항목이고 브랜치 커밋이 그 아래에 묶인다. 형식이 없는 병합("Merge branch …")은 컨테이너라 항목이 아니며 브랜치 커밋이 최상위로 올라간다.
// 번역 없음: 커밋 제목은 한국어 원문 그대로다. 영어 줄은 고정 유형 라벨 + 원문 제목이다(기계 번역 아님).
//
// 사용법: node scripts/pages/release-notes.mjs <next|release|history|publish> [옵션]
//   next      대상 커밋의 다음 버전 한 줄 출력(변경 없음이면 'none')
//   release   대상 커밋에서 끝나는 릴리즈 하나: --format json(기본)|ko|en, --out <dir> 이면 release.json·notes.ko.md·notes.en.md 기록
//   history   모든 태그 릴리즈 + 대기 릴리즈 JSON(사이트 빌드가 같은 collectReleases 를 직접 호출)
//   publish   릴리즈 잡: 대상 커밋에 이미 태그가 있으면 아무것도 만들지 않고 exit 0. 아니면 gh release create 로 태그와 릴리즈를 만든다(--dry-run 은 계획만 출력).
// 옵션: --repo <dir>(기본 cwd) --to <ref>(기본 HEAD) --baseline <sha>(첫 릴리즈의 시작점) --repo-url <url> --remote <name>(기본 origin)
//       --notes-file <path>(publish 노트 파일) --dry-run
// 환경: RELEASE_GH_CMD='["gh"]' JSON 배열로 gh 실행기를 바꾼다(스크래치 검증용). GH_TOKEN 은 gh 가 읽는다.
// 종료 코드: 0 성공·건너뜀, 1 오류(태그 충돌·얕은 clone·git 실패), 2 사용법, 3 dirty 작업 트리에서 실제 publish 거부.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// 이 계획의 위키 PR 직전 main 커밋(#727 병합). 태그가 없을 때 첫 릴리즈 v1.0.0 이 이 커밋 다음부터다.
export const DEFAULT_BASELINE = 'e462d69044d76ca6b5bf6c85e973c98ec8f71179';
export const DEFAULT_REPO_URL = 'https://github.com/islee23520/seoul-dengoku-wiki';
const SEMVER_TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const CC = /^([A-Za-z]+)(?:\(([^)\r\n]*)\))?(!)?:\s+(.+)$/s;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGES?(?:\s*:|\s*\()/m;
const TYPE_ORDER = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert', 'other'];
const LABELS = {
  en: { group: { feat: 'Features', fix: 'Fixes', perf: 'Performance', refactor: 'Refactoring', docs: 'Documentation', test: 'Tests', build: 'Build', ci: 'CI', chore: 'Chores', style: 'Style', revert: 'Reverts', other: 'Other' },
    line: { feat: 'Feature', fix: 'Fix', perf: 'Performance', refactor: 'Refactor', docs: 'Docs', test: 'Test', build: 'Build', ci: 'CI', chore: 'Chore', style: 'Style', revert: 'Revert', other: 'Other' } },
  ko: { group: { feat: '기능', fix: '수정', perf: '성능', refactor: '구조 개선', docs: '문서', test: '테스트', build: '빌드', ci: 'CI', chore: '유지보수', style: '서식', revert: '되돌림', other: '기타' } },
};
LABELS.ko.line = LABELS.ko.group;
const TEXT = {
  en: { range: 'Range', commits: (n) => `${n} ${n === 1 ? 'commit' : 'commits'}`, release: 'GitHub release', breaking: 'BREAKING', empty: 'No changes.' },
  ko: { range: '범위', commits: (n) => `커밋 ${n}개`, release: 'GitHub 릴리즈', breaking: '호환성 깨짐', empty: '변경 없음.' },
};

class ReleaseError extends Error { constructor(code, message, exit = 1) { super(`${code}: ${message}`); this.exit = exit; } }

function git(repo, args, { allowFail = false } = {}) {
  const r = spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) throw new ReleaseError('E_GIT', `git 실행 실패: ${r.error.message}`);
  if (r.status !== 0 && !allowFail) throw new ReleaseError('E_GIT', `git ${args.join(' ')} -> exit ${r.status}: ${(r.stderr || '').trim()}`);
  return r.status === 0 ? r.stdout : null;
}

const FMT = '%H%x1f%P%x1f%ct%x1f%s%x1f%b%x1e';
function parseLog(out) {
  return out.split('\x1e').map((s) => s.replace(/^\n/, '')).filter(Boolean).map((rec) => {
    const [sha, parents, ct, subject, body] = rec.split('\x1f');
    return { sha, parents: parents ? parents.split(' ') : [], ts: Number(ct), subject, body: body ?? '' };
  });
}
const logRange = (repo, range, extra = []) => parseLog(git(repo, ['log', `--format=${FMT}`, ...extra, ...range]));

// 제목에서 {type, scope, subject, breaking, pr, conventional} 를 뽑는다. 알 수 없는 유형·형식 없는 제목은 type 'other'.
function classify(title, body) {
  let subject = title.trim();
  let pr = null;
  const m = subject.match(CC);
  let type = 'other', scope = null, bang = false, conventional = false;
  if (m && TYPE_ORDER.includes(m[1].toLowerCase()) && m[1].toLowerCase() !== 'other') {
    type = m[1].toLowerCase(); scope = m[2]?.trim() || null; bang = Boolean(m[3]); subject = m[4].trim(); conventional = true;
  }
  const pm = subject.match(/\s*\(#(\d+)\)\s*$/);
  if (pm) { pr = Number(pm[1]); subject = subject.slice(0, pm.index).trim(); }
  return { type, scope, subject, pr, breaking: bang || BREAKING_FOOTER.test(body), conventional };
}

function makeEntry(c, repoUrl, info = classify(c.subject, c.body)) {
  return {
    sha: c.sha, short: c.sha.slice(0, 8), type: info.type, scope: info.scope, subject: info.subject, breaking: info.breaking,
    pr: info.pr, url: `${repoUrl}/commit/${c.sha}`, prUrl: info.pr ? `${repoUrl}/pull/${info.pr}` : null,
  };
}

// 범위 first-parent 커밋 -> 최상위 항목(병합이면 브랜치 커밋을 children 으로).
function entriesOf(repo, range, repoUrl) {
  const top = [];
  for (const c of logRange(repo, range, ['--first-parent'])) {
    if (c.parents.length < 2) { top.push({ ...makeEntry(c, repoUrl), children: [] }); continue; }
    const gh = c.subject.match(/^Merge pull request #(\d+) from \S+/);
    const title = gh ? (c.body.split('\n').find((l) => l.trim()) ?? c.subject) : c.subject;
    const info = classify(title, c.body);
    if (gh) info.pr = Number(gh[1]);
    const kids = logRange(repo, [`${c.parents[0]}..${c.sha}`], ['--no-merges']).map((k) => makeEntry(k, repoUrl));
    if (info.conventional) top.push({ ...makeEntry(c, repoUrl, info), children: kids });
    else for (const k of kids) top.push({ ...k, pr: k.pr ?? info.pr, prUrl: (k.pr ?? info.pr) ? `${repoUrl}/pull/${k.pr ?? info.pr}` : null, children: [] });
  }
  return top;
}

function bumpOf(entries) {
  const all = entries.flatMap((e) => [e, ...e.children]);
  if (all.some((e) => e.breaking)) return 'major';
  if (all.some((e) => e.type === 'feat')) return 'minor';
  return 'patch';
}
const parseVer = (v) => v.match(SEMVER_TAG).slice(1).map(Number);
const cmpVer = (a, b) => { const x = parseVer(a), y = parseVer(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
function bumpVersion(prev, bump) {
  if (!prev) return 'v1.0.0';
  const [a, b, c] = parseVer(prev);
  return bump === 'major' ? `v${a + 1}.0.0` : bump === 'minor' ? `v${a}.${b + 1}.0` : `v${a}.${b}.${c + 1}`;
}
const isoDate = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);

function groupEntries(entries) {
  return TYPE_ORDER.map((type) => ({ type, label: { en: LABELS.en.group[type], ko: LABELS.ko.group[type] }, entries: entries.filter((e) => e.type === type) })).filter((g) => g.entries.length);
}

// 모든 릴리즈(오래된 순): 체인의 각 vX.Y.Z 태그 + 대상 커밋이 태그가 아니면 변경이 있는 대기 릴리즈 하나.
export function collectReleases({ repo = process.cwd(), to = 'HEAD', baseline = DEFAULT_BASELINE, repoUrl = DEFAULT_REPO_URL } = {}) {
  repoUrl = repoUrl.replace(/\/+$/, '');
  if (git(repo, ['rev-parse', '--is-shallow-repository']).trim() === 'true') throw new ReleaseError('E_SHALLOW', '얕은 clone 으로는 릴리즈 범위·태그를 알 수 없다. fetch-depth: 0 과 태그가 필요하다.');
  const head = git(repo, ['rev-parse', '--verify', `${to}^{commit}`], { allowFail: true })?.trim();
  if (!head) throw new ReleaseError('E_REF', `대상 ref 를 커밋으로 풀 수 없다: ${to}`);
  const chain = git(repo, ['rev-list', '--first-parent', head]).split('\n').filter(Boolean).reverse();
  const at = new Map(chain.map((s, i) => [s, i]));
  const warnings = [];

  const tagsBySha = new Map();
  for (const line of git(repo, ['for-each-ref', 'refs/tags', '--format=%(refname:strip=2)%09%(objecttype)%09%(objectname)%09%(*objecttype)%09%(*objectname)']).split('\n').filter(Boolean)) {
    const [name, t1, o1, t2, o2] = line.split('\t');
    if (!SEMVER_TAG.test(name)) continue;
    const sha = t1 === 'commit' ? o1 : t2 === 'commit' ? o2 : null;
    if (!sha) continue;
    if (!at.has(sha)) { warnings.push(`tag ${name} is not on the first-parent chain of ${head.slice(0, 8)}; ignored`); continue; }
    (tagsBySha.get(sha) ?? tagsBySha.set(sha, []).get(sha)).push(name);
  }
  const tagged = [...tagsBySha].map(([sha, names]) => {
    names.sort(cmpVer);
    if (names.length > 1) warnings.push(`commit ${sha.slice(0, 8)} has several version tags (${names.join(', ')}); ${names.at(-1)} is used`);
    return { sha, tag: names.at(-1) };
  }).sort((a, b) => at.get(a.sha) - at.get(b.sha));

  const baseSha = git(repo, ['rev-parse', '--verify', `${baseline}^{commit}`], { allowFail: true })?.trim();
  const baseUsed = baseSha && at.has(baseSha) ? baseSha : null;
  if (!baseUsed) warnings.push(`baseline ${String(baseline).slice(0, 8)} is not on the first-parent chain; the first release starts at the root commit`);

  const releases = [];
  const build = (fromSha, fromTag, toSha, toTag, version) => {
    const range = fromSha ? [`${fromSha}..${toSha}`] : [toSha];
    const entries = entriesOf(repo, range, repoUrl);
    if (!entries.length) return null;
    const head1 = logRange(repo, [toSha, '-1'])[0];
    const bump = bumpOf(entries);
    const toRef = toTag ?? toSha;
    const r = {
      version: version ?? bumpVersion(fromTag, bump), tagged: Boolean(toTag), date: isoDate(head1.ts), bump,
      from: fromSha ? { sha: fromSha, tag: fromTag } : null, to: { sha: toSha, tag: toTag },
      compareUrl: fromSha ? `${repoUrl}/compare/${fromTag ?? fromSha}...${toRef}` : `${repoUrl}/commits/${toRef}`,
      releaseUrl: toTag ? `${repoUrl}/releases/tag/${toTag}` : null,
      counts: { entries: entries.length, commits: entries.reduce((n, e) => n + 1 + e.children.length, 0) },
      groups: groupEntries(entries),
    };
    return r;
  };
  let prev = { sha: baseUsed, tag: null };
  for (const t of tagged) {
    const r = build(prev.sha, prev.tag, t.sha, t.tag, t.tag);
    if (r) releases.push(r);
    prev = t;
  }
  if (!tagsBySha.has(head)) {
    const r = build(prev.sha, prev.tag, head, null, null);
    if (r) releases.push(r);
  }
  return { head, repoUrl, baseline: baseUsed, warnings, releases };
}

const esc = (s) => String(s).split(/(`+[^`]*`+)/).map((seg, i) => (i % 2 ? seg : seg.replace(/\{\{/g, '&#123;&#123;').replace(/([\\[\]*_<>&|])/g, '\\$1'))).join('');
const links = (e) => `${[`[\`${e.short}\`](${e.url})`, e.pr ? `[#${e.pr}](${e.prUrl})` : null].filter(Boolean).join(', ')}`;
function lineOf(e, lang, spanKo) {
  const T = TEXT[lang];
  const subject = spanKo && lang === 'en' ? `<span lang="ko">${esc(e.subject)}</span>` : esc(e.subject);
  return `**${LABELS[lang].line[e.type]}**${e.scope ? ` · ${esc(e.scope)}` : ''} — ${subject}${e.breaking ? ` **${T.breaking}**` : ''} (${links(e)})`;
}
// 릴리즈 하나의 마크다운. titleLevel 은 제목 헤딩 수준(그룹은 +1). withTitle=false 면 제목 없이 그룹부터(GitHub 릴리즈 본문용).
// spanKo=true 면 영어 쪽 한국어 제목을 <span lang="ko"> 로 감싼다(사이트 전용; check-site 는 영어 페이지의 한글을 이 span 안에서만 허용한다).
// pendingLabel 이 있고 릴리즈에 아직 태그가 없으면 GitHub 릴리즈 링크 자리에 그 문구를 넣는다.
export function renderRelease(r, lang, { titleLevel = 2, withTitle = true, spanKo = false, pendingLabel = '' } = {}) {
  const T = TEXT[lang];
  const H = (n) => '#'.repeat(n);
  const out = [];
  if (withTitle) out.push(`${H(titleLevel)} ${r.version} · ${r.date} {#${r.version.replace(/\./g, '-')}}`, '');
  const range = r.from ? `[\`${(r.from.tag ?? r.from.sha).slice(0, 8)}...${(r.to.tag ?? r.to.sha.slice(0, 8))}\`](${r.compareUrl})` : `[\`${r.to.tag ?? r.to.sha.slice(0, 8)}\`](${r.compareUrl})`;
  out.push(`${T.range}: ${range} · ${T.commits(r.counts.commits)}${r.releaseUrl ? ` · [${T.release}](${r.releaseUrl})` : pendingLabel ? ` · ${pendingLabel}` : ''}`, '');
  for (const g of r.groups) {
    out.push(`${H(titleLevel + 1)} ${g.label[lang]}`, '');
    for (const e of g.entries) {
      out.push(`- ${lineOf(e, lang, spanKo)}`);
      for (const k of e.children) out.push(`  - ${lineOf(k, lang, spanKo)}`);
    }
    out.push('');
  }
  return out.join('\n');
}
// GitHub 릴리즈 본문: 한국어 다음 영어. 영어 쪽은 번역이 아니라 라벨 + 한국어 원문 제목이다.
export function renderNotes(r) {
  return [`## 한국어`, '', renderRelease(r, 'ko', { titleLevel: 2, withTitle: false }),
    `## English`, '', 'Commit subjects are the original Korean text (no machine translation); only the type labels are English.', '', renderRelease(r, 'en', { titleLevel: 2, withTitle: false })].join('\n');
}

// ---- CLI -------------------------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const a = { _: [] };
  const val = (i, n) => { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) throw new ReleaseError('E_ARG', `${n} 값이 없다`, 2); return v; };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--dry-run') a.dryRun = true;
    else if (['--repo', '--to', '--baseline', '--repo-url', '--remote', '--notes-file', '--format', '--out'].includes(t)) { a[t.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = val(i, t); i++; }
    else if (t.startsWith('--')) throw new ReleaseError('E_ARG', `알 수 없는 옵션: ${t}`, 2);
    else a._.push(t);
  }
  return a;
}

function runPublish(a, opt) {
  const repo = opt.repo;
  const remote = a.remote ?? 'origin';
  const hasRemote = git(repo, ['remote', 'get-url', remote], { allowFail: true }) !== null;
  // 로컬 태그가 오래됐을 수 있다(다른 실행이 먼저 릴리즈함). 버전을 계산하기 전에 원격 태그를 가져온다(강제 덮어쓰기 없음).
  if (hasRemote) {
    const f = spawnSync('git', ['fetch', '--tags', '--quiet', remote], { cwd: repo, encoding: 'utf8' });
    if (f.status !== 0) console.warn(`WARN: git fetch --tags ${remote} failed (${(f.stderr || '').trim()}); using local tags`);
  } else console.warn(`WARN: remote '${remote}' is not configured; remote tag check skipped`);
  const data = collectReleases(opt);
  const dirty = git(repo, ['status', '--porcelain', '--untracked-files=no']).trim() !== '';
  const here = [...new Set(git(repo, ['tag', '--points-at', data.head]).split('\n').filter((t) => SEMVER_TAG.test(t)))].sort(cmpVer);
  if (here.length) { console.log(`SKIP: ${data.head.slice(0, 8)} is already tagged ${here.join(', ')}; nothing created`); return 0; }
  // 더 새로운 릴리즈 태그가 이미 이 커밋을 포함하면(오래된 실행의 재시도·순서 뒤바뀜) 이 커밋은 이미 릴리즈된 것이다.
  const later = git(repo, ['tag', '--contains', data.head]).split('\n').filter((t) => SEMVER_TAG.test(t)).sort(cmpVer);
  if (later.length) { console.log(`SKIP: ${data.head.slice(0, 8)} is already contained in ${later.join(', ')}; nothing created`); return 0; }
  const r = data.releases.at(-1);
  if (!r || r.tagged || r.to.sha !== data.head) { console.log(`SKIP: no changes to release at ${data.head.slice(0, 8)}; nothing created`); return 0; }
  if (hasRemote) {
    // fetch 이후에도 원격에만 있는 태그(fetch 실패·경쟁)를 한 번 더 본다: HEAD 를 가리키는 버전 태그가 있으면 건너뛰고, 새 버전 이름이 다른 커밋에 이미 있으면 중단한다.
    const remoteTags = new Map();
    for (const l of git(repo, ['ls-remote', '--tags', remote]).split('\n').filter(Boolean)) {
      const [sha, ref] = l.split('\t');
      const name = ref.replace(/^refs\/tags\//, '').replace(/\^\{\}$/, '');
      if (!SEMVER_TAG.test(name)) continue;
      if (ref.endsWith('^{}') || !remoteTags.has(name)) remoteTags.set(name, sha);
    }
    const atHead = [...remoteTags].filter(([, sha]) => sha === data.head).map(([n]) => n);
    if (atHead.length) { console.log(`SKIP: ${remote} already has ${atHead.join(', ')} at ${data.head.slice(0, 8)}; nothing created`); return 0; }
    if (remoteTags.has(r.version)) throw new ReleaseError('E_TAG_CONFLICT', `${r.version} 태그가 ${remote} 에 이미 있고 다른 커밋(${remoteTags.get(r.version).slice(0, 8)})을 가리킨다. 로컬 태그가 오래됐다 — git fetch --tags 후 다시 계산한다.`);
  }
  // dry-run 은 파일도 만들지 않는다(--notes-file 을 직접 준 경우만 기록).
  const notesFile = a.notesFile ? path.resolve(a.notesFile) : a.dryRun ? '<notes-file>' : path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-')), 'notes.md');
  if (!a.dryRun || a.notesFile) fs.writeFileSync(notesFile, renderNotes(r));
  const ghCmd = JSON.parse(process.env.RELEASE_GH_CMD ?? '["gh"]');
  const ghArgs = [...ghCmd.slice(1), 'release', 'create', r.version, '--target', data.head, '--title', r.version, '--notes-file', notesFile, '--latest', ...(process.env.GITHUB_REPOSITORY ? ['--repo', process.env.GITHUB_REPOSITORY] : [])];
  if (a.dryRun) {
    console.log(`DRY-RUN: would create ${r.version} (${r.bump}) at ${data.head} - no tag, no release created`);
    console.log(`DRY-RUN: ${[ghCmd[0], ...ghArgs].join(' ')}`);
    if (dirty) console.warn('WARN: working tree has tracked changes; releases are computed from commits only');
    return 0;
  }
  if (dirty) throw new ReleaseError('E_DIRTY', '작업 트리에 추적 파일 변경이 있다. 커밋하지 않은 상태로 릴리즈를 만들지 않는다.', 3);
  const res = spawnSync(ghCmd[0], ghArgs, { cwd: repo, stdio: 'inherit' });
  if (res.error || res.status !== 0) throw new ReleaseError('E_GH', `gh release create 실패 (exit ${res.status ?? res.error?.message})`);
  console.log(`CREATED: ${r.version} at ${data.head}`);
  return 0;
}

function main(argv) {
  const a = parseArgs(argv);
  const cmd = a._[0];
  if (!['next', 'release', 'history', 'publish'].includes(cmd)) throw new ReleaseError('E_ARG', '명령: next | release | history | publish (머리말 주석 참고)', 2);
  const opt = { repo: path.resolve(a.repo ?? process.cwd()), to: a.to ?? 'HEAD', baseline: a.baseline ?? DEFAULT_BASELINE, repoUrl: a.repoUrl ?? DEFAULT_REPO_URL };
  if (cmd === 'publish') return runPublish(a, opt);
  const data = collectReleases(opt);
  if (cmd === 'history') { console.log(JSON.stringify(data, null, 1)); return 0; }
  const r = data.releases.at(-1);
  const ends = r && r.to.sha === data.head ? r : null;
  if (cmd === 'next') { console.log(ends && !ends.tagged ? ends.version : ends ? `${ends.version} (already tagged)` : 'none'); return 0; }
  if (!ends) { console.log(JSON.stringify({ version: null, empty: true, head: data.head, warnings: data.warnings }, null, 1)); return 0; }
  const json = JSON.stringify({ ...ends, head: data.head, warnings: data.warnings }, null, 1);
  if (a.out) {
    fs.mkdirSync(a.out, { recursive: true });
    fs.writeFileSync(path.join(a.out, 'release.json'), `${json}\n`);
    fs.writeFileSync(path.join(a.out, 'notes.ko.md'), `${renderRelease(ends, 'ko')}\n`);
    fs.writeFileSync(path.join(a.out, 'notes.en.md'), `${renderRelease(ends, 'en')}\n`);
    console.log(`wrote ${ends.version} -> ${a.out}`);
  } else console.log((a.format ?? 'json') === 'json' ? json : renderRelease(ends, a.format));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) {
    if (e instanceof ReleaseError) { console.error(e.message); process.exitCode = e.exit; } else throw e;
  }
}
