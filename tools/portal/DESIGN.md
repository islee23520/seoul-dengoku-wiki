# 서울전국 초상 작업대 Design System

## Current local-first scope override

Portrait generation accepts authenticated Wiki design tokens without a registered
photo. Show the source mode explicitly as original-photo or design-token-only;
never substitute a different person's image. Both single and batch portrait
outputs use 340x510 pixels, preserving 2:3 with both dimensions below 512. Source
previews and historical jobs retain their actual recorded dimensions.

### Two distinct provider connections (2026-10-19)

The connection disclosure shows two independent connections that coexist in one
session. `OpenAI 호환 (CLIProxy)` is the existing account connection: saved
CLIProxy/CPA base URL, API key and GPT/Gemini/Grok model, auto-bound per session
exactly as before. `ComfyUI 연결 (별도 프로바이더)` is a separate server-owned
provider: the browser selects only a server-listed workflow and presses
`ComfyUI 연결 확인`; no URL, graph or key is entered, readiness is verified
server-side (`/system_stats`, `/object_info`) and nothing is generated. Each has
its own status text, details, `해제` control and revocation; changing the OpenAI
account does not revoke the Comfy connection, and logout revokes both.

The 초상 task has an explicit `이미지 생성 프로바이더` select (`openai-compatible`
or `comfyui`), an optional ComfyUI seed input, and a live `요청 모델 / 워크플로`
readout. Selection alone never sends a request; only `초상 생성` does, with one
immutable UUID. A Comfy request carries `providerModel:
"comfyui:moss-image-sft-text.v1"` and the Comfy connection id; the server
rejects a workflow on the wrong connection. Visible limits: the workflow
transports only the retained authored design-token projection text, no
identity photo or technique/framing reference image, and it is a MOSS-Image SFT text
draft with no SD3.5 style qualification. Results stay HOLD candidates in the same
result/history/download/review surfaces; the receipt panel and history entries
label the provider so a Comfy draft is never read as GPT evidence.

The explicit user direction on 2026-10-13 replaces centralized hosting with each user's own-computer local/self-hosted application. GitHub-only and reviewed MCP connection requirements below are historical API documentation. Preserve shared tokens, native controls and review binding. The approved 2026-10-14 v2 spatial and state contract below supersedes the earlier three-column layout and document-only scrolling rules.

## Approved v2 spatial and state contract

### Explicit image workstations

The owner navigation adds full-body turntable and part/reference tasks beside the existing portrait task. The v2 catalog owns category availability and production capability only. Authenticated registered originals, Wiki eligibility, sealed portrait identities and the current reference style supply source authority; no arbitrary file path or inferred look is accepted. The owner writes the design source ID, description, dimensions, background, canvas ID, anchor and crop. Fields begin blank. Category-specific variant, ordered view and exclusions are visible contract invariants, never hidden portrait-size defaults. Existing portrait generation, the full Wiki catalog and job-bound overlay remain unchanged.

Reuse native labeled select/input/textarea, fieldset, notice, result-strip and checkerboard figure primitives. Workstation forms and frame grids use document scroll in both themes, two equal columns above the existing 768px breakpoint and one column below it; spacing is the existing 12/16/24px token scale. Each ordered frame retains its person, category, view, parent/child UUID, output-spec hash and verified PNG hash. Downloads use owner-scoped indexed routes, never paths supplied by form data. Loading, empty, missing identity, invalid form, BLOCKED, UNKNOWN and HOLD remain explicit text states. HOLD is a candidate, semantic review UNVERIFIED and approval NONE; production generation remains blocked and paid proof NOT_RUN.

Source, identity, history and frame reads carry independent intent versions plus the auth epoch. A replaced source clears identity, and logout revokes all workstation blob URLs and clears forms/history. New submissions require an explicit action and use one immutable UUID; uncertain transport locks further dispatch until existing server history is inspected. Reload and provider-offline history only read indexed results. The actual-client harness supplies state coverage; controlled loopback HTTP and installed Aside captures are the local verification surface, not paid-generation proof.

### Job-bound coordinate comparison and retained history

