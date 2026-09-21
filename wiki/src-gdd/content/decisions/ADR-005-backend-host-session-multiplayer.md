- 상태: 수용됨 (소유자 방향 확정 2026-09-18; 전송·신원·저장 조항은 [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator)으로 대체)
- 선행: ADR-004 (루트 7도메인 — `Backend/` 루트 유지), [온라인 유저 여정](/design/Online-User-Journey) (본 ADR로 온라인 전제 갱신)
- 후속: [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator) (백엔드 구현 Y2K 탈피 — 결정 4·5·6, 규칙 2 저장 예외, 파급 포트·인프라 명세를 대체)

## 배경

Backend는 사내 dotnet-server-template 파생 .NET 8 CoreWCF JSON HTTP 서버로, Auth·Hero·Lobby·Station·Social의 계정 중심 소셜 SNG 형태로 시작했다(2026-09-14, 로컬 개발·미배포). 동시에 게임 코어는 결정론 시뮬레이션 — 명령 기록 + 틱 + 상태 해시, 목적별 RNG 분리, RequestId 멱등 영수증 — 으로 이미 구현돼 있어, 상태 동기화 없이 명령만 주고받는 호스트 권위 모델과 정확히 맞물린다.

온라인 유저 여정이 남긴 GAP(월드 생성·참가 방식, 틱 권위, 넷코드, 계정 서버) 중 소유자가 2026-09-18 백엔드의 목적을 확정했다: **다중 사용자가 접속하는 상시 서비스가 아니라, 호스트가 멀티플레이 옵션을 켰을 때 동작하는 세션 기반 멀티플레이.**

## 결정

1. Backend는 상시 다중 사용자 중앙 서비스가 아니라 **호스트 세션 코디네이터·릴레이**다.
2. **호스트가 권위다.** 결정론 시뮬레이션은 호스트 클라이언트에서만 굴러간다. 백엔드는 게임 명령의 의미를 해석하거나 실행하지 않고, 라우팅에 필요한 필드만 읽는다.
3. **세션은 휘발성이다.** 호스트가 멀티플레이 옵션을 켜면 세션이 열리고, 호스트가 끄거나 끊기면 세션이 닫힌다. 호스트 마이그레이션, 세션 영속화, 매치메이킹, 친구 시스템은 하지 않는다. 월드 정본은 호스트의 로컬 저장이다(싱글 캠페인 계약 유지).
4. **신원은 기존 Auth를 재사용한다.** 회원가입·로그인이 만드는 AccountIdx와 SessionKey로 세션 참가자를 확인한다. *(2026-09-18 폐기, [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator)으로 대체: 기존 Auth는 삭제되고 신원은 코디네이터 프로세스 안에서 발급·검증한다.)*
5. Hero·Lobby·Station·Social 계정 서비스는 삭제하지 않고 보존하되, **세션과 무관한 계정 메타 기능**으로 둔다. *(2026-09-18 폐기, [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator)으로 대체: 계정 메타 서비스는 보존 없이 삭제한다.)*
6. **전송 분리.** 세션 생성·발견·조회·종료는 기존 CoreWCF HTTP(1219) 파이프라인을 따르고, 실시간 릴레이(게스트 명령→호스트, 호스트 사건 배치→게스트)는 별도 Kestrel WebSocket 포트(설정 `RealtimePort`, 기본 1220)로 연다. Y2K `WcfHttpServerCore`가 1219을 소유하므로 같은 포트를 쓰지 않는다. *(2026-09-18 폐기, [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator)으로 대체: Y2K·CoreWCF를 나가고 단일 Kestrel 1219에서 Minimal API + raw WebSocket으로 서비스한다. `RealtimePort` 이중 포트는 사라진다.)*

## 규칙

1. 백엔드 코드가 게임 규칙(전투·경제·정치 판정)을 포함하면 이 ADR 위반이다.
2. 세션 상태는 프로세스 메모리 외에 두지 않는다(계정·스펙은 기존 MySQL·Redis 유지). *(2026-09-18 괄호 예외 폐기, [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator): 외부 MySQL·Redis 의존을 제거해 서버의 모든 상태가 프로세스 메모리에만 남는다. 본문의 세션 상태 메모리 규칙은 유지된다.)*
3. 세션 최대 게스트 수·타임아웃은 운영 설정값이지 게임 디자인 수치가 아니다. 디자인 미결정 수치를 백엔드 상수로 만들지 않는다.
4. 유니티 클라이언트와 계약을 공유할 때 UnityEngine 타입을 백엔드에 끌어들이지 않는다(Backend/AGENTS.md 규칙 유지).

## 파급

- 온라인 유저 여정의 「권위 공유 원장」 전제는 「호스트 원장」으로 갱신되고, 틱 권위 GAP은 「호스트」로 닫힌다(같은 변경 묶음으로 반영).
- Unity 클라이언트 네트워크 통합(Foundation 드라이버·어댑터)은 현재 ToDo 모듈(POC 코어 루프) 이후의 별도 모듈이며 이 ADR 범위 밖이다.
- 서버 실행 시 1219(HTTP)와 1220(WebSocket) 두 포트가 열린다. 도커 인프라(MySQL 13306·Redis 16379) 변화는 없다. *(2026-09-18 폐기, [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator): 실행 포트는 Kestrel 1219 하나로 줄고 도커 MySQL·Redis 인프라는 제거된다.)*
