# `/total-war-ui/` 자체 호스팅 배포 영수증

배포일: 2026-09-19

## 범위

- 대상 호스트: `desktop` (`desktop-bo514et`)
- 배포 루트: `E:\git\seoul-dengoku-web\site`
- 변경 경로: `total-war-ui/` 하나
- 보존: 공식 위키 루트 `/`, `design-store/`, `play/`, `portrait-*`, `system-design/`, `ui-*`와 다른 서비스 파일
- Vercel 사용 없음

## 파일과 재배포 보존

검증한 `GDD/system-design/total-war-ui/`의 `index.html`, `styles.css`, `app.js`, `flow.html`, `flow.json`을 `total-war-ui.next`에 전송한 뒤 필수 파일과 `total-war-ui-20260919-v1` 표식을 확인하고 라이브 디렉터리로 교체했다.

다른 세션의 공식 위키 전체 사이트 교체가 이 경로를 두 번 지우는 것을 실측했다. 단발 복사로 끝내지 않고 다음 계약을 추가했다.

- React 공식 위키 `npm run build`가 `scripts/copy-static-services.mjs`를 실행해 `GDD/system-design/total-war-ui/`를 `dist/total-war-ui/`에 포함한다.
- `test:contract`는 빌드 오버레이와 Windows 배포 스크립트의 보존 절차가 없으면 실패한다.
- Windows 전체 사이트 교체 전에 기존 독립 서비스 오버레이를 새 번들에 보존한다.
- 최종 React dist 241파일에 `total-war-ui/`가 포함됐다. 기존 독립 서비스 7개를 보존해 총 991파일의 사이트 번들을 구성한 뒤 nginx 중단 구간에 전체 `site`를 원자 교체했다.

첫 교체 직후 같은 PowerShell 호출의 문자열 검사가 실패했지만, 교체는 완료됐다. 후속 독립 검사에서 다음을 확인했다.

- `E:\git\seoul-dengoku-web\site\total-war-ui\index.html`: 버전 표식 있음
- nginx 컨테이너 `/usr/share/nginx/html/total-war-ui/index.html`: 버전 표식 있음
- `http://127.0.0.1:8080/total-war-ui/`: HTTP 200, 버전 표식 있음
- 라이브 디렉터리 파일 수: 5
- 공개 `curl -i https://seoul-dengoku.linalab.io/total-war-ui/`: Cloudflare Access 302. 인증 화면 전 상태이므로 이것만으로 PASS 처리하지 않음

## 인증된 실제 페이지

Aside Browser의 로그인 세션으로 공개 URL을 열었다. 페이지 제목, `total-war-ui-20260919-v1`, 영웅 지휘 인물, 병졸 `8 / 20`, `5 / 20`, `4 / 20`을 실제 DOM에서 확인했다. 영웅은 `병졸 수 제외`로 표시된다. 부대 지휘 탭을 클릭하고 데스크톱 화면을 캡처했다.

- 캡처: `screenshots/live-total-war-ui.png`
- 액션 결과: `LIVE_VERIFY.marker === true`
- 정리: 해당 Aside 호출에서 탭을 닫아 `CLEANUP_LIVE_TAB_CLOSED` 확인

공식 위키 루트는 localhost 응답의 한국어 인코딩을 PowerShell 정규식으로 확인하지 못했으나, 인증된 Aside Browser에서 제목 `서울:전국 공식 위키 — 게임 정식 문서 체계`와 본문을 직접 확인했다. 루트·탐색·문서 카드는 그대로였고 `/total-war-ui/`만 추가됐다. 멀티 플랫폼 지원 기능은 프로젝트 글로벌 규칙에 따라 배포 수용 항목에서 제외했다.

다른 세션의 재배포가 끝난 뒤 최종 통합 번들을 다시 검증했다.

- 원본 모니터: `ORIGIN_BUNDLE_READY`
- Cloudflare 모니터: `PUBLIC_BUNDLE_READY=302/302`
- 인증 Aside: `FINAL_UI_BUNDLE_PASS 서울:전국 · 부대 지휘 UI 설계 템플릿`
- 인증 Aside: `FINAL_ROOT_BUNDLE_PASS 서울:전국 — 공식 위키`
- 정리: `CLEANUP_FINAL_BUNDLE_TABS_CLOSED`
