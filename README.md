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

## Repository layout

| Path | Contents |
|---|---|
| `lore/` | Domain guidance and logical document namespaces; historical `.json` paths identify database documents/provenance, not source files to recreate. |
| `lore/authoring*.schema.json` (logical DB schema identifiers), `lore/AUTHORING-JSON.md` (guide) | Typed document/envelope contracts and editorial procedures. Schema identifiers do not imply physical JSON source files to restore. |
| `lore/editorial/` | Editorial guidance; private source data is not published. |
| `scripts/` | PG readers and authoring, generation, validators, and migration-only SQLite tooling. See `scripts/cast-sqlite/README.md`. |
| `src/` | The React wiki application. `src/generated/` is build output. |
| `docs/editorial/` | Dated editorial records (audits, studies). They are historical records, not rules. |

## Local build

Requires Node.js 24.15.0 or newer for the retained SQLite migration tools; deployment uses Node 26. PostgreSQL connection secrets and private generation inputs must be supplied outside the repository.

```sh
npm ci --ignore-scripts
npm run dev          # local wiki with live reload
node scripts/cast-sqlite/document-cli.mjs list --corpus current # WIKI_AUTHORING_PG required (or WIKI_DOCUMENT_PG)
node server/wiki-document-api.mjs # WIKI_DOCUMENT_PG or secure WIKI_DOCUMENT_PG_FILE required
# Protected integration environment: WIKI_DOCUMENT_PG_FILE and WIKI_GENERATION_PRIVATE_PG_FILE:
node scripts/generate-release.mjs --verify-pg
```

`--verify-pg`는 임시 stage에서 worker를 검증하며 live output 변경·승격·빌드를 수행하지 않는다. 정식 생성·빌드 진입점인 `npm run generate` / `npm run build`의 일반 PG 실행은 이제 허용된다. 메타데이터 검증, 단일 PostgreSQL 스냅샷 및 비공개 입력의 스냅샷·출처 검증은 그대로 유지한다. 이 검증을 우회하거나 SQLite 폴백으로 전환 성공을 주장하지 않는다. 격리 환경의 빌드·검사 통과와 정확한 SHA 기준 운영 배포 확인은 별도 게이트다.

`npm run generate` and `npm run build` require public and generation-private PostgreSQL connections. Protected builders pass `WIKI_DOCUMENT_PG_FILE` and `WIKI_GENERATION_PRIVATE_PG_FILE`; each names a runtime-user-owned regular file with mode 0600 containing its connection URL. Symlinks are rejected. Readers resolve files without copying URLs into child environment variables. Direct `WIKI_DOCUMENT_PG` and `WIKI_GENERATION_PRIVATE_PG` remain supported outside the protected builder; a scoped URL and file cannot both be configured. Neither mode loads a private SQLite bootstrap environment. For migration diagnostics only, when neither public PostgreSQL source is configured, set `WIKI_MIGRATION_SQLITE=1` and explicitly provide `WIKI_DOCUMENT_DB` plus any other required migration inputs. PostgreSQL takes precedence over the diagnostic flag. `--recover` remains database-independent; `--verify-pg` always requires both PostgreSQL connections. Invoke the catalog worker only through the authenticated release stage, not directly against live output.

A few build inputs (for example the creative-name normalization ledger) live outside this repository. The generator looks for them in the directory named by `SEOUL_KENSHI_ROOT` or in the parent directories of this checkout.

## Checks

```sh
# External SQLite migration diagnostics only; not a current PG-head validator:
WIKI_DOCUMENT_DB=/absolute/external/snapshot.sqlite node scripts/lore-json-validate.mjs --strict
node scripts/check-contract.mjs               # generated Korean-only publication contract
# Migration-only reconciliation: consult scripts/postgres-migration/reconcile.mjs.
# Its --pg argument can expose credentials in process arguments; use a protected environment.
```

