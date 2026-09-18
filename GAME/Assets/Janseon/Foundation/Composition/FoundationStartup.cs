using System;
using System.Threading;
using Janseon.Foundation.AppFlow;
using UnityEngine;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class FoundationStartup : IAsyncStartable
    {
        private readonly ApplicationFlowCoordinator coordinator;

        public FoundationStartup(ApplicationFlowCoordinator coordinator)
        {
            this.coordinator = coordinator;
        }

        public async Awaitable StartAsync(CancellationToken cancellation = default)
        {
            TransitionOutcome outcome = await coordinator.OpenMainTitleAsync(cancellation);
            if (outcome.Status == TransitionStatus.Cancelled)
            {
                throw new OperationCanceledException(cancellation);
            }

            if (outcome.Status != TransitionStatus.Completed)
            {
                throw new InvalidOperationException(
                    $"FoundationStartup Failed: transition {outcome.TransitionId}, status {outcome.Status}, rejection {outcome.Rejection}");
            }

            Debug.Log("JANSEON_STARTUP_READY screen=MainTitle");
            if (!Application.isEditor && Debug.isDebugBuild && Application.isBatchMode
                && Array.IndexOf(Environment.GetCommandLineArgs(), "-janseon-smoke") >= 0)
            {
                Application.Quit(0);
            }
        }
    }
}
