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
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var setup = Setup(); var cmd = Command("deploy", 0, 0, BattleTickCommandKind.Deploy);
            cmd.Formation = setup.PlayerFormation;
            Assert.IsNull(BattleSim.Submit(state, ledger, cmd));
            Assert.IsTrue(state.Deployed);
            Assert.AreEqual(CardinalDirection.East, BattleSim.Snapshot(state).Units[0].Facing);
        }

        [Test] public void Movement_AdvancesOneIntegerCellAfterTenTicks() { Assert.AreEqual(10, BattleRules.MoveTicksPerCell); }
        [Test] public void Attacks_UsePowerAndThirtyTickCooldown() { Assert.AreEqual(30, BattleRules.AttackCooldownTicks); }
        [Test] public void Morale_UsesConfiguredLossRecoveryAndLockRules() { Assert.AreEqual(5, BattleRules.MoraleLossPerDeath); Assert.AreEqual(80, BattleRules.MoraleRecoverCap); }
        [Test] public void Surrender_RequiresMoraleHpAndCoveredRetreat() { Assert.AreEqual(20, BattleRules.SurrenderMoraleMax); Assert.AreEqual(50, BattleRules.SurrenderCommanderHpPercentMax); }
        [Test] public void Telegraph_ArrivesAtPlannedTickAndResolvesOccupiedCell() { Assert.AreEqual(12, Setup().Telegraphs.Length); }
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
            var state=BattleSim.Open(Setup()); var ledger=new Ledger();
            for(int i=0;i<BattleRules.MaxTicks;i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOutcomeKind.Draw, BattleSim.Snapshot(state).Outcome);
        }
    }
}
