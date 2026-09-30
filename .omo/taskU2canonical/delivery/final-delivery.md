# Canonical feedback UI PR delivery

## Integrated tuple

- PR base: `origin/main` at `95ac871e0329b67f786854bc9b4483d46201df2f`.
- Confirmed U2 parent: `279f940d215285e358bdfcbffb598291e1cb8925`.
- Accepted service dependency: `11683c6792832a914603ca767aa3b77397f813f3` in the separate parent repository/service branch; not part of this WIKI PR.
- Confirmed producer: `0eac259f4f6a1daffe7fed76fecbf54c35d2ec86`, merged into this WIKI branch.
- Integrated source head before this evidence commit: `6aa7a37d2cb2cfcfaa173f39f240547bf1d1fcda`.

## Fresh-main conflict

One real conflict occurred in `src/pages/PersonDetailPage.tsx`.

Resolution preserved:
- incoming `PersonSections` export and current test surface;
- person GURPS parse/error behavior;
- direct-liege/court relationship rows;
- both incoming person-art links;
- canonical endpoint view, structural feedback markers, biography selection and composer.

The first resolution exposed a real `PersonDetailContent` missing-props failure. The next focused commit passes feedback state/ref/bound callback from the route component and retains optional defaults for direct server-render tests. The person suite is now 31/31.

## Integrated validation

Serial, after one generation:

- canonical UI/renderer affected suite: 23/23;
- private producer + accepted endpoint suite: 12/12;
- person detail suite: 31/31;
- catalog admission: 9/9;
- contract: PASS, 61 documents;
- artifact allowlist: 3/3;
- people index: 9/9;
- TypeScript: PASS;
- production build: PASS.

The first parallel wave raced multiple generator/test commands over ignored generated files. Its transient renderer/admission/catalog failures are retained in raw logs and superseded by the serial runs.

## Current-main failures outside this PR

Not skipped or weakened:

- `test:gate`: 33/34. The current source lacks the legacy eight-school table expected by `scripts/test-gate.mjs`.
- `test:gurps`: 52/58. Current committed GURPS outputs, source quotation checks, minimum CP, and named skill expectations disagree with the current source data. Full raw output is retained.

This PR does not edit martial canon, GURPS data, their tests, or generated sheets.

## Source preservation

- `git diff --name-only origin/main..HEAD -- lore data public` is empty.
- All 1,019 tracked `public/person-details` files remain.
- No private bulk catalog is shipped in `dist`.
- No local Markdown/entity projector or invented source IDs are introduced.

## Fresh native Aside composite check

The integrated person page rendered:
- exact heading `이일섭`;
- all 28 producer canonical leaf identities including `biography:인물-이일섭-list2:item:5`;
- feedback selection action;
- both incoming person-art links;
- readable biography and contributor link.

The Aside agent could not establish a fresh native Selection on the linked text in that run; it retained an unrelated selection and honestly produced the choose-text error. Therefore the delivery does not claim a fresh post-merge composer capture from this run. The exact canonical inline-link capture was independently confirmed before the fresh-main merge, and the integrated production DOM/binder behavior is covered by the real person fixture and the 31-person suite. Screenshot and JSON preserve the fresh composite boundary.

No real OAuth/provider, hosted endpoint, deployment, or full U2/U3 acceptance is claimed.
