# Hub deploy (moved from seoul-dengoku-tools, 2026-11-02)

These files were moved byte-for-byte from `seoul-dengoku-tools/TOOL/tools/deploy/`.
They still assume the former parent monorepo layout, where `GDD/`, `WIKI/`, `GAME/`, `RESEARCH/` and `TOOL/` sit side by side under one root (see `build-hub-in-docker.sh`).
Paths inside these files (`TOOL/tools/deploy/...`, `WIKI/...`, `../../..` as repo root) have **not** been rewritten for this repository.

Status: not runnable from this repository as-is. Before the move, `deploy:hub:test` already failed 3 of 4 files in seoul-dengoku-tools for the same reason.
Rework needed before use: choose the new hub source root, then rewrite `repoRoot`, the tar input list, and the `TOOL/...`/`WIKI/...` paths.
