# WCF HTTP Server Template

CoreWCF 기반 JSON HTTP RPC 게임 서버 템플릿.
계정 관리, 인벤토리, 랭킹, 시즌, 보상 시스템을 포함한 풀스택 게임 서버 구조를 제공합니다.

## Dependencies

- `Y2K.Core.Web`, `Y2K.Core.DataBase`, `Y2K.Core.Cache`, `Y2K.Core.Util`
- `CoreWCF.Http` 1.8.0, `CoreWCF.WebHttp` 1.8.0
- `Dapper`, `MySqlConnector`
- `StackExchange.Redis`
- `log4net`

## Project Dependency Graph

```
Y2K.Core (Util, Web, DataBase, Cache)
    ↓
Common
    ↓
├── Protocols
├── LogObject
├── Spec ──→ Core.DataBase + Dapper
├── DB ──→ Core.DataBase + Dapper + MySqlConnector
├── Cache ──→ Core.Cache + StackExchange.Redis
├── Contents ──→ DB + Spec + Common
├── Ranking ──→ Cache + Common
├── Season ──→ Cache + Common
├── Reward ──→ Contents + DB + Spec + Storage
├── Storage ──→ Cache + Contents + DB
└── GameServer ──→ All above + CoreWCF
```

## Modules

### Common (Template.Common)

공용 타입, Enum, 유틸리티.

| Class | Description |
|-------|-------------|
| `GlobalRandom` | Y2K.Core.Util.RandomNumber 위임 |
| `EventDateTime` | 이벤트 스케줄링 (날짜 범위 + 요일) |
| `ISpecCache` | 스펙 데이터 인터페이스 |
| `IAfterLoadInitializer<T>` | 역직렬화 후 초기화 인터페이스 |
| `AppID` | 벤더별 앱 ID 매핑 (Apple/Google/Dev) |

**주요 Enum:** `StoreType`, `VenderType`, `GoodsType`, `RewardType`, `InventoryType`, `Grade`

### Protocols (Template.Protocols)

WCF 패킷 정의.

| Class | Description |
|-------|-------------|
| `BaseWebPacket` | AccountIdx 기반 요청 (JSON 직렬화) |
| `BaseWebPacketResult` | ErrorCode + Message 응답 |
| `BaseWebPacketForVID` | VID + VenderType 요청 (로그인 전) |

**패킷 패밀리:** Auth, Front, Hero, Lobby, GMS

### DB (Template.DB)

데이터베이스 레이어. 멀티 샤드 지원.

| Class | Description |
|-------|-------------|
| `DBConfig` | 싱글톤 커넥션 스트링 매니저. GlobalDB에서 모든 DB 정보 로드 |
| `GlobalDBConnector` | 중앙 DB (다른 DB 메타데이터 관리) |
| `GameDBConnector` | 게임 샤드별 DB (Account, Hero, Cash, Gold, Energy) |
| `CommonDBConnector` | 공용 DB (금칙어 등) |

**DB 구조:**
- **GlobalDB** — 전체 DB 커넥션 정보, 인증 메타데이터
- **GameDB** — 샤드별 플레이어 데이터 (샤드 인덱스 0~N)
- **SpecDB** — 게임 밸런스 데이터 (Dapper ORM)
- **CommonDB** — 공용 데이터

### Spec (Template.Spec)

게임 밸런스 데이터. DB에서 Lazy 로드 후 SpecConfig 싱글톤에 캐싱.

### Cache (Template.Cache)

Redis 캐시 래퍼.

| Class | Description |
|-------|-------------|
| `RedisCacheManager` | 싱글톤. 3종 캐시 클라이언트 팩토리 관리 |

**Redis DB 구성:**
| DB | Type | 용도 |
|----|------|------|
| 0 | SystemCache | 시퀀스, 타임스탬프, 스펙 |
| 1 | UserCache | 계정/인벤토리 JSON |
| 2 | RankingCache | 리더보드 Sorted Set |

### Contents (Template.Contents)

게임 콘텐츠 엔티티.

| Class | Description |
|-------|-------------|
| `Account` | 메인 플레이어 데이터 (레벨, 경험치, 등급, 세션 등) |
| `Hero` | 영웅 엔티티 |
| `GoodsBag` | 재화 컨테이너 (Gold, Cash, Mileage) |
| `EnergyBag` | 에너지 컨테이너 (Stamina, PVP) |
| `IInventory` | 인벤토리 공통 인터페이스 (MaxSlotCount, Count, IsEnoughSlot) |
| `HeroInventory` | 영웅 인벤토리 (IInventory 구현) |
| `EquipmentInventory` | 장비 인벤토리 (IInventory 구현) |
| `ItemInventory` | 아이템 인벤토리 (IInventory 구현) |

### Ranking (Template.Contents.Ranking)

Redis Sorted Set 기반 랭킹 시스템.

