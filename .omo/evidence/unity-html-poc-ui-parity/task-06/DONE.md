# Task 06 - Six-unit 3×3 formation editor chrome

Implemented on `feat/unity-html-poc-ui-parity`, based on 08ba90d (portrait commander card dock).

## Design and integration

- Replaced the centered NESW-only `formation-edit` modal in `UguiHudBuilder.BuildGameplay` with a 370px right rail: six named unit buttons (서윤/민재/하린/도윤/지우/은호), a 3×3 destination slot grid (empty dashed / occupied / selected), selected-unit report (name / 근위 / 방벽 01), confirm / re-edit / reset, and facing as a selected-unit control rather than the only editor.
- New labels are TMP + NanumGothic SDF. Campaign 3-member `deploy-toggle-*` rows stay on `deploy-panel` and are not this editor.
- `GameplayPresenter` still constructs through `GameplayUiHost`. Confirm remains the only `FormationEditConfirmChosen` fire; EditFormation, unit, slot, reset, and re-edit do not deploy. Facing buttons remain for the selected unit. No UI Toolkit, no Core edits, no HTML POC edits, no world gizmos, no undo of the 132×180 card dock.

## Real RED -> GREEN evidence

Unity executable: `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity`
Project: `/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-mac/Game`
Every Editor invocation waited on `Game/Temp/UnityLockfile`.

- `red.xml`: real NUnit, 9,090 bytes, total=4, passed=0, failed=4. Failures: missing unit `formation-edit-unit-ally-guard-1` (NESW-only), missing selected-name report, rail width 420 not ~370, missing slot/unit controls before confirm-gating. Assertions were retained for GREEN.
- `green.xml`: real NUnit, 5,975 bytes, total=4, passed=4, failed=0, skipped=0. Class `FormationEditScreenTests` ran all four methods. Parsed with Python ElementTree; not handwritten.

Command:

```sh
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode \
  -testFilter "FormationEditScreenTests" \
  -testResults .omo/evidence/unity-html-poc-ui-parity/task-06/green.xml
```

## Manual QA limits

- EditMode chrome/contract only. No 1280×720 graphics screenshot of the right rail in this todo (task 11 owns the capture matrix).
- Slot occupancy chrome is the HTML initial placement; live Core Deploy still happens only on confirm via existing `PocCoreLoopController.OnFormationEditConfirm`.
- World gizmos remain todo 8.

## Cleanup and residual risks

- No Mac main checkout, no git clean, no Core edits, no HTML POC edits, no push.
- Stray `Game/.omo` copy from the relative `-testResults` RED path was removed.
- PlayMode D2 tests still click `edit-formation` as deploy; that path is unchanged until todo 12 retargets HUD tests.

Plan: .omo/plans/unity-html-poc-ui-parity.md
