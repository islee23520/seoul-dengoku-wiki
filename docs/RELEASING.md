# 릴리즈 버전과 갱신 이력

Pages에 배포되는 main의 병합마다 릴리즈가 하나 만들어진다. 버전의 정본은 **git 태그 `vX.Y.Z`** 이며 `package.json`의 `version`은 바꾸지 않는다. 태그를 만든 뒤 `package.json`을 되쓰려면 main에 커밋을 더해야 하고, 그 커밋이 다시 배포를 일으켜 커밋 되먹임 고리가 생기기 때문이다.

## 버전 규칙

- 직전 태그(main first-parent 체인에서 가장 가까운 `vX.Y.Z`)부터 배포 커밋까지의 first-parent 범위가 한 릴리즈다. PR 병합 커밋은 그 브랜치 커밋을 한 항목 아래에 묶는다.
- 올림은 범위 안 모든 커밋의 conventional-commit 유형으로 정한다: `!` 또는 본문 `BREAKING CHANGE:` 꼬리말 → major, `feat` → minor, 그 밖의 유형과 유형 없는 커밋 → patch(유형 없음은 "Other" 묶음).
- 태그가 하나도 없으면 첫 릴리즈이며 `v1.0.0`이다. 시작점은 `scripts/pages/release-notes.mjs`의 `DEFAULT_BASELINE`(#727 병합 `e462d6904`)이다.
- 커밋 제목은 한국어 원문 그대로다. 영어 쪽은 고정 유형 라벨 + 원문 제목이며 기계 번역을 하지 않는다. 페이지가 이를 밝힌다.

## 흐름

1. 사이트 빌드(`site/build.mjs`)는 `fetch-depth: 0`으로 받은 전체 이력과 태그에서 `wiki/updates/`(en·ko)를 만든다. 생성된 JSON을 커밋하지 않으므로 되먹임 고리가 없다. 얕은 clone이면 `E_SHALLOW`로 빌드가 실패한다.
2. 배포가 성공하면 `release` 잡이 `node scripts/pages/release-notes.mjs publish`를 실행해 태그와 GitHub Release를 만든다. 이 잡만 `contents: write`를 가진다.
3. `publish`는 멱등이다. HEAD가 이미 `vX.Y.Z`로 태그됐거나, 이미 더 새로운 릴리즈 태그에 포함됐거나, 원격에 같은 커밋의 태그가 있으면 아무것도 만들지 않고 exit 0이다. 다른 커밋을 가리키는 같은 이름의 태그가 원격에 있으면 exit 1(`E_TAG_CONFLICT`)이다. `workflow_dispatch` 재실행은 안전하다.

## 로컬 명령

```bash
node scripts/pages/release-notes.mjs next                      # 다음 버전 한 줄
node scripts/pages/release-notes.mjs release --format ko       # 대상 커밋에서 끝나는 릴리즈 노트(ko|en|json)
node scripts/pages/release-notes.mjs history                   # 전체 릴리즈 JSON
node scripts/pages/release-notes.mjs publish --dry-run         # 아무것도 만들지 않고 계획만 출력
```

처음 사용하는 clone에서는 `git fetch --tags`로 태그를 받아 둔다. 실제 `publish`는 추적 파일이 수정된 작업 트리에서 exit 3으로 거부한다.
