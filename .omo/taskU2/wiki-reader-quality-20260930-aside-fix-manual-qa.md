# manualQa - U2 native Aside four-blocker correction

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| ASIDE-S1 | R1 exact person source mapping | Native Aside task-owned tab, person-0029 section and full biography list | `aside session resume LGWYCht0KfWXFRJW ...`; native `openTab`, DOM Selection, composer action, persisted-anchor inspection and same-origin person JSON comparison | PASS - relationship `소속: 규격맹` is `section:관계:list:1`, `/sections/관계` [58,65); biography list is mapped and selectable | N1, N2 |
| ASIDE-S2 | R2 durable stale reconfirmation | Native Aside tab plus same-origin nested 422 fixture | Same Aside session; POST `/__gate/mode` stale, submit, empty selection action, fresh owned-tab reload, valid reselection | PASS - invalid capture and reload retained disabled reconfirmation; valid mapped reselection alone cleared it | N1 |
| ASIDE-S3 | R3 structurally malformed saved anchor | Native Aside tab and localStorage boundary | Same Aside session; replace current route draft `sourceSpans` with `[]`, reload, inspect DOM/storage | PASS - article `강민서` and biography rendered; invalid draft key was removed | N1 |
| ASIDE-S4 | R4 pending old acknowledgement | Native Aside tab plus event-controlled held same-origin response | Same Aside session; POST `/__gate/mode` hold, submit `OLD_SENT`, inspect controls, POST `/__gate/release` | PASS - reason/body/alternative/submit disabled; NEW_UNSENT could not be entered or lost; one held request released | N1, N3 |
| ASIDE-S5 | exact source projection tests | CLI behavioral tests | `npm exec vitest run scripts/test-feedback-selection.mjs scripts/test-feedback-boundaries.mjs scripts/test-document-renderer.mjs` | PASS - 16/16 tests | N4 |
| ASIDE-S6 | compile and build | TypeScript and production build | `npx tsc -b`; `npm run build` | PASS | N5, N6 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| ASIDE-A1 | R1 | dirty/rendered Markdown | Formatting/list markers excluded while source code-point offsets remain exact | PASS | N1, N4 |
| ASIDE-A2 | R2 | stale_state | Persistent lock survives invalid action and reload | PASS | N1 |
| ASIDE-A3 | R3 | malformed_input | Complete render-consumed schema validation rejects incomplete anchor | PASS | N1 |
| ASIDE-A4 | R4 | repeated_interruptions | Pending draft controls cannot create untracked newer edits | PASS | N1, N3 |
| ASIDE-A5 | R4 | misleading_success_output | Success clears only the immutable submitted snapshot; pending form is non-editable | PASS | N1 |
| ASIDE-A6 | prior accepted B1 | navigation | Existing route-owned draft logic remains unchanged | PASS - previously accepted behavior preserved; no related source regression | N4 |
| ASIDE-A7 | prior accepted B5 | auth boundary | Existing CSRF/idempotency/session adapter remains unchanged | PASS - existing boundary tests continue passing | N4 |
| ASIDE-A8 | async discipline | flaky_tests | Held response released by explicit control event; no fixed sleep in shipped tests | PASS | N1, N4 |
| ASIDE-A9 | prompt injection | prompt_injection | No prompt-processing surface exists in U2 | not_applicable - selection feedback remains data-only and no AI consumer is introduced | N4 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| N1 | native Aside action log | Four focused checks and exact observed states | `.omo/taskU2/aside-native-fix-pass/taskU2-result.json` |
| N2 | native Aside screenshot | Person relationship/list selection surface, 1440x900 | `.omo/taskU2/aside-native-fix-pass/u2-pass-final-affiliation.png` |
| N3 | native Aside screenshot | Released held submission success surface, 1440x900 | `.omo/taskU2/aside-native-fix-pass/u2-pass-final-success.png` |
| N4 | test transcript | 16 passing targeted tests with stderr/stdout | `.omo/taskU2/aside-fix-targeted-tests.txt` |
| N5 | TypeScript transcript | TypeScript project check | `.omo/taskU2/aside-fix-tsc.txt` |
| N6 | build transcript | Production build with warnings retained | `.omo/taskU2/aside-fix-build.txt` |

Scope remains local U2. No real OAuth provider, deployed U3 persistence, own/reviewer UI, hosted route, push, PR, merge, or overall feedback PASS is claimed.
