- 상태: 수용됨 (소유자 방향 확정 2026-09-22)
- 선행: [ADR-005](/decisions/ADR-005-backend-host-session-multiplayer) (호스트 세션 목적), [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator) (ASP.NET Core 코디네이터 구현 기록), [온라인 유저 여정](/design/Online-User-Journey), [같은 선택이 같은 결과가 되나](/rules/Save-and-Determinism), [전략에서 전투로](/rules/Strategy-Battle-Roundtrip)
- 대체 범위: ADR-005 결정 2·3과 ADR-006 결정 7이 제품 세션 수명·권위 프로세스·참가자 신원 뿌리·월드 보존으로 쓰는 조항. ASP.NET Core·Kestrel 1219·Y2K 탈피·외부 저장소 금지는 대체하지 않는다.
- 이 문서는 제품 GDD다. 구현 완료가 아니다.

## 배경

ADR-005는 상시 다중 사용자 중앙 서비스가 아니라 호스트가 연 세션을 전제로 했고, ADR-006은 그 전제를 프로세스 메모리 코디네이터로 실었다. 그 모델은 호스트 클라이언트에서 결정론 시뮬레이션이 돌고, 세션 자격과 세션 자체가 같이 사라지며, 월드 정본을 호스트의 로컬 저장 한 곳에 둔다. 친구 로비·전용 서버·Steam 인증·LAN 직접 접속·체크포인트 분기 정책은 비워 두었다.

소유자가 2026-09-22 제품 계약을 로컬 우선으로 확정했다. 클라우드가 월드 정본을 소유하지 않는다. 권위 있는 시뮬레이션은 클라이언트가 아니라 같은 형식의 헤드리스 서버 프로세스다. Steam은 로비·전송·권한 증거·선택적 서버 광고만 맡고 월드 상태를 소유하지 않는다. Steam 없는 LAN은 직접 전송으로 동작해야 한다.

`Backend/`의 ASP.NET Core 코디네이터는 ADR-006의 구현 기록이다. 이 기록을 제품 계약의 구현 완료로 간주하지 않는다.

## 결정

1. **제품은 로컬 우선이다.** 클라우드 우선이 아니다. Unity 클라이언트는 묶인 헤드리스 권위 서버를 별도 자식 프로세스로 띄우고, 로컬 플레이어는 localhost로 붙는다. 같은 서버 실행 파일·월드·설정 형식을 선택 설치 가능한 헤드리스 전용 서버가 쓴다.

2. **Steam Dedicated Server Tool을 별도 Tool/AppID로 무료 배포한다.** 익명 SteamCMD 설치를 목표로 하고 OS별 depot을 둔다. 실제 패키지·권한 설정은 Steamworks 파트너 확인이 필요하다. 전용 도구는 게임 소유 없이 새 월드·계보를 만들 수 있다. 실제 플레이어는 정당한 서명 클라이언트와 DRM 증명이 있어야 한다.

3. **Steamworks는 세션 보조만 한다.** 친구·임시 세션은 Steam Lobby와 초대를 쓴다. 인터넷 전송의 기본값은 Steam Networking Sockets와 Steam Datagram Relay다. Steam 인증 티켓은 플레이어 권한과 온라인 신원을 증명한다. 공개 전용 서버는 Game Server API와 서버 브라우저로 광고할 수 있다. Steam 기능은 권위 있는 월드 상태를 소유하지 않는다.

4. **Steam 없는 LAN은 직접 LAN 전송·발견으로 동작한다.** 참가자 신원의 정본 뿌리는 월드 범위 참가자 공개키와 복구 비밀이다. SteamID는 Steam 세션에 연결되는 선택 증거다. 서명 클라이언트·로컬 DRM 증명이 검증되지 않은 클라이언트는 로컬 저장과 싱글 플레이를 읽을 수 있으나, 멀티플레이를 열거나 참가하거나 체크포인트에 서명할 수 없다.

5. **검증된 체크포인트만 호스트 씨앗이 된다.** 모든 검증 체크포인트는 월드 상태, 사건 원장 위치, 진행 중 전투 체크포인트(있으면), 빌드·스키마·콘텐츠·프로토콜 판본, 계보 ID, 부모 체크포인트 해시, 참가자 바인딩, 분기 정책, 서명과 해시를 담는다. 모든 참가자는 현재 월드·원장 위치를 검증하고 자신의 아카이브·바인딩을 보존할 수 있도록 서명된 체크포인트 영수증과 투영 메타데이터를 받는다. 해당 체크포인트의 불변 분기 정책이 **허용**일 때만 호스트 가능한 완전한 월드 스냅샷을 배포·내보낸다. 분기 금지 참가자에게는 서버를 시드할 수 있을 만큼 완전한 상태를 주지 않으며, 자신의 아카이브와 인물 기록은 계속 받는다. 완전히 검증된 원자 체크포인트만 권위 서버의 호스팅 시작에 사용할 수 있다.

