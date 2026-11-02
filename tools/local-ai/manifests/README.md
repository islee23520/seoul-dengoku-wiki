# Local AI declarations

정책: [Local-AI-Persistence-Policy.md](../../../../seoul-dengoku-tools/TOOL/docs/Local-AI-Persistence-Policy.md).

이 디렉터리는 portable 재구성 선언이다. live 설정, endpoint, PID, 계정, 절대 경로, credentials와 bytes backup을 넣지 않는다. null 또는 unresolved는 아직 확정되지 않은 값이며 빈 목록을 설치된 항목 없음으로 해석하지 않는다. 이 문서의 필드는 향후 consumer가 실제 필요할 때 경계 검증한다. 현재 실행 가능한 restore schema나 새 validator를 정의하지 않는다.

## 파일과 소유권

- pngal-8188.instance.json, desktop-8189.instance.json, legacy-comfyui.instance.json: 서로 다른 ComfyUI 복구 단위.
- unimate-old.instance.json: 보존할 기존 source/env/data.
- unimate-fork.instance.json, uniforge3d.instance.json: 독립 후보 복구 단위. source 획득 정보는 다른 lane의 unimate.source.json, uniforge3d.source.json을 참조한다. 이 task는 그 파일을 작성하거나 덮어쓰지 않는다.
- portal.instance.json: dirty static 보존과 live authority/data 복구 경계.

## 필드 읽는 법

instanceId는 stable 논리 ID다. rootRefs의 값은 private local root map lookup key이지 실행 경로나 다운로드 위치가 아니다. source.observedCommit은 baseline에서 확인된 checkout SHA이며 approved runtime SHA가 아니다. reference는 비교 기준으로만 쓰며 자동 update하지 않는다. runtime.observed는 HTTP/interpreter 또는 pyvenv 관측값이며 dependency lock을 대신하지 않는다.

nodes.observedEntries는 inventory의 immediate entries다. revision/url/enabled가 null이면 미확정이다. workflow, model, data completeness가 unresolved이면 recoveryReady는 false다. expectedContracts는 읽은 adapter의 기대 pin만 나타낸다. revision/license가 기록되어도 task4가 model bytes나 접근권을 검증한 것이 아니다.

## Local evidence binding

canonical main 실행 ledger의 unimate-uniforge3d-comfyui-persistence-ship/task-1에서 baseline.json, DoneClaim.md, task-1-inventory.json, snapshot-manifest.json을 찾는다. task-4/local-root-map.json은 local 전용이며 Git으로 복사하지 않는다. local root map에는 alias/realpath/owner와 미확정 mapping을 유지한다. snapshot bytes는 task1의 ACL 제한 private snapshot에 있다. task4-policy-review.md와 DoneClaim.md는 문서 검토 증거다.

## CPU preflight private input

`node TOOL/local-ai/preflight.mjs --tool unimate --json --config <absolute-private-json>` (또는 `uniforge3d`). 설정 생략은 `NOT_CONFIGURED`, 모든 미준비 결과 exit 2다. `preflight({tool, configPath})`를 후속 adapter에서 재사용한다. task5는 항상 `ready:false`이며 task12 GPU/runtime proof를 대신하지 않는다. source module, torch, native extension을 import하지 않고 Python `-I -B`의 표준 라이브러리 metadata와 top-level spec만 조회한다. import 성공이나 CUDA ABI 호환성을 증명하지 않는다. 다운로드·GPU query·CUDA load·설치를 실행하지 않는다.

private JSON은 정확히 `{schemaVersion:1,tool,roots:{source,runtime,models,data},forbiddenRoots:[...],interpreter,modelManifest,minimumFreeBytes}`다. 경로는 절대경로이고 roots는 실제로 분리되어야 한다. forbiddenRoots는 비어 있으면 안 되며 기존 UniMate/ComfyUI와 다른 도구의 runtime을 명시한다. root와 interpreter/model의 realpath를 검사하므로 다른 환경 또는 root 밖 junction은 거부한다. Linux symlink interpreter도 허용 runtime 안에 실제 executable이 있어야 한다. WSL 환경은 그 filesystem의 Node에서 같은 검사로 실행하고 Windows venv를 공유하지 않는다. 미설치 runtime은 `ROOT_MISSING`일 뿐 플랫폼 미지원 판정이 아니다.

private modelManifest는 정확히 `{schemaVersion:1,tool,files:[{role,path,sha256,bytes,revision,license,access}]}`다. path는 models root 상대 POSIX 경로이며 traversal/중복을 금지한다. revision/license는 credential 없는 식별자, access는 `granted|required`다. 승인 여부의 근거는 로컬 운영자가 소유하며 preflight가 상업 사용권을 부여하지 않는다. 실제 shard·tokenizer·remote code를 포함한 모든 파일마다 전체 SHA256/bytes를 선언한다. index의 weight_map에 미선언 shard가 있으면 누락으로 보고한다. config와 manifest에 credentials 또는 추가 키를 허용하지 않고 원문 오류와 경로를 stdout에 출력하지 않는다. 이 선언을 task4 portable instance 선언으로 오인하지 않는다.

UniMate roles: `v3-config`, `v3-stats`, `v3-checkpoint`, `flan-t5-base`. 이전 venv를 후보 v3로 간주하지 않는다. UniForge roles: `pipeline`, `structure`, `structure-vggt`, `structure-base`, `structure-decoder`, `shape512`, `shape512-adapter`, `shape1024`, `shape1024-adapter`, `shape-decoder`, `texture`, `texture-adapter`, `texture-decoder`, `conditioner`, `dinov3`, `rmbg`. decoder는 같은 basename의 json+safetensors를 선언하고 pipeline의 checkpoint/revision을 빠짐없이 바인딩한다. DINO/RMBG 및 T5는 config와 weights를, T5는 tokenizer를, RMBG는 검토한 Python remote code도 선언한다. 검증된 hash는 준비된 bytes의 증거일 뿐 모델 format 및 v3 의미 호환성의 증거는 아니다.

## 완전한 복구에 추가로 필요한 자료

source URL/SHA와 dirty patch/untracked owned bytes, exact interpreter와 lock/pip freeze/native pins, node URL/SHA/dirty bytes/enabled, workflow UI JSON/API graph/dependencies, model role/revision/hash/bytes/license/access, user/input/output와 참조 assets, online SQLite backup 및 기존 .db.bkp, portal receipt와 non-rollback authority 구분을 확보한다. unknown을 추정값으로 채우지 않는다. model-free smoke와 실제 대표 workflow, portal receipt 검증 전에는 복구 완료가 아니다.
