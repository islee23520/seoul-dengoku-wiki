# manualQa - U2 rejection corrections

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| FIX-S1 | B1 route draft ownership | Headed Brave desktop, actual article-body SPA link | `node .omo/taskU2/fix-browser-qa.mjs` | PASS - destination retained `TARGET original draft`; stored anchor route remained `/world/Lost-Technology-Lineage` | F1 |
| FIX-S2 | B2 full biography | Headed Brave person-0001 disclosure | Same invocation; open full biography, select text, invoke composer | PASS - preview `수문국 선출 군주.`, leaf `biography:paragraph:0` | F1 |
| FIX-S3 | B2 paragraph/list person section | Headed Brave person-0029 relationship list | Same invocation; select rendered list item | PASS - list item captured as `section:관계:list:1` | F1, F2 |
| FIX-S4 | B7 malformed local storage | Headed Brave reload with `{broken` in route draft key | Same invocation | PASS - article remained rendered and invalid draft was removed | F1 |
| FIX-S5 | B3 acknowledgement validation | Headed Brave HTTP fault seam returning HTML 200 | `node .omo/taskU2/fix-submit-browser-qa.mjs` | PASS - explicit error, draft `html draft` retained | F3 |
| FIX-S6 | B4 duplicate prevention / cancellation | Headed Brave held-response seam released by explicit event | Same invocation | PASS - one POST only; recapture remained pending; cancel aborted and did not permit late erasure | F3 |
| FIX-S7 | B6 nested source change | Headed Brave 422 nested error envelope | Same invocation | PASS - explicit reconfirmation UI, draft retained, submit disabled until reselection | F3, F4 |
| FIX-S8 | B5 U3 session/CSRF/idempotency | CLI behavioral adapter tests | `npm exec vitest run scripts/test-feedback-selection.mjs scripts/test-feedback-boundaries.mjs scripts/test-document-renderer.mjs` | PASS - session request, CSRF header, stable idempotency header, JSON record validation | F5 |
| FIX-S9 | corrected production compilation | Build surface | `npm run build` | PASS | F6 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| FIX-A1 | B7 | malformed_input | Invalid local JSON cannot blank reader | PASS | F1 |
| FIX-A2 | B6 | stale_state | Preserve typed source-changed and require reconfirmation | PASS | F3, F4 |
| FIX-A3 | B4 | cancel_resume | Abort owned request; late completion cannot erase replacement | PASS | F3 |
| FIX-A4 | B4/B5 | repeated_interruptions | Stable key and in-flight guard prevent duplicate POST | PASS | F3, F5 |
| FIX-A5 | B3 | misleading_success_output | HTML/malformed/redirect response cannot become success | PASS | F3, F5 |
| FIX-A6 | B1 | navigation | Draft ownership remains atomic across actual SPA navigation | PASS | F1 |
| FIX-A7 | B2 | dirty/rendered Markdown | Bind rendered paragraph/list/biography leaves rather than raw section equality | PASS | F1, F2 |
| FIX-A8 | tests | flaky_tests | Async browser requests released by exact promise event, no fixed sleeps in tests | PASS | F3, F5 |
| FIX-A9 | scope | prompt_injection | No AI/prompt consumer exists in U2; HTML remains React text/form values | not_applicable - this correction does not introduce a prompt-processing surface | F5 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| F1 | browser action log | Real navigation, biography, list and malformed-storage outcomes | `.omo/taskU2/fix-browser-action-log.json` |
| F2 | screenshot | Real person relationship/list capture surface | `.omo/taskU2/fix-person-list.png` |
| F3 | browser action log | HTML acknowledgement, pending duplicate/cancel and stale reconfirmation outcomes | `.omo/taskU2/fix-submit-browser-action-log.json` |
| F4 | screenshot | Stale nested response with reselection-required UI | `.omo/taskU2/fix-stale-reconfirm.png` |
| F5 | test transcript | 15 passing targeted boundary/selection/renderer tests | `.omo/taskU2/fix-targeted-tests.txt` |
| F6 | build transcript | Production build after corrections | `.omo/taskU2/fix-build.txt` |
| F7 | shared interface | Updated session, CSRF, idempotency and acknowledgement requirements | `.omo/taskU2/interface-contract.json` |

No hosted OAuth, deployed U3 integration, own/reviewer surfaces, push, PR, merge, or overall feedback PASS is claimed.
