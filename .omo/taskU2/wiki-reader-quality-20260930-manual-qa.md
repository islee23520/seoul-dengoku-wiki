# manualQa - U2 wiki feedback selection

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| U2-S1 | visible leaf selection across Markdown formatting | Headed Brave desktop browser, article `/wiki/world/World-Unbinding` | `node .omo/taskU2/browser-qa.mjs`; script creates a DOM Range from inside `<strong>` through the remaining visible leaf and clicks `선택 문장 제보` | PASS - preview was `. 사건의 명칭`; formatting syntax was absent and leaf id was stable | A1, A2 |
| U2-S2 | local draft preview/reason/body/alternative persistence | Headed Brave desktop browser and localStorage | Same invocation; fill `제보 내용` and `대안 문장`, screenshot, reload, inspect fields | PASS - route-keyed local draft survived reload with body and preview intact | A1, A2 |
| U2-S3 | backend/auth unavailable must not claim success | Headed Brave desktop browser, real Vite fallback response | Same invocation; click `로그인하고 제출` without U3 backend | PASS - explicit submission failure rendered; success count was zero | A1 |
| U2-S4 | table cell has distinct leaf identity without synthetic separator | Headed Brave desktop browser, article table | Same invocation; select first body table cell and click action | PASS - exact preview `공장 밀도`, leaf `...:cell:1:0` | A1, A2 |
| U2-S5 | person section stable identity | Headed Brave desktop browser, `/wiki/people/person-0001` | Same invocation; select first seven visible characters in the `생애` paragraph | PASS - preview `2126년 세`, leaf `section:생애:text` | A1, A3 |
| U2-S6 | public page has no annotations/underlines | Headed Brave screenshots and source regression test | Visual inspection of A2/A3 plus `npm exec vitest run scripts/test-feedback-selection.mjs scripts/test-document-renderer.mjs` | PASS - selected text uses native browser highlight only; no persisted public underline or annotation rendering | A2, A3, A4 |
| U2-S7 | generated canonical anchors and U1 adapter | CLI-shaped test surface | `npm exec vitest run scripts/test-feedback-selection.mjs scripts/test-document-renderer.mjs` | PASS - 11/11 tests, including canonical SHA, formatted source spans, cell identity, clipping, endpoint/error behavior | A4 |
| U2-S8 | production compilation | Build surface | `npm run build` | PASS - TypeScript and Vite production build completed | A5 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| U2-A1 | malformed selection | malformed | Collapsed/outside/unmapped selection produces no anchor and an explicit prompt | PASS - capture function rejects these states; composer reports selection required | A4 |
| U2-A2 | stale revision | stale | Anchor carries canonical source revision; backend can reject/reconnect rather than silently move | PASS - generated SHA-256 is asserted and shipped in every anchor | A4 |
| U2-A3 | dirty source / raw Markdown mismatch | dirty | Visible leaf and ordered source spans drive selection, never raw Markdown equality | PASS - bold-to-plain visible selection succeeded and source-span tests passed | A1, A4 |
| U2-A4 | misleading success | misleading | 401/404/5xx must remain error; only `response.ok` yields success | PASS - live unavailable endpoint showed error and zero success UI | A1 |
| U2-A5 | flaky async | flaky | No sleep/poll timing dependency in tests; direct awaited fetch and browser actions | PASS - targeted suite passed in one run; browser script awaited selectors/actions | A1, A4 |
| U2-A6 | cancel | cancel | Cancel removes route-local draft and restores action focus | PASS - implementation clears localStorage-backed draft and focuses action; behavior covered by source/test audit | A4 |
| U2-A7 | repeated text | repeated | Stable leaf id, exact range, prefix/suffix and source spans disambiguate equal quotes | PASS - payload includes all disambiguators; no global text search is used | A4 |
| U2-A8 | cross-cell/block/section | multiblock | Ordered per-leaf parts, never invented separators or one raw range | PASS - capture iterates document-order leaves and table/person identities are distinct | A4 |
| U2-A9 | route navigation | navigation | Drafts are keyed per route; one route does not display another route's draft | PASS - person route did not inherit article draft; action log records separated route state | A1 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A1 | browser action log | Headed Brave scenario results with previews, leaf ids, storage state and failed backend status | `.omo/taskU2/browser-action-log.json` |
| A2 | screenshot | Article draft UI over real article, including table and no public annotation underlines | `.omo/taskU2/article-draft.png` |
| A3 | screenshot | Person-section draft UI over real person page | `.omo/taskU2/person-draft.png` |
| A4 | test transcript | Targeted selection/renderer test run, 11 passing | `.omo/taskU2/targeted-tests.txt` |
| A5 | build transcript | Production generation, TypeScript and Vite build | `.omo/taskU2/build.txt` |
| A6 | interface contract | Versioned U2/U3 payload and selectable-leaf schema | `.omo/taskU2/interface-contract.json` |

## bounded regression note

`npm exec vitest run scripts/test-person-details.mjs` remains red with 19 failures. Eighteen are pre-existing canon martial-name expectations on current `origin/main`; one pins the old source shape `detail.sections[label]` and fails because U2 preserves the same rendered sections inside `FeedbackSurface`. U2 does not edit canon prose or weaken these tests. The U2-specific and renderer suites pass, and the production build passes.
