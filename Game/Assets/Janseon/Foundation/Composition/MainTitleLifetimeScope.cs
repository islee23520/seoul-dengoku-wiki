using Janseon.Foundation.UI;
using Janseon.Foundation.Art;
using UnityEngine;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    /// <summary>
    /// Screen child scope for MainTitle. Parent App scope supplies ApplicationFlowCoordinator.
    /// </summary>
    public sealed class MainTitleLifetimeScope : LifetimeScope
    {
        [SerializeField] RuntimeSlotCatalog runtimeSlots;

        protected override void Configure(IContainerBuilder builder)
        {
            if (runtimeSlots == null) throw new System.InvalidOperationException("MainTitle runtime slot catalog missing");
            builder.RegisterInstance<IRuntimeSlotCatalog>(runtimeSlots);
            builder.Register<RuntimeSlotView>(Lifetime.Scoped);
            builder.Register<UiScreenDocumentLease>(Lifetime.Scoped).AsSelf();
            builder.Register<MainTitlePresenter>(Lifetime.Scoped).AsSelf();
            builder.RegisterComponentInHierarchy<MainTitleUiHost>();
        }
    }
}
