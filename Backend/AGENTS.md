# BACKEND KNOWLEDGE BASE

## OVERVIEW
.NET 8 pure ASP.NET Core host-session coordinator. One Kestrel serves HTTP REST (Minimal API) and the raw WebSocket relay on **port 1219**. Game simulation lives in host clients; this server never runs it. Identity is issued and verified in-process (AccountIdx + SessionKey headers), sessions are volatile, and a liveness-sweep BackgroundService closes unresponsive sessions and guests. No external store, no Docker infrastructure.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Local boot and REST/WS examples | `README.md` | Port 1219 boot, curl and WebSocket flows |
| Entry point and port binding | `server/Coordinator/Program.cs` | Kestrel `Coordinator:Port` (default 1219); Testing environment skips binding |
| App composition and routes | `server/Coordinator/CoordinatorApp.cs` | Service registration, `/health`, `/auth` + `/sessions` mapping |
| Operational options | `server/Coordinator/CoordinatorOptions.cs` | Max guests 4, host/member timeouts 30s, sweep interval 10s |
| Auth endpoints | `server/Coordinator/Api/AuthEndpoints.cs` | `POST /auth/register`, `POST /auth/login` |
| Session REST and header auth | `server/Coordinator/Api/SessionEndpoints.cs` | `/sessions` create/list/close, AccountIdx/SessionKey filter |
| Error response codes | `server/Coordinator/Api/CoordinatorErrorCodes.cs` | ProblemDetails `code` (1001 duplicate vid, 4002 session not found, 4005 not host, ...) |
| Identity issue/verify | `server/Coordinator/Identity/IdentityStore.cs` | vid → AccountIdx (monotonic from 1) + 64-hex-char SessionKey; memory only |
| Session domain | `server/Coordinator/Session/` | `SessionRegistry` (create/lookup/sweep, `CodeAlphabet`), `MultiplayerSession` (roster, heartbeats) |
| Relay hub and protocol | `server/Coordinator/Relay/` | `SessionRelayHub` (pre-upgrade auth, receive loop), `RelayWebSocketConnection`, `RelayRouter` (rooms, routing), `RelayProtocol` (frame shape) |
| Liveness sweep | `server/Coordinator/SessionLivenessSweep.cs` | Periodic sweep; closes host-timeout sessions, removes unresponsive guests |
| Integration tests | `server/Coordinator.Tests/` | xUnit + WebApplicationFactory; REST, WS upgrade, sweep, reconnect supersession |
| Purpose and stack decisions | `../GDD/adr/ADR-005-backend-host-session-multiplayer.md`, `../GDD/adr/ADR-006-backend-aspnet-core-coordinator.md` | Host authority + volatile sessions (005), single Kestrel + stack replacement (006) |

## CONVENTIONS
- Namespace is `SeoulKenshi.Coordinator.*`.
- Add new endpoints as Minimal API + ProblemDetails only.
- Auth is the `AccountIdx` and `SessionKey` headers. WebSocket identity may arrive as headers or as `accountIdx`/`sessionKey` query params (for browser clients that cannot set headers).
- All state (accounts, sessions) lives in process memory. Vanishing on restart is the contract, not a bug.
- Relay frames are UTF-8 JSON text with camelCase fields. The server reads only `type` and `requestId` and passes `payload` through verbatim.
- Connection cleanup keys on the connection instance, not the account. A late Detach from a socket superseded by a reconnect must be a no-op so live connections stay untouched.
- Max guests, timeouts, and sweep interval are operational options. Do not turn game-design numbers into backend constants.
- Session codes are 6 chars from `23456789ABCDEFGHJKMNPQRSTVWXYZ` (0/1/I/L/O/U excluded).

## COMMANDS
From repository root; both commands build on their own.
```bash
dotnet test Backend/server/Coordinator.Tests
dotnet run --project Backend/server/Coordinator/SeoulKenshi.Coordinator.csproj --no-launch-profile
```

## ANTI-PATTERNS
- Do not interpret or execute game rules (combat, economy, politics) or relay payload semantics in the backend; read only routing-relevant fields.
- Do not persist sessions or identity outside the process; do not delegate issuance to an external account service or shared store.
- Do not revive template-derived stack (RPC contracts, a dedicated realtime port, account meta-service, Docker infrastructure). ADR-006 and git history hold the retirement record.
- Do not pull UnityEngine types into the backend solution.
- Do not promote local boot success to a test-pass claim; passing claims cite `dotnet test` output only.
