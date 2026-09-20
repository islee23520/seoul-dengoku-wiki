using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Janseon.Core.Data;
using Janseon.Data.Authoring;
using Janseon.Data.Repositories;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Tests
{
    public sealed class Area1DataRepositoryPlayModeTests
    {
        [UnityTest]
        public System.Collections.IEnumerator BootstrapToFoundation_ResolvesSerializedCatalogRepositories()
        {
            return RunBootstrapToFoundation().AsCoroutine();
        }

        [Test]
        public void ScopeWithoutIndexProviderRegistration_FailsExplicitly()
        {
            GameDataCatalogAsset fixture = ScriptableObject.CreateInstance<GameDataCatalogAsset>();
            LifetimeScope scope = LifetimeScope.Create(builder => builder.RegisterInstance(fixture));

            try
            {
                Assert.Throws<VContainerException>(
                    () => scope.Container.Resolve<GameDataCatalogIndexProvider>());
            }
            finally
            {
                scope.Dispose();
                UnityEngine.Object.DestroyImmediate(fixture);
            }
        }

        static async Task RunBootstrapToFoundation()
        {
            Task mainTitleLoaded = WaitForSceneLoadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single));
            await mainTitleLoaded;

            MainTitleUiHost titleHost = UnityEngine.Object.FindAnyObjectByType<MainTitleUiHost>();
            Assert.That(titleHost, Is.Not.Null);
            await titleHost.Ready;

            AppLifetimeScope appScope = UnityEngine.Object
                .FindObjectsByType<AppLifetimeScope>(FindObjectsSortMode.None)
                .Single();
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            await coordinator.CurrentTransition;

            Task foundationLoaded = WaitForSceneLoadedAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            Button start = UguiHudBuilder.ButtonNamed(titleHost.CanvasRoot, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null);
            start.onClick.Invoke();
            Task<TransitionOutcome> transition = coordinator.CurrentTransition;
            TransitionOutcome outcome = await AwaitTaskResult(transition, TimeSpan.FromSeconds(15), "MainTitle-to-Foundation transition");
            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Completed), "MainTitle-to-Foundation transition must complete");
            await foundationLoaded;
            await titleUnloaded;

            GameplayUiHost gameplayHost = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(gameplayHost, Is.Not.Null);
            await gameplayHost.Ready;
            await gameplayHost.CoreLoopReady;

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null);

            IReadOnlyStationCatalog stations = AssertSingleton<IReadOnlyStationCatalog>(scope);
            IContentFingerprint fingerprint = AssertSingleton<IContentFingerprint>(scope);
            GameDataCatalogIndexProvider indexProvider = AssertSingleton<GameDataCatalogIndexProvider>(scope);

            Assert.That(stations.All, Is.Not.Empty);
            Assert.That(indexProvider.Index, Is.Not.Null);
            Assert.That(fingerprint.Sha256, Does.Match("^[0-9a-f]{64}$"));
            Assert.That(
                scope.Container.Resolve<IContentFingerprint>().Sha256,
                Is.SameAs(fingerprint.Sha256));
        }

        static T AssertSingleton<T>(FoundationLifetimeScope scope)
        {
            T first = scope.Container.Resolve<T>();
            T second = scope.Container.Resolve<T>();
            Assert.That(second, Is.SameAs(first));
            return first;
        }

        static Task AwaitAsyncOperation(AsyncOperation operation)
        {
            var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => completion.TrySetResult(true);
            return completion.Task;
        }

        static async Task WaitForSceneLoadedAsync(string path, TimeSpan timeout)
        {
            var signal = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnLoaded(Scene scene, LoadSceneMode _) { if (scene.path == path) signal.TrySetResult(true); }
            SceneManager.sceneLoaded += OnLoaded;
            try
            {
                if (SceneManager.GetSceneByPath(path).isLoaded) signal.TrySetResult(true);
                Task completed = await Task.WhenAny(signal.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(signal.Task), "Timed out waiting for scene loaded: " + path);
                await signal.Task;
            }
            finally
            {
                SceneManager.sceneLoaded -= OnLoaded;
            }
        }

        static async Task WaitForSceneUnloadedAsync(string path, TimeSpan timeout)
        {
            var signal = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnUnloaded(Scene scene) { if (scene.path == path) signal.TrySetResult(true); }
            SceneManager.sceneUnloaded += OnUnloaded;
            try
            {
                if (!SceneManager.GetSceneByPath(path).isLoaded) signal.TrySetResult(true);
                Task completed = await Task.WhenAny(signal.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(signal.Task), "Timed out waiting for scene unloaded: " + path);
                await signal.Task;
            }
            finally
            {
                SceneManager.sceneUnloaded -= OnUnloaded;
            }
        }

        static async Task<T> AwaitTaskResult<T>(Task<T> task, TimeSpan timeout, string label)
        {
            Assert.That(task, Is.Not.Null, label + " task missing");
            Task completed = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(completed, Is.SameAs(task), "Timed out waiting for " + label);
            return await task;
        }
    }

    static class Area1TaskCoroutineExtensions
    {
        public static System.Collections.IEnumerator AsCoroutine(this Task task)
        {
            while (!task.IsCompleted)
            {
                yield return null;
            }

            if (task.IsFaulted)
            {
                throw task.Exception;
            }
        }
    }
}
