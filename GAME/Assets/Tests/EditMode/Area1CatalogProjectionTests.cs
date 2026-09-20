using Janseon.Core;
using Janseon.Data.Editor;
using Janseon.Data.Fingerprints;
using Janseon.Data.Repositories;
using Janseon.Data.Validation;
using Janseon.Foundation.Tests.Fixtures;
using NUnit.Framework;
using UnityEditor;

namespace Janseon.Foundation.Tests
{
    public sealed class Area1CatalogProjectionTests
    {
        [Test]
        public void Build_ProjectsSuppliedCampaignAndStationFields()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                var index = GameDataCatalogIndexBuilder.Build(catalog);

                Assert.That(index.CampaignDefinition.BattleRulesVersion,
                    Is.EqualTo(catalog.campaignDefinition.BattleRulesVersion));
                Assert.That(index.CampaignDefinition.PersistentPartyUnitId,
                    Is.EqualTo(catalog.campaignDefinition.PersistentPartyUnitId));
                Assert.That(index.CampaignDefinition.PersistentPartyMaxHp,
                    Is.EqualTo(catalog.campaignDefinition.PersistentPartyMaxHp));
                Assert.That(index.Stations[0].StableId, Is.EqualTo(catalog.stations[0].stableId));
                Assert.That(index.Stations[0].CoreStationId.Value,
                    Is.EqualTo(catalog.stations[0].coreStationId));
                Assert.That(index.Stations[0].NeighborStableIds,
                    Is.EqualTo(catalog.stations[0].neighbors));
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        [Test]
        public void Build_ProjectsSerializedCampaignChangeAndChangesCanonicalFingerprint()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                var baseline = GameDataCatalogIndexBuilder.Build(catalog);
                var baselineFingerprint = CanonicalContentFingerprint.Compute(baseline);
                var serializedCampaign = new SerializedObject(catalog.campaignDefinition);
                var battleRulesVersion = serializedCampaign.FindProperty("battleRulesVersion");
                var expectedBattleRulesVersion = battleRulesVersion.stringValue + "-updated";
                battleRulesVersion.stringValue = expectedBattleRulesVersion;
                serializedCampaign.ApplyModifiedPropertiesWithoutUndo();

                var projected = GameDataCatalogIndexBuilder.Build(catalog);
                var projectedFingerprint = CanonicalContentFingerprint.Compute(projected);
                var repository = new CampaignDefinitionRepository(projected);

                Assert.That(projected.CampaignDefinition.BattleRulesVersion,
                    Is.EqualTo(catalog.campaignDefinition.BattleRulesVersion));
                Assert.That(projected.CampaignDefinition.BattleRulesVersion,
                    Is.EqualTo(expectedBattleRulesVersion));
                Assert.That(repository.BattleRulesVersion, Is.EqualTo(expectedBattleRulesVersion));
                Assert.That(projectedFingerprint, Is.Not.EqualTo(baselineFingerprint));
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        [Test]
        public void Repositories_LookUpProjectedCampaignAndStations()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                var index = GameDataCatalogIndexBuilder.Build(catalog);
                var campaign = new CampaignDefinitionRepository(index);
                var stations = new StationCatalogRepository(index);

                Assert.That(campaign.PersistentPartyUnitId,
                    Is.EqualTo(catalog.campaignDefinition.PersistentPartyUnitId));
                Assert.That(stations.TryGet(catalog.stations[0].stableId, out var station), Is.True);
                Assert.That(station.CoreStationId.Value,
                    Is.EqualTo(catalog.stations[0].coreStationId));
                Assert.That(stations.TryGetByCoreId(
                    new StationId(catalog.stations[1].coreStationId), out var stationByCoreId), Is.True);
                Assert.That(stationByCoreId.StableId, Is.EqualTo(catalog.stations[1].stableId));
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

    }
}
