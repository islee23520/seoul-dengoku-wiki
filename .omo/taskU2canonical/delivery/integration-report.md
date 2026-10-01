# Canonical feedback UI delivery integration report

- Base merged: `95ac871e0329b67f786854bc9b4483d46201df2f` (`origin/main`).
- Confirmed local UI parent: `279f940d215285e358bdfcbffb598291e1cb8925`.
- Integrated head before evidence commit: `6aa7a37d2cb2cfcfaa173f39f240547bf1d1fcda`.
- Accepted service dependency: `11683c6792832a914603ca767aa3b77397f813f3` (separate parent-repository branch, not merged in WIKI).
- Confirmed producer dependency merged into this branch: `0eac259f4f6a1daffe7fed76fecbf54c35d2ec86`.

## Conflict decision

Fresh-main merge produced one content conflict in `src/pages/PersonDetailPage.tsx`.

Preserved incoming main:
- exported `PersonSections` used by person behavior tests;
- current GURPS sheet and parse-error UI;
- court/direct-liege relationship rows;
- both current person-art tool links;
- current person/publication fields.

Preserved canonical UI:
- document-view fetch and canonical producer identities;
- `FeedbackSurface`, feedback composer, section markers and biography surface;
- honest non-feedback rendering when a canonical view is unavailable.

A first merge resolution left `PersonDetailContent` without feedback props. `test:person-details` found the real `ReferenceError`; the integrated fix passes feedback state/ref/bound callback from `PersonDetailPage` and keeps optional defaults for direct server-render tests.

## Integrated gates

Passed, serial after one generation:
- canonical UI affected suite: 23/23;
- canonical private producer/service suite: 12/12 with `FEEDBACK_SERVICE_ROOT` set to accepted endpoint service;
- person details: 31/31;
- catalog admission: 9/9;
- contract: PASS, 61 documents;
- artifact allowlist: 3/3;
- people index: 9/9;
- TypeScript build and production Vite build.

Known current-main failures, not changed or weakened:
- `test:gate`: 33/34; current Martial-Paths source no longer contains the legacy eight-school table expected by the test.
- `test:gurps`: 52/58; current committed GURPS outputs/source quotations and minimum-CP assertions disagree with current source data. Full raw output is retained.

The initial parallel run is retained because concurrent generator/test commands raced over ignored generated outputs and caused transient renderer/admission/catalog failures. The required serial rerun is authoritative and green for those suites.

## Preservation

- `git diff --name-only origin/main..HEAD -- lore data public` is empty.
- All 1,019 tracked `public/person-details` files remain present.
- No private bulk catalog appears in `dist`.
- No browser Markdown projector or invented source identity was reintroduced.
- No source/canon/GURPS content was edited in this delivery.
