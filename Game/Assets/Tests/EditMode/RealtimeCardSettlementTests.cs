using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class RealtimeCardSettlementTests
    {
        static BattleSetup Setup()
        {
            return BattleSetup.FromContext(new BattleContext(
                "rtfc-c0", "campaign", default(StationId), 271828,
                new Tick(0), 0, 0, BattleRules.RulesVersion, "context-hash"));
        }

        static BattleTickCommand Command(string id, int seq, int tick, BattleTickCommandKind kind)
        {
            return new BattleTickCommand { Id = new CommandId(id), Seq = seq, At = new Tick(tick), Kind = kind };
        }

        [Test]
        public void Catalog_IsStaticGrantType_NoDeckNoDraw()
        {
            var first = CardCatalog.All();
            var second = CardCatalog.All();
            Assert.Greater(first.Count, 0);
            Assert.AreEqual(first.Count, second.Count);
            foreach (var card in first)
            {
                Assert.IsFalse(string.IsNullOrEmpty(card.Id));
                Assert.That(card.Kind, Is.EqualTo(CardKind.Character).Or.EqualTo(CardKind.Stronghold));
                Assert.That(card.RechargeTicks, Is.InRange(300, 900));
                Assert.IsNotNull(card.Effect);
            }
            Assert.IsFalse(CardCatalog.HasDeck);
            Assert.IsFalse(CardCatalog.HasDraw);
        }

        [Test]
        public void PlayCard_RechargesOverTicks()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            var card = CardCatalog.All()[0];
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy);
            deploy.Formation = Setup().PlayerFormation;
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));
            var play = Command("play", 1, 0, BattleTickCommandKind.PlayCard);
            play.CardId = card.Id;
            Assert.IsNull(BattleSim.Submit(state, ledger, play));
            var view = System.Array.Find(BattleSim.Snapshot(state).Cards, x => x.Id == card.Id);
            Assert.AreEqual(card.RechargeTicks, view.RechargeTicksLeft);
            for (var i = 0; i < card.RechargeTicks; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(0, System.Array.Find(BattleSim.Snapshot(state).Cards, x => x.Id == card.Id).RechargeTicksLeft);
            Assert.IsNull(BattleSim.Submit(state, ledger, Command("play-again", 2, state.Tick, BattleTickCommandKind.PlayCard)));
        }

        [Test]
        public void PlayCard_RejectedWhileRecharging()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var card = CardCatalog.All()[0];
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = Setup().PlayerFormation;
            BattleSim.Submit(state, ledger, deploy);
            var play = Command("play", 1, 0, BattleTickCommandKind.PlayCard); play.CardId = card.Id;
            BattleSim.Submit(state, ledger, play);
            var before = state.Fingerprint(); var events = ledger.Events.Count;
            var retry = Command("retry", 2, 0, BattleTickCommandKind.PlayCard); retry.CardId = card.Id;
            var rejection = (BattleRejection)BattleSim.Submit(state, ledger, retry);
            Assert.AreEqual(BattleRejectReason.CardRecharging, rejection.Reason);
            Assert.AreEqual(before, state.Fingerprint()); Assert.AreEqual(events, ledger.Events.Count);
        }

        [Test]
        public void PlayCard_OutOfCommandRadius_Fails()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var play = Command("far", 0, 0, BattleTickCommandKind.PlayCard); play.CardId = CardCatalog.All()[0].Id; play.Target = new GridCoord(99, 99);
            var rejection = (BattleRejection)BattleSim.Submit(state, ledger, play);
            Assert.AreEqual(BattleRejectReason.CardOutOfRadius, rejection.Reason);
        }

        [Test]
        public void StrongholdCardSlots_LimitedToTwo()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = Setup().PlayerFormation; deploy.StrongholdCards = new[] { "supply", "pass", "extra" };
            var rejection = (BattleRejection)BattleSim.Submit(state, ledger, deploy);
            Assert.AreEqual(BattleRejectReason.MalformedCommand, rejection.Reason);
        }

        [Test]
        public void Replay_WithDeployAndPlayCard_IsDeterministicWithoutPauseTicks()
        {
            var setup = Setup(); var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = setup.PlayerFormation;
            var play = Command("play", 1, 0, BattleTickCommandKind.PlayCard); play.CardId = CardCatalog.All()[0].Id;
            var commands = new List<BattleTickCommand> { deploy, play };
            var a = BattleSim.Replay(setup, commands, 64); var b = BattleSim.Replay(setup, commands, 64);
            Assert.AreEqual(a.Item1.Fingerprint(), b.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(a.Item2), CoreApi.ComputeLedgerHash(b.Item2));
        }

        [Test]
        public void ToEncounterResult_MapsRetreatSurrenderDistinctly()
        {
            var retreat = new BattleResult { Outcome = BattleOutcomeKind.PlayerRetreat, ResultHash = "retreat" }.ToEncounterResult();
            var surrender = new BattleResult { Outcome = BattleOutcomeKind.EnemySurrender, ResultHash = "surrender" }.ToEncounterResult();
            Assert.AreNotEqual(retreat.ResultHash, surrender.ResultHash);
            Assert.AreNotEqual(retreat.Outcome, surrender.Outcome);
        }

        [Test]
        public void Settlement_ExactOnce_SurvivesDomainSwap()
        {
            var battle = BattleSim.Open(Setup());
            var result = SettlementApi.FromBattle(battle);
            var campaign = CampaignFixtures.PendingBattle(result.BattleId);
            var ledger = new Ledger(); var book = new SettlementBook();
            var first = SettlementApi.Apply(campaign, ledger, book, result);
            var duplicate = SettlementApi.Apply(((SettlementSuccess)first).State, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(((SettlementSuccess)first).Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
        }

        [Test]
        public void CampaignRoundTrip_UsesNewBattleResult()
        {
            var campaign = CampaignFixtures.ChooseCombat();
            var battle = BattleSim.Open(campaign.PendingBattle.ToBattleContext());
            var result = SettlementApi.FromBattle(BattleSim.Result(battle));
            var settled = (SettlementSuccess)SettlementApi.Apply(campaign, new Ledger(), new SettlementBook(), result);
            Assert.IsTrue(settled.State.SettlementApplied);
            Assert.AreNotEqual(CampaignStage.Resolution, settled.State.Stage);
        }
    }
}
