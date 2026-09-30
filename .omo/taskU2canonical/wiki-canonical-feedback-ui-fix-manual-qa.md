# manualQa - canonical U2 duplicate identity and route-race correction

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| FIX2-S1 | U2-DOM-IDENTITY duplicate loose list | Actual production `bindFeedbackLeaves` and `captureFeedbackAnchor` in native Aside task-owned tab | Native Aside session; inject `<ul><li><p>same</p></li><li><p>same</p></li></ul>`, bind with exact `li, p`, select second LI | PASS - LI item:0 and LI item:1 bind separately; second selection captures item:1 and `/content/items/1` | D1, D2 |
| FIX2-S2 | U2-DOM-IDENTITY ambiguous occurrence | Actual production binder in native Aside | One canonical leaf against two identical sibling paragraphs | PASS - returns null and assigns no attributes | D1, D2 |
| FIX2-S3 | U2-ROUTE mounted late response | Mounted React hook with event-controlled fetch responses | `scripts/test-feedback-view-hook.mjs`; render old KO route, rerender new EN route, release new then old | PASS - old request aborted; loading clears authority; new document remains after old release | D3 |
| FIX2-S4 | U2-ROUTE controller | Production controller with exact response signals | `scripts/test-feedback-view-controller.mjs` | PASS - old route never published after new route | D3 |
| FIX2-S5 | preserved canonical integration | Related targeted suite | `npm exec vitest run ...` seven files | PASS - 20/20 including endpoint, atomic clipping, API and renderer | D3 |
| FIX2-S6 | compile/build | CLI | `npx tsc -b`; `npm run build` | PASS | D4, D5 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| FIX2-A1 | duplicate occurrence | repeated text | Distinct canonical IDs bind distinct visible occurrences | PASS | D1, D2 |
| FIX2-A2 | ambiguous extra DOM | malformed_input | Extra identical occurrence fails closed | PASS | D1, D3 |
| FIX2-A3 | nested loose list | dirty/rendered DOM | LI/P nesting cannot consume two leaves from one occurrence | PASS | D1, D3 |
| FIX2-A4 | route race | stale_state | Old KO response cannot replace current EN authority | PASS | D3 |
| FIX2-A5 | route race | repeated_interruptions | Abort and request identity survive old-last release | PASS | D3 |
| FIX2-A6 | false tests | misleading_success_output | Behavior is exercised through actual binder/hook, not source-name absence | PASS | D1, D3 |
| FIX2-A7 | async | flaky_tests | Deferred promises and exact state transitions; no sleeps | PASS | D3 |
| FIX2-A8 | prior guarantees | cancel_resume | Existing composer/API/atomic tests remain passing | PASS | D3 |
| FIX2-A9 | provider | provider credentials | Hosted provider remains out of scope | not_applicable - no real provider credentials used | D3 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| D1 | native Aside JSON | Actual production duplicate binding/capture and ambiguity result | `.omo/taskU2canonical/aside-duplicate-fix/result.json` |
| D2 | native Aside screenshot | Two duplicate list occurrences, distinct IDs and second source path | `.omo/taskU2canonical/aside-duplicate-fix/duplicate-leaf-qa.png` |
| D3 | test transcript | 20 passing mounted/controller/DOM/canonical/API tests | `.omo/taskU2canonical/fix-targeted-tests.txt` |
| D4 | TypeScript transcript | TypeScript project check | `.omo/taskU2canonical/fix-tsc.txt` |
| D5 | build transcript | Production build | `.omo/taskU2canonical/fix-build.txt` |

No provider, hosted deployment, canon edit, push, PR, merge, or full U2 completion is claimed before the next independent gate.
