# BACKEND KNOWLEDGE BASE

## OVERVIEW
.NET 8 순수 ASP.NET Core 호스트 세션 코디네이터. Kestrel 하나가 **포트 1219**에서 HTTP REST(Minimal API)와 raw WebSocket 릴레이를 같은 포트로 서비스한다. 게임 시뮬레이션은 호스트 클라이언트에 있고 이 서버는 굴리지 않는다. 신원은 프로세스 안에서 발급·검증하고(AccountIdx + SessionKey 헤더), 세션은 휘발성이며, 생존 스윕 BackgroundService가 무응답 세션과 게스트를 마감한다. 외부 저장소와 도커 인프라는 없다.

## WHERE TO LOOK
| 할 일 | 위치 | 비고 |
|------|------|------|
| 로컬 기동과 REST·WS 예시 | `README.md` | 포트 1219 부트, curl·WebSocket 흐름 |
| 진입점과 포트 바인딩 | `server/Coordinator/Program.cs` | Kestrel `Coordinator:Port`(기본 1219). Testing 환경은 바인딩 생략 |
| 앱 조립과 라우트 | `server/Coordinator/CoordinatorApp.cs` | 서비스 등록, `/health`, `/auth`·`/sessions` 매핑 |
| 운영 설정값 | `server/Coordinator/CoordinatorOptions.cs` | 최대 게스트 4, 호스트·멤버 타임아웃 30초, 스윕 간격 10초 |
| 인증 엔드포인트 | `server/Coordinator/Api/AuthEndpoints.cs` | `POST /auth/register`, `POST /auth/login` |
| 세션 REST와 헤더 인증 | `server/Coordinator/Api/SessionEndpoints.cs` | `/sessions` 만들기·조회·닫기, AccountIdx/SessionKey 필터 |
| 오류 응답 코드 | `server/Coordinator/Api/CoordinatorErrorCodes.cs` | ProblemDetails `code`(1001 중복 vid, 4002 세션 없음, 4005 호스트 아님 등) |
| 신원 발급·검증 | `server/Coordinator/Identity/IdentityStore.cs` | vid → AccountIdx(1부터 단조 증가) + 64글자 hex SessionKey. 메모리 외에 없다 |
| 세션 도메인 | `server/Coordinator/Session/` | `SessionRegistry`(생성·조회·스윕), `MultiplayerSession`(로스터·하트비트) |
| 릴레이 허브와 프로토콜 | `server/Coordinator/Relay/` | `SessionRelayHub`(업그레이드 전 인증·수신 루프), `RelayRouter`(방 관리·메시지 경로), `RelayProtocol`(프레임 형태) |
| 생존 스윕 | `server/Coordinator/SessionLivenessSweep.cs` | 주기 스윕. 호스트 타임아웃 세션 마감, 무응답 게스트 퇴장 |
| 통합 테스트 | `server/Coordinator.Tests/` | xUnit + WebApplicationFactory. REST·WS 업그레이드·스윕·재접속 대체 |
| 목적과 스택 결정 | `../GDD/adr/ADR-005-backend-host-session-multiplayer.md`, `../GDD/adr/ADR-006-backend-aspnet-core-coordinator.md` | 호스트 권위·휘발 세션(005), 단일 Kestrel·스택 교체(006) |

## CONVENTIONS
- 네임스페이스는 `SeoulKenshi.Coordinator.*`다.
- 새 엔드포인트는 Minimal API + ProblemDetails로만 추가한다.
- 인증은 `AccountIdx`·`SessionKey` 두 헤더. WebSocket은 헤더 또는 `accountIdx`·`sessionKey` 쿼리로 신원을 준다(헤더를 못 주는 브라우저 클라이언트용).
- 모든 상태(계정·세션)는 프로세스 메모리에만 있다. 재시작하면 사라지는 것이 계약이지 버그가 아니다.
- 릴레이 프레임은 UTF-8 JSON 텍스트에 camelCase 필드. 서버는 `type`·`requestId`와 `payload` 원문만 다룬다.
- 연결 정리는 계정이 아니라 연결 인스턴스 기준이다. 재접속으로 대체된 낡은 소켓의 뒤늦은 Detach는 no-op이어야 산 연결을 건드리지 않는다.
- 최대 게스트 수·타임아웃·스윕 간격은 운영 설정값이다. 게임 디자인 수치를 백엔드 상수로 만들지 않는다.
- 세션 코드는 혼동 글자(0·1·I·L·O·U)를 뺀 6글자다.

## COMMANDS
저장소 루트에서. 두 명령 모두 빌드를 알아서 한다.
```bash
dotnet test Backend/server/Coordinator.Tests
dotnet run --project Backend/server/Coordinator/SeoulKenshi.Coordinator.csproj --no-launch-profile
```

## ANTI-PATTERNS
- 게임 규칙(전투·경제·정치 판정)이나 릴레이 payload의 의미를 백엔드에서 해석·실행하지 않는다. 라우팅에 필요한 필드만 읽는다.
- 세션·신원을 프로세스 밖에 영속화하지 않는다. 신원 발급·검증을 외부 계정 서비스나 공용 저장소에 위임하지 않는다.
- 템플릿 파생 스택(RPC 계약, 실시간 전용 별도 포트, 계정 메타 서비스, 도커 인프라)을 되살리지 않는다. 폐기 이력은 ADR-006과 git 이력이 가진다.
- UnityEngine 타입을 백엔드 솔루션에 끌어들이지 않는다.
- 로컬 기동 성공을 테스트 통과로 격상하지 않는다. 통과 주장은 `dotnet test` 출력으로만 한다.
