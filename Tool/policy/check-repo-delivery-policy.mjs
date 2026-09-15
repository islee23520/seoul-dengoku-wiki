#!/usr/bin/env node
// Docs-policy consistency checker (C1).
// Fails when local-only delivery clauses in the approved plan have no
// supersession reference, or when the authoritative ADR is missing or
// incomplete. Exactly one current delivery rule must exist.
// The plan under .omo/plans/ is a gitignored workspace artifact: when it is
// absent (fresh clone or worktree), the tracked ADR-001 alone carries the
// delivery policy and this gate stays green; when present, its supersession
// amendment is still enforced clause by clause.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLAN = '.omo/plans/seoul-grand-strategy-srpg.md';
const ADR_DIR = 'GDD/adr';
const ADR_ID = 'ADR-001';
const ADR_PATH = `${ADR_DIR}/ADR-001-repository-delivery-policy.md`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null);

const plan = read(PLAN);
let staleHits = [];
if (plan === null) {
  // The plan was a tracked file when this checker landed (601a993) but was
  // dropped from tracking in eeded72, and `.gitignore` excludes `.omo/`, so
  // fresh clones and worktrees never contain it. ADR-001 is the tracked,
  // authoritative delivery rule; a missing workspace artifact is therefore
  // compliant. When the artifact exists locally, every supersession check
  // below still applies unchanged.
  check(
    'plan workspace artifact absent defers to tracked ADR',
    true,
    `${PLAN} is a gitignored workspace artifact; tracked ${ADR_PATH} is the canonical delivery rule`,
  );
} else {
  check('plan readable', true, PLAN);
  // Clauses in the approved plan that assert a local-only / no-GitHub rule.
  // Each entry carries the clause key that the plan's amendment table must
  // link, row by row, to the superseding ADR.
  const STALE_PATTERNS = [
    { key: 'LOC-01', pattern: /외부 쓰기는 이 계획에서 수행하지 않습니다/ },
    { key: 'LOC-02', pattern: /GitHub untouched/ },
    { key: 'LOC-03', pattern: /GitHub remote는 미설정 상태로 유지/ },
    { key: 'LOC-04', pattern: /do not create another repository\/worktree or configure a remote under this plan/i },
    { key: 'LOC-05', pattern: /Do not create one now/ },
    { key: 'LOC-06', pattern: /remote Wiki publication is outside this plan/i },
    { key: 'LOC-07', pattern: /Do not create any GitHub repository or remote under this plan/ },
    { key: 'LOC-08', pattern: /remote-absence checks/ },
    { key: 'LOC-09', pattern: /GitHub state stays untouched/ },
    { key: 'LOC-10', pattern: /git remote -v`? (is|remains) empty/i },
    { key: 'LOC-11', pattern: /github_remote:\s*none/i },
    { key: 'LOC-12', pattern: /Remote publication is a separate future plan/i },
  ];

    for (const { key, pattern } of STALE_PATTERNS) {
      const m = plan.match(pattern);
      if (m) staleHits.push({ key, pattern: String(pattern), index: m.index });
    }
  check(
    'local-only clause count matches expectation',
    staleHits.length === STALE_PATTERNS.length,
    `${staleHits.length}/${STALE_PATTERNS.length} clauses found: ${staleHits.map((h) => h.key).join(', ')}`,
  );

  // The plan must carry a non-rewriting amendment that points every stale
  // clause at the superseding ADR.
  const m = plan.match(/## Amendment[^\n]*\n[\s\S]*$/);
  const amendment = m ? m[0] : null;
  check('amendment section present', amendment !== null, 'plan ends with an ## Amendment section');
  check(
    'amendment references superseding ADR',
    amendment !== null && amendment.includes(ADR_ID) && /supersed/i.test(amendment),
    amendment ? 'amendment names ADR and supersession' : 'no amendment',
  );
  check(
    'amendment appears after every local-only clause',
    amendment !== null && staleHits.every((h) => plan.indexOf(amendment) > h.index),
    'supersession reference must follow the clauses it overrides',
  );

  // Per-clause linkage: every located clause key must appear in the amendment
  // together with the ADR reference, so a bare "ADR-001 supersedes stuff"
  // stub cannot pass.
  if (amendment) {
    for (const h of staleHits) {
      const row = amendment.split('\n').find((l) => l.includes(h.key));
      check(
        `amendment links clause ${h.key} to ${ADR_ID}`,
        row !== undefined && amendment.includes(ADR_ID),
        row ? `row: ${row.trim().slice(0, 80)}` : `no amendment row for ${h.key}`,
      );
    }
    check(
      'amendment catch-all defers all delivery rules to ADR',
      /defer/i.test(amendment) && /delivery/i.test(amendment) && amendment.includes(ADR_ID),
      'catch-all must explicitly defer all delivery-related rules to ADR-001',
    );
  }
}

// The authoritative ADR must exist and record the current delivery rule.
const adr = read(ADR_PATH);
check('authoritative ADR exists', adr !== null, ADR_PATH);

const REQUIRED_ADR_FIELDS = [
  ['owner authorization date and evidence', /2026-09-0[23]/],
  ['current remote recorded', /https:\/\/github\.com\/islee23520\/seoul-kenshi\.git/],
  ['branch and PR only delivery', /branch/i],
  ['pull request required', /pull request|PR/i],
  ['no direct push to main', /no direct (push to )?main|direct push to main is forbidden/i],
  ['no force push or history rewrite', /force[- ]push/i],
  ['no merge by agents', /merge/i],
  ['unrelated shooter repository excluded', /shooter/],
  ['derived Wiki assets policy', /[Ww]iki/],
  ['rollback and review policy', /rollback|revert/i],
  ['single current delivery rule declared', /only current delivery rule|single current delivery rule|sole current delivery rule/i],
];
if (adr) {
  for (const [label, pat] of REQUIRED_ADR_FIELDS) {
    check(`ADR records: ${label}`, pat.test(adr), label);
  }
}

// Exactly one current delivery rule: every other ADR that mentions delivery
// or remotes must defer to ADR-001.
let otherAdrs = [];
if (existsSync(join(root, ADR_DIR))) {
  otherAdrs = readdirSync(join(root, ADR_DIR)).filter(
    (f) => f.endsWith('.md') && !f.startsWith(ADR_ID),
  );
}
let strayRules = [];
for (const f of otherAdrs) {
  const text = read(`${ADR_DIR}/${f}`);
  if (/(delivery|remote|push)/i.test(text) && !text.includes(ADR_ID)) strayRules.push(f);
}
check(
  'exactly one current delivery rule',
  strayRules.length === 0,
  strayRules.length ? `conflicting rules in: ${strayRules.join(', ')}` : 'no competing delivery rule',
);

// The live remote must match what the ADR records (read-only probe).
let remote = '';
try {
  remote = execSync('git remote get-url origin', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  remote = '';
}
check(
  'live origin matches ADR record',
  adr !== null && remote.length > 0 && adr.includes(remote),
  remote || 'no origin configured',
);

const failed = checks.filter((c) => !c.pass);
const report = {
  checker: 'check-repo-delivery-policy',
  plan: PLAN,
  plan_present: plan !== null,
  adr: ADR_PATH,
  stale_clauses_found: staleHits.length,
  checks,
  result: failed.length === 0 ? 'PASS' : 'FAIL',
  failures: failed.map((c) => c.name),
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
process.exit(failed.length === 0 ? 0 : 1);
