# 승인 후보 어댑터 운영 안내 (`scripts/inkos-adapter`)

이 문서는 `scripts/inkos-adapter/`의 개발 및 검토 운영자를 위한 운영 기준서다. 어댑터는 공개 허용이 확인된 한국어 문단 원천을 읽기 전용으로 내보내고, 호스트가 지정한 교체 후보 파일을 수집해 원천 식별자와 재결합한 뒤, 승인 전 초안 미리보기 파일만 생성한다.

## 1. 후보 전용(candidate-only) 원칙과 소유자 승인 경계

수집된 교체 문장과 준비된 미리보기는 모두 후보 기록일 뿐이며 어떤 경우에도 승인이 아니다. 소유자 검토와 승인은 어댑터 바깥의 별도 절차다.

- `collect`가 생성하는 영수증(`candidates/<candidateId>.json`)은 `status: "candidate-only"`, `ownerApproval: false`로 고정된다. 후보 반환 파일에 `ownerApproval` 등 허용되지 않은 필드를 넣으면 스키마 검증(`E_ADAPTER_SCHEMA`)에서 즉시 거부된다.
- `prepare-draft`가 생성하는 전문 미리보기 결과 역시 최상위와 `preview` 본문 모두 `status: "draft"`, 최상위 `ownerApproval: false`로 고정된다.
- 반영·승인·게시 하위 명령(`apply`, `approve`, `publish`)은 구현하지 않으며, 호출 시 실행 없이 종료 코드 `1`과 고정 오류 `E_ADAPTER_COMMAND`를 반환한다.
- 공개 게시 허용 테이블(`document_publication_admission`)과 그 `parent_revision` 제약, 정본 문서 head, 기존 승인 기록은 어댑터 실행 전후에 바뀌지 않는다. 해시 일치나 인용 키 일치도 서사 적합성 검토나 소유자 승인을 대신하지 않는다.

## 2. 데이터베이스 읽기 전용 보장

어댑터는 SQLite 정본이나 시험 DB에 어떤 쓰기나 스키마 변경도 수행하지 않는다.

- `export`와 `prepare-draft`는 `scripts/cast-sqlite/db.mjs`의 `openReadOnly()`만 호출한다. 이 연결은 `DatabaseSync(..., { readOnly: true, enableForeignKeyConstraints: true })`로 열리고 `PRAGMA foreign_keys=ON` 및 `PRAGMA query_only=ON`을 강제한 뒤 `application_id`와 `user_version`만 확인한다.
- `export`와 `prepare-draft`의 모든 조회는 단일 읽기 스냅숏(`BEGIN` ... `COMMIT`, 예외 시 `ROLLBACK`) 안에서 실행된다.
- `collect`는 CLI 플래그 정합성을 위해 `--db` 인자를 요구하지만 `collectCandidate()` 본문에서는 DB 파일을 열거나 수정하지 않으며, 현재 DB 읽기 집합 대조는 이후 `prepare-draft` 단계에서 수행한다.
- 어댑터는 DB 본문, 스키마, `document_authority`, `document_head`, `document_revision`, `document_publication_admission`, 승인 장부를 절대 기록하거나 갱신하지 않는다.

## 3. 실자료 금지와 작업자(worker) 경계

### 합성 오프라인 픽스처 전용

현재 검증과 시운전은 네트워크나 외부 모델 호출 없이 합성 오프라인 픽스처(`scripts/cast-sqlite/inkos-adapter-fixture.mjs` 등)만 사용한다. 비공개 자료, CPA 자료, 실제 외부 전송은 수행하지 않는다.

작업자 출력(`--worker-out`)의 `bundle.json`에는 불투명 키(`source-1`, `source-2` 등)와 공개 허용된 한국어 문단의 `{ anchor, text }` 발췌만 기록된다. 다음 정보는 작업자 번들에 절대 넣지 않는다.

- 비공개 Soul 배정·후보·검토 자료 및 역사 모티브
- 비공개 영수증(`receipt_path`, `receipt_sha256`, `approval_ref`) 원문과 비공개 편집 본문
- 호스트 파일시스템 절대 경로, `authorityId`, `documentId`, `revision`, `admissionDigest`

