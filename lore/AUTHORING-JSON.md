# PostgreSQL 작성 계약

공개 편집 정본은 현재 운영 PostgreSQL의 `wiki`다. 조회·문서 편집·생성은 PG 현재 head와 release snapshot을 기준으로 하며 저작 CLI와 문서 API는 SQLite 폴백이 없다. 운영 wiki 커밋 `24f3c676f7df0b9903e02f4278ac65bf8fac688f`, run `20261030T150126Z-11560`의 배포 관측은 `deploy/README.md`에 기록한다. 앞선 격리 reader·worker 대사는 별도 이관 증거다. 2026-10-31 소유자 지시로 이관 완료된 추적 `data/canonical/wiki-cast.sqlite`를 제거한다. 외부 SQLite는 외부 경로를 명시적으로 제공한 이관·대사에만 사용하며 런타임 입력이나 편집 정본이 아니다. 다른 archive·이전 배포 롤백과 PG 원천 바이트·해시·provenance·봉인 revision은 계속 보존한다. 이관·회귀 코드 삭제는 이번 변경 범위 밖이다.

- 물리적인 lore JSON 원천 파일은 모두 제거됐다. 문서·출처 기록에 남아 있는 `lore/.../*.json` 이름은 DB 안의 논리적 문서 식별자 또는 provenance이며, 디스크에서 다시 읽어야 할 입력 파일이 아니다.
- 현재 envelope head는 예시를 포함해 99개다. 예시는 실제 게시 문서와 구별한다.
- 원래 인물 ID 1,022개는 보존돼 있다. 현재 인물 511명은 disposition을 통해 구분한다. 보존 ID 수, 현재 인물 수, 프로필 수, 문서 수는 서로 다른 분모다.
- 비공개 editorial·Soul 데이터는 `wiki_private`의 별도 권한 경계로 관리한다. 이전 `.omo/private/seoul-migration/sqlite-authority-20261021`의 SQLite는 이관 archive이며 운영 정본이 아니다. 비공개 archive·비밀 파일은 mode `600`으로 관리하며 Git이나 공개 배포물에 넣지 않는다.
- 생성된 공개 JSON은 PG 정본의 출력물이다. 직접 고쳐 저작 원천으로 사용하지 않는다.
- 생성·승인·원격 게시는 별도 상태다. 위 SHA/run의 운영 배포 관측을 새 revision의 소유자 승인이나 게임 구현 완료로 확대하지 않는다.

DB의 존재, export 성공, 검증 통과, 렌더링 완료, 공개 배포, 게임 구현, 소유자 승인은 서로 다른 상태다. 현재 저장 상태를 확인하는 검증을 새로운 게시 승인으로 해석하지 않는다.

## 문서 envelope와 본문

