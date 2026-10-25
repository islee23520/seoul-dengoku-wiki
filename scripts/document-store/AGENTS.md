# 문서·증거 저장소 작업 지침

## OVERVIEW
비공개 편집 문서, 영혼 배정, 증거와 서울 승인 reader를 분리하는 SQLite 영역이다. 점수 9의 독립 권한·보존 도메인이다.

## WHERE TO LOOK
| 작업 | 위치 | 경계 |
| --- | --- | --- |
| 일반 보존·revision | `store.mjs`, `schema.sql` | generic tree는 최종 typed authority가 아님 |
| 공개 인증 입력 조립 | `publication-database-inputs.mjs` | 명시적 DB·receipt·private store 설정 |
| 현재 비공개 문서 | `private-current-document.mjs` | 정확한 논리 경로와 pinned hash |
| 현재 scope 자료 | `scope-current-source.mjs`, `scope-authentication-reader.mjs` | typed reader와 증거 binding |
| 증거 저장·재생 | `evidence.mjs`, `evidence-reader.mjs`, `import-evidence.mjs` | immutable identity·hash·historical binding |
| 편집 profile | `editorial-profile.mjs`, `editorial-envelope-documents.mjs` | 내부 capability·원천 해시 |
| 영혼 관련 문서 | `soul-assignment.mjs`, `soul-*-documents.mjs` | 문서별 typed table·승인 view |
| 디렉터리 증거 | `scope-directory-inventory.mjs` | 봉인된 inventory로 읽기 재생 |

## CONVENTIONS
- 일반 store의 기본 scope는 `public`이며 read-only이다. 내부 호출은 `scope: 'internal'`을 명시한다.
- scope는 신뢰 경계이지 사용자 인증 시스템이 아니다. private store의 `INTERNAL_*_CAPABILITY`와 pin 검사를 유지한다.
- 일반 tree 저장은 보존 substrate이다. authority cutover에는 각 typed reader와 history/domain ownership 계약을 사용한다.
- `openPublicationDatabaseInputs()`는 절대 경로 설정과 receipt를 검증하고 단일 읽기 snapshot으로 인증 입력을 만든다.
- receipt는 증거 identity를 선택한다. 실제 승인 여부는 기존 authenticator가 결정한다.
- `readPrivateCurrentDocument()`는 허용된 논리 경로를 정확한 DB와 pin으로 결합한다.
- private DB의 mode·application_id·user_version 검사를 보존한다. 환경 변수 override도 같은 검사를 따른다.
- reader가 반환하는 handle은 `finally`에서 닫는다. publication 입력의 `close()`는 열린 handle 전체를 정리한다.
- 새 문서군은 대응 `.mjs`, `.sql`, `test-*.mjs`의 저장·복원·권한 검사를 함께 확인한다.

## COMMANDS
이 하위 디렉터리 전용 npm alias는 없다. 저장소 루트에서 Node test runner로 해당 검사를 선택한다.
`test-store.mjs`는 합성 fixture만 사용한다. 나머지 아래 검사는 비공개 SQLite 원천·봉인 자료가 해당 checkout의 가이드 지정 경로에 준비되어야 하며, 공개 checkout만으로 통과한다고 가정하지 않는다.
```bash
node --test scripts/document-store/test-store.mjs
node --test scripts/document-store/test-publication-database-inputs.mjs
node --test scripts/document-store/test-scope-authentication-reader.mjs
node --test scripts/document-store/test-soul-assignment.mjs
```
capture·bootstrap CLI의 경로·actor·reason 인수는 해당 진입 파일에서 확인한다.

## ANTI-PATTERNS
- generic current tree나 보관된 원문을 최종 typed authority의 대체재로 사용하지 않는다.
- 비공개 현재 문서 선택에 DB inventory 탐색, 원천 파일 조회, 보존 body, public fallback을 추가하지 않는다.
- 문서 read 실패를 파일시스템의 오래된 JSON으로 대체하지 않는다.
- private 문서 원문·capability를 public scope나 브라우저 bundle에 노출하지 않는다.
- 일반 store로 무관한 DB나 정본 DB를 변경하지 않는다.
- backup archive의 바이트 길이·SHA-256 검사를 생략하거나 receipt만으로 승인 상태를 높이지 않는다.