The existing comparison primitive adds `겹쳐 보기` beside Result/Original/Side by side. This is a local presentation mode, not approval or image registration. A single checkerboard stage uses max(source width, result width) by max(source height, result height), with both natural pixel extents starting at (0,0) under one uniform display scale. Never crop, independently center, stretch or realign either layer. Source stays opaque beneath the result; a labeled native 0–100 range changes result opacity, initially 50%, with visible percent and keyboard interaction. No motion is added. Reuse current spacing, type, checkerboard and controls. Natural dimensions, mismatch, full UUID and source/result SHA remain wrap-safe visible metadata. Missing or invalid captured source preserves verified result review but disables source modes. Job switch/logout revokes both layers and resets presentation.

Persisted owner history lists each UUID independently, including multiple jobs for one captured person and source-unavailable entries under all people. The selected UUID exposes aria-pressed. A separate admission-time sidecar may supply creation time; legacy entries display 시간 미확인. Known times sort descending, then UUID; unknown times sort by UUID afterward. Browsing performs no generation or evaluation write. Existing first result sealing remains a separately labeled server write, not comparison behavior.

This is the implementation contract, not a claim of completed UI. Four tasks are `review` (default), `single`, `composition`, and `queue`. Compact header contains identity, theme and connection disclosure. Semantic main order is context, session-known results, image stage, evaluation. Do not duplicate the editor, change DOM order through CSS, add a router or imply persistent result history.

| Task | Primary action | Secondary actions | Scroll owner |
|---|---|---|---|
| review | Save the bound result evaluation | Select result; Result/Original/Side by side; history and exact uncertain retry | Wide/tall bounded shell keeps stage visible; evaluation panel scrolls |
| single | Explicitly generate one validated source | Source selection/upload; conditions and source preview | Document |
| composition | Confirm and submit frozen eligible IDs once | Search/pages; select/remove; count and disabled reasons | Document |
| queue | Inspect accepted batch and select a result | Explicit refresh; cancel only pending work | Document |

At width >=1100 CSS px AND height >=700 CSS px, review has a bounded shell with an uncropped stage and scrolling evaluation panel. Otherwise every task uses document flow with list/image/evaluation anchors. CSS alone switches geometry; resize and theme preserve editor node, query, selection and drafts. On mobile comparison stacks two labeled uncropped images vertically. Images use contain and actual transparency checker; no page horizontal overflow. All controls, errors and keyboard focus remain reachable at short height and 200% actual browser zoom.

Generation selection, review identity/read intent, presentation/object URLs, and result draft/submission state have separate ownership. Shared auth epoch is the security boundary. Draft Map key is `(epoch, ownerId, jobId, pngSHA)` with full result binding equality. Each record owns editable content, exact baseline, baseRevision, latestObservedRevision and immutable saveAttempt. Dirty is exact content inequality. Read success/error/finally is guarded by originating intent; write reconciliation updates its originating record even when another result is displayed. Image replacement/revoke never deletes a draft or attempt. Same-result reselection is a no-op; identical PNGs from different jobs remain distinct.

Result/task/source/upload/generation-context replacement freezes a destination and guards dirty input with continue (default/Escape), keep draft and move, or discard draft and move. Comparison/resize/theme does not guard. Returning drafts revalidate before Save; retained baseRevision does not silently rebase. Sending/uncertain payload identity survives discard, and only explicit retry replays exact bytes. Verified history must match full binding/content, previousRevision and next revision, not merely evaluation ID. Committed baseline becomes attempted content while post-submit edits remain editable and dirty. CAS preserves notes with no automatic retry. Explicit logout has continue/discard-and-end; forced 401 clears protected Map and increases epoch immediately.

Keep the six category keys and pass/needs-change/hold aggregate contract. Enforce 2000 category and 8000 overall Unicode code points (Array.from), not native UTF-16 maxlength; needs-change requires nonblank notes. Candidate HOLD, machine NOT_RUN, approval NONE and human verdict are independent. Captured comparison uses result-first sealed evidence and owner-only historical source with exact identity/snapshot/image SHA, never the latest Wiki source.