호스트 전용 매니페스트(`packets/<packetId>/manifest.json`), 후보 영수증(`candidates/<candidateId>.json`), 신뢰 인덱스(`index/<candidateId>.json`)는 모두 `--trusted-root` 아래에 권한 `0700`/`0600`으로 격리 보관하며 작업자 디렉터리나 DB 경로와 겹칠 수 없다(`E_ADAPTER_PATH`).

### 작업자 OS 격리 미구현

현재 어댑터는 작업자 프로세스에 대한 운영체제 수준 격리(별도 UID, 컨테이너, 네임스페이스, 샌드박스, 네트워크 차단)를 구현하지 않는다. 동일 UID 아래의 임시 디렉터리 분리는 경로 혼동을 막는 파일시스템 경계일 뿐 보안 격리가 아니다. 향후 실제 외부 모델이나 프로바이더를 연결하는 실행은 별도 격리 설계와 소유자 사전 허가가 있을 때에만 다룬다.

## 4. CLI 명령과 필수 플래그

실제 실행 진입점은 `scripts/inkos-adapter/cli.mjs`다. Node.js 24.15.0 이상과 `O_NOFOLLOW`를 지원하는 로컬 파일시스템(`darwin`, `linux`의 허용된 로컬 파일시스템 매직)이 필요하다.

`node scripts/inkos-adapter/cli.mjs --help` 실행 시 표준 출력(JSON)은 다음과 같다.

```json
{"commands":{"export":"--db DB --selection SEL --trusted-root HOST --worker-out WORKER","collect":"--trusted-root HOST --packet-id PID --candidate RETURN --db DB --out CANDIDATE","prepare-draft":"--trusted-root HOST --candidate-id CID --db DB --out PREVIEW","--help":""},"boundary":"candidate-only; read-only DB; no approval, apply, or publish"}
```

지원하는 하위 명령과 필수 플래그는 위 도움말과 정확히 일치하는 네 가지뿐이다. 정의되지 않은 플래그, 중복 플래그, 값 누락, 알 수 없는 하위 명령, `--help` 뒤의 추가 인자는 모두 `E_ADAPTER_ARGUMENTS`로 거부된다.

| 하위 명령 | 필수 플래그 | 동작 요약 |
| --- | --- | --- |
| `export` | `--db DB --selection SEL --trusted-root HOST --worker-out WORKER` | `SEL`에서 선택한 `current`/`technology`/한국어 문단 읽기 집합이 공개 허용 상태인지 단일 읽기 스냅숏으로 확인한 뒤, `HOST/packets/<packetId>/`에 `manifest.json`과 `bundle.json`을, 새 디렉터리 `WORKER/`에 `bundle.json`을 배타 생성한다. |
| `collect` | `--trusted-root HOST --packet-id PID --candidate RETURN --db DB --out CANDIDATE` | 호스트가 지정한 `RETURN` 파일을 `O_NOFOLLOW` 단일 링크 일반 파일로 읽어 `HOST/packets/<PID>/manifest.json` 및 `bundle.json`과 대조하고, 불변 영수증(`HOST/candidates/<candidateId>.json`), 신뢰 인덱스(`HOST/index/<candidateId>.json`), 호출자 사본(`CANDIDATE`)을 기록한다. |
| `prepare-draft` | `--trusted-root HOST --candidate-id CID --db DB --out PREVIEW` | `HOST/index/<CID>.json`을 통해 영수증·매니페스트·원본 후보 파일 디스크립터를 고정하고, `DB`의 단일 읽기 스냅숏에서 권한 버전과 전체 읽기 집합의 head·의미 해시·공개 허용 다이제스트를 재검증한 뒤, 대상 한국어 문단 슬롯 하나만 교체한 `status: "draft"` 미리보기를 `PREVIEW`에 배타 생성한다. |
| `--help` | (추가 인자 없음) | 지원 명령 목록과 운영 경계 문자열을 JSON으로 출력한다. |

`prepare-draft`가 허용하는 변경은 기존 한국어 문단 슬롯에 대한 `{ "type": "setText", "nodeId": "<anchor>", "slot": "text/ko", "value": "<replacement>" }` 단일 명령뿐이다. 문단 외 노드 변경이나 인라인 앵커(`<a id="..."></a>`) 추가·삭제·순서 변경은 `E_ADAPTER_UNSUPPORTED_CHANGE`로 거부된다.

## 5. 다이제스트와 식별자 구분

