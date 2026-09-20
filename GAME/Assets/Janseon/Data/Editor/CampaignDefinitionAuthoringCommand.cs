using System;
using System.IO;
using Janseon.Data.Authoring;
using UnityEditor;
using UnityEngine;

namespace Janseon.Data.Editor
{
    public static class CampaignDefinitionAuthoringCommand
    {
        private const string RequestEnvironmentVariable = "JANSEON_CAMPAIGN_DEFINITION_REQUEST";

        [Serializable]
        private sealed class Request
        {
            public string campaignDefinitionAssetGuid;
            public string gameDataCatalogAssetGuid;
        }

        [MenuItem("Janseon/Data/Apply Campaign Definition Request")]
        public static void ApplyFromEnvironment()
        {
            var requestPath = Environment.GetEnvironmentVariable(RequestEnvironmentVariable);
            if (string.IsNullOrEmpty(requestPath))
            {
                throw new InvalidOperationException(RequestEnvironmentVariable + " must name an external request JSON file.");
            }

            if (!File.Exists(requestPath))
            {
                throw new FileNotFoundException("Campaign definition request was not found.", requestPath);
            }

            var request = JsonUtility.FromJson<Request>(File.ReadAllText(requestPath));
            if (request == null || string.IsNullOrEmpty(request.campaignDefinitionAssetGuid) || string.IsNullOrEmpty(request.gameDataCatalogAssetGuid))
            {
                throw new InvalidOperationException("Campaign definition request must contain campaignDefinitionAssetGuid and gameDataCatalogAssetGuid.");
            }

            if (!GUID.TryParse(request.campaignDefinitionAssetGuid, out var requestedCampaignGuid))
            {
                throw new InvalidOperationException("Campaign definition request campaignDefinitionAssetGuid must be a valid GUID.");
            }

            if (!GUID.TryParse(request.gameDataCatalogAssetGuid, out var requestedCatalogGuid))
            {
                throw new InvalidOperationException("Campaign definition request gameDataCatalogAssetGuid must be a valid GUID.");
            }

            var campaign = AssetDatabase.LoadAssetByGUID<CampaignDefinitionAsset>(requestedCampaignGuid);
            if (campaign == null)
            {
                throw new InvalidOperationException("Campaign definition request campaignDefinitionAssetGuid did not resolve to a CampaignDefinitionAsset.");
            }

            var catalog = AssetDatabase.LoadAssetByGUID<GameDataCatalogAsset>(requestedCatalogGuid);
            if (catalog == null)
            {
                throw new InvalidOperationException("Campaign definition request gameDataCatalogAssetGuid did not resolve to a GameDataCatalogAsset.");
            }

            var catalogSerializedObject = new SerializedObject(catalog);
            SerializedProperty campaignDefinitionProperty = catalogSerializedObject.FindProperty("campaignDefinition");
            if (campaignDefinitionProperty == null)
            {
                throw new InvalidOperationException("Game data catalog campaignDefinition property is missing.");
            }

            campaignDefinitionProperty.objectReferenceValue = campaign;
            catalogSerializedObject.ApplyModifiedPropertiesWithoutUndo();

            EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets();

            var campaignGuid = AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(campaign));
            var catalogGuid = AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(catalog));
            if (catalog.campaignDefinition != campaign ||
                campaignGuid != requestedCampaignGuid.ToString() ||
                catalogGuid != requestedCatalogGuid.ToString())
            {
                throw new InvalidOperationException("Campaign definition authoring verification failed.");
            }

            Debug.Log("Applied campaign definition request: " + requestPath + "; campaignDefinitionAssetGuid=" + campaignGuid + "; gameDataCatalogAssetGuid=" + catalogGuid);
        }

    }
}
