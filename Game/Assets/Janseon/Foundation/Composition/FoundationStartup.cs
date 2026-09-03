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
            TransitionOutcome outcome = await coordinator.OpenFoundationAsync(cancellation);
            if (outcome.Status == TransitionStatus.Cancelled)
            {
                throw new OperationCanceledException(cancellation);
            }
            if (outcome.Status != TransitionStatus.Completed)
            {
                throw new InvalidOperationException($"FoundationStartup Failed: transition {outcome.TransitionId}, status {outcome.Status}, rejection {outcome.Rejection}");
            }
        }
    }
}
