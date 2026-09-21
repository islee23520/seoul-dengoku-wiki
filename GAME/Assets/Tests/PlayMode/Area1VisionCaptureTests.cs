using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Janseon.Core.Data;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using TMPro;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;
using VContainer;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Area 1 vision gate: the production Foundation gameplay panel must render live
    /// data-contract receipt text, and the panel must capture to a non-degenerate PNG
    /// with a fingerprint receipt. Drives the real MainTitle start button; no test seams
    /// and no card-catalog references.
    /// </summary>
    public sealed class Area1VisionCaptureTests
    {
        const string EvidenceDirectory = ".omo/evidence/area1-vision";
        const string PngName = "vision-foundation-panel.png";
        const string ReceiptName = "vision-foundation-panel.receipt.json";

        CaptureContext captureContext;

        [UnityTest]
        public IEnumerator Area1VisionGate_ProductionFoundationPanel_PngAndReceipt()
        {
            yield return Run().AsCoroutine();
            CaptureFoundationPanel();
        }

        async Task Run()
        {
            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single));
            await mainTitleLoaded;

            AppLifetimeScope appScope = UnityEngine.Object.FindObjectsByType<AppLifetimeScope>(FindObjectsSortMode.None).Single();
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            await coordinator.CurrentTransition;

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            MainTitleUiHost titleHost = UnityEngine.Object.FindAnyObjectByType<MainTitleUiHost>();
            Assert.That(titleHost, Is.Not.Null, "MainTitleUiHost missing");
            Button start = UguiHudBuilder.ButtonNamed(titleHost.CanvasRoot, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null, UiElementNames.MainTitleStart);
            start.onClick.Invoke();
            await foundationLoaded;
            await titleUnloaded;

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null);
            await host.Ready;
            await host.CoreLoopReady;
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.Foundation).isLoaded, Is.True);
            captureContext = new CaptureContext
            {
                Canvas = host.CanvasRoot.GetComponentInParent<Canvas>(),
            };
            Assert.That(captureContext.Canvas, Is.Not.Null);

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null);
            captureContext.Fingerprint = scope.Container.Resolve<IContentFingerprint>();
            captureContext.StationCount = scope.Container.Resolve<IReadOnlyStationCatalog>().All.Count;

            Transform panel = UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.DataContractPanel);
            Assert.That(panel, Is.Not.Null, UiElementNames.DataContractPanel);
            Assert.That(panel.gameObject.activeInHierarchy, Is.True, UiElementNames.DataContractPanel + " must be active");
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentVersion);
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentCounts);
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentFingerprint);
        }

        void CaptureFoundationPanel()
        {
            Assert.That(SystemInfo.graphicsDeviceType, Is.Not.EqualTo(GraphicsDeviceType.Null),
                "Area 1 vision gate requires a rendering graphics device; run batchmode without -nographics.");

            string repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            string evidenceDirectory = Path.GetFullPath(Path.Combine(repoRoot, EvidenceDirectory));
            Directory.CreateDirectory(evidenceDirectory);
            string pngPath = Path.Combine(evidenceDirectory, PngName);
            string receiptPath = Path.Combine(evidenceDirectory, ReceiptName);

            int width = 1280, height = 720;
            RenderTexture rt = new RenderTexture(width, height, 24);
            rt.Create();
            GameObject camGo = new GameObject("Area1VisionCaptureCamera");
            Camera cam = camGo.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Color.black;
            cam.targetTexture = rt;
            cam.enabled = false;

            Canvas canvas = captureContext.Canvas;
            Assert.That(canvas, Is.Not.Null);
            RenderMode prevMode = canvas.renderMode;
            Camera prevWorld = canvas.worldCamera;
            Texture2D pixels = null;
            try
            {
                canvas.renderMode = RenderMode.ScreenSpaceCamera;
                canvas.worldCamera = cam;
                canvas.planeDistance = 1f;
                Canvas.ForceUpdateCanvases();
                cam.Render();

                pixels = new Texture2D(width, height, TextureFormat.RGBA32, false);
                RenderTexture previous = RenderTexture.active;
                try
                {
                    RenderTexture.active = rt;
                    pixels.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                    pixels.Apply();
                }
                finally
                {
                    RenderTexture.active = previous;
                }

                byte[] png = pixels.EncodeToPNG();
                Assert.That(png, Is.Not.Null);
                Assert.That(png.Length, Is.GreaterThan(10000), "Foundation panel capture is blank or degenerate.");
                File.WriteAllBytes(pngPath, png);

                string receipt = BuildReceipt(
                    ReadSourceHead(repoRoot),
                    captureContext.Fingerprint,
                    captureContext.StationCount,
                    Sha256Hex(png));
                File.WriteAllText(receiptPath, receipt, new UTF8Encoding(false));
            }
            finally
            {
                canvas.renderMode = prevMode;
                canvas.worldCamera = prevWorld;
                if (pixels != null) UnityEngine.Object.Destroy(pixels);
                UnityEngine.Object.Destroy(camGo);
                rt.Release();
                UnityEngine.Object.Destroy(rt);
            }
        }

        sealed class CaptureContext
        {
            public Canvas Canvas;
            public IContentFingerprint Fingerprint;
            public int StationCount;
        }

        static void AssertReceiptText(RectTransform root, string name)
        {
            Transform element = UguiHudBuilder.Find(root, name);
            Assert.That(element, Is.Not.Null, name);
            Assert.That(element.gameObject.activeInHierarchy, Is.True, name + " must be active");
            TMP_Text text = element.GetComponent<TMP_Text>();
            Assert.That(text, Is.Not.Null, name + " must use TMP");
            Assert.That(text.text, Is.Not.Empty, name);
        }

        static string BuildReceipt(string sourceHead, IContentFingerprint fingerprint,
            int stationCount, string pngSha256)
        {
            ContentVersionStamp version = fingerprint.Version;
            return "{\n"
                + "  \"source_head\": \"" + JsonEscape(sourceHead) + "\",\n"
                + "  \"scene\": \"Assets/Scenes/Foundation.unity\",\n"
                + "  \"capture_kind\": \"area1-vision-panel\",\n"
                + "  \"content_schema\": " + version.ContentSchema + ",\n"
                + "  \"content_version\": \"" + JsonEscape(version.ContentVersion) + "\",\n"
                + "  \"fingerprint_version\": \"" + JsonEscape(version.FingerprintVersion) + "\",\n"
                + "  \"content_fingerprint\": \"" + JsonEscape(fingerprint.Sha256) + "\",\n"
                + "  \"png_sha256\": \"" + pngSha256 + "\"\n"
                + "}\n";
        }

        static string ReadSourceHead(string repoRoot)
        {
            string gitPath = Path.Combine(repoRoot, ".git");
            if (!File.Exists(gitPath) && !Directory.Exists(gitPath)) return "PARENT_FILLS";
            if (Directory.Exists(gitPath))
            {
                string directHead = Path.Combine(gitPath, "HEAD");
                if (File.Exists(directHead)) return ResolveHead(gitPath, File.ReadAllText(directHead).Trim());
                return "PARENT_FILLS";
            }
            string pointer = File.ReadAllText(gitPath).Trim();
            if (!pointer.StartsWith("gitdir:", StringComparison.OrdinalIgnoreCase)) return "PARENT_FILLS";
            string gitDirectory = pointer.Substring("gitdir:".Length).Trim();
            if (!Path.IsPathRooted(gitDirectory)) gitDirectory = Path.GetFullPath(Path.Combine(repoRoot, gitDirectory));
            return ResolveHead(gitDirectory, File.Exists(Path.Combine(gitDirectory, "HEAD"))
                ? File.ReadAllText(Path.Combine(gitDirectory, "HEAD")).Trim()
                : string.Empty);
        }

        static string ResolveHead(string gitDirectory, string head)
        {
            if (head.StartsWith("ref:", StringComparison.OrdinalIgnoreCase))
            {
                string refPath = Path.Combine(gitDirectory, head.Substring("ref:".Length).Trim());
                if (File.Exists(refPath)) return File.ReadAllText(refPath).Trim();
            }
            return head.Length == 0 ? "PARENT_FILLS" : head;
        }

        static string JsonEscape(string value)
        {
            return (value ?? string.Empty).Replace("\\", "\\\\").Replace("\"", "\\\"")
                .Replace("\r", "\\r").Replace("\n", "\\n");
        }

        static string Sha256Hex(byte[] bytes)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                return string.Concat(sha256.ComputeHash(bytes).Select(b => b.ToString("x2")));
            }
        }

        static Task AwaitAsyncOperation(AsyncOperation operation)
        {
            var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => completion.TrySetResult(true);
            return completion.Task;
        }

        static async Task WaitForSceneAsync(string path, TimeSpan timeout)
        {
            var signal = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnLoaded(Scene scene, LoadSceneMode _) { if (scene.path == path) signal.TrySetResult(true); }
            SceneManager.sceneLoaded += OnLoaded;
            try
            {
                if (SceneManager.GetSceneByPath(path).isLoaded) signal.TrySetResult(true);
                Assert.That(await Task.WhenAny(signal.Task, Task.Delay(timeout)), Is.SameAs(signal.Task));
            }
            finally { SceneManager.sceneLoaded -= OnLoaded; }
        }

        static async Task WaitForSceneUnloadedAsync(string path, TimeSpan timeout)
        {
            var signal = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnUnloaded(Scene scene) { if (scene.path == path) signal.TrySetResult(true); }
            SceneManager.sceneUnloaded += OnUnloaded;
            try
            {
                if (!SceneManager.GetSceneByPath(path).isLoaded) signal.TrySetResult(true);
                Assert.That(await Task.WhenAny(signal.Task, Task.Delay(timeout)), Is.SameAs(signal.Task));
            }
            finally { SceneManager.sceneUnloaded -= OnUnloaded; }
        }
    }
}
