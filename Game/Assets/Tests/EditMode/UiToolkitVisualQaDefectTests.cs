using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Janseon.Core;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// RED-first machine contracts for Todo 11 visual QA defects (capture + presentation).
    /// Asserts structure/values only — no user-visible prose pins.
    /// </summary>
    public sealed class UiToolkitVisualQaDefectTests
    {
        [Test]
        public void Presenter_RequiresBoundHpApMeters_BattleLog_AndSettlementOutcome()
        {
            VisualElement root = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True, "bind must succeed on gameplay tree");

            // Required visual structure for meters + battle log (Design.md §4/§5.2).
            Assert.That(root.Q("battle-hp-meter"), Is.Not.Null, "missing battle-hp-meter");
            Assert.That(root.Q("battle-ap-meter"), Is.Not.Null, "missing battle-ap-meter");
            Assert.That(root.Q("battle-hp-fill"), Is.Not.Null, "missing battle-hp-fill");
            Assert.That(root.Q("battle-ap-fill"), Is.Not.Null, "missing battle-ap-fill");
            Assert.That(root.Q("battle-log"), Is.Not.Null, "missing battle-log");

            // Settlement outcome must be non-empty after settle.
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState s = DriveToResolution(graph, ledger, 90421);
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("n"),
                Kind = CampaignCommandKind.ChooseNegotiate,
            });
            var book = new SettlementBook();
            EncounterResult result = SettlementApi.FromNonCombat(s);
            s = ((SettlementSuccess)SettlementApi.Apply(s, ledger, book, result)).State;
            GameplayUiSnapshot settleSnap = GameplayUiSnapshot.FromCampaign(s, null);
            var codeProp = typeof(GameplayUiSnapshot).GetProperty("SettlementOutcomeCode");
            var textProp = typeof(GameplayUiSnapshot).GetProperty("SettlementOutcomeText");
            Assert.That(codeProp, Is.Not.Null, "SettlementOutcomeCode missing");
            Assert.That(textProp, Is.Not.Null, "SettlementOutcomeText missing");
            Assert.That((string)codeProp.GetValue(settleSnap), Is.Not.Null.And.Not.Empty);
            Assert.That((string)textProp.GetValue(settleSnap), Is.Not.Null.And.Not.Empty);
            presenter.ApplySnapshot(settleSnap);
            Assert.That(root.Q(UiElementNames.RouteRail).ClassListContains("jk-hidden"), Is.False,
                "route must return after combat");
            Label outcome = root.Q<Label>(UiElementNames.SettlementOutcome);
            Assert.That(outcome.text, Is.Not.Null.And.Not.Empty, "settlement-outcome must be bound non-empty");
        }

        [Test]
        public void Presenter_PublicActionSeams_ExistForChoicesAndReturn()
        {
            Type t = typeof(GameplayPresenter);
            Assert.That(t.GetEvent("NegotiateChosen"), Is.Not.Null, "NegotiateChosen event seam missing");
            Assert.That(t.GetEvent("BypassChosen"), Is.Not.Null, "BypassChosen event seam missing");
            Assert.That(t.GetEvent("CombatChosen"), Is.Not.Null, "CombatChosen event seam missing");
            Assert.That(t.GetEvent("ReturnChosen"), Is.Not.Null, "ReturnChosen event seam missing");
            Assert.That(t.GetMethod("TriggerNegotiateForTest"), Is.Not.Null);
            Assert.That(t.GetMethod("TriggerBypassForTest"), Is.Not.Null);
            Assert.That(t.GetMethod("TriggerCombatForTest"), Is.Not.Null);
            Assert.That(t.GetMethod("TriggerReturnForTest"), Is.Not.Null);

            VisualElement root = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True);

            int n = 0, b = 0, c = 0, r = 0;
            void Add(string name, Action inc)
            {
                var ev = t.GetEvent(name);
                var handlerType = ev.EventHandlerType;
                var handler = Delegate.CreateDelegate(handlerType, inc.Target, inc.Method);
                ev.AddEventHandler(presenter, handler);
            }

            // Use dynamic subscribe via reflection-compatible public events once present.
            var negotiate = t.GetEvent("NegotiateChosen");
            // Subscribe with Action via EventInfo
            Action aN = () => n++;
            Action aB = () => b++;
            Action aC = () => c++;
            Action aR = () => r++;
            negotiate.AddEventHandler(presenter, aN);
            t.GetEvent("BypassChosen").AddEventHandler(presenter, aB);
            t.GetEvent("CombatChosen").AddEventHandler(presenter, aC);
            t.GetEvent("ReturnChosen").AddEventHandler(presenter, aR);

            t.GetMethod("TriggerNegotiateForTest").Invoke(presenter, null);
            t.GetMethod("TriggerBypassForTest").Invoke(presenter, null);
            t.GetMethod("TriggerCombatForTest").Invoke(presenter, null);
            t.GetMethod("TriggerReturnForTest").Invoke(presenter, null);

            Assert.That(n, Is.EqualTo(1));
            Assert.That(b, Is.EqualTo(1));
            Assert.That(c, Is.EqualTo(1));
            Assert.That(r, Is.EqualTo(1));
        }

        [Test]
        public void ResponsiveStyles_EnforceDesignSizes_For720And1080()
        {
            string shared = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/UI/Styles/JanseonShared.uss"));
            string gameplay = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/UI/Styles/Gameplay.uss"));

            Assert.That(shared, Does.Contain(".jk-res-720"), "dual-res 720 class missing");
            Assert.That(shared, Does.Contain(".jk-res-1080"), "dual-res 1080 class missing");
            Assert.That(shared, Does.Contain("--route-width: 360px"), "route 360@720 token missing");
            Assert.That(shared, Does.Contain("--hud-width: 280px"), "hud 280@720 token missing");
            Assert.That(shared, Does.Contain("--cell-size: 64px"), "cell 64@720 token missing");
            Assert.That(shared, Does.Contain("--rail-min-height: 64px"), "rail 64@720 token missing");
            Assert.That(shared, Does.Contain("--cell-size: 96px"), "cell 96@1080 token missing");
            Assert.That(shared, Does.Contain("--rail-min-height: 96px"), "rail 96@1080 token missing");
            Assert.That(gameplay, Does.Contain("var(--route-width)"), "route uses token");
            Assert.That(gameplay, Does.Contain("var(--hud-width)"), "hud uses token");
            Assert.That(gameplay, Does.Contain("var(--rail-min-height)"), "rail uses token");
            Assert.That(shared, Does.Contain(".jk-meter"), "jk-meter primitive missing");
            Assert.That(shared, Does.Not.Contain("width: 220px"), "stale route 220 must not remain as source of truth");
            // Hardcoded wrong sizes must not remain as the layout contract.
            Assert.That(gameplay, Does.Not.Contain("width: 220px"));
            Assert.That(gameplay, Does.Not.Contain("width: 200px"));
            Assert.That(shared, Does.Not.Contain("min-height: 48px"));
            Assert.That(shared, Does.Not.Contain("width: 48px"));

            Assert.That(typeof(GameplayPresenter).GetMethod("ApplyResolutionClass"), Is.Not.Null,
                "ApplyResolutionClass missing for dual-resolution path");
        }

        [Test]
        public void ResolutionHelper_AppliesExactlyOneResClass_ToNamedScreenRoots_FromDimensions()
        {
            // Contract: class goes on #main-title-root / #gameplay-root, not a parent container.
            Assert.That(typeof(UiResolutionClass), Is.Not.Null);

            VisualElement titleTree = InstantiateTree(UiScreenPaths.MainTitleUxml, UiScreenPaths.MainTitleUss);
            var titleBag = new VisualElement { name = "capture-container" };
            titleBag.Add(titleTree);
            VisualElement titleRoot = UiResolutionClass.FindScreenRoot(titleBag, UiElementNames.MainTitleRoot);
            Assert.That(titleRoot, Is.Not.Null);
            Assert.That(titleRoot.name, Is.EqualTo(UiElementNames.MainTitleRoot));

            // UXML defaults to jk-res-720; 1080 apply must flip exclusively on the named root.
            UiResolutionClass.Apply(titleBag, UiElementNames.MainTitleRoot, 1920);
            Assert.That(titleRoot.ClassListContains(UiElementNames.Res1080Class), Is.True);
            Assert.That(titleRoot.ClassListContains(UiElementNames.Res720Class), Is.False);
            Assert.That(UiResolutionClass.HasExclusiveResolutionClass(titleBag, UiElementNames.MainTitleRoot), Is.True);
            // Parent container must not be the sole carrier of the resolution class.
            Assert.That(
                titleRoot.ClassListContains(UiElementNames.Res1080Class),
                Is.True,
                "1080 class must land on #main-title-root");

            UiResolutionClass.Apply(titleBag, UiElementNames.MainTitleRoot, 1280);
            Assert.That(titleRoot.ClassListContains(UiElementNames.Res720Class), Is.True);
            Assert.That(titleRoot.ClassListContains(UiElementNames.Res1080Class), Is.False);

            VisualElement gameplayTree = InstantiateTree(UiScreenPaths.GameplayUxml, UiScreenPaths.GameplayUss);
            var gpBag = new VisualElement { name = "gp-container" };
            gpBag.Add(gameplayTree);
            VisualElement gpRoot = UiResolutionClass.Apply(gpBag, UiElementNames.GameplayRoot, 1920);
            Assert.That(gpRoot, Is.Not.Null);
            Assert.That(gpRoot.name, Is.EqualTo(UiElementNames.GameplayRoot));
            Assert.That(gpRoot.ClassListContains(UiElementNames.Res1080Class), Is.True);
            Assert.That(gpRoot.ClassListContains(UiElementNames.Res720Class), Is.False);

            // Production hosts + presenter must call the shared helper (not duplicated capture-only logic).
            string mainHost = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/UI/Presenters/MainTitleUiHost.cs"));
            string gpHost = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/UI/Presenters/GameplayUiHost.cs"));
            string gpPresenter = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/UI/Presenters/GameplayPresenter.cs"));
            Assert.That(mainHost, Does.Contain("UiResolutionClass"),
                "MainTitleUiHost must apply resolution via UiResolutionClass on named root");
            Assert.That(gpHost, Does.Contain("UiResolutionClass"),
                "GameplayUiHost must apply resolution via UiResolutionClass on named root");
            Assert.That(gpPresenter, Does.Contain("UiResolutionClass"),
                "GameplayPresenter.ApplyResolutionClass must delegate to UiResolutionClass");
        }

        [Test]
        public void ProductionHosts_UseScopedUiScreenDocumentLease_AndRejectSecondDocument()
        {
            MethodInfo mainConstruct = typeof(MainTitleUiHost).GetMethod(
                "Construct",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            MethodInfo gpConstruct = typeof(GameplayUiHost).GetMethod(
                "Construct",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            Assert.That(mainConstruct, Is.Not.Null, "MainTitleUiHost.Construct missing");
            Assert.That(gpConstruct, Is.Not.Null, "GameplayUiHost.Construct missing");

            Assert.That(
                Array.Exists(mainConstruct.GetParameters(), p => p.ParameterType == typeof(UiScreenDocumentLease)),
                Is.True,
                "MainTitleUiHost.Construct must inject UiScreenDocumentLease");
            Assert.That(
                Array.Exists(gpConstruct.GetParameters(), p => p.ParameterType == typeof(UiScreenDocumentLease)),
                Is.True,
                "GameplayUiHost.Construct must inject UiScreenDocumentLease");

            string mainScope = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/Composition/MainTitleLifetimeScope.cs"));
            string foundationScope = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/Composition/FoundationLifetimeScope.cs"));
            Assert.That(mainScope, Does.Contain("UiScreenDocumentLease"),
                "MainTitleLifetimeScope must register scoped UiScreenDocumentLease");
            Assert.That(foundationScope, Does.Contain("UiScreenDocumentLease"),
                "FoundationLifetimeScope must register scoped UiScreenDocumentLease");

            // Lease still rejects a second active document (production invariant).
            var lease = new UiScreenDocumentLease();
            Assert.That(lease.TryAttach("main-title-doc"), Is.True);
            Assert.That(lease.TryAttach("second-doc"), Is.False);
            Assert.That(lease.AttachedCount, Is.EqualTo(1));
            lease.Detach();
            Assert.That(lease.TryAttach("gameplay-doc"), Is.True);
        }

        [Test]
        public void MainTitle_StartFocus_UsesVisualElementFocusApi_AndCaptureRequiresFocusRing()
        {
            MethodInfo focusStart = typeof(MainTitlePresenter).GetMethod(
                "FocusStart",
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            Assert.That(focusStart, Is.Not.Null,
                "MainTitlePresenter.FocusStart must exist and drive VisualElement.Focus");

            VisualElement root = InstantiateTree(UiScreenPaths.MainTitleUxml, UiScreenPaths.MainTitleUss);
            var presenter = new MainTitlePresenter(
                new Janseon.Foundation.AppFlow.ApplicationFlowCoordinator(
                    new NullLoader()));
            Assert.That(presenter.BindForTest(root), Is.True);
            Button start = root.Q<Button>(UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null);
            Assert.That(start.focusable, Is.True);

            // Method must call through to the real focus API (source contract).
            string presenterSrc = File.ReadAllText(Path.Combine(Application.dataPath,
                "Janseon/Foundation/UI/Presenters/MainTitlePresenter.cs"));
            Assert.That(presenterSrc, Does.Contain("FocusStart"));
            Assert.That(presenterSrc, Does.Contain(".Focus("));

            string captureSrc = File.ReadAllText(Path.Combine(Application.dataPath,
                "Tests/PlayMode/UiToolkitCapturePlayModeTests.cs"));
            Assert.That(captureSrc, Does.Contain("FocusStart").Or.Contain("main-title-start"),
                "capture must focus main-title-start before capture");
            Assert.That(
                captureSrc.Contains("FocusStart") || captureSrc.Contains(".Focus("),
                Is.True,
                "capture scenario must invoke FocusStart or VisualElement.Focus on Start");

            string validator = File.ReadAllText(Path.GetFullPath(Path.Combine(Application.dataPath,
                "../../tools/unity/validate-ui-captures.mjs")));
            Assert.That(validator, Does.Contain("stroke-focus").Or.Contain("stroke_focus").Or.Contain("C9A227").Or.Contain("focus_ring"),
                "validator must require stroke-focus pixels in the title button region");
        }

        [TestCase(".omo/evidence/gateway-core/receipt.json", true)]
        [TestCase(".omo/plans/core.md", true)]
        [TestCase("./.omo/evidence/capture.png", true)]
        [TestCase(".omo\\evidence\\capture.png", true)]
        [TestCase("Game/Assets/Janseon/Foundation/UI/Gameplay.uxml", false)]
        [TestCase("omo/evidence/source.cs", false)]
        [TestCase("Game/Assets/InitTestScenef26978d6-b24d-47b0-b359-8c334f0ad028.unity", true)]
        [TestCase("Game/Assets/InitTestScenef26978d6-b24d-47b0-b359-8c334f0ad028.unity.meta", true)]
        [TestCase("Game/Assets/Scenes/InitTestScene.unity", false)]
        public void SourceFingerprint_ClassifiesEvidenceWithoutStrippingHiddenDirectoryDot(
            string path, bool excluded)
        {
            Assert.That(UiSourceFingerprint.IsEvidencePath(path), Is.EqualTo(excluded));
        }

        [Test]
        public void SourceFingerprint_StableExcludingEvidence_ChangesOnUiSourceEdit()
        {
            Assert.That(typeof(UiSourceFingerprint), Is.Not.Null);

            string repo = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            // repo is Game/; real git root is parent
            string gitRoot = Path.GetFullPath(Path.Combine(repo, ".."));
            Assert.That(Directory.Exists(Path.Combine(gitRoot, ".git")) || File.Exists(Path.Combine(gitRoot, ".git")),
                Is.True, "git root");

            string before = UiSourceFingerprint.Compute(gitRoot);
            Assert.That(before, Is.Not.Null.And.Not.Empty);
            Assert.That(before.Length, Is.EqualTo(64));

            string evidenceDir = Path.Combine(gitRoot,
                ".omo/evidence/unity-poc-core-loop/task-11-ui-toolkit/captures");
            Directory.CreateDirectory(evidenceDir);
            string evidenceProbe = Path.Combine(evidenceDir, "_fingerprint_probe_red.txt");
            File.WriteAllText(evidenceProbe, Guid.NewGuid().ToString("N"));
            string afterEvidence = UiSourceFingerprint.Compute(gitRoot);
            Assert.That(afterEvidence, Is.EqualTo(before),
                "evidence capture writes must not change source fingerprint");
            File.Delete(evidenceProbe);

            string uiProbe = Path.Combine(gitRoot,
                "Game/Assets/Janseon/Foundation/UI/_fingerprint_probe_ui.txt");
            File.WriteAllText(uiProbe, Guid.NewGuid().ToString("N"));
            try
            {
                string afterUi = UiSourceFingerprint.Compute(gitRoot);
                Assert.That(afterUi, Is.Not.EqualTo(before),
                    "UI source edit must change source fingerprint");
            }
            finally
            {
                if (File.Exists(uiProbe))
                {
                    File.Delete(uiProbe);
                }
            }

            string afterCleanup = UiSourceFingerprint.Compute(gitRoot);
            Assert.That(afterCleanup, Is.EqualTo(before));

            // Capture harness must use the source-only helper (not raw full porcelain).
            string captureSrc = File.ReadAllText(Path.Combine(Application.dataPath,
                "Tests/PlayMode/UiToolkitCapturePlayModeTests.cs"));
            Assert.That(captureSrc, Does.Contain("UiSourceFingerprint"),
                "PlayMode capture receipts must use UiSourceFingerprint");
        }

        /// <summary>Minimal loader so MainTitlePresenter can construct in focus tests.</summary>
        sealed class NullLoader : Janseon.Foundation.AppFlow.IContentSceneLoader
        {
            public System.Threading.Tasks.Task<Janseon.Foundation.AppFlow.IContentSceneLease> LoadAsync(
                Janseon.Foundation.AppFlow.ContentScreenId screen,
                System.Threading.CancellationToken cancellationToken)
                => System.Threading.Tasks.Task.FromException<Janseon.Foundation.AppFlow.IContentSceneLease>(
                    new NotSupportedException());
        }

        [Test]
        public void CaptureReceipts_RequireIsPlayingTrue_Roots_State_Head()
        {
            string capturesDir = Environment.GetEnvironmentVariable("JANSEON_CAPTURE_DIR")
                ?? Path.GetFullPath(Path.Combine(Application.dataPath,
                    "../../.omo/evidence/unity-poc-core-loop/task-11-ui-toolkit/captures"));
            string repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "../.."));
            var git = new System.Diagnostics.ProcessStartInfo("git", "rev-parse HEAD")
            {
                WorkingDirectory = repoRoot,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = System.Diagnostics.Process.Start(git);
            string testedHead = process.StandardOutput.ReadToEnd().Trim();
            process.WaitForExit();
            Assert.That(process.ExitCode, Is.Zero);
            string fingerprint = UiSourceFingerprint.Compute(repoRoot);
            Assert.That(Directory.Exists(capturesDir), Is.True, "captures dir missing");
            string[] receipts = Directory.GetFiles(capturesDir, "*.receipt.json");
            Assert.That(receipts.Length, Is.EqualTo(10), "exactly 10 receipts required");

            foreach (string path in receipts)
            {
                string json = File.ReadAllText(path);
                Assert.That(
                    json.Contains("\"is_playing\": true") || json.Contains("\"is_playing\":true"),
                    Is.True,
                    Path.GetFileName(path) + " must have is_playing=true");
                Assert.That(json, Does.Contain("\"head\":"));
                Assert.That(json, Does.Contain(testedHead));
                Assert.That(json, Does.Contain(fingerprint), "receipt must match current source");
                Assert.That(json, Does.Contain("uidocument_root_names"));
                Assert.That(json, Does.Contain("state_hash"));
                Assert.That(json, Does.Contain("\"state\":"));
            }
        }

        static CampaignState DriveToResolution(RouteGraph graph, Ledger ledger, int seed)
        {
            CampaignState s = CampaignApi.Start(seed, StationId.Yeongdeungpo, "qa-defect");
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("d-" + seed),
                Kind = CampaignCommandKind.Depart,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("t-" + seed),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("e-" + seed),
                Kind = CampaignCommandKind.FaceEncounter,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("r-" + seed),
                Kind = CampaignCommandKind.EnterResolution,
            });
            return s;
        }

        static VisualElement InstantiateTree(string uxmlPath, string ussPath)
        {
            var tree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(uxmlPath);
            Assert.That(tree, Is.Not.Null, "UXML missing: " + uxmlPath);
            VisualElement root = tree.Instantiate();
            var uss = AssetDatabase.LoadAssetAtPath<StyleSheet>(ussPath);
            if (uss != null) root.styleSheets.Add(uss);
            var shared = AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.SharedUss);
            if (shared != null) root.styleSheets.Add(shared);
            return root;
        }
    }
}
