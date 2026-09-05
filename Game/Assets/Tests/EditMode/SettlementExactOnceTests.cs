using System;
using System.Globalization;
using System.IO;
using System.Text;
using Janseon.Core;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public class SettlementExactOnceTests
    {
        const int Seed = 42;
        const string CampaignId = "poc-campaign-1";

        static RouteGraph Graph() => RouteGraph.CreateYeongdeungpoSindorimGuro();

        static CampaignState Fresh()
        {
            return CampaignApi.Start(Seed, StationId.Yeongdeungpo, CampaignId);
        }

        static CampaignCommand CampCmd(string id, CampaignCommandKind kind, StationId dest = default)
        {
            return new CampaignCommand
            {
                Id = new CommandId(id),
                Kind = kind,
                TravelDestination = dest
            };
        }

        static CampaignState MustCampaign(object result, string context)
        {
            Assert.IsInstanceOf<CampaignState>(result, context);
            return (CampaignState)result;
        }

        static SettlementSuccess MustSuccess(object result, string context)
        {
            Assert.IsInstanceOf<SettlementSuccess>(result, context + " => " + (result == null ? "null" : result.GetType().Name));
            return (SettlementSuccess)result;
        }

        static BattleCommand MoveCmd(string id, string actorId, int dx, int dy)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.Move,
                ActorId = actorId,
                Dx = dx,
                Dy = dy
            };
        }

        static BattleCommand MeleeCmd(string id, string actorId, string targetId)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.MeleeAttack,
                ActorId = actorId,
                TargetId = targetId
            };
        }

        static BattleCommand RangedCmd(string id, string actorId, string targetId)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.RangedAttack,
                ActorId = actorId,
                TargetId = targetId
            };
        }

        static BattleCommand EndCmd(string id, string actorId)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.EndTurn,
                ActorId = actorId
            };
        }

        static BattleState MustBattle(object result, string context)
        {
            Assert.IsInstanceOf<BattleState>(result, context);
            return (BattleState)result;
        }

        static BattleUnit OtherUnit(BattleState state, string actorId)
        {
            for (var i = 0; i < state.Units.Count; i++)
            {
                if (!string.Equals(state.Units[i].UnitId, actorId, StringComparison.Ordinal))
                {
                    return state.Units[i];
                }
            }

            return null;
        }

        static BattleState PlayToOutcome(BattleState state, Ledger ledger, int budget)
        {
            for (var i = 0; i < budget; i++)
            {
                if (state.Outcome != BattleOutcomeKind.Ongoing)
                {
                    return state;
                }

                var actor = state.ActiveUnit;
                Assert.IsNotNull(actor);
                var foe = OtherUnit(state, actor.UnitId);
                Assert.IsNotNull(foe);

                object result = null;
                if (!foe.IsDowned)
                {
                    var dist = actor.Position.ManhattanTo(foe.Position);
                    if (dist <= BattleApi.MeleeRange && actor.Ap >= BattleApi.MeleeApCost)
                    {
                        result = BattleApi.Apply(state, ledger, MeleeCmd("s-melee-" + i, actor.UnitId, foe.UnitId));
                    }
                    else if (dist <= BattleApi.RangedRange && actor.Ap >= BattleApi.RangedApCost)
                    {
                        result = BattleApi.Apply(state, ledger, RangedCmd("s-ranged-" + i, actor.UnitId, foe.UnitId));
                    }
                    else if (actor.Ap >= BattleApi.MoveApCost)
                    {
                        var dx = Math.Sign(foe.Position.X - actor.Position.X);
                        var dy = Math.Sign(foe.Position.Y - actor.Position.Y);
                        if (dx != 0)
                        {
                            result = BattleApi.Apply(state, ledger, MoveCmd("s-mx-" + i, actor.UnitId, dx, 0));
                        }
                        else if (dy != 0)
                        {
                            result = BattleApi.Apply(state, ledger, MoveCmd("s-my-" + i, actor.UnitId, 0, dy));
                        }
                    }
                }

                if (result is BattleState next)
                {
                    state = next;
                    continue;
                }

                result = BattleApi.Apply(state, ledger, EndCmd("s-end-" + i, actor.UnitId));
                state = MustBattle(result, "end-turn fallback");
            }

            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome, "budget exhausted without terminal outcome");
            return state;
        }

        /// <summary>
        /// Campaign at Resolution with PendingBattle attached after Todo 7 combat choice + Todo 8 handoff.
        /// </summary>
        static void ReachPendingCombat(
            out CampaignState campaign,
            out Ledger campaignLedger,
            out BattleContext context)
        {
            var graph = Graph();
            var state = Fresh();
            campaignLedger = new Ledger();

            state = MustCampaign(
                CampaignApi.Apply(graph, state, campaignLedger, CampCmd("s-depart", CampaignCommandKind.Depart)),
                "Depart");
            state = MustCampaign(
                CampaignApi.Apply(
                    graph,
                    state,
                    campaignLedger,
                    CampCmd("s-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel");
            state = MustCampaign(
                CampaignApi.Apply(graph, state, campaignLedger, CampCmd("s-face", CampaignCommandKind.FaceEncounter)),
                "Face");
            state = MustCampaign(
                CampaignApi.Apply(graph, state, campaignLedger, CampCmd("s-enter", CampaignCommandKind.EnterResolution)),
                "Enter");

            var handoff = CampaignApi.Apply(
                graph,
                state,
                campaignLedger,
                CampCmd("s-combat", CampaignCommandKind.ChooseCombat));
            Assert.IsInstanceOf<BattleRequired>(handoff);
            context = ((BattleRequired)handoff).Context;

            state = MustCampaign(
                CampaignApi.AttachPendingBattle(
                    state,
                    campaignLedger,
                    context,
                    new CommandId("s-attach")),
                "AttachPendingBattle");

            Assert.AreEqual(CampaignStage.Resolution, state.Stage);
            Assert.IsNotNull(state.PendingBattle);
            Assert.AreEqual(context.BattleId, state.PendingBattle.BattleId);
            Assert.AreEqual(EncounterChoice.Combat, state.Choice);
            Assert.IsTrue(state.ChoiceLocked);

            campaign = state;
        }

        static void ReachPlayerVictoryResult(
            out CampaignState campaign,
            out Ledger campaignLedger,
            out SettlementBook book,
            out EncounterResult result,
            out BattleState battle)
        {
            ReachPendingCombat(out campaign, out campaignLedger, out var context);
            book = new SettlementBook();
            battle = BattleApi.Open(context);
            var battleLedger = new Ledger();
            battle = PlayToOutcome(battle, battleLedger, 64);
            Assert.AreEqual(BattleOutcomeKind.PlayerVictory, battle.Outcome);
            result = SettlementApi.FromBattle(battle);
            Assert.AreEqual(SettlementOutcomeKind.PlayerVictory, result.Outcome);
            Assert.AreEqual(context.BattleId, result.BattleId.Value);
            Assert.IsFalse(string.IsNullOrEmpty(result.ResultId.Value));
            Assert.IsFalse(string.IsNullOrEmpty(result.ResultHash));
        }

        static void ReachNegotiationSettlementStage(out CampaignState campaign, out Ledger ledger)
        {
            var graph = Graph();
            var state = Fresh();
            ledger = new Ledger();
            state = MustCampaign(CampaignApi.Apply(graph, state, ledger, CampCmd("n-depart", CampaignCommandKind.Depart)), "Depart");
            state = MustCampaign(
                CampaignApi.Apply(graph, state, ledger, CampCmd("n-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel");
            state = MustCampaign(CampaignApi.Apply(graph, state, ledger, CampCmd("n-face", CampaignCommandKind.FaceEncounter)), "Face");
            state = MustCampaign(CampaignApi.Apply(graph, state, ledger, CampCmd("n-enter", CampaignCommandKind.EnterResolution)), "Enter");
            state = MustCampaign(CampaignApi.Apply(graph, state, ledger, CampCmd("n-nego", CampaignCommandKind.ChooseNegotiate)), "Nego");
            Assert.AreEqual(CampaignStage.Settlement, state.Stage);
            Assert.IsFalse(state.SettlementApplied);
            campaign = state;
        }

        [Test]
        public void ResultIdAndBattleId_MatchPendingBattleContext_OnFirstPlayerVictory()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);

            Assert.AreEqual(campaign.PendingBattle.BattleId, result.BattleId.Value);
            Assert.IsTrue(result.ResultId.Value.StartsWith("result-", StringComparison.Ordinal));
            Assert.IsFalse(string.IsNullOrEmpty(result.ResultHash));

            var beforeHash = CampaignApi.ComputeCampaignHash(campaign, ledger);
            var applied = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "first apply");
            Assert.AreEqual(result.ResultId, applied.Receipt.ResultId);
            Assert.AreEqual(result.BattleId, applied.Receipt.BattleId);
            Assert.AreEqual(beforeHash, applied.Receipt.BeforeCampaignHash);
            Assert.IsFalse(string.IsNullOrEmpty(applied.Receipt.AfterCampaignHash));
            Assert.IsFalse(string.IsNullOrEmpty(applied.Receipt.ReceiptHash));
            Assert.AreNotEqual(applied.Receipt.BeforeCampaignHash, applied.Receipt.AfterCampaignHash);
        }

        [Test]
        public void FirstPlayerVictory_AppliesConsequencesExactlyOnce_InDocumentedOrder()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);

            var beforeRes = campaign.Resources;
            var beforeRep = campaign.Reputation;
            var beforeTick = campaign.Tick.Value;
            var beforeEvents = ledger.Events.Count;
            var beforeHash = CampaignApi.ComputeCampaignHash(campaign, ledger);

            var applied = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "apply");
            var next = applied.State;

            // Documented order ends with resources+reputation applied, stage advanced, tick moved, battle cleared.
            Assert.AreEqual(CampaignStage.Settlement, next.Stage);
            Assert.IsTrue(next.SettlementApplied);
            Assert.IsNull(next.PendingBattle);
            Assert.AreEqual(SettlementApi.ConsequencePlayerVictory, next.ConsequenceId);
            Assert.AreEqual(beforeRes + SettlementApi.PlayerVictoryResourceDelta, next.Resources);
            Assert.AreEqual(beforeRep + SettlementApi.PlayerVictoryReputationDelta, next.Reputation);
            Assert.Greater(next.Tick.Value, beforeTick);
            Assert.Greater(ledger.Events.Count, beforeEvents);
            Assert.AreEqual(result.ResultId.Value, next.SettledResultId);
            Assert.AreEqual(applied.Receipt.ReceiptHash, next.LastReceiptHash);
            Assert.AreEqual(beforeHash, applied.Receipt.BeforeCampaignHash);
            var recomputedAfter = CampaignApi.ComputeCampaignHash(next, ledger);
            Assert.AreEqual(
                applied.Receipt.AfterCampaignHash,
                recomputedAfter,
                "afterHash mismatch receipt=" + applied.Receipt.AfterCampaignHash
                + " recomputed=" + recomputedAfter
                + " receiptHash=" + applied.Receipt.ReceiptHash
                + " lastReceipt=" + next.LastReceiptHash
                + " before=" + applied.Receipt.BeforeCampaignHash);

            // Caller campaign fields untouched (apply returns new state). Ledger is append-only on success.
            Assert.AreEqual(CampaignStage.Resolution, campaign.Stage);
            Assert.IsNotNull(campaign.PendingBattle);
            Assert.AreEqual(beforeRes, campaign.Resources);
            Assert.AreEqual(beforeRep, campaign.Reputation);
            Assert.AreEqual(beforeTick, campaign.Tick.Value);
            Assert.AreNotEqual(beforeHash, recomputedAfter);
        }

        [Test]
        public void ExactDuplicateResult_ReturnsIdenticalReceipt_ZeroMutation()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);

            var first = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "first");
            var settled = first.State;
            var afterHash = CampaignApi.ComputeCampaignHash(settled, ledger);
            var tick = settled.Tick.Value;
            var res = settled.Resources;
            var rep = settled.Reputation;
            var node = settled.Node;
            var events = ledger.Events.Count;
            var settledRid = settled.SettledResultId;

            var second = SettlementApi.Apply(settled, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(second, "duplicate must return the stored receipt directly");
            var receipt = (SettlementReceipt)second;
            Assert.IsTrue(first.Receipt.Equals(receipt));
            Assert.AreEqual(first.Receipt.ReceiptHash, receipt.ReceiptHash);
            Assert.AreEqual(first.Receipt.BeforeCampaignHash, receipt.BeforeCampaignHash);
            Assert.AreEqual(first.Receipt.AfterCampaignHash, receipt.AfterCampaignHash);

            Assert.AreEqual(afterHash, CampaignApi.ComputeCampaignHash(settled, ledger));
            Assert.AreEqual(tick, settled.Tick.Value);
            Assert.AreEqual(res, settled.Resources);
            Assert.AreEqual(rep, settled.Reputation);
            Assert.AreEqual(node, settled.Node);
            Assert.AreEqual(events, ledger.Events.Count);
            Assert.AreEqual(settledRid, settled.SettledResultId);
        }

        [Test]
        public void SameBattleDifferentPayload_ReturnsConflict_ZeroMutation()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);

            var first = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "first");
            var settled = first.State;
            var afterHash = CampaignApi.ComputeCampaignHash(settled, ledger);
            var events = ledger.Events.Count;
            var tick = settled.Tick.Value;
            var res = settled.Resources;

            var conflicting = new EncounterResult
            {
                ResultId = new ResultId("result-conflict-alt"),
                BattleId = result.BattleId,
                Outcome = SettlementOutcomeKind.EnemyVictory,
                ResultHash = CoreApi.StableHashHex("different-payload")
            };

            var second = SettlementApi.Apply(settled, ledger, book, conflicting);
            Assert.IsInstanceOf<SettlementConflict>(second);
            var conflict = (SettlementConflict)second;
            Assert.AreEqual(result.BattleId, conflict.BattleId);
            Assert.IsFalse(string.Equals(conflict.StoredPayloadHash, conflict.IncomingPayloadHash, StringComparison.Ordinal));

            Assert.AreEqual(afterHash, CampaignApi.ComputeCampaignHash(settled, ledger));
            Assert.AreEqual(events, ledger.Events.Count);
            Assert.AreEqual(tick, settled.Tick.Value);
            Assert.AreEqual(res, settled.Resources);
            Assert.AreEqual(first.Receipt.ReceiptHash, settled.LastReceiptHash);
        }

        [Test]
        public void WrongBattleId_NoPendingBattle_WrongStage_RejectWithZeroMutation()
        {
            ReachPendingCombat(out var campaign, out var ledger, out var context);
            var book = new SettlementBook();
            var beforeHash = CampaignApi.ComputeCampaignHash(campaign, ledger);
            var beforeEvents = ledger.Events.Count;
            var beforeTick = campaign.Tick.Value;

            // Wrong battle id
            var wrongBattle = new EncounterResult
            {
                ResultId = new ResultId("result-wrong-battle"),
                BattleId = new BattleId("battle-not-pending"),
                Outcome = SettlementOutcomeKind.PlayerVictory,
                ResultHash = CoreApi.StableHashHex("wrong-battle")
            };
            var r1 = SettlementApi.Apply(campaign, ledger, book, wrongBattle);
            Assert.IsInstanceOf<SettlementRejection>(r1);
            Assert.AreEqual(SettlementRejectReason.BattleIdMismatch, ((SettlementRejection)r1).Reason);

            // No pending battle
            var noPending = campaign.Clone();
            noPending.PendingBattle = null;
            var okShape = new EncounterResult
            {
                ResultId = new ResultId("result-no-pending"),
                BattleId = new BattleId(context.BattleId),
                Outcome = SettlementOutcomeKind.PlayerVictory,
                ResultHash = CoreApi.StableHashHex("no-pending")
            };
            var r2 = SettlementApi.Apply(noPending, ledger, book, okShape);
            Assert.IsInstanceOf<SettlementRejection>(r2);
            Assert.AreEqual(SettlementRejectReason.NoPendingBattle, ((SettlementRejection)r2).Reason);

            // Wrong stage (BasePreparation)
            var fresh = Fresh();
            var freshLedger = new Ledger();
            var r3 = SettlementApi.Apply(fresh, freshLedger, book, okShape);
            Assert.IsInstanceOf<SettlementRejection>(r3);
            Assert.AreEqual(SettlementRejectReason.WrongStage, ((SettlementRejection)r3).Reason);

            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(campaign, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeTick, campaign.Tick.Value);
            Assert.AreEqual(CampaignStage.Resolution, campaign.Stage);
            Assert.IsNotNull(campaign.PendingBattle);
        }

        [Test]
        public void BattleSettlement_AdvancesToSettlement_AndAllowsReturnToBaseReady()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);
            var graph = Graph();

            var applied = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "settle");
            Assert.AreEqual(CampaignStage.Settlement, applied.State.Stage);
            Assert.IsTrue(applied.State.SettlementApplied);
            Assert.IsNull(applied.State.PendingBattle);

            var returned = MustCampaign(
                CampaignApi.Apply(
                    graph,
                    applied.State,
                    ledger,
                    CampCmd("s-return", CampaignCommandKind.CompleteReturn)),
                "CompleteReturn");
            Assert.AreEqual(CampaignStage.BaseReady, returned.Stage);
            Assert.AreEqual(StationId.Yeongdeungpo, returned.Node);
            Assert.AreEqual(SettlementApi.ConsequencePlayerVictory, returned.ConsequenceId);
            Assert.AreEqual(100 + SettlementApi.PlayerVictoryResourceDelta, returned.Resources);
            Assert.AreEqual(0 + SettlementApi.PlayerVictoryReputationDelta, returned.Reputation);
        }

        [Test]
        public void SamePreStateAndResult_ProduceIdenticalReceiptAndFinalHashes()
        {
            string Run(out string receiptHash, out string afterHash, out string resultId)
            {
                ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);
                resultId = result.ResultId.Value;
                var applied = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "apply");
                receiptHash = applied.Receipt.ReceiptHash;
                afterHash = applied.Receipt.AfterCampaignHash;
                return CampaignApi.ComputeCampaignHash(applied.State, ledger) + ":" + receiptHash;
            }

            var a = Run(out var rh1, out var ah1, out var rid1);
            var b = Run(out var rh2, out var ah2, out var rid2);
            Assert.AreEqual(a, b);
            Assert.AreEqual(rh1, rh2);
            Assert.AreEqual(ah1, ah2);
            Assert.AreEqual(rid1, rid2);
        }

        [Test]
        public void CrashRetryShaped_ReplaySameResultIdAgainstResultingState_ReturnsSameReceipt()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out _);

            var first = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "apply");
            // Crash boundary: retain receipt + book + post-state; drop pre-state.
            var retainedReceipt = first.Receipt;
            var postState = first.State;
            var postHash = CampaignApi.ComputeCampaignHash(postState, ledger);
            var postEvents = ledger.Events.Count;

            var replay = SettlementApi.Apply(postState, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(replay);
            var again = (SettlementReceipt)replay;
            Assert.IsTrue(retainedReceipt.Equals(again));
            Assert.AreEqual(retainedReceipt.ResultId, again.ResultId);
            Assert.AreEqual(retainedReceipt.ReceiptHash, again.ReceiptHash);
            Assert.AreEqual(postHash, CampaignApi.ComputeCampaignHash(postState, ledger));
            Assert.AreEqual(postEvents, ledger.Events.Count);
            Assert.AreEqual(retainedReceipt.ResultId.Value, postState.SettledResultId);
        }

        [Test]
        public void NonCombatNegotiation_ExactOnceThroughSameSettlementContract()
        {
            ReachNegotiationSettlementStage(out var campaign, out var ledger);
            var book = new SettlementBook();
            var result = SettlementApi.FromNonCombat(campaign);
            Assert.AreEqual(SettlementOutcomeKind.Negotiate, result.Outcome);
            Assert.IsTrue(string.IsNullOrEmpty(result.BattleId.Value));

            var beforeRes = campaign.Resources;
            var beforeRep = campaign.Reputation;
            var first = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "nego settle");
            Assert.AreEqual(CampaignStage.Settlement, first.State.Stage);
            Assert.IsTrue(first.State.SettlementApplied);
            Assert.AreEqual(beforeRes + CampaignApi.NegotiateResourceDelta, first.State.Resources);
            Assert.AreEqual(beforeRep + CampaignApi.NegotiateReputationDelta, first.State.Reputation);
            Assert.AreEqual(CampaignApi.ConsequenceNegotiate, first.State.ConsequenceId);

            var settled = first.State;
            var hash = CampaignApi.ComputeCampaignHash(settled, ledger);
            var events = ledger.Events.Count;
            var dup = SettlementApi.Apply(settled, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(dup);
            Assert.IsTrue(first.Receipt.Equals((SettlementReceipt)dup));
            Assert.AreEqual(hash, CampaignApi.ComputeCampaignHash(settled, ledger));
            Assert.AreEqual(events, ledger.Events.Count);

            var graph = Graph();
            var returned = MustCampaign(
                CampaignApi.Apply(graph, settled, ledger, CampCmd("n-return", CampaignCommandKind.CompleteReturn)),
                "return");
            Assert.AreEqual(CampaignStage.BaseReady, returned.Stage);
        }

        /// <summary>
        /// Manual QA consumer: Todo7 combat → Todo8 PlayerVictory → settle once → duplicate → conflict → return.
        /// </summary>
        [Test]
        public void ConsumerSurface_CombatSettleDuplicateConflictReturn_Observable()
        {
            ReachPlayerVictoryResult(out var campaign, out var ledger, out var book, out var result, out var battle);
            var graph = Graph();

            var beforeHash = CampaignApi.ComputeCampaignHash(campaign, ledger);
            var first = MustSuccess(SettlementApi.Apply(campaign, ledger, book, result), "first settle");
            var afterHash = first.Receipt.AfterCampaignHash;
            var receiptHash = first.Receipt.ReceiptHash;
            var settled = first.State;

            Assert.AreNotEqual(beforeHash, afterHash);
            Assert.AreEqual(CampaignStage.Settlement, settled.Stage);
            Assert.AreEqual(100 + SettlementApi.PlayerVictoryResourceDelta, settled.Resources);
            Assert.AreEqual(0 + SettlementApi.PlayerVictoryReputationDelta, settled.Reputation);

            var dup = SettlementApi.Apply(settled, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(dup);
            var dupReceipt = (SettlementReceipt)dup;
            Assert.IsTrue(first.Receipt.Equals(dupReceipt));
            var dupHash = CampaignApi.ComputeCampaignHash(settled, ledger);
            Assert.AreEqual(afterHash, dupHash);

            var conflicting = new EncounterResult
            {
                ResultId = new ResultId("result-qa-conflict"),
                BattleId = result.BattleId,
                Outcome = SettlementOutcomeKind.EnemyVictory,
                ResultHash = CoreApi.StableHashHex("qa-conflict-payload")
            };
            var conflictObj = SettlementApi.Apply(settled, ledger, book, conflicting);
            Assert.IsInstanceOf<SettlementConflict>(conflictObj);
            var conflictHash = CampaignApi.ComputeCampaignHash(settled, ledger);
            Assert.AreEqual(afterHash, conflictHash);

            var returned = MustCampaign(
                CampaignApi.Apply(graph, settled, ledger, CampCmd("qa-return", CampaignCommandKind.CompleteReturn)),
                "return");
            Assert.AreEqual(CampaignStage.BaseReady, returned.Stage);
            var finalHash = CampaignApi.ComputeCampaignHash(returned, ledger);

            // Non-combat path through same contract.
            ReachNegotiationSettlementStage(out var negoState, out var negoLedger);
            var negoBook = new SettlementBook();
            var negoResult = SettlementApi.FromNonCombat(negoState);
            var negoFirst = MustSuccess(SettlementApi.Apply(negoState, negoLedger, negoBook, negoResult), "nego");
            var negoDup = SettlementApi.Apply(negoFirst.State, negoLedger, negoBook, negoResult);
            Assert.IsInstanceOf<SettlementReceipt>(negoDup);
            Assert.IsTrue(negoFirst.Receipt.Equals((SettlementReceipt)negoDup));

            TestContext.WriteLine("SETTLE_QA_RESULT_ID=" + result.ResultId.Value);
            TestContext.WriteLine("SETTLE_QA_BATTLE_ID=" + result.BattleId.Value);
            TestContext.WriteLine("SETTLE_QA_BEFORE_HASH=" + beforeHash);
            TestContext.WriteLine("SETTLE_QA_AFTER_HASH=" + afterHash);
            TestContext.WriteLine("SETTLE_QA_RECEIPT_HASH=" + receiptHash);
            TestContext.WriteLine("SETTLE_QA_STAGE=" + settled.Stage);
            TestContext.WriteLine("SETTLE_QA_RES=" + settled.Resources);
            TestContext.WriteLine("SETTLE_QA_REP=" + settled.Reputation);
            TestContext.WriteLine("SETTLE_QA_TICK=" + settled.Tick.Value);
            TestContext.WriteLine("SETTLE_QA_LEDGER_COUNT=" + ledger.Events.Count);
            TestContext.WriteLine("SETTLE_QA_DUP_MATCH=" + first.Receipt.Equals(dupReceipt));
            TestContext.WriteLine("SETTLE_QA_DUP_HASH_UNCHANGED=" + string.Equals(afterHash, dupHash, StringComparison.Ordinal));
            TestContext.WriteLine("SETTLE_QA_CONFLICT_TYPE=" + conflictObj.GetType().Name);
            TestContext.WriteLine("SETTLE_QA_CONFLICT_HASH_UNCHANGED=" + string.Equals(afterHash, conflictHash, StringComparison.Ordinal));
            TestContext.WriteLine("SETTLE_QA_RETURN_STAGE=" + returned.Stage);
            TestContext.WriteLine("SETTLE_QA_FINAL_HASH=" + finalHash);
            TestContext.WriteLine("SETTLE_QA_BATTLE_OUTCOME=" + battle.Outcome);
            TestContext.WriteLine("SETTLE_QA_NEGO_RESULT_ID=" + negoResult.ResultId.Value);
            TestContext.WriteLine("SETTLE_QA_NEGO_RECEIPT=" + negoFirst.Receipt.ReceiptHash);
            TestContext.WriteLine("SETTLE_QA_NEGO_DUP=" + negoFirst.Receipt.Equals((SettlementReceipt)negoDup));

            var repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            var outDir = Path.Combine(repoRoot, ".omo", "evidence", "unity-poc-core-loop", "task-9-settlement", "manual-qa");
            Directory.CreateDirectory(outDir);
            var outPath = Path.Combine(outDir, "manual-qa-result.txt");
            var sb = new StringBuilder();
            sb.AppendLine("task-9-settlement manual QA consumer");
            sb.AppendLine("surface=EditMode SettlementExactOnceTests.ConsumerSurface_CombatSettleDuplicateConflictReturn_Observable");
            sb.AppendLine("seed=" + Seed.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("combat.resultId=" + result.ResultId.Value);
            sb.AppendLine("combat.battleId=" + result.BattleId.Value);
            sb.AppendLine("combat.outcome=" + result.Outcome);
            sb.AppendLine("combat.resultHash=" + result.ResultHash);
            sb.AppendLine("beforeHash=" + beforeHash);
            sb.AppendLine("afterHash=" + afterHash);
            sb.AppendLine("receiptHash=" + receiptHash);
            sb.AppendLine("settled.stage=" + settled.Stage);
            sb.AppendLine("settled.resources=" + settled.Resources.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("settled.reputation=" + settled.Reputation.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("settled.tick=" + settled.Tick.Value.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("settled.ledgerCount=" + ledger.Events.Count.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("settled.consequence=" + settled.ConsequenceId);
            sb.AppendLine("settled.node=" + settled.Node.Value);
            sb.AppendLine("duplicate.identicalReceipt=" + first.Receipt.Equals(dupReceipt));
            sb.AppendLine("duplicate.hashUnchanged=" + string.Equals(afterHash, dupHash, StringComparison.Ordinal));
            sb.AppendLine("conflict.type=" + conflictObj.GetType().Name);
            sb.AppendLine("conflict.hashUnchanged=" + string.Equals(afterHash, conflictHash, StringComparison.Ordinal));
            sb.AppendLine("return.stage=" + returned.Stage);
            sb.AppendLine("return.node=" + returned.Node.Value);
            sb.AppendLine("finalHash=" + finalHash);
            sb.AppendLine("nego.resultId=" + negoResult.ResultId.Value);
            sb.AppendLine("nego.receiptHash=" + negoFirst.Receipt.ReceiptHash);
            sb.AppendLine("nego.resources=" + negoFirst.State.Resources.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("nego.reputation=" + negoFirst.State.Reputation.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("nego.duplicateExactOnce=" + negoFirst.Receipt.Equals((SettlementReceipt)negoDup));
            sb.AppendLine("unifiedContract=True");
            sb.AppendLine(
                "binaryPass=" + (
                    !string.Equals(beforeHash, afterHash, StringComparison.Ordinal)
                    && first.Receipt.Equals(dupReceipt)
                    && string.Equals(afterHash, dupHash, StringComparison.Ordinal)
                    && conflictObj is SettlementConflict
                    && string.Equals(afterHash, conflictHash, StringComparison.Ordinal)
                    && returned.Stage == CampaignStage.BaseReady
                    && negoFirst.Receipt.Equals((SettlementReceipt)negoDup)));
            sb.AppendLine("MANUAL_QA_PASS=True");
            File.WriteAllText(outPath, sb.ToString(), Encoding.UTF8);
            TestContext.WriteLine("SETTLE_QA_ARTIFACT=" + outPath);
        }
    }
}
