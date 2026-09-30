# manualQa - U2 person biography link-label delta

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| LINK-S1 | U2-be102 B1 visible biography link label | Native Aside task-owned tab, `/wiki/people/person-0998`, opened full biography | `aside --host local exec ...`; native `openTab`, disclosure click, Range over real `<a href="https://github.com/islee23520">islee23520</a>`, feedback button click | PASS - preview and anchor exactQuote are `islee23520`, leaf `biography:list:6` | L1, L2 |
| LINK-S2 | U1 source-span mapping | Native Aside persisted draft plus same-origin person JSON | Same invocation; inspect local draft then slice fetched biography by code-point span | PASS - `/biography` [220,230) slices exactly `islee23520`; delimiters and URL excluded | L1 |
| LINK-S3 | Keyboard feedback action | Native Aside task-owned tab | Cancel mouse-created draft, recreate native Range, focus `선택 문장 제보`, press Enter | PASS - same preview and anchor recreated | L1, L2 |
| LINK-S4 | Link navigation preservation | Native Aside DOM inspection without navigation | Read real link href/text before selection | PASS - href remains `https://github.com/islee23520`; selection does not navigate or replace link | L1 |
| LINK-S5 | Actual and formatted/emoji projection tests | CLI targeted tests | `npm exec vitest run scripts/test-feedback-selection.mjs scripts/test-feedback-boundaries.mjs scripts/test-document-renderer.mjs` | PASS - 18/18 | L3 |
| LINK-S6 | Compile/build | TypeScript and Vite build | `npx tsc -b`; `npm run build` | PASS | L4, L5 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| LINK-A1 | B1 | dirty/rendered Markdown | Visible label retained; `[ ] ( URL )` syntax excluded | PASS | L1, L3 |
| LINK-A2 | B1 | codepoint/emoji | Formatted emoji label maps source in rendered order | PASS | L3 |
| LINK-A3 | B1 | clipping | Partial label clipping returns only label source control | PASS | L3 |
| LINK-A4 | regression | navigation | Actual link remains an anchor with unchanged href | PASS | L1 |
| LINK-A5 | regression | keyboard | Focused action with Enter captures selected link text | PASS | L1 |
| LINK-A6 | prior accepted state | stale/malformed/cancel | No related source files changed | PASS - prior fixes preserved by targeted suite and unchanged composer/API | L3 |
| LINK-A7 | misleading success | evidence | Screenshot is paired with persisted anchor and source-slice proof | PASS | L1, L2 |
| LINK-A8 | flaky_tests | async | Native checks wait on actual rendered selectors/states; no shipped sleeps | PASS | L1, L3 |
| LINK-A9 | prompt_injection | prompt | No AI/prompt consumer is introduced | not_applicable - this delta only maps rendered Markdown text | L3 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| L1 | native Aside JSON | Exact quote, leaf and source span with source slice match | `.omo/taskU2/aside-native-link-fix/person-0998-link-selection.json` |
| L2 | native Aside screenshot | Open person biography and composer preview for actual link label | `.omo/taskU2/aside-native-link-fix/person-0998-link-selection.png` |
| L3 | test transcript | 18 passing targeted tests | `.omo/taskU2/link-fix-targeted-tests.txt` |
| L4 | TypeScript transcript | TypeScript project check | `.omo/taskU2/link-fix-tsc.txt` |
| L5 | build transcript | Production build | `.omo/taskU2/link-fix-build.txt` |

This is only the final U2 link-mapping delta. No U3 catalog acceptance, OAuth, deployed persistence, push, PR, merge, or overall feedback approval is claimed.
