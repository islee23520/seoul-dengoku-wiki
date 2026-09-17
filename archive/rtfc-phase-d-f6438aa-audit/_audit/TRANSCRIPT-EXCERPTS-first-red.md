# TRANSCRIPT-EXCERPTS — surviving evidence of the FIRST RED (stub, 01:36:25)

All quotes below are verbatim stdout of diagnostic commands executed by the
working session against docs/verification/ulw-execute/rtfc/phase-d/driver/ on
the Windows host. The first-RED raw files themselves no longer exist on the
host (overwritten ~01:45 by the miscue run — see AUDIT_README.md chronology).
These excerpts are the surviving record of that run. They are not host
artifacts.

## 1) First-RED completion state (read ~01:37, immediately after the run)

Command: PS over E:\git\seoul-kenshi-wt\rtfc-phase-d\docs\verification\ulw-execute\rtfc\phase-d\driver

```json
{
    "UnityProcs":  "",
    "LogSize":  42854,
    "LaunchLog":  "LAUNCH_START 2026-09-09  1:36:25.64  | UNITY_EXIT=2 "
}
```

Interpretation: focused EditMode run (testFilter
Janseon.Foundation.Tests.BattleSessionDriverTests) launched 01:36:25 host
time; Unity exit code 2 = behavioral test failures (UTF convention; 0 = pass,
2 = failures); 42,854-byte raw log written to red-editmode.log.

## 2) First-RED NUnit results (red-editmode.xml, before overwrite)

Output of the XML reader executed against red-editmode.xml while it still
held the stub run:

```
EXITFILE=
XML_TOTAL=6 PASSED=1 FAILED=5 INCONCLUSIVE=0 SKIPPED=0 RESULT=Failed(Child)
DONE
```

(EXITFILE printed empty due to the cmd `2>` redirect parse bug in the runner;
the true exit code is the UNITY_EXIT=2 line above. Fixed in later runners.)

## 3) First-RED per-case results (same XML, second reader pass)

```
CASE|Janseon.Foundation.Tests.BattleSessionDriverTests.Driver_IsVContainerTickableEntryPoint|Passed
CASE|Janseon.Foundation.Tests.BattleSessionDriverTests.DriverRun_MatchesDirectReplay_RegardlessOfFrameTiming|Failed
CASE|Janseon.Foundation.Tests.BattleSessionDriverTests.FrameBurst_ClampsToFourStepsAndBoundsCarry|Failed
CASE|Janseon.Foundation.Tests.BattleSessionDriverTests.Pause_IsHashNeutral_AndPreservesTimeline|Failed
CASE|Janseon.Foundation.Tests.BattleSessionDriverTests.TickBudget_StopsSteppingAtMaxTicks|Failed
CASE|Janseon.Foundation.Tests.BattleSessionDriverTests.TickCadence_AtThirtyHertz_AdvancesExactlyOneStepPerInterval|Failed
DONE=True;EXITFILELEN=0
```

(The same reader pass printed `MSG|System.Xml.XmlElement` per failure — a
stringification bug in the reader; per-case failure MESSAGES of the first RED
were therefore never decoded. Failure messages survive only for the miscue
run (real driver, failed=3) and the red2 recapture. The per-case results
above are complete and verbatim.)

## 4) What the first RED demonstrated

Compilation was clean (6 tests executed, no CS errors in the log), and five
contract tests failed on assertions because the stub pump was a no-op:
cadence (0 steps), burst clamp (0 steps), pause timeline (0 steps), replay
equality (0 steps), tick budget (0 steps). The production accumulator pump
was authored only after this capture.

## 5) For contrast: miscue run (~01:45, REAL driver under red names)

```
CASE|…Driver_IsVContainerTickableEntryPoint|Passed
CASE|…DriverRun_MatchesDirectReplay_RegardlessOfFrameTiming|Passed
CASE|…FrameBurst_ClampsToFourStepsAndBoundsCarry|Failed  (Expected: 4, But was: 0)
CASE|…Pause_IsHashNeutral_AndPreservesTimeline|Failed    (Expected: 10, But was: 9)
CASE|…TickBudget_StopsSteppingAtMaxTicks|Passed
CASE|…TickCadence_AtThirtyHertz_AdvancesExactlyOneStepPerInterval|Failed (Expected: 30, But was: 29)
```

Full messages/stacks are preserved in miscue-real-driver-editmode.xml (in
this export). Root cause: clock primed on first Tick() instead of Attach().

## 6) Stub recapture (red2, 01:44:02 launch, stub restored)

```
LAUNCH=LAUNCH_START 2026-09-09  1:44:02.90  | RED2_EXIT=2
EXIT=2
XML_TOTAL=6 PASSED=1 FAILED=5 RESULT=Failed(Child)
```

per-case: identical 1-Passed/5-Failed split as the first RED. Raw files
red2-editmode.{xml,log.txt,exit,done} + red2-launch.log.txt are in this
export. This is the RECAPTURE, not the first capture.
