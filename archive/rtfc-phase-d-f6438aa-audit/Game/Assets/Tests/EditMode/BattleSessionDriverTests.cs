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
            // ally-0 deploys to (0,2) per FormationResolver.Cell for slot 0 and
            // advances one cell on tick 10; the late SetFacing lands on the vacated
            // cell and is deterministically rejected on both replay paths.
            return new[]
            {
                new BattleTickCommand { Id = new CommandId("cmd-deploy"), Seq = 0, At = new Tick(0), Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation },
                new BattleTickCommand { Id = new CommandId("cmd-face-5"), Seq = 1, At = new Tick(5), Kind = BattleTickCommandKind.SetFacing, Target = new GridCoord(0, 2), Facing = CardinalDirection.North },
                new BattleTickCommand { Id = new CommandId("cmd-face-15"), Seq = 2, At = new Tick(15), Kind = BattleTickCommandKind.SetFacing, Target = new GridCoord(0, 2), Facing = CardinalDirection.South },
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
            Assert.That(new BattleSessionDriver(() => 0.0), Is.InstanceOf<VContainer.Unity.ITickable>());
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
            Assert.That(ledger.Events.Count, Is.EqualTo(32),
                "30 btick events + accepted deploy and face-5 bcmd events; the face-15 rejection adds none");
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
    }
}
