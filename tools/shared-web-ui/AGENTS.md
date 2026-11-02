# SHARED WEB UI

`@seoul-dengoku/shared-web-ui` (v0.1.2): peer-React component library implementing `../../../seoul-dengoku-tools/TOOL/docs/Shared-Web-UI-Design-Contract.md` - the shared hub/WIKI/GDD design system. Created 2026-10-22 at score 13: 16 named exports, own vitest project, own build, and a versioned artifact contract consumed by hub, GDD viewer and WIKI.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Components + tokens | `src/index.jsx` | 16 exports: `suiTokens`, `SiteShell`, `PageHeader`, `SectionHeading`, `ServiceCard`, `ServiceTile`, `Chip`, `ChipRow`, `CategoryTree`, `Breadcrumbs`, `TableOfContents`, `TableViewport`, `DocumentList`, `DocumentListRow`, `QueryControl`, `StateNotice` |
| Type surface | `src/index.d.ts` | `DocumentLink`, `Category`; `suiTokens.bp = {sm: 640, md: 768, lg: 1024}` |
| Design tokens / styles | `src/tokens.css`, `src/styles.css` | `--sui-*` custom properties; `sui-` class prefix |
| Design contract | `../../../seoul-dengoku-tools/TOOL/docs/Shared-Web-UI-Design-Contract.md` | Authoritative versioned contract |
| Tests | `test/components.test.mjs` | `renderToStaticMarkup` over built `dist/index.js`; pins the export set and breakpoints |
| Release artifact | `seoul-dengoku-shared-web-ui-<version>.tgz` | Version-pinned tarball consumers vendor |

## CONVENTIONS
- Peer React only (`^18.3.1 || ^19.0.0`); zero runtime dependencies; `react` is external in the bundle. `sideEffects` covers only `dist/tokens.css` and `dist/styles.css`.
- `npm test` builds first (`bun build ./src/index.jsx --target browser --external react --outdir dist` plus copies of `styles.css`, `tokens.css`, `index.d.ts`); tests then import `../dist/index.js`, never `src/`.
- Theming is attribute-driven: `data-sui-theme="light|dark"` and `data-sui-site="hub|wiki|gdd"`; breakpoints come from `suiTokens.bp`, not CSS media-query guesses.
- Own vitest project name `shared-web-ui` (`vitest.config.mjs`: `pool: 'forks'`, serial files), also wired into `TOOL/vitest.config.mjs`.
- Consumers (hub deploy, GDD viewer, WIKI) pin versioned `dist` artifacts from the release tarball; `TOOL/tools-portal`'s build instead copies `tokens.css` from this source tree.

## ANTI-PATTERNS
- No site-specific chrome, content, or fetching here; site variance comes only from `data-sui-site`.
- Do not add runtime dependencies or let React into `dist/`.
- Do not hand-edit `dist/`; rebuild via `npm --prefix TOOL/shared-web-ui run build`.
- Do not break consumers by changing exports outside a new reviewed, tagged release (bump the tarball).

## COMMANDS
```bash
npm ci --prefix TOOL/shared-web-ui
npm --prefix TOOL/shared-web-ui run build        # bun build src/index.jsx -> dist/ + css/d.ts copies
npm --prefix TOOL/shared-web-ui run typecheck    # tsc --noEmit
npm --prefix TOOL/shared-web-ui test             # build first, then vitest run
```
