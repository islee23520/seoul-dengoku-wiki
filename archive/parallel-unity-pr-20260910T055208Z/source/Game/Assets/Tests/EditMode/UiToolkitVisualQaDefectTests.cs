using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// RED-first machine contracts for Todo 11 visual QA defects (capture + presentation).
    /// Asserts structure/values only — no user-visible prose pins.
    /// </summary>
    public sealed class UiToolkitVisualQaDefectTests
    {
        [Test]
        public void Presenter_RequiresBoundHpMoraleCards_BattleLog_AndSettlementOutcome()
        {
            RectTransform root = UguiHudBuilder.BuildGameplay(null);
            var presenter = new GameplayPresenter();
            Assert.That(presenter.BindForTest(root), Is.True, "bind must succeed on gameplay canvas");

            // Required visual structure for meters + battle log (Design.md §4/§5.2).
            Assert.That(UguiHudBuilder.Find(root, "battle-hp-meter"), Is.Not.Null, "missing battle-hp-meter");
            Assert.That(UguiHudBuilder.Find(root, "battle-hp-fill"), Is.Not.Null, "missing battle-hp-fill");
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.BattleMorale), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.CardGeneralRecharge), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(root, "battle-ap"), Is.Null);
            Assert.That(UguiHudBuilder.Find(root, "battle-log"), Is.Not.Null, "missing battle-log");

            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState s = DriveToResolution(graph, ledger, 90421);
            object combat = CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("c"),
                Kind = CampaignCommandKind.ChooseCombat,
            });
            var ctx = ((BattleRequired)combat).Context;
            BattleSimState battle = BattleSim.Open(BattleSetup.FromContext(ctx));
            s = (CampaignState)CampaignApi.AttachPendingBattle(s, ledger, ctx, new CommandId("a"));

            GameplayUiSnapshot battleSnap = GameplayUiSnapshot.FromCampaign(s, battle);
            // Snapshot must expose bound meter values (not static labels only).
            var hpProp = typeof(GameplayUiSnapshot).GetProperty("BattleHp");
            var maxHpProp = typeof(GameplayUiSnapshot).GetProperty("BattleMaxHp");
            var logProp = typeof(GameplayUiSnapshot).GetProperty("BattleLogEntries");
            Assert.That(hpProp, Is.Not.Null, "GameplayUiSnapshot.BattleHp missing");
            Assert.That(maxHpProp, Is.Not.Null, "GameplayUiSnapshot.BattleMaxHp missing");
            Assert.That(logProp, Is.Not.Null, "GameplayUiSnapshot.BattleLogEntries missing");
            int battleHp = (int)hpProp.GetValue(battleSnap);
            int battleMaxHp = (int)maxHpProp.GetValue(battleSnap);
            var logEntries = logProp.GetValue(battleSnap) as System.Collections.ICollection;
            Assert.That(battleMaxHp, Is.GreaterThan(0));
            Assert.That(battleHp, Is.GreaterThan(0));
            Assert.That(logEntries, Is.Not.Null);
            Assert.That(logEntries.Count, Is.GreaterThan(0));

            presenter.ApplySnapshot(battleSnap);
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.RouteRail).gameObject.activeSelf, Is.False,
                "battle must hide the route rail");
            Text hp = UguiHudBuilder.Find(root, UiElementNames.BattleHp).GetComponentInChildren<Text>(true);
            Text morale = UguiHudBuilder.Find(root, UiElementNames.BattleMorale).GetComponentInChildren<Text>(true);
            Assert.That(hp.text, Does.Contain(battleHp.ToString()), "HP label must show bound value");
            Assert.That(morale.text, Does.Contain(battle.Sides[0].Morale.ToString()));

            RectTransform hpFill = UguiHudBuilder.Find(root, "battle-hp-fill") as RectTransform;
            Assert.That(hpFill, Is.Not.Null, "missing battle-hp-fill");
            Assert.That(hpFill.anchorMax.x, Is.GreaterThan(0f), "hp fill must be painted");
            Text battleLogText = UguiHudBuilder.Find(root, UiElementNames.BattleLog).GetComponentInChildren<Text>(true);
            Assert.That(battleLogText.text, Is.Not.Empty, "battle log entries not bound");

            // Settlement outcome must be non-empty after settle.
            s = DriveToResolution(graph, new Ledger(), 90421);
            ledger = new Ledger();
            s = DriveToResolution(graph, ledger, 90422);
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
            Assert.That(UguiHudBuilder.Find(root, UiElementNames.RouteRail).gameObject.activeSelf, Is.True,
                "route must return after combat");
            Text outcome = UguiHudBuilder.Find(root, UiElementNames.SettlementOutcome).GetComponentInChildren<Text>(true);
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

            RectTransform root = UguiHudBuilder.BuildGameplay(null);
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
        public void CanvasScalers_EnforceDesignSizes_For720And1080()
        {
            // uGUI contract: CanvasScaler owns resolution on both screens.
            RectTransform title = UguiHudBuilder.BuildMainTitle(null);
            RectTransform gameplay = UguiHudBuilder.BuildGameplay(null);
            foreach (var rt in new[] { title, gameplay })
            {
                var canvas = rt.GetComponentInParent<Canvas>();
                Assert.That(canvas, Is.Not.Null, rt.name + " must render on a Canvas");
                var scaler = canvas.GetComponent<CanvasScaler>();
                Assert.That(scaler, Is.Not.Null);
                Assert.That(scaler.uiScaleMode, Is.EqualTo(CanvasScaler.ScaleMode.ScaleWithScreenSize));
                Assert.That(scaler.referenceResolution, Is.EqualTo(new Vector2(1280f, 720f)));
            }

        }


        [Test]
                public void ResolutionHelper_MainTitleCanvas_UsesScalerForResolution()
        {
            // uGUI contract: resolution is handled by CanvasScaler on the screen canvas,
            // not by swapping classes on the root.
            RectTransform root = UguiHudBuilder.BuildMainTitle(null);
            Canvas canvas = root.GetComponentInParent<Canvas>();
            Assert.That(canvas, Is.Not.Null, "MainTitle must render on a Canvas");

            var scaler = canvas.GetComponent<CanvasScaler>();
            Assert.That(scaler, Is.Not.Null, "MainTitle canvas must have a CanvasScaler");
            Assert.That(scaler.uiScaleMode, Is.EqualTo(CanvasScaler.ScaleMode.ScaleWithScreenSize));
            Assert.That(scaler.referenceResolution, Is.EqualTo(new Vector2(1280f, 720f)));

            string builderSrc = File.ReadAllText(Path.Combine(Application.dataPath.Replace("/Assets", string.Empty),
                "Assets/Janseon/Foundation/UI/UguiHudBuilder.cs"));
            Assert.That(builderSrc, Does.Contain("CanvasScaler"),
                "UguiHudBuilder must own the resolution contract via CanvasScaler");
        }

        [Test]
        public void ProductionCanvasHosts_UseScopedScreenLease_AndRejectSecondScreen()
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

            // Lease still rejects a second active Canvas screen (production invariant).
            var lease = new UiScreenDocumentLease();
            Assert.That(lease.TryAttach("main-title-doc"), Is.True);
            Assert.That(lease.TryAttach("second-doc"), Is.False);
            Assert.That(lease.AttachedCount, Is.EqualTo(1));
            lease.Detach();
            Assert.That(lease.TryAttach("gameplay-doc"), Is.True);
        }

        [Test]
        public void MainTitle_StartFocus_UsesEventSystemSelection_AndPresenterSource()
        {
            string presenterSrc = File.ReadAllText(Path.Combine(Application.dataPath.Replace("/Assets", string.Empty),
                "Assets/Janseon/Foundation/UI/Presenters/MainTitlePresenter.cs"));
            Assert.That(presenterSrc, Does.Contain("FocusStart"), "presenter must expose FocusStart");
            Assert.That(presenterSrc, Does.Contain("SetSelectedGameObject"),
                "focus must go through uGUI EventSystem selection");

            var presenter = new MainTitlePresenter(new ApplicationFlowCoordinator(new NullLoader()));
            RectTransform root = UguiHudBuilder.BuildMainTitle(null);
            Assert.That(presenter.BindForTest(root), Is.True, "presenter must bind MainTitle canvas");
            Assert.That(presenter.FocusStart(), Is.True, "FocusStart must focus main-title-start");

            var start = UguiHudBuilder.ButtonNamed(root, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null);
            Assert.That(UguiHudBuilder.LastEnsuredEventSystem.currentSelectedGameObject,
                Is.EqualTo(start.gameObject), "main-title-start must be the selected uGUI object");
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
                    "../../.omo/evidence/poc-ugui-v4-runtime/captures"));
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

    }
}
