using System;
using Janseon.Foundation.Battle;
using UnityEngine;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Tests
{
    public sealed class Full3dBattleVisualFixtureScope : LifetimeScope
    {
        TemporaryBattleVisualCatalog catalog;
        object injectionTarget;

        public void Initialize(TemporaryBattleVisualCatalog assignedCatalog, object target)
        {
            catalog = assignedCatalog;
            injectionTarget = target;
        }

        protected override void Configure(IContainerBuilder builder)
        {
            if (catalog == null)
                throw new InvalidOperationException("The battle visual fixture requires an explicitly assigned catalog");
            builder.RegisterInstance(catalog);
            builder.RegisterBuildCallback(resolver => resolver.Inject(injectionTarget));
        }
    }
}