| Class | Description |
|-------|-------------|
| `RankingProvider` | 싱글톤 진입점. `RegisterOperator()` / `SetScore()` / `GetRank()` / `GetRanking()` |
| `RankingOperator` | Abstract. 게임별 랭킹 로직 서브클래스 (PvP, Duel 등) |
| `BaseRanking` | 결과 DTO (Rank, Score, 백분위 계산) |
| `UserRanking` | 리더보드 표시용 (AccountIdx, Nickname, Level) |

**특징:**
- 시즌별 독립 Sorted Set
- 백분위 계산 (`CalculateRankingPerMega()`, `CalculateRankingPer()`)
- 동점 처리를 위한 복합 점수 인코딩
- DB → Redis 시즌 초기 업로드 (`InitUploadRanking()`)

### Season (Template.Contents.Season)

시즌 라이프사이클 자동 관리.

| Class | Description |
|-------|-------------|
| `SeasonProvider` | Abstract 싱글톤. 시즌 상태 관리 + 프로세서 실행 |
| `BaseSeason` | 시즌 상태 (Num, WeeklyNum, StartTime, EndTime, IsCalculated) |
| `BaseSeasonProcessor` | Abstract. 시즌 전환 자동화 (`Do()` → `CalculateSeason()` → `RedisInit()`) |
| `SeasonMasterData` | 시즌 설정 (주기, 주차 수, 정산 시간) |
| `SeasonNotificator` | 시즌 전환 이벤트 (`ChangeSeasonNotice`) |

**시즌 흐름 예시:**
```
MasterData: WeeklyTimePerMin=10080 (7일), MaxWeeklyCount=4

시즌1 1주차 → 시즌1 2주차 → ... → 시즌1 4주차 → 정산 → 시즌2 1주차
```

### Storage (Template.Storage)

통합 데이터 접근 레이어. Cache-first 또는 DB-first 전략.

| Class | Description |
|-------|-------------|
| `IDataStorage` | 데이터 저장소 인터페이스 (`StorageType`, `GetData()`) |
| `ICreateData` | 신규 유저 데이터 생성 인터페이스 |
| `UserDataType` | Flags Enum (Account, GoodsBag, HeroInventory 등) |
| `StorageParameter` | 조회 파라미터 베이스 |
| `CreateUserDataParameter` | 신규 유저 생성 파라미터 (기본 슬롯 수 포함) |

### Reward (Template.Contents.Reward)

보상 시스템. RewardType별 보상 생성 및 적용 로직.

### GameServer (Template.GameServer)

메인 HTTP 서버. CoreWCF + Kestrel.

| Class | Description |
|-------|-------------|
| `Config` | 서버 설정 싱글톤 (버전, IP, 금칙어, ACL) |
| `GameServerSettings` | appsettings.json POCO (Region, GamePort, AcceptIP 등) |
| `AbstractService` | WCF 서비스 베이스. 전처리/후처리 (버전 검증, 중복 패킷 방지) |

**서비스 엔드포인트:**
| Service | Endpoint | Description |
|---------|----------|-------------|
| Auth | `/Auth/*` | 로그인, 닉네임 생성 |
| Front | `/Front/*` | 헬스체크, 버전체크, KeepAlive |
| Lobby | `/Lobby/*` | 로비 진입, 데이터 로드 |
| Hero | `/Hero/*` | 영웅 관련 작업 |
| GMS | `/GMS/*` | 관리자 명령 (캐시 만료 등) |

## HTTP Request/Response Flow

```
Client POST /Auth/Login
Body: { "VID": "...", "VenderType": 1, "Version": "1.0.0" }
  ↓
CoreWCF 라우팅 → LoginProcessor
  ↓
AbstractService.PreProcess()
  → IP 추출, 버전 검증 (Height/Middle 일치 필수, Low 허용)
  → 중복 패킷 감지 (Redis 타임스탬프)
  → AuthInfo 조회 (캐시 or 신규)
  ↓
LoginProcessor 비즈니스 로직
  → Account 조회/생성 → 세션키 발급 → Redis 캐싱
  ↓
Response: { "AccountIdx": 12345, "SessionKey": "...", "ErrorCode": 0 }
```

## Configuration

### appsettings.json

```json
{
  "GameServerSettings": {
    "Region": "LOCAL",
    "GamePort": 8080,
    "IsWritePacketTraceLog": true,
    "CheckIgnoreWordTimeSecond": 3600,
    "AcceptIP": ["127.0.0.1", "::1"]
  },
  "ConnectionStrings": {
    "GlobalDB": "Server=...;Database=...;User=...;Password=...",
    "Redis": "localhost:6379,defaultDatabase=0"
  }
}
```

환경별 오버라이드: `appsettings.QA.json`, `appsettings.Live.json`

## Server Initialization

```
Program.Main()
  → appsettings.json 로드 (Region별)
  → Config.Instance.Init(settings)
    → DBConfig.Instance.Init(globalDBString)
      → GlobalDB에서 전체 DB 커넥션 정보 로드
      → GameDB 커넥터 풀 사전 워밍
    → SpecConfig.Instance.Init() (스펙 로드)
  → RedisCacheManager.Instance.Init(redisUri)
  → CoreWCF 서비스 등록 (Auth, Front, GMS, Lobby, Hero)
  → HTTP 리스닝 시작
```
