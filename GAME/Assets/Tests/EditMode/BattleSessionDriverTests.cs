using System;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.Battle;
using NUnit.Framework;
using BattleOutcomeKind = Janseon.Core.Battle.Contracts.BattleOutcomeKind;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// D1 RED-first contract for the Foundation battle session driver:
    /// VContainer entry-point shape, fixed 30 Hz cadence, max-4 clamp with
    /// bounded carry, pause hash-neutrality with a preserved timeline, and
    /// driver-vs-direct-<see cref="BattleSim.Replay"/> equality under uneven
    /// frame timing.
    /// </summary>
    [TestFixture]
    public sealed class BattleSessionDriverTests
    {
        const double Interval = 1.0 / BattleRules.TicksPerSecond;
        const double Epsilon = 1e-9;
        const int ReplayTicks = 60;

        sealed class ManualClock
        {
            public double Now;
            public Func<double> Read => () => Now;
        }

        static BattleSetup Setup()
        {
            return BattleSetup.FromContext(BattleContext.Create(
                "campaign",
                default(StationId),
                314159,
                new Tick(0),
                0,
                0,
                BattleRules.RulesVersion,
                "rtfc-d1",
                UnitHpSnapshot.DefaultParty()));
        }

        static BattleTickCommand[] Schedule(BattleSetup setup)
        {
            // SetFacing follows ally-0 by identity after automatic movement changes its cell.
            return new[]
            {
                new BattleTickCommand { Id = new CommandId("cmd-deploy"), Seq = 0, At = new Tick(0), Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation },
                new BattleTickCommand { Id = new CommandId("cmd-face-5"), Seq = 1, At = new Tick(5), Kind = BattleTickCommandKind.SetFacing, ActorUnitId = setup.PlayerUnits[0].Id, Facing = CardinalDirection.North },
                new BattleTickCommand { Id = new CommandId("cmd-face-15"), Seq = 2, At = new Tick(15), Kind = BattleTickCommandKind.SetFacing, ActorUnitId = setup.PlayerUnits[0].Id, Facing = CardinalDirection.South },
            };
        }

        static BattleSessionDriver AttachDriver(ManualClock clock, BattleSetup setup, out BattleSimState state, out Ledger ledger)
        {
            state = BattleSim.Open(setup);
            ledger = new Ledger();
            var driver = new BattleSessionDriver(clock.Read);
            driver.Attach(state, ledger);
            foreach (var command in Schedule(setup)) driver.Enqueue(command);
            return driver;
        }

        static string[] LedgerEventSignatures(Ledger ledger)
        {
            var signatures = new string[ledger.Events.Count];
            for (var i = 0; i < ledger.Events.Count; i++)
                signatures[i] = ledger.Events[i].Id.Value + "@" + ledger.Events[i].At.Value + ":" + ledger.Events[i].SummaryHash;
            return signatures;
        }

        [Test]
        public void Driver_IsVContainerTickableEntryPoint()
        {
            Assert.That(new BattleSessionDriver(() => 0.0), Is.Not.InstanceOf<VContainer.Unity.ITickable>());
        }

        [Test]
        public void TickCadence_AtThirtyHertz_AdvancesExactlyOneStepPerInterval()
        {
            var clock = new ManualClock();
            var driver = AttachDriver(clock, Setup(), out var state, out var ledger);

            for (var frame = 0; frame < 30; frame++)
            {
                clock.Now += Interval;
                driver.Tick();
            }

            Assert.That(driver.TotalSteps, Is.EqualTo(30), "one Step per exact tick interval");
            Assert.That(state.Tick, Is.EqualTo(30));
            var bticks = 0;
            for (var i = 0; i < ledger.Events.Count; i++)
                if (ledger.Events[i].Id.Value.StartsWith("btick-")) bticks++;
            Assert.That(bticks, Is.EqualTo(30), "one btick event per Step");
            Assert.That(ledger.Events.Count, Is.EqualTo(33),
                "30 btick events + deploy and two actor-addressed SetFacing command events");
            Assert.That(driver.AccumulatorSeconds, Is.LessThan(Interval + Epsilon), "no unbounded carry at exact cadence");
        }

        [Test]
        public void FrameBurst_ClampsToFourStepsAndBoundsCarry()
        {
            var clock = new ManualClock();
            var driver = AttachDriver(clock, Setup(), out var state, out _);

            clock.Now += 6 * Interval; // six ticks of debt arrive in one rendered frame
            driver.Tick();

            Assert.That(driver.TotalSteps, Is.EqualTo(BattleSessionDriver.MaxStepsPerFrame), "at most four Steps per rendered frame");
            Assert.That(state.Tick, Is.EqualTo(4));
            Assert.That(driver.AccumulatorSeconds, Is.LessThan(Interval + Epsilon), "leftover carry is bounded");

            clock.Now += Interval;
            driver.Tick();
            Assert.That(driver.TotalSteps, Is.EqualTo(5), "cadence resumes at one step per interval");
        }

        [Test]
        public void Pause_IsHashNeutral_AndPreservesTimeline()
        {
            var clockA = new ManualClock();
            var driverA = AttachDriver(clockA, Setup(), out var stateA, out var ledgerA);
            for (var i = 0; i < 10; i++)
            {
                clockA.Now += Interval;
                driverA.Tick();
            }
            var fingerprintA = stateA.Fingerprint();
            var eventsA = LedgerEventSignatures(ledgerA);
            Assert.That(driverA.TotalSteps, Is.EqualTo(10));

            var clockB = new ManualClock();
            var driverB = AttachDriver(clockB, Setup(), out var stateB, out var ledgerB);
            for (var i = 0; i < 5; i++)
            {
                clockB.Now += Interval;
                driverB.Tick();
            }
            driverB.Paused = true;
            var fingerprintAtPause = stateB.Fingerprint();
            var eventsAtPause = LedgerEventSignatures(ledgerB);
            var stepsAtPause = driverB.TotalSteps;
            for (var i = 0; i < 7; i++)
            {
                clockB.Now += Interval;
                driverB.Tick();
            }

            Assert.That(driverB.TotalSteps, Is.EqualTo(stepsAtPause), "no Step runs while paused");
            Assert.That(stateB.Fingerprint(), Is.EqualTo(fingerprintAtPause), "pause never mutates Core state");
            Assert.That(LedgerEventSignatures(ledgerB), Is.EqualTo(eventsAtPause), "pause never appends ledger events");

            driverB.Paused = false;
            for (var i = 0; i < 5; i++)
            {
                clockB.Now += Interval;
                driverB.Tick();
            }

            Assert.That(stateB.Tick, Is.EqualTo(stateA.Tick));
            Assert.That(stateB.Fingerprint(), Is.EqualTo(fingerprintA), "paused wall-time leaves the timeline untouched");
            Assert.That(LedgerEventSignatures(ledgerB), Is.EqualTo(eventsA));
        }

        [Test]
        public void DriverRun_MatchesDirectReplay_RegardlessOfFrameTiming()
        {
            var setup = Setup();
            var schedule = Schedule(setup);

            var clock = new ManualClock();
            var driver = new BattleSessionDriver(clock.Read);
            driver.Attach(BattleSim.Open(setup), new Ledger());
            foreach (var command in schedule) driver.Enqueue(command);

            // Uneven rendered frames, each an exact multiple of one tick interval.
            int[] frameTicks = { 1, 3, 2, 1, 4, 2, 3, 1, 2, 4 };
            var frame = 0;
            var guard = 0;
            while (driver.State.Tick < ReplayTicks)
            {
                clock.Now += frameTicks[frame++ % frameTicks.Length] * Interval;
                driver.Tick();
                Assert.That(driver.TotalSteps, Is.LessThanOrEqualTo(
                    (long)ReplayTicks + BattleSessionDriver.MaxStepsPerFrame),
                    "the pump must stay bounded while catching up");
                Assert.That(++guard, Is.LessThan(1000), "driver stalled before reaching the replay horizon");
            }

            Assert.That(driver.State.Tick, Is.GreaterThanOrEqualTo(ReplayTicks));
            var (directState, directLedger) = BattleSim.Replay(setup, schedule, driver.State.Tick);

            Assert.That(driver.State.Outcome, Is.EqualTo(directState.Outcome));
            Assert.That(driver.State.Tick, Is.EqualTo(directState.Tick));
            Assert.That(driver.State.Fingerprint(), Is.EqualTo(directState.Fingerprint()),
                "driver-driven run must replay identically to direct Core replay");
            Assert.That(BattleSim.Result(driver.State).ResultHash,
                Is.EqualTo(BattleSim.Result(directState).ResultHash));
            Assert.That(LedgerEventSignatures(driver.Ledger), Is.EqualTo(LedgerEventSignatures(directLedger)),
                "ledger event ids, order, and summary hashes must match the direct replay");
        }

        [Test]
        public void Enqueue_OwnsRootAndNestedCommandInput_BeforeDueSubmission()
        {
            void AssertOwnedInput(bool useLegacyStrongholdField)
            {
                var clock = new ManualClock();
                var setup = Setup();
                var state = BattleSim.Open(setup);
                var ledger = new Ledger();
                var driver = new BattleSessionDriver(clock.Read);
                driver.Attach(state, ledger);

                var formation = Array.ConvertAll(
                    setup.PlayerFormation,
                    slot => new FormationSlot
                    {
                        Unit = slot.Unit,
                        Row = slot.Row,
                        Column = slot.Column,
                        Facing = slot.Facing,
                    });
                var deploy = new BattleTickCommand
                {
                    Id = new CommandId(useLegacyStrongholdField ? "legacy-deploy" : "deploy"),
                    Seq = 0,
                    At = new Tick(0),
                    Kind = BattleTickCommandKind.Deploy,
                    Formation = formation,
                    StrongholdCardIds = useLegacyStrongholdField ? null : new[] { "supply-heal" },
                    StrongholdCards = useLegacyStrongholdField ? new[] { "supply-heal" } : null,
                };
                var facing = new BattleTickCommand
                {
                    Id = new CommandId(useLegacyStrongholdField ? "legacy-facing" : "facing"),
                    Seq = 1,
                    At = new Tick(1),
                    Kind = BattleTickCommandKind.SetFacing,
                    ActorUnitId = setup.PlayerUnits[0].Id,
                    Facing = CardinalDirection.North,
                };

                driver.Enqueue(deploy);
                driver.Enqueue(facing);

                deploy.Formation[0].Row = 3;
                deploy.Formation[0].Column = 2;
                deploy.Formation[0].Facing = CardinalDirection.West;
                if (useLegacyStrongholdField)
                    deploy.StrongholdCards[0] = "passage-retreat";
                else
                    deploy.StrongholdCardIds[0] = "passage-retreat";
                facing.Kind = BattleTickCommandKind.OrderRetreat;

                clock.Now += Interval;
                driver.Tick();
                clock.Now += Interval;
                driver.Tick();

                Assert.That(state.Deployed, Is.True);
                Assert.That(
                    state.StrongholdCardIds,
                    Is.EqualTo(new[] { "supply-heal" }),
                    useLegacyStrongholdField
                        ? "the legacy stronghold array must be copied at Enqueue"
                        : "the stronghold id array must be copied at Enqueue");
                Assert.That(
                    state.Units[0].Cell,
                    Is.EqualTo(new GridCoord(0, 2)),
                    "nested FormationSlot mutation must not alter the enqueued deployment");
                Assert.That(
                    state.Units[0].Facing,
                    Is.EqualTo(CardinalDirection.North),
                    "mutating the caller's future command kind must not replace the enqueued SetFacing");
                Assert.That(
                    state.Outcome,
                    Is.EqualTo(BattleOutcomeKind.Ongoing));
            }

            AssertOwnedInput(useLegacyStrongholdField: false);
            AssertOwnedInput(useLegacyStrongholdField: true);
        }

        [Test]
        public void TickBudget_StopsSteppingAtMaxTicks()
        {
            var clock = new ManualClock();
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            var driver = new BattleSessionDriver(clock.Read);
            driver.Attach(state, ledger);
            driver.MaxTicks = 7;

            for (var frame = 0; frame < 10; frame++)
            {
                clock.Now += Interval;
                driver.Tick();
            }

            Assert.That(driver.TotalSteps, Is.EqualTo(7));
            Assert.That(state.Tick, Is.EqualTo(7));
            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
        }

        [Test]
        public void StaleEnqueue_IsRejectedWithoutBlockingTheNextDueCommand()
        {
            var clock = new ManualClock();
            var setup = Setup();
            var state = BattleSim.Open(setup);
            var ledger = new Ledger();
            var driver = new BattleSessionDriver(clock.Read);
            var rejections = 0;
            driver.CommandRejected += _ => rejections++;
            driver.Attach(state, ledger);
            driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("deploy"), Seq = 0, At = new Tick(0),
                Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation,
            });
            clock.Now += Interval;
            driver.Tick();

            driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("future-facing"), Seq = 2, At = new Tick(2),
                Kind = BattleTickCommandKind.SetFacing,
                ActorUnitId = setup.PlayerUnits[0].Id, Facing = CardinalDirection.North,
            });
            driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("stale-facing"), Seq = 1, At = new Tick(0),
                Kind = BattleTickCommandKind.SetFacing,
                ActorUnitId = setup.PlayerUnits[0].Id, Facing = CardinalDirection.South,
            });
            for (var i = 0; i < 2; i++)
            {
                clock.Now += Interval;
                driver.Tick();
            }

            Assert.That(rejections, Is.EqualTo(1), "the stale command must be rejected exactly once");
            Assert.That(state.Units[0].Facing, Is.EqualTo(CardinalDirection.North),
                "the stale insertion must not strand the next due command behind the consumed cursor");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void PausedOrderSubmission_AcceptsPendingIntentWithoutExecution_UntilTheNextStep()
        {
            var clock = new ManualClock();
            var setup = Setup();
            var state = BattleSim.Open(setup);
            var ledger = new Ledger();
            var driver = new BattleSessionDriver(clock.Read);
            driver.Attach(state, ledger);
            driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("pause-deploy"), Seq = 0, At = new Tick(0),
                Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation,
            });
            clock.Now += Interval;
            driver.Tick();

            var actor = Array.Find(state.Units, unit => unit.Id.Equals(setup.PlayerUnits[0].Id));
            actor.MoveTicksLeft = 0;
            var tickBefore = state.Tick;
            var cellBefore = actor.Cell;
            var hpBefore = actor.Hp;
            var eventsBefore = ledger.Events.Count;
            driver.Paused = true;
            driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("paused-move"), Seq = 1, At = new Tick(state.Tick),
                Kind = BattleTickCommandKind.Move,
                ActorUnitId = actor.Id,
                Target = cellBefore.Step(CardinalDirection.South),
            });
            driver.SubmitCurrentCommands();

            Assert.That(state.Tick, Is.EqualTo(tickBefore));
            Assert.That(actor.Cell, Is.EqualTo(cellBefore));
            Assert.That(actor.Hp, Is.EqualTo(hpBefore));
            Assert.That(state.Pending.Count, Is.EqualTo(1),
                "paused submission is accepted into the Core pending command queue");
            Assert.That(ledger.Events.Count, Is.EqualTo(eventsBefore + 1));
            var acceptedFingerprint = state.Fingerprint();
            var acceptedEvents = LedgerEventSignatures(ledger);

            clock.Now += 5 * Interval;
            driver.Tick();
            Assert.That(state.Tick, Is.EqualTo(tickBefore));
            Assert.That(actor.Cell, Is.EqualTo(cellBefore));
            Assert.That(actor.Hp, Is.EqualTo(hpBefore));
            Assert.That(state.Fingerprint(), Is.EqualTo(acceptedFingerprint));
            Assert.That(LedgerEventSignatures(ledger), Is.EqualTo(acceptedEvents));

            driver.Paused = false;
            clock.Now += Interval;
            driver.Tick();
            Assert.That(state.Tick, Is.EqualTo(tickBefore + 1));
            Assert.That(actor.Cell, Is.EqualTo(cellBefore.Step(CardinalDirection.South)),
                "the accepted paused order executes only when the driver runs Step");
        }

        [Test]
        public void TerminalStep_StopsWithinTheFrame_AndDetachesTheSession()
        {
            var clock = new ManualClock();
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            var driver = new BattleSessionDriver(clock.Read);
            driver.Attach(state, ledger);
            for (var i = 0; i < state.Units.Length; i++)
                if (state.Units[i].Side == 1) state.Units[i].Hp = 0;

            clock.Now += 4 * Interval;
            driver.Tick();

            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory));
            Assert.That(driver.TotalSteps, Is.EqualTo(1),
                "the frame must not count no-op Steps after the first terminal Step");
            Assert.That(driver.State, Is.Null, "terminal sessions must detach from the live pump");
            Assert.That(driver.Ledger, Is.Null);
        }
    }
}
