# PR evidence

`evidence/`는 PR 리뷰 중에만 사용하는 임시 검증 자료 저장소입니다.

## 신규 작성 규칙

```text
evidence/pr-<PR_NUMBER>/
├── manifest.json
└── <screenshots, logs, receipts...>
```

신규·수정 evidence는 현재 PR 번호와 일치하는 폴더에만 놓습니다. `manifest.json`에는 폴더 내 각 파일의 상대 경로와 SHA-256, 그리고 해당 증거가 검증하는 구현 commit `evidence_for_sha`를 기록합니다. 이 commit은 최종 PR head의 ancestor여야 합니다.

PR이 merge되면 `Evidence Cleanup` GitHub Actions가 해당 폴더를 삭제하는 별도 cleanup PR을 생성합니다. main 직접 push와 자동 merge는 하지 않습니다.

기존 비-PR 디렉터리는 ADR-007 이전의 historical evidence로 읽기 전용입니다. 새 파일을 추가하거나 기존 파일을 수정하지 않습니다.

