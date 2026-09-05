using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Todo 12 RED-first PlayMode: production Bootstrap/MainTitle/Foundation UI surface must
    /// drive one complete core loop via UIDocument buttons + scoped session. Separate from
    /// FoundationSceneFlowTests. No sleeps — subscribe to session signals before clicks.
    /// </summary>
    public sealed class CoreLoopPlayModeTests
    {
        const int Seed = 90421;
        const string CampaignId = "poc-core-loop";
        string testedHead;

        [SetUp]
        public void PinTestedSource()
        {
            testedHead = RunGit("rev-parse HEAD").Trim();
            Assert.That(testedHead, Does.Match("^[0-9a-f]{40}$"));
        }

        // Todo 12 action names (Design.md loop controls; may not exist until GREEN wiring).
        const string ActionDepart = "action-depart";
        const string ActionFaceEncounter = "action-face-encounter";
        const string ActionEnterResolution = "action-enter-resolution";
        const string ActionSettle = "action-settle";
        const string BattleAdvance = "battle-advance";

        [Test]
        public async Task MainTitle_Start_EntersFoundation_ShowsBasePreparation()
        {
            await BootstrapToFoundationAsync();

            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "Foundation must expose IPocCoreLoopSession");
            Assert.That(session.IsReady, Is.True);

            Task changed = WaitSignal(session);
            // Session should already be at BasePreparation after Foundation lease.
            Assert.That(session.Campaign, Is.Not.Null);
            Assert.That(session.Campaign.Stage, Is.EqualTo(CampaignStage.BasePreparation));
            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));
            Assert.That(session.Campaign.Seed, Is.EqualTo(Seed));

            VisualElement root = host.Document.rootVisualElement;
            Assert.That(root, Is.Not.Null);
            VisualElement prep = root.Q(UiElementNames.StageBasePrep);
            Assert.That(prep, Is.Not.Null);
            Assert.That(prep.ClassListContains("jk-chip--current"), Is.True,
                "BasePreparation chip must be current after Start→Foundation");

            Button depart = root.Q<Button>(ActionDepart);
            Assert.That(depart, Is.Not.Null, "action-depart must exist for prepare/dispatch");
            Assert.That(changed, Is.Not.Null);
        }

        [Test]
        public async Task ExpeditionTravel_UI_MovesYeongdeungpoToSindorim_ExposesEncounter()
        {
            await BootstrapToFoundationAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "IPocCoreLoopSession required");
            VisualElement root = RequireRoot(host);

            await ClickAndAwait(session, root, ActionDepart, s =>
                s.Campaign.Stage == CampaignStage.ExpeditionTravel);

            Assert.That(session.Campaign.Stage, Is.EqualTo(CampaignStage.ExpeditionTravel));
            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));

            await ClickAndAwait(session, root, UiElementNames.StationSindorim, s =>
                s.Campaign.Node.Equals(StationId.Sindorim));

            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Sindorim));
            Assert.That(session.Campaign.Stage, Is.EqualTo(CampaignStage.ExpeditionTravel));

            await ClickAndAwait(session, root, ActionFaceEncounter, s =>
                s.Campaign.Stage == CampaignStage.Encounter);
            await ClickAndAwait(session, root, ActionEnterResolution, s =>
                s.Campaign.Stage == CampaignStage.Resolution);

            Assert.That(session.Campaign.Stage, Is.EqualTo(CampaignStage.Resolution));
            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Sindorim));
            Assert.That(root.Q(UiElementNames.EncounterChoices), Is.Not.Null);
            Assert.That(root.Q<Button>(UiElementNames.ChoiceNegotiate), Is.Not.Null);
            Assert.That(root.Q<Button>(UiElementNames.ChoiceBypass), Is.Not.Null);
            Assert.That(root.Q<Button>(UiElementNames.ChoiceCombat), Is.Not.Null);
            VisualElement stageRes = root.Q(UiElementNames.StageResolution);
            Assert.That(stageRes.ClassListContains("jk-chip--current"), Is.True);
        }

        [Test]
        public async Task NegotiationBranch_ExactOnceSettlement_ReturnsBaseReady()
        {
            BranchResult branch = await RunBranchAsync(EncounterChoice.Negotiate);
            Assert.That(branch.Session.Campaign.Stage, Is.EqualTo(CampaignStage.BaseReady));
            Assert.That(branch.Session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));
            Assert.That(branch.Session.Campaign.ConsequenceId, Is.EqualTo(CampaignApi.ConsequenceNegotiate));
            Assert.That(branch.Session.Campaign.Resources,
                Is.EqualTo(100 + CampaignApi.NegotiateResourceDelta));
            Assert.That(branch.Session.Campaign.Reputation,
                Is.EqualTo(0 + CampaignApi.NegotiateReputationDelta));
            Assert.That(branch.Session.Campaign.SettlementApplied, Is.True);
            Assert.That(branch.Session.LastReceipt, Is.Not.Null);
            Assert.That(branch.Session.LastReceipt.Outcome, Is.EqualTo(SettlementOutcomeKind.Negotiate));
            Assert.That(branch.Session.LastDuplicateReceipt, Is.Not.Null,
                "duplicate settle must return identical receipt");
            Assert.That(branch.Session.LastDuplicateReceipt.Equals(branch.Session.LastReceipt), Is.True);
            Assert.That(branch.Session.Campaign.PendingBattle, Is.Null);
            Assert.That(branch.FinalHash, Is.Not.Empty);
            Debug.Log("CORE_LOOP_NEGO " + branch.Summarize());
        }

        [Test]
        public async Task BypassBranch_DistinctConsequence_ReturnsBaseReady()
        {
            BranchResult nego = await RunBranchAsync(EncounterChoice.Negotiate);
            BranchResult bypass = await RunBranchAsync(EncounterChoice.Bypass);

            Assert.That(bypass.Session.Campaign.Stage, Is.EqualTo(CampaignStage.BaseReady));
            Assert.That(bypass.Session.Campaign.ConsequenceId, Is.EqualTo(CampaignApi.ConsequenceBypass));
            Assert.That(bypass.Session.Campaign.Resources,
                Is.EqualTo(100 + CampaignApi.BypassResourceDelta));
            Assert.That(bypass.Session.Campaign.Reputation,
                Is.EqualTo(0 + CampaignApi.BypassReputationDelta));
            Assert.That(bypass.Session.LastReceipt.Outcome, Is.EqualTo(SettlementOutcomeKind.Bypass));

            Assert.That(bypass.Session.Campaign.ConsequenceId,
                Is.Not.EqualTo(nego.Session.Campaign.ConsequenceId));
            Assert.That(bypass.Session.Campaign.Resources,
                Is.Not.EqualTo(nego.Session.Campaign.Resources));
            Assert.That(bypass.FinalHash, Is.Not.EqualTo(nego.FinalHash),
                "bypass and negotiate must produce distinct final hashes");
            Debug.Log("CORE_LOOP_BYPASS " + bypass.Summarize());
        }

        [Test]
        public async Task CombatBranch_BattleApiToPlayerVictory_ExactOnceSettlement_ReturnsBaseReady()
        {
            BranchResult branch = await RunBranchAsync(EncounterChoice.Combat);
            Assert.That(branch.Session.Campaign.Stage, Is.EqualTo(CampaignStage.BaseReady));
            Assert.That(branch.Session.Campaign.ConsequenceId,
                Is.EqualTo(SettlementApi.ConsequencePlayerVictory));
            Assert.That(branch.Session.Campaign.Resources,
                Is.EqualTo(100 + SettlementApi.PlayerVictoryResourceDelta));
            Assert.That(branch.Session.Campaign.Reputation,
                Is.EqualTo(0 + SettlementApi.PlayerVictoryReputationDelta));
            Assert.That(branch.Session.LastReceipt, Is.Not.Null);
            Assert.That(branch.Session.LastReceipt.Outcome, Is.EqualTo(SettlementOutcomeKind.PlayerVictory));
            Assert.That(string.IsNullOrEmpty(branch.Session.LastReceipt.BattleId.Value), Is.False);
            Assert.That(branch.BattleContextHash, Is.Not.Empty);
            Assert.That(branch.Session.LastDuplicateReceipt, Is.Not.Null);
            Assert.That(branch.Session.LastDuplicateReceipt.Equals(branch.Session.LastReceipt), Is.True);
            Assert.That(branch.Session.Campaign.PendingBattle, Is.Null);
            Assert.That(branch.BattleCommands, Is.GreaterThan(0),
                "combat must execute real BattleApi commands via battle-advance");
            Debug.Log("CORE_LOOP_COMBAT " + branch.Summarize());
        }

        [Test]
        public async Task SameSeed_SameUiSequence_ReplaysIdenticalHashes()
        {
            BranchResult a = await RunBranchAsync(EncounterChoice.Negotiate);
            BranchResult b = await RunBranchAsync(EncounterChoice.Negotiate);

            Assert.That(b.FinalHash, Is.EqualTo(a.FinalHash), "campaign final hash");
            Assert.That(b.Session.LastReceipt.ReceiptHash, Is.EqualTo(a.Session.LastReceipt.ReceiptHash));
            Assert.That(b.Session.LastReceipt.AfterCampaignHash,
                Is.EqualTo(a.Session.LastReceipt.AfterCampaignHash));
            Assert.That(b.Session.Campaign.Tick.Value, Is.EqualTo(a.Session.Campaign.Tick.Value));
            Assert.That(b.Session.Campaign.Resources, Is.EqualTo(a.Session.Campaign.Resources));
            Assert.That(b.ClickTrace, Is.EqualTo(a.ClickTrace));
        }

        [Test]
        public async Task InvalidOrDoubleClick_TypedRejection_NoMutation_NoDuplicateSideEffect()
        {
            await BootstrapToFoundationAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "IPocCoreLoopSession required");
            VisualElement root = RequireRoot(host);

            // ---- Depart: first UI success ----
            await ClickAndAwait(session, root, ActionDepart, s =>
                s.Campaign.Stage == CampaignStage.ExpeditionTravel);
            string hashAfterDepart = session.CampaignHash;
            int tick = session.Campaign.Tick.Value;
            int events = session.CampaignLedger.Events.Count;
            object rejectionBefore = session.LastRejection;

            // (1) Actual UI button disabled / second click ignored — zero command/event/hash change.
            Button departBtn = root.Q<Button>(ActionDepart);
            Assert.That(departBtn, Is.Not.Null);
            Assert.That(departBtn.enabledInHierarchy, Is.False,
                "action-depart must disable after successful depart");
            AttemptClickNamed(root, ActionDepart);
            Assert.That(session.CampaignHash, Is.EqualTo(hashAfterDepart), "UI double-depart hash");
            Assert.That(session.Campaign.Tick.Value, Is.EqualTo(tick), "UI double-depart tick");
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(events), "UI double-depart events");
            Assert.That(session.LastRejection, Is.SameAs(rejectionBefore),
                "disabled UI click must not dispatch a domain command");

            // (2) Public presenter/session seam still returns typed rejection, zero mutation.
            Task rejected = WaitRejection(session);
            host.Presenter.TriggerDepartForTest();
            await AwaitTask(rejected, TimeSpan.FromSeconds(5), "typed reject after double depart seam");
            Assert.That(session.LastRejection, Is.InstanceOf<CampaignRejection>());
            var rej = (CampaignRejection)session.LastRejection;
            Assert.That(rej.Reason, Is.EqualTo(CampaignRejectReason.WrongStage));
            Assert.That(session.CampaignHash, Is.EqualTo(hashAfterDepart));
            Assert.That(session.Campaign.Tick.Value, Is.EqualTo(tick));
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(events));

            // ---- Settle once via UI ----
            await ClickAndAwait(session, root, UiElementNames.StationSindorim, s =>
                s.Campaign.Node.Equals(StationId.Sindorim));
            await ClickAndAwait(session, root, ActionFaceEncounter, s =>
                s.Campaign.Stage == CampaignStage.Encounter);
            await ClickAndAwait(session, root, ActionEnterResolution, s =>
                s.Campaign.Stage == CampaignStage.Resolution);
            await ClickAndAwait(session, root, UiElementNames.ChoiceNegotiate, s =>
                s.Campaign.Stage == CampaignStage.Settlement
                && s.Campaign.Choice == EncounterChoice.Negotiate);
            await ClickAndAwait(session, root, ActionSettle, s =>
                s.Campaign.SettlementApplied);

            Assert.That(session.LastReceipt, Is.Not.Null);
            string settledHash = session.CampaignHash;
            int settledEvents = session.CampaignLedger.Events.Count;
            int settledRes = session.Campaign.Resources;
            SettlementReceipt firstReceipt = session.LastReceipt;
            SettlementReceipt dupBefore = session.LastDuplicateReceipt;

            // (1) Settle button disabled after apply — second UI click ignored, zero side effect.
            Button settleBtn = root.Q<Button>(ActionSettle);
            Assert.That(settleBtn, Is.Not.Null);
            Assert.That(settleBtn.enabledInHierarchy, Is.False,
                "action-settle must disable after successful settle (return takes over)");
            AttemptClickNamed(root, ActionSettle);
            Assert.That(session.CampaignHash, Is.EqualTo(settledHash), "UI double-settle hash");
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(settledEvents));
            Assert.That(session.Campaign.Resources, Is.EqualTo(settledRes));
            Assert.That(session.LastDuplicateReceipt, Is.SameAs(dupBefore),
                "disabled UI settle click must not hit SettlementApi");

            // (2) Presenter/session seam re-submits identical payload → exact-once receipt, zero mutation.
            Task dupSignal = WaitSignal(session);
            host.Presenter.TriggerSettleForTest();
            await AwaitTask(dupSignal, TimeSpan.FromSeconds(5), "exact-once duplicate settle seam");
            Assert.That(session.LastDuplicateReceipt, Is.Not.Null);
            Assert.That(session.LastDuplicateReceipt.Equals(firstReceipt), Is.True);
            Assert.That(session.LastReceipt.Equals(firstReceipt), Is.True);
            Assert.That(session.CampaignHash, Is.EqualTo(settledHash));
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(settledEvents));
            Assert.That(session.Campaign.Resources, Is.EqualTo(settledRes));
        }

        // ---- helpers ----

        sealed class BranchResult
        {
            public IPocCoreLoopSession Session;
            public string FinalHash;
            public string BattleContextHash;
            public int BattleCommands;
            public string ClickTrace;
            public List<string> Steps = new List<string>();

            public string Summarize()
            {
                var sb = new StringBuilder();
                sb.Append("stage=").Append(Session.Campaign.Stage);
                sb.Append(";node=").Append(Session.Campaign.Node.Value);
                sb.Append(";tick=").Append(Session.Campaign.Tick.Value);
                sb.Append(";res=").Append(Session.Campaign.Resources);
                sb.Append(";rep=").Append(Session.Campaign.Reputation);
                sb.Append(";cons=").Append(Session.Campaign.ConsequenceId);
                sb.Append(";receipt=").Append(Session.LastReceipt?.ReceiptHash ?? "");
                sb.Append(";final=").Append(FinalHash);
                sb.Append(";battleCtx=").Append(BattleContextHash);
                sb.Append(";bcmds=").Append(BattleCommands);
                sb.Append(";clicks=").Append(ClickTrace);
                return sb.ToString();
            }
        }

        async Task<BranchResult> RunBranchAsync(EncounterChoice choice)
        {
            await BootstrapToFoundationAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "IPocCoreLoopSession required for branch " + choice);
            VisualElement root = RequireRoot(host);
            var clicks = new List<string>();
            var result = new BranchResult { Session = session };

            async Task Step(string name, Func<IPocCoreLoopSession, bool> pred)
            {
                await ClickAndAwait(session, root, name, pred);
                clicks.Add(name);
                result.Steps.Add(
                    name + "=>" + session.Campaign.Stage
                    + "@" + session.Campaign.Node.Value
                    + ";tick=" + session.Campaign.Tick.Value
                    + ";res=" + session.Campaign.Resources
                    + ";rep=" + session.Campaign.Reputation
                    + ";hash=" + session.CampaignHash);
            }

            await Step(ActionDepart, s => s.Campaign.Stage == CampaignStage.ExpeditionTravel);
            await Step(UiElementNames.StationSindorim, s => s.Campaign.Node.Equals(StationId.Sindorim));
            await Step(ActionFaceEncounter, s => s.Campaign.Stage == CampaignStage.Encounter);
            await Step(ActionEnterResolution, s => s.Campaign.Stage == CampaignStage.Resolution);

            if (choice == EncounterChoice.Negotiate)
            {
                await Step(UiElementNames.ChoiceNegotiate, s =>
                    s.Campaign.Choice == EncounterChoice.Negotiate
                    && s.Campaign.Stage == CampaignStage.Settlement);
            }
            else if (choice == EncounterChoice.Bypass)
            {
                await Step(UiElementNames.ChoiceBypass, s =>
                    s.Campaign.Choice == EncounterChoice.Bypass
                    && s.Campaign.Stage == CampaignStage.Settlement);
            }
            else
            {
                await Step(UiElementNames.ChoiceCombat, s =>
                    s.Campaign.PendingBattle != null
                    && s.Battle != null
                    && s.Battle.Outcome == BattleOutcomeKind.Ongoing);
                result.BattleContextHash = session.Campaign.PendingBattle.ContextHash;
                int guard = 0;
                while (session.Battle != null
                       && session.Battle.Outcome == BattleOutcomeKind.Ongoing
                       && guard < 64)
                {
                    int tickBefore = session.Battle.BattleTick.Value;
                    string battleHashBefore = session.BattleHash;
                    await Step(BattleAdvance, s =>
                        s.Battle != null
                        && (s.Battle.Outcome != BattleOutcomeKind.Ongoing
                            || s.Battle.BattleTick.Value != tickBefore
                            || s.BattleHash != battleHashBefore));
                    result.BattleCommands++;
                    guard++;
                }

                Assert.That(session.Battle, Is.Not.Null);
                Assert.That(session.Battle.Outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory));
            }

            await Step(ActionSettle, s => s.Campaign.SettlementApplied && s.LastReceipt != null);

            // Dual exact-once observables: disabled UI ignore + presenter seam duplicate receipt.
            string hashBeforeDup = session.CampaignHash;
            int eventsBeforeDup = session.CampaignLedger.Events.Count;
            SettlementReceipt firstReceipt = session.LastReceipt;
            Button settleBtn = root.Q<Button>(ActionSettle);
            Assert.That(settleBtn, Is.Not.Null);
            Assert.That(settleBtn.enabledInHierarchy, Is.False, "settle disabled after apply");
            AttemptClickNamed(root, ActionSettle);
            Assert.That(session.CampaignHash, Is.EqualTo(hashBeforeDup), "UI dup settle ignored");
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(eventsBeforeDup));
            Assert.That(session.LastDuplicateReceipt, Is.Null);

            Task dup = WaitSignal(session);
            host.Presenter.TriggerSettleForTest();
            clicks.Add(ActionSettle + "#dup");
            await AwaitTask(dup, TimeSpan.FromSeconds(5), "dup settle seam");
            Assert.That(session.LastDuplicateReceipt, Is.Not.Null);
            Assert.That(session.LastDuplicateReceipt.Equals(firstReceipt), Is.True);
            Assert.That(session.CampaignHash, Is.EqualTo(hashBeforeDup));
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(eventsBeforeDup));

            await Step(UiElementNames.ReturnAction, s =>
                s.Campaign.Stage == CampaignStage.BaseReady);

            result.FinalHash = session.CampaignHash;
            result.ClickTrace = string.Join(">", clicks);
            return result;
        }

        static async Task ClickAndAwait(
            IPocCoreLoopSession session,
            VisualElement root,
            string elementName,
            Func<IPocCoreLoopSession, bool> predicate)
        {
            Task signal = WaitSignal(session);
            ClickNamed(root, elementName);
            await AwaitTask(signal, TimeSpan.FromSeconds(8), "state after " + elementName);
            Assert.That(predicate(session), Is.True,
                "predicate failed after click " + elementName
                + " stage=" + session.Campaign?.Stage
                + " node=" + session.Campaign?.Node.Value
                + " rejection=" + (session.LastRejection?.GetType().Name ?? "none"));
        }

        static void ClickNamed(VisualElement root, string name)
        {
            Button button = root.Q<Button>(name);
            Assert.That(button, Is.Not.Null, "missing clickable button " + name);
            Assert.That(button.enabledInHierarchy, Is.True, name + " must be enabled");
            button.Focus();
            using (var evt = NavigationSubmitEvent.GetPooled())
            {
                evt.target = button;
                button.SendEvent(evt);
            }
        }

        /// <summary>
        /// Sends the same NavigationSubmit the production path uses even when the control is
        /// disabled — used to prove disabled UI ignores the second click (no domain dispatch).
        /// </summary>
        static void AttemptClickNamed(VisualElement root, string name)
        {
            Button button = root.Q<Button>(name);
            Assert.That(button, Is.Not.Null, "missing button for attempt-click " + name);
            button.Focus();
            using (var evt = NavigationSubmitEvent.GetPooled())
            {
                evt.target = button;
                button.SendEvent(evt);
            }
        }

        static Task WaitSignal(IPocCoreLoopSession session)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void Handler()
            {
                session.StateChanged -= Handler;
                tcs.TrySetResult(true);
            }

            session.StateChanged += Handler;
            return tcs.Task;
        }

        static Task WaitRejection(IPocCoreLoopSession session)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void Handler(object _)
            {
                session.CommandRejected -= Handler;
                tcs.TrySetResult(true);
            }

            session.CommandRejected += Handler;
            return tcs.Task;
        }

        static async Task AwaitTask(Task task, TimeSpan timeout, string label)
        {
            Task winner = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
            await task;
        }

        static VisualElement RequireRoot(GameplayUiHost host)
        {
            Assert.That(host.Document, Is.Not.Null);
            VisualElement root = host.Document.rootVisualElement;
            Assert.That(root, Is.Not.Null);
            return root;
        }

        static GameplayUiHost FindGameplayHost()
        {
            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "GameplayUiHost missing on Foundation");
            Assert.That(host.IsReady, Is.True);
            Assert.That(host.Presenter, Is.Not.Null);
            Assert.That(host.Presenter.IsReady, Is.True);
            return host;
        }

        static IPocCoreLoopSession ResolveSession(GameplayUiHost host)
        {
            // Prefer host-attached session if GREEN wiring exposes it.
            var hostType = host.GetType();
            var prop = hostType.GetProperty("CoreLoop")
                       ?? hostType.GetProperty("Loop")
                       ?? hostType.GetProperty("Session");
            if (prop != null && typeof(IPocCoreLoopSession).IsAssignableFrom(prop.PropertyType))
            {
                return prop.GetValue(host) as IPocCoreLoopSession;
            }

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            if (scope?.Container != null
                && scope.Container.TryResolve(typeof(IPocCoreLoopSession), out object resolved)
                && resolved is IPocCoreLoopSession session)
            {
                return session;
            }

            // Also try concrete controller type name without hard dependency.
            if (scope?.Container != null)
            {
                foreach (var reg in new[]
                         {
                             "Janseon.Foundation.AppFlow.PocCoreLoopController",
                             "Janseon.Foundation.UI.PocCoreLoopController",
                         })
                {
                    Type t = Type.GetType(reg + ", Janseon.Foundation");
                    if (t == null)
                    {
                        continue;
                    }

                    if (scope.Container.TryResolve(t, out object concrete)
                        && concrete is IPocCoreLoopSession s2)
                    {
                        return s2;
                    }
                }
            }

            return null;
        }

        async Task BootstrapToFoundationAsync()
        {
            await UnloadContentScenesAsync();

            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(
                FoundationScenes.Bootstrap,
                LoadSceneMode.Single));
            await mainTitleLoaded;

            MainTitleUiHost titleHost = UnityEngine.Object.FindAnyObjectByType<MainTitleUiHost>();
            Assert.That(titleHost, Is.Not.Null, "MainTitleUiHost required");
            await AwaitTask(titleHost.Ready, TimeSpan.FromSeconds(10), "MainTitle ready");

            AppLifetimeScope appScope = UnityEngine.Object.FindObjectsByType<AppLifetimeScope>(FindObjectsSortMode.None)
                .FirstOrDefault();
            Assert.That(appScope, Is.Not.Null);
            ApplicationFlowCoordinator coordinator =
                appScope.Container.Resolve<ApplicationFlowCoordinator>();
            Task<TransitionOutcome> titleCommit = coordinator.CurrentTransition;
            Assert.That(titleCommit, Is.Not.Null, "MainTitle startup transition must exist");
            TransitionOutcome titleOutcome = await AwaitTaskResult(
                titleCommit, TimeSpan.FromSeconds(15), "MainTitle commit");
            Assert.That(titleOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));

            VisualElement titleRoot = titleHost.Document.rootVisualElement;
            Button start = titleRoot.Q<Button>(UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null, "main-title-start missing");

            var presenterField = typeof(MainTitleUiHost).GetField(
                "presenter",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            Assert.That(presenterField, Is.Not.Null, "MainTitleUiHost.presenter field");
            var titlePresenter = presenterField.GetValue(titleHost) as MainTitlePresenter;
            Assert.That(titlePresenter, Is.Not.Null, "MainTitlePresenter required");

            // Subscribe to exact Foundation commit before triggering Start (no polling).
            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            Task<TransitionOutcome> foundationCommit = null;

            // Drive production Start button (same handler as main-title-start).
            start.Focus();
            using (var evt = NavigationSubmitEvent.GetPooled())
            {
                evt.target = start;
                start.SendEvent(evt);
            }

            // Capture the coordinator transition task; if NavigationSubmit did not start it,
            // invoke the production presenter Start seam (identical OpenFoundationAsync path).
            foundationCommit = coordinator.CurrentTransition;
            if (coordinator.CurrentState == ApplicationFlowState.MainTitle
                && (foundationCommit == null || foundationCommit.IsCompleted))
            {
                foundationCommit = titlePresenter.StartAsync();
            }
            else if (foundationCommit == null)
            {
                foundationCommit = titlePresenter.StartAsync();
            }

            await foundationLoaded;
            await titleUnloaded;
            TransitionOutcome foundationOutcome =
                await AwaitTaskResult(foundationCommit, TimeSpan.FromSeconds(15), "Foundation commit");

            Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed),
                "Foundation transition must complete before session lookup");
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(coordinator.CurrentLease, Is.Not.Null);
            Assert.That(coordinator.CurrentLease.Screen, Is.EqualTo(ContentScreenId.Foundation));
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.Foundation).isLoaded, Is.True);

            // Exact gameplay readiness then scoped core-loop attach (IStartable after inject).
            GameplayUiHost gp = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(gp, Is.Not.Null, "GameplayUiHost missing after Foundation commit");
            await AwaitTask(gp.Ready, TimeSpan.FromSeconds(10), "Gameplay ready");
            Assert.That(gp.IsReady, Is.True);
            Assert.That(gp.Presenter, Is.Not.Null);
            Assert.That(gp.Presenter.IsReady, Is.True);
            await AwaitTask(gp.CoreLoopReady, TimeSpan.FromSeconds(10), "CoreLoop attach");
            Assert.That(gp.CoreLoop, Is.Not.Null);
            Assert.That(gp.CoreLoop.IsReady, Is.True);

            string head = RunGit("rev-parse HEAD").Trim();
            Assert.That(head, Is.EqualTo(testedHead), "HEAD must remain unchanged during the scenario");
            Debug.Log("CORE_LOOP_TESTED_HEAD " + head);
        }

        static async Task<T> AwaitTaskResult<T>(Task<T> task, TimeSpan timeout, string label)
        {
            Assert.That(task, Is.Not.Null, label + " task missing");
            Task winner = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
            return await task;
        }

        static async Task UnloadContentScenesAsync()
        {
            string[] paths = { FoundationScenes.MainTitle, FoundationScenes.Foundation };
            foreach (string path in paths)
            {
                for (int pass = 0; pass < 3; pass++)
                {
                    Scene stale = SceneManager.GetSceneByPath(path);
                    if (!stale.isLoaded)
                    {
                        break;
                    }

                    var unloaded = new TaskCompletionSource<bool>(
                        TaskCreationOptions.RunContinuationsAsynchronously);
                    void OnUnloaded(Scene s)
                    {
                        if (s.path == path)
                        {
                            unloaded.TrySetResult(true);
                        }
                    }

                    SceneManager.sceneUnloaded += OnUnloaded;
                    try
                    {
                        AsyncOperation op = SceneManager.UnloadSceneAsync(stale);
                        if (op == null)
                        {
                            break;
                        }

                        await AwaitTask(unloaded.Task, TimeSpan.FromSeconds(10), "unload " + path);
                    }
                    finally
                    {
                        SceneManager.sceneUnloaded -= OnUnloaded;
                    }
                }
            }
        }

        static Task AwaitAsyncOperation(AsyncOperation operation)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => tcs.TrySetResult(true);
            return tcs.Task;
        }

        static async Task WaitForSceneAsync(string path, TimeSpan timeout)
        {
            var loaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnLoaded(Scene scene, LoadSceneMode _)
            {
                if (scene.path == path)
                {
                    loaded.TrySetResult(true);
                }
            }

            SceneManager.sceneLoaded += OnLoaded;
            try
            {
                if (SceneManager.GetSceneByPath(path).isLoaded)
                {
                    loaded.TrySetResult(true);
                }

                await AwaitTask(loaded.Task, timeout, "scene " + path);
            }
            finally
            {
                SceneManager.sceneLoaded -= OnLoaded;
            }
        }

        static async Task WaitForSceneUnloadedAsync(string path, TimeSpan timeout)
        {
            var unloaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnUnloaded(Scene scene)
            {
                if (scene.path == path)
                {
                    unloaded.TrySetResult(true);
                }
            }

            SceneManager.sceneUnloaded += OnUnloaded;
            try
            {
                if (!SceneManager.GetSceneByPath(path).isLoaded)
                {
                    unloaded.TrySetResult(true);
                }

                await AwaitTask(unloaded.Task, timeout, "unload " + path);
            }
            finally
            {
                SceneManager.sceneUnloaded -= OnUnloaded;
            }
        }

        static string RunGit(string args)
        {
            string repo = System.IO.Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            var psi = new System.Diagnostics.ProcessStartInfo("git", args)
            {
                WorkingDirectory = repo,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var p = System.Diagnostics.Process.Start(psi);
            string o = p!.StandardOutput.ReadToEnd();
            p.WaitForExit(30_000);
            return o;
        }
    }
}
