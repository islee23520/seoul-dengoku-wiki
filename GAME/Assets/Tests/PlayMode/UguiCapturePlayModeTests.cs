using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
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
    /// uGUI capture gate for the Foundation gameplay HUD: the production canvas must
    /// build every machine-stable element in <see cref="UiElementNames.GameplayRequired"/>,
    /// the data-contract panel must render live receipt text, the stage rail must expose
    /// every campaign stage, and the canvas must capture to a non-degenerate PNG artifact.
    /// No presenter test seams are used.
    /// </summary>
    public sealed class UguiCapturePlayModeTests
    {
        const string EvidenceDirectory = ".omo/evidence/ugui-capture";
        const string PngName = "gameplay-hud.png";

        [UnityTest]
        public System.Collections.IEnumerator GameplayCanvas_BuildsRequiredElementsAndCaptures() =>
            GameplayCanvas_BuildsRequiredElementsAndCapturesAsync().AsCoroutine();

        async Task GameplayCanvas_BuildsRequiredElementsAndCapturesAsync()
        {
            await OpenFoundationAsync();

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "production GameplayUiHost missing");
            await AwaitTask(host.Ready, TimeSpan.FromSeconds(10), "gameplay host ready");
            Assert.That(host.CanvasRoot, Is.Not.Null, "gameplay canvas root missing");
            Assert.That(host.Presenter, Is.Not.Null);
            Assert.That(host.Presenter.IsReady, Is.True, "presenter must bind the production canvas");

            foreach (string name in UiElementNames.GameplayRequired)
            {
                Assert.That(UguiHudBuilder.Find(host.CanvasRoot, name), Is.Not.Null,
                    "gameplay canvas missing required element: " + name);
            }

            foreach (string stage in new[]
                     {
                         UiElementNames.StageBasePrep,
                         UiElementNames.StageExpedition,
                         UiElementNames.StageEncounter,
                         UiElementNames.StageResolution,
                         UiElementNames.StageSettlement,
                         UiElementNames.StageBaseReady,
                     })
            {
                Assert.That(UguiHudBuilder.Find(host.CanvasRoot, stage), Is.Not.Null,
                    "stage rail missing: " + stage);
            }

            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentVersion);
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentCounts);
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentFingerprint);

            CaptureGameplayCanvas(host.CanvasRoot.GetComponentInParent<Canvas>());

            await UnloadContentScenesAsync();
        }

        static void CaptureGameplayCanvas(Canvas canvas)
        {
            Assert.That(canvas, Is.Not.Null, "gameplay canvas missing for capture");
            Assert.That(SystemInfo.graphicsDeviceType, Is.Not.EqualTo(GraphicsDeviceType.Null),
                "uGUI capture requires a rendering graphics device; run batchmode without -nographics.");

            string repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            string evidenceDirectory = Path.GetFullPath(Path.Combine(repoRoot, EvidenceDirectory));
            Directory.CreateDirectory(evidenceDirectory);
            string pngPath = Path.Combine(evidenceDirectory, PngName);

            int width = 1280, height = 720;
            RenderTexture rt = new RenderTexture(width, height, 24);
            rt.Create();
            GameObject camGo = new GameObject("UguiCaptureCamera");
            Camera cam = camGo.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Color.black;
            cam.targetTexture = rt;
            cam.enabled = false;

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
                Assert.That(png.Length, Is.GreaterThan(10000), "gameplay HUD capture is blank or degenerate.");
                File.WriteAllBytes(pngPath, png);
                string sha256 = string.Concat(
                    SHA256.Create().ComputeHash(png).Select(b => b.ToString("x2")));
                File.WriteAllText(
                    Path.Combine(evidenceDirectory, Path.ChangeExtension(PngName, ".receipt.json")),
                    "{\n  \"capture_kind\": \"ugui-gameplay-hud\",\n  \"width\": " + width
                    + ",\n  \"height\": " + height
                    + ",\n  \"png_sha256\": \"" + sha256 + "\"\n}\n",
                    new UTF8Encoding(false));
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

        static void AssertReceiptText(RectTransform root, string name)
        {
            Transform element = UguiHudBuilder.Find(root, name);
            Assert.That(element, Is.Not.Null, name);
            Assert.That(element.gameObject.activeInHierarchy, Is.True, name + " must be active");
            TMP_Text text = element.GetComponent<TMP_Text>();
            Assert.That(text, Is.Not.Null, name + " must use TMP");
            Assert.That(text.text, Is.Not.Empty, name);
        }

        static async Task OpenFoundationAsync()
        {
            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single));
            await mainTitleLoaded;

            AppLifetimeScope appScope = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>();
            Assert.That(appScope, Is.Not.Null, "AppLifetimeScope missing on Bootstrap");
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            Task<TransitionOutcome> startup = coordinator.CurrentTransition;
            Assert.That(startup, Is.Not.Null, "startup transition missing");
            TransitionOutcome startupOutcome = await AwaitTaskResult(startup, TimeSpan.FromSeconds(15), "startup commit");
            Assert.That(startupOutcome.Status, Is.EqualTo(TransitionStatus.Completed));

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            TransitionOutcome foundationOutcome = await coordinator.OpenFoundationAsync(CancellationToken.None);
            Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            await foundationLoaded;
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

                Task completed = await Task.WhenAny(loaded.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(loaded.Task), "Timed out waiting for scene: " + path);
                await loaded.Task;
            }
            finally
            {
                SceneManager.sceneLoaded -= OnLoaded;
            }
        }

        static Task AwaitAsyncOperation(AsyncOperation operation)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => tcs.TrySetResult(true);
            return tcs.Task;
        }

        static async Task<T> AwaitTaskResult<T>(Task<T> task, TimeSpan timeout, string label)
        {
            Assert.That(task, Is.Not.Null, label + " task missing");
            Task winner = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
            return await task;
        }

        static async Task AwaitTask(Task task, TimeSpan timeout, string label)
        {
            Task winner = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
            await task;
        }
    }
}