`collect`의 성공 표준 출력에는 `candidateId`, `receiptPath`, `receiptSha256`이 포함된다. `receiptSha256`은 `receiptPath`의 영수증 파일에 기록된 정확한 바이트의 SHA-256 소문자 16진수 값이며 신뢰 인덱스에도 같은 의미로 기록된다.

`prepare-draft`의 성공 표준 출력에는 기존 결과 봉투 필드에 더해 `previewFileSha256`이 포함된다. 이 값은 `--out`에 기록된 미리보기 파일 봉투 전체의 정확한 바이트를 SHA-256으로 해시한 소문자 16진수 값이다. 자기 참조를 피하기 위해 `previewFileSha256` 자체는 파일에 넣지 않고 표준 출력에만 기록한다. `fullPreviewSha256`은 기존과 동일하게 중첩된 `preview` 문서의 정규화 JSON 투영(`digestJson(preview)`) 해시이며 파일 봉투 해시가 아니다. 두 새 필드는 무결성 비교용 출력이며 권한이나 승인을 부여하지 않는다.

어댑터는 원천 식별, 의미 구조, 정규화 매니페스트, 무정규화 원시 바이트를 섞어 해시하지 않는다. `contracts.mjs`의 `canonicalJson()`은 UTF-16 코드 유닛 순으로 객체 키만 정렬하고 배열 순서를 유지하며 유니코드 정규화나 공백 제거를 수행하지 않는다. 반면 `sha256Bytes()`는 전달된 UTF-8 바이트열을 그대로 해시한다.

| 구분 | 필드 이름 | 계산 대상과 방식 | 묶어 두는(binding) 대상 |
| --- | --- | --- | --- |
| 원천·권한 식별 및 승인 상태 | `revision`, `admissionDigest` | `revision`은 DB `document_head`/`document_revision`에 봉인된 64자 소문자 SHA-256 `revision_id`다. `admissionDigest`는 `document_publication_admission` 행에 대한 `digestJson(admission)`이다. | 작업 시점의 공개 허용 문서 리비전 정체성과 게시 허용 레코드 상태(비공개 영수증 경로 원문을 외부로 노출하지 않으면서 동일 허용 상태임을 고정). |
| 의미(semantic) 다이제스트 | `semanticSha256`, `orderedCommandsSha256`, `fullPreviewSha256` | `digestJson(document)`(DB의 `head.semantic_sha256`과 일치 검증), `digestJson(commands)`, `digestJson(preview)`. | 읽기 집합 문서의 정규화된 의미 본문, 준비된 단일 `setText` 명령 배열, `status: "draft"`가 반영된 전체 미리보기 문서 구조. |
| 정규화 매니페스트 다이제스트 | `manifestDigest`, `candidateId` | `manifestDigest = digestJson(manifest)`, `candidateId = digestJson({ packetId, manifestDigest, candidateSha256 })`. | 키 정렬된 호스트 매니페스트 전체(읽기 집합·앵커·리비전·`inputDigest`)와 특정 후보 바이트 해시를 결합한 불변 후보 식별자. 같은 패킷에 다른 바이트가 들어오면 다른 `candidateId`가 된다. |
| 정확 바이트(exact-bytes) 다이제스트 | `inputDigest`, `candidateSha256`, `replacementSha256`, `receiptSha256` | `sha256Bytes(bundleBytes)`, `sha256Bytes(candidateBytes)`, `sha256Bytes(Buffer.from(replacementText, "utf8"))`, `sha256Bytes(receiptBytes)`. | 공백·유니코드 정규화 없이 직렬화된 `bundle.json` 원시 바이트, 수집된 후보 반환 파일의 정확한 디스크립터 바이트(1바이트 공백 추가 시에도 불일치), 교체 문자열 UTF-8 바이트, 영수증 파일 바이트. |

## 6. 고정 오류 코드 목록

`scripts/inkos-adapter/`의 여섯 모듈(`cli.mjs`, `contracts.mjs`, `export.mjs`, `collect.mjs`, `io.mjs`, `prepare.mjs`)이 실제로 방출하는 고정 오류 코드는 다음 16개다. CLI 실행 중 실패하면 표준 출력은 비우고 표준 오류에 `{"code":"E_ADAPTER_...","message":"..."}` 한 줄을 기록한 뒤 종료 코드 `1`로 끝난다.

