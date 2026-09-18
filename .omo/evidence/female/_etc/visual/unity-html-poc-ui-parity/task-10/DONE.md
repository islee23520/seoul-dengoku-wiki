# Task 10 - bind local-review Seoyun sprite with provenance banner

## Outcome

Completed on `feat/unity-html-poc-ui-parity`, starting from `fac476a`.

The first allied commander token (`PlayerCommanderId`, unit id `ally-guard-1`, or id containing `서윤`) now uses a world `SpriteRenderer` loaded from `Resources.Load<Texture2D>("LocalReview/ally-guard-1-local-review")`. Other units remain placeholder voxel meshes. A TMP provenance banner on the HUD (not the world view) reads `로컬 리뷰 파생물 · 원본 아틀라스 미수록`.

The original PNG, manifest, and provenance under `Presentation/LocalReview/` were already on disk and were kept. A runtime copy was added under `Presentation/Resources/LocalReview/` so `Resources.Load` works without claiming a licensed atlas or touching `RuntimeSlotCatalog`.

## Scope and decision

- World bind lives in `FoundationBattleView.Refresh` so existing host pointer wiring stays additive.
- HUD banner is authored in `UguiHudBuilder.BuildBattleHud` as TMP on the overlay canvas. EditMode forbids TMP on the world view; the existing world-view TMP count assertion remains 0.
- Sprite load uses Resources rather than a serialized host field so EditMode `FoundationBattleView.Create` can bind without scene serialization.
- Billboard the sprite against `ViewCamera` so unit facing does not flatten the quad.
- First 128x128 cell of the 1024x768 sheet is used as a static idle frame.

No Core, RuntimeSlotCatalog, pilgrimage knight-idle, git clean/reset, checkout, or push.

## GREEN verification

Unity executable: `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity`.
Every Editor invocation used `-batchmode`; no visible Editor.

- Import: `import.log` contains `UI_TOOLKIT_IMPORT_OK`. Unity generated `.meta` for LocalReview, Resources, and the runtime PNG.
- `editmode.xml`: **6 passed, 0 failed**, 7,513 bytes. Filter: `Janseon.Foundation.Tests.FoundationBattleViewTests`.
  - Allied commander has a SpriteRenderer and no placeholder meshes; other units have meshes and no SpriteRenderer.
  - HUD TMP banner text matches; world view TMP count remains 0.
  - Existing grid, ring, arrow, and hover tests still pass.
- `git diff --check` passed.

Commands:

```text
Unity -batchmode -quit -projectPath Game -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportUiToolkitAssets -logFile .omo/evidence/unity-html-poc-ui-parity/task-10/import.log
Unity -batchmode -projectPath Game -runTests -testPlatform EditMode -testFilter Janseon.Foundation.Tests.FoundationBattleViewTests -testResults .omo/evidence/unity-html-poc-ui-parity/task-10/editmode.xml -logFile .omo/evidence/unity-html-poc-ui-parity/task-10/editmode.log
```

Unity wrote the XML under `Game/.omo/...`; the file was copied to this evidence directory.

## Manual QA and limits

No Play Mode screenshot. Unity was free after EditMode, but this task asked for C# bind evidence and treated a screenshot as optional. Visual verification of the sprite on the live battlefield viewport was not captured.

## Known baseline / risks

- Default TextureImporter for the Resources PNG is Default (not Sprite, not Read/Write). `Sprite.Create` from `Resources.Load<Texture2D>` succeeded in EditMode; a player build may still need importer type Sprite / readable if GPU texture access fails.
- Production battle unit ids are `ally-0`…; `ally-guard-1` is the formation-editor id. Bind therefore also matches `PlayerCommanderId` so the first allied commander receives the sprite in the live battle.
- Banner is not in `GameplayRequired`; existing required-name tests do not assert it.
- No claim that the PNG is a licensed original atlas entry. Provenance remains local-review derivative.

## Cleanup and delivery

Editor exited; `Game/Temp/UnityLockfile` was absent after verification. No Core modifications, no RuntimeSlotCatalog edits, no git clean/reset, no push.