- `version`은 작성 형식 버전 1, `domain`은 폴더명(루트만 `root`), `id`는 영구 식별자, `slug`는 문서 주소 줄기다. 기존 ID나 슬러그를 전환 과정에서 다시 할당하지 않는다. `DOC:<slug>`는 기존 고정 ID가 없는 *새 문서*를 위한 형식이다. 기존 문서의 주소·앵커는 원본과 대조한 뒤 따로 보존한다.
- 루트 문서 `WNA-001`은 일반 `data.registry` 대신 `data.atlas`를 사용하며 `schema: "world-narrative-atlas.v2"`를 요구한다. 아틀라스의 상태·인물·가문·회랑·합성체·적대 집단·예약 배치·작성 괴물·서사 호·관계·변경 기록은 `authoring.atlas.schema.json`의 닫힌 객체 계약을 따른다. 논리적 원본 ID는 `lore/World-Narrative-Atlas.json`이고, 현재 등록된 투영 문서는 33개다. 이는 `scripts/world-atlas-schema.mjs`의 `PROJECTION_PATHS`(루트·세력·도감 색인 7개와 G01–G26 집단 도감 26개)와 2026-10-18 재생성 manifest의 33개 쓰기가 일치하고 `scripts/materialize-world-atlas.mjs --check`가 통과한 수다.
- `status`는 `draft`·`approved`·`excluded` 중 하나다. 예시는 항상 `draft`이며 게시 승인 증거가 아니다. 루트 `tense.en/ko`는 각 언어의 시제를 명시하고, `locales.en/ko.tense`와 같은 값을 사용한다. `tense.en`과 `tense.ko`는 서로 같아야 한다. `provenance.original_anchor`는 원본 위치를 가리키며 `original_hash`는 실제 원본을 확인하기 전에는 `null`로 둔다. `history`는 확인된 전환 기록만 적는다. 예시의 원본 앵커는 예약값으로서 실제 원본을 뜻하지 않는다.
- `locales.ko`가 본문 정본 제목·요약·시제(`past` 또는 `present`)이며 `locales.en`은 대응 번역이다. `content` 순서는 두 언어가 공유한다. `heading`·`paragraph`는 `text.en/ko`, `list`는 다국어 `items`, `table`은 다국어 `columns/rows`를 쓴다. 모든 노드는 안정적인 `anchor`(블록 ID)를 갖는다. 영어는 블록 단위로 한국어에 대응한다. 모든 블록의 모든 글줄·목록 항목·표 칸은 `en`과 `ko`를 함께 가지며, 한쪽이 빠지면 `E_LOCALE`이다. `data` 안의 `anchor`는 같은 문서의 본문 블록 ID에 묶이며, 대응 블록이 없으면 `E_ANCHOR`이다. 동일 문서 안 앵커 중복과 테이블 행의 열 개수는 검증기가 확인한다. 두 언어의 의미 동등성은 검증기로 증명되지 않는다.
- 본문 글줄(`text.en/ko`, 목록 항목, 표 칸)은 문자열이거나 조각(run) 배열이다. 조각은 `text`와 선택적인 `link{domain, slug, anchor?}`(로어 문서 참조) 또는 `href`(`https://` 외부 주소)를 가진다. 둘을 함께 쓰지 않는다. 로어 문서와 별도 GDD 저장소 문서(`domain: "gdd"`)는 `slug: "groups/Hostile-Group-G10"`, `"rules/Warfare-and-Sieges"`처럼 영역 폴더 안 하위 폴더 한 단계까지 가리킨다. 점(`.`)은 쓸 수 없다. 원문의 굵은 글씨는 조각의 `strong: true`로 옮긴다. 마크다운 링크 `[..](..)`를 글줄 안에 두지 않으며, 원문의 링크는 조각으로 옮긴다. 비공개 인물 문서와 존재하지 않는 문서를 가리키는 링크는 검증기가 거부한다.
- `heading`은 원문 제목 수준을 `depth`(1–6)로 적는다. `#`이 1, `##`가 2다. 다른 노드에는 `depth`를 두지 않는다.
- 모든 본문 노드는 구조 식별자인 `anchor` 외에 선택적인 `publicAnchors`를 둘 수 있다. 공개 주소에서 보존해야 할 과거 절 ID를 중복 없이 적는 별칭이며, 구조 식별자를 대신하지 않는다. 링크 앵커 검증은 `anchor`와 `publicAnchors`를 모두 확인한다.
- 번호 목록은 `list`에 `ordered: true`를 두고, 1이 아닌 번호로 시작하면 `start`에 시작 번호를 적는다.
- 원문의 인용 블록(`>`)은 `quote` 노드로 옮긴다. 모양은 `paragraph`와 같아 `text.en/ko` 하나를 갖는다. 인용 블록 하나에는 문단 하나만 담으며, 여러 문단이면 인용 블록을 나눈다.
- 본문 중간의 가로줄(`---`)은 `rule` 노드로 옮긴다. `anchor`만 갖는다. 문서 맨 앞 `---` 블록은 머리말(frontmatter)이며 가로줄이 아니다.
- 표 본문 칸이 원문에서 비어 있으면 그 언어 값을 빈 문자열 `""`로 둔다. 공백만 있는 값과 빈 열 제목은 허용하지 않는다.
- 원문의 코드 울타리(수식, `mermaid` 도표 등)는 `code` 노드로 옮긴다. `language`에 울타리 언어(없으면 `text`)를, 언어 뒤의 나머지 정보 문자열(예: `economy-formula-cases`)은 `info`에 적고 `text.en/ko`에 각 언어 원문을 줄바꿈까지 그대로 담는다. 문단으로 풀어 쓰지 않는다.
- `source.kind`는 `source-fact`·`observed`·`computed`·`inference`·`original-fiction`을 구별한다. 창작이 아닌 항목은 `source.refs`에 출처를 한 건 이상 기록하고, 실제 원문 바이트가 확인된 경우에만 `source.hash`에 SHA-256을 기록한다. 예시의 빈 출처는 **출처가 확인된 사실이라는 뜻이 아니다**. 지역 지형 실측, 역 수치, 인물 원장 값 등을 예시에서 만들지 않는다.
- 영역별 `data`의 필수 키는 고정 엔터티 문서(`K001`, `S01`, `G01` 등)에만 요구한다. `DOC:` 산문 문서는 원문에 해당 값이 없으면 `data`를 `{}`로 둔다. 파일 경로나 요약 문장으로 채워 넣지 않는다. 표본의 `__EXAMPLE__:` 식별자는 본문 게시용 ID가 아니며 실제 정본 ID와 겹치지 않도록 예약했다. 예시의 임의 텍스트를 그대로 정본에 넣지 않는다. 다른 문서·관계·엔터티를 참조할 때에는 현행 원장과 배제 목록(M007, B017, B020)을 별도로 확인한다.
- 아틀라스의 `monster_batches`는 예약을 기록하므로 `M007`과 그 열 개 ID를 보존할 수 있다. 반면 `monster_contents.M007`, 그 열 개 ID의 작성 본문, B017/B020 작성 본문·경로, 퇴역 배치/스토리 투영 경로는 `E_EXCLUDED_ID`다. 관계의 `from`/`to`는 이름이 아니라 안정 ID를 사용하며, 과거 표시명이 필요하면 `from_label`/`to_label`에 다국어로 보존한다. `groups/Hostile-Group-G10` 같은 하위 폴더 슬러그도 실제 대상 문서로 해석한다.
- 문서에는 정본 1개에 EN/KO 블록을 함께 둔다. 두 언어의 짝은 블록 ID로 묶는다. 기존 마크다운 쌍의 `source_hash` 양방향 짝 계약은 폐지하며 호환 경로를 두지 않는다. 새 revision은 게시 승인을 자동으로 받지 않는다.

