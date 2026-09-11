using Janseon.Foundation.AppFlow;
using UnityEngine.EventSystems;
using VContainer;
using VContainer.Unity;

namespace Janseon.Foundation.Composition
{
    public sealed class AppLifetimeScope : LifetimeScope
    {
        protected override void Awake()
        {
            // Input outlives additive content leases, but not the Bootstrap scene.
            gameObject.AddComponent<EventSystem>();
            gameObject.AddComponent<StandaloneInputModule>();
            base.Awake();
        }

        protected override void Configure(IContainerBuilder builder)
        {
            builder.Register<UnityFoundationSceneLoader>(Lifetime.Singleton)
                .As<IContentSceneLoader>();
            builder.Register<ApplicationFlowCoordinator>(Lifetime.Singleton);
            builder.RegisterEntryPoint<FoundationStartup>();
        }
    }
}