6. **받은 체크포인트를 호스트하면 항상 영구 독립 분기다.** 새 계보 ID와 키가 생긴다. 분기는 자동 병합하지 않는다. 참가자는 검증용 공개키를 받으며 부모 계보 서명 비밀은 받지 않는다. 같은 계보를 이어갈 수 있는 주체는 원래 계보 키 보유자뿐이다. 잃은 계보 비밀은 암호화된 복구 백업에서만 되돌린다. 백업이 없으면 부모 계보는 읽기 전용이고, 진행은 분기만 가능하다.

7. **공개 전용 서버 운영자가 분기 허용·금지를 고른다.** 그 정책은 각 체크포인트에 서명되어 그 체크포인트에서는 바뀌지 않는다. 정책 변경은 이후 체크포인트에만 적용된다. 분기 허용 체크포인트만 호스트 가능한 완전한 월드 스냅샷을 포함·내보낸다.

8. **세션 자격은 휘발성이다. 월드·인물 바인딩은 체크포인트에 남는다.** `personId` 점유는 세션 종료나 유휴로 만료하지 않는다. 참가자가 명시적으로 포기할 때만 풀린다. 호스트 추방은 재참가를 막지만 점유를 풀거나 인물 기록을 지우지 않는다.

9. **재참가 신원은 월드 참가자 복구 비밀이다.** 비밀을 잃으면 호스트가 게임 밖 사람 확인 뒤에 재발급할 수 있고, 옛 비밀은 폐기한다. 게임 안 자동 신원 증명은 두지 않는다.

10. **오프라인 점유 인물은 세계 안의 일상·정치 NPC로 남는다.** 원정을 시작하거나 플레이어만의 결정을 하지 못한다. 부상하거나 죽을 수는 있다. 사망 순간 이미 정한 후계 규칙을 즉시 평가해 바인딩을 옮기거나 게임오버를 기록한다. 오프라인 후계자는 재접속할 때까지 일상·정치 NPC다.

11. **각 참가자는 자신이 플레이했거나 죽은 인물 기록의 로컬 아카이브를 둔다.** 호스트 월드는 원본 기록을 가진다. 로컬 아카이브를 잃으면 복구 비밀과 사람 확인 뒤에 호스트가 서명한 기록으로 재구성할 수 있다.

12. **세계 시간은 플레이어가 한 명 이상 연결되어 있을 때만 흐른다.** 인원이 0이 되면 서버는 검증 체크포인트를 쓰고 배포한 뒤 월드·NPC 시뮬레이션을 멈춘다. 마지막 플레이어가 전투 중에 나가면 불변 전투 컨텍스트, 수락된 명령, 현재 전투 상태를 즉시 체크포인트에 담고 멈춘다. 자동 정산하거나 되돌리지 않는다.

13. **비정상 종료 다음 시작은 서명·해시가 통과한 가장 최신 완전 체크포인트를 자동으로 읽고, 충돌과 잃은 구간을 분명히 알린다.** 정상 종료는 신규 참가를 막고, 저장·체크포인트하고, 배포·확인을 마친 뒤 종료한다.

14. **불변 실행 파일·런타임과 영속 월드·설정·체크포인트·백업 데이터를 분리한다.** 활성 계보마다 기록 주체는 하나다. 최종 사용자 기본 경로는 네이티브 자식 프로세스다. Docker·systemd 패키징은 전용 운영자 선택 경로이며 플레이어에게 요구하지 않는다.

## 규칙

