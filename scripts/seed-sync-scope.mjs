// seed-sync-scope.mjs — repo→PG 적용(v1) 동기화 범위 (소유자 승인 D1(a), 2026-11-03)
//
// docs/repo-edit-apply-path.md §2.3 권고안: v1 sync는 상수·상태 표만 다룬다.
// 개정 관리형 표(text_* 162종, document_head, document_key_order, glossary_*,
// region_content_*, person/person_*/profile/relation, public_map_*)는 typed CLI와
// 기존 PG→repo 루프가 유일한 편집 경로다. sync가 이 표의 repo 변경을 감지하면
// E_SYNC_OUT_OF_SCOPE로 적용을 거부한다(D1(a)).
//
// 이 범위는 공개 허용목록(server/wiki-table-allowlist.mjs, PR #666) AND 컨텐츠
// 범위(scripts/seed-scope.mjs, 소유자 결정 2026-11-03) 이중 경계의 부분집합이다
// (설계 §1.3 H1). 범위 확장은 이 모듈을 고치는 PR 검토 절차로만 한다.

import { isPublicTable } from '../server/wiki-table-allowlist.mjs'
import { isSeedTable } from './seed-scope.mjs'

// v1 허용 표(도메인 무관 정렬). 각 표의 행수·PK는 db/seeds/manifest.json 참조.
export const SYNC_V1_TABLES = [
  'clan_crest_motif',
  'current_region_disposition',
  'current_right_retirement',
  'geography_county',
  'geography_edition',
  'geography_map_title',
  'geography_metadata',
  'geography_title',
  'relation_type',
  'retirement_prose',
  'state',
  'state_label',
]

export const isSyncV1Table = (name) => SYNC_V1_TABLES.includes(name)

// sync 범위가 이중 경계(공개 허용목록 AND 시드 범위)를 벗어나는 표 목록.
// 비어 있어야 정상이다(seed-sync 기동 시 검사).
export function syncScopeViolations(names = SYNC_V1_TABLES) {
  return names.filter((name) => !(isPublicTable(name) && isSeedTable(name)))
}
