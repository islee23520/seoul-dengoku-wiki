# RTFC Phase C simple repair verification

## Passage contract

`passage-retreat` is a selected stronghold card that grants friendly retreat availability for 150 simulation ticks. `OrderRetreat` is rejected with `RetreatUnavailable` unless that grant is active. It does not imply or assert enemy surrender coverage.

## Raw runs

- `red.xml`, `red.log`, `red.exit`: pre-implementation focused RED, 17 total / 9 passed / 8 failed, Unity exit 2.
- `green.xml`, `green.log`, `green.exit`: first focused GREEN after the behavior repair, 17/17, Unity exit 0.
- `post-tick-focused.xml`, `post-tick-focused.log`, `post-tick-focused.exit`: final affected fixtures (`RealtimeCardSettlementTests` + `RealtimeBattleSimTests`), 32/32, Unity exit 0.
- `post-tick-roundtrip.xml`, `post-tick-roundtrip.log`, `post-tick-roundtrip.exit`, `post-tick-roundtrip.transcript`: final public Core API campaign -> battle -> selected passage card -> recharge tick -> terminal player retreat -> settlement -> duplicate receipt -> return, 1/1, Unity exit 0.
- `final-editmode.xml`, `final-editmode.log`, `final-editmode.exit`: final full EditMode, 132 total / 130 passed / 2 failed, Unity exit 2. Exact pre-existing failures and causes are in `final-editmode-failures.txt`.

Earlier `focused.*`, `roundtrip.*`, `final-focused.*`, `final-roundtrip.*`, and `editmode.*` files preserve intermediate verified runs before later validation-only tightening. The XML and logs are direct Unity Test Runner outputs. Exit files preserve actual process exit codes; monitor files preserve background command completion lines.

## Gates not run

`npm --prefix tools test` and the architecture gate were not run because no tooling, architecture documentation, Foundation, asmdef, package, or asset input changed. No PlayMode test was added because the real public Core API roundtrip is deterministic and exercises the requested campaign/battle/card/settlement/return surface without Unity UI synchronization.
