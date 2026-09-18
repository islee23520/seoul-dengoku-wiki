# Narrative proposal: execution receipt

## Scope and identity

- Tracking issue: #41.
- Repository: `islee23520/seoul-kenshi`.
- Base commit: `4c2f8ecec47e27ddf13c70e412188f92a07a8663`.
- Base tree from the Git commit object: `b123a5ce5331af840ccdaf446a14f438b97f06c5`.
- Delivery branch: `docs/issue-41-narrative-direction`.
- Scope: two proposal documents and this directory's document-validation artifacts only.
- No canonical game-logic pages, navigation, cast, ToDo, runtime, scenes, or assets changed.

## Environment boundary

Source documents and metadata were read through the connected GitHub tool. This is not a full repository checkout. An isolated local Git worktree containing only the new proposal packet was used for document checks. Its local commit IDs are validation-fixture IDs, not upstream repository commits. Existing user worktrees and dirty files were not accessed or modified.

`source-index.json` records blob IDs returned by GitHub file/tree reads for linked baseline files. Snapshot mode uses that supplied metadata to resolve links that are absent locally. It does not fetch those targets, run their code, or establish a full-checkout pass. Default validator mode does not use the index and requires real link-target files.

## Executed checks

| Check | Actual result |
|---|---|
| Validator on an empty temporary packet with the source index | RED, exit 1, both missing proposal documents rejected |
| `python3 .omo/evidence/narrative-direction/verify-docs.py --self-test` | GREEN, exit 0, positive fixture and five rejected mutations |
| `python3 .omo/evidence/narrative-direction/verify-docs.py --source-index .omo/evidence/narrative-direction/source-index.json` | GREEN, exit 0, both real proposal documents validated in snapshot mode |
| Default validator on the incomplete local snapshot | Exit 1 as expected, missing baseline link targets were not silently accepted |
| Python syntax using `ast.parse` | PASS |
| `git diff --cached --check` in the isolated new-file worktree | PASS, exit 0 |

The five synthetic self-test mutations are missing status, broken link, root-escaping link, missing required heading, and missing document. These test the documentation checker only. They do not simulate a game session or prove narrative quality.

## Content identities before delivery

| Path | SHA-256 |
|---|---|
| `docs/proposals/Narrative-Direction.md` | `1c5a918bc520b30a9b26638c8c9b9e86b4f7539f77057976a5829d4ad4ef7c6b` |
| `docs/proposals/Scenario-Hold-the-Gate.md` | `99a4f9da2cceb8f9b7f090f6a9bc75a67bdf99d6638a7b137f6e35c942f778ef` |
| `.omo/evidence/narrative-direction/verify-docs.py` | `3dd1c35b36c237c1dec50f094df8df1eb71a0a6366dea767f7908a0fb015e8d0` |
| `.omo/evidence/narrative-direction/source-index.json` | `adcb74b55f43a3833a788c494ac54842a10d164308a5fb4b3a3bf56d3a378798` |

## Not executed or not claimed

- Full-checkout `git diff --check 4c2f8ecec47e27ddf13c70e412188f92a07a8663...HEAD`.
- Full-checkout default link validation, repository-wide architecture/policy gates.
- Wiki build, cast verification, public Wiki publication.
- Unity compilation, EditMode, PlayMode, editor capture, player build.
- Human playtest, paper-session success, fun acceptance, owner approval.

The GitHub parent, changed-path allowlist, and remote content hashes are to be checked after creating the delivery commit. Their result belongs in the PR description; this pre-commit receipt does not claim those later checks have already happened.

## Reproduction in a full checkout

Run from the repository root after checking out the PR:

```bash
python3 .omo/evidence/narrative-direction/verify-docs.py
python3 .omo/evidence/narrative-direction/verify-docs.py --self-test
git diff --check 4c2f8ecec47e27ddf13c70e412188f92a07a8663...HEAD
```

A document-check pass is not approval to start a new product module or change canonical story facts. Owner-only merging and separate runtime approval remain in effect.
