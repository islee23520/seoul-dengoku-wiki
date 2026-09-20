export const dataCatalog = [
  {
    "id": "cast-values",
    "title": "인물 가치관·욕망",
    "format": "JSON",
    "ownerPath": "LORE/name-pools/values-cast.json",
    "schema": "janseon.values.cast.v2",
    "records": 1004,
    "status": "사용 중",
    "validation": "verify-cast"
  },
  {
    "id": "cast-gender",
    "title": "인물 성별",
    "format": "JSON",
    "ownerPath": "LORE/name-pools/gender-cast.json",
    "schema": "seoul-dengoku.cast-gender.v2",
    "records": 1004,
    "status": "사용자 잠금 포함",
    "validation": "여성·남성 전수 및 잠금 우선"
  },
  {
    "id": "organization-values",
    "title": "조직 가치관·정책",
    "format": "JSON",
    "ownerPath": "LORE/name-pools/values-orgs.json",
    "schema": "janseon.values.orgs.v1",
    "records": 37,
    "status": "사용 중",
    "validation": "조직 ID·국가 참조"
  },
  {
    "id": "seoul-world-graph",
    "title": "서울 이동 그래프",
    "format": "JSON",
    "ownerPath": "GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json",
    "schema": "seoul-world-graph-v1",
    "records": 334,
    "secondary": "435간선",
    "status": "런타임 투영",
    "validation": "역 ID·간선 양끝·지문"
  },
  {
    "id": "station-control",
    "title": "역 점령 변경 원장",
    "format": "JSON",
    "ownerPath": "LORE/places/station-control-overrides.json",
    "schema": "seoul-station-control.v1",
    "records": 0,
    "status": "개막 기준선",
    "validation": "명시 변경만 허용"
  },
  {
    "id": "station-interiors",
    "title": "역 내부 원장",
    "format": "JSON",
    "ownerPath": "LORE/regions/station-interiors.json",
    "schema": "station-interior.v1",
    "records": 334,
    "status": "저작 원장",
    "validation": "역 카탈로그 전수"
  },
  {
    "id": "regions",
    "title": "행정동 저작 원장",
    "format": "JSON 묶음",
    "ownerPath": "LORE/regions/content/*.json",
    "schema": "region-content",
    "records": 427,
    "status": "저작 원장",
    "validation": "25구·427동·정본 링크"
  }
] as const
