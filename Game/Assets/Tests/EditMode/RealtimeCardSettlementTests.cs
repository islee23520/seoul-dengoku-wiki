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

        static void Deploy(BattleSimState state, Ledger ledger, params string[] strongholdCards)
        {
            var deploy = Command("deploy", 0, state.Tick, BattleTickCommandKind.Deploy);
            deploy.Formation = Setup().PlayerFormation;
            deploy.StrongholdCardIds = strongholdCards;
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));
        }

        static void Play(BattleSimState state, Ledger ledger, string cardId, int seq)
        {
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var play = Command("play-" + cardId, seq, state.Tick, BattleTickCommandKind.PlayCard);
            play.CardId = cardId;
            play.Target = commander.Cell;
            Assert.IsNull(BattleSim.Submit(state, ledger, play));
        }

        static void IsolateDuel(BattleSimState state, int playerPower, int enemyPower)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                state.Units[i].State = "Down";
                state.Units[i].Hp = 0;
            }

            var player = state.Units[0];
            var enemy = state.Units[6];
            player.State = "Active";
            player.Hp = player.MaxHp;
            player.Power = playerPower;
            player.Cell = new GridCoord(4, 4);
            player.RangeMin = 1;
            player.RangeMax = 1;
            player.CooldownTicksLeft = 0;
            enemy.State = "Active";
            enemy.Hp = enemy.MaxHp;
            enemy.Power = enemyPower;
            enemy.Cell = new GridCoord(5, 4);
            enemy.RangeMin = 1;
            enemy.RangeMax = 1;
            enemy.CooldownTicksLeft = 0;
        }

        static void KeepDuelOutOfCombat(BattleSimState state)
        {
            state.Units[0].Cell = new GridCoord(0, 0);
            state.Units[6].Cell = new GridCoord(11, 7);
            state.Units[0].MoveTicksLeft = 10000;
            state.Units[6].MoveTicksLeft = 10000;
            state.Units[0].CooldownTicksLeft = 10000;
            state.Units[6].CooldownTicksLeft = 10000;
        }

        static CampaignState CampaignWithPendingBattle()
        {
            Ledger ledger;
            return CampaignWithPendingBattle(out ledger);
        }

        static CampaignState CampaignWithPendingBattle(out Ledger ledger)
        {
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            ledger = new Ledger();
            var campaign = CampaignApi.Start(271828, StationId.Yeongdeungpo, "roundtrip-campaign");
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("depart"), Kind = CampaignCommandKind.Depart });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("travel"), Kind = CampaignCommandKind.Travel, TravelDestination = StationId.Sindorim });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("face"), Kind = CampaignCommandKind.FaceEncounter });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("resolution"), Kind = CampaignCommandKind.EnterResolution });
            var handoff = CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("combat"), Kind = CampaignCommandKind.ChooseCombat });
            var context = ((BattleRequired)handoff).Context;
            return (CampaignState)CampaignApi.AttachPendingBattle(campaign, ledger, context, new CommandId("attach"));
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
            var playAgain = Command("play-again", 2, state.Tick, BattleTickCommandKind.PlayCard); playAgain.CardId = card.Id; var aliveUnit = System.Array.Find(BattleSim.Snapshot(state).Units, u => u.Side == 0); playAgain.Target = aliveUnit.Cell; Assert.IsNull(BattleSim.Submit(state, ledger, playAgain));
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
        public void GuardShieldwall_ReducesActualReceivedDamageByThreeFor150Ticks_ThenExpires()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            IsolateDuel(state, 0, 5);
            Play(state, ledger, "guard-shieldwall", 1);

            state.Units[0].CooldownTicksLeft = 10000;
            var hp = state.Units[0].Hp;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 2, state.Units[0].Hp, "guard must reduce a real 5 damage strike to 2");

            state.Units[0].Hp = hp;
            state.Units[6].Power = 2;
            state.Units[6].CooldownTicksLeft = 0;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp, state.Units[0].Hp, "guard damage floors at zero");

            KeepDuelOutOfCombat(state);
            for (var i = 0; i < 149 && state.Outcome == BattleOutcomeKind.Ongoing; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(1, System.Array.Find(state.Cards, c => c.Id == "guard-shieldwall").ActiveTicksLeft);
            BattleSim.Step(state, ledger);
            Assert.AreEqual(0, System.Array.Find(state.Cards, c => c.Id == "guard-shieldwall").ActiveTicksLeft);
            state.Units[0].Cell = new GridCoord(4, 4);
            state.Units[6].Cell = new GridCoord(5, 4);
            state.Units[6].Power = 5;
            state.Units[6].CooldownTicksLeft = 0;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 5, state.Units[0].Hp, "guard must expire after 150 simulation ticks");
        }

        [Test]
        public void PincerFocus_AddsOneActualOutgoingDamageFor150Ticks_ThenExpires()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            IsolateDuel(state, 4, 0);
            Play(state, ledger, "pincer-focus", 1);

            state.Units[6].CooldownTicksLeft = 10000;
            var hp = state.Units[6].Hp;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 5, state.Units[6].Hp, "pincer must increase a real outgoing strike from 4 to 5");

            state.Units[6].Hp = hp;
            KeepDuelOutOfCombat(state);
            for (var i = 0; i < 149 && state.Outcome == BattleOutcomeKind.Ongoing; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(1, System.Array.Find(state.Cards, c => c.Id == "pincer-focus").ActiveTicksLeft);
            BattleSim.Step(state, ledger);
            Assert.AreEqual(0, System.Array.Find(state.Cards, c => c.Id == "pincer-focus").ActiveTicksLeft);
            state.Units[0].Cell = new GridCoord(4, 4);
            state.Units[6].Cell = new GridCoord(5, 4);
            state.Units[0].CooldownTicksLeft = 0;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 4, state.Units[6].Hp, "pincer must expire after 150 simulation ticks");
        }

        [Test]
        public void PassageRetreat_SelectedStronghold_EnablesFriendlyRetreatPath()
        {
            var unavailable = BattleSim.Open(Setup());
            var unavailableLedger = new Ledger();
            Deploy(unavailable, unavailableLedger);
            var retreat = Command("retreat-without-passage", 1, 0, BattleTickCommandKind.OrderRetreat);
            var rejection = BattleSim.Submit(unavailable, unavailableLedger, retreat);
            Assert.IsInstanceOf<BattleRejection>(rejection);

            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "passage-retreat");
            Play(state, ledger, "passage-retreat", 1);
            var enabledRetreat = Command("retreat-through-passage", 2, state.Tick, BattleTickCommandKind.OrderRetreat);
            Assert.IsNull(BattleSim.Submit(state, ledger, enabledRetreat));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOutcomeKind.PlayerRetreat, state.Outcome);
        }

        [Test]
        public void StrongholdCard_MustBeSelectedAtDeploy()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var play = Command("unselected-supply", 1, state.Tick, BattleTickCommandKind.PlayCard);
            play.CardId = "supply-heal";
            play.Target = commander.Cell;
            var rejection = BattleSim.Submit(state, ledger, play);
            Assert.IsInstanceOf<BattleRejection>(rejection);
            Assert.AreEqual(BattleRejectReason.CardUnknown, ((BattleRejection)rejection).Reason);
        }

        [Test]
        public void CardRadius_RequiresLivingCommander_NotNearbyDeadUnit()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            commander.State = "Down";
            commander.Hp = 0;
            var nearby = System.Array.Find(state.Units, u => u.Side == 0 && !u.Id.Equals(state.PlayerCommanderId));
            var play = Command("dead-commander", 1, state.Tick, BattleTickCommandKind.PlayCard);
            play.CardId = "guard-shieldwall";
            play.Target = nearby.Cell;
            var rejection = BattleSim.Submit(state, ledger, play);
            Assert.IsInstanceOf<BattleRejection>(rejection);
            Assert.AreEqual(BattleRejectReason.CardOutOfRadius, ((BattleRejection)rejection).Reason);
        }

        [Test]
        public void SupplyHeal_DoesNotReviveDownFrontUnit()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "supply-heal");
            state.Units[0].State = "Down";
            state.Units[0].Hp = 0;
            state.PlayerCommanderId = state.Units[1].Id;
            state.Units[1].Hp -= 5;
            Play(state, ledger, "supply-heal", 1);
            Assert.AreEqual(0, state.Units[0].Hp);
            Assert.AreEqual("Down", state.Units[0].State);
            Assert.AreEqual(state.Units[1].MaxHp, state.Units[1].Hp);
        }

        [Test]
        public void CloneAndFingerprint_IncludeActiveModifiersRechargeAndEligibility()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "passage-retreat");
            Play(state, ledger, "guard-shieldwall", 1);
            var clone = state.Clone();
            Assert.AreEqual(state.Fingerprint(), clone.Fingerprint());

            clone.Cards[0].RechargeTicksLeft--;
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "recharge must affect replay fingerprint");
            clone = state.Clone();
            var activeTicks = typeof(CardState).GetField("ActiveTicksLeft");
            Assert.IsNotNull(activeTicks, "active modifier countdown must be stored in replay state");
            activeTicks.SetValue(clone.Cards[0], (int)activeTicks.GetValue(clone.Cards[0]) - 1);
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "active modifier countdown must affect replay fingerprint");
            clone = state.Clone();
            clone.StrongholdCardIds = new[] { "supply-heal" };
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "selected stronghold eligibility must affect replay fingerprint");
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
        public void StrongholdSelection_RejectsUnknownOrCharacterCardIds()
        {
            foreach (var invalid in new[] { "unknown-card", "guard-shieldwall" })
            {
                var state = BattleSim.Open(Setup());
                var ledger = new Ledger();
                var deploy = Command("deploy-" + invalid, 0, 0, BattleTickCommandKind.Deploy);
                deploy.Formation = Setup().PlayerFormation;
                deploy.StrongholdCardIds = new[] { invalid };
                var rejection = BattleSim.Submit(state, ledger, deploy);
                Assert.IsInstanceOf<BattleRejection>(rejection);
                Assert.AreEqual(BattleRejectReason.MalformedCommand, ((BattleRejection)rejection).Reason);
            }
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
        public void CombatSettlement_OngoingBattleResult_IsRejectedWithoutMutation()
        {
            var campaign = CampaignWithPendingBattle();
            var ledger = new Ledger();
            var book = new SettlementBook();
            var ongoingBattle = BattleSim.Result(BattleSim.Open(BattleSetup.FromContext(campaign.PendingBattle)));
            var before = CampaignApi.ComputeCampaignHash(campaign, ledger);
            Assert.Throws<System.ArgumentException>(() => SettlementApi.FromRealtimeResult(ongoingBattle));
            Assert.AreEqual(before, CampaignApi.ComputeCampaignHash(campaign, ledger));
            Assert.AreEqual(0, ledger.Events.Count);
        }

        [Test]
        public void CombatSettlement_NoPendingBattle_RejectsWithoutStateLedgerOrBookMutation()
        {
            var campaign = CampaignWithPendingBattle();
            var noPending = campaign.Clone();
            noPending.PendingBattle = null;
            var ledger = new Ledger();
            var book = new SettlementBook();
            var result = new EncounterResult
            {
                ResultId = new ResultId("result-no-pending"),
                BattleId = new BattleId(campaign.PendingBattle.BattleId),
                Outcome = SettlementOutcomeKind.PlayerVictory,
                ResultHash = CoreApi.StableHashHex("terminal-no-pending")
            };
            var beforeHash = CampaignApi.ComputeCampaignHash(noPending, ledger);
            var beforeEvents = ledger.Events.Count;

            var rejection = SettlementApi.Apply(noPending, ledger, book, result);
            Assert.IsInstanceOf<SettlementRejection>(rejection);
            Assert.AreEqual(SettlementRejectReason.NoPendingBattle, ((SettlementRejection)rejection).Reason);
            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(noPending, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.IsFalse(book.TryGetByResultId(result.ResultId, out _, out _));
            Assert.IsFalse(book.TryGetResultIdForBattle(result.BattleId, out _));
        }

        [Test]
        public void Settlement_ExactOnce_SurvivesDomainSwap()
        {
            var campaign = CampaignWithPendingBattle();
            var battle = BattleSim.Open(BattleSetup.FromContext(campaign.PendingBattle));
            battle.Tick = BattleRules.MaxTicks - 1;
            BattleSim.Step(battle, new Ledger());
            Assert.AreEqual(BattleOutcomeKind.Draw, battle.Outcome, "fixture must reach a real terminal outcome");
            var result = BattleSim.Result(battle).ToEncounterResult();
            var ledger = new Ledger(); var book = new SettlementBook();
            var first = SettlementApi.Apply(campaign, ledger, book, result);
            var duplicate = SettlementApi.Apply(((SettlementSuccess)first).State, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(((SettlementSuccess)first).Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
        }

        [Test]
        public void CampaignBattleCardSettlementDuplicateReturn_RoundTripTranscript()
        {
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var campaign = CampaignWithPendingBattle(out var campaignLedger);
            var context = campaign.PendingBattle;
            var battle = BattleSim.Open(BattleSetup.FromContext(context));
            var battleLedger = new Ledger();
            Deploy(battle, battleLedger, "passage-retreat");
            Play(battle, battleLedger, "passage-retreat", 1);
            var rechargeStart = System.Array.Find(battle.Cards, c => c.Id == "passage-retreat").RechargeTicksLeft;
            var retreat = Command("roundtrip-retreat", 2, battle.Tick, BattleTickCommandKind.OrderRetreat);
            Assert.IsNull(BattleSim.Submit(battle, battleLedger, retreat));
            BattleSim.Step(battle, battleLedger);
            var rechargeAfterTick = System.Array.Find(battle.Cards, c => c.Id == "passage-retreat").RechargeTicksLeft;
            Assert.AreEqual(750, rechargeStart);
            Assert.AreEqual(749, rechargeAfterTick);
            Assert.AreEqual(BattleOutcomeKind.PlayerRetreat, battle.Outcome);

            var battleResult = BattleSim.Result(battle);
            var result = SettlementApi.FromRealtimeResult(battleResult);
            Assert.AreEqual(context.BattleId, battleResult.BattleId);
            Assert.AreEqual(context.BattleId, result.BattleId.Value);
            Assert.AreNotEqual(SettlementOutcomeKind.None, result.Outcome);

            var book = new SettlementBook();
            var before = CampaignApi.ComputeCampaignHash(campaign, campaignLedger);
            var first = (SettlementSuccess)SettlementApi.Apply(campaign, campaignLedger, book, result);
            var settledHash = CampaignApi.ComputeCampaignHash(first.State, campaignLedger);
            var settledEvents = campaignLedger.Events.Count;
            var duplicate = SettlementApi.Apply(first.State, campaignLedger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(first.Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
            Assert.AreEqual(settledHash, CampaignApi.ComputeCampaignHash(first.State, campaignLedger));
            Assert.AreEqual(settledEvents, campaignLedger.Events.Count);

            var returned = (CampaignState)CampaignApi.Apply(graph, first.State, campaignLedger, new CampaignCommand
            {
                Id = new CommandId("roundtrip-return"),
                Kind = CampaignCommandKind.CompleteReturn
            });
            var returnHash = CampaignApi.ComputeCampaignHash(returned, campaignLedger);
            Assert.AreEqual(CampaignStage.BaseReady, returned.Stage);
            Assert.AreEqual(returned.HomeBase, returned.Node);

            System.Console.WriteLine(
                "ROUNDTRIP"
                + ";campaign=" + campaign.CampaignId
                + ";battle=" + context.BattleId
                + ";contextHash=" + context.ContextHash
                + ";card=passage-retreat"
                + ";cardTick=0"
                + ";rechargeStart=" + rechargeStart
                + ";rechargeAfterTick=" + rechargeAfterTick
                + ";terminal=" + battleResult.Outcome
                + ";terminalTick=" + battleResult.FinalTick
                + ";battleHash=" + battleResult.ResultHash
                + ";battleLedgerHash=" + CoreApi.ComputeLedgerHash(battleLedger)
                + ";resultId=" + result.ResultId.Value
                + ";beforeCampaignHash=" + before
                + ";settledCampaignHash=" + settledHash
                + ";receiptHash=" + first.Receipt.ReceiptHash
                + ";duplicateReceiptHash=" + ((SettlementReceipt)duplicate).ReceiptHash
                + ";returnTick=" + returned.Tick.Value
                + ";returnStage=" + returned.Stage
                + ";returnHash=" + returnHash
                + ";checks=battle-id,selected-card,card-effect,recharge-tick,terminal,settlement,duplicate-zero-mutation,return");
        }

        [Test]
        public void CampaignRoundTrip_UsesNewBattleResult()
        {
            var campaign = CampaignWithPendingBattle();
            var battle = BattleSim.Open(BattleSetup.FromContext(campaign.PendingBattle));
            battle.Tick = BattleRules.MaxTicks - 1;
            BattleSim.Step(battle, new Ledger());
            Assert.AreEqual(BattleOutcomeKind.Draw, battle.Outcome, "fixture must reach a real terminal outcome");
            var result = BattleSim.Result(battle).ToEncounterResult();
            var settled = (SettlementSuccess)SettlementApi.Apply(campaign, new Ledger(), new SettlementBook(), result);
            Assert.IsTrue(settled.State.SettlementApplied);
            Assert.AreNotEqual(CampaignStage.Resolution, settled.State.Stage);
        }
    }
}
