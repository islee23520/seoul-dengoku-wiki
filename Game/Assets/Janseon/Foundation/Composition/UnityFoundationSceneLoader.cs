using System;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using UnityEngine;
using UnityEngine.SceneManagement;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class UnityFoundationSceneLoader : IFoundationSceneLoader
    {
        private readonly LifetimeScope parent;

        public UnityFoundationSceneLoader(LifetimeScope parent)
        {
            this.parent = parent;
        }

        public async Task<IFoundationSceneLease> LoadAsync(CancellationToken cancellationToken)
        {
            using (LifetimeScope.EnqueueParent(parent))
            {
                AsyncOperation operation = SceneManager.LoadSceneAsync(
                    FoundationScenes.Foundation,
                    LoadSceneMode.Additive);
                if (operation == null)
                {
                    throw new InvalidOperationException("Foundation scene load did not start.");
                }

                await AwaitOperationAsync(operation, cancellationToken);
            }

            Scene scene = SceneManager.GetSceneByPath(FoundationScenes.Foundation);
            return new UnityFoundationSceneLease(scene);
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
            TaskCompletionSource<bool> completion =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => completion.TrySetResult(true);
            await completion.Task;
        }

        private sealed class UnityFoundationSceneLease : IFoundationSceneLease
        {
            private Scene scene;

            public UnityFoundationSceneLease(Scene scene)
            {
                this.scene = scene;
                Ready = Task.CompletedTask;
            }

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
                // Fire-and-forget for IDisposable callers; CleanupAsync remains the awaited, authoritative unload path.
            }
        }
    }
}
