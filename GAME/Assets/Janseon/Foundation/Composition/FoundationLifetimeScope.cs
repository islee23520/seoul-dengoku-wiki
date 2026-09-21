using System;
using Janseon.Core.Data;
using Janseon.Data.Authoring;
using Janseon.Data.Fingerprints;
using Janseon.Data.Repositories;
using Janseon.Data.Validation;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Presentation;
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
        [SerializeField] GameDataCatalogAsset gameDataCatalog;
        [SerializeField] Janseon.Foundation.Presentation.StrategyMapAssetCatalog strategyMapAssets;

        protected override void Configure(IContainerBuilder builder)
        {
            if (runtimeSlots == null) throw new System.InvalidOperationException("Foundation runtime slot catalog missing");
            if (gameDataCatalog == null) throw new InvalidOperationException("Foundation game data catalog missing");
            if (strategyMapAssets == null) throw new InvalidOperationException("Foundation strategy map assets missing");
            builder.RegisterInstance(gameDataCatalog);
            builder.Register<GameDataCatalogIndexProvider>(Lifetime.Singleton).AsSelf();
            builder.Register(
                resolver => resolver.Resolve<GameDataCatalogIndexProvider>().Index,
                Lifetime.Singleton);
            builder.Register<StationCatalogRepository>(Lifetime.Singleton).As<IReadOnlyStationCatalog>();
            builder.Register<CampaignDefinitionRepository>(Lifetime.Singleton).As<IReadOnlyCampaignDefinition>();
            builder.Register<ContentFingerprintProvider>(Lifetime.Singleton).As<IContentFingerprint>();
            builder.RegisterInstance<IRuntimeSlotCatalog>(runtimeSlots);
            builder.Register(
                _ => new StrategyMapAssetRepository(strategyMapAssets),
                Lifetime.Singleton)
                .As<IReadOnlyStrategyMapAssetCatalog>();
builder.RegisterComponentInHierarchy<StrategyMapScreen>();
            builder.Register<UiScreenDocumentLease>(Lifetime.Scoped).AsSelf();
            builder.Register<GameplayPresenter>(Lifetime.Scoped).AsSelf();
            builder.RegisterComponentInHierarchy<GameplayUiHost>();
            builder.RegisterComponentInHierarchy<BattleSessionDriverHost>();
            builder.RegisterEntryPoint<PocCoreLoopController>(Lifetime.Scoped).AsSelf();
            builder.Register<BattleSessionDriver>(Lifetime.Scoped).AsSelf();
        }
    }
}
