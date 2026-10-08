# actualArchify publication

The viewer publishes pre-generated standalone actualArchify HTML. It does not
install or execute Archify, contact a network service, or accept client HTML/URLs.
The producer owns actualArchify IR, generation, provenance and detailed logic.

## Input contract

Default input: `GDD/canon/archify/generated/`. Override with
`GDD_ARCHIFY_INPUT_DIR=/absolute/local/directory` (inside Docker, use its mounted
container path). The directory contains `manifest.json` and flat HTML files:

```json
{
  "schemaVersion": 1,
  "diagrams": [
    {
      "domainId": "D01",
      "diagramId": "d01-identity",
      "moduleTitle": "인물 식별",
      "file": "d01-identity.html",
      "sha256": "the lowercase SHA-256 of the exact generated HTML bytes"
    }
  ]
}
```

The example hash describes a required value, not a usable manifest. Every key is
required and additional keys are rejected. `domainId` is D01 through D18;
`diagramId` is lower-case alphanumeric words separated by hyphens, starts with a
letter, and has at most 100 characters. `moduleTitle` is a nonempty, trimmed title
of at most 200 characters without control characters. `file` is lower-case
alphanumeric words separated by hyphens plus `.html`, at most 150 characters.
No slashes, URLs, escapes, query strings, or symlinks. Hashes are exactly 64
lowercase hexadecimal characters. Identity pairs and filenames must be unique.

HTML must be the complete UTF-8 standalone actualArchify output (beginning with
`<!doctype html>`), with scripts/styles embedded. Only registered files are
copied, byte for byte. Asset dependencies are not copied recursively. Hash
verification binds producer-selected bytes; it is not an HTML sanitizer or a
claim that the producer's diagram logic is correct. Review the producer's HTML
before registering it: full-view links open the actual document.

Keep reproducible source IR under `canon/archify/` with producer-owned generation
instructions; this integration consumes only the completed `generated` package.
It does not prescribe a replacement format for actualArchify's own IR schema.

## Canon binding

A normalized `codeFence` uses `info: "archify"` and JSON text with exactly:

```json
{"domainId":"D01","diagramId":"d01-identity","moduleTitle":"인물 식별"}
```

The title must match the registered manifest entry. There is no HTML, URL, path
or filename field in the reference. Shared content uses `kind: "code"`,
`language: "archify"`, `anchor`, and `text: {"ko": "<the same JSON string>"}`.
All provided locale references are checked. Existing normalized Markdown routes
and shared DocumentContent routes both display the same component.

## Build and gates

`npm run generate` now runs catalog generation followed by Archify preparation.
`npm run prepare:archify` reruns preparation alone. The normal invocation is:

```sh
GDD_PAGES_ROOT=/materialized-pages GDD_ARCHIFY_INPUT_DIR=/artifacts npm run build
```

The input manifest is required; an empty `diagrams` array is valid only when no
admitted canon document references a diagram. Preparation rejects mismatched
hashes, unsafe filenames, duplicate identities/files and unresolved canon
references before touching output. It writes `public/archify/` and
`src/generated/archify-manifest.json` (both ignored), replacing stale output on
success. Vite copies the static files to `dist/archify/`; viewer links use
`/gdd/archify/<file>?sha256=<hash>`. The web host must serve these as static HTML,
not rewrite them to the SPA entry page.

Automated gates (existing dependencies, local Docker, network disabled):

```sh
npm test -- scripts/test-archify.mjs scripts/test-cjk-strong.mjs
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
npm run build
```

The main integration owner then runs the complete viewer test suite and native
Aside QA on all 18 domain pages: rendered frame, lazy loading, graph controls,
36rem initial height, vertical resize, keyboard height toggle, full-view link,
readability of the detailed graph, and absence of browser errors. The iframe
allows scripts but not same-origin privileges. Theme storage may be unavailable
inside the frame; Archify's existing storage guards handle that restriction.
Browser QA and full 18-domain content verification are not replaced by SSR tests.
