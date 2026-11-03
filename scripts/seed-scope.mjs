// seed-scope.mjs — db/seeds 컨텐츠 범위 (소유자 결정 2026-11-03: 시드는 위키 컨텐츠에 대해서만)
//
// 이 범위는 공개 허용목록(server/wiki-table-allowlist.mjs, PR #666)의 부분집합이다.
// seed-core가 isPublicTable와 이 모듈의 isSeedTable을 모두 적용해 이중 검사한다.
//
// 포함 근거(렌더 체인 코드 증거):
// - text_* · document_head · document_key_order: 문서 API 서빙 경로.
//   scripts/cast-sqlite/document-read.mjs는 현재 문서(text_document*)만 읽는다.
// - region_content_*: generate-catalog 지역 문서(REGION_CONTENT_*).
// - person · person_* · profile · relation · relation_type: 인물 상세·카탈로그 투영 원천.
// - glossary_head · glossary_revision · glossary_term · glossary_locale · glossary_alias ·
//   glossary_context: 용어 서빙이 개정 단위로 동작(glossary-store.mjs revisionTables).
// - geography_county · geography_edition · geography_map_title · geography_metadata ·
//   geography_title: 지리 계층(렌더 체인이 geography_edition 참조).
// - public_map_block · public_map_block_locale · public_map_summary: 공개 지도 블록.
// - clan_crest_motif · current_region_disposition · current_right_retirement ·
//   retirement_prose · state · state_label: 세계 상태·서술 컨텐츠(인물·영토 투영이 사용).
//
// 제외 분류(소유자 지시: 운영/시스템/메타/카탈로그 성격 제외):
// - 카탈로그: catalog_*(6종) — 카탈로그 구조/메타.
// - 운영/게시: document_publication_admission, public_projection_document,
//   public_office_replacement(렌더 체인 미참조).
// - 메타/시스템/보존: document_revision, document_revision_link_target,
//   document_revision_seal, glossary_revision_seal(봉인), glossary_archive(승인 바이트 보존),
//   article_route(경로 배정 메타), desire_axis, value_axis(역량축 정의).
// - 개정 본문: document_revision_text_*(160종) — 공개 문서 API가 서빙하지 않는다.
//   wiki-document-api.mjs는 readDocumentAsync만 import하고 개정 읽기는 저작 도구
//   (document-edit.mjs)만 사용한다. 사이트에 렌더되지 않으므로 제외.

export const SEED_TABLE_PREFIXES = ['text_', 'region_content_', 'person_', 'public_map_']

export const SEED_TABLES = new Set([
  'person',
  'profile',
  'relation',
  'relation_type',
  'glossary_head',
  'glossary_revision',
  'glossary_term',
  'glossary_locale',
  'glossary_alias',
  'glossary_context',
  'geography_county',
  'geography_edition',
  'geography_map_title',
  'geography_metadata',
  'geography_title',
  'document_head',
  'document_key_order',
  'clan_crest_motif',
  'current_region_disposition',
  'current_right_retirement',
  'retirement_prose',
  'state',
  'state_label',
])

export const isSeedTable = (name) =>
  SEED_TABLE_PREFIXES.some((prefix) => name.startsWith(prefix)) || SEED_TABLES.has(name)
