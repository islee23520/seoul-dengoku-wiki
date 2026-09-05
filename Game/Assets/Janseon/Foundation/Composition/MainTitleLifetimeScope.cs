using Janseon.Foundation.UI;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    /// <summary>
    /// Screen child scope for MainTitle. Parent App scope supplies ApplicationFlowCoordinator.
    /// </summary>
    public sealed class MainTitleLifetimeScope : LifetimeScope
    {
        protected override void Configure(IContainerBuilder builder)
        {
            builder.Register<UiScreenDocumentLease>(Lifetime.Scoped).AsSelf();
            builder.Register<MainTitlePresenter>(Lifetime.Scoped).AsSelf();
            builder.RegisterComponentInHierarchy<MainTitleUiHost>();
        }
    }
}
