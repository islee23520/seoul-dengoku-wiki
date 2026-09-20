using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class SquadOrderTests
    {
        static BattleSimState State(out Ledger ledger)
        {
            var context = BattleContext.Create("campaign", default(StationId), 314159, new Tick(0), 0, 0, BattleRules.RulesVersion, "task12", UnitHpSnapshot.DefaultParty());
            var setup = BattleSetup.FromContext(context);
            setup.PlayerHeroId = new HeroId("hero-0");
            var state = BattleSim.Open(setup);
            ledger = new Ledger();
            var deploy = new BattleTickCommand { Id = new CommandId("deploy"), At = new Tick(0), Seq = 0, Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation };
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));
            return state;
        }

        [Test]
        public void PreviewReplaceStopAndPause()
        {
            var state = State(out var ledger);
            var before = state.Fingerprint();
            var order = new SquadOrder { CommandId = new CommandId("order-1"), ActorIds = new[] { "ally-0" }, Kind = BattleOrderKind.Move, Destination = new GridCoord(4, 2) };
            var preview = BattleSim.PreviewOrder(state, order);
            Assert.IsTrue(preview.Accepted);
            Assert.AreEqual(before, state.Fingerprint());
            Assert.IsTrue(BattleSim.ConfirmOrder(state, ledger, order).Accepted);
            var replayEvents = ledger.Events.Count;
            Assert.IsTrue(BattleSim.ConfirmOrder(state, ledger, order).Accepted);
            Assert.AreEqual(replayEvents, ledger.Events.Count);
            BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOrderKind.Move, state.Units[0].OrderKind);
            var replacement = order.Clone(); replacement.CommandId = new CommandId("order-2"); replacement.Kind = BattleOrderKind.Attack; replacement.TargetUnitId = state.Units[6].Id;
            Assert.IsTrue(BattleSim.ConfirmOrder(state, ledger, replacement).Accepted);
            Assert.IsTrue(BattleSim.CancelOrder(state, replacement.CommandId));
            Assert.IsTrue(BattleSim.StopOrder(state, ledger, replacement.CommandId, new[] { "ally-0" }).Accepted);
            var hero = state.Heroes[0];
            var heroOrder = new SquadOrder { CommandId = new CommandId("hero-order"), ActorIds = new[] { hero.Id.Value }, Kind = BattleOrderKind.Move, Destination = new GridCoord(2, 2) };
            Assert.IsTrue(BattleSim.ConfirmOrder(state, ledger, heroOrder).Accepted);
            Assert.AreEqual(BattleOrderKind.Move, hero.OrderKind);
        }

        [Test]
        public void InvalidMemberRejectsWholeGroup()
        {
            var state = State(out var ledger);
            var before = state.Fingerprint();
            var order = new SquadOrder { CommandId = new CommandId("bad"), ActorIds = new[] { "ally-0", "foreign" }, Kind = BattleOrderKind.Move, Destination = new GridCoord(4, 2) };
            Assert.IsFalse(BattleSim.PreviewOrder(state, order).Accepted);
            Assert.IsFalse(BattleSim.ConfirmOrder(state, ledger, order).Accepted);
            Assert.AreEqual(before, state.Fingerprint());
            var accepted = new SquadOrder { CommandId = new CommandId("same"), ActorIds = new[] { "ally-0" }, Kind = BattleOrderKind.Move, Destination = new GridCoord(3, 2) };
            Assert.IsTrue(BattleSim.ConfirmOrder(state, ledger, accepted).Accepted);
            var conflict = accepted.Clone(); conflict.Destination = new GridCoord(5, 2);
            Assert.IsTrue(BattleSim.ConfirmOrder(state, ledger, conflict).Conflict);
        }
    }
}
