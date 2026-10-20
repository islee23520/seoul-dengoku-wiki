# Repository workflow

- 세계관·인물·세력·무공·아이템·대사·위키를 작성·수정·검토하기 전에 [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md)를 끝까지 읽는다. 이 지침은 이 저장소의 집필·기여 표면에 적용하며, 최신 사용자·디렉터 지시와 승인 상태를 함께 대조한다. 무공 분류는 그 가이드와 명명 원장의 승인본을 따르고, 옛 여덟 유파·여섯 분류·현장 별칭 문장으로 되돌리지 않는다.
- Work on a dedicated branch and deliver changes through a pull request to `main`; the owner alone merges it.
- Use Korean conventional-commit messages for independently verified changes.
- Do not push directly to `main` or rewrite shared history.

## 에비던스 뷰어 업로드

- 전역 공통 규칙은 `~/.omo/rules/evidence-upload.md`를 따른다. 프로젝트 지침과 전역 규칙 모두에 실제 원격 업로드·해시 검증·브라우저 확인 의무를 유지한다.

- 이 프로젝트의 에비던스 전달 주소는 **`https://evidence.linalab.io`**다. `localhost`, `127.0.0.1`, 로컬 파일 경로, 상대 `/evidence/...` 링크는 로컬 확인용이며 사용자·다른 세션에 전달할 최종 게시 주소가 아니다.
- **로컬 등록과 원격 업로드를 구분한다.** `~/.omo/evidence/gallery-public/<slug>/`에 파일을 두거나 로컬 전용 `register_evidence`가 상대 URL을 반환한 것만으로 업로드 완료를 선언하지 않는다. `EVIDENCE_SERVER_URL=https://evidence.linalab.io`가 설정된 원격 게시 클라이언트로 실제 서버에 업로드한다. 클라이언트가 지정한 `EVIDENCE_ROOT`를 확인하며 staging 경로를 임의로 가정하지 않는다.
- 기존 원격 클라이언트는 이 Mac의 `~/workspace/omo-evidence-viewer-mcp/mcp.mjs`다. 사용 전 해당 체크아웃의 `README.md`와 실제 `register_evidence` 스키마를 읽는다. 다른 기계에서는 설치 경로를 확인하고 Mac 경로를 복사하지 않는다. 현재 세션의 동명 MCP 도구가 로컬 등록만 제공하면 기존 원격 클라이언트의 stdio MCP `initialize` → `notifications/initialized` → `tools/call(register_evidence)` 경로를 사용한다. 실행 환경이나 설치된 MCP 설정을 바꾸어 해결하지 않는다.
- 자격 증명은 기존 `EVIDENCE_CLIENT_CONFIG` 또는 `~/.omo/evidence-client.json`과 비밀 저장소에서 클라이언트가 읽게 한다. 업로드 토큰·Cloudflare Access 키·쿠키를 출력하거나 문서·보고서·Git에 넣지 않는다. 인증 설정의 존재는 일반 브라우저의 로그인 완료를 뜻하지 않는다.
- staging에는 검토한 파일만 명시적으로 넣는다. HTML 보고서는 루트 `index.html`과 실제 참조 자산을 함께 올리고 상대 자산 경로를 유지한다. 작업트리·`.omo` 전체·브라우저 세션·로그·비공개 soul·개인 매핑·승인 대화 원본을 통째로 복사하지 않는다. 저장소 URL, 제목, 날짜, 라벨·분류를 포함한다.
- 원격 서버의 성공 응답과 **업로드한 모든 파일의 원격 바이트/해시 검증**을 확인한다. 서버는 충돌 방지를 위해 slug에 UUID 등을 붙일 수 있으므로 반환된 절대 URL을 그대로 사용한다. 로컬 slug에 도메인만 붙이거나 경로를 예측하지 않는다. 등록과 업로드 응답이 불명확하면 실제 서버 상태를 조회한 뒤 재시도하여 중복 업로드를 피한다.
- 업로드의 기본 visibility는 `private`이며, 이는 `evidence.linalab.io`의 인증된 열람 경로에 올리는 정상 절차다. **도메인에 업로드하는 것과 익명 공개 전환은 다르다.** `/evidence/...` 보호 열람과 `/public/...` 익명 공개를 구분하고, 공개 전환이 요청된 경우에만 현재 관리자 권한·확인 절차를 사용한다. 업로드용 기계 키를 공개 권한으로 간주하거나 권한 경계를 우회하지 않는다.
- 완료 전 반환된 `evidence.linalab.io` URL을 실제 브라우저로 열어 제목·본문·이미지·도표·첨부를 확인한다. HTTP 200인 Cloudflare Access 로그인 화면, `Not found`, 폴더 목록만 확인한 것은 보고서 열람 성공이 아니다. 필요하면 목록에서 `index.html`을 열고 최종 본문 URL을 전달한다. 이미지 파일명만 믿지 말고 실제 캡처 픽셀과 출처 URL도 대조한다.
- 최종 보고와 Herdr/다른 세션 인계에는 **검증한 원격 절대 URL**, 인증 필요 여부, 확인 범위와 미확인 사항을 적는다. 잘못된 로컬 주소를 이미 보냈다면 같은 대상에 정정하고 기존 인계 기록도 갱신한다. 로컬 미리보기만 성공했거나 원격 인증·업로드가 막혔다면 완료로 표시하지 않는다.
