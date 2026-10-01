# manualQa - canonical document-scoped feedback UI

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| C-S1 | canonical article/formatted selection | Native Aside task-owned tab, real `/wiki/world/World-Unbinding` through actual endpoint service | Aside session `6Eb0dK9D5J9SKNUz`; select mapped article paragraph and invoke feedback | PASS - `DOC:World-Unbinding`, producer sourceRevision, leaf `왜-백-년인가-p1:text`, canonical `/content/8/text/ko` | A1, A3 |
| C-S2 | canonical table selection | Native Aside on article table | Same session; select mapped table cell | PASS - producer cell leaf and `/content/14/columns/0/ko` span | A1, A3 |
| C-S3 | route-change clearing and ownership | Native Aside actual article-body link | Same session; navigate World-Unbinding -> Lost-Technology-Lineage | PASS - 182 destination leaves, zero old-document bound leaves | A1 |
| C-S4 | canonical person biography/link | Native Aside person-0998 with disclosure open | Same session; select contributor list item and invoke feedback | PASS - `PERSON:person-0998`, producer `biography:인물-이일섭-list2:item:5`, canonical `/content/709/...` spans | A1, A4 |
| C-S5 | honest excluded surface | Native Aside `/wiki/world/Glossary` | Same session | PASS - reader visible; no composer and zero feedback leaves; no fallback parser | A1, A2 |
| C-S6 | atomic entity accepted by actual service | Actual endpoint/service with generated catalog plus isolated entity record and test-auth session | `node .omo/taskU2canonical/real-service-check.mjs` | PASS - full [1,6) token accepted 201; stale revision 422 source-changed; partial token 422 ambiguous-selection | A5 |
| C-S7 | targeted tests | CLI | `npm exec vitest run scripts/test-feedback-canonical-ui.mjs scripts/test-feedback-selection.mjs scripts/test-feedback-boundaries.mjs scripts/test-document-renderer.mjs` | PASS - 19/19 | A6 |
| C-S8 | TypeScript/build | CLI | `npx tsc -b`; `npm run build` | PASS | A7, A8 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| C-A1 | nonlinear mapping | malformed_input | Partial encoded token rejected | PASS | A5, A6 |
| C-A2 | stale authority | stale_state | Old revision yields source-changed/reconfirmation | PASS | A5 |
| C-A3 | authority migration | cancel_resume | Historical prose is retained but anchor locked until current selection | PASS - implemented in composer and boundary tests preserve existing cancel behavior | A6 |
| C-A4 | route race | repeated_interruptions | Old response cannot bind after route/locale change | PASS - abort/request identity test and actual old-leaf clearing | A1, A6 |
| C-A5 | unavailable/excluded | misleading_success_output | No local parser/fake canonical pointers | PASS | A1, A2, A6 |
| C-A6 | private bulk | dirty_worktree | Public generated article/dist excludes historical feedback/bulk catalog | PASS - generated JSON regression and ignored private catalog | A6, A8 |
| C-A7 | auth boundary | prompt_injection | Anonymous view does not grant submit; test auth explicitly local | PASS - actual endpoint service contract; no AI consumer | A5 |
| C-A8 | async | flaky_tests | Abort/event/state waits, no shipped sleeps | PASS | A1, A6 |
| C-A9 | hosted provider | provider credentials | Real GitHub/provider is outside this local integration | not_applicable - local test provider was explicit and no production credentials were used | A5 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A1 | native Aside JSON | Actual article/table/navigation/person/excluded outcomes | `.omo/taskU2canonical/aside-pass-final/aside-pass-final.json` |
| A2 | screenshot | Glossary remains readable without feedback controls | `.omo/taskU2canonical/aside-pass-final/01-glossary.png` |
| A3 | screenshot | Canonical article selection composer | `.omo/taskU2canonical/aside-pass-final/02-world.png` |
| A4 | screenshot | Canonical person page and feedback surface | `.omo/taskU2canonical/aside-pass-final/03-person-0998.png` |
| A5 | HTTP/service log | Actual test-auth entity submission, stale and partial rejection | `.omo/taskU2canonical/real-service-check.json` |
| A6 | test transcript | 19 passing canonical and preserved UI tests | `.omo/taskU2canonical/targeted-tests.txt` |
| A7 | TypeScript transcript | Project typecheck | `.omo/taskU2canonical/tsc.txt` |
| A8 | build transcript | Production build with warnings retained | `.omo/taskU2canonical/build.txt` |

The entity record added to the isolated copied catalog is a local fixture for the confirmed v2 contract. It is not canon, public output, or a hosted/provider claim. Full OAuth, deployed persistence, review UI and host/live verification remain outside this candidate.
