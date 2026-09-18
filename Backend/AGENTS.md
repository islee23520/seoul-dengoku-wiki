# BACKEND KNOWLEDGE BASE

## OVERVIEW
.NET 8 CoreWCF JSON HTTP game server derived from the Y2K template; score 8, distinct service/storage domain, separate from Unity's engine-free core. Purpose per ADR-005 (2026-09-18): host-session multiplayer coordinator/relay, not an always-on many-user service — the host client owns the authoritative simulation and this server only coordinates sessions and relays commands/event batches.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Backend purpose decision | `../GDD/adr/ADR-005-backend-host-session-multiplayer.md` | Host-session multiplayer, transport split, volatility rules |
| Local startup and auth examples | `README.md` | Current macOS boot section, port 1219 |
| Service lifecycle | `server/GameServer/Program.cs` | Hosted worker, initialization, timers and shutdown |
| Register HTTP endpoint families | `server/GameServer/Network/WCFService.cs` | Front, Auth, Hero, Lobby, Station, Social, Session |
| Session lifecycle and roster | `server/Contents/Session/`, `server/GameServer/Network/Session/` | MultiplayerSession, SessionRegistry, HTTP processors |
| Realtime relay hub | `server/Relay/`, `server/GameServer/Realtime/RelayHost.cs` | WebSocket relay on RealtimePort (default 1220); router, protocol, Kestrel host |
| Request preprocessing and endpoints | `server/GameServer/Network/` | Auth/session boundary and per-domain services |
| Wire request/response types | `server/Protocols/` | Match CoreWCF service contracts |
| Gameplay state | `server/Contents/Station/`, `server/Contents/Social/` | Station resources/construction and social logic (account meta, session-independent) |
| Persistence/cache boundary | `server/DB/`, `server/Storage/`, `server/Cache/` | Database, cache-first access and Redis |
| Runtime settings/spec loading | `server/GameServer/Config.cs`, `server/GameServer/appsettings.json` | Host configuration and balance data |
| Dependencies/build layout | `server/GameServer/GameServer.csproj`, `server/Y2K/` | CoreWCF 1.9.1 and referenced Y2K binaries |
| Domain tests | `server/Tests/` | .NET 8 xUnit; StationTests, SocialTests, SessionDomainTests, RelayRouterTests, SessionRelayHubIntegrationTests |
| Local database schema | `docker/docker-compose.yml`, `docker/init/01-schema.sql` | MySQL 13306, Redis 16379 |
| Template history | `doc/WcfServer/`, `doc/SocketServer/` | Historical template docs, not current endpoint authority |

## CONVENTIONS
- Namespace/assembly prefix is `SeoulKenshi`, not the template docs' `Template` prefix.
- Current server uses CoreWCF JSON HTTP RPC; inherited TCP diagrams do not establish a shipped socket service.
- Windows uses service hosting and a Windows runtime identifier; macOS/Linux use the portable console-hosted path.
- Debug/Local output is `Backend/bin/Local/`; other configurations use `Backend/bin/<Configuration>/`, without framework suffix.
- Host settings load from the output base directory, optional environment JSON, then environment variables.
- DBConfig loads the global connection configuration before Redis and spec initialization.
- `Program` owns 10-second and one-minute timers; the 10-second timer runs the relay liveness sweep; shutdown stops relay hub, timers, then the HTTP service.
- Auth examples require `TimeStamp`; subsequent authenticated requests carry the returned `SessionKey`. The WebSocket relay reuses the same AccountIdx + SessionKey via headers (or query fallback) at handshake.
- Sessions are volatile (ADR-005): host closes or goes silent (SessionHostTimeoutSeconds) and the session ends; guest silence (SessionMemberTimeoutSeconds) drops them from the roster. SessionMaxGuests/timeouts are ops values in appsettings, not game-design numbers.
- Relay protocol messages are camelCase JSON text frames (`joined`/`roster`/`relay`/`sessionClosed`/`error`, client: `heartbeat`/`command`/`broadcast`); the server never interprets `payload` game semantics.
- Docker schema initialization runs on the first MySQL volume startup, not each process restart.

## COMMANDS
From repository root; these are available entry points, not recorded passing runs.
```bash
(cd Backend/docker && docker compose up -d)
dotnet build Backend/server/SeoulKenshi.Server.sln -c Debug
dotnet test Backend/server/Tests/SeoulKenshi.Server.Tests.csproj -c Debug
dotnet run --project Backend/server/GameServer/GameServer.csproj -c Debug --no-launch-profile
```

## ANTI-PATTERNS
- Do not copy template TCP routes or outdated CoreWCF package versions from `doc/` over current source/configuration.
- Do not assume local infrastructure startup proves service or domain tests passed.
- Do not treat unfinished inventory serialization/storage TODOs as implemented persistence.
- Do not apply Unity assembly rules to the independent backend solution or couple it to UnityEngine types.
- Do not run game simulation or interpret game command payloads on this server; the host client is the authority (ADR-005).
- Do not persist multiplayer sessions or add host migration/matchmaking; sessions are volatile by decision.