1. Steam 로비·소켓·인증 티켓·서버 브라우저가 월드 상태·원장·체크포인트 서명의 정본이 되면 이 ADR 위반이다.
2. 부분 검증·손상·서명 실패 체크포인트로 호스팅을 시작하지 않는다. 거절은 명확한 오류이고 이전 백업을 보존한다.
3. 분기 금지 체크포인트에서 호스트 가능한 완전 스냅샷을 내보내거나, 받은 체크포인트를 같은 계보로 이어 호스트한다고 쓰지 않는다.
4. 세션 종료·유휴·추방만으로 `personId` 점유를 풀거나 인물 기록을 지우지 않는다.
5. 플레이어 수 0에서 월드 시간·NPC 일상·전투를 계속 굴리거나, 마지막 이탈 전투를 자동 정산·롤백하지 않는다.
6. 이 문서를 Unity·Backend 구현 완료의 근거로 인용하지 않는다.

## 제품 GDD와 구현 상태

| 층 | 권위 | 상태 |
|---|---|---|
| 제품 세션·호스팅·체크포인트 | 이 ADR, [온라인 유저 여정](/design/Online-User-Journey), [저장 규칙](/rules/Save-and-Determinism), [전투 왕복](/rules/Strategy-Battle-Roundtrip) | 2026-09-22 문서 계약. 미구현 |
| 현재 Backend | [ADR-006](/decisions/ADR-006-backend-aspnet-core-coordinator), `Backend/server/Coordinator` | 프로세스 메모리 코디네이터. 이 ADR의 헤드리스 권위 서버가 아니다 |
| 현재 Unity | 기존 전투 표면 | 이 ADR의 로컬 자식 서버·Steam 세션이 아니다 |

ADR-006의 ASP.NET Core 단일 Kestrel, Y2K·CoreWCF 제거, 계정 메타 삭제, 외부 MySQL·Redis 금지는 현재 백엔드 구현 기록으로 남는다. 이 ADR은 그 스택을 폐기하지 않고, 제품 목표 런타임을 그 코디네이터와 같지 않다고 분리한다.

## ADR-005·006에서 개정하는 조항

- ADR-005 결정 2의 「호스트 클라이언트만 시뮬레이션을 굴린다」는 제품에서 「묶인·전용 헤드리스 서버가 권위다」로 바뀐다. 게임 규칙을 중계 계층이 해석하지 않는다는 금지는 유지한다.
- ADR-005 결정 3의 세션 휘발성은 세션 자격에만 남긴다. 월드 정본은 배포되는 검증 체크포인트다. 「친구 시스템·매치메이킹을 하지 않는다」는 Steam Lobby·초대·선택적 서버 브라우저와 충돌하므로 제품 계약에서 폐기한다. 호스트 마이그레이션으로 같은 계보를 자동 승계하지 않는다는 점은 분기 규칙으로 더 강하게 유지한다.
- ADR-006 결정 4의 프로세스 내 발급 신원은 제품 신원의 정본 뿌리가 아니다. 제품 신원의 정본 뿌리는 월드 참가자 공개키와 복구 비밀이다.
- ADR-006 결정 7이 계승한 호스트 클라이언트 권위와 「월드 정본 = 호스트 로컬 저장 한 곳」은 이 ADR이 제품 층에서 개정한다.

## 파급

- [온라인 유저 여정](/design/Online-User-Journey)의 계정·입장·점유·아카이브·시간 흐름 전제를 이 계약에 맞춘다.
- [저장 규칙](/rules/Save-and-Determinism)에 배포 체크포인트·계보·분기·서명·원자 반입·복구를 적는다.
- [전략에서 전투로](/rules/Strategy-Battle-Roundtrip)에 마지막 플레이어 이탈과 충돌 체크포인트를 적는다.
- Steamworks AppID·Tool AppID·패키지·익명 SteamCMD 포함 여부는 파트너 설정이 끝나기 전에는 GAP로 남긴다.
- Unity 네트워크 드라이버, 헤드리스 서버 바이너리, Steamworks SDK 연동은 별도 구현 모듈이며 이 문서 범위 밖이다.

## 연구 출처

인용은 제품 계약을 정당화하는 플랫폼 능력과 운영 패턴에 한정한다. Valheim 게임 코드는 오픈 소스가 아니며 가져오지 않는다.

