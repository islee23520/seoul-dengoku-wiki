# 공개 접근 재확인 — 2026-09-28 14:33 UTC

익명 `curl -sS --max-time 20 -D - -o /dev/null https://seoul-dengoku.linalab.io/<path>` GET 결과:

| 경로 | 상태 | Content-Type | 리디렉션(쿼리 생략) |
|---|---:|---|---|
| /tripothon/ | 302 | text/html; charset=UTF-8 | https://linalab.cloudflareaccess.com/cdn-cgi/access/login/seoul-dengoku.linalab.io |
| /play/ | 302 | text/html; charset=UTF-8 | 같은 Access 로그인 |
| /wiki/ | 200 | text/html; charset=utf-8 | 없음 |

세 요청 모두 curl exit0. Date 헤더 `Mon, 28 Sep 2026 14:33:55 GMT`. `/tripothon/`은 요구된 익명 공개 접근을 아직 충족하지 못한다. `/play/`의 Access와 `/wiki/`의200은 #290의 보존 조건에 맞는다. 이 응답은 Unity 진입·플레이 PASS가 아니다.

같은 시각 Python urllib 기본 사용자 에이전트로 한 세 요청은 모두403이었다. 클라이언트별 차이를 보존하며 이403을 위키 배포 장애로 단정하지 않는다. 실제 Codex in-app browser 임시 탭으로 `/tripothon/`을 열자 `Sign in ・ Cloudflare Access`, `Log in to seoul-dengoku`, Email·Send login code가 표시됐다. 로그인하거나 코드를 요청하지 않았다.

화면: [access-20260928-1433.jpg](../../../evidence/pr-308/access-20260928-1433.jpg),1280×720 JPEG,SHA256 `32cf400d367992418b92fb49fbfd622173f24e3d8fc9f68fe3cc5cae675c3528`. 실제 로그인 화면이며1920×1080 게임 프레임이 아니다. 공개 빌드의 gameplay, console/network gameplay errors, F1–F4, 영상 제작은 아직 미실행이다.

정리: 확인용 CUA tab4를 close했다. 서버·프로필·Unity 프로세스를 띄우지 않았다. 사용자 탭과 접근 정책은 유지했다. 쿠키·리디렉션 쿼리·인증값은 이 파일에 기록하지 않았다.
