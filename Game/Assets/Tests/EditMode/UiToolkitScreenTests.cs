using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Todo 11 RED-first UI Toolkit behavior contracts (Design.md). Asserts structure,
    /// FSM action, snapshot determinism, readiness — not user-visible prose.
    /// </summary>
    public sealed class UiToolkitScreenTests
    {
        [Test]
        public void MainTitle_UxmlAndUss_ExistAsAssets()
        {
            Assert.That(
                AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.MainTitleUxml),
                Is.Not.Null,
                "MainTitle UXML must be imported at " + UiScreenPaths.MainTitleUxml);
            Assert.That(
                AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.MainTitleUss),
                Is.Not.Null,
                "MainTitle USS must be imported at " + UiScreenPaths.MainTitleUss);
            Assert.That(
                AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.SharedUss),
                Is.Not.Null,
                "Shared USS must be imported at " + UiScreenPaths.SharedUss);
        }

        [Test]
        public void MainTitle_DocumentRoot_ExposesRequiredElementNames()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.MainTitleUxml, UiScreenPaths.MainTitleUss);
            Assert.That(root, Is.Not.Null);
            Assert.That(root.name, Is.EqualTo(UiElementNames.MainTitleRoot)
                .Or.EqualTo(string.Empty),
                "tree may use child root; querying named root next");

            VisualElement titleRoot = root.name == UiElementNames.MainTitleRoot
                ? root
                : root.Q<VisualElement>(UiElementNames.MainTitleRoot);
            Assert.That(titleRoot, Is.Not.Null, "missing " + UiElementNames.MainTitleRoot);
            Assert.That(titleRoot.Q(UiElementNames.MainTitleMark), Is.Not.Null);
            Assert.That(titleRoot.Q<Button>(UiElementNames.MainTitleStart), Is.Not.Null);
        }

        [Test]
        public async Task MainTitle_Start_CallsOpenFoundationOnPublicCoordinator()
        {
            var loader = new RecordingLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);
            // Commit MainTitle first so OpenFoundation is legal.
            Task<TransitionOutcome> boot = coordinator.OpenMainTitleAsync(CancellationToken.None);
            RecordingLease titleLease = loader.Complete(ContentScreenId.MainTitle);
            titleLease.CompleteReady();
            Assert.That((await boot).Status, Is.EqualTo(TransitionStatus.Completed));

            var presenter = new MainTitlePresenter(coordinator);
            Assert.That(presenter.BindForTest(CreateMainTitleTree()), Is.True, "presenter must bind MainTitle tree");

            Task<TransitionOutcome> click = presenter.TriggerStartForTest();
            // Start must request foundation while title lease is still committed.
            Assert.That(
                coordinator.CurrentState == ApplicationFlowState.Transitioning
                || coordinator.CurrentState == ApplicationFlowState.Foundation,
                Is.True,
                "Start must dispatch OpenFoundation on the public coordinator");

            RecordingLease foundationLease = null;
            if (coordinator.CurrentState == ApplicationFlowState.Transitioning)
            {
                foundationLease = loader.Complete(ContentScreenId.Foundation);
                titleLease.CompleteCleanup();
                foundationLease.CompleteReady();
            }

            TransitionOutcome outcome = await click;

            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(loader.Count(ContentScreenId.Foundation), Is.EqualTo(1));
            Assert.That(loader.Count(ContentScreenId.MainTitle), Is.EqualTo(1));
        }

        [Test]
        public void Gameplay_UxmlAndUss_ExistAsAssets()
        {
            Assert.That(
                AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.GameplayUxml),
                Is.Not.Null,
                "Gameplay UXML must be imported at " + UiScreenPaths.GameplayUxml);
            Assert.That(
                AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.GameplayUss),
                Is.Not.Null,
                "Gameplay USS must be imported at " + UiScreenPaths.GameplayUss);
        }

        [Test]
        public void Gameplay_Document_ExposesRequiredStableElementNames()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            VisualElement gameplayRoot = root.name == UiElementNames.GameplayRoot
                ? root
                : root.Q(UiElementNames.GameplayRoot);
            Assert.That(gameplayRoot, Is.Not.Null, "missing " + UiElementNames.GameplayRoot);

            foreach (string name in UiElementNames.GameplayRequired)
            {
                if (name == UiElementNames.GameplayRoot)
                {
                    continue;
                }

                Assert.That(gameplayRoot.Q(name), Is.Not.Null, "missing element name " + name);
            }

            for (int y = 0; y < 8; y++)
            {
                for (int x = 0; x < 12; x++)
                {
                    string cell = UiElementNames.BattleCell(x, y);
                    Assert.That(gameplayRoot.Q(cell), Is.Not.Null, "missing " + cell);
                }
            }
        }

        [Test]
        public void Gameplay_Presenter_AppliesSnapshot_ToStableElementClasses()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            CampaignState state = CampaignApi.Start(11, StationId.Yeongdeungpo, "bind-campaign");
            GameplayUiSnapshot snap = GameplayUiSnapshot.FromCampaign(state, null);
            presenter.ApplySnapshot(snap);

            VisualElement stage = root.Q(UiElementNames.StageBasePrep);
            Assert.That(stage.ClassListContains("jk-chip--current"), Is.True);
            VisualElement station = root.Q(UiElementNames.StationYeongdeungpo);
            Assert.That(station.ClassListContains("jk-route-node--current"), Is.True);
        }

        [Test]
        public void Gameplay_Presenter_AppliesNamedVisibleFlags_RouteStageKeepsRailsAndStationLabels()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            CampaignState state = CampaignApi.Start(90421, StationId.Yeongdeungpo, "named-visible-route");
            GameplayUiSnapshot snap = GameplayUiSnapshot.FromCampaign(state, null);
            Assert.That(snap.VisiblePanel, Is.EqualTo(GameplayPanelId.RouteStage));
            Assert.That(snap.NamedFlags.ContainsKey(UiElementNames.RouteRail + ":visible"), Is.True);
            Assert.That(snap.NamedFlags[UiElementNames.RouteRail + ":visible"], Is.True);
            Assert.That(snap.NamedFlags.ContainsKey(UiElementNames.StageRail + ":visible"), Is.True);
            Assert.That(snap.NamedFlags[UiElementNames.StageRail + ":visible"], Is.True);

            presenter.ApplySnapshot(snap);

            VisualElement routeRail = root.Q(UiElementNames.RouteRail);
            VisualElement stageRail = root.Q(UiElementNames.StageRail);
            Assert.That(routeRail, Is.Not.Null);
            Assert.That(stageRail, Is.Not.Null);
            Assert.That(routeRail.ClassListContains("jk-hidden"), Is.False,
                "route-rail:visible=true must clear jk-hidden");
            Assert.That(stageRail.ClassListContains("jk-hidden"), Is.False,
                "stage-rail:visible=true must clear jk-hidden");

            // Route-stage map labels must remain painted (capture textLum regression guard).
            Button yeong = root.Q<Button>(UiElementNames.StationYeongdeungpo);
            Button sindorim = root.Q<Button>(UiElementNames.StationSindorim);
            Button guro = root.Q<Button>(UiElementNames.StationGuro);
            Assert.That(yeong, Is.Not.Null);
            Assert.That(sindorim, Is.Not.Null);
            Assert.That(guro, Is.Not.Null);
            Assert.That(yeong.ClassListContains("jk-hidden"), Is.False, "station-Yeongdeungpo must stay visible on route stage");
            Assert.That(sindorim.ClassListContains("jk-hidden"), Is.False, "station-Sindorim must stay visible on route stage");
            Assert.That(guro.ClassListContains("jk-hidden"), Is.False, "station-Guro must stay visible on route stage");
            // BasePreparation: travel off — must NOT SetEnabled(false) (disabled muted text kills capture textLum).
            Assert.That(yeong.enabledSelf, Is.True, "station labels must remain enabled for primary/secondary text paint");
            Assert.That(sindorim.enabledSelf, Is.True);
            Assert.That(guro.enabledSelf, Is.True);
            Assert.That(yeong.pickingMode, Is.EqualTo(PickingMode.Ignore),
                "travel-disabled stations ignore picks without muted :disabled style");
            Assert.That(yeong.text, Does.Contain("영등포"));
            Assert.That(sindorim.text, Does.Contain("신도림"));
            Assert.That(guro.text, Does.Contain("구로"));

            // Force-hide NamedFlags must apply deterministically (malformed keys ignored).
            snap.NamedFlags[UiElementNames.RouteRail + ":visible"] = false;
            snap.NamedFlags[UiElementNames.StageRail + ":visible"] = false;
            snap.NamedFlags["not-a-flag"] = true;
            snap.NamedFlags["broken:visible:extra"] = true;
            presenter.ApplySnapshot(snap);
            Assert.That(root.Q(UiElementNames.RouteRail).ClassListContains("jk-hidden"), Is.True,
                "route-rail:visible=false must set jk-hidden");
            Assert.That(root.Q(UiElementNames.StageRail).ClassListContains("jk-hidden"), Is.True,
                "stage-rail:visible=false must set jk-hidden");
        }

        [Test]
        public void MainTitle_FocusOrder_MatchesDesignContract()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.MainTitleUxml, UiScreenPaths.MainTitleUss);
            // Coordinator is required for construction; Start is not exercised here.
            var presenter = new MainTitlePresenter(new ApplicationFlowCoordinator(new RecordingLoader()));
            Assert.That(presenter.BindForTest(root), Is.True);
            CollectionAssert.AreEqual(UiElementNames.MainTitleFocusOrder, presenter.FocusOrderNames);
        }

        [Test]
        public void Gameplay_FocusOrder_MatchesDesignContract_ForEncounterActions()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);
            CollectionAssert.AreEqual(UiElementNames.GameplayFocusOrder, presenter.FocusOrderNames);
        }

        [Test]
        public void Readiness_Fails_WhenRequiredUxmlMissing()
        {
            var readiness = UiScreenReadiness.Evaluate(
                mainTitleUxml: null,
                mainTitleUss: AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.MainTitleUss),
                gameplayUxml: AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.GameplayUxml),
                gameplayUss: AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.GameplayUss),
                sharedUss: AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.SharedUss),
                panelSettings: AssetDatabase.LoadAssetAtPath<PanelSettings>(UiScreenPaths.PanelSettings));

            Assert.That(readiness.IsReady, Is.False);
            Assert.That(readiness.FailureReason, Does.Contain("MainTitle").IgnoreCase
                .Or.Contain("uxml").IgnoreCase);
        }

        [Test]
        public void Readiness_Fails_WhenPanelSettingsMissing()
        {
            // Even if trees exist later, null panel settings must fail closed.
            var readiness = UiScreenReadiness.Evaluate(
                mainTitleUxml: AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.MainTitleUxml),
                mainTitleUss: AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.MainTitleUss),
                gameplayUxml: AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.GameplayUxml),
                gameplayUss: AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.GameplayUss),
                sharedUss: AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.SharedUss),
                panelSettings: null);

            Assert.That(readiness.IsReady, Is.False);
            Assert.That(readiness.FailureReason, Does.Contain("PanelSettings").IgnoreCase
                .Or.Contain("panel").IgnoreCase);
        }

        [Test]
        public void ActiveLease_AllowsExactlyOneScreenDocument()
        {
            Assert.That(UiScreenDocumentLease.MaxDocumentsPerLease, Is.EqualTo(1));
            var lease = new UiScreenDocumentLease();
            Assert.That(lease.TryAttach("main-title"), Is.True);
            Assert.That(lease.TryAttach("gameplay-second"), Is.False, "second document on same lease must be rejected");
            Assert.That(lease.AttachedCount, Is.EqualTo(1));
            lease.Detach();
            Assert.That(lease.TryAttach("gameplay"), Is.True);
            Assert.That(lease.AttachedCount, Is.EqualTo(1));
        }

        static VisualElement InstantiateTree(string uxmlPath, string ussPath)
        {
            var tree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(uxmlPath);
            Assert.That(tree, Is.Not.Null, "UXML missing: " + uxmlPath);
            VisualElement root = tree.Instantiate();
            var uss = AssetDatabase.LoadAssetAtPath<StyleSheet>(ussPath);
            if (uss != null)
            {
                root.styleSheets.Add(uss);
            }

            var shared = AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.SharedUss);
            if (shared != null)
            {
                root.styleSheets.Add(shared);
            }

            return root;
        }

        static VisualElement CreateMainTitleTree()
        {
            return InstantiateTree(UiScreenPaths.MainTitleUxml, UiScreenPaths.MainTitleUss);
        }

        sealed class RecordingLoader : IContentSceneLoader
        {
            readonly Dictionary<ContentScreenId, int> counts = new()
            {
                [ContentScreenId.MainTitle] = 0,
                [ContentScreenId.Foundation] = 0,
            };

            TaskCompletionSource<IContentSceneLease> pending =
                new(TaskCreationOptions.RunContinuationsAsynchronously);

            public int Count(ContentScreenId id) => counts[id];

            public Task<IContentSceneLease> LoadAsync(ContentScreenId screen, CancellationToken cancellationToken)
            {
                counts[screen] = counts[screen] + 1;
                return pending.Task;
            }

            public RecordingLease Complete(ContentScreenId screen)
            {
                var lease = new RecordingLease(screen);
                pending.SetResult(lease);
                pending = new TaskCompletionSource<IContentSceneLease>(
                    TaskCreationOptions.RunContinuationsAsynchronously);
                return lease;
            }
        }

        sealed class RecordingLease : IContentSceneLease
        {
            readonly TaskCompletionSource<bool> ready =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            readonly TaskCompletionSource<bool> cleanup =
                new(TaskCreationOptions.RunContinuationsAsynchronously);

            public RecordingLease(ContentScreenId screen) => Screen = screen;
            public ContentScreenId Screen { get; }
            public Task Ready => ready.Task;
            public void CompleteReady() => ready.TrySetResult(true);
            public void CompleteCleanup() => cleanup.TrySetResult(true);
            public void Dispose() { }
            public Task CleanupAsync()
            {
                cleanup.TrySetResult(true);
                return cleanup.Task;
            }
        }
    }
}
