using Janseon.Foundation.AppFlow;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class AppLifetimeScope : LifetimeScope
    {
        protected override void Configure(IContainerBuilder builder)
        {
            builder.Register<UnityFoundationSceneLoader>(Lifetime.Singleton)
                .As<IContentSceneLoader>();
            builder.Register<ApplicationFlowCoordinator>(Lifetime.Singleton);
            builder.RegisterEntryPoint<FoundationStartup>();
        }
    }
}
