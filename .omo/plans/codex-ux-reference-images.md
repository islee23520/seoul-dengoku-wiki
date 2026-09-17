# Codex UX reference images — work plan

Goal: land every remaining image from Codex thread `01a06b18-4373-7fa3-9cad-01d2254f05bc` onto a branch based on latest `origin/main`, with a Korean inventory report, then push and open a PR.

Notepad: `/var/folders/y1/k3nhx8z96tl4d1cm8b3kjlbm0000gp/T/ulw-2026-09-17T07-57-07-602Z.codeximg.md`

Tier: LIGHT. Sequential git on this worktree. No subagents.

## Constraints
- ADR-001: dedicated branch + PR. No direct push to `main`. Owner merges.
- Local workflow: `checkout main`, fast-forward to `origin/main`, then branch `docs/codex-ux-reference-images`.
- SERVICES.md: do not register these AI concept images on the Vercel hub.
- PNG goes through existing Git LFS.

## Source
`~/.codex/visualizations/2026/09/04/01a06b18-4373-7fa3-9cad-01d2254f05bc/`

## Destination
`Design/codex-ux-refs/` (relative paths preserved) + `Design/codex-ux-refs/README.md`

## Missing drafts to document, not invent
- `seoul-kenshi-context-hud-noncombat.png` → replaced by `-final`
- `seoul-kenshi-context-hud-unity-pov.png` → not on disk

## Verify
- RED: `git ls-files Design/codex-ux-refs` empty before copy
- GREEN: sha256 of each copied file equals source; `git lfs ls-files` covers PNGs; PR URL exists; `origin/main` unchanged by this push
