using Janseon.Data.Validation;
using Janseon.Foundation.Tests.Fixtures;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    public sealed class Area1CatalogValidationTests
    {
        [Test]
        public void Build_InvalidCampaignConfigurationFailsValidation()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                catalog.campaignDefinition = null;

                AssertFailure(catalog, CatalogValidationReason.MissingReference);
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        [Test]
        public void Build_DuplicateStableIdsFailsValidation()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                catalog.stations[1].stableId = catalog.stations[0].stableId;

                AssertFailure(catalog, CatalogValidationReason.DuplicateStableId);
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        [Test]
        public void Build_MissingStationNeighborFailsValidation()
        {
            var catalog = TestGameDataCatalog.Create();
            try
            {
                catalog.stations[0].neighbors = new[] { "station.missing" };

                AssertFailure(catalog, CatalogValidationReason.MissingReference);
            }
            finally
            {
                TestGameDataCatalog.Destroy(catalog);
            }
        }

        private static void AssertFailure(
            Janseon.Data.Authoring.GameDataCatalogAsset catalog,
            CatalogValidationReason expectedReason)
        {
            var exception = Assert.Throws<CatalogValidationException>(
                () => GameDataCatalogIndexBuilder.Build(catalog));

            Assert.That(exception.Reason, Is.EqualTo(expectedReason));
        }
    }
}
