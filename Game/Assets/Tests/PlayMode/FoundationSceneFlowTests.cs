using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.Presentation;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Tests
{
    public sealed class FoundationSceneFlowTests
    {
        [Test]
        public async Task BootstrapReachesMainTitleThenFoundationWithExclusiveScreenLease()
        {
            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));

            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(
                FoundationScenes.Bootstrap,
                LoadSceneMode.Single));
            await mainTitleLoaded;

            Scene bootstrap = SceneManager.GetSceneByPath(FoundationScenes.Bootstrap);
            Scene mainTitle = SceneManager.GetSceneByPath(FoundationScenes.MainTitle);
            Scene foundation = SceneManager.GetSceneByPath(FoundationScenes.Foundation);

            Assert.That(bootstrap.isLoaded, Is.True);
            Assert.That(mainTitle.isLoaded, Is.True);
            Assert.That(foundation.isLoaded, Is.False, "Foundation must not load until requested");
            Assert.That(FindScopes(bootstrap).Count(scope => scope is AppLifetimeScope), Is.EqualTo(1));
            Assert.That(FindScopes(mainTitle).Count(scope => scope is MainTitleLifetimeScope), Is.EqualTo(1));
            Assert.That(CountContentScreenScopes(), Is.EqualTo(1), "exactly one content-screen child scope");

            AppLifetimeScope appScope = FindScopes(bootstrap).OfType<AppLifetimeScope>().Single();
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            TransitionOutcome startup = await coordinator.CurrentTransition;
            Assert.That(startup.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(startup.TransitionId, Is.GreaterThan(0));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));
            Assert.That(coordinator.CurrentLease, Is.Not.Null);
            Assert.That(coordinator.CurrentLease.Screen, Is.EqualTo(ContentScreenId.MainTitle));

            TransitionOutcome duplicateTitle = await coordinator.OpenMainTitleAsync(CancellationToken.None);
            Assert.That(duplicateTitle.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(duplicateTitle.TransitionId, Is.EqualTo(startup.TransitionId));
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.MainTitle).isLoaded, Is.True);
            Assert.That(CountContentScreenScopes(), Is.EqualTo(1));

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task mainTitleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            TransitionOutcome foundationOutcome = await coordinator.OpenFoundationAsync(CancellationToken.None);
            await foundationLoaded;
            await mainTitleUnloaded;

            Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(foundationOutcome.TransitionId, Is.Not.EqualTo(startup.TransitionId));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(coordinator.CurrentLease.Screen, Is.EqualTo(ContentScreenId.Foundation));
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.MainTitle).isLoaded, Is.False);
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.Foundation).isLoaded, Is.True);
            Assert.That(FindScopes(SceneManager.GetSceneByPath(FoundationScenes.Foundation))
                .Count(scope => scope is FoundationLifetimeScope), Is.EqualTo(1));
            Assert.That(CountContentScreenScopes(), Is.EqualTo(1), "title disposed; only Foundation child remains");
            Assert.That(FindScopes(bootstrap).Count(scope => scope is AppLifetimeScope), Is.EqualTo(1), "one App scope");

            TransitionOutcome duplicateFoundation = await coordinator.OpenFoundationAsync(CancellationToken.None);
            Assert.That(duplicateFoundation.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(duplicateFoundation.TransitionId, Is.EqualTo(foundationOutcome.TransitionId));
            Assert.That(CountContentScreenScopes(), Is.EqualTo(1), "duplicate Foundation adds no scope");
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.MainTitle).isLoaded, Is.False);
            Assert.That(SceneManager.sceneCount, Is.EqualTo(2), "Bootstrap + Foundation only");

            GameObject stationProps = GameObject.Find("Station Props");
            Assert.That(stationProps, Is.Not.Null, "six verified station props must be connected to Foundation");
            Assert.That(stationProps.transform.childCount, Is.EqualTo(6));
            string[] familyNames = { "ticket-gate", "pump-crate", "shutter", "pillar", "bench", "cabinet" };
            foreach (string familyName in familyNames)
            {
                Transform family = stationProps.transform.Find("poc-prop-" + familyName);
                Assert.That(family, Is.Not.Null, familyName);
                MeshRenderer[] renderers = family.GetComponentsInChildren<MeshRenderer>();
                Assert.That(renderers, Is.Not.Empty, familyName + " needs an active renderer");
                foreach (MeshRenderer renderer in renderers)
                {
                    Assert.That(renderer.enabled && renderer.gameObject.activeInHierarchy, Is.True);
                    Mesh mesh = renderer.GetComponent<MeshFilter>().sharedMesh;
                    Assert.That(mesh, Is.Not.Null);
                    Assert.That(mesh.vertexCount, Is.GreaterThan(0));
                    Assert.That(renderer.sharedMaterial, Is.Not.Null);
                    Assert.That(renderer.sharedMaterial.mainTexture, Is.Not.Null);
                    Assert.That(renderer.sharedMaterial.shader.isSupported, Is.True);
                    Assert.That(renderer.bounds.min.y, Is.GreaterThanOrEqualTo(-0.02f));
                }
            }

            GameplayUiHost host = UnityEngine.Object.FindFirstObjectByType<GameplayUiHost>();
            Camera camera = UnityEngine.Object.FindObjectsByType<Camera>(FindObjectsSortMode.None)
                .Single(c => c.name == "StationPreviewCamera");
            var target = camera.targetTexture;
            Assert.That(target, Is.Not.Null, "station preview RT must be wired");
            Assert.That(target.IsCreated(), Is.True);
            camera.Render(); // synchronous render completion, not a timed frame wait
            var pixels = new Texture2D(target.width, target.height, TextureFormat.RGBA32, false);
            RenderTexture previous = RenderTexture.active;
            try
            {
                RenderTexture.active = target;
                pixels.ReadPixels(new Rect(0, 0, target.width, target.height), 0, 0);
                pixels.Apply();
                Assert.That(pixels.GetPixels32().Count(p => p.r > 60 || p.g > 60 || p.b > 60),
                    Is.GreaterThan(300), "live station preview must contain rendered geometry");
            }
            finally
            {
                RenderTexture.active = previous;
                UnityEngine.Object.DestroyImmediate(pixels);
            }

            Camera main = Camera.main;
            Assert.That(main, Is.Not.Null, "Isometric Camera must be MainCamera so the 3D world draws to the screen");
            Assert.That(main.targetTexture, Is.Null, "main camera must not be captured into a UI preview texture");
            Assert.That(main.orthographic, Is.True);
            Assert.That(Mathf.DeltaAngle(main.transform.eulerAngles.x, Janseon.Foundation.GenreContract.CameraPitchDegrees), Is.EqualTo(0f).Within(0.05f));

            HeightmapVoxelWorld world = UnityEngine.Object.FindAnyObjectByType<HeightmapVoxelWorld>();
            Assert.That(world, Is.Not.Null, "POC must spawn heightmap voxel terrain");
            Assert.That(world.StationCubeCount, Is.EqualTo(3));

            RectTransform hud = host.CanvasRoot;
            Assert.That(hud, Is.Not.Null, "visible uGUI HUD must exist over the 3D world");
            Assert.That(UguiHudBuilder.Find(hud, "party-strip"), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(hud, "layer-chip"), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(hud, "encounter-context"), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(hud, "why-tooltip"), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(hud, "battle-forecast"), Is.Not.Null);
            Assert.That(UguiHudBuilder.Find(hud, UiElementNames.SettlementPanel), Is.Not.Null);
            Button negotiate = UguiHudBuilder.ButtonNamed(hud, UiElementNames.ChoiceNegotiate);
            Assert.That(negotiate.GetComponentInChildren<UnityEngine.UI.Text>(true).text, Does.Contain("-5"));
            Assert.That(UguiHudBuilder.ButtonNamed(hud, "battle-move-n"), Is.Not.Null);
            Assert.That(UguiHudBuilder.ButtonNamed(hud, "battle-melee"), Is.Not.Null);
            Assert.That(UguiHudBuilder.ButtonNamed(hud, "battle-end-turn"), Is.Not.Null);

            var screenTarget = new RenderTexture(640, 360, 24);
            screenTarget.Create();
            RenderTexture previousMain = main.targetTexture;
            Texture2D screenPixels = new Texture2D(screenTarget.width, screenTarget.height, TextureFormat.RGBA32, false);
            try
            {
                main.targetTexture = screenTarget;
                main.Render();
                RenderTexture.active = screenTarget;
                screenPixels.ReadPixels(new Rect(0, 0, screenTarget.width, screenTarget.height), 0, 0);
                screenPixels.Apply();
                Assert.That(screenPixels.GetPixels32().Count(p => p.r > 60 || p.g > 60 || p.b > 60),
                    Is.GreaterThan(300), "main camera must draw heightmap/prop geometry to the game view");
            }
            finally
            {
                main.targetTexture = previousMain;
                RenderTexture.active = previous;
                UnityEngine.Object.DestroyImmediate(screenPixels);
                screenTarget.Release();
                UnityEngine.Object.DestroyImmediate(screenTarget);
            }

            string evidence = BuildEvidence(
                coordinator,
                startup.TransitionId,
                foundationOutcome.TransitionId,
                duplicateFoundation.TransitionId);
            Debug.Log(evidence);

            Task unloaded = WaitForSceneUnloadedAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            TransitionOutcome returnToTitle = await coordinator.OpenMainTitleAsync(CancellationToken.None);
            await unloaded;
            Assert.That(returnToTitle.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(target == null || !target.IsCreated(), Is.True, "Foundation must release its owned preview texture");
        }

        [Test]
        public async Task ImmediateCancellationOfActualAdditiveLoad_NoOrphanDuplicateBeforeRetry_ExactlyOneSuccessfulRetry()
        {
            await UnloadAllContentScenesAsync();

            var parentGo = new GameObject("ContentCancelTestParent");
            try
            {
                // Parent must register ApplicationFlowCoordinator so MainTitle child scope
                // can constructor-inject it (same contract as AppLifetimeScope).
                var parentScope = parentGo.AddComponent<CancelTestParentScope>();
                ApplicationFlowCoordinator coordinator =
                    parentScope.Container.Resolve<ApplicationFlowCoordinator>();

                var mainTitleUnloaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                SceneManager.sceneUnloaded += OnSceneUnloaded;
                try
                {
                    var cts = new CancellationTokenSource();
                    cts.Cancel();
                    TransitionOutcome cancelled = await coordinator.OpenMainTitleAsync(cts.Token);
                    Assert.That(cancelled.Status, Is.EqualTo(TransitionStatus.Cancelled),
                        "pre-cancelled first transition must end Cancelled");

                    Task winner = await Task.WhenAny(mainTitleUnloaded.Task, Task.Delay(TimeSpan.FromSeconds(10)));
                    Assert.That(winner, Is.SameAs(mainTitleUnloaded.Task),
                        "MainTitle scene must be unloaded after cancellation cleanup");

                    Assert.That(SceneManager.GetSceneByPath(FoundationScenes.MainTitle).isLoaded, Is.False,
                        "no orphan MainTitle scene after cancel");
                    Assert.That(CountContentScreenScopes(), Is.EqualTo(0), "zero content scope after cancel");

                    TransitionOutcome retry = await coordinator.RetryAsync(CancellationToken.None);
                    Assert.That(retry.Status, Is.EqualTo(TransitionStatus.Completed),
                        "retry after cancellation must complete");
                    Scene mainTitleScene = SceneManager.GetSceneByPath(FoundationScenes.MainTitle);
                    Assert.That(mainTitleScene.isLoaded, Is.True);
                    Assert.That(FindScopes(mainTitleScene).Count(s => s is MainTitleLifetimeScope), Is.EqualTo(1));
                    Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));

                    TransitionOutcome duplicate = await coordinator.OpenMainTitleAsync(CancellationToken.None);
                    Assert.That(duplicate.Status, Is.EqualTo(TransitionStatus.Completed));
                    Assert.That(duplicate.TransitionId, Is.EqualTo(retry.TransitionId),
                        "same-destination returns stored receipt");
                    Assert.That(CountContentScreenScopes(), Is.EqualTo(1), "duplicate adds no scope");
                }
                finally
                {
                    SceneManager.sceneUnloaded -= OnSceneUnloaded;
                }

                void OnSceneUnloaded(Scene scene)
                {
                    if (scene.path == FoundationScenes.MainTitle)
                    {
                        mainTitleUnloaded.TrySetResult(true);
                    }
                }
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(parentGo);
            }
        }

        private static int CountContentScreenScopes()
        {
            int count = 0;
            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                Scene scene = SceneManager.GetSceneAt(i);
                if (!scene.isLoaded)
                {
                    continue;
                }

                count += FindScopes(scene).Count(scope =>
                    scope is MainTitleLifetimeScope || scope is FoundationLifetimeScope);
            }

            return count;
        }

        private static async Task UnloadAllContentScenesAsync()
        {
            string[] paths = { FoundationScenes.MainTitle, FoundationScenes.Foundation };
            foreach (string path in paths)
            {
                for (int unloadPass = 0; unloadPass < 3; unloadPass++)
                {
                    Scene stale = SceneManager.GetSceneByPath(path);
                    if (!stale.isLoaded)
                    {
                        break;
                    }

                    var unloaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
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
                        AsyncOperation unloadOp = SceneManager.UnloadSceneAsync(stale);
                        if (unloadOp == null)
                        {
                            break;
                        }

                        Task winner = await Task.WhenAny(unloaded.Task, Task.Delay(TimeSpan.FromSeconds(10)));
                        Assert.That(winner, Is.SameAs(unloaded.Task), $"{path} must unload before test starts");
                    }
                    finally
                    {
                        SceneManager.sceneUnloaded -= OnUnloaded;
                    }
                }

                Assert.That(SceneManager.GetSceneByPath(path).isLoaded, Is.False,
                    $"test must start with no {path} loaded");
            }
        }

        private static string BuildEvidence(
            ApplicationFlowCoordinator coordinator,
            long titleTransitionId,
            long foundationTransitionId,
            long duplicateFoundationTransitionId)
        {
            var sb = new StringBuilder();
            sb.AppendLine("MAIN_TITLE_LEASE_EVIDENCE");
            sb.AppendLine($"state={coordinator.CurrentState}");
            sb.AppendLine($"leaseScreen={coordinator.CurrentLease?.Screen}");
            sb.AppendLine($"titleTransitionId={titleTransitionId}");
            sb.AppendLine($"foundationTransitionId={foundationTransitionId}");
            sb.AppendLine($"duplicateFoundationTransitionId={duplicateFoundationTransitionId}");
            sb.AppendLine($"sceneCount={SceneManager.sceneCount}");
            sb.AppendLine($"appScopeCount=1");
            sb.AppendLine($"contentScopeCount={CountContentScreenScopes()}");
            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                Scene scene = SceneManager.GetSceneAt(i);
                sb.AppendLine($"loaded[{i}]={scene.path};isLoaded={scene.isLoaded}");
            }

            return sb.ToString();
        }

        private static LifetimeScope[] FindScopes(Scene scene)
            => scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<LifetimeScope>(true))
                .ToArray();

        /// <summary>
        /// Minimal parent scope mirroring App DI for content-screen child injection
        /// without FoundationStartup auto-open.
        /// </summary>
        private sealed class CancelTestParentScope : LifetimeScope
        {
            protected override void Configure(IContainerBuilder builder)
            {
                builder.Register<UnityFoundationSceneLoader>(Lifetime.Singleton)
                    .As<IContentSceneLoader>();
                builder.Register<ApplicationFlowCoordinator>(Lifetime.Singleton);
            }
        }

        private static Task AwaitAsyncOperation(AsyncOperation operation)
        {
            TaskCompletionSource<bool> completion =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += Complete;
            return completion.Task;

            void Complete(AsyncOperation _)
            {
                operation.completed -= Complete;
                completion.TrySetResult(true);
            }
        }

        private static async Task WaitForSceneAsync(string path, TimeSpan timeout)
        {
            TaskCompletionSource<bool> loaded =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            SceneManager.sceneLoaded += OnSceneLoaded;

            try
            {
                if (SceneManager.GetSceneByPath(path).isLoaded)
                {
                    loaded.TrySetResult(true);
                }

                Task completed = await Task.WhenAny(loaded.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(loaded.Task), $"Timed out waiting for scene: {path}");
                await loaded.Task;
            }
            finally
            {
                SceneManager.sceneLoaded -= OnSceneLoaded;
            }

            void OnSceneLoaded(Scene scene, LoadSceneMode _)
            {
                if (scene.path == path)
                {
                    loaded.TrySetResult(true);
                }
            }
        }

        private static async Task WaitForSceneUnloadedAsync(string path, TimeSpan timeout)
        {
            TaskCompletionSource<bool> unloaded =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            SceneManager.sceneUnloaded += OnSceneUnloaded;

            try
            {
                if (!SceneManager.GetSceneByPath(path).isLoaded)
                {
                    unloaded.TrySetResult(true);
                }

                Task completed = await Task.WhenAny(unloaded.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(unloaded.Task), $"Timed out waiting for unload: {path}");
                await unloaded.Task;
            }
            finally
            {
                SceneManager.sceneUnloaded -= OnSceneUnloaded;
            }

            void OnSceneUnloaded(Scene scene)
            {
                if (scene.path == path)
                {
                    unloaded.TrySetResult(true);
                }
            }
        }
    }
}