- Steam Networking 개요 — 최신 API는 기본적으로 Valve 네트워크로 중계하고 일반 UDP도 지원한다. <https://partner.steamgames.com/doc/features/multiplayer/networking>
- ISteamNetworkingSockets — 연결 지향 메시지 API. `CreateListenSocketIP`/`ConnectByIPAddress`는 일반 UDP, `CreateListenSocketP2P`/`ConnectP2P`는 릴레이 P2P, 로컬 루프백 소켓 쌍을 지원한다. <https://partner.steamgames.com/doc/api/ISteamNetworkingSockets>
- Steam Datagram Relay — 인터넷 게임 트래픽을 Valve 백본으로 중계해 IP를 숨기고 인증·암호화를 적용한다. 전용 서버에도 쓸 수 있으나 월드 상태를 소유하지 않는다. <https://partner.steamgames.com/doc/features/multiplayer/steamdatagramrelay>
- Steam Matchmaking & Lobbies — 친구·임시 세션의 로비·검색·초대. 로비는 백엔드 채팅방에 가깝고 게임 월드가 아니다. <https://partner.steamgames.com/doc/features/multiplayer/matchmaking>
- Game Servers — 전용 서버와 Steam 서버 브라우저. 커뮤니티 호스팅을 전제로 한다. <https://partner.steamgames.com/doc/features/multiplayer/game_servers>
- ISteamGameServer — 로그인·하트비트·`BeginAuthSession`으로 티켓을 검증하고 서버 브라우저 메타를 올린다. `k_unServerFlagPrivate`는 LAN처럼 마스터 목록과 인증 강제를 끌 때 쓴다. <https://partner.steamgames.com/doc/api/ISteamGameServer>
- ISteamUser.GetAuthSessionTicket — 상대가 `BeginAuthSession`으로 무결성과 소유를 검증할 티켓을 발급한다. <https://partner.steamgames.com/doc/api/ISteamUser#GetAuthSessionTicket>
- Depots — depot은 OS·아키텍처별로 마운트할 수 있다. 플랫폼 전용 내용은 해당 OS depot에 둔다. <https://partner.steamgames.com/doc/store/application/depots>
- Uploading to Steam / SteamPipe — 빌드 업로드와 depot 구성. <https://partner.steamgames.com/doc/sdk/uploading>
- Distributing Your Dedicated Game Server — 전용 서버는 별도 TOOL AppID, Dedicated Server Redistributables, `steam_appid.txt`(게임 AppID), 익명 SteamCMD 패키지(17906) 포함 옵션이 필요하다. 실제 권한은 파트너가 확인한다. <https://partner.steamgames.com/doc/sdk/uploading/distributing_gs>
- SteamCMD — 전용 서버의 익명 설치 경로. 이 작성 시점에 위키 본문은 봇 보호로 전문을 확인하지 못했다. <https://developer.valvesoftware.com/wiki/SteamCMD>
- Valheim 전용 서버 안내 — 별도 Steam 도구, 실행 파일과 월드·권한 파일 경로 분리, 포트 범위, 정상 종료(CTRL+C) 권고. 운영 패턴만 참고한다. <https://valheim.com/support/a-guide-to-dedicated-servers/>
- community-valheim-tools/valheim-server-docker — Docker·systemd 래퍼, 설정 볼륨과 실행 파일 분리. 운영 포장 패턴만 참고한다. 게임 서버 본문은 오픈 소스가 아니다. <https://github.com/community-valheim-tools/valheim-server-docker>

## 미해결 Steamworks 파트너 설정

이 ADR이 잠그지 않는 사실. 구현이나 스토어 제출 전에 파트너 화면에서 확인한다.

- 게임 AppID와 전용 서버 Tool AppID 값
- 「Include this tool in Dedicated Server package」 체크와 익명 패키지 17906 포함 여부
- OS별 depot·패키지 소유 매핑, Dedicated Server Redistributables 실제 켜짐
- 전용 도구를 게임 패키지에 넣어 Steam 라이브러리 Tools로 노출할지
- 서버 브라우저 광고를 기본으로 켤지, 운영자 선택으로 둘지
- SDR 호스티드 전용 서버(알려진 데이터센터) 사용 여부. 커뮤니티 전용 서버의 필수 조건이 아니다
- 가족 공유 소유자 SteamID와 참가자 공개키 바인딩의 운영 정책

## 폐기

제품 GDD에서 다음을 폐기한다. 역사 문장의 바이트는 유지하고 이 절과 헤더의 후속 링크로 가리킨다.

- 호스트 클라이언트 프로세스가 제품 멀티플레이의 권위 시뮬레이션이라는 전제
- 세션이 닫히면 월드 정본과 인물 점유가 같이 사라진다는 전제
- 친구 로비·초대·전용 서버 광고를 제품이 하지 않는다는 전제
- 코디네이터 프로세스 메모리 신원이 제품 참가자 정본이라는 전제
- 클라우드 세션이 월드 시간을 상시 굴린다는 전제
