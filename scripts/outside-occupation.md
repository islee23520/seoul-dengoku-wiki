# 서울 밖 점유 투영 — 과거 구현 기록

## 현재 적용 범위 (2026-10-31)

아래 원문은 서울 밖 행정 단위를 표시하던 과거 구현·검토 기록이다. 현재 세계·공개 지도·인물 위치·영지는 서울 행정 경계 안에서만 성립하며, 이 문서를 근거로 서울 밖 통제·사건·소문·권리를 되살리지 않는다. 현재 편집 기준은 [세계관 지침](../WORLD_BUILDING_GUIDE.md), 생성 운영은 [scripts 지침](AGENTS.md), PG 저작은 [도구 안내](cast-sqlite/README.md)를 따른다.

본문의 `lore/...json`은 현재 물리 입력 파일이 아니라 보존된 논리 ID·provenance다. PostgreSQL `wiki`가 운영 정본이며 외부 SQLite는 명시적 이관·대사에만 사용한다. 아래 `npm test`와 과거 gate 실행 안내는 현재 실행 절차가 아니다. 소유자 결정으로 일반 테스트 스위트는 제거됐으며 과거 명령을 복원하지 않는다. 생성·빌드는 현재 package 명령과 준비된 PG·비공개 입력 계약을 확인한 뒤 실행한다. 이 문서 갱신은 생성·검사·배포 완료를 뜻하지 않는다.

현재 `outside-occupation.mjs`에는 원래 투영을 먼저 검증한 뒤 retirement 기록의 `approvalRef`가 `owner:` 접두사를 갖는지, 행별 참조·값이 일치하는지와 원행 해시·전수 대응을 검사하는 경로가 있다. 이 형식·일치·해시 검사는 실제 소유자 승인 메시지나 승인 권한을 독립적으로 인증하는 절차가 아니다. 전체 retirement는 현재 통제 근거를 제거하며 옛 지도 기하 보존과 현재 배정 유효성은 별개다. 아래 원문의 교량 분류만으로 현재 정부 소유·서울 밖 공개 권리를 부여하지 않는다.

## 보존 원문 (과거 Outside occupation projection)

`lore/regions/outside-control-2126.json` owns whole-unit political assignments. Schema v3 allows `authority: null` only for units enumerated by `lore/regions/outside-island-occupation.json`.

The island ledger enumerates every disconnected path component of those administrative boundaries. `componentIndex` is zero-based and bound to the exact observed unit path by `pathSha256`; changing geometry requires reviewing the component allocation again. `location` is the WGS84 bounding-box midpoint of the displayed component, a review locator rather than a surveyed place point. Names are nullable: unidentified coastal components do not receive invented names or ownership.

`mainland-bridge` means a verified continuous bridge connection to the mainland (possibly through other islands), not merely a bridge to another offshore island. `no-mainland-bridge` and `unknown` both project `authority: null`, `status: unassigned`, and no personal holder or title. Only verified mainland-connected components project Government authority. The geographic evidence does not establish opening-day passability.

`scripts/outside-occupation.mjs` validates coverage, unique indices, geometry binding, source references, and the ownership boundary. It supplies the `components` with exact paths and derives whole-unit `partial` or `unassigned` status. The map renders these components instead of tinting the entire administrative unit; its detail panel shows the individual assignments. Observed `public/outside-admin-units.json` geometry is unchanged.

Regenerate and check from the WIKI root:

```sh
npm run generate
npm test
npm run build
node scripts/gate.mjs
```

Run generation and build sequentially: generation recreates crest assets used by the build. Keep source captures and per-component review evidence under ignored `.omo/evidence/`.
