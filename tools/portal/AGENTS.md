# TOOLS PORTAL

Local-first Node >=24 TypeScript service (`seoul-dengoku-tools-portal`, private; bins `ssstool` / `tools-portal` / `tools-portal-mcp`) serving job, batch, evaluation and reference workflows at `http://127.0.0.1:18765/tools/`. Created at score 15 (re-scored 13, 2026-10-20): 36 of 43 `test/*.test.ts` files import `../src` directly, `src/server.ts` is a 3349-line hotspot, own install/native stack.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| HTTP routes / API surface | `src/server.ts` | 3349 lines; every `/tools/api/*` handler |
| Env/config validation | `src/config.ts` | Zod: `PORTAL_MODE`, network, storage rules |
| CLI entry | `src/cli.ts` -> `dist/cli.mjs` | `ssstool` |
| MCP entry | `src/mcp-server.ts` -> `dist/mcp.mjs` | |
| Providers | `src/provider.ts`, `src/comfyui-*.ts` | OpenAI-compatible loopback + ComfyUI workbench (second, parallel provider) |
| Domain workflows | `src/references.ts`, `src/batches.ts`, `src/evaluations.ts` | |
| Native Windows host | `install/native-service-host.cs` (1754 lines), `install/NATIVE-WINDOWS.md` | SCM service, restricted token/private desktop, attestor, pinned SHA-256 hashes |
| Wiki relay | `install/wiki-relay.mjs` | Auto-started loopback relay on 127.0.0.1:18791 |
| Tests | `test/*.test.ts` | `bun test`; 36 of 43 files import `../src` directly |
| Frontend | `DESIGN.md`, `public/` | Frontend-owned; NOT backend-owned |

## CONVENTIONS
- Install with npm, never Bun: `npm install --prefix TOOL/tools-portal --ignore-scripts`, then `npm install --prefix TOOL/avatar-gen/portrait/generator --ignore-scripts --package-lock=false` and `npm install --prefix TOOL/tools/people-cli --ignore-scripts --package-lock=false`. Bun install misresolves the generator's nested `file:` dependency.
- The server imports canonical pure TypeScript APIs from the linked `file:` packages (`portrait-generator-preflight`, `people-originals`); it does not shell out to their CLIs.
- Default `PORTAL_MODE=local`: binds 127.0.0.1:18765, basePath `/tools`, no OAuth. `GET /tools/api/auth/session` bootstraps local owner 1; every mutation requires the exact local Origin plus `X-CSRF-Token`; restart invalidates all sessions.
- Storage defaults to the native user home `~/.seoul-dengoku-tools/portal`; `PORTAL_STORAGE_PATH` overrides.
- Provider connections are explicit `{baseUrl,apiKey}` input: loopback HTTP or explicitly selected HTTPS only, no embedded credentials/query/fragment, no redirects; the key stays in server memory and is cleared on revocation.
- LAN opt-in: `PORTAL_NETWORK_ACCESS=true` + `PORTAL_HOST` accepting only one owned RFC1918 or Tailscale 100.64/10 IPv4; mDNS (`PORTAL_MDNS=true`, `PORTAL_LOCAL_HOSTNAME`) requires macOS `/usr/bin/dns-sd` and fails `MDNS_PLATFORM_UNSUPPORTED` elsewhere.
- Build is `npm --prefix TOOL/tools-portal run build` (the script runs `bun run src/build.ts`; Bun.build -> `dist/server.mjs`, `dist/cli.mjs`, `dist/mcp.mjs`, release tarball); it copies `tokens.css` from `TOOL/shared-web-ui/src/tokens.css` (the source tree, not dist).

## ANTI-PATTERNS
- Never run `bun install` in this package.
- Never write the provider `apiKey` into responses, logs, or stored artifacts; ambient OpenAI/CLI-proxy tokens never grant dispatch authority.
- Never bind `0.0.0.0`, public IPs, or IPv6; forwarded headers grant no authority; `.local` mDNS does not cross Tailscale.
- Incomplete or uncertain dispatch results are `UNKNOWN`; do not round them to success.
- ComfyUI drafts are not GPT evidence (see `DESIGN.md`).
- Native Windows production staging/activation requires the reviewed migration, exact SHA-256 launcher/artifact pins, and fences from `install/NATIVE-WINDOWS.md`; never reuse an activation, mix synthetic and production permits, or ship unpinned artifacts.
- Do not edit `public/` or `DESIGN.md` as if they were backend-owned.

## COMMANDS
```bash
npm install --prefix TOOL/tools-portal --ignore-scripts
npm install --prefix TOOL/avatar-gen/portrait/generator --ignore-scripts --package-lock=false
npm install --prefix TOOL/tools/people-cli --ignore-scripts --package-lock=false
npm --prefix TOOL/tools-portal run typecheck && npm --prefix TOOL/tools-portal run lint && npm --prefix TOOL/tools-portal run build
npm --prefix TOOL/tools-portal test            # bun test
npm --prefix TOOL/tools-portal start           # node dist/server.mjs
PORTAL_MODE=local npm --prefix TOOL/tools-portal start   # explicit local mode
```
