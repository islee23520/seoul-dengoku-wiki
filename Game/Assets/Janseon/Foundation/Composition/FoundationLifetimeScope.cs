using Janseon.Foundation.UI;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class FoundationLifetimeScope : LifetimeScope
    {
        protected override void Configure(IContainerBuilder builder)
        {
            builder.Register<UiScreenDocumentLease>(Lifetime.Scoped).AsSelf();
            builder.Register<GameplayPresenter>(Lifetime.Scoped).AsSelf();
            builder.RegisterComponentInHierarchy<GameplayUiHost>();
            builder.RegisterEntryPoint<PocCoreLoopController>(Lifetime.Scoped).AsSelf();
        }
    }
}