Fixture QA uses only admitted person-1003/person-1004 with distinct RGBA sources/results, one admitted person per Wiki page and an ineligible row. Production six-person allowlist is unchanged. Max20/21, races, uncertain writes and CAS belong to the actual-client harness with mocked API, not invented HTTP admissions. Loopback proxy modes affect only captured-source/queue presentation; real generation and evaluation writes still traverse the portal. UNKNOWN proxy display alone does not prove dispatch stopping; server tests do.

Local SessionHeader shows the local session without a GitHub prerequisite. The explicit connection form uses a visibly labeled OpenAI-compatible base URL and password API-key input, with no browser persistence, autocomplete or key reflection. Explain that credentials remain only in memory in the tool running on this computer. Startup or selection never generates. Ending the local session invalidates the connection and is not upstream cancellation or UNKNOWN retry. Any retained hosted GitHub/MCP controls must be mode-specific, not mislabeled as local HTTP.

Reuse existing form, status, disabled, failure and revoked primitives without new colors, spacing or animation. Actual local bootstrap and connection fields come from the implemented backend. Boot session and exact Host/Origin/CSRF remain required. No automatic shared token, central credential service or paid QA generation. Mechanical NOT_RUN, result HOLD and human evaluation remain separate.

Documentation contract, 2026-10-13. Package: `TOOL/tools-portal`. Owned worktree: `/Users/ilseoblee/workspace/seoul-dengoku-tools-wt/portal-20261013`, branch `feat/tools-portal-20261013`, base `d5326e30d52ecf2eaac52ec5707dc70636a4a37b`. This document precedes components; it is not a claim that the portal or GitHub login has been implemented.

Ownership: frontend may edit this document and `public/index.html`, `public/portal.css`, `public/portal.mjs`. Backend owns package/configuration, server, auth, provider, storage, routes and tests. No backend or shared-package edits belong to the UI lane. The earlier `TOOL/tools/portal/DESIGN.md` is retained, not used as the current package contract: it contains stale skill-unavailability claims and speculative routes.

## 0. Research Log

