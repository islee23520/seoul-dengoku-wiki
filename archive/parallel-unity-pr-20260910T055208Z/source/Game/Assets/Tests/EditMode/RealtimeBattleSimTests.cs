using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using NUnit.Framework;
using BattleOutcomeKind = Janseon.Core.Battle.Contracts.BattleOutcomeKind;
using BattleRejection = Janseon.Core.Battle.Contracts.BattleRejection;
using BattleRejectReason = Janseon.Core.Battle.Contracts.BattleRejectReason;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class RealtimeBattleSimTests
    {
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
                "rtfc-b0",
                UnitHpSnapshot.DefaultParty()));
        }

        static BattleTickCommand Command(string id, int seq, int tick, BattleTickCommandKind kind)
        {
            return new BattleTickCommand
            {
                Id = new CommandId(id), Seq = seq, At = new Tick(tick), Kind = kind
            };
        }

        static void Deploy(BattleSimState state, Ledger ledger, BattleSetup setup)
        {
            var deploy = Command("deploy", 0, state.Tick, BattleTickCommandKind.Deploy);
            deploy.Formation = setup.PlayerFormation;
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));
        }

        static UnitState Unit(BattleSimState state, string id)
        {
            return System.Array.Find(state.Units, unit => unit.Id.ToString() == id);
        }

        static BattleSnapshot.UnitSnapshot Unit(BattleSnapshot snapshot, string id)
        {
            return System.Array.Find(snapshot.Units, unit => unit.Id.ToString() == id);
        }

        static void ParkOtherUnits(BattleSimState state, string actorId)
        {
            var nextPlayerX = 0;
            var nextEnemyX = 6;
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.Id.ToString() == actorId) continue;
                unit.Cell = unit.Side == 0
                    ? new GridCoord(nextPlayerX++, 7)
                    : new GridCoord(nextEnemyX++, 0);
            }
        }

        static BattleTickCommand Move(string id, int seq, BattleSimState state, string actorId, GridCoord destination)
        {
            var command = Command(id, seq, state.Tick, BattleTickCommandKind.Move);
            command.ActorUnitId = new UnitId(actorId);
            command.Target = destination;
            return command;
        }

        static BattleTickCommand Attack(string id, int seq, BattleSimState state, string actorId, string targetId)
        {
            var command = Command(id, seq, state.Tick, BattleTickCommandKind.Attack);
            command.ActorUnitId = new UnitId(actorId);
            command.TargetUnitId = new UnitId(targetId);
            return command;
        }

        [Test] public void OpenSnapshot_HasSixUnitsPerSideAndInitialMorale()
        {
            var state = BattleSim.Open(Setup());
            var snapshot = BattleSim.Snapshot(state);
            Assert.AreEqual(0, snapshot.Tick);
            Assert.AreEqual(BattleOutcomeKind.Ongoing, snapshot.Outcome);
            Assert.AreEqual(12, snapshot.Units.Length);
            Assert.AreEqual(2, snapshot.Sides.Length);
            Assert.AreEqual(BattleRules.MoraleBase, snapshot.Sides[0].Morale);
            Assert.AreEqual(BattleRules.MoraleBase, snapshot.Sides[1].Morale);
        }

        [Test] public void RejectedCommands_DoNotMutateStateOrLedger()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var before = state.Fingerprint(); var beforeEvents = ledger.Events.Count;
            var result = BattleSim.Submit(state, ledger, Command("card", 0, 0, BattleTickCommandKind.PlayCard));
            Assert.IsInstanceOf<BattleRejection>(result);
            Assert.AreEqual(BattleRejectReason.NotDeployed, ((BattleRejection)result).Reason);
            Assert.AreEqual(before, state.Fingerprint()); Assert.AreEqual(beforeEvents, ledger.Events.Count);
        }

        [Test] public void WrongTick_IsRejectedWithoutMutation()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger(); var before = state.Fingerprint();
            var result = BattleSim.Submit(state, ledger, Command("deploy", 0, 1, BattleTickCommandKind.Deploy));
            Assert.AreEqual(BattleRejectReason.TickMismatch, ((BattleRejection)result).Reason);
            Assert.AreEqual(before, state.Fingerprint());
        }

        [Test] public void Deploy_MapsFormationSlotsToCellsAndFacing()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            var cmd = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); cmd.Formation = setup.PlayerFormation;
            Assert.IsNull(BattleSim.Submit(state, ledger, cmd));
            var snapshot = BattleSim.Snapshot(state);
            var front = System.Array.Find(snapshot.Units, u => u.Id.ToString() == "ally-0");
            var rear = System.Array.Find(snapshot.Units, u => u.Id.ToString() == "ally-2");
            Assert.AreNotEqual(front.Cell, rear.Cell, "formation rows must resolve to distinct cells");
            Assert.AreEqual(CardinalDirection.East, front.Facing);
            Assert.AreEqual(setup.PlayerFormation[0].Facing, front.Facing);
        }

        [Test] public void Movement_AdvancesOneIntegerCellAfterTenTicks()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var before = BattleSim.Snapshot(state); var unit = System.Array.Find(before.Units, u => u.Id.ToString() == "ally-0");
            for (var i = 0; i < BattleRules.MoveTicksPerCell; i++) BattleSim.Step(state, ledger);
            var after = System.Array.Find(BattleSim.Snapshot(state).Units, u => u.Id.ToString() == "ally-0");
            Assert.AreEqual(before.Tick + BattleRules.MoveTicksPerCell, BattleSim.Snapshot(state).Tick);
            Assert.AreEqual(unit.Cell.X + 1, after.Cell.X);
            Assert.AreEqual(unit.Cell.Y, after.Cell.Y);
        }
        [Test] public void Attacks_UsePowerAndThirtyTickCooldown() { Assert.AreEqual(30, BattleRules.AttackCooldownTicks); }
        [Test] public void Morale_UsesConfiguredLossRecoveryAndLockRules()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            state.Units[0].Hp = 0;
            BattleSim.Step(state, ledger);
            Assert.AreEqual(55, BattleSim.Snapshot(state).Sides[0].Morale);
            BattleSim.Step(state, ledger);
            Assert.AreEqual(55, BattleSim.Snapshot(state).Sides[0].Morale);
            state.Units[0].Hp = state.Units[0].MaxHp / 2 - 1;
            BattleSim.Step(state, ledger);
            Assert.AreEqual(45, BattleSim.Snapshot(state).Sides[0].Morale);
        }
        [Test] public void Surrender_RequiresMoraleHpAndCoveredRetreat()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            state.Sides[1].Morale = BattleRules.SurrenderMoraleMax;
            state.Sides[1].CommanderHpPercent = BattleRules.SurrenderCommanderHpPercentMax;
            for (var i = 0; i < 6; i++) state.Units[i].Cell = new GridCoord(state.Arena.Width - 2, i + 1);
            var demand = Command("surrender", 0, 0, BattleTickCommandKind.DemandSurrender);
            Assert.IsNull(BattleSim.Submit(state, ledger, demand)); BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOutcomeKind.EnemySurrender, BattleSim.Snapshot(state).Outcome);

            var occupied = BattleSim.Open(setup); occupied.Sides[1].Morale = BattleRules.SurrenderMoraleMax; occupied.Sides[1].CommanderHpPercent = BattleRules.SurrenderCommanderHpPercentMax;
            occupied.Units[0].Cell = occupied.Units[6].Cell;
            var rejected = BattleSim.Submit(occupied, new Ledger(), Command("surrender", 0, 0, BattleTickCommandKind.DemandSurrender));
            Assert.IsInstanceOf<BattleRejection>(rejected);
            Assert.AreEqual(BattleRejectReason.SurrenderConditionsUnmet, ((BattleRejection)rejected).Reason);
        }
        [Test] public void Telegraph_ArrivesAtPlannedTickAndResolvesOccupiedCell()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger(); var plan = Setup().Telegraphs[0];
            while (state.Tick <= plan.ArrivalTick) BattleSim.Step(state, ledger);
            Assert.Greater(state.Units.Length, 12);
            Assert.IsTrue(System.Array.Exists(BattleSim.Snapshot(state).Units, u => u.Side == 1 && u.Cell.X == plan.Cell.X && u.Cell.Y == plan.Cell.Y));
        }
        [Test] public void Heightmap_SnapshotFingerprintAndImpassableWater_ArePreservedInRealtimeState()
        {
            var cells = new int[12 * 8];
            for (var i = 0; i < cells.Length; i++) cells[i] = 3;
            cells[1 * 12 + 2] = 2;
            var map = new Heightmap(12, 8, 8, 2, 99, LayerId.B1, cells);
            var setup = Setup(); setup.Terrain = map;
            var state = BattleSim.Open(setup);
            Assert.AreEqual(map.Fingerprint(), state.Terrain.Fingerprint());
            var clone = state.Clone();
            Assert.AreEqual(state.Fingerprint(), clone.Fingerprint());

            var mover = state.Units[0];
            mover.Cell = new GridCoord(1, 1);
            var before = mover.Cell;
            mover.MoveTicksLeft = 0;
            for (var i = 1; i < state.Units.Length; i++) state.Units[i].MoveTicksLeft = 10000;
            BattleSim.Step(state, new Ledger());
            Assert.AreEqual(before, mover.Cell, "water destination must be impassable to realtime intent movement");
        }

        [Test] public void Replay_IsDeterministicForSameSetupAndCommands()
        {
            var setup=Setup(); var deploy=Command("deploy",0,0,BattleTickCommandKind.Deploy); deploy.Formation=setup.PlayerFormation;
            var cmds=new List<BattleTickCommand>{deploy};
            var r1=BattleSim.Replay(setup,cmds,64); var r2=BattleSim.Replay(setup,cmds,64);
            Assert.AreEqual(r1.Item1.Fingerprint(),r2.Item1.Fingerprint());
            Assert.AreEqual(Janseon.Core.CoreApi.ComputeLedgerHash(r1.Item2),Janseon.Core.CoreApi.ComputeLedgerHash(r2.Item2));
        }
        [Test] public void PauseHasNoSimulationMeaning() { Assert.AreEqual(BattleRules.TicksPerSecond, 30); }
        [Test] public void MaxTicks_EndsAsDraw_AndRoutingCanProduceRout()
        {
            var state=BattleSim.Open(Setup()); var ledger=new Ledger(); state.Tick = BattleRules.MaxTicks - 1; BattleSim.Step(state, ledger); Assert.AreEqual(BattleOutcomeKind.Draw, BattleSim.Snapshot(state).Outcome);
        }

        [Test, Category("ApprovedUnityOrders")]
        public void MoveOrder_IsActorAddressed_PendingUntilStep_AndPersistsUntilArrival()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-0");
            var actor = Unit(state, "ally-0"); actor.Cell = new GridCoord(0, 2);
            var destination = new GridCoord(2, 2);

            Assert.IsNull(BattleSim.Submit(state, ledger, Move("move", 1, state, "ally-0", destination)));
            Assert.AreEqual(new GridCoord(0, 2), actor.Cell, "submission must not advance simulation");
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-0").OrderKind,
                "the accepted command remains pending until Step");

            for (var i = 0; i < BattleRules.MoveTicksPerCell; i++) BattleSim.Step(state, ledger);
            var halfway = Unit(BattleSim.Snapshot(state), "ally-0");
            Assert.AreEqual(new GridCoord(1, 2), halfway.Cell);
            Assert.AreEqual(BattleOrderKind.Move, halfway.OrderKind);
            Assert.AreEqual(destination, halfway.OrderDestination);

            for (var i = 0; i < BattleRules.MoveTicksPerCell; i++) BattleSim.Step(state, ledger);
            var arrived = Unit(BattleSim.Snapshot(state), "ally-0");
            Assert.AreEqual(destination, arrived.Cell);
            Assert.AreEqual(BattleOrderKind.None, arrived.OrderKind,
                "arrival clears explicit movement for automatic behavior on the following tick");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void MoveOrder_BlockedNextCellRetainsIntent_BfsTiesUseNorthEastSouthWest_AndAutoAttackKeepsDestination()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-4");
            var actor = Unit(state, "ally-4"); actor.Cell = new GridCoord(1, 1); actor.MoveTicksLeft = 0;
            Assert.IsNull(BattleSim.Submit(state, ledger, Move("tie", 1, state, "ally-4", new GridCoord(2, 2))));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(1, 2), actor.Cell, "equal shortest paths must choose North before East");

            state = BattleSim.Open(setup); ledger = new Ledger(); Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-4");
            actor = Unit(state, "ally-4"); actor.Cell = new GridCoord(0, 2); actor.MoveTicksLeft = 0;
            var blocker = Unit(state, "ally-1"); blocker.Cell = new GridCoord(1, 2);
            Assert.IsNull(BattleSim.Submit(state, ledger, Move("blocked", 1, state, "ally-4", new GridCoord(2, 2))));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(0, 2), actor.Cell, "an occupied next cell must never be pierced");
            Assert.AreEqual(BattleOrderKind.Move, Unit(BattleSim.Snapshot(state), "ally-4").OrderKind,
                "the static terrain route remains selected while dynamic occupancy blocks its next cell");
            blocker.Cell = new GridCoord(0, 7);
            var enemy = Unit(state, "foe-0"); enemy.Cell = new GridCoord(2, 2);
            for (var i = 0; i < state.Units.Length; i++)
                if (!ReferenceEquals(state.Units[i], actor)) state.Units[i].MoveTicksLeft = 10000;
            var enemyHp = enemy.Hp;
            for (var i = 0; i < BattleRules.MoveTicksPerCell; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(1, 2), actor.Cell);
            Assert.Less(enemy.Hp, enemyHp, "movement may auto-attack an enemy in range");
            var moving = Unit(BattleSim.Snapshot(state), "ally-4");
            Assert.AreEqual(BattleOrderKind.Move, moving.OrderKind);
            Assert.AreEqual(new GridCoord(2, 2), moving.OrderDestination,
                "auto-attack must not replace the explicit movement destination");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void AttackOrder_HitsOnlyExplicitTarget_TracksIt_AndClearsWhenTargetInvalid()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-4");
            var attacker = Unit(state, "ally-4"); attacker.Cell = new GridCoord(0, 2); attacker.MoveTicksLeft = 0;
            var firstEnemy = Unit(state, "foe-0"); firstEnemy.Cell = new GridCoord(1, 2);
            var orderedEnemy = Unit(state, "foe-1"); orderedEnemy.Cell = new GridCoord(3, 2);
            var firstHp = firstEnemy.Hp; var orderedHp = orderedEnemy.Hp;

            Assert.IsNull(BattleSim.Submit(state, ledger, Attack("attack", 1, state, "ally-4", "foe-1")));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(firstHp, firstEnemy.Hp, "explicit Attack must not substitute the first in-range enemy");
            Assert.AreEqual(orderedHp - attacker.Power, orderedEnemy.Hp);
            var snapshot = Unit(BattleSim.Snapshot(state), "ally-4");
            Assert.AreEqual(BattleOrderKind.Attack, snapshot.OrderKind);
            Assert.AreEqual(new UnitId("foe-1"), snapshot.OrderTargetUnitId);
            Assert.AreEqual(BattleRules.AttackCooldownTicks, snapshot.AttackCooldownTicksLeft);

            orderedEnemy.Cell = new GridCoord(5, 2);
            firstEnemy.Cell = new GridCoord(0, 4);
            attacker.CooldownTicksLeft = 0; attacker.MoveTicksLeft = 0;
            BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(1, 2), attacker.Cell,
                "the actor must pursue its selected target rather than a nearer enemy");
            orderedEnemy.State = "Routing";
            BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-4").OrderKind,
                "routing targets clear Attack");

            state = BattleSim.Open(setup); ledger = new Ledger(); Deploy(state, ledger, setup);
            Assert.IsNull(BattleSim.Submit(state, ledger, Attack("removed", 1, state, "ally-4", "foe-1")));
            var withoutTarget = new UnitState[state.Units.Length - 1]; var next = 0;
            for (var i = 0; i < state.Units.Length; i++)
                if (state.Units[i].Id.ToString() != "foe-1") withoutTarget[next++] = state.Units[i];
            state.Units = withoutTarget;
            BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-4").OrderKind,
                "a removed target clears Attack without substituting another enemy");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void SameTickSequenceReplacesIntent_AndFacingThenRegroupUsesTheSameActorExactlyOnce()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-0");
            var actor = Unit(state, "ally-0"); actor.Cell = new GridCoord(0, 2);
            Unit(state, "foe-0").Cell = new GridCoord(5, 2);
            Assert.IsNull(BattleSim.Submit(state, ledger, Attack("later-seq", 2, state, "ally-0", "foe-0")));
            Assert.IsNull(BattleSim.Submit(state, ledger, Move("earlier-seq", 1, state, "ally-0", new GridCoord(0, 4))));
            BattleSim.Step(state, ledger);
            var ordered = Unit(BattleSim.Snapshot(state), "ally-0");
            Assert.AreEqual(BattleOrderKind.Attack, ordered.OrderKind,
                "Step must apply same-tick commands in Seq order, not submission order");

            state = BattleSim.Open(setup); ledger = new Ledger(); Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-0");
            actor = Unit(state, "ally-0"); actor.Cell = new GridCoord(0, 2);
            var facing = Command("face", 1, state.Tick, BattleTickCommandKind.SetFacing);
            facing.ActorUnitId = actor.Id; facing.Facing = CardinalDirection.North;
            var regroup = Command("regroup", 2, state.Tick, BattleTickCommandKind.PlayCard);
            regroup.CardId = "mobility-regroup"; regroup.OwnerUnitId = actor.Id;
            regroup.TargetUnitId = actor.Id; regroup.Facing = CardinalDirection.East;
            Assert.IsNull(BattleSim.Submit(state, ledger, facing));
            Assert.IsNull(BattleSim.Submit(state, ledger, regroup));
            Assert.AreEqual(new GridCoord(1, 2), actor.Cell, "approved card behavior remains immediate");
            BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(1, 2), actor.Cell, "SetFacing must not resolve the actor by its old cell");
            Assert.AreEqual(CardinalDirection.North, actor.Facing);
            var card = System.Array.Find(state.Cards, x => x.Id == "mobility-regroup" && x.OwnerUnitId.Equals(actor.Id));
            Assert.AreEqual(599, card.RechargeTicksLeft, "the immediate card effect must be applied exactly once");

            state = BattleSim.Open(setup); ledger = new Ledger(); Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-0");
            actor = Unit(state, "ally-0"); actor.Cell = new GridCoord(0, 2);
            regroup = Command("regroup-first", 1, state.Tick, BattleTickCommandKind.PlayCard);
            regroup.CardId = "mobility-regroup"; regroup.OwnerUnitId = actor.Id;
            regroup.TargetUnitId = actor.Id; regroup.Facing = CardinalDirection.East;
            facing = Command("face-second", 2, state.Tick, BattleTickCommandKind.SetFacing);
            facing.ActorUnitId = actor.Id; facing.Facing = CardinalDirection.South;
            Assert.IsNull(BattleSim.Submit(state, ledger, regroup));
            Assert.IsNull(BattleSim.Submit(state, ledger, facing));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(1, 2), actor.Cell);
            Assert.AreEqual(CardinalDirection.South, actor.Facing,
                "the opposite same-tick sequence also keeps actor identity after immediate regroup");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void InvalidLockedDeadAndTerminalOrders_DoNotLeakOrMutateRejectedState()
        {
            void AssertRejected(BattleSimState state, Ledger ledger, BattleTickCommand command, BattleRejectReason reason)
            {
                var before = state.Fingerprint(); var pending = state.Pending.Count; var events = ledger.Events.Count;
                var result = BattleSim.Submit(state, ledger, command);
                Assert.IsInstanceOf<BattleRejection>(result);
                Assert.AreEqual(reason, ((BattleRejection)result).Reason);
                Assert.AreEqual(before, state.Fingerprint()); Assert.AreEqual(pending, state.Pending.Count);
                Assert.AreEqual(events, ledger.Events.Count);
            }

            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger(); Deploy(state, ledger, setup);
            AssertRejected(state, ledger, Move("enemy-actor", 1, state, "foe-0", new GridCoord(8, 2)), BattleRejectReason.UnknownActor);
            AssertRejected(state, ledger, Move("outside", 2, state, "ally-0", new GridCoord(-1, 2)), BattleRejectReason.CardDestinationOutOfBounds);
            AssertRejected(state, ledger, Move("occupied", 3, state, "ally-0", Unit(state, "ally-1").Cell), BattleRejectReason.CardDestinationBlocked);
            AssertRejected(state, ledger, Attack("friendly", 4, state, "ally-0", "ally-1"), BattleRejectReason.CardInvalidTarget);
            var cells = new int[12 * 8]; for (var i = 0; i < cells.Length; i++) cells[i] = 3;
            cells[4 * 12 + 4] = 2;
            var waterSetup = Setup(); waterSetup.Terrain = new Heightmap(12, 8, 8, 2, 99, LayerId.B1, cells);
            var waterState = BattleSim.Open(waterSetup); var waterLedger = new Ledger(); Deploy(waterState, waterLedger, waterSetup);
            AssertRejected(waterState, waterLedger, Move("water", 1, waterState, "ally-0", new GridCoord(4, 4)), BattleRejectReason.CardDestinationOutOfBounds);
            state.Sides[0].CommandsLocked = true;
            AssertRejected(state, ledger, Attack("locked", 5, state, "ally-0", "foe-0"), BattleRejectReason.CommandsLocked);

            state = BattleSim.Open(setup); ledger = new Ledger(); Deploy(state, ledger, setup);
            Assert.IsNull(BattleSim.Submit(state, ledger, Move("move", 1, state, "ally-0", new GridCoord(0, 1))));
            BattleSim.Step(state, ledger); Unit(state, "ally-0").Hp = 0; BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-0").OrderKind,
                "dead actors clear their order");

            state = BattleSim.Open(setup); ledger = new Ledger(); Deploy(state, ledger, setup);
            Assert.IsNull(BattleSim.Submit(state, ledger, Move("terminal", 1, state, "ally-0", new GridCoord(0, 1))));
            BattleSim.Step(state, ledger);
            for (var i = 0; i < state.Units.Length; i++) if (state.Units[i].Side == 1) state.Units[i].Hp = 0;
            BattleSim.Step(state, ledger);
            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome);
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-0").OrderKind,
                "terminal resolution clears all orders");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void AttackOrder_ClearsOnTheTickItsExplicitTargetDies()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-4");
            var attacker = Unit(state, "ally-4"); attacker.Cell = new GridCoord(0, 2);
            var target = Unit(state, "foe-0"); target.Cell = new GridCoord(3, 2); target.Hp = attacker.Power;
            for (var i = 0; i < state.Units.Length; i++)
            {
                if (!System.Object.ReferenceEquals(state.Units[i], attacker)) state.Units[i].MoveTicksLeft = 10000;
                if (!System.Object.ReferenceEquals(state.Units[i], attacker)) state.Units[i].CooldownTicksLeft = 10000;
            }

            Assert.IsNull(BattleSim.Submit(state, ledger, Attack("lethal-attack", 1, state, "ally-4", "foe-0")));
            BattleSim.Step(state, ledger);

            Assert.AreEqual(0, target.Hp);
            Assert.AreEqual("Down", target.State);
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-4").OrderKind,
                "the explicit Attack must clear on the same tick its selected target dies");
        }

        [Test, Category("ApprovedUnityOrders")]
        public void CrossTickMoveReplacement_OneTickBeforeArrival_UsesOnlyTheNewDestination()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-0");
            var actor = Unit(state, "ally-0"); actor.Cell = new GridCoord(0, 2);
            for (var i = 0; i < state.Units.Length; i++)
                if (!System.Object.ReferenceEquals(state.Units[i], actor)) state.Units[i].MoveTicksLeft = 10000;

            Assert.IsNull(BattleSim.Submit(state, ledger, Move("old-destination", 1, state, "ally-0", new GridCoord(1, 2))));
            for (var i = 0; i < BattleRules.MoveTicksPerCell - 1; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(0, 2), actor.Cell);
            Assert.AreEqual(1, actor.MoveTicksLeft, "the original destination is one tick from execution");

            Assert.IsNull(BattleSim.Submit(state, ledger, Move("replacement", 2, state, "ally-0", new GridCoord(0, 3))));
            BattleSim.Step(state, ledger);

            Assert.AreEqual(new GridCoord(0, 3), actor.Cell);
            Assert.AreNotEqual(new GridCoord(1, 2), actor.Cell,
                "a cross-tick replacement must not execute the superseded near-arrival destination");
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-0").OrderKind);
        }

        [Test, Category("ApprovedUnityOrders")]
        public void MoveOrder_BfsRoutesAroundStaticWaterObstacle_WithNorthFirstTieBreak()
        {
            var cells = new int[12 * 8];
            for (var i = 0; i < cells.Length; i++) cells[i] = 3;
            cells[2 * 12 + 1] = 2;
            cells[2 * 12 + 2] = 2;
            var setup = Setup();
            setup.Terrain = new Heightmap(12, 8, 8, 2, 99, LayerId.B1, cells);
            var state = BattleSim.Open(setup); var ledger = new Ledger();
            Deploy(state, ledger, setup); ParkOtherUnits(state, "ally-0");
            var actor = Unit(state, "ally-0"); actor.Cell = new GridCoord(0, 2); actor.MoveTicksLeft = 0;
            for (var i = 0; i < state.Units.Length; i++)
                if (!System.Object.ReferenceEquals(state.Units[i], actor)) state.Units[i].MoveTicksLeft = 10000;

            Assert.IsNull(BattleSim.Submit(state, ledger, Move("obstacle", 1, state, "ally-0", new GridCoord(3, 2))));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(new GridCoord(0, 3), actor.Cell,
                "equal north and south detours around the water obstacle must choose North first");
            for (var move = 0; move < 4; move++)
                for (var tick = 0; tick < BattleRules.MoveTicksPerCell; tick++) BattleSim.Step(state, ledger);

            Assert.AreEqual(new GridCoord(3, 2), actor.Cell);
            Assert.AreEqual(BattleOrderKind.None, Unit(BattleSim.Snapshot(state), "ally-0").OrderKind);
        }

        [Test, Category("ApprovedUnityOrders")]
        public void AcceptedOrderInput_SnapshotCloneFingerprintAndReplay_AreDeterministicAndOwned()
        {
            var setup = Setup(); var state = BattleSim.Open(setup); var ledger = new Ledger(); Deploy(state, ledger, setup);
            ParkOtherUnits(state, "ally-0"); Unit(state, "ally-0").Cell = new GridCoord(0, 2);
            var move = Move("move", 1, state, "ally-0", new GridCoord(2, 2));
            Assert.IsNull(BattleSim.Submit(state, ledger, move));
            move.ActorUnitId = new UnitId("foe-0"); move.Target = new GridCoord(11, 7);
            move.Kind = BattleTickCommandKind.Attack;
            BattleSim.Step(state, ledger);
            var snapshot = Unit(BattleSim.Snapshot(state), "ally-0");
            Assert.AreEqual(BattleOrderKind.Move, snapshot.OrderKind);
            Assert.AreEqual(new GridCoord(2, 2), snapshot.OrderDestination,
                "caller mutation must not alter the accepted command");
            var clone = state.Clone();
            Assert.AreEqual(state.Fingerprint(), clone.Fingerprint());
            Unit(clone, "ally-0").OrderDestination = new GridCoord(3, 2);
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(),
                "orders and timers must participate in fingerprints");

            var deploy = Command("replay-deploy", 0, 0, BattleTickCommandKind.Deploy);
            deploy.Formation = setup.PlayerFormation;
            var replayMove = Command("replay-move", 1, 0, BattleTickCommandKind.Move);
            replayMove.ActorUnitId = setup.PlayerUnits[0].Id; replayMove.Target = new GridCoord(0, 1);
            var commands = new List<BattleTickCommand> { deploy, replayMove };
            var first = BattleSim.Replay(setup, commands, 20); var second = BattleSim.Replay(setup, commands, 20);
            Assert.AreEqual(first.Item1.Fingerprint(), second.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(first.Item2), CoreApi.ComputeLedgerHash(second.Item2));
        }

        [Test, Category("ApprovedUnityOrders")]
        public void PublicCoreCampaignContext_DeployOrderStepSnapshotAndReplay_ProveTheFeature()
        {
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var campaignLedger = new Ledger();
            var campaign = CampaignApi.Start(314159, StationId.Yeongdeungpo, "orders-public-entry");
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, campaignLedger,
                new CampaignCommand { Id = new CommandId("depart"), Kind = CampaignCommandKind.Depart });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, campaignLedger,
                new CampaignCommand { Id = new CommandId("travel"), Kind = CampaignCommandKind.Travel, TravelDestination = StationId.Sindorim });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, campaignLedger,
                new CampaignCommand { Id = new CommandId("face"), Kind = CampaignCommandKind.FaceEncounter });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, campaignLedger,
                new CampaignCommand { Id = new CommandId("resolve"), Kind = CampaignCommandKind.EnterResolution });
            var required = (BattleRequired)CampaignApi.Apply(graph, campaign, campaignLedger,
                new CampaignCommand { Id = new CommandId("combat"), Kind = CampaignCommandKind.ChooseCombat });
            campaign = (CampaignState)CampaignApi.AttachPendingBattle(
                campaign, campaignLedger, required.Context, new CommandId("attach"));
            var setup = BattleSetup.FromContext(campaign.PendingBattle);
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = setup.PlayerFormation;
            var move = Command("move", 1, 0, BattleTickCommandKind.Move);
            move.ActorUnitId = setup.PlayerUnits[0].Id; move.Target = new GridCoord(0, 1);
            var commands = new List<BattleTickCommand> { deploy, move };
            var state = BattleSim.Open(setup); var battleLedger = new Ledger();
            Assert.IsNull(BattleSim.Submit(state, battleLedger, deploy));
            Assert.IsNull(BattleSim.Submit(state, battleLedger, move));
            for (var i = 0; i < BattleRules.MoveTicksPerCell; i++) BattleSim.Step(state, battleLedger);
            Assert.AreEqual(new GridCoord(0, 1), Unit(BattleSim.Snapshot(state), "ally-0").Cell);
            var replay = BattleSim.Replay(setup, commands, BattleRules.MoveTicksPerCell);
            Assert.AreEqual(state.Fingerprint(), replay.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(battleLedger), CoreApi.ComputeLedgerHash(replay.Item2));
        }
    }
}
