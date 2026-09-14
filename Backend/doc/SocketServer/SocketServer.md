# Socket Server Template

고성능 실시간 TCP 소켓 서버 템플릿. Y2K.Core.Network를 활용한 에코 서버와 스트레스 테스트 클라이언트를 포함합니다.

## Dependencies

- `Y2K.Core.Network`
- `Y2K.Core.Util`
- `Y2K.Core.Log`
- `System.Configuration.ConfigurationManager`
- `Microsoft.Extensions.Hosting.WindowsServices`

## Architecture

```
Y2KServer (BaseServer)
  ├── Acceptor ← 클라이언트 연결 수락
  ├── Session ← 개별 연결 관리
  │     ├── RecvPipe (수신)
  │     └── SendPipe (송신)
  ├── NetworkCallback ← Connect/Close 이벤트
  └── Receiver ← IProtocolProcessor 디스패치
        ├── TestProcessor (에코)
        └── BulkEchoProcessor (벌크 에코)
```

## Server (Server.Core)

**Assembly:** Y2K.SocketServer.Core

### Key Classes

| Class | Description |
|-------|-------------|
| `Y2KServer` | BaseServer 확장. 세션 추적, 프로세서 자동 등록 (리플렉션) |
| `TestProcessor` | 소형 에코 패킷 처리 (`ProtocolType.ReqEcho`) |
| `BulkEchoProcessor` | 대형 벌크 패킷 처리. 마이크로초 단위 성능 측정 |
| `PerfStats` | 정적 성능 모니터링 (수신/송신 카운트, 처리 시간 통계) |

### Protocol Types

| Type | Code | Description |
|------|------|-------------|
| `ReqEcho` | 1 | 소형 에코 요청 (4 bytes) |
| `ReqEchoResult` | 2 | 에코 응답 |
| `ReqBulkEcho` | 3 | 벌크 에코 요청 (가변 페이로드) |
| `ReqBulkEchoResult` | 4 | 벌크 에코 응답 |

### Packet Structures

```csharp
// 소형 에코
TestPacket { int nData; }

// 벌크 에코
BulkPacket { int ClientIdx; int len; byte[] Payload; }
```

### Initialization Flow

```
Program.Main()
  → Config 싱글톤 로드
  → Y2KServer 인스턴스 생성
  → InitializeAsync("0.0.0.0", 9999, HeaderType.HEADER_221, 1024, false)
  → 3초 간격 모니터링 루프 (세션 수 + 패킷 통계 출력)
```

### Performance Monitoring

`PerfStats`가 실시간으로 수집하는 메트릭:
- Echo: 수신/송신 카운트
- Bulk: 수신/송신 카운트, 총 처리 시간, 최소/최대 처리 시간 (마이크로초)

## Test Client (TestClient.Core)

**Assembly:** Y2K.TestClient.Core

### Key Classes

| Class | Description |
|-------|-------------|
| `DummyClient` | BaseClient 확장. 자동 에코/벌크 패킷 송신 루프 |
| `ClientStats` | 정적 카운터 (송신/수신 집계) |

### Usage

```bash
# 기본 (클라이언트 1개)
dotnet run

# 클라이언트 100개, 60초 테스트
dotnet run -- 100 60
```

### Test Behavior

- 매 1초: 소형 에코 패킷 전송
- 매 3초: ~1KB 벌크 패킷 추가 전송 (960 bytes 랜덤 페이로드)
- 클라이언트 생성 속도: 100개/500ms (Accept 큐 포화 방지)
- 테스트 종료 시 전체 송수신 통계 + 손실률 출력

### Performance Results

- **1,000 클라이언트 x 60초**
- **87,000 패킷 처리**
- **손실률 0%**