검증은 `node scripts/lore-json-validate.mjs`로 실행한다. 설치된 Python `jsonschema` Draft 2020-12로 각 문서를 영역별 스키마에 대조한 뒤 로케일·블록 ID·시제·링크·명명 규칙을 확인한다.

## 편집과 검토

1. document-cli의 list/read로 대상의 논리 ID, 현재 head, 문서 상태와 내용을 확인한다.
2. 공개 문서인지 비공개 운영 자료인지 구분하고, 적용 지시와 승인 범위를 확인한다.
3. 기존 CLI가 지원하는 typed 편집 명령을 stdin으로 전달한다. 정확한 명령 형식은 현재 CLI의 도움말과 구현 계약을 따른다. JSON 파일을 새로 만들거나 생성 JSON을 수정하는 방식으로 대체하지 않는다.
4. edit 후 새 head와 revision 이력, 변경 본문을 다시 읽는다. 이전 revision은 덮어쓰거나 삭제하지 않는다.
5. 편집으로 인한 draft invalidation을 확인한다. 이전 본문에 대한 검토·승인을 변경된 본문에 자동 승계하지 않는다.
6. 정본을 읽기 전용으로 검증하고, 별도로 정식 생성 결과와 필요한 본문·게시 검토를 확인한다.

논리적 `.json` 이름은 이 과정에서 문서 식별 및 과거 출처 연결에 계속 사용할 수 있다. 그 이름이 남아 있다는 이유로 해당 물리 파일을 다시 만들 필요는 없다. revision 이력과 출처 provenance는 서로 다른 정보다. 과거 JSON의 경로·pointer·해시는 당시 입력의 계보이며, 현재 문서 head를 대신하지 않는다.


`node scripts/lore-json-validate.mjs --strict`는 레거시 SQLite의 current/example 문서를 읽어 영역 스키마와 로케일·블록·링크를 대조하는 이관 진단 도구다. `.json` 이름을 인자로 주어도 이 경로는 SQLite 문서를 읽으며 현재 PG 정본을 검증하지 않는다. 이관 진단 통과를 PG 현재 head 검증이나 번역 의미·게시 승인으로 해석하지 않는다.
