using UnityEngine;

namespace Janseon.Data.Authoring
{
    [CreateAssetMenu(menuName = "Janseon/Data/Game Data Catalog", fileName = "Area1GameDataCatalog")]
    public sealed class GameDataCatalogAsset : ScriptableObject
    {
        public int contentSchema;
        public string contentVersion;
        public string fingerprintVersion;
        public CampaignDefinitionAsset campaignDefinition;
        public StationDefinitionAsset[] stations;
    }
}
