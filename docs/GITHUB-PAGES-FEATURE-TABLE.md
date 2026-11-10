# 옛 위키 → GitHub Pages 기능 대조표

기준: 옛 React SPA(`/wiki`)의 경로와 기능. 새 사이트의 경로는 영어 루트, 한국어는 `/ko/` 아래에 같은 구조로 있다. 데이터 원본은 `data/sql/*.sql`뿐이다.

| 옛 경로·기능 | 새 경로 | 상태 |
| --- | --- | --- |
| 대문 | `/`, `/ko/` | 있음 (언어 전환·선택 기억) |
| `/world` 문서 목록, 카테고리 | `/wiki/` + 사이드바 그룹 | 있음 |
| `/world/:slug` 문서 59개 | `/wiki/:slug/` | 있음 (영어는 기계 번역, 한국어 원문 보존) |
| `/states`, `/states/:slug` | `/wiki/states/`, `/wiki/states/:slug/` | 있음 |
| 세력(3개 + 독립) | `/wiki/factions/`, `/wiki/factions/:id/` | 있음, 통치 구조 설명 포함 |
| `/people` 검색·필터·초기화·건수·세션 유지 | `/wiki/people/` | 있음 |
| `/people/:id` | `/wiki/people/:id/` | 있음 (공개 데이터에 있는 필드) |
| `/families`, `/families/:id`, 가계도 | `/wiki/families/`, `/wiki/families/:id/` | 있음 (SVG 가계도) |
| `/people/relations` 가신 관계 | `/wiki/relations/` | 있음 (궁정 14개, 가신단) |
| 지리·영토 지도 | `/wiki/map/` | 있음 (SVG, 층, 선택, 지하철, 구 단위 공작위) |
| `/updates` | `/wiki/updates/` | 있음 |
| `/license` | `/wiki/license/` | 있음 (원문 그대로) |
| GDD 문서 129개 | `/gdd/...` | 있음 |
| 쇼케이스 | `/wiki/seoul-showcase/` | 있음 (한국어 중심, 영어 자막) |
| 제보(feedback) | - | 범위 밖: 쓰기 API 서버가 필요 |
| 인물 초안·캐릭터 아트 도구 | - | 범위 밖: 서버와 도구 필요 |
| Unity 지도 브리지·3D 보기 | - | 범위 밖: Unity 플레이어 필요 |
| 인물 초상 PNG(LFS 36 MB) | - | 이번에는 게시하지 않음 |

알려진 한계: 영어 텍스트는 기계 번역이고 교정 전이다. 종교 설정 삭제 등 정본 개정은 정본 문서가 바뀐 뒤 다시 내보내야 반영된다.
