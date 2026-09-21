using System;
using System.Collections.Generic;
using System.Linq;
using Janseon.Core;
using Janseon.Core.Data;
using Janseon.Data.Authoring;

namespace Janseon.Data.Validation
{
    public static class GameDataCatalogIndexBuilder
    {
        public static GameDataCatalogIndex Build(GameDataCatalogAsset asset)
        {
            var index = Project(asset);
            GameDataCatalogValidator.Validate(index);
            return index;
        }

        internal static GameDataCatalogIndex Project(GameDataCatalogAsset asset)
        {
            if (asset == null)
            {
                Fail(CatalogValidationReason.MissingReference, "Catalog is null.");
            }

            if (asset.stations == null)
            {
                Fail(CatalogValidationReason.MissingReference, "Stations array is null.");
            }

            if (asset.campaignDefinition == null)
            {
                Fail(CatalogValidationReason.MissingReference, "Campaign definition is missing.");
            }

            var campaignDefinition = new CampaignDefinitionCatalogItem(
                asset.campaignDefinition.BattleRulesVersion,
                asset.campaignDefinition.PersistentPartyUnitId,
                asset.campaignDefinition.PersistentPartyMaxHp);
            var version = new ContentVersionStamp(
                asset.contentSchema,
                asset.contentVersion,
                asset.fingerprintVersion);
            var stations = new List<StationCatalogItem>();

            foreach (var station in asset.stations)
            {
                if (station == null || station.neighbors == null)
                {
                    Fail(CatalogValidationReason.MissingReference, "Station or station neighbors are null.");
                }

                stations.Add(new StationCatalogItem(
                    station.stableId,
                    new StationId(station.coreStationId),
                    station.neighbors));
            }

            return GameDataCatalogIndex.FromProjections(
                campaignDefinition,
                stations.OrderBy(value => value.StableId, StringComparer.Ordinal).ToList(),
                version);
        }

        internal static void Fail(CatalogValidationReason reason, string message)
        {
            throw new CatalogValidationException(reason, message);
        }
    }
}
