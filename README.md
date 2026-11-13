# Seoul Metro Dynasties — Official Wiki

**서울 지하철 왕조(Seoul Metro Dynasties)** 의 세계관 정본과, 그것을 공개하는 위키 사이트의 저장소다. 위키는 GitHub Pages로 <https://sss.linalab.io/> 에 영어(기본)와 한국어로 게시된다.

## 지금의 체계 (2026-11-13 기준)

| 무엇 | 어디 | 설명 |
|---|---|---|
| 세계관 골격 | `docs/CANON-BIBLE.md` 1~3절 | 소유자가 승인한 세계 규칙, 세 세력(정부·자유도시들·아크), 25구 배정, 지휘 원칙, 연표 기준점. 다른 모든 문서보다 우선한다 |
| v3 바이블 | `docs/design/v3/` | 골격 아래의 세계 설계 전체(01-core ~ 10-design-profile). 위키·인물·병종·GDD·쇼케이스는 여기서 다시 쓴다 |
| 공개 데이터 정본 | `data/sql/*.sql` | 위키 문서(030), 인물(050·090), 가문·가계도(100·110), 지도(120~123), 병종(130~132) 등. 사이트 빌드가 이 SQL만 읽는다 |
| 위키 문서 초안 | `docs/drafts/<slug>.{ko,en}.md` | `scripts/pages/rewrite-doc.mjs`로 030에 반영한다 |
| 인물 배치 입력 | `docs/drafts/people/{government,free-city,arc}.jsonl` | `scripts/pages/v3-apply-people.mjs`로 050·090·110·115·123과 초상 토큰에 반영한다 |
| 고정 사실 | `docs/design/v3/fixed-facts.snapshot.json` | 인물 이름·초상 얼굴·성별·나이·가족과 서울 실제 지리. `node scripts/pages/v3-fixed-facts.mjs --check`가 지킨다. 번역 오류 정정만 `fixed-facts.corrections.json`으로 허용한다 |
| 잠정 원장 | `docs/drafts/reports/v3-provisional-ledger.md` (+ `v3-ledger-parts/`) | 소유자 승인 전의 모든 지어낸 항목 |
| 설계 지침 | `.agents/skills/game-design-practice/SKILL.md` | 장르 중립 핵심 지침(하네스 중립). 이 프로젝트 적용값은 바이블 10장 |

## 빌드와 검사

```bash
cd site && npm ci --ignore-scripts && cd ..
node site/build.mjs && node site/check-site.mjs          # CI(Linux)와 같은 명령
# Windows 로컬: MSYS_NO_PATHCONV=1 SITE_BASE=/ SITE_OUT=<E: 또는 F: 경로> node site/build.mjs
node scripts/pages/v3-fixed-facts.mjs --check             # 고정 사실 동결 검사
node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --all   # 금지어 검사
```

작업트리·검증용 사본·빌드 출력은 E: 또는 F: 드라이브에만 만든다(소유자 지시 2026-11-13).

## 저장소 구성

| 경로 | 내용 |
|---|---|
| `data/sql/` | 공개 데이터 정본(SQL). 사이트 빌드의 유일한 입력 |
| `site/` | GitHub Pages 사이트 빌드(`build.mjs`, VitePress 테마, 지도·인물 페이지 생성) |
| `docs/CANON-BIBLE.md`, `docs/design/v3/` | 세계관 골격과 v3 바이블 |
| `docs/drafts/` | 위키 문서 초안, 인물 배치 입력, 작업 보고서(`reports/`) |
| `docs/research/` | 설계 근거 조사(CK3 역공학, 도시국가 정치 등) |
| `artifacts/seoul-showcase/` | 위키에 함께 게시되는 쇼케이스(글 전용, 음성 없음) |
| `gdd/` | 게임 설계 정본(JSON). 공개 GDD 페이지는 `data/sql/080`에서 만든다 |
| `scripts/pages/` | 문서 반영(`rewrite-doc.mjs`), 인물 적용(`v3-apply-people.mjs`), 동결 검사, 금지어 검사, 릴리즈 노트 |
| `lore/`, `src/`, `server/`, `scripts/cast-sqlite/` | 옛 React 위키·PostgreSQL 시절의 도구와 안내. 이관 기록과 도구로만 남아 있으며 지금 공개 빌드에는 쓰이지 않는다 |
| `vendor/seoul-dengoku-inkos` | 소유자의 InkOS 포크(서브모듈). 위키 생성·검사·배포에 참여하지 않는다 |

## 기여

1. `docs/CANON-BIBLE.md` 1~3절과 `docs/design/v3/README.md`를 먼저 읽는다. 골격과 고정 사실은 바꾸지 않는다.
2. 세계관 용어는 지금 실제로 쓰는 말을 국립국어원 표준국어대사전 기준으로 쓴다. 지어낸 말과 다른 작품·역사의 비유 낱말은 세계 안 문장에 쓰지 않는다.
3. 지어낸 항목은 잠정으로 표시하고 원장에 올린다. 소유자가 답하기 전에는 확정으로 쓰지 않는다.
4. 전용 브랜치에서 작업하고 위 검사를 통과한 뒤 main으로 PR을 연다. main 병합은 소유자만 한다.
5. 실존 인물·회사·상표·다른 게임의 고유 명칭은 쓰지 않는다.

[CONTRIBUTING.md](CONTRIBUTING.md), [docs/RELEASING.md](docs/RELEASING.md)(버전과 갱신 이력)를 함께 본다.

## License

[소프트웨어 MIT 허락과 위키 소유 콘텐츠의 별도 이용 조건](LICENSE). 외부 자료와 기여자 권리는 해당 문서의 적용 범위를 확인하세요.
