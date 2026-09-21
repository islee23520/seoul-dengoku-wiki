# Patina score: current world docs (2026-09-21)

- Tool: patina patina 8.1.1
- Command: `/opt/homebrew/bin/patina --score --offline --format json --quiet <file>`
- Git HEAD: 0dc67baa03604f719bc90bd33a01ce199b09ad02
- Docs: 138, scored: 138, failures/timeouts: 0
- human 119 / mostly human 15 / mixed 4 / AI-like 0

## Mixed / AI-like

| File | Score | Class |
|---|---|---|
| WEB/wiki-source/world/Cast-Index-S4.md | 33.3 | mixed |
| WEB/wiki-source/world/Chaebol-Houses-and-Century-Factions.md | 45.5 | mixed |
| WEB/wiki-source/world/Martial-Paths.md | 31.4 | mixed |
| WEB/wiki-source/world/Station-Interior-Construction.md | 35 | mixed |

## Notes
- Offline deterministic scoring only; LLM-judged categories unavailable.
- World-Expansion-Index.md was skipped by patina (skipped=true, overall 0): not a scored result.
- Offices-and-Ranks.md had an uncommitted modification at scoring time.
- Excluded authoring docs: names were not provided; 138 tracked files == 138 on disk and none has an authoring-like name.

SHA256 of every scored file is in the JSON `documents[].sha256`.