| 오류 코드 | 방출 모듈 | 한 줄 의미 |
| --- | --- | --- |
| `E_ADAPTER_ARGUMENTS` | `cli.mjs` | 알 수 없는 하위 명령, `--help`의 여분 인자, 정의되지 않았거나 중복·누락된 CLI 플래그. |
| `E_ADAPTER_AUTHORITY` | `export.mjs` | DB의 `document_authority` 행이 없거나 지원 버전(`1` 또는 `2`)이 아님. |
| `E_ADAPTER_BINDING` | `contracts.mjs`, `collect.mjs`, `prepare.mjs` | 패킷·매니페스트·번들·신뢰 인덱스·영수증·인용 앵커·후보 파일 디스크립터 사이의 결합이나 바이트 무결성이 깨짐. |
| `E_ADAPTER_COMMAND` | `cli.mjs` | 금지된 반영·승인·게시 하위 명령(`apply`, `approve`, `publish`) 호출 거부. |
| `E_ADAPTER_CONFLICT` | `io.mjs`, `collect.mjs`, `cli.mjs` | 배타적 불변 파일 생성 시 이미 예약된 경로가 존재하며 바이트 동일성이 검증되지 않음. |
| `E_ADAPTER_DUPLICATE_KEY` | `contracts.mjs` | 엄격 JSON 파싱 중 이스케이프 해제 후 동일한 객체 키가 중복 등장함. |
| `E_ADAPTER_EXISTS` | `export.mjs` | 내보내기 대상 작업자 디렉터리나 패킷 디렉터리가 이미 존재함. |
| `E_ADAPTER_IO` | `cli.mjs` | `E_ADAPTER_` 접두사가 없는 저수준 런타임·입출력 예외를 CLI 경계에서 감싼 코드. |
| `E_ADAPTER_JSON` | `contracts.mjs` | 입력이 유효한 UTF-8 바이트/문자열이 아니거나 엄격 JSON 문법에 어긋남. |
| `E_ADAPTER_LIMIT` | `contracts.mjs`, `export.mjs`, `io.mjs` | 파일 크기(128 KiB), 교체 문장 크기(64 KiB), JSON 깊이(32), 출처 수(16), 인용 수(64) 등 상한 초과. |
| `E_ADAPTER_PATH` | `export.mjs`, `io.mjs` | NUL·`..`·심볼릭 링크·하드링크(`nlink !== 1`)·경로 중첩·읽기/쓰기 중 부모 디렉터리나 inode 교체 감지. |
| `E_ADAPTER_PUBLIC` | `export.mjs` | 선택 문서가 현재 공개 허용(`document_publication_admission`) 상태가 아니거나 봉인된 의미 해시와 일치하지 않음. |
| `E_ADAPTER_SCHEMA` | `contracts.mjs`, `collect.mjs`, `prepare.mjs` | 버전, UUID v4, 64자 소문자 SHA-256, 불투명 토큰, 허용 필드 집합, 프로토타입·배열 밀도 등 계약 스키마 위반. |
| `E_ADAPTER_STALE` | `prepare.mjs` | 내보내기 이후 DB의 `authorityVersion`, 공개 허용 여부, 문서 head `revision`, `semanticSha256`, `admissionDigest` 중 하나라도 변경됨. |
| `E_ADAPTER_UNSUPPORTED` | `export.mjs`, `io.mjs` | 지원하지 않는 문서 도메인(`technology` 외)·문단 외 구조, 또는 `O_NOFOLLOW`/허용 로컬 파일시스템 요건 미충족. |
| `E_ADAPTER_UNSUPPORTED_CHANGE` | `prepare.mjs` | 대상 슬롯이 기존 안정 한국어 문단 문자열이 아니거나 인라인 앵커(`<a id="..."></a>`) 목록을 변경하려 함. |

## 7. 호스트 매니페스트와 후보 영수증 대응 예시 (T6 실증 기록 기준)

다음 두 JSON 예시는 `.omo/evidence/inkos-adapter-followup/cli-proof.json`의 `happy` 시나리오(합성 오프라인 픽스처 왕복)에서 실제 기록된 값과 동일한 필드·해시다.

### 호스트 매니페스트 (`<trusted-root>/packets/<packetId>/manifest.json`)

