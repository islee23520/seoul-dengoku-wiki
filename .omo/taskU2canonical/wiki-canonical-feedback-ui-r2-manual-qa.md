# manualQa - c353 regression corrections

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| R2-S1 | R1 real person inline link | Native Aside task-owned tab, actual person-0998 endpoint/DOM | Open person-0998, open biography, select actual `islee23520`, click selection action | PASS - 28 canonical leaves bound, contributor LI has producer ID, composer/draft exactQuote and `/content/709/items/5/ko` span valid | E1, E2 |
| R2-S2 | R1 duplicate loose list | Actual production binder/capture in native Aside isolated fixture | Bind shared-renderer `<li><p>same</p></li>` duplicates using exact `li, p`; select second occurrence | PASS - separate item:0/item:1; second capture `/content/items/1`; ambiguous extra paragraphs null/no attributes | E3, E4 |
| R2-S3 | R2 mounted pending unmount | Mounted React hook with native AbortError fetch | `scripts/test-feedback-view-hook.mjs`; subscribe rejection, render pending, unmount, abort reject | PASS - no unhandled rejection | E5 |
| R2-S4 | R2 request-owned controller | Production controller test | `scripts/test-feedback-view-controller.mjs` | PASS - disposed request uses owned controller and resolves silently | E5 |
| R2-S5 | old-last route/locale ownership | Mounted hook and controller deferred responses | Release new EN then old KO | PASS - current authority remains DOC:New | E5 |
| R2-S6 | related regression suite | CLI | Seven related test files | PASS | E5 |
| R2-S7 | compile/build | CLI | `npx tsc -b`; `npm run build` | PASS | E6, E7 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| R2-A1 | inline content | dirty/rendered DOM | `<a>`/`<strong>` descendants remain part of one visible occurrence | PASS | E1, E5 |
| R2-A2 | duplicate | repeated text | Duplicate occurrences retain distinct source contexts | PASS | E3, E5 |
| R2-A3 | ambiguity | malformed_input | Extra unmatched identical occurrence fails closed | PASS | E3, E5 |
| R2-A4 | dispose | cancel_resume | Abort rejection after dispose is silent | PASS | E5 |
| R2-A5 | route change | stale_state | Old-last response cannot overwrite current authority | PASS | E5 |
| R2-A6 | cleanup | repeated_interruptions | Unmount cleanup does not dereference cleared shared state | PASS | E5 |
| R2-A7 | evidence | misleading_success_output | Native person proof includes actual leaf and persisted anchor | PASS | E1, E2 |
| R2-A8 | async | flaky_tests | Exact deferred events, no shipped sleeps | PASS | E5 |
| R2-A9 | provider | provider credentials | Hosted provider remains out of scope | not_applicable - no production credentials used | E5 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| E1 | native Aside JSON | Actual person contributor canonical binding/draft | `.omo/taskU2canonical/aside-person-route-fix/person-result.json` |
| E2 | native Aside screenshot | Open biography and visible feedback composer | `.omo/taskU2canonical/aside-person-route-fix/person-route.png` |
| E3 | native Aside JSON | Actual production duplicate binding/capture and ambiguity | `.omo/taskU2canonical/aside-duplicate-fix/result.json` |
| E4 | native Aside screenshot | Duplicate identities and second source path | `.omo/taskU2canonical/aside-duplicate-fix/duplicate-leaf-qa.png` |
| E5 | test transcript | Full related suite including mounted unmount and old-last response | `.omo/taskU2canonical/r2-targeted-tests.txt` |
| E6 | TypeScript transcript | TypeScript project check | `.omo/taskU2canonical/r2-tsc.txt` |
| E7 | build transcript | Production build | `.omo/taskU2canonical/r2-build.txt` |

The native held-route control attempt is recorded separately as blocked because the Aside agent queried the wrong control path. The deterministic mounted production-hook test is the accepted route/unmount evidence. No full U2 approval, provider, hosted, canon, push, PR or merge claim is made.
