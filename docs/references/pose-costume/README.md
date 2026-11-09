# references/pose-costume — Open Pose & Costume

- 소스: <https://github.com/islee23520/open-pose-costume> (소유자 저장소, TypeScript, 한·영 2개 언어 참조 스튜디오). 서비스: <https://omilic.com/>
- 용도: 포즈·의상·캐릭터 참조를 조합해 AI 캐릭터 이미지를 만드는 스튜디오. 제품 설명은 저장소 `PRODUCT.md`, 디자인은 `DESIGN.md`.
- 확인 시점 규모(저장소 README.en.md, 2026-11-02 갱신): 포즈 312그룹·1,559뷰, 의상 2,769, 캐릭터 참조 1,527, 참조 이미지 5,855.

## 저장소 구조

| 경로 | 내용 |
|---|---|
| `data/custom/{pose,costume,character}.json` | 자체 제작 항목 메타데이터(JSON 배열). 확인 시점 포즈 55 / 의상 74 / 캐릭터 39 레코드 |
| `data/source/*.json` | 외부 갤러리에서 동기화한 메타데이터(아래 권리 참조) |
| `data/vocabulary.json`, `data/pose-titles.en.json` | 의상·포즈 용어 사전 |
| `data/sync-manifest.json` | 동기화 시각, 소스 URL, 레코드 수, SHA-256 |
| `pose/`, `costume/`, `public/custom/` | 표지·원본 이미지 아카이브 |
| `SOURCES.md`, `THIRD_PARTY_NOTICES.md` | 출처와 권리 고지 |

## 레코드 스키마 (data/custom/*.json 기준)

| 필드 | 설명 |
|---|---|
| `id`, `code`, `kind` | 식별자, 표시 코드(예: `ST-030`), `pose`/`costume`/`character` |
| `title.{zh,en}`, `keywords.{zh,en}` | 2개 언어 제목·검색 키워드 (한국어 필드는 없다) |
| `category.{id,zh,en}`, `series`, `tags[]` | 분류, 시리즈, 태그(성별·사실/애니 등) |
| `provenance` | 원본 SHA-256, 크기, 생성 배치, 제공자·모델 |

## 위키 등록 범위와 권리

- 이 저장소의 **코드·문서·자체 제작 메타데이터**는 소유 자산이므로 위키에 링크하고 설명할 수 있다.
- `SOURCES.md`에 따르면 표지·원본 이미지의 상당수는 제3자 갤러리(ai-pose-gallery 등) 유래이며, 소스 약관은 **이미지 데이터의 재배포·전재·재판매를 금지**한다. 저장소 공개 업로드는 유지관리자가 원작자의 추가 허락을 받았다는 기록이며 하위 사용자에게 재배포 권리를 주지 않는다고 명시돼 있다.
- 따라서 위키에는 **이미지와 `data/source/` 파생 데이터를 이식하지 않는다.** 구조·스키마·용도 문서와 저장소 링크만 둔다. 항목 단위 참조가 필요하면 저장소의 `data/custom/*.json`의 `code`를 [공통 항목 형식](../README.md#항목-형식-공통)의 `url`(저장소 경로 링크)과 함께 기록한다.
