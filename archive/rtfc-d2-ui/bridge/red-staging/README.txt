Required Windows worktree: E:/git/seoul-kenshi-wt/rtfc-phase-d
Required HEAD: baaeb8a5b46404f0e866c795cf65c1f431673ca4
Status at export: patch NOT applied; no D2 RED run performed.

current-inherited/ preserves the exact seven dirty source/test bytes.
target-after-red-patch/ contains the exact bytes expected after session apply_patch.
The six production targets are exact verified baaeb8a bytes; only CoreLoopPlayModeTests.cs adds five test-first D2Ui cases.
The formation case requires a player slot selection action (formation-swap-front) while Core remains undeployed, followed by a separate edit-formation confirmation that submits Deploy and changes the commander's resolved cell.
