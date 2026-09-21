using System.Collections.Generic;
using System.Collections.ObjectModel;
using Janseon.Core.Data;

namespace Janseon.Data.Validation
{
    public sealed class GameDataCatalogIndex
    {
        public CampaignDefinitionCatalogItem CampaignDefinition { get; }
        public IReadOnlyList<StationCatalogItem> Stations { get; }
        public ContentVersionStamp Version { get; }

        internal GameDataCatalogIndex(
            CampaignDefinitionCatalogItem campaignDefinition,
            List<StationCatalogItem> stations,
            ContentVersionStamp version)
        {
            CampaignDefinition = campaignDefinition;
            Stations = new ReadOnlyCollection<StationCatalogItem>(stations);
            Version = version;
        }

        internal static GameDataCatalogIndex FromProjections(
            CampaignDefinitionCatalogItem campaignDefinition,
            List<StationCatalogItem> stations,
            ContentVersionStamp version)
        {
            return new GameDataCatalogIndex(campaignDefinition, stations, version);
        }
    }
}
