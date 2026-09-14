# SeoulKenshi.Server

This is the seoul-kenshi backend, derived from the private `islee23520/dotnet-server-template` (WCF / CoreWCF HTTP template).

.NET 8 game server — CoreWCF JSON HTTP RPC (template TCP socket tree is not included).

## Overview

SeoulKenshi.Server uses the [Y2K Core](https://github.com/raminer/Y2K) framework as a game-server starting point. The usable source lives under `server/` (renamed from `Template.*` to `SeoulKenshi.*`).

## Templates

| Template | Description | Protocol |
|----------|-------------|----------|
| [Socket Server](docs/SocketServer.md) | 고성능 실시간 TCP 소켓 서버 | 바이너리 패킷 |
| [WCF HTTP Server](docs/WcfServer.md) | CoreWCF 기반 JSON HTTP RPC 서버 | JSON over HTTP |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Game Clients                    │
└───────────┬─────────────────────┬───────────────┘
            │ TCP (Binary)        │ HTTP (JSON)
            ▼                     ▼
┌───────────────────┐  ┌─────────────────────────┐
│   Socket Server   │  │    WCF HTTP Server       │
│  (실시간 액션)     │  │  (계정/로비/랭킹/시즌)    │
└───────┬───────────┘  └──────────┬──────────────┘
        │                         │
        └────────┬────────────────┘
                 ▼
┌─────────────────────────────────────────────────┐
│              Y2K Core Framework                  │
│  Network │ Web │ DataBase │ Cache │ Util │ Log   │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      ┌───────┐  ┌────────┐  ┌───────┐
      │ MySQL │  │ Redis  │  │ Spec  │
      │GameDB │  │ Cache  │  │  DB   │
      └───────┘  └────────┘  └───────┘
```

## WCF Server Project Structure

```
server/
├── Common/         # 공용 타입, Enum, 유틸리티
├── Protocols/      # WCF 패킷 정의 (Request/Response)
├── LogObject/      # 구조화된 게임 이벤트 로깅
├── Spec/           # 게임 밸런스 데이터 (스펙 DB)
├── DB/             # 데이터베이스 레이어 (Global/Game/Common DB)
├── Cache/          # Redis 캐시 래퍼
├── Contents/       # 게임 콘텐츠 (Account, Inventory, Goods)
├── Ranking/        # 랭킹 시스템 (Redis Sorted Set)
├── Season/         # 시즌 시스템 (자동 시즌 전환)
├── Reward/         # 보상 시스템
├── Storage/        # 통합 데이터 접근 레이어 (Cache-first / DB)
└── GameServer/     # 메인 HTTP 서버 (CoreWCF + Kestrel)
```

## Socket Server Project Structure

```
socket_server/.net.core/
├── Server.Core/       # TCP 서버 (에코 + 벌크 패킷 테스트)
└── TestClient.Core/   # 스트레스 테스트 클라이언트
```

## Requirements

- .NET 8.0 SDK
- Docker (local MySQL 8 + Redis 7)
- MySQL (GameDB, SpecDB, GlobalDB, CommonDB)
- Redis

## Local boot (macOS)

GameServer listens on **port 1219** (`GameServer.GamePort` in `server/GameServer/appsettings.json`). Auth routes are CoreWCF WebHttp under `/Auth`.

```bash
cd Backend/docker
docker compose up -d

cd ../server
dotnet run --project GameServer/GameServer.csproj -c Debug --no-launch-profile
```

Auth curl (headers `TimeStamp` and `SessionKey` are required by `AbstractService`):

```bash
# Register
curl -i -X POST http://127.0.0.1:1219/Auth/Register \
  -H 'Content-Type: application/json' \
  -H 'TimeStamp: 1' \
  -d '{"VID":"dev-user-1","VenderType":0,"DeviceModel":"mac","StoreType":0,"Region":"LOCAL","Version":"0.0.1"}'

# Login (SessionKey from Register JSON)
curl -i -X POST http://127.0.0.1:1219/Auth/Login \
  -H 'Content-Type: application/json' \
  -H 'TimeStamp: 2' \
  -H 'SessionKey: <session>' \
  -d '{"AccountIdx":1,"Version":"0.0.1"}'
```

Docker mapping: `sk-backend-mysql` 13306→3306 (root / `sk1234!`), `sk-backend-redis` 16379→6379. Schema is applied from `docker/init/01-schema.sql` on first MySQL start.

## Y2K Core Dependencies

| Y2K Module | Socket Server | WCF Server |
|------------|:---:|:---:|
| Y2K.Core.Network | O | - |
| Y2K.Core.Web | - | O |
| Y2K.Core.DataBase | - | O |
| Y2K.Core.Cache | - | O |
| Y2K.Core.Util | O | O |
| Y2K.Core.Log | O | O |

## Key Design Patterns

- **Singleton** — Config, DBConfig, RedisCacheManager, RankingProvider, SeasonProvider
- **Abstract Factory** — SeasonProvider, BaseSeasonProcessor, RankingOperator (게임별 서브클래스)
- **Strategy** — IDataStorage (Cache vs DB 전략), ICreateData
- **Observer** — SeasonNotificator.ChangeSeasonNotice (시즌 전환 이벤트)
- **Pre/Post Processor** — AbstractService의 요청 전처리/후처리 (버전 검증, 중복 패킷 방지)
