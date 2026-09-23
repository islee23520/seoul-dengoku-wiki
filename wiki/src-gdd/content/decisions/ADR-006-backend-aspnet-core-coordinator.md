- 상태: 수용됨 (소유자 방향 확정 2026-09-18; 제품 세션 수명·권위 프로세스·참가자 신원 뿌리·월드 보존은 [ADR-008](/decisions/ADR-008-local-first-steam-sessions)이 개정. ASP.NET Core·Kestrel 1219·Y2K 탈피·외부 저장소 금지는 유지)
- 선행: ADR-005 (백엔드 목적 — 호스트 세션 기반 멀티플레이. 이 ADR은 그 목적을 유지한 채 실을 기술 스택을 교체한다)
- 후속: [ADR-008](/decisions/ADR-008-local-first-steam-sessions) (제품 GDD. 이 ADR의 코디네이터 구현 기록을 폐기하지 않는다)

## 배경

ADR-005가 백엔드의 목적을 「상시 다중 사용자 서비스가 아니라 호스트 세션 코디네이터·릴레이」로 확정했지만, 실체는 여전히 Y2K 템플릿 파생 .NET 8 CoreWCF JSON HTTP 서버였다. Auth·Hero·Lobby·Station·Social 계정 메타 서비스, MySQL·Redis 저장 경계, 1219(CoreWCF HTTP)와 1220(WebSocket) 이중 포트 구성이 목적이 바뀐 뒤에도 그대로 남아 있었다.

호스트 세션 코디네이터는 계정 중심 SNG 서버의 프레임워크 부담, 템플릿 바이너리 의존, RPC 계약, 외부 저장소를 정당화하지 못한다. 소유자가 2026-09-18 Y2K 탈피를 확정했다: 서버를 순수 ASP.NET Core 단일 프로세스로 다시 쓰고, 세션 코디네이터 역할에 맞지 않는 것은 삭제한다.

## 결정

1. 서버는 **순수 ASP.NET Core(.NET 8) 단일 Kestrel이고 포트는 1219 하나**다. 세션 생성·발견·조회·종료는 Minimal API REST 엔드포인트로, 실시간 릴레이(게스트 명령→호스트, 호스트 사건 배치→게스트)는 같은 포트의 **raw WebSocket 업그레이드**(SignalR 아님)로 서비스한다. 1219/1220 이중 포트 분리와 `RealtimePort` 설정은 폐기한다.
2. **Y2K와 CoreWCF를 나간다.** Y2K Core 프레임워크 의존(`server/Y2K/`)과 CoreWCF 전송·서비스 계약을 제거한다. 템플릿 계약을 계승하는 코드는 남기지 않는다.
3. **계정 메타 서비스는 삭제한다.** Auth·Hero·Lobby·Station·Social은 보존이나 아카이브 없이 지운다. 역사는 git 이력이 가진다.
4. **신원은 프로세스 내 발급이다.** 세션 참가자 자격을 코디네이터가 직접 발급하고 직접 검증한다. 기존 Auth의 회원가입·로그인, AccountIdx·SessionKey 재사용은 폐기한다.
5. **HTTP 계약은 REST + ProblemDetails다.** 오류 응답은 `application/problem+json`을 따른다. CoreWCF JSON RPC 봉투는 계승하지 않는다.
6. **외부 저장소가 없다.** MySQL·Redis 의존과 도커 인프라(MySQL 13306·Redis 16379)를 제거한다. 서버가 가진 상태(세션·자격)는 프로세스 메모리에만 있고 재시작하면 사라진다.
7. **목적은 그대로다.** 호스트 권위(ADR-005 결정 2)와 세션 휘발성(결정 3)은 이 코디네이터 구현 기록에서 변경 없이 계승한다. 이 ADR은 백엔드의 목적을 바꾸는 게 아니라 그 목적에 맞는 그릇을 고른다. 제품 GDD의 권위 프로세스·세션 수명·신원 뿌리는 [ADR-008](/decisions/ADR-008-local-first-steam-sessions)이 개정한다.

## 규칙

1. **삭제는 삭제다.** Y2K·CoreWCF·계정 메타 코드를 아카이브 디렉터리나 별도 솔루션으로 옮겨 보존하지 않는다. 되돌릴 일이 생기면 git 이력에서 찾는다.
2. 새 엔드포인트는 Minimal API + ProblemDetails로만 추가한다. 템플릿 TCP 라우팅, RPC 스타일 계약, 커스텀 오류 봉투를 되돌리지 않는다.
3. 신원 자격의 발급·검증을 프로세스 밖 서비스나 공용 저장소에 위임하지 않는다. 외부 계정 공급자가 끼어들면 이 ADR 위반이다.
4. ADR-005의 목적 규칙(게임 규칙 금지, 운영 설정값과 디자인 수치 구분, UnityEngine 단절)은 계승되며 이 ADR이 완화하지 않는다.

## 파급

- ADR-005 결정 4(기존 Auth 재사용), 결정 5(계정 메타 보존), 결정 6(전송 분리), 규칙 2의 MySQL·Redis 저장 예외, 파급의 1219/1220 두 포트 명세는 이 ADR으로 대체된다. ADR-005의 목적 조항(결정 1·2·3)은 이 코디네이터 구현 기록에서 유효하다. 제품 세션 해석은 [ADR-008](/decisions/ADR-008-local-first-steam-sessions)을 본다.
- 서버 실행 포트는 1219 하나로 줄고 도커 인프라(MySQL 13306·Redis 16379)가 사라진다. 로컬 개발 환경 요구가 단순해진다.
- 코드 교체·삭제 인도는 이 ADR 이후 별도 구현 작업으로 진행한다. 이 문서는 결정만 기록한다.
- Backend 문서(README·AGENTS.md)와 [온라인 유저 여정](/design/Online-User-Journey)의 서술은 구현 인도 시 갱신한다.

## 폐기

- Y2K Core 프레임워크 파생 구조(`server/Y2K/`, Template→SeoulKenshi 계보)와 CoreWCF JSON HTTP 파이프라인(1219)은 이 ADR로 폐기된다.
- Auth·Hero·Lobby·Station·Social 계정 메타 서비스는 이 ADR로 삭제된다(ADR-005 결정 5의 「보존」은 무효).
- 별도 실시간 포트(기본 1220, `RealtimePort`) 전송 분리(ADR-005 결정 6)는 폐기된다.
- MySQL·Redis 저장 경계와 도커 인프라(13306·16379)는 폐기된다(ADR-005 규칙 2의 괄호 예외 포함).
