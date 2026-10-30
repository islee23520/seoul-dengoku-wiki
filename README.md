# Seoul Subway States — Official Wiki

This repository holds the world canon ("lore") of **Seoul Subway States** (서울전국), a character-centered grand-strategy game set in the subway network of post-collapse Seoul, together with the React application that publishes it as the official wiki at <https://seoul-dengoku.linalab.io/wiki/>.

The public wiki renders Korean pages only. Generated files are never edited by hand; contract checks reject the retired English catalog and generated English documents.

PostgreSQL `wiki`가 현재 운영 저작 정본이며 typed 레코드와 문서 head를 보유한다. 비공개 editorial·Soul 데이터는 별도 `wiki_private` 권한 경계로 보호한다. 저작 CLI와 문서 API는 SQLite 폴백 없이 PostgreSQL을 사용한다. 운영 승격은 커밋 `24f3c676f7df0b9903e02f4278ac65bf8fac688f`, run `20261030T150126Z-11560`에서 `deployed`로 확인됐다([운영 관측](deploy/README.md#운영-전환-관측-2026-10-30)). 앞선 격리 환경의 SQLite·PG reader 대사, 전체 worker 출력 1,433개 동등성, 일반 PG 빌드 및 `check-contract`·`check:artifacts`·게이트 통과는 별도의 이관 검증 기록이며 운영 배포 증거를 대신하지 않는다.

Retained SQLite files, including the tracked `data/canonical/wiki-cast.sqlite`, are explicit migration/comparison archives only, not runtime inputs or an editable production authority. Keep those archives and the previous deployment rollback available; this cutover does not authorize their deletion. PostgreSQL historical evidence (`wiki.source_file` bytes/hashes, `source_record` provenance and sealed revisions) must also remain immutable. Do not rewrite historical bytes to match edited heads.

Generation and the document API share current-source and category-publication predicates. Category-ready drafts may be published under the existing catalog policy without changing their editorial approval status. Excluded sources, examples, private namespaces and retired cast articles are not published. Typed public routes derive from the selected document's logical filename; historical `article_route` and publication-admission rows do not freeze that route inventory. Computed index/glossary derivations retain their explicit stored bindings.

## Repository layout

| Path | Contents |
|---|---|
| `lore/` | Domain guidance and logical document namespaces; historical `.json` paths identify database documents/provenance, not source files to recreate. |
| `lore/authoring*.schema.json`, `lore/AUTHORING-JSON.md` | Typed document/envelope contract and editorial procedures. |
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
node scripts/lore-json-validate.mjs --strict   # document schema/content validation; not deployment proof
node scripts/check-contract.mjs               # generated Korean-only publication contract
# Migration-only reconciliation: consult scripts/postgres-migration/reconcile.mjs.
# Its --pg argument can expose credentials in process arguments; use a protected environment.
```

Test suites were removed by owner decision (2026-10-26). Data reconciliation, generated-output checks, semantic review and deployment verification are separate; none grants source approval.

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

GitHub Actions keeps its default non-recursive checkout. Woodpecker explicitly disables recursive submodule cloning for CI and deployment; the runtime Dockerfile copies only the required `vendor/*.tgz` packages, never the InkOS source or build.

Character creation sheets and portrait generation tools are maintained in [seoul-dengoku-tools](https://github.com/islee23520/seoul-dengoku-tools), not in a sibling checkout required by this wiki. Reference the [character sheet tool](https://github.com/islee23520/seoul-dengoku-tools/tree/main/TOOL/tools/sheet-local) and [portrait generation tools](https://github.com/islee23520/seoul-dengoku-tools/tree/main/TOOL/avatar-gen/portrait) through their remote GitHub URLs. The wiki owns the character canon and published sheets; the tools repository owns their authoring tools.

## Contributing

1. Read [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md) in full, then the `AGENTS.md` of the area you are editing.
2. Public narrative content is Korean-only; an English translation is not a publication prerequisite. Preserve historical multilingual evidence rather than rewriting it for the public locale policy.
3. Edit supported typed PostgreSQL documents through `scripts/cast-sqlite/document-cli.mjs`, never generated pages or restored JSON source files. Edits create draft revisions and do not inherit approval. Atlas logical IDs likewise refer to database records, not JSON authoring files.
4. Run the checks above and open a pull request from a dedicated branch. Only the owner merges into `main`.
5. A card or story that uses a real person needs that person's recorded permission and a legal note before it is merged. Real companies, products, logos and current executives never appear in the fiction.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the CI details.

## 한국어 안내

서울전국 공식 위키의 세계관 원천과 위키 앱을 관리하는 저장소입니다. 공개 본문은 한국어로 제공하며 생성물은 손으로 고치지 않습니다. 편집 전에 [세계관 편집 지침](WORLD_BUILDING_GUIDE.md)을 끝까지 읽어 주세요.

## License

[소프트웨어 MIT 허락과 위키 소유 콘텐츠의 별도 이용 조건](LICENSE). 외부 자료와 기여자 권리는 해당 문서의 적용 범위를 확인하세요.
