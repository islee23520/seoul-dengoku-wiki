# Local AI backup and restore

## CPU tests

Portal의 기본 테스트 명령은 저장소 root에서 `npm --prefix TOOL/tools-portal test`다. 실행 전에 operator가 격리 virtual environment의 Python 3.10 이상을 준비하고 그 환경에 `numpy>=1.26,<3`, `pydantic>=2,<3`, `Pillow>=10,<13`을 설치한다. GPU, torch, 모델, live service는 CPU fixture에 필요 없다. 테스트는 다운로드나 패키지 설치를 하지 않으며 global Python으로 fallback하지 않는다.

이미 준비한 runtime의 executable을 operator 환경변수 `LOCAL_AI_CPU_PYTHON`에 지정한 뒤 다음과 같이 실행한다. 경로는 Git에 기록하지 않는다.

```powershell
$env:LOCAL_AI_TEST_PYTHON = $env:LOCAL_AI_CPU_PYTHON
npm --prefix TOOL/tools-portal test
# 수정 범위의 CPU fixture만 실행할 때:
npm --prefix TOOL/tools-portal test -- test/local-ai-unimate.test.ts test/local-ai-uniforge3d.test.ts test/local-ai-jobs.test.ts
```

POSIX shell에서는 `LOCAL_AI_TEST_PYTHON="$LOCAL_AI_CPU_PYTHON" npm --prefix TOOL/tools-portal test`를 사용한다. package runner는 preload에서 공통 executable을 `UNIMATE_TEST_PYTHON`, `UNIFORGE3D_TEST_PYTHON`에도 전파한다. 개별 변수가 설정되어 있으면 해당 값이 우선하며 각각 같은 dependency 검사를 통과해야 한다. 설정 누락이나 import 실패는 fixture 디렉터리를 만들기 전에 actionable 오류로 종료한다. 직접 `bun test`로 CPU 테스트 파일을 선택해도 같은 검사를 거친다.

전체 suite의 remote-client/download/CLI fixture는 POSIX private-state mode 0600/0700을 검증할 수 있는 OS가 필요하다. Windows에서는 그 guard가 거부하므로 해당 결과는 실패/미검증으로 기록하며 ACL 우회나 조건부 통과로 바꾸지 않는다. dist를 사용하는 테스트 전에 build를 완료하고 build와 테스트를 동시에 실행하지 않는다.

Node 24 이상에서 실행한다. [보존 정책](../../../seoul-dengoku-tools/TOOL/docs/Local-AI-Persistence-Policy.md)에 따라 owner가 승인한 파일만 선택하며, root 전체를 재귀 복사하지 않는다. 아래 경로는 설명용 예시이며 실제 private mapping이나 운영 경로가 아니다.

## Private config

config는 Git 밖의 ACL 제한 파일에 저장한다. 모든 root는 canonical 절대 경로여야 하며 symlink/junction을 허용하지 않는다. `backupRoot`와 `restoreRoot`는 미리 만들어 둔 별도 private 디렉터리다. `protectedRoots`에는 live source/runtime/user와 그 밖의 보호 경로를 빠짐없이 넣는다.

```json
{
  "backupRoot": "D:/example-private/backups",
  "restoreRoot": "D:/example-private/restore-qa",
  "protectedRoots": ["D:/example-private/original"],
  "roots": { "example.user": "D:/example-private/original/user" },
  "profiles": {
    "comfyui-all": {
      "rootRefs": ["example.user"],
      "files": [
        { "rootRef": "example.user", "path": "workflows/approved.json", "kind": "static", "stableCutoff": true },
        { "rootRef": "example.user", "path": "state.db", "kind": "sqlite" },
        { "rootRef": "example.user", "path": "state.db.bkp", "kind": "prior-bkp", "stableCutoff": true }
      ],
      "models": []
    }
  }
}
```

`rootRefs`는 profile이 요구하는 mapping key 목록이며 누락되면 실패한다. `files`의 `path`는 root 내부의 정확한 상대 파일명이다. `stableCutoff: true`는 owner가 writer와 겹치지 않는 cutoff를 확보했다는 선언이지 자동 감지 결과가 아니다. 정적 파일은 source-before/copy/source-after SHA256와 size, stat으로 확인한다. SQLite는 online backup API를 사용하며 기존 `.bkp`는 별도 항목으로 유지한다.

일반 모델은 `models`에 `{ "rootRef": "example.models", "path": "model.bin", "sha256": "실측한 64자리 소문자 hex", "bytes": 123 }` 형태로 참조만 추가한다. 해당 root mapping과 `rootRefs`도 명시해야 한다. 모델 hash/size는 backup과 restore 시 실측 검증한다. 재취득 불가 local-only 모델 bytes는 `files`에 `kind: "local-model"`, `localOnly: true`, `stableCutoff: true`로 별도 선택한다. 빈 `models`는 이 예제가 모델을 선택하지 않았다는 뜻이지 실제 인스턴스의 모델 복구 완료를 뜻하지 않는다.

`.env`, auth/cookies/credentials, live `.omo` 등은 선택하지 않는다. recognizable credential 경로는 추가 거부하지만 임의 파일 내용의 모든 비밀을 알아내는 scanner는 아니다. owner가 승인한 allowlist와 private ACL이 필요하다.

## Commands

저장소 root에서 실행한다. `--output`은 새 경로여야 하며 `--target`은 없거나 비어 있어야 한다. 둘 다 각각의 private root 아래이고 live/protected 경로와 겹치지 않아야 한다.

```powershell
$env:LOCAL_AI_BACKUP_CONFIG = 'D:/example-private/backup-config.json'
node TOOL/local-ai/backup.mjs --profile comfyui-all --output D:/example-private/backups/run-001
node TOOL/local-ai/verify-backup.mjs --backup D:/example-private/backups/run-001
node TOOL/local-ai/restore.mjs --backup D:/example-private/backups/run-001 --target D:/example-private/restore-qa/run-001
```

backup/restore는 환경변수 대신 `--config D:/example-private/backup-config.json`도 받는다. verify는 manifest와 backup bytes만 검사한다. restore는 전체 hash/size와 SQLite integrity를 확인한 뒤 target에 기록하고, 원본 user/source bytes는 읽지 않으며 선언된 immutable model store만 검증한다. 실패한 snapshot도 자동 삭제하거나 재사용하지 않는다.

현재 증거는 작은 실제 file/SQLite fixture와 세 CLI의 roundtrip뿐이다. **Live backup/restore NOT RUN**이며 실제 인스턴스의 독립 runtime/workflow 복원은 task12에서 검증한다.
