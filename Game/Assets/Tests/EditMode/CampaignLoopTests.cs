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
    public class CampaignLoopTests
    {
        const int Seed = 42;
        const string CampaignId = "poc-campaign-1";

        static RouteGraph Graph() => RouteGraph.CreateYeongdeungpoSindorimGuro();

        static CampaignState Fresh()
        {
            return CampaignApi.Start(Seed, StationId.Yeongdeungpo, CampaignId);
        }

        static CampaignCommand Cmd(string id, CampaignCommandKind kind, StationId dest = default)
        {
            return new CampaignCommand
            {
                Id = new CommandId(id),
                Kind = kind,
                TravelDestination = dest
            };
        }

        static CampaignState MustState(object result, string context)
        {
            Assert.IsInstanceOf<CampaignState>(result, context);
            return (CampaignState)result;
        }

        /// <summary>
        /// BasePreparation → ExpeditionTravel → Encounter → Resolution → Settlement → BaseReady
        /// via negotiation (no battle).
        /// </summary>
        static CampaignState RunNegotiationLoop(out Ledger ledger)
        {
            var graph = Graph();
            var state = Fresh();
            ledger = new Ledger();

            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-depart", CampaignCommandKind.Depart)),
                "Depart");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel to Sindorim");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-face", CampaignCommandKind.FaceEncounter)),
                "FaceEncounter");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-enter", CampaignCommandKind.EnterResolution)),
                "EnterResolution");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-nego", CampaignCommandKind.ChooseNegotiate)),
                "ChooseNegotiate");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-settle", CampaignCommandKind.ApplySettlement)),
                "ApplySettlement");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("n-return", CampaignCommandKind.CompleteReturn)),
                "CompleteReturn");
            return state;
        }

        static CampaignState RunBypassLoop(out Ledger ledger)
        {
            var graph = Graph();
            var state = Fresh();
            ledger = new Ledger();

            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-depart", CampaignCommandKind.Depart)),
                "Depart");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-face", CampaignCommandKind.FaceEncounter)),
                "Face");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-enter", CampaignCommandKind.EnterResolution)),
                "Enter");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-bypass", CampaignCommandKind.ChooseBypass)),
                "Bypass");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-settle", CampaignCommandKind.ApplySettlement)),
                "Settle");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("b-return", CampaignCommandKind.CompleteReturn)),
                "Return");
            return state;
        }

        [Test]
        public void SixStages_NegotiationPath_ReachesBaseReadyWithoutBattle()
        {
            var state = RunNegotiationLoop(out var ledger);

            Assert.AreEqual(CampaignStage.BaseReady, state.Stage);
            Assert.AreEqual(StationId.Yeongdeungpo, state.Node);
            Assert.AreEqual(CampaignApi.ConsequenceNegotiate, state.ConsequenceId);
            Assert.AreEqual(100 + CampaignApi.NegotiateResourceDelta, state.Resources);
            Assert.AreEqual(0 + CampaignApi.NegotiateReputationDelta, state.Reputation);
            Assert.IsNull(state.PendingBattle);
            Assert.IsTrue(state.SettlementApplied);
            Assert.Greater(state.Tick.Value, 0);
            Assert.Greater(ledger.Events.Count, 0);
        }

        [Test]
        public void BypassPath_DistinctConsequence_NoBattleContext()
        {
            var nego = RunNegotiationLoop(out var negoLedger);
            var bypass = RunBypassLoop(out var bypassLedger);

            Assert.AreEqual(CampaignStage.BaseReady, bypass.Stage);
            Assert.AreEqual(CampaignApi.ConsequenceBypass, bypass.ConsequenceId);
            Assert.AreEqual(100 + CampaignApi.BypassResourceDelta, bypass.Resources);
            Assert.AreEqual(0 + CampaignApi.BypassReputationDelta, bypass.Reputation);
            Assert.IsNull(bypass.PendingBattle);

            Assert.AreNotEqual(nego.ConsequenceId, bypass.ConsequenceId);
            Assert.AreNotEqual(nego.Resources, bypass.Resources);
            Assert.AreNotEqual(nego.Reputation, bypass.Reputation);
            Assert.AreNotEqual(
                CampaignApi.ComputeCampaignHash(nego, negoLedger),
                CampaignApi.ComputeCampaignHash(bypass, bypassLedger),
                "Negotiation and bypass must produce distinct campaign hashes");
        }

        [Test]
        public void CombatChoice_EmitsImmutableBattleHandoff_WithoutSettlement()
        {
            var graph = Graph();
            var state = Fresh();
            var ledger = new Ledger();

            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("c-depart", CampaignCommandKind.Depart)), "Depart");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("c-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel");
            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("c-face", CampaignCommandKind.FaceEncounter)), "Face");
            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("c-enter", CampaignCommandKind.EnterResolution)), "Enter");

            var beforeHash = CampaignApi.ComputeCampaignHash(state, ledger);
            var result = CampaignApi.Apply(graph, state, ledger, Cmd("c-combat", CampaignCommandKind.ChooseCombat));
            Assert.IsInstanceOf<BattleRequired>(result, "Combat choice must yield BattleRequired handoff");
            var required = (BattleRequired)result;
            Assert.IsNotNull(required.Context);
            Assert.IsFalse(string.IsNullOrEmpty(required.Context.BattleId));
            Assert.AreEqual(CampaignId, required.Context.CampaignId);
            Assert.AreEqual(StationId.Sindorim, required.Context.Location);
            Assert.AreEqual(Seed, required.Context.WorldSeed);
            Assert.IsFalse(string.IsNullOrEmpty(required.Context.ContextHash));
            Assert.AreEqual(CampaignApi.RulesVersion, required.Context.RulesVersion);

            // Caller state unchanged until it adopts the returned handoff snapshot.
            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(state, ledger));
            Assert.AreEqual(CampaignStage.Resolution, state.Stage);
            Assert.IsNull(state.PendingBattle);
            Assert.IsFalse(state.SettlementApplied);

            // Immutability: ContextHash is content-derived and stable.
            var again = CampaignApi.Apply(graph, state, ledger, Cmd("c-combat", CampaignCommandKind.ChooseCombat));
            var required2 = (BattleRequired)again;
            Assert.AreEqual(required.Context.ContextHash, required2.Context.ContextHash);
            Assert.AreEqual(required.Context.BattleId, required2.Context.BattleId);
        }

        [Test]
        public void WrongStageCommand_IsTypedRejection_WithoutMutation()
        {
            var graph = Graph();
            var state = Fresh();
            var ledger = new Ledger();
            var beforeHash = CampaignApi.ComputeCampaignHash(state, ledger);
            var beforeTick = state.Tick.Value;
            var beforeEvents = ledger.Events.Count;
            var beforeStage = state.Stage;

            var result = CampaignApi.Apply(
                graph,
                state,
                ledger,
                Cmd("bad-travel", CampaignCommandKind.Travel, StationId.Sindorim));
            Assert.IsInstanceOf<CampaignRejection>(result);
            var rejection = (CampaignRejection)result;
            Assert.AreEqual(CampaignRejectReason.WrongStage, rejection.Reason);
            Assert.AreEqual(CampaignStage.BasePreparation, rejection.Stage);
            Assert.AreEqual(CampaignCommandKind.Travel, rejection.Attempted);

            Assert.AreEqual(beforeTick, state.Tick.Value);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeStage, state.Stage);
            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(state, ledger));
        }

        [Test]
        public void ReapplyResolvedChoice_IsRejectedWithoutMutation()
        {
            var graph = Graph();
            var state = Fresh();
            var ledger = new Ledger();

            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("r-depart", CampaignCommandKind.Depart)), "Depart");
            state = MustState(
                CampaignApi.Apply(graph, state, ledger, Cmd("r-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel");
            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("r-face", CampaignCommandKind.FaceEncounter)), "Face");
            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("r-enter", CampaignCommandKind.EnterResolution)), "Enter");
            state = MustState(CampaignApi.Apply(graph, state, ledger, Cmd("r-nego", CampaignCommandKind.ChooseNegotiate)), "Nego");

            Assert.AreEqual(CampaignStage.Settlement, state.Stage);
            Assert.IsTrue(state.ChoiceLocked);

            var beforeHash = CampaignApi.ComputeCampaignHash(state, ledger);
            var beforeTick = state.Tick.Value;
            var beforeEvents = ledger.Events.Count;
            var beforeRes = state.Resources;
            var beforeRep = state.Reputation;
            var beforeCons = state.ConsequenceId;

            var again = CampaignApi.Apply(graph, state, ledger, Cmd("r-nego-2", CampaignCommandKind.ChooseNegotiate));
            Assert.IsInstanceOf<CampaignRejection>(again);
            var rejection = (CampaignRejection)again;
            Assert.AreEqual(CampaignRejectReason.AlreadyResolved, rejection.Reason);

            var bypassAttempt = CampaignApi.Apply(graph, state, ledger, Cmd("r-bypass", CampaignCommandKind.ChooseBypass));
            Assert.IsInstanceOf<CampaignRejection>(bypassAttempt);
            Assert.AreEqual(CampaignRejectReason.AlreadyResolved, ((CampaignRejection)bypassAttempt).Reason);

            Assert.AreEqual(beforeTick, state.Tick.Value);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeRes, state.Resources);
            Assert.AreEqual(beforeRep, state.Reputation);
            Assert.AreEqual(beforeCons, state.ConsequenceId);
            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(state, ledger));
        }

        [Test]
        public void SameSeedAndCommands_ProduceIdenticalCampaignStateAndLedgerHash()
        {
            string Run()
            {
                var state = RunNegotiationLoop(out var ledger);
                return CampaignApi.ComputeCampaignHash(state, ledger);
            }

            var h1 = Run();
            var h2 = Run();
            Assert.AreEqual(h1, h2);
            Assert.IsFalse(string.IsNullOrEmpty(h1));
        }

        /// <summary>
        /// Manual QA consumer: negotiation full loop, bypass distinct path, combat handoff.
        /// </summary>
        [Test]
        public void ConsumerSurface_NegotiationBypassCombat_Observable()
        {
            var nego = RunNegotiationLoop(out var negoLedger);
            var negoHash = CampaignApi.ComputeCampaignHash(nego, negoLedger);
            var negoStateHash = CampaignApi.ComputeStateHash(nego);
            var negoLedgerHash = CoreApi.ComputeLedgerHash(negoLedger);

            Assert.AreEqual(CampaignStage.BaseReady, nego.Stage);
            Assert.AreEqual("Yeongdeungpo", nego.Node.Value);
            Assert.AreEqual(CampaignApi.ConsequenceNegotiate, nego.ConsequenceId);
            Assert.IsNull(nego.PendingBattle);

            var bypass = RunBypassLoop(out var bypassLedger);
            var bypassHash = CampaignApi.ComputeCampaignHash(bypass, bypassLedger);
            Assert.AreEqual(CampaignStage.BaseReady, bypass.Stage);
            Assert.AreEqual(CampaignApi.ConsequenceBypass, bypass.ConsequenceId);
            Assert.IsNull(bypass.PendingBattle);
            Assert.AreNotEqual(negoHash, bypassHash);

            var graph = Graph();
            var combatState = Fresh();
            var combatLedger = new Ledger();
            combatState = MustState(
                CampaignApi.Apply(graph, combatState, combatLedger, Cmd("qa-depart", CampaignCommandKind.Depart)),
                "Depart");
            combatState = MustState(
                CampaignApi.Apply(
                    graph,
                    combatState,
                    combatLedger,
                    Cmd("qa-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel");
            combatState = MustState(
                CampaignApi.Apply(graph, combatState, combatLedger, Cmd("qa-face", CampaignCommandKind.FaceEncounter)),
                "Face");
            combatState = MustState(
                CampaignApi.Apply(graph, combatState, combatLedger, Cmd("qa-enter", CampaignCommandKind.EnterResolution)),
                "Enter");
            var combatResult = CampaignApi.Apply(
                graph,
                combatState,
                combatLedger,
                Cmd("qa-combat", CampaignCommandKind.ChooseCombat));
            Assert.IsInstanceOf<BattleRequired>(combatResult);
            var battle = ((BattleRequired)combatResult).Context;
            Assert.IsNotNull(battle);
            Assert.AreEqual(CampaignStage.Resolution, combatState.Stage);
            Assert.IsFalse(combatState.SettlementApplied);

            TestContext.WriteLine("CAMPAIGN_QA_NEGO_STAGE=" + nego.Stage);
            TestContext.WriteLine("CAMPAIGN_QA_NEGO_NODE=" + nego.Node.Value);
            TestContext.WriteLine("CAMPAIGN_QA_NEGO_TICK=" + nego.Tick.Value);
            TestContext.WriteLine("CAMPAIGN_QA_NEGO_RES=" + nego.Resources);
            TestContext.WriteLine("CAMPAIGN_QA_NEGO_REP=" + nego.Reputation);
            TestContext.WriteLine("CAMPAIGN_QA_NEGO_CONS=" + nego.ConsequenceId);
            TestContext.WriteLine("CAMPAIGN_QA_NEGO_HASH=" + negoHash);
            TestContext.WriteLine("CAMPAIGN_QA_BYPASS_CONS=" + bypass.ConsequenceId);
            TestContext.WriteLine("CAMPAIGN_QA_BYPASS_RES=" + bypass.Resources);
            TestContext.WriteLine("CAMPAIGN_QA_BYPASS_REP=" + bypass.Reputation);
            TestContext.WriteLine("CAMPAIGN_QA_BYPASS_HASH=" + bypassHash);
            TestContext.WriteLine("CAMPAIGN_QA_BATTLE_ID=" + battle.BattleId);
            TestContext.WriteLine("CAMPAIGN_QA_BATTLE_HASH=" + battle.ContextHash);
            TestContext.WriteLine("CAMPAIGN_QA_BATTLE_STAGE=" + combatState.Stage);

            var repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            var outDir = Path.Combine(repoRoot, ".omo", "evidence", "unity-poc-core-loop", "task-7-campaign-loop", "manual-qa");
            Directory.CreateDirectory(outDir);
            var outPath = Path.Combine(outDir, "manual-qa-result.txt");
            var sb = new StringBuilder();
            sb.AppendLine("task-7-campaign-loop manual QA consumer");
            sb.AppendLine("surface=EditMode CampaignLoopTests.ConsumerSurface_NegotiationBypassCombat_Observable");
            sb.AppendLine("seed=" + Seed.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("nego.stage=" + nego.Stage);
            sb.AppendLine("nego.node=" + nego.Node.Value);
            sb.AppendLine("nego.tick=" + nego.Tick.Value.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("nego.resources=" + nego.Resources.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("nego.reputation=" + nego.Reputation.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("nego.consequence=" + nego.ConsequenceId);
            sb.AppendLine("nego.stateHash=" + negoStateHash);
            sb.AppendLine("nego.ledgerHash=" + negoLedgerHash);
            sb.AppendLine("nego.campaignHash=" + negoHash);
            sb.AppendLine("nego.pendingBattle=" + (nego.PendingBattle == null ? "none" : nego.PendingBattle.BattleId));
            sb.AppendLine("bypass.stage=" + bypass.Stage);
            sb.AppendLine("bypass.node=" + bypass.Node.Value);
            sb.AppendLine("bypass.tick=" + bypass.Tick.Value.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("bypass.resources=" + bypass.Resources.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("bypass.reputation=" + bypass.Reputation.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("bypass.consequence=" + bypass.ConsequenceId);
            sb.AppendLine("bypass.campaignHash=" + bypassHash);
            sb.AppendLine("bypass.pendingBattle=" + (bypass.PendingBattle == null ? "none" : bypass.PendingBattle.BattleId));
            sb.AppendLine("combat.result=BattleRequired");
            sb.AppendLine("combat.stage=" + combatState.Stage);
            sb.AppendLine("combat.battleId=" + battle.BattleId);
            sb.AppendLine("combat.location=" + battle.Location.Value);
            sb.AppendLine("combat.worldTick=" + battle.WorldTick.Value.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("combat.contextHash=" + battle.ContextHash);
            sb.AppendLine("combat.settlementApplied=" + combatState.SettlementApplied);
            sb.AppendLine(
                "pathsDistinct=" + (!string.Equals(negoHash, bypassHash, StringComparison.Ordinal)
                    && !string.Equals(nego.ConsequenceId, bypass.ConsequenceId, StringComparison.Ordinal)));
            sb.AppendLine("MANUAL_QA_PASS=True");
            File.WriteAllText(outPath, sb.ToString(), Encoding.UTF8);
            TestContext.WriteLine("CAMPAIGN_QA_ARTIFACT=" + outPath);
        }
    }
}
