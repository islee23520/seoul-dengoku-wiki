using System;
using System.Linq;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Data;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using Janseon.Data.Fingerprints;
using NUnit.Framework;
using TMPro;
using UnityEngine;
using VContainer;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;

namespace Janseon.Foundation.Tests
{
    public sealed class Area1DataRepositoryPlayModeTests
    {
        [UnityTest]
        public System.Collections.IEnumerator ProductionFoundation_RendersRepositoryBackedContentReceipt()
        {
            return Run().AsCoroutine();
        }

        async Task Run()
        {
            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single));
            await mainTitleLoaded;

            MainTitleUiHost titleHost = UnityEngine.Object.FindAnyObjectByType<MainTitleUiHost>();
            Assert.That(titleHost, Is.Not.Null);
            await titleHost.Ready;
            AppLifetimeScope appScope = UnityEngine.Object.FindObjectsByType<AppLifetimeScope>(FindObjectsSortMode.None).Single();
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            await coordinator.CurrentTransition;

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            Button start = UguiHudBuilder.ButtonNamed(titleHost.CanvasRoot, UiElementNames.MainTitleStart);
            Assert.That(start, Is.Not.Null);
            start.onClick.Invoke();
            await foundationLoaded;
            await titleUnloaded;

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null);
            await host.Ready;
            await host.CoreLoopReady;
            Assert.That(SceneManager.GetSceneByPath(FoundationScenes.Foundation).isLoaded, Is.True);

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null);
            IReadOnlyCardCatalog cards = scope.Container.Resolve<IReadOnlyCardCatalog>();
            IReadOnlyUnitRoleCatalog roles = scope.Container.Resolve<IReadOnlyUnitRoleCatalog>();
            IReadOnlyFormationCatalog formations = scope.Container.Resolve<IReadOnlyFormationCatalog>();
            IReadOnlyStationCatalog stations = scope.Container.Resolve<IReadOnlyStationCatalog>();
            IContentFingerprint fingerprint = scope.Container.Resolve<IContentFingerprint>();

            Assert.That(fingerprint.Version.ContentVersion, Is.EqualTo("area1-static-content-v1"));
            Assert.That(cards.All.Count, Is.EqualTo(6));
            Assert.That(roles.All.Count, Is.EqualTo(3));
            Assert.That(formations.All.Count, Is.EqualTo(1));
            Assert.That(stations.All.Count, Is.EqualTo(3));
            Assert.That(BattleRules.RulesVersion, Is.EqualTo("rtfc-owner-cards-v2"));
            Assert.That(fingerprint.Sha256, Is.EqualTo(scope.Container.Resolve<IContentFingerprint>().Sha256));

            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentVersion);
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentCounts);
            AssertReceiptText(host.CanvasRoot, UiElementNames.DataContentFingerprint);
            Assert.That(UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.DataContractPanel), Is.Not.Null);
            TMP_Text fingerprintText = UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.DataContentFingerprint)
                .GetComponent<TMP_Text>();
            Assert.That(fingerprintText.text, Does.Contain(fingerprint.Sha256.Substring(0, 12)));
        }

        static void AssertReceiptText(RectTransform root, string name)
        {
            Transform element = UguiHudBuilder.Find(root, name);
            Assert.That(element, Is.Not.Null, name);
            TMP_Text text = element.GetComponent<TMP_Text>();
            Assert.That(text, Is.Not.Null, name + " must use TMP");
            Assert.That(text.text, Is.Not.Empty, name);
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

    static class Area1TaskCoroutineExtensions
    {
        public static System.Collections.IEnumerator AsCoroutine(this Task task)
        {
            while (!task.IsCompleted) yield return null;
            if (task.IsFaulted) throw task.Exception;
        }
    }
}