```json
{
  "version": 1,
  "packetId": "5162d9fa-dc28-4615-956b-e6f05bb6cb93",
  "inputDigest": "e9520458d38a2323f260b1c98b424e6377f389bfe71cc5c4b7284044ac3834d3",
  "authorityId": "SYN-authority",
  "authorityVersion": 2,
  "targetKey": "source-1",
  "targetAnchor": "paragraph",
  "sources": [
    {
      "sourceKey": "source-1",
      "authorityId": "SYN-authority",
      "corpusKind": "current",
      "domain": "technology",
      "documentId": "SYN-target",
      "revision": "f99b42005f4f4f51c3057aeedddb5c67567388ab0e8d2ef4fb10ca56d1d40631",
      "semanticSha256": "3bad9b7ef161ccde6455f126cc7367683d3f669f98cdfe1555116e13d69fcd2d",
      "admissionDigest": "cd465ef761279bf9d5e119823a18275c6663c6f285672af866096ea63b185c17",
      "anchors": [
        "paragraph"
      ]
    },
    {
      "sourceKey": "source-2",
      "authorityId": "SYN-authority",
      "corpusKind": "current",
      "domain": "technology",
      "documentId": "SYN-context",
      "revision": "87233e3d062e6cdde132ce18a10666178ef9e5917e80ac59e16fc8b7193e6a7e",
      "semanticSha256": "f095f17938477f396961c3426a747215824de6244cbcec8ab00b95bfec0c12b6",
      "admissionDigest": "e2ac5f1431d28f712b875dfc2795f9562c8e61d4d5f27c53881d2b1c3042bccf",
      "anchors": [
        "paragraph"
      ]
    }
  ]
}
```

### 대응 후보 영수증 (`<trusted-root>/candidates/<candidateId>.json`)

```json
{
  "version": 1,
  "status": "candidate-only",
  "ownerApproval": false,
  "candidateId": "eddc001426f8aa419d8c57e0dc6174b81304f18fe861a87b922ec11c5552a3c0",
  "packetId": "5162d9fa-dc28-4615-956b-e6f05bb6cb93",
  "inputDigest": "e9520458d38a2323f260b1c98b424e6377f389bfe71cc5c4b7284044ac3834d3",
  "manifestDigest": "ba4db1c85400a33a8ce024039b48a268402eaf7738365e98c6bb1ed79e319965",
  "candidateSha256": "0b07fb052fda25a270d95f21cace25836ccaaab2f009ec5218949db9a30a943f",
  "replacementSha256": "0f1cd179c3e98f8c3f325af863294ea426a074f93ba8868d0e13fdca74b2fda5",
  "replacementText": "합성 시험의 새 문단은 공개된 참조만 사용하며 승인이나 게시를 수행하지 않는다.",
  "authorityId": "SYN-authority",
  "authorityVersion": 2,
  "target": {
    "sourceKey": "source-1",
    "authorityId": "SYN-authority",
    "corpusKind": "current",
    "domain": "technology",
    "documentId": "SYN-target",
    "revision": "f99b42005f4f4f51c3057aeedddb5c67567388ab0e8d2ef4fb10ca56d1d40631",
    "semanticSha256": "3bad9b7ef161ccde6455f126cc7367683d3f669f98cdfe1555116e13d69fcd2d",
    "admissionDigest": "cd465ef761279bf9d5e119823a18275c6663c6f285672af866096ea63b185c17",
    "anchors": [
      "paragraph"
    ],
    "anchor": "paragraph"
  },
  "sources": [
    {
      "sourceKey": "source-1",
      "authorityId": "SYN-authority",
      "corpusKind": "current",
      "domain": "technology",
      "documentId": "SYN-target",
      "revision": "f99b42005f4f4f51c3057aeedddb5c67567388ab0e8d2ef4fb10ca56d1d40631",
      "semanticSha256": "3bad9b7ef161ccde6455f126cc7367683d3f669f98cdfe1555116e13d69fcd2d",
      "admissionDigest": "cd465ef761279bf9d5e119823a18275c6663c6f285672af866096ea63b185c17",
      "anchors": [
        "paragraph"
      ]
    },
    {
      "sourceKey": "source-2",
      "authorityId": "SYN-authority",
      "corpusKind": "current",
      "domain": "technology",
      "documentId": "SYN-context",
      "revision": "87233e3d062e6cdde132ce18a10666178ef9e5917e80ac59e16fc8b7193e6a7e",
      "semanticSha256": "f095f17938477f396961c3426a747215824de6244cbcec8ab00b95bfec0c12b6",
      "admissionDigest": "e2ac5f1431d28f712b875dfc2795f9562c8e61d4d5f27c53881d2b1c3042bccf",
      "anchors": [
        "paragraph"
      ]
    }
  ],
  "citations": [
    {
      "sourceKey": "source-2",
      "authorityId": "SYN-authority",
      "corpusKind": "current",
      "domain": "technology",
      "documentId": "SYN-context",
      "revision": "87233e3d062e6cdde132ce18a10666178ef9e5917e80ac59e16fc8b7193e6a7e",
      "semanticSha256": "f095f17938477f396961c3426a747215824de6244cbcec8ab00b95bfec0c12b6",
      "admissionDigest": "e2ac5f1431d28f712b875dfc2795f9562c8e61d4d5f27c53881d2b1c3042bccf",
      "anchors": [
        "paragraph"
      ],
      "anchor": "paragraph"
    }
  ]
}
```

