using Janseon.Data.Fingerprints;
using Janseon.Data.Validation;
using Janseon.Foundation.Tests.Fixtures;
using NUnit.Framework;
using UnityEditor;

namespace Janseon.Foundation.Tests
{
    public sealed class Area1GameDataBuilderTests
    {
        [Test]
        public void CatalogBuild_ValidFixtureProducesIndexWithoutChangingItsFingerprint()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                var before = CanonicalContentFingerprint.Compute(GameDataCatalogIndexBuilder.Build(catalog));

                var index = GameDataCatalogIndexBuilder.Build(catalog);

                var after = CanonicalContentFingerprint.Compute(GameDataCatalogIndexBuilder.Build(catalog));
                Assert.That(index, Is.Not.Null);
                Assert.That(after, Is.EqualTo(before));
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        [Test]
        public void CatalogBuild_SerializedCampaignMutationProjectsExactValueAndChangesFingerprint()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                var baseline = GameDataCatalogIndexBuilder.Build(catalog);
                var baselineFingerprint = CanonicalContentFingerprint.Compute(baseline);
                var campaign = new SerializedObject(catalog.campaignDefinition);
                var battleRulesVersion = campaign.FindProperty("battleRulesVersion");
                var expectedBattleRulesVersion = battleRulesVersion.stringValue + ".mutated";
                battleRulesVersion.stringValue = expectedBattleRulesVersion;
                campaign.ApplyModifiedPropertiesWithoutUndo();
                var sourceBeforeBuilds = EditorJsonUtility.ToJson(catalog.campaignDefinition);

                var projected = GameDataCatalogIndexBuilder.Build(catalog);
                var projectedFingerprint = CanonicalContentFingerprint.Compute(projected);
                var rebuilt = GameDataCatalogIndexBuilder.Build(catalog);

                Assert.That(projected.CampaignDefinition.BattleRulesVersion,
                    Is.EqualTo(catalog.campaignDefinition.BattleRulesVersion));
                Assert.That(projected.CampaignDefinition.BattleRulesVersion,
                    Is.EqualTo(expectedBattleRulesVersion));
                Assert.That(projectedFingerprint, Is.Not.EqualTo(baselineFingerprint));
                Assert.That(CanonicalContentFingerprint.Compute(rebuilt), Is.EqualTo(projectedFingerprint));
                Assert.That(EditorJsonUtility.ToJson(rebuilt), Is.EqualTo(EditorJsonUtility.ToJson(projected)));
                Assert.That(EditorJsonUtility.ToJson(catalog.campaignDefinition), Is.EqualTo(sourceBeforeBuilds));
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        [Test]
        public void CatalogBuild_InvalidFixtureFailsExplicitly()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                catalog.stations[0].neighbors = new[] { "station.missing" };

                var exception = Assert.Throws<CatalogValidationException>(
                    () => GameDataCatalogIndexBuilder.Build(catalog));

                Assert.That(exception.Reason, Is.EqualTo(CatalogValidationReason.MissingReference));
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }
    }
}
