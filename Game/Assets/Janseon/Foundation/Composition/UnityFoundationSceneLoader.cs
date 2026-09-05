using System;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.UI;
using UnityEngine;
using UnityEngine.SceneManagement;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class UnityFoundationSceneLoader : IContentSceneLoader
    {
        private readonly LifetimeScope parent;

        public UnityFoundationSceneLoader(LifetimeScope parent)
        {
            this.parent = parent;
        }

        public async Task<IContentSceneLease> LoadAsync(
            ContentScreenId screen,
            CancellationToken cancellationToken)
        {
            string path = FoundationScenes.PathFor(screen);

            using (LifetimeScope.EnqueueParent(parent))
            {
                AsyncOperation operation = SceneManager.LoadSceneAsync(path, LoadSceneMode.Additive);
                if (operation == null)
                {
                    throw new InvalidOperationException($"{screen} scene load did not start.");
                }

                await AwaitOperationAsync(operation, cancellationToken);
            }

            Scene scene = SceneManager.GetSceneByPath(path);
            if (!scene.IsValid() || !scene.isLoaded)
            {
                throw new InvalidOperationException($"{screen} scene was not loaded at {path}.");
            }

            IScreenReadiness readiness = FindReadiness(scene);
            Task readyTask = readiness != null ? readiness.Ready : Task.CompletedTask;
            return new UnityContentSceneLease(scene, screen, readyTask);
        }

        private static IScreenReadiness FindReadiness(Scene scene)
        {
            GameObject[] roots = scene.GetRootGameObjects();
            for (int i = 0; i < roots.Length; i++)
            {
                MonoBehaviour[] behaviours = roots[i].GetComponentsInChildren<MonoBehaviour>(true);
                for (int b = 0; b < behaviours.Length; b++)
                {
                    if (behaviours[b] is IScreenReadiness readiness)
                    {
                        return readiness;
                    }
                }
            }

            return null;
        }

        private static Task AwaitOperationAsync(
            AsyncOperation operation,
            CancellationToken cancellationToken)
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

        private static async Task AwaitUnloadAsync(AsyncOperation operation)
        {
            if (operation == null)
            {
                return;
            }

            TaskCompletionSource<bool> completion =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => completion.TrySetResult(true);
            await completion.Task;
        }

        private sealed class UnityContentSceneLease : IContentSceneLease
        {
            private Scene scene;

            public UnityContentSceneLease(Scene scene, ContentScreenId screen, Task ready)
            {
                this.scene = scene;
                Screen = screen;
                Ready = ready ?? Task.CompletedTask;
            }

            public ContentScreenId Screen { get; }
            public Task Ready { get; }

            public async Task CleanupAsync()
            {
                if (!scene.IsValid() || !scene.isLoaded)
                {
                    return;
                }

                AsyncOperation op = SceneManager.UnloadSceneAsync(scene);
                await AwaitUnloadAsync(op);
                scene = default;
            }

            public void Dispose()
            {
                if (!scene.IsValid() || !scene.isLoaded)
                {
                    return;
                }

                SceneManager.UnloadSceneAsync(scene);
                scene = default;
            }
        }
    }
}
