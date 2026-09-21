using Janseon.Data.Authoring;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Tests.Fixtures
{
    public static class TestGameDataCatalog
    {
        public static GameDataCatalogAsset Create()
        {
            var catalog = ScriptableObject.CreateInstance<GameDataCatalogAsset>();
            catalog.contentSchema = 1;
            catalog.contentVersion = "test-content";
            catalog.fingerprintVersion = "test-fingerprint";
            catalog.campaignDefinition = ScriptableObject.CreateInstance<CampaignDefinitionAsset>();
            var campaignSerializedObject = new SerializedObject(catalog.campaignDefinition);
            campaignSerializedObject.FindProperty("battleRulesVersion").stringValue = "test-rules";
            campaignSerializedObject.FindProperty("persistentPartyUnitId").stringValue = "unit.test-party";
            campaignSerializedObject.FindProperty("persistentPartyMaxHp").intValue = 100;
            campaignSerializedObject.ApplyModifiedPropertiesWithoutUndo();

            var firstStation = ScriptableObject.CreateInstance<StationDefinitionAsset>();
            firstStation.stableId = "station.test-a";
            firstStation.coreStationId = "TestA";
            firstStation.neighbors = new[] { "station.test-b" };

            var secondStation = ScriptableObject.CreateInstance<StationDefinitionAsset>();
            secondStation.stableId = "station.test-b";
            secondStation.coreStationId = "TestB";
            secondStation.neighbors = new[] { "station.test-a" };

            catalog.stations = new[] { firstStation, secondStation };
            return catalog;
        }

        public static void Destroy(GameDataCatalogAsset catalog)
        {
            if (catalog == null)
            {
                return;
            }

            DestroyObject(catalog.campaignDefinition);
            foreach (var station in catalog.stations)
            {
                DestroyObject(station);
            }

            DestroyObject(catalog);
        }

        private static void DestroyObject(Object value)
        {
            if (value != null)
            {
                Object.DestroyImmediate(value);
            }
        }
    }
}
