# Task 05 - Portrait commander card dock

Implemented on `feat/unity-html-poc-ui-parity`, based on 018e492.

## Design and integration

- Replaced the 250px left HudButton column in `UguiHudBuilder.BuildGameplay` with a battlefield-dominant battle HUD and a bottom `battle-dock`.
- Four Core character offerings are 132×180 portrait cards (`guard-shieldwall`, `encourage-morale`, `pincer-focus`, `mobility-regroup`): gold 2px `#AD8C47` frame, 107px art, TMP titles. Shared acting-card cooldown veil lives on `encourage-morale` as `battle-card-cooldown` / mask / text (bottom-up veil).
- Owner identity is a 32×32 `battle-card-owner-portrait` plus TMP `battle-card-owner`. Stronghold cards sit behind a 44px `battle-card-stronghold-switch` ("거점 카드"), not duplicated per owner.
- Cancel is a 44×44 Button, inactive until targeting. NESW TMP labels exist for name-contract tests but start inactive; they are not the live targeting UI.
- Zoom chrome is − / 100% / + / 기본 (44px). Data-contract fingerprints sit behind `data-contract-disclosure` with `data-contract-body` closed by default.
- Korean TMP title `잔선: 서울 · 지휘관 카드 전투` uses NanumGothic SDF. The TMP renderer stays disabled until `GameplayPresenter.Bind` so EditMode `TryAddCharacters` still rasterizes Hangul (TMP returns false when the atlas already contains those glyphs).
- Required Gameplay names remain: formation NESW modal, 5×5 diagnostic grid, play/pause, card-general-use, mobility-regroup button, battle log. No UI Toolkit, no Core edits, no 3×3 formation editor, no world gizmos.

## Real RED -> GREEN evidence

Unity executable: `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity`
Project: `/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-mac/Game`
Every Editor invocation waited on `Game/Temp/UnityLockfile`.

- `red.xml`: real NUnit, 8,801 bytes, total=4, passed=0, failed=4. Failures: missing 132×180 cards, cancel not a Button, missing title, missing 32×32 portrait. Assertions were retained for GREEN.
- `green.xml`: real NUnit, 5,998 bytes, total=4, passed=4, failed=0, skipped=0. Class `PortraitCommanderCardDockTests` ran all four methods. Parsed with Python ElementTree; not handwritten.

Command:

```sh
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode \
  -testFilter "PortraitCommanderCardDockTests" \
  -testResults .omo/evidence/unity-html-poc-ui-parity/task-05/green.xml
```

## Manual QA limits

- EditMode geometry/TMP contract only. No graphics screenshot of empty HUD chrome in this todo (task 11 owns the capture matrix).
- Targeting math remains `OwnerCardTargetingMachine`; this todo does not wire Confirm / arrows.
- Formation remains the NESW modal until todo 6.

## Cleanup and residual risks

- No Mac main checkout, no git clean, no Core edits, no HTML POC edits, no push.
- `BattleCardCancel:visible` snapshot flag is still true; production cancel hide is the builder default until targeting wiring (todo 9).
- Minus-sign TMP warning for U+2212 was avoided by using ASCII `-` on zoom-out.

Plan: .omo/plans/unity-html-poc-ui-parity.md
