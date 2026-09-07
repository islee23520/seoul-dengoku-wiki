using Janseon.Foundation.UI;
using Janseon.Foundation.Art;
using UnityEngine;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class FoundationLifetimeScope : LifetimeScope
    {
        [SerializeField] RuntimeSlotCatalog runtimeSlots;

        protected override void Configure(IContainerBuilder builder)
        {
            if (runtimeSlots == null) throw new System.InvalidOperationException("Foundation runtime slot catalog missing");
            builder.RegisterInstance<IRuntimeSlotCatalog>(runtimeSlots);
            builder.Register<UiScreenDocumentLease>(Lifetime.Scoped).AsSelf();
            builder.Register<GameplayPresenter>(Lifetime.Scoped).AsSelf();
            builder.RegisterComponentInHierarchy<GameplayUiHost>();
            builder.RegisterEntryPoint<PocCoreLoopController>(Lifetime.Scoped).AsSelf();
        }
    }
}