- Existing system: read `TOOL/shared-web-ui/DESIGN.md`, `src/tokens.css`, `src/index.jsx`, package manifest and `TOOL/docs/Shared-Web-UI-Design-Contract.md`. These are the authoritative visual foundation.
- Embedded references: shortlist Replicate (image/output provenance), IBM (operational density), Notion (structured records). Read `taste-skill.md` and `replicate.md` in full. Preserve image-first hierarchy, separate output from execution metadata, and compact monospace diagnostics. Replicate's marketing gradient, giant type, pills and accent borders conflict with the existing system and are not adopted. Taste explicitly excludes dense operational apps: only its state, copy and dependency discipline applies here, not its marketing layouts or framework defaults.
- Read frontend router, design README, architecture, index, layout mechanics, StyleGallery, perfection README, designpowers README/routing/orchestration and lane-c-review. Operational dials: variance 3, motion 1, density 7. No React tooling applies to this framework-free client.
- StyleGallery: fetched catalog and [panel-layout contract](https://raw.githubusercontent.com/changeroa/StyleGallery/main/patterns/viewport-shell/panel-layout.md). Adopt main/utility hierarchy and intrinsic reflow, with document scroll and no internal panel scrolling. Source prose/code is not copied.
- Lazyweb: NOTRUN in this recovery lane; root explicitly requested no further broad research wait. No product screens viewed or claimed.
- Concept image generation: NOTRUN, not unavailable by inference. Root prohibits provider/image requests in this documentation lane. No concept PNG, chosen concept, visual fidelity or screenshot result is claimed.
- Backend facts: `.omo/evidence/portal-20261013/backend-inventory.json` in main checkout, read in full. Original records have no top-level `characterSheet` field.

## 1. Atmosphere & Identity

A Korean operational portrait workbench: steel navigation, warm paper, restrained rust actions, and a large unmasked checkerboard portrait. The memorable object is the actual PNG with its source and generation receipts next to it, not marketing chrome. The user journey is GitHub login, select a registered identity or upload a recognized sheet, inspect structured source data and generation conditions, explicitly generate once, then inspect the real output and mechanical verdict. Missing or unknown data remains visible as missing or unknown.

Frontend decision: native HTML/CSS and ES modules in `public/`, consuming shared CSS variables without importing React JSX. No React, Vite, Tailwind, UI package, icon package or webfont installation. Backend uses the agreed Node HTTP TypeScript service and pure source/generator APIs. Backend controls how the existing token CSS is served; frontend must not add a package dependency or alter package configuration to achieve this.

## 2. Color

Use the existing `--sui-*` tokens under one `data-sui-theme` root; the package defaults remain the authority. Do not invent a `data-sui-site="portal"` shared-package variant. Theme defaults to the existing light baseline, with the same token set supporting dark when selected.

| Role | Token | Light | Dark |
|---|---|---|---|
| Canvas | `--sui-color-canvas` | `#f7f7f4` | `#0B111C` |
| Surface | `--sui-color-surface` | `#ffffff` | `#141C2A` |
| Sunken/checker alternate | `--sui-color-surface-sunken` | `#f2f3f5` | `#0E1622` |
| Navigation | `--sui-color-nav` | `#1a1f2e` | same |
| Navigation text | `--sui-color-nav-ink-strong` | `#ffffff` | same |
| Primary text | `--sui-color-ink` | `#27313d` | `#E6EAF0` |
| Secondary text | `--sui-color-ink-secondary` | `#697586` | `#9AA6B2` |
| Neutral boundary | `--sui-color-line` | `#d9dee5` | `#2A3548` |
| Primary action | `--sui-color-accent-strong` | `#8f2d27` | `#C9A227` |
| Keyboard focus | `--sui-color-focus` | `#8f2d27` | `#C9A227` |

Primary action text uses surface in light mode and canvas in dark mode. Secondary text in light mode belongs on surface, not canvas (existing contract identifies the canvas contrast gap). On dark surface use secondary, not muted. Status is conveyed by literal text and structure, not red/green inference: mechanical `PASS`, `FAIL`, `NOTRUN`; human `HOLD` only from an explicit human record; absent/unrecognized evidence is `미확인`. No new verdict palette is needed. Selected rows use sunken wash plus visible selection text/check, never an accent edge. Only keyboard focus may use a colored ring.

## 3. Typography

Body inherits `--sui-font-body`: Pretendard, Malgun Gothic, Apple SD Gothic Neo, Noto Sans KR, sans-serif. No downloads. Hashes, identifiers, schema names and numbers use `--sui-font-mono` (ui-monospace, SFMono-Regular, Menlo, Consolas). No display serif.

| Job | Token/value | Weight | Leading |
|---|---|---|---|
| Workbench title | `--sui-type-h3` / 1.15rem | 600 | `--sui-type-h3-leading` / 1.45 |
| Main heading | `--sui-type-h2` / 1.45rem | 600 | 1.35 |
| Body and controls | `--sui-type-body` / 1rem | 400 or 600 | 1.75 |
| Compact readable metadata | local `--portal-type-meta` / .875rem | 400 | 1.5 |

The local metadata token is declared here because existing .8rem small text is below the 14px workbench readability floor. Korean text uses keep-all and anywhere wrapping; long source strings never force page overflow. Every heading is functional, one h1 per page, and labels are always visible above inputs.

## 4. Spacing & Layout

Spacing inherits `--sui-space-4/8/12/16/20/24/32/40/56/80`. Panel padding 16px, section gap 24px, field gap 8px. Local geometry tokens: `--portal-list-width: 240px`, `--portal-inspector-width: 360px`, `--portal-control-height: 44px`, `--portal-checker-size: 16px`, `--portal-type-meta: .875rem`.

At 1280px and wider: header, then a three-column grid `240px minmax(0, 1fr) 360px`: identity sidebar, dominant portrait preview, inspector. All columns use min-inline-size 0. The document owns vertical scrolling. Header may be sticky; neither inspector nor preview owns a nested vertical scroll. This follows the fetched panel-layout contract and avoids trapping keyboard users between panels. A source JSON disclosure may use bounded horizontal scrolling with an accessible region name, but never page-wide horizontal scroll.

At 768-1279px: identity selector is a disclosure above a two-column preview/inspector layout; at less than 768px: header, identity selection, preview, structured sheet, generation conditions/action, receipts, diagnostics. This is also DOM order; no CSS order or positive tabindex. A 375px viewport and 200% zoom must reflow without horizontal page scrolling. Standard 768px and 1024px repository breakpoints remain available to individual controls; the workbench's 1280px three-column threshold is an explicit local geometry choice.

Portrait frame uses intrinsic 2:3 aspect ratio, `object-fit: contain`, and the checkerboard underneath actual PNG transparency. Never crop or round the silhouette; never replace transparent output with a checkerboard baked into the file. Reserve space before image fetch to prevent layout shift. Show measured returned dimensions, not merely requested dimensions. Original and generated images are separately labeled with their real provenance.

## Local AI task contract (2026-10-24)

The local-ai task reuses native labeled controls, fieldset, DiagnosticNotice and indexed result links. Document owns scrolling; existing workstation-grid gives two columns at 768px and one below. No new visual tokens or motion. Owner context is hidden only on local-ai.

Authenticated catalog/create/get/artifact routes use the existing CSRF request helper. Only catalog-approved assets are selectable. UniMate requires a prepared rig and nonblank motion prompt; UniForge3D uses ordered multiview images and produces unrigged geometry, without a prompt. Seed is an explicit integer 0..2147483647. Missing model/license/runtime/maintenance/error reasons disable submit. Entry and selection never generate.

Submit freezes one UUID and payload. Uncertain transport preserves it and locks dispatch; explicit status lookup never POSTs. Queued/running/unknown stay locked. Results retain tool, asset, seed, UUID and artifact size/hash; technical success is not quality or release approval. Auth epoch invalidates late reads and clears forms/results. Controlled fixtures do not prove GPU or production continuity.

## 5. Components & States

Wiki API v2 adds a separate live-Wiki selector before the immutable-original registry. A native labeled select `위키 인물` displays actual server-provided ID/name options; an explicit search form queries `/tools/api/wiki/people?q=&limit=25&cursor=0`, and next-page control uses only returned nextCursor. The select change queries `/tools/api/wiki/people/:personId`; it never dispatches generation. Loading, empty, unavailable, unknown response/person, and signed-out states remain local notices. Display live HTTP source URL/hash/fetch time and detail source hashes, never substitute the six-record local registry for live Wiki. Detail token is null by contract. `generationEligibility.eligible === true` alone allows server-bound personId generation; otherwise show `생성용 참조 등록 필요` and reason. Cancel superseded Wiki search/detail requests and clear options/provenance on protected401. Prior UNKNOWN job remains locked across changing the source selection; backend also enforces OWNER_DISPATCH_UNCERTAIN. No new visual tokens are needed.

All below are native semantic primitives, documented before implementation. A state harness must exercise their states before product composition is accepted.

| Primitive | Structure / job | Required states | Accessibility / layout |
|---|---|---|---|
| SessionHeader | header, title, GitHub identity, login/logout | checking, signed-out, signed-in, unavailable | Login is an anchor to backend GitHub route; logout is a CSRF-protected action. No guest or bypass button. Cluster wraps at narrow widths. |
| CharacterSelector | label, search, list of identity selection buttons | loading, empty, selected, error | Stable person/character IDs are server inputs, not hardcoded examples; aria-pressed or equivalent selection semantics. Selection wash; 44px targets; list-detail grammar. |
| SheetView | grouped section headings and definition lists, raw-source disclosure | source-loaded, uploaded-valid, invalid, unknown/null | Show selected original detail plus token identity, facts, artProposal, authored slots, references and generationContract. Preserve source digests/status/source distinctions. Read-only fields are not fake editable controls. |
| SheetUpload | form, file input, submit, field error list | idle, validating, valid, invalid, unauthorized | Server validates recognized data. No fabricated characterSheet wrapper, lookId, faceMode or numeric seed. Preserve previous valid selection on rejection; focus error summary and link errors to fields. |
| PortraitPreview | figure, authenticated img, figcaption | empty, fetching, original, generated, decode-error | Real PNG only; alt describes selected identity and original/generated role. Intrinsic frame plus checkerboard. Invalid image is not visually substituted with an accepted original. |
| GenerationConditions | grouped definition lists or server-defined typed controls | unavailable, canonical-ready, preflight-failed | Full typed canonical lookup adapter is server-owned. Client displays server-provided schema, labels, authored values, provenance and variants; it does not guess closed-rule fields. Model diagnostic is server-reported `gpt-image-2.5-sunburst`, not an endpoint/model input. |
| GenerateAction | explicit submit and inline request state | blocked, ready, submitting, in-flight, complete, failed, outcome-unknown | Exactly one visible generation action, one in-flight job per identity enforced server-side. No dispatch on load, selection, retry timer or login. Unknown outcome cannot auto-resubmit. 44px target and disabled reason. |
| ReceiptPanel | section, labeled verdict, request/image identifiers, checks and failures | absent/NOTRUN, PASS, FAIL, unknown | Preserve schema, all failure IDs, request ID, exact image SHA and actual dimensions; mechanical verdict is not approval. A previous result remains visibly tied to its own source/request, never relabeled as the current request. |
| HumanReview | independent section | explicit HOLD, recorded decision, no record | HOLD only when server supplies explicit review evidence. Missing human evidence is 미확인, not HOLD. `ownerApprovalImplied: false` and `releaseApprovalImplied: false` remain plain visible text when supplied. |
| DiagnosticNotice | contextual paragraph, error code, next action | signed-out, loading, invalid-sheet, provider-error, unknown-state | Errors use alert, ordinary updates status; no stacked toasts or flashing synthetic progress. Codes remain selectable text; no credentials, source image bytes or raw request multipart. |

Suggested Korean copy: `GitHub으로 로그인`, `인물 선택`, `시트 불러오기`, `초상 생성`, `생성 조건`, `기계 검증`, `진단`. Signed-out: `GitHub 로그인이 필요합니다.` Invalid sheet: `시트를 적용하지 않았습니다.` Provider error: `이미지 제공자에 연결할 수 없습니다.` Unknown: `상태를 확인하지 못했습니다.` These explain real states without invented success data.

## 6. Motion & Interaction

Use shared `--sui-motion-color` (150ms ease-out) for color/background feedback only; reduced motion sets 0ms as existing tokens specify. No entry animations, ambient motion, shimmer, marketing interactions, opacity loops or animated progress. The requested operational scope needs no external motion catalog mechanism.

Async actions disable the initiating control immediately and announce their actual state. Keep focus stable during data loading. On rejected upload, retain previous valid data with an explicit non-applied message. On session expiry clear protected DOM, revoke client-owned blob URLs if any, and return to signed-out UI. Superseded selection responses must not replace the current selection. Download/output links point only to owner-authorized server file IDs.

## 7. Depth & Surface

Borders-only, matching shared UI: neutral 1px `--sui-color-line` boundaries, surface/sunken hierarchy, no shadows, glass, gradients or tinted selected borders. Radii 0, `--sui-radius-sm` 2px and `--sui-radius-md` 4px; image frame is square. No rust left stripe on section titles, even though the legacy document component uses one: the new workbench uses typography and spacing instead. Do not alter shared components to make this local choice.

## 8. Accessibility Constraints & Accepted Debt

WCAG 2.2 AA: 4.5:1 body contrast, visible focus, real labels, 44px targets, all tasks keyboard reachable, source order preserved. Provide skip link to main, Korean document language/title, readable errors, status announcements without reading entire sheets repeatedly. Test keyboard-only editor, screen-reader operator inspecting unknown facts, and low-vision/mobile operator checking PNG and all failure rows. No hidden information dependent on hover; hashes can wrap and full values remain accessible.

No user-accepted accessibility debt is recorded. Outstanding verification is NOTRUN, not accepted debt: desktop/mobile both themes, 200% zoom, long names and unbroken SHA stress, keyboard and screen-reader checks, source/receipt binding, signed-out/loading/invalid-sheet/provider-error/unknown states, and actual PNG transparency. Lane C critique follows real screenshots/interaction evidence; it has not run on this document. Perfection production-browser audits are also NOTRUN because no UI is implemented. Implementation must report real scores/evidence rather than infer them from this contract.

### Backend coordination and release boundaries

- Session and all originals/jobs/files require real GitHub auth; auth app secrets and exact callback URL are missing locally. No bypass. UI can be implemented and tested without treating simulated session fixtures as live login proof.
- Server owns exact original SQLite bytes, source/pin paths, full typed generation schema/lookup adapter, ordered reference bytes, provider address/credentials, output paths and per-user storage. Browser submits stable identity or recognized uploaded data plus an explicit action, not arbitrary paths/model/endpoint.
- Actual CLIProxy model is `gpt-image-2.5-sunburst`, server-only. Original token generationContract `gpt-image-2.5` is historical authored metadata, not the wire model. Both may be shown with unambiguous labels.
- Backend should expose session, source list/detail, recognized upload validation, canonical conditions/preflight, explicit generation, job status, owner-authorized PNG and receipt views. Exact route names/response types must come from backend implementation, not this document's speculative endpoints.
- Mechanical PASS requires actual acceptance evidence; transport success or PNG availability alone is not PASS. NOTRUN means checks were not run. Unknown provider outcome remains unknown until reconciled by the existing job, without another paid request.
- Request/receipt files may contain prompt/source image data: never put them in public static directories. No private uploads to public galleries, provider calls, deployment or commits in this design lane. Desktop SSH reset and missing OAuth configuration remain root external coordination tasks, not reasons to stop UI implementation.

### Published API contract consumed

Read owned-worktree `.omo/evidence/portal-20261013/api-contract.json`. Actual mount is `/tools/`; all APIs are `/tools/api/`. Use `status`, `auth/session`, `auth/login`, `auth/callback`, `auth/logout`, `characters`, `characters/:personId`, `sheets`, `generations`, `jobs/:id`, and `jobs/:id/image`. Login is GitHub-only. Protected 401 clears protected UI; owner mismatch 404 does not disclose another user's job. Mutations send `X-CSRF-Token`; exact Origin is browser-provided, not a client override.

Upload requires three real files: original detail JSON, authored token JSON, original RGBA PNG. Base64 their exact bytes into `detailBase64`, `tokenBase64`, `imageBase64`; do not parse/reserialize uploaded JSON before transport. Show file roles clearly, validate with server, retain returned sheetId/sourceHashes. Contract limits are 12 MiB request, 1 MiB each decoded JSON, 8 MiB image. The server returns upload identity/hashes rather than structured detail, so the client may show a safe parsed local view only after accepted upload, labeled uploaded source, preserving null/status/source fields. Parsing is presentation, not canonical derivation.

Generation sends a fresh `crypto.randomUUID()` requestId for an explicit new action, exactly one of personId/sheetId, fixed `providerModel: 'gpt-image-2.5-sunburst'`, and explicit `faceMode: {kind: 'unique', variantId: null}`. This is server-required request metadata, not inferred from missing original token fields. No face template control is offered by this contract. The synchronous POST is pending until terminal; returned job state is HOLD/FAILED/UNKNOWN. Duplicate ID yields existing job or `409 JOB_RUNNING`; never generate another ID merely to retry an unknown request.

Metric clarification: legacy `coreFraction` is core pixels divided by canvas pixels, not the foreground acceptance ratio. `canvasOpaqueFraction` is the same coverage quantity; `foregroundCoreFraction` is alpha >= 250 core divided by alpha > 0 foreground, nullable when foreground is empty. Show explicit denominator explanations and preserve returned fields. Neither quantity supplies independent full acceptance evidence; `mechanicalStatus: NOT_RUN` remains NOTRUN in the separate full-verdict panel.

Job `HOLD` and reviewStatus `HOLD` are explicit server policy records because full acceptance/profile evidence is absent, not a mechanical PASS or human approval. Metrics are numeric alpha/core/border/32px occupancy only. Render supplied metrics and immutable owner-private imageUrl; do not relabel HOLD as accepted, and do not turn metric thresholds into a full acceptance verdict. A separate full mechanical verdict remains NOTRUN until an actual independent acceptance receipt is supplied. Unrecognized job states render raw status as 미확인. The contract currently supplies no original-image route or canonical-options/preflight route: do not invent one, publish private images as static assets, or render guessed editable schema controls. Registered source view can load detail/token; generated preview uses only the returned authenticated imageUrl. Uploaded local PNG may be previewed after validation with explicit uploaded-source labeling.
