using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Janseon.Core;

namespace Janseon.Data.Validation
{
    public static class GameDataCatalogValidator
    {
        private static readonly Regex StableId = new Regex(
            "^station\\.[a-z0-9]+(?:[.-][a-z0-9]+)*$",
            RegexOptions.CultureInvariant);

        public static void Validate(GameDataCatalogIndex index)
        {
            if (index == null)
            {
                GameDataCatalogIndexBuilder.Fail(CatalogValidationReason.MissingReference, "Index is null.");
            }

            ValidateCampaignDefinition(index);
            ValidateStations(index);
            ValidateVersion(index);
        }

        private static void ValidateCampaignDefinition(GameDataCatalogIndex index)
        {
            Fail(index.CampaignDefinition != null, CatalogValidationReason.MissingReference, "Campaign definition is missing.");
            Fail(!string.IsNullOrWhiteSpace(index.CampaignDefinition.BattleRulesVersion), CatalogValidationReason.RuleDrift, "Battle rules version is required.");
            Fail(!string.IsNullOrWhiteSpace(index.CampaignDefinition.PersistentPartyUnitId), CatalogValidationReason.RuleDrift, "Persistent party unit ID is required.");
            Fail(index.CampaignDefinition.PersistentPartyMaxHp > 0, CatalogValidationReason.RuleDrift, "Persistent party max HP must be positive.");
        }

        private static void ValidateVersion(GameDataCatalogIndex index)
        {
            Fail(index.Version != null, CatalogValidationReason.UnsupportedContentSchema, "Content version is missing.");
            Fail(index.Version.ContentSchema > 0, CatalogValidationReason.UnsupportedContentSchema, "Content schema must be positive.");
            Fail(!string.IsNullOrEmpty(index.Version.ContentVersion), CatalogValidationReason.UnsupportedContentSchema, "Content version is missing.");
            Fail(!string.IsNullOrEmpty(index.Version.FingerprintVersion), CatalogValidationReason.UnsupportedContentSchema, "Fingerprint version is missing.");
        }

        private static void ValidateIds<T>(IEnumerable<T> values, Func<T, string> id)
        {
            var seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (var value in values)
            {
                var stableId = id(value);
                Fail(!string.IsNullOrEmpty(stableId) && StableId.IsMatch(stableId), CatalogValidationReason.MalformedStableId, stableId);
                Fail(seen.Add(stableId), CatalogValidationReason.DuplicateStableId, stableId);
            }
        }

        private static void ValidateStations(GameDataCatalogIndex index)
        {
            ValidateIds(index.Stations, value => value.StableId);
            var stableIds = new HashSet<string>(index.Stations.Select(value => value.StableId), StringComparer.Ordinal);
            foreach (var station in index.Stations)
            {
                var neighbors = new HashSet<string>(StringComparer.Ordinal);
                foreach (var neighbor in station.NeighborStableIds)
                {
                    Fail(neighbor != station.StableId, CatalogValidationReason.InvalidStationGraph, station.StableId);
                    Fail(neighbors.Add(neighbor), CatalogValidationReason.InvalidStationGraph, station.StableId);
                    Fail(stableIds.Contains(neighbor), CatalogValidationReason.MissingReference, neighbor);
                }
            }
        }

        private static void Fail(bool condition, CatalogValidationReason reason, string detail)
        {
            if (!condition)
            {
                GameDataCatalogIndexBuilder.Fail(reason, detail);
            }
        }
    }
}
