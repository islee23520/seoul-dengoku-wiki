using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Tests
{
    public sealed class FoundationSceneFlowTests
    {
        [Test]
        public async Task BootstrapLoadsFoundationWithOneScopePerScene()
        {
            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(10));

            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(
                FoundationScenes.Bootstrap,
                LoadSceneMode.Single));
            await foundationLoaded;

            Scene bootstrap = SceneManager.GetSceneByPath(FoundationScenes.Bootstrap);
            Scene foundation = SceneManager.GetSceneByPath(FoundationScenes.Foundation);

            Assert.That(bootstrap.isLoaded, Is.True);
            Assert.That(foundation.isLoaded, Is.True);
            Assert.That(FindScopes(bootstrap).Count(scope => scope is AppLifetimeScope), Is.EqualTo(1));
            Assert.That(FindScopes(foundation).Count(scope => scope is FoundationLifetimeScope), Is.EqualTo(1));

            AppLifetimeScope appScope = FindScopes(bootstrap).OfType<AppLifetimeScope>().Single();
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            TransitionOutcome startup = await coordinator.CurrentTransition;
            Assert.That(startup.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(startup.TransitionId, Is.GreaterThan(0));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));

            TransitionOutcome duplicate = await coordinator.OpenFoundationAsync(CancellationToken.None);
            Assert.That(duplicate.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(duplicate.TransitionId, Is.EqualTo(startup.TransitionId));
            Assert.That(SceneManager.sceneCount, Is.EqualTo(2));
            Assert.That(FindScopes(foundation).Count(s => s is FoundationLifetimeScope), Is.EqualTo(1), "exactly one Foundation scope");
        }

        [Test]
        public async Task ImmediateCancellationOfActualAdditiveLoad_NoOrphanDuplicateBeforeRetry_ExactlyOneSuccessfulRetry()
        {
            // Scene isolation: a prior test may leave Foundation loaded; unload every instance first.
            for (int unloadPass = 0; unloadPass < 3; unloadPass++)
            {
                Scene stale = SceneManager.GetSceneByPath(FoundationScenes.Foundation);
                if (!stale.isLoaded)
                {
                    break;
                }
                var staleUnloaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                void OnStaleUnloaded(Scene s) { if (s.path == FoundationScenes.Foundation) staleUnloaded.TrySetResult(true); }
                SceneManager.sceneUnloaded += OnStaleUnloaded;
                try
                {
                    AsyncOperation unloadOp = SceneManager.UnloadSceneAsync(stale);
                    Task winner = await Task.WhenAny(staleUnloaded.Task, Task.Delay(TimeSpan.FromSeconds(10)));
                    SceneManager.sceneUnloaded -= OnStaleUnloaded;
                    Assert.That(winner, Is.SameAs(staleUnloaded.Task), "stale Foundation instance must unload before test starts");
                }
                finally
                {
                    SceneManager.sceneUnloaded -= OnStaleUnloaded;
                }
            }
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.Foundation).isLoaded, Is.False,
                "test must start with no Foundation scene loaded");

            // Dedicated empty parent scope: no FoundationStartup entry point, so this test owns the FIRST transition.
            var parentGo = new GameObject("FoundationCancelTestParent");
            try
            {
                var parentScope = parentGo.AddComponent<LifetimeScope>();
                var loader = new UnityFoundationSceneLoader(parentScope);
                var coordinator = new ApplicationFlowCoordinator(loader);

                var foundationUnloaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                SceneManager.sceneUnloaded += OnSceneUnloaded;
                try
                {
                    var cts = new CancellationTokenSource();
                    cts.Cancel();
                    Task<TransitionOutcome> firstTransition = coordinator.OpenFoundationAsync(cts.Token);

                    TransitionOutcome cancelled = await firstTransition;
                    Assert.That(cancelled.Status, Is.EqualTo(TransitionStatus.Cancelled), "pre-cancelled first transition must end Cancelled");

                    Task winner = await Task.WhenAny(foundationUnloaded.Task, Task.Delay(TimeSpan.FromSeconds(10)));
                    Assert.That(winner, Is.SameAs(foundationUnloaded.Task), "Foundation scene must be unloaded after cancellation cleanup");

                    Assert.That(SceneManager.GetSceneByPath(FoundationScenes.Foundation).isLoaded, Is.False, "no orphan Foundation scene after cancel");
                    int scopesAfterCancel = 0;
                    for (int i = 0; i < SceneManager.sceneCount; i++)
                    {
                        Scene s = SceneManager.GetSceneAt(i);
                        if (s.isLoaded)
                        {
                            scopesAfterCancel += FindScopes(s).Count(sc => sc is FoundationLifetimeScope);
                        }
                    }
                    Assert.That(scopesAfterCancel, Is.EqualTo(0), "zero Foundation scope after cancel");

                    var retry = await coordinator.RetryAsync(CancellationToken.None);
                    Assert.That(retry.Status, Is.EqualTo(TransitionStatus.Completed), "retry after cancellation must complete");
                    Scene foundationScene = SceneManager.GetSceneByPath(FoundationScenes.Foundation);
                    Assert.That(foundationScene.isLoaded, Is.True);
                    Assert.That(FindScopes(foundationScene).Count(s => s is FoundationLifetimeScope), Is.EqualTo(1), "exactly one Foundation scope after retry");

                    TransitionOutcome duplicate = await coordinator.OpenFoundationAsync(CancellationToken.None);
                    Assert.That(duplicate.Status, Is.EqualTo(TransitionStatus.Completed));
                    Assert.That(duplicate.TransitionId, Is.EqualTo(retry.TransitionId), "same-destination returns stored receipt");
                    Assert.That(FindScopes(foundationScene).Count(s => s is FoundationLifetimeScope), Is.EqualTo(1), "duplicate adds no scope");
                }
                finally
                {
                    SceneManager.sceneUnloaded -= OnSceneUnloaded;
                }

                void OnSceneUnloaded(Scene scene)
                {
                    if (scene.path == FoundationScenes.Foundation)
                    {
                        foundationUnloaded.TrySetResult(true);
                    }
                }
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(parentGo);
            }
        }

        private static LifetimeScope[] FindScopes(Scene scene)
            => scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<LifetimeScope>(true))
                .ToArray();

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
    }
}
