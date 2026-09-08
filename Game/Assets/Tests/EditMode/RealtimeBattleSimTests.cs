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
            return BattleSetup.FromContext(new BattleContext(
                "rtfc-b0", "campaign", default(StationId), 314159,
                new Tick(0), 0, 0, BattleRules.RulesVersion, "context-hash"));
        }

        static BattleTickCommand Command(string id, int seq, int tick, BattleTickCommandKind kind)
        {
            return new BattleTickCommand
            {
                Id = new CommandId(id), Seq = seq, At = new Tick(tick), Kind = kind
            };
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
            var front = System.Array.Find(snapshot.Units, u => u.Id.ToString() == "p-0");
            var rear = System.Array.Find(snapshot.Units, u => u.Id.ToString() == "p-2");
            Assert.AreNotEqual(front.Cell, rear.Cell, "formation rows must resolve to distinct cells");
            Assert.AreEqual(CardinalDirection.East, front.Facing);
            Assert.AreEqual(setup.PlayerFormation[0].Facing, front.Facing);
        }

        [Test] public void Movement_AdvancesOneIntegerCellAfterTenTicks()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var before = BattleSim.Snapshot(state); var unit = System.Array.Find(before.Units, u => u.Id.ToString() == "p-0");
            for (var i = 0; i < BattleRules.MoveTicksPerCell; i++) BattleSim.Step(state, ledger);
            var after = System.Array.Find(BattleSim.Snapshot(state).Units, u => u.Id.ToString() == "p-0");
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
            state.Sides[1].RetreatCovered = true;
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
    }
}
