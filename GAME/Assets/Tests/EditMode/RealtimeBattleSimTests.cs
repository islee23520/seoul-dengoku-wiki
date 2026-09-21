using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Boundary tests for the continuous battle simulation contract. Fixture values are
    /// synthetic and deliberately independent of shipped balance data.
    /// </summary>
    [TestFixture]
    public sealed class RealtimeBattleSimTests
    {
        const double DeploymentDeltaSeconds = 0.001d;

        sealed class BoundaryFixture
        {
            public readonly BattlePositionMm PlayerAlphaPosition = new BattlePositionMm(0, 0, 0);
            public readonly BattlePositionMm PlayerBravoPosition = new BattlePositionMm(2000, 0, 0);
            public readonly BattlePositionMm JunctionPosition = new BattlePositionMm(1000, 0, 0);
            public readonly BattlePositionMm EnemyPosition = new BattlePositionMm(1000, 0, 1000);
            public readonly BattlePositionMm PlayerRetreatPosition = new BattlePositionMm(-1000, 0, 0);
            public readonly BattlePositionMm EnemyRetreatPosition = new BattlePositionMm(1000, 0, 2000);

            public readonly UnitId PlayerAlphaId = new UnitId("boundary-player-alpha");
            public readonly UnitId PlayerBravoId = new UnitId("boundary-player-bravo");
            public readonly UnitId EnemyId = new UnitId("boundary-enemy");

            public BattleSetup Setup { get; }

            public BoundaryFixture()
            {
                var nodes = new[]
                {
                    new NavNode("player-retreat", PlayerRetreatPosition),
                    new NavNode("player-alpha", PlayerAlphaPosition),
                    new NavNode("junction", JunctionPosition),
                    new NavNode("player-bravo", PlayerBravoPosition),
                    new NavNode("enemy", EnemyPosition),
                    new NavNode("enemy-retreat", EnemyRetreatPosition),
                };
                var navigation = new NavPath(
                    nodes,
                    new[]
                    {
                        new NavSegment("player-retreat", "player-alpha"),
                        new NavSegment("player-alpha", "player-retreat"),
                        new NavSegment("player-alpha", "junction"),
                        new NavSegment("junction", "player-alpha"),
                        new NavSegment("junction", "player-bravo"),
                        new NavSegment("player-bravo", "junction"),
                        new NavSegment("junction", "enemy"),
                        new NavSegment("enemy", "junction"),
                        new NavSegment("enemy", "enemy-retreat"),
                        new NavSegment("enemy-retreat", "enemy"),
                    });

                var playerAlpha = Unit(PlayerAlphaId, "soldier-player-alpha", "formation-player", 0, PlayerAlphaPosition);
                var playerBravo = Unit(PlayerBravoId, "soldier-player-bravo", "formation-player", 0, PlayerBravoPosition);
                var enemy = Unit(EnemyId, "soldier-enemy", "formation-enemy", 1, EnemyPosition);

                var openingHp = new UnitHpSnapshot(new Dictionary<string, int>
                {
                    [PlayerAlphaId.Value] = playerAlpha.Hp,
                    [PlayerBravoId.Value] = playerBravo.Hp,
                    [EnemyId.Value] = enemy.Hp,
                });
                var participantMaxHp = new UnitHpSnapshot(new Dictionary<string, int>
                {
                    [PlayerAlphaId.Value] = playerAlpha.MaxHp,
                    [PlayerBravoId.Value] = playerBravo.MaxHp,
                    [EnemyId.Value] = enemy.MaxHp,
                });

                Setup = new BattleSetup
                {
                    Context = BattleContext.Create(
                        "boundary-campaign",
                        default(StationId),
                        24681357,
                        new Tick(0),
                        17,
                        -3,
                        "continuous-boundary-v1",
                        "realtime-battle-sim-tests",
                        openingHp,
                        participantMaxHp),
                    Definition = new BattleDefinition(
                        moraleBase: 61,
                        moraleRecoverCap: 73,
                        moraleRecoveryPerSecond: 4,
                        moraleLossPerDeath: 9,
                        moraleLossCommanderBelowHalf: 7,
                        surrenderMoraleMax: 19,
                        surrenderCommanderHpPercentMax: 31,
                        moraleLock: 13,
                        maximumDurationSeconds: 12.5d,
                        decisionIntervalSeconds: 0.5d),
                    PlayerUnits = new[] { playerAlpha, playerBravo },
                    EnemyUnits = new[] { enemy },
                    PlayerFormation = new[]
                    {
                        Slot(playerAlpha, PlayerAlphaPosition, 90000),
                        Slot(playerBravo, PlayerBravoPosition, 270000),
                    },
                    EnemyFormation = new[]
                    {
                        Slot(enemy, EnemyPosition, 180000),
                    },
                    PlayerCommanderId = PlayerAlphaId,
                    EnemyCommanderId = EnemyId,
                    PlayerHeroId = new HeroId("boundary-hero"),
                    PlayerSquadId = new SquadId("formation-player"),
                    Navigation = navigation,
                    PlayerRetreatAnchors = new[] { PlayerRetreatPosition },
                    EnemyRetreatAnchors = new[] { EnemyRetreatPosition },
                    EnemyObjectivePosition = JunctionPosition,
                    Telegraphs = new TelegraphPlan[0],
                };
            }

            static RosterUnit Unit(UnitId id, string soldierId, string squadId, int side, BattlePositionMm position)
            {
                return new RosterUnit
                {
                    Id = id,
                    SoldierId = new SoldierId(soldierId),
                     VisualKindId = side == 0 ? "test.visual.soldier" : "test.visual.hero",
                    SquadId = new SquadId(squadId),
                    Side = side,
                    Role = "boundary-participant",
                    Hp = 20,
                    MaxHp = 20,
                    Power = 3,
                    Morale = 61f,
                    RangeMinMm = 0,
                    RangeMaxMm = 1500,
                    MoveMillimetersPerSecond = 1000,
                    AttackCooldownSeconds = 0.75d,
                    RadiusMm = 250,
                    InitialPosition = position,
                    InitialFacing = new BattleFacing(side == 0 ? 90000 : 180000),
                    InitialStatus = BattleUnitStatus.Active,
                };
            }

            static FormationSlot Slot(RosterUnit unit, BattlePositionMm position, int facingMilliDegrees)
            {
                return new FormationSlot
                {
                    Unit = unit.Id,
                    Position = position,
                    Facing = new BattleFacing(facingMilliDegrees),
                };
            }

            public FormationSlot[] CompleteFormation()
            {
                var result = new FormationSlot[Setup.PlayerFormation.Length + Setup.EnemyFormation.Length];
                Setup.PlayerFormation.CopyTo(result, 0);
                Setup.EnemyFormation.CopyTo(result, Setup.PlayerFormation.Length);
                return result;
            }

            public NavPath Path(params string[] nodeIds)
            {
                var nodes = new List<NavNode>();
                var segments = new List<NavSegment>();
                for (var index = 0; index < nodeIds.Length; index++)
                {
                    NavNode node;
                    Assert.That(Setup.Navigation.TryGetNode(nodeIds[index], out node), Is.True);
                    nodes.Add(node);
                    if (index > 0)
                    {
                        segments.Add(new NavSegment(nodeIds[index - 1], nodeIds[index]));
                    }
                }
                return new NavPath(nodes, segments);
            }
        }

        [Test]
        public void Open_RequiresExplicitDefinitionNavigationRosterFormationObjectiveAndCommanderMetadata()
        {
            var missingDefinition = new BoundaryFixture();
            missingDefinition.Setup.Definition = null;
            Assert.Throws<ArgumentException>(() => BattleSim.Open(missingDefinition.Setup));

            var missingNavigation = new BoundaryFixture();
            missingNavigation.Setup.Navigation = null;
            Assert.Throws<ArgumentException>(() => BattleSim.Open(missingNavigation.Setup));

            var invalidObjective = new BoundaryFixture();
            invalidObjective.Setup.EnemyObjectivePosition = new BattlePositionMm(99999, 0, 99999);
            Assert.Throws<ArgumentException>(() => BattleSim.Open(invalidObjective.Setup));

            var invalidCommander = new BoundaryFixture();
            invalidCommander.Setup.PlayerCommanderId = new UnitId("not-a-participant");
            Assert.Throws<ArgumentException>(() => BattleSim.Open(invalidCommander.Setup));
        }

        [Test]
        public void Open_PreservesAuthoredParticipantAndObjectiveMetadata()
        {
            var fixture = new BoundaryFixture();

            var state = BattleSim.Open(fixture.Setup);

            Assert.That(state.Context, Is.SameAs(fixture.Setup.Context));
            Assert.That(state.Definition, Is.SameAs(fixture.Setup.Definition));
            Assert.That(state.Arena.Navigation, Is.SameAs(fixture.Setup.Navigation));
            Assert.That(state.Arena.EnemyObjectivePosition, Is.EqualTo(fixture.JunctionPosition));
            Assert.That(state.PlayerCommanderId, Is.EqualTo(fixture.PlayerAlphaId));
            Assert.That(state.EnemyCommanderId, Is.EqualTo(fixture.EnemyId));
            Assert.That(state.Units, Has.Length.EqualTo(3));
            Assert.That(state.Sides[0].Morale, Is.EqualTo(fixture.Setup.Definition.MoraleBase));
            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
        }

        [Test]
        public void Deploy_AppliesEveryAuthoredPositionAndFacingOnlyWhenSimulationAdvances()
        {
            var fixture = new BoundaryFixture();
            var state = BattleSim.Open(fixture.Setup);
            var ledger = new Ledger();
            var formation = fixture.CompleteFormation();
            formation[0].Position = fixture.JunctionPosition;
            formation[0].Facing = new BattleFacing(123000);

            Assert.That(BattleSim.Submit(state, ledger, Command("deploy", 0, state, BattleTickCommandKind.Deploy, formation)), Is.Null);
            Assert.That(state.Deployed, Is.False);
            Assert.That(Unit(state, fixture.PlayerAlphaId).Position, Is.EqualTo(fixture.PlayerAlphaPosition));

            BattleSim.Step(state, ledger, DeploymentDeltaSeconds);

            Assert.That(state.Deployed, Is.True);
            Assert.That(Unit(state, fixture.PlayerAlphaId).Position, Is.EqualTo(fixture.JunctionPosition));
            Assert.That(Unit(state, fixture.PlayerAlphaId).Facing, Is.EqualTo(new BattleFacing(123000)));
            Assert.That(Unit(state, fixture.PlayerBravoId).Position, Is.EqualTo(fixture.PlayerBravoPosition));
            Assert.That(Unit(state, fixture.EnemyId).Facing, Is.EqualTo(new BattleFacing(180000)));
        }

        [Test]
        public void Move_IntegratesVariableDeltaSecondsAlongTheSubmittedNavigationPath()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var move = Command("move-variable", 1, state, BattleTickCommandKind.Move);
            move.ActorUnitId = fixture.PlayerAlphaId;
            move.Destination = fixture.JunctionPosition;
            move.Path = fixture.Path("player-alpha", "junction");

            Assert.That(BattleSim.Submit(state, ledger, move), Is.Null);
            BattleSim.Step(state, ledger, 0.2d);
            Assert.That(Unit(state, fixture.PlayerAlphaId).Position, Is.EqualTo(new BattlePositionMm(200, 0, 0)));

            BattleSim.Step(state, ledger, 0.3d);
            Assert.That(Unit(state, fixture.PlayerAlphaId).Position, Is.EqualTo(new BattlePositionMm(500, 0, 0)));

            BattleSim.Step(state, ledger, 0.5d);
            Assert.That(Unit(state, fixture.PlayerAlphaId).Position, Is.EqualTo(fixture.JunctionPosition));
            Assert.That(Unit(state, fixture.PlayerAlphaId).OrderKind, Is.EqualTo(BattleOrderKind.None));
        }

        [Test]
        public void Attack_UsesCooldownSecondsAcrossUnequalSimulationDeltas()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var attacker = Unit(state, fixture.PlayerAlphaId);
            var target = Unit(state, fixture.EnemyId);
            attacker.Position = fixture.JunctionPosition;
            var attack = Command("attack-cooldown", 1, state, BattleTickCommandKind.Attack);
            attack.ActorUnitId = attacker.Id;
            attack.TargetUnitId = target.Id;

            Assert.That(BattleSim.Submit(state, ledger, attack), Is.Null);
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(target.Hp, Is.EqualTo(17));
            Assert.That(attacker.AttackCooldownSecondsRemaining, Is.EqualTo(0.75d).Within(0.000001d));

            BattleSim.Step(state, ledger, 0.4d);
            Assert.That(target.Hp, Is.EqualTo(17));
            Assert.That(attacker.AttackCooldownSecondsRemaining, Is.EqualTo(0.35d).Within(0.000001d));

            BattleSim.Step(state, ledger, 0.35d);
            Assert.That(target.Hp, Is.EqualTo(14));
            Assert.That(attacker.AttackCooldownSecondsRemaining, Is.EqualTo(0.75d).Within(0.000001d));
        }

        [Test]
        public void Attack_RespectsInclusiveMinimumAndMaximumRangeBoundaries()
        {
            var fixture = new BoundaryFixture();
            fixture.Setup.PlayerUnits[0].RangeMinMm = 1000;
            fixture.Setup.PlayerUnits[0].RangeMaxMm = 1500;
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var attacker = Unit(state, fixture.PlayerAlphaId);
            var target = Unit(state, fixture.EnemyId);
            attacker.Position = fixture.JunctionPosition;
            var attack = Command("attack-range", 1, state, BattleTickCommandKind.Attack);
            attack.ActorUnitId = attacker.Id;
            attack.TargetUnitId = target.Id;
            Assert.That(BattleSim.Submit(state, ledger, attack), Is.Null);

            target.Position = new BattlePositionMm(1000, 0, 999);
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(target.Hp, Is.EqualTo(20), "inside the minimum range must not deal damage");

            target.Position = new BattlePositionMm(1000, 0, 1000);
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(target.Hp, Is.EqualTo(17), "the exact minimum range is valid");

            attacker.AttackCooldownSecondsRemaining = 0d;
            target.Position = new BattlePositionMm(1000, 0, 1500);
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(target.Hp, Is.EqualTo(14), "the exact maximum range is valid");

            attacker.AttackCooldownSecondsRemaining = 0d;
            target.Position = new BattlePositionMm(1000, 0, 1501);
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(target.Hp, Is.EqualTo(14), "outside the maximum range must not deal damage");
        }

        [Test]
        public void EnemyDecision_SelectsTheLexicallyFirstEquidistantTargetAndAStableShortestPath()
        {
            var firstFixture = new BoundaryFixture();
            var secondFixture = new BoundaryFixture();
            var first = OpenAndDeploy(firstFixture);
            var second = OpenAndDeploy(secondFixture);

            BattleSim.Step(first, new Ledger(), 0.5d);
            BattleSim.Step(second, new Ledger(), 0.5d);

            var firstEnemy = Unit(first, firstFixture.EnemyId);
            var secondEnemy = Unit(second, secondFixture.EnemyId);
            Assert.That(firstEnemy.OrderKind, Is.EqualTo(BattleOrderKind.Move));
            Assert.That(firstEnemy.OrderDestination, Is.EqualTo(firstFixture.PlayerAlphaPosition));
            Assert.That(firstEnemy.ActivePath.Nodes[0].Id, Is.EqualTo("enemy"));
            Assert.That(firstEnemy.ActivePath.Nodes[1].Id, Is.EqualTo("junction"));
            Assert.That(firstEnemy.ActivePath.Nodes[2].Id, Is.EqualTo("player-alpha"));
            Assert.That(secondEnemy.OrderDestination, Is.EqualTo(firstEnemy.OrderDestination));
            Assert.That(second.Fingerprint(), Is.EqualTo(first.Fingerprint()));
        }

        [Test]
        public void Morale_RecoversByDefinitionRateWithoutExceedingTheAuthoredCap()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            state.Sides[0].Morale = 60;

            BattleSim.Step(state, new Ledger(), 0.5d);
            Assert.That(state.Sides[0].Morale, Is.EqualTo(62));

            state.Sides[0].Morale = 72;
            BattleSim.Step(state, new Ledger(), 1d);
            Assert.That(state.Sides[0].Morale, Is.EqualTo(73));
        }

        [Test]
        public void RoutingParticipant_CannotReceiveOrdersAndDoesNotCountAsDefeatedWhileAlive()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var actor = Unit(state, fixture.PlayerAlphaId);
            actor.Status = BattleUnitStatus.Routing;
            var command = Command("routing-order", 1, state, BattleTickCommandKind.Attack);
            command.ActorUnitId = actor.Id;
            command.TargetUnitId = fixture.EnemyId;

            var result = BattleSim.Submit(state, ledger, command);
            Assert.That(result, Is.TypeOf<BattleRejection>());
            Assert.That(((BattleRejection)result).Reason, Is.EqualTo(BattleRejectReason.UnknownActor));

            Unit(state, fixture.PlayerBravoId).Hp = 0;
            Unit(state, fixture.PlayerBravoId).Status = BattleUnitStatus.Down;
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
        }

        [Test]
        public void DemandSurrender_RejectsUnmetConditionsThenProducesEnemySurrenderWhenMet()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var unmet = Command("surrender-unmet", 1, state, BattleTickCommandKind.DemandSurrender);
            var before = state.Fingerprint();

            var rejection = BattleSim.Submit(state, ledger, unmet);
            Assert.That(rejection, Is.TypeOf<BattleRejection>());
            Assert.That(((BattleRejection)rejection).Reason, Is.EqualTo(BattleRejectReason.SurrenderConditionsUnmet));
            Assert.That(state.Fingerprint(), Is.EqualTo(before));

            state.Sides[1].SurrenderConditionsMet = true;
            var accepted = Command("surrender-met", 2, state, BattleTickCommandKind.DemandSurrender);
            Assert.That(BattleSim.Submit(state, ledger, accepted), Is.Null);
            BattleSim.Step(state, ledger, 0.1d);
            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.EnemySurrender));
        }

        [Test]
        public void OrderRetreat_UsesAuthoredReachabilityAndProducesPlayerRetreat()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var retreat = Command("retreat", 1, state, BattleTickCommandKind.OrderRetreat);

            Assert.That(state.Sides[0].RetreatCovered, Is.True);
            Assert.That(BattleSim.Submit(state, ledger, retreat), Is.Null);
            BattleSim.Step(state, ledger, 0.1d);

            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.PlayerRetreat));
        }

        [Test]
        public void Outcome_ResolvesVictoryDefeatMutualLossAndMaximumDuration()
        {
            var playerVictoryFixture = new BoundaryFixture();
            var playerVictory = OpenAndDeploy(playerVictoryFixture);
            Down(Unit(playerVictory, playerVictoryFixture.EnemyId));
            BattleSim.Step(playerVictory, new Ledger(), 0.1d);
            Assert.That(playerVictory.Outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory));

            var enemyVictoryFixture = new BoundaryFixture();
            var enemyVictory = OpenAndDeploy(enemyVictoryFixture);
            Down(Unit(enemyVictory, enemyVictoryFixture.PlayerAlphaId));
            Down(Unit(enemyVictory, enemyVictoryFixture.PlayerBravoId));
            BattleSim.Step(enemyVictory, new Ledger(), 0.1d);
            Assert.That(enemyVictory.Outcome, Is.EqualTo(BattleOutcomeKind.EnemyVictory));

            var mutualLossFixture = new BoundaryFixture();
            var mutualLoss = OpenAndDeploy(mutualLossFixture);
            foreach (var unit in mutualLoss.Units)
            {
                Down(unit);
            }
            BattleSim.Step(mutualLoss, new Ledger(), 0.1d);
            Assert.That(mutualLoss.Outcome, Is.EqualTo(BattleOutcomeKind.Draw));

            var durationFixture = new BoundaryFixture();
            var duration = OpenAndDeploy(durationFixture);
            duration.ElapsedSeconds = duration.Definition.MaximumDurationSeconds - 0.1d;
            BattleSim.Step(duration, new Ledger(), 0.1d);
            Assert.That(duration.Outcome, Is.EqualTo(BattleOutcomeKind.Draw));
        }

        [Test]
        public void InvalidCommand_IsAtomicForStatePendingCommandsAndLedger()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var invalidPath = new NavPath(
                new[]
                {
                    new NavNode("player-alpha", fixture.PlayerAlphaPosition),
                    new NavNode("enemy", fixture.EnemyPosition),
                },
                new[] { new NavSegment("player-alpha", "enemy") });
            var move = Command("invalid-path", 1, state, BattleTickCommandKind.Move);
            move.ActorUnitId = fixture.PlayerAlphaId;
            move.Destination = fixture.EnemyPosition;
            move.Path = invalidPath;
            var beforeFingerprint = state.Fingerprint();
            var beforePending = state.Pending.Count;
            var beforeEvents = ledger.Events.Count;

            var result = BattleSim.Submit(state, ledger, move);

            Assert.That(result, Is.TypeOf<BattleRejection>());
            Assert.That(((BattleRejection)result).Reason, Is.EqualTo(BattleRejectReason.DestinationOffNav));
            Assert.That(state.Fingerprint(), Is.EqualTo(beforeFingerprint));
            Assert.That(state.Pending.Count, Is.EqualTo(beforePending));
            Assert.That(ledger.Events.Count, Is.EqualTo(beforeEvents));
        }

        [Test]
        public void PastTimestamp_IsRejectedWithoutMutation()
        {
            var fixture = new BoundaryFixture();
            var state = OpenAndDeploy(fixture);
            var ledger = new Ledger();
            var command = Command("past", 1, state, BattleTickCommandKind.Attack);
            command.AtSeconds = state.ElapsedSeconds - 0.0001d;
            command.ActorUnitId = fixture.PlayerAlphaId;
            command.TargetUnitId = fixture.EnemyId;
            var before = state.Fingerprint();

            var result = BattleSim.Submit(state, ledger, command);

            Assert.That(result, Is.TypeOf<BattleRejection>());
            Assert.That(((BattleRejection)result).Reason, Is.EqualTo(BattleRejectReason.TimestampMismatch));
            Assert.That(state.Fingerprint(), Is.EqualTo(before));
            Assert.That(ledger.Events, Is.Empty);
        }

        static BattleSimState OpenAndDeploy(BoundaryFixture fixture)
        {
            var state = BattleSim.Open(fixture.Setup);
            var ledger = new Ledger();
            var deploy = Command("deploy-fixture", 0, state, BattleTickCommandKind.Deploy, fixture.CompleteFormation());
            Assert.That(BattleSim.Submit(state, ledger, deploy), Is.Null);
            BattleSim.Step(state, ledger, DeploymentDeltaSeconds);
            Assert.That(state.Deployed, Is.True);
            return state;
        }

        static BattleTickCommand Command(
            string id,
            int sequence,
            BattleSimState state,
            BattleTickCommandKind kind,
            FormationSlot[] formation = null)
        {
            return new BattleTickCommand
            {
                Id = new CommandId(id),
                Seq = sequence,
                AtSeconds = state.ElapsedSeconds,
                Kind = kind,
                Formation = formation,
            };
        }

        static UnitState Unit(BattleSimState state, UnitId id)
        {
            var unit = Array.Find(state.Units, candidate => candidate.Id.Equals(id));
            Assert.That(unit, Is.Not.Null, "fixture participant must exist");
            return unit;
        }

        static void Down(UnitState unit)
        {
            unit.Hp = 0;
            unit.Status = BattleUnitStatus.Down;
        }
    }
}
