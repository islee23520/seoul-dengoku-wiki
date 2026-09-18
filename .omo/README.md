# Shared context and local execution state

This directory name is not an exclusion rule. Policies, rules, contracts,
decisions, stable plans, design sources and research belong in Git so another
checkout can recover the reasons behind the work. Session state does not.

## Authority and reading order

1. [ADR-001](../GDD/adr/ADR-001-repository-delivery-policy.md) is the single delivery
   authority: dedicated branch and PR, owner-only merge, no direct main push,
   no history rewrite. GitHub Wiki is retired; public docs are `https://seoul-kenshi.vercel.app`.
2. [Historical foundation plan](plans/seoul-grand-strategy-srpg.md) restores the
   exact blob `71160195c0b73812074dca5b239e2549fa49e93b` removed in `eeded72`.
   Its appended 2026-09-03 amendment supersedes the old local-only clauses.
   Old machine paths, unchecked tasks and historical command examples are
   provenance, not portable run commands or current completion claims. Use
   root AGENTS.md, Intent.md and ToDo.md for current execution.
3. [POC design decisions](decisions/poc-design-context.md) separates current
   design intent, the smaller P0 target and unshipped work.
4. [Design synthesis](design/game-logic-synthesis.html),
   [v4 overlay mockup](design/ui-mockup-v4.html),
   [full-loop concept](design/poc-complete.html) and
   [historical design report](design/design-report.html) are source context,
   not a playable build or release evidence. Open the HTML locally; nothing
   is published to GitHub Wiki by this sync.
5. [Historical rubric summary](evidence/summaries/poc-rubric-20260906.md)
   explains why the design changed. It does not re-certify the old run.
6. [Citation metadata and CK3 secondary research](research/README.md) retain the
   reference corpus source IDs and their limits.
7. Existing [reference research](research-private/reference-games.md) and
   [narrative bridge](research-private/nippon-sangoku-canon-bridge.md) remain
   private repository context. The encyclopedia lives in
   [RESEARCH/canon-reference](../RESEARCH/canon-reference/MASTER-PLAN.md).

## Normally trackable categories

`.gitignore` allows entire `policies/`, `rules/`, `contracts/`, `decisions/`,
`plans/`, `design/`, `research/` and `research-private/` directories, including
future nested documents. No `git add -f` is needed. Durable interpretive
verification summaries and receipts belong in `evidence/summaries/` and
`evidence/receipts/`. Review individual paths before staging: trackable does
not mean approved or automatically staged. Keep public-facing policy in
`docs/adr/`; shared context must defer to it, not create a competing policy.

Session/task state, boulder/ledgers, ownership locks, browser profiles,
credentials/cookies/environment files, raw logs/XML, screenshots/video,
archives, temporary and partial outputs remain ignored. A durable policy
found inside a local evidence tree should be curated into a shared category,
not hidden forever because its old parent was called evidence.

The actively maintained `plans/poc-ugui-v4-runtime.md`, local drafts, setup
ledgers and other agents' source work are not copied by this delivery. That
plan is normally trackable under the category rule; its owner must stage its
stable revision separately. Stable HTML copies were checked against the
pre-existing immutable reference hashes before import. Only the isolated
copies receive portable-link corrections; the active worktree is untouched.

## Reproduction and maintenance

Run `npm ci --prefix tools`, the documented wiki gates, and
`node tools/policy/check-repo-delivery-policy.mjs` from the checkout root.
The restored plan makes the policy gate self-contained. On Windows, the
current wiki output guard needs an output on the home drive; use a new
folder beneath the OS temporary directory, never a source directory.

Before adding context, inspect content for secrets, machine-specific paths,
unavailable local dependencies, active ownership, and claims of approval.
Use relative repository links. Historical immutable policy bytes are the
explicit exception for old paths; do not execute those examples as-is.
Raw historical evidence cited by summaries may remain local and must not
be presented as newly verified. This index does not authorize runtime
changes or asset promotion.
