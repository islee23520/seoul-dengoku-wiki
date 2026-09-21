using System;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.Battle;
using Janseon.Tests.EditMode.Fixtures;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class BattleSessionDriverTests
    {
        const float ShortDeltaSeconds = 0.125f;
        const float LongDeltaSeconds = 0.375f;
        const double LongDecisionIntervalSeconds = 1000d;
        const double LongMaximumDurationSeconds = 1000d;

        sealed class Fixture
        {
            public BattleSetup Setup;
            public BattleSessionDriver Driver;
            public BattleSimState State;
            public Ledger Ledger;
            public UnitId FirstAllyId;
            public UnitId SecondAllyId;
            public UnitId EnemyId;
            public BattlePositionMm FirstDestination;
            public NavPath FirstPath;
        }

        static Fixture AttachedDriver()
        {
            var allyStart = new NavNode("ally-start", new BattlePositionMm(0, 0, 0));
            var allyDestination = new NavNode("ally-destination", new BattlePositionMm(1000, 0, 0));
            var secondAllyStart = new NavNode("second-ally-start", new BattlePositionMm(0, 0, 1000));
            var enemyStart = new NavNode("enemy-start", new BattlePositionMm(2000, 0, 0));
            var navigation = new NavPath(
                new[] { allyStart, allyDestination, secondAllyStart, enemyStart },
                new[]
                {
                    new NavSegment(allyStart.Id, allyDestination.Id),
                    new NavSegment(enemyStart.Id, allyDestination.Id),
                });

            var firstAlly = AuthoredUnit("ally-a", "soldier-a", "player-squad", 0, allyStart.Position);
            var secondAlly = AuthoredUnit("ally-b", "soldier-b", "player-squad", 0, secondAllyStart.Position);
            var enemy = AuthoredUnit("enemy", "soldier-enemy", "enemy-squad", 1, enemyStart.Position);
            var setup = new BattleSetup
            {
                Context = BattleContext.Create(
                    "driver-campaign",
                    default(StationId),
                    1,
                    new Tick(0),
                    0,
                    0,
                    "continuous-contract",
                    "battle-session-driver-tests",
                    TestCampaignDefinition.Instance.MaxHp, TestCampaignDefinition.Instance.MaxHp),
                Definition = new BattleDefinition(
                    moraleBase: 1,
                    moraleRecoverCap: 1,
                    moraleRecoveryPerSecond: 0,
                    moraleLossPerDeath: 0,
                    moraleLossCommanderBelowHalf: 0,
                    surrenderMoraleMax: 0,
                    surrenderCommanderHpPercentMax: 0,
                    moraleLock: 0,
                    maximumDurationSeconds: LongMaximumDurationSeconds,
                    decisionIntervalSeconds: LongDecisionIntervalSeconds),
                PlayerUnits = new[] { firstAlly, secondAlly },
                EnemyUnits = new[] { enemy },
                PlayerFormation = new[]
                {
                    Slot(firstAlly, allyStart.Position, 0),
                    Slot(secondAlly, secondAllyStart.Position, 0),
                },
                EnemyFormation = new[] { Slot(enemy, enemyStart.Position, 180000) },
                PlayerCommanderId = firstAlly.Id,
                EnemyCommanderId = enemy.Id,
                Navigation = navigation,
                EnemyObjectivePosition = allyDestination.Position,
            };
            var state = BattleSim.Open(setup);
            var ledger = new Ledger();
            var driver = new BattleSessionDriver();
            driver.Attach(state, ledger);

            return new Fixture
            {
                Setup = setup,
                Driver = driver,
                State = state,
                Ledger = ledger,
                FirstAllyId = firstAlly.Id,
                SecondAllyId = secondAlly.Id,
                EnemyId = enemy.Id,
                FirstDestination = allyDestination.Position,
                FirstPath = Path(allyStart, allyDestination),
            };
        }

        static RosterUnit AuthoredUnit(string id, string soldierId, string squadId, int side, BattlePositionMm position)
        {
            return new RosterUnit
            {
                Id = new UnitId(id),
                SoldierId = new SoldierId(soldierId),
                 VisualKindId = side == 0 ? "test.visual.soldier" : "test.visual.hero",
                SquadId = new SquadId(squadId),
                Side = side,
                Hp = 1,
                MaxHp = 1,
                Power = 1,
                RangeMinMm = 0,
                RangeMaxMm = 1,
                MoveMillimetersPerSecond = 1,
                AttackCooldownSeconds = 0d,
                RadiusMm = 1,
                InitialPosition = position,
                InitialFacing = new BattleFacing(0),
                InitialStatus = BattleUnitStatus.Active,
            };
        }

        static FormationSlot Slot(RosterUnit unit, BattlePositionMm position, int yawMilliDegrees)
        {
            return new FormationSlot
            {
                Unit = unit.Id,
                Position = position,
                Facing = new BattleFacing(yawMilliDegrees),
            };
        }

        static NavPath Path(NavNode from, NavNode to)
        {
            return new NavPath(
                new[] { from, to },
                new[] { new NavSegment(from.Id, to.Id) });
        }

        static BattleTickCommand Deploy(Fixture fixture)
        {
            return new BattleTickCommand
            {
                Id = new CommandId("deploy"),
                Seq = 0,
                AtSeconds = 0d,
                Kind = BattleTickCommandKind.Deploy,
                Formation = fixture.Setup.PlayerFormation,
            };
        }

        static UnitState Unit(BattleSimState state, UnitId id)
        {
            return Array.Find(state.Units, candidate => candidate.Id.Equals(id));
        }

        [Test]
        public void FixedUpdate_UsesEachProvidedDeltaAndAdvancesExactlyOnce()
        {
            var fixture = AttachedDriver();
            fixture.Driver.Enqueue(Deploy(fixture));
            var processedSteps = 0;
            fixture.Driver.FrameProcessed += steps => processedSteps += steps;

            fixture.Driver.FixedUpdate(ShortDeltaSeconds);
            fixture.Driver.FixedUpdate(LongDeltaSeconds);

            Assert.That(fixture.Driver.TotalSteps, Is.EqualTo(2));
            Assert.That(processedSteps, Is.EqualTo(2));
            Assert.That(fixture.State.ElapsedSeconds, Is.EqualTo(ShortDeltaSeconds + LongDeltaSeconds).Within(1e-9));
            Assert.That(fixture.State.Frame.ElapsedSeconds, Is.EqualTo(fixture.State.ElapsedSeconds));
        }

        [Test]
        public void Pause_IsLocalToTheDriverAndDoesNotAccumulateElapsedTime()
        {
            var fixture = AttachedDriver();
            fixture.Driver.Enqueue(Deploy(fixture));
            fixture.Driver.FixedUpdate(ShortDeltaSeconds);
            var elapsedAtPause = fixture.State.ElapsedSeconds;
            var fingerprintAtPause = fixture.State.Fingerprint();
            var eventsAtPause = fixture.Ledger.Events.Count;
            var processedWhilePaused = -1;
            fixture.Driver.FrameProcessed += steps => processedWhilePaused = steps;

            fixture.Driver.Paused = true;
            fixture.Driver.FixedUpdate(LongDeltaSeconds);

            Assert.That(processedWhilePaused, Is.Zero);
            Assert.That(fixture.State.ElapsedSeconds, Is.EqualTo(elapsedAtPause));
            Assert.That(fixture.State.Fingerprint(), Is.EqualTo(fingerprintAtPause));
            Assert.That(fixture.Ledger.Events.Count, Is.EqualTo(eventsAtPause));

            fixture.Driver.Paused = false;
            fixture.Driver.FixedUpdate(ShortDeltaSeconds);
            Assert.That(fixture.State.ElapsedSeconds, Is.EqualTo(elapsedAtPause + ShortDeltaSeconds).Within(1e-9),
                "paused wall time must not be replayed after resume");
        }

        [Test]
        public void Enqueue_OrdersCommandsByAtSecondsThenSequenceRegardlessOfArrivalOrder()
        {
            var fixture = AttachedDriver();
            fixture.Driver.Enqueue(Deploy(fixture));
            fixture.Driver.FixedUpdate(ShortDeltaSeconds);
            var dueAt = fixture.State.ElapsedSeconds;

            fixture.Driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("attack-second"),
                Seq = 2,
                AtSeconds = dueAt,
                Kind = BattleTickCommandKind.Attack,
                ActorUnitId = fixture.FirstAllyId,
                TargetUnitId = fixture.EnemyId,
            });
            fixture.Driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("move-first"),
                Seq = 1,
                AtSeconds = dueAt,
                Kind = BattleTickCommandKind.Move,
                ActorUnitId = fixture.FirstAllyId,
                Destination = fixture.FirstDestination,
                Path = fixture.FirstPath,
            });

            fixture.Driver.FixedUpdate(ShortDeltaSeconds);

            Assert.That(Unit(fixture.State, fixture.FirstAllyId).OrderKind, Is.EqualTo(BattleOrderKind.Attack),
                "the lower sequence move must execute before the higher sequence attack");
        }

        [Test]
        public void Enqueue_ClonesNestedAuthoredCommandInput()
        {
            var fixture = AttachedDriver();
            var deploy = Deploy(fixture);
            fixture.Driver.Enqueue(deploy);

            deploy.Formation[0].Position = fixture.FirstDestination;
            deploy.Formation[0].Facing = new BattleFacing(90000);

            fixture.Driver.FixedUpdate(ShortDeltaSeconds);

            var firstAlly = Unit(fixture.State, fixture.FirstAllyId);
            Assert.That(firstAlly.Position, Is.EqualTo(fixture.Setup.PlayerFormation[0].Position));
            Assert.That(firstAlly.Facing, Is.EqualTo(fixture.Setup.PlayerFormation[0].Facing));
        }

        [Test]
        public void StaleCommand_IsRejectedWithoutBlockingTheNextDueCommand()
        {
            var fixture = AttachedDriver();
            fixture.Driver.Enqueue(Deploy(fixture));
            fixture.Driver.FixedUpdate(ShortDeltaSeconds);
            var rejectionCount = 0;
            fixture.Driver.CommandRejected += _ => rejectionCount++;

            fixture.Driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("stale"),
                Seq = 1,
                AtSeconds = 0d,
                Kind = BattleTickCommandKind.Attack,
                ActorUnitId = fixture.FirstAllyId,
                TargetUnitId = fixture.EnemyId,
            });
            fixture.Driver.Enqueue(new BattleTickCommand
            {
                Id = new CommandId("current"),
                Seq = 2,
                AtSeconds = fixture.State.ElapsedSeconds,
                Kind = BattleTickCommandKind.Attack,
                ActorUnitId = fixture.SecondAllyId,
                TargetUnitId = fixture.EnemyId,
            });

            fixture.Driver.FixedUpdate(ShortDeltaSeconds);

            Assert.That(rejectionCount, Is.EqualTo(1));
            Assert.That(Unit(fixture.State, fixture.SecondAllyId).OrderKind, Is.EqualTo(BattleOrderKind.Attack));
        }

        [Test]
        public void TerminalStep_DetachesImmediatelyAndReportsOneProcessedStep()
        {
            var fixture = AttachedDriver();
            fixture.Driver.Enqueue(Deploy(fixture));
            Unit(fixture.State, fixture.EnemyId).Hp = 0;
            var processedSteps = -1;
            fixture.Driver.FrameProcessed += steps => processedSteps = steps;

            fixture.Driver.FixedUpdate(LongDeltaSeconds);

            Assert.That(fixture.State.Outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory));
            Assert.That(fixture.Driver.TotalSteps, Is.EqualTo(1));
            Assert.That(processedSteps, Is.EqualTo(1));
            Assert.That(fixture.Driver.State, Is.Null);
            Assert.That(fixture.Driver.Ledger, Is.Null);
        }
    }
}
