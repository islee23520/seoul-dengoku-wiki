# 인물 시트 로컬 동반 도구

서울전국 인물 카드 후보를 로컬에서 만들고 겁스 4판 수치를 계산하는 AI 클라이언트용 도구다. 위키 공개 웹 편집기와 독립적이며 공개 서버에 배포하지 않는다. 정본 인물 카드, K ID 발급 원장, 가치관 승인각, 파생 `gurps-cast.json`, 게시된 인물 상세는 읽기 전용이다.

## stdio MCP

AI 클라이언트의 MCP 서버 설정에 다음 실행을 등록한다. 작업 디렉터리는 WIKI 저장소의 절대 경로로 지정한다.

```json
{
  "mcpServers": {
    "seoul-character-drafts": {
      "command": "node",
      "args": ["/absolute/path/to/WIKI/scripts/sheet-local/mcp.mjs"],
      "env": { "SEOUL_SHEET_DRAFT_DIR": "/absolute/path/to/local/drafts" }
    }
  }
}
```

도구는 `list_choices`, `create_draft`, `get_draft`, `import_draft`, `propose_edit`, `validate_draft`, `export_draft`, `example_candidate`, `submit_issue`, `submit_pr`이다. 마지막 두 도구는 AI 클라이언트가 명시적으로 호출해야 GitHub에 글을 쓴다. `import_draft`는 공개 웹 JSON의 `person-####` 경로를 기존 원장의 K ID와 대조한 뒤 새 로컬 초안을 만든다. `example_candidate`는 AI에게 후보 구조를 보여 준다. AI가 직접 제안한 내용은 `propose_edit`의 `provenance`에 `kind: "ai-example"`로 남긴다. 채택해도 정본 승인이 아니다.

기존 인물은 `create_draft({"personId":"K1003"})`로 열 수 있다. 초안에는 원본 원장의 SHA-256이 기록되며, 원장이 바뀌면 `validate_draft`에서 충돌을 알린다. 수정은 직전 `revision`을 요구한다. 새 인물은 K ID 없이 시작한다. 초안 파일은 위 환경변수의 전용 디렉터리에만 기록된다.

## GitHub 이슈와 초안 PR 자동 등록

`submit_issue`는 `id`, `realPerson: true|false`, 실존 인물이면 `consentRecorded: true`를 받아 `gh issue create`로 검토 이슈를 등록한다. `submit_pr`는 같은 분류와 `worktree` 절대 경로, `publish: true`를 받아 깨끗한 전용 WIKI 작업트리에 `docs/editorial/character-drafts/<id>.json` 검토 자료만 커밋하고 `gh pr create --draft`를 실행한다. 두 도구 모두 URL을 반환한다. AI 클라이언트가 호출하지 않으면 GitHub에 아무것도 쓰지 않는다.

PR 업로드 전 같은 초안을 `npm run sheet:pr -- <초안-ID> --worktree <전용-작업트리>`로 미리 본다. 공개할 필드와 근거를 확인한 뒤 `--publish --fictional` 또는 `--publish --real-person --consent-recorded`를 붙인다. 공개 PR 파일에는 서울전국 초안 필드만 들어가고 겁스 수치·기술표는 로컬 미리보기에만 있다. PR은 정본 발급이나 병합이 아니다.

## HTTP MCP (선택)

로컬 HTTP를 요구하는 AI 클라이언트에는 무작위 토큰(24자 이상)을 만들고 다음과 같이 실행한다.

```sh
SEOUL_SHEET_MCP_TOKEN='<local-random-token>' SEOUL_SHEET_MCP_PORT=8765 \
SEOUL_SHEET_DRAFT_DIR='/absolute/path/to/local/drafts' npm run sheet:mcp:http
```

`http://127.0.0.1:8765/mcp`는 JSON-RPC 2.0 POST를 받고 Host/Origin/토큰을 검사한다. 포트는 `127.0.0.1`에서만 열린다. nginx, Cloudflare, 원격 호스트로 포워딩하지 않는다. 공개 웹의 HTTPS 페이지는 이 HTTP 포트를 직접 호출하지 않는다. 웹에서 만든 초안은 JSON 파일로 내보내 AI에게 전달한다.

## 확인과 정본 반영

```sh
npm run test:sheet-local
node scripts/gurps-cast.mjs --check
```

내보낸 초안은 검토 자료다. 정본 반영은 별도 브랜치/PR에서 한국어 카드 JSON과 영어 번역을 함께 수정하고 `lore-json-validate --strict` 및 `gurps-cast --write/--check`를 돌린다. 신규 K ID와 승인 해시는 소유자가 실제 입력 파일 바이트를 보고 승인한 뒤 기존 `issue-person-ids.mjs`로 발급한다.
