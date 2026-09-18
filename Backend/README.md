# SeoulKenshi.Coordinator

서울:전국 백엔드. 호스트 세션 기반 멀티플레이의 코디네이터·릴레이다([ADR-005](../GDD/adr/ADR-005-backend-host-session-multiplayer.md)). 상시 다중 사용자 서비스가 아니고, 게임 시뮬레이션은 호스트 클라이언트에서만 굴러간다. 서버는 세션을 짝지어 주고 메시지를 나를 뿐이다.

.NET 8 순수 ASP.NET Core([ADR-006](../GDD/adr/ADR-006-backend-aspnet-core-coordinator.md)). Kestrel 하나가 **포트 1219**에서 HTTP REST(Minimal API)와 raw WebSocket 릴레이를 같은 포트로 서비스한다. 외부 저장소와 도커 인프라는 없다. 계정과 세션은 전부 프로세스 메모리에 있고, 서버를 재시작하면 사라진다.

## 요구 사항

- .NET 8 SDK. 그게 전부다.

## 로컬 기동

```bash
dotnet run --project Backend/server/Coordinator/SeoulKenshi.Coordinator.csproj --no-launch-profile
```

띄웠는지는 health로 확인한다.

```bash
curl http://127.0.0.1:1219/health
# ok
```

포트는 `Coordinator:Port` 설정(기본 1219). 환경변수로 바꾼다: `Coordinator__Port=13000 dotnet run ...`.

## REST: 등록, 로그인, 세션

`POST /auth/register`가 vid 하나로 계정을 만든다. 응답의 `accountIdx`와 `sessionKey`(64글자 hex)가 이 계정의 전부다. `POST /auth/login`은 이 쌍이 유효한지 확인만 한다. 키는 돌아가지 않는다. 서버를 재시작하면 계정도 사라지니 다시 등록한다.

```bash
# 등록. vid는 프로세스 안에서 유일하면 된다.
curl -s -X POST http://127.0.0.1:1219/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"vid":"dev-host"}'
# → {"accountIdx":1,"sessionKey":"A1B2…64글자…","nickname":""}

# 로그인(유효성 확인)
curl -s -X POST http://127.0.0.1:1219/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"accountIdx":1,"sessionKey":"<등록 응답의 sessionKey>"}'
```

`/sessions` 하위 라우트는 `AccountIdx`·`SessionKey` 두 헤더가 인증한다.

```bash
AUTH=(-H "AccountIdx: 1" -H "SessionKey: <sessionKey>")

# 세션 만들기(호스트). 호스트는 열린 세션을 하나만 가질 수 있다.
curl -s -X POST http://127.0.0.1:1219/sessions "${AUTH[@]}"
# → {"sessionId":1,"sessionCode":"7XK2QM","hostAccountIdx":1,"maxGuests":4,
#    "createdAt":1760000000,"state":"open","rosterVersion":0,"members":[…]}

# 열린 세션 목록
curl -s http://127.0.0.1:1219/sessions "${AUTH[@]}"

# 세션 단건 조회(JSON)
curl -s http://127.0.0.1:1219/sessions/7XK2QM "${AUTH[@]}"

# 세션 닫기(호스트만). 성공은 204.
curl -i -X POST http://127.0.0.1:1219/sessions/7XK2QM/close "${AUTH[@]}"
```

오류는 ProblemDetails(`application/problem+json`)로 돌아오고 `code`로 구분한다. 1001 중복 vid, 1002 인증 실패, 4002 세션 없음, 4005 호스트 아님. 세션 코드는 혼동 글자(0·1·I·L·O·U)를 뺀 6글자다.

## WebSocket 참가(릴레이)

같은 포트, 같은 URL이다. `GET /sessions/{code}`가 WebSocket 업그레이드 요청이면 REST 응답 대신 릴레이가 시작된다.

```
ws://127.0.0.1:1219/sessions/{code}
```

신원은 헤더(`AccountIdx`·`SessionKey`)로 주거나, 헤더를 못 주는 브라우저 클라이언트는 쿼리(`accountIdx`·`sessionKey`)로 준다. 인증 실패는 업그레이드 전에 401, 없는 코드는 404로 돌아간다.

```js
// Node 22+ 전역 WebSocket 예시(게스트 참가)
const ws = new WebSocket(
  `ws://127.0.0.1:1219/sessions/${code}?accountIdx=${accountIdx}&sessionKey=${sessionKey}`);

ws.onmessage = (event) => console.log(event.data);
// 첫 프레임: {"type":"joined","sessionId":1,"sessionCode":"7XK2QM","role":1,…,"members":[…]}
// 이후: roster(로스터 변동), relay(릴레이 본문), sessionClosed(세션 마감), error

ws.send(JSON.stringify({ type: 'heartbeat' }));  // 생존 신호
ws.send(JSON.stringify({ type: 'command', requestId: 'r1', payload: { /* 게임 명령 원문 */ } }));
// command는 게스트→호스트, broadcast는 호스트→게스트 전체. role은 host 0, guest 1.
```

프레임은 전부 UTF-8 JSON 텍스트에 camelCase 필드다. 서버는 `type`·`requestId`와 `payload` 원문만 다루고 게임 의미를 읽지 않는다. 같은 계정이 다시 접속하면 낡은 연결은 `error(superseded)` 프레임과 함께 닫힌다.

## 생존 스윕

`SessionLivenessSweep`(BackgroundService)가 10초 간격으로 돈다. 하트비트가 끊긴 호스트의 세션은 호스트 타임아웃(30초) 뒤 닫히고, 접속자 전원에게 `sessionClosed`(reason `hostTimeout`)가 간다. 무응답 게스트는 로스터에서 빠지고 연결이 닫힌다. 호스트 소켓이 끊겨도 세션은 즉시 닫히지 않는다. 재접속 창이 있다.

## 프로젝트 구조

```
server/
├── Coordinator/
│   ├── Api/               # /auth, /sessions Minimal API + ProblemDetails 오류
│   ├── Identity/          # 프로세스 내 신원(vid → AccountIdx + SessionKey)
│   ├── Session/           # SessionRegistry, MultiplayerSession(로스터·하트비트)
│   ├── Relay/             # SessionRelayHub(업그레이드·수신 루프), RelayRouter(방·경로), RelayProtocol(프레임)
│   ├── CoordinatorApp.cs  # 조립기(서비스 등록·라우트)
│   ├── SessionLivenessSweep.cs
│   ├── CoordinatorOptions.cs
│   └── Program.cs         # Kestrel 1219 바인딩
└── Coordinator.Tests/     # xUnit, WebApplicationFactory 기반 통합 테스트
```

## 결정 문서

- [ADR-005 백엔드 목적: 호스트 세션 기반 멀티플레이](../GDD/adr/ADR-005-backend-host-session-multiplayer.md)
- [ADR-006 백엔드 구현: Y2K 탈피와 ASP.NET Core 코디네이터](../GDD/adr/ADR-006-backend-aspnet-core-coordinator.md)
