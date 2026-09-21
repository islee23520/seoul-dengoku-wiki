using System;

using Janseon.Data.Authoring;

using UnityEditor;
using UnityEngine;

namespace Janseon.Data.Editor
{
    public static class GameDataValidationCommand
    {
        private const string CatalogGuidEnvironmentVariable = "JANSEON_GAME_DATA_CATALOG_GUID";

        public static void RunBatchmode()
        {
            string catalogGuid = Environment.GetEnvironmentVariable(CatalogGuidEnvironmentVariable);
            if (string.IsNullOrWhiteSpace(catalogGuid))
            {
                throw new InvalidOperationException(
                    "Required environment variable '" + CatalogGuidEnvironmentVariable + "' is not set.");
            }

            catalogGuid = catalogGuid.Trim();
            if (!GUID.TryParse(catalogGuid, out GUID assetGuid))
            {
                throw new InvalidOperationException(
                    "Environment variable '" + CatalogGuidEnvironmentVariable + "' value '" + catalogGuid +
                    "' is not a valid asset GUID.");
            }

            GameDataCatalogAsset catalog = AssetDatabase.LoadAssetByGUID<GameDataCatalogAsset>(assetGuid);
            if (catalog == null)
            {
                throw new InvalidOperationException(
                    "Asset GUID '" + catalogGuid + "' does not resolve to a GameDataCatalogAsset.");
            }

            Area1GameDataBuilder.Validate(catalog);
        }
    }
}