The former `test:*` npm scripts/workflows were removed by owner decision (2026-10-26). Retained InkOS adapter tests are not the production publication gate and currently fail on a deleted hardcoded SQLite dependency; an external `WIKI_DOCUMENT_DB` alone cannot repair that reader ([regression boundary](CONTRIBUTING.md#testing-rules)). Data reconciliation, generated-output checks, semantic review and deployment verification are separate; none grants source approval.

## Character creation tools

### Owner's InkOS fork

`vendor/seoul-dengoku-inkos` is a Git submodule of [the owner's fork](https://github.com/islee23520/seoul-dengoku-inkos), pinned to `3d64cb3b796f0d49c023069840c0b4be54ff97dd` on `master` (the merged Korean support). This keeps third-party code beside the existing vendored packages, outside wiki source and publication inputs. Installation always uses the committed pin, not the latest remote branch.

Requires Node.js >=22.16.0, Git and npm. No global InkOS or pnpm installation is needed:

```sh
npm run inkos:install                     # initialize pin, pnpm 10 frozen install and build
npm run inkos -- --help
npm run inkos -- --version
```

Create InkOS projects outside the wiki checkout. The wrapper preserves the caller's working directory, including when npm selects this repository using `--prefix`:

```sh
cd /path/to/separate-writing-directory
npm --prefix /path/to/seoul-dengoku-wiki run inkos -- init --lang ko
```

InkOS runs as a separate process. Do not give it PostgreSQL canonical/private credentials or SQLite migration databases to read or write. It does not participate in wiki generation, approval, publication or deployment. The existing [candidate-only, read-only database adapter](scripts/inkos-adapter/README.md) remains the boundary; this integration does not connect InkOS directly to it or change its approval rules. LLM configuration remains global at `~/.inkos/.env`; never commit credentials. Help, version and project initialization do not require model calls.

Woodpecker explicitly disables recursive submodule cloning for CI and deployment; the runtime Dockerfile copies only the required `vendor/*.tgz` packages, never the InkOS source or build. The former GitHub Actions test workflows are not a current integration gate.

Character creation sheets and portrait generation tools are maintained in [seoul-dengoku-tools](https://github.com/islee23520/seoul-dengoku-tools), not in a sibling checkout required by this wiki. Reference the [character sheet tool](https://github.com/islee23520/seoul-dengoku-tools/tree/main/TOOL/tools/sheet-local) and [portrait generation tools](https://github.com/islee23520/seoul-dengoku-tools/tree/main/TOOL/avatar-gen/portrait) through their remote GitHub URLs. The wiki owns the character canon and published sheets; the tools repository owns their authoring tools.

## Contributing

1. Read [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md) in full, then the `AGENTS.md` of the area you are editing.
2. Public narrative content is Korean-only; an English translation is not a publication prerequisite. Preserve historical multilingual evidence rather than rewriting it for the public locale policy.
3. Edit supported typed PostgreSQL documents through `scripts/cast-sqlite/document-cli.mjs`, never generated pages or restored JSON source files. Edits create draft revisions and do not inherit approval. Atlas logical IDs likewise refer to database records, not JSON authoring files.
4. Run the checks above and open a pull request from a dedicated branch. Only the owner merges into `main`.
5. A card or story that uses a real person needs that person's recorded permission and a legal note before it is merged. Real companies, products, logos and current executives never appear in the fiction.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution and verification boundaries and [deploy/README.md](deploy/README.md) for CI/deployment procedures and dated operational observations.

## 한국어 안내

서울전국 공식 위키의 세계관 원천과 위키 앱을 관리하는 저장소입니다. 공개 본문은 한국어로 제공하며 생성물은 손으로 고치지 않습니다. 편집 전에 [세계관 편집 지침](WORLD_BUILDING_GUIDE.md)을 끝까지 읽어 주세요.

## License

[소프트웨어 MIT 허락과 위키 소유 콘텐츠의 별도 이용 조건](LICENSE). 외부 자료와 기여자 권리는 해당 문서의 적용 범위를 확인하세요.
