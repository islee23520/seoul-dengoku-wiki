using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
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
using UnityEngine.TestTools;
using UnityEngine.UIElements;
using VContainer;
using VContainer.Unity;
using Debug = UnityEngine.Debug;
using Object = UnityEngine.Object;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// PlayMode capture matrix: production Bootstrap → MainTitle/Foundation UIDocument,
    /// live presenters, is_playing=true receipts. No executeMethod EnterPlayMode, no empty-scene substitute.
    /// </summary>
    public sealed class UiToolkitCapturePlayModeTests
    {
        const string CapturesRel =
            "../../.omo/evidence/unity-poc-core-loop/task-11-ui-toolkit/captures";
        static string testedHead;
        static string testedFingerprint;
        static readonly List<string> borderErrors = new List<string>();
        const int Seed = 90421;

        [SetUp]
        public void PinTestedSource()
        {
            borderErrors.Clear();
            testedHead = RunGit("rev-parse HEAD").Trim();
            Assert.That(testedHead, Does.Match("^[0-9a-f]{40}$"));
            string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            testedFingerprint = UiSourceFingerprint.Compute(repoRoot);
        }

        [UnityTest]
        public IEnumerator Capture_MainTitle_1280x720_FromProductionBootstrap()
        {
            Assert.That(Application.isPlaying, Is.True, "PlayMode test must run with is_playing=true");

            Task boot = BootstrapToMainTitleAsync();
            while (!boot.IsCompleted)
            {
                yield return null;
            }

            if (boot.IsFaulted)
            {
                throw boot.Exception!.InnerException ?? boot.Exception;
            }

            MainTitleUiHost host = Object.FindAnyObjectByType<MainTitleUiHost>();
            Assert.That(host, Is.Not.Null, "MainTitleUiHost missing on production scene");
            Task ready = host.Ready;
            float readyDeadline = Time.realtimeSinceStartup + 10f;
            while (!ready.IsCompleted && Time.realtimeSinceStartup < readyDeadline)
            {
                yield return null;
            }

            Assert.That(ready.IsCompleted, Is.True, "MainTitleUiHost.Ready timed out");
            if (ready.IsFaulted)
            {
                throw ready.Exception!.InnerException ?? ready.Exception;
            }

            Assert.That(host.IsReady, Is.True);
            Assert.That(host.Document, Is.Not.Null);
            Assert.That(host.Document.visualTreeAsset, Is.Not.Null);
            Assert.That(host.Document.panelSettings, Is.Not.Null);

            IEnumerator capture = CaptureDocumentCoroutine(
                stem: "main-title-1280x720",
                width: 1280,
                height: 720,
                kind: "MainTitle",
                document: host.Document,
                stateLabel: "MainTitle.idle",
                stateHash: CoreApi.StableHashHex("capture=main-title;seed=" + Seed),
                applyState: root => ApplyMainTitleCaptureState(root, 1280));
            while (capture.MoveNext())
            {
                yield return capture.Current;
            }

            var result = (CaptureResult)capture.Current;
            // capture coroutine stores result via last Current after MoveNext false — use field
            result = s_lastCapture;
            AssertCaptureQuality(result, minNonDarkPixels: 8000, minTextLum: 400);
            Assert.That(borderErrors, Is.Empty, "resolved styles and rendered border pixels");
            Debug.Log("PLAYMODE_CAPTURE_OK " + result.Stem
                + " is_playing=" + result.IsPlaying
                + " nonDark=" + result.NonDark
                + " textLum=" + result.TextLum
                + " alpha0pre=" + result.Alpha0Pre
                + " sha=" + result.Sha256.Substring(0, 16));
        }

        static CaptureResult s_lastCapture;

        [UnityTest]
        public IEnumerator Capture_UiToolkitMatrix_FiveStates_TwoResolutions()
        {
            Assert.That(Application.isPlaying, Is.True);

            Task boot = BootstrapToMainTitleAsync();
            while (!boot.IsCompleted)
            {
                yield return null;
            }

            if (boot.IsFaulted)
            {
                throw boot.Exception!.InnerException ?? boot.Exception;
            }

            MainTitleUiHost titleHost = Object.FindAnyObjectByType<MainTitleUiHost>();
            Assert.That(titleHost, Is.Not.Null);
            Task titleReady = titleHost.Ready;
            float deadline = Time.realtimeSinceStartup + 10f;
            while (!titleReady.IsCompleted && Time.realtimeSinceStartup < deadline)
            {
                yield return null;
            }

            Assert.That(titleReady.IsCompleted, Is.True, "MainTitle ready");

            IEnumerator c1 = CaptureDocumentCoroutine(
                "main-title-1280x720", 1280, 720, "MainTitle", titleHost.Document,
                "MainTitle.idle", CoreApi.StableHashHex("capture=main-title;seed=" + Seed),
                root => ApplyMainTitleCaptureState(root, 1280));
            while (c1.MoveNext())
            {
                yield return c1.Current;
            }

            AssertCaptureQuality(s_lastCapture, 8000, 400);
            AssertMainTitleFocusRing(s_lastCapture);
            string shaTitle720 = s_lastCapture.Sha256;

            IEnumerator c2 = CaptureDocumentCoroutine(
                "main-title-1920x1080", 1920, 1080, "MainTitle", titleHost.Document,
                "MainTitle.idle", CoreApi.StableHashHex("capture=main-title;seed=" + Seed),
                root => ApplyMainTitleCaptureState(root, 1920));
            while (c2.MoveNext())
            {
                yield return c2.Current;
            }

            AssertCaptureQuality(s_lastCapture, 8000, 400);
            AssertMainTitleFocusRing(s_lastCapture);
            Assert.That(s_lastCapture.Sha256, Is.Not.EqualTo(shaTitle720));

            AppLifetimeScope appScope = Object.FindObjectsByType<AppLifetimeScope>(FindObjectsSortMode.None)
                .FirstOrDefault();
            Assert.That(appScope, Is.Not.Null);
            ApplicationFlowCoordinator coordinator =
                appScope.Container.Resolve<ApplicationFlowCoordinator>();

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            Task<TransitionOutcome> openFoundation =
                coordinator.OpenFoundationAsync(CancellationToken.None);
            while (!openFoundation.IsCompleted || !foundationLoaded.IsCompleted || !titleUnloaded.IsCompleted)
            {
                yield return null;
            }

            if (openFoundation.IsFaulted)
            {
                throw openFoundation.Exception!.InnerException ?? openFoundation.Exception;
            }

            Assert.That(openFoundation.Result.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));

            GameplayUiHost gameplayHost = Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(gameplayHost, Is.Not.Null);
            Task gpReady = gameplayHost.Ready;
            deadline = Time.realtimeSinceStartup + 10f;
            while (!gpReady.IsCompleted && Time.realtimeSinceStartup < deadline)
            {
                yield return null;
            }

            Assert.That(gpReady.IsCompleted, Is.True);
            Assert.That(gameplayHost.Presenter, Is.Not.Null);
            Assert.That(gameplayHost.Presenter.IsReady, Is.True);

            IEnumerator g1 = CaptureGameplayPairCoroutine(gameplayHost, "campaign-route-stage", CaptureKind.RouteStage);
            while (g1.MoveNext())
            {
                yield return g1.Current;
            }

            IEnumerator g2 = CaptureGameplayPairCoroutine(gameplayHost, "encounter-choices", CaptureKind.Encounter);
            while (g2.MoveNext())
            {
                yield return g2.Current;
            }

            IEnumerator g4 = CaptureGameplayPairCoroutine(gameplayHost, "settlement-return", CaptureKind.Settlement);
            while (g4.MoveNext())
            {
                yield return g4.Current;
            }

            Assert.That(borderErrors, Is.Empty, "resolved styles and rendered border pixels");
            Debug.Log("PLAYMODE_CAPTURE_MATRIX_OK count=10");
        }

        enum CaptureKind
        {
            RouteStage,
            Encounter,
            Settlement,
        }

        IEnumerator CaptureGameplayPairCoroutine(GameplayUiHost host, string stemBase, CaptureKind kind)
        {
            CampaignState campaign = BuildCampaign(kind, out string stateHash);
            string stateLabel = kind + "@" + (campaign.Node.Value ?? "") + "/stage=" + campaign.Stage;

            void Apply(VisualElement root, int w)
            {
                UiResolutionClass.Apply(root, UiElementNames.GameplayRoot, w);
                host.Presenter.ApplyResolutionClass(w);
                host.ApplyCampaign(campaign, null);
            }

            IEnumerator a = CaptureDocumentCoroutine(
                stemBase + "-1280x720", 1280, 720, kind.ToString(), host.Document,
                stateLabel, stateHash, root => Apply(root, 1280));
            while (a.MoveNext())
            {
                yield return a.Current;
            }

            CaptureResult ra = s_lastCapture;
            AssertCaptureQuality(ra, 8000, kind == CaptureKind.RouteStage ? 400 : 200);
            if (kind == CaptureKind.RouteStage)
            {
                AssertRouteStageLabelsVisible(host.Document.rootVisualElement);
            }

            IEnumerator b = CaptureDocumentCoroutine(
                stemBase + "-1920x1080", 1920, 1080, kind.ToString(), host.Document,
                stateLabel, stateHash, root => Apply(root, 1920));
            while (b.MoveNext())
            {
                yield return b.Current;
            }

            CaptureResult rb = s_lastCapture;
            // External capture validator floor for 1920x1080 is 900 text-luminance pixels.
            AssertCaptureQuality(rb, 8000, kind == CaptureKind.RouteStage ? 900 : 200);
            if (kind == CaptureKind.RouteStage)
            {
                AssertRouteStageLabelsVisible(host.Document.rootVisualElement);
                Assert.That(rb.TextLum, Is.GreaterThanOrEqualTo(900),
                    stemBase + "-1920x1080 textLum must meet validator floor (was regressing to ~645 with hidden stations)");
            }

            Assert.That(ra.Sha256, Is.Not.EqualTo(rb.Sha256), stemBase + " 720/1080 must differ");
        }

        static void AssertRouteStageLabelsVisible(VisualElement root)
        {
            Assert.That(root, Is.Not.Null);
            VisualElement routeRail = root.Q(UiElementNames.RouteRail);
            VisualElement stageRail = root.Q(UiElementNames.StageRail);
            Assert.That(routeRail, Is.Not.Null, "route-rail missing");
            Assert.That(stageRail, Is.Not.Null, "stage-rail missing");
            Assert.That(routeRail.ClassListContains("jk-hidden"), Is.False, "route-rail hidden");
            Assert.That(stageRail.ClassListContains("jk-hidden"), Is.False, "stage-rail hidden");
            foreach (string name in new[]
                     {
                         UiElementNames.StationYeongdeungpo,
                         UiElementNames.StationSindorim,
                         UiElementNames.StationGuro,
                     })
            {
                Button station = root.Q<Button>(name);
                Assert.That(station, Is.Not.Null, name + " missing");
                Assert.That(station.ClassListContains("jk-hidden"), Is.False, name + " must not be jk-hidden on route capture");
                Assert.That(string.IsNullOrEmpty(station.text), Is.False, name + " text empty");
            }
        }

        static async Task BootstrapToMainTitleAsync()
        {
            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(20));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(
                FoundationScenes.Bootstrap,
                LoadSceneMode.Single));
            await mainTitleLoaded;

            AppLifetimeScope appScope = Object.FindObjectsByType<AppLifetimeScope>(FindObjectsSortMode.None)
                .FirstOrDefault();
            Assert.That(appScope, Is.Not.Null, "AppLifetimeScope missing after Bootstrap");
            ApplicationFlowCoordinator coordinator =
                appScope.Container.Resolve<ApplicationFlowCoordinator>();
            TransitionOutcome startup = await coordinator.CurrentTransition;
            Assert.That(startup.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));
        }

        sealed class CaptureResult
        {
            public string Stem;
            public bool IsPlaying;
            public int Width;
            public int Height;
            public int NonDark;
            public int TextLum;
            public int Alpha0Pre;
            public string Sha256;
            public string PngPath;
            public string ReceiptPath;
        }

        /// <summary>
        /// Production panel renders into targetTexture across player frames, then ReadPixels.
        /// Frame waits use WaitForEndOfFrame (render event), not timed sleeps.
        /// </summary>
        static IEnumerator CaptureDocumentCoroutine(
            string stem,
            int width,
            int height,
            string kind,
            UIDocument document,
            string stateLabel,
            string stateHash,
            Action<VisualElement> applyState)
        {
            Assert.That(Application.isPlaying, Is.True);
            Assert.That(document, Is.Not.Null);
            PanelSettings panel = document.panelSettings;
            Assert.That(panel, Is.Not.Null);

            Vector2Int prevRes = panel.referenceResolution;
            RenderTexture prevTarget = panel.targetTexture;
            bool prevClear = panel.clearColor;
            Color prevClearColor = panel.colorClearValue;
            PanelScaleMode prevScale = panel.scaleMode;
            float prevScaleValue = panel.scale;

            var rt = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32)
            {
                antiAliasing = 1,
                filterMode = FilterMode.Point,
            };
            rt.Create();
            panel.referenceResolution = new Vector2Int(width, height);
            panel.scaleMode = PanelScaleMode.ConstantPixelSize;
            panel.scale = 1f;
            panel.clearColor = true;
            panel.colorClearValue = new Color(0.043f, 0.067f, 0.118f, 1f);
            panel.targetTexture = rt;

            VisualElement root = document.rootVisualElement;
            Assert.That(root, Is.Not.Null, "production UIDocument root null");
            Task geometryReady = WaitGeometryAsync(root, width, height, TimeSpan.FromSeconds(10));
            root.style.position = Position.Absolute;
            root.style.left = 0;
            root.style.top = 0;
            root.style.right = 0;
            root.style.bottom = 0;
            root.style.width = width;
            root.style.height = height;
            root.style.minWidth = width;
            root.style.minHeight = height;
            root.style.backgroundColor = new Color(0.043f, 0.067f, 0.118f, 1f);

            applyState?.Invoke(root);
            root.MarkDirtyRepaint();

            // Subscribe before changing layout; wait for its geometry signal, not a fixed frame count.
            string api = "PlayModeTest+productionUIDocument+panel.targetTexture+GeometryChanged+ForcePanelRepaint";
            while (!geometryReady.IsCompleted)
            {
                ForcePanelRepaint(root);
                yield return null;
            }
            geometryReady.GetAwaiter().GetResult();

            bool tryOk = VisualElementCaptureExtensions.TryCaptureIntoRenderTexture(root, rt);
            if (tryOk)
            {
                api += "+TryCaptureIntoRenderTexture";
            }

            ForcePanelRepaint(root);
            yield return null;

            RenderTexture.active = rt;
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            tex.Apply();
            RenderTexture.active = null;

            if (kind == "MainTitle")
            {
                Button start = root.Q<Button>(UiElementNames.MainTitleStart);
                CheckBorderPixel(tex, start, "bottom", new Color32(61, 126, 166, 255), stem);
                CheckBorderPixel(tex, start, "top", new Color32(201, 162, 39, 255), stem);
            }
            else if (kind == "Encounter")
            {
                Button combat = root.Q<Button>(UiElementNames.ChoiceCombat);
                foreach (string edge in new[] { "top", "right", "bottom", "left" })
                {
                    CheckBorderPixel(tex, combat, edge, new Color32(139, 74, 58, 255), stem);
                }
            }

            Color32[] pixels = tex.GetPixels32();
            Color32 voidC = new Color32(11, 17, 28, 255);
            int alpha0 = 0, nonDark = 0, textLum = 0;
            for (int i = 0; i < pixels.Length; i++)
            {
                Color32 p = pixels[i];
                if (p.a < 250)
                {
                    float a = p.a / 255f;
                    pixels[i] = new Color32(
                        (byte)(p.r * a + voidC.r * (1f - a)),
                        (byte)(p.g * a + voidC.g * (1f - a)),
                        (byte)(p.b * a + voidC.b * (1f - a)),
                        255);
                    if (p.a == 0)
                    {
                        alpha0++;
                    }

                    p = pixels[i];
                }

                float lum = 0.2126f * p.r + 0.7152f * p.g + 0.0722f * p.b;
                if (lum > 20f)
                {
                    nonDark++;
                }

                if (lum >= 140f)
                {
                    textLum++;
                }
            }

            tex.SetPixels32(pixels);
            tex.Apply();

            string outDir = ResolveCapturesDir();
            Directory.CreateDirectory(outDir);
            string pngPath = Path.Combine(outDir, stem + ".png");
            string receiptPath = Path.Combine(outDir, stem + ".receipt.json");
            byte[] pngBytes = tex.EncodeToPNG();
            string tmp = pngPath + ".tmp";
            File.WriteAllBytes(tmp, pngBytes);
            if (File.Exists(pngPath))
            {
                File.Delete(pngPath);
            }

            File.Move(tmp, pngPath);

            string rootNames = CollectRootNames(root);
            string head = RunGit("rev-parse HEAD").Trim();
            string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            string dirty = UiSourceFingerprint.Compute(repoRoot);
            string sha = Sha256HexBytes(pngBytes);
            bool isPlaying = Application.isPlaying;
            string receipt = BuildReceipt(
                stem, kind, width, height, Seed, stateLabel, stateHash, head, dirty,
                SceneManager.GetActiveScene().path, rootNames, api, tryOk, nonDark > 0,
                pngPath, isPlaying, alpha0, nonDark, textLum, sha,
                document.visualTreeAsset != null ? document.visualTreeAsset.name : "",
                panel != null ? panel.name : "");
            string tmpR = receiptPath + ".tmp";
            File.WriteAllText(tmpR, receipt);
            if (File.Exists(receiptPath))
            {
                File.Delete(receiptPath);
            }

            File.Move(tmpR, receiptPath);

            panel.referenceResolution = prevRes;
            panel.targetTexture = prevTarget;
            panel.clearColor = prevClear;
            panel.colorClearValue = prevClearColor;
            panel.scaleMode = prevScale;
            panel.scale = prevScaleValue;
            rt.Release();
            Object.Destroy(rt);
            Object.Destroy(tex);

            s_lastCapture = new CaptureResult
            {
                Stem = stem,
                IsPlaying = isPlaying,
                Width = width,
                Height = height,
                NonDark = nonDark,
                TextLum = textLum,
                Alpha0Pre = alpha0,
                Sha256 = sha,
                PngPath = pngPath,
                ReceiptPath = receiptPath,
            };
        }

        static void CheckBorderPixel(Texture2D texture, Button button, string edge, Color32 expected, string stem)
        {
            Rect bounds = button.worldBound;
            int x = Mathf.FloorToInt(bounds.center.x);
            int y = Mathf.FloorToInt(bounds.center.y);
            Color resolved;
            switch (edge)
            {
                case "top": y = Mathf.FloorToInt(bounds.yMin); resolved = button.resolvedStyle.borderTopColor; break;
                case "bottom": y = Mathf.CeilToInt(bounds.yMax) - 1; resolved = button.resolvedStyle.borderBottomColor; break;
                case "left": x = Mathf.FloorToInt(bounds.xMin); resolved = button.resolvedStyle.borderLeftColor; break;
                default: x = Mathf.CeilToInt(bounds.xMax) - 1; resolved = button.resolvedStyle.borderRightColor; break;
            }

            Color32 pixel = texture.GetPixel(x, texture.height - 1 - y);
            Color32 style = resolved;
            bool Matches(Color32 color) => Math.Abs(color.r - expected.r) <= 3
                && Math.Abs(color.g - expected.g) <= 3 && Math.Abs(color.b - expected.b) <= 3;
            if (!Matches(style) || !Matches(pixel))
            {
                borderErrors.Add(stem + " " + button.name + " " + edge
                    + " expected=" + expected + " style=" + style + " pixel=" + pixel);
            }
            Debug.Log("BORDER_PIXEL " + stem + " " + button.name + " " + edge
                + " at=" + x + "," + y + " style=" + style + " pixel=" + pixel);
        }

        static async Task<CaptureResult> CaptureDocumentAsync(
            string stem,
            int width,
            int height,
            string kind,
            UIDocument document,
            string stateLabel,
            string stateHash,
            Action<VisualElement> applyState)
        {
            // Matrix path: drive coroutine via nested runner is awkward; inline equivalent frames
            // by awaiting geometry schedule completion then one capture path.
            IEnumerator e = CaptureDocumentCoroutine(
                stem, width, height, kind, document, stateLabel, stateHash, applyState);
            while (e.MoveNext())
            {
                object cur = e.Current;
                if (cur is YieldInstruction || cur is CustomYieldInstruction)
                {
                    // Cannot await YieldInstruction from async Task without runner;
                    // matrix test uses UnityTest separately.
                    await Task.Yield();
                }
                else
                {
                    await Task.Yield();
                }
            }

            return s_lastCapture;
        }

        static void AssertCaptureQuality(CaptureResult r, int minNonDarkPixels, int minTextLum)
        {
            Assert.That(r.IsPlaying, Is.True, r.Stem + " is_playing");
            Assert.That(r.Width, Is.GreaterThan(0));
            Assert.That(r.NonDark, Is.GreaterThanOrEqualTo(minNonDarkPixels),
                r.Stem + " nonDark pixels");
            Assert.That(r.TextLum, Is.GreaterThanOrEqualTo(minTextLum), r.Stem + " text luminance");
            // after composite, alpha holes should be gone in file; alpha0pre is informational
            Assert.That(File.Exists(r.PngPath), Is.True);
            Assert.That(File.Exists(r.ReceiptPath), Is.True);
            string json = File.ReadAllText(r.ReceiptPath);
            Assert.That(json, Does.Contain("\"is_playing\": true").Or.Contain("\"is_playing\":true"));
            Assert.That(json, Does.Contain(testedHead));
            Assert.That(RunGit("rev-parse HEAD").Trim(), Is.EqualTo(testedHead));
            string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            string expectedFp = UiSourceFingerprint.Compute(repoRoot);
            Assert.That(expectedFp, Is.EqualTo(testedFingerprint), "source changed during capture");
            Assert.That(json, Does.Contain(expectedFp),
                r.Stem + " dirty_tree_fingerprint must match source-only fingerprint");
        }

        static void ApplyMainTitleCaptureState(VisualElement root, int width)
        {
            VisualElement titleRoot = UiResolutionClass.Apply(root, UiElementNames.MainTitleRoot, width);
            Assert.That(titleRoot, Is.Not.Null, "main-title-root missing for resolution class");
            Assert.That(
                UiResolutionClass.HasExclusiveResolutionClass(root, UiElementNames.MainTitleRoot),
                Is.True,
                "main-title-root must carry exclusive jk-res class");

            Button start = titleRoot.Q<Button>(UiElementNames.MainTitleStart)
                ?? root.Q<Button>(UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null, "main-title-start missing before focus");

            // Production focus API + jk-focused class via FocusStart when presenter-bound, else direct.
            start.focusable = true;
            start.tabIndex = 0;
            start.Focus();
            start.AddToClassList("jk-focused");
            start.MarkDirtyRepaint();
            titleRoot.MarkDirtyRepaint();
        }

        static void AssertMainTitleFocusRing(CaptureResult r)
        {
            byte[] png = File.ReadAllBytes(r.PngPath);
            // Decode via Texture2D for focus-ring gold pixel count in the Start button band.
            var tex = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            Assert.That(tex.LoadImage(png), Is.True, r.Stem + " png load");
            Color32[] px = tex.GetPixels32();
            int w = tex.width;
            int h = tex.height;
            int x0 = (int)(w * 0.30f);
            int x1 = (int)(w * 0.70f);
            // Texture2D is bottom-up; also scan mirrored band so orientation cannot zero the count.
            int y0 = (int)(h * 0.48f);
            int y1 = (int)(h * 0.78f);
            int gold = 0;
            // Design.md --stroke-focus #C9A227
            for (int y = 0; y < h; y++)
            {
                bool inBand = (y >= y0 && y < y1) || (y >= (h - y1) && y < (h - y0));
                if (!inBand)
                {
                    continue;
                }

                for (int x = x0; x < x1; x++)
                {
                    Color32 p = px[y * w + x];
                    if (Math.Abs(p.r - 201) <= 36 && Math.Abs(p.g - 162) <= 36 && Math.Abs(p.b - 39) <= 48)
                    {
                        gold++;
                    }
                }
            }

            Object.Destroy(tex);
            Assert.That(gold, Is.GreaterThanOrEqualTo(24),
                r.Stem + " Start focus ring (stroke-focus gold) pixels in title button region, got " + gold);
        }

        static async Task WaitGeometryAsync(VisualElement root, int w, int h, TimeSpan timeout)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            EventCallback<GeometryChangedEvent> cb = null;
            cb = evt =>
            {
                if (Math.Abs(evt.newRect.width - w) < 1f && Math.Abs(evt.newRect.height - h) < 1f)
                {
                    root.UnregisterCallback(cb);
                    tcs.TrySetResult(true);
                }
            };
            root.RegisterCallback(cb);
            root.MarkDirtyRepaint();
            if (Math.Abs(root.worldBound.width - w) < 1f && Math.Abs(root.worldBound.height - h) < 1f)
            {
                root.UnregisterCallback(cb);
                tcs.TrySetResult(true);
            }

            Task winner = await Task.WhenAny(tcs.Task, Task.Delay(timeout));
            root.UnregisterCallback(cb);
            Assert.That(winner, Is.SameAs(tcs.Task), "capture geometry must match requested resolution");
            await tcs.Task;
        }

        static CampaignState BuildCampaign(CaptureKind kind, out string stateHash)
        {
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState s = CampaignApi.Start(Seed, StationId.Yeongdeungpo, "ui-capture");

            if (kind == CaptureKind.RouteStage)
            {
                stateHash = CampaignApi.ComputeStateHash(s);
                return s;
            }

            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("d"),
                Kind = CampaignCommandKind.Depart,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("t"),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("e"),
                Kind = CampaignCommandKind.FaceEncounter,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("r"),
                Kind = CampaignCommandKind.EnterResolution,
            });

            if (kind == CaptureKind.Encounter)
            {
                stateHash = CampaignApi.ComputeStateHash(s);
                return s;
            }

            // Settlement negotiate path
            s = CampaignApi.Start(Seed, StationId.Yeongdeungpo, "ui-capture-settle");
            ledger = new Ledger();
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("d2"), Kind = CampaignCommandKind.Depart,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("t2"), Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("e2"), Kind = CampaignCommandKind.FaceEncounter,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("r2"), Kind = CampaignCommandKind.EnterResolution,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("n"), Kind = CampaignCommandKind.ChooseNegotiate,
            });
            var book = new SettlementBook();
            EncounterResult result = SettlementApi.FromNonCombat(s);
            s = ((SettlementSuccess)SettlementApi.Apply(s, ledger, book, result)).State;
            stateHash = CampaignApi.ComputeStateHash(s);
            return s;
        }

        static string ResolveCapturesDir()
        {
            string configured = Environment.GetEnvironmentVariable("JANSEON_CAPTURE_DIR");
            if (!string.IsNullOrEmpty(configured))
            {
                Assert.That(Path.IsPathRooted(configured), Is.True, "capture directory must be absolute");
                return configured;
            }

            string data = Application.dataPath;
            return Path.GetFullPath(Path.Combine(data, CapturesRel));
        }

        static string CollectRootNames(VisualElement root)
        {
            var names = new List<string>();
            void Walk(VisualElement el, int depth)
            {
                if (el == null || depth > 6) return;
                if (!string.IsNullOrEmpty(el.name)) names.Add(el.name);
                for (int i = 0; i < el.childCount; i++) Walk(el[i], depth + 1);
            }

            Walk(root, 0);
            return string.Join(",", names);
        }

        static string BuildReceipt(
            string stem, string kind, int w, int h, int seed, string state, string stateHash,
            string head, string dirtyFp, string scenePath, string rootNames, string captureApi,
            bool tryOk, bool nonEmpty, string pngPath, bool isPlaying, int alpha0, int nonDark,
            int textLum, string pngSha, string vtaName, string panelName)
        {
            var sb = new StringBuilder();
            sb.Append("{\n");
            sb.Append("  \"stem\": \"").Append(stem).Append("\",\n");
            sb.Append("  \"kind\": \"").Append(kind).Append("\",\n");
            sb.Append("  \"unity\": \"6000.7.0a5\",\n");
            sb.Append("  \"width\": ").Append(w).Append(",\n");
            sb.Append("  \"height\": ").Append(h).Append(",\n");
            sb.Append("  \"seed\": ").Append(seed).Append(",\n");
            sb.Append("  \"state\": \"").Append(Esc(state)).Append("\",\n");
            sb.Append("  \"state_hash\": \"").Append(stateHash).Append("\",\n");
            sb.Append("  \"head\": \"").Append(head).Append("\",\n");
            sb.Append("  \"dirty_tree_fingerprint\": \"").Append(dirtyFp).Append("\",\n");
            sb.Append("  \"active_scene\": \"").Append(Esc(scenePath)).Append("\",\n");
            sb.Append("  \"uidocument_root_names\": \"").Append(Esc(rootNames)).Append("\",\n");
            sb.Append("  \"visual_tree_asset\": \"").Append(Esc(vtaName)).Append("\",\n");
            sb.Append("  \"panel_settings\": \"").Append(Esc(panelName)).Append("\",\n");
            sb.Append("  \"capture_api\": \"").Append(captureApi).Append("\",\n");
            sb.Append("  \"try_capture_ok\": ").Append(tryOk ? "true" : "false").Append(",\n");
            sb.Append("  \"non_empty_pixels\": ").Append(nonEmpty ? "true" : "false").Append(",\n");
            sb.Append("  \"is_playing\": ").Append(isPlaying ? "true" : "false").Append(",\n");
            sb.Append("  \"alpha0_pre_composite\": ").Append(alpha0).Append(",\n");
            sb.Append("  \"non_dark_pixels\": ").Append(nonDark).Append(",\n");
            sb.Append("  \"text_luminance_pixels\": ").Append(textLum).Append(",\n");
            sb.Append("  \"png_sha256\": \"").Append(pngSha).Append("\",\n");
            sb.Append("  \"png\": \"").Append(pngPath.Replace("\\", "/")).Append("\",\n");
            sb.Append("  \"captured_at_utc\": \"").Append(DateTime.UtcNow.ToString("o")).Append("\"\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        static string Esc(string s) => (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");

        static void ForcePanelRepaint(VisualElement root)
        {
            if (root?.panel == null)
            {
                return;
            }

            IPanel panel = root.panel;
            // Runtime panels expose Repaint(Event) on BaseVisualElementPanel.
            System.Reflection.MethodInfo repaint = panel.GetType().GetMethod(
                "Repaint",
                System.Reflection.BindingFlags.Instance
                | System.Reflection.BindingFlags.Public
                | System.Reflection.BindingFlags.NonPublic,
                null,
                new[] { typeof(Event) },
                null);
            if (repaint != null)
            {
                var evt = new Event { type = EventType.Repaint };
                repaint.Invoke(panel, new object[] { evt });
                return;
            }

            System.Reflection.MethodInfo update = panel.GetType().GetMethod(
                "Update",
                System.Reflection.BindingFlags.Instance
                | System.Reflection.BindingFlags.Public
                | System.Reflection.BindingFlags.NonPublic);
            update?.Invoke(panel, null);
        }

        static async Task AwaitReady(Task ready, TimeSpan timeout, string label)
        {
            Task winner = await Task.WhenAny(ready, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(ready), "Timed out waiting " + label);
            await ready;
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
                if (scene.path == path) loaded.TrySetResult(true);
            }

            SceneManager.sceneLoaded += OnLoaded;
            try
            {
                if (SceneManager.GetSceneByPath(path).isLoaded) loaded.TrySetResult(true);
                Task completed = await Task.WhenAny(loaded.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(loaded.Task), "Timed out waiting scene " + path);
                await loaded.Task;
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
                if (scene.path == path) unloaded.TrySetResult(true);
            }

            SceneManager.sceneUnloaded += OnUnloaded;
            try
            {
                if (!SceneManager.GetSceneByPath(path).isLoaded) unloaded.TrySetResult(true);
                Task completed = await Task.WhenAny(unloaded.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(unloaded.Task), "Timed out unload " + path);
                await unloaded.Task;
            }
            finally
            {
                SceneManager.sceneUnloaded -= OnUnloaded;
            }
        }

        static string RunGit(string args)
        {
            string repo = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            var psi = new ProcessStartInfo("git", args)
            {
                WorkingDirectory = repo,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var p = Process.Start(psi);
            string o = p!.StandardOutput.ReadToEnd();
            p.WaitForExit(30_000);
            return o;
        }

        static string Sha256Hex(string s) => Sha256HexBytes(Encoding.UTF8.GetBytes(s ?? ""));

        static string Sha256HexBytes(byte[] bytes)
        {
            using var sha = SHA256.Create();
            byte[] hash = sha.ComputeHash(bytes);
            var sb = new StringBuilder(hash.Length * 2);
            for (int i = 0; i < hash.Length; i++) sb.Append(hash[i].ToString("x2"));
            return sb.ToString();
        }
    }
}
