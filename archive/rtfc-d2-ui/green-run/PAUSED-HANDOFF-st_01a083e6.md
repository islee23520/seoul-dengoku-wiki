# D2 paused handoff - st_01a083e6

Paused by explicit user direction before HTML/Three.js POC review.

## Windows source

- Worktree: `E:/git/seoul-kenshi-wt/rtfc-phase-d`
- Branch: `rtfc/phase-d`
- HEAD: `baaeb8a5b46404f0e866c795cf65c1f431673ca4`
- No D2 commit was created.
- Fourteen tracked files remain modified; `diff.txt` and all 17 inherited `PlayMode_Log*.txt` files remain untouched.
- Installed capture source SHA-256: `1f18f83951b10a1fbc75bcbf72edde7fe28cdd362346e04079f39d6c8d26e858`.
- `diff.txt`: 41,420 bytes, SHA-256 `e6fefce36f4267086223a40d8df040aca24db93cf64e912cae6c4cf91fa63121`.

## Preserved verification evidence

- Focused D2Ui PlayMode: 5/5, exit 0 (in inherited verifier archive).
- Related PlayMode: 4/4, exit 0 (in inherited verifier archive).
- Corrected EditMode `Janseon.Foundation.Tests.UiToolkitScreenTests`: 15/15, exit 0; XML SHA-256 `c7e85636713af8832e49ae7431d08ee993aa974c7f542693b5e619a79518511d`.
- Production Canvas capture: 1/1, exit 0; XML SHA-256 `a2a7870783e2602fdea982d0009b2435477f747cc725b9a35ef4d73bca977d7f`.
- Capture produced 10 PNGs and 10 source-fingerprint receipts under `capture/captures`.
- Capture validator result is FAIL with exactly two errors: C1/C2 missing title focus-ring pixels. All other matrix cells passed structural validation.
- Receipt inspection found `active_scene` currently records persistent Bootstrap rather than the Canvas-owning MainTitle/Foundation scene.
- Actual images were opened: title, route/BasePreparation, encounter, paused battle/card, and settlement. The packet is preserved as failure evidence, not PASS.

## Pending patch, not applied

- `bridge/revised-green-v2/07-fix-title-focus-and-receipt-scene.apply_patch`
- SHA-256: `1cb2cdfcf8637c3df7528b3be796773139e1c169760685b1cb0af655216844ad`
- It adds the required title button gold Outline and records `canvasRoot.gameObject.scene.path` in receipts/state hashes.
- It must not be applied until the user reviews the requested HTML/Three.js POCs and authorizes Unity work to resume.

## Runtime ownership release

- Unity processes: 0 before cleanup.
- Worker-owned task to remove: `OmoRtfcD2UiGreenCapture_st_01a083e6`.
- Five inherited producer tasks named `*st_01a08368` are not this worker's resources and are left unchanged.
