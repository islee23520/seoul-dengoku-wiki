using System;
using Janseon.Core.Data;
using Janseon.Data.Authoring;
using Janseon.Data.Fingerprints;
using Janseon.Data.Repositories;
using Janseon.Data.Validation;
using Janseon.Foundation.Battle;
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
            GameDataCatalogIndex index = GameDataCatalogIndexBuilder.Build(gameDataCatalog);
            builder.RegisterInstance(index);
            builder.Register<CardCatalogRepository>(Lifetime.Singleton).As<IReadOnlyCardCatalog>();
            builder.Register<UnitRoleCatalogRepository>(Lifetime.Singleton).As<IReadOnlyUnitRoleCatalog>();
            builder.Register<FormationCatalogRepository>(Lifetime.Singleton).As<IReadOnlyFormationCatalog>();
            builder.Register<StationCatalogRepository>(Lifetime.Singleton).As<IReadOnlyStationCatalog>();
            builder.Register<ContentFingerprintProvider>(Lifetime.Singleton).As<IContentFingerprint>();
            builder.RegisterInstance<IRuntimeSlotCatalog>(runtimeSlots);
            if (strategyMapAssets != null)
            {
                builder.RegisterInstance(strategyMapAssets);
            }
            builder.Register<UiScreenDocumentLease>(Lifetime.Scoped).AsSelf();
            builder.Register<GameplayPresenter>(Lifetime.Scoped).AsSelf();
            builder.RegisterComponentInHierarchy<GameplayUiHost>();
            builder.RegisterComponentInHierarchy<BattleSessionDriverHost>();
            builder.RegisterEntryPoint<PocCoreLoopController>(Lifetime.Scoped).AsSelf();
            builder.Register<BattleSessionDriver>(Lifetime.Scoped).AsSelf();
        }
    }
}
