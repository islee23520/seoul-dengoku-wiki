# Seoul Subway States — Official Wiki

This repository holds the world canon ("lore") of **Seoul Subway States** (서울전국), a character-centered grand-strategy game set in the subway network of post-collapse Seoul, together with the React application that publishes it as the official wiki at <https://seoul-dengoku.linalab.io/wiki/>.

Every public document is authored once as bilingual JSON (Korean and English side by side) and rendered into Korean and English pages. Generated files are never edited by hand.

## Repository layout

| Path | Contents |
|---|---|
| `lore/` | Authoring sources, one JSON document per page, grouped by domain (`characters/`, `factions/`, `culture/`, `places/`, `bestiary/`, …). `lore/World-Narrative-Atlas.json` is the machine registry from which the 34 atlas projection pages are generated. |
| `lore/authoring*.schema.json`, `lore/AUTHORING-JSON.md` | The JSON authoring contract and its schemas. |
| `lore/editorial/` | Internal editorial rules and ledgers. They are not published. |
| `scripts/` | Catalog generation, atlas materialization, validators, the publication gate and their tests. |
| `src/` | The React wiki application. `src/generated/` is build output. |
| `docs/editorial/` | Dated editorial records (audits, studies). They are historical records, not rules. |

## Local build

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev          # local wiki with live reload
npm run build        # generate the catalog, type-check, build dist/
node scripts/gate.mjs   # scan the built site for banned terms, private links and broken links
```

A few build inputs (for example the creative-name normalization ledger) live outside this repository. The generator looks for them in the directory named by `SEOUL_KENSHI_ROOT` or in the parent directories of this checkout.

## Checks

```sh
node scripts/lore-json-validate.mjs            # changed files plus the migration ledger
node scripts/lore-json-validate.mjs --strict   # every lore document
node scripts/materialize-world-atlas.mjs --atlas lore/World-Narrative-Atlas.json --out lore --check
npm run test:lore-json
npm run test:gate
```

Every `npm run test:*` script is a separate test group. Pull requests to `main` run the lore JSON checks in CI (`.github/workflows/lore-pr-checks.yml`).

## Contributing

1. Read [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md) in full, then the `AGENTS.md` of the area you are editing.
2. Proposals may be written in Korean or English. Before a change is merged, every narrative field carries both a Korean and an English value in the same JSON node.
3. Edit the JSON source, never a generated page. For atlas pages, edit `lore/World-Narrative-Atlas.json` and regenerate the projections.
4. Run the checks above and open a pull request from a dedicated branch. Only the owner merges into `main`.
5. A card or story that uses a real person needs that person's recorded permission and a legal note before it is merged. Real companies, products, logos and current executives never appear in the fiction.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the CI details.

## 한국어 안내

서울전국 공식 위키의 세계관 원천과 위키 앱을 관리하는 저장소입니다. 공개 본문은 `lore/`의 JSON 한 벌에 한국어와 영어를 함께 적고, 생성물은 손으로 고치지 않습니다. 편집 전에 [세계관 편집 지침](WORLD_BUILDING_GUIDE.md)을 끝까지 읽어 주세요.

## License

[소프트웨어 MIT 허락과 위키 소유 콘텐츠의 별도 이용 조건](LICENSE.md). 외부 자료와 기여자 권리는 해당 문서의 적용 범위를 확인하세요.