### 필드별 대응 관계

| 호스트 매니페스트 필드 | 후보 영수증 필드 | 결합 및 검증 규칙 |
| --- | --- | --- |
| `version` (`1`) | `version` (`1`) | 계약 버전 `1`로 동일해야 한다. |
| (없음: 호스트 수집 시 부여) | `status` (`"candidate-only"`), `ownerApproval` (`false`) | 수집기가 강제 주입하며 후보 반환 파일에서는 설정할 수 없다. |
| (매니페스트 전체 정규화 해시) | `manifestDigest` | `digestJson(manifest)` 값이며 `candidateId` 계산에 포함된다. |
| (매니페스트 + 패킷 + 후보 바이트 결합) | `candidateId` | `digestJson({ packetId, manifestDigest, candidateSha256 })`로 결정된다. |
| `packetId` | `packetId` | 후보 반환의 `packetId`가 매니페스트 및 `bundle.json`의 UUID v4와 정확히 일치해야 한다. |
| `inputDigest` | `inputDigest` | 작업자에게 전달된 `bundle.json` 원시 바이트의 SHA-256이며 매니페스트와 후보 반환 양쪽에서 동일해야 한다. |
| (후보 반환 파일 바이트, 교체 문자열) | `candidateSha256`, `replacementSha256`, `replacementText` | 호스트가 읽은 후보 파일의 정확 바이트 해시와 교체 문장 UTF-8 바이트 해시를 고정한다. |
| `authorityId`, `authorityVersion` | `authorityId`, `authorityVersion` | 호스트 매니페스트에 기록된 권한 식별자와 버전(`1` 또는 `2`)을 그대로 승계한다. |
| `targetKey` + `targetAnchor` + 해당 `sources[i]` | `target` | 후보가 보낸 `targetKey`를 호스트 매니페스트의 `sources` 원소로 펼쳐 `anchor: targetAnchor`를 결합한다. |
| `sources` | `sources` | 내보내기 당시 읽기 집합 전체(`sourceKey`, `documentId`, `revision`, `semanticSha256`, `admissionDigest`, `anchors`)를 그대로 보존한다. |
| `sources` 내 원소 + `anchors` | `citations` | 후보가 반환한 `{ sourceKey, anchor }` 쌍이 매니페스트의 `sources` 및 `anchors`에 실재하는지 검증한 뒤 호스트 원천 메타데이터와 결합한다. |

## 8. 향후 별도 설계 및 소유자 허가 대상

다음 항목은 현재 어댑터의 범위 밖이며, 이 패키지의 명령이나 옵션 확장으로 자동 허용되지 않는다. 모두 별도 설계와 소유자의 명시적 사전 허가가 있어야만 착수할 수 있다.

- 새로운 공개 게시 허용(`document_publication_admission` 신규 발급 및 변경)
- SQLite 정본 쓰기 및 초안 반영 명령 연결
- 다중 문서 읽기 집합 검증과 편집을 하나의 쓰기 트랜잭션으로 묶는 read-set 트랜잭션 확장
- 작업자 OS 격리 구축 및 실제 외부 모델·프로바이더 전송
