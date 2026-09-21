using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Tests.EditMode.Fixtures;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Synthetic boundary fixtures for the continuous per-soldier battle contract.
    /// Values in this fixture are intentionally not canonical product tuning.
    /// </summary>
    [TestFixture]
    public sealed class PerSoldierBattleTests
    {
        const double DeltaSeconds = 0.25d;

        [Test]
        public void Open_AllowsTwentySoldiers_AndKeepsHeroSeparateFromSoldierRoster()
        {
            var setup = Setup(20, 1);

            var state = BattleSim.Open(setup);

            Assert.That(Array.FindAll(state.Soldiers, unit => unit.Side == 0), Has.Length.EqualTo(20));
            Assert.That(Array.Exists(state.Soldiers, unit => unit.Id.Equals(new UnitId("hero-boundary"))), Is.False);
            Assert.That(state.Heroes, Has.Length.EqualTo(1));
            Assert.That(state.Heroes[0].Id, Is.EqualTo(setup.PlayerHeroId));
        }

        [Test]
        public void Open_RejectsTwentyFirstSoldier()
        {
            Assert.Throws<ArgumentException>(() => BattleSim.Open(Setup(21, 1)));
        }

        [Test]
        public void Open_RejectsDuplicateSoldierId()
        {
            var setup = Setup(2, 1);
            setup.PlayerUnits[1].SoldierId = setup.PlayerUnits[0].SoldierId;

            Assert.Throws<ArgumentException>(() => BattleSim.Open(setup));
        }

        [Test]
        public void SubmitAndStep_ResolveIndividualMeleeAndRangedCasualtiesAtRangeBoundaries()
        {
            var melee = Setup(1, 1, Position(0), Position(1000));
            melee.PlayerUnits[0].RangeMinMm = 1000;
            melee.PlayerUnits[0].RangeMaxMm = 1000;
            melee.PlayerUnits[0].Power = 3;
            melee.EnemyUnits[0].Hp = 3;
            melee.EnemyUnits[0].MaxHp = 3;
            var meleeState = OpenAndDeploy(melee);

            SubmitAttack(meleeState, "melee", melee.PlayerUnits[0].Id, melee.EnemyUnits[0].Id);
            BattleSim.Step(meleeState, new Ledger(), DeltaSeconds);

            Assert.That(meleeState.Units[1].Hp, Is.EqualTo(0));
            Assert.That(meleeState.Units[1].Status, Is.EqualTo(BattleUnitStatus.Down));

            var ranged = Setup(1, 1, Position(0), Position(5000));
            ranged.PlayerUnits[0].RangeMinMm = 2000;
            ranged.PlayerUnits[0].RangeMaxMm = 5000;
            ranged.PlayerUnits[0].Power = 2;
            ranged.EnemyUnits[0].Hp = 4;
            ranged.EnemyUnits[0].MaxHp = 4;
            var rangedState = OpenAndDeploy(ranged);

            SubmitAttack(rangedState, "ranged", ranged.PlayerUnits[0].Id, ranged.EnemyUnits[0].Id);
            BattleSim.Step(rangedState, new Ledger(), DeltaSeconds);

            Assert.That(rangedState.Units[1].Hp, Is.EqualTo(2));
            Assert.That(rangedState.Units[1].Status, Is.EqualTo(BattleUnitStatus.Active));
        }

        [Test]
        public void SubmitAndStep_ReplayWithSameDeltaAndCommandsIsDeterministic()
        {
            var setup = Setup(1, 1, Position(0), Position(2000));
            var first = OpenAndDeploy(setup);
            var second = OpenAndDeploy(setup);
            var path = Path(setup.Navigation, "p0", "p1");

            SubmitMove(first, "first", setup.PlayerUnits[0].Id, Position(1000), path);
            SubmitMove(second, "second", setup.PlayerUnits[0].Id, Position(1000), path);
            BattleSim.Step(first, new Ledger(), DeltaSeconds);
            BattleSim.Step(second, new Ledger(), DeltaSeconds);

            Assert.That(first.Fingerprint(), Is.EqualTo(second.Fingerprint()));
            Assert.That(first.Units[0].Position, Is.EqualTo(new BattlePositionMm(250, 0, 0)));
        }

        [Test]
        public void SubmitAndStep_CrowdedMovementDoesNotTeleportOrOverlapSoldierRadii()
        {
            var setup = Setup(2, 1, Position(0), Position(3000));
            setup.PlayerFormation[1].Position = Position(1000);
            setup.PlayerUnits[0].RadiusMm = 600;
            setup.PlayerUnits[1].RadiusMm = 600;
            var state = OpenAndDeploy(setup);
            var origin = state.Units[0].Position;

            SubmitMove(state, "crowded-move", setup.PlayerUnits[0].Id, Position(1000), Path(setup.Navigation, "p0", "p1"));
            BattleSim.Step(state, new Ledger(), DeltaSeconds);

            Assert.That(state.Units[0].Position.DistanceSquaredTo(origin), Is.LessThanOrEqualTo(250L * 250L));
            Assert.That(state.Units[0].Position.DistanceSquaredTo(state.Units[1].Position),
                Is.GreaterThanOrEqualTo(1200L * 1200L));
        }

        [Test]
        public void Step_UsesAiIntervalAndNonCardinalPath_AndResolvesMoraleAndOutcome()
        {
            var setup = Setup(1, 1, new BattlePositionMm(1000, 0, 1000), Position(0));
            setup.Definition = new BattleDefinition(50, 60, 10, 5, 5, 20, 50, 0, 20d, 0.5d);
            setup.EnemyUnits[0].RangeMinMm = 0;
            setup.EnemyUnits[0].RangeMaxMm = 0;
            var state = OpenAndDeploy(setup);
            var enemy = state.Units[1];

            BattleSim.Step(state, new Ledger(), 0.49d);
            Assert.That(enemy.Position, Is.EqualTo(Position(0)));
            Assert.That(state.Sides[0].Morale, Is.EqualTo(54));

            BattleSim.Step(state, new Ledger(), 0.01d);
            BattleSim.Step(state, new Ledger(), DeltaSeconds);

            Assert.That(enemy.Position, Is.Not.EqualTo(Position(0)));
            Assert.That(enemy.Facing, Is.EqualTo(BattleFacing.FromDelta(1000, 1000)));

            enemy.Hp = 0;
            enemy.Status = BattleUnitStatus.Down;
            BattleSim.Step(state, new Ledger(), DeltaSeconds);

            Assert.That(state.Outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory));
        }

        [Test]
        public void Submit_InvalidPathIsRejectedWithoutChangingBattleState()
        {
            var setup = Setup(1, 1, Position(0), Position(2000));
            var state = OpenAndDeploy(setup);
            var ledger = new Ledger();
            var before = state.Fingerprint();
            var invalidPath = new NavPath(
                new[] { new NavNode("p0", Position(0)), new NavNode("p2", Position(2000)) },
                new[] { new NavSegment("p0", "p2") });

            var result = BattleSim.Submit(state, ledger, new BattleTickCommand
            {
                Id = new CommandId("invalid-path"),
                Seq = 1,
                AtSeconds = state.ElapsedSeconds,
                Kind = BattleTickCommandKind.Move,
                ActorUnitId = setup.PlayerUnits[0].Id,
                Destination = Position(2000),
                Path = invalidPath,
            });

            Assert.That(result, Is.TypeOf<BattleRejection>());
            Assert.That(((BattleRejection)result).Reason, Is.EqualTo(BattleRejectReason.DestinationOffNav));
            Assert.That(state.Fingerprint(), Is.EqualTo(before));
            Assert.That(ledger.Events, Is.Empty);
        }

        static BattleSetup Setup(int playerCount, int enemyCount, BattlePositionMm? playerPosition = null, BattlePositionMm? enemyPosition = null)
        {
            var nodeCount = Math.Max(playerCount + enemyCount + 2, 6);
            var nodes = new List<NavNode>();
            for (var i = 0; i <= nodeCount; i++) nodes.Add(new NavNode("p" + i, Position(i * 1000)));
            nodes.Add(new NavNode("diagonal", new BattlePositionMm(1000, 0, 1000)));
            var segments = new List<NavSegment>();
            for (var i = 0; i < nodeCount; i++)
            {
                segments.Add(new NavSegment("p" + i, "p" + (i + 1)));
                segments.Add(new NavSegment("p" + (i + 1), "p" + i));
            }
            segments.Add(new NavSegment("p0", "diagonal"));
            segments.Add(new NavSegment("diagonal", "p0"));
            var navigation = new NavPath(nodes, segments);
            var players = new RosterUnit[playerCount];
            var enemies = new RosterUnit[enemyCount];
            var playerFormation = new FormationSlot[playerCount];
            var enemyFormation = new FormationSlot[enemyCount];

            for (var i = 0; i < playerCount; i++)
            {
                var position = i == 0 && playerPosition.HasValue ? playerPosition.Value : Position(i * 1000);
                players[i] = Soldier("player-" + i, "player-soldier-" + i, 0, position);
                playerFormation[i] = new FormationSlot { Unit = players[i].Id, Position = position, Facing = new BattleFacing(45000) };
            }
            for (var i = 0; i < enemyCount; i++)
            {
                var position = i == 0 && enemyPosition.HasValue ? enemyPosition.Value : Position((playerCount + i + 1) * 1000);
                enemies[i] = Soldier("enemy-" + i, "enemy-soldier-" + i, 1, position);
                enemyFormation[i] = new FormationSlot { Unit = enemies[i].Id, Position = position, Facing = new BattleFacing(225000) };
            }

            return new BattleSetup
            {
                Context = BattleContext.Create("boundary-campaign", default(StationId), 8675309, new Tick(0), 0, 0,
                    "boundary-fixture-v1", "per-soldier-boundary", TestCampaignDefinition.Instance.MaxHp, TestCampaignDefinition.Instance.MaxHp),
                Definition = new BattleDefinition(60, 60, 0, 5, 5, 20, 50, 0, 20d, 10d),
                PlayerUnits = players,
                EnemyUnits = enemies,
                PlayerFormation = playerFormation,
                EnemyFormation = enemyFormation,
                PlayerCommanderId = players[0].Id,
                EnemyCommanderId = enemies[0].Id,
                PlayerHeroId = new HeroId("hero-boundary"),
                PlayerHero = new HeroDefinition
                {
                    Id = new HeroId("hero-boundary"),
                    Hp = 10,
                    MaxHp = 10,
                    Position = playerFormation[0].Position,
                    Facing = playerFormation[0].Facing,
                },
                PlayerSquadId = new SquadId("player-squad"),
                Navigation = navigation,
                PlayerRetreatAnchors = new[] { Position(0) },
                EnemyRetreatAnchors = new[] { Position((playerCount + enemyCount + 1) * 1000) },
                EnemyObjectivePosition = Position(1000),
            };
        }

        static RosterUnit Soldier(string id, string soldierId, int side, BattlePositionMm position)
        {
            return new RosterUnit
            {
                Id = new UnitId(id), SoldierId = new SoldierId(soldierId),
                 VisualKindId = side == 0 ? "test.visual.soldier" : "test.visual.hero",
                SquadId = new SquadId(side == 0 ? "player-squad" : "enemy-squad"), Side = side,
                Role = "boundary-fixture", Hp = 10, MaxHp = 10, Power = 1, Morale = 60f,
                RangeMinMm = 0, RangeMaxMm = 100, MoveMillimetersPerSecond = 1000,
                AttackCooldownSeconds = 0d, RadiusMm = 500, InitialPosition = position,
                InitialFacing = new BattleFacing(side == 0 ? 45000 : 225000), InitialStatus = BattleUnitStatus.Active,
            };
        }

        static BattleSimState OpenAndDeploy(BattleSetup setup)
        {
            var state = BattleSim.Open(setup);
            var formation = new List<FormationSlot>(setup.PlayerFormation);
            formation.AddRange(setup.EnemyFormation);
            var result = BattleSim.Submit(state, new Ledger(), new BattleTickCommand
            {
                Id = new CommandId("deploy"), Seq = 0, AtSeconds = 0d,
                Kind = BattleTickCommandKind.Deploy, Formation = formation.ToArray(),
            });
            Assert.That(result, Is.Null);
            BattleSim.Step(state, new Ledger(), 0.0001d);
            return state;
        }

        static void SubmitAttack(BattleSimState state, string id, UnitId actor, UnitId target)
        {
            Assert.That(BattleSim.Submit(state, new Ledger(), new BattleTickCommand
            {
                Id = new CommandId(id), Seq = 1, AtSeconds = state.ElapsedSeconds,
                Kind = BattleTickCommandKind.Attack, ActorUnitId = actor, TargetUnitId = target,
            }), Is.Null);
        }

        static void SubmitMove(BattleSimState state, string id, UnitId actor, BattlePositionMm destination, NavPath path)
        {
            Assert.That(BattleSim.Submit(state, new Ledger(), new BattleTickCommand
            {
                Id = new CommandId(id), Seq = 1, AtSeconds = state.ElapsedSeconds,
                Kind = BattleTickCommandKind.Move, ActorUnitId = actor, Destination = destination, Path = path,
            }), Is.Null);
        }

        static NavPath Path(NavPath navigation, params string[] ids)
        {
            var nodes = new List<NavNode>();
            for (var i = 0; i < ids.Length; i++)
            {
                NavNode node;
                Assert.That(navigation.TryGetNode(ids[i], out node), Is.True);
                nodes.Add(node);
            }
            var segments = new List<NavSegment>();
            for (var i = 1; i < ids.Length; i++) segments.Add(new NavSegment(ids[i - 1], ids[i]));
            return new NavPath(nodes, segments);
        }

        static BattlePositionMm Position(int x)
        {
            return new BattlePositionMm(x, 0, 0);
        }
    }
}
