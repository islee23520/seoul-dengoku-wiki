# ADR-001: Repository delivery policy

- Status: Accepted
- Date: 2026-09-03
- Supersedes: the local-only delivery clauses of `.omo/plans/seoul-grand-strategy-srpg.md` (listed below)
- Decided by: repository owner, recorded in `.omo/evidence/foundation/execution-notepad.md` and the approved remediation plan `.omo/plans/fix-validate-commit-push.md` (Momus receipt `st_01a066c9`)

## Context

The approved grand-strategy plan was written when no GitHub repository existed for this project. It therefore locked the work to the local repository and forbade remotes, pushes and Wiki publication. Typical clauses:

- "GitHub remote는 미설정 상태로 유지" (keep the GitHub remote unset)
- "GitHub 저장소·remote·push·Wiki 게시에 관한 외부 쓰기는 이 계획에서 수행하지 않습니다" (this plan performs no external writes)
- "Do not create any GitHub repository or remote under this plan."
- "`git remote -v` remains empty"
- "remote Wiki publication is outside this plan" / "Remote publication is a separate future plan."

On 2026-09-02 the owner gave later, explicit authorization that overrides those clauses: create the private GitHub repository `islee23520/seoul-kenshi`, bind it as `origin`, and push this local repository. That authorization is recorded in `.omo/evidence/foundation/execution-notepad.md` ("Repository target authorized by latest user message"). The repository was subsequently renamed on GitHub to `islee23520/seoul-dengoku`; GitHub redirects the historical URL, and the canonical repository URL is now `https://github.com/islee23520/seoul-dengoku.git`. On 2026-09-03 the owner approved the remediation plan `fix-validate-commit-push` (Momus receipt `st_01a066c9`), which authorizes a dedicated remediation branch, one push of that branch, and one pull request. The SHA-256 `724af715196adb109d94895542ad3a85fee2c2764682e749173f12c375d76c84` is the **approval-time** hash of `.omo/plans/fix-validate-commit-push.md` — the exact bytes Momus reviewed. That plan file is a living execution checklist and has since gained progress markers, so its current on-disk hash differs (`8aa1cc5669cc065170165efde85296519e5a24322084ba8e56952829df3025e8` as of 2026-09-03). The approval binds to the approval-time content, not to later execution edits. The quoted approval receipt is stored in the "Approval receipt" section below.

Keeping both texts without a supersession reference leaves two contradictory rules in force. This ADR resolves the conflict.

## Decision

This ADR is the single current delivery rule for the repository. Every local-only clause in the approved plan, and any future document that touches delivery, remotes or pushes, defers to this ADR.

1. **Current remote.** The canonical repository is `https://github.com/islee23520/seoul-dengoku.git`. The historical `https://github.com/islee23520/seoul-kenshi.git` URL may remain as a local `origin` because GitHub redirects it to the same repository. No other repository is authorized.
2. **Branch and pull request only.** All delivery goes through a dedicated branch and a pull request. Direct push to main is forbidden.
3. **No history rewrite.** No force-push, no amend of published commits, no rebase of shared history, no merge performed by agents. The owner merges pull requests.
4. **Excluded repository.** The unused private shooter repository stays fully out of scope. Do not query, inspect, rename, delete, overwrite, clone, transfer, bind or push it. This exclusion is unchanged by the supersession.
5. **Derived Wiki assets.** Repository documents under `LORE/` are the only lore source of truth. Local wiki-builder output and the VitePress tree under `WEB/wiki-source/` are generated, drift-checked derivatives. GitHub Wiki is retired. The public surface is `https://seoul-kenshi.vercel.app`.
6. **Rollback and review.** Revert with `git revert` on a new branch and a new pull request. Every delivery keeps its RED-to-GREEN evidence under `.omo/evidence/`. Reviewer locks from the approved plan (art, marketing, critic, Momus) still apply to their original scope.

## Approval receipt

Momus review of `.omo/plans/fix-validate-commit-push.md`, quoted from the persisted task record `.omo/senpi-task/tasks/st_01a066c9.json` (agent_type `momus`, model `openai/gpt-5.6-sol`, created 2026-09-03T10:21:33Z, terminal 2026-09-03T10:22:43Z, status `completed`):

> **[OKAY]**
>
> **Summary**: All file references exist, every task has executable QA scenarios (exact commands and expected outcomes), dependencies and commit boundaries are internally consistent, and no contradictions block execution.

This ADR (a tracked document under `docs/`) is the retrievable record of that receipt; the senpi task store is machine-local and git-ignored.

## Consequences

- The approved plan's original text is preserved byte-for-byte. A non-rewriting amendment appended to the plan links each superseded clause to this ADR and records the plan's pre-amendment SHA-256.
- `tools/policy/check-repo-delivery-policy.mjs` enforces this reconciliation: it fails if a local-only clause lacks a supersession reference, if this ADR is missing or incomplete, or if a second current delivery rule appears.
- `.gitignore` ignores `.senpi/` because that directory holds local agent session state created by memory reflection and hooks. It is machine-local runtime data, never a deliverable, so it must not be committed.
- The quarantined configuration changes (`activeInputHandler` in `ProjectSettings.asset`, the generated `PackageManagerSettings.asset`, and the unstaged `Asset-Pipeline.md` rewrite) stay quarantined. They are unrelated to delivery policy and are not adopted or reverted by this ADR.
