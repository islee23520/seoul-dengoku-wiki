using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Collections;
using System.IO;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Todo 12 RED-first PlayMode: production Bootstrap/MainTitle/Foundation UI surface must
    /// drive one complete core loop via UIDocument buttons + scoped session. Separate from
    /// FoundationSceneFlowTests. No sleeps ? subscribe to session signals before clicks.
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
        const string BattlePlayPause = "battle-play-pause";

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

            RectTransform root = host.CanvasRoot;
            Assert.That(root, Is.Not.Null);
            Transform prep = UguiHudBuilder.Find(root, UiElementNames.StageBasePrep);
            Assert.That(prep, Is.Not.Null);
            Assert.That(prep.GetComponentInChildren<UnityEngine.UI.Text>(true).color, Is.EqualTo(new Color(0.835f, 0.929f, 0.765f)),
                "BasePreparation chip must be current after Start��Foundation");

            Button depart = UguiHudBuilder.ButtonNamed(root, ActionDepart);
            Assert.That(depart, Is.Not.Null, "action-depart must exist for prepare/dispatch");
            Assert.That(changed, Is.Not.Null);
        }

        [Test]
        public async Task MainTitle_DefaultWanderer_HasThreeSupply30AndOvernightOnly()
        {
            await BootstrapToFoundationAsync();

            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session.Campaign.StartingPreset, Is.EqualTo(StartingPreset.Wanderer));
            Assert.That(session.Campaign.PartyMemberCount, Is.EqualTo(3));
            Assert.That(session.Campaign.Resources, Is.EqualTo(30));
            Assert.That(session.Campaign.HasStronghold, Is.False);
            Assert.That(UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.HubOvernightCopy).gameObject.activeInHierarchy, Is.True);
            Assert.That(UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.HubBulletinPanel).gameObject.activeInHierarchy, Is.False);
        }

        [Test]
        public async Task MainTitle_StationMasterToggle_HasThreeSupply40AndYeongdeungpoBulletin()
        {
            await BootstrapToFoundationAsync(StartingPreset.StationMaster);

            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session.Campaign.StartingPreset, Is.EqualTo(StartingPreset.StationMaster));
            Assert.That(session.Campaign.PartyMemberCount, Is.EqualTo(3));
            Assert.That(session.Campaign.Resources, Is.EqualTo(40));
            Assert.That(session.Campaign.HomeBase, Is.EqualTo(StationId.Yeongdeungpo));
            Assert.That(session.Campaign.HasStronghold, Is.True);
            Assert.That(UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.HubOvernightCopy).gameObject.activeInHierarchy, Is.False);
            Assert.That(UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.HubBulletinPanel).gameObject.activeInHierarchy, Is.True);
        }

        [Test]
        public async Task ExpeditionTravel_UI_MovesYeongdeungpoToSindorim_ExposesEncounter()
        {
            await BootstrapToFoundationAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "IPocCoreLoopSession required");
            RectTransform root = RequireRoot(host);

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
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.EncounterChoices), Is.Not.Null);
            Assert.That(UguiHudBuilder.ButtonNamed(root, UiElementNames.ChoiceNegotiate), Is.Not.Null);
            Assert.That(UguiHudBuilder.ButtonNamed(root, UiElementNames.ChoiceBypass), Is.Not.Null);
            Assert.That(UguiHudBuilder.ButtonNamed(root, UiElementNames.ChoiceCombat), Is.Not.Null);
            Transform stageRes = UguiHudBuilder.Find(root, UiElementNames.StageResolution);
            Assert.That(stageRes.GetComponentInChildren<UnityEngine.UI.Text>(true).color,
                Is.EqualTo(new Color(0.835f, 0.929f, 0.765f)), "resolution chip current color");
        }

        [Test]
        public async Task SettlementApply_StaysAtSindorim_UntilReturnAction()
        {
            await BootstrapToFoundationAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "IPocCoreLoopSession required");
            RectTransform root = RequireRoot(host);

            await ClickAndAwait(session, root, ActionDepart, s =>
                s.Campaign.Stage == CampaignStage.ExpeditionTravel);
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

            Assert.That(session.Campaign.Stage, Is.EqualTo(CampaignStage.Settlement));
            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Sindorim),
                "settlement apply must not auto-load the home station");
            Assert.That(UguiHudBuilder.ButtonNamed(root, UiElementNames.ReturnAction).gameObject.activeInHierarchy,
                Is.True, "return-action must be the explicit transition back to home");

            await ClickAndAwait(session, root, UiElementNames.ReturnAction, s =>
                s.Campaign.Stage == CampaignStage.BaseReady);

            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));
        }

        [Test]
        public async Task NegotiationBranch_ExactOnceSettlement_ReturnsBaseReady()
        {
            BranchResult branch = await RunBranchAsync(EncounterChoice.Negotiate);
            Assert.That(branch.Session.Campaign.Stage, Is.EqualTo(CampaignStage.BaseReady));
            Assert.That(branch.Session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));
            Assert.That(branch.Session.Campaign.ConsequenceId, Is.EqualTo(CampaignApi.ConsequenceNegotiate));
            Assert.That(branch.Session.Campaign.Resources,
                Is.EqualTo(30 + CampaignApi.ConfirmedMoveResourceDelta + CampaignApi.NegotiateResourceDelta));
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
                Is.EqualTo(30 + CampaignApi.ConfirmedMoveResourceDelta + CampaignApi.BypassResourceDelta));
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
        public async Task CombatBranch_RealtimeBattleToTerminal_ExactOnceSettlement_ReturnsBaseReady()
        {
            BranchResult branch = await RunBranchAsync(EncounterChoice.Combat);
            Assert.That(branch.Session.Campaign.Stage, Is.EqualTo(CampaignStage.BaseReady));
            Assert.That(branch.Session.Campaign.ConsequenceId, Is.Not.Empty);
            Assert.That(branch.Session.LastReceipt, Is.Not.Null);
            Assert.That(branch.Session.LastReceipt.Outcome, Is.Not.EqualTo(SettlementOutcomeKind.None));
            Assert.That(string.IsNullOrEmpty(branch.Session.LastReceipt.BattleId.Value), Is.False);
            Assert.That(branch.BattleContextHash, Is.Not.Empty);
            Assert.That(branch.Session.LastDuplicateReceipt, Is.Not.Null);
            Assert.That(branch.Session.LastDuplicateReceipt.Equals(branch.Session.LastReceipt), Is.True);
            Assert.That(branch.Session.Campaign.PendingBattle, Is.Null);
            Assert.That(branch.BattleCommands, Is.GreaterThan(0),
                "combat must execute real realtime simulation ticks via battle-play-pause");
            Debug.Log("CORE_LOOP_COMBAT " + branch.Summarize());
        }

        [Test]
        public async Task CombatUi_SelectsAndPlaysMobilityCard_ThenTicksCooldown()
        {
            await BootstrapToFoundationAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            RectTransform root = RequireRoot(host);
            await ClickAndAwait(session, root, ActionDepart, s => s.Campaign.Stage == CampaignStage.ExpeditionTravel);
            await ClickAndAwait(session, root, UiElementNames.StationSindorim, s => s.Campaign.Node.Equals(StationId.Sindorim));
            await ClickAndAwait(session, root, ActionFaceEncounter, s => s.Campaign.Stage == CampaignStage.Encounter);
            await ClickAndAwait(session, root, ActionEnterResolution, s => s.Campaign.Stage == CampaignStage.Resolution);
            await ClickAndAwait(session, root, UiElementNames.ChoiceCombat, s => s.Battle != null && s.Battle.Deployed);

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null, "FoundationLifetimeScope required for live driver proof");
            BattleSessionDriver driver = scope.Container.Resolve<BattleSessionDriver>();

            var commander = session.Battle.Units.First(u => u.Id.Equals(session.Battle.PlayerCommanderId));
            GridCoord beforeCell = commander.Cell;
            await ClickAndAwait(session, root, UiElementNames.MobilityRegroup, s =>
            {
                var card = s.Battle.Cards.First(c => c.Id == "mobility-regroup");
                return commander.Cell.Equals(beforeCell.Step(CardinalDirection.South))
                    && card.RechargeTicksLeft == 600;
            });
            await ClickAndAwait(session, root, BattlePlayPause, s =>
                s.BattlePaused);
            int pausedCooldown = session.Battle.Cards.First(c => c.Id == "mobility-regroup").RechargeTicksLeft;

            Task<int> resumedFrame = WaitForSteppedFrame(driver, TimeSpan.FromSeconds(8));
            await ClickAndAwait(session, root, BattlePlayPause, s => !s.BattlePaused);
            int resumedSteps = await resumedFrame;
            Assert.That(resumedSteps, Is.InRange(1, BattleSessionDriver.MaxStepsPerFrame),
                "resumed production frame must consume live simulation steps");
            Assert.That(session.Battle.Cards.First(c => c.Id == "mobility-regroup").RechargeTicksLeft,
                Is.LessThan(pausedCooldown),
                "a resumed stepped frame must strictly progress the accepted card cooldown");

            await UguiKeyboardPlayModeHelper.FinishCombatKeyboard(session, root);
            SettlementReceipt receipt = session.LastReceipt;
            string settledHash = session.CampaignHash;
            int settledEvents = session.CampaignLedger.Events.Count;
            Task duplicateSignal = WaitSignal(session);
            host.Presenter.TriggerSettleForTest();
            await AwaitTask(duplicateSignal, TimeSpan.FromSeconds(5), "mobility roundtrip duplicate receipt");
            Assert.That(session.LastDuplicateReceipt, Is.Not.Null);
            Assert.That(session.LastDuplicateReceipt.Equals(receipt), Is.True);
            Assert.That(session.CampaignHash, Is.EqualTo(settledHash));
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(settledEvents));
            await ClickAndAwait(session, root, UiElementNames.ReturnAction, s => s.Campaign.Stage == CampaignStage.BaseReady);
        }

        [UnityTest]
        public IEnumerator CombatUi_MobilityRoundTrip_FinalScreenEvidence()
        {
            Task scenario = CombatUi_SelectsAndPlaysMobilityCard_ThenTicksCooldown();
            float deadline = Time.realtimeSinceStartup + 45f;
            while (!scenario.IsCompleted && Time.realtimeSinceStartup < deadline) yield return null;
            Assert.That(scenario.IsCompleted, Is.True, "mobility roundtrip timed out before capture");
            if (scenario.IsFaulted) throw scenario.Exception.InnerException ?? scenario.Exception;

            string output = Environment.GetEnvironmentVariable("JANSEON_INTEGRATION_SCREEN")
                ?? Path.GetFullPath(Path.Combine(Application.dataPath,
                    "../../docs/verification/ulw-execute/rtfc/phase-c/integration/final-playmode-screen.png"));
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            GameplayUiHost host = FindGameplayHost();
            Camera camera = Camera.main != null ? Camera.main : UnityEngine.Object.FindAnyObjectByType<Camera>();
            Canvas canvas = host.CanvasRoot.GetComponentInParent<Canvas>();
            const int width = 1280, height = 720;
            var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            var texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
            RenderTexture previousActive = RenderTexture.active;
            RenderTexture previousTarget = camera.targetTexture;
            RenderMode previousMode = canvas.renderMode;
            Camera previousWorldCamera = canvas.worldCamera;
            try
            {
                target.Create();
                canvas.renderMode = RenderMode.ScreenSpaceCamera;
                canvas.worldCamera = camera;
                canvas.planeDistance = Mathf.Max(camera.nearClipPlane + 0.1f, 1f);
                Canvas.ForceUpdateCanvases();
                camera.targetTexture = target;
                camera.Render();
                RenderTexture.active = target;
                texture.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                texture.Apply();
                File.WriteAllBytes(output, ImageConversion.EncodeToPNG(texture));
            }
            finally
            {
                canvas.renderMode = previousMode;
                canvas.worldCamera = previousWorldCamera;
                camera.targetTexture = previousTarget;
                RenderTexture.active = previousActive;
                UnityEngine.Object.DestroyImmediate(texture);
                target.Release();
                UnityEngine.Object.DestroyImmediate(target);
            }
            Assert.That(File.Exists(output), Is.True, "final PlayMode screenshot missing");
            Assert.That(new FileInfo(output).Length, Is.GreaterThan(1024));
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
            RectTransform root = RequireRoot(host);

            // ---- Depart: first UI success ----
            await ClickAndAwait(session, root, ActionDepart, s =>
                s.Campaign.Stage == CampaignStage.ExpeditionTravel);
            string hashAfterDepart = session.CampaignHash;
            int tick = session.Campaign.Tick.Value;
            int events = session.CampaignLedger.Events.Count;
            object rejectionBefore = session.LastRejection;

            // (1) Actual UI button disabled / second click ignored ? zero command/event/hash change.
            Button departBtn = UguiHudBuilder.ButtonNamed(root, ActionDepart);
            Assert.That(departBtn, Is.Not.Null);
            Assert.That(departBtn.interactable, Is.False,
                "action-depart must disable after successful depart");
            ExecutePointerClick(root, ActionDepart);
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

            // (1) Settle button disabled after apply ? second UI click ignored, zero side effect.
            Button settleBtn = UguiHudBuilder.ButtonNamed(root, ActionSettle);
            Assert.That(settleBtn, Is.Not.Null);
            Assert.That(settleBtn.interactable, Is.False,
                "action-settle must disable after successful settle (return takes over)");
            ExecutePointerClick(root, ActionSettle);
            Assert.That(session.CampaignHash, Is.EqualTo(settledHash), "UI double-settle hash");
            Assert.That(session.CampaignLedger.Events.Count, Is.EqualTo(settledEvents));
            Assert.That(session.Campaign.Resources, Is.EqualTo(settledRes));
            Assert.That(session.LastDuplicateReceipt, Is.SameAs(dupBefore),
                "disabled UI settle click must not hit SettlementApi");

            // (2) Presenter/session seam re-submits identical payload �� exact-once receipt, zero mutation.
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

        [Test]
        [Category("Task26Keyboard")]
        public void Task26Keyboard_TabShiftTabEnterEsc_UsesUguiEventSystem()
        {
            EventSystem eventSystem = EventSystem.current;
            GameObject ownedEventSystem = null;
            if (eventSystem == null)
            {
                ownedEventSystem = new GameObject("task-26-event-system");
                eventSystem = ownedEventSystem.AddComponent<EventSystem>();
            }

            var root = new GameObject("task-26-keyboard-root");
            var overlay = new GameObject("task-26-overlay");
            overlay.transform.SetParent(root.transform, false);
            KeyboardCancelOverlay cancelOverlay = overlay.AddComponent<KeyboardCancelOverlay>();
            Button first = new GameObject("keyboard-first").AddComponent<Button>();
            first.transform.SetParent(overlay.transform, false);
            Button second = new GameObject("keyboard-second").AddComponent<Button>();
            second.transform.SetParent(overlay.transform, false);
            var activations = 0;
            first.onClick.AddListener(() => activations++);

            try
            {
                eventSystem.SetSelectedGameObject(null);
                UguiKeyboardPlayModeHelper.Tab(root.transform);
                Assert.That(eventSystem.currentSelectedGameObject, Is.SameAs(first.gameObject));

                UguiKeyboardPlayModeHelper.Tab(root.transform);
                Assert.That(eventSystem.currentSelectedGameObject, Is.SameAs(second.gameObject));

                UguiKeyboardPlayModeHelper.ShiftTab(root.transform);
                Assert.That(eventSystem.currentSelectedGameObject, Is.SameAs(first.gameObject));

                UguiKeyboardPlayModeHelper.Enter();
                Assert.That(activations, Is.EqualTo(1), "Enter must submit the focused uGUI Button");

                UguiKeyboardPlayModeHelper.Escape();
                Assert.That(cancelOverlay.CancelCount, Is.EqualTo(1));
                Assert.That(overlay.activeSelf, Is.False, "Esc must cancel the selected control's overlay");
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(root);
                if (ownedEventSystem != null)
                {
                    UnityEngine.Object.DestroyImmediate(ownedEventSystem);
                }
            }
        }

        [Test]
        [Category("Task26Keyboard")]
        public void Task26Keyboard_SourceRejectsDirectClickVisualElementSubmitAndCuaDriver()
        {
            string helperPath = System.IO.Path.Combine(
                Application.dataPath,
                "Tests",
                "PlayMode",
                "UguiKeyboardPlayModeHelper.cs");
            Assert.That(System.IO.File.Exists(helperPath), Is.True, "tracked task-26 helper source missing");
            string source = System.IO.File.ReadAllText(helperPath);
            Assert.That(source, Does.Contain("EventSystem"));
            Assert.That(source, Does.Contain("ExecuteEvents"));
            Assert.That(source, Does.Not.Contain("onClick.Invoke"));
            Assert.That(source, Does.Not.Contain("NavigationSubmitEvent"));
            Assert.That(source, Does.Not.Contain("CuaDriver"));
        }

        [Test]
        [Category("Task26Keyboard")]
        public async Task Task26Keyboard_CombatWaitThenTerminalSettlement_ReturnsBaseReady()
        {
            await BootstrapToFoundationKeyboardAsync();
            GameplayUiHost host = FindGameplayHost();
            IPocCoreLoopSession session = ResolveSession(host);
            Assert.That(session, Is.Not.Null, "IPocCoreLoopSession required for keyboard loop");
            RectTransform root = RequireRoot(host);

            await UguiKeyboardPlayModeHelper.EnterNamedAndAwaitAsync(
                session, root, ActionDepart,
                s => s.Campaign.Stage == CampaignStage.ExpeditionTravel);
            await UguiKeyboardPlayModeHelper.EnterNamedAndAwaitAsync(
                session, root, UiElementNames.StationSindorim,
                s => s.Campaign.Node.Equals(StationId.Sindorim));
            await UguiKeyboardPlayModeHelper.EnterNamedAndAwaitAsync(
                session, root, ActionFaceEncounter,
                s => s.Campaign.Stage == CampaignStage.Encounter);
            await UguiKeyboardPlayModeHelper.EnterNamedAndAwaitAsync(
                session, root, ActionEnterResolution,
                s => s.Campaign.Stage == CampaignStage.Resolution);
            await UguiKeyboardPlayModeHelper.EnterNamedAndAwaitAsync(
                session, root, UiElementNames.ChoiceCombat,
                s => s.Battle != null && s.Battle.Outcome == BattleOutcomeKind.Ongoing);

            BattleOutcomeKind outcome = await UguiKeyboardPlayModeHelper.FinishCombatKeyboard(session, root);
            Assert.That(outcome, Is.EqualTo(BattleOutcomeKind.PlayerVictory)
                .Or.EqualTo(BattleOutcomeKind.EnemyVictory));
            Assert.That(session.Campaign.SettlementApplied, Is.True,
                "FinishCombatKeyboard must submit action-settle only after terminal outcome");

            await UguiKeyboardPlayModeHelper.EnterNamedAndAwaitAsync(
                session, root, UiElementNames.ReturnAction,
                s => s.Campaign.Stage == CampaignStage.BaseReady);
            Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));
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
            RectTransform root = RequireRoot(host);
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
                BattleOutcomeKind combatOutcome =
                    await UguiKeyboardPlayModeHelper.FinishCombatKeyboard(session, root);
                result.BattleCommands++;
                Assert.That(combatOutcome, Is.Not.EqualTo(BattleOutcomeKind.Ongoing));
                if (session.Battle != null)
                {
                    Assert.That(session.Battle.Outcome, Is.Not.EqualTo(BattleOutcomeKind.Ongoing));
                }
            }

            if (!session.Campaign.SettlementApplied || session.LastReceipt == null)
            {
                await Step(ActionSettle, s => s.Campaign.SettlementApplied && s.LastReceipt != null);
            }

            // Dual exact-once observables: disabled UI ignore + presenter seam duplicate receipt.
            string hashBeforeDup = session.CampaignHash;
            int eventsBeforeDup = session.CampaignLedger.Events.Count;
            SettlementReceipt firstReceipt = session.LastReceipt;
            Button settleBtn = UguiHudBuilder.ButtonNamed(root, ActionSettle);
            Assert.That(settleBtn, Is.Not.Null);
            Assert.That(settleBtn.interactable, Is.False, "settle disabled after apply");
            ExecutePointerClick(root, ActionSettle);
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
            RectTransform root,
            string elementName,
            Func<IPocCoreLoopSession, bool> predicate)
        {
            Task signal = WaitSignal(session);
            InvokeButton(root, elementName);
            await AwaitTask(signal, TimeSpan.FromSeconds(8), "state after " + elementName);
            Assert.That(predicate(session), Is.True,
                "predicate failed after click " + elementName
                + " stage=" + session.Campaign?.Stage
                + " node=" + session.Campaign?.Node.Value
                + " rejection=" + (session.LastRejection?.GetType().Name ?? "none"));
        }

        static void InvokeButton(RectTransform root, string name)
        {
            Button button = UguiHudBuilder.ButtonNamed(root, name);
            Assert.That(button, Is.Not.Null, "missing clickable button " + name);
            Assert.That(button.interactable, Is.True, name + " must be enabled");
            button.onClick.Invoke();
        }

        /// <summary>
        /// Executes the uGUI pointer-click path so a disabled Button rejects the click before
        /// invoking listeners, proving the second click cannot dispatch a domain command.
        /// </summary>
        static void ExecutePointerClick(RectTransform root, string name)
        {
            Button button = UguiHudBuilder.ButtonNamed(root, name);
            Assert.That(button, Is.Not.Null, "missing button for pointer click " + name);
            var eventData = new PointerEventData(EventSystem.current)
            {
                button = PointerEventData.InputButton.Left,
            };
            ExecuteEvents.Execute(button.gameObject, eventData, ExecuteEvents.pointerClickHandler);
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

        static async Task<int> WaitForSteppedFrame(BattleSessionDriver driver, TimeSpan timeout)
        {
            var processed = new TaskCompletionSource<int>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnFrame(int steps)
            {
                if (steps <= 0)
                {
                    return;
                }

                driver.FrameProcessed -= OnFrame;
                processed.TrySetResult(steps);
            }

            driver.FrameProcessed += OnFrame;
            try
            {
                return await AwaitTaskResult(processed.Task, timeout, "resumed stepped production frame");
            }
            finally
            {
                driver.FrameProcessed -= OnFrame;
            }
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

        static RectTransform RequireRoot(GameplayUiHost host)
        {
            RectTransform root = host.CanvasRoot;
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

        async Task BootstrapToFoundationKeyboardAsync()
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
            TransitionOutcome titleOutcome = await AwaitTaskResult(
                coordinator.CurrentTransition, TimeSpan.FromSeconds(15), "MainTitle commit");
            Assert.That(titleOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            UguiKeyboardPlayModeHelper.FocusNamed(titleHost.CanvasRoot, UiElementNames.MainTitleStart);
            UguiKeyboardPlayModeHelper.Enter();
            Task<TransitionOutcome> foundationCommit = coordinator.CurrentTransition;
            Assert.That(foundationCommit, Is.Not.Null, "Enter on focused Start must begin Foundation transition");

            await foundationLoaded;
            await titleUnloaded;
            TransitionOutcome foundationOutcome =
                await AwaitTaskResult(foundationCommit, TimeSpan.FromSeconds(15), "Foundation commit");
            Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));

            GameplayUiHost gameplayHost = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(gameplayHost, Is.Not.Null, "GameplayUiHost missing after keyboard Start");
            await AwaitTask(gameplayHost.Ready, TimeSpan.FromSeconds(10), "Gameplay ready");
            await AwaitTask(gameplayHost.CoreLoopReady, TimeSpan.FromSeconds(10), "CoreLoop attach");
            Assert.That(gameplayHost.CoreLoop, Is.Not.Null);
            Assert.That(gameplayHost.CoreLoop.IsReady, Is.True);

            string head = RunGit("rev-parse HEAD").Trim();
            Assert.That(head, Is.EqualTo(testedHead), "HEAD must remain unchanged during the scenario");
            Debug.Log("CORE_LOOP_KEYBOARD_TESTED_HEAD " + head);
        }

        async Task BootstrapToFoundationAsync(StartingPreset preset = StartingPreset.Wanderer)
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

            RectTransform titleRoot = titleHost.CanvasRoot;
            Button start = UguiHudBuilder.ButtonNamed(titleRoot, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null, "main-title-start missing");
            if (preset == StartingPreset.StationMaster)
            {
                Toggle stationMaster = UguiHudBuilder.ToggleNamed(titleRoot, UiElementNames.MainTitleStationMasterPreset);
                Assert.That(stationMaster, Is.Not.Null, "station-master preset toggle missing");
                stationMaster.isOn = true;
            }

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
            start.onClick.Invoke();

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
